import {
  useEffect,
  useState,
  useCallback,
  useContext,
  createContext,
} from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
  GridCellProps,
} from "@progress/kendo-react-grid";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import { TextArea, InputChangeEvent } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import CustomersWindow from "./CommonWindows/CustomersWindow";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import CopyWindow5 from "./MA_A2700W_BOM_Window";
import CopyWindow4 from "./MA_A2700W_Orders_Window";
import CopyWindow3 from "./MA_A3400W_Inven_Window";
import CopyWindow2 from "./BA_A0080W_Copy_Window";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  ButtonInInput,
  GridTitleContainer,
  FormBoxWrap,
  FormBox,
  GridTitle,
  ButtonInGridInput,
} from "../../CommonStyled";
import { useRecoilState } from "recoil";
import { Input } from "@progress/kendo-react-inputs";
import { Iparameters } from "../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import {
  chkScrollHandler,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  getQueryFromBizComponent,
  UseParaPc,
  toDate,
  convertDateToStr,
  getGridItemChangedData,
  dateformat,
  isValidDate,
} from "../CommonFunction";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { loginResultState } from "../../store/atoms";
import { IWindowPosition, IAttachmentData } from "../../hooks/interfaces";
import { PAGE_SIZE, SELECTED_FIELD } from "../CommonString";
import { COM_CODE_DEFAULT_VALUE, EDIT_FIELD } from "../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../store/atoms";
import CustomOptionComboBox from "../ComboBoxes/CustomOptionComboBox";
import NumberCell from "../Cells/NumberCell";
import DateCell from "../Cells/DateCell";
import ComboBoxCell from "../Cells/ComboBoxCell";
type IWindow = {
  workType: "N" | "U";
  data?: Idata;
  setVisible(t: boolean): void;
  setData(data: object, filter: object, deletedMainRows: object): void;
  reload: boolean; //data : 선택한 품목 데이터를 전달하는 함수
};

export const FormContext = createContext<{
  itemcd: string;
  itemnm: string;
  setItemcd: (d: any) => void;
  setItemnm: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

type Idata = {
  orgdiv: string;
  recdt: string;
  seq1: number;
  location: string;
  position: string;
  doexdiv: string;
  amtunit: string;
  intype: string;
  inuse: string;
  inoutdiv: string;
  indt: string;
  custcd: string;
  custnm: string;
  rcvcustcd: string;
  rcvcustnm: string;
  taxdiv: string;
  taxloca: string;
  taxtype: string;
  taxnum: string;
  taxdt: string;
  person: string;
  attdatnum: string;
  remark: string;
  baseamt: number;
  importnum: string;
  auto_transfer: string;
  pac: string;
  recnum: string;
  files: string;
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
let deletedMainRows: object[] = [];

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA016, L_BA171, L_BA061,L_BA015", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "pac"
      ? "L_BA016"
      : field === "itemlvl1"
      ? "L_BA171"
      : field === "qtyunit"
      ? "L_BA015"
      : field === "itemacnt"
      ? "L_BA061"
      : "";

  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell bizComponent={bizComponent} {...props} />
  ) : (
    <td />
  );
};

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
  const {
    itemcd,
    itemnm,
    setItemcd,
    setItemnm,
    mainDataState,
    setMainDataState,
  } = useContext(FormContext);
  let isInEdit = field === dataItem.inEdit;
  const value = field && dataItem[field] ? dataItem[field] : "";

  const handleChange = (e: InputChangeEvent) => {
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
  const [itemWindowVisible2, setItemWindowVisible2] = useState<boolean>(false);
  const onItemWndClick2 = () => {
    setItemWindowVisible2(true);
  };
  const setItemData2 = (data: IItemData) => {
    setItemcd(data.itemcd);
    setItemnm(data.itemnm);
  };
  const defaultRendering = (
    <td
      className={className}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
      style={{ position: "relative" }}
    >
      {isInEdit ? (
        <Input value={value} onChange={handleChange} type="text" />
      ) : (
        value
      )}
      <ButtonInGridInput>
        <Button
          name="itemcd"
          onClick={onItemWndClick2}
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
      {itemWindowVisible2 && (
        <ItemsWindow
          setVisible={setItemWindowVisible2}
          workType={"FILTER"}
          setData={setItemData2}
        />
      )}
    </>
  );
};
const CopyWindow = ({
  workType,
  data,
  setVisible,
  setData,
  reload,
}: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1600,
    height: 900,
  });
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const DATA_ITEM_KEY = "num";
  const [itemcd, setItemcd] = useState<string>("");
  const [itemnm, setItemnm] = useState<string>("");
  const idGetter = getter(DATA_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  //메시지 조회
  const pathname: string = window.location.pathname.replace("/", "");
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);
  useEffect(() => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    fetchMainGrid();
  }, [reload]);
  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null && workType != "U") {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        position: defaultOption.find((item: any) => item.id === "position")
          .valueCode,
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
        doexdiv: defaultOption.find((item: any) => item.id === "doexdiv")
          .valueCode,
        taxdiv: defaultOption.find((item: any) => item.id === "taxdiv")
          .valueCode,
        auto_transfer: defaultOption.find(
          (item: any) => item.id === "auto_transfer"
        ).valueCode,
        inuse: defaultOption.find((item: any) => item.id === "inuse").valueCode,
        amtunit: defaultOption.find((item: any) => item.id === "amtunit")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [CopyWindowVisible, setCopyWindowVisible] = useState<boolean>(false);
  const [CopyWindowVisible2, setCopyWindowVisible2] = useState<boolean>(false);
  const [CopyWindowVisible3, setCopyWindowVisible3] = useState<boolean>(false);
  const [CopyWindowVisible4, setCopyWindowVisible4] = useState<boolean>(false);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [isInitSearch, setIsInitSearch] = useState(false);
  const [mainPgNum, setMainPgNum] = useState(1);
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

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
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

  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const processApi = useApi();

  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    orgdiv: "01",
    recdt: new Date(),
    seq1: 0,
    location: "01",
    position: "",
    doexdiv: "A",
    amtunit: "KRW",
    intype: "",
    inuse: "10",
    inoutdiv: "",
    indt: new Date(),
    custcd: "",
    custnm: "",
    rcvcustcd: "",
    rcvcustnm: "",
    userid: userId,
    pc: pc,
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
    pac_s: "",
    itemlvl1_s: "",
    enddt_s: "",
    extra_field1_s: "",
    form_id: "MA_A2700W",
    serviceid: "2207A046",
    reckey: "",
    files: "",
  });

  const parameters: Iparameters = {
    procedureName: "P_MA_A2700W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": filters.position,
      "@p_frdt": "",
      "@p_todt": "",
      "@p_recdt": convertDateToStr(filters.recdt),
      "@p_seq1": filters.seq1,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": "",
      "@p_itemnm": "",
      "@p_finyn": "",
      "@p_doexdiv": filters.doexdiv,
      "@p_inuse": filters.inuse,
      "@p_person": filters.person,
      "@p_lotnum": "",
      "@p_remark": filters.remark,
      "@p_pursiz": "",
      "@p_seq2_s": "",
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
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
        };
      });
      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
        setIsInitSearch(true);
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const onCopyClick = () => {
    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    const selectRow = mainDataResult.data.filter(
      (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    const newDataItem = {
      [DATA_ITEM_KEY]: seq + 1,
      amt: selectRow.amt,
      amtunit: selectRow.amtunit,
      chk: selectRow.chk,
      custcd: selectRow.custcd,
      custnm: selectRow.custnm,
      insiz: selectRow.insiz,
      itemacnt: selectRow.itemacnt,
      itemcd: selectRow.itemcd,
      itemlvl1: selectRow.itemlvl1,
      itemlvl2: selectRow.itemlvl2,
      itemlvl3: selectRow.itemlvl3,
      itemnm: selectRow.itemnm,
      itemno: selectRow.itemno,
      itemthick: selectRow.itemthick,
      len: selectRow.len,
      lev: selectRow.lev,
      lotnum: selectRow.lotnum,
      need_qty: selectRow.need_qty,
      needqty: selectRow.needqty,
      nowqty: selectRow.nowqty,
      ordkey: selectRow.ordkey,
      ordnum: selectRow.ordnum,
      ordseq: selectRow.ordseq,
      pac: selectRow.pac,
      poregnum: selectRow.poregnum,
      project: selectRow.project,
      qty: selectRow.qty,
      qtyunit: selectRow.qtyunit,
      rowstatus: "N",
      safeqty: selectRow.safeqty,
      selected: selectRow.selected,
      singular: selectRow.singular,
      spec: selectRow.spec,
      taxamt: selectRow.taxamt,
      taxdiv: selectRow.taxdiv,
      totwgt: selectRow.totwgt,
      unitwgt: selectRow.unitwgt,
      unp: selectRow.unp,
      wgtunit: selectRow.wgtunit,
      width: selectRow.width,
      wonamt: selectRow.wonamt,
    };

    setMainDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onAddClick = () => {
    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    const newDataItem = {
      [DATA_ITEM_KEY]: seq,
      itemgrade: "",
      itemcd: "",
      itemnm: "",
      itemacnt: "",
      qty: 1,
      qtyunit: "",
      unitwgt: 0,
      wgtunit: "",
      len: 0,
      itemthick: 0,
      width: 0,
      unpcalmeth: "Q",
      UNPFACTOR: 0,
      unp: 0,
      amt: 0,
      dlramt: 0,
      wonamt: 0,
      taxamt: 0,
      maker: "",
      usegb: "",
      spec: "",
      badcd: "",
      BADTEMP: "",
      poregnum: "",
      lcno: "",
      heatno: "",
      SONGNO: "",
      projectno: "",
      lotnum: "",
      orglot: "",
      boxno: "",
      PRTNO: "",
      account: "",
      qcnum: "",
      qcseq: 0,
      APPNUM: "",
      seq2: 0,
      totwgt: 0,
      purnum: "",
      purseq: 0,
      ordnum: "",
      ordseq: 0,
      remark: "",
      load_place: "",
      pac: "A",
      itemlvl1: "",
      enddt: null,
      extra_field1: "",
      rowstatus: "N",
    };

    setMainDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  useEffect(() => {
    if (workType != "N" && isInitSearch === false) {
      fetchMainGrid();
    }
  }, [filters]);

  useEffect(() => {
    if (customOptionData !== null && workType === "U") {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    if (workType === "U" && data != undefined) {
      setFilters((prev) => ({
        ...prev,
        orgdiv: data.orgdiv,
        recdt: toDate(data.recdt),
        seq1: data.seq1,
        location: data.location,
        position: data.position,
        doexdiv: data.doexdiv,
        amtunit: data.amtunit,
        intype: data.intype,
        inuse: data.inuse,
        inoutdiv: data.inoutdiv,
        indt: toDate(data.indt),
        custcd: data.custcd,
        custnm: data.custnm,
        rcvcustcd: data.rcvcustcd,
        rcvcustnm: data.rcvcustnm,
        taxdiv: data.taxdiv,
        taxloca: data.taxloca,
        taxtype: data.taxtype,
        taxnum: data.taxnum,
        taxdt: data.taxdt,
        person: data.person,
        attdatnum: data.attdatnum,
        remark: data.remark,
        baseamt: data.baseamt,
        importnum: data.importnum,
        auto_transfer: data.auto_transfer,
        pac: data.pac,
        reckey: data.recnum,
        files: data.files,
      }));
    }
  }, []);

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

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
    // setyn(true);
    setIfSelectFirstRow(false);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  //스크롤 핸들러
  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onCopyWndClick = () => {
    setCopyWindowVisible(true);
  };

  const onCopyWndClick2 = () => {
    setCopyWindowVisible2(true);
  };

  const onCopyWndClick3 = () => {
    setCopyWindowVisible3(true);
  };
  const onCopyWndClick4 = () => {
    setCopyWindowVisible4(true);
  };
  const getAttachmentsData = (data: IAttachmentData) => {
    setFilters((prev: any) => {
      return {
        ...prev,
        attdatnum: data.attdatnum,
        files:
          data.original_name +
          (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      };
    });
  };

  const setCopyData2 = (data: any) => {
    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0) return false;

    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    for (var i = 1; i < data.length; i++) {
      if (data[0].num == data[i].num) {
        alert("중복되는 품목이있습니다.");
        return false;
      }
    }

    for (var i = 0; i < data.length; i++) {
      data[i].num = seq;
      seq++;
    }

    try {
      data.map((item: any) => {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, item],
            total: prev.total + 1,
          };
        });
      });
    } catch (e) {
      alert(e);
    }
  };
  const setCopyData3 = (data: any) => {
    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0) return false;

    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    for (var i = 0; i < data.length; i++) {
      data[i].num = seq;
      seq++;
    }

    try {
      data.map((item: any) => {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, item],
            total: prev.total + 1,
          };
        });
      });
    } catch (e) {
      alert(e);
    }
  };

  const setCopyData4 = (data: any) => {
    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0) return false;

    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    for (var i = 0; i < data.length; i++) {
      data[i].num = seq;
      seq++;
    }

    try {
      data.map((item: any) => {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, item],
            total: prev.total + 1,
          };
        });
      });
    } catch (e) {
      alert(e);
    }
  };

  const setCopyData = (data: any) => {
    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0) return false;

    let seq = 1;

    if (mainDataResult.total > 0) {
      mainDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    for (var i = 1; i < data.length; i++) {
      if (data[0].itemcd == data[i].itemcd) {
        alert("중복되는 품목이있습니다.");
        return false;
      }
    }

    for (var i = 0; i < data.length; i++) {
      data[i].num = seq;
      seq++;
    }

    try {
      data.map((item: any) => {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, item],
            total: prev.total + 1,
          };
        });
      });
    } catch (e) {
      alert(e);
    }
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

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  // 부모로 데이터 전달, 창 닫기 (그리드 인라인 오픈 제외)
  const selectData = (selectedData: any) => {
    let valid = true;
    mainDataResult.data.map((item) => {
      if (
        (item.itemcd == "" || item.itemnm == "" || item.qty == 0) &&
        valid == true
      ) {
        alert("필수항목(품목코드, 품목명, 수량을 채워주세요.");
        valid = false;
        return false;
      }
    });

    if (valid == true) {
      setData(mainDataResult.data, filters, deletedMainRows);
      if (workType == "N") {
        onClose();
      }
    }
  };

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
      field != "insiz" &&
      field != "qtyunit" &&
      field != "rowstatus" &&
      field != "itemnm"
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
  useEffect(() => {
    const newData = mainDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        ? {
            ...item,
            itemcd: itemcd,
            itemnm: itemnm,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
          }
        : {
            ...item,
          }
    );
    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  }, [itemcd, itemnm]);
  return (
    <>
      <Window
        title={workType === "N" ? "직접입고생성" : "직접입고정보"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
      >
        <FormBoxWrap style={{ paddingRight: "50px" }}>
          <FormBox>
            <tbody>
              <tr>
                <th>입고번호</th>
                <td>
                  <Input
                    name="reckey"
                    type="text"
                    value={filters.reckey}
                    className="readonly"
                  />
                </td>
                <th>입고일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="indt"
                      value={filters.indt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      className="required"
                      placeholder=""
                    />
                  </div>
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
              </tr>
              <tr>
                <th>업체코드</th>
                <td>
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
                <th>내수구분</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="doexdiv"
                      value={filters.doexdiv}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      className="required"
                    />
                  )}
                </td>
                <th>과세구분</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="taxdiv"
                      value={filters.taxdiv}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>이체구분</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="auto_transfer"
                      value={filters.auto_transfer}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>입고용도</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="inuse"
                      value={filters.inuse}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      className="required"
                    />
                  )}
                </td>
                <th>수입관리번호</th>
                <td>
                  <Input
                    name="importnum"
                    type="text"
                    value={filters.importnum}
                    onChange={filterInputChange}
                  />
                </td>
                <th>화폐단위</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="amtunit"
                      value={filters.amtunit}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>원화환율</th>
                <td>
                  <Input
                    name="baseamt"
                    type="number"
                    value={filters.baseamt}
                    onChange={filterInputChange}
                  />
                </td>
                <th>대미환율</th>
                <td>
                  <Input
                    name="baseamt"
                    type="number"
                    value={filters.baseamt}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>첨부파일</th>
                <td colSpan={3}>
                  <Input
                    name="files"
                    type="text"
                    value={filters.files}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput style={{ marginTop: "30px" }}>
                    <Button
                      type={"button"}
                      onClick={onAttachmentsWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </td>
                <th>비고</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.remark}
                    name="remark"
                    rows={4}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </FormBox>
        </FormBoxWrap>
        <FormContext.Provider
          value={{
            itemcd,
            itemnm,
            setItemcd,
            setItemnm,
            mainDataState,
            setMainDataState,
            // fetchGrid,
          }}
        >
          <GridContainer height="calc(100% - 310px) ">
            <GridTitleContainer>
              <GridTitle>상세정보</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onAddClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="plus"
                ></Button>
                <Button
                  onClick={onDeleteClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                ></Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyClick}
                  icon="copy"
                ></Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick}
                  icon="folder-open"
                >
                  품목참조
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick3}
                  icon="folder-open"
                >
                  수주참조
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick4}
                  icon="folder-open"
                >
                  수주BOM
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick2}
                  icon="folder-open"
                >
                  불량재고참조
                </Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "calc(100% - 50px)" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  enddt:
                    workType == "U" && isValidDate(row.enddt)
                      ? new Date(dateformat(row.enddt))
                      : new Date(),
                  [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
                })),
                mainDataState
              )}
              onDataStateChange={onMainDataStateChange}
              {...mainDataState}
              //선택 subDataState
              dataItemKey={DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onSelectionChange}
              //스크롤 조회기능
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
              <GridColumn
                field="pac"
                title="도/사급"
                width="150px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="itemcd"
                title="품목코드"
                width="200px"
                footerCell={mainTotalFooterCell}
                cell={ColumnCommandCell}
              />
              <GridColumn field="itemnm" title="품목명" width="250px" />
              <GridColumn
                field="itemlvl1"
                title="대분류"
                width="150px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="itemacnt"
                title="품목계정"
                width="200px"
                cell={CustomComboBoxCell}
              />
              <GridColumn field="insiz" title="규격" width="200px" />
              <GridColumn field="lotnum" title="LOT NO" width="200px" />
              <GridColumn field="heatno" title="HEAT NO" width="200px" />
              <GridColumn
                field="qty"
                title="수량"
                width="120px"
                cell={NumberCell}
              />
              <GridColumn
                field="qtyunit"
                title="단위"
                width="150px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="unp"
                title="단가"
                width="120px"
                cell={NumberCell}
              />
              <GridColumn
                field="wonamt"
                title="원화금액"
                width="120px"
                cell={NumberCell}
              />
              <GridColumn
                field="taxamt"
                title="세액"
                width="120px"
                cell={NumberCell}
              />
              <GridColumn field="remark" title="비고" width="300px" />
              <GridColumn
                field="totwgt"
                title="전체중량"
                width="150px"
                cell={NumberCell}
              />
              <GridColumn
                field="len"
                title="길이"
                width="150px"
                cell={NumberCell}
              />
              <GridColumn
                field="enddt"
                title="소비기한"
                width="150px"
                cell={DateCell}
              />
              <GridColumn
                field="itemthick"
                title="두께"
                width="150px"
                cell={NumberCell}
              />
              <GridColumn
                field="width"
                title="폭"
                width="150px"
                cell={NumberCell}
              />
            </Grid>
          </GridContainer>
        </FormContext.Provider>
        <BottomContainer>
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={selectData}>
              확인
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </Window>
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
      {CopyWindowVisible && (
        <CopyWindow2
          setVisible={setCopyWindowVisible}
          workType={"FILTER"}
          setData={setCopyData}
          itemacnt={""}
        />
      )}
      {CopyWindowVisible2 && (
        <CopyWindow3
          setVisible={setCopyWindowVisible2}
          workType={"FILTER"}
          setData={setCopyData2}
          itemacnt={"1"}
        />
      )}
      {CopyWindowVisible3 && (
        <CopyWindow4
          setVisible={setCopyWindowVisible3}
          workType={"FILTER"}
          setData={setCopyData3}
        />
      )}
      {CopyWindowVisible4 && (
        <CopyWindow5
          setVisible={setCopyWindowVisible4}
          workType={"FILTER"}
          setData={setCopyData4}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={filters.attdatnum}
        />
      )}
    </>
  );
};

export default CopyWindow;
