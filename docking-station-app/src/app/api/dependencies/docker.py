from fastapi import HTTPException, Query, Request
from python_on_whales import DockerClient

__all__ = [
    "DockerClients",
    "get_docker_client",
    "get_docker_clients",
]

DockerClients = dict[str, DockerClient]


def get_docker_clients(request: Request) -> DockerClients:
    """FastAPI dependency that provides all initialized Docker clients."""
    return request.app.state.docker_clients


def get_docker_client(request: Request, host: str = Query('localhost')) -> DockerClient:
    """FastAPI dependency that resolves a single Docker client by host query param."""
    clients: DockerClients = request.app.state.docker_clients
    client = clients.get(host)
    if not client:
        raise HTTPException(
            status_code=404,
            detail=f'Docker host {host!r} not found',
        )
    return client
