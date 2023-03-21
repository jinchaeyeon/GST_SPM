import { useEffect, useState, useCallback, useContext, createContext } from "react";
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
import CopyWindow2 from "./SA_A3000W_Inven_Window";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  ButtonInInput,
  GridTitleContainer,
  FormBoxWrap,
  FormBox,
  ButtonInGridInput,
  GridTitle,
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
import ComboBoxCell from "../Cells/ComboBoxCell";
import CheckBoxCell from "../Cells/CheckBoxCell";
import CheckBoxReadOnlyCell from "../Cells/CheckBoxReadOnlyCell";

type IWindow = {
  workType: "N" | "U";
  data?: Idata;
  setVisible(t: boolean): void;
  setData(data: object, filter: object, deletedMainRows: object): void; //data : 선택한 품목 데이터를 전달하는 함수
  reload: boolean;
};

type Idata = {
  amt: number;
  amtunit: string;
  attdatnum: string;
  baseamt: number;
  busadiv: string;
  cargb: string;
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
  finyn: string;
  finaldes: string;
  gugancd: string;
  itemacnt: string;
  location: string;
  jisiqty: number;
  num: number;
  orgdiv: string;
  outdt: string;
  outkind: string;
  outtype: string;
  outqty: number;
  outuse: string;
  person: string;
  pgmdiv: string;
  portnm: string;
  poregnum: string;
  project: string;
  position: string;
  qty: number;
  rcvcustcd: string;
  rcvcustnm: string;
  rcvperson: string;
  rcvnum: string;
  recdt: string;
  reqdt: string;
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
  uschgrat: number;
  wonchgrat: number;
};
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
    setItemWindowVisible2(true);
  };
  const setItemData2 = (data: IItemData) => {
    if (dataItem["rowstatus"] == "N") {
      setItemcd(data.itemcd);
      setItemnm(data.itemnm);
    } else {
      alert("품목코드와 품목명은 수정이 불가합니다.");
    }
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
  UseBizComponent("L_BA005,L_BA061", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "doexdiv" ? "L_BA005" : field === "itemacnt" ? "L_BA061" : "";
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
  const [itemcd, setItemcd] = useState<string>("");
  const [itemnm, setItemnm] = useState<string>("");
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const DATA_ITEM_KEY = "num";

  const idGetter = getter(DATA_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  //메시지 조회
  const pathname: string = window.location.pathname.replace("/", "");
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null && workType != "U") {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
        cargocd: defaultOption.find((item: any) => item.id === "cargocd")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_ITEM_TEST,L_BA002,L_BA016,L_BA061,L_BA015, R_USEYN,L_BA171,L_BA172,L_BA173,R_YESNOALL",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [qtyunitListData, setQtyunitListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [locationListData, setLocationListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [itemListData, setItemListData] = useState([
    { itemcd: "", itemnm: "" },
  ]);
  useEffect(() => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    fetchMainGrid();
  }, [reload]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const qtyunitQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA015")
      );
      const locationQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA002")
      );
      const itemQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_ITEM_TEST"
        )
      );
      fetchQuery(qtyunitQueryStr, setQtyunitListData);
      fetchQuery(locationQueryStr, setLocationListData);
      fetchQuery(itemQueryStr, setItemListData);
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
    custcd: "",
    custnm: "",
    carno: "",
    cargocd: "",
    cargb: "",
    trcost: 0,
    dvnm: "",
    dvnum: "",
    finaldes: "",
    gugancd: "",
    location: "01",
    orgdiv: "01",
    person: "",
    poregnum: "",
    portnm: "",
    rcvcustcd: "",
    rcvcustnm: "",
    rcvperson: "",
    rcvnum: "",
    reqdt: new Date(),
    remark: "",
    reqnum: "",
    shipdt: new Date(),
    userid: userId,
    pc: pc,
    form_id: "SA_A2300W",
    serviceid: "2207A046",
    files: "",
    frdt: new Date(),
    todt: new Date(),
  });

  const parameters: Iparameters = {
    procedureName: "P_SA_A3000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_position": "",
      "@p_reqnum": filters.reqnum,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_itemcd": "",
      "@p_itemnm": "",
      "@p_finyn": "",
      "@p_ordnum": "",
      "@p_poregnum": filters.poregnum,
      "@p_itemno": "",
      "@p_reqnum_s": "",
      "@p_reqseq_s": "",
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

  useEffect(() => {
    if (workType === "U" && data != undefined) {
      setFilters((prev) => ({
        ...prev,
        cargb: data.cargb,
        cargocd: data.cargocd,
        carno: data.carno,
        custcd: data.custcd,
        custnm: data.custnm,
        custprsncd: data.custprsncd,
        dvnm: data.dvnm,
        dvnum: data.dvnum,
        finaldes: data.finaldes,
        finyn: data.finyn,
        gugancd: data.gugancd,
        itemacnt: data.itemacnt,
        jisiqty: data.jisiqty,
        location: data.location,
        outqty: data.outqty,
        person: data.person,
        poregnum: data.poregnum,
        portnm: data.portnm,
        position: data.position,
        project: data.project,
        rcvcustcd: data.rcvcustcd,
        rcvcustnm: data.rcvcustnm,
        rcvperson: data.rcvperson,
        rcvnum: data.rcvnum,
        remark: data.remark,
        reqdt: toDate(data.reqdt),
        reqnum: data.reqnum,
        shipdt: data.shipdt == "" ? new Date() : toDate(data.shipdt),
        trcost: data.trcost,
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

    const rows = dataItem.map((row: any) => {
      seq += seq + 1;
      return {
        ...row,
        num: seq,
      };
    });

    try {
      setFilters((prev: any) => ({
        ...prev,
        custcd: rows[0].custcd,
        custnm: rows[0].custnm,
      }))
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
      if (item.qty == 0) {
        alert("수량을 채워주세요.");
        valid = false;
        return false;
      }
    });

    try {
      if (mainDataResult.data.length == 0) {
        throw findMessage(messagesData, "SA_A3000W_002");
      } else if (
        convertDateToStr(filters.shipdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.shipdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.shipdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.shipdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A3000W_001");
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
      field != "rowstatus" &&
      field != "insiz" &&
      field != "qtyunit" &&
      field != "itemnm" &&
      field != "len"&&
      field != "ordnum"&&
      field != "finyn"
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
      itemnm:
      itemListData.find((items: any) => items.itemcd === item.itemcd)
        ?.itemnm == item.itemnm
        ? item.itemnm
        : itemListData.find((items: any) => items.itemcd === item.itemcd)
            ?.itemnm,
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

  return (
    <>
      <Window
        title={workType === "N" ? "출하지시생성" : "출하지시정보"}
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
                <th>출하지시번호</th>
                <td>
                  <Input
                    name="reqnum"
                    type="text"
                    value={filters.reqnum}
                    className="readonly"
                  />
                </td>
                <th>지시일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="reqdt"
                      value={filters.reqdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      placeholder=""
                      className="required"
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
                <th>출하처코드</th>
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
                <th>출하처명</th>
                <td>
                  <Input
                    name="custnm"
                    type="text"
                    value={filters.custnm}
                    onChange={filterInputChange}
                  />
                </td>
                <th>PO번호</th>
                <td>
                  <Input
                    name="poregnum"
                    type="text"
                    value={filters.poregnum}
                    onChange={filterInputChange}
                  />
                </td>
                <th>운송비구간</th>
                <td>
                  <Input
                    name="gugancd"
                    type="text"
                    value={filters.gugancd}
                    onChange={filterInputChange}
                  />
                </td>
                <th>차량구분</th>
                <td>
                  <Input
                    name="cargb"
                    type="text"
                    value={filters.cargb}
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
                <th>운송사</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="cargocd"
                      value={filters.cargocd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>운송비</th>
                <td>
                  <Input
                    name="trcost"
                    type="number"
                    value={filters.trcost}
                    onChange={filterInputChange}
                  />
                </td>
                <th>차량번호</th>
                <td>
                  <Input
                    name="carno"
                    type="text"
                    value={filters.carno}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>선적지</th>
                <td colSpan={3}>
                  <Input
                    name="portnm"
                    type="text"
                    value={filters.portnm}
                    onChange={filterInputChange}
                  />
                </td>
                <th>운전자명</th>
                <td>
                  <Input
                    name="dvnm"
                    type="text"
                    value={filters.dvnm}
                    onChange={filterInputChange}
                  />
                </td>
                <th>운전자연락처</th>
                <td>
                  <Input
                    name="dvnum"
                    type="text"
                    value={filters.dvnum}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
              <th>도착지</th>
                <td colSpan={3}>
                  <Input
                    name="finaldes"
                    type="text"
                    value={filters.finaldes}
                    onChange={filterInputChange}
                  />
                </td>
                <th>인수자</th>
                <td>
                  <Input
                    name="rcvperson"
                    type="text"
                    value={filters.rcvperson}
                    onChange={filterInputChange}
                  />
                </td>
                <th>인수자연락처</th>
                <td>
                  <Input
                    name="rcvnum"
                    type="text"
                    value={filters.rcvnum}
                    onChange={filterInputChange}
                  />
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
                수주참조
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "450px" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                enddt:
                  workType == "U" && isValidDate(row.enddt)
                    ? new Date(dateformat(row.enddt))
                    : new Date(),
                qtyunit: qtyunitListData.find(
                  (item: any) => item.sub_code === row.qtyunit
                )?.code_name,
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
              width="180px"
              cell={ColumnCommandCell}
              footerCell={mainTotalFooterCell}
            />
            <GridColumn field="itemnm" title="품목명" width="150px" />
            <GridColumn field="insiz" title="규격" width="150px" />
            <GridColumn
              field="itemacnt"
              title="품목계정"
              width="120px"
              cell={CustomComboBoxCell}
            />
            <GridColumn
              field="qty"
              title="수량"
              width="100px"
              cell={NumberCell}
            />
            <GridColumn
              field="qtyunit"
              title="수량단위"
              width="120px"
              cell={CustomComboBoxCell}
            />
                        <GridColumn
              field="len"
              title="길이"
              width="100px"
              cell={NumberCell}
            />
            <GridColumn field="remark" title="비고" width="250px" />
            <GridColumn field="ordnum" title="수주번호" width="180px" />
            <GridColumn field="finyn" title="완료여부" width="120px" cell={CheckBoxReadOnlyCell}/>
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
        <CopyWindow2
          setVisible={setCopyWindowVisible}
          workType={"FILTER"}
          setData={setCopyData}
          custcd={filters.custcd}
          custnm={filters.custnm}
        />
      )}
    </>
  );
};

export default CopyWindow;
