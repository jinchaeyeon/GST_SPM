import {
  useEffect,
  useState,
  useContext,
  useCallback,
  createContext,
} from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridEvent,
  GridCellProps,
  GridToolbar,
  GridSelectionChangeEvent,
  getSelectedState,
  GridHeaderSelectionChangeEvent,
  GridDataStateChangeEvent,
  GridSortChangeEvent,
} from "@progress/kendo-react-grid";
import { getter } from "@progress/kendo-react-common";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { useApi } from "../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInField,
  ButtonInFieldWrap,
  FieldWrap,
  GridContainer,
} from "../../CommonStyled";
import {
  Form,
  Field,
  FormElement,
  FieldArray,
  FieldArrayRenderProps,
  FormRenderProps,
  FieldWrapper,
  FieldRenderProps,
} from "@progress/kendo-react-form";
import { Error, Label } from "@progress/kendo-react-labels";
import { DatePickerChangeEvent } from "@progress/kendo-react-dateinputs";
import {
  FormNumberCell,
  FormNameCell,
  FormInput,
  FormDatePicker,
  FormReadOnly,
  FormReadOnlyNumberCell,
  FormComboBoxCell,
  FormComboBox,
  FormCheckBoxReadOnlyCell,
} from "../Editors";
import { Iparameters } from "../../store/types";
import {
  validator,
  checkIsDDLValid,
  chkScrollHandler,
  convertDateToStr,
  dateformat,
  getItemQuery,
  UseBizComponent,
  UseCustomOption,
  findMessage,
  UseMessages,
  setDefaultDate,
  getCodeFromValue,
  arrayLengthValidator,
  getUnpQuery,
  UseParaPc,
  getCustinfoQuery,
  UseGetValueFromSessionItem,
} from "../CommonFunction";
import { Button } from "@progress/kendo-react-buttons";
import AttachmentsWindow from "./CommonWindows/AttachmentsWindow";
import CustomersWindow from "./CommonWindows/CustomersWindow";
import ItemsWindow from "./CommonWindows/ItemsWindow";
import ItemsMultiWindow from "./CommonWindows/ItemsMultiWindow";
import {
  IAttachmentData,
  ICustData,
  IItemData,
  IWindowPosition,
} from "../../hooks/interfaces";
import {
  COM_CODE_DEFAULT_VALUE,
  EDIT_FIELD,
  FORM_DATA_INDEX,
  PAGE_SIZE,
  SELECTED_FIELD,
} from "../CommonString";
import { CellRender, RowRender } from "../Renderers/Renderers";
import { Input } from "@progress/kendo-react-inputs";
import RequiredHeader from "../RequiredHeader";
import { bytesToBase64 } from "byte-base64";

let deletedRows: object[] = [];
const idGetter = getter(FORM_DATA_INDEX);

type TKendoWindow = {
  getVisible(t: boolean): void;
  reloadData(workType: string): void;
  workType: "U" | "N";
  ordnum?: string;
  isCopy: boolean;
  para?: Iparameters; //{};
};

type TDetailData = {
  rowstatus_s: string[];
  chk_s: string[];
  ordseq_s: string[];
  poregseq_s: string[];
  itemcd_s: string[];
  itemnm_s: string[];
  itemacnt_s: string[];
  insiz_s: string[];
  bnatur_s: string[];
  qty_s: string[];
  qtyunit_s: string[];
  totwgt_s: string[];
  wgtunit_s: string[];
  len_s: string[];
  totlen_s: string[];
  lenunit_s: string[];
  thickness_s: string[];
  width_s: string[];
  length_s: string[];
  unpcalmeth_s: string[];
  unp_s: string[];
  amt_s: string[];
  taxamt_s: string[];
  dlramt_s: string[];
  wonamt_s: string[];
  remark_s: string[];
  pac_s: string[];
  finyn_s: string[];
  specialunp_s: string[];
  lotnum_s: string[];
  dlvdt_s: string[];
  specialamt_s: string[];
  heatno_s: string[];
  bf_qty_s: string[];
};

const formContext = createContext<{
  orddt: string;
  setOrddt: (o: string) => void;
  custcd: string;
  setCustcd: (c: string) => void;
  setChangedCustInfo: (c: { custcd: string; custnm: string }) => void;
  setChangedRcvcustInfo: (c: { rcvcustcd: string; rcvcustnm: string }) => void;
  dataState: State;
  setDataState: (d: any) => void;
}>({} as any);

const FormCustInput = (fieldRenderProps: FieldRenderProps) => {
  const { validationMessage, visited, label, id, valid, onBlur, ...others } =
    fieldRenderProps;

  const processApi = useApi();
  const { setCustcd, setChangedCustInfo, setChangedRcvcustInfo } =
    useContext(formContext);

  const onHandleBlur = async (e: any) => {
    const { value, name } = e.target;

    // 업체명 조회
    const custInfo = await fetchCustInfo(value);

    if (name === "custcd") {
      setCustcd(value);

      if (custInfo) {
        setChangedCustInfo(custInfo);
      }
    } else {
      if (custInfo)
        setChangedRcvcustInfo({
          rcvcustcd: custInfo.custcd,
          rcvcustnm: custInfo.custnm,
        });
    }
  };

  const fetchCustInfo = async (custcd: string) => {
    if (custcd === "") return;
    let data: any;
    let custInfo: null | { custcd: string; custnm: string } = null;

    const queryStr = getCustinfoQuery(custcd);
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
      if (rows.length > 0) {
        custInfo = { custcd: rows[0].custcd, custnm: rows[0].custnm };
      }
    }

    return custInfo;
  };

  return (
    <FieldWrapper>
      <Label editorId={id} editorValid={valid}>
        {label}
      </Label>
      <div className={"k-form-field-wrap"}>
        <Input valid={valid} id={id} onBlur={onHandleBlur} {...others} />
      </div>
    </FieldWrapper>
  );
};

const CustomComboBoxCell = (props: GridCellProps) => {
  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA061,L_BA015", setBizComponentData);

  const field = props.field ?? "";
  const bizComponentIdVal =
    field === "itemacnt" ? "L_BA061" : field === "qtyunit" ? "L_BA015" : "";

  const bizComponent = bizComponentData.find(
    (item: any) => item.bizComponentId === bizComponentIdVal
  );

  return bizComponent ? (
    <FormComboBoxCell bizComponent={bizComponent} {...props} />
  ) : (
    <td />
  );
};

// Create the Grid that will be used inside the Form
const FormGrid = (fieldArrayRenderProps: FieldArrayRenderProps) => {
  const { validationMessage, visited, name, dataItemKey, value } =
    fieldArrayRenderProps;
  const [detailPgNum, setDetailPgNum] = useState(1);
  const [editIndex, setEditIndex] = useState<number | undefined>();
  const [editedField, setEditedField] = useState("");
  const [editedRowData, setEditedRowData] = useState<any>({});
  const [unpList, setUnpList] = useState([]);
  const { orddt, custcd, dataState, setDataState } = useContext(formContext);

  const ItemBtnCell = (props: GridCellProps) => {
    const { dataIndex } = props;

    const onRowItemWndClick = () => {
      setEditIndex(dataIndex);
      setEditedRowData(props.dataItem);
      setItemWindowVisible(true);
    };

    return (
      <td className="k-command-cell required">
        <Button
          type={"button"}
          className="k-grid-save-command"
          onClick={onRowItemWndClick}
          icon="more-horizontal"
          //disabled={isInEdit ? false : true}
        />
      </td>
    );
  };

  // Add a new item to the Form FieldArray that will be shown in the Grid
  const onAdd = React.useCallback(
    (e: any) => {
      e.preventDefault();
      fieldArrayRenderProps.onPush({
        value: {
          rowstatus: "N",
          // customOptionData.menuCustomDefaultOptions.new.find(
          //   (item: any) => item.id === "cboOrdtype"
          // ).value,
          qty: 0,
          specialunp: 0,
          specialamt: 0,
          unp: 0,
          amt: 0,
          wonamt: 0,
          taxamt: 0,
          totamt: 0,
          outqty: 0,
          sale_qty: 0,
          finyn: "N",
          bf_qty: 0,
          ordseq: 0,
          poregseq: 0,
          totwgt: 0,
          len: 0,
          totlen: 0,
          thickness: 0,
          width: 0,
          length: 0,
          dlramt: 0,
          chk: "N",
          itemacnt: COM_CODE_DEFAULT_VALUE,
          qtyunit: COM_CODE_DEFAULT_VALUE,
        },
      });

      setEditIndex(0);
    },
    [fieldArrayRenderProps]
  );

  const onRemove = React.useCallback(() => {
    let newData: any[] = [];

    //삭제 안 할 데이터 newData에 push, 삭제 데이터 deletedRows에 push
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      if (!selectedState[index]) {
        newData.push(item);
      } else {
        deletedRows.push(item);
      }
    });

    //전체 데이터 삭제
    fieldArrayRenderProps.value.forEach(() => {
      fieldArrayRenderProps.onRemove({
        index: 0,
      });
    });

    //newData 생성
    newData.forEach((item: any) => {
      fieldArrayRenderProps.onPush({
        value: item,
      });
    });

    //선택 상태 초기화
    setSelectedState({});

    //수정 상태 초기화
    setEditIndex(undefined);
  }, [fieldArrayRenderProps]);

  const onCopy = React.useCallback(() => {
    let newData: any[] = [];
    let ordseq = 0; //그리드의 키값으로 사용되기 때문에 고유값 지정 필요

    //복사할 데이터 newData에 push
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      if (selectedState[index]) {
        newData.push(item);
      }
      if (ordseq < item.ordseq) ordseq = item.ordseq;
    });

    //newData 생성
    newData.forEach((item: any) => {
      ordseq++;

      fieldArrayRenderProps.onPush({
        value: { ...item, rowstatus: "N", ordseq: ordseq },
      });
    });

    //선택 상태 초기화
    setSelectedState({});

    //수정 상태 초기화
    setEditIndex(undefined);
  }, [fieldArrayRenderProps]);

  const dataWithIndexes = fieldArrayRenderProps.value.map(
    (item: any, index: any) => {
      return { ...item, [FORM_DATA_INDEX]: index };
    }
  );

  const [itemWindowVisible, setItemWindowVisible] = useState<boolean>(false);
  const [itemMultiWindowVisible, setItemMultiWindowVisible] =
  useState<boolean>(false);
  //스크롤 핸들러
  const scrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, detailPgNum, PAGE_SIZE))
      setDetailPgNum((prev) => prev + 1);
  };

  const setItemData = (
    itemData: IItemData,
    orgIndex?: number,
    orgDataItem?: any
  ) => {
    //단가정보
    const index = orgIndex !== undefined ? orgIndex : editIndex;
    const unpData: any = unpList.filter(
      (item: any) => item.recdt <= orddt && item.itemcd === itemData.itemcd
    );

    if (index === undefined) {
      //신규생성
      fieldArrayRenderProps.onPush({
        value: {
          rowstatus: "N",
          itemcd: itemData.itemcd,
          itemnm: itemData.itemnm,
          insiz: itemData.insiz,
          itemacnt: itemData.itemacnt,
          qtyunit: COM_CODE_DEFAULT_VALUE,
          qty: 0,
          specialunp: 0,
          specialamt: 0,
          unp: unpData.length > 0 ? unpData[0].unp : 0,
          amt: 0,
          wonamt: 0,
          taxamt: 0,
          totamt: 0,
          outqty: 0,
          sale_qty: 0,
          finyn: "N",
          bf_qty: 0,
          ordseq: 0,
          poregseq: 0,
          totwgt: 0,
          len: 0,
          totlen: 0,
          thickness: 0,
          width: 0,
          length: 0,
          dlramt: 0,
          chk: "N",
        },
      });
    } else {
      //기존 행 업데이트
      const dataItem = orgDataItem ? orgDataItem : editedRowData;

      let { unp, wonamt, taxamt, totamt, qty } = dataItem;

      if (unpData.length > 0) {
        unp = unpData[0].unp;
        wonamt = unp * qty;
        taxamt = wonamt / 10;
        totamt = wonamt + taxamt;
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...dataItem,
          rowstatus: dataItem.rowstatus === "N" ? dataItem.rowstatus : "U",
          itemcd: itemData.itemcd,
          itemnm: itemData.itemnm,
          insiz: itemData.insiz,
          itemacnt: itemData.itemacnt,
          qtyunit: COM_CODE_DEFAULT_VALUE,
          unp,
          wonamt,
          taxamt,
          totamt,
          [EDIT_FIELD]: undefined,
        },
      });
    }
  };

  const addItemData = (
    itemDatas: IItemData[],
    orgIndex?: number,
    orgDataItem?: any
  ) => {
    //단가정보
    itemDatas.map((itemData: any) => {
      const index = orgIndex !== undefined ? orgIndex : editIndex;
      const unpData: any = unpList.filter(
        (item: any) => item.recdt <= orddt && item.itemcd === itemData.itemcd
      );
  
      if (index === undefined) {
        //신규생성
          fieldArrayRenderProps.onPush({
            value: {
              rowstatus: "N",
              itemcd: itemData.itemcd,
              itemnm: itemData.itemnm,
              insiz: itemData.insiz,
              itemacnt: itemData.itemacnt,
              qtyunit: COM_CODE_DEFAULT_VALUE,
              qty: 0,
              specialunp: 0,
              specialamt: 0,
              unp: unpData.length > 0 ? unpData[0].unp : 0,
              amt: 0,
              wonamt: 0,
              taxamt: 0,
              totamt: 0,
              outqty: 0,
              sale_qty: 0,
              finyn: "N",
              bf_qty: 0,
              ordseq: 0,
              poregseq: 0,
              totwgt: 0,
              len: 0,
              totlen: 0,
              thickness: 0,
              width: 0,
              length: 0,
              dlramt: 0,
              chk: "N",
            },
          });
      } else {
        //기존 행 업데이트
        const dataItem = orgDataItem ? orgDataItem : editedRowData;
  
        let { unp, wonamt, taxamt, totamt, qty } = dataItem;
  
        if (unpData.length > 0) {
          unp = unpData[0].unp;
          wonamt = unp * qty;
          taxamt = wonamt / 10;
          totamt = wonamt + taxamt;
        }
  
        fieldArrayRenderProps.onReplace({
          index: index,
          value: {
            ...dataItem,
            rowstatus: dataItem.rowstatus === "N" ? dataItem.rowstatus : "U",
            itemcd: itemData.itemcd,
            itemnm: itemData.itemnm,
            insiz: itemData.insiz,
            itemacnt: itemData.itemacnt,
            qtyunit: COM_CODE_DEFAULT_VALUE,
            unp,
            wonamt,
            taxamt,
            totamt,
            [EDIT_FIELD]: undefined,
          },
        });
      }
    })
  };
  const onItemWndClick = () => {
    setEditIndex(undefined);
    setItemWindowVisible(true);
  };
  const onItemMultiWndClick = () => {
    setEditIndex(undefined);
    setItemMultiWindowVisible(true);
  };
  const enterEdit = (dataItem: any, field: string | undefined) => {
    if(field != "outqty" && field != "sale_qty"){
      fieldArrayRenderProps.onReplace({
        index: dataItem[FORM_DATA_INDEX],
        value: {
          ...dataItem,
          rowstatus: dataItem.rowstatus === "N" ? dataItem.rowstatus : "U",
          [EDIT_FIELD]: field,
        },
      });
  
      setEditIndex(dataItem[FORM_DATA_INDEX]);
      if (field) setEditedField(field);
    }
  };

  const exitEdit = () => {
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      let { qty, unp, wonamt, taxamt, totamt, specialamt, specialunp, itemcd } =
        item;

      const amtArr = ["qty", "unp"];
      if (amtArr.includes(editedField) && editIndex === index) {
        wonamt = qty * unp;
        taxamt = wonamt / 10;
        totamt = wonamt + taxamt;
      }

      const spcamtArr = ["qty", "specialunp"];
      if (spcamtArr.includes(editedField) && editIndex === index) {
        specialamt = qty * specialunp;
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...item,
          wonamt,
          taxamt,
          totamt,
          specialamt,
          [EDIT_FIELD]: undefined,
        },
      });

      if (editedField === "itemcd" && editIndex === index) {
        getItemData(itemcd);
      }
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

  const [selectedState, setSelectedState] = React.useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = React.useCallback(
    (event: GridSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState,
        dataItemKey: FORM_DATA_INDEX,
      });

      setSelectedState(newSelectedState);
    },
    [selectedState]
  );

  const onHeaderSelectionChange = React.useCallback(
    (event: GridHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked = checkboxElement.checked;
      const newSelectedState: {
        [id: string]: boolean | number[];
      } = {};

      event.dataItems.forEach((item) => {
        newSelectedState[idGetter(item)] = checked;
      });

      setSelectedState(newSelectedState);

      //선택된 상태로 리랜더링
      event.dataItems.forEach((item: any, index: number) => {
        fieldArrayRenderProps.onReplace({
          index: index,
          value: {
            ...item,
          },
        });
      });
    },
    []
  );

  const getItemData = (itemcd: string) => {
    const index = editIndex ?? 0;
    const dataItem = value[index];
    const queryStr = getItemQuery({ itemcd: itemcd, itemnm: "" });

    fetchData(queryStr, index, dataItem);
  };
  const processApi = useApi();

  const fetchData = React.useCallback(
    async (queryStr: string, index: number, dataItem: any) => {
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
        const rowCount = data.tables[0].RowCount;
        if (rowCount > 0) {
          setItemData(rows[0], index, dataItem);
        }
      }
    },
    []
  );

  // 업체코드 변경 시 단가 조회
  useEffect(() => {
    fetchUnp(custcd);
  }, [custcd]);

  // 단가정보, 수주일자 변경 시 그리드의 단가 업데이트
  useEffect(() => {
    if (unpList.length > 0) {
      changeGridUnpData();
    }
  }, [unpList, orddt]);

  // 모든 행 단가 관련 필드 업데이트
  const changeGridUnpData = () => {
    fieldArrayRenderProps.value.forEach((item: any, index: number) => {
      let { qty, unp, wonamt, taxamt, totamt, itemcd } = item;

      //단가정보
      const unpData: any = unpList.find(
        (unpItem: any) => unpItem.recdt <= orddt && unpItem.itemcd === itemcd
      );

      if (unpData) {
        unp = unpData.unp;
        wonamt = unp * qty;
        taxamt = wonamt / 10;
        totamt = wonamt + taxamt;
      }

      fieldArrayRenderProps.onReplace({
        index: index,
        value: {
          ...item,
          unp,
          wonamt,
          taxamt,
          totamt,
          [EDIT_FIELD]: undefined,
        },
      });
    });
  };

  const fetchUnp = useCallback(async (custcd: string) => {
    if (custcd === "") return;
    let data: any;

    const queryStr = getUnpQuery(custcd);
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
      setUnpList(rows);
    }
  }, []);

  const onGridSortChange = (e: GridSortChangeEvent) => {
    setDataState((prev: any) => ({ ...prev, sort: e.sort }));
  };

  //그리드의 dataState 요소 변경 시 => 데이터 컨트롤에 사용되는 dataState에 적용
  const onGridDataStateChange = (event: GridDataStateChangeEvent) => {
    setDataState(event.dataState);
  };

  return (
    <GridContainer margin={{ top: "30px" }}>
      {visited && validationMessage && <Error>{validationMessage}</Error>}
      <Grid
        style={{ height: "300px" }}
        data={process(
          dataWithIndexes.map((item: any) => ({
            ...item,
            parentField: name,
            [SELECTED_FIELD]: selectedState[idGetter(item)],
          })),
          dataState
        )}
        {...dataState}
        onDataStateChange={onGridDataStateChange}
        // 렌더
        cellRender={customCellRender}
        rowRender={customRowRender}
        //선택기능
        dataItemKey={dataItemKey}
        selectedField={SELECTED_FIELD}
        selectable={{
          enabled: true,
          drag: false,
          cell: false,
          mode: "multiple",
        }}
        onSelectionChange={onSelectionChange}
        onHeaderSelectionChange={onHeaderSelectionChange}
        //스크롤 조회 기능
        fixedScroll={true}
        total={dataWithIndexes.length}
        onScroll={scrollHandler}
        //정렬기능
        sortable={true}
        onSortChange={onGridSortChange}
        //컬럼순서조정
        reorderable={true}
        //컬럼너비조정
        resizable={true}
      >
        <GridToolbar>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onAdd}
            icon="add"
          >
            추가
          </Button>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onRemove}
            icon="minus"
          >
            삭제
          </Button>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onCopy}
            icon="copy"
          >
            복사
          </Button>
          <Button
            type={"button"}
            themeColor={"primary"}
            fillMode="outline"
            onClick={onItemMultiWndClick}
          >
            품목멀티
          </Button>
        </GridToolbar>

        <GridColumn
          field={SELECTED_FIELD}
          width="45px"
          headerSelectionValue={
            dataWithIndexes.findIndex(
              (item: any) => !selectedState[idGetter(item)]
            ) === -1
          }
        />
        <GridColumn field="rowstatus" title=" " width="40px" />
        <GridColumn
          field="itemcd"
          title="품목코드"
          width="160px"
          cell={FormNameCell}
          headerCell={RequiredHeader}
          className="required"
        />
        <GridColumn cell={ItemBtnCell} width="55px" />
        <GridColumn
          field="itemnm"
          title="품목명"
          width="180px"
          cell={FormNameCell}
          headerCell={RequiredHeader}
          className="required"
        />
        <GridColumn
          field="insiz"
          title="규격"
          width="200px"
          cell={FormNameCell}
        />
        <GridColumn
          field="itemacnt"
          title="품목계정"
          width="120px"
          cell={CustomComboBoxCell}
          headerCell={RequiredHeader}
          className="required"
        />
        <GridColumn
          field="qty"
          title="수주량"
          width="120px"
          cell={FormNumberCell}
          headerCell={RequiredHeader}
          className="required"
        />
        <GridColumn
          field="qtyunit"
          title="단위"
          width="120px"
          cell={CustomComboBoxCell}
        />
        <GridColumn
          field="unp"
          title="단가"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="wonamt"
          title="금액"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="taxamt"
          title="세액"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="totamt"
          title="합계금액"
          width="120px"
          cell={FormReadOnlyNumberCell}
        />
        <GridColumn
          field="remark"
          title="비고"
          width="120px"
          cell={FormNameCell}
        />
        <GridColumn
          field="purcustnm"
          title="발주처"
          width="120px"
          cell={FormNameCell}
        />
        <GridColumn
          field="outqty"
          title="출하수량"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="sale_qty"
          title="판매수량"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="finyn"
          title="완료여부"
          width="120px"
          cell={FormCheckBoxReadOnlyCell}
        />
        <GridColumn
          field="bf_qty"
          title="LOT수량"
          width="120px"
          cell={FormNumberCell}
        />
        <GridColumn
          field="lotnum"
          title="LOT NO"
          width="120px"
          cell={FormNameCell}
        />
      </Grid>
      {itemMultiWindowVisible && (
        <ItemsMultiWindow
          setVisible={setItemMultiWindowVisible}
          setData={addItemData}
        />
      )}
      {itemWindowVisible && (
        <ItemsWindow
          workType={editIndex === undefined ? "ROWS_ADD" : "ROW_ADD"}
          setVisible={setItemWindowVisible}
          setData={setItemData}
        />
      )}
    </GridContainer>
  );
};
const KendoWindow = ({
  getVisible,
  reloadData,
  workType,
  ordnum,
  isCopy,
  para,
}: TKendoWindow) => {
  const userId = UseGetValueFromSessionItem("user_id");

  const pathname: string = window.location.pathname.replace("/", "");

  //커스텀 옵션 조회
  const [customOptionData, setCustomOptionData] = React.useState<any>(null);
  UseCustomOption(pathname, setCustomOptionData);

  //메시지 조회
  const [messagesData, setMessagesData] = React.useState<any>(null);
  UseMessages(pathname, setMessagesData);

  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 1200,
    height: 800,
  });

  // 업체별 단가 처리에 사용 (수주일자, 업체코드)
  const [orddt, setOrddt] = useState("");
  const [custcd, setCustcd] = useState("");

  // 동적으로 Form Value를 변경하기 위해 사용하는 변수
  const [changedCustInfo, setChangedCustInfo] = useState({
    custcd: "",
    custnm: "",
  });
  const [changedRcvcustInfo, setChangedRcvcustInfo] = useState({
    rcvcustcd: "",
    rcvcustnm: "",
  });
  const [changedAttachmentInfo, setChangedAttachmentInfo] = useState({
    attdatnum: "",
    files: "",
  });

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
    getVisible(false);
  };

  // 업체코드 변경 시 Form 업체정보 change
  useEffect(() => {
    if (changedCustInfo.custcd !== "") {
      const valueChanged = document.getElementById("custcdChanged");
      valueChanged!.click();
    }
  }, [changedCustInfo]);

  // 인수처코드 변경 시  Form 업체정보 change
  useEffect(() => {
    if (changedRcvcustInfo.rcvcustcd !== "") {
      const valueChanged = document.getElementById("rcvcustcdChanged");
      valueChanged!.click();
    }
  }, [changedRcvcustInfo]);

  // 파일정보 변경 시  Form 업체정보 change
  useEffect(() => {
    if (changedAttachmentInfo.attdatnum !== "") {
      const valueChanged = document.getElementById("attachmentChanged");
      valueChanged!.click();
    }
  }, [changedAttachmentInfo]);

  const [formKey, setFormKey] = React.useState(1);
  const resetForm = () => {
    setFormKey(formKey + 1);
  };
  //수정 없이 submit 가능하도록 임의 value를 change 시켜줌
  useEffect(() => {
    const valueChanged = document.getElementById("valueChanged");
    valueChanged!.click();
  }, [formKey]);
  const processApi = useApi();
  const [dataState, setDataState] = useState<State>({
    sort: [],
  });
  const [detailDataResult, setDetailDataResult] = useState<DataResult>(
    process([], dataState)
  );

  const [custType, setCustType] = useState("");

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      fetchMain();
    }
  }, []);

  const [initialVal, setInitialVal] = useState({
    ordnum: "",
    doexdiv: "A",
    taxdiv: "A",
    location: "01",
    orddt: new Date(),
    dlvdt: new Date(),
    custnm: "",
    custcd: "",
    dptcd: "",
    person: "",
    ordsts: "2",
    ordtype: "A",
    rcvcustnm: "",
    rcvcustcd: "",
    project: "",
    amtunit: "", //"KRW",
    wonchgrat: 0,
    uschgrat: 0,
    quokey: "",
    prcterms: "",
    paymeth: "",
    dlv_method: "",
    portnm: "",
    ship_method: "",
    poregnum: "",
    attdatnum: "",
    files: "",
    remark: "",
  });

  useEffect(() => {
    if (customOptionData !== null && workType === "N") {
      setInitialVal((prev) => {
        return {
          ...prev,
          orddt: setDefaultDate(customOptionData, "orddt"),
          dlvdt: setDefaultDate(customOptionData, "dlvdt"),
          doexdiv: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "doexdiv"
          ).valueCode,
          taxdiv: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "taxdiv"
          ).valueCode,
          location: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "location"
          ).valueCode,
          ordtype: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "ordtype"
          ).valueCode,
          ordsts: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "ordsts"
          ).valueCode,
          dptcd: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "dptcd"
          ).valueCode,
          amtunit: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "amtunit"
          ).valueCode,
          person: customOptionData.menuCustomDefaultOptions.new.find(
            (item: any) => item.id === "person"
          ).valueCode,
        };
      });
    }
  }, [customOptionData]);

  //요약정보 조회조건 파라미터
  const parameters: Iparameters = {
    procedureName: "P_SA_A2000W_Q",
    pageNumber: 1,
    pageSize: 1,
    parameters: {
      "@p_work_type": "HEADER",
      "@p_orgdiv": "01",
      "@p_location": "",
      "@p_dtgb": "",
      "@p_frdt": "19990101",
      "@p_todt": "20991231",
      "@p_ordnum": ordnum,
      "@p_custcd": "",
      "@p_custnm": "",
      "@p_itemcd": "",
      "@p_itemnm": "",
      "@p_person": "",
      "@p_finyn": "%",
      "@p_dptcd": "",
      "@p_ordsts": "",
      "@p_doexdiv": "",
      "@p_ordtype": "",
      "@p_poregnum": "",
    },
  };

  //요약정보 조회
  const fetchMain = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const row = data.tables[0].Rows[0];

      setInitialVal((prev) => {
        return {
          ...prev,
          ordnum: row.ordnum,
          doexdiv: row.doexdiv,
          taxdiv: row.taxdiv,
          location: row.location,
          orddt: new Date(dateformat(row.orddt)),
          dlvdt: new Date(dateformat(row.dlvdt)),
          custnm: row.custnm,
          custcd: row.custcd,
          dptcd: row.dptcd,
          person: row.person,
          ordsts: row.ordsts,
          ordtype: row.ordtype,
          rcvcustnm: row.rcvcustnm,
          rcvcustcd: row.rcvcustcd,
          project: row.project,
          amtunit: row.amtunit,
          wonchgrat: row.wonchgrat, //0,
          uschgrat: row.uschgrat, //0,
          quokey: row.quokey,
          prcterms: row.prcterms,
          paymeth: row.paymeth,
          dlv_method: row.dlv_method,
          portnm: row.portnm,
          ship_method: row.ship_method,
          poregnum: row.poregnum,
          attdatnum: row.attdatnum,
          files: row.files,
          remark: row.remark,
        };
      });
    }
  };

  useEffect(() => {
    //fetch된 데이터가 폼에 세팅되도록 하기 위해 적용
    resetForm();
    //fetch된 orddt 데이터 세팅 (단가세팅용도)
    setOrddt(convertDateToStr(initialVal.orddt));
  }, [initialVal]);

  //fetch된 그리드 데이터가 그리드 폼에 세팅되도록 하기 위해 적용
  useEffect(() => {
    resetForm();
  }, [detailDataResult]);

  //상세그리드 조회
  const fetchGrid = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      setDetailDataResult(() => {
        return {
          data: rows,
          total: totalRowCnt,
        };
      });

      //resetForm();
    }
  };

  //프로시저 파라미터 초기값
  const [paraData, setParaData] = useState({
    work_type: "",
    service_id: "20190218001",
    orgdiv: "01",
    location: "01",
    ordnum: "",
    poregnum: "",
    project: "",
    ordtype: "",
    ordsts: "",
    taxdiv: "",
    orddt: "",
    dlvdt: "",
    dptcd: "",
    person: "",
    amtunit: "",
    portnm: "",
    finaldes: "",
    paymeth: "",
    prcterms: "",
    custcd: "",
    custnm: "",
    rcvcustcd: "",
    rcvcustnm: "",
    wonchgrat: 0,
    uschgrat: 0,
    doexdiv: "",
    remark: "",
    attdatnum: "",
    userid: userId,
    pc: pc,
    ship_method: "",
    dlv_method: "",
    hullno: "",
    rowstatus_s: "",
    chk_s: "",
    ordseq_s: "",
    poregseq_s: "",
    itemcd_s: "",
    itemnm_s: "",
    itemacnt_s: "",
    insiz_s: "",
    bnatur_s: "",
    qty_s: "",
    qtyunit_s: "",
    totwgt_s: "",
    wgtunit_s: "",
    len_s: "",
    totlen_s: "",
    lenunit_s: "",
    thickness_s: "",
    width_s: "",
    length_s: "",
    unpcalmeth_s: "",
    unp_s: "",
    amt_s: "",
    taxamt_s: "",
    dlramt_s: "",
    wonamt_s: "",
    remark_s: "",
    pac_s: "",
    finyn_s: "",
    specialunp_s: "",
    lotnum_s: "",
    dlvdt_s: "",
    specialamt_s: "",
    heatno_s: "",
    bf_qty_s: "",
    form_id: "",
  });

  //프로시저 파라미터
  const paraSaved: Iparameters = {
    procedureName: "P_SA_A2000W_S",
    pageNumber: 0,
    pageSize: 0,
    parameters: {
      "@p_work_type": paraData.work_type,
      "@p_service_id": paraData.service_id,
      "@p_orgdiv": paraData.orgdiv,
      "@p_location": paraData.location,
      "@p_ordnum": paraData.ordnum,
      "@p_poregnum": paraData.poregnum,
      "@p_project": paraData.project,
      "@p_ordtype": paraData.ordtype,
      "@p_ordsts": paraData.ordsts,
      "@p_taxdiv": paraData.taxdiv,
      "@p_orddt": paraData.orddt,
      "@p_dlvdt": paraData.dlvdt,
      "@p_dptcd": paraData.dptcd,
      "@p_person": paraData.person,
      "@p_amtunit": paraData.amtunit,
      "@p_portnm": paraData.portnm,
      "@p_finaldes": paraData.finaldes,
      "@p_paymeth": paraData.paymeth,
      "@p_prcterms": paraData.prcterms,
      "@p_custcd": paraData.custcd,
      "@p_custnm": paraData.custnm,
      "@p_rcvcustcd": paraData.rcvcustcd,
      "@p_rcvcustnm": paraData.rcvcustnm,
      "@p_wonchgrat": paraData.wonchgrat,
      "@p_uschgrat": paraData.uschgrat,
      "@p_doexdiv": paraData.doexdiv,
      "@p_remark": paraData.remark,
      "@p_attdatnum": paraData.attdatnum,
      "@p_userid": paraData.userid,
      "@p_pc": paraData.pc,
      "@p_ship_method": paraData.ship_method,
      "@p_dlv_method": paraData.dlv_method,
      "@p_hullno": paraData.hullno,
      "@p_rowstatus_s": paraData.rowstatus_s,
      "@p_chk_s": paraData.chk_s,
      "@p_ordseq_s": paraData.ordseq_s,
      "@p_poregseq_s": paraData.poregseq_s,
      "@p_itemcd_s": paraData.itemcd_s,
      "@p_itemnm_s": paraData.itemnm_s,
      "@p_itemacnt_s": paraData.itemacnt_s,
      "@p_insiz_s": paraData.insiz_s,
      "@p_bnatur_s": paraData.bnatur_s,
      "@p_qty_s": paraData.qty_s,
      "@p_qtyunit_s": paraData.qtyunit_s,
      "@p_totwgt_s": paraData.totwgt_s,
      "@p_wgtunit_s": paraData.wgtunit_s,
      "@p_len_s": paraData.len_s,
      "@p_totlen_s": paraData.totlen_s,
      "@p_lenunit_s": paraData.lenunit_s,
      "@p_thickness_s": paraData.thickness_s,
      "@p_width_s": paraData.width_s,
      "@p_length_s": paraData.length_s,
      "@p_unpcalmeth_s": paraData.unpcalmeth_s,
      "@p_unp_s": paraData.unp_s,
      "@p_amt_s": paraData.amt_s,
      "@p_taxamt_s": paraData.taxamt_s,
      "@p_dlramt_s": paraData.dlramt_s,
      "@p_wonamt_s": paraData.wonamt_s,
      "@p_remark_s": paraData.remark_s,
      "@p_pac_s": paraData.pac_s,
      "@p_finyn_s": paraData.finyn_s,
      "@p_specialunp_s": paraData.specialunp_s,
      "@p_lotnum_s": paraData.lotnum_s,
      "@p_dlvdt_s": paraData.dlvdt_s,
      "@p_specialamt_s": paraData.specialamt_s,
      "@p_heatno_s": paraData.heatno_s,
      "@p_bf_qty_s": paraData.bf_qty_s,
      "@p_form_id": paraData.form_id,
    },
  };

  //그리드 리셋
  const resetAllGrid = () => {
    setDetailDataResult(process([], dataState));
  };

  const fetchGridSaved = async () => {
    let data: any;

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      deletedRows = []; //초기화
      if (workType === "U" || isCopy === true) {
        resetAllGrid();

        reloadData("U");
        fetchMain();
        fetchGrid();
      } else {
        getVisible(false);
        reloadData("N");
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
      alert("[" + data.statusCode + "] " + data.resultMessage);
    }

    paraData.work_type = ""; //초기화
  };

  const handleSubmit = (dataItem: { [name: string]: any }) => {
    //alert(JSON.stringify(dataItem));

    let valid = true;

    //검증
    try {
      dataItem.orderDetails.forEach((item: any) => {
        if (!item.itemcd) {
          throw findMessage(messagesData, "SA_A2000W_004");
        }
        if (!item.itemnm) {
          throw findMessage(messagesData, "SA_A2000W_005");
        }
        if (!checkIsDDLValid(item.itemacnt)) {
          throw findMessage(messagesData, "SA_A2000W_006");
        }
        if (item.qty < 1) {
          throw findMessage(messagesData, "SA_A2000W_007");
        }
      });
    } catch (e) {
      alert(e);
      valid = false;
    }

    if (!valid) return false;

    const {
      location,
      ordnum,
      poregnum,
      project,
      ordtype,
      ordsts,
      taxdiv,
      orddt,
      dlvdt,
      dptcd,
      person,
      amtunit,
      portnm,
      finaldes,
      paymeth,
      prcterms,
      custcd,
      custnm,
      rcvcustcd,
      rcvcustnm,
      wonchgrat,
      uschgrat,
      doexdiv,
      remark,
      attdatnum,
      ship_method,
      dlv_method,
      hullno,
      orderDetails,
    } = dataItem;

    let detailArr: TDetailData = {
      rowstatus_s: [],
      chk_s: [],
      ordseq_s: [],
      poregseq_s: [],
      itemcd_s: [],
      itemnm_s: [],
      itemacnt_s: [],
      insiz_s: [],
      bnatur_s: [],
      qty_s: [],
      qtyunit_s: [],
      totwgt_s: [],
      wgtunit_s: [],
      len_s: [],
      totlen_s: [],
      lenunit_s: [],
      thickness_s: [],
      width_s: [],
      length_s: [],
      unpcalmeth_s: [],
      unp_s: [],
      amt_s: [],
      taxamt_s: [],
      dlramt_s: [],
      wonamt_s: [],
      remark_s: [],
      pac_s: [],
      finyn_s: [],
      specialunp_s: [],
      lotnum_s: [],
      dlvdt_s: [],
      specialamt_s: [],
      heatno_s: [],
      bf_qty_s: [],
    };
    orderDetails.forEach((item: any) => {
      const {
        rowstatus,
        chk,
        ordseq,
        poregseq,
        itemcd,
        itemnm,
        itemacnt,
        insiz,
        bnatur,
        qty,
        qtyunit,
        totwgt,
        wgtunit,
        len,
        totlen,
        lenunit,
        thickness,
        width,
        length,
        unpcalmeth,
        unp,
        amt,
        taxamt,
        dlramt,
        wonamt,
        remark,
        pac,
        finyn,
        specialunp,
        lotnum,
        dlvdt,
        specialamt,
        heatno,
        bf_qty,
      } = item;

      detailArr.rowstatus_s.push(isCopy === true ? "N" : rowstatus);
      detailArr.chk_s.push(chk);
      detailArr.ordseq_s.push(ordseq);
      detailArr.poregseq_s.push(poregseq);
      detailArr.itemcd_s.push(itemcd);
      detailArr.itemnm_s.push(itemnm);
      detailArr.itemacnt_s.push(getCodeFromValue(itemacnt));
      detailArr.insiz_s.push(insiz);
      detailArr.bnatur_s.push(bnatur);
      detailArr.qty_s.push(qty);
      detailArr.qtyunit_s.push(getCodeFromValue(qtyunit));
      detailArr.totwgt_s.push(totwgt);
      detailArr.wgtunit_s.push(wgtunit);
      detailArr.len_s.push(len);
      detailArr.totlen_s.push(totlen);
      detailArr.lenunit_s.push(lenunit);
      detailArr.thickness_s.push(thickness);
      detailArr.width_s.push(width);
      detailArr.length_s.push(length);
      detailArr.unpcalmeth_s.push(unpcalmeth);
      detailArr.unp_s.push(unp);
      detailArr.amt_s.push(amt);
      detailArr.taxamt_s.push(taxamt);
      detailArr.dlramt_s.push(dlramt);
      detailArr.wonamt_s.push(wonamt);
      detailArr.remark_s.push(remark);
      detailArr.pac_s.push(pac);
      detailArr.finyn_s.push(finyn === true ? "Y" : "N");
      detailArr.specialunp_s.push(specialunp);
      detailArr.lotnum_s.push(lotnum);
      detailArr.dlvdt_s.push(dlvdt);
      detailArr.specialamt_s.push(specialamt);
      detailArr.heatno_s.push(heatno);
      detailArr.bf_qty_s.push(bf_qty);
    });

    deletedRows.forEach((item: any) => {
      const {
        rowstatus,
        chk,
        ordseq,
        poregseq,
        itemcd,
        itemnm,
        itemacnt,
        insiz,
        bnatur,
        qty,
        qtyunit,
        totwgt,
        wgtunit,
        len,
        totlen,
        lenunit,
        thickness,
        width,
        length,
        unpcalmeth,
        unp,
        amt,
        taxamt,
        dlramt,
        wonamt,
        remark,
        pac,
        finyn,
        specialunp,
        lotnum,
        dlvdt,
        specialamt,
        heatno,
        bf_qty,
      } = item;

      detailArr.rowstatus_s.push("D");
      detailArr.chk_s.push(chk);
      detailArr.ordseq_s.push(ordseq);
      detailArr.poregseq_s.push(poregseq);
      detailArr.itemcd_s.push(itemcd);
      detailArr.itemnm_s.push(itemnm);
      detailArr.itemacnt_s.push(getCodeFromValue(itemacnt));
      detailArr.insiz_s.push(insiz);
      detailArr.bnatur_s.push(bnatur);
      detailArr.qty_s.push(qty);
      detailArr.qtyunit_s.push(getCodeFromValue(qtyunit));
      detailArr.totwgt_s.push(totwgt);
      detailArr.wgtunit_s.push(wgtunit);
      detailArr.len_s.push(len);
      detailArr.totlen_s.push(totlen);
      detailArr.lenunit_s.push(lenunit);
      detailArr.thickness_s.push(thickness);
      detailArr.width_s.push(width);
      detailArr.length_s.push(length);
      detailArr.unpcalmeth_s.push(unpcalmeth);
      detailArr.unp_s.push(unp);
      detailArr.amt_s.push(amt);
      detailArr.taxamt_s.push(taxamt);
      detailArr.dlramt_s.push(dlramt);
      detailArr.wonamt_s.push(wonamt);
      detailArr.remark_s.push(remark);
      detailArr.pac_s.push(pac);
      detailArr.finyn_s.push(finyn);
      detailArr.specialunp_s.push(specialunp);
      detailArr.lotnum_s.push(lotnum);
      detailArr.dlvdt_s.push(dlvdt);
      detailArr.specialamt_s.push(specialamt);
      detailArr.heatno_s.push(heatno);
      detailArr.bf_qty_s.push(bf_qty);
    });

    setParaData((prev) => ({
      ...prev,
      work_type: workType,
      location: getCodeFromValue(location),
      //location: typeof location === "string" ? location : location.sub_code,
      ordnum,
      poregnum,
      project,
      ordtype: getCodeFromValue(ordtype),
      ordsts: getCodeFromValue(ordsts),
      taxdiv: getCodeFromValue(taxdiv),
      orddt: convertDateToStr(orddt),
      dlvdt: convertDateToStr(dlvdt),
      dptcd: getCodeFromValue(dptcd, "dptcd"),
      person: getCodeFromValue(person, "user_id"),
      amtunit: getCodeFromValue(amtunit),
      portnm,
      finaldes: "",
      paymeth,
      prcterms,
      custcd,
      custnm,
      rcvcustcd,
      rcvcustnm,
      wonchgrat,
      uschgrat,
      doexdiv: getCodeFromValue(doexdiv),
      remark,
      attdatnum,
      ship_method,
      dlv_method,
      hullno: "",
      rowstatus_s: detailArr.rowstatus_s.join("|"), //"N|N",
      chk_s: detailArr.chk_s.join("|"),
      ordseq_s: detailArr.ordseq_s.join("|"),
      poregseq_s: detailArr.poregseq_s.join("|"),
      itemcd_s: detailArr.itemcd_s.join("|"),
      itemnm_s: detailArr.itemnm_s.join("|"),
      itemacnt_s: detailArr.itemacnt_s.join("|"),
      insiz_s: detailArr.insiz_s.join("|"),
      bnatur_s: detailArr.bnatur_s.join("|"),
      qty_s: detailArr.qty_s.join("|"),
      qtyunit_s: detailArr.qtyunit_s.join("|"),
      totwgt_s: detailArr.totwgt_s.join("|"),
      wgtunit_s: detailArr.wgtunit_s.join("|"),
      len_s: detailArr.len_s.join("|"),
      totlen_s: detailArr.totlen_s.join("|"),
      lenunit_s: detailArr.lenunit_s.join("|"),
      thickness_s: detailArr.thickness_s.join("|"),
      width_s: detailArr.width_s.join("|"),
      length_s: detailArr.length_s.join("|"),
      unpcalmeth_s: detailArr.unpcalmeth_s.join("|"),
      unp_s: detailArr.unp_s.join("|"),
      amt_s: detailArr.amt_s.join("|"),
      taxamt_s: detailArr.taxamt_s.join("|"),
      dlramt_s: detailArr.dlramt_s.join("|"),
      wonamt_s: detailArr.wonamt_s.join("|"),
      remark_s: detailArr.remark_s.join("|"),
      pac_s: detailArr.pac_s.join("|"),
      finyn_s: detailArr.finyn_s.join("|"),
      specialunp_s: detailArr.specialunp_s.join("|"),
      lotnum_s: detailArr.lotnum_s.join("|"),
      dlvdt_s: detailArr.dlvdt_s.join("|"),
      specialamt_s: detailArr.specialamt_s.join("|"),
      heatno_s: detailArr.heatno_s.join("|"),
      bf_qty_s: detailArr.bf_qty_s.join("|"),
    }));
  };

  useEffect(() => {
    if (paraData.work_type !== "") fetchGridSaved();
  }, [paraData]);

  const onCustWndClick = () => {
    setCustType("CUST");
    setCustWindowVisible(true);
  };
  const onRcvcustWndClick = () => {
    setCustType("RCVCUST");
    setCustWindowVisible(true);
  };
  const onAttachmentsWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const setCustData = (data: ICustData) => {
    const { custcd, custnm } = data;
    if (custType === "CUST") {
      // 업체
      setCustcd(custcd);
      setChangedCustInfo({ custcd, custnm });
    } else {
      // 인수처
      setChangedRcvcustInfo({ rcvcustcd: custcd, rcvcustnm: custnm });
    }
  };

  const getAttachmentsData = (data: IAttachmentData) => {
    setChangedAttachmentInfo({
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
      attdatnum: data.attdatnum,
    });
  };

  const [bizComponentData, setBizComponentData] = useState([]);
  UseBizComponent("L_BA061,L_BA015", setBizComponentData);

  useEffect(() => {
    if (workType === "U" || isCopy === true) {
      if (bizComponentData.length) {
        resetAllGrid();
        fetchGrid();
      }
    }
  }, [bizComponentData]);

  const onChangeOrddt = (e: DatePickerChangeEvent) => {
    const { value } = e;
    if (value) {
      setOrddt(convertDateToStr(value));

      if (custcd === "") {
        setCustcd(initialVal.custcd);
      }
    }
  };

  return (
    <Window
      title={workType === "N" ? "수주생성" : "수주정보"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
    >
      <formContext.Provider
        value={{
          orddt,
          setOrddt,
          custcd,
          setCustcd,
          setChangedRcvcustInfo,
          setChangedCustInfo,
          dataState,
          setDataState,
        }}
      >
        <Form
          onSubmit={handleSubmit}
          key={formKey}
          initialValues={{
            rowstatus: "",
            ordnum: isCopy === true ? "" : initialVal.ordnum,
            doexdiv: initialVal.doexdiv,
            taxdiv: initialVal.taxdiv,
            location: initialVal.location,
            orddt: initialVal.orddt, //new Date(),
            dlvdt: initialVal.dlvdt,
            custnm: initialVal.custnm,
            custcd: initialVal.custcd,
            dptcd: initialVal.dptcd,
            person: initialVal.person,
            ordsts: initialVal.ordsts,
            ordtype: initialVal.ordtype,
            rcvcustnm: initialVal.rcvcustnm,
            rcvcustcd: initialVal.rcvcustcd,
            project: initialVal.project,
            amtunit: initialVal.amtunit, //"KRW",
            wonchgrat: initialVal.wonchgrat, //0,
            uschgrat: initialVal.uschgrat, //0,
            quokey: initialVal.quokey,
            prcterms: initialVal.prcterms,
            paymeth: initialVal.paymeth,
            dlv_method: initialVal.dlv_method,
            portnm: initialVal.portnm,
            ship_method: initialVal.ship_method,
            poregnum: initialVal.poregnum,
            attdatnum: initialVal.attdatnum,
            files: initialVal.files,
            remark: initialVal.remark,
            orderDetails: detailDataResult.data, //detailDataResult.data,
          }}
          render={(formRenderProps: FormRenderProps) => (
            <FormElement horizontal={true}>
              <fieldset className={"k-form-fieldset"}>
                <button
                  id="valueChanged"
                  style={{ display: "none" }}
                  onClick={(e) => {
                    e.preventDefault(); // Changing desired field value
                    formRenderProps.onChange("valueChanged", {
                      value: "1",
                    });
                  }}
                ></button>
                <button
                  id="custcdChanged"
                  style={{ display: "none" }}
                  onClick={(e) => {
                    e.preventDefault();

                    formRenderProps.onChange("custcd", {
                      value: changedCustInfo.custcd,
                    });
                    formRenderProps.onChange("custnm", {
                      value: changedCustInfo.custnm,
                    });
                  }}
                ></button>
                <button
                  id="rcvcustcdChanged"
                  style={{ display: "none" }}
                  onClick={(e) => {
                    e.preventDefault();

                    formRenderProps.onChange("rcvcustcd", {
                      value: changedRcvcustInfo.rcvcustcd,
                    });
                    formRenderProps.onChange("rcvcustnm", {
                      value: changedRcvcustInfo.rcvcustnm,
                    });
                  }}
                ></button>
                <button
                  id="attachmentChanged"
                  style={{ display: "none" }}
                  onClick={(e) => {
                    e.preventDefault();

                    formRenderProps.onChange("files", {
                      value: changedAttachmentInfo.files,
                    });
                    formRenderProps.onChange("attdatnum", {
                      value: changedAttachmentInfo.attdatnum,
                    });
                  }}
                ></button>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"ordnum"}
                    label={"수주번호"}
                    component={FormReadOnly}
                    className="readonly"
                  />
                  {customOptionData !== null && (
                    <Field
                      name={"doexdiv"}
                      label={"내수구분"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "doexdiv"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "doexdiv"
                        ).bizComponentItems
                      }
                      className="required"
                    />
                  )}
                  {customOptionData !== null && (
                    <Field
                      name={"taxdiv"}
                      label={"과세구분"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "taxdiv"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "taxdiv"
                        ).bizComponentItems
                      }
                      className="required"
                    />
                  )}
                  {customOptionData !== null && (
                    <Field
                      name={"location"}
                      label={"사업장"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "location"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "location"
                        ).bizComponentItems
                      }
                    />
                  )}
                </FieldWrap>

                <FieldWrap fieldWidth="25%">
                  <Field
                    label={"수주일자"}
                    name={"orddt"}
                    component={FormDatePicker}
                    className="required"
                    onChange={onChangeOrddt}
                  />
                  <Field
                    label={"납기일자"}
                    name={"dlvdt"}
                    component={FormDatePicker}
                    className="required"
                  />
                  {/* <Field
                  label={"수주상태"}
                  name={"ordsts"}
                  component={FormDropDownList}
                  queryStr={ordstsQuery}
                  className="required"
                /> */}

                  {customOptionData !== null && (
                    <Field
                      name={"ordsts"}
                      label={"수주상태"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "ordsts"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "ordsts"
                        ).bizComponentItems
                      }
                    />
                  )}

                  {customOptionData !== null && (
                    <Field
                      name={"ordtype"}
                      label={"수주형태"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "ordtype"
                        ).query
                      }
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "ordtype"
                        ).bizComponentItems
                      }
                    />
                  )}
                </FieldWrap>

                <FieldWrap fieldWidth="25%">
                  <Field
                    label={"업체코드"}
                    name={"custcd"}
                    component={FormCustInput}
                    validator={validator}
                    className="required"
                  />
                  <ButtonInFieldWrap>
                    <ButtonInField>
                      <Button
                        type={"button"}
                        onClick={onCustWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInField>
                  </ButtonInFieldWrap>
                  <Field
                    label={"업체명"}
                    name={"custnm"}
                    component={FormInput}
                    validator={validator}
                    className="required"
                  />
                  <Field
                    name={"rcvcustcd"}
                    component={FormCustInput}
                    label={"인수처코드"}
                  />
                  <ButtonInFieldWrap>
                    <ButtonInField>
                      <Button
                        type={"button"}
                        onClick={onRcvcustWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInField>
                  </ButtonInFieldWrap>
                  <Field
                    name={"rcvcustnm"}
                    component={FormInput}
                    label={"인수처"}
                  />
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"project"}
                    component={FormInput}
                    label={"프로젝트"}
                  />

                  {customOptionData !== null && (
                    <Field
                      name={"dptcd"}
                      label={"부서"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "dptcd"
                        ).query
                      }
                      textField={"dptnm"}
                      valueField={"dptcd"}
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "dptcd"
                        ).bizComponentItems
                      }
                    />
                  )}

                  {customOptionData !== null && (
                    <Field
                      name={"person"}
                      label={"담당자"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "person"
                        ).query
                      }
                      valueField={"user_id"}
                      textField={"user_name"}
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "person"
                        ).bizComponentItems
                      }
                    />
                  )}
                  {customOptionData !== null && (
                    <Field
                      name={"amtunit"}
                      label={"화폐단위"}
                      component={FormComboBox}
                      queryStr={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "amtunit"
                        ).query
                      }
                      textField={"code_name"}
                      columns={
                        customOptionData.menuCustomDefaultOptions.new.find(
                          (item: any) => item.id === "amtunit"
                        ).bizComponentItems
                      }
                    />
                  )}
                  {/* <Field
                  name={"wonchgrat"}
                  component={FormInput}
                  label={"원화환율"}
                />
                <Field
                  name={"uschgrat"}
                  component={FormInput}
                  label={"대미환율"}
                /> */}
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"quokey"}
                    component={FormReadOnly}
                    label={"견적번호"}
                  />
                  <Field
                    name={"prcterms"}
                    component={FormInput}
                    label={"인도조건"}
                  />
                  <Field
                    name={"paymeth"}
                    component={FormInput}
                    label={"지불조건"}
                  />
                  <Field
                    name={"dlv_method"}
                    component={FormInput}
                    label={"납기조건"}
                  />
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field
                    name={"portnm"}
                    component={FormInput}
                    label={"선적지"}
                  />
                  <Field
                    name={"ship_method"}
                    component={FormInput}
                    label={"선적방법"}
                  />
                  <Field
                    name={"poregnum"}
                    component={FormInput}
                    label={"PO번호"}
                  />
                  <Field
                    name={"files"}
                    component={FormReadOnly}
                    label={"첨부파일"}
                  />
                  <ButtonInFieldWrap>
                    <ButtonInField>
                      <Button
                        type={"button"}
                        onClick={onAttachmentsWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInField>
                  </ButtonInFieldWrap>
                </FieldWrap>
                <FieldWrap fieldWidth="25%">
                  <Field name={"remark"} component={FormInput} label={"비고"} />
                </FieldWrap>
              </fieldset>
              <FieldArray
                name="orderDetails"
                dataItemKey={FORM_DATA_INDEX}
                component={FormGrid}
                validator={arrayLengthValidator}
              />

              <BottomContainer>
                <ButtonContainer>
                  <Button type={"submit"} themeColor={"primary"} icon="save">
                    저장
                  </Button>
                </ButtonContainer>
              </BottomContainer>
            </FormElement>
          )}
        />
      </formContext.Provider>
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={custType} //신규 : N, 수정 : U
          setData={setCustData}
        />
      )}
      {attachmentsWindowVisible && (
        <AttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={initialVal.attdatnum}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
