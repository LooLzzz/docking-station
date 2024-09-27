import asyncio
from logging import getLogger
from threading import Thread

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi_cache import FastAPICache

from ..schemas import (DockerContainerResponse, DockerStackBatchUpdateRequest,
                       DockerStackResponse, DockerStackUpdateRequest,
                       MessageDict)
from ..services import docker as docker_services
from ..settings import cache_key_builder, cached, get_app_settings
from ..task_store import StoreKey, TaskStore, TaskStoreItem

__all__ = [
    'router',
]

logger = getLogger(__name__)
app_settings = get_app_settings()
router = APIRouter()
task_store = TaskStore()


@router.get('', response_model=list[DockerStackResponse])
@cached(expire=app_settings.server.cache_control_max_age_seconds)
async def list_compose_stacks(no_cache: bool = False, include_stopped: bool = False):
    return await docker_services.list_compose_stacks(
        no_cache=no_cache,
        include_stopped=include_stopped,
    )


@router.get('/{stack}', response_model=DockerStackResponse)
async def get_compose_stack(stack: str, no_cache: bool = False):
    try:
        return await docker_services.get_compose_stack(
            stack_name=stack,
            no_cache=no_cache,
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack!r} not found',
        ) from exc


@router.get('/{stack}/{service}', response_model=DockerContainerResponse)
async def get_compose_service_container(stack: str, service: str, no_cache: bool = False):
    try:
        return await docker_services.get_compose_service_container(
            stack_name=stack,
            service_name=service,
            no_cache=no_cache,
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Compose stack service '{stack}/{service}' not found",
        ) from exc


@router.post('/{stack}/{service}/task')
async def create_compose_stack_service_update_task(stack: str, service: str, request_body: DockerStackUpdateRequest):
    return await create_compose_batch_update_task(
        DockerStackBatchUpdateRequest(
            services=[f'{stack}/{service}'],
            **request_body.model_dump(by_alias=False),
        )
    )


@router.post('/batch_update')
async def create_compose_batch_update_task(request_body: DockerStackBatchUpdateRequest):

    def _acc_messages_task(task: TaskStoreItem,
                           message_queue: asyncio.Queue[MessageDict],
                           main_worker: Thread):
        while True:
            try:
                task.append_message(
                    message_queue.get_nowait()
                )
            except asyncio.QueueEmpty:
                if not main_worker.is_alive() and message_queue.empty():
                    break

        main_worker.join()  # re-raise any exceptions from the main worker

    for stack, services in request_body.stack_services.items():
        skip = False
        for service in services:
            if (stack, service) in task_store:
                skip = True
                break
        if skip:
            continue

        main_worker, queue = docker_services.update_compose_stack_ws(
            stack_name=stack,
            services=services,
            infer_envfile=request_body.infer_envfile,
            restart_containers=request_body.restart_containers,
            prune_images=request_body.prune_images,
        )

        task = TaskStoreItem()
        acc_worker = Thread(target=_acc_messages_task, args=[task, queue, main_worker], daemon=True)
        task.worker = acc_worker
        acc_worker.start()

        for service in services:
            task_store[(stack, service)] = task

    return {}


@router.get('/{stack}/{service}/task')
async def poll_compose_stack_service_update_task(stack: str,
                                                 service: str,
                                                 offset: int | None = None):
    key: StoreKey = (stack, service)

    try:
        if not (task := task_store.get(key, None)):
            return JSONResponse(
                content={'detail': f"Compose stack service task '{stack}/{service}' not found"},
                status_code=404,
            )

        if not task.is_worker_alive():
            cache_backend = FastAPICache.get_backend()
            cache_key, *_ = cache_key_builder(list_compose_stacks).split('(', 1)
            await cache_backend.clear(namespace=cache_key)

            task.join()  # re-raise any exceptions from the task

    except Exception as _exc:
        """ exception handling for 'task.join()' """
        logger.exception("Error occurred while polling task thread for '%s/%s'", stack, service)
        raise

    return task.messages[offset:]
