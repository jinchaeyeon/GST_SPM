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
  GridItemChangeEvent,
  GridCellProps,
} from "@progress/kendo-react-grid";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import CopyWindow from "../components/Windows/BA_A0050W_Copy_Window";
import CopyWindow2 from "../components/Windows/CommonWindows/PatternWindow";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  GridContainer,
  GridTitle,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
  ButtonInInput,
  ButtonInFieldWrap,
  ButtonInField,
  FormBox,
  FormBoxWrap,
  GridContainerWrap,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import { gridList } from "../store/columns/BA_A0050W_C";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import {
  chkScrollHandler,
  convertDateToStr,
  findMessage,
  getQueryFromBizComponent,
  setDefaultDate,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  handleKeyPressSearch,
  getGridItemChangedData,
  dateformat,
  UseParaPc,
  dateformat2,
  UseGetValueFromSessionItem,
  getCodeFromValue,
  getSelectedFirstData,
  useSysMessage,
} from "../components/CommonFunction";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  GAP,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import CheckBoxCell from "../components/Cells/CheckBoxCell";

const DATA_ITEM_KEY = "itemcd";
const SUB_DATA_ITEM_KEY = "num";
const SUB_DATA_ITEM_KEY2 = "sub_code";
let deletedMainRows: object[] = [];

const CustomComboField = [
  "proccd",
  "outprocyn",
  "prodemp",
  "qtyunit",
  "procunit",
];

const NumberField = ["procseq", "unitqty", "procqty"];
const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  // 사용자구분, 사업장, 사업부, 부서코드, 직위, 공개범위
  UseBizComponent(
    "L_PR010,L_BA011,L_sysUserMaster_001,L_BA015",
    setBizComponentData
  );

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "proccd"
      ? "L_PR010"
      : field === "outprocyn"
      ? "L_BA011"
      : field === "prodemp"
      ? "L_sysUserMaster_001"
      : field === "qtyunit"
      ? "L_BA015"
      : field === "procunit"
      ? "L_BA015"
      : "";

  const fieldName = field === "prodemp" ? "user_name" : undefined;
  const filedValue = field === "prodemp" ? "user_id" : undefined;
  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell
      bizComponent={bizComponent}
      textField={fieldName}
      valueField={filedValue}
      {...props}
    />
  ) : (
    <td />
  );
};

const BA_A0050: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY2);
  const idGetter3 = getter(SUB_DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");
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
        raduseyn: defaultOption.find((item: any) => item.id === "raduseyn")
          .valueCode,
        itemacnt: defaultOption.find((item: any) => item.id === "itemacnt")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA061,L_BA015, R_USEYN,L_BA171,L_BA172,L_BA173,R_YESNOALL,L_PR010,L_sysUserMaster_001",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  useEffect(() => {
    if (bizComponentData !== null) {
    }
  }, [bizComponentData]);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });

  const [subData2State, setSubData2State] = useState<State>({
    sort: [],
  });

  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [subData2Result, setSubData2Result] = useState<DataResult>(
    process([], subData2State)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubData2State, setSelectedsubData2State] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);
  const [CopyWindowVisible, setCopyWindowVisible] = useState<boolean>(false);
  const [CopyWindowVisible2, setCopyWindowVisible2] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [subPgNum, setSub2PgNum] = useState(1);
  const [sub2PgNum, setSubPgNum] = useState(1);

  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);
  const [ifSelectFirstRow2, setIfSelectFirstRow2] = useState(true);
  const [ifSelectFirstRow3, setIfSelectFirstRow3] = useState(true);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const InputChange = (e: any) => {
    const { value, name } = e.target;
    setsubFilters((prev) => ({
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
    workType: "ITEM",
    orgdiv: "01",
    itemcd: "",
    itemnm: "",
    insiz: "",
    itemacnt: "",
    raduseyn: "Y",
    proccd: "",
    row_values: null,
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_BA_A0050W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_itemacnt": filters.itemacnt,
      "@p_useyn": filters.raduseyn,
      "@p_proccd": filters.proccd,
      "@p_company_code": "2207A046",
      "@p_find_row_value": filters.row_values,
    },
  };

  const [subfilters, setsubFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "PROCCD",
    orgdiv: "01",
    itemcd: "",
    itemnm: "",
    insiz: "",
    itemacnt: "",
    raduseyn: "Y",
    proccd: "",
    row_values: null,
  });

  //조회조건 파라미터
  const subparameters: Iparameters = {
    procedureName: "P_BA_A0050W_Q",
    pageNumber: subPgNum,
    pageSize: subfilters.pgSize,
    parameters: {
      "@p_work_type": subfilters.workType,
      "@p_orgdiv": subfilters.orgdiv,
      "@p_itemcd": subfilters.itemcd,
      "@p_itemnm": subfilters.itemnm,
      "@p_insiz": subfilters.insiz,
      "@p_itemacnt": subfilters.itemacnt,
      "@p_useyn": subfilters.raduseyn,
      "@p_proccd": subfilters.proccd,
      "@p_company_code": "2207A046",
      "@p_find_row_value": subfilters.row_values,
    },
  };

  const [subfilters2, setsubFilters2] = useState({
    pgSize: PAGE_SIZE,
    workType: "BOM",
    orgdiv: "01",
    itemcd: "###1234",
    itemnm: "",
    insiz: "",
    itemacnt: "",
    raduseyn: filters.raduseyn,
    proccd: "",
    row_values: null,
  });

  const subparameters2: Iparameters = {
    procedureName: "P_BA_A0050W_Q",
    pageNumber: sub2PgNum,
    pageSize: subfilters2.pgSize,
    parameters: {
      "@p_work_type": subfilters2.workType,
      "@p_orgdiv": subfilters2.orgdiv,
      "@p_itemcd": subfilters2.itemcd,
      "@p_itemnm": subfilters2.itemnm,
      "@p_insiz": subfilters2.insiz,
      "@p_itemacnt": subfilters2.itemacnt,
      "@p_useyn": subfilters2.raduseyn,
      "@p_proccd": subfilters2.proccd,
      "@p_company_code": "2207A046",
      "@p_find_row_value": subfilters2.row_values,
    },
  };

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    //if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchSubGrid = async () => {
    //if (!permissions?.view) return;
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
      const row = rows.map((item: any) => ({
        ...item,
      }));

      if (totalRowCnt > 0) {
        setSubData2Result((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };
  const fetchSubGrid2 = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", subparameters2);
    } catch (error) {
      data = null;
    }
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setSubDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
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
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    fetchSubGrid();
  }, [subPgNum]);

  useEffect(() => {
    fetchSubGrid2();
  }, [sub2PgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.itemcd]: true });

        setsubFilters2((prev) => ({
          ...prev,
          itemcd: firstRowData.itemcd,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow2) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
        setSelectedsubDataState({ [firstRowData.num]: true });

        setIfSelectFirstRow2(true);
      }
    }
  }, [subDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow3) {
      if (subData2Result.total > 0) {
        const firstRowData = subData2Result.data[0];
        setSelectedsubData2State({ [firstRowData.sub_code]: true });

        setIfSelectFirstRow3(false);
      }
    }
  }, [subData2Result]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subfilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid2();
    }
  }, [subfilters2]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subPgNum]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setSub2PgNum(1);
    setSubData2Result(process([], subData2State));
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    setsubFilters2((prev) => ({
      ...prev,
      itemcd: selectedRowData.itemcd,
    }));
    setIfSelectFirstRow(true);
    setIfSelectFirstRow2(true);
  };

  const onSubDataSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });
    setSelectedsubDataState(newSelectedState);
  };

  const onSubData2SelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubData2State,
      dataItemKey: SUB_DATA_ITEM_KEY2,
    });

    setSelectedsubData2State(newSelectedState);
    let seq = 1;
    let proseq = 1;
    if (subDataResult.total > 0) {
      subDataResult.data.forEach((item) => {
        if (item[SUB_DATA_ITEM_KEY] > seq) {
          seq = item[SUB_DATA_ITEM_KEY];
        }
        if (item.procseq >= proseq) {
          proseq = item.procseq + 1;
        }
      });
      seq++;
    }
    setIfSelectFirstRow2(false)
    const newDataItem = {
      [SUB_DATA_ITEM_KEY]: seq,
      chlditemcd: "",
      chlditemnm: "",
      custcd: "",
      custnm: "",
      orgdiv: "01",
      outgb: "",
      outprocyn: "",
      prntitemcd: Object.getOwnPropertyNames(selectedState)[0],
      proccd: Object.getOwnPropertyNames(newSelectedState)[0],
      procitemcd: Object.getOwnPropertyNames(selectedState)[0],
      procqty: 1,
      procseq: proseq,
      procunit: "",
      prodemp: "",
      prodmac: "",
      qtyunit: "",
      recdt: "",
      remark: "",
      seq: 0,
      unitqty: 0,
      rowstatus: "N",
    };
    setSelectedsubDataState({ [newDataItem.num]: true });
 
    setSubDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
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
      setIfSelectFirstRow(false);
  };

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onSub2ScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, sub2PgNum, PAGE_SIZE))
      setSub2PgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  const onSubData2StateChange = (event: GridDataStateChangeEvent) => {
    setSubData2State(event.dataState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const sub2TotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subData2Result.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };

  interface IItemData {
    itemcd: string;
    itemno: string;
    itemnm: string;
    insiz: string;
    model: string;
    itemacnt: string;
    itemacntnm: string;
    bnatur: string;
    spec: string;
    invunit: string;
    invunitnm: string;
    unitwgt: string;
    wgtunit: string;
    wgtunitnm: string;
    maker: string;
    dwgno: string;
    remark: string;
    itemlvl1: string;
    itemlvl2: string;
    itemlvl3: string;
    extra_field1: string;
    extra_field2: string;
    extra_field7: string;
    extra_field6: string;
    extra_field8: string;
    packingsiz: string;
    unitqty: string;
    color: string;
    gubun: string;
    qcyn: string;
    outside: string;
    itemthick: string;
    itemlvl4: string;
    itemlvl5: string;
    custitemnm: string;
  }

  type TdataArr = {
    rowstatus_s: String[];
    seq_s: String[];
    chlditemcd_s: String[];
    procitemcd_s: String[];
    recdt_s: String[];
    proccd_s: String[];
    prodemp_s: String[];
    prodmac_s: String[];
    outprocyn_s: String[];
    unitqty_s: String[];
    qtyunit_s: String[];
    outgb_s: String[];
    remark_s: String[];
    procqty_s: String[];
    procunit_s: String[];
    custcd_s: String[];
    custnm_s: String[];
    procseq_s: String[];
  };

  //품목마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubDataSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubData2SortChange = (e: any) => {
    setSubData2State((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
    fetchSubGrid();
    fetchSubGrid2();
  };

  const onSubItemChange = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      SUB_DATA_ITEM_KEY
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    if (field != "rowstatus") {
      const newData = subDataResult.data.map((item) =>
        item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
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

      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = subDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setSubDataResult((prev) => {
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
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick2 = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }

    let newData: any[] = [];

    subDataResult.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState[item[SUB_DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };

        deletedMainRows.push(newData2);
      }
    });
    setSubDataResult((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setSubData2State({});
  };

  const [paraData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    prntitemcd: "",
    rowstatus_s: "",
    seq_s: "",
    chlditemcd_s: "",
    procitemcd_s: "",
    recdt_s: "",
    proccd_s: "",
    prodemp_s: "",
    prodmac_s: "",
    outprocyn_s: "",
    unitqty_s: "",
    qtyunit_s: "",
    outgb_s: "",
    remark_s: "",
    procqty_s: "",
    procunit_s: "",
    custcd_s: "",
    custnm_s: "",
    procseq_s: "",
    userid: userId,
    pc: pc,
    form_id: "BA_A0050W",
    company_code: "2207A046",
  });

  const [paraData2, setParaData2] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    prntitemcd: "",
    itemcd_s: "",
    userid: userId,
    pc: pc,
    form_id: "BA_A0050W_Sub1",
    company_code: "2207A046",
  });

  const para2: Iparameters = {
    procedureName: "P_BA_A0050W_Sub1_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData2.workType,
      "@p_orgdiv": paraData2.orgdiv,
      "@p_prntitemcd": paraData2.prntitemcd,
      "@p_itemcd_s": paraData2.itemcd_s,
      "@p_userid": paraData2.userid,
      "@p_pc": paraData2.pc,
      "@p_form_id": paraData2.form_id,
      "@p_company_code": paraData2.company_code,
    },
  };

  const para: Iparameters = {
    procedureName: "P_BA_A0050W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.workType,
      "@p_orgdiv": paraData.orgdiv,
      "@p_prntitemcd": paraData.prntitemcd,
      "@p_rowstatus_s": paraData.rowstatus_s,
      "@p_seq_s": paraData.seq_s,
      "@p_chlditemcd_s": paraData.chlditemcd_s,
      "@p_procitemcd_s": paraData.procitemcd_s,
      "@p_recdt_s": paraData.recdt_s,
      "@p_proccd_s": paraData.proccd_s,
      "@p_prodemp_s": paraData.prodemp_s,
      "@p_prodmac_s": paraData.prodmac_s,
      "@p_outprocyn_s": paraData.outprocyn_s,
      "@p_unitqty_s": paraData.unitqty_s,
      "@p_qtyunit_s": paraData.qtyunit_s,
      "@p_outgb_s": paraData.outgb_s,
      "@p_remark_s": paraData.remark_s,
      "@p_procqty_s": paraData.procqty_s,
      "@p_procunit_s": paraData.procunit_s,
      "@p_custcd_s": paraData.custcd_s,
      "@p_custnm_s": paraData.custnm_s,
      "@p_procseq_s": paraData.procseq_s,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
      "@p_form_id": paraData.form_id,
      "@p_company_code": paraData.company_code,
    },
  };

  const onSaveClick = async () => {
    const dataItem = subDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0 && deletedMainRows.length === 0) return false;
    let dataArr: TdataArr = {
      rowstatus_s: [],
      seq_s: [],
      chlditemcd_s: [],
      procitemcd_s: [],
      recdt_s: [],
      proccd_s: [],
      prodemp_s: [],
      prodmac_s: [],
      outprocyn_s: [],
      unitqty_s: [],
      qtyunit_s: [],
      outgb_s: [],
      remark_s: [],
      procqty_s: [],
      procunit_s: [],
      custcd_s: [],
      custnm_s: [],
      procseq_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        seq = "",
        chlditemcd = "",
        procitemcd = "",
        recdt = "",
        proccd = "",
        prodemp = "",
        prodmac = "",
        outprocyn = "",
        unitqty = "",
        qtyunit = "",
        outgb = "",
        remark = "",
        procqty = "",
        procunit = "",
        custcd = "",
        custnm = "",
        procseq = "",
      } = item;
      dataArr.rowstatus_s.push(rowstatus);
      dataArr.seq_s.push(seq);
      dataArr.chlditemcd_s.push(chlditemcd);
      dataArr.procitemcd_s.push(procitemcd);
      dataArr.recdt_s.push(recdt);
      dataArr.proccd_s.push(proccd);
      dataArr.prodemp_s.push(getCodeFromValue(prodemp));
      dataArr.prodmac_s.push(prodmac);
      dataArr.outprocyn_s.push(outprocyn);
      dataArr.unitqty_s.push(unitqty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.outgb_s.push(outgb);
      dataArr.remark_s.push(remark);
      dataArr.procqty_s.push(procqty);
      dataArr.procunit_s.push(procunit);
      dataArr.custcd_s.push(custcd);
      dataArr.custnm_s.push(custnm);
      dataArr.procseq_s.push(procseq);
    });
    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        seq = "",
        chlditemcd = "",
        procitemcd = "",
        recdt = "",
        proccd = "",
        prodemp = "",
        prodmac = "",
        outprocyn = "",
        unitqty = "",
        qtyunit = "",
        outgb = "",
        remark = "",
        procqty = "",
        procunit = "",
        custcd = "",
        custnm = "",
        procseq = "",
      } = item;
      dataArr.rowstatus_s.push(rowstatus);
      dataArr.seq_s.push(seq);
      dataArr.chlditemcd_s.push(chlditemcd);
      dataArr.procitemcd_s.push(procitemcd);
      dataArr.recdt_s.push(recdt);
      dataArr.proccd_s.push(proccd);
      dataArr.prodemp_s.push(getCodeFromValue(prodemp));
      dataArr.prodmac_s.push(prodmac);
      dataArr.outprocyn_s.push(outprocyn);
      dataArr.unitqty_s.push(unitqty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.outgb_s.push(outgb);
      dataArr.remark_s.push(remark);
      dataArr.procqty_s.push(procqty);
      dataArr.procunit_s.push(procunit);
      dataArr.custcd_s.push(custcd);
      dataArr.custnm_s.push(custnm);
      dataArr.procseq_s.push(procseq);
    });

    setParaData((prev) => ({
      ...prev,
      prntitemcd: Object.getOwnPropertyNames(selectedState)[0],
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      seq_s: dataArr.seq_s.join("|"),
      chlditemcd_s: dataArr.chlditemcd_s.join("|"),
      procitemcd_s: dataArr.procitemcd_s.join("|"),
      recdt_s: dataArr.recdt_s.join("|"),
      proccd_s: dataArr.proccd_s.join("|"),
      prodemp_s: dataArr.prodemp_s.join("|"),
      prodmac_s: dataArr.prodmac_s.join("|"),
      outprocyn_s: dataArr.outprocyn_s.join("|"),
      unitqty_s: dataArr.unitqty_s.join("|"),
      qtyunit_s: dataArr.qtyunit_s.join("|"),
      outgb_s: dataArr.outgb_s.join("|"),
      remark_s: dataArr.remark_s.join("|"),
      procqty_s: dataArr.procqty_s.join("|"),
      procunit_s: dataArr.procunit_s.join("|"),
      custcd_s: dataArr.custcd_s.join("|"),
      custnm_s: dataArr.custnm_s.join("|"),
      procseq_s: dataArr.procseq_s.join("|"),
    }));
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
      setSubPgNum(1);
      setSubDataResult(process([], subData2State));

      fetchSubGrid2();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchTodoGridSaved2 = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para2);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setParaData2((prev) => ({
        ...prev,
        itemcd_s: "",
      }));
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.prntitemcd != "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);

  useEffect(() => {
    if (paraData2.itemcd_s != "") {
      fetchTodoGridSaved2();
    }
  }, [paraData2]);

  const onCopyEditClick = () => {
    //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
    setCopyWindowVisible(true);
  };

  const onCopyEditClick2 = () => {
    //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
    setCopyWindowVisible2(true);
  };

  const reloadData = (data: any, itemcd: any) => {
    if (data.length === 0) return false;
    let dataArr: any = {
      itemcd_s: [],
    };

    data.forEach((item: any, idx: number) => {
      const { itemcd = "" } = item;
      dataArr.itemcd_s.push(itemcd);
    });

    setParaData2((prev) => ({
      ...prev,
      prntitemcd: itemcd,
      itemcd_s: dataArr.itemcd_s.join("|"),
    }));
  };

  const reloadData2 = (data: any) => {
    for (var i = 0; i < data.length; i++) {
      let seq = 1;
      if (subDataResult.total > 0) {
        subDataResult.data.forEach((item) => {
          if (item[SUB_DATA_ITEM_KEY] > seq) {
            seq = item[SUB_DATA_ITEM_KEY];
          }
        });
        seq++;
      }

      const newDataItem = {
        [SUB_DATA_ITEM_KEY]: seq,
        chlditemcd: "",
        chlditemnm: "",
        custcd: "",
        custnm: "",
        orgdiv: "01",
        outgb: "",
        outprocyn: data[i].outprocyn,
        prntitemcd: Object.getOwnPropertyNames(selectedState)[0],
        proccd: data[i].proccd,
        procitemcd: Object.getOwnPropertyNames(selectedState)[0],
        procqty: 1,
        procseq: data[i].procseq,
        procunit: "",
        prodemp: "",
        prodmac: "",
        qtyunit: "",
        recdt: "",
        remark: "",
        seq: 0,
        unitqty: 0,
        rowstatus: "N",
      };

      setSubDataResult((prev) => {
        return {
          data: [...prev.data, newDataItem],
          total: prev.total + 1,
        };
      });
    }
  };

  interface IProccdData {
    proccd: string;
    procseq: string;
    outprocyn: string;
    remark: string;
  }
  return (
    <>
      <TitleContainer>
        <Title>BOM관리</Title>

        <ButtonContainer>
          {permissions && (
            <TopButtons
              search={search}
              exportExcel={exportExcel}
              permissions={permissions}
            />
          )}
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>품목코드</th>
              <td>
                <Input
                  name="itemcd"
                  type="text"
                  value={filters.itemcd}
                  onChange={filterInputChange}
                />
                <ButtonInInput>
                  <Button
                    onClick={onItemWndClick}
                    icon="more-horizontal"
                    fillMode="flat"
                  />
                </ButtonInInput>
              </td>
              <th>품목명</th>
              <td>
                <Input
                  name="itemnm"
                  type="text"
                  value={filters.itemnm}
                  onChange={filterInputChange}
                />
              </td>
              <th>품목계정</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="itemacnt"
                    value={filters.itemacnt}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>BOM 유무</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="raduseyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
              <th>규격</th>
              <td>
                <Input
                  name="insiz"
                  type="text"
                  value={filters.insiz}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainerWrap>
        <GridContainer width={`21%`}>
          <GridTitleContainer>
            <GridTitle>BOM구성정보</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: "77vh" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState[idGetter(row)],
              })),
              mainDataState
            )}
            {...mainDataState}
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
          >
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdList"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      id={item.id}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      footerCell={
                        item.sortOrder === 0 ? mainTotalFooterCell : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(21% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>공정리스트</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap>
            <FormBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>공정</th>
                  <td>
                    <Input
                      name="proccd"
                      type="text"
                      value={subfilters.proccd}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <Grid
            style={{ height: "69.5vh" }}
            data={process(
              subData2Result.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedsubData2State[idGetter2(row)],
              })),
              subData2State
            )}
            {...subData2State}
            onDataStateChange={onSubData2StateChange}
            //선택 기능
            dataItemKey={SUB_DATA_ITEM_KEY2}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "multiple",
            }}
            onSelectionChange={onSubData2SelectionChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={subData2Result.total}
            onScroll={onSub2ScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onSubData2SortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
          >
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdList2"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      id={item.id}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      footerCell={
                        item.sortOrder === 0 ? sub2TotalFooterCell : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(58% - ${GAP}px)`}>
          <ExcelExport
            data={subDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridTitleContainer>
              <GridTitle>BOM 상세</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onCopyEditClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="save"
                >
                  BOM복사
                </Button>
                <Button
                  onClick={onCopyEditClick2}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="save"
                >
                  패턴공정도 참조
                </Button>
                <Button
                  onClick={onSaveClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="save"
                >
                  저장
                </Button>
                <Button
                  onClick={onDeleteClick2}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="delete"
                >
                  삭제
                </Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "77vh" }}
              data={process(
                subDataResult.data.map((row) => ({
                  ...row,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selectedsubDataState[idGetter3(row)],
                })),
                subDataState
              )}
              {...subDataState}
              onDataStateChange={onSubDataStateChange}
              //선택 기능
              dataItemKey={SUB_DATA_ITEM_KEY2}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "multiple",
              }}
              onSelectionChange={onSubDataSelectionChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={subDataResult.total}
              onScroll={onSubScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onSubDataSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              onItemChange={onSubItemChange}
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
                        id={item.id}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        cell={
                          CustomComboField.includes(item.fieldName)
                            ? CustomComboBoxCell
                            : NumberField.includes(item.fieldName)
                            ? NumberCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0 ? subTotalFooterCell : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </ExcelExport>
        </GridContainer>
      </GridContainerWrap>
      {itemWindowVisible && (
        <ItemsWindow
          setVisible={setItemWindowVisible}
          workType={"FILTER"}
          setData={setItemData}
        />
      )}

      {CopyWindowVisible && (
        <CopyWindow
          getVisible={setCopyWindowVisible}
          para={getSelectedFirstData(
            selectedState,
            mainDataResult.data,
            DATA_ITEM_KEY
          )}
          setData={reloadData}
        />
      )}

      {CopyWindowVisible2 && (
        <CopyWindow2
          getVisible={setCopyWindowVisible2}
          para={getSelectedFirstData(
            selectedsubDataState,
            subDataResult.data,
            SUB_DATA_ITEM_KEY
          )}
          setData={reloadData2}
        />
      )}
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

export default BA_A0050;
