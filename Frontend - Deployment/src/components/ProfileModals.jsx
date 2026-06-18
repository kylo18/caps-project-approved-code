import { useState, useEffect, useRef } from "react";
import { getToken } from "../utils/authStorage";
import { normalizeUserProfile } from "../utils/userProfileUtils";
import LoadingOverlay from "./loadingOverlay";
import WarningModal from "./WarningModal";

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

const CustomSelect = ({
  value,
  options,
  onChange,
  placeholder,
  required,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition outline-none hover:border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
      >
        <span className={selectedOption ? "" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i
          className={`bx bx-chevron-down text-xl text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        ></i>
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 left-0 z-50 ${placement === "top" ? "bottom-full mb-1" : "top-full mt-1"} outfit-500 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg`}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange({ target: { name: required, value: option.value } });
                setIsOpen(false);
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 ${String(value) === String(option.value) ? "bg-orange-50 font-medium text-orange-700" : "text-gray-700"}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ProfileModals
 *
 * Shared component that renders:
 *  - Profile / Edit modal
 *  - Change Password modal
 *
 * Props:
 *  - showProfileModal: boolean
 *  - setShowProfileModal: fn
 *  - showChangePassword: boolean
 *  - setShowChangePassword: fn
 *  - userInfo: object | null
 *  - setUserInfo: fn   (so we can update name/email in-place after save)
 *  - isLoadingProfile: boolean
 *  - avatarColor: string (Tailwind class, e.g. "bg-orange-500")
 *  - showToast: fn (from useToast)
 *
 * All internal state (form fields, visibility toggles, etc.) is self-contained.
 */
const ProfileModals = ({
  showProfileModal,
  setShowProfileModal,
  showChangePassword,
  setShowChangePassword,
  userInfo,
  setUserInfo,
  isLoadingProfile = false,
  avatarColor,
  showToast,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isDean = Number(userInfo?.roleID) === 4;

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userCode: "",
    campusID: "",
    programID: "",
  });
  const [programs, setPrograms] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [wasProfileModalOpen, setWasProfileModalOpen] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const isModalLoading = isLoadingProfile || (isDean && isLoadingOptions);

  // ── Change password form ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [isChangePasswordSubmitting, setIsChangePasswordSubmitting] =
    useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const profileModalRef = useRef(null);
  const changePasswordModalRef = useRef(null);

  // ── Populate form when userInfo loads ────────────────────────────────────
  const resetProfileForm = () => {
    if (userInfo) {
      const nameParts = (userInfo.fullName || "").trim().split(" ");
      setProfileFormData({
        firstName: userInfo.firstName || nameParts[0] || "",
        lastName: userInfo.lastName || nameParts.slice(1).join(" ") || "",
        email: userInfo.email || "",
        userCode: userInfo.userCode || "",
        campusID: userInfo.campusID != null ? String(userInfo.campusID) : "",
        programID: userInfo.programID != null ? String(userInfo.programID) : "",
      });
    }
  };

  useEffect(() => {
    if (userInfo) resetProfileForm();
  }, [userInfo]);

  useEffect(() => {
    if (!showProfileModal || !isDean) return;

    const fetchDeanOptions = async () => {
      setIsLoadingOptions(true);
      const token = getToken();

      try {
        const [programsRes, campusesRes] = await Promise.all([
          fetch(`${apiUrl}/programs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/campuses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const programsData = await programsRes.json();
        const campusesData = await campusesRes.json();

        if (programsRes.ok) {
          const fetchedPrograms = programsData.data || [];
          setPrograms(fetchedPrograms.filter((p) => p.programName?.toUpperCase() !== "GE"));
        }

        if (campusesRes.ok) {
          setCampuses(campusesData.data || []);
        }
      } catch (err) {
        console.error("Error fetching profile options:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchDeanOptions();
  }, [showProfileModal, isDean, apiUrl]);

  // ── Prevent background scrolling ─────────────────────────────────────────
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

  // ── Outside click to close (mobile ≤448px) ───────────────────────────────
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

  // ── Profile handlers ──────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildProfilePayload = () => {
    const payload = {
      firstName: profileFormData.firstName.trim(),
      lastName: profileFormData.lastName.trim(),
      email: profileFormData.email.trim(),
      userCode: profileFormData.userCode.trim(),
    };

    if (isDean) {
      if (profileFormData.campusID) {
        payload.campusID = Number(profileFormData.campusID);
      }
      if (profileFormData.programID) {
        payload.programID = Number(profileFormData.programID);
      }
    }

    return payload;
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsProfileSubmitting(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const profilePayload = buildProfilePayload();

      const token = getToken();
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
        const updatedProfile = normalizeUserProfile(
          profileData.data || profileData,
        );
        setUserInfo(updatedProfile);
        setShowSaveConfirm(false);
        setTimeout(() => setShowProfileModal(false), 0);
      } else {
        setShowSaveConfirm(false);
        let errorMessage = profileData.message || "Failed to update profile.";
        if (profileData.errors && profileData.errors.userCode) {
          errorMessage = profileData.errors.userCode[0];
        } else if (profileData.errors) {
          errorMessage = Object.values(profileData.errors).flat()[0] || errorMessage;
        }
        setProfileError(errorMessage);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setShowSaveConfirm(false);
      setProfileError("Something went wrong. Please try again later.");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // ── Change password handlers ──────────────────────────────────────────────
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
      setTimeout(() => setShowProfileModal(true), 50);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          Authorization: `Bearer ${getToken()}`,
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

  // ── Avatar initials helper ────────────────────────────────────────────────
  const getPreviewName = () => {
    const name =
      `${profileFormData.firstName} ${profileFormData.lastName}`.trim();
    return name || userInfo?.fullName || "";
  };

  const getPreviewInitials = () => {
    const name = getPreviewName();
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  const getPreviewProgramName = () => {
    if (isDean && profileFormData.programID) {
      const selectedProgram = programs.find(
        (program) =>
          String(program.programID) === String(profileFormData.programID),
      );
      if (selectedProgram) return selectedProgram.programName;
    }

    return userInfo?.programName || "";
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setShowSaveConfirm(false);
    resetProfileForm();
    setProfileError("");
    setProfileSuccess("");
  };

  const fieldLabelClass = "mb-1.5 block text-xs text-gray-500";
  const fieldInputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-200";
  const readOnlyInputClass = `${fieldInputClass} cursor-default bg-gray-50 text-gray-600`;
  const readOnlyFieldClass =
    "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Profile / Edit Modal ── */}
      {showProfileModal && (
        <>
          <div className="outfit-400 bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center p-4 min-[640px]:items-center">
            <div
              ref={profileModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <LoadingOverlay
                show={isModalLoading}
                message="Loading profile..."
                contained
              />

              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit your profile
                </h2>
                <button
                  type="button"
                  onClick={handleCloseProfile}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>

              <form
                onSubmit={handleProfileSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[6fr_4fr]">
                  <div className="space-y-4 border-gray-200 px-6 py-5 md:border-r md:border-dashed">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabelClass}>Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileFormData.firstName}
                          onChange={handleProfileChange}
                          required
                          className={fieldInputClass}
                        />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileFormData.lastName}
                          onChange={handleProfileChange}
                          required
                          className={fieldInputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabelClass}>Gmail</label>
                      <input
                        type="email"
                        name="email"
                        value={profileFormData.email}
                        onChange={handleProfileChange}
                        required
                        className={fieldInputClass}
                      />
                    </div>

                    <div>
                      <label className={fieldLabelClass}>User Code</label>
                      <input
                        type="text"
                        name="userCode"
                        value={profileFormData.userCode}
                        onChange={handleProfileChange}
                        required
                        className={fieldInputClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabelClass}>Campus</label>
                        {isDean ? (
                          isLoadingOptions ? (
                            <div className={readOnlyFieldClass}>
                              <span className="text-gray-500">
                                Loading campuses...
                              </span>
                              <i className="bx bx-loader-alt animate-spin text-lg text-gray-400"></i>
                            </div>
                          ) : (
                            <CustomSelect
                              required="campusID"
                              value={profileFormData.campusID}
                              onChange={handleProfileChange}
                              placeholder="Select campus"
                              placement="top"
                              options={campuses.map((campus) => ({
                                value: campus.campusID,
                                label: campus.campusName,
                              }))}
                            />
                          )
                        ) : (
                          <div className={readOnlyFieldClass}>
                            <span className="truncate">
                              {userInfo?.campusName || "—"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Program</label>
                        {isDean ? (
                          isLoadingOptions ? (
                            <div className={readOnlyFieldClass}>
                              <span className="text-gray-500">
                                Loading programs...
                              </span>
                              <i className="bx bx-loader-alt animate-spin text-lg text-gray-400"></i>
                            </div>
                          ) : (
                            <CustomSelect
                              required="programID"
                              value={profileFormData.programID}
                              onChange={handleProfileChange}
                              placeholder="Select program"
                              placement="top"
                              options={programs.map((program) => ({
                                value: program.programID,
                                label: program.programName,
                              }))}
                            />
                          )
                        ) : (
                          <div className={readOnlyFieldClass}>
                            <span className="truncate">
                              {userInfo?.programName || "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {profileError && (
                      <div className="rounded-lg bg-red-50 p-2 text-center text-xs text-red-500">
                        {profileError}
                      </div>
                    )}

                    {!isDean && (
                      <div className="rounded-xl p-1 text-[12px]">
                        <div className="flex gap-2">
                          <i className="bx bx-info-circle text-lg"></i>
                          <p>Only the Dean can edit your program and campus.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden flex-col items-center justify-center px-6 py-8 text-center md:flex">
                    <span className="mb-6 text-xs text-gray-400">Preview</span>

                    <div className="relative mb-5">
                      <div
                        className={`flex size-24 items-center justify-center rounded-full text-2xl font-semibold text-white ${userInfo ? avatarColor : "bg-gray-300"}`}
                      >
                        {getPreviewInitials() ? (
                          getPreviewInitials()
                        ) : (
                          <span className="inline-block size-24 animate-pulse rounded-full bg-gray-300"></span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      {getPreviewName() || (
                        <span className="inline-block h-6 w-32 animate-pulse rounded bg-gray-200"></span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {getPreviewProgramName() || (
                        <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-200"></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={handleOpenChangePassword}
                    className="mb-4 hidden cursor-pointer text-sm font-medium text-gray-600 transition hover:text-gray-900 md:order-none lg:mb-0 lg:block"
                  >
                    Change password
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenChangePassword}
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition outline-none hover:border-gray-300 hover:bg-gray-100 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 lg:hidden"
                  >
                    Change password
                  </button>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseProfile}
                      className="cursor-pointer rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProfileSubmitting || isModalLoading}
                      className="cursor-pointer rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProfileSubmitting ? (
                        <span className="loader-white inline-block"></span>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <WarningModal
        isOpen={showSaveConfirm}
        onClose={() => !isProfileSubmitting && setShowSaveConfirm(false)}
        title="Save profile changes?"
        description="Are you sure you want to save your profile changes? Your updated details will be applied to your account."
        confirmLabel="Save changes"
        confirmIcon={<i className="bx bx-check text-lg" />}
        headerIcon="bx-save"
        onConfirm={handleConfirmSave}
        isConfirmLoading={isProfileSubmitting}
      />

      {/* ── Change Password Modal ── */}
      {showChangePassword && (
        <>
          <div className="outfit-400 lightbox-bg bg-opacity-40 fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              ref={changePasswordModalRef}
              className="animate-fade-in-up edit-profile-modal-scrollbar relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-xl"
            >
              {/* Close button */}
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
                    className={`h-9 cursor-pointer rounded-lg px-5 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${
                      isChangePasswordSubmitting
                        ? "cursor-not-allowed bg-gray-500"
                        : "bg-orange-500 hover:bg-orange-700 active:scale-98"
                    } disabled:opacity-50`}
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
    </>
  );
};

export default ProfileModals;
export {
  AVATAR_COLORS,
  getRandomAvatarColor,
  getAvatarColorKey,
  getPersistedAvatarColor,
  setPersistedAvatarColor,
};

export function clearPersistedAvatarColor(userInfo) {
  const key = getAvatarColorKey(userInfo);
  localStorage.removeItem("avatarColor_" + key);
}
