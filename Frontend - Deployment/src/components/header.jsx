import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import collegeLogo from "/src/assets/college-logo.png";
import { logoutUser } from "../utils/logoutUser";
import ChangelogModal from "./ChangelogModal";
import ProfileModalsHost from "./ProfileModalsHost";
import { useUserProfile } from "../hooks/useUserProfile";

// Web App Header
const CHANGELOG_KEY = "changelog_v2.0.0_seen";

const AdminHeader = ({ title, className = "" }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profile = useUserProfile();
  const {
    userInfo,
    avatarColor,
    showProfileModal,
    setShowProfileModal,
    showChangePassword,
    clearUserAvatarColor,
  } = profile;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isTutorialPage = location.pathname.includes("/help");
  const collegeLogo = new URL("../assets/college-logo.png", import.meta.url)
    .href;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dropdownRef = useRef(null);
  const { toast, showToast } = useToast();

  // Dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    // Let other components (like sidebar) stay in sync.
    window.dispatchEvent(new Event("themechange"));
  }, [isDarkMode]);

  // Keep state in sync if another component (e.g. sidebar) toggles the theme.
  useEffect(() => {
    const handler = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ref for logout modal content
  const logoutModalRef = useRef(null);

  // Close dropdown if logout modal is opened
  useEffect(() => {
    if (showLogoutModal || showProfileModal || showChangePassword)
      setDropdownOpen(false);
  }, [showLogoutModal, showProfileModal, showChangePassword]);

  // Close Logout Modal on outside click for <=448px
  useEffect(() => {
    if (!showLogoutModal) return;
    function handleClickOutside(event) {
      if (
        window.innerWidth <= 448 &&
        logoutModalRef.current &&
        !logoutModalRef.current.contains(event.target)
      ) {
        setShowLogoutModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogoutModal]);

  // Handle the logout process
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${apiUrl}/logout`, {
          credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={className}>
      <div className="outfit-500 border-color fixed top-0 left-0 z-49 flex h-[44px] w-full items-center justify-between border-b bg-white px-6 py-[10px] sm:z-52">
        <div className="-ml-3 flex items-center gap-2">
          <img src={collegeLogo} alt="College Logo" className="size-[30px]" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-gray-500">{title}</span>

          {/* Three-dot Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="-mr-3 flex cursor-pointer items-center rounded-full border-2 border-gray-300 bg-white transition hover:border-gray-400 hover:bg-gray-100"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {/* Circle with initial */}
              <div
                className={`flex size-[28px] items-center justify-center rounded-full font-semibold text-white ${avatarColor}`}
              >
                {userInfo?.fullName ? userInfo.fullName[0].toUpperCase() : "-"}
              </div>

              {/* Chevron */}
              <i className="bx bx-chevron-down mr-[3px] text-2xl text-gray-700"></i>
            </button>

            {/* Dropdown Buttons */}
            {dropdownOpen && (
              <div className="fade-in 4] absolute top-[44px] right-[-10px] z-51 w-60 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
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
                    <span className="outfit-400 overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
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
                  onClick={() => setShowProfileModal(true)}
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
                  onClick={() => {
                    window.open(
                      "https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640",
                      "_blank",
                    );
                  }}
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-message-question-mark mr-2 text-[16px]"></i>{" "}
                  Support
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowChangelog(true);
                  }}
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-news mr-2 text-[16px]"></i> Changelog
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
          </div>
        </div>
      </div>

      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}

      <ProfileModalsHost profile={profile} showToast={showToast} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div
            ref={logoutModalRef}
            className="animate-fade-in-up flex w-[90vw] max-w-xs flex-col items-center rounded-2xl bg-white p-6 shadow-xl"
          >
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
            <div className="mb-1 text-[20px] font-bold">Log out</div>
            <div className="mb-5 text-center text-[14px] text-gray-500">
              Are you sure you want to log out?
            </div>
            <button
              className="mb-2 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[16px] font-semibold text-white transition hover:bg-orange-700"
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
              className="border-color w-full cursor-pointer rounded-lg border py-2 text-[16px] font-semibold text-gray-800 transition hover:bg-gray-200"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default AdminHeader;
