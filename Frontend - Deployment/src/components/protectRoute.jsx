import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/authStorage";

/*
 * Checks whether the user has an active session (httpOnly cookie + cached profile).
 * Redirects unauthenticated users to the landing page.
 */
const ProtectedRoute = ({ element, ...rest }) => {
  return isAuthenticated() ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;