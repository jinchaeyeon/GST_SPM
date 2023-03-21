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
            if (!input || input === document.activeElement) {
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
          onClick: (event: any) => {
            const targetClasses = event.target.classList;
            if (
              targetClasses &&
              (targetClasses.contains("k-i-expand") ||
                targetClasses.contains("k-i-collapse"))
            ) {
              return;
            }
            props.enterEdit.call(undefined, dataItem, props.field);
          },
        };
  const clonedProps = { ...props.td.props, ...additionalProps };
  return React.cloneElement(props.td, clonedProps, props.td.props.children);
};
export const RowRender = (props: any) => {
  const trProps = {
    ...props.tr.props,
    onFocus: () => {
      clearTimeout(props.blurTimeout);
    },
    onDragStart: (e: any) => props.onDragStart(e, props.dataItem),
    onDragOver: (e: any) => {
      e.preventDefault();
    },
    onDrop: (e: any) => props.onDrop(e),
    draggable: true,
  };
  return React.cloneElement(props.tr, { ...trProps }, props.tr.props.children);
};
