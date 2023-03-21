import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_proddt",
        field: "proddt",
        caption: "생산일자",
        width: 100,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 100,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 100,
      },
      {
        id: "col_itemlvl1",
        field: "itemlvl1",
        caption: "대분류",
        width: 100,
      },
      {
        id: "col_itemlvl2",
        field: "itemlvl2",
        caption: "중분류",
        width: 100,
      },
      {
        id: "col_itemlvl3",
        field: "itemlvl3",
        caption: "소분류",
        width: 100,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "생산량",
        width: 100,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 100,
      },
      {
        id: "col_prodemp",
        field: "prodemp",
        caption: "작업자",
        width: 100,
      },
      {
        id: "col_prodmac",
        field: "prodmac",
        caption: "설비",
        width: 100,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT번호",
        width: 100,
      },
      {
        id: "col_strtime",
        field: "strtime",
        caption: "시작시간",
        width: 160,
      },
      {
        id: "col_endtime",
        field: "endtime",
        caption: "종료시간",
        width: 160,
      },
      {
        id: "col_leadtime",
        field: "leadtime",
        caption: "소요시간(시:분)",
        width: 160,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 160,
      },
    ],
  },
];
