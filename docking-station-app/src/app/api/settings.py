import re
from datetime import timedelta
from typing import Literal, Tuple

from pydantic import Field, field_validator
from pydantic_settings import (BaseSettings, PydanticBaseSettingsSource,
                               SettingsConfigDict, YamlConfigSettingsSource)
from pytimeparse.timeparse import timeparse

__all__ = [
    'Appsettings',
    'ServerLogSettings',
    'autoUpdaterLogSettings',
]


class AutoUpdaterSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='AUTO_UPDATER_')

    enabled: bool = False
    interval: timedelta = Field(default_factory=lambda: timedelta(days=1))
    max_concurrent: int = 4

    @property
    def interval_seconds(self):
        return self.interval.total_seconds()

    @field_validator('interval', mode='before')
    @classmethod
    def validate_interval(cls, value):
        match value:
            case str() if value.isdigit():
                return timedelta(seconds=int(value))
            case str():
                return timedelta(seconds=timeparse(value))
        return value


class ServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='SERVER_')

    ignore_label_field_name: str = 'com.loolzzz.docking-station.ignore'
    ignore_compose_stack_name_keywords: tuple[str, ...] = ('devcontainer',)
    possible_homepage_labels: tuple[str, ...] = ('org.label-schema.url',
                                                 'org.opencontainers.image.url',
                                                 'org.opencontainers.image.source')

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


B = 1024
MB = B * 1024
LOG_LEVEL = 'DEBUG' if AppSettings().node_env == 'development' else 'INFO'
LOG_FORMAT: str = '%(levelprefix)-8s %(message)s'
LOG_FORMAT_FILE: str = '%(levelprefix)-8s %(asctime)s [%(name)s] %(message)s'
DATE_FORMAT: str = '%Y-%m-%d %H:%M:%S'


class ServerLogSettings(BaseSettings):
    """Logging configuration to be set for the server"""

    LOGGER_NAMES: list[str] = ['uvicorn', 'api']

    # Logging config
    version: int = 1
    disable_existing_loggers: bool = False
    formatters: dict = {
        'default': {
            '()': 'uvicorn.logging.DefaultFormatter',
            'fmt': LOG_FORMAT,
            'datefmt': DATE_FORMAT,
        },
        'file': {
            '()': 'uvicorn.logging.DefaultFormatter',
            'use_colors': False,
            'fmt': LOG_FORMAT_FILE,
            'datefmt': DATE_FORMAT,
        },
    }
    handlers: dict = {
        'default': {
            'formatter': 'default',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stderr',
        },
        'rotating_file_handler': {
            'formatter': 'file',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/docking-station-server.log',
            'maxBytes': 10 * MB,
            'backupCount': 5,
        }
    }
    loggers: dict = {
        logger_name: {
            'handlers': ['default', 'rotating_file_handler'],
            'level': LOG_LEVEL,
        } for logger_name in LOGGER_NAMES
    }


class AutoUpdaterLogSettings(BaseSettings):
    """Logging configuration to be set for the auto updater script"""

    LOGGER_NAMES: list[str] = ['auto-updater', 'api']

    # Logging config
    version: int = 1
    disable_existing_loggers: bool = False
    formatters: dict = {
        'default': {
            '()': 'uvicorn.logging.DefaultFormatter',
            'fmt': LOG_FORMAT,
            'datefmt': DATE_FORMAT,
        },
        'file': {
            '()': 'uvicorn.logging.DefaultFormatter',
            'use_colors': False,
            'fmt': LOG_FORMAT_FILE,
            'datefmt': DATE_FORMAT,
        },
    }
    handlers: dict = {
        'default': {
            'formatter': 'default',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stderr',
        },
        'rotating_file_handler': {
            'formatter': 'file',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/docking-station-autoupdater.log',
            'maxBytes': 10 * MB,
            'backupCount': 5,
        }
    }
    loggers: dict = {
        logger_name: {
            'handlers': ['default', 'rotating_file_handler'],
            'level': LOG_LEVEL,
        } for logger_name in LOGGER_NAMES
    }
