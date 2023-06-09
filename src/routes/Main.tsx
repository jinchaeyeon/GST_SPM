import React, { useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  GridFooterCellProps,
  GridRowDoubleClickEvent,
} from "@progress/kendo-react-grid";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
// ES2015 module syntax
import {
  GridContainer,
  GridTitle,
  GridContainerWrap,
  GridTitleContainer,
  TextBox,
} from "../CommonStyled";
import { useRecoilState } from "recoil";
import { useApi } from "../hooks/api";
import { filterValueState, loginResultState } from "../store/atoms";
import { Iparameters } from "../store/types";
import { chkScrollHandler } from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import CenterCell from "../components/Cells/CenterCell";
import { useThemeSwitcher } from "react-css-theme-switcher";
import {
  Chart,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartLegend,
  ChartSeries,
  ChartSeriesItem,
  ChartTitle,
} from "@progress/kendo-react-charts";
import "hammerjs";
import CurrentTime from "../components/CurrentTime";
import DateCell from "../components/Cells/DateCell";
import { useHistory } from "react-router-dom";
import Loader from "../components/Loader";
import QnaStateCell from "../components/Cells/QnaStateCell";

const DATA_ITEM_KEY = "datnum";

const labelContent = (props: any) => {
  let formatedNumber = Number(props.dataItem.value).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  });
  return `${props.dataItem.user_name} : ${props.dataItem.cnt}건`;
};

const [firstSeries, secondSeries, thirdSeries, fourthSeries] = [
  [100, 123, 234, 343],
  [120, 67, 231, 196],
  [45, 124, 189, 143],
  [87, 154, 210, 215],
];
const categories = ["월", "화", "수", "목", "금"];

const Main: React.FC = () => {
  const history = useHistory();
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);

  const userId = loginResult ? loginResult.userId : "";
  const { switcher, themes, currentTheme = "" } = useThemeSwitcher();

  const [isLoaded, setIsLoaded] = useState(false);

  // Kendo Chart에 Theme 적용하는데 간헐적으로 오류 발생하여 0.5초후 렌더링되도록 처리함 (메인메뉴 접속할때마다 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const [questionDataState, setQuestionDataState] = useState<State>({
    sort: [],
  });

  const [meetingDataState, setMeetingDataState] = useState<State>({
    sort: [],
  });

  const [questionDataResult, setQuestionDataResult] = useState<DataResult>(
    process([], questionDataState),
  );

  const [meetingDataResult, setMeetingDataResult] = useState<DataResult>(
    process([], meetingDataState),
  );

  const [taskStatusResult, setTaskStatusResult] = useState({
    total: 0,
    wait: 0,
    progress: 0,
    over_date: 0,
    avg_reception_days: 0,
  });
  const [userSummaryResult, setUserSummaryResult] = useState({
    total: [],
    weekly: [],
  });

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [questionPgNum, setQuestionPgNum] = useState(1);
  const [meetingPgNum, setMeetingPgNum] = useState(1);

  const [questionFilter, setQuestionFilter] = useState({
    pgSize: PAGE_SIZE,
    work_type: "Question",
    user_id: userId,
    frdt: "",
    todt: "",
    ref_date: new Date(),
    ref_key: "N",
  });

  const fetchQuestionGrid = async () => {
    let data: any;

    const parameters: Iparameters = {
      procedureName: "pw6_sel_home_customer",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "question",
        "@p_customer_code": userId,
        "@p_user_id": "",
        "@p_ref_key": "",
        "@p_id": "",
        "@p_pc": "",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (rowCnt > 0)
        setQuestionDataResult((prev) => {
          return {
            data: rows,
            total: rowCnt,
          };
        });
    }
  };

  const fetchMeetingGrid = async () => {
    let data: any;
    const parameters: Iparameters = {
      procedureName: "pw6_sel_home_customer",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "meeting",
        "@p_customer_code": userId,
        "@p_user_id": "",
        "@p_ref_key": "",
        "@p_id": "",
        "@p_pc": "",
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rowCount = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (rowCount > 0)
        setMeetingDataResult((prev) => {
          return {
            data: rows,
            total: rowCount,
          };
        });
    }
  };

  const fetchTaskStatus = async () => {
    let data: any;
    const parameters: Iparameters = {
      procedureName: "pw6_sel_home_customer",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "task_status",
        "@p_customer_code": userId,
        "@p_user_id": "",
        "@p_ref_key": "",
        "@p_id": "",
        "@p_pc": "",
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rowCount = data.tables[0].RowCount;
      const row = data.tables[0].Rows[0];
      const {
        total = 0,
        wait = 0,
        progress = 0,
        over_date = 0,
        avg_reception_days = 0,
      } = row;

      if (rowCount > 0)
        setTaskStatusResult({
          total,
          wait,
          progress,
          over_date,
          avg_reception_days,
        });
    }
  };
  const fetchUserSummary = async () => {
    let data: any;
    const parameters: Iparameters = {
      procedureName: "pw6_sel_home_customer",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "user_summary",
        "@p_customer_code": userId,
        "@p_user_id": "",
        "@p_ref_key": "",
        "@p_id": "",
        "@p_pc": "",
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rowCount0 = data.tables[0].RowCount;
      const rowCount1 = data.tables[1].RowCount;
      const rows0 = data.tables[0].Rows;
      const rows1 = data.tables[1].Rows;

      setUserSummaryResult({ total: rows0, weekly: rows1 });
    }
  };

  useEffect(() => {
    switcher({ theme: "dark" });
  }, []);

  useEffect(() => {
    search();
  }, []);

  const search = () => {
    fetchQuestionGrid();
    fetchMeetingGrid();
    fetchTaskStatus();
    fetchUserSummary();
  };

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onMainSelectionChange = (event: GridSelectionChangeEvent) => {
    // const newSelectedState = getSelectedState({
    //   event,
    //   selectedState: selectedState,
    //   dataItemKey: DATA_ITEM_KEY,
    // });
    // setSelectedState(newSelectedState);
    // const selectedIdx = event.startRowIndex;
    // const selectedRowData = event.dataItems[selectedIdx];
    // setQuestionFilter((prev) => ({
    //   ...prev,
    //   itemacnt: selectedRowData.itemacnt,
    //   itemcd: selectedRowData.itemcd,
    //   work_type: "DETAIL1",
    // }));
  };

  //디테일1 그리드 선택 이벤트 => 디테일2 그리드 조회
  const onDetailSelectionChange = (event: GridSelectionChangeEvent) => {
    // const newSelectedState = getSelectedState({
    //   event,
    //   selectedState: detailSelectedState,
    //   dataItemKey: DETAIL_DATA_ITEM_KEY,
    // });
    // setDetailSelectedState(newSelectedState);
    // const selectedIdx = event.startRowIndex;
    // const selectedRowData = event.dataItems[selectedIdx];
    // setMeetingFilter({
    //   ...meetingFilter,
    //   lotnum: selectedRowData.lotnum,
    //   work_type: "DETAIL2",
    // });
  };

  //스크롤 핸들러
  const onQuestionScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, questionPgNum, PAGE_SIZE))
      setQuestionPgNum((prev) => prev + 1);
  };
  const onMeetingScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, meetingPgNum, PAGE_SIZE))
      setMeetingPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onQuestionDataStateChange = (event: GridDataStateChangeEvent) => {
    setQuestionDataState(event.dataState);
  };
  const onMeetingDataStateChange = (event: GridDataStateChangeEvent) => {
    setMeetingDataState(event.dataState);
  };

  //그리드 푸터
  const questionTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {questionDataResult.total}건
      </td>
    );
  };

  const meetingTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {meetingDataResult.total}건
      </td>
    );
  };

  const onQuestionSortChange = (e: any) => {
    setQuestionDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMeetingSortChange = (e: any) => {
    setMeetingDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMeetingRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;
    setFilterValue({ type: "meeting", dataItem });
    moveMenu("MeetingView");
  };

  const onQuestionRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;
    setFilterValue({ type: "qna", dataItem });
    moveMenu("QnA");
  };

  const moveMenu = (id: string) => {
    switcher({ theme: "light" });
    history.push("/" + id);
  };

  if (!isLoaded) {
    return <Loader />;
  }

  return (
    <GridContainerWrap style={{ height: "100%" }}>
      <GridContainerWrap
        flexDirection="column"
        style={{ gap: "20px", width: `30%` }}
      >
        <TextBox>
          <p className="small">좋은 하루 되세요.</p>
          <p className="medium">
            <CurrentTime />
          </p>
        </TextBox>
        <TextBox style={{ cursor: "pointer" }} onClick={() => moveMenu("QnA")}>
          <p className="small">진행중</p>
          <p className="large green">
            {taskStatusResult.progress}
            <span>건</span>
          </p>
        </TextBox>
        <TextBox style={{ cursor: "pointer" }} onClick={() => moveMenu("QnA")}>
          <p className="small">접수 대기</p>
          <p className="large yellow">
            {taskStatusResult.wait}
            <span>건</span>
          </p>
        </TextBox>
        <TextBox>
          <p className="small">평균 접수일</p>
          <p className="large blue">
            {taskStatusResult.avg_reception_days}
            <span>일</span>
          </p>
        </TextBox>
        <TextBox
          style={{ cursor: "pointer" }}
          onClick={() => moveMenu("ProjectSchedule")}
        >
          <p className="small">프로젝트 진행 현황</p>
          <p className="large">
            {taskStatusResult.progress}
            <span>%</span>
          </p>
        </TextBox>
      </GridContainerWrap>

      <GridContainerWrap
        style={{ width: `calc(35% - ${GAP}px)` }}
        flexDirection="column"
      >
        <GridContainer style={{ height: `600px ` }}>
          <Chart>
            <ChartTitle text="2023년 담당자별 문의" />
            <ChartLegend position="bottom" />
            <ChartSeries>
              <ChartSeriesItem
                type="pie"
                data={userSummaryResult.total}
                field="cnt"
                categoryField="user_name"
                labels={{
                  visible: true,
                  content: labelContent,
                }}
              />
            </ChartSeries>
          </Chart>
        </GridContainer>

        <GridContainer style={{ height: `100%` }}>
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>문의 내용</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `100%` }}
            data={process(
              questionDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: detailSelectedState[idGetter(row)],
              })),
              questionDataState,
            )}
            {...questionDataState}
            onDataStateChange={onQuestionDataStateChange}
            //선택기능
            dataItemKey={DATA_ITEM_KEY}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "multiple",
            }}
            onSelectionChange={onDetailSelectionChange}
            //정렬기능
            sortable={true}
            onSortChange={onQuestionSortChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={questionDataResult.total}
            onScroll={onQuestionScrollHandler}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            //행 더블클릭
            onRowDoubleClick={onQuestionRowDoubleClick}
          >
            <GridColumn
              field="request_date"
              title="날짜"
              cell={DateCell}
              footerCell={questionTotalFooterCell}
              width="110px"
            />
            <GridColumn
              field="user_name"
              title="질문자"
              cell={CenterCell}
              width="120px"
            />
            <GridColumn field="title" title="제목" />
            <GridColumn
              field="status"
              title="상태"
              width={80}
              cell={QnaStateCell}
            />
          </Grid>
        </GridContainer>
      </GridContainerWrap>
      <GridContainerWrap
        style={{ width: `calc(35% - ${GAP}px)` }}
        flexDirection="column"
      >
        <GridContainer style={{ height: `600px ` }}>
          <Chart>
            <ChartTitle text="요일별 담당자 문의" />
            <ChartLegend position="bottom" />

            <ChartCategoryAxis>
              <ChartCategoryAxisItem
                categories={categories}
              ></ChartCategoryAxisItem>
            </ChartCategoryAxis>
            <ChartSeries>
              <ChartSeriesItem
                type="column"
                gap={2}
                spacing={0.25}
                data={firstSeries}
              />
              <ChartSeriesItem type="column" data={secondSeries} />
              <ChartSeriesItem type="column" data={thirdSeries} />
              <ChartSeriesItem type="column" data={fourthSeries} />
            </ChartSeries>
          </Chart>
        </GridContainer>
        <GridContainer style={{ height: `100% ` }}>
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>회의록</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: "100%" }}
            data={process(meetingDataResult.data, meetingDataState)}
            {...meetingDataState}
            onDataStateChange={onMeetingDataStateChange}
            //정렬기능
            sortable={true}
            onSortChange={onMeetingSortChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={meetingDataResult.total}
            onScroll={onMeetingScrollHandler}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            //행 더블클릭
            onRowDoubleClick={onMeetingRowDoubleClick}
          >
            <GridColumn
              field="recdt"
              title="작성일"
              cell={DateCell}
              footerCell={meetingTotalFooterCell}
              width="110px"
            />
            <GridColumn field="title" title="제목" />
          </Grid>
        </GridContainer>
      </GridContainerWrap>
    </GridContainerWrap>
  );
};

export default Main;
