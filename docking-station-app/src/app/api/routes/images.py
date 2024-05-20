from fastapi import APIRouter

from ..schemas import DockerImageResponse
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Images'])


@router.get('/', response_model=list[DockerImageResponse])
async def list_images():
    return await docker_services.list_images()
