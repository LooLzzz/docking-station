from datetime import datetime, timedelta

from pydantic import computed_field, field_serializer

from ..consts import DOCKINGSTATION_LABEL__IGNORE
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
    uptime: timedelta
    image: DockerImage
    labels: dict[str, str]
    name: str
    ports: dict[str, list[DockerContainerPort] | None]
    status: str

    @field_serializer('uptime')
    def serialize_uptime(self, value: timedelta):
        if value.days:
            plural = 's' if value.days > 1 else ''
            return f'Up {value.days} day{plural}'

        if hours := value.seconds // 3600:
            plural = 's' if hours > 1 else ''
            return f'Up {value.seconds // 3600} hour{plural}'

        if minutes := value.seconds // 60:
            plural = 's' if minutes > 1 else ''
            return f'Up {value.seconds // 60} minute{plural}'

        plural = 's' if value.seconds > 1 else ''
        return f'Up {value.seconds} second{plural}'

    @property
    def dockingstation_ignore(self):
        return self.labels.get(DOCKINGSTATION_LABEL__IGNORE, False)

    @computed_field
    @property
    def has_updates(self) -> bool:
        return self.image.has_updates

    @computed_field
    @property
    def stack_name(self) -> str | None:
        return self.labels.get('com.docker.compose.project', None)

    @computed_field
    @property
    def service_name(self) -> str | None:
        return self.labels.get('com.docker.compose.service', None)


class DockerContainerResponse(DockerContainer):
    """Alias for `DockerContainer`"""
