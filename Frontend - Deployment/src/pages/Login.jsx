import { useState } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/loadingOverlay";
import AppVersion from "../components/appVersion";

export default function LoginPage() {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [isLogIn, setIsLogIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLogIn(true);

    if (!idCode.trim() || !password.trim()) {
      setError("Please enter both ID Code and Password.");
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
          navigate("/student-dashboard");
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
    <div className="flex min-h-screen w-full flex-col bg-[url('/login-bg-xs.png')] bg-cover bg-center bg-no-repeat sm:bg-[url('/login-bg-sm.png')] md:bg-[url('/login-bg-md.png')] lg:flex-row lg:bg-[url('/login-bg.png')]">
      {/* Left Section */}
      <div className="mr-10 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
        {/* Logos */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <img src={univLogo} alt="Logo 1" className="size-8" />
          <img src={collegeLogo} alt="Logo 2" className="size-8" />
          <h1 className="text-xs lg:text-lg">
            JOSE RIZAL MEMORIAL STATE UNIVERSITY
          </h1>
        </div>

        <div className="absolute bottom-3 items-center space-x-2 lg:bottom-3 lg:left-3 lg:block">
          <AppVersion />
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
            qualifying exams while assessing their knowledge through randomized
            questions.
          </p>
        </div>

        <div className="font-inter mt-12 flex flex-col items-center justify-center lg:hidden">
          <h1 className="text-center text-[20px] leading-snug font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
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
      </div>

      {/* Right Section */}
      <div className="mt-30 flex w-full items-center justify-center p-6 sm:mt-30 md:mt-30 lg:mt-0 lg:w-1/2">
        <div className="w-full max-w-xs space-y-6 sm:max-w-md">
          <div className="text-center sm:ml-10 lg:ml-0">
            <h2 className="text-xl font-bold lg:mr-15">LOG IN ACCOUNT</h2>
            <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
              <span>Welcome! Please enter your ID number and password </span>
              <span>to access your account.</span>
            </p>

            <form className="mt-6 w-full max-w-sm">
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
                  <p className="mt-2 text-center text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>

              {/* Remember Me & Links */}
              <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
                {/* Left side: Remember Me */}
                <label className="flex items-center gap-2 text-nowrap">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                {/* Right side: Forgot Password */}
                <a
                  onClick={() => navigate("/forgot-password")}
                  className="cursor-pointer text-[13px] hover:underline"
                >
                  Forgot Password
                </a>
              </div>

              {/* Login Button */}
              <div className="mx-auto flex w-[30%] items-center justify-center text-sm">
                <button
                  type="submit"
                  onClick={handleLogin}
                  disabled={isLogIn}
                  className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isLogIn ? "LOADING..." : "LOG IN"}
                </button>
              </div>

              {/* Register Link */}
              <p className="mt-4 justify-center text-center text-[14px] text-gray-600">
                Don’t have an account?{" "}
                <span
                  onClick={() => navigate("/register")}
                  className="cursor-pointer text-orange-500 hover:underline"
                >
                  Create an account
                </span>
              </p>
              <div className="mt-3 justify-center px-4 text-center text-sm text-gray-600">
                <span className="text-orange-500">Developed by Team CAPS</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
