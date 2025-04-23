import { useState } from "react";
import univLogo from "../assets/univLogo.png"; 
import collegeLogo from "/src/assets/college-logo.png";
import { FaUser, FaKey } from "react-icons/fa";

export default function LoginPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full  
        sm:bg-[url('/src/assets/login-bg-md.png')] 
        lg:bg-[url('/src/assets/login-bg.png')]
        bg-[url('/src/assets/login-bg-xs.png')] bg-cover bg-center bg-no-repeat">
    {/* Left Section */}
    <div className="w-full lg:w-1/2  text-white flex flex-col items-center justify-center p-6">
      {/* Logos */}
      <div className="absolute top-3 left-3 flex items-center space-x-2">
        <img src={univLogo} alt="Logo 1" className="size-8" />
        <img src={collegeLogo} alt="Logo 2" className="size-8" />
        <h1 className="text-sm lg:text-lg">JOSE RIZAL MEMORIAL STATE UNIVERSITY</h1>
      </div>

      {/* Title */}
      <div className="lg:flex hidden flex-col justify-center items-center mt-20">
        <h1 className="text-3xl lg:text-4xl font-bold leading-snug">
          <span className="text-orange-500 text-5xl">C</span>OMPREHENSIVE<br />
          <span className="text-orange-500 text-5xl">A</span>SSESSMENT AND<br />
          <span className="text-orange-500 text-5xl">P</span>REPARATION<br />
          <span className="text-orange-500 text-5xl">S</span>YSTEM
        </h1>
        <p className="hidden lg:block text-sm  text-gray-400 max-w-xs text-center mt-20">
          A platform designed to help students practice and prepare for qualifying exams while assessing their knowledge through randomized questions.
        </p>
      </div>

      <div className="lg:hidden flex-col justify-center items-center mt-20 ">
        <h1 className="text-white font-bold text-[22px] sm:text-[30px] leading-snug tracking-wide">
          <span>
            <span className="text-orange-500 text-3xl ">C</span>OMPREHENSIVE 
          </span>
          <span>
            <span className="text-orange-500 text-3xl "> A</span>SSESSMENT
          </span>
          <br />
          <span>
            AND
          </span>
          <span>
            <span className="text-orange-500 text-3xl"> P</span>REPARATION
          </span>
          <span>
            <span className="text-orange-500 text-3xl"> S</span>YSTEM
          </span>
        </h1>
      </div>
    </div>

    {/* Right Section */}
    <div className="w-full lg:w-1/2  flex items-center justify-center p-6 mt-40">
      <div className="w-full max-w-xs md:max-w-md space-y-6">
        <div className="text-center">
        <h2 className="text-xl font-bold">LOG IN ACCOUNT</h2>
        <p className="text-gray-500 text-sm mt-2 justify-center text-center">
          <span>
            Welcome! Please enter your ID number and password
          </span>
          <br />
          <span>
            to access your account.
          </span>
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
          <div className="flex items-center w-1/3 justify-center mx-auto">
            <button type="submit"
              onClick={handleLogin}
              className="mt-2 w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
              LOG-IN
            </button>
          </div>
          
          {/* Register Link */}
          <p className="mt-4 text-[14px] text-gray-600 justify-center text-center">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")} className="text-orange-500 hover:underline">
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

        <form className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter ID Number"
              className="w-full border-b border-gray-400 py-2 pl-10 focus:outline-none focus:border-orange-500"
            />
            <FaUser className="absolute left-2 top-3 text-orange-500" />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full border-b border-gray-400 py-2 pl-10 focus:outline-none focus:border-orange-500"
            />
            <FaKey className="absolute left-2 top-3 text-orange-500" />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> Remember me
            </label>
            <div className="flex space-x-4">
              <a href="#" className="hover:underline">Change Password</a>
              <span>|</span>
              <a href="#" className="hover:underline">Forgot Password</a>
            </div>
          </div>
          <button className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
            LOG-IN
          </button>
          <p className="text-center text-sm text-gray-600">
            Don’t have an account? <a href="#" className="text-orange-500 hover:underline">Register here</a>
          </p>
        </form>
      </div>
    </div>
  </div>

  );
}