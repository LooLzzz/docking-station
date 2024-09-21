from datetime import timedelta
from typing import Annotated

from pydantic import BeforeValidator, PlainSerializer
from pytimeparse.timeparse import timeparse

from .utils import tryparse_float

__all__ = [
    'Interval',
    'SingletonMetaclass',
]


class SingletonMetaclass(type):
    def __init__(cls, name, bases, dict):
        super().__init__(name, bases, dict)
        cls._instance = None

    def __call__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__call__(*args, **kwargs)
        return cls._instance


def _validate_interval(value):
    match value:
        case str() if (v := tryparse_float(value)) is not None:
            return timedelta(seconds=v)
        case str():
            return timedelta(seconds=timeparse(value))
        case int() | float():
            return timedelta(seconds=value)
    return value


def _timedelta_to_seconds(value: timedelta):
    match value:
        case timedelta():
            return value.total_seconds()
        case _:
            return value


Interval = Annotated[timedelta,
                     PlainSerializer(_timedelta_to_seconds, when_used='unless-none'),
                     BeforeValidator(_validate_interval)]
