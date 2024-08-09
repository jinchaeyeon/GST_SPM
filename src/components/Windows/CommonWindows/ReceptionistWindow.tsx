import { DataResult, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { getter } from "@progress/kendo-react-common";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridHeaderCellProps,
  GridItemChangeEvent,
  GridPageChangeEvent,
  GridRowDoubleClickEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  BottomContainer,
  ButtonContainer,
  FilterBox,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { IWindowPosition } from "../../../hooks/interfaces";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import {
  getGridItemChangedData,
  getHeight,
  getWindowDeviceHeight,
} from "../../CommonFunction";
import { EDIT_FIELD, GAP, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import Window from "../WindowComponent/Window";
import FilterContainer from "../../FilterContainer";

type IWindow = {
  setVisible(t: boolean): void;
};

type User = {
  id: number;
  name: string;
  assignedCompanies: number[];
  chk: boolean;
};

type Company = {
  id: number;
  name: string;
  chk: boolean;
  rowstatus: string;
};

const initialUsers: User[] = [
  { id: 1, name: "User 1", assignedCompanies: [1, 2], chk: false },
  { id: 2, name: "User 2", assignedCompanies: [3], chk: false },
  { id: 3, name: "User 3", assignedCompanies: [4, 5], chk: false },
  { id: 4, name: "User 4", assignedCompanies: [], chk: false },
  { id: 5, name: "User 5", assignedCompanies: [6, 7, 8], chk: false },
  { id: 6, name: "User 6", assignedCompanies: [9], chk: false },
  { id: 7, name: "User 7", assignedCompanies: [], chk: false },
  { id: 8, name: "User 8", assignedCompanies: [10], chk: false },
  { id: 9, name: "User 9", assignedCompanies: [11, 12], chk: false },
  { id: 10, name: "User 10", assignedCompanies: [13], chk: false },
];

const initialCompanies: Company[] = [
  { id: 1, name: "Company 1", chk: false, rowstatus: "N" },
  { id: 2, name: "Company 2", chk: false, rowstatus: "N" },
  { id: 3, name: "Company 3", chk: false, rowstatus: "N" },
  { id: 4, name: "Company 4", chk: false, rowstatus: "N" },
  { id: 5, name: "Company 5", chk: false, rowstatus: "N" },
  { id: 6, name: "Company 6", chk: false, rowstatus: "N" },
  { id: 7, name: "Company 7", chk: false, rowstatus: "N" },
  { id: 8, name: "Company 8", chk: false, rowstatus: "N" },
  { id: 9, name: "Company 9", chk: false, rowstatus: "N" },
  { id: 10, name: "Company 10", chk: false, rowstatus: "N" },
  { id: 11, name: "Company 11", chk: false, rowstatus: "N" },
  { id: 12, name: "Company 12", chk: false, rowstatus: "N" },
  { id: 13, name: "Company 13", chk: false, rowstatus: "N" },
  { id: 14, name: "Company 14", chk: false, rowstatus: "N" },
  { id: 15, name: "Company 15", chk: false, rowstatus: "N" },
  { id: 16, name: "Company 16", chk: false, rowstatus: "N" },
  { id: 17, name: "Company 17", chk: false, rowstatus: "N" },
  { id: 18, name: "Company 18", chk: false, rowstatus: "N" },
  { id: 19, name: "Company 19", chk: false, rowstatus: "N" },
  { id: 20, name: "Company 20", chk: false, rowstatus: "N" },
];

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;

const DATA_ITEM_KEY = "id";
const DATA_ITEM_KEY2 = "id";

const ReceptionistWindow = ({ setVisible }: IWindow) => {
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(DATA_ITEM_KEY2);
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [mobileheight, setMobileHeight] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 950) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 600) / 2,
    width: isMobile == true ? deviceWidth : 950,
    height: isMobile == true ? deviceHeight : 600,
  });
  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar"); //공통 해더
    height2 = getHeight(".BottomContainer"); //하단 버튼부분
    height3 = getHeight(".ButtonContainer");
    height4 = getHeight(".ButtonContainer2");
    height5 = getHeight(".ButtonContainer3");
    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - 25
    );
    setWebHeight(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height3 -
        5
    );
    setWebHeight2(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height4 -
        5
    );
    setWebHeight3(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height5 -
        5
    );
  }, [webheight, webheight2, webheight3]);

  const onClose = () => {
    setVisible(false);
  };

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2 - 25
    );
  };

  const [middleItems, setMiddleItems] = useState<DataResult>({
    data: initialCompanies,
    total: initialCompanies.length,
  });

  const [rightItems, setRightItems] = useState<DataResult>({
    data: [],
    total: 0,
  });

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [mainDataState2, setMainDataState2] = useState<State>({
    sort: [],
  });
  const [mainDataResult2, setMainDataResult2] = useState<DataResult>({
    data: initialUsers,
    total: initialUsers.length,
  });
  const [selectedState2, setSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [values, setValues] = React.useState<boolean>(false);
  const [values2, setValues2] = React.useState<boolean>(false);
  const CustomCheckBoxCell = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = middleItems.data.map((item) => ({
        ...item,
        chk: !values,
        rowstatus: item.rowstatus === "N" ? "N" : "U",
        [EDIT_FIELD]: props.field,
      }));
      setValues(!values);
      setMiddleItems((prev) => {
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

  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    const changeCheck = () => {
      const newData = rightItems.data.map((item) => ({
        ...item,
        chk: !values2,
        rowstatus: item.rowstatus === "N" ? "N" : "U",
        [EDIT_FIELD]: props.field,
      }));
      setValues2(!values2);
      setRightItems((prev) => {
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

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setMainDataState2(event.dataState);
  };

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
  };

  const onSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState2,
      dataItemKey: DATA_ITEM_KEY2,
    });
    setSelectedState2(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];
  };

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const initialPageState2 = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);

  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    // setFilters((prev) => ({
    //   ...prev,
    //   pgNum: Math.floor(page.skip / initialPageState.take) + 1,
    //   isSearch: true,
    // }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const pageChange2 = (event: GridPageChangeEvent) => {
    const { page } = event;

    // setFilters((prev) => ({
    //   ...prev,
    //   pgNum: Math.floor(page.skip / initialPageState.take) + 1,
    //   isSearch: true,
    // }));

    setPage2({
      skip: page.skip,
      take: initialPageState2.take,
    });
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainSortChange2 = (e: any) => {
    setMainDataState2((prev) => ({ ...prev, sort: e.sort }));
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

  const onMainItemChange2 = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult2,
      setMainDataResult2,
      DATA_ITEM_KEY2
    );
  };

  const customRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender2 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const customCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customCellRender2 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult2.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {mainDataResult2.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell2 = (props: GridFooterCellProps) => {
    var parts = middleItems.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {middleItems.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const mainTotalFooterCell3 = (props: GridFooterCellProps) => {
    var parts = rightItems.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총
        {rightItems.total == -1
          ? 0
          : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    if (field == "chk") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
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
    if (tempResult.data != mainDataResult.data) {
      const newData = mainDataResult.data.map(
        (item: { [x: string]: string; rowstatus: string }) =>
          item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
            ? {
                ...item,
                rowstatus: item.rowstatus == "N" ? "N" : "U",
                chk:
                  typeof item.chk == "boolean"
                    ? item.chk
                    : item.chk == "Y"
                    ? true
                    : false,
                [EDIT_FIELD]: undefined,
              }
            : {
                ...item,
                [EDIT_FIELD]: undefined,
              }
      );
      setTempResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    } else {
      const newData = mainDataResult.data.map((item: any) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
      setTempResult((prev: { total: any }) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
      setMainDataResult((prev: { total: any }) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const initialDataResult: DataResult = {
    data: initialCompanies,
    total: initialCompanies.length,
  };

  const initialUsersDataResult: DataResult = {
    data: initialUsers,
    total: initialUsers.length,
  };

  const handleUserClick = (user: User) => {
    const assignedCompanies = initialCompanies.filter((company) =>
      user.assignedCompanies.includes(company.id)
    ).map(company => ({ ...company, chk: false })); 
    const availableCompanies = initialCompanies.filter(
      (company) => !user.assignedCompanies.includes(company.id)
    ).map(company => ({ ...company, chk: false }));   
    setRightItems({ data: assignedCompanies, total: assignedCompanies.length });
    setMiddleItems({
      data: availableCompanies,
      total: availableCompanies.length,
    });
  };

  useEffect(() => {
    setMainDataResult(initialDataResult);
    setMainDataResult2(initialUsersDataResult);
  }, [initialDataResult, initialUsersDataResult]);

  const onRowDoubleClick = (e: GridRowDoubleClickEvent) => {
    const selectedCompany = e.dataItem;
    setRightItems((prevState) => {
      const updatedData = [...prevState.data, selectedCompany];
      return { data: updatedData, total: updatedData.length };
    });
    setMiddleItems((prevState) => {
      const updatedData = prevState.data.filter(
        (item) => item.id !== selectedCompany.id
      );
      return { data: updatedData, total: updatedData.length };
    });
  };

  const onRowDoubleClick2 = (e: GridRowDoubleClickEvent) => {
    const selectedCompany = e.dataItem;
    setMiddleItems((prevState) => {
      const updatedData = [...prevState.data, selectedCompany];
      return { data: updatedData, total: updatedData.length };
    });
    setRightItems((prevState) => {
      const updatedData = prevState.data.filter(
        (item) => item.id !== selectedCompany.id
      );
      return { data: updatedData, total: updatedData.length };
    });
  };

  return (
    <Window
      titles="접수담당업체 설정"
      positions={position}
      Close={onClose}
      modals={false}
      onChangePostion={onChangePostion}
    >
      <GridContainerWrap style={{ display: "flex", gap: GAP }}>
        <GridContainer style={{ width: "25%" }}>
          <GridTitleContainer className="ButtonContainer">
            <GridTitle>사용자 리스트</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap>
            <FormBox>
              <tbody>
                <td>
                  <Input
                    name="user_name"
                    type="text"
                    // value={filters.user_name}
                    // onChange={filterInputChange}
                  />
                </td>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <Grid
            data={mainDataResult2}
            onRowClick={(e) => handleUserClick(e.dataItem)}
            rowRender={customRowRender}
            style={{ height: webheight }}
          >
            <GridColumn
              field="name"
              title="사용자명"
              footerCell={mainTotalFooterCell}
            />
          </Grid>
        </GridContainer>
        <GridContainer style={{ width: "35%" }}>
          <GridTitleContainer className="ButtonContainer2">
            <GridTitle>전체업체</GridTitle>
            <Button
              disabled={mainDataResult.data.every((item) => !item.chk)}
              icon="plus"
              fillMode={"outline"}
              themeColor={"primary"}
            />
          </GridTitleContainer>
          <FormBoxWrap>
            <FormBox>
              <tbody>
                <td>
                  <Input
                    name="user_name"
                    type="text"
                    // value={filters.user_name}
                    // onChange={filterInputChange}
                  />
                </td>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <Grid
            data={process(
              middleItems.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState[idGetter(row)],
              })),
              mainDataState
            )}
            {...mainDataState}
            style={{ height: webheight2 }}
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
            onRowDoubleClick={onRowDoubleClick}
          >
            <GridColumn
              field="chk"
              title=" "
              width="45px"
              headerCell={CustomCheckBoxCell}
              cell={CheckBoxCell}
            />
            <GridColumn
              field="name"
              title="업체명"
              footerCell={mainTotalFooterCell2}
            />
          </Grid>
        </GridContainer>
        <GridContainer style={{ width: "35%" }}>
          <GridTitleContainer className="ButtonContainer3">
            <GridTitle>지정업체</GridTitle>
            <Button
              disabled={mainDataResult2.data.every((item) => !item.chk)}
              icon="minus"
              fillMode={"outline"}
              themeColor={"primary"}
            />
          </GridTitleContainer>
          <FormBoxWrap>
            <FormBox>
              <tbody>
                <td>
                  <Input
                    name="user_name"
                    type="text"
                    // value={filters.user_name}
                    // onChange={filterInputChange}
                  />
                </td>
              </tbody>
            </FormBox>
          </FormBoxWrap>
          <Grid
            style={{
              height: webheight3,
            }}
            data={process(
              rightItems.data.map((row) => ({
                ...row,
                [SELECTED_FIELD]: selectedState2[idGetter2(row)],
              })),
              mainDataState2
            )}
            {...mainDataState2}
            onDataStateChange={onMainDataStateChange2}
            //선택 기능
            dataItemKey={DATA_ITEM_KEY2}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            onSelectionChange={onSelectionChange2}
            //스크롤 조회 기능
            fixedScroll={true}
            total={mainDataResult2.total}
            //정렬기능
            sortable={true}
            onSortChange={onMainSortChange2}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
            onItemChange={onMainItemChange2}
            cellRender={customCellRender2}
            rowRender={customRowRender2}
            editField={EDIT_FIELD}
            onRowDoubleClick={onRowDoubleClick2}
          >
            <GridColumn
              field="chk"
              title=" "
              width="45px"
              headerCell={CustomCheckBoxCell2}
              cell={CheckBoxCell}
            />
            <GridColumn
              field="name"
              title="업체명"
              footerCell={mainTotalFooterCell3}
            />
          </Grid>
        </GridContainer>
      </GridContainerWrap>
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button themeColor={"primary"}>확인</Button>
          <Button
            themeColor={"primary"}
            fillMode={"outline"}
            onClick={() => {
              setVisible(false);
            }}
          >
            취소
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default ReceptionistWindow;
