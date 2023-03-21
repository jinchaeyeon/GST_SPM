import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdMyList",
    columns: [
      {
        id: "col_person1",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_appnm1",
        field: "appnm",
        caption: "결재제목",
        width: 280,
      },
      {
        id: "col_pgmgb1",
        field: "pgmgb",
        caption: "결재문서",
        width: 120,
      },
      {
        id: "col_recdt1",
        field: "recdt",
        caption: "작성일",
        width: 120,
      },
      {
        id: "col_appyn1",
        field: "appyn",
        caption: "결재유무",
        width: 95,
      },
      {
        id: "col_appnum1",
        field: "appnum",
        caption: "결재번호",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdUndecideList",
    columns: [
      {
        id: "col_person2",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_appnm2",
        field: "appnm",
        caption: "결재제목",
        width: 280,
      },
      {
        id: "col_pgmgb2",
        field: "pgmgb",
        caption: "결재문서",
        width: 120,
      },
      {
        id: "col_recdt2",
        field: "recdt",
        caption: "작성일",
        width: 120,
      },
      {
        id: "col_appyn2",
        field: "appyn",
        caption: "결재유무",
        width: 95,
      },
      {
        id: "col_appnum2",
        field: "appnum",
        caption: "결재번호",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdAlreadyList",
    columns: [
      {
        id: "col_person3",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_appnm3",
        field: "appnm",
        caption: "결재제목",
        width: 280,
      },
      {
        id: "col_pgmgb3",
        field: "pgmgb",
        caption: "결재문서",
        width: 120,
      },
      {
        id: "col_recdt3",
        field: "recdt",
        caption: "작성일",
        width: 120,
      },
      {
        id: "col_appyn3",
        field: "appyn",
        caption: "결재유무",
        width: 95,
      },
      {
        id: "col_rtsts3",
        field: "rtsts",
        caption: "반려유무",
        width: 120,
      },
      {
        id: "col_appnum3",
        field: "appnum",
        caption: "결재번호",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdRefChkList",
    columns: [
      {
        id: "col_person4",
        field: "person",
        caption: "담당자",
        width: 120,
      },
      {
        id: "col_appnm4",
        field: "appnm",
        caption: "결재제목",
        width: 280,
      },
      {
        id: "col_pgmgb4",
        field: "pgmgb",
        caption: "결재문서",
        width: 120,
      },
      {
        id: "col_recdt4",
        field: "recdt",
        caption: "작성일",
        width: 120,
      },
      {
        id: "col_appyn4",
        field: "appyn",
        caption: "결재유무",
        width: 95,
      },
      {
        id: "col_appnum4",
        field: "appnum",
        caption: "결재번호",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdLineList",
    columns: [
      {
        id: "col_postcd",
        field: "postcd",
        caption: "직위",
        width: 120,
      },
      {
        id: "col_appline",
        field: "appline",
        caption: "결재라인",
        width: 120,
      },
      {
        id: "col_resno",
        field: "resno",
        caption: "결재자",
        width: 120,
      },
      {
        id: "col_restime",
        field: "restime",
        caption: "결재일시",
        width: 160,
      },
      {
        id: "col_appyn5",
        field: "appyn",
        caption: "결재유무",
        width: 95,
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
    gridName: "grdRefList",
    columns: [
      {
        id: "col_appgb",
        field: "appgb",
        caption: "결재구분",
        width: 120,
      },
      {
        id: "col_postcd2",
        field: "postcd",
        caption: "직위",
        width: 120,
      },
      {
        id: "col_resno2",
        field: "resno",
        caption: "결재자",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdCmtList",
    columns: [
      {
        id: "col_comment",
        field: "comment",
        caption: "코멘트",
        width: 250,
      },
      {
        id: "col_time",
        field: "time",
        caption: "등록일자",
        width: 120,
      },
      {
        id: "col_insert_user",
        field: "insert_user",
        caption: "등록자",
        width: 120,
      },
    ],
  },
];
