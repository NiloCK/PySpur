import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { selectNodeById, updateNodeData } from '../store/flowSlice';

const useNodeConfig = (nodeId) => {
  const dispatch = useDispatch();
  const node = useSelector((state) => selectNodeById(state, nodeId));

  // Initialize form data with the node's config_values
  const [formData, setFormData] = useState(node.data.config_values || {});

  // The JSON schema for the form is derived from the node type's config value
  const schema = useSelector((state) => {
    const nodeType = node.type;
    const nodeCategoriesAndTypes =  state.nodeTypes.data;
    // nodeCategoriesAndTypes is a dictionary of node categories, each category is an array of node types
    // first flatten the dictionary into an array of node types
    const nodeTypes = Object.values(nodeCategoriesAndTypes).flat();
    // find the node type object by its name
    const nodeTypeObj = nodeTypes.find((nt) => nt.name === nodeType);
    return nodeTypeObj.config;
  });

  // Define any custom UI schema if needed (optional)
  const uiSchema = {};

  // Handle form data changes
  const handleChange = (e) => {
    const newFormData = e.formData;
    setFormData(newFormData);

    // Update the node's config_values in the Redux store
    dispatch(
      updateNodeData({
        id: nodeId,
        data: { config_values: newFormData },
      })
    );
  };

  // Update formData when the node's config_values change
  useEffect(() => {
    setFormData(node.data.config_values || {});
  }, [node.data.config_values]);

  return { formData, schema, uiSchema, handleChange };
};

export default useNodeConfig;