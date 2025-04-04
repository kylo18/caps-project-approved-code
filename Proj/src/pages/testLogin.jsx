import { useState } from "react";
import LoginBG from "/src/assets/Login-bg.png";
import univLogo from "../assets/univLogo.png"; 
import collegeLogo from "/src/assets/college-logo.png";

const Login = () => {
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div
      className="font-inter flex flex-col sm:flex-row h-screen items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      {/* Logos (Top Left) */}
      <div className="absolute top-5 left-5 flex items-center">
        <img src={univLogo} alt="Logo 1" className="h-12 w-12 mr-3" />
        <img src={collegeLogo} alt="Logo 2" className="h-12 w-12" />
        <p className="text-white ml-7">JOSE RIZAL MEMORIAL STATE UNIVERSITY</p>
      </div>

      {/* Left Side (Title + Description at Bottom) */}
      <div className="w-1/2 flex flex-col items-center justify-between h-full px-12 py-16">
        <div className="flex flex-col items-start mt-18 mr-22">
          <h1 className="text-[32px] font-bold text-white tracking-wider">
            <span className="text-[40px] text-orange-500">C</span>OMPREHENSIVE
            <br />
            <span className="text-[40px] text-orange-500">A</span>SSESSMENT AND
            <br />
            <span className="text-[40px] text-orange-500">P</span>REPARATION
            <br />
            <span className="text-[40px] text-orange-500">S</span>YSTEM
          </h1>
        </div>

        {/* Description (Moved to Bottom Left) */}
        <p className="text-center text-gray-500 text-sm max-w-md mr-19">
          A platform designed to help students practice and prepare for
          qualifying exams while assessing their knowledge through randomized
          questions.
        </p>
      </div>

      {/* Right Side (Login Form) */}
      <div className="w-1/2 flex flex-col items-center px-12">
        <h2 className="text-2xl font-bold">LOG IN ACCOUNT</h2>
        <p className="text-gray-500 text-sm mt-2">
          Log into your account to continue, or Register if you don’t have one.
        </p>

        {/* Form */}
        <div className="mt-6 w-full max-w-sm">
          {/* ID Number Input */}
          <div className="relative mb-4">
            <i className="bx bx-user absolute left-3 top-3 text-gray-500"></i>
            <input
              type="text"
              placeholder="Enter ID Number"
              className="w-full px-10 py-2 border-b border-gray-400 focus:outline-none"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-4">
            <i className="bx bx-key absolute left-3 top-3 text-gray-500"></i>
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full px-10 py-2 border-b border-gray-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Remember Me & Links */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            <div>
              <a href="#" className="hover:underline">
                Change Password
              </a>{" "}
              |{" "}
              <a href="#" className="hover:underline">
                Forgot Password
              </a>
            </div>
          </div>

          {/* Login Button */}
          <button className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
            LOG-IN
          </button>

          {/* Register Link */}
          <p className="mt-4 text-sm text-gray-600">
            Don’t have an account?{" "}
            <a href="#" className="text-orange-500 hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
