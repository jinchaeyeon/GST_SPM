import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridFooterCellProps,
  GridItemChangeEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { SignatureChangeEvent } from "@progress/kendo-react-inputs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import { Iparameters } from "../../../store/types";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";
import {
  getGridItemChangedData,
  getHeight,
  getWindowDeviceHeight,
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../../CommonFunction";
import { EDIT_FIELD, PAGE_SIZE, SELECTED_FIELD } from "../../CommonString";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import RequiredHeader from "../../RequiredHeader";
import Sign from "../../Sign/Sign";
import Window from "../WindowComponent/Window";

let deletedMainRows: any[] = [];
let temp = 0;

var index = 0;

var height3 = 0;
var height6 = 0;

type IWindow = {
  setVisible(t: boolean): void;
  reference_key: string;
};
const topHeight = 10;
const bottomHeight = 55;
const leftOverHeight = (topHeight + bottomHeight) / 2;
let targetRowIndex: null | number = null;
const SignWindow = ({ setVisible, reference_key }: IWindow) => {
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");

  const [loginResult] = useRecoilState(loginResultState);
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN";

  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;

  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 1050) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 800) / 2,
    width: isMobile == true ? deviceWidth : 1050,
    height: isMobile == true ? deviceHeight : 800,
  });

  const DATA_ITEM_KEY = "num";
  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [swiper, setSwiper] = useState<SwiperCore>();

  useLayoutEffect(() => {
    height3 = getHeight(".k-window-titlebar");
    height6 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) - height3 - height6
    );
    setMobileHeight2(
      getWindowDeviceHeight(false, deviceHeight) - height3 - height6
    );
    setWebHeight(
      (getWindowDeviceHeight(false, position.height) - height3 - height6) / 2
    );
    setWebHeight2(
      (getWindowDeviceHeight(false, position.height) - height3 - height6) / 2
    );
  }, [position.height, webheight, webheight2]);

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      (getWindowDeviceHeight(false, position.height) - height3 - height6) / 2
    );
    setWebHeight2(
      (getWindowDeviceHeight(false, position.height) - height3 - height6) / 2
    );
  };

  const onClose = () => {
    deletedMainRows = [];
    setVisible(false);
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
  const [filters, setFilters] = useState({
    reference_key: reference_key != undefined ? reference_key : "",
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
      procedureName: "pw6_sel_check_signature",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "attendees",
        "@p_reference_key": filters.reference_key,
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
        rowstatus:
          item.rowstatus == null ||
          item.rowstatus == "" ||
          item.rowstatus == undefined
            ? ""
            : item.rowstatus,
        signature:
          item.signature == "" ? "" : "data:image/png;base64," + item.signature,
      }));

      if (filters.find_row_value !== "") {
        // find_row_value 행으로 스크롤 이동
        if (gridRef.current) {
          const findRowIndex = rows.findIndex(
            (row: any) =>
              row.reference_key + "_" + row.seq == filters.find_row_value
          );
          targetRowIndex = findRowIndex;
        }
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
            : rows.find(
                (row: any) =>
                  row.reference_key + "_" + row.seq == filters.find_row_value
              );

        if (selectedRow != undefined) {
          setSelectedState({ [selectedRow[DATA_ITEM_KEY]]: true });
        } else {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
        }
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
            rowstatus: item.rowstatus == "N" ? item.rowstatus : "U",
            signature:
              item.is_lock == true || item.is_lock == "Y"
                ? item.signature
                : information.sign,
          }
        : {
            ...item,
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
  }, [information]);

  const enterEdit3 = (dataItem: any, field: string) => {
    if (
      field != "rowstatus" &&
      !(dataItem.is_lock == "Y" || dataItem.is_lock == true)
    ) {
      let valid = true;
      if (field == "is_lock" && isAdmin == false) {
        valid = false;
      }
      if (valid == true) {
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
    } else {
      setTempResult((prev) => {
        return {
          data: mainDataResult.data,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit3 = () => {
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

  const onDeleteClick = (e: any) => {
    if (mainDataResult.data.length > 0) {
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
            deletedMainRows.push(newData2);
            Object1.push(index);
            deletedMainRows.push(newData2);
          }
        });

        if (Math.min(...Object1) < Math.min(...Object2)) {
          data = mainDataResult.data[Math.min(...Object2)];
        } else {
          data = mainDataResult.data[Math.min(...Object1) - 1];
        }

        setMainDataResult((prev) => ({
          data: newData,
          total: prev.total - Object.length,
        }));
        setSelectedState({
          [data != undefined ? data[DATA_ITEM_KEY] : newData[0]]: true,
        });
      }
    }
  };

  const onAddClick = () => {
    mainDataResult.data.map((item) => {
      if (item.num > temp) {
        temp = item.num;
      }
    });

    const newDataItem = {
      [DATA_ITEM_KEY]: ++temp,
      is_lock: "N",
      rowstatus: "N",
      reference_key: reference_key,
      seq: 0,
      name: "",
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
    if (!navigator.onLine) {
      alert("네트워크 연결상태를 확인해주세요.");
      setLoading(false);
      return false;
    }

    const dataItem = mainDataResult.data.filter((item: any) => {
      return item.rowstatus === "N" && item.rowstatus !== undefined;
    });
    const dataItem2 = mainDataResult.data.filter((item: any) => {
      return item.rowstatus === "U" && item.rowstatus !== undefined;
    });
    if (
      dataItem.length === 0 &&
      dataItem2.length === 0 &&
      deletedMainRows.length === 0
    )
      return false;

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
          procedureName: "pw6_sav_check_signature",
          pageNumber: 1,
          pageSize: 10,
          parameters: {
            "@p_work_type": "D",
            "@p_reference_key": item.reference_key,
            "@p_seq": item.seq,
            "@p_part": "",
            "@p_name": "",
            "@p_signature": "",
            "@p_remarks": "",
            "@p_is_lock": "",
            "@p_form_id": "SPM WEB",
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
          const isLastDataDeleted =
            mainDataResult.data.length == 0 && filters.pgNum > 1;
          if (isLastDataDeleted) {
            setFilters((prev) => ({
              ...prev,
              find_row_value: "",
              pgNum: prev.pgNum,
              isSearch: true,
            }));
          } else {
            const datas = mainDataResult.data.filter(
              (item) =>
                item[DATA_ITEM_KEY] ==
                Object.getOwnPropertyNames(selectedState)[0]
            )[0];
            setFilters((prev) => ({
              ...prev,
              find_row_value: datas != undefined ? data.returnString : "",
              pgNum: prev.pgNum,
              isSearch: true,
            }));
          }
        }
      }

      deletedMainRows = [];

      for (const item of dataItem2) {
        const para: Iparameters = {
          procedureName: "pw6_sav_check_signature",
          pageNumber: 1,
          pageSize: 10,
          parameters: {
            "@p_work_type": "U",
            "@p_reference_key": item.reference_key,
            "@p_seq": item.seq,
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
            "@p_form_id": "SPM WEB",
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
          const datas = mainDataResult.data.filter(
            (item) =>
              item[DATA_ITEM_KEY] ==
              Object.getOwnPropertyNames(selectedState)[0]
          )[0];
          setFilters((prev) => ({
            ...prev,
            find_row_value: datas != undefined ? data.returnString : "",
            isSearch: true,
          }));
        }
      }

      for (const item of dataItem) {
        const para: Iparameters = {
          procedureName: "pw6_sav_check_signature",
          pageNumber: 1,
          pageSize: 10,
          parameters: {
            "@p_work_type": "N",
            "@p_reference_key": item.reference_key,
            "@p_seq": item.seq,
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
            "@p_form_id": "SPM WEB",
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
          const datas = mainDataResult.data.filter(
            (item) =>
              item[DATA_ITEM_KEY] ==
              Object.getOwnPropertyNames(selectedState)[0]
          )[0];
          setFilters((prev) => ({
            ...prev,
            find_row_value: datas != undefined ? data.returnString : "",
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
      titles={"미팅 참석자 등록"}
      positions={position}
      Close={onClose}
      modals={true}
      onChangePostion={onChangePostion}
    >
      {isMobile ? (
        <Swiper
          onSwiper={(swiper) => {
            setSwiper(swiper);
          }}
          onActiveIndexChange={(swiper) => {
            index = swiper.activeIndex;
          }}
        >
          <SwiperSlide key={0}>
            <GridContainer height={`${mobileheight}px`}>
              <GridTitleContainer>
                <GridTitle>
                  참석자
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-right"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(1);
                      }
                    }}
                  ></Button>
                </GridTitle>
                <ButtonContainer>
                  <Button
                    onClick={onAddClick}
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
                style={{ height: "100%" }}
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
                //스크롤 조회기능
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
          </SwiperSlide>
          <SwiperSlide key={1}>
            <GridContainer height={`${mobileheight2}px`}>
              <GridTitleContainer>
                <GridTitle>
                  <Button
                    themeColor={"primary"}
                    fillMode={"flat"}
                    icon={"chevron-left"}
                    onClick={() => {
                      if (swiper) {
                        swiper.slideTo(0);
                      }
                    }}
                  ></Button>
                  서명란
                </GridTitle>
              </GridTitleContainer>
              <Sign
                value={
                  mainDataResult.data.filter(
                    (item) =>
                      item.num == Object.getOwnPropertyNames(selectedState)[0]
                  )[0] == undefined
                    ? ""
                    : mainDataResult.data.filter(
                        (item) =>
                          item.num ==
                          Object.getOwnPropertyNames(selectedState)[0]
                      )[0].signature
                }
                disabled={
                  mainDataResult.data.filter(
                    (item) =>
                      item.num == Object.getOwnPropertyNames(selectedState)[0]
                  )[0] == undefined
                    ? true
                    : mainDataResult.data.filter(
                        (item) =>
                          item.num ==
                          Object.getOwnPropertyNames(selectedState)[0]
                      )[0].is_lock == "Y" ||
                      mainDataResult.data.filter(
                        (item) =>
                          item.num ==
                          Object.getOwnPropertyNames(selectedState)[0]
                      )[0].is_lock == true
                    ? true
                    : false
                }
                onChange={changeSign}
              />
            </GridContainer>
          </SwiperSlide>
        </Swiper>
      ) : (
        <>
          <GridContainer height={`${webheight}px`}>
            <GridTitleContainer>
              <GridTitle>참석자</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onAddClick}
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
              style={{ height: "100%" }}
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
              //스크롤 조회기능
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
          <GridContainer height={`${webheight2}px`}>
            <GridTitleContainer>
              <GridTitle>서명란</GridTitle>
            </GridTitleContainer>
            <Sign
              value={
                mainDataResult.data.filter(
                  (item) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0] == undefined
                  ? ""
                  : mainDataResult.data.filter(
                      (item) =>
                        item.num == Object.getOwnPropertyNames(selectedState)[0]
                    )[0].signature
              }
              disabled={
                mainDataResult.data.filter(
                  (item) =>
                    item.num == Object.getOwnPropertyNames(selectedState)[0]
                )[0] == undefined
                  ? true
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
        </>
      )}
      <BottomContainer
        className="BottomContainer"
        style={
          isMobile
            ? {
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }
            : undefined
        }
      >
        <div
          style={{
            float: "left",
            paddingTop: "10px",
            width: isMobile ? " 100%" : "70%",
          }}
        >
          ※ 회의(교육) 내용의 보다 정확한 보관 및 기록을 위하여 녹음되고 있음을
          안내드립니다.
        </div>
        <div
          style={
            isMobile
              ? { float: "right", marginTop: "auto", width: "100%" }
              : undefined
          }
        >
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={onSave}>
              확인
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </div>
      </BottomContainer>
    </Window>
  );
};

export default SignWindow;
