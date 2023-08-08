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
  UseParaPc,
  convertDateToStr,
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
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import {
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  DataResult,
  FilterDescriptor,
  State,
  filterBy,
  getter,
  process,
} from "@progress/kendo-data-query";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../store/columns/common-columns";
import { Input, Checkbox } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../hooks/api";
import { Iparameters, TEditorHandle } from "../store/types";
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
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { IAttachmentData } from "../hooks/interfaces";
import RichEditor from "../components/RichEditor";
import AnswerWindow from "../components/Windows/CommonWindows/AnswerWindow";
import QuestionWindow from "../components/Windows/CommonWindows/QuestionWindow";
import TaskOrderListWindow from "../components/Windows/CommonWindows/TaskOrderListWindow";

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

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
  setAttdatnum: (d: any) => void;
  setAttach_exists: (d: any) => void;
  mainDataState: State;
  setMainDataState: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

const StatusCell = (props: GridCellProps) => {
  const { statusListData } = useContext(StatusContext);
  const data = props.dataItem;

  const styles =
    data.status == "R" ? (
      <span
        className="k-icon k-i-circle k-icon-xxl"
        style={{ color: "yellow", marginLeft: "-6px", marginRight: "-2px" }}
      ></span>
    ) : data.status == "Y" ? (
      <span
        className="k-icon k-i-checkmark-circle k-icon-lg"
        style={{ color: "green", marginRight: "5px" }}
      ></span>
    ) : data.status == "H" ? (
      <span
        className="k-icon k-i-minus k-icon-lg"
        style={{ marginRight: "5px" }}
      ></span>
    ) : (
      <span
        className="k-icon k-i-circle k-icon-xxl"
        style={{ color: "gray", marginLeft: "-6px", marginRight: "-2px" }}
      ></span>
    );

  const str =
    data.status == "R"
      ? "진행중"
      : data.status == "H"
      ? "보류"
      : data.status == "Y"
      ? "완료"
      : data.status == "N"
      ? "대기"
      : "";
  return statusListData ? (
    <td>
      {styles}
      <span>{str}</span>
    </td>
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
  const { setAttdatnum, setAttach_exists } = useContext(FilesContext);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible(true);
  };

  const getAttachmentsData = (data: IAttachmentData) => {
    setAttdatnum(data.attdatnum);
    if (data.rowCount == 0) {
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
    if(value == true) {
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
const DATA_ITEM_KEY = "document_id";
const App = () => {
  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );
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

  const search = () => {
    if (
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      setPage(initialPageState); // 페이지 초기화
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

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchValueCode();
    fetchUsers();
    fetchReceptionType();
  }, []);

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

    if (data.isSuccess === true) {
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
      })
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
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, findRowValue: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

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
      field == "completion_date"
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
  const [attdatnum, setAttdatnum] = useState<string>("");
  const [attach_exists, setAttach_exists] = useState<string>("");
  useEffect(() => {
    if (attdatnum != "" && attdatnum != undefined && attdatnum != null) {
      setUnsavedAttadatnums((prev) => ({
        type: "receipt",
        attdatnums: [...prev.attdatnums, ...[attdatnum]],
      }));
    }
    const newData = mainDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        ? {
            ...item,
            rowstatus: item.rowstatus == "N" ? "N" : "U",
            reception_attach_number: attach_exists == "N" ? "" : attdatnum,
            reception_attach_exists: attach_exists,
          }
        : {
            ...item,
          }
    );

    if (attach_exists == "N") {
      setAttdatnum("");
    }

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
  }, [attdatnum, attach_exists]);

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
    setAnswerWindowVisible(true);
  };

  const onAddClick = () => {
    setQuestionWindowVisible(true);
  };

  const onQuestionWndClick = () => {
    setQuestionWindowVisible2(true);
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
          reception_attach_number,
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
        rowsArr.attach_number_s.push(reception_attach_number);
        rowsArr.ref_number_s.push(ref_number);
        rowsArr.contents_s.push(contents);
        rowsArr.attdatnum_s.push(attdatnum);
      });

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
      } catch (error) {
        data = null;
      }
      if (data != null) {
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
      } else {
        console.log("[오류 발생]");
        console.log(data);
      }
      setLoading(false);
    }
  };
  return (
    <>
      <TitleContainer>
        <Title>접수 및 답변</Title>
        <ButtonContainer>
          <Button themeColor={"primary"} icon="file-add" onClick={onAddClick}>
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
        <GridContainerWrap height={"88vh"}>
          <GridContainer width={`15%`} height={"auto"}>
            <GridTitleContainer>
              <GridTitle>조회조건</GridTitle>
            </GridTitleContainer>
            <FilterBoxWrap>
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
                      <MultiColumnComboBox
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
                      <MultiColumnComboBox
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
                      <MultiColumnComboBox
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
                      <MultiColumnComboBox
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
                      <MultiColumnComboBox
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
            </FilterBoxWrap>
          </GridContainer>
          {isVisibleDetail && (
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
                      setAttdatnum,
                      setAttach_exists,
                      mainDataState,
                      setMainDataState,
                      // fetchGrid,
                    }}
                  >
                    <GridContainer width={`calc(40% - ${GAP}px)`}>
                      <GridTitleContainer>
                        <GridTitle>업무지시 정보</GridTitle>
                      </GridTitleContainer>
                      <Grid
                        style={{ height: `80vh` }}
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
                        <GridColumn field="rowstatus" title=" " width="45px" />
                        <GridColumn
                          field="reception_type"
                          title="접수구분"
                          width={100}
                          footerCell={mainTotalFooterCell}
                        />
                        <GridColumn
                          field="status"
                          title="상태"
                          width={120}
                          cell={StatusCell}
                        />
                        <GridColumn
                          field="exists_task"
                          title="지시여부"
                          width={120}
                          cell={Exists_taskCell}
                        />
                        <GridColumn
                          field="is_finish"
                          title="완료여부"
                          width={80}
                          cell={CheckBoxReadOnlyCell}
                        />
                        <GridColumn
                          field="request_date"
                          title="요청일"
                          width={120}
                          cell={DateCell}
                        />
                        <GridColumn
                          field="user_name"
                          title="작성자"
                          width={120}
                        />
                        <GridColumn
                          field="user_tel"
                          title="연락처"
                          width={120}
                        />
                        <GridColumn
                          field="customer_code"
                          title="업체코드"
                          width={120}
                        />
                        <GridColumn
                          field="customer_name"
                          title="업체명"
                          width={150}
                        />
                        <GridColumn
                          field="reception_person"
                          title="접수자"
                          width={120}
                          cell={UserCell}
                        />
                        <GridColumn
                          field="reception_time"
                          title="접수소요시간"
                          width={100}
                          cell={NumberCell}
                        />
                        <GridColumn
                          field="reception_date"
                          title="접수일"
                          width={120}
                          cell={DateCell}
                        />
                        <GridColumn field="title" title="제목" width={300} />
                        <GridColumn
                          field="value_code3"
                          title="Value구분"
                          width={120}
                          cell={ValueCodeCell}
                        />
                        <GridColumn
                          field="be_finished_date"
                          title="완료예정일"
                          width={120}
                          cell={DateCell}
                        />
                        <GridColumn
                          field="completion_date"
                          title="처리완료일"
                          width={120}
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
                          width={200}
                        />
                        <GridColumn
                          field="answer_document_id"
                          title="답변문서번호"
                          width={200}
                        />
                        <GridColumn
                          field="ref_number"
                          title="접수일지번호"
                          width={200}
                        />
                      </Grid>
                    </GridContainer>
                  </FilesContext.Provider>
                </ValueCodeContext.Provider>
              </UserContext.Provider>
            </StatusContext.Provider>
          )}
          <GridContainer
            width={
              isVisibleDetail ? `calc(45% - ${GAP}px)` : `calc(85% - ${GAP}px)`
            }
            height={isMobile ? "300vh" : "85vh"}
          >
            <GridContainer height={isMobile ? "100vh" : "43vh"}>
              <GridTitleContainer>
                <GridTitle>
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={isVisibleDetail ? "chevron-left" : "chevron-right"}
                    onClick={() => setIsVisableDetail((prev) => !prev)}
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
              <RichEditor id="docEditor" ref={docEditorRef} hideTools />
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
                                    Object.getOwnPropertyNames(selectedState)[0]
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
            <GridContainer height={isMobile ? "100vh" : "42vh"}>
              <GridTitleContainer>
                <GridTitle>답변내용</GridTitle>
                <ButtonContainer>
                  <Button
                    icon={"pencil"}
                    onClick={onAnswerWndClick}
                    themeColor={"primary"}
                    fillMode={"outline"}
                  >
                    수정
                  </Button>
                </ButtonContainer>
              </GridTitleContainer>
              <RichEditor id="docEditor2" ref={docEditorRef2} hideTools />
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
                                    Object.getOwnPropertyNames(selectedState)[0]
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
        </GridContainerWrap>
      </TitleContainer>
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
