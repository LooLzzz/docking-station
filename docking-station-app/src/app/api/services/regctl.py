import asyncio
import subprocess
from logging import getLogger

from fastapi_cache.decorator import cache

from ..schemas import RegctlImageInspect

logger = getLogger(__name__)

__all__ = [
    'get_image_inspect',
    'get_image_remote_digest',
]


@cache(expire=5)
async def get_image_remote_digest(repo_tag: str, reraise: bool = False):
    try:
        if ':' in repo_tag:
            image_name, _tag = repo_tag.split(':', 1)
        else:
            image_name, _tag = repo_tag, ''

        cmd = f'regctl image digest "{repo_tag}"'
        process = await asyncio.create_subprocess_shell(
            cmd=cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        logger.debug('regctl image digest request: %s', repo_tag)
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            raise Exception(f'Error running regctl command: {error_message}')

        digest = stdout.decode().strip()
        res = f'{image_name}@{digest}'
        logger.info('regctl image digest response: %s', res)
        return res

    except Exception as e:
        logger.error('Error running regctl command: %s', e)
        if reraise:
            raise Exception(f'Error running regctl command: {e}')
        return None


@cache(expire=5)
async def get_image_inspect(repo_tag: str, reraise: bool = False):
    try:
        cmd = f'regctl image inspect "{repo_tag}"'
        process = await asyncio.create_subprocess_shell(
            cmd=cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        logger.debug('regctl image inspect request: %s', repo_tag)
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            raise Exception(f'Error running regctl command: {error_message}')

        res = RegctlImageInspect.model_validate_json(stdout)
        logger.info('regctl image inspect response: %s', res.created)
        return res

    except Exception as e:
        logger.error('Error running regctl command: %s', e)
        if reraise:
            raise Exception(f'Error running regctl command: {e}')
        return None
