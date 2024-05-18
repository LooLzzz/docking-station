import asyncio
import subprocess

__all__ = [
    'get_image_remote_digest',
]


async def get_image_remote_digest(image_name: str, reraise: bool = False) -> str:
    try:
        # Run the command and capture the output
        process = await asyncio.create_subprocess_shell(
            f'regctl image digest "{image_name}"',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        # Check if the command was successful
        if process.returncode == 0:
            # Extract the digest from the output
            digest = stdout.decode().strip()
            return digest
        else:
            # Handle the error case
            error_message = stderr.decode().strip()
            raise Exception(f'Error running regctl command: {error_message}')

    except Exception as e:
        if reraise:
            raise Exception(f'Error running regctl command: {str(e)}')
        return None
