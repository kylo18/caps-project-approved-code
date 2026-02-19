import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import QuestionListModal from "../components/QuestionListModal";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

const TimerCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredQuestions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-md bg-white p-6">
        <h2 className="mb-4 text-center text-[16px] font-semibold text-gray-800">
          Time's Up!
        </h2>
        <div className="mb-6 space-y-3">
          <p className="text-[14px] text-gray-600">
            Your quiz time has ended. Here's a summary of your quiz:
          </p>
          <div className="rounded-lg bg-gray-50 p-4 text-[14px]">
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{totalQuestions}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Questions Answered:</span>
                <span className="font-medium">{answeredQuestions}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Questions Unanswered:</span>
                <span className="font-medium">
                  {totalQuestions - answeredQuestions}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onConfirm}
            className="border-color flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] sm:px-6 sm:text-base"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentQuiz = () => {
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showTimerCompletionModal, setShowTimerCompletionModal] =
    useState(false);
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] =
    useState(false);
  const [isChoiceImageModalOpen, setIsChoiceImageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime] = useState(new Date().toISOString());
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const { classPersonalQuizID } = useParams();
  const { toast, showToast } = useToast();

  // Get navigation state
  const stateClassPersonalQuizID = location.state?.classPersonalQuizID;
  const quizID = classPersonalQuizID || stateClassPersonalQuizID;
  const classID = location.state?.classID;
  const quizInfo = location.state?.quizInfo;
  const resumeAttempt = location.state?.resumeAttempt;
  const attemptNumber = location.state?.attemptNumber;
  const isModified = location.state?.isModified;

  // Generate a unique key for this quiz attempt (will be set after quiz starts)
  const [quizKey, setQuizKey] = useState(null);
  const [showModifiedWarning, setShowModifiedWarning] = useState(false);

  // Start quiz on component mount
  useEffect(() => {
    const startQuiz = async () => {
      if (!quizID) {
        setError("Quiz ID is missing. Please select a quiz first.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Show warning if quiz was modified (set early so it shows immediately)
      if (isModified) {
        setShowModifiedWarning(true);
      }

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

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

          let errorMessage = "Failed to start quiz.";
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
          throw new Error(data.message || "Failed to start quiz");
        }

        // Generate quiz key based on quiz ID and attempt number
        const generatedQuizKey =
          resumeAttempt && attemptNumber
            ? `quiz_${quizID}_attempt_${attemptNumber}`
            : `quiz_${quizID}_attempt_${data.attemptNumber}`;
        setQuizKey(generatedQuizKey);

        // Load saved data if resuming
        if (resumeAttempt) {
          // Load stored questions (original state when quiz started)
          const savedQuestions = localStorage.getItem(
            `${generatedQuizKey}_questions`,
          );
          let questionsToUse = data.questions; // Fallback to API questions if stored ones don't exist

          if (savedQuestions) {
            try {
              questionsToUse = JSON.parse(savedQuestions);
            } catch (err) {
              console.error("Error loading saved questions:", err);
              // Use API questions as fallback
            }
          }

          // Set quiz data with stored questions
          const quizDataObj = {
            quiz: data.quiz,
            settings: data.settings,
            questions: questionsToUse, // Use stored questions, not API questions
            attemptNumber: attemptNumber || data.attemptNumber,
            startedAt: data.startedAt,
          };
          setQuizData(quizDataObj);

          // Load saved answers
          const savedAnswers = localStorage.getItem(generatedQuizKey);
          if (savedAnswers) {
            try {
              setAnswers(JSON.parse(savedAnswers));
            } catch (err) {
              console.error("Error loading saved answers:", err);
            }
          }

          // Load saved bookmarks
          const savedBookmarks = localStorage.getItem(
            `${generatedQuizKey}_bookmarks`,
          );
          if (savedBookmarks) {
            try {
              setBookmarkedQuestions(JSON.parse(savedBookmarks));
            } catch (err) {
              console.error("Error loading saved bookmarks:", err);
            }
          }

          // Load saved timer
          const savedTimer = localStorage.getItem(`${generatedQuizKey}_timer`);
          if (savedTimer && data.settings?.quizTimerEnabled) {
            const remainingTime = parseInt(savedTimer);
            if (remainingTime > 0) {
              setSecondsLeft(remainingTime);
            } else {
              // Timer expired, set to 0
              setSecondsLeft(0);
            }
          } else if (
            data.settings?.quizTimerEnabled &&
            data.settings?.quizTimer
          ) {
            // No saved timer but timer is enabled, initialize it
            const timerSeconds = data.settings.quizTimer * 60;
            setSecondsLeft(timerSeconds);
          }
        } else {
          // Starting new attempt - store original questions and version
          const quizDataObj = {
            quiz: data.quiz,
            settings: data.settings,
            questions: data.questions,
            attemptNumber: data.attemptNumber,
            startedAt: data.startedAt,
          };
          setQuizData(quizDataObj);

          // Store original questions to prevent modifications from affecting ongoing quiz
          localStorage.setItem(
            `${generatedQuizKey}_questions`,
            JSON.stringify(data.questions),
          );

          // Store quiz version/timestamp to detect modifications
          const quizVersion = {
            questionCount: data.questions.length,
            questionIds: data.questions
              .map((q) => q.personalQuizQuestionID)
              .sort()
              .join(","),
            settingsHash: data.settings
              ? JSON.stringify({
                  quizTimer: data.settings.quizTimer,
                  quizTimerEnabled: data.settings.quizTimerEnabled,
                  shuffleQuestions: data.settings.shuffleQuestions,
                  shuffleChoices: data.settings.shuffleChoices,
                })
              : "",
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(
            `${generatedQuizKey}_version`,
            JSON.stringify(quizVersion),
          );

          // Initialize timer if enabled
          if (data.settings?.quizTimerEnabled && data.settings?.quizTimer) {
            const timerSeconds = data.settings.quizTimer * 60;
            setSecondsLeft(timerSeconds);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to start quiz. Please try again.");
        console.error("Error starting quiz:", err);
        showToast(
          err.message || "Failed to start quiz. Please try again.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizID, apiUrl, resumeAttempt, attemptNumber]);

  // Timer effect
  useEffect(() => {
    if (!quizData?.settings?.quizTimerEnabled || secondsLeft === null) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerCompletionModal(true);
          return 0;
        }
        const newTime = prev - 1;
        // Save timer state to localStorage
        if (quizKey) {
          localStorage.setItem(`${quizKey}_timer`, newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizData?.settings?.quizTimerEnabled, secondsLeft, quizKey]);

  // Save answers whenever they change
  useEffect(() => {
    if (quizKey && Object.keys(answers).length > 0) {
      localStorage.setItem(quizKey, JSON.stringify(answers));
    }
  }, [answers, quizKey]);

  // Save bookmarks whenever they change
  useEffect(() => {
    if (quizKey && bookmarkedQuestions.length > 0) {
      localStorage.setItem(
        `${quizKey}_bookmarks`,
        JSON.stringify(bookmarkedQuestions),
      );
    } else if (quizKey) {
      localStorage.removeItem(`${quizKey}_bookmarks`);
    }
  }, [bookmarkedQuestions, quizKey]);

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear quiz data if we're navigating away from a completed quiz
      if (quizKey && secondsLeft === 0) {
        localStorage.removeItem(quizKey);
        localStorage.removeItem(`${quizKey}_bookmarks`);
        localStorage.removeItem(`${quizKey}_timer`);
        localStorage.removeItem(`${quizKey}_version`);
        localStorage.removeItem(`${quizKey}_questions`);
      }
    };
  }, [quizKey, secondsLeft]);

  // Add effect to reset image modal states when question changes
  useEffect(() => {
    setIsQuestionImageModalOpen(false);
    setIsChoiceImageModalOpen(false);
    setSelectedImageUrl(null);
  }, [currentQuestionIndex]);

  if (isLoading) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit mt-5 flex min-h-screen flex-col items-center justify-center py-5">
          <div className="text-center">
            <div className="loader mx-auto mb-2"></div>
            <p className="text-[14px] text-gray-600">Starting quiz...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !quizData) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit mt-5 flex min-h-screen flex-col items-center justify-center py-5">
          <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || "No quiz data found. Please select a quiz first."}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // Navigate back to StudentClasses page if classID is available
                  if (classID) {
                    navigate(`/class/${classID}/quizzes`, {
                      state: { classItem: location.state?.classItem },
                    });
                  } else {
                    navigate(-1);
                  }
                }}
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

  const totalQuestions = quizData.questions.length;

  const handleSelectAnswer = (questionID, choiceID) => {
    setAnswers((prev) => ({
      ...prev,
      [questionID]: choiceID,
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitAnswers = async () => {
    setIsSubmitting(true);
    try {
      // Create an array of all questions, marking unanswered ones as null
      const allAnswers = quizData.questions.map((question) => ({
        personalQuizQuestionID: question.personalQuizQuestionID,
        selectedChoiceID: answers[question.personalQuizQuestionID]
          ? parseInt(answers[question.personalQuizQuestionID])
          : null,
      }));

      // Calculate time taken in seconds
      const startTime = quizData.startedAt
        ? new Date(quizData.startedAt)
        : new Date(quizStartTime);
      const endTime = new Date();
      const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiUrl}/quizzes/${quizID}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          attempt_number: quizData.attemptNumber,
          answers: allAnswers,
          started_at: quizData.startedAt || quizStartTime,
          time_taken_seconds: timeTakenSeconds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit answers");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to submit quiz");
      }

      // Clear quiz-related data from localStorage after successful submission
      if (quizKey) {
        localStorage.removeItem(quizKey);
        localStorage.removeItem(`${quizKey}_bookmarks`);
        localStorage.removeItem(`${quizKey}_timer`);
        localStorage.removeItem(`${quizKey}_version`);
        localStorage.removeItem(`${quizKey}_questions`);
      }

      // Set secondsLeft to 0 to indicate quiz is completed
      setSecondsLeft(0);

      // Navigate to results page with the response data
      navigate(`/quiz-result/${quizID}`, {
        state: {
          result: result.result,
          questions: result.questions,
          quiz: result.quiz,
          classID,
          classPersonalQuizID: quizID,
        },
        replace: true,
      });

      setAnswers({});
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Failed to submit quiz. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAnswer = () => {
    const currentQuestionId =
      quizData.questions[currentQuestionIndex].personalQuizQuestionID;
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestionId];
      return newAnswers;
    });
  };

  const calculateProgress = () => {
    const answeredCount = quizData.questions.filter(
      (question) => answers[question.personalQuizQuestionID] !== undefined,
    ).length;
    return (answeredCount / quizData.questions.length) * 100;
  };

  const progressPercentage = calculateProgress();

  const areAllQuestionsAnswered = () => {
    return quizData.questions.every(
      (question) => answers[question.personalQuizQuestionID] !== undefined,
    );
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
    setIsQuestionListOpen(false);
  };

  const handleToggleBookmark = (questionId) => {
    setBookmarkedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleTimerCompletion = () => {
    setShowTimerCompletionModal(false);
    handleSubmitAnswers();
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="outfit mt-5 flex min-h-screen flex-col py-5">
        <TimerCompletionModal
          isOpen={showTimerCompletionModal}
          onClose={() => setShowTimerCompletionModal(false)}
          onConfirm={handleTimerCompletion}
          totalQuestions={quizData?.questions.length || 0}
          answeredQuestions={Object.keys(answers).length}
        />
        <div className="border-color mb-2 w-full rounded-md bg-white px-4 py-[18px] shadow-sm md:px-8">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            {/* Quiz Title & Progress */}
            <div className="flex w-full flex-col md:w-auto md:flex-row md:items-center md:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[16px] font-semibold break-words lg:max-w-[420px]">
                    {quizData.quiz.title || "Quiz"}
                  </p>
                </div>
                <p className="mt-1 text-[13px] text-gray-500">
                  {quizData.quiz.description || "Class Quiz"}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-1 flex-col justify-center md:mx-6 md:mt-2">
              <div className="h-[10px] w-full rounded-full bg-gray-200">
                <div
                  className="h-[10px] rounded-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="mt-1 text-end text-xs text-gray-500">
                {Math.round(progressPercentage)}% Answered
              </p>
            </div>

            {/* Buttons & Timer */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
              <div className="text-right">
                {quizData.settings?.quizTimerEnabled && secondsLeft !== null ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      {/* Hours */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-mono text-2xl font-bold ${
                            secondsLeft <= 300
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                        >
                          {Math.floor(secondsLeft / 3600)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                        <span className="text-xs text-gray-500">Hours</span>
                      </div>
                      <div className="flex h-[42px] items-center">
                        <span
                          className={`-mt-2 font-mono text-2xl font-bold ${
                            secondsLeft <= 300
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                        >
                          :
                        </span>
                      </div>
                      {/* Minutes */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-mono text-2xl font-bold ${
                            secondsLeft <= 300
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                        >
                          {Math.floor((secondsLeft % 3600) / 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                        <span className="text-xs text-gray-500">Minutes</span>
                      </div>
                      <div className="flex h-[42px] items-center">
                        <span
                          className={`-mt-2 font-mono text-2xl font-bold ${
                            secondsLeft <= 300
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                        >
                          :
                        </span>
                      </div>
                      {/* Seconds */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-mono text-2xl font-bold ${
                            secondsLeft <= 300
                              ? "text-red-500"
                              : "text-gray-800"
                          }`}
                        >
                          {(secondsLeft % 60).toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs text-gray-500">Seconds</span>
                      </div>
                    </div>

                    {secondsLeft <= 300 && (
                      <span className="mt-1 animate-pulse text-xs font-medium text-red-500">
                        Time is running out!
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
                    <i className="bx bx-time text-lg text-gray-600"></i>
                    <p className="font-medium text-gray-700">Unlimited Time</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="outfit border-color mx-auto mt-2 w-full max-w-3xl rounded-t-lg border-b-[0.5px] bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-nowrap text-gray-500">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </h3>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsQuestionListOpen(true)}
                className="mr-3 inline-flex cursor-pointer items-center gap-[6px] text-[14px] font-medium text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-list-ul text-[20px]"></i>
                See all Questions
              </button>

              <button
                onClick={() =>
                  handleToggleBookmark(
                    quizData.questions[currentQuestionIndex]
                      .personalQuizQuestionID,
                  )
                }
                className={`mr-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium transition ${
                  bookmarkedQuestions.includes(
                    quizData.questions[currentQuestionIndex]
                      .personalQuizQuestionID,
                  )
                    ? "text-yellow-400 hover:text-yellow-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i
                  className={`bx ${
                    bookmarkedQuestions.includes(
                      quizData.questions[currentQuestionIndex]
                        .personalQuizQuestionID,
                    )
                      ? "bxs-bookmark"
                      : "bx-bookmark"
                  } text-[18px]`}
                ></i>
                <span className="hidden sm:inline">
                  {bookmarkedQuestions.includes(
                    quizData.questions[currentQuestionIndex]
                      .personalQuizQuestionID,
                  )
                    ? "Bookmarked"
                    : "Bookmark"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl rounded-b-xl bg-white p-2 shadow-sm sm:p-4">
          <QuestionListModal
            isOpen={isQuestionListOpen}
            onClose={() => setIsQuestionListOpen(false)}
            questions={quizData.questions.map((q) => ({
              questionID: q.personalQuizQuestionID,
              questionText: q.questionText,
              image: q.image,
            }))}
            currentIndex={currentQuestionIndex}
            answers={answers}
            onQuestionClick={handleQuestionClick}
            bookmarkedQuestions={bookmarkedQuestions}
            onToggleBookmark={handleToggleBookmark}
          />

          {showModifiedWarning && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:mb-6">
              <div className="flex items-start gap-3">
                <i className="bx bx-error-circle text-xl text-amber-600"></i>
                <div>
                  <p className="font-semibold text-amber-900">Quiz Modified</p>
                  <p className="mt-1 text-amber-700">
                    This quiz has been modified since you started. You can
                    continue your current attempt, but you must finish it before
                    starting a new one.
                  </p>
                </div>
                <button
                  onClick={() => setShowModifiedWarning(false)}
                  className="ml-auto text-amber-600 hover:text-amber-800"
                >
                  <i className="bx bx-x text-xl"></i>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 sm:mb-6 sm:p-4 sm:text-base">
              {error}
            </div>
          )}

          {/* Question */}
          <div className="mb-6 px-2 sm:mb-10 sm:px-4">
            <div
              className="text-sm leading-relaxed text-gray-800 sm:text-[15px] md:text-base"
              dangerouslySetInnerHTML={{
                __html: quizData.questions[currentQuestionIndex].questionText,
              }}
            />
            {quizData.questions[currentQuestionIndex].image && (
              <div className="mt-3 flex sm:mt-4">
                <img
                  src={quizData.questions[currentQuestionIndex].image}
                  alt="Question"
                  className="w-full max-w-[200px] cursor-pointer rounded-lg object-contain shadow-md transition-opacity hover:opacity-80 sm:max-w-[200px] md:max-w-[300px]"
                  onClick={() => {
                    setSelectedImageUrl(
                      quizData.questions[currentQuestionIndex].image,
                    );
                    setIsQuestionImageModalOpen(true);
                  }}
                />
              </div>
            )}
          </div>

          {/* Options */}
          <form className="mt-2 mb-6 space-y-3 px-2 sm:mt-3 sm:mb-8 sm:space-y-4 sm:px-4">
            {quizData.questions[currentQuestionIndex].choices.map((choice) => {
              const isSelected =
                answers[
                  quizData.questions[currentQuestionIndex]
                    .personalQuizQuestionID
                ] === choice.personalQuizChoiceID;
              return (
                <label
                  key={choice.personalQuizChoiceID}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 shadow transition sm:px-4 sm:py-3 ${
                    isSelected
                      ? "border border-l-5 border-orange-500 bg-white font-semibold shadow-lg"
                      : "border-l-4 border-transparent bg-gray-100 hover:bg-gray-200"
                  } `}
                  style={{ minHeight: "48px", sm: { minHeight: "56px" } }}
                >
                  <span
                    className={`flex items-center gap-2 text-xs sm:gap-3 sm:text-[12px] md:text-sm ${isSelected ? "text-orange-500" : "text-gray-700"}`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: choice.choiceText,
                      }}
                    />
                    {choice.image && (
                      <img
                        src={choice.image}
                        alt="Choice"
                        className="inline-block h-auto max-h-[200px] w-auto max-w-[250px] cursor-pointer rounded-sm object-contain shadow-lg transition-opacity hover:opacity-80 sm:max-h-[300px] sm:max-w-[400px] md:max-h-[350px] md:max-w-[400px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageUrl(choice.image);
                          setIsChoiceImageModalOpen(true);
                        }}
                      />
                    )}
                  </span>
                  <input
                    type="radio"
                    name={`question-${quizData.questions[currentQuestionIndex].personalQuizQuestionID}`}
                    value={choice.personalQuizChoiceID}
                    checked={isSelected}
                    onChange={() =>
                      handleSelectAnswer(
                        quizData.questions[currentQuestionIndex]
                          .personalQuizQuestionID,
                        choice.personalQuizChoiceID,
                      )
                    }
                    className="form-radio mr-2 ml-2 h-4 w-4 text-orange-500 accent-orange-500 sm:mr-4 sm:ml-4 sm:h-5 sm:w-5"
                  />
                </label>
              );
            })}
          </form>

          {/* Image Modals */}
          {(isQuestionImageModalOpen || isChoiceImageModalOpen) && (
            <div
              className="lightbox-bg bg-opacity-70 fixed inset-0 z-100 flex h-screen items-center justify-center bg-black"
              onClick={() => {
                setIsQuestionImageModalOpen(false);
                setIsChoiceImageModalOpen(false);
              }}
            >
              <div className="relative max-h-full max-w-full">
                <img
                  src={selectedImageUrl}
                  alt="Full View"
                  className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
                />
              </div>
            </div>
          )}

          <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-2 sm:px-4">
            <div className="flex-1">
              {currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  className="border-color flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] sm:px-6 sm:text-base"
                >
                  <i className="bx bx-left-arrow-alt text-lg"></i>
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {answers[
                quizData.questions[currentQuestionIndex].personalQuizQuestionID
              ] && (
                <button
                  onClick={handleClearAnswer}
                  className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:px-6 sm:text-base"
                  type="button"
                >
                  Clear Answer
                </button>
              )}

              {currentQuestionIndex < quizData.questions.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="border-color flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] sm:px-6 sm:text-base"
                >
                  Next
                  <i className="bx bx-right-arrow-alt text-lg"></i>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            {areAllQuestionsAnswered() && (
              <button
                onClick={handleSubmitAnswers}
                className="mt-8 mb-1 w-[30%] cursor-pointer rounded-xl bg-gradient-to-r from-[#ed3700] to-[#FE6902] py-[9px] text-base font-semibold text-nowrap text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm"
                type="button"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <span className="loader-white"></span>
                  </div>
                ) : (
                  "Submit Quiz"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentQuiz;
