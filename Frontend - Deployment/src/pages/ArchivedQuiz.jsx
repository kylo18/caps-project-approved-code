import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import MyQuizzezIcon from "/src/assets/symbols/myquiz.svg";
import MyQuizzezIconH from "/src/assets/symbols/myquizhover.svg";

import SharedWithMeIcon from "/src/assets/symbols/share.svg";
import SharedWithMeIconH from "/src/assets/symbols/sharehover.svg";

import AllActivitiesIcon from "/src/assets/symbols/all.svg";
import AllActivitiesIconH from "/src/assets/symbols/allhover.svg";

import CollectionsIcon from "/src/assets/symbols/collection.svg";
import CollectionsIconH from "/src/assets/symbols/collectionhover.svg";

import ArchiveIcon from "/src/assets/symbols/archive.svg";
import ArchiveIconH from "/src/assets/symbols/archivehover.svg";

import EditIcon from "/src/assets/symbols/myquiz.svg";
import emptyImage from "../assets/icons/empty.png";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

const ArchivedQuiz = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringQuizId, setRestoringQuizId] = useState(null);
  const [deletingQuizId, setDeletingQuizId] = useState(null);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const kebabMenuRef = useRef(null);
  const kebabButtonRefs = useRef({});
  const [dropdownButtonRect, setDropdownButtonRect] = useState(null);

  // Multi-selection state
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);

  // Array of 5 dark colors for header sections
  const headerColors = [
    "#1e3a5f", // Dark blue
    "#7f1d1d", // Dark red
    "#1e293b", // Dark slate
    "#422006", // Dark brown/amber
    "#312e81", // Dark indigo
  ];

  // Function to get a consistent color for a quiz (based on quiz ID)
  const getHeaderColor = (quizId) => {
    if (!quizId) return headerColors[0];
    // Use quiz ID to get a consistent color for the same quiz
    const index = quizId % headerColors.length;
    return headerColors[index];
  };

  useEffect(() => {
    const fetchArchivedQuizzes = async () => {
      setIsLoading(true);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/archived`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }

          let errorMessage = "Failed to load archived quizzes.";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData?.message || errorData?.error || errorMessage;
          } catch {
            errorMessage = `HTTP error! Status: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch quizzes");
        }

        if (!Array.isArray(data.quizzes)) {
          console.error("Unexpected archived quizzes data format:", data);
          throw new Error("Invalid response format.");
        }

        // Backend already returns only archived quizzes
        setQuizzes(data.quizzes);
      } catch (err) {
        const msg =
          err.message || "Failed to load archived quizzes. Please try again.";
        showToast(msg, "error");
        console.error("Error loading archived quizzes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedQuizzes();
  }, []);

  // Close kebab menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedButton = Object.values(kebabButtonRefs.current).find(
        (ref) => ref && ref.contains(event.target),
      );

      if (!clickedButton && openKebabMenu) {
        // Check if click is outside the portal dropdown
        const dropdownElement = document.querySelector(
          ".fixed.z-50.min-w-\\[120px\\]",
        );
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setOpenKebabMenu(null);
          setDropdownButtonRect(null);
        }
      }
    };

    const handleScroll = () => {
      if (openKebabMenu) {
        setOpenKebabMenu(null);
        setDropdownButtonRect(null);
      }
    };

    if (openKebabMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openKebabMenu]);

  const handleUnarchiveQuiz = async (quiz) => {
    try {
      const quizID =
        quiz.id || quiz.personalQuizID || quiz.quizID || quiz.quiz_id;

      if (!quizID) {
        showToast("Unable to determine quiz ID for restoring.", "error");
        return;
      }

      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      setRestoringQuizId(quizID);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/${quizID}/unarchive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem restoring the quiz. Please try again.";

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

      // Remove restored quiz from archived list
      setQuizzes((prev) =>
        prev.filter((q) => {
          const currentId = q.id || q.personalQuizID || q.quizID || q.quiz_id;
          return currentId !== quizID;
        }),
      );

      showToast(
        data.message || "Personal quiz unarchived successfully.",
        "success",
      );
    } catch (err) {
      const msg =
        err.message ||
        "There was a problem restoring the quiz. Please try again.";
      showToast(msg, "error");
    } finally {
      setRestoringQuizId(null);
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    try {
      const quizID =
        quiz.id || quiz.personalQuizID || quiz.quizID || quiz.quiz_id;

      if (!quizID) {
        showToast("Unable to determine quiz ID for deletion.", "error");
        return;
      }

      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      setDeletingQuizId(quizID);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/${quizID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem deleting the quiz. Please try again.";

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

      // Remove deleted quiz from archived list
      setQuizzes((prev) =>
        prev.filter((q) => {
          const currentId = q.id || q.personalQuizID || q.quizID || q.quiz_id;
          return currentId !== quizID;
        }),
      );

      showToast(
        data.message || "Personal quiz deleted successfully.",
        "success",
      );
    } catch (err) {
      const msg =
        err.message ||
        "There was a problem deleting the quiz. Please try again.";
      showToast(msg, "error");
    } finally {
      setDeletingQuizId(null);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      quiz.title?.toLowerCase().includes(term) ||
      quiz.description?.toLowerCase().includes(term) ||
      (quiz.subject &&
        (quiz.subject.subjectCode?.toLowerCase().includes(term.toLowerCase()) ||
          quiz.subject.subjectName?.toLowerCase().includes(term.toLowerCase())))
    );
  });

  // Handle individual checkbox selection
  const handleQuizCheckboxChange = (quizID, isChecked) => {
    if (isChecked) {
      setSelectedQuizzes((prev) => [...prev, quizID]);
    } else {
      setSelectedQuizzes((prev) => prev.filter((id) => id !== quizID));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedQuizzes(
        filteredQuizzes.map(
          (quiz) =>
            quiz.id || quiz.quizID || quiz.personalQuizID || quiz.quiz_id,
        ),
      );
    } else {
      setSelectedQuizzes([]);
    }
  };

  // Count how many filtered quizzes are selected
  const selectedFilteredCount = filteredQuizzes.filter((quiz) => {
    const quizID =
      quiz.id || quiz.quizID || quiz.personalQuizID || quiz.quiz_id;
    return selectedQuizzes.includes(quizID);
  }).length;

  // Check if all visible quizzes are selected
  const isAllSelected =
    filteredQuizzes.length > 0 &&
    selectedFilteredCount === filteredQuizzes.length;

  // Check if some (but not all) visible quizzes are selected
  const isIndeterminate =
    filteredQuizzes.length > 0 &&
    selectedFilteredCount > 0 &&
    selectedFilteredCount < filteredQuizzes.length;

  // Handle restore selected quizzes
  const handleRestoreSelected = async () => {
    if (selectedQuizzes.length === 0) return;

    const token = sessionStorage.getItem("token");
    const countToRestore = selectedQuizzes.length;
    setRestoringQuizId("bulk");

    try {
      // Restore quizzes one by one
      const restorePromises = selectedQuizzes.map(async (quizID) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/${quizID}/unarchive`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to restore quiz ${quizID}`);
        }

        return response.json();
      });

      await Promise.all(restorePromises);

      // Refetch quizzes to update the list
      const fetchArchivedQuizzes = async () => {
        const token = sessionStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/archived`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQuizzes(data.quizzes || []);
          }
        }
      };

      await fetchArchivedQuizzes();
      setSelectedQuizzes([]);
      showToast(
        `${countToRestore} quiz${countToRestore === 1 ? "" : "zes"} restored successfully`,
        "success",
      );
    } catch (error) {
      const msg =
        error.message ||
        "An error occurred while restoring quizzes. Please try again.";
      showToast(msg, "error");
    } finally {
      setRestoringQuizId(null);
    }
  };

  return (
    <div className="-ml-2 flex h-screen">
      {/* Library left panel */}
      <aside className="fixed top-0 left-[63px] hidden h-screen w-56 overflow-hidden border-r border-gray-200 bg-white px-4 py-4 md:block lg:w-64">
        <h2 className="outfit-500 mb-4 text-[16px] tracking-wide text-black">
          Library
        </h2>

        <nav className="outfit-500 space-y-1 text-[15px]">
          <button
            type="button"
            onClick={() => navigate("/libraries")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] text-gray-600 transition-colors hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <img src={MyQuizzezIcon} alt="My Quizzez" className="h-4 w-4" />
              <span>My quizzes</span>
            </span>
          </button>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] text-gray-600 transition-colors hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <img
                src={SharedWithMeIcon}
                alt="Shared with me"
                className="h-4 w-4"
              />
              <span>Shared with me</span>
            </span>
          </button>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-left text-[14px] font-medium text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <img src={ArchiveIconH} alt="archive" className="h-4 w-4" />
              <span>Archive</span>
            </span>
          </button>
        </nav>

        <div className="my-4 h-px bg-gray-200" />

        <div className="outfit-500 space-y-1 text-sm">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] text-gray-600 transition-colors hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <img
                src={CollectionsIcon}
                alt="Collections"
                className="h-4 w-4"
              />
              <span>My Subjects</span>
            </span>
            <span className="text-xs text-gray-500">0</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="scrollbar-hide ml-56 flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] lg:ml-64 [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="outfit-500 relative text-[14px]">
            <i className="bx bx-search absolute top-2.5 left-4 -translate-y-1/2 text-lg text-gray-500"></i>
            <input
              type="text"
              placeholder="Search archived quizzes..."
              className="-mt-2 w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-[14px] text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute top-2.5 right-3 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            )}
          </div>
          <div className="my-4 h-px bg-gray-200" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="outfit-500 mt-1 text-[18px] text-black">
                {selectedQuizzes.length > 0
                  ? `Select the quizzes you want to restore`
                  : searchTerm.trim()
                    ? `Search results for "${searchTerm}"`
                    : `Archived quizzes (${filteredQuizzes.length})`}
              </p>
            </div>
          </div>
        </div>

        <Toast message={toast.message} type={toast.type} show={toast.show} />

        {isLoading ? (
          <div className="outfit-400 flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="loader mx-auto mb-2"></div>
              <p className="text-[14px] text-gray-600">
                Loading archived quizzes...
              </p>
            </div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="outfit-400 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No quizzes available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="outfit-400 text-[14px] text-gray-600">
                {searchTerm.trim()
                  ? `No quizzes found matching "${searchTerm}"`
                  : "Your quizzes will appear here. Use the Create Quiz button to create one."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="outfit-400 mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="w-6 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected && !isIndeterminate}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isIndeterminate;
                            }
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                        />
                      </th>
                      <th className="outfit-400 px-2 py-2 text-left text-[14px] text-gray-600">
                        Quiz Information
                      </th>
                      <th className="outfit-400 px-2 py-2 text-center text-[14px] text-gray-600">
                        Questions
                      </th>
                      <th className="outfit-400 w-32 px-2 py-2 text-center text-[14px] text-gray-600">
                        Date Created
                      </th>
                      <th className="outfit-400 w-32 px-2 py-2 text-center text-[14px] text-gray-600">
                        Last Edited
                      </th>
                      <th className="outfit-400 px-2 py-2 text-center text-[14px] text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredQuizzes.map((quiz) => {
                      const quizID =
                        quiz.id ||
                        quiz.quizID ||
                        quiz.personalQuizID ||
                        quiz.quiz_id;

                      const createdDate = quiz.created_at
                        ? new Date(quiz.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "—";

                      const createdTime = quiz.created_at
                        ? new Date(quiz.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—";

                      const updatedDate = quiz.updated_at
                        ? new Date(quiz.updated_at)
                        : null;
                      const isToday = updatedDate
                        ? updatedDate.toDateString() ===
                          new Date().toDateString()
                        : false;
                      const isYesterday =
                        updatedDate &&
                        updatedDate.toDateString() ===
                          new Date(
                            new Date().setDate(new Date().getDate() - 1),
                          ).toDateString();

                      const editedDateText = isToday
                        ? "Today"
                        : isYesterday
                          ? "Yesterday"
                          : updatedDate
                            ? updatedDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—";

                      const editedTime = updatedDate
                        ? updatedDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      const quizTypeName =
                        quiz.quizType?.name ||
                        (quiz.quiz_type_id === 1 ? "Subject-based" : "Custom");

                      const headerColor = getHeaderColor(quizID);

                      return (
                        <tr
                          key={quizID}
                          className="group transition-colors hover:bg-gray-50"
                        >
                          <td
                            className="w-12 px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedQuizzes.includes(quizID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleQuizCheckboxChange(
                                  quizID,
                                  e.target.checked,
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                            />
                          </td>
                          <td
                            className="cursor-pointer px-2 py-4 whitespace-nowrap"
                            onClick={() => {
                              navigate("/quiz-overview", {
                                state: { quiz },
                              });
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex size-10 items-center justify-center overflow-hidden rounded"
                                style={{ backgroundColor: headerColor }}
                              >
                                <span className="text-[16px] font-semibold text-white">
                                  Q
                                </span>
                              </div>
                              <div>
                                <div className="outfit-500 text-[14px] font-semibold text-gray-900">
                                  {quiz.title || "Untitled Quiz"}
                                </div>
                                <div className="outfit-400 mt-0.5 text-[12px] text-gray-500">
                                  {quiz.subject ? (
                                    <>
                                      {quiz.subject.subjectCode} -{" "}
                                      {quiz.subject.subjectName}
                                    </>
                                  ) : (
                                    <span>{quizTypeName}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="outfit-400 px-2 py-4 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {quiz.question_count || 0}
                            </div>
                          </td>

                          <td className="outfit-400 w-32 px-2 py-4 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {createdDate}
                            </div>
                            {createdDate !== "—" && (
                              <div className="text-xs text-gray-500">
                                {createdTime}
                              </div>
                            )}
                          </td>

                          <td className="outfit-400 w-32 px-2 py-4 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {editedDateText}
                            </div>
                            {editedDateText !== "—" && updatedDate && (
                              <div className="text-xs text-gray-500">
                                {editedTime}
                              </div>
                            )}
                          </td>

                          <td className="outfit-400 w-40 px-2 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!restoringQuizId) {
                                    handleUnarchiveQuiz(quiz);
                                  }
                                }}
                                disabled={
                                  restoringQuizId !== null ||
                                  deletingQuizId !== null
                                }
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <i className="bx bx-undo text-base"></i>
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!deletingQuizId) {
                                    handleDeleteQuiz(quiz);
                                  }
                                }}
                                disabled={
                                  deletingQuizId !== null ||
                                  restoringQuizId !== null
                                }
                                className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 p-1.5 text-red-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <i className="bx bx-trash block text-lg leading-none"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className={` ${selectedQuizzes.length > 0 ? "pb-28" : "pb-6"}`}
            ></div>
          </>
        )}

        {/* Selection Overlay Banner */}
        {selectedQuizzes.length > 0 && (
          <div className="outfit-400 fixed right-0 bottom-5 left-[63px] z-50 md:left-[119px] lg:left-[319px]">
            <div className="px-6">
              <div className="rounded-xl bg-gray-800 px-5 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-white">
                      {selectedQuizzes.length}{" "}
                      {selectedQuizzes.length === 1 ? "quiz" : "quizzes"}{" "}
                      selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRestoreSelected}
                      disabled={
                        restoringQuizId !== null || deletingQuizId !== null
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                    >
                      <i className="bx bx-undo text-lg"></i>
                      Restore
                    </button>
                    <button
                      onClick={() => setSelectedQuizzes([])}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-gray-700"
                      aria-label="Close"
                    >
                      <i className="bx bx-x text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedQuiz;
