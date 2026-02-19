import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";

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
  const [expandedQuizzes, setExpandedQuizzes] = useState(new Set()); // Track which quizzes have expanded attempts

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

  const formatTime = (seconds) => {
    if (!seconds) return "—";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
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

  const toggleQuizExpansion = (quizID) => {
    setExpandedQuizzes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(quizID)) {
        newSet.delete(quizID);
      } else {
        newSet.add(quizID);
      }
      return newSet;
    });
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
          {/* Back Button and Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/class")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100"
                aria-label="Back to classes"
              >
                <i className="bx bx-arrow-left-stroke text-3xl" />
              </button>
              <div>
                <p className="outfit-500 mt-1 text-[20px] text-black">
                  {className}
                </p>
                <p className="text-sm text-gray-600">
                  Class Code: {classCode}
                </p>
              </div>
            </div>
          </div>

          <div className="my-3 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-4 py-2 text-[14px] font-medium transition-colors ${
              activeTab === "assigned"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Assigned Quizzes
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-[14px] font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            History
          </button>
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
              <div className="outfit-500 mb-4 flex items-center justify-between">
                <p className="text-[14px] text-gray-600">
                  {assignedQuizzes.length}{" "}
                  {assignedQuizzes.length === 1
                    ? "Assigned Quiz"
                    : "Assigned Quizzes"}
                </p>
              </div>

              <div className="space-y-3">
                {assignedQuizzes.map((quiz) => {
                  const start = formatDate(quiz.startDate);
                  const deadline = formatDate(quiz.deadlineDate);
                  const studentAttempt = quiz.studentAttempt;
                  const maxAttempts = quiz.settings?.quizAttempts;
                  const isAvailable = quiz.isAvailable && quiz.canAttempt;

                  return (
                    <div
                      key={quiz.classPersonalQuizID}
                      className={`outfit rounded-xl border p-4 shadow-sm ${
                        isAvailable
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[15px] font-semibold text-gray-900">
                              {quiz.quizName || "Untitled Quiz"}
                            </p>
                            {!isAvailable && (
                              <span className="rounded-full bg-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700">
                                Unavailable
                              </span>
                            )}
                            {isAvailable && studentAttempt?.isCompleted && (
                              <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
                                Completed
                              </span>
                            )}
                            {isAvailable && !studentAttempt?.isCompleted && studentAttempt && (
                              <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-medium text-yellow-700">
                                In Progress
                              </span>
                            )}
                          </div>
                          {quiz.description && (
                            <p className="text-[13px] text-gray-600">
                              {quiz.description}
                            </p>
                          )}
                          {quiz.availabilityMessage && (
                            <p className="mt-1 text-[12px] text-amber-600">
                              {quiz.availabilityMessage}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-600">
                            <span>
                              <span className="font-medium text-gray-700">
                                Start:
                              </span>{" "}
                              {quiz.startDate ? start : "Not set"}
                            </span>
                            <span>
                              <span className="font-medium text-gray-700">
                                Deadline:
                              </span>{" "}
                              {quiz.deadlineDate ? deadline : "Not set"}
                            </span>
                            {maxAttempts && (
                              <span>
                                <span className="font-medium text-gray-700">
                                  Max Attempts:
                                </span>{" "}
                                {maxAttempts}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 md:items-end">
                          {studentAttempt && (
                            <div className="flex flex-wrap gap-3 text-[12px] text-gray-600">
                              {studentAttempt.accuracy !== null && studentAttempt.accuracy !== undefined && (
                                <span>
                                  <span className="font-medium text-gray-800">
                                    Accuracy:
                                  </span>{" "}
                                  {studentAttempt.accuracy.toFixed(1)}%
                                </span>
                              )}
                              {studentAttempt.score !== null && studentAttempt.totalScore !== null && (
                                <span>
                                  <span className="font-medium text-gray-800">
                                    Score:
                                  </span>{" "}
                                  {studentAttempt.score}/{studentAttempt.totalScore}
                                </span>
                              )}
                            </div>
                          )}
                          {isAvailable && (
                            <button
                              onClick={() => {
                                // Navigate to quiz info page first
                                navigate(`/quiz-info/${quiz.classPersonalQuizID}`, {
                                  state: {
                                    classID,
                                    classPersonalQuizID: quiz.classPersonalQuizID,
                                    quiz: quiz,
                                  },
                                });
                              }}
                              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 md:mt-0"
                            >
                              {studentAttempt && !studentAttempt.isCompleted
                                ? "Continue Quiz"
                                : studentAttempt?.isCompleted
                                ? "View Results"
                                : "Start Quiz"}
                            </button>
                          )}
                        </div>
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
                  <div className="outfit-500 mb-4 flex items-center justify-between">
                    <p className="text-[14px] text-gray-600">
                      {quizHistory.length}{" "}
                      {quizHistory.length === 1
                        ? "Completed Quiz"
                        : "Completed Quizzes"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {quizHistory.map((item) => {
                      const isExpanded = expandedQuizzes.has(
                        item.classPersonalQuizID
                      );
                      const hasMultipleAttempts =
                        item.totalAttempts > 1;

                      return (
                        <div
                          key={item.classPersonalQuizID}
                          className="outfit rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[15px] font-semibold text-gray-900">
                                  {item.quiz.title || "Untitled Quiz"}
                                </p>
                                {item.highestAttempt?.isPassed && (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
                                    Passed
                                  </span>
                                )}
                              </div>
                              {item.quiz.description && (
                                <p className="text-[13px] text-gray-600">
                                  {item.quiz.description}
                                </p>
                              )}
                              {item.quiz.subject && (
                                <p className="text-[12px] text-gray-500">
                                  {item.quiz.subject.subjectCode} -{" "}
                                  {item.quiz.subject.subjectName}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-600">
                                {item.assignment.startDate && (
                                  <span>
                                    <span className="font-medium text-gray-700">
                                      Start:
                                    </span>{" "}
                                    {formatDate(item.assignment.startDate)}
                                  </span>
                                )}
                                {item.assignment.deadlineDate && (
                                  <span>
                                    <span className="font-medium text-gray-700">
                                      Deadline:
                                    </span>{" "}
                                    {formatDate(item.assignment.deadlineDate)}
                                  </span>
                                )}
                                {hasMultipleAttempts && (
                                  <span>
                                    <span className="font-medium text-gray-700">
                                      Attempts:
                                    </span>{" "}
                                    {item.totalAttempts}
                                  </span>
                                )}
                              </div>

                              {/* Highest Attempt Info */}
                              {item.highestAttempt && (
                                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                                  <div className="flex flex-wrap items-center gap-4 text-[12px]">
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Best Score:
                                      </span>{" "}
                                      <span className="font-semibold text-gray-900">
                                        {item.highestAttempt.score}/
                                        {item.highestAttempt.total_score}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Percentage:
                                      </span>{" "}
                                      <span className="font-semibold text-gray-900">
                                        {typeof item.highestAttempt.percentage ===
                                        "number"
                                          ? item.highestAttempt.percentage.toFixed(
                                              1
                                            )
                                          : parseFloat(
                                              item.highestAttempt.percentage || 0
                                            ).toFixed(1)}
                                        %
                                      </span>
                                    </div>
                                    {item.highestAttempt.time_taken_seconds && (
                                      <div>
                                        <span className="font-medium text-gray-700">
                                          Time:
                                        </span>{" "}
                                        {formatTime(
                                          item.highestAttempt.time_taken_seconds
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Submitted:
                                      </span>{" "}
                                      {formatDateTime(
                                        item.highestAttempt.submitted_at
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* All Attempts (Expandable) */}
                              {hasMultipleAttempts && (
                                <div className="mt-3">
                                  <button
                                    onClick={() =>
                                      toggleQuizExpansion(
                                        item.classPersonalQuizID
                                      )
                                    }
                                    className="flex items-center gap-2 text-[12px] font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <i
                                      className={`bx ${
                                        isExpanded
                                          ? "bx-chevron-up"
                                          : "bx-chevron-down"
                                      }`}
                                    ></i>
                                    {isExpanded
                                      ? "Hide All Attempts"
                                      : `Show All Attempts (${item.totalAttempts})`}
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                                      {item.allAttempts.map((attempt, idx) => (
                                        <div
                                          key={attempt.id || idx}
                                          className={`rounded-lg border p-3 ${
                                            attempt.attempt_number ===
                                            item.highestAttempt?.attempt_number
                                              ? "border-green-300 bg-green-50"
                                              : "border-gray-200 bg-white"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[13px] font-semibold text-gray-800">
                                                  Attempt {attempt.attempt_number}
                                                </span>
                                                {attempt.attempt_number ===
                                                  item.highestAttempt
                                                    ?.attempt_number && (
                                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                    Best
                                                  </span>
                                                )}
                                                {attempt.isPassed && (
                                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                                    Passed
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-600">
                                                <span>
                                                  <span className="font-medium text-gray-700">
                                                    Score:
                                                  </span>{" "}
                                                  {attempt.score}/
                                                  {attempt.total_score}
                                                </span>
                                                <span>
                                                  <span className="font-medium text-gray-700">
                                                    Percentage:
                                                  </span>{" "}
                                                  {typeof attempt.percentage ===
                                                  "number"
                                                    ? attempt.percentage.toFixed(
                                                        1
                                                      )
                                                    : parseFloat(
                                                        attempt.percentage || 0
                                                      ).toFixed(1)}
                                                  %
                                                </span>
                                                {attempt.time_taken_seconds && (
                                                  <span>
                                                    <span className="font-medium text-gray-700">
                                                      Time:
                                                    </span>{" "}
                                                    {formatTime(
                                                      attempt.time_taken_seconds
                                                    )}
                                                  </span>
                                                )}
                                                <span>
                                                  <span className="font-medium text-gray-700">
                                                    Submitted:
                                                  </span>{" "}
                                                  {formatDateTime(
                                                    attempt.submitted_at
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

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
    </>
  );
};

export default StudentClasses;

