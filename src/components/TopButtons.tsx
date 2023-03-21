import React, { useEffect } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { useState } from "react";
import { useRecoilState } from "recoil";
import { menusState } from "../store/atoms";
import { TPermissions } from "../store/types";
import { useApi } from "../hooks/api";
import { UseGetValueFromSessionItem } from "./CommonFunction";

interface ITopButtons {
  search: () => void;
  exportExcel: () => void;
  permissions: TPermissions;
}

const TopButtons = ({ search, exportExcel, permissions }: ITopButtons) => {
  const pathname: string = window.location.pathname.replace("/", "");
  const processApi = useApi();
  const [menus, setMenus] = useRecoilState(menusState);
  const userId = UseGetValueFromSessionItem("user_id");
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (menus) {
      const menu = menus.find((menu) => menu.formId === pathname);
      if (menu) {
        setIsFav(menu.isFavorite);
      }
    }
  }, [menus]);

  const saveFav = (e: any) => {
    fetchFavSaved(!isFav);
    setIsFav((prev) => !prev);
  };
  const fetchFavSaved = async (val: boolean) => {
    let data: any;
    const para = {
      formId: pathname,
    };
    try {
      data = await processApi<any>(val ? "fav" : "del-fav", para);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      fetchMenus();
    }
  };

  const fetchMenus = async () => {
    try {
      let menuPara = {
        para: "menus?userId=" + userId + "&category=WEB",
      };
      const menuResponse = await processApi<any>("menus", menuPara);

      setMenus(menuResponse.usableMenu);
    } catch (e: any) {
      console.log("menus error", e);
    }
  };

  return (
    <>
      <Button
        onClick={search}
        icon="search"
        //fillMode="outline"
        themeColor={"primary"}
        disabled={permissions.view ? false : true}
      >
        조회
      </Button>
      <Button
        title="Export Excel"
        onClick={exportExcel}
        icon="download"
        fillMode="outline"
        themeColor={"primary"}
        disabled={permissions.print ? false : true}
      >
        Excel
      </Button>
      <Button
        onClick={saveFav}
        title="즐겨찾기"
        icon={isFav ? "star" : "star-outline"}
        fillMode={"outline"}
        themeColor={"primary"}
      ></Button>
    </>
  );
};

export default TopButtons;
