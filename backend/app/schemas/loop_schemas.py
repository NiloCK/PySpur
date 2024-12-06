from .workflow_schemas import WorkflowDefinitionSchema, WorkflowNodeSchema
from pydantic import field_validator
from typing import List


class LoopSubworkflowDefinitionSchema(WorkflowDefinitionSchema):
    @field_validator("nodes")
    def os_must_include_is(cls, v: List[WorkflowNodeSchema]):
        input_node = next(node for node in v if node.node_type == "InputNode")
        output_node = next(node for node in v if node.node_type == "OutputNode")
        input_schema = input_node.config["input_schema"]
        output_schema = output_node.config["output_schema"]
        assert all(
            field in output_schema for field in input_schema
        ), "Output schema must include all fields from input schema."
        return v
