import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import SubjectCard from "../components/subjectCard";
import PracticeAddQuestionForm from "../components/addPracticeQuestionForm";
import PracticeAddChoiceForm from "../components/addPracticeChoiceForm";
import ExamAddQuestionForm from "../components/addExamQuestionForm";
import ExamAddChoiceForm from "../components/addExamChoiceForm";
import ConfirmModal from "../components/confirmModal";
import Sort from "../components/sort";
import SearchBar from "../components/SearchBar";
import Button from "../components/button";
import SortCustomDropdown from "../components/sortCustomDropdown";
import ScrollToTopButton from "../components/scrollToTopButton";
import LoadingOverlay from "../components/loadingOverlay";

const ProgramChairDashboard = () => {
  const [modalImage, setModalImage] = useState(null); 
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false); 
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false); 
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [pendingSort, setPendingSort] = useState(""); 
  const { selectedSubject } = useOutletContext();
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestion, setSubmittedQuestion] = useState({
    practiceQuestions: { questionID: null, questionText: '', image: null }, 
    examQuestions: { questionID: null, questionText: '', image: null }, 
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

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });
  

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
        body: JSON.stringify({questionText: editText }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update question");
      }
  
      // Update the question in the local state
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionID === questionID ? { ...q, questionText: editText } : q
        )
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
      setIsDeleting(true)

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
        prevQuestions.filter((question) => question.questionID !== questionID)
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
      setIsDeleting(false)
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
        }
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
    const matchesSearch = question.questionText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSort =
      (sortOption === "difficulty" && subSortOption ? question.difficulty === subSortOption : true) &&
      (sortOption === "coverage" && subSortOption ? question.coverage === subSortOption : true);

    const matchesTab =
      (activeTab === 0 && question.purpose === "practiceQuestions" && question.status === "approved") ||
      (activeTab === 1 && question.purpose === "examQuestions" && question.status === "approved") ||
      (activeTab === 4 && question.status === "pending" && (pendingSort ? question.purpose === pendingSort : true));

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
      [activeTab === 0 ? "practiceQuestions" : "examQuestions"]: newQuestion, // Make sure newQuestion has `image`
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
      setIsApproving(true)
  
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
      setIsApproving(false)
    }
  };

  return (
    <div className="mt-9 flex flex-col relative flex-1 justify-center min-h-screen w-full sm:p-2">
      <div className="flex-1">
        {selectedSubject ? (
          <div className="py-6 w-full">
            <div className="w-full">
              <SubjectCard
                subject={selectedSubject.subjectName}
                university="JRMSU"
                location="Dapitan City"
                imageUrl={selectedSubject.imageUrl || "https://via.placeholder.com/60"}
                activeIndex={activeTab}
                setActiveIndex={setActiveTab}
                isLoading={isLoading}
              />
            </div>
            {/*Search bar div here*/}
            <div className="flex flex-col sm:flex-row gap-[5.5px] mt-4 mb-6 justify-end">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <div className="flex justify-end items-center ">
                {activeTab === 4 && (
                    <SortCustomDropdown
                      name="pendingSort"
                      value={pendingSort}
                      onChange={(e) => setPendingSort(e.target.value)}
                      placeholder="Filter by Type"
                      options={[
                        { value: "", label: "All Types" },
                        { value: "practiceQuestions", label: "Practice Questions" },
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
            </div>

            {/* Questions List */}
            {(activeTab === 0 || activeTab === 1 || activeTab === 4) && ( // Practice Questions
              <div className="flex">
                <div className="flex-1">
                
                {filteredQuestions.length > 0 ? (
                  filteredQuestions
                  .filter((question) => 
                    // Filter by tab type and question status
                    (activeTab === 4 && question.status === "pending") || // For Pending Questions Tab
                    (activeTab === 0 && question.purpose === "practiceQuestions" && question.status === "approved") || // For Approved Practice Questions Tab
                    (activeTab === 1 && question.purpose === "examQuestions" && question.status === "approved") // For Approved Exam Questions Tab
                  )
                    .map((question, index) => (
                      <div key={`${question.id}-${index}`} >
                        <div
                          className="mb-3 w-full max-w-3xl sm:px-4 mx-auto p-4 bg-white shadow-md rounded-sm border-[rgb(200,200,200)] border relative"
                        >
                          <div className="p-2 break-words w-full overflow-hidden max-w-full">
                            <div className="flex justify-between items-center text-gray-600 text-[14px]">
                              <span>{index + 1}. Multiple Choice</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[12px] font-medium">{question.score} pt</span>
                                <span className={`text-white text-[12px] px-4 py-1 rounded-lg ${
                                    question.difficulty === "easy" ? "bg-green-500" : 
                                    question.difficulty === "moderate" ? "bg-yellow-500" : 
                                    "bg-red-500"
                                  }`}>
                                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                </span>

                                {/* Coverage Badge */}
                                <span className="text-white text-[12px] px-4 py-1 rounded-lg bg-blue-500">
                                  {question.coverage.charAt(0).toUpperCase() + question.coverage.slice(1)}
                                </span>
                              </div>
                            </div>

                            <div className="relative hover:cursor-text mt-4 p-1 bg-gray-100 rounded-sm transition-all duration-150">
                              <div
                                className=" mt-1 bg-inherit py-2 pl-3 text-[14px] w-full max-w-full border-gray-300  min-h-[40px] overflow-hidden resize-none whitespace-pre-wrap break-words word-break break-word">
                                <span>{question.questionText}</span>
                              </div>
                            </div>

                            {question.image && (
                              <div className="mt-3 relative rounded-md inline-block max-w-[300px]">
                                {/* Ensure the container grows with the image */}
                                <div className="flex flex-col items-start">
                                  <img
                                    src={question.image}
                                    alt="Question Image"
                                    className=" max-w-full h-auto rounded-sm shadow-md cursor-pointer object-contain hover:opacity-80"
                                    onClick={() => setModalImage(question.image)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Display Choices */}
                          {question.choices && question.choices.length > 0 ? (
                            <div className="mt-3 space-y-3 p-3">
                              {question.choices.map((choice, index) => (
                                <label key={index} className="flex items-center space-x-2 relative">
                                  {/* Disabled Radio Button (Unclickable) */}
                                  <input
                                    type="radio"
                                    name={`question-${question.questionID}`} // Group choices for the same question
                                    value={choice.choiceText}
                                    defaultChecked={choice.isCorrect} // Pre-select correct answer
                                    disabled // Prevent user from clicking
                                    className={`size-5 focus:ring-0 cursor-not-allowed 
                                      ${choice.isCorrect ? "text-orange-500 border-orange-500" : "text-gray-500 border-gray-300"}`}
                                  />

                                  {/* Choice text (display only if valid) */}
                                  {choice.choiceText?.trim() && (
                                    <span className={`rounded-md text-[14px] p-2 w-[90%] ${choice.isCorrect ? "text-orange-500 font-semibold" : "text-gray-700"}`}>
                                      {choice.choiceText}
                                    </span>
                                  )}

                                  {/* Show Image If Added */}
                                  {choice.image && (
                                    <div className="cursor-pointer hover:opacity-80 relative max-w-[200px]">
                                      <img
                                        src={choice.image}
                                        alt={`Choice ${index + 1}`}
                                        className="max-w-full h-auto object-cover rounded-md hover:cursor-pointer"
                                        onClick={() => {
                                          setchoiceModalImage(choice.image); 
                                          setIsChoiceModalOpen(true); 
                                        }}
                                    />
                                    </div>
                                  )}
                                </label>
                              ))}

                              
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1">No choices added yet.</p>
                          )}
                          <div className="flex justify-end m-1 mb-1 gap-2">
                            {question.status === "pending" ? (
                              <>
                                <Button
                                  text="Delete"
                                  textres="Delete"
                                  icon="bx bx-trash"
                                  onClick={() => confirmDelete(question.questionID)}
                                  className="cursor-pointer"
                                />
                                <Button
                                  text="Approve"
                                  textres="Approve"
                                  icon="bx bx-check"
                                  onClick={() => {
                                    setSelectedQuestionID(question.questionID);
                                    setShowApproveModal(true);
                                  }}
                                />
                              </>
                            ) : (
                              <Button
                                text="Delete"
                                textres="Delete"
                                icon="bx bx-trash"
                                onClick={() => confirmDelete(question.questionID)}
                                className="cursor-pointer"
                              />
                            )}
                          </div>

                        </div>
                      </div>
                    ))
                  ) : activeTab === 4 ? ( // If no pending questions
                    <p className="text-gray-500 text-center text-[16px]">No pending questions found.</p>
                  ) : (
                    <p className="text-gray-500 text-center text-[16px] mb-5">No questions found.</p>
                  )}
                  </div>
              </div>
            )}

            {/* Add Question Section */}
            {(activeTab === 0 || activeTab === 1) && (
              <div>
                {/* Show Add Question Button Only If No Active Question */}
                {!submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"] && (
                  <div className="text-center fixed bottom-0 right-0 p-4">
                    <button
                      onClick={() => {
                        setSubmittedQuestion((prev) => ({
                          ...prev,
                          [activeTab === 0 ? "practiceQuestions" : "examQuestions"]: {
                            questionText: "",
                            questionID: null,
                          },
                        }));
                      
                        setTimeout(() => {
                          formRef.current?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="text-[14px] border-[rgb(200,200,200)] hover:bg-gray-200 cursor-pointer border bg-white text-gray-700 font-semibold py-2 px-4 rounded shadow-md"
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
                  {submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"] &&
                  !submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].questionID && (
                    <>
                      <div className="text-right">
                      </div>
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
                {showChoiceForm && submittedQuestion?.[activeTab === 0 ? "practiceQuestions" : "examQuestions"]?.questionID && (
                  <div className="flex flex-col"> 
                    <div className="flex-1">
                      <div className="font-inter text-[14px] max-w-3xl mx-auto bg-white py-2 pl-4 rounded-t-md border border-b-0 border-color relative text-gray-600 font-medium">
                        <span>Add Choices</span>
                      </div>
                      <div className="mx-auto max-w-3xl w-full p-4 border border-color bg-white shadow-sm border-b-0 rounded-b-none">
                          <div className="relative hover:cursor-text p-1 bg-gray-100 rounded-md transition-all duration-150">
                            <div
                              className=" mt-1 bg-inherit py-2 pl-3 text-[14px] w-full max-w-full border-gray-300  min-h-[40px] overflow-hidden resize-none whitespace-pre-wrap break-words word-break break-word">
                              <span>{submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].questionText}</span>
                            </div>
                          </div>

                        {/* Image Preview */}
                        {submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].image && (
                          <div className="hover:opacity-80 mt-3 relative inline-block max-w-[300px]">
                            <img 
                              src={submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].image}  
                              alt="Question Image Preview"
                              className="max-w-full h-auto rounded-sm shadow-md object-contain"
                              onClick={() => setisQuestionModalOpen(true)}
                            />
                          </div>
                        )}
                        
                        {isQuestionModalOpen && (
                          <div
                            className="fixed inset-0 lightbox-bg flex items-center justify-center z-100"
                            onClick={() => setisQuestionModalOpen(false)}
                          >
                            <div className="relative max-w-full max-h-full">
                              <img
                                src={submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"].image}
                                alt="Full View"
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
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
                    submittedQuestion[activeTab === 0 ? "practiceQuestions" : "examQuestions"]?.questionID && (
                      activeTab === 0 ? (
                        <PracticeAddChoiceForm
                          questionID={submittedQuestion["practiceQuestions"]?.questionID} 
                          onComplete={handleChoicesSubmitted}
                        />
                      ) : (
                        <ExamAddChoiceForm
                          questionID={submittedQuestion["examQuestions"]?.questionID}
                          onComplete={handleChoicesSubmitted}
                        />
                      )
                    )}
                </div>

              </div>
            )}
            {activeTab === 2 && (
              <p className="text-gray-500 text-center">Under Development</p>
            )}
            {activeTab === 3 && (
              <p className="text-gray-500 text-center">Under Development</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center">Please select a subject from the sidebar.</p>
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
            className={`fixed bottom-5 left-5  px-4 py-2 rounded shadow-lg text-sm text-white z-56
            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
            ${toast.show ? "opacity-80" : "opacity-0"} transition-opacity duration-900 ease-in-out`}
          >
            {toast.message}
          </div>
        )}

        {/* Image Modal (Full Size) */}
        {isChoiceModalOpen && (
          <div
            className="fixed inset-0 lightbox-bg flex items-center justify-center z-55"
            onClick={() => setIsChoiceModalOpen(false)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={choiceModalImage}
                alt="Full View"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
              />
            </div>
          </div>
        )}

        {modalImage && (
          <div
            className="fixed inset-0 flex items-center justify-center hover:cursor-pointer lightbox-bg bg-opacity-70 z-55"
            onClick={() => setModalImage(null)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={modalImage}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
              />
            </div>
          </div>
        )}
        <ScrollToTopButton/>
      </div>
    </div>
  );
};

export default ProgramChairDashboard;
