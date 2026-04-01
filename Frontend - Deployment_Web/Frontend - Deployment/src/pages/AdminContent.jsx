import React, { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext, useLocation } from "react-router-dom";
import AltButton from "../components/buttonAlt";
import SubjectCard from "../components/subjectCard";
import AddQuestionForm from "../components/AddQuestionForm";
import EditQuestionForm from "../components/EditQuestionForm";
import DuplicateQuestionForm from "../components/DuplicateQuestionForm";
import ConfirmModal from "../components/confirmModal";
import Sort from "../components/sort";
import ScrollToTopButton from "../components/scrollToTopButton";
import SortType from "../components/sortType";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import EmptyImage from "../assets/icons/empty.png";
import Subject from "../assets/icons/papers.png";

// Main admin dashboard component for managing questions and subjects
const AdminContent = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subjectID = params.get("subjectID");
  // State for image modals and question management
  const [modalImage, setModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [pendingSort, setPendingSort] = useState("");

  // Context and state for subject and question management
  const { selectedSubject, setSelectedSubject } = useOutletContext();
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestion, setSubmittedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Refs for form and UI elements
  const formRef = useRef(null);

  // State for search and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [subSortOption, setSubSortOption] = useState("");

  // State for modals and confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteQuestionID, setDeleteQuestionID] = useState(null);

  const [editText, setEditText] = useState("");

  // State for form validation
  const [areChoicesValid, setAreChoicesValid] = useState(false);
  const handleChoicesValidity = (validity) => {
    setAreChoicesValid(validity);
  };
  const buttonRef = useRef(null);

  // State for approval modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedQuestionID, setSelectedQuestionID] = useState(null);

  // State for loading and actions
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // State for view preferences
  const [showChoices, setShowChoices] = useState(true);
  const [listViewOnly, setListViewOnly] = useState(false);

  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showQuestionInfoId, setShowQuestionInfoId] = useState(null);

  const dropdownRef = useRef(null);

  // State for question addition
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Use the toast hook
  const { toast, showToast } = useToast();

  // State for question duplication
  const [duplicatingQuestion, setDuplicatingQuestion] = useState(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // State for exam questions availability
  const [isExamQuestionsEnabled, setIsExamQuestionsEnabled] = useState({});
  const [practiceExamSettings, setPracticeExamSettings] = useState({});

  // Fetch QE enabled status and practice exam settings when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject.subjectID) {
      const fetchSubjectSettings = async () => {
        const token = sessionStorage.getItem("token");
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

  // Function to handle successful question addition
  const handleQuestionAdded = () => {
    setSubmittedQuestion(null);
    fetchQuestions();
    showToast("Question is now pending for approval!", "success");
  };

  // Function to handle question editing
  const handleEditClick = (question) => {
    setEditingQuestion(question);
  };

  // Function to handle successful question edit
  const handleEditComplete = () => {
    setEditingQuestion(null);
    fetchQuestions();
    showToast("Question is now pending for approval!", "success");
  };

  // Function to handle question deletion
  const handleDeleteQuestion = async (questionID) => {
    try {
      const token = sessionStorage.getItem("token");
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
      showToast("Failed to delete question", "error");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  // Function to fetch questions for selected subject
  const fetchQuestions = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoading(true);
    setQuestions([]);

    try {
      const token = sessionStorage.getItem("token");

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

      // Update questions with the formatted data from backend
      setQuestions(data.data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      showToast("Failed to fetch questions. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter and sort questions based on criteria
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

  // Function to confirm question deletion
  const confirmDelete = (questionID) => {
    setDeleteQuestionID(questionID);
    setShowConfirmModal(true);
  };

  useEffect(() => {
    if (submittedQuestion && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [submittedQuestion]);

  // Function to handle question approval
  const approveQuestion = async (questionID) => {
    try {
      const token = sessionStorage.getItem("token");
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

  useEffect(() => {
    if (listViewOnly) {
      setShowChoices(true);
    }
  }, [listViewOnly]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Add this helper function at the top of the component
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${apiUrl}/storage/${path}`;
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
      "Question copied successfully! now waiting for approval",
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

  // Add hoveredQuestionId state at the top of the component
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);

  return (
    <div className="relative mt-10 flex min-h-screen w-full flex-1 flex-col justify-center py-2 pb-24 md:mt-2 md:pb-2">
      <div className="flex-1">
        {selectedSubject ? (
          <div className="w-full py-3">
            <div className="w-full">
              <SubjectCard
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
                isExamQuestionsEnabled={
                  isExamQuestionsEnabled[selectedSubject?.subjectID]
                }
                setIsExamQuestionsEnabled={(value) => {
                  setIsExamQuestionsEnabled((prev) => ({
                    ...prev,
                    [selectedSubject?.subjectID]: value,
                  }));
                }}
              />
              {/* Desktop Sort controls (tabs are rendered inside SubjectCard now) */}
              {!isLoading && (
                <div className="outfit-400 mx-auto max-w-3xl md:mt-4">
                  <div className="flex w-full items-center justify-end">
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
              )}
            </div>
            {/* Add Question Section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Show Add Question Button Only If No Active Question and There Are Questions */}
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

                <div ref={formRef}>
                  {/* Show Combined Form */}
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

            {/* Questions List */}
            {(activeTab === 0 || activeTab === 1 || activeTab === 4) && (
              <div className="relative sm:mx-0">
                <div className="w-full">
                  {isLoading ? (
                    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
                      <div className="loader" />
                    </div>
                  ) : filteredQuestions.length > 0 ? (
                    <>
                      <div className="outfit-400 relative mx-0 mt-3 flex w-full max-w-3xl flex-row items-center rounded-t-3xl border border-b-0 border-gray-200 bg-white sm:mx-auto sm:mt-[2px] sm:rounded-t-xl md:rounded-t-xl">
                        <div className="flex h-full items-center gap-2 px-4 py-2">
                          {/* Question Count */}
                          <div className="outfit-400 flex items-center justify-center gap-2 text-[14px] text-nowrap text-gray-600">
                            <span>
                              {
                                filteredQuestions.filter(
                                  (question) =>
                                    (activeTab === 4 &&
                                      question.status_id === 1) || // 1 is pending
                                    (activeTab === 0 &&
                                      question.purpose_id === 2 && // 1 for practice questions
                                      question.status_id === 2) || // 2 is approved
                                    (activeTab === 1 &&
                                      question.purpose_id === 1 && // 2 for exam questions
                                      question.status_id === 2), // 2 is approved
                                ).length
                              }{" "}
                              {filteredQuestions.filter(
                                (question) =>
                                  (activeTab === 4 &&
                                    question.status_id === 1) || // 1 is pending
                                  (activeTab === 0 &&
                                    question.purpose_id === 2 && // 1 for practice questions
                                    question.status_id === 2) || // 2 is approved
                                  (activeTab === 1 &&
                                    question.purpose_id === 1 && // 2 for exam questions
                                    question.status_id === 2), // 2 is approved
                              ).length === 1
                                ? "QUESTION"
                                : "QUESTIONS"}
                            </span>
                            <span
                              ref={difficultyIconRef}
                              className="outfit-400 relative flex items-center"
                            >
                              <i
                                className="bx bx-chevron-right cursor-pointer text-2xl text-gray-400 hover:text-gray-500"
                                title="Show difficulty counter"
                                onClick={() =>
                                  setShowDifficultyCounter((v) => !v)
                                }
                              ></i>
                              {showDifficultyCounter && (
                                <div className="fade-in outfit-400 absolute left-33 z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-4 py-[14px] shadow-md">
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
                          <span className="outfit-400 mr-4 ml-2 items-center text-sm text-nowrap text-gray-500">
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

                      {filteredQuestions
                        .filter(
                          (question) =>
                            (activeTab === 4 && question.status_id === 1) || // 1 is pending
                            (activeTab === 0 &&
                              question.purpose_id === 2 && // 1 for practice questions
                              question.status_id === 2) || // 2 is approved
                            (activeTab === 1 &&
                              question.purpose_id === 1 && // 2 for exam questions
                              question.status_id === 2), // 2 is approved
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
                                    ? `${index === 0 ? "rounded-b-xl" : "mt-2 mb-2 rounded-xl"}`
                                    : index > 0 &&
                                        filteredQuestions[index - 1]
                                          ?.questionID === expandedQuestionId
                                      ? `${
                                          index === filteredQuestions.length - 1
                                            ? "mt-2 rounded-t-xl rounded-b-xl"
                                            : index === 1 &&
                                                filteredQuestions[0]
                                                  ?.questionID ===
                                                  expandedQuestionId
                                              ? "mt-2 rounded-t-xl"
                                              : "rounded-t-xl"
                                        }`
                                      : index !==
                                            filteredQuestions.length - 1 &&
                                          filteredQuestions[index + 1]
                                            ?.questionID === expandedQuestionId
                                        ? "rounded-b-xl"
                                        : index === filteredQuestions.length - 1
                                          ? "rounded-b-xl"
                                          : ""
                                  : `${index === 0 ? "rounded-t-none" : "rounded-t-xl"} mb-2 rounded-xl`
                              } `}
                            >
                              <div className="w-full max-w-full overflow-hidden break-words">
                                <div className="flex items-center justify-between text-[14px] text-gray-500">
                                  {/* Always show points, coverage, and difficulty in list view */}
                                  <span className="outfit-400 text-[12px]">
                                    {index + 1}. MULTIPLE CHOICE
                                  </span>
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
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
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
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
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
                                          className="outfit-400 mx-1 flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-[6px] text-gray-700 transition-colors hover:bg-gray-100"
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

                              {/* Display Choices */}
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

        {/* Confirmation Modals */}
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
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => handleDeleteQuestion(deleteQuestionID)}
          message="Are you sure you want to delete this question?"
          isLoading={isDeleting}
          shiftHintText="Hold shift when deleting to skip this modal."
        />

        {/* Image Modal (Full Size) */}
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
      </div>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {!isLoading && <ScrollToTopButton />}
    </div>
  );
};

export default AdminContent;
