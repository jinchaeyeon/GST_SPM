import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FieldWrap,
  GridContainer,
} from "../../CommonStyled";
import {
  Form,
  Field,
  FormElement,
  FieldArray,
  FieldArrayRenderProps,
  FormRenderProps,
} from "@progress/kendo-react-form";
import { Error } from "@progress/kendo-react-labels";
import { clone } from "@progress/kendo-react-common";
import { FormReadOnly, FormCheckBoxCell } from "../Editors";
import { Iparameters } from "../../store/types";
import {
  validator,
  arrayLengthValidator,
  UseBizComponent,
  UseMessages,
  getYn,
  UseParaPc,
  UseGetValueFromSessionItem,
} from "../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../hooks/interfaces";
import { EDIT_FIELD, FORM_DATA_INDEX } from "../CommonString";
import { CellRender, RowRender } from "../Renderers/Renderers";

// Create React.Context to pass props to the Form Field components from the main component
export const FormGridEditContext = React.createContext<{
  onEdit: (dataItem: any, isNew: boolean) => void;
  onSave: () => void;
  editIndex: number | undefined;
  parentField: string;
}>({} as any);

type TPara = {
  user_id: string;
  user_name: string;
};
type TKendoWindow = {
  getVisible(isVisible: boolean): void;
  reloadData(): void;
  para: TPara;
};

type TDetailData = {
  chk_yn_s: string[];
  user_group_id_s: string[];
};

// Create the Grid that will be used inside the Form
const FormGrid = (fieldArrayRenderProps: FieldArrayRenderProps) => {
  const { validationMessage, visited, name, dataItemKey } =
    fieldArrayRenderProps;
  const [editIndex, setEditIndex] = React.useState<number | undefined>();
  const editItemCloneRef = React.useRef();

  // Update an item from the Grid and update the index of the edited item
  const onEdit = React.useCallback((dataItem: any, isNewItem: any) => {
    if (!isNewItem) {
      editItemCloneRef.current = clone(dataItem);
    }

    fieldArrayRenderProps.onReplace({
      index: dataItem[FORM_DATA_INDEX],
      value: {
        ...dataItem,
        rowstatus: dataItem.rowstatus === "N" ? dataItem.rowstatus : "U",
      },
    });

    setEditIndex(dataItem[FORM_DATA_INDEX]);
  }, []);

  // Save the changes
  const onSave = React.useCallback(() => {
    setEditIndex(undefined);
  }, [fieldArrayRenderProps]);

  const dataWithIndexes = fieldArrayRenderProps.value.map(
    (item: any, index: any) => {
      return { ...item, [FORM_DATA_INDEX]: index };
    }
  );

  const enterEdit = (dataItem: any, field: string | undefined) => {
    fieldArrayRenderProps.onReplace({
      index: dataItem[FORM_DATA_INDEX],
      value: {
        ...dataItem,
        rowstatus: dataItem.rowstatus === "N" ? dataItem.rowstatus : "U",
        [EDIT_FIELD]: field,
      },
    });

    setEditIndex(dataItem[FORM_DATA_INDEX]);
  };

  const exitEdit = (item: any) => {
    fieldArrayRenderProps.value.forEach((item: any, index: any) => {
      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...item,
          [EDIT_FIELD]: undefined,
        },
      });
    });
  };

  const customCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  return (
    <GridContainer margin={{ top: "30px" }}>
      <FormGridEditContext.Provider
        value={{
          onEdit,
          onSave,
          editIndex,
          parentField: name,
        }}
      >
        {visited && validationMessage && <Error>{validationMessage}</Error>}
        <Grid
          data={dataWithIndexes.map((item: any) => ({
            ...item,
            parentField: name,
          }))}
          total={dataWithIndexes.total}
          dataItemKey={dataItemKey}
          style={{ height: "400px" }}
          cellRender={customCellRender}
          rowRender={customRowRender}
        >
          <GridColumn field="rowstatus" title=" " width="40px" />
          <GridColumn
            field="chk_yn"
            title=" "
            width="50px"
            cell={FormCheckBoxCell}
          />
          <GridColumn field="user_group_id" title="그룹ID" width="240px" />
          <GridColumn field="user_group_name" title="그룹명" width="240px" />
        </Grid>
      </FormGridEditContext.Provider>
    </GridContainer>
  );
};
const KendoWindow = ({
  getVisible,
  reloadData,
  para = { user_id: "", user_name: "" },
}: TKendoWindow) => {
  const { user_id, user_name } = para;
  const userId = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  // 비즈니스 컴포넌트 조회
  const [bizComponentData, setBizComponentData] = useState<any>([]);
  UseBizComponent("L_BA000", setBizComponentData);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 800,
    height: 600,
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
    getVisible(false);
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

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], dataState)
  );
  useEffect(() => {
    fetchGrid();
  }, []);

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SY_A0013W_Q ",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "GROUPID",
      "@p_orgdiv": "",
      "@p_location": "",
      "@p_dptcd": "",
      "@p_lang_id": "",
      "@p_user_category": "",
      "@p_user_id": "",
      "@p_user_name": "",
      "@p_menu_name": "",
      "@p_layout_key": "",
      "@p_category": "",
      "@p_service_id": "",
    },
  };

  //fetch된 그리드 데이터가 그리드 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [detailDataResult]);

  //상세그리드 조회
  const fetchGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
        };
      });

      setDetailDataResult(() => {
        return {
          data: [...rows],
          total: totalRowCnt,
        };
      });
    }
  };

  const pathname: string = window.location.pathname.replace("/", "");

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    orgdiv: "01",
    chk_yn_s: "",
    user_group_id_s: "",
    user_id_s: user_id,
    target_user_s: "",
    row_state_s: "",
    add_delete_type_s: "",
    menu_id_s: "",
    form_view_yn_s: "",
    form_print_yn_s: "",
    form_save_yn_s: "",
    form_delete_yn_s: "",
    layout_key: "",
    category: "",
    userid: userId,
    pc: pc,
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_SY_A0013W_S ",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_orgdiv": paraData.orgdiv,
      "@p_chk_yn_s": paraData.chk_yn_s,
      "@p_user_group_id_s": paraData.user_group_id_s,
      "@p_user_id_s": paraData.user_id_s,
      "@p_target_user_s": paraData.target_user_s,
      "@p_row_state_s": paraData.row_state_s,
      "@p_add_delete_type_s": paraData.add_delete_type_s,
      "@p_menu_id_s": paraData.menu_id_s,
      "@p_form_view_yn_s": paraData.form_view_yn_s,
      "@p_form_print_yn_s": paraData.form_print_yn_s,
      "@p_form_save_yn_s": paraData.form_save_yn_s,
      "@p_form_delete_yn_s": paraData.form_delete_yn_s,
      "@p_layout_key": paraData.layout_key,
      "@p_category": paraData.category,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setDetailDataResult(process([], dataState));
  };

  const fetchSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      resetAllGrid();
      reloadData();
      fetchGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    const { user_id, groupDetails } = dataItem;

    let detailArr: TDetailData = {
      chk_yn_s: [],
      user_group_id_s: [],
    };

    groupDetails.forEach((item: any, i: number) => {
      const { rowstatus, chk_yn, user_group_id } = item;
      if (rowstatus !== "U") return;

      detailArr.chk_yn_s.push(getYn(chk_yn));
      detailArr.user_group_id_s.push(user_group_id);
    });

    setParaData((prev) => ({
      ...prev,
      work_type: "U",
      p_user_id_s: user_id,
      chk_yn_s: detailArr.chk_yn_s.join("|"),
      user_group_id_s: detailArr.user_group_id_s.join("|"),
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchSaved();
  }, [paraData]);

  useEffect(() => {
    if (bizComponentData.length) {
      resetAllGrid();
      fetchGrid();
    }
  }, [bizComponentData]);

  return (
    <Window
      title={"권한그룹 설정"}
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
          user_id,
          user_name,
          groupDetails: detailDataResult.data, //detailDataResult.data,
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
              <FieldWrap fieldWidth="50%">
                <Field
                  name={"user_id"}
                  label={"사용자ID"}
                  component={FormReadOnly}
                  validator={validator}
                  className={"readonly"}
                />
                <Field
                  name={"user_name"}
                  label={"사용자명"}
                  component={FormReadOnly}
                  validator={validator}
                  className={"readonly"}
                />
              </FieldWrap>
            </fieldset>
            <FieldArray
              name="groupDetails"
              dataItemKey={FORM_DATA_INDEX}
              component={FormGrid}
              validator={arrayLengthValidator}
            />

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
