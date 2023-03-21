import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_category",
        field: "category",
        caption: "카테고리",
        width: 120,
      },
      {
        id: "col_person",
        field: "person",
        caption: "작성자",
        width: 120,
      },
      {
        id: "col_publishdate",
        field: "publishdate",
        caption: "공지기간",
        width: 280,
      },
      {
        id: "col_title",
        field: "title",
        caption: "제목",
        width: 150,
      },
      {
        id: "col_contents2",
        field: "contents2",
        caption: "내용",
        width: 800,
      },
      {
        id: "col_publish_yn",
        field: "publish_yn",
        caption: "공지게시여부",
        width: 120,
      },
      {
        id: "col_chooses_s",
        field: "chooses_s",
        caption: "참조",
        width: 80,
      },
      {
        id: "col_loadok_s",
        field: "loadok_s",
        caption: "확인",
        width: 80,
      },
      {
        id: "col_readok_s",
        field: "readok_s",
        caption: "열람",
        width: 80,
      },
    ],
  },
];
