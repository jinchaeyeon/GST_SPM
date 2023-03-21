import { useRecoilState } from "recoil";
import { loginResultState } from "../store/atoms";
import axios from "axios";
import { resetLocalStorage } from "../components/CommonFunction";

let BASE_URL = process.env.REACT_APP_API_URL;
const cachios = require("cachios");
const domain: any = {
  query: { action: "post", url: "api/data/sql-query" },
  procedure: { action: "post", url: "api/data/sql-procedure" },
  "platform-query": { action: "post", url: "api/data/sql-query" },
  "platform-procedure": { action: "post", url: "api/data/sql-procedure" },
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
  logout: { action: "post", url: "api/auth/logout" },
  login: { action: "post", url: "api/auth/login" },
  "login-old": { action: "post", url: "api/auth/login-old" },
  "company-code": { action: "get", url: "api/auth/company-codes" },
  "file-list": { action: "get", url: "api/files/attached/:attached" },
  "file-upload": { action: "post", url: "api/files/:attached" },
  "file-download": {
    action: "get",
    url: "api/files/attached/:attached",
  },
  "file-delete": { action: "delete", url: "api/files/attached/:attached" },
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
  const token = localStorage.getItem("accessToken");
  const [loginResult, setLoginResult] = useRecoilState(loginResultState);

  const processApi = <T>(name: string, params: any = null): Promise<T> => {
    return new Promise((resolve, reject) => {
      let info: any = domain[name];
      let url = null;
      let p = null;
      url = generateUrl(info.url, params);
      url = `${BASE_URL}${url}`;

      let headers: any = {};

      if (name === "file-upload" || name === "file-download")
        headers = {
          "Content-Type": "multipart/form-data",
          responseType: "stream",
          accept: "*/*",
        };

      if (name === "file-list")
        headers = { "Content-Type": "multipart/form-data", accept: "*/*" };

      if (name === "platform-procedure" || name === "platform-query")
        headers = { ...headers, DBAlias: "Platform" };

      if (loginResult) {
        // headers = { ...headers, Authorization: `Bearer ${token}` };
        headers = { ...headers, CultureName: loginResult.langCode };
      }

      if (token && !headers.hasOwnProperty("Authorization")) {
        headers = { ...headers, Authorization: `Bearer ${token}` };
      }

      if (info.action != "get") {
        initCache();
      }
      const getHeader: any = {
        params: params,
        headers: headers,
      };

      if (name === "file-download") {
        getHeader.responseType = "blob";
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
            return name === "file-download"
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
        let token = localStorage.getItem("accessToken");
        let refreshToken = localStorage.getItem("refreshToken");

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

          localStorage.setItem("accessToken", token);
          localStorage.setItem("refreshToken", refreshToken);

          isTokenRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${token}`;

          // 새로운 토큰으로 재요청 진행
          onTokenRefreshed(token);
        }).catch((err: any) => {
          // access token을 받아오지 못하는 오류 발생시 logout 처리
          resetLocalStorage();
          window.location.href = "/";

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
