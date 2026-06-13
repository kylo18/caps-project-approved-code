import React, { useState, useEffect } from "react";
import { clearAuth } from '../utils/authStorage';
import useToast from "../hooks/useToast";
import Toast from "./Toast";

const ImportQuestionModal = ({
  isOpen,
  onClose,
  onImport,
  personalQuizID,
  subjectID,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [activeTab, setActiveTab] = useState("qualifying"); // "qualifying" or "practice"
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen && subjectID) {
      fetchQuestions();
    }
  }, [isOpen, subjectID]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setAllQuestions([]);
    setSelectedQuestions([]);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsLoading(false);
        return;
      }

      if (!subjectID) {
        showToast("Subject ID is required to import questions.", "error");
        setIsLoading(false);
        return;
      }

      const numericSubjectID = Number(subjectID);
      if (isNaN(numericSubjectID) || numericSubjectID <= 0) {
        showToast("Invalid subject ID provided.", "error");
        setIsLoading(false);
        return;
      }

      const url = `${apiUrl}/faculty/my-questions/${numericSubjectID}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        clearAuth();
        setIsLoading(false);
        return;
      }

      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        showToast(
          errorData.message ||
            "Subject not found or you have no questions for this subject.",
          "error",
        );
        setIsLoading(false);
        return;
      }

      if (response.status === 403) {
        showToast(
          "You do not have permission to access this resource.",
          "error",
        );
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch questions. Status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        showToast(
          data.message || "Failed to fetch questions. Please try again.",
          "error",
        );
        setIsLoading(false);
        return;
      }

      const questions = data.data || [];
      setAllQuestions(questions);

      if (questions.length === 0) {
        showToast("No questions found for this subject.", "info");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        showToast(
          "Network error. Please check your connection and try again.",
          "error",
        );
      } else {
        showToast(
          error.message || "Failed to fetch questions. Please try again.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map((q) => q.questionID));
    }
  };

  const handleAddToQuiz = async () => {
    if (selectedQuestions.length === 0) {
      showToast("Please select at least one question to import.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiUrl}/personal-quiz-questions/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalQuizID,
          questionIDs: selectedQuestions,
          examType: activeTab === "qualifying" ? "qualifying" : "practice",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to import questions");
      }

      showToast(
        `Successfully imported ${selectedQuestions.length} question(s) to quiz!`,
        "success",
      );
      onImport(selectedQuestions);
      onClose();
    } catch (error) {
      console.error("Error importing questions:", error);
      showToast(
        error.message || "Failed to import questions. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter questions based on active tab (purpose_id) and search query
  const filteredQuestions = allQuestions.filter((question) => {
    const purposeId = question.purpose_id;
    const matchesTab =
      (activeTab === "qualifying" && purposeId === 1) ||
      (activeTab === "practice" && purposeId === 2);

    if (!matchesTab) return false;

    const questionText = question.questionText || "";
    return questionText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    selectedQuestions.length === filteredQuestions.length;

  if (!isOpen) return null;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="lightbox-bg outfit-400 bg-opacity-40 fixed inset-0 z-100 flex items-center justify-center bg-black">
        <div className="relative mx-2 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
          {/* Header — matches AssignToClassModal */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                <i className="bx bx-arrow-to-bottom-stroke text-2xl" />
              </div>
              <div>
                <h2 className="outfit-700 text-[16px] text-gray-900">
                  Import Questions
                </h2>
                <p className="text-xs text-gray-500">
                  Select questions to add to your quiz.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Close"
            >
              <i className="bx bx-x text-xl" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {["qualifying", "practice"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedQuestions([]);
                }}
                className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "qualifying" ? "Qualifying Exam" : "Practice Exam"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <i className="bx bx-search text-lg" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-800 placeholder-gray-400 ring-0 transition outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[45vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="loader" />
                <span className="ml-3 text-sm text-gray-600">
                  Loading questions...
                </span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                {searchQuery
                  ? "No questions match your search."
                  : `No ${activeTab === "qualifying" ? "qualifying exam" : "practice exam"} questions for this subject.`}
              </div>
            ) : (
              <>
                {/* List header */}
                <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  <span>
                    {filteredQuestions.length} question
                    {filteredQuestions.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-[11px] font-semibold tracking-wide text-orange-500 uppercase hover:text-orange-600"
                  >
                    {allFilteredSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Questions list */}
                <div className="space-y-2">
                  {filteredQuestions.map((question, index) => {
                    const isSelected = selectedQuestions.includes(
                      question.questionID,
                    );
                    return (
                      <div
                        key={question.questionID || index}
                        onClick={() =>
                          handleQuestionSelect(question.questionID)
                        }
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                          isSelected
                            ? "border-orange-500 bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleQuestionSelect(question.questionID)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="line-clamp-2 text-sm text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: question.questionText || "",
                            }}
                          />
                          {question.choices && (
                            <div className="mt-1.5 space-y-0.5">
                              {question.choices.map((choice, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs ${
                                    choice.isCorrect
                                      ? "font-semibold text-green-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {String.fromCharCode(65 + idx)}.{" "}
                                  {choice.choiceText || (
                                    <img
                                      src={choice.image}
                                      alt={`Choice ${idx + 1}`}
                                      className="max-h-16 rounded"
                                    />
                                  )}
                                  {choice.isCorrect && " ✓"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer — matches AssignToClassModal */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-xs text-gray-500">
              {selectedQuestions.length} question
              {selectedQuestions.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQuiz}
                disabled={isLoading || selectedQuestions.length === 0}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  isLoading || selectedQuestions.length === 0
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="loader-white" />
                    Importing...
                  </div>
                ) : (
                  `Import (${selectedQuestions.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportQuestionModal;
