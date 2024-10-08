import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridDataStateChangeEvent,
  getSelectedState,
  GridSelectionChangeEvent,
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
  Title,
  TitleContainer,
  GridTitleContainer,
} from "../../../CommonStyled";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import {
  UseParaPc,
  getGridItemChangedData,
  getHeight,
  getWindowDeviceHeight,
} from "../../CommonFunction";
import { EDIT_FIELD, GAP, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../../../store/atoms";
import { handleKeyPressSearch } from "../../CommonFunction";
import { bytesToBase64 } from "byte-base64";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { Iparameters } from "../../../store/types";
import Window from "../WindowComponent/Window";
import WindowFilterContainer from "../../WindowFilterContainer";

type IKendoWindow = {
  setVisible(t: boolean): void;
  reload(): void;
};

const DATA_ITEM_KEY = "num";
let temp = 0;
let deletedRows: any[] = [];
let targetRowIndex: null | number = null;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;

const KendoWindow = ({ setVisible, reload }: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  let deviceHeight = document.documentElement.clientHeight;

  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 900) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 700) / 2,
    width: isMobile == true ? deviceWidth : 900,
    height: isMobile == true ? deviceHeight : 700,
  });

  let gridRef: any = useRef(null);

  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const setLoading = useSetRecoilState(isLoading);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar");
    height2 = getHeight(".WindowTitleContainer");
    height3 = getHeight(".ButtonContainer");
    height4 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(true, deviceHeight) -
        height -
        height2 -
        height4
    );
    setMobileHeight2(
      getWindowDeviceHeight(true, deviceHeight) -
        height -
        height2 -
        height3 -
        height4
    );
    setWebHeight(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height4
    );
    setWebHeight2(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height3 -
        height4
    );
  }, []);

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height4
    );
    setWebHeight2(
      getWindowDeviceHeight(true, position.height) -
        height -
        height2 -
        height3 -
        height4
    );
  };

  const onClose = () => {
    setVisible(false);
    reload();
  };

  const processApi = useApi();
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [tempState, setTempState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [tempResult, setTempResult] = useState<DataResult>(
    process([], tempState)
  );
  //조회조건 초기값
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    isSearch: true,
    find_row_value: "",
  });

  const from_date = new Date(); // 현재 날짜와 시간을 가져옵니다.
  from_date.setMonth(from_date.getMonth() - 6);

  useEffect(() => {
    fetchMainGrid();
  }, []);

  useEffect(() => {
    if (filters.isSearch) {
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid();
    }
  }, [filters]);

  //요약정보 조
  const fetchMainGrid = async () => {
    let data: any;

    const DatasQueryStr = `SELECT a.sub_code as code,
    a.code_name as name,
    a.use_yn,
    a.memo as remark,
    total_row_count = COUNT(*) OVER(),
    ROW_NUMBER() OVER(ORDER by a.sub_code) as num
    FROM comCodeMaster a 
    WHERE a.group_code = 'BA012_GST'
    AND use_yn = 'Y'
    AND a.sub_code LIKE '%${filters.code}%'
    AND a.code_name LIKE '%${filters.name}%'`;
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(DatasQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (filters.find_row_value != "") {
        // find_row_value 행으로 스크롤 이동
        const findRowIndex = rows.findIndex(
          (row: any) => row.code == filters.find_row_value
        );

        targetRowIndex = findRowIndex;
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef.current) {
          targetRowIndex = 0;
        }
      }

      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt == -1 ? 0 : totalRowCnt,
        };
      });
      if (totalRowCnt > 0) {
        const selectedRow =
          filters.find_row_value == ""
            ? rows[0]
            : rows.find((row: any) => row.code == filters.find_row_value);
        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
        }
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
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

  const search = () => {
    setFilters((prev) => ({
      ...prev,
      isSearch: true,
      find_row_value: "",
    }));
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

  const enterEdit = (dataItem: any, field: string) => {
    if (
      !(field == "code" && dataItem.rowstatus != "N") &&
      field != "rowstatus"
    ) {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              [EDIT_FIELD]: field,
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
      setTempResult((prev) => {
        return {
          data: mainDataResult.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    if (tempResult.data != mainDataResult.data) {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
          ? {
              ...item,
              rowstatus: item.rowstatus == "N" ? "N" : "U",
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
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        [EDIT_FIELD]: undefined,
      }));
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
    }
  };

  const onAddClick = () => {
    mainDataResult.data.map((item) => {
      if (item[DATA_ITEM_KEY] > temp) {
        temp = item[DATA_ITEM_KEY];
      }
    });
    const newDataItem = {
      [DATA_ITEM_KEY]: ++temp,
      code: "",
      name: "",
      use_yn: "Y",
      remark: "",
      rowstatus: "N",
    };

    setMainDataResult((prev) => {
      return {
        data: [newDataItem, ...prev.data],
        total: prev.total + 1,
      };
    });
    setSelectedState({ [newDataItem[DATA_ITEM_KEY]]: true });
  };

  const onRemoveClick = () => {
    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    let newData: any[] = [];
    let Object1: any[] = [];
    let Object2: any[] = [];
    let data;
    mainDataResult.data.forEach((item: any, index: number) => {
      if (!selectedState[item[DATA_ITEM_KEY]]) {
        newData.push(item);
        Object2.push(index);
      } else {
        const newData2 = item;
        newData2.rowstatus = "D";
        Object1.push(index);
        deletedRows.push(newData2);
      }
    });

    if (Math.min(...Object1) < Math.min(...Object2)) {
      data = mainDataResult.data[Math.min(...Object2)];
    } else {
      data = mainDataResult.data[Math.min(...Object1) - 1];
    }

    //newData 생성
    setMainDataResult((prev) => ({
      data: newData,
      total: prev.total - Object1.length,
    }));
    setSelectedState({
      [data != undefined ? data[DATA_ITEM_KEY] : newData[0]]: true,
    });
  };

  const onSaveClick = () => {
    type TRowsArr = {
      row_status: string[];
      sub_code_s: string[];
      code_name_s: string[];
      use_yn_s: string[];
      memo_s: string[];
    };

    let rowsArr: TRowsArr = {
      row_status: [],
      sub_code_s: [],
      code_name_s: [],
      use_yn_s: [],
      memo_s: [],
    };

    const dataItem = mainDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    dataItem.forEach((item: any) => {
      const { rowstatus, code, name, use_yn, remark } = item;

      rowsArr.row_status.push(rowstatus);
      rowsArr.sub_code_s.push(code);
      rowsArr.code_name_s.push(name);
      rowsArr.memo_s.push(remark);
      rowsArr.use_yn_s.push(
        use_yn == true ? "Y" : use_yn == false ? "N" : use_yn
      );
    });

    deletedRows.forEach((item: any) => {
      const { rowstatus, code, name, use_yn, remark } = item;

      rowsArr.row_status.push(rowstatus);
      rowsArr.sub_code_s.push(code);
      rowsArr.code_name_s.push(name);
      rowsArr.memo_s.push(remark);
      rowsArr.use_yn_s.push(
        use_yn == true ? "Y" : use_yn == false ? "N" : use_yn
      );
    });
    setParaData((item) => ({
      ...item,
      sub_code: rowsArr.sub_code_s.join("|"),
      sub_code_name: rowsArr.code_name_s.join("|"),
      sub_use_yn: rowsArr.use_yn_s.join("|"),
      sub_memo: rowsArr.memo_s.join("|"),
      row_status: rowsArr.row_status.join("|"),
    }));
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "value_code",
    sub_code: "",
    sub_code_name: "",
    sub_use_yn: "",
    sub_memo: "",
    row_status: "",
  });

  useEffect(() => {
    if (paraData.row_status != "") fetchToSave();
  }, [paraData]);

  const para: Iparameters = {
    procedureName: "pw6_sav_project_master",
    pageNumber: 1,
    pageSize: 10,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_devmngnum": "",
      "@p_custcd": "",
      "@p_number": 0,
      "@p_project": "",
      "@p_recdt": "",
      "@p_cotracdt": "",
      "@p_finexpdt": "",
      "@p_compl_chk_date": "",
      "@p_findt": "",
      "@p_pjtmanager": "",
      "@p_pjtperson": "",
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_midchkdt": "",
      "@p_finchkdt": "",
      "@p_progress_status": "",
      "@p_revperson": "",
      "@p_lvl": "",
      "@p_row_status": paraData.row_status,
      "@p_devmngseq_s": "",
      "@p_pgmid_s": "",
      "@p_pgmnm_s": "",
      "@p_value_code3_s": "",
      "@p_devdiv_s": "",
      "@p_prgrate_s": "",
      "@p_listyn_s": "",
      "@p_lvl_s": "",
      "@p_modrate_s": "",
      "@p_fnscore_s": "",
      "@p_exptime_s": "",

      "@p_devperson_s": "",
      "@p_devstrdt_s": "",
      "@p_finexpdt_s": "",
      "@p_findt_s": "",
      "@p_chkperson_s": "",
      "@p_chkdt_s": "",
      "@p_finamt_s": "",
      "@p_discscore_s": "",
      "@p_remark_s": "",
      "@p_useyn_s": "",

      "@p_DesignEstTime_s": "",
      "@p_DesignExphh_s": "",
      "@p_DesignExpmm_s": "",
      "@p_DesignStartDate_s": "",
      "@p_DesignEndEstDate_s": "",
      "@p_DesignEndDate_s": "",
      "@p_CustCheckDate_s": "",
      "@p_CustSignyn_s": "",
      "@p_indicator_s": "",
      "@p_CustPerson_s": "",

      /* CR508T */
      "@p_guid": "",
      "@p_sort_order": "",
      "@p_date": "",
      "@p_title": "",
      "@p_finyn": "",
      "@p_is_monitoring": "",

      "@p_id": userId,
      "@p_pc": pc,

      "@p_sub_code": paraData.sub_code,
      "@p_sub_code_name": paraData.sub_code_name,
      "@p_sub_use_yn": paraData.sub_use_yn,
      "@p_sub_memo": paraData.sub_memo,
    },
  };

  const fetchToSave = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      deletedRows = [];
      setParaData({
        work_type: "value_code",
        sub_code: "",
        sub_code_name: "",
        sub_use_yn: "",
        sub_memo: "",
        row_status: "",
      });

      if (
        paraData.row_status.includes("N") ||
        paraData.row_status.includes("U")
      ) {
        setFilters((prev) => ({
          ...prev,
          find_row_value: data.returnString,
          isSearch: true,
        }));
      } else {
        const datas = mainDataResult.data.filter(
          (item) =>
            item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        )[0];
        if (datas != undefined) {
          setFilters((prev) => ({
            ...prev,
            find_row_value: datas.code,
            isSearch: true,
          }));
        } else {
          setFilters((prev) => ({
            ...prev,
            find_row_value: "",
            isSearch: true,
          }));
        }
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert(data.resultMessage);
    }
    setLoading(false);
    paraData.row_status = "";
  };

  return (
    <Window
      titles={"Value 구분 항목 관리"}
      positions={position}
      Close={onClose}
      onChangePostion={onChangePostion}
      modals={true}
    >
      <TitleContainer className="WindowTitleContainer">
        <ButtonContainer>
          <Button onClick={() => search()} icon="search" themeColor={"primary"}>
            조회
          </Button>
        </ButtonContainer>
      </TitleContainer>
      <WindowFilterContainer>
        <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
          <tbody>
            <tr>
              <th>코드</th>
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
              <th>코드명</th>
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
      </WindowFilterContainer>
      <GridContainer height={`${isMobile? mobileheight : webheight}px`}>
        <GridTitleContainer className="ButtonContainer">
          <ButtonContainer>
            <Button
              onClick={onAddClick}
              themeColor={"primary"}
              icon="plus"
              title="행 추가"
            ></Button>
            <Button
              onClick={onRemoveClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="minus"
              title="행 삭제"
            ></Button>
            <Button
              onClick={onSaveClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="save"
              title="저장"
            ></Button>
          </ButtonContainer>
        </GridTitleContainer>
        <Grid
          style={{ height: isMobile ? mobileheight2 : webheight2 }}
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
          ref={gridRef}
          //정렬기능
          sortable={true}
          onSortChange={onMainSortChange}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
          //더블클릭
          onItemChange={onMainItemChange}
          cellRender={customCellRender}
          rowRender={customRowRender}
          editField={EDIT_FIELD}
        >
          <GridColumn field="rowstatus" title=" " width="45px" />
          <GridColumn
            field="code"
            title="코드"
            width="200px"
            footerCell={mainTotalFooterCell}
          />
          <GridColumn field="name" title="코드명" width="200px" />
          <GridColumn
            field="use_yn"
            title="사용여부"
            width="100px"
            cell={CheckBoxCell}
          />
          <GridColumn field="remark" title="비고" />
        </Grid>
      </GridContainer>
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default KendoWindow;
