import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdList",
    columns: [
      {
        id: "col_recdt",
        field: "recdt",
        caption: "작성일",
        width: 150,
      },
      {
        id: "col_qcgb",
        field: "qcgb",
        caption: "검사구분",
        width: 150,
      },
      {
        id: "col_mngnum",
        field: "mngnum",
        caption: "관리번호",
        width: 180,
      },
      {
        id: "col_stdrev",
        field: "stdrev",
        caption: "Rev",
        width: 80,
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
        id: "col_proccd",
        field: "proccd",
        caption: "공정",
        width: 120,
      },
      {
        id: "col_remark",
        field: "remark",
        caption: "비고",
        width: 280,
      },
      {
        id: "col_insert_userid",
        field: "insert_userid",
        caption: "등록자",
        width: 120,
      },
      {
        id: "col_update_userid",
        field: "update_userid",
        caption: "수정자",
        width: 120,
      },
      {
        id: "col_qcyn",
        field: "qcyn",
        caption: "실적",
        width: 100,
      },
    ],
  },
  {
    gridName: "grdList2",
    columns: [
      {
        id: "col_qc_sort",
        field: "qc_sort",
        caption: "검사순번",
        width: 100,
      },
      {
        id: "col_inspeccd",
        field: "inspeccd",
        caption: "검사항목",
        width: 150,
      },
      {
        id: "col_qc_gubun",
        field: "qc_gubun",
        caption: "측정구분",
        width: 150,
      },
      {
        id: "col_qc_base",
        field: "qc_base",
        caption: "측정기준값",
        width: 100,
      },
      {
        id: "col_qc_scope1",
        field: "qc_scope1",
        caption: "범위계산1",
        width: 100,
      },
      {
        id: "col_qc_scope2",
        field: "qc_scope2",
        caption: "범위계산2",
        width: 100,
      },
      {
        id: "col_qc_min",
        field: "qc_min",
        caption: "하한값",
        width: 100,
      },
      {
        id: "col_qc_max",
        field: "qc_max",
        caption: "상한값",
        width: 100,
      },
      {
        id: "col_qc_spec",
        field: "qc_spec",
        caption: "측정기준명",
        width: 150,
      },
      {
        id: "col_qc_unit",
        field: "qc_unit",
        caption: "측정단위",
        width: 150,
      },
      {
        id: "col_chkmed",
        field: "chkmed",
        caption: "측정기",
        width: 150,
      },
      {
        id: "col_cycle",
        field: "cycle",
        caption: "주기",
        width: 100,
      },
      {
        id: "col_remark2",
        field: "remark",
        caption: "비고",
        width: 200,
      },
    ],
  },
];
