import { useEffect, useRef, useState } from "react";

import Step1Img from "../assets/walkthrough/step1quiz.png";
import Step2Img from "../assets/walkthrough/step2quiz.png";
import Step3Img from "../assets/walkthrough/step3quiz.png";
import Step4Img from "../assets/walkthrough/step4quiz.png";

/* ── Walkthrough steps ──────────────────────────────────────────────────── */
const STEPS = [
  {
    step: "Step 1",
    title: "Create a Quiz",
    image: Step1Img,
    items: [
      "Start by creating a new quiz and entering the required details.",
      "You can choose between a subject-based quiz or a custom quiz depending on your needs.",
    ],
  },
  {
    step: "Step 2",
    title: "Configure Your Quiz",
    image: Step2Img,
    items: [
      "After creation, you can access your quiz dashboard where you can view quiz contents.",
      "Monitor recent answerers and check leaderboard rankings.",
    ],
  },
  {
    step: "Step 3",
    title: "Manage Questions",
    image: Step3Img,
    items: [
      "Click Manage Questions to add new questions, edit existing ones, or remove questions as needed.",
      "If your quiz is subject-based, you can also import questions from Practice Exams or the Qualifying Exam question bank.",
    ],
  },
  {
    step: "Step 4",
    title: "Export Quiz",
    image: Step4Img,
    items: [
      "When ready, you can easily export your quiz into a PDF format for printing or sharing.",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   QuizWalkthroughModal
═══════════════════════════════════════════════════════════════════════════ */
const QuizWalkthroughModal = ({ onClose }) => {
  const overlayRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const step = STEPS[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === STEPS.length - 1;

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
      <div className="relative flex max-h-[90vh] w-full max-w-[560px] animate-[clg-in_0.3s_cubic-bezier(0.34,1.3,0.64,1)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <i className="bx bx-x text-[18px]" />
        </button>

        {/* ── Pinned: header (never scrolls) ── */}
        <div className="shrink-0">
          {/* Header text */}
          <div className="px-6 pt-6 pb-0">
            <p className="outfit-400 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              Quiz Setup Guide
            </p>
            <h2 className="outfit-700 mt-1 text-[21px] leading-tight font-extrabold text-slate-900">
              Welcome to Quizzes 📝
            </h2>
            <p className="outfit-400 mt-1 text-[13px] leading-relaxed text-slate-500">
              Here&apos;s how to create and manage quizzes in the system.
            </p>
          </div>

          {/* Step image banner */}
          <div className="relative mt-4 h-52 overflow-visible bg-gradient-to-br from-orange-50 via-amber-100 to-orange-200">
            {/* Decorative blobs */}
            <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />
            <div className="absolute -right-4 -bottom-6 h-36 w-36 rounded-full bg-orange-300/20 blur-3xl" />

            {/* Step illustration */}
            <div className="relative z-10 flex h-full items-center justify-center px-4">
              <img
                src={step.image}
                alt={step.title}
                className="max-h-44 max-w-full rounded-xl object-contain drop-shadow-xl transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* ── Scrollable: step content ── */}
        <div className="relative z-20 -mt-10 flex-1 overflow-y-auto rounded-t-2xl bg-white px-6 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
          <h3 className="outfit-700 mb-3 text-[16px] font-bold text-slate-800">
            {step.title}
          </h3>

          <ul className="space-y-2">
            {step.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <i className="bx bx-check text-[13px] font-bold text-orange-600" />
                </span>
                <span className="outfit-400 text-[13px] leading-relaxed text-slate-600">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Pinned footer ── */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          {/* Step dots */}
          <div className="mb-3 flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? "w-6 bg-orange-600"
                    : "w-2 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setCurrentIdx((i) => i - 1)}
                className="outfit-500 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <i className="bx bx-arrow-back text-[16px]" />
                Back
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setCurrentIdx((i) => i + 1)}
              className="outfit-500 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-orange-700 active:scale-95"
            >
              {isLast ? (
                <>
                  <i className="bx bx-check text-[16px]" />
                  Got it!
                </>
              ) : (
                <>
                  Next
                  <i className="bx bx-right-arrow-alt text-[16px]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizWalkthroughModal;
