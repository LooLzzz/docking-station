from pathlib import Path

from pydantic import Field

from .common import AliasedBaseModel, CamelCaseAliasedBaseModel

__all__ = [
    'ListStacksItem',
    'ListStacksResponseItem',
    'ListStacksServiceItem',
    'UpdateComposeStackRequest',
]


class ListStacksServiceItem(AliasedBaseModel):
    container_name: str
    image_local_digest: str | None = None
    image_name: str
    image_remote_digest: str | None = None
    service_name: str
    has_updates: bool


class ListStacksItem(AliasedBaseModel):
    config_files: list[Path] = Field(default_factory=list)
    environment_files: list[Path] = Field(default_factory=list)
    project_name: str
    services: list[ListStacksServiceItem] = Field(default_factory=list)


class ListStacksResponseItem(ListStacksItem):
    """alias for `ListStacksItem`"""


class UpdateComposeStackRequest(CamelCaseAliasedBaseModel):
    infer_envfile: bool = True
    restart_containers: bool = True
    prune_images: bool = False
