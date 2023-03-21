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
import { gridList } from "../store/columns/MA_A3400W_C";
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
  UseGetValueFromSessionItem,
  useSysMessage,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/MA_A3400W_Window";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

const DATA_ITEM_KEY = "reckey";

const DateField = ["outdt"];

const NumberField = [
  "qty",
  "unp",
  "amt",
  "taxamt",
  "len",
  "itemthick",
  "width",
];
type TdataArr = {
  rowstatus_s: string[];
  seq2_s: string[];
  rtnyn_s: string[];
  rtntype_s: string[];
  ordnum_s: string[];
  ordseq_s: string[];
  itemgrade_s: string[];
  itemcd_s: string[];
  itemnm_s: string[];
  itemacnt_s: string[];
  pacmeth_s: string[];
  qty_s: string[];
  qtyunit_s: string[];
  lenunit_s: string[];
  totlen_s: string[];
  unitwgt_s: string[];
  wgtunit_s: string[];
  totwgt_s: string[];
  len_s: string[];
  itemthick_s: string[];
  width_s: string[];
  unpcalmeth_s: string[];
  unp_s: string[];
  amt_s: string[];
  dlramt_s: string[];
  wonamt_s: string[];
  taxamt_s: string[];
  lotnum_s: string[];
  orglot_s: string[];
  heatno_s: string[];
  pcncd_s: string[];
  remark_s: string[];
  inrecdt_s: string[];
  inseq1_s: string[];
  inseq2_s: string[];
  gonum_s: string[];
  goseq_s: string[];
  connum_s: string[];
  conseq_s: string[];
  spno_s: string[];
  boxno_s: string[];
  endyn_s: string[];
  reqnum_s: string[];
  reqseq_s: string[];
  serialno_s: string[];
  load_place_s: string[];
  outdt_s: string[];
  person_s: string[];
};
const MA_A3400W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
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
        cboLocation: defaultOption.find(
          (item: any) => item.id === "cboLocation"
        ).valueCode,
        cboPerson: defaultOption.find((item: any) => item.id === "cboPerson")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_SA002,L_BA005,L_BA029,L_BA002,L_sysUserMaster_001,L_dptcd_001,L_BA061,L_BA015,L_finyn, L_SA014",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [outuseListData, setOutuseListData] = useState([
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
      const outuseQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_SA014")
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

      fetchQuery(outuseQueryStr, setOutuseListData);
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
    sort: [{ field: "outdt", dir: "desc" }],
  });
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;
      setSelectedState({ [rowData.reckey]: true });

      setDetailFilters((prev) => ({
        ...prev,
        location: rowData.location,
        reckey: rowData.reckey,
      }));

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

  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);

  const [workType, setWorkType] = useState<"N" | "U">("N");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

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
    cboLocation: "01",
    frdt: new Date(),
    todt: new Date(),
    cboPerson: "",
    itemcd: "",
    itemnm: "",
    custcd: "",
    custnm: "",
    lotnum: "",
    reckey: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    reckey: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_A3400W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.cboLocation,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_person": filters.cboPerson,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_lotnum": filters.lotnum,
      "@p_reckey": filters.reckey,
      "@p_find_row_value": null,
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_MA_A3400W_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.cboLocation,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_person": filters.cboPerson,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_lotnum": filters.lotnum,
      "@p_reckey": detailFilters.reckey,
      "@p_find_row_value": null,
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    recdt: "",
    seq1: 0,
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_MA_A3400W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_recdt": paraDataDeleted.recdt,
      "@p_seq1": paraDataDeleted.seq1,
      "@p_location": "",
      "@p_outdt": "",
      "@p_person": "",
      "@p_custcd": "",
      "@p_custnm": "",
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_outuse": "",
      "@p_rowstatus_s": "",
      "@p_seq2_s": "",
      "@p_rtnyn_s": "",
      "@p_rtntype_s": "",
      "@p_ordnum_s": "",
      "@p_ordseq_s": "",
      "@p_itemgrade_s": "",
      "@p_itemcd_s": "",
      "@p_itemnm_s": "",
      "@p_itemacnt_s": "",
      "@p_pacmeth_s": "",
      "@p_qty_s": "",
      "@p_qtyunit_s": "",
      "@p_lenunit_s": "",
      "@p_totlen_s": "",
      "@p_unitwgt_s": "",
      "@p_wgtunit_s": "",
      "@p_totwgt_s": "",
      "@p_len_s": "",
      "@p_itemthick_s": "",
      "@p_width_s": "",
      "@p_unpcalmeth_s": "",
      "@p_unp_s": "",
      "@p_amt_s": "",
      "@p_dlramt_s": "",
      "@p_wonamt_s": "",
      "@p_taxamt_s": "",
      "@p_lotnum_s": "",
      "@p_orglot_s": "",
      "@p_heatno_s": "",
      "@p_pcncd_s": "",
      "@p_remark_s": "",
      "@p_inrecdt_s": "",
      "@p_inseq1_s": "",
      "@p_inseq2_s": "",
      "@p_gonum_s": "",
      "@p_goseq_s": "",
      "@p_connum_s": "",
      "@p_conseq_s": "",
      "@p_spno_s": "",
      "@p_boxno_s": "",
      "@p_endyn_s": "",
      "@p_reqnum_s": "",
      "@p_reqseq_s": "",
      "@p_serialno_s": "",
      "@p_load_place_s": "",
      "@p_outdt_s": "",
      "@p_person_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "MA_A3400",
      "@p_serviceid": "2207A046",
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
      resetAllGrid();

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
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
            data: [...prev.data, ...rows],
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
        setSelectedState({ [firstRowData.reckey]: true });

        setDetailFilters((prev) => ({
          ...prev,
          location: firstRowData.location,
          reckey: firstRowData.reckey,
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
      location: selectedRowData.location,
      reckey: selectedRowData.reckey,
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

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detailDataResult.total}건
      </td>
    );
  };

  const onAddClick = () => {
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
    const key = Object.getOwnPropertyNames(selectedState)[0];

    const datas = mainDataResult.data.filter((item) => item.reckey == key);

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      recdt: datas[0].recdt,
      seq1: datas[0].seq1,
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
    paraDataDeleted.recdt = "";
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
        convertDateToStr(filters.frdt).substring(6, 8).length != 2 ||
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_A3400W_003");
      } else if (
        filters.cboLocation == null ||
        filters.cboLocation == undefined ||
        filters.cboLocation == ""
      ) {
        throw findMessage(messagesData, "MA_A3400W_004");
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
    recdt: "",
    seq1: 0,
    cboLocation: "01",
    outdt: new Date(),
    cboPerson: "admin",
    custcd: "",
    custnm: "",
    remark: "",
    attdatnum: "",
    outuse: "",
    rowstatus_s: "",
    seq2_s: "",
    rtnyn_s: "",
    rtntype_s: "",
    ordnum_s: "",
    ordseq_s: "",
    itemgrade_s: "",
    itemcd_s: "",
    itemnm_s: "",
    itemacnt_s: "",
    pacmeth_s: "",
    qty_s: "",
    qtyunit_s: "",
    lenunit_s: "",
    totlen_s: "",
    unitwgt_s: "",
    wgtunit_s: "",
    totwgt_s: "",
    len_s: "",
    itemthick_s: "",
    width_s: "",
    unpcalmeth_s: "",
    unp_s: "",
    amt_s: "",
    dlramt_s: "",
    wonamt_s: "",
    taxamt_s: "",
    lotnum_s: "",
    orglot_s: "",
    heatno_s: "",
    pcncd_s: "",
    remark_s: "",
    inrecdt_s: "",
    inseq1_s: "",
    inseq2_s: "",
    gonum_s: "",
    goseq_s: "",
    connum_s: "",
    conseq_s: "",
    spno_s: "",
    boxno_s: "",
    endyn_s: "",
    reqnum_s: "",
    reqseq_s: "",
    serialno_s: "",
    load_place_s: "",
    outdt_s: "",
    person_s: "",
    userid: userId,
    pc: pc,
    form_id: "MA_A3400",
    serviceid: "2207A046",
    reckey: "",
  });

  const fetchTodoGridSaved = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }
    
    if (data.isSuccess === true) {
      setParaData({
        pgSize: PAGE_SIZE,
        workType: "N",
        orgdiv: "01",
        recdt: "",
        seq1: 0,
        cboLocation: "01",
        outdt: new Date(),
        cboPerson: "admin",
        custcd: "",
        custnm: "",
        remark: "",
        attdatnum: "",
        outuse: "",
        rowstatus_s: "",
        seq2_s: "",
        rtnyn_s: "",
        rtntype_s: "",
        ordnum_s: "",
        ordseq_s: "",
        itemgrade_s: "",
        itemcd_s: "",
        itemnm_s: "",
        itemacnt_s: "",
        pacmeth_s: "",
        qty_s: "",
        qtyunit_s: "",
        lenunit_s: "",
        totlen_s: "",
        unitwgt_s: "",
        wgtunit_s: "",
        totwgt_s: "",
        len_s: "",
        itemthick_s: "",
        width_s: "",
        unpcalmeth_s: "",
        unp_s: "",
        amt_s: "",
        dlramt_s: "",
        wonamt_s: "",
        taxamt_s: "",
        lotnum_s: "",
        orglot_s: "",
        heatno_s: "",
        pcncd_s: "",
        remark_s: "",
        inrecdt_s: "",
        inseq1_s: "",
        inseq2_s: "",
        gonum_s: "",
        goseq_s: "",
        connum_s: "",
        conseq_s: "",
        spno_s: "",
        boxno_s: "",
        endyn_s: "",
        reqnum_s: "",
        reqseq_s: "",
        serialno_s: "",
        load_place_s: "",
        outdt_s: "",
        person_s: "",
        userid: userId,
        pc: pc,
        form_id: "MA_A3400",
        serviceid: "2207A046",
        reckey: "",
      });
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.rowstatus_s != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  const para: Iparameters = {
    procedureName: "P_MA_A3400W_S",
    pageNumber: mainPgNum,
    pageSize: ParaData.pgSize,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_recdt": ParaData.recdt,
      "@p_seq1": ParaData.seq1,
      "@p_location": ParaData.cboLocation,
      "@p_outdt": convertDateToStr(ParaData.outdt),
      "@p_person": ParaData.cboPerson,
      "@p_custcd": ParaData.custcd,
      "@p_custnm": ParaData.custnm,
      "@p_remark": ParaData.remark,
      "@p_attdatnum": ParaData.attdatnum,
      "@p_outuse": ParaData.outuse,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_seq2_s": ParaData.seq2_s,
      "@p_rtnyn_s": ParaData.rtnyn_s,
      "@p_rtntype_s": ParaData.rtntype_s,
      "@p_ordnum_s": ParaData.ordnum_s,
      "@p_ordseq_s": ParaData.ordseq_s,
      "@p_itemgrade_s": ParaData.itemgrade_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_itemnm_s": ParaData.itemnm_s,
      "@p_itemacnt_s": ParaData.itemacnt_s,
      "@p_pacmeth_s": ParaData.pacmeth_s,
      "@p_qty_s": ParaData.qty_s,
      "@p_qtyunit_s": ParaData.qtyunit_s,
      "@p_lenunit_s": ParaData.lenunit_s,
      "@p_totlen_s": ParaData.totlen_s,
      "@p_unitwgt_s": ParaData.unitwgt_s,
      "@p_wgtunit_s": ParaData.wgtunit_s,
      "@p_totwgt_s": ParaData.totwgt_s,
      "@p_len_s": ParaData.len_s,
      "@p_itemthick_s": ParaData.itemthick_s,
      "@p_width_s": ParaData.width_s,
      "@p_unpcalmeth_s": ParaData.unpcalmeth_s,
      "@p_unp_s": ParaData.unp_s,
      "@p_amt_s": ParaData.amt_s,
      "@p_dlramt_s": ParaData.dlramt_s,
      "@p_wonamt_s": ParaData.wonamt_s,
      "@p_taxamt_s": ParaData.taxamt_s,
      "@p_lotnum_s": ParaData.lotnum_s,
      "@p_orglot_s": ParaData.orglot_s,
      "@p_heatno_s": ParaData.heatno_s,
      "@p_pcncd_s": ParaData.pcncd_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_inrecdt_s": ParaData.inrecdt_s,
      "@p_inseq1_s": ParaData.inseq1_s,
      "@p_inseq2_s": ParaData.inseq2_s,
      "@p_gonum_s": ParaData.gonum_s,
      "@p_goseq_s": ParaData.goseq_s,
      "@p_connum_s": ParaData.connum_s,
      "@p_conseq_s": ParaData.conseq_s,
      "@p_spno_s": ParaData.spno_s,
      "@p_boxno_s": ParaData.boxno_s,
      "@p_endyn_s": ParaData.endyn_s,
      "@p_reqnum_s": ParaData.reqnum_s,
      "@p_reqseq_s": ParaData.reqseq_s,
      "@p_serialno_s": ParaData.serialno_s,
      "@p_load_place_s": ParaData.load_place_s,
      "@p_outdt_s": ParaData.outdt_s,
      "@p_person_s": ParaData.person_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "MA_A3400",
      "@p_serviceid": "2207A046",
    },
  };

  const setCopyData2 = (data: any, filter: any, deletedMainRows: any) => {
    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    setParaData((prev) => ({
      ...prev,
      pgSize: PAGE_SIZE,
      workType: workType,
      recdt: filter.recdt,
      seq1: filter.seq1,
      cboLocation: filter.cboLocation,
      outdt: filter.outdt,
      cboPerson: filter.cboPerson,
      custcd: filter.custcd,
      custnm: filter.custnm,
      remark: filter.remark,
      attdatnum: filter.attdatnum,
      outuse: filter.outuse,
      reckey: filter.reckey,
    }));

    if (dataItem.length === 0 && deletedMainRows.length == 0) return false;

    let dataArr: TdataArr = {
      rowstatus_s: [],
      seq2_s: [],
      rtnyn_s: [],
      rtntype_s: [],
      ordnum_s: [],
      ordseq_s: [],
      itemgrade_s: [],
      itemcd_s: [],
      itemnm_s: [],
      itemacnt_s: [],
      pacmeth_s: [],
      qty_s: [],
      qtyunit_s: [],
      lenunit_s: [],
      totlen_s: [],
      unitwgt_s: [],
      wgtunit_s: [],
      totwgt_s: [],
      len_s: [],
      itemthick_s: [],
      width_s: [],
      unpcalmeth_s: [],
      unp_s: [],
      amt_s: [],
      dlramt_s: [],
      wonamt_s: [],
      taxamt_s: [],
      lotnum_s: [],
      orglot_s: [],
      heatno_s: [],
      pcncd_s: [],
      remark_s: [],
      inrecdt_s: [],
      inseq1_s: [],
      inseq2_s: [],
      gonum_s: [],
      goseq_s: [],
      connum_s: [],
      conseq_s: [],
      spno_s: [],
      boxno_s: [],
      endyn_s: [],
      reqnum_s: [],
      reqseq_s: [],
      serialno_s: [],
      load_place_s: [],
      outdt_s: [],
      person_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        seq2 = "",
        rtnyn = "",
        rtntype = "",
        ordnum = "",
        ordseq = "",
        itemgrade = "",
        itemcd = "",
        itemnm = "",
        itemacnt = "",
        pacmeth = "",
        qty = "",
        qtyunit = "",
        lenunit = "",
        totlen = "",
        unitwgt = "",
        wgtunit = "",
        totwgt = "",
        len = "",
        itemthick = "",
        width = "",
        unpcalmeth = "",
        unp = "",
        amt = "",
        dlramt = "",
        wonamt = "",
        taxamt = "",
        lotnum = "",
        orglot = "",
        heatno = "",
        pcncd = "",
        remark = "",
        inrecdt = "",
        inseq1 = "",
        inseq2 = "",
        gonum = "",
        goseq = "",
        connum = "",
        conseq = "",
        spno = "",
        boxno = "",
        endyn = "",
        reqnum = "",
        reqseq = "",
        serialno = "",
        load_place = "",
        outdt = "",
        person = "",
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.rtnyn_s.push(rtnyn == "" ? "N" : rtnyn);
      dataArr.rtntype_s.push(rtntype);
      dataArr.ordnum_s.push(ordnum);
      dataArr.ordseq_s.push(ordseq == "" ? 0 : ordseq);
      dataArr.itemgrade_s.push(itemgrade);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemnm_s.push(itemnm);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.pacmeth_s.push(pacmeth);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.lenunit_s.push(lenunit);
      dataArr.totlen_s.push(totlen == "" ? 0 : totlen);
      dataArr.unitwgt_s.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgtunit_s.push(wgtunit);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.len_s.push(len == "" ? 0 : len);
      dataArr.itemthick_s.push(itemthick == "" ? 0 : itemthick);
      dataArr.width_s.push(width == "" ? 0 : width);
      dataArr.unpcalmeth_s.push(unpcalmeth);
      dataArr.unp_s.push(unp == "" ? 0 : unp);
      dataArr.amt_s.push(amt == "" ? 0 : amt);
      dataArr.dlramt_s.push(dlramt == "" ? 0 : dlramt);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.lotnum_s.push(lotnum);
      dataArr.orglot_s.push(orglot);
      dataArr.heatno_s.push(heatno);
      dataArr.pcncd_s.push(pcncd);
      dataArr.remark_s.push(remark);
      dataArr.inrecdt_s.push(inrecdt);
      dataArr.inseq1_s.push(inseq1 == "" ? 0 : inseq1);
      dataArr.inseq2_s.push(inseq2 == "" ? 0 : inseq2);
      dataArr.gonum_s.push(gonum);
      dataArr.goseq_s.push(goseq == "" ? 0 : goseq);
      dataArr.connum_s.push(connum);
      dataArr.conseq_s.push(conseq == "" ? 0 : conseq);
      dataArr.spno_s.push(spno == "" ? 0 : spno);
      dataArr.boxno_s.push(boxno);
      dataArr.endyn_s.push(endyn);
      dataArr.reqnum_s.push(reqnum);
      dataArr.reqseq_s.push(reqseq == "" ? 0 : reqseq);
      dataArr.serialno_s.push(serialno);
      dataArr.load_place_s.push(load_place);
      dataArr.outdt_s.push(outdt);
      dataArr.person_s.push(person);
    });

    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        seq2 = "",
        rtnyn = "",
        rtntype = "",
        ordnum = "",
        ordseq = "",
        itemgrade = "",
        itemcd = "",
        itemnm = "",
        itemacnt = "",
        pacmeth = "",
        qty = "",
        qtyunit = "",
        lenunit = "",
        totlen = "",
        unitwgt = "",
        wgtunit = "",
        totwgt = "",
        len = "",
        itemthick = "",
        width = "",
        unpcalmeth = "",
        unp = "",
        amt = "",
        dlramt = "",
        wonamt = "",
        taxamt = "",
        lotnum = "",
        orglot = "",
        heatno = "",
        pcncd = "",
        remark = "",
        inrecdt = "",
        inseq1 = "",
        inseq2 = "",
        gonum = "",
        goseq = "",
        connum = "",
        conseq = "",
        spno = "",
        boxno = "",
        endyn = "",
        reqnum = "",
        reqseq = "",
        serialno = "",
        load_place = "",
        outdt = "",
        person = "",
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.rtnyn_s.push(rtnyn == "" ? "N" : rtnyn);
      dataArr.rtntype_s.push(rtntype);
      dataArr.ordnum_s.push(ordnum);
      dataArr.ordseq_s.push(ordseq == "" ? 0 : ordseq);
      dataArr.itemgrade_s.push(itemgrade);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemnm_s.push(itemnm);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.pacmeth_s.push(pacmeth);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.lenunit_s.push(lenunit);
      dataArr.totlen_s.push(totlen == "" ? 0 : totlen);
      dataArr.unitwgt_s.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgtunit_s.push(wgtunit);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.len_s.push(len == "" ? 0 : len);
      dataArr.itemthick_s.push(itemthick == "" ? 0 : itemthick);
      dataArr.width_s.push(width == "" ? 0 : width);
      dataArr.unpcalmeth_s.push(unpcalmeth);
      dataArr.unp_s.push(unp == "" ? 0 : unp);
      dataArr.amt_s.push(amt == "" ? 0 : amt);
      dataArr.dlramt_s.push(dlramt == "" ? 0 : dlramt);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.lotnum_s.push(lotnum);
      dataArr.orglot_s.push(orglot);
      dataArr.heatno_s.push(heatno);
      dataArr.pcncd_s.push(pcncd);
      dataArr.remark_s.push(remark);
      dataArr.inrecdt_s.push(inrecdt);
      dataArr.inseq1_s.push(inseq1 == "" ? 0 : inseq1);
      dataArr.inseq2_s.push(inseq2 == "" ? 0 : inseq2);
      dataArr.gonum_s.push(gonum);
      dataArr.goseq_s.push(goseq == "" ? 0 : goseq);
      dataArr.connum_s.push(connum);
      dataArr.conseq_s.push(conseq == "" ? 0 : conseq);
      dataArr.spno_s.push(spno == "" ? 0 : spno);
      dataArr.boxno_s.push(boxno);
      dataArr.endyn_s.push(endyn);
      dataArr.reqnum_s.push(reqnum);
      dataArr.reqseq_s.push(reqseq == "" ? 0 : reqseq);
      dataArr.serialno_s.push(serialno);
      dataArr.load_place_s.push(load_place);
      dataArr.outdt_s.push(outdt);
      dataArr.person_s.push(person);
    });
    setParaData((prev) => ({
      ...prev,
      workType: workType,
      outdt: filter.outdt,
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      seq2_s: dataArr.seq2_s.join("|"),
      rtnyn_s: dataArr.rtnyn_s.join("|"),
      rtntype_s: dataArr.rtntype_s.join("|"),
      ordnum_s: dataArr.ordnum_s.join("|"),
      ordseq_s: dataArr.ordseq_s.join("|"),
      itemgrade_s: dataArr.itemgrade_s.join("|"),
      itemcd_s: dataArr.itemcd_s.join("|"),
      itemnm_s: dataArr.itemnm_s.join("|"),
      itemacnt_s: dataArr.itemacnt_s.join("|"),
      pacmeth_s: dataArr.pacmeth_s.join("|"),
      qty_s: dataArr.qty_s.join("|"),
      qtyunit_s: dataArr.qtyunit_s.join("|"),
      lenunit_s: dataArr.lenunit_s.join("|"),
      totlen_s: dataArr.totlen_s.join("|"),
      unitwgt_s: dataArr.unitwgt_s.join("|"),
      wgtunit_s: dataArr.wgtunit_s.join("|"),
      totwgt_s: dataArr.totwgt_s.join("|"),
      len_s: dataArr.len_s.join("|"),
      itemthick_s: dataArr.itemthick_s.join("|"),
      width_s: dataArr.width_s.join("|"),
      unpcalmeth_s: dataArr.unpcalmeth_s.join("|"),
      unp_s: dataArr.unp_s.join("|"),
      amt_s: dataArr.amt_s.join("|"),
      dlramt_s: dataArr.dlramt_s.join("|"),
      wonamt_s: dataArr.wonamt_s.join("|"),
      taxamt_s: dataArr.taxamt_s.join("|"),
      lotnum_s: dataArr.lotnum_s.join("|"),
      orglot_s: dataArr.orglot_s.join("|"),
      heatno_s: dataArr.heatno_s.join("|"),
      pcncd_s: dataArr.pcncd_s.join("|"),
      remark_s: dataArr.remark_s.join("|"),
      inrecdt_s: dataArr.inrecdt_s.join("|"),
      inseq1_s: dataArr.inseq1_s.join("|"),
      inseq2_s: dataArr.inseq2_s.join("|"),
      gonum_s: dataArr.gonum_s.join("|"),
      goseq_s: dataArr.goseq_s.join("|"),
      connum_s: dataArr.connum_s.join("|"),
      conseq_s: dataArr.conseq_s.join("|"),
      spno_s: dataArr.spno_s.join("|"),
      boxno_s: dataArr.boxno_s.join("|"),
      endyn_s: dataArr.endyn_s.join("|"),
      reqnum_s: dataArr.reqnum_s.join("|"),
      reqseq_s: dataArr.reqseq_s.join("|"),
      serialno_s: dataArr.serialno_s.join("|"),
      load_place_s: dataArr.load_place_s.join("|"),
      outdt_s: dataArr.outdt_s.join("|"),
      person_s: dataArr.person_s.join("|"),
    }));
  };

  return (
    <>
      <TitleContainer>
        <Title>기타출고</Title>

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
              <th>출고일자</th>
              <td>
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
              <th>담당자</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="cboPerson"
                    value={filters.cboPerson}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    textField="user_name"
                    valueField="user_id"
                  />
                )}
              </td>
            </tr>

            <tr>
              <th>LOT NO</th>
              <td>
                <Input
                  name="lotnum"
                  type="text"
                  value={filters.lotnum}
                  onChange={filterInputChange}
                />
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
                    name="cboLocation"
                    value={filters.cboLocation}
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
                기타출고생성
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                기타출고삭제
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
                outuse: outuseListData.find(
                  (item: any) => item.sub_code === row.outuse
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
                      id={item.id}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      cell={
                        DateField.includes(item.fieldName)
                          ? DateCell
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0 ? mainTotalFooterCell : undefined
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
                    id={item.id}
                    field={item.fieldName}
                    title={item.caption}
                    width={item.width}
                    cell={
                      NumberField.includes(item.fieldName)
                        ? NumberCell
                        : undefined
                    }
                    footerCell={
                      item.sortOrder === 0 ? detailTotalFooterCell : undefined
                    }
                  />
                )
            )}
        </Grid>
      </GridContainer>
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
      {detailWindowVisible && (
        <DetailWindow
          setVisible={setDetailWindowVisible}
          workType={workType}
          setData={setCopyData2}
          data={
            mainDataResult.data.filter(
              (item) =>
                item.reckey == Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item.reckey == Object.getOwnPropertyNames(selectedState)[0]
                )[0]
          }
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

export default MA_A3400W;
