from itertools import chain

from fastapi import APIRouter, status

from .. import routes
from ..schemas import DockerStack, DockerStackRootModel, GetStatsResponse
from ..settings import AppSettings
from .containers import router as containers_router
from .images import router as images_router
from .stacks import router as stacks_router

__all__ = [
    'router',
]

app_settings = AppSettings()
router = APIRouter()

router.include_router(containers_router, prefix='/containers')
router.include_router(images_router, prefix='/images')
router.include_router(stacks_router, prefix='/stacks')


@router.get('',
            include_in_schema=False,
            status_code=status.HTTP_418_IM_A_TEAPOT)
async def root():
    return {'message': 'This is not the endpoint you are looking for'}


@router.get('/stats', tags=['Stats'], response_model=GetStatsResponse)
async def get_stats():
    _stacks = await routes.stacks.list_compose_stacks()
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
