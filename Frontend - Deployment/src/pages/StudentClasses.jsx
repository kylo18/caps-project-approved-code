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

  // Read basic class info from navigation state (fallback to ID)
  const classItem = location.state?.classItem || null;
  const className = classInfo?.className || classItem?.className || "Class Quizzes";
  const classCode = classInfo?.classCode || classItem?.classCode || classID;

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

  const fetchAssignedQuizzes = async () => {
    if (!classID) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/quizzes/student`, {
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

        let errorMessage = "Failed to load assigned quizzes.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
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
        err.message || "Failed to load assigned quizzes. Please try again."
      );
      console.error("Error loading assigned quizzes for student:", err);
      showToast(
        err.message || "Failed to load assigned quizzes. Please try again.",
        "error"
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

      const response = await fetch(`${apiUrl}/classes/${classID}/quiz-history`, {
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

        let errorMessage = "Failed to load quiz history.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
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
      setError(
        err.message || "Failed to load quiz history. Please try again."
      );
      console.error("Error loading quiz history for student:", err);
      showToast(
        err.message || "Failed to load quiz history. Please try again.",
        "error"
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
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4">
          {/* Two-card header - same as ClassContent */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            {/* Left: Class Information Card with colored background */}
            <div
              className="relative min-h-[160px] overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat py-6 px-6"
              style={{
                backgroundImage: `url(${getHeaderBackground(classID)})`,
              }}
            >
              <div className="relative z-10 flex h-full flex-col">
                <button
                  type="button"
                  onClick={() => navigate("/class")}
                  className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                  aria-label="Back to classes"
                >
                  <i className="bx bx-arrow-left-stroke text-2xl" />
                </button>
                <div className="pr-16">
                  <h1 className="outfit-500 text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-2xl">
                    {className}
                  </h1>
                  <p className="mt-1 text-[14px] outfit-400 font-normal text-white/95">
                    Class Code: {classCode}
                  </p>
                </div>
                <div className="mt-auto flex items-end">
                  <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-white px-2 py-0.5">
                    <span className="truncate text-[12px] font-semibold whitespace-nowrap text-black uppercase">
                      Class Code - {classCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Simple info card for student view */}
            <div className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 lg:w-56">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <i className="bx bx-book-open text-2xl text-gray-600" />
              </div>
              <p className="mt-3 text-center text-[16px] outfit-500 font-normal text-gray-900">
                Assigned Quizzes
              </p>
              <p className="mt-1 text-center text-[12px] outfit-500 text-gray-600">
                {assignedQuizzes.length} quiz{assignedQuizzes.length !== 1 ? "zes" : ""} assigned
              </p>
            </div>
          </div>

          {/* Navigation Tabs - same style as ClassContent */}
          <nav className="flex items-center gap-6 border-b border-gray-200 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("assigned")}
              className={`outfit-500 border-b-3 pb-3 cursor-pointer text-[14px] font-medium transition-colors ${
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
              className={`outfit-500 border-b-3 pb-3 cursor-pointer text-[14px] font-medium transition-colors ${
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
              <div className="outfit-400 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-4 py-2 w-[35%] text-left text-[14px] font-medium tracking-wider text-gray-600">
                          Quiz Name
                        </th>
                        <th className="px-2 py-2 w-[12%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                          Start Date
                        </th>
                        <th className="px-2 py-2 w-[12%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                          End Date
                        </th>
                        <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                          Status
                        </th>
                        <th className="px-2 py-2 w-[11%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                          Score
                        </th>
                        <th className="px-4 py-2 w-[20%] text-right text-[14px] font-medium tracking-wider text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {assignedQuizzes.map((quiz) => {
                        const start = formatDateTime(quiz.startDate);
                        const deadline = formatDateTime(quiz.deadlineDate);
                        const studentAttempt = quiz.studentAttempt;
                        const maxAttempts = quiz.settings?.quizAttempts;
                        const isAvailable = quiz.isAvailable && quiz.canAttempt;
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
                                  <div className="mt-0.5 truncate max-w-[280px] text-xs text-gray-500">
                                    {quiz.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                              {quiz.startDate ? start : "Not set"}
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                              {quiz.deadlineDate ? deadline : "Not set"}
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap text-center">
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
                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                              {studentAttempt?.score != null && studentAttempt?.totalScore != null
                                ? `${studentAttempt.score}/${studentAttempt.totalScore}`
                                : studentAttempt?.accuracy != null
                                  ? `${studentAttempt.accuracy.toFixed(1)}%`
                                  : "—"}
                            </td>
                            <td className="px-4 py-4 outfit-500 whitespace-nowrap text-right">
                              {isAvailable ? (
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
                                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                >
                                  <i className="bx bx-caret-right text-sm" />
                                  {studentAttempt && !studentAttempt.isCompleted
                                    ? "Continue"
                                    : studentAttempt?.isCompleted
                                      ? "View Results"
                                      : "Start Quiz"}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                  <div className="outfit-400 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-white">
                          <tr>
                            <th className="px-4 py-2 w-[35%] text-left text-[14px] font-medium tracking-wider text-gray-600">
                              Quiz Name
                            </th>
                            <th className="px-2 py-2 w-[15%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Best Score
                            </th>
                            <th className="px-2 py-2 w-[12%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Percentage
                            </th>
                            <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Attempts
                            </th>
                            <th className="px-2 py-2 w-[18%] text-center text-[14px] font-medium tracking-wider text-gray-600">
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
                                : parseFloat(highest?.percentage || 0).toFixed(1);

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
                                        {item.quiz.subject.subjectCode} - {item.quiz.subject.subjectName}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                  {highest
                                    ? `${highest.score}/${highest.total_score}`
                                    : "—"}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                  {highest ? `${pct}%` : "—"}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                  {item.totalAttempts ?? "—"}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
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
                </>
              )}
            </>
          ) : null}

          <div className="pb-6" />
        </div>
      </div>
    </>
  );
};

export default StudentClasses;

