import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_outdt",
        field: "outdt",
        caption: "출고일자",
        width: 120,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 120,
      },
      {
        id: "col_itemno",
        field: "itemno",
        caption: "품번",
        width: 100,
      },
      {
        id: "col_orglot",
        field: "orglot",
        caption: "원본LOT",
        width: 120,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 120,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 100,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 170,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 150,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "수량단위",
        width: 120,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 100,
      },
      {
        id: "col_custcd",
        field: "custcd",
        caption: "업체코드",
        width: 120,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 100,
      },
      {
        id: "col_doexdiv",
        field: "doexdiv",
        caption: "내수구분",
        width: 150,
      },
      {
        id: "col_outkind",
        field: "outkind",
        caption: "출고유형",
        width: 150,
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
    ],
  },
];
