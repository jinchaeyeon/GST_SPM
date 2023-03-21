import React, { useCallback, useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
// ES2015 module syntax
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  SchedulerDataChangeEvent,
} from "@progress/kendo-react-scheduler";
import {
  GridContainer,
  GridTitle,
  GridContainerWrap,
  ButtonContainer,
  GridTitleContainer,
  TitleContainer,
  Title,
  FilterBoxWrap,
  FilterBox,
} from "../CommonStyled";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useApi } from "../hooks/api";
import { isLoading, loginResultState } from "../store/atoms";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  convertDateToStrWithTime,
  convertDateToStr,
  dateformat,
  dateformat2,
  getGridItemChangedData,
  UseBizComponent,
  UseCustomOption,
  setDefaultDate,
  UseMessages,
  findMessage,
  UsePermissions,
  handleKeyPressSearch,
  UseParaPc,
} from "../components/CommonFunction";
import {
  EDIT_FIELD,
  OLD_COMPANY,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import BizComponentComboBox from "../components/ComboBoxes/BizComponentComboBox";
import CommonRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import DateCell from "../components/Cells/DateCell";
import { Button } from "@progress/kendo-react-buttons";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import BizComponentRadioGroup from "../components/RadioGroups/BizComponentRadioGroup";
import TopButtons from "../components/TopButtons";

const DATA_ITEM_KEY = "idx";
let deletedTodoRows: object[] = [];

const CM_A1600: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const pathname: string = window.location.pathname.replace("/", "");
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const companyCode = loginResult ? loginResult.companyCode : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [permissions, setPermissions] = useState<TPermissions | null>(
    OLD_COMPANY.includes(companyCode)
      ? {
          view: true,
          save: true,
          delete: true,
          print: true,
        }
      : null
  );

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  if (!OLD_COMPANY.includes(companyCode)) {
    UsePermissions(setPermissions);
    UseCustomOption(pathname, setCustomOptionData);
  }

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent("L_sysUserMaster_001,R_YN", setBizComponentData);

  const [todoDataState, setTodoDataState] = useState<State>({
    sort: [],
  });

  const [todoDataResult, setTodoDataResult] = useState<DataResult>(
    process([], todoDataState)
  );

  const defaultData: any[] = [
    {
      id: 0,
      title: "Default Data",
      start: new Date("2021-01-01T08:30:00.000Z"),
      end: new Date("2021-01-01T09:00:00.000Z"),
    },
  ];
  const [schedulerDataResult, setSchedulerDataResult] = useState(defaultData);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [todoSelectedState, setTodoSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [todoPgNum, setTodoPgNum] = useState(1);

  const [isInitSearch, setIsInitSearch] = useState(false);

  //조회조건 ComboBox Change 함수 => 사용자가 선택한 콤보박스 값을 조회 파라미터로 세팅
  const filterComboBoxChange = (e: any) => {
    const { name, value } = e;

    setSchedulerFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 Radio Group Change 함수 => 사용자가 선택한 라디오버튼 값을 조회 파라미터로 세팅
  const filterRadioChange = (e: any) => {
    const { name, value } = e;

    setSchedulerFilter((prev) => ({
      ...prev,
      [name]: value,
    }));

    setTodoFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;
    setTodoFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [todoFilter, setTodoFilter] = useState({
    pgSize: PAGE_SIZE,
    work_type: "TODOLIST",
    orgdiv: "01",
    location: "01",
    rdofinyn: "N",
    frdt: new Date(),
    todt: new Date(),
  });

  const [schedulerFilter, setSchedulerFilter] = useState({
    work_type: "MY",
    person: userId,
    rdoplandiv: "Y",
  });

  const todoParameters: Iparameters = {
    procedureName: "P_CM_A1600W_Q",
    pageNumber: todoPgNum,
    pageSize: todoFilter.pgSize,
    parameters: {
      "@p_work_type": todoFilter.work_type,
      "@p_orgdiv": todoFilter.orgdiv,
      "@p_recdt": "",
      "@p_recdt1": "",
      "@p_dptcd": "",
      "@p_postcd": "",
      "@p_userid": userId,
      "@p_rtrchk": "N",
      "@p_frdt": convertDateToStr(todoFilter.frdt),
      "@p_person": schedulerFilter.person,
      "@p_todt": convertDateToStr(todoFilter.todt),
      "@p_finyn": todoFilter.rdofinyn,
      "@p_plandiv": "Y",
      "@p_stddiv": "",
      "@p_serviceid": "",
    },
  };

  const schedulerParameters: Iparameters = {
    procedureName: "P_CM_A1600W_Q",
    pageNumber: 1,
    pageSize: 1000,
    parameters: {
      "@p_work_type": schedulerFilter.work_type,
      "@p_orgdiv": "01",
      "@p_recdt": "",
      "@p_recdt1": "",
      "@p_dptcd": "",
      "@p_postcd": "",
      "@p_userid": userId,
      "@p_rtrchk": "",
      "@p_frdt": "",
      "@p_person": schedulerFilter.person,
      "@p_todt": "",
      "@p_finyn": "",
      "@p_plandiv": schedulerFilter.rdoplandiv,
      "@p_stddiv": "",
      "@p_serviceid": "",
    },
  };

  const fetchTodoGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", todoParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any, idx: number) => ({
        ...row,
        idx: idx,
        strtime: convertDateToStr(new Date(row.strtime)),
      }));

      if (totalRowCnt > 0)
        setTodoDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    }
    setLoading(false);
  };

  const fetchScheduler = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", schedulerParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      let rows = data.tables[0].Rows.map((row: any) => {
        const start = new Date(row.strtime);
        const end = new Date(row.endtime);
        const timeDiff = end.getTime() - start.getTime();

        return {
          ...row,
          id: row.datnum,
          title: row.title,
          description: row.contents,
          start: start,
          end: end,
          isAllDay: timeDiff === 8.64e7 ? true : false, // 24시간 차이 시 all day
        };
      });

      setSchedulerDataResult(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isInitSearch === false && permissions !== null) {
      //if (customOptionData !== null && isInitSearch === false) {
      fetchTodoGrid();
      setIsInitSearch(true);
    }
  }, [todoFilter, permissions]);

  useEffect(() => {
    // if (customOptionData !== null) {
    //   fetchScheduler();
    // }
    if (permissions !== null) fetchScheduler();
  }, [schedulerFilter, permissions]);

  //디테일1 그리드 선택 이벤트 => 디테일2 그리드 조회
  const onTodoSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: todoSelectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setTodoSelectedState(newSelectedState);
  };

  //스크롤 핸들러
  const onTodoScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, todoPgNum, PAGE_SIZE))
      setTodoPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onTodoDataStateChange = (event: GridDataStateChangeEvent) => {
    setTodoDataState(event.dataState);
  };
  //그리드 푸터
  const todoTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {todoDataResult.total}건
      </td>
    );
  };

  const onTodoSortChange = (e: any) => {
    setTodoDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const displayDate: Date = new Date();

  const handleDataChange = ({
    created,
    updated,
    deleted,
  }: SchedulerDataChangeEvent) => {
    if (schedulerFilter.person !== userId) {
      alert(findMessage(messagesData, "CM_A1600W_001"));
      return false;
    }
    type TdataArr = {
      rowstatus_s: string[];
      datnum_s: string[];
      strtime_s: string[];
      endtime_s: string[];
      contents_s: string[];
      person_s: string[];
      finyn_s: string[];
      kind1_s: string[];
      custcd_s: string[];
      title_s: string[];
      colorid_s: string[];
    };

    let dataArr: TdataArr = {
      rowstatus_s: [],
      datnum_s: [],
      strtime_s: [],
      endtime_s: [],
      contents_s: [],
      person_s: [],
      finyn_s: [],
      kind1_s: [],
      custcd_s: [],
      title_s: [],
      colorid_s: [],
    };

    created.forEach((item) => (item["rowstatus"] = "N"));
    updated.forEach((item) => (item["rowstatus"] = "U"));
    deleted.forEach((item) => (item["rowstatus"] = "D"));

    const mergedArr = [...created, ...updated, ...deleted];

    mergedArr.forEach((item) => {
      const {
        datnum = "",
        start,
        end,
        rowstatus,
        description = "",
        title = "",
        isAllDay,
      } = item;

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.datnum_s.push(datnum);
      dataArr.strtime_s.push(
        isAllDay
          ? convertDateToStrWithTime(start).substr(0, 8) + " 0:0"
          : convertDateToStrWithTime(start)
      );
      dataArr.endtime_s.push(
        isAllDay
          ? convertDateToStrWithTime(
              new Date(start.setDate(start.getDate() + 1))
            ).substr(0, 8) + " 0:0"
          : convertDateToStrWithTime(end)
      );
      dataArr.contents_s.push(description);
      dataArr.person_s.push("");
      dataArr.finyn_s.push("");
      dataArr.kind1_s.push("");
      dataArr.custcd_s.push("");
      dataArr.title_s.push(title);
      dataArr.colorid_s.push("");
    });

    setParaData((prev) => ({
      ...prev,
      work_type: "N",
      planyn_s: schedulerFilter.rdoplandiv,
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      datnum_s: dataArr.datnum_s.join("|"),
      contents_s: dataArr.contents_s.join("|"),
      strtime_s: dataArr.strtime_s.join("|"),
      endtime_s: dataArr.endtime_s.join("|"),
      person_s: schedulerFilter.person,
      finyn_s: dataArr.finyn_s.join("|"),
      kind1_s: dataArr.kind1_s.join("|"),
      custcd_s: dataArr.custcd_s.join("|"),
      title_s: dataArr.title_s.join("|"),
      colorid_s: dataArr.colorid_s.join("|"),
    }));
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    orgdiv: "01",
    location: "01",
    rowstatus_s: "",
    datnum_s: "",
    docunum_s: "",
    contents_s: "",
    strtime_s: "",
    endtime_s: "",
    person_s: userId,
    planyn_s: "",
    userid: userId,
    pc: pc,
    finyn_s: "",
    kind1_s: "",
    custcd_s: "",
    title_s: "",
    colorid_s: "",
    datnum: "",
    strdt: "",
    enddt: "",
    strhh: "",
    strmm: "",
    endhh: "",
    endmm: "",
    title: "",
    contents: "",
    kind1: "",
    kind2: "",
    custcd: "",
    custperson: "",
    opengb: "",
    attdatnum: "",
    finyn: "",
    usehh: 0,
    usemm: 0,
    planyn: "",
    amt: 0,
    ref_key: "",
    pgmid: "",
    form_id: pathname,
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_CM_A1600W_S",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_orgdiv": paraData.orgdiv,
      "@p_location": paraData.location,
      "@p_rowstatus_s": paraData.rowstatus_s,
      "@p_datnum_s": paraData.datnum_s,
      "@p_docunum_s": paraData.docunum_s,
      "@p_contents_s": paraData.contents_s,
      "@p_strtime_s": paraData.strtime_s,
      "@p_endtime_s": paraData.endtime_s,
      "@p_person_s": paraData.person_s,
      "@p_planyn_s": paraData.planyn_s,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
      "@p_finyn_s": paraData.finyn_s,
      "@p_kind1_s": paraData.kind1_s,
      "@p_custcd_s": paraData.custcd_s,
      "@p_title_s": paraData.title_s,
      "@p_colorid_s": paraData.colorid_s,
      "@p_datnum": paraData.datnum,
      "@p_strdt": paraData.strdt,
      "@p_enddt": paraData.enddt,
      "@p_strhh": paraData.strhh,
      "@p_strmm": paraData.strmm,
      "@p_endhh": paraData.endhh,
      "@p_endmm": paraData.endmm,
      "@p_title": paraData.title,
      "@p_contents": paraData.contents,
      "@p_kind1": paraData.kind1,
      "@p_kind2": paraData.kind2,
      "@p_custcd": paraData.custcd,
      "@p_custperson": paraData.custperson,
      "@p_opengb": paraData.opengb,
      "@p_attdatnum": paraData.attdatnum,
      "@p_finyn": paraData.finyn,
      "@p_usehh": paraData.usehh,
      "@p_usemm": paraData.usemm,
      "@p_planyn": paraData.planyn,
      "@p_amt": paraData.amt,
      "@p_ref_key": paraData.ref_key,
      "@p_pgmid": paraData.pgmid,
      "@p_form_id": paraData.form_id,
    },
  };

  const fetchSchedulerSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchScheduler();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchSchedulerSaved();
  }, [paraData]);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;

      setSchedulerFilter((prev) => ({
        ...prev,
        rdoplandiv: defaultOption.find((item: any) => item.id === "rdoplandiv")
          .valueCode,
      }));

      setTodoFilter((prev) => ({
        ...prev,
        frdt: setDefaultDate(customOptionData, "frdt"),
        todt: setDefaultDate(customOptionData, "todt"),
        rdofinyn: defaultOption.find((item: any) => item.id === "rdofinyn")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const onTodoItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      todoDataResult,
      setTodoDataResult,
      DATA_ITEM_KEY
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    const newData = todoDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : {
            ...item,
            [EDIT_FIELD]: undefined,
          }
    );

    setTodoDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    const newData = todoDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setTodoDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const customCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const onAddClick = () => {
    let seq = 1;

    if (todoDataResult.total > 0) {
      todoDataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    const idx: number =
      Number(Object.getOwnPropertyNames(selectedState)[0]) ??
      //Number(planDataResult.data[0].idx) ??
      null;
    if (idx === null) return false;
    const selectedRowData = todoDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === idx
    );

    const newDataItem = {
      [DATA_ITEM_KEY]: seq,
      // planno: selectedRowData.planno,
      strtime: convertDateToStr(new Date()),
      rowstatus: "N",
      finyn: "N",
    };
    setTodoDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];

    todoDataResult.data.forEach((item: any, index: number) => {
      if (!todoSelectedState[item[DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        deletedTodoRows.push(item);
      }
    });

    //newData 생성
    setTodoDataResult((prev) => ({
      data: newData,
      total: newData.length,
    }));

    //선택 상태 초기화
    setTodoSelectedState({});
  };

  const onSaveClick = () => {
    const dataItem: { [name: string]: any } = todoDataResult.data.filter(
      (item: any) => {
        return (
          (item.rowstatus === "N" || item.rowstatus === "U") &&
          item.rowstatus !== undefined
        );
      }
    );
    if (dataItem.length === 0 && deletedTodoRows.length === 0) return false;

    //검증
    let valid = true;
    try {
      dataItem.forEach((item: any) => {
        if (!item.strtime) {
          throw new Error(findMessage(messagesData, "CM_A1600W_003"));
        }

        if (!item.contents) {
          throw new Error(findMessage(messagesData, "CM_A1600W_004"));
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    type TData = {
      rowstatus_s: string[];
      datnum_s: string[];
      contents_s: string[];
      strtime_s: string[];
      endtime_s: string[];
      finyn_s: string[];
      kind1_s: string[];
      custcd_s: string[];
      title_s: string[];
    };

    let dataArr: TData = {
      rowstatus_s: [],
      datnum_s: [],
      contents_s: [],
      strtime_s: [],
      endtime_s: [],
      finyn_s: [],
      kind1_s: [],
      custcd_s: [],
      title_s: [],
    };

    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus,
        datnum,
        contents,
        strtime,
        finyn,
        kind1,
        custcd,
        title,
      } = item;

      console.log("item");
      console.log(item);

      const strtimeDate = new Date(dateformat(strtime));

      dataArr.rowstatus_s.push(rowstatus);
      dataArr.datnum_s.push(datnum);
      dataArr.contents_s.push(contents);
      dataArr.strtime_s.push(dateformat2(strtime));
      dataArr.endtime_s.push(
        dateformat2(
          convertDateToStr(
            new Date(strtimeDate.setDate(strtimeDate.getDate() + 1))
          )
        )
      );
      dataArr.finyn_s.push(finyn === "Y" || finyn === true ? "Y" : "N");
      dataArr.kind1_s.push(kind1);
      dataArr.custcd_s.push(custcd);
      dataArr.title_s.push(title);
    });

    deletedTodoRows.forEach((item: any, idx: number) => {
      const { datnum, contents, strtime, finyn, kind1, custcd, title } = item;

      const strtimeDate = new Date(dateformat(strtime));

      dataArr.rowstatus_s.push("D");
      dataArr.datnum_s.push(datnum);
      dataArr.contents_s.push(contents);
      dataArr.strtime_s.push(dateformat2(strtime));
      dataArr.endtime_s.push(
        dateformat2(
          convertDateToStr(
            new Date(strtimeDate.setDate(strtimeDate.getDate() + 1))
          )
        )
      );
      dataArr.finyn_s.push(finyn);
      dataArr.kind1_s.push(kind1);
      dataArr.custcd_s.push(custcd);
      dataArr.title_s.push(title);
    });

    setTodoParaDataSaved((prev) => ({
      ...prev,
      work_type: "TODOLIST",
      rowstatus_s: dataArr.rowstatus_s.join("|"),
      datnum_s: dataArr.datnum_s.join("|"),
      contents_s: dataArr.contents_s.join("|"),
      strtime_s: dataArr.strtime_s.join("|"),
      endtime_s: dataArr.endtime_s.join("|"),
      finyn_s: dataArr.finyn_s.join("|"),
      kind1_s: dataArr.kind1_s.join("|"),
      custcd_s: dataArr.custcd_s.join("|"),
      title_s: dataArr.title_s.join("|"),
    }));
  };

  //계획 저장 파라미터 초기값
  const [todoParaDataSaved, setTodoParaDataSaved] = useState({
    work_type: "",
    orgdiv: "01",
    location: "01",
    rowstatus_s: "",
    datnum_s: "",
    docunum_s: "",
    contents_s: "",
    strtime_s: "",
    endtime_s: "",
    person_s: "",
    planyn_s: "Y",
    userid: userId,
    pc: pc,
    finyn_s: "",
    kind1_s: "",
    custcd_s: "",
    title_s: "",
    colorid_s: "",
    datnum: "",
    strdt: "",
    enddt: "",
    strhh: "",
    strmm: "",
    endhh: "",
    endmm: "",
    title: "",
    contents: "",
    kind1: "",
    kind2: "",
    custcd: "",
    custperson: "",
    opengb: "",
    attdatnum: "",
    finyn: "",
    usehh: 0,
    usemm: 0,
    planyn: "",
    amt: 0,
    ref_key: "",
    pgmid: "",
    form_id: pathname,
  });

  const todoParaSaved: Iparameters = {
    procedureName: "P_CM_A1600W_S",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": todoParaDataSaved.work_type,
      "@p_orgdiv": todoParaDataSaved.orgdiv,
      "@p_location": todoParaDataSaved.location,
      "@p_rowstatus_s": todoParaDataSaved.rowstatus_s,
      "@p_datnum_s": todoParaDataSaved.datnum_s,
      "@p_docunum_s": todoParaDataSaved.docunum_s,
      "@p_contents_s": todoParaDataSaved.contents_s,
      "@p_strtime_s": todoParaDataSaved.strtime_s,
      "@p_endtime_s": todoParaDataSaved.endtime_s,
      "@p_person_s": todoParaDataSaved.person_s,
      "@p_planyn_s": todoParaDataSaved.planyn_s,
      "@p_userid": todoParaDataSaved.userid,
      "@p_pc": todoParaDataSaved.pc,
      "@p_finyn_s": todoParaDataSaved.finyn_s,
      "@p_kind1_s": todoParaDataSaved.kind1_s,
      "@p_custcd_s": todoParaDataSaved.custcd_s,
      "@p_title_s": todoParaDataSaved.title_s,
      "@p_colorid_s": todoParaDataSaved.colorid_s,
      "@p_datnum": todoParaDataSaved.datnum,
      "@p_strdt": todoParaDataSaved.strdt,
      "@p_enddt": todoParaDataSaved.enddt,
      "@p_strhh": todoParaDataSaved.strhh,
      "@p_strmm": todoParaDataSaved.strmm,
      "@p_endhh": todoParaDataSaved.endhh,
      "@p_endmm": todoParaDataSaved.endmm,
      "@p_title": todoParaDataSaved.title,
      "@p_contents": todoParaDataSaved.contents,
      "@p_kind1": todoParaDataSaved.kind1,
      "@p_kind2": todoParaDataSaved.kind2,
      "@p_custcd": todoParaDataSaved.custcd,
      "@p_custperson": todoParaDataSaved.custperson,
      "@p_opengb": todoParaDataSaved.opengb,
      "@p_attdatnum": todoParaDataSaved.attdatnum,
      "@p_finyn": todoParaDataSaved.finyn,
      "@p_usehh": todoParaDataSaved.usehh,
      "@p_usemm": todoParaDataSaved.usemm,
      "@p_planyn": todoParaDataSaved.planyn,
      "@p_amt": todoParaDataSaved.amt,
      "@p_ref_key": todoParaDataSaved.ref_key,
      "@p_pgmid": todoParaDataSaved.pgmid,
      "@p_form_id": todoParaDataSaved.form_id,
    },
  };

  const fetchTodoGridSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", todoParaSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setTodoPgNum(1);
      setTodoDataResult(process([], todoDataState));
      fetchTodoGrid();
      fetchScheduler();

      deletedTodoRows = [];
    } else {
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }
  };

  useEffect(() => {
    if (todoParaDataSaved.work_type !== "") fetchTodoGridSaved();
  }, [todoParaDataSaved]);

  //엑셀 내보내기
  let _export: ExcelExport | null | undefined;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save();
    }
  };

  const search = () => {
    setTodoPgNum(1);
    setTodoDataResult(process([], todoDataState));
    fetchTodoGrid();
    fetchScheduler();
  };
  return (
    <>
      <TitleContainer>
        <Title>Scheduler</Title>
        <ButtonContainer>
          {permissions && (
            <TopButtons
              search={search}
              exportExcel={exportExcel}
              permissions={permissions}
            />
          )}
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap>
        <GridContainer>
          <GridTitleContainer>
            <FilterBoxWrap>
              <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                <tbody>
                  <tr>
                    <th>작성자</th>
                    <td>
                      {bizComponentData !== null && (
                        <BizComponentComboBox
                          name="person"
                          value={schedulerFilter.person}
                          bizComponentId="L_sysUserMaster_001"
                          bizComponentData={bizComponentData}
                          changeData={filterComboBoxChange}
                          valueField="user_id"
                          textField="user_name"
                        />
                      )}
                    </td>
                    <th>계획구분</th>
                    <td>
                      {customOptionData !== null && (
                        <CommonRadioGroup
                          name="rdoplandiv"
                          customOptionData={customOptionData}
                          changeData={filterRadioChange}
                        />
                      )}

                      {bizComponentData !== null &&
                        customOptionData === null && (
                          <BizComponentRadioGroup
                            name="rdoplandiv"
                            value={schedulerFilter.rdoplandiv}
                            bizComponentId="R_YN"
                            bizComponentData={bizComponentData}
                            changeData={filterRadioChange}
                          />
                        )}
                    </td>
                  </tr>
                </tbody>
              </FilterBox>
            </FilterBoxWrap>
          </GridTitleContainer>
          <GridTitleContainer>
            <GridTitle>개인 스케줄러</GridTitle>
          </GridTitleContainer>
          <Scheduler
            height={"83vh"}
            data={schedulerDataResult}
            onDataChange={handleDataChange}
            defaultDate={displayDate}
            editable={true}
          >
            <WeekView />
            <MonthView />
            <DayView />
          </Scheduler>
        </GridContainer>
        <GridContainerWrap flexDirection="column">
          <ExcelExport
            data={todoDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridContainer>
              <GridTitleContainer>
                <FilterBoxWrap>
                  <FilterBox
                    onKeyPress={(e) => handleKeyPressSearch(e, search)}
                  >
                    <tbody>
                      <tr>
                        <th>일자</th>
                        <td colSpan={3}>
                          <div className="filter-item-wrap">
                            <DatePicker
                              name="frdt"
                              value={todoFilter.frdt}
                              format="yyyy-MM-dd"
                              onChange={filterInputChange}
                              placeholder=""
                            />
                            <DatePicker
                              name="todt"
                              value={todoFilter.todt}
                              format="yyyy-MM-dd"
                              onChange={filterInputChange}
                              placeholder=""
                            />
                          </div>
                        </td>
                        <th>완료</th>
                        <td>
                          {customOptionData !== null && (
                            <CommonRadioGroup
                              name="rdofinyn"
                              customOptionData={customOptionData}
                              changeData={filterRadioChange}
                            />
                          )}
                          {bizComponentData !== null &&
                            customOptionData === null && (
                              <BizComponentRadioGroup
                                name="rdofinyn"
                                value={todoFilter.rdofinyn}
                                bizComponentId="R_YN"
                                bizComponentData={bizComponentData}
                                changeData={filterRadioChange}
                              />
                            )}
                        </td>
                      </tr>
                    </tbody>
                  </FilterBox>
                </FilterBoxWrap>
              </GridTitleContainer>

              <GridTitleContainer>
                <GridTitle>To-do 리스트</GridTitle>

                {permissions && (
                  <ButtonContainer>
                    <Button
                      onClick={onAddClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="plus"
                      disabled={permissions.save ? false : true}
                    ></Button>
                    <Button
                      onClick={onRemoveClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="minus"
                      disabled={permissions.save ? false : true}
                    ></Button>
                    <Button
                      onClick={onSaveClick}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="save"
                      disabled={permissions.save ? false : true}
                    ></Button>
                  </ButtonContainer>
                )}
              </GridTitleContainer>

              <Grid
                style={{ height: "83vh" }}
                data={process(
                  todoDataResult.data.map((row) => ({
                    ...row,
                    strtime: row.strtime
                      ? new Date(dateformat(row.strtime))
                      : new Date(dateformat("19991231")),
                    [SELECTED_FIELD]: todoSelectedState[idGetter(row)],
                  })),
                  todoDataState
                )}
                {...todoDataState}
                onDataStateChange={onTodoDataStateChange}
                //선택기능
                dataItemKey={DATA_ITEM_KEY}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onTodoSelectionChange}
                //정렬기능
                sortable={true}
                onSortChange={onTodoSortChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={todoDataResult.total}
                onScroll={onTodoScrollHandler}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                //incell 수정 기능
                onItemChange={onTodoItemChange}
                cellRender={customCellRender}
                rowRender={customRowRender}
                editField={EDIT_FIELD}
              >
                <GridColumn
                  field="rowstatus"
                  title=" "
                  width="40px"
                  editable={false}
                />
                <GridColumn
                  field="strtime"
                  title="일자"
                  cell={DateCell}
                  footerCell={todoTotalFooterCell}
                  width="140px"
                />
                <GridColumn
                  field="contents"
                  title="내용"
                  //cell={CenterCell}
                  width="450px"
                />
                <GridColumn
                  field="finyn"
                  title="완료"
                  width="50px"
                  cell={CheckBoxCell}
                />
              </Grid>
            </GridContainer>
          </ExcelExport>
        </GridContainerWrap>
      </GridContainerWrap>
    </>
  );
};

export default CM_A1600;
