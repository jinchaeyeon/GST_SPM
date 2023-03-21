import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
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
        width: 160,
      },
      {
        id: "col_itemlvl1",
        field: "itemlvl1",
        caption: "대분류",
        width: 150,
      },
      {
        id: "col_itemlvl2",
        field: "itemlvl2",
        caption: "중분류",
        width: 150,
      },
      {
        id: "col_itemlvl3",
        field: "itemlvl3",
        caption: "소분류",
        width: 150,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 170,
      },
      {
        id: "col_now_qty",
        field: "now_qty",
        caption: "현재고",
        width: 100,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_indt",
        field: "indt",
        caption: "입고일자",
        width: 120,
      },
      {
        id: "col_inkind",
        field: "inkind",
        caption: "입고유형",
        width: 100,
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
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "수량단위",
        width: 100,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_outdt",
        field: "outdt",
        caption: "출고일자",
        width: 120,
      },
      {
        id: "col_outkind",
        field: "outkind",
        caption: "출고유형",
        width: 100,
      },
      {
        id: "col_person2",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_qtyunit2",
        field: "qtyunit",
        caption: "수량단위",
        width: 100,
      },
    ],
  },
];
