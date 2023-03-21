import { GridCellProps } from "@progress/kendo-react-grid";
import {
  NumericTextBox,
  NumericTextBoxChangeEvent,
} from "@progress/kendo-react-inputs";
import { numberWithCommas } from "../CommonFunction";
import {
  TreeListCellProps,
} from "@progress/kendo-react-treelist";

const NumberTreeCell = (props: TreeListCellProps) => {
  const {
    ariaColumnIndex,
    dataItem,
    render,
    onChange,
    field = "",
    className = "",
    level,
  } = props;
  let isInEdit = field === dataItem.inEdit;
  const value = dataItem[field];
  if (className.includes("read-only")) {
    isInEdit = false;
  }
  const handleChange = (e: NumericTextBoxChangeEvent) => {
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
    <td
      style={{ textAlign: "right" }}
      aria-colindex={ariaColumnIndex}
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

export default NumberTreeCell;
