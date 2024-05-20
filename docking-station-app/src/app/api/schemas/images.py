from datetime import datetime

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


class DockerImageResponse(AliasedBaseModel):
    """Alias for `DockerImage`"""
