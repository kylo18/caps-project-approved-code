import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ContentAnalytics = () => {
  const navigate  = useNavigate();
  const apiUrl    = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);
  const [tab,     setTab]     = useState("viewed");
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
        const res   = await fetch(`${apiUrl}/practice-exam/content-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [apiUrl]);

  const EMPTY = !loading && !data;

  // ── Normalize each tab's items to a unified { name, value } shape ──
  const viewed    = (data?.mostViewed    || []).map(i => ({ name: i.lessonName,    value: i.views         }));
  const attempted = (data?.mostAttempted || []).map(i => ({ name: i.questionText,  value: i.count         }));
  const errors    = (data?.highestError  || []).map(i => ({ name: i.questionText,  value: i.rate          }));
  const skipped   = (data?.mostSkipped   || []).map(i => ({ name: i.name,          value: i.skipped_count }));

  const TABS = [
    { id: "viewed",    label: "Most Viewed",        color: "#FF6014", items: viewed    },
    { id: "attempted", label: "Most Attempted",     color: "#3B8BD4", items: attempted },
    { id: "errors",    label: "Highest Error Rate", color: "#E55012", items: errors    },
    { id: "skipped",   label: "Most Skipped",       color: "#7F77DD", items: skipped   },
  ];

  const current = TABS.find(t => t.id === tab);
  const maxVal  = current?.items?.length ? Math.max(...current.items.map(i => i.value ?? 0)) : 1;

  return (
    <div style={{ background: "#F5F3EF", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EAE8E2", padding: isMobile ? "16px 16px" : "16px 28px", paddingTop: isMobile ? "60px" : "16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/student-dashboard")}
          style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #EAE8E2", background: "#F5F3EF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5C5955" strokeWidth="1.8"><polyline points="10,3 5,8 10,13"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1814" }}>Content Analytics</div>
          <div style={{ fontSize: 12, color: "#9B9790" }}>Lessons viewed, questions attempted, errors, and skipped topics</div>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 16px 100px" : "24px 28px", paddingBottom: 100 }}>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Lessons Viewed",      value: loading ? "—" : data?.totalViews    ?? 0,                                          accent: "#FF6014" },
            { label: "Questions Attempted", value: loading ? "—" : data?.totalAttempts ?? 0,                                          accent: "#3B8BD4" },
            { label: "Avg Error Rate",      value: loading ? "—" : data?.avgErrorRate  != null ? `${data.avgErrorRate}%` : "0%",      accent: "#E55012" },
            { label: "Topics Skipped",      value: loading ? "—" : data?.totalSkipped  ?? 0,                                          accent: "#7F77DD" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #EAE8E2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }}/>
              <div style={{ fontSize: 11, color: "#9B9790", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1814", lineHeight: 1, letterSpacing: -1 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* MAIN CARD */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #F0EDE8" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1814", marginBottom: 12 }}>Content Breakdown</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ fontSize: 12, fontWeight: 500, padding: "8px 16px", cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit",
                    color:        tab === t.id ? t.color : "#9B9790",
                    borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
                    marginBottom: -1, transition: "all 0.15s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 44, borderRadius: 8, background: "#F5F3EF", marginBottom: 8, animation: "pulse 1.5s infinite" }}/>
              ))
            ) : EMPTY || current.items.length === 0 ? (
              <EmptyState message={`No ${current.label.toLowerCase()} data yet. Start taking exams to populate this section.`}/>
            ) : (
              current.items.map((item, i) => {
                const val    = item.value ?? 0;
                const barPct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
                const display = tab === "errors"
                  ? `${(val * 100).toFixed(1)}%`   // rate is 0.0–1.0 from backend
                  : val;

                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F8F6F3" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#B4B2A9", width: 24, flexShrink: 0, textAlign: "center" }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1814", marginBottom: 4 }}>{item.name || "—"}</div>
                      <div style={{ height: 5, background: "#F0EDE8", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barPct}%`, background: current.color, borderRadius: 4, transition: "width 0.5s ease" }}/>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: current.color, flexShrink: 0, minWidth: 40, textAlign: "right" }}>
                      {display}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* INFO BOX */}
        <div style={{ marginTop: 18, background: "#fff", borderRadius: 14, border: "1px solid #EAE8E2", padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1814", marginBottom: 10 }}>What does this mean?</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            {[
              { color: "#FF6014", title: "Most Viewed Lessons",        desc: "Lessons you opened the most. These are your primary study materials." },
              { color: "#3B8BD4", title: "Most Attempted Questions",   desc: "Questions you practiced the most — usually ones you found challenging." },
              { color: "#E55012", title: "Highest Error Rate",         desc: "Questions where you got the wrong answer most often. Focus here!" },
              { color: "#7F77DD", title: "Most Skipped Topics",        desc: "Topics you avoided. Skipping leads to gaps — review these soon." },
            ].map(info => (
              <div key={info.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, flexShrink: 0, marginTop: 4 }}/>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1814", marginBottom: 2 }}>{info.title}</div>
                  <div style={{ fontSize: 11, color: "#9B9790", lineHeight: 1.5 }}>{info.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="19" stroke="#EAE8E2" strokeWidth="2"/><path d="M13 20h14M13 14h14M13 26h8" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round"/></svg>
    <div style={{ fontSize: 13, color: "#9B9790", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{message}</div>
  </div>
);
//yes

export default ContentAnalytics;