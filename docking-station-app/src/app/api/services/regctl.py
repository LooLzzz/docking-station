import asyncio
import subprocess

__all__ = [
    'get_image_remote_digest',
]


async def get_image_remote_digest(repo_tag: str, reraise: bool = False) -> str:
    try:
        if ':' in repo_tag:
            image_name, _tag = repo_tag.split(':', 1)
        else:
            image_name, _tag = repo_tag, ''

        process = await asyncio.create_subprocess_shell(
            f'regctl image digest "{repo_tag}"',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            raise Exception(f'Error running regctl command: {error_message}')

        digest = stdout.decode().strip()
        return f'{image_name}@{digest}'

    except Exception as e:
        if reraise:
            raise Exception(f'Error running regctl command: {e}')
        return None
