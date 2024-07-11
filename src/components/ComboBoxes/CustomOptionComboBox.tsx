import {
  ComboBoxChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import { useState } from "react";
import { GetPropertyValueByName } from "../CommonFunction";


type TCustomOptionComboBox = {
  type?: "new" | "query";
  name: string;
  value: string | number;
  customOptionData: any;
  changeData(e: any): void;
  textField?: string;
  valueField?: string;
  className?: string;
  disabled?: boolean;
};
const CustomOptionComboBox = ({
  type = "query",
  name,
  value,
  customOptionData,
  changeData,
  textField = "code_name",
  valueField = "sub_code",
  className = "",
  disabled = false,
}: TCustomOptionComboBox) => {
  const dataList = GetPropertyValueByName(
    customOptionData.menuCustomDefaultOptions,
    type
  );
  const dataItem = dataList?.find((item: any) => item.id == name);
  const listData = dataItem?.Rows;

  let newColumns = [];
  let required = false;

  if (className.includes("required")) {
    required = true;
  }

  if (dataList) {
    const columns = dataItem?.bizComponentItems;

    if (columns) {
      newColumns = columns.map((column: any) => ({
        field: column.fieldName,
        header: column.caption,
        width: column.columnWidth,
      }));

      newColumns = newColumns.filter((column: any) => column.width !== 0);
    }

    if (newColumns.length == 0) {
      newColumns = [
        {
          field: "",
          header: "",
          width: "300px",
        },
      ];
    }
  }
  const onChangeHandle = (e: ComboBoxChangeEvent) => {
    let value = e.target.value == null ? "" : e.target.value[valueField];
    changeData({ name, value, e });
    setState(false);
  };

  const [state, setState] = useState(false);

  document.getElementById(name)?.addEventListener("focusout", (event) => {
    setState(false);
  });

  return (
    <>
      <MultiColumnComboBox
        data={listData}
        textField={textField}
        value={
          value ? listData.find((item: any) => item[valueField] == value) : ""
        }
        columns={newColumns}
        onChange={onChangeHandle}
        id={name}
        required={required}
        className={className}
        disabled={disabled}
        opened={state}
        onOpen={() => setState(true)}
        onClose={() => setState(false)}
      />
    </>
  );
};

export default CustomOptionComboBox;
