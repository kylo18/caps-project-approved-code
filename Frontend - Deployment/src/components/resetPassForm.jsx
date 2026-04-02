<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { Navigate } from "react-router-dom";
=======
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "../assets/univLogo.png";
import AppVersion from "../components/appVersion";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
>>>>>>> Stashed changes

// Immediately redirects /reset-password?token=...&email=... → /landing?token=...&email=...
// LandingPage detects the token param and auto-opens ResetPasswordModal.
const ResetPasswordPage = () => {
  return <Navigate to={`/landing${window.location.search}`} replace />;
};

export default ResetPasswordPage;
