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
const StatRow = ({ icon, iconBg, label, value, valueSuffix }) => (
  <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[18px] ${iconBg}`}
    >
      <i className={`bx ${icon} `} />
    </div>
    <div>
      <p className="text-[10px] text-gray-700">{label}</p>
      <p className="text-[13px] font-semibold text-gray-800">
        {value}
        {valueSuffix && (
          <span className="ml-1 text-[11px] font-medium text-red-400">
            {valueSuffix}
          </span>
        )}
      </p>
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────── */
const PracticeTestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    score,
    results,
    error,
    examDuration,
    startTime,
    endTime,
    subjectID,
    subjectName,
    examTitle,
  } = location.state || {};

  const [activeTab, setActiveTab] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  /* ── guards ── */
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

  if (!score || !results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-500">
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

  /* ── helpers ── */
  const fmtDate = (s) => {
    if (!s) return "N/A";
    const d = new Date(s);
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  };

  const pct =
    score.percentage ??
    Math.round((score.earnedPoints / score.totalPoints) * 100);
  const correctCount = results.filter((q) => q.isCorrect).length;
  const incorrectCount = results.filter((q) => !q.isCorrect).length;

  const tabs = [
    { key: "all", label: `All Questions (${results.length})` },
    { key: "correct", label: `Correct (${correctCount})` },
    { key: "incorrect", label: `Incorrect (${incorrectCount})` },
  ];

  const filtered = results.filter((q) => {
    if (activeTab === "correct") return q.isCorrect;
    if (activeTab === "incorrect") return !q.isCorrect;
    return true;
  });

  const parseHtml = (text = "") =>
    (text || "")
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/_(.*?)_/g, "<u>$1</u>");

  const startFmt = fmtDate(startTime);
  const endFmt = fmtDate(endTime);

  /* ── render message ── */
  let message = "Keep studying! You can do better next time.";
  if (pct >= 75) message = "Excellent work! You've exceeded the average score.";
  else if (pct >= 50) message = "Good effort! Keep practicing to improve.";

  return (
    <>
      <AdminHeader title="Student" />
      <div className="outfit min-h-screen p-4 pt-[56px] sm:p-6 sm:pt-[56px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* ════════════════ LEFT PANEL ════════════════ */}
            <div className="flex w-full flex-col gap-4 lg:w-[248px] lg:shrink-0">
              {/* Grid wrapper for md screens */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
                {/* ── Left Column (md) / Top Column (lg) ── */}
                <div className="flex flex-col gap-4">
                  {/* Score card */}
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
                          {score.earnedPoints}/{score.totalPoints}
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

                  {/* Retake button (visible on md only, hidden on sm and lg) */}
                  <button
                    onClick={() => navigate("/student-dashboard")}
                    className="outfit-500 mt-auto hidden w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 md:flex lg:hidden"
                  >
                    <i className="bx bx-revision text-[16px]" />
                    Return to Dashboard{" "}
                  </button>
                </div>

                {/* ── Right Column (md) / Bottom Column (lg) ── */}
                {/* Key Statistics card (spans full height of left column on md) */}
                <div className="outfit-400 rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="outfit-500 mb-3 text-[10px] tracking-widest text-gray-400 uppercase">
                    Exam Statistics
                  </p>
                  <div className="space-y-2">
                    <StatRow
                      icon="bx-stopwatch"
                      iconBg="bg-teal-100 text-teal-500"
                      label="Time Taken"
                      value={examDuration || "N/A"}
                    />
                    <StatRow
                      icon="bx-bolt-circle"
                      iconBg="bg-yellow-100 text-yellow-500"
                      label="Questions Answered"
                      value={`${results.length}/${results.length}`}
                    />
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

              {/* Retake button (visible on sm and lg, hidden on md) */}
              <button
                onClick={() => navigate("/student-dashboard")}
                className="outfit-500 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 md:hidden lg:flex"
              >
                <i className="bx bx-revision text-[16px]" /> Return to Dashboard
              </button>
            </div>

            {/* ════════════════ RIGHT PANEL ════════════════ */}
            <div className="min-w-0 flex-1">
              <div className="rounded-2xl p-2 lg:p-5">
                {/* ── Breadcrumb + Title ── */}
                <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <nav className="outfit-400 mb-1 flex items-center gap-1 text-[12px] text-gray-400">
                      <span className="font-medium">Practice Exam</span>
                      <i className="bx bx-chevron-right text-[14px]" />
                      <span className="text-orange-500">
                        {subjectName || `Subject ${subjectID}`}
                      </span>
                    </nav>
                    <h1 className="outfit-700 text-[22px] font-extrabold text-gray-900">
                      {examTitle || subjectName
                        ? `${examTitle || subjectName} Practice Exam`
                        : "Practice Exam"}
                    </h1>
                  </div>

                  {/* Legend (lg and above) */}
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
                </div>

                {/* Tabs */}
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

                {/* Question cards */}
                <div className="space-y-4">
                  {filtered.map((q) => {
                    const qNum = results.indexOf(q) + 1;
                    const correct = q.isCorrect;
                    const pts = q.pointsPossible ?? q.score ?? 0;

                    return (
                      <div
                        key={q.questionID ?? qNum}
                        className={`rounded-xl border bg-white p-5 ${
                          correct ? "border-green-500" : "border-red-500"
                        }`}
                      >
                        {/* card header row */}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`outfit-500 flex h-7 w-7 items-center justify-center rounded-lg text-white ${
                                correct ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              <i
                                className={`bx ${correct ? "bx-check" : "bx-x"} text-[18px]`}
                              />
                            </span>
                            <span className="outfit-700 text-[16px] text-gray-800">
                              Question {qNum}
                            </span>
                          </div>
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

                        {/* Selected / user's answer pill (Shown only if correct) */}
                        {q.selectedChoice && correct && (
                          <div
                            className={`mb-2 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium ${
                              correct
                                ? "border-green-400 bg-green-50 text-green-700"
                                : "border-red-300 bg-red-50 text-red-600"
                            }`}
                          >
                            <i
                              className={`bx text-[16px] ${
                                correct ? "bx-check-circle" : "bx-x-circle"
                              }`}
                            />
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
                        )}

                        {/* Correct answer (shown when wrong) */}
                        {!correct && q.correctChoice && (
                          <div className="mb-2 flex items-center gap-2 rounded-lg border border-green-400 bg-green-50 px-4 py-2.5 text-[13px] font-medium text-green-700">
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

export default PracticeTestResult;
