import { GridCellProps } from "@progress/kendo-react-grid";
import {
  NumericTextBox,
  NumericTextBoxChangeEvent,
} from "@progress/kendo-react-inputs";
import { numberWithCommas } from "../CommonFunction";

const NumberPercentCell = (props: GridCellProps) => {
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
      let value = e.target.value ?? 0;
      if (value < 0) {
        value = 0;
      }
      if (value > 100) {
        value = 100;
      }
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: value,
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
        <NumericTextBox
          value={value}
          onChange={handleChange}
          min={0}
          max={100}
        />
      ) : (
        numberWithCommas(value)
      )}
    </td>
  );

  return render === undefined
    ? defaultRendering
    : render?.call(undefined, defaultRendering, props);
};

export default NumberPercentCell;
