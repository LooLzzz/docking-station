import asyncio

from fastapi import HTTPException
from python_on_whales import DockerClient, docker
from python_on_whales.components.container.cli_wrapper import (Container as WhalesContainer,
                                                               DockerContainerListFilters)
from python_on_whales.components.image.cli_wrapper import Image as WhalesImage

from ..schemas import DockerContainer, DockerImage, DockerStack
from .regctl import get_image_remote_digest

__all__ = [
    'get_compose_stack',
    'get_image',
    'list_compose_stacks',
    'list_containers',
    'list_images',
    'update_compose_stack',
]


async def list_containers(filters: DockerContainerListFilters = None):

    async def _task(container: WhalesContainer):
        image_tag = (container.config.image.split('@', 1)[0]
                                           .removeprefix('registry.hub.docker.com/')
                                           .removeprefix('library/'))
        image = await get_image(image_tag)
        return DockerContainer(
            id=container.id,
            created_at=container.created,
            image=image,
            labels=container.config.labels,
            name=container.name,
            ports=container.network_settings.ports,
            status=container.state.status,
        )

    _containers = docker.container.list(
        filters=filters or {},
        all=True,
    )
    containers = await asyncio.gather(*[
        _task(item)
        for item in _containers
    ])

    return sorted(
        containers,
        key=lambda x: x.created_at,
        reverse=True,
    )


async def list_images(repository_or_tag: str = None,
                      filters: dict[str, str] = None):

    async def _task(image: WhalesImage):
        repo_local_digest = image.repo_digests[0] if image.repo_digests else None
        repo_tag =  image.repo_tags[0] if image.repo_tags else None
        repo_remote_digest = None
        has_updates = False

        if repo_local_digest:
            if not repo_tag:
                repo_tag = repo_local_digest.split('@', 1)[0]
            repo_remote_digest = await get_image_remote_digest(repo_tag)
            has_updates = repo_local_digest != repo_remote_digest

        return DockerImage(
            id=image.id,
            created_at=image.created,
            has_updates=has_updates,
            repo_local_digest=repo_local_digest,
            repo_remote_digest=repo_remote_digest,
            repo_tag=repo_tag,
        )

    _images = docker.image.list(
        repository_or_tag=repository_or_tag,
        filters=filters or {},
        all=True,
    )
    images = await asyncio.gather(*[
        _task(item)
        for item in _images
    ])

    return sorted(
        images,
        key=lambda x: x.created_at,
        reverse=True,
    )


async def get_image(repository_or_tag: str):
    images = await list_images(repository_or_tag=repository_or_tag)
    if not images:
        raise KeyError(repository_or_tag)
    return images[0]


async def list_compose_stacks(filters: DockerContainerListFilters = None):

    async def _task(stack: DockerStack):
        stack.containers = await list_containers(
            filters={'label': f'com.docker.compose.project={stack.name}'}
        )
        return stack

    _stacks = docker.compose.ls(all=True, filters=filters or {})
    stacks = await asyncio.gather(*[
        _task(DockerStack.model_validate(stack.model_dump()))
        for stack in _stacks
    ])

    return sorted(
        stacks,
        key=lambda x: x.name,
    )


async def get_compose_stack(stack: str):
    stacks = await list_compose_stacks(
        filters={'name': stack}
    )
    if not stacks:
        raise KeyError(stack)
    return stacks[0]


async def update_compose_stack(stack: str,
                               service: str = None,
                               infer_envfile: bool = True,
                               restart_containers: bool = True,
                               prune_images: bool = False):
    env_file = None
    config_files = None
    stacks = docker.compose.ls(
        filters={'name': stack},
    )

    if not stacks:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack!r} not found',
        )

    config_files = stacks[0].config_files

    if infer_envfile:
        for p in config_files:
            if p.with_suffix('.env').exists():
                env_file = p.with_suffix('.env')
                break
            if p.with_name('.env').exists():
                env_file = p.with_name('.env')
                break

    client = DockerClient(
        compose_files=config_files,
        compose_env_file=env_file,
    )

    if restart_containers:
        output = client.compose.up(
            services=service,
            pull='always',
            detach=True,
            stream_logs=True,
        )
    else:
        output = client.compose.pull(
            services=service,
            stream_logs=True,
        )

    if prune_images:
        output = client.image.prune()

    # TODO: output aggregation, response model
    return {
        'stack_name': stack,
        'service': service,
        'output': output,
    }
