import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdAllList",
    columns: [
      {
        id: "col_user_id",
        field: "user_id",
        caption: "사원명",
        width: 150,
      },
      {
        id: "col_postcd",
        field: "postcd",
        caption: "직위",
        width: 150,
      },
      {
        id: "col_email",
        field: "email",
        caption: "이메일",
        width: 200,
      },
      {
        id: "col_mobile_no",
        field: "mobile_no",
        caption: "핸드폰번호",
        width: 150,
      },
      {
        id: "col_memo",
        field: "memo",
        caption: "메모",
        width: 190,
      },
    ],
  },
];
