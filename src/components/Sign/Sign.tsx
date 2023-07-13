import React from "react";
import { Signature } from '@progress/kendo-react-inputs';

const Sign = (props: any) => {
  const { value, onChange, disabled = false } = props;
  return (
    <Signature
      value={value}
      onChange={onChange}
      strokeWidth={3}
      smooth={true}
      maximizable={false}
      hideLine={true}
      style={{height: "100%", width: "100%"}}
      disabled={disabled}
    />
  );
};

export default Sign;
