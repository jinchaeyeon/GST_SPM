import * as React from "react";
import {
  DateInput,
  DateInputProps,
  DateRangePicker,
  DateRangePickerProps,
} from "@progress/kendo-react-dateinputs";

const CommonDateRangePicker = (props: DateRangePickerProps) => {
  return (
    <DateRangePicker
      {...props}
      startDateInput={CustomDateInput}
      endDateInput={CustomDateInput}
    />
  );
};

const CustomDateInput = (props: DateInputProps) => {
  return <DateInput {...props} label={undefined} format="yyyy-MM-dd" />;
};

export default CommonDateRangePicker;
