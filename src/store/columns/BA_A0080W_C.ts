import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_recdt",
        field: "recdt",
        caption: "적용일",
        width: 150,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 250,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 250,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 150,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 150,
      },
      {
        id: "col_amtunit",
        field: "amtunit",
        caption: "화폐단위",
        width: 150,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 150,
      },
      {
        id: "col_itemlvl1",
        field: "itemlvl1",
        caption: "대분류",
        width: 150,
      },
      {
        id: "col_itemlvl2",
        field: "itemlvl2",
        caption: "중분류",
        width: 150,
      },
      {
        id: "col_itemlvl3",
        field: "itemlvl3",
        caption: "소분류",
        width: 150,
      },
      {
        id: "col_spec",
        field: "spec",
        caption: "사양",
        width: 150,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 150,
      },
    ],
  },
];
