from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from ..schemas import (DockerContainerResponse, DockerStackResponse,
                       DockerStackUpdateRequest, DockerStackUpdateResponse)
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Stacks'])


@router.get('/', response_model=list[DockerStackResponse])
async def list_compose_stacks():
    return await docker_services.list_compose_stacks()


@router.get('/{stack}', response_model=DockerStackResponse)
async def get_compose_stack(stack: str):
    try:
        return await docker_services.get_compose_stack(
            stack_name=stack,
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack!r} not found',
        ) from exc


@router.get('/{stack}/{service}', response_model=DockerContainerResponse)
async def get_compose_service_container(stack: str, service: str):
    try:
        return await docker_services.get_compose_service_container(
            stack_name=stack,
            service_name=service,
        )

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Compose stack service '{stack}/{service}' not found",
        ) from exc


@router.post('/{stack}', response_model=DockerStackUpdateResponse)
async def update_compose_stack(stack: str,
                               request: DockerStackUpdateRequest = None):
    request = request or DockerStackUpdateRequest()
    return await docker_services.update_compose_stack(
        stack_name=stack,
        service_name=None,
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
        stack_name=stack,
        service_name=service,
        infer_envfile=request.infer_envfile,
        restart_containers=request.restart_containers,
        prune_images=request.prune_images,
    )
