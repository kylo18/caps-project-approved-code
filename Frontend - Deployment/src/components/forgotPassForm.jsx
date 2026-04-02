import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordModal from "./ForgotPasswordModal";

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
