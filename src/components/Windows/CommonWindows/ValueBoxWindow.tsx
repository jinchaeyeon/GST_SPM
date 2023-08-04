import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridDataStateChangeEvent,
  getSelectedState,
  GridSelectionChangeEvent,
  GridHeaderCellProps,
  GridItemChangeEvent,
} from "@progress/kendo-react-grid";
import { DataResult, process, State, getter } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  GridContainer,
  GridContainerWrap,
  Title,
  TitleContainer,
} from "../../../CommonStyled";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import { getGridItemChangedData } from "../../CommonFunction";
import { EDIT_FIELD, GAP, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../../store/atoms";
import { handleKeyPressSearch } from "../../CommonFunction";
import { bytesToBase64 } from "byte-base64";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import { CellRender, RowRender } from "../../Renderers/Renderers";

type IKendoWindow = {
  setVisible(t: boolean): void;
  setData(data: object): void;
};

const DATA_ITEM_KEY = "code";
const DATA_ITEM_KEY2 = "idx";

const itemlvl1QueryStr = `SELECT sub_code, code_name
FROM comCodeMaster WHERE group_code = 'BA010_GST'`;
const itemlv21QueryStr = `SELECT sub_code, code_name, extra_field1, extra_field2
FROM comCodeMaster WHERE group_code = 'BA011_GST'`;
const itemlv31QueryStr = `SELECT sub_code, code_name
FROM comCodeMaster WHERE group_code = 'BA012_GST'`;

const KendoWindow = ({ setVisible, setData }: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1200,
    height: 800,
  });
  const [tabSelected, setTabSelected] = React.useState(0);
  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);

    if (e.selected == 0) {
      setFilters((prev) => ({
        ...prev,
        work_type: "value_box",
        isSearch: true,
      }));
    } else if (e.selected == 1) {
      setFilters((prev) => ({
        ...prev,
        work_type: "service",
        isSearch: true,
      }));
    }
  };
  const setLoading = useSetRecoilState(isLoading);

  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [subSelectedState, setSubSelectedState] = useState<{
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
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });
  const [itemlvl1, setItemlvl1] = useState([]);
  const [itemlvl2, setItemlvl2] = useState([]);
  const [itemlvl3, setItemlvl3] = useState([]);

  const fetchitemlvl1 = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(itemlvl1QueryStr));

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
      setItemlvl1(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchitemlvl2 = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(itemlv21QueryStr));

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
      setItemlvl2(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchitemlvl3 = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(itemlv31QueryStr));

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
      setItemlvl3(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const from_date = new Date(); // 현재 날짜와 시간을 가져옵니다.
  from_date.setMonth(from_date.getMonth() - 6);

  //조회조건 초기값
  const [filters, setFilters] = useState({
    work_type: "value_box",
    code: "",
    name: "",
    isSearch: true,
  });
  const [subfilters, setSubFilters] = useState({
    work_type: "menu",
    type: "",
    service_id: "",
    isSearch: false,
  });

  useEffect(() => {
    fetchitemlvl1();
    fetchitemlvl2();
    fetchitemlvl3();
    fetchMainGrid();
  }, []);
  //팝업 조회 파라미터
  const parameters = {
    procedureName: "pw6_sel_project_master",
    pageNumber: 1,
    pageSize: PAGE_SIZE,
    parameters: {
      "@p_work_type": filters.work_type,
      "@p_date_type": "",
      "@p_from_date": "",
      "@p_to_date": "",
      "@p_customer_code": "",
      "@p_customer_name": "",
      "@p_pjt_person": "",
      "@p_status": "",
      "@p_project": "",
      "@p_progress_status": "",
      "@p_devmngnum": "",
      "@p_code": tabSelected == 0 ? filters.code : "",
      "@p_name": tabSelected == 0 ? filters.name : "",
      "@p_type": "",
      "@p_service_id": "",
    },
  };
  //요약정보 조회
  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (tabSelected == 0) {
        setMainDataResult((prev) => {
          return {
            data: rows,
             total: totalRowCnt == -1 ? 0 : totalRowCnt,
          };
        });
      } else {
        setMainDataResult((prev) => {
          return {
            data: rows,
             total: totalRowCnt == -1 ? 0 : totalRowCnt,
          };
        });
      }
      if (totalRowCnt > 0) {
        setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });

        setSubFilters((prev) => ({
          ...prev,
          service_id: rows[0].service_id,
          type: rows[0].type,
          isSearch: true,
        }));
      }
    } else {
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setFilters((prev) => ({
      ...prev,
      isSearch: false,
    }));
    setLoading(false);
  };

  //요약정보 조회
  const fetchSubGrid = async () => {
    let data: any;
    setLoading(true);
    //팝업 조회 파라미터
    const parameters2 = {
      procedureName: "pw6_sel_project_master",
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      parameters: {
        "@p_work_type": subfilters.work_type,
        "@p_date_type": "",
        "@p_from_date": "",
        "@p_to_date": "",
        "@p_customer_code": "",
        "@p_customer_name": "",
        "@p_pjt_person": "",
        "@p_status": "",
        "@p_project": "",
        "@p_progress_status": "",
        "@p_devmngnum": "",
        "@p_code": filters.code,
        "@p_name": filters.name,
        "@p_type": subfilters.type,
        "@p_service_id": subfilters.service_id,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters2);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      setSubDataResult((prev) => {
        return {
          data: rows,
           total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });

      if (totalRowCnt > 0) {
        setSubSelectedState({ [rows[0][DATA_ITEM_KEY2]]: true });
      }
    } else {
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setSubFilters((prev) => ({
      ...prev,
      isSearch: false,
    }));
    setLoading(false);
  };

  useEffect(() => {
    if (
      filters.isSearch &&
      itemlvl2.length != 0 &&
      itemlvl3.length != 0 &&
      itemlvl1.length != 0
    ) {
      setFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록
      fetchMainGrid();
    }
  }, [filters]);

  useEffect(() => {
    if (subfilters.isSearch && tabSelected == 1) {
      setSubFilters((prev) => ({ ...prev, isSearch: false })); // 한번만 조회되도록
      fetchSubGrid();
    }
  }, [subfilters]);

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

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  const onSubSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onConfirmClick = (props: any) => {
    const rowData = mainDataResult.data.filter((row: any) => row.chk == true);
    const rowData2 = subDataResult.data.filter((row: any) => row.chk == true);

    // 부모로 데이터 전달, 창 닫기
    if (tabSelected == 0) {
      if (rowData) setData(rowData);
    } else {
      if (rowData2) setData(rowData2);
    }
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
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
    if (tabSelected == 1) {
      setSubFilters((prev) => ({
        ...prev,
        service_id: selectedRowData.service_id,
        type: selectedRowData.type,
        isSearch: true,
      }));
    }
  };

  //메인 그리드 선택 이벤트
  const onSubSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: subSelectedState,
      dataItemKey: DATA_ITEM_KEY2,
    });

    setSubSelectedState(newSelectedState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  //그리드 푸터
  const subTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = subDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {subDataResult.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };
  const search = () => {
    if (tabSelected == 0) {
      resetAllGrid();
      fetchMainGrid();
    } else {
      fetchSubGrid();
    }
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

  const [values, setValues] = React.useState<boolean>(false);
  const CustomCheckBoxCell = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = subDataResult.data.map((item) => ({
        ...item,
        chk: !values,
        [EDIT_FIELD]: props.field,
      }));
      setValues(!values);
      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  const [values2, setValues2] = React.useState<boolean>(false);
  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        chk: !values2,
        [EDIT_FIELD]: props.field,
      }));
      setValues2(!values2);
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values2} onClick={changeCheck}></Checkbox>
      </div>
    );
  };

  const onMainItemChange = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const onSubItemChange = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      DATA_ITEM_KEY2
    );
  };

  const customCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const customCellRender2 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit2}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender2 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit2}
      editField={EDIT_FIELD}
    />
  );

  const enterEdit = (dataItem: any, field: string) => {
    let valid = true;
    if (field == "chk") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              chk:
                typeof item.chk == "boolean"
                  ? item.chk
                  : item.chk == "Y"
                  ? true
                  : false,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = mainDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const enterEdit2 = (dataItem: any, field: string) => {
    let valid = true;
    if (field == "chk") {
      const newData = subDataResult.data.map((item) =>
        item[DATA_ITEM_KEY2] === dataItem[DATA_ITEM_KEY2]
          ? {
              ...item,
              chk:
                typeof item.chk == "boolean"
                  ? item.chk
                  : item.chk == "Y"
                  ? true
                  : false,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );

      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit2 = () => {
    const newData = subDataResult.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const getItemlvl1 = (str: string) => {
    if (!itemlvl1) return "";

    const data: any = itemlvl1.find((item: any) => item.sub_code == str);
    if (data) {
      return data.code_name;
    } else {
      return "";
    }
  };

  const getItemlvl2 = (str: string) => {
    if (!itemlvl2) return "";

    const data: any = itemlvl2.find((item: any) => item.sub_code == str);
    if (data) {
      return data.code_name;
    } else {
      return "";
    }
  };

  const getItemlvl3 = (str: string) => {
    if (!itemlvl3) return "";

    const data: any = itemlvl3.find((item: any) => item.sub_code == str);

    if (data) {
      return data.code_name;
    } else {
      return "";
    }
  };

  return (
    <Window
      title={"ValueBox"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
      <TitleContainer>
        <Title />
        <ButtonContainer>
          <Button onClick={() => search()} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <FilterBoxWrap>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>Value Code</th>
              <td>
                <Input
                  name="code"
                  type="text"
                  value={filters.code}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>Value Name</th>
              <td>
                <Input
                  name="name"
                  type="text"
                  value={filters.name}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <TabStrip
        style={{ width: "100%" }}
        selected={tabSelected}
        onSelect={handleSelectTab}
      >
        <TabStripTab title="Value Items">
          <GridContainer height="calc(100% - 260px)">
            <Grid
              style={{ height: "45vh" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  itemlvl1: getItemlvl1(row.itemlvl1),
                  itemlvl2: getItemlvl2(row.itemlvl2),
                  itemlvl3: getItemlvl3(row.itemlvl3),
                  [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
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
              onItemChange={onMainItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn
                field="chk"
                title=" "
                width="45px"
                headerCell={CustomCheckBoxCell2}
                cell={CheckBoxCell}
              />
              <GridColumn field="itemlvl1" title="대분류" width="120px" />
              <GridColumn field="itemlvl2" title="중분류" width="120px" />
              <GridColumn field="itemlvl3" title="소분류" width="120px" />
              <GridColumn
                field="code"
                title="코드"
                width="200px"
                footerCell={mainTotalFooterCell}
              />
              <GridColumn field="name" title="이름" width="200px" />
              <GridColumn field="remark" title="비고" width="290px" />
            </Grid>
          </GridContainer>
        </TabStripTab>
        <TabStripTab title="C# Services">
          <GridContainerWrap>
            <GridContainer width="30%" height="calc(100% - 260px)">
              <Grid
                style={{ height: "45vh" }}
                data={process(
                  mainDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]: selectedState[idGetter(row)], //선택된 데이터
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
              >
                <GridColumn
                  field="code"
                  title="서비스"
                  width="320px"
                  footerCell={mainTotalFooterCell}
                />
              </Grid>
            </GridContainer>
            <GridContainer
              width={`calc(70% - ${GAP}px)`}
              height="calc(100% - 240px)"
            >
              <Grid
                style={{ height: "47vh" }}
                data={process(
                  subDataResult.data.map((row) => ({
                    ...row,
                    [SELECTED_FIELD]: subSelectedState[idGetter2(row)], //선택된 데이터
                  })),
                  subDataState
                )}
                onDataStateChange={onSubDataStateChange}
                {...subDataState}
                //선택 기능
                dataItemKey={DATA_ITEM_KEY2}
                selectedField={SELECTED_FIELD}
                selectable={{
                  enabled: true,
                  mode: "single",
                }}
                onSelectionChange={onSubSelectionChange}
                //스크롤 조회 기능
                fixedScroll={true}
                total={subDataResult.total}
                //정렬기능
                sortable={true}
                onSortChange={onSubSortChange}
                //컬럼순서조정
                reorderable={true}
                //컬럼너비조정
                resizable={true}
                onItemChange={onSubItemChange}
                cellRender={customCellRender2}
                rowRender={customRowRender2}
                editField={EDIT_FIELD}
              >
                <GridColumn
                  field="chk"
                  title=" "
                  width="45px"
                  headerCell={CustomCheckBoxCell}
                  cell={CheckBoxCell}
                />
                <GridColumn
                  field="code"
                  title="코드"
                  width="200px"
                  footerCell={subTotalFooterCell}
                />
                <GridColumn field="name" title="이름" width="300px" />
                <GridColumn field="remark" title="비고" width="300px" />
              </Grid>
            </GridContainer>
          </GridContainerWrap>
        </TabStripTab>
      </TabStrip>
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
