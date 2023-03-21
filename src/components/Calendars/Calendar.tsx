import * as React from "react";
import { Calendar, CalendarProps } from "@progress/kendo-react-dateinputs";

const CustomCalendar = (props: CalendarProps) => {
  return (
    <Calendar
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export default CustomCalendar;
