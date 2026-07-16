import { Navigate } from "react-router-dom";

const ResetPasswordPage = () => {
  return <Navigate to={`/landing${window.location.search}`} replace />;
};

export default ResetPasswordPage;
