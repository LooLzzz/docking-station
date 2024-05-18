import asyncio
from collections import defaultdict

from fastapi import HTTPException
from python_on_whales import DockerClient, docker
from python_on_whales.components.container.cli_wrapper import (
    Container, DockerContainerListFilters)

from ..schemas import ListStacksItem
from .regctl import get_image_remote_digest

__all__ = [
    'list_compose_stacks',
    'list_containers',
    'list_images',
    'update_compose_stack',
]


async def list_containers(filters: DockerContainerListFilters = None):
    return docker.container.list(
        filters=filters or {},
        all=True,
    )


async def list_images(repository_or_tag: str = None,
                      filters: dict[str, str] = None):
    return docker.image.list(
        repository_or_tag=repository_or_tag,
        filters=filters or {},
        all=True,
    )


async def _populate_stacks_with_containers(containers: list[Container]):
    LOCKS = defaultdict(asyncio.Lock)
    stacks = defaultdict(lambda: {
        'project_name': None,
        'config_files': [],
        'environment_files': [],
        'services': []
    })

    async def _task(container: Container):
        labels = container.config.labels
        project_name = labels.get('com.docker.compose.project', None)
        if project_name:
            config_files = labels.get('com.docker.compose.project.config_files', '').split(',')
            environment_files = labels.get('com.docker.compose.project.environment_file', '').split(',')
            repo_digests = docker.image.inspect(container.image).repo_digests
            local_digest = repo_digests[0].split('@', 1)[1] if repo_digests else None
            service_name = labels.get('com.docker.compose.service', '')

            remote_digest = None
            if local_digest:
                remote_digest = await get_image_remote_digest(container.config.image, reraise=False)

            async with LOCKS[project_name]:
                stacks[project_name]['project_name'] = project_name
                stacks[project_name]['services'].append({
                    'container_name': container.name,
                    'has_updates': all([local_digest,
                                        remote_digest,
                                        local_digest != remote_digest]),
                    'image_id': container.image,
                    'image_local_digest': local_digest,
                    'image_name': container.config.image,
                    'image_remote_digest': remote_digest,
                    'service_name': service_name,
                })

                for filepath in environment_files:
                    if filepath not in stacks[project_name]['environment_files']:
                        stacks[project_name]['environment_files'].append(filepath)

                for filepath in config_files:
                    if filepath not in stacks[project_name]['config_files']:
                        stacks[project_name]['config_files'].append(filepath)

    await asyncio.wait([
        asyncio.create_task(
            _task(container)
        ) for container in containers
    ])
    return stacks


async def list_compose_stacks(filters: DockerContainerListFilters = None):
    stacks = {}
    containers = await list_containers(filters)
    if containers:
        stacks = await _populate_stacks_with_containers(containers)

    return [
        ListStacksItem.model_validate(stack)
        for stack in stacks.values()
    ]


async def get_compose_stacks(stack: str):
    stacks = await list_compose_stacks(
        filters={
            'label': f'com.docker.compose.project={stack}'
        }
    )
    return stacks[0] if stacks else {}


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
