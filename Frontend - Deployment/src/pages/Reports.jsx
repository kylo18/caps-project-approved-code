import React, { useEffect, useState } from "react";
import EmptyImage from "../assets/icons/empty.png";

const Reports = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [recentTakers, setRecentTakers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

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
    if (activeTab !== "recent") return;

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
        const token = sessionStorage.getItem("token");
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
        <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0">
          <div className="space-y-4">
            <div>
              <h1 className="outfit-500 text-[18px] text-black">Reports</h1>
              <p className=" outfit-400 text-[14px] text-gray-600">
                View overall practice exam statistics across all subjects.
              </p>
            </div>

            <div className="my-4 h-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("recent")}
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
                onClick={() => setActiveTab("leaderboard")}
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
            <div className="outfit-400 text-[14px] py-8 text-center text-gray-500">
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
            <div className="outfit-400 flex text-[14px] min-h-64 outfit-400 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12">
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
            <div className=" mb-6 outfit overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                      <tr key={row.userID || idx} className="outfit-400 group cursor-pointer transition-colors hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">{idx + 1}</td>
                        {isFaculty && (
                          <>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              {row.name ||
                                `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                                "-"}
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                              {row.course || "-"}
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                              {row.year || row.yearLevel || "-"}
                            </td>
                            <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                              {row.studentID || "-"}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {row.lastAttemptSubject?.subjectName ||
                            row.lastAttemptSubject?.subjectCode ||
                            "-"}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {row.lastAttemptScore || 0} / {row.totalPoints || 0}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.lastAttemptPercentage || 0}%
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.highestPercentage || 0}%
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.averagePercentage || 0}%
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {row.totalAttempts || 0}
                        </td>
                      
                        <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                          {formatDate(row.lastAttemptDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : leaderboardLoading ? (
          <div className="py-8 text-[14px] outfit-400 text-center text-gray-500">
            Loading leaderboard...
          </div>
        ) : leaderboardError ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p>{leaderboardError}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex min-h-64 outfit-400 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12">
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
          <div className="outfit overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                    <tr key={row.userID || idx} className="outfit-400 group cursor-pointer transition-colors hover:bg-gray-50">
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
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                        {row.course || "-"}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                        {row.year || row.yearLevel || "-"}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                        {row.studentID || "-"}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.averagePercentage || 0}%
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.highestPercentage || 0}%
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                        {row.totalAttempts || 0}
                      </td>
                      
                      <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                        {formatDate(row.lastAttemptDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
