import React, { useEffect, useState } from "react";
import EmptyImage from "../assets/icons/empty.png";
import StudentPfp from "/src/assets/symbols/student.png";
import FacultyPfp from "/src/assets/symbols/faculty.png";
import ProgramChairPfp from "/src/assets/symbols/progchair.png";
import DeanPfp from "/src/assets/symbols/dean.png";
import { getApiBaseUrl } from "../utils/config";

const roleImages = {
  1: StudentPfp,
  2: FacultyPfp,
  3: ProgramChairPfp,
  4: DeanPfp,
  5: DeanPfp,
};

const Reports = () => {
  const apiUrl = getApiBaseUrl();
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [recentTakers, setRecentTakers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Determine if user is student (role 1) or faculty/above (roles 2, 3, 4, 5)
  const isStudent = userRole === 1;
  const isFaculty = userRole && [2, 3, 4, 5].includes(Number(userRole));

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  // Fetch recent takers when tab is switched to recent
  useEffect(() => {
    if (activeTab !== "recent") return;

    setLoading(true);
    setError(null);

    const fetchRecentTakers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }

        const response = await fetch(
          `${apiUrl}/practice-exam/overall-recent-takers`,
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
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTakers();
  }, [activeTab, apiUrl]);

  // Fetch leaderboard when tab is switched to leaderboard
  useEffect(() => {
    if (activeTab !== "leaderboard") return;

    setLeaderboardLoading(true);
    setLeaderboardError(null);

    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }

        const response = await fetch(
          `${apiUrl}/practice-exam/overall-leaderboard`,
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
              `Failed to fetch leaderboard (${response.status})`,
          );
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch leaderboard");
        }

        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setLeaderboardError(err.message || "An unknown error occurred.");
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, apiUrl]);

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

  return (
    <>
      <div className="flex h-screen">
        <div className="mt-10 flex h-full flex-1 flex-col gap-6 overflow-y-auto p-4 pb-0 md:p-6 lg:mt-0">
          <div className="space-y-4">
            <div>
              <h1 className="outfit-500 text-[18px] text-black">Reports</h1>
              <p className="outfit-400 text-[14px] text-gray-600">
                View overall practice exam statistics across all subjects.
              </p>
            </div>

            <div className="my-4 h-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("recent");
                  setExpandedId(null);
                }}
                className={`outfit-500 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                  activeTab === "recent"
                    ? "bg-gray-100 text-black"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="bx bx-history text-[16px]"></i>
                  Recent Takers
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("leaderboard");
                  setExpandedId(null);
                }}
                className={`outfit-500 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                  activeTab === "leaderboard"
                    ? "bg-gray-100 text-black"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="bx bx-bar-chart-big text-[16px]"></i>
                  Leaderboard
                </span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "recent" ? (
              loading ? (
                <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
                  {isStudent
                    ? "Loading your recent activity..."
                    : "Loading recent takers..."}
                </div>
              ) : error ? (
                <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              ) : recentTakers.length === 0 ? (
                <div className="outfit-400 outfit-400 flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-[14px]">
                  <img
                    src={EmptyImage}
                    alt="No recent activity"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="text-center text-sm text-gray-600">
                    {isStudent
                      ? "No recent exam activity found."
                      : "No recent practice exam takers found."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile expandable list - Recent Takers */}
                  <div className="outfit-400 mb-6 space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white xl:hidden">
                    {recentTakers.map((row, idx) => {
                      const rowId = row.userID ?? `recent-${idx}`;
                      const isExpanded = expandedId === rowId;
                      const displayName =
                        row.name ||
                        `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                        "-";
                      const displayScore = `${row.lastAttemptScore || 0} / ${row.totalPoints || 0}`;

                      const roleId = row.roleID ?? row.roleId ?? 1;

                      return (
                        <div
                          key={rowId}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : rowId)
                            }
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            {/* Profile Image */}
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                              <img
                                src={roleImages[roleId] || StudentPfp}
                                alt={displayName}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            {/* Name + Course */}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </div>
                              <div className="outfit-400 text-xs text-gray-500">
                                {row.course || "-"}
                              </div>
                            </div>

                            {/* Subject + Score + Chevron */}
                            <div className="flex shrink-0 items-center gap-4">
                              {/* Subject + Score (Stacked) */}
                              <div className="mr-4 flex flex-col items-end leading-tight">
                                <span className="text-xs text-gray-500">
                                  {row.lastAttemptSubject?.subjectName || "-"}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {displayScore}
                                </span>
                              </div>

                              {/* Chevron */}
                              <i
                                className={`bx bx-chevron-down text-xl text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                              <div className="space-y-3 text-sm">
                                {isFaculty && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Year
                                      </span>
                                      <span className="text-gray-900">
                                        {row.year || row.yearLevel || "-"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Student ID
                                      </span>
                                      <span className="text-gray-900">
                                        {row.studentID || "-"}
                                      </span>
                                    </div>
                                  </>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Last Subject
                                  </span>
                                  <span className="text-gray-900">
                                    {row.lastAttemptSubject?.subjectName ||
                                      row.lastAttemptSubject?.subjectCode ||
                                      "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Last Score
                                  </span>
                                  <span className="text-gray-900">
                                    {row.lastAttemptScore || 0} /{" "}
                                    {row.totalPoints || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Highest %
                                  </span>
                                  <span className="text-gray-900">
                                    {row.highestPercentage || 0}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Avg %</span>
                                  <span className="text-gray-900">
                                    {row.averagePercentage || 0}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Attempts
                                  </span>
                                  <span className="text-gray-900">
                                    {row.totalAttempts || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Last Attempt
                                  </span>
                                  <span className="text-gray-900">
                                    {formatDate(row.lastAttemptDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table - Recent Takers */}
                  <div className="outfit mb-6 hidden overflow-hidden rounded-xl border border-gray-200 bg-white xl:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="outfit-400 border-b border-gray-200 bg-white">
                          <tr>
                            <th className="px-3 py-3 text-left text-[12px] font-medium text-gray-600 uppercase">
                              #
                            </th>
                            {isFaculty && (
                              <>
                                <th className="px-3 py-3 text-left text-[12px] font-medium text-gray-600 uppercase">
                                  Name
                                </th>
                                <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                  Course
                                </th>
                                <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                  Year
                                </th>
                                <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                                  Student ID
                                </th>
                              </>
                            )}
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Last Subject
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Last Score
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Last %
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Highest %
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Avg %
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Attempts
                            </th>
                            <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                              Last Attempt
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {recentTakers.map((row, idx) => (
                            <tr
                              key={row.userID || idx}
                              className="outfit-400 group cursor-pointer transition-colors hover:bg-gray-50"
                            >
                              <td className="px-3 py-3 text-sm text-gray-900">
                                {idx + 1}
                              </td>
                              {isFaculty && (
                                <>
                                  <td className="px-3 py-3 text-sm text-gray-900">
                                    {row.name ||
                                      `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                                      "-"}
                                  </td>
                                  <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                    {row.course || "-"}
                                  </td>
                                  <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                    {row.year || row.yearLevel || "-"}
                                  </td>
                                  <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                    {row.studentID || "-"}
                                  </td>
                                </>
                              )}
                              <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                {row.lastAttemptSubject?.subjectName ||
                                  row.lastAttemptSubject?.subjectCode ||
                                  "-"}
                              </td>
                              <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                {row.lastAttemptScore || 0} /{" "}
                                {row.totalPoints || 0}
                              </td>
                              <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900">
                                {row.lastAttemptPercentage || 0}%
                              </td>
                              <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900">
                                {row.highestPercentage || 0}%
                              </td>
                              <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900">
                                {row.averagePercentage || 0}%
                              </td>
                              <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                                {row.totalAttempts || 0}
                              </td>
                              <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-600">
                                {formatDate(row.lastAttemptDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )
            ) : leaderboardLoading ? (
              <div className="outfit-400 py-8 text-center text-[14px] text-gray-500">
                Loading leaderboard...
              </div>
            ) : leaderboardError ? (
              <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
                <p className="font-semibold">Error</p>
                <p>{leaderboardError}</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="outfit-400 flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12">
                <img
                  src={EmptyImage}
                  alt="No leaderboard"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="text-center text-[14px] text-gray-600">
                  No leaderboard data available yet.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile expandable list - Leaderboard */}
                <div className="outfit-400 space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white xl:hidden">
                  {leaderboard.map((row, idx) => {
                    const rowId = row.userID ?? `leaderboard-${idx}`;
                    const isExpanded = expandedId === rowId;
                    const displayName =
                      row.name ||
                      `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                      "-";
                    const displayScore = `${row.averagePercentage || 0}%`;
                    const roleId = row.roleID ?? row.roleId ?? 1;

                    return (
                      <div
                        key={rowId}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : rowId)
                          }
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                            <img
                              src={roleImages[roleId] || StudentPfp}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </span>
                              {idx === 0 && (
                                <i className="bx bx-trophy text-yellow-500"></i>
                              )}
                            </div>
                            <div className="outfit-400 text-xs text-gray-500">
                              {row.course || "-"}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {displayScore}
                            </span>
                            <i
                              className={`bx bx-chevron-down text-xl text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Rank</span>
                                <span className="text-gray-900">{idx + 1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Year</span>
                                <span className="text-gray-900">
                                  {row.year || row.yearLevel || "-"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Student ID
                                </span>
                                <span className="text-gray-900">
                                  {row.studentID || "-"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Highest %</span>
                                <span className="text-gray-900">
                                  {row.highestPercentage || 0}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Attempts</span>
                                <span className="text-gray-900">
                                  {row.totalAttempts || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Last Attempt
                                </span>
                                <span className="text-gray-900">
                                  {formatDate(row.lastAttemptDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table - Leaderboard */}
                <div className="outfit hidden overflow-hidden rounded-xl border border-gray-200 bg-white xl:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="outfit-400 border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-3 py-3 text-left text-[12px] font-medium text-gray-600 uppercase">
                            Rank
                          </th>
                          <th className="px-3 py-3 text-left text-[12px] font-medium text-gray-600 uppercase">
                            Name
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Course
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Year
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Student ID
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Avg %
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Highest %
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Attempts
                          </th>
                          <th className="px-3 py-3 text-center text-[12px] font-medium text-gray-600 uppercase">
                            Last Attempt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {leaderboard.map((row, idx) => (
                          <tr
                            key={row.userID || idx}
                            className="outfit-400 group cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <td className="px-3 py-3 text-sm text-gray-900">
                              {idx === 0 && (
                                <i className="bx bx-trophy mr-1 text-yellow-500"></i>
                              )}
                              {idx + 1}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              {row.name ||
                                `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                                "-"}
                            </td>
                            <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                              {row.course || "-"}
                            </td>
                            <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                              {row.year || row.yearLevel || "-"}
                            </td>
                            <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                              {row.studentID || "-"}
                            </td>
                            <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900">
                              {row.averagePercentage || 0}%
                            </td>
                            <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-900">
                              {row.highestPercentage || 0}%
                            </td>
                            <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-900">
                              {row.totalAttempts || 0}
                            </td>
                            <td className="px-3 py-3 text-center text-sm whitespace-nowrap text-gray-600">
                              {formatDate(row.lastAttemptDate)}
                            </td>
                          </tr>
                        ))}
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

export default Reports;
