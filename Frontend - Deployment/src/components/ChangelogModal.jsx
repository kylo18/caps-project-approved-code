import { useEffect, useRef, useState } from "react";

/* ── Changelog sections ────────────────────────────────────────────────── */
const SECTIONS = [
  {
    title: "Classes",
    tags: ["New"],
    features: [
      {
        name: "Full Class Lifecycle",
        desc: "Create, edit, archive, and delete classes. Students join via class codes; teachers can add or remove students at any time.",
      },
      {
        name: "Quiz Scheduling",
        desc: "Assign quizzes with start and deadline dates, and view all assigned quizzes per class.",
      },
      {
        name: "Class Analytics",
        desc: "Track student name, program, average accuracy, and total quizzes completed. View participation rates, schedule adherence, and class accuracy per quiz.",
      },
    ],
  },
  {
    title: "Quizzes",
    tags: ["New", "Improved"],
    features: [
      {
        name: "Full Quiz Lifecycle",
        desc: "Create, edit, archive, delete, and restore quizzes. Assign them to classes and export as PDF documents.",
      },
      {
        name: "Quiz Settings",
        desc: "Configure attempt limits, timed durations, late submissions, shuffle options, and score visibility — all per quiz.",
      },
      {
        name: "Question Management",
        desc: "Create, edit, and delete questions inline. Import from Qualifying Exam or Practice modules, or duplicate existing questions for faster setup.",
      },
      {
        name: "Quiz Session Monitoring",
        desc: "Instructors can monitor live quiz sessions, track active students, and access completed results. Students can view ongoing and completed quizzes and track their performance.",
      },
    ],
  },
  {
    title: "Reports (Practice & Qualifying Exams)",
    tags: ["New"],
    features: [
      {
        name: "User Activity Analytics",
        desc: "We now display users who recently answered practice questions alongside leaderboards for highest average scores and highest individual scores.",
      },
      {
        name: "Recent Participants & Leaderboard",
        desc: "See recent Qualifying Exam participants and a global Qualifying Exam leaderboard.",
      },
    ],
  },
  {
    title: "PDF Exporting",
    tags: ["Improved"],
    features: [
      {
        name: "Editable Font & Image Sizing",
        desc: "Control font sizes and image dimensions directly within the PDF export workflow.",
      },
      {
        name: "Shuffle Support",
        desc: "Questions and answer choices can now be shuffled before exporting.",
      },
      {
        name: "Split Downloads",
        desc: "Worksheets and answer keys are now available as separate downloads.",
      },
    ],
  },
  {
    title: "Student Experience",
    tags: ["Improved"],
    features: [
      {
        name: "Class Code Joining",
        desc: "Students can join and manage classes using a simple class code.",
      },
      {
        name: "Quiz History & Auto-Save",
        desc: "View attempt history, review results, and resume unfinished quizzes with automatic progress saving.",
      },
    ],
  },
  {
    title: "Administrative Controls",
    tags: ["New"],
    features: [
      {
        name: "Account Deletion & Qualifying Exam Controls",
        desc: "Deans can delete user accounts and toggle Qualifying Exam question creation and editing.",
      },
    ],
  },
  {
    title: "Bug Fixes & Improvements",
    tags: ["Fixed"],
    features: [
      {
        name: "Qualifying Exam PDF & Sorting Fixes",
        desc: "Fixed Qualifying Exam PDF generation, subject numbering alignment, and improved question sorting logic.",
      },
      {
        name: "UI & Navigation Polish",
        desc: "Enhanced overall UI design, visual consistency, and usability across all modules.",
      },
      {
        name: "More Bug Fixes",
        desc: "Fixed multiple system bugs and edge cases to ensure stability and usability.",
      },
    ],
  },
];

/* ── Tag styles ──────────────────────────────────────────────────────────── */
const TAG_CLASS = {
  New: "bg-green-100 text-green-700 border border-green-200",
  Improved: "bg-blue-100 text-blue-700 border border-blue-200",
  Fixed: "bg-red-100 text-red-700 border border-red-200",
};

/* ═══════════════════════════════════════════════════════════════════════════
   ChangelogModal
═══════════════════════════════════════════════════════════════════════════ */
const ChangelogModal = ({ onClose }) => {
  const overlayRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const section = SECTIONS[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === SECTIONS.length - 1;

  /* ESC to close */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleOverlay}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
    >
      {/* Modal card */}
      <div className="relative flex w-full max-w-[560px] max-h-[90vh] animate-[clg-in_0.3s_cubic-bezier(0.34,1.3,0.64,1)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <i className="bx bx-x text-[18px]" />
        </button>

        {/* ── Pinned: header + banner (never scrolls) ── */}
        <div className="shrink-0">
          {/* Header text */}
          <div className="px-6 pt-6 pb-0">
            <p className="outfit-400 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              System Update Log — v2.0.0
            </p>
            <h2 className="outfit-700 mt-1 text-[21px] leading-tight font-extrabold text-slate-900">
              What&apos;s New 🎉
            </h2>
            <p className="outfit-400 mt-1 text-[13px] leading-relaxed text-slate-500">
              Here&apos;s what we added while you were away.
            </p>
          </div>

          {/* Banner */}
          <div className="relative mt-4 h-48 overflow-hidden bg-gradient-to-br from-sky-100 via-sky-200 to-blue-300">
            {/* Blobs */}
            <div className="absolute -top-10 -left-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute -right-6 -bottom-8 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl" />

            {/* Mock phone cards */}
            <div className="relative z-10 flex h-full items-end justify-center gap-4 pb-2">
              {/* Phone 1 — dark */}
              <div className="w-[130px] translate-y-2.5 -rotate-[4deg] rounded-[18px] bg-slate-800 p-3 shadow-2xl">
                <div className="mb-2 rounded-lg bg-orange-500 p-2.5">
                  <div className="mb-1 flex justify-between">
                    <div className="h-1 w-10 rounded bg-white/50" />
                    <div className="h-1 w-4 rounded bg-white/30" />
                  </div>
                  <p className="font-mono text-[16px] font-black text-white">
                    95.4%
                  </p>
                  <p className="text-[9px] text-white/70">Average Score</p>
                </div>
                {[
                  { w: "w-[60%]", color: "bg-orange-400" },
                  { w: "w-[80%]", color: "bg-green-400" },
                  { w: "w-[45%]", color: "bg-blue-400" },
                  { w: "w-[90%]", color: "bg-purple-400" },
                ].map((bar, i) => (
                  <div key={i} className="mb-1.5 flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${bar.color}`}
                    />
                    <div className="h-1 flex-1 rounded bg-slate-600">
                      <div className={`h-full rounded ${bar.color} ${bar.w}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Phone 2 — white */}
              <div className="w-[130px] -translate-y-1 rotate-[3deg] rounded-[18px] bg-white p-3 shadow-2xl">
                <p className="mb-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  Quiz Sessions
                </p>
                {[
                  { label: "Active", count: 12, dot: "bg-green-500" },
                  { label: "Completed", count: 48, dot: "bg-blue-500" },
                  { label: "Classes", count: 7, dot: "bg-orange-500" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between border-b border-slate-50 py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                      <span className="text-[9px] text-slate-500">
                        {r.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">
                      {r.count}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1.5">
                  <i className="bx bx-trending-up text-[12px] text-green-600" />
                  <span className="text-[9px] font-bold text-green-600">
                    +24% this week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable: section content (scrolls if too tall) ── */}
        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 flex-1 overflow-y-auto">
          {/* Section name + tags + features */}
          <div className="px-6 pt-5 pb-2">
            <h3 className="outfit-700 text-[18px] font-extrabold text-slate-900">
              {section.title}
            </h3>

            {/* Tags */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className={`outfit-400 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TAG_CLASS[tag] ?? TAG_CLASS.New}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Feature list */}
            <p className="outfit-400 mt-4 mb-2.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              New Features and Improvements
            </p>
            <ol className="outfit-400 flex flex-col gap-2.5 pl-4 text-[13px] text-slate-600">
              {section.features.map((f, i) => (
                <li key={i} className="list-decimal leading-relaxed">
                  <strong className="outfit-700 text-slate-900">
                    {f.name}:
                  </strong>{" "}
                  {f.desc}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Pinned Footer (never scrolls) ── */}
        <div className="shrink-0 border-t border-slate-100 bg-white pt-2">
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pt-3 pb-1">
            {SECTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-1.5 cursor-pointer rounded-full border-none transition-all duration-200 ${
                  i === currentIdx
                    ? "w-5 bg-orange-500"
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-6 py-5">
            <p className="outfit-400 text-[12.5px] text-slate-500">
              {currentIdx + 1} of {SECTIONS.length} updates 👉
            </p>
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={() => setCurrentIdx((v) => v - 1)}
                  className="outfit-400 cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? onClose : () => setCurrentIdx((v) => v + 1)}
                className="outfit-400 flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-orange-600"
              >
                {isLast ? (
                  <>
                    Got it!
                    <i className="bx bx-check text-lg"></i>
                  </>
                ) : (
                  <>
                    Next
                    <i className="bx bx-arrow-right-stroke text-lg"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes clg-in {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ChangelogModal;
