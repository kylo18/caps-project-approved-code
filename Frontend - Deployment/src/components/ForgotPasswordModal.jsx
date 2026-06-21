import { useState } from "react";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/forgot-password`, {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Something went wrong. Please try again later.", "error");
        return;
      }
      showToast(data.message || "Password reset link sent successfully!", "success");
      setEmail("");
      setTimeout(() => onClose(), 2000);
    } catch {
      showToast("Unstable network connection. Please check your internet and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            <h2 className="outfit-700 text-[22px] text-gray-900">Forgot password?</h2>
            <p className="outfit-400 mt-1 text-sm text-gray-500">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="outfit-400 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
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
                "Send Reset Link"
              )}
            </button>

            <p className="outfit-400 text-center text-sm text-gray-500">
              Remember your password?{" "}
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
