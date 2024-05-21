from pydantic import (AliasChoices, AliasGenerator, BaseModel, ConfigDict,
                      RootModel)
from pydantic.alias_generators import to_camel, to_pascal

__all__ = [
    'AliasedBaseModel',
    'CamelCaseAliasedBaseModel',
    'IterableRootModel',
]


class AliasedBaseModel(BaseModel):
    """
    Base model with alias for:
    - Validations (`pydantic.alias_generators.to_pascal()`)
    - Serializations (`pydantic.alias_generators.to_camel()`)
    """

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=AliasGenerator(
            validation_alias=lambda x: AliasChoices(to_pascal(x), to_camel(x)),
            serialization_alias=to_camel,
        )
    )


class CamelCaseAliasedBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class IterableRootModel(RootModel):
    def __iter__(self):
        return iter(self.root)

    def __getitem__(self, item):
        return self.root[item]
