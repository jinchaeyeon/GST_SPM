import React, { useCallback, useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridFooterCellProps,
  GridCellProps,
  GridGroupChangeEvent,
  GridExpandChangeEvent,
} from "@progress/kendo-react-grid";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import calculateSize from "calculate-size";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  GridContainer,
  GridTitle,
  GridContainerWrap,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input, RadioGroupChangeEvent } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  getQueryFromBizComponent,
  UseBizComponent,
  UseCustomOption,
  UsePermissions,
  handleKeyPressSearch,
  UseParaPc,
  UseGetValueFromSessionItem,
  rowsWithSelectedDataResult,
  rowsOfDataResult,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/SY_A0010W_Window";
import NumberCell from "../components/Cells/NumberCell";
import {
  CLIENT_WIDTH,
  COM_CODE_DEFAULT_VALUE,
  GNV_WIDTH,
  GRID_MARGIN,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import BizComponentComboBox from "../components/ComboBoxes/BizComponentComboBox";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import { gridList } from "../store/columns/SY_A0010W_C";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { isLoading } from "../store/atoms";
import { useSetRecoilState } from "recoil";

const numberField = [
  "sort_seq",
  "code_length",
  "numref1",
  "numref2",
  "numref3",
  "numref4",
  "numref5",
];
const checkBoxField = ["system_yn", "use_yn"];
const DATA_ITEM_KEY = "group_code";
const DETAIL_DATA_ITEM_KEY = "sub_code";

const Page: React.FC = () => {
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const userId = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter = getter(DATA_ITEM_KEY);
  const detailIdGetter = getter(DETAIL_DATA_ITEM_KEY);
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);

  const [mainDataState, setMainDataState] = useState<State>({
    group: [
      {
        field: "group_category_name",
      },
    ],
    sort: [],
  });
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });

  const pathname: string = window.location.pathname.replace("/", "");

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent("L_menu_group,L_BA000", setBizComponentData);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;
      setSelectedState({ [rowData[DATA_ITEM_KEY]]: true });

      setDetailFilters((prev) => ({
        ...prev,
        group_code: rowData.group_code,
      }));

      setIsCopy(false);
      setWorkType("U");
      setDetailWindowVisible(true);
    };

    return (
      <>
        {props.rowType === "groupHeader" ? null : (
          <td className="k-command-cell">
            <Button
              className="k-grid-edit-command"
              themeColor={"primary"}
              fillMode="outline"
              onClick={onEditClick}
              icon="edit"
            ></Button>
          </td>
        )}
      </>
    );
  };

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [mainDataTotal, setMainDataTotal] = useState<number>(0);

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], detailDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);

  const [detailPgNum, setDetailPgNum] = useState(1);

  const [workType, setWorkType] = useState("");
  const [isCopy, setIsCopy] = useState(false);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;
    if (value !== null)
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
  };

  //조회조건 Radio Group Change 함수 => 사용자가 선택한 라디오버튼 값을 조회 파라미터로 세팅
  const filterRadioChange = (e: RadioGroupChangeEvent) => {
    const name = e.syntheticEvent.currentTarget.name;
    const value = e.value;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 ComboBox Change 함수 => 사용자가 선택한 콤보박스 값을 조회 파라미터로 세팅
  const filterComboBoxChange = (e: any) => {
    const { name, value } = e;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 초기값
  const [filters, setFilters] = useState({
    isSearch: true, // true면 조회조건(filters) 변경 되었을때 조회
    pgSize: PAGE_SIZE,
    pgNum: 1,
    group_category: "",
    group_code: "",
    group_name: "",
    memo: "",
    userid: userId,
    sub_code: "",
    subcode_name: "",
    field_caption: "",
    find_row_value: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    isSearch: false,
    pgSize: PAGE_SIZE,
    pgNum: 1,
    group_code: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SY_A0010W_Q",
    pageNumber: filters.pgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "LIST",
      "@p_group_code": filters.group_code,
      "@p_group_name": filters.group_name,
      "@p_group_category": filters.group_category,
      "@p_field_caption": filters.field_caption,
      "@p_memo": filters.memo,
      "@p_sub_code": filters.sub_code,
      "@p_code_name": filters.subcode_name,
      "@p_find_row_value": filters.find_row_value,
    },
  };
  const detailParameters: Iparameters = {
    procedureName: "P_SY_A0010W_Q",
    pageNumber: detailFilters.pgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_group_code": detailFilters.group_code,
      "@p_group_name": "",
      "@p_group_category": "",
      "@p_field_caption": "",
      "@p_memo": "",
      "@p_sub_code": "",
      "@p_code_name": "",
      "@p_find_row_value": "",
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    [DATA_ITEM_KEY]: "",
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_SY_A0010W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_group_code": paraDataDeleted.group_code,
      "@p_group_name": "",
      "@p_code_length": 0,
      "@p_group_category": "",
      "@p_field_caption1": "",
      "@p_field_caption2": "",
      "@p_field_caption3": "",
      "@p_field_caption4": "",
      "@p_field_caption5": "",
      "@p_field_caption6": "",
      "@p_field_caption7": "",
      "@p_field_caption8": "",
      "@p_field_caption9": "",
      "@p_field_caption10": "",
      "@p_attdatnum": "",
      "@p_memo": "",
      "@p_use_yn": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "",
    },
  };

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      // 그룹카테고리 리스트
      const groupCategoryData =
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA000")
          ?.data.Rows ?? [];
      const totalRowCnt = data.tables[0].TotalRowCount;

      if (totalRowCnt > 0) {
        // 조회된 행의 데이터 조작
        const rows = data.tables[0].Rows.map((row: any) => ({
          ...row,
          group_category_name:
            row.group_category +
            ":" +
            groupCategoryData.find(
              (item: any) => item.sub_code === row.group_category
            )?.code_name,
        }));

        // 데이터 세팅
        setMainDataTotal(totalRowCnt);
        setMainDataResult((prev) =>
          process([...rowsOfDataResult(prev), ...rows], mainDataState)
        );

        // 그룹코드로 조회한 경우, 조회된 페이지넘버로 세팅
        if (filters.pgNum !== data.pageNumber) {
          setFilters((prev) => ({ ...prev, pgNum: data.pageNumber }));
        }

        if (filters.find_row_value === "" && filters.pgNum === 1) {
          // 첫번째 행 선택하기
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });

          setDetailFilters((prev) => ({
            ...prev,
            group_code: firstRowData.group_code,
            isSearch: true,
          }));
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }

    setLoading(false);
  };

  const fetchDetailGrid = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", detailParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setDetailDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    }
    setLoading(false);
  };

  // 조회 버튼 => 리셋 후 조회
  const search = () => {
    resetAllGrid();
    setFilters((prev) => ({ ...prev, pgNum: 1, isSearch: true }));
    setDetailFilters((prev) => ({ ...prev, pgNum: 1 }));
  };

  // selectedState가 바뀔때마다 data에 바뀐 selectedState 적용
  useEffect(() => {
    setMainDataResult((prev) =>
      process(
        rowsWithSelectedDataResult(prev, selectedState, DATA_ITEM_KEY),
        mainDataState
      )
    );
  }, [selectedState]);

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  useEffect(() => {
    if (filters.isSearch && permissions !== null && bizComponentData !== null) {
      setFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록

      if (filters.find_row_value !== "") {
        // 그룹코드로 조회 시 리셋 후 조회
        resetAllGrid();
        fetchMainGrid();
      } else {
        // 일반 조회
        fetchMainGrid();
      }
    }
  }, [filters, permissions, bizComponentData]);

  useEffect(() => {
    if (permissions !== null && detailFilters.isSearch) {
      setDetailFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록

      if (detailFilters.pgNum === 1) {
        setDetailDataResult(process([], detailDataState));
        fetchDetailGrid();
      } else {
        fetchDetailGrid();
      }
    }
  }, [detailFilters, permissions]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainDataTotal(1);
    setMainDataResult(process([], mainDataState));
    setDetailDataResult(process([], detailDataState));
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

    setDetailFilters((prev) => ({
      ...prev,
      group_code: selectedRowData.group_code,
      isSearch: true,
    }));
  };

  //엑셀 내보내기
  let _export: ExcelExport | null | undefined;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save();
    }
  };

  //스크롤 핸들러
  const onMainScrollHandler = (event: GridEvent) => {
    if (
      chkScrollHandler(event, filters.pgNum, PAGE_SIZE) &&
      !filters.isSearch
    ) {
      setFilters((prev) => ({
        ...prev,
        pgNum: prev.pgNum + 1,
        isSearch: true,
        find_row_value: "",
      }));
    }
  };

  const onDetailScrollHandler = (event: GridEvent) => {
    if (
      chkScrollHandler(event, detailFilters.pgNum, PAGE_SIZE) &&
      !detailFilters.isSearch
    )
      setDetailFilters((prev) => ({
        ...prev,
        pgNum: prev.pgNum + 1,
        isSearch: true,
      }));
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataResult((prev) => process(prev.data, event.dataState));
    setMainDataState(event.dataState);
  };

  const onDetailDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDataState(event.dataState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataTotal}건
      </td>
    );
  };

  const calculateWidth = (field: any) => {
    let maxWidth = 0;
    mainDataResult.data.forEach((item) => {
      const size = calculateSize(item[field], {
        font: "Source Sans Pro",
        fontSize: "16px",
      }); // pass the font properties based on the application
      if (size.width > maxWidth) {
        maxWidth = size.width;
      }
    });

    return maxWidth;
  };

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detailDataResult.total}건
      </td>
    );
  };

  const getCaption = (field: any, orgCaption: any) => {
    const key = Object.getOwnPropertyNames(selectedState)[0];
    let caption = orgCaption;

    if (key) {
      const selectedRowData = rowsOfDataResult(mainDataResult).find(
        (item) => item[DATA_ITEM_KEY] === key
      );

      if (selectedRowData) {
        if (field.includes("extra_field")) {
          const extraFieldNum = field
            .replace("extra_field", "")
            .replace("col_", "");

          const newCaption = selectedRowData["field_caption" + extraFieldNum];
          if (newCaption !== "") {
            caption = newCaption;
          }
        }
      }
    }

    return caption;
  };
  const onAddClick = () => {
    setIsCopy(false);
    setWorkType("N");
    setDetailWindowVisible(true);
  };

  const onCopyClick = () => {
    if (mainDataResult.total < 1) return false;

    const key = Object.getOwnPropertyNames(selectedState)[0];
    const selectedRowData = rowsOfDataResult(mainDataResult).find(
      (item: any) => item[DATA_ITEM_KEY] === key
    );

    setDetailFilters((prev) => ({
      ...prev,
      group_code: selectedRowData.group_code,
      isSearch: true,
    }));

    setIsCopy(true);
    setWorkType("N");
    setDetailWindowVisible(true);
  };

  const onDeleteClick = (e: any) => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }

    const group_code = Object.getOwnPropertyNames(selectedState)[0];

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      group_code: group_code,
    }));
  };

  const fetchToDelete = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraDeleted);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      resetAllGrid();
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.group_code = "";
  };

  const setGroupCode = (groupCode: string) => {
    // 리셋
    resetAllGrid();

    // 행 선택
    setSelectedState({ [groupCode]: true });

    // 메인 조회
    setFilters((prev) => ({
      ...prev,
      isSearch: true,
      find_row_value: groupCode,
    }));

    // 디테일 조회
    setDetailFilters((prev) => ({
      ...prev,
      group_code: groupCode,
      isSearch: true,
    }));
  };

  const reloadData = (workType: string, groupCode: string | undefined) => {
    if (groupCode) {
      //그룹코드로 조회
      setGroupCode(groupCode);
    } else if (workType === "U") {
      // 일반조회
      search();
    }
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onDetailSortChange = (e: any) => {
    setDetailDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onExpandChange = (event: GridExpandChangeEvent) => {
    const isExpanded =
      event.dataItem.expanded === undefined
        ? event.dataItem.aggregates
        : event.dataItem.expanded;
    event.dataItem.expanded = !isExpanded;

    setMainDataResult({ ...mainDataResult });
  };

  return (
    <>
      <TitleContainer>
        <Title>공통코드정보</Title>

        <ButtonContainer>
          {permissions !== null && (
            <TopButtons
              search={search}
              exportExcel={exportExcel}
              permissions={permissions}
            />
          )}
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>유형분류</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="group_category"
                    value={filters.group_category}
                    bizComponentId="L_menu_group"
                    bizComponentData={bizComponentData}
                    changeData={filterComboBoxChange}
                    textField={"name"}
                  />
                )}
              </td>

              <th>그룹코드</th>
              <td>
                <Input
                  name="group_code"
                  type="text"
                  value={filters.group_code}
                  onChange={filterInputChange}
                />
              </td>
              <th>그룹코드명</th>
              <td>
                <Input
                  name="group_name"
                  type="text"
                  value={filters.group_name}
                  onChange={filterInputChange}
                />
              </td>
              <th>필드 캡션</th>
              <td>
                <Input
                  name="field_caption"
                  type="text"
                  value={filters.field_caption}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>세부코드</th>
              <td>
                <Input
                  name="sub_code"
                  type="text"
                  value={filters.sub_code}
                  onChange={filterInputChange}
                />
              </td>
              <th>세부코드명</th>
              <td>
                <Input
                  name="subcode_name"
                  type="text"
                  value={filters.subcode_name}
                  onChange={filterInputChange}
                />
              </td>
              <th>메모</th>
              <td colSpan={3}>
                <Input
                  name="memo"
                  type="text"
                  value={filters.memo}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>

      <GridContainerWrap>
        <GridContainer width={"500px"}>
          <ExcelExport
            data={rowsOfDataResult(mainDataResult)}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridTitleContainer>
              <GridTitle>요약정보</GridTitle>
              {permissions !== null && (
                <ButtonContainer>
                  <Button
                    onClick={onAddClick}
                    themeColor={"primary"}
                    icon="file-add"
                    disabled={permissions.save ? false : true}
                  >
                    생성
                  </Button>
                  <Button
                    onClick={onCopyClick}
                    fillMode="outline"
                    themeColor={"primary"}
                    icon="copy"
                    disabled={permissions.save ? false : true}
                  >
                    복사
                  </Button>
                  <Button
                    onClick={onDeleteClick}
                    icon="delete"
                    fillMode="outline"
                    themeColor={"primary"}
                    disabled={permissions.delete ? false : true}
                  >
                    삭제
                  </Button>
                </ButtonContainer>
              )}
            </GridTitleContainer>
            <Grid
              style={{ height: "78vh" }}
              data={mainDataResult}
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
              total={mainDataTotal}
              onScroll={onMainScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onMainSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              //그룹기능
              groupable={true}
              onExpandChange={onExpandChange}
              expandField="expanded"
            >
              <GridColumn cell={CommandCell} width="55px" />
              <GridColumn field="group_category_name" title={"유형분류"} />

              {customOptionData !== null &&
                customOptionData.menuCustomColumnOptions["grdHeaderList"].map(
                  (item: any, idx: number) =>
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        id={item.id}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        cell={
                          numberField.includes(item.fieldName)
                            ? NumberCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0 ? mainTotalFooterCell : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </ExcelExport>
        </GridContainer>

        <GridContainer
          width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 15 - 500 + "px"}
        >
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>
          <Grid
            style={{ height: "78vh" }}
            data={process(
              detailDataResult.data.map((row) => ({
                ...row,
              })),
              detailDataState
            )}
            {...detailDataState}
            onDataStateChange={onDetailDataStateChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={detailDataResult.total}
            onScroll={onDetailScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onDetailSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
          >
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdDetailList"].map(
                (item: any, idx: number) => {
                  const caption = getCaption(item.id, item.caption);
                  return (
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        id={item.id}
                        field={item.fieldName}
                        title={caption}
                        width={item.width}
                        cell={
                          numberField.includes(item.fieldName)
                            ? NumberCell
                            : checkBoxField.includes(item.fieldName)
                            ? CheckBoxReadOnlyCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0
                            ? detailTotalFooterCell
                            : undefined
                        }
                      />
                    )
                  );
                }
              )}
          </Grid>
        </GridContainer>
      </GridContainerWrap>
      {detailWindowVisible && (
        <DetailWindow
          setVisible={setDetailWindowVisible}
          workType={workType} //신규 : N, 수정 : U
          group_code={detailFilters.group_code}
          isCopy={isCopy}
          reloadData={reloadData}
        />
      )}

      {/* 컨트롤 네임 불러오기 용 */}
      {gridList.map((grid: any) =>
        grid.columns.map((column: any) => (
          <div
            key={column.id}
            id={column.id}
            data-grid-name={grid.gridName}
            data-field={column.field}
            data-caption={column.caption}
            data-width={column.width}
            hidden
          />
        ))
      )}
    </>
  );
};

export default Page;
