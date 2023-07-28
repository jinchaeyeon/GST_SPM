import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  GridDataStateChangeEvent,
  getSelectedState,
  GridSelectionChangeEvent,
  GridItemChangeEvent,
  Grid,
  GridColumn,
  GridCellProps,
} from "@progress/kendo-react-grid";
import { DataResult, process, State, getter } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInGridInput,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IAttachmentData, IWindowPosition } from "../../../hooks/interfaces";
import {
  UseParaPc,
  convertDateToStr,
  extractDownloadFilename,
  getGridItemChangedData,
} from "../../CommonFunction";
import {
  DEFAULT_ATTDATNUMS,
  EDIT_FIELD,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../../CommonString";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../../../store/atoms";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { Iparameters, TEditorHandle } from "../../../store/types";
import DateCell from "../../Cells/DateCell";
import NumberCell from "../../Cells/NumberCell";
import RequiredHeader from "../../RequiredHeader";
import RichEditor from "../../RichEditor";
import { bytesToBase64 } from "byte-base64";
import { files } from "@progress/kendo-react-upload/dist/npm/messages";
import ComboBoxCell from "../../Cells/ComboBoxCell";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../../../store/columns/common-columns";
import AttachmentsWindow from "./AttachmentsWindow";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import { Checkbox } from "@progress/kendo-react-inputs";

type IKendoWindow = {
  setVisible(t: boolean): void;
  reload(): void;
  para: ITypes;
  type: string;
};

type ITypes = {
  answer_attdatnum: string;
  answer_document_id: string;
  answer_files: string;
  attdatnum: string;
  be_finished_date: string;
  check_date: null;
  completion_date: string;
  contents: string;
  customer_code: string;
  customer_name: string;
  document_id: string;
  exists_task: string;
  files: string;
  find_key: string;
  finished_count: number;
  insert_pc: string;
  insert_time: string;
  insert_user_id: string;
  insert_userid: string;
  is_checked: string;
  is_finish: string;
  is_lock: string;
  is_public: string;
  module_type: string;
  password: string;
  reception_attach_exists: string;
  reception_attach_number: string;
  reception_date: string;
  reception_person: string;
  reception_time: number;
  reception_type: string;
  ref_number: string;
  request_date: string;
  salt: string;
  status: string;
  title: string;
  total_count: number;
  user_id: string;
  user_name: string;
  user_tel: string;
  value_code3: string;
};
const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const DATA_ITEM_KEY = "num";

const UserContext = createContext<{
  usersData: any[];
}>({
  usersData: [],
});

const ValueCodeContext = createContext<{
  valuecodeItems: any[];
}>({
  valuecodeItems: [],
});

const WorkTypeContext = createContext<{
  WorkTypeItems: any[];
}>({
  WorkTypeItems: [],
});

export const FilesContext = createContext<{
  attdatnum: string;
  setAttdatnum: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

const UserCell = (props: GridCellProps) => {
  const { usersData } = useContext(UserContext);

  return usersData ? (
    <ComboBoxCell
      columns={userColumns}
      data={usersData}
      textField="user_name"
      valueField="user_id"
      {...props}
    />
  ) : (
    <td />
  );
};

const ValueCodeCell = (props: GridCellProps) => {
  const { valuecodeItems } = useContext(ValueCodeContext);

  return valuecodeItems ? (
    <ComboBoxCell columns={dataTypeColumns2} data={valuecodeItems} {...props} />
  ) : (
    <td />
  );
};

const WorkTypeCodeCell = (props: GridCellProps) => {
  const { WorkTypeItems } = useContext(WorkTypeContext);

  return WorkTypeItems ? (
    <ComboBoxCell columns={dataTypeColumns} data={WorkTypeItems} {...props} />
  ) : (
    <td />
  );
};

const FilesCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    className = "",
  } = props;
  const { setAttdatnum } = useContext(FilesContext);
  let isInEdit = field === dataItem.inEdit;
  const value = field && dataItem[field] ? dataItem[field] : "";

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible(true);
  };

  const defaultRendering = (
    <td
      className={className}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
      style={{ position: "relative" }}
    >
      <div style={{ textAlign: "center", marginRight: "10px" }}>
        {dataItem.attach_exists == "Y" ? (
          <span className="k-icon k-i-file k-icon-lg"></span>
        ) : (
          ""
        )}
      </div>
      <ButtonInGridInput>
        <Button
          onClick={onAttWndClick2}
          icon="more-horizontal"
          fillMode="flat"
        />
      </ButtonInGridInput>
    </td>
  );

  const getAttachmentsData = (data: IAttachmentData) => {
    setAttdatnum(data.attdatnum);
  };

  return (
    <>
      {render === undefined
        ? null
        : render?.call(undefined, defaultRendering, props)}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={dataItem.attdatnum}
          permission={{ upload: true, download: true, delete: true }}
          type={"task"}
        />
      )}
    </>
  );
};
let temp = 0;
let deletedRows: any[] = [];
const KendoWindow = ({ setVisible, para, type, reload }: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 768;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1600,
    height: 900,
  });
  const idGetter = getter(DATA_ITEM_KEY);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const Check_ynCell = (props: GridCellProps) => {
    const data = props.dataItem;
    const changeCheck = () => {
      if (data.indicator == userId) {
        const newData = mainDataResult.data.map((item) =>
          item[DATA_ITEM_KEY] ==
          parseInt(Object.getOwnPropertyNames(selectedState)[0])
            ? {
                ...item,
                check_yn:
                  item.check_yn == "N"
                    ? true
                    : item.check_yn == "Y"
                    ? false
                    : !item.check_yn,
                rowstatus: item.rowstatus == "N" ? "N" : "U",
                [EDIT_FIELD]: props.field,
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
        alert("지시자가 본인인 경우만 확인 처리 가능합니다.");
      }
    };

    return data.indicator == userId ? (
      data.check_yn == "Y" || data.check_yn == true ? (
        <td style={{ textAlign: "center" }} onClick={changeCheck}>
          <span
            className="k-icon k-i-checkmark-circle k-icon-lg"
            style={{ color: "green" }}
          ></span>
        </td>
      ) : (
        <td onClick={changeCheck} />
      )
    ) : (
      <td onClick={changeCheck} />
    );
  };

  const defectiveCell = (props: GridCellProps) => {
    const data = props.dataItem;

    return data ? (
      data.is_defective == "Y" ? (
        <td style={{ textAlign: "center" }}>
          <span
            className="k-icon k-i-warning k-icon-xl"
            style={{ color: "red" }}
          ></span>
        </td>
      ) : (
        <td />
      )
    ) : (
      <td />
    );
  };

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );
  const setLoading = useSetRecoilState(isLoading);

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
    mainDataResult.data.map((item) => {
      if (
        localStorage.getItem(item[DATA_ITEM_KEY]) == null ||
        localStorage.getItem(item[DATA_ITEM_KEY]) == undefined
      ) {
        localStorage.removeItem(item[DATA_ITEM_KEY]);
      }
    });
    setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
    setVisible(false);
  };
  const processApi = useApi();

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );

  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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

  const fetchValueCode = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(valueCodeQueryStr));

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
      setValuecodeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_task_order",
      pageNumber: 1,
      pageSize: 10000,
      parameters: {
        "@p_work_type": "task_order",
        "@p_date_type": "",
        "@p_from_date": "",
        "@p_to_date": "",
        "@p_customer_code": "",
        "@p_customer_name": "",
        "@p_user_name": "",
        "@p_contents": "",
        "@p_reception_type": "",
        "@p_value_code3": "",
        "@p_reception_person": "",
        "@p_worker": "",
        "@p_receptionist": "",
        "@p_status": "",
        "@p_check": "",
        "@p_ref_type": type != undefined ? type : "",
        "@p_ref_key": para != undefined ? para.ref_number : "",
        "@p_ref_seq": 0,
      },
    };

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
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

        fetchDocument("Task", rows[0].orgdiv + "_" + rows[0].docunum);
      } else {
        fetchDocument("", "");
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDocument = async (type: string, ref_key: string) => {
    let data: any;
    setLoading(true);

    if (type == "") {
      setHtmlOnEditor({ document: "" });
    } else {
      const para = {
        para: `document?type=${type}&id=${ref_key}`,
      };

      try {
        data = await processApi<any>("document", para);
      } catch (error) {
        data = null;
      }

      if (data !== null) {
        const reference = data.document;
        if (refEditorRef.current) {
          refEditorRef.current.setHtml(reference);
        }
      } else {
        console.log("[에러발생]");
        console.log(data);

        if (refEditorRef.current) {
          refEditorRef.current.setHtml("");
        }
      }
    }
    setLoading(false);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    // 에디터 내 문자 추출
    const currentRow = mainDataResult.data.filter(
      (item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    let editorContent: any = "";
    if (refEditorRef.current) {
      editorContent = refEditorRef.current.getContent();
    }

    if (
      localStorage.getItem(currentRow[DATA_ITEM_KEY]) == undefined ||
      localStorage.getItem(currentRow[DATA_ITEM_KEY]) == null
    ) {
      localStorage.setItem(currentRow[DATA_ITEM_KEY], editorContent);
    } else {
      localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
      localStorage.setItem(currentRow[DATA_ITEM_KEY], editorContent);
    }

    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    fetchDocument(
      "Task",
      selectedRowData.orgdiv + "_" + selectedRowData.docunum
    );
  };
  useEffect(() => {
    fetchWorkType();
    fetchUsers();
    fetchValueCode();
    if (para != undefined && type != undefined) {
      fetchMainGrid();
    }
  }, [para, type]);

  const refEditorRef = useRef<TEditorHandle>(null);

  const setHtmlOnEditor = ({ document }: { document: string }) => {
    if (refEditorRef.current) {
      refEditorRef.current.updateEditable(true);
      refEditorRef.current.setHtml(document);
      refEditorRef.current.updateEditable(false);
    }
  };

  const downloadDoc = async () => {
    let response: any;
    setLoading(true);

    if (mainDataResult.total < 1) {
      alert("데이터가 없습니다.");
    } else {
      const datas = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];

      const para = {
        para: "doc?type=Task&id=" + datas.orgdiv + "_" + datas.docunum,
      };

      try {
        response = await processApi<any>("doc-download", para);
      } catch (error) {
        response = null;
      }

      if (response !== null) {
        const blob = new Blob([response.data]);
        // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다.
        // const blob = new Blob([this.content], {type: 'text/plain'})

        // blob을 사용해 객체 URL을 생성합니다.
        const fileObjectUrl = window.URL.createObjectURL(blob);

        // blob 객체 URL을 설정할 링크를 만듭니다.
        const link = document.createElement("a");
        link.href = fileObjectUrl;
        link.style.display = "none";

        // 다운로드 파일 이름을 지정 할 수 있습니다.
        // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.
        link.download = extractDownloadFilename(response);

        // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
      }
    }
    setLoading(false);
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
    if (
      field != "rowstatus" &&
      field != "is_defective" &&
      field != "finyn" &&
      field != "docunum" &&
      field != "insert_userid" &&
      field != "ref_key" &&
      field != "ref_seq"
    ) {
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

  const [attdatnum, setAttdatnum] = useState<string>("");

  useEffect(() => {
    if (attdatnum != "" && attdatnum != undefined && attdatnum != null) {
      setUnsavedAttadatnums((prev) => ({
        type: "task",
        attdatnums: [...prev.attdatnums, ...[attdatnum]],
      }));
    }
    const newData = mainDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] ==
      parseInt(Object.getOwnPropertyNames(selectedState)[0])
        ? {
            ...item,
            attdatnum: attdatnum,
          }
        : {
            ...item,
          }
    );

    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
    setTempResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  }, [attdatnum]);

  const onAddClick = () => {
    mainDataResult.data.map((item) => {
      if (item[DATA_ITEM_KEY] > temp) {
        temp = item[DATA_ITEM_KEY];
      }
    });

    const newDataItem = {
      [DATA_ITEM_KEY]: ++temp,
      attach_exists: "N",
      attdatnum: "",
      check_yn: "",
      contents: "",
      custcd: para.customer_code,
      custnm: para.customer_name,
      custperson: para.user_name,
      docunum: "",
      expect_time: "0:0",
      exphh: 0,
      expmm: 0,
      find_key: para.find_key,
      findt: "",
      finexpdt: "",
      finyn: "N",
      groupcd: "",
      indicator: userId,
      is_defective: "N",
      orgdiv: "01",
      person: "",
      recdt: convertDateToStr(new Date()),
      ref_key: para.ref_number,
      ref_seq: 0,
      ref_type: "접수",
      remark: "",
      value_code3: "",
      rowstatus: "N",
    };

    setMainDataResult((prev) => {
      return {
        data: [newDataItem, ...prev.data],
        total: prev.total + 1,
      };
    });
    setSelectedState({ [newDataItem[DATA_ITEM_KEY]]: true });
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];
    let Object: any[] = [];
    let Object2: any[] = [];
    let data;
    mainDataResult.data.forEach((item: any, index: number) => {
      if (!selectedState[item[DATA_ITEM_KEY]]) {
        newData.push(item);
        Object2.push(index);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        Object.push(index);
        deletedRows.push(newData2);
      }
    });

    if (Math.min(...Object) < Math.min(...Object2)) {
      data = mainDataResult.data[Math.min(...Object2)];
    } else {
      data = mainDataResult.data[Math.min(...Object) - 1];
    }

    //newData 생성
    setMainDataResult((prev) => ({
      data: newData,
      total: prev.total - Object.length,
    }));
    setSelectedState({
      [data != undefined ? data[DATA_ITEM_KEY] : newData[0]]: true,
    });
  };

  const parseDate = (input: any) => {
    // 값이 없는 경우 null 반환
    if (!input) {
      return "";
    }

    const pattern = /(^\d{4})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;

    if (!pattern.test(input)) {
      return "";
    }

    var yyyyMMdd = String(input);
    var sYear = yyyyMMdd.substring(0, 4);
    var sMonth = yyyyMMdd.substring(4, 6);
    var sDate = yyyyMMdd.substring(6, 8);

    // 입력을 Date 객체로 변환
    const date = new Date(Number(sYear), Number(sMonth) - 1, Number(sDate));

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      // 유효하지 않은 날짜인 경우 오늘의 날짜 반환
      return "";
    } else {
      // 유효한 날짜인 경우 변환된 날짜 반환
      return date;
    }
  };

  const onConfirmClick = () => {
    if (mainDataResult.total > 0) {
      type TRowsArr = {
        row_status: string[];
        guid_s: string[];
        docunum_s: string[];
        recdt_s: string[];
        person_s: string[];
        indicator_s: string[];

        contents_s: string[];
        remark_s: string[];
        groupcd_s: string[];
        custcd_s: string[];
        finexpdt_s: string[];

        exphh_s: string[];
        expmm_s: string[];
        custperson_s: string[];
        attdatnum_s: string[];
        value_code3_s: string[];

        ref_type_s: string[];
        ref_key_s: string[];
        ref_seq_s: string[];

        html_s: string[];
      };

      let rowsArr: TRowsArr = {
        row_status: [],
        guid_s: [],
        docunum_s: [],
        recdt_s: [],
        person_s: [],
        indicator_s: [],

        contents_s: [],
        remark_s: [],
        groupcd_s: [],
        custcd_s: [],
        finexpdt_s: [],

        exphh_s: [],
        expmm_s: [],
        custperson_s: [],
        attdatnum_s: [],
        value_code3_s: [],

        ref_type_s: [],
        ref_key_s: [],
        ref_seq_s: [],

        html_s: [],
      };

      let valid = true;
      mainDataResult.data.map((item) => {
        if (
          parseDate(convertDateToStr(item.finexpdt)) == "" ||
          parseDate(convertDateToStr(item.recdt)) == "" ||
          item.person == "" ||
          item.indicator == ""
        ) {
          valid = false;
        }
      });

      if (valid != true) {
        alert("필수항목을 채워주세요.");
      } else {
        const currentRow = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];
        let editorContent: any = "";
        if (refEditorRef.current) {
          editorContent = refEditorRef.current.getContent();
        }
        if (
          localStorage.getItem(currentRow[DATA_ITEM_KEY]) == undefined ||
          localStorage.getItem(currentRow[DATA_ITEM_KEY]) == null
        ) {
          localStorage.setItem(currentRow[DATA_ITEM_KEY], editorContent);
        } else {
          localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
          localStorage.setItem(currentRow[DATA_ITEM_KEY], editorContent);
        }

        let dataItem: any[] = [];

        mainDataResult.data.map((item) => {
          if (
            (item.rowstatus === "N" || item.rowstatus === "U") &&
            item.rowstatus !== undefined
          ) {
            dataItem.push(item);
          }
        });

        dataItem.forEach(async (item: any) => {
          const {
            num = "",

            rowstatus = "",
            guid = "",
            docunum = "",
            recdt = "",
            person = "",
            indicator = "",

            remark = "",
            groupcd = "",
            custcd = "",
            finexpdt = "",

            exphh = "",
            expmm = "",
            custperson = "",
            attdatnum = "",
            value_code3 = "",

            ref_type = "",
            ref_key = "",
            ref_seq = "",
          } = item;

          let str = "";
          const value = localStorage.getItem(num);

          if (typeof value == "string") {
            str = value; // ok
          }
          const parser = new DOMParser();
          const doc = parser.parseFromString(str, "text/html");
          const textContent = doc.body.textContent || ""; //문자열

          const bytes = require("utf8-bytes");
          const convertedEditorContent = bytesToBase64(bytes(str)); //html

          localStorage.removeItem(num);

          let data: any;

          //추가, 수정 프로시저 파라미터
          const paras = {
            fileBytes: convertedEditorContent,
            procedureName: "pw6_sav_task_order",
            pageNumber: 1,
            pageSize: 10,
            parameters: {
              "@p_work_type": "save",
              "@p_row_status": rowstatus,
              "@p_guid": guid == undefined ? "" : guid,
              "@p_docunum": docunum,
              "@p_recdt": recdt.length > 8 ? recdt : convertDateToStr(recdt),
              "@p_person": person,
              "@p_indicator": indicator,
              "@p_contents": textContent,
              "@p_remark": remark,
              "@p_groupcd": groupcd,
              "@p_value_code3": value_code3,
              "@p_custcd": custcd,
              "@p_finexpdt":
                finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt),
              "@p_exphh": exphh == undefined || exphh == "" ? 0 : exphh,
              "@p_expmm": expmm == undefined || expmm == "" ? 0 : expmm,
              "@p_custperson": custperson,
              "@p_attdatnum": attdatnum,
              "@p_ref_type": ref_type,
              "@p_ref_key": ref_key,
              "@p_ref_seq": ref_seq,
              "@p_id": userId,
              "@p_pc": pc,
            },
          };

          try {
            data = await processApi<any>("taskorder-save", paras);
          } catch (error) {
            data = null;
          }
        });

        deletedRows.forEach(async (item: any) => {
          const {
            num = "",

            rowstatus = "",
            guid = "",
            docunum = "",
            recdt = "",
            person = "",
            indicator = "",

            contents = "",
            remark = "",
            groupcd = "",
            custcd = "",
            finexpdt = "",

            exphh = "",
            expmm = "",
            custperson = "",
            attdatnum = "",
            value_code3 = "",

            ref_type = "",
            ref_key = "",
            ref_seq = "",
          } = item;
          let str = "";
          const value = localStorage.getItem(num);

          if (typeof value == "string") {
            str = value; // ok
          }
          const parser = new DOMParser();
          const doc = parser.parseFromString(str, "text/html");
          const textContent = doc.body.textContent || ""; //문자열

          const bytes = require("utf8-bytes");
          const convertedEditorContent = bytesToBase64(bytes(str)); //html

          localStorage.removeItem(num);

          let data: any;

          //추가, 수정 프로시저 파라미터
          const paras = {
            fileBytes: convertedEditorContent,
            procedureName: "pw6_sav_task_order",
            pageNumber: 1,
            pageSize: 10,
            parameters: {
              "@p_work_type": "save",
              "@p_row_status": rowstatus,
              "@p_guid": guid == undefined ? "" : guid,
              "@p_docunum": docunum,
              "@p_recdt": recdt.length > 8 ? recdt : convertDateToStr(recdt),
              "@p_person": person,
              "@p_indicator": indicator,
              "@p_contents": textContent,
              "@p_remark": remark,
              "@p_groupcd": groupcd,
              "@p_value_code3": value_code3,
              "@p_custcd": custcd,
              "@p_finexpdt":
                finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt),
              "@p_exphh": exphh == undefined || exphh == "" ? 0 : exphh,
              "@p_expmm": expmm == undefined || expmm == "" ? 0 : expmm,
              "@p_custperson": custperson,
              "@p_attdatnum": attdatnum,
              "@p_ref_type": ref_type,
              "@p_ref_key": ref_key,
              "@p_ref_seq": ref_seq,
              "@p_id": userId,
              "@p_pc": pc,
            },
          };

          try {
            data = await processApi<any>("taskorder-save", paras);
          } catch (error) {
            data = null;
          }
        });

        mainDataResult.data.map((item) => {
          if (
            localStorage.getItem(item[DATA_ITEM_KEY]) == null ||
            localStorage.getItem(item[DATA_ITEM_KEY]) == undefined
          ) {
            localStorage.removeItem(item[DATA_ITEM_KEY]);
          }
        });

        deletedRows = [];
        reload();
        onClose();
      }
    }
  };

  return (
    <Window
      title={"업무지시 작성"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
      <GridContainer height={`calc(100% - 60px)`}>
        <GridTitleContainer>
          <GridTitle>업무지시</GridTitle>
          <ButtonContainer>
            <Button
              onClick={onAddClick}
              themeColor={"primary"}
              icon="plus"
              title="행 추가"
            ></Button>
            <Button
              onClick={onRemoveClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="minus"
              title="행 삭제"
            ></Button>
          </ButtonContainer>
        </GridTitleContainer>
        <FilesContext.Provider
          value={{
            attdatnum,
            setAttdatnum,
            mainDataState,
            setMainDataState,
            // fetchGrid,
          }}
        >
          <WorkTypeContext.Provider value={{ WorkTypeItems: WorkTypeItems }}>
            <ValueCodeContext.Provider
              value={{ valuecodeItems: valuecodeItems }}
            >
              <UserContext.Provider value={{ usersData: usersData }}>
                <Grid
                  style={{ height: `60%` }}
                  data={process(
                    mainDataResult.data.map((row) => ({
                      ...row,
                      insert_userid: usersData.find(
                        (items: any) => items.user_id == row.insert_userid
                      )?.user_name,
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
                  <GridColumn field="rowstatus" title=" " width="45px" />
                  <GridColumn
                    field="is_defective"
                    title="불량"
                    width={80}
                    cell={defectiveCell}
                  />
                  <GridColumn
                    field="check_yn"
                    title="확인"
                    width={80}
                    cell={Check_ynCell}
                  />
                  <GridColumn
                    field="groupcd"
                    title="업무분류"
                    width={120}
                    cell={WorkTypeCodeCell}
                  />
                  <GridColumn
                    field="value_code3"
                    title="Value 구분"
                    width={120}
                    cell={ValueCodeCell}
                  />
                  <GridColumn
                    field="person"
                    title="처리담당자"
                    headerCell={RequiredHeader}
                    width={120}
                    cell={UserCell}
                  />
                  <GridColumn
                    field="finexpdt"
                    title="완료예정일"
                    cell={DateCell}
                    headerCell={RequiredHeader}
                    width={120}
                  />
                  <GridColumn
                    field="exphh"
                    title="예상(H)"
                    width={80}
                    cell={NumberCell}
                  />
                  <GridColumn
                    field="expmm"
                    title="예상(H)"
                    width={80}
                    cell={NumberCell}
                  />
                  <GridColumn
                    field="attdatnum"
                    title="첨부"
                    width={120}
                    cell={FilesCell}
                  />
                  <GridColumn field="remark" title="비고" width={150} />
                  <GridColumn
                    field="finyn"
                    title="완료"
                    width={100}
                    cell={CheckBoxReadOnlyCell}
                  />
                  <GridColumn
                    field="recdt"
                    title="지시일"
                    width={120}
                    cell={DateCell}
                    headerCell={RequiredHeader}
                  />
                  <GridColumn
                    field="indicator"
                    title="지시자"
                    width={120}
                    headerCell={RequiredHeader}
                    cell={UserCell}
                  />
                  <GridColumn field="docunum" title="지시번호" width={200} />
                  <GridColumn
                    field="insert_userid"
                    title="등록자"
                    width={120}
                  />
                  <GridColumn field="ref_key" title="참조번호1" width={200} />
                  <GridColumn
                    field="ref_seq"
                    title="참조번호2"
                    width={120}
                    cell={NumberCell}
                  />
                </Grid>
              </UserContext.Provider>
            </ValueCodeContext.Provider>
          </WorkTypeContext.Provider>
        </FilesContext.Provider>
        <ButtonContainer>
          <Button
            icon={"file-word"}
            name="meeting"
            onClick={downloadDoc}
            themeColor={"primary"}
            fillMode={"outline"}
            style={{ marginTop: "5px" }}
          >
            다운로드
          </Button>
        </ButtonContainer>
        <RichEditor id="refEditor" ref={refEditorRef} />
      </GridContainer>
      <BottomContainer>
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onConfirmClick}>
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

export default KendoWindow;
