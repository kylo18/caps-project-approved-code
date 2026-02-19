import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AddQuestionForm from "../components/AddQuestionForm";
import ImportQuestionModal from "../components/ImportQuestionModal";
import QuizSettingsModal from "../components/QuizSettingsModal";
import ConfirmModal from "../components/confirmModal";
import EditPersonalQuizQuestionForm from "../components/EditPersonalQuizQuestionForm";
import DuplicatePersonalQuizQuestionForm from "../components/DuplicatePersonalQuizQuestionForm";
import SelectQuestionsModal from "../components/SelectQuestionsModal";
import AssignToClassModal from "../components/AssignToClassModal";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import QuizCard from "../components/quizCard";
import ScrollToTopButton from "../components/scrollToTopButton";

const QuizContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;
  const [quizDetails, setQuizDetails] = useState(quiz || null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [choicesMap, setChoicesMap] = useState({}); // Map of questionID -> choices
  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isFetchingRef = useRef(false);
  const lastQuizIdRef = useRef(null);
  const showToastRef = useRef(showToast);
  const [showChoices, setShowChoices] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicatingQuestion, setDuplicatingQuestion] = useState(null);
  const [isSelectQuestionsOpen, setIsSelectQuestionsOpen] = useState(false);
  const [isAssignToClassOpen, setIsAssignToClassOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditQuizOpen, setIsEditQuizOpen] = useState(false);
  const [editQuizForm, setEditQuizForm] = useState({
    title: quiz?.title || "",
    description: quiz?.description || "",
    instruction: quiz?.instruction || "",
  });
  const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);
  const [isArchivingQuiz, setIsArchivingQuiz] = useState(false);

  // Helper function to construct image URL (matches backend generateUrl logic)
  const getImageUrl = (imagePath) => {
    // If path is null or empty, return null
    if (!imagePath) {
      return null;
    }

    // If it's already a full URL, return as is (works for external URLs)
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Remove /storage/ prefix if present (path might be stored with or without it)
    let cleanPath = imagePath;
    if (imagePath.startsWith("/storage/")) {
      cleanPath = imagePath.substring("/storage/".length);
    } else if (imagePath.startsWith("storage/")) {
      cleanPath = imagePath.substring("storage/".length);
    }

    // Check if it looks like a valid storage path (contains question_images/ or choices/)
    // If it doesn't look like a storage path, return null
    if (
      !cleanPath.includes("question_images/") &&
      !cleanPath.includes("choices/")
    ) {
      return null;
    }

    // Generate the full URL for the file
    // Use the base URL from API (removing /api suffix) and append /storage/
    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Keep showToast ref updated
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const quizId = useMemo(() => {
    const source = quizDetails || quiz;
    if (!source) return null;
    return (
      source.personalQuizID ||
      source.id ||
      source.quizID ||
      source.personalQuizId
    );
  }, [quizDetails, quiz]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const term = searchQuery.toLowerCase();
    return questions.filter((quizQuestion) => {
      const question = quizQuestion.question || quizQuestion;
      const text = (
        quizQuestion.personalQuizQuestionText ||
        quizQuestion.questionText ||
        question?.questionText ||
        ""
      ).toLowerCase();
      return text.includes(term);
    });
  }, [questions, searchQuery]);

  useEffect(() => {
    if (!quiz) {
      navigate("/libraries", { replace: true });
    }
  }, [quiz, navigate]);

  // Keep local quizDetails in sync if navigation state changes
  useEffect(() => {
    if (quiz) {
      setQuizDetails((prev) => prev || quiz);
      setEditQuizForm({
        title: quiz.title || "",
        description: quiz.description || "",
        instruction: quiz.instruction || "",
      });
    }
  }, [quiz]);

  const fetchQuestions = useCallback(async () => {
    if (!quizId || isFetchingRef.current) return;

    // Prevent fetching the same quiz again if we already have data
    if (lastQuizIdRef.current === quizId) {
      return;
    }

    isFetchingRef.current = true;
    lastQuizIdRef.current = quizId;
    setIsLoadingQuestions(true);
    setChoicesMap({}); // Clear previous choices

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsLoadingQuestions(false);
        isFetchingRef.current = false;
        return;
      }

      const response = await fetch(
        `${apiUrl}/personal-quiz-questions/${quizId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        sessionStorage.removeItem("token");
        setIsLoadingQuestions(false);
        isFetchingRef.current = false;
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
        setIsLoadingQuestions(false);
        isFetchingRef.current = false;
        return;
      }

      // The API returns questions array where each item has a 'question' property
      const fetchedQuestions = data.questions || [];
      setQuestions(fetchedQuestions);

      // Fetch choices for questions that don't have personalQuizChoices
      const choicesToFetch = [];
      fetchedQuestions.forEach((q) => {
        // If no personalQuizChoices, try to fetch them
        if (!q.personalQuizChoices || q.personalQuizChoices.length === 0) {
          if (q.personalQuizQuestionID) {
            choicesToFetch.push({
              personalQuizQuestionID: q.personalQuizQuestionID,
              questionID: q.questionID, // For imported questions
            });
          }
        }
      });

      // Fetch choices for questions that need them
      if (choicesToFetch.length > 0) {
        const choicesPromises = choicesToFetch.map(
          async ({ personalQuizQuestionID, questionID }) => {
            try {
              // First try to fetch from personal-quiz-choices endpoint
              const choicesResponse = await fetch(
                `${apiUrl}/personal-quiz-choices/${personalQuizQuestionID}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (choicesResponse.ok) {
                const choicesData = await choicesResponse.json();
                if (
                  choicesData.success &&
                  choicesData.choices &&
                  choicesData.choices.length > 0
                ) {
                  return {
                    personalQuizQuestionID,
                    choices: choicesData.choices,
                  };
                }
              }

              // If no personal quiz choices and it's an imported question, fetch from original question
              if (questionID) {
                const originalQuestionResponse = await fetch(
                  `${apiUrl}/questions/${questionID}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );

                if (originalQuestionResponse.ok) {
                  const originalQuestionData =
                    await originalQuestionResponse.json();
                  if (
                    originalQuestionData.success &&
                    originalQuestionData.data?.choices
                  ) {
                    return {
                      personalQuizQuestionID,
                      choices: originalQuestionData.data.choices,
                    };
                  }
                }
              }
            } catch (error) {
              console.error(
                `Error fetching choices for question ${personalQuizQuestionID}:`,
                error,
              );
            }
            return null;
          },
        );

        const choicesResults = await Promise.all(choicesPromises);
        const newChoicesMap = {};
        choicesResults.forEach((result) => {
          if (result) {
            newChoicesMap[result.personalQuizQuestionID] = result.choices;
          }
        });
        setChoicesMap((prev) => ({ ...prev, ...newChoicesMap }));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      showToast(
        error.message || "Failed to fetch questions. Please try again.",
        "error",
      );
    } finally {
      setIsLoadingQuestions(false);
      isFetchingRef.current = false;
    }
  }, [quizId, apiUrl]);

  // Reset ref when quizId changes
  useEffect(() => {
    if (quizId !== lastQuizIdRef.current) {
      lastQuizIdRef.current = null;
      isFetchingRef.current = false;
    }
  }, [quizId]);

  // Fetch questions when quizId is available
  useEffect(() => {
    if (quizId && !isFetchingRef.current) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handleDeleteClick = (quizQuestion, e) => {
    e.stopPropagation();
    setDeletingQuestion(quizQuestion);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (quizQuestion, e) => {
    e.stopPropagation();
    // Only allow editing personal quiz questions (not imported questions)
    if (!quizQuestion.personalQuizQuestionID) {
      showToast("Only manually added questions can be edited.", "error");
      return;
    }
    setEditingQuestion(quizQuestion);
    setIsEditOpen(true);
  };

  const handleCopyClick = (quizQuestion, e) => {
    e.stopPropagation();
    setDuplicatingQuestion(quizQuestion);
    setIsDuplicateOpen(true);
  };

  const handleOpenEditQuiz = () => {
    if (!quizDetails) return;
    setEditQuizForm({
      title: quizDetails.title || "",
      description: quizDetails.description || "",
      instruction: quizDetails.instruction || "",
    });
    setIsEditQuizOpen(true);
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    if (!quizId) return;

    if (!editQuizForm.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }

    setIsUpdatingQuiz(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/update-personal-quizzes/${quizId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            title: editQuizForm.title.trim(),
            description: editQuizForm.description || null,
            instruction: editQuizForm.instruction || null,
          }),
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem updating the quiz. Please try again.";

        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            message = errorMessages.join(", ") || message;
          }
        } catch {
          // ignore JSON parse error and use default message
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data?.quiz) {
        setQuizDetails((prev) => ({
          ...(prev || {}),
          ...data.quiz,
        }));
        showToast("Quiz updated successfully.", "success");
        setIsEditQuizOpen(false);
      } else {
        throw new Error(data?.message || "Failed to update quiz.");
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem updating the quiz. Please try again.",
        "error",
      );
    } finally {
      setIsUpdatingQuiz(false);
    }
  };

  const handleArchiveQuiz = async () => {
    if (!quizId || isArchivingQuiz) return;

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      setIsArchivingQuiz(true);

      const response = await fetch(
        `${apiUrl}/personal-quizzes/${quizId}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem archiving the quiz. Please try again.";

        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // ignore JSON parse error and use default message
        }

        throw new Error(message);
      }

      const data = await response.json();
      showToast(
        data.message || "Personal quiz archived successfully.",
        "success",
      );

      // After archiving, return to Libraries
      navigate("/libraries", { replace: true });
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem archiving the quiz. Please try again.",
        "error",
      );
    } finally {
      setIsArchivingQuiz(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return;

    const personalQuizQuestionID =
      deletingQuestion.personalQuizQuestionID || deletingQuestion.id;

    if (!personalQuizQuestionID) {
      showToast("Unable to determine question ID for deletion.", "error");
      setIsDeleteModalOpen(false);
      setDeletingQuestion(null);
      return;
    }

    setIsDeleting(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setDeletingQuestion(null);
        return;
      }

      const response = await fetch(
        `${apiUrl}/personal-quiz-questions/${personalQuizQuestionID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem deleting the question. Please try again.";

        if (response.status === 401) {
          sessionStorage.removeItem("token");
          message = "Your session has expired. Please log in again.";
        } else if (response.status === 403) {
          message = "You do not have permission to remove this question.";
        } else if (response.status === 404) {
          message = "Question not found.";
        } else {
          try {
            const data = await response.json();
            if (data?.message) {
              message = data.message;
            }
          } catch {
            // ignore JSON parse error and use default message
          }
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data.success) {
        showToast(
          data.message || "Question removed from quiz successfully.",
          "success",
        );
        // Refresh questions list
        fetchQuestions();
      } else {
        showToast(
          data.message || "Failed to delete question. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem deleting the question. Please try again.",
        "error",
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeletingQuestion(null);
    }
  };

  if (!quiz) {
    return null;
  }

  const quizTypeLabel =
    (quizDetails || quiz)?.quizType?.name ||
    ((quizDetails || quiz)?.quiz_type_id === 1 ? "Subject-based" : "Custom");

  return (
    <div className="relative mt-2 flex min-h-screen w-full flex-1 flex-col justify-center py-2">
      <div className="flex-1">
        <div className="w-full py-3">
          {/* Quiz header / subject-style card with search */}
          <QuizCard
            quiz={quizDetails || quiz}
            quizTypeLabel={quizTypeLabel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onAddQuestionClick={() => setIsAddOpen(true)}
            onImportQuestionClick={() => setIsImportOpen(true)}
            onDownloadWorksheetClick={() => {
              if (questions.length === 0) {
                showToast("No questions available to download.", "error");
                return;
              }
              setIsSelectQuestionsOpen(true);
            }}
            onAssignToClassClick={() => setIsAssignToClassOpen(true)}
            onEditQuiz={handleOpenEditQuiz}
            onArchiveQuiz={handleArchiveQuiz}
          />

          {/* Questions List */}
          <div className="relative -mx-2 mt-3 sm:mx-0">
            <div className="w-full">
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-8 sm:mx-auto sm:max-w-3xl">
                  <div className="loader"></div>
                  <span className="ml-3 text-sm text-gray-600">
                    Loading questions...
                  </span>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="outfit border-color mx-auto w-full max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  No questions added yet. Click{" "}
                  <span className="font-semibold">Add Question</span> or{" "}
                  <span className="font-semibold">Import Question</span> to get
                  started.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Header bar similar to AdminContent */}
                  <div className="outfit border-color relative mx-0 mt-3 flex w-full max-w-3xl flex-row items-center rounded-t-3xl border border-b-0 bg-white sm:mx-auto sm:mt-[2px] sm:rounded-t-xl md:rounded-tl-none">
                    <div className="flex h-full items-center gap-2 px-4 py-2">
                      <div className="flex items-center justify-center gap-2 text-[14px] text-nowrap text-gray-600">
                        <span>
                          {questions.length}{" "}
                          {questions.length === 1 ? "QUESTION" : "QUESTIONS"}
                        </span>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center px-4 py-3">
                      <span className="mr-4 ml-2 items-center text-sm text-nowrap text-gray-500">
                        Show Choices
                      </span>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={showChoices}
                          onChange={() => setShowChoices((prev) => !prev)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>

                  {filteredQuestions.map((quizQuestion, index) => {
                    // Handle both imported questions (with question property) and manually added questions
                    const question = quizQuestion.question || quizQuestion;
                    const questionNumber = index + 1;

                    // Get choices from multiple possible locations:
                    // 1. personalQuizChoices (for manually added questions)
                    // 2. choicesMap (for imported questions fetched separately)
                    // 3. question.choices (for imported questions with loaded relationship)
                    let choices =
                      quizQuestion.personalQuizChoices ||
                      (quizQuestion.personalQuizQuestionID
                        ? choicesMap[quizQuestion.personalQuizQuestionID]
                        : null) ||
                      (question && question.choices) ||
                      [];

                    // Ensure choices is always an array
                    if (!Array.isArray(choices)) {
                      choices = [];
                    }

                    // Get question text - could be from personalQuizQuestionText or questionText
                    const questionText =
                      quizQuestion.personalQuizQuestionText ||
                      quizQuestion.questionText ||
                      question.questionText ||
                      "";

                    // Get question image - could be from personalQuizImage or image
                    const questionImage =
                      quizQuestion.personalQuizImage ||
                      quizQuestion.image ||
                      question.image ||
                      null;

                    // Get score - could be from personalQuizScore or score
                    const score =
                      quizQuestion.personalQuizScore !== undefined
                        ? quizQuestion.personalQuizScore
                        : quizQuestion.score !== undefined
                          ? quizQuestion.score
                          : null;

                    // Difficulty and coverage labels (for header badges)
                    const difficultyLabel =
                      typeof question.difficulty === "string"
                        ? question.difficulty
                        : question.difficulty?.difficultyName ||
                          question.difficulty?.name ||
                          "N/A";

                    const coverageSource =
                      quizQuestion.personalQuizCoverage || question.coverage;
                    const coverageLabel =
                      typeof coverageSource === "string"
                        ? coverageSource
                        : coverageSource?.coverageName ||
                          coverageSource?.name ||
                          "N/A";

                    return (
                      <div
                        key={
                          quizQuestion.personalQuizQuestionID ||
                          quizQuestion.questionID ||
                          index
                        }
                        className="border-color relative mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 shadow-sm sm:px-5 sm:py-5"
                      >
                        <div className="w-full max-w-full overflow-hidden break-words">
                          {/* Header row with meta badges */}
                          <div className="outfit flex items-center justify-between text-[14px] text-gray-500">
                            <span>{questionNumber}. MULTIPLE CHOICE</span>
                            <div className="relative flex min-h-[32px] items-center gap-3">
                              <div className="flex items-center">
                                <span className="rounded-lg px-2 py-1 text-[12px] capitalize">
                                  {difficultyLabel}
                                </span>
                                <span> •</span>
                                <span className="rounded-lg px-2 py-1 text-[12px] capitalize">
                                  {coverageLabel}
                                </span>
                                <span> •</span>
                                <span className="rounded-lg px-2 py-1 text-[12px]">
                                  {score ?? 0} PT
                                </span>
                              </div>
                              {/* Edit, Copy, and Delete buttons */}
                              <div className="flex items-center gap-2">
                                {/* Only show edit button for personal quiz questions */}
                                {quizQuestion.personalQuizQuestionID && (
                                  <button
                                    onClick={(e) =>
                                      handleEditClick(quizQuestion, e)
                                    }
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                    title="Edit Question"
                                  >
                                    <i className="bx bx-edit text-lg"></i>
                                  </button>
                                )}
                                <button
                                  onClick={(e) =>
                                    handleCopyClick(quizQuestion, e)
                                  }
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                                  title="Copy Question"
                                >
                                  <i className="bx bx-copy text-lg"></i>
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleDeleteClick(quizQuestion, e)
                                  }
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Delete Question"
                                >
                                  <i className="bx bx-trash text-lg"></i>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Question text */}
                          {questionText && (
                            <div className="outfit relative mt-4 rounded-sm bg-gray-100 p-1">
                              <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: questionText,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Question image */}
                          {questionImage && (
                            <div className="mt-3">
                              <img
                                src={getImageUrl(questionImage)}
                                alt="Question"
                                className="max-h-64 rounded-md object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          {/* Choices */}
                          {showChoices && choices && choices.length > 0 && (
                            <div className="mt-3 space-y-3 p-3">
                              {choices.map((choice, choiceIndex) => {
                                const choiceText =
                                  choice.choiceText ||
                                  choice.personalQuizChoiceText ||
                                  "";
                                const choiceImage =
                                  choice.image ||
                                  choice.personalQuizImage ||
                                  null;
                                const isCorrect =
                                  choice.isCorrect !== undefined
                                    ? choice.isCorrect
                                    : choice.personalQuizIsCorrect !== undefined
                                      ? choice.personalQuizIsCorrect
                                      : false;

                                return (
                                  <div
                                    key={
                                      choice.personalQuizChoiceID ||
                                      choice.choiceID ||
                                      choiceIndex
                                    }
                                    className="relative flex items-center space-x-2"
                                  >
                                    <i
                                      className={`bx ${
                                        isCorrect
                                          ? "bxs-check-circle text-orange-500"
                                          : "bx-circle text-gray-300"
                                      } text-[22px]`}
                                      style={{ minWidth: 22 }}
                                      title={isCorrect ? "Correct answer" : ""}
                                    />

                                    {choiceText && (
                                      <span
                                        className={`outfit w-[90%] rounded-md p-2 text-[14px] ${
                                          isCorrect
                                            ? "font-semibold text-orange-500"
                                            : "text-gray-700"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                          __html: choiceText,
                                        }}
                                      />
                                    )}

                                    {choiceImage && (
                                      <div className="relative max-w-[200px] cursor-pointer rounded-md hover:opacity-80">
                                        <img
                                          src={getImageUrl(choiceImage)}
                                          alt={`Choice ${String.fromCharCode(
                                            65 + choiceIndex,
                                          )}`}
                                          className={`h-auto max-w-full rounded-md border-2 object-cover ${
                                            isCorrect
                                              ? "border-orange-500"
                                              : "border-transparent"
                                          }`}
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAddOpen && (
                <AddQuestionForm
                  mode="quiz"
                  personalQuizID={quizId}
                  subjectID={quiz.subjectID || quiz.subject?.subjectID || null}
                  quizTypeId={quiz.quiz_type_id}
                  activeTab={0}
                  onComplete={() => {
                    setIsAddOpen(false);
                    showToast("Question added to quiz!", "success");
                    fetchQuestions(); // Refresh questions list
                  }}
                  onCancel={() => setIsAddOpen(false)}
                  isExamQuestionsEnabled
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {!isLoadingQuestions && <ScrollToTopButton />}
      {isImportOpen && (
        <ImportQuestionModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={(importedQuestionIds) => {
            // Questions are already imported, just refresh the list
            fetchQuestions();
          }}
          personalQuizID={quizId}
          subjectID={quiz.subjectID || quiz.subject?.subjectID || null}
        />
      )}
      {isSettingsOpen && (
        <QuizSettingsModal
          personalQuizID={quizId}
          isFormOpen={isSettingsOpen}
          setIsFormOpen={setIsSettingsOpen}
          onSuccess={() => {
            showToast("Quiz settings saved successfully.", "success");
          }}
        />
      )}
      {/* Delete Question Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingQuestion(null);
        }}
        onConfirm={handleDeleteConfirm}
        message={
          deletingQuestion
            ? "Are you sure you want to delete this question? This action cannot be undone."
            : "Are you sure you want to delete this question?"
        }
        isLoading={isDeleting}
      />
      {/* Edit Question Modal */}
      {isEditOpen && editingQuestion && (
        <EditPersonalQuizQuestionForm
          quizQuestion={editingQuestion}
          quiz={quiz}
          onComplete={async (updatedQuestion) => {
            setIsEditOpen(false);
            setEditingQuestion(null);

            if (updatedQuestion) {
              const questionId = updatedQuestion.personalQuizQuestionID;

              // Update the question directly in the state
              setQuestions((prevQuestions) => {
                return prevQuestions.map((q) => {
                  const qId = q.personalQuizQuestionID || q.id;
                  if (qId === questionId) {
                    // Replace with updated question data
                    // The response has choices in the 'choices' property
                    const updatedChoices =
                      updatedQuestion.choices ||
                      updatedQuestion.personal_quiz_choices ||
                      q.personalQuizChoices ||
                      [];

                    return {
                      ...q,
                      personalQuizQuestionText:
                        updatedQuestion.personalQuizQuestionText ||
                        updatedQuestion.questionText,
                      personalQuizImage:
                        updatedQuestion.personalQuizImage ||
                        updatedQuestion.image,
                      personalQuizScore:
                        updatedQuestion.personalQuizScore ||
                        updatedQuestion.score,
                      personalQuizCoverageId:
                        updatedQuestion.personalQuizCoverageId,
                      personalQuizChoices: updatedChoices,
                    };
                  }
                  return q;
                });
              });

              // Update choices map if needed
              const choices =
                updatedQuestion.choices ||
                updatedQuestion.personal_quiz_choices ||
                [];
              if (choices.length > 0) {
                setChoicesMap((prev) => ({
                  ...prev,
                  [questionId]: choices,
                }));
              }
            } else {
              // Fallback: force refresh if no updated question data
              lastQuizIdRef.current = null;
              isFetchingRef.current = false;
              setQuestions([]);
              setChoicesMap({});
              await new Promise((resolve) => setTimeout(resolve, 300));
              fetchQuestions();
            }
          }}
          onCancel={() => {
            setIsEditOpen(false);
            setEditingQuestion(null);
          }}
        />
      )}
      {/* Duplicate Question Modal */}
      {isDuplicateOpen && duplicatingQuestion && (
        <DuplicatePersonalQuizQuestionForm
          quizQuestion={duplicatingQuestion}
          quiz={quiz}
          onComplete={() => {
            setIsDuplicateOpen(false);
            setDuplicatingQuestion(null);
            showToast("Question copied successfully!", "success");
            // Refresh questions list
            fetchQuestions();
          }}
          onCancel={() => {
            setIsDuplicateOpen(false);
            setDuplicatingQuestion(null);
          }}
        />
      )}
      {/* Select Questions Modal */}
      {isSelectQuestionsOpen && (
        <SelectQuestionsModal
          isOpen={isSelectQuestionsOpen}
          onClose={() => setIsSelectQuestionsOpen(false)}
          personalQuizID={quizId}
          quizTitle={quizDetails?.title || quiz?.title || ""}
          quizInstruction={quizDetails?.instruction || quiz?.instruction || ""}
          onError={(errorMessage) => {
            showToast(errorMessage, "error");
          }}
        />
      )}
      {/* Assign to Class Modal */}
      {isAssignToClassOpen && (
        <AssignToClassModal
          isOpen={isAssignToClassOpen}
          onClose={() => setIsAssignToClassOpen(false)}
          personalQuizID={quizId}
          quizTitle={quiz.title || "Untitled Quiz"}
          onSuccess={() => {
            // Optionally refresh data or show success message
            showToast("Quiz assigned to classes successfully!", "success");
          }}
        />
      )}
      {/* Edit Quiz Modal */}
      {isEditQuizOpen && (
        <div
          className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center p-4"
          onClick={() => {
            setIsEditQuizOpen(false);
          }}
        >
          <div
            className="animate-fade-in-up relative mx-auto flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Quiz</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditQuizOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
              <form onSubmit={handleUpdateQuiz}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editQuizForm.title}
                      onChange={(e) =>
                        setEditQuizForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                      placeholder="Enter quiz title"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editQuizForm.description}
                      onChange={(e) =>
                        setEditQuizForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                      placeholder="Short description of this quiz (optional)"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Instruction
                    </label>
                    <textarea
                      name="instruction"
                      value={editQuizForm.instruction}
                      onChange={(e) =>
                        setEditQuizForm((prev) => ({
                          ...prev,
                          instruction: e.target.value,
                        }))
                      }
                      className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                      placeholder="Instructions for students (optional)"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditQuizOpen(false);
                    }}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingQuiz}
                    className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingQuiz ? (
                      <>
                        <i className="bx bx-loader-alt mr-2 animate-spin"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-check mr-2"></i>
                        Update Quiz
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizContent;
