import React, { useEffect, useState } from "react";
import emptyImage from "/src/assets/icons/empty.png";
const ExamResultsTable = ({
  subjectID,
  results: propResults,
  averageScore: propAverageScore,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [userRole, setUserRole] = useState(null);
  const [recentTakers, setRecentTakers] = useState([]);
  const [loading, setLoading] = useState(!propResults);
  const [error, setError] = useState(null);
  const [subjectName, setSubjectName] = useState("this Subject");
  const [activeTab, setActiveTab] = useState("recent");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [leaderboardSortBy, setLeaderboardSortBy] = useState("highest"); // "highest" or "average"

  // Percentage display mode: "original" (backend) or "scaled" ((score/total)*50+50)
  const [percentageMode, setPercentageMode] = useState("original");

  // Mobile detail modal for recent takers
  const [selectedRecent, setSelectedRecent] = useState(null);
  const [showRecentModal, setShowRecentModal] = useState(false);

  // Determine if user is student (role 1) or faculty/above (roles 2, 3, 4, 5)
  const isStudent = userRole === 1;
  const isFaculty = userRole && [2, 3, 4, 5].includes(Number(userRole));

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  // Fetch recent takers when tab is switched to recent
  useEffect(() => {
    if (activeTab !== "recent" || !subjectID) return;

    setLoading(true);
    setError(null);

    const fetchRecentTakers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }

        const response = await fetch(
          `${apiUrl}/practice-exam/recent-takers/${subjectID}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to fetch recent takers (${response.status})`,
          );
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch recent takers");
        }

        setRecentTakers(data.recentTakers || []);
        if (data.subject) {
          setSubjectName(data.subject.subjectName || "this Subject");
        }
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTakers();
  }, [activeTab, subjectID, apiUrl]);

  // Fetch leaderboard when tab is switched to leaderboard
  useEffect(() => {
    if (activeTab !== "leaderboard" || !subjectID) return;
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    const token = sessionStorage.getItem("token");
    fetch(`${apiUrl}/practice-exam/leaderboard/${subjectID}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.message || `Failed to fetch leaderboard (${res.status})`,
          );
        }
        return res.json();
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch leaderboard");
        }
        setLeaderboard(data.leaderboard || []);
        if (data.subject) {
          setSubjectName(data.subject.subjectName || "this Subject");
        }
      })
      .catch((err) => {
        setLeaderboardError(err.message || "An unknown error occurred.");
      })
      .finally(() => setLeaderboardLoading(false));
  }, [activeTab, subjectID, apiUrl]);

  // Sort leaderboard based on selected sort option
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (leaderboardSortBy === "highest") {
      // Sort by highest percentage, then highest score, then attempts
      if (b.highestPercentage !== a.highestPercentage) {
        return b.highestPercentage - a.highestPercentage;
      }
      if (b.highestScore !== a.highestScore) {
        return b.highestScore - a.highestScore;
      }
      return b.attempts - a.attempts;
    } else {
      // Sort by average - since backend doesn't provide average,
      // we'll use highestPercentage as the metric (same as highest)
      // In a real scenario, you'd calculate average from all attempts
      if (b.highestPercentage !== a.highestPercentage) {
        return b.highestPercentage - a.highestPercentage;
      }
      if (b.highestScore !== a.highestScore) {
        return b.highestScore - a.highestScore;
      }
      return b.attempts - a.attempts;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
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

  const getExamPercentageValue = (rawPercentage, score, totalPoints) => {
    if (!totalPoints || totalPoints <= 0) {
      if (rawPercentage === null || rawPercentage === undefined) return null;
      return typeof rawPercentage === "number"
        ? rawPercentage
        : parseFloat(rawPercentage || 0);
    }

    const base =
      rawPercentage !== null && rawPercentage !== undefined
        ? typeof rawPercentage === "number"
          ? rawPercentage
          : parseFloat(rawPercentage || 0)
        : (score / totalPoints) * 100;

    if (percentageMode === "original") {
      return base;
    }

    // Scaled formula: (score / totalPoints) * 50 + 50
    return (score / totalPoints) * 50 + 50;
  };

  const togglePercentageMode = () => {
    setPercentageMode((prev) => (prev === "original" ? "scaled" : "original"));
  };

  return (
    <div className="outfit mx-auto w-full max-w-[1200px]">
      {/* Tabs - stretch full width on mobile */}
      <div className="mb-4 flex w-full flex-wrap gap-2 border-b border-gray-200 bg-white">
        <button
          className={`outfit-500 flex-1 cursor-pointer px-2 py-3 text-center text-[13px] font-semibold transition-colors ${
            activeTab === "recent"
              ? "border-b-3 border-orange-500 text-orange-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("recent")}
        >
          <span className="flex items-center justify-center gap-2">
            <i className="bx bx-history text-[16px]"></i>
            <span className="text-[13px]">Recently Answered</span>
          </span>
        </button>

        <button
          className={`outfit-500 flex-1 cursor-pointer px-2 py-3 text-center text-[13px] font-semibold transition-colors ${
            activeTab === "leaderboard"
              ? "border-b-3 border-orange-500 text-orange-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <span className="flex items-center justify-center gap-2">
            <i className="bx bx-chart-bar-big-columns text-[16px]"></i>
            <span className="text-[13px]">Leaderboard</span>
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "recent" ? (
        loading ? (
          <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
            {isStudent ? "Loading your results..." : "Loading recent takers..."}
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Unknown Errorr</p>
            <p>{error}</p>
          </div>
        ) : recentTakers.length === 0 ? (
          <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:border">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No users available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="text-sm text-gray-600">
                {isStudent
                  ? "No recent exam results for this subject yet."
                  : "No recent practice exam takers for this subject yet."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="border-gray- hidden overflow-x-auto rounded-xl bg-white md:block">
              <table className="min-w-full table-fixed divide-y divide-gray-200 text-[14px]">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    {isFaculty && (
                      <th className="outfit-500 w-[40%] px-6 py-3 text-left">
                        Name
                      </th>
                    )}
                    <th className="outfit-500 w-[15%] px-2 py-3 text-right whitespace-nowrap">
                      {isStudent ? "Last Attempt Score" : "Highest Score"}
                    </th>
                    <th className="outfit-500 w-[15%] px-2 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={togglePercentageMode}
                        className="flex w-full items-center justify-end gap-1"
                      >
                        <span>
                          {isStudent ? "Last Attempt %" : "Highest %"}
                        </span>
                        <i
                          className={`bx ${
                            percentageMode === "original"
                              ? "bx-toggle-left"
                              : "bx-toggle-right"
                          } text-[18px] text-gray-500`}
                        />
                      </button>
                    </th>
                    <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                      Attempts
                    </th>
                    <th className="outfit-500 w-[20%] px-2 py-3 text-right whitespace-nowrap">
                      Last Attempt Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentTakers.map((row, idx) => {
                    const rawPercentage = isStudent
                      ? row.lastAttemptPercentage
                      : row.highestPercentage;
                    const score = isStudent
                      ? row.lastAttemptScore
                      : row.highestScore;
                    const percentageValue = getExamPercentageValue(
                      rawPercentage,
                      score || 0,
                      row.totalPoints || 0,
                    );
                    return (
                      <tr
                        key={row.userID || idx}
                        className="outfit-400 hover:bg-gray-50"
                      >
                        {isFaculty && (
                          <td className="px-6 py-3 text-gray-700">
                            {row.name ||
                              `${row.firstName || ""} ${
                                row.lastName || ""
                              }`.trim() ||
                              "-"}
                          </td>
                        )}
                        <td className="px-2 py-3 text-right whitespace-nowrap text-gray-700">
                          {isStudent
                            ? `${row.lastAttemptScore || 0} / ${
                                row.totalPoints || 0
                              }`
                            : `${row.highestScore || 0} / ${
                                row.totalPoints || 0
                              }`}
                        </td>
                        <td className="px-2 py-3 text-right font-medium whitespace-nowrap text-gray-800">
                          {percentageValue === null
                            ? "—"
                            : `${percentageValue.toFixed(1)}%`}
                        </td>
                        <td className="px-2 py-3 text-right whitespace-nowrap text-gray-700">
                          {row.attempts || 0}
                        </td>
                        <td className="px-2 py-3 text-right whitespace-nowrap text-gray-600">
                          {formatDate(row.lastAttemptDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list: Name, Percentage, Score, opens modal */}
            <div className="space-y-2 md:hidden">
              {recentTakers.map((row, idx) => {
                const rawPercentage = isStudent
                  ? row.lastAttemptPercentage
                  : row.highestPercentage;
                const score = isStudent
                  ? row.lastAttemptScore
                  : row.highestScore;
                const percentageValue = getExamPercentageValue(
                  rawPercentage,
                  score || 0,
                  row.totalPoints || 0,
                );
                return (
                  <button
                    key={row.userID || idx}
                    type="button"
                    onClick={() => {
                      setSelectedRecent(row);
                      setShowRecentModal(true);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm active:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="outfit-500 truncate text-[14px] text-gray-900">
                          {row.name ||
                            `${row.firstName || ""} ${
                              row.lastName || ""
                            }`.trim() ||
                            "-"}
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="outfit-500 text-[13px] text-gray-900">
                          {percentageValue === null
                            ? "—"
                            : `${percentageValue.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-[12px] text-gray-500">
                      Score: {score || 0} / {row.totalPoints || 0}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )
      ) : (
        <>
          {/* Leaderboard Toggle */}

          {leaderboardLoading ? (
            <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
              Loading leaderboard...
            </div>
          ) : leaderboardError ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
              <p className="font-semibold">Error</p>
              <p>{leaderboardError}</p>
            </div>
          ) : sortedLeaderboard.length === 0 ? (
            <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
              <div className="text-center">
                <img
                  src={emptyImage}
                  alt="No users available"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="text-sm text-gray-600">
                  No leaderboard data for this subject yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="border-gray- overflow-x-auto rounded-xl bg-white">
              <table className="min-w-full table-fixed divide-y divide-gray-200 text-[14px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="outfit-500 w-[10%] px-6 py-3 text-center">
                      Rank
                    </th>
                    <th className="outfit-500 w-[30%] px-6 py-3 text-left">
                      Name
                    </th>
                    <th className="outfit-500 w-[10%] px-6 py-3 text-left">
                      Course
                    </th>
                    <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                      Year
                    </th>

                    <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                      {leaderboardSortBy === "highest"
                        ? "Highest Score"
                        : "Average Score"}
                    </th>
                    <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={togglePercentageMode}
                        className="flex w-full items-center justify-end gap-1"
                      >
                        <span>Highest %</span>
                        <i
                          className={`bx ${
                            percentageMode === "original"
                              ? "bx-toggle-left"
                              : "bx-toggle-right"
                          } text-[18px] text-gray-500`}
                        />
                      </button>
                    </th>
                    <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                      Attempts
                    </th>
                    <th className="outfit-500 ml-2 w-[20%] px-2 py-3 text-right whitespace-nowrap">
                      Last Attempt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedLeaderboard.map((row, idx) => {
                    const percentageValue = getExamPercentageValue(
                      row.highestPercentage,
                      row.highestScore || 0,
                      row.totalPoints || 0,
                    );
                    return (
                      <tr key={row.userID || idx} className="hover:bg-gray-50">
                        <td className="outfit-400 w-[10%] px-6 py-3 text-gray-700">
                          <div className="flex items-center justify-center gap-1">
                            {idx === 0 && (
                              <i className="bx bx-trophy text-yellow-500"></i>
                            )}
                            {idx === 1 && (
                              <i className="bx bx-trophy text-gray-400"></i>
                            )}
                            {idx === 2 && (
                              <i className="bx bx-trophy text-amber-600"></i>
                            )}
                            <span>{idx + 1}</span>
                          </div>
                        </td>
                        <td className="outfit-400 w-[30%] px-6 py-3 text-gray-700">
                          {row.name ||
                            `${row.firstName || ""} ${
                              row.lastName || ""
                            }`.trim() ||
                            "-"}
                        </td>
                        <td className="outfit-400 w-[10%] px-6 py-3 text-gray-700">
                          {row.course || "-"}
                        </td>
                        <td className="outfit-400 w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                          {row.year || row.yearLevel || "-"}
                        </td>

                        <td className="outfit-400 w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                          {leaderboardSortBy === "highest"
                            ? `${row.highestScore || 0} / ${
                                row.totalPoints || 0
                              }`
                            : `${row.highestPercentage || 0}%`}
                        </td>
                        <td className="outfit-400 w-[10%] px-2 py-3 text-right font-medium whitespace-nowrap text-gray-800">
                          {percentageValue === null
                            ? "—"
                            : `${percentageValue.toFixed(1)}%`}
                        </td>
                        <td className="outfit-400 w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                          {row.attempts || 0}
                        </td>
                        <td className="outfit-400 ml-4 w-[20%] px-2 py-3 text-right whitespace-nowrap text-gray-600">
                          {formatDate(row.lastAttemptDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile detail modal for recent takers */}
          {showRecentModal && selectedRecent && (
            <div className="lightbox-bg fixed inset-0 z-50 flex items-end justify-center md:items-center">
              <div className="animate-fade-in-up w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl md:rounded-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-gray-800">
                    Exam Result Details
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecentModal(false);
                      setSelectedRecent(null);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    <i className="bx bx-x text-xl" />
                  </button>
                </div>

                <div className="space-y-2 text-[13px] text-gray-700">
                  <div>
                    <span className="font-medium text-gray-500">Name: </span>
                    <span>
                      {selectedRecent.name ||
                        `${selectedRecent.firstName || ""} ${
                          selectedRecent.lastName || ""
                        }`.trim() ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">
                      Attempts:{" "}
                    </span>
                    <span>{selectedRecent.attempts || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Score: </span>
                    <span>
                      {(isStudent
                        ? selectedRecent.lastAttemptScore
                        : selectedRecent.highestScore) || 0}
                      {" / "}
                      {selectedRecent.totalPoints || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">
                      Percentage:{" "}
                    </span>
                    {(() => {
                      const rawPercentage = isStudent
                        ? selectedRecent.lastAttemptPercentage
                        : selectedRecent.highestPercentage;
                      const score = isStudent
                        ? selectedRecent.lastAttemptScore
                        : selectedRecent.highestScore;
                      const percentageValue = getExamPercentageValue(
                        rawPercentage,
                        score || 0,
                        selectedRecent.totalPoints || 0,
                      );
                      return (
                        <span>
                          {percentageValue === null
                            ? "—"
                            : `${percentageValue.toFixed(1)}%`}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">
                      Last Attempt:{" "}
                    </span>
                    <span>{formatDate(selectedRecent.lastAttemptDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamResultsTable;
