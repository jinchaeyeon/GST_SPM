import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Editor, EditorTools } from "@progress/kendo-react-editor";
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
const {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  OrderedList,
  UnorderedList,
  Undo,
  Redo,
  FontSize,
  FontName,
  FormatBlock,
  Link,
  Unlink,
  InsertImage,
  ViewHtml,
  InsertTable,
  AddRowBefore,
  AddRowAfter,
  AddColumnBefore,
  AddColumnAfter,
  DeleteRow,
  DeleteColumn,
  DeleteTable,
  MergeCells,
  SplitCell,
} = EditorTools;

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
        <Title>공지사항</Title>
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>공지일자</th>
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
      <GridContainerWrap height={"77vh"}>
        <GridContainer width={`40%`}>
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
            <ButtonContainer>
              <Button themeColor={"primary"} icon="file-add">
                공지생성
              </Button>
              <Button themeColor={"primary"} fillMode={"outline"} icon="delete">
                공지삭제
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
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
            <GridColumn field="" title="공지일자" width={200} />
            <GridColumn field="" title="제목" />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(60% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>
          <Editor
            tools={[
              [Bold, Italic, Underline, Strikethrough],
              [Subscript, Superscript],
              [AlignLeft, AlignCenter, AlignRight, AlignJustify],
              [Indent, Outdent],
              [OrderedList, UnorderedList],
              FontSize,
              FontName,
              FormatBlock,
              [Undo, Redo],
              [Link, Unlink, InsertImage, ViewHtml],
              [InsertTable],
              [AddRowBefore, AddRowAfter, AddColumnBefore, AddColumnAfter],
              [DeleteRow, DeleteColumn, DeleteTable],
              [MergeCells, SplitCell],
            ]}
            contentStyle={{ height: "100%" }}
            style={{ height: "100%" }}
            // defaultContent={content}
          />
        </GridContainer>
      </GridContainerWrap>
    </>
  );
};
export default App;
