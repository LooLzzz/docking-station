import asyncio
from datetime import datetime
from logging import getLogger
from threading import Thread

from fastapi import HTTPException
from python_on_whales import DockerClient
from python_on_whales.components.container.cli_wrapper import Container as WhalesContainer
from python_on_whales.components.container.cli_wrapper import DockerContainerListFilters
from python_on_whales.components.image.cli_wrapper import Image as WhalesImage

from ..schemas import DockerContainer, DockerImage, DockerStack, MessageDict
from ..settings import get_app_settings
from ..utils import subprocess_stream_generator
from .regctl import get_image_inspect, get_image_remote_digest

__all__ = [
    'get_compose_service_container',
    'get_compose_stack',
    'get_image',
    'list_compose_stacks',
    'list_containers',
    'list_images',
    'update_compose_stack_ws',
    'update_compose_stack',
]

logger = getLogger(__name__)
app_settings = get_app_settings()
docker = DockerClient(
    client_type='docker',
    **app_settings.server.python_on_whales__docker_client_config
)


async def list_containers(filters: DockerContainerListFilters = None,
                          include_stopped: bool = False,
                          no_cache: bool = False):

    async def _task(container: WhalesContainer):
        nonlocal no_cache

        res = DockerContainer(
            id=container.id,
            created_at=container.created,
            uptime=datetime.now(container.state.started_at.tzinfo) - container.state.started_at,
            image=None,
            labels=container.config.labels,
            name=container.name,
            ports=container.network_settings.ports,
            status=container.state.status,
        )

        if not res.dockingstation_enabled:
            return None

        image_tag = (container.config.image.split('@', 1)[0]
                                           .removeprefix('registry.hub.docker.com/')
                                           .removeprefix('library/'))
        res.image = await get_image(
            repository_or_tag=image_tag,
            no_cache=no_cache,
        )
        return res

    _containers = docker.container.list(
        all=include_stopped,
        filters=filters or {},
    )
    containers = list(filter(
        lambda x: x is not None,
        await asyncio.gather(*[
            _task(item)
            for item in _containers
        ])
    ))

    return sorted(
        containers,
        key=lambda x: x.created_at,
        reverse=True,
    )


async def list_images(repository_or_tag: str = None,
                      filters: dict[str, str] = None,
                      no_cache: bool = False):

    async def _task(image: WhalesImage):
        nonlocal no_cache

        repo_local_digest = image.repo_digests[0] if image.repo_digests else None
        repo_tag = image.repo_tags[0] if image.repo_tags else None
        latest_update = image.created
        image_lables = image.config.labels
        image_inspect = None
        version = None
        latest_version = None

        if image_lables:
            for label in app_settings.server.possible_image_version_labels:
                if v := image_lables.get(label, None):
                    version = v
                    break

        if repo_local_digest:
            if not repo_tag:
                repo_tag = repo_local_digest.split('@', 1)[0]

            if image_remote_digest := await get_image_remote_digest(repo_tag, no_cache=no_cache):
                image_inspect = await get_image_inspect(image_remote_digest, no_cache=no_cache)
                latest_update = image_inspect.created
                for label in app_settings.server.possible_image_version_labels:
                    if v := image_inspect.config.labels.get(label, None):
                        latest_version = v
                        break

        return DockerImage(
            id=image.id,
            created_at=image.created,
            latest_update=latest_update,
            latest_version=latest_version,
            repo_local_digest=repo_local_digest,
            repo_tag=repo_tag,
            version=version,
        )

    clean_repository_or_tag = repository_or_tag
    for prefix in app_settings.server.python_on_whales__ignored_image_prefixes:
        clean_repository_or_tag = clean_repository_or_tag.removeprefix(prefix)

    _images = docker.image.list(
        repository_or_tag=clean_repository_or_tag,
        filters=filters or {},
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


async def get_image(repository_or_tag: str,
                    no_cache: bool = False):
    images = await list_images(
        repository_or_tag=repository_or_tag,
        no_cache=no_cache,
    )
    if not images:
        raise KeyError(repository_or_tag)
    return images[0]


async def list_compose_stacks(filters: DockerContainerListFilters = None,
                              include_stopped: bool = False,
                              no_cache: bool = False):

    async def _task(stack: DockerStack):
        nonlocal include_stopped
        nonlocal no_cache

        stack.services = await list_containers(
            filters={'label': f'com.docker.compose.project={stack.name}'},
            include_stopped=include_stopped,
            no_cache=no_cache,
        )
        return stack

    _stacks = docker.compose.ls(all=include_stopped, filters=filters or {})
    stacks = await asyncio.gather(*[
        _task(DockerStack.model_validate(stack))
        for stack in _stacks
        if not app_settings.server.ignore_compose_stack_name_pattern.search(stack.name)
    ])
    stacks = [
        stack
        for stack in stacks
        if stack.services
    ]

    return sorted(
        stacks,
        key=lambda x: x.name,
    )


async def get_compose_stack(stack_name: str,
                            no_cache: bool = False):
    stacks = await list_compose_stacks(
        filters={'name': stack_name},
        no_cache=no_cache,
    )
    if not stacks:
        raise KeyError(stack_name)
    return stacks[0]


async def get_compose_service_container(stack_name: str,
                                        service_name: str,
                                        no_cache: bool = False):
    stack = await get_compose_stack(stack_name)
    container = next(
        (item
         for item in stack.services
         if item.service_name == service_name),
        None
    )
    if not container:
        raise KeyError(service_name)

    container.image = await get_image(
        container.image.repo_tag,
        no_cache=no_cache,
    )
    return container


async def update_compose_stack(stack_name: str,
                               service_name: str = None,
                               infer_envfile: bool = True,
                               restart_containers: bool = True,
                               prune_images: bool = False):
    env_file = None
    config_files = None
    output = []

    stack = next(iter(
        docker.compose.ls(
            filters={'name': stack_name},
        )
    ), None)

    if not stack:
        raise HTTPException(
            status_code=404,
            detail=f'Compose stack {stack_name!r} not found',
        )

    config_files = stack.config_files

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


def update_compose_stack_ws(stack_name: str,
                            services: list[str] = [],
                            infer_envfile: bool = True,
                            restart_containers: bool = True,
                            prune_images: bool = False):

    async def _task(queue: asyncio.Queue[MessageDict]):
        nonlocal stack_name
        nonlocal services
        nonlocal infer_envfile
        nonlocal restart_containers
        nonlocal prune_images

        env_file = None
        config_files = None

        stack = next(iter(
            docker.compose.ls(
                filters={'name': stack_name},
            )
        ), None)

        if not stack:
            raise ValueError(f'Compose stack {stack_name!r} not found')

        config_files = stack.config_files

        if infer_envfile:
            for p in config_files:
                if p.with_suffix('.env').exists():
                    env_file = p.with_suffix('.env')
                    break
                if p.with_name('.env').exists():
                    env_file = p.with_name('.env')
                    break

        queue.put_nowait(
            MessageDict(stage='Starting')
        )

        config_file_cmd = ['-f', *config_files] if config_files else []
        env_file_cmd = ['--env-file', env_file] if env_file else []
        pull_cmd = ['--pull', 'always'] if not app_settings.server.dryrun else []
        stdout = subprocess_stream_generator([
            'docker', 'compose',
            *config_file_cmd,
            *env_file_cmd,
            'up', '-d',
            *pull_cmd,
            *services,
        ])
        for line in stdout:
            queue.put_nowait(
                MessageDict(
                    stage='docker compose up --pull always',
                    message=line,
                )
            )

        if app_settings.server.dryrun:
            n = 50
            for i in range(1, n + 1):
                queue.put_nowait(
                    MessageDict(
                        stage='docker compose up --pull always',
                        message=f'test line {i}/{n}',
                    )
                )
                await asyncio.sleep(0.1)

        if prune_images:
            if app_settings.server.dryrun:
                n = 50
                for i in range(1, n + 1):
                    queue.put_nowait(
                        MessageDict(
                            stage='docker image prune',
                            message=f'test line {i}/{n}',
                        )
                    )
            else:
                stdout = subprocess_stream_generator([
                    'docker', 'image', 'prune', '-f'
                ])
                for line in stdout:
                    queue.put_nowait(
                        MessageDict(
                            stage='docker image prune',
                            message=line,
                        )
                    )

        await queue.put(
            MessageDict(
                stage='Finished',
            )
        )

    queue: asyncio.Queue[MessageDict] = asyncio.Queue()
    worker = Thread(target=lambda: asyncio.run(_task(queue)), daemon=True)
    worker.start()
    return worker, queue
