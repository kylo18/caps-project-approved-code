import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

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

  // Get navigation state (fallback if classPersonalQuizID is not in URL)
  const stateClassPersonalQuizID = location.state?.classPersonalQuizID;
  const quizID = classPersonalQuizID || stateClassPersonalQuizID;
  const classID = location.state?.classID;
  const quiz = location.state?.quiz;

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

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const response = await fetch(
          `${apiUrl}/quizzes/${quizID}/info`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }

          let errorMessage = "Failed to load quiz information.";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData?.message || errorData?.error || errorMessage;
          } catch {
            // ignore parse error
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch quiz information");
        }

        setQuizInfo(data.quizInfo);

        // Check for active quiz attempts
        const keys = Object.keys(localStorage);
        const quizKeys = keys.filter(key => key.startsWith(`quiz_${quizID}_attempt_`));
        
        for (const key of quizKeys) {
          const versionKey = `${key}_version`;
          const savedVersion = localStorage.getItem(versionKey);
          const savedTimer = localStorage.getItem(`${key}_timer`);
          const savedAnswers = localStorage.getItem(key);
          
          if (savedVersion && (savedTimer || savedAnswers)) {
            try {
              const version = JSON.parse(savedVersion);
              const currentQuestionCount = data.quizInfo.statistics?.totalItems || 0;
              const currentSettings = data.quizInfo.settings || {};
              
              let storedSettings = {};
              if (version.settingsHash) {
                try {
                  storedSettings = JSON.parse(version.settingsHash);
                } catch (e) {
                  console.error("Error parsing stored settings:", e);
                }
              }
              
              const questionCountChanged = version.questionCount !== currentQuestionCount;
              const timerEnabledChanged = currentSettings.quizTimerEnabled !== undefined && 
                storedSettings.quizTimerEnabled !== currentSettings.quizTimerEnabled;
              const timerValueChanged = currentSettings.timeDuration?.minutes !== undefined && 
                storedSettings.quizTimer !== currentSettings.timeDuration.minutes;
              
              const modified = questionCountChanged || timerEnabledChanged || timerValueChanged;
              
              if (modified) {
                setIsQuizModified(true);
              }
              
              const attemptNumber = parseInt(key.split('_attempt_')[1]);
              const remainingTime = savedTimer ? parseInt(savedTimer) : null;
              
              setActiveAttempt({
                attemptNumber,
                remainingTime,
                hasAnswers: !!savedAnswers,
                key: key,
              });
              break; // Only handle the first active attempt
            } catch (err) {
              console.error("Error checking quiz version:", err);
            }
          }
        }
      } catch (err) {
        setError(
          err.message || "Failed to load quiz information. Please try again."
        );
        console.error("Error loading quiz information:", err);
        showToast(
          err.message || "Failed to load quiz information. Please try again.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizID, apiUrl]);

  const handleContinueQuiz = () => {
    if (!activeAttempt) return;

    // Navigate to continue the existing attempt
    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo: quizInfo,
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

    // If there's an active attempt and quiz was modified, prevent starting new
    if (activeAttempt && isQuizModified) {
      if (activeAttempt.remainingTime !== null && activeAttempt.remainingTime > 0) {
        showToast(
          "This quiz has been modified. Please finish your current attempt or wait for the timer to expire before starting a new one.",
          "error"
        );
        return;
      } else if (activeAttempt.hasAnswers) {
        showToast(
          "This quiz has been modified. Please finish your current attempt before starting a new one.",
          "error"
        );
        return;
      }
    }

    // If there's an active attempt but quiz wasn't modified, continue it instead
    if (activeAttempt && !isQuizModified) {
      handleContinueQuiz();
      return;
    }

    // No active attempt or all attempts completed/expired, start new quiz
    navigate(`/quiz/${quizID}`, {
      state: {
        classID,
        classPersonalQuizID: quizID,
        quiz: quiz || quizInfo.quiz,
        quizInfo: quizInfo,
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit mx-auto mt-10 max-w-lg p-2">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-[14px] text-gray-600">
                  Loading quiz information...
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !quizInfo) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit mx-auto mt-10 max-w-lg p-2">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6">
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "No quiz information found. Please select a quiz first."}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => navigate(-1)}
                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { quiz: quizData, statistics, settings, classAssignment, attempts, availability } = quizInfo;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="outfit mx-auto mt-10 max-w-lg p-2">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 space-y-4">
            {/* Availability Warning */}
            {!availability.isAvailable && availability.message && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {availability.message}
              </div>
            )}

            {/* Quiz Information */}
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 text-[14px] font-bold text-gray-700">
                Quiz Information
              </h3>
              <div className="space-y-2 text-[12px]">
                {quizData.subject && (
                  <p className="text-gray-600">
                    <span className="font-medium">Subject:</span>{" "}
                    {quizData.subject.subjectName} ({quizData.subject.subjectCode})
                  </p>
                )}
                {quizData.quizType && (
                  <p className="text-gray-600">
                    <span className="font-medium">Quiz Type:</span>{" "}
                    {quizData.quizType.name}
                  </p>
                )}
                {classAssignment.className && (
                  <p className="text-gray-600">
                    <span className="font-medium">Class:</span>{" "}
                    {classAssignment.className}
                  </p>
                )}
                <p className="text-gray-600">
                  <span className="font-medium">Total Items:</span>{" "}
                  {statistics.totalItems}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Total Points:</span>{" "}
                  {statistics.totalPoints}
                </p>
                {settings?.timeDuration ? (
                  <p className="text-gray-600">
                    <span className="font-medium">Duration:</span>{" "}
                    {settings.timeDuration.formatted}
                  </p>
                ) : (
                  <p className="text-gray-600">
                    <span className="font-medium">Duration:</span> No time limit
                  </p>
                )}
                {settings?.quizAttempts && (
                  <p className="text-gray-600">
                    <span className="font-medium">Max Attempts:</span>{" "}
                    {settings.quizAttempts}
                  </p>
                )}
                {attempts.attemptCount > 0 && (
                  <p className="text-gray-600">
                    <span className="font-medium">Attempts Used:</span>{" "}
                    {attempts.attemptCount} / {settings?.quizAttempts || "∞"}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            {(classAssignment.startDate || classAssignment.deadlineDate) && (
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 text-[14px] font-semibold text-gray-700">
                  Schedule
                </h3>
                <div className="space-y-2 text-[12px] text-gray-600">
                  {classAssignment.startDate && (
                    <p>
                      <span className="font-medium">Start Date:</span>{" "}
                      {new Date(classAssignment.startDate).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {classAssignment.deadlineDate && (
                    <p>
                      <span className="font-medium">Deadline:</span>{" "}
                      {new Date(classAssignment.deadlineDate).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Previous Attempts */}
            {attempts.previousAttempts.length > 0 && (
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 text-[14px] font-semibold text-gray-700">
                  Previous Attempts
                </h3>
                <div className="space-y-2 text-[12px]">
                  {attempts.previousAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border border-gray-200 bg-white p-2"
                    >
                      <div>
                        <span className="font-medium">Attempt {attempt.attempt_number}:</span>{" "}
                        {attempt.score}/{attempt.total_score} (
                        {typeof attempt.percentage === 'number' 
                          ? attempt.percentage.toFixed(1) 
                          : parseFloat(attempt.percentage || 0).toFixed(1)}%)
                        {attempt.isPassed && (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            Passed
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500">
                        {new Date(attempt.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 text-[14px] font-semibold text-gray-700">
                Instructions
              </h3>
              {quizData.instruction ? (
                <p className="mb-3 text-[12px] text-gray-600 whitespace-pre-wrap">
                  {quizData.instruction}
                </p>
              ) : (
                <ul className="list-inside list-disc space-y-2 text-[12px] text-gray-600">
                  <li>Make sure to answer all questions before submitting</li>
                  {settings?.quizTimerEnabled && settings?.timeDuration ? (
                    <li>
                      This quiz has a time limit. Make sure to complete it within
                      the given duration
                    </li>
                  ) : (
                    <li>
                      This quiz has no time limit. Take your time to complete it
                    </li>
                  )}
                  {settings?.autoSubmitOnTimeout && (
                    <li>
                      The quiz will be automatically submitted when the time limit is reached
                    </li>
                  )}
                  {settings?.shuffleQuestions && (
                    <li>Questions will be shuffled</li>
                  )}
                  {settings?.shuffleChoices && (
                    <li>Answer choices will be shuffled</li>
                  )}
                  {settings?.showCorrectAnswers && (
                    <li>Correct answers will be shown after submission</li>
                  )}
                  {settings?.showScoreAfterQuiz && (
                    <li>Your score will be displayed after submission</li>
                  )}
                </ul>
              )}
            </div>

            {/* Availability Details */}
            {availability.details && availability.details.length > 0 && (
              <div className="rounded-md bg-blue-50 p-4">
                <h3 className="mb-2 text-[14px] font-semibold text-blue-700">
                  Availability Details
                </h3>
                <ul className="list-inside list-disc space-y-1 text-[12px] text-blue-600">
                  {availability.details.map((detail, index) => (
                    <li key={index}>{detail.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Attempt Warning */}
            {activeAttempt && (
              <div className={`rounded-md p-4 ${
                isQuizModified 
                  ? "border border-amber-200 bg-amber-50" 
                  : "border border-blue-200 bg-blue-50"
              }`}>
                <h3 className={`mb-2 text-[14px] font-semibold ${
                  isQuizModified ? "text-amber-700" : "text-blue-700"
                }`}>
                  {isQuizModified ? "⚠️ Quiz Modified - Active Attempt" : "Active Attempt"}
                </h3>
                <div className="space-y-2 text-[12px]">
                  <p className={isQuizModified ? "text-amber-700" : "text-blue-700"}>
                    {isQuizModified 
                      ? "This quiz has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                      : "You have an ongoing quiz attempt. You can continue where you left off."}
                  </p>
                  {activeAttempt.remainingTime !== null && activeAttempt.remainingTime > 0 && (
                    <p className={isQuizModified ? "text-amber-600" : "text-blue-600"}>
                      <span className="font-medium">Time Remaining:</span>{" "}
                      {Math.floor(activeAttempt.remainingTime / 60)} minutes{" "}
                      {activeAttempt.remainingTime % 60} seconds
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 text-[14px]">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              Go Back
            </button>
            <div className="flex gap-2">
              {activeAttempt && (
                <button
                  onClick={handleContinueQuiz}
                  className="cursor-pointer rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Continue Quiz
                </button>
              )}
              <button
                onClick={handleStartQuiz}
                disabled={!availability.isAvailable || (activeAttempt && isQuizModified)}
                className={`cursor-pointer rounded-md px-6 py-2 text-white ${
                  availability.isAvailable && !(activeAttempt && isQuizModified)
                    ? "bg-orange-500 hover:bg-orange-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {activeAttempt && isQuizModified
                  ? "Cannot Start New"
                  : attempts.attemptCount > 0 && !attempts.previousAttempts.some(a => a.isPassed)
                  ? "Retake Quiz"
                  : attempts.attemptCount > 0
                  ? "Start New Attempt"
                  : "Start Quiz"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizInfo;
