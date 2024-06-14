from typing import NotRequired, TypedDict

from .common import CamelCaseAliasedBaseModel

__all__ = [
    'MessageDict',
    'MessageDictResponse',
]


class MessageDict(TypedDict):
    stage: str
    message: NotRequired[None | str] = None


class MessageDictResponse(CamelCaseAliasedBaseModel):
    stage: str
    message: None | str = None
