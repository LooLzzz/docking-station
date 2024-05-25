import re
from typing import Literal, Tuple

from pydantic import Field, field_validator
from pydantic_settings import (BaseSettings, PydanticBaseSettingsSource,
                               SettingsConfigDict, YamlConfigSettingsSource)

from .common import Interval

__all__ = [
    'AppSettings',
]


class AutoUpdaterSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='AUTO_UPDATER_')

    enabled: bool = False
    interval: Interval = '1d'
    max_concurrent: int = 4

    @property
    def interval_seconds(self):
        return self.interval.total_seconds()


class ServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='SERVER_')

    cache_control_max_age: Interval = '1h'
    ignore_label_field_name: str = 'com.loolzzz.docking-station.ignore'
    ignore_compose_stack_name_keywords: tuple[str, ...] = ('devcontainer',)
    possible_homepage_labels: tuple[str, ...] = ('org.label-schema.url',
                                                 'org.opencontainers.image.url',
                                                 'org.opencontainers.image.source')

    @property
    def cache_control_max_age_seconds(self):
        return self.cache_control_max_age.total_seconds()

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


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(yaml_file='/app/config/settings.yaml')

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
