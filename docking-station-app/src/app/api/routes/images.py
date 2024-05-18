from fastapi import APIRouter

from ..schemas import ListImagesResponseItem
from ..services import docker as docker_services

__all__ = [
    'router',
]

router = APIRouter(tags=['Images'])


@router.get('/', response_model=list[ListImagesResponseItem])
async def list_images():
    images = await docker_services.list_images()
    return [
        {
            'id': item.id,
            'repo_tags': item.repo_tags,
            'repo_digests': item.repo_digests,
            'created_at': item.created,
        }
        for item in images
    ]
