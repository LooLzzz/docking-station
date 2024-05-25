from .common import CamelCaseAliasedBaseModel

__all__ = [
    'GetStatsResponse',
    'ServerStats',
]


class ServerStats(CamelCaseAliasedBaseModel):
    num_of_services_with_updates: int
    num_of_services: int
    num_of_stacks_with_updates: int
    num_of_stacks: int


class GetStatsResponse(ServerStats):
    """alias for ServerInfo"""
