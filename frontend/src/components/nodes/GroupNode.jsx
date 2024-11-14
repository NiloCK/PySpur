import React, { memo } from 'react';
import { NodeToolbar, NodeResizer } from '@xyflow/react';
import { useSelector, useDispatch } from 'react-redux';
import BaseNode from './BaseNode';
import useDetachNodes from '../../hooks/useDetachNodes';
import { deleteNode } from '../../store/flowSlice';

const lineStyle = { borderColor: 'white' };

const GroupNode = ({ id, data, selected }) => {
  const dispatch = useDispatch();
  const detachNodes = useDetachNodes();

  // Get child nodes from the store
  const childNodes = useSelector((state) =>
    state.flow.nodes.filter(node => node.parentNode === id)
  );

  const hasChildNodes = childNodes.length > 0;

  const onDelete = () => {
    dispatch(deleteNode({ nodeId: id }));
  };

  const onDetach = () => {
    const childNodeIds = childNodes.map(node => node.id);
    detachNodes(childNodeIds, id);
  };

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        title: data?.title || 'Group',
        acronym: 'GRP',
        color: '#666666'
      }}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 200,
        minHeight: 200,
        background: 'rgba(255, 255, 255, 0.1)',
      }}
      selected={selected}
    >
      <NodeResizer
        lineStyle={lineStyle}
        minHeight={200}
        minWidth={200}
        isVisible={selected}
      />
      <NodeToolbar className="nodrag">
        <button onClick={onDelete}>Delete</button>
        {hasChildNodes && <button onClick={onDetach}>Ungroup</button>}
      </NodeToolbar>
    </BaseNode>
  );
};

export default memo(GroupNode);
