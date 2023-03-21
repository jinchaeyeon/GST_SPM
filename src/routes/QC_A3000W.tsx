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
  GridItemChangeEvent,
  GridHeaderSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Icon, getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { gridList } from "../store/columns/QC_A3000W_C";
import { CellRender, RowRender } from "../components/Renderers/Renderers";
import { IAttachmentData, IWindowPosition } from "../hooks/interfaces";
import AttachmentsWindow from "../components/Windows/CommonWindows/AttachmentsWindow";
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
  GridContainerWrap,
  FormBoxWrap,
  FormBox,
} from "../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { useApi } from "../hooks/api";
import { Iparameters, TPermissions } from "../store/types";
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
  UseParaPc,
  UseGetValueFromSessionItem,
  toDate,
  getGridItemChangedData,
  convertDateToStrWithTime2,
  useSysMessage,
} from "../components/CommonFunction";
import DetailWindow from "../components/Windows/SA_A5000W_Window";
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
import ComboBoxCell from "../components/Cells/ComboBoxCell";

const DATA_ITEM_KEY = "num";
const DETAIL_DATA_ITEM_KEY = "num";
const dateField = ["proddt", "qcdt"];
const numberField = ["qty", "qcqty", "badqty", "qc_sort", "qcvalue1"];

type TdataArr = {
  rowstatus_s: string[];
  qcseq_s: string[];
  stdnum_s: string[];
  stdrev_s: string[];
  stdseq_s: string[];
  qc_sort_s: string[];
  inspeccd_s: string[];
  qc_spec_s: string[];
  qcvalue1_s: string[];
  qcresult1_s: string[];
};

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_MA034 ", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal = field === "qcresult1" ? "L_MA034" : "";
  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <ComboBoxCell bizComponent={bizComponent} {...props} />
  ) : (
    <td />
  );
};

const QC_A3000: React.FC = () => {
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const detailIdGetter = getter(DETAIL_DATA_ITEM_KEY);
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
        frdt: setDefaultDate(customOptionData, "frdt"),
        todt: setDefaultDate(customOptionData, "todt"),
        proccd: defaultOption.find((item: any) => item.id === "proccd")
          .valueCode,
        prodemp: defaultOption.find((item: any) => item.id === "prodemp")
          .valueCode,
        prodmac: defaultOption.find((item: any) => item.id === "prodmac")
          .valueCode,
        location: defaultOption.find((item: any) => item.id === "location")
          .valueCode,
        qcyn: defaultOption.find((item: any) => item.id === "qcyn").valueCode,
        qcno: defaultOption.find((item: any) => item.id === "qcno").valueCode,
        person: defaultOption.find((item: any) => item.id === "person")
          .valueCode,
      }));
    }
  }, [customOptionData]);

  const [bizComponentData, setBizComponentData] = useState<any>(null);
  UseBizComponent(
    "L_sysUserMaster_001, L_fxcode, L_PR010, L_QCYN,L_QC006,L_QC100",
    //수주상태, 내수구분, 과세구분, 사업장, 담당자, 부서, 품목계정, 수량단위, 완료여부
    setBizComponentData
  );

  //공통코드 리스트 조회 ()
  const [usersListData, setUsersListData] = useState([
    { user_id: "", user_name: "" },
  ]);
  const [prodmacListData, setProdmacListData] = useState([
    { fxcode: "", fxfull: "" },
  ]);

  const [proccdListData, setProccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  const [qcynListData, setQcynListData] = useState([COM_CODE_DEFAULT_VALUE]);
  const [qcnoListData, setQcnoListData] = useState([{ code: "", name: "" }]);
  const [inspeccdListData, setInspeccdListData] = useState([
    COM_CODE_DEFAULT_VALUE,
  ]);
  useEffect(() => {
    if (bizComponentData !== null) {
      const usersQueryStr = getQueryFromBizComponent(
        bizComponentData.find(
          (item: any) => item.bizComponentId === "L_sysUserMaster_001"
        )
      );
      const prodmacQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_fxcode")
      );
      const proccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_PR010")
      );

      const qcynQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_QCYN")
      );

      const qcnoQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_QC006")
      );
      const inspeccdQueryStr = getQueryFromBizComponent(
        bizComponentData.find((item: any) => item.bizComponentId === "L_QC100")
      );

      fetchQuery(usersQueryStr, setUsersListData);
      fetchQuery(prodmacQueryStr, setProdmacListData);
      fetchQuery(proccdQueryStr, setProccdListData);
      fetchQuery(qcynQueryStr, setQcynListData);
      fetchQuery(qcnoQueryStr, setQcnoListData);
      fetchQuery(inspeccdQueryStr, setInspeccdListData);
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
  const [detailDataState2, setDetailDataState2] = useState<State>({
    sort: [],
  });
  const [isInitSearch, setIsInitSearch] = useState(false);

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], detailDataState)
  );
  const [detailDataResult2, setDetailDataResult2] = useState<DataResult>(
    process([], detailDataState2)
  );

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const [detailSelectedState, setDetailSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [detailSelectedState2, setDetailSelectedState2] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [detailWindowVisible, setDetailWindowVisible] =
    useState<boolean>(false);
  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);

  const [mainPgNum, setMainPgNum] = useState(1);
  const [detailPgNum, setDetailPgNum] = useState(1);
  const [detailPgNum2, setDetailPgNum2] = useState(1);

  const [workType, setWorkType] = useState<"N" | "U">("N");
  const [ifSelectFirstRow, setIfSelectFirstRow] = useState(true);
  const [isCopy, setIsCopy] = useState(false);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const InforInputChange = (e: any) => {
    const { value, name } = e.target;
    if (value !== null)
      setInformation((prev) => ({
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

  const InforComboBoxChange = (e: any) => {
    const { name, value } = e;

    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //조회조건 초기값
  const [filters, setFilters] = useState({
    pgSize: PAGE_SIZE,
    orgdiv: "01",
    location: "01",
    frdt: new Date(),
    todt: new Date(),
    proccd: "",
    itemcd: "",
    itemnm: "",
    prodemp: "",
    prodmac: "",
    qcyn: "N",
    lotnum: "",
    plankey: "",
    rekey: "",
    renum: "",
    reseq: 0,
    qcnum: "",
    company_code: "",
  });

  const [detailFilters, setDetailFilters] = useState({
    pgSize: PAGE_SIZE,
    itemcd: "",
    renum: "",
    reseq: 0,
  });

  const [detailFilters2, setDetailFilters2] = useState({
    pgSize: PAGE_SIZE,
    itemcd: "",
    renum: "",
    reseq: 0,
    qcnum: "",
  });

  const [information, setInformation] = useState({
    workType: "U",
    attdatnum: "",
    badqty: 0,
    endtime: "",
    files: "",
    itemcd: "",
    itemnm: "",
    person: "",
    qcdecision: "",
    qcdt: new Date(),
    qcno: "",
    qcnum: "",
    qcqty: 0,
    remark: "",
    strtime: "",
  });

  //조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_QC_A3000W_Q",
    pageNumber: mainPgNum,
    pageSize: filters.pgSize,
    parameters: {
      "@p_work_type": "PRLIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_proccd": filters.proccd,
      "@p_itemcd": filters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_prodemp": filters.prodemp,
      "@p_prodmac": filters.prodmac,
      "@p_qcyn": filters.qcyn,
      "@p_lotnum": filters.lotnum,
      "@p_plankey": filters.plankey,
      "@p_rekey": filters.rekey,
      "@p_renum": filters.renum,
      "@p_reseq": filters.reseq,
      "@p_qcnum": filters.qcnum,
      "@p_company_code": filters.company_code,
    },
  };

  const detailParameters: Iparameters = {
    procedureName: "P_QC_A3000W_Q",
    pageNumber: detailPgNum,
    pageSize: detailFilters.pgSize,
    parameters: {
      "@p_work_type": "QCLIST",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_proccd": filters.proccd,
      "@p_itemcd": detailFilters.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_prodemp": filters.prodemp,
      "@p_prodmac": filters.prodmac,
      "@p_qcyn": filters.qcyn,
      "@p_lotnum": filters.lotnum,
      "@p_plankey": filters.plankey,
      "@p_rekey": filters.rekey,
      "@p_renum": detailFilters.renum,
      "@p_reseq": detailFilters.reseq,
      "@p_qcnum": filters.qcnum,
      "@p_company_code": filters.company_code,
    },
  };

  const detailParameters2: Iparameters = {
    procedureName: "P_QC_A3000W_Q",
    pageNumber: detailPgNum2,
    pageSize: detailFilters2.pgSize,
    parameters: {
      "@p_work_type": "QCDETAIL",
      "@p_orgdiv": filters.orgdiv,
      "@p_location": filters.location,
      "@p_frdt": convertDateToStr(filters.frdt),
      "@p_todt": convertDateToStr(filters.todt),
      "@p_proccd": filters.proccd,
      "@p_itemcd": detailFilters2.itemcd,
      "@p_itemnm": filters.itemnm,
      "@p_prodemp": filters.prodemp,
      "@p_prodmac": filters.prodmac,
      "@p_qcyn": filters.qcyn,
      "@p_lotnum": filters.lotnum,
      "@p_plankey": filters.plankey,
      "@p_rekey": filters.rekey,
      "@p_renum": detailFilters2.renum,
      "@p_reseq": detailFilters2.reseq,
      "@p_qcnum": detailFilters2.qcnum,
      "@p_company_code": filters.company_code,
    },
  };

  //삭제 프로시저 초기값
  const [paraDataDeleted, setParaDataDeleted] = useState({
    work_type: "",
    qcno: "",
  });

  //삭제 프로시저 파라미터
  const paraDeleted: Iparameters = {
    procedureName: "P_QC_A3000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraDataDeleted.work_type,
      "@p_orgdiv": filters.orgdiv,
      "@p_location": "01",
      "@p_renum": detailFilters.renum,
      "@p_reseq": detailFilters.reseq,
      "@p_qcnum": detailFilters2.qcnum,
      "@p_qcdt": "",
      "@p_person": "",
      "@p_qcno": paraDataDeleted.qcno,
      "@p_qcqty": 0,
      "@p_badqty": 0,
      "@p_strtime": "",
      "@p_endtime": "",
      "@p_qcdecision": "",
      "@p_remark": "",
      "@p_attdatnum": "",
      "@p_itemcd": "",
      "@p_rowstatus_s": "",
      "@p_qcseq_s": "",
      "@p_stdnum_s": "",
      "@p_stdrev_s": "",
      "@p_stdseq_s": "",
      "@p_qc_sort_s": "",
      "@p_inspeccd_s": "",
      "@p_qc_spec_s": "",
      "@p_qcvalue1_s": "",
      "@p_qcresult1_s": "",
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_QC_A3000W",
      "@p_company_code": "2207A046",
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
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        if (information.workType == "N") {
          setInformation((prev) => ({
            ...prev,
            badqty: 0,
            qcqty: 0,
            strtime: convertDateToStrWithTime2(new Date()),
            endtime: convertDateToStrWithTime2(new Date()),
            qcyn: rows[0].qcyn,
            person: rows[0].prodemp,
            itemcd: rows[0].itemcd,
            itemnm: rows[0].itemnm,
          }));
        }

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

  const fetchDetailGrid = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setInformation((prev) => ({
          ...prev,
          attdatnum: rows[0].attdatnum,
          badqty: rows[0].badqty,
          endtime: rows[0].endtime,
          files: rows[0].files,
          person: rows[0].person,
          qcdecision: rows[0].qcdecision,
          qcdt:
            rows[0].qcdt == "" || rows[0].qcdt == undefined
              ? new Date()
              : toDate(rows[0].qcdt),
          qcno: rows[0].qcno,
          qcnum: rows[0].qcnum,
          qcqty: rows[0].qcqty,
          remark: rows[0].remark,
          strtime: rows[0].strtime,
        }));
      }
      setDetailDataResult((prev) => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });
    }
    setLoading(false);
  };

  const fetchDetailGrid2 = async () => {
    let data: any;
    setLoading(true);
    try {
      data = await processApi<any>("procedure", detailParameters2);
    } catch (error) {
      data = null;
    }

    const datas = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    if (data.isSuccess === true) {
      if (datas.qcyn == "등록" && information.workType == "N") {
        const totalRowCnt = data.tables[1].RowCount;
        const rows = data.tables[1].Rows;

        setDetailDataResult2((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      } else if (datas.qcyn == "등록" && information.workType == "U") {
        const totalRowCnt = data.tables[0].RowCount;
        const rows = data.tables[0].Rows;

        setDetailDataResult2((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      } else if (datas.qcyn == "미등록" && information.workType == "N") {
        const totalRowCnt = data.tables[1].RowCount;
        const rows = data.tables[1].Rows;

        setDetailDataResult2((prev) => {
          return {
            data: rows,
            total: totalRowCnt,
          };
        });
      } else {
        const totalRowCnt = data.tables[0].RowCount;
        const rows = data.tables[0].Rows;

        setDetailDataResult2((prev) => {
          return {
            data: [],
            total: totalRowCnt,
          };
        });
      }
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
    if (customOptionData !== null) {
      fetchDetailGrid();
    }
  }, [detailFilters]);

  useEffect(() => {
    if (customOptionData !== null) {
      fetchDetailGrid2();
    }
  }, [detailFilters2]);

  useEffect(() => {
    if (paraDataDeleted.work_type === "D") fetchToDelete();
  }, [paraDataDeleted]);

  //메인 그리드 데이터 변경 되었을 때
  useEffect(() => {
    if (ifSelectFirstRow) {
      if (mainDataResult.total > 0) {
        const firstRowData = mainDataResult.data[0];
        setSelectedState({ [firstRowData.num]: true });

        setDetailFilters((prev) => ({
          ...prev,
          itemcd: firstRowData.itemcd,
          renum: firstRowData.renum,
          reseq: firstRowData.reseq,
        }));
        setInformation((prev) => ({
          ...prev,
          workType: "U",
        }));
        setIfSelectFirstRow(true);
      }
    }
  }, [mainDataResult]);

  useEffect(() => {
    if (detailDataResult.total > 0) {
      const firstRowData = detailDataResult.data[0];
      setDetailSelectedState({ [firstRowData.num]: true });

      setDetailFilters2((prev) => ({
        ...prev,
        itemcd: firstRowData.itemcd,
        renum: firstRowData.renum == undefined ? "" : firstRowData.renum,
        reseq: firstRowData.reseq == undefined ? 0 : firstRowData.reseq,
        qcnum: firstRowData.qcnum == undefined ? "" : firstRowData.qcnum,
      }));

      setIfSelectFirstRow(true);
    } else {
      setDetailDataResult2((prev) => {
        return {
          data: [],
          total: 0,
        };
      });
    }
  }, [detailDataResult]);

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

    setInformation((prev) => ({
      ...prev,
      workType: "U",
      itemcd: selectedRowData.itemcd,
      itemnm: selectedRowData.itemnm,
      attdatnum: "",
      badqty: 0,
      endtime:
        selectedRowData.endtime == "" || selectedRowData.endtime == undefined
          ? convertDateToStrWithTime2(new Date())
          : convertDateToStrWithTime2(selectedRowData.endtime),
      files: "",
      person: "",
      qcdecision: "",
      qcdt:
        selectedRowData.qcdt == "" || selectedRowData.qcdt == undefined
          ? new Date()
          : toDate(selectedRowData.qcdt),
      qcno: "",
      qcnum: "",
      qcqty: 0,
      remark: "",
      strtime:
        selectedRowData.strtime == "" || selectedRowData.strtime == undefined
          ? convertDateToStrWithTime2(new Date())
          : convertDateToStrWithTime2(selectedRowData.strtime),
    }));

    setDetailFilters((prev) => ({
      ...prev,
      itemcd: selectedRowData.itemcd,
      renum: selectedRowData.renum,
      reseq: selectedRowData.reseq,
    }));
  };

  const ondetailSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: detailSelectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setDetailSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setDetailFilters2((prev) => ({
      ...prev,
      itemcd: selectedRowData.itemcd,
      renum: selectedRowData.renum == undefined ? "" : selectedRowData.renum,
      reseq: selectedRowData.reseq == undefined ? 0 : selectedRowData.reseq,
      qcnum: selectedRowData.qcnum == undefined ? "" : selectedRowData.qcnum,
    }));

    const user = usersListData.find(
      (item: any) => item.user_name === selectedRowData.person
    )?.user_id;

    const qcno = qcnoListData.find(
      (item: any) => item.name === selectedRowData.qcno
    )?.code;

    setInformation((prev) => ({
      ...prev,
      workType: "U",
      attdatnum: selectedRowData.attdatnum,
      badqty: selectedRowData.badqty,
      endtime: selectedRowData.endtime,
      files: selectedRowData.files,
      person: user == undefined ? "" : user,
      qcdecision: selectedRowData.qcdecision,
      qcdt:
        selectedRowData.qcdt == "" || selectedRowData.qcdt == undefined
          ? new Date()
          : toDate(selectedRowData.qcdt),
      qcno: qcno == undefined ? "" : qcno,
      qcnum: selectedRowData.qcnum,
      qcqty: selectedRowData.qcqty,
      remark: selectedRowData.remark,
      strtime: selectedRowData.strtime,
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

  const onDetailScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum, PAGE_SIZE))
      setDetailPgNum((prev) => prev + 1);
  };

  const onDetailScrollHandler2 = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum2, PAGE_SIZE))
      setDetailPgNum2((prev) => prev + 1);
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onDetailDataStateChange = (event: GridDataStateChangeEvent) => {
    setDetailDataState(event.dataState);
  };

  const onDetailDataStateChange2 = (event: GridDataStateChangeEvent) => {
    setDetailDataState2(event.dataState);
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
    mainDataResult.data.forEach((item) =>
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

  const detailTotalFooterCell = (props: GridFooterCellProps) => {
    return (
      <td colSpan={props.colSpan} style={props.style}>
        총 {detailDataResult.total}건
      </td>
    );
  };

  const onAddClick = () => {
    const data = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];

    setDetailFilters2((prev) => ({
      ...prev,
      itemcd: data.itemcd,
      renum: data.renum,
      reseq: data.reseq,
      qcnum: "",
    }));
    setInformation((prev) => ({
      ...prev,
      workType: "N",
      attdatnum: "",
      badqty: 0,
      files: "",
      person: data.prodemp,
      qcdecision: "",
      qcdt: new Date(),
      qcno: "",
      qcnum: "",
      qcqty: 0,
      remark: "",
      strtime: convertDateToStrWithTime2(new Date()),
      endtime: convertDateToStrWithTime2(new Date()),
    }));
  };

  const onCustWndClick = () => {
    setCustWindowVisible(true);
  };

  const onItemWndClick = () => {
    setItemWindowVisible(true);
  };
  const questionToDelete = useSysMessage("QuestionToDelete");

  const onDeleteClick = (e: any) => {
    if (!window.confirm(questionToDelete)) {
      return false;
    }
    const data = detailDataResult.data.filter(
      (item) => item.num == Object.getOwnPropertyNames(detailSelectedState)[0]
    )[0];
    try {
      if (mainDataResult.total == 0) {
        throw findMessage(messagesData, "QC_A3000W_001");
      } else if (detailDataResult2.total == 0) {
        throw findMessage(messagesData, "QC_A3000W_002");
      } else {
        setParaDataDeleted((prev) => ({
          ...prev,
          work_type: "D",
          qcno: data.qcno,
        }));
      }
    } catch (e) {
      alert(e);
    }
  };

  const fetchToDelete = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraDeleted);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      fetchMainGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraDataDeleted.work_type = ""; //초기화
    paraDataDeleted.qcno = "";
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
  const onDetailSortChange = (e: any) => {
    setDetailDataState((prev) => ({ ...prev, sort: e.sort }));
  };
  const onDetailSortChange2 = (e: any) => {
    setDetailDataState2((prev) => ({ ...prev, sort: e.sort }));
  };
  const search = () => {
    try {
      if (
        convertDateToStr(filters.frdt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.frdt).substring(6, 8) > "31" ||
        convertDateToStr(filters.frdt).substring(6, 8) < "01" ||
        convertDateToStr(filters.frdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A5000W_001");
      } else if (
        convertDateToStr(filters.todt).substring(0, 4) < "1997" ||
        convertDateToStr(filters.todt).substring(6, 8) > "31" ||
        convertDateToStr(filters.todt).substring(6, 8) < "01" ||
        convertDateToStr(filters.todt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "SA_A5000W_001");
      }
    } catch (e) {
      alert(e);
    }
    fetchMainGrid();
  };
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const [ParaData, setParaData] = useState({
    pgSize: PAGE_SIZE,
    workType: "N",
    orgdiv: "01",
    location: "01",
    renum: "",
    reseq: 0,
    qcnum: "",
    qcdt: new Date(),
    person: "",
    qcno: "",
    qcqty: 0,
    badqty: 0,
    strtime: "",
    endtime: "",
    qcdecision: "",
    attdatnum: "",
    remark: "",
    itemcd: "",
    rowstatus_s: "",
    qcseq_s: "",
    stdnum_s: "",
    stdrev_s: "",
    stdseq_s: "",
    qc_sort_s: "",
    inspeccd_s: "",
    qc_spec_s: "",
    qcvalue1_s: "",
    qcresult1_s: "",
    userid: userId,
    pc: pc,
  });

  const para: Iparameters = {
    procedureName: "P_QC_A3000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": ParaData.workType,
      "@p_orgdiv": ParaData.orgdiv,
      "@p_location": ParaData.location,
      "@p_renum": ParaData.renum,
      "@p_reseq": ParaData.reseq,
      "@p_qcnum": ParaData.qcnum,
      "@p_qcdt": convertDateToStr(ParaData.qcdt),
      "@p_person": ParaData.person,
      "@p_qcno": ParaData.qcno,
      "@p_qcqty": ParaData.qcqty,
      "@p_badqty": ParaData.badqty,
      "@p_strtime": ParaData.strtime,
      "@p_endtime": ParaData.endtime,
      "@p_qcdecision": ParaData.qcdecision,
      "@p_remark": ParaData.remark,
      "@p_attdatnum": ParaData.attdatnum,
      "@p_itemcd": ParaData.itemcd,
      "@p_rowstatus_s": ParaData.rowstatus_s,
      "@p_qcseq_s": ParaData.qcseq_s,
      "@p_stdnum_s": ParaData.stdnum_s,
      "@p_stdrev_s": ParaData.stdrev_s,
      "@p_stdseq_s": ParaData.stdseq_s,
      "@p_qc_sort_s": ParaData.qc_sort_s,
      "@p_inspeccd_s": ParaData.inspeccd_s,
      "@p_qc_spec_s": ParaData.qcseq_s,
      "@p_qcvalue1_s": ParaData.qcvalue1_s,
      "@p_qcresult1_s": ParaData.qcresult1_s,
      "@p_userid": userId,
      "@p_pc": pc,
      "@p_form_id": "P_QC_A3000W",
      "@p_company_code": "2207A046",
    },
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
      fetchMainGrid();
      fetchDetailGrid();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ParaData.qcno != "") {
      fetchTodoGridSaved();
    }
  }, [ParaData]);

  const onDetailHeaderSelectionChange = useCallback(
    (event: GridHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked = checkboxElement.checked;
      const newSelectedState: {
        [id: string]: boolean | number[];
      } = {};

      event.dataItems.forEach((item) => {
        newSelectedState[idGetter(item)] = checked;
      });

      setDetailSelectedState(newSelectedState);
    },
    []
  );

  const getAttachmentsData = (data: IAttachmentData) => {
    setInformation((prev) => {
      return {
        ...prev,
        attdatnum: data.attdatnum,
        files:
          data.original_name +
          (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      };
    });
  };

  const onMainItemChange = (event: GridItemChangeEvent) => {
    setDetailDataState2((prev) => ({ ...prev, sort: [] }));
    getGridItemChangedData(
      event,
      detailDataResult2,
      setDetailDataResult2,
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
      field != "qc_sort" &&
      field != "inspeccd" &&
      field != "qc_spec" &&
      field != "rowstatus"
    ) {
      const newData = detailDataResult2.data.map((item) =>
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

      setIfSelectFirstRow(false);
      setDetailDataResult2((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = detailDataResult2.data.map((item) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));
    setIfSelectFirstRow(false);
    setDetailDataResult2((prev) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  const createColumn = () => {
    const array = [];
    array.push(<GridColumn field={"rowstatus"} title={" "} width="50px" />);
    array.push(
      <GridColumn
        field={"qc_sort"}
        title={"검사순번"}
        width="100px"
        cell={NumberCell}
      />
    );
    array.push(
      <GridColumn field={"inspeccd"} title={"검사항목"} width="150px" />
    );
    array.push(
      <GridColumn field={"qc_spec"} title={"측정기준명"} width="150px" />
    );
    return array;
  };

  const createColumn2 = () => {
    const array = [];
    array.push(
      <GridColumn
        field={"qcvalue1"}
        title={"측정값"}
        width="100px"
        cell={NumberCell}
      />
    );
    array.push(
      <GridColumn
        field={"qcresult1"}
        title={"측정결과"}
        width="120px"
        cell={CustomComboBoxCell}
      />
    );
    return array;
  };

  const onSaveClick = () => {
    const data = mainDataResult.data.filter(
      (item: any) => item.num == Object.getOwnPropertyNames(selectedState)[0]
    )[0];
    let valid = true;

    detailDataResult.data.map((item) => {
      if (information.qcno == item.qcno) {
        valid = false;
      }
    });
    try {
      if (valid != true && information.workType == "N") {
        throw findMessage(messagesData, "QC_A3000W_003");
      } else if (detailDataResult2.total == 0) {
        throw findMessage(messagesData, "QC_A3000W_007");
      } else if (
        convertDateToStr(information.qcdt).substring(0, 4) < "1997" ||
        convertDateToStr(information.qcdt).substring(6, 8) > "31" ||
        convertDateToStr(information.qcdt).substring(6, 8) < "01" ||
        convertDateToStr(information.qcdt).substring(6, 8).length != 2
      ) {
        throw findMessage(messagesData, "QC_A3000W_006");
      } else if (
        information.person == null ||
        information.person == "" ||
        information.person == undefined
      ) {
        throw findMessage(messagesData, "QC_A3000W_004");
      } else if (
        information.qcno == null ||
        information.qcno == "" ||
        information.qcno == undefined
      ) {
        throw findMessage(messagesData, "QC_A3000W_005");
      } else {
        const dataItem = detailDataResult2.data.filter((item: any) => {
          return (
            (item.rowstatus === "N" || item.rowstatus === "U") &&
            item.rowstatus !== undefined
          );
        });

        let dataArr: TdataArr = {
          rowstatus_s: [],
          qcseq_s: [],
          stdnum_s: [],
          stdrev_s: [],
          stdseq_s: [],
          qc_sort_s: [],
          inspeccd_s: [],
          qc_spec_s: [],
          qcvalue1_s: [],
          qcresult1_s: [],
        };

        if (dataItem.length !== 0) {
          dataItem.forEach((item: any, idx: number) => {
            const {
              rowstatus = "",
              qcseq = "",
              stdnum = "",
              stdrev = "",
              stdseq = "",
              qc_sort = "",
              inspeccd = "",
              qc_spec = "",
              qcvalue1 = "",
              qcresult1 = "",
            } = item;

            dataArr.rowstatus_s.push(rowstatus);
            dataArr.qcseq_s.push(qcseq);
            dataArr.stdnum_s.push(stdnum);
            dataArr.stdrev_s.push(stdrev);
            dataArr.stdseq_s.push(stdseq);
            dataArr.qc_sort_s.push(qc_sort);
            dataArr.inspeccd_s.push(inspeccd);
            dataArr.qc_spec_s.push(qc_spec);
            dataArr.qcvalue1_s.push(qcvalue1);
            dataArr.qcresult1_s.push(qcresult1);
          });
        }

        setParaData((prev) => ({
          ...prev,
          workType: information.workType,
          renum: data.renum,
          reseq: data.reseq,
          qcnum: information.qcnum == undefined ? "" : information.qcnum,
          qcdt: information.qcdt,
          person: information.person,
          qcno: information.qcno,
          qcqty: information.qcqty == undefined ? 0 : information.qcqty,
          badqty: information.badqty == undefined ? 0 : information.badqty,
          strtime: information.strtime,
          endtime: information.endtime,
          qcdecision:
            information.qcdecision == undefined ? "" : information.qcdecision,
          attdatnum:
            information.attdatnum == undefined ? "" : information.attdatnum,
          remark: information.remark == undefined ? "" : information.remark,
          itemcd: data.itemcd,
          rowstatus_s: dataArr.rowstatus_s.join("|"),
          qcseq_s: dataArr.qcseq_s.join("|"),
          stdnum_s: dataArr.stdnum_s.join("|"),
          stdrev_s: dataArr.stdrev_s.join("|"),
          stdseq_s: dataArr.stdseq_s.join("|"),
          qc_sort_s: dataArr.qc_sort_s.join("|"),
          inspeccd_s: dataArr.inspeccd_s.join("|"),
          qc_spec_s: dataArr.qc_spec_s.join("|"),
          qcvalue1_s: dataArr.qcvalue1_s.join("|"),
          qcresult1_s: dataArr.qcresult1_s.join("|"),
        }));
      }
    } catch (e) {
      alert(e);
    }
  };

  const onNowTime = (e: any) => {
    setInformation((prev) => ({
      ...prev,
      strtime: convertDateToStrWithTime2(new Date()),
    }));
  };

  const onNowTime2 = (e: any) => {
    setInformation((prev) => ({
      ...prev,
      endtime: convertDateToStrWithTime2(new Date()),
    }));
  };

  return (
    <>
      <TitleContainer>
        <Title>공정검사</Title>

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
              <td colSpan={3}>
                <div className="filter-item-wrap">
                  <DatePicker
                    name="frdt"
                    value={filters.frdt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    className="required"
                    placeholder=""
                  />
                  ~
                  <DatePicker
                    name="todt"
                    value={filters.todt}
                    format="yyyy-MM-dd"
                    onChange={filterInputChange}
                    className="required"
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
              <th>생산계획번호</th>
              <td>
                <Input
                  name="plankey"
                  type="text"
                  value={filters.plankey}
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
              <th>설비</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionComboBox
                    name="prodmac"
                    value={filters.prodmac}
                    customOptionData={customOptionData}
                    changeData={filterComboBoxChange}
                    textField="fxcode"
                    valueField="fxcode"
                  />
                )}
              </td>
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
              <th>실적번호</th>
              <td>
                <Input
                  name="rekey"
                  type="text"
                  value={filters.rekey}
                  onChange={filterInputChange}
                />
              </td>
              <th>검사유무</th>
              <td>
                {customOptionData !== null && (
                  <CustomOptionRadioGroup
                    name="qcyn"
                    customOptionData={customOptionData}
                    changeData={filterRadioChange}
                  />
                )}
              </td>
            </tr>
          </tbody>
        </FilterBox>
      </FilterBoxWrap>
      <GridContainerWrap>
        <GridContainer style={{ width: "50vw" }}>
          <ExcelExport
            data={mainDataResult.data}
            ref={(exporter) => {
              _export = exporter;
            }}
          >
            <GridTitleContainer>
              <GridTitle>생산실적리스트</GridTitle>
            </GridTitleContainer>
            <Grid
              style={{ height: "36vh" }}
              data={process(
                mainDataResult.data.map((row) => ({
                  ...row,
                  prodemp: usersListData.find(
                    (item: any) => item.user_id === row.prodemp
                  )?.user_name,
                  proccd: proccdListData.find(
                    (item: any) => item.sub_code === row.proccd
                  )?.code_name,
                  qcyn: qcynListData.find(
                    (item: any) => item.sub_code === row.proccd
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
                        field={item.fieldName}
                        title={item.caption}
                        width={item.width}
                        cell={
                          numberField.includes(item.fieldName)
                            ? NumberCell
                            : dateField.includes(item.fieldName)
                            ? DateCell
                            : undefined
                        }
                        footerCell={
                          item.sortOrder === 0
                            ? mainTotalFooterCell
                            : numberField.includes(item.fieldName)
                            ? gridSumQtyFooterCell
                            : undefined
                        }
                      />
                    )
                )}
            </Grid>
          </ExcelExport>
          <GridTitleContainer>
            <GridTitle>검사상세정보</GridTitle>
            <ButtonContainer>
              <Button
                onClick={onAddClick}
                themeColor={"primary"}
                icon="file-add"
              >
                생성
              </Button>
              <Button
                onClick={onDeleteClick}
                icon="delete"
                fillMode="outline"
                themeColor={"primary"}
              >
                삭제
              </Button>
              <Button onClick={onSaveClick} themeColor={"primary"} icon="save">
                저장
              </Button>
            </ButtonContainer>
          </GridTitleContainer>
          <Grid
            style={{ height: "34vh" }}
            data={process(
              detailDataResult.data.map((row) => ({
                ...row,
                person: usersListData.find(
                  (item: any) => item.user_id === row.person
                )?.user_name,
                qcno: qcnoListData.find((item: any) => item.code === row.qcno)
                  ?.name,
                [SELECTED_FIELD]: detailSelectedState[idGetter(row)],
              })),
              detailDataState
            )}
            {...detailDataState}
            onDataStateChange={onDetailDataStateChange}
            onHeaderSelectionChange={onDetailHeaderSelectionChange}
            dataItemKey={DATA_ITEM_KEY}
            selectedField={SELECTED_FIELD}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            onSelectionChange={ondetailSelectionChange}
            //스크롤 조회 기능
            fixedScroll={true}
            total={detailDataResult.total}
            onScroll={onDetailScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onDetailSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
          >
            {customOptionData !== null &&
              customOptionData.menuCustomColumnOptions["grdList2"].map(
                (item: any, idx: number) =>
                  item.sortOrder !== -1 && (
                    <GridColumn
                      key={idx}
                      field={item.fieldName}
                      title={item.caption}
                      width={item.width}
                      cell={
                        numberField.includes(item.fieldName)
                          ? NumberCell
                          : undefined
                      }
                      footerCell={
                        item.sortOrder === 0 ? detailTotalFooterCell : undefined
                      }
                    />
                  )
              )}
          </Grid>
        </GridContainer>
        <FormBoxWrap border={true} style={{ width: "40vw", marginTop: "4vh" }}>
          <FormBox style={{ marginLeft: "-3vh" }}>
            <tbody>
              <tr>
                <th>품목코드</th>
                <td>
                  <Input
                    name="itemcd"
                    type="text"
                    value={information.itemcd}
                    className="readonly"
                  />
                </td>
                <th>품목명</th>
                <td>
                  <Input
                    name="itemnm"
                    type="text"
                    value={information.itemnm}
                    className="readonly"
                  />
                </td>
              </tr>
              <tr>
                <th>검사일자</th>
                <td colSpan={3}>
                  <div className="filter-item-wrap">
                    <DatePicker
                      name="qcdt"
                      value={information.qcdt}
                      format="yyyy-MM-dd"
                      onChange={InforInputChange}
                      className="required"
                      placeholder=""
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>검사자</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="person"
                      value={information.person}
                      customOptionData={customOptionData}
                      changeData={InforComboBoxChange}
                      className="required"
                      textField="user_name"
                      valueField="user_id"
                    />
                  )}
                </td>
                <th>검사차수</th>
                <td>
                  {customOptionData !== null && (
                    <CustomOptionComboBox
                      name="qcno"
                      value={information.qcno}
                      customOptionData={customOptionData}
                      changeData={InforComboBoxChange}
                      className="required"
                      textField="name"
                      valueField="code"
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th>시작시간</th>
                <td>
                  <Input
                    name="strtime"
                    type="text"
                    value={information.strtime}
                  />
                  <ButtonInInput>
                    <Button onClick={onNowTime} icon="search" fillMode="flat" />
                  </ButtonInInput>
                </td>
                <th>종료시간</th>
                <td>
                  <Input
                    name="endtime"
                    type="text"
                    value={information.endtime}
                  />
                  <ButtonInInput>
                    <Button
                      onClick={onNowTime2}
                      icon="search"
                      fillMode="flat"
                    />
                  </ButtonInInput>
                </td>
              </tr>
              <tr>
                <th>검사수량</th>
                <td>
                  <Input
                    name="qcqty"
                    type="number"
                    value={information.qcqty}
                    onChange={InforInputChange}
                  />
                </td>
                <th>불량수량</th>
                <td>
                  <Input
                    name="badqty"
                    type="number"
                    value={information.badqty}
                    onChange={InforInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>첨부파일</th>
                <td colSpan={3}>
                  <Input
                    name="files"
                    type="text"
                    value={information.files}
                    onChange={InforInputChange}
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
              <tr>
                <th>비고</th>
                <td colSpan={3}>
                  <TextArea
                    value={information.remark}
                    name="remark"
                    rows={3}
                    onChange={InforInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </FormBox>
          <GridContainer>
            <Grid
              style={{ height: "36vh" }}
              data={process(
                detailDataResult2.data.map((row) => ({
                  ...row,
                  inspeccd: inspeccdListData.find(
                    (item: any) => item.sub_code === row.inspeccd
                  )?.code_name,
                })),
                detailDataState2
              )}
              {...detailDataState2}
              onDataStateChange={onDetailDataStateChange2}
              //스크롤 조회 기능
              fixedScroll={true}
              total={detailDataResult2.total}
              onScroll={onDetailScrollHandler2}
              //정렬기능
              sortable={true}
              onSortChange={onDetailSortChange2}
              //컬럼순서조정
              reorderable={true}
              //컬럼너비조정
              resizable={true}
              onItemChange={onMainItemChange}
              cellRender={customCellRender}
              rowRender={customRowRender}
              editField={EDIT_FIELD}
            >
              <GridColumn title="검사항목">{createColumn()}</GridColumn>
              <GridColumn title="측정">{createColumn2()}</GridColumn>
            </Grid>
          </GridContainer>
        </FormBoxWrap>
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
          para={information.attdatnum}
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

export default QC_A3000;
