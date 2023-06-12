import React, { useEffect, useState } from "react";
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
import { ComboBox, MultiColumnComboBox } from "@progress/kendo-react-dropdowns";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  GridToolbar,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { EDIT_FIELD, SELECTED_FIELD } from "../components/CommonString";
import { DataResult, State, process } from "@progress/kendo-data-query";
import { getter } from "@progress/kendo-react-common";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import DateCell from "../components/Cells/DateCell";
import NameCell from "../components/Cells/NameCell";
import NumberCell from "../components/Cells/NumberCell";

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

function App() {
  const processApi = useApi();
  const userid = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [task, setTask] = useState<TTask[]>([]);
  const [assignment, setAssignment] = useState<TAssignment[]>([]);
  const [dependency, setDependency] = useState<TDependency[]>([]);
  const [resource, setResource] = useState<TResource[]>([]);

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
    fetchSaved(para);
  };
  const onDependencyDeleted = (e: DependencyDeletedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Dependency",
      id: String(key).padStart(10, "0"),
    };
    fetchSaved(para);
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
    fetchSaved(para);
  };
  const onTaskDeleted = (e: TaskDeletedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Task",
      id: String(key).padStart(10, "0"),
    };
    fetchSaved(para);
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
    fetchSaved(para);
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
    fetchSaved(para);
  };
  const onResourceUnassigned = (e: ResourceUnassignedEvent) => {
    const { key } = e;

    const para: TSavedPara = {
      work_type: "D",
      type: "Assignment",
      id: String(key).padStart(10, "0"),
    };
    fetchSaved(para);
  };

  useEffect(() => {
    fetchProjectList();
    // fetchMain();
  }, []);

  useEffect(() => {
    if (projectValue && projectValue.devmngnum) {
      fetchProjectDetail(projectValue.devmngnum);
    }
  }, [projectValue]);

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_GANTT_Q",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "Q",
    },
  };

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
      const childRows: TTask[] = data.tables[1].Rows.map((row: any) => ({
        ...row,
        id: getIntegerForString(row.guid),
        parentId: getIntegerForString(row.project_itemcd),
        title: row.title,
        start: new Date(row.start_time),
        end: new Date(row.end_time),
        progress: row.rate,
      }));

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

  //그리드 데이터 조회
  const fetchMain = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows1 = data.tables[0].Rows.map((item: TTask) => ({
        ...item,
        id: Number(item.id),
        parentId: Number(item.parentId),
        start: new Date(item.start),
        end: new Date(item.end),
      }));
      const rows2 = data.tables[1].Rows.map((item: TDependency) => ({
        ...item,
        id: Number(item.id),
        predecessorId: Number(item.predecessorId),
        successorId: Number(item.successorId),
        type: Number(item.type),
      }));
      const rows3 = data.tables[2].Rows.map((item: TAssignment) => ({
        ...item,
        id: Number(item.id),
        taskId: Number(item.taskId),
        resourceId: Number(item.resourceId),
      }));
      const rows4 = data.tables[3].Rows;

      if (totalRowCnt > 0) {
        setTask(rows1);
        setDependency(rows2);
        setAssignment(rows3);
        setResource(rows4);
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };
  // 데이터 저장
  const fetchSaved = async (savedPara: TSavedPara) => {
    // if (!permissions?.save) return;
    let data: any;

    const {
      work_type,
      type,
      id = "",
      parentId = "",
      title = "",
      start = "",
      end = "",
      progress = "",
      predecessorId = "",
      successorId = "",
      dependencyType = "",
      taskId = "",
      resourceId = "",
    } = savedPara;

    const parameters: Iparameters = {
      procedureName: "P_GANTT_S",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": work_type,
        "@p_type": type,
        "@p_id": id,
        "@p_parentId": parentId,
        "@p_title": title,
        "@p_start": start,
        "@p_end": end,
        "@p_progress": progress,
        "@p_predecessorId": predecessorId,
        "@p_successorId": successorId,
        "@p_dependencyType": dependencyType,
        "@p_taskId": taskId,
        "@p_resourceId": resourceId,
        "@p_userid": userid,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchMain();
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const search = () => {};

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

  // 그리드 선택 행 추가
  const addGridRow = () => {
    const selectedKey = Number(Object.keys(gridSelectedState)[0]);
    const selectedIndex = gridData.data.findIndex(
      (row) => row.meetingseq === selectedKey,
    );

    let newRows = [...gridData.data];

    if (selectedIndex !== -1) {
      // 선택된 행이 있을 경우, 해당 행 다음에 새 데이터 삽입
      newRows.splice(selectedIndex + 1, 0, {
        rowstatus: "N",
        meetingseq: gridData.total + 1,
        reqdt: null,
        finexpdt: null,
        cust_browserable: "Y",
        client_finexpdt: null,
      });
    } else {
      // 선택된 행이 없을 경우, 배열의 끝에 새 데이터 추가
      newRows.push({
        rowstatus: "N",
        meetingseq: gridData.total + 1,
        reqdt: null,
        finexpdt: null,
        cust_browserable: "Y",
        client_finexpdt: null,
      });
    }

    setGridData(process(newRows, gridDataState));
  };

  const removeGridRow = () => {
    const selectedKey = Object.keys(gridSelectedState)[0];
    const selectedIndex = gridData.data.findIndex(
      (row) => row.meetingseq.toString() === selectedKey,
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
          [newRows[nextSelectedIndex].meetingseq]: true,
        });
      } else {
        setGridSelectedState({});
      }
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

  return (
    <>
      <TitleContainer>
        <Title>프로젝트 일정계획</Title>{" "}
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>프로젝트 명</th>
              <td>
                <MultiColumnComboBox
                  columns={[
                    {
                      field: "devmngnum",
                      header: "프로젝트번호",
                      width: 100,
                    },
                    {
                      field: "custnm",
                      header: "업체명",
                      width: 100,
                    },
                    {
                      field: "project",
                      header: "프로젝트명",
                      width: 150,
                    },
                    {
                      field: "is_registered",
                      header: "등록여부",
                      width: 60,
                    },
                  ]}
                  name="user_name"
                  data={projectsData}
                  value={projectValue}
                  textField="project"
                  onChange={handleChange}
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
              <th>데이터 보기 유형</th>
              <td>
                <RadioGroup
                  data={viewTypes}
                  value={view}
                  onChange={(e) => setView(e.value)}
                  layout="horizontal"
                />
              </td>
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
            style={{
              height: `calc(100% - 100px )`,
            }}
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
            <GridColumn field="rowstatus" title=" " width={40} />
            <GridColumn
              field="project_itemcd"
              title="일정 항목 코드"
              width={200}
              footerCell={gridTotalFooterCell}
            />
            <GridColumn
              field="project_itemnm"
              title="일정 항목"
              width={200}
              editable={false}
            />
            <GridColumn
              field="start"
              title="시작일자"
              width={170}
              cell={DateCell}
            />
            <GridColumn
              field="end"
              title="종료일자"
              width={170}
              cell={DateCell}
            />
            <GridColumn
              field="title"
              title="제목"
              cell={NameCell}
              width={300}
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
    </>
  );
}

export default App;
