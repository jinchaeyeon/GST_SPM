import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  process,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { getter } from "@progress/kendo-react-common";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import {
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  GridToolbar,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import "devexpress-gantt/dist/dx-gantt.min.css";
import Gantt, {
  Column,
  Dependencies,
  Editing,
  Item,
  Tasks,
  Toolbar,
  Validation,
} from "devextreme-react/gantt";
import "devextreme/dist/css/dx.light.css";
import { locale } from "devextreme/localization";
import {
  DependencyDeletedEvent,
  DependencyInsertedEvent,
  DependencyInsertingEvent,
  ScaleCellPreparedEvent,
  TaskDeletedEvent,
  TaskEditDialogShowingEvent,
  TaskInsertedEvent,
  TaskInsertingEvent,
  TaskUpdatedEvent,
} from "devextreme/ui/gantt";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  GridTitle,
  GridTitleContainer,
  Title,
  TitleContainer,
} from "../CommonStyled";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import DateCell from "../components/Cells/DateCell";
import NameCell from "../components/Cells/NameCell";
import {
  UseParaPc,
  convertDateToStr,
  convertDateToStrWithTime2,
  dateformat2,
  getCodeFromValue,
  getGridItemChangedData,
  handleKeyPressSearch,
  projectItemQueryStr,
  toDate,
} from "../components/CommonFunction";
import { EDIT_FIELD, SELECTED_FIELD } from "../components/CommonString";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { useApi } from "../hooks/api";
import {
  filterValueState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";
import {
  projectColumns,
  projectItemsColumns,
} from "../store/columns/common-columns";
import { Iparameters } from "../store/types";

import NumberPercentCell from "../components/Cells/NumberPercentCell";
import RequiredHeader from "../components/RequiredHeader";
import DetailWindow from "../components/Windows/CommonWindows/ProjectScheduleDetailWindow";
type TSavedPara = {
  row_status?: "N" | "U" | "D";
  guid?: string;
  project_itemcd?: string;
  title?: string;
  strtime?: string;
  endtime?: string;
  rate?: string;
  appointment_label?: string;
  dep_row_status?: "N" | "D";
  parent_guid?: string;
  child_guid?: string;
  project_itemnm?: string;
  remark?: string;
  person?: string;
};

type TTask = {
  id: string;
  parentId: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  project_itemcd: string;
  project_itemnm: string;
  guid: string;
  parent_guid: string;
  child_guid: string;
  remark: string;
  person: string;
  user_name: string;
  isChild: boolean;
};
type TDependency = {
  id: string;
  predecessorId: string;
  successorId: string;
  type: string;
  parent_guid: string;
  child_guid: string;
};
type TAssignment = {
  id: string;
  taskId: string;
  resourceId: string;
};
type TResource = {
  id: string;
  text: string;
};
const scaleTypes = [
  { value: "months", label: "월별" },
  { value: "weeks", label: "주별" },
  { value: "days", label: "일별" },
];
const viewTypes = [
  { value: "Scheduler", label: "Scheduler" },
  { value: "Grid", label: "Grid" },
];
type GanttScaleType =
  | "auto"
  | "minutes"
  | "hours"
  | "sixHours"
  | "days"
  | "weeks"
  | "months"
  | "quarters"
  | "years";

const DATA_ITEM_KEY = "id";

const CodesContext = createContext<{
  projectItems: any[];
}>({
  projectItems: [],
});

const deletedGridData: any[] = [];

let taskForDeleting: any[] = []; // 삭제할때 참조되는 용도

const App = () => {
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);
  const [title, setTitle] = useRecoilState(titles);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN";

  const [task, setTask] = useState<TTask[]>([]);
  const [assignment, setAssignment] = useState<TAssignment[]>([]);
  const [dependency, setDependency] = useState<TDependency[]>([]);
  const [resource, setResource] = useState<TResource[]>([]);
  const [projectItems, setProjectItems] = useState([]);

  const [gridDataState, setGridDataState] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [gridData, setGridData] = useState<DataResult>(
    process([], gridDataState)
  );
  const [tempValue, setTempValue] = useState<any>();
  const [gridSelectedState, setGridSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const gridIdGetter = getter(DATA_ITEM_KEY);

  const setLoading = useSetRecoilState(isLoading);

  const [projectsData, setProjectsData] = useState<TTask[]>([]);
  const [projectValue, setProjectValue] = useState<{
    project: string;
    devmngnum: string;
  } | null>(null);

  const [scale, setScale] = useState<GanttScaleType>("weeks");
  const [view, setView] = useState<"Scheduler" | "Grid">("Scheduler");

  useEffect(() => {
    locale("ko");
  }, []);

  const onDependencyInserted = (e: DependencyInsertedEvent) => {
    const { predecessorId, successorId } = e.values;

    const predecessorData = task.find((item) => item.id === predecessorId);
    const successorData = task.find((item) => item.id === successorId);

    const para: TSavedPara = {
      dep_row_status: "N",
      parent_guid: predecessorData ? predecessorData.guid : "",
      child_guid: successorData ? successorData.guid : "",
    };

    saveProjectScheduler(para);
  };
  const onDependencyDeleted = (e: DependencyDeletedEvent) => {
    const { predecessorId, successorId } = e.values;

    const predecessorData = task.find((item) => item.id === predecessorId);
    const successorData = task.find((item) => item.id === successorId);

    const para: TSavedPara = {
      dep_row_status: "D",
      parent_guid: predecessorData ? predecessorData.guid : "",
      child_guid: successorData ? successorData.guid : "",
    };
    saveProjectScheduler(para);
  };
  const onTaskInserted = (e: TaskInsertedEvent) => {
    const { guid, start, end, progress, title, project_itemcd = "" } = e.values;

    const para: TSavedPara = {
      row_status: "N",
      guid,
      project_itemcd,
      title,
      strtime: convertDateToStrWithTime2(start),
      endtime: convertDateToStrWithTime2(end),
      rate: progress,
    };
    saveProjectScheduler(para);
  };
  const onTaskDeleted = (e: TaskDeletedEvent) => {
    const { key } = e;
    const deletedData = taskForDeleting.find((item) => item.id === key);

    const para: TSavedPara = {
      row_status: "D",
      guid: deletedData?.guid,
      rate: "0",
    };
    saveProjectScheduler(para);
  };
  const onTaskUpdated = (e: TaskUpdatedEvent) => {
    const { values, key } = e;
    const updatedData = task.find((item) => item.id === key);
    const {
      guid = updatedData?.guid,
      start = updatedData?.start,
      end = updatedData?.end,
      progress = updatedData?.progress,
      title = updatedData?.title,
      project_itemcd = updatedData?.project_itemcd,
    } = values;

    const para: TSavedPara = {
      row_status: "U",
      guid,
      strtime: convertDateToStrWithTime2(start),
      endtime: convertDateToStrWithTime2(end),
      rate: progress,
      title,
      project_itemcd,
    };
    saveProjectScheduler(para);
  };

  useEffect(() => {
    fetchProjectList();
    fetchProjectItems();
    setTitle("프로젝트 일정계획");
  }, []);

  useEffect(() => {
    // 메인 그리드에서 클릭하여 오픈시 조회조건 재설정하여 조회
    if (filterValue.type === "project") {
      const { project, devmngnum } = filterValue.dataItem;
      setProjectValue({ project, devmngnum });
      setFilterValue({ type: null, dataItem: {} });
    }
  }, [filterValue]);

  useEffect(() => {
    if (projectValue && projectValue.devmngnum) {
      fetchProjectDetail(projectValue.devmngnum);
    } else {
      // 초기화
      setGridData(process([], gridDataState));
      setTask([]);
      setDependency([]);
      taskForDeleting = [];
    }
  }, [projectValue]);

  const stringToIntegerMap = new Map<string, number>();

  const getIntegerForString = (s: string): number => {
    // If the map already contains the string, return the existing value
    if (stringToIntegerMap.has(s)) {
      return stringToIntegerMap.get(s)!;
    }

    // Otherwise, generate a new random integer, store it in the map, and return it
    let randomInt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    stringToIntegerMap.set(s, randomInt);
    return randomInt;
  };

  const stringToUuidMap = new Map<string, string>();

  const getUuidForString = (s: string): string => {
    // 일정 항목을 간트에 표현하려면 uuid가 필요하여 생성하여 사용
    // If the map already contains the string, return the existing value
    if (stringToUuidMap.has(s)) {
      return stringToUuidMap.get(s)!;
    }

    // Otherwise, generate a new UUID, store it in the map, and return it
    const newUuid = uuidv4();
    stringToUuidMap.set(s, newUuid);
    return newUuid;
  };

  const fetchProjectList = async () => {
    let data: any;

    try {
      data = await processApi<any>("project-schedule-list");
    } catch (error) {
      data = null;
    }

    if (data != null) {
      const rows = data.tables[0].Rows;
      setProjectsData(rows);
    }
  };

  const fetchProjectDetail = async (devmngnum: string) => {
    let data: any;
    const para = {
      id: devmngnum,
    };
    try {
      data = await processApi<any>("project-schedule-detail", para);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      // 일정항목 데이터
      const parentRows: TTask[] = data.tables[0].Rows.map((row: any) => ({
        ...row,
        id: getUuidForString(row.project_itemcd),
        parentId:
          row.prntitemcd === "" ? null : getUuidForString(row.prntitemcd),
        title: row.project_itemnm,
        start: new Date(),
        end: new Date(),
        progress: 0,
        isChild: false,
      }));

      // 일정 데이터
      const childRows: TTask[] = data.tables[1].Rows.map(
        (row: any, idx: number) => ({
          ...row,
          idx,
          id: row.guid,
          parentId: getUuidForString(row.project_itemcd),
          title: row.title,
          start: new Date(row.start_time),
          startStrig: dateformat2(row.start_time),
          end: new Date(row.end_time),
          endStrig: dateformat2(row.end_time),
          progress: row.rate,
          isChild: true,
        })
      );

      // 일정항목과 일정을 합쳐서 하나의 Task 데이터로 만들고 데이터 순서 정렬
      const taskRows = reorderTasks([...parentRows, ...childRows]);

      // 디펜던시(화살표) 데이터
      const dependancyRows: TDependency[] = data.tables[2].Rows.filter(
        (row: any) => row.guid !== "" && row.parent_guid !== ""
      ).map((row: any, idx: number) => ({
        ...row,
        id: idx,
        predecessorId: row.parent_guid,
        successorId: row.guid,
        type: 0,
      }));

      setGridData(process(childRows, gridDataState));
      if (Object.getOwnPropertyNames(gridSelectedState)[0] == undefined) {
        setGridSelectedState({ [childRows[0].id]: true });
      }
      setTask(taskRows);
      setDependency(dependancyRows);

      taskForDeleting = [];
      taskForDeleting.push(...taskRows);
    }
  };

  const reorderTasks = (data: TTask[]): TTask[] => {
    // parentId가 null인 항목의 id 찾기
    let parentIdNullItem = data.find((item) => item.parentId === null);
    let parentIdNullItemId = parentIdNullItem ? parentIdNullItem.id : null;

    // parentId가 null인 항목의 id를 parentId로 가진 항목을 찾아서 맨 앞으로 이동
    if (parentIdNullItemId !== null) {
      data.sort((a, b) => {
        if (a.parentId === parentIdNullItemId) {
          return -1;
        } else if (b.parentId === parentIdNullItemId) {
          return 1;
        } else {
          return 0;
        }
      });
    }
    return data;
  };

  const saveProjectScheduler = async (para: TSavedPara) => {
    let data: any;
    const {
      row_status = "",
      guid = "",
      project_itemcd = "",
      title = "",
      strtime = "",
      endtime = "",
      rate = "",
      appointment_label = "",
      dep_row_status = "",
      parent_guid = "",
      child_guid = "",
      project_itemnm = "",
      remark = "",
      person = "",
    } = para;

    if (!projectValue) {
      alert("프로젝트 명은 필수 입력 항목입니다.");
      return false;
    }

    setLoading(true);
    const devmngnum = getCodeFromValue(projectValue, "devmngnum");

    const parameters: Iparameters = {
      procedureName: "pw6_sav_project_schedule",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "SAVE",
        "@p_devmngnum": devmngnum,
        "@p_rowstatus": row_status,
        "@p_guid": guid,
        "@p_project_itemcd": project_itemcd,
        "@p_title": title,
        "@p_strtime": strtime,
        "@p_endtime": endtime,
        "@p_rate": rate,
        "@p_person": person,
        "@p_remark": remark,
        "@p_appointment_label": appointment_label,
        "@p_dep_rowstatus": dep_row_status,
        "@p_parentguid": parent_guid,
        "@p_childguid": child_guid,
        "@p_project_itemnm": project_itemnm,
        "@p_id": userId,
        "@p_pc": pc,
        "@p_form_id": "SPM_WEB",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      fetchProjectDetail(devmngnum);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };
  // 데이터 저장
  const saveProjectGrid = async () => {
    let data: any;

    if (!projectValue) {
      alert("프로젝트 명은 필수 입력 항목입니다.");
      return false;
    }

    setLoading(true);
    const devmngnum = getCodeFromValue(projectValue, "devmngnum");
    let isValid = true;

    type TGridDataArr = {
      row_status: string[];
      guid: string[];
      project_itemcd: string[];
      title: string[];
      strtime: string[];
      endtime: string[];
      rate: string[];
      appointment_label: string[];
      remark: string[];
      person: string[];
    };
    let gridDataArr: TGridDataArr = {
      row_status: [],
      guid: [],
      project_itemcd: [],
      title: [],
      strtime: [],
      endtime: [],
      rate: [],
      appointment_label: [],
      remark: [],
      person: [],
    };

    for (const [idx, item] of gridData.data.entries()) {
      const {
        rowstatus,
        guid,
        project_itemcd,
        title,
        start,
        end,
        progress,
        remark,
        person,
      } = item;

      if (!rowstatus) continue;
      if (!project_itemcd) {
        isValid = false;
        alert("일정항목은 필수 입력 항목입니다.");
        break;
      }
      if (!start) {
        isValid = false;
        alert("시작일자는 필수 입력 항목입니다.");
        break;
      }
      if (!end) {
        isValid = false;
        alert("종료일자는 필수 입력 항목입니다.");
        break;
      }

      gridDataArr.row_status.push(rowstatus);
      gridDataArr.guid.push(guid);
      gridDataArr.project_itemcd.push(project_itemcd);
      gridDataArr.title.push(title);
      gridDataArr.strtime.push(convertDateToStr(start)); // convertDateToStrWithTime2(start)
      gridDataArr.endtime.push(convertDateToStr(end)); // convertDateToStrWithTime2(end)
      gridDataArr.rate.push(progress);
      gridDataArr.person.push(person);
      gridDataArr.remark.push(remark);
      gridDataArr.appointment_label.push("0");
    }
    deletedGridData.forEach((item) => {
      const { guid } = item;

      gridDataArr.row_status.push("D");
      gridDataArr.guid.push(guid);
      gridDataArr.project_itemcd.push("");
      gridDataArr.title.push("");
      gridDataArr.strtime.push("");
      gridDataArr.endtime.push("");
      gridDataArr.rate.push("0");
      gridDataArr.person.push("");
      gridDataArr.remark.push("");
      gridDataArr.appointment_label.push("");
    });

    if (!isValid) {
      setLoading(false);
      return false;
    }

    const parameters: Iparameters = {
      procedureName: "pw6_sav_project_schedule",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "SAVE",
        "@p_devmngnum": devmngnum,
        "@p_rowstatus": gridDataArr.row_status.join("|"),
        "@p_guid": gridDataArr.guid.join("|"),
        "@p_project_itemcd": gridDataArr.project_itemcd.join("|"),
        "@p_title": gridDataArr.title.join("|"),
        "@p_strtime": gridDataArr.strtime.join("|"),
        "@p_endtime": gridDataArr.endtime.join("|"),
        "@p_rate": gridDataArr.rate.join("|"),
        "@p_person": gridDataArr.person.join("|"),
        "@p_remark": gridDataArr.remark.join("|"),
        "@p_appointment_label": gridDataArr.appointment_label.join("|"),
        "@p_dep_rowstatus": "",
        "@p_parentguid": "",
        "@p_childguid": "",
        "@p_project_itemnm": "",
        "@p_id": userId,
        "@p_pc": pc,
        "@p_form_id": "SPM_WEB",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      fetchProjectDetail(devmngnum);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const search = () => {
    setGridSelectedState({});
    fetchProjectList();
    if (!projectValue) {
      alert("프로젝트 명은 필수 입력값입니다.");
      return false;
    }
    fetchProjectDetail(projectValue.devmngnum);
  };

  const handleChange = (event: any) => {
    if (event) {
      setProjectValue(event.target.value);
    }
  };

  const onGridDataStateChange = (event: GridDataStateChangeEvent) => {
    setGridDataState(event.dataState);
  };

  const onGridSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: gridSelectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setGridSelectedState(newSelectedState);
  };

  const onGridItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(event, gridData, setGridData, DATA_ITEM_KEY);
  };

  const enterEdit = (dataItem: any, field: string) => {
    if (!dataItem[EDIT_FIELD]) { // 수정중이 아닐때만
      const newData = gridData.data.map((item) =>
        item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setTempValue(dataItem[field]);

      setGridData((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const changedRow = gridData.data.find((item) => !!item[EDIT_FIELD]);

    const field = changedRow[EDIT_FIELD];
    const newValue = changedRow[field];

    if (tempValue != newValue) {
      const newData = gridData.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(gridSelectedState)[0]
          ? {
              ...item,
              rowstatus: (item.rowstatus && item.rowstatus === "N") ? "N" : "U",
              [EDIT_FIELD]: undefined,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setTempValue(undefined);

      setGridData((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } 
    else {
      const newData = gridData.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempValue(undefined);
      setGridData((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
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

  const addGridRow = () => {
    let end = new Date();
    end.setDate(end.getDate() + 1);

    const guid = uuidv4();

    const newRows = {
      rowstatus: "N",
      [DATA_ITEM_KEY]: getUuidForString(guid),
      guid,
      start: new Date(),
      end,
      progress: 0,
      client_finexpdt: null,
    };

    setGridSelectedState({ [newRows.id]: true });
    setGridData((prev) => {
      return {
        data: [newRows, ...prev.data],
        total: prev.total + 1,
      };
    });
  };

  const removeGridRow = () => {
    const selectedKey = Object.keys(gridSelectedState)[0];
    const selectedIndex = gridData.data.findIndex(
      (row) => row[DATA_ITEM_KEY].toString() === selectedKey
    );

    if (selectedIndex !== -1) {
      let newRows = [...gridData.data];
      newRows.splice(selectedIndex, 1);

      // 삭제행의 다음행의 index를 계산
      let nextSelectedIndex =
        selectedIndex === newRows.length ? selectedIndex - 1 : selectedIndex;

      // 데이터 업데이트
      setGridData((prev) => process(newRows, gridDataState));

      // selectedState 업데이트
      if (newRows.length > 0) {
        setGridSelectedState({
          [newRows[nextSelectedIndex][DATA_ITEM_KEY]]: true,
        });
      } else {
        setGridSelectedState({});
      }

      const selectedData = gridData.data.find(
        (item) => item[DATA_ITEM_KEY].toString() === selectedKey
      );

      deletedGridData.push(selectedData);
    } else {
      console.log("No row selected");
    }
  };

  const gridTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {gridData.total}건
      </td>
    );
  };

  const fetchProjectItems = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(projectItemQueryStr));

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
      setProjectItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const [projectFilter, setProjectFilter] = React.useState<FilterDescriptor>();
  const handleProjectFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setProjectFilter(event.filter);
    }
  };

  const saveProject = () => {
    if (view === "Scheduler") {
    } else {
      saveProjectGrid();
    }
  };

  // 간트에서는 항목 추가할수없음
  // const saveAllProjectItem = async () => {
  //   let data: any;

  //   console.log("projectItems");
  //   console.log(projectItems);

  //   if (!projectValue) {
  //     alert("프로젝트 명은 필수 입력 항목입니다.");
  //     return false;
  //   }

  //   if (!window.confirm("전체 일정 항목을 추가하겠습니까?")) {
  //     return false;
  //   }

  //   setLoading(true);
  //   const devmngnum = getCodeFromValue(projectValue, "devmngnum");
  //   let isValid = true;

  //   type TDataArr = {
  //     row_status: string[];
  //     guid: string[];
  //     project_itemcd: string[];
  //     title: string[];
  //     strtime: string[];
  //     endtime: string[];
  //     rate: string[];
  //     appointment_label: string[];
  //     remark: string[];
  //     person: string[];
  //   };
  //   let dataArr: TDataArr = {
  //     row_status: [],
  //     guid: [],
  //     project_itemcd: [],
  //     title: [],
  //     strtime: [],
  //     endtime: [],
  //     rate: [],
  //     appointment_label: [],
  //     remark: [],
  //     person: [],
  //   };

  //   for (const [idx, item] of projectItems.entries()) {
  //     const {
  //       rowstatus,
  //       guid,
  //       project_itemcd,
  //       title,
  //       start,
  //       end,
  //       progress,
  //       remark,
  //       person,
  //     } = item;

  //     if (!rowstatus) continue;
  //     if (!project_itemcd) {
  //       isValid = false;
  //       alert("일정항목은 필수 입력 항목입니다.");
  //       break;
  //     }
  //     if (!start) {
  //       isValid = false;
  //       alert("시작일자는 필수 입력 항목입니다.");
  //       break;
  //     }
  //     if (!end) {
  //       isValid = false;
  //       alert("종료일자는 필수 입력 항목입니다.");
  //       break;
  //     }

  //     dataArr.row_status.push(rowstatus);
  //     dataArr.guid.push("");
  //     dataArr.project_itemcd.push(project_itemcd);
  //     dataArr.title.push("");
  //     dataArr.strtime.push(convertDateToStrWithTime2(start));
  //     dataArr.endtime.push(convertDateToStrWithTime2(end));
  //     dataArr.rate.push(progress);
  //     dataArr.remark.push(remark);
  //     dataArr.person.push(person);
  //     dataArr.appointment_label.push("0");
  //   }

  //   if (!isValid) {
  //     setLoading(false);
  //     return false;
  //   }
  //   const parameters: Iparameters = {
  //     procedureName: "pw6_sav_project_schedule",
  //     pageNumber: 0,
  //     pageSize: 0,
  //     parameters: {
  //       "@p_work_type": "SAVE",
  //       "@p_devmngnum": devmngnum,
  //       "@p_rowstatus": dataArr.row_status.join("|"),
  //       "@p_guid": dataArr.guid.join("|"),
  //       "@p_project_itemcd": dataArr.project_itemcd.join("|"),
  //       "@p_title": dataArr.title.join("|"),
  //       "@p_strtime": dataArr.strtime.join("|"),
  //       "@p_endtime": dataArr.endtime.join("|"),
  //       "@p_rate": dataArr.rate.join("|"),
  //       "@p_person": dataArr.rate.join("|"),
  //       "@p_remark": dataArr.rate.join("|"),
  //       "@p_appointment_label": dataArr.appointment_label.join("|"),
  //       "@p_dep_rowstatus": "",
  //       "@p_parentguid": "",
  //       "@p_childguid": "",
  //       "@p_project_itemnm": "",
  //       "@p_id": userId,
  //       "@p_pc": pc,
  //       "@p_form_id": "SPM_WEB",
  //     },
  //   };

  //   try {
  //     data = await processApi<any>("procedure", parameters);
  //   } catch (error) {
  //     data = null;
  //   }

  //   if (data.isSuccess === true) {
  //     fetchProjectDetail(devmngnum);
  //   } else {
  //     console.log("[에러발생]");
  //     console.log(data);
  //   }
  //   setLoading(false);
  // };

  const handleScaleCellPrepared = useCallback((e: ScaleCellPreparedEvent) => {
    const startDate = e.startDate;
    const endDate = e.endDate;

    if (e.scaleIndex === 1 && e.scaleType === "months") {
      const formattedStartDate = `${startDate.getFullYear()}년 ${
        startDate.getMonth() + 1
      }월`;

      e.scaleElement.innerText = `${formattedStartDate}`;
    } else if (e.scaleIndex === 0 && e.scaleType === "months") {
      const formattedStartDate = `${startDate.getMonth() + 1}월`;

      e.scaleElement.innerText = `${formattedStartDate}`;
    } else if (e.scaleIndex === 1 && e.scaleType === "weeks") {
      const formattedStartDate = `${startDate.getFullYear()}년 ${
        startDate.getMonth() + 1
      }월 ${startDate.getDate()}일`;
      const formattedEndDate = `${
        endDate.getMonth() + 1
      }월 ${endDate.getDate()}일`;

      e.scaleElement.innerText = `${formattedStartDate} - ${formattedEndDate}`;
    } else if (e.scaleIndex === 0 && e.scaleType === "weeks") {
      const formattedStartDate = `${
        startDate.getMonth() + 1
      }월 ${startDate.getDate()}일`;
      const formattedEndDate = `${
        endDate.getMonth() + 1
      }월 ${endDate.getDate()}일`;

      e.scaleElement.innerText = `${formattedStartDate} - ${formattedEndDate}`;
    } else if (e.scaleType === "days") {
      const formattedStartDate = `${
        startDate.getMonth() + 1
      }월 ${startDate.getDate()}일, ${endDate.toLocaleString("ko-KR", {
        weekday: "short",
      })}`;

      e.scaleElement.innerText = `${formattedStartDate}`;
    }
  }, []);

  const [currentTask, setCurrentTask] = useState<any>(null); // 현재 편집중인 태스크 데이터를 상태로 관리

  const onDependencyInserting = (e: DependencyInsertingEvent) => {
    const { predecessorId, successorId } = e.values;
    const successorData = task.find(
      (item) => item[DATA_ITEM_KEY] === successorId
    );
    const predecessorData = task.find(
      (item) => item[DATA_ITEM_KEY] === predecessorId
    );

    if (!successorData?.isChild || !predecessorData?.isChild) {
      e.cancel = true; // 일정항목의 경우 생성 취소
    }
  };

  const onTaskInserting = (e: TaskInsertingEvent) => {
    e.cancel = true; // 기본 생성 취소
    const { values } = e;

    const guid = uuidv4();

    setCurrentTask({
      ...values,
      project_value: projectValue,
      workType: "N",
      title: "",
      guid,
    });
    setDetailWindowVisible(true);
  };

  const onTaskEditDialogShowing = (e: TaskEditDialogShowingEvent) => {
    e.cancel = true; // 기본 팝업을 숨김
    const { key, values } = e;
    const selectedData = task.find((item) => item[DATA_ITEM_KEY] === key);

    if (!selectedData?.isChild) {
      return false;
    }

    setCurrentTask({
      ...values,
      project_value: projectValue,
      workType: "U",
      guid: selectedData?.guid,
      project: {
        project_itemcd: selectedData?.project_itemcd,
        project_itemnm: selectedData?.project_itemnm,
      },
      remark: selectedData?.remark,
      pjt_person: {
        user_id: selectedData?.person,
        user_name: selectedData?.user_name,
      },
    });
    setDetailWindowVisible(true);
  };

  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);

  return (
    <>
      <CodesContext.Provider value={{ projectItems: projectItems }}>
        <TitleContainer>
          {!isMobile ? "" : <Title>프로젝트 일정계획</Title>}
          <ButtonContainer>
            <Button onClick={search} icon="search" themeColor={"primary"}>
              조회
            </Button>
            {/* {isAdmin && view === "Scheduler" && (
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                onClick={saveProject}
                icon="list-unordered"
              >
                일정 항목 관리
              </Button>
            )} */}
            {/* {isAdmin && view === "Scheduler" && (
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                onClick={saveAllProjectItem}
                icon="file-add"
              >
                전체 일정 항목 추가
              </Button>
            )} */}
            {isAdmin && view === "Grid" && (
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="save"
                onClick={saveProject}
              >
                저장
              </Button>
            )}
          </ButtonContainer>
        </TitleContainer>
        <GridTitleContainer>
          <GridTitle>조회조건</GridTitle>
        </GridTitleContainer>
        <FilterBoxWrap>
          <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
            <tbody>
              <tr>
                <th>프로젝트 명</th>
                <td>
                  <MultiColumnComboBox
                    columns={projectColumns}
                    name="user_name"
                    data={
                      projectFilter
                        ? filterBy(projectsData, projectFilter)
                        : projectsData
                    }
                    value={projectValue}
                    textField="project"
                    filterable={true}
                    onFilterChange={handleProjectFilterChange}
                    onChange={handleChange}
                    className="required"
                  ></MultiColumnComboBox>
                </td>
                <th>프로젝트 번호</th>
                <td>
                  <Input
                    name="user_name"
                    type="text"
                    value={projectValue ? projectValue.devmngnum : ""}
                    className="readonly"
                    // onChange={filterInputChange}
                  />
                </td>
                <th>표시형식</th>
                <td>
                  <RadioGroup
                    data={scaleTypes}
                    value={scale}
                    onChange={(e) => setScale(e.value)}
                    layout="horizontal"
                    disabled={view === "Grid"}
                  />
                </td>
                {isAdmin && <th>데이터 보기 유형</th>}
                {isAdmin && (
                  <td>
                    <RadioGroup
                      data={viewTypes}
                      value={view}
                      onChange={(e) => setView(e.value)}
                      layout="horizontal"
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </FilterBox>
        </FilterBoxWrap>

        <GridContainer height={"78%"}>
          {view === "Scheduler" ? (
            <Gantt
              taskListWidth={500}
              scaleType={scale}
              height={"100%"}
              onDependencyInserted={onDependencyInserted}
              onDependencyInserting={onDependencyInserting}
              onDependencyDeleted={onDependencyDeleted}
              onTaskInserting={onTaskInserting}
              onTaskInserted={onTaskInserted}
              onTaskDeleted={onTaskDeleted}
              onTaskUpdated={onTaskUpdated}
              onScaleCellPrepared={handleScaleCellPrepared}
              // onResourceAssigned={onResourceAssigned}
              // onResourceUnassigned={onResourceUnassigned}
              onTaskEditDialogShowing={onTaskEditDialogShowing}
            >
              <Tasks dataSource={task} />
              <Dependencies dataSource={dependency} />
              {/* <Resources dataSource={resource} />
              <ResourceAssignments dataSource={assignment} /> */}
              {projectValue && (
                <Toolbar>
                  <Item name="undo" />
                  <Item name="redo" />
                  <Item name="separator" />
                  <Item name="collapseAll" />
                  <Item name="expandAll" />
                  <Item name="separator" />
                  <Item name="addTask" />
                  <Item name="deleteTask" />
                  <Item name="separator" />
                  <Item name="zoomIn" />
                  <Item name="zoomOut" />
                </Toolbar>
              )}

              <Column dataField="title" caption="일정 항목" width={300} />
              <Column
                dataField="start"
                caption="시작일자"
                format={"yyyy-MM-dd"}
                alignment={"center"}
              />
              <Column
                dataField="end"
                format={"yyyy-MM-dd"}
                caption="종료일자"
                alignment={"center"}
              />

              <Validation autoUpdateParentTasks />
              <Editing enabled={isAdmin} allowTaskAdding={projectValue} />
            </Gantt>
          ) : (
            <Grid
              style={{ height: `100%` }}
              data={process(
                gridData.data.map((row) => ({
                  ...row,
                  start: (typeof row.start === "string") ? toDate(row.start) : row.start,
                  end: (typeof row.end === "string") ? toDate(row.end) : row.end,
                  [SELECTED_FIELD]: gridSelectedState[gridIdGetter(row)],
                })),
                gridDataState
              )}
              {...gridDataState}
              onDataStateChange={onGridDataStateChange}
              //선택 기능
              dataItemKey={DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onGridSelectionChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //incell 수정 기능
              onItemChange={onGridItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridToolbar>
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="plus"
                  onClick={addGridRow}
                />
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="minus"
                  onClick={removeGridRow}
                />
              </GridToolbar>
              <GridColumn
                field="rowstatus"
                title=" "
                width={40}
                editable={false}
              />
              <GridColumn
                field="project_itemcd"
                title="일정 항목 코드"
                width={170}
                editable={false}
                footerCell={gridTotalFooterCell}
              />
              <GridColumn
                field="project_itemcd"
                title="일정 항목"
                width={170}
                cell={ProjectItemCell}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="start"
                title="시작일자"
                width={150}
                cell={DateCell}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="end"
                title="종료일자"
                width={150}
                cell={DateCell}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="title"
                title="제목"
                cell={NameCell}
                width={400}
              />
              <GridColumn
                field="progress"
                title="진행률(%)"
                width={100}
                cell={NumberPercentCell}
              />
              <GridColumn
                field="remark"
                title="비고"
                width={300}
                cell={NameCell}
              />
              <GridColumn
                field="guid"
                title="Guid"
                width={240}
                editable={false}
              />
            </Grid>
          )}
        </GridContainer>
      </CodesContext.Provider>

      {detailWindowVisible && (
        <DetailWindow
          setVisible={setDetailWindowVisible}
          data={currentTask}
          reload={() => {
            const devmngnum = getCodeFromValue(projectValue, "devmngnum");
            fetchProjectDetail(devmngnum);
          }}
        />
      )}
    </>
  );
};

const ProjectItemCell = (props: GridCellProps) => {
  const { projectItems } = useContext(CodesContext);

  return projectItems ? (
    <ComboBoxCell
      columns={projectItemsColumns}
      data={projectItems}
      textField="project_itemnm"
      valueField="project_itemcd"
      {...props}
    />
  ) : (
    <td />
  );
};

export default App;
