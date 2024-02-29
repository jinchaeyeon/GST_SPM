import { Button } from "@progress/kendo-react-buttons";
import { Field, Form, FormElement } from "@progress/kendo-react-form";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { LoginAppName, LoginBox, LoginImg } from "../CommonStyled";
import { LoginFormInput } from "../components/Editors";
import Loader from "../components/Loader";
import Loading from "../components/Loading";
import { useApi } from "../hooks/api";
import {
  isLoading,
  loginResultState,
  passwordExpirationInfoState,
  queryState,
} from "../store/atoms";
// import cookie from "react-cookies";

interface IFormData {
  langCode: string;
  companyCode: string | { company_code: string };
  userId: string;
  password: string;
}

const Login: React.FC = () => {
  const processApi = useApi();
  const history = useHistory();
  const setLoginResult = useSetRecoilState(loginResultState);
  const setPwExpInfo = useSetRecoilState(passwordExpirationInfoState);
  const setLoading = useSetRecoilState(isLoading);
  const [isLoaded, setIsLoaded] = useState(false);
  const accessToken = localStorage.getItem("accessToken");
  const queryResult = useRecoilState(queryState);
  const setQueryResult = useSetRecoilState(queryState);

  useEffect(() => {
    // token 저장되어있으면 홈화면으로 리다이렉션
    if (accessToken) {
      history.replace("/Home");
    }
  }, []);

  // Kendo Theme 적용하는데 간헐적으로 오류 발생하여 0.2초후 렌더링되도록 처리함
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const handleSubmit = (data: { [name: string]: any }) => {
    processLogin(data);
  };

  const processLogin = useCallback(
    async (formData: { [name: string]: any }) => {
      try {
        if (!formData.userId) {
          alert("ID를 입력하세요.");
          return false;
        }
        if (!formData.password) {
          alert("비밀번호를 입력하세요.");
          return false;
        }

        setLoading(true);

        let para: IFormData = Object.assign(
          {},
          {
            langCode: "ko-KR",
            companyCode: "SPM-ADMIN",
            userId: formData.userId,
            password: formData.password,
          }
        );

        if (typeof para.companyCode !== "string") {
          para.companyCode = para.companyCode.company_code;
        }

        const response = await processApi<any>("login", para);

        const {
          token,
          refreshToken,
          userId,
          userName,
          role,
          companyCode,
          serviceName,
          customerName,
          defaultCulture,
          loginKey,
          passwordExpirationInfo,
        } = response;

        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 60);
        // cookie.save("refreshToken", refreshToken, {
        //   path: "/",
        //   expires,
        //   // secure : true,
        //   // httpOnly : true
        // });

        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);

        setLoginResult({
          langCode: defaultCulture,
          userId,
          userName,
          role,
          companyCode,
          serviceName,
          customerName,
          loginKey,
        });

        setPwExpInfo(passwordExpirationInfo);

        if (queryResult[0] != "") {
          if (queryResult[0] == "admin") {
            //개발용
            history.replace(`/Home`);
            setQueryResult("");
          } else {
            history.replace(`/${queryResult[0]}`);
            setQueryResult("");
          }
        } else {
          history.replace("/Home");
        }
        setLoading(false);
      } catch (e: any) {
        console.log("login error", e);
        setLoading(false);
        alert(e.message);
      }
    },
    []
  );

  if (!isLoaded) {
    return <Loader />;
  }
  return (
    <div style={{ backgroundColor: "#2e87b7" }}>
      <LoginBox>
        <Form
          onSubmit={handleSubmit}
          render={() => (
            <FormElement>
              <fieldset className={"k-form-fieldset"}>
                <Field
                  name={"userId"}
                  label={"ID"}
                  component={LoginFormInput}
                />
                <Field
                  name={"password"}
                  label={"Password"}
                  type={"password"}
                  component={LoginFormInput}
                />
              </fieldset>
              <Button className="login-btn" themeColor={"primary"} size="large">
                Login
              </Button>
            </FormElement>
          )}
        ></Form>
        <Loading />
      </LoginBox>
      <LoginImg>
        <LoginAppName type="SPM"></LoginAppName>
      </LoginImg>
    </div>
  );
};
export default Login;
