from abc import ABC, abstractmethod
from typing import Dict
from pydantic import BaseModel
from ..base import BaseNode
from ...execution.workflow_executor import WorkflowExecutor
from ...schemas.loop_schemas import LoopSubworkflowDefinitionSchema


class BaseLoopNodeConfig(BaseModel):
    input_schema: Dict[str, str] = {"default_input_1": "str"}
    output_schema: Dict[str, str] = {"default_output_1": "str"}
    subworkflow: LoopSubworkflowDefinitionSchema


class BaseLoopNodeInput(BaseModel):
    pass


class BaseLoopNodeOutput(BaseModel):
    pass


class BaseLoopNode(BaseNode, ABC):
    """
    Base class for all loop nodes.
    A loop is defined by an input node, an output node, and a subworkflow that is executed repeatedly until a stopping condition is met.
    The node's subworkflow property contains the rolled out subworkflow, that has nodes replicated for each iteration of the loop.
    The subworkflow_output property contains the output of the subworkflow.
    """

    name = "base_loop_node"
    config_model = BaseLoopNodeConfig
    input_model = BaseLoopNodeInput
    output_model = BaseLoopNodeOutput

    def setup(self) -> None:
        input_schema = self.config.input_schema
        output_schema = self.config.output_schema
        self.input_model = self.get_model_for_schema_dict(
            input_schema, f"{self.name}Input"
        )
        self.output_model = self.get_model_for_schema_dict(
            output_schema, f"{self.name}Output"
        )
        self.loop_subworkflow = LoopSubworkflowDefinitionSchema.model_validate(
            self.config.subworkflow
        )
        self._iter_count = 0
        self.subworkflow_output = {}

    def _extend_subworkflow(self) -> None:
        """
        Extend the subworkflow with additional nodes for the loop.
        1. Create a copy of the subworkflow.
        2. Give new IDs to the nodes in the copied subworkflow.
        3. Append the copied subworkflow to the original subworkflow using following rules:
            - Connect the handles
            - The last node of the copied subworkflow is connected to the first node of the original subworkflow.
        """
        if not self.loop_subworkflow:
            return
        current_iter_subworkflow = self.loop_subworkflow.model_copy(deep=True)

        # change the id of the incremental subworkflow nodes and update the links
        for node in current_iter_subworkflow.nodes:
            old_id = node.id
            node.id = f"{old_id}_{self._iter_count}"
            for link in current_iter_subworkflow.links:
                if link.source_id == old_id:
                    link.source_id = node.id
                if link.target_id == old_id:
                    link.target_id = node.id

        if self.subworkflow is None:
            self.subworkflow = current_iter_subworkflow
            return

        # connect the incoming links to the output node of the self.subworkflow, nodes that are connected to the input node of the current_iter_subworkflow
        old_output_node = next(
            node for node in self.subworkflow.nodes if node.node_type == "OutputNode"
        )
        input_node = next(
            node
            for node in current_iter_subworkflow.nodes
            if node.node_type == "InputNode"
        )

        for subworkflow_output_link in [
            l for l in self.subworkflow.links if l.target_id == old_output_node.id
        ]:
            # Find the corresponding link in the current_iter_subworkflow input_links
            for iter_subworkflow_input_link in [
                l
                for l in current_iter_subworkflow.links
                if l.source_id == input_node.id
            ]:

                if (
                    subworkflow_output_link.target_input_key
                    == iter_subworkflow_input_link.source_output_key
                ):
                    subworkflow_output_link.target_id = (
                        iter_subworkflow_input_link.target_id
                    )
                    subworkflow_output_link.target_input_key = (
                        iter_subworkflow_input_link.target_input_key
                    )

        # remove the input node from the current_iter_subworkflow and the corresponding link
        current_iter_subworkflow.nodes = [
            node
            for node in current_iter_subworkflow.nodes
            if node.node_type != "InputNode"
        ]
        current_iter_subworkflow.links = [
            link
            for link in current_iter_subworkflow.links
            if link.source_id != input_node.id
        ]

        # drop the old output node from the self.subworkflow
        self.subworkflow.nodes = [
            node for node in self.subworkflow.nodes if node.node_type != "OutputNode"
        ]
        self.subworkflow.links = [
            link
            for link in self.subworkflow.links
            if link.target_id != old_output_node.id
        ]

        # combine the subworkflows
        self.subworkflow.nodes.extend(current_iter_subworkflow.nodes)
        self.subworkflow.links.extend(current_iter_subworkflow.links)

    @abstractmethod
    async def stopping_condition(self) -> bool:
        pass

    async def run(self, input_data: BaseModel) -> BaseModel:
        while not await self.stopping_condition():
            self._extend_subworkflow()
            assert self.subworkflow is not None, "Subworkflow is not defined."
            assert (
                self.subworkflow_output is not None
            ), "Subworkflow output is not defined."
            executor = WorkflowExecutor(self.subworkflow)
            subworkflow_input_node = next(
                node for node in self.subworkflow.nodes if node.node_type == "InputNode"
            )
            subworkflow_output_node = next(
                node
                for node in self.subworkflow.nodes
                if node.node_type == "OutputNode"
            )
            post_iter_output = await executor.run_partial(
                subworkflow_output_node.id,
                rerun_predecessors=True,
                initial_inputs={subworkflow_input_node.id: input_data.model_dump()},
                partial_outputs={
                    k: v.model_dump() for k, v in self.subworkflow_output.items()
                },
            )
            self.subworkflow_output = post_iter_output
            self._iter_count += 1
        assert self.subworkflow is not None, "Subworkflow is not defined."
        output_node = next(
            node for node in self.subworkflow.nodes if node.node_type == "OutputNode"
        )
        assert self.subworkflow_output is not None, "Subworkflow output is not defined."
        return self.subworkflow_output[output_node.id]
