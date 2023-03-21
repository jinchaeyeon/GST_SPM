import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridFooterCellProps,
  GridEvent,
  GridSelectionChangeEvent,
  getSelectedState,
  GridDataStateChangeEvent,
  GridItemChangeEvent,
  GridCellProps,
} from "@progress/kendo-react-grid";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import { TextArea } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import CustomersWindow from "./CommonWindows/CustomersWindow";
import CopyWindow2 from "./MA_A2500W_Order_Window";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  Title,
  TitleContainer,
  ButtonInInput,
  GridTitleContainer,
  FormBoxWrap,
  FormBox,
  GridTitle,
} from "../../CommonStyled";
import { useRecoilState } from "recoil";
import { Input } from "@progress/kendo-react-inputs";
import { Iparameters } from "../../store/types";
import { Button } from "@progress/kendo-react-buttons";
import {
  chkScrollHandler,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  getQueryFromBizComponent,
  UseParaPc,
  convertDateToStrWithTime2,
  convertDateToStr,
  getGridItemChangedData,
  dateformat,
  isValidDate,
  findMessage,
  toDate2,
} from "../CommonFunction";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { DatePicker, DateTimePicker } from "@progress/kendo-react-dateinputs";
import { loginResultState } from "../../store/atoms";
import { IWindowPosition, IAttachmentData } from "../../hooks/interfaces";
import { PAGE_SIZE, SELECTED_FIELD } from "../CommonString";
import { COM_CODE_DEFAULT_VALUE, EDIT_FIELD } from "../CommonString";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../../store/atoms";
import CustomOptionComboBox from "../ComboBoxes/CustomOptionComboBox";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import NumberCell from "../Cells/NumberCell";
import DateCell from "../Cells/DateCell";
import { FormComboBoxCell, FormComboBox } from "../Editors";
import ComboBoxCell from "../Cells/ComboBoxCell";
import { NumberInput } from "adaptivecards";
type IWindow = {
  workType: "N" | "U";
  data?: Idata;
  setVisible(t: boolean): void;
  setData(filter: object): void;
  reload: boolean; //data : 선택한 품목 데이터를 전달하는 함수
  prodmac: Idata2[];
  stopcd: Idata3[];
  prodemp: Idata4[];
};

type Idata = {
  location: string;
  stopnum: string;
  stopcd: string;
  strtime: string;
  endtime: string;
  prodmac: string;
  prodemp: string;
  remark: string;
  losshh: string;
};

type Idata2 = {
  fxfull: string;
  fxcode: string;
};
type Idata3 = {
  sub_code: string;
  code_name: string;
};
type Idata4 = {
  user_name: string;
  user_id: string;
};

const CopyWindow = ({
  workType,
  data,
  setVisible,
  setData,
  reload,
  prodmac,
  stopcd,
  prodemp,
}: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1600,
    height: 350,
  });
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const DATA_ITEM_KEY = "num";

  const idGetter = getter(DATA_ITEM_KEY);
  const setLoading = useSetRecoilState(isLoading);
  //메시지 조회
  const pathname: string = window.location.pathname.replace("/", "");
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //customOptionData 조회 후 디폴트 값 세팅
  useEffect(() => {
    if (customOptionData !== null && workType != "U") {
      const defaultOption = customOptionData.menuCustomDefaultOptions.query;
      setFilters((prev) => ({
        ...prev,
        prodmac: defaultOption.find((item: any) => item.id === "prodmac")
          .valueCode,
          stopcd: defaultOption.find((item: any) => item.id === "stopcd")
          .valueCode,
          prodemp: defaultOption.find((item: any) => item.id === "prodemp")
          .valueCode,  
      }));
    }
  }, [customOptionData]);

  useEffect(() => {}, [reload]);

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

  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const setItemData = (data: IItemData) => {
    setFilters((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      itemnm: data.itemnm,
    }));
  };

  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    location: "01",
    stopnum: "",
    stopcd: "",
    strtime: new Date(),
    endtime: new Date(),
    prodmac: "",
    prodemp: "",
    remark: "",
    losshh: ""
  });

  useEffect(() => {
    if (workType === "U" && data != undefined ) {
      const prodmacs = prodmac.find(
        (item: any) => item.fxfull === data.prodmac
      )?.fxcode;
      const stopcds = stopcd.find(
        (item: any) => item.code_name === data.stopcd
      )?.sub_code;
      const prodemps =prodemp.find(
        (item: any) => item.user_name === data.prodemp
      )?.user_id;
      setFilters((prev) => ({
        ...prev,
        workType: workType,
        orgdiv: "01",
        location: data.location,
        stopnum: data.stopnum,
        strtime: toDate2(data.strtime),
        endtime: toDate2(data.endtime),
        prodmac: prodmacs == undefined ? "" : prodmacs,
        stopcd: stopcds == undefined ? "" : stopcds,
        prodemp: prodemps == undefined ? "" : prodemps,
        remark: data.remark,
        losshh: data.losshh,
      }));
    }
  }, []);
 
  // 부모로 데이터 전달, 창 닫기 (그리드 인라인 오픈 제외)
  const selectData = (selectedData: any) => {
    setData(filters);
    if (workType == "N") {
      onClose();
    }
  };

  return (
    <>
      <Window
        title={workType === "N" ? "비가동관리생성" : "비가동관리정보"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
      >
        <FormBoxWrap style={{ paddingRight: "50px" }}>
          <FormBox>
            <tbody>
              <tr>
                <th>비가동번호</th>
                <td>
                  <Input
                    name="stopnum"
                    type="text"
                    value={filters.stopnum}
                    className="readonly"
                  />
                </td>
                <th>설비</th>
                <td colSpan={3}>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="prodmac"
                      value={filters.prodmac}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      textField="fxfull"
                      valueField="fxcode"
                    />
                  )}
                </td>
                <th>비가동유형</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="stopcd"
                      value={filters.stopcd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>비가동시작</th>
                <td>
                  <div className="filter-item-wrap">
                    <DateTimePicker
                      name="strtime"
                      value={filters.strtime}
                      format="yyyy-MM-dd HH:mm:dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>비가동종료</th>
                <td>
                  <div className="filter-item-wrap">
                    <DateTimePicker
                      name="endtime"
                      value={filters.endtime}
                      format="yyyy-MM-dd HH:mm:dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>비가동시간</th>
                <td>
                  <Input
                    name="losshh"
                    type="text"
                    value={filters.losshh}
                    className="readonly"
                  />
                </td>
                <th>작업자</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="prodemp"
                      value={filters.prodemp}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      textField="user_name"
                      valueField="user_id"
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>비고</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.remark}
                    name="remark"
                    rows={3}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </FormBox>
        </FormBoxWrap>
        <BottomContainer>
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={selectData}>
              저장
            </Button>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </Window>
    </>
  );
};

export default CopyWindow;
