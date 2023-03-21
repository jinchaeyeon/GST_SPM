import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  GridSortChangeEvent,
} from "@progress/kendo-react-grid";
import React, { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import {
  ButtonContainer,
  GridTitle,
  GridTitleContainer,
} from "../../CommonStyled";
import { useApi } from "../../hooks/api";
import { isLoading } from "../../store/atoms";
import { Iparameters, TPermissions } from "../../store/types";
import CenterCell from "../Cells/CenterCell";
import {
  convertDateToStr,
  dateformat2,
  getGridItemChangedData,
  UseGetValueFromSessionItem,
  UseParaPc,
  UsePermissions,
} from "../CommonFunction";
import { EDIT_FIELD, SELECTED_FIELD } from "../CommonString";
import { CellRender, RowRender } from "../Renderers/Renderers";

const DATA_ITEM_KEY = "seq";
let deletedRows: object[] = [];

const CommentsGrid = (props: {
  ref_key: string;
  form_id: string;
  table_id: string;
  style: { height: string };
}) => {
  const { ref_key, form_id, table_id, style } = props;
  const { height } = style;

  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const orgdiv = UseGetValueFromSessionItem("orgdiv");
  const user_id = UseGetValueFromSessionItem("user_id");
  const user_name = UseGetValueFromSessionItem("user_name");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter = getter(DATA_ITEM_KEY);

  const onDataStateChange = (event: GridDataStateChangeEvent) => {
    setDataState(event.dataState);
  };

  const [dataState, setDataState] = useState<State>({
    sort: [],
  });

  const [dataResult, setDataResult] = useState<DataResult>(
    process([], dataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
  };

  const onSortChange = (e: GridSortChangeEvent) => {
    setDataState((prev: State) => ({ ...prev, sort: e.sort }));
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

  const enterEdit = (dataItem: any, field: string) => {
    const newData = dataResult.data.map((item) =>
      item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
        ? {
            ...item,
            row_status: item.row_status === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : {
            ...item,
            [EDIT_FIELD]: undefined,
          }
    );

    setDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    const newData = dataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const onItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(event, dataResult, setDataResult, DATA_ITEM_KEY);
  };

  const TotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {dataResult.total}건
      </td>
    );
  };

  const parameters: Iparameters = {
    procedureName: "sys_sel_comments",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "Q",
      "@p_form_id": form_id,
      "@p_table_id": table_id,
      "@p_orgdiv": orgdiv,
      "@p_ref_key": ref_key,
    },
  };

  const fetchGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;

      setDataResult(process(rows, dataState));
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGrid();
  }, [ref_key]);

  //계획 저장 파라미터 초기값
  const [paraDataSaved, setParaDataSaved] = useState({
    work_type: "",
    row_status: "",
    id: "",
    seq: "",
    recdt: "",
    comment: "",
    user_id: "",
    ref_key: "",
  });

  const paraSaved: Iparameters = {
    procedureName: "sys_sav_comments ",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataSaved.work_type,
      "@p_row_status": paraDataSaved.row_status,
      "@p_id": paraDataSaved.id,
      "@p_seq": paraDataSaved.seq,
      "@p_recdt": paraDataSaved.recdt,
      "@p_comment": paraDataSaved.comment,
      "@p_user_id": paraDataSaved.user_id,
      "@p_form_id": form_id,
      "@p_table_id": table_id,
      "@p_orgdiv": orgdiv,
      "@p_ref_key": paraDataSaved.ref_key,
      "@p_exec_pc": pc,
    },
  };

  const onAddClick = () => {
    let seq = 1;

    if (dataResult.total > 0) {
      dataResult.data.forEach((item) => {
        if (item[DATA_ITEM_KEY] > seq) {
          seq = item[DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    const idx: number =
      Number(Object.getOwnPropertyNames(selectedState)[0]) ??
      //Number(plandataResult.data[0].idx) ??
      null;
    if (idx === null) return false;
    const selectedRowData = dataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === idx
    );

    const newDataItem = {
      [DATA_ITEM_KEY]: seq,
      // planno: selectedRowData.planno,
      recdt: convertDateToStr(new Date()),
      row_status: "N",
      user_id: user_id,
      user_name: user_name,
    };
    setDataResult((prev) => {
      return process([...prev.data, newDataItem], dataState);
    });
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];

    dataResult.data.forEach((item: any, index: number) => {
      if (!selectedState[item[DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        deletedRows.push(item);
      }
    });

    //newData 생성
    setDataResult(process(newData, dataState));

    //선택 상태 초기화
    setSelectedState({});
  };

  const onSaveClick = () => {
    const dataItem: { [name: string]: any } = dataResult.data.filter(
      (item: any) => {
        return (
          (item.row_status === "N" || item.row_status === "U") &&
          item.row_status !== undefined
        );
      }
    );
    if (
      dataResult.data.length === 0 ||
      (dataItem.length === 0 && deletedRows.length === 0)
    )
      return false;

    type TData = {
      row_status: string[];
      id: string[];
      seq: string[];
      recdt: string[];
      comment: string[];
      user_id: string[];
    };

    let dataArr: TData = {
      row_status: [],
      id: [],
      comment: [],
      seq: [],
      recdt: [],
      user_id: [],
    };

    dataItem.forEach((item: any, idx: number) => {
      const { comment, row_status, id = "", seq, recdt, user_id } = item;

      dataArr.comment.push(comment);
      dataArr.id.push(id);
      dataArr.row_status.push(row_status);
      dataArr.seq.push(seq);
      dataArr.recdt.push(recdt);
      dataArr.user_id.push(user_id);
    });

    deletedRows.forEach((item: any, idx: number) => {
      const { comment, id = "", seq, recdt, user_id } = item;

      dataArr.row_status.push("D");
      dataArr.comment.push(comment);
      dataArr.id.push(id);
      dataArr.seq.push(seq);
      dataArr.recdt.push(recdt);
      dataArr.user_id.push(user_id);
    });

    setParaDataSaved((prev) => ({
      ...prev,
      work_type: "save",
      row_status: dataArr.row_status.join("|"),
      comment: dataArr.comment.join("|"),
      id: dataArr.id.join("|"),
      seq: dataArr.seq.join("|"),
      recdt: dataArr.recdt.join("|"),
      user_id: dataArr.user_id.join("|"),
      ref_key: ref_key,
    }));
  };

  const fetchGridSaved = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setDataResult(process([], dataState));
      fetchGrid();

      deletedRows = [];
    } else {
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    //초기화
    setParaDataSaved((prev) => ({ ...prev, work_type: "" }));

    setLoading(false);
  };

  useEffect(() => {
    if (paraDataSaved.work_type !== "") fetchGridSaved();
  }, [paraDataSaved]);

  const isSaveDisabled = !(permissions?.save && ref_key !== "");

  return (
    <>
      <GridTitleContainer>
        <GridTitle data-control-name="grtlCmtList">코멘트</GridTitle>

        {permissions && (
          <ButtonContainer>
            <Button
              onClick={onAddClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="plus"
              disabled={isSaveDisabled}
            ></Button>
            <Button
              onClick={onRemoveClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="minus"
              disabled={isSaveDisabled}
            ></Button>
            <Button
              onClick={onSaveClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="save"
              disabled={isSaveDisabled}
            ></Button>
          </ButtonContainer>
        )}
      </GridTitleContainer>
      <Grid
        style={{ height }}
        data={process(
          dataResult.data.map((row) => ({
            ...row,
            recdt: dateformat2(row.recdt),
            [SELECTED_FIELD]: selectedState[idGetter(row)],
          })),
          dataState
        )}
        {...dataState}
        onDataStateChange={onDataStateChange}
        //선택기능
        dataItemKey={DATA_ITEM_KEY}
        selectedField={SELECTED_FIELD}
        selectable={{
          enabled: true,
          mode: "single",
        }}
        onSelectionChange={onSelectionChange}
        //정렬기능
        sortable={true}
        onSortChange={onSortChange}
        //스크롤 조회 기능
        fixedScroll={true}
        total={dataResult.total}
        //컬럼순서조정
        reorderable={true}
        //컬럼너비조정
        resizable={true}
        //incell 수정 기능
        onItemChange={onItemChange}
        cellRender={customCellRender}
        rowRender={customRowRender}
        editField={EDIT_FIELD}
      >
        <GridColumn
          field="row_status"
          title=" "
          width="40px"
          editable={false}
        />
        <GridColumn
          field="recdt"
          title="작성일"
          width="100px"
          editable={false}
          cell={CenterCell}
          footerCell={TotalFooterCell}
        />
        <GridColumn
          field="user_name"
          title="작성자"
          width="120px"
          editable={false}
        />
        <GridColumn field="comment" title="코멘트" />
      </Grid>
    </>
  );
};

export default CommentsGrid;
