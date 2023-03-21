import React, { useCallback, useEffect, useState } from "react";
import {
  MultiColumnComboBox,
  ComboBoxChangeEvent,
} from "@progress/kendo-react-dropdowns";

import { useApi } from "../../hooks/api";
import { getQueryFromBizComponent } from "../CommonFunction";
import { bytesToBase64 } from "byte-base64";

type TCommonComboBox = {
  name: string;
  value: string | number;
  bizComponentId: string;
  bizComponentData: any;
  changeData(e: any): void;
  textField?: string;
  valueField?: string;
  className?: string;
};
const CommonComboBox = ({
  name,
  value,
  bizComponentId,
  bizComponentData,
  changeData,
  textField = "code_name",
  valueField = "sub_code",
  className = ""
}: TCommonComboBox) => {
  const processApi = useApi();
  const [listData, setListData] = useState([]);
  bizComponentData = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentId
  );

  let required = false;
  if (className.includes("required")) {
    required = true;
  } 

  useEffect(() => {
    fetchData();
  }, []);

  //콤보박스 리스트 쿼리 조회
  const fetchData = useCallback(async () => {
    let data: any;

    const queryStr = getQueryFromBizComponent(bizComponentData);

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

  let newColumns = [];

  if (bizComponentData) {
    const columns = bizComponentData.bizComponentItems;

    if (columns) {
      newColumns = columns.map((column: any) => ({
        field: column.fieldName,
        header: column.caption,
        width: column.columnWidth,
      }));

      newColumns = newColumns.filter((column: any) => column.width !== 0);
    }
  }
  const onChangeHandle = (e: ComboBoxChangeEvent) => {
    let value = e.target.value === null ? "" : e.target.value[valueField];
    changeData({ name, value });
  };

  return (
    <MultiColumnComboBox
      id={name}
      data={listData}
      value={
        value ? listData.find((item: any) => item[valueField] === value) : ""
      }
      columns={newColumns}
      textField={textField}
      onChange={onChangeHandle}
      required={required}
      className={className}
    />
  );
};

export default CommonComboBox;
