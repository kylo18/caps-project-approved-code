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

// Utility to get a random color from a palette
const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-green-700",
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-teal-600",
  "bg-indigo-600",
];
function getRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getAvatarColorKey(userInfo) {
  // Prefer email, fallback to userCode, fallback to 'default'
  return userInfo?.email || userInfo?.userCode || "default";
}

function getPersistedAvatarColor(userInfo) {
  const key = getAvatarColorKey(userInfo);
  return localStorage.getItem("avatarColor_" + key);
}

function setPersistedAvatarColor(userInfo, color) {
  const key = getAvatarColorKey(userInfo);
  localStorage.setItem("avatarColor_" + key, color);
}

function clearPersistedAvatarColor(userInfo) {
  const key = getAvatarColorKey(userInfo);
  localStorage.removeItem("avatarColor_" + key);
}

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
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
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
  // new added: Analytics popup state and ref
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const analyticsRef = useRef(null);
  const sidebarRef = useRef();
  const userDropdownRef = useRef(null);
  const profileModalRef = useRef(null);
  const changePasswordModalRef = useRef(null);
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

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiUrl}/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [apiUrl]);

  // Set avatar color based on user info
  useEffect(() => {
    if (userInfo) {
      let color = getPersistedAvatarColor(userInfo);
      if (!color) {
        color = getRandomAvatarColor();
        setPersistedAvatarColor(userInfo, color);
      }
      setAvatarColor(color);
    }
  }, [userInfo]);

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

  // Close More drawer when clicking outside
  useEffect(() => {
    if (!showMoreDrawer) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-more-popup]")) {
        setShowMoreDrawer(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreDrawer]);

  //new added: Close Analytics popup when clicking outside
  useEffect(() => {
    if (!showAnalyticsPopup) return;
    const handleClickOutside = (e) => {
      if (analyticsRef.current && !analyticsRef.current.contains(e.target)) {
        setShowAnalyticsPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAnalyticsPopup]);

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
      if (userInfo) clearPersistedAvatarColor(userInfo);
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

  // Close Profile Modal on outside click for <=448px
  useEffect(() => {
    if (!showProfileModal) return;
    function handleClickOutside(event) {
      if (
        window.innerWidth <= 448 &&
        profileModalRef.current &&
        !profileModalRef.current.contains(event.target)
      ) {
        setShowProfileModal(false);
        setProfileError("");
        setProfileSuccess("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  // Close Change Password Modal on outside click for <=448px
  useEffect(() => {
    if (!showChangePassword) return;
    function handleClickOutside(event) {
      if (
        window.innerWidth <= 448 &&
        changePasswordModalRef.current &&
        !changePasswordModalRef.current.contains(event.target)
      ) {
        handleCloseChangePassword();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChangePassword]);

  // Prevent background scrolling when profile modal is open
  useEffect(() => {
    if (showProfileModal || showChangePassword) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showProfileModal, showChangePassword]);

  // Profile form handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };
  const getDisplayName = () => {
    if (!userInfo?.fullName) return "Loading...";

    const particles = ["de", "del", "dela", "de la", "san", "sta", "sto"];
    const parts = userInfo.fullName.trim().split(/\s+/);

    const firstName = parts[0];

    let lastInitial = "";

    if (parts.length > 1) {
      // Check if last name has a particle (e.g. "Dela Cruz")
      const last = parts.slice(-2).join(" ").toLowerCase();

      if (particles.includes(last)) {
        lastInitial = parts[parts.length - 1][0];
      } else {
        lastInitial = parts[parts.length - 1][0];
      }
    }

    return `${firstName} ${lastInitial}.`;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const profilePayload = {};
      Object.entries(profileFormData).forEach(([key, value]) => {
        if (value.trim() !== "") {
          profilePayload[key] = value.trim();
        }
      });

      const token = sessionStorage.getItem("token");
      const profileResponse = await fetch(`${apiUrl}/user/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      const profileData = await profileResponse.json();

      if (profileResponse.ok) {
        showToast("Profile updated successfully!", "success");
        setUserInfo((prev) => ({
          ...prev,
          fullName:
            `${profilePayload.firstName} ${profilePayload.lastName}`.trim(),
          email: profilePayload.email,
          userCode: profilePayload.userCode,
        }));

        setTimeout(() => setShowProfileModal(false), 0);
      } else {
        setProfileError(profileData.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileError("Something went wrong. Please try again later.");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const resetProfileForm = () => {
    if (userInfo) {
      const [firstName = "", lastName = ""] = (userInfo.fullName || "").split(
        " ",
      );
      setProfileFormData({
        firstName: firstName || "",
        lastName: lastName || "",
        email: userInfo.email || "",
        userCode: userInfo.userCode || "",
      });
    }
  };

  useEffect(() => {
    if (userInfo) {
      resetProfileForm();
    }
  }, [userInfo]);

  const handleOpenChangePassword = () => {
    setWasProfileModalOpen(showProfileModal);
    setShowProfileModal(false);
    setShowChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    setFormData({
      password: "",
      new_password: "",
      new_password_confirmation: "",
    });
    setPasswordVisible(false);
    setNewPasswordVisible(false);
    setConfirmPasswordVisible(false);
    setError("");
    setMessage("");
    if (wasProfileModalOpen) {
      setTimeout(() => {
        setShowProfileModal(true);
      }, 50);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsChangePasswordSubmitting(true);

    if (formData.new_password.length < 8) {
      setError("New password must be at least 8 characters long.");
      setIsChangePasswordSubmitting(false);
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setError("Passwords do not match.");
      setIsChangePasswordSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Password changed successfully.");
        setFormData({
          password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setPasswordVisible(false);
        setNewPasswordVisible(false);
        setConfirmPasswordVisible(false);

        showToast("Password changed successfully!", "success");

        handleCloseChangePassword();
      } else {
        setError(result.message || "Failed to change password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      console.error("Change password error:", err);
    } finally {
      setIsChangePasswordSubmitting(false);
    }
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

  const baseMenuItems = [ //this is for Home in sidebar
    { icon: "bx-home-alt-3", label: "Home", path: homePath },
  ];
  const librariesItem = {
    label: "Quizzes", //this is for quizzes in sidebar
    path: "/libraries",
  };
  const sessionsItem = {
    label: "Sessions",  //this is for Sessions in sidebar
    path: "/sessions",
  };
  const classItem = {
    label: "Classes",   //this is for Classes in sidebar
    path: "/class",
  };
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];
  const classes = [{ icon: "bx-book-bookmark", label: "Subjects" }];
  const analyticsMenuItems = [  //this is for achievements, leaderboards, content analytics, difficult analytics in sidebar
    { label: "Achievements", path: "/analytics/achievements", icon: "bx bx-trophy" },
    { label: "Leaderboards", path: "/analytics/leaderboards", icon: "bx bx-bar-chart"},
    { label: "My Content", path: "/analytics/content-analytics", icon: "bx bx-file" },
    { label: "Difficulty", path: "/analytics/difficult-analytics", icon: "bx bx-pulse" },
  ];
  

  const studentSubjectsItem = {
    label: "Subjects",
    path: "/student/subjects",
  };

  let menuItems = [];

  if (parsedRoleId === 1) {
    // Student menu items: Home, Sessions, Classes only
    menuItems = [...baseMenuItems, sessionsItem, classItem];
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

  // Mobile bottom navigation, this is home for mobile
  if (isMobile) {
    const homeItem = menuItems.find((item) => item.label === "Home");
    const mobileNavItems = parsedRoleId === 1
    ? [ //this is for buttom menus in mobile view, this is for student only
      
      { label: "Leaderboards", path: "/analytics/leaderboards", icon: "bx bx-bar-chart" },
      { label: "Classes", path: "/class", image: ClassIcon, activeImage: ClassIconH },
      { label: "Home", path: homeItem?.path || "/", icon: "bx-home-alt-3", home: true },
      { label: "Sessions", path: "/sessions", image: SessionsIcon, activeImage: SessionsIconH },
      { label: "More", path: null, icon: "bx bx-dots-horizontal-rounded", more: true },
    ]
    : [
      { label: "Classes",  path: "/class",     image: ClassIcon,    activeImage: ClassIconH    },
      { label: "Home",     path: homeItem?.path || "/", icon: "bx-home-alt-3", home: true     },
      { label: "Sessions", path: "/sessions",  image: SessionsIcon, activeImage: SessionsIconH },
    ];
    
    return (
      <>
        <div className="fixed right-0 bottom-0 left-0 z-50 flex justify-center pb-4">
          <div className="border-color mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white px-2 py-2 shadow-lg min-[500px]:px-4">
            <div className="grid grid-cols-5 gap-1">
              {mobileNavItems.map((item) => (
                <div
                  key={item.label}
                  className="flex h-14 flex-col items-center justify-center"
                >
                  {item.more ? (
                    <div className="relative flex flex-col items-center" data-more-popup>
                      <button
                        onClick={() => setShowMoreDrawer((prev) => !prev)}
                        className={`flex flex-col items-center transition-colors ${
                          showMoreDrawer ? "text-orange-500" : "text-gray-700 hover:text-gray-800"
                        }`}
                      >
                        <span className="mb-1 flex h-6 w-6 items-center justify-center">
                          <i className="bx bx-dots-horizontal-rounded text-[20px]"></i>
                        </span>
                        <span className="outfit-500 text-[9px] leading-4 text-center">More</span>
                      </button>

                      {/* Popup box above More button */}
                      {showMoreDrawer && (
                        <div className="absolute bottom-[52px] right-[-60px] z-[70] w-[200px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
                          {/* Arrow pointer */}
                          <div className="absolute bottom-[-7px] right-[72px] h-3 w-3 rotate-45 border-b border-r border-gray-200 bg-white"></div>

                          <p className="outfit-500 mb-2 px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            More options
                          </p>
                          <div className="flex flex-col gap-1">
                            {[
                              { label: "Achievements", path: "/analytics/achievements", icon: "bx bx-trophy" },
                              { label: "Content", path: "/analytics/content-analytics", icon: "bx bx-file" },
                              { label: "Difficult", path: "/analytics/difficult-analytics", icon: "bx bx-pulse" },
                              { label: "Enhancement", path: "/analytics/enhancement", icon: "bx bx-bar-chart-square" },
                            ].map((moreItem) => (
                              <Link
                                key={moreItem.label}
                                to={moreItem.path}
                                onClick={() => { setShowMoreDrawer(false); handleMenuClick(); }}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-100 ${
                                  isActive(moreItem.path)
                                    ? "bg-orange-50 text-orange-600"
                                    : "text-gray-600"
                                }`}
                              >
                                <i className={`${moreItem.icon} text-[18px]`}></i>
                                <span className="outfit-500 text-[13px]">{moreItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive(item.path)
                          ? "text-orange-600"
                          : "text-gray-700 hover:text-gray-800"
                      }`}
                    >
                      <span
                        className={`mb-1 flex items-center justify-center ${
                          item.home
                            ? "h-10 w-10 rounded-full bg-orange-500 shadow-lg"
                            : "h-6 w-6"
                        }`}
                      >
                        {item.image ? (
                          <img
                            src={isActive(item.path) ? item.activeImage : item.image}
                            alt={item.label}
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <i
                            className={`${item.icon} text-[20px] ${
                              item.home ? "text-white" : ""
                            }`}
                          ></i>
                        )}
                      </span>
                      <span className="outfit-500 text-[9px] leading-4 text-center">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
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
    navigate("/support");
  };

  return (
    <>
      {/* Sidebar yes*/}
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
                className={`bx flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-[23px] leading-none text-gray-500 shadow-sm ${userDropdownOpen ? "bx-chevron-left" : "bx-chevron-right"} `}
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
                  setUserDropdownOpen(false);
                  alert("The dark mode feature is still under development.");
                }}
                className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
              >
                <i className="bx bx-moon mr-2 text-[16px]"></i> Dark Mode
              </button>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  setShowLogoutModal(true);
                }}
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
                    className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      isItemActive
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
                          } hover:text-gray-800`}
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
          {/* ANALYTICS — students only */}
          {parsedRoleId === 1 && (
              <ul className="mt-2 space-y-[5px] px-0">

                {/* Analytics popup trigger */}
                <li className="group relative" ref={analyticsRef}>
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      showAnalyticsPopup ? "bg-orange-500" : "bg-transparent"
                    }`}
                  ></span>
                  <div className="px-3">
                    <button
                      onClick={() => setShowAnalyticsPopup((prev) => !prev)}
                      className={`flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 ${
                        isUsersPage ? "justify-center py-[10px]" : "justify-start py-[6px]"
                      } ${showAnalyticsPopup ? "bg-gray-100" : ""}`}
                    >
                      <div className={`flex items-center ${isUsersPage ? "justify-center" : "ml-3 gap-3"}`}>
                        <i className={`bx bx-bar-chart-alt-2 flex-shrink-0 ${isUsersPage ? "text-[20px]" : "text-[18px]"} ${showAnalyticsPopup ? "text-orange-500" : "text-gray-600"}`}></i>
                        {!isUsersPage && (
                          <span className={`outfit-500 text-[15px] whitespace-nowrap ${showAnalyticsPopup ? "text-black" : "text-gray-600"}`}>
                            Analytics
                          </span>
                        )}
                        {!isUsersPage && (
                          <i className={`bx ${showAnalyticsPopup ? "bx-chevron-up" : "bx-chevron-down"} ml-auto text-[16px] text-gray-400`}></i>
                        )}
                      </div>
                    </button>

                    {/* new added: Popup box */}
                    {showAnalyticsPopup && (
                      <div className="absolute left-0 top-full z-[70] mt-1 w-[210px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
                        {/* Arrow pointer — now points UP */}
                        <div className="absolute top-[-7px] left-4 h-3 w-3 rotate-45 border-t border-l border-gray-200 bg-white"></div>

                        <div className="flex flex-col gap-1">
                          {analyticsMenuItems.map((item) => (
                            <Link
                              key={item.label}
                              to={item.path}
                              onClick={() => { setShowAnalyticsPopup(false); handleMenuClick(); }}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-100 ${
                                isActive(item.path) ? "bg-orange-50 text-orange-600" : "text-gray-600"
                              }`}
                            >
                              <i className={`${item.icon} text-[18px]`}></i>
                              <span className="outfit-500 text-[13px]">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              </ul>
          )}
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

              {/* Enhancement link - admin only */}
              <li className="group relative">
                <span className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${isActive("/admin/enhancement") ? "bg-orange-500" : "bg-transparent"}`}></span>
                <div className="px-3">
                  <button
                    onClick={() => { setActiveMenu("Enhancement"); navigate("/admin/enhancement"); }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-800 ${isUsersPage ? "justify-center py-[10px]" : "justify-start py-[6px]"} ${activeMenu === "Enhancement" ? "bg-gray-100 text-orange-600" : ""}`}
                  >
                    <div className={`flex items-center ${isUsersPage ? "justify-center" : "ml-3 gap-[10px]"}`}>
                      <i className={`bx bx-bar-chart-square ${isUsersPage ? "text-[20px]" : "text-[20px]"} flex-shrink-0 ${activeMenu === "Enhancement" ? "text-orange-500" : "text-gray-600"}`}></i>
                      {!isUsersPage && (
                        <span className={`outfit-500 text-[15px] whitespace-nowrap ${activeMenu === "Enhancement" ? "text-black" : "text-gray-600"}`}>
                          Enhancement
                        </span>
                      )}
                    </div>
                  </button>
                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Enhancement
                    </span>
                  )}
                </div>
              </li>

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
                {!isUsersPage && ( //this is for help and support
                  <span className="outfit-500 text-[15px] whitespace-nowrap text-gray-600">
                    Help & Support
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

      {/* Profile Modal */}
      {showProfileModal && (
        <>
          <div className="outfit-400 bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              ref={profileModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative mx-0 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white px-6 py-4 shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-2xl"
            >
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetProfileForm();
                  setProfileError("");
                  setProfileSuccess("");
                }}
                className="absolute top-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition duration-100 hover:bg-gray-100 hover:text-gray-700"
              >
                <i className="bx bx-x text-3xl"></i>
              </button>

              {/* Profile Picture and Name */}
              <div className="mb-3 flex items-center gap-4 p-4">
                <div className="relative">
                  <div
                    className={`flex size-11 items-center justify-center rounded-full ${userInfo ? avatarColor : "bg-gray-300"} font-bold text-white`}
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
                      <span className="inline-block size-11 animate-pulse rounded-full bg-gray-300"></span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {userInfo?.fullName ? (
                      userInfo.fullName
                    ) : (
                      <span className="inline-block h-5 w-32 animate-pulse rounded bg-gray-200"></span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {userInfo?.email ? (
                      userInfo.email
                    ) : (
                      <span className="inline-block h-4 w-40 animate-pulse rounded bg-gray-200"></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

              <form className="rounded-b-md" onSubmit={handleProfileSubmit}>
                <div className="mb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative w-full">
                      <div className="relative">
                        <span className="block text-[12px] font-semibold text-gray-700">
                          FIRST NAME
                        </span>
                        <input
                          type="text"
                          className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          name="firstName"
                          placeholder="Enter"
                          value={profileFormData.firstName}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="relative w-full">
                      <div className="relative">
                        <span className="block text-[12px] font-semibold text-gray-700">
                          LAST NAME
                        </span>
                        <input
                          className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          type="text"
                          name="lastName"
                          placeholder="Enter"
                          value={profileFormData.lastName}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="relative w-full">
                      <div className="relative">
                        <span className="block text-[12px] font-semibold text-gray-700">
                          EMAIL ADDRESS{" "}
                        </span>
                        <input
                          className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          type="email"
                          name="email"
                          placeholder="Enter"
                          value={profileFormData.email}
                          onChange={handleProfileChange}
                          required
                        />

                        <div className="mt-1 text-start text-[11px] text-gray-400">
                          Your primary email address. It may be used for
                          account-related communications.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                  <div>
                    <div
                      onClick={handleOpenChangePassword}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-1 hover:bg-gray-100"
                    >
                      <h3 className="text-[14px] font-medium text-gray-700">
                        Change Password
                      </h3>
                      <button
                        type="button"
                        className="flex items-center rounded-lg p-1 text-gray-700"
                      >
                        <i className="bx bx-chevron-right cursor-pointer text-[24px] hover:text-gray-500 active:scale-95"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="-mt-1 mb-2 h-[0.5px] bg-[rgb(200,200,200)]" />
                {profileError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {profileError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isProfileSubmitting}
                  className={`mt-2 h-9 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isProfileSubmitting ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                >
                  {isProfileSubmitting ? (
                    <div className="flex items-center justify-center">
                      <span className="loader-white"></span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <>
          <div className="outfit-400 lightbox-bg bg-opacity-40 fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              ref={changePasswordModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-xl"
            >
              {/* X Button (top-right corner) */}
              <button
                onClick={handleCloseChangePassword}
                className="absolute top-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition duration-100 hover:bg-gray-100 hover:text-gray-700"
              >
                <i className="bx bx-x text-3xl"></i>
              </button>

              {/* Header */}
              <div className="flex flex-col gap-1 pr-10">
                <h2 className="text-[18px] font-bold text-gray-800">
                  Change Password
                </h2>
                <div className="text-[14px] font-normal text-gray-400">
                  For your account's safety, we recommend changing your password
                  to prevent unauthorized access.
                </div>
              </div>

              <form className="" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="mt-6 block text-[12px] font-semibold text-gray-200">
                      <span className="text-gray-700">CURRENT PASSWORD</span>
                      <span className="ml-1 text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute top-1/2 right-3 mt-[2px] flex h-full -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${passwordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px] leading-none`}
                        ></i>
                      </button>
                    </div>
                  </div>
                  {/* New Password */}
                  <div>
                    <label className="mt-6 block text-[12px] font-semibold text-gray-200">
                      <span className="text-gray-700">NEW PASSWORD</span>
                      <span className="ml-1 text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={newPasswordVisible ? "text" : "password"}
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewPasswordVisible(!newPasswordVisible)
                        }
                        className="absolute top-1/2 right-3 mt-[2px] flex h-full -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${newPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px] leading-none`}
                        ></i>
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      Password must contain at least 8 characters{" "}
                    </div>
                  </div>
                  {/* Confirm New Password */}
                  <div>
                    <label className="mt-6 block text-[12px] font-semibold text-gray-200">
                      <span className="text-gray-700">
                        CONFIRM NEW PASSWORD
                      </span>
                      <span className="ml-1 text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={confirmPasswordVisible ? "text" : "password"}
                        name="new_password_confirmation"
                        value={formData.new_password_confirmation}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                        className="absolute top-1/2 right-3 mt-[2px] flex h-full -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${confirmPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px] leading-none`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-2 text-center text-[12px] text-red-500">
                    {error}
                  </div>
                )}
                {/* Action Buttons */}
                <div className="mt-8 flex items-end justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isChangePasswordSubmitting}
                    className={`h-9 cursor-pointer rounded-lg px-5 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isChangePasswordSubmitting ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                  >
                    {isChangePasswordSubmitting ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
};

export default Sidebar;
