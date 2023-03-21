import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridCellProps,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
  GridExpandChangeEvent,
} from "@progress/kendo-react-grid";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { bytesToBase64 } from "byte-base64";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import CustomersWindow from "./CommonWindows/CustomersWindow";
import { useApi } from "../../hooks/api";
import DateCell from "../Cells/DateCell";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  Title,
  TitleContainer,
  ButtonInInput,
  GridTitleContainer,
  GridTitle,
  GridContainerWrap,
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
  handleKeyPressSearch,
  setDefaultDate,
  convertDateToStr,
  getGridItemChangedData,
  dateformat,
  isValidDate,
} from "../CommonFunction";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { IWindowPosition } from "../../hooks/interfaces";
import { PAGE_SIZE, SELECTED_FIELD } from "../CommonString";
import { COM_CODE_DEFAULT_VALUE, EDIT_FIELD } from "../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../store/atoms";
import CustomOptionRadioGroup from "../RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../ComboBoxes/CustomOptionComboBox";
import NumberCell from "../Cells/NumberCell";
import CheckBoxCell from "../Cells/CheckBoxCell";
import ComboBoxCell from "../Cells/ComboBoxCell";
type IWindow = {
  workType: "FILTER" | "ROW_ADD" | "ROWS_ADD";
  setVisible(t: boolean): void;
  setData(data: object): void; //data : 선택한 품목 데이터를 전달하는 함수
};

const CopyWindow = ({ workType, setVisible, setData }: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1600,
    height: 900,
  });
  const DATA_ITEM_KEY = "num";
  const DATA_ITEM_KEY2 = "num";
  const DATA_ITEM_KEY3 = "num";
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const idGetter3 = getter(DATA_ITEM_KEY3);
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
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        frdt: setDefaultDate(customOptionData, "frdt"),
        todt: setDefaultDate(customOptionData, "todt"),
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
        finyn: defaultOption.find((item: any) => item.id === "finyn").valueCode,
        proccd: defaultOption.find((item: any) => item.id === "proccd")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA005,L_BA029, L_BA061,L_BA015, R_USEYN,L_BA171,L_BA172,L_BA173,R_YESNOALL,L_sysUserMaster_001,L_PR010",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [proccdListData, setProccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
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
  const [itemlvl2ListData, setItemlvl2ListData] = React.useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [itemlvl3ListData, setItemlvl3ListData] = React.useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [personListData, setPersonListData] = useState([
    { user_id: "", user_name: "" },
  ]);
  const [doexdivListData, setDoexdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [taxdivListData, setTaxdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const itemacntQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA061")
      );
      const qtyunitQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA015")
      );
      const personQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );
      const doexdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA005")
      );
      const taxdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA029")
      );
      const itemlvl1QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA171")
      );
      const itemlvl2QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA172")
      );
      const itemlvl3QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA173")
      );
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );

      fetchQuery(proccdQueryStr, setProccdListData);
      fetchQuery(itemlvl1QueryStr, setItemlvl1ListData);
      fetchQuery(itemlvl2QueryStr, setItemlvl2ListData);
      fetchQuery(itemlvl3QueryStr, setItemlvl3ListData);
      fetchQuery(itemacntQueryStr, setItemacntListData);
      fetchQuery(qtyunitQueryStr, setQtyunitListData);
      fetchQuery(personQueryStr, setPersonListData);
      fetchQuery(doexdivQueryStr, setDoexdivListData);
      fetchQuery(taxdivQueryStr, setTaxdivListData);
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
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [detailselectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [subselectedState, setSubSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [isInitSearch, setIsInitSearch] = useState(false);
  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);
  const [subPgNum, setSubPgNum] = useState(1);
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

  const onItemWndClick = () => {
    setItemWindowVisible(true);
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

  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  const processApi = useApi();
  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "LIST",
    orgdiv: "01",
    location: "01",
    frdt: new Date(),
    todt: new Date(),
    itemcd: "",
    itemnm: "",
    insiz: "",
    dwgno: "",
    planno: "",
    planseq: 0,
    proccd: "",
    ordnum: "",
    finyn: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    planno: "",
    planseq: 0,
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_A2400W_Sub1_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": "01",
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_dwgno": filters.dwgno,
      "@p_planno": filters.planno,
      "@p_planseq": filters.planseq,
      "@p_proccd": filters.proccd,
      "@p_ordnum": filters.ordnum,
      "@p_finyn": filters.finyn,
      "@p_company_code": "2207A046",
    },
  };

  //조회조건 파라미터
  const detailParameters: Iparameters = {
    procedureName: "P_MA_A2400W_Sub1_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "PRLIST",
      "@p_orgdiv": "01",
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_dwgno": filters.dwgno,
      "@p_planno": detailFilters.planno,
      "@p_planseq": detailFilters.planseq,
      "@p_proccd": filters.proccd,
      "@p_ordnum": filters.ordnum,
      "@p_finyn": filters.finyn,
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
          rowstatus: "N",
          qty: row.qty == null ? 1 : row.qty,
          qtyunit: row.qtyunit == null ? "001" : row.qtyunit,
          unitwgt: row.unitwgt == null ? 0 : row.unitwgt,
          wgt: row.wgt == null ? 0 : row.wgt,
          wgtunit: row.wgtunit == null ? "" : row.wgtunit,
          unpcalmeth: row.unpcalmeth == null ? "Q" : row.unpcalmeth,
          amt: row.amt == null ? 0 : row.amt,
          unp: row.unp == null ? 0 : row.unp,
          wonamt: row.wonamt == null ? 0 : row.wonamt,
          taxamt: row.taxamt == null ? 0 : row.taxamt,
          totamt: row.totamt == null ? 0 : row.totamt,
          jangqty: row.jangqty == null ? 0 : row.jangqty,
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

  const fetchDetailGrid = async () => {
    //if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailParameters);
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

      setDetailDataResult((prev) => {
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

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (customOptionData !== null && isInitSearch === false) {
      fetchMainGrid();
      setIsInitSearch(true);
    }
  }, [filters]);

  useEffect(() => {
    setDetailPgNum(1);
    setDetailDataResult(process([], detailDataState));
    if (customOptionData !== null) {
      fetchDetailGrid();
    }
  }, [detailFilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchDetailGrid();
    }
  }, [detailPgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.num]: true });

        setDetailFilters((prev) => ({
          ...prev,
          planno: firstRowData.planno,
          planseq: firstRowData.planseq,
        }));
        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (detailDataResult.total > 0) {
        const firstRowData = detailDataResult.data[0];
        setDetailSelectedState({ [firstRowData.num]: true });

        setIfSelectFirstRow(true);
      }
    }
  }, [detailDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
        setSubSelectedState({ [firstRowData.num]: true });

        setIfSelectFirstRow(true);
      }
    }
  }, [subDataResult]);

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

    setDetailFilters((prev) => ({
      ...prev,
      planno: selectedRowData.planno,
      planseq: selectedRowData.planseq,
    }));
  };

  const onDetailSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailselectedState,
      dataItemKey: DATA_ITEM_KEY3,
    });
    setDetailSelectedState(newSelectedState);

    setIfSelectFirstRow(false);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  const onSubSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: subselectedState,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSubSelectedState(newSelectedState);
    setIfSelectFirstRow(false);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setDetailPgNum(1);
    setMainDataResult(process([], mainDataState));
    setDetailDataResult(process([], detailDataState));
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

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onDetailDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDataState(event.dataState);
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

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = detailDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataResult.total.toString().split(".");
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

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onDetailSortChange = (e: any) => {
    setDetailDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
  };

  // 부모로 데이터 전달, 창 닫기 (그리드 인라인 오픈 제외)
  const selectData = (selectedData: any) => {
    setData(subDataResult.data);
    onClose();
  };

  const onRowDoubleClick = (props: any) => {
    const datas = props.dataItem;
    let seq = 1;
    if (subDataResult.total > 0) {
      subDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }
    const selectRow = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    const newDataItem = {
      [DATA_ITEM_KEY]: seq + 1,
      chk: selectRow.chk,
      doqty: selectRow.doqty,
      dwgno: selectRow.dwgno,
      insiz: selectRow.insiz,
      itemcd: selectRow.itemcd,
      itemnm: selectRow.itemnm,
      jangqty: selectRow.jangqty,
      ordkey: selectRow.ordkey,
      ordnum: selectRow.ordnum,
      ordseq: selectRow.ordseq,
      orgdiv: "01",
      plandt: selectRow.plandt,
      plankey: selectRow.plankey,
      planno: selectRow.planno,
      planqty: selectRow.planqty,
      planseq: selectRow.planseq,
      proccd: selectRow.proccd,
      procseq: selectRow.procseq,
      purqty: selectRow.purqty,
      rowstatus: "N",
      remark: selectRow.remark,
      qty: selectRow.qty,
      qtyunit: selectRow.qtyunit,
      unitwgt: selectRow.unitwgt,
      wgt: selectRow.wgt,
      wgtunit: selectRow.wgtunit,
      unpcalmeth: selectRow.unpcalmeth,
      amt: selectRow.amt,
      unp: selectRow.unp,
      wonamt: selectRow.wonamt,
      taxamt: selectRow.taxamt,
      totamt: selectRow.totamt,
    };
    setSubDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onDeleteClick = (e: any) => {
    let newData: any[] = [];

    subDataResult.data.forEach((item: any, index: number) => {
      if (!subselectedState[item[DATA_ITEM_KEY2]]) {
        newData.push(item);
      }
    });
    setSubDataResult((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setSubDataState({});
  };

  const onMainItemChange = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
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
    if (field == "reqdt") {
      const newData = subDataResult.data.map((item) =>
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
      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = subDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));
    setIfSelectFirstRow(false);
    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  return (
    <>
      <Window
        title={"계획참조"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
      >
        <TitleContainer style={{ float: "right" }}>
          <ButtonContainer>
            <Button
              onClick={() => {
                resetAllGrid();
                fetchMainGrid();
              }}
              icon="search"
              themeColor={"primary"}
            >
              조회
            </Button>
          </ButtonContainer>
        </TitleContainer>
        <FilterBoxWrap>
          <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
            <tbody>
              <tr>
                <th>입고일자</th>
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
                <th>규격</th>
                <td>
                  <Input
                    name="insiz"
                    type="text"
                    value={filters.insiz}
                    onChange={filterInputChange}
                  />
                </td>
                <th>계획번호</th>
                <td>
                  <Input
                    name="planno"
                    type="text"
                    value={filters.planno}
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
              <tr>
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
                <th>도면번호</th>
                <td>
                  <Input
                    name="dwgno"
                    type="text"
                    value={filters.dwgno}
                    onChange={filterInputChange}
                  />
                </td>
                <th>수주번호</th>
                <td>
                  <Input
                    name="ordnum"
                    type="text"
                    value={filters.ordnum}
                    onChange={filterInputChange}
                  />
                </td>
                <th>공정</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="proccd"
                      value={filters.proccd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </FilterBox>
        </FilterBoxWrap>
        <GridContainerWrap>
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>상세정보</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "320px", width: "1000px" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  person: personListData.find(
                    (item: any) => item.user_id === row.person
                  )?.user_name,
                  qtyunit: qtyunitListData.find(
                    (item: any) => item.sub_code === row.qtyunit
                  )?.code_name,
                  proccd: proccdListData.find(
                    (item: any) => item.sub_code === row.proccd
                  )?.code_name,
                  [SELECTED_FIELD]: selectedState[idGetter(row)],
                })),
                mainDataState
              )}
              onDataStateChange={onMainDataStateChange}
              {...mainDataState}
              //선택 기능
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
              onRowDoubleClick={onRowDoubleClick}
            >
              <GridColumn
                field="plandt"
                title="계획일자"
                cell={DateCell}
                width="100px"
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="proccd" title="공정" width="150px" />
              <GridColumn
                field="procseq"
                title="공정순서"
                width="100px"
                cell={NumberCell}
              />
              <GridColumn field="itemcd" title="품목코드" width="200px" />
              <GridColumn field="itemnm" title="품목명" width="200px" />
              <GridColumn field="insiz" title="규격" width="200px" />
              <GridColumn field="dwgno" title="도면번호" width="200px" />
              <GridColumn
                field="planqty"
                title="계획수량"
                width="120px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="purqty"
                title="발주량"
                width="120px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="janqty"
                title="잔량"
                width="120px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn
                field="doqty"
                title="처리량"
                width="120px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell}
              />
              <GridColumn field="remark" title="비고" width="300px" />
            </Grid>
          </GridContainer>
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>공정그리드</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "320px", width: "550px" }}
              data={process(
                detailDataResult.data.map((row) => ({
                  ...row,
                  qtyunit: qtyunitListData.find(
                    (item: any) => item.sub_code === row.qtyunit
                  )?.code_name,
                  itemacnt: itemacntListData.find(
                    (item: any) => item.sub_code === row.itemacnt
                  )?.code_name,
                  proccd: proccdListData.find(
                    (item: any) => item.sub_code === row.proccd
                  )?.code_name,
                  [SELECTED_FIELD]: detailselectedState[idGetter3(row)], //선택된 데이터
                })),
                detailDataState
              )}
              onDataStateChange={onDetailDataStateChange}
              {...detailDataState}
              //선택 subDataState
              dataItemKey={DATA_ITEM_KEY3}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onDetailSelectionChange}
              //스크롤 조회기능
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
              //더블클릭
            >
              <GridColumn
                field="proccd"
                title="공정"
                width="150px"
                footerCell={detailTotalFooterCell}
              />
              <GridColumn
                field="procseq"
                title="공정순서"
                width="100px"
                cell={NumberCell}
              />
              <GridColumn
                field="procqty"
                title="양품수량"
                width="100px"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell2}
              />
              <GridColumn
                field="badqty"
                title="불량수량"
                cell={NumberCell}
                footerCell={gridSumQtyFooterCell2}
                width="100px"
              />
            </Grid>
          </GridContainer>
        </GridContainerWrap>
        <GridContainer>
          <GridTitleContainer>
            <GridTitleContainer>
              <GridTitle>Keeping</GridTitle>
            </GridTitleContainer>
            <ButtonContainer>
              <Button
                onClick={onDeleteClick}
                fillMode="outline"
                themeColor={"primary"}
                icon="minus"
              ></Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "200px" }}
            data={process(
              subDataResult.data.map((row) => ({
                ...row,
                qtyunit: qtyunitListData.find(
                  (item: any) => item.sub_code === row.qtyunit
                )?.code_name,
                itemacnt: itemacntListData.find(
                  (item: any) => item.sub_code === row.itemacnt
                )?.code_name,
                doexdiv: doexdivListData.find(
                  (item: any) => item.sub_code === row.doexdiv
                )?.code_name,
                taxdiv: taxdivListData.find(
                  (item: any) => item.sub_code === row.taxdiv
                )?.code_name,
                reqdt: isValidDate(row.reqdt)
                  ? new Date(dateformat(row.reqdt))
                  : new Date(),
                proccd: proccdListData.find(
                  (item: any) => item.sub_code === row.proccd
                )?.code_name,
                [SELECTED_FIELD]: subselectedState[idGetter2(row)], //선택된 데이터
              })),
              subDataState
            )}
            onDataStateChange={onSubDataStateChange}
            {...subDataState}
            //선택 subDataState
            dataItemKey={DATA_ITEM_KEY2}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            onSelectionChange={onSubSelectionChange}
            //스크롤 조회기능
            fixedScroll={true}
            total={subDataResult.total}
            onScroll={onSubScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onSubSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            onItemChange={onMainItemChange}
            cellRender={customCellRender}
            rowRender={customRowRender}
            editField={EDIT_FIELD}
          >
            <GridColumn
              field="proccd"
              title="공정"
              width="150px"
              footerCell={subTotalFooterCell}
            />
            <GridColumn
              field="procseq"
              title="공정순서"
              width="100px"
              cell={NumberCell}
            />
            <GridColumn field="itemcd" title="품목코드" width="200px" />
            <GridColumn field="itemnm" title="품목명" width="200px" />
            <GridColumn field="insiz" title="규격" width="200px" />
            <GridColumn field="dwgno" title="도면번호" width="200px" />
            <GridColumn
              field="doqty"
              title="처리량"
              width="120px"
              cell={NumberCell}
            />
            <GridColumn field="plankey" title="생산계획번호" width="200px" />
            <GridColumn field="ordnum" title="수주번호" width="200px" />
          </Grid>
        </GridContainer>
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

export default CopyWindow;
