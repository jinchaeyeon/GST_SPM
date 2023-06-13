import React, { createContext, useContext, useEffect, useState } from "react";
import Gantt, {
  Tasks,
  Dependencies,
  Resources,
  ResourceAssignments,
  Column,
  Editing,
  Toolbar,
  Item,
  Validation,
} from "devextreme-react/gantt";
import "devextreme/dist/css/dx.light.css";
import "devexpress-gantt/dist/dx-gantt.min.css";
import {
  DependencyDeletedEvent,
  DependencyInsertedEvent,
  ResourceAssignedEvent,
  ResourceUnassignedEvent,
  TaskDeletedEvent,
  TaskInsertedEvent,
  TaskUpdatedEvent,
} from "devextreme/ui/gantt";
import { useApi } from "../hooks/api";
import { Iparameters } from "../store/types";
import {
  convertDateToStrWithTime2,
  getCodeFromValue,
  getGridItemChangedData,
  handleKeyPressSearch,
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../components/CommonFunction";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  GridContainerWrap,
  Title,
  TitleContainer,
} from "../CommonStyled";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import {
  ComboBox,
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
import { EDIT_FIELD, SELECTED_FIELD } from "../components/CommonString";
import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  process,
} from "@progress/kendo-data-query";
import { getter } from "@progress/kendo-react-common";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import DateCell from "../components/Cells/DateCell";
import NameCell from "../components/Cells/NameCell";
import NumberCell from "../components/Cells/NumberCell";
import { bytesToBase64 } from "byte-base64";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import { v4 as uuidv4 } from "uuid";
import { isLoading, loginResultState } from "../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";

type TSavedPara = {
  work_type: "N" | "U" | "D";
  type: "Task" | "Dependency" | "Assignment";
  id?: string;
  parentId?: string;
  title?: string;
  start?: string;
  end?: string;
  progress?: string;
  predecessorId?: string;
  successorId?: string;
  dependencyType?: string;
  taskId?: string;
  resourceId?: string;
};

type TTask = {
  id: string;
  parentId: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
};
type TDependency = {
  id: string;
  predecessorId: string;
  successorId: string;
  type: string;
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

const projectItemQueryStr = `SELECT project_itemcd,
prntitemcd,
project_itemnm,
remark
FROM BizGST.dbo.CR504T`;

const projectColumns = [
  {
    field: "devmngnum",
    header: "프로젝트번호",
    width: 120,
  },
  {
    field: "custnm",
    header: "업체명",
    width: 180,
  },
  {
    field: "project",
    header: "프로젝트명",
    width: 450,
  },
  {
    field: "is_registered",
    header: "등록여부",
    width: 80,
  },
];

const CodesContext = createContext<{
  projectItems: any[];
}>({
  projectItems: [],
});

const deletedGridData: any[] = [];

const App = () => {
  const processApi = useApi();
  const userid = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

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
  const [gridData, setGridData] = useState<DataResult>(
    process([], gridDataState),
  );

  const [gridSelectedState, setGridSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const gridIdGetter = getter(DATA_ITEM_KEY);

  const setLoading = useSetRecoilState(isLoading);

  const [projectsData, setProjectsData] = useState<TTask[]>([]);
  const [projectValue, setProjectValue] = useState<any>(null);

  const [scale, setScale] = useState<GanttScaleType>("weeks");
  const [view, setView] = useState<"Scheduler" | "Grid">("Scheduler");

  const onDependencyInserted = (e: DependencyInsertedEvent) => {
    const { values } = e;
    const { predecessorId, successorId, type } = values;
    const para: TSavedPara = {
      work_type: "N",
      type: "Dependency",
      predecessorId: String(predecessorId).padStart(10, "0"),
      successorId: String(successorId).padStart(10, "0"),
      dependencyType: type,
    };
    // fetchSaved(para);
  };
  const onDependencyDeleted = (e: DependencyDeletedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Dependency",
      id: String(key).padStart(10, "0"),
    };
    // fetchSaved(para);
  };
  const onTaskInserted = (e: TaskInsertedEvent) => {
    const { values } = e;
    const { start, end, progress, title, parentId = "0000000000" } = values;
    const para: TSavedPara = {
      work_type: "N",
      type: "Task",
      start: convertDateToStrWithTime2(start),
      end: convertDateToStrWithTime2(end),
      progress,
      title,
      parentId: String(parentId).padStart(10, "0"),
    };
    // fetchSaved(para);
  };
  const onTaskDeleted = (e: TaskDeletedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Task",
      id: String(key).padStart(10, "0"),
    };
    // fetchSaved(para);
  };
  const onTaskUpdated = (e: TaskUpdatedEvent) => {
    const { values, key } = e;
    const updatedData = task.find((item) => item.id === key);
    const {
      start = updatedData?.start,
      end = updatedData?.end,
      progress = updatedData?.progress,
      title = updatedData?.title,
      parentId = updatedData?.parentId,
    } = values;

    const para: TSavedPara = {
      work_type: "U",
      type: "Task",
      id: String(key).padStart(10, "0"),
      start: convertDateToStrWithTime2(start),
      end: convertDateToStrWithTime2(end),
      progress,
      title,
      parentId,
    };
    // fetchSaved(para);
  };
  const onResourceAssigned = (e: ResourceAssignedEvent) => {
    const { values } = e;
    const { taskId, resourceId } = values;

    const para: TSavedPara = {
      work_type: "N",
      type: "Assignment",
      taskId: String(taskId).padStart(10, "0"),
      resourceId: String(resourceId).padStart(10, "0"),
    };
    // fetchSaved(para);
  };
  const onResourceUnassigned = (e: ResourceUnassignedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Assignment",
      id: String(key).padStart(10, "0"),
    };
    // fetchSaved(para);
  };

  useEffect(() => {
    fetchProjectList();
    fetchProjectItems();
  }, []);

  useEffect(() => {
    if (projectValue && projectValue.devmngnum) {
      fetchProjectDetail(projectValue.devmngnum);
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

  const fetchProjectList = async () => {
    let data: any;

    try {
      data = await processApi<any>("project-schedule-list");
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
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

    if (data.isSuccess === true) {
      // 일정항목 데이터
      const parentRows: TTask[] = data.tables[0].Rows.map((row: any) => ({
        id: getIntegerForString(row.project_itemcd),
        parentId:
          row.prntitemcd === "" ? null : getIntegerForString(row.prntitemcd),
        title: row.project_itemnm,
        start: new Date(),
        end: new Date(),
        progress: 0,
      }));
      // 일정 데이터
      const childRows: TTask[] = data.tables[1].Rows.map(
        (row: any, idx: number) => ({
          ...row,
          idx,
          id: getIntegerForString(row.guid),
          parentId: getIntegerForString(row.project_itemcd),
          title: row.title,
          start: new Date(row.start_time),
          end: new Date(row.end_time),
          progress: row.rate,
        }),
      );

      // 일정항목과 일정을 합쳐서 하나의 Task 데이터로 만들고 데이터 순서 정렬
      const taskRows = reorderTasks([...parentRows, ...childRows]);

      // 디펜던시(화살표) 데이터
      const dependancyRows: TDependency[] = data.tables[2].Rows.map(
        (row: any) => ({
          id: getIntegerForString(row.guid),
          predecessorId: getIntegerForString(row.parent_guid),
          successorId: getIntegerForString(row.guid),
          type: 0,
        }),
      );

      setGridData(process(childRows, gridDataState));
      setTask(taskRows);
      setDependency(dependancyRows);
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

  // 데이터 저장
  const saveProjectGrid = async () => {
    let data: any;

    if (!projectValue) {
      alert("프로젝트 명은 필수 입력 항목입니다.");
    }

    setLoading(true);
    const devmngnum = getCodeFromValue(projectValue, "devmngnum");

    type TGridDataArr = {
      row_status: string[];
      guid: string[];
      project_itemcd: string[];
      title: string[];
      strtime: string[];
      endtime: string[];
      rate: string[];
      appointment_label: string[];
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
    };

    for (const [idx, item] of gridData.data.entries()) {
      const { rowstatus, guid, project_itemcd, title, start, end, progress } =
        item;

      if (!rowstatus) continue;

      gridDataArr.row_status.push(rowstatus);
      gridDataArr.guid.push(guid);
      gridDataArr.project_itemcd.push(project_itemcd);
      gridDataArr.title.push(title);
      gridDataArr.strtime.push(convertDateToStrWithTime2(start));
      gridDataArr.endtime.push(convertDateToStrWithTime2(end));
      gridDataArr.rate.push(progress);
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
      gridDataArr.appointment_label.push("");
    });

    const parameters: Iparameters = {
      procedureName: "pw6_sav_project_schedule",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "SAVE",
        "@p_devmngnum": devmngnum,
        "@p_row_status": gridDataArr.row_status.join("|"),
        "@p_guid": gridDataArr.guid.join("|"),
        "@p_project_itemcd": gridDataArr.project_itemcd.join("|"),
        "@p_title": gridDataArr.title.join("|"),
        "@p_strtime": gridDataArr.strtime.join("|"),
        "@p_endtime": gridDataArr.endtime.join("|"),
        "@p_rate": gridDataArr.rate.join("|"),
        "@p_appointment_label": gridDataArr.appointment_label.join("|"),
        "@p_dep_row_status": "",
        "@p_parent_guid": "",
        "@p_child_guid": "",
        "@p_project_itemnm": "",
        "@p_remark": "",
        "@p_id": userId,
        "@p_pc": pc,
        "@p_form_id": "SPM_WEB",
      },
    };

    console.log("parameters");
    console.log(parameters);
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchProjectDetail(devmngnum);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const search = () => {
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
    const newData = gridData.data.map((item) =>
      item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : {
            ...item,
            [EDIT_FIELD]: undefined,
          },
    );

    setGridData((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    const newData = gridData.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setGridData((prev) => {
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

  const addGridRow = () => {
    let end = new Date();
    end.setDate(end.getDate() + 1);

    const guid = uuidv4();

    let newRows = [
      {
        rowstatus: "N",
        [DATA_ITEM_KEY]: getIntegerForString(guid),
        guid,
        start: new Date(),
        end,
        progress: 0,
        client_finexpdt: null,
      },
      ...gridData.data,
    ];

    setGridData(process(newRows, gridDataState));
  };

  const removeGridRow = () => {
    const selectedKey = Object.keys(gridSelectedState)[0];
    const selectedIndex = gridData.data.findIndex(
      (row) => row[DATA_ITEM_KEY].toString() === selectedKey,
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
        (item) => item[DATA_ITEM_KEY].toString() === selectedKey,
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

  return (
    <>
      <CodesContext.Provider value={{ projectItems: projectItems }}>
        <TitleContainer>
          <Title>프로젝트 일정계획</Title>{" "}
          <ButtonContainer>
            <Button onClick={search} icon="search" themeColor={"primary"}>
              조회
            </Button>
            {isAdmin && (
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

        <GridContainer height={"85%"}>
          {view === "Scheduler" ? (
            <Gantt
              taskListWidth={500}
              scaleType={scale}
              height={"100%"}
              onDependencyInserted={onDependencyInserted}
              onDependencyDeleted={onDependencyDeleted}
              onTaskInserted={onTaskInserted}
              onTaskDeleted={onTaskDeleted}
              onTaskUpdated={onTaskUpdated}
              onResourceAssigned={onResourceAssigned}
              onResourceUnassigned={onResourceUnassigned}
            >
              <Tasks dataSource={task} />
              <Dependencies dataSource={dependency} />
              {/*<Resources dataSource={resource} />
        <ResourceAssignments dataSource={assignment} /> */}

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

              <Column dataField="title" caption="Subject" width={300} />
              <Column dataField="start" caption="Start Date" />
              <Column dataField="end" caption="End Date" />

              <Validation autoUpdateParentTasks />
              {/* <Editing enabled /> */}
            </Gantt>
          ) : (
            <Grid
              style={{ height: `100%` }}
              data={process(
                gridData.data.map((row) => ({
                  ...row,
                  [SELECTED_FIELD]: gridSelectedState[gridIdGetter(row)],
                })),
                gridDataState,
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
              />
              <GridColumn
                field="start"
                title="시작일자"
                width={150}
                cell={DateCell}
              />
              <GridColumn
                field="end"
                title="종료일자"
                width={150}
                cell={DateCell}
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
                cell={NumberCell}
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
                width={150}
                editable={false}
              />
            </Grid>
          )}
        </GridContainer>
      </CodesContext.Provider>
    </>
  );
};

const projectItemsColumns = [
  {
    field: "project_itemcd",
    header: "코드",
    width: 100,
  },
  {
    field: "project_itemnm",
    header: "코드명",
    width: 100,
  },
  {
    field: "remark",
    header: "비고",
    width: 200,
  },
];
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
