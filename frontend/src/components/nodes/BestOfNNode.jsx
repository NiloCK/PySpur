import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import BaseNode from './BaseNode';
import OutputDisplayNode from './OutputDisplayNode';
import styles from './BestOfNNode.module.css';

const BestOfNNode = ({ id, data, ...props }) => {
  const nodeRef = useRef(null);
  const [nodeWidth, setNodeWidth] = useState('auto');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tasks = useSelector((state) => state.flow.tasks);

  // Get the task associated with this node
  const task = tasks.find((t) => t.node_id === id);

  console.log('BestOfNNode - Node ID:', id);
  console.log('BestOfNNode - Task:', task);

  // Extract subworkflow and outputs
  const subworkflow = task?.subworkflow;
  const subworkflowOutput = task?.subworkflow_output;

  console.log('BestOfNNode - Subworkflow:', subworkflow);
  console.log('BestOfNNode - Subworkflow Output:', subworkflowOutput);

  const [subNodes, setSubNodes] = useState([]);

  useEffect(() => {
    if (subworkflow) {
      const nodes = subworkflow.nodes.map((node) => {
        console.log('Processing subworkflow node:', node);
        return {
          ...node,
          id: node.id,
          data: {
            ...node.config,
            title: node.title,
            config: node.config,
            run: subworkflowOutput[node.id],
          },
          position: node.coordinates || { x: 0, y: 0 },
          type: node.node_type,
          parentNode: id,
          extent: 'parent',
        };
      });

      console.log('BestOfNNode - SubNodes:', nodes);
      setSubNodes(nodes);
    } else {
      console.log('BestOfNNode - No subworkflow found for this node.');
    }
  }, [subworkflow, id]);

  // Group nodes by type
  const groupedNodes = {};
  subNodes.forEach((node) => {
    const nodeType = node.type;
    if (!groupedNodes[nodeType]) {
      groupedNodes[nodeType] = [];
    }
    groupedNodes[nodeType].push(node);
  });

  console.log('BestOfNNode - Grouped Nodes:', groupedNodes);

  return (
    <div className={styles.bestOfNNodeWrapper}>
      <BaseNode
        id={id}
        data={data}
        style={{
          width: nodeWidth,
          minHeight: '200px',
          backgroundColor: '#f0f0f0',
        }}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        selected={props.selected}
      >
        <div className={styles.nodeWrapper} ref={nodeRef}>
          <strong>{data.title || 'BestOfNNode'}</strong>
          {!isCollapsed && (
            <div className={styles.subworkflowContainer}>
              {Object.keys(groupedNodes).map((type) => (
                <div key={type} className={styles.subworkflowColumn}>
                  <h4>{type}</h4>
                  {groupedNodes[type].map((subNode) => (
                    <div key={subNode.id} className={styles.subNode}>
                      <OutputDisplayNode
                        id={subNode.id}
                        data={subNode.data}
                        type={subNode.type}
                        parentNode={id}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
      </BaseNode>
    </div>
  );
};

export default BestOfNNode;
