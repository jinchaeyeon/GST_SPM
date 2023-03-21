import React, { useCallback, useEffect, useState } from "react";
import { MultiColumnComboBox } from "@progress/kendo-react-dropdowns";
import { FieldRenderProps } from "@progress/kendo-react-form";
import { checkIsObjValid } from "../CommonFunction";

type TFieldComboBox = {
  fieldRenderProps: FieldRenderProps;
  listData: any;
  valueField: string;
  textField: string;
};
const FieldComboBox: React.FC<TFieldComboBox> = ({
  fieldRenderProps,
  listData,
  valueField,
  textField,
}: TFieldComboBox) => {
  const {
    validationMessage,
    visited,
    value,
    className,
    label,
    id,
    valid,
    columns,
    onChange,
    ...others
  } = fieldRenderProps;

  let newColumns = columns.map((column: any) => ({
    field: column.fieldName,
    header: column.caption,
    width: column.columnWidth,
  }));
  newColumns = newColumns.filter((column: any) => column.width !== 0);

  const required = className?.includes("required");
  const readonly = className?.includes("readonly");
  let isValid = valid;
  if (required) {
    const comparisonValue = { [valueField]: "", [textField]: "" };
    isValid = checkIsObjValid(value, comparisonValue);
  }

  return (
    <MultiColumnComboBox
      data={listData}
      textField={textField}
      value={
        typeof value === "string"
          ? listData.find((item: any) => item[valueField] === value)
          : value
      }
      columns={newColumns}
      className={className}
      valid={isValid}
      id={id}
      onChange={readonly ? undefined : onChange}
      {...others}
    />
  );
};

export default FieldComboBox;
