import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase();

const scoreColor = (pct) => {
  if (pct == null) return "#9B9790";
  if (pct >= 80) return "#22A56D";
  if (pct >= 60) return "#FF6014";
  return "#E55012";
};

const scoreBg = (pct) => {
  if (pct == null) return "#F5F3EF";
  if (pct >= 80) return "#EAF7F1";
  if (pct >= 60) return "#FEF0EA";
  return "#FCEBEB";
};

const tierLabel = (pct) => {
  if (pct == null) return { label: "No Data", color: "#9B9790", bg: "#F5F3EF" };
  if (pct >= 80) return { label: "Mastered",   color: "#22A56D", bg: "#EAF7F1" };
  if (pct >= 70) return { label: "Proficient", color: "#3B8BD4", bg: "#E8F0FE" };
  if (pct >= 60) return { label: "Developing", color: "#FF6014", bg: "#FEF0EA" };
  return              { label: "Needs Work",  color: "#A32D2D", bg: "#FCEBEB" };
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/* Card wrapper */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 14,
    border: "1px solid #EAE8E2", overflow: "hidden", ...style,
  }}>
    {children}
  </div>
);

const CardHead = ({ title, action, onAction }) => (
  <div style={{
    padding: "14px 20px 12px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "1px solid #F0EDE8",
  }}>
    <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>{title}</span>
    {action && (
      <span
        onClick={onAction}
        style={{ fontSize: 12, color: "#FF6014", cursor: "pointer", fontWeight: 500 }}
      >
        {action}
      </span>
    )}
  </div>
);

const CardBody = ({ children, style = {} }) => (
  <div style={{ padding: "16px 20px", ...style }}>{children}</div>
);

/* Stat card */
const StatCard = ({ label, value, pill, pillUp, accentColor }) => (
  <div style={{
    background: "#fff", borderRadius: 14, padding: 18,
    border: "1px solid #EAE8E2", position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 3,
      borderRadius: "14px 14px 0 0", background: accentColor,
    }} />
    <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1814", lineHeight: 1, letterSpacing: -1 }}>
      {value}
    </div>
    {pill && (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 11, fontWeight: 600,
        padding: "2px 8px", borderRadius: 20, marginTop: 7,
        background: pillUp ? "#EAF7F1" : "#FEF0EA",
        color: pillUp ? "#22A56D" : "#FF6014",
      }}>
        {pill}
      </div>
    )}
  </div>
);

/* Progress bar row */
const ProgressRow = ({ label, value, pct, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: "#5C5955", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, color: "#9B9790" }}>{value ?? `${pct}%`}</span>
    </div>
    <div style={{ height: 6, background: "#F0EDE8", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 10, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

/* Mastery item */
const MasteryItem = ({ name, pct }) => {
  const t = tierLabel(pct);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#5C5955", width: 120, flexShrink: 0, fontWeight: 500 }}>{name}</div>
      <div style={{ flex: 1, height: 7, background: "#F0EDE8", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct ?? 0}%`, background: scoreColor(pct), borderRadius: 10 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1814", width: 32, textAlign: "right", flexShrink: 0 }}>{pct != null ? `${pct}%` : "—"}</div>
      <div style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: t.bg, color: t.color, flexShrink: 0 }}>{t.label}</div>
    </div>
  );
};

/* Leaderboard row */
const LbRow = ({ rank, name, exams, score, isMe, initials, avatarBg, avatarFg }) => {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const rankColor = rank === 1 ? "#EF9F27" : rank === 2 ? "#888780" : rank === 3 ? "#D85A30" : "#B4B2A9";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: isMe ? "10px 20px" : "10px 0",
      margin: isMe ? "0 -20px" : 0,
      borderBottom: isMe ? "1px solid #FFE8D9" : "1px solid #F5F3EF",
      background: isMe ? "#FFF8F5" : "transparent",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: rankColor, width: 24, textAlign: "center", flexShrink: 0 }}>
        {medal || `#${rank}`}
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: avatarBg || (isMe ? "#FF6014" : "#F5F3EF"),
        color: avatarFg || (isMe ? "#fff" : "#5C5955"),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: isMe ? "#FF6014" : "#1A1814" }}>
          {name}
          {isMe && (
            <span style={{ fontSize: 10, fontWeight: 600, background: "#FF6014", color: "#fff", padding: "2px 6px", borderRadius: 6, marginLeft: 6 }}>
              You
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#9B9790", marginTop: 1 }}>{exams} exams taken</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1814", flexShrink: 0 }}>{score}</div>
    </div>
  );
};

/* Content analytics row */
const CaRow = ({ rank, name, value, barPct, barColor }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F8F6F3" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#B4B2A9", width: 18, flexShrink: 0 }}>{rank}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#1A1814" }}>{name}</div>
      <div style={{ marginTop: 4, height: 4, background: "#F0EDE8", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1814", flexShrink: 0 }}>{value}</div>
  </div>
);

/* Difficulty topic row */
const DiffRow = ({ name, attempts, level }) => {
  const cfg = {
    Hard:   { bg: "#FCEBEB", color: "#A32D2D", ico: "#A32D2D" },
    Medium: { bg: "#FEF0EA", color: "#E55012", ico: "#E55012" },
    Easy:   { bg: "#EAF7F1", color: "#22A56D", ico: "#22A56D" },
  }[level] || { bg: "#F5F3EF", color: "#9B9790", ico: "#9B9790" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #F0EDE8" }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {level === "Easy"
          ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={cfg.ico} strokeWidth="1.8"><polyline points="3,8 7,12 13,4"/></svg>
          : <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={cfg.ico} strokeWidth="1.8"><line x1="8" y1="3" x2="8" y2="9"/><circle cx="8" cy="12" r="1" fill={cfg.ico} stroke="none"/></svg>
        }
      </div>
      <div style={{ flex: 1, fontSize: 12, color: "#5C5955", fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 11, color: "#9B9790", flexShrink: 0 }}>{attempts} avg tries</div>
      <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{level}</div>
    </div>
  );
};

/* Week tracker */
const WeekTracker = ({ days }) => (
  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
    {days.map((d, i) => (
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 600,
          background: d.status === "done" ? "#EAF7F1" : d.status === "active" ? "#FF6014" : "#F5F3EF",
          color: d.status === "done" ? "#22A56D" : d.status === "active" ? "#fff" : "#B4B2A9",
        }}>
          {d.status === "done" ? "✓" : d.status === "active" ? "●" : "·"}
        </div>
        <div style={{ fontSize: 10, color: "#9B9790" }}>{d.label}</div>
      </div>
    ))}
  </div>
);

/* Section label */
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, marginTop: 4 }}>
    {children}
  </div>
);

/* Bar chart (Score analytics) */
const BarChart = ({ months, you, avg }) => (
  <div>
    <div style={{ height: 180, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 4px" }}>
      {months.map((m, i) => {
        const yh = Math.round((you[i] / 100) * 150);
        const ah = Math.round((avg[i] / 100) * 150);
        return (
          <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: 3, height: 150 }}>
              <div style={{ flex: 1, height: yh, background: "#FF6014", borderRadius: "5px 5px 0 0", minHeight: 4, transition: "height 0.5s ease" }} title={`${you[i]}%`} />
              <div style={{ flex: 1, height: ah, background: "#E8E4DC", borderRadius: "5px 5px 0 0", minHeight: 4 }} title={`${avg[i]}%`} />
            </div>
            <div style={{ fontSize: 10, color: "#9B9790", textAlign: "center", whiteSpace: "nowrap" }}>{m}</div>
          </div>
        );
      })}
    </div>
    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
      {[{ color: "#FF6014", label: "Your score" }, { color: "#E8E4DC", label: "Class average" }].map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5C5955" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
          {l.label}
        </div>
      ))}
    </div>
  </div>
);

/* Donut chart (pass/fail) */
const DonutChart = ({ passed, failed, improvement }) => {
  const total = passed + failed;
  const passPct = total ? Math.round((passed / total) * 100) : 0;
  const passArc = (passPct / 100) * 220;
  const failArc = 220 - passArc;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="35" fill="none" stroke="#F0EDE8" strokeWidth="9" />
          <circle cx="45" cy="45" r="35" fill="none" stroke="#22A56D" strokeWidth="9"
            strokeDasharray={`${passArc} ${220 - passArc}`} strokeDashoffset="-39" strokeLinecap="round" />
          <circle cx="45" cy="45" r="35" fill="none" stroke="#FF6014" strokeWidth="9"
            strokeDasharray={`${failArc} ${220 - failArc}`} strokeDashoffset={`${-(39 + passArc)}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814", lineHeight: 1 }}>{passPct}%</div>
          <div style={{ fontSize: 10, color: "#9B9790" }}>Pass</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {[
          { dot: "#22A56D", label: "Passed",           val: `${passed} exams` },
          { dot: "#FF6014", label: "Failed / Review",  val: `${failed} exams` },
          { dot: "#7F77DD", label: "Improvement",      val: improvement ?? "—" },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5C5955" }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: r.dot, flexShrink: 0 }} />
              {r.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1814" }}>{r.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Recommendation tip card */
const TipCard = ({ iconBg, iconColor, iconPath, title, body, link, onLink }) => (
  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", padding: 18 }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={iconColor} strokeWidth="1.5">
        <path d={iconPath} />
      </svg>
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1814", marginBottom: 5 }}>{title}</div>
    <div style={{ fontSize: 12, color: "#9B9790", lineHeight: 1.5 }}>{body}</div>
    {link && (
      <span onClick={onLink} style={{ fontSize: 12, color: "#FF6014", fontWeight: 500, cursor: "pointer", marginTop: 8, display: "block" }}>
        {link}
      </span>
    )}
  </div>
);

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 14, r = 8, style = {} }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: "#F0EDE8", animation: "pulse 1.5s infinite", ...style }} />
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const StudentAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const apiUrl   = import.meta.env.VITE_API_BASE_URL;
  const token    = () => sessionStorage.getItem("token");

  const [loading,    setLoading]    = useState(true);
  const [analytics,  setAnalytics]  = useState(null);
  const [leaderboard,setLeaderboard]= useState([]);
  const [caTab,      setCaTab]      = useState("viewed"); // "viewed" | "attempted"
  const [userName,   setUserName]   = useState("Student");
  const [myRank,     setMyRank]     = useState(null);
  const [myTotal,    setMyTotal]    = useState(0);

  // ── load user name ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("user"));
      if (u?.firstName) setUserName(u.firstName);
    } catch { /* */ }
  }, []);

  // ── fetch analytics ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. profile
        const profileRes  = await fetch(`${apiUrl}/user/profile`, { headers: { Authorization: `Bearer ${token()}` } });
        const profileData = await profileRes.json();

        // 2. overall leaderboard (reuse existing endpoint)
        const lbRes  = await fetch(`${apiUrl}/practice-exam/overall-leaderboard`, { headers: { Authorization: `Bearer ${token()}` } });
        const lbData = await lbRes.json();

        // 3. student analytics — try dedicated endpoint, fall back gracefully
        let analyticsData = null;
        try {
          const aRes  = await fetch(`${apiUrl}/practice-exam/student-analytics`, { headers: { Authorization: `Bearer ${token()}` } });
          if (aRes.ok) analyticsData = await aRes.json();
        } catch { /* fallback to leaderboard data */ }

        // ── Process leaderboard ──────────────────────────────────────────
        const lb = (lbData.leaderboard || [])
          .map(e => ({
            userID:    e.userID || e.user_id || e.id,
            name:      e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "Student",
            avgScore:  Math.round(e.avgScore ?? e.avg_score ?? e.average ?? 0),
            totalExams:e.totalExams ?? e.total_exams ?? e.examCount ?? 0,
            isMe:      (e.userID || e.user_id || e.id) === profileData?.userID,
          }))
          .sort((a, b) => b.avgScore - a.avgScore);

        const me = lb.find(s => s.isMe);
        if (me) {
          setMyRank(lb.indexOf(me) + 1);
          setMyTotal(lb.length);
        }
        setLeaderboard(lb.slice(0, 6)); // top 5 + me if not in top 5

        // ── Build analytics object (real or mock for UI) ──────────────────
        if (analyticsData) {
          setAnalytics(analyticsData);
        } else {
          // Derive what we can from the leaderboard data
          const meEntry   = lb.find(s => s.isMe);
          const myScore   = meEntry?.avgScore ?? null;
          const myExams   = meEntry?.totalExams ?? 0;
          const classAvg  = lb.length
            ? Math.round(lb.reduce((s, e) => s + e.avgScore, 0) / lb.length)
            : 0;
          const myRankPos = lb.indexOf(meEntry) + 1;
          const percentile= lb.length ? Math.round(((lb.length - myRankPos) / lb.length) * 100) : 0;

          setAnalytics({
            // stat cards
            examsTaken:   myExams,
            avgScore:     myScore,
            classAvg,
            rank:         myRankPos,
            rankTotal:    lb.length,
            percentile,
            studyStreak:  null, // not available without dedicated endpoint
            improvement:  null,
            // pass/fail
            passedExams:  myExams ? Math.round(myExams * 0.7) : 0,
            failedExams:  myExams ? Math.round(myExams * 0.3) : 0,
            // placeholders — real data needs the analytics endpoint
            monthlyScores:  null,
            topicMastery:   null,
            subjectCoverage:null,
            contentViewed:  null,
            contentAttempted:null,
            difficultyStats: null,
            hardestTopics:   null,
            recommendations: null,
            weekActivity:    null,
          });
        }
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  // ── SAMPLE DATA (shown when real data not yet available from API) ──────────
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
  const youScores  = analytics?.monthlyScores?.you  || [72,68,75,80,74,82,78];
  const avgScores  = analytics?.monthlyScores?.avg  || [65,63,67,70,68,72,69];

  const topicMastery = analytics?.topicMastery || [
    { name: "Engineering Math",    pct: 88 },
    { name: "Data Structures",     pct: 74 },
    { name: "Database Systems",    pct: 62 },
    { name: "Computer Networks",   pct: 45 },
    { name: "Digital Logic",       pct: 80 },
  ];

  const subjectCoverage = analytics?.subjectCoverage || [
    { name: "Engineering Math",    pct: 88, color: "#22A56D" },
    { name: "Data Structures",     pct: 74, color: "#3B8BD4" },
    { name: "Database Systems",    pct: 62, color: "#FF6014" },
    { name: "Computer Networks",   pct: 45, color: "#E55012" },
    { name: "Digital Logic",       pct: 80, color: "#22A56D" },
    { name: "Circuits & Electronics", pct: 55, color: "#FF6014" },
  ];

  const contentViewed = analytics?.contentViewed || [
    { name: "Engineering Math – Module 4", views: 371, pct: 100, color: "#FF6014" },
    { name: "Data Structures",             views: 278, pct: 75,  color: "#3B8BD4" },
    { name: "Database Systems",            views: 230, pct: 62,  color: "#22A56D" },
    { name: "Computer Networks",           views: 178, pct: 48,  color: "#7F77DD" },
    { name: "Digital Logic",               views: 141, pct: 38,  color: "#9B9790" },
  ];

  const contentAttempted = analytics?.contentAttempted || [
    { name: "Discrete Math Quiz",         views: 214, pct: 88,  color: "#FF6014" },
    { name: "Data Structures Practice",   views: 175, pct: 72,  color: "#3B8BD4" },
    { name: "Network Protocol Set A",     views: 141, pct: 58,  color: "#22A56D" },
    { name: "Circuit Analysis",           views: 107, pct: 44,  color: "#7F77DD" },
    { name: "OS Concepts",                views:  82, pct: 34,  color: "#9B9790" },
  ];

  const hardestTopics = analytics?.hardestTopics || [
    { name: "Computer Networks",   attempts: 3.8, level: "Hard"   },
    { name: "Circuit Analysis",    attempts: 2.9, level: "Medium" },
    { name: "Database Normalization", attempts: 2.6, level: "Medium" },
    { name: "Engineering Math",    attempts: 1.2, level: "Easy"   },
  ];

  const weekActivity = analytics?.weekActivity || [
    { label: "M", status: "done" },
    { label: "T", status: "done" },
    { label: "W", status: "done" },
    { label: "T", status: "done" },
    { label: "F", status: "done" },
    { label: "S", status: "active" },
    { label: "S", status: "miss" },
  ];

  const examsTaken   = analytics?.examsTaken ?? "—";
  const avgScore     = analytics?.avgScore   != null ? `${analytics.avgScore}%` : "—";
  const streak       = analytics?.studyStreak ?? 0;
  const classRank    = myRank ? `#${myRank}` : "—";
  const passedExams  = analytics?.passedExams ?? 0;
  const failedExams  = analytics?.failedExams ?? 0;
  const improvement  = analytics?.improvement != null ? `+${analytics.improvement}%` : "+12%";

  const AVATAR_COLORS = ["#FEF0EA:#E55012","#F5F3EF:#5C5955","#FEF0EA:#E55012","#E8F0FE:#185FA5","#EAF7F1:#0F6E56"];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: "#F5F3EF",
      minHeight: "100vh",
      padding: "28px",
    }}>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Exams Taken"  value={loading ? "—" : examsTaken} pill={loading ? null : "↑ +3 this week"}    pillUp accentColor="#FF6014" />
        <StatCard label="Avg. Score"   value={loading ? "—" : avgScore}   pill={loading ? null : "↑ vs class avg"}    pillUp accentColor="#22A56D" />
        <StatCard label="Study Streak" value={loading ? "—" : streak !== "—" ? streak : "7"}      pill="🔥 days running"                      pillUp accentColor="#3B8BD4" />
        <StatCard label="Class Rank"   value={loading ? "—" : classRank}  pill={loading || !myRank ? null : `Top ${analytics?.percentile ?? "—"}%`} pillUp accentColor="#7F77DD" />
      </div>

      {/* ── COUNTDOWN BANNER ── */}
      <div style={{
        background: "#1A1814", borderRadius: 14,
        padding: "20px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, marginBottom: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: 80, width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(255,96,20,0.18) 0%,transparent 65%)",
          pointerEvents: "none",
        }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 3 }}>
            Keep up the momentum — your qualifying exam is approaching.
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>
            Review your weak topics below and complete more practice sets to improve your rank.
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#FF6014", color: "#fff", border: "none",
            padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit",
          }}
        >
          Start New Exam →
        </button>
      </div>

      {/* ── ACHIEVEMENT + LEADERBOARD ── */}
      <SectionLabel>Achievement Dashboard & Leaderboard</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 18, marginBottom: 20 }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Score analytics bar chart */}
          <Card>
            <CardHead title="Score Analytics — This Month" action="Full report" />
            <CardBody>
              {loading
                ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><Skeleton w="100%" h={150} r={6} /></div>
                : <BarChart months={months} you={youScores} avg={avgScores} />
              }
            </CardBody>
          </Card>

          {/* Pass vs Fail */}
          <Card>
            <CardHead title="Pass vs. Fail Rate" action="View breakdown" />
            <CardBody>
              {loading
                ? <Skeleton h={90} r={8} />
                : <DonutChart passed={passedExams} failed={failedExams} improvement={improvement} />
              }
            </CardBody>
          </Card>

        </div>

        {/* Leaderboard */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <CardHead title="Class Leaderboard" action="Full board" onAction={() => navigate("/leaderboard")} />
          <CardBody style={{ paddingTop: 10, flex: 1 }}>
            {loading
              ? [...Array(5)].map((_, i) => <Skeleton key={i} h={42} r={8} style={{ marginBottom: 6 }} />)
              : leaderboard.slice(0, 5).map((s, i) => {
                  const [bg, fg] = (AVATAR_COLORS[i % AVATAR_COLORS.length]).split(":");
                  return (
                    <LbRow
                      key={s.userID}
                      rank={i + 1}
                      name={s.name}
                      exams={s.totalExams}
                      score={`${s.avgScore}%`}
                      isMe={s.isMe}
                      initials={getInitials(s.name)}
                      avatarBg={s.isMe ? "#FF6014" : bg}
                      avatarFg={s.isMe ? "#fff" : fg}
                    />
                  );
                })
            }
          </CardBody>
          <div style={{ padding: "13px 20px", borderTop: "1px solid #F0EDE8", background: "#FFF8F5" }}>
            <div style={{ fontSize: 11, color: "#9B9790", marginBottom: 6 }}>Your position this week</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#FF6014" }}>{classRank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: "#F0EDE8", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${analytics?.percentile ?? 55}%`, background: "#FF6014", borderRadius: 10 }} />
                </div>
                <div style={{ fontSize: 11, color: "#9B9790", marginTop: 4 }}>
                  Top {analytics?.percentile ?? "—"}% of your class
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── CONTENT & LEARNING ANALYTICS ── */}
      <SectionLabel>Content & Learning Analytics</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 20 }}>

        {/* Content Analytics */}
        <Card>
          <CardHead title="Content Analytics" action="See all" />
          <CardBody style={{ paddingTop: 10 }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #F0EDE8", marginBottom: 14 }}>
              {[{ id: "viewed", label: "Most Viewed" }, { id: "attempted", label: "Most Attempted" }].map(t => (
                <div
                  key={t.id}
                  onClick={() => setCaTab(t.id)}
                  style={{
                    fontSize: 12, fontWeight: 500, padding: "8px 14px", cursor: "pointer",
                    color: caTab === t.id ? "#FF6014" : "#9B9790",
                    borderBottom: caTab === t.id ? "2px solid #FF6014" : "2px solid transparent",
                    marginBottom: -1, transition: "all 0.15s",
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>
            {loading
              ? [...Array(5)].map((_, i) => <Skeleton key={i} h={36} r={6} style={{ marginBottom: 8 }} />)
              : (caTab === "viewed" ? contentViewed : contentAttempted).map((c, i) => (
                  <CaRow key={i} rank={i + 1} name={c.name} value={c.views} barPct={c.pct} barColor={c.color} />
                ))
            }
          </CardBody>
        </Card>

        {/* Learning Difficulty */}
        <Card>
          <CardHead title="Learning Difficulty" action="Details" />
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Avg. Attempts", value: analytics?.avgAttempts ?? "2.4", sub: "before passing" },
                { label: "Avg. Time/Topic", value: analytics?.avgTimeTopic ?? "18m", sub: "per session" },
              ].map(d => (
                <div key={d.label} style={{ background: "#F8F6F3", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{d.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1814", letterSpacing: -0.5, lineHeight: 1 }}>{d.value}</div>
                  <div style={{ fontSize: 11, color: "#9B9790", marginTop: 3 }}>{d.sub}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Hardest Topics</div>
              {loading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} h={30} r={6} style={{ marginBottom: 6 }} />)
                : hardestTopics.map((t, i) => <DiffRow key={i} name={t.name} attempts={t.attempts} level={t.level} />)
              }
            </div>
          </CardBody>
        </Card>

        {/* Topic Mastery + Weekly Activity */}
        <Card>
          <CardHead title="Topic Mastery Level" action="See all" />
          <CardBody>
            {loading
              ? [...Array(5)].map((_, i) => <Skeleton key={i} h={22} r={6} style={{ marginBottom: 12 }} />)
              : topicMastery.map((t, i) => <MasteryItem key={i} name={t.name} pct={t.pct} />)
            }
            <div style={{ borderTop: "1px solid #F0EDE8", paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 0 }}>
                Weekly Activity
              </div>
              <WeekTracker days={weekActivity} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── SUBJECT COVERAGE ── */}
      <SectionLabel>Subject Coverage</SectionLabel>
      <Card style={{ marginBottom: 20 }}>
        <CardHead title="Progress Per Subject" action="See details" />
        <CardBody>
          {loading
            ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} h={32} r={6} style={{ marginBottom: 14 }} />)}
              </div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                {subjectCoverage.map((s, i) => (
                  <ProgressRow key={i} label={s.name} pct={s.pct} value={`${s.pct}%`} color={s.color} />
                ))}
              </div>
          }
        </CardBody>
      </Card>

      {/* ── RECOMMENDATIONS ── */}
      <SectionLabel>Recommendations & Next Steps</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <TipCard
          iconBg="#FEF0EA" iconColor="#FF6014"
          iconPath="M3 2h8l2 2v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM5 6h6M5 9h4"
          title="Weak area detected"
          body="Computer Networks dropped below 60%. Focus on protocol fundamentals and subnetting to recover your score."
          link="Open Reviewer →"
          onLink={() => navigate("/")}
        />
        <TipCard
          iconBg="#EAF7F1" iconColor="#22A56D"
          iconPath="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM9 7l2 2-4 4-2-2"
          title="You're improving"
          body="Your average score increased by 12% over your first 5 attempts. At this pace you'll hit 85% before the qualifying exam."
          link="View Analytics →"
        />
        <TipCard
          iconBg="#E8F0FE" iconColor="#3B8BD4"
          iconPath="M2 12 6 7 9 10 12 5 14 7"
          title="On track to pass"
          body="Your strongest subject is Engineering Mathematics. Keep reinforcing Database Systems to close the gap."
          link="View Study Plan →"
        />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
};

export default StudentAnalyticsDashboard;
