import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_reckey",
        field: "reckey",
        caption: "출고번호",
        width: 200,
      },
      {
        id: "col_outuse",
        field: "outuse",
        caption: "출고용도",
        width: 200,
      },
      {
        id: "col_outdt",
        field: "outdt",
        caption: "출고일자",
        width: 200,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 220,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 420,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 400,
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
        width: 200,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 120,
      },
      {
        id: "col_model",
        field: "model",
        caption: "기종",
        width: 120,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 120,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 120,
      },
      {
        id: "col_amt",
        field: "amt",
        caption: "금액",
        width: 120,
      },
      {
        id: "col_bnatur",
        field: "bnatur",
        caption: "재질",
        width: 120,
      },
      {
        id: "col_taxamt",
        field: "taxamt",
        caption: "세액",
        width: 120,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 380,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 200,
      },
      {
        id: "col_len",
        field: "len",
        caption: "길이",
        width: 120,
      },
      {
        id: "col_itemthick",
        field: "itemthick",
        caption: "두께",
        width: 120,
      },
      {
        id: "col_width",
        field: "width",
        caption: "폭",
        width: 120,
      },
    ],
  },
];
