from itertools import chain
from typing import Annotated

from fastapi import APIRouter, Depends, status

from .. import routes
from ..dependencies import DockerClients, get_docker_clients
from ..schemas import DockerStack, DockerStackRootModel, GetStatsResponse
from ..settings import AppSettings, get_app_settings
from .regctl import router as regctl_router
from .stacks import router as stacks_router

__all__ = [
    "router",
]

app_settings = get_app_settings()
router = APIRouter()

router.include_router(stacks_router, tags=['Stacks'], prefix='/stacks')
router.include_router(regctl_router, tags=['Regctl'], prefix='/regctl')


@router.get('',
            include_in_schema=False,
            status_code=status.HTTP_418_IM_A_TEAPOT)
async def root():
    return {'message': 'This is not the endpoint you are looking for'}


@router.get('/settings', tags=['Misc'], response_model=AppSettings)
async def get_settings():
    return app_settings


@router.get('/stats', tags=['Misc'], response_model=GetStatsResponse)
async def get_stats(docker_clients: Annotated[DockerClients, Depends(get_docker_clients)],
                    no_cache: bool = False):
    _stacks = await routes.stacks.list_compose_stacks(
        docker_clients=docker_clients,
        no_cache=no_cache,
    )
    stacks = DockerStackRootModel.model_validate(_stacks)

    num_of_services_with_updates = 0
    num_of_stacks_with_updates = 0
    num_of_stacks = len(stacks)
    num_of_services = len(
        list(chain.from_iterable(
            stack.services
            for stack in stacks
        ))
    )

    stack: DockerStack
    for stack in stacks:
        num_of_stacks_with_updates += int(stack.has_updates)
        for service in stack.services:
            num_of_services_with_updates += int(service.has_updates)

    return GetStatsResponse(
        num_of_services_with_updates=num_of_services_with_updates,
        num_of_services=num_of_services,
        num_of_stacks_with_updates=num_of_stacks_with_updates,
        num_of_stacks=num_of_stacks,
    )
