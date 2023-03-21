import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridFooterCellProps,
  GridCellProps,
  GridHeaderSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { gridList } from "../store/columns/MA_A3300W_C";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
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
  toDate,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/MA_A3300W_Window";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import BarcodeWindow from "../components/Windows/MA_A2700W_Barcode_Window";
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
const DateField = ["recdt", "enddt"];

const NumberField = [
  "qty",
  "wonamt",
  "taxamt",
  "totamt",
  "unp",
  "totwgt",
  "len",
  "itemthick",
  "width",
  "amt",
];
type TdataArr = {
  rowstatus_s: string[];
  itemgrade_s: string[];
  itemcd_s: string[];
  itemnm_s: string[];
  itemacnt_s: string[];
  qty_s: string[];
  qtyunit_s: string[];
  unitwgt_s: string[];
  wgtunit_s: string[];
  len_s: string[];
  itemthick_s: string[];
  width_s: string[];
  unpcalmeth_s: string[];
  UNPFACTOR_s: string[];
  unp_s: string[];
  amt_s: string[];
  dlramt_s: string[];
  wonamt_s: string[];
  taxamt_s: string[];
  maker_s: string[];
  usegb_s: string[];
  spec_s: string[];
  badcd_s: string[];
  BADTEMP_s: string[];
  poregnum_s: string[];
  lcno_s: string[];
  heatno_s: string[];
  SONGNO_s: string[];
  projectno_s: string[];
  lotnum_s: string[];
  orglot_s: string[];
  boxno_s: string[];
  PRTNO_s: string[];
  account_s: string[];
  qcnum_s: string[];
  qcseq_s: string[];
  APPNUM_s: string[];
  seq2_s: string[];
  totwgt_s: string[];
  purnum_s: string[];
  purseq_s: string[];
  ordnum_s: string[];
  ordseq_s: string[];
  remark_s: string[];
  load_place_s: string[];
  serialno_s: string[];
};
const DATA_ITEM_KEY = "num";
const DETAIL_DATA_ITEM_KEY = "num";

const MA_A3300W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DETAIL_DATA_ITEM_KEY);
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
        position: defaultOption.find((item: any) => item.id === "position")
          .valueCode,
        inuse: defaultOption.find((item: any) => item.id === "inuse").valueCode,
        finyn: defaultOption.find((item: any) => item.id === "finyn").valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA016, L_BA171, L_MA002, L_SA002,L_BA005,L_BA029,L_BA002,L_sysUserMaster_001,L_dptcd_001,L_BA061,L_BA015,L_finyn",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [pacListData, setPacListData] = useState([COM_CODE_DEFAULT_VALUE]);
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
  const [itemlvl1ListData, setItemlvl1ListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [inuseListData, setInuseListData] = useState([COM_CODE_DEFAULT_VALUE]);
  const [finynListData, setFinynListData] = useState([{ code: "", name: "" }]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const pacQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA016")
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
      const itemlvl1QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA171")
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
      const inuseQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_MA002")
      );
      const finynQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_finyn")
      );
      fetchQuery(pacQueryStr, setPacListData);
      fetchQuery(ordstsQueryStr, setOrdstsListData);
      fetchQuery(doexdivQueryStr, setDoexdivListData);
      fetchQuery(taxdivQueryStr, setTaxdivListData);
      fetchQuery(locationQueryStr, setLocationListData);
      fetchQuery(usersQueryStr, setUsersListData);
      fetchQuery(departmentQueryStr, setDepartmentsListData);
      fetchQuery(itemacntQueryStr, setItemacntListData);
      fetchQuery(qtyunitQueryStr, setQtyunitListData);
      fetchQuery(inuseQueryStr, setInuseListData);
      fetchQuery(finynQueryStr, setFinynListData);
      fetchQuery(itemlvl1QueryStr, setItemlvl1ListData);
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

  const [barcordDataState, setBarcodeDataState] = useState<State>({
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
      setSelectedState({ [rowData.recnum]: true });

      setDetailFilters((prev) => ({
        ...prev,
        recdt: toDate(rowData.recdt),
        seq1: rowData.seq1,
        person: rowData.person,
      }));

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

  const [barcodeDataResult, setBarcodeDateResult] = useState<DataResult>(
    process([], barcordDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailselectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);
  const [barcodeWindowVisible, setBarcodeWindowVisible] =
    useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);
  const [reload, setreload] = useState<boolean>(false);
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
    location: "01",
    position: "",
    frdt: new Date(),
    todt: new Date(),
    recdt: new Date(),
    seq1: 0,
    custcd: "",
    custnm: "",
    itemcd: "",
    itemnm: "",
    finyn: "%",
    doexdiv: "",
    inuse: "",
    person: "",
    lotnum: "",
    remark: "",
    pursiz: "",
    find_row_value: "",
    scrollDirrection: "down",
    pgNum: 1,
    isSearch: true,
    pgGap: 0,
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    recdt: new Date(),
    seq1: 0,
    person: "",
    find_row_value: "",
    scrollDirrection: "down",
    pgNum: 1,
    isSearch: true,
    pgGap: 0,
  });

  const [barcodeFilters, setBarCodeFilters] = useState({
    pgSize: PAGE_SIZE,
    recdt: "",
    seq1: 0,
    lotnum: "",
    seq2: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_A3300W_Q",
    pageNumber: filters.pgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": filters.position,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_recdt": convertDateToStr(filters.recdt),
      "@p_seq1": filters.seq1,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_finyn": filters.finyn,
      "@p_doexdiv": filters.doexdiv,
      "@p_inuse": filters.inuse,
      "@p_person": filters.person,
      "@p_lotnum": filters.lotnum,
      "@p_remark": filters.remark,
      "@p_pursiz": filters.pursiz,
      "@p_person1": filters.person,
      "@p_find_row_value": filters.find_row_value,
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_MA_A3300W_Q",
    pageNumber: detailFilters.pgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": filters.position,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_recdt": convertDateToStr(detailFilters.recdt),
      "@p_seq1": detailFilters.seq1,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_finyn": filters.finyn,
      "@p_doexdiv": filters.doexdiv,
      "@p_inuse": filters.inuse,
      "@p_person": filters.person,
      "@p_lotnum": filters.lotnum,
      "@p_remark": filters.remark,
      "@p_pursiz": filters.pursiz,
      "@p_person1": detailFilters.person,
      "@p_find_row_value": filters.find_row_value,
    },
  };

  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    recdt: new Date(),
    seq1: 0,
    location: "01",
    position: "",
    doexdiv: "A",
    amtunit: "KRW",
    inuse: "10",
    indt: new Date(),
    custcd: "",
    custnm: "",
    userid: userId,
    pc: "",
    taxdiv: "A",
    taxloca: "",
    taxtype: "",
    taxnum: "",
    taxdt: "",
    person: "admin",
    attdatnum: "",
    remark: "",
    baseamt: 0,
    importnum: "",
    auto_transfer: "A",
    pac: "",
    rowstatus_s: "",
    itemgrade_s: "",
    itemcd_s: "",
    itemnm_s: "",
    itemacnt_s: "",
    qty_s: "",
    qtyunit_s: "",
    unitwgt_s: "",
    wgtunit_s: "",
    len_s: "",
    itemthick_s: "",
    width_s: "",
    unpcalmeth_s: "",
    UNPFACTOR_s: "",
    unp_s: "",
    amt_s: "",
    dlramt_s: "",
    wonamt_s: "",
    taxamt_s: "",
    maker_s: "",
    usegb_s: "",
    spec_s: "",
    badcd_s: "",
    BADTEMP_s: "",
    poregnum_s: "",
    lcno_s: "",
    heatno_s: "",
    SONGNO_s: "",
    projectno_s: "",
    lotnum_s: "",
    orglot_s: "",
    boxno_s: "",
    PRTNO_s: "",
    account_s: "",
    qcnum_s: "",
    qcseq_s: "",
    APPNUM_s: "",
    seq2_s: "",
    totwgt_s: "",
    purnum_s: "",
    purseq_s: "",
    ordnum_s: "",
    ordseq_s: "",
    remark_s: "",
    load_place_s: "",
    form_id: "MA_A3300W",
    serviceid: "2207A046",
    reckey: "",
    serialno_s: "",
  });

  const para: Iparameters = {
    procedureName: "P_MA_A3300W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_recdt": convertDateToStr(ParaData.recdt),
      "@p_seq1": ParaData.seq1,
      "@p_location": ParaData.location,
      "@p_position": ParaData.position,
      "@p_doexdiv": ParaData.doexdiv,
      "@p_amtunit": ParaData.amtunit,
      "@p_inuse": ParaData.inuse,
      "@p_indt": convertDateToStr(ParaData.indt),
      "@p_custcd": ParaData.custcd,
      "@p_custnm": ParaData.custnm,
      "@p_taxdiv": ParaData.taxdiv,
      "@p_taxloca": ParaData.taxloca,
      "@p_taxtype": ParaData.taxtype,
      "@p_taxnum": ParaData.taxnum,
      "@p_taxdt": ParaData.taxdt,
      "@p_person": ParaData.person,
      "@p_attdatnum": ParaData.attdatnum,
      "@p_remark": ParaData.remark,
      "@p_baseamt": ParaData.baseamt,
      "@p_importnum": ParaData.importnum,
      "@p_auto_transfer": ParaData.auto_transfer,
      "@p_pac": ParaData.pac,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_itemgrade_s": ParaData.itemgrade_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_itemnm_s": ParaData.itemnm_s,
      "@p_itemacnt_s": ParaData.itemacnt_s,
      "@p_qty_s": ParaData.qty_s,
      "@p_qtyunit_s": ParaData.qtyunit_s,
      "@p_unitwgt_s": ParaData.unitwgt_s,
      "@p_wgtunit_s": ParaData.wgtunit_s,
      "@p_unpcalmeth_s": ParaData.unpcalmeth_s,
      "@p_UNPFACTOR_s": ParaData.UNPFACTOR_s,
      "@p_unp_s": ParaData.unp_s,
      "@p_amt_s": ParaData.amt_s,
      "@p_dlramt_s": ParaData.dlramt_s,
      "@p_wonamt_s": ParaData.wonamt_s,
      "@p_taxamt_s": ParaData.taxamt_s,
      "@p_maker_s": ParaData.maker_s,
      "@p_usegb_s": ParaData.usegb_s,
      "@p_spec_s": ParaData.spec_s,
      "@p_badcd_s": ParaData.badcd_s,
      "@p_BADTEMP_s": ParaData.BADTEMP_s,
      "@p_poregnum_s": ParaData.poregnum_s,
      "@p_lcno_s": ParaData.lcno_s,
      "@p_heatno_s": ParaData.heatno_s,
      "@p_SONGNO_s": ParaData.SONGNO_s,
      "@p_projectno_s": ParaData.projectno_s,
      "@p_lotnum_s": ParaData.lotnum_s,
      "@p_orglot_s": ParaData.orglot_s,
      "@p_boxno_s": ParaData.boxno_s,
      "@p_PRTNO_s": ParaData.PRTNO_s,
      "@p_account_s": ParaData.account_s,
      "@p_qcnum_s": ParaData.qcnum_s,
      "@p_qcseq_s": ParaData.qcseq_s,
      "@p_APPNUM_s": ParaData.APPNUM_s,
      "@p_seq2_s": ParaData.seq2_s,
      "@p_totwgt_s": ParaData.totwgt_s,
      "@p_purnum_s": ParaData.purnum_s,
      "@p_purseq_s": ParaData.purseq_s,
      "@p_ordnum_s": ParaData.ordnum_s,
      "@p_ordseq_s": ParaData.ordseq_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_load_place_s": ParaData.load_place_s,
      "@p_serialno_s": ParaData.serialno_s,
      "@p_form_id": "MA_A3300W",
      "@p_userid": userId,
      "@p_pc": pc,
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

    console.log(para);
    if (data.isSuccess === true) {
      setreload(!reload);
      resetAllGrid();
      setFilters((prev) => ({ ...prev, pgNum: 1, isSearch: true }));

      setParaData({
        pgSize: PAGE_SIZE,
        workType: "N",
        orgdiv: "01",
        recdt: new Date(),
        seq1: 0,
        location: "01",
        position: "",
        doexdiv: "A",
        amtunit: "KRW",
        inuse: "10",
        indt: new Date(),
        custcd: "",
        custnm: "",
        userid: userId,
        pc: "",
        taxdiv: "A",
        taxloca: "",
        taxtype: "",
        taxnum: "",
        taxdt: "",
        person: "admin",
        attdatnum: "",
        remark: "",
        baseamt: 0,
        importnum: "",
        auto_transfer: "A",
        pac: "",
        rowstatus_s: "",
        itemgrade_s: "",
        itemcd_s: "",
        itemnm_s: "",
        itemacnt_s: "",
        qty_s: "",
        qtyunit_s: "",
        unitwgt_s: "",
        wgtunit_s: "",
        len_s: "",
        itemthick_s: "",
        width_s: "",
        unpcalmeth_s: "",
        UNPFACTOR_s: "",
        unp_s: "",
        amt_s: "",
        dlramt_s: "",
        wonamt_s: "",
        taxamt_s: "",
        maker_s: "",
        usegb_s: "",
        spec_s: "",
        badcd_s: "",
        BADTEMP_s: "",
        poregnum_s: "",
        lcno_s: "",
        heatno_s: "",
        SONGNO_s: "",
        projectno_s: "",
        lotnum_s: "",
        orglot_s: "",
        boxno_s: "",
        PRTNO_s: "",
        account_s: "",
        qcnum_s: "",
        qcseq_s: "",
        APPNUM_s: "",
        seq2_s: "",
        totwgt_s: "",
        purnum_s: "",
        purseq_s: "",
        ordnum_s: "",
        ordseq_s: "",
        remark_s: "",
        load_place_s: "",
        form_id: "MA_A3300W",
        serviceid: "2207A046",
        reckey: "",
        serialno_s: "",
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.pc != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "D",
    recdt: "",
    seq1: 0,
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_MA_A3300W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_recdt": paraDataDeleted.recdt,
      "@p_seq1": paraDataDeleted.seq1,
      "@p_location": ParaData.location,
      "@p_position": ParaData.position,
      "@p_doexdiv": ParaData.doexdiv,
      "@p_amtunit": ParaData.amtunit,
      "@p_inuse": ParaData.inuse,
      "@p_indt": convertDateToStr(ParaData.indt),
      "@p_custcd": ParaData.custcd,
      "@p_custnm": ParaData.custnm,
      "@p_taxdiv": ParaData.taxdiv,
      "@p_taxloca": ParaData.taxloca,
      "@p_taxtype": ParaData.taxtype,
      "@p_taxnum": ParaData.taxnum,
      "@p_taxdt": ParaData.taxdt,
      "@p_person": ParaData.person,
      "@p_attdatnum": ParaData.attdatnum,
      "@p_remark": ParaData.remark,
      "@p_baseamt": ParaData.baseamt,
      "@p_importnum": ParaData.importnum,
      "@p_auto_transfer": ParaData.auto_transfer,
      "@p_pac": ParaData.pac,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_itemgrade_s": ParaData.itemgrade_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_itemnm_s": ParaData.itemnm_s,
      "@p_itemacnt_s": ParaData.itemacnt_s,
      "@p_qty_s": ParaData.qty_s,
      "@p_qtyunit_s": ParaData.qtyunit_s,
      "@p_unitwgt_s": ParaData.unitwgt_s,
      "@p_wgtunit_s": ParaData.wgtunit_s,
      "@p_unpcalmeth_s": ParaData.unpcalmeth_s,
      "@p_UNPFACTOR_s": ParaData.UNPFACTOR_s,
      "@p_unp_s": ParaData.unp_s,
      "@p_amt_s": ParaData.amt_s,
      "@p_dlramt_s": ParaData.dlramt_s,
      "@p_wonamt_s": ParaData.wonamt_s,
      "@p_taxamt_s": ParaData.taxamt_s,
      "@p_maker_s": ParaData.maker_s,
      "@p_usegb_s": ParaData.usegb_s,
      "@p_spec_s": ParaData.spec_s,
      "@p_badcd_s": ParaData.badcd_s,
      "@p_BADTEMP_s": ParaData.BADTEMP_s,
      "@p_poregnum_s": ParaData.poregnum_s,
      "@p_lcno_s": ParaData.lcno_s,
      "@p_heatno_s": ParaData.heatno_s,
      "@p_SONGNO_s": ParaData.SONGNO_s,
      "@p_projectno_s": ParaData.projectno_s,
      "@p_lotnum_s": ParaData.lotnum_s,
      "@p_orglot_s": ParaData.orglot_s,
      "@p_boxno_s": ParaData.boxno_s,
      "@p_PRTNO_s": ParaData.PRTNO_s,
      "@p_account_s": ParaData.account_s,
      "@p_qcnum_s": ParaData.qcnum_s,
      "@p_qcseq_s": ParaData.qcseq_s,
      "@p_APPNUM_s": ParaData.APPNUM_s,
      "@p_seq2_s": ParaData.seq2_s,
      "@p_totwgt_s": ParaData.totwgt_s,
      "@p_purnum_s": ParaData.purnum_s,
      "@p_purseq_s": ParaData.purseq_s,
      "@p_ordnum_s": ParaData.ordnum_s,
      "@p_ordseq_s": ParaData.ordseq_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_load_place_s": ParaData.load_place_s,
      "@p_serialno_s": ParaData.serialno_s,
      "@p_form_id": "MA_A3300W",
      "@p_userid": userId,
      "@p_pc": pc,
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
      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt + prev.total,
          };
        });

        if (filters.pgNum !== data.pageNumber) {
          setFilters((prev) => ({ ...prev, pgNum: data.pageNumber }));
        }

        if (filters.find_row_value === "" && data.pageNumber === 1) {
          // 첫번째 행 선택하기
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });

          setDetailFilters((prev) => ({
            ...prev,
            seq1: firstRowData.seq1,
            recdt: toDate(firstRowData.recdt),
            person: firstRowData.person,
          }));
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setFilters((prev) => ({
      ...prev,
      isSearch: false,
    }));
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
    if (customOptionData !== null && filters.isSearch && permissions !== null) {
      setFilters((prev) => ({ ...prev, isSearch: false }));
      fetchMainGrid();
    }
  }, [filters, permissions]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    if (
      customOptionData != null &&
      permissions !== null &&
      bizComponentData !== null
    ) {
      resetDetailGrid();
      if (mainDataResult.total > 0) {
        fetchDetailGrid();
      }
    }
  }, [detailFilters]);

  useEffect(() => {
    if (paraDataDeleted.seq1 !== 0) fetchToDelete();
  }, [paraDataDeleted]);

  let gridRef: any = useRef(null);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (customOptionData !== null) {
      // 저장 후, 선택 행 스크롤 유지 처리
      if (filters.find_row_value !== "" && mainDataResult.total > 0) {
        const ROW_HEIGHT = 35.56;
        const idx = mainDataResult.data.findIndex(
          (item) => idGetter(item) === filters.find_row_value
        );

        const scrollHeight = ROW_HEIGHT * idx;
        gridRef.vs.container.scroll(0, scrollHeight);

        //초기화
        setFilters((prev) => ({
          ...prev,
          find_row_value: "",
        }));
      }
      // 스크롤 상단으로 조회가 가능한 경우, 스크롤 핸들이 스크롤 바 최상단에서 떨어져있도록 처리
      // 해당 처리로 사용자가 스크롤 업해서 연속적으로 조회할 수 있도록 함
      else if (filters.scrollDirrection === "up") {
        gridRef.vs.container.scroll(0, 20);
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
      person: selectedRowData.person,
    }));
  };

  const onDetailSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DETAIL_DATA_ITEM_KEY,
    });
    setDetailSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setBarCodeFilters((prev) => ({
      ...prev,
      recdt: selectedRowData.recdt,
      seq1: selectedRowData.seq1,
      lotnum: selectedRowData.lotnum,
      seq2: selectedRowData.seq2,
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
    if (filters.isSearch) return false; // 한꺼번에 여러번 조회 방지
    let pgNumWithGap =
      filters.pgNum + (filters.scrollDirrection === "up" ? filters.pgGap : 0);

    // 스크롤 최하단 이벤트
    if (chkScrollHandler(event, pgNumWithGap, PAGE_SIZE)) {
      setFilters((prev) => ({
        ...prev,
        scrollDirrection: "down",
        pgNum: pgNumWithGap + 1,
        pgGap: prev.pgGap + 1,
        isSearch: true,
      }));
      return false;
    }

    pgNumWithGap =
      filters.pgNum - (filters.scrollDirrection === "down" ? filters.pgGap : 0);
    // 스크롤 최상단 이벤트
    if (chkScrollHandler(event, pgNumWithGap, PAGE_SIZE, "up")) {
      setFilters((prev) => ({
        ...prev,
        scrollDirrection: "up",
        pgNum: pgNumWithGap - 1,
        pgGap: prev.pgGap + 1,
        isSearch: true,
      }));
    }
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

    const datas = mainDataResult.data.filter(
      (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      recdt: datas.recdt,
      seq1: datas.seq1,
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
      setFilters((prev) => ({ ...prev, pgNum: 1, isSearch: true }));
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
        throw findMessage(messagesData, "MA_A3300W_001");
      } else if (
        filters.location == null ||
        filters.location == undefined ||
        filters.location == ""
      ) {
        throw findMessage(messagesData, "MA_A3300W_002");
      } else {
        resetAllGrid();
        fetchMainGrid();
      }
    } catch (e) {
      alert(e);
    }
  };

  const onDetailHeaderSelectionChange = useCallback(
    (event: GridHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked = checkboxElement.checked;
      const newSelectedState: {
        [id: string]: boolean | number[];
      } = {};

      event.dataItems.forEach((item) => {
        newSelectedState[idGetter(item)] = checked;
      });
    },
    []
  );

  const setCopyData = (data: any, filter: any, deletedMainRows: any) => {
    let valid = true;

    try {
      if (data.length == 0) {
        throw findMessage(messagesData, "MA_A3300W_003");
      } else if (
        convertDateToStr(filter.indt).substring(0, 4) < "1997" ||
        convertDateToStr(filter.indt).substring(6, 8) > "31" ||
        convertDateToStr(filter.indt).substring(6, 8) < "01" ||
        convertDateToStr(filter.indt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_A3300W_001");
      } else if (
        filter.person == "" ||
        filter.person == null ||
        filter.person == undefined
      ) {
        throw findMessage(messagesData, "MA_A3300W_005");
      } else if (
        filter.inuse == "" ||
        filter.inuse == null ||
        filter.inuse == undefined
      ) {
        throw findMessage(messagesData, "MA_A3300W_004");
      } else if (
        filter.amtunit == "" ||
        filter.amtunit == null ||
        filter.amtunit == undefined
      ) {
        throw findMessage(messagesData, "MA_A3300W_006");
      } else if (
        filter.doexdiv == "" ||
        filter.doexdiv == null ||
        filter.doexdiv == undefined
      ) {
        throw findMessage(messagesData, "MA_A3300W_007");
      } else if (
        filter.taxdiv == "" ||
        filter.taxdiv == null ||
        filter.taxdiv == undefined
      ) {
        throw findMessage(messagesData, "MA_A3300W_008");
      }
      for (var i = 0; i < data.length; i++) {
        if (data[i].qty == 0) {
          alert("수량은 필수입니다.");
          return false;
        }
      }
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    setParaData((prev) => ({
      ...prev,
      workType: workType,
      recdt: filter.recdt,
      seq1: filter.seq1,
      position: filter.position,
      doexdiv: filter.doexdiv,
      amtunit: filter.amtunit,
      inuse: filter.inuse,
      indt: filter.indt,
      custcd: filter.custcd,
      custnm: filter.custnm,
      taxdiv: filter.taxdiv,
      taxloca: filter.taxloca,
      taxtype: filter.taxtype,
      taxnum: filter.taxnum,
      taxdt: filter.taxdt,
      person: filter.person,
      attdatnum: filter.attdatnum,
      remark: filter.remark,
      baseamt: filter.baseamt,
      importnum: filter.importnum,
      auto_transfer: filter.auto_transfer,
      pac: filter.pac,
      serialno_s: "",
      pc: pc,
    }));

    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0 && deletedMainRows.length == 0) return false;

    let dataArr: TdataArr = {
      rowstatus_s: [],
      itemgrade_s: [],
      itemcd_s: [],
      itemnm_s: [],
      itemacnt_s: [],
      qty_s: [],
      qtyunit_s: [],
      unitwgt_s: [],
      wgtunit_s: [],
      len_s: [],
      itemthick_s: [],
      width_s: [],
      unpcalmeth_s: [],
      UNPFACTOR_s: [],
      unp_s: [],
      amt_s: [],
      dlramt_s: [],
      wonamt_s: [],
      taxamt_s: [],
      maker_s: [],
      usegb_s: [],
      spec_s: [],
      badcd_s: [],
      BADTEMP_s: [],
      poregnum_s: [],
      lcno_s: [],
      heatno_s: [],
      SONGNO_s: [],
      projectno_s: [],
      lotnum_s: [],
      orglot_s: [],
      boxno_s: [],
      PRTNO_s: [],
      account_s: [],
      qcnum_s: [],
      qcseq_s: [],
      APPNUM_s: [],
      seq2_s: [],
      totwgt_s: [],
      purnum_s: [],
      purseq_s: [],
      ordnum_s: [],
      ordseq_s: [],
      remark_s: [],
      load_place_s: [],
      serialno_s: [],
    };

    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        itemgrade = "",
        itemcd = "",
        itemnm = "",
        itemacnt = "",
        qty = "",
        qtyunit = "",
        unitwgt = "",
        wgtunit = "",
        len = "",
        itemthick = "",
        width = "",
        unpcalmeth = "",
        UNPFACTOR = "",
        unp = "",
        amt = "",
        dlramt = "",
        wonamt = "",
        taxamt = "",
        maker = "",
        usegb = "",
        spec = "",
        badcd = "",
        BADTEMP = "",
        poregnum = "",
        lcno = "",
        heatno = "",
        SONGNO = "",
        projectno = "",
        lotnum = "",
        orglot = "",
        boxno = "",
        PRTNO = "",
        account = "",
        qcnum = "",
        qcseq = "",
        APPNUM = "",
        seq2 = "",
        totwgt = "",
        purnum = "",
        purseq = "",
        ordnum = "",
        ordseq = "",
        remark = "",
        load_place = "",
        indt = "",
        serialno = "",
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.itemgrade_s.push(itemgrade);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemnm_s.push(itemnm);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.unitwgt_s.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgtunit_s.push(wgtunit);
      dataArr.len_s.push(len == "" ? 0 : len);
      dataArr.itemthick_s.push(itemthick == "" ? 0 : itemthick);
      dataArr.width_s.push(width == "" ? 0 : width);
      dataArr.unpcalmeth_s.push(unpcalmeth == "" ? "Q" : unpcalmeth);
      dataArr.UNPFACTOR_s.push(UNPFACTOR == "" ? 0 : UNPFACTOR);
      dataArr.unp_s.push(unp);
      dataArr.amt_s.push(amt);
      dataArr.dlramt_s.push(dlramt == undefined ? dlramt : 0);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.maker_s.push(maker);
      dataArr.usegb_s.push(usegb);
      dataArr.spec_s.push(spec);
      dataArr.badcd_s.push(badcd);
      dataArr.BADTEMP_s.push(BADTEMP);
      dataArr.poregnum_s.push(poregnum);
      dataArr.lcno_s.push(lcno);
      dataArr.heatno_s.push(heatno);
      dataArr.SONGNO_s.push(SONGNO);
      dataArr.projectno_s.push(projectno);
      dataArr.lotnum_s.push(lotnum);
      dataArr.orglot_s.push(orglot);
      dataArr.boxno_s.push(boxno);
      dataArr.PRTNO_s.push(PRTNO);
      dataArr.account_s.push(account);
      dataArr.qcnum_s.push(qcnum);
      dataArr.qcseq_s.push(qcseq == "" ? 0 : qcseq);
      dataArr.APPNUM_s.push(APPNUM);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.purnum_s.push(purnum);
      dataArr.purseq_s.push(purseq == "" ? 0 : purseq);
      dataArr.ordnum_s.push(ordnum);
      dataArr.ordseq_s.push(ordseq == "" ? 0 : ordseq);
      dataArr.remark_s.push(remark);
      dataArr.load_place_s.push(load_place);
      dataArr.serialno_s.push("");
    });
    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        itemgrade = "",
        itemcd = "",
        itemnm = "",
        itemacnt = "",
        qty = "",
        qtyunit = "",
        unitwgt = "",
        wgtunit = "",
        len = "",
        itemthick = "",
        width = "",
        unpcalmeth = "",
        UNPFACTOR = "",
        unp = "",
        amt = "",
        dlramt = "",
        wonamt = "",
        taxamt = "",
        maker = "",
        usegb = "",
        spec = "",
        badcd = "",
        BADTEMP = "",
        poregnum = "",
        lcno = "",
        heatno = "",
        SONGNO = "",
        projectno = "",
        lotnum = "",
        orglot = "",
        boxno = "",
        PRTNO = "",
        account = "",
        qcnum = "",
        qcseq = "",
        APPNUM = "",
        seq2 = "",
        totwgt = "",
        purnum = "",
        purseq = "",
        ordnum = "",
        ordseq = "",
        remark = "",
        load_place = "",
        serialno = "",
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.itemgrade_s.push(itemgrade);
      dataArr.itemcd_s.push(itemcd);
      dataArr.itemnm_s.push(itemnm);
      dataArr.itemacnt_s.push(itemacnt);
      dataArr.qty_s.push(qty == "" ? 0 : qty);
      dataArr.qtyunit_s.push(qtyunit);
      dataArr.unitwgt_s.push(unitwgt == "" ? 0 : unitwgt);
      dataArr.wgtunit_s.push(wgtunit);
      dataArr.len_s.push(len == "" ? 0 : len);
      dataArr.itemthick_s.push(itemthick == "" ? 0 : itemthick);
      dataArr.width_s.push(width == "" ? 0 : width);
      dataArr.unpcalmeth_s.push(unpcalmeth == "" ? "Q" : unpcalmeth);
      dataArr.UNPFACTOR_s.push(UNPFACTOR == "" ? 0 : UNPFACTOR);
      dataArr.unp_s.push(unp);
      dataArr.amt_s.push(amt);
      dataArr.dlramt_s.push(dlramt == undefined ? dlramt : 0);
      dataArr.wonamt_s.push(wonamt == "" ? 0 : wonamt);
      dataArr.taxamt_s.push(taxamt == "" ? 0 : taxamt);
      dataArr.maker_s.push(maker);
      dataArr.usegb_s.push(usegb);
      dataArr.spec_s.push(spec);
      dataArr.badcd_s.push(badcd);
      dataArr.BADTEMP_s.push(BADTEMP);
      dataArr.poregnum_s.push(poregnum);
      dataArr.lcno_s.push(lcno);
      dataArr.heatno_s.push(heatno);
      dataArr.SONGNO_s.push(SONGNO);
      dataArr.projectno_s.push(projectno);
      dataArr.lotnum_s.push(lotnum);
      dataArr.orglot_s.push(orglot);
      dataArr.boxno_s.push(boxno);
      dataArr.PRTNO_s.push(PRTNO);
      dataArr.account_s.push(account);
      dataArr.qcnum_s.push(qcnum);
      dataArr.qcseq_s.push(qcseq == "" ? 0 : qcseq);
      dataArr.APPNUM_s.push(APPNUM);
      dataArr.seq2_s.push(seq2 == "" ? 0 : seq2);
      dataArr.totwgt_s.push(totwgt == "" ? 0 : totwgt);
      dataArr.purnum_s.push(purnum);
      dataArr.purseq_s.push(purseq == "" ? 0 : purseq);
      dataArr.ordnum_s.push(ordnum);
      dataArr.ordseq_s.push(ordseq == "" ? 0 : ordseq);
      dataArr.remark_s.push(remark);
      dataArr.load_place_s.push(load_place);
      dataArr.serialno_s.push("");
    });
    setParaData((prev) => ({
      ...prev,
      workType: workType,
      outdt: filter.outdt,
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      itemgrade_s: dataArr.itemgrade_s.join("|"),
      itemcd_s: dataArr.itemcd_s.join("|"),
      itemnm_s: dataArr.itemnm_s.join("|"),
      itemacnt_s: dataArr.itemacnt_s.join("|"),
      qty_s: dataArr.qty_s.join("|"),
      qtyunit_s: dataArr.qtyunit_s.join("|"),
      unitwgt_s: dataArr.unitwgt_s.join("|"),
      wgtunit_s: dataArr.wgtunit_s.join("|"),
      len_s: dataArr.len_s.join("|"),
      itemthick_s: dataArr.itemthick_s.join("|"),
      width_s: dataArr.width_s.join("|"),
      unpcalmeth_s: dataArr.unpcalmeth_s.join("|"),
      UNPFACTOR_s: dataArr.UNPFACTOR_s.join("|"),
      unp_s: dataArr.unp_s.join("|"),
      amt_s: dataArr.amt_s.join("|"),
      dlramt_s: dataArr.dlramt_s.join("|"),
      wonamt_s: dataArr.wonamt_s.join("|"),
      taxamt_s: dataArr.taxamt_s.join("|"),
      maker_s: dataArr.maker_s.join("|"),
      usegb_s: dataArr.usegb_s.join("|"),
      spec_s: dataArr.spec_s.join("|"),
      badcd_s: dataArr.badcd_s.join("|"),
      BADTEMP_s: dataArr.BADTEMP_s.join("|"),
      poregnum_s: dataArr.poregnum_s.join("|"),
      lcno_s: dataArr.lcno_s.join("|"),
      heatno_s: dataArr.heatno_s.join("|"),
      SONGNO_s: dataArr.SONGNO_s.join("|"),
      projectno_s: dataArr.projectno_s.join("|"),
      lotnum_s: dataArr.lotnum_s.join("|"),
      orglot_s: dataArr.orglot_s.join("|"),
      boxno_s: dataArr.boxno_s.join("|"),
      PRTNO_s: dataArr.PRTNO_s.join("|"),
      account_s: dataArr.account_s.join("|"),
      qcnum_s: dataArr.qcnum_s.join("|"),
      qcseq_s: dataArr.qcseq_s.join("|"),
      APPNUM_s: dataArr.APPNUM_s.join("|"),
      seq2_s: dataArr.seq2_s.join("|"),
      totwgt_s: dataArr.totwgt_s.join("|"),
      purnum_s: dataArr.purnum_s.join("|"),
      purseq_s: dataArr.purseq_s.join("|"),
      ordnum_s: dataArr.ordnum_s.join("|"),
      ordseq_s: dataArr.ordseq_s.join("|"),
      remark_s: dataArr.remark_s.join("|"),
      load_place_s: dataArr.load_place_s.join("|"),
      serialno_s: dataArr.serialno_s.join("|"),
    }));
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  return (
    <>
      <TitleContainer>
        <Title>기타입고</Title>

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
              <th>사업부</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="position"
                    value={filters.position}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
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
            </tr>
            <tr>
              <th>비고</th>
              <td>
                <Input
                  name="remark"
                  type="text"
                  value={filters.remark}
                  onChange={filterInputChange}
                />
              </td>
              <th>발주규격</th>
              <td>
                <Input
                  name="pursiz"
                  type="text"
                  value={filters.pursiz}
                  onChange={filterInputChange}
                />
              </td>
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
              <th>검사유무</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="finyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
              <th>입고용도</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="inuse"
                    value={filters.inuse}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
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
                기타입고생성
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                기타입고삭제
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
                inuse: inuseListData.find(
                  (item: any) => item.sub_code === row.inuse
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
                          : NumberField.includes(item.fieldName)
                          ? NumberCell
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0
                          ? mainTotalFooterCell
                          : NumberField.includes(item.fieldName)
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
              itemlvl1: itemlvl1ListData.find(
                (item: any) => item.sub_code === row.itemlvl1
              )?.code_name,
              qtyunit: qtyunitListData.find(
                (item: any) => item.sub_code === row.qtyunit
              )?.code_name,
              pac: pacListData.find((item: any) => item.sub_code === row.pac)
                ?.code_name,
              [SELECTED_FIELD]: detailselectedState[idGetter2(row)],
            })),
            detailDataState
          )}
          {...detailDataState}
          onDataStateChange={onDetailDataStateChange}
          onHeaderSelectionChange={onDetailHeaderSelectionChange}
          dataItemKey={DETAIL_DATA_ITEM_KEY}
          selectedField={SELECTED_FIELD}
          selectable={{
            enabled: true,
            mode: "single",
          }}
          onSelectionChange={onDetailSelectionChange}
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
                        : DateField.includes(item.fieldName)
                        ? DateCell
                        : undefined
                    }
                    footerCell={
                      item.sortOrder === 1
                        ? detailTotalFooterCell
                        : NumberField.includes(item.fieldName)
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
              (item) =>
                item.recnum == Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item.recnum == Object.getOwnPropertyNames(selectedState)[0]
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
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          para={"MA_A2700W"}
        />
      )}
    </>
  );
};

export default MA_A3300W;
