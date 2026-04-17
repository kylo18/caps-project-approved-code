import { useEffect, useRef, useState } from "react";

const ORANGE = "#f57c20";
const GRID_COLOR = "rgba(0,0,0,0.06)";
const TICK_COLOR = "#9ca3af";

const PROGRAMS = ["All", "BSCpE", "CE", "ECE", "EE"];

const PROGRAM_COLORS = {
  BSCpE: { bg: "#fff0e0", fg: "#c45e10" },
  CE:    { bg: "#e0f5ee", fg: "#0f6e56" },
  ECE:   { bg: "#e6f1fb", fg: "#185fa5" },
  EE:    { bg: "#faeeda", fg: "#854f0b" },
};

const AVATAR_PALETTE = [
  { bg: "#fff0e0", fg: "#c45e10" }, { bg: "#e0f5ee", fg: "#0f6e56" },
  { bg: "#e6f1fb", fg: "#185fa5" }, { bg: "#faeeda", fg: "#854f0b" },
  { bg: "#f0f0f0", fg: "#5f5e5a" }, { bg: "#fcebeb", fg: "#a32d2d" },
  { bg: "#eeedfe", fg: "#534ab7" }, { bg: "#fbeaf0", fg: "#993556" },
];


// ── Helpers ──────────────────────────────────────────────────────────────────
const getStatus = (score) =>
  score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 75 ? "average" : "needs support";

const scoreColor = (v) =>
  v >= 90 ? "#c45e10" : v >= 80 ? "#0f6e56" : v >= 75 ? "#854f0b" : "#a32d2d";

const pillStyle = (v) =>
  v >= 90 ? { background: "#fff0e0", color: "#c45e10" }
  : v >= 80 ? { background: "#e0f5ee", color: "#0f6e56" }
  : v >= 75 ? { background: "#faeeda", color: "#854f0b" }
  : { background: "#fcebeb", color: "#a32d2d" };

const initials = (name) =>
  (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const normalizeProgram = (program) => {
  if (!program) return "";
  const key = program.toString().trim().replace(/\s+/g, "").replace(/[-_]/g, "").toUpperCase();
  if (["BSCPE", "BSCOE"].includes(key)) return "BSCpE";
  if (["BSCE", "CE"].includes(key)) return "CE";
  if (["BSECE", "ECE"].includes(key)) return "ECE";
  if (["BSEE", "EE"].includes(key)) return "EE";
  if (["BSABE", "ABE"].includes(key)) return "ABE";
  if (key === "GE") return "GE";
  return program.toString().trim();
};

const getProgramLabel = (program) => {
  const normalized = normalizeProgram(program);
  return PROGRAMS.includes(normalized) ? normalized : normalized;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    excellent:      { bg: "#fff0e0", fg: "#c45e10", label: "Excellent" },
    good:           { bg: "#e0f5ee", fg: "#0f6e56", label: "Good" },
    average:        { bg: "#f0f0f0", fg: "#5f5e5a", label: "Average" },
    "needs support":{ bg: "#fcebeb", fg: "#a32d2d", label: "Needs support" },
  };
  const c = map[status] || map["needs support"];
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium">
      {c.label}
    </span>
  );
};

const ProgramTag = ({ program }) => {
  const label = getProgramLabel(program);
  const c = PROGRAM_COLORS[label] || { bg: "#f0f0f0", fg: "#555" };
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium">
      {label}
    </span>
  );
};

const PassRateBar = ({ value }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full rounded-full"
        style={{ width: `${value}%`, background: value >= 75 ? "#0f6e56" : ORANGE }} />
    </div>
    <span className="text-[12px] text-gray-500">{value}%</span>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ students, summaryData, passFailData, improvementData, studentProgressData, onProgramClick }) => {
  const passFailChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const passFailInst = useRef(null);
  const progressInst = useRef(null);

  const totalStudents = summaryData?.total_students ?? students.length;
  const totalResults = passFailData?.total ?? 0;
  const passed = passFailData?.passed ?? 0;
  const failed = passFailData?.failed ?? 0;
  const exc  = passFailData?.breakdown?.excellent ?? 0;
  const good = passFailData?.breakdown?.good ?? 0;
  const ni   = passFailData?.breakdown?.needs_improvement ?? 0;
  const poor = passFailData?.breakdown?.poor ?? 0;

  const progStats = PROGRAMS.filter((p) => p !== "All").map((p) => {
    const list = students.filter((s) => normalizeProgram(s.program || s.programName) === p);
    const scoreValues = list.map((s) => Number(s.score ?? s.average_score ?? 0));
    const avg = list.length
      ? parseFloat((scoreValues.reduce((a, v) => a + v, 0) / list.length).toFixed(1))
      : null;
    const pr = list.length
      ? Math.round((scoreValues.filter((v) => v >= 75).length / list.length) * 100)
      : null;
    return { p, count: list.length, avg, pr };
  });

  const scoreRows = [
    { label: "Excellent (≥ 80%)",            val: exc,  color: "#c45e10" },
    { label: "Good (60–79%)",                 val: good, color: "#0f6e56" },
    { label: "Needs improvement (40–59%)",   val: ni,   color: "#854f0b" },
    { label: "Poor (< 40%)",                 val: poor, color: "#a32d2d" },
  ];

  const ensureChart = (cb) => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = cb;
    document.head.appendChild(s);
  };

  useEffect(() => {
    ensureChart(() => {
      setTimeout(() => {
        // Pass/Fail donut — prefer real API data, fallback to mock
        const pf = passFailData || { passed, failed, total: totalResults, pass_rate: Math.round(passed / totalResults * 100) };
        if (passFailChartRef.current) {
          passFailInst.current?.destroy();
          passFailInst.current = new window.Chart(passFailChartRef.current, {
            type: "doughnut",
            data: {
              labels: ["Passed", "Failed"],
              datasets: [{
                data: [Number(pf.passed), Number(pf.failed)],
                backgroundColor: ["#0f6e56cc", "#a32d2dcc"],
                borderWidth: 0,
                hoverOffset: 6,
              }],
            },
            options: {
              responsive: true, maintainAspectRatio: false, cutout: "68%",
              plugins: {
                legend: { position: "bottom", labels: { font: { size: 11 }, color: TICK_COLOR, padding: 16 } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
              },
            },
          });
        }

        // Improvement trend — prefer real API progress data, fallback to aggregated improvement metrics.
        const progData = studentProgressData?.length >= 2
          ? {
              labels: studentProgressData.map((row) => row.period),
              data: studentProgressData.map((row) => parseFloat(row.avg_score)),
            }
          : improvementData
            ? {
                labels: ["Previous month", "Current month"],
                data: [parseFloat(improvementData.previous_month_avg).toFixed(1), parseFloat(improvementData.current_month_avg).toFixed(1)],
              }
            : null;

        if (progressChartRef.current && progData) {
          progressInst.current?.destroy();
          progressInst.current = new window.Chart(progressChartRef.current, {
            type: "line",
            data: {
              labels: progData.labels,
              datasets: [{
                label: "Avg score",
                data: progData.data,
                borderColor: ORANGE, backgroundColor: ORANGE + "18",
                tension: 0.4, pointRadius: 6, pointBackgroundColor: ORANGE, fill: true,
              }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
                y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 }, callback: (v) => `${v}%` } },
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
  }, [passFailData, improvementData, studentProgressData]);

  return (
    <div>

      {/* Pass/Fail summary + Score breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-orange-500 uppercase tracking-widest mb-3">Pass vs fail</div>
          <div className="flex gap-5 mb-3">
            {[
              { label: "Passed",    val: passed, color: "#0f6e56" },
              { label: "Failed",    val: failed, color: "#a32d2d" },
              { label: "Pass rate", val: passFailData ? `${Math.round((passFailData.pass_rate ?? (passed / totalResults * 100)))}%` : `${Math.round(passed / totalResults * 100)}%`, color: ORANGE },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-[11px] text-gray-400">{m.label}</div>
                <div className="text-[24px] font-semibold" style={{ color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1">
            <div className="h-full rounded-full" style={{ width: `${Math.round(passed / totalResults * 100)}%`, background: "#0f6e56" }} />
          </div>
          <div className="text-[11px] text-gray-400">{passed} passed · {failed} failed of {totalResults} exam results</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-orange-500 uppercase tracking-widest mb-3">Score breakdown</div>
          <div className="space-y-2">
            {scoreRows.map((r) => {
              const pct = Math.round((r.val / totalStudents) * 100);
              return (
                <div key={r.label} className="flex items-center gap-2">
                  <div className="w-40 text-[11px] text-gray-500 flex-shrink-0">{r.label}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
                  </div>
                  <div className="text-[11px] font-medium w-14 text-right" style={{ color: r.color }}>
                    {r.val} <span className="text-gray-400 font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[14px] font-medium text-gray-700 mb-3">Pass vs fail distribution</div>
          <div style={{ height: 220 }}><canvas ref={passFailChartRef} /></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[14px] font-medium text-gray-700 mb-1">Score progression</div>
          <div className="text-[12px] text-gray-400 mb-3">Month-over-month average</div>
          {(studentProgressData?.length >= 2 || improvementData)
            ? <div style={{ height: 200 }}><canvas ref={progressChartRef} /></div>
            : <div className="flex items-center justify-center h-[200px] text-[13px] text-gray-400">No live data yet.</div>}
        </div>
      </div>

      {/* Performance by program table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-medium text-orange-500 uppercase tracking-widest mb-3">
          Performance by program
          <span className="ml-2 text-gray-400 normal-case font-normal">(click a row to view students)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {["Program", "Students", "Avg score", "Pass rate", "Status"].map((h, i) => (
                  <th key={h} className={`text-[11px] font-medium text-gray-400 pb-2 px-2 border-b border-gray-100 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No student analytics available yet.
                </td>
              </tr>
            ) : (
              progStats.map((row) => (
                <tr key={row.p} onClick={() => onProgramClick(row.p)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-2"><ProgramTag program={row.p} /></td>
                  <td className="py-2.5 px-2 text-center text-gray-500">{row.count}</td>
                  <td className="py-2.5 px-2 text-center">
                    {row.avg != null ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={pillStyle(row.avg)}>
                        {row.avg}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.pr != null ? <PassRateBar value={row.pr} /> : <span className="text-[11px] text-gray-400">N/A</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center"><StatusBadge status={row.avg != null ? getStatus(row.avg) : "unknown"} /></td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Student Detail ─────────────────────────────────────────────────────────────
const StudentDetail = ({ student, studentIndex, onBack }) => {
  const trendRef = useRef(null);
  const trendInst = useRef(null);
  const av = AVATAR_PALETTE[studentIndex % AVATAR_PALETTE.length];

  useEffect(() => {
    const ensureChart = (cb) => {
      if (window.Chart) { cb(); return; }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload = cb;
      document.head.appendChild(s);
    };
    ensureChart(() => {
      setTimeout(() => {
        if (trendRef.current) {
          trendInst.current?.destroy();
          const trend = student.trend ?? [];
          trendInst.current = new window.Chart(trendRef.current, {
            type: "line",
            data: {
              labels: trend.map((_, i) => `Attempt ${i + 1}`),
              datasets: [{
                label: "Score",
                data: trend,
                borderColor: ORANGE, backgroundColor: ORANGE + "18",
                tension: 0.4, pointRadius: 5, pointBackgroundColor: ORANGE, fill: true,
              }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
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
    return () => { trendInst.current?.destroy(); trendInst.current = null; };
  }, [student]);

  const metrics = [
    { label: "Program",       val: student.program || "N/A", color: "#555" },
    { label: "Status",        val: student.status || (student.isActive ? "Active" : "Inactive") || "Unknown", color: student.isActive ? "#0f6e56" : "#a32d2d" },
    { label: "Email",         val: student.email || "N/A", color: "#555" },
    { label: "Remarks",       val: student.remarks || "None", color: "#555" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-[14px]"
          style={{ background: av.bg, color: av.fg, border: `1.5px solid ${av.fg}66` }}>
          {initials(`${student.firstName || ""} ${student.lastName || ""}`)}
        </div>
        <div>
          <div className="text-[16px] font-semibold text-gray-800">{`${student.firstName || ""} ${student.lastName || ""}`}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <ProgramTag program={student.program || "Unknown"} />
            <span className="text-[12px] text-gray-400">{student.email || "No email"}</span>
          </div>
        </div>
        <button onClick={onBack}
          className="ml-auto text-[12px] px-4 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors">
          ← Back to list
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {metrics.map((m) => (
          <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-[11px] text-gray-400 mb-1">{m.label}</div>
            <div className="text-[18px] font-semibold" style={{ color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {student.trend && student.trend.length > 0 ? (
        <>
          <div className="text-[11px] font-medium text-orange-500 uppercase tracking-widest mb-3">Score trend</div>
          <div style={{ height: 200 }}><canvas ref={trendRef} /></div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-[13px] text-gray-500">
          Trend data is not available for this student.
        </div>
      )}
    </div>
  );
};

// ── Student List Tab ───────────────────────────────────────────────────────────
const StudentsTab = ({ students, activeProgram, onProgramChange }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filtered = students.filter((s) => {
    const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
    const studentProgram = normalizeProgram(s.program || s.programName);
    const mp = activeProgram === "All" || studentProgram === activeProgram;
    const ms = !search.trim() || name.toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || (s.status || (s.isActive ? "Active" : "Inactive" )|| "").toLowerCase() === statusFilter;
    return mp && ms && mf;
  });

  if (selectedStudent) {
    return (
      <StudentDetail
        student={selectedStudent}
        studentIndex={students.indexOf(selectedStudent)}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
      {/*<div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-700 mb-4">
        <i className="bx bx-info-circle text-[15px] flex-shrink-0 mt-0.5"></i>
        <span>Student list uses <strong>mock data</strong> while <code className="bg-amber-100 px-1 rounded">/student-progress</code> is pending.</span>
      </div>*/}

      {/* Program filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROGRAMS.map((p) => (
          <button key={p} onClick={() => onProgramChange(p)}
            className={`text-[12px] font-medium px-3 py-1 rounded-full border transition-colors ${
              activeProgram === p
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Search + Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student..."
          className="text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-orange-400 w-full sm:w-[200px]"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="unknown">Unknown</option>
        </select>
        <span className="text-[12px] text-gray-400 ml-auto">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table (desktop) */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-gray-400">No students found.</div>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  {["Student", "Email", "Program", "Status", "Remarks"].map((h, i) => (
                    <th key={h} className={`text-[11px] font-medium text-gray-400 pb-2 px-2 border-b border-gray-100 whitespace-nowrap ${i <= 2 ? "text-left" : "text-center"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const av = AVATAR_PALETTE[students.indexOf(s) % AVATAR_PALETTE.length];
                  const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
                  return (
                    <tr key={s.userID || s.id} onClick={() => setSelectedStudent(s)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                            style={{ background: av.bg, color: av.fg, border: `1px solid ${av.fg}44` }}>
                            {initials(name)}
                          </div>
                          <span className="font-medium text-gray-700">{name || 'Unnamed student'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-gray-500">{s.email || '—'}</td>
                      <td className="py-2.5 px-2"><ProgramTag program={s.program || 'Unknown'} /></td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{s.status || (s.isActive ? 'Active' : 'Inactive') || 'Unknown'}</td>
                      <td className="py-2.5 px-2 text-center text-gray-500">{s.remarks || 'None'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((s) => {
              const av = AVATAR_PALETTE[students.indexOf(s) % AVATAR_PALETTE.length];
              const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
              return (
                <div key={s.userID || s.id} onClick={() => setSelectedStudent(s)}
                  className="border border-gray-200 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                      style={{ background: av.bg, color: av.fg, border: `1px solid ${av.fg}44` }}>
                      {initials(name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-gray-800">{name || 'Unnamed student'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ProgramTag program={s.program || 'Unknown'} />
                        <span className="text-[11px] text-gray-400">{s.status || (s.isActive ? 'Active' : 'Inactive') || 'Unknown'}</span>
                      </div>
                    </div>
                    <StatusBadge status={(s.status || (s.isActive ? 'Active' : 'Inactive') || 'Unknown').toLowerCase()} />
                  </div>
                  <div className="text-[12px] text-gray-500">
                    <div>{s.email || 'No email provided'}</div>
                    <div>{s.remarks ? `Remarks: ${s.remarks}` : 'No remarks'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminStudentEnhancement = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState("All");

  // Real API data
  const [summaryData, setSummaryData]             = useState(null);
  const [passFailData, setPassFailData]           = useState(null);
  const [improvementData, setImprovementData]     = useState(null);
  const [studentProgressData, setStudentProgressData] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
        const baseUrl = apiUrl?.replace(/\/$/, "") ?? "";

        const [summaryRes, pfRes, impRes, progressRes] = await Promise.all([
          fetch(`${baseUrl}/admin/analytics/summary`, { headers }),
          fetch(`${baseUrl}/admin/analytics/pass-fail-rate`, { headers }),
          fetch(`${baseUrl}/admin/analytics/improvement-percentage`, { headers }),
          fetch(`${baseUrl}/admin/analytics/student-progress`, { headers }),
        ]);

        if (summaryRes.ok) {
          const j = await summaryRes.json();
          setSummaryData(j.data ?? null);
        }
        if (pfRes.ok) {
          const j = await pfRes.json();
          setPassFailData(j.data ?? null);
        }
        if (impRes.ok) {
          const j = await impRes.json();
          setImprovementData(j.data ?? null);
        }
        if (progressRes.ok) {
          const j = await progressRes.json();
          setStudentProgressData(Array.isArray(j.data) ? j.data : []);
        }

        const usersRes = await fetch(`${baseUrl}/users?role=Student&limit=200&page=1`, { headers });
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          setStudents(Array.isArray(usersJson.users) ? usersJson.users : []);
          const backendTotal = Number(usersJson.total);
          setStudentCount(Number.isFinite(backendTotal) ? backendTotal : (Array.isArray(usersJson.users) ? usersJson.users.length : 0));
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [apiUrl]);

  // KPI values — prefer real API data, fallback to computed mock values.
  const total      = studentCount || students.length;
  const passRate   = passFailData
    ? Math.round(passFailData.pass_rate)
    : summaryData?.pass_rate != null
      ? Math.round(summaryData.pass_rate * 100)
      : 0;
  const avgScore   = summaryData?.average_score != null
    ? Number(summaryData.average_score).toFixed(1)
    : passFailData
      ? ((Number(passFailData.passed) / Number(passFailData.total)) * 100).toFixed(1)
      : "0.0";
  const improvement = improvementData?.improvement_percentage ?? summaryData?.improvement_percentage ?? 0;
  const trendLabel  = improvementData?.trend ?? (summaryData
    ? improvement > 0 ? "improving" : improvement < 0 ? "declining" : "stable"
    : "stable");

  const topPerformers = passFailData?.breakdown?.excellent ?? 0;
  const needSupport = (passFailData?.breakdown?.needs_improvement ?? 0) + (passFailData?.breakdown?.poor ?? 0);

  const kpis = [
    { label: "Total students",  val: total,                                                    color: ORANGE,     icon: "bx-group" },
    { label: "Avg. score",      val: `${avgScore}%`,                                           color: "#555",     icon: "bx-bar-chart-alt-2" },
    { label: "Pass rate",       val: `${passRate}%`,                                           color: "#0f6e56",  icon: "bx-check-circle" },
    { label: "Top performers",  val: `${topPerformers}`,                                       color: ORANGE,     icon: "bx-trophy" },
    { label: "Need support",    val: `${needSupport}`,                                        color: "#a32d2d",  icon: "bx-error-circle" },
    { label: "Improvement",     val: `${Number(improvement) > 0 ? "+" : ""}${improvement}%`,  color: "#534ab7",  icon: "bx-trending-up" },
  ];

  const handleProgramClick = (prog) => {
    setActiveProgram(prog);
    setActiveTab("students");
  };

  return (
    <div className="outfit-400 p-3 sm:p-6 min-h-screen pt-16 sm:pt-6 pb-28 sm:pb-6">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[16px] sm:text-[20px] font-semibold text-gray-800">
            Student enhancement analytics
          </h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Overall student performance and insights</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border ${
          trendLabel === "improving"
            ? "bg-green-50 text-green-600 border-green-200"
            : trendLabel === "declining"
            ? "bg-red-50 text-red-500 border-red-200"
            : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          <i className={`bx ${trendLabel === "improving" ? "bx-trending-up" : "bx-trending-down"} text-[14px]`}></i>
          {trendLabel.charAt(0).toUpperCase() + trendLabel.slice(1)}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {kpis.map((m) => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: m.color }} />
            <div className="flex items-center justify-between mb-1 mt-1">
              <div className="text-[11px] sm:text-[12px] text-gray-400">{m.label}</div>
              {m.mock && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">mock</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div className="text-[18px] sm:text-[22px] font-semibold" style={{ color: m.color }}>{m.val}</div>
              <i className={`bx ${m.icon} text-[18px] opacity-20`} style={{ color: m.color }}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "students"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && activeTab === "overview" && (
        <div className="flex items-center justify-center py-24">
          <span className="loader" />
        </div>
      )}

      {/* Overview */}
      {!loading && activeTab === "overview" && (
        <OverviewTab
          students={students}
          summaryData={summaryData}
          passFailData={passFailData}
          improvementData={improvementData}
          studentProgressData={studentProgressData}
          onProgramClick={handleProgramClick}
        />
      )}

      {/* Students */}
      {activeTab === "students" && (
        <StudentsTab
          students={students}
          activeProgram={activeProgram}
          onProgramChange={setActiveProgram}
        />
      )}
    </div>
  );
};

export default AdminStudentEnhancement;
