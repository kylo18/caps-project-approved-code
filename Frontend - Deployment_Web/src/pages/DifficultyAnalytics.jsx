import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DifficultyAnalytics.jsx
 *
 * Data sources (all scoped to the authenticated student via Bearer token):
 *
 * 1. GET /api/practice-exam/difficulty-analytics
 *    → { difficultyBands: [...], topicBreakdown: [...] }
 *    NOTE: backend returns aggregated data across ALL users.
 *    We override difficultyBands with student-specific data from source 2.
 *
 * 2. GET /api/student/analytics/summary
 *    → { data: { total_exams, average_score, best_score, lowest_score,
 *                frequently_mistaken_questions_count,
 *                average_attempts_before_passing, weakest_topic, trend } }
 *
 * 3. GET /api/student/analytics/trends
 *    → { data: [...exam history...], summary: { avg_score, highest_score, lowest_score } }
 *
 * Together these give us real per-student difficulty data.
 */

const DifficultyAnalytics = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Data states
  const [difficultyData, setDifficultyData] = useState(null); // from /difficulty-analytics
  const [studentSummary, setStudentSummary] = useState(null); // from /student/analytics/summary
  const [trends, setTrends] = useState(null);                 // from /student/analytics/trends

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all 3 endpoints in parallel
        const [diffRes, summaryRes, trendsRes] = await Promise.all([
          fetch(`${apiUrl}/practice-exam/difficulty-analytics`, { headers }),
          fetch(`${apiUrl}/student/analytics/summary`, { headers }),
          fetch(`${apiUrl}/student/analytics/trends`, { headers }),
        ]);

        const [diffJson, summaryJson, trendsJson] = await Promise.all([
          diffRes.ok ? diffRes.json() : null,
          summaryRes.ok ? summaryRes.json() : null,
          trendsRes.ok ? trendsRes.json() : null,
        ]);

        setDifficultyData(diffJson ?? null);
        setStudentSummary(summaryJson?.data ?? null);
        setTrends(trendsJson ?? null);
      } catch (e) {
        console.error("DifficultyAnalytics load error:", e);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const EMPTY = !loading && !difficultyData && !studentSummary;

  const BAND_DEFAULTS = [
    { level: "Easy",     score: null, total: 0, correct: 0 },
    { level: "Moderate", score: null, total: 0, correct: 0 },
    { level: "Hard",     score: null, total: 0, correct: 0 },
  ];

  // Difficulty bands from the difficulty-analytics endpoint
  const diffBands = BAND_DEFAULTS.map((def) => {
    const found = (difficultyData?.difficultyBands ?? []).find(
      (b) => b.level?.toLowerCase() === def.level.toLowerCase()
    );
    if (!found) return def;
    return {
      level: def.level,
      score: found.score != null ? Math.round(found.score) : null,
      total: found.total ?? 0,
      correct: found.correct ?? 0,
    };
  });

  const topics = difficultyData?.topicBreakdown ?? [];

  // Overall score from student summary (most accurate per-student value)
  const overallScore = studentSummary?.average_score != null
    ? Math.round(studentSummary.average_score)
    : null;

  const bestScore = studentSummary?.best_score != null
    ? Math.round(studentSummary.best_score)
    : null;

  const lowestScore = studentSummary?.lowest_score != null
    ? Math.round(studentSummary.lowest_score)
    : null;

  const totalExams = studentSummary?.total_exams ?? 0;
  const mistakenCount = studentSummary?.frequently_mistaken_questions_count ?? 0;
  const avgAttemptsBeforePassing = studentSummary?.average_attempts_before_passing ?? 0;
  const weakestTopic = studentSummary?.weakest_topic ?? null;
  const trend = studentSummary?.trend ?? "stable";

  // Worst difficulty band
  const worstBand = [...diffBands]
    .filter((b) => b.score != null)
    .sort((a, b) => a.score - b.score)[0] ?? null;

  // Recent exams for mini trend chart
  const recentExams = (trends?.data ?? []).slice(0, 5).reverse();

  // ── Styling helpers ─────────────────────────────────────────────────────────

  const levelCfg = {
    Easy:     { color: "#22A56D", bg: "#EAF7F1", border: "#B7E4CC" },
    Moderate: { color: "#FF6014", bg: "#FEF0EA", border: "#FECBA0" },
    Hard:     { color: "#A32D2D", bg: "#FCEBEB", border: "#F5BDBD" },
  };

  const trendCfg = {
    improving: { color: "#22A56D", icon: "↑", label: "Improving" },
    declining: { color: "#E55012", icon: "↓", label: "Declining" },
    stable:    { color: "#FF6014", icon: "→", label: "Stable"    },
  };

  const sc = (pct) => {
    if (pct == null) return "#9B9790";
    return pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden"}}>

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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8">
            <polyline points="10,3 5,8 10,13" />
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814" }}>Learning Difficulty</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>
            Your personal Easy / Moderate / Hard breakdown · Real exam data
          </div>
        </div>
        {/* Trend badge */}
        {!loading && trend && (
          <div style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 20,
            background: trend === "improving" ? "#EAF7F1" : trend === "declining" ? "#FCEBEB" : "#FEF0EA",
            border: `1px solid ${trend === "improving" ? "#B7E4CC" : trend === "declining" ? "#F5BDBD" : "#FECBA0"}`,
          }}>
            <span style={{ fontSize: 13 }}>{trendCfg[trend]?.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: trendCfg[trend]?.color }}>
              {trendCfg[trend]?.label}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ margin: "16px 28px", padding: "12px 16px", borderRadius: 10, background: "#FCEBEB", border: "1px solid #F5BDBD", color: "#A32D2D", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ padding: isMobile ? "16px 16px 100px" : "24px 28px 100px" }}>

        {/* ── SECTION 1: Score snapshot ── */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2",
          marginBottom: 20, overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "auto 1px 1fr",
            alignItems: "stretch",
            padding: isMobile ? "20px 20px" : "22px 24px",
            gap: 0,
          }}>
            {/* Big number - from student summary */}
            <div style={{ paddingRight: isMobile ? 0 : 30, paddingBottom: isMobile ? 20 : 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.9px", color: "#9B9790", marginBottom: 8 }}>
                Your average score
              </div>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -3, lineHeight: 1, color: "#1A1814" }}>
                {loading ? "—" : overallScore != null ? overallScore : "—"}
                <span style={{ fontSize: 54, fontWeight: 400, color: "#9B9790" }}> %</span>
              </div>
              <div style={{ fontSize: 12, color: "#9B9790", marginTop: 8 }}>
                {loading
                  ? "Loading..."
                  : totalExams > 0
                    ? `${totalExams} exam${totalExams !== 1 ? "s" : ""} taken · Best: ${bestScore ?? "—"}% · Lowest: ${lowestScore ?? "—"}%`
                    : "No exams taken yet"}
              </div>

              {/* Stats row */}
              {!loading && totalExams > 0 && (
                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  {/* Frequently mistaken */}
                  <div style={{ padding: "6px 12px", borderRadius: 10, background: mistakenCount > 0 ? "#FCEBEB" : "#EAF7F1", border: `1px solid ${mistakenCount > 0 ? "#F5BDBD" : "#B7E4CC"}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.8px" }}>Frequently Missed</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: mistakenCount > 0 ? "#A32D2D" : "#22A56D" }}>{mistakenCount} Q</div>
                  </div>
                  {/* Avg attempts before passing */}
                  <div style={{ padding: "6px 12px", borderRadius: 10, background: "#F8F6F3", border: "1px solid #EAE8E2" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.8px" }}>Avg Attempts to Pass</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: avgAttemptsBeforePassing >= 3 ? "#A32D2D" : avgAttemptsBeforePassing >= 2 ? "#FF6014" : "#22A56D" }}>
                      {avgAttemptsBeforePassing > 0 ? `${avgAttemptsBeforePassing}x` : "—"}
                    </div>
                  </div>
                  {/* Weakest topic */}
                  {weakestTopic?.name && weakestTopic.name !== "N/A" && (
                    <div style={{ padding: "6px 12px", borderRadius: 10, background: "#FEF0EA", border: "1px solid #FECBA0" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "0.8px" }}>Weakest Subject</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6014", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{weakestTopic.name}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Worst difficulty tag */}
              {!loading && !EMPTY && worstBand?.score != null && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12,
                  padding: "5px 11px", borderRadius: 20,
                  background: levelCfg[worstBand.level]?.bg,
                  border: `1px solid ${levelCfg[worstBand.level]?.border}`,
                  width: "fit-content",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: levelCfg[worstBand.level]?.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: levelCfg[worstBand.level]?.color }}>
                    {worstBand.level} is dragging your score
                  </span>
                </div>
              )}
            </div>

            {/* Separator */}
            {!isMobile && <div style={{ background: "#EAE8E2", margin: "0 26px" }} />}

            {/* Difficulty bands */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, paddingTop: isMobile ? 20 : 4, borderTop: isMobile ? "1px solid #EAE8E2" : "none", overflow: "hidden", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.9px", color: "#9B9790" }}>Score by difficulty</div>
              {diffBands.map((band, idx) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const score = EMPTY ? null : band.score;
                return (
                  
                  <div key={band.level} style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", color: cfg.color, width: 68, flexShrink: 0 }}>{band.level}</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 6, background: cfg.bg, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 6, background: cfg.color,
                        width: `${score ?? 0}%`, transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
                        transitionDelay: `${idx * 0.1}s`,
                      }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color, width: 38, textAlign: "right" }}>
                      {score != null ? `${score}%` : "—"}
                    </div>
                    {!isMobile && (
                      <div style={{ fontSize: 10, color: "#9B9790", width: 52 }}>
                        {EMPTY ? "—" : `${band.correct ?? 0} / ${band.total ?? 0}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Score trend mini chart ── */}
        {!loading && recentExams.length >= 2 && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", marginBottom: 20, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1814", marginBottom: 14 }}>
              Your Recent Exam Scores
              <span 
                style={{ fontSize: 12, fontWeight: 400, color: "#9B9790", marginLeft: 8 }}>
                  last {recentExams.length} exams
              </span>
            </div>
            {/*<div style={{ display: "flex", alignItems: "flex-end", gap: 60, height: 90 }}>*/}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 60, height: 100, overflow: "hidden" }}>
              {recentExams.map((exam, i) => {
                const pct = exam.percentage ?? 0;
                const barH = Math.max(4, (pct / 100) * 60);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 12, color: "#5C5955", fontWeight: 600 }}>{Math.round(pct)}%</div>
                    <div style={{
                      width: "100%", height: barH, borderRadius: 4,
                      background: sc(pct),
                      transition: "height 0.6s ease",
                      transitionDelay: `${i * 0.05}s`,
                    }} title={`${exam.subjectName ?? ""}: ${pct}%`} />
                    <div style={{ fontSize: 12, color: "#5C5955", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {exam.subjectName ? exam.subjectName.split(" ").slice(0, 10).join(" ") : `#${i + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        )}

        {/* ── SECTION 3: 3-column metrics grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}>

          {/* Error rate per level */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
            <div style={{ padding: "13px 18px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1814" }}>Error rate per level</span>
              <span style={{ fontSize: 10, color: "#9B9790" }}>Wrong ÷ total</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {diffBands.map((band, idx) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const wrong = band.total > 0 ? band.total - band.correct : 0;
                const errorRate = band.total > 0 ? Math.round((wrong / band.total) * 100) : null;
                return (
                  <div key={band.level}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color, width: 68, flexShrink: 0 }}>{band.level}</div>
                      <div style={{ flex: 1, height: 7, background: "#F5F3EF", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 6,
                          background: band.level === "Hard" ? "#F09595" : "#FECBA0",
                          width: `${errorRate ?? 0}%`,
                          transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
                          transitionDelay: `${idx * 0.1}s`,
                        }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#A32D2D", width: 32, textAlign: "right" }}>
                        {errorRate != null ? `${errorRate}%` : "—"}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#9B9790", marginTop: 3, paddingLeft: 78 }}>
                      {EMPTY || band.total === 0 ? "No data" : `${wrong} wrong out of ${band.total}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your exam performance */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
            <div style={{ padding: "13px 18px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1814" }}>Your performance</span>
              <span style={{ fontSize: 10, color: "#9B9790" }}>Personal stats</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {loading ? (
                <div style={{ fontSize: 12, color: "#9B9790" }}>Loading...</div>
              ) : !studentSummary || totalExams === 0 ? (
                <div style={{ fontSize: 12, color: "#9B9790" }}>No exam data yet.</div>
              ) : (
                <>
                  {[
                    { label: "Total Exams", value: totalExams, suffix: "", color: "#1A1814" },
                    { label: "Average Score", value: overallScore, suffix: "%", color: sc(overallScore) },
                    { label: "Best Score", value: bestScore, suffix: "%", color: "#22A56D" },
                    { label: "Lowest Score", value: lowestScore, suffix: "%", color: "#E55012" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#5C5955" }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>
                        {item.value != null ? `${item.value}${item.suffix}` : "—"}
                      </span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#F0EDE8", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#5C5955" }}>Frequently Missed Qs</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: mistakenCount > 0 ? "#A32D2D" : "#22A56D" }}>
                      {mistakenCount}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#5C5955" }}>Avg Attempts to Pass</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: avgAttemptsBeforePassing >= 3 ? "#A32D2D" : avgAttemptsBeforePassing >= 2 ? "#FF6014" : "#22A56D" }}>
                      {avgAttemptsBeforePassing > 0 ? `${avgAttemptsBeforePassing}x` : "—"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Score by difficulty band */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
            <div style={{ padding: "13px 18px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1814" }}>Score by difficulty band</span>
              <span style={{ fontSize: 10, color: "#9B9790" }}>Correct ÷ total</span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {diffBands.map((band) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const score = EMPTY ? null : band.score;
                return (
                  <div key={band.level} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", color: cfg.color, width: 68, flexShrink: 0 }}>{band.level}</div>
                    <div style={{ flex: 1, height: 7, background: cfg.bg, borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 6, background: cfg.color,
                        width: `${score ?? 0}%`, transition: "width 0.9s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, width: 38, textAlign: "right" }}>
                      {score != null ? `${score}%` : "—"}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 4, padding: "9px 11px", background: "#F8F6F3", borderRadius: 8, fontSize: 10, color: "#9B9790", lineHeight: 1.55 }}>
                {!loading && !EMPTY && worstBand?.score != null
                  ? `${worstBand.level} is the weakest at ${worstBand.score}%. Focus here first.`
                  : "Complete an exam to see your score breakdown."}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Topic breakdown table ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>Topic Difficulty Breakdown</span>
            <span style={{ fontSize: 11, color: "#9B9790" }}>Sorted by most questions answered</span>
          </div>

          {/* Column headers — desktop only */}
          {!isMobile && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 90px 90px 90px 110px 110px", 
              gap: 12, padding: "10px 20px", background: "#F8F6F3", 
              borderBottom: "1px solid #EAE8E2" }}>
              {["Topic", "Easy", "Moderate", "Hard", "Overall", "Avg Tries"].map((h, i) => (
                <span key={h} style={{ 
                  fontSize: 10, fontWeight: 700, 
                  color: "#9B9790", textTransform: "uppercase", 
                  letterSpacing: "1px", textAlign: i === 0 ? "left" : "center" 
                }}>{h}</span>
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
                  borderBottom: i < topics.length - 1 ? "1px solid #F8F6F3" : "none",
                  alignItems: "center",
                  background: isMobile ? "#fff" : "transparent",
                  borderRadius: isMobile ? 14 : 0,
                  marginBottom: isMobile ? 12 : 0,
                }}
                onMouseEnter={e => { if (!isMobile) e.currentTarget.style.background = "#FFFAF7"; }}
                onMouseLeave={e => { if (!isMobile) e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814" }}>{t.topicName}</div>
                  {isMobile && (
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
                  )}
                </div>

                {!isMobile && (
                  <>
                    {[t.easyScore, t.moderateScore, t.hardScore].map((val, idx) => (
                      <div key={idx} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: val != null ? sc(val) : "#9B9790" }}>
                          {val != null ? `${val}%` : "—"}
                        </div>
                        {val != null && (
                          <div style={{ height: 3, borderRadius: 3, marginTop: 5, background: "#F5F3EF", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 3, background: sc(val), width: `${val}%`, transition: "width 1s ease" }} />
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.overallScore != null ? sc(t.overallScore) : "#9B9790" }}>
                        {t.overallScore != null ? `${t.overallScore}%` : "—"}
                      </span>
                    </div>
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

        {/* ── SECTION 5: Weakest subject highlight ── */}
        {!loading && weakestTopic?.name && weakestTopic.name !== "N/A" && (
          <div style={{
            background: "#FEF0EA", borderRadius: 14, border: "1px solid #FECBA0",
            padding: "16px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FF6014", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3L10 11M10 14L10 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6014" }}>Focus Area: {weakestTopic.name}</div>
              <div style={{ fontSize: 12, color: "#9B5A30", marginTop: 3 }}>
                This is your weakest subject based on your exam history. Spend extra time reviewing it.
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 6: Score colour legend ── */}
        {!loading && !EMPTY && topics.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", padding: "16px 20px" }}>
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
