from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from ..schemas import (DockerStackResponse, DockerStackUpdateRequest,
                       DockerStackUpdateResponse)
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Stacks'])


@router.get('/', response_model=list[DockerStackResponse])
async def list_compose_stacks():
    return await docker_services.list_compose_stacks()


@router.get('/{stack}', response_model=DockerStackResponse | dict)
async def get_compose_stack(stack: str):
    try:
        return await docker_services.get_compose_stack(
            stack=stack,
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack!r} not found',
        ) from exc


@router.post('/{stack}', response_model=DockerStackUpdateResponse)
async def update_compose_stack(stack: str,
                               request: DockerStackUpdateRequest = None):
    request = request or DockerStackUpdateRequest()
    return await docker_services.update_compose_stack(
        stack=stack,
        service=None,
        infer_envfile=request.infer_envfile,
        restart_containers=request.restart_containers,
        prune_images=request.prune_images,
    )


@router.post('/{stack}/{service}', response_model=DockerStackUpdateResponse)
async def update_compose_stack_service(stack: str,
                                       service: str,
                                       request: DockerStackUpdateRequest = None):
    request = request or DockerStackUpdateRequest()
    return await docker_services.update_compose_stack(
        stack=stack,
        service=service,
        infer_envfile=request.infer_envfile,
        restart_containers=request.restart_containers,
        prune_images=request.prune_images,
    )
