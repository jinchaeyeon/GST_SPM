import * as React from "react";
import { Calendar, CalendarProps } from "@progress/kendo-react-dateinputs";

const CustomCalendar = (props: CalendarProps) => {
  return (
    <Calendar
      bottomView="decade"
      topView="decade"
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export default CustomCalendar;
