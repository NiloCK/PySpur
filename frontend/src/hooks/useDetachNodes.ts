import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setNodes } from '../store/flowSlice';

function useDetachNodes() {
  const dispatch = useDispatch();
  const nodes = useSelector(state => state.flow.nodes);

  const detachNodes = useCallback(
    (ids: string[], removeParentId?: string) => {
      const updatedNodes = nodes.map(node => {
        if (ids.includes(node.id) && node.parentNode) {
          const parentNode = nodes.find(n => n.id === node.parentNode);
          return {
            ...node,
            position: {
              x: node.position.x + (parentNode?.position.x ?? 0),
              y: node.position.y + (parentNode?.position.y ?? 0),
            },
            extent: undefined,
            parentNode: undefined,
          };
        }
        return node;
      });

      dispatch(setNodes({
        nodes: updatedNodes.filter(n => !removeParentId || n.id !== removeParentId)
      }));
    },
    [dispatch, nodes]
  );

  return detachNodes;
}

export default useDetachNodes;
