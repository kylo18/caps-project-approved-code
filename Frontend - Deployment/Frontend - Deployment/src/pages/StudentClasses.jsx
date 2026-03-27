import React, { useEffect, useState } from "react";
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
          sessionStorage.removeItem("token");
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
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("token");
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

                const max =
                  limitDetail && typeof limitDetail.value === "number"
                    ? limitDetail.value
                    : 0;
                const used = a?.attemptCount || 0;

                if (
                  remainingDetail &&
                  typeof remainingDetail.value === "number"
                ) {
                  computedRemainingAttempts = remainingDetail.value;
                } else if (max > 0) {
                  // If we know the max but no remaining detail, derive remaining from used
                  computedRemainingAttempts = Math.max(0, max - used);
                } else {
                  // Unlimited attempts
                  computedRemainingAttempts = null;
                }

                const inProgress =
                  quiz.studentAttempt && !quiz.studentAttempt.isCompleted;

                if (!quiz.isAvailable) {
                  buttonState =
                    used > 0 && !inProgress ? "done" : "unavailable";
                } else {
                  if (inProgress) {
                    buttonState = "continue";
                  } else if (used > 0) {
                    buttonState = max === 0 || used < max ? "retake" : "done";
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
          sessionStorage.removeItem("token");
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

      setQuizHistory(data.history);
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
                    const start = formatDate(quiz.startDate);
                    let isDeadlineNear = false;

                    const deadline = (() => {
                      if (!quiz.deadlineDate) return "Not set";
                      const d = new Date(quiz.deadlineDate);
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
                                      if (!quiz.startDate || !quiz.deadlineDate)
                                        return "No dates set";
                                      const sDate = new Date(quiz.startDate);
                                      const dDate = new Date(quiz.deadlineDate);
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
                    {/* Unified Card View for History */}
                    <div className="flex flex-col gap-4 px-4 md:px-0">
                      {quizHistory.map((item) => {
                        const highest = item.highestAttempt;
                        const pct =
                          typeof highest?.percentage === "number"
                            ? highest.percentage.toFixed(1)
                            : parseFloat(highest?.percentage || 0).toFixed(1);

                        const rawPercentage =
                          typeof highest?.percentage === "number"
                            ? highest.percentage
                            : parseFloat(highest?.percentage || 0);

                        const percentageBadgeClasses =
                          rawPercentage >= 90
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : rawPercentage >= 75
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : rawPercentage >= 60
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-gray-50 text-gray-700 border-gray-200";

                        return (
                          <div
                            key={item.classPersonalQuizID}
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 transition-all md:flex-row md:items-center md:justify-between md:py-3"
                          >
                            <div className="flex items-start gap-3 md:items-center md:gap-4">
                              {/* Icon */}
                              <div className="relative mt-0.5 flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 md:mt-0 md:h-[45px] md:w-[45px]">
                                <i className="bx bx-history text-[20px] md:text-[24px]" />
                              </div>

                              {/* Info */}
                              <div className="flex flex-col">
                                <h3 className="outfit-700 text-[14px] font-bold text-[#1a1f36]">
                                  {item.quiz?.title || "Untitled Quiz"}
                                </h3>
                                <div className="outfit-500 mt-1.5 flex flex-col gap-1.5 text-[12px] md:mt-1 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
                                  {/* Attempts */}
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <i className="bx bx-undo text-[14px] text-[#1a1f36]/60" />
                                    <span>
                                      Attempts: {item.totalAttempts ?? "—"}
                                    </span>
                                  </div>
                                  {/* Submitted */}
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <i className="bx bx-time text-[14px] text-[#1a1f36]/60" />
                                    <span>
                                      Submitted:{" "}
                                      {highest?.submitted_at
                                        ? formatDateTime(highest.submitted_at)
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right side: Score & Button */}
                            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 md:mt-0 md:justify-end md:gap-8 md:border-0 md:pt-0">
                              {/* Score Details */}
                              <div className="flex w-full items-center justify-between md:w-auto md:flex-col md:items-end">
                                {/* Label */}
                                <span className="outfit-700 text-[10px] tracking-widest text-[#1a1f36]/40 uppercase">
                                  Best Score
                                </span>

                                {/* Score */}
                                <div className="flex items-center gap-2 md:mt-0.5">
                                  <span className="outfit-700 text-[13px] text-[#1a1f36]">
                                    {highest
                                      ? `${highest.score}/${highest.total_score}`
                                      : "—"}
                                  </span>

                                  <span
                                    className={`outfit-400 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] ${percentageBadgeClasses}`}
                                  >
                                    {highest ? `${pct}%` : "—"}
                                  </span>
                                </div>
                              </div>
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
