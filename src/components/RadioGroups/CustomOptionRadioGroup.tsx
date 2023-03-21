import React, { useEffect, useState } from "react";
import {
  RadioGroup,
  RadioGroupChangeEvent,
} from "@progress/kendo-react-inputs";
import { RADIO_GROUP_DEFAULT_DATA } from "../CommonString";

type TCustomOptionRadioGroup = {
  name: string;
  customOptionData: any;
  changeData(e: any): void;
  excludedCodes?: any[]; // 제외할 코드값
};
const CustomOptionRadioGroup = ({
  name,
  customOptionData,
  changeData,
  excludedCodes = [],
}: TCustomOptionRadioGroup) => {
  //커스텀 옵션에 저장된 값으로 디폴트 값
  const dataList =
    customOptionData !== null
      ? customOptionData.menuCustomDefaultOptions.query
      : null;

  let defaultValue = "";
  let newRadioGroup = RADIO_GROUP_DEFAULT_DATA;

  if (dataList) {
    defaultValue = dataList.find((item: any) => item.id === name).valueCode;

    const radioGroup = dataList.find((item: any) => item.id === name).Rows;

    newRadioGroup = radioGroup
      .filter((item: any) => !excludedCodes.includes(item.code))
      // 제외 처리 (filter)
      .filter(
        (item: any) =>
          !(
            name === "radWorkType" && //결재표시형식
            (item.code === "D" ||
              item.code === "E" ||
              item.code === "G" ||
              item.code === "H" ||
              item.code === "I")
          )
      )
      .filter(
        (item: any) =>
          !(
            name === "radAppyn" && //결재유무
            (item.code === "B" || item.code === "M")
          )
      )
      .map((column: any) => ({
        value: column.code,
        label: column.caption,
      }));
  }

  const [state, setState] = useState(defaultValue); //상태

  useEffect(() => {
    changeData({ name, value: defaultValue });
  }, []);

  const onChangeHandle = (e: RadioGroupChangeEvent) => {
    const { value } = e;
    const { name } = e.syntheticEvent.currentTarget;

    setState(value);
    changeData({ name, value });
  };

  //changeData(newRadioGroup);

  return (
    <RadioGroup
      name={name}
      data={newRadioGroup}
      layout={"horizontal"}
      defaultValue={state}
      onChange={onChangeHandle}
    />
  );
};

export default CustomOptionRadioGroup;
