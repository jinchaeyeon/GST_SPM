import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_itemnm",
        field: "itemnm",
        caption: "품목명",
        width: 150,
      },
      {
        id: "col_itemcd",
        field: "itemcd",
        caption: "품목코드",
        width: 200,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_sub_code",
        field: "sub_code",
        caption: "공정코드",
        width: 150,
      },
      {
        id: "col_code_name",
        field: "code_name",
        caption: "공정명",
        width: 200,
      },
    ],
  },
  {
    gridName: "grdList3",
    columns: [
      {
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 120,
      },
      {
        id: "col_procseq",
        field: "procseq",
        caption: "공정순서",
        width: 100,
      },
      {
        id: "col_outprocyn",
        field: "outprocyn",
        caption: "외주구분",
        width: 100,
      },
      {
        id: "col_prodemp",
        field: "prodemp",
        caption: "작업자",
        width: 150,
      },
      {
        id: "col_prodmac",
        field: "prodmac",
        caption: "설비",
        width: 150,
      },
      {
        id: "col_chlditemcd",
        field: "chlditemcd",
        caption: "소요자재코드",
        width: 150,
      },
      {
        id: "col_chlditemnm",
        field: "chlditemnm",
        caption: "소요자재명",
        width: 120,
      },
      {
        id: "col_unitqty",
        field: "unitqty",
        caption: "단위수량",
        width: 120,
      },
      {
        id: "col_qtyunit",
        field: "qtyunit",
        caption: "수량단위",
        width: 120,
      },
      {
        id: "col_outgb",
        field: "outgb",
        caption: "불출구분",
        width: 120,
      },
      {
        id: "col_procqty",
        field: "procqty",
        caption: "재공생산량",
        width: 120,
      },
      {
        id: "col_procunit",
        field: "procunit",
        caption: "생산량단위",
        width: 120,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 200,
      },
    ],
  },
];
