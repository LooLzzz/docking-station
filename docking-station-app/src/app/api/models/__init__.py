import orjson
from sqlmodel import SQLModel, create_engine

from .cache import *

db_path = '/app/data/db.db'
engine = create_engine(
    url='sqlite:///' + db_path,
    json_serializer=lambda x: orjson.dumps(x, default=str, option=orjson.OPT_NAIVE_UTC).decode(),
    json_deserializer=orjson.loads,
)
SQLModel.metadata.create_all(engine)
