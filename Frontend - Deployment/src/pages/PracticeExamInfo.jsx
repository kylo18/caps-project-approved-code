import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const PracticeExamInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectID,
    examData: providedExamData,
    examKey: providedExamKey,
  } = location.state || {};

  const [activeAttempt, setActiveAttempt] = useState(null);
  const [isExamModified, setIsExamModified] = useState(false);
  const [examData] = useState(providedExamData);

  /* ── check localStorage for an in-progress attempt ─────────────── */
  useEffect(() => {
    if (!subjectID || !examData) return;

    const examKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(`exam_${subjectID}_`),
    );

    for (const key of examKeys) {
      const savedVersion = localStorage.getItem(`${key}_version`);
      const savedTimer = localStorage.getItem(`${key}_timer`);
      const savedAnswers = localStorage.getItem(key);

      if (savedVersion && (savedTimer || savedAnswers)) {
        try {
          const version = JSON.parse(savedVersion);
          const currentCount = examData.questions?.length || 0;
          let storedSettings = {};
          if (version.settingsHash) {
            try {
              storedSettings = JSON.parse(version.settingsHash);
            } catch {
              /**/
            }
          }

          const modified =
            version.questionCount !== currentCount ||
            (examData.enableTimer !== undefined &&
              storedSettings.enableTimer !== examData.enableTimer) ||
            (examData.durationMinutes !== undefined &&
              storedSettings.durationMinutes !== examData.durationMinutes);

          if (modified) setIsExamModified(true);

          const remaining = savedTimer ? parseInt(savedTimer) : null;
          if ((remaining !== null && remaining > 0) || savedAnswers) {
            setActiveAttempt({
              remainingTime: remaining,
              hasAnswers: !!savedAnswers && savedAnswers !== "{}",
              examKey: key,
            });
            break;
          }
        } catch (err) {
          console.error("Error checking exam version:", err);
        }
      }
    }
  }, [subjectID, examData]);

  /* ── guard ──────────────────────────────────────────────────────── */
  if (!examData) {
    return (
      <div className="outfit-400 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No exam data found. Please select a subject first.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── handlers ───────────────────────────────────────────────────── */
  const handleContinueExam = () => {
    if (!activeAttempt) return;
    const savedAnswers = localStorage.getItem(activeAttempt.examKey);
    const savedBookmarks = localStorage.getItem(
      `${activeAttempt.examKey}_bookmarks`,
    );
    const savedQuestions = localStorage.getItem(
      `${activeAttempt.examKey}_questions`,
    );

    let examDataToUse = examData;
    if (savedQuestions) {
      try {
        examDataToUse = { ...examData, questions: JSON.parse(savedQuestions) };
      } catch {
        /**/
      }
    }

    navigate("/practice-exam", {
      state: {
        subjectID,
        examData: examDataToUse,
        examKey: activeAttempt.examKey,
        savedAnswers: savedAnswers ? JSON.parse(savedAnswers) : {},
        savedBookmarks: savedBookmarks ? JSON.parse(savedBookmarks) : [],
        resumeAttempt: true,
      },
    });
  };

  const handleStartExam = () => {
    if (activeAttempt && isExamModified) {
      if (
        activeAttempt.remainingTime !== null &&
        activeAttempt.remainingTime > 0
      ) {
        alert(
          "This exam has been modified. Please finish your current attempt or wait for the timer to expire.",
        );
        return;
      } else if (activeAttempt.hasAnswers) {
        alert(
          "This exam has been modified. Please finish your current attempt before starting a new one.",
        );
        return;
      }
    }
    if (activeAttempt && !isExamModified) {
      handleContinueExam();
      return;
    }
    navigate("/practice-exam", {
      state: { subjectID, examData, examKey: providedExamKey },
    });
  };

  /* ── derived values ─────────────────────────────────────────────── */
  const totalQuestions = examData.questions?.length ?? 0;
  const totalPoints = examData.totalPoints ?? "—";
  const duration = examData.enableTimer
    ? `${examData.durationMinutes} mins`
    : "No limit";

  const bullets = [
    {
      icon: "bx-check-circle",
      text: "Answer all questions to complete the submission",
    },
    ...(examData.enableTimer
      ? [
          {
            icon: "bx-stopwatch",
            text: `Strict time limit enforced; auto-submit after ${examData.durationMinutes} mins`,
          },
        ]
      : [
          {
            icon: "bx-time",
            text: "No time limit — take your time to complete it",
          },
        ]),
    {
      icon: "bx-bookmark",
      text: "You can bookmark questions to review them later",
    },
    {
      icon: "bx-wifi",
      text: "Stable internet connection required for live sync",
    },
  ];

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="outfit-400 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Active-attempt notice ──────────────────────────────── */}
        {activeAttempt && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <i className="bx bx-info-circle mt-0.5 text-lg text-amber-500" />
            <p className="text-[13px] text-amber-700">
              {isExamModified
                ? "This exam has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                : "You have an ongoing exam attempt. You can continue where you left off."}
              {activeAttempt.remainingTime !== null &&
                activeAttempt.remainingTime > 0 && (
                  <span className="ml-1 font-medium">
                    ({Math.floor(activeAttempt.remainingTime / 60)}m{" "}
                    {activeAttempt.remainingTime % 60}s remaining)
                  </span>
                )}
            </p>
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-6">
          {examData.subjectCode && (
            <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-orange-500">
              <i className="bx bx-book-bookmark text-base" />
              <span>
                {examData.subjectCode}
                {examData.subjectName ? ` ${examData.subjectName}` : ""}
              </span>
            </div>
          )}
          <h1 className="outfit-700 text-[28px] leading-tight font-bold break-words text-gray-900 sm:text-[32px]">
            {examData.examTitle || examData.subjectName || "Practice Exam"}
          </h1>
          {examData.coverageName && (
            <p className="mt-1 text-[14px] font-medium text-orange-400">
              {examData.coverageName}
            </p>
          )}
        </div>

        {/* ── Stat tiles ────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: "bx-list-ul", label: "Total Items", value: totalQuestions },
            { icon: "bx-star", label: "Total Points", value: totalPoints },
            { icon: "bx-stopwatch", label: "Duration", value: duration },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
            >
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                <i className={`bx ${icon} text-[15px] text-orange-400`} />
                {label}
              </div>
              <div className="outfit-700 text-[22px] font-bold text-gray-900">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Instructions panel ────────────────────────────────── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="px-6 py-5">
            <h2 className="outfit-700 mb-1 text-[17px] font-bold text-gray-900">
              Instructions
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
              Please read the following guidelines carefully before starting the
              exam. Ensure you have a stable environment to avoid disruptions
              during your attempt.
            </p>
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-gray-700"
                >
                  <i
                    className={`bx ${b.icon} mt-0.5 flex-shrink-0 text-[15px] text-orange-400`}
                  />
                  {b.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Footer actions ────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {/* Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-[14px] font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <i className="bx bx-arrow-left-stroke text-base" />
            Go Back
          </button>

          {/* Right buttons */}
          <div className="flex items-center gap-3">
            {/* Take New Exam — outline, shown when there's an active unmodified attempt */}
            {activeAttempt && !isExamModified && (
              <button
                onClick={handleStartExam}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-orange-400 bg-white px-5 py-2.5 text-[14px] font-medium text-orange-500 transition hover:bg-orange-50"
              >
                <i className="bx bx-refresh text-base" />
                Take New Exam
              </button>
            )}

            {/* Primary CTA */}
            {activeAttempt ? (
              <button
                onClick={handleContinueExam}
                className="hidden cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95"
              >
                Continue Exam
                <i className="bx bx-arrow-right-stroke text-base" />
              </button>
            ) : (
              <button
                onClick={handleStartExam}
                disabled={activeAttempt && isExamModified}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Exam
                <i className="bx bx-arrow-right-stroke text-base" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamInfo;
