/*  Form 내에서 사용되는 컴포넌트들을 저장하는 페이지   */
import React, { useCallback, useEffect, useState } from "react";
import {
  Checkbox,
  Input,
  TextArea,
  NumericTextBox,
  NumericTextBoxChangeEvent,
} from "@progress/kendo-react-inputs";
import {
  Field,
  FieldRenderProps,
  FieldWrapper,
} from "@progress/kendo-react-form";
import { Label, Error } from "@progress/kendo-react-labels";
import { GridCellProps } from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import FieldDropDownList from "./DropDownLists/FieldDropDownList";
import FieldComboBox from "./ComboBoxes/FieldComboBox";
import FieldCheckBox from "./CheckBoxes/FieldCheckBox";
import {
  checkIsDDLValid,
  checkIsObjValid,
  getQueryFromBizComponent,
  numberWithCommas,
  requiredValidator,
} from "./CommonFunction";
import moment from "moment";
import { useApi } from "../hooks/api";
import { FORM_DATA_INDEX } from "./CommonString";
import { bytesToBase64 } from "byte-base64";
import { IFormComboBoxCell } from "../hooks/interfaces";

//Grid Cell에 표시되는 Value
export const DisplayValue = (fieldRenderProps: FieldRenderProps) => {
  return <>{fieldRenderProps.value}</>;
};

//Grid Cell에 표시되는 Number Value
export const DisplayNumberValue = (fieldRenderProps: FieldRenderProps) => {
  return <>{numberWithCommas(fieldRenderProps.value)}</>;
};

//Grid Cell에 표시되는 DropDownList Name Value
const DisplayDDLValue = (fieldRenderProps: FieldRenderProps) => {
  return <>{fieldRenderProps.value ? fieldRenderProps.value.code_name : ""}</>;
};

//Grid Cell에 표시되는 ComboBox Name Value
const DisplayComboBoxValue = (fieldRenderProps: FieldRenderProps) => {
  const { valueField, textField, listData, value } = fieldRenderProps;

  const valueObj =
    typeof value === "string"
      ? listData.find((item: any) => item[valueField] === value)
      : value;

  return (
    <>
      {value && listData.length > 0
        ? valueObj
          ? valueObj[textField]
          : ""
        : ""}
    </>
  );
};

//Grid Cell 수정모드에서 사용되는 Text Input
const TextInputWithValidation = (fieldRenderProps: FieldRenderProps) => {
  const {
    onBlur,
    validationMessage,
    visited,
    value,
    name,
    valid,
    className,
    ...others
  } = fieldRenderProps;

  const required = className?.includes("required");
  return (
    <div>
      <Input
        value={value}
        valid={required && !value ? false : true}
        className={className ?? ""}
        {...others}
      />
    </div>
  );
};

//Grid Cell 수정모드에서 사용되는 Numeric Text Input
export const NumericTextBoxWithValidation = (
  fieldRenderProps: FieldRenderProps
) => {
  const {
    onBlur,
    validationMessage,
    visited,
    valid,
    value,
    name,
    className,
    onChange,
    calculateAmt,
    ...others
  } = fieldRenderProps;
  // const { calculateAmt, calculateSpecialAmt } =
  //   React.useContext(FormGridEditContext);
  const anchor: any = React.useRef(null);

  const onInputChange = (e: NumericTextBoxChangeEvent) => {
    const { target, value } = e;
    onChange({ target: target, value: value === null ? 0 : value });
  };

  const required = className?.includes("required");
  return (
    <div>
      <NumericTextBox
        onChange={onInputChange}
        value={value}
        valid={required && Number(value) < 1 ? false : true}
        className={className ?? ""}
        ref={anchor}
        {...others}
      />
      {visited && validationMessage && <Error>{validationMessage}</Error>}
    </div>
  );
};

//Grid Cell 수정모드에서 사용되는 DropDownList
const DDLWithValidation = (fieldRenderProps: FieldRenderProps) => {
  const { queryStr } = fieldRenderProps;

  return (
    <div>
      <FieldDropDownList
        fieldRenderProps={fieldRenderProps}
        queryStr={queryStr}
      />
      {/* {visited && validationMessage && <Error>{validationMessage}</Error>} */}
    </div>
  );
};

//Grid Cell 수정모드에서 사용되는 ComboBox
const ComboBoxWithValidation = (fieldRenderProps: FieldRenderProps) => {
  const { listData, valueField, textField } = fieldRenderProps;

  return (
    <div>
      <FieldComboBox
        fieldRenderProps={fieldRenderProps}
        listData={listData}
        valueField={valueField}
        textField={textField}
      />
      {/* {visited && validationMessage && <Error>{validationMessage}</Error>} */}
    </div>
  );
};

//Grid Cell 수정모드에서 사용되는 CheckBox
const CheckBoxWithValidation = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, visited, value, label, id, valid, ...others } =
    fieldRenderProps;

  return (
    <Checkbox
      value={value === "Y" || value === true ? true : false}
      valid={valid}
      id={id}
      {...others}
    />
  );
};

const CheckBoxReadOnly = (fieldRenderProps: FieldRenderProps) => {
  const {
    validationMessage,
    visited,
    value,
    label,
    id,
    valid,
    onChange, // 사용자가 값 수정 못하도록 함
    ...others
  } = fieldRenderProps;

  return (
    <div>
      <Checkbox
        value={value === "Y" || value === true ? true : false}
        valid={valid}
        id={id}
        {...others}
      />
      {visited && validationMessage && <Error>{validationMessage}</Error>}
    </div>
  );
};

//Grid Cell에서 사용되는 Number Feild
export const FormNumberCell = (props: GridCellProps) => {
  const { field, dataItem, className, render } = props;
  const isInEdit = field === dataItem.inEdit;
  const parentField = dataItem.parentField;

  let defaultRendering = (
    <td className={className ?? ""} style={{ textAlign: "right" }}>
      <Field
        component={isInEdit ? NumericTextBoxWithValidation : DisplayNumberValue}
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
        className={className ?? ""}
      />
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

//Grid Cell에서 사용되는 Name Feild
export const FormNameCell = (props: GridCellProps) => {
  const { field, dataItem, className = "", render } = props;
  let isInEdit = field === dataItem.inEdit;
  if (className.includes("read-only")) {
    isInEdit = false;
  } else if (className.includes("editable-new-only")) {
    if (dataItem["rowstatus"] !== "N") {
      isInEdit = false;
    }
  }
  const parentField = dataItem.parentField;

  let defaultRendering = (
    <td className={className ?? ""}>
      <Field
        component={isInEdit ? TextInputWithValidation : DisplayValue}
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
        className={className ?? ""}
      />
    </td>
  );
  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

//Grid Cell에서 사용되는 ReadOnly NumberCell
export const FormReadOnlyNumberCell = (props: GridCellProps) => {
  const { field, dataItem, className } = props;
  const parentField = dataItem.parentField;

  return (
    <td className={className ?? ""} style={{ textAlign: "right" }}>
      <Field
        component={DisplayNumberValue}
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
      />
    </td>
  );
};

//Grid Cell에서 사용되는 DropDownList Feild
export const FormDropDownListCell = (props: GridCellProps) => {
  const { field, dataItem, className, render } = props;
  const isInEdit = field === dataItem.inEdit;
  const parentField = dataItem.parentField;

  const queryStr = dataItem[field ?? ""];

  const required = className?.includes("required");

  let defaultRendering = (
    <td className={required ? "required" : ""}>
      <Field
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
        component={isInEdit ? DDLWithValidation : DisplayDDLValue}
        queryStr={queryStr}
        className={className ?? ""}
      />
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

export const FormComboBoxCell = (props: IFormComboBoxCell) => {
  const {
    field,
    dataItem,
    className,
    render,
    bizComponent,
    valueField = "sub_code",
    textField = "code_name",
    data,
    columns,
  } = props;

  const processApi = useApi();
  const isInEdit = field === dataItem.inEdit;
  const parentField = dataItem.parentField;

  const queryStr = bizComponent ? getQueryFromBizComponent(bizComponent) : "";
  const bizComponentItems = bizComponent ? bizComponent.bizComponentItems : [];

  const [listData, setListData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    if (queryStr === "") return false;
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

  let defaultRendering = (
    <td className={className}>
      <Field
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
        component={isInEdit ? ComboBoxWithValidation : DisplayComboBoxValue}
        listData={data ? data : listData}
        textField={textField}
        valueField={valueField}
        columns={columns ? columns : bizComponentItems}
        className={className ?? ""}
      />
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

//Grid Cell에서 사용되는 CheckBox Feild
export const FormCheckBoxCell = (props: GridCellProps) => {
  const { field, dataItem, className, render } = props;
  const parentField = dataItem.parentField;

  const required = className?.includes("required");

  let defaultRendering = (
    <td className={className ?? ""} style={{ textAlign: "center" }}>
      <Field
        component={CheckBoxWithValidation}
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
        validator={required ? requiredValidator : undefined}
      />
    </td>
  );

  return render
    ? render.call(undefined, defaultRendering, props)
    : defaultRendering;
};

//Grid Cell에서 사용되는 ReadOnly CheckBox Feild
export const FormCheckBoxReadOnlyCell = (props: GridCellProps) => {
  const { field, dataItem, className, render } = props;
  const parentField = dataItem.parentField;

  return (
    <td className={className ?? ""} style={{ textAlign: "center" }}>
      <Field
        component={CheckBoxReadOnly}
        name={`${parentField}[${dataItem[FORM_DATA_INDEX]}].${field}`}
      />
    </td>
  );
};

//Form Field에서 사용되는 Input
export const FormInput = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, visited, label, id, valid, ...others } =
    fieldRenderProps;

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <Input valid={valid} id={id} {...others} />
      </div>
    </FieldWrapper>
  );
};

export const FormTextArea = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, label, id, valid, max, ...others } =
    fieldRenderProps;

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <TextArea valid={valid} id={id} rows={8} {...others} />
      </div>
    </FieldWrapper>
  );
};

//Form Field에서 사용되는 NumericTextBox
export const FormNumericTextBox = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, visited, label, id, valid, ...others } =
    fieldRenderProps;

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <NumericTextBox valid={valid} id={id} {...others} />
      </div>
    </FieldWrapper>
  );
};

//Form Field에서 사용되는 ReadOnly Input
export const FormReadOnly = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, visited, label, id, valid, ...others } =
    fieldRenderProps;

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <Input valid={valid} id={id} {...others} readOnly />
      </div>
    </FieldWrapper>
  );
};

//Form Field에서 사용되는 드롭다운리스트
export const FormDropDownList = (fieldRenderProps: FieldRenderProps) => {
  const { value, label, id, valid, queryStr, className } = fieldRenderProps;

  const required = className?.includes("required");
  let DDLvalid = valid;
  if (required) DDLvalid = checkIsDDLValid(value);

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={DDLvalid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <FieldDropDownList
          fieldRenderProps={fieldRenderProps}
          queryStr={queryStr}
        />
      </div>
    </FieldWrapper>
  );
};

//Form Field에서 사용되는 콤보박스
export const FormComboBox = (fieldRenderProps: FieldRenderProps) => {
  const {
    value,
    label,
    id,
    valid,
    queryStr = "",
    className,
    valueField = "sub_code",
    textField = "code_name",
    ifGetCompanyCode = false,
    data,
  } = fieldRenderProps;
  const processApi = useApi();
  const [listData, setListData] = useState([]);

  const required = className?.includes("required");
  let isValid = valid;
  if (required) {
    const comparisonValue = { [valueField]: "", [textField]: "" };
    isValid = checkIsObjValid(value, comparisonValue);
  }

  useEffect(() => {
    if (ifGetCompanyCode) {
      fetchCompanyCode();
    } else {
      fetchData();
    }
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

  const fetchCompanyCode = useCallback(async () => {
    let data: any;

    try {
      data = await processApi<any>("company-code");
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      const rows = data.Rows;
      setListData(rows);
    }
  }, []);

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={isValid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <FieldComboBox
          fieldRenderProps={fieldRenderProps}
          listData={data ? data : listData}
          valueField={valueField}
          textField={textField}
        />
      </div>
    </FieldWrapper>
  );
};

//Form Field에서 사용되는 체크박스
export const FormCheckBox = (fieldRenderProps: FieldRenderProps) => {
  const { value, label, id, valid, className } = fieldRenderProps;

  const required = className?.includes("required");
  let DDLvalid = valid;
  if (required) DDLvalid = checkIsDDLValid(value);

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={DDLvalid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <FieldCheckBox fieldRenderProps={fieldRenderProps} />
      </div>
    </FieldWrapper>
  );
};
//Form Field에서 사용되는 DatePicker
export const FormDatePicker = (fieldRenderProps: FieldRenderProps) => {
  const {
    validationMessage,
    visited,
    label,
    id,
    valid,
    value,
    className,
    ...others
  } = fieldRenderProps;

  const dateValid = moment(value, "YYYY-MM-DD HH:mm:ss", true).isValid();

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <DatePicker
          format="yyyy-MM-dd"
          valid={!!dateValid}
          value={value}
          className={className ?? ""}
          id={id}
          {...others}
        />
      </div>
    </FieldWrapper>
  );
};
