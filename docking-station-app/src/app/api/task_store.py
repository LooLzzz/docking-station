from dataclasses import dataclass, field
from datetime import datetime, timedelta
from threading import Thread
from typing import Literal, NewType, NotRequired, TypedDict, Unpack

from .schemas import MessageDict
from .utils import Singleton

StackStr = NewType('StackStr', str)
_ServiceStr = NewType('_ServiceStr', str)
ServiceStr = _ServiceStr | Literal['*']
StoreKey = tuple[StackStr, ServiceStr]
MessageList = list[MessageDict]


class TaskStoreItemDict(TypedDict):
    worker: Thread
    messages: NotRequired[list[MessageDict]]
    timestamp: NotRequired[datetime]


@dataclass
class TaskStoreItem:
    worker: Thread | None = None
    messages: list[MessageDict] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

    def append_message(self, value: MessageDict):
        self.messages.append(value)
        self.timestamp = datetime.now()
        return self.messages

    def is_worker_alive(self):
        return (
            self.worker is not None
            and self.worker.is_alive()
        )

    def join(self):
        return self.worker.join()

    def start(self):
        if self.worker:
            return self.worker.start()
        raise ValueError('Worker not set')


@dataclass
class TaskStore(metaclass=Singleton):
    ttl: timedelta = field(default_factory=lambda: timedelta(minutes=10))
    _store: dict[StoreKey, TaskStoreItem] = field(default_factory=dict)

    def __contains__(self, key: StoreKey):
        return (
            key in self._store
            or (key[0], '*') in self._store
        )

    def __getitem__(self, key: StoreKey):
        item = None
        if key in self._store:
            item = self._store[key]
        if (key[0], '*') in self._store:
            item = self._store[(key[0], '*')]

        if (not item
                or datetime.now() - item.timestamp > self.ttl):
            self._store.pop(key, None)
            raise KeyError(key)

        return item

    def __setitem__(self, key: StoreKey, value: TaskStoreItemDict | TaskStoreItem):
        if isinstance(value, dict):
            value = TaskStoreItem(**value)
        self._store[key] = value

    def get(self, key: tuple[StackStr, ServiceStr], default: TaskStoreItem | None = None):
        try:
            return self[key]
        except KeyError:
            return default

    def insert(self, key: StoreKey, **kwargs: Unpack[TaskStoreItemDict]):
        self[key] = kwargs
        return self[key]
