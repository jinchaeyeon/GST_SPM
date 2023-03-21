import React, { useCallback, useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  GridFooterCellProps,
} from "@progress/kendo-react-grid";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
// ES2015 module syntax
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
} from "@progress/kendo-react-scheduler";
import {
  GridContainer,
  GridTitle,
  GridContainerWrap,
  ButtonContainer,
  GridTitleContainer,
  ApprovalInner,
  ApprovalBox,
  MainTopContainer,
  TextContainer,
  MainWorkStartEndContainer,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { useRecoilState } from "recoil";
import { useApi } from "../hooks/api";
import { loginResultState, sessionItemState } from "../store/atoms";
import { Iparameters } from "../store/types";
import {
  chkScrollHandler,
  convertDateToStr,
  UseCustomOption,
  UseGetValueFromSessionItem,
  UseParaPc,
  useGeoLocation,
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import CenterCell from "../components/Cells/CenterCell";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";

const DATA_ITEM_KEY = "datnum";

const Main: React.FC = () => {
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);

  const [sessionItem, setSessionItem] = useRecoilState(sessionItemState);
  const userId = loginResult ? loginResult.userId : "";
  const sessionUserId = UseGetValueFromSessionItem("user_id");
  const geoLocation = useGeoLocation();

  useEffect(() => {
    if (sessionUserId === "") fetchSessionItem();
    // if (token && sessionUserId === "") fetchSessionItem();
  }, [sessionUserId]);

  let sessionOrgdiv = sessionItem.find(
    (sessionItem) => sessionItem.code === "orgdiv"
  )!.value;
  let sessionLocation = sessionItem.find(
    (sessionItem) => sessionItem.code === "location"
  )!.value;

  if (sessionOrgdiv === "") sessionOrgdiv = "01";
  if (sessionLocation === "") sessionLocation = "01";

  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const pathname: string = window.location.pathname.replace("/", "");

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  const [noticeDataState, setNoticeDataState] = useState<State>({
    sort: [],
  });

  const [workOrderDataState, setWorkOrderDataState] = useState<State>({
    sort: [],
  });

  const [noticeDataResult, setNoticeDataResult] = useState<DataResult>(
    process([], noticeDataState)
  );

  const [workOrderDataResult, setWorkOrderDataResult] = useState<DataResult>(
    process([], workOrderDataState)
  );

  type TSchedulerDataResult = {
    id: number;
    title: string;
    start: Date;
    end: Date;
  };
  const [schedulerDataResult, setSchedulerDataResult] = useState<
    TSchedulerDataResult[]
  >([]);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [approvalValueState, setApprovalValueState] = useState({
    app: 0,
    ref: 0,
    rtr: 0,
  });

  const [workTimeDataResult, setWorkTimeDataResult] = useState({
    strtime: "",
    endtime: "",
  });

  const [noticePgNum, setNoticePgNum] = useState(1);
  const [workOrderPgNum, setWorkOrderPgNum] = useState(1);

  const [noticeFilter, setNoticeFilter] = useState({
    pgSize: PAGE_SIZE,
    work_type: "Notice",
    orgdiv: sessionOrgdiv,
    location: sessionLocation,
    user_id: userId,
    frdt: "",
    todt: "",
    ref_date: new Date(),
    ref_key: "N",
  });

  const [workOrderFilter, setWorkOrderFilter] = useState({
    pgSize: PAGE_SIZE,
    work_type: "WorkOrderRequest",
    orgdiv: sessionOrgdiv,
    location: sessionLocation,
    user_id: userId,
    frdt: "",
    todt: "",
    ref_date: new Date(),
    ref_key: "N",
  });

  const [schedulerFilter, setSchedulerFilter] = useState({
    cboSchedulerType: "MY",
    user_id: userId,
  });
  const noticeParameters: Iparameters = {
    procedureName: "sys_sel_default_home_web",
    pageNumber: noticePgNum,
    pageSize: noticeFilter.pgSize,
    parameters: {
      "@p_work_type": noticeFilter.work_type,
      "@p_orgdiv": noticeFilter.orgdiv,
      "@p_location": noticeFilter.location,
      "@p_user_id": noticeFilter.user_id,
      "@p_frdt": noticeFilter.frdt,
      "@p_todt": noticeFilter.todt,
      "@p_ref_date": convertDateToStr(noticeFilter.ref_date),
      "@p_ref_key": noticeFilter.ref_key,
    },
  };

  const workOrderParameters: Iparameters = {
    procedureName: "sys_sel_default_home_web",
    pageNumber: workOrderPgNum,
    pageSize: 50,
    parameters: {
      "@p_work_type": workOrderFilter.work_type,
      "@p_orgdiv": workOrderFilter.orgdiv,
      "@p_location": workOrderFilter.location,
      "@p_user_id": workOrderFilter.user_id,
      "@p_frdt": workOrderFilter.frdt,
      "@p_todt": workOrderFilter.todt,
      "@p_ref_date": convertDateToStr(workOrderFilter.ref_date),
      "@p_ref_key": workOrderFilter.ref_key,
    },
  };

  const approvalParameters: Iparameters = {
    procedureName: "sys_sel_default_home_web",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": "Approval",
      "@p_orgdiv": sessionOrgdiv,
      "@p_location": sessionLocation,
      "@p_user_id": userId,
      "@p_frdt": "",
      "@p_todt": "",
      "@p_ref_date": "",
      "@p_ref_key": "N",
    },
  };

  const schedulerParameters: Iparameters = {
    procedureName: "sys_sel_default_home_web",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": schedulerFilter.cboSchedulerType,
      "@p_orgdiv": sessionOrgdiv,
      "@p_location": sessionLocation,
      "@p_user_id": schedulerFilter.user_id,
      "@p_frdt": "",
      "@p_todt": "",
      "@p_ref_date": "",
      "@p_ref_key": "N",
    },
  };

  const workTimeParameters: Iparameters = {
    procedureName: "P_HM_A1000W_Q",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "time_card",
      "@p_service_id": "",
      "@p_orgdiv": sessionOrgdiv,
      "@p_location": sessionLocation,
      "@p_user_id": userId,
      "@p_frdt": "",
      "@p_todt": "",
      "@p_dutydt": convertDateToStr(new Date()),
    },
  };

  const fetchWorkTime = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", workTimeParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const row = data.tables[0].Rows[0];
      const rowCount = data.tables[0].RowCount;

      if (rowCount > 0) {
        setWorkTimeDataResult({
          strtime: row.start_time,
          endtime: row.end_time,
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  const fetchWorkTimeSaved = async (workType: "start" | "end") => {
    let data: any;
    let lat = 0;
    let lng = 0;

    if (geoLocation.loaded && geoLocation?.coordinates) {
      lat = geoLocation.coordinates?.lat;
      lng = geoLocation.coordinates?.lng;
    }

    console.log(lat, lng);

    const workTimeParaSaved: Iparameters = {
      procedureName: "P_HM_A1000W_S",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": workType,
        "@p_service_id": "",
        "@p_orgdiv": sessionOrgdiv,
        "@p_location": sessionLocation,
        "@p_user_id": userId,
        "@p_frdt": "",
        "@p_todt": "",
        "@p_dutydt": convertDateToStr(new Date()),
        "@p_lat": lat,
        "@p_lng": lng,
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("procedure", workTimeParaSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchWorkTime();
    } else {
      alert(data.resultMessage);
    }
  };

  const fetchApproaval = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", approvalParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      const rowCount = data.tables[0].RowCount;

      if (rowCount > 0) {
        setApprovalValueState((prev) => ({
          ...prev,
          app: rows[0].cnt01,
          ref: rows[0].cnt02,
          rtr: rows[0].cnt03,
        }));
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
  };

  const fetchNoticeGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", noticeParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setNoticeDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    }
  };

  const fetchWorkOrderGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", workOrderParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setWorkOrderDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    }
  };

  const fetchScheduler = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", schedulerParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true && data.tables[0]) {
      let rows = data.tables[0].Rows.map((row: any) => ({
        //...row,
        id: row.datnum,
        title: row.title,
        start: new Date(row.strtime),
        end: new Date(row.endtime),
      }));

      setSchedulerDataResult(rows);
    }
  };

  useEffect(() => {
    if (sessionItem) {
      fetchWorkTime();
      fetchApproaval();
      fetchNoticeGrid();
      fetchWorkOrderGrid();
    }
  }, []);

  useEffect(() => {
    fetchScheduler();
  }, [schedulerFilter]);

  //그리드 리셋
  const resetAllGrid = () => {
    setNoticePgNum(1);
    setWorkOrderPgNum(1);
    setNoticeDataResult(process([], noticeDataState));
    setWorkOrderDataResult(process([], workOrderDataState));
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
    // setNoticeFilter((prev) => ({
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
    // setWorkOrderFilter({
    //   ...workOrderFilter,
    //   lotnum: selectedRowData.lotnum,
    //   work_type: "DETAIL2",
    // });
  };

  //스크롤 핸들러
  const onNoticeScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, noticePgNum, PAGE_SIZE))
      setNoticePgNum((prev) => prev + 1);
  };
  const onWorkOrderScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, workOrderPgNum, PAGE_SIZE))
      setWorkOrderPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onNoticeDataStateChange = (event: GridDataStateChangeEvent) => {
    setNoticeDataState(event.dataState);
  };
  const onWorkOrderDataStateChange = (event: GridDataStateChangeEvent) => {
    setWorkOrderDataState(event.dataState);
  };

  //그리드 푸터
  const noticeTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {noticeDataResult.total}건
      </td>
    );
  };

  const workOrderTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {workOrderDataResult.total}건
      </td>
    );
  };

  const onNoticeSortChange = (e: any) => {
    setNoticeDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onWorkOrderSortChange = (e: any) => {
    setWorkOrderDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const displayDate: Date = new Date();

  //스케줄러조회조건 Change 함수 => 사용자가 선택한 드롭다운리스트 값을 조회 파라미터로 세팅
  const schedulerFilterChange = (e: any) => {
    const { name, value } = e;

    setSchedulerFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchSessionItem = useCallback(async () => {
    let data;
    try {
      const para: Iparameters = {
        procedureName: "sys_biz_configuration",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_user_id": userId,
        },
      };

      data = await processApi<any>("procedure", para);

      if (data.isSuccess === true) {
        const rows = data.tables[0].Rows;
        setSessionItem(
          rows
            .filter((item: any) => item.class === "Session")
            .map((item: any) => ({
              code: item.code,
              value: item.value,
            }))
        );
      }
    } catch (e: any) {
      console.log("menus error", e);
    }
  }, []);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;

      setSchedulerFilter((prev) => ({
        ...prev,
        cboSchedulerType: defaultOption.find(
          (item: any) => item.id === "cboSchedulerType"
        ).valueCode,
      }));
    }
  }, [customOptionData]);

  return (
    <>
      <MainTopContainer>
        <ButtonContainer>
          <Button icon={"home"} fillMode={"flat"} themeColor={"primary"}>
            HOMEPAGE
          </Button>
          <Button icon={"email"} fillMode={"flat"} themeColor={"primary"}>
            E-MAIL
          </Button>
        </ButtonContainer>

        <MainWorkStartEndContainer>
          <TextContainer>
            {workTimeDataResult.strtime} - {workTimeDataResult.endtime}
          </TextContainer>
          <Button
            themeColor={"primary"}
            onClick={() => {
              fetchWorkTimeSaved("start");
            }}
          >
            출근
          </Button>
          <Button
            themeColor={"primary"}
            onClick={() => {
              fetchWorkTimeSaved("end");
            }}
          >
            퇴근
          </Button>
        </MainWorkStartEndContainer>
        <ApprovalBox>
          <ApprovalInner>
            <div>미결</div>
            <div>{approvalValueState.app}</div>
          </ApprovalInner>
          <ApprovalInner>
            <div>참조</div>
            <div>{approvalValueState.ref}</div>
          </ApprovalInner>
          <ApprovalInner>
            <div>반려</div>
            <div>{approvalValueState.rtr}</div>
          </ApprovalInner>
        </ApprovalBox>
      </MainTopContainer>

      <GridContainerWrap>
        <GridContainer width={`65%`} >
          <GridTitleContainer>
            <GridTitle>Work Calendar</GridTitle>
            {customOptionData !== null && (
              <div>
                <CustomOptionComboBox
                  name="cboSchedulerType"
                  value={schedulerFilter.cboSchedulerType}
                  customOptionData={customOptionData}
                  changeData={schedulerFilterChange}
                />
              </div>
            )}
          </GridTitleContainer>
          <Scheduler
            height={"718px"}
            data={schedulerDataResult}
            defaultDate={displayDate}
          >
            <MonthView />
            <DayView />
            <WeekView />
          </Scheduler>
        </GridContainer>
        <GridContainerWrap style={{width: `calc(35% - ${GAP}px)`}}flexDirection="column">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>공지사항</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "339px" }}
              data={process(
                noticeDataResult.data.map((row) => ({
                  ...row,
                  [SELECTED_FIELD]: detailSelectedState[idGetter(row)],
                })),
                noticeDataState
              )}
              {...noticeDataState}
              onDataStateChange={onNoticeDataStateChange}
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
              onSortChange={onNoticeSortChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={noticeDataResult.total}
              onScroll={onNoticeScrollHandler}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
            >
              <GridColumn
                field="recdt_week"
                title="작성일"
                cell={CenterCell}
                footerCell={noticeTotalFooterCell}
                width="140px"
              />
              <GridColumn
                field="person"
                title="작성자"
                cell={CenterCell}
                width="120px"
              />
              <GridColumn field="title" title="제목" />
            </Grid>
          </GridContainer>
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>업무지시요청</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "339px" }}
              data={process(workOrderDataResult.data, workOrderDataState)}
              {...workOrderDataState}
              onDataStateChange={onWorkOrderDataStateChange}
              //정렬기능
              sortable={true}
              onSortChange={onWorkOrderSortChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={workOrderDataResult.total}
              onScroll={onWorkOrderScrollHandler}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
            >
              <GridColumn
                field="recdt_week"
                title="작성일"
                cell={CenterCell}
                footerCell={workOrderTotalFooterCell}
                width="140px"
              />
              <GridColumn
                field="user_name"
                title="작성자"
                cell={CenterCell}
                width="120px"
              />
              <GridColumn field="title" title="제목" />
            </Grid>
          </GridContainer>
        </GridContainerWrap>
      </GridContainerWrap>
    </>
  );
};

export default Main;
