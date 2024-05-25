from fastapi import APIRouter, HTTPException
from fastapi_cache.decorator import cache

from ..schemas import DockerContainerResponse
from ..services import docker as docker_services
from ..settings import AppSettings

app_settings = AppSettings()
__all__ = [
    'router',
]

router = APIRouter(tags=['Containers'])


@router.get('', response_model=list[DockerContainerResponse])
@cache(expire=app_settings.server.cache_control_max_age_seconds)
async def list_containers():
    return await docker_services.list_containers()


@router.get('/{container_id}', response_model=DockerContainerResponse)
@cache(expire=app_settings.server.cache_control_max_age_seconds)
async def get_container(container_id: str):
    try:
        return await docker_services.get_container(container_id)

    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f'Container {container_id[:12]!r} not found'
        )
