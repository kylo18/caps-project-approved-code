import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const StudentQuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { classPersonalQuizID } = useParams();
  
  const {
    result,
    questions,
    quiz,
    error,
  } = location.state || {};

  const [activeTab, setActiveTab] = useState("all"); // 'all', 'correct', 'incorrect'
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] = useState(false);
  const [isChoiceImageModalOpen, setIsChoiceImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  // Determine what to show based on available data
  // showCorrectQuestion is enabled if isCorrect field exists in questions
  // showCorrectAnswers is enabled if correctChoice field exists in questions
  const showCorrectQuestion = questions && questions.length > 0 && 'isCorrect' in questions[0];
  const showCorrectAnswers = questions && questions.length > 0 && 'correctChoice' in questions[0];
  const showQuestions = showCorrectQuestion || showCorrectAnswers;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
        <h2 className="mb-4 text-3xl font-bold text-red-600">
          Submission Failed
        </h2>
        <p className="mb-6 text-black">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!result || !questions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
        <h2 className="mb-4 text-3xl font-bold text-gray-600">
          No Results Available
        </h2>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredResults = showCorrectQuestion
    ? questions.filter((q) => {
        if (activeTab === "all") return true;
        if (activeTab === "correct") return q.isCorrect;
        if (activeTab === "incorrect") return !q.isCorrect;
        return true;
      })
    : questions;

  // If both settings are off, just show submission confirmation
  if (!showQuestions) {
    return (
      <div className="outfit min-h-screen p-1 sm:p-3">
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="rounded-md bg-white p-8 shadow-md text-center">
            <div className="mb-6">
              <i className="bx bx-check-circle text-6xl text-green-500 mb-4"></i>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Quiz Submitted Successfully
              </h2>
              <p className="text-gray-600">
                Your quiz has been submitted and recorded.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 mb-6">
              <div className="mb-4">
                <span className="text-4xl font-bold text-orange-500">
                  {result.score}/{result.total_score}
                </span>
                <p className="mt-1 text-sm text-gray-600">Total Score</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-gray-700">
                  {result.percentage}%
                </span>
                <p className="mt-1 text-sm text-gray-600">Percentage</p>
              </div>
            </div>

            {result.time_taken_formatted && (
              <div className="mb-6 text-sm text-gray-600">
                <span className="font-medium">Time Taken:</span> {result.time_taken_formatted}
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              {quiz && (
                <div className="flex justify-between">
                  <span>Quiz:</span>
                  <span className="font-medium">{quiz.title || "N/A"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Submitted:</span>
                <span className="font-medium">{formatDate(result.submitted_at)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/student-dashboard")}
              className="outfit flex items-center gap-2 px-8 py-3 text-[14px] text-gray-700 rounded-lg bg-orange-500  hover:bg-orange-600 transition"
            >
              <i className="bx bx-chevron-left text-[18px]"></i>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="outfit min-h-screen p-1 sm:p-3">
      <div className="mx-auto mt-12 max-w-7xl">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-10">
          {/* Left Box - Score Details (30%) */}
          <div className="lg:col-span-3">
            <div className="rounded-md bg-white p-5 shadow-md">
              <h3 className="mb-4 text-[15px] font-semibold text-gray-800">
                Quiz Summary
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-4 text-center">
                    <span className="text-3xl font-bold text-orange-500">
                      {result.score}/{result.total_score}
                    </span>
                    <p className="mt-1 text-[12px] text-gray-600">
                      Total Score
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-700">
                      {result.percentage}%
                    </span>
                    <p className="mt-1 text-[12px] text-gray-600">Percentage</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg p-4 text-[12px]">
                  {quiz && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quiz:</span>
                      <span className="font-medium">{quiz.title || "N/A"}</span>
                    </div>
                  )}
                  {result.time_taken_formatted && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{result.time_taken_formatted}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">{formatDate(result.started_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Finished:</span>
                    <span className="font-medium">{formatDate(result.submitted_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigate("/student-dashboard")}
                className="outfit flex items-center gap-2 px-8 py-3 text-[14px] text-gray-700"
              >
                <i className="bx bx-chevron-left text-[18px]"></i>
                <span className="hover:underline">Back to Dashboard</span>
              </button>
            </div>
          </div>

          {/* Right Box - Questions List (70%) */}
          <div className="lg:col-span-7">
            <div className="rounded-md bg-white p-5 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-gray-800">
                  Question Review
                </h3>
              </div>

              {/* Tabs - Only show if showCorrectQuestion is enabled */}
              {showCorrectQuestion && (
                <div className="mb-6 flex space-x-2">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-[13px] font-medium ${
                      activeTab === "all"
                        ? "border-b-2 border-orange-500 text-orange-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    All Questions
                  </button>
                  <button
                    onClick={() => setActiveTab("correct")}
                    className={`px-4 py-2 text-[13px] font-medium ${
                      activeTab === "correct"
                        ? "border-b-2 border-orange-500 text-orange-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Correct ({questions.filter((q) => q.isCorrect).length})
                  </button>
                  <button
                    onClick={() => setActiveTab("incorrect")}
                    className={`px-4 py-2 text-[13px] font-medium ${
                      activeTab === "incorrect"
                        ? "border-b-2 border-orange-500 text-orange-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Incorrect ({questions.filter((q) => !q.isCorrect).length})
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {filteredResults.map((q, index) => (
                  <div
                    key={q.personalQuizQuestionID || index}
                    className={`rounded-lg px-4 py-2 ${
                      showCorrectQuestion && q.isCorrect
                        ? "bg-green-100"
                        : showCorrectQuestion && !q.isCorrect
                        ? "bg-red-100"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Question Number */}
                          <span className="outfit mt-1 flex shrink-0 items-center justify-center text-sm font-semibold text-gray-600">
                            {index + 1}.
                          </span>

                          {/* Question Content */}
                          <div className="min-w-0 flex-1">
                            {/* Question Text */}
                            <div
                              className="prose prose-sm max-w-none text-[13px] break-words text-gray-800"
                              dangerouslySetInnerHTML={{
                                __html: q.questionText
                                  ? q.questionText
                                      .replace(/\n/g, "<br>")
                                      .replace(
                                        /\*\*(.*?)\*\*/g,
                                        "<strong>$1</strong>",
                                      )
                                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                      .replace(/_(.*?)_/g, "<u>$1</u>")
                                  : "",
                              }}
                            />

                            {/* Question Image if exists */}
                            {q.questionImage && (
                              <div className="mt-2">
                                <img
                                  src={q.questionImage}
                                  alt="Question"
                                  className="max-h-[200px] w-auto cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-80"
                                  onClick={() => {
                                    setSelectedImageUrl(q.questionImage);
                                    setIsQuestionImageModalOpen(true);
                                  }}
                                />
                              </div>
                            )}

                            {/* Selected Choice */}
                            {q.selectedChoice && (
                              <div className="mt-3">
                                <p className="text-[12px] font-medium text-gray-600 mb-1">
                                  Your Answer:
                                </p>
                                <div className="flex items-center gap-2">
                                  {q.selectedChoice.image && (
                                    <img
                                      src={q.selectedChoice.image}
                                      alt="Selected Choice"
                                      className="max-h-[100px] w-auto cursor-pointer rounded object-contain transition-opacity hover:opacity-80"
                                      onClick={() => {
                                        setSelectedImageUrl(q.selectedChoice.image);
                                        setIsChoiceImageModalOpen(true);
                                      }}
                                    />
                                  )}
                                  {q.selectedChoice.choiceText && (
                                    <span
                                      className="text-[13px] text-gray-800"
                                      dangerouslySetInnerHTML={{
                                        __html: q.selectedChoice.choiceText,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Correct Choice - Only show if showCorrectAnswers is enabled */}
                            {showCorrectAnswers && q.correctChoice && (
                              <div className="mt-3">
                                <p className="text-[12px] font-medium text-green-600 mb-1">
                                  Correct Answer:
                                </p>
                                <div className="flex items-center gap-2">
                                  {q.correctChoice.image && (
                                    <img
                                      src={q.correctChoice.image}
                                      alt="Correct Choice"
                                      className="max-h-[100px] w-auto cursor-pointer rounded object-contain transition-opacity hover:opacity-80"
                                      onClick={() => {
                                        setSelectedImageUrl(q.correctChoice.image);
                                        setIsChoiceImageModalOpen(true);
                                      }}
                                    />
                                  )}
                                  {q.correctChoice.choiceText && (
                                    <span
                                      className="text-[13px] text-gray-800"
                                      dangerouslySetInnerHTML={{
                                        __html: q.correctChoice.choiceText,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="mt-2 flex items-center gap-2">
                              {showCorrectQuestion && (
                                <span
                                  className={`flex items-center gap-1 text-[12px] font-medium ${
                                    q.isCorrect
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  <i
                                    className={`bx ${q.isCorrect ? "bx-check-circle" : "bx-x-circle"}`}
                                  ></i>
                                  {q.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              )}
                              <span className="text-[12px] text-gray-500">
                                ({q.score}{" "}
                                {q.score === 1 ? "pt" : "pts"})
                              </span>
                              {q.earnedScore !== undefined && (
                                <span className="text-[12px] text-gray-500">
                                  • Earned: {q.earnedScore} {q.earnedScore === 1 ? "pt" : "pts"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Question Image Modal */}
              {isQuestionImageModalOpen && selectedImageUrl && (
                <div
                  className="lightbox-bg bg-opacity-70 fixed inset-0 z-55 flex items-center justify-center bg-black"
                  onClick={() => {
                    setIsQuestionImageModalOpen(false);
                    setSelectedImageUrl(null);
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

              {/* Choice Image Modal */}
              {isChoiceImageModalOpen && selectedImageUrl && (
                <div
                  className="lightbox-bg bg-opacity-70 fixed inset-0 z-55 flex items-center justify-center bg-black"
                  onClick={() => {
                    setIsChoiceImageModalOpen(false);
                    setSelectedImageUrl(null);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizResults;
