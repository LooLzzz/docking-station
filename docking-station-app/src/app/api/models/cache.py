from sqlmodel import Field, SQLModel

__all__ = [
    'FastAPICacheItem',
]


class FastAPICacheItem(SQLModel, table=True):
    __tablename__ = 'fast_api_cache'

    key: str = Field(primary_key=True)
    data: str
    ttl_ts: int
