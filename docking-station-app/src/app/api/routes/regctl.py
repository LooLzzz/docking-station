from logging import getLogger

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from ..schemas import RegctlImageInspect
from ..services import regctl as regctl_services
from ..settings import get_app_settings

__all__ = [
    'router',
]

logger = getLogger(__name__)
app_settings = get_app_settings()
router = APIRouter()


@router.get('/digest', response_class=PlainTextResponse)
async def get_image_remote_digest(tag: str, no_cache: bool = False):
    return await regctl_services.get_image_remote_digest(
        repo_tag=tag,
        no_cache=no_cache,
        reraise=True,
    )


@router.get('/inspect', response_model=RegctlImageInspect)
async def get_image_inspect(tag: str, no_cache: bool = False):
    return await regctl_services.get_image_inspect(
        repo_tag=tag,
        no_cache=no_cache,
        reraise=True,
    )
