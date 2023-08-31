import {
  DataResult,
  FilterDescriptor,
  GroupDescriptor,
  GroupResult,
  State,
  filterBy,
  getter,
  groupBy,
  process,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  setExpandedState,
  setGroupIds,
} from "@progress/kendo-react-data-tools";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  GRID_COL_INDEX_ATTRIBUTE,
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridExpandChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridPageChangeEvent,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { Checkbox, Input, TextArea } from "@progress/kendo-react-inputs";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { bytesToBase64 } from "byte-base64";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import {
  ButtonContainer,
  ButtonInInput,
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
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import ProgressCell from "../components/Cells/ProgressCell";
import RadioGroupCell from "../components/Cells/RadioGroupCell";
import {
  UseParaPc,
  convertDateToStr,
  dateformat,
  getGridItemChangedData,
  getGroupGridItemChangedData,
  handleKeyPressSearch,
  isValidDate,
} from "../components/CommonFunction";
import {
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import {
  CellRender as CellRender2,
  RowRender as RowRender2,
} from "../components/Renderers/GroupRenderers";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import RequiredHeader from "../components/RequiredHeader";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ValueBoxWindow from "../components/Windows/CommonWindows/ValueBoxWindow";
import ValueBoxWindow2 from "../components/Windows/CommonWindows/ValueBoxWindow2";
import { useApi } from "../hooks/api";
import { ICustData } from "../hooks/interfaces";
import { isLoading, loginResultState, titles } from "../store/atoms";
import {
  custTypeColumns,
  dataTypeColumns,
  dataTypeColumns2,
  dataTypeColumns3,
  dateTypeColumns,
  userColumns,
} from "../store/columns/common-columns";
import { Iparameters } from "../store/types";

const DATA_ITEM_KEY = "devmngnum";
const SUB_DATA_ITEM_KEY = "devmngseq";
const SUB_DATA_ITEM_KEY2 = "idx";

let targetRowIndex: null | number = null;
let targetRowIndex2: null | number = null;
let deletedRows: any[] = [];
let temp = 0;
let temp2 = 0;
const processWithGroups = (data: any[], group: GroupDescriptor[]) => {
  const newDataState = groupBy(data, group);

  setGroupIds({ data: newDataState, group: group });

  return newDataState;
};
const datetypeQueryStr = `SELECT 'A' as code, '사업시작일(계약일)' as name
UNION ALL
SELECT 'B' as code, '완료일' as name
UNION ALL
SELECT 'C' as code, '중간점검일' as name
UNION ALL
SELECT 'D' as code, '최종점검일' as name
UNION ALL
SELECT 'E' as code, '사업종료일' as name
UNION ALL
SELECT '%' as code, '전체' as name`;
const progressstatusQueryStr = `SELECT 'Y' as code, '진행' as name
UNION ALL
SELECT 'N' as code, '미진행' as name
UNION ALL
SELECT '%' as code, '전체' as name`;

const statusQueryStr = `
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;

const custQueryStr = `SELECT custcd,custnm
FROM ba020t where useyn = 'Y' order by custcd`;

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

const devdivQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const DevContext = createContext<{
  devdivItems: any[];
}>({
  devdivItems: [],
});

const ValueCodeContext = createContext<{
  valuecodeItems: any[];
}>({
  valuecodeItems: [],
});

const ListRadioContext = createContext<{
  listRadioItems: any;
}>({
  listRadioItems: {},
});

const LvlContext = createContext<{
  lvlItems: any[];
}>({
  lvlItems: [],
});

const UserContext = createContext<{
  usersData: any[];
}>({
  usersData: [],
});

const DevdivCell = (props: GridCellProps) => {
  const { devdivItems } = useContext(DevContext);

  return devdivItems ? (
    <ComboBoxCell columns={dataTypeColumns} data={devdivItems} {...props} />
  ) : (
    <td />
  );
};

const ValueCodeCell = (props: GridCellProps) => {
  const { valuecodeItems } = useContext(ValueCodeContext);

  return valuecodeItems ? (
    <ComboBoxCell columns={dataTypeColumns3} data={valuecodeItems} {...props} />
  ) : (
    <td />
  );
};

const ListRadioCell = (props: GridCellProps) => {
  const { listRadioItems } = useContext(ListRadioContext);
  if (props.rowType === "groupHeader") {
    return null;
  }
  return listRadioItems ? (
    <RadioGroupCell bizComponentData={listRadioItems} {...props} />
  ) : (
    <td />
  );
};

const LvlCell = (props: GridCellProps) => {
  const { lvlItems } = useContext(LvlContext);

  return lvlItems ? (
    <ComboBoxCell columns={dataTypeColumns2} data={lvlItems} {...props} />
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
const initialGroup: GroupDescriptor[] = [{ field: "group_menu_name" }];
const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [AlltabSelected, setAllTabSelected] = React.useState(0);
  const [group, setGroup] = React.useState(initialGroup);
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setSubFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };
  const [title, setTitle] = useRecoilState(titles);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const idGetter3 = getter(SUB_DATA_ITEM_KEY2);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const history = useHistory();
  const filterRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = React.useState<FilterDescriptor>();
  const [filter2, setFilter2] = React.useState<FilterDescriptor>();
  const [filter3, setFilter3] = React.useState<FilterDescriptor>();
  const [filter4, setFilter4] = React.useState<FilterDescriptor>();
  const [filter5, setFilter5] = React.useState<FilterDescriptor>();
  const [filter6, setFilter6] = React.useState<FilterDescriptor>();

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
  const [workType, setWorkType] = useState("N");
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [subDataState, setSubDataState] = useState<State>({
    group: [
      {
        field: "group_category_name",
      },
    ],
    sort: [],
  });
  const [subDataState2, setSubDataState2] = useState<State>({
    sort: [],
  });
  const [tempState2, setTempState2] = useState<State>({
    sort: [],
  });
  const [collapsedState, setCollapsedState] = React.useState<string[]>([]);
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [subDataResult, setSubDataResult] = useState<GroupResult[]>(
    processWithGroups([], initialGroup)
  );
  const [subDataTotal, setSubDataTotal] = useState<number>(0);
  const [subDataResult2, setSubDataResult2] = useState<DataResult>(
    process([], subDataState2)
  );
  const [tempResult, setTempResult] = useState<GroupResult[]>(
    processWithGroups([], initialGroup)
  );
  const [tempResult2, setTempResult2] = useState<DataResult>(
    process([], tempState2)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [selectedsubDataState2, setSelectedsubDataState2] = useState<{
    [id: string]: boolean | number[];
  }>({});
  let gridRef: any = useRef(null);
  let gridRef2: any = useRef(null);

  useEffect(() => {
    // 접근 권한 검증
    if (loginResult) {
      const role = loginResult ? loginResult.role : "";
      const isAdmin = role === "ADMIN";

      if (!isAdmin) {
        alert("접근 권한이 없습니다.");
        history.goBack();
      }
    }
  }, [loginResult]);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const InputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setInformation((prev) => ({
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

  const ComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    if (name == "custnm") {
      setInformation((prev) => ({
        ...prev,
        [name]: value,
        custcd: value == null ? "" : value.custcd,
      }));
    } else {
      setInformation((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const search = () => {
    if (
      filters.date_type == null ||
      filters.progress_status == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      temp = 0;
      temp2 = 0;
      deletedRows = [];
      setFileList([]);
      setSavenmList([]);
      setFilters((prev) => ({
        ...prev,
        pgNum: 1,
        find_row_value: "",
        isSearch: true,
      }));
    }
  };

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 6,
    currentDate.getDate()
  );
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [valueboxWindowVisible, setValueBoxWindowVisible] =
    useState<boolean>(false);
  const [valueboxWindowVisible2, setValueBoxWindowVisible2] =
    useState<boolean>(false);
  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const onValueBoxWndClick = () => {
    setValueBoxWindowVisible(true);
  };
  const onValueBoxWndClick2 = () => {
    setValueBoxWindowVisible2(true);
  };

  const setCustData = (data: ICustData) => {
    setInformation((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: { custcd: data.custcd, custnm: data.custnm },
    }));
  };

  const setValueBox = (data: any) => {
    subDataResult.map((items) => {
      items.items.map((item: any) => {
        if (item[SUB_DATA_ITEM_KEY] > temp) {
          temp = item[SUB_DATA_ITEM_KEY];
        }
      });
    });
    let newData: any[] = [];
    data.map((item: any) => {
      let newDataItem = {
        [SUB_DATA_ITEM_KEY]: ++temp,
        pgmid: item.code,
        pgmnm: item.name,
        value_code3: item.itemlvl3,
        devdiv: "02",
        prgrate: 0,
        listyn: "A",
        lvl: "B",
        stdscore: 0,
        modrate: 0,
        fnscore: 0,
        exptime: 0,
        devperson: userId,
        devstrdt: new Date(),
        finexpdt: new Date(),
        findt: "",
        chkperson: "",
        chkdt: "",
        finamt: 0,
        discscor: 0,
        remark: "",
        useyn: "Y",
        DesignEstTime: new Date(),
        DesignExphh: 0,
        DesignExpmm: 0,
        DesignStartDate: new Date(),
        DesignEndEstDate: "",
        DesignEndDate: "",
        CustCheckDate: "",
        CustSignyn: "N",
        indicator: userId,
        CustPerson: "",
        rowstatus: "N",
        groupId: "module",
        group_menu_name: "",
      };

      newData.push(newDataItem);
    });
    subDataResult.map((items) => {
      items.items.forEach((item: any, index: number) => {
        newData.push(item);
      });
    });

    setSubDataTotal(subDataTotal + data.length);
    const newDataState = processWithGroups(newData, group);
    setSubDataResult(newDataState);
    setSelectedsubDataState({
      [newData[newData.length - 1][SUB_DATA_ITEM_KEY]]: true,
    });

    setPage((prev) => ({
      ...prev,
      skip: 0,
      take: prev.take + 1,
    }));
  };

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

    setInformation((prev) => ({
      ...prev,
      attdatnum: data.length > 0 ? data[0].attdatnum : prev.attdatnum,
      files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
      attdatnum_exists: "Y",
    }));
  };

  type TFilters = {
    workType: string;
    date_type: any;
    fromDate: Date;
    toDate: Date;
    custnm: string;
    progress_status: any;
    project: string;
    status: any;
    pjt_person: any;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };
  type TSubFilters = {
    workType: string;
    devmngnum: string;
    findRowValue: string;
    pgSize: number;
    pgNum: number;
    isSearch: boolean;
  };
  const [filters, setFilters] = useState<TFilters>({
    workType: "list",
    date_type: { code: "%", name: "전체" },
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    progress_status: { code: "%", name: "전체" },
    project: "",
    status: [{ code: "N", name: "미완료" }],
    pjt_person: { user_id: "", user_name: "" },
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: true,
  });

  const [subFilters, setSubFilters] = useState<TSubFilters>({
    workType: "detail",
    devmngnum: "",
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: false,
  });

  const [subFilters2, setSubFilters2] = useState<TSubFilters>({
    workType: "main_schedule",
    devmngnum: "",
    findRowValue: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
    isSearch: false,
  });

  const [information, setInformation] = useState<{ [name: string]: any }>({
    attdatnum: "",
    attdatnum_exists: "N",
    compl_chk_date: null,
    cotracdt: null,
    custcd: "",
    custnm: { custcd: "", custnm: "" },
    devmngnum: "",
    estnum: "",
    files: "",
    finchkdt: null,
    findt: null,
    finexpdt: null,
    is_finished: "N",
    midchkdt: null,
    number: 0,
    ordnum: "",
    pgmdiv: "",
    pjtmanager: { user_id: "", user_name: "" },
    pjtperson: { user_id: "", user_name: "" },
    progress_status: "N",
    project: "",
    recdt: null,
    remark: "",
    revperson: "",
  });

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

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_project_master",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": filters.workType,
        "@p_date_type": filters.date_type.code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": filters.custnm,
        "@p_pjt_person":
          filters.pjt_person != null ? filters.pjt_person.user_id : "",
        "@p_status": status,
        "@p_project": filters.project,
        "@p_progress_status": filters.progress_status.code,
        "@p_devmngnum": "",
        "@p_code": "",
        "@p_name": "",
        "@p_find_row_value": filters.find_row_value,
        "@p_type": "",
        "@p_service_id": "",
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

      if (filters.find_row_value != "") {
        // find_row_value 행으로 스크롤 이동
        const findRowIndex = rows.findIndex(
          (row: any) => row[DATA_ITEM_KEY] == filters.find_row_value
        );

        targetRowIndex = findRowIndex;
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
          const pjtmanager: any = usersData.find(
            (item: any) => item.user_id == selectedRow.pjtmanager
          );

          const pjtperson: any = usersData.find(
            (item: any) => item.user_id == selectedRow.pjtperson
          );

          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
          setInformation({
            attdatnum: selectedRow.attdatnum,
            attdatnum_exists: selectedRow.attdatnum_exists,
            compl_chk_date: isValidDate(selectedRow.compl_chk_date)
              ? new Date(dateformat(selectedRow.compl_chk_date))
              : null,
            cotracdt: isValidDate(selectedRow.cotracdt)
              ? new Date(dateformat(selectedRow.cotracdt))
              : null,
            custcd: selectedRow.custcd,
            custnm: { custcd: selectedRow.custcd, custnm: selectedRow.custnm },
            devmngnum: selectedRow.devmngnum,
            estnum: selectedRow.estnum,
            files: selectedRow.files,
            finchkdt: isValidDate(selectedRow.finchkdt)
              ? new Date(dateformat(selectedRow.finchkdt))
              : null,
            findt: isValidDate(selectedRow.findt)
              ? new Date(dateformat(selectedRow.findt))
              : null,
            finexpdt: isValidDate(selectedRow.finexpdt)
              ? new Date(dateformat(selectedRow.finexpdt))
              : null,
            is_finished: selectedRow.is_finished,
            midchkdt: isValidDate(selectedRow.midchkdt)
              ? new Date(dateformat(selectedRow.midchkdt))
              : null,
            number: selectedRow.number,
            ordnum: selectedRow.ordnum,
            pgmdiv: selectedRow.pgmdiv,
            pjtmanager: {
              user_id: selectedRow.pjtmanager,
              user_name: pjtmanager == undefined ? "" : pjtmanager.user_name,
            },
            pjtperson: {
              user_id: selectedRow.pjtperson,
              user_name: pjtperson == undefined ? "" : pjtperson.user_name,
            },
            progress_status:
              selectedRow.progress_status == "Y"
                ? true
                : selectedRow.progress_status == "N"
                ? false
                : selectedRow.progress_status,
            project: selectedRow.project,
            recdt: isValidDate(selectedRow.recdt)
              ? new Date(dateformat(selectedRow.recdt))
              : null,
            remark: selectedRow.remark,
            revperson: selectedRow.revperson,
          });
          setSubFilters((prev) => ({
            ...prev,
            devmngnum: selectedRow.devmngnum,
            isSearch: true,
            pgNum: 1,
          }));
          setSubFilters2((prev) => ({
            ...prev,
            devmngnum: selectedRow.devmngnum,
            isSearch: true,
            pgNum: 1,
          }));
          setWorkType("U");
        } else {
          const pjtmanager: any = usersData.find(
            (item: any) => item.user_id == rows[0].pjtmanager
          );

          const pjtperson: any = usersData.find(
            (item: any) => item.user_id == rows[0].pjtperson
          );
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
          setInformation({
            attdatnum: rows[0].attdatnum,
            attdatnum_exists: rows[0].attdatnum_exists,
            compl_chk_date: isValidDate(rows[0].compl_chk_date)
              ? new Date(dateformat(rows[0].compl_chk_date))
              : null,
            cotracdt: isValidDate(rows[0].cotracdt)
              ? new Date(dateformat(rows[0].cotracdt))
              : null,
            custcd: rows[0].custcd,
            custnm: { custcd: rows[0].custcd, custnm: rows[0].custnm },
            devmngnum: rows[0].devmngnum,
            estnum: rows[0].estnum,
            files: rows[0].files,
            finchkdt: isValidDate(rows[0].finchkdt)
              ? new Date(dateformat(rows[0].finchkdt))
              : null,
            findt: isValidDate(rows[0].findt)
              ? new Date(dateformat(rows[0].findt))
              : null,
            finexpdt: isValidDate(rows[0].finexpdt)
              ? new Date(dateformat(rows[0].finexpdt))
              : null,
            is_finished: rows[0].is_finished,
            midchkdt: isValidDate(rows[0].midchkdt)
              ? new Date(dateformat(rows[0].midchkdt))
              : null,
            number: rows[0].number,
            ordnum: rows[0].ordnum,
            pgmdiv: rows[0].pgmdiv,
            pjtmanager: {
              user_id: rows[0].pjtmanager,
              user_name: pjtmanager == undefined ? "" : pjtmanager.user_name,
            },
            pjtperson: {
              user_id: rows[0].pjtperson,
              user_name: pjtperson == undefined ? "" : pjtperson.user_name,
            },
            progress_status:
              rows[0].progress_status == "Y"
                ? true
                : rows[0].progress_status == "N"
                ? false
                : rows[0].progress_status,
            project: rows[0].project,
            recdt: isValidDate(rows[0].recdt)
              ? new Date(dateformat(rows[0].recdt))
              : null,
            remark: rows[0].remark,
            revperson: rows[0].revperson,
          });
          setSubFilters((prev) => ({
            ...prev,
            devmngnum: rows[0].devmngnum,
            isSearch: true,
            pgNum: 1,
          }));
          setSubFilters2((prev) => ({
            ...prev,
            devmngnum: rows[0].devmngnum,
            isSearch: true,
            pgNum: 1,
          }));
          setWorkType("U");
        }
      } else {
        const pjtperson: any = usersData.find(
          (item: any) => item.user_id == userId
        );
        setInformation({
          attdatnum: "",
          attdatnum_exists: "N",
          compl_chk_date: null,
          cotracdt: null,
          custcd: "",
          custnm: { custcd: "", custnm: "" },
          devmngnum: "",
          estnum: "",
          files: "",
          finchkdt: null,
          findt: null,
          finexpdt: null,
          is_finished: "N",
          midchkdt: null,
          number: 0,
          ordnum: "",
          pgmdiv: "",
          pjtmanager: { user_id: "", user_name: "" },
          pjtperson: {
            user_id: userId,
            user_name: pjtperson == undefined ? "" : pjtperson.user_name,
          },
          progress_status: false,
          project: "",
          recdt: new Date(),
          remark: "",
          revperson: "",
        });
        const newDataState = processWithGroups([], group);
        setSubDataResult(newDataState);
        setSubDataResult2((prev) => {
          return {
            data: [],
            total: 0,
          };
        });
        setWorkType("N");
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
  const fetchSubGrid = async (subfilters: any) => {
    let data: any;
    setLoading(true);
    const status =
      filters.status.length === 0
        ? "Y|N" // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : "Y|N"; //  2개 이상 선택시 => 전체
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_project_master",
      pageNumber: subfilters.pgNum,
      pageSize: subfilters.pgSize,
      parameters: {
        "@p_work_type": subfilters.workType,
        "@p_date_type": filters.date_type.code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": "",
        "@p_pjt_person":
          filters.pjt_person != null ? filters.pjt_person.user_id : "",
        "@p_status": status,
        "@p_project": filters.project,
        "@p_progress_status": filters.progress_status.code,
        "@p_devmngnum": subfilters.devmngnum,
        "@p_code": "",
        "@p_name": "",
        "@p_type": "",
        "@p_service_id": "",
        // "@p_find_row_value": filters.find_row_value,
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
          groupId: row.module + "module",
          group_menu_name: row.module,
          idx: idx++,
        };
      });

      if (subfilters.findRowValue !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef2.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row[SUB_DATA_ITEM_KEY] == subfilters.findRowValue
          );
          targetRowIndex2 = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef2.current) {
          targetRowIndex2 = 0;
        }
      }

      if (subfilters.workType == "main_schedule") {
        setSubDataResult2((prev) => {
          return {
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          };
        });
      } else {
        const newDataState = processWithGroups(rows, group);
        setSubDataTotal(totalRowCnt);
        setSubDataResult(newDataState);
      }

      if (totalRowCnt > 0) {
        if (subfilters.workType == "main_schedule") {
          const selectedRow2 =
            subfilters.find_row_value == ""
              ? rows[0]
              : rows.find(
                  (row: any) =>
                    row[SUB_DATA_ITEM_KEY2] == subfilters.find_row_value
                );
          if (selectedRow2 != undefined) {
            setSelectedsubDataState2({
              [selectedRow2[SUB_DATA_ITEM_KEY2]]: true,
            });
          } else {
            setSelectedsubDataState2({ [rows[0][SUB_DATA_ITEM_KEY2]]: true });
          }
        } else {
          const selectedRow =
            subfilters.find_row_value == ""
              ? rows[0]
              : rows.find(
                  (row: any) =>
                    row[SUB_DATA_ITEM_KEY] == subfilters.find_row_value
                );
          if (selectedRow != undefined) {
            setSelectedsubDataState({ [selectedRow[SUB_DATA_ITEM_KEY]]: true });
          } else {
            setSelectedsubDataState({ [rows[0][SUB_DATA_ITEM_KEY]]: true });
          }
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    if (subfilters.workType == "main_schedule") {
      // 필터 isSearch false처리, pgNum 세팅
      setSubFilters((prev) => ({
        ...prev,
        pgNum:
          data && data.hasOwnProperty("pageNumber")
            ? data.pageNumber
            : prev.pgNum,
        isSearch: false,
      }));
    } else {
      setSubFilters2((prev) => ({
        ...prev,
        pgNum:
          data && data.hasOwnProperty("pageNumber")
            ? data.pageNumber
            : prev.pgNum,
        isSearch: false,
      }));
    }
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

  useEffect(() => {
    if (subFilters2.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(subFilters2);
      setSubFilters2((prev) => ({
        ...prev,
        find_row_value: "",
        isSearch: false,
      })); // 한번만 조회되도록
      fetchSubGrid(deepCopiedFilters);
    }
  }, [subFilters2]);

  const [dateTypeData, setDateTypeData] = useState<any[]>([]);
  const [progressStatusData, setProgressStateData] = useState<any[]>([]);
  const [StatusData, setStateData] = useState<any[]>([]);
  const [custListData, setCustListData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [devdivItems, setDevdivItems] = useState([]);
  const [valuecodeItems, setValuecodeItems] = useState([]);
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

  const fetchDateType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(datetypeQueryStr));

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
      setDateTypeData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchProgressstatus = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(progressstatusQueryStr));

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
      setProgressStateData(rows);
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

  const fetchCust = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(custQueryStr));

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
      setCustListData(rows);
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

  const fetchDevdiv = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(devdivQueryStr));

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
      setDevdivItems(rows);
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

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchDateType();
    fetchProgressstatus();
    fetchstatus();
    fetchCust();
    fetchUsers();
    fetchDevdiv();
    fetchValueCode();
    setTitle("프로젝트 마스터");
  }, []);

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onSubSortChange2 = (e: any) => {
    setSubDataState2((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };
  const onSubDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setSubDataState2(event.dataState);
  };

  const onRowDoubleClick = (event: GridRowDoubleClickEvent) => {
    const selectedRowData = event.dataItem;
    setSelectedState({ [selectedRowData[DATA_ITEM_KEY]]: true });

    setAllTabSelected(1);

    setSubFilters2((prev) => ({
      ...prev,
      workType: "main_schedule",
      devmngnum: selectedRowData.devmngnum,
      pgNum: 1,
      isSearch: true,
    }));

    const pjtmanager: any = usersData.find(
      (item: any) => item.user_name == selectedRowData.pjtmanager
    );

    const pjtperson: any = usersData.find(
      (item: any) => item.user_name == selectedRowData.pjtperson
    );
    setInformation({
      attdatnum: selectedRowData.attdatnum,
      attdatnum_exists: selectedRowData.attdatnum_exists,
      compl_chk_date: isValidDate(selectedRowData.compl_chk_date)
        ? new Date(dateformat(selectedRowData.compl_chk_date))
        : null,
      cotracdt: isValidDate(selectedRowData.cotracdt)
        ? new Date(dateformat(selectedRowData.cotracdt))
        : null,
      custcd: selectedRowData.custcd,
      custnm: {
        custcd: selectedRowData.custcd,
        custnm: selectedRowData.custnm,
      },
      devmngnum: selectedRowData.devmngnum,
      estnum: selectedRowData.estnum,
      files: selectedRowData.files,
      finchkdt: isValidDate(selectedRowData.finchkdt)
        ? new Date(dateformat(selectedRowData.finchkdt))
        : null,
      findt: isValidDate(selectedRowData.findt)
        ? new Date(dateformat(selectedRowData.findt))
        : null,
      finexpdt: isValidDate(selectedRowData.finexpdt)
        ? new Date(dateformat(selectedRowData.finexpdt))
        : null,
      is_finished: selectedRowData.is_finished,
      midchkdt: isValidDate(selectedRowData.midchkdt)
        ? new Date(dateformat(selectedRowData.midchkdt))
        : null,
      number: selectedRowData.number,
      ordnum: selectedRowData.ordnum,
      pgmdiv: selectedRowData.pgmdiv,
      pjtmanager: {
        user_id: pjtmanager == undefined ? "" : pjtmanager.user_id,
        user_name: selectedRowData.pjtmanager,
      },
      pjtperson: {
        user_id: pjtperson == undefined ? "" : pjtperson.user_id,
        user_name: selectedRowData.pjtperson,
      },
      progress_status:
        selectedRowData.progress_status == "Y"
          ? true
          : selectedRowData.progress_status == "N"
          ? false
          : selectedRowData.progress_status,
      project: selectedRowData.project,
      recdt: isValidDate(selectedRowData.recdt)
        ? new Date(dateformat(selectedRowData.recdt))
        : null,
      remark: selectedRowData.remark,
      revperson: selectedRowData.revperson,
    });

    const selectedRowData2 = mainDataResult.data.filter(
      (item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    setSubFilters((prev) => ({
      ...prev,
      workType: "detail",
      devmngnum: selectedRowData2.devmngnum,
      pgNum: 1,
      isSearch: true,
    }));
    deletedRows = [];

    setWorkType("U");
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    setFileList([]);
    setSavenmList([]);
    setWorkType("U");
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

  const onSubSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState2,
      dataItemKey: SUB_DATA_ITEM_KEY2,
    });
    setSelectedsubDataState2(newSelectedState);
  };

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult, AlltabSelected]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex2 !== null && gridRef2.current) {
      gridRef2.current.scrollIntoView({ rowIndex: targetRowIndex2 });
      targetRowIndex2 = null;
    }
  }, [subDataResult]);

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
  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataTotal.toString().split(".");
    return (
      <td
        colSpan={props.colSpan}
        className={"k-grid-footer-sticky"}
        style={props.style}
        {...{ [GRID_COL_INDEX_ATTRIBUTE]: 1 }}
      >
        총
        {subDataTotal == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const subTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = subDataResult2.total.toString().split(".");
    return (
      <td
        colSpan={props.colSpan}
        className={"k-grid-footer-sticky"}
        style={props.style}
        {...{ [GRID_COL_INDEX_ATTRIBUTE]: 1 }}
      >
        총
        {subDataResult2.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
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

  const Add = () => {
    const pjtperson: any = usersData.find(
      (item: any) => item.user_id == userId
    );
    setInformation({
      attdatnum: "",
      attdatnum_exists: "N",
      compl_chk_date: null,
      cotracdt: null,
      custcd: "",
      custnm: { custcd: "", custnm: "" },
      devmngnum: "",
      estnum: "",
      files: "",
      finchkdt: null,
      findt: null,
      finexpdt: null,
      is_finished: "N",
      midchkdt: null,
      number: 0,
      ordnum: "",
      pgmdiv: "",
      pjtmanager: { user_id: "", user_name: "" },
      pjtperson: {
        user_id: userId,
        user_name: pjtperson == undefined ? "" : pjtperson.user_name,
      },
      progress_status: false,
      project: "",
      recdt: new Date(),
      remark: "",
      revperson: "",
    });
    setSubDataTotal(0);
    const newDataState = processWithGroups([], group);
    setSubDataResult(newDataState);
    setSubDataResult2({
      data: [],
      total: 0,
    });
    setWorkType("N");
    setAllTabSelected(1);
  };

  const newData = setExpandedState({
    data: subDataResult,
    collapsedIds: collapsedState,
  });

  const onExpandChange = React.useCallback(
    (event: GridExpandChangeEvent) => {
      const item = event.dataItem;

      if (item.groupId) {
        const collapsedIds = !event.value
          ? [...collapsedState, item.groupId]
          : collapsedState.filter((groupId) => groupId != item.groupId);
        setCollapsedState(collapsedIds);
      }
    },
    [collapsedState]
  );

  const Delete = () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }
    if (mainDataResult.data.length == 0) {
      alert("데이터가 없습니다");
    } else {
      const data = mainDataResult.data.filter(
        (item) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      )[0];

      setParaDataDeleted((prev) => ({
        ...prev,
        work_type: "D",
        devmngnum: data.devmngnum,
      }));
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

  const Save = async () => {
    type TRowsArr = {
      row_status: string[];
      devmngseq_s: string[];
      pgmid_s: string[];
      pgmnm_s: string[];
      value_code3: string[];
      devdiv_s: string[];
      prgrate_s: string[];
      listyn_s: string[];
      lvl_s: string[];
      modrate_s: string[];
      fnscore_s: string[];
      exptime_s: string[];

      devperson_s: string[];
      devstrdt_s: string[];
      finexpdt_s: string[];
      findt_s: string[];
      chkperson_s: string[];
      chkdt_s: string[];
      finamt_s: string[];
      discscore_s: string[];
      remark_s: string[];
      useyn_s: string[];

      DesignEstTime_s: string[];
      DesignExphh_s: string[];
      DesignExpmm_s: string[];
      DesignStartDate_s: string[];
      DesignEndEstDate_s: string[];
      DesignEndDate_s: string[];
      CustCheckDate_s: string[];
      CustSignyn_s: string[];
      indicator_s: string[];
      CustPerson_s: string[];

      guid: string[];
      sort_order: string[];
      date: string[];
      title: string[];
      finyn: string[];
      is_monitoring: string[];
    };

    let rowsArr: TRowsArr = {
      row_status: [],
      devmngseq_s: [],
      pgmid_s: [],
      pgmnm_s: [],
      value_code3: [],
      devdiv_s: [],
      prgrate_s: [],
      listyn_s: [],
      lvl_s: [],
      modrate_s: [],
      fnscore_s: [],
      exptime_s: [],

      devperson_s: [],
      devstrdt_s: [],
      finexpdt_s: [],
      findt_s: [],
      chkperson_s: [],
      chkdt_s: [],
      finamt_s: [],
      discscore_s: [],
      remark_s: [],
      useyn_s: [],

      DesignEstTime_s: [],
      DesignExphh_s: [],
      DesignExpmm_s: [],
      DesignStartDate_s: [],
      DesignEndEstDate_s: [],
      DesignEndDate_s: [],
      CustCheckDate_s: [],
      CustSignyn_s: [],
      indicator_s: [],
      CustPerson_s: [],

      guid: [],
      sort_order: [],
      date: [],
      title: [],
      finyn: [],
      is_monitoring: [],
    };

    if (
      parseDate(convertDateToStr(information.recdt)) == "" ||
      information.custnm == "" ||
      information.pjtmanager == "" ||
      information.pjtperson == "" ||
      parseDate(convertDateToStr(information.cotracdt)) == "" ||
      parseDate(convertDateToStr(information.finexpdt)) == ""
    ) {
      alert("필수항목을 채워주세요.");
    } else {
      let dataItem: any[] = [];
      subDataResult.map((items) => {
        items.items.forEach((item: any, index: number) => {
          if (
            (item.rowstatus === "N" || item.rowstatus === "U") &&
            item.rowstatus !== undefined
          ) {
            dataItem.push(item);
          }
        });
      });

      dataItem.forEach((item: any) => {
        const {
          rowstatus,
          devmngseq,
          pgmid,
          pgmnm,
          value_code3,
          devdiv,
          prgrate,
          listyn,
          lvl,
          modrate,
          fnscore,
          exptime,
          devperson,
          devstrdt,
          finexpdt,
          findt,
          chkperson,
          chkdt,
          finamt,
          discscore,
          remark,
          useyn,
          DesignEstTime,
          DesignExphh,
          DesignExpmm,
          DesignStartDate,
          DesignEndEstDate,
          DesignEndDate,
          CustCheckDate,
          CustSignyn,
          indicator,
          CustPerson,
        } = item;

        rowsArr.row_status.push(rowstatus);
        rowsArr.devmngseq_s.push(devmngseq);
        rowsArr.pgmid_s.push(pgmid);
        rowsArr.pgmnm_s.push(pgmnm);
        rowsArr.value_code3.push(value_code3);
        rowsArr.devdiv_s.push(devdiv);
        rowsArr.prgrate_s.push(prgrate);
        rowsArr.listyn_s.push(listyn);
        rowsArr.lvl_s.push(lvl);
        rowsArr.modrate_s.push(modrate);
        rowsArr.fnscore_s.push(fnscore);
        rowsArr.exptime_s.push(exptime);

        rowsArr.devperson_s.push(devperson);
        rowsArr.devstrdt_s.push(
          devstrdt.length > 8 ? devstrdt : convertDateToStr(devstrdt)
        );
        rowsArr.finexpdt_s.push(
          finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt)
        );
        rowsArr.findt_s.push(
          findt.length > 8 ? findt : convertDateToStr(findt)
        );
        rowsArr.chkperson_s.push(chkperson);
        rowsArr.chkdt_s.push(
          chkdt.length > 8 ? chkdt : convertDateToStr(chkdt)
        );
        rowsArr.finamt_s.push(finamt);
        rowsArr.discscore_s.push(discscore);
        rowsArr.remark_s.push(remark);
        rowsArr.useyn_s.push(
          useyn == true ? "Y" : useyn == false ? "N" : useyn
        );

        rowsArr.DesignEstTime_s.push(
          DesignEstTime.length > 8
            ? DesignEstTime
            : convertDateToStr(DesignEstTime)
        );
        rowsArr.DesignExphh_s.push(DesignExphh);
        rowsArr.DesignExpmm_s.push(DesignExpmm);
        rowsArr.DesignStartDate_s.push(
          DesignStartDate.length > 8
            ? DesignStartDate
            : convertDateToStr(DesignStartDate)
        );
        rowsArr.DesignEndEstDate_s.push(
          DesignEndEstDate.length > 8
            ? DesignEndEstDate
            : convertDateToStr(DesignEndEstDate)
        );
        rowsArr.DesignEndDate_s.push(
          DesignEndDate.length > 8
            ? DesignEndDate
            : convertDateToStr(DesignEndDate)
        );
        rowsArr.CustCheckDate_s.push(
          CustCheckDate.length > 8
            ? CustCheckDate
            : convertDateToStr(CustCheckDate)
        );
        rowsArr.CustSignyn_s.push(
          CustSignyn == true ? "Y" : CustSignyn == false ? "N" : CustSignyn
        );
        rowsArr.indicator_s.push(indicator);
        rowsArr.CustPerson_s.push(CustPerson);

        rowsArr.guid.push("");
        rowsArr.sort_order.push("");
        rowsArr.date.push("");
        rowsArr.title.push("");
        rowsArr.finyn.push("");
        rowsArr.is_monitoring.push("");
      });

      deletedRows.forEach((item: any) => {
        const {
          rowstatus,
          devmngseq,
          pgmid,
          pgmnm,
          value_code3,
          devdiv,
          prgrate,
          listyn,
          lvl,
          modrate,
          fnscore,
          exptime,
          devperson,
          devstrdt,
          finexpdt,
          findt,
          chkperson,
          chkdt,
          finamt,
          discscore,
          remark,
          useyn,
          DesignEstTime,
          DesignExphh,
          DesignExpmm,
          DesignStartDate,
          DesignEndEstDate,
          DesignEndDate,
          CustCheckDate,
          CustSignyn,
          indicator,
          CustPerson,
        } = item;

        rowsArr.row_status.push(rowstatus);
        rowsArr.devmngseq_s.push(devmngseq);
        rowsArr.pgmid_s.push(pgmid);
        rowsArr.pgmnm_s.push(pgmnm);
        rowsArr.value_code3.push(value_code3);
        rowsArr.devdiv_s.push(devdiv);
        rowsArr.prgrate_s.push(prgrate);
        rowsArr.listyn_s.push(listyn);
        rowsArr.lvl_s.push(lvl);
        rowsArr.modrate_s.push(modrate);
        rowsArr.fnscore_s.push(fnscore);
        rowsArr.exptime_s.push(exptime);

        rowsArr.devperson_s.push(devperson);
        rowsArr.devstrdt_s.push(
          devstrdt.length > 8 ? devstrdt : convertDateToStr(devstrdt)
        );
        rowsArr.finexpdt_s.push(
          finexpdt.length > 8 ? finexpdt : convertDateToStr(finexpdt)
        );
        rowsArr.findt_s.push(
          findt.length > 8 ? findt : convertDateToStr(findt)
        );
        rowsArr.chkperson_s.push(chkperson);
        rowsArr.chkdt_s.push(
          chkdt.length > 8 ? chkdt : convertDateToStr(chkdt)
        );
        rowsArr.finamt_s.push(finamt);
        rowsArr.discscore_s.push(discscore);
        rowsArr.remark_s.push(remark);
        rowsArr.useyn_s.push(
          useyn == true ? "Y" : useyn == false ? "N" : useyn
        );

        rowsArr.DesignEstTime_s.push(
          DesignEstTime.length > 8
            ? DesignEstTime
            : convertDateToStr(DesignEstTime)
        );
        rowsArr.DesignExphh_s.push(DesignExphh);
        rowsArr.DesignExpmm_s.push(DesignExpmm);
        rowsArr.DesignStartDate_s.push(
          DesignStartDate.length > 8
            ? DesignStartDate
            : convertDateToStr(DesignStartDate)
        );
        rowsArr.DesignEndEstDate_s.push(
          DesignEndEstDate.length > 8
            ? DesignEndEstDate
            : convertDateToStr(DesignEndEstDate)
        );
        rowsArr.DesignEndDate_s.push(
          DesignEndDate.length > 8
            ? DesignEndDate
            : convertDateToStr(DesignEndDate)
        );
        rowsArr.CustCheckDate_s.push(
          CustCheckDate.length > 8
            ? CustCheckDate
            : convertDateToStr(CustCheckDate)
        );
        rowsArr.CustSignyn_s.push(
          CustSignyn == true ? "Y" : CustSignyn == false ? "N" : CustSignyn
        );
        rowsArr.indicator_s.push(indicator);
        rowsArr.CustPerson_s.push(CustPerson);

        rowsArr.guid.push("");
        rowsArr.sort_order.push("");
        rowsArr.date.push("");
        rowsArr.title.push("");
        rowsArr.finyn.push("");
        rowsArr.is_monitoring.push("");
      });

      let valid = true;
      subDataResult2.data.map((item: any) => {
        if (
          (item.title == "" || parseDate(convertDateToStr(item.date)) == "") &&
          valid == true
        ) {
          valid = false;
          alert("필수값을 입력해주세요.");
        }
      });

      if (valid == true) {
        subDataResult2.data.forEach((item: any) => {
          const {
            rowstatus,
            date,
            finyn,
            guid,
            is_monitoring,
            sort_order,
            title,
          } = item;

          rowsArr.row_status.push(rowstatus);
          rowsArr.devmngseq_s.push("");
          rowsArr.pgmid_s.push("");
          rowsArr.pgmnm_s.push("");
          rowsArr.value_code3.push("");
          rowsArr.devdiv_s.push("");
          rowsArr.prgrate_s.push("");
          rowsArr.listyn_s.push("");
          rowsArr.lvl_s.push("");
          rowsArr.modrate_s.push("");
          rowsArr.fnscore_s.push("");
          rowsArr.exptime_s.push("");

          rowsArr.devperson_s.push("");
          rowsArr.devstrdt_s.push("");
          rowsArr.finexpdt_s.push("");
          rowsArr.findt_s.push("");
          rowsArr.chkperson_s.push("");
          rowsArr.chkdt_s.push("");
          rowsArr.finamt_s.push("");
          rowsArr.discscore_s.push("");
          rowsArr.remark_s.push("");
          rowsArr.useyn_s.push("");

          rowsArr.DesignEstTime_s.push("");
          rowsArr.DesignExphh_s.push("");
          rowsArr.DesignExpmm_s.push("");
          rowsArr.DesignStartDate_s.push("");
          rowsArr.DesignEndEstDate_s.push("");
          rowsArr.DesignEndDate_s.push("");
          rowsArr.CustCheckDate_s.push("");
          rowsArr.CustSignyn_s.push("");
          rowsArr.indicator_s.push("");
          rowsArr.CustPerson_s.push("");

          rowsArr.guid.push(guid);
          rowsArr.sort_order.push(sort_order);
          rowsArr.date.push(date.length > 8 ? date : convertDateToStr(date));
          rowsArr.title.push(title);
          rowsArr.finyn.push(
            finyn == true ? "Y" : finyn == false ? "N" : finyn
          );
          rowsArr.is_monitoring.push(
            is_monitoring == true
              ? "Y"
              : is_monitoring == false
              ? "N"
              : is_monitoring
          );
        });

        let newAttachmentNumber = "";
        const promises = [];

        for (const file of fileList) {
          // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
          if (information.attdatnum == "" && newAttachmentNumber == "") {
            newAttachmentNumber = await uploadFile(
              file,
              "project",
              information.attdatnum
            );
            const promise = newAttachmentNumber;
            promises.push(promise);
            continue;
          }

          const promise = newAttachmentNumber
            ? await uploadFile(
                file,
                "project",
                information.attdatnum,
                newAttachmentNumber
              )
            : await uploadFile(file, "project", information.attdatnum);
          promises.push(promise);
        }

        const results = await Promise.all(promises);

        // 실패한 파일이 있는지 확인
        if (results.includes(null)) {
          alert("파일 업로드에 실패했습니다.");
        } else {
          setInformation((prev) => ({
            ...prev,
            attdatnum: results[0],
          }));
        }

        let data: any;
        let type = "project";
        savenmList.map(async (parameter: any) => {
          try {
            data = await processApi<any>("file-delete", {
              type,
              attached: parameter,
            });
          } catch (error) {
            data = null;
          }
        });

        setParaData({
          work_type: workType,
          devmngnum: information.devmngnum,
          custcd: information.custcd,
          number: information.number,
          project: information.project,
          recdt:
            information.recdt == null
              ? ""
              : convertDateToStr(information.recdt),
          cotracdt:
            information.cotracdt == null
              ? ""
              : convertDateToStr(information.cotracdt),
          finexpdt:
            information.finexpdt == null
              ? ""
              : convertDateToStr(information.finexpdt),
          compl_chk_date:
            information.compl_chk_date == null
              ? ""
              : convertDateToStr(information.compl_chk_date),
          findt:
            information.findt == null
              ? ""
              : convertDateToStr(information.findt),
          pjtmanager:
            information.pjtmanager == "" ? "" : information.pjtmanager.user_id,
          pjtperson:
            information.pjtperson == "" ? "" : information.pjtperson.user_id,
          remark: information.remark,
          attdatnum: results[0] == undefined ? information.attdatnum : results[0],
          midchkdt:
            information.midchkdt == null
              ? ""
              : convertDateToStr(information.midchkdt),
          finchkdt:
            information.finchkdt == null
              ? ""
              : convertDateToStr(information.finchkdt),
          progress_status:
            information.progress_status == true
              ? "Y"
              : information.progress_status == false
              ? "N"
              : information.progress_status,
          revperson: information.revperson,

          row_status: rowsArr.row_status.join("|"),
          devmngseq_s: rowsArr.devmngseq_s.join("|"),
          pgmid_s: rowsArr.pgmid_s.join("|"),
          pgmnm_s: rowsArr.pgmnm_s.join("|"),
          value_code3: rowsArr.value_code3.join("|"),
          devdiv_s: rowsArr.devdiv_s.join("|"),
          prgrate_s: rowsArr.prgrate_s.join("|"),
          listyn_s: rowsArr.listyn_s.join("|"),
          lvl_s: rowsArr.lvl_s.join("|"),
          modrate_s: rowsArr.modrate_s.join("|"),
          fnscore_s: rowsArr.fnscore_s.join("|"),
          exptime_s: rowsArr.exptime_s.join("|"),

          devperson_s: rowsArr.devperson_s.join("|"),
          devstrdt_s: rowsArr.devstrdt_s.join("|"),
          finexpdt_s: rowsArr.finexpdt_s.join("|"),
          findt_s: rowsArr.findt_s.join("|"),
          chkperson_s: rowsArr.chkperson_s.join("|"),
          chkdt_s: rowsArr.chkdt_s.join("|"),
          finamt_s: rowsArr.finamt_s.join("|"),
          discscore_s: rowsArr.discscore_s.join("|"),
          remark_s: rowsArr.remark_s.join("|"),
          useyn_s: rowsArr.useyn_s.join("|"),

          DesignEstTime_s: rowsArr.DesignEstTime_s.join("|"),
          DesignExphh_s: rowsArr.DesignExphh_s.join("|"),
          DesignExpmm_s: rowsArr.DesignExpmm_s.join("|"),
          DesignStartDate_s: rowsArr.DesignStartDate_s.join("|"),
          DesignEndEstDate_s: rowsArr.DesignEndEstDate_s.join("|"),
          DesignEndDate_s: rowsArr.DesignEndDate_s.join("|"),
          CustCheckDate_s: rowsArr.CustCheckDate_s.join("|"),
          CustSignyn_s: rowsArr.CustSignyn_s.join("|"),
          indicator_s: rowsArr.indicator_s.join("|"),
          CustPerson_s: rowsArr.CustPerson_s.join("|"),

          guid: rowsArr.guid.join("|"),
          sort_order: rowsArr.sort_order.join("|"),
          date: rowsArr.date.join("|"),
          title: rowsArr.title.join("|"),
          finyn: rowsArr.finyn.join("|"),
          is_monitoring: rowsArr.is_monitoring.join("|"),
        });
      }
    }
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    devmngnum: "",
    custcd: "",
    number: "",
    project: "",
    recdt: "",
    cotracdt: "",
    finexpdt: "",
    compl_chk_date: "",
    findt: "",
    pjtmanager: "",
    pjtperson: "",
    remark: "",
    attdatnum: "",
    midchkdt: "",
    finchkdt: "",
    progress_status: "",
    revperson: "",

    row_status: "",
    devmngseq_s: "",
    pgmid_s: "",
    pgmnm_s: "",
    value_code3: "",
    devdiv_s: "",
    prgrate_s: "",
    listyn_s: "",
    lvl_s: "",
    modrate_s: "",
    fnscore_s: "",
    exptime_s: "",

    devperson_s: "",
    devstrdt_s: "",
    finexpdt_s: "",
    findt_s: "",
    chkperson_s: "",
    chkdt_s: "",
    finamt_s: "",
    discscore_s: "",
    remark_s: "",
    useyn_s: "",

    DesignEstTime_s: "",
    DesignExphh_s: "",
    DesignExpmm_s: "",
    DesignStartDate_s: "",
    DesignEndEstDate_s: "",
    DesignEndDate_s: "",
    CustCheckDate_s: "",
    CustSignyn_s: "",
    indicator_s: "",
    CustPerson_s: "",

    guid: "",
    sort_order: "",
    date: "",
    title: "",
    finyn: "",
    is_monitoring: "",
  });

  //추가, 수정 프로시저 파라미터
  const para: Iparameters = {
    procedureName: "pw6_sav_project_master",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_devmngnum": paraData.devmngnum,
      "@p_custcd": paraData.custcd,
      "@p_number": paraData.number,
      "@p_project": paraData.project,
      "@p_recdt": paraData.recdt,
      "@p_cotracdt": paraData.cotracdt,
      "@p_finexpdt": paraData.finexpdt,
      "@p_compl_chk_date": paraData.compl_chk_date,
      "@p_findt": paraData.findt,
      "@p_pjtmanager": paraData.pjtmanager,
      "@p_pjtperson": paraData.pjtperson,
      "@p_remark": paraData.remark,
      "@p_attdatnum": paraData.attdatnum,
      "@p_midchkdt": paraData.midchkdt,
      "@p_finchkdt": paraData.finchkdt,
      "@p_progress_status": paraData.progress_status,
      "@p_revperson": paraData.revperson,

      "@p_row_status": paraData.row_status,
      "@p_devmngseq_s": paraData.devmngseq_s,
      "@p_pgmid_s": paraData.pgmid_s,
      "@p_pgmnm_s": paraData.pgmnm_s,
      "@p_value_code3_s": paraData.value_code3,
      "@p_devdiv_s": paraData.devdiv_s,
      "@p_prgrate_s": paraData.prgrate_s,
      "@p_listyn_s": paraData.listyn_s,
      "@p_lvl_s": paraData.lvl_s,
      "@p_modrate_s": paraData.modrate_s,
      "@p_fnscore_s": paraData.fnscore_s,
      "@p_exptime_s": paraData.exptime_s,

      "@p_devperson_s": paraData.devperson_s,
      "@p_devstrdt_s": paraData.devstrdt_s,
      "@p_finexpdt_s": paraData.finexpdt_s,
      "@p_findt_s": paraData.findt_s,
      "@p_chkperson_s": paraData.chkperson_s,
      "@p_chkdt_s": paraData.chkdt_s,
      "@p_finamt_s": paraData.finamt_s,
      "@p_discscore_s": paraData.discscore_s,
      "@p_remark_s": paraData.remark_s,
      "@p_useyn_s": paraData.useyn_s,

      "@p_DesignEstTime_s": paraData.DesignEstTime_s,
      "@p_DesignExphh_s": paraData.DesignExphh_s,
      "@p_DesignExpmm_s": paraData.DesignExpmm_s,
      "@p_DesignStartDate_s": paraData.DesignStartDate_s,
      "@p_DesignEndEstDate_s": paraData.DesignEndEstDate_s,
      "@p_DesignEndDate_s": paraData.DesignEndDate_s,
      "@p_CustCheckDate_s": paraData.CustCheckDate_s,
      "@p_CustSignyn_s": paraData.CustSignyn_s,
      "@p_indicator_s": paraData.indicator_s,
      "@p_CustPerson_s": paraData.CustPerson_s,

      /* CR508T */
      "@p_guid": paraData.guid,
      "@p_sort_order": paraData.sort_order,
      "@p_date": paraData.date,
      "@p_title": paraData.title,
      "@p_finyn": paraData.finyn,
      "@p_is_monitoring": paraData.is_monitoring,

      "@p_id": userId,
      "@p_pc": pc,

      "@p_sub_code": "",
      "@p_sub_code_name": "",
      "@p_sub_use_yn": "",
      "@p_sub_memo": "",
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    devmngnum: "",
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "pw6_sav_project_master",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_devmngnum": paraDataDeleted.devmngnum,
      "@p_custcd": "",
      "@p_number": 0,
      "@p_project": "",
      "@p_recdt": "",
      "@p_cotracdt": "",
      "@p_finexpdt": "",
      "@p_compl_chk_date": "",
      "@p_findt": "",
      "@p_pjtmanager": "",
      "@p_pjtperson": "",
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_midchkdt": "",
      "@p_finchkdt": "",
      "@p_progress_status": "",
      "@p_revperson": "",

      "@p_row_status": "",
      "@p_devmngseq_s": "",
      "@p_pgmid_s": "",
      "@p_pgmnm_s": "",
      "@p_value_code3_s": "",
      "@p_devdiv_s": "",
      "@p_prgrate_s": "",
      "@p_listyn_s": "",
      "@p_lvl_s": "",
      "@p_modrate_s": "",
      "@p_fnscore_s": "",
      "@p_exptime_s": "",

      "@p_devperson_s": "",
      "@p_devstrdt_s": "",
      "@p_finexpdt_s": "",
      "@p_findt_s": "",
      "@p_chkperson_s": "",
      "@p_chkdt_s": "",
      "@p_finamt_s": "",
      "@p_discscore_s": "",
      "@p_remark_s": "",
      "@p_useyn_s": "",

      "@p_DesignEstTime_s": "",
      "@p_DesignExphh_s": "",
      "@p_DesignExpmm_s": "",
      "@p_DesignStartDate_s": "",
      "@p_DesignEndEstDate_s": "",
      "@p_DesignEndDate_s": "",
      "@p_CustCheckDate_s": "",
      "@p_CustSignyn_s": "",
      "@p_indicator_s": "",
      "@p_CustPerson_s": "",

      /* CR508T */
      "@p_guid": "",
      "@p_sort_order": "",
      "@p_date": "",
      "@p_title": "",
      "@p_finyn": "",
      "@p_is_monitoring": "",

      "@p_id": userId,
      "@p_pc": pc,

      "@p_sub_code": "",
      "@p_sub_code_name": "",
      "@p_sub_use_yn": "",
      "@p_sub_memo": "",
    },
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  useEffect(() => {
    if (paraData.work_type != "") fetchToSave();
  }, [paraData]);

  const fetchToDelete = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraDeleted);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const findRowIndex = mainDataResult.data.findIndex(
        (row: any) =>
          row[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
      );

      if (mainDataResult.data[findRowIndex].attdatnum) {
        let data2: any;
        try {
          data2 = await processApi<any>("attachment-delete", {
            attached:
              "attachment?type=project&attachmentNumber=" +
              mainDataResult.data[findRowIndex].attdatnum +
              "&id=",
          });
        } catch (error) {
          data2 = null;
        }
      }

      if (mainDataResult.data.length === 1 && filters.pgNum == 1) {
        setFileList([]);
        setSavenmList([]);
        setFilters((prev) => ({
          ...prev,
          find_row_value: "",
          pgNum: 1,
          isSearch: true,
        }));
      } else {
        const isLastDataDeleted =
          mainDataResult.data.length === 1 && filters.pgNum > 1;

        setFileList([]);
        setSavenmList([]);
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
      setAllTabSelected(0);
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.devmngnum = "";
  };

  const fetchToSave = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      if (paraData.work_type == "N") {
        setAllTabSelected(0);
      }
      setFileList([]);
      setSavenmList([]);
      deletedRows = [];
      setParaData({
        work_type: "",
        devmngnum: "",
        custcd: "",
        number: "",
        project: "",
        recdt: "",
        cotracdt: "",
        finexpdt: "",
        compl_chk_date: "",
        findt: "",
        pjtmanager: "",
        pjtperson: "",
        remark: "",
        attdatnum: "",
        midchkdt: "",
        finchkdt: "",
        progress_status: "",
        revperson: "",

        row_status: "",
        devmngseq_s: "",
        pgmid_s: "",
        pgmnm_s: "",
        value_code3: "",
        devdiv_s: "",
        prgrate_s: "",
        listyn_s: "",
        lvl_s: "",
        modrate_s: "",
        fnscore_s: "",
        exptime_s: "",

        devperson_s: "",
        devstrdt_s: "",
        finexpdt_s: "",
        findt_s: "",
        chkperson_s: "",
        chkdt_s: "",
        finamt_s: "",
        discscore_s: "",
        remark_s: "",
        useyn_s: "",

        DesignEstTime_s: "",
        DesignExphh_s: "",
        DesignExpmm_s: "",
        DesignStartDate_s: "",
        DesignEndEstDate_s: "",
        DesignEndDate_s: "",
        CustCheckDate_s: "",
        CustSignyn_s: "",
        indicator_s: "",
        CustPerson_s: "",

        guid: "",
        sort_order: "",
        date: "",
        title: "",
        finyn: "",
        is_monitoring: "",
      });
      setFilters((prev) => ({
        ...prev,
        find_row_value: data.returnString,
        isSearch: true,
      }));
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }

    paraData.work_type = "";
  };

  useEffect(() => {
    const pjtmanager: any = usersData.find(
      (item: any) => item.user_id == information.pjtmanager.user_id
    );

    const pjtperson: any = usersData.find(
      (item: any) => item.user_id == information.pjtperson.user_id
    );

    setInformation((prev) => ({
      ...prev,
      pjtmanager: {
        user_id: information.pjtmanager.user_id,
        user_name: pjtmanager == undefined ? "" : pjtmanager.user_name,
      },
      pjtperson: {
        user_id: information.pjtperson.user_id,
        user_name: pjtperson == undefined ? "" : pjtperson.user_name,
      },
    }));
  }, [usersData]);

  const onItemChange = (event: GridItemChangeEvent) => {
    getGroupGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      SUB_DATA_ITEM_KEY
    );
  };

  const onItemChange2 = (event: GridItemChangeEvent) => {
    setSubDataState2((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult2,
      setSubDataResult2,
      SUB_DATA_ITEM_KEY2
    );
  };

  const customCellRender = (td: any, props: any) => (
    <CellRender2
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender = (tr: any, props: any) => (
    <RowRender2
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
    if (field != "rowstatus" && field != "stdscore") {
      const newData = subDataResult.map((items) =>
        items.value == dataItem.group_menu_name
          ? {
              ...items,
              items: items.items.map((item: any) =>
                item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
                  ? {
                      ...item,
                      [EDIT_FIELD]: field,
                    }
                  : {
                      ...item,
                      [EDIT_FIELD]: undefined,
                    }
              ),
            }
          : items
      );
      setSubDataResult(newData);
      setTempResult(newData);
    } else {
      setTempResult(subDataResult);
    }
  };

  const exitEdit = () => {
    if (tempResult != subDataResult) {
      const newData = subDataResult.map((items) => ({
        ...items,
        items: items.items.map((item: any) =>
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
        ),
      }));

      setSubDataResult(newData);
      setTempResult(newData);
    } else {
      const newData = subDataResult.map((items) => ({
        ...items,
        items: items.items.map((item: any) => ({
          ...item,
          [EDIT_FIELD]: undefined,
        })),
      }));

      setSubDataResult(newData);
      setTempResult(newData);
    }
  };

  const enterEdit2 = (dataItem: any, field: string) => {
    if (field != "rowstatus" && field != "user_name") {
      const newData = subDataResult2.data.map((item) =>
        item[SUB_DATA_ITEM_KEY2] === dataItem[SUB_DATA_ITEM_KEY2]
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
      setSubDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      setTempResult2((prev) => {
        return {
          data: subDataResult2.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit2 = () => {
    if (tempResult2.data != subDataResult2.data) {
      const newData = subDataResult2.data.map((item) =>
        item[SUB_DATA_ITEM_KEY2] ==
        Object.getOwnPropertyNames(selectedsubDataState2)[0]
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
      setSubDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = subDataResult2.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setSubDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const onAddClick = () => {
    subDataResult.map((items) => {
      items.items.map((item: any) => {
        if (item[SUB_DATA_ITEM_KEY] > temp) {
          temp = item[SUB_DATA_ITEM_KEY];
        }
      });
    });

    const newDataItem = {
      [SUB_DATA_ITEM_KEY]: ++temp,
      pgmid: "",
      pgmnm: "",
      value_code3: "",
      devdiv: "02",
      prgrate: 0,
      listyn: "A",
      lvl: "B",
      stdscore: 0,
      modrate: 0,
      fnscore: 0,
      exptime: 0,
      devperson: userId,
      devstrdt: new Date(),
      finexpdt: new Date(),
      findt: "",
      chkperson: "",
      chkdt: "",
      finamt: 0,
      discscor: 0,
      remark: "",
      useyn: "Y",
      DesignEstTime: new Date(),
      DesignExphh: 0,
      DesignExpmm: 0,
      DesignStartDate: new Date(),
      DesignEndEstDate: "",
      DesignEndDate: "",
      CustCheckDate: "",
      CustSignyn: "N",
      indicator: userId,
      CustPerson: "",
      rowstatus: "N",
      groupId: "module",
      group_menu_name: "",
    };
    let newData: any[] = [];
    newData.push(newDataItem);
    subDataResult.map((items) => {
      items.items.forEach((item: any, index: number) => {
        newData.push(item);
      });
    });
    setPage((prev) => ({
      ...prev,
      skip: 0,
      take: prev.take + 1,
    }));
    setSubDataTotal(subDataTotal + 1);
    const newDataState = processWithGroups(newData, group);
    setSubDataResult(newDataState);
    setSelectedsubDataState({ [newDataItem[SUB_DATA_ITEM_KEY]]: true });
    setFileList([]);
    setSavenmList([]);
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];
    let Object: any[] = [];
    let Object2: any[] = [];
    let indexs: any[] = [];
    let data: any;
    if (subDataTotal > 0) {
      subDataResult.map((items, index2) => {
        items.items.forEach((item: any, index: number) => {
          if (!selectedsubDataState[item[SUB_DATA_ITEM_KEY]]) {
            newData.push(item);
            Object2.push(index);
          } else {
            const newData2 = {
              ...item,
              rowstatus: "D",
            };
            Object.push(index);
            if (Math.min(...indexs) == index2) {
              indexs.push(100000000000); //최소값안걸리게 셋팅
            } else {
              indexs.push(index2);
            }
            deletedRows.push(newData2);
          }
        });
      });
      const minIndex = indexs.findIndex((item) => item == Math.min(...indexs));
      if (
        Object[minIndex] == 0 &&
        Math.min(...indexs) == 0 &&
        subDataTotal != 1
      ) {
        if (subDataResult[minIndex].items[minIndex + 1] == undefined) {
          data = subDataResult[minIndex + 1].items[minIndex]; //그룹사라져서 다음그룹
        } else {
          data = subDataResult[minIndex].items[minIndex + 1]; //그룹내첫번쨰
        }
      } else if (Object[minIndex] == 0 && subDataTotal != 1) {
        data =
          subDataResult[Math.min(...indexs) - 1].items[
            subDataResult[Math.min(...indexs) - 1].items.length - 1
          ]; //전그룹 마지막
      } else {
        data = subDataResult[indexs[minIndex]].items[Object[minIndex] - 1];
      }
      setSubDataTotal(subDataTotal - Object.length);

      const newDataState = processWithGroups(newData, group);
      setSubDataResult(newDataState);
      setSelectedsubDataState({
        [data != undefined ? data[SUB_DATA_ITEM_KEY] : newData[0]]: true,
      });
    }
  };

  const handleSelectAllTab = (e: any) => {
    if (workType != "N") {
      setFileList([]);
      setSavenmList([]);
      if (e.selected == 0) {
        const selectedRowData = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];

        setFilters((prev) => ({
          ...prev,
          find_row_value:
            selectedRowData != undefined ? selectedRowData[DATA_ITEM_KEY] : "",
          pgNum: 1,
          isSearch: true,
        }));
      } else if (AlltabSelected == 0 && e.selected != 0) {
        const selectedRowData = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];

        setSubFilters2((prev) => ({
          ...prev,
          workType: "main_schedule",
          devmngnum: selectedRowData.devmngnum,
          pgNum: 1,
          isSearch: true,
        }));

        const pjtmanager: any = usersData.find(
          (item: any) => item.user_id == selectedRowData.pjtmanager
        );

        const pjtperson: any = usersData.find(
          (item: any) => item.user_id == selectedRowData.pjtperson
        );
        setInformation({
          attdatnum: selectedRowData.attdatnum,
          attdatnum_exists: selectedRowData.attdatnum_exists,
          compl_chk_date: isValidDate(selectedRowData.compl_chk_date)
            ? new Date(dateformat(selectedRowData.compl_chk_date))
            : null,
          cotracdt: isValidDate(selectedRowData.cotracdt)
            ? new Date(dateformat(selectedRowData.cotracdt))
            : null,
          custcd: selectedRowData.custcd,
          custnm: {
            custcd: selectedRowData.custcd,
            custnm: selectedRowData.custnm,
          },
          devmngnum: selectedRowData.devmngnum,
          estnum: selectedRowData.estnum,
          files: selectedRowData.files,
          finchkdt: isValidDate(selectedRowData.finchkdt)
            ? new Date(dateformat(selectedRowData.finchkdt))
            : null,
          findt: isValidDate(selectedRowData.findt)
            ? new Date(dateformat(selectedRowData.findt))
            : null,
          finexpdt: isValidDate(selectedRowData.finexpdt)
            ? new Date(dateformat(selectedRowData.finexpdt))
            : null,
          is_finished: selectedRowData.is_finished,
          midchkdt: isValidDate(selectedRowData.midchkdt)
            ? new Date(dateformat(selectedRowData.midchkdt))
            : null,
          number: selectedRowData.number,
          ordnum: selectedRowData.ordnum,
          pgmdiv: selectedRowData.pgmdiv,
          pjtmanager: {
            user_id: selectedRowData.pjtmanager,
            user_name: pjtmanager == undefined ? "" : pjtmanager.user_name,
          },
          pjtperson: {
            user_id: selectedRowData.pjtperson,
            user_name: pjtperson == undefined ? "" : pjtperson.user_name,
          },
          progress_status:
            selectedRowData.progress_status == "Y"
              ? true
              : selectedRowData.progress_status == "N"
              ? false
              : selectedRowData.progress_status,
          project: selectedRowData.project,
          recdt: isValidDate(selectedRowData.recdt)
            ? new Date(dateformat(selectedRowData.recdt))
            : null,
          remark: selectedRowData.remark,
          revperson: selectedRowData.revperson,
        });

        const selectedRowData2 = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];

        setSubFilters((prev) => ({
          ...prev,
          workType: "detail",
          devmngnum: selectedRowData2.devmngnum,
          pgNum: 1,
          isSearch: true,
        }));
        deletedRows = [];
      }
    }

    setAllTabSelected(e.selected);
  };

  const onAddClick2 = () => {
    subDataResult2.data.map((item) => {
      if (item[SUB_DATA_ITEM_KEY2] > temp2) {
        temp2 = item[SUB_DATA_ITEM_KEY2];
      }
    });
    const guid = uuidv4();
    const newDataItem = {
      [SUB_DATA_ITEM_KEY2]: ++temp2,
      sort_order: temp2,
      date: new Date(),
      devmngnum: subFilters.devmngnum,
      finyn: "N",
      guid: guid,
      is_monitoring: "Y",
      orgdiv: "01",
      title: "",
      user_name: usersData.find((items: any) => items.user_id == userId)
        ?.user_name,
      rowstatus: "N",
    };

    setSubDataResult2((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
    setSelectedsubDataState2({ [newDataItem[SUB_DATA_ITEM_KEY2]]: true });
  };

  const onRemoveClick2 = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];
    let Object: any[] = [];
    let Object2: any[] = [];
    let data;
    subDataResult2.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState2[item[SUB_DATA_ITEM_KEY2]]) {
        newData.push(item);
        Object2.push(index);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        Object.push(index);
      }
    });

    if (Math.min(...Object) < Math.min(...Object2)) {
      data = subDataResult2.data[Math.min(...Object2)];
    } else {
      data = subDataResult2.data[Math.min(...Object) - 1];
    }

    //newData 생성
    setSubDataResult2((prev) => ({
      data: newData,
      total: prev.total - Object.length,
    }));
    setSelectedsubDataState2({
      [data != undefined ? data[SUB_DATA_ITEM_KEY2] : newData[0]]: true,
    });
  };

  type TDataInfo = {
    DATA_ITEM_KEY: string;
    selectedState: {
      [id: string]: boolean | number[];
    };
    dataResult: DataResult;
    setDataResult: (p: any) => any;
  };

  type TArrowBtnClick = {
    direction: string;
    dataInfo: TDataInfo;
  };

  const onArrowsBtnClick = (para: TArrowBtnClick) => {
    const { direction, dataInfo } = para;
    const { DATA_ITEM_KEY, selectedState, dataResult, setDataResult } =
      dataInfo;
    const selectedField = Object.getOwnPropertyNames(selectedState)[0];

    const rowData = dataResult.data.find(
      (row) => row[DATA_ITEM_KEY] == selectedField
    );

    const rowIndex = dataResult.data.findIndex(
      (row) => row[DATA_ITEM_KEY] == selectedField
    );

    if (rowIndex === -1) {
      alert("이동시킬 행을 선택해주세요.");
      return false;
    }
    if (direction === "UP") {
      if (rowIndex != 0) {
        const newData = dataResult.data.map((item: any) => ({
          ...item,
          [EDIT_FIELD]: undefined,
        }));
        let replaceData = 0;
        if (direction === "UP" && rowIndex != 0) {
          replaceData = dataResult.data[rowIndex - 1].sort_order;
        } else {
          replaceData = dataResult.data[rowIndex + 1].sort_order;
        }

        newData.splice(rowIndex, 1);
        newData.splice(rowIndex + (direction === "UP" ? -1 : 1), 0, rowData);
        if (direction === "UP" && rowIndex != 0) {
          const newDatas = newData.map((item) =>
            item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
              ? {
                  ...item,
                  sort_order: replaceData,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  [EDIT_FIELD]: undefined,
                }
              : item[DATA_ITEM_KEY] ===
                dataResult.data[rowIndex - 1][DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: rowData.sort_order,
                  [EDIT_FIELD]: undefined,
                }
              : {
                  ...item,
                  [EDIT_FIELD]: undefined,
                }
          );

          setDataResult((prev: any) => {
            return {
              data: newDatas,
              total: prev.total,
            };
          });
        } else {
          const newDatas = newData.map((item) =>
            item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: replaceData,
                  [EDIT_FIELD]: undefined,
                }
              : item[DATA_ITEM_KEY] ===
                dataResult.data[rowIndex + 1][DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: rowData.sort_order,
                  [EDIT_FIELD]: undefined,
                }
              : {
                  ...item,
                  [EDIT_FIELD]: undefined,
                }
          );

          setDataResult((prev: any) => {
            return {
              data: newDatas,
              total: prev.total,
            };
          });
        }
      }
    } else {
      if (rowIndex != dataResult.total) {
        const newData = dataResult.data.map((item: any) => ({
          ...item,
          [EDIT_FIELD]: undefined,
        }));
        let replaceData = 0;
        if (direction === "UP" && rowIndex != 0) {
          replaceData = dataResult.data[rowIndex - 1].sort_order;
        } else {
          replaceData = dataResult.data[rowIndex + 1].sort_order;
        }

        newData.splice(rowIndex, 1);
        newData.splice(rowIndex + (direction === "UP" ? -1 : 1), 0, rowData);
        if (direction === "UP" && rowIndex != 0) {
          const newDatas = newData.map((item) =>
            item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
              ? {
                  ...item,
                  sort_order: replaceData,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  [EDIT_FIELD]: undefined,
                }
              : item[DATA_ITEM_KEY] ===
                dataResult.data[rowIndex - 1][DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: rowData.sort_order,
                  [EDIT_FIELD]: undefined,
                }
              : {
                  ...item,
                  [EDIT_FIELD]: undefined,
                }
          );

          setDataResult((prev: any) => {
            return {
              data: newDatas,
              total: prev.total,
            };
          });
        } else {
          const newDatas = newData.map((item) =>
            item[DATA_ITEM_KEY] === rowData[DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: replaceData,
                  [EDIT_FIELD]: undefined,
                }
              : item[DATA_ITEM_KEY] ===
                dataResult.data[rowIndex + 1][DATA_ITEM_KEY]
              ? {
                  ...item,
                  rowstatus: item.rowstatus === "N" ? "N" : "U",
                  sort_order: rowData.sort_order,
                  [EDIT_FIELD]: undefined,
                }
              : {
                  ...item,
                  [EDIT_FIELD]: undefined,
                }
          );

          setDataResult((prev: any) => {
            return {
              data: newDatas,
              total: prev.total,
            };
          });
        }
      }
    }
  };

  const arrowBtnClickPara = {
    DATA_ITEM_KEY: SUB_DATA_ITEM_KEY2,
    selectedState: selectedsubDataState2,
    dataResult: subDataResult2,
    setDataResult: setSubDataResult2,
  };

  useEffect(() => {
    setAllTabSelected(0);
  }, [valuecodeItems]);

  const CustomCheckBoxCell5 = (props: GridCellProps) => {
    const { ariaColumnIndex, columnIndex, dataItem, field } = props;

    if (props.rowType === "groupHeader") {
      return null;
    }

    const handleChange = () => {
      if (field != undefined) {
        const newData = subDataResult.map((items) =>
          items.value == dataItem.group_menu_name
            ? {
                ...items,
                items: items.items.map((item: any) =>
                  item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
                    ? {
                        ...item,
                        rowstatus: item.rowstatus == "N" ? "N" : "U",
                        [field]:
                          typeof item[field] == "boolean"
                            ? !item[field]
                            : item[field] == "Y"
                            ? false
                            : true,
                        [EDIT_FIELD]: field,
                      }
                    : {
                        ...item,
                        [EDIT_FIELD]: undefined,
                      }
                ),
              }
            : items
        );

        setSubDataResult(newData);
        setTempResult(newData);
      }
    };

    return (
      <td style={{ textAlign: "center" }}>
        <Checkbox
          value={dataItem[field == undefined ? "" : field]}
          onClick={handleChange}
        ></Checkbox>
      </td>
    );
  };

  return (
    <>
      <TitleContainer>
        {!isMobile ? ("") : (<Title>프로젝트 마스터</Title>)}
        <ButtonContainer>
          <Button onClick={Add} icon="file-add" themeColor={"primary"}>
            신규
          </Button>
          <Button
            onClick={Delete}
            fillMode={"outline"}
            icon="delete"
            themeColor={"primary"}
          >
            삭제
          </Button>
          <Button
            onClick={Save}
            fillMode={"outline"}
            icon="save"
            themeColor={"primary"}
            disabled={AlltabSelected == 0 ? true : false}
          >
            저장
          </Button>
          <Button
            onClick={search}
            icon="search"
            themeColor={"primary"}
            disabled={AlltabSelected != 0 ? true : false}
          >
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <TabStrip
        style={{ width: "100%", height: `85vh` }}
        selected={AlltabSelected}
        onSelect={handleSelectAllTab}
      >
        <TabStripTab title="요약정보">
          <GridContainerWrap>
            <GridContainer width="15%">
              <GridTitleContainer>
                <GridTitle>조회조건</GridTitle>
              </GridTitleContainer>
              <FilterBoxWrap ref={filterRef}>
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
                          columns={dateTypeColumns}
                          textField={"name"}
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
                      <th>업체</th>
                      <td colSpan={3}>
                        <Input
                          name="custnm"
                          type="text"
                          value={filters.custnm}
                          onChange={filterInputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>진행여부</th>
                      <td>
                        <MultiColumnComboBox
                          name="progress_status"
                          data={
                            filter2
                              ? filterBy(progressStatusData, filter2)
                              : progressStatusData
                          }
                          value={filters.progress_status}
                          columns={dateTypeColumns}
                          textField={"name"}
                          onChange={filterComboBoxChange}
                          className="required"
                          filterable={true}
                          onFilterChange={handleFilterChange2}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>프로젝트</th>
                      <td>
                        <Input
                          name="project"
                          type="text"
                          value={filters.project}
                          onChange={filterInputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>완료여부</th>
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
                      <th>사업진행담당</th>
                      <td>
                        <MultiColumnComboBox
                          name="pjt_person"
                          data={
                            filter3 ? filterBy(usersData, filter3) : usersData
                          }
                          value={filters.pjt_person}
                          columns={userColumns}
                          textField={"user_name"}
                          onChange={filterComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange3}
                        />
                      </td>
                    </tr>
                  </tbody>
                </FilterBox>
              </FilterBoxWrap>
            </GridContainer>
            <GridContainer width={`calc(85% - ${GAP}px)`}>
              <Grid
                style={{ height: "76vh" }}
                data={process(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    pjtmanager: usersData.find(
                      (items: any) => items.user_id == row.pjtmanager
                    )?.user_name,
                    pjtperson: usersData.find(
                      (items: any) => items.user_id == row.pjtperson
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
                ref={gridRef}
                //정렬기능
                sortable={true}
                onSortChange={onMainSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                onRowDoubleClick={onRowDoubleClick}
              >
                <GridColumn
                  field="custnm"
                  title="업체"
                  width={170}
                  footerCell={mainTotalFooterCell}
                />
                <GridColumn
                  field="number"
                  title="차수"
                  width={60}
                  cell={CenterCell}
                />
                <GridColumn field="project" title="프로젝트" width={200} />
                <GridColumn
                  field="cotracdt"
                  title="사업시작일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="finexpdt"
                  title="사업종료일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="pjtperson"
                  title="사업진행담당"
                  width={120}
                />
                <GridColumn field="pjtmanager" title="담당PM" width={120} />
                <GridColumn field="remark" title="비고" width={200} />
                <GridColumn
                  field="midchkdt"
                  title="중간점검일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="finchkdt"
                  title="최종점검일"
                  width={120}
                  cell={DateCell}
                />
                <GridColumn
                  field="devmngnum"
                  title="개발관리번호"
                  width={200}
                />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab
          title="기본정보"
          disabled={
            mainDataResult.total < 1 ? (workType == "N" ? false : true) : false
          }
        >
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>기본정보</GridTitle>
            </GridTitleContainer>
            <FormBoxWrap border={true}>
              <FormBox>
                <tbody>
                  <tr>
                    <th>개발관리번호</th>
                    <td>
                      <div className="filter-item-wrap">
                        <Input
                          name="devmngnum"
                          type="text"
                          value={information.devmngnum}
                          className="readonly"
                        />
                        <Checkbox
                          name="progress_status"
                          value={information.progress_status}
                          label={"진행"}
                          onChange={InputChange}
                          style={{ marginLeft: "10px", marginTop: "8px" }}
                        />
                      </div>
                    </td>
                    <th>차수</th>
                    <td>
                      <Input
                        name="number"
                        type="number"
                        value={information.number}
                        onChange={InputChange}
                        className="required"
                      />
                    </td>
                    <th>작성일</th>
                    <td>
                      <DatePicker
                        name="recdt"
                        value={information.recdt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                        className="required"
                      />
                    </td>
                    <th>완료일</th>
                    <td>
                      <DatePicker
                        name="findt"
                        value={information.findt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>업체코드</th>
                    <td>
                      <Input
                        name="custcd"
                        type="text"
                        value={information.custcd}
                        className="readonly"
                      />
                      <ButtonInInput>
                        <Button
                          onClick={onCustWndClick}
                          icon="more-horizontal"
                          fillMode="flat"
                        />
                      </ButtonInInput>
                    </td>
                    <th>업체명</th>
                    <td>
                      <MultiColumnComboBox
                        name="custnm"
                        data={
                          filter4
                            ? filterBy(custListData, filter4)
                            : custListData
                        }
                        value={information.custnm}
                        columns={custTypeColumns}
                        textField={"custnm"}
                        onChange={ComboBoxChange}
                        className="required"
                        filterable={true}
                        onFilterChange={handleFilterChange4}
                      />
                    </td>
                    <th>담당PM</th>
                    <td>
                      <MultiColumnComboBox
                        name="pjtmanager"
                        data={
                          filter5 ? filterBy(usersData, filter5) : usersData
                        }
                        value={information.pjtmanager}
                        columns={userColumns}
                        textField={"user_name"}
                        onChange={ComboBoxChange}
                        className="required"
                        filterable={true}
                        onFilterChange={handleFilterChange5}
                      />
                    </td>
                    <th>사업진행담당</th>
                    <td>
                      <MultiColumnComboBox
                        name="pjtperson"
                        data={
                          filter6 ? filterBy(usersData, filter6) : usersData
                        }
                        value={information.pjtperson}
                        columns={userColumns}
                        textField={"user_name"}
                        onChange={ComboBoxChange}
                        className="required"
                        filterable={true}
                        onFilterChange={handleFilterChange6}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>사업시작일</th>
                    <td>
                      <DatePicker
                        name="cotracdt"
                        value={information.cotracdt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                        className="required"
                      />
                    </td>
                    <th>사업종료일</th>
                    <td>
                      <DatePicker
                        name="finexpdt"
                        value={information.finexpdt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                        className="required"
                      />
                    </td>
                    <th>의원</th>
                    <td colSpan={3}>
                      <Input
                        name="revperson"
                        type="text"
                        value={information.revperson}
                        onChange={InputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>중간점검일</th>
                    <td>
                      <DatePicker
                        name="midchkdt"
                        value={information.midchkdt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                      />
                    </td>
                    <th>최종점검일</th>
                    <td>
                      <DatePicker
                        name="finexpdt"
                        value={information.finexpdt}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                      />
                    </td>
                    <th>완료점검일</th>
                    <td>
                      <DatePicker
                        name="compl_chk_date"
                        value={information.compl_chk_date}
                        format="yyyy-MM-dd"
                        onChange={InputChange}
                        placeholder=""
                      />
                    </td>
                    <th>첨부파일</th>
                    <td>
                      <Input
                        name="files"
                        value={information.files}
                        className="readonly"
                      />
                      <ButtonInInput>
                        <Button
                          type={"button"}
                          onClick={onAttachmentsWndClick}
                          icon="more-horizontal"
                          fillMode="flat"
                        />
                      </ButtonInInput>
                    </td>
                  </tr>
                  <tr>
                    <th>프로젝트</th>
                    <td colSpan={7}>
                      <Input
                        name="project"
                        type="text"
                        value={information.project}
                        onChange={InputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>비고</th>
                    <td colSpan={7}>
                      <TextArea
                        value={information.remark}
                        name="remark"
                        rows={3}
                        onChange={InputChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>

            <GridTitleContainer>
              <GridTitle>주요일정</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onAddClick2}
                  themeColor={"primary"}
                  icon="plus"
                  title="행 추가"
                ></Button>
                <Button
                  onClick={onRemoveClick2}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                  title="행 삭제"
                ></Button>
                <Button
                  onClick={() =>
                    onArrowsBtnClick({
                      direction: "UP",
                      dataInfo: arrowBtnClickPara,
                    })
                  }
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="chevron-up"
                  title="행 위로 이동"
                ></Button>
                <Button
                  onClick={() =>
                    onArrowsBtnClick({
                      direction: "DOWN",
                      dataInfo: arrowBtnClickPara,
                    })
                  }
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="chevron-down"
                  title="행 아래로 이동"
                ></Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "36vh" }}
              data={process(
                subDataResult2.data.map((row) => ({
                  ...row,
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selectedsubDataState2[idGetter3(row)],
                })),
                subDataState2
              )}
              {...subDataState2}
              onDataStateChange={onSubDataStateChange2}
              //선택 기능
              dataItemKey={SUB_DATA_ITEM_KEY2}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onSubSelectionChange2}
              //스크롤 조회 기능
              fixedScroll={true}
              total={subDataResult2.total}
              //정렬기능
              sortable={true}
              onSortChange={onSubSortChange2}
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
                field="date"
                title="일자"
                width={120}
                cell={DateCell}
                footerCell={subTotalFooterCell2}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="title"
                title="제목"
                width={1205}
                headerCell={RequiredHeader}
              />
              <GridColumn
                field="is_monitoring"
                title="모니터링"
                width={80}
                cell={CheckBoxCell}
              />
              <GridColumn field="user_name" title="작성자" width={120} />
              <GridColumn
                field="finyn"
                title="완료"
                width={80}
                cell={CheckBoxCell}
              />
            </Grid>
          </GridContainer>
        </TabStripTab>
        <TabStripTab title="상세정보">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>상세정보</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onValueBoxWndClick}
                  themeColor={"primary"}
                  icon="folder"
                >
                  ValueBox 참조
                </Button>
                <Button
                  onClick={onValueBoxWndClick2}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="folder"
                >
                  Value 구분 관리
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
            <DevContext.Provider value={{ devdivItems: devdivItems }}>
              <ValueCodeContext.Provider
                value={{ valuecodeItems: valuecodeItems }}
              >
                <ListRadioContext.Provider
                  value={{ listRadioItems: listRadioItems }}
                >
                  <LvlContext.Provider value={{ lvlItems: lvlItems }}>
                    <UserContext.Provider value={{ usersData: usersData }}>
                      <Grid
                        style={{ height: "72vh" }}
                        data={newData.map((item) => ({
                          ...item,
                          items: item.items.map((row: any) => ({
                            ...row,
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
                            [SELECTED_FIELD]:
                              selectedsubDataState[idGetter2(row)], //선택된 데이터
                          })),
                        }))}
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
                        total={subDataTotal}
                        skip={page.skip}
                        take={page.take}
                        pageable={true}
                        onPageChange={pageChange}
                        //원하는 행 위치로 스크롤 기능
                        ref={gridRef2}
                        rowHeight={30}
                        //정렬기능
                        sortable={true}
                        onSortChange={onSubSortChange}
                        //컬럼순서조정
                        reorderable={true}
                        //컬럼너비조정
                        resizable={true}
                        onItemChange={onItemChange}
                        cellRender={customCellRender}
                        rowRender={customRowRender}
                        editField={EDIT_FIELD}
                        //그룹기능
                        group={group}
                        groupable={true}
                        onExpandChange={onExpandChange}
                        expandField="expanded"
                        lockGroups={true}
                      >
                        <GridColumn
                          field="rowstatus"
                          title=" "
                          width="45px"
                          locked={true}
                        />
                        <GridColumn
                          field="pgmid"
                          title="폼ID"
                          width={120}
                          footerCell={subTotalFooterCell}
                          locked={true}
                        />
                        <GridColumn
                          field="pgmnm"
                          title="메뉴명"
                          width={150}
                          locked={true}
                        />
                        <GridColumn
                          field="devdiv"
                          title="개발구분"
                          width={120}
                          cell={DevdivCell}
                        />
                        <GridColumn
                          field="value_code3"
                          title="Value 구분"
                          width={120}
                          cell={ValueCodeCell}
                        />
                        <GridColumn
                          field="prgrate"
                          title="진행률"
                          width={100}
                          cell={ProgressCell}
                        />
                        <GridColumn
                          field="listyn"
                          title="LIST포함여부"
                          width={180}
                          cell={ListRadioCell}
                        />
                        <GridColumn
                          field="lvl"
                          title="난이도"
                          width={120}
                          cell={LvlCell}
                        />
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
                          cell={UserCell}
                        />
                        <GridColumn
                          field="devperson"
                          title="개발담당자"
                          width={120}
                          cell={UserCell}
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
                          cell={UserCell}
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
                          cell={CustomCheckBoxCell5}
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
                          cell={CustomCheckBoxCell5}
                        />
                      </Grid>
                    </UserContext.Provider>
                  </LvlContext.Provider>
                </ListRadioContext.Provider>
              </ValueCodeContext.Provider>
            </DevContext.Provider>
          </GridContainer>
        </TabStripTab>
      </TabStrip>
      {valueboxWindowVisible && (
        <ValueBoxWindow
          setVisible={setValueBoxWindowVisible}
          setData={setValueBox}
        />
      )}
      {valueboxWindowVisible2 && (
        <ValueBoxWindow2
          setVisible={setValueBoxWindowVisible2}
          reload={() => {
            fetchValueCode();
          }}
        />
      )}
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
          modal={true}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={information.attdatnum}
          type={"project"}
          modal={true}
          fileLists={fileList}
          savenmLists={savenmList}
        />
      )}
    </>
  );
};
export default App;
