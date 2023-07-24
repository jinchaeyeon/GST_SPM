import {
  DataResult,
  FilterDescriptor,
  getter,
  process,
  State,
  filterBy,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  DatePicker,
  DatePickerChangeEvent,
} from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GRID_COL_INDEX_ATTRIBUTE,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  GridToolbar,
} from "@progress/kendo-react-grid";
import {
  Checkbox,
  CheckboxChangeEvent,
  Input,
  InputChangeEvent,
  TextArea,
} from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import React, {
  useState,
  CSSProperties,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
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
import {
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  getGridItemChangedData,
  getYn,
  handleKeyPressSearch,
  toDate,
  UseParaPc,
  getCodeFromValue,
  extractDownloadFilename,
  isValidDate,
  dateformat,
} from "../components/CommonFunction";
import {
  DEFAULT_ATTDATNUMS,
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import { useApi } from "../hooks/api";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { Iparameters, TEditorHandle } from "../store/types";
import { IAttachmentData, ICustData, IPrjData } from "../hooks/interfaces";
import ProjectsWindow from "../components/Windows/CommonWindows/ProjectsWindow";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import CenterCell from "../components/Cells/CenterCell";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import DateCell from "../components/Cells/DateCell";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import NameCell from "../components/Cells/NameCell";
import { useHistory } from "react-router-dom";
import SignWindow from "../components/Windows/CommonWindows/SignWindow";
import {
  dateTypeColumns,
  custTypeColumns,
  userColumns,
  dataTypeColumns,
  dataTypeColumns2,
} from "../store/columns/common-columns";
import NumberCell from "../components/Cells/NumberCell";
import ProgressCell from "../components/Cells/ProgressCell";
import RadioGroupCell from "../components/Cells/RadioGroupCell";

const DATA_ITEM_KEY = "devmngnum";
const SUB_DATA_ITEM_KEY = "devmngseq";

let targetRowIndex: null | number = null;

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

const statusQueryStr = `SELECT '%' as code, '전체' as name
UNION ALL
SELECT 'Y' as code, '완료' as name
UNION ALL
SELECT 'N' as code, '미완료' as name`;

const custQueryStr = `SELECT custcd,custnm
FROM ba020t where useyn = 'Y' order by custcd`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

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
    <ComboBoxCell columns={dataTypeColumns2} data={valuecodeItems} {...props} />
  ) : (
    <td />
  );
};

const ListRadioCell = (props: GridCellProps) => {
  const { listRadioItems } = useContext(ListRadioContext);

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

const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const history = useHistory();
  const filterRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = React.useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter(event.filter);
    }
  };

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [workType, setWorkType] = useState("N");
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
  let gridRef: any = useRef(null);

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

    setSubFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isSearch: true,
    }));
  };

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

  const ComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setPage(initialPageState); // 페이지 초기화
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
  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const setCustData = (data: ICustData) => {
    setInformation((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: { custcd: data.custcd, custnm: data.custnm },
    }));
  };
  const getAttachmentsData = (data: IAttachmentData) => {
    setInformation((prev) => ({
      ...prev,
      attdatnum: data.attdatnum,
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
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
    status: { code: "N", name: "미완료" },
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
        "@p_status":
          filters.status != null
            ? filters.status.code == "%"
              ? "Y|N"
              : filters.status.code
            : "",
        "@p_project": filters.project,
        "@p_progress_status": filters.progress_status.code,
        "@p_devmngnum": "",
        "@p_code": "",
        "@p_name": "",
        // "@p_find_row_value": filters.find_row_value,
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
          total: totalRowCnt,
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
            progress_status: selectedRow.progress_status,
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
            progress_status: rows[0].progress_status,
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
          progress_status: "N",
          project: "",
          recdt: new Date(),
          remark: "",
          revperson: "",
        });
        setSubDataResult(process([], subDataState));
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
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_project_master",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": subfilters.workType,
        "@p_date_type": filters.date_type.code,
        "@p_from_date": convertDateToStr(filters.fromDate),
        "@p_to_date": convertDateToStr(filters.toDate),
        "@p_customer_code": "",
        "@p_customer_name": "",
        "@p_pjt_person":
          filters.pjt_person != null ? filters.pjt_person.user_id : "",
        "@p_status":
          filters.status != null
            ? filters.status.code == "%"
              ? "Y|N"
              : filters.status.code
            : "",
        "@p_project": filters.project,
        "@p_progress_status": filters.progress_status.code,
        "@p_devmngnum": subfilters.devmngnum,
        "@p_code": "",
        "@p_name": "",
        // "@p_find_row_value": filters.find_row_value,
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

      setSubDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
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
  }, []);

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

    setSubFilters((prev) => ({
      ...prev,
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
      progress_status: selectedRowData.progress_status,
      project: selectedRowData.project,
      recdt: isValidDate(selectedRowData.recdt)
        ? new Date(dateformat(selectedRowData.recdt))
        : null,
      remark: selectedRowData.remark,
      revperson: selectedRowData.revperson,
    });
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
    var parts = subDataResult.total.toString().split(".");
    return (
      <td
        colSpan={props.colSpan}
        className={"k-grid-footer-sticky"}
        style={props.style}
        {...{ [GRID_COL_INDEX_ATTRIBUTE]: 1 }}
      >
        총
        {subDataResult.total == -1
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
      progress_status: "N",
      project: "",
      recdt: new Date(),
      remark: "",
      revperson: "",
    });
    setWorkType("N");
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

  const enterEdit = (dataItem: any, field: string) => {
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

  const exitEdit = () => {
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

  return (
    <>
      <TitleContainer>
        <Title>프로젝트 마스터</Title>
        <ButtonContainer>
          <Button onClick={Add} icon="file-add" themeColor={"primary"}>
            신규
          </Button>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <GridContainerWrap height={"90%"}>
        <GridContainer width={"35%"}>
          <GridTitleContainer>
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
          <FilterBoxWrap ref={filterRef}>
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
                      columns={dateTypeColumns}
                      textField={"name"}
                      onChange={filterComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </th>
                  <td colSpan={3}>
                    <div className="filter-item-wrap">
                      <DatePicker
                        name="fromDate"
                        value={filters.fromDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                        className="required"
                      />
                      ~
                      <DatePicker
                        name="toDate"
                        value={filters.toDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                        className="required"
                      />
                    </div>
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
                        filter
                          ? filterBy(progressStatusData, filter)
                          : progressStatusData
                      }
                      value={filters.progress_status}
                      columns={dateTypeColumns}
                      textField={"name"}
                      onChange={filterComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
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
                    <MultiColumnComboBox
                      name="status"
                      data={filter ? filterBy(StatusData, filter) : StatusData}
                      value={filters.status}
                      columns={dateTypeColumns}
                      textField={"name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
                  <th>사업진행담당</th>
                  <td>
                    <MultiColumnComboBox
                      name="pjt_person"
                      data={filter ? filterBy(usersData, filter) : usersData}
                      value={filters.pjt_person}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={filterComboBoxChange}
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FilterBox>
          </FilterBoxWrap>
          <Grid
            style={{ height: "65vh" }}
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
            <GridColumn field="pjtperson" title="사업진행담당" width={120} />
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
            <GridColumn field="devmngnum" title="개발관리번호" width={200} />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(65% - ${GAP}px)`}>
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
                        filter ? filterBy(custListData, filter) : custListData
                      }
                      value={information.custnm}
                      columns={custTypeColumns}
                      textField={"custnm"}
                      onChange={ComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
                  <th>담당PM</th>
                  <td>
                    <MultiColumnComboBox
                      name="pjtmanager"
                      data={filter ? filterBy(usersData, filter) : usersData}
                      value={information.pjtmanager}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={ComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
                    />
                  </td>
                  <th>사업진행담당</th>
                  <td>
                    <MultiColumnComboBox
                      name="pjtperson"
                      data={filter ? filterBy(usersData, filter) : usersData}
                      value={information.pjtperson}
                      columns={userColumns}
                      textField={"user_name"}
                      onChange={ComboBoxChange}
                      className="required"
                      filterable={true}
                      onFilterChange={handleFilterChange}
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
                      type="text"
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
            <GridTitle>상세정보</GridTitle>
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
                      style={{ height: "47.7vh" }}
                      data={process(
                        subDataResult.data.map((row) => ({
                          ...row,
                          rowstatus:
                            row.rowstatus == null ||
                            row.rowstatus == "" ||
                            row.rowstatus == undefined
                              ? ""
                              : row.rowstatus,
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
                        cell={CheckBoxCell}
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
                        cell={CheckBoxCell}
                      />
                    </Grid>
                  </UserContext.Provider>
                </LvlContext.Provider>
              </ListRadioContext.Provider>
            </ValueCodeContext.Provider>
          </DevContext.Provider>
        </GridContainer>
      </GridContainerWrap>
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={information.attdatnum}
          type={"project"}
        />
      )}
    </>
  );
};
export default App;
