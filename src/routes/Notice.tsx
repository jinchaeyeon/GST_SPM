import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import Cookies from "js-cookie";
import React, {
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
  convertDateToStr,
  dateformat2,
  getDeviceHeight,
  getHeight,
  handleKeyPressSearch,
  isWithinOneMonth,
  toDate,
  UseParaPc,
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import FilterContainer from "../components/FilterContainer";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { useApi } from "../hooks/api";
import { isLoading, loginResultState, titles } from "../store/atoms";
import { TEditorHandle } from "../store/types";

const DraggableGridRowRender = (properties: any) => {
  const {
    row = "",
    props = "",
    onDrop = "",
    onDragStart = "",
  } = { ...properties };
  const additionalProps = {
    onDragStart: (e: any) => onDragStart(e, props.dataItem),
    onDragOver: (e: any) => {
      e.preventDefault();
    },
    onDrop: (e: any) => onDrop(e, props.dataItem),
    draggable: true,
  };
  return React.cloneElement(
    row,
    { ...row.props, ...additionalProps },
    row.props.children
  );
};

type TFilters = {
  fromDate: Date;
  toDate: Date;
  contents: string;
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
  notice_date: Date | null;
  contents: string;
  attdatnum: string;
  files: string;
} = {
  work_type: "N",
  document_id: "",
  title: "",
  notice_date: new Date(),
  contents: "",
  attdatnum: "",
  files: "",
};

const DATA_ITEM_KEY = "document_id";
const CUST_DATA_ITEM_KEY = "custcd";

type TCustomer = {
  customer_code: string;
  customer_name: string;
};
let targetRowIndex: null | number = null;

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;
var height7 = 0;
var height8 = 0;
var height9 = 0;

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
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [swiper, setSwiper] = useState<SwiperCore>();

  let deviceWidth = window.innerWidth;
  const [isMobile, setIsMobile] = useState(deviceWidth <= 1200);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [mobileheight3, setMobileHeight3] = useState(0);
  const [mobileheight4, setMobileHeight4] = useState(0);
  const [mobileheight5, setMobileHeight5] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [webheight4, setWebHeight4] = useState(0);
  let editorContent: any = editorRef.current?.getContent();
  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".ButtonContainer3");
    height4 = getHeight(".ButtonContainer4");
    height5 = getHeight(".ButtonContainer5");
    height6 = getHeight(".FormBoxWrap");
    height7 = getHeight(".FormBoxWrap2");
    height8 = getHeight(".TitleContainer");
    height9 = getHeight(".ButtonContainer6");

    const handleWindowResize = () => {
      let deviceWidth = document.documentElement.clientWidth;

      setIsMobile(deviceWidth <= 1200);

      setMobileHeight(getDeviceHeight(true) - height2 - height8);
      setMobileHeight5(getDeviceHeight(true) - height9 - height8);
      setMobileHeight2(
        getDeviceHeight(true) - height3 - height7 - height8 + 15
      );
      setMobileHeight3(
        (getDeviceHeight(true) - height - height8) / 2 - height4 - 5
      );
      setMobileHeight4(
        (getDeviceHeight(true) - height - height8) / 2 - height5 - 5
      );
      setWebHeight(getDeviceHeight(true) - height - height2 - height8);
      setWebHeight2(
        getDeviceHeight(true) -
          height -
          height3 -
          height6 -
          height7 -
          height8 +
          15
      );
      setWebHeight3(
        (getDeviceHeight(true) - height - height8) / 2 - height4 - 5
      );
      setWebHeight4(
        (getDeviceHeight(true) - height - height8) / 2 - height5 - 5
      );
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [webheight, webheight2, webheight3, webheight4]);

  useEffect(() => {
    if(isMobile == true && deviceWidth <= 1200 && editorRef.current != null) {
      setHtmlOnEditor(editorContent);
    }
    if(isMobile == false && deviceWidth > 1200 && editorRef.current != null) {
      setHtmlOnEditor(editorContent);
    }
  }, [isMobile])
  const [page, setPage] = useState(initialPageState);
  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      findRowValue: "",
      isFetch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const processApi = useApi();
  const history = useHistory();

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [title, setTitle] = useRecoilState(titles);

  const idGetter = getter(DATA_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [allCustDataState, setAllCustDataState] = useState<State>({
    sort: [],
  });
  const [refCustDataState, setRefCustDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailData, setDetailData] = useState(defaultDetailData);

  const [allCustData, setAllCustData] = useState<DataResult>(
    process([], allCustDataState)
  );
  const [refCustData, setRefCustData] = useState<DataResult>(
    process([], refCustDataState)
  );

  const [allCustDragDataItem, setAllCustDragDataItem] = useState<any>(null);
  const [refCustDragDataItem, setRefCustDragDataItem] = useState<any>(null);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  let fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 1);

  const [filters, setFilters] = useState<TFilters>({
    fromDate: fromDate,
    toDate: new Date(),
    contents: "",
    findRowValue: "",
    pgNum: 1,
    pgSize: PAGE_SIZE,
    isFetch: true, // 조회여부 초기값
    isReset: false, // 리셋여부 초기값
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

  const search = () => {
    setFileList([]);
    setSavenmList([]);
    setPage(initialPageState); // 페이지 초기화
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
    if (localStorage.getItem("accessToken")) {
      fetchAllCust();
    }
  }, [refCustData]);

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

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };
  const onAllCustDataStateChange = (event: GridDataStateChangeEvent) => {
    setAllCustDataState(event.dataState);
  };
  const onRefCustDataStateChange = (event: GridDataStateChangeEvent) => {
    setRefCustDataState(event.dataState);
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
    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onAllCustSortChange = (e: any) => {
    setAllCustDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onRefCustSortChange = (e: any) => {
    setRefCustDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  /* 푸시 알림 클릭시 이동 테스트 코드 */
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          isFetch: true,
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("공지사항");
    }
  }, []);

  //그리드 데이터 조회
  const fetchGrid = useCallback(async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&contents=${
        filters.contents
      }&page=${filters.pgNum}&pageSize=${filters.pgSize}`,
    };

    try {
      data = await processApi<any>("notice-list", para);
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

      if (totalRowCnt > 0) {
        if (filters.isReset) {
          // 일반 데이터 조회
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          });
        } else {
          const selectedRow =
            filters.findRowValue == ""
              ? rows[0]
              : rows.find(
                  (row: any) => row[DATA_ITEM_KEY] == filters.findRowValue
                );

          setMainDataResult((prev) => {
            return {
              data: rows,
              total: totalRowCnt == -1 ? 0 : totalRowCnt,
            };
          });
          if (selectedRow != undefined) {
            setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
          } else {
            setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
          }
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
      data = await processApi<any>("notice-detail", para);
    } catch (error: any) {
      data = null;
    }

    if (data && data.result.isSuccess === true) {
      const document = data.document;
      const rowCount0 = data.result.tables[0].RowCount;
      const rowCount1 = data.result.tables[1].RowCount;

      if (rowCount0) {
        // 참조업체 데이터 세팅
        const rows = data.result.tables[0].Rows;

        setRefCustData({
          data: rows,
          total: rowCount0,
        });
      } else {
        setRefCustData({
          data: [],
          total: 0,
        });
      }

      if (rowCount1) {
        // 상세정보 데이터 세팅
        const row = data.result.tables[1].Rows[0];
        setDetailData((prev) => ({
          ...row,
          work_type: "U",
          notice_date: toDate(row.notice_date),
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
      if (selectedRow && isWithinOneMonth(selectedRow.notice_date)) {
        // 조회한 공지사항 쿠키에 저장
        const savedNoticesRaw = Cookies.get("readNotices");
        const savedNotices = savedNoticesRaw ? JSON.parse(savedNoticesRaw) : [];
        const updatedNotices = [...savedNotices, mainDataId];
        const uniqueNotices = Array.from(new Set(updatedNotices));

        Cookies.set("readNotices", JSON.stringify(uniqueNotices), {
          expires: 30,
        });
      }
    } else {
      console.log("[에러발생]");
      console.log(data);

      // 조회 실패 시
      resetDetailData();
    }
    setLoading(false);
  }, [selectedState, detailData, fileList, savenmList]);

  //그리드 데이터 조회
  const fetchAllCust = useCallback(async () => {
    if (!isAdmin) return false;
    let data: any;
    setLoading(true);

    const customerCodes = getCustomerCodes(refCustData.data);
    const para = {
      para: `customers?exclusionCodes=${customerCodes}`,
    };

    try {
      data = await processApi<any>("customers-list", para);
    } catch (error) {
      data = null;
    }

    if (data != null) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      setAllCustData((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });
    }
    setLoading(false);
  }, [refCustData]);

  // 상세정보 초기화
  const resetDetailData = () => {
    setDetailData({ ...defaultDetailData, notice_date: null });
    setRefCustData(process([], refCustDataState));

    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor("");
  };
  let gridRef: any = useRef(null);
  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

  const print = () => {
    const iframe = document.getElementById("editor")!.querySelector("iframe");

    if (iframe) {
      const iframeWindow: any = iframe.contentWindow;
      iframe.focus();
      iframeWindow.print();
    }

    return false;
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const refCustTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {refCustData.total}건
      </td>
    );
  };

  const allCustTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {allCustData.total}건
      </td>
    );
  };

  const refCustRowRender = (row: any, props: any) => {
    return (
      <DraggableGridRowRender
        props={props}
        row={row}
        onDrop={handleRefCustDrop}
        onDragStart={handleRefCustDragStart}
      />
    );
  };

  const allCustRowRender = (row: any, props: any) => {
    return (
      <DraggableGridRowRender
        props={props}
        row={row}
        onDrop={handleAllCustDrop}
        onDragStart={handleAllCustDragStart}
      />
    );
  };

  // 참조 업체 추가
  const handleRefCustDrop = (e: any, dataItem: any) => {
    setRefCustData((prev) => ({
      data: [...prev.data, ...[{ ...allCustDragDataItem, work_type: "N" }]],
      total: [...prev.data, ...[{ ...allCustDragDataItem, work_type: "N" }]]
        .length,
    }));
  };

  // 참조 업체 삭제
  const handleAllCustDrop = (e: any, dataItem: any) => {
    const newData = refCustData.data.filter(
      (row) => row?.customer_code !== refCustDragDataItem?.customer_code
    );

    setRefCustData((prev) => ({
      data: newData,
      total: newData.length,
    }));
  };

  const handleRefCustDragStart = (e: any, dataItem: any) => {
    setRefCustDragDataItem(dataItem);
  };
  const handleAllCustDragStart = (e: any, dataItem: any) => {
    setAllCustDragDataItem(dataItem);
  };

  const addAllCustToRefCust = () => {
    if (allCustData.total > 0) {
      setRefCustData((prev) => ({
        data: [
          ...prev.data,
          ...allCustData.data.map((data) => ({
            ...data,
            work_type: "N",
          })),
        ],
        total: allCustData.total,
      }));
    }
  };

  const createNotice = () => {
    setDetailData({ ...defaultDetailData, work_type: "N" });
    setRefCustData(process([], refCustDataState));

    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor("");

    if (swiper && isMobile) {
      swiper.slideTo(1);
    }
  };

  // ex. 파라미터 = {custcd : "10192", custnm : "a"}, {custcd : "43049", custnm : "b"} ]
  // => "10192|43049"
  const getCustomerCodes = (customers: TCustomer[]): string => {
    return customers.map((customer) => customer["customer_code"]).join("|");
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

  const saveNotice = useCallback(async () => {
    if(!navigator.onLine) {
      alert("네트워크 연결상태를 확인해주세요.");
      setLoading(false);
      return false;
    }
    
    let data: any;
    setLoading(true);

    if (!detailData.title) {
      alert("제목은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }
    if (!detailData.notice_date) {
      alert("공지일자은(는) 필수 입력 항목입니다.");
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
          "notice",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "notice",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "notice", detailData.attdatnum);
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
    let type = "notice";
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

    let editorContent = "";
    if (editorRef.current) {
      editorContent = editorRef.current.getContent();
    }

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const para = {
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_notice",
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_document_id": detailData.document_id,
        "@p_notice_date": convertDateToStr(detailData.notice_date),
        "@p_title": detailData.title,
        "@p_contents": detailData.contents,
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_customer_code_s": getCustomerCodes(refCustData.data),
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("notice-save", para);
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
  }, [detailData, refCustData, userId]);

  const deleteNotice = useCallback(async () => {
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
      data = await processApi<any>("notice-delete", para);
    } catch (error: any) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      let data2: any;
      try {
        data2 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=notice&attachmentNumber=" +
            selectedRow.attdatnum +
            "&id=",
        });
      } catch (error) {
        data2 = null;
      }

      setFilters((prev) => ({
        ...prev,
        isFetch: true,
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

  // 참조업체 행 더블클릭 => 참조 업체 삭제
  const refCustRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;
    const newData = refCustData.data.filter(
      (row) => row?.customer_code !== dataItem?.customer_code
    );

    setRefCustData((prev) => ({
      data: newData,
      total: newData.length,
    }));
  };

  // 전체업체 행 더블클릭 => 참조 업체 추가
  const allCustRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const { dataItem } = e;

    setRefCustData((prev) => ({
      data: [...prev.data, ...[{ ...dataItem, work_type: "N" }]],
      total: [...prev.data, ...[{ ...dataItem, work_type: "N" }]].length,
    }));
  };

  const onAlertClick = async () => {
    if (mainDataResult.data.length > 0) {
      if (detailData.work_type == "N") {
        alert("신규 데이터는 공지 알림 전송이 불가능합니다.");
      } else {
        if (!window.confirm("알림을 전송하시겠습니까?")) {
          return false;
        }
        let alerts: any;
        const alertPara = {
          para: `fcm-send?type=Notice&id=${detailData.document_id}`,
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
            <Title>공지사항</Title>
            <ButtonContainer style={{ rowGap: "5px" }}>
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
              {isAdmin && (
                <>
                  <Button
                    themeColor={"primary"}
                    icon="file-add"
                    onClick={createNotice}
                  >
                    신규
                  </Button>
                  <Button
                    themeColor={"primary"}
                    fillMode={"outline"}
                    icon="save"
                    onClick={saveNotice}
                  >
                    저장
                  </Button>
                  <Button
                    themeColor={"primary"}
                    fillMode={"outline"}
                    icon="delete"
                    onClick={deleteNotice}
                  >
                    삭제
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
          <FilterContainer>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>공지일자</th>
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
              <GridContainer style={{ width: "100%" }}>
                <GridTitleContainer className="ButtonContainer2">
                  <GridTitle>
                    요약정보
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
                      notice_date: dateformat2(row.notice_date),
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
                    field="notice_date"
                    title="공지일자"
                    width={110}
                    cell={CenterCell}
                    footerCell={mainTotalFooterCell}
                  />
                  <GridColumn field="title" title="제목" />
                </Grid>
              </GridContainer>
            </SwiperSlide>
            <SwiperSlide key={1}>
              <GridContainer style={{ width: "100%" }}>
                <GridTitleContainer className="ButtonContainer6">
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
                </GridTitleContainer>
                <FormBoxWrap
                  border
                  className="FormBoxWrap"
                  style={{ height: mobileheight5, overflow: "auto" }}
                >
                  <FormBox>
                    <tbody>
                      <tr>
                        <th>공지일자</th>
                        <td>
                          {isAdmin ? (
                            <DatePicker
                              name="notice_date"
                              value={detailData.notice_date}
                              format="yyyy-MM-dd"
                              onChange={detailDataInputChange}
                              className={"required"}
                              placeholder=""
                            />
                          ) : (
                            <Input
                              name="notice_date"
                              type="text"
                              value={dateformat2(
                                convertDateToStr(detailData.notice_date)
                              )}
                              onChange={detailDataInputChange}
                              className={!isAdmin ? "readonly" : "required"}
                              readOnly={!isAdmin}
                            />
                          )}
                        </td>
                        <th>제목</th>
                        <td>
                          <Input
                            name="title"
                            type="text"
                            value={detailData.title}
                            onChange={detailDataInputChange}
                            className={!isAdmin ? "readonly" : "required"}
                            readOnly={!isAdmin}
                          />
                        </td>
                        {isAdmin && (
                          <td>
                            <Button
                              icon={"notification"}
                              onClick={onAlertClick}
                              themeColor={"primary"}
                              fillMode={"outline"}
                            >
                              공지 알림 전송
                            </Button>
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </FormBox>
                </FormBoxWrap>
              </GridContainer>
            </SwiperSlide>
            <SwiperSlide key={2}>
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
                  상세정보
                  {isAdmin && (
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
                  )}
                </GridTitle>
              </GridTitleContainer>
              <div style={{ height: mobileheight2 }}>
                <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
              </div>
              <FormBoxWrap
                border
                className="FormBoxWrap2"
                style={{
                  margin: 0,
                  borderTop: 0,
                }}
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
            {isAdmin && (
              <SwiperSlide key={3}>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer4">
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
                      참조 업체
                    </GridTitle>
                    {isAdmin && (
                      <ButtonContainer>
                        <Button
                          themeColor={"primary"}
                          icon="refresh"
                          fillMode={"flat"}
                          onClick={() =>
                            setRefCustData(process([], refCustDataState))
                          }
                        ></Button>
                      </ButtonContainer>
                    )}
                  </GridTitleContainer>
                  <Grid
                    style={{ height: mobileheight3, margin: "5px 0" }}
                    data={process(
                      // 적어도 한개의 행은 나오도록 처리 (그리드 행이 있어야 드롭 가능)
                      refCustData.data.length === 0
                        ? [{}]
                        : refCustData.data.map((row) => ({
                            ...row,
                          })),
                      refCustDataState
                    )}
                    {...refCustDataState}
                    onDataStateChange={onRefCustDataStateChange}
                    dataItemKey={CUST_DATA_ITEM_KEY}
                    //정렬기능
                    sortable={true}
                    onSortChange={onRefCustSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    rowRender={refCustRowRender}
                    //행 클릭 이벤트
                    onRowDoubleClick={refCustRowDoubleClick}
                  >
                    <GridColumn field="work_type" title=" " width={50} />
                    <GridColumn
                      field="customer_name"
                      title="업체명"
                      footerCell={refCustTotalFooterCell}
                    />
                  </Grid>
                </GridContainer>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer5">
                    <GridTitle>전체 업체</GridTitle>

                    <ButtonContainer>
                      <Button
                        themeColor={"primary"}
                        fillMode={"outline"}
                        icon="filter-add-expression"
                        onClick={addAllCustToRefCust}
                      >
                        전체 추가
                      </Button>
                      <Button
                        onClick={fetchAllCust}
                        themeColor={"primary"}
                        icon="refresh"
                        fillMode={"flat"}
                      ></Button>
                    </ButtonContainer>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: mobileheight4 }}
                    data={process(
                      allCustData.data.map((row) => ({
                        ...row,
                        // [SELECTED_FIELD]: selectedState[idGetter(row)],
                      })),
                      allCustDataState
                    )}
                    {...allCustDataState}
                    onDataStateChange={onAllCustDataStateChange}
                    dataItemKey={CUST_DATA_ITEM_KEY}
                    //정렬기능
                    sortable={true}
                    onSortChange={onAllCustSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    rowRender={allCustRowRender}
                    //필터기능
                    filterable={true}
                    //행 클릭 이벤트
                    onRowDoubleClick={allCustRowDoubleClick}
                  >
                    <GridColumn
                      field="customer_name"
                      title="업체명"
                      footerCell={allCustTotalFooterCell}
                    />
                  </Grid>
                </GridContainer>
              </SwiperSlide>
            )}
          </Swiper>
        </>
      ) : (
        <>
          <TitleContainer className="TitleContainer">
            {!isMobile ? "" : <Title>공지사항</Title>}
            <ButtonContainer>
              <Button onClick={search} icon="search" themeColor={"primary"}>
                조회
              </Button>
              {isAdmin && (
                <>
                  <Button
                    themeColor={"primary"}
                    icon="file-add"
                    onClick={createNotice}
                  >
                    신규
                  </Button>
                  <Button
                    themeColor={"primary"}
                    fillMode={"outline"}
                    icon="save"
                    onClick={saveNotice}
                  >
                    저장
                  </Button>
                  <Button
                    themeColor={"primary"}
                    fillMode={"outline"}
                    icon="delete"
                    onClick={deleteNotice}
                  >
                    삭제
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
          <GridTitleContainer className="ButtonContainer">
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
          <FilterContainer>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>공지일자</th>
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
          <GridContainerWrap>
            <GridContainer width={isAdmin ? "25%" : `30%`}>
              <GridTitleContainer className="ButtonContainer2">
                <GridTitle>요약정보</GridTitle>
              </GridTitleContainer>
              <Grid
                style={{ height: webheight }}
                data={process(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]: selectedState[idGetter(row)],
                    notice_date: dateformat2(row.notice_date),
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
                  field="notice_date"
                  title="공지일자"
                  width={110}
                  cell={CenterCell}
                  footerCell={mainTotalFooterCell}
                />
                <GridColumn field="title" title="제목" />
              </Grid>
            </GridContainer>
            <GridContainer
              width={isAdmin ? `calc(45% - ${GAP}px)` : `calc(70% - ${GAP}px)`}
            >
              <GridTitleContainer className="ButtonContainer3">
                <GridTitle>상세정보</GridTitle>
              </GridTitleContainer>
              <FormBoxWrap border className="FormBoxWrap">
                <FormBox>
                  <tbody>
                    <tr>
                      <th>공지일자</th>
                      <td>
                        {isAdmin ? (
                          <DatePicker
                            name="notice_date"
                            value={detailData.notice_date}
                            format="yyyy-MM-dd"
                            onChange={detailDataInputChange}
                            className={"required"}
                            placeholder=""
                          />
                        ) : (
                          <Input
                            name="notice_date"
                            type="text"
                            value={dateformat2(
                              convertDateToStr(detailData.notice_date)
                            )}
                            onChange={detailDataInputChange}
                            className={!isAdmin ? "readonly" : "required"}
                            readOnly={!isAdmin}
                          />
                        )}
                      </td>
                      <th>제목</th>
                      <td>
                        <Input
                          name="title"
                          type="text"
                          value={detailData.title}
                          onChange={detailDataInputChange}
                          className={!isAdmin ? "readonly" : "required"}
                          readOnly={!isAdmin}
                        />
                      </td>
                      {isAdmin && (
                        <td>
                          <Button
                            icon={"notification"}
                            onClick={onAlertClick}
                            themeColor={"primary"}
                            fillMode={"outline"}
                          >
                            공지 알림 전송
                          </Button>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </FormBox>
              </FormBoxWrap>
              <div style={{ height: webheight2 }}>
                <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
              </div>
              <FormBoxWrap
                border
                className="FormBoxWrap2"
                style={{
                  margin: 0,
                  borderTop: 0,
                }}
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
            {isAdmin && (
              <GridContainer width="30%">
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer4">
                    <GridTitle>참조 업체</GridTitle>
                    {isAdmin && (
                      <ButtonContainer>
                        <Button
                          themeColor={"primary"}
                          icon="refresh"
                          fillMode={"flat"}
                          onClick={() =>
                            setRefCustData(process([], refCustDataState))
                          }
                        ></Button>
                      </ButtonContainer>
                    )}
                  </GridTitleContainer>
                  <Grid
                    style={{ height: webheight3, margin: "5px 0" }}
                    data={process(
                      // 적어도 한개의 행은 나오도록 처리 (그리드 행이 있어야 드롭 가능)
                      refCustData.data.length === 0
                        ? [{}]
                        : refCustData.data.map((row) => ({
                            ...row,
                          })),
                      refCustDataState
                    )}
                    {...refCustDataState}
                    onDataStateChange={onRefCustDataStateChange}
                    dataItemKey={CUST_DATA_ITEM_KEY}
                    //정렬기능
                    sortable={true}
                    onSortChange={onRefCustSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    rowRender={refCustRowRender}
                    //행 클릭 이벤트
                    onRowDoubleClick={refCustRowDoubleClick}
                  >
                    <GridColumn field="work_type" title=" " width={50} />
                    <GridColumn
                      field="customer_name"
                      title="업체명"
                      footerCell={refCustTotalFooterCell}
                    />
                  </Grid>
                </GridContainer>
                <GridContainer>
                  <GridTitleContainer className="ButtonContainer5">
                    <GridTitle>전체 업체</GridTitle>

                    <ButtonContainer>
                      <Button
                        themeColor={"primary"}
                        fillMode={"outline"}
                        icon="filter-add-expression"
                        onClick={addAllCustToRefCust}
                      >
                        전체 추가
                      </Button>
                      <Button
                        onClick={fetchAllCust}
                        themeColor={"primary"}
                        icon="refresh"
                        fillMode={"flat"}
                      ></Button>
                    </ButtonContainer>
                  </GridTitleContainer>
                  <Grid
                    style={{ height: webheight4 }}
                    data={process(
                      allCustData.data.map((row) => ({
                        ...row,
                        // [SELECTED_FIELD]: selectedState[idGetter(row)],
                      })),
                      allCustDataState
                    )}
                    {...allCustDataState}
                    onDataStateChange={onAllCustDataStateChange}
                    dataItemKey={CUST_DATA_ITEM_KEY}
                    //정렬기능
                    sortable={true}
                    onSortChange={onAllCustSortChange}
                    //컬럼순서조정
                    reorderable={true}
                    //컬럼너비조정
                    resizable={true}
                    rowRender={allCustRowRender}
                    //필터기능
                    filterable={true}
                    //행 클릭 이벤트
                    onRowDoubleClick={allCustRowDoubleClick}
                  >
                    <GridColumn
                      field="customer_name"
                      title="업체명"
                      footerCell={allCustTotalFooterCell}
                    />
                  </Grid>
                </GridContainer>
              </GridContainer>
            )}
          </GridContainerWrap>
        </>
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          type="notice"
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
    </>
  );
};
export default App;
