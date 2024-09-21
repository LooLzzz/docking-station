import asyncio
from logging import getLogger
from threading import Thread

from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi_cache import FastAPICache

from ..schemas import (DockerContainerResponse, DockerStackResponse,
                       DockerStackUpdateRequest, MessageDict,
                       MessageDictResponse,
                       StartComposeStackServiceUpdateTaskResponse)
from ..services import docker as docker_services
from ..settings import cache_key_builder, cached, get_app_settings

__all__ = [
    'router',
]

logger = getLogger(__name__)
app_settings = get_app_settings()
router = APIRouter()
task_store: dict[tuple[str, str], tuple[Thread, asyncio.Queue[MessageDict]]] = {}


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


@router.post('/{stack}/{service}/task', response_model=StartComposeStackServiceUpdateTaskResponse)
async def create_compose_stack_service_update_task(stack: str, service: str, request_body: DockerStackUpdateRequest):
    task_thread, message_queue = docker_services.update_compose_stack_ws(
        stack_name=stack,
        service_name=service,
        infer_envfile=request_body.infer_envfile,
        restart_containers=request_body.restart_containers,
        prune_images=request_body.prune_images,
    )

    if is_new_task := (stack, service) not in task_store:
        task_store[(stack, service)] = (task_thread, message_queue)

    return StartComposeStackServiceUpdateTaskResponse(
        task_id=f'{stack}/{service}',
        created=is_new_task,
    )


@router.get('/{stack}/{service}/task', response_model=list[MessageDictResponse])
async def poll_compose_stack_service_update_task(stack: str, service: str):
    if (stack, service) not in task_store:
        return []

    task_thread, message_queue = task_store[(stack, service)]
    res: list[MessageDict] = []

    try:
        while True:
            res.append(
                message_queue.get_nowait()
            )

    except asyncio.QueueEmpty:
        if not task_thread.is_alive():
            del task_store[(stack, service)]
            cache_backend = FastAPICache.get_backend()
            key, *_ = cache_key_builder(list_compose_stacks).split('(', 1)
            await cache_backend.clear(namespace=key)

            task_thread.join()  # re-raise any exceptions from the task

    return res
