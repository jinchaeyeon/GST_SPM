import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_qcdt",
        field: "qcdt",
        caption: "검사일자",
        width: 120,
      },
      {
        id: "col_person",
        field: "person",
        caption: "담당자",
        width: 150,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
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
        width: 150,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 120,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 150,
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
        id: "col_goodqty",
        field: "goodqty",
        caption: "양품수량",
        width: 100,
      },
      {
        id: "col_files",
        field: "files",
        caption: "첨부파일",
        width: 350,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_badcd",
        field: "badcd",
        caption: "불량유형",
        width: 150,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 100,
      },
    ],
  },
];
