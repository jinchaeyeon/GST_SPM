import { Button } from "@progress/kendo-react-buttons";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  Title,
  TitleContainer,
} from "../CommonStyled";
import { isLoading, loginResultState } from "../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  convertDateToStr,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import { useEffect, useRef, useState } from "react";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import {
  dataTypeColumns,
  dateTypeColumns,
  userColumns,
} from "../store/columns/common-columns";
import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  getter,
  process,
} from "@progress/kendo-data-query";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../hooks/api";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { Iparameters } from "../store/types";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import DateCell from "../components/Cells/DateCell";
import CenterCell from "../components/Cells/CenterCell";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import RequiredHeader from "../components/RequiredHeader";
import NumberCell from "../components/Cells/NumberCell";

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const statusQueryStr = `SELECT '%' as code, '전체' as name
UNION ALL
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const DATA_ITEM_KEY = "docunum";
const SUB_DATA_ITEM_KEY = "datnum";
let targetRowIndex: null | number = null;

const App = () => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const [view, setView] = useState<"Scheduler" | "Grid">("Scheduler");
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);
  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });

    setPage2(initialPageState);
    setSubFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isSearch: true,
    }));
  };

  const pageChange2 = (event: GridPageChangeEvent) => {
    const { page } = event;

    setSubFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage2({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);

  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const [filter, setFilter] = useState<FilterDescriptor>();
  const [filter2, setFilter2] = useState<FilterDescriptor>();
  const [filter3, setFilter3] = useState<FilterDescriptor>();
  const [filter4, setFilter4] = useState<FilterDescriptor>();
  const [filter5, setFilter5] = useState<FilterDescriptor>();
  const [filter6, setFilter6] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter(event.filter);
    }
  };
  const handleFilterChange2 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter2(event.filter);
    }
  };

  const handleFilterChange3 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter3(event.filter);
    }
  };

  const handleFilterChange4 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter4(event.filter);
    }
  };

  const handleFilterChange5 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter5(event.filter);
    }
  };

  const handleFilterChange6 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter6(event.filter);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchstatus();
    fetchWorkType();
    fetchUsers();
    fetchValueCode();
  }, []);

  const fetchWorkType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(workTypeQueryStr));

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
      setWorkTypeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchstatus = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(statusQueryStr));

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
      setStateData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

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
      setUsersData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchValueCode = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(valueCodeQueryStr));

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
      setValuecodeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filterComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [dateTypeData, setDateTypeData] = useState<any[]>([
    {
      sub_code: "A",
      code_name: "지시일",
    },
    {
      sub_code: "B",
      code_name: "완료예정일",
    },
    {
      sub_code: "C",
      code_name: "고객문의일-접수",
    },
    {
      sub_code: "D",
      code_name: "계약일-프로젝트",
    },
  ]);
  const [TypeData, setTypeData] = useState<any[]>([
    {
      name: "전체",
    },
    {
      name: "접수",
    },
    {
      name: "프로젝트",
    },
    {
      name: "회의록",
    },
    {
      name: "미참조",
    },
  ]);
  const [StatusData, setStateData] = useState<any[]>([]);
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });
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
  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    custnm: string;
    work_category: any;
    status: any;
    contents: string;
    orderer: any;
    worker: any;
    type: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };
  type TSubFilters = {
    workType: string;
    docunum: string;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };
  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  );
  const [filters, setFilters] = useState<TFilters>({
    workType: "task_order",
    date_type: { sub_code: "A", code_name: "지시일" },
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    work_category: { sub_code: "", code_name: "" },
    status: { code: "N", name: "미완료" },
    contents: "",
    orderer: { user_id: "", user_name: "" },
    worker: { user_id: userId, user_name: userName },
    type: { name: "전체" },
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  const [subFilters, setSubFilters] = useState<TSubFilters>({
    workType: "record",
    docunum: "",
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: false,
  });

  //그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_record",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_contents": filters.contents,
        "@p_orderer": filters.orderer != null ? filters.orderer.user_id : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_value_code3": "",
        "@p_status":
          filters.status != null
            ? filters.status.code == "%"
              ? "Y|N"
              : filters.status.code
            : "",
        "@p_work_category":
          filters.work_category != null ? filters.work_category.sub_code : "",
        "@p_ref_type":
          filters.type != null
            ? filters.type.name == "전체"
              ? "접수, 프로젝트, 회의록, 미참조"
              : filters.type.type
            : "",
        "@p_ref_key": "",
        //"@p_find_row_value": filters.find_row_value,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (filters.find_row_value !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row[DATA_ITEM_KEY] == filters.find_row_value
          );
          targetRowIndex = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef.current) {
          targetRowIndex = 0;
        }
      }

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        const selectedRow =
          filters.find_row_value == ""
            ? rows[0]
            : rows.find(
                (row: any) => row[DATA_ITEM_KEY] == filters.find_row_value
              );

        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });

          setSubFilters((prev) => ({
            ...prev,
            docunum: selectedRow.docunum,
            isSearch: true,
            pgNum: 1,
          }));
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
          setSubFilters((prev) => ({
            ...prev,
            docunum: rows[0].docunum,
            isSearch: true,
            pgNum: 1,
          }));
        }
      } else {
        setSubDataResult((prev) => {
          return {
            data: [],
            total: 0,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setFilters((prev) => ({
      ...prev,
      pgNum:
        data && data.hasOwnProperty("pageNumber")
          ? data.pageNumber
          : prev.pgNum,
      isSearch: false,
    }));
    setLoading(false);
  };

  //그리드 데이터 조회
  const fetchSubGrid = async (subfilters: any) => {
    let data: any;
    setLoading(true);
    const parameters: Iparameters = {
      procedureName: "pw6_sel_record",
      pageNumber: subfilters.pgNum,
      pageSize: subfilters.pgSize,
      parameters: {
        "@p_work_type": subfilters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_contents": filters.contents,
        "@p_orderer": filters.orderer != null ? filters.orderer.user_id : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_value_code3": "",
        "@p_status":
          filters.status != null
            ? filters.status.code == "%"
              ? "Y|N"
              : filters.status.code
            : "",
        "@p_work_category":
          filters.work_category != null ? filters.work_category.sub_code : "",
        "@p_ref_type":
          filters.type != null
            ? filters.type.name == "전체"
              ? "접수, 프로젝트, 회의록, 미참조"
              : filters.type.type
            : "",
        "@p_ref_key": subfilters.docunum,
        //"@p_find_row_value": filters.find_row_value,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }
    console.log(parameters);
    console.log(data);
    if (data.isSuccess === true) {
      let idx = 0;
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
        };
      });

      setSubDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        const selectedRow =
          subfilters.find_row_value == ""
            ? rows[0]
            : rows.find(
                (row: any) =>
                  row[SUB_DATA_ITEM_KEY] == subfilters.find_row_value
              );

        if (selectedRow != undefined) {
          setSelectedsubDataState({ [selectedRow[SUB_DATA_ITEM_KEY]]: true });
        } else {
          setSelectedsubDataState({ [rows[0][SUB_DATA_ITEM_KEY]]: true });
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setSubFilters((prev) => ({
      ...prev,
      pgNum:
        data && data.hasOwnProperty("pageNumber")
          ? data.pageNumber
          : prev.pgNum,
      isSearch: false,
    }));
    setLoading(false);
  };

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (subFilters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(subFilters);
      setSubFilters((prev) => ({
        ...prev,
        find_row_value: "",
        isSearch: false,
      })); // 한번만 조회되도록
      fetchSubGrid(deepCopiedFilters);
    }
  }, [subFilters]);

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
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
    // // DB에 저장안된 첨부파일 서버에서 삭제
    // if (unsavedAttadatnums.attdatnums.length > 0)
    //   setDeletedAttadatnums(unsavedAttadatnums);

    setSubFilters((prev) => ({
      ...prev,
      docunum: selectedRowData.docunum,
      pgNum: 1,
      isSearch: true,
    }));
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSubSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });
    setSelectedsubDataState(newSelectedState);
  };

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

  //그리드 푸터
  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {subDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const search = () => {
    if (
      filters.date_type == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      // temp = 0;
      // temp2 = 0;
      // deletedRows = [];
      // DB에 저장안된 첨부파일 서버에서 삭제
      // if (unsavedAttadatnums.attdatnums.length > 0)
      //   setDeletedAttadatnums(unsavedAttadatnums);

      setPage(initialPageState); // 페이지 초기화
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        find_row_value: "",
        isSearch: true,
      }));
    }
  };
  const parseDate = (input: any) => {
    // 값이 없는 경우 null 반환
    if (!input) {
      return "";
    }

    const pattern = /(^\d{4})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;

    if (!pattern.test(input)) {
      return "";
    }

    var yyyyMMdd = String(input);
    var sYear = yyyyMMdd.substring(0, 4);
    var sMonth = yyyyMMdd.substring(4, 6);
    var sDate = yyyyMMdd.substring(6, 8);

    // 입력을 Date 객체로 변환
    const date = new Date(Number(sYear), Number(sMonth) - 1, Number(sDate));

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      // 유효하지 않은 날짜인 경우 오늘의 날짜 반환
      return "";
    } else {
      // 유효한 날짜인 경우 변환된 날짜 반환
      return date;
    }
  };

  return (
    <>
      <TitleContainer>
        <Title>처리일지</Title>
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          {isAdmin && view === "Grid" && (
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="save"
              //onClick={saveProject}
            >
              저장
            </Button>
          )}
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height={"90%"}>
        <GridContainer width={"22%"}>
          <GridTitleContainer>
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
          <FilterBoxWrap>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>
                    <MultiColumnComboBox
                      name="date_type"
                      data={
                        filter ? filterBy(dateTypeData, filter) : dateTypeData
                      }
                      value={filters.date_type}
                      columns={dataTypeColumns}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </th>
                  <td colSpan={3}>
                    <CommonDateRangePicker
                      value={{
                        start: filters.fromDate,
                        end: filters.toDate,
                      }}
                      onChange={(e: { value: { start: any; end: any } }) =>
                        setFilters((prev) => ({
                          ...prev,
                          fromDate: e.value.start,
                          toDate: e.value.end,
                        }))
                      }
                      className="required"
                    />
                  </td>
                </tr>
                <tr>
                  <th>업체명</th>
                  <td>
                    <Input
                      name="custnm"
                      type="text"
                      value={filters.custnm}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>업무분류</th>
                  <td>
                    <MultiColumnComboBox
                      name="work_category"
                      data={
                        filter2
                          ? filterBy(WorkTypeItems, filter2)
                          : WorkTypeItems
                      }
                      value={filters.work_category}
                      columns={dataTypeColumns}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange2}
                    />
                  </td>
                </tr>
                <tr>
                  <th>처리</th>
                  <td>
                    <MultiColumnComboBox
                      name="status"
                      data={
                        filter3 ? filterBy(StatusData, filter3) : StatusData
                      }
                      value={filters.status}
                      columns={dateTypeColumns}
                      textField={"name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange3}
                    />
                  </td>
                </tr>
                <tr>
                  <th>제목 및 내용</th>
                  <td>
                    <Input
                      name="contents"
                      type="text"
                      value={filters.contents}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>지시자</th>
                  <td>
                    <MultiColumnComboBox
                      name="orderer"
                      data={filter4 ? filterBy(usersData, filter4) : usersData}
                      value={filters.orderer}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange4}
                    />
                  </td>
                </tr>
                <tr>
                  <th>처리담당자</th>
                  <td>
                    <MultiColumnComboBox
                      name="worker"
                      data={filter5 ? filterBy(usersData, filter5) : usersData}
                      value={filters.worker}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange5}
                    />
                  </td>
                </tr>
                <tr>
                  <th>참조타입</th>
                  <td>
                    <MultiColumnComboBox
                      name="type"
                      data={filter6 ? filterBy(TypeData, filter6) : TypeData}
                      value={filters.type}
                      columns={dateTypeColumns}
                      textField={"name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange6}
                    />
                  </td>
                </tr>
              </tbody>
            </FilterBox>
          </FilterBoxWrap>
        </GridContainer>
        <GridContainer width={`calc(43% - ${GAP}px)`}>
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>업무지시 정보</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "45vh" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  indicator: usersData.find(
                    (items: any) => items.user_id == row.indicator
                  )?.user_name,
                  person: usersData.find(
                    (items: any) => items.user_id == row.person
                  )?.user_name,
                  groupcd: WorkTypeItems.find(
                    (items: any) => items.sub_code == row.groupcd
                  )?.code_name,
                  value_code3: valuecodeItems.find(
                    (items: any) => items.sub_code == row.value_code3
                  )?.code_name,
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
                mode: "single",
              }}
              onSelectionChange={onSelectionChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={mainDataResult.total}
              skip={page.skip}
              take={page.take}
              pageable={true}
              onPageChange={pageChange}
              //원하는 행 위치로 스크롤 기능
              ref={gridRef}
              rowHeight={30}
              //정렬기능
              sortable={true}
              onSortChange={onMainSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
            >
              <GridColumn
                field="is_finished"
                title="처리"
                width={80}
                cell={CheckBoxReadOnlyCell}
              />
              <GridColumn field="ref_type_full" title="참조타입" width={100} />
              <GridColumn
                field="recdt"
                title="지시일"
                width={120}
                cell={DateCell}
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="indicator" title="지시자" width={120} />
              <GridColumn field="custnm" title="업체명" width={150} />
              <GridColumn field="groupcd" title="업무분류" width={120} />
              <GridColumn field="value_code3" title="Value구분" width={120} />
              <GridColumn field="person" title="처리담당자" width={120} />
              <GridColumn
                field="finexpdt"
                title="완료예정일"
                width={120}
                cell={DateCell}
              />
              <GridColumn
                field="exphh"
                title="예상(H)"
                width={100}
                cell={CenterCell}
              />
              <GridColumn
                field="expmm"
                title="예상(M)"
                width={100}
                cell={CenterCell}
              />
              <GridColumn field="contents" title="내용" width={300} />
              <GridColumn field="attdatnum" title="첨부" width={120} />
              <GridColumn field="remark" title="비고" width={200} />
              <GridColumn field="docunum" title="관리번호" width={200} />
            </Grid>
          </GridContainer>
          <GridContainer style={{ marginTop: "10px" }}>
            <GridTitleContainer>
              <GridTitle>처리 영역</GridTitle>
              <ButtonContainer>
                <Button
                  //onClick={onAddClick}
                  themeColor={"primary"}
                  icon="plus"
                  title="행 추가"
                ></Button>
                <Button
                  //onClick={onRemoveClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                  title="행 삭제"
                ></Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "35vh" }}
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
              onSelectionChange={onSubSelectionChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={subDataResult.total}
              skip={page2.skip}
              take={page2.take}
              pageable={true}
              onPageChange={pageChange2}
              //원하는 행 위치로 스크롤 기능
              ref={gridRef2}
              rowHeight={30}
              //정렬기능
              sortable={true}
              onSortChange={onSubSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
            >
              <GridColumn
                field="is_finished"
                title="완료"
                width={80}
                cell={CheckBoxCell}
              />
              <GridColumn
                field="processing_date"
                title="처리일자"
                headerCell={RequiredHeader}
                width={120}
                cell={DateCell}
                footerCell={subTotalFooterCell}
              />
              <GridColumn field="person" title="처리자" width={120} />
              <GridColumn
                field="use_hour"
                title="시간"
                width={100}
                cell={NumberCell}
              />
              <GridColumn
                field="use_minute"
                title="분"
                width={100}
                cell={NumberCell}
              />
              <GridColumn field="kind1" title="전체분류" headerCell={RequiredHeader} width={120} />
              <GridColumn field="contents" title="내용" width={300} />
              <GridColumn field="attdatnum" title="첨부" width={120} />
              <GridColumn field="value_code3" title="Value구분" width={120} />
              <GridColumn
                field="title"
                title="제목"
                headerCell={RequiredHeader}
                width={120}
              />
            </Grid>
          </GridContainer>
        </GridContainer>
        <GridContainer width={`calc(35% - ${GAP}px)`}></GridContainer>
      </GridContainerWrap>
    </>
  );
};
export default App;
