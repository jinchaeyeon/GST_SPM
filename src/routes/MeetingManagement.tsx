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
  DatePicker,
  DatePickerChangeEvent,
} from "@progress/kendo-react-dateinputs";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
} from "@progress/kendo-react-dropdowns";
import  secureLocalStorage  from  "react-secure-storage";
import {
  Grid,
  GridCellProps,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
  GridToolbar,
  getSelectedState,
} from "@progress/kendo-react-grid";
import {
  Checkbox,
  Input,
  InputChangeEvent,
} from "@progress/kendo-react-inputs";
import { Splitter, SplitterOnChangeEvent } from "@progress/kendo-react-layout";
import { bytesToBase64 } from "byte-base64";
import React, {
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
  FilterBox,
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
import NameCell from "../components/Cells/NameCell";
import {
  UseParaPc,
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  extractDownloadFilename,
  getCodeFromValue,
  getDeviceHeight,
  getGridItemChangedData,
  getHeight,
  getYn,
  handleKeyPressSearch,
  toDate,
} from "../components/CommonFunction";
import {
  EDIT_FIELD,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import FilterContainer from "../components/FilterContainer";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ProjectsWindow from "../components/Windows/CommonWindows/ProjectsWindow";
import SignWindow from "../components/Windows/CommonWindows/SignWindow";
import { useApi } from "../hooks/api";
import { ICustData, IPrjData } from "../hooks/interfaces";
import { isLoading, loginResultState, titles } from "../store/atoms";
import { TEditorHandle } from "../store/types";
import CustomMultiColumnComboBox from "../components/ComboBoxes/CustomMultiColumnComboBox";

const DATA_ITEM_KEY = "meetingnum";
const DETAIL_ITEM_KEY = "meetingseq";

const defaultDetailData = {
  work_type: "N",
  unshared: true,
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

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;
var height7 = 0;

const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [fileList2, setFileList2] = useState<FileList | any[]>([]);
  const [savenmList2, setSavenmList2] = useState<string[]>([]);
  const location = useLocation();
  const [title, setTitle] = useRecoilState(titles);
  const [swiper, setSwiper] = useState<SwiperCore>();
  const refEditorRef = useRef<TEditorHandle>(null);
  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [mobileheight4, setMobileHeight4] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [webheight4, setWebHeight4] = useState(0);
  let editorContent: any = refEditorRef.current?.getContent();
  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".ButtonContainer4");
    height5 = getHeight(".ButtonContainer5");
    height6 = getHeight(".FormBoxWrap");
    height7 = getHeight(".TitleContainer");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height2 - height7);
      setMobileHeight2(getDeviceHeight(true) - height3 - height7);
      setMobileHeight3(getDeviceHeight(true) - height4 - height7);
      setMobileHeight4(getDeviceHeight(true) - height5 - height7);

      setWebHeight(getDeviceHeight(true) - height - height2 - height7);
      setWebHeight2(getDeviceHeight(false) - height3 - height6 - height7 - 3);
      setWebHeight3(getDeviceHeight(false) - height3 - height7 - 2);
      setWebHeight4(getDeviceHeight(false) - height4 - height7);
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3]);
  useEffect(() => {
    if (
      isMobile == true &&
      deviceWidth <= 1200 &&
      refEditorRef.current != null
    ) {
      refEditorRef.current.setHtml(editorContent);
    }
    if (
      isMobile == false &&
      deviceWidth > 1200 &&
      refEditorRef.current != null
    ) {
      refEditorRef.current.setHtml(editorContent);
    }
  }, [isMobile]);
  const pathname = location.pathname.replace("/", "");
  const history = useHistory();
  const [workType, setWorktype] = useState("U");
  useEffect(() => {
    // 접근 권한 검증
    if (loginResult) {
      const role = loginResult ? loginResult.role : "";
      const isAdmin = role === "ADMIN";

      if (!isAdmin && secureLocalStorage.getItem("accessToken")) {
        alert("접근 권한이 없습니다.");
        history.goBack();
      }
    }
  }, [loginResult]);

  const [errorstate, setErrorState] = useState(true);

  const [selectedDetailCustcd, setSelectedDetailCustcd] = useState("");

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [signWindowVisible, setSignWindowVisible] = useState<boolean>(false);

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
    if (errorstate == false || getState() == false) {
      if (!window.confirm("작성 중인 내용이 삭제됩니다. 조회하시겠습니까?")) {
        return false;
      }
    }
    setErrorState(true);
    setFileList([]);
    setSavenmList([]);
    setFileList2([]);
    setSavenmList2([]);
    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      pgGap: 0,
      isFetch: true,
      isReset: true,
    }));
    if (swiper && isMobile) {
      swiper.slideTo(0);
    }
  };

  const idGetter = getter(DATA_ITEM_KEY);
  const detailIdGetter = getter(DETAIL_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [detailRowsState, setDetailRowsState] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [isVisibleDetail, setIsVisableDetail] = useState(true);

  const [detailData, setDetailData] = useState(defaultDetailData);
  const [detailRows, setDetailRows] = useState<DataResult>(
    process([], detailRowsState)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
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
    if (errorstate == false || getState() == false) {
      if (!window.confirm("작성 중인 내용이 삭제됩니다. 조회하시겠습니까?")) {
        return false;
      }
    }
    setErrorState(true);
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
    setFileList([]);
    setSavenmList([]);
    setFileList2([]);
    setSavenmList2([]);
    setWorktype("U");
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
    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
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
    if (
      !filters.isFetch &&
      filters.pgNum * PAGE_SIZE < mainDataResult.total &&
      chkScrollHandler(event, filters.pgNum, PAGE_SIZE)
    )
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: prev.pgNum + 1,
      }));
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
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
        filters.fromDate
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

    if (data != null) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (filters.findRowValue !== "") {
          // 데이터 저장 후 조회
          const spitFindRowValue = filters.findRowValue.split("_");
          const selectedMeetingnum = spitFindRowValue[1];

          setSelectedState({ [selectedMeetingnum]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });

          const selectedData = rows.find(
            (row: any) => row[DATA_ITEM_KEY] === selectedMeetingnum
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
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });

          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });

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
              total: totalRowCnt == -1 ? 0 : totalRowCnt,
            };
          });
        }
        setWorktype("U");
      } else {
        // 조회 데이터 없을 시 초기화
        setMainDataResult(process([], mainDataState));
        setDetailData(defaultDetailData);
        setDetailRows(process([], mainDataState));
        setSelectedState({});
        setWorktype("N");
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchDetail = async () => {
    let data: any;
    setLoading(true);

    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    const selectedRowData = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId
    );

    const id = selectedRowData["orgdiv"] + "_" + selectedRowData["meetingnum"];

    const para = {
      para: id,
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

  const saveMeeting = async () => {
    if (!navigator.onLine) {
      alert("네트워크 연결상태를 확인해주세요.");
      setLoading(false);
      return false;
    }
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

    let newAttachmentNumber = "";
    const promises = [];

    for (const file of fileList) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (detailData.attdatnum == "" && newAttachmentNumber == "") {
        newAttachmentNumber = await uploadFile(
          file,
          "meeting",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "meeting",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "meeting", detailData.attdatnum);
      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // 실패한 파일이 있는지 확인
    if (results.includes(null)) {
      alert("파일 업로드에 실패했습니다.");
    } else {
      setDetailData((prev) => ({
        ...prev,
        attdatnum: results[0],
      }));
    }

    let data2: any;
    let type = "meeting";
    savenmList.map(async (parameter: any) => {
      try {
        data2 = await processApi<any>("file-delete", {
          type,
          attached: parameter,
        });
      } catch (error) {
        data2 = null;
      }
    });

    let newAttachmentNumber2 = "";
    const promises2 = [];

    for (const file of fileList2) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (detailData.attdatnum_private == "" && newAttachmentNumber2 == "") {
        newAttachmentNumber2 = await uploadFile(
          file,
          "meeting",
          detailData.attdatnum_private
        );
        const promise = newAttachmentNumber2;
        promises2.push(promise);
        continue;
      }

      const promise = newAttachmentNumber2
        ? await uploadFile(
            file,
            "meeting",
            detailData.attdatnum_private,
            newAttachmentNumber2
          )
        : await uploadFile(file, "meeting", detailData.attdatnum_private);
      promises2.push(promise);
    }

    const results2 = await Promise.all(promises2);

    // 실패한 파일이 있는지 확인
    if (results2.includes(null)) {
      alert("파일 업로드에 실패했습니다.");
    } else {
      setDetailData((prev) => ({
        ...prev,
        attdatnum_private: results2[0],
      }));
    }

    let data3: any;
    savenmList2.map(async (parameter: any) => {
      try {
        data3 = await processApi<any>("file-delete", {
          type,
          attached: parameter,
        });
      } catch (error) {
        data3 = null;
      }
    });

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
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_attdatnum_private":
          results2[0] == undefined ? detailData.attdatnum_private : results2[0],
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

    if (data != null) {
      setFileList([]);
      setSavenmList([]);
      setFileList2([]);
      setSavenmList2([]);
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
    if (workType == "N") {
      alert("신규 등록은 다운로드가 불가능합니다.");
    } else if (mainDataResult.total == 0) {
      alert("데이터가 없습니다.");
    } else {
      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

      if (!mainDataId) {
        alert("선택된 자료가 없습니다.");
        return false;
      }
      const selectedRow = mainDataResult.data.find(
        (item) => item[DATA_ITEM_KEY] === mainDataId
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

        let name = extractDownloadFilename(response);
        link.download = name.replace("회의록", detailData.title);
        // 다운로드 파일의 이름은 직접 지정 할 수 있습니다.
        // link.download = "sample-file.xlsx";

        // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    if (secureLocalStorage.getItem("accessToken")) {
      fetchValueCodes();
      fetchCustomers();
      setTitle("회의록 관리");
    }
  }, []);

  useEffect(() => {
    if (filters.isFetch && secureLocalStorage.getItem("accessToken")) {
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
    if (secureLocalStorage.getItem("accessToken")) {
      // ComboBox에 사용할 코드 리스트 조회
      fetchValueCodes();
      fetchCustomers();
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          isFetch: true,
          isReset: true,
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("회의록 관리");
    }
  }, []);

  useEffect(() => {
    if (secureLocalStorage.getItem("accessToken")) {
      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
      if (mainDataId) fetchDetail();
    }
  }, [selectedState]);

  const getAttachmentsDataPr = (
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

    setDetailData((prev) => ({
      ...prev,
      attdatnum_private:
        data.length > 0 ? data[0].attdatnum : prev.attdatnum_private,
      files_private:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  const getAttachmentsDataPb = (
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

    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.length > 0 ? data[0].attdatnum : prev.attdatnum,
      files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
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
    setDetailRows((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const exitEdit = () => {
    if (tempResult.data != detailRows.data) {
      const newData = detailRows.data.map((item) =>
        item[DETAIL_ITEM_KEY] ==
        Object.getOwnPropertyNames(detailSelectedState)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus === "N" ? "N" : "U",
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
      setDetailRows((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = detailRows.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setDetailRows((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
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
    if (errorstate == false || getState() == false) {
      if (!window.confirm("작성 중인 내용이 삭제됩니다. 조회하시겠습니까?")) {
        return false;
      }
    }
    setErrorState(true);
    setDetailData({ ...defaultDetailData, recdt: new Date() });
    setDetailRows(process([], detailRowsState));

    // Edior에 HTML & CSS 세팅
    if (refEditorRef.current) {
      refEditorRef.current.setHtml("");
    }
    setWorktype("N");

    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
  };

  const deleteMeeting = async () => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId
    );

    if (
      !window.confirm(
        "[" +
          selectedRow.custnm +
          " '" +
          selectedRow.title +
          "']의 데이터를 삭제하시겠습니까?"
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
      let data2: any;
      try {
        data2 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=meeting&attachmentNumber=" +
            selectedRow.attdatnum +
            "&id=",
        });
      } catch (error) {
        data2 = null;
      }

      let data3: any;
      try {
        data3 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=meeting&attachmentNumber=" +
            selectedRow.attdatnum_private +
            "&id=",
        });
      } catch (error) {
        data3 = null;
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
      (row) => row.meetingseq === selectedKey
    );

    let newRows = [...detailRows.data];

    let maxMeetingSeq =
      detailRows.total > 0
        ? Math.max(...detailRows.data.map((item) => item.meetingseq))
        : 0;

    if (selectedIndex !== -1) {
      // 선택된 행이 있을 경우, 해당 행 다음에 새 데이터 삽입
      newRows.splice(selectedIndex + 1, 0, {
        rowstatus: "N",
        meetingseq: maxMeetingSeq + 1,
        reqdt: null,
        finexpdt: null,
        cust_browserable: "Y",
        client_finexpdt: null,
      });
    } else {
      // 선택된 행이 없을 경우, 배열의 끝에 새 데이터 추가
      newRows.push({
        rowstatus: "N",
        meetingseq: maxMeetingSeq + 1,
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
      (row) => row.meetingseq.toString() === selectedKey
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
      (row) => row.meetingseq.toString() === selectedKey
    );

    if (selectedIndex > 0) {
      let newRows = [...detailRows.data];
      const item = newRows.splice(selectedIndex, 1)[0];
      newRows.splice(selectedIndex - 1, 0, item);
      const newDatas = newRows.map((item) =>
        item[DETAIL_ITEM_KEY] == selectedKey
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              [EDIT_FIELD]: undefined,
            }
          : item[DETAIL_ITEM_KEY] === newRows[selectedIndex][DETAIL_ITEM_KEY]
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

      setDetailRows((prev) => process(newDatas, detailRowsState));
    } else {
      console.log("Row is already at the top");
    }
  };

  // 디테일 그리드 아래로 행이동
  const downDetailRow = () => {
    const selectedKey = Object.keys(detailSelectedState)[0];
    const selectedIndex = detailRows.data.findIndex(
      (row) => row.meetingseq.toString() === selectedKey
    );

    if (selectedIndex < detailRows.data.length - 1) {
      let newRows = [...detailRows.data];
      const item = newRows.splice(selectedIndex, 1)[0];
      newRows.splice(selectedIndex + 1, 0, item);
      const newDatas = newRows.map((item) =>
        item[DETAIL_ITEM_KEY] == selectedKey
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
              [EDIT_FIELD]: undefined,
            }
          : item[DETAIL_ITEM_KEY] === newRows[selectedIndex][DETAIL_ITEM_KEY]
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
      setDetailRows((prev) => process(newDatas, detailRowsState));
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

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const targetElement = e.target as HTMLElement; // 타입 단언(Type Assertion) 사용

    if (!targetElement.tagName || !targetElement.tagName.match(/(input)/i)) {
      // input에 포커스 되어있을때만 실행
      return;
    }

    // 클립보드 텍스트 가져오기
    const clipboardData = e.clipboardData.getData("text");

    // 엔터나 탭 포함 없으면 return
    const hasTabOrNewLine =
      clipboardData.includes("\t") || clipboardData.includes("\n");
    if (!hasTabOrNewLine) {
      return false;
    }

    // 엔터를 기준으로 행 나누기
    const rows = clipboardData.split("\n");

    // meetingseq 최대값 구하기
    let maxMeetingSeq = Math.max(
      ...detailRows.data.map((item) => item.meetingseq)
    );

    // 선택행의 키값과 인덱스 구하기
    const selectedKey = Number(Object.keys(detailSelectedState)[0]);
    const selectedIndex = detailRows.data.findIndex(
      (row) => row[DETAIL_ITEM_KEY] === selectedKey
    );

    // 복사하여 생성할 첫번째 행 선택
    setDetailSelectedState({ [maxMeetingSeq + 1]: true });

    const result: any[] = rows
      .filter((row) => row)
      .map((row, idx) => {
        // 탭을 기준으로 나누기
        const rowWithoutCR = row.replace(/\r/g, "");
        const cells = rowWithoutCR.split("\t");

        // 만약 cells에 값이 없을 경우, 원래 행의 데이터를 넣음
        const index = selectedIndex + idx;
        const rowData =
          index >= 0 && index < detailRows.data.length
            ? detailRows.data[index]
            : {};
        const {
          contents = "",
          finexpdt = null,
          reqdt = null,
          is_request = "",
          cust_browserable = "",
          value_code3 = null,
          client_name = "",
          client_finexpdt = null,
        } = rowData;

        return {
          rowstatus: "N",
          meetingseq: ++maxMeetingSeq,
          contents: cells[0] ?? contents,
          finexpdt: cells[1] ? parseDate(cells[1]) : finexpdt,
          reqdt: cells[2] ? parseDate(cells[2]) : reqdt,
          is_request: cells[3] ?? is_request,
          cust_browserable: cells[4] ?? cust_browserable,
          value_code3: cells[5] ?? value_code3,
          client_name: cells[6] ?? client_name,
          client_finexpdt: cells[7] ? parseDate(cells[7]) : client_finexpdt,
        };
      });

    setDetailRows((prev) => {
      let newRows = [...prev.data];
      // 붙여넣기 행만큼 기존 행은 삭제하고, 기존 행 자리에 붙여넣기 된 행 삽입
      newRows.splice(selectedIndex, result.length, ...result);

      return {
        data: newRows,
        total: newRows.length,
      };
    });
  };

  const parseDate = (input: any) => {
    // 값이 없는 경우 null 반환
    if (!input) {
      return null;
    }

    // 유효한 날짜 문자열 패턴 확인
    const patterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{4}\d{2}\d{2}$/,
      /^\d{4}\.\s?\d{2}\.\s?\d{2}$/,
    ];

    // 어느 패턴과도 일치하지 않으면 오늘의 날짜 반환
    if (!patterns.some((pattern) => pattern.test(input))) {
      return new Date();
    }

    // 입력을 Date 객체로 변환
    const date = new Date(input);

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      // 유효하지 않은 날짜인 경우 오늘의 날짜 반환
      return new Date();
    } else {
      // 유효한 날짜인 경우 변환된 날짜 반환
      return date;
    }
  };
  const [panes, setPanes] = useState<Array<any>>([
    { size: "25%", min: "20px", collapsible: true },
    {},
    { size: "25%", min: "20px", collapsible: true },
  ]);

  const onChange = (event: SplitterOnChangeEvent) => {
    setPanes(event.newState);
  };

  const getState = () => {
    //신규와 내용수정여부 체크
    let valid = true;

    if (workType == "N") {
      valid = false;
    }

    detailRows.data.map((item) => {
      if (item.rowstatus == "U" || item.rowstatus == "N") {
        valid = false;
      }
    });

    setErrorState(valid);

    return valid;
  };

  const onChanges = () => {
    setErrorState(false);
  };

  return (
    <>
      <CodesContext.Provider
        value={{ valueCodes: valueCodesState, customers: customersState }}
      >
        <TitleContainer className="TitleContainer">
          {!isMobile ? "" : <Title>회의록 관리</Title>}
          <ButtonContainer style={{ rowGap: "5px" }}>
            {isMobile && (
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
            )}
            <Button
              themeColor={"primary"}
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
        {isMobile ? (
          <>
            <FilterContainer>
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
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer2">
                    <GridTitle>
                      요약정보{" "}
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
                        recdt: dateformat2(row.recdt),
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
                    <GridColumn field="custnm" title="업체" width={150} />
                    <GridColumn field="title" title="제목" width={500} />
                  </Grid>
                </GridContainer>
              </SwiperSlide>
              <SwiperSlide key={1}>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer3">
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
                      기본정보
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
                        themeColor={"primary"}
                        fillMode={"outline"}
                        icon={"link"}
                        onClick={() => {
                          const data = mainDataResult.data.filter(
                            (item) =>
                              item[DATA_ITEM_KEY] ==
                              Object.getOwnPropertyNames(selectedState)[0]
                          )[0];

                          if (data == undefined) {
                            alert("데이터가 없습니다.");
                          } else {
                            navigator.clipboard
                              .writeText(
                                `https://spm-admin.gsti.co.kr/MeetingManagement?go=${data.orgdiv}_${data.meetingnum}`
                              )
                              .then((res) => {
                                alert("주소가 복사되었습니다!");
                              });
                          }
                        }}
                      >
                        링크 복사
                      </Button>
                      <Button
                        themeColor={"primary"}
                        fillMode={"solid"}
                        icon={"link"}
                        onClick={() => {
                          const data = mainDataResult.data.filter(
                            (item) =>
                              item[DATA_ITEM_KEY] ==
                              Object.getOwnPropertyNames(selectedState)[0]
                          )[0];

                          if (data == undefined) {
                            alert("데이터가 없습니다.");
                          } else {
                            navigator.clipboard
                              .writeText(
                                `https://spm.gsti.co.kr/MeetingView?go=${data.meetingnum}`
                              )
                              .then((res) => {
                                alert("주소가 복사되었습니다!");
                              });
                          }
                        }}
                      >
                        고객사 링크 복사
                      </Button>
                    </ButtonContainer>
                  </GridTitleContainer>

                  <FormBoxWrap
                    border
                    className="FormBoxWrap"
                    style={{ height: mobileheight2, overflow: "auto" }}
                  >
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
                          <th>
                            <Checkbox
                              name="unshared"
                              value={detailData.unshared}
                              onChange={() =>
                                setDetailData((prev) => ({
                                  ...prev,
                                  unshared: !prev.unshared,
                                }))
                              }
                              label="업체 비공유"
                            />
                          </th>
                          <td>
                            <Button
                              themeColor={"primary"}
                              style={{ width: "100%" }}
                              onClick={() => {
                                if (detailData.work_type == "N") {
                                  alert("회의록 저장 후 등록할 수 있습니다.");
                                } else if (
                                  Object.getOwnPropertyNames(
                                    selectedState
                                  )[0] != undefined
                                ) {
                                  setSignWindowVisible(true);
                                } else {
                                  alert("선택된 데이터가 없습니다.");
                                }
                              }}
                            >
                              참석자 등록
                            </Button>
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
                              <CustomMultiColumnComboBox
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
                                onClick={() =>
                                  setAttachmentsWindowVisiblePb(true)
                                }
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
                                onClick={() =>
                                  setAttachmentsWindowVisiblePr(true)
                                }
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
                </GridContainer>
              </SwiperSlide>
              <SwiperSlide key={2}>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer4">
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
                      회의내용
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={"chevron-right"}
                        onClick={() => {
                          if (swiper) {
                            swiper.slideTo(3);
                          }
                        }}
                      ></Button>
                    </GridTitle>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: mobileheight3 }}
                    data={process(
                      detailRows.data.map((row) => ({
                        ...row,
                        [SELECTED_FIELD]:
                          detailSelectedState[detailIdGetter(row)],
                      })),
                      detailRowsState
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
              </SwiperSlide>
              <SwiperSlide key={3}>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer5">
                    <GridTitle>
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={"chevron-left"}
                        onClick={() => {
                          if (swiper) {
                            swiper.slideTo(2);
                          }
                        }}
                      ></Button>
                      참고자료
                    </GridTitle>
                  </GridTitleContainer>
                  <div style={{ height: mobileheight4 }}>
                    <RichEditor
                      id="refEditor"
                      key={Object.getOwnPropertyNames(selectedState)[0]}
                      ref={refEditorRef}
                      change={onChanges}
                    />
                  </div>
                </GridContainer>
              </SwiperSlide>
            </Swiper>
          </>
        ) : (
          <GridContainerWrap>
            <Splitter
              panes={panes}
              onChange={onChange}
              style={{ borderColor: "#00000000" }}
            >
              <div className="pane-content">
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer">
                    <GridTitle>조회조건</GridTitle>
                    <Button
                      onClick={search}
                      icon="search"
                      themeColor={"primary"}
                    >
                      조회
                    </Button>
                  </GridTitleContainer>
                  <FilterContainer>
                    <FilterBox
                      onKeyPress={(e) => handleKeyPressSearch(e, search)}
                    >
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
                  </FilterContainer>
                  <GridContainer>
                    <GridTitleContainer className="ButtonContainer2">
                      <GridTitle>요약정보</GridTitle>
                    </GridTitleContainer>
                    <Grid
                      style={{ height: webheight }}
                      data={process(
                        mainDataResult.data.map((row) => ({
                          ...row,
                          recdt: dateformat2(row.recdt),
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
                      <GridColumn field="custnm" title="업체" width={150} />
                      <GridColumn field="title" title="제목" width={500} />
                    </Grid>
                  </GridContainer>
                </GridContainer>
              </div>
              <div className="pane-content">
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer3">
                    <GridTitle>회의록</GridTitle>
                    <ButtonContainer>
                      <Button
                        themeColor={"primary"}
                        fillMode={"outline"}
                        icon={"link"}
                        onClick={() => {
                          const data = mainDataResult.data.filter(
                            (item) =>
                              item[DATA_ITEM_KEY] ==
                              Object.getOwnPropertyNames(selectedState)[0]
                          )[0];

                          if (data == undefined) {
                            alert("데이터가 없습니다.");
                          } else {
                            navigator.clipboard
                              .writeText(
                                `https://spm-admin.gsti.co.kr/MeetingManagement?go=${data.orgdiv}_${data.meetingnum}`
                              )
                              .then((res) => {
                                alert("주소가 복사되었습니다!");
                              });
                          }
                        }}
                      >
                        링크 복사
                      </Button>
                      <Button
                        themeColor={"primary"}
                        fillMode={"solid"}
                        icon={"link"}
                        onClick={() => {
                          const data = mainDataResult.data.filter(
                            (item) =>
                              item[DATA_ITEM_KEY] ==
                              Object.getOwnPropertyNames(selectedState)[0]
                          )[0];

                          if (data == undefined) {
                            alert("데이터가 없습니다.");
                          } else {
                            navigator.clipboard
                              .writeText(
                                `https://spm.gsti.co.kr/MeetingView?go=${data.meetingnum}`
                              )
                              .then((res) => {
                                alert("주소가 복사되었습니다!");
                              });
                          }
                        }}
                      >
                        고객사 링크 복사
                      </Button>
                      <Button
                        themeColor={"primary"}
                        fillMode={"flat"}
                        icon={isVisibleDetail ? "chevron-up" : "chevron-down"}
                        onClick={() => setIsVisableDetail((prev) => !prev)}
                      ></Button>
                    </ButtonContainer>
                  </GridTitleContainer>
                  {isVisibleDetail && (
                    <FormBoxWrap border className="FormBoxWrap">
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
                            <th>
                              <Checkbox
                                name="unshared"
                                value={detailData.unshared}
                                onChange={() =>
                                  setDetailData((prev) => ({
                                    ...prev,
                                    unshared: !prev.unshared,
                                  }))
                                }
                                label="업체 비공유"
                              />
                            </th>
                            <td>
                              <Button
                                themeColor={"primary"}
                                style={{ width: "100%" }}
                                onClick={() => {
                                  if (detailData.work_type == "N") {
                                    alert("회의록 저장 후 등록할 수 있습니다.");
                                  } else if (
                                    Object.getOwnPropertyNames(
                                      selectedState
                                    )[0] != undefined
                                  ) {
                                    setSignWindowVisible(true);
                                  } else {
                                    alert("선택된 데이터가 없습니다.");
                                  }
                                }}
                              >
                                참석자 등록
                              </Button>
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
                                <CustomMultiColumnComboBox
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
                                  onClick={() =>
                                    setAttachmentsWindowVisiblePb(true)
                                  }
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
                                  onClick={() =>
                                    setAttachmentsWindowVisiblePr(true)
                                  }
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

                  <div
                    onPaste={handlePaste}
                    style={{
                      height: isVisibleDetail ? webheight2 : webheight3,
                    }}
                  >
                    <Grid
                      style={{ height: "100%" }}
                      data={process(
                        detailRows.data.map((row) => ({
                          ...row,
                          [SELECTED_FIELD]:
                            detailSelectedState[detailIdGetter(row)],
                        })),
                        detailRowsState
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
                  </div>
                </GridContainer>
              </div>
              <div className="pane-content">
                <GridContainer>
                  <GridTitleContainer>
                    <GridTitle>참고자료</GridTitle>
                  </GridTitleContainer>
                  <RichEditor
                    id="refEditor"
                    ref={refEditorRef}
                    key={Object.getOwnPropertyNames(selectedState)[0]}
                    change={onChanges}
                  />
                </GridContainer>
              </div>
            </Splitter>
          </GridContainerWrap>
        )}
        {attachmentsWindowVisiblePr && (
          <AttachmentsWindow
            type="meeting"
            setVisible={setAttachmentsWindowVisiblePr}
            setData={getAttachmentsDataPr}
            para={detailData.attdatnum_private}
            modal={true}
            fileLists={fileList2}
            savenmLists={savenmList2}
          />
        )}
        {attachmentsWindowVisiblePb && (
          <AttachmentsWindow
            type="meeting"
            setVisible={setAttachmentsWindowVisiblePb}
            setData={getAttachmentsDataPb}
            para={detailData.attdatnum}
            modal={true}
            fileLists={fileList}
            savenmLists={savenmList}
          />
        )}
        {custWindowVisible && (
          <CustomersWindow
            workType=""
            setVisible={setCustWindowVisible}
            setData={setCustData}
            modal={true}
          />
        )}
        {projectWindowVisible && (
          <ProjectsWindow
            setVisible={setProjectWindowVisible}
            setData={setProjectData}
            para={{ cust_data: detailData.cust_data }}
          />
        )}
        {signWindowVisible && (
          <SignWindow
            setVisible={setSignWindowVisible}
            reference_key={detailData.orgdiv + "_" + detailData.meetingnum}
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
