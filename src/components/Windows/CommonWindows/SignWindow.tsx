import { useEffect, useState, useCallback, useRef } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
  GridPageChangeEvent,
} from "@progress/kendo-react-grid";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { Iparameters } from "../../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import {
  UseBizComponent,
  UseParaPc,
  UseGetValueFromSessionItem,
  UseMessages,
} from "../../CommonFunction";
import { IWindowPosition } from "../../../hooks/interfaces";
import {
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
  COM_CODE_DEFAULT_VALUE,
} from "../../CommonString";
import {
  getGridItemChangedData,
  getQueryFromBizComponent,
} from "../../CommonFunction";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { bytesToBase64 } from "byte-base64";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../../../store/atoms";
import Sign from "../../Sign/Sign";
import { SignatureChangeEvent } from "@progress/kendo-react-inputs";
import RequiredHeader from "../../RequiredHeader";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";

let deletedMainRows: any[] = [];

type IWindow = {
  setVisible(t: boolean): void;
  number: string;
};
const topHeight = 10;
const bottomHeight = 55;
const leftOverHeight = (topHeight + bottomHeight) / 2;
let targetRowIndex: null | number = null;
const SignWindow = ({ setVisible, number }: IWindow) => {
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");

  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const [page, setPage] = useState(initialPageState);

  const [loginResult] = useRecoilState(loginResultState);
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN";

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setFilters((prev) => ({
      ...prev,
      pgNum: page.skip / page.take + 1,
      isSearch: true,
    }));

    setPage({
      ...event.page,
    });
  };

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1050,
    height: 800,
  });
  const DATA_ITEM_KEY = "num";
  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [filters, setFilters] = useState({
    orgdiv: "01",
    meetingnum: number != undefined ? number : "",
    isSearch: true,
    find_row_value: "",
    pgSize: PAGE_SIZE,
    pgNum: 1,
  });

  const [information, setInformation] = useState({
    sign: "",
  });

  const gridRef = useRef<any>(null);
  //그리드 조회
  const fetchMainGrid = async (filters: any) => {
    let data: any;
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_meeting",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "attendees",
        "@p_orgdiv": filters.orgdiv,
        "@p_meetingnum": filters.meetingnum,
        "@p_from_date": "",
        "@p_to_date": "",
        "@p_custcd": "",
        "@p_custnm": "",
        "@p_contents": "",
        "@p_find_row_value": filters.find_row_value,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((item: any) => ({
        ...item,
        signature:
          item.signature == "" ? "" : "data:image/png;base64," + item.signature,
      }));
 
      if (filters.find_row_value !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef.current) {
          const findRowIndex = rows.findIndex(
            (row: any) =>
              (row.meetingnum + "_" + (row.meetingseq).toString()) == filters.find_row_value
          );
          targetRowIndex = findRowIndex;
        }

        // find_row_value 데이터가 존재하는 페이지로 설정
        setPage({
          skip: PAGE_SIZE * (data.pageNumber - 1),
          take: PAGE_SIZE,
        });
      } else {
        // 첫번째 행으로 스크롤 이동
        if (gridRef.current) {
          targetRowIndex = 0;
        }
      }
      setMainDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });
      if (totalRowCnt > 0) {
        const selectedRow =
          filters.find_row_value == ""
            ? rows[0]
            : rows.find(
                (row: any) =>
                (row.meetingnum + "_" + (row.meetingseq).toString()) == filters.find_row_value
              );

        setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    // 필터 isSearch false처리, pgNum 세팅
    setFilters((prev) => ({
      ...prev,
      pgNum:
        data && data.hasOwnProperty("pageNumber")
          ? data.pageNumber
          : prev.pgNum,
      isSearch: false,
    }));
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
  }, [filters]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (targetRowIndex !== null && gridRef.current) {
      gridRef.current.scrollIntoView({ rowIndex: targetRowIndex });
      targetRowIndex = null;
    }
  }, [mainDataResult]);

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
  const onMainItemChange3 = (event: GridItemChangeEvent) => {
    setMainDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const customCellRender3 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit3}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender3 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit3}
      editField={EDIT_FIELD}
    />
  );

  const changeSign = (e: SignatureChangeEvent) => {
    setInformation({
      sign: e.value,
    });
  };

  useEffect(() => {
    const newData = mainDataResult.data.map((item) =>
      item[DATA_ITEM_KEY] == Object.getOwnPropertyNames(selectedState)[0]
        ? {
            ...item,
            rowstatus:
              item.is_lock == true || item.is_lock == "Y"
                ? ""
                : item.rowstatus === "N"
                ? "N"
                : "U",
            signature:
              item.is_lock == true || item.is_lock == "Y"
                ? item.signature
                : information.sign,
          }
        : {
            ...item,
          }
    );

    setMainDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  }, [information]);

  const enterEdit3 = (dataItem: any, field: string) => {
    if (field != "rowstatus" && !(dataItem.is_lock == "Y" || dataItem.is_lock == true)) {
      let valid = true;
      if (field == "is_lock" && isAdmin == false) {
        valid = false;
      }
      if (valid == true) {
        const newData = mainDataResult.data.map((item) =>
          item[DATA_ITEM_KEY] === dataItem[DATA_ITEM_KEY]
            ? {
                ...item,
                rowstatus: item.rowstatus === "N" ? "N" : "U",
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
    }
  };

  const exitEdit3 = () => {
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

  const onDeleteClick = (e: any) => {
    if (
      mainDataResult.data.filter(
        (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
      )[0].is_lock == "Y" ||
      mainDataResult.data.filter(
        (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
      )[0].is_lock == true
    ) {
      alert("해당 행은 수정 잠금이 설정되어있습니다. ");
    } else {
      let newData: any[] = [];
      let Object: any[] = [];
      let Object2: any[] = [];
      let data;

      mainDataResult.data.forEach((item: any, index: number) => {
        if (!selectedState[item[DATA_ITEM_KEY]]) {
          newData.push(item);
          Object2.push(index);
        } else {
          const newData2 = {
            ...item,
            rowstatus: "D",
          };
          Object.push(index);
          deletedMainRows.push(newData2);
        }
      });

      if (Math.min(...Object) < Math.min(...Object2)) {
        data = mainDataResult.data[Math.min(...Object2)];
      } else {
        data = mainDataResult.data[Math.min(...Object) - 1];
      }
      const isLastDataDeleted =
        mainDataResult.data.length === 1 && filters.pgNum > 1;

      if (isLastDataDeleted) {
        setPage({
          skip: PAGE_SIZE * (filters.pgNum - 2),
          take: PAGE_SIZE,
        });
      }

      setMainDataResult((prev) => ({
        data: newData,
        total: newData.length,
      }));
      setSelectedState({
        [data != undefined ? data[DATA_ITEM_KEY] : newData[0]]: true,
      });
    }
  };

  let maxObjArr = mainDataResult.data.length < 2 ? (mainDataResult.data.length == 1 ? {num: 0} : {num: -1}) : mainDataResult.data.reduce( (prev, value) => {
    return prev.num >= value.num ? prev : value
  });

  const onAddClick = () => {
    const newDataItem = {
      [DATA_ITEM_KEY]: maxObjArr.num + 1,
      is_lock: "N",
      rowstatus: "N",
      meetingnum: number,
      meetingseq: 0,
      name: "",
      orgdiv: "01",
      part: "",
      remarks: "",
      signature: "",
    };
    setSelectedState({ [newDataItem.num]: true });

    setMainDataResult((prev) => {
      return {
        data: [newDataItem, ...prev.data],
        total: prev.total + 1,
      };
    });
  };

  const onSave = async () => {
    const dataItem = mainDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0 && deletedMainRows.length === 0) return false;

    //검증
    let valid = true;

    dataItem.forEach((item: any) => {
      if (!item.name) {
        valid = false;
      }
    });

    if (!valid) {
      alert("필수 항목을 입력해주세요.");
      return false;
    }
    setLoading(true);
    try {
      for (const item of deletedMainRows) {
        const para: Iparameters = {
          procedureName: "pw6_sav_meeting_attendee",
          pageNumber: 1,
          pageSize: 10,
          parameters: {
            "@p_work_type": "D",
            "@p_orgdiv": item.orgdiv,
            "@p_meetingnum": item.meetingnum,
            "@p_meetingseq": item.meetingseq,
            "@p_part": "",
            "@p_name": "",
            "@p_signature": "",
            "@p_remarks": "",
            "@p_is_lock": "",
            "@p_form_id": "pw6_sav_meeting_attendee",
            "@p_id": userId,
            "@p_pc": pc,
          },
        };

        let data: any;

        try {
          data = await processApi<any>("procedure", para);
        } catch (error) {
          data = null;
        }

        if (data.isSuccess !== true) {
          console.log("[오류 발생]");
          console.log(data);
          throw data.resultMessage;
        }
      }

      deletedMainRows = [];

      for (const item of dataItem) {
        const para: Iparameters = {
          procedureName: "pw6_sav_meeting_attendee",
          pageNumber: 1,
          pageSize: 10,
          parameters: {
            "@p_work_type": item.rowstatus,
            "@p_orgdiv": item.orgdiv,
            "@p_meetingnum": item.meetingnum,
            "@p_meetingseq": item.meetingseq,
            "@p_part": item.part,
            "@p_name": item.name,
            "@p_signature":
              item.signature != undefined && item.signature != ""
                ? item.signature.replace("data:image/png;base64,", "")
                : "",
            "@p_remarks": item.remarks,
            "@p_is_lock":
              item.is_lock == true
                ? "Y"
                : item.is_lock == false
                ? "N"
                : item.is_lock,
            "@p_form_id": "pw6_sav_meeting_attendee",
            "@p_id": userId,
            "@p_pc": pc,
          },
        };

        let data: any;

        try {
          data = await processApi<any>("procedure", para);
        } catch (error) {
          data = null;
        }

        if (data.isSuccess !== true) {
          console.log("[오류 발생]");
          console.log(data);
          throw data.resultMessage;
        } else {
          setFilters((prev) => ({
            ...prev,
            find_row_value: data.returnString,
            isSearch: true,
          }));
        }
      }
    } catch (e) {
      alert(e);
    }
    setLoading(false);
  };

  return (
    <Window
      title={"미팅 참석자 등록"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
      <GridContainer height={`calc(50% - ${leftOverHeight}px)`}>
        <GridTitleContainer>
          <GridTitle>참석자</GridTitle>
          <ButtonContainer>
            <Button
              onClick={onAddClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="plus"
              title="행 추가"
            ></Button>
            <Button
              onClick={onDeleteClick}
              fillMode="outline"
              themeColor={"primary"}
              icon="minus"
              title="행 삭제"
            ></Button>
          </ButtonContainer>
        </GridTitleContainer>
        <Grid
          style={{ height: "30vh" }}
          data={process(
            mainDataResult.data.map((row) => ({
              ...row,
              rowstatus:
                row.rowstatus == null ||
                row.rowstatus == "" ||
                row.rowstatus == undefined
                  ? ""
                  : row.rowstatus,
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
          //스크롤 조회기능
          fixedScroll={true}
          total={mainDataResult.total}
          skip={page.skip}
          take={page.take}
          pageable={true}
          onPageChange={pageChange}
          ref={gridRef}
          rowHeight={30}
          //정렬기능
          sortable={true}
          onSortChange={onMainSortChange}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
          //더블클릭
          onItemChange={onMainItemChange3}
          cellRender={customCellRender3}
          rowRender={customRowRender3}
          editField={EDIT_FIELD}
        >
          <GridColumn field="rowstatus" title=" " width="48px" />
          <GridColumn
            field="part"
            title="소속 및 부서"
            width="250px"
            footerCell={mainTotalFooterCell}
          />
          <GridColumn
            field="name"
            title="이름"
            width="200px"
            headerCell={RequiredHeader}
          />
          <GridColumn field="remarks" title="비고" width="350px" />
          <GridColumn
            field="is_lock"
            title="수정 잠금"
            width="150px"
            cell={isAdmin ? CheckBoxCell : CheckBoxReadOnlyCell}
          />
        </Grid>
      </GridContainer>
      <GridContainer height={`calc(50% - ${leftOverHeight}px)`}>
        <GridTitleContainer>
          <GridTitle>서명</GridTitle>
        </GridTitleContainer>
        <Sign
          value={
            mainDataResult.data.filter(
              (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? ""
              : mainDataResult.data.filter(
                  (item) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0].signature
          }
          disabled={
            mainDataResult.data.filter(
              (item) => item.num == Object.getOwnPropertyNames(selectedState)[0]
            )[0] == undefined
              ? false
              : mainDataResult.data.filter(
                  (item) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0].is_lock == "Y" ||
                mainDataResult.data.filter(
                  (item) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0].is_lock == true
              ? true
              : false
          }
          onChange={changeSign}
        />
      </GridContainer>
      <BottomContainer>
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onSave}>
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

export default SignWindow;
