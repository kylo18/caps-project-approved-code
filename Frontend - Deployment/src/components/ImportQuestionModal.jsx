import React, { useState, useEffect } from "react";
import useToast from "../hooks/useToast";
import Toast from "./Toast";
import { getApiBaseUrl } from "../utils/config";

const ImportQuestionModal = ({
  isOpen,
  onClose,
  onImport,
  personalQuizID,
  subjectID,
}) => {
  const apiUrl = getApiBaseUrl();
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
      const token = localStorage.getItem("token");

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

      // Ensure subjectID is a number
      const numericSubjectID = Number(subjectID);
      if (isNaN(numericSubjectID) || numericSubjectID <= 0) {
        showToast("Invalid subject ID provided.", "error");
        setIsLoading(false);
        return;
      }

      const url = `${apiUrl}/faculty/my-questions/${numericSubjectID}`;

      console.log("Fetching questions from:", url); // Debug log

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle different response statuses
      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        // Optionally clear token and redirect
        localStorage.removeItem("token");
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

      // Check if the response indicates success
      if (!data.success) {
        showToast(
          data.message || "Failed to fetch questions. Please try again.",
          "error",
        );
        setIsLoading(false);
        return;
      }

      // The controller returns 'data' field, not 'questions'
      const questions = data.data || [];
      setAllQuestions(questions);

      if (questions.length === 0) {
        showToast("No questions found for this subject.", "info");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);

      // Provide more specific error messages
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
      // TODO: Replace this API endpoint with the actual import endpoint provided by the user
      const token = localStorage.getItem("token");
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
  // purpose_id: 1 = Qualifying Exam, 2 = Practice Exam
  const filteredQuestions = allQuestions.filter((question) => {
    // Filter by exam type (purpose_id)
    const purposeId = question.purpose_id;
    const isQualifying = purposeId === 1;
    const isPractice = purposeId === 2;

    const matchesTab =
      (activeTab === "qualifying" && isQualifying) ||
      (activeTab === "practice" && isPractice);

    if (!matchesTab) return false;

    // Filter by search query
    const questionText = question.questionText || "";
    return questionText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="outfit lightbox-bg fixed inset-0 z-105 flex items-center justify-center overflow-y-auto">
        <div className="scrollbar-hide animate-fade-in-up flex h-[100%] overflow-y-auto sm:h-[99%]">
          <div className="flex-1">
            {/* Header */}
            <div className="border-color relative mx-auto max-w-5xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-800 shadow-lg sm:rounded-t-md md:w-[110vh] lg:w-[135vh]">
              <div className="flex items-center justify-between pr-4">
                <span className="text-[14px] font-semibold">
                  IMPORT QUESTIONS
                </span>
                <button
                  onClick={onClose}
                  className="-mr-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 transition duration-100 hover:bg-gray-100 hover:text-gray-700"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="border-color relative mx-auto mb-3 w-full max-w-5xl border border-t-0 bg-white p-5 shadow-lg sm:rounded-b-md sm:px-5 md:w-[110vh] lg:w-[135vh]">
              {/* Tab Selection */}
              <div className="mb-4 flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("qualifying")}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "qualifying"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Qualifying Exam
                </button>
                <button
                  onClick={() => setActiveTab("practice")}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "practice"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Practice Exam
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Select All */}
              {filteredQuestions.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedQuestions.length === filteredQuestions.length &&
                        filteredQuestions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>
                      Select All ({filteredQuestions.length} question
                      {filteredQuestions.length !== 1 ? "s" : ""})
                    </span>
                  </label>
                  <span className="text-sm text-gray-600">
                    {selectedQuestions.length} selected
                  </span>
                </div>
              )}

              {/* Questions List */}
              <div className="max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="loader"></div>
                    <span className="ml-3 text-sm text-gray-600">
                      Loading questions...
                    </span>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    {searchQuery
                      ? "No questions found matching your search."
                      : `No ${activeTab === "qualifying" ? "qualifying exam" : "practice exam"} questions available.`}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((question, index) => {
                      const isSelected = selectedQuestions.includes(
                        question.questionID,
                      );
                      return (
                        <div
                          key={question.questionID || index}
                          className={`rounded-lg border p-4 transition-all ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleQuestionSelect(question.questionID)
                              }
                              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <div className="flex-1">
                              <div
                                className="text-sm text-gray-900"
                                dangerouslySetInnerHTML={{
                                  __html: question.questionText || "",
                                }}
                              />
                              {question.image && (
                                <img
                                  src={question.image}
                                  alt="Question"
                                  className="mt-2 max-h-32 rounded object-contain"
                                />
                              )}
                              {question.choices && (
                                <div className="mt-2 space-y-1">
                                  {question.choices.map((choice, idx) => (
                                    <div
                                      key={idx}
                                      className={`text-xs ${
                                        choice.isCorrect
                                          ? "font-semibold text-green-600"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}.{" "}
                                      {choice.choiceText || (
                                        <img
                                          src={choice.image}
                                          alt={`Choice ${idx + 1}`}
                                          className="max-h-20 rounded"
                                        />
                                      )}
                                      {choice.isCorrect && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToQuiz}
                  disabled={isLoading || selectedQuestions.length === 0}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition ${
                    isLoading || selectedQuestions.length === 0
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="loader-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bx bx-plus text-lg"></i>
                      <span>Add to Quiz ({selectedQuestions.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <div className="fixed top-4 right-4 z-[99999]">
        <Toast message={toast.message} type={toast.type} show={toast.show} />
      </div>
    </>
  );
};

export default ImportQuestionModal;
