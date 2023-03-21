import * as React from "react";
import { GridCellProps, GridRowProps } from "@progress/kendo-react-grid";

interface CellRenderProps {
  originalProps: GridCellProps;
  td: React.ReactElement<HTMLTableCellElement>;
  enterEdit: (dataItem: any, field: string | undefined) => void;
  editField: string | undefined;
}

interface RowRenderProps {
  originalProps: GridRowProps;
  tr: React.ReactElement<HTMLTableRowElement>;
  exitEdit: () => void;
  editField: string | undefined;
}

export const CellRender = (props: any) => {
  if (props.originalProps.rowType !== "data") {
    return props.td;
  }
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
          //   tabIndex: "0",
        };

  const clonedProps = { ...props.td.props, ...additionalProps };

  // console.log("clonedProps");
  // console.log(clonedProps);
  return React.cloneElement(props.td, clonedProps, props.td.props.children);
};
// export const RowRender = (props: any) => {
//   // console.log("render props");
//   // console.log(props);
//   if (props.originalProps.rowType !== "data") {
//     return props.tr;
//   }
//   const trProps = {
//     ...props.tr.props,
//     onBlur: () => {
//       props.exitEdit();
//     },
//   };
//   return React.cloneElement(props.tr, { ...trProps }, props.tr.props.children);
// };

export const RowRender = (props: any) => {
  const trProps = {
    ...props.tr.props,
    onBlur: () => {
      setTimeout(() => {
        const activeElement = document.activeElement;

        if (activeElement === null) return false;
        if (activeElement.className.indexOf("k-calendar") < 0) {
          props.exitEdit();
        }
      });
    },
  };
  return React.cloneElement(props.tr, { ...trProps }, props.tr.props.children);
};
