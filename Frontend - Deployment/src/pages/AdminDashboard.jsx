import React, { Fragment, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ComingSoon from "../assets/icons/comingsoon.png";
import { format, isThisWeek, isToday, isThisMonth, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

// Error Boundary Component
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[230px] items-center justify-center">
          <span className="text-lg font-semibold text-gray-400">
            Chart could not be loaded
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}

// StatCard component for dashboard stats (redesigned to match provided image)
const StatCard = ({
  icon,
  value,
  label,
  subtext,
  subtextColor,
  bg = "bg-gray-50",
  showDropdown = false,
  dropdownOptions = [],
  selectedDropdownValue = "",
  onDropdownChange = () => {},
  tooltipText = "",
  showArrow = false,
  onArrowClick = () => {},
  children, // for dropdown chevron and menu
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`border-color relative flex min-h-[110px] items-start justify-between rounded-xl border bg-white transition duration-100 hover:shadow-sm ${bg} px-5 py-4`}
    >
      <div className="flex flex-col justify-center">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100">
            {icon}
          </div>
          <div className="text-[16px] font-semibold text-gray-800">{label}</div>
          {showDropdown && (
            <div className="relative">
              <button
                className="flex cursor-pointer items-center gap-1 rounded text-gray-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDropdownChange();
                }}
              >
                <i className="bx bx-chevron-down text-xl"></i>
              </button>
              {children}
            </div>
          )}
          {showArrow && (
            <button
              className="flex cursor-pointer items-center gap-1 rounded text-xs text-gray-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onArrowClick();
              }}
            >
              <i className="bx bx-chevron-right text-xl"></i>
            </button>
          )}
        </div>
        <div className="ml-2 flex items-center gap-3">
          <div className="text-[24px] font-semibold text-gray-800">{value}</div>
          {subtext && (
            <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 shadow-sm">
              <span className={`text-xs ${subtextColor || "text-green-600"}`}>
                {subtext}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <button
          className="flex items-center justify-center rounded-full transition-colors"
          onClick={() => setShowTooltip(!showTooltip)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <i className="bx bx-info-circle text-xl text-gray-600 hover:text-gray-700"></i>
        </button>
        {showTooltip && tooltipText && (
          <div className="absolute top-6 right-0 z-30 w-48 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
            {tooltipText}
            <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 bg-gray-800"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const RecentResultsTable = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }
        if (!apiUrl) {
          throw new Error("API base URL is not configured.");
        }
        // Use backticks for template literals
        const response = await fetch(
          `${apiUrl}/practice-exam/results/all-students`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!response.ok) {
          let data = {};
          try {
            data = await response.json();
          } catch {}
          throw new Error(data.message || "Failed to fetch results");
        }
        const data = await response.json();
        setResults(data.history || []);
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [apiUrl]);

  return (
    <div className="mx-auto mt-10 w-full max-w-5xl">
      <h2 className="mb-4 text-xl font-bold text-gray-800">
        Recent Exam Results (All Subjects)
      </h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading results...</div>
      ) : error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-600">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
          No exam results found.
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
                  Name
                </th>
                <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                  Program
                </th>
                <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                  Subject
                </th>
                <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                  Score
                </th>
                <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                  Percentage
                </th>
                <th className="px-6 py-3 font-semibold tracking-wider uppercase">
                  Date Taken
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((row, idx) => (
                <tr key={row.resultID || idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-700">{idx + 1}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {row.studentName || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {row.program || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {row.subjectName || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {row.earnedPoints} / {row.totalPoints}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {row.percentage}%
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// New AllResultsTable component using the provided API
const AllResultsTable = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchAllResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again.",
          );
        }
        if (!apiUrl) {
          throw new Error("API base URL is not configured.");
        }

        const response = await fetch(`${apiUrl}2/results/all-students`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let data = {};
          try {
            data = await response.json();
          } catch {}
          throw new Error(data.message || "Failed to fetch all results");
        }

        const data = await response.json();
        console.log("API Response:", data);
        setResults(data.results || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllResults();
  }, [apiUrl]);

  // Filter and sort results
  const filteredResults = results.filter((result) => {
    const searchLower = searchTerm.toLowerCase();
    const studentName = result.user?.name || result.studentName || "";
    const programName = result.user?.program?.name || result.program || "";
    const subjectName = result.subject?.name || result.subjectName || "";

    return (
      studentName.toLowerCase().includes(searchLower) ||
      programName.toLowerCase().includes(searchLower) ||
      subjectName.toLowerCase().includes(searchLower)
    );
  });

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "studentName":
        aValue = a.user?.name || a.studentName || "";
        bValue = b.user?.name || b.studentName || "";
        break;
      case "program":
        aValue = a.user?.program?.name || a.program || "";
        bValue = b.user?.program?.name || b.program || "";
        break;
      case "subject":
        aValue = a.subject?.name || a.subjectName || "";
        bValue = b.subject?.name || b.subjectName || "";
        break;
      case "percentage":
        aValue = parseFloat(a.percentage) || 0;
        bValue = parseFloat(b.percentage) || 0;
        break;
      case "created_at":
      default:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = sortedResults.slice(startIndex, endIndex);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <i className="bx bx-sort-alt-2 text-gray-400"></i>;
    }
    return sortOrder === "asc" ? (
      <i className="bx bx-sort-up text-blue-500"></i>
    ) : (
      <i className="bx bx-sort-down text-blue-500"></i>
    );
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Exam Results</h2>
          <p className="mt-1 text-sm text-gray-600">
            Complete overview of all student exam results across all subjects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, program, or subject..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-64 rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
            <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl text-gray-300">
              <i className="bx bx-loader-alt animate-spin"></i>
            </div>
            <p className="text-gray-500">Loading exam results...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-2 text-2xl text-red-400">
            <i className="bx bx-error-circle"></i>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-800">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <div className="mb-4 text-4xl text-gray-300">
            <i className="bx bx-file-blank"></i>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-600">
            No Exam Results Found
          </h3>
          <p className="text-gray-500">
            There are no exam results available at the moment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      Date Taken
                      <SortIcon column="created_at" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort("studentName")}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      Student Name
                      <SortIcon column="studentName" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort("program")}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      Program
                      <SortIcon column="program" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort("subject")}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      Subject
                      <SortIcon column="subject" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    <button
                      onClick={() => handleSort("percentage")}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      Percentage
                      <SortIcon column="percentage" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentResults.map((result, idx) => {
                  const studentName =
                    result.user?.name || result.studentName || "Unknown";
                  const programName =
                    result.user?.program?.name || result.program || "Unknown";
                  const subjectName =
                    result.subject?.name || result.subjectName || "Unknown";
                  const percentage = parseFloat(result.percentage) || 0;
                  const earnedPoints = result.earnedPoints || 0;
                  const totalPoints = result.totalPoints || 0;
                  const createdDate = new Date(result.created_at);

                  // Determine status based on percentage
                  const getStatusBadge = (percentage) => {
                    if (percentage >= 90) {
                      return (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <i className="bx bx-check-circle mr-1"></i>
                          Excellent
                        </span>
                      );
                    } else if (percentage >= 75) {
                      return (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          <i className="bx bx-check mr-1"></i>
                          Good
                        </span>
                      );
                    } else if (percentage >= 60) {
                      return (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          <i className="bx bx-time mr-1"></i>
                          Fair
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <i className="bx bx-x-circle mr-1"></i>
                          Needs Improvement
                        </span>
                      );
                    }
                  };

                  return (
                    <tr
                      key={result.id || result.resultID || idx}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {createdDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        <br />
                        <span className="text-xs text-gray-400">
                          {createdDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-xs font-semibold text-white">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {studentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {programName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {subjectName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {earnedPoints}
                        </span>
                        <span className="text-gray-400"> / {totalPoints}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-semibold ${
                            percentage >= 90
                              ? "text-green-600"
                              : percentage >= 75
                                ? "text-blue-600"
                                : percentage >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                          }`}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(percentage)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, sortedResults.length)} of{" "}
                  {sortedResults.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className="bx bx-chevron-left"></i>
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-orange-500 text-white"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper: get month name from date string
const getMonthName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("default", { month: "short" });
};

// Chart component for QE and Practice questions per month
const QuestionsHistoryChart = ({
  questions,
  subjects,
  selectedSubject,
  setSelectedSubject,
  selectedYear,
  setSelectedYear,
  graphType = "area",
  setGraphType,
}) => {
  // Custom dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [chartWidth, setChartWidth] = useState(700);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateChartWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setChartWidth(Math.max(400, containerWidth - 20)); // Reduced padding subtraction
      }
    };

    updateChartWidth();
    window.addEventListener("resize", updateChartWidth);
    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);

  // Group questions by month and type, filtered by subject
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const filteredQuestions =
    selectedSubject === "all"
      ? questions
      : questions.filter(
          (q) => String(q.subjectID) === String(selectedSubject),
        );

  // Apply year filtering
  const yearFilteredQuestions =
    selectedYear === "All Time"
      ? filteredQuestions
      : filteredQuestions.filter((q) => {
          if (!q.created_at) return false;
          const questionYear = new Date(q.created_at).getFullYear().toString();
          return questionYear === selectedYear;
        });

  const monthlyData = months.map((month) => ({
    month,
    qualifying: 0,
    practice: 0,
  }));
  yearFilteredQuestions.forEach((q) => {
    if (!q.created_at) return;
    const monthName = getMonthName(q.created_at);
    const idx = months.indexOf(monthName);
    if (idx === -1) return;
    if (q.purpose_id === 1) monthlyData[idx].qualifying += 1;
    if (q.purpose_id === 2) monthlyData[idx].practice += 1;
  });
  // Get current subject label
  const currentLabel =
    selectedSubject === "all"
      ? "All Subjects"
      : subjects.find((s) => String(s.subjectID) === String(selectedSubject))
          ?.subjectName || "Subject";

  // Compute available years from questions
  const yearsSet = new Set([2025]);
  questions.forEach((q) => {
    if (q.created_at) {
      const year = new Date(q.created_at).getFullYear();
      if (year >= 2025) yearsSet.add(year);
    }
  });
  const yearOptions = Array.from(yearsSet)
    .sort((a, b) => b - a)
    .map(String);

  return (
    <div className="w-full px-2 pt-2">
      {/* Header with label and dropdown */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Question Entry Record
        </h3>
        {/* Graph Type Dropdown and Year Dropdown */}
        <div className="flex items-center gap-2">
          {/* Year Dropdown */}
          <div className="relative">
            <button
              className="border-color flex cursor-pointer items-center overflow-hidden rounded-lg border bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setShowYearDropdown((v) => !v)}
              type="button"
            >
              {/* Left Section - Year Label */}
              <div className="border-color flex items-center gap-1 border-r px-[10px] py-[6px]">
                <span>Year</span>
                <span className="bx bx-chevron-down text-base"></span>
              </div>
              {/* Right Section - Selected Year */}
              <div className="flex items-center px-[10px] py-[6px]">
                <span>{selectedYear || "All Years"}</span>
              </div>
            </button>
            {showYearDropdown && (
              <div className="absolute right-0 z-20 mt-1 min-w-full rounded-lg border bg-white py-1 text-sm text-gray-700 shadow-lg">
                <div
                  className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${selectedYear === "All Time" ? "font-semibold text-blue-600" : ""}`}
                  onClick={() => {
                    setSelectedYear("All Time");
                    setShowYearDropdown(false);
                  }}
                >
                  All Years
                </div>
                {yearOptions.map((year) => (
                  <div
                    key={year}
                    className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${selectedYear === year ? "font-semibold text-blue-600" : ""}`}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Graph Type Dropdown */}
          <div className="relative">
            <button
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDropdown((v) => !v)}
              type="button"
            >
              {graphType === "area" && "Area Chart"}
              {graphType === "line" && "Line Chart"}
              {graphType === "bar" && "Bar Chart"}
              <span
                className={`bx bx-chevron-down text-lg transition-transform ${showDropdown ? "rotate-180" : ""}`}
              ></span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 z-20 mt-2 min-w-full rounded-lg border bg-white py-1 text-gray-700 shadow-lg">
                <div
                  className={`cursor-pointer px-4 py-2 text-[12px] hover:bg-gray-100 ${graphType === "area" ? "font-semibold text-blue-600" : ""}`}
                  onClick={() => {
                    setGraphType("area");
                    setShowDropdown(false);
                  }}
                >
                  Area Chart
                </div>
                <div
                  className={`cursor-pointer px-4 py-2 text-[12px] hover:bg-gray-100 ${graphType === "line" ? "font-semibold text-blue-600" : ""}`}
                  onClick={() => {
                    setGraphType("line");
                    setShowDropdown(false);
                  }}
                >
                  Line Chart
                </div>
                <div
                  className={`cursor-pointer px-4 py-2 text-[12px] hover:bg-gray-100 ${graphType === "bar" ? "font-semibold text-blue-600" : ""}`}
                  onClick={() => {
                    setGraphType("bar");
                    setShowDropdown(false);
                  }}
                >
                  Bar Chart
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="-mx-1 mt-2 -ml-5">
        <ChartErrorBoundary>
          {monthlyData && monthlyData.length > 0 ? (
            <div
              ref={containerRef}
              style={{ width: "100%", height: "230px" }}
              className="focus:outline-none"
            >
              {graphType === "area" && (
                <AreaChart
                  data={monthlyData}
                  width={chartWidth}
                  height={230}
                  margin={{ top: 0, right: 10, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="colorQualifying"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#FE6902" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FE6902" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPractice"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280", dy: 8 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 2"]}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 14 }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{
                      top: 0,
                      right: 0,
                      fontSize: 12,
                      color: "#6b7280",
                      alignItems: "center",
                    }}
                    formatter={(value) => (
                      <span style={{ marginLeft: 4 }}>{value}</span>
                    )}
                    payload={[
                      {
                        value: "QE Questions",
                        type: "square",
                        color: "#FE6902",
                      },
                      {
                        value: "Practice Questions",
                        type: "square",
                        color: "#60a5fa",
                      },
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="qualifying"
                    stroke="#FE6902"
                    fillOpacity={1}
                    fill="url(#colorQualifying)"
                    name="QE Questions"
                  />
                  <Area
                    type="monotone"
                    dataKey="practice"
                    stroke="#60a5fa"
                    fillOpacity={1}
                    fill="url(#colorPractice)"
                    name="Practice Questions"
                  />
                </AreaChart>
              )}
              {graphType === "line" && (
                <LineChart
                  data={monthlyData}
                  width={chartWidth}
                  height={230}
                  margin={{ top: 0, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280", dy: 8 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 2"]}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 14 }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{
                      top: 0,
                      right: 0,
                      fontSize: 12,
                      color: "#6b7280",
                      alignItems: "center",
                    }}
                    formatter={(value) => (
                      <span style={{ marginLeft: 4 }}>{value}</span>
                    )}
                    payload={[
                      {
                        value: "QE Questions",
                        type: "square",
                        color: "#FE6902",
                      },
                      {
                        value: "Practice Questions",
                        type: "square",
                        color: "#60a5fa",
                      },
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="qualifying"
                    stroke="#FE6902"
                    strokeWidth={3}
                    name="QE Questions"
                  />
                  <Line
                    type="monotone"
                    dataKey="practice"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    name="Practice Questions"
                  />
                </LineChart>
              )}
              {graphType === "bar" && (
                <BarChart
                  data={monthlyData}
                  width={chartWidth}
                  height={230}
                  margin={{ top: 0, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280", dy: 8 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "dataMax + 2"]}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 14 }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{
                      top: 0,
                      right: 0,
                      fontSize: 12,
                      color: "#6b7280",
                      alignItems: "center",
                    }}
                    formatter={(value) => (
                      <span style={{ marginLeft: 4 }}>{value}</span>
                    )}
                    payload={[
                      {
                        value: "QE Questions",
                        type: "square",
                        color: "#FE6902",
                      },
                      {
                        value: "Practice Questions",
                        type: "square",
                        color: "#60a5fa",
                      },
                    ]}
                  />
                  <Bar
                    dataKey="qualifying"
                    fill="#FE6902"
                    name="QE Questions"
                  />
                  <Bar
                    dataKey="practice"
                    fill="#60a5fa"
                    name="Practice Questions"
                  />
                </BarChart>
              )}
            </div>
          ) : (
            <div className="flex h-[230px] items-center justify-center">
              <span className="text-lg font-semibold text-gray-400">
                No data available for the selected filters
              </span>
            </div>
          )}
        </ChartErrorBoundary>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  // Add state for all questions for chart
  const [allQuestions, setAllQuestions] = useState([]);
  const [loadingAllQuestions, setLoadingAllQuestions] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedYear, setSelectedYear] = useState("All Time");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [graphType, setGraphType] = useState("area");

  // Add state for calendar picker
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState(""); // "date", "week", "month"
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calendar component
  const CalendarPicker = ({ type, onSelect, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();

      const days = [];
      for (let i = 0; i < startingDay; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      return days;
    };

    const handleDateSelect = (date) => {
      if (type === "date") {
        onSelect(`date:${date.toISOString().split("T")[0]}`);
      } else if (type === "week") {
        onSelect(`week:${date.toISOString().split("T")[0]}`);
      } else if (type === "month") {
        onSelect(
          `month:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        );
      }
      onClose();
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <div className="w-60 rounded-lg border bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                ),
              )
            }
            className="rounded p-1 hover:bg-gray-100"
          >
            <i className="bx bx-chevron-left text-lg"></i>
          </button>
          <div className="text-[12px] font-semibold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                ),
              )
            }
            className="rounded p-1 hover:bg-gray-100"
          >
            <i className="bx bx-chevron-right text-lg"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-[12px]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-1 text-center font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => day && handleDateSelect(day)}
              disabled={!day}
              className={`rounded p-1 text-[12px] hover:bg-orange-100 ${
                day ? "text-gray-800 hover:text-orange-500" : "text-gray-300"
              }`}
            >
              {day ? day.getDate() : ""}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Compute available years from questions
  const yearOptions = (() => {
    const yearsSet = new Set([2025]);
    allQuestions.forEach((q) => {
      if (q.created_at) {
        const year = new Date(q.created_at).getFullYear();
        if (year >= 2025) yearsSet.add(year);
      }
    });
    return Array.from(yearsSet)
      .sort((a, b) => b - a)
      .map(String);
  })();

  useEffect(() => {
    const fetchAllQuestions = async () => {
      setLoadingAllQuestions(true);
      try {
        const token = sessionStorage.getItem("token");
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
        setAllQuestions(Array.isArray(data.data) ? data.data : []);
      } catch {
        setAllQuestions([]);
      } finally {
        setLoadingAllQuestions(false);
      }
    };
    fetchAllQuestions();
  }, []);

  useEffect(() => {
    const fetchQuestionCount = async () => {
      setLoadingQuestions(true);
      try {
        const token = sessionStorage.getItem("token");
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
        const token = sessionStorage.getItem("token");
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
        const token = sessionStorage.getItem("token");
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
        const token = sessionStorage.getItem("token");
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

  // Add state for leaderboard type and time for the compact leaderboard card
  const [miniLeaderboardType, setMiniLeaderboardType] = useState("qualifying");
  const [miniLeaderboardTime, setMiniLeaderboardTime] = useState("all");
  const [showMiniTypeDropdown, setShowMiniTypeDropdown] = useState(false);
  const [showMiniTimeDropdown, setShowMiniTimeDropdown] = useState(false);
  // Compute mini leaderboard data (top 5 users by questions added, filtered by type and time)
  const getMiniLeaderboardData = () => {
    if (!Array.isArray(allQuestions)) return [];
    // Filter by type
    const typeId = miniLeaderboardType === "qualifying" ? 1 : 2;
    let filtered = allQuestions.filter((q) => q.purpose_id === typeId);

    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (q) => String(q.subjectID) === String(selectedSubject),
      );
    }

    // Filter by time
    const now = new Date();
    filtered = filtered.filter((q) => {
      if (!q.created_at) return false;
      const created = new Date(q.created_at);

      if (miniLeaderboardTime === "all") return true;

      if (miniLeaderboardTime === "today") {
        return created.toDateString() === now.toDateString();
      }

      if (miniLeaderboardTime === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        return created >= startOfWeek;
      }

      if (miniLeaderboardTime === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }

      // Handle specific date formats
      if (miniLeaderboardTime.startsWith("date:")) {
        const targetDate = new Date(miniLeaderboardTime.split(":")[1]);
        return created.toDateString() === targetDate.toDateString();
      }

      if (miniLeaderboardTime.startsWith("week:")) {
        const weekStart = new Date(miniLeaderboardTime.split(":")[1]);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return created >= weekStart && created <= weekEnd;
      }

      if (miniLeaderboardTime.startsWith("month:")) {
        const [year, month] = miniLeaderboardTime.split(":")[1].split("-");
        return (
          created.getFullYear() === parseInt(year) &&
          created.getMonth() === parseInt(month) - 1
        );
      }

      return true;
    });
    // Group by user
    const userMap = {};
    filtered.forEach((q) => {
      const name = q.creatorName || "Unknown";
      if (!userMap[name]) userMap[name] = 0;
      userMap[name]++;
    });
    // Convert to array and sort
    return Object.entries(userMap)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count);
  };
  const miniLeaderboardData = getMiniLeaderboardData();

  // Calculate dynamic subtext for cards
  const getQuestionsSubtext = () => {
    if (!Array.isArray(allQuestions)) return "";
    const today = new Date().toDateString();

    const todayApprovedQuestions = allQuestions.filter((q) => {
      if (!q.created_at) return false;

      // Check if question is approved
      const isApproved = q.status_id === 2;
      if (!isApproved) return false;

      // Check if it was approved today
      // Try different possible approval date fields
      const approvalDate = q.approved_at || q.updated_at || q.created_at;
      const approvalDateString = new Date(approvalDate).toDateString();

      return approvalDateString === today;
    });

    return todayApprovedQuestions.length > 0
      ? `+${todayApprovedQuestions.length} Approved today`
      : "";
  };

  const getUsersSubtext = () => {
    // Show pending users count
    if (pendingUsers > 0) {
      return `+${pendingUsers} Users Pending`;
    }
    return "";
  };

  const getSubjectsSubtext = () => {
    // Check if any subjects were added today
    if (!Array.isArray(subjects)) return "";
    const today = new Date().toDateString();
    const todaySubjects = subjects.filter((s) => {
      if (!s.created_at) return false;
      return new Date(s.created_at).toDateString() === today;
    }).length;
    return todaySubjects > 0 ? `+${todaySubjects} Added today` : "";
  };

  return (
    <div className="outfit mx-auto max-w-5xl">
      {/* Dashboard Header */}
      <div className="mt-15 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">
            Exam Dashboard
          </h1>
          <p className="mt-2 text-[12px] text-gray-400">
            Plan, prioritize, and accomplish your tasks with ease.
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:mt-2">
          <button
            className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 px-4 py-[6px] text-[14px] text-white shadow transition hover:from-orange-600 hover:to-orange-700"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("openSubjectSidebar"));
            }}
          >
            <span className="text-xl">+</span> Add Question
          </button>
          <button
            className="flex cursor-pointer items-center gap-2 rounded-full border border-orange-500 px-4 py-[6px] text-[14px] text-orange-500 shadow transition hover:bg-orange-50"
            onClick={() => alert("Under development")}
          >
            <span className="text-xl">+</span> Create Quiz
          </button>
        </div>
      </div>

      {/* Top Four Cards with StatCard and dropdowns */}
      <div className="outfit mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Questions Card with Dropdown */}
        <div className="relative text-gray-600">
          <StatCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M15 12h-5" />
                <path d="M15 8h-5" />
                <path d="M19 17V5a2 2 0 0 0-2-2H4" />
                <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
              </svg>
            }
            value={
              loadingQuestions
                ? "..."
                : questionType === "approved"
                  ? totalQuestions
                  : pendingQuestions
            }
            label={
              questionType === "approved"
                ? "Approved Questions"
                : "Pending Questions"
            }
            subtext={getQuestionsSubtext()}
            subtextColor="text-green-600"
            showDropdown={true}
            selectedDropdownValue={questionType}
            onDropdownChange={() => setShowQuestionsDropdown((v) => !v)}
            tooltipText="Shows the total number of questions in the system. Use the dropdown to filter by status."
          >
            {showQuestionsDropdown && (
              <div className="border-color absolute left-0 z-20 mt-1 min-w-full rounded-lg border bg-white p-1 text-[12px] text-gray-900 shadow-xl">
                <div
                  className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${questionType === "approved" ? "font-semibold text-orange-500" : ""}`}
                  onClick={() => {
                    setQuestionType("approved");
                    setShowQuestionsDropdown(false);
                  }}
                >
                  Approved
                </div>
                <div
                  className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${questionType === "pending" ? "font-semibold text-orange-500" : ""}`}
                  onClick={() => {
                    setQuestionType("pending");
                    setShowQuestionsDropdown(false);
                  }}
                >
                  Pending
                </div>
              </div>
            )}
          </StatCard>
        </div>
        {/* Users Card with Dropdown */}
        <div className="relative text-gray-600">
          <StatCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            }
            value={
              loadingUsers
                ? "..."
                : userType === "approved"
                  ? totalUsers
                  : userType === "pending"
                    ? pendingUsers
                    : deactivatedUsers
            }
            label="Users"
            subtext={getUsersSubtext()}
            subtextColor="text-green-600"
            showArrow={true}
            onArrowClick={() => {
              navigate("/users");
            }}
            tooltipText="Shows the total number of users in the system. Click the arrow to view all users."
          />
        </div>
        {/* Subjects Card with Dropdown */}
        <div className="relative text-gray-600">
          <StatCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <rect width="8" height="18" x="3" y="3" rx="1" />
                <path d="M7 3v18" />
                <path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" />
              </svg>
            }
            value={loadingSubjects ? "..." : filteredSubjects.length}
            label="Subjects"
            subtext={getSubjectsSubtext()}
            subtextColor="text-green-600"
          />
        </div>
      </div>

      {/* Year Dropdown Button - moved below count cards */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {/* Subjects Dropdown */}
          <div className="relative">
            <button
              className="border-color flex cursor-pointer items-center overflow-hidden rounded-lg border bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDropdown((v) => !v)}
              type="button"
            >
              {/* Left Section - Subject Label */}
              <div className="border-color flex items-center gap-1 border-r px-[10px] py-[6px]">
                <span>Subject</span>
                <span className="bx bx-chevron-down text-base"></span>
              </div>
              {/* Right Section - Selected Subject */}
              <div className="flex max-w-50 items-center px-[10px] py-[6px]">
                <span className="truncate">
                  {selectedSubject === "all"
                    ? "All Subjects"
                    : subjects.find(
                        (s) => String(s.subjectID) === String(selectedSubject),
                      )?.subjectName || "Subject"}
                </span>
              </div>
            </button>
            {showDropdown && (
              <div className="border-color absolute right-0 z-20 mt-1 min-w-full rounded-lg border bg-white p-1 text-[12px] text-gray-700 shadow-lg">
                <div
                  className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${selectedSubject === "all" ? "font-semibold text-orange-500" : ""}`}
                  onClick={() => {
                    setSelectedSubject("all");
                    setShowDropdown(false);
                  }}
                >
                  All Subjects
                </div>
                {subjects.map((s) => (
                  <div
                    key={s.subjectID}
                    className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${String(selectedSubject) === String(s.subjectID) ? "font-semibold text-orange-500" : ""}`}
                    onClick={() => {
                      setSelectedSubject(s.subjectID);
                      setShowDropdown(false);
                    }}
                  >
                    {s.subjectName}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Time Dropdown with Calendar Icon */}
          <div className="relative">
            <button
              className="border-color flex items-center overflow-hidden rounded-lg border bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              onClick={() => setShowMiniTimeDropdown((v) => !v)}
              type="button"
            >
              <div className="flex items-center gap-1 px-[10px] py-[6px]">
                <span>
                  {miniLeaderboardTime === "all" && "Date Range"}
                  {miniLeaderboardTime === "today" && "Today"}
                  {miniLeaderboardTime === "week" && "This Week"}
                  {miniLeaderboardTime === "month" && "This Month"}
                  {miniLeaderboardTime.startsWith("date:") && "Specific Date"}
                  {miniLeaderboardTime.startsWith("week:") && "Specific Week"}
                  {miniLeaderboardTime.startsWith("month:") && "Specific Month"}
                </span>
                <span className="bx bx-chevron-down text-base"></span>
              </div>

              <div className="border-color flex items-center gap-2 border-l px-[10px] py-[6px]">
                <span>
                  {(() => {
                    const now = new Date();
                    const formatDate = (date) => {
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    };

                    if (miniLeaderboardTime === "all") return "All Time";
                    if (miniLeaderboardTime === "today") {
                      return formatDate(now);
                    }
                    if (miniLeaderboardTime === "week") {
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
                      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
                    }
                    if (miniLeaderboardTime === "month") {
                      const startOfMonth = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1,
                      );
                      const endOfMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0,
                      );
                      return `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`;
                    }
                    if (miniLeaderboardTime.startsWith("date:")) {
                      const date = new Date(miniLeaderboardTime.split(":")[1]);
                      return formatDate(date);
                    }
                    if (miniLeaderboardTime.startsWith("week:")) {
                      const weekStart = new Date(
                        miniLeaderboardTime.split(":")[1],
                      );
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
                    }
                    if (miniLeaderboardTime.startsWith("month:")) {
                      const [year, month] = miniLeaderboardTime
                        .split(":")[1]
                        .split("-");
                      const startOfMonth = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        1,
                      );
                      const endOfMonth = new Date(
                        parseInt(year),
                        parseInt(month),
                        0,
                      );
                      return `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`;
                    }
                    return "All Time";
                  })()}
                </span>
                <i className="bx bx-calendar text-base" />
              </div>
            </button>
            {showMiniTimeDropdown && (
              <div className="border-color absolute right-0 z-20 mt-1 min-w-full rounded-lg border bg-white p-1 text-[12px] text-gray-700 shadow-lg">
                <div className="rounded-md">
                  <div
                    className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${miniLeaderboardTime === "all" ? "font-semibold text-orange-500" : ""}`}
                    onClick={() => {
                      setMiniLeaderboardTime("all");
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    All Time
                  </div>
                  <div
                    className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${miniLeaderboardTime === "week" ? "font-semibold text-orange-600" : ""}`}
                    onClick={() => {
                      setMiniLeaderboardTime("week");
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    This Week
                  </div>
                  <div
                    className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${miniLeaderboardTime === "today" ? "font-semibold text-orange-600" : ""}`}
                    onClick={() => {
                      setMiniLeaderboardTime("today");
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    Today
                  </div>
                  <div
                    className={`cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 ${miniLeaderboardTime === "month" ? "font-semibold text-orange-600" : ""}`}
                    onClick={() => {
                      setMiniLeaderboardTime("month");
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    This Month
                  </div>
                  <div className="my-1 border-t border-gray-200"></div>
                  <div
                    className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setCalendarType("date");
                      setShowCalendar(true);
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    Specific Date
                  </div>
                  <div
                    className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setCalendarType("week");
                      setShowCalendar(true);
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    Specific Week
                  </div>
                  <div
                    className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setCalendarType("month");
                      setShowCalendar(true);
                      setShowMiniTimeDropdown(false);
                    }}
                  >
                    Specific Month
                  </div>
                </div>
              </div>
            )}
            {showCalendar && (
              <div className="absolute top-full right-0 z-30 mt-1">
                <CalendarPicker
                  type={calendarType}
                  onSelect={(value) => {
                    setMiniLeaderboardTime(value);
                    setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Graph and Leaderboard Card */}
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Graph (2/3 width) */}
        <div className="border-color col-span-2 flex min-h-[260px] flex-col items-center justify-center rounded-xl border bg-white p-2">
          {loadingAllQuestions ? (
            <span className="text-[14px] font-semibold text-gray-400">
              Loading graph...
            </span>
          ) : (
            <QuestionsHistoryChart
              questions={allQuestions}
              subjects={subjects}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              graphType={graphType}
              setGraphType={setGraphType}
            />
          )}
        </div>
        {/* Compact Leaderboard Card (replaces Task) */}
        <div className="flex h-[260px] max-h-[400px] min-h-[260px] flex-col rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-gray-800">
                Top Contributors
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Type Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  onClick={() => setShowMiniTypeDropdown((v) => !v)}
                  type="button"
                >
                  {miniLeaderboardType === "qualifying"
                    ? "Qualifying"
                    : "Practice"}
                  <span
                    className={`bx bx-chevron-down text-base transition-transform ${showMiniTypeDropdown ? "rotate-180" : ""}`}
                  ></span>
                </button>
                {showMiniTypeDropdown && (
                  <div className="absolute right-0 z-20 mt-1 min-w-full rounded-lg border bg-white py-1 text-xs text-gray-700 shadow-lg">
                    <div
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${miniLeaderboardType === "qualifying" ? "font-semibold text-orange-600" : ""}`}
                      onClick={() => {
                        setMiniLeaderboardType("qualifying");
                        setShowMiniTypeDropdown(false);
                      }}
                    >
                      Qualifying
                    </div>
                    <div
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${miniLeaderboardType === "practice" ? "font-semibold text-orange-600" : ""}`}
                      onClick={() => {
                        setMiniLeaderboardType("practice");
                        setShowMiniTypeDropdown(false);
                      }}
                    >
                      Practice
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {miniLeaderboardData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <i className="bx bx-trophy mb-2 text-3xl text-gray-300"></i>
                  <p className="text-sm text-gray-400">No data available</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                        Rank
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                        Name
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold tracking-wider uppercase">
                        Questions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {miniLeaderboardData.map((row, idx) => (
                      <tr
                        key={row.user}
                        className="transition-all hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-bold text-white">
                              {idx + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {row.user}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-semibold text-gray-800">
                              {row.count}
                            </span>
                            <span className="text-gray-500">qs</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Exam Results Table */}
      <AllResultsTable />
    </div>
  );
};

export default AdminDashboard;
