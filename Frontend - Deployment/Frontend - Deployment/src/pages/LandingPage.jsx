import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import collegeLogo from "/src/assets/college-logo.png";
import heroImg from "/src/assets/landing/firstpic.png";
import CogIcon from "/src/assets/landing/cog.svg";
import ExportIcon from "/src/assets/landing/export.svg";
import APlusIcon from "/src/assets/landing/a+.svg";
import RightDisplay from "/src/assets/landing/rtp.png";
import GetStarted from "/src/assets/landing/getstarted.png";

function LandingPage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center pt-8">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      {/* Top Navigation */}
      {/* Logo - top-left */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 md:top-5 md:left-8 2xl:left-16">
        <img
          src={collegeLogo}
          alt="CAPS logo"
          className="h-6 w-6 md:h-8 md:w-8"
        />
        <span className="outfit-500 text-[20px] tracking-wide md:text-[24px]">
          CAPS
        </span>
      </div>

      {/* Hamburger Menu Button - visible on small screens */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-4 right-4 z-50 flex flex-col gap-1.5 p-2 md:hidden"
        aria-label="Open menu"
      >
        <span className="h-0.5 w-6 bg-gray-700 transition-all"></span>
        <span className="h-0.5 w-6 bg-gray-700 transition-all"></span>
        <span className="h-0.5 w-6 bg-gray-700 transition-all"></span>
      </button>

      {/* Nav buttons - top-right (hidden on small screens) */}
      <ul className="outfit-500 absolute top-4 right-4 z-50 hidden items-center gap-4 text-[14px] text-gray-700 md:top-5 md:right-8 md:flex md:gap-6 md:text-[16px] 2xl:right-16">
        <li>
          <a href="#feedback" className="hover:text-gray-900">
            Feedback
          </a>
        </li>
        <li>
          <a href="/team-caps" className="hover:text-gray-900">
            Developers
          </a>
        </li>
        <li>
          <a href="#contact" className="hover:text-gray-900">
            About
          </a>
        </li>
        <li>
          <a
            href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsSidebarOpen(false)}
            className="text-lg font-medium text-gray-700 hover:text-gray-900"
          >
            Help
          </a>
        </li>
      </ul>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lightbox-bg fixed inset-0 z-[103] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-[104] h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Close Button */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={collegeLogo} alt="CAPS logo" className="h-6 w-6" />
              <span className="outfit-500 text-[20px] tracking-wide">CAPS</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="relative h-8 w-8"
              aria-label="Close menu"
            >
              <span className="absolute top-1/2 left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-700"></span>
              <span className="absolute top-1/2 left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gray-700"></span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            <a
              href="#feedback"
              onClick={() => setIsSidebarOpen(false)}
              className="text-lg font-medium text-gray-700 hover:text-gray-900"
            >
              Feedback
            </a>
            <a
              href="/team-caps"
              onClick={() => setIsSidebarOpen(false)}
              className="text-lg font-medium text-gray-700 hover:text-gray-900"
            >
              Developers
            </a>
            <a
              href="#contact"
              onClick={() => setIsSidebarOpen(false)}
              className="text-lg font-medium text-gray-700 hover:text-gray-900"
            >
              About
            </a>
            <a
              href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsSidebarOpen(false)}
              className="text-lg font-medium text-gray-700 hover:text-gray-900"
            >
              Help
            </a>
          </nav>
        </div>
      </div>

      <div className="relative isolate h-[570px] w-full max-w-[1450px] overflow-hidden rounded-[50px]">
        <div className="absolute -bottom-[30%] -left-[5%] h-[350px] w-[400px] rounded-full bg-[rgba(255,153,0,0.5)] blur-[150px]" />
        <div className="absolute -bottom-[-5%] -left-[-80%] h-[250px] w-[300px] rounded-full bg-[rgba(255,153,0,0.5)] blur-[150px]" />

        <div className="outfit finisher-header z-100 min-h-screen text-gray-900">
          {/* Hero */}
          <header className="header outfit-700 z-10 mx-auto mt-10 grid h-[500px] w-full max-w-280 grid-cols-1 items-start gap-50 pt-2 pb-16 sm:grid-cols-2">
            {/* Text content on the left */}
            <div className="mb-20 max-w-xl self-center text-center sm:text-left">
              <h1 className="text-4xl leading-12 sm:text-5xl">
                CREATE,
                <br />
                ANSWER OR
                <br />
                STUDY FOR EXAMS
              </h1>
              <p className="outfit-400 mx-auto mt-4 max-w-md text-[14px] text-gray-600 sm:mx-0 sm:text-base">
                A collaborative platform to help students effectively learn,
                prepare, and excel.
              </p>
              <div className="relative mt-8 flex items-center justify-center gap-3 sm:justify-start">
                {/* LOG IN Button */}
                <button
                  onClick={() => navigate("/")}
                  className="relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-orange-600 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-log-in-icon lucide-log-in"
                  >
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  </svg>
                  LOG IN
                </button>

                {/* CREATE ACCOUNT Button */}
                <button
                  onClick={() => navigate("/register")}
                  className="flex cursor-pointer items-center gap-2 rounded-full border px-6 py-2.5 text-[14px] font-medium text-gray-800 transition-all duration-150 hover:bg-gray-100 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user-round-icon"
                  >
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  CREATE AN ACCOUNT
                </button>
              </div>
            </div>

            {/* Image on the right */}
            <div className="relative mx-auto hidden w-full self-start lg:block">
              <div className="mt-10 size-140 -translate-x-20">
                <img
                  src={heroImg}
                  alt="Illustration"
                  className="size-225 object-contain"
                />
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Comprehensive Assessment and Preparation System Section */}
      <div className="z-101 w-full max-w-[1550px] rounded-[35px] bg-white px-30 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Title Section - Left */}
          <div className="flex-1">
            <h2 className="outfit-500 text-3xl leading-tight font-semibold md:text-[45px]">
              <span className="text-gray-800">Comprehensive Assessment</span>
              <br />
              <span className="text-gray-800"> and Preparation System</span>
            </h2>
          </div>

          {/* Description Section - Right */}
          <div className="flex-1 md:max-w-md">
            <p className="outfit-400 text-base text-gray-700 md:text-lg">
              An innovative web-based examination system proudly developed and
              powered by the JRMSU College of Engineering.
            </p>
          </div>
        </div>

        {/* Horizontal Line Separator */}
        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent from-5% via-gray-300 via-50% to-transparent to-95%"></div>

        {/* System Features Section */}
        <div className="mt-12 text-center">
          {/* System Features Callout */}
          <div className="mb-4">
            <span className="outfit-500 text-lg text-orange-500">
              [ System Features ]
            </span>
          </div>

          {/* Main Heading */}
          <h3 className="outfit-700 mt-12 text-3xl text-black md:text-4xl">
            Discover the key features
          </h3>

          {/* Descriptive Paragraph */}
          <p className="outfit-400 mx-auto mt-8 max-w-2xl text-gray-700 md:text-lg">
            Experience the power of smart technology through a reliable and
            high-performing platform engineered to help students practice
            effectively, analyze their progress, and continuously improve their
            exam readiness.
          </p>
        </div>

        <div className="outfit-400 mb-16 px-10">
          {/* Feature Cards Section */}
          <div className="mt-26 grid grid-cols-1 gap-20 md:grid-cols-3">
            {/* Exam Creation Feature */}
            <div className="flex flex-col items-start">
              <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-newspaper-icon lucide-newspaper"
                >
                  <path d="M15 18h-5" />
                  <path d="M18 14h-8" />
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                  <rect width="8" height="4" x="10" y="6" rx="1" />
                </svg>
              </div>
              <h4 className="outfit-700 mb-2 text-xl font-bold text-black">
                Quiz Creation
              </h4>
              <p className="text-base text-gray-700">
                Easily create quizzes or exams, share knowledge, and empower
                students to excel in every exam.
              </p>
            </div>

            {/* Answer Questions Feature */}
            <div className="flex flex-col items-start">
              <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-file-pen-line-icon lucide-file-pen-line"
                >
                  <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />
                  <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
                  <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
                  <path d="M8 18h1" />
                </svg>
              </div>
              <h4 className="outfit-700 mb-2 text-xl font-bold text-black">
                Answer Questions
              </h4>
              <p className="text-base text-gray-700">
                Test your knowledge by answering quizzes and track your progress
                instantly.
              </p>
            </div>

            {/* Qualifying Exam Feature */}
            <div className="flex flex-col items-start">
              <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                <img
                  src={APlusIcon}
                  alt="Settings"
                  className="h-[34px] w-[34px] object-contain"
                />
              </div>
              <h4 className="outfit-700 mb-2 text-xl font-bold text-black">
                Qualifying Exam
              </h4>
              <p className="text-base text-gray-700">
                Prepare for your qualifying exams with quizzes covering key
                topics to build confidence and mastery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ready-to-Print Exams Section */}
      <div className="z-100 -mt-10 w-full max-w-[1550px] bg-gradient-to-b from-orange-200/28 via-orange-100/50 via-70% to-white to-100% px-6 py-32">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="mt-2 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Section */}
            <div className="flex flex-col gap-8">
              {/* Main Heading */}
              <h2 className="outfit-500 mb-6 text-4xl leading-tight text-black md:text-5xl">
                Create <span className="text-orange-500">Ready-to-Print</span>{" "}
                Quiz PDFs in One Click
              </h2>

              {/* Flexible Exam Creation Feature */}
              <div className="mb-4 flex gap-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)]">
                  <img
                    src={CogIcon}
                    alt="Settings"
                    className="h-[34px] w-[34px] object-contain"
                  />
                </div>
                <div>
                  <h3 className="outfit-700 mb-2 text-xl text-black">
                    Flexible exam and quiz creation
                  </h3>
                  <p className="outfit-400 text-base text-black">
                    Everything you need to build and customize your worksheets
                    easily
                  </p>
                </div>
              </div>

              {/* Quick Export Feature */}
              <div className="flex gap-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)]">
                  <img
                    src={ExportIcon}
                    alt="Settings"
                    className="h-[32px] w-[32px] object-contain"
                  />
                </div>
                <div>
                  <h3 className="outfit-700 mb-2 text-xl font-bold text-black">
                    Quick Export
                  </h3>
                  <p className="outfit-400 text-base text-black">
                    Easily create your exam or quizzes and get a fully
                    formatted, print-ready version with just one click.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Ready-to-Print Preview */}
            <div className="relative flex items-center justify-center">
              <img
                src={RightDisplay}
                alt="Ready-to-print exam preview"
                className="-mb-20 ml-18 w-full max-w-[650px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Call-to-Action Section */}
      <div className="z-101 -mt-38 w-full max-w-[1450px] px-6 pb-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="relative">
            <img
              src={GetStarted}
              alt="Get started with CAPS"
              className="w-full"
            />

            <div className="absolute inset-0 flex items-center justify-end px-10 md:px-16">
              <div className="max-w-xl text-left text-white">
                <h3 className="outfit-700 text-2xl leading-snug md:text-3xl lg:text-4xl">
                  Ready? Start with{" "}
                  <span className="text-[rgb(124,75,0)]">CAPS</span>
                  <br />
                  and Enjoy an{" "}
                  <span className="text-[rgb(124,75,0)]">
                    Amazing Experience
                  </span>
                </h3>
                <p className="outfit-400 mt-3 text-xs text-white/90 md:text-sm lg:text-base">
                  Start your journey with CAPS and experience a smarter, faster,
                  and more organized way to handle exams from creation to
                  printing.
                </p>
                <div className="mt-6 flex justify-start">
                  <button
                    onClick={() => navigate("/register")}
                    className="flex cursor-pointer items-center gap-2 rounded-full bg-[rgb(255,246,0)] px-6 py-3 text-sm text-[14px] font-semibold text-black shadow-md transition hover:bg-yellow-300 active:scale-95"
                  >
                    <span className="outfit-500">Get Started</span>
                    <i className="bx bx-arrow-right-stroke flex items-center justify-center text-[16px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More Features Teaser Section */}
      <section className="w-full max-w-[1450px] px-6 pb-16">
        <div className="mx-auto w-full max-w-[900px] text-center">
          <h2 className="outfit-700 text-3xl text-black md:text-4xl lg:text-5xl">
            More Features to come!
          </h2>
          <p className="outfit-400 mt-4 text-sm text-gray-600 md:text-base">
            Looks like you've reached the bottom. Time to head back up!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1450px] flex-col gap-6 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-start md:justify-between">
          {/* Brand + Description */}
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              <img src={collegeLogo} alt="CAPS logo" className="h-6 w-6" />
              <span className="outfit-700 text-base text-gray-900">CAPS</span>
            </div>
            <p className="outfit-400 max-w-sm text-xs md:text-sm">
              Comprehensive Assessment and Preparation System designed to help
              students and educators create, manage, and analyze exams with
              ease.
            </p>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
            <div>
              <h4 className="outfit-700 mb-2 text-xs tracking-wide text-gray-700 uppercase">
                Product
              </h4>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>
                  <a
                    href="#features"
                    className="outfit-400 hover:text-gray-800"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsSidebarOpen(false)}
                    className="outfit-400 hover:text-gray-800"
                  >
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="outfit-700 outfit-400 mb-2 text-xs tracking-wide text-gray-700 uppercase">
                About
              </h4>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>
                  <a
                    href="/team-caps"
                    className="outfit-400 hover:text-gray-800"
                  >
                    Developers
                  </a>
                </li>
                <li>
                  <a href="#contact" className="outfit-400 hover:text-gray-800">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="outfit-700 mb-2 text-xs tracking-wide text-gray-700 uppercase">
                Feedback
              </h4>
              <ul className="outfit-400 space-y-1 text-xs md:text-sm">
                <li>
                  <a href="#feedback" className="hover:text-gray-800">
                    Share Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="mx-auto flex w-full max-w-[1450px] flex-col items-center justify-between gap-2 px-6 py-4 text-[11px] text-gray-400 md:flex-row">
            <p className="outfit-400">
              © 2025 CAPS – Comprehensive Assessment and Preparation System.
            </p>
            <p className="outfit-400">
              Powered by JRMSU College of Engineering
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
