import { atom, AtomEffect, DefaultValue } from "recoil";
import { DEFAULT_SESSION_ITEM } from "../components/CommonString";
import {
  TAttachmentType,
  TLoginResult,
  TMenu,
  TPasswordExpirationInfo,
  TSessionItem,
} from "./types";
import  secureLocalStorage  from  "react-secure-storage";

const localStorageEffect: <T>(key: string) => AtomEffect<T> =
  (key: string) =>
  ({ setSelf, onSet }) => {
    const savedValue: any = secureLocalStorage.getItem(key);

    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch (e) {
        secureLocalStorage.removeItem(key.replace("@secure.", ""));
        setSelf(new DefaultValue());
      }
    }
    onSet((newValue: any) => {
      if (newValue instanceof DefaultValue || newValue == null) {
        secureLocalStorage.removeItem(key.replace("@secure.", ""));
      } else {
        secureLocalStorage.setItem(key, JSON.stringify(newValue));
      }
    });
  };
export const loginResultState = atom<TLoginResult>({
  key: "loginResultState",
  default: null as any,
  effects_UNSTABLE: [localStorageEffect("loginResult")],
});

export const menusState = atom<Array<TMenu>>({
  key: "menusState",
  default: null as any,
  effects_UNSTABLE: [localStorageEffect("menus")],
});

export const sessionItemState = atom<Array<TSessionItem>>({
  key: "sessionItemState",
  default: DEFAULT_SESSION_ITEM,
  effects_UNSTABLE: [localStorageEffect("sessionItem")],
});

export const passwordExpirationInfoState = atom<TPasswordExpirationInfo>({
  key: "passwordExpirationInfoState",
  default: null as any,
  effects_UNSTABLE: [localStorageEffect("passwordExpirationInfo")],
});

export const totalDataNumber = atom({
  key: "totalDataNumber",
  default: 0,
});

export const deletedRowsState = atom<object[]>({
  key: "deletedRowsState",
  default: [],
});

export const isMobileMenuOpendState = atom<boolean>({
  key: "isMobileMenuOpendState",
  default: false,
});

export const titles = atom<string>({
  key: "titles",
  default: "",
});

export const isMenuOpendState = atom<boolean>({
  key: "isMenuOpendState",
  default: true,
});

export const isLoading = atom<boolean>({
  key: "isLoading",
  default: false,
});

export const fcmTokenState = atom({
  key: "fcmTokenState",
  default: "",
});

export const queryState = atom({
  key: "queryState",
  default: "",
  effects_UNSTABLE: [localStorageEffect("queryState")],
});

// 삭제된 데이터의 첨부파일 번호를 저장하는 용도
// 값이 set되면  PanelBarNavContainer에서 useEffect로 서버에서 파일을 삭제 처리하도록 함
export const deletedAttadatnumsState = atom<{
  type: TAttachmentType[];
  attdatnums: string[];
}>({
  key: "deletedAttadatnums",
  default: { type: [], attdatnums: [] },
});

// 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 번호를 저장하는 용도.
// unsavedAttadatnums 값이 존재하는데 저장화면을 벗어나면(path 변경, 팝업닫기, 새로고침 시) 서버에서 파일을 삭제 처리하도록 함
export const unsavedAttadatnumsState = atom<{
  type: TAttachmentType[];
  attdatnums: string[];
}>({
  key: "unsavedAttadatnums",
  default: { type: [], attdatnums: [] },
});

// 메인 화면에서 그리드 행 클릭하여 다른 화면으로 이동 시 저장할 조회조건 값
export const filterValueState = atom<{
  type: "meeting" | "qna" | "project" | "reception" | null;
  dataItem: any;
}>({
  key: "filterValueState",
  default: {
    type: null,
    dataItem: {},
  },
});

export const OSState = atom<boolean>({
  key: "OSState",
  default: false,
  effects_UNSTABLE: [localStorageEffect("OSState")],
});

export const isFilterheightstate = atom<number>({
  key: "isFilterheightstate",
  default: 0,
});

export const isFilterHideState = atom<boolean>({
  key: "isFilterHideState",
  default: document.documentElement.clientWidth <= 1200,
});

export const isFilterHideState2 = atom<boolean>({
  key: "isFilterHideState2",
  default: document.documentElement.clientWidth <= 1200,
});
