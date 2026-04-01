import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

// Displays the submitted practice exam summary and lets users review correct and incorrect items.
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
  } = location.state || {};
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'correct', 'incorrect'
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] =
    useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const safeScore = score || { earnedPoints: 0, totalPoints: 0, percentage: 0 };
  const safeResults = Array.isArray(results) ? results : [];
  const correctCount = safeResults.filter((q) => q.isCorrect).length;
  const incorrectCount = safeResults.filter((q) => !q.isCorrect).length;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black p-6">
        <h2 className="mb-4 text-3xl font-bold text-red-600">
          Submission Failed
        </h2>
        <p className="mb-6 text-black dark:text-white">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Formats stored timestamps for the summary card while tolerating missing values.
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredResults = safeResults.filter((q) => {
    if (activeTab === "all") return true;
    if (activeTab === "correct") return q.isCorrect;
    if (activeTab === "incorrect") return !q.isCorrect;
    return true;
  });

  return (
    <div className="open-sans min-h-screen bg-gray-50 p-1 text-gray-900 dark:bg-black dark:text-white sm:p-3">
      <div className="mx-auto mt-8 max-w-7xl">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-10">
          {/* Left Box - Score Details (30%) */}

          <div className="lg:col-span-3">
            <div className="rounded-md bg-white p-5 shadow-md dark:bg-[var(--color-bg-secondary)]">
              <h3 className="mb-4 text-[15px] font-semibold text-gray-800 dark:text-white">
                Practice Test Summary
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-[var(--color-bg-tertiary)]">
                  <div className="mb-4 text-center">
                    <span className="text-3xl font-bold text-orange-500">
                      {safeScore.earnedPoints}/{safeScore.totalPoints}
                    </span>
                    <p className="mt-1 text-[12px] text-gray-600 dark:text-gray-300">
                      Total Score
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-700 dark:text-white">
                      {safeScore.percentage}%
                    </span>
                    <p className="mt-1 text-[12px] text-gray-600 dark:text-gray-300">Percentage</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-gray-200 p-4 text-[12px] dark:border-white/10 dark:bg-[var(--color-bg-tertiary)]">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {subjectName || `Subject ${subjectID}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{examDuration || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Started:</span>
                    <span className="font-medium text-right text-gray-800 dark:text-white">{formatDate(startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Finished:</span>
                    <span className="font-medium text-right text-gray-800 dark:text-white">{formatDate(endTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigate("/student-dashboard")}
                className="font-inter flex items-center gap-2 rounded-xl px-8 py-3 text-[14px] text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-[var(--color-bg-secondary)]"
              >
                <i className="bx bx-chevron-left text-[18px]"></i>
                <span className="hover:underline">Back to Dashboard </span>
              </button>
            </div>
          </div>

          {/* Right Box - Questions List (70%) */}
          <div className="lg:col-span-7">
            <div className="rounded-md bg-white p-5 shadow-md dark:bg-[var(--color-bg-secondary)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-gray-800 dark:text-white">
                  Question Review
                </h3>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex space-x-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                    activeTab === "all"
                      ? "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[var(--color-bg-tertiary)] dark:hover:text-white"
                  }`}
                >
                  All Questions
                </button>
                <button
                  onClick={() => setActiveTab("correct")}
                  className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                    activeTab === "correct"
                      ? "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[var(--color-bg-tertiary)] dark:hover:text-white"
                  }`}
                >
                  Correct ({correctCount})
                </button>
                <button
                  onClick={() => setActiveTab("incorrect")}
                  className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                    activeTab === "incorrect"
                      ? "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[var(--color-bg-tertiary)] dark:hover:text-white"
                  }`}
                >
                  Incorrect ({incorrectCount})
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredResults.map((q, index) => (
                  <div
                    key={q.questionID}
                    className={`rounded-lg border px-4 py-2 ${
                      q.isCorrect
                        ? "border-green-200 bg-green-100 dark:border-green-900/40 dark:bg-green-900/20"
                        : "border-red-200 bg-red-100 dark:border-red-900/40 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Question Number */}
                          <span className="font-inter mt-1 flex shrink-0 items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {index + 1}.
                          </span>

                          {/* Question Content */}
                          <div className="min-w-0 flex-1">
                            {/* Question Text */}
                            <div
                              className="prose prose-sm max-w-none break-words text-[13px] text-gray-800 dark:prose-invert dark:text-white"
                              dangerouslySetInnerHTML={{
                                __html: q.questionText
                                  .replace(/\n/g, "<br>")
                                  .replace(
                                    /\*\*(.*?)\*\*/g,
                                    "<strong>$1</strong>",
                                  )
                                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                  .replace(/_(.*?)_/g, "<u>$1</u>"),
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

                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`flex items-center gap-1 text-[12px] font-medium ${
                                  q.isCorrect
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                <i
                                  className={`bx ${q.isCorrect ? "bx-check-circle" : "bx-x-circle"}`}
                                ></i>
                                {q.isCorrect ? "Correct" : "Incorrect"}
                              </span>
                              <span className="text-[12px] text-gray-500 dark:text-gray-400">
                                ({q.pointsPossible}{" "}
                                {q.pointsPossible === 1 ? "pt" : "pts"})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image Modal */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTestResult;
