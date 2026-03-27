import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ScoreHistory = () => {
  const navigate   = useNavigate();
  const apiUrl     = import.meta.env.VITE_API_BASE_URL;
  const [loading,  setLoading]  = useState(true);
  const [history,  setHistory]  = useState([]);
  const [filter,   setFilter]   = useState("all"); // all | pass | fail

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        // Try dedicated endpoint first
        const res  = await fetch(`${apiUrl}/practice-exam/score-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || data || []);
        } else {
          // Fallback: derive from sessions/results endpoint
          const r2   = await fetch(`${apiUrl}/practice-exam/results`, {
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

  // ── derive chart data ────────────────────────────────────────
  // history items expected: { subjectName, score, passed, completedAt, attemptNumber }
  const sorted   = [...history].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const filtered = filter === "all" ? sorted : sorted.filter(h => filter === "pass" ? h.passed : !h.passed);

  const maxScore = 100;
  const chartH   = 200;

  // monthly averages for the trend line
  const monthMap = {};
  sorted.forEach(h => {
    const key = new Date(h.completedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 };
    monthMap[key].total += h.score ?? 0;
    monthMap[key].count += 1;
  });
  const monthLabels = Object.keys(monthMap);
  const monthAvgs   = monthLabels.map(k => Math.round(monthMap[k].total / monthMap[k].count));

  // improvement
  const withScores = sorted.filter(h => h.score != null);
  const baseline   = withScores.length >= 2 ? Math.round(withScores.slice(0, Math.ceil(withScores.length / 2)).reduce((s, h) => s + h.score, 0) / Math.ceil(withScores.length / 2)) : null;
  const current    = withScores.length >= 2 ? Math.round(withScores.slice(-Math.ceil(withScores.length / 2)).reduce((s, h) => s + h.score, 0) / Math.ceil(withScores.length / 2)) : null;
  const improvement= baseline && current && baseline > 0 ? Math.round(((current - baseline) / baseline) * 100) : null;
  const avgScore   = withScores.length ? Math.round(withScores.reduce((s, h) => s + h.score, 0) / withScores.length) : null;
  const passCount  = sorted.filter(h => h.passed).length;
  const failCount  = sorted.filter(h => !h.passed).length;

  // ── score color ──────────────────────────────────────────────
  const sc = (pct) => pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";

  const EMPTY = history.length === 0 && !loading;

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EAE8E2", padding: "16px 28px", paddingTop: window.innerWidth <= 768 ? "60px" : "16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => navigate("/student-dashboard")}
          style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #EAE8E2", background: "#F5F3EF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8"><polyline points="10,3 5,8 10,13"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814", letterSpacing: -0.4 }}>Score History</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>All your past exam scores over time</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", paddingBottom: 100 }}>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Exams",   value: loading ? "—" : history.length,                         accent: "#FF6014" },
            { label: "Avg. Score",    value: loading ? "—" : avgScore != null ? `${avgScore}%` : "—", accent: "#22A56D" },
            { label: "Pass Rate",     value: loading ? "—" : history.length ? `${Math.round((passCount/history.length)*100)}%` : "—", accent: "#3B8BD4" },
            { label: "Improvement",   value: loading ? "—" : improvement != null ? `${improvement > 0 ? "+" : ""}${improvement}%` : "—", accent: "#7F77DD" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #EAE8E2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }}/>
              <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1814", lineHeight: 1, letterSpacing: -1 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── TREND CHART ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", marginBottom: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>Score Trend Over Time</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ id: "all", label: "All" }, { id: "pass", label: "Passed" }, { id: "fail", label: "Failed" }].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                    background: filter === f.id ? "#FF6014" : "#fff",
                    color:      filter === f.id ? "#fff"    : "#9B9790",
                    borderColor:filter === f.id ? "#FF6014" : "#EAE8E2" }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "20px 20px 16px" }}>
            {loading ? (
              <div style={{ height: chartH, background: "#F5F3EF", borderRadius: 8, animation: "pulse 1.5s infinite" }}/>
            ) : EMPTY ? (
              <EmptyState message="No exam scores yet. Take your first exam to see your trend!" height={chartH}/>
            ) : monthLabels.length === 0 ? (
              <EmptyState message="No data for selected filter." height={chartH}/>
            ) : (
              <div>
                {/* Simple bar chart */}
                <div style={{ height: chartH, display: "flex", alignItems: "flex-end", gap: 10, padding: "0 4px" }}>
                  {monthLabels.map((m, i) => {
                    const h = Math.round((monthAvgs[i] / maxScore) * (chartH - 30));
                    return (
                      <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: sc(monthAvgs[i]) }}>{monthAvgs[i]}%</div>
                        <div style={{ width: "100%", height: h, background: sc(monthAvgs[i]), borderRadius: "6px 6px 0 0", minHeight: 4, opacity: 0.85, transition: "height 0.5s ease" }}/>
                        <div style={{ fontSize: 10, color: "#9B9790", textAlign: "center", whiteSpace: "nowrap" }}>{m}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Pass threshold line label */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <div style={{ width: 20, height: 2, background: "#22A56D", borderRadius: 2 }}/>
                  <span style={{ fontSize: 11, color: "#9B9790" }}>Pass threshold: 75%</span>
                  {improvement != null && (
                    <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: improvement >= 0 ? "#22A56D" : "#E55012" }}>
                      {improvement >= 0 ? "↑" : "↓"} {Math.abs(improvement)}% overall improvement
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── EXAM LIST ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>All Exam Attempts</span>
            <span style={{ fontSize: 12, color: "#9B9790" }}>{filtered.length} records</span>
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 110px", gap: 12, padding: "10px 20px", background: "#F8F6F3" }}>
            {["Subject", "Date", "Score", "Status", "Attempt"].map((h, i) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "1px", textAlign: i === 0 ? "left" : "center" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 44, borderRadius: 8, background: "#F5F3EF", marginBottom: 8, animation: "pulse 1.5s infinite" }}/>
              ))}
            </div>
          ) : EMPTY || filtered.length === 0 ? (
            <EmptyState message={EMPTY ? "No exams taken yet. Start your first practice exam!" : "No results match this filter."} height={160}/>
          ) : (
            <div>
              {filtered.map((h, i) => {
                const date  = h.completedAt ? new Date(h.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                const color = sc(h.score ?? 0);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 110px", gap: 12, padding: "13px 20px", borderBottom: "1px solid #F8F6F3", alignItems: "center", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFFAF7"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814" }}>{h.subjectName || "Practice Exam"}</div>
                      {h.subjectCode && <div style={{ fontSize: 11, color: "#9B9790", marginTop: 1 }}>{h.subjectCode}</div>}
                    </div>
                    <div style={{ textAlign: "center", fontSize: 12, color: "#5C5955" }}>{date}</div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color }}>{h.score != null ? `${h.score}%` : "—"}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: h.passed ? "#EAF7F1" : "#FEF0EA", color: h.passed ? "#22A56D" : "#FF6014" }}>
                        {h.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 12, color: "#9B9790" }}>#{h.attemptNumber ?? i + 1}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

const EmptyState = ({ message, height = 160 }) => (
  <div style={{ height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2"/><path d="M14 26c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round"/><circle cx="15.5" cy="17.5" r="1.5" fill="#D4D0C8"/><circle cx="24.5" cy="17.5" r="1.5" fill="#D4D0C8"/></svg>
    <div style={{ fontSize: 13, color: "#9B9790", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{message}</div>
  </div>
);

export default ScoreHistory;
