import React, { useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Switch,
  useHistory,
} from "react-router-dom";
import {
  RecoilRoot,
  useRecoilState,
  useSetRecoilState
} from "recoil";
// import "./index.scss";

import { createGlobalStyle } from "styled-components";
import AuthRoute from "./components/AuthRoute";
import PanelBarNavContainer from "./components/PanelBarNavContainer";
import Login from "./routes/Login";
import LoginAdmin from "./routes/LoginAdmin";
import Main from "./routes/Main";
import MainAdmin from "./routes/MainAdmin";
import MeetingManagement from "./routes/MeetingManagement";
import MeetingView from "./routes/MeetingView";
import Notice from "./routes/Notice";
import ProjectSchedule from "./routes/ProjectSchedule";
import QnA from "./routes/QnA";

import SharedDocumentManagement from "./routes/SharedDocumentManagement";
import SharedDocumentView from "./routes/SharedDocumentView";

import {
  IntlProvider,
  LocalizationProvider,
  load,
  loadMessages,
} from "@progress/kendo-react-intl";
import {
  isLoading,
  isMenuOpendState,
  isMobileMenuOpendState,
  loginResultState,
  titles
} from "./store/atoms";

import currencyData from "cldr-core/supplemental/currencyData.json";
import likelySubtags from "cldr-core/supplemental/likelySubtags.json";
import weekData from "cldr-core/supplemental/weekData.json";

import caGregorianKo from "cldr-dates-full/main/ko/ca-gregorian.json";
import dateFieldsKo from "cldr-dates-full/main/ko/dateFields.json";
import timeZoneNamesKo from "cldr-dates-full/main/ko/timeZoneNames.json";
import numbersKo from "cldr-numbers-full/main/ko/numbers.json";

import caGregorianEn from "cldr-dates-full/main/en/ca-gregorian.json";
import dateFieldsEn from "cldr-dates-full/main/en/dateFields.json";
import timeZoneNamesEn from "cldr-dates-full/main/en/timeZoneNames.json";
import numbersEn from "cldr-numbers-full/main/en/numbers.json";

import caGregorianJa from "cldr-dates-full/main/ja/ca-gregorian.json";
import dateFieldsJa from "cldr-dates-full/main/ja/dateFields.json";
import timeZoneNamesJa from "cldr-dates-full/main/ja/timeZoneNames.json";
import numbersJa from "cldr-numbers-full/main/ja/numbers.json";

import caGregorianZh from "cldr-dates-full/main/zh/ca-gregorian.json";
import dateFieldsZh from "cldr-dates-full/main/zh/dateFields.json";
import timeZoneNamesZh from "cldr-dates-full/main/zh/timeZoneNames.json";
import numbersZh from "cldr-numbers-full/main/zh/numbers.json";

import { Button } from "@progress/kendo-react-buttons";
import { ListView, ListViewItemProps } from "@progress/kendo-react-listview";
import { Popup } from "@progress/kendo-react-popup";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage
} from "firebase/messaging";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { AppName, Header, Logo } from "./CommonStyled";
import { resetLocalStorage } from "./components/CommonFunction";
import ChangePasswordWindow from "./components/Windows/CommonWindows/ChangePasswordWindow";
import { useApi } from "./hooks/api";
import NotFound from "./routes/NotFound";
import ProjectMaster from "./routes/ProjectMaster";
import Reception_Answer from "./routes/Reception_Answer";
import Record from "./routes/Record";
import Task_Order from "./routes/Task_Order";
import koMessages from "./store/cultures/ko.json";
load(
  likelySubtags,
  currencyData,
  weekData,
  numbersKo,
  caGregorianKo,
  dateFieldsKo,
  timeZoneNamesKo,
  numbersEn,
  caGregorianEn,
  dateFieldsEn,
  timeZoneNamesEn,
  numbersJa,
  caGregorianJa,
  dateFieldsJa,
  timeZoneNamesJa,
  numbersZh,
  caGregorianZh,
  dateFieldsZh,
  timeZoneNamesZh
);

loadMessages(koMessages, "ko-KR");
type TGlobalStyle = {
  isMobileMenuOpend: boolean;
};
const GlobalStyle = createGlobalStyle<TGlobalStyle>`
@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 100;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Thin.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Thin.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Thin.otf) format('opentype');}

@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 300;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Light.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Light.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Light.otf) format('opentype');}

@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 400;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.otf) format('opentype');}

@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 500;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Medium.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Medium.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Medium.otf) format('opentype');}

@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 700;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.otf) format('opentype');}

@font-face {font-family: 'Noto Sans KR';font-style: normal;font-weight: 900;src: url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Black.woff2) format('woff2'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Black.woff) format('woff'),url(//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Black.otf) format('opentype');}


html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, menu, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
main, menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
  font-family: 'Noto Sans KR', 'Source Sans Pro', sans-serif;
}

/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, main, menu, nav, section {
  display: block;
}
/* HTML5 hidden-attribute fix for newer browsers */
*[hidden] {
    display: none;
}
body {
  line-height: 1;  
  overflow: ${(props) => (props.isMobileMenuOpend ? "hidden" : "auto")};
}
menu, ol, ul {
  list-style: none;
}
blockquote, q {
  quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
  content: '';
  content: none;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
* {
  box-sizing: border-box;
}
a {
  text-decoration:none;
}

.k-grid .k-grid-header .k-header .k-cell-inner > .k-link {
  justify-content: center; /*공통설정 : 그리드 헤더 텍스트 중앙정렬*/
}

.k-window{
  z-index: 10100 !important; /* 버그 : 메뉴바가 window 위로 올라오는 현상 수정  */
}

ul.required,
ul.required:hover,
ul.required.k-hover,
span.required,
span.required:hover,
span.required.k-hover,
input.required,
input.required:hover,
input.required.k-hover {
  background-color: #fff0ef;
}
ul.readonly,
span.readonly,
input.readonly {
  background-color: #efefef;
}
.k-radio-label{
  font-size:14px;
  line-height: 1.4285714286; 
}

// 그리드 행높이 조절 
.k-grid tbody tr {
  height: 36px;
}

.k-tabstrip > .k-content.k-active,
.k-tabstrip > .k-content.k-active > div.k-animation-container{
  width: inherit;
}

.darkScrollbar ::-webkit-scrollbar {
  width: 10px;
}

.darkScrollbar ::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: #6c757d;
}
.darkScrollbar ::-webkit-scrollbar-corner {  
  background: transparent;
}

`;

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

const App: React.FC = () => {
  return (
    <RecoilRoot>
      <AppInner></AppInner>
    </RecoilRoot>
  );
};
const AppInner: React.FC = () => {
  const path = window.location.href;
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const messaging = getMessaging(app);
  var index = 0;
  var isAdmin = false;
  //개발 모드
  if (path.includes("localhost:3000/admin")) {
    isAdmin = true;
  } else if (path.includes("spm-admin")) {
    isAdmin = true;
  } else {
    isAdmin = false;
  }
  const setLoading = useSetRecoilState(isLoading);
  const [isMenuOpend, setIsMenuOpend] = useRecoilState(isMenuOpendState);
  const [isMobileMenuOpend, setIsMobileMenuOpend] = useRecoilState(
    isMobileMenuOpendState
  );
  const processApi = useApi();
  const accessToken = localStorage.getItem("accessToken");
  const { switcher, themes, currentTheme = "" } = useThemeSwitcher();
  const [loginResult] = useRecoilState(loginResultState);
  const userName = loginResult ? loginResult.userName : "";
  const userId = loginResult ? loginResult.userId : "";
  const anchor = React.useRef<HTMLButtonElement | null>(null);
  const [show, setShow] = React.useState(false);
  const [title, setTitle] = useRecoilState(titles);
  const [changePasswordWindowVisible, setChangePasswordWindowVisible] =
    useState<boolean>(false);
  const history = useHistory();
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;

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
    console.log("권한 요청 중...");
    if (!Notification) {
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission != "granted") {
      alert(`알림 권한이 허용되지 않았습니다. (permission: ${permission})`);
      return;
    }
    console.log("알림 권한이 허용됨");
    console.log("Registering service worker...");
    const register = await navigator.serviceWorker.register(
      "firebase-messaging-sw.js",
      {
        scope: "/",
      }
    );
    console.log("Service Worker Registered...");

    await navigator.serviceWorker.ready; // <---------- WAIT
    console.log("Registering Push...");
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_VAPID_KEY,
    });

    onMessage(messaging, (payload) => {});
    return token;
  }

  const callApi = async (path: string) => {
    const token = await requestPermission();
    setLoading(true);
    console.log(">> ", JSON.stringify({ token: token }));
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
    setLoading(false);
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
      <GlobalStyle isMobileMenuOpend={isMobileMenuOpend} />
      <LocalizationProvider language={"ko"}>
        <IntlProvider locale={"ko"}>
          <Router>
            <Switch>
              {isAdmin ? (
                <Route path="/" component={LoginAdmin} exact />
              ) : (
                <Route path="/" component={Login} exact />
              )}
              <div style={{backgroundColor: "white"}} onClick={() => setShow(false)}>
                <Header>
                  <AppName theme={currentTheme}>
                    <Button
                      icon="menu"
                      themeColor={"primary"}
                      fillMode={"flat"}
                      onClick={() => setIsMenuOpend(!isMenuOpend)}
                    />
                    <Logo
                      size="33px"
                      onClick={() => (window.location.href = "/")}
                    />
                  </AppName>
                  {isMobile ? (
                    ""
                  ) : (
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 600,
                        color: "7A76CE",
                      }}
                    >
                      {title}
                    </div>
                  )}
                  <button
                    className={
                      "k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                    }
                    ref={anchor}
                    style={{
                      minWidth: "100px",
                      float: "right",
                      display: "inline-block",
                      border: "1px solid #7a76ce",
                      color: "#7a76ce",
                    }}
                    onMouseEnter={(e) => {
                      if (show != true) {
                        setShow(true);
                      }
                    }}
                  >
                    <span
                      className="k-icon k-i-user k-icon-lg"
                      style={{ marginRight: "5px", color: "#7a76ce" }}
                    ></span>
                    {userName}({userId})
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
                </Header>
                <PanelBarNavContainer>
                  {/* 메인 홈 */}
                  {isAdmin ? (
                    <AuthRoute path="/Home" component={MainAdmin} exact />
                  ) : (
                    <AuthRoute path="/Home" component={Main} exact />
                  )}

                  {/* SPM */}
                  <AuthRoute
                    path="/MeetingView"
                    component={MeetingView}
                    exact
                  />
                  <AuthRoute
                    path="/MeetingManagement"
                    component={MeetingManagement}
                    exact
                  />
                  <AuthRoute path="/Qna" component={QnA} exact />
                  <AuthRoute path="/Notice" component={Notice} exact />
                  <AuthRoute
                    path="/ProjectSchedule"
                    component={ProjectSchedule}
                    exact
                  />
                  <AuthRoute
                    path="/Reception_Answer"
                    component={Reception_Answer}
                    exact
                  />
                  <AuthRoute path="/Task_Order" component={Task_Order} exact />
                  <AuthRoute path="/Record" component={Record} exact />
                  <AuthRoute
                    path="/ProjectMaster"
                    component={ProjectMaster}
                    exact
                  />

                  <AuthRoute
                    path="/SharedDocumentManagement"
                    component={SharedDocumentManagement}
                    exact
                  />
                  <AuthRoute
                    path="/SharedDocumentView"
                    component={SharedDocumentView}
                    exact
                  />
                  <AuthRoute path="/Error" component={NotFound} exact/>
                </PanelBarNavContainer>
              </div>
            </Switch>
          </Router>
        </IntlProvider>
      </LocalizationProvider>
      {changePasswordWindowVisible && (
        <ChangePasswordWindow setVisible={setChangePasswordWindowVisible} />
      )}
    </>
  );
  //}
};
export default App;
