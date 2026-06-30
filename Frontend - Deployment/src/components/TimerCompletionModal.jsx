/**
 * TimerCompletionModal
 *
 * Props:
 *  isOpen            – boolean
 *  onClose           – () => void   — "Review Answers" (stay on quiz)
 *  onConfirm         – () => void   — "Submit Exam"
 *  totalQuestions    – number
 *  answeredQuestions – number
 *  timeUsedSeconds   – number (optional) total seconds elapsed; shows "–" if omitted
 *  quizId            – string/number (optional) shown in footer system ID
 */
const TimerCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions = 0,
  answeredQuestions = 0,
  timeUsedSeconds,
  quizId,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const skipped = totalQuestions - answeredQuestions;
  const pct = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

  /* ── SVG ring ── */
  const R = 52; // radius
  const C = 2 * Math.PI * R;
  const filled = C * pct;
  const gap = C - filled;

  /* ── Time used formatting ── */
  const formatTime = (s) => {
    if (s == null) return "–";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const systemId = quizId
    ? `QUIZ-${String(quizId).padStart(6, "0")}-SESSION-END`
    : "SESSION-END";

  return (
    <div className="outfit lightbox-bg fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* ── Tinted top area ── */}
        <div className="flex flex-col items-center bg-gradient-to-b from-orange-50 to-white px-6 pt-8 pb-2">
          {/* Progress ring */}
          <div className="relative mb-5">
            <svg width="140" height="140" className="-rotate-90">
              {/* Track */}
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              {/* Progress arc */}
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="#f97316"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                strokeDashoffset="0"
              />
            </svg>

            {/* Centre text */}
            <div className="outfit-700 absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px] leading-none text-gray-800">
                {answeredQuestions}/{totalQuestions}
              </span>
              <span className="outfit-400 mt-0.5 text-[9px] tracking-widest text-gray-400 uppercase">
                Completed
              </span>
            </div>

            {/* Checkmark badge */}
            <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-orange-500 shadow-md">
              <i className="bx bx-check text-[18px] font-bold text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="outfit-700 mb-0.5 text-[24px] text-gray-900">
            Time&apos;s Up!
          </h2>
          <p className="outfit-700 mb-4 text-[14px] text-orange-500">
            Great Effort!
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pb-6">
          <p className="outfit-400 mb-5 text-center text-[13px] leading-relaxed text-gray-500">
            The exam window has officially closed. Your progress has been
            automatically saved.
          </p>

          {/* Stats row */}
          <div className="outfit-400 mb-5 flex divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {[
              { label: "Time Used", value: formatTime(timeUsedSeconds) },
              {
                label: "Answered",
                value: String(answeredQuestions).padStart(2, "0"),
              },
              { label: "Skipped", value: String(skipped).padStart(2, "0") },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-1 flex-col items-center py-2.5"
              >
                <span className="outfit-400 mb-0.5 text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                  {label}
                </span>
                <span className="outfit-700 text-[18px] font-black text-gray-800">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Submit Exam button */}
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="outfit-700 mb-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-[14px] text-white shadow-md transition-colors hover:bg-orange-600 active:scale-[0.98] disabled:cursor-auto disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Submitting…</span>
            ) : (
              "Submit Exam"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerCompletionModal;
