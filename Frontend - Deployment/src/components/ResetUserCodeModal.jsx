import { useState, useEffect } from "react";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function ResetUserCodeModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [userCode, setUserCode] = useState("");
  const [userCodeConfirmation, setUserCodeConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCodeTouched, setUserCodeTouched] = useState(false);
  const [userCodeError, setUserCodeError] = useState("");
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const query = new URLSearchParams(window.location.search);
      setToken(query.get("token") || "");
      setEmail(query.get("email") || "");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setUserCode("");
      setUserCodeConfirmation("");
      setUserCodeTouched(false);
      setUserCodeError("");
    }
  }, [isOpen]);

  const validateUserCode = (value) => {
    if (!value.trim()) return "ID code is required";
    if (value.length > 20) return "ID code must be 20 characters or fewer";
    return "";
  };

  const handleUserCodeChange = (e) => {
    const val = e.target.value;
    setUserCode(val);
    if (userCodeTouched) setUserCodeError(validateUserCode(val));
  };

  const handleUserCodeBlur = (e) => {
    setUserCodeTouched(true);
    setUserCodeError(validateUserCode(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserCodeTouched(true);
    const err = validateUserCode(userCode);
    if (err) {
      setUserCodeError(err);
      return;
    }
    if (userCode !== userCodeConfirmation) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/reset-user-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          userCode,
          userCode_confirmation: userCodeConfirmation,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || "ID code reset successful!", "success");
        setTimeout(() => {
          onClose();
          onSwitchToLogin?.();
        }, 2500);
      } else {
        let errorMessage = data.message || "ID code reset failed.";
        if (data.errors && data.errors.userCode) {
          errorMessage = data.errors.userCode[0];
        } else if (data.errors) {
          errorMessage = Object.values(data.errors).flat()[0] || errorMessage;
        }
        showToast(errorMessage, "error");
      }
    } catch {
      showToast(
        "Unstable network connection. Please check your internet and try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBase =
    "outfit-400 w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:ring-2";

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

          <div className="mb-5 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center">
              <img
                src={collegeLogo}
                alt="CAPS logo"
                className="size-12 object-contain"
              />
            </div>
          </div>

          <div className="mb-6 text-center">
            <h2 className="outfit-700 text-[22px] text-gray-900">
              Reset your ID code
            </h2>
            <p className="outfit-400 mt-1 text-sm text-gray-500">
              Enter your new ID code below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                New ID Code
              </label>
              <input
                type="text"
                value={userCode}
                onChange={handleUserCodeChange}
                onBlur={handleUserCodeBlur}
                placeholder="e.g. 23-A-12345"
                className={`${inputBase} ${
                  userCodeTouched && userCodeError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
                }`}
              />
              {userCodeTouched && userCodeError && (
                <p className="mt-1 text-xs text-red-500">{userCodeError}</p>
              )}
            </div>

            <div>
              <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                Confirm ID Code
              </label>
              <input
                type="text"
                value={userCodeConfirmation}
                onChange={(e) => setUserCodeConfirmation(e.target.value)}
                placeholder="Re-enter ID code"
                className={`${inputBase} ${
                  userCodeTouched && userCode !== userCodeConfirmation
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
                }`}
              />
              {userCodeTouched && userCode !== userCodeConfirmation && (
                <p className="mt-1 text-xs text-red-500">
                  ID codes do not match
                </p>
              )}
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
                "Reset ID Code"
              )}
            </button>

            <p className="outfit-400 text-center text-sm text-gray-500">
              <span
                onClick={() => {
                  onClose();
                  onSwitchToLogin?.();
                }}
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
