import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // SocialAuthController params
    const socialToken = params.get("social_token");
    const socialError = params.get("social_error");
    const message = params.get("message");

    // GoogleAuthController params (legacy fallback)
    const legacyToken = params.get("token");
    const legacyUserRaw = params.get("user");
    const legacyError = params.get("error");

    // ── Handle errors ─────────────────────────────────
    if (socialError || legacyError) {
      const errorMsg = message
        || (legacyError ? decodeURIComponent(legacyError) : null)
        || "Authentication failed. Please try again.";
      setErrorMessage(decodeURIComponent(errorMsg));
      setStatus("error");
      return;
    }

    // ── Handle SocialAuthController token ─────────────
    if (socialToken) {
      sessionStorage.setItem("token", socialToken);

      // Fetch user profile since SocialAuthController doesn't send user data
      const fetchUser = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_BASE_URL;
          const res = await fetch(`${apiUrl}/user/profile`, {
            headers: { Authorization: `Bearer ${socialToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem("user", JSON.stringify(data));
            const roleId = Number(data.roleID);
            const routes = {
              1: "/student-dashboard",
              2: "/faculty-dashboard",
              3: "/program-chair-dashboard",
              4: "/dean-dashboard",
              5: "/asso-dean-dashboard",
            };
            navigate(routes[roleId] ?? "/student-dashboard", { replace: true });
          } else {
            setErrorMessage("Failed to load user profile. Please try again.");
            setStatus("error");
          }
        } catch {
          setErrorMessage("Something went wrong. Please try again.");
          setStatus("error");
        }
      };
      fetchUser();
      return;
    }

    // ── Handle GoogleAuthController token (legacy) ─────
    if (legacyToken) {
      sessionStorage.setItem("token", legacyToken);
      let user = null;
      try {
        user = legacyUserRaw
          ? JSON.parse(decodeURIComponent(legacyUserRaw))
          : null;
      } catch {
        setErrorMessage("Failed to read user data. Please try again.");
        setStatus("error");
        return;
      }
      if (user) sessionStorage.setItem("user", JSON.stringify(user));
      const roleId = Number(user?.roleID);
      const routes = {
        1: "/student-dashboard",
        2: "/faculty-dashboard",
        3: "/program-chair-dashboard",
        4: "/dean-dashboard",
        5: "/asso-dean-dashboard",
      };
      navigate(routes[roleId] ?? "/student-dashboard", { replace: true });
      return;
    }

    // ── No token at all ────────────────────────────────
    setErrorMessage("No authentication token received. Please try again.");
    setStatus("error");
  }, [navigate]);

  // ── Loading UI ───────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white">
        <div className="flex items-center gap-3">
          <img src={univLogo} alt="University Logo" className="size-9 object-contain" />
          <img src={collegeLogo} alt="College Logo" className="size-9 object-contain" />
        </div>

        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

        <div className="text-center">
          <p className="outfit-700 text-[16px] font-semibold text-gray-800">
            Signing you in with Google
          </p>
          <p className="outfit-400 mt-1 text-[13px] text-gray-400">
            Please wait, verifying your account…
          </p>
        </div>
      </div>
    );
  }

  // ── Error UI ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <i className="bx bx-error-circle text-[32px] text-red-500" />
        </div>

        <h2 className="outfit-700 text-[18px] font-bold text-gray-900">
          Login Failed
        </h2>
        <p className="outfit-400 mt-2 text-[13px] leading-relaxed text-gray-500">
          {errorMessage}
        </p>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="outfit-400 mt-6 w-full rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-[10px] text-[14px] font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
