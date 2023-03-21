import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_purnum",
        field: "purnum",
        caption: "발주번호",
        width: 160,
      },
      {
        id: "col_purdt",
        field: "purdt",
        caption: "발주일자",
        width: 130,
      },
      {
        id: "col_location",
        field: "location",
        caption: "사업장",
        width: 120,
      },
      {
        id: "col_pursts",
        field: "pursts",
        caption: "발주상태",
        width: 120,
      },
      {
        id: "col_custcd",
        field: "custcd",
        caption: "업체코드",
        width: 160,
      },
      {
        id: "col_custnm",
        field: "custnm",
        caption: "업체명",
        width: 160,
      },
      {
        id: "col_purqty",
        field: "purqty",
        caption: "발주량",
        width: 100,
      },
      {
        id: "col_amt",
        field: "amt",
        caption: "금액",
        width: 100,
      },
      {
        id: "col_wonamt",
        field: "wonamt",
        caption: "원화금액",
        width: 100,
      },
      {
        id: "col_taxamt",
        field: "taxamt",
        caption: "세액",
        width: 100,
      },
      {
        id: "col_totamt",
        field: "totamt",
        caption: "합계금액",
        width: 100,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 280,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 150,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 150,
      },
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_insiz",
        field: "insiz",
        caption: "규격",
        width: 120,
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
        id: "col_unitwgt",
        field: "unitwgt",
        caption: "단량",
        width: 100,
      },
      {
        id: "col_wgt",
        field: "wgt",
        caption: "발주중량",
        width: 100,
      },
      {
        id: "col_wgtunit",
        field: "wgtunit",
        caption: "중량단위",
        width: 100,
      },
      {
        id: "col_unpcalmeth",
        field: "unpcalmeth",
        caption: "계산방법",
        width: 120,
      },
      {
        id: "col_unp",
        field: "unp",
        caption: "단가",
        width: 100,
      },
      {
        id: "col_amt2",
        field: "amt",
        caption: "금액",
        width: 100,
      },
      {
        id: "col_wonamt2",
        field: "wonamt",
        caption: "원화금액",
        width: 100,
      },
      {
        id: "col_taxamt2",
        field: "taxamt",
        caption: "세액",
        width: 100,
      },
      {
        id: "col_totamt2",
        field: "totamt",
        caption: "합계금액",
        width: 100,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 400,
      },
    ],
  },{
    gridName: "grdList3",
    columns: [
      {
        id: "col_itemnm2",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_lotnum",
        field: "lotnum",
        caption: "LOT NO",
        width: 150,
      },
      {
        id: "col_qty2",
        field: "qty",
        caption: "수량",
        width: 100,
      },
    ],
  },
];
