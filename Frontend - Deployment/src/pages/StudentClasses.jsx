import React, { useEffect, useState } from "react";
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

const getQuizHeaderColor = (quizId) => {
  if (quizId == null) return QUIZ_HEADER_COLORS[0];
  const id = typeof quizId === "number" ? quizId : parseInt(quizId, 10) || 0;
  return QUIZ_HEADER_COLORS[Math.abs(id) % QUIZ_HEADER_COLORS.length];
};

const StudentClasses = () => {
  const navigate = useNavigate();
  const { classID } = useParams();
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("assigned"); // 'assigned' or 'history'
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  // Read basic class info from navigation state (fallback to ID)
  const classItem = location.state?.classItem || null;
  const className =
    classInfo?.className || classItem?.className || "Class Quizzes";
  const classCode = classInfo?.classCode || classItem?.classCode || classID;
  const classSchedule =
    classInfo?.schedule || classItem?.schedule || "Class schedule";

  const quizCreatorName =
    assignedQuizzes[0]?.creatorName ||
    assignedQuizzes[0]?.teacherName ||
    assignedQuizzes[0]?.createdByName ||
    assignedQuizzes[0]?.createdBy ||
    classInfo?.teacherName ||
    classItem?.teacherName ||
    "Class creator";

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-US", {
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

  const handleUnenroll = async () => {
    if (
      !window.confirm(
        `Are you sure you want to unenroll from "${className}"? You will lose access to all quizzes and materials in this class.`,
      )
    )
      return;

    setIsUnenrolling(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
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
        return;
      }

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
        setClassInfo({
          className: data.class.className,
          classCode: data.class.classCode,
        });
      }

      setAssignedQuizzes(data.quizzes);
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
        <div className="scrollbar-hide outfit-400 flex h-screen flex-1 flex-col items-center justify-center overflow-y-auto p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-center">
            <div className="loader mx-auto mb-3" />
          </div>
        </div>
      ) : (
        <div className="scrollbar-hide mt-5 flex h-screen flex-1 flex-col gap-6 overflow-y-auto py-6 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-10 md:p-6 lg:mt-0 [&::-webkit-scrollbar]:hidden">
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
                  <div className="pr-16">
                    <h1 className="outfit-500 text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-2xl">
                      {className}
                    </h1>
                    <p className="outfit-400 mt-1 text-[14px] font-normal text-white/95">
                      {classSchedule}
                    </p>
                  </div>
                  <div className="outfit-400 mt-8 flex items-end justify-between">
                    <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-white px-2 py-0.5">
                      <span className="truncate text-[12px] font-semibold whitespace-nowrap text-black uppercase">
                        {quizCreatorName}
                      </span>
                    </div>

                    {/* Mobile: icon-only buttons, transparent background */}
                    <div className="-mb-2 flex items-center gap-2 md:hidden">
                      <button
                        type="button"
                        onClick={handleUnenroll}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/90 hover:bg-white/10 active:bg-white/20"
                        aria-label="Archive class"
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
                          class="lucide lucide-trash2-icon lucide-trash-2"
                        >
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Simple info card for student view */}
              <div className="hidden w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 md:flex lg:w-56">
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
                className={`outfit-500 cursor-pointer border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "assigned"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Assigned Quizzes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`outfit-500 cursor-pointer border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "history"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
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
                  <p className="text-[14px] text-gray-600">
                    Loading assigned quizzes...
                  </p>
                </div>
              </div>
            ) : activeTab === "assigned" && assignedQuizzes.length === 0 ? (
              <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
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
              <>
                {/* Desktop: table view – match ClassContent */}
                <div className="outfit-400 hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                  <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="w-[40%] px-4 py-2 text-left text-[14px] font-medium tracking-wider text-gray-600">
                            Quiz Name
                          </th>
                          <th className="w-[10%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                            Start Date
                          </th>
                          <th className="w-[10%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                            End Date
                          </th>
                          <th className="w-[10%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {assignedQuizzes.map((quiz) => {
                          const start = formatDateTime(quiz.startDate);
                          const deadline = formatDateTime(quiz.deadlineDate);
                          const studentAttempt = quiz.studentAttempt;
                          const isAvailable =
                            quiz.isAvailable && quiz.canAttempt;
                          const statusLabel = !isAvailable
                            ? "Unavailable"
                            : studentAttempt?.isCompleted
                              ? "Completed"
                              : studentAttempt
                                ? "In Progress"
                                : "Not started";

                          return (
                            <tr
                              key={quiz.classPersonalQuizID}
                              className="group transition-colors hover:bg-gray-50"
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {quiz.quizName || "Untitled Quiz"}
                                  </div>
                                  {quiz.description && (
                                    <div className="mt-0.5 max-w-[280px] truncate text-xs text-gray-500">
                                      {quiz.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-700">
                                {quiz.startDate ? start : "Not set"}
                              </td>
                              <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-700">
                                {quiz.deadlineDate ? deadline : "Not set"}
                              </td>
                              <td className="px-2 py-4 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    !isAvailable
                                      ? "bg-gray-200 text-gray-700"
                                      : statusLabel === "Completed"
                                        ? "bg-green-100 text-green-700"
                                        : statusLabel === "In Progress"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </td>

                              <td className="outfit-500 px-4 py-4 text-right whitespace-nowrap">
                                {isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate(
                                        `/quiz-info/${quiz.classPersonalQuizID}`,
                                        {
                                          state: {
                                            classID,
                                            classPersonalQuizID:
                                              quiz.classPersonalQuizID,
                                            quiz: quiz,
                                          },
                                        },
                                      );
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                  >
                                    <i className="bx bx-caret-right text-sm" />
                                    {studentAttempt &&
                                    !studentAttempt.isCompleted
                                      ? "Continue"
                                      : studentAttempt?.isCompleted
                                        ? "View Results"
                                        : "Start Quiz"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400"></span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile: pill-like cards – mirror ClassContent structure */}
                <div className="outfit-400 flex flex-col gap-2 lg:hidden">
                  {assignedQuizzes.map((quiz) => {
                    const start = formatDateTime(quiz.startDate);
                    const deadline = formatDateTime(quiz.deadlineDate);
                    const studentAttempt = quiz.studentAttempt;
                    const isAvailable = quiz.isAvailable && quiz.canAttempt;
                    const statusLabel = !isAvailable
                      ? "Unavailable"
                      : studentAttempt?.isCompleted
                        ? "Completed"
                        : studentAttempt
                          ? "In Progress"
                          : "Not started";

                    const quizId =
                      quiz.personalQuizID ||
                      quiz.quizID ||
                      quiz.classPersonalQuizID;
                    const headerColor = getQuizHeaderColor(quizId);

                    return (
                      <div
                        key={quiz.classPersonalQuizID}
                        className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
                      >
                        <div
                          className="flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                          style={{ backgroundColor: headerColor }}
                        >
                          <span className="outfit-400 text-[18px] font-semibold text-white">
                            Q
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="outfit-500 text-[15px] font-semibold text-gray-900">
                            {quiz.quizName || "Untitled Quiz"}
                          </div>

                          <div className="outfit-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray-500">
                            <span>
                              {quiz.startDate && quiz.deadlineDate
                                ? (() => {
                                    const startDate = new Date(quiz.startDate);
                                    const endDate = new Date(quiz.deadlineDate);

                                    const startMonth = startDate.toLocaleString(
                                      "en-US",
                                      {
                                        month: "short",
                                      },
                                    );
                                    const endMonth = endDate.toLocaleString(
                                      "en-US",
                                      { month: "short" },
                                    );

                                    const startDay = startDate.getDate();
                                    const endDay = endDate.getDate();

                                    const endYear = endDate.getFullYear();

                                    return startMonth === endMonth
                                      ? `${startMonth} ${startDay} - ${endDay}, ${endYear}`
                                      : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
                                  })()
                                : "Deadline not set"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigate(
                                  `/quiz-info/${quiz.classPersonalQuizID}`,
                                  {
                                    state: {
                                      classID,
                                      classPersonalQuizID:
                                        quiz.classPersonalQuizID,
                                      quiz: quiz,
                                    },
                                  },
                                );
                              }}
                              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-orange-600"
                            >
                              <i className="bx bx-caret-right text-sm" />
                              {studentAttempt && !studentAttempt.isCompleted
                                ? "Continue"
                                : studentAttempt?.isCompleted
                                  ? "View"
                                  : "Start"}
                            </button>
                          ) : (
                            <span className="text-center text-[11px] text-gray-400">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : activeTab === "history" ? (
              <>
                {isHistoryLoading ? (
                  <div className="outfit flex h-64 items-center justify-center">
                    <div className="text-center">
                      <div className="loader mx-auto mb-2"></div>
                      <p className="text-[14px] text-gray-600">
                        Loading quiz history...
                      </p>
                    </div>
                  </div>
                ) : quizHistory.length === 0 ? (
                  <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
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
                    {/* Desktop: table view */}
                    <div className="outfit-400 hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                      <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 bg-white">
                            <tr>
                              <th className="w-[35%] px-4 py-2 text-left text-[14px] font-medium tracking-wider text-gray-600">
                                Quiz Name
                              </th>
                              <th className="w-[15%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                                Best Score
                              </th>
                              <th className="w-[12%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                                Percentage
                              </th>
                              <th className="w-[10%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                                Attempts
                              </th>
                              <th className="w-[18%] px-2 py-2 text-center text-[14px] font-medium tracking-wider text-gray-600">
                                Last Submitted
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {quizHistory.map((item) => {
                              const highest = item.highestAttempt;
                              const pct =
                                typeof highest?.percentage === "number"
                                  ? highest.percentage.toFixed(1)
                                  : parseFloat(
                                      highest?.percentage || 0,
                                    ).toFixed(1);

                              return (
                                <tr
                                  key={item.classPersonalQuizID}
                                  className="group transition-colors hover:bg-gray-50"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {item.quiz?.title || "Untitled Quiz"}
                                      </div>
                                      {item.quiz?.subject && (
                                        <div className="mt-0.5 text-xs text-gray-500">
                                          {item.quiz.subject.subjectCode} -{" "}
                                          {item.quiz.subject.subjectName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-700">
                                    {highest
                                      ? `${highest.score}/${highest.total_score}`
                                      : "—"}
                                  </td>
                                  <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-700">
                                    {highest ? `${pct}%` : "—"}
                                  </td>
                                  <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-700">
                                    {item.totalAttempts ?? "—"}
                                  </td>
                                  <td className="px-2 py-4 text-center text-xs whitespace-nowrap text-gray-600">
                                    {highest?.submitted_at
                                      ? formatDateTime(highest.submitted_at)
                                      : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                {/* Mobile & tablet: card view */}
                <div className="mt-3 flex flex-col gap-3 lg:hidden">
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
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : rawPercentage >= 75
                          ? "bg-sky-50 text-sky-700 border border-sky-100"
                          : rawPercentage >= 60
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-gray-50 text-gray-700 border border-gray-200";

                    return (
                      <div
                        key={item.classPersonalQuizID}
                        className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="outfit-500 text-[15px] font-semibold text-gray-900">
                              {item.quiz?.title || "Untitled Quiz"}
                            </p>
                            {item.quiz?.subject && (
                              <p className="outfit-400 mt-0.5 text-[12px] text-gray-500">
                                {item.quiz.subject.subjectCode} ·{" "}
                                {item.quiz.subject.subjectName}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${percentageBadgeClasses}`}
                            >
                              {highest ? `${pct}%` : "—"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {highest
                                ? `${highest.score}/${highest.total_score} pts`
                                : "No score yet"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                            <span className="font-medium text-gray-700">
                              Attempts:
                            </span>
                            <span>{item.totalAttempts ?? "—"}</span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            <span className="font-medium text-gray-700">
                              Last submitted:
                            </span>
                            <span>
                              {highest?.submitted_at
                                ? formatDateTime(highest.submitted_at)
                                : "—"}
                            </span>
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
    </>
  );
};

export default StudentClasses;
