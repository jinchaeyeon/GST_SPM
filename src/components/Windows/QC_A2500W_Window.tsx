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
  toDate,
  convertDateToStr,
  getGridItemChangedData,
  dateformat,
  isValidDate,
  findMessage,
} from "../CommonFunction";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { DatePicker } from "@progress/kendo-react-dateinputs";
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
  basicdata? : Idata2;
};

type Idata = {
  attdatnum: string;
  baddt: string;
  badnum: string;
  badseq: number;
  causedcd: string;
  contents: string;
  crsdiv1: string;
  custcd: string;
  custnm: string;
  datnum: string;
  errtext: string;
  files: string;
  itemcd: string;
  itemnm: string;
  lotnum: string;
  orgdiv: string;
  person: string;
  proccd: string;
  protext: string;
  qcdt: string;
  qty: number;
  recdt: string;
  renum: string;
  reseq: number;
  title: string;
};

type Idata2 = {
  itemcd: string;
  itemnm: string;
  proccd: string;
  qty: number;
  badnum: string;
  badseq: number;
  renum: string;
  reseq: number;
  baddt: string;
};

const CopyWindow = ({
  workType,
  data,
  setVisible,
  setData,
  reload,
  basicdata,
}: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1600,
    height: 700,
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
        causedcd: defaultOption.find((item: any) => item.id === "causedcd")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  useEffect(() => {
    
  }, [reload]);

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [isInitSearch, setIsInitSearch] = useState(false);
  const [mainPgNum, setMainPgNum] = useState(1);
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);
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

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };
  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
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
    datnum: "",
    attdatnum: "",
    baddt: new Date(),
    badnum: "",
    badseq: 0,
    causedcd: "",
    contents: "",
    crsdiv1: "",
    custcd: "",
    custnm: "",
    errtext: "",
    files: "",
    itemcd: "",
    itemnm: "",
    lotnum: "",
    person: "admin",
    proccd: "",
    protext: "",
    qcdt:new Date(),
    qty: 0,
    recdt: new Date(),
    renum: "",
    reseq: 0,
    title: "",
  });

  useEffect(() => {
    if (workType === "U" && data != undefined) {
      setFilters((prev) => ({
        ...prev,
        workType: workType,
        orgdiv: "01",
        location: "01",
        datnum: data.datnum,
        attdatnum: data.attdatnum,
        baddt: toDate(data.baddt),
        badnum: data.badnum,
        badseq: data.badseq,
        causedcd: data.causedcd,
        contents: data.contents,
        crsdiv1: data.crsdiv1,
        custcd: data.custcd,
        custnm: data.custnm,
        errtext: data.errtext,
        files: data.files,
        itemcd: data.itemcd,
        itemnm: data.itemnm,
        lotnum: data.lotnum,
        person: data.person,
        proccd: data.proccd,
        protext: data.protext,
        qcdt: toDate(data.qcdt),
        qty: data.qty,
        recdt: toDate(data.recdt),
        renum: data.renum,
        reseq: data.reseq,
        title: data.title,
      }));
    } else if(workType === "N" && basicdata != undefined){
      setFilters((prev) => ({
        ...prev,
        workType: workType,
        itemcd: basicdata.itemcd,
        itemnm: basicdata.itemnm,
        proccd: basicdata.proccd,
        qty: basicdata.qty,
        badnum: basicdata.badnum,
        badseq: basicdata.badseq,
        renum: basicdata.renum,
        reseq: basicdata.reseq,
        baddt: toDate(basicdata.baddt),
      }));
    }
  }, []);

  const getAttachmentsData = (data: IAttachmentData) => {
    setFilters((prev: any) => {
      return {
        ...prev,
        attdatnum: data.attdatnum,
        files:
          data.original_name +
          (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      };
    });
  };


  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    var parts = mainDataResult.total.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총{" "}
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
        건
      </td>
    );
  };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  // 부모로 데이터 전달, 창 닫기 (그리드 인라인 오픈 제외)
  const selectData = (selectedData: any) => {
    let valid = true;
    try {
    if (
        convertDateToStr(filters.qcdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.qcdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.qcdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.qcdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "QC_A2500W_001");
      } else if (
        filters.causedcd == null ||
        filters.causedcd == "" ||
        filters.causedcd == undefined
      ) {
        throw findMessage(messagesData, "QC_A2500W_002");
      } else {
        if (valid == true) {
          setData(filters);
          if (workType == "N") {
            onClose();
          }
        }
      }
    } catch (e) {
      alert(e);
    }
  };

  return (
    <>
      <Window
        title={workType === "N" ? "NCR생성" : "NCR정보"}
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
                <th>NCR NO</th>
                <td>
                  <Input
                    name="datnum"
                    type="text"
                    value={filters.datnum}
                    className="readonly"
                  />
                </td>
                <th>작성일</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="recdt"
                      value={filters.recdt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>조치일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="qcdt"
                      value={filters.qcdt}
                      format="yyyy-MM-dd"
                      className="required"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>불량원인</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="causedcd"
                      value={filters.causedcd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                      className="required"
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>업체코드</th>
                <td>
                  <Input
                    name="custcd"
                    type="text"
                    value={filters.custcd}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput>
                    <Button
                      onClick={onCustWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
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
                <th>불량일자</th>
                <td>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="baddt"
                      value={filters.baddt}
                      format="yyyy-MM-dd"
                      onChange={filterInputChange}
                      placeholder=""
                    />
                  </div>
                </td>
                <th>공정</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="proccd"
                      value={filters.proccd}
                      customOptionData={customOptionData}
                      changeData={filterComboBoxChange}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>품목코드</th>
                <td>
                  <Input
                    name="itemcd"
                    type="text"
                    value={filters.itemcd}
                    onChange={filterInputChange}
                  />
                  <ButtonInInput>
                    <Button
                      onClick={onItemWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </td>
                <th>품목명</th>
                <td>
                  <Input
                    name="itemnm"
                    type="text"
                    value={filters.itemnm}
                    onChange={filterInputChange}
                  />
                </td>
                <th>수량</th>
                <td>
                  <Input
                    name="qty"
                    type="number"
                    value={filters.qty}
                    onChange={filterInputChange}
                  />
                </td>
                <th>LOT NO</th>
                <td>
                  <Input
                    name="lotnum"
                    type="text"
                    value={filters.lotnum}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>제목</th>
                <td colSpan={7}>
                  <Input
                    name="title"
                    type="text"
                    value={filters.title}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>부적합내용</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.contents}
                    name="contents"
                    rows={3}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>부적합원인</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.errtext}
                    name="errtext"
                    rows={3}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>즉시조치</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.protext}
                    name="protext"
                    rows={3}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>유효성확인</th>
                <td colSpan={7}>
                  <TextArea
                    value={filters.crsdiv1}
                    name="crsdiv1"
                    rows={3}
                    onChange={filterInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>첨부번호</th>
                <td colSpan={7}>
                  <Input
                    name="files"
                    type="text"
                    value={filters.files}
                    className="readonly"
                  />
                  <ButtonInInput>
                    <Button
                      type={"button"}
                      onClick={onAttachmentsWndClick}
                      icon="more-horizontal"
                      fillMode="flat"
                    />
                  </ButtonInInput>
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
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
       {itemWindowVisible && (
        <ItemsWindow
          workType={"FILTER"}
          setVisible={setItemWindowVisible}
          setData={setItemData}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={filters.attdatnum}
        />
      )}
    </>
  );
};

export default CopyWindow;
