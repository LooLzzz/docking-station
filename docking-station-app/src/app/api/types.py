from datetime import timedelta
from typing import Annotated

from pydantic import BeforeValidator
from pytimeparse.timeparse import timeparse

from .utils import tryparse_float

__all__ = [
    'Interval',
]


def _validate_interval(value):
    match value:
        case str() if (v := tryparse_float(value)) is not None:
            return timedelta(seconds=v)
        case str():
            return timedelta(seconds=timeparse(value))
        case int() | float():
            return timedelta(seconds=value)
    return value


Interval = Annotated[timedelta, BeforeValidator(_validate_interval)]
