import re
from os import getenv
from typing import Literal

__all__ = [
    'AUTO_UPDATER_INTERVAL_SEC',
    'AUTO_UPDATER_MAX_CONCURRENT',
    'DOCKINGSTATION_LABEL__IGNORE',
    'IGNORED_COMPOSE_PROJECT_KEYWORDS',
    'IGNORED_COMPOSE_PROJECT_PATTERN',
    'NODE_ENV',
    'SERVER_PORT',
    'WEB_PORT',
]

NODE_ENV: Literal['development', 'production'] = getenv('NODE_ENV', 'development')

WEB_PORT = int(getenv('WEB_PORT', 3000))
SERVER_PORT = int(getenv('SERVER_PORT', 3001))

DOCKINGSTATION_LABEL__IGNORE = 'com.loolzzz.docking-station.ignore'

AUTO_UPDATER_INTERVAL_SEC = int(getenv('AUTO_UPDATER_INTERVAL_SEC', 60))
AUTO_UPDATER_MAX_CONCURRENT = int(getenv('AUTO_UPDATER_MAX_CONCURRENT', 5))

IGNORED_COMPOSE_PROJECT_KEYWORDS = getenv('IGNORED_COMPOSE_PROJECT_KEYWORDS', 'devcontainer').split(',')
IGNORED_COMPOSE_PROJECT_PATTERN = re.compile(
    pattern='|'.join(f'({item})'
                     for item in IGNORED_COMPOSE_PROJECT_KEYWORDS),
    flags=re.IGNORECASE,
)
