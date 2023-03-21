import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_reqnum",
        field: "reqnum",
        caption: "출하지시번호",
        width: 250,
      },
      {
        id: "col_reqdt",
        field: "reqdt",
        caption: "지시일자",
        width: 120,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 220,
      },
      {
        id: "col_jisiqty",
        field: "jisiqty",
        caption: "지시량",
        width: 150,
      },
      {
        id: "col_outqty",
        field: "outqty",
        caption: "출하량",
        width: 150,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 200,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 400,
      },
      {
        id: "col_finyn",
        field: "finyn",
        caption: "완료여부",
        width: 120,
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
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 150,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 150,
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
        caption: "단위",
        width: 150,
      },
      {
        id: "col_len",
        field: "len",
        caption: "길이",
        width: 100,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 300,
      },
      {
        id: "col_ordnum",
        field: "ordnum",
        caption: "수주번호",
        width: 200,
      },
      {
        id: "col_finyn2",
        field: "finyn",
        caption: "완료여부",
        width: 100,
      },
    ],
  },
];
