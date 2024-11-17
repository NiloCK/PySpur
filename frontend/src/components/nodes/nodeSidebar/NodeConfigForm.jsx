import React from 'react';
import Form from '@rjsf/chakra-ui'; // Import the Chakra UI theme for react-jsonschema-form
import validator from '@rjsf/validator-ajv8';
import { useSelector } from 'react-redux';
import useNodeConfig from '../../../hooks/useNodeConfig'; // Import the custom hook
import { selectNodeById } from '../../../store/flowSlice';

const NodeConfigForm = ({ nodeId }) => {
  const node = useSelector((state) => selectNodeById(state, nodeId));

  // Use the custom hook to manage form data and handle changes
  const { formData, schema, uiSchema, handleChange } = useNodeConfig(nodeId);

  if (!node) {
    return <div>Node not found</div>;
  }

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onChange={handleChange}
      validator={validator}
      theme="ChakraUI"
    />
  );
};

export default NodeConfigForm;