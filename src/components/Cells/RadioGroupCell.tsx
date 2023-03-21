import React, { useCallback, useEffect, useState } from "react";
import { GridCellProps } from "@progress/kendo-react-grid";
import {
  RadioGroup,
  RadioGroupChangeEvent,
} from "@progress/kendo-react-inputs";
import { RADIO_GROUP_DEFAULT_DATA } from "../CommonString";

interface CustomCellProps extends GridCellProps {
  bizComponentData: any;
}
const RadioGroupCell = (props: CustomCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    bizComponentData,
  } = props;

  const value = dataItem[field ?? ""];
  const dataList =
    bizComponentData !== null ? bizComponentData.data.Rows : null;

  let newRadioGroup = RADIO_GROUP_DEFAULT_DATA;

  if (dataList) {
    newRadioGroup = dataList.map((column: any) => ({
      value: column.code,
      label: column.caption,
    }));
  }

  const onChangeHandle = (e: RadioGroupChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.value ?? "",
      });
    }
  };

  const defaultRendering = (
    <td aria-colindex={ariaColumnIndex} data-grid-col-index={columnIndex}>
      <RadioGroup
        data={newRadioGroup}
        layout={"horizontal"}
        value={value}
        onChange={onChangeHandle}
      />
    </td>
  );

  return render === undefined
    ? null
    : render?.call(undefined, defaultRendering, props);
};

export default RadioGroupCell;
