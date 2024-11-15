import React, { useState, useCallback } from 'react';
import { Handle } from '@xyflow/react';
import { useDispatch } from 'react-redux';
import DynamicNode from './DynamicNode';
import { updateNodeData } from '../../store/flowSlice';

const RouterNode = ({ id, data, ...props }) => {
  const [activePath, setActivePath] = useState(null);
  const dispatch = useDispatch();

  const nodeData = data || {};

  // Function to handle path selection
  const handlePathSelection = useCallback(
    (path) => {
      setActivePath(path);
      dispatch(
        updateNodeData({
          id,
          data: {
            ...nodeData,
            activePath: path,
          },
        })
      );
    },
    [dispatch, id, nodeData]
  );

  // Render output handles for different paths
  const renderOutputHandles = () => {
    const outputPaths = nodeData?.config?.output_paths || [];

    return (
      <div className="flex flex-col space-y-2">
        {outputPaths.length > 0 && (
          <table className="w-full">
            <tbody>
              {outputPaths.map((path, index) => (
                <tr key={`output-${index}`} className="align-middle">
                  <td className="text-right align-middle">
                    <span
                      className="text-sm font-medium cursor-pointer hover:text-primary"
                      onClick={() => handlePathSelection(path)}
                    >
                      {path}
                    </span>
                  </td>
                  <td className="pl-2">
                    <div className="flex justify-end">
                      <Handle
                        type="source"
                        position="right"
                        id={`${path}`}
                        className={`w-4 h-4 rounded-full bg-gray-500 ${activePath === path ? 'bg-blue-500' : ''}`}
                        isConnectable={activePath === path}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <DynamicNode
      id={id}
      data={nodeData}
      {...props}
      renderHandles={renderOutputHandles} // Override the renderHandles function
    />
  );
};

export default RouterNode;
