import { useEffect, useRef, useState } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/loadingOverlay";
import AppVersion from "../components/appVersion";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import { getApiUrl } from "../utils/config";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../contexts/ThemeContext";

// Handles credential login, social login callbacks, and role-based post-login navigation.
export default function LoginPage() {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Get toast functions from hook
  const { toast, showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [isLogIn, setIsLogIn] = useState(false);
  const apiUrl = getApiUrl();
  const handledSocialAuth = useRef(false);

  // Sends authenticated users to the dashboard that matches their role ID.
  const redirectUserByRole = (user) => {
    const roleId = Number(user?.roleID ?? user?.roleId);

    switch (roleId) {
      case 1:
        navigate("/student-dashboard", { replace: true });
        break;
      case 2:
        navigate("/faculty-dashboard", { replace: true });
        break;
      case 3:
        navigate("/program-chair-dashboard", { replace: true });
        break;
      case 4:
        navigate("/dean-dashboard", { replace: true });
        break;
      case 5:
        navigate("/asso-dean-dashboard", { replace: true });
        break;
      default:
        setError("Invalid user role.");
        break;
    }
  };

  // Removes OAuth callback query params so refreshes do not re-run social login handling.
  const clearSocialAuthParams = () => {
    const url = new URL(window.location.href);
    ["social_token", "social_error", "provider", "message"].forEach((key) =>
      url.searchParams.delete(key),
    );
    const cleanedPath = url.pathname.startsWith("/auth/") ? "/" : url.pathname;
    window.history.replaceState(
      {},
      document.title,
      `${cleanedPath}${url.search}${url.hash}`,
    );
  };

  // Starts the backend OAuth redirect and tells the backend which frontend origin to return to.
  const handleSocialLoginRedirect = (provider) => {
    const frontendUrl = window.location.origin;
    window.location.href = `${apiUrl}/api/auth/${provider}/redirect?frontend_url=${encodeURIComponent(frontendUrl)}`;
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const socialToken = url.searchParams.get("social_token");
    const socialError = url.searchParams.get("social_error");
    const provider = url.searchParams.get("provider");
    const message = url.searchParams.get("message");

    if ((!socialToken && !socialError) || handledSocialAuth.current) {
      return;
    }

    handledSocialAuth.current = true;

    if (socialError) {
      const providerLabel = provider
        ? `${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
        : "Social";
      const errorMessage =
        message ||
        (socialError === "no_account"
          ? `No existing CAPS account matches this ${providerLabel} account.`
          : socialError === "account_mismatch"
            ? `${providerLabel} is already linked to another account.`
            : `Failed to authenticate with ${providerLabel}.`);

      showToast(errorMessage, "error");
      clearSocialAuthParams();
      return;
    }

    // Finishes the OAuth callback by saving the token, loading the profile, and reusing the normal dashboard routing.
    const completeSocialLogin = async () => {
      setIsLogIn(true);

      try {
        localStorage.setItem("token", socialToken);

        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${socialToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load the account after social login.");
        }

        const socialUser = await response.json();
        localStorage.setItem("user", JSON.stringify(socialUser));

        showToast(
          `${provider ? `${provider.charAt(0).toUpperCase()}${provider.slice(1)}` : "Social"} login successful.`,
          "success",
        );
        clearSocialAuthParams();
        redirectUserByRole(socialUser);
      } catch (socialLoginError) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearSocialAuthParams();
        showToast(
          socialLoginError.message || "Failed to complete social login.",
          "error",
        );
      } finally {
        setIsLogIn(false);
      }
    };

    completeSocialLogin();
  }, [apiUrl, navigate, showToast]);

  // Authenticates with the backend using CAPS credentials, then stores the token and routes by role.
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
      const loginUrl = `${apiUrl}/api/login`;
      console.log('Attempting login to:', loginUrl);

      const response = await fetch(loginUrl, {
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

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 200));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        showToast(`Server returned invalid JSON. Status: ${response.status}. URL: ${loginUrl}`, "error");
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          // 401 Unauthorized -> wrong userCode or password
          showToast(data.message || "Incorrect user code or password", "error");
        } else {
          // Other errors
          showToast(
            data.message || "Something went wrong. Please try again later.",
            "error",
          );
        }
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      redirectUserByRole(data.user);
    } catch (error) {
      const fullUrl = `${apiUrl}/api/login`;
      console.error('Login catch block error:', error);
      if (!apiUrl) {
        showToast("API Server URL is missing. Please check configuration.", "error");
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        showToast(`Network error - cannot reach ${apiUrl}. Check URL and internet connection.`, "error");
      } else {
        showToast(`Error: ${error.message}`, "error");
      }
    } finally {
      setIsLogIn(false);
    }
  };

  return (
    <>
      {/* Desktop View */}
      <div className="relative hidden min-h-screen w-full bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat lg:block">
        {/* Left Section */}
        <div className="flex min-h-screen flex-row">
          <div className="mr-18 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
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

          {/* Right Section */}
          <div className="mt-30 flex w-full items-center justify-center p-6 sm:mt-30 md:mt-30 lg:mt-0 lg:w-1/2">
            <div className="w-full max-w-xs space-y-6 sm:max-w-md">
              <div
                style={{ fontFamily: "Poppins, sans-serif" }}
                className="text-center sm:ml-10 lg:ml-0"
              >
                <h2 className="mr-15 mb-1 text-[20px] font-bold text-gray-900 dark:text-white">
                  LOG IN ACCOUNT
                </h2>
                <p className="mt-2 justify-center text-center text-sm text-gray-500 dark:text-gray-400 lg:mr-15">
                  <span>Welcome! Please enter your code and password </span>
                  <span> to access your account.</span>
                </p>

                <form className="mt-6 w-full max-w-sm">
                  {/* ID Number Input */}
                  <div className="relative mb-2">
                    <div className="relative">
                      <input
                        type="text"
                        id="userCode"
                        className="peer mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-[9px] text-base text-gray-900 dark:text-white placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        placeholder="User Code"
                        value={idCode}
                        onChange={(e) => setIdCode(e.target.value)}
                      />
                      <label
                        htmlFor="userCode"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white dark:bg-black px-1 text-base text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
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
                        className="peer mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-[9px] text-base text-gray-900 dark:text-white placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <label
                        htmlFor="userCode"
                        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white dark:bg-black px-1 text-base text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        className="absolute top-[18px] right-3 text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setPasswordVisible((v) => !v)}
                        tabIndex={-1}
                      >
                        <i
                          className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[25px]`}
                        ></i>
                      </button>
                    </div>
                    {error && (
                      <p className="mt-3 text-center text-xs text-red-500">
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Login Button */}
                  <div className="mx-auto flex w-full items-center justify-center text-sm">
                    <button
                      type="submit"
                      onClick={handleLogin}
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

                  <button
                    type="button"
                    className="mt-2 text-sm text-[#FE6902] hover:underline"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot your password?
                  </button>

                  {/* Social Login */}
                  <div className="mb-3 mt-4 flex w-full items-center justify-center gap-3">
                    <span className="text-xs text-gray-500">or continue with</span>
                  </div>
                  <div className="mb-4 flex w-full gap-3">
                    <button
                      type="button"
                      onClick={() => handleSocialLoginRedirect("google")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <FcGoogle className="text-lg" />
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSocialLoginRedirect("facebook")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <FaFacebook className="text-lg text-blue-600" />
                      Facebook
                    </button>
                  </div>

                  {/* Register Link */}
                  <p className="mt-4 mb-4 justify-center text-center text-[14px] text-gray-600">
                    Don't have an account?{" "}
                    <span
                      onClick={() => navigate("/register")}
                      className="cursor-pointer text-orange-500 hover:underline"
                    >
                      Register here
                    </span>
                  </p>

                  <span className="mx-2 text-xs text-gray-400 dark:text-gray-500">
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
      <div
        className="flex min-h-screen flex-col bg-white dark:bg-black lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#101010] to-[#3c3c3c] dark:from-black dark:to-[#0a0a0a]">
          {/* Purple Gradient Header */}
          <div className="relative flex h-60 w-full flex-col items-center justify-center px-4">
            {/* Top row: Sign up (right) and Logos + Theme (left) - flex to prevent overlap */}
            <div className="absolute top-5 left-4 right-4 flex items-center justify-between z-10">
              {/* Left: Logos + Theme Toggle */}
              <div className="flex items-center gap-2">
                <img
                  src={univLogo}
                  alt="University Logo"
                  className="size-7 sm:size-8 object-contain"
                />
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="size-7 sm:size-8 object-contain"
                />
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white shadow-md backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                  title={isDark ? "Light Mode" : "Dark Mode"}
                >
                  {isDark ? <FaSun className="text-base text-yellow-400" /> : <FaMoon className="text-base" />}
                </button>
              </div>
              {/* Right: Sign up button */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[12px] text-white whitespace-nowrap">
                  Don't have an account?
                </span>
                <button
                  onClick={() => navigate("/register")}
                  className="cursor-pointer rounded-lg bg-white/10 px-2 sm:px-4 py-1 text-[12px] sm:text-[14px] font-medium text-white shadow-md backdrop-blur-md transition hover:bg-white/20 hover:backdrop-blur-lg"
                >
                  Sign up
                </button>
              </div>
            </div>
            <div
              style={{ fontFamily: "Poppins, sans-serif" }}
              className="mt-5 mb-1 flex flex-col items-center"
            >
              <h1 className="text-center text-[22px] font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
                <span>
                  <span className="text-3xl text-[var(--color-primary)]">C</span>
                  OMPREHENSIVE
                </span>
                <span>
                  <span className="text-3xl text-[var(--color-primary)]"> A</span>SSESSMENT
                </span>
                <br />
                <span>AND</span>
                <span>
                  <span className="text-3xl text-[var(--color-primary)]"> P</span>REPARATION
                </span>
                <span>
                  <span className="text-3xl text-[var(--color-primary)]"> S</span>YSTEM
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
          className="mx-auto -mt-10 flex h-[14px] w-[85%] flex-col items-center justify-center bg-white/10 dark:bg-black/50 shadow-lg backdrop-blur-md"
        ></div>

        {/* Login Card */}
        <div
          style={{ fontFamily: "Poppins, sans-serif" }}
          className="flex w-full flex-1 flex-col items-center justify-center rounded-t-4xl bg-white dark:bg-black p-6"
        >
          <h2 className="mb-1 text-[20px] font-bold text-gray-900 dark:text-white">
            LOG IN ACCOUNT
          </h2>
          <p className="mb-5 max-w-80 justify-center text-center text-xs text-gray-500 dark:text-gray-400 md:max-w-full lg:mr-15">
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
                  className="peer mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-[12px] text-base text-gray-900 dark:text-white placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder="User Code"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                />
                <label
                  htmlFor="userCode"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white dark:bg-black px-1 text-base text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
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
                  className="peer mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-[12px] text-base text-gray-900 dark:text-white placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <label
                  htmlFor="userCode"
                  className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white dark:bg-black px-1 text-base text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute top-[21px] right-3 text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[25px]`}
                  ></i>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
            <button
              type="submit"
              onClick={handleLogin}
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
          </form>
          <button
            type="button"
            className="mt-2 mb-3 text-sm text-[#FE6902] hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot your password?
          </button>

          {/* Social Login */}
          <div className="mb-4 flex w-full items-center justify-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">or continue with</span>
          </div>
          <div className="mb-4 flex w-full gap-3">
            <button
              type="button"
              onClick={() => handleSocialLoginRedirect("google")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FcGoogle className="text-lg" />
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLoginRedirect("facebook")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FaFacebook className="text-lg text-blue-600" />
              Facebook
            </button>
          </div>
        </div>
        <div className="mt-4 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            <AppVersion />
          </span>
        </div>

        <span className="mb-4 text-xs text-gray-400 dark:text-gray-500">
          Developed by{" "}
          <button
            onClick={() => navigate("/team-caps")}
            className="cursor-pointer text-orange-500 hover:underline"
          >
            Team Caps
          </button>
        </span>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
