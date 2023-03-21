import React from "react";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { TreeListCellProps } from "@progress/kendo-react-treelist";

const NameTreeListCell = (props: TreeListCellProps) => {
  const {
    ariaColumnIndex,
    dataItem,
    field = "",
    render,
    level,
    onChange,
    className = "",
  } = props;
  let isInEdit = field === dataItem.inEdit;
  if (className.includes("read-only")) {
    isInEdit = false;
  } else if (className.includes("editable-new-only")) {
    if (dataItem["rowstatus"] !== "N") {
      isInEdit = false;
    }
  }

  const value = dataItem[field];

  const handleChange = (e: InputChangeEvent) => {
    if (onChange) {
      onChange({
        dataItem: dataItem,
        level: level,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });
    }
  };

  const defaultRendering = (
    <td style={{ textAlign: "left" }} aria-colindex={ariaColumnIndex}>
      {isInEdit ? <Input value={value} onChange={handleChange} /> : value}
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

export default NameTreeListCell;
