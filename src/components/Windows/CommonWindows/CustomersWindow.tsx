import { useEffect, useLayoutEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridEvent,
  GridDataStateChangeEvent,
  getSelectedState,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { DataResult, process, State, getter } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  Title,
  TitleContainer,
} from "../../../CommonStyled";
import { Input } from "@progress/kendo-react-inputs";
import { Iparameters } from "../../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition, TCommonCodeData } from "../../../hooks/interfaces";
import { chkScrollHandler, getHeight, getWindowDeviceHeight, UseBizComponent } from "../../CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import BizComponentRadioGroup from "../../RadioGroups/BizComponentRadioGroup";
import BizComponentComboBox from "../../ComboBoxes/BizComponentComboBox";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isFilterHideState2, isLoading } from "../../../store/atoms";
import { handleKeyPressSearch } from "../../CommonFunction";
import { bytesToBase64 } from "byte-base64";
import Window from "../WindowComponent/Window";
import WindowFilterContainer from "../../WindowFilterContainer";

type IKendoWindow = {
  setVisible(t: boolean): void;
  setData(data: object): void;
  workType: string;
  para?: Iparameters;
  modal? :boolean;
};

const DATA_ITEM_KEY = "custcd";
var height = 0;
var height2 = 0;
var height3 = 0;

const KendoWindow = ({ setVisible, workType, setData, para, modal = false }: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;

  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 600) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 800) / 2,
    width: isMobile == true ? deviceWidth : 600,
    height: isMobile == true ? deviceHeight : 800,
  });

  const [mobileheight, setMobileHeight] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [isFilterHideStates2, setisFilterHideStates2] =
    useRecoilState(isFilterHideState2);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar");
    height2 = getHeight(".WindowTitleContainer");
    height3 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(true, deviceHeight) - height - height2 - height3
    );
    setWebHeight(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height3
    );
  }, []);

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height3
    );
  };

  const setLoading = useSetRecoilState(isLoading);

  // const [bizComponentData, setBizComponentData] = useState<any>(null);
  // UseBizComponent(
  //   "L_BA026,R_USEYN",
  //   //업체구분, 사용여부,
  //   setBizComponentData,
  // );

  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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

  //조회조건 DropDownList Change 함수 => 사용자가 선택한 드롭다운리스트 값을 조회 파라미터로 세팅
  const filterDropDownListChange = (name: string, data: TCommonCodeData) => {
    setFilters((prev) => ({
      ...prev,
      [name]: data.sub_code,
    }));
  };


  const onClose = () => {
    setisFilterHideStates2(true);
    setVisible(false);
  };

  const processApi = useApi();
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainPgNum, setMainPgNum] = useState(1);
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState),
  );

  //조회조건 초기값
  const [filters, setFilters] = useState({
    custcd: "",
    custnm: "",
    custdiv: "",
    useyn: "",
  });

  //팝업 조회 파라미터
  const parameters = {
    para:
      "popup-data?id=" +
      "P_CUSTCD" +
      "&page=" +
      mainPgNum +
      "&pageSize=" +
      PAGE_SIZE,
    custcd: filters.custcd,
    custnm: filters.custnm,
    custdiv: filters.custdiv,
    useyn:
      filters.useyn === "Y" ? "사용" : filters.useyn === "N" ? "미사용" : "",
  };

  useEffect(() => {
    fetchMainGrid();
  }, [mainPgNum]);

  //요약정보 조회
  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("bizgst-popup-data", parameters);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      const totalRowCnt = data.data.TotalRowCount;
      const rows = data.data.Rows;

      if (totalRowCnt) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
             total: totalRowCnt == -1 ? 0 : totalRowCnt,
          };
        });
      }
    } else {
      console.log(data);
    }
    setLoading(false);
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
  };

  //스크롤 핸들러 => 한번에 pageSize만큼 조회
  const onScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onRowDoubleClick = (props: any) => {
    // 부모로 데이터 전달, 창 닫기
    const rowData = props.dataItem;
    setData(rowData);
    onClose();
  };

  const onConfirmClick = (props: any) => {
    const rowData = mainDataResult.data.find(
      (row: any) => row.custcd === Object.keys(selectedState)[0],
    );

    // 부모로 데이터 전달, 창 닫기
    if (rowData) setData(rowData);
    onClose();
  };

  //메인 그리드 선택 이벤트
  const onMainSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    setSelectedState(newSelectedState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
  };

  return (
    <Window
      titles={"업체마스터"}
      positions={position}
      Close={onClose}
      modals={modal}
      onChangePostion={onChangePostion}
    >
      <TitleContainer className="WindowTitleContainer">
        <ButtonContainer>
          <Button
            onClick={() => {
              resetAllGrid();
              fetchMainGrid();
            }}
            icon="search"
            themeColor={"primary"}
          >
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <WindowFilterContainer>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>업체코드</th>
              <td>
                <Input
                  name="custcd"
                  type="text"
                  value={filters.custcd}
                  onChange={filterInputChange}
                />
              </td>
              <th>업체명</th>
              <td>
                <Input
                  name="custnm"
                  type="text"
                  value={filters.custnm}
                  onChange={filterInputChange}
                />
              </td>
              {/* <th>업체구분</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentComboBox
                    name="custdiv"
                    value={filters.custdiv}
                    bizComponentId="L_BA026"
                    bizComponentData={bizComponentData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
              <th>사용여부</th>
              <td>
                {bizComponentData !== null && (
                  <BizComponentRadioGroup
                    name="useyn"
                    value={filters.useyn}
                    bizComponentId="R_USEYN"
                    bizComponentData={bizComponentData}
                    changeData={filterRadioChange}
                  />
                )}
              </td> */}
            </tr>
          </tbody>
        </FilterBox>
      </WindowFilterContainer>
      <GridContainer height={`${isMobile ? mobileheight : webheight}px`}>
        <Grid
          style={{ height: "100%" }}
          data={process(
            mainDataResult.data.map((row) => ({
              ...row,
              [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
            })),
            mainDataState,
          )}
          onDataStateChange={onMainDataStateChange}
          {...mainDataState}
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
          onScroll={onScrollHandler}
          //정렬기능
          sortable={true}
          onSortChange={onMainSortChange}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
          //더블클릭
          onRowDoubleClick={onRowDoubleClick}
        >
          <GridColumn
            field="custcd"
            title="업체코드"
            // width="140px"
            footerCell={mainTotalFooterCell}
          />

          <GridColumn
            field="custnm"
            title="업체명"
            // width="200px"
          />
          {/* <GridColumn field="custabbr" title="업체약어" width="120px" />
          <GridColumn field="bizregnum" title="사업자등록번호" width="140px" />
          <GridColumn field="custdiv" title="업체구분" width="120px" />
          <GridColumn field="useyn" title="사용유무" width="120px" />
          <GridColumn field="compclass" title="업태" width="120px" />
          <GridColumn field="ceonm" title="대표자명" width="120px" />
          <GridColumn field="remark" title="비고" width="300px" /> */}
        </Grid>
      </GridContainer>
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onConfirmClick}>
            확인
          </Button>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default KendoWindow;
