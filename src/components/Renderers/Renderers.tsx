import * as React from "react";
export const CellRender = (props: any) => {
  const dataItem = props.originalProps.dataItem;
  const cellField = props.originalProps.field;
  const inEditField = dataItem[props.editField || ""];
  const additionalProps =
    cellField && cellField === inEditField
      ? {
          ref: (td: any) => {
            const input = td && td.querySelector("input");
            const activeElement = document.activeElement;

            if (
              !input ||
              !activeElement ||
              input === activeElement ||
              !activeElement.contains(input)
            ) {
              return;
            }

            if (input.type === "checkbox") {
              input.focus();
            } else {
              input.select();
            }
          },
        }
      : {
          onClick: () => {
            props.enterEdit(dataItem, cellField);
          },
          onFocus: () => {
            props.enterEdit(dataItem, cellField);
          },
          tabIndex: "0",
        };
  const clonedProps = { ...props.td.props, ...additionalProps };
  return React.cloneElement(props.td, clonedProps, props.td.props.children);
};
export const RowRender = (props: any) => {
  const trProps = {
    ...props.tr.props,
    onBlur: () => {
      props.exitEdit();
      // setTimeout(() => {
      //   const activeElement = document.activeElement;

      //   if (activeElement === null) return false;

      //    if (activeElement.className.indexOf("k-calendar") < 0) {
      //      props.exitEdit();
      //    }
      // });
    },
  };
  return React.cloneElement(props.tr, { ...trProps }, props.tr.props.children);
};
