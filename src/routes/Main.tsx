import { DataResult, State, process } from "@progress/kendo-data-query";
import { getter } from "@progress/kendo-react-common";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import React, { useEffect, useLayoutEffect, useState } from "react";
// ES2015 module syntax
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { Box, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { Button } from "@progress/kendo-react-buttons";
import { bytesToBase64 } from "byte-base64";
import "hammerjs";
import Cookies from "js-cookie";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useHistory } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { Autoplay, EffectCoverflow, Navigation } from "swiper";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import  secureLocalStorage  from  "react-secure-storage";
import {
  ButtonContainer,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  TextBox,
  Title,
  TitleContainer,
} from "../CommonStyled";
import CenterCell from "../components/Cells/CenterCell";
import DateCell from "../components/Cells/DateCell";
import QnAStateCell from "../components/Cells/QnAStateCell";
import { convertDateToStr } from "../components/CommonFunction";
import { GAP, SELECTED_FIELD } from "../components/CommonString";
import CurrentTime from "../components/CurrentTime";
import Loader from "../components/Loader";
import NoticeWindow from "../components/Windows/CommonWindows/NoticeWindow";
import { useApi } from "../hooks/api";
import {
  filterValueState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";
import { Iparameters } from "../store/types";

const QUESTION_ITEM_KEY = "document_id";
const MEETING_ITEM_KEY = "meetingnum";
const PROJECT_ITEM_KEY = "project";

const Main: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const history = useHistory();
  const questionIdGetter = getter(QUESTION_ITEM_KEY);
  const meetingIdGetter = getter(MEETING_ITEM_KEY);
  const projectIdGetter = getter(PROJECT_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  const [title, setTitle] = useRecoilState(titles);
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

  useLayoutEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth <= 1200);
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
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
  const [noticeDataState, setNoticeDataState] = useState<State>({
    sort: [],
  });
  const [questionDataResult, setQuestionDataResult] = useState<DataResult>(
    process([], questionDataState)
  );

  const [meetingDataResult, setMeetingDataResult] = useState<DataResult>(
    process([], meetingDataState)
  );
  const [projectDataResult, setProjectDataResult] = useState<DataResult>(
    process([], projectDataState)
  );
  const [noticeDataResult, setNoticeDataResult] = useState<DataResult>(
    process([], noticeDataState)
  );
  const [noticeSum, setNoticeSum] = useState(0);

  const [taskStatusResult, setTaskStatusResult] = useState({
    total: 0,
    wait: 0,
    progress: 0,
    over_date: 0,
    avg_reception_days: 0,
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

  const fetchHome = async () => {
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("home-general");
    } catch (error) {
      data = null;
    }
    setLoading(false);

    if (data !== null) {
      const { meeting, project, question, questionSummary } = data;

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
    }
  };

  useEffect(() => {
    // switcher({ theme: "dark" });
    search();
    fetchPopUp();
    fetchMainGrid();
    setTitle("");
    fetchTypes();
  }, []);

  const [currentPopup, setCurrentPopup] = useState(0);
  const [noticeWindowVisible, setNoticeWindowVisible] =
    useState<boolean>(false);

  const fetchPopUp = async () => {
    let data: any;

    const savedNoticesRaw: any = secureLocalStorage.getItem("PopUpNotices");
    const savedNotices = savedNoticesRaw ? JSON.parse(savedNoticesRaw) : [];

    const ref_key = savedNotices.join(",");

    setLoading(true);
    const para = {
      id: `?id=${ref_key}`,
    };

    try {
      data = await processApi<any>("home-general-notice", para);
    } catch (error) {
      data = null;
    }
    setLoading(false);

    if (data !== null) {
      const { recentNotices } = data;
      setCurrentPopup(0);
      setNoticeDataResult({
        data: recentNotices.Rows,
        total: recentNotices.RowCount,
      });

      if (recentNotices.RowCount > 0) {
        setNoticeWindowVisible(true);
      }
    }
  };

  useEffect(() => {
    if (currentPopup != 0 && noticeDataResult.total > currentPopup) {
      setNoticeWindowVisible(true);
    }
  }, [currentPopup]);

  const search = () => {
    fetchHome();
    fetchNotice();
    fetchMainGrid();
    fetchTypes();
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
    // switcher({ theme: "light" });
    history.push("/" + id);
  };

  const fetchNotice = async () => {
    let data: any;
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        lastMonth
      )}&toDate=${convertDateToStr(today)}&page=1&pageSize=1000`,
    };

    try {
      data = await processApi<any>("notice-list", para);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      const totalRowCount = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      // 쿠키 사용하여 미확인 공지사항 필터링
      const savedNoticesRaw = Cookies.get("readNotices");

      if (savedNoticesRaw) {
        const savedNotices = JSON.parse(savedNoticesRaw);
        const fetchedNotcies = rows.map((row: any) => row.document_id);
        const filteredArray = fetchedNotcies.filter(
          (value: any) => !savedNotices.includes(value)
        );

        setNoticeSum(filteredArray.length);
      } else {
        setNoticeSum(totalRowCount == -1 ? 0 : totalRowCount);
      }
    }
  };

  const userId = loginResult ? loginResult.userId : "";
  const [typesData, setTypesData] = useState<any[]>([]);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const fetchTypes = async () => {
    let data: any;
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(
      bytes(
        "SELECT sub_code, code_name FROM comCodeMaster WHERE group_code = 'SP010'"
      )
    );

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
      setTypesData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_promotion",
      pageNumber: 1,
      pageSize: 5,
      parameters: {
        "@p_work_type": "main",
        "@p_title": "",
        "@p_category": "",
        "@p_tagnames_s": "",
        "@p_document_id": "",
        "@p_find_row_value": "",
        "@p_id": userId,
        "@p_is_open": "Y",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const TotalRowCount = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => ({
        ...row,
        thumbnail: row.thumbnail
          ? `data:image/png;base64,${row.thumbnail}`
          : null,
      }));
      if (TotalRowCount > 0) {
        setMainDataResult({
          data: rows,
          total: TotalRowCount == -1 ? 0 : TotalRowCount,
        });
      } else {
        setMainDataResult(process([], mainDataState));
      }
      setLoading(false);
    }
  };

  const handleCardClick = (item: any) => {
    const origin = window.location.origin;
    window.location.href = origin + `/Promotion?go=` + item.document_id;
  };

  if (!isLoaded) {
    return <Loader />;
  }

  return (
    <>
      <GridContainer style={{ paddingBottom: "40px", height: "100%" }}>
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
          <GridContainer width="15%" style={{ gap: "15px" }} type="mainLeft">
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
            <TextBox
              style={{ cursor: "pointer" }}
              onClick={() => moveMenu("Notice")}
            >
              <p className="small">공지사항</p>
              <p className="large green">
                {noticeSum}
                <span>건</span>
              </p>
            </TextBox>
          </GridContainer>

          <GridContainer width={`calc(85% - ${GAP * 7}px)`}>
            <GridContainerWrap height={"50%"}>
              <Swiper
                className="HomeSwiper"
                effect={"coverflow"}
                centeredSlides={true}
                slidesPerView={2}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 100,
                  depth: 100,
                  modifier: 3,
                  slideShadows: true,
                }}
                speed={500}
                navigation={true}
                modules={[Autoplay, EffectCoverflow, Navigation]}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                style={{
                  height: isMobile ? "300px" : "100%",
                  width: "100%",
                }}
                loop={true}
              >
                {mainDataResult.data.map((item, index) => (
                  <SwiperSlide key={index}>
                    <GridContainer>
                      <Card
                        onClick={() => handleCardClick(item)}
                        sx={{
                          borderRadius: 2,
                          padding: "10px 10px 0 10px",
                          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                          transition: "0.7s",
                          "&:hover": {
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                            cursor: "pointer",
                            transform: "translateY(-3px)",
                          },
                          height: "calc(100% - 10px)",
                        }}
                      >
                        <Box
                          position="relative"
                          style={{
                            height: isMobile ? "200px" : `calc(100% - 100px)`,
                          }}
                        >
                          {item.thumbnail ? (
                            <CardMedia
                              component="img"
                              image={item.thumbnail}
                              alt={item.title}
                              height={`100%`}
                              sx={{
                                borderRadius: 1,
                                //objectFit: "fill",
                              }}
                            />
                          ) : (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              bgcolor="lightgray"
                              borderRadius={1}
                              width="100%"
                            >
                              <ImageOutlinedIcon
                                style={{ marginRight: "8px", color: "gray" }}
                              />
                              <Typography variant="body2" color="gray">
                                이미지 준비 중
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <CardContent>
                          <Box display="flex" flexDirection="column">
                            <Box
                              display="flex"
                              flexDirection="row"
                              alignItems="flex_start"
                              flexWrap="nowrap"
                              justifyContent="space-between"
                              width={"100%"}
                            >
                              <Typography
                                component="div"
                                fontWeight={600}
                                sx={{
                                  fontSize: "13px",
                                  color: "#6a68ba",
                                }}
                              >
                                {
                                  typesData.find(
                                    (type) => type.sub_code === item.category
                                  )?.code_name
                                }
                              </Typography>
                            </Box>
                            <Box
                              display="flex"
                              alignItems="center"
                              flexShrink={0}
                            >
                              <Typography
                                component="div"
                                fontWeight={600}
                                sx={{
                                  fontSize: "17px",
                                  display: "block",
                                  maxWidth: "100%",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis", // 잘린 부분에 줄임표 표시
                                }}
                              >
                                {item.title}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </GridContainer>
                  </SwiperSlide>
                ))}
              </Swiper>
            </GridContainerWrap>
            <GridContainerWrap height={"50%"}>
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
                    questionDataState
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
                    cell={QnAStateCell}
                  />
                </Grid>
              </GridContainer>
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
                    projectDataState
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
                    meetingDataState
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
      {noticeWindowVisible && (
        <NoticeWindow
          setVisible={setNoticeWindowVisible}
          current={currentPopup}
          data={noticeDataResult}
          setPara={() => setCurrentPopup(currentPopup + 1)}
          modal={true}
        />
      )}
    </>
  );
};

export default Main;
