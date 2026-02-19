import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SelectQuestionsModal = ({
  isOpen,
  onClose,
  personalQuizID,
  quizTitle: initialQuizTitle,
  quizInstruction: initialQuizInstruction,
  onError,
}) => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [questions, setQuestions] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // PDF generation options
  const [pdfOptions, setPdfOptions] = useState({
    title: initialQuizTitle || "",
    instructions: initialQuizInstruction || "",
    shuffle_questions: false,
    shuffle_choices: false,
    include_answer_key: false,
  });

  // Fetch questions from API when modal opens
  useEffect(() => {
    if (isOpen && personalQuizID) {
      fetchQuestions();
    }
  }, [isOpen, personalQuizID]);

  // Initialize with all questions selected when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      const allQuestionIds = questions.map(
        (q) => q.personalQuizQuestionID,
      );
      setSelectedQuestions(allQuestionIds);
    }
  }, [questions]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setIsGeneratingPDF(false);
    }
  }, [isOpen]);

  const fetchQuestions = async () => {
    if (!personalQuizID) return;

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/personal-quiz/${personalQuizID}/questions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        throw new Error("You are not authenticated. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch questions. Status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch questions.");
      }

      setQuestions(data.data.questions || []);
      setQuizInfo(data.data.quiz);
      
      // Set default title and instructions from quiz info
      if (data.data.quiz) {
        setPdfOptions((prev) => ({
          ...prev,
          title: prev.title || data.data.quiz.title || "",
          instructions: prev.instructions || data.data.quiz.instruction || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      if (onError) {
        onError(error.message || "Failed to fetch questions.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      const allIds = filteredQuestions.map(
        (q) => q.personalQuizQuestionID || q.questionID || q.id,
      );
      setSelectedQuestions(allIds);
    }
  };

  const handleToggleQuestion = (questionId) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleGeneratePDF = async () => {
    if (selectedQuestions.length === 0) {
      if (onError) {
        onError("Please select at least one question.");
      }
      return;
    }

    if (!pdfOptions.title.trim()) {
      if (onError) {
        onError("Please enter a title for the worksheet.");
      }
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/generate-personal-quiz-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            personalQuizID: personalQuizID,
            selectedQuestionIDs: selectedQuestions,
            title: pdfOptions.title.trim(),
            instructions: pdfOptions.instructions || null,
            shuffle_questions: pdfOptions.shuffle_questions,
            shuffle_choices: pdfOptions.shuffle_choices,
            include_answer_key: pdfOptions.include_answer_key,
          }),
        },
      );

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        throw new Error("You are not authenticated. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to generate PDF. Status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate PDF.");
      }

      // Navigate to PrintPersonalQuiz with the PDF data
      navigate("/print-personal-quiz", {
        state: {
          pdfData: data.data,
          fromAPI: true,
        },
      });
      
      // Close modal after successful generation
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (onError) {
        onError(error.message || "Failed to generate PDF.");
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filter questions based on search query
  const filteredQuestions = questions.filter((quizQuestion) => {
    const questionText = quizQuestion.questionText || "";
    return questionText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="outfit lightbox-bg fixed inset-0 z-105 flex items-center justify-center overflow-y-auto">
      <div className="scrollbar-hide animate-fade-in-up flex h-[100%] overflow-y-auto sm:h-[99%]">
        <div className="flex-1">
          {/* Header */}
          <div className="border-color relative mx-auto max-w-5xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-800 shadow-lg sm:rounded-t-md md:w-[110vh] lg:w-[135vh]">
            <div className="flex items-center justify-between pr-4">
              <span className="text-[14px] font-semibold">
                SELECT QUESTIONS FOR WORKSHEET
              </span>
              <button
                onClick={onClose}
                disabled={isGeneratingPDF}
                className="-mr-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 transition duration-100 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="border-color relative mx-auto mb-3 w-full max-w-5xl border border-t-0 bg-white p-5 shadow-lg sm:rounded-b-md sm:px-5 md:w-[110vh] lg:w-[135vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loader"></div>
                <span className="ml-3 text-sm text-gray-600">
                  Loading questions...
                </span>
              </div>
            ) : (
              <>
                {/* PDF Options */}
                <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    PDF Options
                  </h3>
                  
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Worksheet Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pdfOptions.title}
                      onChange={(e) =>
                        setPdfOptions((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      placeholder="Enter worksheet title"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Instructions
                    </label>
                    <textarea
                      value={pdfOptions.instructions}
                      onChange={(e) =>
                        setPdfOptions((prev) => ({
                          ...prev,
                          instructions: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      placeholder="Enter instructions (optional)"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={pdfOptions.shuffle_questions}
                        onChange={(e) =>
                          setPdfOptions((prev) => ({
                            ...prev,
                            shuffle_questions: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>Shuffle questions</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={pdfOptions.shuffle_choices}
                        onChange={(e) =>
                          setPdfOptions((prev) => ({
                            ...prev,
                            shuffle_choices: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>Shuffle choices</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={pdfOptions.include_answer_key}
                        onChange={(e) =>
                          setPdfOptions((prev) => ({
                            ...prev,
                            include_answer_key: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span>Include answer key</span>
                    </label>
                  </div>
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
                      filteredQuestions.length > 0 &&
                      filteredQuestions.every((q) => {
                        const id =
                          q.personalQuizQuestionID || q.questionID || q.id;
                        return selectedQuestions.includes(id);
                      })
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
              {filteredQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  {searchQuery
                    ? "No questions found matching your search."
                    : "No questions available."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((quizQuestion, index) => {
                    const questionId = quizQuestion.personalQuizQuestionID;
                    const isSelected = selectedQuestions.includes(questionId);

                    const questionText = quizQuestion.questionText || "";

                    // Get choices from API response
                    const choices = quizQuestion.choices || [];

                    return (
                      <div
                        key={questionId}
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
                            onChange={() => handleToggleQuestion(questionId)}
                            className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-gray-700">
                                {index + 1}.
                              </span>
                              <div
                                className="flex-1 text-sm text-gray-700"
                                dangerouslySetInnerHTML={{
                                  __html: questionText || "No question text",
                                }}
                              />
                            </div>
                            {choices.length > 0 && (
                              <div className="mt-2 ml-6 space-y-1">
                                {choices
                                  .slice(0, 2)
                                  .map((choice, choiceIndex) => {
                                    const choiceText = choice.choiceText || "";
                                    const isCorrect = choice.isCorrect || false;
                                    return (
                                      <div
                                        key={choiceIndex}
                                        className="text-xs text-gray-600"
                                      >
                                        {String.fromCharCode(65 + choiceIndex)}.{" "}
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: choiceText,
                                          }}
                                        />
                                        {isCorrect && (
                                          <span className="ml-1 text-orange-500">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                {choices.length > 2 && (
                                  <div className="text-xs text-gray-400">
                                    +{choices.length - 2} more choice
                                    {choices.length - 2 !== 1 ? "s" : ""}
                                  </div>
                                )}
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
                    disabled={isGeneratingPDF}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={
                      selectedQuestions.length === 0 ||
                      !pdfOptions.title.trim() ||
                      isGeneratingPDF
                    }
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <i className="bx bx-loader-alt mr-2 animate-spin"></i>
                        Generating...
                      </>
                    ) : (
                      `Generate PDF (${selectedQuestions.length})`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectQuestionsModal;
