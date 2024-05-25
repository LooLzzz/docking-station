from datetime import timedelta
from typing import Annotated

from pydantic import BeforeValidator
from pytimeparse.timeparse import timeparse

__all__ = [
    'Interval',
]


def _validate_interval(value):
    match value:
        case str() if value.isdigit():
            return timedelta(seconds=int(value))
        case str():
            return timedelta(seconds=timeparse(value))
    return value


Interval = Annotated[timedelta, BeforeValidator(_validate_interval)]
