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
  GridItemChangeEvent,
} from "@progress/kendo-react-grid";
import { TextArea } from "@progress/kendo-react-inputs";
import { gridList } from "../store/columns/SY_A0125W_C";
import { Checkbox, CheckboxChangeEvent } from "@progress/kendo-react-inputs";
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
} from "@progress/kendo-react-treelist";
import { FilterDescriptor, SortDescriptor } from "@progress/kendo-data-query";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import BizComponentRadioGroup from "../components/RadioGroups/BizComponentRadioGroup";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { getter } from "@progress/kendo-react-common";
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
  FormBoxWrap,
  FormBox,
  GridContainerWrap,
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
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  handleKeyPressSearch,
  getGridItemChangedData,
  UseParaPc,
  UseGetValueFromSessionItem,
  useSysMessage,
} from "../components/CommonFunction";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  EXPANDED_FIELD,
  GAP,
} from "../components/CommonString";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import BizComponentComboBox from "../components/ComboBoxes/BizComponentComboBox";
import CheckBoxTreeListCell from "../components/Cells/CheckBoxTreeListCell";
import DepartmentsWindow from "../components/Windows/CommonWindows/DepartmentsWindow";

const allMenuColumns: TreeListColumnProps[] = [
  { field: "dptcd", title: "부서코드", expandable: true },
  { field: "dptnm", title: "부서명", expandable: false },
  {
    field: "useyn",
    title: "사용여부",
    expandable: false,
    cell: CheckBoxTreeListCell,
  },
  { field: "remark", title: "비고", expandable: false },
];

interface AppState {
  data: dpt[];
  dataState: DataState;
  expanded: number[];
}

export interface dpt {
  dptcd: string;
  dptnm: string;
  location: string;
  mfcsaldv: string;
  orgdiv: string;
  prntdptcd: string;
  prntdptnm: string;
  refdptcd: string;
  remark: string;
  useyn: string;
}

export interface DataState {
  sort: SortDescriptor[];
  filter: FilterDescriptor[];
}

const DATA_ITEM_KEY = "dptcd";
const SUB_DATA_ITEM_KEY = "user_id";
const SUB_ITEMS_FIELD: string = "menus";
const ALL_MENU_DATA_ITEM_KEY = "dptcd";

const SY_A0125W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);

  const [departmentWindowVisible, setDepartmentWindowVisible] =
    useState<boolean>(false);

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
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA002,R_USEYN,L_HU005",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [locationListData, setLocationListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  const [postcdListData, setpostcdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const locationQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA002")
      );
      const postcdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_HU005")
      );
      fetchQuery(locationQueryStr, setLocationListData);
      fetchQuery(postcdQueryStr, setpostcdListData);
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
  const [allMenuDataResult, setAllMenuDataResult] = useState<any>([]);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [mainPgNum, setMainPgNum] = useState(1);
  const [subPgNum, setSubPgNum] = useState(1);
  const [workType, setWorkType] = useState<string>("U");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const InputChange = (e: any) => {
    const { value, name } = e.target;

    if (name == "useyn") {
      if (value == false || value == "N") {
        setInfomation((prev) => ({
          ...prev,
          [name]: "N",
        }));
      } else {
        setInfomation((prev) => ({
          ...prev,
          [name]: "Y",
        }));
      }
    } else {
      setInfomation((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const RadioChange = (e: any) => {
    const { name, value } = e;

    setInfomation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const ComboBoxChange = (e: any) => {
    const { name, value } = e;

    setInfomation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setDepartmentData = (data: IDepartmentData) => {
    setInfomation((prev) => ({
      ...prev,
      prntdptcd: data.dptcd,
      prntdptnm: data.dptnm,
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

  const [infomation, setInfomation] = useState({
    pgSize: PAGE_SIZE,
    workType: "U",
    orgdiv: "01",
    dptcd: "",
    dptnm: "",
    insert_form_id: "",
    insert_pc: "",
    insert_time: "",
    insert_user_id: "",
    last_update_time: "",
    location: "",
    mfcsaldv: "1",
    prntdptcd: "",
    prntdptnm: "",
    refdptcd: "",
    remark: "",
    update_form_id: "",
    update_pc: "",
    update_time: "",
    update_userid: "",
    useyn: "Y",
  });

  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "Q",
    orgdiv: "01",
    location: "01",
    dptcd: "",
    dptnm: "",
    user_name: "",
    serviceid: "2207A046",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SY_A0125W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_dptcd": filters.dptcd,
      "@p_dptnm": filters.dptnm,
      "@p_user_name": filters.user_name,
      "@p_serviceid": filters.serviceid,
    },
  };

  const [subfilters, setsubFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "USERINFO",
    orgdiv: "01",
    dptcd: infomation.dptcd,
    dptnm: "",
    user_name: "",
    serviceid: "2207A046",
    location: "01",
  });

  //조회조건 파라미터
  const subparameters: Iparameters = {
    procedureName: "P_SY_A0125W_Q",
    pageNumber: subPgNum,
    pageSize: subfilters.pgSize,
    parameters: {
      "@p_work_type": subfilters.workType,
      "@p_orgdiv": subfilters.orgdiv,
      "@p_location": subfilters.location,
      "@p_dptcd": subfilters.dptcd,
      "@p_dptnm": subfilters.dptnm,
      "@p_user_name": subfilters.user_name,
      "@p_serviceid": subfilters.serviceid,
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
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        const dataTree: any = createDataTree(
          rows,
          (i: any) => i.dptcd,
          (i: any) => i.prntdptcd,
          SUB_ITEMS_FIELD
        );

        setAllMenuDataResult(dataTree);
        setState((prev) => {
          return {
            ...prev,
            data: dataTree,
          };
        });
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchSubGrid = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", subparameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true && data.tables.length != 0) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
      }));
      if (totalRowCnt > 0) {
        setSubDataResult((prev) => {
          return {
            data: [...prev.data, ...row],
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
    fetchSubGrid();
  }, [subPgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];

        setSelectedState({ [firstRowData.dptcd]: true });

        setInfomation({
          pgSize: PAGE_SIZE,
          workType: "U",
          orgdiv: "01",
          dptcd: firstRowData.dptcd,
          dptnm: firstRowData.dptnm,
          insert_form_id: firstRowData.insert_form_id,
          insert_pc: firstRowData.insert_pc,
          insert_time: firstRowData.insert_time,
          insert_user_id: firstRowData.insert_user_id,
          last_update_time: firstRowData.last_update_time,
          location: firstRowData.location,
          mfcsaldv: firstRowData.mfcsaldv,
          prntdptcd: firstRowData.prntdptcd,
          prntdptnm: firstRowData.prntdptnm,
          refdptcd: firstRowData.refdptcd,
          remark: firstRowData.remark,
          update_form_id: firstRowData.update_form_id,
          update_pc: firstRowData.update_pc,
          update_time: firstRowData.update_time,
          update_userid: firstRowData.update_userid,
          useyn: firstRowData.useyn == "Y" ? "Y" : "N",
        });

        setsubFilters((prev) => ({
          ...prev,
          workType: "USERINFO",
          dptcd: firstRowData.dptcd,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
      }
    }
  }, [subDataResult]);

  useEffect(() => {
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subfilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subPgNum]);

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: TreeListSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "U",
      orgdiv: "01",
      dptcd: selectedRowData.dptcd,
      dptnm: selectedRowData.dptnm,
      insert_form_id: selectedRowData.insert_form_id,
      insert_pc: selectedRowData.insert_pc,
      insert_time: selectedRowData.insert_time,
      insert_user_id: selectedRowData.insert_user_id,
      last_update_time: selectedRowData.last_update_time,
      location: selectedRowData.location,
      mfcsaldv: selectedRowData.mfcsaldv,
      prntdptcd: selectedRowData.prntdptcd,
      prntdptnm: selectedRowData.prntdptnm,
      refdptcd: selectedRowData.refdptcd,
      remark: selectedRowData.remark,
      update_form_id: selectedRowData.update_form_id,
      update_pc: selectedRowData.update_pc,
      update_time: selectedRowData.update_time,
      update_userid: selectedRowData.update_userid,
      useyn: selectedRowData.useyn == "Y" ? "Y" : "N",
    });

    setsubFilters((prev) => ({
      ...prev,
      workType: "USERINFO",
      dptcd: selectedRowData.dptcd,
    }));
  };

  const onSubDataSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });

    setSelectedsubDataState(newSelectedState);
  };

  //엑셀 내보내기
  let _export: any;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save(
        treeToFlat(processData(), EXPANDED_FIELD, SUB_ITEMS_FIELD),
        allMenuColumns
      );
    }
  };

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  const subTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {subDataResult.total}건
      </td>
    );
  };

  const onAddClick2 = () => {
    setWorkType("N");
    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "N",
      orgdiv: "01",
      dptcd: "",
      dptnm: "",
      insert_form_id: "",
      insert_pc: "",
      insert_time: "",
      insert_user_id: "",
      last_update_time: "",
      location: "",
      mfcsaldv: "",
      prntdptcd: "",
      prntdptnm: "",
      refdptcd: "",
      remark: "",
      update_form_id: "",
      update_pc: "",
      update_time: "",
      update_userid: "",
      useyn: "Y",
    });
  };

  const [allMenuExpanded, setAllMenuExpanded] = React.useState<string[]>([]);

  const allMenuCallback = (item: any) =>
    allMenuExpanded.includes(item[ALL_MENU_DATA_ITEM_KEY])
      ? extendDataItem(item, SUB_ITEMS_FIELD, { [EXPANDED_FIELD]: true })
      : item;

  const onAllMenuExpandChange = (e: TreeListExpandChangeEvent) => {
    setState({
      ...state,
      expanded: e.value
        ? state.expanded.filter(
            (id) => id !== e.dataItem[ALL_MENU_DATA_ITEM_KEY]
          )
        : [...state.expanded, e.dataItem[ALL_MENU_DATA_ITEM_KEY]],
    });
    // setAllMenuExpanded(
    //   e.value
    //     ? allMenuExpanded.filter(
    //         (id) => id !== e.dataItem[ALL_MENU_DATA_ITEM_KEY]
    //       )
    //     : [...allMenuExpanded, e.dataItem[ALL_MENU_DATA_ITEM_KEY]]
    // );
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

  interface IDepartmentData {
    dptcd: string;
    dptnm: string;
    useyn: string;
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

  type TdataArr = {
    userid_s: String[];
    postcd_s: String[];
    email_s: String[];
    mobile_no_s: String[];
    memo_s: String[];
  };

  const onSubDataSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    fetchMainGrid();
    fetchSubGrid();
  };

  const onSubItemChange = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      SUB_DATA_ITEM_KEY
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    const newData = subDataResult.data.map((item) =>
      item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
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

    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    const newData = subDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setSubDataResult((prev) => {
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

  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    dptcd: "",
  });
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick2 = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }

    const item = Object.getOwnPropertyNames(selectedState)[0];
    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      dptcd: item,
    }));
  };

  const [paraData, setParaData] = useState({
    workType: "UM",
    orgdiv: "01",
    dptcd: infomation.dptcd,
    dptnm: infomation.dptnm,
    location: infomation.location,
    mfcsaldv: infomation.mfcsaldv,
    prntdptcd: infomation.prntdptcd,
    remark: infomation.remark,
    useyn: infomation.useyn == "Y" ? "Y" : "N",
    userid_s: "",
    postcd_s: "",
    email_s: "",
    mobile_no_s: "",
    memo_s: "",
    userid: userId,
    pc: pc,
    form_id: "SY_A0125W",
  });

  const para: Iparameters = {
    procedureName: "P_SY_A0125W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.workType,
      "@p_orgdiv": paraData.orgdiv,
      "@p_location": paraData.location,
      "@p_dptcd": paraData.dptcd,
      "@p_dptnm": paraData.dptnm,
      "@p_prntdptcd": paraData.prntdptcd,
      "@p_mfcsaldv": paraData.mfcsaldv,
      "@p_useyn": paraData.useyn,
      "@p_remark": paraData.remark,
      "@p_userid_s": paraData.userid_s,
      "@p_postcd_s": paraData.postcd_s,
      "@p_email_s": paraData.email_s,
      "@p_mobile_no_s": paraData.mobile_no_s,
      "@p_memo_s": paraData.memo_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "SY_A0125W",
    },
  };

  const paraDeleted: Iparameters = {
    procedureName: "P_SY_A0125W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": infomation.orgdiv,
      "@p_location": infomation.location,
      "@p_dptcd": paraDataDeleted.dptcd,
      "@p_dptnm": infomation.dptnm,
      "@p_prntdptcd": infomation.prntdptcd,
      "@p_mfcsaldv": infomation.mfcsaldv,
      "@p_useyn": infomation.useyn,
      "@p_remark": infomation.remark,
      "@p_userid_s": "",
      "@p_postcd_s": "",
      "@p_email_s": "",
      "@p_mobile_no_s": "",
      "@p_memo_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "SY_A0125W",
    },
  };

  const infopara: Iparameters = {
    procedureName: "P_SY_A0125W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": infomation.workType,
      "@p_orgdiv": infomation.orgdiv,
      "@p_location": infomation.location,
      "@p_dptcd": infomation.dptcd,
      "@p_dptnm": infomation.dptnm,
      "@p_prntdptcd": infomation.prntdptcd,
      "@p_mfcsaldv": infomation.mfcsaldv,
      "@p_useyn": infomation.useyn,
      "@p_remark": infomation.remark,
      "@p_userid_s": "",
      "@p_postcd_s": "",
      "@p_email_s": "",
      "@p_mobile_no_s": "",
      "@p_memo_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "SY_A0125W",
    },
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") {
      fetchToDelete();
    }
  }, [paraDataDeleted]);

  const onSaveClick = async () => {
    const dataItem = subDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0) return false;
    let dataArr: TdataArr = {
      userid_s: [],
      postcd_s: [],
      email_s: [],
      mobile_no_s: [],
      memo_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const { user_id, postcd, email, mobile_no, memo } = item;

      dataArr.userid_s.push(user_id);
      dataArr.postcd_s.push(postcd);
      dataArr.email_s.push(email);
      dataArr.mobile_no_s.push(mobile_no);
      dataArr.memo_s.push(memo);
    });

    setParaData((prev) => ({
      ...prev,
      workType: "UM",
      orgdiv: "01",
      dptcd: infomation.dptcd,
      dptnm: infomation.dptnm,
      location: infomation.location,
      mfcsaldv: infomation.mfcsaldv,
      prntdptcd: infomation.prntdptcd,
      remark: infomation.remark,
      useyn: infomation.useyn == "Y" ? "Y" : "N",
      userid_s: dataArr.userid_s.join("|"),
      postcd_s: dataArr.postcd_s.join("|"),
      email_s: dataArr.email_s.join("|"),
      mobile_no_s: dataArr.mobile_no_s.join("|"),
      memo_s: dataArr.memo_s.join("|"),
      userid: userId,
      pc: pc,
      form_id: "SY_A0125W",
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
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.dptcd = "";
  };

  const onSaveClick2 = async () => {
    fetchSaved();
  };

  const fetchSaved = async () => {
    let data: any;

    let valid = true;
    try {
      if (!infomation.dptcd) {
        throw findMessage(messagesData, "SY_A0125W_001");
      }

      if (!infomation.dptnm) {
        throw findMessage(messagesData, "SY_A0125W_002");
      }

      mainDataResult.data.map((item: any) => {
        if (infomation.workType == "N") {
          if (item.dptcd == infomation.dptcd) {
            throw findMessage(messagesData, "SY_A0125W_003");
          }
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    setLoading(true);

    try {
      data = await processApi<any>("procedure", infopara);
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

  const fetchTodoGridSaved = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setSubPgNum(1);
      setSubDataResult(process([], subDataState));

      fetchSubGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.dptcd != "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);

  const [state, setState] = React.useState<AppState>({
    data: [...allMenuDataResult],
    dataState: {
      sort: [{ field: "dptcd", dir: "asc" }],
      filter: [],
    },
    expanded: [],
  });

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
        [EXPANDED_FIELD]: expanded.includes(item.dptcd),
      })
    );
  };
  const onDepartmentWndClick = () => {
    setDepartmentWindowVisible(true);
  };

  return (
    <>
      <TitleContainer>
        <Title>부서관리</Title>

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
              <th>부서코드</th>
              <td>
                <Input
                  name="dptcd"
                  type="text"
                  value={filters.dptcd}
                  onChange={filterInputChange}
                />
              </td>
              <th>부서명</th>
              <td>
                <Input
                  name="dptnm"
                  type="text"
                  value={filters.dptnm}
                  onChange={filterInputChange}
                />
              </td>
              <th>사용자명</th>
              <td>
                <Input
                  name="user_name"
                  type="text"
                  value={filters.user_name}
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
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainerWrap>
        <GridContainer width="46%">
          <ExcelExport
            ref={(exporter) => (_export = exporter)}
            hierarchy={true}
          >
            <GridTitleContainer>
              <GridTitle>부서리스트</GridTitle>
            </GridTitleContainer>
            <TreeList
              style={{ height: "80vh", overflow: "auto" }}
              data={processData()}
              expandField={EXPANDED_FIELD}
              subItemsField={SUB_ITEMS_FIELD}
              onExpandChange={onAllMenuExpandChange}
              //선택 기능
              dataItemKey={ALL_MENU_DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              onSelectionChange={onSelectionChange}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              {...state.dataState}
              sortable={{ mode: "multiple" }}
              //드래그용 행
              columns={allMenuColumns}
              toolbar={<TreeListToolbar />}
            />
          </ExcelExport>
        </GridContainer>
        <GridContainer width={`calc(54% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>기본정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onAddClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="file-add"
              >
                신규
              </Button>
              <Button
                onClick={onSaveClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="save"
              >
                저장
              </Button>
              <Button
                onClick={onDeleteClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="delete"
              >
                삭제
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <FormBoxWrap border={true}>
            <FormBox>
              <tbody>
                <tr>
                  <th>상위부서</th>
                  <td>
                    <Input
                      name="prntdptcd"
                      type="text"
                      value={infomation.prntdptcd}
                      onChange={InputChange}
                    />
                    <ButtonInInput>
                      <Button
                        onClick={onDepartmentWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInInput>
                  </td>
                  <th>상위부서명</th>
                  <td>
                    <Input
                      name="prntdptnm"
                      type="text"
                      value={infomation.prntdptnm}
                      onChange={InputChange}
                      className="readonly"
                    />
                  </td>
                  <th>사업장</th>
                  <td>
                    {bizComponentData !== null && (
                      <BizComponentComboBox
                        name="location"
                        value={infomation.location}
                        bizComponentId="L_BA002"
                        bizComponentData={bizComponentData}
                        changeData={ComboBoxChange}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <th>부서코드</th>
                  <td>
                    <Input
                      name="dptcd"
                      type="text"
                      value={infomation.dptcd}
                      onChange={InputChange}
                      className="required"
                    />
                  </td>
                  <th>부서명</th>
                  <td>
                    <Input
                      name="dptnm"
                      type="text"
                      value={infomation.dptnm}
                      onChange={InputChange}
                      className="required"
                    />
                  </td>
                  <th>사용여부</th>
                  <td>
                    <Checkbox
                      name="useyn"
                      value={infomation.useyn == "Y" ? true : false}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>비고</th>
                  <td colSpan={5}>
                    <TextArea
                      value={infomation.remark}
                      name="remark"
                      rows={2}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <GridTitleContainer>
            <GridTitle>부서인원정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onSaveClick}
                fillMode="outline"
                themeColor={"primary"}
                icon="save"
              ></Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "58.3vh" }}
            data={process(
              subDataResult.data.map((row) => ({
                ...row,
                postcd: postcdListData.find(
                  (item: any) => item.sub_code === row.postcd
                )?.code_name,
                rowstatus:
                  row.rowstatus == null ||
                  row.rowstatus == "" ||
                  row.rowstatus == undefined
                    ? ""
                    : row.rowstatus,
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
              mode: "multiple",
            }}
            onSelectionChange={onSubDataSelectionChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={subDataResult.total}
            onScroll={onSubScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onSubDataSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            onItemChange={onSubItemChange}
            cellRender={customCellRender}
            rowRender={customRowRender}
            editField={EDIT_FIELD}
          >
            <GridColumn field="rowstatus" title=" " width="50px" />
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdAllList"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      id={item.id}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      className={
                        item.sortOrder === 0
                          ? "readonly"
                          : item.sortOrder === 1
                          ? "readonly"
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0 ? subTotalFooterCell : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </GridContainer>
      </GridContainerWrap>
      {departmentWindowVisible && (
        <DepartmentsWindow
          setVisible={setDepartmentWindowVisible}
          workType={"FILTER"}
          setData={setDepartmentData}
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

export default SY_A0125W;
