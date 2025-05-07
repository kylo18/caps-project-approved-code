import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPasswordForm = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch(`${apiUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setIsError(!res.ok); // Set error state if response is not ok
      setMessage(data.message || "Something went wrong.");
    } catch (error) {
      setIsError(true);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false); // Always stop loading
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-2">
        <div className="w-full max-w-md rounded border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-color flex flex-col items-center border-b-[0.1px] px-6 py-6">
            <h2 className="text-lg font-semibold">Forgot your password?</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="flex items-start space-x-3 text-sm text-gray-600">
              <i className="bx bxs-lock text-2xl"></i>
              <p>
                Enter your email address and we’ll send you a link to reset your
                password.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {message && (
              <p
                className={`text-center text-sm ${isError ? "text-red-600" : "text-green-600"}`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPasswordForm;
