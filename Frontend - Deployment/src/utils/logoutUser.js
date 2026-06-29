import { clearAuth } from "./authStorage";

export function logoutUser(showToast, navigate, message) {
  clearAuth();
  // Remove any other user data if needed
  if (showToast && message) showToast(message, "error");
  setTimeout(() => {
    if (navigate) navigate("/");
    window.location.reload();
  }, 500); // Adjust delay as needed to match your toast duration
}
