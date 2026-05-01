import { useEffect, useRef, useState } from "react";

const ORANGE = "#f57c20";
const GRID_COLOR = "rgba(0,0,0,0.06)";
const TICK_COLOR = "#9ca3af";

const ALL_PROGRAMS = ["BSCpE", "CE", "ECE", "EE"];

const PROGRAM_ID_MAP = { 1: "BSCpE", 2: "EE", 3: "CE", 4: "ECE", 5: "EE" };
//const PROGRAM_ID_MAP = { 1: "BSCpE", 2: "EE", 3: "CE", 4: "ECE" };

const PROGRAM_COLORS = {
  BSCpE: { bg: "#fff0e0", fg: "#c45e10", accent: "#f57c20" },
  CE:    { bg: "#e0f5ee", fg: "#0f6e56", accent: "#0f6e56" },
  ECE:   { bg: "#e6f1fb", fg: "#185fa5", accent: "#185fa5" },
  EE:    { bg: "#faeeda", fg: "#854f0b", accent: "#854f0b" },
};

const AVATAR_PALETTE = [
  { bg: "#fff0e0", fg: "#c45e10" }, { bg: "#e0f5ee", fg: "#0f6e56" },
  { bg: "#e6f1fb", fg: "#185fa5" }, { bg: "#faeeda", fg: "#854f0b" },
  { bg: "#f0f0f0", fg: "#5f5e5a" }, { bg: "#fcebeb", fg: "#a32d2d" },
  { bg: "#eeedfe", fg: "#534ab7" }, { bg: "#fbeaf0", fg: "#993556" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatus = (score) =>
  score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 75 ? "average" : "needs support";

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
  return program.toString().trim();
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    excellent:       { bg: "#fff0e0", fg: "#c45e10", label: "Excellent" },
    good:            { bg: "#e0f5ee", fg: "#0f6e56", label: "Good" },
    average:         { bg: "#f0f0f0", fg: "#5f5e5a", label: "Average" },
    "needs support": { bg: "#fcebeb", fg: "#a32d2d", label: "Needs support" },
  };
  const c = map[status] || map["needs support"];
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
      {c.label}
    </span>
  );
};

const ProgramTag = ({ program }) => {
  const label = normalizeProgram(program);
  const c = PROGRAM_COLORS[label] || { bg: "#f0f0f0", fg: "#555" };
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
      {label || program}
    </span>
  );
};

const PassRateBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: value >= 75 ? "#0f6e56" : ORANGE }} />
    </div>
    <span className="text-[12px] font-medium text-gray-600 w-8 text-right">{value}%</span>
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, val, color, icon, sub }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: color }} />
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-[22px] font-bold leading-none" style={{ color }}>{val}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ml-2"
        style={{ background: color + "15" }}>
        <i className={`bx ${icon} text-[18px]`} style={{ color }}></i>
      </div>
    </div>
  </div>
);

// ── Program Stats Card (for Dean overview) ────────────────────────────────────
const ProgramStatsCard = ({ program, students, onClick }) => {
  const c = PROGRAM_COLORS[program] || { bg: "#f0f0f0", fg: "#555", accent: "#555" };
  const scoreValues = students.map((s) => Number(s.score ?? s.average_score ?? 0));
  const avg = students.length
    ? parseFloat((scoreValues.reduce((a, v) => a + v, 0) / students.length).toFixed(1))
    : null;
  const passRate = students.length
    ? Math.round((scoreValues.filter((v) => v >= 75).length / students.length) * 100)
    : null;
  const status = avg != null ? getStatus(avg) : null;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-[13px]"
            style={{ background: c.bg, color: c.fg }}>
            {program.replace("BS", "").slice(0, 3)}
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-800">{program}</p>
            <p className="text-[12px] text-gray-400">{students.length} students</p>
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[11px] text-gray-400 mb-1">Avg. Score</p>
          {avg != null ? (
            <p className="text-[18px] font-bold" style={{ color: c.accent }}>{avg}%</p>
          ) : (
            <p className="text-[14px] text-gray-400">N/A</p>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[11px] text-gray-400 mb-1">Pass Rate</p>
          {passRate != null ? (
            <p className="text-[18px] font-bold" style={{ color: passRate >= 75 ? "#0f6e56" : "#a32d2d" }}>{passRate}%</p>
          ) : (
            <p className="text-[14px] text-gray-400">N/A</p>
          )}
        </div>
      </div>

      {passRate != null && <PassRateBar value={passRate} />}

      <div className="mt-3 flex items-center justify-end">
        <span className="text-[12px] font-medium text-orange-500 group-hover:text-orange-600 flex items-center gap-1">
          View students <i className="bx bx-chevron-right text-[16px]"></i>
        </span>
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
        if (trendRef.current && student.trend?.length) {
          trendInst.current?.destroy();
          trendInst.current = new window.Chart(trendRef.current, {
            type: "line",
            data: {
              labels: student.trend.map((_, i) => `Attempt ${i + 1}`),
              datasets: [{
                label: "Score",
                data: student.trend,
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

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <button onClick={onBack}
        className="mb-3 flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors">
        <i className="bx bx-arrow-back text-[15px]"></i> Back
      </button>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px]"
            style={{ background: av.bg, color: av.fg, border: `2px solid ${av.fg}33` }}>
            {initials(`${student.firstName || ""} ${student.lastName || ""}`)}
          </div>
          <div>
            <p className="text-[16px] font-bold text-gray-800">{`${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unnamed"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <ProgramTag program={student.program || "Unknown"} />
              <span className="text-[12px] text-gray-400">{student.email || "No email"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Program", val: student.program || "N/A" },
          { label: "Status", val: student.status || (student.isActive ? "Active" : "Inactive") || "Unknown" },
          { label: "Email", val: student.email || "N/A" },
          { label: "Remarks", val: student.remarks || "None" },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] text-gray-400 mb-1">{m.label}</p>
            <p className="text-[13px] font-semibold text-gray-700 truncate">{m.val}</p>
          </div>
        ))}
      </div>

      {student.trend?.length > 0 ? (
        <>
          <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Score trend</p>
          <div style={{ height: 200 }}><canvas ref={trendRef} /></div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-[13px] text-gray-400">
          <i className="bx bx-line-chart text-[28px] mb-2 block"></i>
          Trend data is not available for this student.
        </div>
      )}
    </div>
  );
};

// ── Student List ──────────────────────────────────────────────────────────────
const StudentList = ({ students, programLabel, onBack }) => {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  //console.log("first student:", students[0]);

  const filtered = students.filter((s) => {
    const name = `${s.firstName || ""} ${s.lastName || ""}`.trim().toLowerCase();
    const email = (s.email || "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || email.includes(q);
  }).sort((a, b) => {
    const nameA = `${a.firstName || ""}`.trim().toLowerCase();
    const nameB = `${b.firstName || ""}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        {onBack && (
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors flex-shrink-0">
            <i className="bx bx-arrow-back text-[15px]"></i> Back
          </button>
        )}
        <div className="flex-1">
          <p className="text-[16px] font-bold text-gray-800">{programLabel} Students</p>
          <p className="text-[12px] text-gray-400">{filtered.length} of {students.length} shown</p>
        </div>
        <div className="relative">
          <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-[15px]"></i>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="text-[13px] pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-orange-400 w-[160px]"
          />
        </div>
      </div>

      {/* Table desktop */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-gray-400">
          <i className="bx bx-user-x text-[36px] mb-2 block"></i>
          No students found.
        </div>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50">
                  {["Student", "Email", "Program", "Status", "Remarks"].map((h, i) => (
                    <th key={h} className={`text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-4 ${i === 0 ? "text-left" : "text-center"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const av = AVATAR_PALETTE[students.indexOf(s) % AVATAR_PALETTE.length];
                  const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
                  return (
                    <tr key={s.userID || s.id} onClick={() => setSelectedStudent(s)}
                      className="cursor-pointer hover:bg-orange-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: av.bg, color: av.fg }}>
                            {initials(name)}
                          </div>
                          <span className="font-medium text-gray-700">{name || "Unnamed"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-500">{s.email || "—"}</td>
                      <td className="py-3 px-4 text-center"><ProgramTag program={s.program || "Unknown"} /></td>
                      <td className="py-3 px-4 text-center text-gray-500 text-[12px]">{s.status || (s.isActive ? "Active" : "Inactive") || "—"}</td>
                      <td className="py-3 px-4 text-center text-gray-400 text-[12px]">{s.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col divide-y divide-gray-50 sm:hidden">
            {filtered.map((s) => {
              const av = AVATAR_PALETTE[students.indexOf(s) % AVATAR_PALETTE.length];
              const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
              return (
                <div key={s.userID || s.id} onClick={() => setSelectedStudent(s)}
                  className="px-4 py-3 cursor-pointer hover:bg-orange-50/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: av.bg, color: av.fg }}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{name || "Unnamed"}</p>
                      <p className="text-[11px] text-gray-400 truncate">{s.email || "No email"}</p>
                    </div>
                    <ProgramTag program={s.program || "Unknown"} />
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

// ── Charts Section ────────────────────────────────────────────────────────────
const ChartsSection = ({ passFailData, improvementData, studentProgressData }) => {
  const passFailChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const passFailInst = useRef(null);
  const progressInst = useRef(null);

  const totalResults = passFailData?.total ?? 0;
  const passed = passFailData?.passed ?? 0;
  const failed = passFailData?.failed ?? 0;

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
        if (passFailChartRef.current) {
          passFailInst.current?.destroy();
          passFailInst.current = new window.Chart(passFailChartRef.current, {
            type: "doughnut",
            data: {
              labels: ["Passed", "Failed"],
              datasets: [{ data: [Number(passed), Number(failed)], backgroundColor: ["#0f6e56cc", "#a32d2dcc"], borderWidth: 0, hoverOffset: 6 }],
            },
            options: {
              responsive: true, maintainAspectRatio: false, cutout: "70%",
              plugins: {
                legend: { position: "bottom", labels: { font: { size: 11 }, color: TICK_COLOR, padding: 16 } },
              },
            },
          });
        }
        const progData = studentProgressData?.length >= 2
          ? { labels: studentProgressData.map((r) => r.period), data: studentProgressData.map((r) => parseFloat(r.avg_score)) }
          : improvementData
            ? { labels: ["Previous month", "Current month"], data: [parseFloat(improvementData.previous_month_avg), parseFloat(improvementData.current_month_avg)] }
            : null;
        if (progressChartRef.current && progData) {
          progressInst.current?.destroy();
          progressInst.current = new window.Chart(progressChartRef.current, {
            type: "line",
            data: {
              labels: progData.labels,
              datasets: [{ label: "Avg score", data: progData.data, borderColor: ORANGE, backgroundColor: ORANGE + "18", tension: 0.4, pointRadius: 6, pointBackgroundColor: ORANGE, fill: true }],
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col items-center">
        <p className="text-[15px] font-bold text-gray-800 mb-4">Pass vs Fail</p>
        {/* SVG Semicircle Gauge */}
        <div className="relative" style={{ width: 200, height: 110 }}>
          <svg width="200" height="110" viewBox="0 0 200 110">
            {/* Background track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none" stroke="#f0f0f0" strokeWidth="14" strokeLinecap="round"
            />
            {/* Failed arc (red) - full background first */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none" stroke="#a32d2d" strokeWidth="14" strokeLinecap="round"
            />
            {/* Passed arc (green) - proportional fill */}
            {totalResults > 0 && (
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#0f6e56"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(passed / totalResults) * 251.2} 251.2`}
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-[32px] font-bold leading-none" style={{ color: "#0f6e56" }}>
              {totalResults > 0 ? Math.round((passed / totalResults) * 100) : 0}
              <span className="text-[18px]">%</span>
            </span>
          </div>
        </div>

        {/* Stats below */}
        <div className="flex items-center justify-between w-full mt-4 px-4">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0f6e56]"></div>
              <span className="text-[22px] font-bold text-gray-800">{passed}</span>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Passed</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#a32d2d]"></div>
              <span className="text-[22px] font-bold text-gray-800">{failed}</span>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Failed</span>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-[13px] font-semibold text-gray-700 mb-1">Score Progression</p>
        <p className="text-[11px] text-gray-400 mb-4">Month-over-month average</p>
        {(studentProgressData?.length >= 2 || improvementData)
          ? <div style={{ height: 200 }}><canvas ref={progressChartRef} /></div>
          : <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 gap-2"><i className="bx bx-line-chart text-[32px]"></i><p className="text-[13px]">No data yet.</p></div>}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminStudentEnhancement = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // "overview" | "program:{name}" | "students:{name}"

  const [summaryData, setSummaryData] = useState(null);
  const [passFailData, setPassFailData] = useState(null);
  const [improvementData, setImprovementData] = useState(null);
  const [studentProgressData, setStudentProgressData] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    setCurrentUser(user);
    //console.log("currentUser full:", JSON.stringify(user, null, 2));
  }, []);

  

  const currentRoleId = Number(currentUser?.roleID ?? currentUser?.roleId ?? 0);
  const isDeanOrAssocDean = [4, 5].includes(currentRoleId);
  const isProgramChair = currentRoleId === 3;
  const currentProgramId = Number(currentUser?.programID ?? currentUser?.program?.programID ?? 0);
  const myProgram = PROGRAM_ID_MAP[currentProgramId] ?? null;

  // Students visible to this user
  const visibleStudents = isDeanOrAssocDean
    ? students
    : isProgramChair
      ? students.filter((s) => Number(s.programID ?? s.program?.programID ?? 0) === currentProgramId)
      : students;

  // Programs visible to this user
  const visiblePrograms = isDeanOrAssocDean
    ? ALL_PROGRAMS
    : isProgramChair && myProgram
      ? [myProgram]
      : ALL_PROGRAMS;

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

        if (summaryRes.ok) { const j = await summaryRes.json(); setSummaryData(j.data ?? null); }
        if (pfRes.ok) { const j = await pfRes.json(); setPassFailData(j.data ?? null); }
        if (impRes.ok) { const j = await impRes.json(); setImprovementData(j.data ?? null); }
        if (progressRes.ok) { const j = await progressRes.json(); setStudentProgressData(Array.isArray(j.data) ? j.data : []); }

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

  // KPI values
  const total = isProgramChair ? visibleStudents.length : (studentCount || students.length);
  const passRate = passFailData ? Math.round(passFailData.pass_rate) : 0;
  const avgScore = summaryData?.average_score != null ? Number(summaryData.average_score).toFixed(1) : "0.0";
  const improvement = improvementData?.improvement_percentage ?? summaryData?.improvement_percentage ?? 0;
  const trendLabel = improvementData?.trend ?? (improvement > 0 ? "improving" : improvement < 0 ? "declining" : "stable");
  const topPerformers = passFailData?.breakdown?.excellent ?? 0;
  const needSupport = (passFailData?.breakdown?.needs_improvement ?? 0) + (passFailData?.breakdown?.poor ?? 0);

  const exc  = passFailData?.breakdown?.excellent ?? 0;
  const good = passFailData?.breakdown?.good ?? 0;
  const ni   = passFailData?.breakdown?.needs_improvement ?? 0;
  const poor = passFailData?.breakdown?.poor ?? 0;
  const totalForBreakdown = summaryData?.total_students ?? visibleStudents.length;

  // Parse view state
  const viewingProgramStudents = view.startsWith("students:");
  const viewingProgramName = viewingProgramStudents ? view.replace("students:", "") : null;
  const studentsForProgram = viewingProgramName
    ? visibleStudents.filter((s) => normalizeProgram(s.program || s.programName) === viewingProgramName)
    : [];

  const roleLabel = isDeanOrAssocDean
    ? (currentRoleId === 4 ? "Dean" : "Associate Dean")
    : isProgramChair
      ? `Program Chair — ${myProgram || ""}`
      : "";

  return (
    <div className="outfit-400 p-3 sm:p-5 min-h-screen pt-16 sm:pt-5 pb-28 sm:pb-6 bg-gray-50/50">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[18px] sm:text-[22px] font-bold text-gray-800">
              {isProgramChair && myProgram ? "" : "Student Enhancement Analytics"}
            </h1>
            {roleLabel && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[20px] font-semibold text-orange-600">
                <i className="bx bx-badge-check text-[25px]"></i> {roleLabel}
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-400">
            {isProgramChair
              ? `Showing performance data for your program`
              : "Overall student performance across all programs"}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
          trendLabel === "improving" ? "bg-green-50 text-green-600 border-green-200"
          : trendLabel === "declining" ? "bg-red-50 text-red-500 border-red-200"
          : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          <i className={`bx ${trendLabel === "improving" ? "bx-trending-up" : trendLabel === "declining" ? "bx-trending-down" : "bx-minus"} text-[14px]`}></i>
          {trendLabel.charAt(0).toUpperCase() + trendLabel.slice(1)}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <span className="loader" />
        </div>
      )}

      {!loading && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <KpiCard label="Total Students" val={total} color={ORANGE} icon="bx-group" />
            <KpiCard label="Avg. Score" val={`${avgScore}%`} color="#555" icon="bx-discount" />
            <KpiCard label="Pass Rate" val={`${passRate}%`} color="#0f6e56" icon="bx-check-circle" />
            <KpiCard label="Top Performers" val={`${topPerformers}`} color={ORANGE} icon="bx-trophy" />
            <KpiCard label="Need Support" val={`${needSupport}`} color="#a32d2d" icon="bx-people-handshake" />
            <KpiCard label="Improvement" val={`${Number(improvement) > 0 ? "+" : ""}${improvement}%`} color="#534ab7" icon="bx-trending-up" />
          </div>

          {/* ── PROGRAM CHAIR VIEW: single program ── */}
          {isProgramChair && myProgram && (
            <div className="space-y-4">
              {/* Program banner */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  {(() => {
                    const c = PROGRAM_COLORS[myProgram] || { bg: "#f0f0f0", fg: "#555", accent: "#555" };
                    const scores = visibleStudents.map((s) => Number(s.score ?? s.average_score ?? 0));
                    const avg = visibleStudents.length ? (scores.reduce((a, v) => a + v, 0) / visibleStudents.length).toFixed(1) : null;
                    const pr = visibleStudents.length ? Math.round((scores.filter((v) => v >= 75).length / visibleStudents.length) * 100) : null;
                    return (
                      <>
                        <i className="bx bx-school text-[28px]"></i>
                        <div className="flex-1">
                          <p className="text-[20px] font-bold text-gray-800">{myProgram}</p>
                          <p className="text-[13px] text-gray-400">{visibleStudents.length} enrolled students</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-[22px] font-bold" style={{ color: c.accent }}>{avg ?? "—"}%</p>
                            <p className="text-[11px] text-gray-400">Avg Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[22px] font-bold" style={{ color: pr >= 75 ? "#0f6e56" : "#a32d2d" }}>{pr ?? "—"}%</p>
                            <p className="text-[11px] text-gray-400">Pass Rate</p>
                          </div>
                          {pr != null && <StatusBadge status={getStatus(avg)} />}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Charts */}
              <ChartsSection passFailData={passFailData} improvementData={improvementData} studentProgressData={studentProgressData} />

              {/* Score breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[13px] font-semibold text-gray-700 mb-4">Score Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: "Excellent (≥ 80%)", val: exc, color: "#c45e10" },
                    { label: "Good (60–79%)", val: good, color: "#0f6e56" },
                    { label: "Needs improvement (40–59%)", val: ni, color: "#854f0b" },
                    { label: "Poor (< 40%)", val: poor, color: "#a32d2d" },
                  ].map((r) => {
                    const pct = totalForBreakdown ? Math.round((r.val / totalForBreakdown) * 100) : 0;
                    return (
                      <div key={r.label} className="flex items-center gap-3">
                        <div className="w-44 text-[12px] text-gray-500 flex-shrink-0">{r.label}</div>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
                        </div>
                        <div className="text-[12px] font-semibold w-16 text-right" style={{ color: r.color }}>
                          {r.val} <span className="text-gray-400 font-normal">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student list */}
              <StudentList students={visibleStudents} programLabel={myProgram} onBack={null} />
              
            </div>
          )}

          {/* ── DEAN / ASSOC DEAN VIEW ── */}
          {isDeanOrAssocDean && (
            <>
              {/* Showing student list for a specific program */}
              {viewingProgramStudents && (
                <StudentList
                  students={studentsForProgram}
                  programLabel={viewingProgramName}
                  onBack={() => setView("overview")}
                  
                />
              )}

              {/* Overview */}
              {!viewingProgramStudents && (
                <div className="space-y-4">
                  {/* Charts + breakdown */}
                 
                  <ChartsSection passFailData={passFailData} improvementData={improvementData} studentProgressData={studentProgressData} />
        

                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <p className="text-[13px] font-semibold text-gray-700 mb-4">Score Breakdown</p>
                      <div className="space-y-3">
                        {[
                          { label: "Excellent (≥ 80%)", val: exc, color: "#c45e10" },
                          { label: "Good (60–79%)", val: good, color: "#0f6e56" },
                          { label: "Needs improvement", val: ni, color: "#854f0b" },
                          { label: "Poor (< 40%)", val: poor, color: "#a32d2d" },
                        ].map((r) => {
                          const pct = totalForBreakdown ? Math.round((r.val / totalForBreakdown) * 100) : 0;
                          return (
                            <div key={r.label}>
                              <div className="flex justify-between text-[12px] mb-1">
                                <span className="text-gray-500">{r.label}</span>
                                <span className="font-semibold" style={{ color: r.color }}>{r.val} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  {/* Performance by program table */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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
                          {visibleStudents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-400">
                                No student analytics available yet.
                              </td>
                            </tr>
                          ) : (
                            visiblePrograms.map((prog) => {
                              const list = visibleStudents.filter((s) => normalizeProgram(s.program || s.programName) === prog);
                              const scoreValues = list.map((s) => Number(s.score ?? s.average_score ?? 0));
                              const avg = list.length ? parseFloat((scoreValues.reduce((a, v) => a + v, 0) / list.length).toFixed(1)) : null;
                              const pr = list.length ? Math.round((scoreValues.filter((v) => v >= 75).length / list.length) * 100) : null;
                              return (
                                <tr key={prog} onClick={() => setView(`students:${prog}`)}
                                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <td className="py-2.5 px-2"><ProgramTag program={prog} /></td>
                                  <td className="py-2.5 px-2 text-center text-gray-500">{list.length}</td>
                                  <td className="py-2.5 px-2 text-center">
                                    {avg != null ? (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={pillStyle(avg)}>{avg}%</span>
                                    ) : (
                                      <span className="text-[11px] text-gray-400">N/A</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    {pr != null ? <PassRateBar value={pr} /> : <span className="text-[11px] text-gray-400">N/A</span>}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <StatusBadge status={avg != null ? getStatus(avg) : "needs support"} />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
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

export default AdminStudentEnhancement;
