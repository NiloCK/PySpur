from typing import Dict, Any, Optional, List, Union, Literal
from pydantic import BaseModel, Field
from enum import Enum

from ..dynamic_schema import DynamicSchemaNode, DynamicSchemaNodeConfig


class ComparisonOperator(str, Enum):
    CONTAINS = "contains"
    EQUALS = "equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    STARTS_WITH = "starts_with"
    NOT_STARTS_WITH = "not_starts_with"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    NUMBER_EQUALS = "number_equals"


LogicalOperator = Literal["AND", "OR"]


class Condition(BaseModel):
    """Configuration for a single condition"""
    variable: str
    operator: ComparisonOperator = Field(default=ComparisonOperator.CONTAINS)
    value: Any
    logicalOperator: Optional[LogicalOperator] = Field(default="AND")


class BranchCondition(BaseModel):
    """Configuration for a branch with multiple conditions"""
    conditions: List[Condition]


class IfElseNodeConfig(DynamicSchemaNodeConfig):
    """Configuration for the if-else node."""
    branches: List[BranchCondition]
    input_schema: Dict[str, str] = {"input": "any"}  # The input data to be routed
    output_schema: Dict[str, str] = Field(
        default_factory=dict
    )  # Will be dynamically populated


class IfElseNodeInput(BaseModel):
    """Input model for the if-else node."""
    input: Dict[str, Any]  # The input data to be routed, now expecting a dictionary of variables


class IfElseNodeOutput(BaseModel):
    """Output model for the if-else node."""
    outputs: Dict[str, Any] = Field(default_factory=dict)


class IfElseNode(DynamicSchemaNode):
    """
    A routing node that directs input data to different branches
    based on the evaluation of multiple conditions per branch. The first branch acts as the default
    if no other conditions match.
    """

    name = "if_else_node"
    display_name = "If-Else"
    config_model = IfElseNodeConfig

    def _evaluate_single_condition(
        self, input_value: Any, condition: Condition
    ) -> bool:
        """Evaluate a single condition against a specific input variable"""
        try:
            # Get the variable value from input
            if not condition.variable:
                return False

            variable_value = input_value.get(condition.variable)
            if variable_value is None:
                return False

            if condition.operator == ComparisonOperator.CONTAINS:
                return str(condition.value) in str(variable_value)
            elif condition.operator == ComparisonOperator.EQUALS:
                return str(variable_value) == str(condition.value)
            elif condition.operator == ComparisonOperator.NUMBER_EQUALS:
                return float(variable_value) == float(condition.value)
            elif condition.operator == ComparisonOperator.GREATER_THAN:
                return float(variable_value) > float(condition.value)
            elif condition.operator == ComparisonOperator.LESS_THAN:
                return float(variable_value) < float(condition.value)
            elif condition.operator == ComparisonOperator.STARTS_WITH:
                return str(variable_value).startswith(str(condition.value))
            elif condition.operator == ComparisonOperator.NOT_STARTS_WITH:
                return not str(variable_value).startswith(str(condition.value))
            elif condition.operator == ComparisonOperator.IS_EMPTY:
                return not bool(variable_value)
            elif condition.operator == ComparisonOperator.IS_NOT_EMPTY:
                return bool(variable_value)
            return False
        except (ValueError, TypeError, AttributeError):
            return False

    def _evaluate_branch_conditions(
        self, input_value: Dict[str, Any], branch: BranchCondition
    ) -> bool:
        """Evaluate all conditions in a branch with support for AND/OR logic"""
        if not branch.conditions:
            return True

        # First condition is always evaluated
        result = self._evaluate_single_condition(input_value, branch.conditions[0])

        # Evaluate subsequent conditions with their logical operators
        for i in range(1, len(branch.conditions)):
            condition = branch.conditions[i]
            current_result = self._evaluate_single_condition(input_value, condition)

            if condition.logicalOperator == "OR":
                result = result or current_result
            else:  # AND is default
                result = result and current_result

        return result

    async def run(self, input_data: IfElseNodeInput) -> IfElseNodeOutput:
        """
        Evaluates conditions and routes the input data to the matching branch.
        The first branch acts as the default if no other conditions match.
        """
        outputs = {}
        input_value = input_data.input

        # Always route to first branch if it's the only one
        if len(self.config.branches) == 1:
            outputs["branch1"] = input_value
            return IfElseNodeOutput(outputs=outputs)

        # Evaluate conditions for all branches except the first one
        matched = False
        for i, branch in enumerate(self.config.branches[1:], 2):
            if self._evaluate_branch_conditions(input_value, branch):
                outputs[f"branch{i}"] = input_value
                matched = True
                break

        # If no other conditions matched, route to the first branch
        if not matched:
            outputs["branch1"] = input_value

        return IfElseNodeOutput(outputs=outputs)

    def initialize(self) -> None:
        """Initialize the node and set up the output schema"""
        # Build output schema based on branch configurations
        output_schema = {}
        for i in range(len(self.config.branches)):
            output_schema[f"branch{i + 1}"] = "any"

        self.config.output_schema = output_schema
