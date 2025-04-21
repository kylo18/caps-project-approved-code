import React, { useEffect } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // auto-dismiss in 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 px-4 py-2 rounded shadow-lg text-white animate-fade-in-out
        ${type === "error" ? "bg-red-500" : "bg-green-500"}`}
    >
      {message}
    </div>
  );
};

export default Toast;
