import { Button } from "@progress/kendo-react-buttons";
import {
  PanelBar,
  PanelBarItem,
  PanelBarSelectEventArguments,
} from "@progress/kendo-react-layout";
import { ListView, ListViewItemProps } from "@progress/kendo-react-listview";
import { Popup } from "@progress/kendo-react-popup";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useHistory, withRouter } from "react-router-dom";
import { useRecoilState } from "recoil";
import {
  AppName,
  Content,
  Footer,
  Gnv,
  Logo,
  Modal,
  PageWrap,
  SmallGnv,
  TopTitle,
  Wrapper,
} from "../CommonStyled";
import { useApi } from "../hooks/api";
import {
  deletedAttadatnumsState,
  isMenuOpendState,
  isMobileMenuOpendState,
  loginResultState,
  menusState,
  passwordExpirationInfoState,
  unsavedAttadatnumsState,
} from "../store/atoms";
import { UseGetIp, getBrowser, resetLocalStorage } from "./CommonFunction";
import { DEFAULT_ATTDATNUMS } from "./CommonString";
import Loader from "./Loader";
import Loading from "./Loading";
import ChangePasswordWindow from "./Windows/CommonWindows/ChangePasswordWindow";
import SystemOptionWindow from "./Windows/CommonWindows/SystemOptionWindow";
import UserOptionsWindow from "./Windows/CommonWindows/UserOptionsWindow";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

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
    path: "/SharedDocumentView",
    index: ".4",
  },
  {
    path: "/ProjectSchedule",
    index: ".5",
  },
  {
    path: "/MeetingManagement",
    index: ".6",
  },
  {
    path: "/SharedDocumentManagement",
    index: ".7",
  },
  {
    path: "/Reception_Answer",
    index: ".8",
  },
  {
    path: "/Task_Order",
    index: ".9",
  },
  {
    path: "/Record",
    index: ".10",
  },
  {
    path: "/ProjectMaster",
    index: ".11",
  },
  {
    path: "/FAQ",
    index: ".12",
  },
  {
    path: "/ProjectMonitoring",
    index: ".13",
  },
];

// 탭 닫기 핸들러 함수
const handleTabClose = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  return (event.returnValue = "true");
};

// beforeunload 리스너 추가 함수
export const addBeforeUnloadListener = () => {
  window.addEventListener('beforeunload', handleTabClose);
};

export const removeBeforeUnloadListener = () => {
  window.removeEventListener('beforeunload', handleTabClose);
};

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
    isMobileMenuOpendState
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

  const anchor = useRef<HTMLButtonElement | null>(null);
  const [show, setShow] = useState(false);
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
    deletedAttadatnumsState
  );

  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const messaging = getMessaging(app);
  const [previousRoute, setPreviousRoute] = useState("");
  const [formKey, setFormKey] = useState("");

  const [ip, setIp] = useState(null);
  UseGetIp(setIp);

  let broswer = getBrowser();
  broswer = broswer.substring(broswer.lastIndexOf("/") + 1);

  // 반응형 처리
  const [clientWidth, setClientWidth] = useState(
    document.documentElement.getBoundingClientRect().width
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

    for (let key of Object.keys(localStorage)) {
      if (
        key != "passwordExpirationInfo" &&
        key != "accessToken" &&
        key != "loginResult" &&
        key != "refreshToken" &&
        key != "PopUpNotices" &&
        key != "recoil-persist"
      ) {
        localStorage.removeItem(key);
      }
    }

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

  const onMenuBtnClick = () => {
    setIsMobileMenuOpend((prev) => !prev);
  };

  const history = useHistory();

  // 새로고침하거나 Path 변경 시
  useEffect(() => {
    const handleUnload = () => {
      // unsavedAttadatnums가 있으면 삭제처리
      if (unsavedAttadatnums.attdatnums.length > 0) {
        setDeletedAttadatnums(unsavedAttadatnums);
      }
    };

    const unlisten = history.listen(() => {
      handleUnload();
    });
    
  // 토큰 만료 시 로그아웃 처리
    if (!accessToken && loginResult) {
      unlisten();
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("unload", handleUnload);
      if (
        window.location.pathname !== "/" &&
        window.location.pathname !== "/admin"
      ) {
        alert("토큰이 만료되었습니다.");
        resetLocalStorage();
        logout();
      }
    } else {
      window.addEventListener("beforeunload", handleTabClose);
      window.addEventListener("unload", handleUnload);
    }
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
    accessToken,
  ]);

  const fetchToDeletedAttachment = useCallback(
    async (type: string[], attdatnums: string[]) => {
      let data: any;

      attdatnums.forEach(async (attdatnum, index) => {
        try {
          data = await processApi<any>("attachment-delete", {
            attached: `attachment?type=${type[index]}&attachmentNumber=${attdatnum}`,
          });
        } catch (error) {
          data = null;
        }

        if (data === null) {
          console.log("An error occured to delete a file of " + attdatnum);
        }
      });
    },
    []
  );

  // 첨부파일 삭제
  useEffect(() => {
    if (deletedAttadatnums.type && deletedAttadatnums.attdatnums.length > 0) {
      fetchToDeletedAttachment(
        deletedAttadatnums.type,
        deletedAttadatnums.attdatnums
      );

      // 초기화
      setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
      setDeletedAttadatnums(DEFAULT_ATTDATNUMS);
    }
  }, [deletedAttadatnums]);

  if (!isLoaded) {
    return <Loader />;
  }

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation(); // 이벤트 캡쳐링 방지
    setShow(!show);
  };
  const contracts = [
    {
      title: "알림 구독",
    },
    {
      title: "알림 구독 해제",
    },
    {
      title: "비밀번호 변경",
    },
    {
      title: "로그아웃",
    },
  ];

  const click = (title: string) => {
    setShow(false);
    if (title == "비밀번호 변경") {
      setChangePasswordWindowVisible(true);
    } else if (title == "로그아웃") {
      logout();
    } else if (title == "알림 구독") {
      callApi("subscribe");
    } else if (title == "알림 구독 해제") {
      callApi("unsubscribe");
    }
  };
  const logout = () => {
    // switcher({ theme: "light" });
    setShow(false);
    fetchLogout();
    resetLocalStorage();
    setIsMobileMenuOpend(false);
    history.push("/");
    // window.location.href = "/";
  };
  async function requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission != "granted") {
      alert(`알림 권한이 허용되지 않았습니다. (permission: ${permission})`);
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_VAPID_KEY,
    });

    onMessage(messaging, (payload: any) => {
      console.log("메시지가 도착했습니다.", payload);
    });
    return token;
  }

  const callApi = async (path: string) => {
    const token = await requestPermission();

    if (!token) {
      console.log("토큰이 유효하지 않습니다.");
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        /* SPM 사용자 계정 인증 필요 */
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: token }),
    };
    fetch("https://pw6.gsti.co.kr/api/fcm/" + path, requestOptions)
      //fetch('https://localhost:44358/api/fcm/' + path, requestOptions)
      .then(async (response) => {
        const isJson = response.headers
          .get("Content-type")
          ?.includes("application/json");
        if (isJson) {
          const data = await response.json();
          if (path == "subscribe") alert("정상적으로 등록되었습니다!");
          else alert("정상적으로 해제되었습니다!");
        } else {
          console.log("status:" + response.status);
          alert("실패");
        }
      });
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
  const MyItemRender = (props: ListViewItemProps) => {
    let item = props.dataItem;
    return (
      <div
        className="k-listview-item row p-2 border-bottom align-middle"
        style={{
          margin: 0,
          cursor: "pointer",
          marginTop: "8px",
          marginBottom: "8px",
        }}
        onClick={() => click(item.title)}
      >
        <div className="col">{item.title}</div>
      </div>
    );
  };

  return (
    <>
      <Wrapper
        onClick={() => setShow(false)}
        isMobileMenuOpend={isMobileMenuOpend}
        theme={currentTheme}
      >
        <Modal isMobileMenuOpend={isMobileMenuOpend} onClick={onMenuBtnClick} />
        {isMenuOpend ? (
          <Gnv isMobileMenuOpend={isMobileMenuOpend} theme={currentTheme}>
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
                  title={"공유문서 열람"}
                  route="/SharedDocumentView"
                />
                <PanelBarItem
                  title={"프로젝트 일정계획"}
                  route="/ProjectSchedule"
                />
                <PanelBarItem
                  title={"회의록 관리"}
                  route="/MeetingManagement"
                />
                <PanelBarItem
                  title={"공유문서 관리"}
                  route="/SharedDocumentManagement"
                />
                <PanelBarItem
                  title={"접수 및 답변"}
                  route="/Reception_Answer"
                />
                <PanelBarItem title={"업무 지시"} route="/Task_Order" />
                <PanelBarItem title={"처리일지 작성"} route="/Record" />
                <PanelBarItem
                  title={"프로젝트 마스터"}
                  route="/ProjectMaster"
                />
                <PanelBarItem title={"FAQ 자주묻는질문"} route="/FAQ" />
                <PanelBarItem
                  title={"프로젝트 모니터링"}
                  route="/ProjectMonitoring"
                />
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
                  title={"공유문서 열람"}
                  route="/SharedDocumentView"
                />
                <PanelBarItem
                  title={"프로젝트 일정계획"}
                  route="/ProjectSchedule"
                />
                <PanelBarItem title={"FAQ 자주묻는질문"} route="/FAQ" />
              </PanelBar>
            )}
          </Gnv>
        ) : (
          <SmallGnv theme={currentTheme} />
        )}
        <Content isMenuOpen={isMenuOpend}>
          <TopTitle>
            <Button
              icon="menu"
              themeColor={"primary"}
              fillMode={"flat"}
              onClick={onMenuBtnClick}
            />
            <AppName theme={currentTheme}>
              <Logo size="20px" onClick={() => (window.location.href = "/")} />
            </AppName>
            <button
              className={
                "k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
              }
              onClick={onClick}
              ref={anchor}
              style={{
                minWidth: "40px",
                float: "right",
                display: "inline-block",
                border: "1px solid #7a76ce",
                color: "#7a76ce",
              }}
            >
              <span
                className="k-icon k-i-user k-icon-lg"
                style={{ color: "#7a76ce" }}
              ></span>
            </button>
            <Popup
              anchor={anchor.current}
              show={show}
              className={"wrapper"}
              popupClass={"inner-wrapper"}
            >
              <ListView
                data={contracts}
                item={MyItemRender}
                style={{ width: "100%" }}
              />
            </Popup>
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
