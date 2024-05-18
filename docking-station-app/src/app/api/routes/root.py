from fastapi import APIRouter, status

router = APIRouter()


@router.get('/', status_code=status.HTTP_418_IM_A_TEAPOT)
def read_root():
    return {'message': 'Hello World'}


@router.get('/items/{item_id}')
def read_item(item_id: int, q: str | None = None):
    return {
        'item_id': item_id,
        'q': q,
    }
