import {
  useEffect,
  useState,
  useContext,
  useCallback,
  createContext,
} from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import RequiredHeader from "../RequiredHeader";
import {
  Grid,
  GridColumn,
  GridCellProps,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInField,
  ButtonInFieldWrap,
  FieldWrap,
  GridContainer,
  GridTitle,
} from "../../CommonStyled";
import {
  Form,
  Field,
  FormElement,
  FieldArray,
  FieldArrayRenderProps,
  FormRenderProps,
} from "@progress/kendo-react-form";
import {
  FormInput,
  FormDatePicker,
  FormReadOnly,
  FormComboBoxCell,
  FormComboBox,
  FormTextArea,
  FormCheckBox,
  FormCheckBoxReadOnlyCell,
  FormCheckBoxCell,
} from "../Editors";
import { Iparameters } from "../../store/types";
import {
  convertDateToStr,
  dateformat,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  setDefaultDate,
  getCodeFromValue,
  arrayLengthValidator,
  getUnpQuery,
  getQueryFromBizComponent,
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import { IAttachmentData, IWindowPosition } from "../../hooks/interfaces";
import {
  EDIT_FIELD,
  FORM_DATA_INDEX,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../CommonString";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { useRecoilState } from "recoil";
import { bytesToBase64 } from "byte-base64";

const idGetter = getter(FORM_DATA_INDEX);

type TKendoWindow = {
  getVisible(t: boolean): void;
  reloadData(workType: string): void;
  workType: "U" | "N";
  datnum?: string;
  categories?: string;
  para?: Iparameters; //{};
};

type TDetailData = {
  person2: string[];
  chooses: string[];
  loadok: string[];
  readok: string[];
};

export const unpContext = createContext<{
  publish_start_date: string;
  setOrddt: (publish_start_date: string) => void;
  category: string;
  setCategory: (category: string) => void;
  unpList: [];
  getUnpList: (contents: string) => void;
}>({} as any);

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_dptcd_001, L_HU005", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "dptcd" ? "L_dptcd_001" : field === "postcd" ? "L_HU005" : "";

  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  if (bizComponentIdVal == "L_dptcd_001") {
    return bizComponent ? (
      <FormComboBoxCell
        bizComponent={bizComponent}
        valueField="dptcd"
        textField="dptnm"
        {...props}
      />
    ) : (
      <td />
    );
  } else {
    return bizComponent ? (
      <FormComboBoxCell bizComponent={bizComponent} {...props} />
    ) : (
      <td />
    );
  }
};
const FormGrid2 = (fieldArrayRenderProps: FieldArrayRenderProps) => {
  const { name, dataItemKey } = fieldArrayRenderProps;

  const dataWithIndexes = fieldArrayRenderProps.value.map(
    (item: any, index: any) => {
      return { ...item, [FORM_DATA_INDEX]: index };
    }
  );

  const [selectedState, setSelectedState] = React.useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = React.useCallback(
    (event: GridSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState,
        dataItemKey: FORM_DATA_INDEX,
      });
      setSelectedState(newSelectedState);
    },
    [selectedState]
  );

  return (
    <GridContainer
      style={{
        display: "inline-block",
        marginLeft: "3%",
        width: "37%",
        float: "right",
        height: "500px",
      }}
    >
      <Grid
        data={dataWithIndexes.map((item: any) => ({
          ...item,
          parentField: name,
          [SELECTED_FIELD]: selectedState[idGetter(item)],
        }))}
        //선택 기능
        dataItemKey={dataItemKey}
        selectedField={SELECTED_FIELD}
        selectable={{
          enabled: true,
          mode: "single",
        }}
        onSelectionChange={onSelectionChange}
        total={dataWithIndexes.total}
      >
        <GridColumn
          field="custcd"
          title="업체코드"
          width="140px"
          headerCell={RequiredHeader}
          className="required"
          editable={false}
        />
        <GridColumn
          field="custnm"
          title="부서"
          width="150px"
          editable={false}
        />
        <GridColumn
          field="user_name"
          title="이름"
          width="140px"
          editable={false}
        />
        <GridColumn
          field="chooses"
          title="참조"
          width="60px"
          cell={FormCheckBoxCell}
        />
      </Grid>
    </GridContainer>
  );
};
// Create the Grid that will be used inside the Form
const FormGrid = (fieldArrayRenderProps: FieldArrayRenderProps) => {
  const { name, dataItemKey } = fieldArrayRenderProps;
  const { category } = useContext(unpContext);

  const dataWithIndexes = fieldArrayRenderProps.value.map(
    (item: any, index: any) => {
      return { ...item, [FORM_DATA_INDEX]: index };
    }
  );

  const [selectedState, setSelectedState] = React.useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = React.useCallback(
    (event: GridSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState,
        dataItemKey: FORM_DATA_INDEX,
      });
      setSelectedState(newSelectedState);
    },
    [selectedState]
  );

  return (
    <GridContainer
      style={{
        display: "inline-block",
        marginLeft: "3%",
        width: "37%",
        float: "right",
        height: "500px",
      }}
    >
      <GridTitle>참조</GridTitle>
      <Grid
        data={dataWithIndexes.map((item: any) => ({
          ...item,
          parentField: name,
          [SELECTED_FIELD]: selectedState[idGetter(item)],
        }))}
        //선택 기능
        dataItemKey={dataItemKey}
        selectedField={SELECTED_FIELD}
        selectable={{
          enabled: true,
          mode: "single",
        }}
        onSelectionChange={onSelectionChange}
        total={dataWithIndexes.total}
        style={{ height: "500px" }}
      >
        <GridColumn
          field="user_name"
          title="성명"
          width="100px"
          className="required"
          editable={false}
        />
        <GridColumn
          field="dptcd"
          title="부서"
          width="140px"
          editable={false}
          cell={CustomComboBoxCell}
        />
        <GridColumn
          field="postcd"
          title="직위"
          width="90px"
          editable={false}
          cell={CustomComboBoxCell}
        />
        <GridColumn
          field="chooses"
          title="참조"
          width="60px"
          cell={category == "200" ? FormCheckBoxCell : FormCheckBoxReadOnlyCell}
        />
        <GridColumn
          field="loadok"
          title="확인"
          width="60px"
          cell={FormCheckBoxCell}
        />
        <GridColumn field="readok" title="열람" width="60px" editable={false} />
      </Grid>
    </GridContainer>
  );
};

const KendoWindow = ({
  getVisible,
  reloadData,
  workType,
  datnum,
  categories,
  para,
}: TKendoWindow) => {
  const userId = UseGetValueFromSessionItem("user_id");
  const user_name = UseGetValueFromSessionItem("user_name");
  const pathname: string = window.location.pathname.replace("/", "");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1500,
    height: 700,
  });

  const [unpList, setUnpList] = useState<any>([]);
  const [publish_start_date, setOrddt] = useState("");
  const [category, setCategory] = useState(
    categories == "" || categories == undefined ? "100" : categories
  );

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
    group: [{ field: "itemacnt" }],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], dataState)
  );
  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], dataState)
  );
  const [detailDataResult2, setDetailDataResult2] = useState<DataResult>(
    process([], dataState)
  );

  useEffect(() => {
    if (workType == "U") {
      fetchMain();
      fetchGrid();
    }
  }, []);

  const [initialVal, setInitialVal] = useState({
    datnum: workType == "N" ? "" : datnum,
    orgdiv: "01",
    category: categories,
    location: "01",
    publish_start_date: new Date(),
    publish_end_date: new Date(),
    title: "",
    contents: "",
    publish_yn: "Y",
    publishdate: new Date(),
    pgSize: PAGE_SIZE,
    person: "",
    attdatnum: "",
    user_id: userId,
    pc: pc,
    person2: "",
    chooses: "",
    loadok: "", //"KRW",
    readok: 0,
    custcd_s: 0,
    form_id: "",
    files: "",
    dtgb: "C",
    Insert_form_id: "",
    Update_form_id: "",
    insert_time: "",
    insert_userid: userId,
    update_pc: pc,
    update_time: "",
    update_userid: "",
    user_name: "",
  });

  useEffect(() => {
    if (customOptionData !== null && workType === "N") {
      setInitialVal((prev) => {
        return {
          ...prev,
          publish_start_date: setDefaultDate(
            customOptionData,
            "publish_start_date"
          ),
          publish_end_date: setDefaultDate(
            customOptionData,
            "publish_end_date"
          ),
          category: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "category"
          ).valueCode,
          publish_yn: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "publish_yn"
          ).valueCode,
          person: user_name,
        };
      });

      fetchGrid();
    }
  }, [customOptionData]);

  //요약정보 조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_CM_A0000W_Q",
    pageNumber: 1,
    pageSize: initialVal.pgSize,
    parameters: {
      "@p_work_type": "Q",
      "@p_orgdiv": "01",
      "@p_datnum": datnum,
      "@p_dtgb": "C",
      "@p_frdt": "",
      "@p_category": "",
      "@p_title": "",
      "@p_yn": "%",
      "@p_attdatnum": "",
      "@p_userid": initialVal.user_id,
      "@p_newDiv": "N",
    },
  };

  const subparameters: Iparameters = {
    procedureName: "P_CM_A0000W_Q",
    pageNumber: 0,
    pageSize: 1,
    parameters: {
      "@p_work_type": "LOAD",
      "@p_orgdiv": "01",
      "@p_datnum": datnum,
      "@p_dtgb": "",
      "@p_frdt": "",
      "@p_category": categories,
      "@p_title": "",
      "@p_yn": "",
      "@p_attdatnum": "",
      "@p_userid": userId,
      "@p_newDiv": "N",
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

    if (data.isSuccess === true && data.tables[0].Rows.length > 0) {
      const row = data.tables[0].Rows[0];

      fetchfilesGrid(row.attdatnum);
      setInitialVal((prev) => {
        return {
          ...prev,
          datnum: row.datnum == undefined ? "" : row.datnum,
          orgdiv: row.orgdiv,
          category: row.category,
          location: row.location,
          publish_start_date: new Date(dateformat(row.publish_start_date)),
          publish_end_date: new Date(dateformat(row.publish_end_date)),
          title: row.title,
          contents: row.contents,
          publish_yn: row.publish_yn,
          person: row.user_name,
          attdatnum: row.attdatnum,
          person2: row.person2,
          chooses: row.chooses_s,
          loadok: row.loadok_s,
          readok: row.readok_s, //0,
          custcd_s: row.custcd_s, //0,
          form_id: row.form_id,
          Insert_form_id: row.Insert_form_id,
          Update_form_id: row.Update_form_id,
          pc: row.insert_pc,
          insert_time: row.insert_time,
          insert_userid: row.insert_userid,
          publishdate: row.publishdate,
          update_pc: row.update_pc,
          update_time: row.update_time,
          update_userid: row.update_userid,
          user_name: row.user_name,
        };
      });
    }
  };

  useEffect(() => {
    //fetch된 데이터가 폼에 세팅되도록 하기 위해 적용
    resetForm();

    setOrddt(convertDateToStr(initialVal.publish_start_date));
  }, [initialVal]);

  //fetch된 그리드 데이터가 그리드 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [detailDataResult, detailDataResult2]);

  const subparameters2: Iparameters = {
    procedureName: "P_CM_A0000W_Q",
    pageNumber: 0,
    pageSize: 1,
    parameters: {
      "@p_work_type": "LOAD",
      "@p_orgdiv": "01",
      "@p_datnum": datnum,
      "@p_dtgb": "",
      "@p_frdt": "",
      "@p_category": "300",
      "@p_title": "",
      "@p_yn": "",
      "@p_attdatnum": "",
      "@p_userid": userId,
      "@p_newDiv": "N",
    },
  };
  //상세그리드 조회
  const fetchGrid = async () => {
    let data: any;

    if (category == "300" || categories == "300") {
      try {
        data = await processApi<any>("procedure", subparameters2);
      } catch (error) {
        data = null;
      }

      if (data.isSuccess === true) {
        const totalRowCnt = data.tables[0].TotalRowCount;
        const rows = data.tables[0].Rows;

        setDetailDataResult2(() => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }
    } else {
      try {
        data = await processApi<any>("procedure", subparameters);
      } catch (error) {
        data = null;
      }

      if (data.isSuccess === true) {
        const totalRowCnt = data.tables[0].TotalRowCount;
        const rows = data.tables[0].Rows;

        setDetailDataResult(() => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }
    }
    setInitialVal((prev) => {
      return {
        ...prev,
        category: category,
      };
    });
  };

  let result: IAttachmentData = {
    attdatnum: "",
    original_name: "",
    rowCount: 0,
  };

  const fetchfilesGrid = async (attach: string) => {
    let data: any;

    if (attach === "") return false;
    const parameters = {
      attached: "list?attachmentNumber=" + attach,
    };

    try {
      data = await processApi<any>("file-list", parameters);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      const totalRowCnt = data.tables[0].RowCount;

      if (totalRowCnt > 0) {
        const rows = data.tables[0].Rows;

        result = {
          attdatnum: rows[0].attdatnum,
          original_name:
            rows[0].original_name +
            (totalRowCnt > 1 ? " 등 " + String(totalRowCnt - 1) + "건" : ""),
          rowCount: totalRowCnt,
        };
      } else {
        result = {
          attdatnum: attach,
          original_name: "",
          rowCount: 0,
        };
      }

      setInitialVal((prev) => {
        return {
          ...prev,
          files: result.original_name,
        };
      });
    }
  };
  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    orgdiv: "01",
    location: "01",
    datnum: initialVal.datnum,
    category: "100",
    title: "",
    contents: "",
    publish_yn: "Y",
    publish_start_date: "",
    publish_end_date: "",
    person: "",
    attdatnum: "",
    user_id: initialVal.user_id,
    pc: initialVal.pc,
    person2: "",
    chooses: "",
    loadok: "",
    readok: "",
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_CM_A0000W_S",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_orgdiv": paraData.orgdiv,
      "@p_location": paraData.location,
      "@p_datnum": paraData.datnum,
      "@p_category": paraData.category,
      "@p_title": paraData.title,
      "@p_contents": paraData.contents,
      "@p_publish_yn": paraData.publish_yn,
      "@p_publish_start_date": paraData.publish_start_date,
      "@p_publish_end_date": paraData.publish_end_date,
      "@p_person": paraData.person,
      "@p_attdatnum": paraData.attdatnum,
      "@p_userid": paraData.user_id,
      "@p_pc": paraData.pc,
      "@p_person2": paraData.person2,
      "@p_chooses": paraData.chooses,
      "@p_loadok": paraData.loadok,
      "@p_readok": paraData.readok,
      "@p_form_id": "CM_A0000W",
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setMainDataResult(process([], dataState));
    setDetailDataResult(process([], dataState));
  };

  const fetchGridSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }
    if (data.isSuccess === true) {
      if (workType === "U") {
        resetAllGrid();
        getVisible(false);
        reloadData("U");
      } else {
        getVisible(false);
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
    const {
      attdatnum,
      category,
      contents,
      datnum,
      location,
      orderDetails,
      orderDetails2,
      orgdiv,
      pc,
      person,
      person2,
      publish_end_date,
      publish_start_date,
      publish_yn,
      rowstatus,
      title,
      user_id,
      valueChanged,
    } = dataItem;

    let detailArr: TDetailData = {
      person2: [],
      chooses: [],
      loadok: [],
      readok: [],
    };

    if (category == "300") {
      orderDetails2.forEach((item: any) => {
        const { chooses, loadok, user_id, readok } = item;

        detailArr.chooses.push(
          chooses === "Y" ? "Y" : chooses === true ? "Y" : "N"
        );
        detailArr.loadok.push(
          loadok === "Y" ? "Y" : loadok === true ? "Y" : "N"
        );
        detailArr.person2.push(user_id);
        detailArr.readok.push(readok);
      });
    } else {
      orderDetails.forEach((item: any) => {
        const { chooses, loadok, user_id, readok } = item;

        detailArr.chooses.push(
          chooses === "Y" ? "Y" : chooses === true ? "Y" : "N"
        );
        detailArr.loadok.push(
          loadok === "Y" ? "Y" : loadok === true ? "Y" : "N"
        );
        detailArr.person2.push(user_id);
        detailArr.readok.push(readok);
      });
    }

    setParaData((prev) => ({
      ...prev,
      work_type: workType,
      orgdiv: "01",
      location: "01",
      datnum,
      category: getCodeFromValue(category),
      title,
      contents,
      publish_yn: getCodeFromValue(publish_yn, "publish_yn"),
      publish_start_date: convertDateToStr(publish_start_date),
      publish_end_date: convertDateToStr(publish_end_date),
      person: getCodeFromValue(user_id),
      attdatnum,
      user_id: getCodeFromValue(user_id),
      pc,
      person2: detailArr.person2.join("|"),
      chooses: detailArr.chooses.join("|"),
      loadok: detailArr.loadok.join("|"),
      readok: detailArr.readok.join("|"),
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchGridSaved();
  }, [paraData]);

  useEffect(() => {
    fetchGrid();
  }, [category]);

  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const getAttachmentsData = (data: IAttachmentData) => {
    setInitialVal((prev) => {
      return {
        ...prev,
        attdatnum: data.attdatnum,
        files:
          data.original_name +
          (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      };
    });
  };

  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA061,L_BA015", setBizComponentData);

  useEffect(() => {
    if (workType === "U") {
      if (bizComponentData.length) {
        resetAllGrid();
        fetchMain();
        fetchGrid();
      }
    }
  }, [bizComponentData]);

  const fetchUnp = useCallback(async (contents: string) => {
    if (contents === "") return;
    let data: any;

    const queryStr = getUnpQuery(contents);
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
      setUnpList(rows);
    }
  }, []);

  const getUnpList = (contents: string) => {
    fetchUnp(contents);
  };

  const changeCategory = (event: any) => {
    setCategory(event.value.sub_code);
  };

  return (
    <Window
      title={workType === "N" ? "공지생성" : "공지정보"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <unpContext.Provider
        value={{
          publish_start_date,
          setOrddt,
          unpList,
          getUnpList,
          category,
          setCategory,
        }}
      >
        <Form
          onSubmit={handleSubmit}
          key={formKey}
          initialValues={{
            rowstatus: "",
            datnum: initialVal.datnum,
            orgdiv: initialVal.orgdiv,
            category: initialVal.category,
            location: initialVal.location,
            publish_start_date: initialVal.publish_start_date, //new Date(),
            publish_end_date: initialVal.publish_end_date,
            title: initialVal.title,
            contents: initialVal.contents,
            publish_yn: initialVal.publish_yn,
            person: initialVal.person,
            attdatnum: initialVal.attdatnum,
            user_id: initialVal.user_id,
            pc: initialVal.pc,
            person2: initialVal.person2,
            chooses: initialVal.chooses,
            loadok: initialVal.loadok, //"KRW",
            readok: initialVal.readok, //0,
            custcd_s: initialVal.custcd_s, //0,
            form_id: initialVal.form_id,
            orderDetails: detailDataResult.data, //detailDataResult.data,
            orderDetails2: detailDataResult2.data,
            files: initialVal.files,
          }}
          render={(formRenderProps: FormRenderProps) => (
            <FormElement>
              <fieldset
                style={{
                  display: "inline-block",
                  width: "60%",
                }}
                className={"k-form-fieldset"}
              >
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
                <FieldWrap fieldWidth="45%">
                  <Field
                    name={"datnum"}
                    label={"문서번호"}
                    component={FormReadOnly}
                    className="readonly"
                  />
                  <div style={{ width: "10%" }}></div>
                  {customOptionData !== null && (
                    <Field
                      name={"person"}
                      label={"작성자"}
                      component={FormReadOnly}
                      className="readonly"
                      queryStr={userId}
                      columns={userId}
                    />
                  )}
                </FieldWrap>
                <FieldWrap fieldWidth="45%">
                  {customOptionData !== null && (
                    <Field
                      name={"category"}
                      label={"카테고리"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "category"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "category"
                        ).bizComponentItems
                      }
                      headerCell={RequiredHeader}
                      className="required"
                      onChange={changeCategory}
                    />
                  )}
                  <div style={{ width: "10%" }}></div>
                  {customOptionData !== null && (
                    <Field
                      name={"publish_yn"}
                      label={"공지게시여부"}
                      component={FormCheckBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "publish_yn"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "publish_yn"
                        ).bizComponentItems
                      }
                    />
                  )}
                </FieldWrap>
                <FieldWrap fieldWidth="45%">
                  <Field
                    name={"publish_start_date"}
                    label={"공지시작일"}
                    component={FormDatePicker}
                    headerCell={RequiredHeader}
                    className="required"
                  />
                  <div style={{ width: "10%" }}></div>
                  <Field
                    name={"publish_end_date"}
                    label={"공지종료일"}
                    component={FormDatePicker}
                    headerCell={RequiredHeader}
                    className="required"
                  />
                </FieldWrap>
                <Field
                  name={"title"}
                  label={"제목"}
                  component={FormInput}
                  headerCell={RequiredHeader}
                />
                <Field
                  name={"contents"}
                  label={"내용"}
                  max={400}
                  component={FormTextArea}
                />
                <FieldWrap fieldWidth="100%">
                  <Field
                    name={"files"}
                    component={FormReadOnly}
                    label={"첨부파일"}
                  />
                  <ButtonInFieldWrap style={{ marginTop: "2%" }}>
                    <ButtonInField>
                      <Button
                        type={"button"}
                        onClick={onAttachmentsWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInField>
                  </ButtonInFieldWrap>
                </FieldWrap>
              </fieldset>
              {category == "300" || categories == "300" ? (
                <FieldArray
                  name="orderDetails2"
                  dataItemKey={FORM_DATA_INDEX}
                  component={FormGrid2}
                  validator={arrayLengthValidator}
                />
              ) : (
                <FieldArray
                  name="orderDetails"
                  dataItemKey={FORM_DATA_INDEX}
                  component={FormGrid}
                  workType={workType}
                  category={category}
                  validator={arrayLengthValidator}
                />
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
      </unpContext.Provider>
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={initialVal.attdatnum}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
