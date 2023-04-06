import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  DatePicker,
  DatePickerChangeEvent,
} from "@progress/kendo-react-dateinputs";
import { Editor, EditorUtils } from "@progress/kendo-react-editor";
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
import { GAP, SELECTED_FIELD } from "../components/CommonString";
import RichEditor from "../components/RichEditor";
import { useApi } from "../hooks/api";
import { isLoading } from "../store/atoms";
const PAGE_SIZE = 100;
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

type TChildComponentHandle = {
  getContent: () => string;
  setHtml: (html: string) => string;
};
const App = () => {
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const [meetingnum, setMeetingnum] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: DatePickerChangeEvent | InputChangeEvent) => {
    const { value, name = "" } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const downloadWordDoc = () => {
    const htmlElement = document.getElementById("htmlContent");
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
      link.download = "converted.doc";
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
  const [detailDataResult, setDetailDataResult] = useState<{
    document: string;
    result: [];
  }>({ document: "", result: [] });

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

    setMeetingnum(selectedRowData[DATA_ITEM_KEY]);
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const editorRef = useRef<TChildComponentHandle>(null);

  const saveMeeting = () => {
    if (editorRef.current) {
      const editorContent = editorRef.current.getContent();

      // 여기서 원하는 작업 수행 (예: 서버에 저장)
      fetchToSave(editorContent);
    }
  };

  const [filters, setFilters] = useState({
    isFetch: true,
    pageSize: PAGE_SIZE,
    page: 1,
    fromDate: new Date(),
    toDate: new Date(),
    custnm: "",
    contents: "",
    findRowValue: "",
  });

  useEffect(() => {
    if (filters.isFetch) {
      fetchGrid();
      setFilters((prev) => ({ ...prev, isFetch: false }));
    }
  }, [filters]);

  useEffect(() => {
    if (meetingnum !== "") {
      fetchDetail();
    }
  }, [meetingnum]);

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
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDetail = async () => {
    let data: any;
    setLoading(true);

    const para = {
      para: meetingnum,
    };

    try {
      data = await processApi<any>("meeting-detail", para);
    } catch (error) {
      data = null;
    }

    if (data.result.isSuccess === true) {
      const document = data.document;
      const rows = data.result.tables[0].Rows;

      // Edior에 HTML & CSS 세팅
      if (editorRef.current) {
        editorRef.current.setHtml(document);
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
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
        <GridContainer width={`30%`}>
          <GridTitleContainer>
            <GridTitle>회의록 리스트</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: `100%` }}
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
            <GridColumn field="custnm" title="업체" />
            <GridColumn field="recdt" title="회의일" />
            <GridColumn field="title" title="제목" />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(50% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>회의록</GridTitle>
          </GridTitleContainer>
          <div
            id="htmlContent"
            style={{
              border: "solid 1px rgba(0, 0, 0, 0.08)",
              padding: "20px",
              overflow: "scroll",
              height: "100%",
            }}
          >
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
                <td style={styles.td} width="30%"></td>
                <th style={styles.th}>작성자</th>
                <td style={styles.td} width="30%"></td>
              </tr>
              <tr>
                <th style={styles.th}>회의 장소</th>
                <td style={styles.td} colSpan={3}></td>
              </tr>
              <tr>
                <th style={styles.th}>제목</th>
                <td style={styles.td} colSpan={3}></td>
              </tr>
              <tr>
                <th style={styles.th}>내용</th>
                <td style={styles.td} colSpan={3}></td>
              </tr>
              <tr>
                <td
                  style={{ ...styles.td, height: 550, minHeight: 550 }}
                  colSpan={4}
                ></td>
              </tr>
            </table>
          </div>
        </GridContainer>
        <GridContainer width={`calc(40% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>참고자료</GridTitle>
            <Button onClick={saveMeeting}>저장</Button>
          </GridTitleContainer>
          <RichEditor ref={editorRef} editable />
        </GridContainer>
      </GridContainerWrap>
    </>
  );
};
export default App;
