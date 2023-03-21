import React, { useCallback, useEffect, useState } from "react";
import {
  ComboBoxChangeEvent,
  MultiColumnComboBox,
  MultiColumnComboBoxChangeEvent,
} from "@progress/kendo-react-dropdowns";
import { useApi } from "../../hooks/api";
import { GridCellProps } from "@progress/kendo-react-grid";
import { getQueryFromBizComponent } from "../CommonFunction";
import { TreeListCellProps } from "@progress/kendo-react-treelist";
import { bytesToBase64 } from "byte-base64";

interface CustomCellProps extends TreeListCellProps {
  bizComponent: any;
  valueField?: string;
  textField?: string;
  readOnly?: boolean;
}
const ComboBoxCell = (props: CustomCellProps) => {
  const {
    level,
    ariaColumnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    bizComponent,
    valueField = "sub_code",
    textField = "code_name",
    readOnly = false,
    ...others
  } = props;

  const processApi = useApi();
  const [listData, setListData]: any = useState([]);
  const isInEdit = readOnly ? false : field === dataItem.inEdit;
  const queryStr = bizComponent ? getQueryFromBizComponent(bizComponent) : "";

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
    } else {
      console.log("[오류발생]");
      console.log(data);
    }
  }, []);

  const handleChange = (e: ComboBoxChangeEvent) => {
    if (onChange) {
      onChange({
        level: level,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });
    }
  };
  const columns = bizComponent ? bizComponent.bizComponentItems : [];
  let newColumns = columns.map((column: any) => ({
    field: column.fieldName,
    header: column.caption,
    width: column.columnWidth,
  }));
  newColumns = newColumns.filter((column: any) => column.width !== 0);

  const dataValue = dataItem[field] === null ? "" : dataItem[field];
  const value = listData.find((item: any) => item[valueField] === dataValue);

  const defaultRendering = (
    <td aria-colindex={ariaColumnIndex}>
      {isInEdit ? (
        <MultiColumnComboBox
          data={listData}
          value={value}
          columns={newColumns}
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
