import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_outdt",
        field: "outdt",
        caption: "출하일자",
        width: 180,
      },
      {
        id: "col_recdtfind",
        field: "recdtfind",
        caption: "출하처리번호",
        width: 200,
      },
      {
        id: "col_custcd",
        field: "custcd",
        caption: "업체코드",
        width: 280,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 240,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 130,
      },
      {
        id: "col_doexdiv",
        field: "doexdiv",
        caption: "내수구분",
        width: 150,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 170,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 300,
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
        width: 250,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 300,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 250,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 180,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 400,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 300,
      },
    ],
  },
];
