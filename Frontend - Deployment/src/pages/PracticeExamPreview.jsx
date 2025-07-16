import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionListModal from "../components/QuestionListModal";

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
            View Results
          </button>
        </div>
      </div>
    </div>
  );
};

const PracticeExamPreview = () => {
  const { subjectID } = useParams();
  const [examData, setExamData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/practice-exam/preview/${subjectID}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Server returned non-JSON response (status ${res.status}):\n` +
              text.slice(0, 300),
          );
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(
            data.message || `Failed to load preview (status ${res.status})`,
          );
        }
        return res.json();
      })
      .then((data) => {
        setExamData({
          ...data,
          isPreview: true,
          enableTimer: !!data.durationMinutes,
          durationMinutes: data.durationMinutes,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [subjectID]);

  useEffect(() => {
    if (examData?.enableTimer) {
      setSecondsLeft(examData.durationMinutes * 60);
    }
  }, [examData]);

  useEffect(() => {
    if (!examData?.enableTimer || secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerCompletionModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examData?.enableTimer, secondsLeft]);

  useEffect(() => {
    setIsQuestionImageModalOpen(false);
    setIsChoiceImageModalOpen(false);
    setSelectedImageUrl(null);
  }, [currentQuestionIndex]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error)
    return (
      <div className="p-8 text-center whitespace-pre-wrap text-red-500">
        {error}
      </div>
    );
  if (!examData)
    return <div className="p-8 text-center">No preview data found.</div>;

  const totalQuestions = examData.questions.length;

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
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleTimerCompletion = () => {
    setShowTimerCompletionModal(false);
    // Just show results locally
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
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-600">
                  Preview Mode
                </span>
              </div>
              <p className="mt-1 text-[13px] text-gray-500">
                Preview Practice Exam
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
          <h3 className="text-[14px] font-medium text-nowrap text-gray-500">
            Question {currentQuestionIndex + 1} of {examData.questions.length}
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
                  examData.questions[currentQuestionIndex].questionID,
                )
              }
              className={`mr-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium transition ${
                bookmarkedQuestions.includes(
                  examData.questions[currentQuestionIndex].questionID,
                )
                  ? "text-yellow-400 hover:text-yellow-500"
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
              <span className="hidden sm:inline">
                {bookmarkedQuestions.includes(
                  examData.questions[currentQuestionIndex].questionID,
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
              __html: examData.questions[currentQuestionIndex].questionText,
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
                  <span
                    dangerouslySetInnerHTML={{
                      __html: choice.choiceText,
                    }}
                  />
                  {choice.choiceImage && (
                    <img
                      src={choice.choiceImage}
                      alt="Choice"
                      className="inline-block h-auto max-h-[200px] w-auto max-w-[250px] cursor-pointer rounded-sm object-contain shadow-lg transition-opacity hover:opacity-80 sm:max-h-[300px] sm:max-w-[400px] md:max-h-[350px] md:max-w-[400px]"
                      onClick={(e) => {
                        e.stopPropagation();
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
              onClick={() => setShowTimerCompletionModal(true)}
              className={`mt-8 mb-1 w-[30%] cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-[9px] text-base font-semibold text-nowrap text-white shadow-md transition-all duration-200 ease-in-out hover:brightness-150 active:scale-[0.98] active:shadow-sm`}
              type="button"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeExamPreview;
