<<<<<<< Updated upstream
import { Navigate } from "react-router-dom";

// Immediately redirects /reset-password?token=...&email=... → /landing?token=...&email=...
// LandingPage detects the token param and auto-opens ResetPasswordModal.
const ResetPasswordPage = () => {
  return <Navigate to={`/landing${window.location.search}`} replace />;
};

export default ResetPasswordPage;
