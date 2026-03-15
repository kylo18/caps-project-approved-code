import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import WarningModal from "../components/WarningModal";

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
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'start', 'retake', or 'continue'
  const [startError, setStartError] = useState(null);

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
  const handleContinueQuiz = async () => {
    if (!activeAttempt) return;

    const startData = await doStartQuiz("continue");
    if (!startData) return; // error handled by modal

    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo,
        resumeAttempt: true,
        attemptNumber: activeAttempt.attemptNumber,
        isModified: isQuizModified,
        startData,
      },
    });
  };

  const doStartQuiz = async (actionType = "start") => {
    setLoadingAction(actionType);
    setStartError(null);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("You are not authenticated.");

      const response = await fetch(`${apiUrl}/quizzes/${quizID}/start`, {
        method: "POST",
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
        let msg = "Failed to start quiz.";
        try {
          const errData = await response.json();
          msg = errData?.message || errData?.error || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to start quiz");
      return data;
    } catch (err) {
      setStartError(
        err.message || "An unexpected error occurred while starting the quiz.",
      );
      return null;
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartQuiz = async () => {
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

    const startData = await doStartQuiz("start");
    if (!startData) return; // error handled by modal

    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo,
        startData,
      },
    });
  };

  /* open retake modal (for when there IS an active attempt) */
  const handleRetakeClick = () => {
    if (!quizInfo?.availability?.isAvailable) {
      showToast("This quiz is not available at this time.", "error");
      return;
    }
    setShowRetakeModal(true);
  };

  /* discard existing attempt data and start fresh */
  const handleForceRetake = async () => {
    if (activeAttempt?.key) {
      localStorage.removeItem(activeAttempt.key);
      localStorage.removeItem(`${activeAttempt.key}_version`);
      localStorage.removeItem(`${activeAttempt.key}_timer`);
    }

    const startData = await doStartQuiz("retake");
    if (!startData) return; // error handled by modal

    setShowRetakeModal(false);
    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo,
        startData,
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
          </div>
        </div>
      </>
    );
  }

  if (error || !quizInfo) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit-400 flex min-h-screen flex-col items-center justify-center bg-[#faf9f7] p-6 lg:p-8">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            {/* Header Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm ring-8 ring-red-50/50">
              <i className="bx bx-alert-circle text-4xl" />
            </div>

            {/* Error Content */}
            <h2 className="outfit-700 mb-2 text-2xl font-bold text-gray-900">
              Oops! Something went wrong
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-gray-500">
              {error ||
                "We couldn't find the quiz information you're looking for. It may have been removed or you might need to select it again."}
            </p>

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-[15px] font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] sm:flex-1"
              >
                <i className="bx bx-arrow-back text-lg" />
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] sm:flex-1"
              >
                <i className="bx bx-refresh text-lg" />
                Try Again
              </button>
            </div>
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

  // Derive max attempts from availability details, since backend exposes it there
  const attemptLimitDetail = availability?.details?.find(
    (d) => d.type === "attempt_limit" && d.value != null,
  );
  const maxAttempts =
    attemptLimitDetail && attemptLimitDetail.value !== 0
      ? attemptLimitDetail.value
      : "∞";
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

    bullets.push({
      icon: "bx-wifi",
      text: "Stable internet connection required for live sync",
    });
  }

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="outfit-400 mt-6 min-h-screen lg:mt-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* ── Header ──────────────────────────────────────────── */}
          <div className="mb-6">
            <h1 className="outfit-700 text-[28px] leading-tight font-bold break-words text-gray-900 sm:text-[32px]">
              {quizTitle}
            </h1>
            {coverageLabel && (
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-orange-500">
                <i className="bx bx-book-bookmark text-base" />
                <span>{coverageLabel}</span>
              </div>
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

          {/* ── Instructions panel ──────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
            <div className="mb-8 rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-3">
                <h2 className="outfit-700 text-[17px] font-bold text-gray-900">
                  Previous Attempts
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-50">
                    {prevAttempts.map((a, i) => {
                      const p = pct(a.percentage);
                      const isInProgress = !a.submitted_at;

                      const date = isInProgress
                        ? null
                        : new Date(a.submitted_at);

                      const shortDate = date?.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });

                      const time = date?.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <tr key={i} className="hover:bg-gray-50/60">
                          {/* Attempt */}
                          <td className="w-[55%] px-6 py-3.5 text-left text-[14px] text-gray-800 md:w-[70%]">
                            Attempt {a.attempt_number}
                          </td>

                          {/* Score */}
                          <td className="w-[35%] px-6 py-3.5 text-center text-[14px] text-gray-800 md:w-[20%]">
                            {/* Desktop */}
                            <span className="hidden sm:inline">
                              {Math.round(a.score)} /{" "}
                              {Math.round(a.total_score)} - {p}%
                            </span>

                            {/* Mobile */}
                            <div className="sm:hidden">
                              <div>
                                {Math.round(a.score)} /{" "}
                                {Math.round(a.total_score)}
                              </div>
                              <div className="text-[12px] text-gray-500">
                                {p}%
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="w-[10%] px-6 py-3.5 text-center text-[13px] whitespace-nowrap text-gray-500">
                            {isInProgress ? (
                              "—"
                            ) : (
                              <>
                                {/* Desktop */}
                                <span className="hidden sm:inline">
                                  {fmtDate(a.submitted_at)}
                                </span>

                                {/* Mobile */}
                                <div className="sm:hidden">
                                  <div>{shortDate}</div>
                                  <div className="text-[11px] text-gray-400">
                                    {time}
                                  </div>
                                </div>
                              </>
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

          {activeAttempt && (
            <div
              onClick={loadingAction === null ? handleContinueQuiz : undefined}
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
                    : isQuizModified
                      ? "This quiz has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                      : "You have an ongoing quiz attempt. Click here to continue where you left off."}

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

          {/* ── Availability warning ─────────────────────────────── */}
          {!availability?.isAvailable && availability?.message && (
            <div className="-mt-5 mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <i className="bx bx-error-circle mt-0.5 text-lg text-amber-500" />
              <p className="text-[13px] text-amber-700">
                {availability.message}
              </p>
            </div>
          )}

          {/* ── Footer actions ───────────────────────────────────── */}
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
              {/* Retake — shown when there's an active attempt and quiz is not modified */}
              {activeAttempt && !isQuizModified && (
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
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-play-icon lucide-play"
                  >
                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                  </svg>
                  Start quiz
                </button>
              )}

              {/* Start button — only shown when no active attempt */}
              {!activeAttempt && (
                <button
                  onClick={handleStartQuiz}
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
                        className="lucide lucide-play-icon lucide-play"
                      >
                        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                      </svg>
                      Start quiz
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── Retake warning modal ─────────────────────────────────── */}
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
        confirmLabel="Retake Quiz"
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
          handleContinueQuiz();
        }}
      />

      {/* ── Start Error warning modal ────────────────────────────── */}
      <WarningModal
        isOpen={!!startError}
        onClose={() => setStartError(null)}
        title="Failed to Start Quiz"
        subtitle="An error occurred while preparing your exam."
        description={<p>{startError}</p>}
        cancelLabel="Okay"
        cancelIcon={<i className="bx bx-check" />}
      />
    </>
  );
};

export default QuizInfo;
