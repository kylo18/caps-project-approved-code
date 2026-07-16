import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotUserCodeModal from "./ForgotUserCodeModal";

const ForgotUserCodeForm = () => {
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
    <ForgotUserCodeModal
      isOpen={isOpen}
      onClose={handleClose}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
};

export default ForgotUserCodeForm;
