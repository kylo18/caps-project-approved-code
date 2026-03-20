import { useEffect } from "react";
import { getApiBaseUrl } from "../utils/config";

const useAutoLogoutOnClose = () => {
  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    const handleUnload = () => {
      const token = localStorage.getItem("token");

      if (token) {
        const logoutData = JSON.stringify({ token });

        // Send a logout request using sendBeacon
        const blob = new Blob([logoutData], { type: "application/json" });
        navigator.sendBeacon(`${apiUrl}/logout`, blob);

        // Clean up localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
};

export default useAutoLogoutOnClose;
