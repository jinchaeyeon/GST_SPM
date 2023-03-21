import React, {
  useCallback,
  useEffect,
  useState,
  useContext,
  createContext,
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
  GridItemChangeEvent,
  GridCellProps,
} from "@progress/kendo-react-grid";
import { gridList } from "../store/columns/BA_A0080W_C";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { bytesToBase64 } from "byte-base64";
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
  GridContainerWrap,
  ButtonInGridInput,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  convertDateToStr,
  findMessage,
  getQueryFromBizComponent,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  handleKeyPressSearch,
  getGridItemChangedData,
  dateformat,
  UseParaPc,
  UseGetValueFromSessionItem,
} from "../components/CommonFunction";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
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
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import CopyWindow from "../components/Windows/BA_A0080W_Copy_Window";
import RequiredHeader from "../components/RequiredHeader";
import NameCell from "../components/Cells/NameCell";
import ExcelUploadButtons from "../components/Buttons/ExcelUploadButton";

export const FormContext = createContext<{
  itemcd: string;
  itemnm: string;
  setItemcd: (d: any) => void;
  setItemnm: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

const DATA_ITEM_KEY = "num";
const SUB_DATA_ITEM_KEY = "sub_code";
let deletedMainRows: object[] = [];

const DateField = ["recdt"];
const CommandField = ["itemcd"];
const NumberField = ["unp"];

const CustomComboField = ["itemacnt", "amtunit"];

const editableField = ["recdt", "itemcd", "unp", "amtunit", "remark"];

const requiredField = ["itemcd", "unp", "amtunit"];
const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  // 사용자구분, 사업장, 사업부, 부서코드, 직위, 공개범위
  UseBizComponent("L_BA020,L_BA061", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "itemacnt" ? "L_BA061" : field === "amtunit" ? "L_BA020" : "";

  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell bizComponent={bizComponent} {...props} />
  ) : (
    <td></td>
  );
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

const BA_A0080: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const idGetter3 = getter(SUB_DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [editIndex, setEditIndex] = useState<number | undefined>();
  const [editedField, setEditedField] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  const [itemcd, setItemcd] = useState<string>("");
  const [itemnm, setItemnm] = useState<string>("");
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
        unpitem: defaultOption.find((item: any) => item.id === "unpitem")
          .valueCode,
        amtunit: defaultOption.find((item: any) => item.id === "amtunit")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA061, L_BA171, L_BA172, L_BA173, L_ITEM_TEST",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );
  const [itemlvl1ListData, setItemlvl1ListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [itemlvl2ListData, setItemlvl2ListData] = React.useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [itemlvl3ListData, setItemlvl3ListData] = React.useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [itemListData, setItemListData] = useState([
    { itemcd: "", itemnm: "" },
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const itemlvl1QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA171")
      );
      const itemlvl2QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA172")
      );
      const itemlvl3QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA173")
      );
      const itemQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_ITEM_TEST"
        )
      );
      fetchQuery(itemlvl1QueryStr, setItemlvl1ListData);
      fetchQuery(itemlvl2QueryStr, setItemlvl2ListData);
      fetchQuery(itemlvl3QueryStr, setItemlvl3ListData);
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

  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });

  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [CopyWindowVisible, setCopyWindowVisible] = useState<boolean>(false);
  const [mainPgNum, setMainPgNum] = useState(1);
  const [subPgNum, setSub2PgNum] = useState(1);

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
    workType: "Q",
    orgdiv: "01",
    unpitem: "SYS01",
    itemcd: "",
    itemnm: "",
    insiz: "",
    itemacnt: "",
    amtunit: "KRW",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_BA_A0080W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_itemacnt": filters.itemacnt,
      "@p_unpitem": filters.unpitem,
      "@p_amtunit": filters.amtunit,
      "@p_serviceid": "2207A046",
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
      const totalRowCnt = data.tables[1].RowCount;
      const rows = data.tables[1].Rows.map((row: any) => {
        return {
          ...row,
        };
      });

      if (totalRowCnt >= 0) {
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }

      const totalRowCnt2 = data.tables[0].RowCount;
      const rows2 = data.tables[0].Rows;

      if (totalRowCnt2 > 0) {
        setSubDataResult((prev) => {
          return {
            data: rows2,
            total: totalRowCnt2,
          };
        });
      }
      setIfSelectFirstRow(true);
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
  }, [filters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];

        if (firstRowData != null) {
          setSelectedState({ [firstRowData.num]: true });
        } else {
          setSelectedState({});
        }

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

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

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
        if (filters.itemacnt == "") {
          setSelectedsubDataState({ [firstRowData.sub_code]: true });
        }
        setIfSelectFirstRow(true);
      }
    }
  }, [subDataResult]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setSubDataResult(process([], subDataState));
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

  const onSubDataSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });
    setSelectedsubDataState(newSelectedState);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    const datas = mainDataResult.data.filter(
      (item) => item.itemacnt == selectedRowData.sub_code
    );
    setFilters((prev) => ({
      ...prev,
      itemacnt: selectedRowData.sub_code,
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

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
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

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };

  const onCopyWndClick = () => {
    try {
      if (filters.itemacnt != "") {
        setCopyWindowVisible(true);
      } else {
        throw findMessage(messagesData, "BA_A0080W_007");
      }
    } catch (e) {
      alert(e);
    }
  };

  //품목마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  const setCopyData = (data: any) => {
    let valid = true;
    try {
      data.map((item: any) => {
        if (item.itemcd == "") {
          throw findMessage(messagesData, "BA_A0080W_004");
        }
        if (item.itemnm == "") {
          throw findMessage(messagesData, "BA_A0080W_005");
        }
        mainDataResult.data.map((items: any) => {
          if (
            items.recdt == convertDateToStr(new Date()) &&
            item.itemcd == items.itemcd &&
            item.itemnm == items.itemnm
          ) {
            throw findMessage(messagesData, "BA_A0080W_006");
          }
        });
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    const dataItem = data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0) return false;
    let dataArr: TdataArr = {
      unpitem: [],
      rowstatus: [],
      itemcd: [],
      unp: [],
      itemacnt: [],
      remark: [],
      recdt: [],
      amtunit: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        unpitem = "",
        rowstatus = "",
        itemcd = "",
        unp = "",
        itemacnt = "",
        remark = "",
        amtunit = "",
      } = item;
      dataArr.rowstatus.push(rowstatus);
      dataArr.unpitem.push(unpitem == "" ? filters.unpitem : unpitem);
      dataArr.itemcd.push(itemcd);
      dataArr.unp.push(unp);
      dataArr.itemacnt.push(filters.itemacnt);
      dataArr.remark.push(remark);
      dataArr.recdt.push(convertDateToStr(new Date()));
      dataArr.amtunit.push(amtunit == "" ? filters.amtunit : amtunit);
    });

    setParaData((prev) => ({
      ...prev,
      workType: "",
      orgdiv: "01",
      user_id: userId,
      form_id: "BA_A0080W",
      pc: pc,
      unpitem: dataArr.unpitem.join("|"),
      rowstatus: dataArr.rowstatus.join("|"),
      itemcd: dataArr.itemcd.join("|"),
      unp: dataArr.unp.join("|"),
      itemacnt: dataArr.itemacnt.join("|"),
      remark: dataArr.remark.join("|"),
      recdt: dataArr.recdt.join("|"),
      amtunit: dataArr.amtunit.join("|"),
    }));
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubDataSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
  };

  const enterEdit = (dataItem: any, field: string) => {
    const datas = mainDataResult.data.filter(
      (item) => item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
    )[0];
    if (field === "recdt" && datas.rowstatus !== "N") {
      return false;
    }
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
    if (field) setEditedField(field);
    setIfSelectFirstRow(false);
    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
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

  const onMainItemChange = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
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

    try {
      if (filters.itemacnt != "") {
        const newDataItem = {
          [DATA_ITEM_KEY]: seq,
          amtunit: filters.amtunit,
          bnatur: "",
          insiz: "",
          invunit: "",
          itemacnt: filters.itemacnt,
          itemcd: "",
          itemlvl1: "",
          itemlvl2: "",
          itemlvl3: "",
          itemnm: "",
          position: "",
          recdt: convertDateToStr(new Date()),
          remark: "",
          spec: "",
          unp: 0,
          rowstatus: "N",
        };
        setSelectedState({ [newDataItem.num]: true });
        setIfSelectFirstRow(false);
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, newDataItem],
            total: prev.total + 1,
          };
        });
      } else {
        throw findMessage(messagesData, "BA_A0080W_001");
      }
    } catch (e) {
      alert(e);
    }
  };

  const [paraData, setParaData] = useState({
    workType: "",
    orgdiv: "01",
    user_id: userId,
    form_id: "BA_A0080W",
    pc: pc,
    unpitem: "",
    rowstatus: "",
    itemcd: "",
    unp: "",
    itemacnt: "",
    remark: "",
    recdt: "",
    amtunit: "",
  });

  const para: Iparameters = {
    procedureName: "P_BA_A0080W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "",
      "@p_orgdiv": paraData.orgdiv,
      "@p_unpitem_s": paraData.unpitem,
      "@p_rowstatus_s": paraData.rowstatus,
      "@p_itemcd_s": paraData.itemcd,
      "@p_itemacnt_s": paraData.itemacnt,
      "@p_unp_s": paraData.unp,
      "@p_remark_s": paraData.remark,
      "@p_userid": paraData.user_id,
      "@p_recdt_s": paraData.recdt,
      "@p_amtunit_s": paraData.amtunit,
      "@p_form_id": paraData.form_id,
      "@p_pc": paraData.pc,
    },
  };

  type TdataArr = {
    unpitem: string[];
    rowstatus: string[];
    itemcd: string[];
    unp: string[];
    itemacnt: string[];
    remark: string[];
    recdt: string[];
    amtunit: string[];
  };

  const onSaveClick = async () => {
    let valid = true;
    try {
      mainDataResult.data.map((item: any) => {
        if (
          item.recdt.substring(0, 4) < "1997" ||
          item.recdt.substring(6, 8) > "31" ||
          item.recdt.substring(6, 8) < "01" ||
          item.recdt.substring(6, 8).length != 2
        ) {
          throw findMessage(messagesData, "BA_A0080W_002");
        }
        if (item.unp == 0) {
          throw findMessage(messagesData, "BA_A0080W_003");
        }
        if (item.itemcd == "") {
          throw findMessage(messagesData, "BA_A0080W_004");
        }
        if (item.itemnm == "") {
          throw findMessage(messagesData, "BA_A0080W_005");
        }
        mainDataResult.data.map((items: any) => {
          if (
            item.num != items.num &&
            item.itemcd == items.itemcd &&
            item.recdt == items.recdt &&
            item.itemnm == items.itemnm
          ) {
            throw findMessage(messagesData, "BA_A0080W_006");
          }
        });
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    const dataItem = mainDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0 && deletedMainRows.length === 0) return false;
    let dataArr: TdataArr = {
      unpitem: [],
      rowstatus: [],
      itemcd: [],
      unp: [],
      itemacnt: [],
      remark: [],
      recdt: [],
      amtunit: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        unpitem = "",
        rowstatus = "",
        itemcd = "",
        unp = "",
        itemacnt = "",
        remark = "",
        recdt = "",
        amtunit = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.unpitem.push(unpitem == "" ? filters.unpitem : unpitem);
      dataArr.itemcd.push(itemcd);
      dataArr.unp.push(unp);
      dataArr.itemacnt.push(itemacnt);
      dataArr.remark.push(remark);
      dataArr.recdt.push(recdt);
      dataArr.amtunit.push(amtunit);
    });
    deletedMainRows.forEach((item: any, idx: number) => {
      const {
        unpitem = "",
        rowstatus = "",
        itemcd = "",
        unp = "",
        itemacnt = "",
        remark = "",
        recdt = "",
        amtunit = "",
      } = item;
      dataArr.rowstatus.push(rowstatus);
      dataArr.unpitem.push(
        unpitem == "" || unpitem == undefined ? filters.unpitem : unpitem
      );
      dataArr.itemcd.push(itemcd);
      dataArr.unp.push(unp);
      dataArr.itemacnt.push(itemacnt);
      dataArr.remark.push(remark);
      dataArr.recdt.push(recdt);
      dataArr.amtunit.push(amtunit);
    });

    setParaData((prev) => ({
      ...prev,
      workType: "",
      orgdiv: "01",
      user_id: userId,
      form_id: "BA_A0080W",
      pc: pc,
      unpitem: dataArr.unpitem.join("|"),
      rowstatus: dataArr.rowstatus.join("|"),
      itemcd: dataArr.itemcd.join("|"),
      unp: dataArr.unp.join("|"),
      itemacnt: dataArr.itemacnt.join("|"),
      remark: dataArr.remark.join("|"),
      recdt: dataArr.recdt.join("|"),
      amtunit: dataArr.amtunit.join("|"),
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
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.itemcd != "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);

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

  const saveExcel = (jsonArr: any[]) => {
    if(jsonArr.length == 0) {
      alert("데이터가 없습니다.");
    } else {
      let valid = true;

      jsonArr.map((item: any) => {
        Object.keys(item).map((items: any) => {
          if(items != "단가" && items != "비고" && items != "품목명" && items != "품목코드"){
            valid = false;
          }
        })
      })

      if(valid == true){
        let dataArr: TdataArr = {
          unpitem: [],
          rowstatus: [],
          itemcd: [],
          unp: [],
          itemacnt: [],
          remark: [],
          recdt: [],
          amtunit: [],
        };
        jsonArr.forEach((item: any, idx: number) => {
          const {
            unpitem = "",
            품목코드 = "",
            품목명 = "",
            단가 = "",
            비고 = "",
            itemacnt = "",
            recdt = "",
            amtunit = "",
          } = item;
          
          dataArr.rowstatus.push("N");
          dataArr.unpitem.push(unpitem == "" ? filters.unpitem : unpitem);
          dataArr.itemcd.push(품목코드);
          dataArr.unp.push(단가);
          dataArr.itemacnt.push(itemacnt == "" ? Object.getOwnPropertyNames(selectedsubDataState)[0] : itemacnt);
          dataArr.remark.push(비고);
          dataArr.recdt.push(recdt == "" ? convertDateToStr(new Date()) : recdt);
          dataArr.amtunit.push(amtunit == "" ? filters.amtunit : amtunit);
        });
        setParaData((prev) => ({
          ...prev,
          workType: "",
          orgdiv: "01",
          user_id: userId,
          form_id: "BA_A0080W",
          pc: pc,
          unpitem: dataArr.unpitem.join("|"),
          rowstatus: dataArr.rowstatus.join("|"),
          itemcd: dataArr.itemcd.join("|"),
          unp: dataArr.unp.join("|"),
          itemacnt: dataArr.itemacnt.join("|"),
          remark: dataArr.remark.join("|"),
          recdt: dataArr.recdt.join("|"),
          amtunit: dataArr.amtunit.join("|"),
        }));
      } else {
        alert("양식이 맞지 않습니다.")
      }    
    }
  };
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  return (
    <>
      <TitleContainer>
        <Title>단가관리</Title>

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
              <th>단가항목</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="unpitem"
                    value={filters.unpitem}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    className="required"
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
      <GridContainerWrap>
        <GridContainer width={`22%`}>
          <GridTitleContainer>
            <GridTitle>품목계정</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: "80vh" }}
            data={process(
              subDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedsubDataState[idGetter2(row)],
              })),
              subDataState
            )}
            {...subDataState}
            onDataStateChange={onSubDataStateChange}
            //선택 기능
            dataItemKey={SUB_DATA_ITEM_KEY}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            onSelectionChange={onSubDataSelectionChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={subDataResult.total}
            //정렬기능
            sortable={true}
            onSortChange={onSubDataSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
          >
            <GridColumn field="sub_code" title="코드" width="150px" />
            <GridColumn field="code_name" title="계정명" width="200px" />
          </Grid>
        </GridContainer>
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
          <GridContainer width={`calc(78% - ${GAP}px)`}>
            <ExcelExport
              data={mainDataResult.data}
              ref={(exporter) => {
                _export = exporter;
              }}
            >
              <GridTitleContainer>
                <GridTitle>
                  상세정보
                  {permissions && (
                    <ExcelUploadButtons
                      saveExcel={saveExcel}
                      permissions={permissions}
                      style={{ marginLeft: "15px" }}
                    />
                  )}
                  <Button
                    title="Export Excel"
                    onClick={onAttachmentsWndClick}
                    icon="file"
                    fillMode="outline"
                    themeColor={"primary"}
                    style={{ marginLeft: "10px" }}
                  >
                    엑셀양식
                  </Button>
                </GridTitle>
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
                  ></Button>
                  <Button
                    onClick={onSaveClick}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="save"
                  ></Button>
                </ButtonContainer>
              </GridTitleContainer>
              <Grid
                style={{ height: "80vh" }}
                data={process(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    recdt: row.recdt
                      ? new Date(dateformat(row.recdt))
                      : new Date(),
                    itemlvl1: itemlvl1ListData.find(
                      (item: any) => item.sub_code === row.itemlvl1
                    )?.code_name,
                    itemlvl2: itemlvl2ListData.find(
                      (item: any) => item.sub_code === row.itemlvl2
                    )?.code_name,
                    itemlvl3: itemlvl3ListData.find(
                      (item: any) => item.sub_code === row.itemlvl3
                    )?.code_name,
                    rowstatus:
                      row.rowstatus == null ||
                      row.rowstatus == "" ||
                      row.rowstatus == undefined
                        ? ""
                        : row.rowstatus,
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
                  mode: "multiple",
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
                //incell 수정 기능
                onItemChange={onMainItemChange}
                cellRender={customCellRender}
                rowRender={customRowRender}
                editField={EDIT_FIELD}
              >
                <GridColumn
                  field="rowstatus"
                  title=" "
                  width="50px"
                  editable={false}
                />
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
                              : CustomComboField.includes(item.fieldName)
                              ? CustomComboBoxCell
                              : NumberField.includes(item.fieldName)
                              ? NumberCell
                              : CommandField.includes(item.fieldName)
                              ? ColumnCommandCell
                              : NameCell
                          }
                          className={
                            requiredField.includes(item.fieldName)
                              ? "required"
                              : !editableField.includes(item.fieldName)
                              ? "read-only"
                              : undefined
                          }
                          headerCell={
                            requiredField.includes(item.fieldName)
                              ? RequiredHeader
                              : undefined
                          }
                          footerCell={
                            item.sortOrder === 0
                              ? mainTotalFooterCell
                              : undefined
                          }
                        />
                      )
                  )}
              </Grid>
            </ExcelExport>
          </GridContainer>
        </FormContext.Provider>
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
          setVisible={setCopyWindowVisible}
          workType={"FILTER"}
          setData={setCopyData}
          itemacnt={filters.itemacnt}
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
          para={"BA_A0080W"}
        />
      )}
    </>
  );
};

export default BA_A0080;
