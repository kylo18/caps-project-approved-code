import { useState, useEffect } from "react";

/**
 * QuestionListModal
 *
 * Props:
 *  isOpen              – boolean, controls visibility
 *  onClose             – () => void
 *  questions           – array of question objects
 *  currentIndex        – number, 0-based index of the current question
 *  answers             – object { [questionId]: choiceId }
 *  onQuestionClick     – (index: number) => void
 *  bookmarkedQuestions – array of question IDs that are bookmarked
 *  onToggleBookmark    – (questionId) => void   (optional)
 *  quizTitle           – string, shown in modal header (optional)
 *  quizSubtitle        – string, shown below title (optional)
 *  questionIdKey       – string, key to pluck the ID from a question object
 *                        defaults to "questionID"
 *                        use "personalQuizQuestionID" for StudentQuiz
 *  totalQuestions      – number, used for the progress bar denominator
 *                        defaults to questions.length
 */
const QuestionListModal = ({
  isOpen,
  onClose,
  questions = [],
  currentIndex = 0,
  answers = {},
  onQuestionClick,
  bookmarkedQuestions = [],
  onToggleBookmark,
  quizTitle,
  quizSubtitle,
  questionIdKey = "questionID",
  totalQuestions: totalQuestionsProp,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  // Auto-close when viewport reaches lg breakpoint (right panel becomes visible)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) onClose();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalQuestions = totalQuestionsProp ?? questions.length;
  const answeredCount = questions.filter(
    (q) => answers[q[questionIdKey]] !== undefined,
  ).length;
  const progressPct =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const filteredQuestions =
    activeTab === "bookmarked"
      ? questions.filter((q) => bookmarkedQuestions.includes(q[questionIdKey]))
      : questions;

  const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "");

  return (
    <div
      className="outfit lightbox-bg fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="outfit-400 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500">
            <i className="bx bx-file-detail text-[18px] text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {quizTitle ? (
              <>
                <p className="truncate text-[15px] font-bold text-gray-900">
                  {quizTitle}
                </p>
                {quizSubtitle && (
                  <p className="truncate text-[12px] text-gray-500">
                    {quizSubtitle}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[15px] font-bold text-gray-900">
                Question List
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <i className="bx bx-x text-[22px]" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100">
          {[
            { key: "all", label: "All Questions" },
            { key: "bookmarked", label: "Bookmarked" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`outfit-500 flex-1 cursor-pointer py-3 text-[13px] font-semibold transition-colors ${
                activeTab === key
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 px-5 py-2.5">
          {[
            { color: "bg-orange-500", label: "Current" },
            { color: "bg-green-500", label: "Completed" },
            { color: "bg-yellow-400", label: "Bookmarked" },
            { color: "bg-gray-300", label: "Unanswered" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`}
              />
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Question list ── */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <i className="bx bx-bookmark mb-2 text-4xl" />
              <p className="text-[12px]">No bookmarked questions yet</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const qid = q[questionIdKey];
              const idx = questions.findIndex(
                (item) => item[questionIdKey] === qid,
              );
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[qid] !== undefined;
              const isBookmarked = bookmarkedQuestions.includes(qid);
              const snippet =
                stripHtml(q.questionText || "").slice(0, 60) ||
                `Question ${idx + 1}`;
              const preview =
                snippet.length < stripHtml(q.questionText || "").length
                  ? snippet + "..."
                  : snippet;

              if (isCurrent) {
                /* ── Current question card ── */
                return (
                  <div
                    key={qid}
                    className="mx-3 mb-1 rounded-xl bg-orange-50 px-4 py-3 ring-1 ring-orange-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Current indicator icon */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 shadow">
                        <i className="bx bx-play text-[20px] text-white" />
                      </div>
                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className="text-[13px] font-bold text-gray-800">
                            Question {idx + 1}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-[11px] text-gray-500">
                          {preview}
                        </p>
                      </div>
                      {/* Resume button */}
                      <button
                        onClick={() => {
                          onQuestionClick?.(idx);
                          onClose();
                        }}
                        className="flex-shrink-0 cursor-pointer rounded-lg bg-orange-500 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.97]"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                );
              }

              /* ── Normal question row ── */
              return (
                <button
                  key={qid}
                  onClick={() => {
                    onQuestionClick?.(idx);
                    onClose();
                  }}
                  className="mx-3 mb-0.5 flex w-[calc(100%-24px)] cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  {/* Status icon */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
                    {isAnswered && isBookmarked ? (
                      /* Bookmarked + answered: show bookmark with green checkmark */
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
                        <i className="bx bxs-bookmark text-[18px] text-yellow-400" />
                        <span className="absolute -right-1 -bottom-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-green-500">
                          <i className="bx bx-check text-[10px] font-bold text-white" />
                        </span>
                      </div>
                    ) : isAnswered ? (
                      /* Answered (completed) */
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                        <i className="bx bx-check-circle text-[20px] text-green-500" />
                      </div>
                    ) : isBookmarked ? (
                      /* Bookmarked, unanswered */
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                        <i className="bx bxs-bookmark text-[18px] text-yellow-400" />
                      </div>
                    ) : (
                      /* Unanswered */
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <span className="h-4 w-4 rounded-full border-2 border-gray-300 bg-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-800">
                        Question {idx + 1}
                      </p>
                      {isAnswered && (
                        <i className="bx bx-check-circle text-[14px] text-green-500" />
                      )}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-gray-400">
                      {preview}
                    </p>
                  </div>

                  {/* Chevron */}
                  <i className="bx bx-chevron-right flex-shrink-0 text-[20px] text-gray-300 transition-colors group-hover:text-orange-400" />
                </button>
              );
            })
          )}
        </div>

        {/* ── Footer: progress ── */}
        <div className="border-t border-gray-200 px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="outfit-700 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Progress
            </span>
            <span className="text-[12px] font-semibold text-gray-600">
              {answeredCount} / {totalQuestions}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionListModal;
