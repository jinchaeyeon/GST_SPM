import { DatePicker, DatePickerChangeEvent } from "@progress/kendo-react-dateinputs";
import { GridCellProps } from "@progress/kendo-react-grid";
import { convertDateToStr, dateformat2 } from "../CommonFunction";
import Calendars from "../Calendars/Calendar";
const DateCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field,
    render,
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

  const value = field && dataItem[field] ? dataItem[field] : null;

  const onDateChange = (e: DatePickerChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: convertDateToStr(e.target.value),
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
      {isInEdit ? (
        <DatePicker
          name={field}
          defaultValue={
            typeof value === "string" && value !== "" ? new Date() : value
          }
          format={"yyyy-MM-dd"}
          onChange={onDateChange}
          calendar={Calendars}
          placeholder=""
          show={true}
        />
      ) : typeof value === "object" ? (
        dateformat2(convertDateToStr(value))
      ) : typeof value === "string" && value !== "" ? (
        dateformat2(value)
      ) : (
        ""
      )}
    </td>
  );

  return render === undefined
    ? defaultRendering
    : render?.call(undefined, defaultRendering, props);
};

export default DateCell;
