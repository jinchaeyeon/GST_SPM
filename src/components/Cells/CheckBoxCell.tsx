import { GridCellProps } from "@progress/kendo-react-grid";
import { Checkbox, CheckboxChangeEvent } from "@progress/kendo-react-inputs";

const CheckBoxCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, field, render, onChange } =
    props;
  let value = dataItem[field ?? ""];
  if (value === "Y" || value === true) {
    value = true;
  } else {
    value = false;
  }

  const handleChange = (e: CheckboxChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });

      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: "rowstatus",
        syntheticEvent: e.syntheticEvent,
        value: dataItem["rowstatus"] === "N" ? "N" : "U",
      });
    }
  };

  const defaultRendering = (
    <td
      style={{ textAlign: "center" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      <Checkbox value={value} onChange={handleChange}></Checkbox>
    </td>
  );

  return render === undefined
    ? defaultRendering
    : render?.call(undefined, defaultRendering, props);
};

export default CheckBoxCell;
