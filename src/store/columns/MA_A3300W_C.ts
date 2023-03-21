import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_recdt",
        field: "recdt",
        caption: "입고일자",
        width: 120,
      },
      {
        id: "col_recnum",
        field: "recnum",
        caption: "입고번호",
        width: 120,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_custcd",
        field: "custcd",
        caption: "업체코드",
        width: 150,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 150,
      },
      {
        id: "col_inuse",
        field: "inuse",
        caption: "입고용도",
        width: 120,
      },
      {
        id: "col_doexdiv",
        field: "doexdiv",
        caption: "내수구분",
        width: 120,
      },
      {
        id: "col_taxdiv",
        field: "taxdiv",
        caption: "과세구분",
        width: 120,
      },
      {
        id: "col_amtunit",
        field: "amtunit",
        caption: "화폐단위",
        width: 120,
      },
      {
        id: "col_amt",
        field: "amt",
        caption: "금액",
        width: 100,
      },
      {
        id: "col_wonamt",
        field: "wonamt",
        caption: "원화금액",
        width: 100,
      },
      {
        id: "col_taxamt",
        field: "taxamt",
        caption: "세액",
        width: 100,
      },
      {
        id: "col_totamt",
        field: "totamt",
        caption: "합계금액",
        width: 100,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 170,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 230,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 150,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 150,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "수량단위",
        width: 120,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 100,
      },
      {
        id: "col_amt2",
        field: "amt",
        caption: "금액",
        width: 100,
      },
      {
        id: "col_wonamt2",
        field: "wonamt",
        caption: "원화금액",
        width: 100,
      },
      {
        id: "col_taxamt2",
        field: "taxamt",
        caption: "세액",
        width: 100,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 200,
      },
      {
        id: "col_load_place",
        field: "load_place",
        caption: "적재장소",
        width: 120,
      },
    ],
  },
];
