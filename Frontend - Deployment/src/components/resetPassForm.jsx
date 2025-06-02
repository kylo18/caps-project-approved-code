import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "../assets/univLogo.png";
import AppVersion from "../components/appVersion";
import collegeLogo from "/src/assets/college-logo.png";

// Reset PAssword Form
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
      <div className="relative hidden min-h-screen w-full bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat lg:block">
        {/* Left Section */}
        <div className="flex min-h-screen flex-row">
          <div className="mr-10 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
            {/* Logos */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <img src={univLogo} alt="Logo 1" className="size-8" />
              <img src={collegeLogo} alt="Logo 2" className="size-8" />
              <h1 className="text-xs lg:text-lg">
                JOSE RIZAL MEMORIAL STATE UNIVERSITY
              </h1>
            </div>

            {/* Title */}
            <div className="mt-20 hidden flex-col items-center justify-center lg:flex">
              <h1 className="text-3xl leading-snug font-bold lg:text-4xl">
                <span className="text-5xl text-orange-500">C</span>OMPREHENSIVE
                <br />
                <span className="text-5xl text-orange-500">A</span>SSESSMENT AND
                <br />
                <span className="text-5xl text-orange-500">P</span>REPARATION
                <br />
                <span className="text-5xl text-orange-500">S</span>YSTEM
              </h1>
              <p className="mt-20 mr-10 hidden max-w-xs text-center text-sm text-gray-500 lg:block">
                A platform designed to help students practice and prepare for
                qualifying exams while assessing their knowledge through
                randomized questions.
              </p>
            </div>

            <div className="font-inter mt-12 flex flex-col items-center justify-center lg:hidden">
              <h1 className="text-center text-[20px] leading-snug font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
                <span>
                  <span className="text-3xl text-orange-500">C</span>
                  OMPREHENSIVE
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> A</span>SSESSMENT
                </span>
                <br />
                <span>AND</span>
                <span>
                  <span className="text-3xl text-orange-500"> P</span>REPARATION
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> S</span>YSTEM
                </span>
              </h1>
            </div>
          </div>

          {/* Right Section - Form */}
          <div className="mt-30 flex w-full items-center justify-center p-6 sm:mt-30 md:mt-30 lg:mt-0 lg:w-1/2">
            <div className="w-full max-w-xs space-y-6 sm:max-w-md">
              {/* Header */}

              <div
                style={{ fontFamily: "Poppins, sans-serif" }}
                className="text-center sm:ml-10 lg:ml-0"
              >
                <h2 className="mr-15 mb-1 text-[20px] font-bold text-gray-900">
                  RESET YOUR PASSWORD
                </h2>
                <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
                  <span>
                    Enter your new password below to update your account
                    credentials and complete the reset process.{" "}
                  </span>
                </p>

                <form className="mt-6 w-full max-w-sm">
                  <div className="relative mb-4">
                    <div className="relative">
                      <input
                        className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[9px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        type={passwordVisible ? "text" : "password"}
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <label
                        htmlFor="New Password"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        New Password
                      </label>
                      <div
                        className="absolute top-[18px] right-3 cursor-pointer"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        <i
                          className={`bx ${passwordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[23px] text-gray-500`}
                        ></i>
                      </div>
                    </div>

                    <div className="relative mt-3">
                      <input
                        className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[9px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        type={confirmPasswordVisible ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={passwordConfirmation}
                        onChange={(e) =>
                          setPasswordConfirmation(e.target.value)
                        }
                        required
                      />
                      <label
                        htmlFor="Confirm Password"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        Confirm Password
                      </label>
                      <div
                        className="absolute top-[18px] right-3 cursor-pointer"
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

                  {/* Login Button */}
                  <div className="mx-auto mt-2 mb-2 flex w-full items-center justify-center text-sm">
                    <button
                      type="submit"
                      className="mb-1 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-[10px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        </div>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>

                  <span className="mx-2 text-xs text-gray-400">
                    Developed by{" "}
                    <span className="text-orange-500">Team Caps</span>
                  </span>
                </form>
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 ml-5 flex -translate-x-1/2 transform items-center space-x-2 text-gray-500 lg:left-8">
            <AppVersion />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col lg:hidden">
        <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#101010] to-[#3c3c3c]">
          {/* Purple Gradient Header */}
          <div className="relative flex h-60 w-full flex-col items-center justify-center">
            {/* Logos at top left */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
              <img
                src={univLogo}
                alt="University Logo"
                className="size-8 object-contain"
              />
              <img
                src={collegeLogo}
                alt="College Logo"
                className="size-8 object-contain"
              />
            </div>
            <div
              style={{ fontFamily: "Poppins, sans-serif" }}
              className="mt-5 mb-1 flex flex-col items-center"
            >
              <h1 className="text-center text-[22px] font-bold tracking-wide whitespace-nowrap text-white min-[344px]:text-[20px] sm:text-[30px]">
                <span>
                  <span className="text-3xl text-orange-500">C</span>
                  OMPREHENSIVE
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> A</span>SSESSMENT
                </span>
                <br />
                <span>AND</span>
                <span>
                  <span className="text-3xl text-orange-500"> P</span>REPARATION
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> S</span>YSTEM
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTopLeftRadius: "30px 15px",
            borderTopRightRadius: "30px 15px",
          }}
          className="mx-auto -mt-10 flex h-[14px] w-[85%] flex-col items-center justify-center bg-white/10 shadow-lg backdrop-blur-md"
        ></div>

        {/* Reset Password Card */}
        <div
          style={{ fontFamily: "Poppins, sans-serif" }}
          className="flex w-full flex-col items-center justify-center rounded-t-4xl bg-white p-6"
        >
          <h2 className="mb-1 text-[20px] font-bold text-gray-900">
            RESET YOUR PASSWORD
          </h2>
          <p className="mb-5 max-w-80 justify-center text-center text-xs text-gray-500 md:max-w-full lg:mr-15">
            Enter your new password below to update your account credentials and
            complete the reset process.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-2 flex w-full flex-col gap-4 sm:max-w-md md:max-w-xl"
          >
            <div className="relative w-full">
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label
                  htmlFor="New Password"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  New Password
                </label>
                <button
                  type="button"
                  className="absolute top-[21px] right-3 text-gray-400"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  tabIndex={-1}
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                  ></i>
                </button>
              </div>
            </div>

            <div className="relative w-full">
              <div className="relative">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder="Confirm Password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
                <label
                  htmlFor="Confirm Password"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Confirm Password
                </label>
                <button
                  type="button"
                  className="absolute top-[21px] right-3 text-gray-400"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  tabIndex={-1}
                >
                  <i
                    className={`bx ${confirmPasswordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                  ></i>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
            {message && (
              <p className="text-center text-xs text-green-500">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 mb-4 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="my-2 flex w-full items-center">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="mx-2 text-xs text-gray-400">
              <AppVersion />
            </span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <span className="mx-2 text-xs text-gray-400">
            Developed by <span className="text-orange-500">Team Caps</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
