import { useState } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
import ForgotPasswordModal from "./ForgotPasswordModal";
=======
import univLogo from "../assets/univLogo.png";
import AppVersion from "../components/appVersion";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
>>>>>>> Stashed changes

const ForgotPasswordForm = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    navigate("/");
  };

  const handleSwitchToLogin = () => {
    setIsOpen(false);
    navigate("/");
  };

  return (
    <ForgotPasswordModal
      isOpen={isOpen}
      onClose={handleClose}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
};

export default ForgotPasswordForm;
