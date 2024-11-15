from pydantic import BaseModel
from ..base import BaseNode

class ConditionalNodeInput(BaseModel):
    condition_value: bool  # Replace 'bool' with the appropriate type for your condition

class ConditionalNodeOutput(BaseModel):
    path: str  # For example, 'true' or 'false'

class ConditionalNode(BaseNode):
    name = "ConditionalNode"
    input_model = ConditionalNodeInput
    output_model = ConditionalNodeOutput

    async def __call__(self, input_data: ConditionalNodeInput) -> ConditionalNodeOutput:
        if input_data.condition_value:
            return ConditionalNodeOutput(path='true')
        else:
            return ConditionalNodeOutput(path='false')