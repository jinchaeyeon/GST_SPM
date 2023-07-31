import { Button } from "@progress/kendo-react-buttons";
import {
  ButtonContainer,
  ButtonInGridInput,
  FilterBox,
  FilterBoxWrap,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  Title,
  TitleContainer,
} from "../CommonStyled";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  UseParaPc,
  convertDateToStr,
  dateformat2,
  extractDownloadFilename,
  getGridItemChangedData,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../store/columns/common-columns";
import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  getter,
  process,
} from "@progress/kendo-data-query";
import {
  DEFAULT_ATTDATNUMS,
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../hooks/api";
import {
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { Iparameters, TEditorHandle } from "../store/types";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import DateCell from "../components/Cells/DateCell";
import CenterCell from "../components/Cells/CenterCell";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import RequiredHeader from "../components/RequiredHeader";
import NumberCell from "../components/Cells/NumberCell";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import RichEditor from "../components/RichEditor";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { IAttachmentData } from "../hooks/interfaces";
import AnswerWindow from "../components/Windows/CommonWindows/AnswerWindow";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const statusQueryStr = `
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const TypeQueryStr = `SELECT sub_code, code_name 
from comCodeMaster
where group_code ='BA400'`;

const DATA_ITEM_KEY = "docunum";
const SUB_DATA_ITEM_KEY = "num";
let targetRowIndex: null | number = null;
let temp = 0;
let deletedRows: any[] = [];

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

const TypeContext = createContext<{
  typeItems: any[];
}>({
  typeItems: [],
});

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

const TypeCodeCell = (props: GridCellProps) => {
  const { typeItems } = useContext(TypeContext);

  return typeItems ? (
    <ComboBoxCell columns={dataTypeColumns} data={typeItems} {...props} />
  ) : (
    <td />
  );
};

export const FilesContext = createContext<{
  attdatnum: string;
  files: string;
  setAttdatnum: (d: any) => void;
  setFiles: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

export const FilesContext2 = createContext<{
  attdatnum2: string;
  files2: string;
  setAttdatnum2: (d: any) => void;
  setFiles2: (d: any) => void;
  subDataState: State;
  setSubDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

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
  const { setAttdatnum, setFiles } = useContext(FilesContext);
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
      {value}
      <ButtonInGridInput>
        <Button
          name="itemcd"
          onClick={onAttWndClick2}
          icon="more-horizontal"
          fillMode="flat"
        />
      </ButtonInGridInput>
    </td>
  );

  return (
    <>
      {render === undefined
        ? null
        : render?.call(undefined, defaultRendering, props)}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          para={dataItem.attdatnum}
          permission={{ upload: false, download: true, delete: false }}
          type={"record"}
          modal={true}
        />
      )}
    </>
  );
};

const FilesCell2 = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    className = "",
  } = props;
  const { setAttdatnum2, setFiles2 } = useContext(FilesContext2);
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
      {value}
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
    setAttdatnum2(data.attdatnum);
    setFiles2(
      data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : "")
    );
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
          type={"record"}
          modal={true}
        />
      )}
    </>
  );
};

const App = () => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );
  // 삭제할 첨부파일 리스트를 담는 함수
  const [deletedAttadatnums, setDeletedAttadatnums] = useRecoilState(
    deletedAttadatnumsState
  );
  const [tabSelected, setTabSelected] = useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);

    const selectedRowData = mainDataResult.data.filter(
      (item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    if (e.selected == 0) {
      fetchDocument(
        "Task",
        selectedRowData.orgdiv + "_" + selectedRowData.docunum
      );
    } else if (e.selected == 1) {
      fetchDocument("Question", selectedRowData.reception_document_id);
    } else if (e.selected == 2) {
      fetchDocument("Answer", selectedRowData.answer_document_id);
    } else if (e.selected == 3) {
      fetchDocument("Meeting", selectedRowData.meeting_document_id);
    }
  };
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const [attachmentsWindowVisible2, setAttachmentsWindowVisible2] =
    useState<boolean>(false);
  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible2(true);
  };
  const [answerWindowVisible, setAnswerWindowVisible] =
    useState<boolean>(false);
  const onAnswerWndClick = () => {
    setAnswerWindowVisible(true);
  };
  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);
  const docEditorRef = useRef<TEditorHandle>(null);
  const docEditorRef2 = useRef<TEditorHandle>(null);
  const docEditorRef3 = useRef<TEditorHandle>(null);
  const docEditorRef4 = useRef<TEditorHandle>(null);

  const setHtmlOnEditor = ({ document }: { document: string }) => {
    if (docEditorRef.current) {
      docEditorRef.current.updateEditable(true);
      docEditorRef.current.setHtml(document);
      docEditorRef.current.updateEditable(false);
    }
    if (docEditorRef2.current) {
      docEditorRef2.current.updateEditable(true);
      docEditorRef2.current.setHtml(document);
      docEditorRef2.current.updateEditable(false);
    }
    if (docEditorRef3.current) {
      docEditorRef3.current.updateEditable(true);
      docEditorRef3.current.setHtml(document);
      docEditorRef3.current.updateEditable(false);
    }
    if (docEditorRef4.current) {
      docEditorRef4.current.updateEditable(true);
      docEditorRef4.current.setHtml(document);
      docEditorRef4.current.updateEditable(false);
    }
  };

  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const [filter, setFilter] = useState<FilterDescriptor>();
  const [filter2, setFilter2] = useState<FilterDescriptor>();
  const [filter3, setFilter3] = useState<FilterDescriptor>();
  const [filter4, setFilter4] = useState<FilterDescriptor>();

  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter(event.filter);
    }
  };
  const handleFilterChange2 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter2(event.filter);
    }
  };

  const handleFilterChange3 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter3(event.filter);
    }
  };

  const handleFilterChange4 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter4(event.filter);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchstatus();
    fetchWorkType();
    fetchUsers();
    fetchValueCode();
    fetchTypeCode();
  }, []);

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

  const fetchstatus = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(statusQueryStr));

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
      setStateData(rows);
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

  const fetchTypeCode = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(TypeQueryStr));

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
      setTypeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filterComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filterMultiSelectChange = (event: MultiSelectChangeEvent) => {
    const values = event.value;
    const name = event.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: values,
    }));
  };

  const [dateTypeData, setDateTypeData] = useState<any[]>([
    {
      sub_code: "A",
      code_name: "지시일",
    },
    {
      sub_code: "B",
      code_name: "완료예정일",
    },
    {
      sub_code: "C",
      code_name: "고객문의일-접수",
    },
    {
      sub_code: "D",
      code_name: "계약일-프로젝트",
    },
  ]);
  const [TypeData, setTypeData] = useState<any[]>([
    {
      code: 1,
      name: "접수",
    },
    {
      code: 2,
      name: "프로젝트",
    },
    {
      code: 3,
      name: "회의록",
    },
    {
      code: 4,
      name: "미참조",
    },
  ]);
  const [StatusData, setStateData] = useState<any[]>([]);
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const [typeItems, setTypeItems] = useState<any[]>([]);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [isVisibleDetail, setIsVisableDetail] = useState(true);

  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    custnm: string;
    work_category: any;
    status: any;
    contents: string;
    orderer: any;
    worker: any;
    type: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };
  type TSubFilters = {
    workType: string;
    docunum: string;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  );
  const [filters, setFilters] = useState<TFilters>({
    workType: "task_order",
    date_type: { sub_code: "A", code_name: "지시일" },
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    work_category: { sub_code: "", code_name: "" },
    status: [{ code: "N", name: "미완료" }],
    contents: "",
    orderer: { user_id: "", user_name: "" },
    worker: { user_id: userId, user_name: userName },
    type: [
      { code: 1, name: "접수" },
      { code: 2, name: "프로젝트" },
      { code: 3, name: "회의록" },
      { code: 4, name: "미참조" },
    ],
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  const [subFilters, setSubFilters] = useState<TSubFilters>({
    workType: "record",
    docunum: "",
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: false,
  });

  function getName(data: { name: string }[]) {
    let str = "";

    data.map((item: { name: string }) => (str += item.name + ", "));

    return data.length > 0 ? str.slice(0, -2) : str;
  }

  //그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length === 0
        ? "Y|N" // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : "Y|N"; //  2개 이상 선택시 => 전체

    const type =
      filters.type.length == 0
        ? "접수, 프로젝트, 회의록, 미참조"
        : filters.type.length == 1
        ? filters.type[0].name
        : getName(filters.type);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_record",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_contents": filters.contents,
        "@p_orderer": filters.orderer != null ? filters.orderer.user_id : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_value_code3": "",
        "@p_status": status,
        "@p_work_category":
          filters.work_category != null ? filters.work_category.sub_code : "",
        "@p_ref_type": type,
        "@p_ref_key": "",
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

      if (filters.find_row_value !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row[DATA_ITEM_KEY] == filters.find_row_value
          );
          targetRowIndex = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef.current) {
          targetRowIndex = 0;
        }
      }

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        const selectedRow =
          filters.find_row_value == ""
            ? rows[0]
            : rows.find(
                (row: any) => row[DATA_ITEM_KEY] == filters.find_row_value
              );

        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });

          if (tabSelected == 0) {
            fetchDocument(
              "Task",
              selectedRow.orgdiv + "_" + selectedRow.docunum
            );
          } else if (tabSelected == 1) {
            fetchDocument("Question", selectedRow.reception_document_id);
          } else if (tabSelected == 2) {
            fetchDocument("Answer", selectedRow.answer_document_id);
          } else if (tabSelected == 3) {
            fetchDocument("Meeting", selectedRow.meeting_document_id);
          }

          setSubFilters((prev) => ({
            ...prev,
            docunum: selectedRow.docunum,
            isSearch: true,
            pgNum: 1,
          }));
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

          if (tabSelected == 0) {
            fetchDocument("Task", rows[0].orgdiv + "_" + rows[0].docunum);
          } else if (tabSelected == 1) {
            fetchDocument("Question", rows[0].reception_document_id);
          } else if (tabSelected == 2) {
            fetchDocument("Answer", rows[0].answer_document_id);
          } else if (tabSelected == 3) {
            fetchDocument("Meeting", rows[0].meeting_document_id);
          }

          setSubFilters((prev) => ({
            ...prev,
            docunum: rows[0].docunum,
            isSearch: true,
            pgNum: 1,
          }));
        }
      } else {
        setSubDataResult((prev) => {
          return {
            data: [],
            total: 0,
          };
        });
        fetchDocument("", "");
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
        const document = data.document;
        setHtmlOnEditor({ document });
      } else {
        console.log("[에러발생]");
        console.log(data);

        setHtmlOnEditor({ document: "" });
      }
    }

    setLoading(false);
  };

  //그리드 데이터 조회
  const fetchSubGrid = async (subfilters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length === 0
        ? "Y|N" // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : "Y|N"; //  2개 이상 선택시 => 전체

    const type =
      filters.type.length == 0
        ? "접수, 프로젝트, 회의록, 미참조"
        : filters.type.length == 1
        ? filters.type[0].name
        : getName(filters.type);

    const parameters: Iparameters = {
      procedureName: "pw6_sel_record",
      pageNumber: subfilters.pgNum,
      pageSize: subfilters.pgSize,
      parameters: {
        "@p_work_type": subfilters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_contents": filters.contents,
        "@p_orderer": filters.orderer != null ? filters.orderer.user_id : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_value_code3": "",
        "@p_status": status,
        "@p_work_category":
          filters.work_category != null ? filters.work_category.sub_code : "",
        "@p_ref_type": type,
        "@p_ref_key": subfilters.docunum,
        //"@p_find_row_value": filters.find_row_value,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      let idx = 0;
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
        };
      });

      setSubDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        const selectedRow =
          subfilters.find_row_value == ""
            ? rows[0]
            : rows.find((row: any) => row.datnum == subfilters.find_row_value);

        if (selectedRow != undefined) {
          setSelectedsubDataState({ [selectedRow[SUB_DATA_ITEM_KEY]]: true });
        } else {
          setSelectedsubDataState({ [rows[0][SUB_DATA_ITEM_KEY]]: true });
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setSubFilters((prev) => ({
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
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (subFilters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(subFilters);
      setSubFilters((prev) => ({
        ...prev,
        find_row_value: "",
        isSearch: false,
      })); // 한번만 조회되도록
      fetchSubGrid(deepCopiedFilters);
    }
  }, [subFilters]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };
  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    // DB에 저장안된 첨부파일 서버에서 삭제
    if (unsavedAttadatnums.attdatnums.length > 0)
      setDeletedAttadatnums(unsavedAttadatnums);

    fetchDocument(
      "Task",
      selectedRowData.orgdiv + "_" + selectedRowData.docunum
    );

    setSubFilters((prev) => ({
      ...prev,
      docunum: selectedRowData.docunum,
      pgNum: 1,
      isSearch: true,
    }));
    setTabSelected(0);
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSubSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });
    setSelectedsubDataState(newSelectedState);
  };

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

  //그리드 푸터
  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {subDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const search = () => {
    if (
      filters.date_type == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      temp = 0;
      deletedRows = [];
      //DB에 저장안된 첨부파일 서버에서 삭제
      if (unsavedAttadatnums.attdatnums.length > 0)
        setDeletedAttadatnums(unsavedAttadatnums);

      setPage(initialPageState); // 페이지 초기화
      setTabSelected(0);
      setHtmlOnEditor({ document: "" });
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        find_row_value: "",
        isSearch: true,
      }));
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

  const onItemChange = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const onItemChange2 = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      SUB_DATA_ITEM_KEY
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

  const enterEdit = (dataItem: any, field: string) => {
    if (field == "files") {
      const newData = mainDataResult.data.map((item) =>
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
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = mainDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const enterEdit2 = (dataItem: any, field: string) => {
    if (field != "rowstatus") {
      const newData = subDataResult.data.map((item) =>
        item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
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
      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      setTempResult((prev) => {
        return {
          data: subDataResult.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit2 = () => {
    if (tempResult.data != subDataResult.data) {
      const newData = subDataResult.data.map((item) =>
        item[SUB_DATA_ITEM_KEY] ==
        Object.getOwnPropertyNames(selectedsubDataState)[0]
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
      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = subDataResult.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const onAddClick = () => {
    subDataResult.data.map((item) => {
      if (item[SUB_DATA_ITEM_KEY] > temp) {
        temp = item[SUB_DATA_ITEM_KEY];
      }
    });
    if (mainDataResult.total < 1) {
      alert("데이터가 없습니다.");
    } else {
      const data = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];

      const newDataItem = {
        [SUB_DATA_ITEM_KEY]: ++temp,
        attach_exists: "N",
        attdatnum: "",
        contents: data.contents,
        customer_code: data.custcd,
        customer_name: data.custnm,
        datnum: "",
        devmngnum: data.ref_key,
        devmngseq: data.ref_seq,
        docunum: data.docunum,
        is_finished: "N",
        kind1: "C05",
        person: data.person,
        processing_date: new Date(),
        ref_key: data.ref_key,
        title: "[A/S 처리] " + data.remark,
        use_hour: 0,
        use_minute: 0,
        value_code3: data.value_code3,
        rowstatus: "N",
      };

      setSubDataResult((prev) => {
        return {
          data: [newDataItem, ...prev.data],
          total: prev.total + 1,
        };
      });
      setSelectedsubDataState({ [newDataItem[SUB_DATA_ITEM_KEY]]: true });
    }
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];
    let Object: any[] = [];
    let Object2: any[] = [];
    let data;
    subDataResult.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState[item[SUB_DATA_ITEM_KEY]]) {
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
      data = subDataResult.data[Math.min(...Object2)];
    } else {
      data = subDataResult.data[Math.min(...Object) - 1];
    }

    //newData 생성
    setSubDataResult((prev) => ({
      data: newData,
      total: prev.total - Object.length,
    }));
    setSelectedsubDataState({
      [data != undefined ? data[SUB_DATA_ITEM_KEY] : newData[0]]: true,
    });
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

      function ids() {
        let id = ["", ""];
        if (tabSelected == 0) {
          id[0] = "Task";
          id[1] = datas.orgdiv + "_" + datas.docunum;
        } else if (tabSelected == 1) {
          id[0] = "Question";
          id[1] = datas.reception_document_id;
        } else if (tabSelected == 2) {
          id[0] = "Answer";
          id[1] = datas.answer_document_id;
        } else if (tabSelected == 3) {
          id[0] = "Meeting";
          id[1] = datas.meeting_document_id;
        }
        return id;
      }

      const para = {
        para: "doc?type=" + ids()[0] + "&id=" + ids()[1],
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

  const [attdatnum, setAttdatnum] = useState<string>("");
  const [files, setFiles] = useState<string>("");
  const [attdatnum2, setAttdatnum2] = useState<string>("");
  const [files2, setFiles2] = useState<string>("");

  useEffect(() => {
    if (attdatnum != "" && attdatnum != undefined && attdatnum != null) {
      setUnsavedAttadatnums((prev) => ({
        type: "record",
        attdatnums: [...prev.attdatnums, ...[attdatnum]],
      }));
    }
    const newData = mainDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] ==
      parseInt(Object.getOwnPropertyNames(selectedState)[0])
        ? {
            ...item,
            attdatnum: attdatnum,
            files: files,
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
  }, [attdatnum, files]);

  useEffect(() => {
    if (attdatnum2 != "" && attdatnum2 != undefined && attdatnum2 != null) {
      setUnsavedAttadatnums((prev) => ({
        type: "record",
        attdatnums: [...prev.attdatnums, ...[attdatnum2]],
      }));
    }
    const newData = subDataResult.data.map((item) =>
      item[SUB_DATA_ITEM_KEY] ==
      parseInt(Object.getOwnPropertyNames(selectedsubDataState)[0])
        ? {
            ...item,
            attdatnum: attdatnum2,
            files: files2,
          }
        : {
            ...item,
          }
    );

    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  }, [attdatnum2, files2]);

  const saveProject = () => {
    if (mainDataResult.total > 0) {
      type TRowsArr = {
        row_status: string[];
        datnum_s: string[];
        processing_date_s: string[];
        title_s: string[];
        contents_s: string[];
        value_code3_s: string[];
        kind1_s: string[];
        person_s: string[];
        usehh_s: string[];
        usemm_s: string[];
        asfinyn_s: string[];
        attdatnum_s: string[];
      };

      let rowsArr: TRowsArr = {
        row_status: [],
        datnum_s: [],
        processing_date_s: [],
        title_s: [],
        contents_s: [],
        value_code3_s: [],
        kind1_s: [],
        person_s: [],
        usehh_s: [],
        usemm_s: [],
        asfinyn_s: [],
        attdatnum_s: [],
      };

      let valid = true;
      subDataResult.data.map((item) => {
        if (
          parseDate(convertDateToStr(item.processing_date)) == "" ||
          item.kind1 == "" ||
          item.title == ""
        ) {
          valid = false;
        }
      });

      if (valid != true) {
        alert("필수항목을 채워주세요.");
      } else {
        let dataItem: any[] = [];

        subDataResult.data.map((item) => {
          if (
            (item.rowstatus === "N" || item.rowstatus === "U") &&
            item.rowstatus !== undefined
          ) {
            dataItem.push(item);
          }
        });

        dataItem.forEach((item: any) => {
          const {
            rowstatus = "",
            datnum = "",
            processing_date = "",
            title = "",
            contents = "",
            value_code3 = "",
            kind1 = "",
            person = "",
            use_hour = "",
            use_minute = "",
            is_finished = "",
            attdatnum = "",
          } = item;

          rowsArr.row_status.push(rowstatus);
          rowsArr.datnum_s.push(datnum);
          rowsArr.processing_date_s.push(
            processing_date.length > 8
              ? processing_date
              : convertDateToStr(processing_date)
          );
          rowsArr.title_s.push(title);
          rowsArr.contents_s.push(contents);
          rowsArr.value_code3_s.push(value_code3);
          rowsArr.kind1_s.push(kind1);
          rowsArr.person_s.push(person);
          rowsArr.usehh_s.push(use_hour == "" ? 0 : use_hour);
          rowsArr.usemm_s.push(use_minute == "" ? 0 : use_minute);
          rowsArr.asfinyn_s.push(
            is_finished == true ? "Y" : is_finished == false ? "N" : is_finished
          );
          rowsArr.attdatnum_s.push(attdatnum);
        });

        deletedRows.forEach((item: any) => {
          const {
            rowstatus = "",
            datnum = "",
            processing_date = "",
            title = "",
            contents = "",
            value_code3 = "",
            kind1 = "",
            person = "",
            use_hour = "",
            use_minute = "",
            is_finished = "",
            attdatnum = "",
          } = item;

          rowsArr.row_status.push(rowstatus);
          rowsArr.datnum_s.push(datnum);
          rowsArr.processing_date_s.push(
            processing_date.length > 8
              ? processing_date
              : convertDateToStr(processing_date)
          );
          rowsArr.title_s.push(title);
          rowsArr.contents_s.push(contents);
          rowsArr.value_code3_s.push(value_code3);
          rowsArr.kind1_s.push(kind1);
          rowsArr.person_s.push(person);
          rowsArr.usehh_s.push(use_hour == "" ? 0 : use_hour);
          rowsArr.usemm_s.push(use_minute == "" ? 0 : use_minute);
          rowsArr.asfinyn_s.push(
            is_finished == true ? "Y" : is_finished == false ? "N" : is_finished
          );
          rowsArr.attdatnum_s.push(attdatnum);
        });
        const data = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];
        setParaData({
          work_type: "SAVE",
          row_status: rowsArr.row_status.join("|"),
          datnum_s: rowsArr.datnum_s.join("|"),
          docunum_s: data.docunum,
          processing_date_s: rowsArr.processing_date_s.join("|"),
          title_s: rowsArr.title_s.join("|"),
          contents_s: rowsArr.contents_s.join("|"),
          value_code3_s: rowsArr.value_code3_s.join("|"),
          kind1_s: rowsArr.kind1_s.join("|"),
          person_s: rowsArr.person_s.join("|"),
          usehh_s: rowsArr.usehh_s.join("|"),
          usemm_s: rowsArr.usemm_s.join("|"),
          asfinyn_s: rowsArr.asfinyn_s.join("|"),
          attdatnum_s: rowsArr.attdatnum_s.join("|"),

          ref_key_s: data.ref_key,
          devmngnum_s: data.ref_key,
          devmngseq_s: data.ref_seq,
        });
      }
    }
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    row_status: "",
    datnum_s: "",
    docunum_s: "",
    processing_date_s: "",
    title_s: "",
    contents_s: "",
    value_code3_s: "",
    kind1_s: "",
    person_s: "",
    usehh_s: "",
    usemm_s: "",
    asfinyn_s: "",
    attdatnum_s: "",

    ref_key_s: "",
    devmngnum_s: "",
    devmngseq_s: "",
  });

  //추가, 수정 프로시저 파라미터
  const para: Iparameters = {
    procedureName: "pw6_sav_record",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_row_status": paraData.row_status,
      "@p_datnum": paraData.datnum_s,
      "@p_docunum": paraData.docunum_s,
      "@p_processing_date": paraData.processing_date_s,
      "@p_title": paraData.title_s,
      "@p_contents": paraData.contents_s,
      "@p_value_code3": paraData.value_code3_s,
      "@p_kind1": paraData.kind1_s,
      "@p_person": paraData.person_s,
      "@p_usehh": paraData.usehh_s,
      "@p_usemm": paraData.usemm_s,
      "@p_asfinyn": paraData.asfinyn_s,
      "@p_attdatnum": paraData.attdatnum_s,
      "@p_ref_key": paraData.ref_key_s,
      "@p_devmngnum": paraData.devmngnum_s,
      "@p_devmngseq": paraData.devmngseq_s,

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
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      deletedRows = [];
      setParaData({
        work_type: "",
        row_status: "",
        datnum_s: "",
        docunum_s: "",
        processing_date_s: "",
        title_s: "",
        contents_s: "",
        value_code3_s: "",
        kind1_s: "",
        person_s: "",
        usehh_s: "",
        usemm_s: "",
        asfinyn_s: "",
        attdatnum_s: "",

        ref_key_s: "",
        devmngnum_s: "",
        devmngseq_s: "",
      });
      // unsaved 첨부파일 초기화
      setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
      setFilters((prev) => ({
        ...prev,
        find_row_value: Object.getOwnPropertyNames(selectedState)[0],
        isSearch: true,
      }));
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }

    paraData.work_type = "";
  };

  return (
    <>
      <TitleContainer>
        <Title>처리일지 작성</Title>
        <ButtonContainer>
          <Button
            themeColor={"primary"}
            fillMode={"outline"}
            icon="save"
            onClick={saveProject}
          >
            저장
          </Button>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height={"90vh"}>
        <GridContainer width={`15%`}>
          <GridTitleContainer>
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
          <FilterBoxWrap>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th style={{ width: "50%" }}>
                    <MultiColumnComboBox
                      name="date_type"
                      data={
                        filter ? filterBy(dateTypeData, filter) : dateTypeData
                      }
                      value={filters.date_type}
                      columns={dataTypeColumns}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                      style={{ width: "100%" }}
                    />
                  </th>
                  <td colSpan={3}>
                    <CommonDateRangePicker
                      value={{
                        start: filters.fromDate,
                        end: filters.toDate,
                      }}
                      onChange={(e: { value: { start: any; end: any } }) =>
                        setFilters((prev) => ({
                          ...prev,
                          fromDate: e.value.start,
                          toDate: e.value.end,
                        }))
                      }
                      style={{ display: "inline-block" }}
                      className="required"
                    />
                  </td>
                </tr>
                <tr>
                  <th>업체명</th>
                  <td>
                    <Input
                      name="custnm"
                      type="text"
                      value={filters.custnm}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>업무분류</th>
                  <td>
                    <MultiColumnComboBox
                      name="work_category"
                      data={
                        filter2
                          ? filterBy(WorkTypeItems, filter2)
                          : WorkTypeItems
                      }
                      value={filters.work_category}
                      columns={dataTypeColumns}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange2}
                    />
                  </td>
                </tr>
                <tr>
                  <th>처리</th>
                  <td>
                    <MultiSelect
                      name="status"
                      data={StatusData}
                      onChange={filterMultiSelectChange}
                      value={filters.status}
                      textField="name"
                      dataItemKey="code"
                    />
                  </td>
                </tr>
                <tr>
                  <th>제목 및 내용</th>
                  <td>
                    <Input
                      name="contents"
                      type="text"
                      value={filters.contents}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>지시자</th>
                  <td>
                    <MultiColumnComboBox
                      name="orderer"
                      data={filter3 ? filterBy(usersData, filter3) : usersData}
                      value={filters.orderer}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange3}
                    />
                  </td>
                </tr>
                <tr>
                  <th>처리담당자</th>
                  <td>
                    <MultiColumnComboBox
                      name="worker"
                      data={filter4 ? filterBy(usersData, filter4) : usersData}
                      value={filters.worker}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange4}
                    />
                  </td>
                </tr>
                <tr>
                  <th>참조타입</th>
                  <td>
                    <MultiSelect
                      name="type"
                      data={TypeData}
                      onChange={filterMultiSelectChange}
                      value={filters.type}
                      textField="name"
                      dataItemKey="code"
                    />
                  </td>
                </tr>
              </tbody>
            </FilterBox>
          </FilterBoxWrap>
        </GridContainer>
        {isVisibleDetail && (
          <GridContainer width={`calc(40% - ${GAP}px)`}>
            <FilesContext.Provider
              value={{
                attdatnum,
                files,
                setAttdatnum,
                setFiles,
                mainDataState,
                setMainDataState,
                // fetchGrid,
              }}
            >
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>업무지시 정보</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: `45vh` }}
                  data={process(
                    mainDataResult.data.map((row) => ({
                      ...row,
                      indicator: usersData.find(
                        (items: any) => items.user_id == row.indicator
                      )?.user_name,
                      person: usersData.find(
                        (items: any) => items.user_id == row.person
                      )?.user_name,
                      groupcd: WorkTypeItems.find(
                        (items: any) => items.sub_code == row.groupcd
                      )?.code_name,
                      value_code3: valuecodeItems.find(
                        (items: any) => items.sub_code == row.value_code3
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
                  skip={page.skip}
                  take={page.take}
                  pageable={true}
                  onPageChange={pageChange}
                  //원하는 행 위치로 스크롤 기능
                  ref={gridRef}
                  rowHeight={30}
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
                  <GridColumn
                    field="is_finished"
                    title="처리"
                    width={80}
                    cell={CheckBoxReadOnlyCell}
                  />
                  <GridColumn
                    field="ref_type_full"
                    title="참조타입"
                    width={100}
                  />
                  <GridColumn
                    field="recdt"
                    title="지시일"
                    width={120}
                    cell={DateCell}
                    footerCell={mainTotalFooterCell}
                  />
                  <GridColumn field="indicator" title="지시자" width={120} />
                  <GridColumn field="custnm" title="업체명" width={150} />
                  <GridColumn field="groupcd" title="업무분류" width={120} />
                  <GridColumn
                    field="value_code3"
                    title="Value구분"
                    width={120}
                  />
                  <GridColumn field="person" title="처리담당자" width={120} />
                  <GridColumn
                    field="finexpdt"
                    title="완료예정일"
                    width={120}
                    cell={DateCell}
                  />
                  <GridColumn
                    field="exphh"
                    title="예상(H)"
                    width={100}
                    cell={CenterCell}
                  />
                  <GridColumn
                    field="expmm"
                    title="예상(M)"
                    width={100}
                    cell={CenterCell}
                  />
                  <GridColumn field="contents" title="내용" width={300} />
                  <GridColumn
                    field="files"
                    title="첨부"
                    width={200}
                    cell={FilesCell}
                  />
                  <GridColumn field="remark" title="비고" width={200} />
                  <GridColumn field="docunum" title="관리번호" width={200} />
                </Grid>
              </GridContainer>
            </FilesContext.Provider>
            <FilesContext2.Provider
              value={{
                attdatnum2,
                files2,
                setAttdatnum2,
                setFiles2,
                subDataState,
                setSubDataState,
                // fetchGrid,
              }}
            >
              <TypeContext.Provider value={{ typeItems: typeItems }}>
                <ValueCodeContext.Provider
                  value={{ valuecodeItems: valuecodeItems }}
                >
                  <UserContext.Provider value={{ usersData: usersData }}>
                    <GridContainer style={{ marginTop: "10px" }}>
                      <GridTitleContainer>
                        <GridTitle>처리 영역</GridTitle>
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
                      <Grid
                        style={{ height: `35vh` }}
                        data={process(
                          subDataResult.data.map((row) => ({
                            ...row,
                            [SELECTED_FIELD]:
                              selectedsubDataState[idGetter2(row)],
                          })),
                          subDataState
                        )}
                        {...subDataState}
                        onDataStateChange={onSubDataStateChange}
                        //선택 기능
                        dataItemKey={SUB_DATA_ITEM_KEY}
                        selectedField={SELECTED_FIELD}
                        selectable={{
                          enabled: true,
                          mode: "single",
                        }}
                        onSelectionChange={onSubSelectionChange}
                        //스크롤 조회 기능
                        fixedScroll={true}
                        total={subDataResult.total}
                        ref={gridRef2}
                        //정렬기능
                        sortable={true}
                        onSortChange={onSubSortChange}
                        //컬럼순서조정
                        reorderable={true}
                        //컬럼너비조정
                        resizable={true}
                        onItemChange={onItemChange2}
                        cellRender={customCellRender2}
                        rowRender={customRowRender2}
                        editField={EDIT_FIELD}
                      >
                        <GridColumn field="rowstatus" title=" " width="45px" />
                        <GridColumn
                          field="is_finished"
                          title="완료"
                          width={80}
                          cell={CheckBoxCell}
                        />
                        <GridColumn
                          field="processing_date"
                          title="처리일자"
                          headerCell={RequiredHeader}
                          width={120}
                          cell={DateCell}
                          footerCell={subTotalFooterCell}
                        />
                        <GridColumn
                          field="person"
                          title="처리자"
                          width={120}
                          cell={UserCell}
                        />
                        <GridColumn
                          field="use_hour"
                          title="시간"
                          width={100}
                          cell={NumberCell}
                        />
                        <GridColumn
                          field="use_minute"
                          title="분"
                          width={100}
                          cell={NumberCell}
                        />
                        <GridColumn
                          field="kind1"
                          title="전체분류"
                          headerCell={RequiredHeader}
                          cell={TypeCodeCell}
                          width={120}
                        />
                        <GridColumn field="contents" title="내용" width={300} />
                        <GridColumn
                          field="files"
                          cell={FilesCell2}
                          title="첨부"
                          width={200}
                        />
                        <GridColumn
                          field="value_code3"
                          title="Value구분"
                          width={120}
                          cell={ValueCodeCell}
                        />
                        <GridColumn
                          field="title"
                          title="제목"
                          headerCell={RequiredHeader}
                          width={200}
                        />
                      </Grid>
                    </GridContainer>
                  </UserContext.Provider>
                </ValueCodeContext.Provider>
              </TypeContext.Provider>
            </FilesContext2.Provider>
          </GridContainer>
        )}
        <GridContainer
          width={
            isVisibleDetail ? `calc(45% - ${GAP}px)` : `calc(85% - ${GAP}px)`
          }
        >
          <GridTitleContainer>
            <GridTitle>
              <Button
                themeColor={"primary"}
                fillMode={"flat"}
                icon={isVisibleDetail ? "chevron-left" : "chevron-right"}
                onClick={() => setIsVisableDetail((prev) => !prev)}
              ></Button>
              상세정보
            </GridTitle>
            <ButtonContainer>
              <Button
                icon={"file-word"}
                name="meeting"
                onClick={downloadDoc}
                themeColor={"primary"}
                fillMode={"outline"}
              >
                다운로드
              </Button>
              <Button
                icon={"pencil"}
                disabled={tabSelected == 2 ? false : true}
                themeColor={"primary"}
                fillMode={"outline"}
                onClick={onAnswerWndClick}
              >
                수정
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <TabStrip
            style={{ width: "100%", height: `85.5vh` }}
            selected={tabSelected}
            onSelect={handleSelectTab}
          >
            <TabStripTab title="지시 내용">
              <GridContainer style={{ height: "78vh" }}>
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>비고</th>
                        <td>
                          <Input
                            name="remark"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].remark
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <RichEditor id="docEditor" ref={docEditorRef} hideTools />
              </GridContainer>
            </TabStripTab>
            <TabStripTab
              title="접수 내용"
              disabled={
                mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0] == undefined
                  ? true
                  : mainDataResult.data.filter(
                      (item) =>
                        item[DATA_ITEM_KEY] ==
                        Object.getOwnPropertyNames(selectedState)[0]
                    )[0].ref_type == "접수"
                  ? false
                  : true
              }
            >
              <GridContainer style={{ height: "78vh" }}>
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>제목</th>
                        <td colSpan={5}>
                          <Input
                            name="reception_title"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].reception_title
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>업체</th>
                        <td>
                          <Input
                            name="custnm"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].custnm
                            }
                            className="readonly"
                          />
                        </td>
                        <th style={{ width: "5%" }}>문의자</th>
                        <td>
                          <Input
                            name="custperson"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].custperson
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>문의번호</th>
                        <td colSpan={3}>
                          <Input
                            name="reception_document_id"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].reception_document_id
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <RichEditor id="docEditor2" ref={docEditorRef2} hideTools />
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>첨부파일</th>
                        <td>
                          <Input
                            name="reception_files"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].reception_files
                            }
                            className="readonly"
                          />
                          <ButtonInGridInput>
                            <Button
                              onClick={onAttWndClick}
                              icon="more-horizontal"
                              fillMode="flat"
                            />
                          </ButtonInGridInput>
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
              </GridContainer>
            </TabStripTab>
            <TabStripTab
              title="답변 내용"
              disabled={
                mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0] == undefined
                  ? true
                  : mainDataResult.data.filter(
                      (item) =>
                        item[DATA_ITEM_KEY] ==
                        Object.getOwnPropertyNames(selectedState)[0]
                    )[0].ref_type_full == "접수-문의"
                  ? false
                  : true
              }
            >
              <GridContainer style={{ height: "78vh" }}>
                <RichEditor id="docEditor3" ref={docEditorRef3} hideTools />
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>첨부파일</th>
                        <td>
                          <Input
                            name="answer_files"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].answer_files
                            }
                            className="readonly"
                          />
                          <ButtonInGridInput>
                            <Button
                              onClick={onAttWndClick2}
                              icon="more-horizontal"
                              fillMode="flat"
                            />
                          </ButtonInGridInput>
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
              </GridContainer>
            </TabStripTab>
            <TabStripTab
              title="회의록 정보"
              disabled={
                mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0] == undefined
                  ? true
                  : mainDataResult.data.filter(
                      (item) =>
                        item[DATA_ITEM_KEY] ==
                        Object.getOwnPropertyNames(selectedState)[0]
                    )[0].ref_type_full == "회의록"
                  ? false
                  : true
              }
            >
              <GridContainer style={{ height: "78vh" }}>
                <GridTitleContainer>
                  <GridTitle>회의록 내용(요구사항)</GridTitle>
                </GridTitleContainer>
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>내용</th>
                        <td colSpan={3}>
                          <Input
                            name="meeting_contents"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_contents
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>요청일</th>
                        <td>
                          <Input
                            name="meeting_reqdt"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : dateformat2(
                                    mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
                                    )[0].meeting_reqdt
                                  )
                            }
                            className="readonly"
                          />
                        </td>
                        <th style={{ width: "5%" }}>완료예정일</th>
                        <td>
                          <Input
                            name="meeting_finexpdt"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : dateformat2(
                                    mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
                                    )[0].meeting_finexpdt
                                  )
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>고객담당자</th>
                        <td>
                          <Input
                            name="meeting_client_name"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_client_name
                            }
                            className="readonly"
                          />
                        </td>
                        <th style={{ width: "5%" }}>고객완료예정일</th>
                        <td>
                          <Input
                            name="meeting_client_finexpdt"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : dateformat2(
                                    mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
                                    )[0].meeting_client_finexpdt
                                  )
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <GridTitleContainer>
                  <GridTitle>회의록 기본정보</GridTitle>
                </GridTitleContainer>
                <FormBoxWrap border={true}>
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: "5%" }}>회의일</th>
                        <td>
                          <Input
                            name="meeting_date"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : dateformat2(
                                    mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
                                    )[0].meeting_date
                                  )
                            }
                            className="readonly"
                          />
                        </td>
                        <th style={{ width: "5%" }}>업체</th>
                        <td>
                          <Input
                            name="meeting_custnm"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_custnm
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>제목</th>
                        <td colSpan={5}>
                          <Input
                            name="meeting_title"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_title
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>비고</th>
                        <td colSpan={5}>
                          <TextArea
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_remark
                            }
                            name="meeting_remark"
                            rows={2}
                            className="readonly"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th style={{ width: "5%" }}>첨부파일</th>
                        <td colSpan={5}>
                          <Input
                            name="meeting_files"
                            type="text"
                            value={
                              mainDataResult.data.filter(
                                (item) =>
                                  item[DATA_ITEM_KEY] ==
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].meeting_files
                            }
                            className="readonly"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <GridTitleContainer>
                  <GridTitle>회의 참고 자료</GridTitle>
                </GridTitleContainer>
                <RichEditor id="docEditor4" ref={docEditorRef4} hideTools />
              </GridContainer>
            </TabStripTab>
          </TabStrip>
        </GridContainer>
      </GridContainerWrap>
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          para={
            mainDataResult.data.filter(
              (item) =>
                item[DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0].reception_attdatnum
          }
          permission={{ upload: false, download: true, delete: false }}
          type={"question"}
          modal={true}
        />
      )}
      {attachmentsWindowVisible2 && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible2}
          para={
            mainDataResult.data.filter(
              (item) =>
                item[DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0].answer_attdatnum
          }
          permission={{ upload: false, download: true, delete: false }}
          type={"answer"}
          modal={true}
        />
      )}
      {answerWindowVisible && (
        <AnswerWindow
          setVisible={setAnswerWindowVisible}
          para={
            mainDataResult.data.filter(
              (item) =>
                item[DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? []
              : mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0]
          }
        />
      )}
    </>
  );
};
export default App;
