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
import { useApi } from "../hooks/api";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  convertDateToStr,
  handleKeyPressSearch,
} from "../components/CommonFunction";
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
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../store/atoms";
import { Iparameters, TEditorHandle } from "../store/types";
import {
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import DateCell from "../components/Cells/DateCell";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import RichEditor from "../components/RichEditor";
import TaskOrderWindow from "../components/Windows/CommonWindows/TaskOrderWindow";
import ProgressCell from "../components/Cells/ProgressCell";
import RadioGroupCell from "../components/Cells/RadioGroupCell";
import NumberCell from "../components/Cells/NumberCell";

const StatusContext = createContext<{
  statusListData: any[];
}>({
  statusListData: [],
});

const StatusCell = (props: GridCellProps) => {
  const { statusListData } = useContext(StatusContext);
  const data = props.dataItem;

  const styles =
    data.status == "진행중" ? (
      <span
        className="k-icon k-i-circle k-icon-xxl"
        style={{ color: "yellow", marginLeft: "-6px", marginRight: "-2px" }}
      ></span>
    ) : data.status == "완료" ? (
      <span
        className="k-icon k-i-checkmark-circle k-icon-lg"
        style={{ color: "green", marginRight: "5px" }}
      ></span>
    ) : data.status == "보류" ? (
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
  return statusListData ? (
    <td>
      {styles}
      <span>{data.status}</span>
    </td>
  ) : (
    <td />
  );
};

const FilesContext = createContext<{
  reception_attach_number: string;
}>({
  reception_attach_number: "",
});

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
  const { reception_attach_number } = useContext(FilesContext);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible(true);
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
          para={dataItem.reception_attach_number}
          permission={{ upload: false, download: true, delete: false }}
          type={"task"}
          modal={true}
        />
      )}
    </>
  );
};

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

const DATA_ITEM_KEY = "document_id";
const DATA_ITEM_KEY2 = "find_key";
let targetRowIndex: null | number = null;
let targetRowIndex2: null | number = null;

const ListRadioContext = createContext<{
  listRadioItems: any;
}>({
  listRadioItems: {},
});

const ListRadioCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
  } = props;
  const { listRadioItems } = useContext(ListRadioContext);
  let newRadioGroup = listRadioItems.data.Rows.map((column: any) => ({
    value: column.code,
    label: column.caption,
  }));
  return listRadioItems ? (
    <td aria-colindex={ariaColumnIndex} data-grid-col-index={columnIndex}>
      <RadioGroup
        data={newRadioGroup}
        layout={"horizontal"}
        value={dataItem[field]}
      />
    </td>
  ) : (
    <td />
  );
};

const App = () => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);
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

  const pageChange2 = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage2({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const [filter, setFilter] = useState<FilterDescriptor>();
  const [filter2, setFilter2] = useState<FilterDescriptor>();
  const [filter3, setFilter3] = useState<FilterDescriptor>();
  const [filter4, setFilter4] = useState<FilterDescriptor>();
  const [filter5, setFilter5] = useState<FilterDescriptor>();
  const [filter6, setFilter6] = useState<FilterDescriptor>();
  const [filter7, setFilter7] = useState<FilterDescriptor>();
  const [filter8, setFilter8] = useState<FilterDescriptor>();
  const [filter9, setFilter9] = useState<FilterDescriptor>();
  const [filter10, setFilter10] = useState<FilterDescriptor>();
  const [filter11, setFilter11] = useState<FilterDescriptor>();

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
  const handleFilterChange5 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter5(event.filter);
    }
  };
  const handleFilterChange6 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter6(event.filter);
    }
  };
  const handleFilterChange7 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter7(event.filter);
    }
  };
  const handleFilterChange8 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter8(event.filter);
    }
  };
  const handleFilterChange9 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter9(event.filter);
    }
  };
  const handleFilterChange10 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter10(event.filter);
    }
  };
  const handleFilterChange11 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter11(event.filter);
    }
  };
  const [tabSelected, setTabSelected] = useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
    if (e.selected == 0) {
      setFilters({
        workType: "received",
        date_type: { sub_code: "A", code_name: "요청일" },
        fromDate: fromDate,
        toDate: new Date(),
        custnm: "",
        value_code3: { sub_code: "", code_name: "" },
        contents: "",
        status: [
          { sub_code: "Wait", code_name: "대기", code: "N" },
          { sub_code: "Progress", code_name: "진행중", code: "R" },
          { sub_code: "Hold", code_name: "보류", code: "H" },
        ],
        reception_person: { user_id: "", user_name: "" },
        receptionist: { user_id: "", user_name: "" },
        worker: { user_id: userId, user_name: userName },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: "", user_name: "" },
        findRowValue: "",
        pgSize: PAGE_SIZE,
        pgNum: 1,
        isSearch: true,
      });
    } else if (e.selected == 1) {
      setFilters({
        workType: "project",
        date_type: { sub_code: "A", code_name: "사업시작일(계약일)" },
        fromDate: fromDate,
        toDate: new Date(),
        custnm: "",
        value_code3: { sub_code: "", code_name: "" },
        contents: "",
        status: [{ sub_code: "N", code_name: "미완료", code: "N" }],
        reception_person: { user_id: "", user_name: "" },
        receptionist: { user_id: "", user_name: "" },
        worker: { user_id: userId, user_name: userName },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: "", user_name: "" },
        findRowValue: "",
        pgSize: PAGE_SIZE,
        pgNum: 1,
        isSearch: true,
      });
    }
    setIsVisableDetail(true);
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
    { sub_code: "A", code_name: "요청일" },
    { sub_code: "B", code_name: "접수일" },
    { sub_code: "C", code_name: "완료예정일" },
  ];
  const dateTypeData2 = [
    { sub_code: "A", code_name: "사업시작일(계약일)" },
    { sub_code: "B", code_name: "사업완료일" },
    { sub_code: "C", code_name: "중간점검일" },
    { sub_code: "D", code_name: "최종점검일" },
    { sub_code: "E", code_name: "사업종료일" },
    { sub_code: "%", code_name: "전체" },
  ];
  const [lvlItems, setlvlItems] = useState([
    {
      sub_code: "A",
      code_name: "상",
    },
    {
      sub_code: "B",
      code_name: "중",
    },
    {
      sub_code: "C",
      code_name: "하",
    },
  ]);

  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const statusListData: any[] = [
    { sub_code: "Wait", code_name: "대기", code: "N" },
    { sub_code: "Progress", code_name: "진행중", code: "R" },
    { sub_code: "Hold", code_name: "보류", code: "H" },
    { sub_code: "Finish", code_name: "완료", code: "Y" },
  ];
  const [listRadioItems, setListRadioItems] = useState({
    data: {
      Rows: [
        {
          code: "A",
          caption: "포함",
        },
        {
          code: "B",
          caption: "추가",
        },
      ],
    },
  });

  const statusListData2: any[] = [
    { sub_code: "Y", code_name: "완료", code: "Y" },
    { sub_code: "N", code_name: "미완료", code: "N" },
  ];
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainDataResult2, setMainDataResult2] = useState<DataResult>(
    process([], mainDataState2)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedState2, setSelectedState2] = useState<{
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

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchValueCode();
    fetchUsers();
    fetchReceptionType();
  }, []);

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
  );
  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    custnm: string;
    value_code3: any;
    contents: string;
    status: any;
    reception_person: any;
    receptionist: any;
    worker: any;
    reception_type: any;
    user_name: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };

  const [filters, setFilters] = useState<TFilters>({
    workType: "received",
    date_type: { sub_code: "A", code_name: "요청일" },
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    value_code3: { sub_code: "", code_name: "" },
    contents: "",
    status: [
      { sub_code: "Wait", code_name: "대기", code: "N" },
      { sub_code: "Progress", code_name: "진행중", code: "R" },
      { sub_code: "Hold", code_name: "보류", code: "H" },
    ],
    reception_person: { user_id: "", user_name: "" },
    receptionist: { user_id: "", user_name: "" },
    worker: { user_id: userId, user_name: userName },
    reception_type: { sub_code: "", code_name: "" },
    user_name: { user_id: "", user_name: "" },
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

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_task_order",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_user_name":
          filters.user_name != null ? filters.user_name.user_id : "",
        "@p_contents": filters.contents,
        "@p_reception_type":
          filters.reception_type != null ? filters.reception_type.sub_code : "",
        "@p_value_code3":
          filters.value_code3 != null ? filters.value_code3.sub_code : "",
        "@p_reception_person":
          filters.reception_person != null
            ? filters.reception_person.user_id
            : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_receptionist":
          filters.receptionist != null ? filters.receptionist.user_id : "",
        "@p_status": status,
        "@p_check": "",
        "@p_ref_type": "",
        "@p_ref_key": "",
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

      if (totalRowCnt > 0) {
        const selectedRow =
          filters.findRowValue == ""
            ? rows[0]
            : rows.find(
                (row: any) => row[DATA_ITEM_KEY] == filters.findRowValue
              );

        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });

          fetchDocument("Question", selectedRow.document_id);
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

          fetchDocument("Question", rows[0].document_id);
        }
      } else {
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

  //그리드 데이터 조회
  const fetchMainGrid2 = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length == 0
        ? "Y|N"
        : filters.status.length == 1
        ? filters.status[0].sub_code
        : getName(filters.status);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_task_order",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.sub_code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_user_name":
          filters.user_name != null ? filters.user_name.user_id : "",
        "@p_contents": filters.contents,
        "@p_reception_type":
          filters.reception_type != null ? filters.reception_type.sub_code : "",
        "@p_value_code3":
          filters.value_code3 != null ? filters.value_code3.sub_code : "",
        "@p_reception_person":
          filters.reception_person != null
            ? filters.reception_person.user_id
            : "",
        "@p_worker": filters.worker != null ? filters.worker.user_id : "",
        "@p_receptionist":
          filters.receptionist != null ? filters.receptionist.user_id : "",
        "@p_status": status,
        "@p_check": "",
        "@p_ref_type": "",
        "@p_ref_key": "",
        "@p_ref_seq": 0,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }
    console.log(data);
    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (filters.findRowValue !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef2.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row[DATA_ITEM_KEY2] == filters.findRowValue
          );
          targetRowIndex2 = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage2({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef2.current) {
          targetRowIndex2 = 0;
        }
      }

      setMainDataResult2((prev) => {
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
                (row: any) => row[DATA_ITEM_KEY2] == filters.findRowValue
              );

        if (selectedRow != undefined) {
          setSelectedState2({ [selectedRow[DATA_ITEM_KEY2]]: true });
        } else {
          setSelectedState2({ [rows[0][DATA_ITEM_KEY2]]: true });
        }
      } else {
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

    if (type == "" || ref_key == "") {
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

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, findRowValue: "", isSearch: false })); // 한번만 조회되도록
      if (tabSelected == 0) {
        fetchMainGrid(deepCopiedFilters);
      } else if (tabSelected == 1) {
        fetchMainGrid2(deepCopiedFilters);
      }
    }
  }, [filters]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex2 !== null && gridRef2.current) {
      gridRef2.current.scrollIntoView({ rowIndex: targetRowIndex2 });
      targetRowIndex2 = null;
    }
  }, [mainDataResult2]);

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

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    fetchDocument("Question", selectedRowData.document_id);
  };
  const onSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSelectedState2(newSelectedState);
  };
  const search = () => {
    if (
      filters.date_type == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      setPage(initialPageState); // 페이지 초기화
      setPage2(initialPageState); // 페이지 초기화
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

  const [isVisibleDetail, setIsVisableDetail] = useState(true);

  const [reception_attach_number, setReception_attach_number] =
    useState<string>("");
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const [TaskOrderWindowVisible, setTaskOrderWindowVisible] =
    useState<boolean>(false);
  const [TaskOrderWindowVisible2, setTaskOrderWindowVisible2] =
    useState<boolean>(false);
  const onTaskOrderWndClick = () => {
    if (
      mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0] != undefined
    ) {
      setTaskOrderWindowVisible(true);
    } else {
      alert("데이터가 없습니다.");
    }
  };
  const onTaskOrderWndClick2 = () => {
    if (
      mainDataResult2.data.filter(
        (item) =>
          item[DATA_ITEM_KEY2] == Object.getOwnPropertyNames(selectedState2)[0]
      )[0] != undefined
    ) {
      setTaskOrderWindowVisible2(true);
    } else {
      alert("데이터가 없습니다.");
    }
  };
  const docEditorRef = useRef<TEditorHandle>(null);
  const setHtmlOnEditor = ({ document }: { document: string }) => {
    if (docEditorRef.current) {
      docEditorRef.current.updateEditable(true);
      docEditorRef.current.setHtml(document);
      docEditorRef.current.updateEditable(false);
    }
  };
  return (
    <>
      <TitleContainer>
        <Title>업무 지시</Title>
        <ButtonContainer>
          {tabSelected == 3 ? (
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="save"
              //onClick={saveProject}
            >
              저장
            </Button>
          ) : (
            ""
          )}
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height={"90vh"}>
        <TabStrip
          style={{ width: "100%", height: `90vh` }}
          selected={tabSelected}
          onSelect={handleSelectTab}
        >
          <TabStripTab title="문의접수 참조">
            <GridContainerWrap>
              <GridContainer width={`15%`}>
                <GridTitleContainer>
                  <GridTitle>조회조건</GridTitle>
                </GridTitleContainer>
                <FilterBoxWrap>
                  <FilterBox
                    onKeyPress={(e) => handleKeyPressSearch(e, search)}
                  >
                    <tbody>
                      <tr>
                        <th style={{ width: "50%" }}>
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
                            style={{ width: "100%" }}
                          />
                        </th>
                        <td colSpan={3}>
                          <CommonDateRangePicker
                            value={{
                              start: filters.fromDate,
                              end: filters.toDate,
                            }}
                            onChange={(e: {
                              value: { start: any; end: any };
                            }) =>
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
                        <th>Value 구분</th>
                        <td>
                          <MultiColumnComboBox
                            name="value_code3"
                            data={
                              filter2
                                ? filterBy(valuecodeItems, filter2)
                                : valuecodeItems
                            }
                            value={filters.value_code3}
                            columns={dataTypeColumns2}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange2}
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
                        <th>접수자</th>
                        <td>
                          <MultiColumnComboBox
                            name="reception_person"
                            data={
                              filter4 ? filterBy(usersData, filter4) : usersData
                            }
                            value={filters.reception_person}
                            columns={userColumns}
                            textField={"user_name"}
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
                      <tr>
                        <th>접수담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="receptionist"
                            data={
                              filter5 ? filterBy(usersData, filter5) : usersData
                            }
                            value={filters.receptionist}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange5}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>처리담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="worker"
                            data={
                              filter6 ? filterBy(usersData, filter6) : usersData
                            }
                            value={filters.worker}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange6}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FilterBox>
                </FilterBoxWrap>
              </GridContainer>
              <GridContainer width={`calc(85% - ${GAP}px)`}>
                {isVisibleDetail && (
                  <StatusContext.Provider
                    value={{
                      statusListData: statusListData,
                    }}
                  >
                    <FilesContext.Provider
                      value={{
                        reception_attach_number: reception_attach_number,
                      }}
                    >
                      <GridContainer>
                        <GridTitleContainer>
                          <GridTitle>문의접수 리스트</GridTitle>
                          <ButtonContainer>
                            <Button
                              icon={"pencil"}
                              name="task_order"
                              onClick={onTaskOrderWndClick}
                              themeColor={"primary"}
                            >
                              업무지시
                            </Button>
                          </ButtonContainer>
                        </GridTitleContainer>
                        <Grid
                          style={{ height: `35vh` }}
                          data={process(
                            mainDataResult.data.map((row) => ({
                              ...row,
                              reception_person: usersData.find(
                                (items: any) =>
                                  items.user_id == row.reception_person
                              )?.user_name,
                              value_code3: valuecodeItems.find(
                                (items: any) =>
                                  items.sub_code == row.value_code3
                              )?.code_name,
                              status: statusListData.find(
                                (items: any) => items.code == row.status
                              )?.code_name,
                              reception_type: receptionTypeData.find(
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
                        >
                          <GridColumn
                            field="status"
                            title="상태"
                            width={120}
                            footerCell={mainTotalFooterCell}
                            cell={StatusCell}
                          />
                          <GridColumn
                            field="exists_task"
                            title="지시"
                            width={80}
                            cell={CheckBoxReadOnlyCell}
                          />
                          <GridColumn
                            field="is_finish"
                            title="처리"
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
                            field="be_finished_date"
                            title="완료예정일"
                            width={120}
                            cell={DateCell}
                          />
                          <GridColumn
                            field="customer_name"
                            title="업체명"
                            width={200}
                          />
                          <GridColumn
                            field="reception_person"
                            title="접수자"
                            width={120}
                          />
                          <GridColumn field="title" title="제목" width={300} />
                          <GridColumn
                            field="reception_attach_number"
                            title="접수 첨부"
                            width={100}
                            cell={FilesCell}
                          />
                          <GridColumn
                            field="user_name"
                            title="문의자"
                            width={120}
                          />
                          <GridColumn
                            field="user_tel"
                            title="연락처"
                            width={150}
                          />
                          <GridColumn
                            field="value_code3"
                            title="Value구분"
                            width={100}
                          />
                          <GridColumn
                            field="reception_type"
                            title="접수 구분"
                            width={120}
                          />
                          <GridColumn
                            field="reception_date"
                            title="접수일"
                            width={120}
                            cell={DateCell}
                          />
                        </Grid>
                      </GridContainer>
                    </FilesContext.Provider>
                  </StatusContext.Provider>
                )}
                <GridContainer
                  style={{
                    marginTop: isVisibleDetail ? "10px" : "",
                    height: isVisibleDetail ? "42.5vh" : "82vh",
                  }}
                >
                  <GridTitleContainer>
                    <GridTitle>
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={isVisibleDetail ? "chevron-up" : "chevron-down"}
                        onClick={() => setIsVisableDetail((prev) => !prev)}
                      ></Button>
                      고객 문의 내용
                    </GridTitle>
                    {isVisibleDetail ? (
                      ""
                    ) : (
                      <ButtonContainer>
                        <Button
                          icon={"pencil"}
                          name="task_order"
                          onClick={onTaskOrderWndClick}
                          themeColor={"primary"}
                        >
                          업무지시
                        </Button>
                      </ButtonContainer>
                    )}
                  </GridTitleContainer>
                  <FormBoxWrap border={true}>
                    <FormBox>
                      <tbody>
                        <tr>
                          <th style={{ width: "5%" }}>문의 제목</th>
                          <td>
                            <Input
                              name="title"
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
                                    )[0].title
                              }
                              className="readonly"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </FormBox>
                  </FormBoxWrap>
                  <RichEditor id="docEditor" ref={docEditorRef} hideTools />
                  <FormBoxWrap border={true}>
                    <FormBox>
                      <tbody>
                        <tr>
                          <th style={{ width: "5%" }}>첨부파일</th>
                          <td>
                            <Input
                              name="files"
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
              </GridContainer>
            </GridContainerWrap>
          </TabStripTab>
          <TabStripTab title="프로젝트 참조">
            <GridContainerWrap>
              <GridContainer width={`15%`}>
                <GridTitleContainer>
                  <GridTitle>조회조건</GridTitle>
                </GridTitleContainer>
                <FilterBoxWrap>
                  <FilterBox
                    onKeyPress={(e) => handleKeyPressSearch(e, search)}
                  >
                    <tbody>
                      <tr>
                        <th style={{ width: "50%" }}>
                          <MultiColumnComboBox
                            name="date_type"
                            data={
                              filter7
                                ? filterBy(dateTypeData2, filter7)
                                : dateTypeData2
                            }
                            value={filters.date_type}
                            columns={dataTypeColumns}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            className="required"
                            filterable={true}
                            onFilterChange={handleFilterChange7}
                            style={{ width: "100%" }}
                          />
                        </th>
                        <td colSpan={3}>
                          <CommonDateRangePicker
                            value={{
                              start: filters.fromDate,
                              end: filters.toDate,
                            }}
                            onChange={(e: {
                              value: { start: any; end: any };
                            }) =>
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
                        <th>Value 구분</th>
                        <td>
                          <MultiColumnComboBox
                            name="value_code3"
                            data={
                              filter8
                                ? filterBy(valuecodeItems, filter8)
                                : valuecodeItems
                            }
                            value={filters.value_code3}
                            columns={dataTypeColumns2}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange8}
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
                        <th>사업진행담당</th>
                        <td>
                          <MultiColumnComboBox
                            name="reception_person"
                            data={
                              filter9 ? filterBy(usersData, filter9) : usersData
                            }
                            value={filters.reception_person}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange9}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>담당PM</th>
                        <td>
                          <MultiColumnComboBox
                            name="user_name"
                            data={
                              filter10
                                ? filterBy(usersData, filter10)
                                : usersData
                            }
                            value={filters.user_name}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange10}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>프로젝트</th>
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
                        <th>완료여부</th>
                        <td>
                          <MultiSelect
                            name="status"
                            data={statusListData2}
                            onChange={filterMultiSelectChange}
                            value={filters.status}
                            textField="code_name"
                            dataItemKey="sub_code"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>처리담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="worker"
                            data={
                              filter11
                                ? filterBy(usersData, filter11)
                                : usersData
                            }
                            value={filters.worker}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange11}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FilterBox>
                </FilterBoxWrap>
              </GridContainer>
              <GridContainer width={`calc(85% - ${GAP}px)`}>
                <ListRadioContext.Provider
                  value={{ listRadioItems: listRadioItems }}
                >
                  <GridContainer>
                    <GridTitleContainer>
                      <GridTitle>프로젝트 상세 항목 리스트</GridTitle>
                      <ButtonContainer>
                        <Button
                          icon={"pencil"}
                          name="task_order"
                          onClick={onTaskOrderWndClick2}
                          themeColor={"primary"}
                        >
                          업무지시
                        </Button>
                      </ButtonContainer>
                    </GridTitleContainer>
                    <Grid
                      style={{ height: `78vh` }}
                      data={process(
                        mainDataResult2.data.map((row) => ({
                          ...row,
                          indicator: usersData.find(
                            (items: any) => items.user_id == row.indicator
                          )?.user_name,
                          value_code3: valuecodeItems.find(
                            (items: any) => items.sub_code == row.value_code3
                          )?.code_name,
                          lvl: lvlItems.find(
                            (items: any) => items.sub_code == row.lvl
                          )?.code_name,
                          devperson: usersData.find(
                            (items: any) => items.user_id == row.devperson
                          )?.user_name,
                          chkperson: usersData.find(
                            (items: any) => items.user_id == row.chkperson
                          )?.user_name,
                          useyn:
                            row.useyn == "Y"
                              ? true
                              : row.useyn == "N"
                              ? false
                              : row.useyn,
                          CustSignyn:
                            row.CustSignyn == "Y"
                              ? true
                              : row.CustSignyn == "N"
                              ? false
                              : row.CustSignyn,
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
                      skip={page2.skip}
                      take={page2.take}
                      pageable={true}
                      onPageChange={pageChange2}
                      //원하는 행 위치로 스크롤 기능
                      ref={gridRef2}
                      rowHeight={30}
                      //정렬기능
                      sortable={true}
                      onSortChange={onMainSortChange2}
                      //컬럼순서조정
                      reorderable={true}
                      //컬럼너비조정
                      resizable={true}
                    >
                      <GridColumn field="custnm" title="업체" width={200} />
                      <GridColumn field="number" title="차수" width={80} />
                      <GridColumn
                        field="pgmnm"
                        title="Value 이름"
                        width={120}
                      />
                      <GridColumn
                        field="pgmid"
                        title="폼ID"
                        width={120}
                        footerCell={mainTotalFooterCell2}
                      />
                      <GridColumn
                        field="value_code3"
                        title="Value 구분"
                        width={120}
                      />
                      <GridColumn field="pgmdiv" title="개발구분" width={120} />
                      <GridColumn
                        field="prgrate"
                        title="진행률"
                        width={120}
                        cell={ProgressCell}
                      />
                      <GridColumn
                        field="listyn"
                        title="LIST포함여부"
                        width={180}
                        cell={ListRadioCell}
                      />
                      <GridColumn field="lvl" title="난이도" width={100} />
                      <GridColumn
                        field="stdscore"
                        title="개발표준점수"
                        width={100}
                        cell={NumberCell}
                      />
                      <GridColumn
                        field="modrate"
                        title="수정률"
                        width={100}
                        cell={NumberCell}
                      />
                      <GridColumn
                        field="fnscore"
                        title="기능점수"
                        width={100}
                        cell={NumberCell}
                      />
                      <GridColumn
                        field="indicator"
                        title="설계자"
                        width={120}
                      />
                      <GridColumn
                        field="devperson"
                        title="개발담당자"
                        width={120}
                      />
                      <GridColumn
                        field="DesignEstTime"
                        title="설계예정일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="exptime"
                        title="개발예상시간"
                        width={100}
                        cell={NumberCell}
                      />
                      <GridColumn
                        field="DesignStartDate"
                        title="설계시작일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="DesignEndDate"
                        title="설계완료일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="devstrdt"
                        title="개발시작일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="finexpdt"
                        title="완료예정일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="findt"
                        title="완료일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="chkperson"
                        title="확인담당자"
                        width={120}
                      />
                      <GridColumn
                        field="chkdt"
                        title="확인일"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="useyn"
                        title="사용여부"
                        width={80}
                        cell={CheckBoxReadOnlyCell}
                      />
                      <GridColumn field="remark" title="비고" width={200} />
                      <GridColumn
                        field="CustCheckDate"
                        title="검수일자"
                        width={120}
                        cell={DateCell}
                      />
                      <GridColumn
                        field="CustPerson"
                        title="업체담당자"
                        width={120}
                      />
                      <GridColumn
                        field="CustSignyn"
                        title="업체사인"
                        width={80}
                        cell={CheckBoxReadOnlyCell}
                      />
                      <GridColumn field="module" title="모듈" width={120} />
                      <GridColumn
                        field="find_key"
                        title="개발관리번호"
                        width={200}
                      />
                    </Grid>
                  </GridContainer>
                </ListRadioContext.Provider>
              </GridContainer>
            </GridContainerWrap>
          </TabStripTab>
          <TabStripTab title="회의록 참조">
          </TabStripTab>
        </TabStrip>
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
                )[0].attdatnum
          }
          permission={{ upload: false, download: true, delete: false }}
          type={"question"}
          modal={true}
        />
      )}
      {TaskOrderWindowVisible && (
        <TaskOrderWindow
          setVisible={setTaskOrderWindowVisible}
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
          type={"접수"}
          reload={() => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: Object.getOwnPropertyNames(selectedState)[0],
              isSearch: true,
            }));
          }}
          modal = {true}
        />
      )}
      {TaskOrderWindowVisible2 && (
        <TaskOrderWindow
          setVisible={setTaskOrderWindowVisible2}
          para={
            mainDataResult2.data.filter(
              (item) =>
                item[DATA_ITEM_KEY2] ==
                Object.getOwnPropertyNames(selectedState2)[0]
            )[0] == undefined
              ? {}
              : mainDataResult2.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY2] ==
                    Object.getOwnPropertyNames(selectedState2)[0]
                )[0]
          }
          type={"프로젝트"}
          reload={() => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: Object.getOwnPropertyNames(selectedState2)[0],
              isSearch: true,
            }));
          }}
          modal = {true}
        />
      )}
    </>
  );
};
export default App;
