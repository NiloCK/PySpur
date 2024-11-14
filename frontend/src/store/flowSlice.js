import { createSlice, createAction } from '@reduxjs/toolkit';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { createNode } from '../utils/nodeFactory';


const initialState = {
  nodeTypes: [],
  nodes: [],
  edges: [],
  workflowID: null,
  hoveredNode: null,
  selectedNode: null,
  sidebarWidth: 400,
  projectName: 'Untitled Project',
  workflowInputVariables: {},
  selectedNodes: [],
};

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    initializeFlow: (state, action) => {
      const { workflowID, definition, name } = action.payload;
      state.workflowID = workflowID;
      state.projectName = name;
      state.nodeTypes = action.payload.nodeTypes;
      const { nodes, links } = definition;
      // Map nodes to the expected format
      let mappedNodes = nodes.map(node =>
        createNode(state.nodeTypes, node.node_type, node.id, { x: node.coordinates.x, y: node.coordinates.y }, { config: node.config })
      );

      state.nodes = mappedNodes;

      // Map links to the expected edge format
      state.edges = links.map(link => ({
        id: uuidv4(),
        key: uuidv4(),
        selected: link.selected || false,
        source: link.source_id,
        target: link.target_id,
        sourceHandle: link.source_output_key,
        targetHandle: link.target_input_key
      }));

      // Ensure workflowInputVariables are not reset unless explicitly provided
      if (definition.input_variables) {
        state.workflowInputVariables = definition.input_variables;
      }
    },
    nodesChange: (state, action) => {
      const changes = action.payload.changes;
      state.nodes = applyNodeChanges(changes, state.nodes);
    },
    edgesChange: (state, action) => {
      const changes = action.payload.changes;
      state.edges = applyEdgeChanges(changes, state.edges);
    },
    connect: (state, action) => {
      state.edges = addEdge(action.payload.connection, state.edges);
    },
    addNode: (state, action) => {
      if (action.payload.node) {
        state.nodes = [...state.nodes, action.payload.node];
      }
    },
    setNodes: (state, action) => {
      state.nodes = action.payload.nodes;
    },
    setEdges: (state, action) => {
      state.edges = action.payload.edges;
    },
    updateNodeData: (state, action) => {
      const { id, data } = action.payload;
      console.log('updateNodeData', id, data);
      const node = state.nodes.find((node) => node.id === id);
      if (node) {
        node.data = { ...node.data, ...data };
      }
    },
    setHoveredNode: (state, action) => {
      state.hoveredNode = action.payload.nodeId;
    },
    setSelectedNode: (state, action) => {
      const { nodeId, nodeIds, isMultiSelect } = action.payload;

      // Handle bulk selection update
      if (nodeIds) {
        state.selectedNodes = nodeIds;
        state.selectedNode = nodeIds[nodeIds.length - 1] || null;
        return;
      }

      // Handle single node selection
      if (!nodeId) {
        state.selectedNode = null;
        state.selectedNodes = [];
        return;
      }

      if (isMultiSelect) {
        // If node is already selected, unselect it
        if (state.selectedNodes.includes(nodeId)) {
          state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId);
        } else {
          state.selectedNodes.push(nodeId);
        }
        state.selectedNode = nodeId;
      } else {
        state.selectedNode = nodeId;
        state.selectedNodes = [nodeId];
      }
    },
    deleteNode: (state, action) => {
      const nodeId = action.payload.nodeId;

      // If deleting a group node, detach its children first
      const childNodes = state.nodes.filter(node => node.parentNode === nodeId);
      childNodes.forEach(child => {
        const childNode = state.nodes.find(n => n.id === child.id);
        if (childNode) {
          delete childNode.parentNode;
          childNode.position = {
            x: childNode.position.x + (childNode.positionAbsolute?.x || 0),
            y: childNode.position.y + (childNode.positionAbsolute?.y || 0),
          };
        }
      });

      // Delete the node and its associated edges
      state.nodes = state.nodes.filter((node) => node.id !== nodeId);
      state.edges = state.edges.filter((edge) =>
        edge.source !== nodeId && edge.target !== nodeId
      );

      if (state.selectedNode === nodeId) {
        state.selectedNode = null;
      }
    },
    deleteEdge: (state, action) => {
      const edgeId = action.payload.edgeId;
      state.edges = state.edges.filter((edge) => edge.id !== edgeId);
    },
    setSidebarWidth: (state, action) => {
      state.sidebarWidth = action.payload;
    },
    setProjectName: (state, action) => {
      state.projectName = action.payload;
    },



    setWorkflowInputVariable: (state, action) => {
      const { key, value } = action.payload;
      state.workflowInputVariables[key] = value;
    },

    deleteWorkflowInputVariable: (state, action) => {
      const { key } = action.payload;

      // Delete the workflow input variable
      delete state.workflowInputVariables[key];

      // Remove any edges that are connected to this variable as a source
      state.edges = state.edges.filter(edge => edge.sourceHandle !== key);
    },

    updateWorkflowInputVariableKey: (state, action) => {
      const { oldKey, newKey } = action.payload;
      if (oldKey !== newKey) {
        // Update the workflowInputVariables
        state.workflowInputVariables[newKey] = state.workflowInputVariables[oldKey];
        delete state.workflowInputVariables[oldKey];

        // Update any edges that use this key as sourceHandle
        state.edges = state.edges.map(edge => {
          if (edge.sourceHandle === oldKey) {
            return {
              ...edge,
              sourceHandle: newKey
            };
          }
          return edge;
        });
      }
    },

    resetFlow: (state, action) => {
      const { nodes, links } = action.payload.definition;
      console.log("action", action);

      // Map nodes to the expected format
      let mappedNodes = nodes.map(node =>
        createNode(node.node_type, node.id, { x: node.coordinates.x, y: node.coordinates.y }, { config: node.config })
      );

      state.nodes = mappedNodes;

      // Map links to the expected edge format
      state.edges = links.map(link => ({
        id: uuidv4(),
        key: uuidv4(),
        selected: link.selected || false,
        source: link.source_id,
        target: link.target_id,
        sourceHandle: link.source_output_key,
        targetHandle: link.target_input_key
      }));
    },

    // Add new reducer for grouping nodes
    groupNodes: (state, action) => {
      const { nodeIds, groupId, position } = action.payload;

      // Create new group node
      const groupNode = {
        id: groupId,
        type: 'group',
        position,
        data: { title: 'Group' },
        style: { width: 300, height: 300 }
      };

      // Add parentNode to selected nodes
      state.nodes = state.nodes.map(node => {
        if (nodeIds.includes(node.id)) {
          return {
            ...node,
            parentNode: groupId,
            extent: 'parent',
            position: {
              x: node.position.x - position.x,
              y: node.position.y - position.y,
            }
          };
        }
        return node;
      });

      // Add group node
      state.nodes.push(groupNode);
    },

    // Add a new action to clear selections
    clearSelections: (state) => {
      state.selectedNode = null;
      state.selectedNodes = [];
    },
  },
});

export const {
  initializeFlow,
  nodesChange,
  edgesChange,
  connect,
  addNode,
  setNodes,
  setEdges,
  updateNodeData,
  setHoveredNode,
  setSelectedNode,
  deleteNode,
  deleteEdge,
  setSidebarWidth,
  setProjectName,
  setWorkflowInputVariable,
  deleteWorkflowInputVariable,
  updateWorkflowInputVariableKey,
  resetFlow,
  groupNodes,
  clearSelections
} = flowSlice.actions;

export default flowSlice.reducer;

export const selectNodeById = (state, nodeId) => {
  return state.flow.nodes.find((node) => node.id === nodeId);
};