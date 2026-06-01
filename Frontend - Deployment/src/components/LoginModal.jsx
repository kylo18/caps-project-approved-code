import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLogIn, setIsLogIn] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset all inputs when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIdCode("");
      setPassword("");
      setError("");
      setPasswordVisible(false);
      setIsLogIn(false);
    }
  }, [isOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLogIn(true);

    if (!idCode.trim() || !password.trim()) {
      showToast("Please enter both ID Code and Password.", "error");
      setIsLogIn(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userCode: idCode,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast(data.message || "Incorrect user code or password", "error");
        } else {
          showToast(
            data.message || "Something went wrong. Please try again later.",
            "error",
          );
        }
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      const roleId = Number(data.user.roleID);
      switch (roleId) {
        case 1:
          navigate("/student-dashboard");
          break;
        case 2:
          navigate("/faculty-dashboard");
          break;
        case 3:
          navigate("/program-chair-dashboard");
          break;
        case 4:
          navigate("/dean-dashboard");
          break;
        case 5:
          navigate("/asso-dean-dashboard");
          break;
        default:
          setError("Invalid user role.");
          break;
      }
    } catch {
      showToast("Something went wrong. Please try again later.", "error");
    } finally {
      setIsLogIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal card */}
        <div
          className="relative w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Logo */}
          <div className="mb-5 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center">
              <img
                src={collegeLogo}
                alt="CAPS logo"
                className="size-12 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="outfit-700 text-[22px] text-gray-900">
              Welcome back
            </h2>
            <p className="outfit-400 mt-1 text-sm text-gray-500">
              Please enter your details to login.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* ID Code field */}
            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                ID Code
              </label>
              <input
                type="text"
                id="modal-userCode"
                placeholder="e.g. 23-A-12345"
                value={idCode}
                onChange={(e) => setIdCode(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="outfit-500 text-sm text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToForgotPassword?.();
                  }}
                  className="outfit-400 text-sm text-orange-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[20px]`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Remember me 
            <label className="outfit-400 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-blue-500"
              />
              Remember me
            </label>*/}

            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={isLogIn}
              className="outfit-400 mt-1 w-full cursor-pointer rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
            >
              {isLogIn ? (
                <div className="flex items-center justify-center">
                  <span className="loader-white"></span>
                </div>
              ) : (
                "Login"
              )}
            </button>

       

            
            {/* Register link */}
            <p className="outfit-400 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  onClose();
                  onSwitchToRegister?.();
                }}
                className="cursor-pointer font-medium text-orange-500 hover:underline"
              >
                Register
              </span>
            </p>
          </form>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
