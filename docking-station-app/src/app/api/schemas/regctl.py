from datetime import datetime
from pathlib import PurePath

from pydantic import Field, field_validator

from .common import AliasedBaseModel

__all__ = [
    'RegctlImageConfig',
    'RegctlImageHistory',
    'RegctlImageInspect',
]


class RegctlImageHistory(AliasedBaseModel):
    comment: str | None = None
    created_by: str | None = None
    created: datetime
    empty_layer: bool | None = None


class RegctlImageConfig(AliasedBaseModel):
    entrypoint: list[str] = Field(default_factory=list)
    env: list[str] = Field(default_factory=list)
    exposed_ports: dict = Field(default_factory=dict)
    labels: dict[str, str] = Field(default_factory=dict)
    volumes: dict[str, dict] = Field(default_factory=dict)
    working_dir: PurePath | None = None

    @field_validator('entrypoint', 'env', mode='before')
    @classmethod
    def validate_list(cls, v):
        if v is None:
            return []
        return v

    @field_validator('exposed_ports', 'labels', 'volumes', mode='before')
    @classmethod
    def validate_dict(cls, v):
        if v is None:
            return {}
        return v


class RegctlImageInspect(AliasedBaseModel):
    architecture: str
    config: RegctlImageConfig = Field(default_factory=RegctlImageConfig)
    created: datetime
    history: list[RegctlImageHistory] = Field(default_factory=list)
