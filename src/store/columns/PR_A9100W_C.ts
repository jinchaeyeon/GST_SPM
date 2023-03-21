import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 100,
      },
      {
        id: "col_item_btn",
        field: "item_btn",
        caption: " ",
        width: 50,
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
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 100,
      },
      {
        id: "col_bnatur",
        field: "bnatur",
        caption: "재질",
        width: 100,
      },
      {
        id: "col_itemacnt",
        field: "itemacnt",
        caption: "품목계정",
        width: 100,
      },
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 100,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT번호",
        width: 100,
      },
      {
        id: "col_qty",
        field: "qty",
        caption: "수량",
        width: 100,
      },
      {
        id: "col_invunit",
        field: "invunit",
        caption: "재고단위",
        width: 100,
      },
      {
        id: "col_totwgt",
        field: "totwgt",
        caption: "총중량",
        width: 100,
      },
      {
        id: "col_wgtunit",
        field: "wgtunit",
        caption: "중량단위",
        width: 100,
      },
      {
        id: "col_insert_time",
        field: "insert_time",
        caption: "입력일자",
        width: 160,
      },
    ],
  },
];
