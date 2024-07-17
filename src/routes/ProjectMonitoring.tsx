import { DataResult, State, process } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridPageChangeEvent,
} from "@progress/kendo-react-grid";
import { Checkbox, Input, RadioButton } from "@progress/kendo-react-inputs";
import { Splitter, SplitterOnChangeEvent } from "@progress/kendo-react-layout";
import {
  ListView,
  ListViewFooter,
  ListViewItemProps,
} from "@progress/kendo-react-listview";
import { bytesToBase64 } from "byte-base64";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { useHistory, useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  InfoTitle,
  Title,
  TitleContainer,
} from "../CommonStyled";
import DateCell from "../components/Cells/DateCell";
import ProgressCell from "../components/Cells/ProgressCell";
import {
  UseBizComponent,
  UseParaPc,
  convertDateToStr,
  dateformat3,
  getDeviceHeight,
  getHeight,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import { PAGE_SIZE } from "../components/CommonString";
import { useApi } from "../hooks/api";
import {
  isFilterHideState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";
import { dateTypeColumns } from "../store/columns/common-columns";
import { Iparameters } from "../store/types";
import BizComponentRadioGroup from "../components/RadioGroups/BizComponentRadioGroup";
import CustomMultiColumnComboBox from "../components/ComboBoxes/CustomMultiColumnComboBox";
import FilterContainer from "../components/FilterContainer";
const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;
const statusQueryStr = `
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;
const datetypeQueryStr = `SELECT 'A' as code, '사업시작일(계약일)' as name
UNION ALL
SELECT 'B' as code, '완료일' as name
UNION ALL
SELECT 'C' as code, '중간점검일' as name
UNION ALL
SELECT 'D' as code, '최종점검일' as name
UNION ALL
SELECT 'E' as code, '사업종료일' as name
UNION ALL
SELECT '%' as code, '전체' as name`;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;

var index = 0;

const ProjectMonitoring: React.FC = () => {
  const [swiper, setSwiper] = useState<SwiperCore>();
  const setLoading = useSetRecoilState(isLoading);
  let deviceHeight = document.documentElement.clientHeight;
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const processApi = useApi();
  const [title, setTitle] = useRecoilState(titles);
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [labelwidth, setLabelwidth] = useState(0);
  const [bizComponentData, setBizComponentData] = useState<any>(null);
  const history = useHistory();
  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [isFilterHideStates, setIsFilterHideStates] =
    useRecoilState(isFilterHideState);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".TitleContainer");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height4);
      setMobileHeight2(getDeviceHeight(true) - height2 - height4);
      setWebHeight(getDeviceHeight(true) - height - height4 - 42);
      setWebHeight2(getDeviceHeight(true) - height - height3 - height4);
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2]);

  useEffect(() => {
    // 접근 권한 검증
    if (loginResult) {
      const role = loginResult ? loginResult.role : "";
      const isAdmin = role === "ADMIN";

      if (!isAdmin && localStorage.getItem("accessToken")) {
        alert("접근 권한이 없습니다.");
        history.goBack();
      }
    }
  }, [loginResult]);

  UseBizComponent(
    "R_YN",
    //완료여부,
    setBizComponentData
  );

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isFetch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });
  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [statusData, setStateData] = useState<any[]>([]);
  const [dateTypeData, setDateTypeData] = useState<any[]>([]);

  const [panes, setPanes] = useState<Array<any>>([
    { size: "38%", min: "0px", collapsible: true },
    {},
  ]);
  const [isPanesResized, setIsPanesResized] = useState(false);

  useLayoutEffect(() => {
    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setIsPanesResized(panes[0].size.replace("%", "") < 38);
      setLabelwidth(
        !isPanesResized
          ? (deviceWidth * panes[0].size.replace("%", "")) / 100 - 420
          : (deviceWidth * panes[0].size.replace("%", "")) / 100 - 120
      );
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [panes]);

  const onChange = (event: SplitterOnChangeEvent) => {
    setPanes(event.newState);
  };

  let fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 1);

  const [filters, setFilters] = useState({
    work_type: "list",
    date_type: { code: "%", name: "전체" },
    from_date: fromDate,
    to_date: new Date(),
    customer_code: "%",
    customer_name: "",
    pjt_person: "%",
    status: [{ code: "N", name: "미완료" }],
    project: "",
    progress_status: "%",
    progress_fin: "%",
    find_row_value: "",
    devmngnum: "%",
    isSearch: true, // 조회여부 초기값
    pageSize: PAGE_SIZE,
    pgNum: 1,
  });

  const [detailFilters, setDetailFilters] = useState({
    work_type: "detail",
    date_type: { code: "%", name: "전체" },
    from_date: "19000101",
    to_date: new Date(),
    customer_code: "%",
    customer_name: "%",
    pjt_person: "%",
    status: [{ code: "N", name: "미완료" }],
    project: "%",
    progress_status: "%",
    progress_fin: "%",
    find_row_value: "",
    devmngnum: "%",
    isSearch: true, // 조회여부 초기값
    pageSize: PAGE_SIZE,
    pgNum: 1,
  });

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

  const getUserNameById = (userId: string) => {
    const user = usersData.find((user) => user.user_id === userId);
    return user ? user.user_name : "";
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

  const fetchDateType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(datetypeQueryStr));

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
      setDateTypeData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;
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
      status: [...values],
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

  //조회조건 Radio Group Change 함수 => 사용자가 선택한 라디오버튼 값을 조회 파라미터로 세팅
  const filterRadioChange = (e: any) => {
    const { name, value } = e;

    setDetailFilters((prev) => ({
      ...prev,
      [name]: value,
      isSearch: true,
    }));
  };

  // 조회
  const search = () => {
    if (
      filters.date_type == null ||
      filters.progress_status == null ||
      convertDateToStr(filters.from_date) == "" ||
      convertDateToStr(filters.to_date) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        find_row_value: "",
        isSearch: true,
      }));
    }

    if (isMobile && swiper) {
      swiper.slideTo(0);
      setIsFilterHideStates(true);
    }
  };

  const resetAll = () => {
    setMainDataResult(process([], mainDataState));
    setDetailDataResult(process([], detailDataState));
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  //그리드 데이터 조회(기본)
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length === 0
        ? "%" // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : "%"; //  2개 이상 선택시 => 전체

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_project_monitoring",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.work_type,
        "@p_date_type": filters.date_type.code,
        "@p_from_date": convertDateToStr(filters.from_date),
        "@p_to_date": convertDateToStr(filters.to_date),
        "@p_customer_code": filters.customer_code,
        "@p_customer_name": filters.customer_name,
        "@p_pjt_person": filters.pjt_person,
        "@p_status": status,
        "@p_project": filters.project,
        "@p_progress_status": filters.progress_status,
        "@p_progress_fin": filters.progress_fin,
        "@p_find_row_value": filters.find_row_value,
        "@p_devmngnum": filters.devmngnum,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;
      if (totalRowCnt > 0) {
        setMainDataResult((prev) => ({
          ...prev,
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        }));
        setDetailFilters((prev) => ({
          ...prev,
          devmngnum: rows[0].devmngnum,
          isSearch: true,
        }));
        setSelectedItemId(rows[0].devmngnum);
      } else {
        resetAll();
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
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  //그리드 데이터 조회(상세)
  const fetchDetailGrid = async (detailFilters: any) => {
    let data: any;
    setLoading(true);
    const status =
      filters.status.length === 0
        ? "%" // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : "%"; //  2개 이상 선택시 => 전체
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_project_monitoring",
      pageNumber: detailFilters.pgNum,
      pageSize: detailFilters.pgSize,
      parameters: {
        "@p_work_type": detailFilters.work_type,
        "@p_date_type": filters.date_type.code,
        "@p_from_date": filters.from_date,
        "@p_to_date": filters.to_date,
        "@p_customer_code": filters.customer_code,
        "@p_customer_name": filters.customer_name,
        "@p_pjt_person": filters.pjt_person,
        "@p_status": status,
        "@p_project": filters.project,
        "@p_progress_status": detailFilters.progress_status,
        "@p_progress_fin": detailFilters.progress_fin,
        "@p_find_row_value": filters.find_row_value,
        "@p_devmngnum": detailFilters.devmngnum,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      setDetailDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });
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
    if (filters.isSearch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (detailFilters.isSearch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(detailFilters);
      setDetailFilters((prev) => ({
        ...prev,
        find_row_value: "",
        isSearch: false,
      })); // 한번만 조회되도록
      fetchDetailGrid(deepCopiedFilters);
    }
  }, [detailFilters]);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      fetchUsers();
      fetchstatus();
      fetchDateType();
      fetchMainGrid(filters);
      fetchDetailGrid(detailFilters);

      setTitle("프로젝트 모니터링");
    }
  }, []);

  // 프로젝트 일정계획으로 이동
  const handleButtonClick = (devmngnum: string) => {
    history.push(`/ProjectSchedule?projectNumber=${devmngnum}`);
  };

  // 프로젝트 마스터로 이동
  const handleButtonClick2 = (devmngnum: string) => {
    history.push(`/ProjectMaster?projectNumber=${devmngnum}`);
  };

  // 체크박스 셀
  const CheckboxCell = (props: {
    onChange?: any;
    dataItem?: any;
    field?: any;
  }) => {
    const { dataItem, field } = props;

    const handleChange = (event: { value: any; syntheticEvent: any }) => {
      dataItem[field] = event.value;
      props.onChange({
        dataItem,
        field,
        syntheticEvent: event.syntheticEvent,
        value: event.value,
      });
    };

    return (
      <td style={{ textAlign: "center" }}>
        <Checkbox checked={dataItem[field]} onChange={handleChange} />
      </td>
    );
  };

  // 리스트 헤더
  // const MyHeader = () => {
  //   return (
  //     <ListViewHeader
  //       style={{ color: "rgb(160, 160, 160)", fontSize: 14 }}
  //       className="pl-3 pb-2 pt-2"
  //     >
  //       Contact list
  //     </ListViewHeader>
  //   );
  // };

  // 리스트 푸터
  const MyFooter = () => {
    return (
      <ListViewFooter
        style={{
          // color: "rgb(160, 160, 160)",
          fontSize: 14,
          justifyContent: "right",
          fontWeight: "bold",
          padding: "5px 0 0 5px",
        }}
        className="pl-3 pb-2 pt-2"
      >
        총 {mainDataResult.total}건
      </ListViewFooter>
    );
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = detailDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {detailDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };
  const [currentSlide, setCurrentSlide] = useState(0);
  const handleSlideChange = () => {
    if (swiper) {
      setCurrentSlide(swiper.activeIndex);
    }
  };

  // 리스트 클릭 이벤트
  const handleItemClick = (e: { item: any }) => {
    const { item } = e;
    setSelectedItemId(item.devmngnum);
    setDetailFilters((prev) => ({
      ...prev,
      devmngnum: item.devmngnum,
      isSearch: true,
    }));
    if (isMobile && swiper) {
      swiper.slideTo(1);
    }
  };

  // 리스트 item
  const MyItemRender = (props: ListViewItemProps) => {
    let item = props.dataItem;
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsOverflowing(item.project.length > 20);

      // 컴포넌트가 마운트된 후에 상태를 업데이트
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 100); // 100ms 후에 마운트 상태로 변경

      return () => clearTimeout(timer);
    }, [item.project]);

    return (
      <div
        onClick={() => handleItemClick({ item })}
        className="k-listview-item row p-2 border-bottom align-middle"
        style={{
          margin: 0,
          backgroundColor:
            selectedItemId === item.devmngnum ? "#D3E5FF" : "#ECF1F9",
          padding: "7px",
          borderRadius: "5px",
          marginBottom: "10px",
          marginRight: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          flexDirection: !isPanesResized && !isMobile ? "row" : "column",
          cursor: "pointer",
        }}
      >
        <div style={{ paddingRight: "10px" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "black",
              marginBottom: 0,
            }}
          >
            <span>{item.custnm}</span>
            <span
              style={{ fontSize: 15, color: "#a0a0a0", paddingLeft: "3px" }}
            >
              {getUserNameById(item.pjtmanager)} {" / "}
              {getUserNameById(item.pjtperson)}
            </span>
          </div>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: labelwidth,
            }}
          >
            {isMounted && isOverflowing ? (
              <Marquee
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: "#454545",
                  marginBottom: 0,
                  paddingRight: "10%",
                }}
                delay={1}
                gradient={false}
              >
                <span style={{ marginRight: "50px" }}>{item.project}</span>
              </Marquee>
            ) : (
              <div
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: "#454545",
                  marginBottom: 0,
                  paddingRight: "10%",
                }}
              >
                {item.project}
              </div>
            )}
          </div>
          <div style={{ fontSize: 15, color: "#a0a0a0" }}>
            {dateformat3(item.cotracdt)} - {dateformat3(item.midchkdt)} -
            {dateformat3(item.finexpdt)}
          </div>
        </div>

        <div style={{ alignContent: "center" }}>
          <div
            style={{
              paddingTop: "5px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#454545",
                  fontSize: "15px",
                  fontWeight: "bold",
                  justifyContent: "center",
                }}
              >
                S/W
              </div>
              <div
                style={{
                  backgroundColor: item.swcolor,
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "27px",
                  fontWeight: "bold",
                  padding: "5px",
                  borderRadius: "7px",
                  width: "90px",
                  marginBottom: "5px",
                }}
              >
                {item.swcount}%
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#454545",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                H/W
              </div>
              <div
                style={{
                  backgroundColor: item.hwcolor,
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "27px",
                  fontWeight: "bold",
                  padding: "5px",
                  borderRadius: "7px",
                  width: "90px",
                }}
              >
                {item.hwcount}%
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#454545",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                I/F
              </div>
              <div
                style={{
                  backgroundColor: item.ifcolor,
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "27px",
                  fontWeight: "bold",
                  padding: "5px",
                  borderRadius: "7px",
                  width: "90px",
                }}
              >
                {item.ifcount}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!isMobile ? (
        <>
          <TitleContainer className="TitleContainer">
            <ButtonContainer>
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
            </ButtonContainer>
          </TitleContainer>
          <GridTitleContainer className="ButtonContainer">
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
        </>
      ) : (
        <>
          <TitleContainer className="TitleContainer">
            <Title>프로젝트 모니터링</Title>
            <ButtonContainer>
              {currentSlide === 1 && (
                <>
                  <Button
                    icon="redo"
                    themeColor={"primary"}
                    fillMode={"outline"}
                    onClick={() => handleButtonClick(detailFilters.devmngnum)}
                  >
                    프로젝트 일정계획
                  </Button>
                  <Button
                    icon="redo"
                    themeColor={"primary"}
                    fillMode={"outline"}
                    onClick={() => handleButtonClick2(detailFilters.devmngnum)}
                  >
                    프로젝트 마스터
                  </Button>
                </>
              )}
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
            </ButtonContainer>
          </TitleContainer>
        </>
      )}

      <FilterContainer>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>기간</th>
              <td colSpan={3}>
                <div className="filter-item-wrap">
                  <CustomMultiColumnComboBox
                    name="date_type"
                    data={dateTypeData}
                    value={filters.date_type}
                    columns={dateTypeColumns}
                    textField={"name"}
                    onChange={filterComboBoxChange}
                    className="required"
                    filterable={true}
                  />
                  <DatePicker
                    name="from_date"
                    value={filters.from_date}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                    className="required"
                  />
                  ~
                  <DatePicker
                    name="to_date"
                    value={filters.to_date}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                    className="required"
                  />
                </div>
              </td>
              <th>완료여부</th>
              <td>
                <MultiSelect
                  name="status"
                  data={statusData}
                  onChange={filterMultiSelectChange}
                  value={filters.status}
                  textField="name"
                  dataItemKey="code"
                />
              </td>
              <th>업체명</th>
              <td>
                <Input
                  name="customer_name"
                  type="text"
                  value={filters.customer_name}
                  onChange={filterInputChange}
                />
              </td>
              <th>프로젝트명</th>
              <td>
                <Input
                  name="project"
                  type="text"
                  value={filters.project}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterContainer>
      {isMobile ? (
        <Swiper
          onSwiper={(swiper) => {
            setSwiper(swiper);
          }}
          onActiveIndexChange={handleSlideChange}
        >
          <SwiperSlide key={0}>
            {mainDataResult.total === 0 ? (
              <InfoTitle style={{ padding: "20px" }}>
                조회 결과가 없습니다.
              </InfoTitle>
            ) : (
              <>
                <ListView
                  data={mainDataResult.data}
                  item={MyItemRender}
                  style={{
                    height: mobileheight,
                    overflow: "auto",
                    marginTop: "8px",
                    width: "100%",
                  }}
                  // header={MyHeader}
                  footer={MyFooter}
                />
              </>
            )}
          </SwiperSlide>
          <SwiperSlide key={1}>
            <GridTitleContainer
              className="ButtonContainer2"
              style={{ justifyContent: "space-between" }}
            >
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
              {bizComponentData !== null && (
                <BizComponentRadioGroup
                  name="progress_fin"
                  value={detailFilters.progress_fin}
                  bizComponentId="R_YN"
                  bizComponentData={bizComponentData}
                  changeData={filterRadioChange}
                />
              )}
            </GridTitleContainer>

            <GridContainer>
              <Grid
                style={{ height: mobileheight2, width: "100%" }}
                data={process(
                  detailDataResult.data.map((row) => ({
                    ...row,
                    useyn:
                      row.useyn == "Y"
                        ? true
                        : row.useyn == "N"
                        ? false
                        : row.useyn,
                    CustSignyn:
                      row.CustSignyn == "Y"
                        ? true
                        : row.CustSignyn == "N"
                        ? false
                        : row.CustSignyn,
                    findt: row.findt == "19000101" ? "" : row.findt,
                    chkdt: row.findt == "19000101" ? "" : row.chkdt,
                    indicator: getUserNameById(row.indicator),
                    devperson: getUserNameById(row.devperson),
                    chkperson: getUserNameById(row.chkperson),
                  })),
                  mainDataState
                )}
                {...mainDataState}
                //선택 기능
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                //스크롤 조회 기능
                fixedScroll={true}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
              >
                <GridColumn
                  field="pgmid"
                  title="폼ID"
                  width={120}
                  footerCell={mainTotalFooterCell}
                />
                <GridColumn field="pgmnm" title="메뉴명" width={150} />
                <GridColumn
                  field="prgrate"
                  title="진행률"
                  width={100}
                  className="read-only"
                  cell={ProgressCell}
                />
                <GridColumn field="indicator" title="설계자" width={100} />
                <GridColumn
                  field="DesignStartDate"
                  title="설계시작일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="DesignEndDate"
                  title="설계완료일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn field="devperson" title="개발담당자" width={100} />
                <GridColumn
                  field="devstrdt"
                  title="개발시작일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="finexpdt"
                  title="완료예정일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="findt"
                  title="완료일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn field="chkperson" title="확인담당자" width={100} />
                <GridColumn
                  field="chkdt"
                  title="확인일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="useyn"
                  title="사용여부"
                  width={80}
                  cell={CheckboxCell}
                />
                <GridColumn field="remark" title="비고" width={200} />
              </Grid>
            </GridContainer>
          </SwiperSlide>
        </Swiper>
      ) : (
        <>
          <GridContainerWrap>
            <Splitter
              panes={panes}
              onChange={onChange}
              style={{ width: "100%", borderColor: "#00000000" }}
            >
              {mainDataResult.total === 0 ? (
                <InfoTitle style={{ padding: "20px" }}>
                  조회 결과가 없습니다.
                </InfoTitle>
              ) : (
                <>
                  <GridTitleContainer className="ButtonContainer2">
                    <GridTitle>기본정보</GridTitle>
                  </GridTitleContainer>
                  <ListView
                    data={mainDataResult.data}
                    item={MyItemRender}
                    style={{
                      height: webheight,
                      overflow: "auto",
                      marginTop: "8px",
                      width: "100%",
                    }}
                    // header={MyHeader}
                    footer={MyFooter}
                  />
                </>
              )}
              <GridContainer>
                <GridTitleContainer
                className="ButtonContainer3"
                  style={{
                    justifyContent: "space-between",

                    width: "100%",
                  }}
                >
                  <GridTitleContainer
                    style={{ gap: 15, justifyContent: "flex-start" }}
                  >
                    <GridTitle>상세정보</GridTitle>
                    {bizComponentData !== null && (
                      <BizComponentRadioGroup
                        name="progress_fin"
                        value={detailFilters.progress_fin}
                        bizComponentId="R_YN"
                        bizComponentData={bizComponentData}
                        changeData={filterRadioChange}
                      />
                    )}
                  </GridTitleContainer>
                  <ButtonContainer>
                    <Button
                      icon="redo"
                      themeColor={"primary"}
                      fillMode={"outline"}
                      onClick={() => handleButtonClick(detailFilters.devmngnum)}
                    >
                      프로젝트 일정계획
                    </Button>
                    <Button
                      icon="redo"
                      themeColor={"primary"}
                      fillMode={"outline"}
                      onClick={() =>
                        handleButtonClick2(detailFilters.devmngnum)
                      }
                    >
                      프로젝트 마스터
                    </Button>
                  </ButtonContainer>
                </GridTitleContainer>
                <Grid
                  style={{ height: webheight2 }}
                  data={process(
                    detailDataResult.data.map((row) => ({
                      ...row,
                      useyn:
                        row.useyn == "Y"
                          ? true
                          : row.useyn == "N"
                          ? false
                          : row.useyn,
                      CustSignyn:
                        row.CustSignyn == "Y"
                          ? true
                          : row.CustSignyn == "N"
                          ? false
                          : row.CustSignyn,
                      findt: row.findt == "19000101" ? "" : row.findt,
                      chkdt: row.findt == "19000101" ? "" : row.chkdt,
                      indicator: getUserNameById(row.indicator),
                      devperson: getUserNameById(row.devperson),
                      chkperson: getUserNameById(row.chkperson),
                    })),
                    mainDataState
                  )}
                  {...mainDataState}
                  //선택 기능
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  //정렬기능
                  sortable={true}
                  onSortChange={onMainSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  <GridColumn
                    field="pgmid"
                    title="폼ID"
                    width={120}
                    footerCell={mainTotalFooterCell}
                  />
                  <GridColumn field="pgmnm" title="메뉴명" width={150} />
                  <GridColumn
                    field="prgrate"
                    title="진행률"
                    width={100}
                    className="read-only"
                    cell={ProgressCell}
                  />
                  <GridColumn field="indicator" title="설계자" width={100} />
                  <GridColumn
                    field="DesignStartDate"
                    title="설계시작일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="DesignEndDate"
                    title="설계완료일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="devperson"
                    title="개발담당자"
                    width={100}
                  />
                  <GridColumn
                    field="devstrdt"
                    title="개발시작일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="finexpdt"
                    title="완료예정일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="findt"
                    title="완료일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="chkperson"
                    title="확인담당자"
                    width={100}
                  />
                  <GridColumn
                    field="chkdt"
                    title="확인일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="useyn"
                    title="사용여부"
                    width={80}
                    cell={CheckboxCell}
                  />
                  <GridColumn field="remark" title="비고" width={200} />
                </Grid>
              </GridContainer>
            </Splitter>
          </GridContainerWrap>
        </>
      )}
    </>
  );
};

export default ProjectMonitoring;
