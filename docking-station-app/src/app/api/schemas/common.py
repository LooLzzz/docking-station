from pydantic import AliasGenerator, BaseModel, ConfigDict, RootModel

from .utils import snake_case_to_camel_case, snake_case_to_pascal_case

__all__ = [
    'AliasedBaseModel',
    'CamelCaseAliasedBaseModel',
    'IterableRootModel',
]


class AliasedBaseModel(BaseModel):
    """
    Base model with alias for:
    - Validations (`utils.snake_case_to_pascal_case()`)
    - Serializations (`utils.snake_case_to_camel_case()`)
    """

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=AliasGenerator(
            validation_alias=snake_case_to_pascal_case,
            serialization_alias=snake_case_to_camel_case,
        )
    )


class CamelCaseAliasedBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=snake_case_to_camel_case,
    )


class IterableRootModel(RootModel):
    def __iter__(self):
        return iter(self.root)

    def __getitem__(self, item):
        return self.root[item]
