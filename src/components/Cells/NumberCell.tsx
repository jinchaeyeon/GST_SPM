import { GridCellProps } from "@progress/kendo-react-grid";
import {
  NumericTextBox,
  NumericTextBoxChangeEvent,
} from "@progress/kendo-react-inputs";
import { numberWithCommas } from "../CommonFunction";

const NumberCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    render,
    onChange,
    field = "",
    className = "",
  } = props;
  let isInEdit = field === dataItem.inEdit;
  const value = dataItem[field];
  if (className.includes("read-only")) {
    isInEdit = false;
  }
  const handleChange = (e: NumericTextBoxChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });
    }
  };

  const defaultRendering = (
    <td
      style={{ textAlign: "right" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      {isInEdit ? (
        <NumericTextBox value={value} onChange={handleChange} />
      ) : (
        numberWithCommas(value)
      )}
    </td>
  );

  return render === undefined
    ? defaultRendering
    : render?.call(undefined, defaultRendering, props);
};

export default NumberCell;
