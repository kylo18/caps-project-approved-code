import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [message, setMessage] = useState("Signing you in with Google...");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.search.substring(1);
    const params = new URLSearchParams(hash);
    const error = params.get("error");
    const idToken = params.get("id_token");

    if (error) {
      setMessage("Google login failed.");
      showToast(error || "Google login failed.", "error");
      return;
    }

    if (!idToken) {
      setMessage("No Google token returned.");
      showToast("No id_token was returned from Google.", "error");
      return;
    }

    const payload = parseJwt(idToken);
    if (!payload) {
      setMessage("Unable to decode Google token.");
      showToast("Could not decode the Google token.", "error");
      return;
    }

    const user = {
      id: payload.sub || payload.email,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      roleID: 1,
    };

    sessionStorage.setItem("token", idToken);
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("google_user", "true");

    showToast(`Welcome, ${user.name || user.email}`, "success");
    navigate("/student-dashboard", { replace: true });
  }, [navigate, showToast]);

  return (
    <div className="page-center">
      <div className="card">
        <h2>Google Login</h2>
        <p>{message}</p>
      </div>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}
