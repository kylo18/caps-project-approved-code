import { useEffect } from "react";
import { getApiUrl } from "../utils/config";

// Provides auto logout on close.
const useAutoLogoutOnClose = () => {
  const apiUrl = getApiUrl();

  useEffect(() => {
    // Handles unload.
    const handleUnload = () => {
      const token = localStorage.getItem("token");

      if (token) {
        const logoutData = JSON.stringify({ token });

        // Send a logout request using sendBeacon
        const blob = new Blob([logoutData], { type: "application/json" });
        navigator.sendBeacon(`${apiUrl}/api/logout`, blob);

        // Clean up localStorage
        localStorage.removeItem("token");
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
};

export default useAutoLogoutOnClose;
