from os import getenv
from typing import Literal

__all__ = [
    'GUI_PORT',
    'NODE_ENV',
    'ROLLING_UPDATES_KEYWORDS',
    'SERVER_PORT',
]

NODE_ENV: Literal['development', 'production'] = getenv('NODE_ENV', 'development')

GUI_PORT = int(getenv('GUI_PORT', 3000))
SERVER_PORT = int(getenv('SERVER_PORT', 3001))

ROLLING_UPDATES_KEYWORDS = ['stable', 'latest', 'release', 'master']
