import { useState, useEffect } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/loadingOverlay";
import AppVersion from "../components/appVersion";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

// ✅ ADDED HERE — Google Button component
function GoogleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-[11px] text-sm font-medium text-[#3c4043] shadow-sm transition-all duration-150 hover:border-gray-400 hover:shadow-md active:scale-[0.98]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
        <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
        <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
        <path fill="#FBBC05" d="M11.68 28.18A13.86 13.86 0 0 1 10.8 24c0-1.45.25-2.86.68-4.18v-5.7H4.34A23.93 23.93 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.12-5.52-.01-1.08z"/>
        <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.09 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.22l7.34 5.7C13.42 13.62 18.27 9.75 24 9.75z"/>
      </svg>
      <span className="text-[14px] font-medium tracking-wide">Continue with Google</span>
    </button>
  );
}

export default function LoginPage() {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const { toast, showToast } = useToast();
  const [isLogIn, setIsLogIn] = useState(false);

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
          showToast(data.message || "Something went wrong. Please try again later.", "error");
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
    } catch (error) {
      showToast("Something went wrong. Please try again later.", "error");
    } finally {
      setIsLogIn(false);
    }
  };

  //  new added: for google login
  const handleGoogleLogin = () => {
    const frontendUrl = window.location.origin; // e.g. http://192.168.1.17:5173
    window.location.href = `${apiUrl}/auth/google/redirect?frontend_url=${encodeURIComponent(frontendUrl)}`;
  };

  return (
    <>
      {/* Desktop View */}
      <div className="relative hidden min-h-screen w-full bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat lg:block">
        <div className="flex min-h-screen flex-row">
          <div className="mr-18 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <img src={univLogo} alt="Logo 1" className="size-8" />
              <img src={collegeLogo} alt="Logo 2" className="size-8" />
              <h1 className="outfit-500 text-xs lg:text-lg">
                JOSE RIZAL MEMORIAL STATE UNIVERSITY
              </h1>
            </div>

            <div className="outfit-700 mt-20 hidden flex-col items-center justify-center lg:flex">
              <h1 className="text-3xl leading-snug lg:text-4xl">
                <span className="text-5xl text-orange-500">C</span>OMPREHENSIVE
                <br />
                <span className="text-5xl text-orange-500">A</span>SSESSMENT AND
                <br />
                <span className="text-5xl text-orange-500">P</span>REPARATION
                <br />
                <span className="text-5xl text-orange-500">S</span>YSTEM
              </h1>
              <p className="outfit-400 mt-20 mr-10 hidden max-w-xs text-center text-sm text-gray-500 lg:block">
                A platform designed to help students practice and prepare for
                qualifying exams while assessing their knowledge through
                randomized questions.
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="outfit-400 mt-30 flex w-full items-center justify-center p-6 sm:mt-30 md:mt-30 lg:mt-0 lg:w-1/2">
            <div className="w-full max-w-xs space-y-6 sm:max-w-md">
              <div className="text-center sm:ml-10 lg:ml-0">
                <h2 className="outfit-700 mr-15 mb-1 text-[20px] text-gray-900">
                  LOG IN ACCOUNT
                </h2>
                <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
                  <span>Welcome! Please enter your code and password </span>
                  <span> to access your account.</span>
                </p>

                <form className="mt-6 w-full max-w-sm" onSubmit={handleLogin}>
                  {/* ID Number Input */}
                  <div className="relative mb-2">
                    <div className="relative">
                      <input
                        type="text"
                        id="userCode"
                        className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[9px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        placeholder="User Code"
                        value={idCode}
                        onChange={(e) => setIdCode(e.target.value)}
                      />
                      <label
                        htmlFor="userCode"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        Instructor Code/Student ID Number
                      </label>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="relative mb-4">
                    <div className="relative flex items-center overflow-hidden">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[9px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <label
                        htmlFor="password"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        className="absolute top-[18px] right-3 text-gray-400 transition-colors hover:text-gray-600"
                        onClick={() => setPasswordVisible((v) => !v)}
                        tabIndex={-1}
                      >
                        <i className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[25px]`}></i>
                      </button>
                    </div>
                    {error && (
                      <p className="mt-3 text-center text-xs text-red-500">{error}</p>
                    )}
                  </div>

                  {/* Login Button */}
                  <div className="mx-auto flex w-full items-center justify-center text-sm">
                    <button
                      type="submit"
                      disabled={isLogIn}
                      className="mb-1 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-[10px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                    >
                      {isLogIn ? (
                        <div className="flex items-center justify-center">
                          <span className="loader-white"></span>
                        </div>
                      ) : (
                        "Log in"
                      )}
                    </button>
                  </div>

                  {/* ✅ DESKTOP Google Button — clean, single, real */}
                  <div className="mb-2">
                    <GoogleButton onClick={handleGoogleLogin} />
                  </div>

                  <button
                    type="button"
                    className="mt-2 text-sm text-[#FE6902] hover:underline"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot your password?
                  </button>

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
                    <span
                      onClick={() => navigate("/team-caps")}
                      className="cursor-pointer text-orange-500 hover:underline"
                    >
                      Team Caps
                    </span>
                  </span>
                </form>
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 transform items-center space-x-2 text-gray-400 lg:left-8">
            <AppVersion />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col lg:hidden">
        <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#101010] to-[#3c3c3c]">
          <div className="relative flex h-60 w-full flex-col items-center justify-center">
            <div className="outfit absolute top-5 right-5">
              <span className="mr-2 text-[12px] text-white">Don't have an account? </span>
              <button
                onClick={() => navigate("/register")}
                className="cursor-pointer rounded-lg bg-white/10 px-4 py-1 text-[14px] font-medium text-white shadow-md backdrop-blur-md transition hover:bg-white/20 hover:backdrop-blur-lg"
              >
                Sign in
              </button>
            </div>
            <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
              <img src={univLogo} alt="University Logo" className="size-8 object-contain" />
              <img src={collegeLogo} alt="College Logo" className="size-8 object-contain" />
            </div>
            <div className="mt-5 mb-1 flex flex-col items-center">
              <h1 className="text-center text-[22px] font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
                <span><span className="text-3xl text-orange-500">C</span>OMPREHENSIVE</span>
                <span><span className="text-3xl text-orange-500"> A</span>SSESSMENT</span>
                <br />
                <span>AND</span>
                <span><span className="text-3xl text-orange-500"> P</span>REPARATION</span>
                <span><span className="text-3xl text-orange-500"> S</span>YSTEM</span>
              </h1>
            </div>
          </div>
        </div>

        <div
          style={{ borderTopLeftRadius: "30px 15px", borderTopRightRadius: "30px 15px" }}
          className="mx-auto -mt-10 flex h-[14px] w-[85%] flex-col items-center justify-center bg-white/10 shadow-lg backdrop-blur-md"
        ></div>

        {/* Login Card */}
        <div className="flex w-full flex-col items-center justify-center rounded-t-4xl bg-white p-6">
          <h2 className="mb-1 text-[20px] font-bold text-gray-900">LOG IN ACCOUNT</h2>
          <p className="mb-5 max-w-80 justify-center text-center text-xs text-gray-500 md:max-w-full lg:mr-15">
            <span>Welcome! Please enter your code and password </span>
            <span> to access your account.</span>
          </p>
          <form
            className="mt-2 flex w-full flex-col gap-4 sm:max-w-md md:max-w-xl"
            onSubmit={handleLogin}
          >
            <div className="relative w-full">
              <div className="relative">
                <input
                  type="text"
                  id="userCode"
                  className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder="User Code"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                />
                <label
                  htmlFor="userCode"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Instructor Code/Student ID Number
                </label>
              </div>
            </div>

            {/* Password Field */}
            <div className="relative w-full">
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <label
                  htmlFor="password"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute top-[21px] right-3 text-gray-400 transition-colors hover:text-gray-600"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                >
                  <i className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[25px]`}></i>
                </button>
              </div>
            </div>

            {error && <p className="text-center text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isLogIn}
              className="mt-3 mb-1 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
            >
              {isLogIn ? (
                <div className="flex items-center justify-center">
                  <span className="loader-white"></span>
                </div>
              ) : (
                "LOG IN"
              )}
            </button>

            {/* ✅ MOBILE Google Button — clean, single, real */}
            <GoogleButton onClick={handleGoogleLogin} />

          </form>

          <button
            type="button"
            className="mt-4 mb-5 text-sm text-[#FE6902] hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot your password?
          </button>

          <div className="my-2 flex w-full items-center">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="mx-2 text-xs text-gray-400">
              <AppVersion />
            </span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <span className="mx-2 text-xs text-gray-400">
            Developed by{" "}
            <button
              onClick={() => navigate("/team-caps")}
              className="cursor-pointer text-orange-500 hover:underline"
            >
              Team Caps
            </button>
          </span>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}