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
  StatusIcon,
  Title,
  TitleContainer,
} from "../CommonStyled";
import { v4 as uuidv4 } from "uuid";
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
  UseParaPc,
  convertDateToStr,
  extractDownloadFilename,
  getGridItemChangedData,
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
  custTypeColumns,
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../store/columns/common-columns";
import {
  DEFAULT_ATTDATNUMS,
  EDIT_FIELD,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CommonDateRangePicker from "../components/DateRangePicker/CommonDateRangePicker";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../store/atoms";
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
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import DateCell from "../components/Cells/DateCell";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import RichEditor from "../components/RichEditor";
import TaskOrderWindow from "../components/Windows/CommonWindows/TaskOrderWindow";
import ProgressCell from "../components/Cells/ProgressCell";
import RadioGroupCell from "../components/Cells/RadioGroupCell";
import NumberCell from "../components/Cells/NumberCell";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { IAttachmentData } from "../hooks/interfaces";
import PopUpAttachmentsWindow from "../components/Windows/CommonWindows/PopUpAttachmentsWindow";
import RequiredHeader from "../components/RequiredHeader";
import ErrorWindow from "../components/Windows/CommonWindows/ErrorWindow";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import TaskOrderDataWindow from "../components/Windows/CommonWindows/TaskOrderDataWindow";
import { useLocation } from "react-router-dom";

const StatusContext = createContext<{
  statusListData: any[];
}>({
  statusListData: [],
});

const StatusCell = (props: GridCellProps) => {
  const { statusListData } = useContext(StatusContext);
  const data = props.dataItem;

  const str =
    data.status == "진행중"
      ? "R"
      : data.status == "완료"
      ? "Y"
      : data.status == "보류"
      ? "H"
      : data.status == "대기"
      ? "N"
      : "";
  return statusListData ? (
    <td>
      <StatusIcon status={str} />
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
const UserContext = createContext<{
  usersData: any[];
}>({
  usersData: [],
});
const CustContext = createContext<{
  custData: any[];
}>({
  custData: [],
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

export const FilesContext2 = createContext<{
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
const CustCell = (props: GridCellProps) => {
  const { custData } = useContext(CustContext);

  return custData ? (
    <ComboBoxCell
      columns={custTypeColumns}
      data={custData}
      textField="custnm"
      valueField="custcd"
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
    setAttdatnum,
    setAttach_exists,
    fileList,
    setFileList,
    savenmList,
    setSavenmList,
    attdatnum,
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

export const TypeContext = createContext<{
  ref_type: string;
  custcd: string;
  ref_key: string;
  ref_seq: string;
  setRef_Type: (d: any) => void;
  setCustcd: (d: any) => void;
  setRef_key: (d: any) => void;
  setRef_seq: (d: any) => void;
  mainDataState4: State;
  setMainDataState4: (d: any) => void;
  // fetchGrid: (n: number) => any;
}>({} as any);

const TypeCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    render,
    onChange,
    className = "",
  } = props;
  const { setRef_Type, setCustcd, setRef_key, setRef_seq } =
    useContext(TypeContext);
  let isInEdit = field === dataItem.inEdit;
  const value = field && dataItem[field] ? dataItem[field] : "";

  const [typeWindowVisible, setTypeWindowVisible] = useState<boolean>(false);

  const onTypeWndClick = () => {
    setTypeWindowVisible(true);
  };

  const defaultRendering = (
    <td
      className={className}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
      style={{ position: "relative" }}
    >
      <div style={{ textAlign: "center", marginRight: "10px" }}>
        {dataItem.ref_type == "접수" ? (
          <span className="k-icon k-i-file k-icon-lg"></span>
        ) : dataItem.ref_type == "프로젝트" ? (
          <span className="k-icon k-i-folder k-icon-lg"></span>
        ) : dataItem.ref_type == "회의록" ? (
          <span className="k-icon k-i-comment k-icon-lg"></span>
        ) : (
          ""
        )}
      </div>
      <ButtonInGridInput>
        <Button
          onClick={onTypeWndClick}
          icon="more-horizontal"
          fillMode="flat"
        />
      </ButtonInGridInput>
    </td>
  );

  const getTypeData = (data: any, type: string) => {
    if (type == "접수") {
      setRef_Type(type);
      setCustcd(data.customer_code);
      setRef_key(data.ref_number);
      setRef_seq(0);
    } else if (type == "프로젝트") {
      setRef_Type(type);
      setCustcd(data.custcd);
      setRef_key(data.devmngnum);
      setRef_seq(data.devmngseq);
    } else if (type == "회의록") {
      setRef_Type(type);
      setCustcd(data.custcd);
      setRef_key(data.meetingnum);
      setRef_seq(data.meetingseq);
    } else {
      setRef_Type("미참조");
      setCustcd("");
      setRef_key("");
      setRef_seq(0);
    }
  };

  return (
    <>
      {render === undefined
        ? null
        : render?.call(undefined, defaultRendering, props)}
      {typeWindowVisible && (
        <TaskOrderDataWindow
          setVisible={setTypeWindowVisible}
          setData={getTypeData}
          modal={true}
        />
      )}
    </>
  );
};

let temp = 0;
let deletedRows: any[] = [];
const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

const custQueryStr = `SELECT custcd,custnm
FROM ba020t where useyn = 'Y' order by custcd`;

const receptionTypeQueryStr = `SELECT a.sub_code,
a.code_name
FROM comCodeMaster a 
WHERE a.group_code = 'BA097'
AND use_yn = 'Y'`;
const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const DATA_ITEM_KEY = "document_id";
const DATA_ITEM_KEY2 = "find_key";
const DATA_ITEM_KEY3 = "find_key";
const DATA_ITEM_KEY4 = "num";
let targetRowIndex: null | number = null;
let targetRowIndex2: null | number = null;
let targetRowIndex3: null | number = null;
let targetRowIndex4: null | number = null;

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
  let gridRef3: any = useRef(null);
  let gridRef4: any = useRef(null);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const idGetter3 = getter(DATA_ITEM_KEY3);
  const idGetter4 = getter(DATA_ITEM_KEY4);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);
  const [page3, setPage3] = useState(initialPageState);
  const [page4, setPage4] = useState(initialPageState);
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");

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
  const pageChange4 = (event: GridPageChangeEvent) => {
    const { page } = event;
    for (let key of Object.keys(localStorage)) {
      if (
        key != "passwordExpirationInfo" &&
        key != "accessToken" &&
        key != "loginResult" &&
        key != "refreshToken"
      ) {
        localStorage.removeItem(key);
      }
    }

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage4({
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
  const [tabSelected, setTabSelected] = useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
    for (let key of Object.keys(localStorage)) {
      if (
        key != "passwordExpirationInfo" &&
        key != "accessToken" &&
        key != "loginResult" &&
        key != "refreshToken"
      ) {
        localStorage.removeItem(key);
      }
    }
    setFileList([]);
    setSavenmList([]);
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
        worker: { user_id: userId, user_name: userName },
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
        receptionist: { user_id: userId, user_name: userName },
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
    } else {
      setFilters({
        workType: "task_order_all",
        date_type: { sub_code: "A", code_name: "지시일" },
        fromDate: fromDate2,
        toDate: new Date(),
        custnm: "",
        value_code3: { sub_code: "", code_name: "" },
        contents: "",
        status: [{ sub_code: "N", code_name: "미완료", code: "N" }],
        reception_person: { user_id: "", user_name: "" },
        receptionist: { user_id: "", user_name: "" },
        worker: { user_id: "", user_name: "" },
        reception_type: { sub_code: "", code_name: "" },
        user_name: { user_id: userId, user_name: userName },
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
      setPage4({
        skip: 0,
        take: initialPageState.take,
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
  const dateTypeData3 = [
    { sub_code: "A", code_name: "회의일" },
    { sub_code: "B", code_name: "요청일" },
    { sub_code: "C", code_name: "완료예정일" },
  ];
  const dateTypeData4 = [
    { sub_code: "A", code_name: "지시일" },
    { sub_code: "B", code_name: "완료예정일" },
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
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const [custData, setCustData] = useState<any[]>([]);
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
  const CheckListData: any[] = [
    { sub_code: "Y", code_name: "확인" },
    { sub_code: "N", code_name: "미확인" },
  ];
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
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [mainDataState3, setMainDataState3] = useState<State>({
    sort: [],
  });
  const [mainDataState4, setMainDataState4] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
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
  const [mainDataResult4, setMainDataResult4] = useState<DataResult>(
    process([], mainDataState4)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
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
  const [selectedState4, setSelectedState4] = useState<{
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
      setCustData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

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
    fetchWorkType();
    fetchValueCode();
    fetchUsers();
    fetchReceptionType();
    fetchCust();
  }, []);

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
      if (data.indicator == userId) {
        const checkQueryStr = `UPDATE CR005T SET finyn = '${
          data.check_yn == "N" || data.check_yn == ""
            ? "Y"
            : data.check_yn == "Y"
            ? "N"
            : ""
        }' WHERE orgdiv = '${data.orgdiv}' AND docunum = '${data.docunum}'`;
        fetchCheck(checkQueryStr);
        const newData = mainDataResult4.data.map((item) =>
          item[DATA_ITEM_KEY4] == data[DATA_ITEM_KEY4]
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
        setMainDataResult4((prev) => {
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

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
  );
  const fromDate2 = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - 14
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
    worker: { user_id: userId, user_name: userName },
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

  //그리드 데이터 조회
  const fetchMainGrid4 = async (filters: any) => {
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
        if (gridRef4.current) {
          const findRowIndex = rows.findIndex(
            (row: any) => row.docunum == filters.findRowValue
          );
          targetRowIndex4 = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage4({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef4.current) {
          targetRowIndex4 = 0;
        }
      }
      setTempResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });
      setMainDataResult4((prev) => {
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
          setSelectedState4({ [selectedRow[DATA_ITEM_KEY4]]: true });

          fetchDocument(
            "Task",
            selectedRow.orgdiv + "_" + selectedRow.docunum,
            selectedRow
          );
        } else {
          setSelectedState4({ [rows[0][DATA_ITEM_KEY4]]: true });

          fetchDocument(
            "Task",
            rows[0].orgdiv + "_" + rows[0].docunum,
            rows[0]
          );
        }
      } else {
        if (refEditorRef.current) {
          refEditorRef.current.setHtml("");
        }
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
        if (tabSelected == 3) {
          if (refEditorRef.current) {
            const document = data.document;
            if (
              localStorage.getItem(key[DATA_ITEM_KEY4]) == undefined ||
              localStorage.getItem(key[DATA_ITEM_KEY4]) == null
            ) {
              localStorage.setItem(key[DATA_ITEM_KEY4], key.contents);
              localStorage.setItem(key[DATA_ITEM_KEY4] + "key", document);
            } else {
              localStorage.removeItem(key[DATA_ITEM_KEY4]);
              localStorage.removeItem(key[DATA_ITEM_KEY4] + "key");
              localStorage.setItem(key[DATA_ITEM_KEY4], key.contents);
              localStorage.setItem(key[DATA_ITEM_KEY4] + "key", document);
            }
            refEditorRef.current.setHtml(document);
          }
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
      } else if (tabSelected == 3) {
        fetchMainGrid4(deepCopiedFilters);
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

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex3 !== null && gridRef3.current) {
      gridRef3.current.scrollIntoView({ rowIndex: targetRowIndex3 });
      targetRowIndex3 = null;
    }
  }, [mainDataResult3]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex4 !== null && gridRef4.current) {
      gridRef4.current.scrollIntoView({ rowIndex: targetRowIndex4 });
      targetRowIndex4 = null;
    }
  }, [mainDataResult4]);

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange3 = (e: any) => {
    setMainDataState3((prev) => ({ ...prev, sort: e.sort }));
  };
  const onMainSortChange4 = (e: any) => {
    setMainDataState4((prev) => ({ ...prev, sort: e.sort }));
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
  const onMainDataStateChange4 = (event: GridDataStateChangeEvent) => {
    setMainDataState4(event.dataState);
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
  const onSelectionChange4 = (event: GridSelectionChangeEvent) => {
    const currentRow = mainDataResult4.data.filter(
      (item) =>
        item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
    )[0];
    let editorContent2: any = "";
    editorContent2 = refEditorRef.current?.getContent();
    let editorContent3: any = "";
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState4,
      dataItemKey: DATA_ITEM_KEY4,
    });

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent2, "text/html");
    const textContent = doc.body.textContent || ""; //기존행 문자열

    //web저장된 문서
    if (
      localStorage.getItem(currentRow[DATA_ITEM_KEY4]) == undefined ||
      localStorage.getItem(currentRow[DATA_ITEM_KEY4]) == null
    ) {
      localStorage.setItem(currentRow[DATA_ITEM_KEY4], textContent);
      localStorage.setItem(currentRow[DATA_ITEM_KEY4] + "key", editorContent2);
    } else {
      if (currentRow.rowstatus == "U" || currentRow.rowstatus == "N") {
        localStorage.removeItem(currentRow[DATA_ITEM_KEY4]);
        localStorage.removeItem(currentRow[DATA_ITEM_KEY4] + "key");
        localStorage.setItem(currentRow[DATA_ITEM_KEY4], textContent);
        localStorage.setItem(
          currentRow[DATA_ITEM_KEY4] + "key",
          editorContent2
        );
      }
    }

    setSelectedState4(newSelectedState);

    if (selectedRowData.rowstatus == undefined) {
      fetchDocument(
        "Task",
        selectedRowData.orgdiv + "_" + selectedRowData.docunum,
        selectedRowData
      );
    } else {
      editorContent3 = localStorage.getItem(
        selectedRowData[DATA_ITEM_KEY4] + "key"
      );
      if (refEditorRef.current) {
        refEditorRef.current.setHtml(editorContent3);
      }
    }
  };
  const search = () => {
    if (
      filters.date_type == null ||
      parseDate(convertDateToStr(filters.fromDate)) == "" ||
      parseDate(convertDateToStr(filters.toDate)) == ""
    ) {
      alert("필수항목을 입력해주세요");
    } else {
      for (let key of Object.keys(localStorage)) {
        if (
          key != "passwordExpirationInfo" &&
          key != "accessToken" &&
          key != "loginResult" &&
          key != "refreshToken"
        ) {
          localStorage.removeItem(key);
        }
      }
      setFileList([]);
      setSavenmList([]);
      deletedRows = [];
      setPage(initialPageState); // 페이지 초기화
      setPage2(initialPageState); // 페이지 초기화
      setPage3(initialPageState); // 페이지 초기화
      setPage4(initialPageState); // 페이지 초기화
      setHtmlOnEditor({ document: "" });
      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
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

  const gridSumQtyFooterCell = (props: GridFooterCellProps) => {
    let sum = 0;
    mainDataResult4.data.forEach((item) =>
      props.field !== undefined ? (sum = item["total_" + props.field]) : ""
    );
    if (sum != undefined) {
      var parts = sum.toString().split(".");

      return parts[0] != "NaN" ? (
        <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
          {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        </td>
      ) : (
        <td></td>
      );
    } else {
      return <td></td>;
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

  const mainTotalFooterCell4 = (props: GridFooterCellProps) => {
    var parts = mainDataResult4.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult4.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };
  const [isVisibleDetail, setIsVisableDetail] = useState(true);
  const [isVisibleDetail2, setIsVisableDetail2] = useState(true);
  const [isVisibleDetail3, setIsVisableDetail3] = useState(true);

  const [reception_attach_number, setReception_attach_number] =
    useState<string>("");
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
  const [TaskOrderWindowVisible, setTaskOrderWindowVisible] =
    useState<boolean>(false);
  const [TaskOrderWindowVisible2, setTaskOrderWindowVisible2] =
    useState<boolean>(false);
  const [TaskOrderWindowVisible3, setTaskOrderWindowVisible3] =
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
  const onTaskOrderWndClick3 = () => {
    if (
      mainDataResult3.data.filter(
        (item) =>
          item[DATA_ITEM_KEY3] == Object.getOwnPropertyNames(selectedState3)[0]
      )[0] != undefined
    ) {
      setTaskOrderWindowVisible3(true);
    } else {
      alert("데이터가 없습니다.");
    }
  };
  const docEditorRef = useRef<TEditorHandle>(null);
  const refEditorRef = useRef<TEditorHandle>(null);

  const setHtmlOnEditor = ({ document }: { document: string }) => {
    if (docEditorRef.current) {
      docEditorRef.current.updateEditable(true);
      docEditorRef.current.setHtml(document);
      docEditorRef.current.updateEditable(false);
    }
  };

  const downloadDoc = async () => {
    let response: any;
    setLoading(true);

    if (mainDataResult4.total < 1) {
      alert("데이터가 없습니다.");
    } else {
      const datas = mainDataResult4.data.filter(
        (item) =>
          item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
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
    setMainDataState4((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult4,
      setMainDataResult4,
      DATA_ITEM_KEY4
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
      const newData = mainDataResult4.data.map((item) =>
        item[DATA_ITEM_KEY4] == dataItem[DATA_ITEM_KEY4]
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
      setMainDataResult4((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      setTempResult((prev) => {
        return {
          data: mainDataResult4.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    if (tempResult.data != mainDataResult4.data) {
      const newData = mainDataResult4.data.map((item) =>
        item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
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
      setMainDataResult4((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = mainDataResult4.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult4((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };
  const [ref_type, setRef_Type] = useState<string>("");
  const [custcd, setCustcd] = useState<string>("");
  const [ref_key, setRef_key] = useState<string>("");
  const [ref_seq, setRef_seq] = useState<string>("");
  const [attdatnum, setAttdatnum] = useState<string>("");
  const [attach_exists, setAttach_exists] = useState<string>("");
  const [errorWindowVisible, setErrorWindowVisible] = useState<boolean>(false);
  const onErrorWndClick = () => {
    setErrorWindowVisible(true);
  };
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);

  useEffect(() => {
    if (fileList.length > 0 || savenmList.length > 0) {
      const newData = mainDataResult4.data.map((item) =>
        item[DATA_ITEM_KEY4] ==
        parseInt(Object.getOwnPropertyNames(selectedState4)[0])
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

      setMainDataResult4((prev) => {
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
  }, [attdatnum, attach_exists]);

  useEffect(() => {
    const newData = mainDataResult4.data.map((item) =>
      item[DATA_ITEM_KEY4] ==
      parseInt(Object.getOwnPropertyNames(selectedState4)[0])
        ? {
            ...item,
            rowstatus: item.rowstatus == "N" ? "N" : "U",
            ref_type: ref_type,
            ref_key: ref_key,
            ref_seq: ref_seq,
            custcd: ref_type == "미참조" ? item.custcd : custcd,
          }
        : {
            ...item,
          }
    );

    setMainDataResult4((prev) => {
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
  }, [ref_type, custcd, ref_key, ref_seq]);

  const onAddClick = () => {
    mainDataResult4.data.map((item) => {
      if (item[DATA_ITEM_KEY4] > temp) {
        temp = item[DATA_ITEM_KEY4];
      }
    });
    const guid = uuidv4();

    const newDataItem = {
      [DATA_ITEM_KEY4]: ++temp,
      attach_exists: "N",
      attdatnum: "",
      check_yn: "",
      contents: "",
      custcd: "",
      custnm: "",
      custperson: "",
      docunum: "",
      expect_time: "0:0",
      exphh: 0,
      expmm: 0,
      find_key: "",
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
      ref_key: "",
      ref_seq: 0,
      ref_type: "미참조",
      remark: "",
      value_code3: "",
      rowstatus: "N",
    };

    setMainDataResult4((prev) => {
      return {
        data: [newDataItem, ...prev.data],
        total: prev.total + 1,
      };
    });
    setSelectedState4({ [newDataItem[DATA_ITEM_KEY4]]: true });
    if (refEditorRef.current) {
      refEditorRef.current.setHtml("");
    }
  };

  const onRemoveClick = () => {
    if (mainDataResult4.total > 0) {
      //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
      let newData: any[] = [];
      let Object: any[] = [];
      let Object2: any[] = [];
      let data;
      mainDataResult4.data.forEach((item: any, index: number) => {
        if (!selectedState4[item[DATA_ITEM_KEY4]]) {
          newData.push(item);
          Object2.push(index);
        } else {
          const newData2 = {
            ...item,
            rowstatus: "D",
          };
          Object.push(index);
          deletedRows.push(newData2);
          localStorage.removeItem(newData2[DATA_ITEM_KEY4]);
          localStorage.removeItem(newData2[DATA_ITEM_KEY4] + "key");
        }
      });

      if (Math.min(...Object) < Math.min(...Object2)) {
        data = mainDataResult4.data[Math.min(...Object2)];
      } else {
        data = mainDataResult4.data[Math.min(...Object) - 1];
      }

      //newData 생성
      setMainDataResult4((prev) => ({
        data: newData,
        total: prev.total - Object.length,
      }));
      setSelectedState4({
        [data != undefined ? data[DATA_ITEM_KEY4] : newData[0]]: true,
      });
      if (data != undefined) {
        const row =
          data != undefined ? data : newData[0] != undefined ? newData[0] : "";
        fetchDocument("Task", row.orgdiv + "_" + row.docunum, row);
      }
    }
  };

  const onSetting = async () => {
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

      if (totalRowCnt > 0) {
        const selectedRow = rows.find(
          (row: any) =>
            row[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
        );

        const newData = mainDataResult4.data.map((item) =>
          item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
            ? {
                ...item,
                is_defective: selectedRow.is_defective,
              }
            : {
                ...item,
              }
        );
        setMainDataResult4((prev) => {
          return {
            data: newData,
            total: prev.total,
          };
        });
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

  const onConfirmClick = async () => {
    if (mainDataResult4.total > 0) {
      let editorContent: any = "";
      if (refEditorRef.current) {
        editorContent = refEditorRef.current.getContent();
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, "text/html");
      const textContent = doc.body.textContent || ""; //문자열
      let array: any = [];

      const newData = mainDataResult4.data.map((item) =>
        item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
          ? {
              ...item,
              rowstatus:
                item.rowstatus == "N" ? "N" : item.rowstatus == "U" ? "U" : "",
            }
          : {
              ...item,
            }
      );

      const currentRow = mainDataResult4.data.filter(
        (item) =>
          item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
      )[0];
      array = newData;
      localStorage.removeItem(currentRow[DATA_ITEM_KEY4]);
      localStorage.removeItem(currentRow[DATA_ITEM_KEY4] + "key");
      localStorage.setItem(currentRow[DATA_ITEM_KEY4], textContent);
      localStorage.setItem(currentRow[DATA_ITEM_KEY4] + "key", editorContent);

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
      mainDataResult4.data.map(
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
        setLoading(false);

        setLoading(true);
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
          data = null;
        }

        if (data != null) {
          for (let key of Object.keys(localStorage)) {
            if (
              key != "passwordExpirationInfo" &&
              key != "accessToken" &&
              key != "loginResult" &&
              key != "refreshToken"
            ) {
              localStorage.removeItem(key);
            }
          }
          setFileList([]);
          setSavenmList([]);
          const isLastDataDeleted =
            mainDataResult4.data.length == 1 && filters.pgNum > 1;
          if (isLastDataDeleted) {
            setPage4({
              skip:
                filters.pgNum == 1 || filters.pgNum == 0
                  ? 0
                  : PAGE_SIZE * (filters.pgNum - 2),
              take: PAGE_SIZE,
            });
            setFilters((prev: any) => ({
              ...prev,
              findRowValue: "",
              pgNum: prev.pgNum - 1,
              isSearch: true,
            }));
          } else {
            const currentRow = mainDataResult4.data.filter(
              (item) =>
                item[DATA_ITEM_KEY4] ==
                Object.getOwnPropertyNames(selectedState4)[0]
            )[0];

            setFilters((prev: any) => ({
              ...prev,
              findRowValue:
                currentRow == undefined
                  ? ""
                  : currentRow.rowstatus == "N" || currentRow.rowstatus == "U"
                  ? data.returnString
                  : currentRow.docunum,
              pgNum: prev.pgNum,
              isSearch: true,
            }));
          }
          deletedRows = [];
        } else {
          console.log("[오류 발생]");
          console.log(data);
        }
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
      setLoading(true);
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
        data = null;
      }

      if (data != null) {
        for (let key of Object.keys(localStorage)) {
          if (
            key != "passwordExpirationInfo" &&
            key != "accessToken" &&
            key != "loginResult" &&
            key != "refreshToken"
          ) {
            localStorage.removeItem(key);
          }
        }

        setFileList([]);
        setSavenmList([]);
        const isLastDataDeleted =
          mainDataResult4.data.length == 1 && filters.pgNum > 1;

        if (isLastDataDeleted) {
          setPage4({
            skip:
              filters.pgNum == 1 || filters.pgNum == 0
                ? 0
                : PAGE_SIZE * (filters.pgNum - 2),
            take: PAGE_SIZE,
          });
          setFilters((prev: any) => ({
            ...prev,
            findRowValue: "",
            pgNum: prev.pgNum - 1,
            isSearch: true,
          }));
        } else {
          const currentRow = mainDataResult4.data.filter(
            (item) =>
              item[DATA_ITEM_KEY4] ==
              Object.getOwnPropertyNames(selectedState4)[0]
          )[0];

          setFilters((prev: any) => ({
            ...prev,
            findRowValue: currentRow == undefined ? "" : currentRow.docunum,
            pgNum: prev.pgNum,
            isSearch: true,
          }));
        }
        deletedRows = [];
      } else {
        console.log("[오류 발생]");
        console.log(data);
      }
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

  let value = false;
  const onChanges = (str: any) => {
    if (str == 0 && value != false) {
      value = true;
    } else if (str == 1) {
      const newData = mainDataResult4.data.map((item) =>
        item[DATA_ITEM_KEY4] == Object.getOwnPropertyNames(selectedState4)[0]
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
      setMainDataResult4((prev) => {
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
        <Title>업무 지시</Title>
        <ButtonContainer>
          {tabSelected == 3 ? (
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="save"
              onClick={onConfirmClick}
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
      <GridContainerWrap height={"85vh"}>
        <TabStrip
          style={{ width: "100%", height: `85vh` }}
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
                          style={{ height: `30vh` }}
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
                    height: isMobile
                      ? "77vh"
                      : isVisibleDetail
                      ? "42vh"
                      : "77vh",
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
                        <th>기간</th>
                        <td>
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
                      style={{ height: `70vh` }}
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
                        <th>기간</th>
                        <td colSpan={3}>
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
                        <th>접수담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="receptionist"
                            data={
                              filter13
                                ? filterBy(usersData, filter13)
                                : usersData
                            }
                            value={filters.receptionist}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange13}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>처리담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="worker"
                            data={
                              filter14
                                ? filterBy(usersData, filter14)
                                : usersData
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
                      </tr>
                      <tr>
                        <th>Value 구분</th>
                        <td>
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
              <GridContainer width={`calc(85% - ${GAP}px)`}>
                {isVisibleDetail2 && (
                  <GridContainer>
                    <GridTitleContainer>
                      <GridTitle>회의록 요구사항 리스트</GridTitle>
                      <ButtonContainer>
                        <Button
                          icon={"pencil"}
                          name="task_order"
                          onClick={onTaskOrderWndClick3}
                          themeColor={"primary"}
                        >
                          업무지시
                        </Button>
                      </ButtonContainer>
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
                        footerCell={mainTotalFooterCell3}
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
                      <GridColumn
                        field="find_key"
                        title="회의록번호"
                        width={200}
                      />
                    </Grid>
                  </GridContainer>
                )}
                <GridContainer
                  style={{
                    marginTop: isVisibleDetail2 ? "10px" : "",
                    height: isMobile
                      ? "76vh"
                      : isVisibleDetail2
                      ? "40vh"
                      : "76vh",
                  }}
                >
                  <GridTitleContainer>
                    <GridTitle>
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={isVisibleDetail2 ? "chevron-up" : "chevron-down"}
                        onClick={() => setIsVisableDetail2((prev) => !prev)}
                      ></Button>
                      회의 참고 자료
                    </GridTitle>
                    {isVisibleDetail2 ? (
                      ""
                    ) : (
                      <ButtonContainer>
                        <Button
                          icon={"pencil"}
                          name="task_order"
                          onClick={onTaskOrderWndClick3}
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
                          <th style={{ width: "5%" }}>회의 제목</th>
                          <td>
                            <Input
                              name="title"
                              type="text"
                              value={
                                mainDataResult3.data.filter(
                                  (item) =>
                                    item[DATA_ITEM_KEY3] ==
                                    Object.getOwnPropertyNames(
                                      selectedState3
                                    )[0]
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
                                    Object.getOwnPropertyNames(
                                      selectedState3
                                    )[0]
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
            </GridContainerWrap>
          </TabStripTab>
          <TabStripTab title="업무지시(전체)">
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
                        <th>기간</th>
                        <td>
                          <MultiColumnComboBox
                            name="date_type"
                            data={
                              filter16
                                ? filterBy(dateTypeData4, filter16)
                                : dateTypeData4
                            }
                            value={filters.date_type}
                            columns={dataTypeColumns}
                            textField={"code_name"}
                            onChange={filterComboBoxChange}
                            className="required"
                            filterable={true}
                            onFilterChange={handleFilterChange16}
                            style={{ width: "100%" }}
                          />
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
                        <th>접수담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="receptionist"
                            data={
                              filter17
                                ? filterBy(usersData, filter17)
                                : usersData
                            }
                            value={filters.receptionist}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange17}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>참조</th>
                        <td>
                          <MultiSelect
                            name="ref_type"
                            data={TypeData}
                            onChange={filterMultiSelectChange}
                            value={filters.ref_type}
                            textField="name"
                            dataItemKey="code"
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>비고 및 내용</th>
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
                        <th>확인여부</th>
                        <td>
                          <MultiSelect
                            name="check"
                            data={CheckListData}
                            onChange={filterMultiSelectChange}
                            value={filters.check}
                            textField="code_name"
                            dataItemKey="sub_code"
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
                        <th>지시자</th>
                        <td>
                          <MultiColumnComboBox
                            name="user_name"
                            data={
                              filter18
                                ? filterBy(usersData, filter18)
                                : usersData
                            }
                            value={filters.user_name}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange18}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>처리담당자</th>
                        <td>
                          <MultiColumnComboBox
                            name="worker"
                            data={
                              filter19
                                ? filterBy(usersData, filter19)
                                : usersData
                            }
                            value={filters.worker}
                            columns={userColumns}
                            textField={"user_name"}
                            onChange={filterComboBoxChange}
                            filterable={true}
                            onFilterChange={handleFilterChange19}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </FilterBox>
                </FilterBoxWrap>
              </GridContainer>
              {isVisibleDetail3 && (
                <GridContainer width={`calc(40% - ${GAP}px)`}>
                  <GridTitleContainer>
                    <GridTitle>
                      업무지시(접수:
                      <span className="k-icon k-i-file k-icon-lg"></span>,
                      프로젝트:
                      <span className="k-icon k-i-folder k-icon-lg"></span>,
                      회의록:
                      <span className="k-icon k-i-comment k-icon-lg"></span>)
                    </GridTitle>
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
                  <TypeContext.Provider
                    value={{
                      ref_type,
                      custcd,
                      ref_key,
                      ref_seq,
                      setRef_Type,
                      setCustcd,
                      setRef_key,
                      setRef_seq,
                      mainDataState4,
                      setMainDataState4,
                    }}
                  >
                    <FilesContext2.Provider
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
                      <CustContext.Provider value={{ custData: custData }}>
                        <WorkTypeContext.Provider
                          value={{ WorkTypeItems: WorkTypeItems }}
                        >
                          <ValueCodeContext.Provider
                            value={{ valuecodeItems: valuecodeItems }}
                          >
                            <UserContext.Provider
                              value={{ usersData: usersData }}
                            >
                              <Grid
                                style={{ height: `73vh` }}
                                data={process(
                                  mainDataResult4.data.map((row) => ({
                                    ...row,
                                    insert_userid: usersData.find(
                                      (items: any) =>
                                        items.user_id == row.insert_userid
                                    )?.user_name,
                                    [SELECTED_FIELD]:
                                      selectedState4[idGetter4(row)],
                                  })),
                                  mainDataState4
                                )}
                                {...mainDataState4}
                                onDataStateChange={onMainDataStateChange4}
                                //선택 기능
                                dataItemKey={DATA_ITEM_KEY4}
                                selectedField={SELECTED_FIELD}
                                selectable={{
                                  enabled: true,
                                  mode: "single",
                                }}
                                onSelectionChange={onSelectionChange4}
                                //스크롤 조회 기능
                                fixedScroll={true}
                                total={mainDataResult4.total}
                                skip={page4.skip}
                                take={page4.take}
                                pageable={true}
                                onPageChange={pageChange4}
                                //원하는 행 위치로 스크롤 기능
                                ref={gridRef4}
                                rowHeight={30}
                                //정렬기능
                                sortable={true}
                                onSortChange={onMainSortChange4}
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
                                />
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
                                  field="ref_type"
                                  title="참조"
                                  width={120}
                                  cell={TypeCell}
                                />
                                <GridColumn
                                  field="custcd"
                                  title="업체"
                                  width={120}
                                  cell={CustCell}
                                />
                                <GridColumn
                                  field="groupcd"
                                  title="업무분류"
                                  width={120}
                                  cell={WorkTypeCodeCell}
                                  footerCell={mainTotalFooterCell4}
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
                                  footerCell={gridSumQtyFooterCell}
                                />
                                <GridColumn
                                  field="expmm"
                                  title="예상(M)"
                                  width={80}
                                  cell={NumberCell}
                                  footerCell={gridSumQtyFooterCell}
                                />
                                <GridColumn
                                  field="attdatnum"
                                  title="첨부"
                                  width={120}
                                  cell={FilesCell2}
                                />
                                <GridColumn
                                  field="remark"
                                  title="비고"
                                  width={150}
                                />
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
                                <GridColumn
                                  field="docunum"
                                  title="지시번호"
                                  width={200}
                                />
                                <GridColumn
                                  field="insert_userid"
                                  title="등록자"
                                  width={120}
                                />
                                <GridColumn
                                  field="ref_key"
                                  title="참조번호1"
                                  width={200}
                                />
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
                      </CustContext.Provider>
                    </FilesContext2.Provider>
                  </TypeContext.Provider>
                </GridContainer>
              )}
              <GridContainer
                width={
                  isVisibleDetail3
                    ? `calc(45% - ${GAP}px)`
                    : `calc(85% - ${GAP}px)`
                }
                height={"76.8vh"}
              >
                <GridTitleContainer>
                  <GridTitle>
                    <Button
                      themeColor={"primary"}
                      fillMode={"flat"}
                      icon={isVisibleDetail3 ? "chevron-left" : "chevron-right"}
                      onClick={() => setIsVisableDetail3((prev) => !prev)}
                    ></Button>
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
                  </ButtonContainer>
                </GridTitleContainer>
                <RichEditor
                  id="refEditor"
                  ref={refEditorRef}
                  change={onChanges}
                />
              </GridContainer>
            </GridContainerWrap>
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
          modal={true}
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
          modal={true}
        />
      )}
      {TaskOrderWindowVisible3 && (
        <TaskOrderWindow
          setVisible={setTaskOrderWindowVisible3}
          para={
            mainDataResult3.data.filter(
              (item) =>
                item[DATA_ITEM_KEY3] ==
                Object.getOwnPropertyNames(selectedState3)[0]
            )[0] == undefined
              ? {}
              : mainDataResult3.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY3] ==
                    Object.getOwnPropertyNames(selectedState3)[0]
                )[0]
          }
          type={"회의록"}
          reload={() => {
            setFilters((prev) => ({
              ...prev,
              findRowValue: Object.getOwnPropertyNames(selectedState3)[0],
              isSearch: true,
            }));
          }}
          modal={true}
        />
      )}
      {errorWindowVisible && (
        <ErrorWindow
          setVisible={setErrorWindowVisible}
          para={
            mainDataResult4.data.filter(
              (item) =>
                item[DATA_ITEM_KEY4] ==
                Object.getOwnPropertyNames(selectedState4)[0]
            )[0] == undefined
              ? {}
              : mainDataResult4.data.filter(
                  (item) =>
                    item[DATA_ITEM_KEY4] ==
                    Object.getOwnPropertyNames(selectedState4)[0]
                )[0]
          }
          reload2={() => onSetting()}
        />
      )}
    </>
  );
};
export default App;
