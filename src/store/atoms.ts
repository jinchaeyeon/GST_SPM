import { atom, AtomEffect, DefaultValue } from "recoil";
import { DEFAULT_SESSION_ITEM } from "../components/CommonString";
import {
  TLoginResult,
  TMenu,
  TPasswordExpirationInfo,
  TSessionItem,
} from "./types";

const localStorageEffect: <T>(key: string) => AtomEffect<T> =
  (key: string) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);

    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch (e) {
        localStorage.removeItem(key);
        setSelf(new DefaultValue());
      }
    }
    onSet((newValue: any) => {
      if (newValue instanceof DefaultValue || newValue == null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
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
export const isMenuOpendState = atom<boolean>({
  key: "isMenuOpendState",
  default: true,
});

export const isLoading = atom<boolean>({
  key: "isLoading",
  default: false,
});
