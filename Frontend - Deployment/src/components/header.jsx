import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import { Tooltip } from "flowbite-react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

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
      setIsLoggingOut(true);
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
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
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
            content={
              title === "student"
                ? "Help not available for students"
                : "Need help?"
            }
            placement="bottom"
            trigger="hover"
            className="bg-gray-800"
          >
            <button
              onClick={() => {
                if (title !== "Student") {
                  window.open(
                    "https://docs.google.com/spreadsheets/d/1G3-PccAywmrd9QU94p9DJ58JYBg5jeyB/edit?gid=1756766640#gid=1756766640",
                    "_blank",
                  );
                } else {
                  alert("Under Maintenance");
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
                  <div
                    className={`flex h-8 w-10 items-center justify-center rounded-full ${userInfo ? "bg-orange-500" : "bg-gray-300"} text-sm font-bold text-white`}
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
                    <span className="font-inter overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
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
                  <i className="bx bx-user-circle mr-2 text-[16px]"></i> Edit
                  Profile
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
                  {isLoggingOut ? (
                    <div className="flex items-center justify-center">
                      <span className="">Logging out...</span>
                    </div>
                  ) : (
                    "Logout"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <>
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="edit-profile-modal-scrollbar relative mx-0 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white px-6 py-4 shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetProfileForm();
                  setProfileError("");
                  setProfileSuccess("");
                }}
                className="absolute top-2 right-5 cursor-pointer text-3xl text-gray-700 hover:text-gray-700"
              >
                <Tooltip
                  content="Close"
                  placement="bottom"
                  trigger="hover"
                  className="bg-gray-800"
                >
                  <i className="bx bx-x text-[20px]"></i>
                </Tooltip>
              </button>

              {/* Profile Picture and Name */}
              <div className="mb-3 flex items-center gap-4 p-4">
                <div className="relative">
                  <div
                    className={`flex size-11 items-center justify-center rounded-full ${userInfo ? "bg-orange-500" : "bg-gray-300"} font-bold text-white`}
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
          <div className="font-inter lightbox-bg bg-opacity-40 fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              {/* Header */}
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  Change Password
                </h2>

                <button
                  onClick={handleCloseChangePassword}
                  className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                >
                  <Tooltip
                    content="Close"
                    placement="bottom"
                    trigger="hover"
                    className="bg-gray-800"
                  >
                    <i className="bx bx-x text-[20px]"></i>
                  </Tooltip>
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

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default AdminHeader;
