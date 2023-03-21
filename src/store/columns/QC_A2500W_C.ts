import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_baddt",
        field: "baddt",
        caption: "불량일자",
        width: 120,
      },
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
        width: 150,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 150,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 150,
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
        width: 200,
      },
      {
        id: "col_causedcd",
        field: "causedcd",
        caption: "불량원인",
        width: 220,
      },
      {
        id: "col_plankey",
        field: "plankey",
        caption: "생산계획번호",
        width: 220,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_datnum",
        field: "datnum",
        caption: "NCR NO",
        width: 150,
      },
      {
        id: "col_baddt2",
        field: "baddt",
        caption: "불량일자",
        width: 120,
      },
      {
        id: "col_proccd2",
        field: "proccd",
        caption: "공정",
        width: 120,
      },
      {
        id: "col_lotnum2",
        field: "lotnum",
        caption: "LOT NO",
        width: 120,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_title",
        field: "title",
        caption: "제목",
        width: 180,
      },
      {
        id: "col_errtext",
        field: "errtext",
        caption: "부적합원인",
        width: 150,
      },
      {
        id: "col_qcdt",
        field: "qcdt",
        caption: "검사일자",
        width: 120,
      },
      {
        id: "col_protext",
        field: "protext",
        caption: "즉시조치",
        width: 180,
      },
      {
        id: "col_renum",
        field: "renum",
        caption: "실적번호",
        width: 180,
      },
      {
        id: "col_reseq",
        field: "reseq",
        caption: "생산실적순번",
        width: 100,
      },
    ],
  },
];
