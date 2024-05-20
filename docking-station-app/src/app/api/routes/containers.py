from fastapi import APIRouter, HTTPException

from ..schemas import DockerContainerResponse
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Containers'])


@router.get('/', response_model=list[DockerContainerResponse])
async def list_containers():
    return await docker_services.list_containers()


@router.get('/{container_id}', response_model=DockerContainerResponse)
async def get_container(container_id: str):
    try:
        return await docker_services.get_container(container_id)

    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f'Container {container_id[:12]!r} not found'
        )
