import { useState, useEffect } from "react";    //this is for mastery analytics page
import { useNavigate } from "react-router-dom";

const tierLabel = (pct) => {
  if (pct == null) return { label: "No Data",   color: "#9B9790", bg: "#F5F3EF", border: "#EAE8E2" };
  if (pct >= 80)   return { label: "Mastered",   color: "#22A56D", bg: "#EAF7F1", border: "#B7E4CC" };
  if (pct >= 70)   return { label: "Proficient", color: "#3B8BD4", bg: "#E8F0FE", border: "#A8C8F0" };
  if (pct >= 60)   return { label: "Developing", color: "#FF6014", bg: "#FEF0EA", border: "#FECBA0" };
  return               { label: "Needs Work",  color: "#A32D2D", bg: "#FCEBEB", border: "#F5BDBD" };
};

const sc = (pct) => pct >= 75 ? "#22A56D" : pct >= 60 ? "#FF6014" : "#E55012";

const MasteryAnalytics = () => {
  const navigate   = useNavigate();
  const apiUrl     = import.meta.env.VITE_API_BASE_URL;
  const [loading,  setLoading]  = useState(true);
  const [data,     setData]     = useState(null);
  const [sortBy,   setSortBy]   = useState("score"); // score | name | tier
  const [filterTier, setFilterTier] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const res   = await fetch(`${apiUrl}/practice-exam/mastery-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [apiUrl]);

  const EMPTY  = !loading && !data;
  const topics = data?.topics || [];

  // sort + filter
  let display = [...topics];
  if (filterTier !== "all") display = display.filter(t => tierLabel(t.score).label.toLowerCase() === filterTier);
  if (sortBy === "score") display.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  else if (sortBy === "name") display.sort((a, b) => (a.topicName || "").localeCompare(b.topicName || ""));

  const masteredCount  = topics.filter(t => (t.score ?? 0) >= 80).length;
  const needsWorkCount = topics.filter(t => (t.score ?? 0) <  60 && t.score != null).length;
  const avgMastery     = topics.length && topics.some(t => t.score != null)
    ? Math.round(topics.filter(t => t.score != null).reduce((s, t) => s + t.score, 0) / topics.filter(t => t.score != null).length)
    : null;

  const TIERS = ["all", "mastered", "proficient", "developing", "needs work"];

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EAE8E2", padding: "16px 28px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => navigate("/student-dashboard")}
          style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #EAE8E2", background: "#F5F3EF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8"><polyline points="10,3 5,8 10,13"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814" }}>Topic Mastery</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>Mastered · Proficient · Developing · Needs Work</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Topics",    value: loading ? "—" : topics.length || 0,                           accent: "#FF6014" },
            { label: "Mastered",        value: loading ? "—" : masteredCount,                                 accent: "#22A56D" },
            { label: "Needs Work",      value: loading ? "—" : needsWorkCount,                                accent: "#A32D2D" },
            { label: "Avg Mastery",     value: loading ? "—" : avgMastery != null ? `${avgMastery}%` : "0%",  accent: "#3B8BD4" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #EAE8E2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }}/>
              <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1814", lineHeight: 1, letterSpacing: -1 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* TIER SUMMARY PILLS */}
        {!loading && !EMPTY && topics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { tier: "Mastered",   color: "#22A56D", bg: "#EAF7F1", count: masteredCount },
              { tier: "Proficient", color: "#3B8BD4", bg: "#E8F0FE", count: topics.filter(t => (t.score??0)>=70&&(t.score??0)<80).length },
              { tier: "Developing", color: "#FF6014", bg: "#FEF0EA", count: topics.filter(t => (t.score??0)>=60&&(t.score??0)<70).length },
              { tier: "Needs Work", color: "#A32D2D", bg: "#FCEBEB", count: needsWorkCount },
            ].map(tier => (
              <div key={tier.tier} style={{ background: tier.bg, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>{tier.tier}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: tier.color }}>{tier.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* MAIN TABLE */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1814" }}>All Topics</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Tier filter */}
              <div style={{ display: "flex", gap: 4 }}>
                {TIERS.map(t => (
                  <button key={t} onClick={() => setFilterTier(t)}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                      background:  filterTier === t ? "#1A1814" : "#fff",
                      color:       filterTier === t ? "#fff"    : "#9B9790",
                      borderColor: filterTier === t ? "#1A1814" : "#EAE8E2" }}>
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ fontSize: 12, border: "1px solid #EAE8E2", borderRadius: 8, padding: "4px 8px", color: "#5C5955", background: "#fff", cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
                <option value="score">Sort: Score</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 80px 130px", gap: 12, padding: "10px 20px", background: "#F8F6F3" }}>
            {["Topic / Subject", "Progress", "Score", "Tier"].map((h, i) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9B9790", textTransform: "uppercase", letterSpacing: "1px", textAlign: i === 0 ? "left" : "center" }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: 44, borderRadius: 8, background: "#F5F3EF", marginBottom: 8, animation: "pulse 1.5s infinite" }}/>)}
            </div>
          ) : EMPTY || display.length === 0 ? (
            <EmptyState message={EMPTY
              ? "No mastery data yet. Complete practice exams to see your topic mastery levels."
              : `No topics match the "${filterTier}" filter.`}/>
          ) : (
            display.map((t, i) => {
              const tier = tierLabel(t.score);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 200px 80px 130px", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F8F6F3", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FFFAF7"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814" }}>{t.topicName}</div>
                    {t.subjectName && <div style={{ fontSize: 11, color: "#9B9790", marginTop: 1 }}>{t.subjectName}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 7, background: "#F0EDE8", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${t.score ?? 0}%`, background: sc(t.score ?? 0), borderRadius: 10, transition: "width 0.5s ease" }}/>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: sc(t.score ?? 0) }}>
                    {t.score != null ? `${t.score}%` : "—"}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                      {tier.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RECOMMENDATIONS */}
        {!loading && !EMPTY && needsWorkCount > 0 && (
          <div style={{ marginTop: 18, background: "#FCEBEB", border: "1px solid #F5BDBD", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#A32D2D" strokeWidth="1.6"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="#A32D2D" stroke="none"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#A32D2D" }}>Focus Areas — Needs Work</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {topics.filter(t => (t.score ?? 0) < 60 && t.score != null).map((t, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, background: "#fff", color: "#A32D2D", border: "1px solid #F5BDBD" }}>
                  {t.topicName}
                </span>
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
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2"/><path d="M14 20h4l2-6 3 12 2-8 2 4h3" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div style={{ fontSize: 13, color: "#9B9790", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>{message}</div>
  </div>
);

export default MasteryAnalytics;
