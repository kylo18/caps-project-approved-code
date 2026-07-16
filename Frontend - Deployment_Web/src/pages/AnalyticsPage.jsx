import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ScoreHistory from "./ScoreHistory";
import Leaderboard from "./Leaderboard";
import ContentAnalytics from "./ContentAnalytics";
import DifficultyAnalytics from "./DifficultyAnalytics";



/* ── Map route → section id ─────────────────────────────────── */
const ROUTE_TO_ID = {
  "/analytics/achievements":        "achievements",
  "/analytics/leaderboards":        "leaderboards",
  "/analytics/content-analytics":   "content-analytics",
  "/analytics/difficult-analytics": "difficult-analytics",
};

const AnalyticsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const sectionRefs = useRef({});
    const isManualScrolling = useRef(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    

  /* ── On route change → scroll to matching section ───────── */
  useEffect(() => {
    const targetId = ROUTE_TO_ID[location.pathname];
    if (!targetId) return;

    // Block scroll spy while we're programmatically scrolling
    isManualScrolling.current = true;

    const timer = setTimeout(() => {
      const el = sectionRefs.current[targetId];
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Release scroll spy after scroll animation finishes
      setTimeout(() => {
        isManualScrolling.current = false;
      }, 900);
    }, 80);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  /* ── Scroll spy: update route as user scrolls ───────── */
useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrolling.current) return;
        let best = null;
        let bestRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = entry.target.id;
          }
        });
        if (best) {
          const routes = {
            "achievements":        "/analytics/achievements",
            "leaderboards":        "/analytics/leaderboards",
            "content-analytics":   "/analytics/content-analytics",
            "difficult-analytics": "/analytics/difficult-analytics",
          };
          if (routes[best] && location.pathname !== routes[best]) {
            navigate(routes[best], { replace: true });
          }
        }
      },
      { threshold: [0.3, 0.5], rootMargin: "-10px 0px 0px 0px" }
    );
  
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
  
    return () => observer.disconnect();
  }, [navigate, location.pathname]);

  return (
    <div className="relative min-h-screen bg-white" style={{ overflowX: "hidden", width: "100%", maxWidth: "100vw", boxSizing: "border-box" }}>
      {/* Achievements */}
      <section
        id="achievements"
        ref={(el) => { sectionRefs.current["achievements"] = el; }}
        className="scroll-mt-4 w-full overflow-x-hidden"
      >
        <ScoreHistory />
      </section>

      {/* Leaderboards */}
      <section
        id="leaderboards"
        ref={(el) => { sectionRefs.current["leaderboards"] = el; }}
        className="scroll-mt-4 w-full overflow-x-hidden"
        style={{ marginTop: "-100px" }}
      >
        <Leaderboard />
      </section>

      {/* My Content */}
      <section
        id="content-analytics"
        ref={(el) => { sectionRefs.current["content-analytics"] = el; }}
        className="scroll-mt-4 w-full overflow-x-hidden"
        style={{ marginTop: "10px" }}
      >
        <ContentAnalytics />
      </section>

      {/* Difficulty */}
      <section
        id="difficult-analytics"
        ref={(el) => { sectionRefs.current["difficult-analytics"] = el; }}
        className="scroll-mt-4 w-full overflow-x-hidden"
        //style={{ marginTop: "-70px" }}
        style={{ marginTop: isMobile ? "-70px" : "20px" }}
      >
        <DifficultyAnalytics />
      </section>
    </div>
  );
};

export default AnalyticsPage;
