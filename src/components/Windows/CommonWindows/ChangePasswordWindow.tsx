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
import { FormInput } from "../../Editors";
import { Iparameters, TPasswordRequirements } from "../../../store/types";
import {
  validator,
  UseParaPc,
  UseGetValueFromSessionItem,
} from "../../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import { passwordExpirationInfoState } from "../../../store/atoms";
import { useRecoilState } from "recoil";

type TKendoWindow = {
  setVisible(t: boolean): void;
};

const KendoWindow = ({ setVisible }: TKendoWindow) => {
  const [pwExpInfo] = useRecoilState(passwordExpirationInfoState);
  const userId = UseGetValueFromSessionItem("user_id");
  const [pwReq, setPwReq] = useState<TPasswordRequirements | null>(null);
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 500,
    height: 310,
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
    if (
      pwExpInfo &&
      pwExpInfo.useExpiration &&
      (pwExpInfo.status === "Expired" || pwExpInfo.status === "Initial")
    ) {
      alert("비밀번호를 수정 후 저장해주세요.");
      return false;
    }
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

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    old_password: "",
    new_password: "",
    check_new_password: "",
    id: userId,
    pc: pc,
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "sys_upd_user_password",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_user_id": paraData.id,
      "@p_old_password": paraData.old_password,
      "@p_new_password": paraData.new_password,
      "@p_check_new_password": paraData.check_new_password,
      "@p_id": paraData.id,
      "@p_pc": paraData.pc,
    },
  };

  const fetchMainSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setVisible(false);
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert(data.resultMessage);
    }
    // 초기화
    setParaData((prev) => ({
      ...prev,
      work_type: "",
    }));
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    const { old_password, new_password, check_new_password } = dataItem;

    setParaData((prev) => ({
      ...prev,
      work_type: "change",
      old_password,
      new_password,
      check_new_password,
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchMainSaved();
  }, [paraData]);

  useEffect(() => {
    fetchPasswordRequirements();
  }, []);

  const fetchPasswordRequirements = async () => {
    let data: any;
    try {
      data = await processApi<any>("get-password-requirements");
    } catch (error) {
      data = null;
    }

    if (data) {
      setPwReq(data);
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  return (
    <Window
      title={"비밀번호 변경"}
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
          old_password: "",
          new_password: "",
          check_new_password: "",
        }}
        render={(formRenderProps: FormRenderProps) => (
          <FormElement horizontal={true}>
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
                  name={"old_password"}
                  label={"현재 비밀번호"}
                  component={FormInput}
                  validator={validator}
                  className={"required"}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"new_password"}
                  label={"새 비밀번호"}
                  component={FormInput}
                  validator={validator}
                  className="required"
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"check_new_password"}
                  label={"비밀번호 확인"}
                  component={FormInput}
                  validator={validator}
                  className="required"
                />
              </FieldWrap>
            </fieldset>
            {pwReq && (
              <div
                style={{
                  fontSize: "12px",
                  textAlign: "right",
                  marginTop: "10px",
                  color: "#ff6358",
                }}
              >
                <p>
                  - 비밀번호는 최소 {pwReq.minimumLength}자리를 입력해주세요.
                </p>
                {pwReq.useSpecialChar && (
                  <p>- 비밀번호는 특수문자를 포함해주세요.</p>
                )}
              </div>
            )}
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
