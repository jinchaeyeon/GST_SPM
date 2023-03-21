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
  GridExpandChangeEvent,
  GridItemChangeEvent,
} from "@progress/kendo-react-grid";
import {
  TreeList,
  createDataTree,
  mapTree,
  TreeListToolbar,
  extendDataItem,
  TreeListExpandChangeEvent,
  TreeListColumnProps,
  filterBy,
  orderBy,
  treeToFlat,
  TreeListSelectionChangeEvent,
  TreeListCellProps,
  TreeListHeaderSelectionCell,
  TreeListHeaderSelectionChangeEvent,
  TreeListSelectionCell,
} from "@progress/kendo-react-treelist";
import { bytesToBase64 } from "byte-base64";
import { CellRender, RowRender } from "../Renderers/Renderers";
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
} from "../CommonFunction";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { IWindowPosition } from "../../hooks/interfaces";
import {
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  EXPANDED_FIELD,
} from "../CommonString";
import { COM_CODE_DEFAULT_VALUE } from "../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../store/atoms";
import CustomOptionRadioGroup from "../RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../ComboBoxes/CustomOptionComboBox";
import NumberCell from "../Cells/NumberCell";
import ComboBoxTreeListCell from "../Cells/ComboBoxTreeListCell";
import ComboBoxCell from "../Cells/ComboBoxCell";
import NumberTreeCell from "../Cells/NumberTreeCell";
import { FilterDescriptor, SortDescriptor } from "@progress/kendo-data-query";
import CheckBoxTreeListCell from "../Cells/CheckBoxTreeListCell";

type IWindow = {
  workType: "FILTER" | "ROW_ADD" | "ROWS_ADD";
  setVisible(t: boolean): void;
  setData(data: object): void; //data : 선택한 품목 데이터를 전달하는 함수
};

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA171,L_BA172,L_BA173", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "itemlvl1"
      ? "L_BA171"
      : field === "itemlvl2"
      ? "L_BA172"
      : field === "itemlvl3"
      ? "L_BA173"
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

interface AppState {
  data: lev[];
  dataState: DataState;
  expanded: number[];
  selected: number[];
}

export interface lev {
  ID: string;
  ItemCD: string;
  ItemNM: string;
  LEV: number;
  ParentID: string;
  bnatur: string;
  chk: string;
  insiz: string;
  itemacnt: string;
  itemlvl1: string;
  itemlvl2: string;
  itemlvl3: string;
  itemno: string;
  jeagoqty: number;
  num: number;
  qty: number;
  qtyunit: string;
  rowstatus: string;
  spec: string;
  unitqty: number;
}
export interface DataState {
  sort: SortDescriptor[];
  filter: FilterDescriptor[];
}

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
  const SUB_ITEMS_FIELD: string = "menus";
  const ALL_MENU_DATA_ITEM_KEY = "ItemCD";
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const idGetter3 = getter(DATA_ITEM_KEY3);
  const idGetter4 = getter(ALL_MENU_DATA_ITEM_KEY);
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
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
        doexdiv: defaultOption.find((item: any) => item.id === "doexdiv")
          .valueCode,
        dptcd: defaultOption.find((item: any) => item.id === "dptcd").valueCode,
        ordsts: defaultOption.find((item: any) => item.id === "ordsts")
          .valueCode,
        finyn: defaultOption.find((item: any) => item.id === "finyn2")
          .valueCode,
        dtgb: defaultOption.find((item: any) => item.id === "dtgb").valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA061,L_BA015, R_USEYN,L_BA171,L_BA172,L_BA173,R_YESNOALL,L_sysUserMaster_001",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [itemacntListData, setItemacntListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [qtyunitListData, setQtyunitListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  const [personListData, setPersonListData] = useState([
    { user_id: "", user_name: "" },
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
      const itemlvl1QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA171")
      );
      const itemlvl2QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA172")
      );
      const itemlvl3QueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA173")
      );
      fetchQuery(itemlvl1QueryStr, setItemlvl1ListData);
      fetchQuery(itemlvl2QueryStr, setItemlvl2ListData);
      fetchQuery(itemlvl3QueryStr, setItemlvl3ListData);
      fetchQuery(itemacntQueryStr, setItemacntListData);
      fetchQuery(qtyunitQueryStr, setQtyunitListData);
      fetchQuery(personQueryStr, setPersonListData);
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
  const [allMenuDataResult, setAllMenuDataResult] = useState<any>([]);
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
    workType: "ITEM",
    orgdiv: "01",
    itemcd: "",
    itemnm: "",
    insiz: "",
    itemacnt: "",
    itemlvl1: "",
    itemlvl2: "",
    itemlvl3: "",
    finyn: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    itemcd: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_A2000W_Sub1_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": "01",
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_itemacnt": filters.itemacnt,
      "@p_itemlvl1": filters.itemlvl1,
      "@p_itemlvl2": filters.itemlvl2,
      "@p_itemlvl3": filters.itemlvl3,
      "@p_finyn": filters.finyn,
    },
  };

  //조회조건 파라미터
  const detailParameters: Iparameters = {
    procedureName: "P_MA_A2000W_Sub1_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "BOM",
      "@p_orgdiv": "01",
      "@p_itemcd": detailFilters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_insiz": filters.insiz,
      "@p_itemacnt": filters.itemacnt,
      "@p_itemlvl1": filters.itemlvl1,
      "@p_itemlvl2": filters.itemlvl2,
      "@p_itemlvl3": filters.itemlvl3,
      "@p_finyn": filters.finyn,
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
          rowstatus: "N",
          itemacnt: itemacntListData.find(
            (item: any) => item.sub_code === row.itemacnt
          )?.code_name,
          itemlvl1: itemlvl1ListData.find(
            (item: any) => item.sub_code === row.itemlvl1
          )?.code_name,
          itemlvl2: itemlvl2ListData.find(
            (item: any) => item.sub_code === row.itemlvl2
          )?.code_name,
          itemlvl3: itemlvl3ListData.find(
            (item: any) => item.sub_code === row.itemlvl3
          )?.code_name,
        };
      });

      if (totalRowCnt > 0) {
        const dataTree: any = createDataTree(
          rows,
          (i: any) => i.ItemCD,
          (i: any) => i.ParentID,
          SUB_ITEMS_FIELD
        );

        setAllMenuDataResult(dataTree);
        setState((prev) => {
          return {
            ...prev,
            data: dataTree,
          };
        });
        setDetailDataResult((prev) => {
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
          itemcd: firstRowData.itemcd,
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
      itemcd: selectedRowData.itemcd,
    }));
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

  const [allMenuExpanded, setAllMenuExpanded] = React.useState<string[]>([]);

  const onAllMenuExpandChange = (e: TreeListExpandChangeEvent) => {
    setState({
      ...state,
      expanded: e.value
        ? state.expanded.filter(
            (id) => id !== e.dataItem[ALL_MENU_DATA_ITEM_KEY]
          )
        : [...state.expanded, e.dataItem[ALL_MENU_DATA_ITEM_KEY]],
    });
  };

  const [selectedState2, setSelectedState2] = React.useState<{
    [ItemCD: string]: number[] | boolean;
  }>({});
  const [state, setState] = React.useState<AppState>({
    data: [...allMenuDataResult],
    dataState: {
      sort: [{ field: "ItemCD", dir: "asc" }],
      filter: [],
    },
    expanded: [],
    selected: [],
  });

  const onDetailSelectionChange = React.useCallback(
    (event: TreeListSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState2,
        dataItemKey: DATA_ITEM_KEY3,
      });
      setSelectedState2(newSelectedState);
    },
    [selectedState2]
  );

  const headerSelectionValue = (dataTree: lev[], selectedState2: any) => {
    let allSelected = true;

    mapTree(dataTree, SUB_ITEMS_FIELD, (item) => {
      allSelected = allSelected && selectedState2[idGetter3(item)];
      return item;
    });

    return allSelected;
  };

  const allMenuColumns: TreeListColumnProps[] = [
    {
      field: "selected",
      width: "7%",
      headerSelectionValue: headerSelectionValue(state.data, selectedState2),
      cell: TreeListSelectionCell,
      headerCell: TreeListHeaderSelectionCell,
    },
    { field: "LEV", title: "LEV", expandable: true },
    { field: "ItemCD", title: "품목코드", expandable: false },
    { field: "ItemNM", title: "품목명", expandable: false },
    { field: "itemlvl1", title: "대분류", expandable: false },
    { field: "itemlvl2", title: "중분류", expandable: false },
    { field: "itemlvl3", title: "소분류", expandable: false },
    { field: "insiz", title: "규격", expandable: false },
    { field: "itemacnt", title: "품목계정", expandable: false },
    {
      field: "unitqty",
      title: "단위수량",
      expandable: false,
      cell: NumberTreeCell,
    },
    {
      field: "jeagoqty",
      title: "재고량",
      expandable: false,
      cell: NumberTreeCell,
    },
    { field: "qty", title: "처리량", expandable: false, cell: NumberTreeCell },
  ];

  const processData = () => {
    let { data, dataState } = state;
    let filteredData = filterBy(data, dataState.filter, SUB_ITEMS_FIELD);
    let sortedData = orderBy(filteredData, dataState.sort, SUB_ITEMS_FIELD);
    return addExpandField(sortedData);
  };

  const addExpandField = (dataTree: TreeListColumnProps[]) => {
    const expanded = state.expanded;
    return mapTree(dataTree, SUB_ITEMS_FIELD, (item) =>
      extendDataItem(item, SUB_ITEMS_FIELD, {
        [EXPANDED_FIELD]: expanded.includes(item.ItemCD),
        selected: selectedState2[idGetter3(item)],
      })
    );
  };

  const onHeaderSelectionChange = React.useCallback(
    (event: TreeListHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked: boolean = checkboxElement.checked;
      const newSelectedState: any = {};

      event.dataItems.forEach((item: any) => {
        newSelectedState[idGetter3(item)] = checked;
      });
      setSelectedState2(newSelectedState);
    },
    []
  );

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
    let arr: any = [];
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

    for (const [key, value] of Object.entries(selectedState2)) {
      if (value == true) {
        arr.push(parseInt(key));
      }
    }

    const selectRows = detailDataResult.data.filter(
      (item: any) => arr.includes(item.num) == true
    );

    setSelectedState2({});
    selectRows.map((selectRow: any) => {
      const newDataItem = {
        [DATA_ITEM_KEY]: seq + 1,
        chk: selectRow.chk,
        insiz: selectRow.insiz,
        itemacnt: itemacntListData.find(
          (item: any) => item.code_name === selectRow.itemacnt
        )?.sub_code,
        itemcd: selectRow.ItemCD,
        itemlvl1: itemlvl1ListData.find(
          (item: any) => item.code_name === selectRow.itemlvl1
        )?.sub_code,
        itemlvl2: itemlvl2ListData.find(
          (item: any) => item.code_name === selectRow.itemlvl2
        )?.sub_code,
        itemlvl3: itemlvl3ListData.find(
          (item: any) => item.code_name === selectRow.itemlvl3
        )?.sub_code,
        itemnm: selectRow.ItemNM,
        itemno: selectRow.itemno,
        jeagoqty: selectRow.jeagoqty,
        lev: selectRow.LEV,
        lotnum: selectRow.lotnum,
        qty: selectRow.qty,
        qtyunit: selectRow.qtyunit,
        rowstatus: "N",
        spec: selectRow.spec,
        unitqty: selectRow.unitqty,
        amt: 0,
        unp: 0,
        wonamt: 0,
        taxamt: 0,
      };
      setSubDataResult((prev) => {
        return {
          data: [...prev.data, newDataItem],
          total: prev.total + 1,
        };
      });
      seq++;
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
    if (field != "itemcd" && field != "insiz" && field != "itemnm") {
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
        title={"BOM참조"}
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
                <th>규격</th>
                <td>
                  <Input
                    name="insiz"
                    type="text"
                    value={filters.insiz}
                    onChange={filterInputChange}
                  />
                </td>
                <th>등록여부</th>
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
                <th>대분류</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="itemlvl1"
                      value={filters.itemlvl1}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>중분류</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="itemlvl2"
                      value={filters.itemlvl2}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>소분류</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="itemlvl3"
                      value={filters.itemlvl3}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
                <th>품목계정</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="itemacnt"
                      value={filters.itemacnt}
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
          <Grid
            style={{ height: "200px" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
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
          >
            <GridColumn
              field="itemcd"
              title="품목코드"
              width="540px"
              footerCell={mainTotalFooterCell}
            />
            <GridColumn field="itemnm" title="품목명" width="500px" />
            <GridColumn field="insiz" title="규격" width="500px" />
          </Grid>
        </GridContainer>
        <GridContainer>
          <GridTitleContainer>
            <ButtonContainer>
              <Button
                onClick={onRowDoubleClick}
                fillMode="outline"
                themeColor={"primary"}
                icon="plus"
              ></Button>
            </ButtonContainer>
          </GridTitleContainer>
          <TreeList
            style={{ height: "200px", overflow: "auto" }}
            data={processData()}
            expandField={EXPANDED_FIELD}
            subItemsField={SUB_ITEMS_FIELD}
            onExpandChange={onAllMenuExpandChange}
            //선택 기능
            dataItemKey={DATA_ITEM_KEY3}
            selectedField={SELECTED_FIELD}
            onSelectionChange={onDetailSelectionChange}
            onHeaderSelectionChange={onHeaderSelectionChange}
            {...state.dataState}
            sortable={{ mode: "multiple" }}
            //드래그용 행
            columns={allMenuColumns}
            toolbar={<TreeListToolbar />}
          />
        </GridContainer>
        <GridContainer>
          <GridTitleContainer>
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
              field="itemcd"
              title="품목코드"
              width="300px"
              footerCell={subTotalFooterCell}
            />
            <GridColumn field="itemnm" title="품목명" width="200px" />
            <GridColumn
              field="itemlvl1"
              title="대분류"
              width="170px"
              cell={CustomComboBoxCell}
            />
            <GridColumn
              field="itemlvl2"
              title="중분류"
              width="170px"
              cell={CustomComboBoxCell}
            />
            <GridColumn
              field="itemlvl3"
              title="소분류"
              width="170px"
              cell={CustomComboBoxCell}
            />
            <GridColumn field="insiz" title="규격" width="200px" />
            <GridColumn
              field="qty"
              title="처리량"
              width="120px"
              cell={NumberCell}
            />
            <GridColumn field="itemacnt" title="품목계정" width="200px" />
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
