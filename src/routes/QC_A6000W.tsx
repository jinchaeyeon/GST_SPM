import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
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
  GridHeaderSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { IAttachmentData, IWindowPosition } from "../hooks/interfaces";
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
  GridContainerWrap,
  FormBoxWrap,
  FormBox,
  ButtonInGridInput,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import {
  Input,
  TextArea,
  NumericTextBoxChangeEvent,
  NumericTextBox,
} from "@progress/kendo-react-inputs";
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
  toDate,
  getGridItemChangedData,
  convertDateToStrWithTime2,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/SA_A5000W_Window";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import RadioGroupCell from "../components/Cells/RadioGroupCell";
import Badwindow from "../components/Windows/CommonWindows/BadWindow";

const DATA_ITEM_KEY = "num";

type TdataArr = {
  rowstatus_s: string[];
  renum_s: string[];
  reseq_s: string[];
  itemcd_s: string[];
  person_s: string[];
  lotnum_s: string[];
  badqty_s: string[];
  qcdecision: string[];
  qcdt_s: string[];
  qcnum_s: string[];
  badcd_s: string[];
  badnum_s: string[];
  badseq_s: string[];
  eyeqc_s: string[];
  chkqty_s: string[];
  remark_s: string[];
};

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_sysUserMaster_001", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal = field === "person" ? "L_sysUserMaster_001" : "";
  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell
      bizComponent={bizComponent}
      textField={"user_name"}
      valueField={"user_id"}
      {...props}
    />
  ) : (
    <td />
  );
};

export const FormContext = createContext<{
  bool: boolean;
  setBool: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);
const ColumnCommandCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    className = "",
  } = props;
  const { bool, setBool, mainDataState, setMainDataState } =
    useContext(FormContext);
  let isInEdit = field === dataItem.inEdit;
  const value = field && dataItem[field] ? dataItem[field] : 0;

  const [badWindowVisible, setBadWindowVisible] = useState<boolean>(false);
  const onAttWndClick = () => {
    setBadWindowVisible(true);
  };
  const getBadData = () => {
    setBool(!bool);
  };
  const defaultRendering = (
    <td
      className={className}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
      style={{ position: "relative" }}
    >
      {value}
      <ButtonInGridInput>
        <Button
          name="itemcd"
          onClick={onAttWndClick}
          icon="more-horizontal"
          fillMode="flat"
        />
      </ButtonInGridInput>
    </td>
  );
  return (
    <>
      {render === undefined
        ? null
        : render?.call(undefined, defaultRendering, props)}
      {badWindowVisible && (
        <Badwindow
          setVisible={setBadWindowVisible}
          setData={getBadData}
          workType={"FILTER"}
          renum={dataItem.renum}
        />
      )}
    </>
  );
};

const CustomRadioCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("R_MA034", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal = field == "qcdecision" ? "R_MA034" : "";
  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <RadioGroupCell bizComponentData={bizComponent} {...props} />
  ) : (
    <td />
  );
};

const QC_A6000: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const [bool, setBool] = useState<boolean>(false);
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
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_PR010, L_sysUserMaster_001, L_fxcode, L_PR010, L_QCYN,L_QC006,L_QC100",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [usersListData, setUsersListData] = useState([
    { user_id: "", user_name: "" },
  ]);

  const [proccdListData, setProccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );
      const userQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );
      fetchQuery(proccdQueryStr, setProccdListData);
      fetchQuery(userQueryStr, setUsersListData);
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

  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);

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
    frdt: new Date(),
    todt: new Date(),
    itemcd: "",
    itemnm: "",
    bnatur: "",
    renum: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_QC_A6000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "Q",
      "@p_orgdiv": filters.orgdiv,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_bnatur": filters.bnatur,
      "@p_renum": filters.renum,
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    qcno: "",
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_QC_A3000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": "01",
      "@p_qcdt": "",
      "@p_person": "",
      "@p_qcno": paraDataDeleted.qcno,
      "@p_qcqty": 0,
      "@p_badqty": 0,
      "@p_strtime": "",
      "@p_endtime": "",
      "@p_qcdecision": "",
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_itemcd": "",
      "@p_rowstatus_s": "",
      "@p_qcseq_s": "",
      "@p_stdnum_s": "",
      "@p_stdrev_s": "",
      "@p_stdseq_s": "",
      "@p_qc_sort_s": "",
      "@p_inspeccd_s": "",
      "@p_qc_spec_s": "",
      "@p_qcvalue1_s": "",
      "@p_qcresult1_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_QC_A3000W",
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
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          qcdt: toDate(row.qcdt),
        };
      });

      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
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

  useEffect(() => {
    fetchMainGrid();
  }, [bool]);

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (customOptionData !== null && isInitSearch === false) {
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
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

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

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
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

  const onAddClick = () => {
    const data = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onItemWndClick = () => {
    setItemWindowVisible(true);
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
    paraDataDeleted.qcno = "";
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

  const search = () => {
    try {
      if (
        convertDateToStr(filters.frdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.frdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.frdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.frdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A6000W_001");
      } else if (
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A6000W_001");
      }
    } catch (e) {
      alert(e);
    }
    fetchMainGrid();
  };
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    location: "01",
    badrenum: "",
    rowstatus_s: "",
    renum_s: "",
    reseq_s: "",
    itemcd_s: "",
    person_s: "",
    lotnum_s: "",
    badqty_s: "",
    qcdecision: "",
    qcdt_s: "",
    qcnum_s: "",
    badcd_s: "",
    badnum_s: "",
    badseq_s: "",
    eyeqc_s: "",
    chkqty_s: "",
    remark_s: "",
    userid: userId,
    pc: pc,
  });

  const para: Iparameters = {
    procedureName: "P_QC_A6000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_location": ParaData.location,
      "@p_badrenum": ParaData.badrenum,
      "@p_row_status_s": ParaData.rowstatus_s,
      "@p_renum_s": ParaData.renum_s,
      "@p_reseq_s": ParaData.reseq_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_person_s": ParaData.person_s,
      "@p_lotnum_s": ParaData.lotnum_s,
      "@p_badqty_s": ParaData.badqty_s,
      "@p_qcdecision_s": ParaData.qcdecision,
      "@p_qcdt_s": ParaData.qcdt_s,
      "@p_qcnum_s": ParaData.qcnum_s,
      "@p_badcd_s": ParaData.badcd_s,
      "@p_badnum_s": ParaData.badnum_s,
      "@p_badseq_s": ParaData.badseq_s,
      "@p_eyeqc_s": ParaData.eyeqc_s,
      "@p_chkqty_s": ParaData.chkqty_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_QC_A6000W",
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
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.qcdecision != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  const onMainItemChange = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
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

  const enterEdit = (dataItem: any, field: string) => {
    if (
      field == "qcdt" ||
      field == "qcdecision" ||
      field == "person" ||
      field == "badqty"
    ) {
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

      setIfSelectFirstRow(false);
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
    setIfSelectFirstRow(false);
    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
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

  const createColumn = () => {
    const array = [];
    array.push(
      <GridColumn
        field={"proddt"}
        title={"생산일자"}
        width="120px"
        cell={DateCell}
        footerCell={mainTotalFooterCell}
      />
    );
    array.push(<GridColumn field={"itemnm"} title={"품목명"} width="150px" />);
    array.push(<GridColumn field={"custnm"} title={"업체명"} width="150px" />);
    array.push(
      <GridColumn field={"rcvcustnm"} title={"인수처"} width="150px" />
    );
    array.push(<GridColumn field={"project"} title={"공사명"} width="150px" />);
    array.push(
      <GridColumn
        field={"extra_field1"}
        title={"외경"}
        width="100px"
        cell={NumberCell}
        footerCell={gridSumQtyFooterCell}
      />
    );
    array.push(
      <GridColumn
        field={"extra_field2"}
        title={"두께"}
        width="100px"
        cell={NumberCell}
        footerCell={gridSumQtyFooterCell}
      />
    );
    array.push(
      <GridColumn
        field={"len"}
        title={"길이"}
        width="100px"
        cell={NumberCell}
        footerCell={gridSumQtyFooterCell}
      />
    );
    array.push(<GridColumn field={"insiz"} title={"규격"} width="150px" />);
    array.push(<GridColumn field={"proccd"} title={"공정"} width="150px" />);
    array.push(
      <GridColumn
        field={"qty"}
        title={"실적수량"}
        width="100px"
        cell={NumberCell}
        footerCell={gridSumQtyFooterCell}
      />
    );
    array.push(<GridColumn field={"lotnum"} title={"LOT NO"} width="150px" />);
    array.push(<GridColumn field={"prodemp"} title={"작업자"} width="120px" />);
    array.push(
      <GridColumn field={"itemcd"} title={"품목코드"} width="150px" />
    );
    return array;
  };

  const createColumn2 = () => {
    const array = [];
    array.push(
      <GridColumn
        field={"qcdt"}
        title={"검사일자"}
        width="120px"
        cell={DateCell}
      />
    );
    array.push(
      <GridColumn
        field={"qcdecision"}
        title={"합부판정"}
        width="200px"
        cell={CustomRadioCell}
      />
    );
    array.push(
      <GridColumn
        field={"person"}
        title={"검사자"}
        width="120px"
        cell={CustomComboBoxCell}
      />
    );
    array.push(
      <GridColumn
        field={"badqty"}
        title={"불량수량"}
        width="100px"
        cell={ColumnCommandCell}
      />
    );
    return array;
  };

  const onSaveClick = () => {
    const data = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    try {
      if (data.qcdecision == "") {
        throw findMessage(messagesData, "QC_A6000W_002");
      } else {
        const dataItem = mainDataResult.data.filter((item: any) => {
          return (
            (item.rowstatus === "N" || item.rowstatus === "U") &&
            item.rowstatus !== undefined
          );
        });
        if (dataItem.length === 0) return false;
        let dataArr: TdataArr = {
          rowstatus_s: [],
          renum_s: [],
          reseq_s: [],
          itemcd_s: [],
          person_s: [],
          lotnum_s: [],
          badqty_s: [],
          qcdecision: [],
          qcdt_s: [],
          qcnum_s: [],
          badcd_s: [],
          badnum_s: [],
          badseq_s: [],
          eyeqc_s: [],
          chkqty_s: [],
          remark_s: [],
        };
        dataItem.forEach((item: any, idx: number) => {
          const {
            renum = "",
            rowstatus = "",
            reseq = "",
            itemcd = "",
            prodemp = "",
            lotnum = "",
            badqty = "",
            badcd = "",
            qcdecision = "",
            qcdt = "",
            qcnum = "",
            eyeqc = "",
            chkqty = "",
            remark = "",
          } = item;
          dataArr.rowstatus_s.push(rowstatus);
          dataArr.renum_s.push(renum);
          dataArr.reseq_s.push(reseq);
          dataArr.itemcd_s.push(itemcd);
          dataArr.person_s.push(prodemp);
          dataArr.lotnum_s.push(lotnum);
          dataArr.badcd_s.push(badcd == undefined ? "" : badcd);
          dataArr.badqty_s.push(badqty);
          dataArr.qcdecision.push(qcdecision);
          dataArr.qcdt_s.push(convertDateToStr(qcdt));
          dataArr.qcnum_s.push(qcnum);
          dataArr.eyeqc_s.push(eyeqc == undefined ? "" : eyeqc);
          dataArr.chkqty_s.push(chkqty == undefined ? "" : chkqty);
          dataArr.remark_s.push(remark == undefined ? "" : remark);
        });

        setParaData((prev) => ({
          ...prev,
          badrenum: dataArr.renum_s.join("|"),
          rowstatus_s: dataArr.rowstatus_s.join("|"),
          renum_s: dataArr.renum_s.join("|"),
          reseq_s: dataArr.reseq_s.join("|"),
          itemcd_s: dataArr.itemcd_s.join("|"),
          person_s: dataArr.person_s.join("|"),
          lotnum_s: dataArr.lotnum_s.join("|"),
          badqty_s: dataArr.badqty_s.join("|"),
          qcdecision: dataArr.qcdecision.join("|"),
          qcdt_s: dataArr.qcdt_s.join("|"),
          qcnum_s: dataArr.qcnum_s.join("|"),
          badcd_s: dataArr.badcd_s.join("|"),
          badnum_s: "",
          badseq_s: "",
          eyeqc_s: dataArr.eyeqc_s.join("|"),
          chkqty_s: dataArr.chkqty_s.join("|"),
          remark_s: dataArr.remark_s.join("|"),
        }));
      }
    } catch (e) {
      alert(e);
    }
  };

  return (
    <>
      <TitleContainer>
        <Title>최종검사</Title>

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
              <th>생산일자</th>
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
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <FormContext.Provider
        value={{
          bool,
          setBool,
          mainDataState,
          setMainDataState,
          // fetchGrid,
        }}
      >
        <GridContainer>
          <GridTitleContainer>
            <GridTitle>기본정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onSaveClick}
                fillMode="outline"
                themeColor={"primary"}
                icon="save"
              ></Button>
            </ButtonContainer>
          </GridTitleContainer>
          <ExcelExport
            data={mainDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <Grid
              style={{ height: "80vh" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  proccd: proccdListData.find(
                    (item: any) => item.sub_code == row.proccd
                  )?.code_name,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  prodemp: usersListData.find(
                    (item: any) => item.user_id === row.prodemp
                  )?.user_name,
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
              onItemChange={onMainItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn field="rowstatus" title=" " width="50px" />
              <GridColumn title="생산실적정보">{createColumn()}</GridColumn>
              <GridColumn title="검사정보">{createColumn2()}</GridColumn>
            </Grid>
          </ExcelExport>
        </GridContainer>
      </FormContext.Provider>
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
    </>
  );
};

export default QC_A6000;
