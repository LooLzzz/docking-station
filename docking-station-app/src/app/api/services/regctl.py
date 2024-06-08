import asyncio
import subprocess
from datetime import timedelta
from logging import getLogger

from ..schemas import RegctlImageInspect
from ..settings import cached, get_app_settings

__all__ = [
    'get_image_inspect',
    'get_image_remote_digest',
]

app_settings = get_app_settings()
logger = getLogger(__name__)


async def get_image_remote_digest(repo_tag: str, reraise: bool = False, no_cache: bool = False):
    cache_control_max_age_seconds = (timedelta(days=365).total_seconds()
                                     if 'sha256:' in repo_tag
                                     else app_settings.server.cache_control_max_age_seconds)

    @cached(expire=cache_control_max_age_seconds)
    async def _get_image_remote_digest(repo_tag: str, no_cache: bool = False):
        nonlocal reraise

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

    return await _get_image_remote_digest(
        repo_tag=repo_tag,
        no_cache=no_cache,
    )


async def get_image_inspect(repo_tag: str, reraise: bool = False, no_cache: bool = False):
    is_specific_digest = 'sha256:' in repo_tag
    cache_control_max_age_seconds = (timedelta(days=365).total_seconds()
                                     if is_specific_digest
                                     else app_settings.server.cache_control_max_age_seconds)

    @cached(expire=cache_control_max_age_seconds)
    async def _get_image_inspect(repo_tag: str, no_cache: bool = False) -> RegctlImageInspect:
        nonlocal reraise

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

    return await _get_image_inspect(
        repo_tag=repo_tag,
        no_cache=False if is_specific_digest else no_cache,
    )
