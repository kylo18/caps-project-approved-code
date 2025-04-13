import { useState } from "react";
import LoginBG from "/src/assets/login-bg.png";
import LoginBGSM from "/src/assets/login-bg-sm.png"; 
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
    setError("");
    setIsLogIn(true)
  
    if (!idCode.trim() || !password.trim()) {
      setError("Please enter both ID Code and Password.");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          userCode: idCode,
          password: password
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || "Login failed.");
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
          navigate("/Instructor");
          break;
        case 3:
          navigate("/Program Chair");
          break;
        case 4:
          navigate("/Dean");
          break;
        default:
          setError("Invalid user role.");
          break;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLogIn(false)
    }
  };

  return (
    <div
      className="sm:bg-[url('/src/assets/login-bg-md.png')] lg:bg-[url('/src/assets/login-bg.png')] bg-[url('/src/assets/login-bg-xs.png')] lg:flex-row  flex-col h-full w-full min-h-screen flex items-center justify-center bg-cover bg-center"
    >
      {/* Logos (Top Left) */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <img src={univLogo} alt="Logo 1" className="size-8" />
        <img src={collegeLogo} alt="Logo 2" className="size-8" />
        <p className="text-white text-center text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY
        </p>
      </div>

      {/* Left Side (Title + Description at Bottom) */}
      <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 pt-12">
        {/* Horizontal Title for <lg */}
        <div className="lg:hidden text-center -mt-37 sm:-mt-50 md:-mt-54 min-w-[833px]:-mt-70">
          <h1 className="text-white font-bold text-[22px] sm:text-[30px] leading-snug tracking-wide">
            COMPREHENSIVE ASSESSMENT
            <br />
            AND PREPARATION SYSTEM
          </h1>
        </div>


        {/* Stacked Title for lg and above */}
        <div className="hidden lg:flex flex-col items-start mt-20 lg:mt-0">
          <h1 className="xl:mr-40 text-4xl mt-25 font-bold text-white tracking-wide leading-snug">
            <span>
              <span className="text-orange-500 text-5xl ">C</span>OMPREHENSIVE
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl ">A</span>SSESSMENT &
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl">P</span>REPARATION
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl">S</span>YSTEM
            </span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-center xl:mr-40 text-gray-400 text-sm md:text-base max-w-md mt-25 hidden lg:block">
          A platform designed to help students practice and prepare for qualifying exams while assessing their knowledge through randomized questions.
        </p>
      </div>

      {/* Right Side (Login Form) */}
      <div className="w-[85%] flex flex-col items-center mt-15 justify-center lg:px-4 lg:w-full lg:max-w-md lg:mr-30">
        <h2 className="text-xl font-bold">LOG IN ACCOUNT</h2>
        <p className="text-gray-500 text-sm mt-2 justify-center text-center">
          Welcome back! Please enter your ID number and password to access your account.
        </p>

        {/* Form */}
        <div className="mt-6 w-full max-w-sm">
          {/* ID Number Input */}
          <div className="relative mb-4">
            <i className="bx bx-user absolute left-3 top-3 text-gray-500 text-[18px]"></i>
            <input
              type="text"
              placeholder="Enter ID Number"
              className="open-sans px-10 w-full border-0 hover:border-b border-b border-[rgb(168,168,168) py-2 w-full rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
              value={idCode}
              onChange={(e) => setIdCode(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-4">
            <div className="relative flex items-center overflow-hidden">
              <i className="bx bx-key absolute left-3 top-3 text-gray-500 text-[18px]"></i>
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter Password"
                className="open-sans px-10 w-full border-0 hover:border-b border-b border-[rgb(168,168,168) py-2 w-full rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="p-2 right-2 top-2 flex items-center cursor-pointer border-b border-[rgb(168,168,168) " onClick={() => setPasswordVisible(!passwordVisible)}>
                <i className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[24px] text-orange-500`}></i>
              </div>
            </div>
          </div>

          {/* Remember Me & Links */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4 text-nowrap">
            <label className="flex items-center text-[13px]">
              <input
                type="checkbox"
                className="mr-2 cursor-pointer "
                style={{ accentColor: "orange" }}
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <div>
              <a href="#" className="hover:underline text-[13px]">
                Change Password
              </a>{" "}
              |{" "}
              <a href="#" className="hover:underline text-[13px]">
                Forgot Password
              </a>
            </div>
          </div>

          {/* Login Button */}
          <div className="flex items-center w-1/2 justify-center mx-auto">
            <button type="submit"
              onClick={handleLogin}
              className="mt-2 w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
              LOG-IN
            </button>
          </div>
          

          {/* Register Link */}
          <p className="mt-4 text-[14px] text-gray-600 justify-center text-center">
            Don’t have an account?{" "}
            <a href="#" className="text-orange-500 hover:underline">
              Register here
            </a>
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