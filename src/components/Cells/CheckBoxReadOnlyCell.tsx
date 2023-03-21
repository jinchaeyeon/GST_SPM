import { GridCellProps } from "@progress/kendo-react-grid";
import { Checkbox } from "@progress/kendo-react-inputs";

const CheckBoxReadOnlyCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, field } = props;
  let value = dataItem[field ?? ""];
  if (value === "Y" || value === true) {
    value = true;
  } else {
    value = false;
  }
  return (
    <td
      style={{ textAlign: "center" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      <Checkbox checked={value} readOnly></Checkbox>
    </td>
  );
};

export default CheckBoxReadOnlyCell;
