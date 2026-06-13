import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";
import PrintExamModal from "./PrintExamModal";
import { logoutUser } from "../utils/logoutUser";
import useToast from "../hooks/useToast";
import Toast from "./Toast";
import CollegeLogo from "/src/assets/college-logo.png";
import AppVersion from "./appVersion";
import ProfileModalsHost from "./ProfileModalsHost";
import { useUserProfile } from "../hooks/useUserProfile";

import DashboardIcon from "/src/assets/symbols/dashboard.svg";
import DashboardIconH from "/src/assets/symbols/dashboardhover.svg";
import DashboardIconW from "/src/assets/symbols/dashboard-white.svg";

import LibrariesIcon from "/src/assets/symbols/libraries.svg";
import LibrariesIconH from "/src/assets/symbols/librarieshover.svg";

import ClassIcon from "/src/assets/symbols/class.svg";
import ClassIconH from "/src/assets/symbols/classhover.svg";

import UsersIcon from "/src/assets/symbols/users.svg";
import UsersIconH from "/src/assets/symbols/usershove.svg";

import PrintIcon from "/src/assets/symbols/print.svg";
import PrintIconH from "/src/assets/symbols/printhover.svg";

import SessionsIcon from "/src/assets/symbols/sessions.svg";
import SessionsIconH from "/src/assets/symbols/sessionshover.svg";

import ReportsIcon from "/src/assets/symbols/reports.svg";
import ReportsIconH from "/src/assets/symbols/reportshover.svg";

import SupportIcon from "/src/assets/symbols/support.svg";
import SupportIconH from "/src/assets/symbols/supporthover.svg";

import SubjectsIcon from "/src/assets/symbols/subjects.svg";
import SubjectsIconH from "/src/assets/symbols/subjectshover.svg";

import MyQuizIcon from "/src/assets/symbols/myquiz.svg";
import MyQuizIconH from "/src/assets/symbols/myquizhover.svg";

// Helper function to get role name from role_id
const getRoleName = (roleId) => {
  switch (Number(roleId)) {
    case 1:
      return "Student";
    case 2:
      return "Faculty";
    case 3:
      return "Program Chair";
    case 4:
      return "Dean";
    case 5:
      return "Associate Dean";
    default:
      return "";
  }
};

// Displays the main sidebar
const Sidebar = ({
  role_id,
  setSelectedSubject,
  isExpanded,
  setIsExpanded,
  selectedSubject,
  isSubjectExpanded,
  setIsSubjectExpanded,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
  const collegeLogo = new URL("/college-logo.png", import.meta.url).href;
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profile = useUserProfile();
  const {
    userInfo,
    avatarColor,
    showProfileModal,
    setShowProfileModal,
    showChangePassword,
    clearUserAvatarColor,
  } = profile;

  // Dark mode toggle (shared via `theme` in localStorage + `html.dark`)
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    window.dispatchEvent(new Event("themechange"));
  }, [isDarkMode]);

  useEffect(() => {
    const handler = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  const sidebarRef = useRef();
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  const location = useLocation();
  // Treat Libraries page, Archived Quiz page, and SubjectList pages as a "collapsed sidebar" layout (like Users used to be)
  const isUsersPage =
    location.pathname === "/libraries" ||
    location.pathname === "/archived-quiz" ||
    location.pathname === "/dean/subjects" ||
    location.pathname === "/asso-dean/subjects" ||
    location.pathname === "/program-chair/subjects" ||
    location.pathname === "/faculty/subjects" ||
    location.pathname === "/student/subjects";

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1025);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const openSidebar = () => {
      setIsExpanded(true);
      setIsOpen(true);
      if (typeof setIsSubjectFocused === "function") setIsSubjectFocused(true);
      if (typeof setIsTabletOpen === "function" && window.innerWidth < 1025)
        setIsTabletOpen(true);
    };
    window.addEventListener("openSubjectSidebar", openSidebar);
    return () => window.removeEventListener("openSubjectSidebar", openSidebar);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = sessionStorage.getItem("token");
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore network/backend errors, always log out
    } finally {
      clearUserAvatarColor();
      logoutUser(showToast, navigate);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Get first name from fullName
  const getFirstName = () => {
    if (!userInfo?.fullName) return "User";
    const parts = userInfo.fullName.trim().split(" ");
    return parts[0] || "User";
  };

  // Close dropdown if profile modal is opened
  useEffect(() => {
    if (showProfileModal || showChangePassword) {
      setUserDropdownOpen(false);
    }
  }, [showProfileModal, showChangePassword]);

  const getDisplayName = () => {
    if (!userInfo?.fullName) return "Loading...";

    const particles = ["de", "del", "dela", "de la", "san", "sta", "sto"];
    const parts = userInfo.fullName.trim().split(/\s+/);

    const firstName = parts[0];

    let lastInitial = "";

    if (parts.length > 1) {
      const last = parts.slice(-2).join(" ").toLowerCase();

      if (particles.includes(last)) {
        lastInitial = parts[parts.length - 1][0];
      } else {
        lastInitial = parts[parts.length - 1][0];
      }
    }

    return `${firstName} ${lastInitial}.`;
  };

  const parsedRoleId = Number(role_id);

  const homePath =
    parsedRoleId === 1
      ? "/student-dashboard"
      : parsedRoleId === 2
        ? "/faculty-dashboard"
        : parsedRoleId === 3
          ? "/program-chair-dashboard"
          : parsedRoleId === 4
            ? "/dean-dashboard"
            : parsedRoleId === 5
              ? "/asso-dean-dashboard"
              : "/";

  const baseMenuItems = [
    {
      icon: parsedRoleId === 1 ? "bx-file-detail" : "bx-home-alt-3",
      label: parsedRoleId === 1 ? "Exams" : "Home",
      path: homePath,
    },
  ];
  const librariesItem = {
    label: "Quizzes",
    path: "/libraries",
  };
  const sessionsItem = {
    label: "Sessions",
    path: "/sessions",
  };
  const classItem = {
    label: "Classes",
    path: "/class",
  };
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];
  const classes = [{ icon: "bx-book-bookmark", label: "Subjects" }];
  const studentSubjectsItem = {
    label: "Subjects",
    path: "/student/subjects",
  };

  let menuItems = [];

  if (parsedRoleId === 1) {
    // Student menu items: Home, Classes, Sessions
    menuItems = [...baseMenuItems, classItem, sessionsItem];
  } else {
    // if NOT student
    menuItems = [...baseMenuItems];

    if (parsedRoleId >= 2)
      menuItems = [
        ...menuItems,
        librariesItem,
        sessionsItem,
        classItem,
        ...adminItems,
      ];
  }

  // Print/Export button configuration
  const printButton = {
    icon: "bx-printer",
    label: "Export",
    onClick: () => setShowPrintModal(true),
    isButton: true,
  };

  const isActive = (path) => {
    // Treat Archived Classes as part of the Classes section
    if (path === "/class") {
      return (
        location.pathname === "/class" ||
        location.pathname === "/archived-class" ||
        location.pathname.startsWith("/class/")
      );
    }

    // Treat Archived Quiz as part of the Libraries section
    if (path === "/libraries") {
      return (
        location.pathname === "/libraries" ||
        location.pathname === "/archived-quiz"
      );
    }

    return location.pathname === path;
  };

  const handleMenuClick = () => {
    setIsSubjectFocused(false);
    setIsSubjectExpanded(false);
    setSelectedSubject(null);
    // When navigating via sidebar links, fall back to route-based active state
    setActiveMenu(null);
  };

  // Mobile bottom navigation
  if (isMobile) {
    const homeItem = menuItems.find(
      (item) => item.label === "Home" || item.label === "Exams",
    );

    return (
      <>
        <div
          id="mobile-bottom-nav"
          className="fixed right-0 bottom-0 left-0 z-50 flex justify-center pb-4"
        >
          <div className="border-color mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-lg min-[500px]:px-6">
            <div
              className={
                parsedRoleId === 1
                  ? "flex items-center justify-evenly"
                  : "flex items-center justify-between gap-8"
              }
            >
              {parsedRoleId === 1 ? (
                <>
                  {/* Sessions (student) â€” left */}
                  <div className="flex h-16 flex-col items-center justify-center">
                    <Link
                      to="/sessions"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/sessions")
                          ? "text-orange-600"
                          : "text-gray-700 hover:text-gray-800"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/sessions") ? SessionsIconH : SessionsIcon
                          }
                          alt="Sessions"
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="outfit-500 text-xs">Sessions</span>
                    </Link>
                  </div>

                  {/* Home (student, orange circle) â€” center */}
                  {homeItem && (
                    <div className="flex h-16 flex-col items-center justify-center">
                      <Link
                        to={homeItem.path}
                        onClick={handleMenuClick}
                        className="flex flex-col items-center"
                      >
                        <span className="mb-1 flex items-center justify-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                            <i className="bx bx-file-detail text-[20px]"></i>
                          </span>
                        </span>
                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-orange-600"
                              : "text-gray-700"
                          }`}
                        >
                          {homeItem.label}
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Classes (student) â€” right */}
                  <div className="flex h-16 flex-col items-center justify-center">
                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-orange-600"
                          : "text-gray-700 hover:text-gray-800"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={isActive("/class") ? ClassIconH : ClassIcon}
                          alt="Classes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="outfit-500 text-xs">Classes</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* My Library */}
                  <div className="flex h-16 flex-1 flex-col items-center justify-center">
                    <Link
                      to="/libraries"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/libraries")
                          ? "text-orange-600"
                          : "text-gray-700 hover:text-gray-800"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/libraries")
                              ? LibrariesIconH
                              : LibrariesIcon
                          }
                          alt="Quizzes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="outfit-500 text-xs">Quizzes</span>
                    </Link>
                  </div>

                  {/* Classes */}
                  <div className="flex h-16 flex-1 flex-col items-center justify-center">
                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-orange-600"
                          : "text-gray-700 hover:text-gray-800"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={isActive("/class") ? ClassIconH : ClassIcon}
                          alt="Classes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="outfit-500 text-xs">Classes</span>
                    </Link>
                  </div>

                  {/* Home (orange circle) */}
                  {homeItem && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to={homeItem.path}
                        onClick={handleMenuClick}
                        className="flex flex-col items-center"
                      >
                        <span className="mb-1 flex items-center justify-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                            <img
                              src={DashboardIconW}
                              alt="Dashboard"
                              className="h-5 w-5 object-contain"
                            />
                          </span>
                        </span>
                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-orange-600"
                              : "text-gray-700"
                          }`}
                        >
                          {homeItem.label}
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Users */}
                  {parsedRoleId >= 2 && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to="/users"
                        onClick={handleMenuClick}
                        className={`flex flex-col items-center transition-colors ${
                          isActive("/users")
                            ? "text-orange-600"
                            : "text-gray-700 hover:text-gray-800"
                        }`}
                      >
                        <span className="mb-1 flex h-6 w-6 items-center justify-center">
                          <img
                            src={isActive("/users") ? UsersIconH : UsersIcon}
                            alt="Users"
                            className="h-6 w-6 object-contain"
                          />
                        </span>
                        <span className="outfit-500 text-xs">Users</span>
                      </Link>
                    </div>
                  )}

                  {/* Subjects (qualifying exam entry point) */}
                  {parsedRoleId >= 2 && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to={
                          parsedRoleId === 2
                            ? "/faculty/subjects"
                            : parsedRoleId === 3
                              ? "/program-chair/subjects"
                              : parsedRoleId === 4
                                ? "/dean/subjects"
                                : "/asso-dean/subjects"
                        }
                        onClick={() => {
                          handleMenuClick();
                          setIsSubjectFocused(false);
                          setIsSubjectExpanded(false);
                        }}
                        className={`flex flex-col items-center transition-colors ${
                          isActive(
                            parsedRoleId === 2
                              ? "/faculty/subjects"
                              : parsedRoleId === 3
                                ? "/program-chair/subjects"
                                : parsedRoleId === 4
                                  ? "/dean/subjects"
                                  : "/asso-dean/subjects",
                          )
                            ? "text-orange-600"
                            : "text-gray-700 hover:text-gray-800"
                        }`}
                      >
                        <span className="mb-1 flex h-6 w-6 items-center justify-center">
                          <img
                            src={
                              isActive(
                                parsedRoleId === 2
                                  ? "/faculty/subjects"
                                  : parsedRoleId === 3
                                    ? "/program-chair/subjects"
                                    : parsedRoleId === 4
                                      ? "/dean/subjects"
                                      : "/asso-dean/subjects",
                              )
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className="h-6 w-6 object-contain"
                          />
                        </span>
                        <span className="outfit-500 text-xs">Subjects</span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <PrintExamModal
          isOpen={showPrintModal === true}
          onClose={() => setShowPrintModal(false)}
        />
      </>
    );
  }
  // Desktop sidebar
  const handleSupportClick = () => {
    window.open(
      "https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640",
      "_blank",
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`border-color fixed top-0 left-0 z-55 h-[100vh] border-r border-gray-200 bg-white ${
          isUsersPage ? "w-[63px]" : "w-[220px]"
        }`}
      >
        {/* User Profile Menu Item */}
        <div className="relative px-3 pt-3" ref={userDropdownRef}>
          <div
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className={`outfit-500 group flex w-full cursor-pointer items-center rounded-[8px] transition-colors ${
              isUsersPage
                ? "justify-center px-2 py-1"
                : "gap-3 bg-[rgb(245,247,246)] px-2 py-2.5 hover:bg-gray-100"
            }`}
          >
            {/* Circle with initial */}
            <div className="relative">
              <div
                className={`flex size-9 items-center justify-center rounded-full ${userInfo ? avatarColor : "bg-gray-300"} font-bold text-white`}
              >
                {userInfo?.fullName ? (
                  (() => {
                    const parts = userInfo.fullName.trim().split(" ");
                    const firstInitial = parts[0]?.[0] || "";
                    const lastInitial =
                      parts.length > 1 ? parts[parts.length - 1][0] : "";
                    return (firstInitial + lastInitial).toUpperCase();
                  })()
                ) : (
                  <span className="inline-block size-8 animate-pulse rounded-full bg-gray-300"></span>
                )}
              </div>
            </div>

            {/* Text content */}
            {!isUsersPage && (
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-gray-700">
                  {getDisplayName()}
                </span>
                <span className="text-xs font-normal text-gray-500">
                  {getRoleName(role_id)}
                </span>
              </div>
            )}

            {/* Chevron icon */}
            {!isUsersPage && (
              <i
                className={`bx shadow-s flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-[23px] leading-none text-gray-500 ${userDropdownOpen ? "bx-chevron-left" : "bx-chevron-right"} `}
              ></i>
            )}
          </div>
          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="outfit-400 fade-in absolute top-2 left-full z-50 ml-2 w-60 rounded-md border border-gray-300 bg-white p-1 shadow-lg">
              <div className="flex items-center gap-3 border-gray-200 px-2 py-3">
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-full ${userInfo ? avatarColor : "bg-gray-300"} text-sm font-bold text-white`}
                >
                  {userInfo?.fullName ? (
                    (() => {
                      const parts = userInfo.fullName.trim().split(" ");
                      const firstInitial = parts[0]?.[0] || "";
                      const lastInitial =
                        parts.length > 1 ? parts[parts.length - 1][0] : "";
                      return (firstInitial + lastInitial).toUpperCase();
                    })()
                  ) : (
                    <span className="inline-block size-8 animate-pulse rounded-full bg-gray-300"></span>
                  )}
                </div>

                <div className="flex w-full flex-col overflow-hidden text-sm">
                  <span className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
                    {userInfo?.fullName ? (
                      userInfo.fullName
                    ) : (
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200"></span>
                    )}
                  </span>
                  <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500">
                    {userInfo?.email ? (
                      userInfo.email
                    ) : (
                      <span className="inline-block h-3 w-32 animate-pulse rounded bg-gray-200"></span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mx-1 h-[1px] bg-[rgb(200,200,200)]" />
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  setShowProfileModal(true);
                }}
                className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
              >
                <i className="bx bx-user mr-2 text-[16px]"></i> Profile
              </button>

              <button
                onClick={() => {
                  alert("Dark Mode is coming soon");
                }}
                className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
              >
                <i
                  className={`bx ${isDarkMode ? "bx-sun" : "bx-moon"} mr-2 text-[16px]`}
                ></i>{" "}
                Dark Mode
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
              >
                <i className="bx bx-arrow-out-right-square-half mr-2 text-[16px]"></i>{" "}
                {isLoggingOut ? (
                  <div className="flex items-center justify-center">
                    <span className="">Logging out...</span>
                  </div>
                ) : (
                  "Log out"
                )}
              </button>
            </div>
          )}
          {/* Separator */}
          <div className="mt-2 mb-4 h-[1.5px] w-full bg-gray-200"></div>{" "}
          {!isUsersPage && (
            <div className="outfit-500 px-2 text-[12px] font-semibold text-gray-500">
              MAIN{" "}
            </div>
          )}
        </div>
        {/* Sidebar menu items */}
        <ul className="mt-2 mb-3 space-y-[5px] px-0">
          {menuItems.map((item, index) => {
            const routeActive =
              item.path && typeof item.path === "string"
                ? isActive(item.path)
                : false;
            const isItemActive =
              activeMenu != null ? activeMenu === item.label : routeActive;

            return (
              <li key={index} className="group relative">
                {/* Active left indicator - positioned outside button/link */}
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    isItemActive ? "bg-orange-500" : "bg-transparent"
                  }`}
                ></span>

                <div className="px-3">
                  <Link
                    to={item.path}
                    onClick={handleMenuClick}
                    className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      isItemActive
                        ? "bg-gray-100 text-orange-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {/* Icon + label wrapper with padding */}
                    <div
                      className={`flex items-center ${
                        isUsersPage ? "justify-center" : "ml-3 gap-3"
                      }`}
                    >
                      {item.label === "Home" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={isItemActive ? DashboardIconH : DashboardIcon}
                            alt="Dashboard"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : item.label === "Exams" ? (
                        <i
                          className={`bx bx-file-detail flex-shrink-0 ${
                            isUsersPage ? "text-[20px]" : "text-[18px]"
                          }`}
                        ></i>
                      ) : item.label === "Quizzes" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={isItemActive ? LibrariesIconH : LibrariesIcon}
                            alt="Library"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : item.label === "Sessions" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={isItemActive ? SessionsIconH : SessionsIcon}
                            alt="Sessions"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : item.label === "Users" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={isItemActive ? UsersIconH : UsersIcon}
                            alt="Users"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : item.label === "Classes" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={isItemActive ? ClassIconH : ClassIcon}
                            alt="Class"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : item.label === "Subjects" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={isItemActive ? SubjectsIconH : SubjectsIcon}
                            alt="Subjects"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                      ) : (
                        <i
                          className={`bx ${item.icon} flex-shrink-0 ${
                            isUsersPage ? "text-[20px]" : "text-[18px]"
                          }`}
                        ></i>
                      )}

                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            isItemActive
                              ? "font-[18px] text-black"
                              : "text-gray-600"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {/* Different Dropdowns for Different Roles*/}
        {(parsedRoleId === 4 || parsedRoleId === 5) && (
          <div className="flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-[1.5px] w-full bg-gray-200"></div>{" "}
              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[12px] font-semibold text-gray-500">
                  QUALIFYING EXAM{" "}
                </div>
              )}
            </div>
            <ul>
              {classes.map((item, index) => {
                const subjectsPath =
                  parsedRoleId === 4 ? "/dean/subjects" : "/asso-dean/subjects";
                return (
                  <li key={index} className="group relative">
                    {/* Active left indicator - positioned outside */}
                    <span
                      className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                        isActive(subjectsPath) && activeMenu !== "Print"
                          ? "bg-orange-500"
                          : "bg-transparent"
                      }`}
                    ></span>
                    <div className="mt-1 px-3">
                      <Link
                        to={subjectsPath}
                        onClick={handleMenuClick}
                        className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                          isUsersPage
                            ? "justify-center py-[10px]"
                            : "justify-start py-[6px]"
                        } ${
                          isActive(subjectsPath)
                            ? "bg-gray-100 text-orange-600"
                            : "hover:text-gray-800"
                        }`}
                      >
                        {/* Icon + label wrapper with padding */}
                        <div
                          className={`flex items-center ${
                            isUsersPage ? "justify-center" : "ml-3 gap-3"
                          }`}
                        >
                          <span className="relative flex-shrink-0">
                            <img
                              src={
                                isActive(subjectsPath)
                                  ? SubjectsIconH
                                  : SubjectsIcon
                              }
                              alt="Subjects"
                              className={`${
                                isUsersPage ? "size-[20px]" : "size-[18px]"
                              } flex-shrink-0`}
                            />
                          </span>
                          {!isUsersPage && (
                            <span
                              className={`outfit-500 text-[15px] whitespace-nowrap ${
                                isActive(subjectsPath) && activeMenu !== "Print"
                                  ? "font-[18px] text-black"
                                  : "text-gray-600"
                              }`}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>
                      </Link>
                      {isUsersPage && (
                        <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              {/* Export button below Subjects */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" && showPrintModal
                        ? "bg-orange-500"
                        : "bg-transparent"
                    }`}
                  ></span>
                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        activeMenu === "Print" && showPrintModal
                          ? "bg-gray-100 text-orange-600"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage ? "justify-center" : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={showPrintModal ? PrintIconH : PrintIcon}
                          alt="Export"
                          className={`${
                            isUsersPage ? "size-[20px]" : "size-[20px]"
                          } flex-shrink-0`}
                        />
                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" && showPrintModal
                                ? "text-black"
                                : "text-gray-600"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>
                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}
              {/* Reports button below Print */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-orange-500"
                      : "bg-transparent"
                  }`}
                ></span>
                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      activeMenu === "Reports"
                        ? "bg-gray-100 text-orange-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage ? "justify-center" : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports" ? ReportsIconH : ReportsIcon
                        }
                        alt="Reports"
                        className={`${
                          isUsersPage ? "size-[20px]" : "size-[20px]"
                        } flex-shrink-0`}
                      />
                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "text-black"
                              : "text-gray-600"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>
                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}
        {parsedRoleId === 3 && (
          <div className="flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-[1.5px] w-full bg-gray-200"></div>{" "}
              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[12px] font-semibold text-gray-500">
                  QUALIFYING EXAM{" "}
                </div>
              )}
            </div>
            <ul>
              {classes.map((item, index) => (
                <li key={index} className="group relative">
                  {/* Active left indicator - positioned outside */}
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      isActive("/program-chair/subjects") &&
                      activeMenu !== "Print"
                        ? "bg-orange-500"
                        : "bg-transparent"
                    }`}
                  ></span>
                  <div className="mt-1 px-3">
                    <Link
                      to="/program-chair/subjects"
                      onClick={handleMenuClick}
                      className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        isActive("/program-chair/subjects")
                          ? "bg-gray-100 text-orange-600"
                          : "hover:text-gray-800"
                      }`}
                    >
                      {/* Icon + label wrapper with padding */}
                      <div
                        className={`flex items-center ${
                          isUsersPage ? "justify-center" : "ml-3 gap-3"
                        }`}
                      >
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isActive("/program-chair/subjects")
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              isActive("/program-chair/subjects") &&
                              activeMenu !== "Print"
                                ? "font-[18px] text-black"
                                : "text-gray-600"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {/* Export button below Subjects */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" && showPrintModal
                        ? "bg-orange-500"
                        : "bg-transparent"
                    }`}
                  ></span>
                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg py-[6px] transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                        isUsersPage ? "justify-center" : "justify-start"
                      } ${
                        activeMenu === "Print" && showPrintModal
                          ? "bg-gray-100 text-orange-600"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage ? "justify-center" : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={showPrintModal ? PrintIconH : PrintIcon}
                          alt="Export"
                          className="size-[20px] flex-shrink-0"
                        />
                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" && showPrintModal
                                ? "text-black"
                                : "text-gray-600"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>
                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}
              {/* Reports button below Print */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-orange-500"
                      : "bg-transparent"
                  }`}
                ></span>
                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg py-[6px] transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                      isUsersPage ? "justify-center" : "justify-start"
                    } ${
                      activeMenu === "Reports"
                        ? "bg-gray-100 text-orange-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage ? "justify-center" : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports" ? ReportsIconH : ReportsIcon
                        }
                        alt="Reports"
                        className="size-[20px] flex-shrink-0"
                      />
                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "text-black"
                              : "text-gray-600"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>
                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}
        {parsedRoleId === 2 && (
          <div className="flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-[1.5px] w-full bg-gray-200"></div>{" "}
              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[12px] font-semibold text-gray-500">
                  QUALIFYING EXAM{" "}
                </div>
              )}
            </div>
            <ul>
              {classes.map((item, index) => (
                <li key={index} className="group relative">
                  {/* Active left indicator - positioned outside */}
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      isActive("/faculty/subjects") && activeMenu !== "Print"
                        ? "bg-orange-500"
                        : "bg-transparent"
                    }`}
                  ></span>
                  <div className="mt-1 px-3">
                    <Link
                      to="/faculty/subjects"
                      onClick={handleMenuClick}
                      className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        isActive("/dean/subjects")
                          ? "bg-gray-100 text-orange-600"
                          : "hover:text-gray-800"
                      }`}
                    >
                      {/* Icon + label wrapper with padding */}
                      <div
                        className={`flex items-center ${
                          isUsersPage ? "justify-center" : "ml-3 gap-3"
                        }`}
                      >
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isActive("/faculty/subjects")
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className={`${
                              isUsersPage ? "size-[20px]" : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>
                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              isActive("/dean/subjects") &&
                              activeMenu !== "Print"
                                ? "font-[18px] text-black"
                                : "text-gray-600"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {/* Export button below Subjects */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" && showPrintModal
                        ? "bg-orange-500"
                        : "bg-transparent"
                    }`}
                  ></span>
                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        activeMenu === "Print" && showPrintModal
                          ? "bg-gray-100 text-orange-600"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage ? "justify-center" : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={showPrintModal ? PrintIconH : PrintIcon}
                          alt="Export"
                          className={`${
                            isUsersPage ? "size-[20px]" : "size-[20px]"
                          } flex-shrink-0`}
                        />
                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" && showPrintModal
                                ? "text-black"
                                : "text-gray-600"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>
                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}
              {/* Reports button below Print */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-orange-500"
                      : "bg-transparent"
                  }`}
                ></span>
                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      activeMenu === "Reports"
                        ? "bg-gray-100 text-orange-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage ? "justify-center" : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports" ? ReportsIconH : ReportsIcon
                        }
                        alt="Reports"
                        className={`${
                          isUsersPage ? "size-[20px]" : "size-[20px]"
                        } flex-shrink-0`}
                      />
                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "text-black"
                              : "text-gray-600"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>
                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}
        {/* Support button at the bottom */}
        <div className="absolute bottom-4 left-0 w-full">
          <div className="px-3">
            <button
              onClick={() => {
                setActiveMenu("Support");
                handleSupportClick();
              }}
              className={`group mb-2 flex w-full cursor-pointer items-center rounded-lg py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                isUsersPage ? "justify-center" : "justify-start"
              } ${
                activeMenu === "Support" ? "bg-gray-100 text-orange-600" : ""
              }`}
            >
              <div
                className={`flex items-center ${
                  isUsersPage ? "justify-center" : "ml-3 gap-[10px]"
                }`}
              >
                <img
                  src={activeMenu === "Support" ? SupportIconH : SupportIcon}
                  alt="Support"
                  className="size-[20px] flex-shrink-0"
                />
                {!isUsersPage && (
                  <span className="outfit-500 text-[15px] whitespace-nowrap text-gray-600">
                    Support
                  </span>
                )}
              </div>
            </button>
          </div>
          <div className="px-3">
            <div className="mb-2 h-[1.5px] w-full bg-gray-200"></div>{" "}
            <button
              onClick={() => {
                navigate("/team-caps");
              }}
              className={`group flex w-full cursor-pointer items-center rounded-lg px-3 py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                activeMenu === "Support" ? "bg-gray-100 text-orange-600" : ""
              } ${isUsersPage ? "justify-center" : "justify-between"}`}
            >
              {/* Left side */}
              <div
                className={`flex items-center ${
                  isUsersPage ? "" : "gap-[10px]"
                }`}
              >
                <img
                  src={CollegeLogo}
                  alt="CAPS"
                  className="size-[20px] flex-shrink-0"
                />
                {!isUsersPage && (
                  <span className="outfit-500 text-[15px] whitespace-nowrap text-gray-600">
                    CAPS
                  </span>
                )}
              </div>

              {/* Right side */}
              {!isUsersPage && (
                <span className="text-xs font-medium text-gray-400">
                  <AppVersion />
                </span>
              )}
            </button>
          </div>
        </div>

        {/*<div
          className={`fixed bottom-4 ${isExpanded ? "left-[75px]" : "left-[14px]"} transition-all duration-300 ease-in-out ${
            isMobile && !isExpanded ? "hidden" : ""
          }`}
        >
          <AppVersion />
        </div>*/}
      </div>
      <PrintExamModal
        isOpen={showPrintModal === true}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div className="animate-fade-in-up flex w-[90vw] max-w-xs flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <svg
                width="36"
                height="36"
                fill="none"
                viewBox="0 0 24 24"
                stroke="orange"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
            </div>
            <div className="outfit-700 mb-1 text-[20px]">Log out</div>
            <div className="outfit-400 mb-5 text-center text-[14px] text-gray-500">
              Are you sure you want to log out?
            </div>
            <button
              className="outfit-400 mb-2 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[16px] font-semibold text-white transition hover:bg-orange-700"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <span className="flex items-center justify-center">
                  <span className="loader-white mr-2"></span>
                </span>
              ) : (
                "Yes, Log out"
              )}
            </button>
            <button
              className="border-color outfit-400 w-full cursor-pointer rounded-lg border py-2 text-[16px] font-semibold text-gray-800 transition hover:bg-gray-200"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ProfileModalsHost profile={profile} showToast={showToast} />

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
};

export default Sidebar;
