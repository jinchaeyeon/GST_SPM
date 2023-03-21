import React, { useCallback, useEffect, useState } from "react";
import {
  MultiColumnComboBox,
  ComboBoxChangeEvent,
} from "@progress/kendo-react-dropdowns";

type TCustomOptionComboBox = {
  name: string;
  value: string | number;
  customOptionData: any;
  changeData(e: any): void;
  textField?: string;
  valueField?: string;
  className?: string;
};
const CustomOptionComboBox = ({
  name,
  value,
  customOptionData,
  changeData,
  textField = "code_name",
  valueField = "sub_code",
  className = ""
}: TCustomOptionComboBox) => {
  const dataList = customOptionData.menuCustomDefaultOptions.query;
  const dataItem = dataList.find((item: any) => item.id === name);
  const listData = dataItem.Rows;

  let newColumns = [];
  let required = false;

  if (className.includes("required")) {
    required = true;
  } 

  if (dataList) {
    const columns = dataItem.bizComponentItems;

    if (columns) {
      newColumns = columns.map((column: any) => ({
        field: column.fieldName,
        header: column.caption,
        width: column.columnWidth,
      }));

      newColumns = newColumns.filter((column: any) => column.width !== 0);
    }
  }
  const onChangeHandle = (e: ComboBoxChangeEvent) => {
    let value = e.target.value === null ? "" : e.target.value[valueField];
    changeData({ name, value });
  };

  return (
    <MultiColumnComboBox
      data={listData}
      textField={textField}
      value={
        value ? listData.find((item: any) => item[valueField] === value) : ""
      }
      columns={newColumns}
      onChange={onChangeHandle}
      id={name}
      required={required}
      className={className}
    />
  );
};

export default CustomOptionComboBox;
