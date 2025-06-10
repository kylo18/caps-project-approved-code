import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import Tooltip from "./toolTip";

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

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

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

  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

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

  // Handle the logout process
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
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

        setToast({
          message: "Password changed successfully!",
          type: "success",
          show: true,
        });

        setShowChangePassword(false);
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

    const payload = {};
    Object.entries(profileFormData).forEach(([key, value]) => {
      if (value.trim() !== "") {
        payload[key] = value.trim();
      }
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/user/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setToast({
          message: "Profile updated successfully!",
          type: "success",
          show: true,
        });
        // Update local user info
        setUserInfo((prev) => ({
          ...prev,
          fullName: `${payload.firstName} ${payload.lastName}`.trim(),
          email: payload.email,
          userCode: payload.userCode,
        }));
        setTimeout(() => setShowProfileModal(false), 0);
      } else {
        setProfileError(data.message || "Failed to update profile.");
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

  return (
    <div>
      <div className="open-sans fixed top-0 left-0 z-52 flex h-[44px] w-full items-center justify-between border-b border-gray-300 bg-white px-6 py-[10px]">
        <div className="flex items-center">
          {isTutorialPage && (
            <div className="flex items-center gap-2">
              <img
                src={collegeLogo}
                alt="College Logo"
                className="size-[30px]"
              />
              <span className="font-sans text-lg font-semibold text-black">
                CAPS
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-gray-500">{title}</span>

          {/* Help Button */}
          <Tooltip
            content="Need help?"
            placement="bottom"
            trigger="hover"
            className="bg-gray-800"
          >
            <button
              onClick={() =>
                window.open(
                  "https://docs.google.com/spreadsheets/d/1G3-PccAywmrd9QU94p9DJ58JYBg5jeyB/edit?gid=1756766640#gid=1756766640",
                  "_blank",
                )
              }
              className="border-color flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-black hover:bg-gray-200"
            >
              <i className="bx bx-message-question-mark text-md ml-1"></i>
              <span className="pr-1.5 text-[14px]">Help</span>
            </button>
          </Tooltip>

          {/* Three-dot Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="-mr-4 flex cursor-pointer items-center justify-end rounded-full p-0.5 hover:bg-gray-300"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="bx bx-dots-vertical-rounded text-[25px]"></i>
            </button>

            {/* Dropdown Buttons */}

            {dropdownOpen && (
              <div className="absolute top-[44px] right-[-10px] w-60 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
                <div className="flex items-center gap-3 border-gray-200 px-2 py-3">
                  <div className="flex h-8 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                    {userInfo?.fullName
                      ? (() => {
                          const parts = userInfo.fullName.trim().split(" ");
                          const firstInitial = parts[0]?.[0] || "";
                          const lastInitial =
                            parts.length > 1 ? parts[parts.length - 1][0] : "";
                          return (firstInitial + lastInitial).toUpperCase();
                        })()
                      : "NN"}
                  </div>

                  <div className="flex w-full flex-col overflow-hidden text-sm">
                    <span className="font-inter overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
                      {userInfo?.fullName || "Loading..."}
                    </span>
                    <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500">
                      {userInfo?.email || "loading@email.com"}
                    </span>
                  </div>
                </div>

                <div className="mx-1 h-[1px] bg-[rgb(200,200,200)]" />
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-user-circle mr-2 text-[16px]"></i> Edit
                  Profile
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowChangePassword((prev) => !prev);
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-lock-open-alt mr-2 text-[16px]"></i>{" "}
                  Change Password
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
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-arrow-out-right-square-half mr-2 text-[16px]"></i>{" "}
                  Log-out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePassword && (
        <>
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              {/* Header */}
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  Change Password
                </h2>

                <button
                  onClick={() => {
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
                  }}
                  className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                  title="Close"
                >
                  <i className="bx bx-x text-[20px]"></i>
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
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {showProfileModal && (
        <>
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetProfileForm();
                  setProfileError("");
                  setProfileSuccess("");
                }}
                className="absolute top-2 right-5 cursor-pointer text-3xl text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                &times;
              </button>

              {/* Profile Picture and Name */}
              <div className="mb-6 flex items-center gap-4 p-4">
                <div className="relative">
                  <div className="flex size-11 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white">
                    {userInfo?.fullName
                      ? (() => {
                          const parts = userInfo.fullName.trim().split(" ");
                          const firstInitial = parts[0]?.[0] || "";
                          const lastInitial =
                            parts.length > 1 ? parts[parts.length - 1][0] : "";
                          return (firstInitial + lastInitial).toUpperCase();
                        })()
                      : "NN"}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {userInfo?.fullName || "loading.."}
                  </div>
                  <div className="text-sm text-gray-500">
                    {userInfo?.email || "loading@gmail.com"}
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

              <form className="rounded-b-md" onSubmit={handleProfileSubmit}>
                <div className="mb-6 space-y-4">
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
                </div>

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
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
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lightbox-bg fixed inset-0 z-100 hidden flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
            <div className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-4 shadow-lg min-[448px]:rounded-md">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetProfileForm();
                  setProfileError("");
                  setProfileSuccess("");
                }}
                className="absolute top-2 right-5 text-3xl text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                &times;
              </button>

              {/* Profile Picture and Name */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative">
                  <div className="flex size-11 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white">
                    {userInfo?.fullName
                      ? (() => {
                          const parts = userInfo.fullName.trim().split(" ");
                          const firstInitial = parts[0]?.[0] || "";
                          const lastInitial =
                            parts.length > 1 ? parts[parts.length - 1][0] : "";
                          return (firstInitial + lastInitial).toUpperCase();
                        })()
                      : "NN"}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {userInfo?.fullName || "loading.."}
                  </div>
                  <div className="text-sm text-gray-500">
                    {userInfo?.email || "loading@gmail.com"}
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

              <form className="rounded-b-md" onSubmit={handleProfileSubmit}>
                <div className="mb-6 space-y-4">
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
                          Email
                        </span>
                        <input
                          className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          type="email"
                          name="email"
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
                </div>

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
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
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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

      {isLoggingOut && <LoadingOverlay show={isLoggingOut} />}
      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
            toast.show ? "opacity-100" : "opacity-0"
          } ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-x-circle text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
