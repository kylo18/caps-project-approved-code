import { useEffect, useState } from "react";
import ComingSoon from "../assets/icons/comingsoon.png";
import { format, isThisWeek, isToday, isThisMonth, parseISO } from "date-fns";

const AdminDashboard = () => {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [pendingQuestions, setPendingQuestions] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [showQuestionsDropdown, setShowQuestionsDropdown] = useState(false);
  const [questionType, setQuestionType] = useState("approved"); // "approved" or "pending"

  // Users state
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [deactivatedUsers, setDeactivatedUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [userType, setUserType] = useState("approved"); // "approved", "pending", "deactivated"
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [userRole, setUserRole] = useState("all"); // "all", "student", "faculty", "programchair", "dean", "associatedean"

  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);
  const [subjectsFilter, setSubjectsFilter] = useState({
    program: "all",
    year: "all",
  });
  const [programOptions, setProgramOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState(["all", "1", "2", "3", "4"]);

  // Role mapping for filtering
  const roleOptions = [
    { value: "all", label: "All" },
    { value: "student", label: "Student" },
    { value: "faculty", label: "Faculty" },
    { value: "programchair", label: "Program Chair" },
    { value: "dean", label: "Dean" },
    { value: "associatedean", label: "Associate Dean" },
  ];
  const roleIdMap = {
    student: 1,
    faculty: 2,
    programchair: 3,
    dean: 4,
    associatedean: 5,
  };

  // Leaderboard state
  const [leaderboardType, setLeaderboardType] = useState("qualifying"); // 'qualifying' or 'practice'
  const [leaderboardTime, setLeaderboardTime] = useState("all"); // 'all', 'week', 'today', 'month'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchQuestionCount = async () => {
      setLoadingQuestions(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/questions/count`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        // Count approved and pending questions
        const approvedCount = Array.isArray(data.data)
          ? data.data.filter((q) => q.status_id === 2).length
          : 0;
        const pendingCount = Array.isArray(data.data)
          ? data.data.filter((q) => q.status_id === 1).length
          : 0;
        setTotalQuestions(approvedCount);
        setPendingQuestions(pendingCount);
      } catch (error) {
        setTotalQuestions(0);
        setPendingQuestions(0);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestionCount();
  }, []);

  useEffect(() => {
    const fetchUserCount = async () => {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch all users (first page, large limit)
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/users?limit=10000`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        let filteredUsers = Array.isArray(data.users) ? data.users : [];
        // Filter by role if not 'all'
        if (userRole !== "all") {
          filteredUsers = filteredUsers.filter(
            (u) => u.roleID === roleIdMap[userRole],
          );
        }
        // Count by status
        const approvedCount = filteredUsers.filter(
          (u) => u.status === "registered" && u.isActive,
        ).length;
        const pendingCount = filteredUsers.filter(
          (u) => u.status === "pending",
        ).length;
        const deactivatedCount = filteredUsers.filter(
          (u) => u.status === "registered" && !u.isActive,
        ).length;
        setTotalUsers(approvedCount);
        setPendingUsers(pendingCount);
        setDeactivatedUsers(deactivatedCount);
      } catch (error) {
        setTotalUsers(0);
        setPendingUsers(0);
        setDeactivatedUsers(0);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUserCount();
  }, [userRole]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/subjects`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (Array.isArray(data.subjects)) {
          setSubjects(data.subjects);
          // Extract unique program names
          const programs = Array.from(
            new Set(data.subjects.map((s) => s.programName)),
          ).filter(Boolean);
          setProgramOptions(["all", ...programs]);
        } else {
          setSubjects([]);
          setProgramOptions(["all"]);
        }
      } catch (error) {
        setSubjects([]);
        setProgramOptions(["all"]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch all questions
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/questions/count`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        let questions = Array.isArray(data.data) ? data.data : [];
        // Filter by leaderboard type
        questions = questions.filter(
          (q) =>
            leaderboardType === "qualifying"
              ? q.purpose_id === 1 && q.status_id === 2 // qualifying exam, approved
              : q.purpose_id === 2 && q.status_id === 2, // practice, approved
        );
        // Filter by time
        const now = new Date();
        questions = questions.filter((q) => {
          if (leaderboardTime === "all") return true;
          const created = q.created_at ? parseISO(q.created_at) : null;
          if (!created) return false;
          if (leaderboardTime === "week")
            return isThisWeek(created, { weekStartsOn: 1 });
          if (leaderboardTime === "today") return isToday(created);
          if (leaderboardTime === "month") return isThisMonth(created);
          return true;
        });
        // Group by creator and program
        const userMap = {};
        questions.forEach((q) => {
          const name = q.creatorName || "Unknown";
          const program = q.program || "Unknown";
          if (!userMap[name]) userMap[name] = {};
          if (!userMap[name][program]) userMap[name][program] = 0;
          userMap[name][program]++;
        });
        // For each user, pick the program with the most questions and get their role
        const leaderboard = Object.entries(userMap)
          .map(([user, programs]) => {
            const programEntries = Object.entries(programs);
            // Sort programs by count descending, pick the first
            programEntries.sort((a, b) => b[1] - a[1]);
            // Find a question for this user and program to get the role and program
            const questionForUser = questions.find(
              (q) =>
                (q.creatorName || "Unknown") === user &&
                q.program === programEntries[0]?.[0],
            );
            const role = questionForUser?.role || "Unknown";
            return {
              user,
              program: programEntries[0]?.[0] || "Unknown",
              count: programEntries[0]?.[1] || 0,
              role,
            };
          })
          .sort((a, b) => b.count - a.count);
        setLeaderboardData(leaderboard);
      } catch (error) {
        setLeaderboardData([]);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [leaderboardType, leaderboardTime]);

  // Filtered subjects count
  const filteredSubjects = subjects.filter((s) => {
    const programMatch =
      subjectsFilter.program === "all" ||
      s.programName === subjectsFilter.program;
    const yearMatch =
      subjectsFilter.year === "all" ||
      String(s.yearLevelID) === subjectsFilter.year;
    return programMatch && yearMatch;
  });

  return (
    <>
      <div className="mt-8 text-center text-gray-500">
        <div className="flex flex-col items-center justify-center py-10">
          <img
            src={ComingSoon}
            alt="Dashboard coming soon "
            className="mb-2 h-32 w-32 opacity-80"
          />
          <span className="w-90 text-[15px] text-gray-500">
            The dashboard will be available soon. To add questions, please
            select sa subject from the sidebar.
          </span>
        </div>
      </div>

      <div className="font-inter mt-2 hidden min-h-screen bg-[#f7f7f8] px-4 py-8">
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative rounded-xl bg-gradient-to-tr from-[#ed3700] to-[#FE6902] p-6 text-white shadow">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">Questions</span>
              <span
                className={`bx bx-chevrons-down cursor-pointer text-lg transition-transform ${showQuestionsDropdown ? "rotate-180" : ""}`}
                onClick={() => setShowQuestionsDropdown((v) => !v)}
              ></span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {loadingQuestions
                ? "..."
                : questionType === "approved"
                  ? totalQuestions
                  : pendingQuestions}
            </div>
            {showQuestionsDropdown && (
              <div className="absolute top-12 right-0 z-10 w-40 rounded-lg border bg-white text-gray-800 shadow-lg">
                <div
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${questionType === "approved" ? "font-semibold text-[#ed3700]" : ""}`}
                  onClick={() => {
                    setQuestionType("approved");
                    setShowQuestionsDropdown(false);
                  }}
                >
                  Approved
                </div>
                <div
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${questionType === "pending" ? "font-semibold text-[#ed3700]" : ""}`}
                  onClick={() => {
                    setQuestionType("pending");
                    setShowQuestionsDropdown(false);
                  }}
                >
                  Pending
                </div>
              </div>
            )}
          </div>
          <div className="relative flex flex-col rounded-xl bg-gray-900 p-6 text-white shadow">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">Users</span>
              <div className="flex items-center gap-2">
                <span
                  className={`bx bx-chevrons-down cursor-pointer text-lg transition-transform ${showUsersDropdown ? "rotate-180" : ""}`}
                  onClick={() => {
                    setShowUsersDropdown((v) => !v);
                    if (!showUsersDropdown) setShowRoleDropdown(false);
                  }}
                ></span>
                <span
                  className={`bx bx-chevrons-down cursor-pointer text-lg transition-transform ${showRoleDropdown ? "rotate-180" : ""}`}
                  onClick={() => {
                    setShowRoleDropdown((v) => !v);
                    if (!showRoleDropdown) setShowUsersDropdown(false);
                  }}
                  title="Filter by role"
                ></span>
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {loadingUsers
                ? "..."
                : userType === "approved"
                  ? totalUsers
                  : userType === "pending"
                    ? pendingUsers
                    : deactivatedUsers}
            </div>
            {showUsersDropdown && (
              <div className="absolute top-12 right-0 z-20 w-40 rounded-lg border bg-white text-gray-800 shadow-lg">
                <div
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${userType === "approved" ? "font-semibold text-gray-900" : ""}`}
                  onClick={() => {
                    setUserType("approved");
                    setShowUsersDropdown(false);
                  }}
                >
                  Approved
                </div>
                <div
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${userType === "pending" ? "font-semibold text-gray-900" : ""}`}
                  onClick={() => {
                    setUserType("pending");
                    setShowUsersDropdown(false);
                  }}
                >
                  Pending
                </div>
                <div
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${userType === "deactivated" ? "font-semibold text-gray-900" : ""}`}
                  onClick={() => {
                    setUserType("deactivated");
                    setShowUsersDropdown(false);
                  }}
                >
                  Deactivated
                </div>
              </div>
            )}
            {showRoleDropdown && (
              <div className="absolute top-24 right-0 z-20 w-44 rounded-lg border bg-white text-gray-800 shadow-lg">
                {roleOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${userRole === option.value ? "font-semibold text-orange-500" : ""}`}
                    onClick={() => {
                      setUserRole(option.value);
                      setShowRoleDropdown(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative rounded-xl bg-gradient-to-tr from-[#ed3700] to-[#FE6902] p-6 text-white shadow">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">Subjects</span>
              <span
                className={`bx bx-chevrons-down cursor-pointer text-lg transition-transform ${showSubjectsDropdown ? "rotate-180" : ""}`}
                onClick={() => {
                  setShowSubjectsDropdown((v) => !v);
                  if (!showSubjectsDropdown) {
                    setShowUsersDropdown(false);
                    setShowRoleDropdown(false);
                  }
                }}
              ></span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {loadingSubjects ? "..." : filteredSubjects.length}
            </div>
            {showSubjectsDropdown && (
              <div className="absolute top-12 right-0 z-20 w-56 rounded-lg border bg-white p-2 text-gray-800 shadow-lg">
                <div className="mb-2 text-xs font-semibold text-gray-500">
                  Filter by Program
                </div>
                <select
                  className="mb-2 w-full rounded border px-2 py-1 text-sm"
                  value={subjectsFilter.program}
                  onChange={(e) =>
                    setSubjectsFilter((f) => ({
                      ...f,
                      program: e.target.value,
                    }))
                  }
                >
                  {programOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Programs" : option}
                    </option>
                  ))}
                </select>
                <div className="mb-2 text-xs font-semibold text-gray-500">
                  Filter by Year Level
                </div>
                <select
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={subjectsFilter.year}
                  onChange={(e) =>
                    setSubjectsFilter((f) => ({ ...f, year: e.target.value }))
                  }
                >
                  {yearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Years" : `${option} Year`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-wrap items-center gap-6 border-b pb-2">
            <div className="flex gap-6 text-sm font-semibold">
              <span className="cursor-pointer text-[#a259ff]">
                Practice Questions
              </span>
              <span className="cursor-pointer text-gray-400">Users</span>
              <span className="cursor-pointer text-gray-400">
                Student Activity
              </span>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="rounded-md border px-3 py-1 text-xs text-gray-500">
                Week
              </button>
              <button className="rounded-md border px-2 py-1 text-xs text-gray-500">
                <i className="bx bx-line-chart"></i>
              </button>
              <button className="rounded-md border px-2 py-1 text-xs text-gray-500">
                <i className="bx bx-dots-horizontal-rounded"></i>
              </button>
            </div>
          </div>
          <div className="h-40 w-full rounded-lg bg-gray-100"></div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 text-sm font-semibold text-blue-600">
              All Student by Program
            </div>
            <div className="h-32 w-full rounded-lg bg-gray-100"></div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 text-sm font-semibold text-green-600">
              All Faculty by Program
            </div>
            <div className="h-32 w-full rounded-lg bg-gray-100"></div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 text-sm font-semibold text-blue-600">
              Traffic by Location
            </div>
            <div className="h-32 w-full rounded-full bg-gray-100"></div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 text-sm font-semibold text-blue-600">
              Traffic by Location
            </div>
            <div className="h-32 w-full rounded-full bg-gray-100"></div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
              Leaderboard
              <select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={leaderboardType}
                onChange={(e) => setLeaderboardType(e.target.value)}
              >
                <option value="qualifying">Qualifying Exam Questions</option>
                <option value="practice">Practice Questions</option>
              </select>
              <select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={leaderboardTime}
                onChange={(e) => setLeaderboardTime(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="today">Today</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Program</th>
                  <th className="px-4 py-2 font-medium">Questions Added</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaderboard ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : leaderboardData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-gray-400"
                    >
                      No data available.
                    </td>
                  </tr>
                ) : (
                  leaderboardData.map((row, idx) => (
                    <tr key={row.user} className="border-b last:border-0">
                      <td className="px-4 py-2 text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-2 text-gray-700">{row.user}</td>
                      <td className="px-4 py-2 text-gray-700">{row.role}</td>
                      <td className="px-4 py-2 text-gray-700">{row.program}</td>
                      <td className="px-4 py-2 text-gray-700">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-6 text-xs text-gray-400">
          <span>About</span>
          <span>Support</span>
          <span>Contact Us</span>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
