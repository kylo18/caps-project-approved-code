import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const collegeLogo = new URL("/college-logo.png", import.meta.url).href;

  const [token, setToken] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setToken(query.get("token") || "");
    setEmail(query.get("email") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Password reset successful!");

        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        setError(data.message || "Password reset failed.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-4 md:justify-center md:p-2">
        <div className="mb-5 flex h-[60px] w-full items-center justify-center gap-2 text-center">
          <img src={collegeLogo} alt="College Logo" className="size-[40px]" />
          <div className="font-inter font-bold">
            COMPREHENSIVE ASSESSMENT
            <br className="block md:hidden" />
            AND PREPARATION SYSTEM
          </div>
        </div>

        <div className="w-full max-w-md rounded border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-color flex flex-col items-center border-b-[0.1px] px-6 py-6">
            <h2 className="text-lg font-semibold">Reset your password?</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="flex items-start space-x-3 text-sm text-gray-600">
              <i className="bx bxs-lock text-2xl"></i>
              <p>
                Enter your new password below to update your account credentials
                and complete the reset process.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                New Password
              </label>

              <div className="relative mb-4">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />

                <div
                  className="absolute top-2 right-3 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}
                  ></i>
                </div>
              </div>

              <label className="mb-1 block text-sm font-medium text-gray-800">
                Confirm Password
              </label>

              <div className="relative mb-4">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <div
                  className="absolute top-2 right-3 cursor-pointer"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                >
                  <i
                    className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}
                  ></i>
                </div>
              </div>
            </div>

            {message && (
              <p className="text-center text-sm text-green-600">{message}</p>
            )}
            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Save"}
            </button>
          </form>

          {/* Footer */}
          <div className="border-color flex items-center justify-between border-t-[0.5px] px-6 py-4 text-sm text-gray-700">
            <span>Don't have an account?</span>
            <button
              onClick={() => navigate("/register")}
              className="cursor-pointer rounded border border-gray-300 bg-white px-4 py-1.5 font-medium hover:bg-gray-100"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
