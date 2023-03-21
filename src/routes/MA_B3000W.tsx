import React, { useCallback, useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridFooterCellProps,
} from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  GridContainer,
  GridContainerWrap,
  TitleContainer,
  ButtonContainer,
  ButtonInInput,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  Chart,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartCategoryAxisTitle,
  ChartLegend,
  ChartSeries,
  ChartSeriesItem,
  ChartSeriesLabels,
  ChartTitle,
  ChartTooltip,
  ChartValueAxis,
  ChartValueAxisItem,
} from "@progress/kendo-react-charts";
import "hammerjs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import YearCalendar from "../components/Calendars/YearCalendar";
import {
  chkScrollHandler,
  convertDateToStr,
  numberWithCommas,
  setDefaultDate,
  UseBizComponent,
  UseCustomOption,
  UseDesignInfo,
  UsePermissions,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import { ICustData } from "../hooks/interfaces";
import {
  CLIENT_WIDTH,
  GNV_WIDTH,
  GRID_MARGIN,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import NumberCell from "../components/Cells/NumberCell";
import DateCell from "../components/Cells/DateCell";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import CommonRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import { gridList } from "../store/columns/MA_B3000W_C";
import TopButtons from "../components/TopButtons";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

const numberField: string[] = [
  "qty01",
  "qty02",
  "qty03",
  "qty04",
  "qty05",
  "qty06",
  "qty07",
  "qty08",
  "qty09",
  "qty10",
  "qty11",
  "qty12",
];
const dateField = ["recdt", "time"];
const DATA_ITEM_KEY = "custcd";

const MA_B3000W: React.FC = () => {
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const setLoading = useSetRecoilState(isLoading);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  const [wordInfoData, setWordInfoData] = React.useState<any>(null);
  UseDesignInfo(pathname, setWordInfoData);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_dptcd_001,L_sysUserMaster_001,L_EA002,L_HU089,L_appyn,L_USERS,L_HU005,L_EA004",
    //부서,담당자,결재문서,근태구분,결재유무,사용자,직위,결재라인
    setBizComponentData
  );

  const [isInitSearch, setIsInitSearch] = useState(false);
  const [yearTitle, setYearTitle] = useState([]);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;

      setFilters((prev) => ({
        ...prev,
        yyyy: setDefaultDate(customOptionData, "yyyy"),
        cboLocation: defaultOption.find(
          (item: any) => item.id === "cboLocation"
        ).valueCode,
        rdoAmtdiv: defaultOption.find((item: any) => item.id === "rdoAmtdiv")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [gridDataState, setGridDataState] = useState<State>({
    sort: [],
  });

  const [gridDataResult, setGridDataResult] = useState<DataResult>(
    process([], gridDataState)
  );
  const [allChartDataResult, setAllChartDataResult] = useState({
    companies: [""],
    series: [0],
  });
  const [chartDataResult, setChartDataResult] = useState([]);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [gridPgNum, setGridPgNum] = useState(1);

  const [tabSelected, setTabSelected] = React.useState(0);
  const handleSelectTab = (e: any) => {
    onRefreshClick();
    setTabSelected(e.selected);
    resetGrid();
  };

  //그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (gridDataResult.total > 0) {
      const firstRowData = gridDataResult.data[0];
      setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
    }
  }, [gridDataResult]);

  useEffect(() => {
    search();
  }, [tabSelected]);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 Radio Group Change 함수 => 사용자가 선택한 라디오버튼 값을 조회 파라미터로 세팅
  const filterRadioChange = (e: any) => {
    const { name, value } = e;

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

  const initFrdt = new Date();
  initFrdt.setMonth(initFrdt.getMonth() - 2);

  //조회조건 초기값
  const [filters, setFilters] = useState({
    orgdiv: "01",
    cboLocation: "01",
    yyyy: new Date(),
    custcd: "",
    custnm: "",
    mm: "",
    rdoAmtdiv: "",
  });

  //그리드 데이터 조회
  const fetchGrid = async (workType: string, custcd?: string) => {
    if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "P_MA_B3000W_Q",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": workType,
        "@p_orgdiv": filters.orgdiv,
        "@p_location": filters.cboLocation,
        "@p_yyyy": convertDateToStr(filters.yyyy).substr(0, 4),
        "@p_custcd": custcd ? custcd : filters.custcd,
        "@p_custnm": filters.custnm,
        "@p_mm": filters.mm,
        "@p_amtdiv": filters.rdoAmtdiv,
        "@p_service_id": "20190218001",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;

      if (
        workType === "GRID" ||
        workType === "MONTH" ||
        workType === "QUARTER"
      ) {
        setGridDataResult(process(rows, gridDataState));
      }
      // 공통 차트
      else if (workType === "MCHART" || workType === "QCHART") {
        setChartDataResult(rows);
      }
      // 전체 탭 그래프 (업체별 데이터로 가공)
      else if (workType === "TOTAL") {
        let newRows = { companies: [""], series: [0] };

        rows.forEach((row: any) => {
          if (!newRows.companies.includes(row.argument)) {
            newRows.companies.push(row.argument);
            newRows.series.push(row.sort_amt);
          }
        });

        setAllChartDataResult({
          companies: newRows.companies,
          series: newRows.series,
        });
      }
    }

    setLoading(false);
  };

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (
      customOptionData !== null &&
      isInitSearch === false &&
      permissions !== null
    ) {
      fetchGrid("GRID");
      fetchGrid("TOTAL");

      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  //그리드 리셋
  const resetGrid = () => {
    setGridPgNum(1);
    setGridDataResult(process([], gridDataState));
  };

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onGridSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    setSelectedState(newSelectedState);
  };
  const onMonthGridSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    setSelectedState(newSelectedState);
    if (tabSelected === 1) {
      fetchGrid("MCHART", selectedRowData.custcd);
    } else if (tabSelected === 2) {
      fetchGrid("QCHART", selectedRowData.custcd);
    }
  };

  //엑셀 내보내기
  let _export: ExcelExport | null | undefined;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save();
    }
  };

  //스크롤 핸들러
  const onGridScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, gridPgNum, PAGE_SIZE))
      setGridPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onGridDataStateChange = (event: GridDataStateChangeEvent) => {
    setGridDataState(event.dataState);
  };
  //그리드 푸터

  const gridTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {gridDataResult.total}건
      </td>
    );
  };
  const gridSumQtyFooterCell = (props: GridFooterCellProps) => {
    let sum = 0;
    gridDataResult.data.forEach((item) =>
      props.field !== undefined ? (sum += item[props.field]) : ""
    );

    return (
      <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
        {sum}
      </td>
    );
  };

  //업체마스터 팝업
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };
  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const onGridSortChange = (e: any) => {
    setGridDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const labelContent = (props: any) => {
    let formatedNumber = Number(props.percentage).toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 3, //소수점
    });
    return `${props.dataItem.mm} : ${formatedNumber}`;
  };

  const [selectedChartData, setSelectedChartData] = useState({
    gubun: "전체",
    argument: "-",
  });

  const onRefreshClick = () => {
    setSelectedChartData({
      gubun: "전체",
      argument: "-",
    });
  };

  const quarterDonutRenderTooltip = (context: any) => {
    const { category, series, value } = context.point || context;

    return (
      <div>
        {category} ({series.name}): {numberWithCommas(value)}
      </div>
    );
  };

  const search = () => {
    if (tabSelected === 0) {
      fetchGrid("TOTAL");
      fetchGrid("GRID");
    } else if (tabSelected === 1) {
      fetchGrid("MONTH");
      fetchGrid("MCHART");
    } else if (tabSelected === 2) {
      fetchGrid("QUARTER");
      fetchGrid("QCHART");
    } else if (tabSelected === 3) {
      fetchGrid("5year");
      fetchGrid("CHART");
    }
  };

  return (
    <>
      <TitleContainer>
        <Title>매입집계(업체)</Title>

        <ButtonContainer>
          {permissions && (
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
              <th data-control-name="lblYyyy">기준년도</th>
              <td>
                <DatePicker
                  name="yyyy"
                  value={filters.yyyy}
                  format="yyyy"
                  onChange={filterInputChange}
                  calendar={YearCalendar}
                  className="required"
                  placeholder=""
                />
              </td>
              <th data-control-name="lblCustcd">업체코드</th>
              <td>
                <Input
                  name="custcd"
                  type="text"
                  value={filters.custcd}
                  onChange={filterInputChange}
                />
                <ButtonInInput>
                  <Button
                    onClick={onCustWndClick}
                    icon="more-horizontal"
                    fillMode="flat"
                  />
                </ButtonInInput>
              </td>

              <th data-control-name="lblCustnm">업체명</th>
              <td>
                <Input
                  name="custnm"
                  type="text"
                  value={filters.custnm}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th data-control-name="lblLocation">사업장</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="cboLocation"
                    value={filters.cboLocation}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>

              <th data-control-name="lblAmtdiv">단위</th>
              <td>
                {customOptionData !== null && (
                  <CommonRadioGroup
                    name="rdoAmtdiv"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
              <th></th>
              <td></td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>

      <TabStrip selected={tabSelected} onSelect={handleSelectTab}>
        <TabStripTab title="전체">
          <GridContainerWrap flexDirection="column">
            <GridContainer>
              <Chart>
                <ChartValueAxis>
                  <ChartValueAxisItem
                    labels={{
                      visible: true,
                      content: (e) => numberWithCommas(e.value) + "",
                    }}
                  />
                </ChartValueAxis>
                {/* <ChartTitle text="Units sold" /> */}
                <ChartCategoryAxis>
                  <ChartCategoryAxisItem
                    categories={allChartDataResult.companies}
                  >
                    <ChartCategoryAxisTitle text="업체" />
                  </ChartCategoryAxisItem>
                </ChartCategoryAxis>
                <ChartSeries>
                  <ChartSeriesItem
                    labels={{
                      visible: true,
                      content: (e) => numberWithCommas(e.value) + "",
                    }}
                    type="bar"
                    // gap={2}
                    // spacing={0.25}
                    data={allChartDataResult.series}
                  />
                </ChartSeries>
              </Chart>
            </GridContainer>

            <GridContainer
              width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 60 + "px"}
            >
              <ExcelExport
                data={gridDataResult.data}
                ref={(exporter) => {
                  _export = exporter;
                }}
              >
                <Grid
                  style={{ height: "32vh" }}
                  data={process(
                    gridDataResult.data.map((row) => ({
                      ...row,
                      // person: personListData.find(
                      //   (item: any) => item.code === row.person
                      // )?.name,
                      [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
                    })),
                    gridDataState
                  )}
                  {...gridDataState}
                  onDataStateChange={onGridDataStateChange}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onGridSelectionChange}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={gridDataResult.total}
                  onScroll={onGridScrollHandler}
                  //정렬기능
                  sortable={true}
                  onSortChange={onGridSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions["grdAllList"].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 && (
                          <GridColumn
                            key={idx}
                            field={item.fieldName}
                            title={item.caption}
                            width={item.width}
                            cell={
                              numberField.includes(item.fieldName)
                                ? NumberCell
                                : dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? gridTotalFooterCell
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </ExcelExport>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="월별">
          <GridContainerWrap flexDirection="column">
            <GridContainer
              width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 60 + "px"}
            >
              <ExcelExport
                data={gridDataResult.data}
                ref={(exporter) => {
                  _export = exporter;
                }}
              >
                <Grid
                  style={{ height: "32vh" }}
                  data={process(
                    gridDataResult.data.map((row) => ({
                      ...row,
                      // person: personListData.find(
                      //   (item: any) => item.code === row.person
                      // )?.name,
                      [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
                    })),
                    gridDataState
                  )}
                  {...gridDataState}
                  onDataStateChange={onGridDataStateChange}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onMonthGridSelectionChange}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={gridDataResult.total}
                  onScroll={onGridScrollHandler}
                  //정렬기능
                  sortable={true}
                  onSortChange={onGridSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions[
                      "grdMonthList"
                    ].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 && (
                          <GridColumn
                            key={idx}
                            field={item.fieldName.replace("qty", "amt")}
                            title={item.caption}
                            width={item.width}
                            cell={
                              numberField.includes(item.fieldName)
                                ? NumberCell
                                : dateField.includes(item.fieldName)
                                ? DateCell
                                : undefined
                            }
                            footerCell={
                              item.sortOrder === 0
                                ? gridTotalFooterCell
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </ExcelExport>
            </GridContainer>
            <GridContainerWrap>
              <GridContainer
                width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 60 - 600 + "px"}
              >
                <Chart>
                  {/* <ChartTitle text="Units sold" /> */}
                  <ChartValueAxis>
                    <ChartValueAxisItem
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                    />
                  </ChartValueAxis>
                  <ChartCategoryAxis>
                    <ChartCategoryAxisItem
                      categories={chartDataResult.map((item: any) => item.mm)}
                    ></ChartCategoryAxisItem>
                  </ChartCategoryAxis>
                  <ChartSeries>
                    <ChartSeriesItem
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="line"
                      data={chartDataResult.map((item: any) => item.qty)}
                    />
                    <ChartSeriesItem
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="bar"
                      // gap={2}
                      // spacing={0.25}
                      data={chartDataResult.map((item: any) => item.amt)}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainer>
              <GridContainer width="600px">
                <Chart>
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      //autoFit={true}
                      type="pie"
                      data={chartDataResult}
                      field="amt"
                      categoryField="mm"
                      labels={{
                        visible: true,
                        content: (e) =>
                          e.percentage !== 0 ? labelContent(e) : "",
                      }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainer>
            </GridContainerWrap>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="분기별">
          <GridContainerWrap flexDirection="column">
            <GridContainer
              width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 60 + "px"}
            >
              <ExcelExport
                data={gridDataResult.data}
                ref={(exporter) => {
                  _export = exporter;
                }}
              >
                <Grid
                  style={{ height: "32vh" }}
                  data={process(
                    gridDataResult.data.map((row) => ({
                      ...row,
                      // person: personListData.find(
                      //   (item: any) => item.code === row.person
                      // )?.name,
                      [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
                    })),
                    gridDataState
                  )}
                  {...gridDataState}
                  onDataStateChange={onGridDataStateChange}
                  //선택 기능
                  dataItemKey={DATA_ITEM_KEY}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "single",
                  }}
                  onSelectionChange={onMonthGridSelectionChange}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={gridDataResult.total}
                  onScroll={onGridScrollHandler}
                  //정렬기능
                  sortable={true}
                  onSortChange={onGridSortChange}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                >
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions[
                      "grdQuarterList"
                    ].map(
                      (item: any, idx: number) =>
                        item.sortOrder !== -1 &&
                        (item.fieldName !== "custcd" &&
                        item.fieldName !== "custnm" ? (
                          <GridColumn
                            key={idx}
                            field={item.fieldName}
                            title={item.caption}
                            footerCell={
                              item.sortOrder === 0
                                ? gridTotalFooterCell
                                : undefined
                            }
                          >
                            <GridColumn
                              title={"1/4분기"}
                              cell={NumberCell}
                              field={item.caption === "전기" ? "jm1" : "dm1"}
                              footerCell={gridSumQtyFooterCell}
                            />
                            <GridColumn
                              title={"2/4분기"}
                              cell={NumberCell}
                              field={item.caption === "전기" ? "jm2" : "dm2"}
                              footerCell={gridSumQtyFooterCell}
                            />
                            <GridColumn
                              title={"3/4분기"}
                              cell={NumberCell}
                              field={item.caption === "전기" ? "jm3" : "dm3"}
                              footerCell={gridSumQtyFooterCell}
                            />
                            <GridColumn
                              title={"4/4분기"}
                              cell={NumberCell}
                              field={item.caption === "전기" ? "jm4" : "dm4"}
                              footerCell={gridSumQtyFooterCell}
                            />
                            <GridColumn
                              title={"합계"}
                              cell={NumberCell}
                              field={
                                item.caption === "전기" ? "jtotal" : "dtotal"
                              }
                              footerCell={gridSumQtyFooterCell}
                            />
                          </GridColumn>
                        ) : (
                          <GridColumn
                            key={idx}
                            field={item.fieldName}
                            title={item.caption}
                            footerCell={
                              item.sortOrder === 0
                                ? gridTotalFooterCell
                                : numberField.includes(item.fieldName)
                                ? gridSumQtyFooterCell
                                : undefined
                            }
                          />
                        ))
                    )}
                </Grid>
              </ExcelExport>
            </GridContainer>
            <GridContainerWrap>
              <GridContainer
                width={CLIENT_WIDTH - GNV_WIDTH - GRID_MARGIN - 60 - 600 + "px"}
              >
                <Chart>
                  {/* <ChartTitle text="Units sold" /> */}
                  <ChartValueAxis>
                    <ChartValueAxisItem
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                    />
                  </ChartValueAxis>
                  <ChartCategoryAxis>
                    <ChartCategoryAxisItem
                      categories={chartDataResult
                        .filter((item: any) => item.series === "당기")
                        .map((item: any) => item.mm)}
                    ></ChartCategoryAxisItem>
                  </ChartCategoryAxis>

                  <ChartLegend position="bottom" orientation="horizontal" />
                  <ChartSeries>
                    <ChartSeriesItem
                      name="당기수량"
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="line"
                      data={chartDataResult
                        .filter((item: any) => item.series === "당기")
                        .map((item: any) => item.qty)}
                    />
                    <ChartSeriesItem
                      name="전기수량"
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="line"
                      data={chartDataResult
                        .filter((item: any) => item.series === "전기")
                        .map((item: any) => item.qty)}
                    />
                    <ChartSeriesItem
                      name="당기"
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="bar"
                      // gap={2}
                      // spacing={0.25}
                      data={chartDataResult
                        .filter((item: any) => item.series === "당기")
                        .map((item: any) => item.amt)}
                    />
                    <ChartSeriesItem
                      name="전기"
                      labels={{
                        visible: true,
                        content: (e) => numberWithCommas(e.value) + "",
                      }}
                      type="bar"
                      // gap={2}
                      // spacing={0.25}"
                      data={chartDataResult
                        .filter((item: any) => item.series === "전기")
                        .map((item: any) => item.amt)}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainer>
              <GridContainer width="600px">
                <Chart>
                  <ChartTitle text="분기별 매출 금액 비율(%)" />

                  <ChartTooltip render={quarterDonutRenderTooltip} />
                  <ChartLegend visible={false} position="bottom" />
                  <ChartSeries>
                    <ChartSeries>
                      <ChartSeriesItem
                        type="donut"
                        startAngle={150}
                        name={"전기"}
                        data={chartDataResult
                          .filter((item: any) => item.series === "전기")
                          .map((item: any) => item)}
                        field="amt"
                        categoryField="mm"
                        colorField="color"
                      ></ChartSeriesItem>
                      <ChartSeriesItem
                        type="donut"
                        startAngle={150}
                        name={"당기"}
                        data={chartDataResult
                          .filter((item: any) => item.series === "당기")
                          .map((item: any) => item)}
                        field="amt"
                        categoryField="mm"
                        colorField="color"
                      >
                        <ChartSeriesLabels
                          position="outsideEnd"
                          background="none"
                          content={labelContent}
                        />
                      </ChartSeriesItem>
                    </ChartSeries>
                  </ChartSeries>
                </Chart>
              </GridContainer>
            </GridContainerWrap>
          </GridContainerWrap>
        </TabStripTab>
      </TabStrip>

      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={"FILTER"}
          setData={setCustData}
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

export default MA_B3000W;
