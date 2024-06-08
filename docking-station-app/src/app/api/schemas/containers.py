from datetime import datetime, timedelta

from pydantic import computed_field, field_serializer

from ..settings import get_app_settings
from .common import AliasedBaseModel
from .images import DockerImage

__all__ = [
    'DockerContainer',
    'DockerContainerPort',
    'DockerContainerResponse',
]

app_settings = get_app_settings()


class DockerContainerPort(AliasedBaseModel):
    host_ip: str
    host_port: int


class DockerContainer(AliasedBaseModel):
    id: str
    created_at: datetime
    uptime: str | timedelta
    image: DockerImage
    labels: dict[str, str]
    name: str
    ports: dict[str, list[DockerContainerPort] | None]
    status: str

    @field_serializer('uptime')
    def serialize_uptime(self, value: str | timedelta):
        if isinstance(value, str):
            return value

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
        return self.labels.get(app_settings.server.ignore_label_field_name, False)

    @computed_field
    @property
    def homepage_url(self) -> str:
        for label in app_settings.server.possible_homepage_labels:
            if url := self.labels.get(label, None):
                return url

        if self.image.image_name.startswith('ghcr.io'):
            image_name = self.image.image_name.removeprefix('ghcr.io/')
            return f'http://github.com/{image_name}'

        return f'http://hub.docker.com/r/{self.image.image_name}'

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
