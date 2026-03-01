import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/confirmModal";
import SearchBar, { SearchBarTrigger } from "../components/SearchBar";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";

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

const ArchivedClass = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const [archivedClasses, setArchivedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoringClass, setRestoringClass] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch archived classes on component mount
  useEffect(() => {
    const fetchArchivedClasses = async () => {
      setIsLoading(true);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const response = await fetch(`${apiUrl}/classes/archived`, {
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

          let errorMessage = "Failed to load archived classes.";
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
          throw new Error(data.message || "Failed to fetch archived classes");
        }

        if (!Array.isArray(data.classes)) {
          console.error("Unexpected classes data format:", data);
          throw new Error("Invalid response format.");
        }

        setArchivedClasses(data.classes || []);
      } catch (err) {
        const msg =
          err.message || "Failed to load archived classes. Please try again.";
        showToast(msg, "error");
        console.error("Error loading archived classes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedClasses();
  }, []);

  // Filter archived classes based on search term
  const filteredArchived = archivedClasses.filter((cls) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      cls.className?.toLowerCase().includes(term) ||
      cls.classCode?.toLowerCase().includes(term) ||
      cls.subject?.subjectCode?.toLowerCase().includes(term) ||
      cls.subject?.subjectName?.toLowerCase().includes(term)
    );
  });

  // Refresh archived classes list
  const refreshArchivedClasses = () => {
    const fetchArchivedClasses = async () => {
      setIsLoading(true);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          return;
        }

        const response = await fetch(`${apiUrl}/classes/archived`, {
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
            setArchivedClasses(data.classes || []);
          }
        }
      } catch (err) {
        console.error("Error refreshing archived classes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedClasses();
  };

  const handleRestoreClick = (classItem, e) => {
    e.stopPropagation(); // Prevent card click
    setRestoringClass(classItem);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!restoringClass) return;

    setIsRestoring(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsRestoring(false);
        setIsRestoreModalOpen(false);
        setRestoringClass(null);
        return;
      }

      const classID = restoringClass.classID || restoringClass.id;
      if (!classID) {
        showToast("Unable to determine class ID for restoring.", "error");
        setIsRestoring(false);
        setIsRestoreModalOpen(false);
        setRestoringClass(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/unarchive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let message =
          "There was a problem restoring the class. Please try again.";

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
        showToast(data.message || "Class restored successfully.", "success");
        // Refresh the archived classes list
        refreshArchivedClasses();
      } else {
        showToast(
          data.message || "Failed to restore class. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem restoring the class. Please try again.",
        "error",
      );
    } finally {
      setIsRestoring(false);
      setIsRestoreModalOpen(false);
      setRestoringClass(null);
    }
  };

  const handleDeleteClick = (classItem, e) => {
    e.stopPropagation(); // Prevent card click
    setDeletingClass(classItem);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;

    setIsDeleting(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setDeletingClass(null);
        return;
      }

      const classID = deletingClass.classID || deletingClass.id;
      if (!classID) {
        showToast("Unable to determine class ID for deletion.", "error");
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setDeletingClass(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/destroy/${classID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let message =
          "There was a problem deleting the class. Please try again.";

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
        showToast(data.message || "Class deleted successfully.", "success");
        // Refresh the archived classes list
        refreshArchivedClasses();
      } else {
        showToast(
          data.message || "Failed to delete class. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem deleting the class. Please try again.",
        "error",
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingClass(null);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="scrollbar-hide mt-10 flex h-screen flex-1 flex-col gap-6 overflow-y-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-0 [&::-webkit-scrollbar]:hidden">
        <div className="min-w-0 space-y-4 px-6 pt-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search archived classes..."
            mobileCollapsible
            showMobileSearch={showMobileSearch}
            onCloseMobileSearch={() => setShowMobileSearch(false)}
            inputRef={mobileSearchInputRef}
          />

          <div className="my-4 hidden h-px bg-gray-200 md:block" />

          {/* Header */}
          <div className="-mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/class")}
                className="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-xl p-2 text-gray-800 transition-colors hover:bg-gray-100"
                aria-label="Back to classes"
              >
                <i className="bx bx-arrow-left-stroke text-2xl" />
              </button>
              <p className="outfit-500 min-w-0 text-[16px] break-words text-black">
                {searchTerm.trim()
                  ? `Search results for "${searchTerm}"`
                  : `Archived classes (${filteredArchived.length})`}
              </p>
            </div>
            <SearchBarTrigger
              isOpen={showMobileSearch}
              onClick={() => setShowMobileSearch((prev) => !prev)}
              title="Search archived classes"
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Archived classes list / empty state */}
        <div>
          {isLoading ? (
            <div className="outfit-400 flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-[14px] text-gray-600">
                  Loading archived classes...
                </p>
              </div>
            </div>
          ) : filteredArchived.length === 0 ? (
            <div className="outfit-400 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
              <div className="text-center">
                <img
                  src={emptyImage}
                  alt="No archived classes available"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="outfit-400 text-[14px] text-gray-600">
                  {searchTerm.trim()
                    ? `No archived classes found matching "${searchTerm}"`
                    : "You don't have any archived classes yet."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Classes Grid - Dynamic columns, full width on mobile */}
              <div className="mt-4 grid grid-cols-1 space-y-2 space-x-2 px-2 md:grid-cols-[repeat(auto-fill,minmax(20rem,20rem))] md:gap-2 lg:px-4">
                {filteredArchived.map((classItem) => {
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

                  const archivedDate =
                    classItem.updated_at || classItem.updatedAt
                      ? new Date(
                          classItem.updated_at || classItem.updatedAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";

                  const enrollmentCount = classItem.enrollments?.length || 0;

                  return (
                    <div
                      key={classItem.classID || classItem.id}
                      className="group outfit-400 relative flex w-full flex-col overflow-hidden rounded-xl bg-transparent transition-all md:h-[320px] md:w-80 md:border md:border-gray-200 md:bg-white md:shadow-sm md:hover:shadow-xl"
                    >
                      {/* Background Image Header Section */}
                      <div
                        className="relative cursor-pointer bg-cover bg-center bg-no-repeat px-4 pt-4 pb-4 md:h-[150px]"
                        onClick={() => {
                          const id = classItem.classID || classItem.id;
                          if (!id) return;
                          // Navigate to archived class details if needed
                          console.log("Archived class clicked:", classItem);
                        }}
                        style={{ backgroundImage: `url(${headerBackground})` }}
                      >
                        <div className="relative z-10 pr-16 md:flex md:h-full md:flex-col md:justify-between md:pr-0">
                          <div className="mb-4 hidden text-xs font-medium text-white opacity-90 md:block">
                            Class
                          </div>
                          <div className="mb-4">
                            <div
                              className="max-h-12 overflow-hidden leading-6 font-semibold text-white"
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
                            {classItem.schedule && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-white md:hidden">
                                <i className="bx bx-history text-sm"></i>
                                <span className="truncate">
                                  {classItem.schedule}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="mt-7 inline-flex max-w-28 items-center overflow-hidden rounded-full bg-white px-2 py-0.5 md:mt-0">
                            <span className="truncate text-xs font-semibold whitespace-nowrap text-black uppercase">
                              Code - {classItem.classCode}
                            </span>
                          </div>
                        </div>

                        {/* Student count - bottom right (mobile only) */}
                        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white md:hidden">
                          <i className="bx bx-group text-sm"></i>
                          <span>
                            {enrollmentCount}{" "}
                            {enrollmentCount === 1 ? "Student" : "Students"}
                          </span>
                        </div>

                        {/* Restore and Delete Buttons - Top Right */}
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                          <button
                            onClick={(e) => handleRestoreClick(classItem, e)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                            title="Restore Class"
                          >
                            <i className="bx bx-undo text-lg"></i>
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(classItem, e)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                            title="Delete Class Permanently"
                          >
                            <i className="bx bx-trash text-lg"></i>
                          </button>
                        </div>
                      </div>

                      {/* White Body Section (desktop only) */}
                      <div
                        className="hidden flex-1 cursor-pointer flex-col px-4 py-4 md:flex"
                        onClick={() => {
                          const id = classItem.classID || classItem.id;
                          if (!id) return;
                          // Navigate to archived class details if needed
                          console.log("Archived class clicked:", classItem);
                        }}
                      >
                        {/* Subject Information */}
                        {classItem.subject && (
                          <div className="mb-3">
                            <div className="outfit-500 line-clamp-2 overflow-hidden text-[14px] text-ellipsis text-gray-700">
                              {classItem.subject.subjectCode} -{" "}
                              {classItem.subject.subjectName}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mb-1 space-y-1">
                          {classItem.schedule && (
                            <div className="outfit-400 hidden items-center gap-2 text-[12px] text-gray-700 md:flex">
                              <i className="bx bx-history text-sm"></i>
                              <span className="truncate">
                                {classItem.schedule}
                              </span>
                            </div>
                          )}
                          <div className="outfit-400 hidden items-center gap-2 text-[12px] text-gray-700 md:flex">
                            <i className="bx bx-group text-sm"></i>
                            <span>
                              {enrollmentCount}{" "}
                              {enrollmentCount === 1 ? "Student" : "Students"}
                            </span>
                          </div>
                          {classItem.isActive !== undefined && (
                            <div className="outfit-400 flex items-center gap-2 text-[12px]">
                              {classItem.isActive ? (
                                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                                  <i className="bx bx-check-circle text-sm"></i>
                                  <span className="ml-1">Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-medium text-gray-500">
                                  <i className="bx bx-x-circle text-sm"></i>
                                  <span className="ml-1">Inactive</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Separator */}
                        <div className="my-3 h-px bg-gray-200"></div>

                        {/* Date Information */}
                        <div className="outfit-400 mt-auto space-y-1 text-[12px] text-gray-600">
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

        {/* Restore Confirmation Modal */}
        <ConfirmModal
          isOpen={isRestoreModalOpen}
          onClose={() => {
            setIsRestoreModalOpen(false);
            setRestoringClass(null);
          }}
          onConfirm={handleRestoreConfirm}
          message={
            restoringClass
              ? `Are you sure you want to restore "${restoringClass.className}"? This will make the class active again and it will appear in your main classes list.`
              : "Are you sure you want to restore this class?"
          }
          isLoading={isRestoring}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingClass(null);
          }}
          onConfirm={handleDeleteConfirm}
          message={
            deletingClass
              ? `Are you sure you want to permanently delete "${deletingClass.className}"? This action cannot be undone and all class data will be lost.`
              : "Are you sure you want to permanently delete this class? This action cannot be undone."
          }
          isLoading={isDeleting}
        />
      </div>
    </>
  );
};

export default ArchivedClass;
