import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  GridContainer,
  GridTitle,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
  LandscapePrint,
  ButtonInInput,
} from "../CommonStyled";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  convertDateToStr,
  convertDateToStrWithTime2,
  dateformat2,
  numberWithCommas,
  setDefaultDate,
  UseCustomOption,
  UsePermissions,
  handleKeyPressSearch,
  //UseMenuDefaults,
} from "../components/CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import TopButtons from "../components/TopButtons";
import NumberCell from "../components/Cells/NumberCell";
import CenterCell from "../components/Cells/CenterCell";
import ReactToPrint from "react-to-print";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import { IItemData } from "../hooks/interfaces";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";

//그리드 별 키 필드값
const DATA_ITEM_KEY = "idx";

const CT_A0111W: React.FC = () => {
  const processApi = useApi();
  const idGetter = getter(DATA_ITEM_KEY);
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);
  const setLoading = useSetRecoilState(isLoading);

  //그리드 데이터 스테이트
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  //그리드 데이터 결과값
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  //선택 상태
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  //그리드 별 페이지 넘버
  const [mainPgNum, setMainPgNum] = useState(1);

  const [isInitSearch, setIsInitSearch] = useState(false);

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

  //품목마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  //조회조건 초기값
  const [filters, setFilters] = useState({
    orgdiv: "01",
    itemcd: "",
    itemnm: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_CT_A0111W_Q",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": "LIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
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
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows.map((row: any, idx: number) => ({
        ...row,
        idx: idx,
      }));

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (mainDataResult.total > 0) {
      const firstRowData = mainDataResult.data[0];
      setSelectedState({ [firstRowData.itemcd]: true });
    }
  }, [mainDataResult]);

  useEffect(() => {
    fetchMainGrid();
  }, [mainPgNum]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
  };

  //메인 그리드 선택 이벤트 => 디테일1 그리드 조회
  const onMainSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    setSelectedState(newSelectedState);
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
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  //그리드 정렬 이벤트
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  // 최초 한번만 실행
  useEffect(() => {
    if (isInitSearch === false && permissions !== null) {
      fetchMainGrid();
      setIsInitSearch(true);
    }
  }, [filters, permissions]);

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
  };
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };

  const componentRef = useRef(null);
  return (
    <>
      <TitleContainer>
        <Title>품목별 표준원가 분석표</Title>

        <ButtonContainer>
          {permissions && (
            <TopButtons
              search={search}
              exportExcel={exportExcel}
              permissions={permissions}
            />
          )}

          {permissions && (
            <ReactToPrint
              trigger={() => (
                <Button
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="print"
                  disabled={permissions.print ? false : true}
                >
                  출력
                </Button>
              )}
              content={() => componentRef.current}
            />
          )}
        </ButtonContainer>
      </TitleContainer>

      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
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
              <th></th>
              <td></td>
              <th></th>
              <td></td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainer>
        <ExcelExport
          data={mainDataResult.data}
          ref={(exporter) => {
            _export = exporter;
          }}
        >
          <Grid
            style={{ height: "800px", display: "none" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
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
            onSelectionChange={onMainSelectionChange}
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
              field="num"
              title="NO"
              width="80"
              cell={CenterCell}
              footerCell={mainTotalFooterCell}
            />
            <GridColumn field="itemcd" title="품목코드" width="120" />
            <GridColumn field="itemnm" title="품목명" width="160" />

            <GridColumn title={"제조원가"}>
              <GridColumn
                field="puramt"
                title="재료비(B)"
                width="120"
                cell={NumberCell}
              />
              <GridColumn
                field="pramt"
                title="노무비(C)"
                width="120"
                cell={NumberCell}
              />
              <GridColumn
                field="mfamt"
                title="제조경비(E)"
                width="120"
                cell={NumberCell}
              />
              <GridColumn
                field="totamt"
                title="계(F)(B+D+E)"
                width="125"
                cell={NumberCell}
              />
            </GridColumn>

            <GridColumn
              field="sacamt"
              title="판매비와 일반관리비(G)"
              width="180"
              cell={NumberCell}
            />
            <GridColumn
              field="inamt"
              title="이자비용(H)"
              width="120"
              cell={NumberCell}
            />
            <GridColumn
              field="totcost"
              title="총 원가(I)(F+G+H)"
              width="150"
              cell={NumberCell}
            />
          </Grid>
        </ExcelExport>
      </GridContainer>
      <LandscapePrint>
        <div
          id="ItemCostSheet"
          className="printable landscape"
          ref={componentRef}
        >
          <div className="title_container">
            <h1 className="title">품목별 표준원가 분석표</h1>
            <table className="tb_approval right">
              <tbody>
                <tr>
                  <th>담당</th>
                  <th>검토</th>
                  <th>승인</th>
                </tr>
                <tr className="contents">
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>{dateformat2(convertDateToStr(new Date()))}</p>
          <table className="main_tb">
            <colgroup>
              <col width="5%" />
              <col width="10%" />
              <col width="10%" />
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
            </colgroup>
            <tbody>
              <tr>
                <th rowSpan={2}>NO</th>
                <th rowSpan={2}>품목코드</th>
                <th rowSpan={2}>품목명</th>
                <th colSpan={4} className="red">
                  제 조 원 가
                </th>
                <th rowSpan={2}>
                  판매비와
                  <br />
                  일반관리비
                  <br />
                  (G)
                </th>
                <th rowSpan={2}>
                  이자비용
                  <br />
                  (H)
                </th>
                <th className="orange" rowSpan={2}>
                  총 원가(I)
                  <br />
                  (F+G+H)
                </th>
              </tr>
              <tr>
                <th className="red">
                  재료비
                  <br />
                  (B)
                </th>
                <th className="red">
                  노무비
                  <br />
                  (C)
                </th>
                <th className="red">
                  제조경비
                  <br />
                  (E)
                </th>
                <th className="red">
                  계(F)
                  <br />
                  (B+D+E)
                </th>
              </tr>
              {mainDataResult.data.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="center">{item.num}</td>
                  <td className="center">{item.itemcd}</td>
                  <td>{item.itemnm}</td>
                  <td className="number red">
                    {numberWithCommas(item.puramt)}
                  </td>
                  <td className="number red">{numberWithCommas(item.pramt)}</td>
                  <td className="number red">{numberWithCommas(item.mfamt)}</td>
                  <td className="number red">
                    {numberWithCommas(item.totamt)}
                  </td>
                  <td className="number">{numberWithCommas(item.sacamt)}</td>
                  <td className="number">{numberWithCommas(item.inamt)}</td>
                  <td className="number orange">
                    {numberWithCommas(item.totcost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LandscapePrint>

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

export default CT_A0111W;
