import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import AddQuestionForm from "../components/AddQuestionForm";
import EditQuestionForm from "../components/EditQuestionForm";
import ConfirmModal from "../components/confirmModal";
import Sort from "../components/sort";
import SortType from "../components/sortType";
import ScrollToTopButton from "../components/scrollToTopButton";
import SubjectCardProgramChair from "../components/subjectCardProgramChair";
import DuplicateQuestionForm from "../components/DuplicateQuestionForm";
import AltButton from "../components/buttonAlt";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import EmptyImage from "../assets/icons/empty.png";
import Subject from "../assets/icons/papers.png";

const ProgramChairContent = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [modalImage, setModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [pendingSort, setPendingSort] = useState("");
  const { selectedSubject, setSelectedSubject } = useOutletContext();
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestion, setSubmittedQuestion] = useState(null);
  const formRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [sortOption, setSortOption] = useState("");
  const [subSortOption, setSubSortOption] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteQuestionID, setDeleteQuestionID] = useState(null);

  const [editQuestionID, setEditQuestionID] = useState(null);
  const [editText, setEditText] = useState("");

  const [areChoicesValid, setAreChoicesValid] = useState(false);
  const handleChoicesValidity = (validity) => {
    setAreChoicesValid(validity);
  };

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedQuestionID, setSelectedQuestionID] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [showChoices, setShowChoices] = useState(true);
  const [listViewOnly, setListViewOnly] = useState(false);

  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const buttonRef = useRef(null);

  // Get toast functions from hook
  const { toast, showToast } = useToast();

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [duplicatingQuestion, setDuplicatingQuestion] = useState(null);

  const [isExamQuestionsEnabled, setIsExamQuestionsEnabled] = useState({});
  const [practiceExamSettings, setPracticeExamSettings] = useState({});

  // Fetch QE enabled status and practice exam settings when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject.subjectID) {
      const fetchSubjectSettings = async () => {
        const token = localStorage.getItem("token");
        try {
          // Fetch QE status
          const qeResponse = await fetch(
            `${apiUrl}/subjects/${selectedSubject.subjectID}/exam-questions-status`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          // Fetch practice exam settings
          const practiceResponse = await fetch(
            `${apiUrl}/practice-settings/${selectedSubject.subjectID}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (qeResponse.ok) {
            const qeData = await qeResponse.json();
            console.log(
              "Fetched QE status for subject",
              selectedSubject.subjectID,
              ":",
              qeData.data?.is_enabled_for_exam_questions,
            );
            setIsExamQuestionsEnabled((prev) => ({
              ...prev,
              [selectedSubject.subjectID]:
                !!qeData.data?.is_enabled_for_exam_questions,
            }));
          }

          if (practiceResponse.ok) {
            const practiceData = await practiceResponse.json();
            console.log(
              "Fetched practice settings for subject",
              selectedSubject.subjectID,
              ":",
              practiceData.data,
            );
            setPracticeExamSettings((prev) => ({
              ...prev,
              [selectedSubject.subjectID]: practiceData.data || null,
            }));
          }
        } catch (err) {
          console.error("Error fetching subject settings:", err);
        }
      };
      fetchSubjectSettings();
    }
  }, [selectedSubject, apiUrl]);

  // Effect to fetch questions when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject.subjectID) {
      fetchQuestions();
      setSubmittedQuestion(null);
      setSearchQuery("");
      setSortOption("");
      setSubSortOption("");
    }
  }, [selectedSubject]);

  // Helper function to fix malformed image URLs
  const fixImageUrl = (url) => {
    if (!url) return "";

    // If it wrongly contains "http" inside the path
    if (url.includes("http")) {
      const parts = url.split("/http");
      if (parts.length > 1) {
        return "http" + parts[1]; // Fix the URL
      }
    }
    return url;
  };

  // Functions for question text editing
  const startEditing = (question) => {
    setEditQuestionID(question.questionID);
    setEditText(question.questionText);
  };

  const cancelEdit = () => {
    setEditQuestionID(null);
    setEditText("");
  };

  // Function to save edited question text to the server
  const saveEdit = async (questionID) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/questions/update/${questionID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionText: editText }),
      });

      if (!response.ok) {
        throw new Error("Failed to update question");
      }

      // Update the question in the local state
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionID === questionID ? { ...q, questionText: editText } : q,
        ),
      );

      cancelEdit(); // Exit edit mode
    } catch (error) {
      console.error("Error updating question:", error);
      showToast("Failed to update question. Please try again.", "error");
    }
  };

  // Function to delete a question from the server
  const handleDeleteQuestion = async (questionID) => {
    try {
      const token = localStorage.getItem("token");
      setIsDeleting(true);
      const response = await fetch(`${apiUrl}/questions/delete/${questionID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }
      setQuestions((prevQuestions) =>
        prevQuestions.filter((question) => question.questionID !== questionID),
      );
      setDeleteQuestionID(null);
      showToast("Question deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting question:", error);
      showToast("Failed to delete question. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  // Function to fetch all questions for the selected subject
  const fetchQuestions = async () => {
    setIsLoading(true);
    setQuestions([]); // 👈 Temporarily hide questions

    try {
      const token = localStorage.getItem("token");

      if (!selectedSubject || !selectedSubject.subjectID) {
        console.error("No subject selected");
        return;
      }

      const response = await fetch(
        `${apiUrl}/subjects/${selectedSubject.subjectID}/questions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();

      setQuestions(data.data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      showToast("Failed to fetch questions. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter and sort questions based on search query and active tab
  const filteredQuestions = questions
    .filter((question) => {
      const matchesSearch = question.questionText
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesTab =
        (activeTab === 0 &&
          question.purpose_id === 2 && // 1 for practice questions
          question.status_id === 2) || // 2 is approved
        (activeTab === 1 &&
          question.purpose_id === 1 && // 2 for exam questions
          question.status_id === 2) || // 2 is approved
        (activeTab === 4 &&
          question.status_id === 1 && // 1 is pending
          (pendingSort
            ? question.purpose_id ===
              (pendingSort === "practiceQuestions" ? 2 : 1)
            : true));

      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      // Helper function to determine sort direction
      const getSortDirection = (option) => {
        return option.endsWith("_desc") ? -1 : 1;
      };

      // Get the base sort option without the _desc suffix
      const baseSortOption = sortOption.replace("_desc", "");
      const direction = getSortDirection(sortOption);

      if (baseSortOption === "score") {
        return direction * ((a.score || 0) - (b.score || 0));
      }

      if (baseSortOption === "difficulty") {
        return direction * ((a.difficulty_id || 0) - (b.difficulty_id || 0));
      }

      if (baseSortOption === "coverage") {
        return direction * ((a.coverage_id || 0) - (b.coverage_id || 0));
      }

      if (baseSortOption === "date") {
        // Get the most recent date between created_at and updated_at
        const getMostRecentDate = (question) => {
          const createdDate = new Date(question.created_at);
          const updatedDate = new Date(question.updated_at);
          return updatedDate > createdDate ? updatedDate : createdDate;
        };

        const dateA = getMostRecentDate(a);
        const dateB = getMostRecentDate(b);
        return direction * (dateA - dateB);
      }

      // Default sort by updated_at timestamp (most recently updated first)
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

  // Function to show confirmation modal before deleting a question
  const confirmDelete = (questionID) => {
    setDeleteQuestionID(questionID);
    setShowConfirmModal(true);
  };

  // Function to handle successful question addition
  const handleQuestionAdded = () => {
    setSubmittedQuestion(null);
    fetchQuestions();
    showToast("Question is now pending for approval!", "success");
  };

  // Function to approve a pending question
  const approveQuestion = async (questionID) => {
    try {
      const token = localStorage.getItem("token");
      setIsApproving(true);

      const response = await fetch(`${apiUrl}/questions/${questionID}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve the question");
      }

      fetchQuestions();
      showToast("Question approved successfully!", "success");
    } catch (error) {
      console.error("Error approving question:", error);
      showToast(
        error.message || "An error occurred while approving the question.",
        "error",
      );
    } finally {
      setIsApproving(false);
      setShowApproveModal(false);
    }
  };

  // Effect to handle clicks outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    // Add event listener for clicks outside
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to start editing a question
  const handleEditClick = (question) => {
    setEditingQuestion(question);
  };

  // Function to handle successful question edit
  const handleEditComplete = () => {
    setEditingQuestion(null);
    fetchQuestions();
    showToast(
      "Question edited successfully! Now waiting for approval",
      "success",
    );
  };

  // Function to handle question duplication
  const handleDuplicateClick = (question) => {
    setDuplicatingQuestion(question);
  };

  // Function to handle successful question duplication
  const handleDuplicateComplete = () => {
    setDuplicatingQuestion(null);
    fetchQuestions();
    showToast(
      "Question copied successfully! Now waiting for approval",
      "success",
    );
  };

  // Add this new function to count questions by difficulty
  const getDifficultyCounts = (questions) => {
    return questions.reduce((acc, question) => {
      const difficulty = question.difficulty?.name?.toLowerCase() || "easy";
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});
  };

  // State for showing difficulty counter popup
  const [showDifficultyCounter, setShowDifficultyCounter] = useState(false);
  const difficultyIconRef = useRef(null);

  // Close floating counter when clicking outside
  useEffect(() => {
    if (!showDifficultyCounter) return;
    function handleClick(e) {
      if (
        difficultyIconRef.current &&
        !difficultyIconRef.current.contains(e.target)
      ) {
        setShowDifficultyCounter(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDifficultyCounter]);

  return (
    // Main container with flex layout for the entire dashboard
    <div className="relative mt-9 flex min-h-screen w-full flex-1 flex-col justify-center py-2">
      <div className="flex-1">
        {selectedSubject ? (
          // Main content area when a subject is selected
          <div className="w-full py-3">
            {/* Subject header with tabs for navigation */}
            <div className="w-full">
              <SubjectCardProgramChair
                showToast={showToast}
                subjectName={selectedSubject.subjectName}
                subjectID={selectedSubject.subjectID}
                subjectCode={selectedSubject.subjectCode}
                programID={selectedSubject.programID}
                yearLevelID={selectedSubject.yearLevelID}
                university="JRMSU"
                location="Dapitan City"
                imageUrl={
                  selectedSubject.imageUrl || "https://via.placeholder.com/60"
                }
                activeIndex={activeTab}
                setActiveIndex={setActiveTab}
                isLoading={isLoading}
                onFetchQuestions={fetchQuestions}
                programName={selectedSubject.programName}
                yearLevel={selectedSubject.yearLevel}
                setSelectedSubject={setSelectedSubject}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                practiceExamSettings={practiceExamSettings}
                setPracticeExamSettings={setPracticeExamSettings}
              />
            </div>

            {/*Search bar div here*/}
            <div className="mx-auto mb-4 flex w-full max-w-3xl flex-row justify-end gap-[5.5px]">
              {!isLoading && filteredQuestions.length > 0 && (
                <>
                  <div className="flex flex-row items-center justify-end">
                    {activeTab === 4 && (
                      <SortType
                        name="pendingSort"
                        value={pendingSort}
                        onChange={(e) => setPendingSort(e.target.value)}
                        placeholder="Type"
                        options={[
                          { value: "", label: "All Types" },
                          {
                            value: "practiceQuestions",
                            label: "Practice  ",
                          },
                          {
                            value: "examQuestions",
                            label: "Qualifying Exam ",
                          },
                        ]}
                        className="sm:w-35"
                      />
                    )}

                    {activeTab === 4 && (
                      <div className="mx-2 block h-6 w-px bg-gray-300" />
                    )}
                    <div className="w-auto">
                      <Sort
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                        subSortOption={subSortOption}
                        setSubSortOption={setSubSortOption}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Question management section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Floating action button for adding new questions */}
                {!submittedQuestion && filteredQuestions.length > 0 && (
                  <div className="fixed right-[-4px] bottom-[70px] z-49 p-4 text-center sm:right-[-4px] sm:bottom-[-4px]">
                    <button
                      onClick={() => {
                        setSubmittedQuestion("new");
                        setIsAddingQuestion(true);

                        setTimeout(() => {
                          if (formRef.current) {
                            const yOffset = -500;
                            const y =
                              formRef.current.getBoundingClientRect().top +
                              window.pageYOffset +
                              yOffset;

                            window.scrollTo({ top: y, behavior: "smooth" });
                          }
                        }, 100);
                      }}
                      className="cursor-pointer rounded-full bg-orange-500 px-[15px] py-[15px] text-[14px] font-semibold text-white shadow-lg hover:bg-orange-600 sm:rounded sm:px-4 sm:py-2"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <i className="bx bx-plus text-[24px] sm:text-[20px]"></i>
                        <span className="hidden sm:block">Add Question</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Question form container */}
                <div ref={formRef}>
                  {submittedQuestion === "new" && (
                    <div className="transition-all duration-300 ease-out">
                      <AddQuestionForm
                        subjectID={selectedSubject.subjectID}
                        onComplete={handleQuestionAdded}
                        onCancel={() => setSubmittedQuestion(null)}
                        activeTab={activeTab}
                        isExamQuestionsEnabled={
                          isExamQuestionsEnabled[selectedSubject?.subjectID]
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions display section */}
            {(activeTab === 0 || activeTab === 1 || activeTab === 4) && (
              <div className="relative -mx-2 sm:mx-0">
                <div className="w-full">
                  {isLoading ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="border-color relative mx-auto w-full max-w-3xl rounded-sm border bg-white p-4 sm:px-4"
                        >
                          {/* Header: Difficulty, Coverage, Score */}
                          <div className="flex items-center justify-between text-[14px] text-gray-500">
                            <span className="skeleton shimmer h-6 w-28 rounded bg-gray-200"></span>
                            <div className="flex items-center gap-2">
                              <span className="skeleton shimmer h-6 w-16 rounded bg-gray-200"></span>
                              <span className="skeleton shimmer h-6 w-12 rounded bg-gray-200"></span>
                              <span className="skeleton shimmer h-6 w-12 rounded bg-gray-200"></span>
                              <span className="skeleton shimmer h-6 w-10 rounded bg-gray-200"></span>
                            </div>
                          </div>
                          {/* Question text */}
                          <div className="skeleton shimmer word-break break-word mt-4 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap"></div>

                          {/* Choices */}
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
                          {/* Divider */}
                          <div className="mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
                          {/* Metadata */}
                          <div className="ml-4 grid grid-cols-1 gap-1 text-[12px] text-gray-500 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-32 rounded bg-gray-200"></span>
                              </div>
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-40 rounded bg-gray-200"></span>
                              </div>
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-32 rounded bg-gray-200"></span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-32 rounded bg-gray-200"></span>
                              </div>
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-40 rounded bg-gray-200"></span>
                              </div>
                              <div className="flex">
                                <span className="skeleton shimmer h-6 w-[100px] rounded bg-gray-200"></span>
                                <span className="skeleton shimmer ml-2 h-6 w-32 rounded bg-gray-200"></span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
                          {/* Action buttons skeleton */}
                          <div className="mt-5 mb-1 flex justify-end gap-2">
                            <span className="skeleton shimmer h-8 w-16 rounded bg-gray-200"></span>
                            <span className="skeleton shimmer h-8 w-16 rounded bg-gray-200"></span>
                            <span className="skeleton shimmer h-8 w-20 rounded bg-gray-200"></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredQuestions.length > 0 ? (
                    <>
                      {/* Questions list header with count and view options */}
                      <div className="border-color relative mx-auto -mt-1 flex w-full max-w-3xl items-center justify-between gap-2 rounded-t-2xl border border-b-0 bg-white sm:rounded-t-md">
                        <div className="flex items-center gap-2">
                          <div className="ml-4 flex items-center gap-2 text-sm font-medium text-nowrap text-gray-600">
                            <span>
                              {
                                filteredQuestions.filter(
                                  (question) =>
                                    (activeTab === 4 &&
                                      question.status_id === 1) ||
                                    (activeTab === 0 &&
                                      question.purpose_id === 2 &&
                                      question.status_id === 2) ||
                                    (activeTab === 1 &&
                                      question.purpose_id === 1 &&
                                      question.status_id === 2),
                                ).length
                              }{" "}
                              {filteredQuestions.filter(
                                (question) =>
                                  (activeTab === 4 &&
                                    question.status_id === 1) ||
                                  (activeTab === 0 &&
                                    question.purpose_id === 2 &&
                                    question.status_id === 2) ||
                                  (activeTab === 1 &&
                                    question.purpose_id === 1 &&
                                    question.status_id === 2),
                              ).length === 1
                                ? "QUESTION"
                                : "QUESTIONS"}
                            </span>
                            <span
                              ref={difficultyIconRef}
                              className="open-sans relative flex items-center"
                            >
                              <i
                                className="bx bx-chevron-right cursor-pointer text-2xl text-gray-400 hover:text-orange-500"
                                title="Show difficulty counter"
                                onClick={() =>
                                  setShowDifficultyCounter((v) => !v)
                                }
                              ></i>
                              {showDifficultyCounter && (
                                <div className="open-sans fade-in absolute left-33 z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-4 py-[14px] shadow-md">
                                  <div className="mb-3 text-center text-xs font-semibold text-gray-700">
                                    Difficulty Count
                                  </div>
                                  {(() => {
                                    const counts = getDifficultyCounts(
                                      filteredQuestions.filter(
                                        (question) =>
                                          (activeTab === 4 &&
                                            question.status_id === 1) ||
                                          (activeTab === 0 &&
                                            question.purpose_id === 2 &&
                                            question.status_id === 2) ||
                                          (activeTab === 1 &&
                                            question.purpose_id === 1 &&
                                            question.status_id === 2),
                                      ),
                                    );
                                    return (
                                      <div className="flex flex-col gap-2 text-xs text-gray-700">
                                        <span className="rounded bg-white py-1 font-semibold">
                                          Easy: {counts.easy || 0}
                                        </span>
                                        <span className="rounded bg-white py-1 font-semibold">
                                          Moderate: {counts.moderate || 0}
                                        </span>
                                        <span className="rounded bg-white py-1 font-semibold">
                                          Hard: {counts.hard || 0}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center px-4 py-3">
                          <span className="mr-4 ml-2 items-center text-sm font-medium text-nowrap text-gray-500">
                            Show Details
                          </span>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={!listViewOnly}
                              onChange={() => {
                                setListViewOnly((prev) => !prev);
                                setExpandedQuestionId(null); // Reset expanded state when switching view
                              }}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                      </div>

                      {/* Questions list - renders each question card */}
                      {filteredQuestions
                        .filter(
                          (question) =>
                            (activeTab === 4 && question.status_id === 1) ||
                            (activeTab === 0 &&
                              question.purpose_id === 2 &&
                              question.status_id === 2) ||
                            (activeTab === 1 &&
                              question.purpose_id === 1 &&
                              question.status_id === 2),
                        )
                        .map((question, index) => (
                          // Individual question card with content and actions
                          <div key={`${question.id}-${index}`}>
                            <div
                              onClick={() => {
                                if (
                                  listViewOnly &&
                                  expandedQuestionId !== question.questionID
                                ) {
                                  setExpandedQuestionId(question.questionID);
                                }
                              }}
                              className={`border-color relative mx-auto w-full max-w-3xl cursor-pointer border bg-white p-4 shadow-md sm:px-4 ${listViewOnly && expandedQuestionId !== question.questionID ? "hover:bg-gray-100" : ""} ${
                                listViewOnly
                                  ? expandedQuestionId === question.questionID
                                    ? `rounded-sm ${index === 0 ? "" : "mt-2"} mb-2`
                                    : `${index !== filteredQuestions.length - 1 ? "border-b-0" : ""}`
                                  : `${index === 0 ? "rounded-t-none" : "rounded-t-sm"} mb-2 rounded-sm`
                              } `}
                            >
                              <div className="w-full max-w-full overflow-hidden break-words">
                                <div className="flex items-center justify-between text-[14px] text-gray-500">
                                  <span>{index + 1}. Multiple Choice</span>
                                  <div className="flex items-center">
                                    <span className="rounded-lg px-2 py-1 text-[13px] font-medium capitalize">
                                      {question.difficulty?.name || "Easy"}
                                    </span>
                                    <span> •</span>
                                    {/* Coverage Badge */}
                                    <span className="rounded-lg px-2 py-1 text-[13px] font-medium capitalize">
                                      {question.coverage?.name || "Midterm"}
                                    </span>
                                    <span className="border-color ml-2 rounded-full border px-3 py-1 text-[13px] font-medium">
                                      {question.score} pt
                                    </span>
                                  </div>
                                </div>

                                {listViewOnly ? (
                                  expandedQuestionId === question.questionID ? (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedQuestionId(null);
                                      }}
                                      className="relative mt-4 cursor-pointer rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:bg-gray-200"
                                    >
                                      <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: question.questionText,
                                          }}
                                        ></span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="word-break break-word mt-4 w-full max-w-full cursor-pointer overflow-hidden bg-inherit text-[14px] break-words whitespace-pre-wrap">
                                      <span
                                        className="ml-2 font-semibold"
                                        dangerouslySetInnerHTML={{
                                          __html: question.questionText,
                                        }}
                                      ></span>
                                    </div>
                                  )
                                ) : (
                                  <div className="relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-pointer">
                                    <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: question.questionText,
                                        }}
                                      ></span>
                                    </div>
                                  </div>
                                )}

                                {question.image && (
                                  <>
                                    {listViewOnly ? (
                                      expandedQuestionId ===
                                        question.questionID && (
                                        <div className="relative mt-3 inline-block max-w-[300px] rounded-md">
                                          <div className="flex flex-col items-start">
                                            <img
                                              src={question.image}
                                              alt="Question Image"
                                              className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setModalImage(question.image);
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="relative mt-3 inline-block max-w-[300px] rounded-md">
                                        <div className="flex flex-col items-start">
                                          <img
                                            src={question.image}
                                            alt="Question Image"
                                            className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                                            onClick={() =>
                                              setModalImage(question.image)
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {(!listViewOnly ||
                                (listViewOnly &&
                                  expandedQuestionId ===
                                    question.questionID)) &&
                                (question.choices &&
                                question.choices.length > 0 ? (
                                  <div className="mt-3 space-y-3 p-3">
                                    {question.choices.map((choice, index) => (
                                      <label
                                        key={index}
                                        className="relative flex items-center space-x-2"
                                      >
                                        {/* Replace radio with circle icon */}
                                        <i
                                          className={`bx ${choice.isCorrect ? "bxs-check-circle text-orange-500" : "bx-circle text-gray-300"} text-[22px]`}
                                          style={{ minWidth: 22 }}
                                          title={
                                            choice.isCorrect
                                              ? "Correct answer"
                                              : ""
                                          }
                                        ></i>
                                        {choice.choiceText !== null &&
                                          choice.choiceText !== undefined &&
                                          choice.choiceText !== "" && (
                                            <span
                                              className={`w-[90%] rounded-md p-2 text-[14px] ${
                                                choice.isCorrect
                                                  ? "font-semibold text-orange-500"
                                                  : "text-gray-700"
                                              }`}
                                              dangerouslySetInnerHTML={{
                                                __html: choice.choiceText,
                                              }}
                                            />
                                          )}
                                        {choice.image && (
                                          <div className="relative max-w-[200px] cursor-pointer rounded-md hover:opacity-80">
                                            <img
                                              src={choice.image}
                                              alt={`Choice ${index + 1}`}
                                              className={`h-auto max-w-full rounded-md border-2 object-cover hover:cursor-pointer ${
                                                choice.isCorrect
                                                  ? "border-orange-500"
                                                  : "border-transparent"
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setchoiceModalImage(
                                                  choice.image,
                                                );
                                                setIsChoiceModalOpen(true);
                                              }}
                                            />
                                          </div>
                                        )}
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-gray-500">
                                    No choices added yet.
                                  </p>
                                ))}

                              {(!listViewOnly ||
                                (listViewOnly &&
                                  expandedQuestionId ===
                                    question.questionID)) && (
                                <>
                                  <div className="mx-4 mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
                                  <div className="ml-4 grid grid-cols-1 gap-1 text-[12px] text-gray-500 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex">
                                        <span className="w-[100px]">
                                          Created by:
                                        </span>
                                        <span>{question.creatorName}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="w-[100px]">
                                          Date Created:
                                        </span>
                                        <span>
                                          {new Date(
                                            question.created_at,
                                          ).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex sm:col-span-2">
                                        <span className="w-[100px]">
                                          Question Type:
                                        </span>
                                        <span>
                                          {question.purpose_id === 2
                                            ? "Practice Question"
                                            : "Qualifying Exam Question"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex">
                                        <span className="w-[100px]">
                                          Modified by:
                                        </span>
                                        <span>
                                          {question.editor
                                            ? `${question.editor.firstName} ${question.editor.lastName}`
                                            : "Not modified"}
                                        </span>
                                      </div>
                                      <div className="flex">
                                        <span className="w-[100px]">
                                          Date Modified:
                                        </span>
                                        <span>
                                          {new Date(
                                            question.updated_at,
                                          ).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </span>
                                      </div>
                                      {question.approver && (
                                        <div className="flex sm:col-span-2">
                                          <span className="w-[100px]">
                                            Approved by:
                                          </span>
                                          <span>
                                            {question.approver.firstName &&
                                            question.approver.lastName
                                              ? `${question.approver.firstName} ${question.approver.lastName}`
                                              : "Not approved"}
                                          </span>
                                        </div>
                                      )}{" "}
                                    </div>
                                  </div>
                                </>
                              )}

                              {(!listViewOnly ||
                                (listViewOnly &&
                                  expandedQuestionId ===
                                    question.questionID)) && (
                                <>
                                  <div className="mt-5 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />

                                  <div className="mt-5 mb-1 flex justify-end gap-2">
                                    {question.status_id === 1 ? (
                                      <>
                                        <AltButton
                                          text="Edit"
                                          textres="Edit"
                                          icon="bx bx-edit-alt"
                                          className="hover:text-orange-500"
                                          onClick={() =>
                                            handleEditClick(question)
                                          }
                                        />
                                        <AltButton
                                          text="Remove"
                                          icon="bx bx-trash"
                                          className="hover:text-red-500"
                                          onClick={() =>
                                            confirmDelete(question.questionID)
                                          }
                                        />
                                        <AltButton
                                          text="Approve"
                                          icon="bx bx-checks"
                                          className="hover:text-orange-500"
                                          onClick={() => {
                                            setSelectedQuestionID(
                                              question.questionID,
                                            );
                                            setShowApproveModal(true);
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <AltButton
                                          text="Edit"
                                          textres="Edit"
                                          icon="bx bx-edit-alt"
                                          className="hover:text-orange-500"
                                          onClick={() =>
                                            handleEditClick(question)
                                          }
                                        />
                                        <AltButton
                                          text="Copy"
                                          icon="bx bx-copy"
                                          className="hover:text-orange-500"
                                          onClick={() =>
                                            handleDuplicateClick(question)
                                          }
                                        />
                                        <AltButton
                                          text="Remove"
                                          icon="bx bx-trash"
                                          className="hover:text-red-500"
                                          onClick={() =>
                                            confirmDelete(question.questionID)
                                          }
                                        />
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                    </>
                  ) : !isLoading ? (
                    activeTab === 4 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <img
                          src={EmptyImage}
                          alt="No pending questions"
                          className="h-32 w-32 opacity-80"
                        />
                        <span className="mt-4 text-[15px] text-gray-500">
                          No pending questions found
                        </span>
                        <span className="text-[13px] text-gray-400">
                          Questions awaiting approval will appear here
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <img
                          src={EmptyImage}
                          alt="No questions"
                          className="h-32 w-32 opacity-80"
                        />
                        <span className="mt-4 text-[14px] text-gray-600">
                          No questions added yet
                        </span>
                        <span className="mb-6 text-[12px] text-gray-400">
                          Start building your question bank
                        </span>
                        <button
                          onClick={() => {
                            setSubmittedQuestion("new");
                            setIsAddingQuestion(true);
                            setTimeout(() => {
                              if (formRef.current) {
                                const yOffset = -500;
                                const y =
                                  formRef.current.getBoundingClientRect().top +
                                  window.pageYOffset +
                                  yOffset;
                                window.scrollTo({ top: y, behavior: "smooth" });
                              }
                            }, 100);
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
                        >
                          <i className="bx bx-plus text-lg"></i>
                          <span className="text-[14px] font-semibold">
                            Add Question
                          </span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center">
                      <p className="text-center text-[16px] text-gray-500">
                        Loading questions...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // No subject selected state
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <img
              src={Subject}
              alt="No pending questions"
              className="h-32 w-32 opacity-80"
            />
            <span className="mt-4 text-[15px] text-gray-500">
              Select a Subject
            </span>
            <span className="w-60 text-[13px] text-gray-400">
              To select a subject, press the subject icon on the navigation bar
            </span>
          </div>
        )}

        {/* Modal components for user confirmations */}
        <ConfirmModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={() => {
            approveQuestion(selectedQuestionID);
          }}
          message="Are you sure you want to approve this question?"
          isLoading={isApproving}
        />
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => handleDeleteQuestion(deleteQuestionID)}
          message="Are you sure you want to delete this question?"
          isLoading={isDeleting}
        />

        {/* Toast notification system */}
        <Toast message={toast.message} type={toast.type} show={toast.show} />

        {/* Image preview modals for question and choice images */}
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
        {modalImage && (
          <div
            className="lightbox-bg-image bg-opacity-70 fixed inset-0 z-55 flex items-center justify-center hover:cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <div className="relative max-h-full max-w-full">
              <img
                src={modalImage}
                className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
              />
            </div>
          </div>
        )}

        {/* Question editing modal */}
        {editingQuestion && (
          <EditQuestionForm
            question={editingQuestion}
            onComplete={handleEditComplete}
            onCancel={() => setEditingQuestion(null)}
            isExamQuestionsEnabled={
              isExamQuestionsEnabled[selectedSubject?.subjectID]
            }
          />
        )}

        {/* DuplicateQuestionForm component */}
        {duplicatingQuestion && (
          <DuplicateQuestionForm
            question={duplicatingQuestion}
            onComplete={handleDuplicateComplete}
            onCancel={() => setDuplicatingQuestion(null)}
            isExamQuestionsEnabled={
              isExamQuestionsEnabled[selectedSubject?.subjectID]
            }
          />
        )}

        {/* Utility components */}
        {!isLoading && <ScrollToTopButton />}
      </div>
    </div>
  );
};

export default ProgramChairContent;
