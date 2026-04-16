import { useEffect, useRef, useState } from "react";

const GRID_COLOR = "rgba(0,0,0,0.06)";
const TICK_COLOR = "#9ca3af";
const ORANGE = "#f57c20";

const scoreColor = (v) =>
  v >= 90 ? "#c45e10" : v >= 75 ? "#555555" : "#c03030";

const pillStyle = (v) =>
  v >= 90
    ? { background: "#fff0e0", color: "#c45e10" }
    : v >= 75
    ? { background: "#f0f0f0", color: "#444444" }
    : v >= 60
    ? { background: "#fffae0", color: "#906000" }
    : { background: "#fde8e8", color: "#b02020" };

const StatusBadge = ({ status }) => {
  if (status === "excellent")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">Excellent</span>;
  if (status === "good")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-700">Good</span>;
  if (status === "average")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">Average</span>;
  return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-600">Needs support</span>;
};

const getStatus = (score) => {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 75) return "average";
  return "needs support";
};

const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_PALETTE = [
  { bg: "#fff0e0", fg: "#c45e10" },
  { bg: "#f0f0f0", fg: "#555555" },
  { bg: "#fff4ec", fg: "#e07020" },
  { bg: "#fff8e0", fg: "#a07000" },
  { bg: "#f5f5f5", fg: "#777777" },
  { bg: "#fff2e8", fg: "#c05010" },
  { bg: "#f0f0f0", fg: "#333333" },
  { bg: "#f8f8f8", fg: "#666666" },
];

// ── Mock data for broken endpoints ────────────────────────────
// TODO: Replace with real API data once backend SQL is fixed
const MOCK_SUMMARY = {
  total_students: 120,
  average_score: 74.5,
  top_performers: 32,
  need_support: 28,
};

const MOCK_STUDENT_PROGRESS = [
  { id: 1, name: "Juan Dela Cruz",     score: 88, attempts: 5, passRate: 80, trend: [60, 68, 75, 82, 88], subjects: [] },
  { id: 2, name: "Maria Santos",       score: 72, attempts: 4, passRate: 50, trend: [55, 60, 68, 72],     subjects: [] },
  { id: 3, name: "Carlo Reyes",        score: 91, attempts: 6, passRate: 83, trend: [70, 78, 83, 88, 90, 91], subjects: [] },
  { id: 4, name: "Ana Gonzales",       score: 65, attempts: 3, passRate: 33, trend: [50, 58, 65],         subjects: [] },
  { id: 5, name: "Paolo Mendoza",      score: 79, attempts: 4, passRate: 75, trend: [60, 70, 74, 79],     subjects: [] },
  { id: 6, name: "Liza Ramos",         score: 95, attempts: 7, passRate: 86, trend: [72, 80, 85, 88, 91, 93, 95], subjects: [] },
  { id: 7, name: "Jose Villanueva",    score: 58, attempts: 3, passRate: 0,  trend: [48, 53, 58],         subjects: [] },
  { id: 8, name: "Kristine Bautista",  score: 83, attempts: 5, passRate: 80, trend: [65, 72, 76, 80, 83], subjects: [] },
];

const AdminStudentEnhancement = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Real API data
  const [passFailData, setPassFailData]     = useState(null); // /pass-fail-rate
  const [improvementData, setImprovementData] = useState(null); // /improvement-percentage

  // Mock data (used until backend SQL is fixed)
  const [summary] = useState(MOCK_SUMMARY);
  const [studentProgress] = useState(MOCK_STUDENT_PROGRESS);

  // Chart refs
  const passFailChartRef  = useRef(null);
  const progressChartRef  = useRef(null);
  const studentTrendRef   = useRef(null);
  const passFailInst      = useRef(null);
  const progressInst      = useRef(null);
  const studentTrendInst  = useRef(null);

  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  // ── Fetch real API data ───────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [passFailRes, improvementRes] = await Promise.all([
          fetch(`${apiUrl}/admin/analytics/pass-fail-rate`,        { headers }),
          fetch(`${apiUrl}/admin/analytics/improvement-percentage`, { headers }),
        ]);

        // /pass-fail-rate → { message, data: { total, passed, failed, pass_rate, breakdown } }
        if (passFailRes.ok) {
          const json = await passFailRes.json();
          setPassFailData(json.data ?? null);
        } else {
          console.error("pass-fail-rate error:", passFailRes.status);
        }

        // /improvement-percentage → { message, data: { current_month_avg, previous_month_avg, improvement_percentage, trend } }
        if (improvementRes.ok) {
          const json = await improvementRes.json();
          setImprovementData(json.data ?? null);
        } else {
          console.error("improvement-percentage error:", improvementRes.status);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [apiUrl]);

  // ── Chart loader ──────────────────────────────────────────────
  const ensureChart = (cb) => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = cb;
    document.head.appendChild(s);
  };

  // Overview charts
  useEffect(() => {
    if (activeTab !== "overview" || loading) return;
    ensureChart(() => {
      setTimeout(() => {

        // ── Pass/Fail doughnut chart (real data) ──────────────
        if (passFailChartRef.current && passFailData) {
          passFailInst.current?.destroy();
          const { passed, failed, total, pass_rate, breakdown } = passFailData;
          passFailInst.current = new window.Chart(passFailChartRef.current, {
            type: "doughnut",
            data: {
              labels: ["Passed", "Failed"],
              datasets: [{
                data: [Number(passed), Number(failed)],
                backgroundColor: ["#16a34acc", "#dc2626cc"],
                borderWidth: 0,
                hoverOffset: 6,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "68%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { font: { size: 11 }, color: TICK_COLOR, padding: 16 },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.raw} students`,
                  },
                },
              },
            },
          });
        }

        // ── Improvement trend line chart (real data) ──────────
        if (progressChartRef.current && improvementData) {
          progressInst.current?.destroy();
          const { current_month_avg, previous_month_avg, improvement_percentage, trend } = improvementData;
          // Build a simple 2-point trend from the real data we have
          const labels = ["Previous Month", "Current Month"];
          const values = [
            parseFloat(previous_month_avg ?? 0).toFixed(1),
            parseFloat(current_month_avg ?? 0).toFixed(1),
          ];
          progressInst.current = new window.Chart(progressChartRef.current, {
            type: "line",
            data: {
              labels,
              datasets: [{
                label: "Avg Score",
                data: values,
                borderColor: ORANGE,
                backgroundColor: ORANGE + "18",
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: ORANGE,
                fill: true,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => ` Avg Score: ${ctx.raw}%`,
                  },
                },
              },
              scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
                y: {
                  min: Math.max(0, Math.min(...values) - 10),
                  max: Math.min(100, Math.max(...values) + 10),
                  grid: { color: GRID_COLOR },
                  ticks: { color: TICK_COLOR, font: { size: 11 }, callback: (v) => `${v}%` },
                },
              },
            },
          });
        }
      }, 50);
    });
    return () => {
      passFailInst.current?.destroy(); passFailInst.current = null;
      progressInst.current?.destroy(); progressInst.current = null;
    };
  }, [activeTab, loading, passFailData, improvementData]);

  // Student detail trend chart
  useEffect(() => {
    if (!selectedStudent) return;
    ensureChart(() => {
      setTimeout(() => {
        if (studentTrendRef.current) {
          studentTrendInst.current?.destroy();
          const trend  = selectedStudent.trend ?? [];
          const labels = trend.map((_, i) => `Attempt ${i + 1}`);
          studentTrendInst.current = new window.Chart(studentTrendRef.current, {
            type: "line",
            data: {
              labels,
              datasets: [{
                label: "Score",
                data: trend,
                borderColor: ORANGE,
                backgroundColor: ORANGE + "18",
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: ORANGE,
                fill: true,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
                y: { min: 0, max: 100, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
              },
            },
          });
        }
      }, 50);
    });
    return () => { studentTrendInst.current?.destroy(); studentTrendInst.current = null; };
  }, [selectedStudent]);

  // ── Derived values (real + mock) ──────────────────────────────
  const totalStudents  = summary?.total_students ?? 0;
  const avgScore       = passFailData
    ? ((Number(passFailData.passed) / Number(passFailData.total)) * 100).toFixed(1)
    : summary?.average_score ?? null;
  const passRate       = passFailData?.pass_rate ?? null;
  const topPerformers  = summary?.top_performers ?? null;
  const needSupport    = summary?.need_support ?? null;
  const improvement    = improvementData?.improvement_percentage ?? null;
  const trendLabel     = improvementData?.trend ?? null;

  // Breakdown from real pass-fail data
  const breakdown = passFailData?.breakdown ?? null;

  // Students list (mock for now)
  const normalizedStudents = studentProgress.map((s, i) => ({
    ...s,
    id:       s.id ?? i,
    name:     s.name ?? `Student ${i + 1}`,
    score:    Math.round(s.score ?? 0),
    attempts: s.attempts ?? 0,
    passRate: Math.round(s.passRate ?? 0),
    status:   getStatus(Math.round(s.score ?? 0)),
    trend:    s.trend ?? [],
    subjects: s.subjects ?? [],
  }));

  const filteredStudents = normalizedStudents.filter((s) => {
    const matchSearch = search.trim()
      ? s.name.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchFilter =
      statusFilter === "all" ? true : s.status === statusFilter;
    return matchSearch && matchFilter;
  });

  const passingCount = normalizedStudents.filter((s) => s.score >= 75).length;
  const failingCount = normalizedStudents.filter((s) => s.score < 75).length;

  return (
    <div className="outfit-400 p-3 sm:p-6 min-h-screen pt-16 sm:pt-6 pb-28 sm:pb-6">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[16px] sm:text-[20px] font-semibold text-gray-800">
            Student Enhancement Analytics
          </h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Overall student performance and insights
          </p>
        </div>

        {/* Trend pill */}
        {trendLabel && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border ${
            trendLabel === "improving"
              ? "bg-green-50 text-green-600 border-green-200"
              : trendLabel === "declining"
              ? "bg-red-50 text-red-500 border-red-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}>
            <i className={`bx ${trendLabel === "improving" ? "bx-trending-up" : trendLabel === "declining" ? "bx-trending-down" : "bx-minus"} text-[14px]`}></i>
            {trendLabel.charAt(0).toUpperCase() + trendLabel.slice(1)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "students"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedStudent(null); }}
            className={`px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {loading && activeTab === "overview" && (
        <div className="flex items-center justify-center py-24">
          <span className="loader" />
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {!loading && activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { label: "Total students",  value: totalStudents,                                                                    color: ORANGE,     icon: "bx-group",         note: "mock data" },
              { label: "Avg. score",      value: avgScore != null ? `${avgScore}%` : "—",                                         color: "#555",     icon: "bx-bar-chart-alt-2" },
              { label: "Pass rate",       value: passRate != null ? `${Math.round(passRate)}%` : "—",                             color: "#16a34a",  icon: "bx-check-circle" },
              { label: "Top performers",  value: topPerformers ?? "—",                                                             color: ORANGE,     icon: "bx-trophy",        note: "mock data" },
              { label: "Need support",    value: needSupport ?? "—",                                                               color: "#dc2626",  icon: "bx-error-circle",  note: "mock data" },
              { label: "Improvement",     value: improvement != null ? `${improvement > 0 ? "+" : ""}${improvement}%` : "—",     color: "#7c3aed",  icon: "bx-trending-up" },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: m.color }} />
                <div className="flex items-center justify-between mb-1 mt-1">
                  <div className="text-[11px] sm:text-[12px] text-gray-400">{m.label}</div>
                  {m.note && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">mock</span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[18px] sm:text-[22px] font-semibold" style={{ color: m.color }}>{m.value}</div>
                  <i className={`bx ${m.icon} text-[18px] opacity-20`} style={{ color: m.color }}></i>
                </div>
              </div>
            ))}
          </div>

          {/* Pass/Fail summary cards — REAL DATA */}
          {passFailData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total exams taken", value: passFailData.total,                color: "#555",    sub: "all attempts" },
                { label: "Passed",            value: passFailData.passed,              color: "#16a34a", sub: `${Math.round(passFailData.pass_rate)}% pass rate` },
                { label: "Failed",            value: passFailData.failed,              color: "#dc2626", sub: `${Math.round(100 - passFailData.pass_rate)}% fail rate` },
                { label: "Excellent scores",  value: breakdown?.excellent ?? "—",     color: ORANGE,    sub: "score ≥ 90%" },
              ].map((m) => (
                <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-[12px] text-gray-400 mb-1">{m.label}</div>
                  <div className="text-[26px] font-semibold" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Score breakdown bar — REAL DATA */}
          {breakdown && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <div className="text-[14px] font-medium text-gray-700 mb-3">Score breakdown</div>
              <div className="space-y-2">
                {[
                  { label: "Excellent (≥ 90%)",      value: breakdown.excellent,         color: "#c45e10", bg: "#fff0e0" },
                  { label: "Good (80–89%)",           value: breakdown.good,              color: "#16a34a", bg: "#dcfce7" },
                  { label: "Needs improvement (75–79%)", value: breakdown.needs_improvement, color: "#906000", bg: "#fffae0" },
                  { label: "Poor (< 75%)",            value: breakdown.poor,              color: "#dc2626", bg: "#fde8e8" },
                ].map((row) => {
                  const pct = passFailData?.total
                    ? Math.round((Number(row.value) / Number(passFailData.total)) * 100)
                    : 0;
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className="w-36 text-[12px] text-gray-500 flex-shrink-0">{row.label}</div>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: row.color }} />
                      </div>
                      <div className="text-[12px] font-medium w-14 text-right" style={{ color: row.color }}>
                        {row.value} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            {/* Pass / Fail doughnut */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-[14px] font-medium text-gray-700 mb-1">Pass vs Fail distribution</div>
              <div className="text-[12px] text-gray-400 mb-1">
                Total exam attempts: <span className="font-semibold text-gray-600">{passFailData?.total ?? "—"}</span>
              </div>
              {!passFailData ? (
                <div className="flex items-center justify-center h-[200px] text-[13px] text-gray-400">No data available.</div>
              ) : (
                <div style={{ height: 220 }}><canvas ref={passFailChartRef} /></div>
              )}
            </div>

            {/* Score trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-[14px] font-medium text-gray-700 mb-1">Score progression</div>
              <div className="text-[12px] text-gray-400 mb-3">
                Month-over-month average score
                {improvementData && (
                  <span className={`ml-2 font-semibold ${improvementData.improvement_percentage >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {improvementData.improvement_percentage >= 0 ? "▲" : "▼"} {Math.abs(improvementData.improvement_percentage)}%
                  </span>
                )}
              </div>
              {!improvementData ? (
                <div className="flex items-center justify-center h-[200px] text-[13px] text-gray-400">No data available.</div>
              ) : (
                <div style={{ height: 200 }}><canvas ref={progressChartRef} /></div>
              )}
            </div>
          </div>

          {/* Mock data notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-700">
            <i className="bx bx-info-circle text-[16px] flex-shrink-0 mt-0.5"></i>
            <span>
              <strong>Note:</strong> Cards marked <span className="font-semibold">mock</span> use placeholder data while the backend SQL fix for <code className="bg-amber-100 px-1 rounded">/summary</code> is pending. All other data is live.
            </span>
          </div>
        </>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === "students" && !selectedStudent && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">

          {/* Mock data notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-700 mb-4">
            <i className="bx bx-info-circle text-[16px] flex-shrink-0 mt-0.5"></i>
            <span>
              Student list is using <strong>mock/placeholder data</strong> while the backend SQL fix for <code className="bg-amber-100 px-1 rounded">/student-progress</code> is pending.
            </span>
          </div>

          {/* Header + filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-[14px] font-medium text-gray-700">
              All students
              <span className="ml-2 text-[12px] text-gray-400">
                ({filteredStudents.length} students)
              </span>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {["all", "excellent", "good", "average", "needs support"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-colors capitalize ${
                    statusFilter === f
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-full sm:w-[220px] text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-orange-400 mb-4"
          />

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-gray-400">No students found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr>
                      {["Student", "Attempts", "Avg Score", "Pass Rate", "Status"].map((h, i) => (
                        <th key={h} className={`text-[11px] font-medium text-gray-400 pb-2 px-2 border-b border-gray-100 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => {
                      const av = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0" style={{ background: av.bg, color: av.fg, border: `1px solid ${av.fg}44` }}>
                                {initials(s.name)}
                              </div>
                              <span className="font-medium text-gray-700 whitespace-nowrap">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-500">{s.attempts}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={pillStyle(s.score)}>
                              {s.score}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.passRate}%`, background: s.passRate >= 75 ? "#16a34a" : "#f57c20" }} />
                              </div>
                              <span className="text-[12px] text-gray-500">{s.passRate}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center"><StatusBadge status={s.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filteredStudents.map((s, i) => {
                  const av = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                  return (
                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="border border-gray-200 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0" style={{ background: av.bg, color: av.fg, border: `1px solid ${av.fg}44` }}>
                          {initials(s.name)}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-gray-800">{s.name}</div>
                          <div className="text-[11px] text-gray-400">{s.attempts} attempts</div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex gap-4 pt-2 border-t border-gray-100">
                        <div>
                          <div className="text-[10px] text-gray-400">Avg Score</div>
                          <div className="text-[13px] font-semibold" style={{ color: scoreColor(s.score) }}>{s.score}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Pass Rate</div>
                          <div className="text-[12px] font-medium" style={{ color: s.passRate >= 75 ? "#16a34a" : "#f57c20" }}>{s.passRate}%</div>
                        </div>
                        <div className="ml-auto flex items-center">
                          <i className="bx bx-chevron-right text-[20px] text-gray-300"></i>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STUDENT DETAIL ── */}
      {activeTab === "students" && selectedStudent && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {(() => {
              const av = AVATAR_PALETTE[normalizedStudents.indexOf(selectedStudent) % AVATAR_PALETTE.length];
              return (
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-[15px]" style={{ background: av.bg, color: av.fg, border: `1.5px solid ${av.fg}66` }}>
                  {initials(selectedStudent.name)}
                </div>
              );
            })()}
            <div>
              <div className="text-[16px] font-semibold text-gray-800">{selectedStudent.name}</div>
              <div className="text-[13px] text-gray-400">
                {selectedStudent.attempts} attempts · {selectedStudent.passRate}% pass rate
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="ml-auto text-[12px] px-4 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              ← Back to list
            </button>
          </div>

          {/* Detail metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Avg. score",     value: `${selectedStudent.score}%`,    color: scoreColor(selectedStudent.score) },
              { label: "Pass rate",      value: `${selectedStudent.passRate}%`, color: selectedStudent.passRate >= 75 ? "#16a34a" : ORANGE },
              { label: "Total attempts", value: selectedStudent.attempts,        color: ORANGE },
              { label: "Status",         value: selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1), color: "#555" },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-[11px] text-gray-400 mb-1">{m.label}</div>
                <div className="text-[18px] font-semibold" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Subject scores if available */}
          {selectedStudent.subjects && selectedStudent.subjects.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mb-3">Subject breakdown</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {selectedStudent.subjects.map((sub) => (
                  <div key={sub.subjectName ?? sub.subject ?? sub.name} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[13px] font-medium text-gray-700 truncate">{sub.subjectName ?? sub.subject ?? sub.name}</span>
                      <span className="text-[13px] font-semibold ml-2" style={{ color: scoreColor(sub.average_score ?? sub.score ?? 0) }}>
                        {Math.round(sub.average_score ?? sub.score ?? 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${sub.average_score ?? sub.score ?? 0}%`, background: scoreColor(sub.average_score ?? sub.score ?? 0) }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Trend chart */}
          {selectedStudent.trend && selectedStudent.trend.length > 0 && (
            <>
              <div className="text-[14px] font-medium text-gray-700 mb-3">Score trend</div>
              <div style={{ height: 200 }}><canvas ref={studentTrendRef} /></div>
            </>
          )}

          {(!selectedStudent.subjects || selectedStudent.subjects.length === 0) &&
           (!selectedStudent.trend || selectedStudent.trend.length === 0) && (
            <div className="text-center py-8 text-[13px] text-gray-400">
              No detailed breakdown available for this student.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudentEnhancement;
