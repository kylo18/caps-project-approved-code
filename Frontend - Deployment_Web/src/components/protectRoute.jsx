import { Navigate } from "react-router-dom";
import { getToken } from "../utils/authStorage";

/*
 * It checks if a valid token exists in session or persisted storage. If the
 * user is authenticated, it renders the given `element`. Otherwise, it
 * redirects the user to the login page ("/").
 */
const ProtectedRoute = ({ element, ...rest }) => {
  const isAuthenticated = getToken();

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;