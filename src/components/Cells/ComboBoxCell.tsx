import React, { useEffect, useState } from "react";
import {
  ComboBoxChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import { GridCellProps } from "@progress/kendo-react-grid";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../../hooks/api";

interface CustomCellProps extends GridCellProps {
  data: any;
  columns: any;
  textField?: string;
  valueField?: string;
}
const ComboBoxCell = (props: CustomCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    data = [],
    columns,
    className = "",
    valueField = "sub_code",
    textField = "code_name",
  } = props;
  const processApi = useApi();

  const [listData, setListData]: any = useState(data);
  let isInEdit = field === dataItem.inEdit;
  if (className.includes("read-only")) {
    isInEdit = false;
  } else if (className.includes("editable-new-only")) {
    if (dataItem["rowstatus"] !== "N") {
      isInEdit = false;
    }
  }

  const dataValue = dataItem[field];

  const value = listData.find((item: any) => item[valueField] === dataValue);

  const handleChange = (e: ComboBoxChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ? e.target.value[valueField] : "",
      });
    }
  };

  // useEffect(() => {
  //   if (queryStr) {
  //     fetchQuery();
  //   }
  // }, []);

  // const fetchQuery = async () => {
  //   let data: any;

  //   const bytes = require("utf8-bytes");
  //   const convertedQueryStr = bytesToBase64(bytes(queryStr));

  //   let query = {
  //     query: convertedQueryStr,
  //   };

  //   try {
  //     data = await processApi<any>("bizgst-query", query);
  //   } catch (error) {
  //     data = null;
  //   }

  //   if (data !== null && data.isSuccess === true) {
  //     const rows = data.tables[0].Rows;
  //     setListData(rows);
  //   } else {
  //     console.log("[에러발생]");
  //     console.log(data);
  //   }
  // };

  const defaultRendering = (
    <td aria-colindex={ariaColumnIndex} data-grid-col-index={columnIndex}>
      {isInEdit ? (
        <MultiColumnComboBox
          data={listData}
          value={value}
          columns={columns}
          textField={textField}
          onChange={handleChange}
        />
      ) : value ? (
        value[textField]
      ) : (
        ""
      )}
    </td>
  );

  return render === undefined
    ? null
    : render?.call(undefined, defaultRendering, props);
};

export default ComboBoxCell;
