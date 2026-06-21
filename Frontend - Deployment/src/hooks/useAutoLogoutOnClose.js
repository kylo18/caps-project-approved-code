import { useEffect } from "react";
import { clearAuth, isRememberMeEnabled, isAuthenticated } from "../utils/authStorage";

const useAutoLogoutOnClose = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const handleUnload = () => {
      if (isRememberMeEnabled()) return;

      if (isAuthenticated()) {
        fetch(`${apiUrl}/logout`, {
          method: "POST",
          credentials: "include",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        });

        clearAuth();
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [apiUrl]);
};

export default useAutoLogoutOnClose;
