import { Navigate } from "react-router-dom";

const ResetUserCodePage = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("reset")) {
    params.set("reset", "user-code");
  }
  return <Navigate to={`/landing?${params.toString()}`} replace />;
};

export default ResetUserCodePage;
