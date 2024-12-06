from .base_loop_node import BaseLoopNode, BaseLoopNodeConfig


class FixedIterationLoopNodeConfig(BaseLoopNodeConfig):
    iterations: int = 5


class FixedIterationLoopNode(BaseLoopNode):
    name = "fixed_n_loop_node"
    config_model = FixedIterationLoopNodeConfig

    async def stopping_condition(self) -> bool:
        return self._iter_count >= self.config.iterations
