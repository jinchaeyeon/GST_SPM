import { DataResult, State, getter, process } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { bytesToBase64 } from "byte-base64";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInGridInput,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../../../store/columns/common-columns";
import { Iparameters, TEditorHandle } from "../../../store/types";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";
import ComboBoxCell from "../../Cells/ComboBoxCell";
import DateCell from "../../Cells/DateCell";
import NumberCell from "../../Cells/NumberCell";
import {
  UseParaPc,
  convertDateToStr,
  extractDownloadFilename,
  getGridItemChangedData,
} from "../../CommonFunction";
import { EDIT_FIELD, SELECTED_FIELD } from "../../CommonString";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import RequiredHeader from "../../RequiredHeader";
import RichEditor from "../../RichEditor";
import ErrorWindow from "./ErrorWindow";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";

type IKendoWindow = {
  setVisible(t: boolean): void;
  reload(): void;
  para: ITypes;
  type: string;
  modal: boolean;
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

  //프로젝트 추가
  devmngnum: string;
  devmngseq: number;

  //회의록 추가
  meetingnum: string;
  meetingseq: number;
};
const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

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
  attach_exists: string;
  fileList: FileList | any[];
  savenmList: string[];
  setAttdatnum: (d: any) => void;
  setAttach_exists: (d: any) => void;
  setFileList: (d: any) => void;
  setSavenmList: (d: any) => void;
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
  const {
    setAttdatnum,
    setAttach_exists,
    setFileList,
    setSavenmList,
    attdatnum,
  } = useContext(FilesContext);
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

  const getAttachmentsData = (
    data: any,
    fileList?: FileList | any[],
    savenmList?: string[]
  ) => {
    if (fileList) {
      setFileList(fileList);
    } else {
      setFileList([]);
    }

    if (savenmList) {
      setSavenmList(savenmList);
    } else {
      setSavenmList([]);
    }
    setAttdatnum(data.length > 0 ? data[0].attdatnum : attdatnum);
    if (data.length == 0) {
      setAttach_exists("N");
    } else {
      setAttach_exists("Y");
    }
  };

  return (
    <>
      {render === undefined
        ? null
        : render?.call(undefined, defaultRendering, props)}
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={dataItem.attdatnum}
          permission={{ upload: true, download: true, delete: true }}
          type={"task"}
          fileLists={dataItem.fileList}
          savenmLists={dataItem.savenmList}
        />
      )}
    </>
  );
};

let temp = 0;
let deletedRows: any[] = [];
const KendoWindow = ({
  setVisible,
  para,
  type,
  reload,
  modal,
}: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
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

  const fetchCheck = async (str: string) => {
    let data: any;
    let result: string = "";

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(str));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }
  };

  const Check_ynCell = (props: GridCellProps) => {
    const data = props.dataItem;
    const changeCheck = async () => {
      if (data.rowstatus != "N") {
        if (data.indicator == userId) {
          const checkQueryStr = `UPDATE CR005T SET finyn = '${
            data.check_yn == "N" || data.check_yn == ""
              ? "Y"
              : data.check_yn == "Y"
              ? "N"
              : ""
          }' WHERE orgdiv = '${data.orgdiv}' AND docunum = '${data.docunum}'`;
          fetchCheck(checkQueryStr);
          const newData = mainDataResult.data.map((item) =>
            item[DATA_ITEM_KEY] == data[DATA_ITEM_KEY]
              ? {
                  ...item,
                  check_yn:
                    item.check_yn == "N" || item.check_yn == ""
                      ? true
                      : item.check_yn == "Y"
                      ? false
                      : !item.check_yn,
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

  const removeHTML = () => {
    setLoading(true);
    for (let key of Object.keys(localStorage)) {
      if (
        key != "passwordExpirationInfo" &&
        key != "accessToken" &&
        key != "loginResult" &&
        key != "refreshToken" &&
        key != "PopUpNotices" &&
        key != "recoil-persist"
      ) {
        localStorage.removeItem(key);
      }
    }
    setLoading(false);
  };

  const onClose = () => {
    removeHTML();
    setFileList([]);
    setSavenmList([]);
    setVisible(false);
  };
  const processApi = useApi();
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
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
        "@p_ref_key":
          para != undefined
            ? type == "접수"
              ? para.ref_number
              : type == "프로젝트"
              ? para.devmngnum
              : type == "회의록"
              ? para.meetingnum
              : ""
            : "",
        "@p_ref_seq":
          para != undefined
            ? type == "프로젝트"
              ? para.devmngseq
              : type == "회의록"
              ? para.meetingseq
              : 0
            : 0,
        "@p_find_row_value": "",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((item: { guid: undefined }) => ({
        ...item,
        guid: item.guid == undefined || item.guid == "" ? uuidv4() : item.guid,
        fileList: [],
        savenmList: [],
      }));

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

        fetchDocument("Task", rows[0].orgdiv + "_" + rows[0].docunum, rows[0]);
      } else {
        if (refEditorRef.current) {
          refEditorRef.current.setHtml("");
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDocument = async (type: string, ref_key: string, key?: any) => {
    let data: any;
    setLoading(true);

    if (type == "" || ref_key == "") {
      setHtmlOnEditor({ document: "" });
      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
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
        if (refEditorRef.current) {
          const document = data.document;
          if (
            localStorage.getItem(key[DATA_ITEM_KEY]) == undefined ||
            localStorage.getItem(key[DATA_ITEM_KEY]) == null
          ) {
            localStorage.setItem(key[DATA_ITEM_KEY], key.contents);
            localStorage.setItem(key[DATA_ITEM_KEY] + "key", document);
          } else {
            localStorage.removeItem(key[DATA_ITEM_KEY]);
            localStorage.removeItem(key[DATA_ITEM_KEY] + "key");
            localStorage.setItem(key[DATA_ITEM_KEY], key.contents);
            localStorage.setItem(key[DATA_ITEM_KEY] + "key", document);
          }
          refEditorRef.current.setHtml(document);
        } else {
          const document = data.document;
          setHtmlOnEditor({ document });
        }
      } else {
        console.log("[에러발생]");
        console.log(data);

        setHtmlOnEditor({ document: "" });
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
    let editorContent2: any = "";
    editorContent2 = refEditorRef.current?.getContent();
    let editorContent3: any = "";
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent2, "text/html");
    const textContent = doc.body.textContent || ""; //기존행 문자열

    if (
      localStorage.getItem(currentRow[DATA_ITEM_KEY]) == undefined ||
      localStorage.getItem(currentRow[DATA_ITEM_KEY]) == null
    ) {
      localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
      localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent2);
    } else {
      if (currentRow.rowstatus == "U" || currentRow.rowstatus == "N") {
        localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
        localStorage.removeItem(currentRow[DATA_ITEM_KEY] + "key");
        localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
        localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent2);
      }
    }
    setSelectedState(newSelectedState);
    if (selectedRowData.rowstatus == undefined) {
      fetchDocument(
        "Task",
        selectedRowData.orgdiv + "_" + selectedRowData.docunum,
        selectedRowData
      );
    } else {
      editorContent3 = localStorage.getItem(
        selectedRowData[DATA_ITEM_KEY] + "key"
      );
      if (refEditorRef.current) {
        refEditorRef.current.setHtml(editorContent3);
      }
    }
    setFileList([]);
    setSavenmList([]);
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

      if (datas.rowstatus == "N") {
        alert("신규 행을 다운로드가 불가능합니다.");
      } else {
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
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [attdatnum, setAttdatnum] = useState<string>("");
  const [attach_exists, setAttach_exists] = useState<string>("");
  const [errorWindowVisible, setErrorWindowVisible] = useState<boolean>(false);
  const onErrorWndClick = () => {
    const data = mainDataResult.data.filter(
      (item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    if (mainDataResult.total == 0) {
      alert("데이터가 없습니다.");
    } else if (data.rowstatus == "N") {
      alert("신규행을 불량 팝업조회가 불가능합니다.");
    } else {
      setErrorWindowVisible(true);
    }
  };
  useEffect(() => {
    if (fileList.length > 0 || savenmList.length > 0) {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] ==
        parseInt(Object.getOwnPropertyNames(selectedState)[0])
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              attdatnum: attdatnum,
              attach_exists: attach_exists,
              fileList: fileList,
              savenmList: savenmList,
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
      setFileList([]);
      setSavenmList([]);
    }
  }, [fileList, savenmList]);

  const onAddClick = () => {
    if (mainDataResult.total > 0) {
      const currentRow = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];
      let editorContent: any = "";
      if (refEditorRef.current) {
        editorContent = refEditorRef.current.getContent();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, "text/html");
      const textContent = doc.body.textContent || ""; //문자열
      localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
      localStorage.removeItem(currentRow[DATA_ITEM_KEY] + "key");
      localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
      localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent);
    }

    mainDataResult.data.map((item) => {
      if (item[DATA_ITEM_KEY] > temp) {
        temp = item[DATA_ITEM_KEY];
      }
    });
    const guid = uuidv4();
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
      guid: guid,
      groupcd: "",
      indicator: userId,
      is_defective: "N",
      orgdiv: "01",
      person: "",
      recdt: convertDateToStr(new Date()),
      ref_key:
        type == "접수"
          ? para.ref_number
          : type == "프로젝트"
          ? para.devmngnum
          : type == "회의록"
          ? para.meetingnum
          : "",
      ref_seq:
        para != undefined
          ? type == "프로젝트"
            ? para.devmngseq
            : type == "회의록"
            ? para.meetingseq
            : 0
          : 0,
      ref_type: type == undefined ? "" : type,
      remark: "",
      value_code3: para.value_code3,
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

  const onRemoveClick = async () => {
    if (mainDataResult.total > 0) {
      const datas = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];
      if (userId == datas.indicator) {
        const defectiveQueryStr = `SELECT ISNULL(MIN(ref_key),'') as ref_key FROM PR240T WHERE orgdiv = '01' AND ref_key = '${datas.docunum}'`;
        let data: any;

        const bytes = require("utf8-bytes");
        const convertedQueryStr = bytesToBase64(bytes(defectiveQueryStr));

        let query = {
          query: convertedQueryStr,
        };

        try {
          data = await processApi<any>("bizgst-query", query);
        } catch (error) {
          data = null;
        }

        const finynQueryStr = `SELECT ISNULL(MIN(docunum),'') as docunum FROM CR020T WHERE orgdiv = '01' AND docunum = '${datas.docunum}'`;
        let data2: any;

        const bytes2 = require("utf8-bytes");
        const convertedQueryStr2 = bytesToBase64(bytes2(finynQueryStr));

        let query2 = {
          query: convertedQueryStr2,
        };

        try {
          data2 = await processApi<any>("bizgst-query", query2);
        } catch (error) {
          data2 = null;
        }

        if (data.tables[0].Rows[0].ref_key != "") {
          alert("불량처리가 된 데이터는 삭제가 불가능합니다.");
        } else if (data2.tables[0].Rows[0].docunum != "") {
          alert("처리일지가 등록된 데이터는 삭제가 불가능합니다.");
        } else {
          //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
          let newData: any[] = [];
          let Object3: any[] = [];
          let Object2: any[] = [];
          let data;
          mainDataResult.data.forEach(async (item: any, index: number) => {
            if (!selectedState[item[DATA_ITEM_KEY]]) {
              newData.push(item);
              Object2.push(index);
            } else {
              if (!item.rowstatus || item.rowstatus != "N") {
                const newData2 = {
                  ...item,
                  rowstatus: "D",
                };
                deletedRows.push(newData2);
              } else {
                if (item.attdatnum != "") {
                  let data2: any;
                  try {
                    data2 = await processApi<any>("attachment-delete", {
                      attached:
                        "attachment?type=task&attachmentNumber=" +
                        item.attdatnum +
                        "&id=",
                    });
                  } catch (error) {
                    data2 = null;
                  }
                }
              }
              Object3.push(index);
              if (
                !(
                  localStorage.getItem(item[DATA_ITEM_KEY]) == undefined ||
                  localStorage.getItem(item[DATA_ITEM_KEY]) == null
                )
              ) {
                localStorage.removeItem(item[DATA_ITEM_KEY]);
                localStorage.removeItem(item[DATA_ITEM_KEY] + "key");
              }
            }
          });

          if (Math.min(...Object3) < Math.min(...Object2)) {
            data = mainDataResult.data[Math.min(...Object2)];
          } else {
            data = mainDataResult.data[Math.min(...Object3) - 1];
          }

          if (data != undefined) {
            const row =
              data != undefined
                ? data
                : newData[0] != undefined
                ? newData[0]
                : "";
            if (
              !(
                localStorage.getItem(row[DATA_ITEM_KEY]) == undefined ||
                localStorage.getItem(row[DATA_ITEM_KEY]) == null
              )
            ) {
              if (refEditorRef.current != null) {
                refEditorRef.current.setHtml(
                  localStorage.getItem(row[DATA_ITEM_KEY]) + "key"
                );
              }
            } else {
              fetchDocument("Task", row.orgdiv + "_" + row.docunum, row);
            }
          } else {
            fetchDocument("Task", "");
          }

          //newData 생성
          setMainDataResult((prev) => ({
            data: newData,
            total: prev.total - Object3.length,
          }));
          setSelectedState({
            [data != undefined ? data[DATA_ITEM_KEY] : newData[0]]: true,
          });
        }
      } else {
        alert("지시자 본인만 삭제가 가능합니다.");
      }
    }
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

  const onConfirmClick = async () => {
    if (mainDataResult.total > 0) {
      let editorContent: any = "";
      if (refEditorRef.current) {
        editorContent = refEditorRef.current.getContent();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, "text/html");
      const textContent = doc.body.textContent || ""; //문자열
      let array: any = [];

      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          ? {
              ...item,
              rowstatus:
                item.rowstatus == "N" ? "N" : item.rowstatus == "U" ? "U" : "",
            }
          : {
              ...item,
            }
      );

      const currentRow = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];
      array = newData;
      localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
      localStorage.removeItem(currentRow[DATA_ITEM_KEY] + "key");
      localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
      localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent);

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
      };
      let valid = true;
      let arrays: any = {};
      array.map(
        (item: {
          finexpdt: Date | null;
          recdt: Date | null;
          person: string;
          indicator: string;
        }) => {
          if (
            parseDate(convertDateToStr(item.finexpdt)) == "" ||
            parseDate(convertDateToStr(item.recdt)) == "" ||
            item.person == "" ||
            item.indicator == ""
          ) {
            valid = false;
          }
        }
      );

      if (valid != true) {
        alert("필수항목을 채워주세요.");
      } else {
        let dataItem: any[] = [];

        array.map((item: { rowstatus: string | undefined }) => {
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
            value_code3 = "",

            ref_type = "",
            ref_key = "",
            ref_seq = "",
          } = item;

          let str = "";
          let textContent = "";
          const value = localStorage.getItem(num + "key");
          const text = localStorage.getItem(num);
          if (typeof value == "string") {
            str = value; // ok
          }
          if (typeof text == "string") {
            textContent = text; // ok
          }
          const bytes = require("utf8-bytes");
          const convertedEditorContent = bytesToBase64(bytes(str)); //html

          let guids = "";

          if (guid == undefined || guid == "" || guid == null) {
            guids = uuidv4();
          } else {
            guids = guid;
          }

          arrays[guids] = convertedEditorContent;
          localStorage.removeItem(num);
          localStorage.removeItem(num + "key");

          rowsArr.row_status.push(rowstatus);
          rowsArr.guid_s.push(guids);
          rowsArr.docunum_s.push(docunum);
          rowsArr.recdt_s.push(
            recdt.length > 8 ? recdt : convertDateToStr(recdt)
          );
          rowsArr.person_s.push(person);
          rowsArr.indicator_s.push(indicator);

          rowsArr.contents_s.push(textContent);
          rowsArr.remark_s.push(remark);
          rowsArr.groupcd_s.push(groupcd);
          rowsArr.custcd_s.push(custcd);
          rowsArr.finexpdt_s.push(
            finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt)
          );

          rowsArr.exphh_s.push(exphh == "" ? 0 : exphh);
          rowsArr.expmm_s.push(expmm == "" ? 0 : expmm);
          rowsArr.custperson_s.push(custperson);
          rowsArr.value_code3_s.push(value_code3);

          rowsArr.ref_type_s.push(ref_type);
          rowsArr.ref_key_s.push(ref_key);
          rowsArr.ref_seq_s.push(ref_seq);
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
            value_code3 = "",

            ref_type = "",
            ref_key = "",
            ref_seq = "",
          } = item;

          let str = "";
          let textContent = "";
          const value = localStorage.getItem(num + "key");
          const text = localStorage.getItem(num);
          if (typeof value == "string") {
            str = value; // ok
          }
          if (typeof text == "string") {
            textContent = text; // ok
          }
          const bytes = require("utf8-bytes");
          const convertedEditorContent = bytesToBase64(bytes(str)); //html
          let guids = "";
          if (guid == undefined || guid == "" || guid == null) {
            guids = uuidv4();
          } else {
            guids = guid;
          }
          arrays[guids] = convertedEditorContent;
          localStorage.removeItem(num);
          localStorage.removeItem(num + "key");

          rowsArr.row_status.push(rowstatus);
          rowsArr.guid_s.push(guids);
          rowsArr.docunum_s.push(docunum);
          rowsArr.recdt_s.push(
            recdt.length > 8 ? recdt : convertDateToStr(recdt)
          );
          rowsArr.person_s.push(person);
          rowsArr.indicator_s.push(indicator);
          rowsArr.contents_s.push(textContent);
          rowsArr.remark_s.push(remark);
          rowsArr.groupcd_s.push(groupcd);
          rowsArr.custcd_s.push(custcd);
          rowsArr.finexpdt_s.push(
            finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt)
          );

          rowsArr.exphh_s.push(exphh == "" ? 0 : exphh);
          rowsArr.expmm_s.push(expmm == "" ? 0 : expmm);
          rowsArr.custperson_s.push(custperson);
          rowsArr.value_code3_s.push(value_code3);

          rowsArr.ref_type_s.push(ref_type);
          rowsArr.ref_key_s.push(ref_key);
          rowsArr.ref_seq_s.push(ref_seq);
        });

        setLoading(true);
        for (const item of dataItem) {
          let newAttachmentNumber = "";

          const promises = [];
          if (item.fileList != undefined) {
            for (const file of item.fileList) {
              // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
              if (item.attdatnum == "" && newAttachmentNumber == "") {
                newAttachmentNumber = await uploadFile(
                  file,
                  "task",
                  item.attdatnum
                );
                const promise = newAttachmentNumber;
                promises.push(promise);
                continue;
              }

              const promise = newAttachmentNumber
                ? await uploadFile(
                    file,
                    "task",
                    item.attdatnum,
                    newAttachmentNumber
                  )
                : await uploadFile(file, "task", item.attdatnum);
              promises.push(promise);
            }

            const results = await Promise.all(promises);

            // 실패한 파일이 있는지 확인
            if (results.includes(null)) {
              alert("파일 업로드에 실패했습니다.");
            } else {
              rowsArr.attdatnum_s.push(
                results[0] == undefined ? item.attdatnum : results[0]
              );
            }

            let datas: any;
            let type = "task";
            item.savenmList.map(async (parameter: any) => {
              try {
                datas = await processApi<any>("file-delete", {
                  type,
                  attached: parameter,
                });
              } catch (error) {
                datas = null;
              }
            });

            if (datas != null) {
              rowsArr.attdatnum_s.push(item.attdatnum);
            }
          }
        }

        for (const item of deletedRows) {
          let data2: any;
          try {
            data2 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=task&attachmentNumber=" +
                item.attdatnum +
                "&id=",
            });
          } catch (error) {
            data2 = null;
          }

          if (data2 != null) {
            rowsArr.attdatnum_s.push(item.attdatnum);
          }
        }

        let data: any;

        //추가, 수정 프로시저 파라미터
        const paras = {
          fileBytes: arrays,
          procedureName: "pw6_sav_task_order",
          pageNumber: 0,
          pageSize: 0,
          parameters: {
            "@p_work_type": "save",
            "@p_row_status": rowsArr.row_status.join("|"),
            "@p_guid": rowsArr.guid_s.join("|"),
            "@p_docunum": rowsArr.docunum_s.join("|"),
            "@p_recdt": rowsArr.recdt_s.join("|"),
            "@p_person": rowsArr.person_s.join("|"),
            "@p_indicator": rowsArr.indicator_s.join("|"),
            "@p_contents": rowsArr.contents_s.join("|"),
            "@p_remark": rowsArr.remark_s.join("|"),
            "@p_groupcd": rowsArr.groupcd_s.join("|"),
            "@p_value_code3": rowsArr.value_code3_s.join("|"),
            "@p_custcd": rowsArr.custcd_s.join("|"),
            "@p_finexpdt": rowsArr.finexpdt_s.join("|"),
            "@p_exphh": rowsArr.exphh_s.join("|"),
            "@p_expmm": rowsArr.expmm_s.join("|"),
            "@p_custperson": rowsArr.custperson_s.join("|"),
            "@p_attdatnum": rowsArr.attdatnum_s.join("|"),
            "@p_ref_type": rowsArr.ref_type_s.join("|"),
            "@p_ref_key": rowsArr.ref_key_s.join("|"),
            "@p_ref_seq": rowsArr.ref_seq_s.join("|"),
            "@p_id": userId,
            "@p_pc": pc,
          },
        };

        try {
          data = await processApi<any>("taskorder-save", paras);
        } catch (error) {
          data = error;
        }

        if (!data.hasOwnProperty("message")) {
          for (let key of Object.keys(localStorage)) {
            if (
              key != "passwordExpirationInfo" &&
              key != "accessToken" &&
              key != "loginResult" &&
              key != "refreshToken" &&
              key != "PopUpNotices" &&
              key != "recoil-persist"
            ) {
              localStorage.removeItem(key);
            }
          }
          deletedRows = [];
        } else {
          console.log("[오류 발생]");
          console.log(data);
          alert(data.message);
        }
        reload();
        setFileList([]);
        setSavenmList([]);
        setLoading(false);
      }
    } else {
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
      };
      let arrays: any = {};
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
          value_code3 = "",

          ref_type = "",
          ref_key = "",
          ref_seq = "",
        } = item;
        let str = "";
        const value = localStorage.getItem(num + "key");

        if (typeof value == "string") {
          str = value; // ok
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, "text/html");
        const textContent = doc.body.textContent || ""; //문자열

        const bytes = require("utf8-bytes");
        const convertedEditorContent = bytesToBase64(bytes(str)); //html

        arrays[guid] = convertedEditorContent;
        localStorage.removeItem(num);
        localStorage.removeItem(num + "key");

        rowsArr.row_status.push(rowstatus);
        rowsArr.guid_s.push(guid);
        rowsArr.docunum_s.push(docunum);
        rowsArr.recdt_s.push(
          recdt.length > 8 ? recdt : convertDateToStr(recdt)
        );
        rowsArr.person_s.push(person);
        rowsArr.indicator_s.push(indicator);
        rowsArr.contents_s.push(textContent);
        rowsArr.remark_s.push(remark);
        rowsArr.groupcd_s.push(groupcd);
        rowsArr.custcd_s.push(custcd);
        rowsArr.finexpdt_s.push(
          finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt)
        );

        rowsArr.exphh_s.push(exphh == "" ? 0 : exphh);
        rowsArr.expmm_s.push(expmm == "" ? 0 : expmm);
        rowsArr.custperson_s.push(custperson);
        rowsArr.value_code3_s.push(value_code3);

        rowsArr.ref_type_s.push(ref_type);
        rowsArr.ref_key_s.push(ref_key);
        rowsArr.ref_seq_s.push(ref_seq);
      });

      let data: any;

      for (const item of deletedRows) {
        let data2: any;
        try {
          data2 = await processApi<any>("attachment-delete", {
            attached:
              "attachment?type=task&attachmentNumber=" +
              item.attdatnum +
              "&id=",
          });
        } catch (error) {
          data2 = null;
        }

        if (data2 != null) {
          rowsArr.attdatnum_s.push(item.attdatnum);
        }
      }

      //추가, 수정 프로시저 파라미터
      const paras = {
        fileBytes: arrays,
        procedureName: "pw6_sav_task_order",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": "save",
          "@p_row_status": rowsArr.row_status.join("|"),
          "@p_guid": rowsArr.guid_s.join("|"),
          "@p_docunum": rowsArr.docunum_s.join("|"),
          "@p_recdt": rowsArr.recdt_s.join("|"),
          "@p_person": rowsArr.person_s.join("|"),
          "@p_indicator": rowsArr.indicator_s.join("|"),
          "@p_contents": rowsArr.contents_s.join("|"),
          "@p_remark": rowsArr.remark_s.join("|"),
          "@p_groupcd": rowsArr.groupcd_s.join("|"),
          "@p_value_code3": rowsArr.value_code3_s.join("|"),
          "@p_custcd": rowsArr.custcd_s.join("|"),
          "@p_finexpdt": rowsArr.finexpdt_s.join("|"),
          "@p_exphh": rowsArr.exphh_s.join("|"),
          "@p_expmm": rowsArr.expmm_s.join("|"),
          "@p_custperson": rowsArr.custperson_s.join("|"),
          "@p_attdatnum": rowsArr.attdatnum_s.join("|"),
          "@p_ref_type": rowsArr.ref_type_s.join("|"),
          "@p_ref_key": rowsArr.ref_key_s.join("|"),
          "@p_ref_seq": rowsArr.ref_seq_s.join("|"),
          "@p_id": userId,
          "@p_pc": pc,
        },
      };

      try {
        data = await processApi<any>("taskorder-save", paras);
      } catch (error) {
        data = error;
      }

      if (!data.hasOwnProperty("message")) {
        for (let key of Object.keys(localStorage)) {
          if (
            key != "passwordExpirationInfo" &&
            key != "accessToken" &&
            key != "loginResult" &&
            key != "refreshToken" &&
            key != "PopUpNotices" &&
            key != "recoil-persist"
          ) {
            localStorage.removeItem(key);
          }
        }
        deletedRows = [];
      } else {
        console.log("[오류 발생]");
        console.log(data);
        alert(data.message);
      }
      reload();
      setFileList([]);
      setSavenmList([]);
      setLoading(false);
    }
  };

  const uploadFile = async (
    files: File,
    type: string,
    attdatnum?: string,
    newAttachmentNumber?: string
  ) => {
    let data: any;

    const queryParams = new URLSearchParams();

    if (newAttachmentNumber != undefined) {
      queryParams.append("attachmentNumber", newAttachmentNumber);
    } else if (attdatnum != undefined) {
      queryParams.append("attachmentNumber", attdatnum == "" ? "" : attdatnum);
    }

    const formid = "%28web%29" + pathname;

    queryParams.append("type", type);
    queryParams.append("formId", formid);

    const filePara = {
      attached: "attachment?" + queryParams.toString(),
      files: files,
    };

    setLoading(true);

    try {
      data = await processApi<any>("file-upload", filePara);
    } catch (error) {
      data = null;
    }

    setLoading(false);

    if (data !== null) {
      return data.attachmentNumber;
    } else {
      return data;
    }
  };

  const onChanges = () => {
    if (mainDataResult.total > 0) {
      const currentRow = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];
      let editorContent: any = "";
      if (refEditorRef.current) {
        editorContent = refEditorRef.current.getContent();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, "text/html");
      const textContent = doc.body.textContent || ""; //문자열
      if (
        !(
          localStorage.getItem(currentRow[DATA_ITEM_KEY]) == undefined ||
          localStorage.getItem(currentRow[DATA_ITEM_KEY]) == null
        )
      ) {
        localStorage.removeItem(currentRow[DATA_ITEM_KEY]);
        localStorage.removeItem(currentRow[DATA_ITEM_KEY] + "key");
        localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
        localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent);
      } else {
        localStorage.setItem(currentRow[DATA_ITEM_KEY], textContent);
        localStorage.setItem(currentRow[DATA_ITEM_KEY] + "key", editorContent);
      }

      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
            }
          : {
              ...item,
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
      modal={modal}
    >
      <GridContainer height={`calc(100% - 60px)`}>
        <GridTitleContainer>
          <GridTitle>업무지시</GridTitle>
          <ButtonContainer>
            <Button
              onClick={onErrorWndClick}
              themeColor={"primary"}
              icon="gear"
            >
              불량 팝업
            </Button>
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
            attach_exists,
            fileList,
            savenmList,
            setAttdatnum,
            setAttach_exists,
            setFileList,
            setSavenmList,
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
                    title="예상(M)"
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
        <RichEditor
          id="refEditor"
          ref={refEditorRef}
          key={Object.getOwnPropertyNames(selectedState)[0]}
          change={onChanges}
        />
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
      {errorWindowVisible && (
        <ErrorWindow
          setVisible={setErrorWindowVisible}
          para={
            mainDataResult.data.filter(
              (item) =>
                item[DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? {}
              : mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0]
          }
          reload2={() => {
            fetchMainGrid();
          }}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
