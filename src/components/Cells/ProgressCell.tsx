import { GridCellProps } from "@progress/kendo-react-grid";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { ProgressBar } from "@progress/kendo-react-progressbars";

const ProgressCell = (props: GridCellProps) => {
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

  const handleChange = (e: InputChangeEvent) => {
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
      {!isInEdit ? (
        <ProgressBar
          value={value}
          labelVisible={true}
          labelPlacement="center"
        />
      ) : (
        <Input value={value} type="number" onChange={handleChange} />
      )}
    </td>
  );

  return render === undefined
    ? defaultRendering
    : render?.call(undefined, defaultRendering, props);
};

export default ProgressCell;
