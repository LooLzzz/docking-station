from fastapi import APIRouter

from ..schemas import DockerContainerResponse
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Containers'])


@router.get('/', response_model=list[DockerContainerResponse])
async def list_containers():
    return await docker_services.list_containers()
