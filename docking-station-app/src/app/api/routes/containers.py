from fastapi import APIRouter

from ..schemas import ListContainersResponseItem
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Containers'])


@router.get('/', response_model=list[ListContainersResponseItem])
async def list_containers():
    containers = await docker_services.list_containers()
    return [
        {
            'id': item.id,
            'name': item.name,
            'image': item.image,
            'ports': item.network_settings.ports,
            'labels': item.config.labels,
        }
        for item in containers
    ]
