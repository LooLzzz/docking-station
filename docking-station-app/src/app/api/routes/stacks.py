from fastapi import APIRouter

from ..schemas import ListStacksResponseItem, UpdateComposeStackRequest
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Stacks'])


@router.get('/', response_model=list[ListStacksResponseItem])
async def list_compose_stacks():
    return await docker_services.list_compose_stacks()


@router.get('/{stack}', response_model=ListStacksResponseItem | dict)
async def get_compose_stack(stack: str):
    return await docker_services.get_compose_stacks(
        stack=stack,
    )


# TODO: response model
@router.post('/{stack}')
async def update_compose_stack(stack: str,
                               request: UpdateComposeStackRequest):
    return await docker_services.update_compose_stack(
        stack=stack,
        service=None,
        infer_envfile=request.infer_envfile,
        restart_containers=request.restart_containers,
        prune_images=request.prune_images,
    )


# TODO: response model
@router.post('/{stack}/{service}')
async def update_compose_stack_service(stack: str,
                                       service: str,
                                       request: UpdateComposeStackRequest):
    return await docker_services.update_compose_stack(
        stack=stack,
        service=service,
        infer_envfile=request.infer_envfile,
        restart_containers=request.restart_containers,
        prune_images=request.prune_images,
    )
