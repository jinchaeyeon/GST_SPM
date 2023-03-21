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
} from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import calculateSize from "calculate-size";
import { gridList } from "../store/columns/MA_A2500W_C";
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
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
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
  UseParaPc,
  toDate,
  UseGetValueFromSessionItem,
  useSysMessage,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/MA_A2500W_Window";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

const DATA_ITEM_KEY = "num";
const DETAIL_DATA_ITEM_KEY = "num";
const dateField = ["purdt", "indt"];
const numberField = [
  "inqty",
  "amt",
  "wonamt",
  "taxamt",
  "totamt",
  "qty",
  "totwgt",
  "unp",
];
type TdataArr = {
  rowstatus_s: string[];
  recdt_s: string[];
  seq1_s: string[];
  seq2_s: string[];
  itemcd_s: string[];
  itemacnt_s: string[];
  qty_s: string[];
  qtyunit_s: string[];
  purnum_s: string[];
  purseq_s: string[];
  planno_s: string[];
  planseq_s: string[];
  totwgt_s: string[];
  wgtunit_s: string[];
  unpcalmeth_s: string[];
  unp_s: string[];
  amt_s: string[];
  wonamt_s: string[];
  taxamt_s: string[];
  remark_s: string[];
  num_s: string[];
  findkey_s: string[];
  div_s: string[];
  outrecdt_s: string[];
  outseq1_s: string[];
  outseq2_s: string[];
  keycode_s: string[];
  keyseq_s: string[];
  useqty_s: string[];
};

const MA_A2500W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const detailIdGetter = getter(DETAIL_DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
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
        frdt: setDefaultDate(customOptionData, "frdt"),
        todt: setDefaultDate(customOptionData, "todt"),
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
        doexdiv: defaultOption.find((item: any) => item.id === "doexdiv")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA019, L_MA036,L_SA002,L_BA005,L_BA029,L_BA002,L_sysUserMaster_001,L_dptcd_001,L_BA061,L_BA015,L_finyn",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [unpcalmethListData, setUnpcalmethListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [purstsListData, setPurstsListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [ordstsListData, setOrdstsListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [doexdivListData, setDoexdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [taxdivListData, setTaxdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [locationListData, setLocationListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [usersListData, setUsersListData] = useState([
    { user_id: "", user_name: "" },
  ]);

  const [departmentsListData, setDepartmentsListData] = useState([
    { dptcd: "", dptnm: "" },
  ]);
  const [itemacntListData, setItemacntListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [qtyunitListData, setQtyunitListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [finynListData, setFinynListData] = useState([{ code: "", name: "" }]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const purstsQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_MA036")
      );
      const unpcalmethQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA019")
      );
      const ordstsQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_SA002")
      );
      const doexdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA005")
      );
      const taxdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA029")
      );
      const locationQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA002")
      );
      const usersQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );
      const departmentQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_dptcd_001"
        )
      );
      const itemacntQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA061")
      );
      const qtyunitQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA015")
      );
      const finynQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_finyn")
      );
      fetchQuery(unpcalmethQueryStr, setUnpcalmethListData);
      fetchQuery(purstsQueryStr, setPurstsListData);
      fetchQuery(ordstsQueryStr, setOrdstsListData);
      fetchQuery(doexdivQueryStr, setDoexdivListData);
      fetchQuery(taxdivQueryStr, setTaxdivListData);
      fetchQuery(locationQueryStr, setLocationListData);
      fetchQuery(usersQueryStr, setUsersListData);
      fetchQuery(departmentQueryStr, setDepartmentsListData);
      fetchQuery(itemacntQueryStr, setItemacntListData);
      fetchQuery(qtyunitQueryStr, setQtyunitListData);
      fetchQuery(finynQueryStr, setFinynListData);
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

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;
      setSelectedState({ [rowData.num]: true });

      setIsCopy(false);
      setWorkType("U");
      setDetailWindowVisible(true);
    };

    return (
      <td className="k-command-cell">
        <Button
          className="k-grid-edit-command"
          themeColor={"primary"}
          fillMode="outline"
          onClick={onEditClick}
          icon="edit"
        ></Button>
      </td>
    );
  };

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], detailDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);

  const [workType, setWorkType] = useState<"N" | "U">("N");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);
  const [isCopy, setIsCopy] = useState(false);

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
    orgdiv: "01",
    location: "",
    frdt: new Date(),
    todt: new Date(),
    purnum: "",
    itemcd: "",
    itemnm: "",
    custcd: "",
    custnm: "",
    person: "",
    doexdiv: "",
    recdt: new Date(),
    seq1: 0,
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    recdt: new Date(),
    seq1: 0,
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_A2500W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_purnum": filters.purnum,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_person": filters.person,
      "@p_doexdiv": filters.doexdiv,
      "@p_recdt": convertDateToStr(filters.recdt),
      "@p_seq1": filters.seq1,
      "@p_company_code": "2207A046",
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_MA_A2500W_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_purnum": filters.purnum,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_person": filters.person,
      "@p_doexdiv": filters.doexdiv,
      "@p_recdt": convertDateToStr(detailFilters.recdt),
      "@p_seq1": detailFilters.seq1,
      "@p_company_code": "2207A046",
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    recdt: new Date(),
    seq1: 0,
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_MA_A2500W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_location": "01",
      "@p_recdt": convertDateToStr(paraDataDeleted.recdt),
      "@p_seq1": paraDataDeleted.seq1,
      "@p_indt": "",
      "@p_purdt": "",
      "@p_custcd": "",
      "@p_custnm": "",
      "@p_person": "",
      "@p_doexdiv": "",
      "@p_taxdiv": "",
      "@p_amtunit": "",
      "@p_baseamt": 0,
      "@p_wonchgrat": 0,
      "@p_uschgrat": 0,
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_rowstatus_s": "",
      "@p_recdt_s": "",
      "@p_seq1_s": "",
      "@p_seq2_s": "",
      "@p_itemcd_s": "",
      "@p_itemacnt_s": "",
      "@p_qty_s": "",
      "@p_qtyunit_s": "",
      "@p_purnum_s": "",
      "@p_purseq_s": "",
      "@p_planno_s": "",
      "@p_planseq_s": "",
      "@p_totwgt_s": "",
      "@p_wgtunit_s": "",
      "@p_unpcalmeth_s": "",
      "@p_unp_s": "",
      "@p_amt_s": "",
      "@p_wonamt_s": "",
      "@p_taxamt_s": "",
      "@p_remark_s": "",
      "@p_num_s": "",
      "@p_findkey_s": "",
      "@p_div_s": "",
      "@p_outrecdt_s": "",
      "@p_outseq1_s": "",
      "@p_outseq2_s": "",
      "@p_keycode_s": "",
      "@p_keyseq_s": "",
      "@p_useqty_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_MA_A2500W",
      "@p_company_code": "2207A046",
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
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDetailGrid = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setDetailDataResult((prev) => {
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
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    resetDetailGrid();
    if (customOptionData !== null && mainDataResult.total > 0) {
      fetchDetailGrid();
    }
  }, [detailFilters]);

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.num]: true });

        setDetailFilters((prev) => ({
          ...prev,
          recdt: toDate(firstRowData.recdt),
          seq1: firstRowData.seq1,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setDetailPgNum(1);
    setMainDataResult(process([], mainDataState));
    setDetailDataResult(process([], detailDataState));
  };

  const resetDetailGrid = () => {
    setDetailPgNum(1);
    setDetailDataResult(process([], detailDataState));
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

    setDetailFilters((prev) => ({
      ...prev,
      recdt: toDate(selectedRowData.recdt),
      seq1: selectedRowData.seq1,
    }));
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

  const onDetailScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum, PAGE_SIZE))
      setDetailPgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onDetailDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDataState(event.dataState);
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

  const gridSumQtyFooterCell = (props: GridFooterCellProps) => {
    let sum = 0;
    mainDataResult.data.forEach((item) =>
      props.field !== undefined ? (sum += item[props.field]) : ""
    );
    var parts = sum.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
      </td>
    );
  };

  const gridSumQtyFooterCell2 = (props: GridFooterCellProps) => {
    let sum = 0;
    detailDataResult.data.forEach((item) =>
      props.field !== undefined ? (sum += item[props.field]) : ""
    );
    var parts = sum.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
      </td>
    );
  };

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detailDataResult.total}건
      </td>
    );
  };

  const onAddClick = () => {
    setIsCopy(false);
    setWorkType("N");
    setDetailWindowVisible(true);
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };
  const questionToDelete = useSysMessage("QuestionToDelete");
  const onDeleteClick = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }
    const data = mainDataResult.data.filter(
      (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      recdt: toDate(data.recdt),
      seq1: data.seq1,
    }));
  };
  const [reload, setreload] = useState<boolean>(false);
  const fetchToDelete = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraDeleted);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      resetAllGrid();
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.recdt = new Date();
    paraDataDeleted.seq1 = 0;
  };

  interface ICustData {
    custcd: string;
    custnm: string;
    custabbr: string;
    bizregnum: string;
    custdivnm: string;
    useyn: string;
    remark: string;
    compclass: string;
    ceonm: string;
  }
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

  //업체마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
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
  const onDetailSortChange = (e: any) => {
    setDetailDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    try {
      if (
        convertDateToStr(filters.frdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.frdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.frdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.frdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_A2500W_001");
      } else if (
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_A2500W_001");
      } else if (
        filters.location == null ||
        filters.location == "" ||
        filters.location == undefined
      ) {
        throw findMessage(messagesData, "MA_A2500W_002");
      } else {
        resetAllGrid();
        fetchMainGrid();
      }
    } catch (e) {
      alert(e);
    }
  };

  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    location: "01",
    recdt: new Date(),
    seq1: 0,
    indt: new Date(),
    purdt: new Date(),
    custcd: "",
    custnm: "",
    person: "admin",
    doexdiv: "A",
    taxdiv: "A",
    amtunit: "",
    baseamt: 0,
    wonchgrat: 0,
    uschgrat: 0,
    attdatnum: "",
    remark: "",
    rowstatus_s: "",
    recdt_s: "",
    seq1_s: "",
    seq2_s: "",
    itemcd_s: "",
    itemacnt_s: "",
    qty_s: "",
    qtyunit_s: "",
    purnum_s: "",
    purseq_s: "",
    planno_s: "",
    planseq_s: "",
    totwgt_s: "",
    wgtunit_s: "",
    unpcalmeth_s: "",
    unp_s: "",
    amt_s: "",
    wonamt_s: "",
    taxamt_s: "",
    remark_s: "",
    num_s: "",
    findkey_s: "",
    div_s: "",
    outrecdt_s: "",
    outseq1_s: "",
    outseq2_s: "",
    keycode_s: "",
    keyseq_s: "",
    useqty_s: "",
    form_id: "MA_A2400W",
    serviceid: "2207A046",
  });

  const setCopyData = (data: any, filter: any, deletedMainRows: any) => {
    let valid = true;

    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    setParaData((prev) => ({
      ...prev,
      workType: workType,
      amt: filter.amt,
      amtunit: filter.amtunit,
      attdatnum: filter.attdatnum,
      baseamt: filter.baseamt,
      custcd: filter.custcd,
      custnm: filter.custnm,
      custprsncd: filter.custprsncd,
      doexdiv: filter.doexdiv,
      files: filter.files,
      indt: filter.indt,
      inexpdt: filter.inexpdt,
      location: "01",
      orgdiv: "01",
      person: filter.person,
      purdt: filter.purdt,
      purnum: filter.purnum,
      purqty: filter.purqty,
      pursts: filter.pursts,
      reckey: filter.reckey,
      recdt: filter.recdt,
      remark: filter.remark,
      taxamt: filter.taxamt,
      taxdiv: filter.taxdiv,
      totamt: filter.totamt,
      uschgrat: filter.uschgrat,
      wonchgrat: filter.wonchgrat,
      wonamt: filter.wonamt,
      seq1: filter.seq1,
      userid: userId,
      pc: pc,
      form_id: "MA_A2400W",
      serviceid: "2207A046",
    }));

    if (dataItem.length === 0 && deletedMainRows.length == 0) return false;

    let dataArr: TdataArr = {
      rowstatus_s: [],
      recdt_s: [],
      seq1_s: [],
      seq2_s: [],
      itemcd_s: [],
      itemacnt_s: [],
      qty_s: [],
      qtyunit_s: [],
      purnum_s: [],
      purseq_s: [],
      planno_s: [],
      planseq_s: [],
      totwgt_s: [],
      wgtunit_s: [],
      unpcalmeth_s: [],
      unp_s: [],
      amt_s: [],
      wonamt_s: [],
      taxamt_s: [],
      remark_s: [],
      num_s: [],
      findkey_s: [],
      div_s: [],
      outrecdt_s: [],
      outseq1_s: [],
      outseq2_s: [],
      keycode_s: [],
      keyseq_s: [],
      useqty_s: [],
    };

    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        recdt = "",
        seq1 = "",
        seq2 = "",
        outseq1 = "",
        outseq2 = "",
        itemcd = "",
        itemacnt = "",
        qty = "",
        qtyunit = "",
        purnum = "",
        purseq = "",
        planno = "",
        planseq = "",
        totwgt = "",
        wgtunit = "", //필요
        unpcalmeth = "",
        unp = "",
        amt = "",
        wonamt = "",
        taxamt = "",
        remark = "",
        num = "",
        reckey = "", //필요
        div = "",
        purdt = "", // outrecdt
        keycode = "",
        keyseq = "",
        useqty = "",
        outrecdt = "",
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.recdt_s.push(recdt);
      dataArr.seq1_s.push(seq1 == "" ? 0 : seq1);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit == undefined ? "" : qtyunit);
      dataArr.purnum_s.push(purnum == undefined ? "" : purnum);
      dataArr.purseq_s.push(purseq == "" ? 0 : purseq);
      dataArr.planno_s.push(planno == undefined ? "" : planno);
      dataArr.planseq_s.push(planseq == "" ? 0 : planseq);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.wgtunit_s.push(wgtunit == undefined ? "" : wgtunit);
      dataArr.unpcalmeth_s.push(unpcalmeth == "" ? 0 : unpcalmeth);
      dataArr.unp_s.push(unp == "" ? 0 : unp);
      dataArr.amt_s.push(amt == "" ? 0 : amt);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.remark_s.push(remark == undefined ? "" : remark);
      dataArr.num_s.push(num == "" ? 0 : num);
      dataArr.findkey_s.push(reckey == undefined ? "" : reckey);
      dataArr.div_s.push(div == undefined ? "" : div);
      dataArr.outrecdt_s.push(purdt);
      dataArr.outseq1_s.push(outseq1 == "" ? 0 : outseq1);
      dataArr.outseq2_s.push(outseq2 == "" ? 0 : outseq2);
      dataArr.keycode_s.push(keycode == undefined ? "" : keycode);
      dataArr.keyseq_s.push(keyseq == "" ? 0 : keyseq);
      dataArr.useqty_s.push(useqty == "" ? 0 : useqty);
    });
    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        recdt = "",
        seq1 = "",
        seq2 = "",
        outseq1 = "",
        outseq2 = "",
        itemcd = "",
        itemacnt = "",
        qty = "",
        qtyunit = "",
        purnum = "",
        purseq = "",
        planno = "",
        planseq = "",
        totwgt = "",
        wgtunit = "", //필요
        unpcalmeth = "",
        unp = "",
        amt = "",
        wonamt = "",
        taxamt = "",
        remark = "",
        num = "",
        findkey = "", //필요
        div = "",
        purdt = "", // outrecdt
        keycode = "",
        keyseq = "",
        useqty = "",
      } = item;
      dataArr.rowstatus_s.push(rowstatus);
      dataArr.recdt_s.push(recdt);
      dataArr.seq1_s.push(seq1 == "" ? 0 : seq1);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit == undefined ? "" : qtyunit);
      dataArr.purnum_s.push(purnum == undefined ? "" : purnum);
      dataArr.purseq_s.push(purseq == "" ? 0 : purseq);
      dataArr.planno_s.push(planno == undefined ? "" : planno);
      dataArr.planseq_s.push(planseq == "" ? 0 : planseq);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.wgtunit_s.push(wgtunit == undefined ? "" : wgtunit);
      dataArr.unpcalmeth_s.push(unpcalmeth == "" ? 0 : unpcalmeth);
      dataArr.unp_s.push(unp == "" ? 0 : unp);
      dataArr.amt_s.push(amt == "" ? 0 : amt);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.remark_s.push(remark == undefined ? "" : remark);
      dataArr.num_s.push(num == "" ? 0 : num);
      dataArr.findkey_s.push(findkey == undefined ? "" : findkey);
      dataArr.div_s.push(div == undefined ? "" : div);
      dataArr.outrecdt_s.push(purdt);
      dataArr.outseq1_s.push(outseq1 == "" ? 0 : outseq1);
      dataArr.outseq2_s.push(outseq2 == "" ? 0 : outseq2);
      dataArr.keycode_s.push(keycode == undefined ? "" : keycode);
      dataArr.keyseq_s.push(keyseq == "" ? 0 : keyseq);
      dataArr.useqty_s.push(useqty == "" ? 0 : useqty);
    });
    setParaData((prev) => ({
      ...prev,
      workType: workType,
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      recdt_s: dataArr.recdt_s.join("|"),
      seq1_s: dataArr.seq1_s.join("|"),
      seq2_s: dataArr.seq2_s.join("|"),
      itemcd_s: dataArr.itemcd_s.join("|"),
      itemacnt_s: dataArr.itemacnt_s.join("|"),
      qty_s: dataArr.qty_s.join("|"),
      qtyunit_s: dataArr.qtyunit_s.join("|"),
      purnum_s: dataArr.purnum_s.join("|"),
      purseq_s: dataArr.purseq_s.join("|"),
      planno_s: dataArr.planno_s.join("|"),
      planseq_s: dataArr.planseq_s.join("|"),
      totwgt_s: dataArr.totwgt_s.join("|"),
      wgtunit_s: dataArr.wgtunit_s.join("|"),
      unpcalmeth_s: dataArr.unpcalmeth_s.join("|"),
      unp_s: dataArr.unp_s.join("|"),
      amt_s: dataArr.amt_s.join("|"),
      wonamt_s: dataArr.wonamt_s.join("|"),
      taxamt_s: dataArr.taxamt_s.join("|"),
      remark_s: dataArr.remark_s.join("|"),
      num_s: dataArr.num_s.join("|"),
      findkey_s: dataArr.findkey_s.join("|"),
      div_s: dataArr.div_s.join("|"),
      outrecdt_s: dataArr.outrecdt_s.join("|"),
      outseq1_s: dataArr.outseq1_s.join("|"),
      outseq2_s: dataArr.outseq2_s.join("|"),
      keycode_s: dataArr.keycode_s.join("|"),
      keyseq_s: dataArr.keyseq_s.join("|"),
      useqty_s: dataArr.useqty_s.join("|"),
    }));
  };

  const para: Iparameters = {
    procedureName: "P_MA_A2500W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": "01",
      "@p_location": "01",
      "@p_recdt": convertDateToStr(ParaData.recdt),
      "@p_seq1": ParaData.seq1,
      "@p_indt": convertDateToStr(ParaData.indt),
      "@p_purdt": convertDateToStr(ParaData.purdt),
      "@p_custcd": ParaData.custcd,
      "@p_custnm": ParaData.custnm,
      "@p_person": ParaData.person,
      "@p_doexdiv": ParaData.doexdiv,
      "@p_taxdiv": ParaData.taxdiv,
      "@p_amtunit": ParaData.amtunit,
      "@p_baseamt": ParaData.baseamt,
      "@p_wonchgrat": ParaData.wonchgrat,
      "@p_uschgrat": ParaData.uschgrat,
      "@p_attdatnum": ParaData.attdatnum,
      "@p_remark": ParaData.remark,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_recdt_s": ParaData.recdt_s,
      "@p_seq1_s": ParaData.seq1_s,
      "@p_seq2_s": ParaData.seq2_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_itemacnt_s": ParaData.itemacnt_s,
      "@p_qty_s": ParaData.qty_s,
      "@p_qtyunit_s": ParaData.qtyunit_s,
      "@p_purnum_s": ParaData.purnum_s,
      "@p_purseq_s": ParaData.purseq_s,
      "@p_planno_s": ParaData.planno_s,
      "@p_planseq_s": ParaData.planseq_s,
      "@p_totwgt_s": ParaData.totwgt_s,
      "@p_wgtunit_s": ParaData.wgtunit_s,
      "@p_unpcalmeth_s": ParaData.unpcalmeth_s,
      "@p_unp_s": ParaData.unp_s,
      "@p_amt_s": ParaData.amt_s,
      "@p_wonamt_s": ParaData.wonamt_s,
      "@p_taxamt_s": ParaData.taxamt_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_num_s": ParaData.num_s,
      "@p_findkey_s": ParaData.findkey_s,
      "@p_div_s": ParaData.div_s,
      "@p_outrecdt_s": ParaData.outrecdt_s,
      "@p_outseq1_s": ParaData.outseq1_s,
      "@p_outseq2_s": ParaData.outseq2_s,
      "@p_keycode_s": ParaData.keycode_s,
      "@p_keyseq_s": ParaData.keyseq_s,
      "@p_useqty_s": ParaData.useqty_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_MA_A2500W",
      "@p_company_code": "2207A046",
    },
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
      setreload(!reload);
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.indt != undefined) {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  return (
    <>
      <TitleContainer>
        <Title>외주입고</Title>

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
              <th>입고일자</th>
              <td colSpan={3}>
                <div className="filter-item-wrap">
                  <DatePicker
                    name="frdt"
                    value={filters.frdt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    className="required"
                    placeholder=""
                  />
                  ~
                  <DatePicker
                    name="todt"
                    value={filters.todt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    className="required"
                    placeholder=""
                  />
                </div>
              </td>
              <th>업체코드</th>
              <td>
                <div className="filter-item-wrap">
                  <Input
                    name="custcd"
                    type="text"
                    value={filters.custcd}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput>
                    <Button
                      onClick={onCustWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </div>
              </td>
              <th>업체명</th>
              <td>
                <Input
                  name="custnm"
                  type="text"
                  value={filters.custnm}
                  onChange={filterInputChange}
                />
              </td>
              <th>발주번호</th>
              <td>
                <Input
                  name="purnum"
                  type="text"
                  value={filters.purnum}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>담당자</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="person"
                    value={filters.person}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    textField="user_name"
                    valueField="user_id"
                  />
                )}
              </td>
              <th>내수구분</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="doexdiv"
                    value={filters.doexdiv}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>
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
              <th>사업장</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="location"
                    value={filters.location}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    className="required"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainer>
        <ExcelExport
          data={mainDataResult.data}
          ref={(exporter) => {
            _export = exporter;
          }}
        >
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onAddClick}
                themeColor={"primary"}
                icon="file-add"
              >
                외주입고생성
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                외주입고삭제
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "36vh" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                ordsts: ordstsListData.find(
                  (item: any) => item.sub_code === row.ordsts
                )?.code_name,
                doexdiv: doexdivListData.find(
                  (item: any) => item.sub_code === row.doexdiv
                )?.code_name,
                taxdiv: taxdivListData.find(
                  (item: any) => item.sub_code === row.taxdiv
                )?.code_name,
                location: locationListData.find(
                  (item: any) => item.sub_code === row.location
                )?.code_name,
                person: usersListData.find(
                  (item: any) => item.user_id === row.person
                )?.user_name,
                dptcd: departmentsListData.find(
                  (item: any) => item.dptcd === row.dptcd
                )?.dptnm,
                finyn: finynListData.find(
                  (item: any) => item.code === row.finyn
                )?.name,
                pursts: purstsListData.find(
                  (item: any) => item.sub_code === row.pursts
                )?.code_name,
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
            <GridColumn cell={CommandCell} width="60px" />
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdList"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      cell={
                        numberField.includes(item.fieldName)
                          ? NumberCell
                          : dateField.includes(item.fieldName)
                          ? DateCell
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0
                          ? mainTotalFooterCell
                          : numberField.includes(item.fieldName)
                          ? gridSumQtyFooterCell
                          : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </ExcelExport>
      </GridContainer>

      <GridContainer>
        <GridTitleContainer>
          <GridTitle>상세정보</GridTitle>
        </GridTitleContainer>
        <Grid
          style={{ height: "34vh" }}
          data={process(
            detailDataResult.data.map((row) => ({
              ...row,
              itemacnt: itemacntListData.find(
                (item: any) => item.sub_code === row.itemacnt
              )?.code_name,
              qtyunit: qtyunitListData.find(
                (item: any) => item.sub_code === row.qtyunit
              )?.code_name,
              unpcalmeth: unpcalmethListData.find(
                (item: any) => item.sub_code === row.unpcalmeth
              )?.code_name,
            })),
            detailDataState
          )}
          {...detailDataState}
          onDataStateChange={onDetailDataStateChange}
          //스크롤 조회 기능
          fixedScroll={true}
          total={detailDataResult.total}
          onScroll={onDetailScrollHandler}
          //정렬기능
          sortable={true}
          onSortChange={onDetailSortChange}
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
                    field={item.fieldName}
                    title={item.caption}
                    width={item.width}
                    cell={
                      numberField.includes(item.fieldName)
                        ? NumberCell
                        : undefined
                    }
                    footerCell={
                      item.sortOrder === 0
                        ? detailTotalFooterCell
                        : numberField.includes(item.fieldName)
                        ? gridSumQtyFooterCell2
                        : undefined
                    }
                  />
                )
            )}
        </Grid>
      </GridContainer>
      {detailWindowVisible && (
        <DetailWindow
          setVisible={setDetailWindowVisible}
          workType={workType} //신규 : N, 수정 : U
          setData={setCopyData}
          data={
            mainDataResult.data.filter(
              (item: any) =>
                item.num == Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item: any) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0]
          }
          reload={reload}
        />
      )}
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
      {itemWindowVisible && (
        <ItemsWindow
          setVisible={setItemWindowVisible}
          workType={"FILTER"}
          setData={setItemData}
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

export default MA_A2500W;
