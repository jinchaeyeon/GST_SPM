import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_custcd",
        field: "custcd",
        caption: "업체코드",
        width: 260,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 300,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 280,
      },
      {
        id: "col_wonamt",
        field: "wonamt",
        caption: "원화금액",
        width: 280,
      },
      {
        id: "col_taxamt",
        field: "taxamt",
        caption: "세액",
        width: 280,
      },
      {
        id: "col_totamt",
        field: "totamt",
        caption: "합계금액",
        width: 280,
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
        width: 200,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 200,
      },
      {
        id: "col_itemno",
        field: "itemno",
        caption: "품번",
        width: 150,
      },
      {
        id: "col_ordsiz",
        field: "ordsiz",
        caption: "수주규격",
        width: 180,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 160,
      },
      {
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "수량단위",
        width: 120,
      },
      {
        id: "col_wonamt2",
        field: "wonamt",
        caption: "원화금액",
        width: 220,
      },
      {
        id: "col_taxamt2",
        field: "taxamt",
        caption: "세액",
        width: 220,
      },
      {
        id: "col_totamt2",
        field: "totamt",
        caption: "합계금액",
        width: 220,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_outdt",
        field: "outdt",
        caption: "출하일자",
        width: 200,
      },
      {
        id: "col_outqty",
        field: "outqty",
        caption: "매수량",
        width: 160,
      },
      {
        id: "col_outamt",
        field: "outamt",
        caption: "매출금액",
        width: 160,
      },
    ],
  },
  {
    gridName: "grdList4",
    columns: [
      {
        id: "col_custcd2",
        field: "custcd",
        caption: "업체코드",
        width: 200,
      },
      {
        id: "col_custnm2",
        field: "custnm",
        caption: "업체명",
        width: 220,
      },
      {
        id: "col_qty3",
        field: "qty",
        caption: "수량",
        width: 150,
      },
      {
        id: "col_wonamt3",
        field: "wonamt",
        caption: "원화금액",
        width: 180,
      },
      {
        id: "col_taxamt3",
        field: "taxamt",
        caption: "세액",
        width: 180,
      },
      {
        id: "col_totamt3",
        field: "totamt",
        caption: "합계금액",
        width: 180,
      },
    ],
  },
];
