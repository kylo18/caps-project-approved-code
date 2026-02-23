import React, { useEffect, useState } from "react";
import emptyImage from "/src/assets/icons/empty.png";

const QuizResultsTable = ({ classPersonalQuizID, personalQuizID }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState("recent");
  const [recentResults, setRecentResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [nonTakers, setNonTakers] = useState([]);
  const [lateSubmitters, setLateSubmitters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonTakersLoading, setNonTakersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nonTakersError, setNonTakersError] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);

  useEffect(() => {
    if (!classPersonalQuizID && !personalQuizID) return;

    const fetchQuizResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }

        // If classPersonalQuizID exists, use the old API
        if (classPersonalQuizID) {
          const response = await fetch(
            `${apiUrl}/quizzes/${classPersonalQuizID}/results`,
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to fetch quiz results (${response.status})`,
            );
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.message || "Failed to fetch quiz results");
          }

          setQuizInfo({
            quiz: data.quiz,
            assignment: data.assignment,
          });

          // Set recent results (all attempts sorted by submitted_at desc)
          const allAttempts = [];
          data.students.forEach((student) => {
            student.allAttempts.forEach((attempt) => {
              allAttempts.push({
                ...attempt,
                student: student.student,
              });
            });
          });
          // Sort by submitted_at descending (most recent first)
          allAttempts.sort(
            (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at),
          );
          setRecentResults(allAttempts);

          // Set leaderboard (students sorted by highest percentage, then score)
          const leaderboardData = data.students
            .map((student) => ({
              student: student.student,
              highestAttempt: student.highestAttempt,
              totalAttempts: student.totalAttempts,
            }))
            .sort((a, b) => {
              const percentageA =
                typeof a.highestAttempt.percentage === "number"
                  ? a.highestAttempt.percentage
                  : parseFloat(a.highestAttempt.percentage || 0);
              const percentageB =
                typeof b.highestAttempt.percentage === "number"
                  ? b.highestAttempt.percentage
                  : parseFloat(b.highestAttempt.percentage || 0);
              if (percentageB !== percentageA) {
                return percentageB - percentageA;
              }
              return b.highestAttempt.score - a.highestAttempt.score;
            });
          setLeaderboard(leaderboardData);
        } else if (personalQuizID) {
          // Use new API for personal quiz without class assignment
          // Fetch recent takers
          const recentResponse = await fetch(
            `${apiUrl}/personal-quiz/${personalQuizID}/recent-takers`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!recentResponse.ok) {
            const errorData = await recentResponse.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to fetch recent takers (${recentResponse.status})`,
            );
          }

          const recentData = await recentResponse.json();

          if (!recentData.success) {
            throw new Error(
              recentData.message || "Failed to fetch recent takers",
            );
          }

          setQuizInfo({
            quiz: recentData.quiz,
          });

          // Transform recent takers to match the expected format
          const transformedRecent = recentData.recentTakers.map((taker) => ({
            id: taker.userID,
            student: {
              userID: taker.userID,
              userCode: taker.studentID,
              firstName: taker.firstName,
              lastName: taker.lastName,
              course: taker.course,
              yearLevel: taker.yearLevel,
            },
            score: taker.lastAttemptScore,
            total_score: taker.lastAttemptTotalScore,
            percentage: taker.lastAttemptPercentage,
            submitted_at: taker.lastAttemptDate
              ? typeof taker.lastAttemptDate === "string"
                ? taker.lastAttemptDate
                : taker.lastAttemptDate.toISOString()
              : null,
            attempt_number: taker.attempts, // Total attempts (will show as "Attempt X")
            isLatest: true, // Flag to indicate this is the latest attempt
          }));

          setRecentResults(transformedRecent);

          // Fetch leaderboard
          const leaderboardResponse = await fetch(
            `${apiUrl}/personal-quiz/${personalQuizID}/leaderboard`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!leaderboardResponse.ok) {
            const errorData = await leaderboardResponse
              .json()
              .catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to fetch leaderboard (${leaderboardResponse.status})`,
            );
          }

          const leaderboardData = await leaderboardResponse.json();

          if (!leaderboardData.success) {
            throw new Error(
              leaderboardData.message || "Failed to fetch leaderboard",
            );
          }

          // Transform leaderboard to match the expected format
          const transformedLeaderboard = leaderboardData.leaderboard.map(
            (item) => ({
              student: {
                userID: item.userID,
                userCode: item.studentID,
                firstName: item.firstName,
                lastName: item.lastName,
                course: item.course,
                yearLevel: item.yearLevel,
              },
              highestAttempt: {
                score: item.highestScore,
                total_score: item.totalScore,
                percentage: item.highestPercentage,
              },
              totalAttempts: item.attempts,
            }),
          );

          setLeaderboard(transformedLeaderboard);
        }
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [classPersonalQuizID, personalQuizID, apiUrl]);

  // Fetch non-takers and late submitters (only available for class assignments)
  useEffect(() => {
    if (!classPersonalQuizID) {
      // Clear non-takers and late submitters if no class assignment
      setNonTakers([]);
      setLateSubmitters([]);
      return;
    }

    const fetchNonTakers = async () => {
      if (activeTab !== "nonTakers" && activeTab !== "lateSubmitters") return;

      setNonTakersLoading(true);
      setNonTakersError(null);
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }

        const response = await fetch(
          `${apiUrl}/quizzes/${classPersonalQuizID}/non-takers`,
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to fetch non-takers (${response.status})`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch non-takers");
        }

        setNonTakers(data.nonTakers || []);
        setLateSubmitters(data.lateSubmitters || []);
      } catch (err) {
        setNonTakersError(err.message || "An unknown error occurred.");
      } finally {
        setNonTakersLoading(false);
      }
    };

    fetchNonTakers();
  }, [classPersonalQuizID, activeTab, apiUrl]);

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

  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined) return "—";
    const num =
      typeof percentage === "number" ? percentage : parseFloat(percentage || 0);
    return `${num.toFixed(1)}%`;
  };

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

  return (
    <div className="outfit mx-auto mt-6 w-full max-w-[1200px]">
      <div className="mb-4 flex gap-4">
        <button
          className={`outfit-500 cursor-pointer px-1 py-[6px] text-[14px] font-semibold transition-colors ${
            activeTab === "recent"
              ? "border-b-3 border-orange-500 text-orange-500"
              : "rounded-xl border-transparent text-gray-600"
          }`}
          onClick={() => setActiveTab("recent")}
        >
          <span className="flex items-center gap-2">
            <i className="bx bx-history text-[16px]"></i>
            <span className="text-[14px]">Recently Answered</span>
          </span>
        </button>

        <button
          className={`outfit-500 cursor-pointer px-1 py-[6px] text-[14px] font-semibold transition-colors ${
            activeTab === "leaderboard"
              ? "border-b-3 border-orange-500 text-orange-500"
              : "rounded-xl border-transparent text-gray-600"
          }`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <span className="flex items-center gap-2">
            <i className="bx bx-chart-bar-big-columns text-[16px]"></i>
            <span className="text-[14px]">Leaderboard</span>
          </span>
        </button>

        {classPersonalQuizID && (
          <>
            <button
              className={`outfit-500 cursor-pointer px-1 py-[6px] text-[14px] font-semibold transition-colors ${
                activeTab === "nonTakers"
                  ? "border-b-3 border-orange-500 text-orange-500"
                  : "rounded-xl border-transparent text-gray-600"
              }`}
              onClick={() => setActiveTab("nonTakers")}
            >
              <span className="flex items-center gap-2">
                <i className="bx bx-user-x text-[16px]"></i>
                <span className="text-[14px]">Missing </span>
              </span>
            </button>

            <button
              className={`outfit-500 cursor-pointer px-1 py-[6px] text-[14px] font-semibold transition-colors ${
                activeTab === "lateSubmitters"
                  ? "border-b-3 border-orange-500 text-orange-500"
                  : "rounded-xl border-transparent text-gray-600"
              }`}
              onClick={() => setActiveTab("lateSubmitters")}
            >
              <span className="flex items-center gap-2">
                <i className="bx bx-future text-[16px]"></i>
                <span className="text-[14px]">Late</span>
              </span>
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "recent" ? (
        loading ? (
          <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
            Loading quiz results...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Unknown Errorr</p>
            <p>{error}</p>
          </div>
        ) : recentResults.length === 0 ? (
          <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No quiz results available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="text-sm text-gray-600">No quiz results yet.</p>
            </div>
          </div>
        ) : (
          <div className="border-gray- overflow-x-auto rounded-xl bg-white">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-[14px]">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  {/* Name – wide & left */}
                  <th className="outfit-500 w-[45%] px-6 py-3 text-left">
                    Name
                  </th>

                  {/* Tight columns – right */}
                  <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                    User ID
                  </th>
                  <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                    Attempt
                  </th>
                  <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                    Score
                  </th>
                  <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                    Percentage
                  </th>
                  <th className="outfit-500 w-[15%] px-2 py-3 text-right whitespace-nowrap">
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {recentResults.map((result, idx) => (
                  <tr
                    key={result.id || idx}
                    className="outfit-400 hover:bg-gray-50"
                  >
                    {/* Name */}
                    <td className="w-[40%] px-6 py-3 text-gray-700">
                      {result.student?.firstName} {result.student?.lastName}
                    </td>

                    {/* User ID */}
                    <td className="w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                      {result.student?.userCode}
                    </td>

                    {/* Attempt */}
                    <td className="w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                      {result.attempt_number}
                    </td>

                    {/* Score */}
                    <td className="w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                      {result.score}/{result.total_score}
                    </td>

                    {/* Percentage */}
                    <td className="w-[10%] px-2 py-3 text-right font-medium whitespace-nowrap text-gray-800">
                      {formatPercentage(result.percentage)}
                    </td>

                    {/* Submitted */}
                    <td className="w-[20%] px-2 py-3 text-right whitespace-nowrap text-gray-600">
                      {formatDateTime(result.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === "leaderboard" ? (
        loading ? (
          <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No leaderboard data available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="text-sm text-gray-600">No leaderboard data yet.</p>
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

                  <th className="outfit-500 w-[20%] px-6 py-3 text-right">
                    User ID
                  </th>
                  <th className="outfit-500 w-[15%] px-2 py-3 text-right whitespace-nowrap">
                    Best Score
                  </th>
                  <th className="outfit-500 w-[15%] px-2 py-3 text-right whitespace-nowrap">
                    Best Percentage
                  </th>
                  <th className="outfit-500 w-[10%] px-2 py-3 text-right whitespace-nowrap">
                    Attempts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leaderboard.map((row, idx) => (
                  <tr
                    key={row.student?.userID || idx}
                    className="hover:bg-gray-50"
                  >
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
                      {row.student?.firstName} {row.student?.lastName}
                    </td>
                    <td className="outfit-400 w-[20%] px-6 py-3 text-right text-gray-700">
                      {row.student?.userCode}
                    </td>
                    <td className="outfit-400 w-[15%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                      {row.highestAttempt?.score} /{" "}
                      {row.highestAttempt?.total_score}
                    </td>
                    <td className="outfit-400 w-[15%] px-2 py-3 text-right font-medium whitespace-nowrap text-gray-800">
                      {formatPercentage(row.highestAttempt?.percentage)}
                    </td>
                    <td className="outfit-400 w-[10%] px-2 py-3 text-right whitespace-nowrap text-gray-700">
                      {row.totalAttempts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === "nonTakers" ? (
        nonTakersLoading ? (
          <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
            Loading non-takers...
          </div>
        ) : nonTakersError ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p>{nonTakersError}</p>
          </div>
        ) : nonTakers.length === 0 ? (
          <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No non-takers available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="text-sm text-gray-600">
                All students have taken this quiz.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Student Code
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Enrolled Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {nonTakers.map((item, idx) => (
                  <tr
                    key={item.student?.userID || idx}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.student?.firstName} {item.student?.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.student?.userCode || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.student?.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(item.enrolledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === "lateSubmitters" ? (
        nonTakersLoading ? (
          <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
            Loading late submitters...
          </div>
        ) : nonTakersError ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p>{nonTakersError}</p>
          </div>
        ) : lateSubmitters.length === 0 ? (
          <div className="outfit-400 flex h-70 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
            <div className="text-center">
              <img
                src={emptyImage}
                alt="No late submitters available"
                className="mx-auto mb-3 h-32 w-32 opacity-80"
              />
              <p className="text-sm text-gray-600">
                No late submissions found.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Student Code
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Days Late
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Latest Score
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Latest Percentage
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Submitted At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {lateSubmitters.map((item, idx) => (
                  <tr
                    key={item.student?.userID || idx}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.student?.firstName} {item.student?.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.student?.userCode || "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-red-600">
                      {item.latestResult?.daysLate || 0} day
                      {item.latestResult?.daysLate !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.latestResult?.score} /{" "}
                      {item.latestResult?.total_score}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatPercentage(item.latestResult?.percentage)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(item.latestResult?.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
};

export default QuizResultsTable;
