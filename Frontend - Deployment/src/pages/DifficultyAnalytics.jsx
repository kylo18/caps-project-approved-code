import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DifficultyAnalytics = () => {
  const navigate  = useNavigate();
  const apiUrl    = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const res   = await fetch(`${apiUrl}/practice-exam/difficulty-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [apiUrl]);

  const EMPTY = !loading && !data;

  const diffBands = data?.difficultyBands || [
    { level: "Easy",     score: data?.easyScore    ?? 0, total: data?.easyTotal    ?? 0, correct: data?.easyCorrect    ?? 0 },
    { level: "Moderate", score: data?.moderateScore ?? 0, total: data?.moderateTotal ?? 0, correct: data?.moderateCorrect ?? 0 },
    { level: "Hard",     score: data?.hardScore     ?? 0, total: data?.hardTotal     ?? 0, correct: data?.hardCorrect     ?? 0 },
  ];

  const topics  = data?.topicBreakdown || [];
  const avgAttempts  = data?.avgAttemptsBefore ?? null;
  const avgTime      = data?.avgTimePerTopic   ?? null;

  const levelCfg = {
    Easy:     { color: "#22A56D", bg: "#EAF7F1", border: "#B7E4CC" },
    Moderate: { color: "#FF6014", bg: "#FEF0EA", border: "#FECBA0" },
    Hard:     { color: "#A32D2D", bg: "#FCEBEB", border: "#F5BDBD" },
  };

  const sc = (pct) => pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EAE8E2", padding: "16px 28px", paddingTop: window.innerWidth <= 768 ? "60px" : "16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => navigate("/student-dashboard")}
          style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #EAE8E2", background: "#F5F3EF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8"><polyline points="10,3 5,8 10,13"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814" }}>Learning Difficulty</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>Easy / Moderate / Hard breakdown · Attempts before passing</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", paddingBottom: 100 }}>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Avg Attempts to Pass", value: loading ? "—" : avgAttempts ?? "—", accent: "#FF6014" },
            { label: "Avg Time / Topic",      value: loading ? "—" : avgTime     ?? "—", accent: "#3B8BD4" },
            { label: "Easy Score",            value: loading ? "—" : diffBands[0]?.score != null ? `${diffBands[0].score}%` : "—", accent: "#22A56D" },
            { label: "Hard Score",            value: loading ? "—" : diffBands[2]?.score != null ? `${diffBands[2].score}%` : "—", accent: "#A32D2D" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #EAE8E2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }}/>
              <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1814", lineHeight: 1, letterSpacing: -1 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* DIFFICULTY BANDS */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", marginBottom: 20, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>Score by Difficulty Level</span>
          </div>
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {diffBands.map(band => {
              const cfg = levelCfg[band.level] || levelCfg.Moderate;
              return (
                <div key={band.level} style={{ background: cfg.bg, borderRadius: 12, padding: "20px 18px", border: `1px solid ${cfg.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{band.level}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#fff", color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {band.total ?? 0} questions
                    </span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1, letterSpacing: -1, marginBottom: 6 }}>
                    {EMPTY || band.score == null ? "0%" : `${band.score}%`}
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.6)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${EMPTY ? 0 : band.score ?? 0}%`, background: cfg.color, borderRadius: 10, transition: "width 0.6s ease" }}/>
                  </div>
                  <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>
                    {EMPTY ? "0 / 0 correct" : `${band.correct ?? 0} / ${band.total ?? 0} correct`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOPIC BREAKDOWN */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>Topic Difficulty Breakdown</span>
            <span style={{ fontSize: 11, color: "#9B9790" }}>Sorted by difficulty (hardest first)</span>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 110px 110px", gap: 12, padding: "10px 20px", background: "#F8F6F3" }}>
            {["Topic", "Easy", "Moderate", "Hard", "Overall", "Avg Tries"].map((h, i) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "1px", textAlign: i === 0 ? "left" : "center" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ height: 44, borderRadius: 8, background: "#F5F3EF", marginBottom: 8, animation: "pulse 1.5s infinite" }}/>)}
            </div>
          ) : EMPTY || topics.length === 0 ? (
            <EmptyState message="No difficulty data yet. Complete at least one exam to see your breakdown by topic and difficulty level."/>
          ) : (
            topics.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 110px 110px", gap: 12, padding: "13px 20px", borderBottom: "1px solid #F8F6F3", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FFFAF7"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814" }}>{t.topicName}</div>
                {["easyScore","moderateScore","hardScore"].map(key => (
                  <div key={key} style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sc(t[key] ?? 0) }}>{t[key] != null ? `${t[key]}%` : "—"}</span>
                  </div>
                ))}
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sc(t.overallScore ?? 0) }}>{t.overallScore != null ? `${t.overallScore}%` : "—"}</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    background: (t.avgAttempts ?? 0) >= 3 ? "#FCEBEB" : (t.avgAttempts ?? 0) >= 2 ? "#FEF0EA" : "#EAF7F1",
                    color:      (t.avgAttempts ?? 0) >= 3 ? "#A32D2D" : (t.avgAttempts ?? 0) >= 2 ? "#FF6014" : "#22A56D" }}>
                    {t.avgAttempts != null ? `${t.avgAttempts}x` : "—"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2"/><path d="M12 28l4-8 4 4 4-10 4 6" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div style={{ fontSize: 13, color: "#9B9790", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>{message}</div>
  </div>
);

export default DifficultyAnalytics;
