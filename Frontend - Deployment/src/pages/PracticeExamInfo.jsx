import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import WarningModal from "../components/WarningModal";

const PracticeExamInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectID,
    examData: providedExamData,
    examKey: providedExamKey,
  } = location.state || {};

  const { toast, showToast } = useToast();

  const [activeAttempt, setActiveAttempt] = useState(null);
  const [isExamModified, setIsExamModified] = useState(false);
  const [examData] = useState(providedExamData);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'start', 'retake', or 'continue'

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
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit-400 flex min-h-screen items-center justify-center bg-[#faf9f7] p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
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
      </>
    );
  }

  /* ── handlers ───────────────────────────────────────────────────── */
  const handleContinueExam = () => {
    if (!activeAttempt) return;

    setLoadingAction("continue");

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
        showToast(
          "This exam has been modified. Please finish your current attempt or wait for the timer to expire.",
          "error",
        );
        return;
      } else if (activeAttempt.hasAnswers) {
        showToast(
          "This exam has been modified. Please finish your current attempt before starting a new one.",
          "error",
        );
        return;
      }
    }
    if (activeAttempt && !isExamModified) {
      handleContinueExam();
      return;
    }
    setLoadingAction("start");
    navigate("/practice-exam", {
      state: { subjectID, examData, examKey: providedExamKey },
    });
  };

  /* open retake modal when there IS an active attempt */
  const handleRetakeClick = () => {
    setShowRetakeModal(true);
  };

  /* discard existing attempt data and start fresh */
  const handleForceRetake = () => {
    if (activeAttempt?.examKey) {
      localStorage.removeItem(activeAttempt.examKey);
      localStorage.removeItem(`${activeAttempt.examKey}_version`);
      localStorage.removeItem(`${activeAttempt.examKey}_timer`);
      localStorage.removeItem(`${activeAttempt.examKey}_bookmarks`);
      localStorage.removeItem(`${activeAttempt.examKey}_questions`);
    }
    setShowRetakeModal(false);
    setLoadingAction("retake");
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
      icon: "bx-wifi",
      text: "Stable internet connection required for live sync",
    },
  ];

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="outfit-400 mt-6 min-h-screen lg:mt-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* ── Header ────────────────────────────────────────────── */}
          <div className="mb-6">
            <h1 className="outfit-700 text-[28px] leading-tight font-bold break-words text-gray-900 sm:text-[32px]">
              {examData.examTitle || examData.subjectName || "Practice Exam"}
            </h1>
            {(examData.coverageName || examData.subjectCode) && (
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-orange-500">
                <i className="bx bx-book-bookmark text-base" />
                <span>
                  {examData.coverageName ||
                    `${examData.subjectCode}${examData.subjectName ? ` ${examData.subjectName}` : ""}`}
                </span>
              </div>
            )}
          </div>

          {/* ── Stat tiles ────────────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                icon: "bx-list-ul",
                label: "Total Items",
                value: totalQuestions,
              },
              { icon: "bx-star", label: "Total Points", value: totalPoints },
              { icon: "bx-stopwatch", label: "Duration", value: duration },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4"
              >
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                  <i className={`bx ${icon} text-[15px] text-orange-400`} />
                  {label}
                </div>
                <div className="outfit-700 text-[18px] font-bold text-gray-900 md:text-[22px]">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Instructions panel ────────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="px-6 py-5">
              <h2 className="outfit-700 mb-1 text-[17px] font-bold text-gray-900">
                Instructions
              </h2>
              <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
                Please read the following guidelines carefully before starting
                the exam. Ensure you have a stable environment to avoid
                disruptions during your attempt.
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

          {/* ── Clickable active-attempt banner ───────────────────── */}
          {activeAttempt && (
            <div
              onClick={loadingAction === null ? handleContinueExam : undefined}
              className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition lg:-mt-5 ${
                loadingAction === "continue"
                  ? "pointer-events-none border-gray-200 bg-gray-50 opacity-70"
                  : "cursor-pointer border-amber-200 bg-amber-50 active:scale-97"
              }`}
            >
              <div className="flex items-start gap-3">
                {loadingAction === "continue" ? (
                  <span className="loader-orange mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <i className="bx bx-info-circle mt-0.5 text-lg text-amber-500" />
                )}

                <p
                  className={`text-[13px] ${loadingAction === "continue" ? "text-gray-600" : "text-amber-700"}`}
                >
                  {loadingAction === "continue"
                    ? "Resuming your session…"
                    : isExamModified
                      ? "This exam has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                      : "You have an ongoing exam attempt. Click here to continue where you left off."}

                  {loadingAction !== "continue" &&
                    activeAttempt.remainingTime !== null &&
                    activeAttempt.remainingTime > 0 && (
                      <span className="ml-1 font-medium">
                        ({Math.floor(activeAttempt.remainingTime / 60)}m{" "}
                        {activeAttempt.remainingTime % 60}s remaining)
                      </span>
                    )}
                </p>
              </div>

              {loadingAction !== "continue" && (
                <i className="bx bx-chevron-right shrink-0 text-xl text-amber-500" />
              )}
            </div>
          )}

          {/* ── Footer actions ────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            {/* Go Back */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-[14px] font-medium text-gray-600 transition hover:bg-gray-100 active:scale-95"
            >
              <i className="bx bx-arrow-left-stroke text-base" />
              Back
            </button>

            {/* Right buttons */}
            <div className="flex items-center gap-3">
              {/* Retake — shown when there's an active unmodified attempt */}
              {activeAttempt && !isExamModified && (
                <button
                  onClick={handleRetakeClick}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-600 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                  </svg>
                  Start Exam
                </button>
              )}

              {/* Start button — only shown when no active attempt */}
              {!activeAttempt && (
                <button
                  onClick={handleStartExam}
                  disabled={loadingAction === "start"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                >
                  {loadingAction === "start" ? (
                    <>Starting…</>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                      </svg>
                      Start Exam
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Retake warning modal ──────────────────────────────────── */}
      <WarningModal
        isOpen={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        title="Ongoing Attempt Detected"
        subtitle="You have an unfinished attempt."
        description={
          <>
            Starting a new attempt will{" "}
            <span className="font-semibold text-red-500">
              permanently discard
            </span>{" "}
            your current progress, including any answers you have already
            submitted. This action cannot be undone.
          </>
        }
        confirmLabel="Retake Exam"
        confirmIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        }
        onConfirm={handleForceRetake}
        cancelLabel="Continue"
        isConfirmLoading={loadingAction === "retake"}
        isCancelLoading={loadingAction === "continue"}
        cancelIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
          </svg>
        }
        onCancel={() => {
          handleContinueExam();
        }}
      />
    </>
  );
};

export default PracticeExamInfo;
