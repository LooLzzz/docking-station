from collections import defaultdict
from pathlib import Path

from pydantic import BaseModel, Field, computed_field, model_validator

from .common import AliasedBaseModel, CamelCaseAliasedBaseModel, IterableRootModel
from .containers import DockerContainer

__all__ = [
    'DockerStack',
    'DockerStackBatchUpdateRequest',
    'DockerStackResponse',
    'DockerStackRootModel',
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

    @model_validator(mode='before')
    @classmethod
    def validate_from_basemodel(cls, v):
        if isinstance(v, BaseModel):
            return v.model_dump()
        return v


class DockerStackRootModel(IterableRootModel):
    root: list[DockerStack]


class DockerStackUpdateRequest(CamelCaseAliasedBaseModel):
    infer_envfile: bool = True
    prune_images: bool = False
    restart_containers: bool = True


class DockerStackBatchUpdateRequest(CamelCaseAliasedBaseModel):
    services: list[str]
    infer_envfile: bool = True
    prune_images: bool = False
    restart_containers: bool = True

    @property
    def stack_services(self) -> dict[str, list[str]]:
        res = defaultdict(list)
        for item in self.services:
            stack, service = item.split('/')
            res[stack].append(service)
        return dict(res)


class DockerStackResponse(DockerStack):
    """Alias for `DockerStack`"""


class DockerStackUpdateResponse(CamelCaseAliasedBaseModel):
    output: list[str]
    success: bool
