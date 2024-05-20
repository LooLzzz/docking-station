import re
from os import getenv
from typing import Literal

__all__ = [
    'GUI_PORT',
    'IGNORED_COMPOSE_PROJECT_KEYWORDS',
    'IGNORED_COMPOSE_PROJECT_PATTERN',
    'NODE_ENV',
    'SERVER_PORT',
]

NODE_ENV: Literal['development', 'production'] = getenv('NODE_ENV', 'development')

GUI_PORT = int(getenv('GUI_PORT', 3000))
SERVER_PORT = int(getenv('SERVER_PORT', 3001))

IGNORED_COMPOSE_PROJECT_KEYWORDS = ['devcontainer']
IGNORED_COMPOSE_PROJECT_PATTERN = re.compile(
    '|'.join(
        f'({item})'
        for item in IGNORED_COMPOSE_PROJECT_KEYWORDS
    )
)
