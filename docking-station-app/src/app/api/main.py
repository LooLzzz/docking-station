import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from . import routes


async def not_found(request: Request, exc: Exception):
    return JSONResponse(
        {
            'error': str(exc),
        },
        status_code=400,
    )


async def server_error(request: Request, exc: Exception):
    tb = traceback.format_exc()
    return JSONResponse(
        {
            'error': str(exc),
            'traceback': tb,
        },
        status_code=500,
    )


app = FastAPI(
    exception_handlers={
        404: not_found,
        500: server_error,
    },
)
app.include_router(routes.root_router, prefix='/api')
