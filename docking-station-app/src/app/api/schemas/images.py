from datetime import datetime

from pydantic import computed_field

from ..settings import get_app_settings
from .common import AliasedBaseModel

__all__ = [
    'DockerImage',
    'DockerImageResponse',
]

app_settings = get_app_settings()


class DockerImage(AliasedBaseModel):
    id: str
    created_at: datetime
    latest_update: datetime
    latest_version: str | None = None
    repo_local_digest: str | None
    repo_tag: str
    version: str | None = None

    @computed_field
    @property
    def has_updates(self) -> bool:
        return self.latest_update != self.created_at

    @computed_field
    @property
    def image_name(self) -> str:
        return self.repo_tag.split(':', 1)[0]

    @computed_field
    @property
    def image_tag(self) -> str:
        return self.repo_tag.split(':', 1)[1]


class DockerImageResponse(AliasedBaseModel):
    """Alias for `DockerImage`"""
