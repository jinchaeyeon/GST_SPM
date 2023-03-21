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
  GridItemChangeEvent,
  GridCellProps,
} from "@progress/kendo-react-grid";
import { gridList } from "../store/columns/PR_A0060W_C";
import { Checkbox, CheckboxChangeEvent } from "@progress/kendo-react-inputs";
import { TextArea } from "@progress/kendo-react-inputs";
import { IAttachmentData, IWindowPosition } from "../hooks/interfaces";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import CommonRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import BizComponentRadioGroup from "../components/RadioGroups/BizComponentRadioGroup";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { Field } from "@progress/kendo-react-form";
import calculateSize from "calculate-size";
import {
  Title,
  FilterBoxWrap,
  FilterBox,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridTitle,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
  ButtonInInput,
  ButtonInFieldWrap,
  ButtonInField,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import {
  chkScrollHandler,
  convertDateToStr,
  findMessage,
  getQueryFromBizComponent,
  setDefaultDate,
  UseBizComponent,
  UseCustomOption,
  UseMessages,
  UsePermissions,
  handleKeyPressSearch,
  getGridItemChangedData,
  dateformat,
  UseParaPc,
  dateformat2,
  UseGetValueFromSessionItem,
  useSysMessage,
} from "../components/CommonFunction";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
import ComboBoxCell from "../components/Cells/ComboBoxCell";
import CustomersWindow from "../components/Windows/CommonWindows/CustomersWindow";
import ItemsWindow from "../components/Windows/CommonWindows/ItemsWindow";
import DateCell from "../components/Cells/DateCell";
import NumberCell from "../components/Cells/NumberCell";
import {
  COM_CODE_DEFAULT_VALUE,
  PAGE_SIZE,
  SELECTED_FIELD,
  EDIT_FIELD,
} from "../components/CommonString";
import CustomOptionRadioGroup from "../components/RadioGroups/CustomOptionRadioGroup";
import CustomOptionComboBox from "../components/ComboBoxes/CustomOptionComboBox";
import TopButtons from "../components/TopButtons";
import { bytesToBase64 } from "byte-base64";
import { useSetRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import CheckBoxCell from "../components/Cells/CheckBoxCell";
import BizComponentComboBox from "../components/ComboBoxes/BizComponentComboBox";
import { FormReadOnly } from "../components/Editors";
import { filter } from "@progress/kendo-data-query/dist/npm/transducers";
import RequiredHeader from "../components/RequiredHeader";

const DATA_ITEM_KEY = "fxcode";
const SUB_DATA_ITEM_KEY = "fxseq";
let deletedMainRows: any[] = [];

const DateField = ["recdt", "makedt", "indt", "fxdt"];

const NumberField = ["uph", "cnt", "IOT_TER_ID", "fxcost"];

const CheckField = ["useyn"];

const requiredField = ["recdt"];

const editField = ["fxdt"];

const commandField = ["attdatnum"];
const PR_A0060: React.FC = () => {
  const [rows, setrows] = useState<number>(0);
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const userId = UseGetValueFromSessionItem("user_id");
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
        raduseyn: defaultOption.find((item: any) => item.id === "raduseyn")
          .valueCode,
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_PR030,R_USEYN,L_dptcd_001,L_sysUserMaster_001,L_PR010,L_sysUserMaster_004",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [dptcdListData, setdptcdListData] = useState([
    { dptcd: "", dptnm: "" },
  ]);
  const [personListData, setPersonListData] = useState([
    { user_id: "", user_name: "" },
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const dptcdQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_dptcd_001"
        )
      );
      const personQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_004"
        )
      );

      fetchQuery(dptcdQueryStr, setdptcdListData);
      fetchQuery(personQueryStr, setPersonListData);
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
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });

  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [custWindowVisible2, setCustWindowVisible2] = useState<boolean>(false);
  const [custWindowVisible3, setCustWindowVisible3] = useState<boolean>(false);

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [subPgNum, setSubPgNum] = useState(1);
  const [tabSelected, setTabSelected] = React.useState(0);
  const [workType, setWorkType] = useState<string>("U");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const InputChange = (e: any) => {
    const { value, name } = e.target;
    if (value != null) {
      if (name == "useyn") {
        if (value == false || value == "N") {
          setInfomation((prev) => ({
            ...prev,
            [name]: "N",
          }));
        } else {
          setInfomation((prev) => ({
            ...prev,
            [name]: "Y",
          }));
        }
      } else {
        setInfomation((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  const RadioChange = (e: any) => {
    const { name, value } = e;

    setInfomation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const ComboBoxChange = (e: any) => {
    const { name, value } = e;

    setInfomation((prev) => ({
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

  const [infomation, setInfomation] = useState({
    pgSize: PAGE_SIZE,
    workType: "U",
    orgdiv: "01",
    fxcode: "",
    fxdiv: "",
    location: "",
    recdt: new Date(),
    fxnum: "",
    fxnm: "",
    fxno: "",
    spec: "",
    dptcd: "",
    person: "",
    place: "",
    makedt: new Date(),
    maker: "",
    indt: new Date(),
    custcd: "",
    kind: "",
    amt: 0,
    uph: 0,
    classnm1: "",
    classnm2: "",
    classnm3: "",
    remark: "",
    useyn: "Y",
    attdatnum: "",
    proccd: "",
    IOT_TER_ID: 0,
    iotserialno: "",
    attdatnum_img: null,
    custnm: "",
    cnt: 0,
    files: "",
    availabletime: 0,
    viewyn: "",
    insert_form_id: "PR_A0060W",
    update_form_id: "",
    rowstatus_s: "N",
    fxseq_s: 0,
    fxdt_s: new Date(),
    custcd_s: "", //한글
    custnm_s: "",
    errtext_s: "",
    protext_s: "",
    fxcost_s: 0,
    remark1_s: "",
    attdatnum_s: "",
    stdtime_s: 0,
    errcode_s: "",
  });

  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "LIST",
    orgdiv: "01",
    fxcode: "",
    fxnum: "",
    fxnm: "",
    fxno: "",
    raduseyn: "Y",
    custcd: "",
    custnm: "",
    maker: "",
    kind: "",
    classnm1: "",
    classnm2: "",
    classnm3: "",
    custdiv: "",
    position: "",
    location: "01",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_PR_A0060W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_fxcode": filters.fxcode,
      "@p_fxnum": filters.fxnum,
      "@p_fxnm": filters.fxnm,
      "@p_fxno": filters.fxno,
      "@p_useyn": filters.raduseyn,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_maker": filters.maker,
      "@p_kind": filters.kind,
      "@p_classnm1": filters.classnm1,
      "@p_classnm2": filters.classnm2,
      "@p_classnm3": filters.classnm3,
      "@p_position": filters.position,
    },
  };

  const [subfilters, setsubFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "HISTORY",
    orgdiv: "01",
    fxcode: infomation.fxcode,
    fxnum: "",
    fxnm: "",
    fxno: "",
    useyn: "%",
    custcd: "",
    custnm: "",
    maker: "",
    kind: "",
    classnm1: "",
    classnm2: "",
    classnm3: "",
    position: "",
    location: "01",
  });

  //조회조건 파라미터
  const subparameters: Iparameters = {
    procedureName: "P_PR_A0060W_Q",
    pageNumber: subPgNum,
    pageSize: subfilters.pgSize,
    parameters: {
      "@p_work_type": subfilters.workType,
      "@p_orgdiv": subfilters.orgdiv,
      "@p_location": subfilters.location,
      "@p_fxcode": subfilters.fxcode,
      "@p_fxnum": subfilters.fxnum,
      "@p_fxnm": subfilters.fxnm,
      "@p_fxno": subfilters.fxno,
      "@p_useyn": subfilters.useyn,
      "@p_custcd": subfilters.custcd,
      "@p_custnm": subfilters.custnm,
      "@p_maker": subfilters.maker,
      "@p_kind": subfilters.kind,
      "@p_classnm1": subfilters.classnm1,
      "@p_classnm2": subfilters.classnm2,
      "@p_classnm3": subfilters.classnm3,
      "@p_position": subfilters.position,
    },
  };

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    //if (!permissions?.view) return;
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchSubGrid = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", subparameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
        inEdit: "fxdt",
      }));
      if (totalRowCnt > 0) {
        setSubDataResult((prev) => {
          return {
            data: [...prev.data, ...row],
            total: totalRowCnt,
          };
        });
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

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

  useEffect(() => {
    fetchSubGrid();
  }, [subPgNum]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.fxcode]: true });

        setInfomation({
          pgSize: PAGE_SIZE,
          workType: "U",
          orgdiv: firstRowData.orgdiv,
          fxcode: firstRowData.fxcode,
          fxdiv: firstRowData.fxdiv,
          location: firstRowData.location,
          recdt:
            firstRowData.recdt == ""
              ? new Date()
              : new Date(dateformat(firstRowData.recdt)),
          fxnum: firstRowData.fxnum,
          fxnm: firstRowData.fxnm,
          fxno: firstRowData.fxno,
          spec: firstRowData.spec,
          dptcd: firstRowData.dptcd,
          person: firstRowData.person,
          place: firstRowData.place,
          makedt:
            firstRowData.makedt == ""
              ? new Date()
              : new Date(dateformat(firstRowData.makedt)),
          maker: firstRowData.maker,
          indt:
            firstRowData.indt == ""
              ? new Date()
              : new Date(dateformat(firstRowData.indt)),
          custcd: firstRowData.custcd,
          kind: firstRowData.kind,
          amt: firstRowData.amt,
          uph: firstRowData.uph,
          classnm1: firstRowData.classnm1,
          classnm2: firstRowData.classnm2,
          classnm3: firstRowData.classnm3,
          remark: firstRowData.remark,
          useyn: firstRowData.useyn == "Y" ? "Y" : "N",
          attdatnum: firstRowData.attdatnum,
          proccd: firstRowData.proccd,
          IOT_TER_ID: firstRowData.IOT_TER_ID,
          iotserialno: firstRowData.iotserialno,
          attdatnum_img: firstRowData.attdatnum_img,
          custnm: firstRowData.custnm,
          cnt: firstRowData.cnt,
          files: firstRowData.files,
          availabletime: firstRowData.availabletime,
          viewyn: firstRowData.viewyn == "Y" ? "Y" : "N",
          insert_form_id: "PR_A0060W",
          update_form_id: "",
          rowstatus_s: firstRowData.rowstatus_s,
          fxseq_s: firstRowData.fxseq_s,
          fxdt_s:
            firstRowData.fxdt_s == ""
              ? new Date()
              : new Date(dateformat(firstRowData.fxdt_s)),
          custcd_s: firstRowData.custcd_s,
          custnm_s: firstRowData.custnm_s,
          errtext_s: firstRowData.errtext_s,
          protext_s: firstRowData.protext_s,
          fxcost_s: firstRowData.fxcost_s,
          remark1_s: firstRowData.remark1_s,
          attdatnum_s: firstRowData.attdatnum_s,
          stdtime_s: firstRowData.stdtime_s,
          errcode_s: firstRowData.errcode_s,
        });

        setsubFilters((prev) => ({
          ...prev,
          workType: "HISTORY",
          fxcode: firstRowData.fxcode,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
      }
    }
  }, [subDataResult]);

  useEffect(() => {
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subfilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subPgNum]);

  useEffect(() => {
    if (customOptionData !== null) {
      if (tabSelected == 1) {
        fetchSubGrid();
      }
    }
  }, [tabSelected]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
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

    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "U",
      orgdiv: selectedRowData.orgdiv,
      fxcode: selectedRowData.fxcode,
      fxdiv: selectedRowData.fxdiv,
      location: selectedRowData.location,
      recdt:
        selectedRowData.recdt == ""
          ? new Date()
          : new Date(dateformat(selectedRowData.recdt)),
      fxnum: selectedRowData.fxnum,
      fxnm: selectedRowData.fxnm,
      fxno: selectedRowData.fxno,
      spec: selectedRowData.spec,
      dptcd: selectedRowData.dptcd,
      person: selectedRowData.person,
      place: selectedRowData.place,
      makedt:
        selectedRowData.makedt == ""
          ? new Date()
          : new Date(dateformat(selectedRowData.makedt)),
      maker: selectedRowData.maker,
      indt:
        selectedRowData.indt == ""
          ? new Date()
          : new Date(dateformat(selectedRowData.indt)),
      custcd: selectedRowData.custcd,
      kind: selectedRowData.kind,
      amt: selectedRowData.amt,
      uph: selectedRowData.uph,
      classnm1: selectedRowData.classnm1,
      classnm2: selectedRowData.classnm2,
      classnm3: selectedRowData.classnm3,
      remark: selectedRowData.remark,
      useyn: selectedRowData.useyn == "Y" ? "Y" : "N",
      attdatnum: selectedRowData.attdatnum,
      proccd: selectedRowData.proccd,
      IOT_TER_ID: selectedRowData.IOT_TER_ID,
      iotserialno: selectedRowData.iotserialno,
      attdatnum_img: selectedRowData.attdatnum_img,
      custnm: selectedRowData.custnm,
      cnt: selectedRowData.cnt,
      files: selectedRowData.files,
      availabletime: selectedRowData.availabletime,
      viewyn: selectedRowData.viewyn == "Y" ? "Y" : "N",
      insert_form_id: "PR_A0060W",
      update_form_id: "",
      rowstatus_s: selectedRowData.rowstatus_s,
      fxseq_s: selectedRowData.fxseq_s,
      fxdt_s:
        selectedRowData.fxdt_s == ""
          ? new Date()
          : new Date(dateformat(selectedRowData.fxdt_s)),
      custcd_s: selectedRowData.custcd_s,
      custnm_s: selectedRowData.custnm_s,
      errtext_s: selectedRowData.errtext_s,
      protext_s: selectedRowData.protext_s,
      fxcost_s: selectedRowData.fxcost_s,
      remark1_s: selectedRowData.remark1_s,
      attdatnum_s: selectedRowData.attdatnum_s,
      stdtime_s: selectedRowData.stdtime_s,
      errcode_s: selectedRowData.errcode_s,
    });

    setsubFilters((prev) => ({
      ...prev,
      workType: "HISTORY",
      fxcode: selectedRowData.fxcode,
    }));
  };

  const onSubDataSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });

    setSelectedsubDataState(newSelectedState);
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

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  //그리드 푸터
  const mainTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {mainDataResult.total}건
      </td>
    );
  };

  const subTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {subDataResult.total}건
      </td>
    );
  };

  const gridSumQtyFooterCell = (props: GridFooterCellProps) => {
    let sum = 0;
    subDataResult.data.forEach((item) =>
      props.field !== undefined ? (sum += item[props.field]) : ""
    );

    return (
      <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
        {sum}
      </td>
    );
  };
  const onAddClick2 = () => {
    setWorkType("N");
    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "N",
      orgdiv: "01",
      fxcode: "",
      fxdiv: "",
      location: "",
      recdt: new Date(),
      fxnum: "",
      fxnm: "",
      fxno: "",
      spec: "",
      dptcd: "",
      person: "",
      place: "",
      makedt: new Date(),
      maker: "",
      indt: new Date(),
      custcd: "",
      kind: "",
      amt: 0,
      uph: 0,
      classnm1: "",
      classnm2: "",
      classnm3: "",
      remark: "",
      useyn: "Y",
      attdatnum: "",
      proccd: "",
      IOT_TER_ID: 0,
      iotserialno: "",
      attdatnum_img: null,
      custnm: "",
      cnt: 0,
      files: "",
      availabletime: 0,
      viewyn: "",
      insert_form_id: "PR_A0060W",
      update_form_id: "",
      rowstatus_s: "U",
      fxseq_s: 0,
      fxdt_s: new Date(),
      custcd_s: "", //한글
      custnm_s: "",
      errtext_s: "",
      protext_s: "",
      fxcost_s: 0,
      remark1_s: "",
      attdatnum_s: "",
      stdtime_s: 0,
      errcode_s: "",
    });
  };

  const onAddClick = () => {
    let seq = 1;

    if (subDataResult.total > 0) {
      subDataResult.data.forEach((item) => {
        if (item[SUB_DATA_ITEM_KEY] > seq) {
          seq = item[SUB_DATA_ITEM_KEY];
        }
      });
      seq++;
    }

    const newDataItem = {
      [SUB_DATA_ITEM_KEY]: seq,
      rowstatus: "N",
      fxdt: convertDateToStr(new Date()),
      custcd: "",
      custnm: "",
      errtext: "",
      protext: "",
      fxcost: "",
      remark1: "",
      attdatnum: "",
      stdtime: "",
      errcode: "",
      inEdit: "fxdt",
    };

    setSubDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onCustWndClick2 = () => {
    setCustWindowVisible2(true);
  };

  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const [attachmentsWindowVisible2, setAttachmentsWindowVisible2] =
    useState<boolean>(false);

  const getAttachmentsData2 = (data: IAttachmentData) => {
    const items = parseInt(Object.getOwnPropertyNames(selectedsubDataState)[0]);
    const datas = subDataResult.data.map((item: any) =>
      item.fxseq == items
        ? {
            ...item,
            attdatnum: data.attdatnum,
            files:
              data.original_name +
              (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
          }
        : { ...item }
    );

    setSubDataResult((prev) => {
      return {
        data: datas,
        total: prev.total,
      };
    });
  };

  const getAttachmentsData = (data: IAttachmentData) => {
    setInfomation((prev) => {
      return {
        ...prev,
        attdatnum: data.attdatnum,
        files:
          data.original_name +
          (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      };
    });
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

  type TdataArr = {
    rowstatus: string[];
    fxseq_s: number[];
    fxdt_s: string[];
    custcd_s: string[];
    custnm_s: string[];
    errtext_s: string[];
    protext_s: string[];
    fxcost_s: string[];
    remark1_s: string[];
    attdatnum_s: string[];
    stdtime_s: number[];
    errcode_s: string[];
  };

  //업체마스터 참조팝업 함수 => 선택한 데이터 필터 세팅
  const setCustData = (data: ICustData) => {
    setFilters((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const setCustData2 = (data: ICustData) => {
    setInfomation((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: data.custnm,
    }));
  };

  const setCustData3 = (data: ICustData) => {
    const item = parseInt(Object.getOwnPropertyNames(selectedsubDataState)[0]);
    const newData = subDataResult.data.map((items) =>
      items.fxseq === item
        ? {
            ...items,
            custcd: data.custcd,
            custnm: data.custnm,
          }
        : {
            ...items,
          }
    );

    setSubDataResult((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
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

  const onSubDataSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    fetchMainGrid();
    fetchSubGrid();
  };

  const onSubItemChange = (event: GridItemChangeEvent) => {
    setSubDataState((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult,
      setSubDataResult,
      SUB_DATA_ITEM_KEY
    );
  };

  const enterEdit = (dataItem: any, field: string) => {
    if (field != "rowstatus") {
      const newData = subDataResult.data.map((item) =>
        item[SUB_DATA_ITEM_KEY] === dataItem[SUB_DATA_ITEM_KEY]
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

      setSubDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
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

  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    fxcode: "",
  });

  const onDeleteClick = (e: any) => {
    let newData: any[] = [];

    subDataResult.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState[item[SUB_DATA_ITEM_KEY]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        deletedMainRows.push(newData2);
      }
    });
    setSubDataResult((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setSubDataState({});
  };
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick2 = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }
    const items = Object.getOwnPropertyNames(selectedState)[0];
    mainDataResult.data.forEach((item: any, index: number) => {
      if (items == item.fxcode && (item.useyn == "N" || item.useyn == "")) {
        setParaDataDeleted((prev) => ({
          ...prev,
          work_type: "D",
          fxcode: items,
        }));
      } else if (items == item.fxcode && item.useyn == "Y") {
        alert(findMessage(messagesData, "PR_A0060W_005"));
      }
    });
  };

  const [paraData, setParaData] = useState({
    workType: "HISTORY",
    orgdiv: "01",
    fxcode: infomation.fxcode,
    fxdiv: infomation.fxdiv,
    location: infomation.location,
    recdt: infomation.recdt,
    fxnum: infomation.fxnum,
    fxnm: infomation.fxnm,
    fxno: infomation.fxno,
    spec: infomation.spec,
    dptcd: infomation.dptcd,
    person: infomation.person,
    place: infomation.place,
    makedt: infomation.makedt,
    maker: infomation.maker,
    indt: infomation.indt,
    custcd: infomation.custcd,
    kind: infomation.kind,
    amt: infomation.amt,
    uph: infomation.uph,
    classnm1: infomation.classnm1,
    classnm2: infomation.classnm2,
    classnm3: infomation.classnm3,
    remark: infomation.remark,
    useyn: infomation.useyn,
    attdatnum: infomation.attdatnum,
    proccd: infomation.proccd,
    IOT_TER_ID: infomation.IOT_TER_ID,
    iotserialno: infomation.iotserialno,
    attdatnum_img: infomation.attdatnum_img,
    custnm: infomation.custnm,
    cnt: infomation.cnt,
    files: infomation.files,
    availabletime: infomation.availabletime,
    viewyn: infomation.viewyn,
    insert_form_id: "PR_A0060W",
    update_form_id: infomation.update_form_id,
    rowstatus_s: "",
    fxseq_s: "",
    fxdt_s: "",
    custcd_s: "",
    custnm_s: "",
    errtext_s: "",
    protext_s: "",
    fxcost_s: "0",
    remark1_s: "",
    attdatnum_s: "",
    stdtime_s: "",
    errcode_s: "",
  });

  const para: Iparameters = {
    procedureName: "P_PR_A0060W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.workType,
      "@p_orgdiv": "01",
      "@p_location": paraData.location,
      "@p_fxcode": paraData.fxcode,
      "@p_recdt": convertDateToStr(paraData.recdt),
      "@p_fxnum": paraData.fxnum,
      "@p_fxnm": paraData.fxnm,
      "@p_fxno": paraData.fxno,
      "@p_spec": paraData.spec,
      "@p_dptcd":
        dptcdListData.find((item: any) => item.dptnm === paraData.dptcd)
          ?.dptcd == undefined
          ? ""
          : dptcdListData.find((item: any) => item.dptnm === paraData.dptcd)
              ?.dptcd,
      "@p_person":
        personListData.find((item: any) => item.user_name === paraData.person)
          ?.user_id == undefined
          ? ""
          : personListData.find(
              (item: any) => item.user_name === paraData.person
            )?.user_id,
      "@p_place": paraData.place,
      "@p_makedt": convertDateToStr(paraData.makedt),
      "@p_maker": paraData.maker,
      "@p_indt": convertDateToStr(paraData.indt),
      "@p_custcd": paraData.custcd,
      "@p_amt": paraData.amt,
      "@p_remark": paraData.remark,
      "@p_attdatnum_img": null,
      "@p_viewyn": paraData.viewyn,
      "@p_useyn": paraData.useyn,
      "@p_attdatnum": paraData.attdatnum,
      "@p_kind": paraData.kind,
      "@p_uph": paraData.uph,
      "@p_IOT_TER_ID": paraData.IOT_TER_ID,
      "@p_iotserialno": paraData.iotserialno,
      "@p_classnm1": paraData.classnm1,
      "@p_classnm2": paraData.classnm2,
      "@p_classnm3": paraData.classnm3,
      "@p_fxdiv": paraData.fxdiv,
      "@p_proccd": paraData.proccd,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_pgmdiv": "F",
      "@p_position": "",
      "@p_form_id": "PR_A0060W",
      "@p_availabletime": 2,
      "@p_rowstatus_s": paraData.rowstatus_s,
      "@p_fxseq_s": paraData.fxseq_s,
      "@p_fxdt_s": paraData.fxdt_s,
      "@p_custcd_s": paraData.custcd_s,
      "@p_custnm_s": paraData.custnm_s,
      "@p_errtext_s": paraData.errtext_s,
      "@p_protext_s": paraData.protext_s,
      "@p_fxcost_s": paraData.fxcost_s,
      "@p_remark1_s": paraData.remark1_s,
      "@p_attdatnum_s": paraData.attdatnum_s,
      "@p_stdtime_s": paraData.stdtime_s,
      // "@p_errcode_s": paraData.errcode_s,
      "@p_company_code": "2207A046",
    },
  };

  const paraDeleted: Iparameters = {
    procedureName: "P_PR_A0060W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_location": infomation.location,
      "@p_fxcode": paraDataDeleted.fxcode,
      "@p_recdt": convertDateToStr(infomation.recdt),
      "@p_fxnum": infomation.fxnum,
      "@p_fxnm": infomation.fxnm,
      "@p_fxno": infomation.fxno,
      "@p_spec": infomation.spec,
      "@p_dptcd":
        dptcdListData.find((item: any) => item.dptnm === infomation.dptcd)
          ?.dptcd == undefined
          ? ""
          : dptcdListData.find((item: any) => item.dptnm === infomation.dptcd)
              ?.dptcd,
      "@p_person":
        personListData.find((item: any) => item.user_name === infomation.person)
          ?.user_id == undefined
          ? ""
          : personListData.find(
              (item: any) => item.user_name === infomation.person
            )?.user_id,
      "@p_place": infomation.place,
      "@p_makedt": convertDateToStr(infomation.makedt),
      "@p_maker": infomation.maker,
      "@p_indt": convertDateToStr(infomation.indt),
      "@p_custcd": infomation.custcd,
      "@p_amt": infomation.amt,
      "@p_remark": infomation.remark,
      "@p_attdatnum_img": null,
      "@p_viewyn": infomation.viewyn,
      "@p_useyn": infomation.useyn,
      "@p_attdatnum": infomation.attdatnum,
      "@p_kind": infomation.kind,
      "@p_uph": infomation.uph,
      "@p_IOT_TER_ID": infomation.IOT_TER_ID,
      "@p_iotserialno": infomation.iotserialno,
      "@p_classnm1": infomation.classnm1,
      "@p_classnm2": infomation.classnm2,
      "@p_classnm3": infomation.classnm3,
      "@p_fxdiv": infomation.fxdiv,
      "@p_proccd": infomation.proccd,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_pgmdiv": "F",
      "@p_position": "",
      "@p_form_id": "PR_A0060W",
      "@p_availabletime": 2,
      "@p_rowstatus_s": "",
      "@p_fxseq_s": "",
      "@p_fxdt_s": "",
      "@p_custcd_s": "",
      "@p_custnm_s": "",
      "@p_errtext_s": "",
      "@p_protext_s": "",
      "@p_fxcost_s": "",
      "@p_remark1_s": "",
      "@p_attdatnum_s": "",
      "@p_stdtime_s": "",
      "@p_company_code": "2207A046",
    },
  };

  const infopara: Iparameters = {
    procedureName: "P_PR_A0060W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": infomation.workType,
      "@p_orgdiv": "01",
      "@p_location": infomation.location,
      "@p_fxcode": infomation.fxcode,
      "@p_recdt": convertDateToStr(infomation.recdt),
      "@p_fxnum": infomation.fxnum,
      "@p_fxnm": infomation.fxnm,
      "@p_fxno": infomation.fxno,
      "@p_spec": infomation.spec,
      "@p_dptcd":
        dptcdListData.find((item: any) => item.dptnm === infomation.dptcd)
          ?.dptcd == undefined
          ? ""
          : dptcdListData.find((item: any) => item.dptnm === infomation.dptcd)
              ?.dptcd,
      "@p_person":
        personListData.find((item: any) => item.user_name === infomation.person)
          ?.user_id == undefined
          ? ""
          : personListData.find(
              (item: any) => item.user_name === infomation.person
            )?.user_id,
      "@p_place": infomation.place,
      "@p_makedt": convertDateToStr(infomation.makedt),
      "@p_maker": infomation.maker,
      "@p_indt": convertDateToStr(infomation.indt),
      "@p_custcd": infomation.custcd,
      "@p_amt": infomation.amt,
      "@p_remark": infomation.remark,
      "@p_attdatnum_img": null,
      "@p_viewyn": infomation.viewyn,
      "@p_useyn": infomation.useyn,
      "@p_attdatnum": infomation.attdatnum,
      "@p_kind": infomation.kind,
      "@p_uph": infomation.uph,
      "@p_IOT_TER_ID": infomation.IOT_TER_ID,
      "@p_iotserialno": infomation.iotserialno,
      "@p_classnm1": infomation.classnm1,
      "@p_classnm2": infomation.classnm2,
      "@p_classnm3": infomation.classnm3,
      "@p_fxdiv": infomation.fxdiv,
      "@p_proccd": infomation.proccd,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_pgmdiv": "F",
      "@p_position": "",
      "@p_form_id": "PR_A0060W",
      "@p_availabletime": 2,
      "@p_rowstatus_s": "",
      "@p_fxseq_s": "",
      "@p_fxdt_s": "",
      "@p_custcd_s": "",
      "@p_custnm_s": "",
      "@p_errtext_s": "",
      "@p_protext_s": "",
      "@p_fxcost_s": "",
      "@p_remark1_s": "",
      "@p_attdatnum_s": "",
      "@p_stdtime_s": "",
      "@p_company_code": "2207A046",
    },
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  const onSaveClick = async () => {
    let valid = true;
    try {
      subDataResult.data.map((item: any) => {
        subDataResult.data.map((items: any) => {
          if (item.fxdt == items.fxdt) {
            throw findMessage(messagesData, "PR_A0060W_004");
          }
        });
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;
    const dataItem = subDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    if (dataItem.length === 0 && deletedMainRows.length === 0) return false;
    let dataArr: TdataArr = {
      rowstatus: [],
      fxseq_s: [],
      fxdt_s: [],
      custcd_s: [],
      custnm_s: [],
      errtext_s: [],
      protext_s: [],
      fxcost_s: [],
      remark1_s: [],
      attdatnum_s: [],
      stdtime_s: [],
      errcode_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        fxdt = "",
        fxseq = "",
        custcd = "",
        custnm = "",
        errtext = "",
        protext = "",
        fxcost = "",
        remark1 = "",
        attdatnum = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.fxseq_s.push(fxseq);
      dataArr.fxdt_s.push(fxdt);
      dataArr.custcd_s.push(custcd);
      dataArr.custnm_s.push(custnm);
      dataArr.errtext_s.push(errtext);
      dataArr.protext_s.push(protext);
      dataArr.fxcost_s.push(fxcost == "" ? 0 : fxcost);
      dataArr.remark1_s.push(remark1);
      dataArr.attdatnum_s.push(attdatnum);
      dataArr.stdtime_s.push(0);
      dataArr.errcode_s.push("");
    });
    deletedMainRows.forEach(async (item: any, idx: number) => {
      const paraD: Iparameters = {
        procedureName: "P_PR_A0060W_S",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": "U",
          "@p_orgdiv": "01",
          "@p_location": infomation.location,
          "@p_fxcode": infomation.fxcode,
          "@p_recdt": convertDateToStr(infomation.recdt),
          "@p_fxnum": infomation.fxnum,
          "@p_fxnm": infomation.fxnm,
          "@p_fxno": infomation.fxno,
          "@p_spec": infomation.spec,
          "@p_dptcd":
            dptcdListData.find((item: any) => item.dptnm === infomation.dptcd)
              ?.dptcd == undefined
              ? ""
              : dptcdListData.find(
                  (item: any) => item.dptnm === infomation.dptcd
                )?.dptcd,
          "@p_person":
            personListData.find(
              (item: any) => item.user_name === infomation.person
            )?.user_id == undefined
              ? ""
              : personListData.find(
                  (item: any) => item.user_name === infomation.person
                )?.user_id,
          "@p_place": infomation.place,
          "@p_makedt": convertDateToStr(infomation.makedt),
          "@p_maker": infomation.maker,
          "@p_indt": convertDateToStr(infomation.indt),
          "@p_custcd": infomation.custcd,
          "@p_amt": infomation.amt,
          "@p_remark": infomation.remark,
          "@p_attdatnum_img": null,
          "@p_viewyn": infomation.viewyn,
          "@p_useyn": infomation.useyn,
          "@p_attdatnum": infomation.attdatnum,
          "@p_kind": infomation.kind,
          "@p_uph": infomation.uph,
          "@p_IOT_TER_ID": infomation.IOT_TER_ID,
          "@p_iotserialno": infomation.iotserialno,
          "@p_classnm1": infomation.classnm1,
          "@p_classnm2": infomation.classnm2,
          "@p_classnm3": infomation.classnm3,
          "@p_fxdiv": infomation.fxdiv,
          "@p_proccd": infomation.proccd,
          "@p_userid": userId,
          "@p_pc": pc,
          "@p_pgmdiv": "F",
          "@p_position": "",
          "@p_form_id": "PR_A0060W",
          "@p_availabletime": 2,
          "@p_rowstatus_s": item.rowstatus,
          "@p_fxseq_s": item.fxseq,
          "@p_fxdt_s": item.fxdt,
          "@p_custcd_s": item.custcd,
          "@p_custnm_s": item.custnm,
          "@p_errtext_s": item.errtext,
          "@p_protext_s": item.protext,
          "@p_fxcost_s": item.fxcost,
          "@p_remark1_s": item.remark1,
          "@p_attdatnum_s": item.attdatnum,
          "@p_stdtime_s": 0,
          // "@p_errcode_s": paraData.errcode_s,
          "@p_company_code": "2207A046",
        },
      };
      let data: any;

      try {
        data = await processApi<any>("procedure", paraD);
      } catch (error) {
        data = null;
      }

      if (data.isSuccess !== true) {
        console.log("[오류 발생]");
        console.log(data);
      }
    });
    deletedMainRows = [];

    setParaData((prev) => ({
      ...prev,
      workType: "U",
      fxcode: infomation.fxcode,
      fxdiv: infomation.fxdiv,
      location: infomation.location,
      recdt: infomation.recdt,
      fxnum: infomation.fxnum,
      fxnm: infomation.fxnm,
      fxno: infomation.fxno,
      spec: infomation.spec,
      dptcd: infomation.dptcd,
      person: infomation.person,
      place: infomation.place,
      makedt: infomation.makedt,
      maker: infomation.maker,
      indt: infomation.indt,
      custcd: infomation.custcd,
      kind: infomation.kind,
      amt: infomation.amt,
      uph: infomation.uph,
      classnm1: infomation.classnm1,
      classnm2: infomation.classnm2,
      classnm3: infomation.classnm3,
      remark: infomation.remark,
      useyn: infomation.useyn,
      attdatnum: infomation.attdatnum,
      proccd: infomation.proccd,
      IOT_TER_ID: infomation.IOT_TER_ID,
      iotserialno: infomation.iotserialno,
      attdatnum_img: infomation.attdatnum_img,
      custnm: infomation.custnm,
      cnt: infomation.cnt,
      files: infomation.files,
      availabletime: infomation.availabletime,
      viewyn: infomation.viewyn,
      insert_form_id: "PR_A0060W",
      update_form_id: infomation.update_form_id,
      rowstatus_s: dataArr.rowstatus.join("|"),
      fxseq_s: dataArr.fxseq_s.join("|"),
      fxdt_s: dataArr.fxdt_s.join("|"),
      custcd_s: dataArr.custcd_s.join("|"),
      custnm_s: dataArr.custnm_s.join("|"),
      errtext_s: dataArr.errtext_s.join("|"),
      protext_s: dataArr.protext_s.join("|"),
      fxcost_s: dataArr.fxcost_s.join("|"),
      remark1_s: dataArr.remark1_s.join("|"),
      attdatnum_s: dataArr.attdatnum_s.join("|"),
      stdtime_s: dataArr.stdtime_s.join("|"),
      errcode_s: dataArr.errcode_s.join("|"),
    }));
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
    paraDataDeleted.fxcode = "";
  };

  const onSaveClick2 = async () => {
    fetchSaved();
  };

  const fetchSaved = async () => {
    let data: any;

    let valid = true;
    try {
      if (!infomation.fxnum) {
        throw findMessage(messagesData, "PR_A0060W_001");
      }

      if (!infomation.fxnm) {
        throw findMessage(messagesData, "PR_A0060W_002");
      }

      if (
        convertDateToStr(infomation.recdt).length != 8 ||
        convertDateToStr(infomation.makedt).length != 8 ||
        convertDateToStr(infomation.indt).length != 8
      ) {
        throw findMessage(messagesData, "PR_A0060W_003");
      }
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    setLoading(true);

    try {
      data = await processApi<any>("procedure", infopara);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setMainPgNum(1);
      setMainDataResult(process([], mainDataState));

      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchTodoGridSaved = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      setSubPgNum(1);
      setSubDataResult(process([], subDataState));

      fetchSubGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.fxcode != "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;
      for (var i = 0; i < subDataResult.data.length; i++) {
        if (rowData.fxseq == subDataResult.data[i].fxseq) {
          setrows(i);
        }
      }
      setSelectedsubDataState({ [rowData[SUB_DATA_ITEM_KEY]]: true });
      setAttachmentsWindowVisible2(true);
    };

    return (
      <>
        {props.rowType === "groupHeader" ? null : (
          <td className="k-command-cell">
            <Button
              type={"button"}
              onClick={onEditClick}
              icon="more-horizontal"
              fillMode="flat"
              style={{ float: "right" }}
            />
          </td>
        )}
      </>
    );
  };

  return (
    <>
      <TitleContainer>
        <Title>설비관리</Title>

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
              <th>설비번호</th>
              <td>
                <Input
                  name="fxnum"
                  type="text"
                  value={filters.fxnum}
                  onChange={filterInputChange}
                />
              </td>
              <th>설비명</th>
              <td>
                <Input
                  name="fxnm"
                  type="text"
                  value={filters.fxnm}
                  onChange={filterInputChange}
                />
              </td>
              <th>설비호기</th>
              <td>
                <Input
                  name="fxno"
                  type="text"
                  value={filters.fxno}
                  onChange={filterInputChange}
                />
              </td>
              <th>설비종류</th>
              <td>
                <Input
                  name="kind"
                  type="text"
                  value={filters.kind}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>제조사</th>
              <td>
                <Input
                  name="maker"
                  type="text"
                  value={filters.maker}
                  onChange={filterInputChange}
                />
              </td>
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
              <th>사용여부</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="raduseyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>사업장</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="location"
                    value={filters.location}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>
              <th>이더넷</th>
              <td>
                <Input
                  name="classnm1"
                  type="text"
                  value={filters.classnm1}
                  onChange={filterInputChange}
                />
              </td>
              <th>분류2</th>
              <td>
                <Input
                  name="classnm2"
                  type="text"
                  value={filters.classnm2}
                  onChange={filterInputChange}
                />
              </td>
              <th>분류3</th>
              <td>
                <Input
                  name="classnm3"
                  type="text"
                  value={filters.classnm3}
                  onChange={filterInputChange}
                />
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
                onClick={onAddClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="file-add"
              >
                생성
              </Button>
              <Button
                onClick={onSaveClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="save"
              >
                저장
              </Button>
              <Button
                onClick={onDeleteClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="delete"
              >
                삭제
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "27vh" }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                dptcd: dptcdListData.find(
                  (item: any) => item.dptcd === row.dptcd
                )?.dptnm,
                person: personListData.find(
                  (item: any) => item.user_id === row.person
                )?.user_name,
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
              customOptionData.menuCustomColumnOptions["grdList"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      id={item.id}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      className={
                        requiredField.includes(item.fieldName)
                          ? "required"
                          : undefined
                      }
                      headerCell={
                        requiredField.includes(item.fieldName)
                          ? RequiredHeader
                          : undefined
                      }
                      cell={
                        DateField.includes(item.fieldName)
                          ? DateCell
                          : NumberField.includes(item.fieldName)
                          ? NumberCell
                          : CheckField.includes(item.fieldName)
                          ? CheckBoxCell
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0
                          ? mainTotalFooterCell
                          : NumberField.includes(item.fieldName)
                          ? gridSumQtyFooterCell
                          : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </ExcelExport>
      </GridContainer>
      <TabStrip selected={tabSelected} onSelect={handleSelectTab}>
        <TabStripTab title="설비정보">
          <FormBoxWrap style={{ height: "40vh" }}>
            <FormBox>
              <tbody>
                <tr>
                  <th>설비번호</th>
                  <td>
                    <Input
                      name="fxnum"
                      type="text"
                      value={infomation.fxnum}
                      onChange={InputChange}
                      className="required"
                    />
                  </td>
                  <th>설비명</th>
                  <td colSpan={3}>
                    <Input
                      name="fxnm"
                      type="text"
                      value={infomation.fxnm}
                      onChange={InputChange}
                      className="required"
                    />
                  </td>
                  <th>설비호기</th>
                  <td>
                    <Input
                      name="fxno"
                      type="text"
                      value={infomation.fxno}
                      onChange={InputChange}
                    />
                  </td>
                  <th>설비코드</th>
                  <td>
                    <Input
                      name="fxcode"
                      type="text"
                      value={infomation.fxcode}
                      onChange={InputChange}
                      className="readonly"
                    />
                  </td>
                </tr>
                <tr>
                  <th>설비구분</th>
                  <td>
                    {bizComponentData !== null && (
                      <BizComponentComboBox
                        name="fxdiv"
                        value={infomation.fxdiv}
                        bizComponentId="L_PR030"
                        bizComponentData={bizComponentData}
                        changeData={ComboBoxChange}
                      />
                    )}
                  </td>
                  <th>사양</th>
                  <td colSpan={3}>
                    <Input
                      name="spec"
                      value={infomation.spec}
                      onChange={InputChange}
                    />
                  </td>
                  <th>가용시간</th>
                  <td>
                    <Input
                      name="availabletime"
                      type="number"
                      value={infomation.availabletime}
                      onChange={InputChange}
                      style={{ textAlign: "right" }}
                    />
                  </td>
                  <th>시간당생산수량</th>
                  <td>
                    <Input
                      name="uph"
                      type="number"
                      value={infomation.uph}
                      onChange={InputChange}
                      style={{ textAlign: "right" }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>설비종류</th>
                  <td colSpan={3}>
                    <Input
                      name="kind"
                      type="text"
                      value={infomation.kind}
                      onChange={InputChange}
                    />
                  </td>
                  <th>입력일자</th>
                  <td>
                    <DatePicker
                      name="recdt"
                      value={infomation.recdt}
                      format="yyyy-MM-dd"
                      onChange={InputChange}
                      placeholder=""
                    />
                  </td>
                  <th>사용여부</th>
                  <td>
                    <Checkbox
                      name="useyn"
                      value={infomation.useyn == "Y" ? true : false}
                      onChange={InputChange}
                    />
                  </td>
                  <th>IOT설비번호</th>
                  <td>
                    <Input
                      name="IOT_TER_ID"
                      type="number"
                      value={infomation.IOT_TER_ID}
                      onChange={InputChange}
                      style={{ textAlign: "right" }}
                    />
                  </td>
                </tr>
                <tr>
                  <th>장소</th>
                  <td colSpan={3}>
                    <Input
                      name="place"
                      type="text"
                      value={infomation.place}
                      onChange={InputChange}
                    />
                  </td>
                  <th>제조일자</th>
                  <td>
                    <DatePicker
                      name="makedt"
                      value={infomation.makedt}
                      format="yyyy-MM-dd"
                      onChange={InputChange}
                      placeholder=""
                    />
                  </td>
                  <th>제조사</th>
                  <td>
                    <Input
                      name="maker"
                      type="text"
                      value={infomation.maker}
                      onChange={InputChange}
                    />
                  </td>
                  <th>이더넷1</th>
                  <td>
                    <Input
                      name="classnm1"
                      type="text"
                      value={infomation.classnm1}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>업체코드</th>
                  <td>
                    <Input
                      name="custcd"
                      type="text"
                      value={infomation.custcd}
                      onChange={InputChange}
                    />
                    <ButtonInInput>
                      <Button
                        onClick={onCustWndClick2}
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
                      value={infomation.custnm}
                      onChange={InputChange}
                    />
                  </td>
                  <th>구입일자</th>
                  <td>
                    <DatePicker
                      name="indt"
                      value={infomation.indt}
                      format="yyyy-MM-dd"
                      onChange={InputChange}
                      placeholder=""
                    />
                  </td>
                  <th>구입금액</th>
                  <td>
                    <Input
                      name="amt"
                      type="number"
                      value={infomation.amt}
                      onChange={InputChange}
                      style={{ textAlign: "right" }}
                    />
                  </td>
                  <th>분류2</th>
                  <td>
                    <Input
                      name="classnm2"
                      type="text"
                      value={infomation.classnm2}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>담당부서</th>
                  <td>
                    {bizComponentData !== null && (
                      <BizComponentComboBox
                        name="dptcd"
                        value={infomation.dptcd}
                        bizComponentId="L_dptcd_001"
                        bizComponentData={bizComponentData}
                        changeData={ComboBoxChange}
                        textField="dptnm"
                        valueField="dptnm"
                      />
                    )}
                  </td>
                  <th>책임자</th>
                  <td>
                    {bizComponentData !== null && (
                      <BizComponentComboBox
                        name="person"
                        value={infomation.person}
                        bizComponentId="L_sysUserMaster_001"
                        bizComponentData={bizComponentData}
                        changeData={ComboBoxChange}
                        textField="user_name"
                        valueField="user_name"
                      />
                    )}
                  </td>
                  <th>소속공정</th>
                  <td>
                    {bizComponentData !== null && (
                      <BizComponentComboBox
                        name="proccd"
                        value={infomation.proccd}
                        bizComponentId="L_PR010"
                        bizComponentData={bizComponentData}
                        changeData={ComboBoxChange}
                      />
                    )}
                  </td>
                  <th>IOT I/F No</th>
                  <td>
                    <Input
                      name="iotserialno"
                      type="text"
                      value={infomation.iotserialno}
                      onChange={InputChange}
                    />
                  </td>
                  <th>분류3</th>
                  <td>
                    <Input
                      name="classnm3"
                      type="text"
                      value={infomation.classnm3}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th>첨부파일</th>
                  <td colSpan={3}>
                    <Input name="files" type="text" value={infomation.files} />
                    <ButtonInInput style={{ marginTop: "3vh" }}>
                      <Button
                        type={"button"}
                        onClick={onAttachmentsWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInInput>
                  </td>
                  <th>비고</th>
                  <td colSpan={5}>
                    <TextArea
                      value={infomation.remark}
                      name="remark"
                      rows={4}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
        </TabStripTab>
        <TabStripTab title="설비이력관리">
          <GridContainer>
            <GridTitleContainer>
              <GridTitle>설비이력관리</GridTitle>
              <ButtonContainer>
                <Button
                  onClick={onAddClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="plus"
                ></Button>
                <Button
                  onClick={onDeleteClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="minus"
                ></Button>
                <Button
                  onClick={onSaveClick}
                  fillMode="outline"
                  themeColor={"primary"}
                  icon="save"
                ></Button>
              </ButtonContainer>
            </GridTitleContainer>
            <Grid
              style={{ height: "35vh" }}
              data={process(
                subDataResult.data.map((row) => ({
                  ...row,
                  fxdt: new Date(dateformat(row.fxdt)),
                  rowstatus:
                    row.rowstatus == null ||
                    row.rowstatus == "" ||
                    row.rowstatus == undefined
                      ? ""
                      : row.rowstatus,
                  [SELECTED_FIELD]: selectedsubDataState[idGetter2(row)],
                })),
                subDataState
              )}
              {...subDataState}
              onDataStateChange={onSubDataStateChange}
              //선택 기능
              dataItemKey={SUB_DATA_ITEM_KEY}
              selectedField={SELECTED_FIELD}
              selectable={{
                enabled: true,
                mode: "multiple",
              }}
              onSelectionChange={onSubDataSelectionChange}
              //스크롤 조회 기능
              fixedScroll={true}
              total={subDataResult.total}
              onScroll={onSubScrollHandler}
              //정렬기능
              sortable={true}
              onSortChange={onSubDataSortChange}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              onItemChange={onSubItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn field="rowstatus" title=" " width="50px" />
              {customOptionData !== null &&
                customOptionData.menuCustomColumnOptions["grdList2"].map(
                  (item: any, idx: number) =>
                    item.sortOrder !== -1 && (
                      <GridColumn
                        key={idx}
                        id={item.id}
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        cell={
                          DateField.includes(item.fieldName)
                            ? DateCell
                            : NumberField.includes(item.fieldName)
                            ? NumberCell
                            : commandField.includes(item.fieldName)
                            ? CommandCell
                            : undefined
                        }
                        className={
                          editField.includes(item.fieldName)
                            ? "editable-new-only"
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0
                            ? subTotalFooterCell
                            : NumberField.includes(item.fieldName)
                            ? gridSumQtyFooterCell
                            : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </GridContainer>
        </TabStripTab>
      </TabStrip>
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={workType}
          setData={setCustData}
        />
      )}
      {custWindowVisible2 && (
        <CustomersWindow
          setVisible={setCustWindowVisible2}
          workType={workType}
          setData={setCustData2}
        />
      )}
      {custWindowVisible3 && (
        <CustomersWindow
          setVisible={setCustWindowVisible3}
          workType={workType}
          setData={setCustData3}
        />
      )}
      {itemWindowVisible && (
        <ItemsWindow
          setVisible={setItemWindowVisible}
          workType={"FILTER"}
          setData={setItemData}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={infomation.attdatnum}
        />
      )}
      {attachmentsWindowVisible2 && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible2}
          setData={getAttachmentsData2}
          para={subDataResult.data[rows].attdatnum}
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

export default PR_A0060;
