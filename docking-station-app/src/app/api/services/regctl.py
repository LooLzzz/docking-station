import asyncio
import subprocess
from logging import getLogger

logger = getLogger(__name__)

__all__ = [
    'get_image_remote_digest',
]


async def get_image_remote_digest(repo_tag: str, reraise: bool = False) -> str:
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
        logger.debug('regctl request: %s', repo_tag)
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            raise Exception(f'Error running regctl command: {error_message}')

        digest = stdout.decode().strip()
        res = f'{image_name}@{digest}'
        logger.info('regctl response: %s', res)
        return res

    except Exception as e:
        if reraise:
            raise Exception(f'Error running regctl command: {e}')
        return None
