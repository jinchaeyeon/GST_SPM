import React, { useState } from "react";
import {
    ComboBoxChangeEvent,
  MultiColumnComboBox,
  MultiColumnComboBoxProps,
} from "@progress/kendo-react-dropdowns";

interface Column {
  field: string;
  header?: string;
  width?: number;
}

interface CustomMultiColumnComboBoxProps
  extends Omit<MultiColumnComboBoxProps, "columns"> {
  data: any[];
  textField: string;
  columns: Column[];
  onChange: (event: any) => void;
  value: any;
  className?: string;
  name: string;
}

const CustomMultiColumnComboBox: React.FC<CustomMultiColumnComboBoxProps> = ({
  data,
  textField,
  columns,
  onChange,
  value,
  className = "",
  name,
  ...rest
}) => {
  let required = false;

  if (className.includes("required")) {
    required = true;
  }
  const [state, setState] = useState(false);

  document.getElementById(name)?.addEventListener("focusout", (event) => {
    setState(false);
  });

  const onChangeHandle = (e: ComboBoxChangeEvent) => {
    const customEvent = {
      target: {
        value: e.value,
        props: {
          name: name,
        },
      },
    };
    onChange(customEvent);
    setState(false);
  };

  return (
    <MultiColumnComboBox
      data={data}
      textField={textField}
      columns={columns}
      onChange={onChangeHandle}
      value={value}
      className={className}
      opened={state}
      onOpen={() => setState(true)}
      onClose={() => setState(false)}
      id={name}
      required={required}
      {...rest}
    />
  );
};

export default CustomMultiColumnComboBox;
