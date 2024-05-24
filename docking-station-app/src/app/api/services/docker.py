import asyncio
from datetime import datetime
from logging import getLogger

from fastapi import HTTPException
from python_on_whales import DockerClient, docker
from python_on_whales.components.container.cli_wrapper import \
    Container as WhalesContainer
from python_on_whales.components.container.cli_wrapper import \
    DockerContainerListFilters
from python_on_whales.components.image.cli_wrapper import Image as WhalesImage

from ..consts import (DOCKINGSTATION_LABEL__IGNORE,
                      IGNORED_COMPOSE_PROJECT_PATTERN)
from ..schemas import DockerContainer, DockerImage, DockerStack
from .regctl import get_image_remote_digest

logger = getLogger(__name__)

__all__ = [
    'get_compose_service_container',
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
            uptime=datetime.now(container.state.started_at.tzinfo) - container.state.started_at,
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
        if not item.config.labels.get(DOCKINGSTATION_LABEL__IGNORE, False)
    ])

    return sorted(
        containers,
        key=lambda x: x.created_at,
        reverse=True,
    )


async def get_container(container_id: str):
    containers = await list_containers(
        filters={'id': container_id}
    )
    if not containers:
        raise KeyError(container_id)
    return containers[0]


async def list_images(repository_or_tag: str = None,
                      filters: dict[str, str] = None):

    async def _task(image: WhalesImage):
        repo_local_digest = image.repo_digests[0] if image.repo_digests else None
        repo_tag = image.repo_tags[0] if image.repo_tags else None
        repo_remote_digest = None
        has_updates = False

        if repo_local_digest:
            if not repo_tag:
                repo_tag = repo_local_digest.split('@', 1)[0]
            if repo_remote_digest := await get_image_remote_digest(repo_tag):
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
        stack.services = await list_containers(
            filters={'label': f'com.docker.compose.project={stack.name}'}
        )
        return stack

    _stacks = docker.compose.ls(all=True, filters=filters or {})
    stacks = await asyncio.gather(*[
        _task(DockerStack.model_validate(stack.model_dump()))
        for stack in _stacks
        if not IGNORED_COMPOSE_PROJECT_PATTERN.search(stack.name)
    ])

    return sorted(
        stacks,
        key=lambda x: x.name,
    )


async def get_compose_stack(stack_name: str):
    stacks = await list_compose_stacks(
        filters={'name': stack_name}
    )
    if not stacks:
        raise KeyError(stack_name)
    return stacks[0]


async def update_compose_stack(stack_name: str,
                               service_name: str = None,
                               infer_envfile: bool = True,
                               restart_containers: bool = True,
                               prune_images: bool = False):
    env_file = None
    config_files = None
    output = []

    stacks = docker.compose.ls(
        filters={'name': stack_name},
    )

    if not stacks:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack_name!r} not found',
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
        logger.info('Pulling images and restarting containers for %s%s',
                    stack_name, f'/{service_name}' if service_name else '')
        output.append('$ docker compose up -d --pull=always')
        output.extend([
            line.decode().strip()
            for (_std_type, line)
            in client.compose.up(
                services=service_name,
                pull='always',
                detach=True,
                stream_logs=True,
            )
        ])
    else:
        logger.info('Pulling images for %s%s', stack_name, f'/{service_name}' if service_name else '')
        output.append('$ docker compose pull')
        output.extend([
            line.decode().strip()
            for (_std_type, line)
            in client.compose.pull(
                services=service_name,
                stream_logs=True,
            )
        ])

    if prune_images:
        logger.info('Pruning images')
        output.extend(['', '$ docker image prune'])
        output.extend(
            client.image.prune().split('\n')
        )

    logger.info('Update complete, output: %s', output)

    # success = is container running
    container_status = all(
        container.state.running
        for container in docker.container.list(
            filters={'label': f'com.docker.compose.project={stack_name}'},
            all=True,
        )
        if not service_name or container.config.labels.get('com.docker.compose.service') == service_name
    )

    return {
        'output': output,
        'success': container_status,
    }


async def get_compose_service_container(stack_name: str, service_name: str):
    stack = await get_compose_stack(stack_name)
    container = next(
        (item
         for item in stack.services
         if item.service_name == service_name),
        None,
    )
    if not container:
        raise KeyError(service_name)
    return container
