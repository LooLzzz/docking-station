from fastapi import APIRouter
from fastapi_cache.decorator import cache

from ..schemas import DockerImageResponse
from ..services import docker as docker_services
from ..settings import AppSettings

app_settings = AppSettings()
__all__ = [
    'router',
]

router = APIRouter(tags=['Images'])


@router.get('', response_model=list[DockerImageResponse])
@cache(expire=app_settings.server.cache_control_max_age_seconds)
async def list_images():
    return await docker_services.list_images()
