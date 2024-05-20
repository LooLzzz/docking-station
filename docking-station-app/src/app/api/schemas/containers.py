from datetime import datetime

from pydantic import computed_field

from .common import AliasedBaseModel
from .images import DockerImage

__all__ = [
    'DockerContainer',
    'DockerContainerPort',
    'DockerContainerResponse',
]


class DockerContainerPort(AliasedBaseModel):
    host_ip: str
    host_port: int


class DockerContainer(AliasedBaseModel):
    id: str
    created_at: datetime
    image: DockerImage
    labels: dict[str, str]
    name: str
    ports: dict[str, list[DockerContainerPort] | None]
    status: str

    @computed_field
    @property
    def has_updates(self) -> bool:
        return self.image.has_updates


class DockerContainerResponse(DockerContainer):
    """Alias for `DockerContainer`"""
