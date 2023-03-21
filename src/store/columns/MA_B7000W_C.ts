import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 120,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 280,
      },
      {
        id: "col_itemlvl1",
        field: "itemlvl1",
        caption: "대분류",
        width: 120,
      },
      {
        id: "col_itemlvl2",
        field: "itemlvl2",
        caption: "중분류",
        width: 120,
      },
      {
        id: "col_itemlv3",
        field: "itemlv3",
        caption: "소분류",
        width: 120,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 120,
      },
      {
        id: "col_spec",
        field: "spec",
        caption: "사양",
        width: 120,
      },
      {
        id: "col_bnatur_insiz",
        field: "bnatur_insiz",
        caption: "소재규격",
        width: 120,
      },
      {
        id: "col_safeqty",
        field: "safeqty",
        caption: "안전재고량",
        width: 120,
      },
      {
        id: "col_stockqty",
        field: "stockqty",
        caption: "재고수량",
        width: 120,
      },
      {
        id: "col_stockwgt",
        field: "stockwgt",
        caption: "재고중량",
        width: 120,
      },
      {
        id: "col_load_place_bc",
        field: "load_place_bc",
        caption: "적재장소",
        width: 120,
      },
      {
        id: "col_itemgrade",
        field: "itemgrade",
        caption: "품목등급",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdLotDetail",
    columns: [
      {
        id: "col_gubun",
        field: "gubun",
        caption: "구분",
        width: 120,
      },
      {
        id: "col_indt",
        field: "indt",
        caption: "발생일자",
        width: 120,
      },
      {
        id: "col_baseqty",
        field: "baseqty",
        caption: "기초재고수량",
        width: 120,
      },
      {
        id: "col_inqty",
        field: "inqty",
        caption: "입고수량",
        width: 120,
      },
      {
        id: "col_outqty",
        field: "outqty",
        caption: "출고수량",
        width: 95,
      },
      {
        id: "col_inwgt",
        field: "inwgt",
        caption: "입고중량",
        width: 120,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 120,
      },
      {
        id: "col_recnum",
        field: "recnum",
        caption: "관리번호",
        width: 120,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 120,
      },
    ],
  },
  {
    gridName: "grdStockDetail",
    columns: [
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 200,
      },
      {
        id: "col_stockqty2",
        field: "stockqty",
        caption: "재고수량",
        width: 120,
      },
    ],
  },
];
