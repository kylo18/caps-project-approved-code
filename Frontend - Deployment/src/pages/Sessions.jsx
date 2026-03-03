import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import EmptyImage from "../assets/icons/empty.png";

const Sessions = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState({
    ongoing: [],
    completed: [],
    missed: [],
    upcoming: [],
    summary: {
      totalOngoing: 0,
      totalCompleted: 0,
      totalMissed: 0,
      totalUpcoming: 0,
    },
  });
  const [facultySessions, setFacultySessions] = useState([]);

  // Determine if user is faculty or above (roles 2, 3, 4, 5)
  const isFaculty = userRole && [2, 3, 4, 5].includes(Number(userRole));

  const tabs = isFaculty
    ? [
        { id: "all", label: "All" },
        { id: "ongoing", label: "Ongoing" },
        { id: "upcoming", label: "Upcoming" },
        { id: "completed", label: "Completed" },
      ]
    : [
        { id: "all", label: "All" },
        { id: "ongoing", label: "Ongoing" },
        { id: "completed", label: "Completed" },
        { id: "missed", label: "Missed" },
        { id: "upcoming", label: "Upcoming" },
      ];

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      // Determine user role for endpoint selection
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const currentRole = user.roleID ?? user.roleId;
      const isFacultyUser =
        currentRole && [2, 3, 4, 5].includes(Number(currentRole));

      // Use different endpoint based on user role
      const endpoint = isFacultyUser
        ? `${apiUrl}/quiz-sessions/faculty-sessions`
        : `${apiUrl}/quiz-sessions`;

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

        let errorMessage = "Failed to load quiz sessions.";
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
        throw new Error(data.message || "Failed to fetch quiz sessions");
      }

      if (isFacultyUser) {
        // Faculty data - always has 'sessions' array
        const sessionsData = data.sessions || [];
        setFacultySessions(sessionsData);

        // Organize by status for tabs
        const organized = {
          all: sessionsData,
          ongoing: [],
          upcoming: [],
          completed: [],
        };

        sessionsData.forEach((session) => {
          if (session.status?.isOngoing) {
            organized.ongoing.push(session);
          } else if (session.status?.isUpcoming) {
            organized.upcoming.push(session);
          } else if (session.status?.isCompleted) {
            organized.completed.push(session);
          }
        });

        setSessions({
          ...organized,
          summary: {
            totalOngoing: organized.ongoing.length,
            totalUpcoming: organized.upcoming.length,
            totalCompleted: organized.completed.length,
            totalMissed: 0,
          },
        });
      } else {
        // Student data
        setSessions({
          ongoing: data.ongoing || [],
          completed: data.completed || [],
          missed: data.missed || [],
          upcoming: data.upcoming || [],
          summary: data.summary || {
            totalOngoing: 0,
            totalCompleted: 0,
            totalMissed: 0,
            totalUpcoming: 0,
          },
        });
      }
    } catch (err) {
      setError(
        err.message || "Failed to load quiz sessions. Please try again.",
      );
      console.error("Error loading quiz sessions:", err);
      showToast(
        err.message || "Failed to load quiz sessions. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return "—";
    if (!startDate) return formatDate(endDate);
    if (!endDate) return formatDate(startDate);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const sameMonth = start.getMonth() === end.getMonth();
      const sameYear = start.getFullYear() === end.getFullYear();
      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = end.getFullYear();

      if (sameMonth && sameYear) {
        return `${startMonth} ${startDay} - ${endDay} ${year}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay} ${year}`;
    } catch {
      return formatDate(startDate) + " - " + formatDate(endDate);
    }
  };

  const calculateAccuracy = (percentage) => {
    if (percentage === null || percentage === undefined) return null;
    const num =
      typeof percentage === "number" ? percentage : parseFloat(percentage || 0);
    return Math.round(num);
  };

  const getFilteredQuizzes = () => {
    let quizzes = [];

    if (isFaculty) {
      // Faculty view
      if (activeTab === "all") {
        quizzes = sessions.all || [];
      } else {
        quizzes = sessions[activeTab] || [];
      }
    } else {
      // Student view
      if (activeTab === "all") {
        quizzes = [
          ...sessions.ongoing,
          ...sessions.completed,
          ...sessions.missed,
          ...sessions.upcoming,
        ];
      } else {
        quizzes = sessions[activeTab] || [];
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      quizzes = quizzes.filter(
        (quiz) =>
          quiz.quiz?.title?.toLowerCase().includes(query) ||
          quiz.class?.className?.toLowerCase().includes(query) ||
          quiz.class?.subject?.subjectName?.toLowerCase().includes(query) ||
          quiz.quiz?.subject?.subjectName?.toLowerCase().includes(query),
      );
    }

    return quizzes;
  };

  const getTabCount = (tabId) => {
    if (isFaculty) {
      if (tabId === "all") {
        return (sessions.all || []).length;
      }
      return (sessions[tabId] || []).length;
    } else {
      if (tabId === "all") {
        return (
          sessions.summary.totalOngoing +
          sessions.summary.totalCompleted +
          sessions.summary.totalMissed +
          sessions.summary.totalUpcoming
        );
      }
      return (
        sessions.summary[
          `total${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`
        ] || 0
      );
    }
  };

  const filteredQuizzes = getFilteredQuizzes();

  // Header colors for Q badge (match Libraries style)
  const headerColors = ["#1e3a5f", "#7f1d1d", "#1e293b", "#422006", "#312e81"];
  const getHeaderColor = (id) => {
    if (!id) return headerColors[0];
    const num =
      typeof id === "number"
        ? id
        : String(id)
            .split("")
            .reduce((a, c) => a + c.charCodeAt(0), 0);
    return headerColors[num % headerColors.length];
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="flex h-screen">
        {/* Main content area */}
        <div className="mt-10 flex h-full flex-1 flex-col gap-6 overflow-y-auto py-4 pb-0 lg:mt-0 lg:p-6">
          <div className="space-y-4">
            {/* Mobile search input - below header when toggled */}
            {showMobileSearch && (
              <div className="outfit-500 relative mt-3 px-6 md:hidden">
                <i className="bx bx-search absolute top-1/2 left-10 -translate-y-1/2 text-lg text-gray-500"></i>
                <input
                  type="text"
                  placeholder="Search quiz"
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute top-1/2 right-10 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-500 hover:text-gray-700"
                  aria-label="Close search"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>
            )}
            {/* Header with title and search */}
            <div className="flex items-center justify-between gap-4 px-6 lg:px-0">
              <div>
                <h1 className="outfit-500 text-[18px] text-black">Sessions</h1>
                <p className="outfit-400 hidden text-[14px] text-gray-600 md:block">
                  View and manage all assigned quiz in one place.
                </p>
              </div>
              {/* Desktop search - always visible */}
              <div className="outfit-500 relative hidden max-w-md flex-1 text-[14px] md:block">
                <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-500"></i>
                <input
                  type="text"
                  placeholder="Search quiz"
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2 -mt-[1px] flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                    aria-label="Clear search"
                  >
                    <i className="bx bx-x text-xl" />
                  </button>
                )}
              </div>
              {/* Mobile search button */}
              <button
                type="button"
                onClick={() => setShowMobileSearch((prev) => !prev)}
                className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-50 md:hidden"
                aria-label="Search"
              >
                <i className="bx bx-search text-xl" />
              </button>
            </div>

            <div className="my-4 hidden h-px bg-gray-200 lg:block" />

            {/* Navigation Tabs and Filters */}
            <div className="flex items-center justify-between px-6 lg:px-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const count = getTabCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`outfit-500 shrink-0 cursor-pointer rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-gray-100 text-black"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                      <span className="hidden md:inline"> ({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="outfit-400 flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                </div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="outfit-400 flex h-80 flex-col items-center justify-center rounded-xl border-dashed border-gray-200 bg-white py-12 md:h-130 md:border">
                <img
                  src={EmptyImage}
                  alt="No quizzes found"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="text-center text-sm text-gray-600">
                  {searchQuery
                    ? "No quizzes found matching your search."
                    : `No ${activeTab === "all" ? "" : activeTab} quizzes found.`}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile expandable list - picture, name, status, arrow */}
                <div className="outfit-400 space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white xl:hidden">
                  {filteredQuizzes.map((quiz) => {
                    const quizId = quiz.classPersonalQuizID;
                    const isExpanded = expandedSessionId === quizId;

                    if (isFaculty) {
                      const stats = quiz.statistics || {};
                      const status = quiz.status || {};
                      const assignment = quiz.assignment || {};
                      let statusLabel = "—";
                      if (status.isUpcoming) statusLabel = "Upcoming quiz";
                      else if (status.isOngoing) statusLabel = "Ongoing quiz";
                      else if (status.isCompleted)
                        statusLabel = "Completed quiz";

                      let statusBadge = null;
                      if (status.isUpcoming) {
                        statusBadge = (
                          <span className="outfit-400 inline-flex items-center text-[12px] font-medium text-blue-600">
                            Upcoming
                          </span>
                        );
                      } else if (status.isOngoing) {
                        statusBadge = (
                          <span className="outfit-400 inline-flex items-center text-[12px] font-medium text-green-600">
                            Ongoing
                          </span>
                        );
                      } else if (status.isCompleted) {
                        statusBadge = (
                          <span className="outfit-400 inline-flex items-center text-[12px] font-medium text-gray-600">
                            Completed
                          </span>
                        );
                      }

                      return (
                        <div
                          key={quizId}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSessionId(isExpanded ? null : quizId)
                            }
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            <div
                              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded"
                              style={{
                                backgroundColor: getHeaderColor(
                                  quizId ?? quiz.quiz?.personalQuizID,
                                ),
                              }}
                            >
                              <span className="outfit-400 text-[16px] font-semibold text-white">
                                Q
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900">
                                {quiz.quiz?.title || "Untitled Quiz"}
                              </div>
                              <div className="outfit-400 text-xs text-gray-500">
                                {statusBadge}
                              </div>
                            </div>
                            <i
                              className={`bx bx-chevron-down ml-auto flex-shrink-0 text-xl text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Date hosted
                                  </span>
                                  <span className="text-gray-900">
                                    {formatDateRange(
                                      assignment.effectiveStartDate ||
                                        assignment.startDate,
                                      assignment.effectiveEndDate ||
                                        assignment.deadlineDate,
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Completion
                                  </span>
                                  <span className="text-gray-900">
                                    {stats.completedCount || 0}/
                                    {stats.totalEnrolled || 0} (
                                    {stats.completionRate
                                      ? stats.completionRate.toFixed(1)
                                      : 0}
                                    %)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Attempts Given
                                  </span>
                                  <span className="text-gray-900">
                                    {stats.totalAttempts || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Avg. Score
                                  </span>
                                  <span className="text-gray-900">
                                    {stats.averagePercentage
                                      ? stats.averagePercentage.toFixed(1)
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Pass Rate
                                  </span>
                                  <span className="text-gray-900">
                                    {stats.passRate
                                      ? stats.passRate.toFixed(1)
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Class</span>
                                  <span className="text-gray-900">
                                    {quiz.class?.className || "—"}
                                  </span>
                                </div>
                                <div className="pt-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/quiz-overview", {
                                        state: {
                                          classID: quiz.class?.classID,
                                          classPersonalQuizID:
                                            quiz.classPersonalQuizID,
                                          quiz: quiz.quiz,
                                          subject: quiz.quiz?.subject,
                                        },
                                      });
                                    }}
                                    className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <i className="bx bx-caret-right text-lg" />
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Student view (mobile)
                    const accuracy = calculateAccuracy(
                      quiz.studentStatus?.highestPercentage,
                    );
                    const hasCompleted = quiz.studentStatus?.hasCompleted;
                    const attemptCount = quiz.studentStatus?.attemptCount || 0;
                    const maxAttempts = quiz.settings?.quizAttempts;
                    const answeredText =
                      maxAttempts && attemptCount > 0
                        ? `${attemptCount}/${maxAttempts}`
                        : attemptCount > 0
                          ? `${attemptCount}`
                          : "—";

                    let statusLabel = "—";
                    if (activeTab === "completed" || hasCompleted) {
                      statusLabel = "Completed";
                    } else if (activeTab === "missed") {
                      statusLabel = "Missed";
                    } else if (activeTab === "upcoming") {
                      statusLabel = "Upcoming";
                    } else if (
                      activeTab === "ongoing" ||
                      quiz.status?.isOngoing
                    ) {
                      statusLabel = "Ongoing";
                    }

                    return (
                      <div
                        key={quizId}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSessionId(isExpanded ? null : quizId)
                          }
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <div
                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded"
                            style={{
                              backgroundColor: getHeaderColor(
                                quizId ?? quiz.quiz?.personalQuizID,
                              ),
                            }}
                          >
                            <span className="outfit-400 text-[16px] font-semibold text-white">
                              Q
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {quiz.quiz?.title || "Untitled Quiz"}
                            </div>
                            <div className="outfit-400 text-xs text-gray-500">
                              {statusLabel}
                            </div>
                            <div className="outfit-400 mt-0.5 text-xs text-gray-500">
                              {formatDateRange(
                                quiz.assignment?.startDate,
                                quiz.assignment?.deadlineDate,
                              )}
                            </div>
                          </div>
                          <i
                            className={`bx bx-chevron-down ml-auto flex-shrink-0 text-xl text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Date hosted
                                </span>
                                <span className="text-gray-900">
                                  {formatDateRange(
                                    quiz.assignment?.startDate,
                                    quiz.assignment?.deadlineDate,
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Answered</span>
                                <span className="text-gray-900">
                                  {answeredText}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Accuracy</span>
                                <span className="text-gray-900">
                                  {accuracy !== null ? `${accuracy}%` : "—"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Class</span>
                                <span className="text-gray-900">
                                  {quiz.class?.className || "—"}
                                </span>
                              </div>
                              <div className="pt-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/quiz-overview", {
                                      state: {
                                        classID: quiz.class?.classID,
                                        classPersonalQuizID:
                                          quiz.classPersonalQuizID,
                                        quiz: quiz.quiz || quiz,
                                        subject: quiz.quiz?.subject,
                                      },
                                    });
                                  }}
                                  className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                  <i className="bx bx-caret-right text-lg" />
                                  {activeTab === "completed" || hasCompleted
                                    ? "View"
                                    : activeTab === "upcoming"
                                      ? "View"
                                      : "Start"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="outfit hidden overflow-hidden rounded-xl border border-gray-200 bg-white xl:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="outfit-400 border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-3 py-3 text-left text-[12px] font-medium text-gray-600 uppercase">
                            Quiz name
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Date hosted
                          </th>
                          {isFaculty && (
                            <>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Completion
                              </th>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Attempts
                              </th>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Avg. Score
                              </th>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Pass Rate
                              </th>
                            </>
                          )}
                          {!isFaculty && (
                            <>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Answered
                              </th>
                              <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                Accuracy
                              </th>
                            </>
                          )}
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Class
                          </th>
                          <th className="px-6 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredQuizzes.map((quiz) => {
                          if (isFaculty) {
                            // Faculty view
                            const stats = quiz.statistics || {};
                            const status = quiz.status || {};
                            const assignment = quiz.assignment || {};

                            // Status badge
                            let statusBadge = null;

                            if (status.isUpcoming) {
                              statusBadge = (
                                <span className="outfit-400 inline-flex items-center gap-1 text-[12px] font-medium text-blue-600">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-calendar-clock-icon lucide-calendar-clock"
                                  >
                                    <path d="M16 14v2.2l1.6 1" />
                                    <path d="M16 2v4" />
                                    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
                                    <path d="M3 10h5" />
                                    <path d="M8 2v4" />
                                    <circle cx="16" cy="16" r="6" />
                                  </svg>
                                  Upcoming
                                </span>
                              );
                            } else if (status.isOngoing) {
                              statusBadge = (
                                <span className="outfit-400 items-cente inline-flex text-[12px] font-medium text-green-600">
                                  <i className="bx bx-caret-right text-[14px]" />
                                  Ongoing
                                </span>
                              );
                            } else if (status.isCompleted) {
                              statusBadge = (
                                <span className="outfit-400 inline-flex items-center gap-1 text-[12px] font-medium text-gray-600">
                                  <i className="bx bx-check-circle text-[14px]" />
                                  Completed
                                </span>
                              );
                            }

                            return (
                              <tr
                                key={quiz.classPersonalQuizID}
                                className="outfit-400 group cursor-pointer transition-colors hover:bg-gray-50"
                              >
                                <td className="px-3 py-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded"
                                        style={{
                                          backgroundColor: getHeaderColor(
                                            quiz.classPersonalQuizID ??
                                              quiz.quiz?.personalQuizID,
                                          ),
                                        }}
                                      >
                                        <span className="outfit-400 text-[16px] font-semibold text-white">
                                          Q
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-sm font-semibold text-gray-900">
                                          {quiz.quiz?.title || "Untitled Quiz"}
                                        </span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                          {statusBadge}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {formatDateRange(
                                      assignment.effectiveStartDate ||
                                        assignment.startDate,
                                      assignment.effectiveEndDate ||
                                        assignment.deadlineDate,
                                    )}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-sm font-medium text-gray-900">
                                      {stats.completedCount || 0}/
                                      {stats.totalEnrolled || 0}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {stats.completionRate
                                        ? stats.completionRate.toFixed(1)
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {stats.totalAttempts || 0}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm font-medium text-gray-900">
                                    {stats.averagePercentage
                                      ? stats.averagePercentage.toFixed(1)
                                      : 0}
                                    %
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm font-medium text-gray-900">
                                    {stats.passRate
                                      ? stats.passRate.toFixed(1)
                                      : 0}
                                    %
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {quiz.class?.className || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/quiz-overview", {
                                          state: {
                                            classID: quiz.class?.classID,
                                            classPersonalQuizID:
                                              quiz.classPersonalQuizID,
                                            quiz: quiz.quiz,
                                            subject: quiz.quiz?.subject,
                                          },
                                        });
                                      }}
                                      className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:bg-gray-100"
                                    >
                                      <i className="bx bx-caret-right text-lg"></i>
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          } else {
                            // Student view (original)
                            const accuracy = calculateAccuracy(
                              quiz.studentStatus?.highestPercentage,
                            );
                            const hasCompleted =
                              quiz.studentStatus?.hasCompleted;
                            const attemptCount =
                              quiz.studentStatus?.attemptCount || 0;
                            const maxAttempts = quiz.settings?.quizAttempts;
                            const answeredText =
                              maxAttempts && attemptCount > 0
                                ? `${attemptCount}/${maxAttempts}`
                                : attemptCount > 0
                                  ? `${attemptCount}`
                                  : "—";

                            // Calculate stroke dasharray for circular progress
                            const circumference = 2 * Math.PI * 16;
                            const strokeDasharray =
                              accuracy !== null
                                ? `${(accuracy / 100) * circumference} ${circumference}`
                                : `0 ${circumference}`;

                            // Determine status icon
                            let statusIcon = null;
                            if (activeTab === "completed" || hasCompleted) {
                              statusIcon = (
                                <i className="bx bx-check-circle text-sm text-green-500"></i>
                              );
                            } else if (activeTab === "missed") {
                              statusIcon = (
                                <i className="bx bx-x-circle text-sm text-red-500"></i>
                              );
                            } else if (activeTab === "upcoming") {
                              statusIcon = (
                                <i className="bx bx-time text-sm text-blue-500"></i>
                              );
                            }

                            return (
                              <tr
                                key={quiz.classPersonalQuizID}
                                className="group cursor-pointer transition-colors hover:bg-gray-50"
                              >
                                <td className="px-3 py-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded"
                                        style={{
                                          backgroundColor: getHeaderColor(
                                            quiz.classPersonalQuizID ??
                                              quiz.quiz?.personalQuizID,
                                          ),
                                        }}
                                      >
                                        <span className="outfit-400 text-[16px] font-semibold text-white">
                                          Q
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-900">
                                            {quiz.quiz?.title ||
                                              "Untitled Quiz"}
                                          </span>
                                          {statusIcon}
                                        </div>
                                        {quiz.quiz?.description && (
                                          <span className="mt-1 block text-xs text-gray-500">
                                            {quiz.quiz.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {formatDateRange(
                                      quiz.assignment?.startDate,
                                      quiz.assignment?.deadlineDate,
                                    )}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {answeredText}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    {accuracy !== null ? (
                                      <div className="relative h-8 w-8">
                                        <svg
                                          className="h-8 w-8 -rotate-90 transform"
                                          viewBox="0 0 36 36"
                                        >
                                          <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="3"
                                          />
                                          <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke={
                                              accuracy >= 70
                                                ? "#10b981"
                                                : accuracy >= 50
                                                  ? "#f59e0b"
                                                  : "#ef4444"
                                            }
                                            strokeWidth="3"
                                            strokeDasharray={strokeDasharray}
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                          {accuracy}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-500">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-sm text-gray-900">
                                      {quiz.class?.className || "—"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/quiz-overview", {
                                          state: {
                                            classID: quiz.class?.classID,
                                            classPersonalQuizID:
                                              quiz.classPersonalQuizID,
                                            quiz: quiz.quiz || quiz,
                                            subject: quiz.quiz?.subject,
                                          },
                                        });
                                      }}
                                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                      <i className="bx bx-caret-right text-lg"></i>
                                      {activeTab === "completed" || hasCompleted
                                        ? "View"
                                        : activeTab === "upcoming"
                                          ? "View"
                                          : "Start"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sessions;
