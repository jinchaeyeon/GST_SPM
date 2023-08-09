import React, { useEffect, useState } from "react";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import { GridCellProps } from "@progress/kendo-react-grid";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../../hooks/api";
import { FilterDescriptor, filterBy } from "@progress/kendo-data-query";
import { StatusIcon } from "../../CommonStyled";

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

  const [filter, setFilter] = React.useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter(event.filter);
    }
  };

  const defaultRendering = (
    <td aria-colindex={ariaColumnIndex} data-grid-col-index={columnIndex}>
      {isInEdit ? (
        <MultiColumnComboBox
          data={filter ? filterBy(listData, filter) : listData}
          value={value}
          columns={columns}
          textField={textField}
          filterable={true}
          onFilterChange={handleFilterChange}
          onChange={handleChange}
        />
      ) : value ? (
        <>
          <StatusIcon status={value[valueField]} />
          {value[valueField] == "R"
            ? "진행중"
            : value[valueField] == "H"
            ? "보류"
            : value[valueField] == "Y"
            ? "완료"
            : value[valueField] == "N"
            ? "대기"
            : ""}
        </>
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
