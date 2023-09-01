import { Route, Redirect, RouteProps } from "react-router-dom";
// import { useRecoilState } from "recoil";
// import { tokenState } from "../store/atoms";

function AuthRoute({ component, ...rest }: RouteProps) {
  // const [token] = useRecoilState(tokenState);
  const token = localStorage.getItem("accessToken");
  const isLoggedIn = !!token;
  function error() {
    const datas = window.location.href.split("?")[0];
    const link = datas.split("/")[3];
    if (
      link == "" ||
      link == "Home" ||
      link == "MeetingView" ||
      link == "MeetingManagement" ||
      link == "QnA" ||
      link == "Notice" ||
      link == "ProjectSchedule" ||
      link == "Reception_Answer" ||
      link == "Task_Order" ||
      link == "Record" ||
      link == "ProjectMaster" ||
      link == "SharedDocumentManagement" ||
      link == "SharedDocumentView"
    ) {
      return false;
    } else {
      return true;
    }
  }
  return (
    <>
      <Route {...rest} component={component} />
      {!isLoggedIn && <Redirect to="/" />}
      {isLoggedIn && error() && <Redirect to="/Error" />}
    </>
  );
}

export default AuthRoute;
