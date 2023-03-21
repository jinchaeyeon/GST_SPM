import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_user_name",
        field: "user_name",
        caption: "성명",
        width: 150,
      },
      {
        id: "col_dptcd",
        field: "dptcd",
        caption: "부서",
        width: 150,
      },
      {
        id: "col_postcd",
        field: "postcd",
        caption: "직위",
        width: 200,
      },
      {
        id: "col_chooses",
        field: "chooses",
        caption: "참조",
        width: 80,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_dptcd2",
        field: "dptcd",
        caption: "부서",
        width: 170,
      },
      {
        id: "col_resno",
        field: "resno",
        caption: "성명",
        width: 170,
      },
      {
        id: "col_postcd2",
        field: "postcd",
        caption: "직위",
        width: 150,
      },
      {
        id: "col_appgb",
        field: "appgb",
        caption: "결재구분",
        width: 130,
      },
      {
        id: "col_appseq",
        field: "appseq",
        caption: "결재순서",
        width: 100,
      },
      {
        id: "col_appline",
        field: "appline",
        caption: "결재라인",
        width: 140,
      },
      {
        id: "col_arbitragb",
        field: "arbitragb",
        caption: "전결유무",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_dptcd3",
        field: "dptcd",
        caption: "부서",
        width: 120,
      },
      {
        id: "col_resno2",
        field: "resno",
        caption: "성명",
        width: 130,
      },
      {
        id: "col_postcd3",
        field: "postcd",
        caption: "직위",
        width: 120,
      },
      {
        id: "col_appgb2",
        field: "appgb",
        caption: "결재구분",
        width: 130,
      },
    ],
  },
  {
    gridName: "grdList4",
    columns: [
      {
        id: "col_dptcd4",
        field: "dptcd",
        caption: "부서",
        width: 100,
      },
      {
        id: "col_resno4",
        field: "resno",
        caption: "성명",
        width: 100,
      },
      {
        id: "col_postcd4",
        field: "postcd",
        caption: "직위",
        width: 90,
      },
      {
        id: "col_appgb4",
        field: "appgb",
        caption: "결재구분",
        width: 80,
      },
    ],
  },
];
