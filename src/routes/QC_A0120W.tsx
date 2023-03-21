import React, { useCallback, useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridFooterCellProps,
} from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { DataResult, process, State } from "@progress/kendo-data-query";
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
  ButtonInInput,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  Chart,
  ChartLegend,
  ChartSeries,
  ChartSeriesItem,
  ChartTitle,
} from "@progress/kendo-react-charts";
import "hammerjs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import YearCalendar from "../components/Calendars/YearCalendar";
import {
  chkScrollHandler,
  convertDateToStr,
  getQueryFromBizComponent,
  setDefaultDate,
  UseBizComponent,
  UseCustomOption,
  UsePermissions,
  handleKeyPressSearch,
} from "../components/CommonFunction";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import { IItemData } from "../hooks/interfaces";
import { COM_CODE_DEFAULT_VALUE, PAGE_SIZE } from "../components/CommonString";
import NumberCell from "../components/Cells/NumberCell";
import DateCell from "../components/Cells/DateCell";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import BizComponentComboBox from "../components/ComboBoxes/BizComponentComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

const QC_A0120: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const processApi = useApi();
  const pathname: string = window.location.pathname.replace("/", "");

  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;

      setFilters((prev) => ({
        ...prev,
        ymdFrdt: setDefaultDate(customOptionData, "ymdFrdt"),
        ymdTodt: setDefaultDate(customOptionData, "ymdTodt"),
        // cboLocation: defaultOption.find(
        //   (item: any) => item.id === "cboLocation"
        // ).valueCode,
        // radFinyn: defaultOption.find((item: any) => item.id === "radFinyn")
        //   .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_QC002,L_PR010,L_fxcode,L_dptcd_001,L_sysUserMaster_001",
    //불량유형, 공정, 설비, 부서코드, 담당자
    setBizComponentData
  );

  //공통코드 리스트 조회
  const [proccdListData, setProccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [prodmacListData, setProdmacListData] = useState([
    { fxfull: "", fxcode: "" },
  ]);
  const [prodempListData, setProdempListData] = useState([
    { user_id: "", user_name: "" },
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );
      const prodmacQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_fxcode")
      );
      const prodempQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );

      fetchQuery(proccdQueryStr, setProccdListData);
      fetchQuery(prodmacQueryStr, setProdmacListData);
      fetchQuery(prodempQueryStr, setProdempListData);
    }
  }, [bizComponentData]);

  const fetchQuery = useCallback(async (queryStr: string, setListData: any) => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setListData(rows);
    }
  }, []);

  const [detail1DataState, setDetail1DataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState([]);

  const [detail1DataResult, setDetail1DataResult] = useState<DataResult>(
    process([], detail1DataState)
  );

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detail1PgNum, setDetail1PgNum] = useState(1);

  const [tabSelected, setTabSelected] = React.useState(0);
  const handleSelectTab = (e: any) => {
    onRefreshClick();
    setTabSelected(e.selected);
    resetAllGrid();
  };

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

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
    pgSize: 200,
    work_type: "CHART",
    orgdiv: "01",
    //div: "0",
    location: "01",
    ymdFrdt: new Date(),
    ymdTodt: new Date(),
    cboProccd: "",
    cboFxcode: "",
    cboBadcd: "",
    itemcd: "",
    itemnm: "",
    select_item: "all",
    select_code: "%",
    cboDptcd: "",
  });

  const [detailFilters1, setDetailFilters1] = useState({
    pgSize: PAGE_SIZE,
    work_type: "DETAIL",
    orgdiv: "01",
    div: "0",
    location: "01",
    frdt: new Date(),
    todt: new Date(),
    proccd: "",
    fxcode: "",
    badcd: "",
    itemcd: "",
    itemnm: "",
    select_item: "all",
    select_code: "%",
    dptcd: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_QC_A0120W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "CHART",
      "@p_orgdiv": filters.orgdiv,
      "@p_div": tabSelected,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.ymdFrdt),
      "@p_todt": convertDateToStr(filters.ymdTodt),
      "@p_proccd": filters.cboProccd,
      "@p_fxcode": filters.cboFxcode,
      "@p_badcd": filters.cboBadcd,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_select_item": filters.select_item,
      "@p_select_code": filters.select_code,
      "@p_dptcd": filters.cboDptcd,
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_QC_A0120W_Q",
    pageNumber: detail1PgNum,
    pageSize: detailFilters1.pgSize,
    parameters: {
      "@p_work_type": "DETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_div": tabSelected,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.ymdFrdt),
      "@p_todt": convertDateToStr(filters.ymdTodt),
      "@p_proccd": filters.cboProccd,
      "@p_fxcode": filters.cboFxcode,
      "@p_badcd": filters.cboBadcd,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_select_item": filters.select_item,
      "@p_select_code": filters.select_code,
      "@p_dptcd": filters.cboDptcd,
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
      const rows = data.tables[0].Rows;

      setMainDataResult(rows);
    }
    setLoading(false);
  };

  const fetchDetailGrid1 = async () => {
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
        setDetail1DataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (customOptionData !== null) fetchMainGrid();
  }, [mainPgNum]);

  useEffect(() => {
    if (customOptionData !== null) fetchDetailGrid1();
  }, [detail1PgNum]);

  useEffect(() => {
    if (customOptionData !== null) resetAllGrid();
  }, [detailFilters1]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setDetail1PgNum(1);
    setMainDataResult([]);
    setDetail1DataResult(process([], detail1DataState));
  };

  //엑셀 내보내기
  let _export: ExcelExport | null | undefined;
  const exportExcel = () => {
    if (_export !== null && _export !== undefined) {
      _export.save();
    }
  };

  //스크롤 핸들러
  const onDetail1ScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detail1PgNum, PAGE_SIZE))
      setDetail1PgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onDetail1DataStateChange = (event: GridDataStateChangeEvent) => {
    setDetail1DataState(event.dataState);
  };

  const detail1TotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detail1DataResult.total}건
      </td>
    );
  };

  //품목마스터 팝업
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);
  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };
  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  const onDetail1SortChange = (e: any) => {
    setDetail1DataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const labelContent = (props: any) => {
    let formatedNumber = Number(props.percentage).toLocaleString(undefined, {
      style: "percent",
      //minimumFractionDigits: 2, //소수점
    });
    return `${props.dataItem.argument} : ${formatedNumber}`;
  };

  const [selectedChartData, setSelectedChartData] = useState({
    gubun: "전체",
    argument: "-",
  });

  const onChartSeriesClick = (props: any) => {
    const { item, argument, gubun } = props.dataItem;

    setSelectedChartData({
      gubun,
      argument,
    });

    setDetail1DataState({
      filter: {
        logic: "and",
        filters: [
          { field: item /*"proccd"*/, operator: "eq", value: argument },
          //{ field: "unitPrice", operator: "lt", value: 22 },
        ],
      },
    });
  };

  const onRefreshClick = () => {
    setSelectedChartData({
      gubun: "전체",
      argument: "-",
    });

    setDetail1DataState({});
  };

  type TCusomizedGrid = {
    maxWidth: string;
  };

  const [isInitSearch, setIsInitSearch] = useState(false);

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (
      customOptionData !== null &&
      isInitSearch === false &&
      permissions !== null
    ) {
      fetchMainGrid();
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  const CusomizedGrid = (props: TCusomizedGrid) => {
    const { maxWidth } = props;
    return (
      <GridContainer maxWidth={maxWidth}>
        <GridTitleContainer>
          <GridTitle>상세정보</GridTitle>
          <ButtonContainer>
            <Input
              name="gubun"
              type="text"
              value={selectedChartData.gubun}
              readOnly
            />
            <Input
              name="argument"
              type="text"
              value={selectedChartData.argument}
              readOnly
            />
            <Button
              onClick={onRefreshClick}
              themeColor={"primary"}
              fillMode={"outline"}
              icon="refresh"
            ></Button>
          </ButtonContainer>
        </GridTitleContainer>
        <Grid
          style={{ height: "64vh" }}
          data={process(
            detail1DataResult.data.map((row) => ({
              ...row,
              proccd: proccdListData.find(
                (item: any) => item.sub_code === row.proccd
              )?.code_name,
              prodmac: prodmacListData.find(
                (item: any) => item.fxcode === row.prodmac
              )?.fxfull,
              prodemp: prodempListData.find(
                (item: any) => item.user_id === row.prodemp
              )?.user_name,
              badpct: Math.round(row.badpct),
            })),
            detail1DataState
          )}
          {...detail1DataState}
          onDataStateChange={onDetail1DataStateChange}
          //정렬기능
          sortable={true}
          onSortChange={onDetail1SortChange}
          //스크롤 조회 기능
          fixedScroll={true}
          total={detail1DataResult.total}
          onScroll={onDetail1ScrollHandler}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
        >
          <GridColumn
            field="baddt"
            title="불량일자"
            width="120px"
            cell={DateCell}
          />
          <GridColumn
            field="lotnum"
            title="LOT NO"
            footerCell={detail1TotalFooterCell}
            width="150px"
          />
          <GridColumn
            field="prodqty"
            title="생산량"
            cell={NumberCell}
            width="120px"
          />
          <GridColumn
            field="goodqty"
            title="양품수량"
            cell={NumberCell}
            width="120px"
          />
          <GridColumn
            field="totbadqty"
            title="불량수량"
            cell={NumberCell}
            width="120px"
          />
          <GridColumn
            field="badpct"
            title="불량률(%)"
            cell={NumberCell}
            width="120px"
          />
          <GridColumn field="proccd" title="공정" width="120px" />
          <GridColumn field="prodmac" title="설비" width="120px" />
          <GridColumn field="prodemp" title="작업자" width="120px" />
          <GridColumn field="orglot" title="제조번호" width="120px" />
          <GridColumn field="itemcd" title="품목코드" width="120px" />
          <GridColumn field="itemnm" title="품목명" width="120px" />
          <GridColumn field="bnatur" title="재질" width="120px" />
          <GridColumn field="insiz" title="규격" width="120px" />
          <GridColumn field="rekey" title="실적번호" width="150px" />
        </Grid>
      </GridContainer>
    );
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
    fetchDetailGrid1();
  };

  return (
    <>
      <TitleContainer>
        <Title>불량내역조회</Title>

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
              <th>불량일자</th>
              <td colSpan={3}>
                <div className="filter-item-wrap">
                  <DatePicker
                    name="ymdFrdt"
                    value={filters.ymdFrdt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                  />
                  ~
                  <DatePicker
                    name="ymdTodt"
                    value={filters.ymdTodt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                  />
                </div>
              </td>

              <th>품목코드</th>
              <td>
                <Input
                  name="itemcd"
                  type="text"
                  value={filters.itemcd}
                  onChange={filterInputChange}
                />
                <ButtonInInput>
                  <Button
                    onClick={onItemWndClick}
                    icon="more-horizontal"
                    fillMode="flat"
                  />
                </ButtonInInput>
              </td>
              <th>품목명</th>
              <td>
                <Input
                  name="itemnm"
                  type="text"
                  value={filters.itemnm}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>불량유형</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="cboBadcd"
                    value={filters.cboBadcd}
                    bizComponentId="L_QC002"
                    bizComponentData={bizComponentData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>

              <th>공정</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="cboProccd"
                    value={filters.cboProccd}
                    bizComponentId="L_PR010"
                    bizComponentData={bizComponentData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>

              <th>설비</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="cboFxcode"
                    value={filters.cboFxcode}
                    bizComponentId="L_fxcode"
                    bizComponentData={bizComponentData}
                    changeData={filterComboBoxChange}
                    textField="fxfull"
                    valueField="fxcode"
                  />
                )}
              </td>

              <th>부서</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="cboDptcd"
                    value={filters.cboDptcd}
                    bizComponentId="L_dptcd_001"
                    bizComponentData={bizComponentData}
                    changeData={filterComboBoxChange}
                    textField="dptnm"
                    valueField="dptcd"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>

      <TabStrip selected={tabSelected} onSelect={handleSelectTab}>
        <TabStripTab title="공정불량">
          <GridContainerWrap>
            <GridContainer>
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB1"}
                >
                  <ChartTitle text="공정별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      //autoFit={true}
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "공정별"
                      )}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB1"}
                >
                  <ChartTitle text="설비별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      width={850}
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "설비별"
                      )}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB1"}
                >
                  <ChartTitle text="불량유형별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "불량유형별"
                      )}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB1"}
                >
                  <ChartTitle text="품목별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "품목별"
                      )}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
            </GridContainer>

            <CusomizedGrid maxWidth="850px"></CusomizedGrid>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="소재불량">
          <GridContainerWrap>
            <GridContainer maxWidth="100%">
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB2"}
                >
                  <ChartTitle text="공정별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "공정별"
                      )}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB2"}
                >
                  <ChartTitle text="설비별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      width={850}
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "설비별"
                      )}
                      //data={mainDataResult}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB2"}
                >
                  <ChartTitle text="불량유형별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "불량유형별"
                      )}
                      //data={mainDataResult}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB2"}
                >
                  <ChartTitle text="품목별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "품목별"
                      )}
                      //data={mainDataResult}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
            </GridContainer>

            <CusomizedGrid maxWidth="850px"></CusomizedGrid>
          </GridContainerWrap>
        </TabStripTab>
        <TabStripTab title="검사불량">
          <GridContainerWrap>
            <GridContainer maxWidth="100%">
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB3"}
                >
                  <ChartTitle text="불량유형별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "불량유형별"
                      )}
                      //data={mainDataResult}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
              <GridContainerWrap>
                <Chart
                  onSeriesClick={onChartSeriesClick}
                  className={"QC_A0120_TAB3"}
                >
                  <ChartTitle text="품목별" />
                  <ChartLegend position="bottom" />
                  <ChartSeries>
                    <ChartSeriesItem
                      type="pie"
                      data={mainDataResult.filter(
                        (item: any) => item.gubun === "품목별"
                      )}
                      //data={mainDataResult}
                      field="value"
                      categoryField="category"
                      labels={{ visible: true, content: labelContent }}
                    />
                  </ChartSeries>
                </Chart>
              </GridContainerWrap>
            </GridContainer>

            <CusomizedGrid maxWidth="1050px"></CusomizedGrid>
          </GridContainerWrap>
        </TabStripTab>
      </TabStrip>

      {itemWindowVisible && (
        <ItemsWindow
          setVisible={setItemWindowVisible}
          workType={"FILTER"}
          setData={setItemData}
        />
      )}
    </>
  );
};

export default QC_A0120;
