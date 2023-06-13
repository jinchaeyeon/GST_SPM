import React, { useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridSelectionChangeEvent,
  GridFooterCellProps,
  GridRowDoubleClickEvent,
  getSelectedState,
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
  ButtonContainer,
  TitleContainer,
  Title,
} from "../CommonStyled";
import { useRecoilState } from "recoil";
import { useApi } from "../hooks/api";
import { filterValueState, loginResultState } from "../store/atoms";
import { SELECTED_FIELD } from "../components/CommonString";
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
  ChartValueAxis,
  ChartValueAxisItem,
} from "@progress/kendo-react-charts";
import "hammerjs";
import CurrentTime from "../components/CurrentTime";
import DateCell from "../components/Cells/DateCell";
import { useHistory } from "react-router-dom";
import Loader from "../components/Loader";
import QnaStateCell from "../components/Cells/QnaStateCell";
import { Button } from "@progress/kendo-react-buttons";

const QUESTION_ITEM_KEY = "document_id";
const MEETING_ITEM_KEY = "meetingnum";
const PROJECT_ITEM_KEY = "project";

const labelContent = (props: any) => {
  let formatedNumber = Number(props.dataItem.value).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  });
  return `${props.dataItem.name} : ${props.dataItem.data}건`;
};

const categories = ["월", "화", "수", "목", "금"];

const Main: React.FC = () => {
  const history = useHistory();
  const questionIdGetter = getter(QUESTION_ITEM_KEY);
  const meetingIdGetter = getter(MEETING_ITEM_KEY);
  const projectIdGetter = getter(PROJECT_ITEM_KEY);

  const processApi = useApi();
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);

  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const { switcher, themes, currentTheme = "" } = useThemeSwitcher();

  const [isLoaded, setIsLoaded] = useState(false);

  // Kendo Chart에 Theme 적용하는데 간헐적으로 오류 발생하여 0.7초후 렌더링되도록 처리함 (메인메뉴 접속할때마다 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 700);

    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const [questionDataState, setQuestionDataState] = useState<State>({
    sort: [],
  });

  const [meetingDataState, setMeetingDataState] = useState<State>({
    sort: [],
  });
  const [projectDataState, setProjectDataState] = useState<State>({
    sort: [],
  });

  const [questionDataResult, setQuestionDataResult] = useState<DataResult>(
    process([], questionDataState),
  );

  const [meetingDataResult, setMeetingDataResult] = useState<DataResult>(
    process([], meetingDataState),
  );
  const [projectDataResult, setProjectDataResult] = useState<DataResult>(
    process([], projectDataState),
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

  const [questionSelectedState, setQuestionSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [meetingSelectedState, setMeetingSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [projectSelectedState, setProjectSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [questionPgNum, setQuestionPgNum] = useState(1);
  const [meetingPgNum, setMeetingPgNum] = useState(1);

  const fetchHome = async () => {
    let data: any;

    try {
      data = await processApi<any>("home-general");
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      const {
        graphTotal,
        graphWeekday,
        meeting,
        project,
        question,
        questionSummary,
      } = data;

      setProjectDataResult({
        data: project.Rows,
        total: project.RowCount,
      });

      setQuestionDataResult({
        data: question.Rows,
        total: question.RowCount,
      });

      setMeetingDataResult({
        data: meeting.Rows,
        total: meeting.RowCount,
      });

      const {
        total = 0,
        wait = 0,
        progress = 0,
        over_date = 0,
        avg_reception_days = 0,
      } = questionSummary;

      setTaskStatusResult({
        total,
        wait,
        progress,
        over_date,
        avg_reception_days,
      });

      setUserSummaryResult({ total: graphTotal, weekly: graphWeekday });
    }
  };

  useEffect(() => {
    switcher({ theme: "dark" });
  }, []);

  useEffect(() => {
    search();
  }, []);

  const search = () => {
    fetchHome();
  };

  const onQuestionSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: questionSelectedState,
      dataItemKey: QUESTION_ITEM_KEY,
    });
    setQuestionSelectedState(newSelectedState);
  };

  const onMeetingSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: meetingSelectedState,
      dataItemKey: MEETING_ITEM_KEY,
    });
    setMeetingSelectedState(newSelectedState);
  };

  const onProjectSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: projectSelectedState,
      dataItemKey: PROJECT_ITEM_KEY,
    });
    setProjectSelectedState(newSelectedState);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onQuestionDataStateChange = (event: GridDataStateChangeEvent) => {
    setQuestionDataState(event.dataState);
  };
  const onMeetingDataStateChange = (event: GridDataStateChangeEvent) => {
    setMeetingDataState(event.dataState);
  };
  const onProjectDataStateChange = (event: GridDataStateChangeEvent) => {
    setProjectDataState(event.dataState);
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
  const projectTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {projectDataResult.total}건
      </td>
    );
  };

  const onQuestionSortChange = (e: any) => {
    setQuestionDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMeetingSortChange = (e: any) => {
    setMeetingDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onProjectSortChange = (e: any) => {
    setProjectDataState((prev) => ({ ...prev, sort: e.sort }));
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
  const onProjectRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;
    setFilterValue({ type: "project", dataItem });
    moveMenu("ProjectSchedule");
  };

  const moveMenu = (id: string) => {
    switcher({ theme: "light" });
    history.push("/" + id);
  };

  if (!isLoaded) {
    return <Loader />;
  }

  return (
    <GridContainer
      className="darkScrollbar"
      style={{ paddingBottom: "20px" }}
      theme="dark"
    >
      <TitleContainer
        style={{
          minHeight: "80px",
          fontSize: "24px",
          paddingTop: "5px",
        }}
      >
        <p className="small" style={{ color: "#fff" }}>
          <span style={{ fontWeight: 900 }}>{userName}</span> 님, 좋은 하루
          되세요
        </p>
        <Title></Title>
        <ButtonContainer>
          <Button
            icon="refresh"
            themeColor={"primary"}
            fillMode={"flat"}
            onClick={search}
          ></Button>
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height="calc(100% - 80px)">
        <GridContainer
          width="15%"
          style={{ gap: "15px", overflow: "overlay" }}
          type="mainLeft"
        >
          <TextBox
            style={{
              minHeight: "120px",
              height: "100%",
              maxHeight: "150px",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <p className="medium" style={{ marginTop: "0" }}>
              <CurrentTime />
            </p>
          </TextBox>
          <TextBox
            style={{ cursor: "pointer" }}
            onClick={() => moveMenu("QnA")}
          >
            <p className="small">진행중</p>
            <p className="large yellow">
              {taskStatusResult.progress}
              <span>건</span>
            </p>
          </TextBox>
          <TextBox
            style={{ cursor: "pointer" }}
            onClick={() => moveMenu("QnA")}
          >
            <p className="small">접수 대기</p>
            <p className="large gray">
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
        </GridContainer>

        <GridContainer width="85%" style={{ gap: "15px" }}>
          <GridContainerWrap height={"50%"}>
            <GridContainer width="40%">
              <Chart style={{ height: "100%" }}>
                <ChartTitle text="2023년 담당자별 문의" />
                <ChartLegend position="bottom" />
                <ChartSeries>
                  <ChartSeriesItem
                    type="pie"
                    data={userSummaryResult.total}
                    field="data"
                    categoryField="name"
                    labels={{
                      visible: true,
                      content: labelContent,
                    }}
                  />
                </ChartSeries>
              </Chart>
            </GridContainer>
            <GridContainer width="60%">
              <Chart style={{ height: "100%" }}>
                <ChartTitle text="요일별 담당자 문의" />
                <ChartLegend position="bottom" />

                <ChartCategoryAxis>
                  <ChartCategoryAxisItem
                    categories={categories}
                  ></ChartCategoryAxisItem>
                </ChartCategoryAxis>

                <ChartValueAxis>
                  <ChartValueAxisItem majorUnit={1} />
                </ChartValueAxis>
                <ChartSeries>
                  {userSummaryResult.weekly.map(
                    (item: { data: []; name: string }, idx) => (
                      <ChartSeriesItem
                        key={idx}
                        type="column"
                        tooltip={{
                          visible: true,
                          format: item.name + " : {0}건",
                        }}
                        data={item.data}
                        name={item.name}
                      />
                    ),
                  )}
                </ChartSeries>
              </Chart>
            </GridContainer>
          </GridContainerWrap>
          <GridContainerWrap height={"50%"}>
            <GridContainer>
              <GridTitleContainer>
                <GridTitle theme={currentTheme}>프로젝트 진행 현황</GridTitle>
              </GridTitleContainer>
              <Grid
                style={{ height: "calc(100% - 35px)" }}
                data={process(
                  projectDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      projectSelectedState[projectIdGetter(row)],
                  })),
                  projectDataState,
                )}
                {...projectDataState}
                onDataStateChange={onProjectDataStateChange}
                //선택기능
                dataItemKey={PROJECT_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onProjectSelectionChange}
                //정렬기능
                sortable={true}
                onSortChange={onProjectSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //행 더블클릭
                onRowDoubleClick={onProjectRowDoubleClick}
              >
                <GridColumn
                  field="project"
                  title="프로젝트"
                  footerCell={projectTotalFooterCell}
                />
                <GridColumn
                  field="progress"
                  title="진행률"
                  width={80}
                  cell={CenterCell}
                />
              </Grid>
            </GridContainer>
            <GridContainer>
              <GridTitleContainer>
                <GridTitle theme={currentTheme}>문의 내용</GridTitle>
              </GridTitleContainer>
              <Grid
                style={{ height: `calc(100% - 35px)` }}
                data={process(
                  questionDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      questionSelectedState[questionIdGetter(row)],
                  })),
                  questionDataState,
                )}
                {...questionDataState}
                onDataStateChange={onQuestionDataStateChange}
                //선택기능
                dataItemKey={QUESTION_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onQuestionSelectionChange}
                //정렬기능
                sortable={true}
                onSortChange={onQuestionSortChange}
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
                  width={100}
                />
                <GridColumn
                  field="user_name"
                  title="질문자"
                  cell={CenterCell}
                  width={65}
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

            <GridContainer>
              <GridTitleContainer>
                <GridTitle theme={currentTheme}>회의록</GridTitle>
              </GridTitleContainer>
              <Grid
                style={{ height: "calc(100% - 35px)" }}
                data={process(
                  meetingDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]:
                      meetingSelectedState[meetingIdGetter(row)],
                  })),
                  meetingDataState,
                )}
                {...meetingDataState}
                onDataStateChange={onMeetingDataStateChange}
                //선택기능
                dataItemKey={MEETING_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onMeetingSelectionChange}
                //정렬기능
                sortable={true}
                onSortChange={onMeetingSortChange}
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
                  width={100}
                />
                <GridColumn field="title" title="제목" />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </GridContainer>
      </GridContainerWrap>
    </GridContainer>
  );
};

export default Main;
