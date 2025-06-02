import { useState } from "react";

// Displays the List of Questions in Practice Exam
const QuestionListModal = ({
  isOpen,
  onClose,
  questions,
  currentIndex,
  answers,
  onQuestionClick,
  bookmarkedQuestions,
  onToggleBookmark,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleShowAll = () => {
    const newShowAll = !showAll;
    setShowAll(newShowAll);
    const newExpandedState = {};
    questions.forEach((question) => {
      newExpandedState[question.questionID] = newShowAll;
    });
    setExpandedQuestions(newExpandedState);
  };

  const filteredQuestions =
    activeTab === "bookmarked"
      ? questions.filter((q) => bookmarkedQuestions.includes(q.questionID))
      : questions;

  if (!isOpen) return null;

  return (
    <>
      <div className="font-inter bg-opacity-50 lightbox-bg fixed inset-0 z-56 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-md bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    activeTab === "all"
                      ? "bg-orange-100 text-gray-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Questions
                </button>
                <button
                  onClick={() => setActiveTab("bookmarked")}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    activeTab === "bookmarked"
                      ? "bg-orange-100 text-gray-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Bookmarked
                  {bookmarkedQuestions.length > 0 && (
                    <span> ({bookmarkedQuestions.length})</span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "all" && (
                <button
                  onClick={toggleShowAll}
                  className="flex items-center justify-center gap-2 rounded-full px-3 py-1 text-[14px] text-gray-600"
                >
                  {showAll ? "Hide All" : "Show All"}
                  <i
                    className={`bx bx-chevron-down text-[18px] transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
                  ></i>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <i className="bx bx-x text-3xl"></i>
              </button>
            </div>
          </div>

          {activeTab === "bookmarked" && bookmarkedQuestions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="bx bx-bookmark mb-2 text-3xl"></i>
                <p className="text-[14px]">No bookmarked questions yet</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                {filteredQuestions.map((question, index) => {
                  const originalIndex = questions.findIndex(
                    (q) => q.questionID === question.questionID,
                  );
                  return (
                    <div
                      key={question.questionID}
                      className={`rounded-lg border ${
                        originalIndex === currentIndex
                          ? "border-color"
                          : "border-color"
                      } ${
                        answers[question.questionID] !== undefined
                          ? "border-color bg-green-100"
                          : "bg-white"
                      } ${
                        bookmarkedQuestions.includes(question.questionID)
                          ? "border-color"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <span
                            onClick={() => toggleQuestion(question.questionID)}
                            className="ml-2 text-[14px] text-gray-700"
                          >
                            Question {originalIndex + 1}
                          </span>
                          <button
                            onClick={() => toggleQuestion(question.questionID)}
                            className="flex justify-center text-[14px] text-gray-500 hover:text-gray-700"
                          >
                            <i
                              className={`bx bx-chevron-down text-[18px] transition-transform duration-200 ${
                                expandedQuestions[question.questionID]
                                  ? "rotate-180"
                                  : ""
                              }`}
                            ></i>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {answers[question.questionID] !== undefined && (
                            <span className="text-[14px] text-green-600">
                              Answered{" "}
                            </span>
                          )}
                          {activeTab === "all" && (
                            <button
                              onClick={() =>
                                onToggleBookmark(question.questionID)
                              }
                              className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full ${
                                bookmarkedQuestions.includes(
                                  question.questionID,
                                )
                                  ? "text-yellow-400 hover:text-yellow-600"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                              title={
                                bookmarkedQuestions.includes(
                                  question.questionID,
                                )
                                  ? "Remove Bookmark"
                                  : "Bookmark Question"
                              }
                            >
                              <i
                                className={`bx ${bookmarkedQuestions.includes(question.questionID) ? "bxs-bookmark" : "bx-bookmark"} cursor-pointer text-xl`}
                              ></i>
                            </button>
                          )}
                          <button
                            onClick={() => onQuestionClick(originalIndex)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 hover:bg-gray-200"
                          >
                            <i className="bx bx-right-arrow-alt text-xl"></i>
                          </button>
                        </div>
                      </div>

                      {expandedQuestions[question.questionID] && (
                        <div className="rounded-b-lg border-t border-gray-100 bg-gray-50 p-4">
                          <p className="mb-3 text-[14px] text-gray-800">
                            {question.questionText}
                          </p>
                          {question.questionImage && (
                            <div className="mt-2">
                              <img
                                src={question.questionImage}
                                alt="Question"
                                className="max-h-40 cursor-pointer rounded-lg object-contain hover:opacity-80"
                                onClick={() => {
                                  setSelectedImageUrl(question.questionImage);
                                  setIsImageModalOpen(true);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isImageModalOpen && selectedImageUrl && (
        <div
          className="lightbox-bg bg-opacity-70 fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative">
            <img
              src={selectedImageUrl}
              alt="Full View"
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionListModal;
