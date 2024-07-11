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
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import { Splitter, SplitterOnChangeEvent } from "@progress/kendo-react-layout";
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
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
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
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import StatusComboBoxCell from "../components/Cells/StatusComboBoxCell";
import {
  UseParaPc,
  convertDateToStr,
  extractDownloadFilename,
  getDeviceHeight,
  getGridItemChangedData,
  getHeight,
  handleKeyPressSearch,
  toDate,
} from "../components/CommonFunction";
import {
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import RichEditor from "../components/RichEditor";
import AnswerWindow from "../components/Windows/CommonWindows/AnswerWindow";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import QuestionWindow from "../components/Windows/CommonWindows/QuestionWindow";
import TaskOrderListWindow from "../components/Windows/CommonWindows/TaskOrderListWindow";
import { useApi } from "../hooks/api";
import {
  filterValueState,
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
import FilterContainer from "../components/FilterContainer";
import CustomMultiColumnComboBox from "../components/ComboBoxes/CustomMultiColumnComboBox";

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

const receptionTypeQueryStr = `SELECT a.sub_code,
a.code_name
FROM comCodeMaster a 
WHERE a.group_code = 'BA097'
AND use_yn = 'Y'`;

const StatusContext = createContext<{
  statusListData: any[];
}>({
  statusListData: [],
});
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
const FilesContext = createContext<{
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

const StatusCell = (props: GridCellProps) => {
  const { statusListData } = useContext(StatusContext);

  return statusListData ? (
    <StatusComboBoxCell
      columns={dataTypeColumns}
      data={statusListData}
      textField="code_name"
      valueField="code"
      {...props}
    />
  ) : (
    <td />
  );
};

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

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible(true);
  };

  const getAttachmentsData = (
    data: any,
    fileList?: FileList | any[],
    savenmList?: string[]
  ) => {
    setAttdatnum(data.length > 0 ? data[0].attdatnum : attdatnum);
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

    if (data.length == 0) {
      setAttach_exists("N");
    } else {
      setAttach_exists("Y");
    }
  };

  return (
    <>
      <td
        className={className}
        aria-colindex={ariaColumnIndex}
        data-grid-col-index={columnIndex}
        style={{ position: "relative" }}
      >
        <div style={{ textAlign: "center", marginRight: "10px" }}>
          {dataItem.reception_attach_exists == "Y" ? (
            <span className="k-icon k-i-file k-icon-lg"></span>
          ) : (
            ""
          )}
        </div>
        <ButtonInGridInput>
          <Button
            name="reception_attach_number"
            onClick={onAttWndClick2}
            icon="more-horizontal"
            fillMode="flat"
          />
        </ButtonInGridInput>
      </td>
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={dataItem.reception_attach_number}
          permission={{ upload: true, download: true, delete: true }}
          type={"receipt"}
          modal={true}
          fileLists={dataItem.fileList}
          savenmLists={dataItem.savenmList}
        />
      )}
    </>
  );
};

const Exists_taskCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    className = "",
  } = props;
  let value = dataItem[field ?? ""];
  if (value === "Y" || value === true) {
    value = true;
  } else {
    value = false;
  }
  const [taskWindowVisible, setTaskWindowVisible] = useState<boolean>(false);

  const onTaskWndClick = () => {
    if (value == true) {
      setTaskWindowVisible(true);
    }
  };

  return (
    <>
      <td
        className={className}
        aria-colindex={ariaColumnIndex}
        data-grid-col-index={columnIndex}
        style={{ position: "relative" }}
      >
        <div style={{ textAlign: "center", marginRight: "10px" }}>
          <Checkbox checked={value} readOnly />
        </div>
        <ButtonInGridInput>
          <Button onClick={onTaskWndClick} icon="search" fillMode="flat" />
        </ButtonInGridInput>
        {taskWindowVisible && (
          <TaskOrderListWindow
            setVisible={setTaskWindowVisible}
            para={dataItem}
            modal={true}
          />
        )}
      </td>
    </>
  );
};

let targetRowIndex: null | number = null;
var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;

const DATA_ITEM_KEY = "document_id";

const App = () => {
  const [swiper, setSwiper] = useState<SwiperCore>();
  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".FormBoxWrap");
    height5 = getHeight(".FormBoxWrap2");
    height6 = getHeight(".TitleContainer");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height - height6);
      setMobileHeight2(
        getDeviceHeight(true) - height2 - height4 - height6 + 13
      );
      setMobileHeight3(
        getDeviceHeight(true) - height3 - height5 - height6 + 13
      );

      setWebHeight(getDeviceHeight(false) - height - height6);
      setWebHeight2(
        (getDeviceHeight(false) - height6 + 13) / 2 - height2 - height4
      );
      setWebHeight3(
        (getDeviceHeight(false) - height6 + 13) / 2 - height3 - height5
      );
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3]);

  const [title, setTitle] = useRecoilState(titles);
  const setLoading = useSetRecoilState(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter = getter(DATA_ITEM_KEY);
  let gridRef: any = useRef(null);
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const history = useHistory();
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);
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
  const [isFilterHideStates, setIsFilterHideStates] =
    useRecoilState(isFilterHideState);
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
  const [filter, setFilter] = useState<FilterDescriptor>();
  const [filter2, setFilter2] = useState<FilterDescriptor>();
  const [filter3, setFilter3] = useState<FilterDescriptor>();
  const [filter4, setFilter4] = useState<FilterDescriptor>();

  const processApi = useApi();
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
  const [panes, setPanes] = useState<Array<any>>([
    { size: "60%", min: "0px", collapsible: true },
    {},
  ]);

  const onChange = (event: SplitterOnChangeEvent) => {
    setPanes(event.newState);
  };

  const search = () => {
    if (
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      setFileList([]);
      setSavenmList([]);
      setPage(initialPageState); // 페이지 초기화
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        findRowValue: "",
        isSearch: true,
      }));
    }
    if (swiper && isMobile) {
      swiper.slideTo(0);
    }
    setIsFilterHideStates(true);
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

  const dateTypeData = [
    { sub_code: "RequestDate", code_name: "요청일" },
    { sub_code: "ReceptionDate", code_name: "접수일" },
    { sub_code: "FinishedDate", code_name: "완료예정일" },
    { sub_code: "IsUnprocessed", code_name: "미처리 건 항상" },
  ];
  const reception_typeData = [
    { sub_code: "Q", code_name: "문의" },
    { sub_code: "A", code_name: "전화" },
    { sub_code: "F", code_name: "미팅" },
    { sub_code: "B", code_name: "업무지시" },
  ];
  const [usersData, setUsersData] = useState<any[]>([]);
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const statusListData: any[] = [
    { sub_code: "Wait", code_name: "대기", code: "N" },
    { sub_code: "Progress", code_name: "진행중", code: "R" },
    { sub_code: "Hold", code_name: "보류", code: "H" },
    { sub_code: "Finish", code_name: "완료", code: "Y" },
  ];
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
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
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

  const fetchReceptionType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(receptionTypeQueryStr));

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
      setReceptionTypeData(rows);
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

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - 14
  );
  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    work_person: any;
    receptionist: any;
    custnm: string;
    user_name: string;
    reception_person: any;
    reception_type: any;
    value_code3: any;
    contents: string;
    status: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };

  const [filters, setFilters] = useState<TFilters>({
    workType: "list",
    date_type: [
      { sub_code: "RequestDate", code_name: "요청일" },
      { sub_code: "IsUnprocessed", code_name: "미처리 건 항상" },
    ],
    fromDate: fromDate,
    toDate: new Date(),
    work_person: { user_id: "", user_name: "" },
    receptionist: { user_id: userId, user_name: userName },
    custnm: "",
    user_name: "",
    reception_person: { user_id: "", user_name: "" },
    reception_type: { sub_code: "", code_name: "" },
    value_code3: { sub_code: "", code_name: "" },
    contents: "",
    status: [
      { sub_code: "Wait", code_name: "대기", code: "N" },
      { sub_code: "Progress", code_name: "진행중", code: "R" },
      { sub_code: "Hold", code_name: "보류", code: "H" },
    ],
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  function getName(data: { sub_code: string }[]) {
    let str = "";

    data.map((item: { sub_code: string }) => (str += item.sub_code + "|"));

    return data.length > 0 ? str.slice(0, -1) : str;
  }

  //그리드 데이터 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length == 0
        ? "Wait|Progress|Hold|Finish"
        : filters.status.length == 1
        ? filters.status[0].sub_code
        : getName(filters.status);
    const date_type =
      filters.date_type.length == 0
        ? "RequestDate|ReceptionDate|FinishedDate|IsUnprocessed"
        : filters.date_type.length == 1
        ? filters.date_type[0].sub_code
        : getName(filters.date_type);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_receptions",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": date_type,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_user_name": filters.user_name,
        "@p_contents": filters.contents,
        "@p_reception_type":
          filters.reception_type != null ? filters.reception_type.sub_code : "",
        "@p_value_code3":
          filters.value_code3 != null ? filters.value_code3.sub_code : "",
        "@p_reception_person":
          filters.reception_person != null
            ? filters.reception_person.user_id
            : "",
        "@p_work_person":
          filters.work_person != null ? filters.work_person.user_id : "",
        "@p_receptionist":
          filters.receptionist != null ? filters.receptionist.user_id : "",
        "@p_status": status,
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
            (row: any) => row[DATA_ITEM_KEY] == filters.findRowValue
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
      setTempResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
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

          fetchDocument(selectedRow);
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

          fetchDocument(rows[0]);
        }
      } else {
        fetchDocument("");
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
    if (
      filterValue.type !== "reception" &&
      filters.isSearch &&
      localStorage.getItem("accessToken")
    ) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (
      filterValue.type !== "reception" &&
      localStorage.getItem("accessToken")
    ) {
      // ComboBox에 사용할 코드 리스트 조회
      fetchValueCode();
      fetchUsers();
      fetchReceptionType();
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          isSearch: true,
          status: [
            { sub_code: "Wait", code_name: "대기", code: "N" },
            { sub_code: "Progress", code_name: "진행중", code: "R" },
            { sub_code: "Hold", code_name: "보류", code: "H" },
            { sub_code: "Finish", code_name: "완료", code: "Y" },
          ],
          receptionist: { user_id: "", user_name: "" },
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("접수 및 답변");
    }
  }, []);

  useEffect(() => {
    // 메인 그리드에서 클릭하여 오픈시 조회조건 재설정하여 조회
    if (
      filterValue.type === "reception" &&
      localStorage.getItem("accessToken")
    ) {
      fetchValueCode();
      fetchUsers();
      fetchReceptionType();
      const isExceedFromDate =
        convertDateToStr(fromDate) > filterValue.dataItem.request_date;

      const newFromDate = toDate(filterValue.dataItem.request_date) ?? fromDate;

      setFilters((prev) => ({
        ...prev,
        status: [
          { sub_code: "Wait", code_name: "대기", code: "N" },
          { sub_code: "Progress", code_name: "진행중", code: "R" },
          { sub_code: "Hold", code_name: "보류", code: "H" },
        ],
        custnm: filterValue.dataItem.customer_name,
        fromDate: isExceedFromDate ? newFromDate : fromDate,
        receptionist: { user_id: "", user_name: "" },
        isSearch: true,
        findRowValue: filterValue.dataItem[DATA_ITEM_KEY],
      }));

      setFilterValue({ type: null, dataItem: {} });
      setTitle("접수 및 답변");
    }
  }, [filterValue]);

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
  const [isVisibleDetail, setIsVisableDetail] = useState(true);

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

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
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

    fetchDocument(selectedRowData);
    if (isMobile && swiper) {
      swiper.slideTo(1);
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
      field == "reception_person" ||
      field == "reception_time" ||
      field == "reception_date" ||
      field == "value_code3" ||
      field == "be_finished_date" ||
      field == "completion_date" ||
      field == "status"
    ) {
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
  useEffect(() => {
    if (fileList.length > 0 || savenmList.length > 0) {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              reception_attach_number: attdatnum,
              reception_attach_exists: attach_exists,
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
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setFileList([]);
      setSavenmList([]);
    }
  }, [fileList, savenmList]);

  const docEditorRef = useRef<TEditorHandle>(null);
  const docEditorRef2 = useRef<TEditorHandle>(null);

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
        para: "doc?type=Question&id=" + datas.document_id,
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

  const fetchDocument = async (ref_key: any) => {
    let data: any;
    setLoading(true);

    if (ref_key != "") {
      const para = {
        para: `document?type=Question&id=${ref_key.document_id}`,
      };

      try {
        data = await processApi<any>("document", para);
      } catch (error) {
        data = null;
      }

      if (data !== null) {
        const document = data.document;
        setHtmlOnEditor({ document: document, type: "Question" });
        let data2: any;
        if (ref_key.answer_document_id != "") {
          const para = {
            para: `document?type=Answer&id=${ref_key.answer_document_id}`,
          };

          try {
            data2 = await processApi<any>("document", para);
          } catch (error) {
            data2 = null;
          }

          const document2 = data2.document;
          setHtmlOnEditor({ document: document2, type: "Answer" });
        } else {
          setHtmlOnEditor({ document: "", type: "Answer" });
        }
      } else {
        setHtmlOnEditor({ document: "", type: "Question" });
        setHtmlOnEditor({ document: "", type: "Answer" });
      }
    } else {
      setHtmlOnEditor({ document: "", type: "Question" });
      setHtmlOnEditor({ document: "", type: "Answer" });
    }

    setLoading(false);
  };

  const setHtmlOnEditor = ({
    document,
    type,
  }: {
    document: string;
    type: string;
  }) => {
    if (docEditorRef.current && type == "Question") {
      docEditorRef.current.updateEditable(true);
      docEditorRef.current.setHtml(document);
      docEditorRef.current.updateEditable(false);
    } else if (docEditorRef2.current && type == "Answer") {
      docEditorRef2.current.updateEditable(true);
      docEditorRef2.current.setHtml(document);
      docEditorRef2.current.updateEditable(false);
    }
  };
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [attachmentsWindowVisible3, setAttachmentsWindowVisible3] =
    useState<boolean>(false);
  const [answerWindowVisible, setAnswerWindowVisible] =
    useState<boolean>(false);
  const [questionWindowVisible, setQuestionWindowVisible] =
    useState<boolean>(false);
  const [questionWindowVisible2, setQuestionWindowVisible2] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const onAttWndClick3 = () => {
    setAttachmentsWindowVisible3(true);
  };
  const onAnswerWndClick = () => {
    if (mainDataResult.data.length > 0) {
      setAnswerWindowVisible(true);
    } else {
      alert("데이터가 없습니다.");
    }
  };

  const onAddClick = () => {
    setQuestionWindowVisible(true);
  };

  const onQuestionWndClick = () => {
    setQuestionWindowVisible2(true);
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

  const onConfirmClick = async () => {
    if (mainDataResult.total == 0) {
      alert("데이터가 없습니다.");
    } else {
      type TRowsArr = {
        row_status: string[];
        document_id_s: string[];
        customer_code_s: string[];
        user_name_s: string[];
        user_tel_s: string[];
        request_date_s: string[];
        title_s: string[];
        reception_type_s: string[];
        reception_date_s: string[];
        reception_person_s: string[];
        reception_time_s: string[];
        work_person_s: string[];
        work_estimated_hour_s: string[];
        work_estimated_minute_s: string[];
        value_code3_s: string[];
        be_finished_date_s: string[];
        completion_date_s: string[];
        status_s: string[];
        attach_number_s: string[];
        ref_number_s: string[];
        contents_s: string[];
        attdatnum_s: string[];
      };
      let rowsArr: TRowsArr = {
        row_status: [],
        document_id_s: [],
        customer_code_s: [],
        user_name_s: [],
        user_tel_s: [],
        request_date_s: [],
        title_s: [],
        reception_type_s: [],
        reception_date_s: [],
        reception_person_s: [],
        reception_time_s: [],
        work_person_s: [],
        work_estimated_hour_s: [],
        work_estimated_minute_s: [],
        value_code3_s: [],
        be_finished_date_s: [],
        completion_date_s: [],
        status_s: [],
        attach_number_s: [],
        ref_number_s: [],
        contents_s: [],
        attdatnum_s: [],
      };

      let dataItem: any[] = [];
      mainDataResult.data.map((item) => {
        if (
          (item.rowstatus === "N" || item.rowstatus === "U") &&
          item.rowstatus !== undefined
        ) {
          dataItem.push(item);
        }
      });

      dataItem.forEach((item: any) => {
        const {
          rowstatus,
          document_id,
          customer_code,
          user_name,
          user_tel,
          request_date,
          title,
          reception_type,
          reception_date,
          reception_person,
          reception_time,
          work_person,
          work_estimated_hour,
          work_estimated_minute,
          value_code3,
          be_finished_date,
          completion_date,
          status,
          ref_number,
          contents,
          attdatnum,
        } = item;

        rowsArr.row_status.push(rowstatus);
        rowsArr.document_id_s.push(document_id);
        rowsArr.customer_code_s.push(customer_code);
        rowsArr.user_name_s.push(user_name);
        rowsArr.user_tel_s.push(user_tel);
        rowsArr.request_date_s.push(request_date);
        rowsArr.title_s.push(title);
        rowsArr.reception_type_s.push(reception_type);
        rowsArr.reception_date_s.push(reception_date);
        rowsArr.reception_person_s.push(reception_person);
        rowsArr.reception_time_s.push(reception_time);
        rowsArr.work_person_s.push("");
        rowsArr.work_estimated_hour_s.push("0");
        rowsArr.work_estimated_minute_s.push("0");
        rowsArr.value_code3_s.push(value_code3);
        rowsArr.be_finished_date_s.push(be_finished_date);
        rowsArr.completion_date_s.push(completion_date);
        rowsArr.status_s.push(status);
        rowsArr.ref_number_s.push(ref_number);
        rowsArr.contents_s.push(contents);
        rowsArr.attdatnum_s.push(attdatnum);
      });
      setLoading(true);
      for (const item of dataItem) {
        let newAttachmentNumber = "";

        const promises = [];
        if (item.fileList != undefined) {
          for (const file of item.fileList) {
            // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
            if (
              item.reception_attach_number == "" &&
              newAttachmentNumber == ""
            ) {
              newAttachmentNumber = await uploadFile(
                file,
                "receipt",
                item.reception_attach_number
              );
              const promise = newAttachmentNumber;
              promises.push(promise);
              continue;
            }

            const promise = newAttachmentNumber
              ? await uploadFile(
                  file,
                  "receipt",
                  item.reception_attach_number,
                  newAttachmentNumber
                )
              : await uploadFile(file, "receipt", item.reception_attach_number);
            promises.push(promise);
          }

          const results = await Promise.all(promises);

          // 실패한 파일이 있는지 확인
          if (results.includes(null)) {
            alert("파일 업로드에 실패했습니다.");
          } else {
            rowsArr.attach_number_s.push(
              results[0] == undefined
                ? item.reception_attach_number
                : results[0]
            );
          }

          let datas: any;
          let type = "receipt";
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
            rowsArr.attach_number_s.push(item.reception_attach_number);
          }
        }
      }

      let data: any;
      setLoading(true);
      const paras = {
        procedureName: "pw6_sav_receptions",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": "U",

          "@p_row_status": rowsArr.row_status.join("|"),
          "@p_document_id_s": rowsArr.document_id_s.join("|"),

          "@p_customer_code_s": rowsArr.customer_code_s.join("|"),
          "@p_user_name_s": rowsArr.user_name_s.join("|"),
          "@p_user_tel_s": rowsArr.user_tel_s.join("|"),
          "@p_request_date_s": rowsArr.request_date_s.join("|"),
          "@p_title_s": rowsArr.title_s.join("|"),
          "@p_reception_type_s": rowsArr.reception_type_s.join("|"),
          "@p_reception_date_s": rowsArr.reception_date_s.join("|"),
          "@p_reception_person_s": rowsArr.reception_person_s.join("|"),
          "@p_reception_time_s": rowsArr.reception_time_s.join("|"),
          "@p_work_person_s": rowsArr.work_person_s.join("|"),
          "@p_work_estimated_hour_s": rowsArr.work_estimated_hour_s.join("|"),
          "@p_work_estimated_minute_s":
            rowsArr.work_estimated_minute_s.join("|"),
          "@p_value_code3_s": rowsArr.value_code3_s.join("|"),
          "@p_be_finished_date_s": rowsArr.be_finished_date_s.join("|"),
          "@p_completion_date_s": rowsArr.completion_date_s.join("|"),
          "@p_status_s": rowsArr.status_s.join("|"),
          "@p_attach_number_s": rowsArr.attach_number_s.join("|"),
          "@p_ref_number_s": rowsArr.ref_number_s.join("|"),
          "@p_contents": rowsArr.contents_s.join("|"),
          "@p_attdatnum": rowsArr.attdatnum_s.join("|"),
          "@p_id": userId,
          "@p_pc": pc,
        },
      };
      try {
        data = await processApi<any>("procedure", paras);
      } catch (error) {
        data = null;
      }
      if (data != null) {
        setFileList([]);
        setSavenmList([]);
        setFilters((prev) => ({
          ...prev,
          find_row_value: Object.getOwnPropertyNames(selectedState)[0],
          isSearch: true,
        }));
      } else {
        console.log("[오류 발생]");
        console.log(data);
      }
      setLoading(false);
    }
  };

  const onDeleteClick = async () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }

    if (mainDataResult.total == 0) {
      alert("데이터가 없습니다.");
    } else {
      const datas = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];

      let data: any;
      setLoading(true);

      let editorContent: any = "";
      if (docEditorRef.current) {
        editorContent = docEditorRef.current.getContent();
      }
      const bytes = require("utf8-bytes");
      const convertedEditorContent = bytesToBase64(bytes(editorContent));

      const paras = {
        fileBytes: datas.reception_type == "Q" ? convertedEditorContent : "",
        procedureName: "pw6_sav_receptions",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": datas.reception_type == "Q" ? "D_CR020T" : "D",

          "@p_row_status": "",
          "@p_document_id_s": datas.document_id,

          "@p_customer_code_s": "",
          "@p_user_name_s": "",
          "@p_user_tel_s": "",
          "@p_request_date_s": "",
          "@p_title_s": "",
          "@p_reception_type_s": "",
          "@p_reception_date_s": "",
          "@p_reception_person_s": "",
          "@p_reception_time_s": "",
          "@p_work_person_s": "",
          "@p_work_estimated_hour_s": "",
          "@p_work_estimated_minute_s": "",
          "@p_value_code3_s": "",
          "@p_be_finished_date_s": "",
          "@p_completion_date_s": "",
          "@p_status_s": "",
          "@p_attach_number_s": "",
          "@p_ref_number_s": datas.ref_number,
          "@p_contents": "",
          "@p_attdatnum": "",
          "@p_id": userId,
          "@p_pc": pc,
        },
      };
      try {
        data = await processApi<any>("receptions-save", paras);
      } catch (error: any) {
        alert(error.message);
        data = null;
      }
      if (data != null) {
        if (datas.reception_type == "Q") {
          let data2: any;
          try {
            data2 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=receipt&attachmentNumber=" +
                datas.reception_attach_number +
                "&id=",
            });
          } catch (error) {
            data2 = null;
          }
        } else {
          let data2: any;
          try {
            data2 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=receipt&attachmentNumber=" +
                datas.reception_attach_number +
                "&id=",
            });
          } catch (error) {
            data2 = null;
          }

          let data3: any;
          try {
            data3 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=question&attachmentNumber=" +
                datas.attdatnum +
                "&id=",
            });
          } catch (error) {
            data3 = null;
          }

          let data4: any;
          try {
            data4 = await processApi<any>("attachment-delete", {
              attached:
                "attachment?type=answer&attachmentNumber=" +
                datas.answer_attdatnum +
                "&id=",
            });
          } catch (error) {
            data4 = null;
          }
        }

        if (mainDataResult.data.length === 1 && filters.pgNum == 1) {
          setFilters((prev) => ({
            ...prev,
            find_row_value: "",
            pgNum: 1,
            isSearch: true,
          }));
        } else {
          const isLastDataDeleted =
            mainDataResult.data.length === 1 && filters.pgNum > 1;
          const findRowIndex = mainDataResult.data.findIndex(
            (row: any) =>
              row[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          );
          if (isLastDataDeleted) {
            setFilters((prev) => ({
              ...prev,
              find_row_value: "",
              pgNum: isLastDataDeleted ? prev.pgNum - 1 : prev.pgNum,
              isSearch: true,
            }));
          } else {
            setFilters((prev) => ({
              ...prev,
              find_row_value:
                mainDataResult.data[findRowIndex == 0 ? 1 : findRowIndex - 1][
                  DATA_ITEM_KEY
                ],
              pgNum: isLastDataDeleted ? prev.pgNum - 1 : prev.pgNum,
              isSearch: true,
            }));
          }
        }
      }
      setLoading(false);
    }
  };

  const onAlertClick = async () => {
    if (mainDataResult.data.length > 0) {
      const datas = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];
      if (
        datas.answer_document_id == "" ||
        datas.answer_document_id == null ||
        datas.answer_document_id == undefined
      ) {
        alert("답변이 존재하지 않습니다.");
      } else {
        if (!window.confirm("알림을 전송하시겠습니까?")) {
          return false;
        }
        let alerts: any;
        const alertPara = {
          para: `fcm-send?type=Answer&id=${datas.answer_document_id}`,
        };
        try {
          alerts = await processApi<any>("alert", alertPara);
        } catch (error) {
          alerts = null;
        }
      }
    } else {
      alert("선택된 행이 없습니다.");
    }
  };
  return (
    <>
      {isMobile ? (
        <>
          <TitleContainer className="TitleContainer">
            <Title>접수 및 답변</Title>
            <ButtonContainer>
              <Button
                themeColor={"primary"}
                icon="file-add"
                onClick={onAddClick}
              >
                신규
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="delete"
                onClick={onDeleteClick}
              >
                삭제
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="save"
                onClick={onConfirmClick}
              >
                저장
              </Button>
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
            </ButtonContainer>
          </TitleContainer>
          <FilterContainer>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>기간</th>
                  <td>
                    <MultiSelect
                      name="date_type"
                      data={dateTypeData}
                      onChange={filterMultiSelectChange}
                      value={filters.date_type}
                      textField="code_name"
                      dataItemKey="sub_code"
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
                  <th>처리담당자</th>
                  <td>
                    <CustomMultiColumnComboBox
                      name="work_person"
                      data={filter ? filterBy(usersData, filter) : usersData}
                      value={filters.work_person}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>접수담당자</th>
                  <td>
                    <CustomMultiColumnComboBox
                      name="receptionist"
                      data={filter2 ? filterBy(usersData, filter2) : usersData}
                      value={filters.receptionist}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange2}
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
                  <th>작성자</th>
                  <td>
                    <Input
                      name="user_name"
                      type="text"
                      value={filters.user_name}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>접수자</th>
                  <td>
                    <CustomMultiColumnComboBox
                      name="reception_person"
                      data={filter3 ? filterBy(usersData, filter3) : usersData}
                      value={filters.reception_person}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange3}
                    />
                  </td>
                </tr>
                <tr>
                  <th>접수 구분</th>
                  <td>
                    <CustomMultiColumnComboBox
                      name="reception_type"
                      data={
                        filter3
                          ? filterBy(receptionTypeData, filter3)
                          : receptionTypeData
                      }
                      value={filters.reception_type}
                      columns={dataTypeColumns}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange3}
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
                  <th>Value 구분</th>
                  <td>
                    <CustomMultiColumnComboBox
                      name="value_code3"
                      data={
                        filter4
                          ? filterBy(valuecodeItems, filter4)
                          : valuecodeItems
                      }
                      value={filters.value_code3}
                      columns={dataTypeColumns2}
                      textField={"code_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange4}
                    />
                  </td>
                </tr>
                <tr>
                  <th>상태</th>
                  <td>
                    <MultiSelect
                      name="status"
                      data={statusListData}
                      onChange={filterMultiSelectChange}
                      value={filters.status}
                      textField="code_name"
                      dataItemKey="sub_code"
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
              <StatusContext.Provider
                value={{
                  statusListData: statusListData,
                }}
              >
                <UserContext.Provider value={{ usersData: usersData }}>
                  <ValueCodeContext.Provider
                    value={{ valuecodeItems: valuecodeItems }}
                  >
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
                      <GridContainer>
                        <GridTitleContainer className="ButtonContainer">
                          <GridTitle>
                            업무지시 정보
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
                              reception_type: reception_typeData.find(
                                (items: any) =>
                                  items.sub_code == row.reception_type
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
                            field="rowstatus"
                            title=" "
                            width="40px"
                          />
                          <GridColumn
                            field="status"
                            title="상태"
                            width={90}
                            cell={StatusCell}
                          />
                          <GridColumn
                            field="request_date"
                            title="요청일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="customer_name"
                            title="업체명"
                            width={150}
                          />
                          <GridColumn
                            field="user_name"
                            title="작성자"
                            width={80}
                          />
                          <GridColumn
                            field="user_tel"
                            title="연락처"
                            width={120}
                          />
                          <GridColumn field="title" title="제목" width={300} />
                          <GridColumn
                            field="reception_person"
                            title="접수자"
                            width={80}
                            cell={UserCell}
                          />
                          <GridColumn
                            field="reception_date"
                            title="접수일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="be_finished_date"
                            title="완료예정일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="reception_time"
                            title="접수소요시간"
                            width={100}
                            cell={NumberCell}
                          />
                          <GridColumn
                            field="reception_type"
                            title="접수구분"
                            width={75}
                            footerCell={mainTotalFooterCell}
                          />
                          <GridColumn
                            field="exists_task"
                            title="지시여부"
                            width={90}
                            cell={Exists_taskCell}
                          />
                          <GridColumn
                            field="is_finish"
                            title="완료여부"
                            width={75}
                            cell={CheckBoxReadOnlyCell}
                          />
                          <GridColumn
                            field="customer_code"
                            title="업체코드"
                            width={80}
                          />
                          <GridColumn
                            field="value_code3"
                            title="Value구분"
                            width={110}
                            cell={ValueCodeCell}
                          />
                          <GridColumn
                            field="completion_date"
                            title="처리완료일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="reception_attach_number"
                            title="접수자료첨부"
                            width={120}
                            cell={FilesCell}
                          />
                          <GridColumn
                            field="document_id"
                            title="문서번호"
                            width={150}
                          />
                          <GridColumn
                            field="answer_document_id"
                            title="답변문서번호"
                            width={150}
                          />
                          <GridColumn
                            field="ref_number"
                            title="접수일지번호"
                            width={150}
                          />
                        </Grid>
                      </GridContainer>
                    </FilesContext.Provider>
                  </ValueCodeContext.Provider>
                </UserContext.Provider>
              </StatusContext.Provider>
            </SwiperSlide>
            <SwiperSlide key={1}>
              <GridContainer>
                <GridTitleContainer className="ButtonContainer2">
                  <GridTitle>
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
                    문의 내용
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
                      icon={"pencil"}
                      onClick={onQuestionWndClick}
                      themeColor={"primary"}
                      fillMode={"outline"}
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
                            )[0].reception_type == "Q"
                          ? true
                          : false
                      }
                      style={{ marginTop: "5px" }}
                    >
                      수정
                    </Button>
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
                </GridTitleContainer>
                <div style={{ height: mobileheight2 }}>
                  <RichEditor id="docEditor" ref={docEditorRef} hideTools />
                </div>
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
                                  Object.getOwnPropertyNames(selectedState)[0]
                              )[0] == undefined
                                ? ""
                                : mainDataResult.data.filter(
                                    (item) =>
                                      item[DATA_ITEM_KEY] ==
                                      Object.getOwnPropertyNames(
                                        selectedState
                                      )[0]
                                  )[0].files
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
                    답변 내용
                  </GridTitle>
                  <ButtonContainer>
                    <Button
                      icon={"pencil"}
                      onClick={onAnswerWndClick}
                      themeColor={"primary"}
                      fillMode={"outline"}
                    >
                      수정
                    </Button>
                    <Button
                      icon={"notification"}
                      onClick={onAlertClick}
                      themeColor={"primary"}
                      fillMode={"outline"}
                    >
                      답변 알림 전송
                    </Button>
                  </ButtonContainer>
                </GridTitleContainer>
                <div style={{ height: mobileheight3 }}>
                  <RichEditor id="docEditor2" ref={docEditorRef2} hideTools />
                </div>
                <FormBoxWrap border={true} className="FormBoxWrap2">
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
                              onClick={onAttWndClick3}
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
            </SwiperSlide>
          </Swiper>
        </>
      ) : (
        <>
          <TitleContainer className="TitleContainer">
            <ButtonContainer>
              <Button
                themeColor={"primary"}
                icon="file-add"
                onClick={onAddClick}
              >
                신규
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="delete"
                onClick={onDeleteClick}
              >
                삭제
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="save"
                onClick={onConfirmClick}
              >
                저장
              </Button>          
            </ButtonContainer>
          </TitleContainer>
          <GridContainerWrap>
            <GridContainer width={`15%`} height={"auto"}>
              <GridTitleContainer>
                <GridTitle>조회조건</GridTitle>
                <Button onClick={search} icon="search" themeColor={"primary"}>
                  조회
                </Button>
              </GridTitleContainer>
              <FilterContainer>
                <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                  <tbody>
                    <tr>
                      <th>기간</th>
                      <td>
                        <MultiSelect
                          name="date_type"
                          data={dateTypeData}
                          onChange={filterMultiSelectChange}
                          value={filters.date_type}
                          textField="code_name"
                          dataItemKey="sub_code"
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
                      <th>처리담당자</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="work_person"
                          data={
                            filter ? filterBy(usersData, filter) : usersData
                          }
                          value={filters.work_person}
                          columns={userColumns}
                          textField={"user_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>접수담당자</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="receptionist"
                          data={
                            filter2 ? filterBy(usersData, filter2) : usersData
                          }
                          value={filters.receptionist}
                          columns={userColumns}
                          textField={"user_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange2}
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
                      <th>작성자</th>
                      <td>
                        <Input
                          name="user_name"
                          type="text"
                          value={filters.user_name}
                          onChange={filterInputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>접수자</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="reception_person"
                          data={
                            filter3 ? filterBy(usersData, filter3) : usersData
                          }
                          value={filters.reception_person}
                          columns={userColumns}
                          textField={"user_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange3}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>접수 구분</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="reception_type"
                          data={
                            filter3
                              ? filterBy(receptionTypeData, filter3)
                              : receptionTypeData
                          }
                          value={filters.reception_type}
                          columns={dataTypeColumns}
                          textField={"code_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange3}
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
                      <th>Value 구분</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="value_code3"
                          data={
                            filter4
                              ? filterBy(valuecodeItems, filter4)
                              : valuecodeItems
                          }
                          value={filters.value_code3}
                          columns={dataTypeColumns2}
                          textField={"code_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange4}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>상태</th>
                      <td>
                        <MultiSelect
                          name="status"
                          data={statusListData}
                          onChange={filterMultiSelectChange}
                          value={filters.status}
                          textField="code_name"
                          dataItemKey="sub_code"
                        />
                      </td>
                    </tr>
                  </tbody>
                </FilterBox>
              </FilterContainer>
            </GridContainer>
            <Splitter
              panes={panes}
              onChange={onChange}
              style={{
                width: `calc(85% - ${GAP}px)`,
                borderColor: "#00000000",
              }}
            >
              <StatusContext.Provider
                value={{
                  statusListData: statusListData,
                }}
              >
                <UserContext.Provider value={{ usersData: usersData }}>
                  <ValueCodeContext.Provider
                    value={{ valuecodeItems: valuecodeItems }}
                  >
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
                      <GridContainer>
                        <GridTitleContainer className="ButtonContainer">
                          <GridTitle>업무지시 정보</GridTitle>
                        </GridTitleContainer>
                        <Grid
                          style={{ height: webheight }}
                          data={process(
                            mainDataResult.data.map((row) => ({
                              ...row,
                              reception_type: reception_typeData.find(
                                (items: any) =>
                                  items.sub_code == row.reception_type
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
                            field="rowstatus"
                            title=" "
                            width="40px"
                          />
                          <GridColumn
                            field="status"
                            title="상태"
                            width={90}
                            cell={StatusCell}
                          />
                          <GridColumn
                            field="request_date"
                            title="요청일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="customer_name"
                            title="업체명"
                            width={150}
                          />
                          <GridColumn
                            field="user_name"
                            title="작성자"
                            width={80}
                          />
                          <GridColumn
                            field="user_tel"
                            title="연락처"
                            width={120}
                          />
                          <GridColumn field="title" title="제목" width={300} />
                          <GridColumn
                            field="reception_person"
                            title="접수자"
                            width={80}
                            cell={UserCell}
                          />
                          <GridColumn
                            field="reception_date"
                            title="접수일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="be_finished_date"
                            title="완료예정일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="reception_time"
                            title="접수소요시간"
                            width={100}
                            cell={NumberCell}
                          />
                          <GridColumn
                            field="reception_type"
                            title="접수구분"
                            width={75}
                            footerCell={mainTotalFooterCell}
                          />
                          <GridColumn
                            field="exists_task"
                            title="지시여부"
                            width={90}
                            cell={Exists_taskCell}
                          />
                          <GridColumn
                            field="is_finish"
                            title="완료여부"
                            width={75}
                            cell={CheckBoxReadOnlyCell}
                          />
                          <GridColumn
                            field="customer_code"
                            title="업체코드"
                            width={80}
                          />
                          <GridColumn
                            field="value_code3"
                            title="Value구분"
                            width={110}
                            cell={ValueCodeCell}
                          />
                          <GridColumn
                            field="completion_date"
                            title="처리완료일"
                            width={100}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="reception_attach_number"
                            title="접수자료첨부"
                            width={120}
                            cell={FilesCell}
                          />
                          <GridColumn
                            field="document_id"
                            title="문서번호"
                            width={150}
                          />
                          <GridColumn
                            field="answer_document_id"
                            title="답변문서번호"
                            width={150}
                          />
                          <GridColumn
                            field="ref_number"
                            title="접수일지번호"
                            width={150}
                          />
                        </Grid>
                      </GridContainer>
                    </FilesContext.Provider>
                  </ValueCodeContext.Provider>
                </UserContext.Provider>
              </StatusContext.Provider>
              <GridContainer>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer2">
                    <GridTitle>
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={
                          isVisibleDetail ? "chevron-left" : "chevron-right"
                        }
                        onClick={() => {
                          if (isVisibleDetail == true) {
                            setPanes([
                              { size: "0%", min: "0px", collapsible: true },
                              {},
                            ]);
                          } else {
                            setPanes([
                              { size: "60%", min: "0px", collapsible: true },
                              {},
                            ]);
                          }
                          setIsVisableDetail((prev) => !prev);
                        }}
                      ></Button>
                      문의 내용
                    </GridTitle>
                    <ButtonContainer>
                      <Button
                        icon={"pencil"}
                        onClick={onQuestionWndClick}
                        themeColor={"primary"}
                        fillMode={"outline"}
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
                              )[0].reception_type == "Q"
                            ? true
                            : false
                        }
                        style={{ marginTop: "5px" }}
                      >
                        수정
                      </Button>
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
                  </GridTitleContainer>
                  <div style={{ height: webheight2 }}>
                    <RichEditor id="docEditor" ref={docEditorRef} hideTools />
                  </div>
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
                                    Object.getOwnPropertyNames(selectedState)[0]
                                )[0] == undefined
                                  ? ""
                                  : mainDataResult.data.filter(
                                      (item) =>
                                        item[DATA_ITEM_KEY] ==
                                        Object.getOwnPropertyNames(
                                          selectedState
                                        )[0]
                                    )[0].files
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
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer3">
                    <GridTitle>답변 내용</GridTitle>
                    <ButtonContainer>
                      <Button
                        icon={"pencil"}
                        onClick={onAnswerWndClick}
                        themeColor={"primary"}
                        fillMode={"outline"}
                      >
                        수정
                      </Button>
                      <Button
                        icon={"notification"}
                        onClick={onAlertClick}
                        themeColor={"primary"}
                        fillMode={"outline"}
                      >
                        답변 알림 전송
                      </Button>
                    </ButtonContainer>
                  </GridTitleContainer>
                  <div style={{ height: webheight3 }}>
                    <RichEditor id="docEditor2" ref={docEditorRef2} hideTools />
                  </div>
                  <FormBoxWrap border={true} className="FormBoxWrap2">
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
                                onClick={onAttWndClick3}
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
              </GridContainer>
            </Splitter>
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
                )[0].attdatnum
          }
          permission={{ upload: false, download: true, delete: false }}
          type={"question"}
          modal={true}
        />
      )}
      {attachmentsWindowVisible3 && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible3}
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
                )[0].document_id
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
      {questionWindowVisible && (
        <QuestionWindow
          setVisible={setQuestionWindowVisible}
          reload={(str: string) => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: str,
              pgNum: 1,
              isSearch: true,
            }));
          }}
          modal={true}
        />
      )}
      {questionWindowVisible2 && (
        <QuestionWindow
          setVisible={setQuestionWindowVisible2}
          reload={(str: string) => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: str,
              pgNum: 1,
              isSearch: true,
            }));
          }}
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
                )[0]
          }
          modal={true}
        />
      )}
    </>
  );
};
export default App;
