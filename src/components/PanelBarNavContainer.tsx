import { useCallback, useState, useEffect } from "react";
import {
  PanelBar,
  PanelBarItem,
  PanelBarSelectEventArguments,
} from "@progress/kendo-react-layout";
import { useHistory, useLocation, withRouter } from "react-router-dom";
import { Button } from "@progress/kendo-react-buttons";
import { useRecoilState } from "recoil";
import {
  isMobileMenuOpendState,
  menusState,
  passwordExpirationInfoState,
  loginResultState,
  isMenuOpendState,
  deletedAttadatnumsState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import UserOptionsWindow from "./Windows/CommonWindows/UserOptionsWindow";
import ChangePasswordWindow from "./Windows/CommonWindows/ChangePasswordWindow";
import SystemOptionWindow from "./Windows/CommonWindows/SystemOptionWindow";
import { useApi } from "../hooks/api";
import { Iparameters, TLogParaVal, TPath } from "../store/types";
import Loading from "./Loading";
import {
  AppName,
  ButtonContainer,
  Content,
  Footer,
  Gnv,
  Logo,
  MenuSearchBox,
  Modal,
  PageWrap,
  SmallGnv,
  TopTitle,
  Wrapper,
} from "../CommonStyled";
import { getBrowser, resetLocalStorage, UseGetIp } from "./CommonFunction";
import {
  AutoComplete,
  AutoCompleteCloseEvent,
} from "@progress/kendo-react-dropdowns";
import { DEFAULT_ATTDATNUMS } from "./CommonString";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Loader from "./Loader";

const paths = [
  {
    path: "/Home",
    index: ".0",
  },
  {
    path: "/Notice",
    index: ".1",
  },
  {
    path: "/QnA",
    index: ".2",
  },
  {
    path: "/MeetingView",
    index: ".3",
  },
  {
    path: "/ProjectSchedule",
    index: ".4",
  },
  {
    path: "/MeetingManagement",
    index: ".5",
  },
];

const PanelBarNavContainer = (props: any) => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const accessToken = localStorage.getItem("accessToken");
  const [token] = useState(accessToken);
  const [pwExpInfo, setPwExpInfo] = useRecoilState(passwordExpirationInfoState);
  useEffect(() => {
    if (token === null) fetchMenus();
  }, [token]);
  const [menus, setMenus] = useRecoilState(menusState);
  const [isMobileMenuOpend, setIsMobileMenuOpend] = useRecoilState(
    isMobileMenuOpendState,
  );
  const [isMenuOpend, setIsMenuOpend] = useRecoilState(isMenuOpendState);
  const companyCode = loginResult ? loginResult.companyCode : "";
  const customerName = loginResult ? loginResult.customerName : "";
  const userId = loginResult ? loginResult.userId : "";
  const loginKey = loginResult ? loginResult.loginKey : "";
  const role = loginResult ? loginResult.role : "";
  const isAdmin = role === "ADMIN";
  const userName = loginResult ? loginResult.userName : "";
  const [isLoaded, setIsLoaded] = useState(false);
  // Kendo Chart에 Theme 적용하는데 간헐적으로 오류 발생하여 0.5초후 렌더링되도록 처리함 (모든 메뉴 새로고침 시 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const { switcher, themes, currentTheme = "" } = useThemeSwitcher();

  // 삭제할 첨부파일 리스트를 담는 함수
  const [deletedAttadatnums, setDeletedAttadatnums] = useRecoilState(
    deletedAttadatnumsState,
  );

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState,
  );

  const [previousRoute, setPreviousRoute] = useState("");
  const [formKey, setFormKey] = useState("");

  const [ip, setIp] = useState(null);
  UseGetIp(setIp);

  let broswer = getBrowser();
  broswer = broswer.substring(broswer.lastIndexOf("/") + 1);

  // 반응형 처리
  const [clientWidth, setClientWidth] = useState(
    document.documentElement.getBoundingClientRect().width,
  );
  useEffect(() => {
    const handleWindowResize = () => {
      setClientWidth(document.documentElement.getBoundingClientRect().width);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });

  useEffect(() => {
    if (token && menus === null) fetchMenus();
  }, [menus]);

  useEffect(() => {
    checkPwExpInfo();
  }, []);

  const checkPwExpInfo = () => {
    if (pwExpInfo && pwExpInfo.useExpiration) {
      if (pwExpInfo.status !== "Ok") {
        setChangePasswordWindowVisible(true);
      }
      // 로그인 후 최초 한번만 팝업 뜨도록
      setPwExpInfo((prev) => ({ ...prev, useExpiration: false }));
    }
  };

  const fetchMenus = useCallback(async () => {
    return false;
    try {
      let menuPara = {
        para: "menus?userId=" + userId + "&category=WEB",
      };
      const menuResponse = await processApi<any>("menus", menuPara);
      setMenus(menuResponse.usableMenu);
    } catch (e: any) {
      console.log("menus error", e);
    }
  }, []);

  // let paths: Array<TPath> = [];
  // if (menus !== null) {
  //   // Home push
  //   menus
  //     .filter((menu: any) => menu.formId === "Home")
  //     .forEach((menu: any, idx: number) => {
  //       paths.push({
  //         path: "/" + menu.formId,
  //         menuName: menu.menuName,
  //         index: "." + idx,
  //         menuId: menu.menuId,
  //         parentMenuId: menu.parentMenuId,
  //         menuCategory: menu.menuCategory,
  //         isFavorite: menu.isFavorite,
  //       });
  //     });

  //   // 즐겨찾기 그룹 push
  //   paths.push({
  //     path: "",
  //     menuName: "즐겨찾기",
  //     index: "." + 1,
  //     menuId: "fav",
  //     parentMenuId: "",
  //     menuCategory: "GROUP",
  //     isFavorite: false,
  //   });

  //   // 즐겨찾기 Menu push
  //   menus
  //     .filter((menu) => menu.menuCategory === "WEB" && menu.isFavorite)
  //     .forEach((menu, idx: number) => {
  //       paths.push({
  //         path: "/" + menu.formId,
  //         menuName: menu.menuName,
  //         index: ".1." + idx,
  //         menuId: menu.menuId,
  //         parentMenuId: "fav",
  //         menuCategory: menu.menuCategory,
  //         isFavorite: menu.isFavorite,
  //       });
  //     });

  //   // Group push (Home, PlusWin6 Group 제외)
  //   menus
  //     .filter(
  //       (menu: any) =>
  //         menu.menuCategory === "GROUP" &&
  //         menu.menuName !== "Home" &&
  //         menu.menuName !== "PlusWin6",
  //     )
  //     .forEach((menu: any, idx: number) => {
  //       paths.push({
  //         path: "/" + menu.formId,
  //         menuName: menu.menuName,
  //         index: "." + (idx + 2), // home, 즐겨찾기 때문에 +2
  //         menuId: menu.menuId,
  //         parentMenuId: menu.parentMenuId,
  //         menuCategory: menu.menuCategory,
  //         isFavorite: menu.isFavorite,
  //       });
  //     });

  //   // Group별 Menu push
  //   paths.forEach((path: TPath) => {
  //     menus
  //       .filter(
  //         (menu: any) =>
  //           menu.menuCategory === "WEB" && path.menuId === menu.parentMenuId,
  //       )
  //       .forEach((menu: any, idx: number) => {
  //         paths.push({
  //           path: "/" + menu.formId,
  //           menuName: menu.menuName,
  //           index: path.index + "." + idx,
  //           menuId: menu.menuId,
  //           parentMenuId: menu.parentMenuId,
  //           menuCategory: menu.menuCategory,
  //           isFavorite: menu.isFavorite,
  //         });
  //       });
  //   });
  // }

  const [userOptionsWindowVisible, setUserOptionsWindowVisible] =
    useState<boolean>(false);
  const [changePasswordWindowVisible, setChangePasswordWindowVisible] =
    useState<boolean>(false);
  const [systemOptionWindowWindowVisible, setSystemOptionWindowVisible] =
    useState<boolean>(false);

  const onSelect = (event: PanelBarSelectEventArguments) => {
    const { route, className = "" } = event.target.props;

    // if (route) {
    //   if (route.includes("Home")) {
    //     switcher({ theme: "dark" });
    //   } else {
    //     switcher({ theme: "light" });
    //   }
    // }
    props.history.push(route);

    if (route) {
      setIsMobileMenuOpend(false);
      setUserOptionsWindowVisible(false);
      setChangePasswordWindowVisible(false);
      setSystemOptionWindowVisible(false);
    }

    if (className.includes("custom-option")) {
      setUserOptionsWindowVisible(true);
    } else if (className.includes("change-password")) {
      setChangePasswordWindowVisible(true);
    } else if (className.includes("system-option")) {
      setSystemOptionWindowVisible(true);
    }
  };

  // useEffect(() => {
  //   if (token && ip !== null) {
  //     const pathname = location.pathname.replace("/", "");

  //     // 폼 로그 처리
  //     if (previousRoute === "") {
  //       const pathitem = paths.find(
  //         (item) => item.path.replace("/", "") === pathname
  //       );

  //       //최초 오픈
  //       fetchToLog({
  //         work_type: "OPEN",
  //         form_id: pathname,
  //         form_name: pathitem ? pathitem.menuName : "",
  //         form_login_key: "",
  //       });
  //     } else if (pathname !== previousRoute) {
  //       const pathitem = paths.find(
  //         (item) => item.path.replace("/", "") === pathname
  //       );
  //       const previousPathitem = paths.find(
  //         (item) => item.path.replace("/", "") === previousRoute
  //       );
  //       // 오픈, 클로즈
  //       fetchToLog({
  //         work_type: "CLOSE",
  //         form_id: previousRoute,
  //         form_name: previousPathitem ? previousPathitem.menuName : "",
  //         form_login_key: formKey,
  //       });
  //       fetchToLog({
  //         work_type: "OPEN",
  //         form_id: pathname,
  //         form_name: pathitem ? pathitem.menuName : "",
  //         form_login_key: "",
  //       });
  //     }

  //     // 이전 루트 저장
  //     setPreviousRoute(pathname);
  //   }
  // }, [location, ip]);

  // const fetchToLog = async (logParaVal: TLogParaVal) => {
  //   let data: any;

  //   const logPara: Iparameters = {
  //     procedureName: "sys_sav_form_access_log",
  //     pageNumber: 0,
  //     pageSize: 0,
  //     parameters: {
  //       "@p_work_type": logParaVal.work_type,
  //       "@p_user_id": userId,
  //       "@p_form_id": logParaVal.form_id,
  //       "@p_form_name": logParaVal.form_name,

  //       "@p_login_key": logParaVal.form_login_key,
  //       "@p_parent_login_key": loginKey,

  //       "@p_ip_address": ip,
  //       "@p_pc": broswer,
  //       "@p_mac_address": "",
  //     },
  //   };

  //   try {
  //     data = await processApi<any>("procedure", logPara);
  //   } catch (error) {
  //     data = null;
  //   }
  //   if (data.isSuccess === true) {
  //     if (logParaVal.work_type === "OPEN") {
  //       const { form_login_key } = data.tables[0].Rows[0];
  //       setFormKey(form_login_key);
  //     }
  //   } else {
  //     console.log("[An error occured to log]");
  //     console.log(data);
  //   }
  // };

  const setSelectedIndex = (pathName: any) => {
    let currentPath: any = paths.find((item: any) => item.path === pathName);

    return currentPath ? currentPath.index : 0;
  };

  const selected = setSelectedIndex(props.location.pathname);

  const logout = () => {
    // switcher({ theme: "light" });
    fetchLogout();
    resetLocalStorage();
    setIsMobileMenuOpend(false);
    if (isAdmin) {
      history.push("/Admin");
    } else {
      history.push("/");
    }
    // window.location.href = "/";
  };

  const fetchLogout = async () => {
    let data: any;

    const para = {
      accessToken: accessToken,
    };

    try {
      data = await processApi<any>("logout", para);
    } catch (error) {
      data = null;
    }
    if (data === null) {
      console.log("[An error occured to log for logout]");
      console.log(data);
    }
  };

  const onMenuBtnClick = () => {
    setIsMobileMenuOpend((prev) => !prev);
  };

  const history = useHistory();

  // 새로고침하거나 Path 변경 시
  useEffect(() => {
    const handleTabClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      return (event.returnValue = "true");
    };

    const handleUnload = () => {
      // unsavedAttadatnums가 있으면 삭제처리
      if (unsavedAttadatnums.attdatnums.length > 0) {
        setDeletedAttadatnums(unsavedAttadatnums);
      }
    };

    const unlisten = history.listen(() => {
      handleUnload();
    });

    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("unload", handleUnload);

    return () => {
      unlisten();
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("unload", handleUnload);
    };
  }, [
    unsavedAttadatnums,
    setUnsavedAttadatnums,
    history,
    setDeletedAttadatnums,
  ]);

  const fetchToDeletedAttachment = useCallback(
    async (type: string, attdatnums: string[]) => {
      let data: any;

      attdatnums.forEach(async (attdatnum) => {
        try {
          data = await processApi<any>("attachment-delete", {
            attached: `attachment?type=${type}&attachmentNumber=${attdatnum}`,
          });
        } catch (error) {
          data = null;
        }

        if (data === null) {
          console.log("An error occured to delete a file of " + attdatnum);
        }
      });
    },
    [],
  );

  // 첨부파일 삭제
  useEffect(() => {
    if (deletedAttadatnums.type && deletedAttadatnums.attdatnums.length > 0) {
      fetchToDeletedAttachment(
        deletedAttadatnums.type,
        deletedAttadatnums.attdatnums,
      );

      // 초기화
      setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
      setDeletedAttadatnums(DEFAULT_ATTDATNUMS);
    }
  }, [deletedAttadatnums]);

  if (!isLoaded) {
    return <Loader />;
  }

  return (
    <>
      <Wrapper isMobileMenuOpend={isMobileMenuOpend} theme={currentTheme}>
        <Modal isMobileMenuOpend={isMobileMenuOpend} onClick={onMenuBtnClick} />
        {isMenuOpend ? (
          <Gnv isMobileMenuOpend={isMobileMenuOpend} theme={currentTheme}>
            <AppName onClick={() => setIsMenuOpend(false)} theme={currentTheme}>
              <Logo size="32px" />
            </AppName>
            {isAdmin ? (
              <PanelBar
                selected={String(selected)}
                expandMode={"single"}
                onSelect={onSelect}
              >
                <PanelBarItem title={"Home"} route="/Home" />
                <PanelBarItem title={"공지사항"} route="/Notice" />
                <PanelBarItem title={"QnA"} route="/QnA" />
                <PanelBarItem title={"회의록 열람"} route="/MeetingView" />
                <PanelBarItem
                  title={"프로젝트 일정계획"}
                  route="/ProjectSchedule"
                />
                <PanelBarItem
                  title={"회의록 관리"}
                  route="/MeetingManagement"
                />
                                <PanelBarItem
                  title={"프로젝트 마스터"}
                  route="/ProjectMaster"
                />
                <PanelBarItem title={"설정"} icon={"gear"}>
                  <PanelBarItem
                    title={"비밀번호 변경"}
                    route={undefined}
                    className="change-password"
                  ></PanelBarItem>
                </PanelBarItem>
              </PanelBar>
            ) : (
              <PanelBar
                selected={String(selected)}
                expandMode={"single"}
                onSelect={onSelect}
              >
                <PanelBarItem title={"Home"} route="/Home" />
                <PanelBarItem title={"공지사항"} route="/Notice" />
                <PanelBarItem title={"QnA"} route="/QnA" />
                <PanelBarItem title={"회의록 열람"} route="/MeetingView" />
                <PanelBarItem
                  title={"프로젝트 일정계획"}
                  route="/ProjectSchedule"
                />
                <PanelBarItem title={"설정"} icon={"gear"}>
                  <PanelBarItem
                    title={"비밀번호 변경"}
                    route={undefined}
                    className="change-password"
                  ></PanelBarItem>
                </PanelBarItem>
              </PanelBar>
            )}

            <ButtonContainer
              flexDirection={"column"}
              style={{ marginTop: "10px", gap: "5px" }}
            >
              <Button
                onClick={logout}
                icon={"logout"}
                fillMode={"flat"}
                themeColor={"secondary"}
              >
                로그아웃
              </Button>
            </ButtonContainer>
          </Gnv>
        ) : (
          <SmallGnv theme={currentTheme}>
            <Button
              icon="menu"
              fillMode={"flat"}
              themeColor={"primary"}
              onClick={() => setIsMenuOpend(true)}
            />
          </SmallGnv>
        )}
        <Content isMenuOpen={isMenuOpend}>
          <TopTitle>
            <div style={{ width: "30px" }}></div>
            <AppName theme={currentTheme}>
              <Logo size="32px" />
            </AppName>
            <Button
              icon="menu"
              themeColor={"primary"}
              fillMode={"flat"}
              onClick={onMenuBtnClick}
            />
          </TopTitle>
          <PageWrap>{props.children}</PageWrap>
        </Content>
        {userOptionsWindowVisible && (
          <UserOptionsWindow setVisible={setUserOptionsWindowVisible} />
        )}
        {changePasswordWindowVisible && (
          <ChangePasswordWindow setVisible={setChangePasswordWindowVisible} />
        )}
        {systemOptionWindowWindowVisible && (
          <SystemOptionWindow setVisible={setSystemOptionWindowVisible} />
        )}

        <Loading />
      </Wrapper>
      <Footer>
        <div>{!isAdmin && "[업무시간] 평일 09:00-18:00"}</div>
        <div className="default">
          <div>
            {userName}({userId})
          </div>
          <div>{customerName}</div>
          <div>{ip}</div>
        </div>
      </Footer>
    </>
  );
};

export default withRouter(PanelBarNavContainer);
