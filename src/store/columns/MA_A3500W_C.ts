import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_outkey",
        field: "outkey",
        caption: "불출번호",
        width: 150,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 150,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 150,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 120,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
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
        width: 120,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 100,
      },
      {
        id: "col_amt",
        field: "amt",
        caption: "금액",
        width: 100,
      },
      {
        id: "col_purkey",
        field: "purkey",
        caption: "발주번호",
        width: 150,
      },
      {
        id: "col_outpgm",
        field: "outpgm",
        caption: "불출경로",
        width: 120,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 150,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_itemcd2",
        field: "itemcd",
        caption: "품목코드",
        width: 150,
      },
      {
        id: "col_itemnm2",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_insiz2",
        field: "insiz",
        caption: "규격",
        width: 120,
      },
      {
        id: "col_lotnum2",
        field: "lotnum",
        caption: "LOT NO",
        width: 120,
      },
      {
        id: "col_itemacnt2",
        field: "itemacnt",
        caption: "품목계정",
        width: 120,
      },
      {
        id: "col_now_qty",
        field: "now_qty",
        caption: "재고량",
        width: 100,
      },
      {
        id: "col_doqty",
        field: "doqty",
        caption: "불출량",
        width: 100,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_itemnm3",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_insiz3",
        field: "insiz",
        caption: "규격",
        width: 120,
      },
      {
        id: "col_lotnum3",
        field: "lotnum",
        caption: "LOT NO",
        width: 140,
      },
      {
        id: "col_itemacnt3",
        field: "itemacnt",
        caption: "품목계정",
        width: 120,
      },
      {
        id: "col_doqty2",
        field: "doqty",
        caption: "처리량",
        width: 100,
      },
      {
        id: "col_qtyunit2",
        field: "qtyunit",
        caption: "단위",
        width: 100,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 100,
      },
    ],
  },
];
