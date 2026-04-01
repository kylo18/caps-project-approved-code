import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// ─── MENU CARDS CONFIG ────────────────────────────────────────────────────────
const MAIN_ITEMS = [
  {
    label: "Home",
    sub: null,
    color: "#fff7ed",
    iconColor: "#FF6014",
    path: null, // active state — current page
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="1" y="9" width="4" height="6" rx="1"/>
        <rect x="6" y="5" width="4" height="10" rx="1"/>
        <rect x="11" y="1" width="4" height="14" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Sessions",
    sub: null,
    color: "#f0fdf4",
    iconColor: "#16a34a",
    path: "/sessions",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="8" cy="5" r="3"/>
        <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/>
      </svg>
    ),
  },
  {
    label: "Classes",
    sub: null,
    color: "#eff6ff",
    iconColor: "#2563eb",
    path: "/class",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="3" width="12" height="10" rx="2"/>
        <line x1="2" y1="7" x2="14" y2="7"/>
        <line x1="6" y1="3" x2="6" y2="7"/>
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    sub: null,
    color: "#fdf4ff",
    iconColor: "#9333ea",
    path: "/leaderboard",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="1" y="10" width="3" height="5" rx="1"/>
        <rect x="6" y="6" width="3" height="9" rx="1"/>
        <rect x="11" y="2" width="3" height="13" rx="1"/>
      </svg>
    ),
  },
];

const ANALYTICS_ITEMS = [
  {
    label: "Achievement",
    sub: null,
    color: "#fef3c7",
    iconColor: "#d97706",
    path: "/score-history",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <polyline points="2,12 5,8 8,10 11,5 14,7"/>
      </svg>
    ),
  },
  {
    label: "Content",
    sub: null,
    color: "#fce7f3",
    iconColor: "#db2777",
    path: "/analytics/content",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M3 2h8l2 2v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
        <line x1="5" y1="6" x2="11" y2="6"/>
        <line x1="5" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    label: "Difficulty",
    sub: null,
    color: "#f0fdf4",
    iconColor: "#16a34a",
    path: "/analytics/difficulty",
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="8" cy="8" r="6"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <circle cx="8" cy="11" r="0.5" fill={color} stroke="none"/>
      </svg>
    ),
  },
  {
    label: "Notifications",
    sub: "Coming soon",
    color: "#eff6ff",
    iconColor: "#2563eb",
    underDev: true,
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M8 1a5 5 0 015 5c0 3 1 4 1 4H2s1-1 1-4a5 5 0 015-5z"/>
        <line x1="6.5" y1="14" x2="9.5" y2="14" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ─── UNDER DEV MODAL ──────────────────────────────────────────────────────────
const UnderDevModal = ({ label, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 24px",
  }}>
    <div style={{
      background: "#fff", borderRadius: 20, padding: "28px 24px",
      width: "100%", maxWidth: 300,
      display: "flex", flexDirection: "column", alignItems: "center",
      animation: "fadeUp 0.2s ease",
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: "#fff7ed",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6014" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 4 }}>
        Under Development
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#FF6014", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
        This feature is currently being built and will be available in a future update.
      </div>
      <button
        onClick={onClose}
        style={{
          width: "100%", background: "#FF6014", color: "#fff",
          border: "none", borderRadius: 12, padding: "10px 0",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}
      >
        Got it
      </button>
    </div>
    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>
);

// ─── MENU CARD ────────────────────────────────────────────────────────────────
const MenuCard = ({ item, isActive, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: isActive ? item.color : "#f8f9fa",
      border: isActive ? `1.5px solid ${item.iconColor}33` : "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "14px 12px",
      display: "flex", flexDirection: "column", gap: 8,
      cursor: "pointer",
      transition: "all 0.15s",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Coming soon badge */}
    {item.sub && (
      <div style={{
        position: "absolute", top: 8, right: 8,
        fontSize: 9, fontWeight: 700,
        background: "#f3f4f6", color: "#9ca3af",
        padding: "2px 6px", borderRadius: 6,
      }}>
        Soon
      </div>
    )}
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: isActive ? "#fff" : item.color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {item.icon(item.iconColor)}
    </div>
    <div>
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: isActive ? item.iconColor : "#374151",
      }}>
        {item.label}
      </div>
      {item.sub && (
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
          {item.sub}
        </div>
      )}
    </div>
  </div>
);

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, color: "#9ca3af",
    letterSpacing: "1.5px", marginBottom: 10, marginTop: 6,
    paddingLeft: 25,
  }}>
    {children}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const MobileDash = ({
  userName = "Student",
  searchQuery,
  setSearchQuery,
  subjects = [],
  subjectsLoading = false,
  ongoingExam,
  onContinueExam,
  onExplore,
  generatingFor,
}) => {
  const navigate  = useNavigate();
  const [underDev, setUnderDev] = useState(null);
  const [active,   setActive]   = useState("Home");

  const handleCardClick = (item) => {
    if (item.underDev) {
      setUnderDev(item.label);
      return;
    }
    if (item.path) {
      navigate(item.path);
    } else {
      setActive(item.label);
    }
  };

  return (
    <div style={{
      background: "#fff",
      minHeight: "100vh",
      paddingBottom: 100,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── HERO ── */}
      <div style={{ padding: "69px 20px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0 }}>
          Hello, <span style={{ color: "#FF6014" }}>{userName}!</span>
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 18px", lineHeight: 1.5 }}>
          What would you like to learn today?
        </p>

        

        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: "#1a1a2e", borderRadius: 30,
            padding: "0 14px", height: 44,
            boxShadow: "0 4px 12px rgba(255,96,20,0.15)",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="4"/><line x1="10" y1="10" x2="13" y2="13"/>
            </svg>
            <input
              type="text"
              placeholder="Search for subjects.."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: "#fff", fontSize: 13,
                padding: "0 10px",
              }}
            />
          </div>
          <button
            style={{
              width: 44, height: 44, background: "#FF6014",
              borderRadius: 12, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="7" cy="7" r="4"/><line x1="10" y1="10" x2="13" y2="13"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── BROWSE DIVIDER ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 20px", marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }}/>
        <span style={{ fontSize: 13, color: "#6b7280", padding: "0 10px" }}>
          Browse subjects for <strong style={{ color: "#111", borderBottom: "2px solid #111" }}>JRMSU</strong>
        </span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }}/>
      </div>

      {/* Default state — show subjects */}
      {(
        <>
          <SectionLabel>{searchQuery 
            ? "SUBJECTS" 
            : "AVAILABLE SUBJECTS"}</SectionLabel>
          {subjectsLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div style={{
              border: "1.5px dashed #e5e7eb", borderRadius: 14,
              padding: "32px 16px", textAlign: "center",
              color: "#9ca3af", fontSize: 13,
            }}>
              {searchQuery ? `No subjects found for "${searchQuery}"` : "No subjects available."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjects.map(subject => (
                <div
                  key={subject.subjectID}
                  style={{
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: 14, padding: "14px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                      {subject.subjectName}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {subject.subjectCode} · {subject.programName}
                    </div>
                  </div>
                  <button
                    onClick={() => onExplore(subject)}
                    disabled={generatingFor === subject.subjectID}
                    style={{
                      background: "#FF6014", color: "#fff",
                      border: "none", borderRadius: 10,
                      padding: "8px 14px", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", flexShrink: 0,
                      opacity: generatingFor === subject.subjectID ? 0.6 : 1,
                    }}
                  >
                    {generatingFor === subject.subjectID ? "..." : "Start"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ONGOING EXAM BANNER ── */}
      {ongoingExam && (
        <div style={{
          margin: "0 20px 16px",
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 14, padding: "12px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Exam in Progress</div>
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
              {ongoingExam.examData?.subjectName || `Subject ${ongoingExam.subjectID}`} — progress saved.
            </div>
          </div>
          <button
            onClick={onContinueExam}
            style={{
              background: "#FF6014", color: "#fff", border: "none",
              borderRadius: 10, padding: "7px 14px", fontSize: 12,
              fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ padding: "0 20px" }}>

        {/* MAIN section */}
        <SectionLabel>MAIN</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {MAIN_ITEMS.map(item => (
            <MenuCard
              key={item.label}
              item={item}
              isActive={active === item.label}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>

        {/* ANALYTICS section */}
        <SectionLabel>ANALYTICS & SYSTEM</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {ANALYTICS_ITEMS.map(item => (
            <MenuCard
              key={item.label}
              item={item}
              isActive={false}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      </div>

      {/* ── UNDER DEV MODAL ── */}
      {underDev && (
        <UnderDevModal label={underDev} onClose={() => setUnderDev(null)} />
      )}
    </div>
  );
};

export default MobileDash;
