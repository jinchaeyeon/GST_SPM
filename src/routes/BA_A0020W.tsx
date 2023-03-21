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
import YearDateCell from "../components/Cells/YearDateCell";
import { gridList } from "../store/columns/BA_A0020W_C";
import {
  TextArea,
  Checkbox,
  CheckboxChangeEvent,
} from "@progress/kendo-react-inputs";
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
  GridContainer,
  GridTitle,
  TitleContainer,
  ButtonContainer,
  GridTitleContainer,
  ButtonInInput,
  ButtonInFieldWrap,
  ButtonInField,
  FormBoxWrap,
  FormBox,
  GridContainerWrap,
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
  isValidDate,
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
  GAP,
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
import RequiredHeader from "../components/RequiredHeader";

const DATA_ITEM_KEY = "custcd";
const SUB_DATA_ITEM_KEY = "num";
const SUB_DATA_ITEM_KEY2 = "num";
let deletedMainRows: any[] = [];
let deletedMainRows2: any[] = [];

const checkboxField = ["useyn", "rtrchk"];

const NumberField = [
  "sort_seq",
  "totasset",
  "paid_up_capital",
  "totcapital",
  "salesmoney",
  "operating_profits",
  "current_income",
  "dedt_ratio",
];

const requiredField = ["prsnnm", "yyyy"];

const commandField = ["attdatnum"];

const editField = ["custprsncd"];

const YearDateField = ["yyyy"];
const BA_A0020: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const idGetter2 = getter(SUB_DATA_ITEM_KEY);
  const idGetter3 = getter(SUB_DATA_ITEM_KEY2);
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
        custdiv: defaultOption.find((item: any) => item.id === "custdiv")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_BA026,L_BA027,L_AC901,L_sysUserMaster_001,R_USEYN,L_BA173,L_BA172,L_BA171,L_BA049,R_RTXISUYN,L_BA008",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [custdivListData, setCustdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [bizdivListData, setBizdivListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);

  useEffect(() => {
    if (bizComponentData !== null) {
      const custdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA026")
      );
      const BizdivQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_BA027")
      );

      fetchQuery(custdivQueryStr, setCustdivListData);
      fetchQuery(BizdivQueryStr, setBizdivListData);
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

  const [yn, setyn] = useState(true);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [subDataState, setSubDataState] = useState<State>({
    sort: [],
  });
  const [subDataState2, setSubDataState2] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [subDataResult, setSubDataResult] = useState<DataResult>(
    process([], subDataState)
  );

  const [subDataResult2, setSubDataResult2] = useState<DataResult>(
    process([], subDataState2)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState, setSelectedsubDataState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [selectedsubDataState2, setSelectedsubDataState2] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [subPgNum, setSubPgNum] = useState(1);
  const [subPgNum2, setSubPgNum2] = useState(1);
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
      if (name == "useyn" || name == "scmyn" || name == "rtxisuyn") {
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

  const [infomation, setInfomation] = useState<{ [name: string]: any }>({
    pgSize: PAGE_SIZE,
    workType: "U",
    custcd: "자동생성",
    custnm: "",
    custdiv: "",
    custabbr: "",
    compnm_eng: "",
    inunpitem: "",
    bizregnum: "",
    zipcode: 0,
    area: "",
    unpitem: "",
    ceonm: "",
    address: "",
    bizdiv: "",
    repreregno: "",
    address_eng: "",
    estbdt: null, //new Date(),
    phonenum: "",
    bnkinfo: "",
    bankacntuser: "",
    compclass: "",
    etelnum: "",
    bankacnt: "",
    comptype: "",
    faxnum: "",
    bnkinfo2: "",
    bankacnt2: "",
    taxorg: "",
    efaxnum: "",
    email: "",
    taxortnm: "",
    useyn: "Y",
    scmyn: "Y",
    pariodyn: "",
    attdatnum: "",
    itemlvl1: "",
    itemlvl2: "",
    itemlvl3: "",
    etax: "",
    remark: "",
    etxprs: "",
    phonenum_og: "",
    emailaddr_og: "",
    bill_type: "",
    recvid: "",
    rtxisuyn: "",
    files: "",
    auto: "Y",
  });

  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "LIST",
    orgdiv: "01",
    custcd: "",
    custnm: "",
    custdiv: "",
    bizregnum: "",
    ceonm: "",
    raduseyn: "Y",
    company_code: "2207A046",
    row_value: null,
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_BA_A0020W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": filters.workType,
      "@p_orgdiv": filters.orgdiv,
      "@p_custcd": filters.custcd,
      "@p_custnm": filters.custnm,
      "@p_custdiv": filters.custdiv,
      "@p_bizregnum": filters.bizregnum,
      "@p_ceonm": filters.ceonm,
      "@p_useyn": filters.raduseyn,
      "@p_company_code": filters.company_code,
      "@p_find_row_value": filters.row_value,
    },
  };

  const [subfilters, setsubFilters] = useState({
    pgSize: PAGE_SIZE,
    workType: "CustPerson",
    custcd: infomation.custcd,
    custnm: "",
    custdiv: "",
    bizregnum: "",
    ceonm: "",
    useyn: "",
  });

  const [subfilters2, setsubFilters2] = useState({
    pgSize: PAGE_SIZE,
    workType: "MONEY",
    custcd: infomation.custcd,
    custnm: "",
    custdiv: "",
    bizregnum: "",
    ceonm: "",
    useyn: "",
  });

  //조회조건 파라미터
  const subparameters: Iparameters = {
    procedureName: "P_BA_A0020W_Q",
    pageNumber: subPgNum,
    pageSize: subfilters.pgSize,
    parameters: {
      "@p_work_type": subfilters.workType,
      "@p_orgdiv": "01",
      "@p_useyn": subfilters.useyn,
      "@p_custcd": subfilters.custcd,
      "@p_custnm": subfilters.custnm,
      "@p_custdiv":
        custdivListData.find(
          (item: any) => item.code_name === subfilters.custdiv
        )?.sub_code == undefined
          ? ""
          : custdivListData.find(
              (item: any) => item.code_name === subfilters.custdiv
            )?.sub_code,
      "@p_bizregnum": subfilters.bizregnum,
      "@p_ceonm": subfilters.ceonm,
      "@p_company_code": "2207A046",
      "@p_find_row_value": null,
    },
  };

  const subparameters2: Iparameters = {
    procedureName: "P_BA_A0020W_Q",
    pageNumber: subPgNum2,
    pageSize: subfilters2.pgSize,
    parameters: {
      "@p_work_type": subfilters2.workType,
      "@p_orgdiv": "01",
      "@p_useyn": subfilters2.useyn,
      "@p_custcd": subfilters2.custcd,
      "@p_custnm": subfilters2.custnm,
      "@p_custdiv":
        custdivListData.find(
          (item: any) => item.code_name === subfilters2.custdiv
        )?.sub_code == undefined
          ? ""
          : custdivListData.find(
              (item: any) => item.code_name === subfilters2.custdiv
            )?.sub_code,
      "@p_bizregnum": subfilters2.bizregnum,
      "@p_ceonm": subfilters2.ceonm,
      "@p_company_code": "2207A046",
      "@p_find_row_value": null,
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
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
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
      }));
      setSubDataResult((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchSubGrid2 = async () => {
    //if (!permissions?.view) return;
    let data: any;

    setLoading(true);
    try {
      data = await processApi<any>("procedure", subparameters2);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      const row = rows.map((item: any) => ({
        ...item,
        yyyy: item.yyyy < "1999" ? null : item.yyyy,
      }));
      setSubDataResult2((prev) => {
        return {
          data: row,
          total: totalRowCnt,
        };
      });
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

  useEffect(() => {
    fetchSubGrid2();
  }, [subPgNum2]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.custcd]: true });

        setInfomation({
          pgSize: PAGE_SIZE,
          workType: "U",
          custcd: firstRowData.custcd,
          custnm: firstRowData.custnm,
          custdiv:
            custdivListData.find(
              (item: any) => item.sub_code === firstRowData.custdiv
            )?.code_name == undefined
              ? firstRowData.custdiv
              : custdivListData.find(
                  (item: any) => item.sub_code === firstRowData.custdiv
                )?.code_name,
          custabbr: firstRowData.custabbr,
          compnm_eng: firstRowData.compnm_eng,
          inunpitem: firstRowData.inunpitem,
          bizregnum: firstRowData.bizregnum,
          zipcode: firstRowData.zipcode,
          area: firstRowData.area,
          unpitem: firstRowData.unpitem,
          ceonm: firstRowData.ceonm,
          address: firstRowData.address,
          bizdiv:
            bizdivListData.find(
              (item: any) => item.sub_code === firstRowData.bizdiv
            )?.code_name == undefined
              ? firstRowData.bizdiv
              : bizdivListData.find(
                  (item: any) => item.sub_code === firstRowData.bizdiv
                )?.code_name,
          repreregno: firstRowData.repreregno,
          address_eng: firstRowData.address_eng,
          estbdt: isValidDate(firstRowData.estbdt)
            ? new Date(dateformat(firstRowData.estbdt))
            : null,
          phonenum: firstRowData.phonenum,
          bnkinfo: firstRowData.bnkinfo,
          bankacntuser: firstRowData.bankacntuser,
          compclass: firstRowData.compclass,
          etelnum: firstRowData.etelnum,
          bankacnt: firstRowData.bankacnt,
          comptype: firstRowData.comptype,
          faxnum: firstRowData.faxnum,
          bnkinfo2: firstRowData.bnkinfo2,
          bankacnt2: firstRowData.bankacnt2,
          taxorg: firstRowData.taxorg,
          efaxnum: firstRowData.efaxnum,
          email: firstRowData.email,
          taxortnm: firstRowData.taxortnm,
          useyn: firstRowData.useyn == "Y" ? "Y" : "N",
          scmyn: firstRowData.scmyn == "Y" ? "Y" : "N",
          pariodyn: firstRowData.pariodyn == "Y" ? "Y" : "N",
          attdatnum: firstRowData.attdatnum,
          itemlvl1: firstRowData.itemlvl1,
          itemlvl2: firstRowData.itemlvl2,
          itemlvl3: firstRowData.itemlvl3,
          etax: firstRowData.etax,
          remark: firstRowData.remark,
          etxprs: firstRowData.etxprs,
          phonenum_og: firstRowData.phonenum_og,
          emailaddr_og: firstRowData.emailaddr_og,
          bill_type: firstRowData.bill_type,
          recvid: firstRowData.recvid,
          rtxisuyn: firstRowData.rtxisuyn,
          files: firstRowData.files,
          auto: firstRowData.auto,
        });

        setsubFilters((prev) => ({
          ...prev,
          workType: "CustPerson",
          useyn: firstRowData.useyn,
          custcd: firstRowData.custcd,
          custnm: firstRowData.custnm,
          custdiv: firstRowData.custdiv,
          bizregnum: firstRowData.bizregnum,
          ceonm: firstRowData.ceonm,
        }));

        setsubFilters2((prev) => ({
          ...prev,
          workType: "MONEY",
          useyn: firstRowData.useyn,
          custcd: firstRowData.custcd,
          custnm: firstRowData.custnm,
          custdiv: firstRowData.custdiv,
          bizregnum: firstRowData.bizregnum,
          ceonm: firstRowData.ceonm,
        }));

        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult.total > 0) {
        const firstRowData = subDataResult.data[0];
        setSelectedsubDataState({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [subDataResult]);

  useEffect(() => {
    if (ifSelectFirstRow) {
      if (subDataResult2.total > 0) {
        const firstRowData = subDataResult2.data[0];
        setSelectedsubDataState2({ [firstRowData.num]: true });

        setIfSelectFirstRow(false);
      }
    }
  }, [subDataResult2]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subfilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid2();
    }
  }, [subfilters2]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid();
    }
  }, [subPgNum]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchSubGrid2();
    }
  }, [subPgNum2]);

  useEffect(() => {
    if (customOptionData !== null) {
      if (tabSelected == 1) {
        fetchSubGrid();
      } else if (tabSelected == 2) {
        fetchSubGrid2();
      }
    }
  }, [tabSelected]);

  //그리드 리셋
  const resetAllGrid = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setSubPgNum2(1);
    setSubDataResult2(process([], subDataState2));
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);
    setyn(true);
    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "U",
      custcd: selectedRowData.custcd,
      custnm: selectedRowData.custnm,
      custdiv: selectedRowData.custdiv,
      custabbr: selectedRowData.custabbr,
      compnm_eng: selectedRowData.compnm_eng,
      inunpitem: selectedRowData.inunpitem,
      bizregnum: selectedRowData.bizregnum,
      zipcode: selectedRowData.zipcode,
      area: selectedRowData.area,
      unpitem: selectedRowData.unpitem,
      ceonm: selectedRowData.ceonm,
      address: selectedRowData.address,
      bizdiv: selectedRowData.bizdiv,
      repreregno: selectedRowData.repreregno,
      address_eng: selectedRowData.address_eng,
      estbdt: isValidDate(selectedRowData.estbdt)
        ? new Date(dateformat(selectedRowData.estbdt))
        : null,
      phonenum: selectedRowData.phonenum,
      bnkinfo: selectedRowData.bnkinfo,
      bankacntuser: selectedRowData.bankacntuser,
      compclass: selectedRowData.compclass,
      etelnum: selectedRowData.etelnum,
      bankacnt: selectedRowData.bankacnt,
      comptype: selectedRowData.comptype,
      faxnum: selectedRowData.faxnum,
      bnkinfo2: selectedRowData.bnkinfo2,
      bankacnt2: selectedRowData.bankacnt2,
      taxorg: selectedRowData.taxorg,
      efaxnum: selectedRowData.efaxnum,
      email: selectedRowData.email,
      taxortnm: selectedRowData.taxortnm,
      useyn: selectedRowData.useyn == "Y" ? "Y" : "N",
      scmyn: selectedRowData.scmyn == "Y" ? "Y" : "N",
      pariodyn: selectedRowData.pariodyn == "Y" ? "Y" : "N",
      attdatnum: selectedRowData.attdatnum,
      itemlvl1: selectedRowData.itemlvl1,
      itemlvl2: selectedRowData.itemlvl2,
      itemlvl3: selectedRowData.itemlvl3,
      etax: selectedRowData.etax,
      remark: selectedRowData.remark,
      etxprs: selectedRowData.etxprs,
      phonenum_og: selectedRowData.phonenum_og,
      emailaddr_og: selectedRowData.emailaddr_og,
      bill_type: selectedRowData.bill_type,
      recvid: selectedRowData.recvid,
      rtxisuyn: selectedRowData.rtxisuyn,
      files: selectedRowData.files,
      auto: selectedRowData.auto,
    });
    setIfSelectFirstRow(true)
    if (tabSelected == 1) {
      setsubFilters((prev) => ({
        ...prev,
        workType: "CustPerson",
        useyn: selectedRowData.useyn,
        custcd: selectedRowData.custcd,
        custnm: selectedRowData.custnm,
        custdiv: selectedRowData.custdiv,
        bizregnum: selectedRowData.bizregnum,
        ceonm: selectedRowData.ceonm,
      }));
    } else if (tabSelected == 2) {
      setsubFilters2((prev) => ({
        ...prev,
        workType: "MONEY",
        useyn: selectedRowData.useyn,
        custcd: selectedRowData.custcd,
        custnm: selectedRowData.custnm,
        custdiv: selectedRowData.custdiv,
        bizregnum: selectedRowData.bizregnum,
        ceonm: selectedRowData.ceonm,
      }));
    }
  };

  const onSubDataSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState,
      dataItemKey: SUB_DATA_ITEM_KEY,
    });
    setSelectedsubDataState(newSelectedState);
  };

  const onSubDataSelectionChange2 = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedsubDataState2,
      dataItemKey: SUB_DATA_ITEM_KEY2,
    });
    setSelectedsubDataState2(newSelectedState);
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
      setIfSelectFirstRow(false);
  };

  const onSubScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum, PAGE_SIZE))
      setSubPgNum((prev) => prev + 1);
  };

  const onSubScrollHandler2 = (event: GridEvent) => {
    if (chkScrollHandler(event, subPgNum2, PAGE_SIZE))
      setSubPgNum2((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSubDataStateChange = (event: GridDataStateChangeEvent) => {
    setSubDataState(event.dataState);
  };

  const onSubDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setSubDataState2(event.dataState);
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

  const gridSumQtyFooterCell = (props: GridFooterCellProps) => {
    let sum = 0;
    subDataResult2.data.forEach((item) =>
      props.field !== undefined ? (sum += item[props.field]) : ""
    );
    var parts = sum.toString().split(".");
    return (
      <td colSpan={props.colSpan} style={{ textAlign: "right" }}>
        {parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          (parts[1] ? "." + parts[1] : "")}
      </td>
    );
  };
  const onAddClick2 = () => {
    setWorkType("N");
    setInfomation({
      pgSize: PAGE_SIZE,
      workType: "N",
      custcd: "자동생성",
      custnm: "",
      custdiv: "",
      custabbr: "",
      compnm_eng: "",
      inunpitem: "",
      bizregnum: "",
      zipcode: 0,
      area: "",
      unpitem: "",
      ceonm: "",
      address: "",
      bizdiv: "",
      repreregno: "",
      address_eng: "",
      estbdt: new Date(),
      phonenum: "",
      bnkinfo: "",
      bankacntuser: "",
      compclass: "",
      etelnum: "",
      bankacnt: "",
      comptype: "",
      faxnum: "",
      bnkinfo2: "",
      bankacnt2: "",
      taxorg: "",
      efaxnum: "",
      email: "",
      taxortnm: "",
      useyn: "N",
      scmyn: "N",
      pariodyn: "",
      attdatnum: "",
      itemlvl1: "",
      itemlvl2: "",
      itemlvl3: "",
      etax: "",
      remark: "",
      etxprs: "",
      phonenum_og: "",
      emailaddr_og: "",
      bill_type: "",
      recvid: "",
      rtxisuyn: "N",
      files: "",
      auto: "Y",
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
      recdt: convertDateToStr(new Date()),
      attdatnum: "",
      custcd: infomation.custcd,
      custprsncd: "",
      dptnm: "",
      email: "",
      files: "",
      insert_form_id: "",
      insert_pc: "",
      insert_time: "",
      insert_userid: "",
      phoneno: "",
      prsnnm: "",
      remark: "",
      rtrchk: "N",
      sort_seq: 0,
      telno: "",
      update_form_id: "BA_A0020",
      update_pc: "",
      update_time: "",
      update_userid: "",
      rowstatus: "N",
    };
    setSelectedsubDataState({ [newDataItem.num]: true });
    setSubDataResult((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onAddClick3 = () => {
    let seq = 1;

    if (subDataResult2.total > 0) {
      subDataResult2.data.forEach((item) => {
        if (item[SUB_DATA_ITEM_KEY2] > seq) {
          seq = item[SUB_DATA_ITEM_KEY2];
        }
      });
      seq++;
    }

    const newDataItem = {
      [SUB_DATA_ITEM_KEY2]: seq,
      custcd: infomation.custcd,
      current_income: 0,
      dedt_ratio: 0,
      operating_profits: 0,
      paid_up_capital: 0,
      ramark: "",
      salesmoney: 0,
      seq: 0,
      totasset: 0,
      totcapital: 0,
      yyyy: "",
      inEdit: "yyyy",
      rowstatus: "N",
    };
    setSelectedsubDataState2({ [newDataItem.num]: true });
    setSubDataResult2((prev) => {
      return {
        data: [...prev.data, newDataItem],
        total: prev.total + 1,
      };
    });
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const handleSelectTab = (e: any) => {
    setTabSelected(e.selected);
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setSubPgNum2(1);
    setSubDataResult2(process([], subDataState2));
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const [attachmentsWindowVisible2, setAttachmentsWindowVisible2] =
    useState<boolean>(false);

  const getAttachmentsData2 = (data: IAttachmentData) => {
    const datas = subDataResult.data.map((item: any) =>
      item.num == rows
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
    remark_s: string[];
    custprsncd_s: string[];
    prsnnm_s: string[];
    dptnm: string[];
    postcd_s: string[];
    telno: string[];
    phoneno_s: string[];
    email_s: string[];
    rtrchk_s: string[];
    attdatnum_s: string[];
    sort_seq_s: string[];
  };

  type TdataArr2 = {
    rowstatus: string[];
    remark_s: string[];
    seq_s: string[];
    yyyy_s: string[];
    totasset_s: string[];
    paid_up_capital_s: string[];
    totcaptial_s: string[];
    salesmoney_s: string[];
    operating_profits_s: string[];
    current_income_s: string[];
    dedt_rati_s: string[];
  };
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

  const onSubDataSortChange = (e: any) => {
    setSubDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onSubDataSortChange2 = (e: any) => {
    setSubDataState2((prev) => ({ ...prev, sort: e.sort }));
  };

  const search = () => {
    setMainPgNum(1);
    setMainDataResult(process([], mainDataState));
    setSubPgNum(1);
    setSubDataResult(process([], subDataState));
    setSubPgNum2(1);
    setSubDataResult2(process([], subDataState2));
    fetchMainGrid();
    fetchSubGrid();
    fetchSubGrid2();
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

  const onSubItemChange2 = (event: GridItemChangeEvent) => {
    setSubDataState2((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      subDataResult2,
      setSubDataResult2,
      SUB_DATA_ITEM_KEY2
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

  const enterEdit2 = (dataItem: any, field: string) => {
    if (field != "rowstatus") {
      const newData = subDataResult2.data.map((item) =>
        item[SUB_DATA_ITEM_KEY2] === dataItem[SUB_DATA_ITEM_KEY2]
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

      setSubDataResult2((prev) => {
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

  const exitEdit2 = () => {
    const newData = subDataResult2.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));

    setSubDataResult2((prev) => {
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

  const customCellRender2 = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit2}
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

  const customRowRender2 = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit2}
      editField={EDIT_FIELD}
    />
  );

  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    custcd: "",
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

  const onDeleteClick3 = (e: any) => {
    let newData: any[] = [];

    subDataResult2.data.forEach((item: any, index: number) => {
      if (!selectedsubDataState2[item[SUB_DATA_ITEM_KEY2]]) {
        newData.push(item);
      } else {
        const newData2 = {
          ...item,
          rowstatus: "D",
        };
        deletedMainRows2.push(newData2);
      }
    });
    setSubDataResult2((prev) => ({
      data: newData,
      total: newData.length,
    }));

    setSubDataState2({});
  };
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick2 = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }

    const item = Object.getOwnPropertyNames(selectedState)[0];
    setParaDataDeleted((prev) => ({
      ...prev,
      work_type: "D",
      custcd: item,
    }));
  };

  const [paraData, setParaData] = useState({
    workType: "CustPerson",
    orgdiv: "01",
    custcd: "",
    custnm: "",
    custdiv: "",
    custabbr: "",
    bizdiv: "",
    bizregnum: "",
    ceonm: "",
    repreregno: "",
    comptype: "",
    compclass: "",
    zipcode: 0,
    address: "",
    phonenum: "",
    faxnum: "",
    estbdt: new Date(),
    compnm_eng: "",
    address_eng: "",
    bnkinfo: "",
    etelnum: "",
    efaxnum: "",
    unpitem: "",
    useyn: "",
    remark: "",
    attdatnum: "",
    bill_type: "",
    recvid: "",
    rtxisuyn: "",
    etxprs: "",
    emailaddr_og: "",
    phonenum_og: "",
    etax: "",
    inunpitem: "",
    email: "",
    itemlvl1: "",
    itemlvl2: "",
    itemlvl3: "",
    bankacnt: "",
    bankacntuser: "",
    scmyn: "",
    pariodyn: "",
    bnkinfo2: "",
    bankacnt2: "",
    area: "",
    rowstatus: "",
    remark_s: "",
    custprsncd_s: "",
    prsnnm_s: "",
    dptnm: "",
    postcd_s: "",
    telno: "",
    phoneno_s: "",
    email_s: "",
    rtrchk_s: "",
    attdatnum_s: "",
    sort_seq_s: "",
    seq_s: "",
    yyyy_s: "",
    totasset_s: "",
    paid_up_capital_s: "",
    totcapital_s: "",
    salesmoney_s: "",
    operating_profits_s: "",
    current_income_s: "",
    dedt_rati_s: "",
    user_id: userId,
    pc: pc,
    form_id: "BA_A0020W",
    company_code: "2207A046",
    auto: "Y",
  });

  const para: Iparameters = {
    procedureName: "P_BA_A0020W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.workType,
      "@p_orgdiv": "01",
      "@p_location": "01",
      "@p_auto": paraData.auto,
      "@p_custcd": paraData.custcd,
      "@p_custnm": paraData.custnm,
      "@p_custdiv":
        custdivListData.find(
          (item: any) => item.code_name === infomation.custdiv
        )?.sub_code == undefined
          ? ""
          : custdivListData.find(
              (item: any) => item.code_name === infomation.custdiv
            )?.sub_code,
      "@p_custabbr": paraData.custabbr,
      "@p_bizdiv":
        bizdivListData.find((item: any) => item.code_name === infomation.bizdiv)
          ?.sub_code == undefined
          ? ""
          : bizdivListData.find(
              (item: any) => item.code_name === infomation.bizdiv
            )?.sub_code,
      "@p_bizregnum": paraData.bizregnum,
      "@p_ceonm": paraData.ceonm,
      "@p_repreregno": paraData.repreregno,
      "@p_comptype": paraData.comptype,
      "@p_compclass": paraData.compclass,
      "@p_zipcode": paraData.zipcode,
      "@p_address": paraData.address,
      "@p_phonenum": paraData.phonenum,
      "@p_faxnum": paraData.faxnum,
      "@p_estbdt": convertDateToStr(paraData.estbdt),
      "@p_compnm_eng": paraData.compnm_eng,
      "@p_address_eng": paraData.address_eng,
      "@p_bnkinfo": paraData.bnkinfo,
      "@p_etelnum": paraData.etelnum,
      "@p_efaxnum": paraData.efaxnum,
      "@p_unpitem": paraData.unpitem,
      "@p_useyn": paraData.useyn,
      "@p_remark": paraData.remark,
      "@p_attdatnum": paraData.attdatnum,
      "@p_bill_type": paraData.bill_type,
      "@p_recvid": paraData.recvid,
      "@p_rtxisuyn": paraData.rtxisuyn,
      "@p_etxprs": paraData.etxprs,
      "@p_emailaddr_og": paraData.emailaddr_og,
      "@p_phonenum_og": paraData.phonenum_og,
      "@p_etax": paraData.etax,
      "@p_inunpitem": paraData.inunpitem,
      "@p_email": paraData.email,
      "@p_itemlvl1": paraData.itemlvl1,
      "@p_itemlvl2": paraData.itemlvl2,
      "@p_itemlvl3": paraData.itemlvl3,
      "@p_bankacnt": paraData.bankacnt,
      "@p_bankacntuser": paraData.bankacntuser,
      "@p_scmyn": paraData.scmyn,
      "@p_periodyn": paraData.pariodyn == undefined ? "" : paraData.pariodyn,
      "@p_bnkinfo2": paraData.bnkinfo2,
      "@p_bankacnt2": paraData.bankacnt2,
      "@p_area": paraData.area,
      "@p_rowstatus_s": paraData.rowstatus,
      "@p_remark_s": paraData.remark_s,
      "@p_custprsncd_s": paraData.custprsncd_s,
      "@p_prsnnm_s": paraData.prsnnm_s,
      "@p_dptnm_s": paraData.dptnm,
      "@p_postcd_s": paraData.postcd_s,
      "@p_telno_s": paraData.telno,
      "@p_phoneno_s": paraData.phoneno_s,
      "@p_email_s": paraData.email_s,
      "@p_rtrchk_s": paraData.rtrchk_s,
      "@p_attdatnum_s": paraData.attdatnum_s,
      "@p_sort_seq_s": paraData.sort_seq_s,
      "@p_seq_s": paraData.seq_s,
      "@p_yyyy_s": paraData.yyyy_s,
      "@p_totasset_s": paraData.totasset_s,
      "@p_paid_up_capital_s": paraData.paid_up_capital_s,
      "@p_totcapital_s": paraData.totcapital_s,
      "@p_salesmoney_s": paraData.salesmoney_s,
      "@p_operating_profits_s": paraData.operating_profits_s,
      "@p_current_income_s": paraData.current_income_s,
      "@p_dedt_rati_s": paraData.dedt_rati_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "BA_A0020W",
      "@p_company_code": "2207A046",
    },
  };

  const paraDeleted: Iparameters = {
    procedureName: "P_BA_A0020W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": "01",
      "@p_location": "01",
      "@p_auto": infomation.auto,
      "@p_custcd": paraDataDeleted.custcd,
      "@p_custnm": infomation.custnm,
      "@p_custdiv": custdivListData.find(
        (item: any) => item.code_name === infomation.custdiv
      )?.sub_code,
      "@p_custabbr": infomation.custabbr,
      "@p_bizdiv": bizdivListData.find(
        (item: any) => item.code_name === infomation.bizdiv
      )?.sub_code,
      "@p_bizregnum": infomation.bizregnum,
      "@p_ceonm": infomation.ceonm,
      "@p_repreregno": infomation.repreregno,
      "@p_comptype": infomation.comptype,
      "@p_compclass": infomation.compclass,
      "@p_zipcode": infomation.zipcode,
      "@p_address": infomation.address,
      "@p_phonenum": infomation.phonenum,
      "@p_faxnum": infomation.faxnum,
      "@p_estbdt": convertDateToStr(infomation.estbdt),
      "@p_compnm_eng": infomation.compnm_eng,
      "@p_address_eng": infomation.address_eng,
      "@p_bnkinfo": infomation.bnkinfo,
      "@p_etelnum": infomation.etelnum,
      "@p_efaxnum": infomation.efaxnum,
      "@p_unpitem": infomation.unpitem,
      "@p_useyn": infomation.useyn,
      "@p_remark": infomation.remark,
      "@p_attdatnum": infomation.attdatnum,
      "@p_bill_type": infomation.bill_type,
      "@p_recvid": infomation.recvid,
      "@p_rtxisuyn": infomation.rtxisuyn,
      "@p_etxprs": infomation.etxprs,
      "@p_emailaddr_og": infomation.emailaddr_og,
      "@p_phonenum_og": infomation.phonenum_og,
      "@p_etax": infomation.etax,
      "@p_inunpitem": infomation.inunpitem,
      "@p_email": infomation.email,
      "@p_itemlvl1": infomation.itemlvl1,
      "@p_itemlvl2": infomation.itemlvl2,
      "@p_itemlvl3": infomation.itemlvl3,
      "@p_bankacnt": infomation.bankacnt,
      "@p_bankacntuser": infomation.bankacntuser,
      "@p_scmyn": infomation.scmyn,
      "@p_periodyn": "",
      "@p_bnkinfo2": infomation.bnkinfo2,
      "@p_bankacnt2": infomation.bankacnt2,
      "@p_area": infomation.area,
      "@p_rowstatus_s": "",
      "@p_remark_s": "",
      "@p_custprsncd_s": "",
      "@p_prsnnm_s": "",
      "@p_dptnm_s": "",
      "@p_postcd_s": "",
      "@p_telno_s": "",
      "@p_phoneno_s": "",
      "@p_email_s": "",
      "@p_rtrchk_s": "",
      "@p_attdatnum_s": "",
      "@p_sort_seq_s": "",
      "@p_seq_s": "",
      "@p_yyyy_s": "",
      "@p_totasset_s": "",
      "@p_paid_up_capital_s": "",
      "@p_totcapital_s": "",
      "@p_salesmoney_s": "",
      "@p_operating_profits_s": "",
      "@p_current_income_s": "",
      "@p_dedt_rati_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "BA_A0020W",
      "@p_company_code": "2207A046",
    },
  };

  const infopara: Iparameters = {
    procedureName: "P_BA_A0020W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": infomation.workType,
      "@p_orgdiv": "01",
      "@p_location": "01",
      "@p_auto": infomation.auto,
      "@p_custcd": infomation.custcd,
      "@p_custnm": infomation.custnm,
      "@p_custdiv":
        custdivListData.find(
          (item: any) => item.code_name === infomation.custdiv
        )?.sub_code == undefined
          ? infomation.custdiv
          : custdivListData.find(
              (item: any) => item.code_name === infomation.custdiv
            )?.sub_code,
      "@p_custabbr": infomation.custabbr,
      "@p_bizdiv":
        bizdivListData.find((item: any) => item.code_name === infomation.bizdiv)
          ?.sub_code == undefined
          ? infomation.bizdiv
          : bizdivListData.find(
              (item: any) => item.code_name === infomation.bizdiv
            )?.sub_code,
      "@p_bizregnum": infomation.bizregnum,
      "@p_ceonm": infomation.ceonm,
      "@p_repreregno": infomation.repreregno,
      "@p_comptype": infomation.comptype,
      "@p_compclass": infomation.compclass,
      "@p_zipcode": infomation.zipcode,
      "@p_address": infomation.address,
      "@p_phonenum": infomation.phonenum,
      "@p_faxnum": infomation.faxnum,
      "@p_estbdt": convertDateToStr(infomation.estbdt),
      "@p_compnm_eng": infomation.compnm_eng,
      "@p_address_eng": infomation.address_eng,
      "@p_bnkinfo": infomation.bnkinfo,
      "@p_etelnum": infomation.etelnum,
      "@p_efaxnum": infomation.efaxnum,
      "@p_unpitem": infomation.unpitem,
      "@p_useyn": infomation.useyn,
      "@p_remark": infomation.remark,
      "@p_attdatnum": infomation.attdatnum,
      "@p_bill_type": infomation.bill_type,
      "@p_recvid": infomation.recvid,
      "@p_rtxisuyn": infomation.rtxisuyn,
      "@p_etxprs": infomation.etxprs,
      "@p_emailaddr_og": infomation.emailaddr_og,
      "@p_phonenum_og": infomation.phonenum_og,
      "@p_etax": infomation.etax,
      "@p_inunpitem": infomation.inunpitem,
      "@p_email": infomation.email,
      "@p_itemlvl1": infomation.itemlvl1,
      "@p_itemlvl2": infomation.itemlvl2,
      "@p_itemlvl3": infomation.itemlvl3,
      "@p_bankacnt": infomation.bankacnt,
      "@p_bankacntuser": infomation.bankacntuser,
      "@p_scmyn": infomation.scmyn,
      "@p_periodyn": "",
      "@p_bnkinfo2": infomation.bnkinfo2,
      "@p_bankacnt2": infomation.bankacnt2,
      "@p_area": infomation.area,
      "@p_rowstatus_s": "",
      "@p_remark_s": "",
      "@p_custprsncd_s": "",
      "@p_prsnnm_s": "",
      "@p_dptnm_s": "",
      "@p_postcd_s": "",
      "@p_telno_s": "",
      "@p_phoneno_s": "",
      "@p_email_s": "",
      "@p_rtrchk_s": "",
      "@p_attdatnum_s": "",
      "@p_sort_seq_s": "",
      "@p_seq_s": "",
      "@p_yyyy_s": "",
      "@p_totasset_s": "",
      "@p_paid_up_capital_s": "",
      "@p_totcapital_s": "",
      "@p_salesmoney_s": "",
      "@p_operating_profits_s": "",
      "@p_current_income_s": "",
      "@p_dedt_rati_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "BA_A0020W",
      "@p_company_code": "2207A046",
    },
  };

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  const onSaveClick = async () => {
    let valid = true;
    const dataItem = subDataResult.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });
    try {
      subDataResult.data.map((item: any) => {
        if (item.prsnnm == "") {
          throw findMessage(messagesData, "BA_A0020W_008");
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }
    if (!valid) return false;
    if (dataItem.length === 0 && deletedMainRows.length === 0) return false;
    let dataArr: TdataArr = {
      rowstatus: [],
      remark_s: [],
      custprsncd_s: [],
      prsnnm_s: [],
      dptnm: [],
      postcd_s: [],
      telno: [],
      phoneno_s: [],
      email_s: [],
      rtrchk_s: [],
      attdatnum_s: [],
      sort_seq_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        remark = "",
        custprsncd = "",
        custprsncd_s = "",
        prsnnm = "",
        prsnnm_s = "",
        dptnm = "",
        postcd_s = "",
        telno = "",
        phoneno = "",
        email = "",
        rtrchk = "",
        attdatnum = "",
        sort_seq = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.remark_s.push(remark);
      dataArr.custprsncd_s.push(custprsncd);
      dataArr.prsnnm_s.push(prsnnm);
      dataArr.dptnm.push(dptnm);
      dataArr.postcd_s.push(postcd_s);
      dataArr.telno.push(telno);
      dataArr.phoneno_s.push(phoneno);
      dataArr.email_s.push(email);
      dataArr.rtrchk_s.push(rtrchk == true || rtrchk == "Y" ? "Y" : "N");
      dataArr.attdatnum_s.push(attdatnum);
      dataArr.sort_seq_s.push(sort_seq);
    });
    deletedMainRows.forEach(async (item: any, idx: number) => {
      const paraD: Iparameters = {
        procedureName: "P_BA_A0020W_S",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": "CustPerson",
          "@p_orgdiv": "01",
          "@p_location": infomation.auto,
          "@p_custcd": infomation.custcd,
          "@p_custnm": infomation.custnm,
          "@p_custdiv": infomation.custdiv,
          "@p_custabbr": infomation.custabbr,
          "@p_bizdiv": infomation.bizdiv,
          "@p_bizregnum": infomation.bizregnum,
          "@p_ceonm": infomation.ceonm,
          "@p_repreregno": infomation.repreregno,
          "@p_comptype": infomation.comptype,
          "@p_compclass": infomation.compclass,
          "@p_zipcode": infomation.zipcode,
          "@p_address": infomation.address,
          "@p_phonenum": infomation.phonenum,
          "@p_faxnum": infomation.faxnum,
          "@p_estbdt": convertDateToStr(infomation.estbdt),
          "@p_compnm_eng": infomation.compnm_eng,
          "@p_address_eng": infomation.address_eng,
          "@p_bnkinfo": infomation.bnkinfo,
          "@p_etelnum": infomation.etelnum,
          "@p_efaxnum": infomation.efaxnum,
          "@p_unpitem": infomation.unpitem,
          "@p_useyn": infomation.useyn,
          "@p_remark": infomation.remark,
          "@p_attdatnum": infomation.attdatnum,
          "@p_bill_type": infomation.bill_type,
          "@p_recvid": infomation.recvid,
          "@p_rtxisuyn": infomation.rtxisuyn,
          "@p_etxprs": infomation.etxprs,
          "@p_emailaddr_og": infomation.emailaddr_og,
          "@p_phonenum_og": infomation.phonenum_og,
          "@p_etax": infomation.etax,
          "@p_inunpitem": infomation.inunpitem,
          "@p_email": infomation.email,
          "@p_itemlvl1": infomation.itemlvl1,
          "@p_itemlvl2": infomation.itemlvl2,
          "@p_itemlvl3": infomation.itemlvl3,
          "@p_bankacnt": infomation.bankacnt,
          "@p_bankacntuser": infomation.bankacntuser,
          "@p_scmyn": infomation.scmyn,
          "@p_periodyn":
            infomation.pariodyn == undefined ? "" : infomation.pariodyn,
          "@p_bnkinfo2": infomation.bnkinfo2,
          "@p_bankacnt2": infomation.bankacnt2,
          "@p_area": infomation.area,
          "@p_rowstatus_s": item.rowstatus,
          "@p_remark_s": item.remark,
          "@p_custprsncd_s": item.custprsncd,
          "@p_prsnnm_s": item.prsnnm,
          "@p_dptnm_s": item.dptnm,
          "@p_postcd_s": "",
          "@p_telno_s": item.telno,
          "@p_phoneno_s": item.phoneno,
          "@p_email_s": item.email,
          "@p_rtrchk_s": item.rtrchk == true || item.rtrchk == "Y" ? "Y" : "N",
          "@p_attdatnum_s": item.attdatnum,
          "@p_sort_seq_s": item.sort_seq,
          "@p_seq_s": "",
          "@p_yyyy_s": "",
          "@p_totasset_s": "",
          "@p_paid_up_capital_s": "",
          "@p_totcapital_s": "",
          "@p_salesmoney_s": "",
          "@p_operating_profits_s": "",
          "@p_current_income_s": "",
          "@p_dedt_rati_s": "",
          "@p_userid": userId,
          "@p_pc": pc,
          "@p_form_id": "BA_A0020W",
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
    const item = Object.getOwnPropertyNames(selectedState)[0];

    setParaData((prev) => ({
      ...prev,
      workType: "CustPerson",
      custcd: item.toString(),
      custnm: infomation.custnm,
      custdiv: infomation.custdiv,
      custabbr: infomation.custabbr,
      bizdiv: infomation.bizdiv,
      bizregnum: infomation.bizregnum,
      ceonm: infomation.ceonm,
      repreregno: infomation.repreregno,
      comptype: infomation.comptype,
      compclass: infomation.compclass,
      zipcode: infomation.zipcode,
      address: infomation.address,
      phonenum: infomation.phonenum,
      faxnum: infomation.faxnum,
      estbdt: infomation.estbdt,
      compnm_eng: infomation.compnm_eng,
      address_eng: infomation.address_eng,
      bnkinfo: infomation.bnkinfo,
      etelnum: infomation.etelnum,
      efaxnum: infomation.efaxnum,
      unpitem: infomation.unpitem,
      useyn: infomation.useyn,
      remark: infomation.remark,
      attdatnum: infomation.attdatnum,
      bill_type: infomation.bill_type,
      recvid: infomation.recvid,
      rtxisuyn: infomation.rtxisuyn,
      etxprs: infomation.etxprs,
      emailaddr_og: infomation.emailaddr_og,
      phonenum_og: infomation.phonenum_og,
      etax: infomation.etax,
      inunpitem: infomation.inunpitem,
      email: infomation.email,
      itemlvl1: infomation.itemlvl1,
      itemlvl2: infomation.itemlvl2,
      itemlvl3: infomation.itemlvl3,
      bankacnt: infomation.bankacnt,
      bankacntuser: infomation.bankacntuser,
      scmyn: infomation.scmyn,
      pariodyn: infomation.pariodyn,
      bnkinfo2: infomation.bnkinfo2,
      bankacnt2: infomation.bankacnt2,
      area: infomation.area,
      remark_s: dataArr.remark_s.join("|"),
      rowstatus: dataArr.rowstatus.join("|"),
      prsnnm_s: dataArr.prsnnm_s.join("|"),
      custprsncd_s: dataArr.custprsncd_s.join("|"),
      dptnm: dataArr.dptnm.join("|"),
      postcd_s: dataArr.postcd_s.join("|"),
      telno: dataArr.telno.join("|"),
      phoneno_s: dataArr.phoneno_s.join("|"),
      email_s: dataArr.email_s.join("|"),
      rtrchk_s: dataArr.rtrchk_s.join("|"),
      attdatnum_s: dataArr.attdatnum_s.join("|"),
      sort_seq_s: dataArr.sort_seq_s.join("|"),
      seq_s: "",
      yyyy_s: "",
      totasset_s: "",
      paid_up_capital_s: "",
      totcapital_s: "",
      salesmoney_s: "",
      operating_profits_s: "",
      current_income_s: "",
      dedt_rati_s: "",
    }));
  };

  const onSaveClick3 = async () => {
    let valid = true;
    try {
      subDataResult2.data.map((item: any) => {
        if (
          item.yyyy.substring(0, 4) < "1997" ||
          item.yyyy.substring(0, 4).length != 4
        ) {
          throw findMessage(messagesData, "BA_A0020W_007");
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    const dataItem = subDataResult2.data.filter((item: any) => {
      return (
        (item.rowstatus === "N" || item.rowstatus === "U") &&
        item.rowstatus !== undefined
      );
    });

    if (dataItem.length === 0 && deletedMainRows2.length === 0) return false;
    let dataArr: TdataArr2 = {
      rowstatus: [],
      remark_s: [],
      seq_s: [],
      yyyy_s: [],
      totasset_s: [],
      paid_up_capital_s: [],
      totcaptial_s: [],
      salesmoney_s: [],
      operating_profits_s: [],
      current_income_s: [],
      dedt_rati_s: [],
    };
    dataItem.forEach((item: any, idx: number) => {
      const {
        rowstatus = "",
        remark = "",
        current_income = 0,
        dedt_ratio = 0,
        operating_profits = 0,
        paid_up_capital = 0,
        salesmoney = 0,
        seq = 0,
        totasset = 0,
        totcapital = 0,
        yyyy = "",
      } = item;

      dataArr.rowstatus.push(rowstatus);
      dataArr.remark_s.push(remark);
      dataArr.seq_s.push(seq);
      dataArr.yyyy_s.push(yyyy.substring(0, 4));
      dataArr.totasset_s.push(totasset);
      dataArr.paid_up_capital_s.push(paid_up_capital);
      dataArr.totcaptial_s.push(totcapital);
      dataArr.salesmoney_s.push(salesmoney);
      dataArr.operating_profits_s.push(operating_profits);
      dataArr.current_income_s.push(current_income);
      dataArr.dedt_rati_s.push(dedt_ratio);
    });
    deletedMainRows2.forEach(async (item: any, idx: number) => {
      const paraD: Iparameters = {
        procedureName: "P_BA_A0020W_S",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": "MONEY",
          "@p_orgdiv": "01",
          "@p_location": "01",
          "@p_auto": infomation.auto,
          "@p_custcd": infomation.custcd,
          "@p_custnm": infomation.custnm,
          "@p_custdiv": infomation.custdiv,
          "@p_custabbr": infomation.custabbr,
          "@p_bizdiv": infomation.bizdiv,
          "@p_bizregnum": infomation.bizregnum,
          "@p_ceonm": infomation.ceonm,
          "@p_repreregno": infomation.repreregno,
          "@p_comptype": infomation.comptype,
          "@p_compclass": infomation.compclass,
          "@p_zipcode": infomation.zipcode,
          "@p_address": infomation.address,
          "@p_phonenum": infomation.phonenum,
          "@p_faxnum": infomation.faxnum,
          "@p_estbdt": convertDateToStr(infomation.estbdt),
          "@p_compnm_eng": infomation.compnm_eng,
          "@p_address_eng": infomation.address_eng,
          "@p_bnkinfo": infomation.bnkinfo,
          "@p_etelnum": infomation.etelnum,
          "@p_efaxnum": infomation.efaxnum,
          "@p_unpitem": infomation.unpitem,
          "@p_useyn": infomation.useyn,
          "@p_remark": infomation.remark,
          "@p_attdatnum": infomation.attdatnum,
          "@p_bill_type": infomation.bill_type,
          "@p_recvid": infomation.recvid,
          "@p_rtxisuyn": infomation.rtxisuyn,
          "@p_etxprs": infomation.etxprs,
          "@p_emailaddr_og": infomation.emailaddr_og,
          "@p_phonenum_og": infomation.phonenum_og,
          "@p_etax": infomation.etax,
          "@p_inunpitem": infomation.inunpitem,
          "@p_email": infomation.email,
          "@p_itemlvl1": infomation.itemlvl1,
          "@p_itemlvl2": infomation.itemlvl2,
          "@p_itemlvl3": infomation.itemlvl3,
          "@p_bankacnt": infomation.bankacnt,
          "@p_bankacntuser": infomation.bankacntuser,
          "@p_scmyn": infomation.scmyn,
          "@p_periodyn":
            infomation.pariodyn == undefined ? "" : infomation.pariodyn,
          "@p_bnkinfo2": infomation.bnkinfo2,
          "@p_bankacnt2": infomation.bankacnt2,
          "@p_area": infomation.area,
          "@p_rowstatus_s": item.rowstatus,
          "@p_remark_s": item.remark,
          "@p_custprsncd_s": "",
          "@p_prsnnm_s": "",
          "@p_dptnm_s": "",
          "@p_postcd_s": "",
          "@p_telno_s": "",
          "@p_phoneno_s": "",
          "@p_email_s": "",
          "@p_rtrchk_s": "",
          "@p_attdatnum_s": "",
          "@p_sort_seq_s": "",
          "@p_seq_s": item.seq,
          "@p_yyyy_s": item.yyyy,
          "@p_totasset_s": item.totasset,
          "@p_paid_up_capital_s": item.paid_up_capital,
          "@p_totcapital_s": item.totcapital,
          "@p_salesmoney_s": item.salesmoney,
          "@p_operating_profits_s": item.operating_profits,
          "@p_current_income_s": item.current_income,
          "@p_dedt_rati_s": item.dedt_ratio,
          "@p_userid": userId,
          "@p_pc": pc,
          "@p_form_id": "BA_A0020W",
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
    deletedMainRows2 = [];
    const item = Object.getOwnPropertyNames(selectedState)[0];

    setParaData((prev) => ({
      ...prev,
      workType: "MONEY",
      custcd: item.toString(),
      custnm: infomation.custnm,
      custdiv: infomation.custdiv,
      custabbr: infomation.custabbr,
      bizdiv: infomation.bizdiv,
      bizregnum: infomation.bizregnum,
      ceonm: infomation.ceonm,
      repreregno: infomation.repreregno,
      comptype: infomation.comptype,
      compclass: infomation.compclass,
      zipcode: infomation.zipcode,
      address: infomation.address,
      phonenum: infomation.phonenum,
      faxnum: infomation.faxnum,
      estbdt: infomation.estbdt,
      compnm_eng: infomation.compnm_eng,
      address_eng: infomation.address_eng,
      bnkinfo: infomation.bnkinfo,
      etelnum: infomation.etelnum,
      efaxnum: infomation.efaxnum,
      unpitem: infomation.unpitem,
      useyn: infomation.useyn,
      remark: infomation.remark,
      attdatnum: infomation.attdatnum,
      bill_type: infomation.bill_type,
      recvid: infomation.recvid,
      rtxisuyn: infomation.rtxisuyn,
      etxprs: infomation.etxprs,
      emailaddr_og: infomation.emailaddr_og,
      phonenum_og: infomation.phonenum_og,
      etax: infomation.etax,
      inunpitem: infomation.inunpitem,
      email: infomation.email,
      itemlvl1: infomation.itemlvl1,
      itemlvl2: infomation.itemlvl2,
      itemlvl3: infomation.itemlvl3,
      bankacnt: infomation.bankacnt,
      bankacntuser: infomation.bankacntuser,
      scmyn: infomation.scmyn,
      pariodyn: infomation.pariodyn,
      bnkinfo2: infomation.bnkinfo2,
      bankacnt2: infomation.bankacnt2,
      area: infomation.area,
      remark_s: dataArr.remark_s.join("|"),
      rowstatus: dataArr.rowstatus.join("|"),
      prsnnm_s: "",
      custprsncd_s: "",
      dptnm: "",
      postcd_s: "",
      telno: "",
      phoneno_s: "",
      email_s: "",
      rtrchk_s: "",
      attdatnum_s: "",
      sort_seq_s: "",
      seq_s: dataArr.seq_s.join("|"),
      yyyy_s: dataArr.yyyy_s.join("|"),
      totasset_s: dataArr.totasset_s.join("|"),
      paid_up_capital_s: dataArr.paid_up_capital_s.join("|"),
      totcapital_s: dataArr.totcaptial_s.join("|"),
      salesmoney_s: dataArr.salesmoney_s.join("|"),
      operating_profits_s: dataArr.operating_profits_s.join("|"),
      current_income_s: dataArr.current_income_s.join("|"),
      dedt_rati_s: dataArr.dedt_rati_s.join("|"),
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
    paraDataDeleted.custcd = "";
  };

  const onSaveClick2 = async () => {
    fetchSaved();
  };

  const fetchSaved = async () => {
    let data: any;

    let valid = true;
    try {
      if (!infomation.custnm) {
        throw findMessage(messagesData, "BA_A0020W_001");
      }

      if (!infomation.custdiv) {
        throw findMessage(messagesData, "BA_A0020W_002");
      }

      if (!infomation.bizdiv) {
        throw findMessage(messagesData, "BA_A0020W_003");
      }

      if (!infomation.inunpitem) {
        throw findMessage(messagesData, "BA_A0020W_004");
      }

      if (!infomation.unpitem) {
        throw findMessage(messagesData, "BA_A0020W_005");
      }

      if (
        convertDateToStr(infomation.estbdt).length != 8 ||
        convertDateToStr(infomation.estbdt).substring(0, 4) >
          convertDateToStr(new Date()).substring(0, 4) ||
        convertDateToStr(infomation.estbdt).substring(0, 4) < "1400"
      ) {
        throw findMessage(messagesData, "BA_A0020W_007");
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
      if (data.statusCode == "P_BA_A0020_S_001") {
        alert(data.resultMessage);
      }
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
      setSubPgNum2(2);
      setSubDataResult2(process([], subDataState2));
      fetchSubGrid();
      fetchSubGrid2();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (paraData.custcd != "") {
      fetchTodoGridSaved();
    }
  }, [paraData]);
  const [rows, setrows] = useState<number>(0);

  const CommandCell = (props: GridCellProps) => {
    const onEditClick = () => {
      //요약정보 행 클릭, 디테일 팝업 창 오픈 (수정용)
      const rowData = props.dataItem;
      setSubDataState({ [rowData[SUB_DATA_ITEM_KEY]]: true });
      setrows(rowData.num);
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

  const CheckChange = (event: CheckboxChangeEvent) => {
    setyn(event.value);
    let value = event.value == true ? "Y" : "N";
    if (value == "Y") {
      setInfomation((prev) => ({
        ...prev,
        auto: value,
        custcd: "자동생성",
      }));
    } else {
      setInfomation((prev) => ({
        ...prev,
        auto: value,
        custcd: "",
      }));
    }
  };

  return (
    <>
      <TitleContainer>
        <Title>업체관리</Title>

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
              <th>업체구분</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="custdiv"
                    value={filters.custdiv}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                  />
                )}
              </td>
            </tr>
            <tr>
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
              <th>대표자명</th>
              <td>
                <Input
                  name="ceonm"
                  type="text"
                  value={filters.ceonm}
                  onChange={filterInputChange}
                />
              </td>
              <th>사업자등록번호</th>
              <td>
                <Input
                  name="bizregnum"
                  type="text"
                  value={filters.bizregnum}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainerWrap>
        <GridContainer width={`30%`}>
          <ExcelExport
            data={mainDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridTitleContainer>
              <GridTitle>요약정보</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "76vh" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  custdiv: custdivListData.find(
                    (item: any) => item.sub_code === row.custdiv
                  )?.code_name,
                  bizdiv: bizdivListData.find(
                    (item: any) => item.sub_code === row.bizdiv
                  )?.code_name,
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
                        cell={
                          checkboxField.includes(item.fieldName)
                            ? CheckBoxCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0 ? mainTotalFooterCell : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </ExcelExport>
        </GridContainer>
        <GridContainer width={`calc(70% - ${GAP}px)`}>
          {tabSelected == 0 ? (
            <ButtonContainer style={{ float: "right" }}>
              <Button
                onClick={onAddClick2}
                fillMode="outline"
                themeColor={"primary"}
                icon="file-add"
              >
                신규
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
          ) : (
            <ButtonContainer
              style={{ float: "right", width: "250px", height: "30px" }}
            ></ButtonContainer>
          )}
          <TabStrip
            selected={tabSelected}
            onSelect={handleSelectTab}
            style={{ width: "100%" }}
          >
            <TabStripTab title="상세정보">
              <FormBoxWrap style={{ height: "67.5vh" }}>
                <FormBox>
                  <tbody>
                    <tr>
                      <th>업체코드</th>
                      {infomation.custcd != "자동생성" && yn == true ? (
                        <>
                          <td colSpan={2}>
                            <Input
                              name="custcd"
                              type="text"
                              value={infomation.custcd}
                              className="readonly"
                            />
                          </td>
                          <td></td>
                        </>
                      ) : (
                        <>
                          <td colSpan={2}>
                            {yn == true ? (
                              <Input
                                name="custcd"
                                type="text"
                                value={"자동생성"}
                                className="readonly"
                              />
                            ) : (
                              <Input
                                name="custcd"
                                type="text"
                                value={infomation.custcd}
                                onChange={InputChange}
                              />
                            )}
                          </td>
                          <td>
                            <Checkbox
                              defaultChecked={true}
                              value={yn}
                              onChange={CheckChange}
                              label={"자동생성"}
                              style={{ marginLeft: "30px" }}
                            />
                          </td>
                        </>
                      )}
                      <th>업체명</th>
                      <td>
                        <Input
                          name="custnm"
                          type="text"
                          value={infomation.custnm}
                          onChange={InputChange}
                          className="required"
                        />
                      </td>
                      <th>업체구분</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="custdiv"
                            value={infomation.custdiv}
                            bizComponentId="L_BA026"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                            className="required"
                            textField="code_name"
                            valueField="code_name"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>업체약어</th>
                      <td>
                        <Input
                          name="custabbr"
                          type="text"
                          value={infomation.custabbr}
                          onChange={InputChange}
                        />
                      </td>
                      <th>영문회사명</th>
                      <td colSpan={3}>
                        <Input
                          name="compnm_eng"
                          type="text"
                          value={infomation.compnm_eng}
                          onChange={InputChange}
                        />
                      </td>
                      <th>매입단가항목</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="inunpitem"
                            value={infomation.inunpitem}
                            bizComponentId="L_BA008"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                            className="required"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>사업자등록번호</th>
                      <td>
                        <Input
                          name="bizregnum"
                          value={infomation.bizregnum}
                          onChange={InputChange}
                        />
                      </td>
                      <th>우편번호</th>
                      <td>
                        <Input
                          name="zipcode"
                          type="number"
                          value={infomation.zipcode}
                          onChange={InputChange}
                        />
                      </td>
                      <th>지역</th>
                      <td>
                        <Input
                          name="area"
                          value={infomation.area}
                          onChange={InputChange}
                        />
                      </td>
                      <th>매출단가항목</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="unpitem"
                            value={infomation.unpitem}
                            bizComponentId="L_BA008"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                            className="required"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>대표자명</th>
                      <td>
                        <Input
                          name="ceonm"
                          type="text"
                          value={infomation.ceonm}
                          onChange={InputChange}
                        />
                      </td>
                      <th>주소</th>
                      <td colSpan={3}>
                        <Input
                          name="address"
                          type="text"
                          value={infomation.address}
                          onChange={InputChange}
                        />
                      </td>
                      <th>사업자구분</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="bizdiv"
                            value={infomation.bizdiv}
                            bizComponentId="L_BA027"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                            className="required"
                            textField="code_name"
                            valueField="code_name"
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>주민등록번호</th>
                      <td>
                        <Input
                          name="repreregno"
                          value={infomation.repreregno}
                          onChange={InputChange}
                        />
                      </td>
                      <th>영문주소</th>
                      <td colSpan={3}>
                        <Input
                          name="address_eng"
                          type="text"
                          value={infomation.address_eng}
                          onChange={InputChange}
                        />
                      </td>
                      <th>개업년월일</th>
                      <td>
                        <DatePicker
                          name="estbdt"
                          value={infomation.estbdt}
                          format="yyyy-MM-dd"
                          onChange={InputChange}
                          placeholder=""
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>전화번호</th>
                      <td>
                        <Input
                          name="phonenum"
                          type="text"
                          value={infomation.phonenum}
                          onChange={InputChange}
                        />
                      </td>
                      <th>은행정보</th>
                      <td>
                        <Input
                          name="bnkinfo"
                          type="text"
                          value={infomation.bnkinfo}
                          onChange={InputChange}
                        />
                      </td>
                      <th>예금주</th>
                      <td>
                        <Input
                          name="bankacntuser"
                          type="text"
                          value={infomation.bankacntuser}
                          onChange={InputChange}
                        />
                      </td>
                      <th>업태</th>
                      <td>
                        <Input
                          name="compclass"
                          type="text"
                          value={infomation.compclass}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>전자전화번호</th>
                      <td>
                        <Input
                          name="etelnum"
                          type="text"
                          value={infomation.etelnum}
                          onChange={InputChange}
                        />
                      </td>
                      <th>계좌번호</th>
                      <td colSpan={3}>
                        <Input
                          name="bankacnt"
                          type="text"
                          value={infomation.bankacnt}
                          onChange={InputChange}
                        />
                      </td>
                      <th>업종</th>
                      <td>
                        <Input
                          name="comptype"
                          type="text"
                          value={infomation.comptype}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>팩스번호</th>
                      <td>
                        <Input
                          name="faxnum"
                          type="text"
                          value={infomation.faxnum}
                          onChange={InputChange}
                        />
                      </td>
                      <th>은행정보2</th>
                      <td>
                        <Input
                          name="bnkinfo2"
                          type="text"
                          value={infomation.bnkinfo2}
                          onChange={InputChange}
                        />
                      </td>
                      <th>계좌번호2</th>
                      <td>
                        <Input
                          name="bankacnt2"
                          type="text"
                          value={infomation.bankacnt2}
                          onChange={InputChange}
                        />
                      </td>
                      <th>신고세무소</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="taxorg"
                            value={infomation.taxorg}
                            bizComponentId="L_BA049"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>전자팩스번호</th>
                      <td>
                        <Input
                          name="efaxnum"
                          type="text"
                          value={infomation.efaxnum}
                          onChange={InputChange}
                        />
                      </td>
                      <th>이메일</th>
                      <td colSpan={3}>
                        <Input
                          name="email"
                          type="text"
                          value={infomation.email}
                          onChange={InputChange}
                        />
                      </td>
                      <th>신고세무소명</th>
                      <td>
                        <Input
                          name="taxortnm"
                          type="text"
                          value={infomation.taxortnm}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>사용여부</th>
                      <td>
                        <Checkbox
                          name="useyn"
                          value={infomation.useyn == "Y" ? true : false}
                          onChange={InputChange}
                        />
                      </td>
                      <th>SCM사용여부</th>
                      <td>
                        <Checkbox
                          name="scmyn"
                          value={infomation.scmyn == "Y" ? true : false}
                          onChange={InputChange}
                        />
                      </td>
                      <th>역발행여부</th>
                      <td>
                        <Checkbox
                          name="rtxisuyn"
                          value={infomation.rtxisuyn == "Y" ? true : false}
                          onChange={InputChange}
                        />
                      </td>
                      <th>정기/비정기</th>
                      <td>
                        <Input
                          name="pariodyn"
                          type="text"
                          value={infomation.pariodyn}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>TAX구분</th>
                      <td>
                        <Input
                          name="etax"
                          type="text"
                          value={infomation.etax}
                          onChange={InputChange}
                        />
                      </td>
                      <th>대분류</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="itemlvl1"
                            value={infomation.itemlvl1}
                            bizComponentId="L_BA171"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                          />
                        )}
                      </td>
                      <th>중분류</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="itemlvl2"
                            value={infomation.itemlvl2}
                            bizComponentId="L_BA172"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                          />
                        )}
                      </td>
                      <th>소분류</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="itemlvl3"
                            value={infomation.itemlvl3}
                            bizComponentId="L_BA173"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>etax담당자</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="etxprs"
                            value={infomation.etxprs}
                            bizComponentId="L_sysUserMaster_001"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                            textField="user_name"
                            valueField="user_id"
                          />
                        )}
                      </td>
                      <th>etax이메일</th>
                      <td colSpan={3}>
                        <Input
                          name="emailaddr_og"
                          type="text"
                          value={infomation.emailaddr_og}
                          onChange={InputChange}
                        />
                      </td>
                      <th>etax전화번호</th>
                      <td>
                        <Input
                          name="phonenum_og"
                          type="text"
                          value={infomation.phonenum_og}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>센드빌회원여부</th>
                      <td>
                        {bizComponentData !== null && (
                          <BizComponentComboBox
                            name="bill_type"
                            value={infomation.bill_type}
                            bizComponentId="L_AC901"
                            bizComponentData={bizComponentData}
                            changeData={ComboBoxChange}
                          />
                        )}
                      </td>
                      <th>첨부파일</th>
                      <td>
                        <Input
                          name="files"
                          type="text"
                          value={infomation.files}
                        />
                        <ButtonInInput style={{ marginTop: "2vh" }}>
                          <Button
                            type={"button"}
                            onClick={onAttachmentsWndClick}
                            icon="more-horizontal"
                            fillMode="flat"
                          />
                        </ButtonInInput>
                      </td>
                      <th>비고</th>
                      <td colSpan={3}>
                        <TextArea
                          value={infomation.remark}
                          name="remark"
                          rows={3}
                          onChange={InputChange}
                        />
                      </td>
                    </tr>
                  </tbody>
                </FormBox>
              </FormBoxWrap>
            </TabStripTab>
            <TabStripTab title="업체담당자">
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>업체담당자</GridTitle>
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
                  style={{ height: "65vh" }}
                  data={process(
                    subDataResult.data.map((row) => ({
                      ...row,
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
                            editable={
                              editField.includes(item.fieldName)
                                ? false
                                : undefined
                            }
                            cell={
                              NumberField.includes(item.fieldName)
                                ? NumberCell
                                : checkboxField.includes(item.fieldName)
                                ? CheckBoxCell
                                : commandField.includes(item.fieldName)
                                ? CommandCell
                                : undefined
                            }
                          />
                        )
                    )}
                </Grid>
              </GridContainer>
            </TabStripTab>
            <TabStripTab title="재무현황">
              <GridContainer>
                <GridTitleContainer>
                  <GridTitle>재무현황</GridTitle>
                  <ButtonContainer>
                    <Button
                      onClick={onAddClick3}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="plus"
                    ></Button>
                    <Button
                      onClick={onDeleteClick3}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="minus"
                    ></Button>
                    <Button
                      onClick={onSaveClick3}
                      fillMode="outline"
                      themeColor={"primary"}
                      icon="save"
                    ></Button>
                  </ButtonContainer>
                </GridTitleContainer>
                <Grid
                  style={{ height: "65vh" }}
                  data={process(
                    subDataResult2.data.map((row) => ({
                      ...row,
                      yyyy: row.yyyy
                        ? new Date(dateformat(row.yyyy))
                        : new Date(),
                      rowstatus:
                        row.rowstatus == null ||
                        row.rowstatus == "" ||
                        row.rowstatus == undefined
                          ? ""
                          : row.rowstatus,
                      [SELECTED_FIELD]: selectedsubDataState2[idGetter3(row)],
                    })),
                    subDataState2
                  )}
                  {...subDataState2}
                  onDataStateChange={onSubDataStateChange2}
                  //선택 기능
                  dataItemKey={SUB_DATA_ITEM_KEY2}
                  selectedField={SELECTED_FIELD}
                  selectable={{
                    enabled: true,
                    mode: "multiple",
                  }}
                  onSelectionChange={onSubDataSelectionChange2}
                  //스크롤 조회 기능
                  fixedScroll={true}
                  total={subDataResult2.total}
                  onScroll={onSubScrollHandler2}
                  //정렬기능
                  sortable={true}
                  onSortChange={onSubDataSortChange2}
                  //컬럼순서조정
                  reorderable={true}
                  //컬럼너비조정
                  resizable={true}
                  onItemChange={onSubItemChange2}
                  cellRender={customCellRender2}
                  rowRender={customRowRender2}
                  editField={EDIT_FIELD}
                >
                  <GridColumn field="rowstatus" title=" " width="50px" />
                  {customOptionData !== null &&
                    customOptionData.menuCustomColumnOptions["grdList3"].map(
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
                              YearDateField.includes(item.fieldName)
                                ? YearDateCell
                                : NumberField.includes(item.fieldName)
                                ? NumberCell
                                : undefined
                            }
                            footerCell={
                              NumberField.includes(item.fieldName)
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
        </GridContainer>
      </GridContainerWrap>
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
          para={subDataResult.data[rows - 1].attdatnum}
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

export default BA_A0020;
