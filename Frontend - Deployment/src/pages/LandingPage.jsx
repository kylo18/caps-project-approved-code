import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import collegeLogo from "/src/assets/college-logo.png";
import heroImg from "/src/assets/landing/firstpic.png";

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
      <ul className="absolute top-4 right-4 z-50 hidden items-center gap-4 text-[14px] text-gray-700 md:top-5 md:right-8 md:flex md:gap-6 md:text-[16px] 2xl:right-16">
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
          <a href="/help" className="hover:text-gray-900">
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
              href="/help"
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
          <header className="header outfit-500 z-10 mx-auto mt-10 grid h-[500px] w-full max-w-280 grid-cols-1 items-start gap-50 pt-2 pb-16 sm:grid-cols-2">
            {/* Text content on the left */}
            <div className="mb-20 max-w-xl self-center text-center sm:text-left">
              <h1 className="text-4xl leading-12 sm:text-5xl">
                PRACTICE
                <br />
                PROBLEMS OR
                <br />
                CREATE EXAMS
              </h1>
              <p className="outfit-400 mx-auto mt-4 max-w-md text-[14px] text-gray-600 sm:mx-0 sm:text-base">
                A collaborative platform to help students effectively learn,
                prepare, and excel.
              </p>
              <div className="relative mt-8 flex items-center justify-center gap-3 sm:justify-start">
                {/* LOG IN Button */}
                <button
                  onClick={() => navigate("/")}
                  className="relative z-10 inline-flex cursor-pointer items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-orange-600 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
                >
                  LOG IN
                </button>

                {/* CREATE ACCOUNT Button */}
                <button
                  onClick={() => navigate("/register")}
                  className="flex cursor-pointer items-center gap-2 rounded-full border px-6 py-2.5 text-[14px] font-medium text-gray-800 transition-all duration-150 hover:bg-gray-100 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
      <div className="z-101 w-full max-w-[1550px] rounded-[35px] bg-white px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Title Section - Left */}
          <div className="flex-1">
            <h2 className="text-4xl leading-tight font-semibold md:text-5xl">
              <span className="text-gray-800">Comprehensive Assessment</span>
              <span className="text-gray-500"> and Preparation System</span>
            </h2>
          </div>

          {/* Description Section - Right */}
          <div className="flex-1 md:max-w-md">
            <p className="text-base text-gray-700 md:text-lg">
              An innovative web-based examination system proudly developed and
              powered by the JRMSU College of Engineering.
            </p>
          </div>
        </div>

        {/* Horizontal Line Separator */}
        <div className="mt-8 border-t border-gray-300"></div>

        {/* System Features Section */}
        <div className="mt-12 text-center">
          {/* System Features Callout */}
          <div className="mb-4">
            <span className="text-lg font-medium text-orange-500">
              [ System Features ]
            </span>
          </div>

          {/* Main Heading */}
          <h3 className="mb-4 text-3xl font-bold text-black md:text-4xl">
            Discover the key features
          </h3>

          {/* Descriptive Paragraph */}
          <p className="mx-auto max-w-3xl text-base text-gray-700 md:text-lg">
            Experience the power of smart technology through a reliable and
            high-performing platform engineered to help students practice
            effectively, analyze their progress, and continuously improve their
            exam readiness.
          </p>
        </div>

        {/* Feature Cards Section */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Exam Creation Feature */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-gray-300 bg-white">
              <svg
                className="h-8 w-8 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-xl font-bold text-black">Exam Creation</h4>
            <p className="text-base text-gray-700">
              Easily create exams, share knowledge, and empower students to
              excel in every exam.
            </p>
          </div>

          {/* Answer Questions Feature */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-gray-300 bg-white">
              <svg
                className="h-8 w-8 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-xl font-bold text-black">
              Answer Questions
            </h4>
            <p className="text-base text-gray-700">
              Easily create exams, share knowledge, and empower students to
              excel in every exam.
            </p>
          </div>

          {/* Qualifying Exam Feature */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-gray-300 bg-white">
              <svg
                className="h-8 w-8 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-xl font-bold text-black">
              Qualifying Exam
            </h4>
            <p className="text-base text-gray-700">
              Easily create exams, share knowledge, and empower students to
              excel in every exam.
            </p>
          </div>
        </div>
      </div>

      {/* Create Ready-to-Print Exams Section */}
      <div className="z-100 -mt-10 h-[800px] w-full max-w-[1550px] bg-gradient-to-b from-orange-200/28 via-orange-100/50 to-white px-6 py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Section */}
            <div className="flex flex-col gap-8">
              {/* Main Heading */}
              <h2 className="text-4xl leading-tight font-bold text-black md:text-5xl">
                Create <span className="text-orange-500">Ready-to-Print</span>{" "}
                Exams in One Click
              </h2>

              {/* Flexible Exam Creation Feature */}
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-white">
                  <svg
                    className="h-8 w-8 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-black">
                    Flexible exam creation
                  </h3>
                  <p className="text-base text-black">
                    Everything you need to build and customize your exams easily
                  </p>
                </div>
              </div>

              {/* Quick Export Feature */}
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-white">
                  <svg
                    className="h-8 w-8 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-black">
                    Quick Export
                  </h3>
                  <p className="text-base text-black">
                    Easily create your exam and get a fully formatted,
                    print-ready version with just one click.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Three Step Process */}
            <div className="relative">
              {/* Orange Gradient Background Container */}
              <div className="relative rounded-3xl bg-gradient-to-b from-orange-200 to-orange-400 p-8 md:p-12">
                {/* Step 1 */}
                <div className="relative mb-6 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-orange-500 bg-white">
                    <svg
                      className="h-7 w-7 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm text-black">1st step</p>
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-black">
                        Create Exam
                      </h4>
                      <div className="h-6 w-px bg-gray-400"></div>
                      <p className="text-sm text-black">Fully Customizable</p>
                    </div>
                  </div>
                </div>

                {/* Curved Arrow from Step 1 to Step 2 */}
                <div className="absolute top-20 left-12 h-16 w-16">
                  <svg
                    className="h-full w-full text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M 80 20 Q 50 50 20 80"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 15 75 L 20 80 L 25 75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="relative mb-6 rounded-xl border-2 border-orange-500 bg-white p-4">
                  <p className="mb-2 text-sm text-black">2nd Step</p>
                  <h4 className="text-xl font-bold text-black">
                    Modify exam settings to fit your desired style
                  </h4>
                </div>

                {/* Curved Arrow from Step 2 to Step 3 */}
                <div className="absolute top-64 left-12 h-16 w-16">
                  <svg
                    className="h-full w-full text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M 80 20 Q 50 50 20 80"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 15 75 L 20 80 L 25 75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4 rounded-xl border-2 border-orange-500 bg-white p-4">
                  <div className="flex-1">
                    <p className="mb-2 text-sm text-black">3rd Step</p>
                    <h4 className="text-xl font-bold text-black">
                      Export your exam
                    </h4>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-orange-500 bg-white">
                    <svg
                      className="h-7 w-7 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>

                {/* Decorative Curved Arrow from Step 3 */}
                <div className="absolute right-12 bottom-8 h-20 w-20">
                  <svg
                    className="h-full w-full text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M 20 80 Q 40 60 60 40 Q 80 20 90 10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 85 8 L 90 10 L 88 15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
