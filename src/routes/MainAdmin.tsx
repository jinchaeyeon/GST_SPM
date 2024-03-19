import { DataResult, State, process } from "@progress/kendo-data-query";
import { getter } from "@progress/kendo-react-common";
import {
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import React, { useEffect, useState } from "react";
// ES2015 module syntax
import { Button } from "@progress/kendo-react-buttons";
import "hammerjs";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useHistory } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  AdminCustSummaryBox,
  AdminProjectBox,
  AdminQuestionBox,
  ButtonContainer,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  ScrollableContainer,
  TextBox,
  TitleContainer,
} from "../CommonStyled";
import { dateformat2 } from "../components/CommonFunction";
import CurrentTime from "../components/CurrentTime";
import Loader from "../components/Loader";
import { useApi } from "../hooks/api";
import {
  filterValueState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";

const QUESTION_ITEM_KEY = "document_id";
const CUST_SUMMARY_ITEM_KEY = "customer_code";
const PROJECT_ITEM_KEY = "project";

const Main: React.FC = () => {
  const history = useHistory();
  const questionIdGetter = getter(QUESTION_ITEM_KEY);
  const custSummaryIdGetter = getter(CUST_SUMMARY_ITEM_KEY);
  const projectIdGetter = getter(PROJECT_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const processApi = useApi();
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);
  const [title, setTitle] = useRecoilState(titles);
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
    process([], questionDataState)
  );

  const [custSummaryDataResult, setCustSummaryDataResult] =
    useState<DataResult>(process([], custSummaryDataState));
  const [projectDataResult, setProjectDataResult] = useState<DataResult>(
    process([], projectDataState)
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
    setTitle("");
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
    setFilterValue({ type: "reception", dataItem });
    moveMenu("Reception_Answer");
  };

  const onCustRowClick = (dataItem: any) => {
    setFilterValue({ type: "reception", dataItem });
    moveMenu("Reception_Answer");
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
    <GridContainer style={{ paddingBottom: "20px", height: "95%" }}>
      <TitleContainer
        style={{
          minHeight: "80px",
          fontSize: "24px",
          paddingTop: "5px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <p className="small">
          <span style={{ fontWeight: 700 }}>{userName}</span> 님, 좋은 하루
          되세요
        </p>
        <GridContainer
          style={{
            gap: "15px",
            flexDirection: "row",
            marginRight: isMobile ? "" : "50px",
            display: isMobile ? "block" : "",
            width: isMobile ? "100%" : "",
            marginTop: isMobile ? "15px" : "",
          }}
        >
          <TextBox
            type={"Admin"}
            style={{
              cursor: "pointer",
              display: "block",
              textAlign: "center",
              minHeight: "80px",
              padding: "10px 20px",
              marginTop: isMobile ? "15px" : "",
            }}
            onClick={() => moveMenu("QnA")}
          >
            <p className="small">접수 대기</p>
            <p className="large gray" style={{ width: isMobile ? "100%" : "" }}>
              {taskStatusResult.wait}
              <span>건</span>
            </p>
          </TextBox>
          <TextBox
            type={"Admin"}
            style={{
              cursor: "pointer",
              display: "block",
              textAlign: "center",
              minHeight: "80px",
              padding: "10px 20px",
              marginTop: isMobile ? "15px" : "",
            }}
            onClick={() => moveMenu("QnA")}
          >
            <p className="small">진행중</p>
            <p
              className="large green"
              style={{ width: isMobile ? "100%" : "" }}
            >
              {taskStatusResult.progress}
              <span>건</span>
            </p>
          </TextBox>
          <TextBox
            type={"Admin"}
            style={{
              cursor: "pointer",
              display: "block",
              textAlign: "center",
              minHeight: "80px",
              padding: "10px 20px",
              marginTop: isMobile ? "15px" : "",
            }}
            onClick={() => moveMenu("QnA")}
          >
            <p className="small">예정일 초과</p>
            <p className="large red" style={{ width: isMobile ? "100%" : "" }}>
              {taskStatusResult.over}
              <span>건</span>
            </p>
          </TextBox>
        </GridContainer>
        <ButtonContainer
          style={{
            marginTop: isMobile ? "15px" : "",
            width: isMobile ? "100%" : "",
          }}
        >
          <TextBox
            type={"Admin"}
            style={{
              height: "100%",
              maxHeight: "150px",
              justifyContent: "center",
              minHeight: "80px",
              width: isMobile ? "100%" : "",
            }}
          >
            <div className="medium" style={{ marginTop: "0" }}>
              <CurrentTime />
            </div>
          </TextBox>
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
          <GridContainer height="100%">
            <GridTitleContainer>
              <GridTitle theme={currentTheme}>업체별 현황</GridTitle>
            </GridTitleContainer>
            <ScrollableContainer>
              <div className="scroll-wrapper">
                {custSummaryDataResult.data
                  .sort((a, b) => b.progress_count - a.progress_count)
                  .sort((a, b) => b.over_count - a.over_count)
                  .map((item, idx) => (
                    <AdminCustSummaryBox
                      key={idx}
                      onDoubleClick={() => onCustRowClick(item)}
                    >
                      <div className="cust">{item.customer_name}</div>
                      <div className="cnt">
                        <div className="green">{item.progress_count}</div>
                        <div className="red">{item.over_count}</div>
                      </div>
                    </AdminCustSummaryBox>
                  ))}
              </div>
            </ScrollableContainer>
          </GridContainer>
        </GridContainer>

        <GridContainer width="40%">
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>문의 내용</GridTitle>
          </GridTitleContainer>
          <ScrollableContainer>
            <div className="scroll-wrapper">
              {questionDataResult.data.map((item, idx) => (
                <AdminQuestionBox
                  key={idx}
                  onDoubleClick={() => onQuestionRowClick(item)}
                  style={{ borderBottom: "1px dashed #ccc" }}
                >
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
                    <p className="customer">
                      {item.customer_name} - {item.user_name} /{" "}
                      {item.reception_person}
                    </p>
                  </div>
                  <div>
                    <p>{dateformat2(item.request_date)}</p>
                  </div>
                </AdminQuestionBox>
              ))}
            </div>
          </ScrollableContainer>
        </GridContainer>
        <GridContainer width="40%">
          <GridTitleContainer>
            <GridTitle theme={currentTheme}>프로젝트 진행 현황</GridTitle>
          </GridTitleContainer>

          <ScrollableContainer>
            <div className="scroll-wrapper">
              {projectDataResult.data.map((item, idx) => (
                <AdminProjectBox
                  key={idx}
                  onClick={() => onProjectRowClick(item)}
                  style={{ borderBottom: "1px dashed #ccc" }}
                >
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
            </div>
          </ScrollableContainer>
        </GridContainer>
      </GridContainerWrap>
    </GridContainer>
  );
};

export default Main;
