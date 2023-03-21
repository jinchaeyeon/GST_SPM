import React, { useCallback, useEffect, useState } from "react";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { useApi } from "../../hooks/api";
import { FieldRenderProps } from "@progress/kendo-react-form";
import { checkIsDDLValid } from "../CommonFunction";
import { COM_CODE_DEFAULT_VALUE } from "../CommonString";
import { bytesToBase64 } from "byte-base64";

type TDDL = {
  fieldRenderProps: FieldRenderProps;
  queryStr: string;
};
const DDL: React.FC<TDDL> = ({ fieldRenderProps, queryStr }: TDDL) => {
  const processApi = useApi();
  const [listData, setListData] = useState([]);
  const {
    validationMessage,
    visited,
    value,
    label,
    id,
    valid,
    className,
    ...others
  } = fieldRenderProps;

  useEffect(() => {
    fetchData();
  }, []);

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

      setListData(rows);
    }
  }, []);

  const required = className?.includes("required");
  let DDLvalid = valid;
  if (required) DDLvalid = checkIsDDLValid(value);

  return (
    <DropDownList
      data={listData}
      dataItemKey="sub_code"
      textField="code_name"
      value={value}
      className={className}
      defaultItem={COM_CODE_DEFAULT_VALUE}
      valid={DDLvalid}
      id={id}
      {...others}
    />
  );
};

export default DDL;
