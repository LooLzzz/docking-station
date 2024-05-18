from datetime import datetime

from .common import AliasedBaseModel

__all__ = [
    'ListImagesResponseItem',
]


class ListImagesResponseItem(AliasedBaseModel):
    id: str
    repo_tags: list[str]
    repo_digests: list[str]
    created_at: datetime
