import React, { useEffect, useState } from "react";
import { clearAuth } from '../utils/authStorage';
import WarningModal from "../components/WarningModal";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";

import BlueBackground from "/src/assets/backgrounds/blue.png";
import GreenBackground from "/src/assets/backgrounds/green.png";
import RedBackground from "/src/assets/backgrounds/red.png";
import YellowBackground from "/src/assets/backgrounds/yellow.png";
import PurpleBackground from "/src/assets/backgrounds/purple.png";
import CyanBackground from "/src/assets/backgrounds/cyan.png";

const headerBackgrounds = [
  BlueBackground,
  GreenBackground,
  RedBackground,
  YellowBackground,
  PurpleBackground,
  CyanBackground,
];

const getHeaderBackground = (id) => {
  if (!id) return headerBackgrounds[0];
  const index = Number(id) % headerBackgrounds.length;
  return headerBackgrounds[index];
};

// Quiz header colors (same as ClassContent / Libraries)
const QUIZ_HEADER_COLORS = [
  "#1e3a5f",
  "#7f1d1d",
  "#1e293b",
  "#422006",
  "#312e81",
];

// Component to determine start button state based on attempt info
const QuizActionButtons = ({ buttonState, quiz, classID, navigate }) => {
  if (buttonState === "loading") {
    return (
      <div className="outfit-500 flex w-24 items-center justify-center px-6 py-[9px]">
        <span className="loader-orange h-4 w-4 shrink-0" />
      </div>
    );
  }

  if (buttonState === "unavailable") {
    return (
      <span className="outfit-500 flex items-center justify-center rounded-xl px-6 py-[9px] text-[12px] text-gray-500">
        Unavailable
      </span>
    );
  }

  if (buttonState === "done") {
    return (
      <span className="outfit-500 flex items-center justify-center rounded-xl px-6 py-[9px] text-[12px] text-green-600">
        Completed
      </span>
    );
  }

  let text = "Start Quiz";
  if (buttonState === "continue") text = "Continue";
  if (buttonState === "retake") text = "Retake";

  return (
    <button
      type="button"
      onClick={() => {
        navigate(`/quiz-info/${quiz.classPersonalQuizID}`, {
          state: {
            classID,
            classPersonalQuizID: quiz.classPersonalQuizID,
            quiz: quiz,
          },
        });
      }}
      className="outfit-500 flex cursor-pointer items-center justify-center rounded-xl bg-orange-500 px-5 py-[7px] text-[12px] font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.95]"
    >
      {text}
    </button>
  );
};

const StudentClasses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const classID = location.state?.classID || useParams().classID;
  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [classInfo, setClassInfo] = useState(null);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("assigned");
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);

  // Fallback info exactly matching ClassContent structure
  const classItem = location.state?.classItem || {};

  const className =
    classInfo?.className || classItem?.className || "Loading class...";
  const classSchedule =
    classInfo?.schedule || classItem?.schedule || "Schedule not set";

  const quizCreatorName =
    assignedQuizzes[0]?.creatorName ||
    assignedQuizzes[0]?.teacherName ||
    assignedQuizzes[0]?.createdByName ||
    assignedQuizzes[0]?.createdBy ||
    (classInfo?.faculty
      ? `${classInfo.faculty.firstName} ${classInfo.faculty.lastName}`
      : classItem?.faculty
        ? `${classItem.faculty.firstName} ${classItem.faculty.lastName}`
        : "Instructor");

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not set";
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleUnenrollClick = () => {
    setShowUnenrollModal(true);
  };

  const handleUnenrollConfirm = async () => {
    setIsUnenrolling(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setShowUnenrollModal(false);
        setIsUnenrolling(false);
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
          clearAuth();
          message = "Your session has expired. Please log in again.";
        } else if (response.status === 403) {
          message = "Only students can unenroll from classes.";
        } else {
          try {
            const errorData = await response.json();
            message = errorData?.message || errorData?.error || message;
          } catch {
            // ignore parse error
          }
        }

        showToast(message, "error");
        setShowUnenrollModal(false);
        setIsUnenrolling(false);
        return;
      }

      setShowUnenrollModal(false);
      showToast("You have been unenrolled from this class.", "success");
      navigate("/class");
    } catch (err) {
      console.error("Error unenrolling from class:", err);
      showToast(
        err.message ||
          "There was a problem unenrolling from the class. Please try again.",
        "error",
      );
    } finally {
      setIsUnenrolling(false);
    }
  };

  const fetchAssignedQuizzes = async () => {
    if (!classID) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/classes/${classID}/quizzes/student`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          clearAuth();
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load assigned quizzes.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch assigned quizzes");
      }

      if (!Array.isArray(data.quizzes)) {
        console.error("Unexpected assigned quizzes data format:", data);
        throw new Error("Invalid response format.");
      }

      // Update class info from API response if available
      if (data.class) {
        setClassInfo(data.class);
      }

      // Pre-fetch all quiz info to calculate statuses and remaining attempts at once
      const quizzesWithState = await Promise.all(
        data.quizzes.map(async (quiz) => {
          let buttonState = "loading";
          // Start with remainingAttempts from the list fetch (correctly computed by backend)
          let computedRemainingAttempts = quiz.remainingAttempts;
          try {
            const res = await fetch(
              `${apiUrl}/quizzes/${quiz.classPersonalQuizID}/info`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (res.ok) {
              const infoData = await res.json();
              if (infoData.success && infoData.quizInfo) {
                const info = infoData.quizInfo;
                const a = info.attempts;
                const details = info.availability?.details || [];

                const limitDetail = details.find(
                  (d) => d.type === "attempt_limit" && d.value != null,
                );
                const remainingDetail = details.find(
                  (d) => d.type === "remaining_attempts" && d.value != null,
                );

                // Prefer /info details for max; fall back to maxAttempts from the list fetch
                // 0 means unlimited (no cap)
                const max =
                  limitDetail && limitDetail.value != null
                    ? Number(limitDetail.value)
                    : quiz.maxAttempts != null
                      ? quiz.maxAttempts
                      : 0;

                const used = a?.attemptCount || 0;

                if (remainingDetail && remainingDetail.value != null) {
                  // /info explicitly told us remaining attempts
                  computedRemainingAttempts = Number(remainingDetail.value);
                } else if (max > 0) {
                  // Derive from max and used
                  computedRemainingAttempts = Math.max(0, max - used);
                }
                // else: no limit info from /info — keep the value from the list fetch
                // (quiz.remainingAttempts is already correctly 0 when exhausted)

                const inProgress =
                  quiz.studentAttempt && !quiz.studentAttempt.isCompleted;

                if (!quiz.isAvailable) {
                  buttonState =
                    used > 0 && !inProgress ? "done" : "unavailable";
                } else {
                  if (inProgress) {
                    buttonState = "continue";
                  } else if (used > 0) {
                    // Primary check: remaining === 0 means all attempts exhausted
                    if (computedRemainingAttempts === 0) {
                      buttonState = "done";
                    } else if (max === 0 || used < max) {
                      buttonState = "retake";
                    } else {
                      buttonState = "done";
                    }
                  } else {
                    buttonState =
                      max === 0 || used < max ? "start" : "unavailable";
                  }
                }
              } else {
                buttonState = "unavailable";
              }
            } else {
              buttonState = "unavailable";
            }
          } catch (e) {
            console.error(
              "Failed to load attempt info for quiz",
              quiz.classPersonalQuizID,
              e,
            );
            buttonState = "unavailable";
          }
          return {
            ...quiz,
            buttonState,
            remainingAttempts: computedRemainingAttempts,
          };
        }),
      );

      setAssignedQuizzes(quizzesWithState);
    } catch (err) {
      setError(
        err.message || "Failed to load assigned quizzes. Please try again.",
      );
      console.error("Error loading assigned quizzes for student:", err);
      showToast(
        err.message || "Failed to load assigned quizzes. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    if (!classID) return;

    setIsHistoryLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/classes/${classID}/quiz-history`,
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
          clearAuth();
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load quiz history.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch quiz history");
      }

      if (!Array.isArray(data.history)) {
        console.error("Unexpected quiz history data format:", data);
        throw new Error("Invalid response format.");
      }

      // Update class info from API response if available
      if (data.class) {
        setClassInfo(data.class);
      }

      // Enrich each history item with all attempts from the /info endpoint
      const token2 = sessionStorage.getItem("token");
      const enriched = await Promise.all(
        data.history.map(async (item) => {
          try {
            const res = await fetch(
              `${apiUrl}/quizzes/${item.classPersonalQuizID}/info`,
              { headers: { Authorization: `Bearer ${token2}` } },
            );
            if (res.ok) {
              const infoData = await res.json();
              if (
                infoData.success &&
                infoData.quizInfo?.attempts?.previousAttempts
              ) {
                // Sort desc: latest attempt number first
                const sorted = [
                  ...infoData.quizInfo.attempts.previousAttempts,
                ].sort((a, b) => b.attempt_number - a.attempt_number);
                return { ...item, allAttempts: sorted };
              }
            }
          } catch {
            // ignore per-quiz fetch errors
          }
          return { ...item, allAttempts: [] };
        }),
      );

      setQuizHistory(enriched);
    } catch (err) {
      setError(err.message || "Failed to load quiz history. Please try again.");
      console.error("Error loading quiz history for student:", err);
      showToast(
        err.message || "Failed to load quiz history. Please try again.",
        "error",
      );
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classID, apiUrl]);

  // Re-fetch assigned quizzes when the student returns to the tab so that
  // any teacher edits (e.g. updated dates) are reflected immediately.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeTab === "assigned") {
        fetchAssignedQuizzes();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchQuizHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classID, apiUrl]);

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {isLoading ? (
        <div className="scrollbar-hide outfit-400 flex min-h-screen flex-1 flex-col items-center justify-center overflow-y-auto p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-center">
            <div className="loader mx-auto mb-3" />
          </div>
        </div>
      ) : (
        <div className="scrollbar-hide mt-5 flex min-h-screen flex-1 flex-col gap-6 overflow-y-auto py-6 pb-24 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-10 md:p-6 lg:mt-0 [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            {/* Two-card header - same as ClassContent */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
              {/* Left: Class Information Card with colored background */}
              <div
                className="relative min-h-[160px] overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-6 md:rounded-xl"
                style={{
                  backgroundImage: `url(${getHeaderBackground(classID)})`,
                }}
              >
                <div className="relative z-10 flex h-full flex-col">
                  {/* Top Header: Title + Unenroll Button */}
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h1 className="outfit-500 text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-2xl">
                        {className}
                      </h1>
                      <p className="outfit-400 mt-1 flex items-center gap-2 text-[14px] font-normal text-white/95">
                        <i className="bx bx-alarm-alt text-[16px]"></i>
                        {classSchedule}
                      </p>
                    </div>

                    {/* Unenroll Button: positioned at top right */}
                    <button
                      type="button"
                      onClick={handleUnenrollClick}
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/20 active:bg-white/30"
                      aria-label="Unenroll from class"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-square-arrow-right-exit-icon lucide-square-arrow-right-exit"
                      >
                        <path d="M10 12h11" />
                        <path d="m17 16 4-4-4-4" />
                        <path d="M21 6.344V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.344" />
                      </svg>
                    </button>
                  </div>

                  {/* Bottom: Instructor Pill */}
                  <div className="outfit-400 mt-8 flex items-end">
                    <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-white px-2 py-0.5">
                      <span className="truncate text-[12px] font-semibold whitespace-nowrap text-black uppercase">
                        {quizCreatorName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Simple info card for student view */}
              <div className="hidden w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 lg:flex lg:w-56">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <i className="bx bx-book-open text-2xl text-gray-600" />
                </div>
                <p className="outfit-500 mt-3 text-center text-[16px] font-normal text-gray-900">
                  Assigned Quizzes
                </p>
                <p className="outfit-500 mt-1 text-center text-[12px] text-gray-600">
                  {assignedQuizzes.length} quiz
                  {assignedQuizzes.length !== 1 ? "zes" : ""} assigned
                </p>
              </div>
            </div>

            {/* Navigation Tabs - same style as ClassContent */}
            <nav className="flex items-center gap-6 border-b border-gray-200 px-4 pb-0 md:px-0">
              <button
                type="button"
                onClick={() => setActiveTab("assigned")}
                className={`outfit-500 flex cursor-pointer items-center gap-2 border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "assigned"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="bx bx-file-detail text-[16px]" />
                Assigned Quizzes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`outfit-500 flex cursor-pointer items-center gap-2 border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "history"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="bx bx-history text-[16px]" />
                History
              </button>
            </nav>
          </div>

          <div>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {activeTab === "assigned" && isLoading ? (
              <div className="outfit flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                </div>
              </div>
            ) : activeTab === "assigned" && assignedQuizzes.length === 0 ? (
              <div className="outfit mx-4 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16 md:mx-0">
                <div className="text-center">
                  <img
                    src={emptyImage}
                    alt="No quizzes assigned"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="text-sm text-gray-600">
                    No quizzes have been assigned to this class yet.
                  </p>
                </div>
              </div>
            ) : activeTab === "assigned" ? (
              <div className="flex flex-col gap-4 px-4 md:px-0">
                {/* Cards */}
                <div className="flex flex-col gap-4">
                  {assignedQuizzes.map((quiz) => {
                    // Prefer settings dates (updated by teacher via QuizSettingsModal), fall back to class-level assignment dates
                    const displayStart =
                      quiz.settings?.startTime ??
                      quiz.startTime ??
                      quiz.startDate;
                    const displayEnd =
                      quiz.settings?.endTime ??
                      quiz.endTime ??
                      quiz.deadlineDate;
                    const start = formatDate(displayStart);
                    let isDeadlineNear = false;

                    const deadline = (() => {
                      if (!displayEnd) return "Not set";
                      const d = new Date(displayEnd);
                      const msRemaining = d - new Date();
                      // Check if deadline is within next 12 hours
                      if (
                        msRemaining > 0 &&
                        msRemaining < 12 * 60 * 60 * 1000
                      ) {
                        isDeadlineNear = true;
                      }

                      const dPart = d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const tPart = d.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return `${dPart} (${tPart})`;
                    })();

                    const effectiveButtonState =
                      quiz.remainingAttempts === 0 &&
                      quiz.buttonState !== "continue"
                        ? "done"
                        : quiz.buttonState;

                    return (
                      <div
                        key={quiz.classPersonalQuizID}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all md:flex-row md:items-center md:justify-between md:gap-4 lg:gap-6"
                      >
                        <div className="flex w-full items-start justify-between md:w-auto md:items-center md:justify-start md:gap-4">
                          <div className="flex items-center gap-3 md:gap-4">
                            {/* Icon */}
                            <div className="relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 md:h-[45px] md:w-[45px]">
                              <i className="bx bxs-copy-list text-[20px] md:text-[24px]" />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col">
                              <h3 className="outfit-700 text-[14px] leading-tight font-bold text-[#1a1f36]">
                                {quiz.quizName || "Untitled Quiz"}
                              </h3>
                              <div className="outfit-500 mt-1 flex flex-col text-[12px] md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
                                {/* Desktop Started */}
                                <div className="hidden items-center gap-1.5 text-gray-500 md:flex">
                                  <i className="bx bx-calendar text-[14px] text-[#1a1f36]/60" />
                                  <span>Started: {start}</span>
                                </div>
                                {/* Desktop Deadline */}
                                <div
                                  className={`hidden items-center gap-1.5 md:flex ${
                                    isDeadlineNear
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <i className="bx bxs-calendar-check text-[14px]" />
                                  <span
                                    className={
                                      isDeadlineNear ? "font-semibold" : ""
                                    }
                                  >
                                    Deadline: {deadline}
                                  </span>
                                </div>

                                {/* Mobile Combined Date */}
                                <div className="flex items-center gap-1.5 text-gray-500 md:hidden">
                                  <i className="bx bx-calendar text-[14px] text-[#1a1f36]/60" />
                                  <span>
                                    {(() => {
                                      if (!displayStart || !displayEnd)
                                        return "No dates set";
                                      const sDate = new Date(displayStart);
                                      const dDate = new Date(displayEnd);
                                      const sameMonthAndYear =
                                        sDate.getMonth() === dDate.getMonth() &&
                                        sDate.getFullYear() ===
                                          dDate.getFullYear();
                                      const sMonth = sDate.toLocaleDateString(
                                        "en-US",
                                        { month: "short" },
                                      );
                                      const sDay = sDate.getDate();
                                      const dMonth = dDate.toLocaleDateString(
                                        "en-US",
                                        { month: "short" },
                                      );
                                      const dDay = dDate.getDate();
                                      const year = dDate.getFullYear();

                                      if (sameMonthAndYear) {
                                        return `${sMonth} ${sDay} - ${dDay}, ${year}`;
                                      }
                                      return `${sMonth} ${sDay} - ${dMonth} ${dDay}, ${year}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Start Button */}
                          <div className="mt-1 flex-shrink-0 origin-top-right scale-90 md:hidden">
                            <QuizActionButtons
                              buttonState={effectiveButtonState}
                              quiz={quiz}
                              classID={classID}
                              navigate={navigate}
                            />
                          </div>
                        </div>

                        {/* Desktop Right side: Duration & Button */}
                        <div className="hidden items-center justify-between gap-6 px-2 md:flex md:justify-end md:gap-8 md:px-0">
                          {/* Start Button */}
                          <div className="flex flex-col items-end gap-1">
                            <QuizActionButtons
                              buttonState={effectiveButtonState}
                              quiz={quiz}
                              classID={classID}
                              navigate={navigate}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === "history" ? (
              <>
                {isHistoryLoading ? (
                  <div className="outfit flex h-64 items-center justify-center">
                    <div className="text-center">
                      <div className="loader mx-auto mb-2"></div>
                    </div>
                  </div>
                ) : quizHistory.length === 0 ? (
                  <div className="outfit mx-4 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16 md:mx-0">
                    <div className="text-center">
                      <img
                        src={emptyImage}
                        alt="No quiz history"
                        className="mx-auto mb-3 h-32 w-32 opacity-80"
                      />
                      <p className="text-sm text-gray-600">
                        You haven't completed any quizzes yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Flat attempt cards — latest on top */}
                    <div className="flex flex-col gap-3 px-4 md:px-0">
                      {quizHistory
                        .flatMap((item) =>
                          (item.allAttempts || []).map((attempt) => ({
                            ...attempt,
                            quizTitle: item.quiz?.title || "Untitled Quiz",
                            classPersonalQuizID: item.classPersonalQuizID,
                          })),
                        )
                        .sort((a, b) => {
                          // Sort by submitted_at descending (latest first)
                          const aTime = a.submitted_at
                            ? new Date(a.submitted_at)
                            : 0;
                          const bTime = b.submitted_at
                            ? new Date(b.submitted_at)
                            : 0;
                          return bTime - aTime;
                        })
                        .map((attempt, idx) => {
                          const pct = parseFloat(attempt.percentage || 0);
                          const badgeClass =
                            pct >= 90
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : pct >= 75
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : pct >= 60
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200";

                          return (
                            <div
                              key={`${attempt.classPersonalQuizID}-${attempt.attempt_number}`}
                              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4"
                            >
                              {/* Left: quiz name + attempt info */}
                              <div className="flex items-center gap-3">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                  <i className="bx bx-history text-[20px]" />
                                </div>
                                <div className="flex flex-col">
                                  <h3 className="outfit-700 text-[14px] leading-tight font-bold text-[#1a1f36]">
                                    {attempt.quizTitle}
                                  </h3>
                                  <div className="outfit-500 mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                                    <span>
                                      Attempt {attempt.attempt_number}
                                    </span>
                                    {attempt.submitted_at && (
                                      <>
                                        <span>·</span>
                                        <span>
                                          {formatDateTime(attempt.submitted_at)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: score + badges */}
                              <div className="flex items-center gap-2 pl-[52px] md:pl-0">
                                <span className="outfit-700 text-[13px] text-[#1a1f36]">
                                  {attempt.score}/{attempt.total_score}
                                </span>
                                <span
                                  className={`outfit-400 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] ${badgeClass}`}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                                {attempt.isPassed ? (
                                  <span className="outfit-500 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
                                    Passed
                                  </span>
                                ) : (
                                  <span className="outfit-500 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-500">
                                    Failed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </>
            ) : null}

            <div className="pb-6" />
          </div>
        </div>
      )}

      {/* Unenroll Warning Modal */}
      <WarningModal
        isOpen={showUnenrollModal}
        onClose={() => setShowUnenrollModal(false)}
        title="Unenroll from Class"
        subtitle="This action cannot be undone."
        description={
          <>
            Are you sure you want to unenroll from "<strong>{className}</strong>
            "? You will lose access to all quizzes and materials in this class.
          </>
        }
        confirmLabel="Unenroll"
        confirmIcon={<i className="bx bx-arrow-out-right-square-half" />}
        onConfirm={handleUnenrollConfirm}
        isConfirmLoading={isUnenrolling}
        cancelLabel="Cancel"
      />
    </>
  );
};

export default StudentClasses;
