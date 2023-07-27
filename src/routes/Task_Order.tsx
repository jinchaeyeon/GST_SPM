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
import { useApi } from "../hooks/api";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { useEffect, useRef, useState } from "react";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  convertDateToStr,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  getter,
  process,
} from "@progress/kendo-data-query";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../store/columns/common-columns";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../store/atoms";
import { Iparameters } from "../store/types";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import DateCell from "../components/Cells/DateCell";

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const receptionTypeQueryStr = `SELECT a.sub_code,
a.code_name
FROM comCodeMaster a 
WHERE a.group_code = 'BA097'
AND use_yn = 'Y'`;

const DATA_ITEM_KEY = "document_id";
let targetRowIndex: null | number = null;

const App = () => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  let gridRef: any = useRef(null);
  const idGetter = getter(DATA_ITEM_KEY);

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
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
  };

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
  const [tabSelected, setTabSelected] = useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
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

  const filterMultiSelectChange = (event: MultiSelectChangeEvent) => {
    const values = event.value;
    const name = event.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: values,
    }));
  };

  const dateTypeData = [
    { sub_code: "A", code_name: "요청일" },
    { sub_code: "B", code_name: "접수일" },
    { sub_code: "C", code_name: "완료예정일" },
  ];
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const statusListData: any[] = [
    { sub_code: "Wait", code_name: "대기", code : "N"},
    { sub_code: "Progress", code_name: "진행중", code : "R"},
    { sub_code: "Hold", code_name: "보류", code : "H"},
    { sub_code: "Finish", code_name: "완료" ,code : "Y"},
  ];

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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

  const fetchReceptionType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(receptionTypeQueryStr));

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
      setReceptionTypeData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchValueCode();
    fetchUsers();
    fetchReceptionType();
  }, []);

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
  );
  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    custnm: string;
    value_code3: any;
    contents: string;
    status: any;
    reception_person: any;
    receptionist: any;
    worker: any;
    reception_type: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };

  const [filters, setFilters] = useState<TFilters>({
    workType: "received",
    date_type: { sub_code: "A", code_name: "요청일" },
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    value_code3: { sub_code: "", code_name: "" },
    contents: "",
    status: [
        { sub_code: "Wait", code_name: "대기", code : "N"},
        { sub_code: "Progress", code_name: "진행중", code : "R"},
        { sub_code: "Hold", code_name: "보류", code : "H"},
    ],
    reception_person: { user_id: "", user_name: "" },
    receptionist: { user_id: "", user_name: "" },
    worker: { user_id: userId, user_name: userName },
    reception_type: { sub_code: "", code_name: "" },
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  function getName(data: { sub_code: string }[]) {
    let str = "";

    data.map((item: { sub_code: string }) => (str += item.sub_code + "|"));

    return data.length > 0 ? str.slice(0, -1) : str;
  }

  //그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length == 0
        ? "Wait|Progress|Hold|Finish"
        : filters.status.length == 1
        ? filters.status[0].sub_code
        : getName(filters.status);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_task_order",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_user_name": "",
        "@p_contents": filters.contents,
        "@p_reception_type":
          filters.reception_type != null ? filters.reception_type.sub_code : "",
        "@p_value_code3":
          filters.value_code3 != null ? filters.value_code3.sub_code : "",
        "@p_reception_person":
          filters.reception_person != null
            ? filters.reception_person.user_id
            : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_receptionist":
          filters.receptionist != null ? filters.receptionist.user_id : "",
        "@p_status": status,
        "@p_check": "",
        "@p_ref_type": "",
        "@p_ref_key": "",
        "@p_ref_seq": 0,
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
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
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

          //   if (tabSelected == 0) {
          //     fetchDocument(
          //       "Task",
          //       selectedRow.orgdiv + "_" + selectedRow.docunum
          //     );
          //   } else if (tabSelected == 1) {
          //     fetchDocument("Question", selectedRow.reception_document_id);
          //   } else if (tabSelected == 2) {
          //     fetchDocument("Answer", selectedRow.answer_document_id);
          //   } else if (tabSelected == 3) {
          //     fetchDocument("Meeting", selectedRow.meeting_document_id);
          //   }

          //   setSubFilters((prev) => ({
          //     ...prev,
          //     docunum: selectedRow.docunum,
          //     isSearch: true,
          //     pgNum: 1,
          //   }));
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

          //   if (tabSelected == 0) {
          //     fetchDocument("Task", rows[0].orgdiv + "_" + rows[0].docunum);
          //   } else if (tabSelected == 1) {
          //     fetchDocument("Question", rows[0].reception_document_id);
          //   } else if (tabSelected == 2) {
          //     fetchDocument("Answer", rows[0].answer_document_id);
          //   } else if (tabSelected == 3) {
          //     fetchDocument("Meeting", rows[0].meeting_document_id);
          //   }

          //   setSubFilters((prev) => ({
          //     ...prev,
          //     docunum: rows[0].docunum,
          //     isSearch: true,
          //     pgNum: 1,
          //   }));
        }
      } else {
        // setSubDataResult((prev) => {
        //   return {
        //     data: [],
        //     total: 0,
        //   };
        // });
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

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    // const selectedIdx = event.startRowIndex;
    // const selectedRowData = event.dataItems[selectedIdx];
    // // DB에 저장안된 첨부파일 서버에서 삭제
    // if (unsavedAttadatnums.attdatnums.length > 0)
    //   setDeletedAttadatnums(unsavedAttadatnums);

    // fetchDocument(
    //   "Task",
    //   selectedRowData.orgdiv + "_" + selectedRowData.docunum
    // );

    // setSubFilters((prev) => ({
    //   ...prev,
    //   docunum: selectedRowData.docunum,
    //   pgNum: 1,
    //   isSearch: true,
    // }));
    // setTabSelected(0);
  };

  const search = () => {
    if (
      filters.date_type == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      //   temp = 0;
      //   deletedRows = [];
      //   //DB에 저장안된 첨부파일 서버에서 삭제
      //   if (unsavedAttadatnums.attdatnums.length > 0)
      //     setDeletedAttadatnums(unsavedAttadatnums);
      setPage(initialPageState); // 페이지 초기화
      //   setTabSelected(0);
      //   setHtmlOnEditor({ document: "" });
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

  return (
    <>
      <TitleContainer>
        <Title>업무 지시</Title>
        <ButtonContainer>
          <Button
            themeColor={"primary"}
            fillMode={"outline"}
            icon="save"
            //onClick={saveProject}
          >
            저장
          </Button>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height={"90vh"}>
        <TabStrip
          style={{ width: "100%", height: `85.5vh` }}
          selected={tabSelected}
          onSelect={handleSelectTab}
        >
          <TabStripTab title="문의접수 참조">
            <GridContainerWrap>
              <GridContainer width={`22%`}>
                <GridTitleContainer>
                  <GridTitle>조회조건</GridTitle>
                </GridTitleContainer>
                <FilterBoxWrap>
                  <FilterBox
                    onKeyPress={(e) => handleKeyPressSearch(e, search)}
                  >
                    <tbody>
                      <tr>
                        <th>
                          <MultiColumnComboBox
                            name="date_type"
                            data={
                              filter
                                ? filterBy(dateTypeData, filter)
                                : dateTypeData
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
                            onChange={(e: {
                              value: { start: any; end: any };
                            }) =>
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
                        <th>Value 구분</th>
                        <td>
                          <MultiColumnComboBox
                            name="value_code3"
                            data={
                              filter2
                                ? filterBy(valuecodeItems, filter2)
                                : valuecodeItems
                            }
                            value={filters.value_code3}
                            columns={dataTypeColumns2}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange2}
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
                        <th>접수 구분</th>
                        <td>
                          <MultiColumnComboBox
                            name="reception_type"
                            data={
                              filter3
                                ? filterBy(receptionTypeData, filter3)
                                : receptionTypeData
                            }
                            value={filters.reception_type}
                            columns={dataTypeColumns}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange3}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>접수자</th>
                        <td>
                          <MultiColumnComboBox
                            name="reception_person"
                            data={
                              filter4 ? filterBy(usersData, filter4) : usersData
                            }
                            value={filters.reception_person}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange4}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>상태</th>
                        <td>
                          <MultiSelect
                            name="status"
                            data={statusListData}
                            onChange={filterMultiSelectChange}
                            value={filters.status}
                            textField="code_name"
                            dataItemKey="sub_code"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>접수담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="receptionist"
                            data={
                              filter5 ? filterBy(usersData, filter5) : usersData
                            }
                            value={filters.receptionist}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange5}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>처리담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="worker"
                            data={
                              filter6 ? filterBy(usersData, filter6) : usersData
                            }
                            value={filters.worker}
                            columns={userColumns}
                            textField={"user_name"}
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
              <GridContainer width={`calc(78% - ${GAP}px)`}>
                <GridContainer>
                  <GridTitleContainer>
                    <GridTitle>문의접수 리스트</GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: `40vh` }}
                    data={process(
                      mainDataResult.data.map((row) => ({
                        ...row,
                        reception_person: usersData.find(
                          (items: any) => items.user_id == row.reception_person
                        )?.user_name,
                        value_code3: valuecodeItems.find(
                          (items: any) => items.sub_code == row.value_code3
                        )?.code_name,
                        reception_type: statusListData.find(
                            (items: any) => items.code == row.reception_type
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
                      field="status"
                      title="상태"
                      width={120}
                      footerCell={mainTotalFooterCell}
                    />
                    <GridColumn
                      field="exists_task"
                      title="지시"
                      width={80}
                      cell={CheckBoxReadOnlyCell}
                    />
                    <GridColumn
                      field="is_finish"
                      title="처리"
                      width={80}
                      cell={CheckBoxReadOnlyCell}
                    />
                    <GridColumn
                      field="request_date"
                      title="요청일"
                      width={120}
                      cell={DateCell}
                    />
                    <GridColumn
                      field="be_finished_date"
                      title="완료예정일"
                      width={120}
                      cell={DateCell}
                    />
                    <GridColumn
                      field="customer_name"
                      title="업체명"
                      width={150}
                    />
                    <GridColumn
                      field="reception_person"
                      title="접수자"
                      width={120}
                    />
                    <GridColumn field="title" title="제목" width={300} />
                    <GridColumn field="reception_attach_files" title="접수 첨부" width={120} />
                    <GridColumn field="user_name" title="문의자" width={120} />
                    <GridColumn
                      field="user_tel"
                      title="연락처"
                      width={150}
                    />
                    <GridColumn
                      field="value_code3"
                      title="Value구분"
                      width={100}
                    />
                    <GridColumn
                      field="reception_type"
                      title="접수 구분"
                      width={120}
                    />
                    <GridColumn
                      field="reception_date"
                      title="접수일"
                      width={120}
                      cell={DateCell}
                    />
                  </Grid>
                </GridContainer>
              </GridContainer>
            </GridContainerWrap>
          </TabStripTab>
        </TabStrip>
      </GridContainerWrap>
    </>
  );
};
export default App;
