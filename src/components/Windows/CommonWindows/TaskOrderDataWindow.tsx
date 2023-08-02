import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInGridInput,
  FilterBox,
  FilterBoxWrap,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
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
import { convertDateToStr, handleKeyPressSearch } from "../../CommonFunction";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  DataResult,
  FilterDescriptor,
  State,
  process,
  filterBy,
  getter,
} from "@progress/kendo-data-query";
import {
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../../../store/columns/common-columns";
import CommonDateRangePicker from "../../DateRangePicker/CommonDateRangePicker";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../../../hooks/api";
import { Iparameters, TEditorHandle } from "../../../store/types";
import AttachmentsWindow from "./AttachmentsWindow";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../../store/atoms";
import DateCell from "../../Cells/DateCell";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";
import RichEditor from "../../RichEditor";
import NumberCell from "../../Cells/NumberCell";
import ProgressCell from "../../Cells/ProgressCell";

type IKendoWindow = {
  setVisible(t: boolean): void;
  setData(data: object, type: string): void;
  modal?: boolean;
};
const topHeight = 205;
const bottomHeight = 55;
const leftOverHeight = (topHeight + bottomHeight) / 2;
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

const DATA_ITEM_KEY = "document_id";
const DATA_ITEM_KEY2 = "find_key";
const DATA_ITEM_KEY3 = "find_key";
let targetRowIndex: null | number = null;
let targetRowIndex2: null | number = null;
let targetRowIndex3: null | number = null;
const KendoWindow = ({ setVisible, setData, modal = false }: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 768;
  const processApi = useApi();
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1600,
    height: 900,
  });
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

  const setLoading = useSetRecoilState(isLoading);
  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);
  let gridRef3: any = useRef(null);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const idGetter3 = getter(DATA_ITEM_KEY3);
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);
  const [page3, setPage3] = useState(initialPageState);
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
  const pageChange3 = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage3({
      skip: page.skip,
      take: initialPageState.take,
    });
  };
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
    ref_type: any;
    check: any;
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
    worker: { user_id: "", user_name: "" },
    reception_type: { sub_code: "", code_name: "" },
    user_name: { user_id: "", user_name: "" },
    ref_type: [
      { code: 1, name: "접수" },
      { code: 2, name: "프로젝트" },
      { code: 3, name: "회의록" },
      { code: 4, name: "미참조" },
    ],
    check: [
      { sub_code: "Y", code_name: "확인" },
      { sub_code: "N", code_name: "미확인" },
    ],
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

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
        worker: { user_id: "", user_name: "" },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: "", user_name: "" },
        ref_type: [
          { code: 1, name: "접수" },
          { code: 2, name: "프로젝트" },
          { code: 3, name: "회의록" },
          { code: 4, name: "미참조" },
        ],
        check: [
          { sub_code: "Y", code_name: "확인" },
          { sub_code: "N", code_name: "미확인" },
        ],
        findRowValue: "",
        pgSize: PAGE_SIZE,
        pgNum: 1,
        isSearch: true,
      });
      setPage({
        skip: 0,
        take: initialPageState.take,
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
        worker: { user_id: "", user_name: "" },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: "", user_name: "" },
        ref_type: [
          { code: 1, name: "접수" },
          { code: 2, name: "프로젝트" },
          { code: 3, name: "회의록" },
          { code: 4, name: "미참조" },
        ],
        check: [
          { sub_code: "Y", code_name: "확인" },
          { sub_code: "N", code_name: "미확인" },
        ],
        findRowValue: "",
        pgSize: PAGE_SIZE,
        pgNum: 1,
        isSearch: true,
      });
      setPage2({
        skip: 0,
        take: initialPageState.take,
      });
    } else if (e.selected == 2) {
      setFilters({
        workType: "meeting",
        date_type: { sub_code: "A", code_name: "회의일" },
        fromDate: fromDate,
        toDate: new Date(),
        custnm: "",
        value_code3: { sub_code: "", code_name: "" },
        contents: "",
        status: [{ sub_code: "N", code_name: "미완료", code: "N" }],
        reception_person: { user_id: "", user_name: "" },
        receptionist: { user_id: "", user_name: "" },
        worker: { user_id: "", user_name: "" },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: "", user_name: "" },
        ref_type: [
          { code: 1, name: "접수" },
          { code: 2, name: "프로젝트" },
          { code: 3, name: "회의록" },
          { code: 4, name: "미참조" },
        ],
        check: [
          { sub_code: "Y", code_name: "확인" },
          { sub_code: "N", code_name: "미확인" },
        ],
        findRowValue: "",
        pgSize: PAGE_SIZE,
        pgNum: 1,
        isSearch: true,
      });
      setPage3({
        skip: 0,
        take: initialPageState.take,
      });
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
  const [filter12, setFilter12] = useState<FilterDescriptor>();
  const [filter13, setFilter13] = useState<FilterDescriptor>();
  const [filter14, setFilter14] = useState<FilterDescriptor>();
  const [filter15, setFilter15] = useState<FilterDescriptor>();
  const [filter16, setFilter16] = useState<FilterDescriptor>();
  const [filter17, setFilter17] = useState<FilterDescriptor>();
  const [filter18, setFilter18] = useState<FilterDescriptor>();
  const [filter19, setFilter19] = useState<FilterDescriptor>();

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
  const handleFilterChange12 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter12(event.filter);
    }
  };
  const handleFilterChange13 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter13(event.filter);
    }
  };
  const handleFilterChange14 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter14(event.filter);
    }
  };
  const handleFilterChange15 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter15(event.filter);
    }
  };
  const handleFilterChange16 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter16(event.filter);
    }
  };
  const handleFilterChange17 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter17(event.filter);
    }
  };
  const handleFilterChange18 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter18(event.filter);
    }
  };
  const handleFilterChange19 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter19(event.filter);
    }
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
  const dateTypeData3 = [
    { sub_code: "A", code_name: "회의일" },
    { sub_code: "B", code_name: "요청일" },
    { sub_code: "C", code_name: "완료예정일" },
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
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [mainDataState3, setMainDataState3] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainDataResult2, setMainDataResult2] = useState<DataResult>(
    process([], mainDataState2)
  );
  const [mainDataResult3, setMainDataResult3] = useState<DataResult>(
    process([], mainDataState3)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedState2, setSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedState3, setSelectedState3] = useState<{
    [id: string]: boolean | number[];
  }>({});

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

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex3 !== null && gridRef3.current) {
      gridRef3.current.scrollIntoView({ rowIndex: targetRowIndex3 });
      targetRowIndex3 = null;
    }
  }, [mainDataResult3]);
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
      setPage3(initialPageState); // 페이지 초기화
      setHtmlOnEditor({ document: "" });
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        findRowValue: "",
        isSearch: true,
      }));
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

  const [reception_attach_number, setReception_attach_number] =
    useState<string>("");
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange3 = (e: any) => {
    setMainDataState3((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onMainDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setMainDataState2(event.dataState);
  };
  const onMainDataStateChange3 = (event: GridDataStateChangeEvent) => {
    setMainDataState3(event.dataState);
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
  const onSelectionChange3 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState3,
      dataItemKey: DATA_ITEM_KEY3,
    });
    setSelectedState3(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    fetchDocument("Meeting", selectedRowData.document_id);
  };

  const fetchDocument = async (type: string, ref_key: string, key?: any) => {
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

  const mainTotalFooterCell3 = (props: GridFooterCellProps) => {
    var parts = mainDataResult3.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult3.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  function getName(data: { sub_code: string }[]) {
    let str = "";

    data.map((item: { sub_code: string }) => (str += item.sub_code + "|"));

    return data.length > 0 ? str.slice(0, -1) : str;
  }
  function getName2(data: { name: string }[]) {
    let str = "";

    data.map((item: { name: string }) => (str += item.name + ", "));

    return data.length > 0 ? str.slice(0, -2) : str;
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
    const ref_type =
      filters.ref_type.length == 0
        ? "접수, 프로젝트, 회의록, 미참조"
        : filters.ref_type.length == 1
        ? filters.ref_type[0].name
        : getName2(filters.ref_type);
    const check =
      filters.check.length == 0
        ? "Y|N"
        : filters.check.length == 1
        ? filters.check[0].sub_code
        : getName(filters.check);
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
        "@p_check": check,
        "@p_ref_type": ref_type,
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
    const ref_type =
      filters.ref_type.length == 0
        ? "접수, 프로젝트, 회의록, 미참조"
        : filters.ref_type.length == 1
        ? filters.ref_type[0].name
        : getName2(filters.ref_type);
    const check =
      filters.check.length == 0
        ? "Y|N"
        : filters.check.length == 1
        ? filters.check[0].sub_code
        : getName(filters.check);
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
        "@p_check": check,
        "@p_ref_type": ref_type,
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

  //그리드 데이터 조회
  const fetchMainGrid3 = async (filters: any) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length == 0
        ? "Y|N"
        : filters.status.length == 1
        ? filters.status[0].sub_code
        : getName(filters.status);
    const ref_type =
      filters.ref_type.length == 0
        ? "접수, 프로젝트, 회의록, 미참조"
        : filters.ref_type.length == 1
        ? filters.ref_type[0].name
        : getName2(filters.ref_type);
    const check =
      filters.check.length == 0
        ? "Y|N"
        : filters.check.length == 1
        ? filters.check[0].sub_code
        : getName(filters.check);
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
        "@p_check": check,
        "@p_ref_type": ref_type,
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
        if (gridRef3.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row[DATA_ITEM_KEY3] == filters.findRowValue
          );
          targetRowIndex3 = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage3({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef3.current) {
          targetRowIndex3 = 0;
        }
      }

      setMainDataResult3((prev) => {
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
                (row: any) => row[DATA_ITEM_KEY3] == filters.findRowValue
              );

        if (selectedRow != undefined) {
          setSelectedState3({ [selectedRow[DATA_ITEM_KEY3]]: true });

          fetchDocument("Meeting", selectedRow.document_id);
        } else {
          setSelectedState3({ [rows[0][DATA_ITEM_KEY3]]: true });

          fetchDocument("Meeting", selectedRow.document_id);
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

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, findRowValue: "", isSearch: false })); // 한번만 조회되도록
      if (tabSelected == 0) {
        fetchMainGrid(deepCopiedFilters);
      } else if (tabSelected == 1) {
        fetchMainGrid2(deepCopiedFilters);
      } else if (tabSelected == 2) {
        fetchMainGrid3(deepCopiedFilters);
      }
    }
  }, [filters]);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [attachmentsWindowVisible2, setAttachmentsWindowVisible2] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible2(true);
  };

  const onConfirmClick = () => {
    if (tabSelected == 0) {
      const datas = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];

      setData(datas, "접수");
    } else if (tabSelected == 1) {
      const datas = mainDataResult2.data.filter(
        (item) =>
          item[DATA_ITEM_KEY2] == Object.getOwnPropertyNames(selectedState2)[0]
      )[0];

      setData(datas, "프로젝트");
    } else {
      const datas = mainDataResult3.data.filter(
        (item) =>
          item[DATA_ITEM_KEY3] == Object.getOwnPropertyNames(selectedState3)[0]
      )[0];

      setData(datas, "회의록");
    }

    onClose();
  };

  
  const onRemoveClick = () => {
    setData({}, "삭제");
    onClose();
  };
  
  return (
    <Window
      title={"업무지시 자료 참조"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={modal}
    >
      <TabStrip
        style={{ width: "100%", height: `81vh` }}
        selected={tabSelected}
        onSelect={handleSelectTab}
      >
        <TabStripTab title="문의접수">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>조회조건</GridTitle>
            </GridTitleContainer>
            <FilterBoxWrap>
              <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                <tbody>
                  <tr>
                    <th>
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
                    </th>
                    <td>
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
                    <th>업체명</th>
                    <td>
                      <Input
                        name="custnm"
                        type="text"
                        value={filters.custnm}
                        onChange={filterInputChange}
                      />
                    </td>
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
            <GridContainer>
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
                  <GridTitleContainer>
                    <GridTitle>문의접수 리스트</GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: "30vh" }}
                    data={process(
                      mainDataResult.data.map((row) => ({
                        ...row,
                        reception_person: usersData.find(
                          (items: any) => items.user_id == row.reception_person
                        )?.user_name,
                        value_code3: valuecodeItems.find(
                          (items: any) => items.sub_code == row.value_code3
                        )?.code_name,
                        status: statusListData.find(
                          (items: any) => items.code == row.status
                        )?.code_name,
                        reception_type: receptionTypeData.find(
                          (items: any) => items.sub_code == row.reception_type
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
                    <GridColumn field="user_name" title="문의자" width={120} />
                    <GridColumn field="user_tel" title="연락처" width={150} />
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
                </FilesContext.Provider>
              </StatusContext.Provider>
            </GridContainer>
            <GridContainer height={`calc(50% - ${leftOverHeight}px)`}>
              <GridTitleContainer>
                <GridTitle>고객 문의 내용</GridTitle>
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
                                    Object.getOwnPropertyNames(selectedState)[0]
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
          </GridContainer>
        </TabStripTab>
        <TabStripTab title="프로젝트">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>조회조건</GridTitle>
            </GridTitleContainer>
            <FilterBoxWrap>
              <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                <tbody>
                  <tr>
                    <th>
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
                    <td>
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
                    <th>업체명</th>
                    <td>
                      <Input
                        name="custnm"
                        type="text"
                        value={filters.custnm}
                        onChange={filterInputChange}
                      />
                    </td>
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
                    <th>담당PM</th>
                    <td>
                      <MultiColumnComboBox
                        name="user_name"
                        data={
                          filter10 ? filterBy(usersData, filter10) : usersData
                        }
                        value={filters.user_name}
                        columns={userColumns}
                        textField={"user_name"}
                        onChange={filterComboBoxChange}
                        filterable={true}
                        onFilterChange={handleFilterChange10}
                      />
                    </td>
                    <th>처리담당자</th>
                    <td>
                      <MultiColumnComboBox
                        name="worker"
                        data={
                          filter11 ? filterBy(usersData, filter11) : usersData
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
          <GridContainer>
            <ListRadioContext.Provider
              value={{ listRadioItems: listRadioItems }}
            >
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>프로젝트 상세 항목 리스트</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: `55vh` }}
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
                  <GridColumn field="pgmnm" title="Value 이름" width={120} />
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
                  <GridColumn field="indicator" title="설계자" width={120} />
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
        </TabStripTab>
        <TabStripTab title="회의록">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>조회조건</GridTitle>
            </GridTitleContainer>
            <FilterBoxWrap>
              <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                <tbody>
                  <tr>
                    <th>
                      <MultiColumnComboBox
                        name="date_type"
                        data={
                          filter12
                            ? filterBy(dateTypeData3, filter12)
                            : dateTypeData3
                        }
                        value={filters.date_type}
                        columns={dataTypeColumns}
                        textField={"code_name"}
                        onChange={filterComboBoxChange}
                        className="required"
                        filterable={true}
                        onFilterChange={handleFilterChange12}
                        style={{ width: "100%" }}
                      />
                    </th>
                    <td>
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
                    <th>완료여부</th>
                    <td colSpan={3}>
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
                    <th>제목 및 내용</th>
                    <td>
                      <Input
                        name="contents"
                        type="text"
                        value={filters.contents}
                        onChange={filterInputChange}
                      />
                    </td>
                    <th>접수담당자</th>
                    <td>
                      <MultiColumnComboBox
                        name="receptionist"
                        data={
                          filter13 ? filterBy(usersData, filter13) : usersData
                        }
                        value={filters.receptionist}
                        columns={userColumns}
                        textField={"user_name"}
                        onChange={filterComboBoxChange}
                        filterable={true}
                        onFilterChange={handleFilterChange13}
                      />
                    </td>
                    <th>처리담당자</th>
                    <td>
                      <MultiColumnComboBox
                        name="worker"
                        data={
                          filter14 ? filterBy(usersData, filter14) : usersData
                        }
                        value={filters.worker}
                        columns={userColumns}
                        textField={"user_name"}
                        onChange={filterComboBoxChange}
                        filterable={true}
                        onFilterChange={handleFilterChange14}
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
                    <th>Value 구분</th>
                    <td colSpan={3}>
                      <MultiColumnComboBox
                        name="value_code3"
                        data={
                          filter15
                            ? filterBy(valuecodeItems, filter15)
                            : valuecodeItems
                        }
                        value={filters.value_code3}
                        columns={dataTypeColumns2}
                        textField={"code_name"}
                        onChange={filterComboBoxChange}
                        filterable={true}
                        onFilterChange={handleFilterChange15}
                      />
                    </td>
                  </tr>
                </tbody>
              </FilterBox>
            </FilterBoxWrap>
          </GridContainer>
          <GridContainer>
            <GridContainer>
              <GridTitleContainer>
                <GridTitle>회의록 요구사항 리스트</GridTitle>
              </GridTitleContainer>
              <Grid
                style={{ height: `30vh` }}
                data={process(
                  mainDataResult3.data.map((row) => ({
                    ...row,
                    client_name: usersData.find(
                      (items: any) => items.user_id == row.client_name
                    )?.user_name,
                    value_code3: valuecodeItems.find(
                      (items: any) => items.sub_code == row.value_code3
                    )?.code_name,
                    is_finished:
                      row.is_finished == "Y"
                        ? true
                        : row.is_finished == "N"
                        ? false
                        : row.is_finished,
                    exists_task:
                      row.exists_task == "Y"
                        ? true
                        : row.exists_task == "N"
                        ? false
                        : row.exists_task,
                    [SELECTED_FIELD]: selectedState3[idGetter3(row)],
                  })),
                  mainDataState3
                )}
                {...mainDataState3}
                onDataStateChange={onMainDataStateChange3}
                //선택 기능
                dataItemKey={DATA_ITEM_KEY3}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onSelectionChange3}
                //스크롤 조회 기능
                fixedScroll={true}
                total={mainDataResult3.total}
                skip={page3.skip}
                take={page3.take}
                pageable={true}
                onPageChange={pageChange3}
                //원하는 행 위치로 스크롤 기능
                ref={gridRef3}
                rowHeight={30}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange3}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
              >
                <GridColumn
                  field="is_finished"
                  title="완료"
                  width={50}
                  cell={CheckBoxReadOnlyCell}
                  footerCell={mainTotalFooterCell3}
                />
                <GridColumn
                  field="exists_task"
                  title="지시"
                  width={50}
                  cell={CheckBoxReadOnlyCell}
                />
                <GridColumn
                  field="recdt"
                  title="회의일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn field="custnm" title="업체" width={200} />
                <GridColumn
                  field="contents"
                  title="내용(요구사항)"
                  width={500}
                />
                <GridColumn
                  field="finexpdt"
                  title="완료예정일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="reqdt"
                  title="요청일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="value_code3"
                  title="Value 구분"
                  width={150}
                />
                <GridColumn
                  field="client_name"
                  title="고객담당자"
                  width={120}
                />
                <GridColumn
                  field="client_finexpdt"
                  title="고객완료예정일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn field="find_key" title="회의록번호" width={200} />
              </Grid>
            </GridContainer>
            <GridContainer>
              <GridTitleContainer>
                <GridTitle>회의 참고 자료</GridTitle>
              </GridTitleContainer>
              <FormBoxWrap border={true}>
                <FormBox>
                  <tbody>
                    <tr>
                      <th style={{ width: "5%" }}>회의 제목</th>
                      <td>
                        <Input
                          name="title"
                          type="text"
                          value={
                            mainDataResult3.data.filter(
                              (item) =>
                                item[DATA_ITEM_KEY3] ==
                                Object.getOwnPropertyNames(selectedState3)[0]
                            )[0] == undefined
                              ? ""
                              : mainDataResult3.data.filter(
                                  (item) =>
                                    item[DATA_ITEM_KEY3] ==
                                    Object.getOwnPropertyNames(
                                      selectedState3
                                    )[0]
                                )[0].title
                          }
                          className="readonly"
                        />
                      </td>
                      <th style={{ width: "5%" }}>첨부파일</th>
                      <td>
                        <Input
                          name="files"
                          type="text"
                          value={
                            mainDataResult3.data.filter(
                              (item) =>
                                item[DATA_ITEM_KEY3] ==
                                Object.getOwnPropertyNames(selectedState3)[0]
                            )[0] == undefined
                              ? ""
                              : mainDataResult3.data.filter(
                                  (item) =>
                                    item[DATA_ITEM_KEY3] ==
                                    Object.getOwnPropertyNames(
                                      selectedState3
                                    )[0]
                                )[0].files
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
              <RichEditor id="docEditor" ref={docEditorRef} hideTools />
            </GridContainer>
          </GridContainer>
        </TabStripTab>
      </TabStrip>
      <BottomContainer>
        <ButtonContainer style={{ justifyContent: "space-between" }}>
          <div style={{ float: "left" }}>
            <Button icon="minus" fillMode={"outline"} themeColor={"primary"} onClick={onRemoveClick}>
              참조 제거
            </Button>
          </div>
          <div>
            <Button themeColor={"primary"} onClick={onConfirmClick}>
              확인
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </div>
        </ButtonContainer>
      </BottomContainer>
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
      {attachmentsWindowVisible2 && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible2}
          para={
            mainDataResult3.data.filter(
              (item) =>
                item[DATA_ITEM_KEY3] ==
                Object.getOwnPropertyNames(selectedState3)[0]
            )[0] == undefined
              ? ""
              : mainDataResult3.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY3] ==
                    Object.getOwnPropertyNames(selectedState3)[0]
                )[0].attdatnum
          }
          permission={{ upload: false, download: true, delete: false }}
          type={"meeting"}
          modal={true}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
