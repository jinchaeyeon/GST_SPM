import { TGrid } from "../types";

export const gridList: Array<TGrid> = [
  {
    gridName: "grdAllList",
    columns: [
      {
        id: "col_user_id",
        field: "user_id",
        caption: "사용자ID",
        width: 120,
      },
      {
        id: "col_user_name",
        field: "user_name",
        caption: "사용자명",
        width: 200,
      },
      {
        id: "col_form_id",
        field: "form_id",
        caption: "폼ID",
        width: 120,
      },
      {
        id: "col_menu_name",
        field: "menu_name",
        caption: "폼이름",
        width: 120,
      },
      {
        id: "col_login_time",
        field: "login_time",
        caption: "접속시간",
        width: 160,
      },
      {
        id: "col_logout_time",
        field: "logout_time",
        caption: "종료시간",
        width: 160,
      },
      {
        id: "col_login_ip",
        field: "login_ip",
        caption: "접속IP",
        width: 120,
      },
      {
        id: "col_login_pc",
        field: "login_pc",
        caption: "접속PC",
        width: 120,
      },
    ],
  },
];
