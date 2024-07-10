import { Redirect, Route, RouteProps } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { queryState, isLoading } from "../store/atoms";

function AuthRoute({ component, ...rest }: RouteProps) {
  // const [token] = useRecoilState(tokenState);
  const token = localStorage.getItem("accessToken");
  const isLoggedIn = !!token;
  const setQueryResult = useSetRecoilState(queryState);
  const para = window.location.href.split("/")[3];
  const setLoading = useSetRecoilState(isLoading);

  function setting() {
    if(!isLoggedIn) {
      setLoading(false);
    }

    if (para != "") {
      setQueryResult(para);
      return true;
    } else {
      return true;
    }
  }

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
      link == "SharedDocumentView" ||
      link == "FAQ" ||
      link == "ProjectMonitoring"
    ) {
      return false;
    } else {
      return true;
    }
  }
  return (
    <>
      {isLoggedIn && <Route {...rest} component={component} />}
      {!isLoggedIn && setting() && <Redirect to="/" />}
      {isLoggedIn && error() && <Redirect to="/Error" />}
    </>
  );
}

export default AuthRoute;
