import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// new added: moved TABS config outside component to avoid re-creation on every render
const TABS = [
  {
    id:    "viewed",
    label: "Most Viewed",
    icon:  "👁",
    accent: "#FF6014",
    soft:   "#FEF0EA",
    softText: "#C44A0C",
    unit:  "views",
    hint:  "Lessons you opened the most",
  },
  {
    id:    "attempted",
    label: "Most Attempted",
    icon:  "🎯",
    accent: "#3B8BD4",
    soft:   "#EBF4FD",
    softText: "#1A5FA0",
    unit:  "attempts",
    hint:  "Questions you practiced the most",
  },
  {
    id:    "errors",
    label: "Error Rate",
    icon:  "⚠️",
    accent: "#E55012",
    soft:   "#FCEBEB",
    softText: "#B03A0E",
    unit:  "error %",
    hint:  "Questions you get wrong most often",
  },
  {
    id:    "skipped",
    label: "Skipped",
    icon:  "⏭️",
    accent: "#7F77DD",
    soft:   "#F0EFFD",
    softText: "#5249B0",
    unit:  "skips",
    hint:  "Topics you skipped the most",
  },
];

const RANK_COLORS = ["#FF6014", "#9B9790", "#C8955A"];

const ContentAnalytics = () => {
  const navigate   = useNavigate();
  const apiUrl     = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading]   = useState(true);
  const [data,    setData]      = useState(null);
  const [tab,     setTab]       = useState("viewed");

  // new added: added mobile detection state for responsive layout
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // new added: renamed resize handler to onResize for consistency
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

      // new added: reformatted catch/finally to multiline for readability
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);


  // new added: replaced separate flat arrays with a unified itemsMap object;
  // each tab now has name, value, sub (display label), and display (formatted value)
  // data source: GET /practice-exam/content-analytics
  //   → mostViewed, mostAttempted, highestError, mostSkipped
  // ── Normalize data per tab ───────────────────────────────────────────────
  const itemsMap = {

    // new added: added fallback display names when API returns null/undefined
    viewed: (data?.mostViewed || []).map(i => ({
      name:    i.lessonName || "Unknown Lesson",  // viewed
      value:   i.views,

      // new added: added sub (secondary label) and display (formatted value pill text) per item
      sub:     `${i.views} view${i.views !== 1 ? "s" : ""}`,  
      display: String(i.views),
    })),
    attempted: (data?.mostAttempted || []).map(i => ({
      //name:    `Question #${i.questionId}`,
      name:    i.questionText || `Question #${i.questionId}`, // attempted & errors
      value:   i.count,
      sub:     `${i.count} attempt${i.count !== 1 ? "s" : ""}`,
      display: String(i.count),
    })),
    errors: (data?.highestError || []).map(i => ({
      //name:    `Question #${i.questionId}`,
      name:    i.questionText || `Question #${i.questionId}`,
      value:   i.rate,
      sub:     `${i.totalWrong} wrong / ${i.totalTries} tries`,
      display: `${(i.rate * 100).toFixed(1)}%`,
    })),
    skipped: (data?.mostSkipped || []).map(i => ({
      name:    i.name || "Unknown Topic",   // skipped
      value:   i.skipped_count,
      sub:     `${i.skipped_count} skip${i.skipped_count !== 1 ? "s" : ""}`,
      display: String(i.skipped_count),
    })),
  };


  // new added: extracted stat card data into a stats array with icon and color config
  // data source: GET /practice-exam/content-analytics
  //   → totalViews, totalAttempts, avgErrorRate, totalSkipped
  const stats = [
    { label: "Lessons Viewed",      value: data?.totalViews    ?? 0, icon: "📖", accent: "#FF6014", soft: "#FEF0EA" },
    { label: "Questions Attempted", value: data?.totalAttempts ?? 0, icon: "✏️", accent: "#3B8BD4", soft: "#EBF4FD" },
    { label: "Avg Error Rate",      value: data?.avgErrorRate != null ? `${data.avgErrorRate}%` : "0%", icon: "❌", accent: "#E55012", soft: "#FCEBEB" },
    { label: "Topics Skipped",      value: data?.totalSkipped  ?? 0, icon: "⏭️", accent: "#7F77DD", soft: "#F0EFFD" },
  ];

  // new added: added fallback to TABS[0] if tab not found; items now pulled from itemsMap
  const current = TABS.find(t => t.id === tab) ?? TABS[0];
  const items   = itemsMap[tab] ?? [];
  const maxVal  = items.length ? Math.max(...items.map(i => i.value ?? 0)) : 1;

  return (
    <div style={{
      background:  "#F5F3EF",
      minHeight:   "100vh",
      fontFamily:  "'Segoe UI', system-ui, sans-serif",
      overflowX:   "hidden",  // new added: prevents horizontal overflow on mobile
      maxWidth:    "100vw",
    }}>

      
      
      {/* // new added: made top bar sticky (position: sticky, top: 0, zIndex: 10)
          // new added: updated padding to handle mobile top notch (60px top on mobile)
          // new added: changed subtitle from long description to "Your personal learning data"
          // new added: added flex: 1 and minWidth: 0 to title container to prevent overflow
      */}
      {/* ── TOP BAR ── */}
      <div style={{
        background:   "#fff",
        borderBottom: "1px solid #EAE8E2",
        padding:      isMobile ? "60px 16px 14px" : "16px 28px",
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        position:     "sticky",
        top:          0,
        zIndex:       10,
      }}>

        <div style={{ flex: 1, minWidth: 0 }}>

          {/*new added: slightly reduced font sizes in top bar for tighter layout*/}
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1814" }}>My Content</div>
          <div style={{ fontSize: 11, color: "#9B9790" }}>Your personal learning data</div>
        </div>
        
        {/* new added: added last updated date badge in top bar, shown only when data is loaded*/}
        {/* Last updated badge */}
        {!loading && data && (
          <div style={{
            fontSize: 10, color: "#9B9790",
            background: "#F5F3EF",
            border: "1px solid #EAE8E2",
            borderRadius: 20,
            padding: "3px 10px",
            whiteSpace: "nowrap",
          }}>
            Updated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? "16px 16px 100px" : "24px 28px 100px" }}>

        {/* ── STAT CARDS ── */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
          gap:                 12,
          marginBottom:        20,
        }}>

          {/* // new added: replaced inline stat card markup with reusable StatCard component
              // new added: StatCard now includes an icon, loading skeleton, and accent color strip
          */}
          {stats.map(s => (
            <StatCard key={s.label} s={s} loading={loading}/>
          ))}
        </div>

        {/* ── TAB ROW ── */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: `repeat(${TABS.length},1fr)`,
          gap:                 8,
          marginBottom:        16,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding:       "12px 6px",
                borderRadius:  12,
                border:        tab === t.id ? `1.5px solid ${t.accent}40` : "1.5px solid #EAE8E2",
                background:    tab === t.id ? t.soft : "#fff",
                cursor:        "pointer",
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           5,
                transition:    "all 0.15s",
                fontFamily:    "inherit",
              }}
            >
              <span style={{ fontSize: isMobile ? 18 : 20, lineHeight: 1 }}>{t.icon}</span>
              <span style={{
                fontSize:   isMobile ? 10 : 11,
                fontWeight: 600,
                color:      tab === t.id ? t.accent : "#9B9790",
                textAlign:  "center",
                lineHeight: 1.3,
              }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── LIST CARD ── */}
        <div style={{
          background:   "#fff",
          borderRadius: 16,
          border:       "1px solid #EAE8E2",
          overflow:     "hidden",
          marginBottom: 16,
        }}>
          {/* Card header */}
          <div style={{
            padding:      "14px 20px",
            borderBottom: "1px solid #F0EDE8",
            display:      "flex",
            alignItems:   "center",
            gap:          12,
            background:   current.soft + "55",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: current.soft,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              {current.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1814" }}>{current.label}</div>
              <div style={{ fontSize: 11, color: "#9B9790", marginTop: 1 }}>{current.hint}</div>
            </div>
            {!loading && (
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: current.softText,
                background: current.soft,
                border: `1px solid ${current.accent}30`,
                borderRadius: 20,
                padding: "2px 10px",
              }}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </div>
            )}
          </div>

          {/* List body */}
          <div>
            {loading ? (

              // new added: replaced inline loading skeleton with reusable SkeletonList component
              // new added: skeleton items increased from 6 → 5 with staggered animation delay
              <SkeletonList/>
            ) : items.length === 0 ? (

              // new added: EmptyState now accepts a label prop instead of a full message string
              // new added: added a title "No data yet" above the sub-text
              <EmptyState label={current.label}/>
            ) : (
              items.map((item, i) => {
                const barPct = maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0;
                const rankBg = i < 3 ? RANK_COLORS[i] : "#F0EDE8";
                const rankTx = i < 3 ? "#fff" : "#9B9790";

                return (
                  <div
                    key={i}
                    style={{
                      display:      "flex",
                      alignItems:   "center",
                      gap:          12,
                      padding:      "13px 20px",
                      borderBottom: i < items.length - 1 ? "1px solid #F8F6F3" : "none",
                      transition:   "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Rank badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: rankBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: rankTx,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>

                    {/* Name + bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: "#1A1814",
                        marginBottom: 6,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          flex: 1, height: 4,
                          background: "#F0EDE8", borderRadius: 4, overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%",
                            width:  `${barPct}%`,
                            background: current.accent,
                            borderRadius: 4,
                            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
                          }}/>
                        </div>
                        <div style={{ fontSize: 10, color: "#9B9790", flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    {/* Value pill */}
                    <div style={{
                      padding:    "5px 12px",
                      borderRadius: 20,
                      background: current.soft,
                      fontSize:   13, fontWeight: 700,
                      color:      current.accent,
                      flexShrink: 0,
                      minWidth:   44,
                      textAlign:  "center",
                    }}>
                      {item.display}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* new added: slightly reduced pulse animation low opacity for subtler skeleton effect*/}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────────── */

const StatCard = ({ s, loading }) => (
  <div style={{
    background:   "#fff",
    borderRadius: 14,
    padding:      "14px 16px",
    border:       "1px solid #EAE8E2",
    position:     "relative",
    overflow:     "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      height: 3, background: s.accent,
      borderRadius: "14px 14px 0 0",
    }}/>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: s.soft,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, marginBottom: 10,
    }}>
      {s.icon}
    </div>
    <div style={{
      fontSize: 10, color: "#9B9790",
      fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.5px", marginBottom: 4,
    }}>
      {s.label}
    </div>
    {loading ? (
      <div style={{
        height: 28, width: "60%", borderRadius: 6,
        background: "#F0EDE8", animation: "pulse 1.4s infinite",
      }}/>
    ) : (
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1A1814", letterSpacing: -1 }}>
        {s.value}
      </div>
    )}
  </div>
);

const SkeletonList = () => (
  <div style={{ padding: "12px 20px" }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{
        height: 54, borderRadius: 10, background: "#F5F3EF",
        marginBottom: 8, animation: "pulse 1.4s infinite",
        animationDelay: `${i * 0.08}s`,
      }}/>
    ))}
  </div>
);

const EmptyState = ({ label }) => (
  <div style={{
    padding: "48px 0",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
  }}>
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="21" stroke="#EAE8E2" strokeWidth="1.5"/>
      <path d="M14 22h16M14 16h16M14 28h9" stroke="#D4D0C8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#5C5955" }}>No data yet</div>
    <div style={{ fontSize: 12, color: "#9B9790", textAlign: "center", maxWidth: 220, lineHeight: 1.6 }}>
      Start practicing to see your {label.toLowerCase()} data here.
    </div>
  </div>
);

export default ContentAnalytics;
