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
import CopyWindow1 from "./MA_A2700W_BOM_Window";
import CopyWindow2 from "./MA_A2000W_BOM_Window";
import CopyWindow3 from "./BA_A0080W_Copy_Window";
import CopyWindow4 from "./MA_A2700W_Orders_Window";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  Title,
  TitleContainer,
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
  findMessage,
  setDefaultDate,
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
import CheckBoxReadOnlyCell from "../Cells/CheckBoxReadOnlyCell";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import RequiredHeader from "../RequiredHeader";
type IWindow = {
  workType: "N" | "U";
  data?: Idata;
  setVisible(t: boolean): void;
  setData(data: object, filter: object, deletedMainRows: object): void;
  reload: boolean; //data : 선택한 품목 데이터를 전달하는 함수
};

type Idata = {
  amt: number;
  amtunit: string;
  appyn: string;
  attdatnum: string;
  baseamt: number;
  cnt: number;
  custcd: string;
  custnm: string;
  custprsncd: string;
  dlv_method: string;
  doexdiv: string;
  files: string;
  finyn: string;
  inamt: number;
  indt: string;
  inexpdt: string;
  inqty: number;
  inwgt: number;
  location: string;
  num: number;
  ordnum: string;
  orgdiv: string;
  paymeth: string;
  person: string;
  pgmdiv: string;
  prcterms: string;
  purdt: string;
  purnum: string;
  pursts: string;
  purtype: string;
  qty: number;
  rcvcustcd: string;
  rcvcustnm: string;
  remark: string;
  taxamt: number;
  taxdiv: string;
  totamt: number;
  uschgrat: number;
  wgt: number;
  wonamt: number;
  wonchgrat: number;
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

export const FormContext = createContext<{
  itemcd: string;
  itemnm: string;
  setItemcd: (d: any) => void;
  setItemnm: (d: any) => void;
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
const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA019,L_BA015,L_BA061", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "unpcalmeth"
      ? "L_BA019"
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
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
        pursts: defaultOption.find((item: any) => item.id === "pursts")
          .valueCode,
        finyn: defaultOption.find((item: any) => item.id === "finyn").valueCode,
        doexdiv: defaultOption.find((item: any) => item.id === "doexdiv")
          .valueCode,
        taxdiv: defaultOption.find((item: any) => item.id === "taxdiv")
          .valueCode,
        amtunit: defaultOption.find((item: any) => item.id === "amtunit")
          .valueCode,
        purdt: setDefaultDate(customOptionData, "purdt"),
        inexpdt: setDefaultDate(customOptionData, "inexpdt"),
        custprsncd: defaultOption.find((item: any) => item.id === "custprsncd")
          .valueCode,
      }));
    }
  }, [customOptionData]);

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

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_PR010",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [proccdListData, setProccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );

      fetchQuery(proccdQueryStr, setProccdListData);
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

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [custWindowVisible2, setCustWindowVisible2] = useState<boolean>(false);
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
    itemcd: "",
    itemnm: "",
    custcd: "",
    custnm: "",
    person: "",
    location: "",
    pursts: "",
    purnum: "",
    finyn: "N",
    doexdiv: "A",
    amtunit: "KRW",
    purdt: new Date(),
    inexpdt: new Date(),
    taxdiv: "",
    wonchgrat: 0,
    uschgrat: 0,
    custprsncd: "",
    prcterms: "",
    rcvcustcd: "",
    rcvcustnm: "",
    files: "",
    attdatnum: "",
    remark: "",
  });

  const parameters: Iparameters = {
    procedureName: "P_MA_A2000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(new Date()),
      "@p_todt": convertDateToStr(new Date()),
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_person": filters.person,
      "@p_pursts": filters.pursts,
      "@p_purnum": filters.purnum,
      "@p_finyn": filters.finyn,
      "@p_pursiz": "",
      "@p_doexdiv": filters.doexdiv,
      "@p_purdt": convertDateToStr(filters.purdt),
      "@p_amtunit": filters.amtunit,
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

  useEffect(() => {
    if (workType === "U" && data != undefined) {
      setFilters((prev) => ({
        ...prev,
        custcd: data.custcd,
        custnm: data.custnm,
        person: data.person,
        location: data.location,
        pursts: data.pursts,
        purnum: data.purnum,
        finyn: data.finyn,
        doexdiv: data.doexdiv,
        amtunit: data.amtunit,
        purdt: toDate(data.purdt),
        inexpdt: toDate(data.inexpdt),
        taxdiv: data.taxdiv,
        wonchgrat: data.wonchgrat,
        uschgrat: data.uschgrat,
        custprsncd: data.custprsncd,
        prcterms: data.prcterms,
        rcvcustcd: data.rcvcustcd,
        rcvcustnm: data.rcvcustnm,
        files: data.files,
        attdatnum: data.attdatnum,
        remark: data.remark,
      }));
    }
  }, []);

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
      if (item.qty == 0 && valid == true) {
        alert("수량을 채워주세요.");
        valid = false;
        return false;
      }
    });

    if (valid == true) {
      try {
        if (mainDataResult.data.length == 0) {
          throw findMessage(messagesData, "MA_A2000W_004");
        } else if (
          convertDateToStr(filters.purdt).substring(0, 4) < "1997" ||
          convertDateToStr(filters.purdt).substring(6, 8) > "31" ||
          convertDateToStr(filters.purdt).substring(6, 8) < "01" ||
          convertDateToStr(filters.purdt).substring(6, 8).length != 2
        ) {
          throw findMessage(messagesData, "MA_A2400W_001");
        } else if (
          filters.doexdiv == null ||
          filters.doexdiv == "" ||
          filters.doexdiv == undefined
        ) {
          throw findMessage(messagesData, "MA_A2000W_003");
        } else if (
          filters.location == null ||
          filters.location == "" ||
          filters.location == undefined
        ) {
          throw findMessage(messagesData, "MA_A2000W_002");
        } else if (
          filters.custcd == null ||
          filters.custcd == "" ||
          filters.custcd == undefined
        ) {
          throw findMessage(messagesData, "MA_A2000W_005");
        } else if (
          filters.custnm == null ||
          filters.custnm == "" ||
          filters.custnm == undefined
        ) {
          throw findMessage(messagesData, "MA_A2000W_006");
        } else if (
          filters.taxdiv == null ||
          filters.taxdiv == "" ||
          filters.taxdiv == undefined
        ) {
          throw findMessage(messagesData, "MA_A2400W_006");
        } else if (
          filters.amtunit == null ||
          filters.amtunit == "" ||
          filters.amtunit == undefined
        ) {
          throw findMessage(messagesData, "MA_A2000W_007");
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
      field != "itemnm" &&
      field != "insiz" &&
      field != "amt" &&
      field != "totamt" &&
      field != "wonamt" &&
      field != "taxamt" &&
      field != "rowstatus" &&
      field != "ordkey"
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
          ? Math.round((item.qty * item.unp) + (item.qty * item.unp) / 10)
          : Math.round(
              (item.qty * item.unp * filters.wonchgrat) + (item.qty * item.unp * filters.wonchgrat) / 10
            ),
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
      amtunit: "",
      chk: "",
      custcd: "",
      custnm: "",
      dlramt: 0,
      doexdiv: "",
      finyn: "",
      indt: "",
      inexpdt: "",
      inqty: 0,
      insiz: "",
      itemacnt: "",
      itemcd: "",
      itemnm: "",
      location: "",
      lotnum: "",
      ordkey: "",
      ordnum: "",
      ordseq: 0,
      orgdiv: "01",
      pgmdiv: "",
      purdt: "",
      purnum: "",
      purseq: 0,
      pursts: "",
      purtype: "",
      qty: 0,
      qtyunit: "",
      rcvcustcd: "",
      rcvcustnm: "",
      remark: "",
      taxamt: 0,
      taxdiv: "",
      totamt: 0,
      unp: 0,
      unpcalmeth: "",
      uschgrat: 0,
      wgt: 0,
      wgtunit: "",
      wonamt: 0,
      wonchgrat: 0,
      rowstatus: "N",
    };

    setMainDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  return (
    <>
      <Window
        title={workType === "N" ? "자재발주생성" : "자재발주정보"}
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
                <th>발주번호</th>
                <td>
                  <Input
                    name="purnum"
                    type="text"
                    value={filters.purnum}
                    className="readonly"
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
                <th>화폐단위</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="amtunit"
                      value={filters.amtunit}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      className="required"
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>발주일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="purdt"
                      value={filters.purdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      className="required"
                      placeholder=""
                    />
                  </div>
                </td>
                <th>입고예정일</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="inexpdt"
                      value={filters.inexpdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
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
                <th>원화환율</th>
                <td>
                  <Input
                    name="wonchgrat"
                    type="number"
                    value={filters.wonchgrat}
                    onChange={filterInputChange}
                  />
                </td>
                <th>대미환율</th>
                <td>
                  <Input
                    name="uschgrat"
                    type="number"
                    value={filters.uschgrat}
                    onChange={filterInputChange}
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
                    className="required"
                  />
                </td>
                <th>업체담당자</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="custprsncd"
                      value={filters.custprsncd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      textField="prsnnm"
                      valueField="custprsncd"
                    />
                  )}
                </td>
                <th>인도조건</th>
                <td>
                  <Input
                    name="prcterms"
                    type="text"
                    value={filters.prcterms}
                    onChange={filterInputChange}
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
                <th>첨부파일</th>
                <td colSpan={5}>
                  <Input
                    name="files"
                    type="text"
                    value={filters.files}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput>
                    <Button
                      type={"button"}
                      onClick={onAttachmentsWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </td>
              </tr>
              <tr>
                <th>비고</th>
                <td colSpan={9}>
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
                  onClick={onCopyWndClick2}
                  icon="folder-open"
                >
                  BOM
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick}
                  icon="folder-open"
                >
                  수주BOM
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick3}
                  icon="folder-open"
                >
                  품목
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode="outline"
                  onClick={onCopyWndClick4}
                  icon="folder-open"
                >
                  수주
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
                field="itemcd"
                title="품목코드"
                width="150px"
                cell={ColumnCommandCell}
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="itemnm" title="품목명" width="150px" />
              <GridColumn field="insiz" title="규격" width="120px" />
              <GridColumn
                field="itemacnt"
                title="품목계정"
                width="120px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="qty"
                title="발주량"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="qtyunit"
                title="수량단위"
                width="120px"
                cell={CustomComboBoxCell}
              />
              <GridColumn
                field="unpcalmeth"
                title="단가산정방법"
                width="120px"
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
                field="totamt"
                title="합계금액"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn field="remark" title="비고" width="280px" />
              <GridColumn
                field="finyn"
                title="완료여부"
                width="100px"
                cell={CheckBoxReadOnlyCell}
              />
              <GridColumn field="ordkey" title="수주번호" width="150px" />
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
      {CopyWindowVisible && (
        <CopyWindow1
          setVisible={setCopyWindowVisible}
          workType={"FILTER"}
          setData={setCopyData}
        />
      )}
      {CopyWindowVisible2 && (
        <CopyWindow2
          setVisible={setCopyWindowVisible2}
          workType={"FILTER"}
          setData={setCopyData}
        />
      )}
      {CopyWindowVisible3 && (
        <CopyWindow3
          setVisible={setCopyWindowVisible3}
          workType={"FILTER"}
          setData={setCopyData}
          itemacnt={""}
        />
      )}
      {CopyWindowVisible4 && (
        <CopyWindow4
          setVisible={setCopyWindowVisible4}
          workType={"FILTER"}
          setData={setCopyData}
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
