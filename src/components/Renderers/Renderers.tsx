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
          onClick: () => {
            props.enterEdit(dataItem, cellField);
          },
          onKeyDown: (ev: any) => {
            let activeCell = ev.target.closest("TD");

            if (ev.keyCode === 9 && ev.shiftKey) {
              //ev.keyCode === 37
              ev.preventDefault();

              if (activeCell.previousSibling) {
                activeCell.previousSibling.focus();
                activeCell.previousSibling.click();
              }
            } else if (ev.keyCode === 9) {
              //ev.keyCode === 39 ||
              ev.preventDefault();

              if (activeCell.nextSibling) {
                activeCell.nextSibling.focus();
                activeCell.nextSibling.click();
              }
            } else if (ev.keyCode === 38) {
              ev.preventDefault();

              if (activeCell.parentElement.previousSibling) {
                activeCell.parentElement.previousSibling.cells[
                  activeCell.cellIndex
                ].focus();
                activeCell.parentElement.previousSibling.cells[
                  activeCell.cellIndex
                ].click();
              }
            } else if (ev.keyCode === 40) {
              ev.preventDefault();

              if (activeCell.parentElement.nextSibling) {
                activeCell.parentElement.nextSibling.cells[
                  activeCell.cellIndex
                ].focus();
                activeCell.parentElement.nextSibling.cells[
                  activeCell.cellIndex
                ].click();
              }
            }
          },
        }
      : {
          onClick: () => {
            props.enterEdit(dataItem, cellField);
          },
          onKeyDown: (ev: any) => {
            if (ev.keyCode === 13) {
              props.enterEdit(dataItem, cellField);
            }
          },
        };
  const clonedProps = { ...props.td.props, ...additionalProps };
  return React.cloneElement(props.td, clonedProps, props.td.props.children);
};
export const RowRender = (props: any) => {
  const trProps = {
    ...props.tr.props,
    onBlur: () => {
      //props.exitEdit();
    },
  };
  return React.cloneElement(props.tr, { ...trProps }, props.tr.props.children);
};
