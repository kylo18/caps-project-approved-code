import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import QuestionListModal from "../components/QuestionListModal";
import DOMPurify from "dompurify";

const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "p", "br", "span"],
    ALLOWED_ATTR: ["class", "style"],
  });
};

const TimerCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredQuestions,
  bookmarkedQuestions,
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
            Your exam time has ended. Here's a summary of your exam:
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
        <div className="not-[]: flex justify-center space-x-3">
          <button
            onClick={onConfirm}
            className="border-color flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] sm:px-6 sm:text-base"
          >
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  );
};

const PracticeExam = ({ closeModal }) => {
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
  const [examStartTime] = useState(new Date().toISOString());
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectID,
    examData,
    savedAnswers,
    savedBookmarks,
    examKey: providedExamKey,
  } = location.state || {};

  // Add isPreview flag from examData
  const isPreview = examData?.isPreview || false;

  // Generate a unique key for this exam attempt
  const examKey =
    providedExamKey ||
    (examData
      ? `exam_${subjectID}_${examData.questions.map((q) => q.questionID).join("_")}`
      : null);

  // Load saved answers and timer when component mounts
  useEffect(() => {
    if (examKey) {
      // Load saved exam data first
      const savedExamData = localStorage.getItem(`${examKey}_exam_data`);
      if (savedExamData) {
        try {
          const parsedExamData = JSON.parse(savedExamData);
          // Update examData with the saved data
          Object.assign(examData, parsedExamData);
        } catch (err) {
          console.error("Error loading saved exam data:", err);
          localStorage.removeItem(`${examKey}_exam_data`);
        }
      }

      if (savedAnswers) {
        // If we're resuming an exam, use the provided saved answers
        setAnswers(savedAnswers);
      } else {
        // Otherwise try to load from localStorage
        const savedAnswers = localStorage.getItem(examKey);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch (err) {
            console.error("Error loading saved answers:", err);
            localStorage.removeItem(examKey); // Clear corrupted data
          }
        }
      }

      if (savedBookmarks) {
        // If we're resuming an exam, use the provided saved bookmarks
        setBookmarkedQuestions(savedBookmarks);
      } else {
        // Otherwise try to load from localStorage
        const savedBookmarks = localStorage.getItem(`${examKey}_bookmarks`);
        if (savedBookmarks) {
          try {
            setBookmarkedQuestions(JSON.parse(savedBookmarks));
          } catch (err) {
            console.error("Error loading saved bookmarks:", err);
            localStorage.removeItem(`${examKey}_bookmarks`);
          }
        }
      }

      // Load saved timer state and exam settings
      const savedExamSettings = localStorage.getItem(`${examKey}_settings`);
      const savedTimer = localStorage.getItem(`${examKey}_timer`);

      // If we have saved settings, use those instead of current examData settings
      if (savedExamSettings) {
        try {
          const parsedSettings = JSON.parse(savedExamSettings);
          // Only update timer-related settings if they exist in saved settings
          if (parsedSettings.enableTimer !== undefined) {
            examData.enableTimer = parsedSettings.enableTimer;
          }
          if (parsedSettings.durationMinutes !== undefined) {
            examData.durationMinutes = parsedSettings.durationMinutes;
          }
        } catch (err) {
          console.error("Error loading saved exam settings:", err);
        }
      } else {
        // If no saved settings exist, save the current settings
        localStorage.setItem(
          `${examKey}_settings`,
          JSON.stringify({
            enableTimer: examData.enableTimer,
            durationMinutes: examData.durationMinutes,
          }),
        );
      }

      // Set timer based on saved settings
      if (examData.enableTimer) {
        if (savedTimer) {
          const remainingTime = parseInt(savedTimer);
          if (remainingTime > 0) {
            setSecondsLeft(remainingTime);
          } else {
            setSecondsLeft(examData.durationMinutes * 60);
          }
        } else {
          setSecondsLeft(examData.durationMinutes * 60);
        }
      }
    }
  }, [examKey, savedAnswers, savedBookmarks, examData]);

  // Timer effect
  useEffect(() => {
    if (!examData?.enableTimer || secondsLeft === null) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerCompletionModal(true); // Show modal instead of auto-submitting
          return 0;
        }
        const newTime = prev - 1;
        // Save timer state to localStorage
        if (examKey) {
          localStorage.setItem(`${examKey}_timer`, newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examData?.enableTimer, secondsLeft, examKey]);

  // Save answers whenever they change
  useEffect(() => {
    if (examKey && Object.keys(answers).length > 0) {
      localStorage.setItem(examKey, JSON.stringify(answers));
    }
  }, [answers, examKey]);

  // Save bookmarks whenever they change
  useEffect(() => {
    if (examKey && bookmarkedQuestions.length > 0) {
      localStorage.setItem(
        `${examKey}_bookmarks`,
        JSON.stringify(bookmarkedQuestions),
      );
    } else if (examKey) {
      localStorage.removeItem(`${examKey}_bookmarks`);
    }
  }, [bookmarkedQuestions, examKey]);

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear exam data if we're navigating away from a completed exam
      if (examKey && secondsLeft === 0) {
        localStorage.removeItem(examKey);
        localStorage.removeItem(`${examKey}_bookmarks`);
        localStorage.removeItem(`${examKey}_timer`);
      }
    };
  }, [examKey, secondsLeft]);

  // Add effect to reset image modal states when question changes
  useEffect(() => {
    setIsQuestionImageModalOpen(false);
    setIsChoiceImageModalOpen(false);
    setSelectedImageUrl(null);
  }, [currentQuestionIndex]);

  if (!examData) {
    return <div>No exam data found. Please select a subject first.</div>;
  }

  const totalQuestions = examData ? examData.questions.length : 0;

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
    if (currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitAnswers = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        subjectID,
        answers: Object.entries(answers).map(
          ([questionID, selectedChoiceID]) => ({
            questionID: parseInt(questionID),
            selectedChoiceID: selectedChoiceID
              ? parseInt(selectedChoiceID)
              : null,
          }),
        ),
      };

      const response = await fetch(`${apiUrl}/practice-exam/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit answers");
      }

      // Clear ALL exam-related data from localStorage after successful submission
      const clearAllExamData = () => {
        const keys = Object.keys(localStorage);
        const examKeys = keys.filter((key) => key.startsWith("exam_"));
        examKeys.forEach((key) => {
          // Remove all exam-related keys
          const keysToRemove = [
            key,
            `${key}_bookmarks`,
            `${key}_timer`,
            `${key}_completed`,
            `${key}_last_question`,
            `${key}_last_position`,
            `${key}_settings`,
          ];
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        });
      };

      // Clear all exam data after successful submission
      clearAllExamData();

      const { score, results } = result;
      const examEndTime = new Date().toISOString();

      // Calculate exam duration
      const startTime = new Date(examStartTime);
      const endTime = new Date(examEndTime);
      const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
      const examDuration = `${durationMinutes} minutes`;

      // Set secondsLeft to 0 to indicate exam is completed
      setSecondsLeft(0);

      // Enhance results with full question data
      const enhancedResults = results.map((result) => {
        const questionData = examData.questions.find(
          (q) => q.questionID === result.questionID,
        );
        return {
          ...result,
          questionText: questionData.questionText,
          questionImage: questionData.questionImage,
          choices: questionData.choices,
        };
      });

      navigate("/practice-exam-result", {
        state: {
          score,
          results: enhancedResults,
          examCompleted: true,
          examDuration,
          startTime: examStartTime,
          endTime: examEndTime,
          subjectID,
          subjectName: examData.subjectName || `Subject ${subjectID}`,
        },
        replace: true,
      });

      setAnswers({});
    } catch (err) {
      console.error(err);
      navigate("/practice-exam-result", {
        state: {
          error: err.message,
        },
        replace: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAnswer = () => {
    const currentQuestionId =
      examData.questions[currentQuestionIndex].questionID;
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestionId];
      return newAnswers;
    });
  };

  const calculateProgress = () => {
    const answeredCount = examData.questions.filter(
      (question) => answers[question.questionID] !== undefined,
    ).length;
    return (answeredCount / examData.questions.length) * 100;
  };

  const progressPercentage = calculateProgress();

  const areAllQuestionsAnswered = () => {
    return examData.questions.every(
      (question) => answers[question.questionID] !== undefined,
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
    <div className="font-inter mt-5 flex min-h-screen flex-col py-5">
      <TimerCompletionModal
        isOpen={showTimerCompletionModal}
        onClose={() => setShowTimerCompletionModal(false)}
        onConfirm={handleTimerCompletion}
        totalQuestions={examData?.questions.length || 0}
        answeredQuestions={Object.keys(answers).length}
        bookmarkedQuestions={bookmarkedQuestions}
      />
      <div className="border-color mb-2 w-full rounded-md bg-white px-4 py-[18px] shadow-sm md:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          {/* Subject & Progress */}
          <div className="flex w-full flex-col md:w-auto md:flex-row md:items-center md:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-semibold break-words lg:max-w-[420px]">
                  {examData.subjectName || `Subject ${subjectID}`}
                </p>
                {isPreview && (
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-600">
                    Preview Mode
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-gray-500">
                {isPreview ? "Preview Practice Exam" : "Practice Exam"}
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
              {examData?.enableTimer ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-mono text-2xl font-bold ${
                          secondsLeft <= 300 ? "text-red-500" : "text-gray-800"
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
                          secondsLeft <= 300 ? "text-red-500" : "text-gray-800"
                        }`}
                      >
                        :
                      </span>
                    </div>
                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-mono text-2xl font-bold ${
                          secondsLeft <= 300 ? "text-red-500" : "text-gray-800"
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
                          secondsLeft <= 300 ? "text-red-500" : "text-gray-800"
                        }`}
                      >
                        :
                      </span>
                    </div>
                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-mono text-2xl font-bold ${
                          secondsLeft <= 300 ? "text-red-500" : "text-gray-800"
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

      <div className="open-sans border-color mx-auto mt-2 w-full max-w-3xl rounded-t-lg border-b-[0.5px] bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-gray-500">
            Question {currentQuestionIndex + 1} of {examData.questions.length}
          </h3>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2">
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
                  examData.questions[currentQuestionIndex].questionID,
                )
              }
              className={`mr-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium transition ${
                bookmarkedQuestions.includes(
                  examData.questions[currentQuestionIndex].questionID,
                )
                  ? "text-yellow-400 hover:text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i
                className={`bx ${
                  bookmarkedQuestions.includes(
                    examData.questions[currentQuestionIndex].questionID,
                  )
                    ? "bxs-bookmark"
                    : "bx-bookmark"
                } text-[18px]`}
              ></i>
              {bookmarkedQuestions.includes(
                examData.questions[currentQuestionIndex].questionID,
              )
                ? "Bookmarked"
                : "Bookmark"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl rounded-b-xl bg-white p-2 shadow-sm sm:p-4">
        <QuestionListModal
          isOpen={isQuestionListOpen}
          onClose={() => setIsQuestionListOpen(false)}
          questions={examData.questions}
          currentIndex={currentQuestionIndex}
          answers={answers}
          onQuestionClick={handleQuestionClick}
          bookmarkedQuestions={bookmarkedQuestions}
          onToggleBookmark={handleToggleBookmark}
        />

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
              __html: sanitizeHtml(
                examData.questions[currentQuestionIndex].questionText,
              ),
            }}
          />
          {examData.questions[currentQuestionIndex].questionImage && (
            <div className="mt-3 flex sm:mt-4">
              <img
                src={examData.questions[currentQuestionIndex].questionImage}
                alt="Question"
                className="w-full max-w-[200px] cursor-pointer rounded-lg object-contain shadow-md transition-opacity hover:opacity-80 sm:max-w-[200px] md:max-w-[300px]"
                onClick={() => {
                  setSelectedImageUrl(
                    examData.questions[currentQuestionIndex].questionImage,
                  );
                  setIsQuestionImageModalOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Options */}
        <form className="mt-2 mb-6 space-y-3 px-2 sm:mt-3 sm:mb-8 sm:space-y-4 sm:px-4">
          {examData.questions[currentQuestionIndex].choices.map((choice) => {
            const isSelected =
              answers[examData.questions[currentQuestionIndex].questionID] ===
              choice.choiceID;
            return (
              <label
                key={choice.choiceID}
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
                  {choice.choiceText}
                  {choice.choiceImage && (
                    <img
                      src={choice.choiceImage}
                      alt="Choice"
                      className="inline-block h-auto max-h-[200px] w-auto max-w-[250px] cursor-pointer rounded-sm object-contain shadow-lg transition-opacity hover:opacity-80 sm:max-h-[300px] sm:max-w-[400px] md:max-h-[350px] md:max-w-[400px]"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent label click
                        setSelectedImageUrl(choice.choiceImage);
                        setIsChoiceImageModalOpen(true);
                      }}
                    />
                  )}
                </span>
                <input
                  type="radio"
                  name={`question-${examData.questions[currentQuestionIndex].questionID}`}
                  value={choice.choiceID}
                  checked={isSelected}
                  onChange={() =>
                    handleSelectAnswer(
                      examData.questions[currentQuestionIndex].questionID,
                      choice.choiceID,
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
            {answers[examData.questions[currentQuestionIndex].questionID] && (
              <button
                onClick={handleClearAnswer}
                className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:px-6 sm:text-base"
                type="button"
              >
                Clear Answer
              </button>
            )}

            {currentQuestionIndex < examData.questions.length - 1 && (
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
              className={`mt-8 mb-1 w-[30%] cursor-pointer rounded-xl py-[9px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm ${
                isPreview
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-gradient-to-r from-[#ed3700] to-[#FE6902]"
              }`}
              type="button"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                </div>
              ) : isPreview ? (
                "View Results"
              ) : (
                "Submit Test"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeExam;
