import { useEffect } from "react";
import { clearAuth, getToken, isRememberMeEnabled } from "../utils/authStorage";

const useAutoLogoutOnClose = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const handleUnload = () => {
      if (isRememberMeEnabled()) return;

      const token = getToken();

      if (token) {
        const logoutData = JSON.stringify({ token });

        // Send a logout request using sendBeacon
        const blob = new Blob([logoutData], { type: "application/json" });
        navigator.sendBeacon(`${apiUrl}/logout`, blob);

        clearAuth();
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
};

export default useAutoLogoutOnClose;
