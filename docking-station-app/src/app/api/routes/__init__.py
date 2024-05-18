from .containers import router as containers_router
from .images import router as images_router
from .root import router as root_router
from .stacks import router as stacks_router

__all__ = [
    'containers_router',
    'images_router',
    'root_router',
    'stacks_router',
]
