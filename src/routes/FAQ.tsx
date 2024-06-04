import {
  DataResult,
  filterBy,
  getter,
  process,
  State,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridPageChangeEvent,
  GridSelectionChangeEvent
} from "@progress/kendo-react-grid";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { FilterDescriptor } from "devextreme/data";
import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Title,
  TitleContainer,
} from "../CommonStyled";
import CenterCell from "../components/Cells/CenterCell";
import {
  convertDateToStr,
  dateformat2,
  handleKeyPressSearch,
  isWithinOneMonth,
  toDate,
  UseParaPc
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { useApi } from "../hooks/api";
import { isLoading, loginResultState, titles } from "../store/atoms";
import { dataTypeColumns } from "../store/columns/common-columns";
import { Iparameters, TEditorHandle } from "../store/types";

type TFilters = {
  type: { sub_code: ""; code_name: "" };
  contents: string;
  document_id: string;
  findRowValue: string;
  pgNum: number;
  pgSize: number;
  isFetch: boolean;
  isReset: boolean;
};

const defaultDetailData: {
  work_type: string;
  document_id: string;
  contents: string;
  title: string;
  user_id: string;
  write_date: Date | null;
  type: { sub_code: string; code_name: string };
  remark: string;
  files: string;
  attdatnum: string;
} = {
  work_type: "N",
  document_id: "",
  contents: "",
  title: "",
  user_id: "",
  write_date: new Date(),
  type: {
    sub_code: "",
    code_name: "",
  },
  remark: "",
  files: "",
  attdatnum: "",
};

const DATA_ITEM_KEY = "document_id";

let targetRowIndex: null | number = null;
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
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const processApi = useApi();
  const history = useHistory();

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [title, setTitle] = useRecoilState(titles);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const idGetter = getter(DATA_ITEM_KEY);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailData, setDetailData] = useState(defaultDetailData);

  const [typesData, setTypesData] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [filters, setFilters] = useState<TFilters>({
    type: { sub_code: "", code_name: "" }, // 구분
    contents: "",
    findRowValue: "",
    document_id: "",
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

  const FilterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "type") {
      if (value === null) {
        setFilters((prev) => ({
          ...prev,
          type: { code_name: "", sub_code: "" },
        }));
      }
    }
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

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const DetailComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [typeFilterTop, setTypeFilterTop] = useState<FilterDescriptor>();
  const handleFilterChangeTop = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      if (event.target.name == "type") {
        setTypeFilterTop(event.filter);
      }
    }
  };

  const [typeFilter, setTypeFilter] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      if (event.target.name == "type") {
        setTypeFilter(event.filter);
      }
    }
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

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      fetchTypes();
      setTitle("FAQ");
    }
  }, []);

  // 구분 조회
  const fetchTypes = async () => {
    let data: any;
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(
      bytes(
        "SELECT sub_code, code_name FROM comCodeMaster WHERE group_code = 'CR081' AND use_yn = 'Y'"
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

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_faq",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "list",
        "@p_contents": filters.contents,
        "@p_type": filters.type.sub_code,
        "@p_document_id": filters.document_id,
        // "@p_find_row_value": filters.findRowValue,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess === true) {
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
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_faq",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "detail",
        "@p_contents": filters.contents,
        "@p_type": filters.type.code_name,
        "@p_document_id": mainDataId,
        "@p_find_row_value": filters.findRowValue,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      const rowCount = data.tables[0].TotalRowCount;
      if (rowCount) {
        // 상세정보 데이터 세팅
        const row = data.tables[0].Rows[0];
        setDetailData((prev) => ({
          ...row,
          work_type: "U",
          write_date: toDate(row.write_date),
          type: { sub_code: row.type, code_name: row.typenm },
        }));
        // Edior에 HTML & CSS 세팅
        setHtmlOnEditor(row.contents);
      } else {
        resetDetailData();
      }

      const selectedRow = mainDataResult.data.find(
        (item) => item[DATA_ITEM_KEY] === mainDataId
      );

      // 한달 이내 작성된 데이터인 경우
      if (selectedRow && isWithinOneMonth(selectedRow.write_date)) {
        // 조회한 공지사항 쿠키에 저장
        const savedFAQRaw = Cookies.get("readFAQ");
        const savedFAQ = savedFAQRaw ? JSON.parse(savedFAQRaw) : [];
        const updatedFAQ = [...savedFAQ, mainDataId];
        const uniqueFAQ = Array.from(new Set(updatedFAQ));

        Cookies.set("readFAQ", JSON.stringify(uniqueFAQ), {
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

  // 상세정보 초기화
  const resetDetailData = () => {
    setDetailData({ ...defaultDetailData, user_id: loginResult.userName });
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

  const createFAQ = () => {
    setDetailData({
      ...defaultDetailData,
      work_type: "N",
      user_id: userId,
    });
    // Edior에 HTML & CSS 세팅
    setHtmlOnEditor("");
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

  // 저장
  const saveFAQ = useCallback(async () => {
    let data: any;
    setLoading(true);

    if (!detailData.title) {
      alert("제목은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    } else if (!detailData.type && detailData.type == null) {
      alert("구분은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    } else if (!detailData.write_date) {
      alert("작성일자은(는) 필수 입력 항목입니다.");
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
          "faq",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "faq",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "faq", detailData.attdatnum);
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
    let type = "faq";
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
      pageNumber: 0,
      pageSize: 0,
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_faq",
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_document_id": detailData.document_id,
        "@p_write_date": convertDateToStr(detailData.write_date),
        "@p_title": detailData.title,
        "@p_contents": editorContent,
        "@p_remark": detailData.remark,
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_type": detailData.type.sub_code,
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
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

  const deleteFAQ = useCallback(async () => {
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

    const para = {
      procedureName: "pw6_sav_faq",
      parameters: {
        "@p_work_type": "D",
        "@p_document_id": detailData.document_id,
        "@p_write_date": convertDateToStr(detailData.write_date),
        "@p_title": detailData.title,
        "@p_contents": detailData.contents,
        "@p_remark": detailData.remark,
        "@p_attdatnum": detailData.attdatnum,
        "@p_type": detailData.type.sub_code,
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      let data2: any;
      try {
        data2 = await processApi<any>("attachment-delete", {
          attached:
            "attachment?type=faq&attachmentNumber=" +
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
      <TitleContainer>
        {!isMobile ? "" : <Title>FAQ</Title>}
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          {isAdmin && (
            <>
              <Button
                themeColor={"primary"}
                icon="file-add"
                onClick={createFAQ}
              >
                신규
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="save"
                onClick={saveFAQ}
              >
                저장
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon="delete"
                onClick={deleteFAQ}
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
      <GridTitleContainer>
        <GridTitle>조회조건</GridTitle>
      </GridTitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>구분</th>
              <td>
                <div className="filter-item-wrap">
                  <MultiColumnComboBox
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
      </FilterBoxWrap>
      <GridContainerWrap height={"78%"}>
        <GridContainer width={"35%"}>
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `calc(100% - 35px)` }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState[idGetter(row)],
                type: row.typenm,
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
              field="type"
              title="구분"
              width={110}
              cell={CenterCell}
              footerCell={mainTotalFooterCell}
            />
            <GridColumn field="title" title="제목" />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(65% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap border>
            <FormBox>
              <tbody>
                <tr>
                  <th>제목</th>
                  <td colSpan={5}>
                    <Input
                      name="title"
                      type="text"
                      value={detailData.title}
                      onChange={detailDataInputChange}
                      className={!isAdmin ? "readonly" : "required"}
                      readOnly={!isAdmin}
                    />
                  </td>
                </tr>
                <tr>
                  <th>작성자</th>
                  <td>
                    <Input
                      name="user_id"
                      type="text"
                      value={detailData.user_id}
                      onChange={detailDataInputChange}
                      className={"readonly"}
                      readOnly={true}
                    />
                  </td>
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
                  <th>구분</th>
                  <td>
                    {isAdmin ? (
                      <MultiColumnComboBox
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
                    ) : (
                      <Input
                        name="type"
                        type="text"
                        value={detailData.type.code_name}
                        onChange={detailDataInputChange}
                        className={!isAdmin ? "readonly" : "required"}
                        readOnly={!isAdmin}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <th>비고</th>
                  <td colSpan={5}>
                    <Input
                      name="remark"
                      value={detailData.remark}
                      onChange={detailDataInputChange}
                      readOnly={!isAdmin}
                      className={!isAdmin ? "readonly" : ""}
                    />
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
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
                        onClick={() => setAttachmentsWindowVisible(true)}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
        </GridContainer>
      </GridContainerWrap>
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          type="faq"
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
