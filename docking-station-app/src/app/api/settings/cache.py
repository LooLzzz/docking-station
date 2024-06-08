import inspect
import logging
import sys
import time
from functools import wraps
from typing import Any, Awaitable, Callable, Optional, Type, TypeVar

from fastapi import Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi_cache import FastAPICache
from fastapi_cache.backends import Backend
from fastapi_cache.coder import Coder
from pydantic import BaseModel
from sqlmodel import Session, col, delete

from ..models import FastAPICacheItem, engine

if sys.version_info >= (3, 10):
    from typing import ParamSpec
else:
    from typing_extensions import ParamSpec

logger = logging.getLogger(__name__)
P = ParamSpec('P')
R = TypeVar('R')

__all__ = [
    'cache_key_builder',
    'cached',
    'SQLiteBackend',
]


def cache_key_builder(func: Callable,
                      prefix: str = '',
                      namespace: str = '',
                      request: Request = None,
                      response: Response = None,
                      args: tuple = None,
                      kwargs: dict = None):
    args = args or ()
    kwargs = kwargs or {}
    kwargs_items = sorted(kwargs.items(), key=lambda x: x[0])
    args_values = [
        *[f'{a!r}' for a in args],
        *[f'{k}={v!r}' for k, v in kwargs_items],
    ]
    args_str = ', '.join(args_values)

    key = f'{func.__module__}.{func.__name__}({args_str})'
    if namespace:
        key = f'{namespace}.{key}'
    return f'{prefix}{key}'


def cached(expire: Optional[int] = None,
           coder: Optional[Type[Coder]] = None,
           key_builder: Optional[Callable[..., Any]] = None,
           namespace: Optional[str] = '',
           return_type: Optional[type[BaseModel]] = None) -> Callable[[Callable[P, Awaitable[R]]], Callable[P, Awaitable[R]]]:

    def wrapper(func: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
        signature = inspect.signature(func)
        no_cache_param = next(
            (param for param in signature.parameters.values() if param.name == 'no_cache'),
            None,
        )
        request_param = next(
            (param for param in signature.parameters.values() if param.annotation is Request),
            None,
        )
        response_param = next(
            (param for param in signature.parameters.values() if param.annotation is Response),
            None,
        )
        parameters = []
        extra_params = []
        for p in signature.parameters.values():
            if p.kind <= inspect.Parameter.KEYWORD_ONLY:
                parameters.append(p)
            else:
                extra_params.append(p)
        if not no_cache_param:
            parameters.append(
                inspect.Parameter(
                    name='no_cache',
                    annotation=bool,
                    default=False,
                    kind=inspect.Parameter.KEYWORD_ONLY,
                ),
            )
        if not request_param:
            parameters.append(
                inspect.Parameter(
                    name="request",
                    annotation=Request,
                    kind=inspect.Parameter.KEYWORD_ONLY,
                ),
            )
        if not response_param:
            parameters.append(
                inspect.Parameter(
                    name="response",
                    annotation=Response,
                    kind=inspect.Parameter.KEYWORD_ONLY,
                ),
            )
        parameters.extend(extra_params)
        if parameters:
            signature = signature.replace(parameters=parameters)
        func.__signature__ = signature

        @wraps(func)
        async def inner(*args: P.args, **kwargs: P.kwargs) -> R:
            nonlocal coder
            nonlocal expire
            nonlocal key_builder
            nonlocal return_type

            async def ensure_async_func(*args: P.args, **kwargs: P.kwargs) -> R:
                """Run cached sync functions in thread pool just like FastAPI."""
                # if the wrapped function does NOT have request or response in its function signature,
                # make sure we don't pass them in as keyword arguments
                if not no_cache_param:
                    kwargs.pop("no_cache", None)
                if not request_param:
                    kwargs.pop("request", None)
                if not response_param:
                    kwargs.pop("response", None)

                if inspect.iscoroutinefunction(func):
                    # async, return as is.
                    # unintuitively, we have to await once here, so that caller
                    # does not have to await twice. See
                    # https://stackoverflow.com/a/59268198/532513
                    return await func(*args, **kwargs)
                else:
                    # sync, wrap in thread and return async
                    # see above why we have to await even although caller also awaits.
                    return await run_in_threadpool(func, *args, **kwargs)

            coder = coder or FastAPICache.get_coder()
            expire = expire or FastAPICache.get_expire()
            key_builder = key_builder or FastAPICache.get_key_builder()
            copy_kwargs = kwargs.copy()
            no_cache: bool = copy_kwargs.pop("no_cache", False)
            request: Optional[Request] = copy_kwargs.pop("request", None)
            response: Optional[Response] = copy_kwargs.pop("response", None)
            backend = FastAPICache.get_backend()
            insp = inspect.signature(func)
            return_type = return_type or insp.return_annotation
            # cache_control = request.headers.get('Cache-Control') if request else None

            no_store = (
                request is not None and 'no_store' in request.query_params
            )
            no_cache = (
                no_cache or no_store
                or (request is not None and 'no_cache' in request.query_params)
            )

            if inspect.iscoroutinefunction(key_builder):
                cache_key = await key_builder(
                    func,
                    namespace,
                    request=request,
                    response=response,
                    args=args,
                    kwargs=copy_kwargs,
                )
            else:
                cache_key = key_builder(
                    func,
                    namespace,
                    request=request,
                    response=response,
                    args=args,
                    kwargs=copy_kwargs,
                )

            if (
                no_cache
                    or no_store
                    or not FastAPICache.get_enable()
            ):
                ret = await ensure_async_func(*args, **kwargs)
                if not no_store:
                    await backend.set(cache_key, coder.encode(ret), expire)
                return ret

            try:
                ttl, ret = await backend.get_with_ttl(cache_key)
            except Exception:
                logger.warning(
                    f"Error retrieving cache key '{cache_key}' from backend:", exc_info=True
                )
                ttl, ret = 0, None
            if not request:
                if ret is not None:
                    ret = coder.decode(ret)
                    if return_type and issubclass(return_type, BaseModel):
                        return return_type.model_validate(ret)
                    return ret

                ret = await ensure_async_func(*args, **kwargs)
                try:
                    await backend.set(cache_key, coder.encode(ret), expire)
                except Exception:
                    logger.warning(
                        f"Error setting cache key '{cache_key}' in backend:", exc_info=True
                    )
                return ret

            if request.method != "GET":
                return await ensure_async_func(request, *args, **kwargs)

            if_none_match = request.headers.get("if-none-match")
            if ret is not None:
                if response:
                    # response.headers["Cache-Control"] = f"max-age={ttl}"
                    etag = f"W/{hash(ret)}"
                    if if_none_match == etag:
                        response.status_code = 304
                        return response
                    response.headers["ETag"] = etag
                ret = coder.decode(ret)
                if return_type and issubclass(return_type, BaseModel):
                    return return_type.model_validate(ret)
                return ret

            ret = await ensure_async_func(*args, **kwargs)
            encoded_ret = coder.encode(ret)

            try:
                await backend.set(cache_key, encoded_ret, expire)
            except Exception:
                logger.warning(f"Error setting cache key '{cache_key}' in backend:", exc_info=True)

            # response.headers["Cache-Control"] = f"max-age={expire}"
            etag = f"W/{hash(encoded_ret)}"
            response.headers["ETag"] = etag
            return ret

        return inner

    return wrapper


class SQLiteBackend(Backend):

    @staticmethod
    def _now():
        return int(time.time())

    def _get(self, key: str):
        with Session(engine) as session:
            if obj := session.get(FastAPICacheItem, key):
                if obj.ttl_ts < self._now():
                    session.delete(obj)
                    session.commit()
                else:
                    return obj
            return None

    async def get_with_ttl(self, key: str) -> tuple[int, str | None]:
        if obj := self._get(key):
            return obj.ttl_ts - self._now(), obj.data
        return 0, None

    async def get(self, key: str):
        if obj := self._get(key):
            return obj.data
        return None

    async def set(self, key: str, value: str, expire: int = None):
        """set or upsert a cache item in the database."""

        ttl_ts = self._now() + (expire or 0)
        with Session(engine) as session:
            if obj := session.get(FastAPICacheItem, key):
                obj.data = value
                obj.ttl_ts = ttl_ts
            else:
                obj = FastAPICacheItem(key=key,
                                       data=value,
                                       ttl_ts=ttl_ts)

            session.add(obj)
            session.commit()
            session.refresh(obj)
            return obj

    async def clear(self, namespace: str = None, key: str = None) -> int:
        query = None
        count = 0

        with Session(engine) as session:
            if namespace:
                query = (
                    delete(FastAPICacheItem)
                    .where(
                        col(FastAPICacheItem.key).startswith(namespace)
                    )
                )
            elif key:
                query = (
                    delete(FastAPICacheItem)
                    .where(
                        col(FastAPICacheItem.key) == key
                    )
                )

            if query is not None:
                result = session.exec(query)
                session.commit()
                count = result.rowcount

        return count
