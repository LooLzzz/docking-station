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
    ttl: timedelta = field(default_factory=lambda: timedelta(seconds=5))
    _store: dict[StoreKey, TaskStoreItem] = field(default_factory=dict)

    def __contains__(self, key: StoreKey):
        return bool(
            self.get(key, None)
        )

    def __getitem__(self, key: StoreKey):
        if item := self.get(key, None):
            return item
        raise KeyError(key)

    def __setitem__(self, key: StoreKey, item: TaskStoreItem | TaskStoreItemDict):
        print('creating', key)

        match item:
            case dict():
                self.create_task(key, **item)
            case TaskStoreItem():
                self._store[key] = item
            case _:
                raise ValueError('Invalid type')

    def get(self, key: tuple[StackStr, ServiceStr], default: TaskStoreItem | None = None):
        item = None
        if key in self._store:
            item = self._store[key]
        if (key[0], '*') in self._store:
            item = self._store[(key[0], '*')]

        if (not item or (not item.is_worker_alive()
                         and datetime.now() - item.timestamp > self.ttl)):
            print('deleting', key)
            self._store.pop(key, None)
            return default

        return item

    def create_task(self, key: StoreKey, **kwargs: Unpack[TaskStoreItemDict]):
        item = TaskStoreItem(**kwargs)
        self._store[key] = item
        return item
