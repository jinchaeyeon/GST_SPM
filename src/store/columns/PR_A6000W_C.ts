import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_prodmac",
        field: "prodmac",
        caption: "설비",
        width: 200,
      },
      {
        id: "col_fxnm3",
        field: "fxnm",
        caption: "설비명",
        width: 150,
      },
      {
        id: "col_stopcd",
        field: "stopcd",
        caption: "비가동유형",
        width: 150,
      },
      {
        id: "col_strtime",
        field: "strtime",
        caption: "비가동시작시간",
        width: 220,
      },
      {
        id: "col_endtime",
        field: "endtime",
        caption: "비가동종료시간",
        width: 220,
      },
      {
        id: "col_losshh3",
        field: "losshh",
        caption: "비가동시간",
        width: 150,
      },
      {
        id: "col_prodemp",
        field: "prodemp",
        caption: "작업자",
        width: 150,
      },
      {
        id: "col_stopnum",
        field: "stopnum",
        caption: "비가동번호",
        width: 220,
      },
      {
        id: "col_fxnumnm",
        field: "fxnumnm",
        caption: "설비",
        width: 150,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_fxnum",
        field: "fxnum",
        caption: "설비번호",
        width: 300,
      },
      {
        id: "col_fxnm",
        field: "fxnm",
        caption: "설비명",
        width: 250,
      },
      {
        id: "col_losshh",
        field: "losshh",
        caption: "비가동시간",
        width: 250,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_fxnum2",
        field: "fxnum",
        caption: "설비번호",
        width: 320,
      },
      {
        id: "col_fxnm2",
        field: "fxnm",
        caption: "설비명",
        width: 250,
      },
      {
        id: "col_losshh2",
        field: "losshh",
        caption: "비가동시간",
        width: 250,
      },
    ],
  },
];
