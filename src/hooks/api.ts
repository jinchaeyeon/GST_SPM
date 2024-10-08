import axios from "axios";
import { useRecoilState } from "recoil";
import { resetLocalStorage } from "../components/CommonFunction";
import { removeBeforeUnloadListener } from "../components/PanelBarNavContainer";
import { loginResultState } from "../store/atoms";
import jwt_decode from "jwt-decode";
import  secureLocalStorage  from  "react-secure-storage";

interface DecodedToken {
  exp: number;
}

let BASE_URL = process.env.REACT_APP_API_URL;
const cachios = require("cachios");
const domain: any = {
  //알림
  alert: { action: "post", url: "api/spm/:para" },

  //QnA
  "qna-list": { action: "get", url: "api/spm/qna/:para" },
  "qna-detail": { action: "get", url: "api/spm/qna/:id" },
  "qna-save": { action: "post", url: "api/spm/:para" },
  "qna-delete": { action: "delete", url: "api/spm/qna/:id" },

  //회의록
  "meeting-list": { action: "get", url: "api/spm/meeting/:para" },
  "meeting-detail": { action: "get", url: "api/spm/meeting/:para" },
  "meeting-save": { action: "post", url: "api/spm/meeting" },
  "meeting-delete": { action: "delete", url: "api/spm/meeting/:id" },

  // 처리일지
  document: { action: "get", url: "api/spm/:para" },
  "document-save": { action: "post", url: "api/spm/record" },

  //업무지시
  "taskorder-save": { action: "post", url: "api/spm/task-order" },
  answer: { action: "post", url: "api/spm/answer" },

  //접수 및 답변
  "receptions-save": { action: "post", url: "api/spm/reception" },

  // 공지사항
  "notice-list": { action: "get", url: "api/spm/notice/:para" },
  "notice-detail": { action: "get", url: "api/spm/notice/:id" },
  "notice-save": { action: "post", url: "api/spm/notice" },
  "notice-delete": { action: "delete", url: "api/spm/notice/:id" },

  // 공유문서
  "shared_document-list": {
    action: "get",
    url: "api/spm/shared-document/:para",
  },
  "shared_document-detail": {
    action: "get",
    url: "api/spm/shared-document/:id",
  },
  "shared_document-save": { action: "post", url: "api/spm/shared-document" },
  "shared_document-delete": {
    action: "delete",
    url: "api/spm/shared-document/:id",
  },

  // FAQ
  "faq-list": {
    action: "get",
    url: "api/spm/faq/:para",
  },
  "faq-detail": {
    action: "get",
    url: "api/spm/faq/:id",
  },
  "faq-save": { action: "post", url: "api/spm/faq" },
  "faq-delete": {
    action: "delete",
    url: "api/spm/faq/:id",
  },

  // 홈화면
  "home-general": { action: "get", url: "api/spm/home/general" },
  "home-general-notice": { action: "get", url: "api/spm/home/general/:id" },
  "home-manager": { action: "get", url: "api/spm/home/manager" },

  // 참조 업체 조회
  "customers-list": { action: "get", url: "api/spm/:para" },

  //프로젝트 일정계획
  "project-schedule-list": {
    action: "get",
    url: "api/spm/project-schedule/projects",
  },
  "project-schedule-detail": {
    action: "get",
    url: "api/spm/project-schedule/:id",
  },

  // 첨부파일
  "file-list": { action: "get", url: "api/spm/attachment/:attached" },
  "file-upload": { action: "post", url: "api/spm/:attached" },
  "file-download": {
    action: "get",
    url: "api/spm/attachment/:attached",
  },
  "file-delete": { action: "delete", url: "api/spm/attachment/:attached" },
  "attachment-delete": {
    // AttachmentNum 자체를 삭제
    action: "delete",
    url: "api/spm/:attached",
  },

  "html-query": { action: "get", url: "api/data/html-doc" },
  "html-save": { action: "post", url: "api/data/:folder" },
  "html-download": { action: "get", url: "api/data/html-doc/file" },
  "html-delete": { action: "delete", url: "api/data/html-doc/file" },

  // word doc 다운로드
  "doc-download": {
    action: "get",
    url: "api/spm/files/:para",
  },

  // 쿼리, 프로시저
  query: { action: "post", url: "api/data/sql-query" },
  procedure: { action: "post", url: "api/data/sql-procedure" },
  "platform-query": { action: "post", url: "api/data/sql-query" },
  "platform-procedure": { action: "post", url: "api/data/sql-procedure" },
  "bizgst-query": { action: "post", url: "api/data/sql-query" },
  "bizgst-procedure": { action: "post", url: "api/data/sql-procedure" },

  // 로그인, 로그아웃
  login: { action: "post", url: "api/auth/login" },
  logout: { action: "post", url: "api/auth/logout" },

  // 비밀번호 변경
  "change-password": { action: "post", url: "api/auth/change-password" },

  // 미사용
  fav: { action: "post", url: "api/data/menus/fav/:formId" },
  "del-fav": { action: "delete", url: "api/data/menus/fav/:formId" },
  "custom-option": { action: "get", url: "api/data/:formId/:para" },
  messages: { action: "get", url: "api/data/:formId/messages" },
  "design-info": { action: "get", url: "api/data/:formId/design-info" },
  "biz-components": { action: "get", url: "api/data/:id" },
  permissions: { action: "get", url: "api/data/:para" },
  "get-password-requirements": {
    action: "get",
    url: "api/data/password-requirements",
  },
  "set-password-requirements": {
    action: "post",
    url: "api/data/password-requirements",
  },
  menus: { action: "get", url: "api/data/:para" },
  "default-list": {
    action: "get",
    url: "api/data/:formId/custom-option/default-list",
  },
  "default-detail": {
    action: "get",
    url: "api/data/:formId/custom-option/:para",
  },
  "column-list": {
    action: "get",
    url: "api/data/:formId/custom-option/column-list",
  },
  "column-detail": {
    action: "get",
    url: "api/data/:formId/custom-option/:para",
  },
  "popup-data": { action: "post", url: "api/data/biz-components/:para" },
  "bizgst-popup-data": { action: "post", url: "api/data/biz-components/:para" },
  "login-old": { action: "post", url: "api/auth/login-old" },
  "company-code": { action: "get", url: "api/auth/company-codes" },
};
let isTokenRefreshing = false;
let refreshSubscribers: any[] = [];

const onTokenRefreshed = (accessToken: any) => {
  refreshSubscribers.map((callback) => callback(accessToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: any) => {
  refreshSubscribers.push(callback);
};

const initCache = () => {
  cachedHttp = cachios.create(axiosInstance, { stdTTL: 30, checkperiod: 120 });
};

const axiosInstance: any = axios.create({
  baseURL: "/",
  headers: { "Cache-Control": "no-cache" },
});
let cachedHttp = cachios.create(axiosInstance, {
  checkperiod: 120,
  stdTTL: 30,
});

const generateUrl = (url: string, params: any) => {
  if (params == null) {
    return url;
  } else {
    let result = [];
    let list = url.split("/");
    for (let item of list) {
      let resultItem = item;
      if (item.startsWith(":")) {
        let key = item.substring(1);
        if (key && key.length > 0) {
          resultItem = params[key] ? params[key] : "";
          delete params[key];
        }
      }
      result.push(resultItem);
    }

    return result.join("/");
  }
};

export const useApi = () => {
  const accessToken: any = secureLocalStorage.getItem("accessToken");
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);

  // 토큰 만료 시 로그아웃 처리
  if (!accessToken && loginResult) {
    if (
      window.location.pathname !== "/" &&
      window.location.pathname !== "/admin"
    ) {
      removeBeforeUnloadListener();
      const adminStatus = loginResult.role == "ADMIN";
      resetLocalStorage();
      if (adminStatus) {
        window.location.href = "/admin";
      } else window.location.href = "/";
    }
  }

  if (accessToken) {
    const decodedToken = jwt_decode<DecodedToken>(accessToken);
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp < currentTime) {
      removeBeforeUnloadListener();
      resetLocalStorage();
    }
  }
 
  const processApi = <T>(name: string, params: any = null): Promise<T> => {
    return new Promise((resolve, reject) => {
      let info: any = domain[name];
      let url = null;
      let p = null;
      url = generateUrl(info.url, params);
      url = `${BASE_URL}${url}`;

      if (name === "logout") {
        if (loginResult.role === "ADMIN") {
          window.location.pathname = "/admin";
        }
      }

      let headers: any = {};

      if (
        name === "file-upload" ||
        name === "file-download" ||
        name === "doc-download"
      )
        headers = {
          "Content-Type": "multipart/form-data",
          responseType: "stream",
          accept: "*/*",
        };

      if (name === "file-list")
        headers = { "Content-Type": "multipart/form-data", accept: "*/*" };

      if (name.includes("platform"))
        headers = { ...headers, DBAlias: "Platform" };

      if (name.includes("bizgst")) headers = { ...headers, DBAlias: "BizGST" };

      if (loginResult) {
        // headers = { ...headers, Authorization: `Bearer ${token}` };
        headers = { ...headers, CultureName: loginResult.langCode };
      }

      if (accessToken && !headers.hasOwnProperty("Authorization")) {
        headers = { ...headers, Authorization: `Bearer ${accessToken}` };
      }

      if (info.action != "get") {
        initCache();
      }
      const getHeader: any = {
        params: params,
        headers: headers,
      };

      if (name === "file-download" || name === "doc-download") {
        getHeader.responseType = "blob";
        // 캐싱 방지용 타임스탬프
        url +=
          (url.includes("?") ? "&" : "?") + "timestamp=" + new Date().getTime();
      }

      switch (info.action) {
        case "get":
          p = cachedHttp.get(url, getHeader);
          break;
        case "post":
          p = axiosInstance.post(url, params, { headers: headers });
          break;
        case "delete":
          p = axiosInstance.delete(url, {
            params: params,
            headers: headers,
          });
          break;
        case "put":
          p = axiosInstance.put(url, params, { headers: headers });
          break;
        default:
          const message =
            "Please check the axios request type(get, post, put, delete)";
          console.error(message);
          throw message;
      }

      return (
        p
          //.then((response: any) => resolve(response.data))
          .then((response: any) => {
            return name === "file-download" || name === "doc-download"
              ? resolve(response)
              : resolve(response.data);
          })
          .catch((err: any) => {
            const res = err.response;
            // if (res && res.status == 401) {
            //   // setToken(null as any);
            //   // setMenus(null as any);
            // }
            reject(res.data);
          })
      );
    });
  };

  return processApi;
};

axiosInstance.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: {
    config: any;
    request: { responseURL: string };
    response: { status: any };
    message: string;
  }) => {
    // res에서 error가 발생했을 경우 catch로 넘어가기 전에 처리하는 부분
    let errResponseStatus = null;
    let errResponseURL = "";
    const originalRequest = error.config;

    try {
      errResponseStatus = error.response.status;
      errResponseURL = error.request.responseURL;
    } catch (e) {}

    if (errResponseStatus === 401 && !errResponseURL.includes("auth/login")) {
      if (!isTokenRefreshing) {
        let token = secureLocalStorage.getItem("accessToken");
        let refreshToken = secureLocalStorage.getItem("refreshToken");

        isTokenRefreshing = true;

        const url = `${BASE_URL}api/auth/refresh`;
        let p;

        // refresh token을 이용하여 access token 재발행 받기
        p = axios.post(url, {
          accessToken: token,
          refreshToken: refreshToken,
        });

        p.then((res: any) => {
          const { token, refreshToken } = res.data;

          secureLocalStorage.setItem("accessToken", token);
          secureLocalStorage.setItem("refreshToken", refreshToken);

          isTokenRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${token}`;

          // 새로운 토큰으로 재요청 진행
          onTokenRefreshed(token);
        }).catch((err: any) => {
          // access token을 받아오지 못하는 오류 발생시 logout 처리
          resetLocalStorage();

          //링크 따라가기 기능을 위한 주석처리
          // window.location.href = "/";

          return false;
        });
      }

      // token이 재발급 되는 동안의 요청은 refreshSubscribers에 저장
      const retryOriginalRequest = new Promise((resolve) => {
        addRefreshSubscriber((accessToken: any) => {
          originalRequest.headers.Authorization = "Bearer " + accessToken;
          // axios(originalRequest);
          resolve(axios(originalRequest));
        });
      });
      return retryOriginalRequest;
    }
    // 오류 발생 시 오류 내용 출력 후 요청 거절
    return Promise.reject(error);
  }
);
