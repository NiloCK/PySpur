from abc import ABC, abstractmethod
from typing import Any, Dict, Type

from pydantic import BaseModel, ValidationError, create_model

from ..schemas.io_schema import IOSchema


class BaseNode(ABC):
    """
    Base class for all nodes.
    """

    name: str

    config_model: Type[BaseModel]
    input_model: Type[BaseModel]
    output_model: Type[BaseModel]

    _config: Any

    def __init__(self, config: Any) -> None:
        self._config = config
        self.setup()

    @abstractmethod
    def setup(self) -> None:
        """
        Setup method to define `config_model`, `input_model`, and `output_model`.
        For dynamic schemas, these can be created based on `self.config`.
        """

    async def __call__(self, input_data: Any) -> BaseModel:
        """
        Validates `input_data` against `input_model`, runs the node's logic,
        and validates the output against `output_model`.
        """
        try:
            input_validated = self.input_model.model_validate(input_data.model_dump())
        except ValidationError as e:
            raise ValueError(f"Input data validation error in {self.name}: {e}")
        except AttributeError:
            input_validated = self.input_model.model_validate(input_data)

        result = await self.run(input_validated)

        try:
            output_validated = self.output_model.model_validate(result.model_dump())
        except ValidationError as e:
            raise ValueError(f"Output data validation error in {self.name}: {e}")

        return output_validated

    @abstractmethod
    async def run(self, input_data: Any) -> Any:
        """
        Abstract method where the node's core logic is implemented.
        Should return an instance compatible with `output_model`.
        """
        pass

    @property
    def config(self) -> Any:
        """
        Return the node's configuration.
        """
        if isinstance(self._config, Dict):
            return self.config_model.model_validate(self._config)  # type: ignore
        return self.config_model.model_validate(self._config.model_dump())

    @classmethod
    def get_model_for_io_schema(
        cls,
        schema: IOSchema,
        schema_name: str,
        base_model: Type[BaseModel] = BaseModel,
    ) -> Type[BaseModel]:
        """
        Create a Pydantic model from a schema dictionary.
        """
        schema_processed: Dict[str, Type[Any]] = {}
        for field_name, field_type in schema.model_dump().items():
            type_class = field_type.value
            schema_processed[field_name] = type_class

        schema_type_dict = {k: (v, ...) for k, v in schema_processed.items()}
        return create_model(
            schema_name,
            **schema_type_dict,  # type: ignore
            __base__=base_model,
        )

    @classmethod
    def get_model_for_schema_dict(
        cls,
        schema: Dict[str, str],
        schema_name: str,
        base_model: Type[BaseModel] = BaseModel,
    ) -> Type[BaseModel]:
        """
        Create a Pydantic model from a schema dictionary.
        """
        schema_type_dict = {k: (v, ...) for k, v in schema.items()}
        return create_model(
            schema_name,
            **schema_type_dict,  # type: ignore
            __base__=base_model,
        )

    @classmethod
    def get_model_for_value_dict(
        cls,
        values: Dict[str, Any],
        schema_name: str,
        base_model: Type[BaseModel] = BaseModel,
    ) -> Type[BaseModel]:
        """
        Create a Pydantic model from a dictionary of values.
        """
        schema = {k: type(v).__name__ for k, v in values.items()}
        return cls.get_model_for_schema_dict(schema, schema_name, base_model)
