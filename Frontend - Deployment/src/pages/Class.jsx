import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import ArchiveIcon from "/src/assets/symbols/archive.svg";
import SearchBar, { SearchBarTrigger } from "../components/SearchBar";
import CreateClassModal from "../components/CreateClassModal";
import EditClassModal from "../components/EditClassModal";
import ConfirmModal from "../components/confirmModal";
import WarningModal from "../components/WarningModal";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";
import ClassWalkthroughModal from "../components/ClassWalkthroughModal";

import BlueBackground from "/src/assets/backgrounds/blue.png";
import GreenBackground from "/src/assets/backgrounds/green.png";
import RedBackground from "/src/assets/backgrounds/red.png";
import YellowBackground from "/src/assets/backgrounds/yellow.png";
import PurpleBackground from "/src/assets/backgrounds/purple.png";
import CyanBackground from "/src/assets/backgrounds/cyan.png";

// Array of background images for header sections
const headerBackgrounds = [
  BlueBackground,
  GreenBackground,
  RedBackground,
  YellowBackground,
  PurpleBackground,
  CyanBackground,
];

// Function to get a consistent background for a class (based on class ID)
const getHeaderBackground = (classId) => {
  if (!classId) return headerBackgrounds[0];
  // Use class ID to get a consistent background for the same class
  const index = classId % headerBackgrounds.length;
  return headerBackgrounds[index];
};

const Class = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingClass, setArchivingClass] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [unenrollingClass, setUnenrollingClass] = useState(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [classCodeError, setClassCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const joinInputRefs = useRef([]);

  /* Walkthrough — auto-open once per device (non-students only) */
  const WALKTHROUGH_KEY = "class_walkthrough_v1_seen";
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const handleJoinOtpChange = (index, value) => {
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (value && !cleanValue) return;

    const newCodeArray = classCode
      .split("")
      .concat(Array(6).fill(""))
      .slice(0, 6);

    if (cleanValue.length > 1) {
      const pasted = cleanValue.slice(0, 6);
      setClassCode(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      joinInputRefs.current[nextIndex]?.focus();
      return;
    }

    newCodeArray[index] = cleanValue;
    const newCode = newCodeArray.join("").trim();
    setClassCode(newCode);
    setClassCodeError("");

    if (cleanValue && index < 5) {
      joinInputRefs.current[index + 1]?.focus();
    }
  };

  const handleJoinOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!classCode[index] && index > 0) {
        joinInputRefs.current[index - 1]?.focus();
        const newCodeArray = classCode
          .split("")
          .concat(Array(6).fill(""))
          .slice(0, 6);
        newCodeArray[index - 1] = "";
        setClassCode(newCodeArray.join("").trim());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      joinInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      joinInputRefs.current[index + 1]?.focus();
    }
  };

  // Get user role on mount; also trigger walkthrough for non-students
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      const role = user.roleID ?? user.roleId;
      setUserRole(role);
      // Only show walkthrough for non-student roles
      if (role !== 1 && !localStorage.getItem(WALKTHROUGH_KEY)) {
        setShowWalkthrough(true);
        localStorage.setItem(WALKTHROUGH_KEY, "true");
      }
    }
  }, []);

  // Fetch classes on component mount and after successful creation
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        // Use different endpoint for students
        const endpoint =
          userRole === 1
            ? `${apiUrl}/classes/my-classes`
            : `${apiUrl}/classes/index`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }

          let errorMessage = "Failed to load classes.";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData?.message || errorData?.error || errorMessage;
          } catch (parseError) {
            errorMessage = `HTTP error! Status: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch classes");
        }

        if (!Array.isArray(data.classes)) {
          console.error("Unexpected classes data format:", data);
          throw new Error("Invalid response format.");
        }

        setClasses(data.classes || []);
      } catch (err) {
        setError(err.message || "Failed to load classes. Please try again.");
        console.error("Error loading classes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userRole !== null) {
      fetchClasses();
    }
  }, [userRole, apiUrl]);

  // Filter classes based on search term (show all classes including inactive)
  const filteredClasses = classes.filter((cls) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      cls.className?.toLowerCase().includes(term) ||
      cls.classCode?.toLowerCase().includes(term)
    );
  });

  // Refresh classes after successful creation or update
  const refreshClasses = () => {
    // Refetch classes
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          return;
        }

        // Use different endpoint for students
        const endpoint =
          userRole === 1
            ? `${apiUrl}/classes/my-classes`
            : `${apiUrl}/classes/index`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.classes)) {
            setClasses(data.classes || []);
          }
        }
      } catch (err) {
        console.error("Error refreshing classes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  };

  const resetJoinForm = () => {
    setClassCode("");
    setClassCodeError("");
    setIsJoining(false);
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setClassCodeError("");

    // Validate class code
    const trimmedCode = classCode.trim().toUpperCase();
    if (!trimmedCode) {
      showToast("Please enter a class code", "error");
      setIsJoining(false);
      return;
    }

    if (trimmedCode.length !== 6) {
      showToast("Class code must be 6 characters", "error");
      setIsJoining(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsJoining(false);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/join-by-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classCode: trimmedCode,
        }),
      });

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        sessionStorage.removeItem("token");
        setIsJoining(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          showToast(errorMessages || "Validation failed", "error");
        } else if (response.status === 403) {
          showToast(data.message || "Only students can join classes.", "error");
        } else if (response.status === 404) {
          showToast(
            data.message || "Invalid class code or class is not active.",
            "error",
          );
        } else {
          showToast(
            data.message || "Failed to join class. Please try again.",
            "error",
          );
        }
        setIsJoining(false);
        return;
      }

      if (data.success) {
        showToast(data.message || "Successfully joined the class!", "success");
        // Reset form and close modal
        resetJoinForm();
        setShowJoinForm(false);
        // Refresh classes list
        refreshClasses();
      } else {
        showToast(
          data.message || "Failed to join class. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error joining class:", error);
      showToast("An error occurred while joining the class.", "error");
    } finally {
      setIsJoining(false);
    }
  };

  const handleClassCreated = () => {
    refreshClasses();
  };

  const handleEditClick = (classItem, e) => {
    e.stopPropagation(); // Prevent card click
    setEditingClass(classItem);
    setIsEditModalOpen(true);
  };

  const handleClassUpdated = () => {
    refreshClasses();
  };

  const handleArchiveClick = (classItem, e) => {
    e.stopPropagation(); // Prevent card click
    setArchivingClass(classItem);
    setIsArchiveModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archivingClass) return;

    setIsArchiving(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsArchiving(false);
        setIsArchiveModalOpen(false);
        setArchivingClass(null);
        return;
      }

      const classID = archivingClass.classID || archivingClass.id;
      if (!classID) {
        showToast("Unable to determine class ID for archiving.", "error");
        setIsArchiving(false);
        setIsArchiveModalOpen(false);
        setArchivingClass(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/archive/${classID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let message =
          "There was a problem archiving the class. Please try again.";

        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ignore JSON parse error and use default message
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data.success) {
        showToast(data.message || "Class archived successfully.", "success");
        // Refresh the class list
        refreshClasses();
      } else {
        showToast(
          data.message || "Failed to archive class. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem archiving the class. Please try again.",
        "error",
      );
    } finally {
      setIsArchiving(false);
      setIsArchiveModalOpen(false);
      setArchivingClass(null);
    }
  };

  const handleUnenrollClick = (classItem, e) => {
    e.stopPropagation(); // Prevent card click
    setUnenrollingClass(classItem);
    setIsUnenrollModalOpen(true);
  };

  const handleUnenrollConfirm = async () => {
    if (!unenrollingClass) return;

    setIsUnenrolling(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsUnenrolling(false);
        setIsUnenrollModalOpen(false);
        setUnenrollingClass(null);
        return;
      }

      const classID = unenrollingClass.classID || unenrollingClass.id;
      if (!classID) {
        showToast("Unable to determine class ID for unenrollment.", "error");
        setIsUnenrolling(false);
        setIsUnenrollModalOpen(false);
        setUnenrollingClass(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/unenroll`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let message =
          "There was a problem unenrolling from the class. Please try again.";

        if (response.status === 401) {
          sessionStorage.removeItem("token");
          message = "Your session has expired. Please log in again.";
        } else if (response.status === 403) {
          message = "Only students can unenroll from classes.";
        } else if (response.status === 404) {
          message = "You are not enrolled in this class.";
        } else {
          try {
            const data = await response.json();
            if (data?.message) {
              message = data.message;
            }
          } catch {
            // ignore JSON parse error and use default message
          }
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data.success) {
        showToast(
          data.message || "Successfully unenrolled from the class.",
          "success",
        );
        // Refresh the class list
        refreshClasses();
      } else {
        showToast(
          data.message || "Failed to unenroll from class. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem unenrolling from the class. Please try again.",
        "error",
      );
    } finally {
      setIsUnenrolling(false);
      setIsUnenrollModalOpen(false);
      setUnenrollingClass(null);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {showWalkthrough && (
        <ClassWalkthroughModal onClose={() => setShowWalkthrough(false)} />
      )}
      <div className="scrollbar-hide mt-10 flex min-h-screen flex-1 flex-col gap-6 overflow-y-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-0 [&::-webkit-scrollbar]:hidden">
        <div className="min-w-0 space-y-4 px-4 pt-4 md:px-6 md:pt-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search classes..."
            mobileCollapsible
            showMobileSearch={showMobileSearch}
            onCloseMobileSearch={() => setShowMobileSearch(false)}
            inputRef={mobileSearchInputRef}
          />

          <div className="my-4 hidden h-px bg-gray-200 md:block" />

          {/* Header with title and action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="outfit-500 text-[18px] break-words text-black">
                {searchTerm.trim()
                  ? `Search results for "${searchTerm}"`
                  : `My classes (${filteredClasses.length})`}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1">
              {userRole !== 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Create class"
                    className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:text-[14px]"
                  >
                    <i className="bx bx-plus text-[20px]"></i>
                  </button>
                  <SearchBarTrigger
                    isOpen={showMobileSearch}
                    onClick={() => setShowMobileSearch((prev) => !prev)}
                    title="Search classes"
                  />
                  <button
                    type="button"
                    title="Archives"
                    onClick={() => navigate("/archived-class")}
                    className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:text-[14px]"
                  >
                    <img
                      src={ArchiveIcon}
                      alt="archived classes"
                      loading="lazy"
                      decoding="async"
                      className="size-[22px]"
                    />
                  </button>
                </>
              )}

              {userRole === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinForm(true);
                    resetJoinForm();
                  }}
                  className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:text-[14px]"
                >
                  <i className="bxx bx-plus text-[20px]"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Classes list / empty state */}
        <div>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="outfit-400 flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="px-4">
              <div className="outfit-400 flex h-80 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 py-16 md:h-130 md:border">
                <div className="text-center">
                  <img
                    src={emptyImage}
                    alt="No classes available"
                    loading="lazy"
                    decoding="async"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="outfit-400 text-[14px] text-gray-600">
                    {searchTerm.trim()
                      ? `No classes found matching "${searchTerm}"`
                      : userRole === 1
                        ? "No classes yet. Use the Join a Class button to join your first class."
                        : "No classes yet. Use the Create class button to add your first one."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Classes Grid - Dynamic columns, full width on mobile */}
              <div className="mt-4 grid grid-cols-1 space-y-2 space-x-2 px-2 md:grid-cols-[repeat(auto-fill,minmax(20rem,20rem))] md:gap-2 lg:px-4">
                {filteredClasses.map((classItem) => {
                  const headerBackground = getHeaderBackground(
                    classItem.classID || classItem.id,
                  );

                  // Format dates
                  const createdDate =
                    classItem.created_at || classItem.createdAt
                      ? new Date(
                          classItem.created_at || classItem.createdAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";

                  const enrollmentCount = classItem.enrollments?.length || 0;
                  const creatorDisplayName =
                    classItem.creatorName ||
                    classItem.createdByName ||
                    (classItem.faculty
                      ? `${classItem.faculty.firstName || ""} ${classItem.faculty.lastName || ""}`.trim()
                      : "") ||
                    "Instructor";

                  return (
                    <div
                      key={classItem.classID || classItem.id}
                      className="group outfit-400 relative flex w-full flex-col overflow-hidden rounded-xl bg-transparent transition-all md:h-[250px] md:w-80 md:border md:border-gray-200 md:bg-white md:shadow-sm md:hover:shadow-xl"
                    >
                      {/* Background Image Header Section */}
                      <div
                        className="relative cursor-pointer overflow-hidden px-4 pt-4 pb-4 md:h-[150px]"
                        onClick={() => {
                          const id = classItem.classID || classItem.id;
                          if (!id) return;

                          if (userRole === 1) {
                            // Students: go to class quizzes page, pass class data for header
                            navigate(`/class/${id}/quizzes`, {
                              state: { classItem },
                            });
                          } else {
                            // Faculty/others: manage students
                            navigate(`/class/${id}/students`);
                          }
                        }}
                      >
                        <img
                          src={headerBackground}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-black/10"
                          aria-hidden="true"
                        />
                        <div className="relative z-10 pr-16 md:flex md:h-full md:flex-col md:justify-between md:pr-0">
                          <div>
                            <div className="mb-4 hidden text-xs font-medium text-white opacity-90 md:block">
                              Class
                            </div>
                            <div className="mb-4">
                              <div
                                className="min-h-0 overflow-hidden leading-6 font-semibold text-white"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                <span className="outfit-500 text-[20px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                  {classItem.className}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[12px] text-white md:hidden">
                                <i className="bx bx-history text-sm"></i>
                                <span className="truncate">
                                  {classItem.schedule || "No schedule set"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {userRole !== 1 && classItem.classCode && (
                            <div className="mt-7 inline-flex w-fit max-w-full items-center rounded-full bg-white px-3 py-0.5 md:mt-0">
                              <span className="truncate text-xs font-semibold whitespace-nowrap text-black uppercase">
                                Class Code - {classItem.classCode}
                              </span>
                            </div>
                          )}

                          {userRole === 1 && creatorDisplayName && (
                            <div className="mt-7 inline-flex w-fit max-w-full items-center rounded-full bg-white px-3 py-0.5 md:mt-0">
                              <span className="truncate text-xs font-semibold whitespace-nowrap text-black uppercase">
                                {creatorDisplayName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Edit and Archive Buttons - Top Right (only for non-students) */}
                        {userRole !== 1 && (
                          <div className="absolute top-2 right-2 z-20 hidden items-center gap-1 md:flex">
                            <button
                              onClick={(e) => handleEditClick(classItem, e)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                              title="Edit Class"
                            >
                              <i className="bx bx-edit text-lg"></i>
                            </button>
                            <button
                              onClick={(e) => handleArchiveClick(classItem, e)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                              title="Archive Class"
                            >
                              <i className="bx bx-archive text-lg"></i>
                            </button>
                          </div>
                        )}

                        {/* Unenroll Button - Top Right (only for students) */}
                        {userRole === 1 && (
                          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                            <button
                              onClick={(e) => handleUnenrollClick(classItem, e)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                              title="Unenroll from Class"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="lucide lucide-square-arrow-right-exit-icon lucide-square-arrow-right-exit"
                              >
                                <path d="M10 12h11" />
                                <path d="m17 16 4-4-4-4" />
                                <path d="M21 6.344V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.344" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {userRole !== 1 && (
                          <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white md:hidden">
                            <i className="bx bx-group text-sm"></i>
                            <span>
                              {enrollmentCount}{" "}
                              {enrollmentCount === 1 ? "Student" : "Students"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* White Body Section */}
                      <div
                        className="hidden flex-1 cursor-pointer flex-col px-4 py-4 md:flex"
                        onClick={() => {
                          const id = classItem.classID || classItem.id;
                          if (!id) return;

                          if (userRole === 1) {
                            // Students: go to class quizzes page, pass class data for header
                            navigate(`/class/${id}/quizzes`, {
                              state: { classItem },
                            });
                          } else {
                            // Faculty/others: manage students
                            navigate(`/class/${id}/students`);
                          }
                        }}
                      >
                        <div className="outfit-400 mt-2 hidden items-center gap-2 text-[12px] text-gray-700 md:flex">
                          <i className="bx bx-history text-sm text-gray-500"></i>
                          <span className="truncate">
                            {classItem.schedule || "No schedule set"}
                          </span>
                        </div>
                        {userRole !== 1 && (
                          <div className="outfit-400 hidden items-center gap-2 text-[12px] text-gray-700 md:flex">
                            <i className="bx bx-group text-sm text-gray-500"></i>
                            <span>
                              {enrollmentCount}{" "}
                              {enrollmentCount === 1 ? "Student" : "Students"}
                            </span>
                          </div>
                        )}
                        {/* Separator */}
                        <div className="mt-2 mb-3 h-px bg-gray-200"></div>
                        {/* Date Information */}
                        <div className="outfit-400 space-y-1 text-[12px] text-gray-600">
                          <div>Created: {createdDate}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="pb-28 lg:pb-6" aria-hidden="true" />
        </div>

        {/* Create Class Modal */}
        <CreateClassModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newClass) => {
            handleClassCreated();
          }}
        />

        {/* Edit Class Modal */}
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClass(null);
          }}
          onSuccess={(updatedClass) => {
            handleClassUpdated();
          }}
          classData={editingClass}
        />

        {/* Archive Confirmation Modal */}
        <ConfirmModal
          isOpen={isArchiveModalOpen}
          onClose={() => {
            setIsArchiveModalOpen(false);
            setArchivingClass(null);
          }}
          onConfirm={handleArchiveConfirm}
          message={
            archivingClass
              ? `Are you sure you want to archive "${archivingClass.className}"? This will make the class inactive and it will be moved to archived classes.`
              : "Are you sure you want to archive this class?"
          }
          isLoading={isArchiving}
        />

        {/* Unenroll Confirmation Modal */}
        <WarningModal
          isOpen={isUnenrollModalOpen}
          onClose={() => {
            setIsUnenrollModalOpen(false);
            setUnenrollingClass(null);
          }}
          title="Unenroll from Class"
          subtitle="This action cannot be undone."
          description={
            unenrollingClass ? (
              <>
                Are you sure you want to unenroll from{" "}
                <strong>{unenrollingClass.className}</strong>? You will lose
                access to all quizzes and materials in this class.
              </>
            ) : (
              "Are you sure you want to unenroll from this class?"
            )
          }
          confirmIcon={<i className="bx bx-arrow-out-right-square-half" />}
          confirmLabel="Unenroll"
          onConfirm={handleUnenrollConfirm}
          isConfirmLoading={isUnenrolling}
        />

        {/* Join Class Modal */}
        {showJoinForm && (
          <div className="outfit-400 bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-center justify-center bg-black/40">
            <div className="relative mx-4 w-full max-w-[420px] rounded-2xl bg-[#ffffff] p-8 shadow-2xl">
              {/* Header */}
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  resetJoinForm();
                }}
                className="absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-gray-400 transition-colors hover:text-gray-600"
                title="Close"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>

              {/* Icon & Title */}
              <div className="mb-6 flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                  <i className="bx bx-key text-3xl text-orange-500"></i>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[#1a1f36]">
                  Join a New Class
                </h2>
                <p className="font-outfit max-w-[280px] text-center text-[14px] leading-relaxed text-gray-500">
                  Enter the 6-character code provided by your instructor to
                  access the course materials.
                </p>
              </div>

              {/* Form content */}
              <form onSubmit={handleJoinClass}>
                <div className="mb-8">
                  <label className="mb-3 block text-center text-[11px] font-bold tracking-widest text-[#8792a2] uppercase">
                    Class Code
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <React.Fragment key={index}>
                        <input
                          ref={(el) => (joinInputRefs.current[index] = el)}
                          type="text"
                          maxLength={1}
                          className={`h-12 w-10 rounded-xl border text-center text-xl font-bold uppercase transition-all focus:border-[#e85c15] focus:ring-1 focus:ring-[#e85c15] focus:outline-none sm:h-14 sm:w-12 ${
                            classCode[index]
                              ? "border-gray-400 text-[#1a1f36]"
                              : "border-gray-300 text-gray-400"
                          }`}
                          value={classCode[index] || ""}
                          onChange={(e) =>
                            handleJoinOtpChange(index, e.target.value.slice(-1))
                          }
                          onKeyDown={(e) => handleJoinOtpKeyDown(index, e)}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white transition-all duration-200 ${
                    isJoining
                      ? "cursor-not-allowed bg-orange-400"
                      : classCode.length === 6
                        ? "bg-[#e85c15] hover:bg-[#d45110] active:scale-[0.98]"
                        : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"
                  } mb-6 shadow-md disabled:opacity-70`}
                >
                  {isJoining ? (
                    <span className="loader-white"></span>
                  ) : (
                    <>
                      Join Class{" "}
                      <i className="bx bx-right-arrow-alt text-xl"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Floating Help button — opens walkthrough */}
      <div className="fixed right-4 bottom-[110px] z-50 md:right-6 md:bottom-6">
        <button
          type="button"
          onClick={() => setShowWalkthrough(true)}
          title="How classes work"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 active:scale-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default Class;
