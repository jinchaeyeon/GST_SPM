import * as React from "react";
import { DropDownList, DropDownListChangeEvent } from "@progress/kendo-react-dropdowns";
import { GridFilterCellProps } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";

interface DropdownFilterCellProps extends GridFilterCellProps {
  defaultItem: { sub_code: string; code_name: string } | null;
  data: { sub_code: string; code_name: string }[];
}

export const DropdownFilterCell = (props: DropdownFilterCellProps) => {
  const hasValue = (value: { sub_code: string; code_name: string } | null) => {
    return value && (props.defaultItem === null || value.sub_code !== props.defaultItem?.sub_code);
  };

  const onChange = (event: DropDownListChangeEvent) => {
    const value = event.target.value as { sub_code: string; code_name: string };
    const hasValueResult = hasValue(value);

    // 필터 변경 로직
    props.onChange({
      value: hasValueResult ? value.sub_code : "",
      operator: hasValueResult ? "eq" : "",
      syntheticEvent: event.syntheticEvent,
    });
  };

  const onClearButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    props.onChange({
      value: "",
      operator: "",
      syntheticEvent: event,
    });
  };

  return (
    <div className="k-filtercell">
      <DropDownList
        data={props.data}
        textField="code_name" // 표시할 필드 설정
        dataItemKey="sub_code" // 선택할 필드의 키 설정
        onChange={onChange}
        value={props.data.find(item => item.sub_code === props.value) || props.defaultItem} // value 설정
        defaultItem={props.defaultItem || { sub_code: "", code_name: "Select..." }} // 기본 항목 설정
      />
      <Button
        title="Clear"
        disabled={!hasValue(props.value as { sub_code: string; code_name: string })}
        onClick={onClearButtonClick}
        icon="filter-clear"
      />
    </div>
  );
};
