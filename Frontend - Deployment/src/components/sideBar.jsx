import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import AllSubjectsDropDown from "./subjectsDean";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";
import SideBarToolTip from "./sidebarTooltip";
import Questionnare from "./Questionnare";
import PrintExamModal from "./PrintExamModal";
import AppVersion from "./appVersion";

// Renders the non-student navigation shell, including the mobile admin bottom bar.
const Sidebar = ({
  role_id,
  setSelectedSubject,
  isExpanded,
  setIsExpanded,
  selectedSubject,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const collegeLogo = new URL("/college-logo.png", import.meta.url).href;
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isChangePasswordSubmitting, setIsChangePasswordSubmitting] =
    useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userCode: "",
  });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [wasProfileModalOpen, setWasProfileModalOpen] = useState(false);
  const [avatarColor, setAvatarColor] = useState("bg-gray-300");

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

  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    // Handle resize.
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const parsedRoleId = Number(role_id);

  const homePath =
    parsedRoleId === 1
      ? "/student"
      : parsedRoleId === 2
        ? "/faculty-dashboard"
        : parsedRoleId === 3
          ? "/program-chair-dashboard"
          : parsedRoleId === 4
            ? "/dean-dashboard"
            : "/";


  const baseMenuItems = [
    { icon: "bx-home-alt-3", label: "Dashboard", path: homePath },

  ];
  let facultyItems = [];
  if (parsedRoleId === 2) {
    facultyItems = [
      {
        icon: "bx-printer",
        label: "Print",
        onClick: () => alert("The print feature for faculty is coming soon!"),
        isButton: true,
      },
    ];
  } else {
    facultyItems = [
      {
        icon: "bx-printer",
        label: "Print",
        onClick: () => setShowPrintModal(true),
        isButton: true,
      },
    ];
  }
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];

  const adminFeatureItems = [
    { icon: "bx-support", label: "Support", path: "/admin/support" },
    {
      icon: "bx-bar-chart-alt-2",
      label: "Analytics",
      path: "/admin/analytics",
    },
  ];
  const classes = [{ icon: "bx-book-bookmark", label: "Classes" }];


  let menuItems = [];

  if (parsedRoleId === 1) {
    // Student menu items: Home, Classes, Sessions
    menuItems = [...baseMenuItems, classItem, sessionsItem];
  } else {
    // if NOT student
    menuItems = [...baseMenuItems];

    if (parsedRoleId >= 2) menuItems = [...menuItems, ...facultyItems];
    if (parsedRoleId >= 2) menuItems = [...menuItems, ...adminItems];
    if (parsedRoleId >= 4) menuItems = [...menuItems, ...adminFeatureItems];
  }

  // Manage is active.
  const isActive = (path) => location.pathname === path;

  // Handle menu click.
  const handleMenuClick = () => {
    setIsExpanded(false);
    setIsSubjectFocused(false);
    setSelectedSubject(null);
  };


  //commented out mobile bottom navigation to focus on desktop sidebar for now, can be re-enabled later when needed
  /*
  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        <div className="fixed right-0 bottom-0 left-0 z-50 flex justify-center pb-4">
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
                  {/* Sessions (student) — left */}
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

                  {/* Home (student, orange circle) — center */}
                  {homeItem && (
                    <div className="flex h-16 flex-col items-center justify-center">
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
                          Home
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Classes (student) — right */}
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
                        to={item.path}
                        onClick={handleMenuClick}
                        className={`flex flex-col items-center p-2 transition-colors ${
                          isActive(item.path)
                            ? "text-orange-600"
                            : "text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white"
                        }`}
                      >
                        <i className={`bx ${item.icon} mb-[5px] text-2xl`}></i>
                        <span className="text-xs">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
            </div>

            {/* Center - Dashboard with circle background }
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {menuItems
                .filter((item) => item.label === "Dashboard")
                .map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="mb-3 flex size-13 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                      <Link
                        to={item.path}
                        onClick={handleMenuClick}
                        className={`flex size-13 items-center justify-center rounded-full transition-colors ${
                          isActive(item.path)
                            ? "text-white"
                            : "text-white hover:text-orange-100"
                        }`}
                      >
                        <i className={`bx mb-1 ${item.icon} text-2xl`}></i>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right side - Subjects }
            <div className="flex items-center gap-5 hover:text-gray-800 min-[345px]:gap-8 min-[500px]:gap-18">
              {/* Subjects for different roles }
              {parsedRoleId === 5 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDown
                      item={classes[0]}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-newspaper"
                      selectedSubject={selectedSubject}
                      refreshSubjects={() => {}}
                    />
                    <span className="-mt-[6px] text-xs text-gray-600 dark:text-gray-300">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      item={classes[0]}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600 dark:text-gray-300">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 4 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDown
                      item={classes[0]}
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      className="bx bx-file-detail"
                      homePath={"/Dean/subjects"}
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 3 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDownProgramChair
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/program-chair/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/program-chair/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 2 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AssignedSubjectsDropDown
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/faculty/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/faculty/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
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
  }*/

  // Desktop sidebar (unchanged)
  return (
    <>
      {/* Sidebar yes*/}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-55 h-[100vh] border-r border-gray-300 bg-white px-2 py-3 text-gray-700 transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-black dark:text-gray-200 ${isExpanded ? "w-[55.5px]" : "w-[55.5px]"
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
                <i className="bx bx-cog mr-2 text-[16px]"></i> Settings
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
        <ul className="mt-3 mb-3 space-y-[5px]">
          {menuItems.map((item, index) => (
            <li key={index}>
              <SideBarToolTip label={item.label} isExpanded={isExpanded}>
                {item.isButton ? (
                  <button
                    onClick={item.onClick}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded px-[8px] py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5 dark:hover:text-white`}
                  >
                    <i className={`bx ${item.icon} text-2xl`}></i>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={handleMenuClick}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-[8px] py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5 dark:hover:text-white${isActive(item.path)
                        ? ""
                        : "hover:text-gray-800 dark:hover:text-white"
                      }`}
                  >
                    <i
                      className={`bx ${item.icon} text-2xl hover:text-gray-800`}
                    ></i>
                  </Link>

                )}
              </SideBarToolTip>
            </li>
          ))}
        </ul>

        {parsedRoleId === 5 && (

          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)] dark:bg-white/10"></div>
            </>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDown
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-newspaper"
                    selectedSubject={selectedSubject}
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Different Dropdowns for Different Roles*/}
        {parsedRoleId === 4 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 flex h-[1px] w-full bg-[rgb(200,200,200)] dark:bg-white/10"></div>
            </>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDown
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    selectedSubject={selectedSubject}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {parsedRoleId === 3 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              {/* Focused Subject Dropdown (move to top if focused) */}
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDownProgramChair
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/program-chair/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/program-chair/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {parsedRoleId === 2 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AssignedSubjectsDropDown
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    selectedSubject={selectedSubject}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/faculty/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    selectedSubject={selectedSubject}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/faculty/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

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
    </>
  );
};

export default Sidebar;
