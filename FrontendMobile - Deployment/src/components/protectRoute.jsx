import { Navigate } from "react-router-dom";

/*
 * It checks if a valid token exists in localStorage. If the user is
 * authenticated, it renders the given `element`. Otherwise, it redirects
 * the user to the login page ("/").
 */
const ProtectedRoute = ({ element, ...rest }) => {
  const isAuthenticated = localStorage.getItem("token");

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;