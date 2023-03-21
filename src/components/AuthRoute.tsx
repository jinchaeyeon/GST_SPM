import { Route, Redirect, RouteProps } from "react-router-dom";
// import { useRecoilState } from "recoil";
// import { tokenState } from "../store/atoms";

function AuthRoute({ component, ...rest }: RouteProps) {
  // const [token] = useRecoilState(tokenState);
  const token = localStorage.getItem("accessToken");
  const isLoggedIn = !!token;
  return (
    <>
      <Route {...rest} component={component} />
      {!isLoggedIn && <Redirect to="/" />}
    </>
  );
}

export default AuthRoute;
