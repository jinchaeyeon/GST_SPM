import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Editor } from "@progress/kendo-react-editor";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input } from "@progress/kendo-react-inputs";
import React, { useState, CSSProperties } from "react";
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
  handleKeyPressSearch,
} from "../components/CommonFunction";
import { GAP, PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";

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
  const download = () => {
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

  const search = () => {};

  const DATA_ITEM_KEY = "";
  const idGetter = getter(DATA_ITEM_KEY);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    // setDetailFilters((prev) => ({
    //   ...prev,
    //   purnum: selectedRowData.purnum,
    //   purseq: selectedRowData.purseq,
    // }));
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
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
            onClick={download}
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
                    name="frdt"
                    // value={filters.frdt}
                    format="yyyy-MM-dd"
                    // onChange={filterInputChange}
                    placeholder=""
                  />
                  ~
                  <DatePicker
                    name="todt"
                    // value={filters.todt}
                    format="yyyy-MM-dd"
                    // onChange={filterInputChange}
                    placeholder=""
                  />
                </div>
              </td>
              <th>제목 및 내용</th>
              <td>
                <Input
                  name="user_name"
                  type="text"
                  // value={filters.user_group_name}
                  // onChange={filterInputChange}
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
          </GridTitleContainer>{" "}
          <Grid
            style={{ height: `100%` }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
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
            <GridColumn field="" title="업체" />
            <GridColumn field="" title="회의일" />
            <GridColumn field="" title="제목" />
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
          </GridTitleContainer>
          <Editor
            contentStyle={{ height: 160 }}
            value=""
            style={{ height: "100%" }}
            // defaultContent={"<p>editor sample html</p>"}
            // ref={editor}
            // onChange={onChangeHandle}
          />
        </GridContainer>
      </GridContainerWrap>
    </>
  );
};
export default App;
