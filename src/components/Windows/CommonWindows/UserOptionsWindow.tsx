import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridEvent,
  GridCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
} from "@progress/kendo-react-grid";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  ButtonContainer,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { Iparameters, TControlObj } from "../../../store/types";
import {
  chkScrollHandler,
  getGridItemChangedData,
  getYn,
  UseBizComponent,
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import ColumnWindow from "./UserOptionsColumnWindow";
import DefaultWindow from "./UserOptionsDefaultWindow";
import { IWindowPosition } from "../../../hooks/interfaces";
import {
  EDIT_FIELD,
  EXPANDED_FIELD,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../../CommonString";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import {
  createDataTree,
  extendDataItem,
  mapTree,
  TreeList,
  TreeListColumnProps,
  TreeListExpandChangeEvent,
  TreeListTextEditor,
  treeToFlat,
} from "@progress/kendo-react-treelist";
import {
  Checkbox,
  CheckboxChangeEvent,
  Input,
  NumericTextBox,
  NumericTextBoxChangeEvent,
} from "@progress/kendo-react-inputs";
import { loginResultState } from "../../../store/atoms";
import { bytesToBase64 } from "byte-base64";
import { useRecoilValue } from "recoil";
import ComboBoxCell from "../../Cells/ComboBoxCell";
import RadioGroupCell from "../../Cells/RadioGroupCell";
import NameCell from "../../Cells/NameCell";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import NumberCell from "../../Cells/NumberCell";

type TKendoWindow = {
  setVisible(t: boolean): void;
};

const ControlColumns: TreeListColumnProps[] = [
  {
    field: "rowstatus",
    title: " ",
    width: "40px",
  },
  {
    expandable: true,
    field: "control_name",
    title: "컨트롤명",
    width: "150px",
  },
  {
    field: "field_name",
    title: "필드명",
    width: "150px",
  },
  // {
  //   field: "parent",
  //   title: "부모 컨트롤 ",
  //   width: "150px",
  // },
  {
    field: "type",
    title: "타입 ",
    width: "150px",
  },
  {
    field: "word_id",
    title: "Word ID",
    width: "150px",
    editCell: TreeListTextEditor,
  },
  {
    field: "word_text",
    title: "텍스트",
    width: "150px",
  },
];

const subItemsField: string = "children";

// 디폴트 디테일 그리드 - 세션사용우무 필드 셀
const DefaultUseSessioneCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
  } = props;

  const valueType = dataItem["value_type"];
  const orgUseSession = dataItem["sys_use_session"];

  let value = dataItem[field ?? ""];
  if (value === "Y" || value === true) {
    value = true;
  } else {
    value = false;
  }

  const handleChange = (e: CheckboxChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });
    }
  };

  const defaultRendering =
    valueType !== "Datetime" && orgUseSession === "Y" ? (
      <td
        style={
          value === true
            ? {
                textAlign: "center",
                color: "rgba(255 ,99 ,88, 1)",
              }
            : { textAlign: "center" }
        }
        aria-colindex={ariaColumnIndex}
        data-grid-col-index={columnIndex}
      >
        <Checkbox value={value} onChange={handleChange} />
      </td>
    ) : (
      <td aria-colindex={ariaColumnIndex} data-grid-col-index={columnIndex} />
    );

  return render === undefined
    ? null
    : render?.call(undefined, defaultRendering, props);
};

// 디폴트 디테일 그리드 - 기본값 필드 셀
const DefaultValueCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, render } = props;
  const valueType = dataItem["value_type"];
  const bcId = dataItem["bc_id"];
  //const useSession = getYn(dataItem["use_session"]);
  const [bizComponentData, setBizComponentData] = useState([]);
  if (bcId) UseBizComponent(bcId, setBizComponentData);
  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bcId
  );

  const defaultRendering = (
    <>
      {bizComponent && valueType === "Lookup" ? (
        <ComboBoxCell bizComponent={bizComponent} {...props} />
      ) : bizComponent && valueType === "Radio" ? (
        <RadioGroupCell bizComponentData={bizComponent} {...props} />
      ) : valueType === "Text" ? (
        <NameCell {...props} />
      ) : (
        <td
          style={{ textAlign: "left" }}
          aria-colindex={ariaColumnIndex}
          data-grid-col-index={columnIndex}
        ></td>
      )}
    </>
  );

  return render === undefined
    ? null
    : render?.call(undefined, defaultRendering, props);
};

// 디폴트 디테일 그리드 - 연,월,일 추가 필드 셀
const DefaultDateCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
  } = props;

  let isInEdit = field === dataItem.inEdit;
  const valueType = dataItem["value_type"];
  const value = dataItem[field];

  const handleChange = (e: NumericTextBoxChangeEvent) => {
    if (onChange) {
      onChange({
        dataIndex: 0,
        dataItem: dataItem,
        field: field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value ?? "",
      });
    }
  };

  const defaultRendering = (
    <td
      style={{ textAlign: "right" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      {valueType === "Datetime" ? (
        isInEdit ? (
          <NumericTextBox value={value} onChange={handleChange} />
        ) : (
          value
        )
      ) : (
        ""
      )}
    </td>
  );

  return render === undefined
    ? null
    : render?.call(undefined, defaultRendering, props);
};

const DraggableGridRowRender = (properties: any) => {
  const {
    row = "",
    props = "",
    onDrop = "",
    onDragStart = "",
  } = { ...properties };
  const additionalProps = {
    onDragStart: (e: any) => onDragStart(e, props.dataItem),
    onDragOver: (e: any) => {
      e.preventDefault();
    },
    onDrop: (e: any) => onDrop(e, props.dataItem),
    draggable: true,
  };
  return React.cloneElement(
    row,
    { ...row.props, ...additionalProps },
    row.props.children
  );
};

// 컨트롤 정보 키
const CONTROL_DATA_ITEM_KEY = "control_name";
const WORD_DATA_ITEM_KEY = "word_id";
// 컬럼 정보 키
const MAIN_COLUMN_DATA_ITEM_KEY = "option_id";
const DETAIL_COLUMN_DATA_ITEM_KEY = "column_id";
// 디폴트 정보 키
const MAIN_DEFAULT_DATA_ITEM_KEY = "option_id";
const DETAIL_DEFAULT_DATA_ITEM_KEY = "default_id";

const KendoWindow = ({ setVisible }: TKendoWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1200,
    height: 800,
  });

  const loginResult = useRecoilValue(loginResultState);
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN" || role === "DEVELOPER" ? true : false;
  const sessionUserId = UseGetValueFromSessionItem("user_id");

  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [columnWindowVisible, setColumnWindowVisible] =
    useState<boolean>(false);

  const [defaultWindowVisible, setDefaultWindowVisible] =
    useState<boolean>(false);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;
    setWordFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const ControlIdGetter = getter(CONTROL_DATA_ITEM_KEY);
  const wordIdGetter = getter(CONTROL_DATA_ITEM_KEY);
  const mainColumnIdGetter = getter(MAIN_COLUMN_DATA_ITEM_KEY);
  const detailColumnIdGetter = getter(DETAIL_COLUMN_DATA_ITEM_KEY);
  const mainDefaultIdGetter = getter(MAIN_DEFAULT_DATA_ITEM_KEY);
  const detailDefaultIdGetter = getter(DETAIL_DEFAULT_DATA_ITEM_KEY);

  const [mainColumnDataState, setMainColumnDataState] = useState<State>({});
  const [wordDataState, setWordDataState] = useState<State>({});
  const [ControlDataState, setControlDataState] = useState<State>({});
  const [detailColumnDataState, setDetailColumnDataState] = useState<State>({
    sort: [],
  });
  const [mainDefaultDataState, setMainDefaultDataState] = useState<State>({});
  const [detailDefaultDataState, setDetailDefaultDataState] = useState<State>({
    sort: [],
  });

  const [controlDataResult, setcontrolDataResult] = useState<any>([]);
  const [wordDataResult, setWordDataResult] = useState<DataResult>(
    process([], mainColumnDataState)
  );
  const [mainColumnDataResult, setMainColumnDataResult] = useState<DataResult>(
    process([], mainColumnDataState)
  );
  const [detailColumnDataResult, setDetailColumnDataResult] =
    useState<DataResult>(process([], detailColumnDataState));

  const [mainDefaultDataResult, setMainDefaultDataResult] =
    useState<DataResult>(process([], mainDefaultDataState));
  const [detailDefaultDataResult, setDetailDefaultDataResult] =
    useState<DataResult>(process([], detailDefaultDataState));

  const [ControlSelectedState, setControlSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [wordSelectedState, setWordSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [mainColumnSelectedState, setMainColumnSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailColumnSelectedState, setDetailColumnSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [mainDefaultSelectedState, setMainDefaultSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailDefaultSelectedState, setDetailDefaultSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [ControlPgNum, setControlPgNum] = useState(1);
  const [wordPgNum, setWordPgNum] = useState(1);
  const [mainColumnPgNum, setMainColumnPgNum] = useState(1);
  const [detailColumnPgNum, setDetailColumnPgNum] = useState(1);
  const [mainDefaultPgNum, setMainDefaultPgNum] = useState(1);
  const [detailDefaultPgNum, setDetailDefaultPgNum] = useState(1);

  const [columnWindowWorkType, setColumnWindowWorkType] = useState<"N" | "U">(
    "N"
  );
  const [defaultWindowWorkType, setDefaultWindowWorkType] = useState<"N" | "U">(
    "N"
  );

  const [parentComponent, setParentComponent] = useState({
    option_id: "",
    option_name: "",
  });
  const [processType, setProcessType] = useState("");

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

  const processApi = useApi();

  const [tabSelected, setTabSelected] = React.useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
  };
  useEffect(() => {
    fetchControl();
    fetchWord();
    fetchMainDefault();
    fetchMainColumn();
  }, [tabSelected]);

  const pathname: string = window.location.pathname.replace("/", "");

  //요약정보 조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "sel_custom_option",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "column-list",
      "@p_form_id": pathname,
      "@p_type": "",
      "@p_option_id": "",
      "@p_option_name": "",
      "@p_remarks": "",
      "@p_company_code": "",
    },
  };

  //조회조건 초기값
  const [wordFilters, setWordFilters] = useState({
    pgSize: PAGE_SIZE,
    work_type: "LIST",
    word_id: "",
    word_text: "",
  });

  const wordParameters: Iparameters = {
    procedureName: "sel_word_info",
    pageNumber: wordPgNum,
    pageSize: wordFilters.pgSize,
    parameters: {
      "@p_work_type": "Default",
      "@p_culture_name": "",
      "@p_word_id": wordFilters.word_id,
      "@p_word_text": wordFilters.word_text,
      "@p_default_text": "",
      "@p_remarks": "",
      "@p_find_row_value": "",
      "@p_is_match": "",
      "@p_dc_code": "",
    },
  };
  const defaultMainParameters: Iparameters = {
    procedureName: "sel_custom_option",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "default-list",
      "@p_form_id": pathname,
      "@p_type": "",
      "@p_option_id": "",
      "@p_option_name": "",
      "@p_remarks": "",
      "@p_company_code": "",
    },
  };

  const [columnDetailInitialVal, setColumnDetailInitialVal] = useState({
    option_id: "",
    option_name: "",
  });

  const [defaultDetailInitialVal, setDefaultDetailInitialVal] = useState({
    option_id: "",
    option_name: "",
  });

  //columnDetailInitialVal 변경 될 시 컬럼 디테일 그리드 조회
  useEffect(() => {
    fetchDetailColumn();
  }, [columnDetailInitialVal]);

  //defaultDetailInitialVal 변경 될 시 기본값 디테일 그리드 조회
  useEffect(() => {
    fetchDetailDefault();
  }, [defaultDetailInitialVal]);

  useEffect(() => {
    if (mainColumnDataResult.total > 0) {
      //첫번째 행 선택
      const firstRowData = mainColumnDataResult.data[0];
      setMainColumnSelectedState({
        [firstRowData[MAIN_COLUMN_DATA_ITEM_KEY]]: true,
      });

      //첫번째 행 기준으로 디테일값 세팅
      setColumnDetailInitialVal((prev) => ({
        ...prev,
        [MAIN_COLUMN_DATA_ITEM_KEY]: firstRowData[MAIN_COLUMN_DATA_ITEM_KEY],
      }));
    }
  }, [mainColumnDataResult]);

  useEffect(() => {
    if (mainDefaultDataResult.total > 0) {
      //첫번째 행 선택
      const firstRowData = mainDefaultDataResult.data[0];
      setMainDefaultSelectedState({
        [firstRowData[MAIN_DEFAULT_DATA_ITEM_KEY]]: true,
      });

      //첫번째 행 기준으로 디테일값 세팅
      setDefaultDetailInitialVal({
        option_id: firstRowData.option_id,
        option_name: firstRowData.option_name,
      });
    }
  }, [mainDefaultDataResult]);

  //컨트롤 요약정보 조회
  const fetchControl = async () => {
    let data: any;

    const queryStr =
      "SELECT form_id, control_name, field_name, parent, type, A.word_id, ISNULL(B.word_text,'') word_text " +
      "FROM appDesignInfo A LEFT OUTER JOIN brpWordInfo B ON A.word_id = B.word_id AND culture_name = 'ko-KR' " +
      "WHERE form_id = '" +
      pathname +
      "'";

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("platform-query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        const dataTree: any = createDataTree(
          rows,
          (i: any) => i.control_name,
          (i: any) => i.parent,
          subItemsField
        );

        setcontrolDataResult([...dataTree]);
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  //용어사전 조회
  const fetchWord = async () => {
    let data: any;
    try {
      data = await processApi<any>("platform-procedure", wordParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setWordDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  // 컨트롤 정보 저장
  const fetchControlSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("platform-procedure", controlSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchControl();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    controlData.work_type = ""; //초기화
  };

  //컬럼 요약정보 조회
  const fetchMainColumn = async () => {
    let data: any;
    try {
      data = await processApi<any>("platform-procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;

      setMainColumnDataResult(process(rows, mainColumnDataState));
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  //기본값 요약정보 조회
  const fetchMainDefault = async () => {
    let data: any;
    try {
      data = await processApi<any>("platform-procedure", defaultMainParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setMainDefaultDataResult(process(rows, mainDefaultDataState));
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  //컬럼 상세그리드 조회
  const fetchDetailColumn = async () => {
    let data: any;
    const selectedRowKeyVal =
      Object.getOwnPropertyNames(mainColumnSelectedState)[0] ?? null;

    if (selectedRowKeyVal === null) return false;

    const selectedRowData = mainColumnDataResult.data.find(
      (item) => item[MAIN_COLUMN_DATA_ITEM_KEY] === selectedRowKeyVal
    );

    const para = {
      formId: pathname,
      para:
        "column-detail?optionId=" +
        columnDetailInitialVal.option_id +
        "&companyCode=" +
        selectedRowData.company_code,
    };

    try {
      data = await processApi<any>("column-detail", para);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      let totalRowsCnt = 0;
      let rows: any = [];
      if (data[1].RowCount > 0) {
        // Custom 설정
        totalRowsCnt = data[1].RowCount;
        rows = data[1].Rows.map((row: any) => ({
          ...row,
          fixed: row.fixed === "None" ? "N" : "Y",
          hidden: row.sort_order < 0 ? "Y" : "N",
        }));
      } else {
        // System 설정
        totalRowsCnt = data[0].RowCount;
        rows = data[0].Rows.map((row: any) => ({
          ...row,
          fixed: row.fixed === "None" ? "N" : "Y",
          hidden: row.sort_order < 0 ? "Y" : "N",
        }));
      }

      //   const rows = data.Rows.map((row: any) =>
      //   row.custom_value_registered
      //     ? {
      //         ...row,
      //         sys_use_session: row.use_session,
      //         use_session: row.custom_use_session,
      //         value_code: row.custom_value_code,
      //         value: row.custom_value,
      //         add_year: row.custom_add_year,
      //         add_month: row.custom_add_month,
      //         add_day: row.custom_add_day,
      //         value_lookup: row.custom_value_lookup,
      //         fixed: row.fixed === "None" ? "N" : "Y",
      //         hidden: row.sort_order < 0 ? "Y" : "N",
      //       }
      //     : { ...row, sys_use_session: row.use_session,
      //       fixed: row.fixed === "None" ? "N" : "Y",
      //       hidden: row.sort_order < 0 ? "Y" : "N", }
      // );

      setDetailColumnDataResult(() => {
        return {
          data: [...rows],
          total: totalRowsCnt,
        };
      });
    }
  };

  //기본값 상세그리드 조회
  const fetchDetailDefault = async () => {
    if (defaultDetailInitialVal.option_id === "") {
      return false;
    }

    let data: any;

    const para = {
      formId: pathname,
      para:
        "default-detail?optionId=" +
        defaultDetailInitialVal.option_id +
        "&userId=" +
        sessionUserId,
    };

    try {
      data = await processApi<any>("default-detail", para);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      // 커스텀 데이터 있으면 커스템 데이터 표시, 없으면 시스템 데이터 표시
      const rows = data.Rows.map((row: any) =>
        row.custom_value_registered
          ? {
              ...row,
              sys_use_session: row.use_session,
              use_session: row.custom_use_session,
              value_code: row.custom_value_code,
              value: row.custom_value,
              add_year: row.custom_add_year,
              add_month: row.custom_add_month,
              add_day: row.custom_add_day,
              value_lookup: row.custom_value_lookup,
            }
          : { ...row, sys_use_session: row.use_session }
      );

      const totalRowsCnt = data.RowCount;

      setDetailDefaultDataResult(() => {
        return {
          data: [...rows],
          total: totalRowsCnt,
        };
      });
    } else {
      console.log("fetchDetailDefault 에러 발생");
    }
  };

  //커스텀 옵션 저장 프로시저 파라미터 State
  const [customOptionParaData, setCustomOptionParaData] = useState({
    work_type: "",
    form_id: pathname,
    type: "",
    option_id: "",
    default_id: "",
    use_session: "",
    value_code: "",
    value: "",
    add_year: "",
    add_month: "",
    add_day: "",
    column_id: "",
    sort_order: "",
    width: "",
    fixed: "",
    id: sessionUserId,
    pc: pc,
  });

  //커스텀 저장 프로시저 파라미터
  const customParaSaved: Iparameters = {
    procedureName: "sys_sav_custom_option",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": customOptionParaData.work_type,
      "@p_form_id": customOptionParaData.form_id,
      "@p_type": customOptionParaData.type,
      "@p_option_id": customOptionParaData.option_id,

      /* sysCustomOptionDefault */
      "@p_default_id": customOptionParaData.default_id,
      "@p_use_session": customOptionParaData.use_session,
      "@p_value_code": customOptionParaData.value_code,
      "@p_value": customOptionParaData.value,
      "@p_add_year": customOptionParaData.add_year,
      "@p_add_month": customOptionParaData.add_month,
      "@p_add_day": customOptionParaData.add_day,

      /* sysCustomOptionColumn */
      "@p_column_id": customOptionParaData.column_id,
      "@p_sort_order": customOptionParaData.sort_order,
      "@p_width": customOptionParaData.width,
      "@p_fixed": customOptionParaData.fixed,

      "@p_id": customOptionParaData.id,
      "@p_pc": customOptionParaData.pc,
    },
  };

  //컨트롤 정보 저장 프로시저 파라미터 State
  const [controlData, setControlParaData] = useState({
    work_type: "",
    form_id: pathname,
    control_name: "",
    field_name: "",
    parent: "",
    type: "",
    full_type: "",
    bc_id: "",
    word_id: "",
    id: sessionUserId,
    pc: pc,
  });

  //컨트롤 정보 저장 프로시저 파라미터
  const controlSaved: Iparameters = {
    procedureName: "sav_form_design_info",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": controlData.work_type,
      "@p_form_id": controlData.form_id,
      "@p_control_name": controlData.control_name,
      "@p_field_name": controlData.field_name,
      "@p_parent": controlData.parent,
      "@p_type": controlData.type,
      "@p_full_type": controlData.full_type,
      "@p_bc_id": controlData.bc_id,
      "@p_word_id": controlData.word_id,
      "@p_id": controlData.id,
      "@p_pc": controlData.pc,
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setMainColumnDataResult(process([], mainColumnDataState));
    setDetailColumnDataResult(process([], detailColumnDataState));
  };

  //커스텀 디폴트/컬럼 값 저장
  const fetchCustomSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", customParaSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      if (customOptionParaData.work_type === "init") {
        alert("초기화가 완료되었습니다.");
      } else {
      }

      if (customOptionParaData.type === "Column") {
        fetchDetailColumn();
      } else if (customOptionParaData.type === "Default") {
        fetchDetailDefault();
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    customOptionParaData.work_type = ""; //초기화
  };

  useEffect(() => {
    if (customOptionParaData.work_type !== "") fetchCustomSaved();
  }, [customOptionParaData]);

  useEffect(() => {
    if (controlData.work_type !== "") fetchControlSaved();
  }, [controlData]);

  const onControlScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, ControlPgNum, PAGE_SIZE))
      setControlPgNum((prev) => prev + 1);
  };
  const onWordScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, wordPgNum, PAGE_SIZE))
      setWordPgNum((prev) => prev + 1);
  };

  useEffect(() => {
    fetchWord();
  }, [wordPgNum]);

  const onMainColumnScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainColumnPgNum, PAGE_SIZE))
      setMainColumnPgNum((prev) => prev + 1);
  };

  const onDetailColumnScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailColumnPgNum, PAGE_SIZE))
      setDetailColumnPgNum((prev) => prev + 1);
  };
  const onMainDefaultScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainDefaultPgNum, PAGE_SIZE))
      setMainDefaultPgNum((prev) => prev + 1);
  };

  const onDetailDefaultScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailDefaultPgNum, PAGE_SIZE))
      setDetailDefaultPgNum((prev) => prev + 1);
  };

  const onControlDataStateChange = (event: GridDataStateChangeEvent) => {
    setControlDataState(event.dataState);
  };
  const onWordDataStateChange = (event: GridDataStateChangeEvent) => {
    setWordDataState(event.dataState);
  };

  const onMainColumnDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainColumnDataState(event.dataState);
  };

  const onDetailColumnDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailColumnDataState(event.dataState);
  };
  const onMainDefaultDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDefaultDataState(event.dataState);
  };

  const onDetailDefaultDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDefaultDataState(event.dataState);
  };

  const onControlSortChange = (e: any) => {
    setControlDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onWordSortChange = (e: any) => {
    setWordDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainColumnSortChange = (e: any) => {
    setMainColumnDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onDetailColumnSortChange = (e: any) => {
    setDetailColumnDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDefaultSortChange = (e: any) => {
    setMainDefaultDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onDetailDefaultSortChange = (e: any) => {
    setDetailDefaultDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainColumnSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: mainColumnSelectedState,
      dataItemKey: MAIN_COLUMN_DATA_ITEM_KEY,
    });
    setMainColumnSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setColumnDetailInitialVal((prev) => ({
      ...prev,
      option_id: selectedRowData.option_id,
    }));
  };

  const onControlSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: ControlSelectedState,
      dataItemKey: CONTROL_DATA_ITEM_KEY,
    });
    setDetailColumnSelectedState(newSelectedState);
  };
  const onWordSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: wordSelectedState,
      dataItemKey: WORD_DATA_ITEM_KEY,
    });
    setDetailColumnSelectedState(newSelectedState);
  };
  const onDetailColumnSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailColumnSelectedState,
      dataItemKey: DETAIL_COLUMN_DATA_ITEM_KEY,
    });
    setDetailColumnSelectedState(newSelectedState);
  };
  const onMainDefaultSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: mainDefaultSelectedState,
      dataItemKey: MAIN_DEFAULT_DATA_ITEM_KEY,
    });
    setMainDefaultSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setDefaultDetailInitialVal({
      option_id: selectedRowData.option_id,
      option_name: selectedRowData.option_name,
    });
  };

  const onDetailDefaultSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailDefaultSelectedState,
      dataItemKey: DETAIL_DEFAULT_DATA_ITEM_KEY,
    });
    setDetailDefaultSelectedState(newSelectedState);
  };

  const onDetailColumnItemChange = (event: GridItemChangeEvent) => {
    // const newData = getGridItemChangedData(event);

    getGridItemChangedData(
      event,
      detailColumnDataResult,
      setDetailColumnDataResult,
      DETAIL_COLUMN_DATA_ITEM_KEY
    );
  };
  const onDetailDefaultItemChange = (event: GridItemChangeEvent) => {
    // const newData = getGridItemChangedData(event);

    getGridItemChangedData(
      event,
      detailDefaultDataResult,
      setDetailDefaultDataResult,
      DETAIL_DEFAULT_DATA_ITEM_KEY
    );
  };

  const detailColumnEnterEdit = (dataItem: any, field: string) => {
    const newData = detailColumnDataResult.data.map((item) =>
      item[DETAIL_COLUMN_DATA_ITEM_KEY] ===
      dataItem[DETAIL_COLUMN_DATA_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : { ...item, [EDIT_FIELD]: undefined }
    );

    setDetailColumnDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const detailColumnExitEdit = () => {
    const newData = detailColumnDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setDetailColumnDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };
  const detailDefaultEnterEdit = (dataItem: any, field: string) => {
    const newData = detailDefaultDataResult.data.map((item) =>
      item[DETAIL_DEFAULT_DATA_ITEM_KEY] ===
      dataItem[DETAIL_DEFAULT_DATA_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : { ...item, [EDIT_FIELD]: undefined }
    );

    setDetailDefaultDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const detailDefaultExitEdit = () => {
    const newData = detailDefaultDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setDetailDefaultDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const detailColumnCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={detailColumnEnterEdit}
      editField={EDIT_FIELD}
    />
  );

  const detailColumnRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={detailColumnExitEdit}
      editField={EDIT_FIELD}
    />
  );
  const detailDefaultCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={detailDefaultEnterEdit}
      editField={EDIT_FIELD}
    />
  );

  const detailDefaultRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={detailDefaultExitEdit}
      editField={EDIT_FIELD}
    />
  );

  const onCreateColumnClick = () => {
    setParentComponent({
      option_id: "",
      option_name: "",
    });
    setColumnWindowWorkType("N");
    setColumnWindowVisible(true);
  };

  const onCreateDefaultClick = () => {
    setDefaultWindowWorkType("N");
    setDefaultWindowVisible(true);
  };

  const onSaveControl = () => {
    type TdataArr = {
      control_name: string[];
      field_name: string[];
      parent: string[];
      type: string[];
      full_type: string[];
      bc_id: string[];
      word_id: string[];
    };

    let dataArr: TdataArr = {
      control_name: [],
      field_name: [],
      parent: [],
      type: [],
      full_type: [],
      bc_id: [],
      word_id: [],
    };

    const flatData: any = treeToFlat(
      controlDataResult,
      "control_name",
      subItemsField
    );
    flatData.forEach((item: any) => delete item[subItemsField]);

    flatData.forEach((item: any) => {
      const {
        control_name,
        field_name,
        parent,
        type,
        full_type,
        bc_id,
        word_id,
      } = item;

      dataArr.control_name.push(control_name);
      dataArr.field_name.push(field_name);
      dataArr.parent.push(parent);
      dataArr.type.push(type);
      dataArr.full_type.push(full_type);
      dataArr.bc_id.push(bc_id);
      dataArr.word_id.push(word_id);
    });

    setControlParaData((prev) => ({
      ...prev,
      work_type: "save",
      control_name: dataArr.control_name.join("|"),
      field_name: dataArr.field_name.join("|"),
      parent: dataArr.parent.join("|"),
      type: dataArr.type.join("|"),
      full_type: dataArr.full_type.join("|"),
      bc_id: dataArr.bc_id.join("|"),
      word_id: dataArr.word_id.join("|"),
    }));
  };

  // 커스텀 디폴트 저장
  const onSaveCustomDefault = () => {
    type TdataArr = {
      default_id: string[];
      use_session: string[];
      value_code: string[];
      value: string[];
      add_year: number[];
      add_month: number[];
      add_day: number[];
    };

    let dataArr: TdataArr = {
      default_id: [],
      use_session: [],
      value_code: [],
      value: [],
      add_year: [],
      add_month: [],
      add_day: [],
    };

    detailDefaultDataResult.data.forEach((item: any) => {
      const {
        default_id,
        use_session,
        value_code,
        add_year,
        add_month,
        add_day,
      } = item;

      dataArr.default_id.push(default_id);
      dataArr.use_session.push(getYn(use_session));
      dataArr.value_code.push(value_code);
      dataArr.value.push("");
      dataArr.add_year.push(add_year);
      dataArr.add_month.push(add_month);
      dataArr.add_day.push(add_day);
    });

    const option_id = Object.getOwnPropertyNames(mainDefaultSelectedState)[0];

    setCustomOptionParaData((prev) => ({
      ...prev,
      work_type: "save",
      type: "Default",
      option_id: option_id,
      default_id: dataArr.default_id.join("|"),
      use_session: dataArr.use_session.join("|"),
      value_code: dataArr.value_code.join("|"),
      value: dataArr.value.join("|"),
      add_year: dataArr.add_year.join("|"),
      add_month: dataArr.add_month.join("|"),
      add_day: dataArr.add_day.join("|"),
    }));
  };

  // 커스텀 컬럼 저장
  const onSaveCustomColumn = () => {
    type TdataArr = {
      column_id: string[];
      sort_order: string[];
      width: string[];
      fixed: string[];
    };

    let dataArr: TdataArr = {
      column_id: [],
      sort_order: [],
      width: [],
      fixed: [],
    };

    detailColumnDataResult.data.forEach((item: any, idx: number) => {
      const { column_id, width, fixed, hidden } = item;

      dataArr.column_id.push(column_id);
      dataArr.sort_order.push(getYn(hidden) === "Y" ? "-1" : String(idx));
      dataArr.width.push(width);
      dataArr.fixed.push(getYn(fixed) === "Y" ? "Left" : "None");
    });

    const option_id = Object.getOwnPropertyNames(mainColumnSelectedState)[0];

    setCustomOptionParaData((prev) => ({
      ...prev,
      work_type: "save",
      type: "Column",
      option_id: option_id,
      column_id: dataArr.column_id.join("|"),
      sort_order: dataArr.sort_order.join("|"),
      width: dataArr.width.join("|"),
      fixed: dataArr.fixed.join("|"),
    }));
  };

  // 디폴트 데이터 초기화 (커스텀 데이터 삭제)
  const onInitDefault = () => {
    const default_id = Object.getOwnPropertyNames(
      detailDefaultSelectedState
    )[0];
    if (!detailDefaultSelectedState[default_id]) {
      alert("초기화 할 항목을 선택해주세요.");
      return false;
    }
    if (
      !window.confirm("선택한 항목을 시스템 기본 값으로 초기화하시겠습니까?")
    ) {
      return false;
    }
    const option_id = Object.getOwnPropertyNames(mainDefaultSelectedState)[0];

    setCustomOptionParaData((prev) => ({
      ...prev,
      work_type: "init",
      type: "Default",
      option_id,
      default_id,
    }));
  };
  // 컬럼 데이터 초기화 (커스텀 데이터 삭제)
  const onInitColumn = () => {
    const column_id = Object.getOwnPropertyNames(detailColumnSelectedState)[0];
    if (!detailColumnSelectedState[column_id]) {
      alert("초기화 할 항목을 선택해주세요.");
      return false;
    }
    if (
      !window.confirm("선택한 항목을 시스템 기본 값으로 초기화하시겠습니까?")
    ) {
      return false;
    }
    const option_id = Object.getOwnPropertyNames(mainColumnSelectedState)[0];

    setCustomOptionParaData((prev) => ({
      ...prev,
      work_type: "init",
      type: "Column",
      option_id,
      column_id,
    }));
  };

  type TDataInfo = {
    DATA_ITEM_KEY: string;
    selectedState: {
      [id: string]: boolean | number[];
    };
    dataResult: DataResult;
    setDataResult: (p: any) => any;
  };
  type TArrowBtnClick = {
    direction: string;
    dataInfo: TDataInfo;
  };

  const arrowBtnClickPara = {
    DATA_ITEM_KEY: DETAIL_COLUMN_DATA_ITEM_KEY,
    selectedState: detailColumnSelectedState,
    dataResult: detailColumnDataResult,
    setDataResult: setDetailColumnDataResult,
  };

  const onArrowsBtnClick = (para: TArrowBtnClick) => {
    const { direction, dataInfo } = para;
    const { DATA_ITEM_KEY, selectedState, dataResult, setDataResult } =
      dataInfo;
    const selectedField = Object.getOwnPropertyNames(selectedState)[0];

    const rowData = dataResult.data.find(
      (row) => row[DATA_ITEM_KEY] === selectedField
    );

    const rowIndex = dataResult.data.findIndex(
      (row) => row[DATA_ITEM_KEY] === selectedField
    );

    if (rowIndex === -1) {
      alert("이동시킬 행을 선택해주세요.");
      return false;
    }

    const newData = dataResult.data.map((item: any) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    newData.splice(rowIndex, 1);
    newData.splice(rowIndex + (direction === "UP" ? -1 : 1), 0, rowData);

    setDataResult((prev: any) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  //프로시저 파라미터 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    option_id: "",
    form_id: pathname,
  });
  const [defaultParaDataDeleted, setDefaultParaDataDeleted] = useState({
    work_type: "",
    option_id: "",
    form_id: pathname,
  });

  //프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "sav_custom_option",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_form_id": paraDataDeleted.form_id,
      "@p_type": "Column",
      "@p_company_code": "",
      "@p_option_id": paraDataDeleted.option_id,
      "@p_option_name": "",
      "@p_subject_word_id": "",
      "@p_remarks": "",
      "@p_row_status": "",

      /* sysCustomOptionDefault */
      "@p_default_id": "",
      "@p_caption": "",
      "@p_word_id": "",
      "@p_sort_order": "",
      "@p_value_type": "",
      "@p_value_code": "",
      "@p_value": "",
      "@p_bc_id": "",
      "@p_where_query": "",
      "@p_add_year": "",
      "@p_add_month": "",
      "@p_add_day": "",
      "@p_session_item": "",
      "@p_use_session": "",
      "@p_user_editable": "",
      /* sysCustomOptionColumn */
      "@p_column_id": "",
      "@p_width": 0,
      "@p_fixed": "",

      "@p_id": sessionUserId,
      "@p_pc": pc,
    },
  };
  const defaultParaDeleted: Iparameters = {
    procedureName: "sav_custom_option",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": defaultParaDataDeleted.work_type,
      "@p_form_id": defaultParaDataDeleted.form_id,
      "@p_type": "Default",
      "@p_company_code": "",
      "@p_option_id": defaultParaDataDeleted.option_id,
      "@p_option_name": "",
      "@p_subject_word_id": "",
      "@p_remarks": "",
      "@p_row_status": "",

      /* sysCustomOptionDefault */
      "@p_default_id": "",
      "@p_caption": "",
      "@p_word_id": "",
      "@p_sort_order": "",
      "@p_value_type": "",
      "@p_value_code": "",
      "@p_value": "",
      "@p_bc_id": "",
      "@p_where_query": "",
      "@p_add_year": "",
      "@p_add_month": "",
      "@p_add_day": "",
      "@p_session_item": "",
      "@p_use_session": "",
      "@p_user_editable": "",
      /* sysCustomOptionColumn */
      "@p_column_id": "",
      "@p_width": 0,
      "@p_fixed": "",

      "@p_id": sessionUserId,
      "@p_pc": pc,
    },
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete(paraDeleted);
  }, [paraDataDeleted]);

  useEffect(() => {
    if (defaultParaDataDeleted.work_type === "D")
      fetchToDelete(defaultParaDeleted);
  }, [defaultParaDataDeleted]);

  const fetchToDelete = async (para: any) => {
    let data: any;

    try {
      data = await processApi<any>("platform-procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      alert("삭제가 완료되었습니다.");

      resetAllGrid();
      fetchMainColumn();
      fetchMainDefault();
    } else {
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.option_id = "";
    defaultParaDataDeleted.work_type = "";
    defaultParaDataDeleted.option_id = "";
  };

  const onDeleteColumnClick = () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }

    const option_id = Object.getOwnPropertyNames(mainColumnSelectedState)[0];

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      option_id,
    }));
  };

  const onDeleteDefaultClick = () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }

    const option_id = Object.getOwnPropertyNames(mainDefaultSelectedState)[0];

    setDefaultParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      option_id,
    }));
  };

  const ColumnCommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      // 요약정보 행 클릭
      const rowData = props.dataItem;
      setMainColumnSelectedState({
        [rowData[MAIN_COLUMN_DATA_ITEM_KEY]]: true,
      });

      // 컬럼 팝업 창 오픈 (수정용)
      setParentComponent({
        option_id: rowData["option_id"],
        option_name: rowData["option_name"],
      });
      setColumnWindowWorkType("U");
      setColumnWindowVisible(true);
    };

    return (
      <td className="k-command-cell">
        <CommandCellBtn onClick={onEditClick} />
      </td>
    );
  };

  const DefaultCommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      // 요약정보 행 클릭
      const rowData = props.dataItem;
      setMainColumnSelectedState({
        [rowData[MAIN_DEFAULT_DATA_ITEM_KEY]]: true,
      });

      // 컬럼 팝업 창 오픈 (수정용)
      setProcessType(rowData[MAIN_DEFAULT_DATA_ITEM_KEY]);
      setDefaultWindowWorkType("U");
      setDefaultWindowVisible(true);
    };

    return (
      <td className="k-command-cell">
        <CommandCellBtn onClick={onEditClick} />
      </td>
    );
  };

  const ArrowsCell = (props: GridCellProps) => {
    const onClick = (item: any) => {
      console.log("item");
      console.log(item);
      const { dataIndex, dataItem } = item;

      const newData = detailColumnDataResult.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));

      newData.splice(dataIndex, 1);
      newData.splice(dataIndex + 1, 0, dataItem);

      setDetailColumnDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <td className="k-command-cell">
        <CommandCellBtn onClick={() => onClick(props)} />
      </td>
    );
  };

  type TCommandCellBtn = {
    onClick: () => void;
  };
  const CommandCellBtn = (props: TCommandCellBtn) => {
    return (
      <Button
        className="k-grid-edit-command"
        themeColor={"primary"}
        fillMode="outline"
        onClick={props.onClick}
        icon="edit"
      ></Button>
    );
  };

  const reloadData = () => {
    fetchMainColumn();
    fetchMainDefault();
  };

  const onGetControlClick = () => {
    const root = document.getElementById("root");
    if (root === null) {
      alert("오류가 발생하였습니다. 새로고침 후 다시 시도해주세요.");
      return false;
    }

    //let ControlList: Array<TControlObj>; //차이점?..
    let ControlList: TControlObj[] = [];

    // 1) 최상위 메뉴
    const topElementObj: TControlObj = {
      rowstatus: "N",
      form_id: pathname,
      control_name: pathname,
      field_name: "",
      parent: "",
      type: "",
      word_id: "",
      word_text: "",
    };
    ControlList.push(topElementObj);

    // 2) Text 그룹
    const textGroupObj: TControlObj = {
      rowstatus: "N",
      form_id: pathname,
      control_name: "Texts",
      field_name: "",
      parent: pathname,
      type: "TextGroup",
      word_id: "",
      word_text: "",
    };
    ControlList.push(textGroupObj);

    // 3) Text 그룹 하위 요소
    // [data-control-name] 리스트 (Label, Title 등)
    const controlNameObjArr = [...root.querySelectorAll("[data-control-name]")];
    const controlNameList = controlNameObjArr.map(
      (item: any) => item.dataset.controlName
    );
    controlNameList.forEach((item) => {
      if (item === "") return;
      const controlObj: TControlObj = {
        rowstatus: "N",
        form_id: pathname,
        control_name: item,
        field_name: "",
        parent: "Texts",
        type: item.includes("lbl")
          ? "Label"
          : item.includes("grt")
          ? "GridTitle"
          : "",
        word_id: "",
        word_text: "",
      };
      ControlList.push(controlObj);
    });

    // 2) Text 그룹
    const gridGroupObj: TControlObj = {
      rowstatus: "N",
      form_id: pathname,
      control_name: "Grids",
      field_name: "",
      parent: pathname,
      type: "GridGroup",
      word_id: "",
      word_text: "",
    };
    ControlList.push(gridGroupObj);

    // 2) Grid 그룹
    const columnArr: any = [...root.querySelectorAll("[data-grid-name]")];
    const gridNameArr: string[] = [];
    columnArr.forEach((item: any) => {
      if (!gridNameArr.includes(item.dataset.gridName)) {
        gridNameArr.push(item.dataset.gridName);
      }
    });
    gridNameArr.forEach((item: string) => {
      const controlObj: TControlObj = {
        rowstatus: "N",
        form_id: pathname,
        control_name: item,
        field_name: "",
        parent: "Grids",
        type: "Grid",
        word_id: "",
        word_text: "",
      };
      ControlList.push(controlObj);
    });

    // 3) Grid 그룹 하위요소
    // [data-grid-name] 리스트 (Column)
    columnArr.forEach((item: any) => {
      const controlObj: TControlObj = {
        rowstatus: "N",
        form_id: pathname,
        control_name: item.id,
        field_name: item.dataset.field,
        parent: item.dataset.gridName,
        type: "Column",
        word_id: "",
        word_text: "",
      };
      ControlList.push(controlObj);
    });

    // 기존소스의 word_id 참조
    const flatData: any = treeToFlat(
      controlDataResult,
      "control_name",
      subItemsField
    );
    flatData.forEach((item: any) => delete item[subItemsField]);

    ControlList.forEach((item) => {
      const sameControlData = flatData.find(
        (orgItem: any) => item.control_name === orgItem.control_name
      );

      if (sameControlData) {
        item.word_id = sameControlData.word_id;
        item.word_text = sameControlData.word_text;
      }
    });

    const dataTree: any = createDataTree(
      ControlList,
      (i: any) => i.control_name,
      (i: any) => i.parent,
      subItemsField
    );

    setcontrolDataResult([...dataTree]);
  };

  const [ControlExpanded, setControlExpanded] = React.useState<string[]>([
    pathname,
  ]);

  const onControlExpandChange = (e: TreeListExpandChangeEvent) => {
    setControlExpanded(
      e.value
        ? ControlExpanded.filter(
            (id) => id !== e.dataItem[CONTROL_DATA_ITEM_KEY]
          )
        : [...ControlExpanded, e.dataItem[CONTROL_DATA_ITEM_KEY]]
    );
  };

  const ControlCallback = (item: any) =>
    ControlExpanded.includes(item[CONTROL_DATA_ITEM_KEY])
      ? extendDataItem(item, subItemsField, { expanded: true })
      : item;

  const [wordDragDataItem, setWordDragDataItem] = useState<any>(null);
  const [controlDragDataItem, setControlDragDataItem] = useState<any>(null);

  const wordRowRender = (row: any, props: any) => {
    return (
      <DraggableGridRowRender
        props={props}
        row={row}
        onDrop={handleWordDrop}
        onDragStart={handleWordDragStart}
      />
    );
  };

  const controlRowRender = (tr: any, props: any) => (
    <DraggableGridRowRender
      props={props}
      row={tr}
      onDrop={handleControlDrop}
      onDragStart={handleControlDragStart}
    />
  );

  const handleWordDragStart = (e: any, dataItem: any) => {
    setWordDragDataItem(dataItem);
  };
  const handleControlDragStart = (e: any, dataItem: any) => {
    setWordDragDataItem(dataItem);
    setControlDragDataItem(dataItem);
  };

  // 컨트롤 데이터 word_id 업데이트
  const handleControlDrop = (e: any, dataItem: any) => {
    if (wordDragDataItem === null) {
      return false;
    }

    const { control_name = "" } = dataItem;

    const flatData: any = treeToFlat(
      controlDataResult,
      "control_name",
      subItemsField
    );

    flatData.forEach((item: any) => delete item[subItemsField]);

    const newData = flatData.map((item: any) =>
      item[CONTROL_DATA_ITEM_KEY] === control_name
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            word_id: wordDragDataItem.word_id,
            word_text: wordDragDataItem.word_text,
          }
        : item
    );

    const dataTree: any = createDataTree(
      newData,
      (i: any) => i.control_name,
      (i: any) => i.parent,
      subItemsField
    );

    setcontrolDataResult([...dataTree]);
    setWordDragDataItem(null);
  };

  // 컨트롤 데이터 word_id 삭제
  const handleWordDrop = (e: any, dataItem: any) => {
    if (controlDragDataItem === null) {
      return false;
    }

    const control_name = controlDragDataItem[CONTROL_DATA_ITEM_KEY];

    const flatData: any = treeToFlat(
      controlDataResult,
      "control_name",
      subItemsField
    );

    flatData.forEach((item: any) => delete item[subItemsField]);

    const newData = flatData.map((item: any) =>
      item[CONTROL_DATA_ITEM_KEY] === control_name
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            word_id: "",
            word_text: "",
          }
        : item
    );

    const dataTree: any = createDataTree(
      newData,
      (i: any) => i.control_name,
      (i: any) => i.parent,
      subItemsField
    );

    setcontrolDataResult([...dataTree]);
    setWordDragDataItem(null);
  };

  return (
    <Window
      title={"사용자 옵션 설정"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <TabStrip selected={tabSelected} onSelect={handleSelectTab}>
        {isAdmin && (
          <TabStripTab title="컨트롤정보">
            <GridContainerWrap>
              <GridContainer clientWidth={1330 - 415}>
                <GridTitleContainer>
                  <GridTitle>컨트롤리스트</GridTitle>

                  <ButtonContainer>
                    <Button
                      onClick={onGetControlClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="file-add"
                    >
                      가져오기
                    </Button>
                    <Button
                      onClick={onSaveControl}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="save"
                    >
                      저장
                    </Button>
                    {/* 
                  <Button
                    onClick={onDeleteDefaultClick}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="delete"
                  >
                    삭제
                  </Button> */}
                  </ButtonContainer>
                </GridTitleContainer>
                <TreeList
                  style={{ height: "600px", overflow: "auto", width: "100%" }}
                  data={mapTree(
                    controlDataResult,
                    subItemsField,
                    ControlCallback
                  )}
                  expandField={EXPANDED_FIELD}
                  subItemsField={subItemsField}
                  onExpandChange={onControlExpandChange}
                  //선택 기능
                  dataItemKey={CONTROL_DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  columns={ControlColumns}
                  rowRender={controlRowRender}
                ></TreeList>
              </GridContainer>

              <GridContainer maxWidth="400px" inTab={true}>
                <GridTitleContainer>
                  <GridTitle>[참조] 용어정보</GridTitle>

                  <div style={{ gap: "2px", display: "flex" }}>
                    <Input
                      name="word_id"
                      type="text"
                      style={{ width: "110px" }}
                      placeholder="Word ID"
                      value={wordFilters.word_id}
                      onChange={filterInputChange}
                    />
                    <Input
                      name="word_text"
                      type="text"
                      style={{ width: "110px" }}
                      placeholder="텍스트"
                      value={wordFilters.word_text}
                      onChange={filterInputChange}
                    />

                    <Button
                      onClick={() => {
                        setWordPgNum(1);
                        setWordDataResult(process([], wordDataState));
                        fetchWord();
                      }}
                      icon="search"
                      // fillMode="flat"
                    />
                  </div>
                </GridTitleContainer>
                <Grid
                  style={{ height: "600px" }}
                  data={process(
                    wordDataResult.data.map((row) => ({
                      ...row,
                      [SELECTED_FIELD]: wordSelectedState[wordIdGetter(row)],
                    })),
                    wordDataState
                  )}
                  {...wordDataState}
                  onDataStateChange={onWordDataStateChange}
                  //선택 기능
                  dataItemKey={DETAIL_DEFAULT_DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "multiple",
                  }}
                  onSelectionChange={onWordSelectionChange}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={wordDataResult.total}
                  onScroll={onWordScrollHandler}
                  //정렬기능
                  sortable={true}
                  onSortChange={onWordSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                  rowRender={wordRowRender}
                >
                  <GridColumn field="word_id" title="Word ID" />
                  <GridColumn field="word_text" title="텍스트" />
                </Grid>
              </GridContainer>
            </GridContainerWrap>
          </TabStripTab>
        )}

        <TabStripTab title="기본값">
          <GridContainerWrap>
            <GridContainer maxWidth="280px">
              <GridTitleContainer>
                <GridTitle>요약정보</GridTitle>
                {isAdmin && (
                  <ButtonContainer>
                    <Button
                      onClick={onCreateDefaultClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="file-add"
                    >
                      신규
                    </Button>
                    <Button
                      onClick={onDeleteDefaultClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="delete"
                    >
                      삭제
                    </Button>
                  </ButtonContainer>
                )}
              </GridTitleContainer>
              <Grid
                style={{ height: "600px" }}
                data={process(
                  mainDefaultDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      mainDefaultSelectedState[mainDefaultIdGetter(row)],
                  })),
                  mainDefaultDataState
                )}
                {...mainDefaultDataState}
                onDataStateChange={onMainDefaultDataStateChange}
                //선택 기능
                dataItemKey={MAIN_DEFAULT_DATA_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "multiple",
                }}
                onSelectionChange={onMainDefaultSelectionChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={mainDefaultDataResult.total}
                onScroll={onMainDefaultScrollHandler}
                //정렬기능
                sortable={true}
                onSortChange={onMainDefaultSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
              >
                {isAdmin && (
                  <GridColumn
                    title="수정(시스템)"
                    cell={DefaultCommandCell}
                    width="100px"
                  />
                )}
                <GridColumn field="option_id" title="타입ID" />
                <GridColumn field="option_name" title="설명" />
              </Grid>
            </GridContainer>

            <GridContainer
              clientWidth={1330 - 275} //= 요약정보 200 + margin 15
              inTab={true}
            >
              <GridTitleContainer>
                <GridTitle>상세정보</GridTitle>
                <ButtonContainer>
                  <Button
                    onClick={onInitDefault}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="refresh"
                  >
                    기본값 초기화
                  </Button>
                  <Button
                    onClick={onSaveCustomDefault}
                    themeColor={"primary"}
                    icon="save"
                  >
                    저장
                  </Button>
                </ButtonContainer>
              </GridTitleContainer>
              <Grid
                style={{ height: "600px" }}
                data={process(
                  detailDefaultDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      detailDefaultSelectedState[detailDefaultIdGetter(row)],
                  })),
                  detailDefaultDataState
                )}
                {...detailDefaultDataState}
                onDataStateChange={onDetailDefaultDataStateChange}
                //선택 기능
                dataItemKey={DETAIL_DEFAULT_DATA_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "multiple",
                }}
                onSelectionChange={onDetailDefaultSelectionChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={detailDefaultDataResult.total}
                onScroll={onDetailDefaultScrollHandler}
                //정렬기능
                sortable={true}
                onSortChange={onDetailDefaultSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //incell 수정 기능
                onItemChange={onDetailDefaultItemChange}
                cellRender={detailDefaultCellRender}
                rowRender={detailDefaultRowRender}
                editField={EDIT_FIELD}
              >
                <GridColumn
                  field="rowstatus"
                  title=" "
                  width="40px"
                  editable={false}
                />
                <GridColumn
                  field="caption"
                  title="항목"
                  width="100px"
                  editable={false}
                />
                <GridColumn
                  field="use_session"
                  title="세션사용"
                  width=""
                  cell={DefaultUseSessioneCell}
                />
                <GridColumn
                  field="value_code"
                  title="기본값"
                  width="350px"
                  cell={DefaultValueCell}
                />
                <GridColumn
                  field="add_year"
                  title="연 추가"
                  width=""
                  cell={DefaultDateCell}
                  editor={"numeric"}
                />
                <GridColumn
                  field="add_month"
                  title="월 추가"
                  width=""
                  cell={DefaultDateCell}
                  editor={"numeric"}
                />
                <GridColumn
                  field="add_day"
                  title="일 추가"
                  width=""
                  cell={DefaultDateCell}
                  editor={"numeric"}
                />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="컬럼">
          <GridContainerWrap>
            <GridContainer maxWidth="300px">
              <GridTitleContainer>
                <GridTitle>요약정보</GridTitle>
                {isAdmin && (
                  <ButtonContainer>
                    <Button
                      onClick={onCreateColumnClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="file-add"
                    >
                      신규
                    </Button>
                    <Button
                      onClick={onDeleteColumnClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="delete"
                    >
                      삭제
                    </Button>
                  </ButtonContainer>
                )}
              </GridTitleContainer>
              <Grid
                style={{ height: "600px" }}
                data={process(
                  mainColumnDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      mainColumnSelectedState[mainColumnIdGetter(row)],
                  })),
                  mainColumnDataState
                )}
                {...mainColumnDataState}
                onDataStateChange={onMainColumnDataStateChange}
                //선택 기능
                dataItemKey={MAIN_COLUMN_DATA_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "multiple",
                }}
                onSelectionChange={onMainColumnSelectionChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={mainColumnDataResult.total}
                onScroll={onMainColumnScrollHandler}
                //정렬기능
                sortable={true}
                onSortChange={onMainColumnSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
              >
                {isAdmin && (
                  <GridColumn cell={ColumnCommandCell} width="55px" />
                )}
                <GridColumn field="option_name" title="영역" />
              </Grid>
            </GridContainer>

            <GridContainer
              clientWidth={1330 - 315} //= 요약정보 200 + margin 15
              inTab={true}
            >
              <GridTitleContainer>
                <GridTitle>상세정보</GridTitle>

                <ButtonContainer>
                  <Button
                    onClick={onInitColumn}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="refresh"
                  >
                    컬럼정보 초기화
                  </Button>
                  <Button
                    onClick={() =>
                      onArrowsBtnClick({
                        direction: "UP",
                        dataInfo: arrowBtnClickPara,
                      })
                    }
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="chevron-up"
                  ></Button>
                  <Button
                    onClick={() =>
                      onArrowsBtnClick({
                        direction: "DOWN",
                        dataInfo: arrowBtnClickPara,
                      })
                    }
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="chevron-down"
                  ></Button>

                  <Button
                    onClick={onSaveCustomColumn}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="save"
                  ></Button>
                </ButtonContainer>
              </GridTitleContainer>
              <Grid
                style={{ height: "600px" }}
                data={process(
                  detailColumnDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      detailColumnSelectedState[detailColumnIdGetter(row)],
                  })),
                  detailColumnDataState
                )}
                {...detailColumnDataState}
                onDataStateChange={onDetailColumnDataStateChange}
                //선택 기능
                dataItemKey={DETAIL_COLUMN_DATA_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "multiple",
                }}
                onSelectionChange={onDetailColumnSelectionChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={detailColumnDataResult.total}
                onScroll={onDetailColumnScrollHandler}
                //정렬기능
                sortable={true}
                onSortChange={onDetailColumnSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //incell 수정 기능
                onItemChange={onDetailColumnItemChange}
                cellRender={detailColumnCellRender}
                rowRender={detailColumnRowRender}
                editField={EDIT_FIELD}
              >
                <GridColumn
                  field="rowstatus"
                  title=" "
                  width="40px"
                  editable={false}
                />
                <GridColumn field="caption" title="컬럼명" editable={false} />
                <GridColumn field="width" title="컬럼 너비" cell={NumberCell} />
                <GridColumn
                  field="hidden"
                  title="컬럼 숨김"
                  cell={CheckBoxCell}
                />
                <GridColumn
                  field="fixed"
                  title="컬럼 고정"
                  cell={CheckBoxCell}
                />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
      </TabStrip>

      {columnWindowVisible && (
        <ColumnWindow
          setVisible={setColumnWindowVisible}
          workType={columnWindowWorkType}
          parentComponent={parentComponent}
          reloadData={reloadData}
        />
      )}

      {defaultWindowVisible && (
        <DefaultWindow
          setVisible={setDefaultWindowVisible}
          workType={defaultWindowWorkType}
          para={defaultDetailInitialVal}
          reloadData={reloadData}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
