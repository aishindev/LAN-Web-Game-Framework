import { ReactNode, useState } from "react";
import { useCookies } from "react-cookie";
import { Navigate, Outlet } from "react-router-dom";
import { checkToken } from "../../service/API/normalAPI/normalAPI";

interface props {
  children?: ReactNode;
}

function ProtectedRoute(props: props) {
  const { children } = props;
  const [cookies] = useCookies(["token"]);
  let [stateoperationSuccess, setstatestateoperationSuccess] = useState<boolean | null>(null);

  if (Object.keys(cookies).length === 0 && cookies.constructor === Object) return <Navigate to={"/login"}></Navigate>;

  if (stateoperationSuccess) { return children ? children : <Outlet />};
  if (stateoperationSuccess === false) { return <Navigate to={"/login"}></Navigate>;}

  checkToken(cookies.token)
    .then((response) => response.json())
    .then((data) => {
      setstatestateoperationSuccess(data.operationSuccess);
    })
    .catch((error) => {
      switch(error.errorType) {
        case "notValidToken": return console.log("The token sent is not valid.")
        case "unexpectedError": return console.log("An unexpected error occurs, contact support.");
        default: return console.log("An unexpected error occurs, contact support.");
      }
    })
}

export default ProtectedRoute;
