from typing import TypedDict

__all__ = [
    'MessageDict',
]


class MessageDict(TypedDict):
    stage: str
    payload: None | list[str] = None
