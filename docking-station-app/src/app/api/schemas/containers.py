from .common import AliasedBaseModel

__all__ = [
    'ContainerPort',
    'ListContainersResponseItem',
]


class ContainerPort(AliasedBaseModel):
    host_ip: str
    host_port: int


class ListContainersResponseItem(AliasedBaseModel):
    id: str
    name: str
    image: str
    ports: dict[str, list[ContainerPort] | None]
    labels: dict[str, str]
