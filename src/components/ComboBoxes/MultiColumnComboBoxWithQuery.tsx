import React, { useCallback, useEffect, useState } from "react";
import {
  MultiColumnComboBox as KendoMultiColumnComboBox,
  ComboBoxChangeEvent,
} from "@progress/kendo-react-dropdowns";

import { useApi } from "../../hooks/api";
import { bytesToBase64 } from "byte-base64";

type TComboBox = {
  name: string;
  value: string | number;
  queryStr: string;
  columns: any;
  changeData(e: any): void;
  textField?: string;
  valueField?: string;
};
const MultiColumnComboBoxWithQuery = ({
  name,
  value,
  queryStr,
  columns,
  changeData,
  textField = "code_name",
  valueField = "sub_code",
}: TComboBox) => {
  const processApi = useApi();
  const [listData, setListData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  //콤보박스 리스트 쿼리 조회
  const fetchData = useCallback(async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;

      setListData(rows); //리스트 세팅
    }
  }, []);
  // const columns = customOptionData.menuCustomDefaultOptions.query.find(
  //   (item: any) => item.id === name
  // ).bizComponentItems;

  let newColumns = [];

  if (columns) {
    newColumns = columns.map((column: any) => ({
      field: column.fieldName,
      header: column.caption,
      width: column.columnWidth,
    }));

    newColumns = newColumns.filter((column: any) => column.width !== 0);
  }
  const onChangeHandle = (e: ComboBoxChangeEvent) => {
    let value = e.target.value === null ? "" : e.target.value[valueField];
    changeData({ name, value });
  };

  return (
    <KendoMultiColumnComboBox
      id={name}
      data={listData}
      value={
        value ? listData.find((item: any) => item[valueField] === value) : ""
      }
      columns={newColumns}
      textField={textField}
      onChange={onChangeHandle}
    />
  );
};

export default MultiColumnComboBoxWithQuery;
