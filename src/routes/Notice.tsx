import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input } from "@progress/kendo-react-inputs";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  handleKeyPressSearch,
  isWithinOneMonth,
  toDate,
  UseParaPc,
} from "../components/CommonFunction";
import {
  DEFAULT_ATTDATNUMS,
  GAP,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import RichEditor from "../components/RichEditor";
import { TEditorHandle } from "../store/types";
import { useApi } from "../hooks/api";
import CenterCell from "../components/Cells/CenterCell";
import { bytesToBase64 } from "byte-base64";
import { IAttachmentData } from "../hooks/interfaces";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Cookies from "js-cookie";

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
    row.props.children,
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

const App = () => {
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const editorRef = useRef<TEditorHandle>(null);

  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const processApi = useApi();

  // 삭제할 첨부파일 리스트를 담는 함수
  const setDeletedAttadatnums = useSetRecoilState(deletedAttadatnumsState);

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState,
  );

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

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
    process([], mainDataState),
  );
  const [detailData, setDetailData] = useState(defaultDetailData);

  const [allCustData, setAllCustData] = useState<DataResult>(
    process([], allCustDataState),
  );
  const [refCustData, setRefCustData] = useState<DataResult>(
    process([], refCustDataState),
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
    fetchAllCust();
  }, [refCustData]);

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
  const onAllCustSortChange = (e: any) => {
    setAllCustDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onRefCustSortChange = (e: any) => {
    setRefCustDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  //그리드 데이터 조회
  const fetchGrid = useCallback(async (filters: TFilters) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate,
      )}&toDate=${convertDateToStr(filters.toDate)}&contents=${
        filters.contents
      }&page=${filters.pgNum}&pageSize=${filters.pgSize}`,
    };

    try {
      data = await processApi<any>("notice-list", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (filters.findRowValue !== "") {
          // 데이터 저장 후 조회
          setSelectedState({ [filters.findRowValue]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt,
          });
        } else if (filters.isReset) {
          // 일반 데이터 조회
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
          setMainDataResult({
            data: rows,
            total: totalRowCnt,
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
        (item) => item[DATA_ITEM_KEY] === mainDataId,
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
  }, [selectedState, detailData, unsavedAttadatnums]);

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

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      setAllCustData((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
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
      (row) => row?.customer_code !== refCustDragDataItem?.customer_code,
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
  };

  // ex. 파라미터 = {custcd : "10192", custnm : "a"}, {custcd : "43049", custnm : "b"} ]
  // => "10192|43049"
  const getCustomerCodes = (customers: TCustomer[]): string => {
    return customers.map((customer) => customer["customer_code"]).join("|");
  };

  const saveNotice = useCallback(async () => {
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
        "@p_attdatnum": detailData.attdatnum,
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
      // unsaved 첨부파일 초기화
      setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);

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
      (item) => item[DATA_ITEM_KEY] === mainDataId,
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
      // 첨부파일 서버에서 삭제
      if (unsavedAttadatnums.attdatnums.length > 0) {
        // DB 저장안된 첨부파일
        setDeletedAttadatnums(unsavedAttadatnums);
      } else if (detailData.attdatnum) {
        // DB 저장된 첨부파일
        setDeletedAttadatnums({
          type: "notice",
          attdatnums: [detailData.attdatnum],
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
  }, [detailData]);

  const getAttachmentsData = (data: IAttachmentData) => {
    if (!detailData.attdatnum) {
      setUnsavedAttadatnums({
        type: "notice",
        attdatnums: [data.attdatnum],
      });
    }
    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.attdatnum,
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
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
      (row) => row?.customer_code !== dataItem?.customer_code,
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
  return (
    <>
      <TitleContainer>
        <Title>공지사항</Title>
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          {isAdmin && (
            <>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
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
      <GridTitleContainer>
        <GridTitle>조회조건</GridTitle>
      </GridTitleContainer>
      <FilterBoxWrap>
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
      </FilterBoxWrap>
      <GridContainerWrap height={"80%"}>
        <GridContainer width={isAdmin ? "25%" : `30%`}>
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `calc(100% - 35px)` }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState[idGetter(row)],
                notice_date: dateformat2(row.notice_date),
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
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap border>
            <FormBox>
              <colgroup>
                <col width={"10%"} />
                <col width={"20%"} />
                <col width={"10%"} />
                <col width={"60%"} />
              </colgroup>
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
                          convertDateToStr(detailData.notice_date),
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
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <RichEditor
            id="editor"
            ref={editorRef}
            hideTools={!isAdmin}
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
        {isAdmin && (
          <GridContainer width="30%">
            <GridContainer height="50%">
              <GridTitleContainer>
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
                style={{ height: `calc(100% - 40px)`, margin: "5px 0" }}
                data={process(
                  // 적어도 한개의 행은 나오도록 처리 (그리드 행이 있어야 드롭 가능)
                  refCustData.data.length === 0
                    ? [{}]
                    : refCustData.data.map((row) => ({
                        ...row,
                      })),
                  refCustDataState,
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
            <GridContainer height="50%">
              <GridTitleContainer>
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
                style={{ height: `calc(100% - 35px)` }}
                data={process(
                  allCustData.data.map((row) => ({
                    ...row,
                    // [SELECTED_FIELD]: selectedState[idGetter(row)],
                  })),
                  allCustDataState,
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
        />
      )}
    </>
  );
};
export default App;
