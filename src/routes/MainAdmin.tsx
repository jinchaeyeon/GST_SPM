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
  AdminQuestionBox,
  ScrollableContainer,
  AdminProjectBox,
  AdminCustSummaryBox,
} from "../CommonStyled";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useApi } from "../hooks/api";
import { filterValueState, isLoading, loginResultState } from "../store/atoms";
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
import { dateformat2 } from "../components/CommonFunction";

const QUESTION_ITEM_KEY = "document_id";
const CUST_SUMMARY_ITEM_KEY = "customer_code";
const PROJECT_ITEM_KEY = "project";

const Main: React.FC = () => {
  const history = useHistory();
  const questionIdGetter = getter(QUESTION_ITEM_KEY);
  const custSummaryIdGetter = getter(CUST_SUMMARY_ITEM_KEY);
  const projectIdGetter = getter(PROJECT_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);

  const processApi = useApi();
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);

  const userName = loginResult ? loginResult.userName : "";
  const { switcher, currentTheme = "" } = useThemeSwitcher();

  const [isLoaded, setIsLoaded] = useState(false);
  // Kendo Chart에 Theme 적용하는데 간헐적으로 오류 발생하여 n초 후 렌더링되도록 처리함 (메인메뉴 접속할때마다 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const [questionDataState, setQuestionDataState] = useState<State>({
    sort: [],
  });

  const [custSummaryDataState, setCustSummaryDataState] = useState<State>({
    sort: [],
  });
  const [projectDataState, setProjectDataState] = useState<State>({
    sort: [],
  });

  const [questionDataResult, setQuestionDataResult] = useState<DataResult>(
    process([], questionDataState),
  );

  const [custSummaryDataResult, setCustSummaryDataResult] =
    useState<DataResult>(process([], custSummaryDataState));
  const [projectDataResult, setProjectDataResult] = useState<DataResult>(
    process([], projectDataState),
  );

  const [taskStatusResult, setTaskStatusResult] = useState({
    total: 0,
    wait: 0,
    progress: 0,
    over: 0,
  });

  const [questionSelectedState, setQuestionSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custSummarySelectedState, setCustSummarySelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [projectSelectedState, setProjectSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const fetchHome = async () => {
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("home-manager");
    } catch (error) {
      data = null;
    }
    setLoading(false);

    if (data !== null && data.isSuccess) {
      const questionSummary = data.tables[0].Rows[0];
      const custSummary = data.tables[1];
      const question = data.tables[2];
      const project = data.tables[3];

      setProjectDataResult({
        data: project.Rows,
        total: project.RowCount,
      });

      setQuestionDataResult({
        data: question.Rows,
        total: question.RowCount,
      });

      setCustSummaryDataResult({
        data: custSummary.Rows,
        total: custSummary.RowCount,
      });

      const { total = 0, wait = 0, progress = 0, over = 0 } = questionSummary;

      setTaskStatusResult({
        total,
        wait,
        progress,
        over,
      });
    }
  };

  useEffect(() => {
    // switcher({ theme: "dark" });
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

  const onCustSummarySelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: custSummarySelectedState,
      dataItemKey: CUST_SUMMARY_ITEM_KEY,
    });
    setCustSummarySelectedState(newSelectedState);
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
  const onCustSummaryDataStateChange = (event: GridDataStateChangeEvent) => {
    setCustSummaryDataState(event.dataState);
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

  const custSummaryTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {custSummaryDataResult.total}건
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
  const onCustSummarySortChange = (e: any) => {
    setCustSummaryDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onProjectSortChange = (e: any) => {
    setProjectDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onCustSummaryRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;
    // setFilterValue({ type: "custSummary", dataItem });
    // moveMenu("CustSummaryView");
  };

  const onQuestionRowClick = (dataItem: any) => {
    // setFilterValue({ type: "qna", dataItem });
    // moveMenu("QnA");
  };
  const onProjectRowClick = (dataItem: any) => {
    setFilterValue({ type: "project", dataItem });
    moveMenu("ProjectSchedule");
  };

  const moveMenu = (id: string) => {
    // switcher({ theme: "light" });
    history.push("/" + id);
  };

  if (!isLoaded) {
    return <Loader />;
  }

  return (
    <GridContainer style={{ paddingBottom: "20px" }}>
      <TitleContainer
        style={{
          minHeight: "80px",
          fontSize: "24px",
          paddingTop: "5px",
        }}
      >
        <p className="small">
          <span style={{ fontWeight: 700 }}>{userName}</span> 님, 좋은 하루
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
        <GridContainer width="20%" type="mainLeft">
          <GridContainer style={{ gap: "15px" }}>
            <TextBox
              style={{
                minHeight: "120px",
                height: "100%",
                maxHeight: "150px",
                padding: "20px",
              }}
            >
              <div className="medium" style={{ marginTop: "0" }}>
                <CurrentTime />
              </div>
            </TextBox>
            <TextBox
              type={"Admin"}
              style={{ cursor: "pointer" }}
              onClick={() => moveMenu("QnA")}
            >
              <p className="small">전체 미처리</p>
              <p className="large gray">
                {taskStatusResult.total}
                <span>건</span>
              </p>
            </TextBox>
            <TextBox
              type={"Admin"}
              style={{ cursor: "pointer" }}
              onClick={() => moveMenu("QnA")}
            >
              <p className="small">접수 대기</p>
              <p className="large dark-gray">
                {taskStatusResult.wait}
                <span>건</span>
              </p>
            </TextBox>
            <TextBox
              type={"Admin"}
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
              type={"Admin"}
              style={{ cursor: "pointer" }}
              onClick={() => moveMenu("QnA")}
            >
              <p className="small">예정일 초과</p>
              <p className="large red">
                {taskStatusResult.over}
                <span>건</span>
              </p>
            </TextBox>
          </GridContainer>
          <GridContainer height="calc(100% - 420px)">
            <GridTitleContainer>
              <GridTitle theme={currentTheme}>업체별 현황</GridTitle>
            </GridTitleContainer>
            <ScrollableContainer>
              {custSummaryDataResult.data
                .sort((a, b) => b.progress_count - a.progress_count)
                .map((item) => (
                  <AdminCustSummaryBox>
                    <div className="cust">{item.customer_name}</div>
                    <div className="cnt">{item.progress_count}</div>
                  </AdminCustSummaryBox>
                ))}
            </ScrollableContainer>
          </GridContainer>
        </GridContainer>

        <GridContainer width="40%">
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>문의 내용</GridTitle>
          </GridTitleContainer>
          <ScrollableContainer>
            {questionDataResult.data.map((item) => (
              <AdminQuestionBox onClick={() => onQuestionRowClick(item)}>
                <div
                  className={`status ${
                    item.is_over === "Y" ? "O" : item.status
                  }`}
                >
                  {item.is_over === "Y"
                    ? "초과" +
                      (item.is_over === "Y" &&
                        item.over_days &&
                        " +" + item.over_days)
                    : item.status === "N"
                    ? "대기"
                    : item.status === "R"
                    ? "진행중"
                    : item.status === "Y"
                    ? "완료"
                    : "보류"}
                </div>
                <div>
                  <p className="title">{item.title}</p>
                  <p className="customer">{item.customer_name}</p>
                </div>
                <div>
                  <p>{dateformat2(item.request_date)}</p>
                </div>
              </AdminQuestionBox>
            ))}
          </ScrollableContainer>
        </GridContainer>
        <GridContainer width="40%">
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>프로젝트 진행 현황</GridTitle>
          </GridTitleContainer>

          <ScrollableContainer>
            {projectDataResult.data.map((item) => (
              <AdminProjectBox onClick={() => onProjectRowClick(item)}>
                <div>
                  <div className="sub">
                    <p className="custnm">{item.custnm}</p>
                    <p className="project">{item.project}</p>
                  </div>
                  <p className="curr_title">{item.curr_title}</p>
                </div>
                <div className="days">{item.days}</div>
              </AdminProjectBox>
            ))}
          </ScrollableContainer>
        </GridContainer>
      </GridContainerWrap>
    </GridContainer>
  );
};

export default Main;
