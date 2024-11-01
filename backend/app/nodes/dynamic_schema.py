from abc import ABC

from .base import BaseNode


class DynamicSchemaNode(BaseNode, ABC):
    """Base class for nodes with dynamic input/output schemas."""

    def setup(self) -> None:
        """Set up dynamic input/output models based on configuration."""
        # Assumes self.config is an instance of config_model
        self.input_model = self.get_model_for_io_schema(
            schema=self.config.input_schema,
            schema_name=f"{self.name}Input",
        )

        self.output_model = self.get_model_for_io_schema(
            schema=self.config.output_schema,
            schema_name=f"{self.name}Output",
        )
