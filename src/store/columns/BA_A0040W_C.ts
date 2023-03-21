import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 140,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 200,
      },
      {
        id: "col_spec",
        field: "spec",
        caption: "사양",
        width: 140,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 160,
      },
      {
        id: "col_itemacnt2",
        field: "itemacnt",
        caption: "품목계정",
        width: 140,
      },
      {
        id: "col_invunit",
        field: "invunit",
        caption: "수량단위",
        width: 100,
      },
      {
        id: "col_useyn",
        field: "useyn",
        caption: "사용여부",
        width: 100,
      },
      {
        id: "col_safeqty",
        field: "safeqty",
        caption: "안전재고량",
        width: 140,
      },
      {
        id: "col_purleadtime",
        field: "purleadtime",
        caption: "구매리드타임",
        width: 140,
      },
      {
        id: "col_cnt",
        field: "cnt",
        caption: "첨부",
        width: 140,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 160,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 250,
      },
      {
        id: "col_bnatur",
        field: "bnatur",
        caption: "재질",
        width: 140,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_recdt",
        field: "recdt",
        caption: "적용일",
        width: 260,
      },
      {
        id: "col_unpitem",
        field: "unpitem",
        caption: "단가항목",
        width: 370,
      },
      {
        id: "col_amtunit",
        field: "amtunit",
        caption: "화폐단위",
        width: 200,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 200,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 210,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 380,
      },
    ],
  },
];
