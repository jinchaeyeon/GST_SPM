import {
  useEffect,
  useState,
  useCallback,
  useContext,
  createContext,
} from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import ItemsMultiWindow from "./BA_A0080W_Copy_Window";
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
  GridHeaderCellProps
} from "@progress/kendo-react-grid";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import { TextArea, InputChangeEvent, Checkbox } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import CustomersWindow from "./CommonWindows/CustomersWindow";
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
import { Input } from "@progress/kendo-react-inputs";
import { Iparameters } from "../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import {
  chkScrollHandler,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  getQueryFromBizComponent,
  toDate,
  convertDateToStr,
  getGridItemChangedData,
  findMessage,
} from "../CommonFunction";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { IWindowPosition, IAttachmentData } from "../../hooks/interfaces";
import { PAGE_SIZE, SELECTED_FIELD } from "../CommonString";
import { COM_CODE_DEFAULT_VALUE, EDIT_FIELD } from "../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../store/atoms";
import CustomOptionComboBox from "../ComboBoxes/CustomOptionComboBox";
import NumberCell from "../Cells/NumberCell";
import ComboBoxCell from "../Cells/ComboBoxCell";
import CheckBoxCell from "../Cells/CheckBoxCell";
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
    if (dataItem["rowstatus"] == "N") {
      setItemWindowVisible2(true);
    } else {
      alert("품목코드와 품목명은 수정이 불가합니다.");
    }
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

type Idata = {
  amt: number;
  amtunit: string;
  attdatnum: string;
  baseamt: number;
  busadiv: string;
  cargocd: string;
  carno: string;
  chk: string;
  custcd: string;
  custnm: string;
  custprsncd: string;
  doexdiv: string;
  dvnm: string;
  dvnum: string;
  files: string;
  finaldes: string;
  location: string;
  num: number;
  orgdiv: string;
  outdt: string;
  outkind: string;
  outtype: string;
  outuse: string;
  person: string;
  pgmdiv: string;
  portnm: string;
  project: string;
  qty: number;
  rcvcustcd: string;
  rcvcustnm: string;
  recdt: string;
  recdtfind: string;
  remark: string;
  reqnum: string;
  seq1: number;
  shipdt: string;
  taxamt: number;
  taxdiv: string;
  taxdt: string;
  taxnu: string;
  taxtype: string;
  totamt: number;
  trcost: number;
  invoiceno: string;
  position: string;
  taxnum: string;
  reckey: string;
  wonamt: number;
  uschgrat: number;
  wonchgrat: number;
};

let deletedMainRows: object[] = [];

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA061,L_BA015,L_BA019", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "itemacnt"
      ? "L_BA061"
      : field === "qtyunit"
      ? "L_BA015"
      : field === "unpcalmeth"
      ? "L_BA019"
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
    height: 870,
  });
  const DATA_ITEM_KEY = "num";
  useEffect(() => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    fetchMainGrid();
  }, [reload]);
  const idGetter = getter(DATA_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  //메시지 조회
  const pathname: string = window.location.pathname.replace("/", "");
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);
  const [itemcd, setItemcd] = useState<string>("");
  const [itemnm, setItemnm] = useState<string>("");
  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null && workType != "U") {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        person: defaultOption.find((item: any) => item.id === "person2")
          .valueCode,
        doexdiv: defaultOption.find((item: any) => item.id === "doexdiv2")
          .valueCode,
        taxdiv: defaultOption.find((item: any) => item.id === "taxdiv2")
          .valueCode,
        amtunit: defaultOption.find((item: any) => item.id === "amtunit")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_ITEM_TEST,L_BA020,L_BA016,L_BA061,L_BA015, R_USEYN,L_BA005,L_BA029,L_BA173,R_YESNOALL",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()

  const [itemListData, setItemListData] = useState([
    { itemcd: "", itemnm: "" },
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {

      const itemQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_ITEM_TEST"
        )
      );

      fetchQuery(itemQueryStr, setItemListData);
    }
  }, [bizComponentData]);

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

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible2, setCustWindowVisible2] = useState<boolean>(false);
  const [itemMultiWindowVisible, setItemMultiWindowVisible] =
    useState<boolean>(false);
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
  const onCustWndClick2 = () => {
    setCustWindowVisible2(true);
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
  const setCustData2 = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      rcvcustcd: data.custcd,
      rcvcustnm: data.custnm,
    }));
  };

  const processApi = useApi();

  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    orgdiv: "01",
    location: "01",
    reckey: "",
    outdt: new Date(),
    shipdt: new Date(),
    position: "",
    custcd: "",
    custnm: "",
    person: "",
    amtunit: "",
    taxnum: "",
    rcvcustcd: "",
    rcvcustnm: "",
    doexdiv: "",
    wonchgrat: 1,
    invoiceno: "",
    taxdiv: "",
    uschgrat: 0,
    files: "",
    attdatnum: "",
    remark: "",
    amt: 0,
    qty: 0,
    taxamt: 0,
    wonamt: 0,
    baseamt: 0,
    recdt: new Date(),
    seq1: 0,
  });

  const parameters: Iparameters = {
    procedureName: "P_SA_A5000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": "",
      "@p_position": "",
      "@p_dtgb": "",
      "@p_frdt": "",
      "@p_todt": "",
      "@p_person": "",
      "@p_custcd": "",
      "@p_custnm": "",
      "@p_rcvcustcd": "",
      "@p_rcvcustnm": "",
      "@p_doexdiv": "",
      "@p_taxdiv": "",
      "@p_taxyn": "",
      "@p_itemcd": "",
      "@p_itemnm": "",
      "@p_ordkey": "",
      "@p_recdt": convertDateToStr(filters.recdt),
      "@p_seq1": filters.seq1,
      "@p_company_code": "2207A046",
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

  useEffect(() => {
    if (workType === "U" && data != undefined) {
      setFilters((prev) => ({
        ...prev,
        amt: data.amt,
        amtunit: data.amtunit,
        attdatnum: data.attdatnum,
        baseamt: data.baseamt,
        custcd: data.custcd,
        custnm: data.custnm,
        doexdiv: data.doexdiv,
        files: data.files,
        invoiceno: data.invoiceno,
        location: data.location,
        outdt: toDate(data.outdt),
        person: data.person,
        position: data.position,
        qty: data.qty,
        rcvcustcd: data.rcvcustcd,
        rcvcustnm: data.rcvcustnm,
        recdt: toDate(data.recdt),
        reckey: data.reckey,
        remark: data.remark,
        seq1: data.seq1,
        shipdt: toDate(data.shipdt),
        taxamt: data.taxamt,
        taxdiv: data.taxdiv,
        taxnum: data.taxnum,
        uschgrat: data.uschgrat,
        wonamt: data.wonamt,
        wonchgrat: data.wonchgrat,
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
    setItemMultiWindowVisible(true);
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
      mainDataResult.data.map((item) => ({
        ...item,
        num: seq++,
      }));
    }
    const rows = data.map((row: any) => {
      return {
        ...row,
        totamt: 0,
        num: seq++,
      };
    });
    try {
      rows.map((item: any) => {
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

  //그리드 푸터selectData
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

    try {
      if (mainDataResult.data.length == 0) {
        throw findMessage(messagesData, "SA_A5010W_007");
      } else if (
        convertDateToStr(filters.outdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.outdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.outdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.outdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A5010W_001");
      } else if (
        filters.doexdiv == null ||
        filters.doexdiv == "" ||
        filters.doexdiv == undefined
      ) {
        throw findMessage(messagesData, "SA_A5010W_004");
      } else if (
        filters.custcd == null ||
        filters.custcd == "" ||
        filters.custcd == undefined
      ) {
        throw findMessage(messagesData, "SA_A5010W_005");
      } else if (
        filters.taxdiv == null ||
        filters.taxdiv == "" ||
        filters.taxdiv == undefined
      ) {
        throw findMessage(messagesData, "SA_A5010W_006");
      } else {
        if (valid == true) {
          setData(mainDataResult.data, filters, deletedMainRows);
          deletedMainRows = [];
          if (workType == "N") {
            onClose();
          }
        }
      }
    } catch (e) {
      alert(e);
    }
  };
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onDeleteClick = (e: any) => {
    let newData: any[] = [];

    mainDataResult.data.forEach((item: any, index: number) => {
      if (item.chk == false) {
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
      field != "itemnm" &&
      field != "totamt" &&
      field != "dlramt" &&
      field != "rowstatus"
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
      amt:
        filters.amtunit == "KRW"
          ? item.qty * item.unp
          : item.qty * item.unp * filters.wonchgrat,
      wonamt:
        filters.amtunit == "KRW"
          ? item.qty * item.unp
          : item.qty * item.unp * filters.wonchgrat,
      taxamt:
        filters.amtunit == "KRW"
          ? (item.qty * item.unp) / 10
          : (item.qty * item.unp * filters.wonchgrat) / 10,
      totamt:
        filters.amtunit == "KRW"
          ? Math.round(item.qty * item.unp + (item.qty * item.unp) / 10)
          : Math.round(
              item.qty * item.unp * filters.wonchgrat +
                (item.qty * item.unp * filters.wonchgrat) / 10
            ),
      dlramt: filters.amtunit == "KRW" ? item.qty / filters.wonchgrat : 0,
      itemnm:
        item.rowstatus == "N"
          ? itemListData.find((items: any) => items.itemcd === item.itemcd)
              ?.itemnm == item.itemnm
            ? item.itemnm
            : itemListData.find((items: any) => items.itemcd === item.itemcd)
                ?.itemnm
          : item.itemnm,
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
      amt: 0,
      attdatnum: "",
      auto: "N",
      basinvunp: 0,
      bassalunp: 0,
      bnatur: "",
      bomyn: "",
      chk: "",
      cnt: "",
      ctunp: 0,
      custcd: "",
      custnm: "",
      dwgno: "",
      enddt: new Date(),
      files: "",
      hscode: "",
      insiz: "",
      invunit: "",
      itemacnt: "",
      itemcd: "",
      itemlvl1: "",
      itemlvl2: "",
      itemlvl3: "",
      itemnm: "",
      itemno: "",
      itemthick: 0,
      len: 0,
      lenunit: "",
      load_place: "",
      maker: "",
      model: "",
      pac: "A",
      position: "",
      purqty: 0,
      qcyn: "",
      qty: 1,
      remark: "",
      rowstatus: "N",
      safeqty: 0,
      spec: "",
      stockyn: "",
      taxamt: 0,
      totamt: 0,
      totwgt: 0,
      unitwgt: 0,
      unp: 0,
      useyn: "",
      wgtunit: "",
      width: 0,
      wonamt: 0,
      dlramt: 0,
    };

    setMainDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const [values2, setValues2] = React.useState<boolean>(false);
  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        chk: !values2,
        [EDIT_FIELD]: props.field,
      }));
      setValues2(!values2);
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values2} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  return (
    <>
      <Window
        title={workType === "N" ? "직접판매처리생성" : "직접판매처리정보"}
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
                <th>판매번호</th>
                <td>
                  <Input
                    name="reckey"
                    type="text"
                    value={filters.reckey}
                    className="readonly"
                  />
                </td>
                <th>매출일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="outdt"
                      value={filters.outdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      className="required"
                      placeholder=""
                    />
                  </div>
                </td>
                <th>선적일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="shipdt"
                      value={filters.shipdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>원화환율</th>
                <td>
                  <Input
                    name="wonchgrat"
                    type="number"
                    value={filters.wonchgrat}
                  />
                </td>
              </tr>
              <tr>
                <th>사업장</th>
                <td>
                  <Input
                    name="location"
                    type="text"
                    value={"본사"}
                    className="readonly"
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
                <th>미화환율</th>
                <td>
                  <Input
                    name="uschgrat"
                    type="number"
                    value={filters.uschgrat}
                  />
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
                    className="required"
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
                <th>과세구분</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="taxdiv"
                      value={filters.taxdiv}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      className="required"
                    />
                  )}
                </td>
                <th>계산서NO</th>
                <td>
                  <Input
                    name="taxnum"
                    type="text"
                    value={filters.taxnum}
                    className="readonly"
                  />
                </td>
              </tr>
              <tr>
                <th>인수처코드</th>
                <td>
                  <Input
                    name="rcvcustcd"
                    type="text"
                    value={filters.rcvcustcd}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput>
                    <Button
                      onClick={onCustWndClick2}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </td>
                <th>인수처명</th>
                <td>
                  <Input
                    name="rcvcustnm"
                    type="text"
                    value={filters.rcvcustnm}
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
              </tr>
              <tr>
                <th>비고</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.remark}
                    name="remark"
                    rows={2}
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
          <GridContainer>
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
                  onClick={onCopyWndClick}
                  icon="folder-open"
                >
                  일괄등록
                </Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "450px" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
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
              field="chk"
              title=" "
              width="45px"
              headerCell={CustomCheckBoxCell2}
              cell={CheckBoxCell}
            />
              <GridColumn
                field="itemcd"
                title="품목코드"
                width="150px"
                cell={ColumnCommandCell}
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="itemnm" title="품목명" width="150px" />
              <GridColumn
                field="itemacnt"
                title="품목계정"
                width="150px"
                cell={CustomComboBoxCell}
              />
              <GridColumn field="insiz" title="규격" width="150px" />
              <GridColumn
                field="qty"
                title="수량"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="qtyunit"
                title="수량단위"
                width="100px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="unpcalmeth"
                title="단가산정방법"
                width="100px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="unp"
                title="단가"
                width="100px"
                cell={NumberCell}
              />
              <GridColumn
                field="amt"
                title="금액"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="wonamt"
                title="원화금액"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="taxamt"
                title="세액"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="unitwgt"
                title="단량"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="totwgt"
                title="총중량"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn field="wgtunit" title="중량단위" width="100px" />
              <GridColumn
                field="dlramt"
                title="달러금액"
                width="100px"
                cell={NumberCell}
              />
              <GridColumn
                field="totamt"
                title="합계금액"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn field="remark" title="비고" width="200px" />
            </Grid>
          </GridContainer>
        </FormContext.Provider>
        <BottomContainer>
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={selectData}>
              저장
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
      {custWindowVisible2 && (
        <CustomersWindow
          setVisible={setCustWindowVisible2}
          workType={workType}
          setData={setCustData2}
        />
      )}
      {itemMultiWindowVisible && (
        <ItemsMultiWindow
          setVisible={setItemMultiWindowVisible}
          workType={"FILTER"}
          setData={setCopyData}
          itemacnt={""}
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
