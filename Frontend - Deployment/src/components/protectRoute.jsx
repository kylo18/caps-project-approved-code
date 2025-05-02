import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, ...rest }) => {
  const isAuthenticated = localStorage.getItem("token");

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;
