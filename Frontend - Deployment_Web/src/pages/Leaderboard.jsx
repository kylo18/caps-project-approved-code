import { useState, useEffect } from "react";

const getInitials = (firstName, lastName) =>
  ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();

const AVATAR_COLORS = [
  "#E55012","#3B6CB5","#0F7A5A","#7C3AED",
  "#BE185D","#0F6E56","#B45309","#1D4ED8","#9D174D",
];
const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getTier = (score) => {
  if (score >= 90) return { label: "Elite",      color: "#854d0e", bg: "#fef9c3", border: "#fde68a" };
  if (score >= 80) return { label: "Advanced",   color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" };
  if (score >= 70) return { label: "Proficient", color: "#166534", bg: "#dcfce7", border: "#bbf7d0" };
  if (score >= 60) return { label: "Developing", color: "#d97706", bg: "#fef3c7", border: "#fde68a" };
  if (score >= 50) return { label: "Beginner",   color: "#dc2626", bg: "#fee2e2", border: "#fecaca" };
  if (score != null) return { label: "Needs Work", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
  return               { label: "No Exams",    color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
};

const getScoreColor = (score) => {
  if (score == null) return "#9ca3af";
  if (score >= 90) return "#d97706";
  if (score >= 80) return "#2563eb";
  if (score >= 70) return "#16a34a";
  return "#9ca3af";
};

//new yes
const PROGRAM_TABS = ["All", "BSCpE", "CE", "ECE", "EE"];

const normalizeProgram = (program) => {
  if (!program) return "—";
  const key = program.toString().trim().toUpperCase().replace(/^BS-/, "");
  if (key === "CPE") return "BSCpE";
  if (key === "CE") return "CE";
  if (key === "ECE") return "ECE";
  if (key === "EE") return "EE";
  return program.replace(/^BS-/, "");
};

// ─── HOOK: detect mobile ──────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
const StarField = () => {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.4 + 0.1,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s) => (
        <div key={s.id} style={{
          position: "absolute",
          width: s.size, height: s.size,
          borderRadius: "50%", background: "#fff",
          top: `${s.top}%`, left: `${s.left}%`,
          opacity: s.opacity,
        }}/>
      ))}
    </div>
  );
};

// ─── PODIUM CARD ─────────────────────────────────────────────────────────────
const PodiumCard = ({ student, position, isMobile }) => {
  if (!student) return null;

  const configs = {
    1: {
      avatarSize: isMobile ? 42 : 52,
      nameSize:   isMobile ? 11 : 12,
      scoreSize:  isMobile ? 13 : 16,
      baseH:      isMobile ? 44 : 55,
      baseW:      isMobile ? 80 : 110,
      ring: "#F0C040", badge: { bg: "#F0C040", color: "#7a5c00" }, crown: "👑", mb: 0,
    },
    2: {
      avatarSize: isMobile ? 34 : 44,
      nameSize:   isMobile ? 10 : 11,
      scoreSize:  isMobile ? 12 : 14,
      baseH:      isMobile ? 32 : 40,
      baseW:      isMobile ? 72 : 100,
      ring: "#A8B4C0", badge: { bg: "#A8B4C0", color: "#3a4a54" }, crown: "🥈", mb: isMobile ? 10 : 14,
    },
    3: {
      avatarSize: isMobile ? 30 : 38,
      nameSize:   isMobile ? 9  : 10,
      scoreSize:  isMobile ? 11 : 13,
      baseH:      isMobile ? 24 : 30,
      baseW:      isMobile ? 64 : 90,
      ring: "#CD7F32", badge: { bg: "#CD7F32", color: "#5a3010" }, crown: "🥉", mb: isMobile ? 18 : 25,
    },
  };

  const c = configs[position];
  const scoreColor = position === 1 ? "#F0C040" : position === 2 ? "#A8B4C0" : "#CD7F32";
  const maxNameLen = isMobile ? 8 : 16;
  const name = `${student.firstName} ${student.lastName}`;
  const displayName = name.length > maxNameLen ? name.slice(0, maxNameLen) + "…" : name;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: c.mb, zIndex: position === 1 ? 2 : 1 }}>
      <div style={{ fontSize: isMobile ? 16 : 20, marginBottom: 4, textAlign: "center" }}>{c.crown}</div>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{
          width: c.avatarSize, height: c.avatarSize, borderRadius: "50%",
          background: getAvatarColor(student.firstName),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#111", fontWeight: 900, fontSize: Math.round(c.avatarSize * 0.34),
        }}>
          {getInitials(student.firstName, student.lastName)}
        </div>
        <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${c.ring}` }}/>
        <div style={{
          position: "absolute", bottom: -4, right: -4,
          width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, borderRadius: "50%",
          background: c.badge.bg, color: c.badge.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isMobile ? 8 : 10, fontWeight: 900, border: "2px solid #fff",
        }}>{position}</div>
      </div>
      <div style={{ fontSize: c.nameSize, fontWeight: 700, color: "#111", textAlign: "center", marginBottom: 2, maxWidth: c.baseW }}>
        {displayName}
      </div>
      <div style={{ fontSize: isMobile ? 9 : 10, color: "#9ca3af", textAlign: "center", marginBottom: 4 }}>
        {student.program?.replace("BS-", "") || "—"}
      </div>
      <div style={{ fontSize: c.scoreSize, fontWeight: 900, color: scoreColor, textAlign: "center", marginBottom: 8 }}>
        {student.avgScore != null ? `${student.avgScore}%` : "—"}
      </div>
      <div style={{
        width: c.baseW, height: c.baseH,
        background: position === 1 ? "linear-gradient(180deg,#fef3c7,#fde68a)"
          : position === 2 ? "linear-gradient(180deg,#f3f4f6,#e5e7eb)"
          : "linear-gradient(180deg,#fef9c3,#fde68a55)",
        borderRadius: "10px 10px 0 0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isMobile ? 16 : 22, fontWeight: 900, color: position === 1 ? "#92400e" : "#9ca3af",
      }}>
        {position}
      </div>
    </div>
  );
};

// ─── DESKTOP STUDENT ROW ──────────────────────────────────────────────────────
const StudentRowDesktop = ({ student, rank, pinned = false }) => {
  const tier       = getTier(student.avgScore);
  const scoreColor = getScoreColor(student.avgScore);
  const isTop3     = rank <= 3;
  const isMe       = student.isMe || pinned;

  const rankDisplay = () => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const rankColor = rank === 1 ? "#F0C040" : rank === 2 ? "#A8B4C0" : rank === 3 ? "#CD7F32" : isMe ? "#FF6014" : "rgba(255,255,255,0.3)";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "56px 1fr 110px 110px 80px 110px",
      gap: 12, padding: "13px 20px", borderRadius: 12, marginBottom: 4,
      alignItems: "center", cursor: "pointer", border: "1px solid",
      borderColor: isMe ? "#fed7aa" : isTop3 ? "#fde68a" : "transparent",
background: isMe ? "#fff7f3" : isTop3 ? "#fffbeb" : "transparent",
      transition: "background 0.15s",
    }}>
      <div style={{ textAlign: "center", fontSize: rank <= 3 ? 18 : 14, fontWeight: 800, color: rankColor }}>
        {rankDisplay()}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isMe ? "#FF6014" : getAvatarColor(student.firstName),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#111",
          boxShadow: isMe ? "0 0 0 2px rgba(255,96,20,0.35)" : "none",
        }}>
          {getInitials(student.firstName, student.lastName)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isMe ? "#ea580c" : "#111", marginBottom: 1 }}>
            {student.firstName} {student.lastName}
            {isMe && (
              <span style={{
                fontSize: 9, fontWeight: 800, background: "#FF6014", color: "#111",
                padding: "1px 6px", borderRadius: 4, marginLeft: 6,
              }}>YOU</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{student.userCode}</div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7,
          background: "#eff6ff", color: "#1d4ed8",
          border: "1px solid #bfdbfe",
        }}>
          {student.program?.replace("BS-", "") || "—"}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7,
          background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
        }}>
          {tier.label}
        </span>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
        {student.totalExams ?? 0}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: scoreColor }}>
          {student.avgScore != null ? `${student.avgScore}%` : "—"}
        </div>
        <div style={{ width: 50, height: 3, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${student.avgScore ?? 0}%`, background: scoreColor }}/>
        </div>
      </div>
    </div>
  );
};

// ─── MOBILE STUDENT ROW ───────────────────────────────────────────────────────
const StudentRowMobile = ({ student, rank, pinned = false }) => {
  const tier       = getTier(student.avgScore);
  const scoreColor = getScoreColor(student.avgScore);
  const isMe       = student.isMe || pinned;

  const rankDisplay = () => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const rankColor = rank === 1 ? "#F0C040" : rank === 2 ? "#A8B4C0" : rank === 3 ? "#CD7F32" : isMe ? "#f97316" : "#9ca3af";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "11px 14px", borderRadius: 12, marginBottom: 6,
      border: "1px solid",
      borderColor: isMe ? "#fed7aa" : rank <= 3 ? "#fde68a" : "#f3f4f6",
      background: isMe ? "#fff7f3" : rank <= 3 ? "#fffbeb" : "transparent",
    }}>
      {/* Rank */}
      <div style={{
        width: 30, textAlign: "center", flexShrink: 0,
        fontSize: rank <= 3 ? 18 : 13, fontWeight: 800, color: rankColor,
      }}>
        {rankDisplay()}
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: isMe ? "#FF6014" : getAvatarColor(student.firstName),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#111",
        boxShadow: isMe ? "0 0 0 2px rgba(255,96,20,0.4)" : "none",
      }}>
        {getInitials(student.firstName, student.lastName)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: isMe ? "#ea580c" : "#111",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {student.firstName} {student.lastName}
          {isMe && (
            <span style={{
              fontSize: 8, fontWeight: 800, background: "#FF6014", color: "#111",
              padding: "1px 5px", borderRadius: 4, marginLeft: 6,
            }}>YOU</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
            background: "#eff6ff", color: "#1d4ed8",
          }}>
            {student.program?.replace("BS-", "") || "—"}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
            background: tier.bg, color: tier.color,
          }}>
            {tier.label}
          </span>
        </div>
      </div>

      {/* Score */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: scoreColor }}>
          {student.avgScore != null ? `${student.avgScore}%` : "—"}
        </div>
        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>
          {student.totalExams ?? 0} exams
        </div>
      </div>
    </div>
  );
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const SkeletonRowMobile = () => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 14px", borderRadius: 12, marginBottom: 6,
    background: "#f9fafb", animation: "pulse 1.5s infinite",
  }}>
    <div style={{ width: 30, height: 14, borderRadius: 6, background: "#e5e7eb", flexShrink: 0 }}/>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e5e7eb", flexShrink: 0 }}/>
    <div style={{ flex: 1 }}>
      <div style={{ height: 13, borderRadius: 6, background: "#e5e7eb", marginBottom: 6 }}/>
      <div style={{ height: 10, width: "60%", borderRadius: 6, background: "#f3f4f6" }}/>
    </div>
    <div style={{ width: 40, height: 20, borderRadius: 6, background: "#e5e7eb" }}/>
  </div>
);

const SkeletonRowDesktop = () => (
  <div style={{
    display: "grid", gridTemplateColumns: "56px 1fr 110px 110px 80px 110px",
    gap: 12, padding: "13px 20px", borderRadius: 12, marginBottom: 4,
    background: "#f9fafb", animation: "pulse 1.5s infinite",
  }}>
    {[40, 200, 70, 80, 40, 60].map((w, i) => (
      <div key={i} style={{ height: 14, borderRadius: 6, background: "#e5e7eb", width: w, margin: "auto" }}/>
    ))}
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Leaderboard = () => {
  const [students,        setStudents]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [search,          setSearch]          = useState("");
  const [selectedProgram, setSelectedProgram] = useState("All");
  const [programs,        setPrograms]        = useState(["All"]);
  const [myApiRank,       setMyApiRank]       = useState(null);
  const [myApiScore,      setMyApiScore]      = useState(null);
  const [totalStudents,   setTotalStudents]   = useState(0);

  const isMobile = useIsMobile();
  const pad      = isMobile ? "0 14px" : "0 40px";

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const token  = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRes = await fetch(`${apiUrl}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();

        const lbRes = await fetch(`${apiUrl}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const lbData = await lbRes.json();

        if (!lbRes.ok) {
          throw new Error(lbData.message || 'Unable to load leaderboard data.');
        }

        const studentList = (lbData.leaderboard || []).map(entry => ({
          userID:     entry.userID,
          firstName:  entry.firstName ?? '',
          lastName:   entry.lastName ?? '',
          userCode:   entry.userCode ?? '',
          program:    normalizeProgram(entry.program || '—'),
          isMe:       entry.userID === userData?.userID,
          avgScore: entry.highestPercentage != null ? Math.round(entry.highestPercentage) : null,
          totalExams: entry.attempts ?? 0,
        }));

        const sorted = studentList.sort((a, b) => {
          if (a.avgScore == null && b.avgScore == null) return 0;
          if (a.avgScore == null) return 1;
          if (b.avgScore == null) return -1;
          return b.avgScore - a.avgScore;
        });

        setStudents(sorted);
        setPrograms(PROGRAM_TABS);

        if (lbData.viewer) {
        setMyApiRank(lbData.viewer.rank ?? null);
        setMyApiScore(lbData.viewer.highestPercentage != null
          ? Math.round(lbData.viewer.highestPercentage)
          : null);
      }
      setTotalStudents(lbData.viewer?.totalCandidates ?? sorted.length);

      } catch (err) {
        setError("Unable to load leaderboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, token]);

  const filtered = students.filter(s => {
    const fullName     = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchProgram = selectedProgram === "All" || s.program === selectedProgram;
    const matchSearch  = fullName.includes(search.toLowerCase());
    return matchProgram && matchSearch;
  });

  const myEntry    = students.find(s => s.isMe);
  const myRank     = myApiRank ?? (myEntry ? students.indexOf(myEntry) + 1 : null);
  const myScore    = myApiScore ?? myEntry?.avgScore;
  const meVisible  = filtered.some(s => s.isMe);
  const top3       = students.slice(0, 3);
  const percentile = myRank ? Math.round(((students.length - myRank) / students.length) * 100) : 0;

  return (
    <div style={{
      background: "#fff",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      display: "flex", 
      flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: isMobile ? "16px 14px 0" : "16px 40px 0",
        position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
          <div style={{
            fontSize: isMobile ? 20 : 28, fontWeight: 900, 
            color: "#111",
            letterSpacing: 0,
            textAlign: "center", marginBottom: 4,
          }}>
            Leaderboards
          </div>
          <div style={{
            fontSize: 11, color: "#6b7280", textAlign: "center",
            letterSpacing: "1px", marginBottom: 20,
          }}>
            Rankings · All Programs · JRMSU CAPS
          </div>

          {/* Program filter tabs — horizontal scroll on mobile */}
          <div style={{
            display: "flex",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            gap: 0,
            paddingBottom: 0,
            justifyContent: "center",
          }}>
            {programs.map(p => (
              <button key={p} onClick={() => setSelectedProgram(p)} style={{
                padding: isMobile ? "8px 14px" : "10px 28px",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700, cursor: "pointer",
                background: "transparent", border: "none",
                flexShrink: 0,
                color: selectedProgram === p ? "#f97316" : "#6b7280",
                borderBottom: selectedProgram === p ? "2px solid #FF6014" : "2px solid transparent",
                letterSpacing: "0.5px", transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      

      {/* ── PODIUM ── */}
      {!loading && !error && top3.length >= 3 && selectedProgram === "All" && !search && (
        <div style={{
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "20px 14px 12px" : "28px 40px 20px",
          display: "flex", justifyContent: "center", alignItems: "flex-end",
          gap: isMobile ? 8 : 16, flexShrink: 0,
        }}>
          <PodiumCard student={top3[1]} position={2} isMobile={isMobile} />
          <PodiumCard student={top3[0]} position={1} isMobile={isMobile} />
          <PodiumCard student={top3[2]} position={3} isMobile={isMobile} />
        </div>
      )}

      {/* ── SEARCH ── */}
      <div style={{ padding: isMobile ? "6px 14px 10px" : "6px 40px 12px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: "0 14px", height: 38,
          maxWidth: isMobile ? "100%" : 280,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.6">
            <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14"/>
          </svg>
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 13, background: "transparent", color: "#111",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "none", border: "none", color: "#9ca3af",
              cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{
        height: 1,
        //background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)",
        background: "#e5e7eb",
        margin: `0 ${isMobile ? 14 : 40}px`,
        flexShrink: 0,
      }}/>

      {/* ── MY RANK BANNER ── */}
      {myEntry && !loading && (
        <div style={{
          background: "#fff7f3",
          borderBottom: "1px solid #fed7aa",
          padding: isMobile ? "10px 14px" : "10px 40px",
          flexShrink: 0,
          
        }}>
          {isMobile ? (
            // Mobile: compact 2-row layout
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: "#FF6014",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#111",
                }}>
                  {getInitials(myEntry.firstName, myEntry.lastName)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FF6014" }}>
                    {myEntry.firstName} {myEntry.lastName}
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>Your current position</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 0, justifyContent: "space-between" }}>
                {[
                  { label: "Rank",       value: myRank ? `#${myRank}` : "—",                             color: "#FF6014" },
                  { label: "Avg Score",  value: myScore != null ? `${myScore}%` : "—", color: "#111"    },
                  { label: "Exams",      value: myEntry.totalExams ?? 0,                                  color: "#111"    },
                  { label: "Top",        value: myRank ? `${percentile}%` : "—",                         color: "#111"    },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px" }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Desktop: original layout
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "#FF6014",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#111",
                  boxShadow: "0 0 0 2px rgba(255,96,20,0.35)",
                }}>
                  {getInitials(myEntry.firstName, myEntry.lastName)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FF6014" }}>{myEntry.firstName} {myEntry.lastName}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Your current position</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 32 }}>
                {[
                  { label: "Rank",       value: myRank ? `#${myRank}` : "—",                              color: "#FF6014" },
                  { label: "Avg Score",  value: myScore != null ? `${myScore}%` : "—",  color: "#111"    },
                  { label: "Exams",      value: myEntry.totalExams ?? 0,                                   color: "#111"    },
                  { label: "Percentile", value: myRank ? `Top ${percentile}%` : "—",                      color: "#111"},
                ].map(item => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COLUMN HEADERS (desktop only) ── */}
      {!isMobile && (
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 110px 110px 80px 110px",
          gap: 12, padding: "10px 20px", margin: "0 40px 4px", flexShrink: 0,
        }}>
          {["Rank","Student","Program","Tier","Exams","Avg Score"].map((h, i) => (
            <span key={h} style={{
              fontSize: 10, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "1.5px",
              textAlign: i === 1 ? "left" : "center",
            }}>{h}</span>
          ))}
        </div>
      )}

      {/* ── LIST ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: isMobile ? "8px 14px" : "0 40px",
        minHeight: 0,
      }}>
        {loading && [...Array(5)].map((_, i) =>
          isMobile ? <SkeletonRowMobile key={i} /> : <SkeletonRowDesktop key={i} />
        )}

        {!loading && error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ fontSize: 36 }}>😕</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", textAlign: "center" }}>{error}</div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>No students found.</div>
          </div>
        )}

        {!loading && !error && filtered.map(s => {
          const globalRank = students.indexOf(s) + 1;
          return isMobile
            ? <StudentRowMobile key={s.userID} student={s} rank={globalRank} />
            : <StudentRowDesktop key={s.userID} student={s} rank={globalRank} />;
        })}
      </div>

      {/* ── PINNED YOU ROW ── */}
      {myEntry && !meVisible && !loading && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            borderTop: "2px solid #fed7aa",
            background: "#fff7f3",
            padding: isMobile ? "6px 14px 0" : "6px 40px 0",
          }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: "#ea580c",
              textTransform: "uppercase", letterSpacing: "2px",
              textAlign: "center", paddingBottom: 6,
            }}>
              Your Position
            </div>
            {isMobile
              ? <StudentRowMobile student={myEntry} rank={myRank} pinned />
              : <StudentRowDesktop student={myEntry} rank={myRank} pinned />
            }
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #e5e7eb",
        padding: isMobile ? "10px 14px" : "10px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, gap: 8,
      }}>
        
        {myRank && (
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Your Rank: <span style={{ color: "#FF6014", fontWeight: 800 }}>#{myRank}</span>
          </span>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input::placeholder { color: #9ca3af !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Leaderboard;
