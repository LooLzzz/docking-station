from pathlib import Path

from pydantic import Field, computed_field

from .common import AliasedBaseModel, CamelCaseAliasedBaseModel
from .containers import DockerContainer

__all__ = [
    'DockerStack',
    'DockerStackResponse',
    'DockerStackUpdateRequest',
    'DockerStackUpdateResponse',
]


class DockerStack(AliasedBaseModel):
    name: str
    created: int = 0
    dead: int = 0
    exited: int = 0
    paused: int = 0
    restarting: int = 0
    running: int = 0
    config_files: list[Path] = Field(default_factory=list)
    services: list[DockerContainer] = Field(default_factory=list)

    @computed_field
    @property
    def has_updates(self) -> bool:
        return any(
            item.image.has_updates
            for item in self.services
        )


class DockerStackUpdateRequest(CamelCaseAliasedBaseModel):
    infer_envfile: bool = True
    prune_images: bool = False
    restart_containers: bool = True


class DockerStackResponse(DockerStack):
    """Alias for `DockerStack`"""


class DockerStackUpdateResponse(CamelCaseAliasedBaseModel):
    output: list[str]
    success: bool
