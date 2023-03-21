import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridFooterCellProps,
} from "@progress/kendo-react-grid";
import { gridList } from "../store/columns/MA_B7200W_C";
import { DatePicker } from "@progress/kendo-react-dateinputs";
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
  GridContainerWrap,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
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
  rowsWithSelectedDataResult,
  rowsOfDataResult,
} from "../components/CommonFunction";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  GAP,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

const DATA_ITEM_KEY = "num";
const dateField = ["indt", "outdt", "proddt"];
const numberField = [
  "before_qty",
  "in_qty",
  "out_qty",
  "now_qty",
  "safeqty",
  "qty",
];

const MA_B7200W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");
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
        itemacnt: defaultOption.find((item: any) => item.id === "itemacnt")
          .valueCode,
        proccd: defaultOption.find((item: any) => item.id === "proccd")
          .valueCode,
        stockyn: defaultOption.find((item: any) => item.id === "stockyn")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA061,L_BA015,L_sysUserMaster_001,L_PR010",
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
  const [personListData, setPersonListData] = useState([
    { user_id: "", user_name: "" },
  ]);
  const [qtyunitListData, setQtyunitListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );
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
      fetchQuery(proccdQueryStr, setProccdListData);
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
    group: [
      {
        field: "group_category_name",
      },
    ],
    sort: [],
  });
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });
  const [detailDataState2, setDetailDataState2] = useState<State>({
    sort: [],
  });

  const [mainDataState2, setMainDataState2] = useState<State>({
    group: [
      {
        field: "group_category_name",
      },
    ],
    sort: [],
  });

  const [detailDataState3, setDetailDataState3] = useState<State>({
    sort: [],
  });
  const [detailDataState4, setDetailDataState4] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], detailDataState)
  );

  const [detailDataResult2, setDetailDataResult2] = useState<DataResult>(
    process([], detailDataState2)
  );

  const [mainDataResult2, setMainDataResult2] = useState<DataResult>(
    process([], mainDataState2)
  );

  const [detailDataResult3, setDetailDataResult3] = useState<DataResult>(
    process([], detailDataState3)
  );

  const [detailDataResult4, setDetailDataResult4] = useState<DataResult>(
    process([], detailDataState4)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailselectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailselectedState2, setDetailSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedState2, setSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailselectedState3, setDetailSelectedState3] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailselectedState4, setDetailSelectedState4] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);
  const [detailPgNum2, setDetailPgNum2] = useState(1);
  const [mainPgNum2, setMainPgNum2] = useState(1);
  const [detailPgNum3, setDetailPgNum3] = useState(1);
  const [detailPgNum4, setDetailPgNum4] = useState(1);
  const [tabSelected, setTabSelected] = React.useState(0);
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
    workType: "LIST1",
    orgdiv: "01",
    location: "01",
    frdt: new Date(),
    todt: new Date(),
    itemcd: "",
    itemnm: "",
    itemacnt: "",
    insiz: "",
    lotnum: "",
    proccd: "",
    orglot: "",
    stockyn: "",
    gubun: "I",
    find_row_value: "",
    scrollDirrection: "down",
    pgNum: 1,
    isSearch: true,
    pgGap: 0,
  });

  const [filters2, setFilters2] = useState({
    pgSize: PAGE_SIZE,
    workType: "LIST2",
    find_row_value: "",
    scrollDirrection: "down",
    pgNum: 1,
    isSearch: true,
    pgGap: 0,
  });

  const [detailfilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "DETAIL1_IN",
    itemcd: "",
    itemacnt: "",
    lotnum: "",
  });

  const [detailfilters2, setDetailFilters2] = useState({
    pgSize: PAGE_SIZE,
    workType: "DETAIL2_IN",
    itemcd: "",
    proccd: "",
    lotnum: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: filters.pgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": filters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": filters.lotnum,
      "@p_proccd": filters.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };

  //조회조건 파라미터
  const detailparameters: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: detailPgNum,
    pageSize: detailfilters.pgSize,
    parameters: {
      "@p_work_type": detailfilters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": detailfilters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": detailfilters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": detailfilters.lotnum,
      "@p_proccd": filters.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };

  const detailparameters2: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: detailPgNum2,
    pageSize: detailfilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL1_OUT",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": detailfilters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": detailfilters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": detailfilters.lotnum,
      "@p_proccd": filters.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };

  //조회조건 파라미터
  const parameters2: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: filters2.pgNum,
    pageSize: filters2.pgSize,
    parameters: {
      "@p_work_type": "LIST2",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": filters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": filters.lotnum,
      "@p_proccd": filters.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };

  //조회조건 파라미터
  const detailparameters3: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: detailPgNum3,
    pageSize: detailfilters2.pgSize,
    parameters: {
      "@p_work_type": detailfilters2.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": detailfilters2.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": filters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": detailfilters2.lotnum,
      "@p_proccd": detailfilters2.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };

  const detailparameters4: Iparameters = {
    procedureName: "P_MA_B7200W_Q",
    pageNumber: detailPgNum4,
    pageSize: detailfilters2.pgSize,
    parameters: {
      "@p_work_type": "DETAIL2_OUT",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_itemcd": detailfilters2.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_itemacnt": filters.itemacnt,
      "@p_insiz": filters.insiz,
      "@p_lotnum": detailfilters2.lotnum,
      "@p_proccd": detailfilters2.proccd,
      "@p_orglot": filters.orglot,
      "@p_stockyn": filters.stockyn,
      "@p_gubun": filters.gubun,
    },
  };
  const [mainDataTotal, setMainDataTotal] = useState<number>(0);
  const [mainDataTotal2, setMainDataTotal2] = useState<number>(0);

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
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          groupId: row.itemacnt + "itemacnt",
          group_category_name:
            "품목계정" +
            " : " +
            itemacntListData.find((item: any) => item.sub_code === row.itemacnt)
              ?.code_name,
        };
      });

      if (totalRowCnt > 0) {
        setMainDataTotal(totalRowCnt);
        setMainDataResult((prev) =>
          process([...rowsOfDataResult(prev), ...rows], mainDataState)
        );

        // 그룹코드로 조회한 경우, 조회된 페이지넘버로 세팅
        if (filters.pgNum !== data.pageNumber) {
          setFilters((prev) => ({ ...prev, pgNum: data.pageNumber }));
        }

        if (filters.find_row_value === "" && filters.pgNum === 1) {
          // 첫번째 행 선택하기
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
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
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailparameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
      }));
      setDetailDataResult((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDetailGrid2 = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailparameters2);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
      }));
      setDetailDataResult2((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  //그리드 데이터 조회
  const fetchMainGrid2 = async () => {
    //if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", parameters2);
    } catch (error) {
      data = null;
    }
 
    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          groupId: row.proccd + "itemacnt",
          group_category_name:
            "공정" +
            " : " +
            proccdListData.find((item: any) => item.sub_code === row.proccd)
              ?.code_name,
          qtyunit: qtyunitListData.find((item: any) => item.sub_code === row.qtyunit)
          ?.code_name,
        };
      });

      if (totalRowCnt > 0) {
        setMainDataTotal2(totalRowCnt);
        setMainDataResult2((prev) =>
          process([...rowsOfDataResult(prev), ...rows], mainDataState2)
        );

        // 그룹코드로 조회한 경우, 조회된 페이지넘버로 세팅
        if (filters2.pgNum !== data.pageNumber) {
          setFilters2((prev) => ({ ...prev, pgNum: data.pageNumber }));
        }

        if (filters2.find_row_value === "" && filters2.pgNum === 1) {
          // 첫번째 행 선택하기
          const firstRowData = rows[0];
          setSelectedState2({ [firstRowData[DATA_ITEM_KEY]]: true });
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setFilters2((prev) => ({
      ...prev,
      isSearch: false,
    }));
    setLoading(false);
  };

  const fetchDetailGrid3 = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailparameters3);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
      }));
      setDetailDataResult3((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDetailGrid4 = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailparameters4);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
      }));
      setDetailDataResult4((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const onExpandChange = (event: any) => {
    const isExpanded =
      event.dataItem.expanded === undefined
        ? event.dataItem.aggregates
        : event.dataItem.expanded;
    event.dataItem.expanded = !isExpanded;

    setMainDataResult({ ...mainDataResult });
  };
  const onExpandChange2 = (event: any) => {
    const isExpanded =
      event.dataItem.expanded === undefined
        ? event.dataItem.aggregates
        : event.dataItem.expanded;
    event.dataItem.expanded = !isExpanded;

    setMainDataResult2({ ...mainDataResult2 });
  };

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (
      customOptionData != null &&
      filters.isSearch &&
      permissions !== null &&
      bizComponentData !== null
    ) {
      setFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록
      fetchMainGrid();
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  useEffect(() => {
    if (
      customOptionData != null &&
      filters2.isSearch &&
      permissions !== null &&
      bizComponentData !== null
    ) {
      setFilters2((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록
      fetchMainGrid2();
      setIsInitSearch(true);
    }
  }, [filters2, permissions]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
      fetchMainGrid2();
    }
  }, [mainPgNum]);

  useEffect(() => {
    fetchDetailGrid();
    fetchDetailGrid2();
  }, [detailPgNum]);

  
  useEffect(() => {
    fetchDetailGrid3();
    fetchDetailGrid4();
  }, [detailPgNum3]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    setMainDataResult((prev) =>
      process(
        rowsWithSelectedDataResult(prev, selectedState, DATA_ITEM_KEY),
        mainDataState
      )
    );
  }, [selectedState]);

  useEffect(() => {
    setMainDataResult2((prev) =>
      process(
        rowsWithSelectedDataResult(prev, selectedState2, DATA_ITEM_KEY),
        mainDataState2
      )
    );
  }, [selectedState2]);

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

  useEffect(() => {
    if (customOptionData !== null) {
      // 저장 후, 선택 행 스크롤 유지 처리
      if (filters2.find_row_value !== "" && mainDataResult2.total > 0) {
        const ROW_HEIGHT = 35.56;
        const idx = mainDataResult2.data.findIndex(
          (item) => idGetter(item) === filters.find_row_value
        );

        const scrollHeight = ROW_HEIGHT * idx;
        gridRef.vs.container.scroll(0, scrollHeight);

        //초기화
        setFilters2((prev) => ({
          ...prev,
          find_row_value: "",
        }));
      }
      // 스크롤 상단으로 조회가 가능한 경우, 스크롤 핸들이 스크롤 바 최상단에서 떨어져있도록 처리
      // 해당 처리로 사용자가 스크롤 업해서 연속적으로 조회할 수 있도록 함
      else if (filters2.scrollDirrection === "up") {
        gridRef.vs.container.scroll(0, 20);
      }
    }
  }, [mainDataResult2]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (detailDataResult.total > 0) {
        const firstRowData = detailDataResult.data[0];
        setDetailSelectedState({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [detailDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (detailDataResult2.total > 0) {
        const firstRowData = detailDataResult2.data[0];
        setDetailSelectedState2({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [detailDataResult2]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (detailDataResult3.total > 0) {
        const firstRowData = detailDataResult3.data[0];
        setDetailSelectedState3({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [detailDataResult3]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (detailDataResult4.total > 0) {
        const firstRowData = detailDataResult4.data[0];
        setDetailSelectedState4({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [detailDataResult4]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchDetailGrid();
      fetchDetailGrid2();
    }
  }, [detailfilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchDetailGrid3();
      fetchDetailGrid4();
    }
  }, [detailfilters2]);

  useEffect(() => {
    if (customOptionData !== null) {
      resetAllGrid();
      // if (tabSelected == 0) {
      //   fetchSubGrid();
      // } else if (tabSelected == 2) {
      //   fetchSubGrid2();
      // }
      fetchMainGrid();
      fetchMainGrid2();
    }
  }, [tabSelected]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setDetailPgNum(1);
    setDetailPgNum2(1);
    setDetailDataResult(process([], detailDataState));
    setDetailDataResult2(process([], detailDataState2));
    setMainPgNum2(1);
    setMainDataResult2(process([], mainDataState2));
    setDetailPgNum3(1);
    setDetailPgNum4(1);
    setDetailDataResult3(process([], detailDataState3));
    setDetailDataResult4(process([], detailDataState4));
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

    setIfSelectFirstRow(true);

    setDetailFilters((prev: any) => ({
      ...prev,
      itemcd: selectedRowData.itemcd,
      itemacnt: selectedRowData.itemacnt,
      lotnum: selectedRowData.lotnum,
    }));
  };

  const onDetailSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailselectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setDetailSelectedState(newSelectedState);
  };

  const onDetailSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailselectedState2,
      dataItemKey: DATA_ITEM_KEY,
    });
    setDetailSelectedState2(newSelectedState);
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState2(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setIfSelectFirstRow(true);

    setDetailFilters2((prev: any) => ({
      ...prev,
      itemcd: selectedRowData.itemcd,
      proccd: selectedRowData.proccd,
      lotnum: selectedRowData.lotnum
    }))
  };

  const onDetailSelectionChange3 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailselectedState3,
      dataItemKey: DATA_ITEM_KEY,
    });
    setDetailSelectedState3(newSelectedState);
  };

  const onDetailSelectionChange4 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailselectedState4,
      dataItemKey: DATA_ITEM_KEY,
    });
    setDetailSelectedState4(newSelectedState);
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

  const onDetailScrollHandler2 = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum2, PAGE_SIZE))
      setDetailPgNum2((prev) => prev + 1);
  };

  //스크롤 핸들러
  const onMainScrollHandler2 = (event: GridEvent) => {
    if (filters2.isSearch) return false; // 한꺼번에 여러번 조회 방지
    let pgNumWithGap =
      filters2.pgNum + (filters2.scrollDirrection === "up" ? filters2.pgGap : 0);

    // 스크롤 최하단 이벤트
    if (chkScrollHandler(event, pgNumWithGap, PAGE_SIZE)) {
      setFilters2((prev) => ({
        ...prev,
        scrollDirrection: "down",
        pgNum: pgNumWithGap + 1,
        pgGap: prev.pgGap + 1,
        isSearch: true,
      }));
      return false;
    }

    pgNumWithGap =
      filters2.pgNum - (filters2.scrollDirrection === "down" ? filters2.pgGap : 0);
    // 스크롤 최상단 이벤트
    if (chkScrollHandler(event, pgNumWithGap, PAGE_SIZE, "up")) {
      setFilters2((prev) => ({
        ...prev,
        scrollDirrection: "up",
        pgNum: pgNumWithGap - 1,
        pgGap: prev.pgGap + 1,
        isSearch: true,
      }));
    }
  };

  const onDetailScrollHandler3 = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum3, PAGE_SIZE))
      setDetailPgNum3((prev) => prev + 1);
  };

  const onDetailScrollHandler4 = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum4, PAGE_SIZE))
      setDetailPgNum4((prev) => prev + 1);
  };


  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onDetailDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDataState(event.dataState);
  };

  const onDetailDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setDetailDataState2(event.dataState);
  };

  const onMainDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setMainDataState2(event.dataState);
  };

  const onDetailDataStateChange3 = (event: GridDataStateChangeEvent) => {
    setDetailDataState3(event.dataState);
  };

  const onDetailDataStateChange4 = (event: GridDataStateChangeEvent) => {
    setDetailDataState4(event.dataState);
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

  const detailTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = detailDataResult2.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = mainDataResult2.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const detailTotalFooterCell3 = (props: GridFooterCellProps) => {
    var parts = detailDataResult3.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const detailTotalFooterCell4 = (props: GridFooterCellProps) => {
    var parts = detailDataResult4.total.toString().split(".");
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
    rowsOfDataResult(mainDataResult).forEach((item) =>
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

  const gridSumQtyFooterCell3 = (props: GridFooterCellProps) => {
    let sum = 0;
    detailDataResult2.data.forEach((item) =>
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

  const gridSumQtyFooterCell4 = (props: GridFooterCellProps) => {
    let sum = 0;
    rowsOfDataResult(mainDataResult2).forEach((item) =>
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
  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
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

  type TdataArr = {
    rowstatus: string[];
    remark_s: string[];
    custprsncd_s: string[];
    prsnnm_s: string[];
    dptnm: string[];
    postcd_s: string[];
    telno: string[];
    phoneno_s: string[];
    email_s: string[];
    rtrchk_s: string[];
    attdatnum_s: string[];
    sort_seq_s: string[];
  };

  type TdataArr2 = {
    rowstatus: string[];
    remark_s: string[];
    seq_s: string[];
    yyyy_s: string[];
    totasset_s: string[];
    paid_up_capital_s: string[];
    totcaptial_s: string[];
    salesmoney_s: string[];
    operating_profits_s: string[];
    current_income_s: string[];
    dedt_rati_s: string[];
  };
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

  const onDetailSortChange2 = (e: any) => {
    setDetailDataState2((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
  };

  const onDetailSortChange3 = (e: any) => {
    setDetailDataState3((prev) => ({ ...prev, sort: e.sort }));
  };

  const onDetailSortChange4 = (e: any) => {
    setDetailDataState4((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    try {
      if (
        convertDateToStr(filters.frdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.frdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.frdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.frdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_B7200W_001");
      } else if (
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "MA_B7200W_001");
      } else if(convertDateToStr(filters.todt).substring(0, 4) != convertDateToStr(filters.frdt).substring(0, 4)) {
        throw findMessage(messagesData, "MA_B7200W_002");
      } else {
        resetAllGrid();
        fetchMainGrid();
        fetchMainGrid2();
      }
    } catch (e) {
      alert(e);
    }
  };

  const createColumn = () => {
    const array = [];
    array.push(<GridColumn field={"inqty"} title={"입고수량"} width="100px" footerCell ={gridSumQtyFooterCell4} cell={NumberCell}/>);
    array.push(
      <GridColumn field={"outqty"} title={"출고수량"} width="100px" footerCell ={gridSumQtyFooterCell4}  cell={NumberCell}/>
    );
    return array;
  };

  return (
    <>
      <TitleContainer>
        <Title>기간재고조회</Title>

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
              <th>기준일자</th>
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
              <th>수주LOT</th>
              <td>
                <Input
                  name="orglot"
                  type="text"
                  value={filters.orglot}
                  onChange={filterInputChange}
                />
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
              <th>규격</th>
              <td>
                <Input
                  name="insiz"
                  type="text"
                  value={filters.insiz}
                  onChange={filterInputChange}
                />
              </td>
              <th>재고수량</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="stockyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <TabStrip
        selected={tabSelected}
        onSelect={handleSelectTab}
        style={{ width: "100%" }}
      >
        <TabStripTab title="재고현황">
          <GridContainerWrap>
            <GridContainer width={`65%`}>
              <ExcelExport
                data={mainDataResult.data}
                ref={(exporter) => {
                  _export = exporter;
                }}
              >
                <GridTitleContainer>
                  <GridTitle>품목별기간재고</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "74vh" }}
                  data={mainDataResult}
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
                  groupable={true}
                  onExpandChange={onExpandChange}
                  expandField="expanded"
                >
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
                              numberField.includes(item.fieldName)
                                ? NumberCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? mainTotalFooterCell
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </ExcelExport>
            </GridContainer>
            <GridContainer width={`calc(35% - ${GAP}px)`}>
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>입고상세내역</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "35vh" }}
                  data={process(
                    detailDataResult.data.map((row) => ({
                      ...row,
                      qtyunit: qtyunitListData.find(
                        (item: any) => item.sub_code === row.qtyunit
                      )?.code_name,
                      person: personListData.find(
                        (item: any) => item.user_id === row.person
                      )?.user_name,
                      [SELECTED_FIELD]: detailselectedState[idGetter(row)],
                    })),
                    detailDataState
                  )}
                  {...detailDataState}
                  onDataStateChange={onDetailDataStateChange}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
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
                              numberField.includes(item.fieldName)
                                ? NumberCell
                                : dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? detailTotalFooterCell
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell2
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </GridContainer>
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>출고상세내역</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "35vh" }}
                  data={process(
                    detailDataResult2.data.map((row) => ({
                      ...row,
                      qtyunit: qtyunitListData.find(
                        (item: any) => item.sub_code === row.qtyunit
                      )?.code_name,
                      person: personListData.find(
                        (item: any) => item.user_id === row.person
                      )?.user_name,
                      [SELECTED_FIELD]: detailselectedState2[idGetter(row)],
                    })),
                    detailDataState2
                  )}
                  {...detailDataState2}
                  onDataStateChange={onDetailDataStateChange2}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onDetailSelectionChange2}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={detailDataResult2.total}
                  onScroll={onDetailScrollHandler2}
                  //정렬기능
                  sortable={true}
                  onSortChange={onDetailSortChange2}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions["grdList3"].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 && (
                          <GridColumn
                            key={idx}
                            id={item.id}
                            field={item.fieldName}
                            title={item.caption}
                            width={item.width}
                            cell={
                              numberField.includes(item.fieldName)
                                ? NumberCell
                                : dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? detailTotalFooterCell2
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell3
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </GridContainer>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="공정별 재공현황">
          <GridContainerWrap>
            <GridContainer width={`65%`}>
              <ExcelExport
                data={mainDataResult2.data}
                ref={(exporter) => {
                  _export = exporter;
                }}
              >
                <GridTitleContainer>
                  <GridTitle>제공품재고</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "74vh" }}
                  data={mainDataResult2}
                  {...mainDataState2}
                  onDataStateChange={onMainDataStateChange2}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onSelectionChange2}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={mainDataResult2.total}
                  onScroll={onMainScrollHandler2}
                  //정렬기능
                  sortable={true}
                  onSortChange={onMainSortChange2}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                  groupable={true}
                  onExpandChange={onExpandChange2}
                  expandField="expanded"
                >
                  <GridColumn field="itemcd" title="품목코드" width="150px" footerCell={mainTotalFooterCell2} />
                  <GridColumn field="itemnm" title="품목명" width="130px" />
                  <GridColumn field="insiz" title="규격" width="150px" />
                  <GridColumn field="qtyunit" title="단위" width="120px" />
                  <GridColumn
                    field="before_qty"
                    title="기간이전재고"
                    width="150px"
                    cell={NumberCell}
                    footerCell ={gridSumQtyFooterCell4}
                  />
                  <GridColumn title="기간내재고">{createColumn()}</GridColumn>
                  <GridColumn field="stockqty" title="재고수량" width="100px"  cell={NumberCell} footerCell ={gridSumQtyFooterCell4}/>
                  <GridColumn field="lotnum" title="LOT NO" width="150px" />
                </Grid>
              </ExcelExport>
            </GridContainer>
            <GridContainer width={`calc(35% - ${GAP}px)`}>
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>입고상세내역</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "35vh" }}
                  data={process(
                    detailDataResult3.data.map((row) => ({
                      ...row,
                      qtyunit: qtyunitListData.find(
                        (item: any) => item.sub_code === row.qtyunit
                      )?.code_name,
                      person: personListData.find(
                        (item: any) => item.user_id === row.person
                      )?.user_name,
                      [SELECTED_FIELD]: detailselectedState3[idGetter(row)],
                    })),
                    detailDataState3
                  )}
                  {...detailDataState3}
                  onDataStateChange={onDetailDataStateChange3}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onDetailSelectionChange3}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={detailDataResult3.total}
                  onScroll={onDetailScrollHandler3}
                  //정렬기능
                  sortable={true}
                  onSortChange={onDetailSortChange3}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions["grdList4"].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 && (
                          <GridColumn
                            key={idx}
                            id={item.id}
                            field={item.fieldName}
                            title={item.caption}
                            width={item.width}
                            cell={
                              dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? detailTotalFooterCell3
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </GridContainer>
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>출고상세내역</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: "35vh" }}
                  data={process(
                    detailDataResult4.data.map((row) => ({
                      ...row,
                      qtyunit: qtyunitListData.find(
                        (item: any) => item.sub_code === row.qtyunit
                      )?.code_name,
                      person: personListData.find(
                        (item: any) => item.user_id === row.person
                      )?.user_name,
                      [SELECTED_FIELD]: detailselectedState4[idGetter(row)],
                    })),
                    detailDataState4
                  )}
                  {...detailDataState4}
                  onDataStateChange={onDetailDataStateChange4}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onDetailSelectionChange4}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={detailDataResult4.total}
                  onScroll={onDetailScrollHandler4}
                  //정렬기능
                  sortable={true}
                  onSortChange={onDetailSortChange4}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions["grdList5"].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 && (
                          <GridColumn
                            key={idx}
                            id={item.id}
                            field={item.fieldName}
                            title={item.caption}
                            width={item.width}
                            cell={
                              dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? detailTotalFooterCell4
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </GridContainer>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
      </TabStrip>
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
    </>
  );
};

export default MA_B7200W;
