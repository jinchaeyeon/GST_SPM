import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FieldWrap,
} from "../../../CommonStyled";
import {
  Form,
  Field,
  FormElement,
  FormRenderProps,
} from "@progress/kendo-react-form";
import { FormCheckBox, FormNumericTextBox } from "../../Editors";
import { validator, getYn, getBooleanFromYn } from "../../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";

type TKendoWindow = {
  setVisible(t: boolean): void;
};

const KendoWindow = ({ setVisible }: TKendoWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 350,
    height: 520,
  });

  const handleMove = (event: WindowMoveEvent) => {
    setPosition({ ...position, left: event.left, top: event.top });
  };
  const handleResize = (event: WindowMoveEvent) => {
    setPosition({
      left: event.left,
      top: event.top,
      width: event.width,
      height: event.height,
    });
  };

  const onClose = () => {
    setVisible(false);
  };

  const [formKey, setFormKey] = React.useState(1);
  const resetForm = () => {
    setFormKey(formKey + 1);
  };
  //수정 없이 submit 가능하도록 임의 value를 change 시켜줌
  useEffect(() => {
    const valueChanged = document.getElementById("valueChanged");
    valueChanged!.click();
  }, [formKey]);
  const processApi = useApi();

  useEffect(() => {
    fetchMain();
  }, []);

  const [initialVal, setInitialVal] = useState({
    useExpiration: "",
    expirationPeriodMonths: "",
    minimumLength: "",
    useSpecialChar: "",
    useChangeNext: "",
    useAccessRestriction: "",
    maximumNumberOfWrongs: "",
    useNotifyBeforePeriod: "",
    notifyBeforePeriodDays: "",
  });

  // 조회
  const fetchMain = async () => {
    let data: any;
    try {
      data = await processApi<any>("get-password-requirements");
    } catch (error) {
      data = null;
    }

    if (data) {
      const {
        useExpiration,
        expirationPeriodMonths,
        minimumLength,
        useSpecialChar,
        useChangeNext,
        useAccessRestriction,
        maximumNumberOfWrongs,
        useNotifyBeforePeriod,
        notifyBeforePeriodDays,
      } = data;

      setInitialVal((prev) => {
        return {
          ...prev,
          useExpiration: getYn(useExpiration),
          expirationPeriodMonths: expirationPeriodMonths,
          minimumLength: minimumLength,
          useSpecialChar: getYn(useSpecialChar),
          useChangeNext: getYn(useChangeNext),
          useAccessRestriction: getYn(useAccessRestriction),
          maximumNumberOfWrongs: maximumNumberOfWrongs,
          useNotifyBeforePeriod: getYn(useNotifyBeforePeriod),
          notifyBeforePeriodDays: notifyBeforePeriodDays,
        };
      });
    }
  };

  //fetch된 데이터가 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [initialVal]);

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    useExpiration: true,
    expirationPeriodMonths: "",
    minimumLength: "",
    useSpecialChar: true,
    useChangeNext: true,
    useAccessRestriction: true,
    maximumNumberOfWrongs: "",
    useNotifyBeforePeriod: true,
    notifyBeforePeriodDays: "",
  });

  const fetchMainSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("set-password-requirements", paraData);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      setVisible(false);
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    const {
      useExpiration,
      expirationPeriodMonths,
      minimumLength,
      useSpecialChar,
      useChangeNext,
      useAccessRestriction,
      maximumNumberOfWrongs,
      useNotifyBeforePeriod,
      notifyBeforePeriodDays,
    } = dataItem;

    setParaData((prev) => ({
      ...prev,
      work_type: "U",
      useExpiration: getBooleanFromYn(useExpiration),
      expirationPeriodMonths,
      minimumLength,
      useSpecialChar: getBooleanFromYn(useSpecialChar),
      useChangeNext: getBooleanFromYn(useChangeNext),
      useAccessRestriction: getBooleanFromYn(useAccessRestriction),
      maximumNumberOfWrongs,
      useNotifyBeforePeriod: getBooleanFromYn(useNotifyBeforePeriod),
      notifyBeforePeriodDays,
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchMainSaved();
  }, [paraData]);

  return (
    <Window
      title={"시스템 옵션 (관리자)"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <Form
        onSubmit={handleSubmit}
        key={formKey}
        initialValues={{
          useExpiration: initialVal.useExpiration,
          expirationPeriodMonths: initialVal.expirationPeriodMonths,
          minimumLength: initialVal.minimumLength,
          useSpecialChar: initialVal.useSpecialChar,
          useChangeNext: initialVal.useChangeNext,
          useAccessRestriction: initialVal.useAccessRestriction,
          maximumNumberOfWrongs: initialVal.maximumNumberOfWrongs,
          useNotifyBeforePeriod: initialVal.useNotifyBeforePeriod,
          notifyBeforePeriodDays: initialVal.notifyBeforePeriodDays,
        }}
        render={(formRenderProps: FormRenderProps) => (
          <FormElement horizontal={true} className="sys-opt-wnd-form-elem">
            <fieldset className={"k-form-fieldset"}>
              <button
                id="valueChanged"
                style={{ display: "none" }}
                onClick={(e) => {
                  e.preventDefault(); // Changing desired field value
                  formRenderProps.onChange("valueChanged", {
                    value: "1",
                  });
                }}
              ></button>

              <FieldWrap fieldWidth="100%">
                <Field
                  name={"useExpiration"}
                  label={"비밀번호 만료 사용 여부"}
                  component={FormCheckBox}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"expirationPeriodMonths"}
                  label={"비밀번호 유효 기간 (월)"}
                  component={FormNumericTextBox}
                  validator={validator}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"minimumLength"}
                  label={"비밀번호 최소 길이"}
                  component={FormNumericTextBox}
                  validator={validator}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"useSpecialChar"}
                  label={"비밀번호 특수문자 확인"}
                  component={FormCheckBox}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"useChangeNext"}
                  label={"비밀번호 다음에 변경 허용"}
                  component={FormCheckBox}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"useAccessRestriction"}
                  label={"비밀번호 입력 오류 시 접속 제한"}
                  component={FormCheckBox}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"maximumNumberOfWrongs"}
                  label={"비밀번호 입력 오류 허용 횟수"}
                  component={FormNumericTextBox}
                  validator={validator}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"useNotifyBeforePeriod"}
                  label={"비밀번호 유효기간 만료 전 알림"}
                  component={FormCheckBox}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"notifyBeforePeriodDays"}
                  label={"만료 전 알림 기간(일)"}
                  component={FormNumericTextBox}
                  validator={validator}
                />
              </FieldWrap>
            </fieldset>
            <BottomContainer>
              <ButtonContainer>
                <Button type={"submit"} themeColor={"primary"} icon="save">
                  저장
                </Button>
              </ButtonContainer>
            </BottomContainer>
          </FormElement>
        )}
      />
    </Window>
  );
};

export default KendoWindow;
