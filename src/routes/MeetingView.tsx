import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  DatePicker,
  DatePickerChangeEvent,
} from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { Splitter, SplitterOnChangeEvent } from "@progress/kendo-react-layout";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  ButtonContainer,
  FilterBox,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  Title,
  TitleContainer,
} from "../CommonStyled";
import CenterCell from "../components/Cells/CenterCell";
import {
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  extractDownloadFilename,
  getDeviceHeight,
  getHeight,
  handleKeyPressSearch,
  toDate,
} from "../components/CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import FilterContainer from "../components/FilterContainer";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import SignWindow from "../components/Windows/CommonWindows/SignWindow";
import { useApi } from "../hooks/api";
import { filterValueState, isLoading, titles } from "../store/atoms";
import { TEditorHandle } from "../store/types";

const DATA_ITEM_KEY = "meetingnum";

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;

const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [meetingnum, setMeetingnum] = useState(""); //Detail 조회조건
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);
  const history = useHistory();
  const location = useLocation();
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [signWindowVisible, setSignWindowVisible] = useState<boolean>(false);
  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: DatePickerChangeEvent | InputChangeEvent) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const search = () => {
    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isFetch: true,
      isReset: true,
    }));
    if (swiper && isMobile) {
      swiper.slideTo(0);
    }
  };
  const [title, setTitle] = useRecoilState(titles);
  const [swiper, setSwiper] = useState<SwiperCore>();

  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [mobileheight4, setMobileHeight4] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".ButtonContainer4");
    height5 = getHeight(".FormBoxWrap");
    height6 = getHeight(".TitleContainer");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height - height6);
      setMobileHeight2(getDeviceHeight(true) - height2 - height6);
      setMobileHeight3(getDeviceHeight(true) - height3 - height6);
      setMobileHeight4(getDeviceHeight(true) - height4 - height6);

      setWebHeight(getDeviceHeight(true) - height - height2 - height6);
      setWebHeight2(getDeviceHeight(false) - height3 - height5 - height6 - 2);
      setWebHeight3(getDeviceHeight(false) - height4 - height6);
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3]);

  const idGetter = getter(DATA_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const defaultDetailData = {
    orgdiv: "",
    meetingnum: "",
    attdatnum: "",
    files: "",
  };
  const [detailData, setDetailData] = useState(defaultDetailData);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  //메인 그리드 선택 이벤트 => 디테일 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setDetailData({
      meetingnum: selectedRowData[DATA_ITEM_KEY],
      orgdiv: selectedRowData.orgdiv,
      attdatnum: selectedRowData.attdatnum,
      files: selectedRowData.files,
    });

    const id = selectedRowData["orgdiv"] + "_" + selectedRowData["meetingnum"];
    setMeetingnum(id);
    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (!filters.isFetch && chkScrollHandler(event, filters.pgNum, PAGE_SIZE))
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: prev.pgNum + 1,
      }));
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const docEditorRef = useRef<TEditorHandle>(null);
  const refEditorRef = useRef<TEditorHandle>(null);

  let fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 14); // 시작일 설정

  type TFilters = {
    fromDate: Date;
    toDate: Date;
    custnm: string;
    contents: string;
    findRowValue: string;
    isFetch: boolean;
    isReset: boolean;
    pageSize: number;
    pgNum: number;
  };
  const [filters, setFilters] = useState<TFilters>({
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    contents: "",
    findRowValue: "",
    isFetch: true, // 조회여부 초기값
    isReset: true, // 리셋여부 초기값
    pageSize: PAGE_SIZE,
    pgNum: 1,
  });

  const fetchGrid = async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&custnm=${
        filters.custnm
      }&contents=${filters.contents}&findRowValue=${
        filters.findRowValue
      }&page=${filters.pgNum}&pageSize=${filters.pageSize}`,
    };

    try {
      data = await processApi<any>("meeting-list", para);
    } catch (error) {
      data = null;
    }

    setLoading(false);

    if (data != null) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (filters.findRowValue !== "") {
          // 데이터 저장 후 조회
          setSelectedState({ [filters.findRowValue]: true });
          const selectedRowData = rows.find(
            (row: any) => row[DATA_ITEM_KEY] === filters.findRowValue
          );
          const id =
            selectedRowData["orgdiv"] + "_" + selectedRowData["meetingnum"];

          setMeetingnum(id);
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });
        } else if (filters.isReset) {
          // 일반 데이터 조회
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });

          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });

          const id = firstRowData["orgdiv"] + "_" + firstRowData["meetingnum"];

          setMeetingnum(id);
          setDetailData({
            meetingnum: firstRowData[DATA_ITEM_KEY],
            orgdiv: firstRowData.orgdiv,
            attdatnum: firstRowData.attdatnum,
            files: firstRowData.files,
          });
        } else {
          // 스크롤하여 다른 페이지 조회
          setMainDataResult((prev) => {
            return {
              data: [...prev.data, ...rows],
              total: totalRowCnt == -1 ? 0 : totalRowCnt,
            };
          });
        }
      } else {
        // 결과 행이 0인 경우 데이터 리셋
        setMeetingnum("");
        setMainDataResult(process([], mainDataState));
        resetDetailData();
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  // 상세정보 초기화
  const resetDetailData = () => {
    setDetailData({ ...defaultDetailData });

    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor({ document: "", reference: "" });
  };

  const setHtmlOnEditor = ({
    document,
    reference,
  }: {
    document: string;
    reference: string;
  }) => {
    if (refEditorRef.current) {
      refEditorRef.current.updateEditable(true);
      refEditorRef.current.setHtml(reference);
      refEditorRef.current.updateEditable(false);
    }
    if (docEditorRef.current) {
      docEditorRef.current.updateEditable(true);
      docEditorRef.current.setHtml(document);
      docEditorRef.current.updateEditable(false);
    }
  };
  const fetchDetail = async () => {
    let data: any;
    setLoading(true);

    const para = {
      para: meetingnum,
      doc: true,
    };

    try {
      data = await processApi<any>("meeting-detail", para);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.result.isSuccess === true) {
      const document = data.document;
      const reference = data.reference;

      setHtmlOnEditor({ document, reference });
    } else {
      console.log("[에러발생]");
      console.log(data);

      setHtmlOnEditor({ document: "", reference: "" });
    }
    setLoading(false);
  };

  const downloadDoc = async () => {
    let response: any;
    setLoading(true);

    if (mainDataResult.total == 0) {
      alert("데이터가 없습니다.");
    } else {
      const id = detailData.orgdiv + "_" + detailData.meetingnum;
      const para = {
        para: "doc?type=Meeting&id=" + id,
      };

      try {
        response = await processApi<any>("doc-download", para);
      } catch (error) {
        response = null;
      }

      if (response !== null) {
        const blob = new Blob([response.data]);
        // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다.
        // const blob = new Blob([this.content], {type: 'text/plain'})

        // blob을 사용해 객체 URL을 생성합니다.
        const fileObjectUrl = window.URL.createObjectURL(blob);

        // blob 객체 URL을 설정할 링크를 만듭니다.
        const link = document.createElement("a");
        link.href = fileObjectUrl;
        link.style.display = "none";

        // 다운로드 파일 이름을 지정 할 수 있습니다.
        // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.
        let name = extractDownloadFilename(response);
        let datas = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];
        link.download = name.replace("회의록", datas.title);
        // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (filters.isFetch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);

      // 기본값으로 세팅
      setFilters((prev) => ({
        ...prev,
        isFetch: false,
        isReset: false,
        findRowValue: "",
      }));

      // 그리드 조회
      fetchGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          isFetch: true,
          isReset: true,
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("회의록 열람");
    }
  }, []);

  useEffect(() => {
    // 메인 그리드에서 클릭하여 오픈시 조회조건 재설정하여 조회
    if (filterValue.type === "meeting" && localStorage.getItem("accessToken")) {
      const isExceedFromDate =
        convertDateToStr(fromDate) > filterValue.dataItem.recdt;

      const newFromDate = toDate(filterValue.dataItem.recdt) ?? fromDate;

      setFilters((prev) => ({
        ...prev,
        fromDate: isExceedFromDate ? newFromDate : fromDate,
        isFetch: true,
        isReset: true,
        findRowValue: filterValue.dataItem[DATA_ITEM_KEY],
      }));

      setFilterValue({ type: null, dataItem: {} });
    }
  }, [filterValue]);

  useEffect(() => {
    if (meetingnum !== "" && localStorage.getItem("accessToken")) {
      fetchDetail();
    }
  }, [meetingnum]);

  useEffect(() => {
    setTitle("회의록 열람");
  }, []);

  const getAttachmentsData = (data: any) => {
    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.length > 0 ? data[0].attdatnum : prev.attdatnum,
      files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };
  const [panes, setPanes] = useState<Array<any>>([
    { size: "25%", min: "20px", collapsible: true },
    {},
    { size: "25%", min: "20px", collapsible: true },
  ]);

  const onChange = (event: SplitterOnChangeEvent) => {
    setPanes(event.newState);
  };
  return (
    <>
      <TitleContainer className="TitleContainer">
        {!isMobile ? "" : <Title>회의록 열람</Title>}
        <ButtonContainer>
          { isMobile && (
            <Button onClick={search} icon="search" themeColor={"primary"}>
              조회
            </Button>
          )}
          <Button
            icon={"file-word"}
            name="meeting"
            onClick={downloadDoc}
            themeColor={"primary"}
            fillMode={"outline"}
          >
            다운로드
          </Button>
        </ButtonContainer>
      </TitleContainer>
      {isMobile ? (
        <>
          <FilterContainer>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>회의일</th>
                  <td>
                    <div className="filter-item-wrap">
                      <DatePicker
                        name="fromDate"
                        value={filters.fromDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                      />
                      ~
                      <DatePicker
                        name="toDate"
                        value={filters.toDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                      />
                    </div>
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
              </tbody>
            </FilterBox>
          </FilterContainer>
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
                    요약정보
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
                  style={{ height: mobileheight }}
                  data={process(
                    mainDataResult.data.map((row) => ({
                      ...row,
                      recdt: dateformat2(row.recdt),
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
                  onScroll={onMainScrollHandler}
                  //정렬기능
                  sortable={true}
                  onSortChange={onMainSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  <GridColumn
                    field="recdt"
                    title="회의일"
                    width={100}
                    cell={CenterCell}
                    footerCell={mainTotalFooterCell}
                  />
                  <GridColumn field="custnm" title="업체" width={120} />
                  <GridColumn field="title" title="제목" width={300} />
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
                    기본정보
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
                </GridTitleContainer>
                <FormBoxWrap
                  border
                  className="FormBoxWrap"
                  style={{ height: mobileheight2, overflow: "auto" }}
                >
                  <FormBox>
                    <tbody>
                      <tr>
                        <th>회의록 번호</th>
                        <td>
                          <Input
                            name="meetingnum"
                            value={detailData.meetingnum}
                            className="readonly"
                          />
                        </td>
                        <th>제목</th>
                        <td>
                          <Input
                            name="name"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].title
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>
                          <Button
                            themeColor={"primary"}
                            style={{ width: "100%" }}
                            onClick={() => {
                              if (
                                Object.getOwnPropertyNames(selectedState)[0] !=
                                undefined
                              ) {
                                setSignWindowVisible(true);
                              } else {
                                alert("선택된 데이터가 없습니다.");
                              }
                            }}
                          >
                            참석자 등록
                          </Button>
                        </td>
                        <th style={{ width: 0 }}>첨부파일</th>
                        <td style={{ width: "auto" }}>
                          <div className="filter-item-wrap">
                            <Input
                              name="attachment_q"
                              value={detailData.files}
                              className="readonly"
                            />
                            <Button
                              icon="more-horizontal"
                              fillMode={"flat"}
                              onClick={() => setAttachmentsWindowVisible(true)}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
              </GridContainer>
            </SwiperSlide>
            <SwiperSlide key={2}>
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
                  상세정보
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-right"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(3);
                      }
                    }}
                  ></Button>
                </GridTitle>
              </GridTitleContainer>
              <div style={{ height: mobileheight3 }}>
                <RichEditor id="docEditor" ref={docEditorRef} hideTools />
              </div>
            </SwiperSlide>
            <SwiperSlide key={3}>
              <GridContainer style={{ width: "100%" }}>
                <GridTitleContainer className="ButtonContainer4">
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
                    참고자료
                  </GridTitle>
                </GridTitleContainer>
                <div style={{ height: mobileheight4 }}>
                  <RichEditor id="refEditor" ref={refEditorRef} hideTools />
                </div>
              </GridContainer>
            </SwiperSlide>
          </Swiper>
        </>
      ) : (
        <GridContainerWrap>
          <Splitter
            panes={panes}
            onChange={onChange}
            style={{ borderColor: "#00000000" }}
          >
            <div className="pane-content">
              <GridContainer>
                <GridTitleContainer className="ButtonContainer">
                  <GridTitle>조회조건</GridTitle>
                  <Button onClick={search} icon="search" themeColor={"primary"}>
                    조회
                  </Button>
                </GridTitleContainer>
                <FilterContainer>
                  <FilterBox
                    onKeyPress={(e) => handleKeyPressSearch(e, search)}
                  >
                    <tbody>
                      <tr>
                        <th>회의일</th>
                        <td>
                          <div className="filter-item-wrap">
                            <DatePicker
                              name="fromDate"
                              value={filters.fromDate}
                              format="yyyy-MM-dd"
                              onChange={filterInputChange}
                              placeholder=""
                            />
                            ~
                            <DatePicker
                              name="toDate"
                              value={filters.toDate}
                              format="yyyy-MM-dd"
                              onChange={filterInputChange}
                              placeholder=""
                            />
                          </div>
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
                    </tbody>
                  </FilterBox>
                </FilterContainer>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer2">
                    <GridTitle>요약정보</GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: webheight }}
                    data={process(
                      mainDataResult.data.map((row) => ({
                        ...row,
                        recdt: dateformat2(row.recdt),
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
                    onScroll={onMainScrollHandler}
                    //정렬기능
                    sortable={true}
                    onSortChange={onMainSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                  >
                    <GridColumn
                      field="recdt"
                      title="회의일"
                      width={100}
                      cell={CenterCell}
                      footerCell={mainTotalFooterCell}
                    />
                    <GridColumn field="custnm" title="업체" width={120} />
                    <GridColumn field="title" title="제목" width={300} />
                  </Grid>
                </GridContainer>
              </GridContainer>
            </div>
            <div className="pane-content">
              <GridContainer>
                <GridTitleContainer className="ButtonContainer3">
                  <GridTitle>회의록</GridTitle>
                </GridTitleContainer>
                <FormBoxWrap border className="FormBoxWrap">
                  <FormBox>
                    <tbody>
                      <tr>
                        <th>회의록 번호</th>
                        <td>
                          <Input
                            name="meetingnum"
                            value={detailData.meetingnum}
                            className="readonly"
                          />
                        </td>
                        <th>제목</th>
                        <td>
                          <Input
                            name="name"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].title
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>
                          <Button
                            themeColor={"primary"}
                            style={{ width: "100%" }}
                            onClick={() => {
                              if (
                                Object.getOwnPropertyNames(selectedState)[0] !=
                                undefined
                              ) {
                                setSignWindowVisible(true);
                              } else {
                                alert("선택된 데이터가 없습니다.");
                              }
                            }}
                          >
                            참석자 등록
                          </Button>
                        </td>
                        <th style={{ width: 0 }}>첨부파일</th>
                        <td style={{ width: "auto" }}>
                          <div className="filter-item-wrap">
                            <Input
                              name="attachment_q"
                              value={detailData.files}
                              className="readonly"
                            />
                            <Button
                              icon="more-horizontal"
                              fillMode={"flat"}
                              onClick={() => setAttachmentsWindowVisible(true)}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <div style={{ height: webheight2 }}>
                  <RichEditor id="docEditor" ref={docEditorRef} hideTools />
                </div>
              </GridContainer>
            </div>
            <div className="pane-content">
              <GridContainer>
                <GridTitleContainer className="ButtonContainer4">
                  <GridTitle>참고자료</GridTitle>
                </GridTitleContainer>
                <div style={{ height: webheight3 }}>
                  <RichEditor id="refEditor" ref={refEditorRef} hideTools />
                </div>
              </GridContainer>
            </div>
          </Splitter>
        </GridContainerWrap>
      )}
      {signWindowVisible && (
        <SignWindow
          setVisible={setSignWindowVisible}
          reference_key={detailData.orgdiv + "_" + detailData.meetingnum}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          type="meeting"
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={detailData.attdatnum}
          permission={{ upload: false, download: true, delete: false }}
          modal={true}
        />
      )}
    </>
  );
};
export default App;
