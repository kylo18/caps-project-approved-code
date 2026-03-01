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
import EmptyImage from "../assets/icons/empty.png";

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
  const [listViewOnly, setListViewOnly] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
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
  const [modalImage, setModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceModalImage, setChoiceModalImage] = useState(null);
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
    const bySearch = !searchQuery.trim()
      ? questions
      : questions.filter((quizQuestion) => {
          const question = quizQuestion.question || quizQuestion;
          const text = (
            quizQuestion.personalQuizQuestionText ||
            quizQuestion.questionText ||
            question?.questionText ||
            ""
          ).toLowerCase();
          return text.includes(searchQuery.toLowerCase());
        });
    // Newest first (added/copied/edited on top)
    const getDate = (q) => {
      const t =
        q.updated_at ||
        q.created_at ||
        q.personalQuizUpdatedAt ||
        q.personalQuizCreatedAt ||
        q.question?.updated_at ||
        q.question?.created_at ||
        0;
      return new Date(t).getTime();
    };
    return [...bySearch].sort((a, b) => getDate(b) - getDate(a));
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
        lastQuizIdRef.current = null;
        isFetchingRef.current = false;
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
    <div className="relative mt-10 flex min-h-screen w-full flex-1 flex-col justify-center py-2 md:mt-12 lg:mt-2">
      <div className="flex-1">
        <div className="w-full py-3">
          {/* Quiz header / subject-style card with search */}
          <QuizCard
            quiz={quizDetails || quiz}
            quizTypeLabel={quizTypeLabel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoadingQuestions}
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
          <div className="relative mt-3 mb-30 sm:mx-0">
            <div className="w-full">
              {isLoadingQuestions ? (
                <div className="flex flex-col gap-2">
                  <div className="border-color relative mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 sm:px-4">
                    <div className="flex items-center justify-between text-[14px] text-gray-500">
                      <span className="skeleton shimmer h-6 w-28 rounded bg-gray-200"></span>
                      <div className="flex items-center gap-2">
                        <span className="skeleton shimmer h-6 w-16 rounded bg-gray-200"></span>
                        <span className="skeleton shimmer h-6 w-12 rounded bg-gray-200"></span>
                        <span className="skeleton shimmer h-6 w-12 rounded bg-gray-200"></span>
                        <span className="skeleton shimmer h-6 w-10 rounded bg-gray-200"></span>
                      </div>
                    </div>
                    <div className="skeleton shimmer word-break break-word mt-4 min-h-[40px] w-full max-w-full resize-none overflow-hidden rounded border-gray-200 bg-gray-200 py-2 pl-3 text-[14px] break-words whitespace-pre-wrap"></div>
                    <div className="mt-3 space-y-3 p-3">
                      {[1, 2, 3, 4].map((choiceIndex) => (
                        <div
                          key={choiceIndex}
                          className="flex items-center space-x-2"
                        >
                          <span className="skeleton shimmer h-[22px] w-[22px] rounded-full bg-gray-200"></span>
                          <span className="skeleton shimmer h-6 w-3/4 rounded bg-gray-200"></span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
                    <div className="flexse mt-5 mb-1 justify-end gap-2">
                      <span className="skeleton shimmer h-8 w-16 rounded bg-gray-200"></span>
                      <span className="skeleton shimmer h-8 w-16 rounded bg-gray-200"></span>
                      <span className="skeleton shimmer h-8 w-20 rounded bg-gray-200"></span>
                    </div>
                  </div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="outfit-400 border-color mx-auto flex w-full max-w-[1200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                  <img
                    src={EmptyImage}
                    alt="No questions"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  No questions found. Click Add Question or Import questions to
                  get started.
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
                  >
                    <i className="bx bx-plus text-lg"></i>
                    <span className="text-[14px] font-semibold">
                      Add Question
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Header bar similar to AdminContent */}
                  <div className="outfit-400 relative mx-0 mt-3 flex w-full max-w-3xl flex-row items-center rounded-t-3xl border border-b-0 border-gray-200 bg-white sm:mx-auto sm:mt-[2px] sm:rounded-t-xl md:rounded-t-xl">
                    <div className="flex h-full items-center gap-2 px-4 py-2">
                      <div className="outfit-400 flex items-center justify-center gap-2 text-[14px] text-nowrap text-gray-600">
                        <span>
                          {questions.length}{" "}
                          {questions.length === 1 ? "QUESTION" : "QUESTIONS"}
                        </span>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center px-4 py-3">
                      <span className="outfit-400 mr-4 ml-2 items-center text-sm text-nowrap text-gray-500">
                        Show Details
                      </span>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={!listViewOnly}
                          onChange={() => {
                            setListViewOnly((prev) => !prev);
                            setExpandedQuestionId(null);
                          }}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>

                  {filteredQuestions.map((quizQuestion, index) => {
                    const question = quizQuestion.question || quizQuestion;
                    const questionNumber = index + 1;

                    let choices =
                      quizQuestion.personalQuizChoices ||
                      (quizQuestion.personalQuizQuestionID
                        ? choicesMap[quizQuestion.personalQuizQuestionID]
                        : null) ||
                      (question && question.choices) ||
                      [];

                    if (!Array.isArray(choices)) {
                      choices = [];
                    }

                    const questionText =
                      quizQuestion.personalQuizQuestionText ||
                      quizQuestion.questionText ||
                      question.questionText ||
                      "";

                    const questionImage =
                      quizQuestion.personalQuizImage ||
                      quizQuestion.image ||
                      question.image ||
                      null;

                    const score =
                      quizQuestion.personalQuizScore !== undefined
                        ? quizQuestion.personalQuizScore
                        : quizQuestion.score !== undefined
                          ? quizQuestion.score
                          : null;

                    const questionId =
                      quizQuestion.personalQuizQuestionID ||
                      quizQuestion.questionID ||
                      index;
                    const prevId =
                      index > 0
                        ? (filteredQuestions[index - 1]
                            .personalQuizQuestionID ??
                          filteredQuestions[index - 1].questionID ??
                          index - 1)
                        : null;
                    const nextId =
                      index < filteredQuestions.length - 1
                        ? (filteredQuestions[index + 1]
                            .personalQuizQuestionID ??
                          filteredQuestions[index + 1].questionID ??
                          index + 1)
                        : null;

                    return (
                      <div key={questionId}>
                        <div
                          onClick={() => {
                            if (
                              listViewOnly &&
                              expandedQuestionId !== questionId
                            ) {
                              setExpandedQuestionId(questionId);
                            }
                          }}
                          onMouseEnter={() => setHoveredQuestionId(questionId)}
                          onMouseLeave={() => setHoveredQuestionId(null)}
                          className={`border-color relative mx-auto w-full max-w-3xl cursor-pointer border bg-white p-3 sm:px-4 ${
                            listViewOnly && expandedQuestionId !== questionId
                              ? ""
                              : ""
                          } ${
                            listViewOnly
                              ? expandedQuestionId === questionId
                                ? `${index === 0 ? "rounded-b-xl" : "mt-2 mb-2 rounded-xl"}`
                                : index > 0 && prevId === expandedQuestionId
                                  ? `${
                                      index === filteredQuestions.length - 1
                                        ? "mt-2 rounded-t-xl rounded-b-xl"
                                        : index === 1 &&
                                            filteredQuestions[0] &&
                                            (filteredQuestions[0]
                                              .personalQuizQuestionID ??
                                              filteredQuestions[0].questionID ??
                                              0) === expandedQuestionId
                                          ? "mt-2 rounded-t-xl"
                                          : "rounded-t-xl"
                                    }`
                                  : index !== filteredQuestions.length - 1 &&
                                      nextId === expandedQuestionId
                                    ? "rounded-b-xl"
                                    : index === filteredQuestions.length - 1
                                      ? "rounded-b-xl"
                                      : ""
                              : `${index === 0 ? "rounded-t-none" : "rounded-t-xl"} mb-2 rounded-xl`
                          } `}
                        >
                          <div className="w-full max-w-full overflow-hidden break-words">
                            {/* Header row with meta badges - match AdminContent */}
                            <div className="flex items-center justify-between text-[14px] text-gray-500">
                              <span className="outfit-400 text-[12px]">
                                {questionNumber}. MULTIPLE CHOICE
                              </span>
                              <div className="relative flex min-h-[32px] items-center">
                                {/* Badges */}
                                <div
                                  className={`outfit-400 flex items-center transition-opacity duration-150 ${
                                    listViewOnly &&
                                    expandedQuestionId !== questionId &&
                                    hoveredQuestionId === questionId
                                      ? "sm:pointer-events-none sm:absolute sm:opacity-0"
                                      : "sm:relative sm:opacity-100"
                                  }`}
                                >
                                  <span className="rounded-lg px-2 py-1 text-[12px]">
                                    {score ?? 0} PT
                                  </span>
                                </div>
                                {/* Action buttons in header - show on hover in list view */}
                                <div
                                  className={`hidden items-center transition-opacity duration-150 sm:flex ${
                                    listViewOnly &&
                                    expandedQuestionId !== questionId &&
                                    hoveredQuestionId === questionId
                                      ? "sm:relative sm:opacity-100"
                                      : "sm:pointer-events-none sm:absolute sm:opacity-0"
                                  }`}
                                >
                                  <button
                                    className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                    title="Remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(quizQuestion, e);
                                    }}
                                  >
                                    <i className="bx bx-trash text-[16px]"></i>
                                    <span className="outfit-400 text-[12px]">
                                      Remove
                                    </span>
                                  </button>
                                  <button
                                    className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                    title="Copy"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyClick(quizQuestion, e);
                                    }}
                                  >
                                    <i className="bx bx-copy text-[16px]"></i>
                                    <span className="outfit-400 text-[12px]">
                                      Copy
                                    </span>
                                  </button>
                                  {quizQuestion.personalQuizQuestionID && (
                                    <button
                                      className="outfit mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                      title="Edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(quizQuestion, e);
                                      }}
                                    >
                                      <i className="bx bx-edit-alt text-[16px]"></i>
                                      <span className="outfit-400 text-[12px]">
                                        Edit
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Question text - match AdminContent listViewOnly logic */}
                            {listViewOnly ? (
                              expandedQuestionId === questionId ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedQuestionId(null);
                                  }}
                                  className="relative mt-4 cursor-pointer rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:bg-gray-200"
                                >
                                  <div className="word-break outfit-400 break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-200 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: questionText,
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="outfit-400 word-break break-word mt-4 flex w-full max-w-full cursor-pointer items-center overflow-hidden bg-inherit text-[14px] break-words whitespace-pre-wrap">
                                  <span
                                    className="ml-2 font-semibold"
                                    dangerouslySetInnerHTML={{
                                      __html: questionText,
                                    }}
                                  />
                                  {questionImage && (
                                    <img
                                      src={getImageUrl(questionImage)}
                                      alt="Question"
                                      className="ml-auto h-10 w-10 cursor-pointer rounded object-cover hover:opacity-80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setModalImage(
                                          getImageUrl(questionImage),
                                        );
                                      }}
                                    />
                                  )}
                                </div>
                              )
                            ) : (
                              questionText && (
                                <div className="outfit-400 relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-pointer">
                                  <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-200 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: questionText,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            )}

                            {/* Question image - match AdminContent listViewOnly logic */}
                            {questionImage &&
                              (listViewOnly &&
                              expandedQuestionId === questionId ? (
                                <div className="relative mt-3 ml-3 inline-block max-w-[300px] rounded-md">
                                  <img
                                    src={getImageUrl(questionImage)}
                                    alt="Question"
                                    className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-lg hover:opacity-80"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalImage(getImageUrl(questionImage));
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : !listViewOnly ? (
                                <div className="relative mt-3 ml-3 inline-block max-w-[300px] rounded-md">
                                  <img
                                    src={getImageUrl(questionImage)}
                                    alt="Question"
                                    className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-lg hover:opacity-80"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalImage(getImageUrl(questionImage));
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : null)}

                            {/* Choices - match AdminContent listViewOnly logic */}
                            {(!listViewOnly ||
                              (listViewOnly &&
                                expandedQuestionId === questionId)) &&
                              choices &&
                              choices.length > 0 && (
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
                                        : choice.personalQuizIsCorrect !==
                                            undefined
                                          ? choice.personalQuizIsCorrect
                                          : false;
                                    const hasImage = !!choiceImage;
                                    const displayText = hasImage
                                      ? ""
                                      : choiceText;

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
                                          title={
                                            isCorrect ? "Correct answer" : ""
                                          }
                                        />

                                        {displayText ? (
                                          <span
                                            className={`outfit-400 w-[90%] rounded-md p-2 text-[14px] ${
                                              isCorrect
                                                ? "font-semibold text-orange-500"
                                                : "text-gray-700"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                              __html: displayText,
                                            }}
                                          />
                                        ) : null}

                                        {hasImage ? (
                                          <div
                                            className="relative max-w-[200px] cursor-pointer rounded-md hover:opacity-80"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setChoiceModalImage(
                                                getImageUrl(choiceImage),
                                              );
                                              setIsChoiceModalOpen(true);
                                            }}
                                          >
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
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            {/* Divider and action buttons below - match AdminContent */}
                            {(!listViewOnly ||
                              (listViewOnly &&
                                expandedQuestionId === questionId)) && (
                              <>
                                <div className="my-3 h-px bg-gray-200"></div>
                                <div className="mt-4 mb-1 flex justify-end gap-1">
                                  <button
                                    type="button"
                                    className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                    title="Remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(quizQuestion, e);
                                    }}
                                  >
                                    <i className="bx bx-trash text-[16px]"></i>
                                    <span className="outfit-400 text-[12px]">
                                      Remove
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                    title="Copy"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyClick(quizQuestion, e);
                                    }}
                                  >
                                    <i className="bx bx-copy text-[16px]"></i>
                                    <span className="outfit-400 text-[12px]">
                                      Copy
                                    </span>
                                  </button>
                                  {quizQuestion.personalQuizQuestionID && (
                                    <button
                                      type="button"
                                      className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                      title="Edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(quizQuestion, e);
                                      }}
                                    >
                                      <i className="bx bx-edit-alt text-[16px]"></i>
                                      <span className="outfit-400 text-[12px]">
                                        Edit
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Add Question button - match AdminContent */}
              {!isAddOpen && filteredQuestions.length > 0 && (
                <div className="fixed right-[-4px] bottom-[70px] z-49 p-4 text-center sm:right-[-4px] sm:bottom-[-4px]">
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="cursor-pointer rounded-full bg-orange-500 px-[15px] py-[15px] text-[14px] font-semibold text-white shadow-xl hover:bg-orange-600 sm:rounded-xl sm:px-4 sm:py-2"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <i className="bx bx-plus text-[24px] sm:text-[16px]"></i>
                      <span className="outfit-400 hidden sm:block">
                        Add Question
                      </span>
                    </div>
                  </button>
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
                    lastQuizIdRef.current = null;
                    isFetchingRef.current = false;
                    fetchQuestions();
                  }}
                  onCancel={() => setIsAddOpen(false)}
                  isExamQuestionsEnabled
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Choice image full-size modal - match AdminContent */}
      {isChoiceModalOpen && (
        <div
          className="lightbox-bg-image fixed inset-0 z-55 flex items-center justify-center"
          onClick={() => setIsChoiceModalOpen(false)}
        >
          <div className="relative max-h-full max-w-full">
            <img
              src={choiceModalImage}
              alt="Full View"
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}
      {/* Question image full-size modal - match AdminContent */}
      {modalImage && (
        <div
          className="lightbox-bg-image bg-opacity-70 fixed inset-0 z-55 flex items-center justify-center hover:cursor-pointer"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <img
              src={modalImage}
              alt="Question"
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {!isLoadingQuestions && <ScrollToTopButton />}
      {isImportOpen && (
        <ImportQuestionModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={(importedQuestionIds) => {
            lastQuizIdRef.current = null;
            isFetchingRef.current = false;
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
          onComplete={async () => {
            setIsEditOpen(false);
            setEditingQuestion(null);
            // Auto refresh list after edit
            lastQuizIdRef.current = null;
            isFetchingRef.current = false;
            await fetchQuestions();
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
            lastQuizIdRef.current = null;
            isFetchingRef.current = false;
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
