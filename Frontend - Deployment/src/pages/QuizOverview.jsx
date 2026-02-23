import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QuizResultsTable from "../components/QuizResultsTable";
import { Textfit } from "react-textfit";
import Subject from "../assets/icons/papers.png";
import ConfirmModal from "../components/confirmModal";
import SelectQuestionsModal from "../components/SelectQuestionsModal";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

import SubPhoto from "../assets/gottfield.jpg";

const QuizOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Optional subject data (may come directly or from quiz.subject)
  const quiz = location.state?.quiz;
  // Get subject - prefer location.state, then quiz.subject
  // For display purposes, use quiz.subject even if it doesn't have subjectID
  // For data fetching, we'll check for subjectID in the useEffect
  const subject = location.state?.subject || quiz?.subject || null;
  const classPersonalQuizID =
    location.state?.classPersonalQuizID || quiz?.classPersonalQuizID || null;

  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Edit, Delete, Worksheet states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedQuiz, setEditedQuiz] = useState({
    title: "",
    description: "",
    instruction: "",
  });
  const [validationError, setValidationError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast, showToast } = useToast();

  // Use local state for quiz so we can update it after editing
  const [quizState, setQuizState] = useState(quiz);

  // Get quiz ID for personal quizzes
  const quizId =
    quizState?.personalQuizID ||
    quizState?.id ||
    quizState?.quizID ||
    quizState?.personalQuizId;

  // Update quiz state when location.state changes
  useEffect(() => {
    if (quiz) {
      setQuizState(quiz);
    }
  }, [quiz]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      try {
        // If we have a subject ID, fetch subject-based data
        if (subject?.subjectID) {
          const questionsRes = await fetch(
            `${apiUrl}/subjects/${subject.subjectID}/questions`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          // Handle questions count (only active questions)
          if (questionsRes.ok) {
            const data = await questionsRes.json();
            const questions = data.data || [];
            setQuestionCount(questions.filter((q) => q.status_id === 2).length);
          } else {
            setQuestionCount(0);
          }
        }
        // If we have a personal quiz ID, fetch personal quiz questions count
        // This handles both custom quizzes and subject-based quizzes where subject doesn't have subjectID
        else if (quizId) {
          try {
            const questionsRes = await fetch(
              `${apiUrl}/personal-quiz-questions/${quizId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (questionsRes.ok) {
              const data = await questionsRes.json();
              if (data.success && Array.isArray(data.questions)) {
                setQuestionCount(data.questions.length);
              } else {
                // Fallback to quiz.question_count if available
                setQuestionCount(quizState?.question_count || 0);
              }
            } else {
              // Fallback to quiz.question_count if available
              setQuestionCount(quizState?.question_count || 0);
            }
          } catch {
            // Fallback to quizState.question_count if available
            setQuestionCount(quizState?.question_count || 0);
          }
        } else {
          // No subject or quiz ID, use fallback
          setQuestionCount(quizState?.question_count || 0);
        }
      } catch {
        setQuestionCount(quiz?.question_count || 0);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [subject, quizId, quizState]);

  // Edit handler
  const handleEditClick = () => {
    if (!quizState) return;
    setEditedQuiz({
      title: quizState.title || "",
      description: quizState.description || "",
      instruction: quizState.instruction || "",
    });
    setShowEditModal(true);
    setValidationError("");
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    if (!editedQuiz.title.trim()) {
      setValidationError("Please fill in the quiz title");
      return;
    }

    if (!quizId) {
      showToast("Quiz ID not found", "error");
      return;
    }

    const token = sessionStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setIsEditing(true);
    setValidationError("");

    try {
      const response = await fetch(
        `${apiUrl}/update-personal-quizzes/${quizId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editedQuiz.title.trim(),
            description: editedQuiz.description || null,
            instruction: editedQuiz.instruction || null,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        // Update the quiz in local state
        const updatedQuiz = {
          ...quizState,
          title: editedQuiz.title.trim(),
          description: editedQuiz.description || null,
          instruction: editedQuiz.instruction || null,
        };
        setQuizState(updatedQuiz);
        // Update the location state as well
        navigate(location.pathname + location.search, {
          state: { quiz: updatedQuiz, subject },
          replace: true,
        });
        setShowEditModal(false);
        setEditedQuiz({
          title: "",
          description: "",
          instruction: "",
        });
        showToast("Quiz updated successfully", "success");
      } else {
        showToast(result.message || "Failed to update quiz", "error");
      }
    } catch (error) {
      console.error("Error updating quiz:", error);
      showToast("An error occurred while updating quiz", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete handler
  const handleDeleteClick = () => {
    if (!quizState) return;
    setQuizToDelete(quizState);
    setShowDeleteModal(true);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete || !quizId) return;

    const token = sessionStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setIsDeleting(true);

    try {
      const response = await fetch(`${apiUrl}/personal-quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setQuizToDelete(null);
        showToast("Quiz deleted successfully", "success");
        // Navigate back to libraries
        navigate("/libraries");
      } else {
        const data = await response.json();
        showToast(data.message || "Failed to delete quiz", "error");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      showToast("An error occurred while deleting quiz", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Nothing was passed
  if (!quizState && !subject) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
        <img
          src={Subject}
          alt="No quiz selected"
          className="h-32 w-32 opacity-80"
        />
        <span className="mt-4 text-[15px] text-gray-500">No quiz selected</span>
        <span className="w-60 text-[13px] text-gray-400">
          Go back to Libraries and choose a quiz to view its details.
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        {/* Desktop skeleton - match SubjectOverview */}
        <div className="border-color relative z-51 mx-auto mt-8 hidden h-38 max-w-[1200px] overflow-hidden rounded-xl border bg-white px-6 pt-6 sm:block lg:h-37">
          <div className="flex animate-pulse items-center space-x-4">
            <div className="skeleton shimmer size-20 rounded-md"></div>
            <div className="flex-1">
              <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
              <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
            </div>
          </div>
          <div className="outfit mt-3 flex w-full flex-row items-end justify-end gap-2 font-semibold md:hidden">
            <div className="skeleton shimmer h-9 w-40 rounded-md"></div>
          </div>
        </div>

        {/* Mobile skeleton - match SubjectOverview */}
        <div className="border-color relative z-48 -mx-2 mt-15 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden">
          <div className="flex flex-wrap items-start justify-between">
            <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
              <div className="skeleton shimmer mt-2 mb-2 ml-2 h-8 w-58 rounded"></div>
              <div className="mt-2 ml-2 flex gap-1">
                <div className="skeleton shimmer h-5 w-38 rounded"></div>
              </div>
            </div>
            <div className="skeleton shimmer mt-1 size-20 rounded-md"></div>
          </div>
          <div className="outfit mt-5 ml-2 flex w-full flex-row items-center justify-start gap-2 font-semibold">
            <div className="skeleton shimmer mb-6 h-9 w-40 rounded-md"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile version: block on mobile, hidden on md+ */}
      <div className="block md:hidden">
        <div className="border-color relative z-48 -mx-2 mt-15 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:rounded-md sm:pt-4 md:hidden">
          {/* Quiz header (for custom quizzes that may not have a subject) */}
          {quizState && !subject && (
            <div className="flex flex-col gap-2">
              <h1 className="outfit text-[18px] font-bold break-words">
                {quizState.title || "Untitled Quiz"}
              </h1>
              {quizState.description && (
                <p className="text-[12px] text-gray-500">
                  {quizState.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-500">
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                  {quizState.quizType?.name ||
                    (quizState.quiz_type_id === 1 ? "Subject-based" : "Custom")}
                </span>
                <span className="mx-1 align-middle leading-none text-gray-400">
                  •
                </span>
                <p className="text-[12px]">
                  {questionCount}{" "}
                  {questionCount === 1 ? "question" : "questions"}
                </p>
                {quizState.created_at && (
                  <span className="flex items-center gap-1">
                    <span className="mx-1 align-middle leading-none text-gray-400">
                      •
                    </span>
                    <i className="bx bx-calendar" />
                    {new Date(quizState.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Subject header (only if subject is available) */}
          {subject && (
            <div className="flex flex-wrap items-start justify-between sm:hidden">
              <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
                <h1 className="outfit mt-2 ml-2 text-[18px] font-bold break-words">
                  {subject.subjectName}
                </h1>
                <div className="mt-2 ml-2 flex gap-1 text-gray-500">
                  <i className="bx bx-book text-[16px]d mt-[1px]"></i>
                  <p className="text-[12px]">{subject.subjectCode}</p>
                  <span className="mx-1 align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[12px]">
                    {questionCount}{" "}
                    {questionCount === 1 ? "question" : "questions"}
                  </p>
                  <span className="mx-1 align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[12px]">
                    {subject.programName === "GE"
                      ? "General Subject"
                      : subject.programName || "-"}
                  </p>
                  <span className="mx-1 align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[12px]">{subject.yearLevel || "-"}</p>
                </div>
              </div>
              <img
                src={SubPhoto}
                alt="Subject"
                className="border-color mt-1 size-20 rounded-md border object-cover"
              />
            </div>
          )}

          {subject && (
            <div className="hidden flex-wrap items-center sm:flex">
              <img
                src={SubPhoto}
                alt="Subject"
                className="border-color mr-5 size-18 rounded-md border object-cover"
              />
              <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
                <h1 className="outfit text-[15px] font-bold break-words md:text-[18px]">
                  {subject.subjectName}
                </h1>
                <div className="mt-1 flex gap-1 text-gray-500">
                  <i className="bx bx-book mt-[1px] text-lg"></i>

                  <p className="text-[14px]">{subject.subjectCode}</p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {questionCount}{" "}
                    {questionCount === 1 ? "question" : "questions"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {subject.programName === "GE"
                      ? "General Subject"
                      : subject.programName || "-"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">{subject.yearLevel || "-"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="relative mt-4 flex items-start justify-start sm:items-end sm:justify-end">
            {quizState && (
              <button
                className="border-color mb-4 cursor-pointer items-center justify-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
                onClick={() => {
                  navigate("/quiz-content", { state: { quiz: quizState } });
                  window.dispatchEvent(new Event("closeSubjectSidebar"));
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bx bxs-edit"></i>
                  <span className="text-[14px]">Manage Questions</span>
                </span>
              </button>
            )}
            {subject && !quizState && (
              <button
                className="border-color mb-4 cursor-pointer items-center justify-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
                onClick={() => {
                  const user = JSON.parse(sessionStorage.getItem("user"));
                  const roleID = user?.roleID ?? user?.roleId;
                  let path = "/dean/subjects?subject_id=" + subject.subjectID;
                  if (roleID === 2)
                    path = "/faculty/subjects?subject_id=" + subject.subjectID;
                  else if (roleID === 3)
                    path =
                      "/program-chair/subjects?subject_id=" + subject.subjectID;
                  navigate(path, { state: { subject } });
                  window.dispatchEvent(new Event("closeSubjectSidebar"));
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bx bxs-edit"></i>
                  <span className="text-[14px]">Manage Questions</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {(classPersonalQuizID || quizId) && (
          <QuizResultsTable
            classPersonalQuizID={classPersonalQuizID}
            personalQuizID={quizId}
          />
        )}
      </div>

      {/* Desktop version - match SubjectOverview container layout */}
      <div className="hidden py-8 md:block">
        <div className="border-color relative mx-auto -mt-4 flex h-[190px] max-w-[1200px] flex-row items-start justify-between overflow-visible border-b bg-white p-6">
          {/* Show subject header when available; otherwise fall back to quiz title for custom quizzes */}
          {subject ? (
            <div className="flex w-full flex-col items-center md:flex-row md:flex-nowrap md:items-center">
              <div className="relative flex flex-col items-center md:mr-5">
                <img
                  src={SubPhoto}
                  alt="Subject"
                  className="border-color size-21 rounded-md border object-cover"
                />
              </div>

              <div className="outfit flex max-w-full min-w-0 flex-col flex-wrap md:max-w-[calc(100%-200px)]">
                <div className="outfit line-clamp-2">
                  <Textfit
                    mode="multi"
                    min={14}
                    max={20}
                    style={{
                      fontWeight: 600,
                      lineHeight: "1.2",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    <span className="text-[18px]">
                      {quizState?.title || subject.subjectName}
                    </span>
                  </Textfit>
                </div>
                <div className="mt-2 flex gap-1 text-gray-500">
                  <i className="bx bx-book mt-[1px] text-[16px]"></i>
                  <p className="outfit-400 text-[14px]">
                    {subject.subjectCode}
                  </p>
                  {quizState && (
                    <>
                      <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                        •
                      </span>
                      <p className="outfit-400 text-[14px]">
                        {questionCount}{" "}
                        {questionCount === 1 ? "question" : "questions"}
                      </p>
                    </>
                  )}
                </div>

                {/* Bottom left buttons */}
                {quizState && (
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <button
                      className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100"
                      onClick={handleEditClick}
                    >
                      <i className="bx bx-edit text-lg"></i>
                      <span className="outfit-500">Edit</span>
                    </button>

                    <button
                      className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50"
                      onClick={handleDeleteClick}
                    >
                      <i className="bx bx-trash text-lg"></i>
                      <span className="outfit-500">Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : quizState ? (
            <div className="flex w-full flex-col items-center md:flex-row md:flex-nowrap md:items-center">
              <div className="relative flex flex-col items-center md:mr-5">
                <img
                  src={SubPhoto}
                  alt="Subject"
                  className="border-color size-21 rounded-md border object-cover"
                />
              </div>

              <div className="outfit flex max-w-full min-w-0 flex-col flex-wrap md:max-w-[calc(100%-200px)]">
                <div className="outfit line-clamp-2">
                  <Textfit
                    mode="multi"
                    min={14}
                    max={20}
                    style={{
                      fontWeight: 600,
                      lineHeight: "1.2",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    <span className="text-[18px]">{quizState?.title}</span>
                  </Textfit>
                </div>
                <div className="mt-2 flex gap-1 text-gray-500">
                  {quizState && (
                    <>
                      <p className="outfit-400 text-[14px]">
                        {questionCount}{" "}
                        {questionCount === 1 ? "question" : "questions"}
                      </p>
                    </>
                  )}
                </div>

                {/* Bottom left buttons */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button
                    className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100"
                    onClick={handleEditClick}
                  >
                    <i className="bx bx-edit text-lg"></i>
                    <span className="outfit-500">Edit</span>
                  </button>

                  <button
                    className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50"
                    onClick={handleDeleteClick}
                  >
                    <i className="bx bx-trash text-lg"></i>
                    <span className="outfit-500">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Decorative / manage questions button if subject exists */}
          {(subject || quizState) && (
            <div className="relative mt-[51px] flex h-full flex-col">
              <div className="relative mt-2 flex items-center justify-center">
                {quizState && (
                  <button
                    className="relative z-20 mt-5 mr-15 hidden w-37 cursor-pointer rounded-xl bg-orange-500 px-5 py-2 font-semibold text-white shadow-lg transition duration-100 hover:bg-orange-600 md:block lg:w-50"
                    onClick={() => {
                      navigate("/quiz-content", { state: { quiz: quizState } });
                      window.dispatchEvent(new Event("closeSubjectSidebar"));
                    }}
                  >
                    <span className="outfit inline-flex items-center gap-2">
                      <i className="bx bxs-edit"></i>
                      <span className="outfit-500 hidden text-[14px] lg:inline">
                        Manage Questions
                      </span>
                      <span className="text-[14px] lg:hidden">Questions</span>
                    </span>
                  </button>
                )}
                {subject && !quizState && (
                  <button
                    className="relative z-20 mt-5 mr-15 hidden w-37 cursor-pointer rounded-xl bg-orange-500 px-5 py-2 font-semibold text-white shadow-lg transition duration-100 hover:bg-orange-600 md:block lg:w-50"
                    onClick={() => {
                      const user = JSON.parse(sessionStorage.getItem("user"));
                      const roleID = user?.roleID ?? user?.roleId;
                      let path =
                        "/dean/subjects?subject_id=" + subject.subjectID;
                      if (roleID === 2)
                        path =
                          "/faculty/subjects?subject_id=" + subject.subjectID;
                      else if (roleID === 3)
                        path =
                          "/program-chair/subjects?subject_id=" +
                          subject.subjectID;
                      navigate(path, { state: { subject } });
                      window.dispatchEvent(new Event("closeSubjectSidebar"));
                    }}
                  >
                    <span className="outfit inline-flex items-center gap-2">
                      <i className="bx bxs-edit"></i>
                      <span className="outfit-500 hidden text-[14px] lg:inline">
                        Manage Questions
                      </span>
                      <span className="text-[14px] lg:hidden">Questions</span>
                    </span>
                  </button>
                )}

                {/* Sparkle icon at top left outside the paper */}
                <div className="">
                  <div className="pointer-events-none absolute top-[21px] -left-18 z-20 hidden md:block lg:-left-20">
                    <i className="bx bxs-dots-vertical-rounded text-4xl text-gray-300"></i>
                  </div>
                  <div className="pointer-events-none absolute top-[48px] -left-18 z-20 hidden md:block lg:-left-20">
                    <i className="bx bxs-dots-vertical-rounded text-4xl text-gray-300"></i>
                  </div>
                  <div className="pointer-events-none absolute top-[55px] -left-24 z-20 hidden md:block lg:-left-26">
                    <div className="flex justify-center">
                      <div className="relative flex h-13 w-26 items-center justify-center rounded-t-full bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
                        {/* Boxicon upward arrow */}
                        <i className="bx bxs-arrow-big-up-line mt-6 text-4xl text-gray-300" />
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute top-[53px] -right-2 z-20 hidden md:block lg:-right-4">
                    <i className="bx bxs-stamp text-6xl text-gray-300"></i>
                  </div>

                  <div className="pointer-events-none absolute top-8 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                    <div className="relative mt-6 mr-15 h-[126px] w-57 rounded-t-md bg-white shadow-[20px_0_30px_-10px_rgba(0,0,0,0.1),-20px_0_30px_-10px_rgba(0,0,0,0.1)] lg:w-72">
                      {/* Top tab */}
                      <div className="absolute top-0 left-1/2 h-2 w-57 -translate-x-1/2 rounded-t bg-gray-300 lg:w-72" />
                      {/* Light gray document lines */}
                      <div className="absolute inset-0 space-y-3 px-6 py-7">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-3 w-full rounded bg-gray-100"
                            style={{ width: `${90 - i * 8}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {subject && (
          <div className="outfit border-color relative z-48 -mx-2 -mt-2 mb-2 flex h-[40px] items-center justify-end overflow-visible border bg-white px-4 text-[12px] font-semibold sm:mx-0 sm:rounded-b-md md:hidden">
            {quizState ? (
              <span
                onClick={() => {
                  navigate("/quiz-content", { state: { quiz: quizState } });
                  window.dispatchEvent(new Event("closeSubjectSidebar"));
                }}
                className="flex cursor-pointer items-center gap-2 text-gray-700"
              >
                View Questions
                <i className="bx bx-arrow-right-stroke text-2xl" />
              </span>
            ) : (
              <span
                onClick={() => {
                  const user = JSON.parse(sessionStorage.getItem("user"));
                  const roleID = user?.roleID ?? user?.roleId;
                  let path = "/dean/subjects?subject_id=" + subject.subjectID;
                  if (roleID === 2)
                    path = "/faculty/subjects?subject_id=" + subject.subjectID;
                  else if (roleID === 3)
                    path =
                      "/program-chair/subjects?subject_id=" + subject.subjectID;
                  navigate(path, { state: { subject } });
                  window.dispatchEvent(new Event("closeSubjectSidebar"));
                }}
                className="flex cursor-pointer items-center gap-2 text-gray-700"
              >
                View Questions
                <i className="bx bx-arrow-right-stroke text-2xl" />
              </span>
            )}
          </div>
        )}

        {(classPersonalQuizID || quizId) && (
          <QuizResultsTable
            classPersonalQuizID={classPersonalQuizID}
            personalQuizID={quizId}
          />
        )}
      </div>

      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {/* Edit Modal */}
      {showEditModal && quizState && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="animate-fade-in-up relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black">
                  Edit Quiz
                </h2>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditedQuiz({
                      title: "",
                      description: "",
                      instruction: "",
                    });
                    setValidationError("");
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Quiz Title
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter quiz title"
                        value={editedQuiz.title}
                        onChange={(e) =>
                          setEditedQuiz({
                            ...editedQuiz,
                            title: e.target.value,
                          })
                        }
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Description (Optional)
                    </span>
                    <div className="relative">
                      <textarea
                        placeholder="Enter quiz description"
                        value={editedQuiz.description}
                        onChange={(e) =>
                          setEditedQuiz({
                            ...editedQuiz,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {validationError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditedQuiz({
                        title: "",
                        description: "",
                        instruction: "",
                      });
                      setValidationError("");
                    }}
                    className="mt-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    onClick={handleSaveEdit}
                    className={`mt-2 cursor-pointer rounded-lg px-4 py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && quizToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setQuizToDelete(null);
          }}
          onConfirm={handleDeleteQuiz}
          message={
            <>
              Are you sure you want to remove{" "}
              <span className="font-bold text-red-500">
                {quizToDelete.title || "Untitled Quiz"}
              </span>
              ? Removing this quiz will also wipe out its contents.
            </>
          }
          isLoading={isDeleting}
          showCountdown={true}
          countdownSeconds={6}
          shiftHintText={undefined}
        />
      )}
    </>
  );
};

export default QuizOverview;
