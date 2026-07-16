import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "../components/header";

/* ─── Circular gauge ─────────────────────────────────────────────────── */
const ScoreGauge = ({ pct }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg
      width="136"
      height="136"
      viewBox="0 0 136 136"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="68"
        cy="68"
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="11"
      />
      <circle
        cx="68"
        cy="68"
        r={r}
        fill="none"
        stroke="#f97316"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
      />
    </svg>
  );
};

/* ─── Stat row ───────────────────────────────────────────────────────── */
const StatRow = ({ icon, iconBg, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[18px] ${iconBg}`}
    >
      <i className={`bx ${icon}`} />
    </div>
    <div>
      <p className="text-[10px] text-gray-700">{label}</p>
      <p className="text-[13px] font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────── */
const StudentQuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { result, questions, quiz, settings, error } = location.state || {};

  const [activeTab, setActiveTab] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  /* ── Feature flags derived from backend response ── */
  // Backend sends score: null when showScoreAfterQuiz is false,
  // but we can also check the settings explicitly if provided.
  const showScore =
    (settings && settings.showScoreAfterQuiz) ??
    (result && result.score !== null && result.score !== undefined);

  // Use the settings object if available (fallback to data-checking for safety)
  const showCorrectQuestion =
    (settings && settings.showCorrectQuestion) ??
    (questions && questions.length > 0 && "isCorrect" in questions[0]);

  const showCorrectAnswers =
    (settings && settings.showCorrectAnswers) ??
    (questions && questions.length > 0 && "correctChoice" in questions[0]);

  // Whether to render the questions review panel at all
  const showQuestions = showCorrectQuestion || showCorrectAnswers;

  /* ── Guards ── */
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
        <h2 className="mb-4 text-2xl font-bold text-red-500">
          Submission Failed
        </h2>
        <p className="mb-6 text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!result || !questions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-600">
          No Results Available
        </h2>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ── Simple "Thank You" — only when nothing is shown to the student ── */
  if (!showScore && !showQuestions) {
    return (
      <>
        <AdminHeader title="Student" />
        <div className="outfit min-h-screen p-4 pt-[56px] sm:p-6 sm:pt-[56px]">
          <div className="mx-auto mt-8 max-w-lg">
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-orange-100/70">
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[2.5px] border-orange-500 text-orange-500">
                  <i className="bx bx-check text-[28px]" />
                </div>
              </div>
              <h2 className="outfit-700 mb-2 text-[28px] tracking-tight text-[#0B1E36]">
                Thank You!
              </h2>
              <p className="outfit-400 mx-auto max-w-[280px] text-[16px] leading-relaxed text-gray-600">
                Your quiz has been successfully submitted and recorded.
              </p>

              <button
                onClick={() => navigate("/student-dashboard")}
                className="outfit-500 mt-10 w-60 cursor-pointer rounded-xl bg-orange-500 py-3.5 text-[15px] font-semibold text-white transition hover:bg-orange-600 active:scale-[0.97]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Derived ── */
  const pct = showScore ? Math.round(result.percentage ?? 0) : 0;

  const fmtDate = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return {
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const startFmt = fmtDate(result.started_at);
  const endFmt = fmtDate(result.submitted_at);

  const parseHtml = (text = "") =>
    (text || "")
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/_(.*?)_/g, "<u>$1</u>");

  /* ── Tabs (only when showCorrectQuestion) ── */
  const correctCount = showCorrectQuestion
    ? questions.filter((q) => q.isCorrect).length
    : 0;
  const incorrectCount = showCorrectQuestion
    ? questions.filter((q) => !q.isCorrect).length
    : 0;

  const tabs = [
    { key: "all", label: `All Questions (${questions.length})` },
    { key: "correct", label: `Correct (${correctCount})` },
    { key: "incorrect", label: `Incorrect (${incorrectCount})` },
  ];

  const filtered = showCorrectQuestion
    ? questions.filter((q) => {
        if (activeTab === "all") return true;
        if (activeTab === "correct") return q.isCorrect;
        if (activeTab === "incorrect") return !q.isCorrect;
        return true;
      })
    : questions;

  /* ── Score message ── */
  let message = "Keep studying! You can do better next time.";
  if (pct >= 75) message = "Excellent work! You've exceeded the average score.";
  else if (pct >= 50) message = "Good effort! Keep practicing to improve.";

  return (
    <>
      <AdminHeader title="Student" />
      <div className="outfit min-h-screen p-4 pt-[56px] sm:p-6 sm:pt-[56px]">
        <div className="mx-auto max-w-6xl">
          <div
            className={`flex flex-col gap-4 lg:flex-row ${
              !showQuestions ? "justify-center" : ""
            }`}
          >
            {/* ════════════════ LEFT PANEL ════════════════ */}
            <div
              className={`flex w-full flex-col gap-4 ${
                !showQuestions ? "lg:w-[680px]" : "lg:w-[320px]"
              } lg:shrink-0`}
            >
              {/* Grid wrapper for md screens */}
              <div
                className={`grid grid-cols-1 ${
                  !showQuestions
                    ? "md:grid-cols-2 lg:grid-cols-2 gap-6"
                    : "md:grid-cols-2 lg:grid-cols-1 gap-4"
                }`}
              >
                {/* ── Left Column (md) / Top Column (lg) ── */}
                <div className="flex flex-col gap-4">
                  {/* Score card or Thank You stub */}
                  {showScore ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      {/* header */}
                      <div className="mb-4 flex items-center justify-between">
                        <span className="outfit-500 text-[14px] font-semibold text-gray-800">
                          Your Score
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-white">
                          <i className="bx bx-chart-bar-big-columns text-[15px]" />
                        </span>
                      </div>

                      {/* circle gauge */}
                      <div className="relative mx-auto mb-3 flex h-[136px] w-[136px] items-center justify-center">
                        <ScoreGauge pct={pct} />
                        <div className="absolute flex flex-col items-center leading-none">
                          <span className="outfit-700 text-[28px] text-orange-500">
                            {Math.round(result.score)}/
                            {Math.round(result.total_score)}
                          </span>
                          <span className="outfit-400 mt-0.5 text-[9px] tracking-widest text-gray-400 uppercase">
                            overall
                          </span>
                        </div>
                      </div>

                      <p className="outfit-400 text-center text-[12px] leading-snug text-gray-500">
                        {message}
                      </p>
                    </div>
                  ) : (
                    /* Score hidden — show a compact "submitted" card */
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center">
                      <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange-100/70">
                        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full border-[2.5px] border-orange-500 text-orange-500">
                          <i className="bx bx-check text-[24px]" />
                        </div>
                      </div>
                      <h2 className="outfit-700 mb-1 text-[20px] tracking-tight text-[#0B1E36]">
                        Submitted!
                      </h2>
                      <p className="outfit-400 mx-auto max-w-[180px] text-[13px] leading-relaxed text-gray-500">
                        Your answers have been recorded.
                      </p>
                      <div className="mx-auto mt-5 h-[3px] w-10 rounded-full bg-orange-200" />
                    </div>
                  )}

                  {/* Dashboard button (md and large screens - Only when NOT showing questions) */}
                  <button
                    onClick={() => navigate("/student-dashboard")}
                    className={`outfit-500 hidden w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 md:flex ${showQuestions ? "lg:hidden" : ""}`}
                  >
                    <i className="bx bx-revision text-[16px]" />
                    Return to Dashboard
                  </button>
                </div>

                {/* ── Right Column (md) / Bottom Column (lg) ── Exam Statistics */}
                <div className="outfit-400 flex flex-col justify-center rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="outfit-500 mb-3 text-[10px] tracking-widest text-gray-400 uppercase">
                    Exam Statistics
                  </p>
                  <div className="space-y-2">
                    {result.time_taken_formatted && (
                      <StatRow
                        icon="bx-stopwatch"
                        iconBg="bg-teal-100 text-teal-500"
                        label="Time Taken"
                        value={result.time_taken_formatted}
                      />
                    )}
                    <StatRow
                      icon="bx-bolt-circle"
                      iconBg="bg-yellow-100 text-yellow-500"
                      label="Questions Answered"
                      value={`${questions.length}/${questions.length}`}
                    />
                    {showScore && (
                      <StatRow
                        icon="bx-trending-up"
                        iconBg="bg-orange-100 text-orange-500"
                        label="Score Percentage"
                        value={`${pct}%`}
                      />
                    )}
                    {startFmt && (
                      <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[18px] text-blue-500">
                          <i className="bx bx-calendar" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-700">
                            Date Started
                          </p>
                          <p className="text-[13px] font-semibold text-gray-800">
                            {startFmt.date}{" "}
                            <span className="text-[10px] font-normal text-gray-400">
                              {startFmt.time}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {endFmt && (
                      <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[18px] text-indigo-500">
                          <i className="bx bx-calendar-check" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-700">
                            Date Finished
                          </p>
                          <p className="text-[13px] font-semibold text-gray-800">
                            {endFmt.date}{" "}
                            <span className="text-[10px] font-normal text-gray-400">
                              {endFmt.time}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dashboard button (sm, or lg when showing questions) */}
              <button
                onClick={() => navigate("/student-dashboard")}
                className={`outfit-500 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 md:hidden ${showQuestions ? "lg:flex lg:mt-auto" : ""}`}
              >
                <i className="bx bx-revision text-[16px]" /> Return to Dashboard
              </button>
            </div>

            {/* ════════════════ RIGHT PANEL — Question Review ════════════════ */}
            {showQuestions && (
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl p-2 lg:p-5">
                  {/* ── Breadcrumb + Title ── */}
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <nav className="outfit-400 mb-1 flex items-center gap-1 text-[12px] text-gray-400">
                        <span className="font-medium">Quiz</span>
                        <i className="bx bx-chevron-right text-[14px]" />
                        <span className="text-orange-500">
                          {quiz?.title || "Results"}
                        </span>
                      </nav>
                      <h1 className="outfit-700 text-[22px] font-extrabold text-gray-900">
                        {quiz?.title ? `${quiz.title} Results` : "Quiz Results"}
                      </h1>
                    </div>

                    {/* Legend — only meaningful when showCorrectQuestion is on */}
                    {showCorrectQuestion && (
                      <div className="outfit-500 hidden items-center gap-4 text-[12px] lg:flex">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-green-500 text-white">
                            <i className="bx bx-check text-[14px]" />
                          </span>
                          <span className="text-gray-600">Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500 text-white">
                            <i className="bx bx-x text-[14px]" />
                          </span>
                          <span className="text-gray-600">Incorrect</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Tabs (only when showCorrectQuestion) ── */}
                  {showCorrectQuestion && (
                    <div className="outfit-400 mb-5 flex border-b border-gray-100">
                      {tabs.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveTab(t.key)}
                          className={`mr-1 cursor-pointer px-3 pt-1 pb-2 text-[13px] font-medium transition-colors ${
                            activeTab === t.key
                              ? "border-b-2 border-orange-500 text-orange-500"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Question cards ── */}
                  <div className="space-y-4">
                    {filtered.map((q, index) => {
                      const qNum = questions.indexOf(q) + 1;
                      // correct is null when showCorrectQuestion is off
                      const correct = showCorrectQuestion
                        ? q.isCorrect
                        : null;

                      return (
                        <div
                          key={q.personalQuizQuestionID ?? index}
                          className={`rounded-xl border bg-white p-5 ${
                            correct === true
                              ? "border-green-500"
                              : correct === false
                                ? "border-red-500"
                                : "border-gray-200"
                          }`}
                        >
                          {/* card header */}
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`outfit-500 flex h-7 w-7 items-center justify-center rounded-lg text-white ${
                                  correct === true
                                    ? "bg-green-500"
                                    : correct === false
                                      ? "bg-red-500"
                                      : "bg-gray-400"
                                }`}
                              >
                                {correct === true ? (
                                  <i className="bx bx-check text-[18px]" />
                                ) : correct === false ? (
                                  <i className="bx bx-x text-[18px]" />
                                ) : (
                                  <span className="text-[12px]">
                                    {String(qNum).padStart(2, "0")}
                                  </span>
                                )}
                              </span>
                              <span className="outfit-700 text-[16px] text-gray-800">
                                Question {qNum}
                              </span>
                            </div>
                            {/* Per-question score (when showScore) */}
                            {showScore && (
                              <span className="outfit-500 text-[12px] text-gray-400">
                                {q.earnedScore ?? 0}/{q.score ?? 0} pts
                              </span>
                            )}
                          </div>

                          {/* question text */}
                          <p
                            className="outfit-400 mb-3 text-[14px] leading-snug text-gray-800"
                            dangerouslySetInnerHTML={{
                              __html: parseHtml(q.questionText),
                            }}
                          />

                          {/* question image */}
                          {q.questionImage && (
                            <div className="mb-3 flex justify-center overflow-hidden rounded-xl">
                              <img
                                src={q.questionImage}
                                alt="Question"
                                className="max-h-[150px] max-w-[300px] cursor-pointer object-cover transition-opacity hover:opacity-80"
                                onClick={() => setLightbox(q.questionImage)}
                              />
                            </div>
                          )}

                          {/*
                           * YOUR ANSWER pill
                           * Show when showCorrectQuestion is on (regardless of right/wrong)
                           * OR when showCorrectQuestion is off but they answered (shows what they picked)
                           */}
                          {q.selectedChoice && (
                            <div className="mt-2">
                              <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                                Your Answer
                              </p>
                              <div
                                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium ${
                                  correct === true
                                    ? "border-green-400 bg-green-50 text-green-700"
                                    : correct === false
                                      ? "border-red-300 bg-red-50 text-red-600"
                                      : "border-gray-300 bg-gray-50 text-gray-700"
                                }`}
                              >
                                {showCorrectQuestion && (
                                  <i
                                    className={`bx text-[16px] ${
                                      correct
                                        ? "bx-check-circle"
                                        : "bxs-x-circle"
                                    }`}
                                  />
                                )}
                                {q.selectedChoice.image && (
                                  <img
                                    src={q.selectedChoice.image}
                                    alt="choice"
                                    className="max-h-[70px] cursor-pointer rounded object-contain hover:opacity-75"
                                    onClick={() =>
                                      setLightbox(q.selectedChoice.image)
                                    }
                                  />
                                )}
                                {q.selectedChoice.choiceText && (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: q.selectedChoice.choiceText,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {/* No answer given */}
                          {!q.selectedChoice && showCorrectQuestion && (
                            <div className="mt-2">
                              <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                                Your Answer
                              </p>
                              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13px] text-gray-400 italic">
                                No answer selected
                              </div>
                            </div>
                          )}

                          {/*
                           * CORRECT ANSWER pill
                           * Only shown when showCorrectAnswers is enabled (backend includes correctChoice key)
                           * Always shown (not just when wrong) so student can confirm right answer too
                           */}
                          {showCorrectAnswers && q.correctChoice && (
                            <div className="mt-3">
                              <p className="mb-1 text-[11px] font-semibold tracking-wide text-green-600 uppercase">
                                Correct Answer
                              </p>
                              <div className="flex items-center gap-2 rounded-lg border border-green-400 bg-green-50 px-4 py-2.5 text-[13px] font-medium text-green-700">
                                <i className="bx bx-check-circle text-[16px]" />
                                {q.correctChoice.image && (
                                  <img
                                    src={q.correctChoice.image}
                                    alt="correct"
                                    className="max-h-[70px] cursor-pointer rounded object-contain hover:opacity-75"
                                    onClick={() =>
                                      setLightbox(q.correctChoice.image)
                                    }
                                  />
                                )}
                                {q.correctChoice.choiceText && (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: q.correctChoice.choiceText,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filtered.length === 0 && (
                      <p className="outfit-400 py-10 text-center text-[13px] text-gray-400">
                        No questions in this category.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="lightbox-bg fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox}
              alt="Full view"
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default StudentQuizResults;
