import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
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
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { Iparameters } from "../../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition, TCommonCodeData } from "../../../hooks/interfaces";
import {
  chkScrollHandler,
  convertDateToStr,
  getCodeFromValue,
  UseBizComponent,
} from "../../CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import BizComponentRadioGroup from "../../RadioGroups/BizComponentRadioGroup";
import BizComponentComboBox from "../../ComboBoxes/BizComponentComboBox";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../../store/atoms";
import { handleKeyPressSearch } from "../../CommonFunction";
import { bytesToBase64 } from "byte-base64";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";

type IKendoWindow = {
  setVisible(t: boolean): void;
  setData(data: object): void;
  para?: string;
};

const DATA_ITEM_KEY = "customer_code";

const progressStatusData = [
  { value: "Y", label: "진행" },
  { value: "N", label: "미진행" },
  { value: "%", label: "전체" },
];
const isStatus = [
  { value: "Y", label: "완료" },
  { value: "N", label: "미완료" },
  { value: "%", label: "전체" },
];

const KendoWindow = ({ setVisible, setData, para }: IKendoWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1200,
    height: 800,
  });

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

  const filterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMove = (event: WindowMoveEvent) => {
    setPosition({ ...position, left: event.left, top: event.top });
  };
  const handleResize = (event: WindowMoveEvent) => {
    setPosition({
      left: event.left,
      top: event.top,
      width: event.width,
      height: event.height,
    });
  };

  const onClose = () => {
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

  const from_date = new Date(); // 현재 날짜와 시간을 가져옵니다.
  from_date.setMonth(from_date.getMonth() - 6);

  //조회조건 초기값
  const [filters, setFilters] = useState({
    work_type: "list",
    date_type: { name: "전체", code: "%" },
    from_date: from_date,
    to_date: new Date(),
    customer_code: "",
    customer_name: "",
    pjt_person: "",
    status: "%",
    project: "",
    progress_status: "%",
    devmngnum: "",
    code: "",
    name: "",
  });

  //팝업 조회 파라미터
  const parameters = {
    procedureName: "pw6_sel_project_master",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": filters.work_type,
      "@p_date_type": getCodeFromValue(filters.date_type, "code"),
      "@p_from_date": convertDateToStr(filters.from_date),
      "@p_to_date": convertDateToStr(filters.to_date),
      "@p_customer_code": filters.customer_code,
      "@p_customer_name": filters.customer_name,
      "@p_pjt_person": filters.pjt_person,
      "@p_status": filters.status,
      "@p_project": filters.project,
      "@p_progress_status": filters.progress_status,
      "@p_devmngnum": filters.devmngnum,
      "@p_code": filters.code,
      "@p_name": filters.name,
    },
  };

  useEffect(() => {
    fetchMainGrid();
  }, [mainPgNum]);

  //요약정보 조회
  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
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
      (row: any) => row.customer_code === Object.keys(selectedState)[0],
    );

    // 부모로 데이터 전달, 창 닫기
    setData(rowData);
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

  const dateTypeState = [
    {
      code: "A",
      name: "계약일",
    },
    {
      code: "B",
      name: "완료일",
    },
    {
      code: "C",
      name: "중간점검일",
    },
    {
      code: "D",
      name: "최종점검일",
    },
    {
      code: "E",
      name: "사업종료일",
    },
    {
      code: "%",
      name: "전체",
    },
  ];

  const dateTypeColumns = [
    {
      field: "name",
      header: "일자구분",
      width: 150,
    },
  ];
  return (
    <Window
      title={"프로젝트 마스터"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <TitleContainer>
        <Title />
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
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th style={{ padding: "0 10px" }}>
                <MultiColumnComboBox
                  name="date_type"
                  data={dateTypeState}
                  value={filters.date_type}
                  columns={dateTypeColumns}
                  textField={"name"}
                  onChange={filterComboBoxChange}
                  className="required"
                />
              </th>
              <td>
                <div className="filter-item-wrap">
                  <DatePicker
                    name="from_date"
                    value={filters.from_date}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                    className="required"
                  />
                  ~
                  <DatePicker
                    name="to_date"
                    value={filters.to_date}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    placeholder=""
                    className="required"
                  />
                </div>
              </td>
              <th>진행여부</th>
              <td>
                <RadioGroup
                  name="progress_status"
                  data={progressStatusData}
                  value={filters.progress_status}
                  onChange={filterRadioChange}
                  layout="horizontal"
                  className="required"
                ></RadioGroup>
              </td>
            </tr>

            <tr>
              <th>업체</th>
              <td>
                <Input
                  name="customer_name"
                  type="text"
                  value={filters.customer_name}
                  onChange={filterInputChange}
                />
              </td>
              <th>완료여부</th>
              <td>
                <RadioGroup
                  name="status"
                  data={isStatus}
                  value={filters.status}
                  onChange={filterRadioChange}
                  layout="horizontal"
                ></RadioGroup>
              </td>
            </tr>
            <tr>
              <th>프로젝트</th>
              <td>
                <Input
                  name="project"
                  type="text"
                  value={filters.project}
                  onChange={filterInputChange}
                />
              </td>
              <th>사업진행담당</th>
              <td>
                <MultiColumnComboBox
                  name="date_type"
                  data={dateTypeState}
                  value={filters.date_type}
                  columns={dateTypeColumns}
                  textField={"name"}
                  onChange={filterComboBoxChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainer height="calc(100% - 240px)">
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
          <GridColumn field="custnm" title="업체" width="200px" locked={true} />
          <GridColumn field="custabbr" title="차수" width="70" locked={true} />
          <GridColumn field="project" title="프로젝트" width="140px" />
          <GridColumn
            field="cotracdt"
            title="사업시작일(계약일)"
            width="120px"
          />
          <GridColumn field="finexpdt" title="사업종료일" width="120px" />
          <GridColumn field="is_finished" title="완료" width="70" />
          <GridColumn field="pjtperson" title="사업진행담당" width="110px" />
          <GridColumn field="pjtmanager" title="담당PM" width="110px" />
          <GridColumn field="remark" title="비고" width="200px" />
          <GridColumn field="midchkdt" title="중간점검일" width="120px" />
          <GridColumn field="finchkdt" title="최종점검일" width="120px" />
          <GridColumn field="ceonm" title="개발관리번호" width="120px" />
        </Grid>
      </GridContainer>
      <BottomContainer>
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
