import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridEvent,
  GridToolbar,
  GridSelectionChangeEvent,
  getSelectedState,
  GridHeaderSelectionChangeEvent,
  GridFooterCellProps,
  GridDataStateChangeEvent,
  GridSortChangeEvent,
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
import {
  FormNumberCell,
  FormNameCell,
  FormInput,
  FormReadOnly,
  FormComboBox,
  FormCheckBox,
  FormNumericTextBox,
  FormCheckBoxCell,
} from "../Editors";
import { Iparameters } from "../../store/types";
import {
  validator,
  arrayLengthValidator,
  chkScrollHandler,
  getQueryFromBizComponent,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  findMessage,
  UseParaPc,
  UseGetValueFromSessionItem,
} from "../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import { IAttachmentData, IWindowPosition } from "../../hooks/interfaces";
import {
  COM_CODE_DEFAULT_VALUE,
  EDIT_FIELD,
  FORM_DATA_INDEX,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../CommonString";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { bytesToBase64 } from "byte-base64";
import RequiredHeader from "../RequiredHeader";
import { isLoading } from "../../store/atoms";
import { useSetRecoilState } from "recoil";

const requiredField = ["sub_code", "code_name"];
const numberField = [
  "sort_seq",
  "code_length",
  "numref1",
  "numref2",
  "numref3",
  "numref4",
  "numref5",
];
const checkBoxField = ["system_yn", "use_yn"];
const readOnlyField = [
  "insert_userid",
  "insert_pc",
  "insert_time",
  "update_userid",
  "update_pc1",
  "update_time1",
];

export const FormContext = createContext<{
  dataTotal: number;
  dataState: State;
  setDataState: (d: any) => void;
  fetchGrid: (n: number) => any;
}>({} as any);

let deletedRows: object[] = [];

const DATA_ITEM_KEY = "sub_code";
const idGetter = getter(FORM_DATA_INDEX);

type TKendoWindow = {
  setVisible(t: boolean): void;
  reloadData(workType: string, groupCode?: string): void;
  workType: string;
  group_code?: string;
  isCopy: boolean;
};

// Create the Grid that will be used inside the Form
const FormGrid = (fieldArrayRenderProps: FieldArrayRenderProps) => {
  const { validationMessage, visited, name, dataItemKey } =
    fieldArrayRenderProps;
  const [editIndex, setEditIndex] = useState<number | undefined>();

  const { dataTotal, dataState, setDataState, fetchGrid } =
    useContext(FormContext);

  const [detailPgNum, setDetailPgNum] = useState(1);

  const pathname: string = window.location.pathname.replace("/", "");

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  // Add a new item to the Form FieldArray that will be shown in the Grid
  const onAdd = useCallback(
    (e: any) => {
      e.preventDefault();
      fieldArrayRenderProps.onPush({
        value: {
          rowstatus: "N",
          sort_seq: 0,
          use_yn: "Y",
          numref1: 0,
          numref2: 0,
          numref3: 0,
          numref4: 0,
          numref5: 0,
        },
      });

      setEditIndex(0);
    },
    [fieldArrayRenderProps]
  );

  const onRemove = useCallback(() => {
    let newData: any[] = [];

    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      if (!selectedState[index]) {
        newData.push(item);
      } else {
        deletedRows.push(item);
      }
    });

    //전체 데이터 삭제
    fieldArrayRenderProps.value.forEach(() => {
      fieldArrayRenderProps.onRemove({
        index: 0,
      });
    });

    //newData 생성
    newData.forEach((item: any) => {
      fieldArrayRenderProps.onPush({
        value: item,
      });
    });

    //선택 상태 초기화
    setSelectedState({});

    //수정 상태 초기화
    setEditIndex(undefined);
  }, [fieldArrayRenderProps]);

  const onCopy = useCallback(() => {
    let newData: any[] = [];
    let ordseq = 0; //그리드의 키값으로 사용되기 때문에 고유값 지정 필요

    //복사할 데이터 newData에 push
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      if (selectedState[index]) {
        newData.push(item);
      }
      if (ordseq < item.ordseq) ordseq = item.ordseq;
    });

    //newData 생성
    newData.forEach((item: any) => {
      ordseq++;

      fieldArrayRenderProps.onPush({
        value: { ...item, rowstatus: "N", ordseq: ordseq },
      });
    });

    //선택 상태 초기화
    setSelectedState({});

    //수정 상태 초기화
    setEditIndex(undefined);
  }, [fieldArrayRenderProps]);

  const dataWithIndexes = fieldArrayRenderProps.value.map(
    (item: any, index: any) => {
      return { ...item, [FORM_DATA_INDEX]: index };
    }
  );

  //스크롤 핸들러
  const scrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum, PAGE_SIZE))
      setDetailPgNum((prev) => prev + 1);
  };

  // 페이지 1 이후 데이터 조회
  useEffect(() => {
    if (detailPgNum > 1) {
      getMoreData();
    }
  }, [detailPgNum]);

  const getMoreData = async () => {
    let data;
    try {
      data = await fetchGrid(detailPgNum);
    } catch {
      data = null;
    }

    if (data) {
      data.forEach((item: any) => {
        fieldArrayRenderProps.onPush({
          value: { ...item },
        });
      });
    }
  };

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

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = useCallback(
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

  const onHeaderSelectionChange = useCallback(
    (event: GridHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked = checkboxElement.checked;
      const newSelectedState: {
        [id: string]: boolean | number[];
      } = {};

      event.dataItems.forEach((item) => {
        newSelectedState[idGetter(item)] = checked;
      });

      setSelectedState(newSelectedState);

      //선택된 상태로 리랜더링
      event.dataItems.forEach((item: any, index: number) => {
        fieldArrayRenderProps.onReplace({
          index: index,
          value: {
            ...item,
          },
        });
      });
    },
    []
  );

  const onGridSortChange = (e: GridSortChangeEvent) => {
    setDataState((prev: any) => ({ ...prev, sort: e.sort }));
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onGridDataStateChange = (event: GridDataStateChangeEvent) => {
    setDataState(event.dataState);
  };

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {dataTotal}건
      </td>
    );
  };

  return (
    <GridContainer margin={{ top: "30px" }}>
      {visited && validationMessage && <Error>{validationMessage}</Error>}
      <Grid
        style={{ height: "400px" }}
        data={process(
          dataWithIndexes.map((item: any) => ({
            ...item,
            parentField: name,
            [SELECTED_FIELD]: selectedState[idGetter(item)],
          })),
          dataState
        )}
        {...dataState}
        onDataStateChange={onGridDataStateChange}
        // 렌더
        cellRender={customCellRender}
        rowRender={customRowRender}
        //선택기능
        dataItemKey={dataItemKey}
        selectedField={SELECTED_FIELD}
        selectable={{
          enabled: true,
          drag: false,
          cell: false,
          mode: "multiple",
        }}
        onSelectionChange={onSelectionChange}
        onHeaderSelectionChange={onHeaderSelectionChange}
        //스크롤 조회 기능
        fixedScroll={true}
        total={dataTotal}
        onScroll={scrollHandler}
        //정렬기능
        sortable={true}
        onSortChange={onGridSortChange}
        //컬럼순서조정
        reorderable={true}
        //컬럼너비조정
        resizable={true}
      >
        <GridToolbar>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onAdd}
            icon="add"
          >
            추가
          </Button>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onRemove}
            icon="minus"
          >
            삭제
          </Button>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onCopy}
            icon="copy"
          >
            복사
          </Button>
        </GridToolbar>

        <GridColumn
          field={SELECTED_FIELD}
          width="45px"
          headerSelectionValue={
            dataWithIndexes.findIndex(
              (item: any) => !selectedState[idGetter(item)]
            ) === -1
          }
        />
        <GridColumn field="rowstatus" title=" " width="40px" />

        {customOptionData !== null &&
          customOptionData.menuCustomColumnOptions["grdDetailList"].map(
            (item: any, idx: number) =>
              item.sortOrder !== -1 && (
                <GridColumn
                  key={idx}
                  field={item.fieldName}
                  title={item.caption}
                  width={item.width}
                  cell={
                    numberField.includes(item.fieldName)
                      ? FormNumberCell
                      : checkBoxField.includes(item.fieldName)
                      ? FormCheckBoxCell
                      : FormNameCell
                  }
                  headerCell={
                    requiredField.includes(item.fieldName)
                      ? RequiredHeader
                      : undefined
                  }
                  className={
                    readOnlyField.includes(item.fieldName)
                      ? "read-only"
                      : item.fieldName === "sub_code"
                      ? "editable-new-only"
                      : requiredField.includes(item.fieldName)
                      ? "required"
                      : ""
                  }
                  footerCell={
                    item.sortOrder === 0 ? detailTotalFooterCell : undefined
                  }
                ></GridColumn>
              )
          )}
      </Grid>
    </GridContainer>
  );
};
const KendoWindow = ({
  setVisible,
  reloadData,
  workType,
  group_code = "",
  isCopy,
}: TKendoWindow) => {
  const userId = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const setLoading = useSetRecoilState(isLoading);
  const [dataState, setDataState] = useState<State>({
    sort: [],
  });

  // 비즈니스 컴포넌트 조회
  const [bizComponentData, setBizComponentData] = useState<any>([]);
  UseBizComponent("L_BA000", setBizComponentData);

  // 그룹 카테고리 리스트
  const [groupCategoryListData, setGroupCategoryListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  // 그룹 카테고리 조회 쿼리
  const groupCategoryQuery =
    bizComponentData.length > 0
      ? getQueryFromBizComponent(
          bizComponentData.find(
            (item: any) => item.bizComponentId === "L_BA000"
          )
        )
      : "";

  // 그룹 카테고리 조회
  useEffect(() => {
    if (bizComponentData.length > 0) {
      fetchQueryData(groupCategoryQuery, setGroupCategoryListData);
    }
  }, [bizComponentData]);

  const fetchQueryData = useCallback(
    async (queryStr: string, setListData: any) => {
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
    },
    []
  );

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1200,
    height: 800,
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

  const [formKey, setFormKey] = useState(1);
  const resetForm = () => {
    setFormKey(formKey + 1);
  };
  //수정 없이 submit 가능하도록 임의 value를 change 시켜줌
  useEffect(() => {
    const valueChanged = document.getElementById("valueChanged");
    valueChanged!.click();
  }, [formKey]);
  const processApi = useApi();

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], dataState)
  );

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      fetchMain();
    }
  }, []);

  const [initialVal, setInitialVal] = useState({
    group_code: "",
    group_name: "",
    code_length: 0,
    group_category: "",
    field_caption1: "",
    field_caption2: "",
    field_caption3: "",
    field_caption4: "",
    field_caption5: "",
    field_caption6: "",
    field_caption7: "",
    field_caption8: "",
    field_caption9: "",
    field_caption10: "",
    memo: "",
    use_yn: "Y",
    attdatnum: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SY_A0010W_Q",
    pageNumber: 1,
    pageSize: 1,
    parameters: {
      "@p_work_type": "LIST",
      "@p_group_code": group_code,
      "@p_group_name": "",
      "@p_group_category": "",
      "@p_field_caption": "",
      "@p_memo": "",
      "@p_sub_code": "",
      "@p_code_name": "",
      "@p_find_row_value": "",
    },
  };

  //요약정보 조회
  const fetchMain = async () => {
    let data: any;
    setLoading(true);
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
          group_code: row.group_code,
          group_name: row.group_name,
          code_length: row.code_length,
          group_category: row.group_category ?? "",
          field_caption1: row.field_caption1 ?? "",
          field_caption2: row.field_caption2 ?? "",
          field_caption3: row.field_caption3 ?? "",
          field_caption4: row.field_caption4 ?? "",
          field_caption5: row.field_caption5 ?? "",
          field_caption6: row.field_caption6 ?? "",
          field_caption7: row.field_caption7 ?? "",
          field_caption8: row.field_caption8 ?? "",
          field_caption9: row.field_caption9 ?? "",
          field_caption10: row.field_caption10 ?? "",
          memo: row.memo ?? "",
          use_yn: row.use_yn,
          attdatnum: row.attdatnum,
        };
      });
    }
    setLoading(false);
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
  const fetchGrid = async (pgNum: number) => {
    let data: any;
    let result = [];
    setLoading(true);

    const detailParameters: Iparameters = {
      procedureName: "P_SY_A0010W_Q",
      pageNumber: pgNum,
      pageSize: PAGE_SIZE,
      parameters: {
        "@p_work_type": "DETAIL",
        "@p_group_code": group_code,
        "@p_group_name": "",
        "@p_group_category": "",
        "@p_field_caption": "",
        "@p_memo": "",
        "@p_sub_code": "",
        "@p_code_name": "",
        "@p_find_row_value": "",
      },
    };
    try {
      data = await processApi<any>("procedure", detailParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          rowstatus: workType === "N" ? "N" : "",
          extra_field1: row.extra_field1 ?? "",
          extra_field2: row.extra_field2 ?? "",
          extra_field3: row.extra_field3 ?? "",
          extra_field4: row.extra_field4 ?? "",
          extra_field5: row.extra_field5 ?? "",
          extra_field6: row.extra_field6 ?? "",
          extra_field7: row.extra_field7 ?? "",
          extra_field8: row.extra_field8 ?? "",
          extra_field9: row.extra_field9 ?? "",
          extra_field10: row.extra_field10 ?? "",
          memo: row.memo ?? "",
          update_pc: row.update_pc ?? "",
          update_time: row.update_time ?? "",
          update_userid: row.update_userid ?? "",
        };
      });

      if (pgNum > 1) {
        result = rows;
      } else {
        setDetailDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
      }
    }
    setLoading(false);
    return result;
  };

  const pathname: string = window.location.pathname.replace("/", "");

  //메시지 조회
  const [messagesData, setMessagesData] = useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    group_code: "",
    group_name: "",
    code_length: "",
    group_category: "",
    field_caption1: "",
    field_caption2: "",
    field_caption3: "",
    field_caption4: "",
    field_caption5: "",
    field_caption6: "",
    field_caption7: "",
    field_caption8: "",
    field_caption9: "",
    field_caption10: "",
    attdatnum: "",
    memo: "",
    use_yn: "",
    userid: userId,
    pc: pc,
    form_id: pathname,
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_SY_A0010W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_group_code": paraData.group_code,
      "@p_group_name": paraData.group_name,
      "@p_code_length": paraData.code_length,
      "@p_group_category": paraData.group_category,
      "@p_field_caption1": paraData.field_caption1,
      "@p_field_caption2": paraData.field_caption2,
      "@p_field_caption3": paraData.field_caption3,
      "@p_field_caption4": paraData.field_caption4,
      "@p_field_caption5": paraData.field_caption5,
      "@p_field_caption6": paraData.field_caption6,
      "@p_field_caption7": paraData.field_caption7,
      "@p_field_caption8": paraData.field_caption8,
      "@p_field_caption9": paraData.field_caption9,
      "@p_field_caption10": paraData.field_caption10,
      "@p_attdatnum": paraData.attdatnum,
      "@p_memo": paraData.memo,
      "@p_use_yn": paraData.use_yn,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
      "@p_form_id": paraData.form_id,
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setDetailDataResult(process([], dataState));
  };

  const fetchMainSaved = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      if (workType === "U") {
        resetAllGrid();

        reloadData("U", paraData.group_code);
        fetchMain();
        fetchGrid(1);
      } else {
        setVisible(false);
        reloadData("N", paraData.group_code);
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
    setLoading(false);
  };

  const fetchGridSaved = async (paraSaved: any) => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      //
    } else {
      console.log("[오류 발생]");
      console.log(data);

      alert("[" + data.statusCode + "] " + data.resultMessage);
    }
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    //alert(JSON.stringify(dataItem));

    let valid = true;

    //검증
    try {
      dataItem.orderDetails.forEach((item: any, idx: number) => {
        dataItem.orderDetails.forEach((chkItem: any, chkIdx: number) => {
          if (item.sub_code === chkItem.sub_code && idx !== chkIdx) {
            throw findMessage(messagesData, "SY_A0010W_003");
          }
        });

        if (!item.sub_code) {
          throw findMessage(messagesData, "SY_A0010W_004");
        }
        if (!item.code_name) {
          throw findMessage(messagesData, "SY_A0010W_005");
        }
        if (isNaN(item.sort_seq)) {
          throw findMessage(messagesData, "SY_A0010W_006");
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    const {
      group_code,
      group_name,
      code_length,
      group_category,
      field_caption1,
      field_caption2,
      field_caption3,
      field_caption4,
      field_caption5,
      field_caption6,
      field_caption7,
      field_caption8,
      field_caption9,
      field_caption10,
      memo,
      attdatnum,
      orderDetails,
      use_yn,
    } = dataItem;

    deletedRows.forEach((item: any) => {
      const { sub_code } = item;

      const paraSaved: Iparameters = {
        procedureName: "P_SY_A0010_S1",
        pageNumber: 1,
        pageSize: 10,
        parameters: {
          "@p_work_type": "D",
          "@p_group_code": group_code,
          "@p_sub_code": sub_code,
          "@p_code_name": "",
          "@p_system_yn": "",
          "@p_extra_field1": "",
          "@p_extra_field2": "",
          "@p_extra_field3": "",
          "@p_extra_field4": "",
          "@p_extra_field5": "",
          "@p_extra_field6": "",
          "@p_extra_field7": "",
          "@p_extra_field8": "",
          "@p_extra_field9": "",
          "@p_extra_field10": "",
          "@p_numref1": 0,
          "@p_numref2": 0,
          "@p_numref3": 0,
          "@p_numref4": 0,
          "@p_numref5": 0,
          "@p_memo": "",
          "@p_sort_seq": 0,
          "@p_use_yn": "",
          "@p_userid": userId,
          "@p_pc": pc,
          "@p_attdatnum_img": "",
          "@p_form_id": pathname,
        },
      };

      fetchGridSaved(paraSaved);
    });

    deletedRows = []; //초기화

    orderDetails.forEach((item: any, i: number) => {
      const {
        rowstatus,
        sub_code,
        code_name,
        system_yn,
        use_yn,
        extra_field1 = "",
        extra_field2 = "",
        extra_field3 = "",
        extra_field4 = "",
        extra_field5 = "",
        extra_field6 = "",
        extra_field7 = "",
        extra_field8 = "",
        extra_field9 = "",
        extra_field10 = "",
        numref1,
        numref2,
        numref3,
        numref4,
        numref5,
        sort_seq,
      } = item;

      const paraSaved: Iparameters = {
        procedureName: "P_SY_A0010W_S1",
        pageNumber: 1,
        pageSize: 10,
        parameters: {
          "@p_work_type": rowstatus,
          "@p_group_code": group_code,
          "@p_sub_code": sub_code,
          "@p_code_name": code_name,
          "@p_system_yn": system_yn === "Y" || system_yn === true ? "Y" : "N",
          "@p_extra_field1": extra_field1,
          "@p_extra_field2": extra_field2,
          "@p_extra_field3": extra_field3,
          "@p_extra_field4": extra_field4,
          "@p_extra_field5": extra_field5,
          "@p_extra_field6": extra_field6,
          "@p_extra_field7": extra_field7,
          "@p_extra_field8": extra_field8,
          "@p_extra_field9": extra_field9,
          "@p_extra_field10": extra_field10,
          "@p_numref1": numref1,
          "@p_numref2": numref2,
          "@p_numref3": numref3,
          "@p_numref4": numref4,
          "@p_numref5": numref5,
          "@p_memo": memo,
          "@p_sort_seq": sort_seq,
          "@p_use_yn": use_yn === "Y" || use_yn === true ? "Y" : "N",
          "@p_userid": userId,
          "@p_pc": pc,
          "@p_attdatnum_img": null,
          "@p_form_id": pathname,
        },
      };

      fetchGridSaved(paraSaved);
    });

    setParaData((prev) => ({
      ...prev,
      work_type: workType,
      group_code: group_code,
      group_name: group_name,
      code_length: code_length,
      group_category: group_category.sub_code,
      field_caption1: field_caption1,
      field_caption2: field_caption2,
      field_caption3: field_caption3,
      field_caption4: field_caption4,
      field_caption5: field_caption5,
      field_caption6: field_caption6,
      field_caption7: field_caption7,
      field_caption8: field_caption8,
      field_caption9: field_caption9,
      field_caption10: field_caption10,
      memo: memo,
      use_yn: use_yn === true || use_yn === "Y" ? "Y" : "N",
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchMainSaved();
  }, [paraData]);

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

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      if (bizComponentData.length) {
        resetAllGrid();
        fetchGrid(1);
      }
    }
  }, [bizComponentData]);

  return (
    <Window
      title={workType === "N" ? "공통코드 생성" : "공통코드 정보"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <FormContext.Provider
        value={{
          dataState,
          setDataState,
          dataTotal: detailDataResult.total,
          fetchGrid,
        }}
      >
        <Form
          onSubmit={handleSubmit}
          key={formKey}
          initialValues={{
            rowstatus: "",
            group_code: isCopy === true ? "" : initialVal.group_code,
            group_name: isCopy === true ? "" : initialVal.group_name,
            code_length: initialVal.code_length,
            group_category: {
              sub_code: initialVal.group_category,
              code_name: groupCategoryListData.find(
                (item: any) => item.sub_code === initialVal.group_category
              )?.code_name,
            },
            field_caption1: initialVal.field_caption1,
            field_caption2: initialVal.field_caption2,
            field_caption3: initialVal.field_caption3,
            field_caption4: initialVal.field_caption4,
            field_caption5: initialVal.field_caption5,
            field_caption6: initialVal.field_caption6,
            field_caption7: initialVal.field_caption7,
            field_caption8: initialVal.field_caption8,
            field_caption9: initialVal.field_caption9,
            field_caption10: initialVal.field_caption10,
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
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"group_code"}
                    label={"그룹코드"}
                    component={workType === "N" ? FormInput : FormReadOnly}
                    validator={validator}
                    className={workType === "N" ? "required" : "readonly"}
                  />
                  <Field
                    name={"group_name"}
                    label={"그룹코드명"}
                    component={FormInput}
                    validator={validator}
                    className="required"
                  />
                  <Field
                    name={"code_length"}
                    label={"세부코드길이"}
                    component={FormNumericTextBox}
                    validator={validator}
                    className="required"
                  />
                  {bizComponentData.length > 0 && (
                    <Field
                      name={"group_category"}
                      label={"유형분류"}
                      component={FormComboBox}
                      queryStr={groupCategoryQuery}
                      textField={"code_name"}
                      columns={
                        bizComponentData.find(
                          (item: any) => item.bizComponentId === "L_BA000"
                        ).bizComponentItems
                      }
                      className="required"
                    />
                  )}
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"field_caption1"}
                    label={"여유필드캡션1"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption2"}
                    label={"여유필드캡션2"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption3"}
                    label={"여유필드캡션3"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption4"}
                    label={"여유필드캡션4"}
                    component={FormInput}
                  />
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"field_caption5"}
                    label={"여유필드캡션5"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption6"}
                    label={"여유필드캡션6"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption7"}
                    label={"여유필드캡션7"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption8"}
                    label={"여유필드캡션8"}
                    component={FormInput}
                  />
                </FieldWrap>

                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"field_caption9"}
                    label={"여유필드캡션9"}
                    component={FormInput}
                  />
                  <Field
                    name={"field_caption10"}
                    label={"여유필드캡션10"}
                    component={FormInput}
                  />
                  <Field
                    name={"files"}
                    component={FormReadOnly}
                    label={"첨부파일"}
                  />
                  <ButtonInFieldWrap>
                    <ButtonInField>
                      <Button
                        type={"button"}
                        onClick={onAttachmentsWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInField>
                  </ButtonInFieldWrap>
                  <Field name={"memo"} component={FormInput} label={"메모"} />
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"use_yn"}
                    label={"사용여부"}
                    component={FormCheckBox}
                  />
                </FieldWrap>
              </fieldset>
              <FieldArray
                name="orderDetails"
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
      </FormContext.Provider>
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
