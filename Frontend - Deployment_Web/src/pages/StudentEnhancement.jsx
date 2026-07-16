//StudentEnhancement

import { useEffect, useRef, useState } from "react";

const StudentEnhancement = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const overviewChartRef = useRef(null);
  const subjectChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const overviewChartInst = useRef(null);
  const subjectChartInst = useRef(null);
  const trendChartInst = useRef(null);

  const GRID_COLOR = "rgba(0,0,0,0.06)";
  const TICK_COLOR = "#9ca3af";
  const ORANGE = "#f57c20";

  // ── Fetch real data ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${apiUrl}/practice-exam/score-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || data || []);
        } else {
          const r2 = await fetch(`${apiUrl}/practice-exam/results`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r2.ok) {
            const d2 = await r2.json();
            setHistory(d2.results || d2 || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  // ── Derived data ─────────────────────────────────────────────
  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
  );

  const filtered =
    filter === "all"
      ? sorted
      : sorted.filter((h) => (filter === "pass" ? h.passed : !h.passed));

  const withScores = sorted.filter((h) => h.score != null);
  const avgScore = withScores.length
    ? Math.round(
        withScores.reduce((s, h) => s + h.score, 0) / withScores.length
      )
    : null;
  const passCount = sorted.filter((h) => h.passed).length;
  const failCount = sorted.filter((h) => !h.passed).length;
  const passRate = sorted.length
    ? Math.round((passCount / sorted.length) * 100)
    : null;

  const baseline =
    withScores.length >= 2
      ? Math.round(
          withScores
            .slice(0, Math.ceil(withScores.length / 2))
            .reduce((s, h) => s + h.score, 0) /
            Math.ceil(withScores.length / 2)
        )
      : null;
  const current =
    withScores.length >= 2
      ? Math.round(
          withScores
            .slice(-Math.ceil(withScores.length / 2))
            .reduce((s, h) => s + h.score, 0) /
            Math.ceil(withScores.length / 2)
        )
      : null;
  const improvement =
    baseline && current && baseline > 0
      ? Math.round(((current - baseline) / baseline) * 100)
      : null;

  // Group by subject
  const subjectMap = {};
  sorted.forEach((h) => {
    const key = h.subjectName || h.subjectCode || "Unknown";
    if (!subjectMap[key]) {
      subjectMap[key] = {
        name: key,
        code: h.subjectCode || "",
        scores: [],
        attempts: 0,
        passed: 0,
      };
    }
    if (h.score != null) subjectMap[key].scores.push(h.score);
    subjectMap[key].attempts++;
    if (h.passed) subjectMap[key].passed++;
  });

  const subjects = Object.values(subjectMap).map((s) => ({
    ...s,
    avg: s.scores.length
      ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      : 0,
    passRate: s.attempts
      ? Math.round((s.passed / s.attempts) * 100)
      : 0,
    best: s.scores.length ? Math.max(...s.scores) : 0,
    lowest: s.scores.length ? Math.min(...s.scores) : 0,
  }));

  // Monthly trend
  const monthMap = {};
  sorted.forEach((h) => {
    const key = new Date(h.completedAt).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 };
    monthMap[key].total += h.score ?? 0;
    monthMap[key].count++;
  });
  const monthLabels = Object.keys(monthMap);
  const monthAvgs = monthLabels.map((k) =>
    Math.round(monthMap[k].total / monthMap[k].count)
  );

  // Search filter for history tab
  const searchFiltered = filtered.filter((h) =>
    search.trim()
      ? (h.subjectName || "").toLowerCase().includes(search.toLowerCase()) ||
        (h.subjectCode || "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  // ── Score color ───────────────────────────────────────────────
  const sc = (v) =>
    v >= 75 ? "#16a34a" : v >= 60 ? "#f57c20" : "#dc2626";

  // ── Charts ───────────────────────────────────────────────────
  const ensureChart = (cb) => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = cb;
    document.head.appendChild(s);
  };

  // Overview trend chart
  useEffect(() => {
    if (activeTab !== "overview" || loading) return;
    ensureChart(() => {
      setTimeout(() => {
        if (overviewChartRef.current && monthLabels.length > 0) {
          overviewChartInst.current?.destroy();
          overviewChartInst.current = new window.Chart(
            overviewChartRef.current,
            {
              type: "line",
              data: {
                labels: monthLabels,
                datasets: [
                  {
                    label: "Avg Score",
                    data: monthAvgs,
                    borderColor: ORANGE,
                    backgroundColor: ORANGE + "18",
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: ORANGE,
                    fill: true,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { color: GRID_COLOR },
                    ticks: { color: TICK_COLOR, font: { size: 11 } },
                  },
                  y: {
                    min: 0,
                    max: 100,
                    grid: { color: GRID_COLOR },
                    ticks: { color: TICK_COLOR, font: { size: 11 } },
                  },
                },
              },
            }
          );
        }

        // Subject avg bar chart
        if (subjectChartRef.current && subjects.length > 0) {
          subjectChartInst.current?.destroy();
          subjectChartInst.current = new window.Chart(
            subjectChartRef.current,
            {
              type: "bar",
              data: {
                labels: subjects.map((s) => s.code || s.name),
                datasets: [
                  {
                    label: "Avg Score",
                    data: subjects.map((s) => s.avg),
                    backgroundColor: subjects.map((s) => sc(s.avg) + "cc"),
                    borderRadius: 4,
                    borderSkipped: false,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    min: 0,
                    max: 100,
                    grid: { color: GRID_COLOR },
                    ticks: { color: TICK_COLOR, font: { size: 11 } },
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: TICK_COLOR, font: { size: 11 } },
                  },
                },
              },
            }
          );
        }
      }, 50);
    });

    return () => {
      overviewChartInst.current?.destroy();
      overviewChartInst.current = null;
      subjectChartInst.current?.destroy();
      subjectChartInst.current = null;
    };
  }, [activeTab, loading, history]);

  // Subject trend chart
  useEffect(() => {
    if (activeTab !== "subjects" || !selectedSubject) return;
    ensureChart(() => {
      setTimeout(() => {
        if (trendChartRef.current) {
          const subjectHistory = sorted.filter(
            (h) => (h.subjectName || h.subjectCode) === selectedSubject.name
          );
          trendChartInst.current?.destroy();
          trendChartInst.current = new window.Chart(trendChartRef.current, {
            type: "line",
            data: {
              labels: subjectHistory.map((h, i) => `Attempt ${i + 1}`),
              datasets: [
                {
                  label: "Score",
                  data: subjectHistory.map((h) => h.score),
                  borderColor: ORANGE,
                  backgroundColor: ORANGE + "18",
                  tension: 0.4,
                  pointRadius: 5,
                  pointBackgroundColor: ORANGE,
                  fill: true,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { color: GRID_COLOR },
                  ticks: { color: TICK_COLOR, font: { size: 11 } },
                },
                y: {
                  min: 0,
                  max: 100,
                  grid: { color: GRID_COLOR },
                  ticks: { color: TICK_COLOR, font: { size: 11 } },
                },
              },
            },
          });
        }
      }, 50);
    });

    return () => {
      trendChartInst.current?.destroy();
      trendChartInst.current = null;
    };
  }, [activeTab, selectedSubject]);

  // ── Format date ───────────────────────────────────────────────
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const EMPTY = !loading && history.length === 0;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="outfit-400 p-3 sm:p-6 min-h-screen pt-16 sm:pt-6 pb-28 sm:pb-6">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[16px] sm:text-[20px] font-semibold text-gray-800">
            Student Enhancement Analytics
          </h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Your practice exam performance across all subjects
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "history", "subjects"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "subjects" && subjects.length > 0 && !selectedSubject)
                setSelectedSubject(subjects[0]);
            }}
            className={`px-4 sm:px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize ${
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
      {loading && (
        <div className="flex items-center justify-center py-24">
          <span className="loader" />
        </div>
      )}

      {/* ── EMPTY ── */}
      {EMPTY && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-[40px] mb-3">📊</div>
          <div className="text-[15px] font-medium text-gray-700 mb-1">
            No exam data yet
          </div>
          <div className="text-[13px] text-gray-400">
            Take your first practice exam to see your analytics here.
          </div>
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {!loading && !EMPTY && activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              {
                label: "Total Attempts",
                value: history.length,
                color: "#f57c20",
              },
              {
                label: "Avg. Score",
                value: avgScore != null ? `${avgScore}%` : "—",
                color: "#16a34a",
              },
              {
                label: "Pass Rate",
                value: passRate != null ? `${passRate}%` : "—",
                color: "#3b82f6",
              },
              {
                label: "Improvement",
                value:
                  improvement != null
                    ? `${improvement > 0 ? "+" : ""}${improvement}%`
                    : "—",
                color: "#7c3aed",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
                  style={{ background: m.color }}
                />
                <div className="text-[11px] sm:text-[12px] text-gray-400 mb-1 mt-1">
                  {m.label}
                </div>
                <div
                  className="text-[20px] sm:text-[24px] font-semibold"
                  style={{ color: m.color }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <div className="text-[14px] font-medium text-gray-700 mb-3">
              Score trend over time
            </div>
            {monthLabels.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-[13px] text-gray-400">
                Not enough data to show trend.
              </div>
            ) : (
              <div style={{ height: 180 }}>
                <canvas ref={overviewChartRef} />
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-5 h-[2px] bg-green-500 rounded" />
              <span className="text-[11px] text-gray-400">
                Pass threshold: 75%
              </span>
              {improvement != null && (
                <span
                  className="ml-auto text-[12px] font-medium"
                  style={{ color: improvement >= 0 ? "#16a34a" : "#dc2626" }}
                >
                  {improvement >= 0 ? "↑" : "↓"} {Math.abs(improvement)}%
                  overall improvement
                </span>
              )}
            </div>
          </div>

          {/* Subject avg chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <div className="text-[14px] font-medium text-gray-700 mb-1">
              Average score per subject
            </div>
            <div className="text-[12px] text-gray-400 mb-3">
              Based on all your exam attempts
            </div>
            {subjects.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-[13px] text-gray-400">
                No subject data available.
              </div>
            ) : (
              <div style={{ height: Math.max(180, subjects.length * 36) }}>
                <canvas ref={subjectChartRef} />
              </div>
            )}
          </div>

          {/* Pass vs Fail */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-[12px] text-gray-400 mb-1">
                Passed exams
              </div>
              <div className="text-[24px] font-semibold text-green-600">
                {passCount}
              </div>
              <div className="text-[11px] text-gray-400">
                out of {sorted.length} attempts
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-[12px] text-gray-400 mb-1">
                Failed exams
              </div>
              <div className="text-[24px] font-semibold text-red-500">
                {failCount}
              </div>
              <div className="text-[11px] text-gray-400">
                out of {sorted.length} attempts
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {!loading && !EMPTY && activeTab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          {/* Search + filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-[14px] font-medium text-gray-700">
              All exam attempts
              <span className="ml-2 text-[12px] text-gray-400">
                ({searchFiltered.length} records)
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: "All" },
                { id: "pass", label: "Passed" },
                { id: "fail", label: "Failed" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-[12px] font-medium px-3 py-1 rounded-full border transition-colors ${
                    filter === f.id
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject..."
            className="w-full sm:w-[220px] text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-orange-400 mb-4"
          />

          {searchFiltered.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-gray-400">
              No results match your filter.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr>
                      {[
                        "Subject",
                        "Date",
                        "Score",
                        "Status",
                        "Attempt #",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={`text-[11px] font-medium text-gray-400 pb-2 px-2 border-b border-gray-100 whitespace-nowrap ${
                            i === 0 ? "text-left" : "text-center"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchFiltered.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-gray-700">
                            {h.subjectName || "Practice Exam"}
                          </div>
                          {h.subjectCode && (
                            <div className="text-[11px] text-gray-400">
                              {h.subjectCode}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500 whitespace-nowrap">
                          {fmtDate(h.completedAt)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className="font-semibold text-[14px]"
                            style={{ color: sc(h.score ?? 0) }}
                          >
                            {h.score != null ? `${h.score}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              h.passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {h.passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-400">
                          #{h.attemptNumber ?? i + 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {searchFiltered.map((h, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">
                          {h.subjectName || "Practice Exam"}
                        </div>
                        {h.subjectCode && (
                          <div className="text-[11px] text-gray-400">
                            {h.subjectCode}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          h.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {h.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-[10px] text-gray-400">Score</div>
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: sc(h.score ?? 0) }}
                        >
                          {h.score != null ? `${h.score}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Date</div>
                        <div className="text-[12px] text-gray-600">
                          {fmtDate(h.completedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">
                          Attempt
                        </div>
                        <div className="text-[12px] text-gray-600">
                          #{h.attemptNumber ?? i + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {!loading && !EMPTY && activeTab === "subjects" && (
        <>
          {subjects.length === 0 ? (
            <div className="text-center py-16 text-[13px] text-gray-400">
              No subject data available.
            </div>
          ) : (
            <>
              {/* Subject selector cards */}
              <div className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mb-3">
                Select a subject
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
                {subjects.map((sub) => (
                  <div
                    key={sub.name}
                    onClick={() => setSelectedSubject(sub)}
                    className={`bg-white border rounded-xl p-3 sm:p-4 cursor-pointer transition-all ${
                      selectedSubject?.name === sub.name
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-[11px] text-gray-400 mb-1 truncate">
                      {sub.code}
                    </div>
                    <div className="text-[12px] sm:text-[13px] font-medium text-gray-700 mb-2 leading-tight line-clamp-2">
                      {sub.name}
                    </div>
                    <div
                      className="text-[20px] font-semibold"
                      style={{ color: sc(sub.avg) }}
                    >
                      {sub.avg}%
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {sub.attempts} attempt{sub.attempts !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subject detail */}
              {selectedSubject && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                  <div className="mb-4">
                    <div className="text-[16px] font-semibold text-gray-800">
                      {selectedSubject.name}
                    </div>
                    <div className="text-[13px] text-gray-400">
                      {selectedSubject.code}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      {
                        label: "Avg. Score",
                        value: `${selectedSubject.avg}%`,
                        color: sc(selectedSubject.avg),
                      },
                      {
                        label: "Pass Rate",
                        value: `${selectedSubject.passRate}%`,
                        color:
                          selectedSubject.passRate >= 75
                            ? "#16a34a"
                            : "#f57c20",
                      },
                      {
                        label: "Best Score",
                        value: `${selectedSubject.best}%`,
                        color: "#16a34a",
                      },
                      {
                        label: "Lowest Score",
                        value: `${selectedSubject.lowest}%`,
                        color: sc(selectedSubject.lowest),
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="text-[11px] text-gray-400 mb-1">
                          {m.label}
                        </div>
                        <div
                          className="text-[18px] font-semibold"
                          style={{ color: m.color }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score trend for this subject */}
                  <div className="text-[13px] font-medium text-gray-700 mb-3">
                    Score trend — {selectedSubject.name}
                  </div>
                  <div style={{ height: 200 }} className="mb-5">
                    <canvas ref={trendChartRef} />
                  </div>

                  {/* Attempts table */}
                  <div className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mb-3">
                    Attempt history
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr>
                          {["#", "Date", "Score", "Points", "Status"].map(
                            (h, i) => (
                              <th
                                key={h}
                                className={`text-[11px] font-medium text-gray-400 pb-2 px-2 border-b border-gray-100 whitespace-nowrap ${
                                  i === 0 ? "text-left" : "text-center"
                                }`}
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted
                          .filter(
                            (h) =>
                              (h.subjectName || h.subjectCode) ===
                              selectedSubject.name
                          )
                          .map((h, i) => (
                            <tr
                              key={i}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-2 px-2 text-gray-500">
                                #{h.attemptNumber ?? i + 1}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-500 whitespace-nowrap">
                                {fmtDate(h.completedAt)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className="font-semibold"
                                  style={{ color: sc(h.score ?? 0) }}
                                >
                                  {h.score != null ? `${h.score}%` : "—"}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center text-gray-500">
                                {h.earnedPoints != null && h.totalPoints != null
                                  ? `${h.earnedPoints}/${h.totalPoints}`
                                  : "—"}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    h.passed
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {h.passed ? "Passed" : "Failed"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    {sorted
                      .filter(
                        (h) =>
                          (h.subjectName || h.subjectCode) ===
                          selectedSubject.name
                      )
                      .map((h, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[12px] text-gray-500">
                              Attempt #{h.attemptNumber ?? i + 1}
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                h.passed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {h.passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                          <div className="flex gap-4 pt-2 border-t border-gray-100">
                            <div>
                              <div className="text-[10px] text-gray-400">
                                Score
                              </div>
                              <div
                                className="text-[13px] font-semibold"
                                style={{ color: sc(h.score ?? 0) }}
                              >
                                {h.score != null ? `${h.score}%` : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400">
                                Points
                              </div>
                              <div className="text-[12px] text-gray-600">
                                {h.earnedPoints != null &&
                                h.totalPoints != null
                                  ? `${h.earnedPoints}/${h.totalPoints}`
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400">
                                Date
                              </div>
                              <div className="text-[12px] text-gray-600">
                                {fmtDate(h.completedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StudentEnhancement;