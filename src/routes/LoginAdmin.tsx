import { Button } from "@progress/kendo-react-buttons";
import { Form, Field, FormElement } from "@progress/kendo-react-form";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { passwordExpirationInfoState, loginResultState } from "../store/atoms";
import { useApi } from "../hooks/api";
import { useSetRecoilState } from "recoil";
import { FormInput, FormComboBox, LoginFormInput } from "../components/Editors";
import { LoginAppName, LoginBox, LoginImg, Logo } from "../CommonStyled";
import { UseGetIp } from "../components/CommonFunction";
import { isLoading } from "../store/atoms";
import Loading from "../components/Loading";
import Loader from "../components/Loader";
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

  // Kendo Theme 적용하는데 간헐적으로 오류 발생하여 0.2초후 렌더링되도록 처리함
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);

    return () => clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머를 제거
  }, []);

  const handleSubmit = (data: { [name: string]: any }) => {
    processLogin(data);
  };

  const processLogin = useCallback(
    async (formData: { [name: string]: any }) => {
      try {
        setLoading(true);

        let para: IFormData = Object.assign(
          {},
          {
            langCode: "ko-KR",
            companyCode: "SPM-ADMIN",
            userId: formData.userId,
            password: formData.password,
          },
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

        history.replace("/Home");
        setLoading(false);
      } catch (e: any) {
        console.log("login error", e);
        setLoading(false);
        alert(e.message);
      }
    },
    [],
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
