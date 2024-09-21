import re
from enum import StrEnum
from functools import lru_cache
from typing import Literal, Tuple

from pydantic import Field, field_validator
from pydantic_settings import (BaseSettings, PydanticBaseSettingsSource,
                               SettingsConfigDict, YamlConfigSettingsSource)

from ..schemas import CamelCaseAliasedBaseModel
from ..types import Interval

__all__ = [
    'AppSettings',
    'get_app_settings',
]


class DiscoverStrategyEnum(StrEnum):
    OPT_IN = 'opt-in'
    OPT_OUT = 'opt-out'

    def is_opt_in(self):
        return self is self.OPT_IN

    def is_opt_out(self):
        return self is self.OPT_OUT


class AutoUpdaterSettings(BaseSettings, CamelCaseAliasedBaseModel):
    model_config = SettingsConfigDict(env_prefix='AUTO_UPDATER_')

    enabled: bool = False
    interval: Interval = '1d'
    max_concurrent: int = 4

    @property
    def interval_seconds(self):
        return self.interval.total_seconds()


class ServerSettings(BaseSettings, CamelCaseAliasedBaseModel):
    model_config = SettingsConfigDict(env_prefix='SERVER_')

    cache_control_max_age: Interval = '1d'
    discovery_strategy: DiscoverStrategyEnum = DiscoverStrategyEnum.OPT_OUT
    dryrun: bool = False
    enabled_label_field_name: str = 'com.loolzzz.docking-station.enabled'
    ignore_compose_stack_name_keywords: list[str] = Field(default_factory=lambda: ['devcontainer'])
    possible_homepage_labels: list[str] = Field(default_factory=lambda: ['org.label-schema.url',
                                                                         'org.opencontainers.image.url',
                                                                         'org.opencontainers.image.source'])
    possible_image_version_labels: list[str] = Field(default_factory=lambda: ['org.label-schema.version',
                                                                              'org.opencontainers.image.version'])
    python_on_whales__ignored_image_prefixes: list[str] = Field(default_factory=lambda: ['docker.io/',
                                                                                         'docker.io/library/'])
    time_until_update_is_mature: Interval = '1w'

    @property
    def cache_control_max_age_seconds(self):
        return self.cache_control_max_age.total_seconds()

    @property
    def time_until_update_is_mature_seconds(self):
        return self.time_until_update_is_mature.total_seconds()

    @property
    def ignore_compose_stack_name_pattern(self):
        return re.compile(
            pattern='|'.join(f'({item})'
                             for item in self.ignore_compose_stack_name_keywords),
            flags=re.IGNORECASE,
        )

    @field_validator(
        'possible_homepage_labels',
        'ignore_compose_stack_name_keywords',
        mode='before'
    )
    @classmethod
    def validate_str_tuple(cls, value):
        if isinstance(value, str):
            return tuple(value.split(','))
        return value


class AppSettings(BaseSettings, CamelCaseAliasedBaseModel):
    model_config = SettingsConfigDict(yaml_file='/app/config/settings.yml')

    auto_updater: AutoUpdaterSettings = Field(default_factory=AutoUpdaterSettings)
    server: ServerSettings = Field(default_factory=ServerSettings)

    node_env: Literal['development', 'production'] = 'development'
    server_port: int = 3001
    web_port: int = 3000

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        return (
            init_settings,
            file_secret_settings,
            YamlConfigSettingsSource(settings_cls),
            dotenv_settings,
            env_settings,
        )


@lru_cache(maxsize=1)
def get_app_settings():
    return AppSettings()
