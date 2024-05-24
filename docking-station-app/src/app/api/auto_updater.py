import asyncio
from logging import getLogger
from logging.config import dictConfig

import aiohttp

from .schemas import (DockerContainer, DockerStackResponse,
                      DockerStackUpdateRequest, DockerStackUpdateResponse)
from .settings import AppSettings, AutoUpdaterLogSettings

app_settings = AppSettings()

BASE_API_URL = f'http://localhost:{app_settings.server_port}/api'
LOCK = asyncio.Semaphore(app_settings.auto_updater.max_concurrent)

dictConfig(AutoUpdaterLogSettings().model_dump())
logger = getLogger('auto-updater')


async def list_docker_stacks():
    logger.info('Listing docker stacks')
    res: list[DockerStackResponse] = []

    API_URL = f'{BASE_API_URL}/stacks'
    async with aiohttp.ClientSession() as session:
        async with session.get(API_URL) as response:
            data: dict = await response.json()
            res = [DockerStackResponse(**item)
                   for item in data]

    logger.info(f'Found {len(res)} stacks')
    return res


async def update_service(service: DockerContainer):
    async with LOCK:
        logger.info('Updating service:', service.service_name)

        API_URL = f'{BASE_API_URL}/stacks/{service.stack_name}/{service.service_name}'
        request = DockerStackUpdateRequest(infer_envfile=True,
                                           prune_images=False,
                                           restart_containers=True)
        body = request.model_dump(by_alias=True)

        async with aiohttp.ClientSession() as session:
            async with session.post(API_URL, json=body) as resp:
                data: dict = await resp.json()
                resp = DockerStackUpdateResponse.model_validate(data)
                logger.info(f'Updated service response: {service.model_dump(by_alias=True)}')
                return resp


async def main():
    if not app_settings.auto_updater.enabled:
        logger.info('Auto updater is disabled')
        return

    loop = asyncio.get_event_loop()
    while True:
        start_t = loop.time()
        tasks: list[asyncio.Task] = []
        services_to_update: list[DockerContainer] = []

        stacks = await list_docker_stacks()
        for stack in stacks:
            for service in stack.services:
                if service.has_updates and not service.dockingstation_ignore:
                    services_to_update.append(service)

        if services_to_update:
            logger.info(f'Found {len(services_to_update)} services to update')
        else:
            logger.info('No services to update')

        async with asyncio.TaskGroup() as tg:
            for service in services_to_update:
                tasks.append(
                    tg.create_task(
                        update_service(service)
                    )
                )

        delta_t = loop.time() - start_t
        if services_to_update:
            logger.info(f'Finished updating {len(tasks)} services in {delta_t:.2f} seconds')

        logger.info(f'Sleeping for {app_settings.auto_updater.interval_seconds:.2f} seconds')
        await asyncio.sleep(app_settings.auto_updater.interval_seconds)


if __name__ == '__main__':
    asyncio.run(main())
