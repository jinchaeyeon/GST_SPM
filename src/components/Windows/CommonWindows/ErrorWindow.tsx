import { useEffect, useState } from "react";
import * as React from "react";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  GridTitleContainer,
  GridTitle,
  GridContainerWrap,
  FormBox,
  FormBoxWrap,
  ButtonInGridInput,
  ButtonCenterGridInput,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import Dialog from "@mui/material/Dialog";
import { DialogContent, DialogTitle } from "@mui/material";
import Paper, { PaperProps } from "@mui/material/Paper";
import Draggable from "react-draggable";
import { Checkbox, Input, TextArea } from "@progress/kendo-react-inputs";
import {
  UseParaPc,
  convertDateToStr,
  dateformat2,
  getGridItemChangedData,
} from "../../CommonFunction";
import { bytesToBase64 } from "byte-base64";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridHeaderCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { DataResult, State, getter, process } from "@progress/kendo-data-query";
import { EDIT_FIELD, GAP, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import DateCell from "../../Cells/DateCell";
import { Iparameters } from "../../../store/types";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../../../store/atoms";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import { CellRender, RowRender } from "../../Renderers/Renderers";
const DATA_ITEM_KEY = "num";
const DATA_ITEM_KEY2 = "num";
// Create React.Context to pass props to the Form Field components from the main component
export const FormGridEditContext = React.createContext<{
  onEdit: (dataItem: any, isNew: boolean) => void;
  onSave: () => void;
  editIndex: number | undefined;
  parentField: string;
}>({} as any);

type TKendoWindow = {
  setVisible(isVisible: boolean): void;
  para: any;
  reload2(): void;
};
function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const ErrorQueryStr = `select sub_code, code_name from BizGST.dbo.comCodeMaster A where A.group_code = 'QC002'`;

const KendoWindow = ({ setVisible, para, reload2 }: TKendoWindow) => {
  // 비즈니스 컴포넌트 조회
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 768;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : 150,
    top: 0,
    width: isMobile == true ? deviceWidth : 1500,
    height: isMobile == true ? window.innerHeight : 900,
  });

  const onClose = () => {
    setVisible(false);
  };
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);

  const [usersData, setUsersData] = useState<any[]>([]);
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [ErrorItems, setErrorItems] = useState<any[]>([]);

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

  const fetchWorkType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(workTypeQueryStr));

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
      setWorkTypeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchErros = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(ErrorQueryStr));

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
      setErrorItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchUsers();
    fetchWorkType();
    fetchErros();
  }, []);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const [tabSelected, setTabSelected] = useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
  };
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [tempState2, setTempState2] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainDataResult2, setMainDataResult2] = useState<DataResult>(
    process([], mainDataState2)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );
  const [tempResult2, setTempResult2] = useState<DataResult>(
    process([], tempState2)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedState2, setSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onMainDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setMainDataState2(event.dataState);
  };

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
  };

  const onSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSelectedState2(newSelectedState);
  };

  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = mainDataResult2.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult2.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
  );
  type TFilters = {
    workType: string;
    orgdiv: string;
    docunum: string;
    ref_key: string;
    ref_seq: number;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };

  const [filters, setFilters] = useState<TFilters>({
    workType: "Q",
    orgdiv: para.orgdiv,
    docunum: para.docunum,
    ref_key: para.ref_key,
    ref_seq: para.ref_seq,
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  //그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_defect",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_orgdiv": filters.orgdiv,
        "@p_docunum": filters.docunum,
        "@p_ref_key": filters.ref_key,
        "@p_ref_seq": filters.ref_seq,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[1].TotalRowCount;
      const rows = data.tables[1].Rows;
      const totalRowCnt2 = data.tables[2].TotalRowCount;
      const rows2 = data.tables[2].Rows;

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });
      setMainDataResult2((prev) => {
        return {
          data: rows2,
          total: totalRowCnt2 == -1 ? 0 : totalRowCnt2,
        };
      });
      if (totalRowCnt > 0) {
        const selectedRow =
          filters.findRowValue == ""
            ? rows[0]
            : rows.find(
                (row: any) => row[DATA_ITEM_KEY] == filters.findRowValue
              );

        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
        }
      }

      if (totalRowCnt2 > 0) {
        const selectedRow2 =
          filters.findRowValue == ""
            ? rows2[0]
            : rows2.find(
                (row: any) => row[DATA_ITEM_KEY2] == filters.findRowValue
              );
        if (selectedRow2 != undefined) {
          setSelectedState2({ [selectedRow2[DATA_ITEM_KEY2]]: true });
        } else {
          setSelectedState2({ [rows2[0][DATA_ITEM_KEY2]]: true });
        }
      }
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
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, findRowValue: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  const [values2, setValues2] = React.useState<boolean>(false);
  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        is_checked: !values2,
        rowstatus: item.rowstatus == "N" ? "N": "U",
        [EDIT_FIELD]: props.field,
      }));
      setValues2(!values2);
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values2} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  const [values, setValues] = React.useState<boolean>(false);
  const CustomCheckBoxCell = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = mainDataResult2.data.map((item) => ({
        ...item,
        is_checked: !values,
        rowstatus: item.rowstatus == "N" ? "N": "U",
        [EDIT_FIELD]: props.field,
      }));
      setValues(!values);
      setMainDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  const onItemChange = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
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
    if (field != "rowstatus" && field != "badcd") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      setTempResult((prev) => {
        return {
          data: mainDataResult.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    if (tempResult.data != mainDataResult.data) {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              [EDIT_FIELD]: undefined,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const onItemChange2 = (event: GridItemChangeEvent) => {
    setMainDataState2((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult2,
      setMainDataResult2,
      DATA_ITEM_KEY2
    );
  };

  const customCellRender2 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit2}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender2 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit2}
      editField={EDIT_FIELD}
    />
  );

  const enterEdit2 = (dataItem: any, field: string) => {
    if (field == "is_checked") {
      const newData = mainDataResult2.data.map((item) =>
        item[DATA_ITEM_KEY2] == dataItem[DATA_ITEM_KEY2]
          ? {
              ...item,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setTempResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      setTempResult2((prev) => {
        return {
          data: mainDataResult2.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit2 = () => {
    if (tempResult2.data != mainDataResult2.data) {
      const newData = mainDataResult2.data.map((item) =>
        item[DATA_ITEM_KEY2] == Object.getOwnPropertyNames(selectedState2)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              [EDIT_FIELD]: undefined,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setTempResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = mainDataResult2.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const onSave = () => {
    const dataItem = mainDataResult.data.filter(
      (item) => item.is_checked == true
    );

    if (dataItem.length == 0) {
      alert("데이터가 없습니다.");
    } else {
      type TRowsArr = {
        row_status: string[];
        is_checked_s: string[];
        badnum_s: string[];
        badseq_s: string[];
        baddt_s: string[];
        badcd_s: string[];
        remark_s: string[];
      };

      let rowsArr: TRowsArr = {
        row_status: [],
        is_checked_s: [],
        badnum_s: [],
        badseq_s: [],
        baddt_s: [],
        badcd_s: [],
        remark_s: [],
      };

      dataItem.forEach((item: any) => {
        const {
          rowstatus = "",
          is_checked = "",
          badnum = "",
          badseq = "",
          baddt = "",
          badcd = "",
          remark = "",
        } = item;

        rowsArr.row_status.push(rowstatus);
        rowsArr.is_checked_s.push(
          is_checked == true ? "Y" : is_checked == false ? "N" : is_checked
        );
        rowsArr.badnum_s.push(badnum);
        rowsArr.badseq_s.push(badseq);
        rowsArr.baddt_s.push(
          baddt.length > 8 ? baddt : convertDateToStr(baddt)
        );
        rowsArr.badcd_s.push(badcd);
        rowsArr.remark_s.push(remark);
      });

      setParaData({
        work_type: "save",
        orgdiv: para.orgdiv,
        docunum: para.docunum,
        person: para.person,
        row_status: rowsArr.row_status.join("|"),
        is_checked_s: rowsArr.is_checked_s.join("|"),
        badnum_s: rowsArr.badnum_s.join("|"),
        badseq_s: rowsArr.badseq_s.join("|"),
        baddt_s: rowsArr.baddt_s.join("|"),
        badcd_s: rowsArr.badcd_s.join("|"),
        remark_s: rowsArr.remark_s.join("|"),
        id: userId,
        pc: pc,
      });
    }
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    orgdiv: "",
    docunum: "",
    person: "",
    row_status: "",
    is_checked_s: "",
    badnum_s: "",
    badseq_s: "",
    baddt_s: "",
    badcd_s: "",
    remark_s: "",
    id: userId,
    pc: pc,
  });

  //추가, 수정 프로시저 파라미터
  const paras: Iparameters = {
    procedureName: "pw6_sav_defect",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_orgdiv": paraData.orgdiv,
      "@p_docunum": paraData.docunum,
      "@p_person": paraData.person,
      "@p_row_status": paraData.row_status,
      "@p_is_checked": paraData.is_checked_s,
      "@p_badnum": paraData.badnum_s,
      "@p_badseq": paraData.badseq_s,
      "@p_baddt": paraData.baddt_s,
      "@p_badcd": paraData.badcd_s,
      "@p_remark": paraData.remark_s,

      "@p_id": userId,
      "@p_pc": pc,
    },
  };

  useEffect(() => {
    if (paraData.work_type != "") fetchToSave();
  }, [paraData]);

  const fetchToSave = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paras);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      if (paraData.row_status.includes("D") == true) {
        alert("삭제되었습니다.");
        setParaData({
          work_type: "",
          orgdiv: "",
          docunum: "",
          person: "",
          row_status: "",
          is_checked_s: "",
          badnum_s: "",
          badseq_s: "",
          baddt_s: "",
          badcd_s: "",
          remark_s: "",
          id: userId,
          pc: pc,
        });
        reload2();
        setFilters((prev) => ({
          ...prev,
          isSearch: true,
        }));
      } else {
        alert("저장되었습니다.");
        setParaData({
          work_type: "",
          orgdiv: "",
          docunum: "",
          person: "",
          row_status: "",
          is_checked_s: "",
          badnum_s: "",
          badseq_s: "",
          baddt_s: "",
          badcd_s: "",
          remark_s: "",
          id: userId,
          pc: pc,
        });
        reload2();
        onClose();
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }

    paraData.work_type = "";
  };

  const onRemoveClick = () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }
    const dataItem2 = mainDataResult2.data.filter(
      (item) => item.is_checked == true
    );

    if (dataItem2.length == 0) {
      alert("데이터가 없습니다.");
    } else {
      type TRowsArr = {
        row_status: string[];
        is_checked_s: string[];
        badnum_s: string[];
        badseq_s: string[];
        baddt_s: string[];
        badcd_s: string[];
        remark_s: string[];
      };

      let rowsArr: TRowsArr = {
        row_status: [],
        is_checked_s: [],
        badnum_s: [],
        badseq_s: [],
        baddt_s: [],
        badcd_s: [],
        remark_s: [],
      };

      dataItem2.forEach((item: any) => {
        const {
          is_checked = "",
          badnum = "",
          badseq = "",
          baddt = "",
          badcd = "",
          remark = "",
        } = item;

        rowsArr.row_status.push("D");
        rowsArr.is_checked_s.push(
          is_checked == true ? "Y" : is_checked == false ? "N" : is_checked
        );
        rowsArr.badnum_s.push(badnum);
        rowsArr.badseq_s.push(badseq);
        rowsArr.baddt_s.push(
          baddt.length > 8 ? baddt : convertDateToStr(baddt)
        );
        rowsArr.badcd_s.push(badcd);
        rowsArr.remark_s.push(remark);
      });

      setParaData({
        work_type: "save",
        orgdiv: para.orgdiv,
        docunum: para.docunum,
        person: para.person,
        row_status: rowsArr.row_status.join("|"),
        is_checked_s: rowsArr.is_checked_s.join("|"),
        badnum_s: rowsArr.badnum_s.join("|"),
        badseq_s: rowsArr.badseq_s.join("|"),
        baddt_s: rowsArr.baddt_s.join("|"),
        badcd_s: rowsArr.badcd_s.join("|"),
        remark_s: rowsArr.remark_s.join("|"),
        id: userId,
        pc: pc,
      });
    }
  };

  return (
    <Dialog
      onClose={onClose}
      open={true}
      PaperComponent={PaperComponent}
      maxWidth={"xl"}
      style={{
        zIndex: 1000000000,
        width: position.width,
        height: position.height,
        top: position.top,
        left: position.left,
      }}
    >
      <DialogTitle>불량 처리 팝업</DialogTitle>
      <DialogContent>
        <GridContainerWrap height="calc(100% - 70px)">
          <GridContainer width={`40%`}>
            <GridTitleContainer>
              <GridTitle>업무 지시 정보</GridTitle>
            </GridTitleContainer>
            <FormBoxWrap border={true}>
              <FormBox>
                <tbody>
                  <tr>
                    <th>지시일</th>
                    <td>
                      <Input
                        name="recdt"
                        type="text"
                        value={
                          para.recdt == undefined ? "" : dateformat2(para.recdt)
                        }
                        className="readonly"
                      />
                    </td>
                    <th>지시자</th>
                    <td>
                      <Input
                        name="insert_userid"
                        type="text"
                        value={
                          para.insert_userid == undefined
                            ? ""
                            : usersData.find(
                                (items: any) =>
                                  items.user_id == para.insert_userid
                              ) == undefined
                            ? ""
                            : usersData.find(
                                (items: any) =>
                                  items.user_id == para.insert_userid
                              )?.user_name
                        }
                        className="readonly"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>완료예정일</th>
                    <td>
                      <Input
                        name="finexpdt"
                        type="text"
                        value={
                          para.finexpdt == undefined
                            ? ""
                            : dateformat2(para.finexpdt)
                        }
                        className="readonly"
                      />
                    </td>
                    <th>업무분류</th>
                    <td>
                      <Input
                        name="groupcd"
                        type="text"
                        value={
                          para.groupcd == undefined
                            ? ""
                            : para.insert_userid == undefined
                            ? ""
                            : WorkTypeItems.find(
                                (items: any) => items.sub_code == para.groupcd
                              ) == undefined
                            ? ""
                            : WorkTypeItems.find(
                                (items: any) => items.sub_code == para.groupcd
                              )?.code_name
                        }
                        className="readonly"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>처리담당자</th>
                    <td>
                      <Input
                        name="person"
                        type="text"
                        value={
                          para.person == undefined
                            ? ""
                            : usersData.find(
                                (items: any) => items.user_id == para.person
                              ) == undefined
                            ? ""
                            : usersData.find(
                                (items: any) => items.user_id == para.person
                              )?.user_name
                        }
                        className="readonly"
                      />
                    </td>
                    <th>예상시간</th>
                    <td>
                      <Input
                        name="expect_time"
                        type="text"
                        value={
                          para.expect_time == undefined ? "" : para.expect_time
                        }
                        className="readonly"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>내용</th>
                    <td colSpan={3}>
                      <TextArea
                        value={para.contents == undefined ? "" : para.contents}
                        name="contents"
                        rows={10}
                        className="readonly"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>비고</th>
                    <td colSpan={3}>
                      <TextArea
                        value={para.remark == undefined ? "" : para.remark}
                        name="remark"
                        rows={5}
                        className="readonly"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th style={{ width: "5%" }}>첨부파일</th>
                    <td colSpan={3}>
                      <Input
                        name="attach_exists"
                        type="text"
                        value={""}
                        className="readonly"
                      />
                      {para.attach_exists != undefined ? (
                        para.attach_exists == "Y" ? (
                          <div>
                            <ButtonCenterGridInput>
                              <span className="k-icon k-i-file k-icon-lg"></span>
                            </ButtonCenterGridInput>
                            <ButtonInGridInput>
                              <Button
                                onClick={onAttWndClick}
                                icon="more-horizontal"
                                fillMode="flat"
                              />
                            </ButtonInGridInput>
                          </div>
                        ) : (
                          <ButtonInGridInput>
                            <Button
                              onClick={onAttWndClick}
                              icon="more-horizontal"
                              fillMode="flat"
                            />
                          </ButtonInGridInput>
                        )
                      ) : (
                        <ButtonInGridInput>
                          <Button
                            onClick={onAttWndClick}
                            icon="more-horizontal"
                            fillMode="flat"
                          />
                        </ButtonInGridInput>
                      )}
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
          </GridContainer>
          <GridContainer width={"60%"}>
            <TabStrip
              style={{
                width: "100%",
                height: "530px",
              }}
              selected={tabSelected}
              onSelect={handleSelectTab}
            >
              <TabStripTab title="불량 등록">
                <GridContainer>
                  <GridTitleContainer>
                    <GridTitle>불량 정보</GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: "425px" }}
                    data={process(
                      mainDataResult.data.map((row) => ({
                        ...row,
                        badcd: ErrorItems.find(
                          (items: any) => items.sub_code == row.badcd
                        )?.code_name,
                        [SELECTED_FIELD]: selectedState[idGetter(row)],
                      })),
                      mainDataState
                    )}
                    {...mainDataState}
                    onDataStateChange={onMainDataStateChange}
                    //선택 기능
                    dataItemKey={DATA_ITEM_KEY}
                    selectedField={SELECTED_FIELD}
                    selectable={{
                      enabled: true,
                      mode: "single",
                    }}
                    onSelectionChange={onSelectionChange}
                    //스크롤 조회 기능
                    fixedScroll={true}
                    total={mainDataResult.total}
                    //정렬기능
                    sortable={true}
                    onSortChange={onMainSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    onItemChange={onItemChange}
                    cellRender={customCellRender}
                    rowRender={customRowRender}
                    editField={EDIT_FIELD}
                  >
                    <GridColumn field="rowstatus" title=" " width="50px" />
                    <GridColumn
                      field="is_checked"
                      title=" "
                      width="45px"
                      headerCell={CustomCheckBoxCell2}
                      cell={CheckBoxCell}
                    />
                    <GridColumn
                      field="baddt"
                      title="불량일"
                      width={120}
                      footerCell={mainTotalFooterCell}
                      cell={DateCell}
                    />
                    <GridColumn field="badcd" title="불량코드" width={150} />
                    <GridColumn field="remark" title="비고" width={400} />
                  </Grid>
                </GridContainer>
              </TabStripTab>
              <TabStripTab title="불량 등록 내역">
                <GridContainer>
                  <GridTitleContainer>
                    <GridTitle>불량 정보</GridTitle>
                    <ButtonContainer>
                      <Button
                        onClick={onRemoveClick}
                        fillMode="outline"
                        themeColor={"primary"}
                        icon="delete"
                      >
                        선택 자료 삭제
                      </Button>
                    </ButtonContainer>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: "425px" }}
                    data={process(
                      mainDataResult2.data.map((row) => ({
                        ...row,
                        badcd: ErrorItems.find(
                          (items: any) => items.sub_code == row.badcd
                        )?.code_name,
                        insert_userid: usersData.find(
                          (items: any) => items.user_id == row.insert_userid
                        )?.user_name,
                        [SELECTED_FIELD]: selectedState2[idGetter2(row)],
                      })),
                      mainDataState2
                    )}
                    {...mainDataState2}
                    onDataStateChange={onMainDataStateChange2}
                    //선택 기능
                    dataItemKey={DATA_ITEM_KEY2}
                    selectedField={SELECTED_FIELD}
                    selectable={{
                      enabled: true,
                      mode: "single",
                    }}
                    onSelectionChange={onSelectionChange2}
                    //스크롤 조회 기능
                    fixedScroll={true}
                    total={mainDataResult2.total}
                    //정렬기능
                    sortable={true}
                    onSortChange={onMainSortChange2}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    onItemChange={onItemChange2}
                    cellRender={customCellRender2}
                    rowRender={customRowRender2}
                    editField={EDIT_FIELD}
                  >
                    <GridColumn field="rowstatus" title=" " width="50px" />
                    <GridColumn
                      field="is_checked"
                      title=" "
                      width="45px"
                      headerCell={CustomCheckBoxCell}
                      cell={CheckBoxCell}
                    />
                    <GridColumn
                      field="baddt"
                      title="불량일"
                      width={120}
                      footerCell={mainTotalFooterCell2}
                      cell={DateCell}
                    />
                    <GridColumn field="badcd" title="불량코드" width={150} />
                    <GridColumn field="remark" title="비고" width={300} />
                    <GridColumn
                      field="insert_userid"
                      title="등록자"
                      width={100}
                    />
                  </Grid>
                </GridContainer>
              </TabStripTab>
            </TabStrip>
          </GridContainer>
        </GridContainerWrap>
        <BottomContainer>
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={onSave}>
              확인
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </DialogContent>
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          para={para.attdatnum}
          permission={{ upload: false, download: true, delete: false }}
          type={"task"}
        />
      )}
    </Dialog>
  );
};

export default KendoWindow;
