import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import collegeLogo from "/src/assets/college-logo.png";
import { logoutUser } from "../utils/logoutUser";

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

// Web App Header
const AdminHeader = ({ title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isTutorialPage = location.pathname.includes("/help");
  const collegeLogo = new URL("../assets/college-logo.png", import.meta.url)
    .href;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dropdownRef = useRef(null);
  const { toast, showToast } = useToast();

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

  // Profile form states
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userCode: "",
  });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [wasProfileModalOpen, setWasProfileModalOpen] = useState(false);

  // Store a persistent color for the avatar per user
  const [avatarColor, setAvatarColor] = useState("bg-gray-300");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Refs for modal content
  const profileModalRef = useRef(null);
  const changePasswordModalRef = useRef(null);
  const logoutModalRef = useRef(null);

  // Close dropdown if logout modal is opened
  useEffect(() => {
    if (showLogoutModal || showProfileModal || showChangePassword)
      setDropdownOpen(false);
  }, [showLogoutModal, showProfileModal, showChangePassword]);

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

  // Prevent background scrolling when profile modal is open
  useEffect(() => {
    if (showProfileModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showProfileModal]);

  // Prevent background scrolling when change password modal is open
  useEffect(() => {
    if (showChangePassword) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showChangePassword]);

  // Prevent background scrolling when logout modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showLogoutModal]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
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

  // Handle the logout process
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = localStorage.getItem("token");
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

    // Client-side validation
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  // Add profile form handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
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

      const token = localStorage.getItem("token");
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
        // Update local user info
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
      setShowProfileModal(true);
    }
  };

  return (
    <div>
      <div className="open-sans fixed top-0 left-0 z-49 flex h-[44px] w-full items-center justify-between border-b border-gray-300 bg-white px-6 py-[10px] sm:z-52">
        <div className="-ml-3 flex items-center gap-2">
          <img src={collegeLogo} alt="College Logo" className="size-[30px]" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-gray-500">{title}</span>

          {/* Help Button */}
          <button
            onClick={() => {
              if (title !== "Student") {
                window.open(
                  "https://docs.google.com/spreadsheets/d/1G3-PccAywmrd9QU94p9DJ58JYBg5jeyB/edit?gid=1756766640#gid=1756766640",
                  "_blank",
                );
              } else {
                window.open(
                  "https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&gid=1756766640#gid=1756766640",
                  "_blank",
                );
              }
            }}
            className={`border-color flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-black ${
              title === "student"
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gray-200"
            }`}
            disabled={title === "student"}
          >
            <i className="bx bx-message-question-mark text-md ml-1"></i>
            <span className="pr-1.5 text-[14px]">Help</span>
          </button>

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
              <div className="fade-in absolute top-[44px] right-[-10px] z-51 w-60 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
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
                    <span className="open-sans overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
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
                  <i className="bx bx-cog mr-2 text-[16px]"></i> Settings
                </button>

                <button
                  onClick={() =>
                    alert("The dark mode feature is still under development.")
                  }
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-moon mr-2 text-[16px]"></i> Dark Mode
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

      {showProfileModal && (
        <>
          <div className="open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              ref={profileModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative mx-0 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white px-6 py-4 shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md"
            >
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetProfileForm();
                  setProfileError("");
                  setProfileSuccess("");
                }}
                className="absolute top-2 right-5 cursor-pointer text-3xl text-gray-700 hover:text-gray-700"
              >
                <i className="bx bx-x text-[20px]"></i>
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
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative w-full">
                      <div className="relative">
                        <span className="block text-[14px] text-gray-700">
                          First Name
                        </span>
                        <input
                          type="text"
                          className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
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
                        <span className="block text-[14px] text-gray-700">
                          Last Name
                        </span>
                        <input
                          className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
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
                        <span className="block text-[14px] text-gray-700">
                          Email Address
                        </span>
                        <input
                          className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
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

                  <div className="mt-2 h-[0.5px] bg-[rgb(200,200,200)]" />
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-medium text-gray-700">
                        Change Password
                      </h3>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg px-3 text-[13px] text-gray-700"
                      >
                        <i
                          onClick={handleOpenChangePassword}
                          className="bx bx-chevron-right mt-1 cursor-pointer text-[30px] hover:text-gray-500 active:scale-95"
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 mb-2 h-[0.5px] bg-[rgb(200,200,200)]" />
                {profileError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {profileError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isProfileSubmitting}
                  className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isProfileSubmitting ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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

      {showChangePassword && (
        <>
          <div className="open-sans lightbox-bg bg-opacity-40 fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              ref={changePasswordModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md"
            >
              {/* Header */}
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold">
                  Change your Password
                </h2>

                <button
                  onClick={handleCloseChangePassword}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <form className="px-5 py-4" onSubmit={handleSubmit}>
                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Current Password
                    </span>
                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name="password"
                        placeholder="Enter"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute top-[63%] right-3 -translate-y-[50%] text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${passwordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-xl`}
                        ></i>
                      </button>
                    </div>
                    <div className="mt-1 text-start text-[11px] text-gray-400">
                      Enter your current password to confirm your identity
                      before making changes.
                    </div>
                  </div>

                  <div>
                    <span className="block text-[14px] text-gray-700">
                      New Password
                    </span>
                    <div className="relative">
                      <input
                        type={newPasswordVisible ? "text" : "password"}
                        name="new_password"
                        placeholder="Enter"
                        value={formData.new_password}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewPasswordVisible(!newPasswordVisible)
                        }
                        className="absolute top-[63%] right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${newPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-xl`}
                        ></i>
                      </button>
                    </div>
                    <div className="mt-1 text-start text-[11px] text-gray-400">
                      Enter a new password with a minimum of 8 characters.
                      Ensure it is secure and distinct from your current
                      password.
                    </div>
                  </div>

                  <div>
                    <span className="mt-5 block text-[14px] text-gray-700">
                      Confirm New Password
                    </span>
                    <div className="relative">
                      <input
                        type={confirmPasswordVisible ? "text" : "password"}
                        name="new_password_confirmation"
                        placeholder="Enter"
                        value={formData.new_password_confirmation}
                        onChange={handleChange}
                        required
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                        className="absolute top-[63%] right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i
                          className={`bx ${confirmPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-xl`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                {error && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isChangePasswordSubmitting}
                    className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isChangePasswordSubmitting ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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
