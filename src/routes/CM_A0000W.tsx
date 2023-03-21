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
  GridCellProps,
} from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
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
} from "../CommonStyled";
import { Input } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import {
  chkScrollHandler,
  convertDateToStr,
  getQueryFromBizComponent,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  findMessage,
  handleKeyPressSearch,
  UseGetValueFromSessionItem,
  UseParaPc,
  useSysMessage,
} from "../components/CommonFunction";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import CenterCell from "../components/Cells/CenterCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import CheckBoxReadOnlyCell from "../components/Cells/CheckBoxReadOnlyCell";
import { gridList } from "../store/columns/CM_A0000W_C";
import DetailWindow from "../components/Windows/CM_A0000W_Window";

const CheckBoxReadOnlyCellField = ["publish_yn"];
const DATA_ITEM_KEY = "datnum";
const CenterCellField = [
  "chooses_s",
  "loadok_s",
  "readok_s",
  "person",
  "publishdate",
];

const CM_A0000W: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  UsePermissions(setPermissions);

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null) {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        cbocategory: defaultOption.find(
          (item: any) => item.id === "cbocategory"
        ).valueCode,
        cboPerson: defaultOption.find((item: any) => item.id === "cboPerson")
          .valueCode,
        radPublish_yn: defaultOption.find(
          (item: any) => item.id === "radPublish_yn"
        ).valueCode,
        cbodtgb: defaultOption.find((item: any) => item.id === "cbodtgb")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_SYS007,L_sysUserMaster_001,L_SYS2200_dt,R_FINYN",
    //공지사항 카테고리,담당자, 공지사항날짜(일자)구분, 라디오버튼
    setBizComponentData
  );

  //공통코드 리스트 조회 ()

  const [finynListData, setFinynListData] = useState([{ code: "", name: "" }]);
  const [categoryListData, setCategoryListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [usersListData, setUsersListData] = useState([
    { user_id: "", user_name: "" },
  ]);
  const [dtgbListData, setDtgbListData] = useState([{ dtgb: "", 기준일: "" }]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const categoryQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_SYS007")
      );
      const dtgbQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_SYS2200_dt"
        )
      );
      const usersQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );
      const finynQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "R_FINYN")
      );

      fetchQuery(categoryQueryStr, setCategoryListData);
      fetchQuery(dtgbQueryStr, setDtgbListData);
      fetchQuery(usersQueryStr, setUsersListData);
      fetchQuery(finynQueryStr, setFinynListData);
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

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [detailDataState, setDetailDataState] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], detailDataState)
  );

  //window
  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;

      setSelectedState({ [rowData.datnum]: true });

      setDetailFilters((prev) => ({
        ...prev,
        location: rowData.location,
        datnum: rowData.datnum,
        category: rowData.category,
      }));

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
              onClick={onEditClick}
            >
              상세조회
            </Button>
          </td>
        )}
      </>
    );
  };

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);

  const [workType, setWorkType] = useState<"N" | "U">("N");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);

  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    datnum: "",
  });
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }

    const datnum = Object.getOwnPropertyNames(selectedState)[0];

    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      datnum: datnum,
    }));
  };

  const onAddClick = () => {
    setWorkType("N");
    setDetailWindowVisible(true);
  };

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

  //조회조건 초기값
  const [filters, setFilters] = useState({
    cbocategory: "",
    pgSize: PAGE_SIZE,
    orgdiv: "01",
    cboPerson: "",
    publishdate: new Date(),
    title: "",
    contents2: "",
    chooses_s: "",
    loadok_s: "",
    readok_s: "",
    cbodtgb: "C",
    datnum: "",
    radPublish_yn: "%",
    publish_start_date: new Date(),
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    datnum: "",
    category: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_CM_A0000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "Q",
      "@p_orgdiv": "01",
      "@p_datnum": filters.datnum,
      "@p_dtgb": filters.cbodtgb,
      "@p_frdt": convertDateToStr(filters.publish_start_date),
      "@p_category": filters.cbocategory,
      "@p_title": filters.title,
      "@p_yn": filters.radPublish_yn,
      "@p_attdatnum": "",
      "@p_userid": userId,
      "@p_newDiv": "N",
    },
  };

  const paraDeleted: Iparameters = {
    procedureName: "P_CM_A0000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_location": "",
      "@p_datnum": paraDataDeleted.datnum,
      "@p_category": "",
      "@p_title": "",
      "@p_attdatnum": "",
      "@p_userid": userId,
      "@p_contents": "",
      "@p_publish_yn": "",
      "@p_publish_start_date": "",
      "@p_publish_end_date": "",
      "@p_person": "",
      "@p_pc": pc,
      "@p_person2": "",
      "@p_chooses": "",
      "@p_loadok": "",
      "@p_readok": "",
      "@p_form_id": "",
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_CM_A0000W_S",
    pageNumber: 1,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "Q",
      "@p_orgdiv": "01",
      "@p_datnum": detailFilters.datnum,
      "@p_dtgb": "",
      "@p_frdt": "",
      "@p_category": detailFilters.category,
      "@p_title": "",
      "@p_yn": "",
      "@p_attdatnum": "",
      "@p_userid": userId,
      "@p_newDiv": "N",
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
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0)
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
    }
    setLoading(false);
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
    paraDataDeleted.datnum = "";
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

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

  useEffect(() => {
    if (customOptionData !== null) {
      fetchMainGrid();
    }
  }, [mainPgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.datnum]: true });

        setDetailFilters((prev) => ({
          ...prev,
          datnum: firstRowData.datnum,
          category: firstRowData.category,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
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
      datnum: selectedRowData.datnum,
      category: selectedRowData.category,
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
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };

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

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };

  const reloadData = (workType: string) => {
    //수정한 경우 행선택 유지, 신규건은 첫번째 행 선택
    if (workType === "U") {
      setIfSelectFirstRow(false);
    } else {
      setIfSelectFirstRow(true);
    }

    resetAllGrid();
    fetchMainGrid();
  };

  interface ICustData {
    custcd: string;
    custnm: string;
    custabbr: string;
    bizregnum: string;
    custdivnm: string;
    useyn: string;
    remark: string;
    compclass: string;
    ceonm: string;
  }
  interface IItemData {
    itemcd: string;
    itemno: string;
    itemnm: string;
    insiz: string;
    model: string;
    itemacnt: string;
    itemacntnm: string;
    bnatur: string;
    spec: string;
    invunit: string;
    invunitnm: string;
    unitwgt: string;
    wgtunit: string;
    wgtunitnm: string;
    maker: string;
    dwgno: string;
    remark: string;
    itemlvl1: string;
    itemlvl2: string;
    itemlvl3: string;
    extra_field1: string;
    extra_field2: string;
    extra_field7: string;
    extra_field6: string;
    extra_field8: string;
    packingsiz: string;
    unitqty: string;
    color: string;
    gubun: string;
    qcyn: string;
    outside: string;
    itemthick: string;
    itemlvl4: string;
    itemlvl5: string;
    custitemnm: string;
  }

  //업체마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
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

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    resetAllGrid();
    fetchMainGrid();
  };
  return (
    <>
      <TitleContainer>
        <Title>공지사항</Title>

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
              <th>일자구분</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="cbodtgb"
                    value={filters.cbodtgb}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    textField="기준일"
                    valueField="dtgb"
                    className="required"
                  />
                )}
              </td>
              <th>기준일자</th>
              <td>
                <DatePicker
                  name="publish_start_date"
                  value={filters.publish_start_date}
                  format="yyyy-MM-dd"
                  onChange={filterInputChange}
                  width="160px"
                  className="required"
                  placeholder=""
                />
              </td>

              <th>카테고리</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="cbocategory"
                    value={filters.cbocategory}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>
              <th>문서번호</th>
              <td>
                <Input
                  name="datnum"
                  type="text"
                  value={filters.datnum}
                  onChange={filterInputChange}
                />
              </td>
            </tr>

            <tr>
              <th>제목</th>
              <td colSpan={3}>
                <Input
                  name="contents2"
                  type="text"
                  value={filters.contents2}
                  onChange={filterInputChange}
                />
              </td>
              <th>공지사용여부</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="radPublish_yn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
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
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onAddClick}
                themeColor={"primary"}
                icon="file-add"
              >
                공지추가
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                공지삭제
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "80vh" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                category: categoryListData.find(
                  (item: any) => item.sub_code === row.category
                )?.code_name,
                person: usersListData.find(
                  (item: any) => item.user_id === row.person
                )?.user_name,
                dtgb: dtgbListData.find((item: any) => item.dtgb === row.dtgb)
                  ?.기준일,
                finyn: finynListData.find(
                  (item: any) => item.code === row.finyn
                )?.name,
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
            {customOptionData !== null &&
              [
                { fieldName: "CommandCell" },
                ...customOptionData.menuCustomColumnOptions["grdList"],
              ]
                .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                .map((item: any, idx: number) =>
                  item.fieldName === "CommandCell" ? (
                    <GridColumn cell={CommandCell} width="100px" />
                  ) : (
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        cell={
                          CenterCellField.includes(item.fieldName)
                            ? CenterCell
                            : CheckBoxReadOnlyCellField.includes(item.fieldName)
                            ? CheckBoxReadOnlyCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0 ? mainTotalFooterCell : undefined
                        }
                        locked={item.fixed === "None" ? false : true}
                      ></GridColumn>
                    )
                  )
                )}
          </Grid>
        </ExcelExport>
      </GridContainer>
      {detailWindowVisible && (
        <DetailWindow
          getVisible={setDetailWindowVisible}
          workType={workType} //신규 : N, 수정 : U
          datnum={detailFilters.datnum}
          categories={
            categoryListData.find(
              (item: any) => item.code_name === detailFilters.category
            )?.sub_code == undefined
              ? "100"
              : categoryListData.find(
                  (item: any) => item.code_name === detailFilters.category
                )?.sub_code
          }
          reloadData={reloadData}
          para={detailParameters}
        />
      )}
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
      {itemWindowVisible && (
        <ItemsWindow
          setVisible={setItemWindowVisible}
          workType={"FILTER"}
          setData={setItemData}
        />
      )}
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

export default CM_A0000W;
