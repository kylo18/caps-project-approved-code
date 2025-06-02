import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import AltButton from "../components/buttonAlt";
import SubjectCard from "../components/subjectCard";
import CombinedQuestionForm from "../components/CombinedQuestionForm";
import EditQuestionForm from "../components/EditQuestionForm";
import DuplicateQuestionForm from "../components/DuplicateQuestionForm";
import ConfirmModal from "../components/confirmModal";
import Sort from "../components/sort";
import SearchQuery from "../components/SearchQuery";
import Button from "../components/button";
import ScrollToTopButton from "../components/scrollToTopButton";
import LoadingOverlay from "../components/loadingOverlay";
import SortCustomDropdown from "../components/sortCustomDropdown";

// Main admin dashboard component for managing questions and subjects
const AdminContent = () => {
  // State for image modals and question management
  const [modalImage, setModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [pendingSort, setPendingSort] = useState("");

  // Context and state for subject and question management
  const { selectedSubject } = useOutletContext();
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

  const dropdownRef = useRef(null);

  // State for question addition
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // State for toast notifications
  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  // State for question duplication
  const [duplicatingQuestion, setDuplicatingQuestion] = useState(null);

  // Effect to handle toast auto-dismiss
  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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
    setToast({
      message: "Question is now pending for approval!",
      type: "success",
      show: true,
    });
  };

  // Function to handle question editing
  const handleEditClick = (question) => {
    setEditingQuestion(question);
  };

  // Function to handle successful question edit
  const handleEditComplete = () => {
    setEditingQuestion(null);
    fetchQuestions();
    setToast({
      message: "Question is now pending for approval!",
      type: "success",
      show: true,
    });
  };

  // Function to handle question deletion
  const handleDeleteQuestion = async (questionID) => {
    try {
      const token = localStorage.getItem("token");
      setShowConfirmModal(false);
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
      setToast({
        message: "Question deleted successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to fetch questions for selected subject
  const fetchQuestions = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoading(true);
    setQuestions([]);

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
      console.log("Fetched Questions:", data);

      // Update questions with the formatted data from backend
      setQuestions(data.data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setToast({
        message: "Failed to fetch questions. Please try again.",
        type: "error",
        show: true,
      });
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
          question.purpose_id === 1 && // 1 for practice questions
          question.status_id === 2) || // 2 is approved
        (activeTab === 1 &&
          question.purpose_id === 2 && // 2 for exam questions
          question.status_id === 2) || // 2 is approved
        (activeTab === 4 &&
          question.status_id === 1 && // 1 is pending
          (pendingSort
            ? question.purpose_id ===
              (pendingSort === "practiceQuestions" ? 1 : 2)
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
        return direction * (new Date(a.created_at) - new Date(b.created_at));
      }

      return 0;
    });

  // Function to confirm question deletion
  const confirmDelete = (questionID) => {
    setDeleteQuestionID(questionID);
    setShowConfirmModal(true);
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (submittedQuestion && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [submittedQuestion]);

  // Function to handle question approval
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
      setToast({
        message: "Question approved successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Error approving question:", error);
      setToast({
        message:
          error.message || "An error occurred while approving the question.",
        type: "error",
        show: true,
      });
    } finally {
      setIsApproving(false);
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
    setToast({
      message: "Question duplicated successfully!",
      type: "success",
      show: true,
    });
  };

  return (
    <div className="relative mt-9 flex min-h-screen w-full flex-1 flex-col justify-center py-2">
      <div className="flex-1">
        {selectedSubject ? (
          <div className="w-full py-3">
            <div className="w-full">
              <SubjectCard
                subjectName={selectedSubject.subjectName}
                subjectID={selectedSubject.subjectID}
                university="JRMSU"
                location="Dapitan City"
                imageUrl={
                  selectedSubject.imageUrl || "https://via.placeholder.com/60"
                }
                activeIndex={activeTab}
                setActiveIndex={setActiveTab}
                isLoading={isLoading}
                onFetchQuestions={fetchQuestions}
              />
            </div>
            {/*Search bar div here*/}
            <div className="mt-2 mb-4 flex flex-col justify-end gap-[5.5px] sm:flex-row">
              <SearchQuery
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <div className="flex items-center justify-end">
                {activeTab === 4 && (
                  <SortCustomDropdown
                    name="pendingSort"
                    value={pendingSort}
                    onChange={(e) => setPendingSort(e.target.value)}
                    placeholder="Filter by Type"
                    options={[
                      { value: "", label: "All Types" },
                      {
                        value: "practiceQuestions",
                        label: "Practice  ",
                      },
                      { value: "examQuestions", label: "Qualifying Exam " },
                    ]}
                    className="w-full sm:w-35"
                  />
                )}
              </div>

              <div className="flex flex-row items-center justify-center gap-2">
                <span className="text-[14px] text-nowrap text-gray-700 sm:ml-10">
                  Sort by
                </span>
                {/* Sort - takes 1/2 width on small screens */}
                <div className="-mr-8 w-full sm:w-auto sm:flex-1">
                  <Sort
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    subSortOption={subSortOption}
                    setSubSortOption={setSubSortOption}
                  />
                </div>

                {/* View Button - takes 1/2 width on small screens */}
                <div
                  ref={dropdownRef}
                  className="relative w-full text-left sm:w-auto sm:flex-1"
                >
                  <button
                    ref={buttonRef}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="border-color flex w-full cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-100 sm:w-auto"
                  >
                    <span className="mr-5 text-[14px]">View</span>
                    <i
                      className={`bx absolute right-2 text-[18px] transition-transform duration-200 ${
                        dropdownOpen
                          ? "bx-chevron-down rotate-180"
                          : "bx-chevron-down rotate-0"
                      }`}
                      style={{ marginLeft: "auto" }}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="open-sans border-color absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md border bg-white p-1 shadow-sm">
                      <button
                        onClick={() => {
                          setListViewOnly(true);
                          setExpandedQuestionId(null);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-sm px-4 py-2 text-left text-sm transition ${
                          listViewOnly
                            ? "text-orange-500 hover:bg-gray-200"
                            : "text-black hover:bg-gray-200"
                        }`}
                      >
                        <i className="bx bx-list-ul text-[18px]" />
                        <span>List View</span>
                      </button>
                      <button
                        onClick={() => {
                          setListViewOnly(false);
                          setExpandedQuestionId(null);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-sm px-4 py-2 text-left text-sm transition ${
                          !listViewOnly
                            ? "text-orange-500 hover:bg-gray-200"
                            : "text-black hover:bg-gray-200"
                        }`}
                      >
                        <i className="bx bx-detail text-[18px]" />
                        <span>Detailed View</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Question Section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Show Add Question Button Only If No Active Question */}
                {!submittedQuestion && (
                  <div className="fixed right-[-4px] bottom-[-4px] z-50 p-4 text-center">
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

                <div ref={formRef}>
                  {/* Show Combined Form */}
                  {submittedQuestion === "new" && (
                    <div className="transition-all duration-300 ease-out">
                      <CombinedQuestionForm
                        subjectID={selectedSubject.subjectID}
                        onComplete={handleQuestionAdded}
                        onCancel={() => setSubmittedQuestion(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions List */}
            {(activeTab === 0 || activeTab === 1 || activeTab === 4) && (
              <div className="flex">
                <div className="flex-1">
                  {filteredQuestions.length > 0 ? (
                    <>
                      <div className="border-color relative mx-auto flex w-full max-w-3xl items-center justify-between gap-2 rounded-t-md border border-b-0 bg-white">
                        <div className="flex items-center gap-2">
                          {/* Question Count */}
                          <div className="ml-4 text-sm font-medium text-gray-600">
                            {
                              filteredQuestions.filter(
                                (question) =>
                                  (activeTab === 4 &&
                                    question.status_id === 1) || // 1 is pending
                                  (activeTab === 0 &&
                                    question.purpose_id === 1 && // 1 for practice questions
                                    question.status_id === 2) || // 2 is approved
                                  (activeTab === 1 &&
                                    question.purpose_id === 2 && // 2 for exam questions
                                    question.status_id === 2), // 2 is approved
                              ).length
                            }{" "}
                            QUESTIONS
                          </div>
                        </div>

                        <div className="ml-auto flex items-center px-4 py-3">
                          <span className="mr-4 ml-2 items-center text-sm font-medium text-gray-500">
                            Show Answer Options
                          </span>
                          <label
                            className={`relative inline-flex cursor-pointer items-center ${
                              listViewOnly
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={showChoices}
                              onChange={() =>
                                !listViewOnly && setShowChoices(!showChoices)
                              }
                              disabled={listViewOnly}
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
                              question.purpose_id === 1 && // 1 for practice questions
                              question.status_id === 2) || // 2 is approved
                            (activeTab === 1 &&
                              question.purpose_id === 2 && // 2 for exam questions
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
                              className={`relative mx-auto w-full max-w-3xl cursor-pointer border border-[rgb(200,200,200)] bg-white p-4 shadow-md sm:px-4 ${listViewOnly && expandedQuestionId !== question.questionID ? "hover:bg-gray-100" : ""} ${
                                listViewOnly
                                  ? expandedQuestionId === question.questionID
                                    ? `rounded-sm ${index === 0 ? "" : "mt-2"} mb-2`
                                    : `${index !== filteredQuestions.length - 1 ? "border-b-0" : ""}`
                                  : `${index === 0 ? "rounded-t-none" : "rounded-t-sm"} mb-2 rounded-sm`
                              } `}
                            >
                              <div className="w-full max-w-full overflow-hidden break-words">
                                <div className="flex items-center justify-between text-[14px] text-gray-500">
                                  {/* Always show points, coverage, and difficulty in list view */}
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
                                              src={getImageUrl(question.image)}
                                              alt="Question Image"
                                              className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setModalImage(
                                                  getImageUrl(question.image),
                                                );
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="relative mt-3 inline-block max-w-[300px] rounded-md">
                                        <div className="flex flex-col items-start">
                                          <img
                                            src={getImageUrl(question.image)}
                                            alt="Question Image"
                                            className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                                            onClick={() =>
                                              setModalImage(
                                                getImageUrl(question.image),
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
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
                                        <input
                                          type="radio"
                                          name={`review-question-${question.questionID}`}
                                          value={choice.choiceText}
                                          checked={choice.isCorrect}
                                          disabled
                                          readOnly
                                          className={`size-5 cursor-not-allowed focus:ring-0 ${
                                            choice.isCorrect
                                              ? "border-orange-500 text-orange-500"
                                              : "border-gray-300 text-gray-500"
                                          }`}
                                        />

                                        {choice.choiceText?.trim() && (
                                          <span
                                            className={`w-[90%] rounded-md p-2 text-[14px] ${
                                              choice.isCorrect
                                                ? "font-semibold text-orange-500"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            {choice.choiceText}
                                          </span>
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
                                  <p className="mt-1 text-gray-500">
                                    No choices added yet.
                                  </p>
                                ))}

                              {(!listViewOnly ||
                                (listViewOnly &&
                                  expandedQuestionId ===
                                    question.questionID)) && (
                                <>
                                  <div className="mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
                                  <div className="ml-4 flex flex-col gap-1 text-[12px] text-gray-500">
                                    <div className="flex">
                                      <span className="w-[100px]">
                                        Created by:
                                      </span>
                                      <span>{question.creatorName}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="w-[100px]">
                                        Date Added:
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
                                    <div className="flex">
                                      <span className="w-[100px]">
                                        Question Type:
                                      </span>
                                      <span>
                                        {question.purpose_id === 1
                                          ? "Practice Question"
                                          : "Qualifying Exam Question"}
                                      </span>
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
                                  <div className="mt-5 mb-1 flex justify-end gap-1">
                                    {question.status_id === 1 ? ( // 1 is pending
                                      <>
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
                                          icon="bx bx-check-double"
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
                      <p className="text-center text-[16px] text-gray-500">
                        No pending questions found.
                      </p>
                    ) : (
                      <p className="mb-5 text-center text-[16px] text-gray-500">
                        No questions found.
                      </p>
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

            {activeTab === 2 && (
              <p className="text-center text-gray-500">Under Development</p>
            )}
            {activeTab === 3 && (
              <p className="text-center text-gray-500">Under Development</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Please select a subject from the sidebar.
          </p>
        )}

        {isDeleting && <LoadingOverlay show={isDeleting} />}
        {isApproving && <LoadingOverlay show={isApproving} />}

        {/* Confirmation Modals */}
        <ConfirmModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={() => {
            approveQuestion(selectedQuestionID);
            setShowApproveModal(false);
          }}
          message="Are you sure you want to approve this question?"
        />

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => handleDeleteQuestion(deleteQuestionID)}
          message="Are you sure you want to delete this question?"
        />

        {/* Image Modal (Full Size) */}
        {isChoiceModalOpen && (
          <div
            className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center"
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
            className="lightbox-bg bg-opacity-70 fixed inset-0 z-55 flex items-center justify-center hover:cursor-pointer"
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
          />
        )}
        {duplicatingQuestion && (
          <DuplicateQuestionForm
            question={duplicatingQuestion}
            onComplete={handleDuplicateComplete}
            onCancel={() => setDuplicatingQuestion(null)}
          />
        )}
        <ScrollToTopButton />
      </div>
      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
            toast.show ? "opacity-100" : "opacity-0"
          } ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-error text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-nowrap text-gray-600">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
