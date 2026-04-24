import { useState, useEffect } from "react";
import ChangelogModal from "../components/ChangelogModal";

const CHANGELOG_KEY = "changelog_v2.0.0_seen";

const ProgramChairDashboard = () => {
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CHANGELOG_KEY)) {
      setShowChangelog(true);
      localStorage.setItem(CHANGELOG_KEY, "true");
    }
  }, []);

  return (
    <>
      {/* ── Welcome Hero ────────────────────────────────────── */}
      <div className="outfit-400 relative mt-8 flex min-h-[calc(100vh-44px)] flex-col items-center justify-center px-6 text-center lg:mt-0">
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold tracking-widest text-orange-500 uppercase">
            <i className="bx bx-rocket text-[13px]" />
            CAPS v2.0.0 is live
          </span>

          {/* Heading */}
          <h1 className="outfit-700 text-[32px] leading-tight font-extrabold text-gray-900 md:text-[42px]">
            Welcome back! 👋
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-gray-500">
            Explore everything new in <strong className="text-gray-700">CAPS v2.0</strong> — quizzes, classes, reports, and more are now live.
          </p>

          {/* Changelog button */}
          <button
            onClick={() => setShowChangelog(true)}
            className="outfit-600 mt-2 flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 hover:shadow-orange-300 active:scale-95"
          >
            <i className="bx bx-news text-[17px]" />
            See What&apos;s New in v2.0
          </button>

          <p className="text-[12px] text-gray-400">
            Use the sidebar to navigate to Subjects, Classes, Sessions, and more.
          </p>
        </div>
      </div>

      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </>
  );
};

export default ProgramChairDashboard;
