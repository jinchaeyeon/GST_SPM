import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FieldWrap,
} from "../../CommonStyled";
import {
  Form,
  Field,
  FormElement,
  FormRenderProps,
} from "@progress/kendo-react-form";
import { FormInput, FormReadOnly, FormCheckBox } from "../Editors";
import { Iparameters } from "../../store/types";
import {
  validator,
  UseParaPc,
  UseGetValueFromSessionItem,
} from "../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../hooks/interfaces";

type TKendoWindow = {
  setVisible(t: boolean): void;
  reloadData(workType: string): void;
  setGroupId(groupCode: string): void;
  workType: string;
  user_group_id?: string;
  isCopy?: boolean;
  para?: Iparameters; //{};
};

const KendoWindow = ({
  setVisible,
  reloadData,
  setGroupId,
  workType,
  user_group_id = "",
  isCopy,
  para,
}: TKendoWindow) => {
  const userId = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 500,
    height: 320,
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
  const [dataState, setDataState] = useState<State>({
    skip: 0,
    take: 20,
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], dataState)
  );
  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], dataState)
  );

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      fetchMain();
      //fetchGrid();
    }
  }, []);

  const [initialVal, setInitialVal] = useState({
    user_group_id: "",
    user_group_name: "",
    memo: "",
    use_yn: "Y",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SY_A0011W_Q ",
    pageNumber: 1,
    pageSize: 1,
    parameters: {
      "@p_work_type": "LIST",
      "@p_user_group_id": user_group_id,
      "@p_user_group_name": "",
      "@p_lang_id": "",
      "@p_use_yn": "",
    },
  };

  //요약정보 조회
  const fetchMain = async () => {
    let data: any;
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const row = data.tables[0].Rows[0];

      setInitialVal((prev) => {
        return {
          ...prev,
          user_group_id: row.user_group_id,
          user_group_name: row.user_group_name,
          memo: row.memo,
          use_yn: row.use_yn,
        };
      });
    }
  };

  //fetch된 데이터가 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [initialVal]);

  //fetch된 그리드 데이터가 그리드 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [detailDataResult]);

  //상세그리드 조회
  const fetchGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          rowstatus: workType === "N" ? "N" : "",
        };
      });

      setDetailDataResult(() => {
        return {
          data: [...rows],
          total: totalRowCnt,
        };
      });

      //resetForm();
    }
  };

  const pathname: string = window.location.pathname.replace("/", "");

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    user_group_id: "",
    user_group_name: "",
    memo: "",
    use_yn: "",
    userid: userId,
    pc: pc,
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_SY_A0011W_S",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_user_group_id": paraData.user_group_id,
      "@p_user_group_name": paraData.user_group_name,
      "@p_memo": paraData.memo,
      "@p_use_yn": paraData.use_yn,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setMainDataResult(process([], dataState));
    setDetailDataResult(process([], dataState));
  };

  const fetchMainSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      if (workType === "U") {
        resetAllGrid();

        reloadData("U");
        fetchMain();
        fetchGrid();
      } else {
        setVisible(false);
        setGroupId(paraData.user_group_id);
        reloadData("N");
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    //alert(JSON.stringify(dataItem));

    const { user_group_id, user_group_name, memo, use_yn } = dataItem;

    setParaData((prev) => ({
      ...prev,
      work_type: workType,
      user_group_id,
      user_group_name,
      memo: memo,
      use_yn: use_yn === true || use_yn === "Y" ? "Y" : "N",
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchMainSaved();
  }, [paraData]);

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      resetAllGrid();
      fetchGrid();
    }
  }, []);

  return (
    <Window
      title={workType === "N" ? "사용자그룹 생성" : "사용자그룹 정보"}
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
          rowstatus: "",
          user_group_id: initialVal.user_group_id,
          user_group_name: initialVal.user_group_name,
          memo: initialVal.memo,
          use_yn: initialVal.use_yn,
          orderDetails: detailDataResult.data, //detailDataResult.data,
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
                  name={"user_group_id"}
                  label={"사용자그룹ID"}
                  component={workType === "N" ? FormInput : FormReadOnly}
                  validator={validator}
                  className={workType === "N" ? "required" : "readonly"}
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"user_group_name"}
                  label={"사용자그룹명"}
                  component={FormInput}
                  validator={validator}
                  className="required"
                />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field name={"memo"} component={FormInput} label={"메모"} />
              </FieldWrap>
              <FieldWrap fieldWidth="100%">
                <Field
                  name={"use_yn"}
                  label={"사용여부"}
                  component={FormCheckBox}
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
