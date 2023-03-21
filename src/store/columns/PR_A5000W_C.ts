import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 300,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 280,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 200,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 150,
      },
      {
        id: "col_prodemp",
        field: "prodemp",
        caption: "작업자",
        width: 150,
      },
      {
        id: "col_prodmac",
        field: "prodmac",
        caption: "설비",
        width: 160,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 300,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_prntqty",
        field: "prntqty",
        caption: "출력용수량",
        width: 120,
      },
      {
        id: "col_indt",
        field: "indt",
        caption: "입고일자",
        width: 120,
      },
      {
        id: "col_itemcd2",
        field: "itemcd",
        caption: "품목코드",
        width: 200,
      },
      {
        id: "col_itemnm2",
        field: "itemnm",
        caption: "품목명",
        width: 190,
      },
      {
        id: "col_insiz2",
        field: "insiz",
        caption: "규격",
        width: 180,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 120,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "완제품수량",
        width: 120,
      },
      {
        id: "col_lotnum2",
        field: "lotnum",
        caption: "LOT NO",
        width: 200,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 200,
      },
      {
        id: "col_ordkey",
        field: "ordkey",
        caption: "수주번호",
        width: 200,
      },
    ],
  },
];
