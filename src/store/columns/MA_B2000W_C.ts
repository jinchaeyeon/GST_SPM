import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_purdt",
        field: "purdt",
        caption: "발주일자",
        width: 100,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 180,
      },
      {
        id: "col_project",
        field: "project",
        caption: "프로젝트",
        width: 100,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 220,
      },
      {
        id: "col_itemnm2",
        field: "itemnm2",
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
        id: "col_bnatur",
        field: "bnatur",
        caption: "재질",
        width: 80,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "발주수량",
        width: 80,
      },
      {
        id: "col_inqty",
        field: "inqty",
        caption: "입고수량",
        width: 80,
      },
      {
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "단위",
        width: 80,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 80,
      },
      {
        id: "col_amt",
        field: "amt",
        caption: "금액",
        width: 80,
      },
      {
        id: "col_taxamt",
        field: "taxamt",
        caption: "세액",
        width: 80,
      },
      {
        id: "col_totamt",
        field: "totamt",
        caption: "합계금액",
        width: 100,
      },
      {
        id: "col_purtype",
        field: "purtype",
        caption: "형태",
        width: 100,
      },
      {
        id: "col_finyn",
        field: "finyn",
        caption: "완료여부",
        width: 100,
      },
      {
        id: "col_purno",
        field: "purno",
        caption: "발주번호",
        width: 200,
      },
      {
        id: "col_ordnum",
        field: "ordnum",
        caption: "수주번호",
        width: 200,
      },
    ],
  },
];
