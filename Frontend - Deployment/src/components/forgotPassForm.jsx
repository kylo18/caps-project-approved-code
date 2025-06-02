import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "../assets/univLogo.png";
import AppVersion from "../components/appVersion";
import collegeLogo from "/src/assets/college-logo.png";

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
      setIsError(!res.ok);
      setMessage(
        data.message || "Something went wrong. Please try again later.",
      );
    } catch (error) {
      setIsError(true);
      setMessage("Something went wrong. Please try again later.");
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
                  FORGOT YOUR PASSWORD?
                </h2>
                <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
                  <span>
                    Enter your email address and we'll send you a link to reset
                    your password.{" "}
                  </span>
                </p>

                <form className="mt-6 w-full max-w-sm">
                  {/* ID Number Input */}
                  <div className="relative mb-4">
                    <div className="relative">
                      <input
                        className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[9px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <label
                        htmlFor="Email Address"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        Email Address
                      </label>
                    </div>
                  </div>
                  {/* Login Button */}
                  <div className="mx-auto mt-2 flex w-full items-center justify-center text-sm">
                    <button
                      type="submit"
                      className="mb-1 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-[10px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </div>
                  <p className="mt-4 mb-4 justify-center text-center text-[14px] text-gray-600">
                    Don't have an account?{" "}
                    <span
                      onClick={() => navigate("/register")}
                      className="cursor-pointer text-orange-500 hover:underline"
                    >
                      Register here
                    </span>
                  </p>
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
            <div className="font-inter absolute top-5 right-5">
              <span className="mr-2 text-[12px] text-white">
                Don't have an account?{" "}
              </span>
              <button
                onClick={() => navigate("/register")}
                className="cursor-pointer rounded-lg bg-white/10 px-4 py-1 text-[14px] font-medium text-white shadow-md backdrop-blur-md transition hover:bg-white/20 hover:backdrop-blur-lg"
              >
                Sign in
              </button>
            </div>
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
              <h1 className="text-center text-[22px] font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
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

        {/* Forgot Password Card */}
        <div
          style={{ fontFamily: "Poppins, sans-serif" }}
          className="flex w-full flex-col items-center justify-center rounded-t-4xl bg-white p-6"
        >
          <h2 className="mb-1 text-[20px] font-bold text-gray-900">
            FORGOT YOUR PASSWORD?
          </h2>
          <p className="mb-5 max-w-80 justify-center text-center text-xs text-gray-500 md:max-w-full lg:mr-15">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-2 flex w-full flex-col gap-4 sm:max-w-md md:max-w-xl"
          >
            <div className="relative w-full">
              <div className="relative">
                <input
                  type="email"
                  className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label
                  htmlFor="Email Address"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Email Address
                </label>
              </div>
            </div>

            {message && (
              <p
                className={`text-center text-xs ${isError ? "text-red-500" : "text-green-500"}`}
              >
                {message}
              </p>
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
                "Send Reset Link"
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

export default ForgotPasswordForm;
