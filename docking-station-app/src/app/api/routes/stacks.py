import asyncio
from logging import getLogger

from fastapi import APIRouter, WebSocket
from fastapi.exceptions import HTTPException
from fastapi_cache import FastAPICache
from starlette.websockets import WebSocketDisconnect

from ..schemas import (DockerContainerResponse, DockerStackResponse,
                       DockerStackUpdateRequest, DockerStackUpdateResponse)
from ..services import docker as docker_services
from ..settings import cache_key_builder, cached, get_app_settings

__all__ = [
    'router',
]

logger = getLogger(__name__)
app_settings = get_app_settings()
router = APIRouter()


@router.get('', tags=['[GET] Stacks'], response_model=list[DockerStackResponse])
@cached(expire=app_settings.server.cache_control_max_age_seconds)
async def list_compose_stacks(no_cache: bool = False, include_stopped: bool = False):
    return await docker_services.list_compose_stacks(
        no_cache=no_cache,
        include_stopped=include_stopped,
    )


@router.get('/{stack}', tags=['[GET] Stacks'], response_model=DockerStackResponse)
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


@router.get('/{stack}/{service}', tags=['[GET] Stacks'], response_model=DockerContainerResponse)
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


@router.post('/{stack}/{service}', tags=['[UPDATE] Stacks'], response_model=DockerStackUpdateResponse)
async def update_compose_stack_service(stack: str,
                                       service: str,
                                       request_body: DockerStackUpdateRequest = None):
    request_body = request_body or DockerStackUpdateRequest()
    resp = await docker_services.update_compose_stack(
        stack_name=stack,
        service_name=service,
        infer_envfile=request_body.infer_envfile,
        restart_containers=request_body.restart_containers,
        prune_images=request_body.prune_images,
    )

    cache_backend = FastAPICache.get_backend()
    key, *_ = cache_key_builder(list_compose_stacks).split('(', 1)
    await cache_backend.clear(namespace=key)
    return resp


@router.websocket('/{stack}/{service}/ws')
async def update_compose_stack_service(stack: str,
                                       service: str,
                                       websocket: WebSocket):
    exc = None

    try:
        await websocket.accept()
        request_body = DockerStackUpdateRequest.model_validate(
            await websocket.receive_json()
        )

        task_thread, message_queue = docker_services.update_compose_stack_ws(
            stack_name=stack,
            service_name=service,
            infer_envfile=request_body.infer_envfile,
            restart_containers=request_body.restart_containers,
            prune_images=request_body.prune_images,
        )

        while True:
            try:
                message = message_queue.get_nowait()
                await websocket.send_json(message)
            except asyncio.QueueEmpty:
                if not task_thread.is_alive():
                    task_thread.join()  # re-raise any exceptions from the task
                    break
            await asyncio.sleep(0.01)

    except WebSocketDisconnect:
        """ignore"""

    except Exception as _exc:
        logger.exception('Error in websocket handler')
        exc = _exc

    if exc:
        await websocket.close(
            code=1011,
            reason=str(exc),
        )
    else:
        await websocket.close()

    cache_backend = FastAPICache.get_backend()
    key, *_ = cache_key_builder(list_compose_stacks).split('(', 1)
    await cache_backend.clear(namespace=key)
