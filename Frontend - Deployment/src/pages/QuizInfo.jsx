import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

/* ── small helpers ───────────────────────────────────────────────── */
const pct = (val) =>
  typeof val === "number" ? val.toFixed(0) : parseFloat(val || 0).toFixed(0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* score badge colour */
const scoreBadge = (p) => {
  const n = parseFloat(p);
  if (n >= 75) return "bg-green-100 text-green-700";
  if (n >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-600";
};

/* ─────────────────────────────────────────────────────────────────── */
const QuizInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { classPersonalQuizID } = useParams();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  const [quizInfo, setQuizInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [isQuizModified, setIsQuizModified] = useState(false);

  const stateClassPersonalQuizID = location.state?.classPersonalQuizID;
  const quizID = classPersonalQuizID || stateClassPersonalQuizID;
  const classID = location.state?.classID;
  const quiz = location.state?.quiz;

  /* ── fetch ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchQuizInfo = async () => {
      if (!quizID) {
        setError("Quiz ID is missing. Please select a quiz first.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("token");
        if (!token)
          throw new Error("You are not authenticated. Please log in again.");

        const response = await fetch(`${apiUrl}/quizzes/${quizID}/info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }
          let msg = "Failed to load quiz information.";
          try {
            const d = await response.json();
            msg = d?.message || d?.error || msg;
          } catch {
            /* */
          }
          throw new Error(msg);
        }

        const data = await response.json();
        if (!data.success)
          throw new Error(data.message || "Failed to fetch quiz information");
        setQuizInfo(data.quizInfo);
        console.log("🔍 quizInfo.settings:", data.quizInfo?.settings);

        // Check for active local attempt
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(`quiz_${quizID}_attempt_`),
        );
        for (const key of keys) {
          const savedVersion = localStorage.getItem(`${key}_version`);
          const savedTimer = localStorage.getItem(`${key}_timer`);
          const savedAnswers = localStorage.getItem(key);
          if (savedVersion && (savedTimer || savedAnswers)) {
            try {
              const version = JSON.parse(savedVersion);
              const curQ = data.quizInfo.statistics?.totalItems || 0;
              const curS = data.quizInfo.settings || {};
              let storedS = {};
              if (version.settingsHash) {
                try {
                  storedS = JSON.parse(version.settingsHash);
                } catch {
                  /**/
                }
              }
              const modified =
                version.questionCount !== curQ ||
                (curS.quizTimerEnabled !== undefined &&
                  storedS.quizTimerEnabled !== curS.quizTimerEnabled) ||
                (curS.timeDuration?.minutes !== undefined &&
                  storedS.quizTimer !== curS.timeDuration.minutes);
              if (modified) setIsQuizModified(true);
              setActiveAttempt({
                attemptNumber: parseInt(key.split("_attempt_")[1]),
                remainingTime: savedTimer ? parseInt(savedTimer) : null,
                hasAnswers: !!savedAnswers,
                key,
              });
              break;
            } catch (err) {
              console.error("Error checking quiz version:", err);
            }
          }
        }
      } catch (err) {
        const msg =
          err.message || "Failed to load quiz information. Please try again.";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizID, apiUrl]);

  /* ── handlers ───────────────────────────────────────────────────── */
  const handleContinueQuiz = () => {
    if (!activeAttempt) return;
    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo,
        resumeAttempt: true,
        attemptNumber: activeAttempt.attemptNumber,
        isModified: isQuizModified,
      },
    });
  };

  const handleStartQuiz = () => {
    if (!quizInfo?.availability?.isAvailable) {
      showToast("This quiz is not available at this time.", "error");
      return;
    }
    if (activeAttempt && isQuizModified) {
      if (
        activeAttempt.remainingTime !== null &&
        activeAttempt.remainingTime > 0
      ) {
        showToast(
          "This quiz has been modified. Please finish your current attempt or wait for the timer to expire.",
          "error",
        );
        return;
      } else if (activeAttempt.hasAnswers) {
        showToast(
          "This quiz has been modified. Please finish your current attempt before starting a new one.",
          "error",
        );
        return;
      }
    }
    if (activeAttempt && !isQuizModified) {
      handleContinueQuiz();
      return;
    }
    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo,
      },
    });
  };

  /* ── loading / error states ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit-400 flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <div className="text-center">
            <div className="loader mx-auto mb-3"></div>
            <p className="text-[14px] text-gray-500">
              Loading quiz information...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !quizInfo) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit-400 flex min-h-screen items-center justify-center bg-[#faf9f7] p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error ||
                "No quiz information found. Please select a quiz first."}
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

  const {
    quiz: quizData,
    statistics,
    settings,
    classAssignment,
    attempts,
    availability,
  } = quizInfo;

  /* derived values */
  const subjectCode = quizData?.subject?.subjectCode || null;
  const subjectName = quizData?.subject?.subjectName || null;
  const quizTitle = quizData?.title || "Untitled Quiz";
  const coverageLabel = quizData?.coverage?.name
    ? `${quizData.coverage.name} Examination`
    : classAssignment?.className
      ? classAssignment.className
      : null;

  const totalItems = statistics?.totalItems ?? "—";
  const totalPoints = statistics?.totalPoints ?? "—";
  const duration = settings?.timeDuration?.formatted || "No limit";
  const maxAttempts = settings?.quizAttempts || "∞";
  const usedAttempts = attempts?.attemptCount ?? 0;

  const prevAttempts = attempts?.previousAttempts || [];

  const canStartNew =
    availability?.isAvailable && !(activeAttempt && isQuizModified);

  /* instruction bullet list */
  const bullets = [];
  if (quizData.instruction) {
    // split by newline
    quizData.instruction
      .split("\n")
      .filter(Boolean)
      .forEach((line) => bullets.push({ icon: "bx-circle", text: line }));
  } else {
    bullets.push({
      icon: "bx-check-circle",
      text: "Answer all questions to complete the submission",
    });
    if (settings?.quizTimerEnabled && settings?.timeDuration) {
      bullets.push({
        icon: "bx-history",
        text: `Strict time limit enforced; auto-submit after ${settings.timeDuration.formatted}`,
      });
    }
    if (settings?.shuffleQuestions)
      bullets.push({
        icon: "bx-shuffle",
        text: "Questions will be shuffled each attempt",
      });
    if (settings?.shuffleChoices)
      bullets.push({
        icon: "bx-shuffle",
        text: "Answer choices will be shuffled",
      });
    bullets.push({
      icon: "bx-wifi",
      text: "Stable internet connection required for live sync",
    });
  }

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="outfit-400 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* ── Availability warning ─────────────────────────────── */}
          {!availability?.isAvailable && availability?.message && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <i className="bx bx-error-circle mt-0.5 text-lg text-amber-500" />
              <p className="text-[13px] text-amber-700">
                {availability.message}
              </p>
            </div>
          )}

          {/* ── Active-attempt notice ────────────────────────────── */}
          {activeAttempt && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <i className="bx bx-info-circle mt-0.5 text-lg text-amber-500" />
              <p className="text-[13px] text-amber-700">
                {isQuizModified
                  ? "This quiz has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                  : "You have an ongoing quiz attempt. You can continue where you left off."}
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

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="mb-6">
            {subjectCode && (
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-orange-500">
                <i className="bx bx-book-bookmark text-base" />
                <span>
                  {subjectCode}
                  {subjectName ? ` ${subjectName}` : ""}
                </span>
              </div>
            )}
            <h1 className="outfit-700 text-[28px] leading-tight font-bold break-words text-gray-900 sm:text-[32px]">
              {quizTitle}
            </h1>
            {coverageLabel && (
              <p className="mt-1 text-[14px] font-medium text-orange-400">
                {coverageLabel}
              </p>
            )}
          </div>

          {/* ── Stat tiles ──────────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "bx-list-ul", label: "Total Items", value: totalItems },
              { icon: "bx-star", label: "Total Points", value: totalPoints },
              {
                icon: "bx-stopwatch",
                label: "Duration",
                value: duration,
              },
              {
                icon: "bx-history",
                label: "Attempts",
                value: maxAttempts,
              },
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

          {/* ── Instructions panel ──────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="px-6 py-5">
              <h2 className="outfit-700 mb-1 text-[17px] font-bold text-gray-900">
                Instructions
              </h2>
              <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
                Please read the following guidelines carefully before starting
                the quiz. Ensure you have a stable environment to avoid
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

          {/* ── Previous Attempts table ──────────────────────────── */}
          {prevAttempts.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="outfit-700 text-[17px] font-bold text-gray-900">
                  Previous Attempts
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[
                        "Attempt #",
                        "Score (Points)",
                        "Score (%)",
                        "Date",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-[12px] font-semibold tracking-wide text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {prevAttempts.map((a, i) => {
                      const p = pct(a.percentage);
                      const isInProgress = !a.submitted_at;
                      return (
                        <tr key={i} className="hover:bg-gray-50/60">
                          <td className="px-6 py-3.5 text-[14px] text-gray-800">
                            {a.attempt_number}
                          </td>
                          <td className="px-6 py-3.5 text-[14px] text-gray-800">
                            {a.score} / {a.total_score}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${scoreBadge(p)}`}
                            >
                              {p}%
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-[13px] whitespace-nowrap text-gray-500">
                            {isInProgress ? "—" : fmtDate(a.submitted_at)}
                          </td>
                          <td className="px-6 py-3.5">
                            {isInProgress ? (
                              <span className="text-[12px] font-semibold tracking-wide text-orange-500 uppercase">
                                In Progress
                              </span>
                            ) : a.isPassed ? (
                              <i className="bx bx-check-circle text-xl text-green-500" />
                            ) : (
                              <i className="bx bx-x-circle text-xl text-gray-300" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Footer actions ───────────────────────────────────── */}
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
              {/* Take New Quiz — outline, shown when there's an active attempt */}
              {activeAttempt && !isQuizModified && (
                <button
                  onClick={handleStartQuiz}
                  disabled={!canStartNew}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-orange-400 bg-white px-5 py-2.5 text-[14px] font-medium text-orange-500 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="bx bx-refresh text-base" />
                  Take New Quiz
                </button>
              )}

              {/* Primary CTA */}
              {activeAttempt ? (
                <button
                  onClick={handleContinueQuiz}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95"
                >
                  Continue Quiz
                  <i className="bx bx-arrow-right-stroke text-base" />
                </button>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  disabled={!availability?.isAvailable}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {usedAttempts > 0 ? "Retake Quiz" : "Start Quiz"}
                  <i className="bx bx-arrow-right-stroke text-base" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizInfo;
