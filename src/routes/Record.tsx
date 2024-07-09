import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  getter,
  process,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
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
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { bytesToBase64 } from "byte-base64";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
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
import CenterCell from "../components/Cells/CenterCell";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  UseParaPc,
  convertDateToStr,
  dateformat2,
  extractDownloadFilename,
  getDeviceHeight,
  getGridItemChangedData,
  getHeight,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import {
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import RequiredHeader from "../components/RequiredHeader";
import RichEditor from "../components/RichEditor";
import AnswerWindow from "../components/Windows/CommonWindows/AnswerWindow";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import ContentWindow from "../components/Windows/CommonWindows/ContentWindow";
import { useApi } from "../hooks/api";
import {
  isFilterHideState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../store/columns/common-columns";
import { Iparameters, TEditorHandle } from "../store/types";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import FilterContainer from "../components/FilterContainer";

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const statusQueryStr = `
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

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
  fileList: FileList | any[];
  savenmList: string[];
  setAttdatnum: (d: any) => void;
  setFiles: (d: any) => void;
  setFileList: (d: any) => void;
  setSavenmList: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

export const FilesContext2 = createContext<{
  attdatnum2: string;
  files2: string;
  fileList2: FileList | any[];
  savenmList2: string[];
  setAttdatnum2: (d: any) => void;
  setFiles2: (d: any) => void;
  setFileList2: (d: any) => void;
  setSavenmList2: (d: any) => void;
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
  const {
    attdatnum2,
    setAttdatnum2,
    setFiles2,
    fileList2,
    setFileList2,
    savenmList2,
    setSavenmList2,
  } = useContext(FilesContext2);
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

  const getAttachmentsData = (
    data: any,
    fileList?: FileList | any[],
    savenmList?: string[]
  ) => {
    if (fileList) {
      setFileList2(fileList);
    } else {
      setFileList2([]);
    }

    if (savenmList) {
      setSavenmList2(savenmList);
    } else {
      setSavenmList2([]);
    }

    setAttdatnum2(data.length > 0 ? data[0].attdatnum : attdatnum2);
    setFiles2(
      data.length > 1
        ? data[0].realnm + " 등 " + String(data.length) + "건"
        : data.length == 0
        ? ""
        : data[0].realnm
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
          fileLists={dataItem.fileList}
          savenmLists={dataItem.savenmList}
        />
      )}
    </>
  );
};

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;
var height7 = 0;
var height8 = 0;
var height9 = 0;
var height10 = 0;

const App = () => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [title, setTitle] = useRecoilState(titles);

  const [tabSelected, setTabSelected] = useState(0);
  const [isFilterHideStates, setIsFilterHideStates] =
    useRecoilState(isFilterHideState);

  const [swiper, setSwiper] = useState<SwiperCore>();
  const [swiper2, setSwiper2] = useState<SwiperCore>();
  const [swiper3, setSwiper3] = useState<SwiperCore>();

  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [mobileheight4, setMobileHeight4] = useState(0);
  const [mobileheight5, setMobileHeight5] = useState(0);
  const [mobileheight6, setMobileHeight6] = useState(0);
  const [mobileheight7, setMobileHeight7] = useState(0);
  const [mobileheight8, setMobileHeight8] = useState(0);
  const [mobileheight9, setMobileHeight9] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [webheight4, setWebHeight4] = useState(0);
  const [webheight5, setWebHeight5] = useState(0);
  const [webheight6, setWebHeight6] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".ButtonContainer4");
    height5 = getHeight(".ButtonContainer5");
    height6 = getHeight(".ButtonContainer6");
    height7 = getHeight(".FormBoxWrap");
    height8 = getHeight(".FormBoxWrap2");
    height9 = getHeight(".TitleContainer");
    height10 = getHeight(".k-tabstrip-items-wrapper");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height - height9);
      setMobileHeight2(getDeviceHeight(true) - height2 - height9);
      setMobileHeight3(
        getDeviceHeight(true) - height3 - height7 - height9 - height10
      );
      setMobileHeight4(
        getDeviceHeight(true) - height - height9 - height10 - 32
      );
      setMobileHeight5(
        getDeviceHeight(true) - height2 - height8 - height9 - height10 - 20
      );
      setMobileHeight6(
        getDeviceHeight(true) - height7 - height9 - height10 - 15
      );
      setMobileHeight7(
        getDeviceHeight(true) - height4 - height9 - height10 - 33
      );
      setMobileHeight8(
        getDeviceHeight(true) - height5 - height9 - height10 - 33
      );
      setMobileHeight9(
        getDeviceHeight(true) - height6 - height9 - height10 - 28
      );

      setWebHeight((getDeviceHeight(false) - height9 - 10) / 2 - height - 2);
      setWebHeight2((getDeviceHeight(false) - height9 - 10) / 2 - height2 - 2);
      setWebHeight3(
        getDeviceHeight(false) - height3 - height7 - height9 - height10 + 2
      );
      setWebHeight4(
        getDeviceHeight(false) -
          height3 -
          height7 -
          height8 -
          height9 -
          height10
      );
      setWebHeight5(
        getDeviceHeight(false) - height3 - height7 - height9 - height10 + 2
      );
      setWebHeight6(
        getDeviceHeight(false) -
          height4 -
          height5 -
          height6 -
          height7 -
          height8 -
          height9 -
          height10 -
          30
      );
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3, tabSelected]);

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
  const [contentWindowVisible, setContentWindowVisible] =
    useState<boolean>(false);
  const onContentWndClick = () => {
    if (subDataResult.data.length > 0) {
      setContentWindowVisible(true);
    } else {
      alert("데이터가 없습니다.");
    }
  };
  const getContentData = (title: string, content: string) => {
    const newData = subDataResult.data.map((item) =>
      item[SUB_DATA_ITEM_KEY] ==
      Object.getOwnPropertyNames(selectedsubDataState)[0]
        ? {
            ...item,
            rowstatus: item.rowstatus == "N" ? "N" : "U",
            title: title,
            contents: content,
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
    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const history = useHistory();

  useEffect(() => {
    // 접근 권한 검증
    if (loginResult) {
      const role = loginResult ? loginResult.role : "";
      const isAdmin = role === "ADMIN";

      if (!isAdmin && localStorage.getItem("accessToken")) {
        alert("접근 권한이 없습니다.");
        history.goBack();
      }
    }
  }, [loginResult]);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
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
    if (localStorage.getItem("accessToken")) {
      // ComboBox에 사용할 코드 리스트 조회
      fetchstatus();
      fetchWorkType();
      fetchUsers();
      fetchValueCode();
      fetchTypeCode();
      setTitle("처리일지 작성");
    }
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
        "@p_find_row_value": filters.findRowValue,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (filters.findRowValue !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row.docunum == filters.findRowValue
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
          filters.findRowValue == ""
            ? rows[0]
            : rows.find((row: any) => row.docunum == filters.findRowValue);

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
        "@p_find_row_value": "",
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      let idx = 0;
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => {
        return {
          ...row,
          fileList: [],
          savenmList: [],
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
          subfilters.findRowValue == ""
            ? rows[0]
            : rows.find((row: any) => row.datnum == subfilters.findRowValue);

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
    if (filters.isSearch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, findRowValue: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      // ComboBox에 사용할 코드 리스트 조회
      fetchstatus();
      fetchWorkType();
      fetchUsers();
      fetchValueCode();
      fetchTypeCode();
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          isSearch: true,
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("처리일지 작성");
    }
  }, []);

  useEffect(() => {
    if (subFilters.isSearch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(subFilters);
      setSubFilters((prev) => ({
        ...prev,
        findRowValue: "",
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
    setFileList2([]);
    setSavenmList2([]);
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
      setFileList([]);
      setSavenmList([]);
      setFileList2([]);
      setSavenmList2([]);
      setPage(initialPageState); // 페이지 초기화
      setTabSelected(0);
      setHtmlOnEditor({ document: "" });
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        findRowValue: "",
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
    let Object1: any[] = [];
    let Object2: any[] = [];
    let data;
    subDataResult.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState[item[SUB_DATA_ITEM_KEY]]) {
        newData.push(item);
        Object2.push(index);
      } else {
        const newData2 = item;
        newData2.rowstatus = "D";
        Object1.push(index);
        deletedRows.push(newData2);
      }
    });

    if (Math.min(...Object1) < Math.min(...Object2)) {
      data = subDataResult.data[Math.min(...Object2)];
    } else {
      data = subDataResult.data[Math.min(...Object1) - 1];
    }

    //newData 생성
    setSubDataResult((prev) => ({
      data: newData,
      total: prev.total - Object1.length,
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

  const [attdatnum, setAttdatnum] = useState<string>("");
  const [files, setFiles] = useState<string>("");
  const [attdatnum2, setAttdatnum2] = useState<string>("");
  const [files2, setFiles2] = useState<string>("");
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [fileList2, setFileList2] = useState<FileList | any[]>([]);
  const [savenmList2, setSavenmList2] = useState<string[]>([]);

  useEffect(() => {
    if (fileList2.length > 0 || savenmList2.length > 0) {
      const newData = subDataResult.data.map((item) =>
        item[SUB_DATA_ITEM_KEY] ==
        parseInt(Object.getOwnPropertyNames(selectedsubDataState)[0])
          ? {
              ...item,
              attdatnum: attdatnum2,
              files: files2,
              fileList: fileList2,
              savenmList: savenmList2,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
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
      setFileList2([]);
      setSavenmList2([]);
    }
  }, [fileList2, savenmList2]);

  const saveProject = async () => {
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
                  "record",
                  item.attdatnum
                );
                const promise = newAttachmentNumber;
                promises.push(promise);
                continue;
              }

              const promise = newAttachmentNumber
                ? await uploadFile(
                    file,
                    "record",
                    item.attdatnum,
                    newAttachmentNumber
                  )
                : await uploadFile(file, "record", item.attdatnum);
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
            let type = "record";
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
          } else {
            rowsArr.attdatnum_s.push(item.attdatnum);
          }
        }

        for (const item of deletedRows) {
          let data2: any;
          try {
            data2 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=record&attachmentNumber=" +
                item.attdatnum +
                "&id=",
            });
          } catch (error) {
            data2 = null;
          }

          if (data2 != null) {
            rowsArr.attdatnum_s.push(item.attdatnum);
          } else {
            rowsArr.attdatnum_s.push(item.attdatnum);
          }
        }

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
        setLoading(false);
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
      data = await processApi<any>("document-save", para);
    } catch (error) {
      data = null;
    }

    if (data != null) {
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
      setFileList2([]);
      setSavenmList2([]);
      setFilters((prev) => ({
        ...prev,
        findRowValue: data.returnString,
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
      <TitleContainer className="TitleContainer">
        {!isMobile ? "" : <Title>처리일지 작성</Title>}
        <ButtonContainer>
          <Button
            themeColor={"primary"}
            fillMode={"outline"}
            icon="save"
            onClick={saveProject}
          >
            저장
          </Button>
          { isMobile && (
            <Button onClick={search} icon="search" themeColor={"primary"}>
              조회
            </Button>
          )}
        </ButtonContainer>
      </TitleContainer>
      {isMobile ? (
        <>
          <FilterContainer>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>기간</th>
                  <td>
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
                    />
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
          </FilterContainer>
          <Swiper
            onSwiper={(swiper) => {
              setSwiper(swiper);
            }}
            onActiveIndexChange={(swiper) => {
              index = swiper.activeIndex;
            }}
          >
            <SwiperSlide key={0}>
              <FilesContext.Provider
                value={{
                  attdatnum,
                  files,
                  fileList,
                  savenmList,
                  setAttdatnum,
                  setFiles,
                  setFileList,
                  setSavenmList,
                  mainDataState,
                  setMainDataState,
                  // fetchGrid,
                }}
              >
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer">
                    <GridTitle>
                      업무지시 정보{" "}
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={"chevron-right"}
                        onClick={() => {
                          if (swiper) {
                            swiper.slideTo(1);
                          }
                        }}
                      ></Button>
                    </GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: mobileheight }}
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
            </SwiperSlide>
            <SwiperSlide key={1}>
              <FilesContext2.Provider
                value={{
                  attdatnum2,
                  files2,
                  fileList2,
                  savenmList2,
                  setAttdatnum2,
                  setFiles2,
                  setFileList2,
                  setSavenmList2,
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
                      <GridContainer>
                        <GridTitleContainer className="ButtonContainer2">
                          <GridTitle>
                            {" "}
                            <Button
                              themeColor={"primary"}
                              fillMode={"flat"}
                              icon={"chevron-left"}
                              onClick={() => {
                                if (swiper) {
                                  swiper.slideTo(0);
                                }
                              }}
                            ></Button>
                            처리 영역{" "}
                            <Button
                              themeColor={"primary"}
                              fillMode={"flat"}
                              icon={"chevron-right"}
                              onClick={() => {
                                if (swiper) {
                                  swiper.slideTo(2);
                                }
                              }}
                            ></Button>
                          </GridTitle>
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
                            <Button
                              onClick={onContentWndClick}
                              fillMode="outline"
                              themeColor={"primary"}
                              icon="pencil"
                              title="내용 수정"
                            ></Button>
                          </ButtonContainer>
                        </GridTitleContainer>
                        <Grid
                          style={{ height: mobileheight2 }}
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
                          <GridColumn
                            field="rowstatus"
                            title=" "
                            width="45px"
                          />
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
                          <GridColumn
                            field="contents"
                            title="내용"
                            width={300}
                          />
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
            </SwiperSlide>
            <SwiperSlide key={2}>
              <GridContainer>
                <GridTitleContainer className="ButtonContainer3">
                  <GridTitle>
                    <Button
                      themeColor={"primary"}
                      fillMode={"flat"}
                      icon={"chevron-left"}
                      onClick={() => {
                        if (swiper) {
                          swiper.slideTo(1);
                        }
                      }}
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
                <GridContainer>
                  <TabStrip
                    style={{ width: "100%" }}
                    selected={tabSelected}
                    onSelect={handleSelectTab}
                  >
                    <TabStripTab title="지시 내용">
                      <GridContainer>
                        <FormBoxWrap border={true} className="FormBoxWrap">
                          <FormBox>
                            <tbody>
                              <tr>
                                <th>비고</th>
                                <td>
                                  <Input
                                    name="remark"
                                    type="text"
                                    value={
                                      mainDataResult.data.filter(
                                        (item) =>
                                          item[DATA_ITEM_KEY] ==
                                          Object.getOwnPropertyNames(
                                            selectedState
                                          )[0]
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
                        <div
                          style={{
                            height: mobileheight3,
                            paddingBottom: "5px",
                          }}
                        >
                          <RichEditor
                            id="docEditor"
                            ref={docEditorRef}
                            hideTools
                          />
                        </div>
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
                      <Swiper
                        onSwiper={(swiper2) => {
                          setSwiper2(swiper2);
                        }}
                        onActiveIndexChange={(swiper2) => {
                          index = swiper2.activeIndex;
                        }}
                      >
                        <SwiperSlide key={0}>
                          <ButtonContainer className="ButtonContainer">
                            <Button
                              themeColor={"primary"}
                              fillMode={"flat"}
                              icon={"chevron-right"}
                              onClick={() => {
                                if (swiper2) {
                                  swiper2.slideTo(1);
                                }
                              }}
                            ></Button>
                          </ButtonContainer>
                          <FormBoxWrap
                            border={true}
                            className="FormBoxWrap"
                            style={{
                              width: "100%",
                              height: mobileheight4,
                              overflow: "auto",
                              marginBottom: 0,
                            }}
                          >
                            <FormBox>
                              <tbody>
                                <tr>
                                  <th>제목</th>
                                  <td>
                                    <Input
                                      name="reception_title"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>업체</th>
                                  <td>
                                    <Input
                                      name="custnm"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>문의자</th>
                                  <td>
                                    <Input
                                      name="custperson"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>문의번호</th>
                                  <td>
                                    <Input
                                      name="reception_document_id"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                        </SwiperSlide>
                        <SwiperSlide key={1}>
                          <GridTitleContainer className="ButtonContainer2">
                            <Button
                              themeColor={"primary"}
                              fillMode={"flat"}
                              icon={"chevron-left"}
                              onClick={() => {
                                if (swiper2) {
                                  swiper2.slideTo(0);
                                }
                              }}
                            ></Button>
                          </GridTitleContainer>
                          <div style={{ width: "100%", height: mobileheight5 }}>
                            <RichEditor
                              id="docEditor2"
                              ref={docEditorRef2}
                              hideTools
                            />
                          </div>
                          <FormBoxWrap
                            border={true}
                            className="FormBoxWrap2"
                            style={{ margin: 0 }}
                          >
                            <FormBox>
                              <tbody>
                                <tr>
                                  <th>첨부파일</th>
                                  <td>
                                    <Input
                                      name="reception_files"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                        </SwiperSlide>
                      </Swiper>
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
                      <GridContainer style={{ height: mobileheight6 }}>
                        <RichEditor
                          id="docEditor3"
                          ref={docEditorRef3}
                          hideTools
                        />
                      </GridContainer>
                      <FormBoxWrap
                        border={true}
                        className="FormBoxWrap"
                        style={{ margin: 0 }}
                      >
                        <FormBox>
                          <tbody>
                            <tr>
                              <th>첨부파일</th>
                              <td>
                                <Input
                                  name="answer_files"
                                  type="text"
                                  value={
                                    mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                      <Swiper
                        onSwiper={(swiper3) => {
                          setSwiper3(swiper3);
                        }}
                        onActiveIndexChange={(swiper3) => {
                          index = swiper3.activeIndex;
                        }}
                      >
                        <SwiperSlide key={0}>
                          <GridTitleContainer className="ButtonContainer4">
                            <GridTitle>
                              회의록 내용(요구사항)
                              <Button
                                themeColor={"primary"}
                                fillMode={"flat"}
                                icon={"chevron-right"}
                                onClick={() => {
                                  if (swiper3) {
                                    swiper3.slideTo(1);
                                  }
                                }}
                              ></Button>
                            </GridTitle>
                          </GridTitleContainer>
                          <FormBoxWrap
                            border={true}
                            className="FormBoxWrap"
                            style={{
                              height: mobileheight7,
                              overflow: "auto",
                              marginBottom: 0,
                            }}
                          >
                            <FormBox>
                              <tbody>
                                <tr>
                                  <th>내용</th>
                                  <td colSpan={3}>
                                    <Input
                                      name="meeting_contents"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>요청일</th>
                                  <td>
                                    <Input
                                      name="meeting_reqdt"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>완료예정일</th>
                                  <td>
                                    <Input
                                      name="meeting_finexpdt"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>고객담당자</th>
                                  <td>
                                    <Input
                                      name="meeting_client_name"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>고객완료예정일</th>
                                  <td>
                                    <Input
                                      name="meeting_client_finexpdt"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                        </SwiperSlide>
                        <SwiperSlide key={1}>
                          <GridTitleContainer className="ButtonContainer5">
                            <GridTitle>
                              <Button
                                themeColor={"primary"}
                                fillMode={"flat"}
                                icon={"chevron-left"}
                                onClick={() => {
                                  if (swiper3) {
                                    swiper3.slideTo(0);
                                  }
                                }}
                              ></Button>
                              회의록 기본정보
                              <Button
                                themeColor={"primary"}
                                fillMode={"flat"}
                                icon={"chevron-right"}
                                onClick={() => {
                                  if (swiper3) {
                                    swiper3.slideTo(2);
                                  }
                                }}
                              ></Button>
                            </GridTitle>
                          </GridTitleContainer>
                          <FormBoxWrap
                            border={true}
                            className="FormBoxWrap2"
                            style={{
                              height: mobileheight8,
                              overflow: "auto",
                              marginBottom: 0,
                            }}
                          >
                            <FormBox>
                              <tbody>
                                <tr>
                                  <th>회의일</th>
                                  <td>
                                    <Input
                                      name="meeting_date"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>업체</th>
                                  <td>
                                    <Input
                                      name="meeting_custnm"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>제목</th>
                                  <td colSpan={5}>
                                    <Input
                                      name="meeting_title"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>비고</th>
                                  <td colSpan={5}>
                                    <TextArea
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                                  <th>첨부파일</th>
                                  <td colSpan={5}>
                                    <Input
                                      name="meeting_files"
                                      type="text"
                                      value={
                                        mainDataResult.data.filter(
                                          (item) =>
                                            item[DATA_ITEM_KEY] ==
                                            Object.getOwnPropertyNames(
                                              selectedState
                                            )[0]
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
                        </SwiperSlide>
                        <SwiperSlide key={2}>
                          <GridTitleContainer className="ButtonContainer6">
                            <GridTitle>
                              <Button
                                themeColor={"primary"}
                                fillMode={"flat"}
                                icon={"chevron-left"}
                                onClick={() => {
                                  if (swiper3) {
                                    swiper3.slideTo(1);
                                  }
                                }}
                              ></Button>
                              회의 참고 자료
                            </GridTitle>
                          </GridTitleContainer>
                          <div
                            style={{
                              height: mobileheight9,
                              paddingBottom: "5px",
                            }}
                          >
                            <RichEditor
                              id="docEditor4"
                              ref={docEditorRef4}
                              hideTools
                            />
                          </div>
                        </SwiperSlide>
                      </Swiper>
                    </TabStripTab>
                  </TabStrip>
                </GridContainer>
              </GridContainer>
            </SwiperSlide>
          </Swiper>
        </>
      ) : (
        <>
          <GridContainerWrap>
            <GridContainer width={`15%`} height={"auto"}>
              {!isMobile ? (
                <GridTitleContainer>
                  <GridTitle>조회조건</GridTitle>
                  <Button onClick={search} icon="search" themeColor={"primary"}>
                    조회
                  </Button>
                </GridTitleContainer>
              ) : (
                ""
              )}
              <FilterContainer>
                <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                  <tbody>
                    <tr>
                      <th>기간</th>
                      <td>
                        <MultiColumnComboBox
                          name="date_type"
                          data={
                            filter
                              ? filterBy(dateTypeData, filter)
                              : dateTypeData
                          }
                          value={filters.date_type}
                          columns={dataTypeColumns}
                          textField={"code_name"}
                          onChange={filterComboBoxChange}
                          className="required"
                          filterable={true}
                          onFilterChange={handleFilterChange}
                        />
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
                          data={
                            filter3 ? filterBy(usersData, filter3) : usersData
                          }
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
                          data={
                            filter4 ? filterBy(usersData, filter4) : usersData
                          }
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
              </FilterContainer>
            </GridContainer>
            {isVisibleDetail && (
              <GridContainer width={`calc(40% - ${GAP}px)`}>
                <FilesContext.Provider
                  value={{
                    attdatnum,
                    files,
                    fileList,
                    savenmList,
                    setAttdatnum,
                    setFiles,
                    setFileList,
                    setSavenmList,
                    mainDataState,
                    setMainDataState,
                    // fetchGrid,
                  }}
                >
                  <GridContainer>
                    <GridTitleContainer className="ButtonContainer">
                      <GridTitle>업무지시 정보</GridTitle>
                    </GridTitleContainer>
                    <Grid
                      style={{ height: webheight }}
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
                      <GridColumn
                        field="indicator"
                        title="지시자"
                        width={120}
                      />
                      <GridColumn field="custnm" title="업체명" width={150} />
                      <GridColumn
                        field="groupcd"
                        title="업무분류"
                        width={120}
                      />
                      <GridColumn
                        field="value_code3"
                        title="Value구분"
                        width={120}
                      />
                      <GridColumn
                        field="person"
                        title="처리담당자"
                        width={120}
                      />
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
                      <GridColumn
                        field="docunum"
                        title="관리번호"
                        width={200}
                      />
                    </Grid>
                  </GridContainer>
                </FilesContext.Provider>
                <FilesContext2.Provider
                  value={{
                    attdatnum2,
                    files2,
                    fileList2,
                    savenmList2,
                    setAttdatnum2,
                    setFiles2,
                    setFileList2,
                    setSavenmList2,
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
                          <GridTitleContainer className="ButtonContainer2">
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
                              <Button
                                onClick={onContentWndClick}
                                fillMode="outline"
                                themeColor={"primary"}
                                icon="pencil"
                                title="내용 수정"
                              ></Button>
                            </ButtonContainer>
                          </GridTitleContainer>
                          <Grid
                            style={{ height: webheight2 }}
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
                            <GridColumn
                              field="rowstatus"
                              title=" "
                              width="45px"
                            />
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
                            <GridColumn
                              field="contents"
                              title="내용"
                              width={300}
                            />
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
                isVisibleDetail
                  ? `calc(45% - ${GAP}px)`
                  : `calc(85% - ${GAP}px)`
              }
            >
              <GridTitleContainer className="ButtonContainer3">
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
              <GridContainer>
                <TabStrip
                  style={{ width: "100%" }}
                  selected={tabSelected}
                  onSelect={handleSelectTab}
                >
                  <TabStripTab title="지시 내용">
                    <GridContainer>
                      <FormBoxWrap border={true} className="FormBoxWrap">
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                      <div style={{ height: webheight3, paddingBottom: "5px" }}>
                        <RichEditor
                          id="docEditor"
                          ref={docEditorRef}
                          hideTools
                        />
                      </div>
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
                    <GridContainer>
                      <FormBoxWrap border={true} className="FormBoxWrap">
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                      <div style={{ height: webheight4 }}>
                        <RichEditor
                          id="docEditor2"
                          ref={docEditorRef2}
                          hideTools
                        />
                      </div>
                      <FormBoxWrap border={true} className="FormBoxWrap2">
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                    <GridContainer style={{ height: webheight5 }}>
                      <RichEditor
                        id="docEditor3"
                        ref={docEditorRef3}
                        hideTools
                      />
                    </GridContainer>
                    <FormBoxWrap border={true} className="FormBoxWrap">
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
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
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
                    <GridContainer>
                      <GridTitleContainer className="ButtonContainer4">
                        <GridTitle>회의록 내용(요구사항)</GridTitle>
                      </GridTitleContainer>
                      <FormBoxWrap border={true} className="FormBoxWrap">
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                      <GridTitleContainer className="ButtonContainer5">
                        <GridTitle>회의록 기본정보</GridTitle>
                      </GridTitleContainer>
                      <FormBoxWrap border={true} className="FormBoxWrap2">
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
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
                      <GridTitleContainer className="ButtonContainer6">
                        <GridTitle>회의 참고 자료</GridTitle>
                      </GridTitleContainer>
                      <div style={{ height: webheight6, paddingBottom: "5px" }}>
                        <RichEditor
                          id="docEditor4"
                          ref={docEditorRef4}
                          hideTools
                        />
                      </div>
                    </GridContainer>
                  </TabStripTab>
                </TabStrip>
              </GridContainer>
            </GridContainer>
          </GridContainerWrap>
        </>
      )}
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
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedState)[0]
                )[0].reception_document_id
          }
          reload={() => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: Object.getOwnPropertyNames(selectedState)[0],
              isSearch: true,
            }));
          }}
        />
      )}
      {contentWindowVisible && (
        <ContentWindow
          setVisible={setContentWindowVisible}
          title={
            subDataResult.data.filter(
              (item) =>
                item[SUB_DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedsubDataState)[0]
            ) != undefined
              ? subDataResult.data.filter(
                  (item) =>
                    item[SUB_DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedsubDataState)[0]
                )[0].title
              : ""
          }
          content={
            subDataResult.data.filter(
              (item) =>
                item[SUB_DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedsubDataState)[0]
            ) != undefined
              ? subDataResult.data.filter(
                  (item) =>
                    item[SUB_DATA_ITEM_KEY] ==
                    Object.getOwnPropertyNames(selectedsubDataState)[0]
                )[0].contents
              : ""
          }
          reload={getContentData}
        />
      )}
    </>
  );
};
export default App;
