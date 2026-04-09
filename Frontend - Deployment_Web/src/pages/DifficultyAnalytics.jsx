import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DifficultyAnalytics.jsx
 *
 * Uses GET /api/practice-exam/difficulty-analytics
 * Backend returns:
 * {
 *   difficultyBands: [{ level: "Easy"|"Moderate"|"Hard", score, total, correct }]
 *   topicBreakdown:  [{ topicId, topicName, easyScore, moderateScore, hardScore, overallScore, avgAttempts }]
 * }
 *
 * Note: backend uses "Moderate" (not "Medium") — matched here.
 */
const DifficultyAnalytics = () => {
  const navigate  = useNavigate();
  const apiUrl    = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const res   = await fetch(`${apiUrl}/practice-exam/difficulty-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("DifficultyAnalytics load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  const EMPTY = !loading && !data;

  // difficultyBands from backend — level is capitalised: "Easy", "Moderate", "Hard"
  // We ensure all three bands are always present even if some are missing from the response
  const BAND_DEFAULTS = [
    { level: "Easy",     score: null, total: 0, correct: 0 },
    { level: "Moderate", score: null, total: 0, correct: 0 },
    { level: "Hard",     score: null, total: 0, correct: 0 },
  ];

  const diffBands = BAND_DEFAULTS.map(def => {
    const found = (data?.difficultyBands ?? []).find(b => b.level === def.level);
    return found ?? def;
  });

  const topics = data?.topicBreakdown ?? [];

  // Score colour helper
  const sc = (pct) => {
    if (pct == null) return "#9B9790";
    return pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";
  };

  const levelCfg = {
    Easy:     { color: "#22A56D", bg: "#EAF7F1", border: "#B7E4CC" },
    Moderate: { color: "#FF6014", bg: "#FEF0EA", border: "#FECBA0" },
    Hard:     { color: "#A32D2D", bg: "#FCEBEB", border: "#F5BDBD" },
  };

  // Summary stats
  const easyBand     = diffBands.find(b => b.level === "Easy");
  const hardBand     = diffBands.find(b => b.level === "Hard");
  const totalQuestions = diffBands.reduce((s, b) => s + (b.total ?? 0), 0);
  const totalCorrect   = diffBands.reduce((s, b) => s + (b.correct ?? 0), 0);
  const overallScore   = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #EAE8E2",
        padding: isMobile ? "16px 16px" : "16px 28px",
        paddingTop: isMobile ? "60px" : "16px",
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <button
          onClick={() => navigate("/student-dashboard")}
          style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #EAE8E2", background: "#F5F3EF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8"><polyline points="10,3 5,8 10,13"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814" }}>Learning Difficulty</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>Easy / Moderate / Hard breakdown · Score by difficulty level</div>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 16px 100px" : "24px 28px 100px" }}>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Questions",  value: loading ? "—" : totalQuestions,                                                    accent: "#FF6014" },
            { label: "Overall Score",    value: loading ? "—" : overallScore != null ? `${overallScore}%` : "—",                   accent: "#3B8BD4" },
            { label: "Easy Score",       value: loading ? "—" : easyBand?.score != null ? `${easyBand.score}%` : "—",             accent: "#22A56D" },
            { label: "Hard Score",       value: loading ? "—" : hardBand?.score != null ? `${hardBand.score}%` : "—",             accent: "#A32D2D" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #EAE8E2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }} />
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
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {diffBands.map(band => {
              const cfg   = levelCfg[band.level] ?? levelCfg.Moderate;
              const score = EMPTY ? null : band.score;
              return (
                <div key={band.level} style={{ background: cfg.bg, borderRadius: 12, padding: "20px 18px", border: `1px solid ${cfg.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{band.level}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#fff", color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {band.total ?? 0} questions
                    </span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1, letterSpacing: -1, marginBottom: 6 }}>
                    {score != null ? `${score}%` : "—"}
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.6)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${score ?? 0}%`, background: cfg.color, borderRadius: 10, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: cfg.color, opacity: 0.8 }}>
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
            <span style={{ fontSize: 11, color: "#9B9790" }}>Sorted by most questions answered</span>
          </div>

          {/* Column headers — desktop only */}
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 110px 110px", gap: 12, padding: "10px 20px", background: "#F8F6F3" }}>
              {["Topic", "Easy", "Moderate", "Hard", "Overall", "Avg Tries"].map((h, i) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "1px", textAlign: i === 0 ? "left" : "center" }}>{h}</span>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 44, borderRadius: 8, background: "#F5F3EF", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : EMPTY || topics.length === 0 ? (
            <EmptyState message="No difficulty data yet. Complete at least one exam to see your breakdown by topic and difficulty level." />
          ) : (
            topics.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 90px 90px 90px 110px 110px",
                  gap: 12,
                  padding: "13px 20px",
                  borderBottom: "1px solid #F8F6F3",
                  alignItems: "center",
                  background: isMobile ? "#fff" : "transparent",
                  borderRadius: isMobile ? 14 : 0,
                  marginBottom: isMobile ? 12 : 0,
                }}
                onMouseEnter={e => { if (!isMobile) e.currentTarget.style.background = "#FFFAF7"; }}
                onMouseLeave={e => { if (!isMobile) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814" }}>{t.topicName}</div>

                {isMobile ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8 }}>
                    {[
                      { label: "Easy",      value: t.easyScore     },
                      { label: "Moderate",  value: t.moderateScore },
                      { label: "Hard",      value: t.hardScore     },
                      { label: "Overall",   value: t.overallScore  },
                      { label: "Avg Tries", value: t.avgAttempts, suffix: "x" },
                    ].map(item => (
                      <div key={item.label} style={{ padding: "10px 12px", background: "#F8F6F3", borderRadius: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9B9790", marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: item.value != null ? sc(item.value) : "#9B9790" }}>
                          {item.value != null ? `${item.value}${item.suffix ?? "%"}` : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Easy / Moderate / Hard scores */}
                    {[t.easyScore, t.moderateScore, t.hardScore].map((val, idx) => (
                      <div key={idx} style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: val != null ? sc(val) : "#9B9790" }}>
                          {val != null ? `${val}%` : "—"}
                        </span>
                      </div>
                    ))}
                    {/* Overall */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.overallScore != null ? sc(t.overallScore) : "#9B9790" }}>
                        {t.overallScore != null ? `${t.overallScore}%` : "—"}
                      </span>
                    </div>
                    {/* Avg attempts — backend returns 0 for this field currently */}
                    <div style={{ textAlign: "center" }}>
                      {t.avgAttempts != null && t.avgAttempts > 0 ? (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: t.avgAttempts >= 3 ? "#FCEBEB" : t.avgAttempts >= 2 ? "#FEF0EA" : "#EAF7F1",
                          color:      t.avgAttempts >= 3 ? "#A32D2D" : t.avgAttempts >= 2 ? "#FF6014" : "#22A56D",
                        }}>
                          {t.avgAttempts}x
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9B9790" }}>—</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* LEGEND */}
        {!loading && !EMPTY && topics.length > 0 && (
          <div style={{ marginTop: 18, background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1814", marginBottom: 10 }}>Score colour guide</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { color: "#22A56D", label: "≥ 75% — Strong" },
                { color: "#FF6014", label: "60–74% — Developing" },
                { color: "#E55012", label: "< 60% — Needs Work" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#5C5955" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2"/>
      <path d="M12 28l4-8 4 4 4-10 4 6" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ fontSize: 13, color: "#9B9790", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>{message}</div>
  </div>
);

export default DifficultyAnalytics;
