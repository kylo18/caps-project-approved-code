import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useParams, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subjectID = params.get("subjectID");
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
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [pendingBulkApproveIds, setPendingBulkApproveIds] = useState([]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [showChoices, setShowChoices] = useState(true);
  const [listViewOnly, setListViewOnly] = useState(false);

  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showQuestionInfoId, setShowQuestionInfoId] = useState(null);

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
  const [isBannerClosed, setIsBannerClosed] = useState(false);

  // State for multi-select
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const selectAllRef = useRef(null);

  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedQuestions([]);
    setIsMultiSelectMode(false);
  }, [activeTab]);

  // Hide mobile sidebar when banner is displayed (only on mobile)
  useEffect(() => {
    const mobileNav = document.getElementById("mobile-bottom-nav");
    if (!mobileNav) return;

    const handleResize = () => {
      const isMobile = window.innerWidth < 1025;
      if (activeTab === 4 && selectedQuestions.length > 0 && isMobile) {
        mobileNav.style.display = "none";
      } else {
        mobileNav.style.display = "";
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mobileNav.style.display = "";
    };
  }, [activeTab, selectedQuestions.length]);

  // Fetch QE enabled status and practice exam settings when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject.subjectID) {
      const fetchSubjectSettings = async () => {
        try {
          // Fetch QE status
          const qeResponse = await fetch(
            `${apiUrl}/subjects/${selectedSubject.subjectID}/exam-questions-status`,
            { headers: { } },
          );

          // Fetch practice exam settings
          const practiceResponse = await fetch(
            `${apiUrl}/practice-settings/${selectedSubject.subjectID}`,
            { headers: { } },
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
      setIsBannerClosed(false);
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
      const response = await fetch(`${apiUrl}/questions/update/${questionID}`, {
          credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      setIsDeleting(true);
      const response = await fetch(`${apiUrl}/questions/delete/${questionID}`, {
          credentials: "include",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoading(true);
    setQuestions([]);

    try {
      if (!selectedSubject || !selectedSubject.subjectID) {
        console.error("No subject selected");
        return;
      }

      const response = await fetch(
        `${apiUrl}/subjects/${selectedSubject.subjectID}/questions`,
        {
          credentials: "include",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
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

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${apiUrl}/storage/${path}`;
  };
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
      setIsApproving(true);

      const response = await fetch(`${apiUrl}/questions/${questionID}/status`, {
          credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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

  const getPendingQuestionIds = () =>
    filteredQuestions
      .filter((question) => question.status_id === 1)
      .map((question) => question.questionID);

  const approveMultipleQuestions = async (questionIDs) => {
    if (!questionIDs.length) {
      showToast("Please select questions to approve.", "error");
      return;
    }

    try {
      setIsApproving(true);

      const response = await fetch(`${apiUrl}/questions/approve-multiple`, {
          credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionIDs }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to approve the selected questions.",
        );
      }

      const summary = data.summary || {
        requested: questionIDs.length,
        approved: 0,
        skipped: 0,
      };

      fetchQuestions();
      setSelectedQuestions([]);
      setIsMultiSelectMode(false);

      if (summary.approved === summary.requested) {
        showToast(
          `${summary.approved} question${summary.approved === 1 ? "" : "s"} approved successfully!`,
          "success",
        );
      } else if (summary.approved > 0) {
        showToast(
          `${summary.approved} approved, ${summary.skipped} skipped.`,
          "info",
        );
      } else {
        showToast(
          data.message || "No questions could be approved.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error approving questions:", error);
      showToast(
        error.message ||
          "An error occurred while approving the selected questions.",
        "error",
      );
    } finally {
      setIsApproving(false);
      setShowBulkApproveModal(false);
      setPendingBulkApproveIds([]);
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

  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);

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
    <div className="relative mt-10 flex min-h-screen w-full flex-1 flex-col justify-center py-2 pb-24 md:pb-2 lg:mt-2">
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
                pendingCount={questions.filter((q) => q.status_id === 1).length}
              />

              {/* Practice Exam Disabled Banner */}
              {!isLoading &&
                !isBannerClosed &&
                !practiceExamSettings[selectedSubject?.subjectID]
                  ?.isEnabled && (
                  <div className="outfit-400 mx-0 mt-3 flex w-full items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-2 sm:mx-auto sm:max-w-[1200px] sm:rounded-xl">
                    <i className="bx bx-info-circle text-lg text-amber-600"></i>
                    <p className="flex-1 text-[13px] text-amber-800">
                      <span className="font-semibold">
                        Practice Exam is not enabled.
                      </span>{" "}
                      Students won't be able to take practice exams for this
                      subject.
                    </p>
                    <button
                      onClick={() => setIsBannerClosed(true)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 focus:outline-none"
                      title="Close"
                    >
                      <i className="bx bx-x text-xl"></i>
                    </button>
                  </div>
                )}
            </div>

            {/* Question management section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Floating action button for adding new questions */}
                {!submittedQuestion && filteredQuestions.length > 0 && (
                  <div className="fixed right-4 bottom-[110px] z-49 text-center sm:right-[-4px] sm:bottom-[4px] sm:p-4 lg:p-4">
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
                      className="cursor-pointer rounded-full bg-orange-500 px-[15px] py-[15px] text-[14px] font-semibold text-white shadow-xl hover:bg-orange-600 lg:rounded-xl lg:px-4 lg:py-2"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <i className="bx bx-plus text-[24px] lg:text-[16px]"></i>
                        <span className="outfit-400 hidden lg:block">
                          Add Question
                        </span>
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
              <div className="relative sm:mx-0">
                <div className="w-full">
                  {isLoading ? (
                    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
                      <div className="loader" />
                    </div>
                  ) : filteredQuestions.length > 0 ? (
                    <>
                      {(() => {
                        const activeQuestions = filteredQuestions.filter(
                          (question) =>
                            (activeTab === 4 && question.status_id === 1) || // 1 is pending
                            (activeTab === 0 &&
                              question.purpose_id === 2 &&
                              question.status_id === 2) || // 2 is approved
                            (activeTab === 1 &&
                              question.purpose_id === 1 &&
                              question.status_id === 2), // 2 is approved
                        );
                        const total = activeQuestions.length;
                        const counts = getDifficultyCounts(activeQuestions);
                        const easyCount = counts.easy || 0;
                        const modCount = counts.moderate || 0;
                        const hardCount = counts.hard || 0;
                        const easyPct =
                          total > 0 ? (easyCount / total) * 100 : 0;
                        const modPct = total > 0 ? (modCount / total) * 100 : 0;
                        const hardPct =
                          total > 0 ? (hardCount / total) * 100 : 0;

                        return (
                          <div className="outfit-400 border-color relative mx-0 mt-4 mb-0 flex w-full max-w-3xl flex-col border bg-white p-4 sm:mx-auto sm:mt-4 sm:rounded-xl md:mb-0 md:rounded-xl">
                            {/* Top row */}
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-1 text-[14px] font-semibold text-gray-700">
                                <span>{total}</span>
                                <span>
                                  {total === 1 ? "QUESTION" : "QUESTIONS"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="outfit-400 mr-3 text-[14px] font-medium text-gray-600">
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

                            {/* Progress bar */}
                            <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                style={{ width: `${easyPct}%` }}
                                className="bg-[#65A338] transition-all duration-500"
                              ></div>
                              <div
                                style={{ width: `${modPct}%` }}
                                className="bg-[#E68A19] transition-all duration-500"
                              ></div>
                              <div
                                style={{ width: `${hardPct}%` }}
                                className="bg-[#E14343] transition-all duration-500"
                              ></div>
                            </div>

                            {/* Bottom row */}
                            <div className="mt-3 flex items-center justify-start sm:justify-between">
                              <div className="hidden text-[12px] font-medium tracking-wide text-gray-500 uppercase sm:block">
                                Difficulty Distribution
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-600 sm:gap-5 sm:text-[12px]">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#65A338] sm:h-3 sm:w-3"></span>
                                  <span>Easy · {easyCount}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#E68A19] sm:h-3 sm:w-3"></span>
                                  <span>Moderate · {modCount}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#E14343] sm:h-3 sm:w-3"></span>
                                  <span>Hard · {hardCount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Sort controls - below the difficulty box */}
                      <div className="outfit-400 mx-0 my-3 flex w-full max-w-3xl items-center justify-between sm:mx-auto sm:my-4">
                        <div className="ml-2 flex items-center sm:ml-0">
                          {activeTab === 4 &&
                            filteredQuestions.some(
                              (q) => q.status_id === 1,
                            ) && (
                              <div className="flex items-center">
                                {isMultiSelectMode ? (
                                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[14px] text-gray-700 transition-colors hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      onChange={(e) => {
                                        const displayedIds = filteredQuestions
                                          .filter((q) => q.status_id === 1)
                                          .map((q) => q.questionID);
                                        if (e.target.checked) {
                                          setSelectedQuestions((prev) => {
                                            const set = new Set(prev);
                                            displayedIds.forEach((id) =>
                                              set.add(id),
                                            );
                                            return Array.from(set);
                                          });
                                        } else {
                                          setSelectedQuestions((prev) =>
                                            prev.filter(
                                              (id) =>
                                                !displayedIds.includes(id),
                                            ),
                                          );
                                          setIsMultiSelectMode(false);
                                        }
                                      }}
                                      checked={
                                        filteredQuestions.filter(
                                          (q) => q.status_id === 1,
                                        ).length > 0 &&
                                        filteredQuestions
                                          .filter((q) => q.status_id === 1)
                                          .every((q) =>
                                            selectedQuestions.includes(
                                              q.questionID,
                                            ),
                                          )
                                      }
                                      ref={(el) => {
                                        if (el) {
                                          const displayedIds = filteredQuestions
                                            .filter((q) => q.status_id === 1)
                                            .map((q) => q.questionID);
                                          const selectedOnPageCount =
                                            displayedIds.filter((id) =>
                                              selectedQuestions.includes(id),
                                            ).length;
                                          if (
                                            displayedIds.length === 0 ||
                                            selectedOnPageCount === 0
                                          ) {
                                            el.indeterminate = false;
                                          } else if (
                                            selectedOnPageCount ===
                                            displayedIds.length
                                          ) {
                                            el.indeterminate = false;
                                          } else {
                                            el.indeterminate = true;
                                          }
                                        }
                                      }}
                                      className="border-color h-4 w-4 cursor-pointer rounded border-orange-300 text-orange-500"
                                    />
                                    <span className="font-medium">
                                      Select All
                                    </span>
                                  </label>
                                ) : (
                                  <button
                                    onClick={() => setIsMultiSelectMode(true)}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[14px] text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <i className="bx bx-checklist text-lg"></i>
                                    <span className="font-medium">
                                      Multi-Select
                                    </span>
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end">
                          {activeTab === 4 && (
                            <SortType
                              name="pendingSort"
                              value={pendingSort}
                              onChange={(e) => setPendingSort(e.target.value)}
                              placeholder="Type"
                              options={[
                                { value: "", label: "All types" },
                                {
                                  value: "practiceQuestions",
                                  label: "Practice Exam",
                                },
                                {
                                  value: "examQuestions",
                                  label: "Qualifying Exam",
                                },
                              ]}
                              className="sm:w-35"
                            />
                          )}
                          {activeTab === 4 && (
                            <div className="mx-2 h-5 w-px bg-gray-300"></div>
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
                              onMouseEnter={() =>
                                setHoveredQuestionId(question.questionID)
                              }
                              onMouseLeave={() => setHoveredQuestionId(null)}
                              className={`border-color relative mx-auto w-full max-w-3xl cursor-pointer border bg-white p-3 sm:px-4 ${
                                listViewOnly &&
                                expandedQuestionId !== question.questionID
                                  ? ""
                                  : ""
                              } ${
                                listViewOnly
                                  ? expandedQuestionId === question.questionID
                                    ? `mt-2 mb-2 rounded-xl`
                                    : index > 0 &&
                                        filteredQuestions[index - 1]
                                          ?.questionID === expandedQuestionId
                                      ? `${
                                          index === filteredQuestions.length - 1
                                            ? "mt-2 rounded-xl"
                                            : "mt-2 rounded-t-xl"
                                        }`
                                      : index !==
                                            filteredQuestions.length - 1 &&
                                          filteredQuestions[index + 1]
                                            ?.questionID === expandedQuestionId
                                        ? `${index === 0 ? "rounded-xl" : "rounded-b-xl"}`
                                        : index === filteredQuestions.length - 1
                                          ? `${index === 0 ? "rounded-xl" : "rounded-b-xl"}`
                                          : `${index === 0 ? "rounded-t-xl" : ""}`
                                  : `mb-3 rounded-xl`
                              } `}
                            >
                              <div className="w-full max-w-full overflow-hidden break-words">
                                <div className="flex items-center justify-between text-[14px] text-gray-500">
                                  {/* Always show points, coverage, and difficulty in list view */}
                                  <div className="flex items-center gap-3">
                                    {activeTab === 4 && isMultiSelectMode && (
                                      <input
                                        type="checkbox"
                                        checked={selectedQuestions.includes(
                                          question.questionID,
                                        )}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const isCurrentlySelected =
                                            selectedQuestions.includes(
                                              question.questionID,
                                            );
                                          if (
                                            isCurrentlySelected &&
                                            selectedQuestions.length === 1
                                          ) {
                                            setSelectedQuestions([]);
                                            setIsMultiSelectMode(false);
                                          } else {
                                            setSelectedQuestions((prev) =>
                                              prev.includes(question.questionID)
                                                ? prev.filter(
                                                    (id) =>
                                                      id !==
                                                      question.questionID,
                                                  )
                                                : [
                                                    ...prev,
                                                    question.questionID,
                                                  ],
                                            );
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                      />
                                    )}
                                    <span className="outfit-700 text-[12px]">
                                      {index + 1}. MULTIPLE CHOICE
                                    </span>
                                  </div>
                                  <div className="relative flex min-h-[32px] items-center">
                                    {/* Badges */}
                                    <div
                                      className={`outfit-400 flex items-center transition-opacity duration-150 ${
                                        listViewOnly &&
                                        expandedQuestionId !==
                                          question.questionID &&
                                        hoveredQuestionId ===
                                          question.questionID
                                          ? "sm:pointer-events-none sm:absolute sm:opacity-0"
                                          : "sm:relative sm:opacity-100"
                                      }`}
                                    >
                                      <span className="rounded-lg px-2 py-1 text-[12px] capitalize">
                                        {question.difficulty?.name || "Easy"}
                                      </span>
                                      <span> •</span>
                                      <span className="rounded-lg px-2 py-1 text-[12px] capitalize">
                                        {question.coverage?.name || "Midterm"}
                                      </span>
                                      <span> •</span>
                                      <span className="rounded-lg px-2 py-1 text-[12px]">
                                        {question.score} PT
                                      </span>
                                    </div>
                                    {/* Action Buttons */}
                                    {question.status_id === 1 ? ( // 1 is pending
                                      <div
                                        className={`hidden items-center sm:flex ${
                                          listViewOnly &&
                                          expandedQuestionId !==
                                            question.questionID &&
                                          hoveredQuestionId ===
                                            question.questionID
                                            ? "sm:relative sm:opacity-100"
                                            : "sm:pointer-events-none sm:absolute sm:opacity-0"
                                        }`}
                                      >
                                        <button
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Remove"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.shiftKey) {
                                              handleDeleteQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              confirmDelete(
                                                question.questionID,
                                              );
                                            }
                                          }}
                                        >
                                          <i className="bx bx-trash text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Delete
                                          </span>
                                        </button>

                                        <button
                                          className="outfit mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Edit"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(question);
                                          }}
                                        >
                                          <i className="bx bx-edit-alt text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Edit
                                          </span>
                                        </button>
                                        <button
                                          className="outfit mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Copy"
                                          onClick={(e) => {
                                            if (e.shiftKey) {
                                              approveQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              setSelectedQuestionID(
                                                question.questionID,
                                              );
                                              setShowApproveModal(true);
                                            }
                                          }}
                                        >
                                          <i className="bx bx-checks text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Approve
                                          </span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        className={`hidden items-center transition-opacity duration-150 sm:flex ${
                                          listViewOnly &&
                                          expandedQuestionId !==
                                            question.questionID &&
                                          hoveredQuestionId ===
                                            question.questionID
                                            ? "sm:relative sm:opacity-100"
                                            : "sm:pointer-events-none sm:absolute sm:opacity-0"
                                        }`}
                                      >
                                        <button
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Remove"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.shiftKey) {
                                              handleDeleteQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              confirmDelete(
                                                question.questionID,
                                              );
                                            }
                                          }}
                                        >
                                          <i className="bx bx-trash text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Delete
                                          </span>
                                        </button>
                                        <button
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Copy"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateClick(question);
                                          }}
                                        >
                                          <i className="bx bx-copy text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Copy
                                          </span>
                                        </button>
                                        <button
                                          className="outfit mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
                                          title="Edit"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(question);
                                          }}
                                        >
                                          <i className="bx bx-edit-alt text-[16px]"></i>
                                          <span className="outfit-400 text-[12px]">
                                            Edit
                                          </span>
                                        </button>
                                      </div>
                                    )}
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
                                      <div className="word-break outfit-400 break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-200 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: question.questionText,
                                          }}
                                        ></span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="outfit-400 word-break break-word mt-4 flex w-full max-w-full cursor-pointer items-center overflow-hidden bg-inherit text-[14px] break-words whitespace-pre-wrap">
                                      <span
                                        className="ml-2 font-semibold"
                                        dangerouslySetInnerHTML={{
                                          __html: question.questionText,
                                        }}
                                      ></span>
                                      {question.image && (
                                        <img
                                          src={getImageUrl(question.image)}
                                          alt="Question"
                                          className="ml-auto h-10 w-10 rounded object-cover"
                                        />
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <div className="outfit-400 relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-pointer">
                                    <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-200 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: question.questionText,
                                        }}
                                      ></span>
                                    </div>
                                  </div>
                                )}

                                {/* Question image rendering, fixed structure */}
                                {question.image &&
                                  (listViewOnly &&
                                  expandedQuestionId === question.questionID ? (
                                    <div className="relative mt-3 ml-3 inline-block max-w-[300px] rounded-md">
                                      <div className="flex flex-col items-start">
                                        <img
                                          src={getImageUrl(question.image)}
                                          alt="Question Image"
                                          className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-lg hover:opacity-80"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setModalImage(
                                              getImageUrl(question.image),
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : !listViewOnly ? (
                                    <div className="relative mt-3 ml-3 inline-block max-w-[300px] rounded-md">
                                      <div className="flex flex-col items-start">
                                        <img
                                          src={getImageUrl(question.image)}
                                          alt="Question Image"
                                          className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-lg hover:opacity-80"
                                          onClick={() =>
                                            setModalImage(
                                              getImageUrl(question.image),
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  ) : null)}
                              </div>

                              {(!listViewOnly ||
                                (listViewOnly &&
                                  expandedQuestionId ===
                                    question.questionID)) &&
                                showChoices &&
                                (question.choices &&
                                question.choices.length > 0 ? (
                                  <div className="mt-3 space-y-3 p-3">
                                    {question.choices.map((choice, index) => (
                                      <label
                                        key={index}
                                        className="relative flex items-center space-x-2"
                                      >
                                        {/* Replace radio with checkbox icon */}
                                        <i
                                          className={`bx ${choice.isCorrect ? "bxs-check-circle text-orange-500" : "bx-circle text-gray-300"} text-[22px]`}
                                          style={{ minWidth: 22 }}
                                          title={
                                            choice.isCorrect
                                              ? "Correct answer"
                                              : ""
                                          }
                                        ></i>

                                        {choice.choiceText !== null && (
                                          <span
                                            className={`outfit-400 w-[90%] rounded-md p-2 text-[14px] ${
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
                                              src={getImageUrl(choice.image)}
                                              alt={`Choice ${index + 1}`}
                                              className={`h-auto max-w-full rounded-md border-2 object-cover hover:cursor-pointer ${
                                                choice.isCorrect
                                                  ? "border-orange-500"
                                                  : "border-transparent"
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setchoiceModalImage(
                                                  getImageUrl(choice.image),
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
                                  <p className="outfit-400 mt-1 text-gray-500">
                                    No choices added yet.
                                  </p>
                                ))}

                              {showQuestionInfoId === question.questionID &&
                                (!listViewOnly ||
                                  (listViewOnly &&
                                    expandedQuestionId ===
                                      question.questionID)) && (
                                  <>
                                    <div className="my-3 h-px bg-gray-200"></div>

                                    <div className="outfit-400 ml-4 grid grid-cols-1 gap-1 text-[12px] text-gray-500 sm:grid-cols-2">
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
                                  <div className="my-3 h-px bg-gray-200"></div>

                                  <div className="mt-4 mb-1 flex justify-end gap-1">
                                    <button
                                      type="button"
                                      className={`flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-600 transition-colors hover:bg-gray-100 ${
                                        showQuestionInfoId ===
                                        question.questionID
                                          ? "bg-gray-100"
                                          : ""
                                      }`}
                                      title="Question info"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowQuestionInfoId((prev) =>
                                          prev === question.questionID
                                            ? null
                                            : question.questionID,
                                        );
                                      }}
                                    >
                                      <i className="bx bx-info-circle text-[16px]"></i>
                                      <span className="outfit-400 text-[12px]">
                                        Info
                                      </span>
                                    </button>
                                    {question.status_id === 1 ? ( // 1 is pending
                                      <>
                                        <AltButton
                                          text="Remove"
                                          icon="bx bx-trash"
                                          className="hover:text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.shiftKey) {
                                              handleDeleteQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              confirmDelete(
                                                question.questionID,
                                              );
                                            }
                                          }}
                                        />

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
                                          text="Approve"
                                          textres="Approve"
                                          icon="bx bx-checks"
                                          className="hover:text-orange-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.shiftKey) {
                                              approveQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              setSelectedQuestionID(
                                                question.questionID,
                                              );
                                              setShowApproveModal(true);
                                            }
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <AltButton
                                          text="Remove"
                                          icon="bx bx-trash"
                                          className="hover:text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.shiftKey) {
                                              handleDeleteQuestion(
                                                question.questionID,
                                              );
                                            } else {
                                              confirmDelete(
                                                question.questionID,
                                              );
                                            }
                                          }}
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
                                          text="Edit"
                                          textres="Edit"
                                          icon="bx bx-edit-alt"
                                          className="hover:text-orange-500"
                                          onClick={() =>
                                            handleEditClick(question)
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
                      <div className="outfit-400 -mt-4 flex flex-col items-center justify-center py-10 text-center">
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
                      <div className="outfit-400 -mt-4 flex flex-col items-center justify-center py-10 text-center">
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
                          className="flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
                        >
                          <i className="bx bx-plus text-lg"></i>
                          <span className="text-[14px] font-semibold">
                            Add Question
                          </span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="outfit-400 flex items-center justify-center">
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
          shiftHintText="Hold shift when approving to skip this modal."
        />
        <ConfirmModal
          isOpen={showBulkApproveModal}
          onClose={() => {
            setShowBulkApproveModal(false);
            setPendingBulkApproveIds([]);
          }}
          onConfirm={() => approveMultipleQuestions(pendingBulkApproveIds)}
          message={`Are you sure you want to approve ${pendingBulkApproveIds.length} question${pendingBulkApproveIds.length === 1 ? "" : "s"}?`}
          isLoading={isApproving}
        />
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => handleDeleteQuestion(deleteQuestionID)}
          message="Are you sure you want to delete this question?"
          isLoading={isDeleting}
          shiftHintText="Hold shift when deleting to skip this modal."
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

        {/* Selection Overlay Banner */}
        {activeTab === 4 && selectedQuestions.length > 0 && (
          <div className="outfit-400 fixed right-0 bottom-0 left-0 z-[60] lg:bottom-5 lg:left-[220px] lg:z-50">
            <div className="px-0 lg:px-6">
              <div className="rounded-none bg-gray-800 px-5 py-4 pb-8 shadow-lg lg:rounded-xl lg:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-white">
                      {selectedQuestions.length}{" "}
                      {selectedQuestions.length === 1
                        ? "question"
                        : "questions"}{" "}
                      selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setPendingBulkApproveIds(selectedQuestions);
                        setShowBulkApproveModal(true);
                      }}
                      disabled={isApproving}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-white p-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50 md:px-4 md:py-2"
                      aria-label="Approve selected questions"
                    >
                      <i className="bx bx-check text-lg"></i>
                      <span className="hidden md:inline">Approve Selected</span>
                    </button>
                    <button
                      onClick={() => {
                        setPendingBulkApproveIds(getPendingQuestionIds());
                        setShowBulkApproveModal(true);
                      }}
                      disabled={isApproving}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-white p-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50 md:px-4 md:py-2"
                      aria-label="Approve all questions"
                    >
                      <i className="bx bx-copy-check text-lg"></i>
                      <span className="hidden md:inline">Approve All</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedQuestions([]);
                        setIsMultiSelectMode(false);
                      }}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-gray-700"
                      aria-label="Close"
                    >
                      <i className="bx bx-x text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Utility components */}
        {!isLoading && <ScrollToTopButton />}
      </div>
    </div>
  );
};

export default ProgramChairContent;
