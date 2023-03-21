import React, { useCallback, useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridFooterCellProps,
  GridCellProps,
  GridItemChangeEvent,
} from "@progress/kendo-react-grid";
import RequiredHeader from "../components/RequiredHeader";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { Button } from "@progress/kendo-react-buttons";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { getter } from "@progress/kendo-react-common";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import { DataResult, process, State } from "@progress/kendo-data-query";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  GridContainer,
  GridTitle,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
  GridContainerWrap,
} from "../CommonStyled";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  getQueryFromBizComponent,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  getGridItemChangedData,
  handleKeyPressSearch,
  UseGetValueFromSessionItem,
  UseParaPc,
  findMessage,
} from "../components/CommonFunction";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  GAP,
} from "../components/CommonString";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import NumberCell from "../components/Cells/NumberCell";
import { gridList } from "../store/columns/EA_A1000W_C";

const DATA_ITEM_KEY = "num";
const DATA_ITEM_KEY2 = "user_id";
let count = 0;
let deletedMainRows: object[] = [];

const headerField = ["user_name", "appseq", "appline"];
const editableField = ["user_name", "dptcd", "postcd", "resno", "appgb"];
const checkboxField = ["chooses", "arbitragb"];
const requiredField = ["appseq", "appline"];
const numberField = ["appseq"];
const customField = ["appline"];
type TdataArr = {
  rowstatus_s: string[];
  postcd: string[];
  resno: string[];
  appgb: string[];
  appseq: string[];
  arbitragb: string[];
  aftergb: string[];
  vicargb: string[];
  vicarid: string[];
  appline: string[];
  dptcd: string[];
};

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  // 사용자구분, 사업장, 사업부, 부서코드, 직위, 공개범위
  UseBizComponent("L_EA004", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal = field === "appline" ? "L_EA004" : "";

  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell bizComponent={bizComponent} {...props} />
  ) : (
    <td></td>
  );
};

const EA_A1000: React.FC = () => {
  const user_id = UseGetValueFromSessionItem("user_id");
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const processApi = useApi();
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        pgmgb: defaultOption.find((item: any) => item.id === "pgmgb").valueCode,
        resno: defaultOption.find((item: any) => item.id === "resno").valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_dptcd_001,L_HU005, L_sysUserMaster_004, L_EA001, L_EA004",
    setBizComponentData
  );

  //공통코드 리스트 조회 ()

  const [dptcdListData, setdptcdListData] = useState([
    { dptcd: "", dptnm: "" },
  ]);
  const [postcdListData, setpostcdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [resnoListData, setResnoListData] = useState([
    { user_id: "", user_name: "" },
  ]);
  const [appgbListData, setappgbListData] = useState([COM_CODE_DEFAULT_VALUE]);
  const [applineListData, setapplineListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const dptcdQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_dptcd_001"
        )
      );
      const postcdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_HU005")
      );
      const resnoQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_004"
        )
      );
      const appgbQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_EA001")
      );
      const applineQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_EA004")
      );
      fetchQuery(postcdQueryStr, setpostcdListData);
      fetchQuery(dptcdQueryStr, setdptcdListData);
      fetchQuery(resnoQueryStr, setResnoListData);
      fetchQuery(appgbQueryStr, setappgbListData);
      fetchQuery(applineQueryStr, setapplineListData);
    }
  }, [bizComponentData]);

  const fetchQuery = useCallback(async (queryStr: string, setListData: any) => {
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
  }, []);

  const [mainData3State, setMainData3State] = useState<State>({
    sort: [],
  });
  const [mainData2State, setMainData2State] = useState<State>({
    sort: [],
  });
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainData2Result, setMainData2Result] = useState<DataResult>(
    process([], mainData2State)
  );
  const [mainData3Result, setMainData3Result] = useState<DataResult>(
    process([], mainData3State)
  );
  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selected2State, setSelected2State] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selected3State, setSelected3State] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [subselectedState, setSubSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [mainPgNum, setMainPgNum] = useState(1);
  const [main2PgNum, setMain2PgNum] = useState(1);
  const [main3PgNum, setMain3PgNum] = useState(1);
  const [subPgNum, setSubPgNum] = useState(1);
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 Radio Group Change 함수 => 사용자가 선택한 라디오버튼 값을 조회 파라미터로 세팅
  const filterRadioChange = (e: any) => {
    const { name, value } = e;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 ComboBox Change 함수 => 사용자가 선택한 콤보박스 값을 조회 파라미터로 세팅
  const filterComboBoxChange = (e: any) => {
    const { name, value } = e;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    worktype: "LINE",
    orgdiv: "01",
    pgmgb: "A",
    resno: "admin",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_EA_A1000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LINE",
      "@p_orgdiv": filters.orgdiv,
      "@p_person": filters.resno,
      "@p_pgmgb": filters.pgmgb,
    },
  };

  const subparameters: Iparameters = {
    procedureName: "P_EA_A1000W_Q",
    pageNumber: subPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LOAD",
      "@p_orgdiv": filters.orgdiv,
      "@p_person": filters.resno,
      "@p_pgmgb": filters.pgmgb,
    },
  };

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
        };
      });

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });

      const totalRowCnt2 = data.tables[1].RowCount;
      const rows2 = data.tables[1].Rows;

      if (totalRowCnt2 > 0)
        setMainData2Result((prev) => {
          return {
            data: rows2,
            total: totalRowCnt2,
          };
        });

      const totalRowCnt3 = data.tables[2].RowCount;
      const rows3 = data.tables[2].Rows;

      if (totalRowCnt3 > 0)
        setMainData3Result((prev) => {
          return {
            data: rows3,
            total: totalRowCnt3,
          };
        });
    }
    setLoading(false);
  };

  const fetchSubGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", subparameters);
    } catch (error) {
      data = null;
    }
    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setSubDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
    }
    setLoading(false);
  };

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (
      customOptionData !== null &&
      isInitSearch === false &&
      permissions !== null
    ) {
      fetchMainGrid();
      fetchSubGrid();
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subPgNum]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMain2PgNum(1);
    setMain3PgNum(1);
    setSubPgNum(1);
    setMainDataResult(process([], mainDataState));
    setMainData2Result(process([], mainData2State));
    setMainData3Result(process([], mainData3State));
    setSubDataResult(process([], subDataState));
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setIfSelectFirstRow(true);
    setSelectedState(newSelectedState);
  };
  const onSelection2Change = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selected2State,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelected2State(newSelectedState);
  };
  const onSelection3Change = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selected3State,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelected3State(newSelectedState);
  };

  const onSubSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: subselectedState,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSubSelectedState(newSelectedState);
  };

  //엑셀 내보내기
  let _export: ExcelExport | null | undefined;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save();
    }
  };

  //스크롤 핸들러
  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onMain2ScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, main2PgNum, PAGE_SIZE))
      setMain2PgNum((prev) => prev + 1);
  };

  const onMainData2StateChange = (event: GridDataStateChangeEvent) => {
    setMainData2State(event.dataState);
  };

  const onMain3ScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, main3PgNum, PAGE_SIZE))
      setMain3PgNum((prev) => prev + 1);
  };

  const onMainData3StateChange = (event: GridDataStateChangeEvent) => {
    setMainData3State(event.dataState);
  };

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMain2SortChange = (e: any) => {
    setMainData2State((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMain3SortChange = (e: any) => {
    setMainData3State((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    try {
      if (
        filters.pgmgb == null ||
        filters.pgmgb == "" ||
        filters.pgmgb == undefined
      ) {
        throw findMessage(messagesData, "EA_A1000W_001");
      } else if (
        filters.resno == null ||
        filters.resno == "" ||
        filters.resno == undefined
      ) {
        throw findMessage(messagesData, "EA_A1000W_002");
      } else {
        resetAllGrid();
        fetchMainGrid();
        fetchSubGrid();
      }
    } catch (e) {
      alert(e);
    }
  };

  const onMainItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const onSubItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      DATA_ITEM_KEY2
    );
  };

  const onMain2ItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainData2Result,
      setMainData2Result,
      DATA_ITEM_KEY
    );
  };

  const onMain3ItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainData3Result,
      setMainData3Result,
      DATA_ITEM_KEY
    );
  };
  const enterEdit = (dataItem: any, field: string) => {
    if (field != "rowstatus") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              rowstatus: item.rowstatus === "N" ? "N" : "U",
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = mainDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
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

  const onAddClick = () => {
    const rows = subDataResult.data.filter((item) => item.chooses == true);
    if (rows.length == 0) {
      alert("반영할 결재자가 선택되지 않았습니다.");
      return false;
    } else {
      let isValid = true;
      rows.map((item) => {
        mainDataResult.data.map((items) => {
          if (item.user_id == items.resno) {
            isValid = false;
            return false;
          }
        });
      });

      if (!isValid) {
        alert("중복되는 유저가 있습니다.");
        return false;
      }

      var idx = mainDataResult.data.length;
      let counts = mainDataResult.total;
      rows.map((item) => {
        const newDataItem = {
          aftergb: "N",
          appgb: "S",
          appline: "",
          appseq: counts + 1,
          arbitragb: "N",
          dptcd: item.dptcd,
          insert_pc: pc,
          insert_time: "",
          insert_userid: item.user_id,
          userid: user_id,
          num: idx + 1,
          orgdiv: "01",
          person: filters.resno,
          pgmgb: "A",
          postcd: item.postcd,
          resno: item.user_id,
          vicargb: "N",
          vicarid: "",
          rowstatus: "N",
          form_id: "EA_A1000W",
          inEdit: undefined,
        };
        idx++;
        count++;
        counts++;
        setSelectedState({ [newDataItem.num]: true });
        setIfSelectFirstRow(false);
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, newDataItem],
            total: prev.total + 1,
          };
        });
        fetchSubGrid();
      });
    }
  };

  const onAddClick2 = () => {
    const rows = subDataResult.data.filter((item) => item.chooses == true);
    if (rows.length == 0) {
      alert("반영할 참조자가 선택되지 않았습니다.");
      return false;
    } else {
      let isValid = true;
      rows.map((item) => {
        mainData3Result.data.map((items) => {
          if (item.user_id == items.resno) {
            isValid = false;
            return false;
          }
        });
      });

      if (!isValid) {
        alert("중복되는 유저가 있습니다.");
        return false;
      }

      var idx = mainData3Result.data.length;
      let counts = mainDataResult.total;
      rows.map((item) => {
        const newDataItem = {
          aftergb: "N",
          appgb: "T",
          appline: "",
          appseq: counts + 1,
          arbitragb: "N",
          dptcd: item.dptcd,
          insert_pc: pc,
          insert_time: "",
          insert_userid: item.user_id,
          userid: user_id,
          num: idx + 1,
          orgdiv: "01",
          person: filters.resno,
          pgmgb: "A",
          postcd: item.postcd,
          resno: item.user_id,
          vicargb: "N",
          vicarid: "",
          rowstatus: "N",
          form_id: "EA_A1000W",
          inEdit: undefined,
        };
        idx++;
        count++;
        counts++;
        setSelected3State({ [newDataItem.num]: true });
        setIfSelectFirstRow(false);
        setMainData3Result((prev) => {
          return {
            data: [...prev.data, newDataItem],
            total: prev.total + 1,
          };
        });
        fetchSubGrid();
      });
    }
  };

  const onAddClick3 = () => {
    const rows = subDataResult.data.filter((item) => item.chooses == true);
    if (rows.length == 0) {
      alert("반영할 합의자가 선택되지 않았습니다.");
      return false;
    } else {
      let isValid = true;
      rows.map((item) => {
        mainDataResult.data.map((items) => {
          if (item.user_id == items.resno) {
            isValid = false;
            return false;
          }
        });
      });

      if (!isValid) {
        alert("중복되는 유저가 있습니다.");
        return false;
      }

      var idx = mainDataResult.data.length;
      let counts = mainDataResult.total;
      rows.map((item) => {
        const newDataItem = {
          aftergb: "N",
          appgb: "H",
          appline: "",
          appseq: counts + 1,
          arbitragb: "N",
          dptcd: item.dptcd,
          insert_pc: pc,
          insert_time: "",
          insert_userid: item.user_id,
          userid: user_id,
          num: idx + 1,
          orgdiv: "01",
          person: filters.resno,
          pgmgb: "A",
          postcd: item.postcd,
          resno: item.user_id,
          vicargb: "N",
          vicarid: "",
          rowstatus: "N",
          form_id: "EA_A1000W",
          inEdit: undefined,
        };
        idx++;
        count++;
        counts++;
        setSelectedState({ [newDataItem.num]: true });
        setIfSelectFirstRow(false);
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, newDataItem],
            total: prev.total + 1,
          };
        });
        fetchSubGrid();
      });
    }
  };

  const onAddClick4 = () => {
    const rows = subDataResult.data.filter((item) => item.chooses == true);
    if (rows.length == 0) {
      alert("반영할 시행자가 선택되지 않았습니다.");
      return false;
    } else {
      let isValid = true;
      rows.map((item) => {
        mainData2Result.data.map((items) => {
          if (item.user_id == items.resno) {
            isValid = false;
            return false;
          }
        });
      });

      if (!isValid) {
        alert("중복되는 유저가 있습니다.");
        return false;
      }

      var idx = mainData2Result.data.length;
      let counts = mainDataResult.total;
      rows.map((item) => {
        const newDataItem = {
          aftergb: "N",
          appgb: "J",
          appline: "",
          appseq: counts + 1,
          arbitragb: "N",
          dptcd: item.dptcd,
          insert_pc: pc,
          insert_time: "",
          insert_userid: item.user_id,
          userid: user_id,
          num: idx + 1,
          orgdiv: "01",
          person: filters.resno,
          pgmgb: "A",
          postcd: item.postcd,
          resno: item.user_id,
          vicargb: "N",
          vicarid: "",
          rowstatus: "N",
          form_id: "EA_A1000W",
          inEdit: undefined,
        };
        idx++;
        count++;
        counts++;
        setSelected2State({ [newDataItem.num]: true });
        setIfSelectFirstRow(false);
        setMainData2Result((prev) => {
          return {
            data: [...prev.data, newDataItem],
            total: prev.total + 1,
          };
        });
        fetchSubGrid();
      });
    }
  };

  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    orgdiv: "01",
    person: filters.resno,
    pgmgb: filters.pgmgb,
    postcd: "",
    resno: "",
    appgb: "",
    appseq: "",
    arbitragb: "",
    aftergb: "",
    vicargb: "",
    vicarid: "",
    appline: "",
    rowstatus_s: "",
    dptcd: "",
    userid: user_id,
    pc: pc,
    form_id: "EA_A1000W",
  });

  const para: Iparameters = {
    procedureName: "P_EA_A1000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "N",
      "@p_orgdiv": ParaData.orgdiv,
      "@p_person": ParaData.person,
      "@p_pgmgb": ParaData.pgmgb,
      "@p_postcd": ParaData.postcd,
      "@p_resno": ParaData.resno,
      "@p_appgb": ParaData.appgb,
      "@p_appseq": ParaData.appseq,
      "@p_arbitragb": ParaData.arbitragb,
      "@p_aftergb": ParaData.aftergb,
      "@p_vicargb": ParaData.vicargb,
      "@p_vicarid": ParaData.vicarid,
      "@p_appline": ParaData.appline,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_dptcd": ParaData.dptcd,
      "@p_userid": ParaData.userid,
      "@p_pc": ParaData.pc,
      "@p_form_id": ParaData.form_id,
    },
  };

  const onSaveClick = async () => {
    let isValid = true;

    if (mainDataResult.total != 0) {
      for (var i = count; i > 0; i--) {
        if (mainDataResult.data[mainDataResult.total - i].appseq == 0) {
          alert("결재순서를 입력해주세요.");
          isValid = false;
          return false;
        } else if (
          mainDataResult.data[mainDataResult.total - i].appline == ""
        ) {
          alert("결재라인을 선택해주세요.");
          isValid = false;
          return false;
        }
      }
    }

    if (!isValid) {
      return false;
    } else {
      let dataArr: TdataArr = {
        rowstatus_s: [],
        postcd: [],
        resno: [],
        appgb: [],
        appseq: [],
        arbitragb: [],
        aftergb: [],
        vicargb: [],
        vicarid: [],
        appline: [],
        dptcd: [],
      };

      mainDataResult.data.forEach((item: any, idx: number) => {
        const {
          postcd = "",
          resno = "",
          appgb = "",
          appseq = "",
          arbitragb = "",
          aftergb = "",
          vicargb = "",
          vicarid = "",
          appline = "",
          rowstatus = "",
          dptcd = "",
        } = item;
        dataArr.rowstatus_s.push(rowstatus);
        dataArr.postcd.push(postcd);
        dataArr.resno.push(resno);
        dataArr.appgb.push(appgb);
        dataArr.appseq.push(appseq);
        dataArr.arbitragb.push(
          arbitragb == true
            ? "Y"
            : arbitragb == false
            ? "N"
            : arbitragb == "Y"
            ? "Y"
            : "N"
        );
        dataArr.aftergb.push(aftergb);
        dataArr.vicargb.push(vicargb);
        dataArr.vicarid.push(vicarid);
        dataArr.appline.push(appline);
        dataArr.dptcd.push(dptcd);
      });
      mainData2Result.data.forEach((item: any, idx: number) => {
        const {
          postcd = "",
          resno = "",
          appgb = "",
          appseq = "",
          arbitragb = "",
          aftergb = "",
          vicargb = "",
          vicarid = "",
          appline = "",
          rowstatus = "",
          dptcd = "",
        } = item;
        dataArr.rowstatus_s.push(rowstatus);
        dataArr.postcd.push(postcd);
        dataArr.resno.push(resno);
        dataArr.appgb.push(appgb);
        dataArr.appseq.push(appseq);
        dataArr.arbitragb.push(
          arbitragb == true
            ? "Y"
            : arbitragb == false
            ? "N"
            : arbitragb == "Y"
            ? "Y"
            : "N"
        );
        dataArr.aftergb.push(aftergb);
        dataArr.vicargb.push(vicargb);
        dataArr.vicarid.push(vicarid);
        dataArr.appline.push(appline);
        dataArr.dptcd.push(dptcd);
      });
      mainData3Result.data.forEach((item: any, idx: number) => {
        const {
          postcd = "",
          resno = "",
          appgb = "",
          appseq = "",
          arbitragb = "",
          aftergb = "",
          vicargb = "",
          vicarid = "",
          appline = "",
          rowstatus = "",
          dptcd = "",
        } = item;
        dataArr.rowstatus_s.push(rowstatus);
        dataArr.postcd.push(postcd);
        dataArr.resno.push(resno);
        dataArr.appgb.push(appgb);
        dataArr.appseq.push(appseq);
        dataArr.arbitragb.push(
          arbitragb == true
            ? "Y"
            : arbitragb == false
            ? "N"
            : arbitragb == "Y"
            ? "Y"
            : "N"
        );
        dataArr.aftergb.push(aftergb);
        dataArr.vicargb.push(vicargb);
        dataArr.vicarid.push(vicarid);
        dataArr.appline.push(appline);
        dataArr.dptcd.push(dptcd);
      });
      deletedMainRows.forEach((item: any, idx: number) => {
        const {
          postcd = "",
          resno = "",
          appgb = "",
          appseq = "",
          arbitragb = "",
          aftergb = "",
          vicargb = "",
          vicarid = "",
          appline = "",
          rowstatus = "",
          dptcd = "",
        } = item;
        dataArr.rowstatus_s.push(rowstatus);
        dataArr.postcd.push(postcd);
        dataArr.resno.push(resno);
        dataArr.appgb.push(appgb);
        dataArr.appseq.push(appseq);
        dataArr.arbitragb.push(
          arbitragb == true
            ? "Y"
            : arbitragb == false
            ? "N"
            : arbitragb == "Y"
            ? "Y"
            : "N"
        );
        dataArr.aftergb.push(aftergb);
        dataArr.vicargb.push(vicargb);
        dataArr.vicarid.push(vicarid);
        dataArr.appline.push(appline);
        dataArr.dptcd.push(dptcd);
      });
      setParaData((prev) => ({
        ...prev,
        person: filters.resno,
        rowstatus_s: dataArr.rowstatus_s.join("|"),
        postcd: dataArr.postcd.join("|"),
        resno: dataArr.resno.join("|"),
        appgb: dataArr.appgb.join("|"),
        appseq: dataArr.appseq.join("|"),
        arbitragb: dataArr.arbitragb.join("|"),
        aftergb: dataArr.aftergb.join("|"),
        vicargb: dataArr.vicargb.join("|"),
        vicarid: dataArr.vicarid.join("|"),
        appline: dataArr.appline.join("|"),
        dptcd: dataArr.dptcd.join("|"),
      }));
    }
  };

  const fetchTodoGridSaved = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchMainGrid();
    } else {
      alert("결재자가 중복되어 저장할 수 없습니다.");
      fetchMainGrid();
    }
    fetchSubGrid();
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.rowstatus_s.length != 0) {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  const onDeleteClick = (e: any) => {
    let newData: any[] = [];

    mainDataResult.data.forEach((item: any, index: number) => {
      if (!selectedState[item[DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        deletedMainRows.push(newData2);
      }
    });

    setMainDataResult((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setMainDataState({});
  };

  const onDeleteClick2 = (e: any) => {
    let newData: any[] = [];

    mainData3Result.data.forEach((item: any, index: number) => {
      if (!selected3State[item[DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        deletedMainRows.push(newData2);
      }
    });

    setMainData3Result((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setMainData3State({});
  };

  const onDeleteClick3 = (e: any) => {
    let newData: any[] = [];

    mainData2Result.data.forEach((item: any, index: number) => {
      if (!selected2State[item[DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        deletedMainRows.push(newData2);
      }
    });

    setMainData2Result((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setMainData2State({});
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

  const onArrowsBtnClick = (para: TArrowBtnClick) => {
    const { direction, dataInfo } = para;
    const { DATA_ITEM_KEY, selectedState, dataResult, setDataResult } =
      dataInfo;
    const selectedField = Object.getOwnPropertyNames(selectedState)[0];

    const rowData = dataResult.data.find(
      (row) => row[DATA_ITEM_KEY] == selectedField
    );

    const rowIndex = dataResult.data.findIndex(
      (row) => row[DATA_ITEM_KEY] == selectedField
    );

    if (rowIndex === -1) {
      alert("이동시킬 행을 선택해주세요.");
      return false;
    }
    if (filters.resno == rowData.resno) {
      alert("작성자의 행은 이동 불가능합니다.");
      return false;
    }

    const newData = dataResult.data.map((item: any) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));
    let replaceData = 0;
    if (direction === "UP" && rowIndex != 0) {
      replaceData = dataResult.data[rowIndex - 1].appseq;
    } else {
      replaceData = dataResult.data[rowIndex + 1].appseq;
    }

    newData.splice(rowIndex, 1);
    newData.splice(rowIndex + (direction === "UP" ? -1 : 1), 0, rowData);
    if (direction === "UP" && rowIndex != 0) {
      const newDatas = newData.map((item) =>
        item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
          ? {
              ...item,
              appseq: replaceData,
              [EDIT_FIELD]: undefined,
            }
          : item[DATA_ITEM_KEY] === dataResult.data[rowIndex - 1].num
          ? {
              ...item,
              appseq: rowData.appseq,
              [EDIT_FIELD]: undefined,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setDataResult((prev: any) => {
        return {
          data: newDatas,
          total: prev.total,
        };
      });
    } else {
      const newDatas = newData.map((item) =>
        item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
          ? {
              ...item,
              appseq: replaceData,
              [EDIT_FIELD]: undefined,
            }
          : item[DATA_ITEM_KEY] === dataResult.data[rowIndex + 1].num
          ? {
              ...item,
              appseq: rowData.appseq,
              [EDIT_FIELD]: undefined,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setDataResult((prev: any) => {
        return {
          data: newDatas,
          total: prev.total,
        };
      });
    }
  };

  const arrowBtnClickPara = {
    DATA_ITEM_KEY: DATA_ITEM_KEY,
    selectedState: selectedState,
    dataResult: mainDataResult,
    setDataResult: setMainDataResult,
  };

    //메인 그리드 데이터 변경 되었을 때
    useEffect(() => {
      if (ifSelectFirstRow) {
        if (mainDataResult.total > 0) {
          const firstRowData = mainDataResult.data[0];
          setSelectedState({ [firstRowData.num]: true });
  
          setIfSelectFirstRow(true);
        }
      }
    }, [mainDataResult]);

    useEffect(() => {
      if (ifSelectFirstRow) {
        if (mainData3Result.total > 0) {
          const firstRowData = mainData3Result.data[0];
          setSelected3State({ [firstRowData.num]: true });
  
          setIfSelectFirstRow(true);
        }
      }
    }, [mainData3Result]);

    useEffect(() => {
      if (ifSelectFirstRow) {
        if (mainData2Result.total > 0) {
          const firstRowData = mainData2Result.data[0];
          setSelected2State({ [firstRowData.num]: true });
  
          setIfSelectFirstRow(true);
        }
      }
    }, [mainData2Result]);
  return (
    <>
      <TitleContainer>
        <Title>결재라인지정</Title>

        <ButtonContainer>
          {permissions && (
            <>
              <TopButtons
                search={search}
                exportExcel={exportExcel}
                permissions={permissions}
              />
            </>
          )}
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>프로그램구분</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="pgmgb"
                    value={filters.pgmgb}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    className="required"
                  />
                )}
              </td>
              <th>작성자</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="resno"
                    value={filters.resno}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    textField="user_name"
                    valueField="user_id"
                    className="required"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainerWrap
        style={{
          display: "inline-block",
          float: "left",
          marginRight: "1%",
          width: "35%",
        }}
      >
        <GridContainer>
          <GridTitleContainer>
            <GridTitle>참조</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onAddClick}
                fillMode="outline"
                themeColor={"primary"}
              >
                결재
              </Button>
              <Button
                onClick={onAddClick2}
                fillMode="outline"
                themeColor={"primary"}
              >
                참조
              </Button>
              <Button
                onClick={onAddClick3}
                fillMode="outline"
                themeColor={"primary"}
              >
                합의
              </Button>
              <Button
                onClick={onAddClick4}
                fillMode="outline"
                themeColor={"primary"}
              >
                시행
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            data={process(
              subDataResult.data.map((row) => ({
                ...row,
                dptcd: dptcdListData.find(
                  (item: any) => item.dptcd === row.dptcd
                )?.dptnm,
                postcd: postcdListData.find(
                  (item: any) => item.sub_code === row.postcd
                )?.code_name,
                [SELECTED_FIELD]: subselectedState[idGetter2(row)],
              })),
              subDataState
            )}
            {...subDataState}
            onDataStateChange={onSubDataStateChange}
            //선택 기능
            dataItemKey={DATA_ITEM_KEY2}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            style={{ height: "78vh" }}
            onSelectionChange={onSubSelectionChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={subDataResult.total}
            onScroll={onSubScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onSubSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            onItemChange={onSubItemChange}
          >
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdList"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      editable={
                        editableField.includes(item.fieldName) ? false : true
                      }
                      className={
                        requiredField.includes(item.fieldName)
                          ? "required"
                          : undefined
                      }
                      cell={
                        checkboxField.includes(item.fieldName)
                          ? CheckBoxCell
                          : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </GridContainer>
      </GridContainerWrap>
      <GridContainerWrap style={{ display: "inline-block" }}>
        <GridContainer>
          <ExcelExport
            data={mainDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridTitleContainer>
              <GridTitle>결재라인</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onDeleteClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                ></Button>
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
                  onClick={onSaveClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="save"
                >
                  저장
                </Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  dptcd: dptcdListData.find(
                    (item: any) => item.dptcd === row.dptcd
                  )?.dptnm,
                  postcd: postcdListData.find(
                    (item: any) => item.sub_code === row.postcd
                  )?.code_name,
                  resno: resnoListData.find(
                    (item: any) => item.user_id === row.resno
                  )?.user_name,
                  appgb: appgbListData.find(
                    (item: any) => item.sub_code === row.appgb
                  )?.code_name,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selectedState[idGetter(row)],
                })),
                mainDataState
              )}
              {...mainDataState}
              style={{ height: "44vh" }}
              onDataStateChange={onMainDataStateChange}
              //선택 기능
              dataItemKey={DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onSelectionChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={mainDataResult.total}
              onScroll={onMainScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onMainSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //incell 수정 기능
              onItemChange={onMainItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn field="rowstatus" title=" " width="50px" />
              {customOptionData !== null &&
                customOptionData.menuCustomColumnOptions["grdList2"].map(
                  (item: any, idx: number) =>
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        headerCell={
                          headerField.includes(item.fieldName)
                            ? RequiredHeader
                            : undefined
                        }
                        editable={
                          editableField.includes(item.fieldName) ? false : true
                        }
                        className={
                          requiredField.includes(item.fieldName)
                            ? "required"
                            : undefined
                        }
                        cell={
                          checkboxField.includes(item.fieldName)
                            ? CheckBoxCell
                            : numberField.includes(item.fieldName)
                            ? NumberCell
                            : customField.includes(item.fieldName)
                            ? CustomComboBoxCell
                            : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </ExcelExport>
        </GridContainer>
        <GridContainerWrap>
          <GridContainer width={`55%`}>
            <GridTitleContainer>
              <GridTitle>참조자</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onDeleteClick2}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                ></Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              data={process(
                mainData3Result.data.map((row) => ({
                  ...row,
                  postcd: postcdListData.find(
                    (item: any) => item.sub_code === row.postcd
                  )?.code_name,
                  resno: resnoListData.find(
                    (item: any) => item.user_id === row.resno
                  )?.user_name,
                  appgb: appgbListData.find(
                    (item: any) => item.sub_code === row.appgb
                  )?.code_name,
                  dptcd: dptcdListData.find(
                    (item: any) => item.dptcd === row.dptcd
                  )?.dptnm,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selected3State[idGetter(row)],
                })),
                mainData3State
              )}
              {...mainData3State}
              style={{ height: "30vh" }}
              onDataStateChange={onMainData3StateChange}
              //선택 기능
              dataItemKey={DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onSelection3Change}
              //스크롤 조회 기능
              fixedScroll={true}
              total={mainData3Result.total}
              onScroll={onMain3ScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onMain3SortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //incell 수정 기능
              onItemChange={onMain3ItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn field="rowstatus" title=" " width="50px" />
              {customOptionData !== null &&
                customOptionData.menuCustomColumnOptions["grdList3"].map(
                  (item: any, idx: number) =>
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        editable={
                          editableField.includes(item.fieldName) ? false : true
                        }
                      />
                    )
                )}
            </Grid>
          </GridContainer>
          <GridContainer width={`calc(45% - ${GAP}px)`}>
            <GridTitleContainer>
              <GridTitle>시행자</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onDeleteClick3}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                ></Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              data={process(
                mainData2Result.data.map((row) => ({
                  ...row,
                  postcd: postcdListData.find(
                    (item: any) => item.sub_code === row.postcd
                  )?.code_name,
                  resno: resnoListData.find(
                    (item: any) => item.user_id === row.resno
                  )?.user_name,
                  appgb: appgbListData.find(
                    (item: any) => item.sub_code === row.appgb
                  )?.code_name,
                  dptcd: dptcdListData.find(
                    (item: any) => item.dptcd === row.dptcd
                  )?.dptnm,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selected2State[idGetter(row)],
                })),
                mainData2State
              )}
              {...mainData2State}
              style={{ height: "30vh" }}
              onDataStateChange={onMainData2StateChange}
              //선택 기능
              dataItemKey={DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onSelection2Change}
              //스크롤 조회 기능
              fixedScroll={true}
              total={mainData2Result.total}
              onScroll={onMain2ScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onMain2SortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //incell 수정 기능
              onItemChange={onMain2ItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn field="rowstatus" title=" " width="50px" />
              {customOptionData !== null &&
                customOptionData.menuCustomColumnOptions["grdList4"].map(
                  (item: any, idx: number) =>
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        editable={
                          editableField.includes(item.fieldName) ? false : true
                        }
                      />
                    )
                )}
            </Grid>
          </GridContainer>
        </GridContainerWrap>
      </GridContainerWrap>
      {gridList.map((grid: any) =>
        grid.columns.map((column: any) => (
          <div
            key={column.id}
            id={column.id}
            data-grid-name={grid.gridName}
            data-field={column.field}
            data-caption={column.caption}
            data-width={column.width}
            hidden
          />
        ))
      )}
    </>
  );
};

export default EA_A1000;
