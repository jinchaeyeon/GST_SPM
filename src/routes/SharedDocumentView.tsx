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
  MultiColumnComboBox,
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
import { bytesToBase64 } from "byte-base64";
import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
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
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  handleKeyPressSearch,
  isWithinOneMonth,
  toDate,
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import SignWindow from "../components/Windows/CommonWindows/SignWindow";
import { useApi } from "../hooks/api";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  titles,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { dataTypeColumns } from "../store/columns/common-columns";
import { TEditorHandle } from "../store/types";

type TFilters = {
  fromDate: Date;
  toDate: Date;
  contents: string;
  type: { sub_code: string; code_name: string };
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

const App = () => {
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const editorRef = useRef<TEditorHandle>(null);
  const [title, setTitle] = useRecoilState(titles);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const processApi = useApi();

  // 삭제할 첨부파일 리스트를 담는 함수
  const setDeletedAttadatnums = useSetRecoilState(deletedAttadatnumsState);

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

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

  const FilterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
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

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchTypes();
    setTitle("공유문서 열람");
  }, []);

  const search = () => {
    // DB에 저장안된 첨부파일 서버에서 삭제
    if (unsavedAttadatnums.attdatnums.length > 0)
      setDeletedAttadatnums(unsavedAttadatnums);

    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      isFetch: true,
      isReset: true,
    }));
  };

  useEffect(() => {
    if (filters.isFetch) {
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
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    if (mainDataId) fetchDetail();
  }, [selectedState]);

  const [typesData, setTypesData] = useState<any[]>([]);

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

    // DB에 저장안된 첨부파일 서버에서 삭제
    if (unsavedAttadatnums.attdatnums.length > 0)
      setDeletedAttadatnums(unsavedAttadatnums);
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
      }&type=${
        filters.type?.sub_code ?? ""
      }&customerName=${""}&find_row_value=${filters.findRowValue}&page=${
        filters.pgNum
      }&pageSize=${filters.pgSize}`,
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
  }, [selectedState, detailData, unsavedAttadatnums]);

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

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const getAttachmentsData = (data: any) => {
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
      editorRef.current.updateEditable(true);
      editorRef.current.setHtml(content);
      editorRef.current.updateEditable(false);
    }
  };

  return (
    <>
      <TitleContainer>
        {!isMobile ? "" : <Title>공유문서 열람</Title>}
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
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
                  clearButton={false}
                />
              </td>
              <th>제목 및 내용</th>
              <td colSpan={2}>
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
        <GridContainer width={`30%`}>
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `calc(100% - 35px)` }}
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
            <GridColumn field="title" title="제목" />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(70% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap border>
            <FormBox>
              <tbody>
                <tr>
                  <th>구분</th>
                  <td>
                    <Input
                      name="typenm"
                      type="text"
                      value={detailData.type.code_name}
                      className={"readonly"}
                      readOnly={true}
                    />
                  </td>
                  <th>작성일자</th>
                  <td>
                    <Input
                      name="write_date"
                      type="text"
                      value={dateformat2(
                        convertDateToStr(detailData.write_date)
                      )}
                      className={"readonly"}
                      readOnly={true}
                    />
                  </td>
                </tr>
                <tr>
                  <th>제목</th>
                  <td colSpan={2}>
                    <Input
                      name="title"
                      type="text"
                      value={detailData.title}
                      className={"readonly"}
                      readOnly={true}
                    />
                  </td>
                  <td>
                    <Button
                      themeColor={"primary"}
                      style={{ width: "100%" }}
                      onClick={() => {
                        if (
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
          <RichEditor
            id="editor"
            ref={editorRef}
            hideTools={true}
            className={"notice-editor"}
          />
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
          type="sharedDocument"
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={detailData.attdatnum}
          permission={{ upload: false, download: true, delete: false }}
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
