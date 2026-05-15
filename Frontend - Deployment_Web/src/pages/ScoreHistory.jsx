import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
};

const getBand = (pct) => {
  if (pct >= 80) return { label: "Excellent", color: "#10b981", bg: "#ecfdf5", text: "#065f46" };
  if (pct >= 60) return { label: "Good",      color: "#3b82f6", bg: "#eff6ff", text: "#1e40af" };
  if (pct >= 41) return { label: "Needs Work", color: "#f59e0b", bg: "#fffbeb", text: "#92400e" };
  return              { label: "Poor",       color: "#ef4444", bg: "#fef2f2", text: "#991b1b" };
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color, width = 80, height = 32 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((v - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ display: "block" }}>
      <path d={`M ${pts.join(" L ")} L ${width},${height} L 0,${height} Z`} fill={color} opacity="0.1" />
      <path d={`M ${pts.join(" L ")}`} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Trend Chart ──────────────────────────────────────────────────────────────
const TrendChart = ({ months, avgs }) => {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 220 });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: 220 });
    });
    ro.observe(containerRef.current);
    setDims({ w: containerRef.current.offsetWidth, h: 220 });
    return () => ro.disconnect();
  }, []);

  if (!months.length) return null;
  const { w, h } = dims;
  const pad = { t: 16, r: 24, b: 36, l: 48 };
  const iW = w - pad.l - pad.r, iH = h - pad.t - pad.b;
  const rawMin = Math.min(...avgs), rawMax = Math.max(...avgs);
  const slack = Math.max((rawMax - rawMin) * 0.25, 6);
  const min = Math.max(0, Math.floor(rawMin - slack));
  const max = Math.min(100, Math.max(Math.ceil(rawMax + slack), 80)); // always go up to at least 80
  const range = max - min || 1;
  const xOf = (i) => pad.l + (i / Math.max(months.length - 1, 1)) * iW;
  const yOf = (v) => pad.t + iH - ((v - min) / range) * iH;
  const cubicPath = () => {
    if (avgs.length < 2) return `M ${xOf(0)} ${yOf(avgs[0])}`;
    let d = `M ${xOf(0)} ${yOf(avgs[0])}`;
    for (let i = 1; i < avgs.length; i++) {
      const cpX = (xOf(i) + xOf(i - 1)) / 2;
      d += ` C ${cpX} ${yOf(avgs[i - 1])}, ${cpX} ${yOf(avgs[i])}, ${xOf(i)} ${yOf(avgs[i])}`;
    }
    return d;
  };
  const linePath = cubicPath();
  const areaPath = `${linePath} L ${xOf(avgs.length - 1)} ${yOf(min)} L ${xOf(0)} ${yOf(min)} Z`;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(min + (i / 4) * (max - min)));
  //const show75 = 75 >= min && 75 <= max;
  const show75 = true;

  return (
    <div ref={containerRef} style={{ width: "100%", height: h, position: "relative" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chart-clip">
            <rect x={pad.l} y={pad.t} width={iW} height={iH} />
          </clipPath>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + iW} y1={yOf(t)} y2={yOf(t)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={pad.l - 10} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#9ca3af" fontFamily="'DM Sans', sans-serif">{t}%</text>
          </g>
        ))}
        {show75 && (
          <>
            <line x1={pad.l} x2={pad.l + iW} y1={yOf(75)} y2={yOf(75)} stroke="#10b981" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.55" />
            <text x={pad.l + iW + 6} y={yOf(75) + 4} fontSize="9.5" fill="#10b981" fontFamily="'DM Sans', sans-serif" opacity="0.8">75%</text>
          </>
        )}
        <line x1={pad.l} x2={pad.l + iW} y1={pad.t + iH} y2={pad.t + iH} stroke="#f3f4f6" strokeWidth="1" />
        <path d={areaPath} fill="url(#area-grad)" clipPath="url(#chart-clip)" />
        <path d={linePath} stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {months.map((m, i) => (
          <text key={i} x={xOf(i)} y={pad.t + iH + 22} textAnchor="middle" fontSize="10.5" fill="#9ca3af" fontFamily="'DM Sans', sans-serif">{m}</text>
        ))}
        {avgs.map((v, i) => {
          const cx = xOf(i), cy = yOf(v);
          const isHov = hovered === i;
          const tipW = 56, tipH = 30;
          const tipX = Math.min(Math.max(cx - tipW / 2, pad.l), pad.l + iW - tipW);
          const tipY = cy - tipH - 12;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
              <circle cx={cx} cy={cy} r={18} fill="transparent" />
              {isHov && <line x1={cx} x2={cx} y1={pad.t} y2={pad.t + iH} stroke="#f97316" strokeWidth="1" strokeDasharray="4,3" opacity="0.3" />}
              {isHov && <circle cx={cx} cy={cy} r={9} fill="rgba(249,115,22,0.08)" />}
              <circle cx={cx} cy={cy} r={isHov ? 5.5 : 4} fill={isHov ? "#f97316" : "#fff"} stroke="#f97316" strokeWidth={isHov ? 0 : 2} style={{ transition: "r 0.15s, fill 0.15s" }} />
              {isHov && (
                <g>
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7" fill="#111827" />
                  <polygon points={`${cx - 5},${tipY + tipH} ${cx + 5},${tipY + tipH} ${cx},${tipY + tipH + 6}`} fill="#111827" />
                  <text x={tipX + tipW / 2} y={tipY + 11} textAnchor="middle" fontSize="9.5" fill="#6b7280" fontFamily="'DM Sans', sans-serif">{months[i]}</text>
                  <text x={tipX + tipW / 2} y={tipY + 23} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#fff" fontFamily="'DM Sans', sans-serif">{v}%</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Score Pill ───────────────────────────────────────────────────────────────
const ScorePill = ({ score }) => {
  const band = getBand(score ?? 0);
  return (
    <span style={{ background: band.bg, color: band.text }} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold">
      {score != null ? `${score}%` : "—"}
    </span>
  );
};

// ─── Status Chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ passed }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${passed ? "bg-emerald-500" : "bg-red-500"}`} />
    {passed ? "Passed" : "Failed"}
  </span>
);

// ─── Band Badge ───────────────────────────────────────────────────────────────
const BandBadge = ({ pct }) => {
  const band = getBand(pct);
  return (
    <span style={{ background: band.bg, color: band.text, border: `1px solid ${band.color}22` }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold">
      {band.label}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accentColor, sparkData, icon, delay = 0 }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s, translate 0.2s" }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
          <p className="mb-1 text-[30px] font-bold leading-none tracking-tight text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
          {sub && <p className="text-[11.5px] tracking-tight text-gray-400">{sub}</p>}
        </div>
        {icon ? (
          <div className="shrink-0 self-center flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: accentColor + "15" }}>
            <i className={`${icon} text-[20px]`} style={{ color: accentColor }} />
          </div>
        ) : sparkData?.length >= 2 ? (
          <div className="shrink-0 self-center pt-1.5">
            <Sparkline data={sparkData} color={accentColor} width={72} height={30} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = ({ h = 80, radius = 12 }) => (
  <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" style={{ height: h, borderRadius: radius }} />
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ message, height = 160 }) => (
  <div className="flex flex-col items-center justify-center gap-3" style={{ height }}>
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
      <i className="bx bx-inbox text-[20px] text-gray-300" />
    </div>
    <p className="max-w-[240px] text-center text-[12.5px] leading-relaxed text-gray-400">{message}</p>
  </div>
);

// ─── Activity Item ────────────────────────────────────────────────────────────
const ActivityItem = ({ item, index }) => {
  const [vis, setVis] = useState(false);
  const band = getBand(item.percentage ?? 0);
  const isQuiz = item.assessment_type === "quiz";

  useEffect(() => {
    const t = setTimeout(() => setVis(true), index * 40 + 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className="group flex items-start gap-3.5 rounded-xl border border-transparent p-3 transition-all hover:border-gray-100 hover:bg-gray-50/80"
      style={{ opacity: vis ? 1 : 0, transform: vis ? "translateX(0)" : "translateX(-8px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}
    >
      {/* icon */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
        style={{ background: band.bg, border: `1px solid ${band.color}20` }}>
        <i className={`bx ${isQuiz ? "bx-pencil" : "bx-book-open"} text-[15px]`} style={{ color: band.color }} />
      </div>

      {/* content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-gray-800 leading-snug">{item.subject_name || (isQuiz ? "Quiz" : "Practice Exam")}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 capitalize">{item.assessment_type || "exam"}</span>
              <BandBadge pct={item.percentage ?? 0} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[14px] font-bold" style={{ color: band.color }}>{item.percentage != null ? `${Math.round(item.percentage)}%` : "—"}</span>
            <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(item.date)}</p>
          </div>
        </div>
        {/* mini progress */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percentage ?? 0}%`, background: band.color, opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
};

// ─── Rank Widget ──────────────────────────────────────────────────────────────
const RankWidget = ({ rank, total, percentile, label }) => {
  if (!rank) return null;
  const pct = percentile ?? (total ? Math.round((1 - (rank - 1) / total) * 100) : 0);
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa88)" }} />
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label || "Your Ranking"}</p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <span className="text-[32px] font-bold leading-none text-gray-900">{medals[rank] || `#${rank}`}</span>
          {!medals[rank] && <span className="text-[10px] text-gray-400">rank</span>}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Percentile</span>
            <span className="font-semibold text-violet-600">{pct}th</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-violet-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10.5px] text-gray-400">{rank} of {total} students</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main ScoreHistory Component ──────────────────────────────────────────────
const ScoreHistory = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // ── Existing state ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // ── New state ────────────────────────────────────────────────────────────
  const [chartFilter, setChartFilter] = useState("all"); // "all" | "practice" | "quiz"
  const [activeTab, setActiveTab] = useState("history"); // "history" | "activity" | "analytics"
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    assessment_type: "",
    subject_id: "",
    date_from: "",
    date_to: "",
    performance_band: "",
  });
  const [rankLabel, setRankLabel] = useState("Global Rank");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterResults, setFilterResults] = useState(null);
  const [filterResultsLoading, setFilterResultsLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all"); // "all" | "quiz" | "practice"

  // ── Load practice history (existing endpoint) ────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${apiUrl}/practice-exam/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.history || [];
          const normalized = raw.map((item, i) => ({
            ...item,
            score: Math.round(item.percentage ?? 0),
            passed: (item.percentage ?? 0) >= 75,
            completedAt: item.created_at,
            attemptNumber: i + 1,
          }));
          setHistory(normalized);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  // ── Load analytics (new endpoint) ───────────────────────────────────────
  const loadAnalytics = useCallback(async (filters = {}) => {
    setAnalyticsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      //const res = await fetch(`${apiUrl}/api/v1/student/analytics?${params}`, {
      const res = await fetch(`${apiUrl}/v1/student/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json.data ?? null);
        // Update rank label based on applied filters
        if (filters.subject_id) setRankLabel(`Rank in Subject ${filters.subject_id}`);
        else if (filters.program_id) setRankLabel(`Rank in Program ${filters.program_id}`);
        else setRankLabel("Global Rank");
      } else {
        setAnalyticsData(null);
      }
    } catch (e) {
      console.error(e);
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (activeTab === "history" || activeTab === "activity") loadAnalytics(analyticsFilters);
  }, [activeTab]);

  // ── Apply filters to analytics ─────────────────────────────────
  const applyFilterSearch = async () => {
    setFilterResultsLoading(true);
    setFilterModalOpen(false);
    try {
      const token = sessionStorage.getItem("token");
      const params = new URLSearchParams();
      Object.entries(analyticsFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`${apiUrl}/v1/student/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setFilterResults(json.data ?? null);
      } else {
        setFilterResults(null);
      }
    } catch (e) {
      console.error(e);
      setFilterResults(null);
    } finally {
      setFilterResultsLoading(false);
    }
  };

  // ── Derived history data ─────────────────────────────────────────────────
  const chronological = [...history].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const withScores = chronological.filter((h) => h.score != null);
  const sorted = [...history].sort((a, b) =>
    sortDir === "desc" ? new Date(b.completedAt) - new Date(a.completedAt) : new Date(a.completedAt) - new Date(b.completedAt)
  );
  const filtered = filter === "all" ? sorted : filter === "pass" ? sorted.filter((h) => h.passed) : sorted.filter((h) => !h.passed);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const half = Math.ceil(withScores.length / 2);
  const baseline = withScores.length >= 2 ? Math.round(withScores.slice(0, half).reduce((s, h) => s + h.score, 0) / half) : null;
  const current = withScores.length >= 2 ? Math.round(withScores.slice(-half).reduce((s, h) => s + h.score, 0) / half) : null;
  const improvement = baseline && current && baseline > 0 ? Math.round(((current - baseline) / baseline) * 100) : null;

  const impStyle = improvement == null ? { icon: "bx bx-minus-circle", color: "#9ca3af" }
    : improvement >= 20 ? { icon: "bx bx-rocket", color: "#a855f7" }
    : improvement > 0 ? { icon: "bx bx-trending-up", color: "#10b981" }
    : improvement === 0 ? { icon: "bx bx-minus-circle", color: "#9ca3af" }
    : { icon: "bx bx-trending-down", color: "#ef4444" };

  const avgScore = withScores.length ? Math.round(withScores.reduce((s, h) => s + h.score, 0) / withScores.length) : null;
  const passCount = history.filter((h) => h.passed).length;
  const passRate = history.length ? Math.round((passCount / history.length) * 100) : null;
  const bestScore = withScores.length ? Math.max(...withScores.map((h) => h.score)) : null;

  const passRateStyle = passRate == null ? { icon: "bx bx-help-circle", color: "#9ca3af" }
    : passRate >= 80 ? { icon: "bx bx-trophy", color: "#10b981" }
    : passRate >= 60 ? { icon: "bx bx-check-shield", color: "#10b981" }
    : passRate >= 40 ? { icon: "bx bx-error-circle", color: "#f59e0b" }
    : { icon: "bx bx-shield", color: "#ef4444" };

  const monthMap = {};
  chronological.forEach((h) => {
    const key = new Date(h.completedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 };
    monthMap[key].total += h.score ?? 0;
    monthMap[key].count += 1;
  });
  const monthLabels = Object.keys(monthMap);
  const monthAvgs = monthLabels.map((k) => Math.round(monthMap[k].total / monthMap[k].count));
  const recentScores = withScores.slice(-12).map((h) => h.score);
  const EMPTY = history.length === 0 && !loading;
  const fmtImp = improvement != null ? `${improvement > 0 ? "+" : ""}${improvement}%` : "—";

  // ── Recent activity derived (from progression in analytics or history) ───
  const recentActivity = (() => {
    // Prefer analytics progression if loaded, fallback to history
    if (analyticsData?.progression?.length) {
      return [...analyticsData.progression]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
        .map((p, i) => ({
          id: i,
          date: p.date,
          percentage: p.percentage,
          assessment_type: p.assessment_type,
          points_earned: p.points_earned,
        }));
    }
    return [...sorted]
      .slice(0, 20)
      .map((h, i) => ({
        id: h.resultID ?? i,
        date: h.completedAt,
        percentage: h.score,
        assessment_type: h.assessment_type || h.type || "practice",
        subject_name: h.subjectName || h.subject_name,
        points_earned: h.earnedPoints || h.points_earned,
      }));
  })();

  const filteredActivity = activityFilter === "all" ? recentActivity
    : recentActivity.filter((a) => a.assessment_type === activityFilter);

  // ── Pagination ───────────────────────────────────────────────────────────
  const buildPages = () => {
    if (totalPages <= 1) return [];
    const pages = [];
    const range = (s, e) => { for (let i = s; i <= e; i++) pages.push(i); };
    if (totalPages <= 7) range(1, totalPages);
    else if (page <= 4) { range(1, 5); pages.push("…"); pages.push(totalPages); }
    else if (page >= totalPages - 3) { pages.push(1); pages.push("…"); range(totalPages - 4, totalPages); }
    else { pages.push(1); pages.push("…"); range(page - 1, page + 1); pages.push("…"); pages.push(totalPages); }
    return pages;
  };

  // ── Analytics from API data ──────────────────────────────────────────────
  const ad = analyticsData;
  const progMonthMap = {};
  (ad?.progression || []).forEach((p) => {
    const key = new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!progMonthMap[key]) progMonthMap[key] = { total: 0, count: 0 };
    progMonthMap[key].total += p.percentage ?? 0;
    progMonthMap[key].count += 1;
  });
  const progLabels = Object.keys(progMonthMap);
  const progAvgs = progLabels.map((k) => Math.round(progMonthMap[k].total / progMonthMap[k].count));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative mt-8 min-h-screen bg-[#f9fafb] pb-16 lg:mt-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-5 py-3 shadow-sm">
        <div className="mx-auto flex h-14 max-w-full items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-sm shadow-orange-200">
              <i className="bx bx-trending-up text-[17px] text-white" />
            </div>
            <div>
              <p className="text-[16px] font-bold leading-tight text-gray-900 tracking-tight">My Achievements</p>
              <p className="text-[13px] leading-none text-gray-400">Performance & activity overview</p>
            </div>
          </div>
          {!loading && history.length > 0 && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[13px] font-semibold text-gray-500">
              {history.length} attempt{history.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <div className="mx-auto max-w-full pt-1 pb-0.5">
          <div className="flex gap-0">
            {[
              { id: "history",   label: "Score History",    icon: "bx bx-history" },
              { id: "activity",  label: "Recent Activity",  icon: "bx bx-pulse" },
              
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-[12.5px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <i className={`${tab.icon} text-[14px]`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 pb-20 md:px-6">

        {/* ══════════════════════════════════════════════════════════════
            TAB: SCORE HISTORY (existing + enhanced)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-4">

            
            {/* KPI Cards */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-gray-400">Your overall performance summary</p>
              <button
                onClick={() => setFilterModalOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 shadow-sm transition hover:border-orange-400 hover:text-orange-500"
              >
                <i className="bx bx-filter-alt text-[14px]" />
                Filter Analytics
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {loading ? (
                [...Array(4)].map((_, i) => <Shimmer key={i} h={104} radius={16} />)
              ) : (
                <>
                  <KpiCard label="Total Exams" value={history.length} sub="All attempts recorded" accentColor="#f97316" sparkData={recentScores} delay={0} />

                  <KpiCard label="Average Score" value={avgScore != null ? `${avgScore}%` : "—"} sub={bestScore != null ? `Best: ${bestScore}%` : "No data yet"} accentColor="#3b82f6" sparkData={recentScores} delay={60} />

                  <KpiCard label="Pass Rate" value={passRate != null ? `${passRate}%` : "—"} sub={`${passCount} of ${history.length} passed`} accentColor={passRateStyle.color} icon={passRateStyle.icon} delay={120} />

                  <KpiCard label="Improvement" value={fmtImp} sub={improvement != null ? (improvement >= 0 ? "Trending upward" : "Keep pushing") : "Need more data"} accentColor={impStyle.color} icon={impStyle.icon} delay={180} />

                  <KpiCard label="Global Rank" value={ad?.rank_status?.rank ? `#${ad.rank_status.rank}` : "—"} sub={ad?.rank_status?.total_candidates ? `of ${ad.rank_status.total_candidates} students` : "No rank yet"} accentColor="#8b5cf6" icon="bx bx-trophy" delay={240} />

                  <KpiCard label="Points Earned" value={ad?.summary?.total_earned_points ?? "—"} sub="Total across all exams" accentColor="#f59e0b" icon="bx bx-coin" delay={300} />
                </>
              )}
            </div>

            {/* Filter Results Modal */}
            {(filterResultsLoading || filterResults) && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }}
                onClick={(e) => { if (e.target === e.currentTarget) { setFilterResults(null); setAnalyticsFilters({ assessment_type: "", subject_id: "", date_from: "", date_to: "", performance_band: "" }); } }}
              >
                <div
                  className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                  style={{ animation: "scaleIn 0.2s ease" }}
                >
                  {/* Results Header */}
                  <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/60 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                        <i className="bx bx-bar-chart text-[15px] text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">Filter Results</p>
                        <p className="text-[11px] text-gray-400">
                          {[
                            analyticsFilters.assessment_type && `Type: ${analyticsFilters.assessment_type}`,
                            analyticsFilters.date_from && `From: ${analyticsFilters.date_from}`,
                            analyticsFilters.date_to && `To: ${analyticsFilters.date_to}`,
                            analyticsFilters.performance_band && `Band: ${analyticsFilters.performance_band}`,
                          ].filter(Boolean).join(" · ") || "All records"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setFilterResults(null); setAnalyticsFilters({ assessment_type: "", subject_id: "", date_from: "", date_to: "", performance_band: "" }); }}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-red-300 hover:text-red-400"
                    >
                      <i className="bx bx-x text-[18px]" />
                    </button>
                  </div>

                  {/* Results Body */}
                  <div className="p-6">
                    {filterResultsLoading ? (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Shimmer key={i} h={104} radius={16} />)}
                      </div>
                    ) : !filterResults ? (
                      <EmptyState message="No data found for these filters. Try adjusting them." height={140} />
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                        <KpiCard label="Total Exams"   value={filterResults.summary.total_exams}                    sub="In selected period"          accentColor="#f97316" delay={0}   />

                        <KpiCard label="Average Score" value={`${filterResults.summary.average_score_percentage}%`} sub={`Best: ${bestScore ?? "—"}%`} accentColor="#3b82f6" delay={60}  />

                        <KpiCard label="Pass Rate"     value={`${filterResults.summary.pass_rate}%`}                sub="Based on 75% threshold"      accentColor="#10b981"  delay={120} />

                        <KpiCard label="Points Earned" value={filterResults.summary.total_earned_points}             sub="Total across filtered exams"  accentColor="#8b5cf6"  delay={180} />

                      </div>
                    )}
                  </div>

                  {/* Results Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                    <p className="text-[11.5px] text-gray-400">Click outside or close to dismiss</p>
                    <button
                      onClick={() => { setFilterResults(null); setFilterModalOpen(true); }}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-gray-600 transition hover:border-orange-400 hover:text-orange-500"
                    >
                      <i className="bx bx-filter-alt text-[13px]" />
                      Refine Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Score Progression */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
                <div>
                  <p className="text-[13.5px] font-bold tracking-tight text-gray-900">Score Progression</p>
                  <p className="mt-0.5 text-[11.5px] text-gray-400">Monthly average performance</p>
                </div>
                {/* Toggle */}
                <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {[{ id: "all", label: "All" }, { id: "practice", label: "Practice" }, { id: "quiz", label: "Quiz" }].map((t) => (
                    <button key={t.id} onClick={() => setChartFilter(t.id)}
                      className={`cursor-pointer rounded-md px-3 py-1 text-[12px] font-semibold transition ${
                        chartFilter === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                {loading || analyticsLoading ? (
                  <Shimmer h={220} radius={8} />
                ) : (() => {
                  // Build progression from history (has both practice + quiz)
                  const progression = history.map((h) => ({
                    date: h.completedAt,
                    percentage: h.score,
                    assessment_type: h.assessment_type || h.type || "practice",
                  }));

                  const filtered =
                    chartFilter === "all"
                      ? progression
                      : progression.filter(
                          (p) => p.assessment_type?.toLowerCase() === chartFilter
                        );

                  // Group into monthly buckets
                  const map = {};
                  filtered.forEach((p) => {
                    const key = new Date(p.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    });
                    if (!map[key]) map[key] = { total: 0, count: 0 };
                    map[key].total += p.percentage ?? 0;
                    map[key].count += 1;
                  });

                  const labels = Object.keys(map);
                  const avgs = labels.map((k) => Math.round(map[k].total / map[k].count));

                  if (labels.length < 2)
                    return (
                      <EmptyState
                        message={`Not enough ${chartFilter === "all" ? "" : chartFilter + " "}data to draw a trend.`}
                        height={220}
                      />
                    );

                  return (
                    <>
                      <TrendChart months={labels} avgs={avgs} />
                      <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-0.5 w-5 rounded bg-orange-500" />
                          <span className="text-[11.5px] text-gray-400">
                            {chartFilter === "all"
                              ? "All assessments"
                              : chartFilter === "quiz"
                              ? "Quizzes only"
                              : "Practice only"}{" "}
                            avg
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg width="20" height="2" viewBox="0 0 20 2">
                            <line x1="0" y1="1" x2="20" y2="1" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
                          </svg>
                          <span className="text-[11.5px] text-gray-400">Pass threshold (75%)</span>
                        </div>
                        {improvement != null && chartFilter === "all" && (
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className={`text-[12.5px] font-bold ${improvement >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {improvement >= 0 ? "▲" : "▼"} {Math.abs(improvement)}%
                            </span>
                            <span className="text-[11.5px] text-gray-400">overall change</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Exam Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 px-5 py-4">
                <div>
                  <div className="mb-2.5 flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-fit">
                    {[{ id: "all", label: "All" }, { id: "pass", label: "Passed" }, { id: "fail", label: "Failed" }].map((f) => (
                      <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }}
                        className={`cursor-pointer rounded-md px-3 py-1 text-[12px] font-semibold transition ${filter === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[13.5px] font-bold tracking-tight text-gray-900">Practice / Quiz History</p>
                  <p className="mt-0.5 text-[11.5px] text-gray-400">Individual exam entries from analytics</p>
                  <p className="mt-0.5 text-[11.5px] text-gray-400">
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}{filter !== "all" ? ` · ${filter === "pass" ? "Passed" : "Failed"} only` : ""}
                  </p>
                </div>
                <button onClick={() => { setSortDir((d) => (d === "desc" ? "asc" : "desc")); setPage(1); }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-800 shadow-sm">
                  <i className={`bx ${sortDir === "desc" ? "bx-sort-down" : "bx-sort-up"} text-[14px]`} />
                  {sortDir === "desc" ? "Newest first" : "Oldest first"}
                </button>
              </div>

              {/* Column headers */}
              <div className="hidden grid-cols-[56px_1fr_160px_90px_84px_100px_88px] border-b border-gray-100 bg-gray-50/80 px-5 py-2.5 sm:grid">
                {["#", "Subject", "Date & Time", "Type", "Score (%)", "Band", "Status"].map((col, i) => (
                  <div key={col} className={`text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 ${i === 1 ? "pl-5" : ""}`}
                    style={{ textAlign: i === 1 ? "left" : "center" }}>{col}</div>
                ))}
              </div>

              {/* Rows */}
              {loading ? (
                <div className="flex flex-col gap-2 p-5">{[...Array(5)].map((_, i) => <Shimmer key={i} h={52} radius={10} />)}</div>
              ) : EMPTY || filtered.length === 0 ? (
                <EmptyState message={EMPTY ? "No exams taken yet. Start your first practice exam!" : "No results match this filter."} height={220} />
              ) : (
                paginated.map((h, i) => (
                  <div key={h.resultID ?? i}>
                    
                    {/* Desktop */}
                    <div className="hidden cursor-default grid-cols-[56px_1fr_160px_90px_84px_100px_88px] items-center border-b border-gray-50 px-5 py-3.5 transition hover:bg-gray-50/60 sm:grid">

                      {/* Attempt */}
                      <div className="text-center text-[12px] font-semibold text-gray-400">#{h.attemptNumber}</div>

                      {/* Subject */}
                      <div className="pl-1">
                        <p className="truncate text-[13px] font-semibold tracking-tight text-gray-900">{h.subjectName || "Practice Exam"}</p>
                        {(h.earnedPoints != null || h.totalPoints != null) && (
                          <p className="mt-0.5 text-[11px] text-gray-400">{h.earnedPoints ?? "—"} / {h.totalPoints ?? "—"} pts</p>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="text-center">
                        <p className="text-[12px] font-semibold text-gray-800">{fmtDate(h.completedAt)}</p>
                        <p className="text-[11px] text-gray-400">{fmtTime(h.completedAt)}</p>
                      </div>

                      {/* Type */}
                      <div className="flex justify-center">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          (h.assessment_type || h.type) === "quiz"
                            ? "bg-violet-50 text-violet-600"
                            : "bg-orange-50 text-orange-500"
                        }`}>
                          {h.assessment_type || h.type || "Practice"}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex justify-center"><ScorePill score={h.score} /></div>

                      {/* Band */}
                      <div className="flex justify-center"><BandBadge pct={h.score} /></div>

                      {/* Status */}
                      <div className="flex justify-center"><StatusChip passed={h.passed} /></div>

                    </div>
                    
                    {/* Mobile */}
                    <div className="border-b border-gray-50 px-4 py-3.5 sm:hidden">
                      <div className="mb-2 flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold tracking-tight text-gray-900">{h.subjectName || "Practice Exam"}</p>
                          <p className="mt-0.5 text-[11px] text-gray-400">{fmtDate(h.completedAt)} · Attempt #{h.attemptNumber}</p>
                        </div>
                        <ScorePill score={h.score} />
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusChip passed={h.passed} />
                        {(h.earnedPoints != null || h.totalPoints != null) && (
                          <span className="text-[11px] text-gray-400">{h.earnedPoints ?? "—"}/{h.totalPoints ?? "—"} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-3.5">
                  <span className="text-[11.5px] tracking-tight text-gray-400">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-gray-500 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                      ← Prev
                    </button>
                    {buildPages().map((pg, i) =>
                      pg === "…" ? (
                        <span key={`e-${i}`} className="px-1 text-[12px] text-gray-400">…</span>
                      ) : (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition ${pg === page ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-500 hover:border-orange-500 hover:bg-orange-500 hover:text-white"}`}>
                          {pg}
                        </button>
                      )
                    )}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-gray-500 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        

        {/* ══════════════════════════════════════════════════════════════
            TAB: RECENT ACTIVITY (NEW)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "activity" && (
          <div className="space-y-4">
          
            <div className="grid gap-4 lg:grid-cols-3">

              {/* Activity Feed */}
              <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                      <i className="bx bx-pulse text-[14px] text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">Activity Feed</p>
                      <p className="text-[11px] text-gray-400">{filteredActivity.length} recent entries</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 rounded-xl border border-gray-200 bg-gray-50 p-0.5">
                    {[{ id: "all", label: "All" }, { id: "quiz", label: "Quizzes" }, { id: "practice", label: "Practice" }].map((f) => (
                      <button key={f.id} onClick={() => setActivityFilter(f.id)}
                        className={`cursor-pointer rounded-lg px-3 py-1 text-[12px] font-semibold transition ${activityFilter === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 max-h-[520px] overflow-y-auto">
                  {loading ? (
                    <div className="space-y-2 p-2">{[...Array(6)].map((_, i) => <Shimmer key={i} h={72} radius={12} />)}</div>
                  ) : filteredActivity.length === 0 ? (
                    <EmptyState message="No recent activity found." height={200} />
                  ) : (
                    filteredActivity.map((item, i) => <ActivityItem key={item.id ?? i} item={item} index={i} />)
                  )}
                </div>
              </div>

              {/* Side stats */}
              <div className="flex flex-col gap-3">

                {/* Streak / quick stats */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Quick Stats</p>
                  <div className="space-y-3">
                    {[
                      { label: "Last 7 days", value: history.filter((h) => (Date.now() - new Date(h.completedAt)) / 86400000 <= 7).length, icon: "bx bx-calendar-week", color: "#3b82f6" },
                      { label: "Last 30 days", value: history.filter((h) => (Date.now() - new Date(h.completedAt)) / 86400000 <= 30).length, icon: "bx bx-calendar", color: "#f97316" },
                      { label: "Quizzes taken", value: history.filter((h) => (h.assessment_type || h.type) === "quiz").length || "—", icon: "bx bx-pencil", color: "#8b5cf6" },
                      { label: "Practice runs", value: history.filter((h) => (h.assessment_type || h.type) === "practice" || (!h.assessment_type && !h.type)).length || "—", icon: "bx bx-book-open", color: "#10b981" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: s.color + "15" }}>
                            <i className={`${s.icon} text-[13px]`} style={{ color: s.color }} />
                          </div>
                          <span className="text-[12px] text-gray-600">{s.label}</span>
                        </div>
                        <span className="text-[13px] font-bold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance breakdown */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400">Performance Bands</p>
                  {loading ? (
                    <div className="space-y-2">{[...Array(4)].map((_, i) => <Shimmer key={i} h={24} radius={6} />)}</div>
                  ) : (() => {
                    const bands = [
                      { label: "Excellent", min: 80, color: "#10b981" },
                      { label: "Good",      min: 60, color: "#3b82f6" },
                      { label: "Needs Work",min: 41, color: "#f59e0b" },
                      { label: "Poor",      min: 0,  color: "#ef4444" },
                    ];
                    const total = withScores.length || 1;
                    return bands.map((b, bi) => {
                      const next = bands[bi - 1];
                      const count = withScores.filter((h) => h.score >= b.min && (next ? h.score < next.min : true)).length;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={b.label} className="mb-2.5">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11.5px] font-medium text-gray-600">{b.label}</span>
                            <span className="text-[11px] font-bold" style={{ color: b.color }}>{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: b.color }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Filter Analytics Modal ── */}
          {filterModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }}
              onClick={(e) => { if (e.target === e.currentTarget) setFilterModalOpen(false); }}
            >
              <div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                style={{ animation: "scaleIn 0.2s ease" }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                      <i className="bx bx-filter text-[15px] text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">Filter Analytics</p>
                      <p className="text-[11px] text-gray-400">All filters are optional and combinable</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFilterModalOpen(false)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-gray-300 hover:text-gray-600"
                  >
                    <i className="bx bx-x text-[18px]" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-4 px-6 py-5">
                  {/* Assessment Type */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Assessment Type</label>
                    <select
                      value={analyticsFilters.assessment_type}
                      onChange={(e) => setAnalyticsFilters((f) => ({ ...f, assessment_type: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-700 focus:border-orange-400 focus:outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="quiz">Quiz</option>
                      <option value="practice">Practice</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Date From</label>
                      <input
                        type="date"
                        value={analyticsFilters.date_from}
                        onChange={(e) => setAnalyticsFilters((f) => ({ ...f, date_from: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700 focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Date To</label>
                      <input
                        type="date"
                        value={analyticsFilters.date_to}
                        onChange={(e) => setAnalyticsFilters((f) => ({ ...f, date_to: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700 focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Performance Band */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Performance Band</label>
                    <select
                      value={analyticsFilters.performance_band}
                      onChange={(e) => setAnalyticsFilters((f) => ({ ...f, performance_band: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-700 focus:border-orange-400 focus:outline-none"
                    >
                      <option value="">All Bands</option>
                      <option value="excellent">Excellent (80%+)</option>
                      <option value="good">Good (60–79%)</option>
                      <option value="needs_improvement">Needs Work (41–59%)</option>
                      <option value="poor">Poor (≤40%)</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                  <button
                    onClick={() => { setAnalyticsFilters({ assessment_type: "", subject_id: "", date_from: "", date_to: "", performance_band: "" }); }}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilterSearch}
                    className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2 text-[12.5px] font-bold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 active:scale-95"
                  >
                    Apply & Search
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
};

export default ScoreHistory;
