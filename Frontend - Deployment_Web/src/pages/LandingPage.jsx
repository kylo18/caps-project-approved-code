import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collegeLogo from "/src/assets/college-logo.png";
import heroImg from "/src/assets/landing/firstpic.png";
import MobileheroImg from "/src/assets/landing/secondpic.png";
import CogIcon from "/src/assets/landing/cog.svg";
import ExportIcon from "/src/assets/landing/export.svg";
import APlusIcon from "/src/assets/landing/a+.svg";
import RightDisplay from "/src/assets/landing/rtp.png";
import GetStarted from "/src/assets/landing/getstarted.png";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import AppVersion from "../components/appVersion";
import DownloadModal from "../components/DownloadModal";

import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
} from "../pwaDeferredInstall.js";

function LandingPage() {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(() => {
    // Auto-open if the URL contains a reset token (redirected from email link)
    const params = new URLSearchParams(window.location.search);
    return !!params.get("token");
  });
  const [secureContext, setSecureContext] = useState(
    () => typeof window !== "undefined" && window.isSecureContext,
  );
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(() =>
    typeof window !== "undefined" ? !!getDeferredInstallPrompt() : false,
  );

  useEffect(() => {
    setSecureContext(window.isSecureContext);
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      setShowInstallButton(window.isSecureContext && !standalone);
    };
    updateVisibility();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", updateVisibility);
    return () => mq.removeEventListener("change", updateVisibility);
  }, []);

  useEffect(() => {
    const sync = () => setHasDeferredPrompt(!!getDeferredInstallPrompt());
    window.addEventListener("pwa-deferred-ready", sync);
    sync();
    return () => window.removeEventListener("pwa-deferred-ready", sync);
  }, []);

  const handleInstallApp = async () => {
    let prompt = getDeferredInstallPrompt();
    if (!prompt && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      const reloaded = sessionStorage.getItem("pwa-install-reloaded");
      if (reg && !navigator.serviceWorker.controller && !reloaded) {
        sessionStorage.setItem("pwa-install-reloaded", "1");
        window.location.reload();
        return;
      }
      prompt = getDeferredInstallPrompt();
    }
    if (prompt) {
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } finally {
        clearDeferredInstallPrompt();
        setHasDeferredPrompt(false);
      }
      return;
    }
    window.alert(
      "Chrome hasn’t fired the install prompt yet.\n\n" +
        "Try: ⋮ menu → Save and share → Install CAPS JRMSU (or Install page).\n\n" +
        "If that’s missing: DevTools → Application → Manifest (fix any errors), " +
        "then hard refresh (Ctrl+Shift+R). Use Chrome or Edge on HTTPS.",
    );
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-white pt-8">
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
            <a
              //onClick={() => alert("Application is coming soon")}
              onClick={() => setIsDownloadOpen(true)}
              className="cursor-pointer hover:text-gray-900"
            >
              Download
            </a>
          </li>
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
            <a
              href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsSidebarOpen(false)}
              className="hover:text-gray-900"
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
                <span className="outfit-500 text-[20px] tracking-wide">
                  CAPS
                </span>
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
                onClick={() => {
                  //alert("Application is coming soon");
                  setIsDownloadOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="cusror-pointer text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Download
              </a>
              <a
                href="#feedback"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Feedback
              </a>
              <a
                href="/team-caps"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Developers
              </a>

              <a
                href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Help
              </a>
            </nav>
          </div>
        </div>

        <div className="relative isolate w-full max-w-[1450px] rounded-[50px]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[50px]">
            <div className="absolute -bottom-[30%] -left-[5%] h-[350px] w-[400px] rounded-full bg-[rgba(255,153,0,0.5)] blur-[150px]" />
            <div className="absolute -bottom-[-5%] -left-[-80%] h-[250px] w-[300px] rounded-full bg-[rgba(255,153,0,0.5)] blur-[150px]" />
          </div>

          <div className="outfit finisher-header relative z-10 text-gray-900">
            {/* Hero */}
            <header className="header outfit-700 z-10 mx-auto mt-8 grid h-[610px] w-full grid-cols-1 items-center gap-10 py-10 md:-mt-10 md:h-[450px] md:max-w-220 md:grid-cols-2 md:px-10 md:py-0 lg:mt-10 lg:h-[450px] lg:max-w-220 lg:gap-30 lg:px-0 xl:h-[500px] xl:max-w-280 xl:gap-50">
              {/* Text content on the left */}
              <div className="mx-auto max-w-xl text-center md:mx-0 md:mt-15 md:text-left lg:-mt-10">
                <h1 className="text-[34px] leading-9 md:mt-10 md:text-[30px] md:leading-8 lg:mt-0 lg:text-[40px] lg:leading-12 xl:text-5xl">
                  CREATE,
                  <br />
                  ANSWER OR
                  <br />
                  STUDY FOR EXAMS
                </h1>
                <p className="outfit-400 mx-auto mt-4 max-w-md text-[14px] text-gray-600 md:mx-0 md:text-[13px] lg:text-[14px]">
                  A collaborative platform to help students effectively <br />{" "}
                  learn, prepare, and excel.
                </p>
                <div className="relative mt-4 flex flex-wrap items-center justify-center gap-3 md:mt-6 md:justify-start lg:mt-8">
                  {/* LOG IN Button */}
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-[12px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-orange-600 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-log-in-icon lucide-log-in"
                    >
                      <path d="m10 17 5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    </svg>
                    LOG IN
                  </button>

                  {/* CREATE ACCOUNT Button */}
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-full border px-6 py-2.5 text-[12px] font-medium text-gray-800 transition-all duration-150 hover:shadow-md focus:outline-none active:scale-95 active:shadow-sm"
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
                    SIGN UP
                  </button>
                </div>
              </div>

              {/* Image on the right */}
              <div className="relative mx-auto -mb-77 flex w-full justify-center md:block md:self-start">
                <div className="flex w-full justify-center md:-mt-10 md:block md:size-90 lg:-mt-10 lg:size-120 lg:-translate-x-15 xl:mt-5 xl:size-140 xl:-translate-x-20">
                  <img
                    src={heroImg}
                    alt="Illustration"
                    className="hidden w-[400px] object-contain sm:w-[400px] md:block md:size-225 md:w-auto"
                  />
                  <img
                    src={MobileheroImg}
                    alt="Illustration"
                    className="w-[400px] object-contain sm:w-[400px] md:hidden md:size-225 md:w-auto"
                  />
                </div>
              </div>
            </header>
          </div>
        </div>

        {/* Comprehensive Assessment and Preparation System Section */}
        <div className="z-101 w-full rounded-b-[35px] bg-white px-6 py-12 md:px-12 lg:max-w-[1650px] lg:px-16 xl:max-w-[1550px] xl:px-30">
          <div className="flex flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
            {/* Title Section - Left */}
            <div className="flex-1">
              <h2 className="outfit-500 text-[24px] leading-tight font-semibold md:text-[25px] lg:text-[33px] xl:text-[45px]">
                <span className="text-gray-800">Comprehensive Assessment</span>
                <br />
                <span className="text-gray-800"> and Preparation System</span>
              </h2>
            </div>

            {/* Description Section - Right */}
            <div className="flex-1 xl:max-w-md">
              <p className="outfit-400 mx-auto max-w-sm text-[14px] text-gray-700 md:mx-0 md:max-w-none lg:text-[16px] xl:text-[18px]">
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
              <span className="outfit-500 text-orange-500 md:text-[18px] lg:text-lg">
                [ System Features ]
              </span>
            </div>

            {/* Main Heading */}
            <h3 className="outfit-700 mt-8 text-black md:mt-12 md:text-4xl lg:text-[24px] xl:text-3xl">
              Discover the key features
            </h3>

            {/* Descriptive Paragraph */}
            <p className="outfit-400 mx-auto mt-8 max-w-2xl text-[14px] text-gray-700 lg:text-[16px] xl:text-lg">
              Experience the power of smart technology through a reliable and
              high-performing platform engineered to help students practice
              effectively, analyze their progress, and continuously improve
              their exam readiness.
            </p>
          </div>

          <div className="outfit-400 mb-16 px-8">
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
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Quiz Creation
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
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
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Answer Questions
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
                  Test your knowledge by answering quizzes and track your
                  progress instantly.
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
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Qualifying Exam
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
                  Prepare for your qualifying exams with quizzes covering key
                  topics to build confidence and mastery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Ready-to-Print Exams Section */}
        <div className="z-100 -mt-10 w-full max-w-[1550px] bg-gradient-to-b from-orange-200/28 via-orange-100/50 via-70% to-white to-100% py-15 md:px-12 lg:px-12 xl:px-6">
          <div className="mx-auto mt-4 w-full max-w-[1200px] px-6 md:mt-10 lg:-mt-10">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              {/* Left Section */}
              <div className="flex flex-col gap-6 text-center lg:text-left">
                {/* Main Heading */}
                <h2 className="outfit-500 mb-6 text-[28px] leading-tight text-black lg:text-[30px] xl:text-4xl">
                  Create <span className="text-orange-500">Ready-to-Print</span>{" "}
                  Quiz PDFs in One Click
                </h2>

                {/* Flexible Exam Creation Feature */}
                <div className="mb-4 flex items-start gap-6 text-left">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)] lg:size-14 xl:size-16">
                    <img
                      src={CogIcon}
                      alt="Settings"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />
                  </div>
                  <div>
                    <h3 className="outfit-700 mb-2 text-black lg:text-[18px] xl:text-xl">
                      Flexible exam and quiz creation
                    </h3>
                    <p className="outfit-400 text-[13px] text-black lg:text-[14px] xl:text-base">
                      Everything you need to build and customize your worksheets
                      easily
                    </p>
                  </div>
                </div>

                {/* Quick Export Feature */}
                <div className="flex items-start gap-6 text-left">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)] lg:size-14 xl:size-16">
                    <img
                      src={ExportIcon}
                      alt="Settings"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />
                  </div>
                  <div>
                    <h3 className="outfit-700 mb-2 font-bold text-black lg:text-[18px] xl:text-xl">
                      Quick Export
                    </h3>
                    <p className="outfit-400 text-[13px] text-black lg:text-[14px] xl:text-base">
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
                  className="w-full max-w-[500px] lg:-mb-20 lg:ml-18 lg:max-w-[650px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Get Started Call-to-Action Section */}
        <div className="z-101 -mt-20 w-full max-w-[1450px] px-4 pb-16 md:-mt-16 md:px-12 lg:-mt-24 xl:-mt-38">
          <div className="mx-auto w-full md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1100px]">
            <div className="relative">
              <img
                src={GetStarted}
                alt="Get started with CAPS"
                className="w-full rounded-2xl"
              />

              <div className="absolute inset-0 flex items-center justify-end">
                <div className="w-[55%] pr-4 text-left text-white md:pr-8 lg:pr-12 xl:pr-16">
                  <h3 className="outfit-700 text-[12px] leading-tight sm:text-[16px] md:text-[20px] lg:text-[26px] xl:text-[30px]">
                    Ready? Start with{" "}
                    <span className="text-[rgb(124,75,0)]">CAPS</span>
                    <br />
                    and Enjoy an{" "}
                    <span className="text-[rgb(124,75,0)]">
                      Amazing Experience
                    </span>
                  </h3>
                  <p className="outfit-400 mt-1 hidden text-white/90 sm:block sm:text-[11px] md:mt-2 md:text-[13px] lg:mt-3 lg:text-[15px] xl:text-base">
                    Start your journey with CAPS and experience a smarter,
                    faster, and more organized way to handle exams.
                  </p>
                  <div className="mt-2 flex justify-start md:mt-4">
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex cursor-pointer items-center gap-1 rounded-full bg-[rgb(255,246,0)] px-3 py-1.5 text-[10px] font-semibold text-black shadow-md transition hover:bg-yellow-300 active:scale-95 sm:px-4 sm:py-2 sm:text-[12px] md:gap-2 md:px-5 md:py-2.5 md:text-[13px] lg:px-6 lg:py-3 lg:text-sm"
                    >
                      <span className="outfit-500">Get Started</span>
                      <i className="bx bx-arrow-right-stroke flex items-center justify-center text-[12px] md:text-[16px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Features Teaser Section */}
        <section className="w-full max-w-[1450px] bg-white px-6 pb-16">
          <div className="mx-auto w-full max-w-[900px] text-center">
            <h2 className="outfit-700 text-2xl text-black md:text-3xl lg:text-4xl xl:text-5xl">
              More Features to come!
            </h2>
            <p className="outfit-400 mt-4 text-sm text-gray-600 md:text-[14px] lg:text-base">
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
                <span className="text-[12px] text-gray-500">
                  <AppVersion />{" "}
                </span>
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
                    <a
                      href="#contact"
                      className="outfit-400 hover:text-gray-800"
                    >
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
      
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSwitchToLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          // Clean the token/email params from the URL without a page reload
          window.history.replaceState({}, "", window.location.pathname);
        }}
        onSwitchToLogin={() => {
          setIsResetPasswordOpen(false);
          window.history.replaceState({}, "", window.location.pathname);
          setIsLoginOpen(true);
        }}
      />
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </>
  );
}

export default LandingPage;
