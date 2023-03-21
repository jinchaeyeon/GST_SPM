import { TSessionItem } from "../store/types";

export const SELECTED_FIELD = "selected";
export const EDIT_FIELD = "inEdit";
export const EXPANDED_FIELD: string = "expanded";
export const FORM_DATA_INDEX = "formDataIndex";

export const CLIENT_WIDTH = document.documentElement.clientWidth; // Client 너비값
export const GRID_MARGIN = 30; //그리드 양쪽 마진값
export const GNV_WIDTH = 150; //gnv 너비값
export const CLOSED_GNV_WIDTH = 29.563; // Menu closed 상태의 gnv 너비값
export const PAGE_SIZE = 20; //한번에 조회할 데이터 수 디폴트 값
export const GAP = 15; // 그리드 사이 갭

export const COM_CODE_DEFAULT_VALUE = { sub_code: "", code_name: "" };
export const RADIO_GROUP_DEFAULT_DATA = [{ value: "", label: "" }];

export const OLD_COMPANY = ["2207C612"];

export const DATE_COLUMN_WIDTH = 100; // 그리드의 date 컬럼의 너비 값
export const EDITABLE_DATE_COLUMN_WIDTH = 150; // 그리드의 수정가능한 date 컬럼의 너비 값

export const DEFAULT_SESSION_ITEM: TSessionItem[] = [
  { code: "user_id", value: "" },
  { code: "user_name", value: "" },
  { code: "orgdiv", value: "" },
  { code: "location", value: "" },
  { code: "position", value: "" },
  { code: "dptcd", value: "" },
];
