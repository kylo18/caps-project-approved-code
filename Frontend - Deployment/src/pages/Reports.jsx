import React, { useEffect, useState } from "react";

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
    <div className="mt-10 flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          View overall practice exam statistics across all subjects.
        </p>
      </div>

      <div className="outfit mx-auto w-full max-w-[1200px]">
        <div className="mb-4 flex">
          <button
            className={`cursor-pointer rounded-tl-md border-b-2 px-4 py-[6px] text-[14px] font-semibold transition-colors ${
              activeTab === "recent"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("recent")}
          >
            <span className="flex items-center">
              <i className="bx bx-history mr-2 text-[16px]"></i>Recent Takers
            </span>
          </button>

          <button
            className={`cursor-pointer rounded-tr-md border-b-2 px-4 py-[6px] text-[14px] font-semibold transition-colors ${
              activeTab === "leaderboard"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("leaderboard")}
          >
            <span className="flex items-center">
              <i className="bx bx-bar-chart-big mr-2 text-[16px]"></i>
              Leaderboard
            </span>
          </button>
        </div>
        <div className="-mt-4 mb-4 w-full border-b border-gray-200"></div>

        {/* Tab Content */}
        {activeTab === "recent" ? (
          loading ? (
            <div className="py-8 text-center text-gray-500">
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
            <div className="rounded-md bg-gray-50 p-8 text-center text-gray-500 outline-1 outline-gray-200 outline-dashed">
              {isStudent
                ? "No recent exam activity found."
                : "No recent practice exam takers found."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-left text-gray-600">
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      #
                    </th>
                    {isFaculty && (
                      <>
                        <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                          Course
                        </th>
                        <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                          Year
                        </th>
                        <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                          Student ID
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Last Subject
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Last Score
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Last %
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Highest %
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Avg %
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Attempts
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Subjects
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                      Last Attempt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentTakers.map((row, idx) => (
                    <tr key={row.userID || idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700">{idx + 1}</td>
                      {isFaculty && (
                        <>
                          <td className="px-6 py-4 text-gray-700">
                            {row.name ||
                              `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                              "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {row.course || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {row.year || row.yearLevel || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {row.studentID || "-"}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-gray-700">
                        {row.lastAttemptSubject?.subjectName ||
                          row.lastAttemptSubject?.subjectCode ||
                          "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.lastAttemptScore || 0} / {row.totalPoints || 0}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {row.lastAttemptPercentage || 0}%
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {row.highestPercentage || 0}%
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {row.averagePercentage || 0}%
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.totalAttempts || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.subjectsCount || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(row.lastAttemptDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : leaderboardLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading leaderboard...
          </div>
        ) : leaderboardError ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p>{leaderboardError}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            No leaderboard data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Year
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Student ID
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Avg %
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Highest %
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Attempts
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Subjects
                  </th>
                  <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                    Last Attempt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leaderboard.map((row, idx) => (
                  <tr key={row.userID || idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">
                      {idx === 0 && (
                        <i className="bx bx-trophy mr-1 text-yellow-500"></i>
                      )}
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.name ||
                        `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.course || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.year || row.yearLevel || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.studentID || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {row.averagePercentage || 0}%
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {row.highestPercentage || 0}%
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.totalAttempts || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.subjectsCount || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(row.lastAttemptDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
