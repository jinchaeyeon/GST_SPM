import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  DatePicker,
  DatePickerChangeEvent,
} from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import React, { useState, CSSProperties, useRef, useEffect } from "react";
import { useSetRecoilState } from "recoil";
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
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import { useApi } from "../hooks/api";
import { isLoading } from "../store/atoms";
import { TEditorHandle } from "../store/types";
import { IAttachmentData } from "../hooks/interfaces";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import CenterCell from "../components/Cells/CenterCell";

const styles: { [key: string]: CSSProperties } = {
  table: {
    borderCollapse: "collapse",
    borderSpacing: 0,
  },
  th: {
    fontFamily: "Arial, sans-serif",
    borderStyle: "solid",
    borderWidth: "1px",
    overflow: "hidden",
    wordBreak: "normal",
    verticalAlign: "middle",
    textAlign: "center",
    backgroundColor: "#e2e2e2",
    minHeight: 25,
    height: 25,
  },
  td: {
    fontFamily: "Arial, sans-serif",
    borderStyle: "solid",
    borderWidth: "1px",
    overflow: "hidden",
    wordBreak: "normal",
    verticalAlign: "middle",
    textAlign: "center",
  },
};

const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const [meetingnum, setMeetingnum] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: DatePickerChangeEvent | InputChangeEvent) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const downloadWordDoc = (e: React.MouseEvent<HTMLButtonElement>) => {
    const name = e.currentTarget.name;

    let reference = null;

    // const htmlElement = document.getElementById("htmlContent");
    var iframe = document.querySelector("iframe");

    if (iframe && iframe.contentWindow) {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;

      // iframe 내부의 요소에 접근
      reference = iframeDocument.querySelector(".k-content.ProseMirror");
    }

    const isRef = name === "reference" && reference;
    const htmlElement = isRef
      ? reference
      : document.getElementById("htmlContent");

    if (htmlElement) {
      const html = htmlElement.innerHTML;
      const file = new Blob(
        [
          '<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Converted Doc</title></head><body>' +
            html +
            "</body></html>",
        ],
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download =
        detailDataLines[0].title + (isRef ? "_참고자료" : "") + ".doc";
      link.click();
    }
  };

  const search = () => {
    setMainDataResult(process([], mainDataState));
    setFilters((prev) => ({ ...prev, page: 1, isFetch: true }));
  };

  const DATA_ITEM_KEY = "meetingnum";
  const idGetter = getter(DATA_ITEM_KEY);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [detailDataLines, setDetailDataLines] = useState<any[]>([]);
  const [detailData, setDetailData] = useState({
    meetingnum: "",
    attdatnum: "",
    files: "",
  });

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  //메인 그리드 선택 이벤트 => 디테일 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setDetailData({
      meetingnum: selectedRowData[DATA_ITEM_KEY],
      attdatnum: selectedRowData.attdatnum,
      files: selectedRowData.files,
    });
    setMeetingnum(selectedRowData[DATA_ITEM_KEY]);
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const editorRef = useRef<TEditorHandle>(null);

  const saveMeeting = () => {
    if (editorRef.current) {
      const editorContent = editorRef.current.getContent();

      // 여기서 원하는 작업 수행 (예: 서버에 저장)
      fetchToSave(editorContent);
    }
  };

  const currentDate = new Date();
  const fromDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 3,
    currentDate.getDate()
  );

  const [filters, setFilters] = useState({
    isFetch: true,
    pageSize: PAGE_SIZE,
    page: 1,
    fromDate: fromDate,
    toDate: new Date(),
    custnm: "",
    contents: "",
    findRowValue: "",
  });

  const fetchGrid = async () => {
    let data: any;
    setLoading(true);

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&custnm=${
        filters.custnm
      }&contents=${filters.contents}&findRowValue=${
        filters.findRowValue
      }&page=${filters.page}&pageSize=${filters.pageSize}`,
    };

    try {
      data = await processApi<any>("meeting-list", para);
    } catch (error) {
      data = null;
    }

    setLoading(false);

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });

      // 첫번째 행 선택
      if (filters.page === 1) {
        const firstRowData = rows[0];
        setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
        setMeetingnum(firstRowData[DATA_ITEM_KEY]);
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
      doc: false,
    };

    try {
      data = await processApi<any>("meeting-detail", para);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.result.isSuccess === true) {
      const reference = data.reference;
      const rows = data.result.tables[0].Rows;

      // Edior에 HTML & CSS 세팅
      if (editorRef.current) {
        editorRef.current.setHtml(reference);
      }
      setDetailDataLines(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);

      if (editorRef.current) {
        editorRef.current.setHtml("");
      }
      setDetailDataLines([]);
    }
    setLoading(false);
  };

  const fetchToSave = async (editorContent: string) => {
    let data: any;
    setLoading(true);

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const parameters = {
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_meeting",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "N",
        "@p_orgdiv": "",
        "@p_meetingnum": "",
        "@p_custcd": "10192",
        "@p_recdt": "20230406",
        "@p_meetingid": "",
        "@p_meetingnm": "",
        "@p_place": "",
        "@p_title": "WEB 테스트",
        "@p_remark": "비고",
        "@p_attdatnum": "",
        "@p_attdatnum_private": "",
        "@p_unshared": "",
        "@p_devmngnum": "",
        "@p_meetingseq": "0|0",
        "@p_sort_seq": "1|2",
        "@p_contents": "내용A|내용B",
        "@p_value_code3": "|",
        "@p_cust_browserable": "Y|Y",
        "@p_reqdt": "|",
        "@p_finexpdt": "|",
        "@p_is_request": "N|N",
        "@p_client_name": "|",
        "@p_client_finexpdt": "|",
        "@p_id": "1096",
        "@p_pc": "125.141.105.80",
      },
    };

    try {
      data = await processApi<any>("meeting-save", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      search();
    } else {
      console.log("[에러발생]");
      console.log(data);
      if (data.hasOwnProperty("resultMessage")) {
        alert(data["resultMessage"]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (filters.isFetch) {
      console.log(filters.isFetch);
      fetchGrid();
      setFilters((prev) => ({ ...prev, isFetch: false }));
    }
  }, [filters]);

  useEffect(() => {
    if (meetingnum !== "") {
      fetchDetail();
    }
  }, [meetingnum]);

  const getAttachmentsData = (data: IAttachmentData) => {
    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.attdatnum,
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
    }));
  };

  return (
    <>
      <TitleContainer>
        <Title>회의록 열람</Title>
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          <Button
            icon={"file-word"}
            name="meeting"
            onClick={downloadWordDoc}
            themeColor={"primary"}
            fillMode={"outline"}
          >
            다운로드
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
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
      </FilterBoxWrap>
      <GridContainerWrap height={"83vh"}>
        <GridContainer width={`25%`}>
          <GridTitleContainer>
            <GridTitle>회의록 리스트</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `calc(100% - 35px)` }}
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
              width={100}
              cell={CenterCell}
            />
            <GridColumn field="custnm" title="업체" width={120} />
            <GridColumn field="title" title="제목" width={300} />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(50% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>회의록</GridTitle>
          </GridTitleContainer>
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
                  <th style={{ width: 0 }}>첨부파일</th>
                  <td style={{ width: "auto" }}>
                    <div className="filter-item-wrap">
                      <Input name="attachment_q" value={detailData.files} />
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
          <div
            id="htmlContent"
            style={{
              border: "solid 1px rgba(0, 0, 0, 0.08)",
              padding: "20px",
              overflow: "scroll",
              height: "100%",
            }}
          >
            {detailDataLines.length > 0 && (
              <>
                <h1
                  style={{
                    textAlign: "center",
                    fontSize: "28px",
                    fontWeight: "bold",
                    marginBottom: "20px",
                  }}
                >
                  회의록
                </h1>
                <table width={"100%"} style={{ ...styles.table }}>
                  <tr>
                    <th></th>
                    <th style={styles.th}>담당</th>
                    <th style={styles.th}>검토</th>
                    <th style={styles.th}>승인</th>
                  </tr>
                  <tr>
                    <td></td>
                    <td height={70} width={85} style={styles.td}></td>
                    <td height={70} width={85} style={styles.td}></td>
                    <td height={70} width={85} style={styles.td}></td>
                  </tr>
                  <tr>
                    <td></td>
                    <td height={25} style={styles.td}></td>
                    <td style={styles.td}></td>
                    <td style={styles.td}></td>
                  </tr>
                </table>

                <br />
                <table width={"100%"} style={{ ...styles.table }}>
                  <tr>
                    <th style={styles.th}>회의 일자</th>
                    <td style={styles.td} width="30%">
                      {detailDataLines[0].date}
                    </td>
                    <th style={styles.th}>작성자</th>
                    <td style={styles.td} width="30%">
                      {detailDataLines[0].user_name}
                    </td>
                  </tr>
                  <tr>
                    <th style={styles.th}>회의 장소</th>
                    <td
                      style={{
                        ...styles.td,
                        textAlign: "left",
                        paddingLeft: "10px",
                      }}
                      colSpan={3}
                    >
                      {detailDataLines[0].place}
                    </td>
                  </tr>
                  <tr>
                    <th style={styles.th}>제목</th>
                    <td
                      style={{
                        ...styles.td,
                        textAlign: "left",
                        paddingLeft: "10px",
                      }}
                      colSpan={3}
                    >
                      {detailDataLines[0].title}
                    </td>
                  </tr>
                  <tr>
                    <th style={styles.th}>내용</th>
                    <td style={styles.td} colSpan={3}></td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...styles.td,
                        height: 550,
                        minHeight: 550,
                        padding: "10px",
                        textAlign: "left",
                        verticalAlign: "top",
                        lineHeight: "25px",
                      }}
                      colSpan={4}
                    >
                      {detailDataLines.map((row) => (
                        <p key={row.meetingseq}>{row.contents}</p>
                      ))}
                    </td>
                  </tr>
                </table>
              </>
            )}
          </div>
        </GridContainer>
        <GridContainer width={`calc(40% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>참고자료</GridTitle>
          </GridTitleContainer>
          <RichEditor id="editor" ref={editorRef} readonly />
        </GridContainer>
      </GridContainerWrap>

      {attachmentsWindowVisible && (
        <AttachmentsWindow
          type="meeting"
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={detailData.attdatnum}
          permission={{ upload: false, download: true, delete: false }}
        />
      )}
    </>
  );
};
export default App;
