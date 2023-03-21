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
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../components/CommonFunction";
import { Title, TitleContainer } from "../CommonStyled";

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

function App() {
  const processApi = useApi();
  const userid = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [task, setTask] = useState<TTask[]>([]);
  const [assignment, setAssignment] = useState<TAssignment[]>([]);
  const [dependency, setDependency] = useState<TDependency[]>([]);
  const [resource, setResource] = useState<TResource[]>([]);

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
    fetchMain();
  }, []);

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_GANTT_Q",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "Q",
    },
  };

  //그리드 데이터 조회
  const fetchMain = async () => {
    // if (!permissions?.view) return;
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
  return (
    <>
      <TitleContainer>
        <Title>GANTT</Title>
      </TitleContainer>
      <Gantt
        taskListWidth={500}
        scaleType="weeks"
        height={"90vh"}
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
        <Resources dataSource={resource} />
        <ResourceAssignments dataSource={assignment} />

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
        <Editing enabled />
      </Gantt>
    </>
  );
}

export default App;
