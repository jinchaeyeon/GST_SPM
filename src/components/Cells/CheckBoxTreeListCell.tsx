import React, { useEffect } from "react";
import { Checkbox, CheckboxChangeEvent } from "@progress/kendo-react-inputs";
import { TreeListCellProps } from "@progress/kendo-react-treelist";

const CheckBoxTreeListCell = (props: TreeListCellProps) => {
  const { ariaColumnIndex, dataItem, field, render, level, onChange } = props;
  const value = dataItem[field ?? ""];

  const handleChange = (e: CheckboxChangeEvent) => {
    if (onChange) {
      onChange({
        dataItem: dataItem,
        level: level,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.value,
      });
    }
  };

  const defaultRendering = (
    <td style={{ textAlign: "center" }} aria-colindex={ariaColumnIndex}>
      <Checkbox
        value={value === "Y" || value === true ? true : false}
        name={field}
        onChange={handleChange}
      ></Checkbox>
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;

  // return render === undefined
  //   ? null
  //   : render?.call(undefined, defaultRendering, props);
};

export default CheckBoxTreeListCell;
