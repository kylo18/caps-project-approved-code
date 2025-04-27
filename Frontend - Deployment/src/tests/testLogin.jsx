import { useState } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/loadingOverlay";

const Login = () => {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [rememberMe, setRememberMe] = useState(false);

  const [isLogIn, setIsLogIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    setIsLogIn(true); // Start loading indicator (if any)

    if (!idCode.trim() || !password.trim()) {
      setError("Please enter both ID Code and Password.");
      setIsLogIn(false); // Stop loading if validation fails
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
          // 401 Unauthorized -> wrong userCode or password
          setError("Incorrect ID Code or Password.");
        } else {
          // Other errors
          setError(data.message || "Login failed. Please try again.");
        }
        return;
      }

      console.log("Login successful!", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const roleId = Number(data.user.roleID);
      switch (roleId) {
        case 1:
          navigate("/student");
          break;
        case 2:
          navigate("/faculty-dashboard");
          break;
        case 3:
          navigate("/program-chair-dashboard");
          break;
        case 4:
          navigate("/admin-dashboard");
          break;
        default:
          setError("Invalid user role.");
          break;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLogIn(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col items-center justify-center bg-[url('/login-bg-xs.png')] bg-cover bg-center sm:bg-[url('/login-bg-md.png')] md:gap-10 lg:flex-row lg:bg-[url('/login-bg.png')]">
      {/* Logos (Top Left) */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <img src={univLogo} alt="Logo 1" className="size-8" />
        <img src={collegeLogo} alt="Logo 2" className="size-8" />
        <p className="text-center text-xs text-white sm:text-sm md:text-base lg:text-lg xl:text-xl">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY
        </p>
      </div>

      {/* Left Side (Title + Description at Bottom) */}
      <div className="flex h-full flex-col items-center justify-start px-4 py-6 pt-12 sm:px-6 md:px-8 lg:px-12">
        {/* Horizontal Title for <lg */}
        <div className="min-w-[833px]:-mt-70 -mt-45 text-center sm:-mt-50 md:-mt-54 md:hidden">
          <h1 className="text-[22px] leading-snug font-bold tracking-wide text-white sm:text-[30px]">
            <span>
              <span className="text-3xl text-orange-500">C</span>OMPREHENSIVE
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

        {/* Stacked Title for lg and above */}
        <div className="mt-20 hidden flex-col items-start md:mt-0 md:flex lg:mt-0">
          <h1 className="mt-25 text-4xl leading-snug font-bold tracking-wide text-white md:text-[30px] xl:mr-40">
            <span>
              <span className="text-5xl text-orange-500">C</span>OMPREHENSIVE
            </span>
            <br />
            <span>
              <span className="text-5xl text-orange-500">A</span>SSESSMENT &
            </span>
            <br />
            <span>
              <span className="text-5xl text-orange-500">P</span>REPARATION
            </span>
            <br />
            <span>
              <span className="text-5xl text-orange-500">S</span>YSTEM
            </span>
          </h1>
        </div>

        {/* Description */}
        <p className="mt-25 hidden max-w-md text-center text-sm text-gray-400 md:text-base lg:block xl:mr-40">
          A platform designed to help students practice and prepare for
          qualifying exams while assessing their knowledge through randomized
          questions.
        </p>
      </div>

      {/* Right Side (Login Form) */}
      <div className="flex w-[85%] flex-col items-center justify-center lg:mr-30 lg:w-full lg:max-w-md lg:px-4">
        <h2 className="text-xl font-bold">LOG IN ACCOUNT</h2>
        <p className="mt-2 justify-center text-center text-sm text-gray-500">
          <span>Welcome! Please enter your ID number and password</span>
          <br />
          <span>to access your account.</span>
        </p>

        {/* Form */}
        <div className="mt-6 w-full max-w-sm">
          {/* ID Number Input */}
          <div className="relative mb-4">
            <i className="bx bx-user absolute top-3 left-3 text-[18px] text-gray-500"></i>
            <input
              type="text"
              placeholder="Enter ID Number"
              className="open-sans border-[rgb(168,168,168) w-full rounded-none border-0 border-b px-10 py-2 transition-all duration-100 hover:border-b hover:border-b-gray-500 focus:border-b-2 focus:border-b-orange-500 focus:outline-none"
              value={idCode}
              onChange={(e) => setIdCode(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-4">
            <div className="relative flex items-center overflow-hidden">
              <i className="bx bx-key absolute top-3 left-3 text-[18px] text-gray-500"></i>
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter Password"
                className="open-sans border-[rgb(168,168,168) w-full rounded-none border-0 border-b px-10 py-2 transition-all duration-100 hover:border-b hover:border-b-gray-500 focus:border-b-2 focus:border-b-orange-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="border-[rgb(168,168,168) top-2 right-2 flex cursor-pointer items-center border-b p-2"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                <i
                  className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[24px] text-orange-500`}
                ></i>
              </div>
            </div>
            {error && (
              <p className="mt-2 text-center text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Remember Me & Links */}
          <div className="mb-4 flex items-center justify-between text-sm text-nowrap text-gray-600">
            <label className="flex items-center text-[13px]">
              <input
                type="checkbox"
                className="mr-2 cursor-pointer"
                style={{ accentColor: "orange" }}
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <div>
              <a href="#" className="text-[13px] hover:underline">
                Forgot Password
              </a>
            </div>
          </div>

          {/* Login Button */}
          <div className="mx-auto flex w-1/3 items-center justify-center">
            <button
              type="submit"
              onClick={handleLogin}
              className="mt-2 w-full rounded bg-orange-500 py-2 text-white hover:bg-orange-600"
            >
              LOG-IN
            </button>
          </div>

          {/* Register Link */}
          <p className="mt-4 justify-center text-center text-[14px] text-gray-600">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-orange-500 hover:underline"
            >
              Register here
            </span>
          </p>

          {/*<div className="px-4 text-sm text-gray-600 justify-center text-center absolute bottom-0 left-0 right-0">
            <p>
              &copy; 2025 Comprehensive Assessment and Preparation System. All rights reserved.
            </p>
          </div>*/}
        </div>
      </div>
      {isLogIn && <LoadingOverlay show={isLogIn} />}
    </div>
  );
};

export default Login;
