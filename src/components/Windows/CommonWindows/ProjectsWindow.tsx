import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ComboBoxChangeEvent } from "@progress/kendo-react-dropdowns";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  GridContainer,
  TitleContainer
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isFilterHideState2, isLoading } from "../../../store/atoms";
import {
  dateTypeColumns,
  userColumns,
} from "../../../store/columns/common-columns";
import CenterCell from "../../Cells/CenterCell";
import DateCell from "../../Cells/DateCell";
import CustomMultiColumnComboBox from "../../ComboBoxes/CustomMultiColumnComboBox";
import {
  convertDateToStr,
  getCodeFromValue,
  getHeight,
  getWindowDeviceHeight,
  handleKeyPressSearch,
  usersQueryStr,
} from "../../CommonFunction";
import { SELECTED_FIELD } from "../../CommonString";
import WindowFilterContainer from "../../WindowFilterContainer";
import Window from "../WindowComponent/Window";

type IKendoWindow = {
  setVisible(t: boolean): void;
  setData(data: object): void;
  para?: any;
};

const DATA_ITEM_KEY = "devmngnum";
let idx = 0;
var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;

const progressStatusData = [
  { value: "Y", label: "진행" },
  { value: "N", label: "미진행" },
  { value: "%", label: "전체" },
];
const isStatus = [
  { value: "Y", label: "완료" },
  { value: "N", label: "미완료" },
  { value: "Y,N", label: "전체" },
];

const KendoWindow = ({ setVisible, setData, para }: IKendoWindow) => {
  const { cust_data } = para;
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 1200) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 800) / 2,
    width: isMobile == true ? deviceWidth : 1200,
    height: isMobile == true ? deviceHeight : 800,
  });

  const [mobileheight, setMobileHeight] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [isFilterHideStates2, setisFilterHideStates2] =
    useRecoilState(isFilterHideState2);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar");
    height2 = getHeight(".WindowTitleContainer");
    height4 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(true, deviceHeight) - height - height2 - height4
    );
    setWebHeight(
      getWindowDeviceHeight(true, position.height) - height - height2 - height4
    );
  }, [webheight]);

  const onChangePosition = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2 - height4
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

  const filterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setFilters((prev) => ({
      ...prev,
      [name]: value,
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
  const [usersData, setUsersData] = useState([]);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
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
    customer_name: cust_data ? cust_data.custnm : "",
    pjt_person: "",
    pjtmanager: "",
    devperson: "",
    status: "N",
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
      "@p_pjt_person": getCodeFromValue(filters.pjt_person, "user_id"),
      "@p_pjtmanager": getCodeFromValue(filters.pjtmanager, "user_id"),
      "@p_devperson": getCodeFromValue(filters.devperson, "user_id"),
      "@p_status": filters.status,
      "@p_project": filters.project,
      "@p_progress_status": filters.progress_status,
      "@p_devmngnum": filters.devmngnum,
      "@p_code": filters.code,
      "@p_name": filters.name,
      "@p_type": "",
      "@p_service_id": "",
    },
  };

  useEffect(() => {
    fetchMainGrid();
    fetchUsers();
  }, []);

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
            data: rows,
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
    setMainDataResult(process([], mainDataState));
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
      (row: any) => row[DATA_ITEM_KEY] === Object.keys(selectedState)[0]
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
      <td
        colSpan={props.colSpan}
        style={props.style}
        className="k-grid-footer-sticky"
      >
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

  const fetchUsers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(usersQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setUsersData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const getUserName = (rowUserId: string) => {
    if (!usersData) return "";

    const data: any = usersData.find((item: any) => item.user_id === rowUserId);
    if (data) {
      return data.user_name;
    } else {
      return "";
    }
  };
  return (
    <Window
      titles={"프로젝트 마스터"}
      positions={position}
      Close={onClose}
      onChangePostion={onChangePosition}
      modals={true}
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
              <th style={{ padding: "0 10px" }}>
                <CustomMultiColumnComboBox
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      progress_status: e.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.value,
                    }))
                  }
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
                <CustomMultiColumnComboBox
                  name="pjt_person"
                  data={usersData}
                  value={filters.pjt_person}
                  columns={userColumns}
                  textField={"user_name"}
                  onChange={filterComboBoxChange}
                />
              </td>
            </tr>
            <tr>
              <th>담당PM</th>
              <td>
                <CustomMultiColumnComboBox
                  name="pjtmanager"
                  data={usersData}
                  value={filters.pjtmanager}
                  columns={userColumns}
                  textField={"user_name"}
                  onChange={filterComboBoxChange}
                />
              </td>
              <th>개발담당자</th>
              <td>
                <CustomMultiColumnComboBox
                  name="devperson"
                  data={usersData}
                  value={filters.devperson}
                  columns={userColumns}
                  textField={"user_name"}
                  onChange={filterComboBoxChange}
                />
              </td>
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
              pjtperson: getUserName(row.pjtperson),
              pjtmanager: getUserName(row.pjtmanager),
              is_finished: row.is_finished === "Y" ? "●" : "",
            })),
            mainDataState
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
            field="custnm"
            title="업체"
            width="180px"
            locked={true}
            footerCell={mainTotalFooterCell}
          />
          <GridColumn
            field="number"
            title="차수"
            width="50"
            locked={true}
            className="center"
          />
          <GridColumn field="project" title="프로젝트" width="180px" />
          <GridColumn
            field="cotracdt"
            title="사업시작일(계약일)"
            width="110px"
            cell={DateCell}
          />
          <GridColumn
            field="finexpdt"
            title="사업종료일"
            width="110px"
            cell={DateCell}
          />
          <GridColumn
            field="is_finished"
            title="완료"
            width="70"
            cell={CenterCell}
          />
          <GridColumn field="pjtperson" title="사업진행담당" width="110px" />
          <GridColumn field="pjtmanager" title="담당PM" width="110px" />
          <GridColumn field="remark" title="비고" width="200px" />
          <GridColumn
            field="midchkdt"
            title="중간점검일"
            width="110px"
            cell={DateCell}
          />
          <GridColumn
            field="finchkdt"
            title="최종점검일"
            width="110px"
            cell={DateCell}
          />
          <GridColumn field="ceonm" title="개발관리번호" width="120px" />
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
