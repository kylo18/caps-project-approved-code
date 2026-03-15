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
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // PDF generation options
  const [pdfOptions, setPdfOptions] = useState({
    title: initialQuizTitle || "",
    instructions: initialQuizInstruction || "",
  });

  // Helper to construct image URLs (matches QuizContent / personal quiz forms)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    let cleanPath = imagePath;
    if (imagePath.startsWith("/storage/")) {
      cleanPath = imagePath.substring("/storage/".length);
    } else if (imagePath.startsWith("storage/")) {
      cleanPath = imagePath.substring("storage/".length);
    }

    if (!cleanPath) return null;

    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Fetch questions from API when modal opens
  useEffect(() => {
    if (isOpen && personalQuizID) {
      fetchQuestions();
    }
  }, [isOpen, personalQuizID]);

  // Initialize with all questions selected when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      const allQuestionIds = questions.map((q) => q.personalQuizQuestionID);
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

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
          errorData.message ||
            `Failed to fetch questions. Status: ${response.status}`,
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

      const response = await fetch(`${apiUrl}/generate-personal-quiz-pdf`, {
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
          shuffle_questions: false,
          shuffle_choices: false,
          include_answer_key: true,
        }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        throw new Error("You are not authenticated. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to generate PDF. Status: ${response.status}`,
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

  const selectedQuestionObjects = questions.filter((q) => {
    const id = q.personalQuizQuestionID || q.questionID || q.id;
    return selectedQuestions.includes(id);
  });

  const totalPoints = selectedQuestionObjects.reduce((sum, q) => {
    const points = q.points || q.pointValue || q.score || 1;
    return sum + Number(points || 0);
  }, 0);

  const estimatedMinutes = selectedQuestionObjects.reduce((sum, q) => {
    const minutes = q.estimatedMinutes || q.estimatedTime || 2;
    return sum + Number(minutes || 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="outfit-400 fixed inset-0 z-105 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 sm:px-6">
        {/* X button — always on the left */}
        <button
          onClick={onClose}
          disabled={isGeneratingPDF}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="bx bx-arrow-left-stroke text-2xl"></i>
        </button>

        {/* Title */}
        <h1 className="outfit-500 flex-1 text-[16px] text-gray-900">
          Export Worksheet
        </h1>

        {/* Generate button — mobile only, shown in header */}
        <button
          onClick={handleGeneratePDF}
          disabled={
            selectedQuestions.length === 0 ||
            !pdfOptions.title.trim() ||
            isGeneratingPDF
          }
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 lg:hidden"
        >
          {isGeneratingPDF ? (
            <i className="bx bx-loader-alt animate-spin text-base"></i>
          ) : (
            <i className="bx bx-file text-base"></i>
          )}
          <span>
            {isGeneratingPDF
              ? "Generating..."
              : `Generate (${selectedQuestions.length})`}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:overflow-hidden">
        <div className="mx-auto flex max-w-6xl items-start gap-6 lg:h-full lg:flex-row">
          {/* Left column: options + questions */}
          <div className="scrollbar-hide min-w-0 flex-1 space-y-4 lg:h-full lg:overflow-y-auto lg:pb-6">
            {/* PDF Options */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <i className="bx bx-arrow-to-bottom-stroke text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      PDF Options
                    </h3>
                    <p className="text-[12px] text-gray-500">
                      Configure how your worksheet will look when exported.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g. Midterm Physics Quiz"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Enter instructions for students..."
                    rows={2}
                  />
                </div>


              </div>
            </div>

            {/* Search Bar */}
            <div className="rounded-full bg-transparent">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <i className="bx bx-search text-lg"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search questions"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-full border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 placeholder-gray-400 transition outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Select All */}
            {filteredQuestions.length > 0 && (
              <div className="mt-2 mb-2 ml-2 flex items-center justify-between text-xs text-gray-600">
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
                <span className="text-[12px] text-gray-600">
                  {selectedQuestions.length} selected
                </span>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12">
                  <div className="loader"></div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
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
                    const choices = quizQuestion.choices || [];

                    const questionImagePath =
                      quizQuestion.imagePath ||
                      quizQuestion.image ||
                      quizQuestion.personalQuizImage;
                    const questionImageSrc = quizQuestion.questionImageUrl || getImageUrl(questionImagePath);

                    return (
                      <div
                        key={questionId}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-2 border-orange-500"
                            : "border-gray-200 bg-white hover:border-orange-200"
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
                            <div className="mb-1 flex items-center justify-between">
                              <span className="mt-[1px] text-xs font-semibold tracking-wide text-orange-500 uppercase">
                                Question {index + 1}
                              </span>
                              {quizQuestion.points && (
                                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                                  {quizQuestion.points} Point
                                  {quizQuestion.points !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            <div
                              className="mt-1 text-sm text-gray-900"
                              dangerouslySetInnerHTML={{
                                __html: questionText || "No question text",
                              }}
                            />
                            {questionImageSrc && (
                              <div className="mt-3 flex justify-center">
                                <img
                                  src={questionImageSrc}
                                  alt={`Question ${index + 1}`}
                                  onClick={() => setLightboxSrc(questionImageSrc)}
                                  className="max-h-48 w-full max-w-md cursor-zoom-in rounded-lg object-contain transition hover:opacity-90"
                                />
                              </div>
                            )}
                            {choices.length > 0 && (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {choices
                                  .slice(0, 5)
                                  .map((choice, choiceIndex) => {
                                    const choiceText = choice.choiceText || "";
                                    const isCorrect = choice.isCorrect || false;
                                    const letter = String.fromCharCode(
                                      65 + choiceIndex,
                                    );
                                    const choiceImagePath =
                                      choice.imagePath ||
                                      choice.image ||
                                      choice.personalQuizImage ||
                                      choice.personalQuizChoiceImage;
                                    const choiceImageSrc =
                                      choice.choiceImageUrl || getImageUrl(choiceImagePath);
                                    return (
                                      <div
                                        key={choiceIndex}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                                          isCorrect
                                            ? "border-orange-500 bg-orange-50 text-gray-900"
                                            : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                      >
                                        <span
                                          className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-semibold ${
                                            isCorrect
                                              ? "border-orange-500 bg-orange-500 text-white"
                                              : "border-gray-300 bg-gray-50 text-gray-700"
                                          }`}
                                        >
                                          {letter}
                                        </span>
                                        {choiceImageSrc ? (
                                          <img
                                            src={choiceImageSrc}
                                            alt={`Choice ${letter}`}
                                            onClick={() => setLightboxSrc(choiceImageSrc)}
                                            className="max-h-16 w-auto flex-1 cursor-zoom-in rounded object-contain transition hover:opacity-90"
                                          />
                                        ) : (
                                          <span
                                            className="flex-1"
                                            dangerouslySetInnerHTML={{
                                              __html: choiceText,
                                            }}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
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
          </div>

          {/* Right column: summary — desktop only */}
          <div className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:gap-4 lg:pb-6">
            <div className="flex flex-col gap-4">
              {/* Worksheet Summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">
                  Worksheet Summary
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Questions Selected</span>
                    <span className="font-semibold text-gray-900">
                      {selectedQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Points</span>
                    <span className="font-semibold text-gray-900">
                      {totalPoints}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={
                      selectedQuestions.length === 0 ||
                      !pdfOptions.title.trim() ||
                      isGeneratingPDF
                    }
                    className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <i className="bx bx-loader-alt mr-2 animate-spin"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-file text-lg"></i>
                        <span className="ml-2">
                          Generate PDF ({selectedQuestions.length})
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isGeneratingPDF}
                    className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-xs text-gray-700">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-orange-500 shadow">
                    <i className="bx bx-light-bulb-on text-lg"></i>
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-orange-600 uppercase">
                    Pro Tip
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-700">
                  Select the questions you want to include before exporting.
                  Only the chosen questions will be compiled and formatted in
                  the generated PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxSrc(null)}
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
          <img
            src={lightboxSrc}
            alt="Enlarged view"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default SelectQuestionsModal;
