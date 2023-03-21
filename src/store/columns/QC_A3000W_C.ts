import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_proddt",
        field: "proddt",
        caption: "생산일자",
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
        width: 150,
      },
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
        width: 170,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 170,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 120,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "검사수량",
        width: 120,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 200,
      },
      {
        id: "col_ordkey",
        field: "ordkey",
        caption: "수주번호",
        width: 200,
      },
      {
        id: "col_plankey",
        field: "plankey",
        caption: "계획번호",
        width: 200,
      },
      {
        id: "col_rekey",
        field: "rekey",
        caption: "실적번호",
        width: 200,
      },
      {
        id: "col_qcyn",
        field: "qcyn",
        caption: "검사유무",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_qcdt",
        field: "qcdt",
        caption: "검사일자",
        width: 150,
      },
      {
        id: "col_person",
        field: "person",
        caption: "검사자",
        width: 100,
      },
      {
        id: "col_qcno",
        field: "qcno",
        caption: "검사차수",
        width: 100,
      },
      {
        id: "col_qcqty",
        field: "qcqty",
        caption: "검사수량",
        width: 100,
      },
      {
        id: "col_badqty",
        field: "badqty",
        caption: "불량수량",
        width: 100,
      },
      {
        id: "col_strtime",
        field: "strtime",
        caption: "시작시간",
        width: 180,
      },
      {
        id: "col_endtime",
        field: "endtime",
        caption: "종료시간",
        width: 180,
      },
      {
        id: "col_qcdecision",
        field: "qcdecision",
        caption: "판정",
        width: 120,
      },
    ],
  },
];
