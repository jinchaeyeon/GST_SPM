import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { Icon } from "@progress/kendo-react-common";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  DropDownList,
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import jwtDecode from "jwt-decode";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
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
  QnAPwBox,
  Title,
  TitleContainer,
} from "../CommonStyled";
import CenterCell from "../components/Cells/CenterCell";
import CheckCell from "../components/Cells/CheckCell";
import QnAStateCell from "../components/Cells/QnAStateCell";
import {
  convertDateToStr,
  dateformat2,
  handleKeyPressSearch,
  toDate,
} from "../components/CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { useApi } from "../hooks/api";
import {
  filterValueState,
  isLoading,
  loginResultState,
  titles,
} from "../store/atoms";
import { TEditorHandle } from "../store/types";

type TItem = {
  sub_code: string;
  code_name: string;
};

//조회조건 초기값
type TFilters = {
  dateType: { value: string; label: string };
  fromDate: Date;
  toDate: Date;
  userName: string;
  contents: string;
  isPublic: string;
  status: { sub_code: string; code_name: string }[];
  custnm: string;
  findRowValue: string;
  pgNum: number;
  pgSize: number;
  isFetch: boolean;
  isReset: boolean;
};

const dateType = [
  { value: "A", label: "요청일" },
  { value: "B", label: "접수일" },
  { value: "C", label: "완료예정일" },
];

const DATA_ITEM_KEY = "document_id";
const isPublicListData = [
  { value: "Y", label: "공개" },
  { value: "N", label: "비공개" },
  { value: "All", label: "전체" },
];

const columns = [
  { field: "code_name", header: "이름", width: "200px" },
  { field: "sub_code", header: "코드", width: "200px" },
];
const statusListData: TItem[] = [
  { sub_code: "1", code_name: "대기" },
  { sub_code: "2", code_name: "진행중" },
  { sub_code: "4", code_name: "보류" },
  { sub_code: "8", code_name: "완료" },
];
const detailDataStatusListData: TItem[] = [
  { sub_code: "N", code_name: "대기" },
  { sub_code: "R", code_name: "진행중" },
  { sub_code: "H", code_name: "보류" },
  { sub_code: "Y", code_name: "완료" },
];

const defaultDetailData = {
  work_type: "N",
  document_id: "",
  title: "",
  password: "",
  user_name: "",
  user_tel: "",
  is_public: "Y",
  is_lock: false,
  request_date: new Date(),
  be_finished_date: "",
  reception_date: "",
  status: { code_name: "", sub_code: "" },
  attdatnum: "",
  files: "",
  answer_attdatnum: "",
  answer_document_id: "",
  answer_files: "",
};
let targetRowIndex: null | number = null;
const App = () => {
  const [loginResult] = useRecoilState(loginResultState);
  const accessToken = localStorage.getItem("accessToken");
  const [token] = useState(accessToken);
  const decodedToken: any = token ? jwtDecode(token) : undefined;
  const { customercode = "" } = decodedToken || {};
  const [filterValue, setFilterValue] = useRecoilState(filterValueState);
  const setLoading = useSetRecoilState(isLoading);
  const [title, setTitle] = useRecoilState(titles);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const qEditorRef = useRef<TEditorHandle>(null);
  const aEditorRef = useRef<TEditorHandle>(null);
  const [isDataLocked, setIsDataLocked] = useState(false);
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const history = useHistory();
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const pwInputRef: any = useRef(null);
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isFetch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };
  const isAdmin = loginResult && loginResult.role === "ADMIN";

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

  const filterMultiSelectChange = (event: MultiSelectChangeEvent) => {
    const values = event.value;

    setFilters((prev) => ({
      ...prev,
      status: values,
    }));
  };

  let fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 10); // 시작일 설정

  const [filters, setFilters] = useState<TFilters>({
    dateType: dateType[0],
    fromDate: fromDate,
    toDate: new Date(),
    userName: "",
    contents: "",
    isPublic: "All",
    status: [
      { sub_code: "1", code_name: "대기" },
      { sub_code: "2", code_name: "진행중" },
      { sub_code: "4", code_name: "보류" },
    ],
    custnm: "",
    findRowValue: "",
    pgNum: 1,
    pgSize: PAGE_SIZE,
    isFetch: true, // 조회여부 초기값
    isReset: false, // 리셋여부 초기값
  });

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
  };

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

  const [attachmentsWindowVisibleQ, setAttachmentsWindowVisibleQ] =
    useState<boolean>(false);

  const [attachmentsWindowVisibleA, setAttachmentsWindowVisibleA] =
    useState<boolean>(false);

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

    setFileList([]);
    setSavenmList([]);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  //그리드 데이터 조회
  const fetchGrid = async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length === 0
        ? 0 // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].sub_code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : filters.status.reduce(
            (total, current) => total + Number(current.sub_code),
            0
          ); //  2개 이상 선택시 => 값 합치기 (ex. 1 대기 + 2 진행중 = 3 )

    const para = {
      para: `list?dateType=${
        filters.dateType.value
      }&fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&userName=${
        filters.userName
      }&contents=${filters.contents}&customerName=${filters.custnm}&isPublic=${
        filters.isPublic
      }&status=${status}&page=${filters.pgNum}&pageSize=${filters.pgSize}`,
    };

    try {
      data = await processApi<any>("qna-list", para);
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
      } else {
        // 결과 행이 0인 경우 데이터 리셋
        setMainDataResult(process([], mainDataState));
        setSelectedState({});
        resetDetailData();
        setHtmlOnEditor({
          questionDocument: "",
          answerDocument: "",
        });
        setIsDataLocked(false);
      }
    }
    setLoading(false);
  };

  const fetchDetail = useCallback(
    async (enteredPw: string = "") => {
      let data: any;
      setLoading(true);

      const bytes = require("utf8-bytes");
      const convertedPassword = bytesToBase64(bytes(detailData.password));

      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
      const para = {
        id: mainDataId,
        password: convertedPassword,
      };

      try {
        data = await processApi<any>("qna-detail", para);
      } catch (error: any) {
        data = null;
        console.log(
          "It shoud be 'true' => " +
            (error.message === "비밀번호를 확인해 주십시오.")
        );
        console.log(error);
        if (error.message === "비밀번호를 확인해 주십시오.") {
          setIsDataLocked(true);
        }
      }

      if (data && data.result.isSuccess === true) {
        const questionDocument = data.questionDocument;
        const answerDocument = data.answerDocument;
        const rowCount = data.result.tables[0].RowCount;

        if (rowCount) {
          setIsDataLocked(false);
          // 상세정보 데이터 세팅
          const row = data.result.tables[0].Rows[0];
          setDetailData((prev) => ({
            ...row,
            work_type: "U",
            password: enteredPw,
            is_lock: row.is_lock === "Y" ? true : false,
            status: detailDataStatusListData.find(
              (item: any) => item["sub_code"] === row.status
            ),
            request_date: toDate(row.request_date),
            reception_date: dateformat2(row.reception_date),
            be_finished_date: dateformat2(row.be_finished_date),
          }));
        }

        setHtmlOnEditor({
          questionDocument,
          answerDocument,
        });
      } else {
        console.log("[에러발생]");
        console.log(data);

        resetDetailData();
      }
      setLoading(false);
    },
    [selectedState, setLoading, detailData, setIsDataLocked]
  );

  const setHtmlOnEditor = ({
    questionDocument,
    answerDocument,
  }: {
    questionDocument: string;
    answerDocument: string;
  }) => {
    if (qEditorRef.current) {
      if (isAdmin) qEditorRef.current.updateEditable(true);
      qEditorRef.current.setHtml(questionDocument);
      if (isAdmin) qEditorRef.current.updateEditable(false);
    }

    if (aEditorRef.current) {
      aEditorRef.current.updateEditable(true);
      aEditorRef.current.setHtml(answerDocument);
      aEditorRef.current.updateEditable(false);
    }
  };
  let gridRef: any = useRef(null);
  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

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

  const saveData = useCallback(async () => {
    let data: any;
    setLoading(true);

    let editorContent = "";
    if (qEditorRef.current) {
      editorContent = qEditorRef.current.getContent();
    }

    if (!detailData.title) {
      alert("제목은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }
    if (!detailData.user_name) {
      alert("작성자은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }
    if (!detailData.request_date) {
      alert("요청일은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }
    if (detailData.is_lock && !detailData.password) {
      alert("비밀번호를 입력해주세요.");
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
          "question",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "question",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "question", detailData.attdatnum);
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
    let type = "question";
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

    // 에디터 내 문자 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, "text/html");
    const textContent = doc.body.textContent || "";

    const bytes2 = require("utf8-bytes");
    const convertedPassword = bytesToBase64(bytes2(detailData.password));
    const urlEncodedPassword = encodeURIComponent(convertedPassword);

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const para = {
      para: `qna?password=${urlEncodedPassword}`,
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_questions",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_document_id": detailData.document_id,
        "@p_password": "",
        "@p_salt": "",
        "@p_customer_code":
          customercode == "" ? loginResult.userId : customercode,
        "@p_user_id": loginResult.userId,
        "@p_user_name": detailData.user_name,
        "@p_user_tel": detailData.user_tel,
        "@p_request_date": convertDateToStr(detailData.request_date),
        "@p_title": detailData.title,
        "@p_contents": textContent,
        "@p_is_lock": detailData.is_lock ? "Y" : "N",
        "@p_is_public": detailData.is_public,
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_pc": "",
      },
    };

    try {
      data = await processApi<any>("qna-save", para);
    } catch (error: any) {
      alert(error.message);
      data = null;
    }

    if (data && data.isSuccess === true) {
      if (detailData.work_type == "N") {
        let alerts: any;
        const alertPara = {
          para: `fcm-send?type=Question&id=${data.returnString}`,
        };
        try {
          alerts = await processApi<any>("alert", alertPara);
        } catch (error) {
          alerts = null;
        }
      }
      alert("등록되었습니다.");
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
  }, [setLoading, detailData, setSelectedState]);

  const deleteData = useCallback(async () => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId
    );

    if (
      !window.confirm("[" + selectedRow.title + "] 문의 글을 삭제하시겠습니까")
    )
      return false;

    let data: any;
    setLoading(true);

    const bytes = require("utf8-bytes");
    const convertedPassword = bytesToBase64(bytes(detailData.password));

    const para = {
      id: selectedRow.document_id,
      password: convertedPassword,
    };

    try {
      data = await processApi<any>("qna-delete", para);
    } catch (error: any) {
      alert(error.message);
      data = null;
    }

    if (data && data.isSuccess === true) {
      // // 첨부파일 서버에서 삭제
      // if (unsavedAttadatnums.attdatnums.length > 0) {
      //   // DB 저장안된 첨부파일
      //   setDeletedAttadatnums(unsavedAttadatnums);
      // } else if (selectedRow.attdatnum) {
      //   // DB 저장된 첨부파일
      //   setDeletedAttadatnums((prev) => ({
      //     type: [...prev.type, "notice"],
      //     attdatnums: [...prev.attdatnums, selectedRow.attdatnum],
      //   }));
      // }
      let data2: any;
      try {
        data2 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=question&attachmentNumber=" +
            selectedRow.attdatnum +
            "&id=",
        });
      } catch (error) {
        data2 = null;
      }

      alert("삭제되었습니다.");
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
      }));
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  }, [setLoading, detailData]);

  // 상세정보 & 답변 초기화
  const resetDetailData = () => {
    setDetailData(defaultDetailData);

    setHtmlOnEditor({
      questionDocument: "",
      answerDocument: "",
    });
  };

  useEffect(() => {
    if (
      filterValue.type !== "qna" &&
      filters.isFetch &&
      localStorage.getItem("accessToken")
    ) {
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
    // 메인 그리드에서 클릭하여 오픈시 조회조건 재설정하여 조회
    if (filterValue.type === "qna" && localStorage.getItem("accessToken")) {
      const isExceedFromDate =
        convertDateToStr(fromDate) > filterValue.dataItem.request_date;

      const newFromDate = toDate(filterValue.dataItem.request_date) ?? fromDate;

      setFilters((prev) => ({
        ...prev,
        status: [
          { sub_code: "1", code_name: "대기" },
          { sub_code: "2", code_name: "진행중" },
          { sub_code: "4", code_name: "보류" },
        ],
        custnm: filterValue.dataItem.customer_name,
        fromDate: isExceedFromDate ? newFromDate : fromDate,
        isFetch: true,
        isReset: true,
        findRowValue: filterValue.dataItem[DATA_ITEM_KEY],
      }));

      setFilterValue({ type: null, dataItem: {} });
    }
  }, [filterValue]);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

      if (mainDataId) {
        fetchDetail();
      }
    }
  }, [selectedState]);

  useEffect(() => {
    // 미잠금시, 공개여부 공개로 설정
    if (
      !detailData.is_lock &&
      detailData.is_public !== "Y" &&
      localStorage.getItem("accessToken")
    ) {
      setDetailData((prev) => ({ ...prev, is_public: "Y" }));
    }
  }, [detailData]);

  useEffect(() => {
    if (
      isDataLocked &&
      detailData.work_type !== "N" &&
      pwInputRef.current &&
      localStorage.getItem("accessToken")
    ) {
      pwInputRef.current.focus();
    }
  }, [isDataLocked, detailData]);

  /* 푸시 알림 클릭시 이동 테스트 코드 */
  useEffect(() => {
    if (filterValue.type !== "qna" && localStorage.getItem("accessToken")) {
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.has("go")) {
        history.replace({}, "");
        setFilters((prev) => ({
          ...prev,
          status: [
            { sub_code: "1", code_name: "대기" },
            { sub_code: "2", code_name: "진행중" },
            { sub_code: "4", code_name: "보류" },
            { sub_code: "8", code_name: "완료" },
          ],
          isFetch: true,
          findRowValue: queryParams.get("go") as string,
        }));
      }
      setTitle("QnA");
    }
  }, []);

  const addData = () => {
    setDetailData((prev) => ({
      ...prev,
      ...defaultDetailData,
    }));

    setHtmlOnEditor({
      questionDocument: "",
      answerDocument: "",
    });

    setIsDataLocked(false);
  };

  const handleKeyPressSearchDetail = (
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (e.key === "Enter") {
      fetchDetail(detailData.password);
    }
  };

  const getAttachmentsDataQ = (
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

  const getAttachmentsDataA = (data: any) => {
    setDetailData((prev) => ({
      ...prev,
      answer_attdatnum:
        data.length > 0 ? data[0].attdatnum : prev.answer_attdatnum,
      answer_files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  const checkAnswer = async () => {
    let data: any;

    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];

    if (!mainDataId) {
      alert("선택된 자료가 없습니다.");
      return false;
    }
    const selectedRow = mainDataResult.data.find(
      (item) => item[DATA_ITEM_KEY] === mainDataId
    );

    if (!selectedRow.answer_document_id) {
      alert("답변이 등록되지 않았습니다.");
      return false;
    }

    const queryStr = `UPDATE QuestionAndReceptions 
    SET check_date = ${selectedRow.is_checked === "Y" ? "null" : "GETDATE()"} 
    WHERE document_id = '${selectedRow.document_id}'`;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    setLoading(true);
    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess) {
      setFileList([]);
      setSavenmList([]);
      // 조회
      setFilters((prev) => ({
        ...prev,
        isFetch: true,
        pgNum: 1,
        findRowValue: selectedRow.document_id,
      }));
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const selectedItem = mainDataResult.data.find(
    (item) =>
      item[DATA_ITEM_KEY] === Object.getOwnPropertyNames(selectedState)[0] ?? ""
  );

  const isChecked = selectedItem && selectedItem.is_checked === "Y";

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const filterRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <TitleContainer>
        {!isMobile ? "" : <Title>QnA</Title>}
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          {!isAdmin && (
            <>
              <Button onClick={addData} icon="file-add" themeColor={"primary"}>
                신규
              </Button>
              <Button
                onClick={saveData}
                fillMode="outline"
                themeColor={"primary"}
                icon="save"
              >
                저장
              </Button>
              <Button
                onClick={deleteData}
                fillMode="outline"
                themeColor={"primary"}
                icon="delete"
              >
                삭제
              </Button>
            </>
          )}
        </ButtonContainer>
      </TitleContainer>

      <GridContainerWrap height={"88%"}>
        <GridContainer width={`40%`}>
          <GridTitleContainer>
            <GridTitle>조회조건</GridTitle>
          </GridTitleContainer>
          <FilterBoxWrap ref={filterRef} style={{ padding: "0 0 10px" }}>
            <FilterBox
              onKeyPress={(e) => {
                handleKeyPressSearch(e, search);
              }}
            >
              <tbody>
                <tr>
                  <th style={{ paddingRight: "5px", paddingLeft: "5px" }}>
                    <DropDownList
                      name="dateType"
                      data={dateType}
                      textField="label"
                      dataItemKey="value"
                      value={filters.dateType}
                      onChange={filterInputChange}
                    />
                  </th>
                  <td>
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
                  <th>공개 여부</th>
                  <td colSpan={3}>
                    <RadioGroup
                      name="isPublic"
                      data={isPublicListData}
                      value={filters.isPublic}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, isPublic: e.value }))
                      }
                      layout="horizontal"
                    />
                  </td>
                </tr>
                <tr>
                  <th>상태</th>
                  <td>
                    <MultiSelect
                      data={statusListData}
                      onChange={filterMultiSelectChange}
                      value={filters.status}
                      textField="code_name"
                      dataItemKey="sub_code"
                    />
                  </td>
                  <th>작성자</th>
                  <td>
                    <Input
                      name="userName"
                      type="text"
                      value={filters.userName}
                      onChange={filterInputChange}
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
                request_date: dateformat2(row.request_date),
                reception_date: dateformat2(row.reception_date),
                be_finished_date: dateformat2(row.be_finished_date),
                completion_date: dateformat2(row.completion_date),
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
              width={80}
              cell={QnAStateCell}
              footerCell={mainTotalFooterCell}
            />
            <GridColumn
              field="request_date"
              title="요청일"
              width={100}
              cell={CenterCell}
            />
            {isAdmin && (
              <GridColumn field="customer_name" title="업체명" width={120} />
            )}
            <GridColumn field="user_name" title="작성자" width={100} />
            <GridColumn field="title" title="제목" width={200} />
            {!isAdmin && (
              <GridColumn
                field="is_checked"
                title="답변 확인"
                width={80}
                cell={CheckCell}
              />
            )}
            <GridColumn
              field="reception_date"
              title="접수일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn
              field="be_finished_date"
              title="완료예정일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn
              field="completion_date"
              title="처리완료일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn field="contents" title="내용" width={150} />
          </Grid>
        </GridContainer>
        <GridContainerWrap flexDirection="column">
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>

          <GridContainer
            style={
              !isAdmin && isDataLocked
                ? { display: "none", height: "100%" }
                : { height: "100%" }
            }
          >
            <FormBoxWrap
              border
              style={{
                margin: "0 0 10px",
              }}
            >
              <FormBox>
                <tbody>
                  <tr>
                    <th>제목</th>
                    <td colSpan={3}>
                      <Input
                        name="title"
                        type="text"
                        value={detailData.title}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : "required"}
                        readOnly={isAdmin}
                      />
                    </td>
                    <th>작성자</th>
                    <td colSpan={3}>
                      <Input
                        name="user_name"
                        type="text"
                        value={detailData.user_name}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : "required"}
                        readOnly={isAdmin}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>
                      <Input
                        name="user_tel"
                        type="text"
                        value={detailData.user_tel}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : ""}
                        readOnly={isAdmin}
                      />
                    </td>
                    <th>비밀번호</th>
                    <td>
                      <div className="filter-item-wrap">
                        <Input
                          name="password"
                          type="password"
                          value={detailData.password}
                          onChange={detailDataInputChange}
                          className={
                            isAdmin
                              ? "readonly"
                              : detailData.is_lock
                              ? "required"
                              : ""
                          }
                          readOnly={isAdmin}
                          autoComplete={"false"}
                        />
                        <Button
                          icon={detailData.is_lock ? "lock" : "unlock"}
                          themeColor={"primary"}
                          fillMode={"flat"}
                          onClick={() =>
                            setDetailData((prev) => ({
                              ...prev,
                              is_lock: !prev.is_lock,
                            }))
                          }
                          disabled={isAdmin}
                        />
                      </div>
                    </td>
                    <th>공개 여부</th>
                    <td colSpan={3}>
                      <RadioGroup
                        name="is_public"
                        data={isPublicListData.filter(
                          (data) => data.value !== "All"
                        )}
                        value={detailData.is_public}
                        onChange={(e) =>
                          setDetailData((prev) => ({
                            ...prev,
                            is_public: e.value,
                          }))
                        }
                        layout="horizontal"
                        className={isAdmin ? "readonly" : "required"}
                        disabled={detailData.is_lock && !isAdmin ? false : true}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>요청일</th>
                    <td>
                      {isAdmin ? (
                        <Input
                          name="request_date"
                          type="text"
                          value={dateformat2(
                            convertDateToStr(detailData.request_date)
                          )}
                          className="readonly"
                          readOnly
                        />
                      ) : (
                        <DatePicker
                          name="request_date"
                          value={detailData.request_date}
                          onChange={detailDataInputChange}
                          format="yyyy-MM-dd"
                          className={"required"}
                          placeholder=""
                        />
                      )}
                    </td>
                    <th>완료예정일</th>
                    <td>
                      <Input
                        name="be_finished_date"
                        type="text"
                        value={detailData.be_finished_date}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                    <th>접수일</th>
                    <td>
                      <Input
                        name="reception_date"
                        type="text"
                        value={detailData.reception_date}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                    <th>상태</th>
                    <td>
                      <Input
                        name="status"
                        type="text"
                        value={detailData.status.code_name}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
            <RichEditor id="qEditor" ref={qEditorRef} hideTools={isAdmin} />
            <FormBoxWrap
              border
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
                          onClick={() => setAttachmentsWindowVisibleQ(true)}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
            <GridTitleContainer>
              <GridTitle>답변</GridTitle>
              <ButtonContainer>
                {!isAdmin && (
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={isChecked ? "x" : "check"}
                    onClick={checkAnswer}
                  >
                    {isChecked ? "답변 확인 취소" : "답변 확인"}
                  </Button>
                )}
              </ButtonContainer>
            </GridTitleContainer>
            <GridContainer style={{ maxHeight: "170px" }}>
              <RichEditor id="aEditor" ref={aEditorRef} hideTools />
            </GridContainer>
            <FormBoxWrap
              border
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
                          name="attachment_a"
                          value={detailData.answer_files}
                          className="readonly"
                        />
                        <Button
                          icon="more-horizontal"
                          fillMode={"flat"}
                          onClick={() => setAttachmentsWindowVisibleA(true)}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
          </GridContainer>
          {!isAdmin && isDataLocked && (
            <QnAPwBox onKeyPress={handleKeyPressSearchDetail}>
              <div className="inner">
                <Icon name="lock" themeColor="primary" size={"xlarge"} />
                <p>비밀번호를 입력해주세요.</p>
                <Input
                  name="password"
                  type="password"
                  value={detailData.password}
                  onChange={detailDataInputChange}
                  ref={pwInputRef}
                />
                <Button
                  themeColor={"primary"}
                  onClick={() => fetchDetail(detailData.password)}
                >
                  확인
                </Button>
              </div>
            </QnAPwBox>
          )}
        </GridContainerWrap>
      </GridContainerWrap>
      {attachmentsWindowVisibleQ && (
        <AttachmentsWindow
          type="question"
          setVisible={setAttachmentsWindowVisibleQ}
          setData={getAttachmentsDataQ}
          para={detailData.attdatnum}
          permission={{ upload: !isAdmin, download: true, delete: !isAdmin }}
          modal={true}
          fileLists={!isAdmin ? fileList : []}
          savenmLists={!isAdmin ? savenmList : []}
        />
      )}
      {attachmentsWindowVisibleA && (
        <AttachmentsWindow
          type="answer"
          setVisible={setAttachmentsWindowVisibleA}
          setData={getAttachmentsDataA}
          para={detailData.answer_attdatnum}
          permission={{ upload: false, download: true, delete: false }}
          modal={true}
        />
      )}
    </>
  );
};
export default App;
