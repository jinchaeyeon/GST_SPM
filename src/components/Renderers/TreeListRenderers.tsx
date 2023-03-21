import * as React from "react";

export class Renderers {
  enterEdit;
  exitEdit;
  editFieldName;
  preventExit: any;
  preventExitTimeout: any;
  blurTimeout: any;

  constructor(enterEdit: any, exitEdit: any, editFieldName: any) {
    this.enterEdit = enterEdit;
    this.exitEdit = exitEdit;
    this.editFieldName = editFieldName;
  }

  cellRender = (tdElement: any, cellProps: any) => {
    const dataItem = cellProps.dataItem;
    const field = cellProps.field;
    const editedField = cellProps.dataItem[this.editFieldName];
    const additionalProps =
      editedField && cellProps.field === editedField
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
              this.enterEdit.call(undefined, dataItem, field);
            },
          };

    return React.cloneElement(
      tdElement,
      { ...tdElement.props, ...additionalProps },
      tdElement.props.children
    );
  };

  rowRender = (trElement: any, _dataItem: any) => {
    const trProps = {
      ...trElement.props,
      onMouseDown: () => {
        this.preventExit = true;
        clearTimeout(this.preventExitTimeout);
        this.preventExitTimeout = setTimeout(() => {
          this.preventExit = undefined;
        });
      },
      onBlur: () => {
        clearTimeout(this.blurTimeout);
        if (!this.preventExit) {
          this.blurTimeout = setTimeout(() => {
            this.exitEdit.call(undefined);
          });
        }
      },
      onFocus: () => {
        clearTimeout(this.blurTimeout);
      },
    };
    return React.cloneElement(
      trElement,
      { ...trProps },
      trElement.props.children
    );
  };
}
