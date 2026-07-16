import { useState, useEffect } from "react";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function ResetPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { toast, showToast } = useToast();

  // Read token + email from URL query params when opened
  useEffect(() => {
    if (isOpen) {
      const query = new URLSearchParams(window.location.search);
      setToken(query.get("token") || "");
      setEmail(query.get("email") || "");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const validatePassword = (v) => {
    if (!v) return "Password is required";
    if (v.length < 8) return "Password must be at least 8 characters long";
    return "";
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordTouched) setPasswordError(validatePassword(val));
  };

  const handlePasswordBlur = (e) => {
    setPasswordTouched(true);
    setPasswordError(validatePassword(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordTouched(true);
    const err = validatePassword(password);
    if (err) { setPasswordError(err); return; }
    if (password !== passwordConfirmation) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, email, password, password_confirmation: passwordConfirmation }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || "Password reset successful!", "success");
        setTimeout(() => { onClose(); onSwitchToLogin?.(); }, 2500);
      } else {
        showToast(data.message || "Password reset failed.", "error");
      }
    } catch {
      showToast("Unstable network connection. Please check your internet and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBase = "outfit-400 w-full rounded-lg border bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:ring-2";

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Logo */}
          <div className="mb-5 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center">
              <img src={collegeLogo} alt="CAPS logo" className="size-12 object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="outfit-700 text-[22px] text-gray-900">Reset your password</h2>
            <p className="outfit-400 mt-1 text-sm text-gray-500">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New Password */}
            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  placeholder="Min. 8 characters"
                  className={`${inputBase} ${passwordTouched && passwordError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"}`}
                />
                <button type="button" onClick={() => setPasswordVisible((v) => !v)} tabIndex={-1} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[20px]`}></i>
                </button>
              </div>
              {passwordTouched && passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Re-enter password"
                  className={`${inputBase} ${passwordTouched && password !== passwordConfirmation ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"}`}
                />
                <button type="button" onClick={() => setConfirmPasswordVisible((v) => !v)} tabIndex={-1} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={`bx ${confirmPasswordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[20px]`}></i>
                </button>
              </div>
              {passwordTouched && password !== passwordConfirmation && <p className="mt-1 text-xs text-red-500">Passwords do not match</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="outfit-400 mt-1 w-full cursor-pointer rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <span className="loader-white"></span>
                </div>
              ) : (
                "Reset Password"
              )}
            </button>

            <p className="outfit-400 text-center text-sm text-gray-500">
              <span
                onClick={() => { onClose(); onSwitchToLogin?.(); }}
                className="cursor-pointer font-medium text-orange-500 hover:underline"
              >
                Back to login
              </span>
            </p>
          </form>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
