import traceback
from contextlib import asynccontextmanager
from logging.config import dictConfig

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import ValidationException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_cache import FastAPICache
from pydantic import ValidationError

from . import routes
from .settings import ServerLogSettings, SQLiteBackend, cache_key_builder, get_app_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    dictConfig(ServerLogSettings().model_dump())
    FastAPICache.init(
        backend=SQLiteBackend(),
        key_builder=cache_key_builder,
    )
    yield

app_settings = get_app_settings()
app = FastAPI(
    title='Docking Station API',
    lifespan=lifespan,
)
app.include_router(routes.root_router, prefix='/api')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=['*'],
    allow_methods=['*'],
    allow_origins=['*'],
)


@app.exception_handler(404)
async def not_found(request: Request, exc: Exception):
    resp = {'message': str(exc)}

    match exc:
        case HTTPException():
            resp['message'] = exc.detail

    return JSONResponse(
        content=resp,
        status_code=404,
    )


@app.exception_handler(500)
@app.exception_handler(ValidationError)
async def server_error(request: Request, exc: Exception):
    status_code = 500
    resp = {'message': str(exc)}

    if app_settings.node_env == 'development':
        resp['traceback'] = traceback.format_exc()

    match exc:
        case ValidationException():
            resp['message'] = str(exc).split('\n', 1)[0].strip(':')
            resp['errors'] = exc.errors()
            if 'Request' in type(exc).__name__:
                status_code = 400

        case ValidationError():
            resp['message'] = exc.title
            resp['errors'] = exc.errors()
            if 'Request' in type(exc).__name__:
                status_code = 400

    return JSONResponse(
        content=resp,
        status_code=status_code,
    )
