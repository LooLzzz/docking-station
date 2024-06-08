from pydantic_settings import BaseSettings

from .settings import get_app_settings

__all__ = [
    'AutoUpdaterLogSettings',
    'ServerLogSettings',
]

app_settings = get_app_settings()

B = 1024
MB = B * 1024
LOG_LEVEL = 'DEBUG' if app_settings.node_env == 'development' else 'INFO'
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
