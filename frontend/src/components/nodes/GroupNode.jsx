import React, { memo } from 'react';
import { NodeToolbar } from '@xyflow/react';
import useDetachNodes from '../../hooks/useDetachNodes';
import { useDispatch } from 'react-redux';
import { deleteNode } from '../../store/flowSlice';

function GroupNode({ id, data }) {
  const detachNodes = useDetachNodes();
  const dispatch = useDispatch();

  const onDelete = () => {
    dispatch(deleteNode({ nodeId: id }));
  };

  const onDetach = () => {
    // Get all child nodes of this group
    const childNodeIds = data.childNodes || [];
    detachNodes(childNodeIds, id);
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-gray-50/50 w-full h-full min-w-[100px] min-h-[100px]">
      <NodeToolbar className="nodrag">
        <button
          onClick={onDelete}
          className="px-2 py-1 bg-red-500 text-white rounded mr-2"
        >
          Delete
        </button>
        <button
          onClick={onDetach}
          className="px-2 py-1 bg-blue-500 text-white rounded"
        >
          Ungroup
        </button>
      </NodeToolbar>
      {data.label && (
        <div className="p-2 text-sm text-gray-600">
          {data.label}
        </div>
      )}
    </div>
  );
}

export default memo(GroupNode);
