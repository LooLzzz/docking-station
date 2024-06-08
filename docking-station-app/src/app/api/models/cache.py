from datetime import datetime

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

__all__ = [
    'FastAPICacheItem',
]


class FastAPICacheItem(SQLModel, table=True):
    __tablename__ = 'fast_api_cache'

    key: str = Field(primary_key=True)
    data: str
    ttl_ts: int

    created_at: datetime = Field(
        default=None,
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={'server_default': sa.func.now()},
        nullable=False,
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={'onupdate': sa.func.now(),
                          'server_default': sa.func.now()},
        nullable=False,
    )
