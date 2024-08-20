import {
  CompositeFilterDescriptor,
  DataResult,
  groupBy,
  GroupDescriptor,
  GroupResult,
  process,
  State,
  filterBy,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { getter } from "@progress/kendo-react-common";
import {
  getSelectedState,
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridFilterChangeEvent,
  GridFooterCellProps,
  GridHeaderCellProps,
  GridItemChangeEvent,
  GridPageChangeEvent,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { IWindowPosition } from "../../../hooks/interfaces";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import {
  getGridItemChangedData,
  getHeight,
  getWindowDeviceHeight,
  UseParaPc,
} from "../../CommonFunction";
import { EDIT_FIELD, GAP, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import Window from "../WindowComponent/Window";
import FilterContainer from "../../FilterContainer";
import { Iparameters } from "../../../store/types";
import { useApi } from "../../../hooks/api";
import { bytesToBase64 } from "byte-base64";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../../../store/atoms";
import { setGroupIds } from "@progress/kendo-react-data-tools";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";

type IWindow = {
  setVisible(t: boolean): void;
};

type TdataArr = {
  receptionist_code_s: string[];
};

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;

const DATA_ITEM_KEY = "user_id";
const DATA_ITEM_KEY2 = "custcd";
const DATA_ITEM_KEY3 = "customer_code";

let targetRowIndex: null | number = null;
let targetRowIndex2: null | number = null;
let targetRowIndex3: null | number = null;

const initialFilter: CompositeFilterDescriptor = {
  logic: "and",
  filters: [{ field: "user_name", operator: "contains", value: "" }],
};

const initialFilter2: CompositeFilterDescriptor = {
  logic: "and",
  filters: [{ field: "custnm", operator: "contains", value: "" }],
};

const initialFilter3: CompositeFilterDescriptor = {
  logic: "and",
  filters: [{ field: "customer_name", operator: "contains", value: "" }],
};

const customersQueryStr = `SELECT custcd, custnm FROM ba020t`;
const usersQueryStr = `SELECT user_id, user_name as user_name FROM sysUserMaster WHERE rtrchk <> 'Y' ORDER BY user_id`;

const ReceptionistWindow = ({ setVisible }: IWindow) => {
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const idGetter3 = getter(DATA_ITEM_KEY3);
  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);
  let gridRef3: any = useRef(null);
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [swiper, setSwiper] = useState<SwiperCore>();
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 950) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 600) / 2,
    width: isMobile == true ? deviceWidth : 950,
    height: isMobile == true ? deviceHeight : 600,
  });
  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar"); //공통 해더
    height2 = getHeight(".BottomContainer"); //하단 버튼부분
    height3 = getHeight(".ButtonContainer");
    height4 = getHeight(".ButtonContainer2");
    height5 = getHeight(".ButtonContainer3");
    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - height3 - 5
    );
    setMobileHeight2(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - height4 - 5
    );
    setMobileHeight3(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - height5 - 5
    );
    setWebHeight(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height3 -
        5
    );
    setWebHeight2(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height4 -
        5
    );
    setWebHeight3(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height5 -
        5
    );
  }, [webheight, webheight2, webheight3]);

  //그리드 리셋
  const resetAllGrid = () => {
    setPage(initialPageState);
    setPage2(initialPageState);
    setPage3(initialPageState);
    setMainDataResult(process([], mainDataState));
    setMainDataResult2(process([], mainDataState2));
    setMainDataResult3(process([], mainDataState3));
  };

  const onClose = () => {
    setVisible(false);
    resetAllGrid();
  };

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height3 -
        5
    );
    setWebHeight2(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height4 -
        5
    );
    setWebHeight3(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height5 -
        5
    );
  };

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [mainDataResult2, setMainDataResult2] = useState<DataResult>(
    process([], mainDataState2)
  );
  const [mainDataResult2_copy, setMainDataResult2_copy] = useState<DataResult>(
    process([], mainDataState2)
  );
  const [selectedState2, setSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [mainDataState3, setMainDataState3] = useState<State>({
    sort: [],
  });
  const [mainDataResult3, setMainDataResult3] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedState3, setSelectedState3] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [total2, setTotal2] = useState(mainDataResult2.total);
  const [total3, setTotal3] = useState(mainDataResult3.total);
  const initialGroup: GroupDescriptor[] = [{ field: "group_category_name" }];
  const [group, setGroup] = React.useState(initialGroup);
  const processWithGroups = (data: any[], group: GroupDescriptor[]) => {
    const [resultState, setResultState] = React.useState<GroupResult[]>(
      processWithGroups([], initialGroup)
    );
    const newDataState = groupBy(data, group);

    setGroupIds({ data: newDataState, group: group });

    return newDataState;
  };
  const [values, setValues] = useState<boolean>(false);
  const [values2, setValues2] = useState<boolean>(false);
  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      // 현재 페이지의 데이터만 체크 상태를 변경
      const newPageData = pageData2.map((item: any) => ({
        ...item,
        chk: !values,
      }));

      // 전체 데이터에서 현재 페이지 데이터와 일치하는 항목들만 업데이트
      const updatedMainDataResult2 = mainDataResult2.data.map((item) => {
        const updatedItem = newPageData.find(
          (pageItem: any) => pageItem.custcd === item.custcd
        );
        return updatedItem ? { ...item, chk: updatedItem.chk } : item;
      });

      // mainDataResult2_copy도 업데이트
      const updatedMainDataResult2Copy = mainDataResult2_copy.data.map(
        (item) => {
          const updatedItem = newPageData.find(
            (pageItem: any) => pageItem.custcd === item.custcd
          );
          return updatedItem ? { ...item, chk: updatedItem.chk } : item;
        }
      );

      // 상태 업데이트
      setMainDataResult2({
        data: updatedMainDataResult2,
        total: updatedMainDataResult2.length,
      });

      setMainDataResult2_copy({
        data: updatedMainDataResult2Copy,
        total: updatedMainDataResult2Copy.length,
      });

      setPageData2(newPageData); // 페이지 데이터도 업데이트
      setValues(!values); // 전체 체크박스 상태 업데이트
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox checked={values} onChange={changeCheck} />
      </div>
    );
  };

  const CustomCheckBoxCell3 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      // 현재 페이지의 데이터만 체크 상태를 변경
      const newPageData = pageData3.map((item: any) => ({
        ...item,
        chk: !values2,
      }));

      // 전체 데이터에서 현재 페이지 데이터와 일치하는 항목들만 업데이트
      const updatedMainDataResult3 = mainDataResult3.data.map((item) => {
        const updatedItem = newPageData.find(
          (pageItem: any) => pageItem.customer_code === item.customer_code
        );
        return updatedItem ? { ...item, chk: updatedItem.chk } : item;
      });

      // 상태 업데이트
      setMainDataResult3({
        data: updatedMainDataResult3,
        total: updatedMainDataResult3.length,
      });

      setPageData3(newPageData); // 페이지 데이터도 업데이트
      setValues2(!values2); // 전체 체크박스 상태 업데이트
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values2} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setMainDataState2(event.dataState);
  };

  const onMainDataStateChange3 = (event: GridDataStateChangeEvent) => {
    setMainDataState3(event.dataState);
  };

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
  };

  const onSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSelectedState2(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);
  const [page3, setPage3] = useState(initialPageState);

  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );

  //조회조건 초기값
  const [filters, setFilters] = useState({
    work_type: "receptionist",
    user_id: "",
    user_name: "",
    pc: pc,
    find_row_value: "",
    pgNum: 1,
    isSearch: false,
  });

  const [filter, setFilter] = React.useState(initialFilter);
  const [filter2, setFilter2] = React.useState(initialFilter2);
  const [filter3, setFilter3] = React.useState(initialFilter3);

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    // setFilters((prev) => ({
    //   ...prev,
    //   pgNum: Math.floor(page.skip / initialPageState.take) + 1,
    //   isSearch: true,
    // }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const pageChange2 = (event: GridPageChangeEvent) => {
    const { page } = event;
    setPage2({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const pageChange3 = (event: GridPageChangeEvent) => {
    const { page } = event;
    setPage3({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  // 페이지네이션
  const [pageData2, setPageData2] = useState<any>([]);
  const [pageData3, setPageData3] = useState<any>([]);

  useEffect(() => {
    // 필터링된 데이터를 기준으로 페이지 데이터 설정
    const filteredData = filterBy(mainDataResult2.data, filter2); // 필터링된 전체 데이터

    // 필터링된 데이터에 맞게 total 값을 설정
    setTotal2(filteredData.length);

    const start = page2.skip;
    const end = start + page2.take;

    // 현재 페이지의 데이터를 필터링된 데이터에서 추출
    const currentPageData = filteredData.slice(start, end);

    setPageData2(currentPageData); // 현재 페이지 데이터 설정

    if (currentPageData.length > 0 && !Object.keys(selectedState2).length) {
      // 현재 페이지에서 첫 번째 항목을 선택 상태로 설정
      setSelectedState2({ [currentPageData[0][DATA_ITEM_KEY2]]: true });
    }
  }, [page2, mainDataResult2.data, filter2]); // 페이지, 데이터, 필터 변경 시 실행

  useEffect(() => {
    const filteredData = filterBy(mainDataResult3.data, filter3);
    setTotal3(filteredData.length);

    const start = page3.skip;
    const end = start + page3.take;
    const currentPageData = filteredData.slice(start, end);

    setPageData3(currentPageData);

    if (currentPageData.length > 0 && !Object.keys(selectedState3).length) {
      setSelectedState3({ [currentPageData[0][DATA_ITEM_KEY3]]: true });
    }
  }, [page3, mainDataResult3.data, filter3]);

  // 페이지 변경 시 전체 체크박스 초기화
  useEffect(() => {
    setValues(false);
  }, [page2]);

  useEffect(() => {
    setValues2(false);
  }, [page3]);

  const fetchUsers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(usersQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      const totalRowCnt = data.tables[0].RowCount;
      setMainDataResult((prev) => ({
        ...prev,
        data: rows,
        total: totalRowCnt == -1 ? 0 : totalRowCnt,
      }));
      if (totalRowCnt > 0) {
        const selectedRow = rows[0];
        setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setFilters((prev) => ({
      ...prev,
      user_id: data.tables[0].Rows[0].user_id,
      pgNum:
        data && data.hasOwnProperty("pageNumber")
          ? data.pageNumber
          : prev.pgNum,
      isSearch: false,
    }));
  };

  const fetchCustomers = async () => {
    let data: any;
    setLoading(true);
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(customersQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows.map((row: any) => ({
        ...row,
        chk: false,
      }));
      const totalRowCnt = data.tables[0].RowCount;
      setMainDataResult2((prev) => ({
        ...prev,
        data: rows,
        total: totalRowCnt == -1 ? 0 : totalRowCnt,
      }));
      setMainDataResult2_copy((prev) => ({
        ...prev,
        data: rows,
        total: totalRowCnt == -1 ? 0 : totalRowCnt,
      }));
      if (totalRowCnt > 0) {
        setSelectedState2({ [rows[0][DATA_ITEM_KEY2]]: true });
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  // 그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_user_master",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.work_type,
        "@p_id": filters.user_id,
        "@p_pc": filters.pc,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows.map((row: any) => ({
        ...row,
        chk: false,
      }));

      setMainDataResult3({
        data: rows,
        total: totalRowCnt == -1 ? 0 : totalRowCnt,
      });

      if (totalRowCnt > 0) {
        // find_row_value 행 선택, find_row_value 없는 경우 첫번째 행 선택
        const selectedRow =
          filters.find_row_value == ""
            ? rows[0]
            : rows.find(
                (row: any) => row.customer_code == filters.find_row_value
              );
        if (selectedRow != undefined) {
          setSelectedState3({ [rows[0][DATA_ITEM_KEY3]]: true });
        } else {
          setSelectedState3({ [rows[0][DATA_ITEM_KEY3]]: true });
        }
      }
      if (mainDataResult2.data.length > 0) {
        setSelectedState2({
          [mainDataResult2.data[0][DATA_ITEM_KEY2]]: true,
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }

    setLoading(false);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainSortChange3 = (e: any) => {
    setMainDataState3((prev) => ({ ...prev, sort: e.sort }));
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

  const onMainItemChange2 = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainDataResult2,
      setMainDataResult2,
      DATA_ITEM_KEY2
    );
  };

  const onMainItemChange3 = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainDataResult3,
      setMainDataResult3,
      DATA_ITEM_KEY3
    );
  };

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onMainSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    const userId = selectedRowData.user_id;

    setValues(false);
    setValues2(false);

    setFilters((prev) => ({
      ...prev,
      user_id: userId,
      pgNum: 1,
      isSearch: true,
    }));

    setPage2(initialPageState);
    setPage3(initialPageState);

    // mainDataResult2_copy의 모든 chk 상태를 false로 초기화
    setMainDataResult2_copy((prevData) => ({
      ...prevData,
      data: prevData.data.map((item) => ({ ...item, chk: false })),
      total: prevData.total,
    }));

    if (isMobile && swiper) {
      swiper.slideTo(1);
    }
  };

  // mainDataResult2가 업데이트되면 필터링을 수행
  useEffect(() => {
    const filteredRows = mainDataResult2_copy.data.filter((row: any) => {
      const match = mainDataResult3.data.some((item: any) => {
        const custcd = item.customer_code.trim().toLowerCase();
        const customerCode = row.custcd.trim().toLowerCase();
        return customerCode === custcd;
      });

      return !match;
    });
    const totalFilteredRowCnt = filteredRows.length;
    // 필터링된 결과로 mainDataResult2 업데이트
    setMainDataResult2((prev) => ({
      ...prev,
      data: filteredRows,
      total: totalFilteredRowCnt,
    }));
  }, [mainDataResult3]);

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onMainSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY2,
    });

    setSelectedState2(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onMainSelectionChange3 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState3,
      dataItemKey: DATA_ITEM_KEY3,
    });

    setSelectedState3(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  const customRowRender2 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender3 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const customCellRender2 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customCellRender3 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = total2.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {total2 == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell3 = (props: GridFooterCellProps) => {
    var parts = total3.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {total3 == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    if (field == "chk") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    if (tempResult.data != mainDataResult.data) {
      const newData = mainDataResult.data.map(
        (item: { [x: string]: string; rowstatus: string }) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
            ? {
                ...item,
                rowstatus: item.rowstatus == "N" ? "N" : "U",
                chk:
                  typeof item.chk == "boolean"
                    ? item.chk
                    : item.chk == "Y"
                    ? true
                    : false,
                [EDIT_FIELD]: undefined,
              }
            : {
                ...item,
                [EDIT_FIELD]: undefined,
              }
      );
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = mainDataResult.data.map((item: any) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev: { total: any }) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev: { total: any }) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({
        ...prev,
        find_row_value: "",
        isSearch: false,
      })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  const onRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const selectedRowData = e.dataItem;

    // 깊은 복사 사용
    const updatedMainDataResult2 = [
      ...mainDataResult2.data.filter(
        (row: any) => row.custcd !== selectedRowData.custcd
      ),
    ];

    const newEntryForResult3 = {
      customer_code: selectedRowData.custcd,
      customer_name: selectedRowData.custnm,
      chk: false, // chk를 false로 초기화
    };

    const updatedMainDataResult3 = [
      ...mainDataResult3.data,
      newEntryForResult3,
    ];

    const updatedMainDataResult2Copy = mainDataResult2_copy.data.map(
      (row: any) =>
        row.custcd === selectedRowData.custcd
          ? { ...row, chk: false } // 해당 행의 chk를 false로 초기화
          : row
    );

    setMainDataResult2({
      data: updatedMainDataResult2,
      total: updatedMainDataResult2.length,
    });
    setMainDataResult3({
      data: updatedMainDataResult3,
      total: updatedMainDataResult3.length,
    });
    setMainDataResult2_copy({
      data: updatedMainDataResult2Copy,
      total: updatedMainDataResult2Copy.length,
    });
    setValues(false);

    if (swiper) {
      swiper.slideTo(2);
    }
  };

  const onRowDoubleClick2 = (e: GridRowDoubleClickEvent) => {
    const selectedRowData = e.dataItem;

    // 깊은 복사 사용
    const updatedMainDataResult3 = [
      ...mainDataResult3.data.filter(
        (row: any) => row.customer_code !== selectedRowData.customer_code
      ),
    ];

    const newEntryForResult2 = {
      custcd: selectedRowData.customer_code,
      custnm: selectedRowData.customer_name,
      chk: false, // chk를 false로 초기화
    };

    const updatedMainDataResult2 = [
      ...mainDataResult2.data,
      newEntryForResult2,
    ];

    // mainDataResult2_copy도 업데이트 (chk 상태를 false로 초기화)
    const updatedMainDataResult2Copy = mainDataResult2_copy.data.map(
      (row: any) =>
        row.custcd === selectedRowData.customer_code
          ? { ...row, chk: false } // 선택된 행의 chk를 초기화
          : row
    );
    setMainDataResult3({
      data: updatedMainDataResult3,
      total: updatedMainDataResult3.length,
    });
    setMainDataResult2({
      data: updatedMainDataResult2,
      total: updatedMainDataResult2.length,
    });
    setMainDataResult2_copy({
      data: updatedMainDataResult2Copy,
      total: updatedMainDataResult2Copy.length,
    });
    setValues2(false);
  };

  const handleButtonClick = () => {
    // 2번 그리드에서 chk가 true인 항목들을 필터링
    const itemsToMove = mainDataResult2.data.filter((item: any) => item.chk);

    // 3번 그리드에 추가할 항목들 (chk를 false로 초기화)
    const itemsForResult3 = itemsToMove.map((item: any) => ({
      customer_code: item.custcd,
      customer_name: item.custnm,
      chk: false, // chk를 false로 초기화
    }));

    // 2번 그리드에서 chk가 true인 항목들을 제거한 나머지 항목들로 업데이트
    const updatedMainDataResult2 = mainDataResult2.data.filter(
      (item: any) => !item.chk
    );

    // 3번 그리드에 항목들 추가
    const updatedMainDataResult3 = [
      ...mainDataResult3.data,
      ...itemsForResult3,
    ];

    // 페이지에 데이터가 없는 경우 앞 페이지로 이동
    const totalPages = Math.ceil(updatedMainDataResult2.length / page2.take);
    const currentPage = page2.skip / page2.take + 1;

    if (currentPage > totalPages && currentPage > 1) {
      // 현재 페이지가 전체 페이지보다 크면, 이전 페이지로 이동
      setPage2({ skip: page2.skip - page2.take, take: page2.take });
    }

    // 상태 업데이트
    setMainDataResult2({
      data: updatedMainDataResult2,
      total: updatedMainDataResult2.length,
    });

    setMainDataResult3({
      data: updatedMainDataResult3,
      total: updatedMainDataResult3.length,
    });
    setValues(false);

    if (swiper) {
      swiper.slideTo(2);
    }
  };

  const handleButtonClick2 = () => {
    // 3번 그리드에서 chk가 true인 항목들을 필터링
    const itemsToMove = mainDataResult3.data.filter((item: any) => item.chk);

    // 2번 그리드에 추가할 항목들 (chk를 false로 초기화)
    const itemsForResult2 = itemsToMove.map((item: any) => ({
      custcd: item.customer_code,
      custnm: item.customer_name,
      chk: false, // chk를 false로 초기화
    }));

    // 3번 그리드에서 chk가 true인 항목들을 제거한 나머지 항목들로 업데이트
    const updatedMainDataResult3 = mainDataResult3.data.filter(
      (item: any) => !item.chk
    );

    // 2번 그리드에 중복되지 않게 항목 추가
    const updatedMainDataResult2 = [
      ...mainDataResult2.data,
      ...itemsForResult2.filter(
        (newItem) =>
          !mainDataResult2.data.some(
            (existingItem) => existingItem.custcd === newItem.custcd
          )
      ),
    ];

    // mainDataResult2_copy도 중복되지 않게 업데이트 (chk를 false로 초기화)
    const updatedMainDataResult2Copy = [
      ...mainDataResult2_copy.data,
      ...itemsForResult2.filter(
        (newItem) =>
          !mainDataResult2_copy.data.some(
            (existingItem) => existingItem.custcd === newItem.custcd
          )
      ),
    ];

    // 페이지에 데이터가 없는 경우 앞 페이지로 이동
    const totalPages = Math.ceil(updatedMainDataResult3.length / page3.take);
    const currentPage = page3.skip / page3.take + 1;

    if (currentPage > totalPages && currentPage > 1) {
      // 현재 페이지가 전체 페이지보다 크면, 이전 페이지로 이동
      setPage3({ skip: page3.skip - page3.take, take: page3.take });
    }

    // 상태 업데이트
    setMainDataResult3({
      data: updatedMainDataResult3,
      total: updatedMainDataResult3.length,
    });

    setMainDataResult2({
      data: updatedMainDataResult2.map((item) => ({ ...item, chk: false })), // 모든 항목 chk를 false로 초기화
      total: updatedMainDataResult2.length,
    });

    setMainDataResult2_copy({
      data: updatedMainDataResult2Copy.map((item) => ({ ...item, chk: false })), // 모든 항목 chk를 false로 초기화
      total: updatedMainDataResult2Copy.length,
    });

    setValues2(false);
  };

  const handleButtonClick3 = () => {
    // 2번 그리드의 모든 항목 chk 상태를 초기화
    setMainDataResult2((prevData) => ({
      ...prevData,
      data: prevData.data.map((item) => ({
        ...item,
        chk: false, // chk 상태를 false로 초기화
      })),
      total: prevData.total,
    }));

    // 2번 그리드의 복사본도 동일하게 chk 상태를 초기화
    setMainDataResult2_copy((prevData) => ({
      ...prevData,
      data: prevData.data.map((item) => ({
        ...item,
        chk: false, // chk 상태를 false로 초기화
      })),
      total: prevData.total,
    }));
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isSearch: true,
    }));
  };

  const [paraData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    work_type: "",
    rowstatus_s: "",
    user_id_s: "",
    user_name_s: "",
    password_s: "",
    customer_code_s: "",
    is_management_s: "",
    is_init_s: "",
    is_use_s: "",
    is_check_ip_s: "",
    allowed_ip_s: "",
    receptionist_code_s: "",
    receptionist_user_s: "",
    exec_user_id: filters.user_id,
    exec_pc: pc,
  });

  const para: Iparameters = {
    procedureName: "pw6_sav_user_master",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_row_status_s": paraData.rowstatus_s,
      "@p_user_id_s": paraData.user_id_s,
      "@p_user_name_s": paraData.user_name_s,
      "@p_password_s": paraData.password_s,
      "@p_customer_code_s": paraData.customer_code_s,
      "@p_is_management_s": paraData.is_management_s,
      "@p_is_init_s": paraData.is_init_s,
      "@p_is_use_s": paraData.is_use_s,
      "@p_is_check_ip_s": paraData.is_check_ip_s,
      "@p_allowed_ip_s": paraData.allowed_ip_s,
      "@p_receptionist_code_s": paraData.receptionist_code_s,
      "@p_receptionist_user_s": paraData.receptionist_user_s,
      "@p_exec_user_id": paraData.exec_user_id,
      "@p_exec_pc": paraData.exec_pc,
    },
  };

  const onSaveClick = (filters: any) => {
    const dataItem = mainDataResult3.data;

    if (mainDataResult3.data.length == 0) {
      alert("데이터가 없습니다.");
      return false;
    }

    let dataArr: TdataArr = {
      receptionist_code_s: [],
    };

    dataItem.forEach((item: any) => {
      const { customer_code = "" } = item;
      dataArr.receptionist_code_s.push(customer_code);
    });

    setParaData((prev) => ({
      ...prev,
      work_type: "receptionist",
      exec_user_id: filters.user_id,
      receptionist_code_s: dataArr.receptionist_code_s.join("|"),
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

    if (data.isSuccess == true) {
      setFilters((prev) => ({
        ...prev,
        isSearch: true,
      }));
      setParaData({
        pgSize: PAGE_SIZE,
        work_type: "",
        rowstatus_s: "",
        user_id_s: "",
        user_name_s: "",
        password_s: "",
        customer_code_s: "",
        is_management_s: "",
        is_init_s: "",
        is_use_s: "",
        is_check_ip_s: "",
        allowed_ip_s: "",
        receptionist_code_s: "",
        receptionist_user_s: "",
        exec_user_id: filters.user_id,
        exec_pc: pc,
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.work_type !== "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);

  return (
    <Window
      titles="접수담당업체 설정"
      positions={position}
      Close={onClose}
      modals={false}
      onChangePostion={onChangePostion}
    >
      {isMobile ? (
        <Swiper
          onSwiper={(swiper) => {
            setSwiper(swiper);
          }}
          onActiveIndexChange={(swiper) => {
            index = swiper.activeIndex;
          }}
        >
          <SwiperSlide key={0}>
            <GridContainer style={{ width: "100%" }}>
              <GridTitleContainer className="ButtonContainer">
                <GridTitle>
                  사용자 리스트{" "}
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-right"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(1);
                      }
                    }}
                  ></Button>
                </GridTitle>
              </GridTitleContainer>
              <Grid
                data={filterBy(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]: !!selectedState[idGetter(row)],
                  })),
                  filter
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
                onSelectionChange={onMainSelectionChange}
                //스크롤 조회 기능
                // fixedScroll={true}
                total={mainDataResult.total}
                // skip={page.skip}
                take={mainDataResult.total}
                pageable={false}
                // onPageChange={pageChange}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef}
                rowHeight={30}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange}
                onItemChange={onMainItemChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                style={{ height: mobileheight }}
                filterable={true}
                filter={filter}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter(e.filter);
                  const filteredData = filterBy(mainDataResult.data, e.filter);
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState };
                    filteredData.forEach((item) => {
                      if (selectedState[item[DATA_ITEM_KEY]]) {
                        newSelectedState[item[DATA_ITEM_KEY]] = true;
                      }
                    });
                    setSelectedState(newSelectedState);
                  }
                }}
              >
                <GridColumn
                  field="user_name"
                  title="사용자명"
                  footerCell={mainTotalFooterCell}
                />
              </Grid>
            </GridContainer>
          </SwiperSlide>
          <SwiperSlide key={1}>
            <GridContainer style={{ width: "100%" }}>
              <GridTitleContainer className="ButtonContainer2">
                <GridTitle>
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-left"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(0);
                      }
                    }}
                  ></Button>
                  전체업체{" "}
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-right"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(2);
                      }
                    }}
                  ></Button>
                </GridTitle>
                <Button
                  disabled={mainDataResult2.data.every((item) => !item.chk)}
                  icon="plus"
                  fillMode={"outline"}
                  themeColor={"primary"}
                  onClick={handleButtonClick}
                />
              </GridTitleContainer>
              <Grid
                data={process(
                  filterBy(
                    pageData2.map((row: any) => ({
                      ...row,
                      chk: row.chk,
                      [SELECTED_FIELD]: !!selectedState2[idGetter2(row)],
                    })),
                    filter2
                  ),
                  mainDataState2
                )}
                {...mainDataState2}
                onDataStateChange={onMainDataStateChange2}
                //선택 기능
                dataItemKey={DATA_ITEM_KEY2}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onMainSelectionChange2}
                //스크롤 조회 기능
                fixedScroll={true}
                total={total2}
                skip={page2.skip}
                take={page2.take}
                pageable={{ info: false }}
                onPageChange={pageChange2}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef2}
                rowHeight={30}
                onItemChange={onMainItemChange2}
                cellRender={customCellRender2}
                rowRender={customRowRender2}
                editField={EDIT_FIELD}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange2}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                style={{ height: mobileheight2 }}
                //더블클릭
                onRowDoubleClick={onRowDoubleClick}
                filterable={true}
                filter={filter2}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter2(e.filter);
                  // 필터가 변경되었으므로 페이지를 첫 페이지로 이동 (skip을 0으로 설정)
                  setPage2((prev) => ({
                    ...prev,
                    skip: 0,
                  }));
                  // 필터링된 데이터 가져오기
                  const filteredData = filterBy(mainDataResult2.data, e.filter);
                  // 필터링된 데이터가 존재하면 첫 번째 항목을 선택 상태로 설정
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState2 };
                    filteredData.forEach((item) => {
                      if (selectedState2[item[DATA_ITEM_KEY2]]) {
                        newSelectedState[item[DATA_ITEM_KEY2]] = true;
                      }
                    });
                    setSelectedState2(newSelectedState);
                    setPageData2(filteredData.slice(0, page2.take));
                  } else {
                    setPageData2([]);
                  }
                  setTotal2(filteredData.length);
                }}
              >
                <GridColumn
                  field="chk"
                  title=" "
                  width="45px"
                  headerCell={CustomCheckBoxCell2}
                  cell={CheckBoxCell}
                  filterable={false}
                />
                <GridColumn
                  field="custnm"
                  title="업체명"
                  footerCell={mainTotalFooterCell2}
                />
              </Grid>
            </GridContainer>
          </SwiperSlide>
          <SwiperSlide key={2}>
            <GridContainer style={{ width: "100%" }}>
              <GridTitleContainer className="ButtonContainer3">
                <GridTitle>
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-left"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(1);
                      }
                    }}
                  ></Button>
                  지정업체{" "}
                  <Button
                    icon="refresh"
                    fillMode={"flat"}
                    themeColor={"primary"}
                    onClick={handleButtonClick3}
                  />
                </GridTitle>
                <ButtonContainer>
                  <Button
                    disabled={mainDataResult3.data.every((item) => !item.chk)}
                    icon="minus"
                    fillMode={"outline"}
                    themeColor={"primary"}
                    onClick={handleButtonClick2}
                  />
                </ButtonContainer>
              </GridTitleContainer>
              <Grid
                style={{
                  height: mobileheight3,
                }}
                data={process(
                  filterBy(
                    pageData3.map((row: any) => ({
                      ...row,
                      [SELECTED_FIELD]: selectedState3[idGetter3(row)],
                    })),
                    filter3
                  ),
                  mainDataState3
                )}
                {...mainDataState3}
                onDataStateChange={onMainDataStateChange3}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange3}
                dataItemKey={DATA_ITEM_KEY3}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onMainSelectionChange3}
                //스크롤 조회 기능
                fixedScroll={true}
                total={mainDataResult3.total}
                skip={page3.skip}
                take={page3.take}
                pageable={{ info: false }}
                onPageChange={pageChange3}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef3}
                rowHeight={30}
                onItemChange={onMainItemChange3}
                cellRender={customCellRender3}
                rowRender={customRowRender3}
                editField={EDIT_FIELD}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //더블클릭
                onRowDoubleClick={onRowDoubleClick2}
                filterable={true}
                filter={filter3}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter3(e.filter);
                  setPage3((prev) => ({
                    ...prev,
                    skip: 0,
                  }));
                  const filteredData = filterBy(mainDataResult3.data, e.filter);
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState3 };
                    filteredData.forEach((item) => {
                      if (selectedState3[item[DATA_ITEM_KEY3]]) {
                        newSelectedState[item[DATA_ITEM_KEY3]] = true;
                      }
                    });
                    setSelectedState3(newSelectedState);
                    setPageData3(filteredData.slice(0, page3.take));
                  } else {
                    setPageData3([]);
                  }
                  setTotal3(filteredData.length);
                }}
              >
                <GridColumn
                  field="chk"
                  title=" "
                  width="45px"
                  headerCell={CustomCheckBoxCell3}
                  cell={CheckBoxCell}
                  filterable={false}
                />
                <GridColumn
                  field="customer_name"
                  title="업체명"
                  footerCell={mainTotalFooterCell3}
                />
              </Grid>
            </GridContainer>
          </SwiperSlide>
        </Swiper>
      ) : (
        <>
          <GridContainerWrap style={{ display: "flex", gap: GAP }}>
            <GridContainer style={{ width: "25%" }}>
              <GridTitleContainer className="ButtonContainer">
                <GridTitle>사용자 리스트</GridTitle>
              </GridTitleContainer>
              <Grid
                data={filterBy(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]: !!selectedState[idGetter(row)],
                  })),
                  filter
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
                onSelectionChange={onMainSelectionChange}
                //스크롤 조회 기능
                // fixedScroll={true}
                total={mainDataResult.total}
                // skip={page.skip}
                take={mainDataResult.total}
                pageable={false}
                // onPageChange={pageChange}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef}
                rowHeight={30}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange}
                onItemChange={onMainItemChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                style={{ height: webheight }}
                filterable={true}
                filter={filter}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter(e.filter);
                  const filteredData = filterBy(mainDataResult.data, e.filter);
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState };
                    filteredData.forEach((item) => {
                      if (selectedState[item[DATA_ITEM_KEY]]) {
                        newSelectedState[item[DATA_ITEM_KEY]] = true;
                      }
                    });
                    setSelectedState(newSelectedState);
                  }
                }}
              >
                <GridColumn
                  field="user_name"
                  title="사용자명"
                  footerCell={mainTotalFooterCell}
                />
              </Grid>
            </GridContainer>
            <GridContainer style={{ width: "35%" }}>
              <GridTitleContainer className="ButtonContainer2">
                <GridTitle>전체업체</GridTitle>
                <Button
                  disabled={mainDataResult2.data.every((item) => !item.chk)}
                  icon="plus"
                  fillMode={"outline"}
                  themeColor={"primary"}
                  onClick={handleButtonClick}
                />
              </GridTitleContainer>
              <Grid
                data={process(
                  filterBy(
                    pageData2.map((row: any) => ({
                      ...row,
                      chk: row.chk,
                      [SELECTED_FIELD]: !!selectedState2[idGetter2(row)],
                    })),
                    filter2
                  ),
                  mainDataState2
                )}
                {...mainDataState2}
                onDataStateChange={onMainDataStateChange2}
                //선택 기능
                dataItemKey={DATA_ITEM_KEY2}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onMainSelectionChange2}
                //스크롤 조회 기능
                fixedScroll={true}
                total={total2}
                skip={page2.skip}
                take={page2.take}
                pageable={{ info: false }}
                onPageChange={pageChange2}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef2}
                rowHeight={30}
                onItemChange={onMainItemChange2}
                cellRender={customCellRender2}
                rowRender={customRowRender2}
                editField={EDIT_FIELD}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange2}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                style={{ height: webheight2 }}
                //더블클릭
                onRowDoubleClick={onRowDoubleClick}
                filterable={true}
                filter={filter2}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter2(e.filter);
                  // 필터가 변경되었으므로 페이지를 첫 페이지로 이동 (skip을 0으로 설정)
                  setPage2((prev) => ({
                    ...prev,
                    skip: 0,
                  }));
                  // 필터링된 데이터 가져오기
                  const filteredData = filterBy(mainDataResult2.data, e.filter);
                  // 필터링된 데이터가 존재하면 첫 번째 항목을 선택 상태로 설정
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState2 };
                    filteredData.forEach((item) => {
                      if (selectedState2[item[DATA_ITEM_KEY2]]) {
                        newSelectedState[item[DATA_ITEM_KEY2]] = true;
                      }
                    });
                    setSelectedState2(newSelectedState);
                    setPageData2(filteredData.slice(0, page2.take));
                  } else {
                    setPageData2([]);
                  }
                  setTotal2(filteredData.length);
                }}
              >
                <GridColumn
                  field="chk"
                  title=" "
                  width="45px"
                  headerCell={CustomCheckBoxCell2}
                  cell={CheckBoxCell}
                  filterable={false}
                />
                <GridColumn
                  field="custnm"
                  title="업체명"
                  footerCell={mainTotalFooterCell2}
                />
              </Grid>
            </GridContainer>
            <GridContainer style={{ width: "35%" }}>
              <GridTitleContainer className="ButtonContainer3">
                <GridTitle>
                  지정업체{" "}
                  <Button
                    icon="refresh"
                    fillMode={"flat"}
                    themeColor={"primary"}
                    onClick={handleButtonClick3}
                  />
                </GridTitle>
                <ButtonContainer>
                  <Button
                    disabled={mainDataResult3.data.every((item) => !item.chk)}
                    icon="minus"
                    fillMode={"outline"}
                    themeColor={"primary"}
                    onClick={handleButtonClick2}
                  />
                </ButtonContainer>
              </GridTitleContainer>
              <Grid
                style={{
                  height: webheight3,
                }}
                data={process(
                  filterBy(
                    pageData3.map((row: any) => ({
                      ...row,
                      [SELECTED_FIELD]: selectedState3[idGetter3(row)],
                    })),
                    filter3
                  ),
                  mainDataState3
                )}
                {...mainDataState3}
                onDataStateChange={onMainDataStateChange3}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange3}
                dataItemKey={DATA_ITEM_KEY3}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onMainSelectionChange3}
                //스크롤 조회 기능
                fixedScroll={true}
                total={mainDataResult3.total}
                skip={page3.skip}
                take={page3.take}
                pageable={{ info: false }}
                onPageChange={pageChange3}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef3}
                rowHeight={30}
                onItemChange={onMainItemChange3}
                cellRender={customCellRender3}
                rowRender={customRowRender3}
                editField={EDIT_FIELD}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //더블클릭
                onRowDoubleClick={onRowDoubleClick2}
                filterable={true}
                filter={filter3}
                onFilterChange={(e: GridFilterChangeEvent) => {
                  setFilter3(e.filter);
                  setPage3((prev) => ({
                    ...prev,
                    skip: 0,
                  }));
                  const filteredData = filterBy(mainDataResult3.data, e.filter);
                  if (filteredData && filteredData.length > 0) {
                    const newSelectedState = { ...selectedState3 };
                    filteredData.forEach((item) => {
                      if (selectedState3[item[DATA_ITEM_KEY3]]) {
                        newSelectedState[item[DATA_ITEM_KEY3]] = true;
                      }
                    });
                    setSelectedState3(newSelectedState);
                    setPageData3(filteredData.slice(0, page3.take));
                  } else {
                    setPageData3([]);
                  }
                  setTotal3(filteredData.length);
                }}
              >
                <GridColumn
                  field="chk"
                  title=" "
                  width="45px"
                  headerCell={CustomCheckBoxCell3}
                  cell={CheckBoxCell}
                  filterable={false}
                />
                <GridColumn
                  field="customer_name"
                  title="업체명"
                  footerCell={mainTotalFooterCell3}
                />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </>
      )}
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button
            themeColor={"primary"}
            onClick={() => {
              onSaveClick(filters);
            }}
          >
            확인
          </Button>
          <Button
            themeColor={"primary"}
            fillMode={"outline"}
            onClick={() => {
              setVisible(false);
            }}
          >
            취소
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default ReceptionistWindow;
