import { Button } from "@progress/kendo-react-buttons";
import {
  createDataTree,
  extendDataItem,
  getSelectedState,
  mapTree,
  TreeList,
  TreeListDraggableRow,
  TreeListExpandChangeEvent,
  TreeListItemChangeEvent,
  TreeListRowDragEvent,
  TreeListSelectionChangeEvent,
  treeToFlat,
} from "@progress/kendo-react-treelist";
import { bytesToBase64 } from "byte-base64";
import React, { useCallback, useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import {
  ButtonContainer,
  GridContainer,
  Title,
  TitleContainer,
} from "../CommonStyled";
import {
  UseParaPc,
  UseGetValueFromSessionItem,
  UsePermissions,
} from "../components/CommonFunction";
import { columns } from "../store/columns/CHAT_A0002_C";
import {
  EDIT_FIELD,
  EXPANDED_FIELD,
  SELECTED_FIELD,
} from "../components/CommonString";
import { Renderers } from "../components/Renderers/TreeListRenderers";
import { useApi } from "../hooks/api";
import { isLoading } from "../store/atoms";
import { Iparameters, TPermissions } from "../store/types";
import { getter } from "@progress/kendo-data-query";

interface IQnaData {
  idx: number;
  id?: string;
  rowstatus: string;
  question: string;
  parent_question: string;
  answer: string;
}

interface IAppState {
  data: IQnaData[];
  expanded: number[];
  editItem: IQnaData | undefined;
  editItemField: string | undefined;
  changes: boolean;
}
const SUB_ITEMS_FIELD: string = "questions";
const expandField = EXPANDED_FIELD;
const editField = EDIT_FIELD;
const DATA_ITEM_KEY = "idx";
const idGetter = getter(DATA_ITEM_KEY);

const headerSelectionValue = (dataState: any, selectedState: any) => {
  let allSelected = true;

  mapTree(dataState, SUB_ITEMS_FIELD, (item) => {
    allSelected = allSelected && selectedState[idGetter(item)];
    return item;
  });

  return allSelected;
};

let deletedMainRows: IQnaData[] = [];

const CHAT_BOT_MNG: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const processApi = useApi();

  const [state, setState] = React.useState<IAppState>({
    data: [],
    expanded: [1, 2, 32],
    editItem: undefined,
    editItemField: undefined,
    changes: false,
  });

  let renderers;

  const enterEdit = (dataItem: IQnaData, field: string) => {
    const flatData: any = treeToFlat(state.data, "question", SUB_ITEMS_FIELD);

    const newData = flatData.map((item: any) =>
      item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            questions: [],
          }
        : { ...item, questions: [] }
    );

    const dataTree: any = createDataTree(
      newData,
      (i: any) => i["question"],
      (i: any) => i["parent_question"],
      SUB_ITEMS_FIELD
    );

    setState({
      ...state,
      //data: dataTree,
      editItem: { ...dataItem },
      editItemField: field,
    });
  };

  const exitEdit = () => {
    setState({
      ...state,
      editItem: undefined,
      editItemField: undefined,
    });
  };
  renderers = new Renderers(enterEdit, exitEdit, editField);

  const onExpandChange = (event: TreeListExpandChangeEvent) => {
    setState({
      ...state,
      expanded: event.value
        ? state.expanded.filter((id) => id !== event.dataItem[DATA_ITEM_KEY])
        : [...state.expanded, event.dataItem[DATA_ITEM_KEY]],
    });
  };

  const itemChange = (event: TreeListItemChangeEvent) => {
    const field: any = event.field;

    setState({
      ...state,
      changes: true,
      data: mapTree(state.data, SUB_ITEMS_FIELD, (item) =>
        event.dataItem[DATA_ITEM_KEY] === item[DATA_ITEM_KEY]
          ? extendDataItem(item, SUB_ITEMS_FIELD, { [field]: event.value })
          : item
      ),
    });
  };

  const { data, changes, expanded, editItem, editItemField } = state;
  const editItemId = editItem ? editItem[DATA_ITEM_KEY] : null;

  useEffect(() => {
    if (permissions !== null) {
      fetchMainGrid();
    }
  }, [permissions]);

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);

    const queryStr = "SELECT * FROM chatBotManager";
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows.map((row: IQnaData, idx: number) => ({
        ...row,
        idx,
        rowstatus: "",
      }));

      if (totalRowCnt > 0) {
        const dataTree: any = createDataTree(
          rows,
          (i: any) => i["question"],
          (i: any) => i["parent_question"],
          SUB_ITEMS_FIELD
        );

        setState((prev) => ({
          ...prev,
          data: dataTree,
        }));
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const userid = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const onSaveClick = async () => {
    const flatData: any = treeToFlat(state.data, "question", SUB_ITEMS_FIELD);
    // flatData.forEach((item: any) => delete item[SUB_ITEMS_FIELD]);

    // const dataItem = flatData.filter((item: any) => {
    //   return (
    //     (item.rowstatus === "N" || item.rowstatus === "U") &&
    //     item.rowstatus !== undefined
    //   );
    // });

    // if (dataItem.length === 0 && deletedMainRows.length === 0) return false;

    try {
      let msg = "";
      for (const item of deletedMainRows) {
        const { id = "", question, parent_question = "", answer } = item;

        //파라미터
        const paraSaved: Iparameters = {
          procedureName: "P_CHAT_A0002_S",
          pageNumber: 0,
          pageSize: 0,
          parameters: {
            "@p_work_type": "D",
            "@p_id": id,
            "@p_question": question,
            "@p_parent_question": parent_question,
            "@p_answer": answer,
            "@p_userid": userid,
            "@p_pc": pc,
          },
        };
        let data: any;

        try {
          data = await processApi<any>("procedure", paraSaved);
        } catch (error) {
          data = null;
        }

        if (data.isSuccess === true) {
          msg = data.resultMessage;
        } else {
          console.log("[에러발생]");
          console.log(data);
          throw data.resultMessage;
        }
      }
      for (const item of flatData) {
        const {
          id = "",
          rowstatus,
          question,
          parent_question = "",
          answer,
        } = item;

        //파라미터
        const paraSaved: Iparameters = {
          procedureName: "P_CHAT_A0002_S",
          pageNumber: 0,
          pageSize: 0,
          parameters: {
            "@p_work_type": rowstatus === "N" ? "N" : "U",
            "@p_id": id,
            "@p_question": question,
            "@p_parent_question": parent_question,
            "@p_answer": answer,
            "@p_userid": userid,
            "@p_pc": pc,
          },
        };
        let data: any;

        try {
          data = await processApi<any>("procedure", paraSaved);
        } catch (error) {
          data = null;
        }

        if (data.isSuccess === true) {
          msg = data.resultMessage;
        } else {
          console.log("[에러발생]");
          console.log(data);
          throw data.resultMessage;
        }
      }
      alert(msg);
      fetchMainGrid();
      deletedMainRows = [];
      setSelectedState({});
    } catch (e) {
      alert(e);
    }
  };

  const onAddClick = () => {
    // tree to flat
    const flatData: any = treeToFlat(state.data, "question", SUB_ITEMS_FIELD);

    const newRecord = {
      idx: flatData.length + 1,
      rowstatus: "N",
      question: "",
      parent_question: "",
      answer: "",
    };

    setState({
      ...state,
      data: [...state.data, newRecord],
    });
  };

  const onRemoveClick = () => {
    // value 가 false인 속성 삭제
    for (var prop in selectedState) {
      if (!selectedState[prop]) {
        delete selectedState[prop];
      }
    }

    const parameters = Object.keys(selectedState);

    // tree to flat
    const flatData: any = treeToFlat(state.data, "question", SUB_ITEMS_FIELD);
    flatData.forEach((item: any) => delete item[SUB_ITEMS_FIELD]);

    const newData: any = [];

    flatData.forEach((item: any) => {
      if (parameters.includes(item[DATA_ITEM_KEY] + "")) {
        deletedMainRows.push(item);
      } else {
        newData.push(item);
      }
    });

    // flat to tree
    const dataTree: any = createDataTree(
      newData,
      (i: any) => i["question"],
      (i: any) => i["parent_question"],
      SUB_ITEMS_FIELD
    );

    setState({
      ...state,
      data: dataTree,
    });
  };

  const [selectedState, setSelectedState] = React.useState<{
    [id: string]: number[] | boolean;
  }>({});

  const onSelectionChange = useCallback(
    (event: TreeListSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState,
        dataItemKey: DATA_ITEM_KEY,
      });
      setSelectedState(newSelectedState);
    },
    [selectedState]
  );

  const onRowDrop = (event: TreeListRowDragEvent) => {
    // 드래그 데이터의 parent_question를 드롭 대상 데이터의 question 값으로 업데이트
    let isValid = true;
    state.data.forEach((item) => {
      if (item["question"] === "") {
        isValid = false;
        return false;
      }
    });
    if (!isValid) {
      alert("질문을 입력하세요.");
      return false;
    }

    const { draggedOver, dragged } = event;

    let parentData: any = state.data; // 드롭 데이터 변수
    let childData: any = state.data; // 드래그 데이터 변수

    // 드롭 데이터 구하기
    if (draggedOver) {
      draggedOver.forEach((item, idx) => {
        parentData =
          idx > 0 ? parentData[SUB_ITEMS_FIELD][item] : parentData[item];
      });
    }
    // 드래그 데이터 구하기
    if (dragged) {
      dragged.forEach((item, idx) => {
        childData =
          idx > 0 ? childData[SUB_ITEMS_FIELD][item] : childData[item];
      });
    }

    const parentQuestion = parentData["question"]; // 드롭 데이터 question 필드 값
    const childQuestion = childData["question"]; // 드래그 데이터 question 필드 값

    // tree to flat
    const flatData: any = treeToFlat(state.data, "question", SUB_ITEMS_FIELD);
    flatData.forEach((item: any) => delete item[SUB_ITEMS_FIELD]);

    // 드래그 데이터의 parent_question를 드롭 대상 데이터의 question 값으로 수정
    flatData.forEach((item: IQnaData) => {
      if (item["question"] === childQuestion) {
        item["parent_question"] = parentQuestion;
      }
    });

    // flat to tree
    const dataTree: any = createDataTree(
      flatData,
      (i: any) => i["question"],
      (i: any) => i["parent_question"],
      SUB_ITEMS_FIELD
    );

    // 데이터 적용
    setState({
      ...state,
      data: dataTree,
    });
  };

  return (
    <>
      <TitleContainer>
        <Title>Chatbot 관리</Title>

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
      </TitleContainer>

      <GridContainer>
        <TreeList
          style={{ maxHeight: "510px", overflow: "auto" }}
          data={mapTree(data, SUB_ITEMS_FIELD, (item) =>
            extendDataItem(item, SUB_ITEMS_FIELD, {
              selected: selectedState[idGetter(item)],
              [expandField]: expanded.includes(item[DATA_ITEM_KEY]),
              [editField]:
                item[DATA_ITEM_KEY] === editItemId ? editItemField : undefined,
            })
          )}
          editField={editField}
          expandField={expandField}
          subItemsField={SUB_ITEMS_FIELD}
          cellRender={renderers.cellRender}
          rowRender={renderers.rowRender}
          onItemChange={itemChange}
          onExpandChange={onExpandChange}
          columns={columns.map((column) => ({
            ...column,
            editCell:
              editItemField === column.field ? column.editCell : undefined,
          }))}
          dataItemKey={DATA_ITEM_KEY}
          selectedField={SELECTED_FIELD}
          selectable={{
            enabled: true,
            mode: "multiple",
          }}
          onSelectionChange={onSelectionChange}
          //
          onRowDrop={onRowDrop}
          row={TreeListDraggableRow}
        />
      </GridContainer>
    </>
  );
};

export default CHAT_BOT_MNG;
