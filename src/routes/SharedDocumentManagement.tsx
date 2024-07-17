import {
  DataResult,
  filterBy,
  FilterDescriptor,
  getter,
  process,
  State,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input } from "@progress/kendo-react-inputs";
import { Splitter, SplitterOnChangeEvent } from "@progress/kendo-react-layout";

import { bytesToBase64 } from "byte-base64";
import Cookies from "js-cookie";
import {
  useCallback,
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
import {
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  getDeviceHeight,
  getHeight,
  handleKeyPressSearch,
  isWithinOneMonth,
  toDate,
  UseParaPc,
} from "../components/CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import FilterContainer from "../components/FilterContainer";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import SignWindow from "../components/Windows/CommonWindows/SignWindow";
import { useApi } from "../hooks/api";
import { ICustData } from "../hooks/interfaces";
import { isLoading, loginResultState, titles } from "../store/atoms";
import {
  custTypeColumns,
  dataTypeColumns,
} from "../store/columns/common-columns";
import { TEditorHandle } from "../store/types";
import CustomMultiColumnComboBox from "../components/ComboBoxes/CustomMultiColumnComboBox";

type TFilters = {
  fromDate: Date;
  toDate: Date;
  contents: string;
  type: { sub_code: string; code_name: string };
  customer_name: string;
  findRowValue: string;
  pgNum: number;
  pgSize: number;
  isFetch: boolean;
  isReset: boolean;
};

const defaultDetailData: {
  work_type: string;
  document_id: string;
  title: string;
  write_date: Date | null;
  contents: string;
  attdatnum: string;
  files: string;
  customer: { custcd: string; custnm: string };
  type: { sub_code: string; code_name: string };
} = {
  work_type: "N",
  document_id: "",
  title: "",
  write_date: new Date(),
  contents: "",
  attdatnum: "",
  files: "",
  customer: {
    custcd: "",
    custnm: "",
  },
  type: {
    sub_code: "",
    code_name: "",
  },
};

const DATA_ITEM_KEY = "document_id";

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;
var height7 = 0;

const App = () => {
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const editorRef = useRef<TEditorHandle>(null);
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [title, setTitle] = useRecoilState(titles);
  const [swiper, setSwiper] = useState<SwiperCore>();

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
    height4 = getHeight(".ButtonContainer4");
    height5 = getHeight(".FormBoxWrap");
    height6 = getHeight(".FormBoxWrap2");
    height7 = getHeight(".TitleContainer");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;
      setIsMobile(deviceWidth <= 1200);
      setMobileHeight(getDeviceHeight(true) - height2 - height7);
      setMobileHeight2(getDeviceHeight(true) - height3 - height7);
      setMobileHeight3(
        getDeviceHeight(true) - height4 - height6 - height7 + 14
      );

      setWebHeight(getDeviceHeight(true) - height - height2 - height7);
      setWebHeight2(
        getDeviceHeight(true) -
          height -
          height3 -
          height5 -
          height6 -
          height7 +
          16
      );
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3]);

  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const processApi = useApi();
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

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [signWindowVisible, setSignWindowVisible] = useState<boolean>(false);

  const idGetter = getter(DATA_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailData, setDetailData] = useState(defaultDetailData);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  let fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 1);

  const [filters, setFilters] = useState<TFilters>({
    fromDate: fromDate,
    toDate: new Date(),
    contents: "",
    type: { sub_code: "", code_name: "" },
    customer_name: "",
    findRowValue: "",
    pgNum: 1,
    pgSize: PAGE_SIZE,
    isFetch: true, // 조회여부 초기값
    isReset: true, // 리셋여부 초기값
  });

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const detailDataInputChange = (e: any) => {
    const { value, name } = e.target;

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const DetailComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [typeFilter, setTypeFilter] = useState<FilterDescriptor>();
  const [custFilter, setCustFilter] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      if (event.target.name == "customer") {
        setCustFilter(event.filter);
      } else if (event.target.name == "type") {
        setTypeFilter(event.filter);
      }
    }
  };

  const FilterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [typeFilterTop, setTypeFilterTop] = useState<FilterDescriptor>();
  const [custFilterTop, setCustFilterTop] = useState<FilterDescriptor>();
  const handleFilterChangeTop = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      if (event.target.name == "customer") {
        setCustFilterTop(event.filter);
      } else if (event.target.name == "type") {
        setTypeFilterTop(event.filter);
      }
    }
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      // ComboBox에 사용할 코드 리스트 조회
      fetchCustomers();
      fetchTypes();
      setTitle("공유문서 관리");
    }
  }, []);

  const search = () => {
    setFileList([]);
    setSavenmList([]);
    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isFetch: true,
      isReset: true,
    }));
    if (swiper && isMobile) {
      swiper.slideTo(0);
    }
  };

  useEffect(() => {
    if (filters.isFetch && localStorage.getItem("accessToken")) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);

      // 기본값으로 세팅
      setFilters((prev) => ({
        ...prev,
        isFetch: false,
        isReset: false,
        findRowValue: "",
      }));

      // 그리드 조회
      fetchGrid(deepCopiedFilters);
    }
  }, [filters]);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
      if (mainDataId) fetchDetail();
    }
  }, [selectedState]);

  const [customersData, setCustomersData] = useState<null | []>(null);
  const [typesData, setTypesData] = useState<any[]>([]);

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onChange = (event: SplitterOnChangeEvent) => {
    setPanes(event.newState);
  };

  const [panes, setPanes] = useState<Array<any>>([
    { size: "35%", min: "0px", collapsible: true },
    {},
  ]);
  const [isVisibleDetail, setIsVisableDetail] = useState(true);

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
    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
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

  // 업체 조회
  const fetchCustomers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(
      bytes("SELECT custcd, custnm FROM ba020t WHERE useyn = 'Y'")
    );

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
      setCustomersData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  // 구분 조회
  const fetchTypes = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(
      bytes(
        "SELECT sub_code, code_name FROM comCodeMaster WHERE group_code = 'CR080' AND use_yn = 'Y'"
      )
    );

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
      setTypesData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //그리드 데이터 조회
  const fetchGrid = useCallback(async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&contents=${
        filters.contents
      }&type=${filters.type?.sub_code ?? ""}&customerName=${
        filters.customer_name
      }&find_row_value=${filters.findRowValue}&page=${filters.pgNum}&pageSize=${
        filters.pgSize
      }`,
    };

    try {
      data = await processApi<any>("shared_document-list", para);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (filters.findRowValue !== "") {
          // 데이터 저장 후 조회
          setSelectedState({ [filters.findRowValue]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });
        } else if (filters.isReset) {
          // 일반 데이터 조회
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
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
      } else {
        // 결과 행이 0인 경우 데이터 리셋
        setMainDataResult(process([], mainDataState));
        resetDetailData();
        setSelectedState({});
      }
    }
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async () => {
    let data: any;
    setLoading(true);

    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    const para = {
      id: mainDataId,
    };

    try {
      data = await processApi<any>("shared_document-detail", para);
    } catch (error: any) {
      data = null;
    }

    if (data && data.result.isSuccess === true) {
      const document = data.document;
      const rowCount = data.result.tables[0].RowCount;

      if (rowCount) {
        // 상세정보 데이터 세팅
        const row = data.result.tables[0].Rows[0];
        setDetailData((prev) => ({
          ...row,
          work_type: "U",
          write_date: toDate(row.write_date),
          customer: { custcd: row.customer_code, custnm: row.customer_name },
          type: { sub_code: row.type, code_name: row.typenm },
        }));
      } else {
        resetDetailData();
      }

      // Edior에 HTML & CSS 세팅
      setHtmlOnEditor(document);

      const selectedRow = mainDataResult.data.find(
        (item) => item[DATA_ITEM_KEY] === mainDataId
      );

      // 한달 이내 작성된 데이터인 경우
      if (selectedRow && isWithinOneMonth(selectedRow.write_date)) {
        // 조회한 공지사항 쿠키에 저장
        const savedSharedDocumentsRaw = Cookies.get("readSharedDocuments");
        const savedSharedDocuments = savedSharedDocumentsRaw
          ? JSON.parse(savedSharedDocumentsRaw)
          : [];
        const updatedSharedDocuments = [...savedSharedDocuments, mainDataId];
        const uniqueSharedDocuments = Array.from(
          new Set(updatedSharedDocuments)
        );

        Cookies.set(
          "readSharedDocuments",
          JSON.stringify(uniqueSharedDocuments),
          {
            expires: 30,
          }
        );
      }
    } else {
      console.log("[에러발생]");
      console.log(data);

      // 조회 실패 시
      resetDetailData();
    }

    setLoading(false);
  }, [selectedState, detailData, fileList, savenmList]);

  // 상세정보 초기화
  const resetDetailData = () => {
    setDetailData({ ...defaultDetailData, write_date: null });

    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor("");
  };

  const print = () => {
    const iframe = document.getElementById("editor")!.querySelector("iframe");

    if (iframe) {
      const iframeWindow: any = iframe.contentWindow;
      iframe.focus();
      iframeWindow.print();
    }

    return false;
  };

  const setCustData = (data: ICustData) => {
    setDetailData((prev: any) => ({
      ...prev,
      customer: {
        custcd: data.custcd,
        custnm: data.custnm,
      },
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

  const copySharedDocument = () => {
    setDetailData((prev) => ({
      ...prev,
      work_type: "N",
      document_id: "",
      write_date: new Date(),
      attdatnum: "",
      files: "",
    }));
    setSavenmList([]);
    setFileList([]);
    alert("복사되었습니다.");
  };

  const createSharedDocument = () => {
    setDetailData({
      ...defaultDetailData,
      work_type: "N",
      write_date: new Date(),
    });

    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor("");

    if (swiper && isMobile) {
      swiper.slideTo(1);
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
  const saveSharedDocument = useCallback(async () => {
    let data: any;
    setLoading(true);

    if (!detailData.title) {
      alert("제목은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }
    if (!detailData.write_date) {
      alert("작성일자은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }

    let editorContent = "";
    if (editorRef.current) {
      editorContent = editorRef.current.getContent();
    }

    let newAttachmentNumber = "";
    const promises = [];

    for (const file of fileList) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (detailData.attdatnum == "" && newAttachmentNumber == "") {
        newAttachmentNumber = await uploadFile(
          file,
          "sharedDocument",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "sharedDocument",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "sharedDocument", detailData.attdatnum);
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
    let type = "sharedDocument";
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
    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const para = {
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_shared_document",
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_document_id": detailData.document_id,
        "@p_write_date": convertDateToStr(detailData.write_date),
        "@p_title": detailData.title,
        "@p_contents": extractTextFromHtmlContent(editorContent), //detailData.contents,
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_customer_code": detailData.customer.custcd,
        "@p_type": detailData.type.sub_code,
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("shared_document-save", para);
    } catch (error: any) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      setFileList([]);
      setSavenmList([]);
      // 조회
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: 1,
        findRowValue: data.returnString,
      }));
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  }, [detailData, userId]);

  const deleteSharedDocument = useCallback(async () => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId
    );

    if (!window.confirm("[" + selectedRow.title + "] 정말 삭제하시겠습니까?"))
      return false;
    let data: any;
    setLoading(true);

    const para = { id: selectedRow.document_id };

    try {
      data = await processApi<any>("shared_document-delete", para);
    } catch (error: any) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      // 첨부파일 서버에서 삭제
      let data2: any;
      try {
        data2 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=sharedDocument&attachmentNumber=" +
            detailData.attdatnum +
            "&id=",
        });
      } catch (error) {
        data2 = null;
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
  }, [detailData]);

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

  const setHtmlOnEditor = (content: string) => {
    if (editorRef.current) {
      if (!isAdmin) editorRef.current.updateEditable(true);
      editorRef.current.setHtml(content);
      if (!isAdmin) editorRef.current.updateEditable(false);
    }
  };

  const extractTextFromHtmlContent = (htmlString: string) => {
    let extractString: string = "";

    const regex = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const match = htmlString.match(regex);

    if (match && match[1]) {
      extractString = match[1]; // body 태그 안의 내용만 처리
    }

    extractString = extractString.replace(/(<([^>]+)>)/gi, ""); // 태그 제거
    extractString = extractString.replace(/\s\s+/g, " "); // 연달아 있는 줄바꿈, 공백, 탭을 공백 1개로 줄임

    return extractString;
  };

  return (
    <>
      <TitleContainer className="TitleContainer">
        {!isMobile ? "" : <Title>공유문서 관리</Title>}
        <ButtonContainer style={{ rowGap: "5px" }}>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          {isAdmin && (
            <>
              <Button
                themeColor={"primary"}
                icon="file-add"
                onClick={createSharedDocument}
              >
                신규
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="copy"
                onClick={copySharedDocument}
              >
                복사
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="delete"
                onClick={deleteSharedDocument}
              >
                삭제
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="save"
                onClick={saveSharedDocument}
              >
                저장
              </Button>
            </>
          )}
          <Button
            onClick={print}
            fillMode="outline"
            themeColor={"primary"}
            icon="print"
          >
            출력
          </Button>
        </ButtonContainer>
      </TitleContainer>
      {!isMobile ? (
        <GridTitleContainer className="ButtonContainer">
          <GridTitle>조회조건</GridTitle>
        </GridTitleContainer>
      ) : (
        ""
      )}
      <FilterContainer>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>작성일자</th>
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
              <th>구분</th>
              <td>
                <CustomMultiColumnComboBox
                  name="type"
                  data={
                    typeFilterTop
                      ? filterBy(typesData, typeFilterTop)
                      : typesData
                  }
                  value={filters.type}
                  columns={dataTypeColumns}
                  textField={"code_name"}
                  onChange={FilterComboBoxChange}
                  filterable={true}
                  onFilterChange={handleFilterChangeTop}
                  clearButton={true}
                />
              </td>
              <th>업체명</th>
              <td>
                <Input
                  name="customer_name"
                  type="text"
                  value={filters.customer_name}
                  onChange={filterInputChange}
                />
              </td>
              {/* <td>
                {customersData && (
                  <CustomMultiColumnComboBox
                    name="customer"
                    data={
                      custFilterTop
                        ? filterBy(customersData, custFilterTop)
                        : customersData
                    }
                    value={filters.customer}
                    columns={custTypeColumns}
                    textField={"custnm"}
                    onChange={FilterComboBoxChange}
                    filterable={true}
                    onFilterChange={handleFilterChangeTop}
                    clearButton={true}
                  />
                )}
              </td> */}
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
          </tbody>
        </FilterBox>
      </FilterContainer>
      {isMobile ? (
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
                    [SELECTED_FIELD]: selectedState[idGetter(row)],
                    write_date: dateformat2(row.write_date),
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
                  field="write_date"
                  title="작성일자"
                  width={110}
                  cell={CenterCell}
                  footerCell={mainTotalFooterCell}
                />
                <GridColumn
                  field="typenm"
                  title="구분"
                  width={100}
                  cell={CenterCell}
                />
                <GridColumn
                  field="customer_name"
                  title="업체명"
                  width={120}
                  //cell={CenterCell}
                />
                <GridColumn field="title" title="제목" />
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
                  기본정보{" "}
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
              </GridTitleContainer>
              <FormBoxWrap
                border
                className="FormBoxWrap"
                style={{ height: mobileheight2 }}
              >
                <FormBox>
                  <tbody>
                    <tr>
                      <th>구분</th>
                      <td>
                        <CustomMultiColumnComboBox
                          name="type"
                          data={
                            typeFilter
                              ? filterBy(typesData, typeFilter)
                              : typesData
                          }
                          value={detailData.type}
                          columns={dataTypeColumns}
                          textField={"code_name"}
                          onChange={DetailComboBoxChange}
                          className="required"
                          filterable={true}
                          onFilterChange={handleFilterChange}
                          clearButton={false}
                        />
                      </td>
                      <th>업체코드</th>
                      <td>
                        <div className="filter-item-wrap">
                          <Input
                            name="customer_code"
                            value={
                              detailData.customer
                                ? detailData.customer.custcd
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
                        {customersData && (
                          <CustomMultiColumnComboBox
                            name="customer"
                            data={
                              custFilter
                                ? filterBy(customersData, custFilter)
                                : customersData
                            }
                            value={detailData.customer}
                            columns={custTypeColumns}
                            textField={"custnm"}
                            onChange={DetailComboBoxChange}
                            className=""
                            filterable={true}
                            onFilterChange={handleFilterChange}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>작성일자</th>
                      <td>
                        {isAdmin ? (
                          <DatePicker
                            name="write_date"
                            value={detailData.write_date}
                            format="yyyy-MM-dd"
                            onChange={detailDataInputChange}
                            className={"required"}
                            placeholder=""
                          />
                        ) : (
                          <Input
                            name="write_date"
                            type="text"
                            value={dateformat2(
                              convertDateToStr(detailData.write_date)
                            )}
                            onChange={detailDataInputChange}
                            className={!isAdmin ? "readonly" : "required"}
                            readOnly={!isAdmin}
                          />
                        )}
                      </td>
                      <th>제목</th>
                      <td colSpan={2}>
                        <Input
                          name="title"
                          type="text"
                          value={detailData.title}
                          onChange={detailDataInputChange}
                          className={!isAdmin ? "readonly" : "required"}
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td>
                        <Button
                          themeColor={"primary"}
                          style={{ width: "100%" }}
                          onClick={() => {
                            if (detailData.work_type == "N") {
                              alert("저장 후 등록할 수 있습니다.");
                            } else if (
                              Object.getOwnPropertyNames(selectedState)[0] !=
                              undefined
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
                  </tbody>
                </FormBox>
              </FormBoxWrap>
            </GridContainer>
          </SwiperSlide>
          <SwiperSlide key={2}>
            <GridTitleContainer className="ButtonContainer4">
              <GridTitle>
                {" "}
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
            </GridTitleContainer>
            <div style={{ height: mobileheight3 }}>
              <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
            </div>
            <FormBoxWrap
              border
              style={{
                margin: 0,
                borderTop: 0,
              }}
              className="FormBoxWrap2"
            >
              <FormBox>
                <tbody>
                  <tr>
                    <th style={{ width: 0 }}>첨부파일</th>
                    <td style={{ width: "auto" }}>
                      <div className="filter-item-wrap">
                        <Input
                          name="attachment_q"
                          value={detailData.files}
                          className="readonly"
                        />
                        <Button
                          icon="more-horizontal"
                          fillMode={"flat"}
                          onClick={() => setAttachmentsWindowVisible(true)}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
          </SwiperSlide>
        </Swiper>
      ) : (
        <>
          <GridContainerWrap>
            <Splitter
              panes={panes}
              onChange={onChange}
              style={{ width: "100%", borderColor: "#00000000" }}
            >
              <GridContainer>
                <GridTitleContainer className="ButtonContainer2">
                  <GridTitle>요약정보</GridTitle>
                </GridTitleContainer>
                <Grid
                  style={{ height: webheight }}
                  data={process(
                    mainDataResult.data.map((row) => ({
                      ...row,
                      [SELECTED_FIELD]: selectedState[idGetter(row)],
                      write_date: dateformat2(row.write_date),
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
                    field="write_date"
                    title="작성일자"
                    width={110}
                    cell={CenterCell}
                    footerCell={mainTotalFooterCell}
                  />
                  <GridColumn
                    field="typenm"
                    title="구분"
                    width={100}
                    cell={CenterCell}
                  />
                  <GridColumn
                    field="customer_name"
                    title="업체명"
                    width={120}
                    //cell={CenterCell}
                  />
                  <GridColumn field="title" title="제목" />
                </Grid>
              </GridContainer>
              <GridContainer>
                <GridTitleContainer className="ButtonContainer3">
                  <GridTitle>
                    <Button
                      themeColor={"primary"}
                      fillMode={"flat"}
                      icon={isVisibleDetail ? "chevron-left" : "chevron-right"}
                      onClick={() => {
                        if (isVisibleDetail == true) {
                          setPanes([
                            { size: "0%", min: "0px", collapsible: true },
                            {},
                          ]);
                        } else {
                          setPanes([
                            { size: "100%", min: "0px", collapsible: true },
                            {},
                          ]);
                        }
                        setIsVisableDetail((prev) => !prev);
                      }}
                    ></Button>
                    상세정보
                  </GridTitle>
                </GridTitleContainer>
                <FormBoxWrap border className="FormBoxWrap">
                  <FormBox>
                    <tbody>
                      <tr>
                        <th>구분</th>
                        <td>
                          <CustomMultiColumnComboBox
                            name="type"
                            data={
                              typeFilter
                                ? filterBy(typesData, typeFilter)
                                : typesData
                            }
                            value={detailData.type}
                            columns={dataTypeColumns}
                            textField={"code_name"}
                            onChange={DetailComboBoxChange}
                            className="required"
                            filterable={true}
                            onFilterChange={handleFilterChange}
                            clearButton={false}
                          />
                        </td>
                        <th>업체코드</th>
                        <td>
                          <div className="filter-item-wrap">
                            <Input
                              name="customer_code"
                              value={
                                detailData.customer
                                  ? detailData.customer.custcd
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
                          {customersData && (
                            <CustomMultiColumnComboBox
                              name="customer"
                              data={
                                custFilter
                                  ? filterBy(customersData, custFilter)
                                  : customersData
                              }
                              value={detailData.customer}
                              columns={custTypeColumns}
                              textField={"custnm"}
                              onChange={DetailComboBoxChange}
                              className=""
                              filterable={true}
                              onFilterChange={handleFilterChange}
                            />
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>작성일자</th>
                        <td>
                          {isAdmin ? (
                            <DatePicker
                              name="write_date"
                              value={detailData.write_date}
                              format="yyyy-MM-dd"
                              onChange={detailDataInputChange}
                              className={"required"}
                              placeholder=""
                            />
                          ) : (
                            <Input
                              name="write_date"
                              type="text"
                              value={dateformat2(
                                convertDateToStr(detailData.write_date)
                              )}
                              onChange={detailDataInputChange}
                              className={!isAdmin ? "readonly" : "required"}
                              readOnly={!isAdmin}
                            />
                          )}
                        </td>
                        <th>제목</th>
                        <td colSpan={2}>
                          <Input
                            name="title"
                            type="text"
                            value={detailData.title}
                            onChange={detailDataInputChange}
                            className={!isAdmin ? "readonly" : "required"}
                            readOnly={!isAdmin}
                          />
                        </td>
                        <td>
                          <Button
                            themeColor={"primary"}
                            style={{ width: "100%" }}
                            onClick={() => {
                              if (detailData.work_type == "N") {
                                alert("저장 후 등록할 수 있습니다.");
                              } else if (
                                Object.getOwnPropertyNames(selectedState)[0] !=
                                undefined
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
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
                <div style={{ height: webheight2 }}>
                  <RichEditor
                    id="editor"
                    ref={editorRef}
                    hideTools={!isAdmin}
                  />
                </div>
                <FormBoxWrap
                  border
                  style={{
                    margin: 0,
                    borderTop: 0,
                  }}
                  className="FormBoxWrap2"
                >
                  <FormBox>
                    <tbody>
                      <tr>
                        <th style={{ width: 0 }}>첨부파일</th>
                        <td style={{ width: "auto" }}>
                          <div className="filter-item-wrap">
                            <Input
                              name="attachment_q"
                              value={detailData.files}
                              className="readonly"
                            />
                            <Button
                              icon="more-horizontal"
                              fillMode={"flat"}
                              onClick={() => setAttachmentsWindowVisible(true)}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
              </GridContainer>
            </Splitter>
          </GridContainerWrap>
        </>
      )}

      {attachmentsWindowVisible && (
        <AttachmentsWindow
          type="sharedDocument"
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={detailData.attdatnum}
          permission={
            isAdmin
              ? undefined
              : { upload: false, download: true, delete: false }
          }
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
      {signWindowVisible && (
        <SignWindow
          setVisible={setSignWindowVisible}
          reference_key={detailData.document_id}
        />
      )}
    </>
  );
};
export default App;
