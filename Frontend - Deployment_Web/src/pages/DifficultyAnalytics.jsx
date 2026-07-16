import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DifficultyAnalytics.jsx
 *
 * Page purpose:
 *   - Show the authenticated student's difficulty analytics dashboard.
 *   - Pull backend analytics data and format it for display in score cards,
 *     difficulty band bars, topic breakdown, and recent exam trend visuals.
 *
 * Backend endpoints used by this component:
 *
 *   1) GET <API_BASE_URL>/practice-exam/difficulty-analytics
 *      - Uses import.meta.env.VITE_API_BASE_URL as <API_BASE_URL>.
 *      - Returns summary metrics for exam difficulty bands and topic-level breakdown.
 *      - Example response:
 *        {
 *          difficultyBands: [
 *            { level: "Easy", score: 84, total: 120, correct: 101 },
 *            { level: "Moderate", score: 67, total: 80, correct: 54 },
 *            { level: "Hard", score: 48, total: 40, correct: 19 },
 *          ],
 *          topicBreakdown: [
 *            { topicName: "Algebra", easyScore: 92, moderateScore: 74, hardScore: 55, overallScore: 79, avgAttempts: 1.8 },
 *            ...
 *          ]
 *        }
 *
 *   2) GET <API_BASE_URL>/student/analytics/summary
 *      - Uses import.meta.env.VITE_API_BASE_URL as <API_BASE_URL>.
 *      - Returns the student's overall analytics summary.
 *      - Example response:
 *        {
 *          data: {
 *            total_exams: 8,
 *            average_score: 73.4,
 *            best_score: 92,
 *            lowest_score: 58,
 *            frequently_mistaken_questions_count: 12,
 *            average_attempts_before_passing: 2.1,
 *            weakest_topic: { name: "Geometry", score: 52 },
 *            trend: "improving" | "declining" | "stable"
 *          }
 *        }
 *
 *   3) GET <API_BASE_URL>/student/analytics/trends
 *      - Uses import.meta.env.VITE_API_BASE_URL as <API_BASE_URL>.
 *      - Returns exam trend history used for the recent score chart.
 *      - Example response:
 *        {
 *          data: [
 *            { subjectName: "Algebra", percentage: 88 },
 *            { subjectName: "Geometry", percentage: 64 },
 *            ...
 *          ],
 *          summary: { avg_score: 74, highest_score: 92, lowest_score: 58 }
 *        }
 *
 * Notes:
 *   - Uses bearer token from sessionStorage key "token" for authentication.
 *   - Uses import.meta.env.VITE_API_BASE_URL as the API host prefix.
 *   - If any of the fetch requests fail, the UI shows a generic load error.
 *   - The component normalizes backend values into diffBands, topics,
 *     studentSummary, and recentExams for display.
 */

const DifficultyAnalytics = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Base UI state for the page.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Backend response storage.
  // difficultyData: response from /practice-exam/difficulty-analytics.
  // studentSummary: response.data from /student/analytics/summary.
  // trends: response from /student/analytics/trends.
  const [difficultyData, setDifficultyData] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [trends, setTrends] = useState(null);

  // Track viewport size and set mobile layout state.
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load backend analytics data when the component mounts.
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all analytics endpoints in parallel to reduce page load time.
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

  // A simple state flag for when no analytics data exists.
  const EMPTY = !loading && !difficultyData && !studentSummary;

  // The expected difficulty band categories, used to normalize backend values.
  const BAND_DEFAULTS = [
    { level: "Easy", score: null, total: 0, correct: 0 },
    { level: "Moderate", score: null, total: 0, correct: 0 },
    { level: "Hard", score: null, total: 0, correct: 0 },
  ];

  // Map backend band data into a stable array ordered by Easy / Moderate / Hard.
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

  // Topic breakdown is displayed in the topic table.
  const topics = difficultyData?.topicBreakdown ?? [];

  // Convert backend summary scores to rounded integers for display.
  const overallScore = studentSummary?.average_score != null
    ? Math.round(studentSummary.average_score)
    : null;
  const bestScore = studentSummary?.best_score != null
    ? Math.round(studentSummary.best_score)
    : null;
  const lowestScore = studentSummary?.lowest_score != null
    ? Math.round(studentSummary.lowest_score)
    : null;

  // Additional summary values consumed by the UI.
  const totalExams = studentSummary?.total_exams ?? 0;
  const mistakenCount = studentSummary?.frequently_mistaken_questions_count ?? 0;
  const avgAttemptsBeforePassing = studentSummary?.average_attempts_before_passing ?? 0;
  const weakestTopic = studentSummary?.weakest_topic ?? null;
  const trend = studentSummary?.trend ?? "stable";

  // Identify the difficulty band with the lowest score to highlight it.
  const worstBand = [...diffBands]
    .filter((b) => b.score != null)
    .sort((a, b) => a.score - b.score)[0] ?? null;

  // Recent exam trend chart data uses up to 5 most recent exams.
  const recentExams = (trends?.data ?? []).slice(0, 5).reverse();

  // UI color configuration for Easy / Moderate / Hard bands.
  const levelCfg = {
    Easy: { color: "#22A56D", bg: "#EAF7F1", border: "#B7E4CC" },
    Moderate: { color: "#FF6014", bg: "#FEF0EA", border: "#FECBA0" },
    Hard: { color: "#A32D2D", bg: "#FCEBEB", border: "#F5BDBD" },
  };

  // Trend labels and badge classes for the top header.
  const trendCfg = {
    improving: { icon: "↑", label: "Improving", badge: "bg-[#EAF7F1] border-[#B7E4CC] text-[#22A56D]" },
    declining: { icon: "↓", label: "Declining", badge: "bg-[#FCEBEB] border-[#F5BDBD] text-[#E55012]" },
    stable: { icon: "→", label: "Stable", badge: "bg-[#FEF0EA] border-[#FECBA0] text-[#FF6014]" },
  };

  // Convert a score percentage into the brand color used in progress bars.
  const sc = (pct) => {
    if (pct == null) return "#9B9790";
    return pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";
  };

  return (
    <div className="bg-white min-h-screen overflow-x-hidden max-w-full font-sans">
      {/* Page header: back button, title, and current trend badge */}
      <div className="bg-white border-b border-[#EAE8E2] px-4 py-3 sm:px-7 flex flex-wrap items-center gap-4">
      
        <div>
          <div className="text-base font-bold text-[#1A1814]">Learning Difficulty</div>
          <div className="text-xs text-[#9B9790]">Your personal Easy / Moderate / Hard breakdown</div>
        </div>

        {!loading && trend && (
          <div className={`ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${trendCfg[trend]?.badge}`}>
            <span className="text-sm">{trendCfg[trend]?.icon}</span>
            <span className="text-[11px] font-bold">{trendCfg[trend]?.label}</span>
          </div>
        )}
      </div>

      {/* Error state banner shown when any endpoint request fails */}
      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-[#F5BDBD] bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D] sm:mx-7">
          {error}
        </div>
      )}

      {/* Main page content container */}
      <div className="px-4 pb-27 sm:px-7">
        {/* Summary panel: average score, exam metadata, and band chart */}
        <div className="mb-5 overflow-hidden mt-5 rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm">
          <div className={`grid gap-0 ${isMobile ? "grid-cols-1" : "grid-cols-[1fr_1fr]"} p-5 sm:px-6`}>
            <div className={`flex flex-col justify-center ${isMobile ? "pb-5" : "pr-7"}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.9px] text-[#9B9790] mb-2">Your average score</div>
              <div className="text-[56px] font-extrabold leading-none text-[#1A1814]">
                {loading ? "—" : overallScore != null ? overallScore : "—"}
                <span className="text-[54px] font-normal text-[#9B9790]"> %</span>
              </div>
              <div className="mt-2 text-sm text-[#9B9790]">
                {loading
                  ? "Loading..."
                  : totalExams > 0
                    ? `${totalExams} exam${totalExams !== 1 ? "s" : ""} taken · Best: ${bestScore ?? "—"}% · Lowest: ${lowestScore ?? "—"}%`
                    : "No exams taken yet"}
              </div>

              {!loading && totalExams > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className={`rounded-[10px] border px-3 py-2 ${mistakenCount > 0 ? "bg-[#FCEBEB] border-[#F5BDBD]" : "bg-[#EAF7F1] border-[#B7E4CC]"}`}>
                    <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#9B9790]">Frequently Missed</div>
                    <div className={`text-[16px] font-extrabold ${mistakenCount > 0 ? "text-[#A32D2D]" : "text-[#22A56D]"}`}>{mistakenCount} Q</div>
                  </div>
                  <div className="rounded-[10px] border border-[#EAE8E2] bg-[#F8F6F3] px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#9B9790]">Avg Attempts to Pass</div>
                    <div className={`text-[16px] font-extrabold ${avgAttemptsBeforePassing >= 3 ? "text-[#A32D2D]" : avgAttemptsBeforePassing >= 2 ? "text-[#FF6014]" : "text-[#22A56D]"}`}>
                      {avgAttemptsBeforePassing > 0 ? `${avgAttemptsBeforePassing}x` : "—"}
                    </div>
                  </div>
                  {weakestTopic?.name && weakestTopic.name !== "N/A" && (
                    <div className="rounded-[10px] border border-[#FECBA0] bg-[#FEF0EA] px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#9B9790]">Weakest Subject</div>
                      <div className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-bold text-[#FF6014]">{weakestTopic.name}</div>
                    </div>
                  )}
                </div>
              )}

              {!loading && !EMPTY && worstBand?.score != null && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: levelCfg[worstBand.level]?.bg, border: `1px solid ${levelCfg[worstBand.level]?.border}` }}>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: levelCfg[worstBand.level]?.color }} />
                  <span className="text-[10px] font-bold" style={{ color: levelCfg[worstBand.level]?.color }}>
                    {worstBand.level} is dragging your score
                  </span>
                </div>
              )}
            </div>

            

            <div className={`flex flex-col justify-between gap-4 min-w-0 ${isMobile ? "pt-5 border-t border-[#EAE8E2]" : "pt-1"}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.9px] text-[#9B9790]">Score by difficulty</div>
              {diffBands.map((band, idx) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const score = EMPTY ? null : band.score;
                return (
                  <div key={band.level} className="flex items-center gap-3 min-w-0">
                    <div className="w-[68px] flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.7px]" style={{ color: cfg.color }}>
                      {band.level}
                    </div>
                    <div className="flex-1 overflow-hidden rounded-[6px] bg-[#F5F3EF] h-2">
                      <div className="h-full rounded-[6px]" style={{ background: cfg.color, width: `${score ?? 0}%`, transition: "width 0.9s cubic-bezier(.4,0,.2,1)", transitionDelay: `${idx * 0.1}s` }} />
                    </div>
                    <div className="w-[38px] text-right text-[14px] font-extrabold" style={{ color: cfg.color }}>
                      {score != null ? `${score}%` : "—"}
                    </div>
                    {!isMobile && (
                      <div className="w-[52px] text-[10px] text-[#9B9790]">
                        {EMPTY ? "—" : `${band.correct ?? 0} / ${band.total ?? 0}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent exam trend chart: only render when there are at least 2 exam records */}
        {!loading && recentExams.length >= 2 && (
          <div className="mb-5 rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm p-4">
            <div className="mb-3 text-sm font-semibold text-[#1A1814]">
              Your Recent Exam Scores
              <span className="ml-2 text-xs font-normal text-[#9B9790]">last {recentExams.length} exams</span>
            </div>
            <div className="flex h-[100px] items-end gap-12 overflow-hidden">
              {recentExams.map((exam, i) => {
                const pct = exam.percentage ?? 0;
                const barH = Math.max(4, (pct / 100) * 60);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-sm font-semibold text-[#5C5955]">{Math.round(pct)}%</div>
                    <div className="w-full rounded-[4px]" style={{ height: barH, background: sc(pct), transition: "height 0.6s ease", transitionDelay: `${i * 0.05}s` }} title={`${exam.subjectName ?? ""}: ${pct}%`} />
                    <div className="max-w-full overflow-hidden text-center text-sm text-[#5C5955] truncate">
                      {exam.subjectName ? exam.subjectName.split(" ").slice(0, 10).join(" ") : `#${i + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Core performance widgets: error rate metrics, overall student performance, and difficulty band summary */}
        <div className="grid gap-3 sm:grid-cols-3 mb-5">
          <div className="overflow-hidden rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-[#F0EDE8] px-4 py-3">
              <span className="text-sm font-semibold text-[#1A1814]">Error rate per level</span>
              <span className="text-xs text-[#9B9790]">Wrong ÷ total</span>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              {diffBands.map((band, idx) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const wrong = band.total > 0 ? band.total - band.correct : 0;
                const errorRate = band.total > 0 ? Math.round((wrong / band.total) * 100) : null;
                return (
                  <div key={band.level}>
                    <div className="flex items-center gap-2">
                      <div className="w-[68px] flex-shrink-0 text-[12px] font-semibold" style={{ color: cfg.color }}>{band.level}</div>
                      <div className="flex-1 overflow-hidden rounded-[6px] bg-[#F5F3EF] h-1.5">
                        <div className="h-full rounded-[6px]" style={{ background: band.level === "Hard" ? "#F09595" : "#FECBA0", width: `${errorRate ?? 0}%`, transition: "width 0.9s cubic-bezier(.4,0,.2,1)", transitionDelay: `${idx * 0.1}s` }} />
                      </div>
                      <div className="w-[32px] text-right text-[12px] font-bold text-[#A32D2D]">
                        {errorRate != null ? `${errorRate}%` : "—"}
                      </div>
                    </div>
                    <div className="mt-1 pl-[78px] text-[10px] text-[#9B9790]">
                      {EMPTY || band.total === 0 ? "No data" : `${wrong} wrong out of ${band.total}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-[#F0EDE8] px-4 py-3">
              <span className="text-sm font-semibold text-[#1A1814]">Your performance</span>
              <span className="text-xs text-[#9B9790]">Personal stats</span>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              {loading ? (
                <div className="text-sm text-[#9B9790]">Loading...</div>
              ) : !studentSummary || totalExams === 0 ? (
                <div className="text-sm text-[#9B9790]">No exam data yet.</div>
              ) : (
                <>
                  {[
                    { label: "Total Exams", value: totalExams, suffix: "", color: "#1A1814" },
                    { label: "Average Score", value: overallScore, suffix: "%", color: sc(overallScore) },
                    { label: "Best Score", value: bestScore, suffix: "%", color: "#22A56D" },
                    { label: "Lowest Score", value: lowestScore, suffix: "%", color: "#E55012" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-[#5C5955]">{item.label}</span>
                      <span className="text-base font-bold" style={{ color: item.color }}>
                        {item.value != null ? `${item.value}${item.suffix}` : "—"}
                      </span>
                    </div>
                  ))}
                  <div className="my-1 h-px bg-[#F0EDE8]" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5C5955]">Frequently Missed Qs</span>
                    <span className={`text-base font-bold ${mistakenCount > 0 ? "text-[#A32D2D]" : "text-[#22A56D]"}`}>{mistakenCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5C5955]">Avg Attempts to Pass</span>
                    <span className={`text-base font-bold ${avgAttemptsBeforePassing >= 3 ? "text-[#A32D2D]" : avgAttemptsBeforePassing >= 2 ? "text-[#FF6014]" : "text-[#22A56D]"}`}>
                      {avgAttemptsBeforePassing > 0 ? `${avgAttemptsBeforePassing}x` : "—"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-[#F0EDE8] px-4 py-3">
              <span className="text-sm font-semibold text-[#1A1814]">Score by difficulty band</span>
              <span className="text-xs text-[#9B9790]">Correct ÷ total</span>
            </div>
            <div className="flex flex-col gap-2 px-4 py-4">
              {diffBands.map((band) => {
                const cfg = levelCfg[band.level] ?? levelCfg.Moderate;
                const score = EMPTY ? null : band.score;
                return (
                  <div key={band.level} className="flex items-center gap-2">
                    <div className="w-[68px] flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.7px]" style={{ color: cfg.color }}>{band.level}</div>
                    <div className="flex-1 overflow-hidden rounded-[6px] bg-[#F8F6F3] h-1.5">
                      <div className="h-full rounded-[6px]" style={{ background: cfg.color, width: `${score ?? 0}%`, transition: "width 0.9s ease" }} />
                    </div>
                    <div className="w-[38px] text-right text-[13px] font-bold" style={{ color: cfg.color }}>
                      {score != null ? `${score}%` : "—"}
                    </div>
                  </div>
                );
              })}
              <div className="mt-1 rounded-[8px] bg-[#F8F6F3] px-3 py-2 text-[10px] text-[#9B9790] leading-5">
                {!loading && !EMPTY && worstBand?.score != null
                  ? `${worstBand.level} is the weakest at ${worstBand.score}%. Focus here first.`
                  : "Complete an exam to see your score breakdown."}
              </div>
            </div>
          </div>
        </div>

        {/* Topic difficulty breakdown table: shows per-topic scores and average tries */}
        <div className="overflow-hidden rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm mb-5">
          <div className="flex items-center justify-between border-b border-[#F0EDE8] px-5 py-3">
            <span className="text-sm font-semibold text-[#1A1814]">Topic Difficulty Breakdown</span>
            <span className="text-xs text-[#9B9790]">Sorted by most questions answered</span>
          </div>

          {!isMobile && (
            <div className="grid grid-cols-[1fr_90px_90px_90px_110px_110px] gap-3 px-5 py-2 bg-[#F8F6F3] border-b border-[#EAE8E2]">
              {["Topic", "Easy", "Moderate", "Hard", "Overall", "Avg Tries"].map((h, i) => (
                <span key={h} className={`text-[10px] font-bold uppercase tracking-[1px] text-[#9B9790] ${i === 0 ? "text-left" : "text-center"}`}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-2 px-5 py-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-[#F5F3EF] animate-pulse" />
              ))}
            </div>
          ) : EMPTY || topics.length === 0 ? (
            <EmptyState message="No difficulty data yet. Complete at least one exam to see your breakdown by topic and difficulty level." />
          ) : (
            topics.map((t, i) => (
              <div
                key={i}
                className={`grid gap-3 p-4 ${isMobile ? "grid-cols-1 rounded-[14px] bg-white mb-3" : "grid-cols-[1fr_90px_90px_90px_110px_110px] hover:bg-[#FFFAF7]"}`}
              >
                <div>
                  <div className="text-sm font-medium text-[#1A1814]">{t.topicName}</div>
                  {isMobile && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { label: "Easy", value: t.easyScore },
                        { label: "Moderate", value: t.moderateScore },
                        { label: "Hard", value: t.hardScore },
                        { label: "Overall", value: t.overallScore },
                        { label: "Avg Tries", value: t.avgAttempts, suffix: "x" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[12px] bg-[#F8F6F3] p-3">
                          <div className="text-[10px] font-bold text-[#9B9790] mb-1">{item.label}</div>
                          <div className="text-sm font-bold" style={{ color: item.value != null ? sc(item.value) : "#9B9790" }}>
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
                      <div key={idx} className="text-center">
                        <div className="text-sm font-semibold" style={{ color: val != null ? sc(val) : "#9B9790" }}>
                          {val != null ? `${val}%` : "—"}
                        </div>
                        {val != null && (
                          <div className="mt-1 h-1.5 overflow-hidden rounded-[3px] bg-[#F5F3EF]">
                            <div className="h-full rounded-[3px]" style={{ background: sc(val), width: `${val}%`, transition: "width 1s ease" }} />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="text-center">
                      <span className="text-sm font-semibold" style={{ color: t.overallScore != null ? sc(t.overallScore) : "#9B9790" }}>
                        {t.overallScore != null ? `${t.overallScore}%` : "—"}
                      </span>
                    </div>
                    <div className="text-center">
                      {t.avgAttempts != null && t.avgAttempts > 0 ? (
                        <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${t.avgAttempts >= 3 ? "bg-[#FCEBEB] text-[#A32D2D]" : t.avgAttempts >= 2 ? "bg-[#FEF0EA] text-[#FF6014]" : "bg-[#EAF7F1] text-[#22A56D]"}`}>
                          {t.avgAttempts}x
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#9B9790]">—</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Weakest topic callout card: shows the student's weakest subject if available */}
        {!loading && weakestTopic?.name && weakestTopic.name !== "N/A" && (
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[14px] border border-[#FECBA0] bg-[#FEF0EA] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FF6014] text-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3L10 11M10 14L10 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#FF6014]">Focus Area: {weakestTopic.name}</div>
              <div className="mt-1 text-sm text-[#9B5A30]">This is your weakest subject based on your exam history. Spend extra time reviewing it.</div>
            </div>
          </div>
        )}

        {/* Score colour guide: quick legend for performance bands */}
        {!loading && !EMPTY && topics.length > 0 && (
          <div className="rounded-[14px] border border-[#EAE8E2] bg-white shadow-sm p-4">
            <div className="mb-2 text-sm font-semibold text-[#1A1814]">Score colour guide</div>
            <div className="flex flex-wrap gap-5">
              {[
                { color: "#22A56D", label: "≥ 75% — Strong" },
                { color: "#FF6014", label: "60–74% — Developing" },
                { color: "#E55012", label: "< 60% — Needs Work" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  <span className="text-sm text-[#5C5955]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable empty state helper when no topic analytics are available.
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center gap-2 rounded-[14px] bg-white px-5 py-12 text-center">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2" />
      <path d="M12 28l4-8 4 4 4-10 4 6" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="max-w-[300px] text-sm leading-6 text-[#9B9790]">{message}</div>
  </div>
);

export default DifficultyAnalytics;