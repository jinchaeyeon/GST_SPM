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
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  GridToolbar,
} from "@progress/kendo-react-grid";
import {
  Checkbox,
  Input,
  InputChangeEvent,
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
import { TEditorHandle } from "../store/types";
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

const DATA_ITEM_KEY = "meetingnum";
const DETAIL_ITEM_KEY = "meetingseq";

const defaultDetailData = {
  work_type: "",
  unshared: false,
  orgdiv: "",
  meetingnum: "",
  attdatnum: "",
  attdatnum_private: "",
  files: "",
  files_private: "",
  cust_data: {
    custcd: "",
    custnm: "",
  },
  recdt: new Date(),
  place: "",
  meetingid: "",
  meetingnm: "",
  title: "",
  devmngnum: "",
  devproject: "",
  remark2: "",
};

const valueCodesQueryStr = `SELECT a.sub_code as code,
a.code_name as name
FROM comCodeMaster a 
WHERE a.group_code = 'BA012_GST'
AND use_yn = 'Y'`;

const projectQueryStr = (custcd: string) => {
  return `SELECT devmngnum + '|' + project as scalar_value
FROM CR500T A
WHERE (CASE WHEN ISNULL(A.findt, 'N') <> '' THEN 'Y' ELSE 'N' END) = 'N'
AND custcd = '${custcd}'
ORDER BY insert_time DESC`;
};

const valueCodesColumns = [
  {
    field: "code",
    header: "코드",
    width: 100,
  },
  {
    field: "name",
    header: "Value 구분",
    width: 100,
  },
];
const customersQueryStr = `SELECT custcd, custnm FROM ba020t WHERE useyn = 'Y'`;

const customersColumns = [
  {
    field: "custcd",
    header: "업체코드",
    width: 90,
  },
  {
    field: "custnm",
    header: "업체명",
    width: 150,
  },
];
const CodesContext = createContext<{
  valueCodes: any;
  customers: any;
}>({
  valueCodes: [],
  customers: [],
});

const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [meetingnum, setMeetingnum] = useState(""); //Detail 조회조건
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const history = useHistory();
  const filterRef = useRef<HTMLDivElement>(null);

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

  // 삭제할 첨부파일 리스트를 담는 함수
  const setDeletedAttadatnums = useSetRecoilState(deletedAttadatnumsState);

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState,
  );

  const [selectedDetailCustcd, setSelectedDetailCustcd] = useState("");

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);

  const [projectWindowVisible, setProjectWindowVisible] =
    useState<boolean>(false);

  const [attachmentsWindowVisiblePr, setAttachmentsWindowVisiblePr] =
    useState<boolean>(false);
  const [attachmentsWindowVisiblePb, setAttachmentsWindowVisiblePb] =
    useState<boolean>(false);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: DatePickerChangeEvent | InputChangeEvent) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const detailInputChange = (e: DatePickerChangeEvent | InputChangeEvent) => {
    const { value, name = "" }: any = e.target;

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const detailComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 프로젝트 자동세팅
    if (value) fetchProject(value.custcd);
  };

  const search = () => {
    // DB에 저장안된 첨부파일 서버에서 삭제
    if (unsavedAttadatnums.attdatnums.length > 0)
      setDeletedAttadatnums(unsavedAttadatnums);

    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      pgGap: 0,
      isFetch: true,
      isReset: true,
    }));
  };

  const idGetter = getter(DATA_ITEM_KEY);
  const detailIdGetter = getter(DETAIL_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [detailRowsState, setDetailRowsState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState),
  );
  const [isVisibleDetail, setIsVisableDetail] = useState(true);

  const [detailData, setDetailData] = useState(defaultDetailData);
  const [detailRows, setDetailRows] = useState<DataResult>(
    process([], detailRowsState),
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [valueCodesState, setValueCodesState] = useState(null);
  const [customersState, setCustomersState] = useState<null | []>(null);

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onDetailRowsStateChange = (event: GridDataStateChangeEvent) => {
    setDetailRowsState(event.dataState);
  };

  //메인 그리드 선택 이벤트 => 디테일 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    // DB에 저장안된 첨부파일 서버에서 삭제
    if (unsavedAttadatnums.attdatnums.length > 0)
      setDeletedAttadatnums(unsavedAttadatnums);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    const {
      orgdiv,
      unshared,
      meetingnum,
      attdatnum,
      attdatnum_private,
      files,
      files_private,
      custcd,
      custnm,
      recdt,
      place,
      meetingid,
      meetingnm,
      title,
      devmngnum,
      devproject,
      remark2,
    } = selectedRowData;

    setDetailData({
      work_type: "U",
      unshared: unshared === "Y" ? true : false,
      orgdiv,
      meetingnum,
      attdatnum,
      attdatnum_private,
      files,
      files_private,
      cust_data: {
        custcd,
        custnm,
      },
      recdt: toDate(recdt.replace("-", "").replace("-", "")) ?? new Date(),
      place,
      meetingid,
      meetingnm,
      title,
      devmngnum,
      devproject,
      remark2,
    });

    const id = selectedRowData["orgdiv"] + "_" + selectedRowData["meetingnum"];
    setMeetingnum(id);
  };
  const onDetailSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailSelectedState,
      dataItemKey: DETAIL_ITEM_KEY,
    });
    setDetailSelectedState(newSelectedState);
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (!filters.isFetch && chkScrollHandler(event, filters.pgNum, PAGE_SIZE))
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: prev.pgNum + 1,
      }));
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const refEditorRef = useRef<TEditorHandle>(null);

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate(),
  );

  type TFilters = {
    fromDate: Date;
    toDate: Date;
    custnm: string;
    contents: string;
    findRowValue: string;
    isFetch: boolean;
    isReset: boolean;
    pageSize: number;
    pgNum: number;
  };
  const [filters, setFilters] = useState<TFilters>({
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    contents: "",
    findRowValue: "",
    isFetch: true, // 조회여부 초기값
    isReset: true, // 리셋여부 초기값
    pageSize: PAGE_SIZE,
    pgNum: 1,
  });

  const fetchGrid = async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate,
      )}&toDate=${convertDateToStr(filters.toDate)}&custnm=${
        filters.custnm
      }&contents=${filters.contents}&findRowValue=${
        filters.findRowValue
      }&page=${filters.pgNum}&pageSize=${filters.pageSize}`,
    };

    try {
      data = await processApi<any>("meeting-list", para);
    } catch (error) {
      data = null;
    }

    setLoading(false);

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (filters.findRowValue !== "") {
          // 데이터 저장 후 조회
          console.log(filters.findRowValue);

          let spitFindRowValue = filters.findRowValue.split("_");

          setSelectedState({ [spitFindRowValue[1]]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt,
          });

          const selectedData = rows.find(
            (row: any) => row[DATA_ITEM_KEY] === filters.findRowValue,
          );
          if (!selectedData) return false;

          const {
            orgdiv,
            unshared,
            meetingnum,
            attdatnum,
            attdatnum_private,
            files,
            files_private,
            custcd,
            custnm,
            recdt,
            place,
            meetingid,
            meetingnm,
            title,
            devmngnum,
            devproject,
            remark2,
          } = selectedData;

          setMeetingnum(meetingnum);
          setDetailData({
            work_type: "U",
            unshared: unshared === "Y" ? true : false,
            orgdiv,
            meetingnum,
            attdatnum,
            attdatnum_private,
            files,
            files_private,
            cust_data: {
              custcd,
              custnm,
            },
            recdt: toDate(recdt) ?? new Date(),
            place,
            meetingid,
            meetingnm,
            title,
            devmngnum,
            devproject,
            remark2,
          });
        } else if (filters.isReset) {
          // 일반 데이터 조회
          setMainDataResult({
            data: rows,
            total: totalRowCnt,
          });

          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });

          const id = firstRowData["orgdiv"] + "_" + firstRowData["meetingnum"];
          setMeetingnum(id);

          const {
            orgdiv,
            unshared,
            meetingnum,
            attdatnum,
            attdatnum_private,
            files,
            files_private,
            custcd,
            custnm,
            recdt,
            place,
            meetingid,
            meetingnm,
            title,
            devmngnum,
            devproject,
            remark2,
          } = firstRowData;

          setDetailData({
            work_type: "U",
            unshared: unshared === "Y" ? true : false,
            orgdiv,
            meetingnum,
            attdatnum,
            attdatnum_private,
            files,
            files_private,
            cust_data: {
              custcd,
              custnm,
            },
            recdt: toDate(recdt) ?? new Date(),
            place,
            meetingid,
            meetingnm,
            title,
            devmngnum,
            devproject,
            remark2,
          });
        } else {
          // 스크롤하여 다른 페이지 조회
          setMainDataResult((prev) => {
            return {
              data: [...prev.data, ...rows],
              total: totalRowCnt,
            };
          });
        }
      } else {
        // 조회 데이터 없을 시 초기화
        setMainDataResult(process([], mainDataState));
        setDetailData(defaultDetailData);
        setDetailRows(process([], mainDataState));
        setSelectedState({});
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchDetail = async () => {
    let data: any;
    setLoading(true);

    const para = {
      para: meetingnum,
      doc: true,
    };

    try {
      data = await processApi<any>("meeting-detail", para);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.result.isSuccess === true) {
      const reference = data.reference;
      const rows = data.result.tables[0].Rows.map((row: any) => ({
        ...row,
        finexpdt: row.finexpdt ? toDate(row.finexpdt) : null,
        reqdt: row.reqdt ? toDate(row.reqdt) : null,
        client_finexpdt: row.client_finexpdt
          ? toDate(row.client_finexpdt)
          : null,
      }));

      // Edior에 HTML & CSS 세팅
      if (refEditorRef.current) {
        refEditorRef.current.setHtml(reference);
      }

      setDetailRows(process(rows, detailRowsState));
    } else {
      console.log("[에러발생]");
      console.log(data);

      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
    }
    setLoading(false);
  };

  const saveMeeting = async () => {
    const { cust_data, recdt, title } = detailData;
    let isValid = true;
    // 검증 로직
    if (!cust_data || !cust_data.custcd) {
      alert("업체명은 필수 입력 항목입니다");
      return false;
    }
    if (!recdt) {
      alert("회의일은 필수 입력 항목입니다");
      return false;
    }
    if (!title) {
      alert("회의 제목은 필수 입력 항목입니다.");
      return false;
    }

    setLoading(true);

    let editorContent: any = "";
    if (refEditorRef.current) {
      editorContent = refEditorRef.current.getContent();
    }
    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    type TDetailRowsArr = {
      meetingseq: string[];
      sort_seq: string[];
      contents: string[];
      value_code3: string[];
      cust_browserable: string[];
      reqdt: string[];
      finexpdt: string[];
      is_request: string[];
      client_name: string[];
      client_finexpdt: string[];
    };
    let detailRowsArr: TDetailRowsArr = {
      meetingseq: [],
      sort_seq: [],
      contents: [],
      value_code3: [],
      cust_browserable: [],
      reqdt: [],
      finexpdt: [],
      is_request: [],
      client_name: [],
      client_finexpdt: [],
    };

    for (const [idx, item] of detailRows.data.entries()) {
      const {
        rowstatus,
        meetingseq,
        contents,
        value_code3,
        cust_browserable,
        reqdt,
        finexpdt,
        is_request,
        client_name,
        client_finexpdt,
      } = item;

      // 요구사항 체크 시, Value 구분 필수입력
      if (getYn(is_request) === "Y" && !getCodeFromValue(value_code3, "code")) {
        alert(idx + 1 + "행의 Value 구분을 입력하세요.");
        isValid = false;
        break;
      }

      detailRowsArr.meetingseq.push(rowstatus === "N" ? "0" : meetingseq);
      detailRowsArr.sort_seq.push(String(idx + 1));
      detailRowsArr.contents.push(contents);
      detailRowsArr.value_code3.push(getCodeFromValue(value_code3, "code"));
      detailRowsArr.cust_browserable.push(getYn(cust_browserable));
      detailRowsArr.reqdt.push(convertDateToStr(reqdt));
      detailRowsArr.finexpdt.push(convertDateToStr(finexpdt));
      detailRowsArr.is_request.push(getYn(is_request));
      detailRowsArr.client_name.push(client_name);
      detailRowsArr.client_finexpdt.push(convertDateToStr(client_finexpdt));
    }

    if (!isValid) {
      setLoading(false);
      return false;
    }
    const parameters = {
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_meeting",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_orgdiv": detailData.orgdiv,
        "@p_meetingnum": detailData.meetingnum,
        "@p_custcd": detailData.cust_data.custcd,
        "@p_recdt": convertDateToStr(detailData.recdt),
        "@p_meetingid": detailData.meetingid,
        "@p_meetingnm": detailData.meetingnm,
        "@p_place": detailData.place,
        "@p_title": detailData.title,
        "@p_remark": detailData.remark2,
        "@p_attdatnum": detailData.attdatnum,
        "@p_attdatnum_private": detailData.attdatnum_private,
        "@p_unshared": getYn(detailData.unshared),
        "@p_devmngnum": detailData.devmngnum,
        "@p_meetingseq": detailRowsArr.meetingseq.join("|"),
        "@p_sort_seq": detailRowsArr.sort_seq.join("|"),
        "@p_contents": detailRowsArr.contents.join("|"),
        "@p_value_code3": detailRowsArr.value_code3.join("|"),
        "@p_cust_browserable": detailRowsArr.cust_browserable.join("|"),
        "@p_reqdt": detailRowsArr.reqdt.join("|"),
        "@p_finexpdt": detailRowsArr.finexpdt.join("|"),
        "@p_is_request": detailRowsArr.is_request.join("|"),
        "@p_client_name": detailRowsArr.client_name.join("|"),
        "@p_client_finexpdt": detailRowsArr.client_finexpdt.join("|"),
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    let data: any;
    try {
      data = await processApi<any>("meeting-save", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      // unsaved 첨부파일 초기화
      setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);

      const { returnString } = data;

      // 조회
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: 1,
        findRowValue: returnString,
      }));
    } else {
      console.log("[에러발생]");
      console.log(data);
      if (data.hasOwnProperty("resultMessage")) {
        alert(data["resultMessage"]);
      }
    }
    setLoading(false);
  };

  const downloadDoc = async () => {
    let response: any;

    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId,
    );

    const id = selectedRow.orgdiv + "_" + selectedRow.meetingnum;
    const para = {
      para: "doc?type=Meeting&id=" + id,
    };

    setLoading(true);
    try {
      response = await processApi<any>("doc-download", para);
    } catch (error) {
      response = null;
    }

    if (response !== null) {
      const blob = new Blob([response.data]);

      // blob을 사용해 객체 URL을 생성합니다.
      const fileObjectUrl = window.URL.createObjectURL(blob);

      // blob 객체 URL을 설정할 링크를 만듭니다.
      const link = document.createElement("a");
      link.href = fileObjectUrl;
      link.style.display = "none";

      // 다운로드 파일 이름을 지정 할 수 있습니다.
      // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.
      link.download = extractDownloadFilename(response);

      // 다운로드 파일의 이름은 직접 지정 할 수 있습니다.
      // link.download = "sample-file.xlsx";

      // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
    }

    setLoading(false);
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchValueCodes();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (filters.isFetch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);

      // 그리드 조회
      fetchGrid(deepCopiedFilters);

      // 기본값으로 세팅
      setFilters((prev) => ({
        ...prev,
        isFetch: false,
        isReset: false,
        findRowValue: "",
      }));
    }
  }, [filters]);

  useEffect(() => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    if (mainDataId) fetchDetail();
  }, [selectedState]);

  const getAttachmentsDataPr = (data: IAttachmentData) => {
    if (!detailData.attdatnum_private) {
      setUnsavedAttadatnums((prev) => ({
        type: "meeting",
        attdatnums: [...prev.attdatnums, ...[data.attdatnum]],
      }));
    }
    setDetailData((prev) => ({
      ...prev,
      attdatnum_private: data.attdatnum,
      files_private:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
    }));
  };

  const getAttachmentsDataPb = (data: IAttachmentData) => {
    if (!detailData.attdatnum) {
      setUnsavedAttadatnums((prev) => ({
        type: "meeting",
        attdatnums: [...prev.attdatnums, ...[data.attdatnum]],
      }));
    }
    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.attdatnum,
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
    }));
  };

  const setCustData = (data: ICustData) => {
    setDetailData((prev: any) => ({
      ...prev,
      cust_data: {
        custcd: data.custcd,
        custnm: data.custnm,
      },
    }));

    fetchProject(data.custcd);
  };
  const setProjectData = (data: IPrjData) => {
    setDetailData((prev: any) => ({
      ...prev,
      devmngnum: data.devmngnum,
      devproject: data.project,
    }));
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };
  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detailRows.total}건
      </td>
    );
  };

  const onDetailItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(event, detailRows, setDetailRows, DETAIL_ITEM_KEY);
  };

  const enterEdit = (dataItem: any, field: string) => {
    const newData = detailRows.data.map((item) =>
      item[DETAIL_ITEM_KEY] === dataItem[DETAIL_ITEM_KEY]
        ? {
            ...item,
            rowstatus: item.rowstatus === "N" ? "N" : "U",
            [EDIT_FIELD]: field,
          }
        : {
            ...item,
            [EDIT_FIELD]: undefined,
          },
    );

    setDetailRows((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    const newData = detailRows.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setDetailRows((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
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

  const createMeeting = () => {
    setMeetingnum("");
    setSelectedState({});
    setDetailData({ ...defaultDetailData, work_type: "N" });
    setDetailRows(process([], detailRowsState));

    // Edior에 HTML & CSS 세팅
    if (refEditorRef.current) {
      refEditorRef.current.setHtml("");
    }
  };

  const deleteMeeting = async () => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId,
    );

    if (
      !window.confirm(
        "[" +
          selectedRow.custnm +
          " '" +
          selectedRow.title +
          "']의 데이터를 삭제하시겠습니까?",
      )
    ) {
      return false;
    }
    let data: any;
    setLoading(true);

    const para = { id: selectedRow.orgdiv + "_" + selectedRow.meetingnum };

    try {
      data = await processApi<any>("meeting-delete", para);
    } catch (error: any) {
      data = null;
    }
    if (data && data.isSuccess === true) {
      // 첨부파일 서버에서 삭제
      if (unsavedAttadatnums.attdatnums.length > 0) {
        // DB 저장안된 첨부파일
        setDeletedAttadatnums(unsavedAttadatnums);
      } else if (detailData.attdatnum || detailData.attdatnum_private) {
        // DB 저장된 첨부파일
        setDeletedAttadatnums({
          type: "meeting",
          attdatnums: [detailData.attdatnum, detailData.attdatnum_private],
        });
      }
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        isReset: true,
      }));
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  // 디테일 그리드 선택 행 추가
  const addDetailRow = () => {
    const selectedKey = Number(Object.keys(detailSelectedState)[0]);
    const selectedIndex = detailRows.data.findIndex(
      (row) => row.meetingseq === selectedKey,
    );

    let newRows = [...detailRows.data];

    if (selectedIndex !== -1) {
      // 선택된 행이 있을 경우, 해당 행 다음에 새 데이터 삽입
      newRows.splice(selectedIndex + 1, 0, {
        rowstatus: "N",
        meetingseq: detailRows.total + 1,
        reqdt: null,
        finexpdt: null,
        cust_browserable: "Y",
        client_finexpdt: null,
      });
    } else {
      // 선택된 행이 없을 경우, 배열의 끝에 새 데이터 추가
      newRows.push({
        rowstatus: "N",
        meetingseq: detailRows.total + 1,
        reqdt: null,
        finexpdt: null,
        cust_browserable: "Y",
        client_finexpdt: null,
      });
    }

    setDetailRows(process(newRows, detailRowsState));
  };

  // 디테일 그리드 선택 행 삭제
  const removeDetailRow = () => {
    const selectedKey = Object.keys(detailSelectedState)[0];
    const selectedIndex = detailRows.data.findIndex(
      (row) => row.meetingseq.toString() === selectedKey,
    );

    if (selectedIndex !== -1) {
      let newRows = [...detailRows.data];
      newRows.splice(selectedIndex, 1);

      // 삭제행의 다음행의 index를 계산
      let nextSelectedIndex =
        selectedIndex === newRows.length ? selectedIndex - 1 : selectedIndex;

      // 데이터 업데이트
      setDetailRows((prev) => process(newRows, detailRowsState));

      // selectedState 업데이트
      if (newRows.length > 0) {
        setDetailSelectedState({
          [newRows[nextSelectedIndex].meetingseq]: true,
        });
      } else {
        setDetailSelectedState({});
      }
    } else {
      console.log("No row selected");
    }
  };

  // 디테일 그리드 위로 행이동
  const upDetailRow = () => {
    const selectedKey = Object.keys(detailSelectedState)[0];
    const selectedIndex = detailRows.data.findIndex(
      (row) => row.meetingseq.toString() === selectedKey,
    );

    if (selectedIndex > 0) {
      let newRows = [...detailRows.data];
      const item = newRows.splice(selectedIndex, 1)[0];
      newRows.splice(selectedIndex - 1, 0, item);
      setDetailRows((prev) => process(newRows, detailRowsState));
    } else {
      console.log("Row is already at the top");
    }
  };

  // 디테일 그리드 아래로 행이동
  const downDetailRow = () => {
    const selectedKey = Object.keys(detailSelectedState)[0];
    const selectedIndex = detailRows.data.findIndex(
      (row) => row.meetingseq.toString() === selectedKey,
    );

    if (selectedIndex < detailRows.data.length - 1) {
      let newRows = [...detailRows.data];
      const item = newRows.splice(selectedIndex, 1)[0];
      newRows.splice(selectedIndex + 1, 0, item);
      setDetailRows((prev) => process(newRows, detailRowsState));
    } else {
      console.log("Row is already at the bottom");
    }
  };

  const fetchValueCodes = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(valueCodesQueryStr));

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
      setValueCodesState(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };
  const fetchCustomers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(customersQueryStr));

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
      setCustomersState(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };
  const fetchProject = async (custcd: string) => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(projectQueryStr(custcd)));

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

      if (rows.length > 0) {
        const scalarValue = rows[0].scalar_value;
        const splitValue = scalarValue.split("|");

        setDetailData((prev) => ({
          ...prev,
          devmngnum: splitValue[0],
          devproject: splitValue[1],
        }));
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const [custFilter, setCustFilter] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setCustFilter(event.filter);
    }
  };

  return (
    <>
      <CodesContext.Provider
        value={{ valueCodes: valueCodesState, customers: customersState }}
      >
        <TitleContainer>
          <Title>회의록 관리</Title>
          <ButtonContainer>
            <Button onClick={search} icon="search" themeColor={"primary"}>
              조회
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="file-add"
              onClick={createMeeting}
            >
              신규
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="save"
              onClick={saveMeeting}
            >
              저장
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              icon="delete"
              onClick={deleteMeeting}
            >
              삭제
            </Button>
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
        </TitleContainer>

        <GridContainerWrap height={"90%"}>
          <GridContainer width={`25%`}>
            <GridTitleContainer>
              <GridTitle>조회조건</GridTitle>
            </GridTitleContainer>
            <FilterBoxWrap ref={filterRef}>
              <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
                <tbody>
                  <tr>
                    <th>회의일</th>
                    <td>
                      <div className="filter-item-wrap">
                        <DatePicker
                          name="fromDate"
                          value={filters.fromDate}
                          format="yyyy-MM-dd"
                          onChange={filterInputChange}
                          placeholder=""
                        />
                        ~
                        <DatePicker
                          name="toDate"
                          value={filters.toDate}
                          format="yyyy-MM-dd"
                          onChange={filterInputChange}
                          placeholder=""
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
                    <th>제목 및 내용</th>
                    <td colSpan={3}>
                      <Input
                        name="contents"
                        type="text"
                        value={filters.contents}
                        onChange={filterInputChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </FilterBox>
            </FilterBoxWrap>
            <GridTitleContainer>
              <GridTitle>요약정보</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{
                height: `calc(100% - 65px - ${
                  filterRef.current ? filterRef.current.offsetHeight : 0
                }px)`,
              }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  recdt: dateformat2(row.recdt),
                  [SELECTED_FIELD]: selectedState[idGetter(row)],
                })),
                mainDataState,
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
              onScroll={onMainScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onMainSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
            >
              <GridColumn
                field="recdt"
                title="회의일"
                width={95}
                cell={CenterCell}
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="custnm" title="업체" width={100} />
              <GridColumn field="title" title="제목" width={300} />
            </Grid>
          </GridContainer>
          <GridContainer width={`calc(50% - ${GAP}px)`}>
            <GridTitleContainer>
              <GridTitle>회의록</GridTitle>
              <Button
                themeColor={"primary"}
                fillMode={"flat"}
                icon={isVisibleDetail ? "chevron-up" : "chevron-down"}
                onClick={() => setIsVisableDetail((prev) => !prev)}
              ></Button>
            </GridTitleContainer>
            {isVisibleDetail && (
              <FormBoxWrap border>
                <FormBox>
                  <tbody>
                    <tr>
                      <th>회의록 번호</th>
                      <td>
                        <Input
                          name="meetingnum"
                          value={detailData.meetingnum}
                          className="readonly"
                        />
                      </td>
                      <th>업체 비공유</th>
                      <td style={{ textAlign: "left" }}>
                        <Checkbox
                          name="unshared"
                          value={detailData.unshared}
                          onChange={() =>
                            setDetailData((prev) => ({
                              ...prev,
                              unshared: !prev.unshared,
                            }))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>업체코드</th>
                      <td>
                        <div className="filter-item-wrap">
                          <Input
                            name="custcd"
                            value={
                              detailData.cust_data
                                ? detailData.cust_data.custcd
                                : ""
                            }
                            className="readonly"
                          />
                          <Button
                            icon="more-horizontal"
                            fillMode={"flat"}
                            onClick={() => setCustWindowVisible(true)}
                          />
                        </div>
                      </td>
                      <th>업체명</th>
                      <td>
                        {customersState && (
                          <MultiColumnComboBox
                            name="cust_data"
                            data={
                              custFilter
                                ? filterBy(customersState, custFilter)
                                : customersState
                            }
                            value={detailData.cust_data}
                            columns={customersColumns}
                            textField={"custnm"}
                            onChange={detailComboBoxChange}
                            className="required"
                            filterable={true}
                            onFilterChange={handleFilterChange}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>회의일</th>
                      <td>
                        <DatePicker
                          name="recdt"
                          value={detailData.recdt}
                          format="yyyy-MM-dd"
                          onChange={detailInputChange}
                          placeholder=""
                          className="required"
                        />
                      </td>
                      <th>회의 장소</th>
                      <td>
                        <Input
                          name="place"
                          value={detailData.place}
                          onChange={detailInputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>회의록ID</th>
                      <td>
                        <Input
                          name="meetingid"
                          value={detailData.meetingid}
                          onChange={detailInputChange}
                        />
                      </td>
                      <th>회의록명</th>
                      <td>
                        <Input
                          name="meetingnm"
                          value={detailData.meetingnm}
                          onChange={detailInputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>회의 제목</th>
                      <td>
                        <Input
                          name="title"
                          value={detailData.title}
                          onChange={detailInputChange}
                          className="required"
                        />
                      </td>
                      <th>프로젝트</th>
                      <td>
                        <div className="filter-item-wrap">
                          <Input
                            name="devproject"
                            value={detailData.devproject}
                            className="readonly"
                          />
                          <Button
                            icon="more-horizontal"
                            fillMode={"flat"}
                            onClick={() => setProjectWindowVisible(true)}
                            style={{
                              right: "28.56px",
                            }}
                          />
                          <Button
                            icon="x"
                            fillMode={"flat"}
                            onClick={() =>
                              setProjectData({
                                devmngnum: "",
                                project: "",
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>첨부파일</th>
                      <td>
                        <div className="filter-item-wrap">
                          <Input
                            name="files"
                            value={detailData.files}
                            className="readonly"
                          />
                          <Button
                            icon="more-horizontal"
                            fillMode={"flat"}
                            onClick={() => setAttachmentsWindowVisiblePb(true)}
                          />
                        </div>
                      </td>
                      <th>
                        첨부파일
                        <br />
                        (비공개)
                      </th>
                      <td>
                        <div className="filter-item-wrap">
                          <Input
                            name="files_private"
                            value={detailData.files_private}
                            className="readonly"
                          />
                          <Button
                            icon="more-horizontal"
                            fillMode={"flat"}
                            onClick={() => setAttachmentsWindowVisiblePr(true)}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>비고</th>
                      <td colSpan={3}>
                        <Input
                          name="remark2"
                          value={detailData.remark2}
                          onChange={detailInputChange}
                        />
                      </td>
                    </tr>
                  </tbody>
                </FormBox>
              </FormBoxWrap>
            )}

            <Grid
              style={{
                height: isVisibleDetail
                  ? `calc(100% - 291.94px - 40px - 10px)`
                  : `calc(100% - 35px )`,
              }}
              data={process(
                detailRows.data.map((row) => ({
                  ...row,
                  [SELECTED_FIELD]: detailSelectedState[detailIdGetter(row)],
                })),
                detailRowsState,
              )}
              {...detailRowsState}
              onDataStateChange={onDetailRowsStateChange}
              //선택 기능
              dataItemKey={DETAIL_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "single",
              }}
              onSelectionChange={onDetailSelectionChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //incell 수정 기능
              onItemChange={onDetailItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridToolbar>
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="plus"
                  onClick={addDetailRow}
                />
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="minus"
                  onClick={removeDetailRow}
                />
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="chevron-up"
                  onClick={upDetailRow}
                />
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  icon="chevron-down"
                  onClick={downDetailRow}
                />
              </GridToolbar>
              <GridColumn
                field="rowstatus"
                title=" "
                width={40}
                editable={false}
              />
              <GridColumn
                field="contents"
                title="내용"
                width={500}
                footerCell={detailTotalFooterCell}
                cell={NameCell}
              />
              <GridColumn
                field="finexpdt"
                title="완료예정일"
                width={170}
                cell={DateCell}
              />
              <GridColumn
                field="reqdt"
                title="요청일"
                width={170}
                cell={DateCell}
              />
              <GridColumn
                field="is_request"
                title="요구사항"
                width={120}
                cell={CheckBoxCell}
              />
              <GridColumn
                field="cust_browserable"
                title="고객열람"
                width={100}
                cell={CheckBoxCell}
              />
              <GridColumn
                field="value_code3"
                title="Value 구분"
                width={160}
                cell={ValueCodesComboBoxCell}
              />
              <GridColumn
                field="client_name"
                title="고객담당자"
                width={100}
                cell={NameCell}
              />
              <GridColumn
                field="client_finexpdt"
                title="고객완료예정일"
                width={170}
                cell={DateCell}
              />
            </Grid>
          </GridContainer>
          <GridContainer width={`calc(40% - ${GAP}px)`}>
            <GridTitleContainer>
              <GridTitle>참고자료</GridTitle>
            </GridTitleContainer>
            <RichEditor id="refEditor" ref={refEditorRef} />
          </GridContainer>
        </GridContainerWrap>

        {attachmentsWindowVisiblePr && (
          <AttachmentsWindow
            type="meeting"
            setVisible={setAttachmentsWindowVisiblePr}
            setData={getAttachmentsDataPr}
            para={detailData.attdatnum_private}
          />
        )}
        {attachmentsWindowVisiblePb && (
          <AttachmentsWindow
            type="meeting"
            setVisible={setAttachmentsWindowVisiblePb}
            setData={getAttachmentsDataPb}
            para={detailData.attdatnum}
          />
        )}
        {custWindowVisible && (
          <CustomersWindow
            workType=""
            setVisible={setCustWindowVisible}
            setData={setCustData}
          />
        )}
        {projectWindowVisible && (
          <ProjectsWindow
            setVisible={setProjectWindowVisible}
            setData={setProjectData}
            para={{ cust_data: detailData.cust_data }}
          />
        )}
      </CodesContext.Provider>
    </>
  );
};
export default App;

const ValueCodesComboBoxCell = (props: GridCellProps) => {
  const { valueCodes } = useContext(CodesContext);

  return valueCodes ? (
    <ComboBoxCell
      columns={valueCodesColumns}
      data={valueCodes}
      textField="name"
      valueField="code"
      {...props}
    />
  ) : (
    <td />
  );
};
