import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
} from "@progress/kendo-react-grid";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
} from "../../../CommonStyled";
import { Iparameters } from "../../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import {
  chkScrollHandler,
  UseBizComponent,
  UseParaPc,
  UseGetValueFromSessionItem,
  findMessage,
  UseMessages,
  convertDateToStr,
} from "../../CommonFunction";
import { IWindowPosition } from "../../../hooks/interfaces";
import {
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  COM_CODE_DEFAULT_VALUE,
} from "../../CommonString";
import NumberCell from "../../Cells/NumberCell";
import {
  getGridItemChangedData,
  getQueryFromBizComponent,
} from "../../CommonFunction";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../../store/atoms";

type TdataArr = {
  rowstatus_s: string[];
  badqty_s: string[];
  badcd_s: string[];
  badnum_s: string[];
  badseq_s: string[];
};

type IWindow = {
  workType: "FILTER" | "ROW_ADD" | "ROWS_ADD";
  setVisible(t: boolean): void;
  setData(event?: any): void;
  renum: string;
  //data : 선택한 품목 데이터를 전달하는 함수
};

const Badwindow = ({ workType, setVisible, setData, renum }: IWindow) => {
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 500,
    height: 650,
  });
  const DATA_ITEM_KEY = "num";
  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_QC002",
    //사용여부,
    setBizComponentData
  );
  const [badcdListData, setBadcdListData] = React.useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const badcdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_QC002")
      );

      fetchQuery(badcdQueryStr, setBadcdListData);
    }
  }, [bizComponentData]);

  const fetchQuery = useCallback(async (queryStr: string, setListData: any) => {
    let data: any;

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
      const rows = data.tables[0].Rows;
      setListData(rows);
    }
  }, []);

  const handleMove = (event: WindowMoveEvent) => {
    setPosition({ ...position, left: event.left, top: event.top });
  };
  const handleResize = (event: WindowMoveEvent) => {
    setPosition({
      left: event.left,
      top: event.top,
      width: event.width,
      height: event.height,
    });
  };

  const onClose = () => {
    setVisible(false);
  };

  const processApi = useApi();

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainPgNum, setMainPgNum] = useState(1);
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);
  const [filters, setFilters] = useState({
    orgdiv: "01",
    itemcd: "",
    itemnm: "",
    frdt: "",
    todt: "",
    bnatur: "",
    renum: renum == undefined ? "" : renum,
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_QC_A6000W_Q",
    pageNumber: mainPgNum,
    pageSize: PAGE_SIZE,
    parameters: {
      "@p_work_type": "BAD",
      "@p_orgdiv": filters.orgdiv,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_frdt": filters.frdt,
      "@p_todt": filters.todt,
      "@p_bnatur": filters.bnatur,
      "@p_renum": filters.renum,
    },
  };

  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "BAD",
    orgdiv: "01",
    location: "01",
    badrenum: filters.renum,
    rowstatus_s: "",
    renum_s: "",
    reseq_s: "",
    itemcd_s: "",
    person_s: "",
    lotnum_s: "",
    badqty_s: "",
    qcdecision: "",
    qcdt_s: "",
    qcnum_s: "",
    badcd_s: "",
    badnum_s: "",
    badseq_s: "",
    eyeqc_s: "",
    chkqty_s: "",
    remark_s: "",
    userid: userId,
    pc: pc,
  });

  const para: Iparameters = {
    procedureName: "P_QC_A6000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_location": ParaData.location,
      "@p_badrenum": ParaData.badrenum,
      "@p_row_status_s": ParaData.rowstatus_s,
      "@p_renum_s": ParaData.renum_s,
      "@p_reseq_s": ParaData.reseq_s,
      "@p_itemcd_s": ParaData.itemcd_s,
      "@p_person_s": ParaData.person_s,
      "@p_lotnum_s": ParaData.lotnum_s,
      "@p_badqty_s": ParaData.badqty_s,
      "@p_qcdecision_s": ParaData.qcdecision,
      "@p_qcdt_s": ParaData.qcdt_s,
      "@p_qcnum_s": ParaData.qcnum_s,
      "@p_badcd_s": ParaData.badcd_s,
      "@p_badnum_s": ParaData.badnum_s,
      "@p_badseq_s": ParaData.badseq_s,
      "@p_eyeqc_s": ParaData.eyeqc_s,
      "@p_chkqty_s": ParaData.chkqty_s,
      "@p_remark_s": ParaData.remark_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_QC_A6000W",
    },
  };

  const fetchTodoGridSaved = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setData();
      onClose();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.rowstatus_s != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  useEffect(() => {
    fetchMainGrid();
  }, [mainPgNum]);

  //그리드 조회
  const fetchMainGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });
    }
  };

  //스크롤 핸들러 => 한번에 pageSize만큼 조회
  const onScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSaveClick = () => {
    const data = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    if (data != null) {
      try {
        if (data.qty < 0) {
          throw findMessage(messagesData, "QC_A6000W_003");
        } else {
          const dataItem = mainDataResult.data.filter((item: any) => {
            return (
              (item.rowstatus === "N" || item.rowstatus === "U") &&
              item.rowstatus !== undefined
            );
          });
          if (dataItem.length === 0) return false;
          let dataArr: TdataArr = {
            rowstatus_s: [],
            badqty_s: [],
            badcd_s: [],
            badnum_s: [],
            badseq_s: [],
          };
          dataItem.forEach((item: any, idx: number) => {
            const {
              rowstatus = "",
              qty = "",
              badcd = "",
              badnum = "",
              badseq = "",
            } = item;
            dataArr.rowstatus_s.push(rowstatus);
            dataArr.badcd_s.push(badcd == undefined ? "" : badcd);
            dataArr.badqty_s.push(qty == undefined ? "" : qty);
            dataArr.badnum_s.push(badnum == undefined ? "" : badnum);
            dataArr.badseq_s.push(badseq == undefined ? "" : badseq);
          });

          setParaData((prev) => ({
            ...prev,
            rowstatus_s: dataArr.rowstatus_s.join("|"),
            badqty_s: dataArr.badqty_s.join("|"),
            badcd_s: dataArr.badcd_s.join("|"),
            badnum_s: dataArr.badnum_s.join("|"),
            badseq_s: dataArr.badseq_s.join("|"),
          }));
        }
      } catch (e) {
        alert(e);
      }
    } else {
      onClose();
    }
  };

  //메인 그리드 선택 이벤트
  const onMainSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    setSelectedState(newSelectedState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };
  const onMainItemChange3 = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const customCellRender3 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit3}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender3 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit3}
      editField={EDIT_FIELD}
    />
  );

  const enterEdit3 = (dataItem: any, field: string) => {
    if (field == "qty") {
      const newData = mainDataResult.data.map((item) =>
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

      setIfSelectFirstRow(false);
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit3 = () => {
    const newData = mainDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));
    setIfSelectFirstRow(false);
    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  return (
    <Window
      title={"불량처리"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <GridContainer>
        <Grid
          style={{ height: "500px" }}
          data={process(
            mainDataResult.data.map((row) => ({
              ...row,
              rowstatus:
                row.rowstatus == null ||
                row.rowstatus == "" ||
                row.rowstatus == undefined
                  ? ""
                  : row.rowstatus,
              badcd: badcdListData.find(
                (item: any) => item.sub_code === row.badcd
              )?.code_name,
              [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
            })),
            mainDataState
          )}
          onDataStateChange={onMainDataStateChange}
          {...mainDataState}
          //선택 기능
          dataItemKey={DATA_ITEM_KEY}
          selectedField={SELECTED_FIELD}
          selectable={{
            enabled: true,
            mode: "single",
          }}
          onSelectionChange={onMainSelectionChange}
          //스크롤 조회기능
          fixedScroll={true}
          total={mainDataResult.total}
          onScroll={onScrollHandler}
          //정렬기능
          sortable={true}
          onSortChange={onMainSortChange}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
          //더블클릭
          onItemChange={onMainItemChange3}
          cellRender={customCellRender3}
          rowRender={customRowRender3}
          editField={EDIT_FIELD}
        >
          <GridColumn field="rowstatus" title=" " width="48px" />
          <GridColumn
            field="badcd"
            title="불량유형"
            width="200px"
            footerCell={mainTotalFooterCell}
          />
          <GridColumn
            field="qty"
            title="불량수량"
            width="200px"
            cell={NumberCell}
          />
        </Grid>
      </GridContainer>
      <BottomContainer>
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onSaveClick}>
            확인
          </Button>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default Badwindow;
