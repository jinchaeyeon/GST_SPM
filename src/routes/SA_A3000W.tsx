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
import DetailWindow from "../components/Windows/SA_A3000W_Window";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import { gridList } from "../store/columns/SA_A3000W_C";
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
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import { deprecationHandler } from "moment";

const DATA_ITEM_KEY = "num";
const DETAIL_DATA_ITEM_KEY = "num";
const dateField = ["reqdt"];
const numberField = ["jisiqty", "outqty", "qty", "len"];
const checkField = ["finyn"];
type TdataArr = {
  rowstatus: string[];
  custcd: string[];
  custnm: string[];
  doqty: number[];
  dptcd: string[];
  itemacnt: string[];
  itemcd: string[];
  itemnm: string[];
  itemno: string[];
  len: number[];
  ordbnatur: string[];
  orddt: string[];
  ordinsiz: string[];
  ordkey: string[];
  ordnum: string[];
  ordseq: string[];
  ordsts: string[];
  person: string[];
  qty: number[];
  qtyunit: string[];
  rcvcustcd: string[];
  rcvcustnm: string[];
  remark: string[];
  reqqty: number[];
  unp: number[];
  reqseq: number[];
  unitwgt: number[];
  wgt: number[];
  wgtunit: string[];
  totwgt: number[];
  finyn: string[];
  spqty: number[];
  boxqty_w: number[];
  boxqty_h: number[];
  boxjanqty: number[];
  boxqty: number[];
  outlot: string[];
};

const SA_A2300: React.FC = () => {
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
        finyn: defaultOption.find((item: any) => item.id === "finyn").valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_SA002,L_BA005,L_BA029,L_BA002,L_sysUserMaster_001,L_dptcd_001,L_BA061,L_BA015,L_finyn",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
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
    position: "",
    reqnum: "",
    frdt: new Date(),
    todt: new Date(),
    itemcd: "",
    itemnm: "",
    custcd: "",
    custnm: "",
    finyn: "",
    ordnum: "",
    poregnum: "",
    itemno: "",
    reqnum_s: "",
    reqseq_s: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    reqnum: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SA_A3000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": filters.position,
      "@p_reqnum": filters.reqnum,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_finyn": filters.finyn,
      "@p_ordnum": filters.ordnum,
      "@p_poregnum": filters.poregnum,
      "@p_itemno": filters.itemno,
      "@p_reqnum_s": filters.reqnum_s,
      "@p_reqseq_s": filters.reqseq_s,
      "@p_company_code": "2207A046",
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_SA_A3000W_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": filters.position,
      "@p_reqnum": detailFilters.reqnum,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_finyn": filters.finyn,
      "@p_ordnum": filters.ordnum,
      "@p_poregnum": filters.poregnum,
      "@p_itemno": filters.itemno,
      "@p_reqnum_s": filters.reqnum_s,
      "@p_reqseq_s": filters.reqseq_s,
      "@p_company_code": "2207A046",
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    reqnum: "",
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_SA_A3000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_reqnum": paraDataDeleted.reqnum,
      "@p_location": "",
      "@p_position": "",
      "@p_reqdt": "",
      "@p_shipdt": "",
      "@p_person": "",
      "@p_custcd": "",
      "@p_custnm": "",
      "@p_rcvcustcd": "",
      "@p_poregnum": "",
      "@p_portnm": "",
      "@p_finaldes": "",
      "@p_carno": "",
      "@p_cargocd": "",
      "@p_cargb": "",
      "@p_dvnm": "",
      "@p_dvnum": "",
      "@p_gugancd": "",
      "@p_trcost": 0,
      "@p_remark": "",
      "@p_finyn": "",
      "@p_custprsncd": "",
      "@p_rcvperson": "",
      "@p_rcvnum": "",
      "@p_rowstatus": "",
      "@p_reqseq_s": "",
      "@p_ordnum_s": "",
      "@p_ordseq_s": "",
      "@p_itemcd_s": "",
      "@p_itemnm_s": "",
      "@p_itemacnt_s": "",
      "@p_qty_s": "",
      "@p_len_s": "",
      "@p_unitwgt_s": "",
      "@p_wgt_s": "",
      "@p_wgtunit_s": "",
      "@p_totwgt_s": "",
      "@p_remark_s": "",
      "@p_finyn_s": "",
      "@p_unp_s": "",
      "@p_spqty_s": "",
      "@p_boxqty_w_s": "",
      "@p_boxqty_h_s": "",
      "@p_boxjanqty_s": "",
      "@p_boxqty_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_outlot_s": "",
      "@p_form_id": "P_SA_A3000W",
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
  const [reload, setreload] = useState<boolean>(false);
  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.num]: true });

        setDetailFilters((prev) => ({
          ...prev,
          reqnum: firstRowData.reqnum,
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
      reqnum: selectedRowData.reqnum,
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
      reqnum: data.reqnum,
    }));
  };

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
    paraDataDeleted.reqnum = "";
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
        throw findMessage(messagesData, "SA_A3000W_001");
      } else if (
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A3000W_001");
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
    reqnum: "",
    location: "01",
    position: "",
    reqdt: new Date(),
    shipdt: new Date(),
    person: "",
    custcd: "",
    custnm: "",
    rcvcustcd: "",
    poregnum: "",
    portnm: "",
    finaldes: "",
    carno: "",
    cargocd: "",
    cargb: "",
    dvnm: "",
    dvnum: "",
    gugancd: "",
    trcost: 0,
    remark: "",
    finyn: "",
    custprsncd: "",
    rcvperson: "",
    rcvnum: "",
    rcvnm: "",
    rowstatus: "",
    reqseq_s: "",
    ordnum_s: "",
    ordseq_s: "",
    itemcd_s: "",
    itemnm_s: "",
    itemacnt_s: "",
    qty_s: "",
    len_s: "",
    unitwgt_s: "",
    wgt_s: "",
    wgtunit_s: "",
    totwgt_s: "",
    remark_s: "",
    finyn_s: "",
    unp_s: "",
    spqty_s: "",
    boxqty_w_s: "",
    boxqty_h_s: "",
    boxjanqty_s: "",
    boxqty_s: "",
    userid: userId,
    pc: pc,
    outlot_s: "",
    form_id: "SA_A3000W",
    serviceid: "2207A046",
  });

  const setCopyData = (data: any, filter: any, deletedMainRows: any) => {
    setParaData((prev) => ({
      ...prev,
      workType: workType,
      reqnum: filter.reqnum,
      location: filter.location,
      reqdt: filter.reqdt,
      shipdt: filter.shipdt,
      person: filter.person,
      custcd: filter.custcd,
      custnm: filter.custnm,
      rcvcustcd: filter.rcvcustcd,
      poregnum: filter.poregnum,
      portnm: filter.portnm,
      finaldes: filter.finaldes,
      carno: filter.carno,
      cargocd: filter.cargocd,
      cargb: filter.cargb,
      dvnm: filter.dvnm,
      dvnum: filter.dvnum,
      gugancd: filter.gugancd,
      trcost: parseInt(filter.trcost),
      remark: filter.remark,
      rcvperson: filter.rcvperson,
      rcvnum: filter.rcvnum,
    }));

    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0 && deletedMainRows.length == 0) return false;
    let dataArr: TdataArr = {
      rowstatus: [],
      custcd: [],
      custnm: [],
      doqty: [],
      dptcd: [],
      itemacnt: [],
      itemcd: [],
      itemnm: [],
      itemno: [],
      len: [],
      ordbnatur: [],
      orddt: [],
      ordinsiz: [],
      ordkey: [],
      ordnum: [],
      ordseq: [],
      ordsts: [],
      person: [],
      qty: [],
      qtyunit: [],
      rcvcustcd: [],
      rcvcustnm: [],
      remark: [],
      reqqty: [],
      unp: [],
      reqseq: [],
      unitwgt: [],
      wgt: [],
      wgtunit: [],
      totwgt: [],
      finyn: [],
      spqty: [],
      boxqty_w: [],
      boxqty_h: [],
      boxjanqty: [],
      boxqty: [],
      outlot: [],
    };

    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        itemacnt = "",
        itemcd = "",
        itemnm = "",
        len = "",
        ordnum = "",
        ordseq = "",
        qty = "",
        remark = "",
        unp = "",
        reqseq = "",
        unitwgt = "",
        wgt = "",
        wgtunit = "",
        totwgt = "",
        finyn = "",
        spqty = "",
        boxqty_w = "",
        boxqty_h = "",
        boxjanqty = "",
        boxqty = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.reqseq.push(reqseq == "" ? 0 : reqseq);
      dataArr.ordnum.push(ordnum == undefined ? "" : ordnum);
      dataArr.ordseq.push(ordseq == "" ? 0 : ordseq);
      dataArr.itemcd.push(itemcd);
      dataArr.itemnm.push(itemnm);
      dataArr.itemacnt.push(itemacnt == undefined ? "" : itemacnt);
      dataArr.qty.push(qty == "" ? 0 : qty);
      dataArr.len.push(len == "" ? 0 : len);
      dataArr.unitwgt.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgt.push(wgt == "" ? 0 : wgt);
      dataArr.wgtunit.push(wgtunit == "" ? 0 : wgtunit);
      dataArr.totwgt.push(totwgt == "" ? 0 : totwgt);
      dataArr.remark.push(remark == undefined ? "" : remark);
      dataArr.finyn.push(finyn == undefined ? "" : finyn);
      dataArr.unp.push(unp == "" ? 0 : unp);
      dataArr.spqty.push(spqty == "" ? 0 : spqty);
      dataArr.boxqty_w.push(boxqty_w == "" ? 0 : boxqty_w);
      dataArr.boxqty_h.push(boxqty_h == "" ? 0 : boxqty_h);
      dataArr.boxjanqty.push(boxjanqty == "" ? 0 : boxjanqty);
      dataArr.boxqty.push(boxqty == "" ? 0 : boxqty);
      dataArr.outlot.push("");
    });
    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        itemacnt = "",
        itemcd = "",
        itemnm = "",
        len = "",
        ordnum = "",
        ordseq = "",
        qty = "",
        remark = "",
        unp = "",
        reqseq = "",
        unitwgt = "",
        wgt = "",
        wgtunit = "",
        totwgt = "",
        finyn = "",
        spqty = "",
        boxqty_w = "",
        boxqty_h = "",
        boxjanqty = "",
        boxqty = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.reqseq.push(reqseq == "" ? 0 : reqseq);
      dataArr.ordnum.push(ordnum == undefined ? "" : ordnum);
      dataArr.ordseq.push(ordseq == "" ? 0 : ordseq);
      dataArr.itemcd.push(itemcd);
      dataArr.itemnm.push(itemnm);
      dataArr.itemacnt.push(itemacnt == undefined ? "" : itemacnt);
      dataArr.qty.push(qty == "" ? 0 : qty);
      dataArr.len.push(len == "" ? 0 : len);
      dataArr.unitwgt.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgt.push(wgt == "" ? 0 : wgt);
      dataArr.wgtunit.push(wgtunit == "" ? 0 : wgtunit);
      dataArr.totwgt.push(totwgt == "" ? 0 : totwgt);
      dataArr.remark.push(remark == undefined ? "" : remark);
      dataArr.finyn.push(finyn == undefined ? "" : finyn);
      dataArr.unp.push(unp == "" ? 0 : unp);
      dataArr.spqty.push(spqty == "" ? 0 : spqty);
      dataArr.boxqty_w.push(boxqty_w == "" ? 0 : boxqty_w);
      dataArr.boxqty_h.push(boxqty_h == "" ? 0 : boxqty_h);
      dataArr.boxjanqty.push(boxjanqty == "" ? 0 : boxjanqty);
      dataArr.boxqty.push(boxqty == "" ? 0 : boxqty);
      dataArr.outlot.push("");
    });
    setParaData((prev) => ({
      ...prev,
      workType: workType,
      rowstatus: dataArr.rowstatus.join("|"),
      reqseq_s: dataArr.reqseq.join("|"),
      ordnum_s: dataArr.ordnum.join("|"),
      ordseq_s: dataArr.ordseq.join("|"),
      itemcd_s: dataArr.itemcd.join("|"),
      itemnm_s: dataArr.itemnm.join("|"),
      itemacnt_s: dataArr.itemacnt.join("|"),
      qty_s: dataArr.qty.join("|"),
      len_s: dataArr.len.join("|"),
      unitwgt_s: dataArr.unitwgt.join("|"),
      wgt_s: dataArr.wgt.join("|"),
      wgtunit_s: dataArr.wgtunit.join("|"),
      totwgt_s: dataArr.totwgt.join("|"),
      remark_s: dataArr.remark.join("|"),
      finyn_s: dataArr.finyn.join("|"),
      unp_s: dataArr.unp.join("|"),
      spqty_s: dataArr.spqty.join("|"),
      boxqty_w_s: dataArr.boxqty_w.join("|"),
      boxqty_h_s: dataArr.boxqty_h.join("|"),
      boxjanqty_s: dataArr.boxjanqty.join("|"),
      boxqty_s: dataArr.boxqty.join("|"),
      outlot_s: dataArr.outlot.join("|"),
    }));
  };

  const para: Iparameters = {
    procedureName: "P_SA_A3000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_reqnum": ParaData.reqnum,
      "@p_location": ParaData.location,
      "@p_position": ParaData.position,
      "@p_reqdt": convertDateToStr(ParaData.reqdt),
      "@p_shipdt": convertDateToStr(ParaData.shipdt),
      "@p_person": ParaData.person,
      "@p_custcd": ParaData.custcd,
      "@p_custnm": ParaData.custnm,
      "@p_rcvcustcd": ParaData.rcvcustcd,
      "@p_poregnum": ParaData.poregnum,
      "@p_portnm": ParaData.portnm,
      "@p_finaldes": ParaData.finaldes,
      "@p_carno": ParaData.carno,
      "@p_cargocd": ParaData.cargocd,
      "@p_cargb": ParaData.cargb,
      "@p_dvnm": ParaData.dvnm,
      "@p_dvnum": ParaData.dvnum,
      "@p_gugancd": ParaData.gugancd,
      "@p_trcost": ParaData.trcost,
      "@p_remark": ParaData.remark,
      "@p_finyn": ParaData.finyn,
      "@p_custprsncd": ParaData.custprsncd,
      "@p_rcvperson": ParaData.rcvperson,
      "@p_rcvnum": ParaData.rcvnum,
      "@p_rowstatus": ParaData.rowstatus,
      "@p_reqseq_s": ParaData.reqseq_s,
      "@p_ordnum_s": ParaData.ordnum_s,
      "@p_ordseq_s": ParaData.ordseq_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_itemnm_s": ParaData.itemnm_s,
      "@p_itemacnt_s": ParaData.itemacnt_s,
      "@p_qty_s": ParaData.qty_s,
      "@p_len_s": ParaData.len_s,
      "@p_unitwgt_s": ParaData.unitwgt_s,
      "@p_wgt_s": ParaData.wgt_s,
      "@p_wgtunit_s": ParaData.wgtunit_s,
      "@p_totwgt_s": ParaData.totwgt_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_finyn_s": ParaData.finyn_s,
      "@p_unp_s": ParaData.unp_s,
      "@p_spqty_s": ParaData.spqty_s,
      "@p_boxqty_w_s": ParaData.boxqty_w_s,
      "@p_boxqty_h_s": ParaData.boxqty_h_s,
      "@p_boxjanqty_s": ParaData.boxjanqty_s,
      "@p_boxqty_s": ParaData.boxqty_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_outlot_s": ParaData.outlot_s,
      "@p_form_id": "P_SA_A3000W",
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
      fetchDetailGrid();
      setParaData({
        pgSize: PAGE_SIZE,
        workType: "N",
        orgdiv: "01",
        reqnum: "",
        location: "01",
        position: "",
        reqdt: new Date(),
        shipdt: new Date(),
        person: "",
        custcd: "",
        custnm: "",
        rcvcustcd: "",
        poregnum: "",
        portnm: "",
        finaldes: "",
        carno: "",
        cargocd: "",
        cargb: "",
        dvnm: "",
        dvnum: "",
        gugancd: "",
        trcost: 0,
        remark: "",
        finyn: "",
        custprsncd: "",
        rcvperson: "",
        rcvnum: "",
        rcvnm: "",
        rowstatus: "",
        reqseq_s: "",
        ordnum_s: "",
        ordseq_s: "",
        itemcd_s: "",
        itemnm_s: "",
        itemacnt_s: "",
        qty_s: "",
        len_s: "",
        unitwgt_s: "",
        wgt_s: "",
        wgtunit_s: "",
        totwgt_s: "",
        remark_s: "",
        finyn_s: "",
        unp_s: "",
        spqty_s: "",
        boxqty_w_s: "",
        boxqty_h_s: "",
        boxjanqty_s: "",
        boxqty_s: "",
        userid: userId,
        pc: pc,
        outlot_s: "",
        form_id: "SA_A3000W",
        serviceid: "2207A046",
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.rowstatus != "" || ParaData.reqnum != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  return (
    <>
      <TitleContainer>
        <Title>출하지시</Title>

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
              <th>지시일자</th>
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
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>수주번호</th>
              <td>
                <Input
                  name="ordnum"
                  type="text"
                  value={filters.ordnum}
                  onChange={filterInputChange}
                />
              </td>
              <th>출하지시번호</th>
              <td>
                <Input
                  name="reqnum"
                  type="text"
                  value={filters.reqnum}
                  onChange={filterInputChange}
                />
              </td>
              <th> 업체코드</th>
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
              <th>완료여부</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="finyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
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
                출하지시생성
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                출하지시삭제
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
                finyn: row.finyn == "Y" ? true : false,
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
                          : checkField.includes(item.fieldName)
                          ? CheckBoxCell
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
                        : checkField.includes(item.fieldName)
                        ? CheckBoxCell
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

export default SA_A2300;
