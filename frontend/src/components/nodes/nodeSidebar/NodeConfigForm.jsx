import React from 'react';
import Form from '@rjsf/chakra-ui';
import validator from '@rjsf/validator-ajv8';
import { useSelector } from 'react-redux';
import useNodeConfig from '../../../hooks/useNodeConfig';
import { selectNodeById } from '../../../store/flowSlice';
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Radio,
  RadioGroup,
  Slider
} from '@nextui-org/react';

// Custom widgets using NextUI components
const CustomInputWidget = (props) => {
  const { id, value, required, disabled, onChange, placeholder } = props;
  return (
    <Input
      id={id}
      value={value || ""}
      isRequired={required}
      isDisabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

const CustomTextareaWidget = (props) => {
  const { id, value, required, disabled, onChange, placeholder } = props;
  return (
    <Textarea
      id={id}
      value={value || ""}
      isRequired={required}
      isDisabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

const CustomSelectWidget = (props) => {
  const { id, options, value, required, disabled, onChange } = props;
  return (
    <Select
      id={id}
      selectedKeys={value ? [value] : []}
      isRequired={required}
      isDisabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.enumOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
};

const CustomCheckboxWidget = (props) => {
  const { id, value, disabled, onChange, label } = props;
  return (
    <Checkbox
      id={id}
      isSelected={value}
      isDisabled={disabled}
      onChange={(isSelected) => onChange(isSelected)}
    >
      {label}
    </Checkbox>
  );
};

const CustomRadioWidget = (props) => {
  const { id, options, value, disabled, onChange } = props;
  return (
    <RadioGroup
      id={id}
      value={value}
      isDisabled={disabled}
      onChange={(value) => onChange(value)}
    >
      {options.enumOptions.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </RadioGroup>
  );
};

const CustomRangeWidget = (props) => {
  const { id, value, disabled, onChange, schema } = props;
  return (
    <Slider
      id={id}
      value={value}
      isDisabled={disabled}
      min={schema.minimum || 0}
      max={schema.maximum || 100}
      step={schema.multipleOf || 1}
      onChange={(value) => onChange(value)}
    />
  );
};

const NodeConfigForm = ({ nodeId }) => {
  const node = useSelector((state) => selectNodeById(state, nodeId));
  const { formData, schema, handleChange } = useNodeConfig(nodeId);

  if (!node) {
    return <div>Node not found</div>;
  }

  const uiSchema = {
    "ui:classNames": "space-y-4" // Add spacing between form elements
  };

  const widgets = {
    TextWidget: CustomInputWidget,
    TextareaWidget: CustomTextareaWidget,
    SelectWidget: CustomSelectWidget,
    CheckboxWidget: CustomCheckboxWidget,
    RadioWidget: CustomRadioWidget,
    RangeWidget: CustomRangeWidget
  };

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onChange={handleChange}
      validator={validator}
      widgets={widgets}
    />
  );
};

export default NodeConfigForm;