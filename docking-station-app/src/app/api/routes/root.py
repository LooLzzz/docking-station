from fastapi import APIRouter, status

from .stacks import router as stacks_router
from .containers import router as containers_router
from .images import router as images_router

__all__ = [
    'router',
]

router = APIRouter()

router.include_router(containers_router, prefix='/containers')
router.include_router(images_router, prefix='/images')
router.include_router(stacks_router, prefix='/stacks')


@router.get('',
            include_in_schema=False,
            status_code=status.HTTP_418_IM_A_TEAPOT)
async def read_root():
    return {'message': 'This is not the API you are looking for'}
