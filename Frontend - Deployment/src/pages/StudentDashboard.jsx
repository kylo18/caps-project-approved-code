import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import MobileDash from "./MobileDash";

/* ── helpers ─────────────────────────────────────────────────── */
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase();

const scoreColor = (pct) => {
  if (pct == null) return "#9B9790";
  if (pct >= 80) return "#22A56D";
  if (pct >= 60) return "#FF6014";
  return "#E55012";
};

const tierLabel = (pct) => {
  if (pct == null) return { label: "No Data",   color: "#9B9790", bg: "#F5F3EF" };
  if (pct >= 80)   return { label: "Mastered",   color: "#22A56D", bg: "#EAF7F1" };
  if (pct >= 70)   return { label: "Proficient", color: "#3B8BD4", bg: "#E8F0FE" };
  if (pct >= 60)   return { label: "Developing", color: "#FF6014", bg: "#FEF0EA" };
  return               { label: "Needs Work",  color: "#A32D2D", bg: "#FCEBEB" };
};

/* ── subject-card helpers (unchanged from original) ─────────── */
const ICON_COLORS = [
  { bg: "#fff7ed", iconColor: "#f97316" },
  { bg: "#eff6ff", iconColor: "#3b82f6" },
  { bg: "#f0fdf4", iconColor: "#22c55e" },
  { bg: "#fdf4ff", iconColor: "#a855f7" },
  { bg: "#fef2f2", iconColor: "#ef4444" },
  { bg: "#f0fdfa", iconColor: "#14b8a6" },
];
const SUBJECT_ICONS = [
  "bx bx-book","bx bx-calculator","bx bx-dna","bx bx-globe",
  "bx bx-heart-plus","bx bx-code","bx bx-palette","bx bx-music",
  "bx bx-chart-sine","bx bx-briefcase-alt","bx bx-leaf",
];
const getCardStyle = (subjectID) => {
  const n = parseInt(subjectID, 10) || 0;
  return { icon: SUBJECT_ICONS[n % SUBJECT_ICONS.length], ...ICON_COLORS[n % ICON_COLORS.length] };
};
const PROGRAM_NAMES = {
  GE:"General Subject", CpE:"Computer Engineering", CE:"Civil Engineering",
  ECE:"Electronics & Communications Engineering", EE:"Electrical Engineering",
  ABE:"Agricultural and Biosystems Engineering",
};
const expandProgram = (name) => {
  if (!name) return "—";
  if (PROGRAM_NAMES[name]) return PROGRAM_NAMES[name];
  if (/^(BS|AB|BEd|BEEd|Bachelor)\b/.test(name)) return name;
  return name;
};


/* ── new added: Discord-style hover dropdown ────────────────────────────── */
const NavDropdown = ({ label, items }) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button style={{  
        background: open ? "rgba(255,255,255,0.1)" : "none",
        border: "none", cursor: "pointer",
        padding: "6px 12px", borderRadius: 8,
        color: open ? "#fff" : "rgba(255,255,255,0.7)",
        fontSize: 18, fontWeight: 500, fontFamily: "inherit", //font for main, analytics, support dropdowns
        display: "flex", alignItems: "center", gap: 5,
        transition: "background 0.15s, color 0.15s",
      }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="2,3 5,7 8,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1E3A6E", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "6px", minWidth: 180,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          animation: "userMenuFadeIn 0.15s ease",
          zIndex: 100,
        }}>
          {/* Little arrow pointer */}
          <div style={{
            position: "absolute", top: -6, left: "50%",
            transform: "translateX(-50%)",
            width: 10, height: 6, overflow: "hidden",
          }}>
            <div style={{
              width: 10, height: 10,
              background: "#1E3A6E",
              border: "1px solid rgba(255,255,255,0.1)",
              transform: "rotate(45deg) translate(2px, 2px)",
            }}/>
          </div>

          {items.map((item, i) => (
            <button key={i} onClick={item.onClick} style={{
              display: "block", width: "100%", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 14px", borderRadius: 7,
              fontSize: 13, color: "rgba(255,255,255,0.8)",
              fontFamily: "inherit", fontWeight: 450,
              transition: "background 0.12s, color 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── tiny shared UI pieces ───────────────────────────────────── */
const Card = ({ children, style = {} }) => ( //boxes colors and shadows
  <div style={{ 
        background: "linear-gradient(160deg, rgb(48, 145, 230) 0%, rgba(37, 27, 231, 0.96) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 32, 
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
        overflow: "hidden", 
        color: "#fff", 
        width: "100%", 
      ...style }}>
    {children}
  </div>
);

const CardHead = ({ title, action, onAction }) => ( //new added: for card headers in dashboards achievements, score analytics, pass vs fail sections
  <div style={{ 
    padding:"14px 20px 12px", 
    display:"flex", 
    alignItems:"center", 
    justifyContent:"space-between", 
    borderBottom:"1px solid #F0EDE8" }}>

    <span style={{ 
      fontSize:23, 
      fontWeight:600, 
      color:"#ffffff" }}>{title}</span>
    {action && <span 
      onClick={onAction} 
      style={{ 
        fontSize:16, 
        color:"#000000",      //full report button color
        cursor:"pointer", 
        fontWeight:500 }}>{action}</span>}
  </div>
);
const CardBody = ({ children, style = {} }) => (
  <div style={{ padding:"16px 20px", ...style }}>{children}</div>
);
const SectionLabel = ({ children, padding = "120px 0" }) => (
  <div style={{ 
    padding,
    fontSize:30, 
    fontWeight:600, 
    color:"rgb(255, 255, 255)", 
    textTransform:"uppercase", 
    letterSpacing:"0.8px", 
    marginBottom:12, 
    marginTop:4,
    textAlign:"center",}}>
    {children}
  </div>
);
const Skeleton = ({ w="100%", h=14, r=8, style={} }) => (
  <div style={{ width:w, height:h, borderRadius:r, background:"#F0EDE8", animation:"pulse 1.5s infinite", ...style }} />
);

/* ── analytics sub-components ───────────────────────────────── */
const StatCard = ({ label, value, pill, pillUp, accentColor }) => (
  <div style={{ background:"#fff", borderRadius:14, padding:18, border:"1px solid #EAE8E2", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, borderRadius:"14px 14px 0 0", background:accentColor }} />
    <div style={{ fontSize:11, color:"#9B9790", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:700, color:"#1A1814", lineHeight:1, letterSpacing:-1 }}>{value}</div>
    {pill && (
      <div style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, marginTop:7, background: pillUp ? "#EAF7F1":"#FEF0EA", color: pillUp ? "#22A56D":"#FF6014" }}>
        {pill}
      </div>
    )}
  </div>
);

const BarChart = ({ months, you, avg }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, position: "relative", minHeight: 400, padding: "20px 4px 0" }}>
      <svg width="100%" height="100%" viewBox="0 0 700 300" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <line key={v} x1="40" y1={260 - (v / 100) * 220} x2="680" y2={260 - (v / 100) * 220}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
        ))}
        {/* Y labels */}
        {[0, 25, 50, 75, 100].map(v => (
          <text key={v} x="32" y={264 - (v / 100) * 220} fontSize="11" fill="rgba(255,255,255,0.4)" textAnchor="end">{v}%</text>
        ))}

        {/* Avg line */}
        <polyline
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5,4"
          points={months.map((_, i) => {
            const x = 40 + (i / (months.length - 1)) * 640;
            const y = 260 - (avg[i] / 100) * 220;
            return `${x},${y}`;
          }).join(" ")}
        />

        {/* You line */}
        <polyline
          fill="none" stroke="#FE81D4" strokeWidth="3"
          points={months.map((_, i) => {
            const x = 40 + (i / (months.length - 1)) * 640;
            const y = 260 - (you[i] / 100) * 220;
            return `${x},${y}`;
          }).join(" ")}
        />

        {/* Avg markers */}
        {months.map((_, i) => {
          const x = 40 + (i / (months.length - 1)) * 640;
          const y = 260 - (avg[i] / 100) * 220;
          return <circle key={i} cx={x} cy={y} r="4" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>;
        })}

        {/* You markers + value labels */}
        {months.map((m, i) => {
          const x = 40 + (i / (months.length - 1)) * 640;
          const y = 260 - (you[i] / 100) * 220;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="6" fill="#FE81D4" stroke="#fff" strokeWidth="2"/>
              <text x={x} y={y - 12} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="700">{you[i]}%</text>
              <text x={x} y={282} fontSize="10" fill="rgba(255,255,255,0.5)" textAnchor="middle">{m}</text>
            </g>
          );
        })}
      </svg>
    </div>

    {/* Legend */}
    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
      {[{ color: "#FF6014", label: "Your score" }, { color: "rgba(255,255,255,0.5)", label: "Class average", dashed: true }].map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff" }}>
          <div style={{ width: 20, height: 2, background: l.color, borderRadius: 2, borderTop: l.dashed ? "2px dashed" : "none" }}/>
          {l.label}
        </div>
      ))}
    </div>
  </div>
);

const DonutChart = ({ passed, failed, improvement }) => {
  const total   = passed + failed;
  const passPct = total ? Math.round((passed/total)*100) : 0;
  const passArc = (passPct/100)*345;
  const failArc = 345 - passArc;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      {/* Top: donut + legend */}
      <div style={{ display:"flex", alignItems:"center", gap:32, width:"100%", justifyContent:"center" }}>
        <div style={{ position:"relative", width:150, height:150, flexShrink:0 }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="55" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12"/>
            <circle cx="75" cy="75" r="55" fill="none" stroke="#22A56D" strokeWidth="12"
              strokeDasharray={`${passArc} ${345-passArc}`} strokeDashoffset="-62" strokeLinecap="round"/>
            <circle cx="75" cy="75" r="55" fill="none" stroke="#FF6014" strokeWidth="12"
              strokeDasharray={`${failArc} ${345-failArc}`} strokeDashoffset={`${-(62+passArc)}`} strokeLinecap="round"/>
          </svg>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:700, color:"#fff" }}>{passPct}%</div>
            <div style={{ fontSize:16, color:"rgba(255,255,255,0.6)" }}>Pass</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16, flex:1, maxWidth:220}}>
          {[
            { dot:"#22A56D", label:"Passed",      val:`${passed} exams` },
            { dot:"#FF6014", label:"Failed",       val:`${failed} exams` },
            { dot:"#a78bfa", label:"Improvement",  val: improvement ?? "—" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:24, color:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:3, background:r.dot, display:"inline-block" }}/>
                {r.label}
              </span>
              <span style={{ fontSize:16, fontWeight:600, color: r.label==="Improvement" ? "#a78bfa" : "#fff" }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: 3 stat boxes */}
      <div style={{ width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20 }}>
        <div style={{ textAlign:"center", background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 8px" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>{passed}</div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.5)", marginTop:3 }}>Passed</div>
        </div>
        <div style={{ textAlign:"center", background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 8px" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>{failed}</div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.5)", marginTop:3 }}>Failed</div>
        </div>
        <div style={{ textAlign:"center", background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 8px" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#a78bfa" }}>{improvement ?? "—"}</div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.5)", marginTop:3 }}>Growth</div>
        </div>
      </div>
    </div>
  );
};

//new added: for leaderboard rows in the analytics section, shows rank, name with avatar, exams taken, and score. highlights the current user with a different background and "You" badge
const LbRow = ({ rank, name, exams, score, isMe, initials, avatarBg, avatarFg }) => {
  const medal = rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
  const rankColor = rank===1?"#EF9F27":rank===2?"#888780":rank===3?"#D85A30":"#B4B2A9";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding: isMe?"10px 20px":"10px 0", margin: isMe?"0 -20px":0, borderBottom: isMe?"1px solid #FFE8D9":"1px solid #F5F3EF", background: isMe?"#FFF8F5":"transparent" }}>
      <div style={{ fontSize:13, fontWeight:700, color:rankColor, width:24, textAlign:"center", flexShrink:0 }}>{medal||`#${rank}`}</div>
      <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background: avatarBg||(isMe?"#FF6014":"#F5F3EF"), color: avatarFg||(isMe?"#fff":"#5C5955"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600 }}>{initials}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color: isMe?"#FF6014":"#1A1814" }}>
          {name}
          {isMe && <span style={{ fontSize:10, fontWeight:600, background:"#FF6014", color:"#fff", padding:"2px 6px", borderRadius:6, marginLeft:6 }}>You</span>}
        </div>
        <div style={{ fontSize:11, color:"#9B9790", marginTop:1 }}>{exams} exams taken</div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:"#1A1814", flexShrink:0 }}>{score}</div>
    </div>
  );
};

const CaRow = ({ rank, name, value, barPct, barColor }) => {
  const badgeAlpha = { "#FF6014":"rgba(255,96,20,0.2)", "#3B8BD4":"rgba(59,139,212,0.18)", "#22A56D":"rgba(34,165,109,0.18)", "#7F77DD":"rgba(127,119,221,0.18)", "#9B9790":"rgba(155,151,144,0.15)" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ width:22, height:22, borderRadius:6, background: badgeAlpha[barColor] || "rgba(255,255,255,0.1)", color:barColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{rank}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:"#fff", fontWeight:500, marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${barPct}%`, background:barColor, borderRadius:3 }} />
          </div>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", flexShrink:0, minWidth:32 }}>{barPct}%</span>
        </div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{value}</div>
    </div>
  );
};

const DiffRow = ({ name, attempts, level }) => {
  const cfg = { Hard:{ bg:"#FCEBEB", color:"#A32D2D" }, Medium:{ bg:"#FEF0EA", color:"#E55012" }, Easy:{ bg:"#EAF7F1", color:"#22A56D" } }[level] || { bg:"#F5F3EF", color:"#9B9790" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #F0EDE8" }}>
      <div style={{ width:24, height:24, borderRadius:6, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {level==="Easy"
          ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={cfg.color} strokeWidth="1.8"><polyline points="3,8 7,12 13,4"/></svg>
          : <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={cfg.color} strokeWidth="1.8"><line x1="8" y1="3" x2="8" y2="9"/><circle cx="8" cy="12" r="1" fill={cfg.color} stroke="none"/></svg>}
      </div>
      <div style={{ flex:1, fontSize:12, color:"#5C5955", fontWeight:500 }}>{name}</div>
      <div style={{ fontSize:11, color:"#9B9790", flexShrink:0 }}>{attempts} avg tries</div>
      <div style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, background:cfg.bg, color:cfg.color, flexShrink:0 }}>{level}</div>
    </div>
  );
};

const MasteryItem = ({ name, pct }) => {
  const t = tierLabel(pct);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      <div style={{ fontSize:12, color:"#5C5955", width:120, flexShrink:0, fontWeight:500 }}>{name}</div>
      <div style={{ flex:1, height:7, background:"#F0EDE8", borderRadius:10, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct??0}%`, background:scoreColor(pct), borderRadius:10 }} />
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:"#1A1814", width:32, textAlign:"right", flexShrink:0 }}>{pct!=null?`${pct}%`:"—"}</div>
      <div style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:6, background:t.bg, color:t.color, flexShrink:0 }}>{t.label}</div>
    </div>
  );
};

const ProgressRow = ({ label, pct, color }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
      <span style={{ fontSize:12, color:"#5C5955", fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:12, color:"#9B9790" }}>{pct}%</span>
    </div>
    <div style={{ height:6, background:"#F0EDE8", borderRadius:10, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:color, borderRadius:10, transition:"width 0.6s ease" }} />
    </div>
  </div>
);

const WeekTracker = ({ days }) => (
  <div style={{ display:"flex", gap:6, marginTop:14 }}>
    {days.map((d,i) => (
      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
        <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, background: d.status==="done"?"#EAF7F1":d.status==="active"?"#FF6014":"#F5F3EF", color: d.status==="done"?"#22A56D":d.status==="active"?"#fff":"#B4B2A9" }}>
          {d.status==="done"?"✓":d.status==="active"?"●":"·"}
        </div>
        <div style={{ fontSize:10, color:"#9B9790" }}>{d.label}</div>
      </div>
    ))}
  </div>
);

/* ── Subject card (unchanged from original) ──────────────────── */
const SubjectCard = ({ subject, onExplore }) => {
  const rows = [
    { label:"TOTAL QUESTIONS", value: subject.questionCount ? `${subject.questionCount} Practice Questions` : "—" },
    { label:"DURATION",        value: subject.durationMinutes ? `${subject.durationMinutes} Minutes` : "No timer" },
    { label:"YEAR LEVEL",      value: subject.yearLevel || "—" },
    { label:"PROGRAM",         value: expandProgram(subject.programName) },
  ];
  const cardStyle = getCardStyle(subject.subjectID);
  return (
    <div className="relative overflow-hidden rounded-xl rounded-b-xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="relative flex w-full shrink-0 flex-row items-center gap-3 border-b border-gray-100 px-4 py-4 sm:w-48 sm:flex-col sm:items-start sm:justify-center sm:gap-0 sm:border-r sm:border-b-0 sm:px-5 sm:py-6"
          style={{ backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 15px,rgba(0,0,0,0.03) 15px,rgba(0,0,0,0.03) 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,rgba(0,0,0,0.03) 15px,rgba(0,0,0,0.03) 16px)" }}>
          <div className="mb-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-1 sm:h-9 sm:w-9">
            <i className={`${cardStyle.icon} text-[22px] sm:text-[20px]`} style={{ color:cardStyle.iconColor }} />
          </div>
          <div>
            <h3 className="outfit-700 text-[15px] leading-snug font-bold text-gray-900 sm:text-[16px]">{subject.subjectName}</h3>
            <p className="outfit-500 mt-0 text-[12px] text-gray-400 sm:mt-1">{subject.subjectCode}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between px-4 py-4 sm:px-6 sm:py-5">
          <dl className="space-y-2">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                <dt className="outfit-400 mb-0.5 w-full shrink-0 text-[10px] font-semibold tracking-wide text-gray-400 uppercase sm:mb-0 sm:w-36">{label}</dt>
                <dd className="outfit-400 text-[13px] text-gray-700">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex w-full justify-end">
            <button onClick={() => onExplore(subject)} className="mt-4 flex w-max cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-orange-500 transition hover:text-orange-600 sm:mt-5">
              Start Exam <i className="bx bx-arrow-right-stroke text-[18px] sm:text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const StudentDashboard = () => {
  const navigate        = useNavigate();
  const { toast, showToast } = useToast();
  const apiUrl          = import.meta.env.VITE_API_BASE_URL;

  /* mobile */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  /* user */
  const [userName,      setUserName]      = useState("Student");
  const [searchQuery,   setSearchQuery]   = useState("");
  const levelRef                           = useRef(null);

  /* subjects */
  const [subjects,        setSubjects]        = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [generatingFor,   setGeneratingFor]   = useState(null);
  const [ongoingExam,     setOngoingExam]     = useState(null);

  /* join class */
  const [showJoinForm,   setShowJoinForm]   = useState(false);
  const [classCode,      setClassCode]      = useState("");
  const [classCodeError, setClassCodeError] = useState("");
  const [isJoining,      setIsJoining]      = useState(false);

  /* ── analytics state ─────────────────────────────────────── */
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [leaderboard,      setLeaderboard]      = useState([]);
  const [myRank,           setMyRank]           = useState(null);
  const [analytics,        setAnalytics]        = useState(null);
  const [caTab,            setCaTab]            = useState("viewed");

  //new added for user menu and logout modal
  const [userInfo, setUserInfo] = useState(null);
  const [avatarColor, setAvatarColor] = useState("bg-orange-500");

  //new added for profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ firstName: "", lastName: "", email: "", userCode: "" });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  //new added for change password form
  const [formData, setFormData] = useState({ password: "", new_password: "", new_password_confirmation: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isChangePasswordSubmitting, setIsChangePasswordSubmitting] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${apiUrl}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUserInfo(data);
      } catch (err) { console.error(err); }
    };
    fetchUserInfo();
  }, [apiUrl]);

  useEffect(() => {
    if (userInfo?.fullName) {
      const parts = userInfo.fullName.trim().split(" ");
      setProfileFormData({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: userInfo.email || "",
        userCode: userInfo.userCode || "",
      });
    }
  }, [userInfo]);

  //new added for user menu and logout modal
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuCloseTimer = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── stars animation ─────────────────────────────────────── */
useEffect(() => {
  const canvas = document.getElementById("stars-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const stars = Array.from({ length: 250 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    alpha: Math.random(),
    speed: Math.random() * 0.005 + 0.002,
  }));

  let animId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });
    animId = requestAnimationFrame(draw);
  }
  draw();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", handleResize);
  };
}, []);

  /* ── load user ───────────────────────────────────────────── */
  useEffect(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("user"));
      if (u?.firstName) setUserName(u.firstName);
    } catch { /* */ }
  }, []);

  /* ── close level dropdown outside click ─────────────────── */
  useEffect(() => {
    const handle = (e) => { if (levelRef.current && !levelRef.current.contains(e.target)) {} };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── fetch subjects ──────────────────────────────────────── */
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res  = await fetch(`${apiUrl}/student/practice-subjects`, { headers:{ Authorization:`Bearer ${sessionStorage.getItem("token")}` } });
        const data = await res.json();
        if (data.data) setSubjects(data.data);
      } catch (err) { console.error(err); }
      finally { setSubjectsLoading(false); }
    };
    fetchSubjects();
  }, [apiUrl]);

  /* ── fetch analytics + leaderboard ──────────────────────── */
  useEffect(() => {
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const token = sessionStorage.getItem("token");

        const profileRes  = await fetch(`${apiUrl}/user/profile`, { headers:{ Authorization:`Bearer ${token}` } });
        const profileData = await profileRes.json();

        const lbRes  = await fetch(`${apiUrl}/practice-exam/overall-leaderboard`, { headers:{ Authorization:`Bearer ${token}` } });
        const lbData = await lbRes.json();

        let analyticsData = null;
        try {
          const aRes = await fetch(`${apiUrl}/practice-exam/student-analytics`, { headers:{ Authorization:`Bearer ${token}` } });
          if (aRes.ok) analyticsData = await aRes.json();
        } catch { /* endpoint may not exist yet */ }

        const lb = (lbData.leaderboard || [])
          .map(e => ({
            userID:     e.userID || e.user_id || e.id,
            name:       e.name || `${e.firstName||""} ${e.lastName||""}`.trim() || "Student",
            avgScore:   Math.round(e.avgScore ?? e.avg_score ?? e.average ?? 0),
            totalExams: e.totalExams ?? e.total_exams ?? e.examCount ?? 0,
            isMe:       (e.userID || e.user_id || e.id) === profileData?.userID,
          }))
          .sort((a, b) => b.avgScore - a.avgScore);

        const me = lb.find(s => s.isMe);
        if (me) setMyRank(lb.indexOf(me) + 1);
        setLeaderboard(lb.slice(0, 5));

        if (analyticsData) {
          setAnalytics(analyticsData);
        } else {
          const meEntry  = lb.find(s => s.isMe);
          const classAvg = lb.length ? Math.round(lb.reduce((s,e)=>s+e.avgScore,0)/lb.length) : 0;
          setAnalytics({
            examsTaken:  meEntry?.totalExams ?? 0,
            avgScore:    meEntry?.avgScore   ?? null,
            classAvg,
            percentile:  me ? Math.round(((lb.length-(lb.indexOf(me)+1))/lb.length)*100) : null,
            studyStreak: null,
            improvement: null,
            passedExams: meEntry?.totalExams ? Math.round(meEntry.totalExams*0.7) : 0,
            failedExams: meEntry?.totalExams ? Math.round(meEntry.totalExams*0.3) : 0,
          });
        }
      } catch (err) { console.error("Analytics error:", err); }
      finally { setAnalyticsLoading(false); }
    };
    loadAnalytics();
  }, [apiUrl]);

  /* ── check ongoing exam ──────────────────────────────────── */
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("exam_"));
    if (!keys.length) return;
    const examKey = keys[0];
    try {
      if (localStorage.getItem(`${examKey}_completed`) === "true") { cleanup(examKey); return; }
      const t = localStorage.getItem(`${examKey}_timer`);
      if (t && parseInt(t) === 0) { cleanup(examKey); return; }
      const subjectID    = examKey.split("_")[1];
      const savedExamData = localStorage.getItem(`${examKey}_exam_data`);
      if (savedExamData) {
        const examDataToUse = JSON.parse(savedExamData);
        if (examDataToUse?.questions) {
          setOngoingExam({ subjectID, examData: examDataToUse, savedAnswers: JSON.parse(localStorage.getItem(examKey)), savedBookmarks: JSON.parse(localStorage.getItem(`${examKey}_bookmarks`))||[], examKey });
        }
      }
    } catch { cleanup(examKey); }
  }, []);

  const cleanup = (examKey) => {
    [examKey,`${examKey}_bookmarks`,`${examKey}_timer`,`${examKey}_completed`,`${examKey}_last_question`,`${examKey}_last_position`]
      .forEach(k => localStorage.removeItem(k));
  };

  /* ── continue exam ───────────────────────────────────────── */
  const handleContinueExam = () => {
    if (!ongoingExam) return;
    const lastQuestionIndex = parseInt(localStorage.getItem(`${ongoingExam.examKey}_last_question`) || "0");
    navigate("/practice-exam", { state:{ subjectID:ongoingExam.subjectID, examData:ongoingExam.examData, savedAnswers:ongoingExam.savedAnswers, savedBookmarks:ongoingExam.savedBookmarks, examKey:ongoingExam.examKey, resumeExam:true, lastQuestionIndex } });
  };

  const [navVisible, setNavVisible] = useState(true);
const lastScrollY = useRef(0);

  //new added: useEffect to handle scroll and show/hide navbar
  useEffect(() => {
    const handle = () => {
      const current = window.scrollY;
      setNavVisible(current < lastScrollY.current || current < 80);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  /* ── generate exam ───────────────────────────────────────── */
  const handleGenerateExam = async (subject) => {
    setGeneratingFor(subject.subjectID);
    Object.keys(localStorage).filter(k=>k.startsWith("exam_")).forEach(key => {
      [key,`${key}_bookmarks`,`${key}_timer`,`${key}_completed`,`${key}_last_question`,`${key}_last_position`,`${key}_settings`,`${key}_exam_data`]
        .forEach(k => localStorage.removeItem(k));
    });
    try {
      const res = await fetch(`${apiUrl}/practice-exam/generate/${subject.subjectID}`, { headers:{ "Content-Type":"application/json", Authorization:`Bearer ${sessionStorage.getItem("token")}` } });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) { data = await res.json(); }
      else { const text = await res.text(); throw new Error("Unexpected response: "+text.slice(0,100)); }
      if (!res.ok) {
        if (res.status===403) throw new Error("Practice exam is not enabled for this subject.");
        if (res.status===404) throw new Error(data.message||"Subject not found or no questions available.");
        throw new Error(data.message||"Failed to generate exam");
      }
      if (!data.questions?.length) { showToast("No questions available for this subject.","error"); return; }
      const examKey = `exam_${subject.subjectID}_${data.questions.map(q=>q.questionID).join("_")}`;
      localStorage.setItem(`${examKey}_exam_data`, JSON.stringify({ questions:data.questions, totalPoints:data.totalPoints, enableTimer:data.enableTimer, durationMinutes:data.durationMinutes, subjectName:data.subjectName, examSettings:{ enableTimer:data.enableTimer, durationMinutes:data.durationMinutes } }));
      navigate("/exam-preview", { state:{ subjectID:subject.subjectID, examData:{ questions:data.questions, totalPoints:data.totalPoints, enableTimer:data.enableTimer, durationMinutes:data.durationMinutes, subjectName:data.subjectName, examSettings:{ enableTimer:data.enableTimer, durationMinutes:data.durationMinutes } }, examKey } });
    } catch (err) { console.error(err); showToast(err.message||"An unknown error occurred.","error"); }
    finally { setGeneratingFor(null); }
  };

  /* ── join class ──────────────────────────────────────────── */
  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) { setClassCodeError("Please enter a class code."); return; }
    setIsJoining(true); setClassCodeError("");
    try {
      const res  = await fetch(`${apiUrl}/classes/join`, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${sessionStorage.getItem("token")}` }, body: JSON.stringify({ code:classCode.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message||"Failed to join class.");
      showToast("Successfully joined the class!","success");
      setShowJoinForm(false); setClassCode("");
    } catch (err) { setClassCodeError(err.message); }
    finally { setIsJoining(false); }
  };

  /* ── filtered subjects ───────────────────────────────────── */
  const filtered = subjects.filter(s =>
    searchQuery.trim()
      ? s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  /* ── sample/fallback data ────────────────────────────────── */
  // Dynamic last 7 months based on current date
  const months = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (6 - i));
    return d.toLocaleString("default", { month: "short" });
  });
  const hasRealMonthlyData = analytics?.monthlyScores?.you?.length > 0;
  const youScores = hasRealMonthlyData
    ? analytics.monthlyScores.you
    : [0, 0, 0, 0, 0, 0, 0]; // mock fallback
  const avgScores = hasRealMonthlyData
    ? analytics.monthlyScores.avg
    : [0, 0, 0, 0, 0, 0, 0]; // mock fallback
  const examsTaken  = analytics?.examsTaken ?? "—";
  const avgScore    = analytics?.avgScore   != null ? `${analytics.avgScore}%` : "—";
  const streak      = analytics?.studyStreak ?? 0;
  const classRank   = myRank ? `#${myRank}` : "—";
  const passedExams = analytics?.passedExams ?? 0;
  const failedExams = analytics?.failedExams ?? 0;
  const improvement = analytics?.improvement != null ? `+${analytics.improvement}%` : "+12%";

  const AVATAR_BG = ["#FEF0EA","#F5F3EF","#FEF0EA","#E8F0FE","#EAF7F1"];
  const AVATAR_FG = ["#E55012","#5C5955","#E55012","#185FA5","#0F6E56"];

  const topicMastery    = analytics?.topicMastery    || [{ name:"Engineering Math",pct:88 },{ name:"Data Structures",pct:74 },{ name:"Database Systems",pct:62 },{ name:"Computer Networks",pct:45 },{ name:"Digital Logic",pct:80 }];
  const subjectCoverage = analytics?.subjectCoverage || [{ name:"Engineering Math",pct:88,color:"#22A56D" },{ name:"Data Structures",pct:74,color:"#3B8BD4" },{ name:"Database Systems",pct:62,color:"#FF6014" },{ name:"Computer Networks",pct:45,color:"#E55012" },{ name:"Digital Logic",pct:80,color:"#22A56D" },{ name:"Circuits",pct:55,color:"#FF6014" }];
  
  const contentViewed   = analytics?.contentViewed   || [{ name:"Engineering Math – Module 4",views:371,pct:100,color:"#FF6014" },{ name:"Data Structures",views:278,pct:75,color:"#3B8BD4" },{ name:"Database Systems",views:230,pct:62,color:"#22A56D" },{ name:"Computer Networks",views:178,pct:48,color:"#7F77DD" },{ name:"Digital Logic",views:141,pct:38,color:"#9B9790" }];
  const contentAttempted= analytics?.contentAttempted|| [{ name:"Discrete Math Quiz",views:214,pct:88,color:"#FF6014" },{ name:"Data Structures Practice",views:175,pct:72,color:"#3B8BD4" },{ name:"Network Protocol Set A",views:141,pct:58,color:"#22A56D" },{ name:"Circuit Analysis",views:107,pct:44,color:"#7F77DD" },{ name:"OS Concepts",views:82,pct:34,color:"#9B9790" }];
  const hardestTopics   = analytics?.hardestTopics   || [{ name:"Computer Networks",attempts:3.8,level:"Hard" },{ name:"Circuit Analysis",attempts:2.9,level:"Medium" },{ name:"Database Normalization",attempts:2.6,level:"Medium" },{ name:"Engineering Math",attempts:1.2,level:"Easy" }];
  const weekActivity    = analytics?.weekActivity    || [{ label:"M",status:"done" },{ label:"T",status:"done" },{ label:"W",status:"done" },{ label:"T",status:"done" },{ label:"F",status:"done" },{ label:"S",status:"active" },{ label:"S",status:"miss" }];

  /* ─────────────────────────────────────────────────────────── */

  if (isMobile) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <MobileDash
          userName={userName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          subjects={filtered}
          subjectsLoading={subjectsLoading}
          ongoingExam={ongoingExam}
          onContinueExam={handleContinueExam}
          onExplore={handleGenerateExam}
          generatingFor={generatingFor}
        />
      </>
    );
  }

  /* ── DESKTOP ─────────────────────────────────────────────── */
  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      
      <div className="outfit-400 relative min-h-screen pb-12" style={{  //New: this is for background design
          background: "linear-gradient(135deg, #0f0c29 0%, #0f0d60 40%, #0f0f63 0%, #0f0c29 23% 100%)",
          minHeight: "100vh",
          scrollSnapType: "y mandatory",
        }}>
          <canvas id="stars-canvas" style={{
          position: "fixed", top: 0, left: 0,
          width: "100vw", height: "100vh",
          zIndex: 0, pointerEvents: "none",
        }}/>

        {/*New Added*/}
        {/* LEFT — User pill */}
        <div ref={userMenuRef} style={{ position: "fixed", top: 30, left: 13, zIndex: 50 }}
          onMouseEnter={() => { clearTimeout(userMenuCloseTimer.current); setUserMenuOpen(true); }}
          onMouseLeave={() => { userMenuCloseTimer.current = setTimeout(() => setUserMenuOpen(false), 120); }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgb(255, 255, 255)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 70, padding: "5px 10px", cursor: "pointer",
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#FF6014", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, fontWeight: 900, flexShrink: 0,
            }}>
              {getInitials(userName) || "S"}
            </div>
            <div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                color: "#000000", 
                lineHeight: 1.2 }}>{userName}</div>
              <div style={{ 
                fontSize: 16, 
                color: "rgb(0, 0, 0)", 
                lineHeight: 1.2 }}>
                  Student
                </div>
            </div>
            <svg width="10" height="20" viewBox="0 0 10 10" fill="none"
              style={{ 
                transition: "transform 0.2s", 
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)", 
                marginLeft: 0 }}>
              <polyline 
                points="2,3 5,7 8,3" 
                stroke="rgba(0, 0, 0, 0.97)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
            </svg>
          </div>

          {userMenuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              background: "#1E3A6E", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: 6, minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              animation: "userMenuFadeIn 0.15s ease",
              zIndex: 100,
            }}>
              {[
                { icon: "bx bx-user", label: "My Profile", onClick: () => { setUserMenuOpen(false); setShowProfileModal(true); } },
                { icon: "bx bx-divider", label: "—",          onClick: null },
                { icon: "bx bx-log-out", label: "Log Out",    onClick: () => { setUserMenuOpen(false); setShowLogoutModal(true); } },
              ].map((item, i) =>
                item.label === "—"
                  ? <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                  : (
                    <button key={i} onClick={item.onClick} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", textAlign: "left",
                      background: "none", border: "none", cursor: "pointer",
                      padding: "8px 14px", borderRadius: 7,
                      fontSize: 13, color: item.label === "Log Out" ? "#FF6B6B" : "rgba(255,255,255,0.8)",
                      fontFamily: "inherit", fontWeight: 450,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <i className={item.icon} style={{ fontSize: 15 }} />
                      {item.label}
                    </button>
                  )
              )}
            </div>
          )}
        </div>

          

          {/* RIGHT — Start New Exam */}
          <button
            onClick={() => document.getElementById("subjects-section")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              position: "fixed", top: 40, right: 24, zIndex: 50,
              background: "#FF6014", color: "#fff", border: "none",
              padding: "8px 16px", borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6, fontFamily: "inherit",
              transition: "background 0.15s", flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#E5520E"}
            onMouseLeave={e => e.currentTarget.style.background = "#FF6014"}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="white"><polygon points="4,2 14,8 4,14"/></svg>
            Start New Exam
          </button>

        

        {/* new added: CENTER — Dropdown groups */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          padding: "40px 0", 
          position: "relative", 
          zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => navigate("/student-dashboard")} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 12px", borderRadius: 8,
              color: "rgba(255,255,255,0.7)",
              fontSize: 18, fontWeight: 500, fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Home
            </button>

            <NavDropdown label="Main" items={[
              { label: "Sessions", onClick: () => navigate("/sessions") },
              { label: "Classes",  onClick: () => navigate("/class") },
            ]}/>

            <NavDropdown label="Analytics" items={[
              { label: "Achievements",         onClick: () => navigate("/analytics/score-history") },
              { label: "Leaderboard",          onClick: () => navigate("/leaderboard") },
              { label: "Content Analytics",    onClick: () => navigate("/analytics/content") },
              { label: "Difficulty Analytics", onClick: () => navigate("/analytics/difficulty") },
            ]}/>

            <NavDropdown label="Support" items={[
              { label: "Help Center",      onClick: () => window.open("https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?gid=1756766640#gid=1756766640", "_blank") },
              { label: "Feedback",         onClick: () => {} },
              { label: "Submit a Request", onClick: () => {} },
            ]}/>

            {/* Notifications — no dropdown */}
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 12px", borderRadius: 8,
              color: "rgba(255,255,255,0.7)",
              fontSize: 18, fontWeight: 500, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.15s, color 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Notifications
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                display: "inline-block", flexShrink: 0,
              }}/>
            </button>
          </div>
        </div>

        {/* ══ SUBJECTS LIST ══ */}
          <div id="subjects-section" style={{ padding:"70px 300px" }}>

            {/* Search bar */}
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "50%" }}>
                <i className="bx bx-search" style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 18, color: "#FF6014", pointerEvents: "none", zIndex: 1,
                }}/>
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 14px 12px 40px",
                    borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                    color: "#fff", fontSize: 14, outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }}/>
              <span style={{ fontSize:13, color:"#6b7280", padding:"0 12px" }}>
                Browse subjects for <strong style={{ color:"#111", borderBottom:"2px solid #111" }}>JRMSU</strong>
              </span>
              <div style={{ flex:1, height:1, background:"#E5E7EB" }}/>
            </div>

            {subjectsLoading ? (
              <div className="flex items-center justify-center py-16"><span className="loader"/></div>
            ) : filtered.length === 0 ? (
              <div className="outfit-400 rounded-xl border border-dashed border-gray-200 py-12 text-center text-[14px] text-gray-400">
                {searchQuery 
                  ? `No subjects found for "${searchQuery}"` 
                  : "No subjects available."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map(subject => (
                  <div key={subject.subjectID} className="relative">
                    <SubjectCard subject={subject} onExplore={handleGenerateExam}/>
                    {generatingFor === subject.subjectID && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                        <span className="loader"/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        <div style={{ padding:"24px 170px" }}>
          <style>{`
            .snap-section {
              scroll-snap-align: start;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 40px 0;
            }
          `}</style>

          {/* ══ STAT CARDS ══ */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:100, marginBottom:20 }}>
            <StatCard label="Exams Taken"  value={analyticsLoading?"—":examsTaken} pill={analyticsLoading?null:"↑ +3 this week"} pillUp accentColor="#FF6014"/>
            <StatCard label="Avg. Score"   value={analyticsLoading?"—":avgScore}   pill={analyticsLoading?null:"↑ vs class avg"} pillUp accentColor="#22A56D"/>
            <StatCard label="Study Streak" value={analyticsLoading?"—":streak}     pill="🔥 days running"                        pillUp accentColor="#3B8BD4"/>
            <StatCard label="Class Rank"   value={analyticsLoading?"—":classRank}  pill={!analyticsLoading&&analytics?.percentile?`Top ${analytics.percentile}%`:null} pillUp accentColor="#7F77DD"/>
          </div>

          {/* ══ ONGOING EXAM ══ */}
          {ongoingExam && (
            <div style={{ 
              background:"#fffbeb", 
              border:"1px solid #fde68a", 
              borderRadius:14, 
              padding:"12px 16px", 
              display:"flex", 
              justifyContent:"space-between", 
              alignItems:"center", 
              gap:10, 
              marginBottom:20 }}>

              <div>
                <div style={{ 
                  fontSize:13, 
                  fontWeight:700, 
                  color:"#92400e" }}>Exam in Progress</div>

                <div style={{ 
                  fontSize:11, 
                  color:"#b45309", 
                  marginTop:2 }}>{
                    ongoingExam.examData?.subjectName||`Subject ${ongoingExam.subjectID}`}
                     — your progress has been saved.</div>
              </div>
              <button 
                onClick={handleContinueExam} 
                style={{ 
                  background:"#FF6014", 
                  color:"#fff", 
                  border:"none", 
                  borderRadius:10, 
                  padding:"8px 16px", 
                  fontSize:12, 
                  fontWeight:700, 
                  cursor:"pointer", 
                  flexShrink:0 }}>
                    Continue
              </button>
            </div>
          )}

          {/* ══ ACHIEVEMENT + LEADERBOARD ══ */}
          <SectionLabel>
            Achievement Dashboard & Leaderboard
          </SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:90, marginBottom:20 }}>

              {/* Score Analytics */}
              <div style={{
                height: "50vh",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
              }}>
              <Card style={{ width: "100%", height: "85vh" }}>
                <CardHead 
                  title={
                    !analyticsLoading && !hasRealMonthlyData
                      ? "Score Analytics — Sample Data"
                      : "Score Analytics — This Month"
                  }
                  action="Full report" 
                  onAction={() => navigate("/analytics/score-history")}/>
                <CardBody style={{ height:"calc(85vh - 60px)", display:"flex", flexDirection:"column" }}>
                  {analyticsLoading
                    ? <div style={{ height:180 }}><Skeleton h={150} r={6}/></div>
                    : <BarChart months={months} you={youScores} avg={avgScores}/>}
                </CardBody>
              </Card>
              </div>

              {/* Pass vs fail */}
              <div style={{
                height: "150vh",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                
              }}>
              <Card>
                <CardHead title="Pass vs. Fail Rate" action="View breakdown"/>
                {/*<CardBody style={{ height:"calc(85vh - 60px)", display:"flex", flexDirection:"column" }}>*/}
                <CardBody style={{ height:"auto", display:"flex", flexDirection:"column" }}>
                  {analyticsLoading
                    ? <Skeleton h={90} r={8}/>
                    : <DonutChart passed={passedExams} failed={failedExams} improvement={improvement}/>}
                </CardBody>
              </Card>
              </div>

            {/* Leaderboard */}
            <div style={{
              scrollSnapAlign: "start",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
            }}>
              <Card style={{ display:"flex", flexDirection:"column" }}>
                <CardHead 
                  title="Class Leaderboard" 
                  action="Full board" 
                  onAction={() => navigate("/leaderboard")}/>
                {/* temp debug - remove later */}
                {!analyticsLoading && leaderboard.length === 0 && (
                  <div style={{ 
                    display:"flex", 
                    flexDirection:"column",
                    alignItems:"center", 
                    justifyContent:"center", 
                    flex:1,
                    gap:8,
                    padding:"40px 0" 
                  }}>
                    <div style={{ fontSize:69 }}>🏆</div>
                    <div style={{ color:"rgb(255, 255, 255)", fontSize:16, fontWeight:500 }}>
                      No leaderboard data yet.</div>
                    <div style={{ color:"rgb(255, 255, 255)", fontSize:16 }}>
                      Take some exams to appear here!</div>
                  </div>
                )}
                <CardBody style={{ height:"auto", minHeight: 10, display:"flex", flexDirection:"column" }}>
                  {analyticsLoading
                    ? [...Array(5)].map((_,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, marginBottom:4, background:"rgba(255,255,255,0.04)", animation:"pulse 1.5s infinite" }}>
                          <div style={{ width:24, height:14, borderRadius:4, background:"rgba(255,255,255,0.08)" }}/>
                          <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.08)", flexShrink:0 }}/>
                          <div style={{ flex:1 }}>
                            <div style={{ height:13, borderRadius:4, background:"rgba(255,255,255,0.08)", marginBottom:5 }}/>
                            <div style={{ height:10, width:"50%", borderRadius:4, background:"rgba(255,255,255,0.05)" }}/>
                          </div>
                          <div style={{ width:36, height:14, borderRadius:4, background:"rgba(255,255,255,0.08)" }}/>
                        </div>
                      ))
                    : leaderboard.map((s, i) => {
                        const rank = i + 1;
                        const medal = rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
                        const rankColor = rank===1?"#F0C040":rank===2?"#A8B4C0":rank===3?"#CD7F32":"rgba(255,255,255,0.25)";
                        const rowBg = rank===1?"rgba(240,192,64,0.08)":rank===2?"rgba(168,180,192,0.06)":rank===3?"rgba(205,127,50,0.06)":"transparent";
                        const rowBorder = rank===1?"rgba(240,192,64,0.15)":rank===2?"rgba(168,180,192,0.12)":rank===3?"rgba(205,127,50,0.12)":"transparent";
                        return (
                          <div key={s.userID} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, marginBottom:4, background: s.isMe?"rgba(255,96,20,0.1)":rowBg, border:`1px solid ${s.isMe?"rgba(255,96,20,0.25)":rowBorder}` }}>
                            <div style={{ fontSize:rank<=3?16:13, fontWeight:700, color:rankColor, width:24, textAlign:"center", flexShrink:0 }}>{medal||`#${rank}`}</div>
                            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:s.isMe?"#FF6014":AVATAR_BG[i%5], color:s.isMe?"#fff":AVATAR_FG[i%5], display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>
                              {getInitials(s.name)}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:s.isMe?"#FF6014":"#fff" }}>
                                {s.name}
                                {s.isMe && <span style={{ fontSize:9, fontWeight:800, background:"#FF6014", color:"#fff", padding:"1px 5px", borderRadius:4, marginLeft:6 }}>YOU</span>}
                              </div>
                              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{s.totalExams} exams</div>
                            </div>
                            <div style={{ fontSize:14, fontWeight:800, color:rankColor, flexShrink:0 }}>{s.avgScore}%</div>
                          </div>
                        );
                      })
                  }
                </CardBody>

                {/* Your position footer */}
                <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:16, color:"rgb(255, 255, 255)", marginBottom:6 }}>Your position this week</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ fontSize:40, fontWeight:800, color:"#FF6014" }}>{classRank}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ height:5, background:"rgb(255, 255, 255)", borderRadius:10, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${analytics?.percentile??0}%`, background:"#FF6014", borderRadius:10 }}/>
                      </div>
                      <div style={{ fontSize:15, color:"rgb(255, 255, 255)", marginTop:4 }}>Top {analytics?.percentile??"—"}% of your class</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ══ CONTENT & LEARNING ANALYTICS ══ */}
          <SectionLabel padding="250px 0">
            Content & Learning Analytics
          </SectionLabel>
          <div style={{ 
            display:"flex", flexDirection:"column", 
            gap:18, marginBottom:20 }}>

            {/* Content analytics */}
            <div style={{
                height: "20vh",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
              }}>
            <Card>
              <CardHead title="Content Analytics" action="See all" onAction={() => navigate("/analytics/content")}/>
              <CardBody style={{ height:"auto", display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", gap:4, marginBottom:14 }}>
                  {[{ id:"viewed",label:"Most Viewed" },{ id:"attempted",label:"Most Attempted" }].map(t=>(
                    <div key={t.id} onClick={()=>setCaTab(t.id)} style={{ fontSize:12, fontWeight:600, padding:"6px 14px", cursor:"pointer", borderRadius:8, background: caTab===t.id?"#FF6014":"transparent", color: caTab===t.id?"#fff":"rgba(255,255,255,0.4)", transition:"all 0.15s" }}>{t.label}</div>
                  ))}
                </div>
                {analyticsLoading
                  ? [...Array(5)].map((_,i)=><Skeleton key={i} h={36} r={6} style={{ marginBottom:8 }}/>)
                  : (caTab==="viewed"?contentViewed:contentAttempted).map((c,i)=>(
                    <CaRow key={i} rank={i+1} name={c.name} value={c.views} barPct={c.pct} barColor={c.color}/>
                  ))}
              </CardBody>
            </Card>
            </div>

            {/* Learning difficulty */}
            <div style={{
                height: "190vh",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
              }}>
            <Card>
              <CardHead title="Learning Difficulty" action="Details" onAction={() => navigate("/analytics/difficulty")}/>
              <CardBody style={{ height:"auto", display:"flex", flexDirection:"column" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                  {[{ label:"Avg. Attempts",val: analytics?.avgAttempts??"2.4",sub:"before passing" },{ label:"Avg. Time/Topic",val: analytics?.avgTimeTopic??"18m",sub:"per session" }].map(d=>(
                    <div key={d.label} style={{ background:"#F8F6F3", borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ fontSize:11, color:"#9B9790", fontWeight:500, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.4px" }}>{d.label}</div>
                      <div style={{ fontSize:22, fontWeight:700, color:"#1A1814", letterSpacing:-0.5, lineHeight:1 }}>{d.val}</div>
                      <div style={{ fontSize:11, color:"#9B9790", marginTop:3 }}>{d.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:"#9B9790", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Hardest Topics</div>
                {analyticsLoading
                  ? [...Array(4)].map((_,i)=><Skeleton key={i} h={30} r={6} style={{ marginBottom:6 }}/>)
                  : hardestTopics.map((t,i)=><DiffRow key={i} name={t.name} attempts={t.attempts} level={t.level}/>)}
              </CardBody>
            </Card>
            </div>

            {/* Topic mastery + weekly */}
            <div style={{
                height: "20vh",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
              }}>
            <Card>
              <CardHead title="Topic Mastery Level" action="See all" onAction={() => navigate("/analytics/mastery")}/>
              <CardBody style={{ height:"auto", display:"flex", flexDirection:"column" }}>
                {analyticsLoading
                  ? [...Array(5)].map((_,i)=><Skeleton key={i} h={22} r={6} style={{ marginBottom:12 }}/>)
                  : topicMastery.map((t,i)=><MasteryItem key={i} name={t.name} pct={t.pct}/>)}
                <div style={{ borderTop:"1px solid #F0EDE8", paddingTop:12, marginTop:4 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#9B9790", textTransform:"uppercase", letterSpacing:"0.5px" }}>Weekly Activity</div>
                  <WeekTracker days={weekActivity}/>
                </div>
              </CardBody>
            </Card>
            </div>
          </div>

          {/* ══ SUBJECT COVERAGE ══ */}
          
          <SectionLabel padding="340px 0 10px 0">
            Subject Coverage
          </SectionLabel>
          <div style={{
                height: "auto",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
              }}>
          <Card style={{ marginBottom:5 }}>
            <CardHead
              title="Progress Per Subject" 
              action="See details"/>
            <CardBody style={{ height:"350", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                {analyticsLoading
                  ? [...Array(6)].map((_,i)=><Skeleton key={i} h={32} r={6} style={{ marginBottom:14 }}/>)
                  : subjectCoverage.map((s,i)=><ProgressRow key={i} label={s.name} pct={s.pct} color={s.color}/>)}
              </div>
            </CardBody>
          </Card>
          </div>

          {/* ══ RECOMMENDATIONS ══ 
          <SectionLabel padding="350px 0">
            Recommendations & Next Steps
          </SectionLabel>
          <div style={{ 
            display:"grid", gridTemplateColumns:"repeat(3,1fr)", 
            gap:14, marginBottom:58 }}>
            {[
              { iconBg:"#FEF0EA", iconColor:"#FF6014", title:"Weak area detected",    body:"Computer Networks dropped below 60%. Focus on protocol fundamentals to recover your score.", link:"Open Reviewer →" },
              { iconBg:"#EAF7F1", iconColor:"#22A56D", title:"You're improving",       body:"Your average score increased by 12% over your first 5 attempts. Keep it up!", link:"View Analytics →" },
              { iconBg:"#E8F0FE", iconColor:"#3B8BD4", title:"On track to pass",      body:"Your strongest subject is Engineering Mathematics. Reinforce Database Systems to close the gap.", link:"View Study Plan →" },
            ].map((tip,i)=>(
              <div key={i} style={{ background:"#fff", borderRadius:14, border:"1px solid #EAE8E2", padding:18 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:tip.iconBg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={tip.iconColor} strokeWidth="1.5">
                    {i===0 && <><path d="M3 2h8l2 2v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="9" y2="9"/></>}
                    {i===1 && <polyline points="2,12 6,7 9,10 12,5 14,7"/>}
                    {i===2 && <><rect x="1" y="10" width="3" height="5" rx="1"/><rect x="6" y="6" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="13" rx="1"/></>}
                  </svg>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1A1814", marginBottom:5 }}>{tip.title}</div>
                <div style={{ fontSize:12, color:"#9B9790", lineHeight:1.5 }}>{tip.body}</div>
                <span style={{ fontSize:12, color:"#FF6014", fontWeight:500, cursor:"pointer", marginTop:8, display:"block" }}>{tip.link}</span>
              </div>
            ))}
          </div>*/}

        </div>{/* end padding wrapper */}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => { setShowProfileModal(false); setProfileError(""); }}
              className="absolute top-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <i className="bx bx-x text-3xl"></i>
            </button>

            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
                {userInfo?.fullName ? (
                  (() => {
                    const parts = userInfo.fullName.trim().split(" ");
                    return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
                  })()
                ) : "S"}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-800">{userInfo?.fullName || "—"}</div>
                <div className="text-sm text-gray-500">{userInfo?.email || "—"}</div>
              </div>
            </div>

            <div className="mb-4 h-[0.5px] bg-gray-200" />

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[12px] font-semibold text-gray-700">FIRST NAME</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"
                    value={profileFormData.firstName}
                    onChange={e => setProfileFormData(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <span className="block text-[12px] font-semibold text-gray-700">LAST NAME</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"
                    value={profileFormData.lastName}
                    onChange={e => setProfileFormData(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <span className="block text-[12px] font-semibold text-gray-700">EMAIL ADDRESS</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"
                  value={profileFormData.email}
                  onChange={e => setProfileFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="mt-1 text-start text-[11px] text-gray-400">
                Your primary email address. It may be used for
                account-related communications.
              </div>
            </div>
            
            <div className="mt-3 h-[0.5px] bg-[rgb(200,200,200)]" />
            <div
              onClick={() => { setShowProfileModal(false); setShowChangePassword(true); }}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-1 hover:bg-gray-100"
            >
              <h3 className="text-[14px] font-medium text-gray-700">Change Password</h3>
              <i className="bx bx-chevron-right text-[24px] text-gray-700 hover:text-gray-500"></i>
            </div>

            {profileError && (
              <div className="mt-3 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">{profileError}</div>
            )}

            <div className="mt-4 h-[0.5px] bg-gray-200" />
            <button
              onClick={async () => {
                setIsProfileSubmitting(true);
                setProfileError("");
                try {
                  const token = sessionStorage.getItem("token");
                  const res = await fetch(`${apiUrl}/user/update-profile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(profileFormData),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Failed to update profile.");
                  setUserInfo(prev => ({ ...prev, fullName: `${profileFormData.firstName} ${profileFormData.lastName}`.trim(), email: profileFormData.email }));
                  
                  setUserName(profileFormData.firstName);
                  showToast("Profile updated successfully!", "success");
                  setShowProfileModal(false);
                } catch (err) { setProfileError(err.message); }
                finally { setIsProfileSubmitting(false); }
              }}
              disabled={isProfileSubmitting}
              className="mt-4 h-9 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[14px] font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {isProfileSubmitting ? <div className="flex items-center justify-center"><span className="loader-white"></span></div> : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div className="relative w-full max-w-[480px] mx-5 rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => { setShowChangePassword(false); setShowProfileModal(true); setChangePasswordError(""); setFormData({ password: "", new_password: "", new_password_confirmation: "" }); }}
              className="absolute top-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <i className="bx bx-x text-3xl"></i>
            </button>

            <div className="flex flex-col gap-1 pr-10 mb-4">
              <h2 className="text-[18px] font-bold text-gray-800">Change Password</h2>
              <div className="text-[14px] text-gray-400">For your account's safety, we recommend changing your password to prevent unauthorized access.</div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[12px] font-semibold text-gray-700">CURRENT PASSWORD <span className="text-orange-500">*</span></span>
                <div className="relative">
                  <input type={passwordVisible ? "text" : "password"} value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"/>
                  <button type="button" onClick={() => setPasswordVisible(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <i className={`bx ${passwordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px]`}></i>
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[12px] font-semibold text-gray-700">NEW PASSWORD <span className="text-orange-500">*</span></span>
                <div className="relative">
                  <input type={newPasswordVisible ? "text" : "password"} value={formData.new_password}
                    onChange={e => setFormData(p => ({ ...p, new_password: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"/>
                  <button type="button" onClick={() => setNewPasswordVisible(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <i className={`bx ${newPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px]`}></i>
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-gray-400">Password must contain at least 8 characters</div>
              </div>

              <div>
                <span className="block text-[12px] font-semibold text-gray-700">CONFIRM NEW PASSWORD <span className="text-orange-500">*</span></span>
                <div className="relative">
                  <input type={confirmPasswordVisible ? "text" : "password"} value={formData.new_password_confirmation}
                    onChange={e => setFormData(p => ({ ...p, new_password_confirmation: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-[12px] text-gray-900 focus:border-orange-500 focus:outline-none"/>
                  <button type="button" onClick={() => setConfirmPasswordVisible(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <i className={`bx ${confirmPasswordVisible ? "bx-eye-alt" : "bx-eye-slash"} text-[24px]`}></i>
                  </button>
                </div>
              </div>
            </div>

            {changePasswordError && (
              <div className="mt-3 rounded-md bg-red-50 p-2 text-center text-[12px] text-red-500">{changePasswordError}</div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                disabled={isChangePasswordSubmitting}
                onClick={async () => {
                  setChangePasswordError("");
                  if (formData.new_password.length < 8) { setChangePasswordError("New password must be at least 8 characters."); return; }
                  if (formData.new_password !== formData.new_password_confirmation) { setChangePasswordError("Passwords do not match."); return; }
                  setIsChangePasswordSubmitting(true);
                  try {
                    const res = await fetch(`${apiUrl}/change-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("token")}` },
                      body: JSON.stringify(formData),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to change password.");
                    showToast("Password changed successfully!", "success");
                    setShowChangePassword(false);
                    setFormData({ password: "", new_password: "", new_password_confirmation: "" });
                  } catch (err) { setChangePasswordError(err.message); }
                  finally { setIsChangePasswordSubmitting(false); }
                }}
                className="h-9 cursor-pointer rounded-lg bg-orange-500 px-5 text-[14px] font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                {isChangePasswordSubmitting ? <div className="flex items-center justify-center"><span className="loader-white"></span></div> : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div className="flex w-[90vw] max-w-xs flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="orange">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/>
              </svg>
            </div>
            <div className="outfit-700 mb-1 text-[20px]">Log out</div>
            <div className="outfit-400 mb-5 text-center text-[14px] text-gray-500">Are you sure you want to log out?</div>
            <button
              className="outfit-400 mb-2 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[16px] font-semibold text-white transition hover:bg-orange-700"
              onClick={() => { 
                setIsLoggingOut(true);
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                navigate("/"); 
              }}
              disabled={isLoggingOut}
            >
              Yes, Log out
            </button>
            <button
              className="border-color outfit-400 w-full cursor-pointer rounded-lg border py-2 text-[16px] font-semibold text-gray-800 transition hover:bg-gray-200"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* JOIN CLASS MODAL */}
      {showJoinForm && (
        <div className="lightbox-bg fixed inset-0 z-50 flex items-center justify-center" onMouseDown={e=>{ if(e.target===e.currentTarget){setShowJoinForm(false);setClassCode("");setClassCodeError("");} }}>
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="border-color flex items-center justify-between border-b px-5 py-3">
              <h2 className="outfit-400 text-[14px] font-semibold text-gray-700">Enter Class Code</h2>
              <button onClick={()=>{setShowJoinForm(false);setClassCode("");setClassCodeError("");}} className="rounded-full p-1 text-gray-500 hover:bg-gray-100"><i className="bx bx-x text-[20px]"/></button>
            </div>
            <form onSubmit={handleJoinClass} className="px-5 py-4">
              <label className="outfit-400 mb-1.5 block text-[13px] text-gray-600">Class Code</label>
              <input type="text" value={classCode} onChange={e=>{setClassCode(e.target.value);setClassCodeError("");}} placeholder="e.g. ABC-123" className="border-color outfit-400 w-full rounded-xl border px-4 py-2 text-[14px] text-gray-700 outline-none focus:border-orange-500"/>
              {classCodeError && <p className="outfit-400 mt-2 text-[12px] text-red-500">{classCodeError}</p>}
              <button type="submit" disabled={isJoining} className="outfit-400 mt-4 w-full rounded-lg bg-orange-500 py-2 text-[14px] font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                {isJoining ? <div className="flex items-center justify-center"><span className="loader-white"/></div> : "Join Class"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes navFadeIn {
          from { opacity:0; transform:translateX(-50%) translateY(-6px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes userMenuFadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
      </div>
    </>
    
  );

};


export default StudentDashboard;
