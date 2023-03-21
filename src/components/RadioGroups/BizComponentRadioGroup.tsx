import React, { useEffect, useState, useCallback } from "react";
import {
  RadioGroup,
  RadioGroupChangeEvent,
} from "@progress/kendo-react-inputs";
import { RADIO_GROUP_DEFAULT_DATA } from "../CommonString";

type TBizComponentRadioGroup = {
  name: string;
  value: string | number;
  bizComponentId: string;
  bizComponentData: any;
  data?: { value: any; label: string }[];
  changeData(e: any): void;
  className?: string;
  excludedCodes?: any[]; // 제외할 코드값
};

const BizComponentRadioGroup = ({
  name,
  value,
  data,
  bizComponentId,
  bizComponentData,
  changeData,
  className = "",
  excludedCodes = [],
}: TBizComponentRadioGroup) => {
  if (bizComponentData) {
    bizComponentData = bizComponentData.find(
      (item: any) => item.bizComponentId === bizComponentId
    );
  }

  const dataList = bizComponentData ? bizComponentData.data.Rows : null;

  let newRadioGroup = RADIO_GROUP_DEFAULT_DATA;

  if (data) {
    newRadioGroup = data;
  } else if (dataList) {
    newRadioGroup = dataList
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

  useEffect(() => {
    changeData({ name, value });
  }, []);

  const onChangeHandle = (e: RadioGroupChangeEvent) => {
    const { value } = e;
    const { name } = e.syntheticEvent.currentTarget;

    changeData({ name, value });
  };

  return (
    <RadioGroup
      name={name}
      data={newRadioGroup}
      layout={"horizontal"}
      value={value}
      onChange={onChangeHandle}
      className={className}
    />
  );
};

export default BizComponentRadioGroup;
