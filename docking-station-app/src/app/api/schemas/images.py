from datetime import datetime

from pydantic import Field, computed_field

from .common import AliasedBaseModel

__all__ = [
    'DockerImage',
    'DockerImageResponse',
]


class DockerImage(AliasedBaseModel):
    id: str
    created_at: datetime
    has_updates: bool
    repo_local_digest: str | None
    repo_remote_digest: str | None
    repo_tag: str

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
