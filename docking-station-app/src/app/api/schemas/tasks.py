from typing import NotRequired, TypedDict

from .common import CamelCaseAliasedBaseModel

__all__ = [
    'MessageDict',
    'MessageDictResponse',
]


class MessageDict(TypedDict):
    stage: str
    payload: NotRequired[None | str] = None


class MessageDictResponse(CamelCaseAliasedBaseModel):
    stage: str
    payload: None | str = None
