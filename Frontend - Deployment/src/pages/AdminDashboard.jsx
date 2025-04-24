import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import SubjectCard from "../components/subjectCard";
import PracticeAddQuestionForm from "../components/addPracticeQuestionForm";
import PracticeAddChoiceForm from "../components/addPracticeChoiceForm";
import ExamAddQuestionForm from "../components/addExamQuestionForm";
import ExamAddChoiceForm from "../components/addExamChoiceForm";
import ConfirmModal from "../components/confirmModal";
import Sort from "../components/sort";
import SearchQuery from "../components/SearchQuery";
import Button from "../components/button";
import SortCustomDropdown from "../components/sortCustomDropdown";
import ScrollToTopButton from "../components/scrollToTopButton";
import LoadingOverlay from "../components/loadingOverlay";

const AdminDashboard = () => {
  const [modalImage, setModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [pendingSort, setPendingSort] = useState("");
  const { selectedSubject } = useOutletContext();
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestion, setSubmittedQuestion] = useState({
    practiceQuestions: { questionID: null, questionText: "", image: null },
    examQuestions: { questionID: null, questionText: "", image: null },
  });
  const formRef = useRef(null);

  const [showChoiceForm, setShowChoiceForm] = useState(false);

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

  const [openQuestionID, setOpenQuestionID] = useState(null);

  const toggleQuestion = (id) => {
    setOpenQuestionID((prev) => (prev === id ? null : id));
  };

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
  };

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

  useEffect(() => {
    if (selectedSubject && selectedSubject.subjectID) {
      fetchQuestions();
      setSubmittedQuestion({ practice: null, exam: null, image: null });
      setShowChoiceForm(false);
      setSearchQuery("");
      setSortOption("");
      setSubSortOption("");
    }
  }, [selectedSubject]);

  const startEditing = (question) => {
    setEditQuestionID(question.questionID);
    setEditText(question.questionText);
  };

  const cancelEdit = () => {
    setEditQuestionID(null);
    setEditText("");
  };

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
    }
  };

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

  const fetchQuestions = async () => {
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

      setQuestions(data.data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  // Filter and Sort Questions
  const filteredQuestions = questions
    .filter((question) => {
      const matchesSearch = question.questionText
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesSort =
        (sortOption === "difficulty" && subSortOption
          ? question.difficulty === subSortOption
          : true) &&
        (sortOption === "coverage" && subSortOption
          ? question.coverage === subSortOption
          : true);

      const matchesTab =
        (activeTab === 0 &&
          question.purpose === "practiceQuestions" &&
          question.status === "approved") ||
        (activeTab === 1 &&
          question.purpose === "examQuestions" &&
          question.status === "approved") ||
        (activeTab === 4 &&
          question.status === "pending" &&
          (pendingSort ? question.purpose === pendingSort : true));

      return matchesSearch && matchesSort && matchesTab;
    })
    .sort((a, b) => {
      if (sortOption === "score") {
        return subSortOption === "asc" ? a.score - b.score : b.score - a.score;
      }
      return 0;
    });

  const confirmDelete = (questionID) => {
    setDeleteQuestionID(questionID);
    setShowConfirmModal(true);
  };

  const handleQuestionAdded = (newQuestion) => {
    setSubmittedQuestion((prev) => ({
      ...prev,
      [activeTab === 0 ? "practiceQuestions" : "examQuestions"]: newQuestion,
    }));
    setShowChoiceForm(true);
  };

  const handleChoicesSubmitted = () => {
    setSubmittedQuestion((prev) => ({
      ...prev,
      [activeTab === 0 ? "practiceQuestions" : "examQuestions"]: null,
    }));
    setShowChoiceForm(false);
    fetchQuestions();
    setToast({
      message: "Question added successfully!",
      type: "success",
      show: true,
    });
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (showChoiceForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showChoiceForm]);

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

      if (!response.ok) {
        throw new Error("Failed to approve the question");
      }
      const data = await response.json();
      fetchQuestions();
      setToast({
        message: "Question approved successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Error approving question:", error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="relative mt-9 flex min-h-screen w-full flex-1 flex-col justify-center sm:p-2">
      <div className="flex-1">
        {selectedSubject ? (
          <div className="w-full py-6">
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
              />
            </div>
            {/*Search bar div here*/}
            <div className="mt-4 mb-4 flex flex-col justify-end gap-[5.5px] sm:flex-row">
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
                        label: "Practice Questions",
                      },
                      { value: "examQuestions", label: "Exam Questions" },
                    ]}
                  />
                )}
              </div>
              <Sort
                sortOption={sortOption}
                setSortOption={setSortOption}
                subSortOption={subSortOption}
                setSubSortOption={setSubSortOption}
              />
              {/* List View Button on the right */}
              <button
                onClick={() => setListViewOnly(!listViewOnly)}
                className="border-color flex h-10 w-12 cursor-pointer items-center justify-center rounded-md border bg-white text-gray-700 shadow-sm hover:bg-gray-200"
                title={listViewOnly ? "Normal View" : "List View"}
              >
                <i
                  className={`bx ${listViewOnly ? "bx-grid-small" : "bx-list-ul"} text-xl`}
                ></i>
              </button>
            </div>

            {/* Questions List */}
            {(activeTab === 0 || activeTab === 1 || activeTab === 4) && (
              <div className="flex">
                <div className="flex-1">
                  {filteredQuestions.length > 0 ? (
                    <>
                      <div className="relative mx-auto mb-3 flex w-full max-w-5xl items-center justify-between gap-2">
                        {/* Show/Hide Choices Button and Question Count on the left */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowChoices(!showChoices)}
                            className="border-color flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border bg-white text-gray-700 shadow-sm hover:bg-gray-200"
                            title={
                              showChoices ? "Hide Choices" : "Show Choices"
                            }
                          >
                            <i
                              className={`bx ${showChoices ? "bx-hide" : "bx-show"} text-xl`}
                            ></i>
                          </button>

                          {/* Question Count */}
                          <div className="text-sm font-medium text-gray-600">
                            {
                              filteredQuestions.filter(
                                (question) =>
                                  (activeTab === 4 &&
                                    question.status === "pending") ||
                                  (activeTab === 0 &&
                                    question.purpose === "practiceQuestions" &&
                                    question.status === "approved") ||
                                  (activeTab === 1 &&
                                    question.purpose === "examQuestions" &&
                                    question.status === "approved"),
                              ).length
                            }{" "}
                            Question/s
                          </div>
                        </div>
                      </div>

                      {filteredQuestions
                        .filter(
                          (question) =>
                            (activeTab === 4 &&
                              question.status === "pending") ||
                            (activeTab === 0 &&
                              question.purpose === "practiceQuestions" &&
                              question.status === "approved") ||
                            (activeTab === 1 &&
                              question.purpose === "examQuestions" &&
                              question.status === "approved"),
                        )
                        .map((question, index) => (
                          <div key={`${question.id}-${index}`}>
                            <div className="relative mx-auto mb-3 w-full max-w-5xl rounded-sm border border-[rgb(200,200,200)] bg-white p-4 shadow-md sm:px-4">
                              <div
                                className={`w-full max-w-full overflow-hidden break-words ${listViewOnly ? "p-0" : "p-2"}`}
                              >
                                <div className="flex items-center justify-between text-[14px] text-gray-600">
                                  {!listViewOnly && (
                                    <>
                                      <span>{index + 1}. Multiple Choice</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[12px] font-medium">
                                          {question.score} pt
                                        </span>
                                        <span
                                          className={`rounded-lg px-4 py-1 text-[12px] text-white ${
                                            question.difficulty === "easy"
                                              ? "bg-green-500"
                                              : question.difficulty ===
                                                  "moderate"
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                          }`}
                                        >
                                          {question.difficulty
                                            .charAt(0)
                                            .toUpperCase() +
                                            question.difficulty.slice(1)}
                                        </span>

                                        {/* Coverage Badge */}
                                        <span className="rounded-lg bg-blue-500 px-4 py-1 text-[12px] text-white">
                                          {question.coverage
                                            .charAt(0)
                                            .toUpperCase() +
                                            question.coverage.slice(1)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {listViewOnly ? (
                                  <div className="word-break break-word border-colors w-full max-w-full resize-none overflow-hidden bg-inherit text-[14px] break-words whitespace-pre-wrap">
                                    <span>{question.questionText}</span>
                                  </div>
                                ) : (
                                  <div
                                    className="relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-pointer"
                                    onClick={() =>
                                      toggleQuestion(question.questionID)
                                    }
                                  >
                                    <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                                      <span>{question.questionText}</span>
                                    </div>
                                  </div>
                                )}

                                {!listViewOnly && question.image && (
                                  <div className="relative mt-3 inline-block max-w-[300px] rounded-md">
                                    {/* Ensure the container grows with the image */}
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
                              </div>

                              {/* Display Choices */}
                              {!listViewOnly &&
                                (showChoices ? (
                                  question.choices &&
                                  question.choices.length > 0 ? (
                                    <div className="mt-3 space-y-3 p-3">
                                      {question.choices.map((choice, index) => (
                                        <label
                                          key={index}
                                          className="relative flex items-center space-x-2"
                                        >
                                          <input
                                            type="radio"
                                            name={`question-${question.questionID}`}
                                            value={choice.choiceText}
                                            defaultChecked={choice.isCorrect}
                                            disabled
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
                                            <div className="relative max-w-[200px] cursor-pointer hover:opacity-80">
                                              <img
                                                src={choice.image}
                                                alt={`Choice ${index + 1}`}
                                                className="h-auto max-w-full rounded-md object-cover hover:cursor-pointer"
                                                onClick={() => {
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
                                  )
                                ) : null)}

                              {!listViewOnly && (
                                <>
                                  <div className="mx-4 mt-4 mb-5 h-[0.5px] bg-[rgb(200,200,200)]" />
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
                                  </div>
                                </>
                              )}

                              {!listViewOnly && (
                                <div className="m-1 mb-1 flex justify-end gap-2">
                                  {question.status === "pending" ? (
                                    <>
                                      <Button
                                        text="Delete"
                                        textres="Delete"
                                        icon="bx bx-trash"
                                        onClick={() =>
                                          confirmDelete(question.questionID)
                                        }
                                        className="cursor-pointer"
                                      />
                                      <Button
                                        text="Approve"
                                        textres="Approve"
                                        icon="bx bx-check"
                                        onClick={() => {
                                          setSelectedQuestionID(
                                            question.questionID,
                                          );
                                          setShowApproveModal(true);
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <Button
                                      text="Delete"
                                      textres="Delete"
                                      icon="bx bx-trash"
                                      onClick={() =>
                                        confirmDelete(question.questionID)
                                      }
                                      className="cursor-pointer"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </>
                  ) : activeTab === 4 ? ( // If no pending questions
                    <p className="text-center text-[16px] text-gray-500">
                      No pending questions found.
                    </p>
                  ) : (
                    <p className="mb-5 text-center text-[16px] text-gray-500">
                      No questions found.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Add Question Section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Show Add Question Button Only If No Active Question */}
                {!submittedQuestion[
                  activeTab === 0 ? "practiceQuestions" : "examQuestions"
                ] && (
                  <div className="fixed right-0 bottom-0 p-4 text-center">
                    <button
                      onClick={() => {
                        setSubmittedQuestion((prev) => ({
                          ...prev,
                          [activeTab === 0
                            ? "practiceQuestions"
                            : "examQuestions"]: {
                            questionText: "",
                            questionID: null,
                          },
                        }));

                        setTimeout(() => {
                          formRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }, 100);
                      }}
                      className="cursor-pointer rounded border border-[rgb(200,200,200)] bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 shadow-md hover:bg-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <i className="bx bx-plus text-[20px]"></i>
                        <span>Add Question</span>
                      </div>
                    </button>
                  </div>
                )}

                <div ref={formRef}>
                  {/* Show AddQuestionForm based on activeTab */}
                  {submittedQuestion[
                    activeTab === 0 ? "practiceQuestions" : "examQuestions"
                  ] &&
                    !submittedQuestion[
                      activeTab === 0 ? "practiceQuestions" : "examQuestions"
                    ].questionID && (
                      <>
                        <div className="text-right"></div>
                        {activeTab === 0 ? (
                          <PracticeAddQuestionForm
                            subjectID={selectedSubject.subjectID}
                            onQuestionAdded={handleQuestionAdded}
                            onCancel={() =>
                              setSubmittedQuestion((prev) => ({
                                ...prev,
                                practiceQuestions: null,
                              }))
                            }
                            areChoicesValid={areChoicesValid}
                          />
                        ) : (
                          <ExamAddQuestionForm
                            subjectID={selectedSubject.subjectID}
                            onQuestionAdded={handleQuestionAdded}
                            onCancel={() =>
                              setSubmittedQuestion((prev) => ({
                                ...prev,
                                examQuestions: null,
                              }))
                            }
                          />
                        )}
                      </>
                    )}
                </div>

                {/* Preview */}
                {showChoiceForm &&
                  submittedQuestion?.[
                    activeTab === 0 ? "practiceQuestions" : "examQuestions"
                  ]?.questionID && (
                    <div className="flex flex-col">
                      <div className="flex-1">
                        <div className="font-inter border-color relative mx-auto max-w-3xl rounded-t-md border border-b-0 bg-white py-2 pl-4 text-[14px] font-medium text-gray-600">
                          <span>Add Choices</span>
                        </div>
                        <div className="border-color mx-auto w-full max-w-3xl rounded-b-none border border-b-0 bg-white p-4 shadow-sm">
                          <div className="relative rounded-md bg-gray-100 p-1 transition-all duration-150 hover:cursor-text">
                            <div className="word-break break-word mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words whitespace-pre-wrap">
                              <span>
                                {
                                  submittedQuestion[
                                    activeTab === 0
                                      ? "practiceQuestions"
                                      : "examQuestions"
                                  ].questionText
                                }
                              </span>
                            </div>
                          </div>

                          {/* Image Preview
                        {submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].image && (
                          <div className="hover:opacity-80 mt-3 relative inline-block max-w-[300px]">
                            <img 
                              src={submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].image}  
                              alt="Question Image Preview"
                              className="max-w-full h-auto rounded-sm shadow-md object-contain"
                              onClick={() => setisQuestionModalOpen(true)}
                            />
                          </div>
                        )}*/}

                          {isQuestionModalOpen && (
                            <div
                              className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center"
                              onClick={() => setisQuestionModalOpen(false)}
                            >
                              <div className="relative max-h-full max-w-full">
                                <img
                                  src={
                                    submittedQuestion[
                                      activeTab === 0
                                        ? "practiceQuestions"
                                        : "examQuestions"
                                    ].image
                                  }
                                  alt="Full View"
                                  className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={formRef}>
                  {showChoiceForm &&
                    submittedQuestion[
                      activeTab === 0 ? "practiceQuestions" : "examQuestions"
                    ]?.questionID &&
                    (activeTab === 0 ? (
                      <PracticeAddChoiceForm
                        questionID={
                          submittedQuestion["practiceQuestions"]?.questionID
                        }
                        onComplete={handleChoicesSubmitted}
                      />
                    ) : (
                      <ExamAddChoiceForm
                        questionID={
                          submittedQuestion["examQuestions"]?.questionID
                        }
                        onComplete={handleChoicesSubmitted}
                      />
                    ))}
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

        {toast.message && (
          <div
            className={`fixed top-5 left-1/2 z-56 rounded px-4 py-2 text-sm text-white shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} ${toast.show ? "opacity-80" : "opacity-0"} transition-opacity duration-900 ease-in-out`}
          >
            {toast.message}
          </div>
        )}

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
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default AdminDashboard;
