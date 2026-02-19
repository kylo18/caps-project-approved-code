import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/confirmModal";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";
import StudentPfp from "/src/assets/symbols/student.png";

const ClassContent = () => {
  const navigate = useNavigate();
  const { classID } = useParams();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Assign Quizzes states
  const [isAssignQuizzesModalOpen, setIsAssignQuizzesModalOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [quizSearchTerm, setQuizSearchTerm] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizStartDate, setQuizStartDate] = useState("");
  const [quizDeadlineDate, setQuizDeadlineDate] = useState("");
  const [isAssigningQuiz, setIsAssigningQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'quizzes'
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [isAssignedLoading, setIsAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState(null);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [quizToUnassign, setQuizToUnassign] = useState(null);
  const [isUnassigningQuiz, setIsUnassigningQuiz] = useState(false);
  const [selectedAssignedQuizIds, setSelectedAssignedQuizIds] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [isQuizResultsLoading, setIsQuizResultsLoading] = useState(false);
  const [quizResultsError, setQuizResultsError] = useState(null);
  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
  const [quizToEditDates, setQuizToEditDates] = useState(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editDeadlineDate, setEditDeadlineDate] = useState("");
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);

  // Fetch class students on component mount
  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!classID) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const response = await fetch(`${apiUrl}/classes/${classID}/students`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }

          let errorMessage = "Failed to load class students.";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData?.message || errorData?.error || errorMessage;
          } catch (parseError) {
            errorMessage = `HTTP error! Status: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch class students");
        }

        setClassInfo(data.class);
        setStudents(data.students || []);
      } catch (err) {
        setError(err.message || "Failed to load class students. Please try again.");
        console.error("Error loading class students:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassStudents();
  }, [classID, apiUrl]);


  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      student.firstName?.toLowerCase().includes(term) ||
      student.lastName?.toLowerCase().includes(term) ||
      student.userCode?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.program?.toLowerCase().includes(term)
    );
  });

  // Refresh students list
  const refreshStudents = () => {
    const fetchClassStudents = async () => {
      if (!classID) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          return;
        }

        const response = await fetch(`${apiUrl}/classes/${classID}/students`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setClassInfo(data.class);
            setStudents(data.students || []);
          }
        }
      } catch (err) {
        console.error("Error refreshing students:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassStudents();
  };

  const handleRemoveClick = (student, e) => {
    e.stopPropagation();
    setRemovingStudent(student);
    setIsRemoveModalOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!removingStudent || !classID) return;

    setIsRemoving(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsRemoving(false);
        setIsRemoveModalOpen(false);
        setRemovingStudent(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/remove-student`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          studentID: removingStudent.studentID,
        }),
      });

      if (!response.ok) {
        let message = "There was a problem removing the student. Please try again.";

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

      if (data.success) {
        showToast(
          data.message || "Student removed from class successfully.",
          "success"
        );
        // Refresh the students list
        refreshStudents();
      } else {
        showToast(
          data.message || "Failed to remove student. Please try again.",
          "error"
        );
      }
    } catch (err) {
      showToast(
        err.message || "There was a problem removing the student. Please try again.",
        "error"
      );
    } finally {
      setIsRemoving(false);
      setIsRemoveModalOpen(false);
      setRemovingStudent(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not set";
    }
  };

  // Fetch available quizzes for this class
  const fetchQuizzes = async () => {
    if (!classID) {
      setQuizError("No class information available.");
      return;
    }

    setIsQuizzesLoading(true);
    setQuizError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/classes/${classID}/quizzes/available`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load quizzes.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP error! Status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch available quizzes");
      }

      if (!Array.isArray(data.quizzes)) {
        console.error("Unexpected quizzes data format:", data);
        throw new Error("Invalid response format.");
      }

      // Backend already filters out archived and already-assigned quizzes,
      // and includes both subject-based (matching this class) and custom quizzes.
      setQuizzes(data.quizzes);
    } catch (err) {
      setQuizError(
        err.message || "Failed to load available quizzes. Please try again."
      );
      console.error("Error loading available quizzes:", err);
    } finally {
      setIsQuizzesLoading(false);
    }
  };

  // Fetch quizzes already assigned to this class
  const fetchAssignedQuizzes = async () => {
    if (!classID) return;

    setIsAssignedLoading(true);
    setAssignedError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/quizzes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load assigned quizzes.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
        } catch {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch assigned quizzes");
      }

      if (!Array.isArray(data.quizzes)) {
        console.error("Unexpected assigned quizzes data format:", data);
        throw new Error("Invalid response format.");
      }

      setAssignedQuizzes(data.quizzes);
    } catch (err) {
      setAssignedError(
        err.message || "Failed to load assigned quizzes. Please try again."
      );
      console.error("Error loading assigned quizzes:", err);
    } finally {
      setIsAssignedLoading(false);
    }
  };

  // Handle opening assign quizzes modal
  const handleOpenAssignQuizzes = () => {
    setIsAssignQuizzesModalOpen(true);
    setQuizSearchTerm("");
    setSelectedQuizId(null);
    setQuizStartDate("");
    setQuizDeadlineDate("");
    fetchQuizzes();
  };

  // Assign selected quiz to this class
  const handleAssignQuiz = async () => {
    if (!classID || !selectedQuizId) {
      showToast("Please select a quiz to assign.", "error");
      return;
    }

    setIsAssigningQuiz(true);
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(`${apiUrl}/classes/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          classID,
          personalQuizID: selectedQuizId,
          startDate: quizStartDate || null,
          deadlineDate: quizDeadlineDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message =
          data?.message ||
          "There was a problem assigning the quiz. Please try again.";
        throw new Error(message);
      }

      showToast(
        data.message || "Quiz assigned to class successfully.",
        "success"
      );

      // After assigning, refresh available quizzes so the assigned one disappears
      fetchQuizzes();
      setSelectedQuizId(null);
      setQuizStartDate("");
      setQuizDeadlineDate("");
    } catch (err) {
      showToast(
        err.message || "There was a problem assigning the quiz. Please try again.",
        "error"
      );
      console.error("Error assigning quiz to class:", err);
    } finally {
      setIsAssigningQuiz(false);
    }
  };

  const handleOpenUnassignQuiz = (quiz) => {
    setQuizToUnassign(quiz);
    setIsUnassignModalOpen(true);
  };

  const handleOpenEditDates = (quiz) => {
    setQuizToEditDates(quiz);
    // Format dates for datetime-local input
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      try {
        // Handle format: "2026-02-20 08:00:00" or datetime string
        let dateStr = dateString.trim();
        if (dateStr.includes(' ')) {
          // Format: "2026-02-20 08:00:00" - extract date and time parts
          const [datePart, timePart] = dateStr.split(' ');
          const [hours, minutes] = timePart.split(':');
          return `${datePart}T${hours}:${minutes}`;
        } else {
          // Try parsing as ISO string
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        }
        return "";
      } catch {
        return "";
      }
    };
    setEditStartDate(formatDateForInput(quiz.startDate));
    setEditDeadlineDate(formatDateForInput(quiz.deadlineDate));
    setIsEditDatesModalOpen(true);
  };

  const handleUpdateDates = async () => {
    if (!quizToEditDates?.classPersonalQuizID) return;

    // Validation: deadline must be after or equal to start date
    if (editStartDate && editDeadlineDate) {
      const start = new Date(editStartDate);
      const end = new Date(editDeadlineDate);
      if (end < start) {
        showToast("Deadline date must be after or equal to start date.", "error");
        return;
      }
    }

    setIsUpdatingDates(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const payload = {};
      if (editStartDate) {
        // Extract date in YYYY-MM-DD format directly from datetime-local input
        // datetime-local format is YYYY-MM-DDTHH:mm, so we just take the date part
        payload.startDate = editStartDate.split('T')[0];
      }
      if (editDeadlineDate) {
        // Extract date in YYYY-MM-DD format directly from datetime-local input
        // datetime-local format is YYYY-MM-DDTHH:mm, so we just take the date part
        payload.deadlineDate = editDeadlineDate.split('T')[0];
      }

      const response = await fetch(
        `${apiUrl}/classes/quizzes/${quizToEditDates.classPersonalQuizID}/dates`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const message =
          data?.message ||
          "There was a problem updating the quiz dates. Please try again.";
        throw new Error(message);
      }

      showToast(
        data.message || "Quiz dates updated successfully.",
        "success"
      );

      // Update the quiz in the local list
      setAssignedQuizzes((prev) =>
        prev.map((q) => {
          if (q.classPersonalQuizID === quizToEditDates.classPersonalQuizID) {
            return {
              ...q,
              startDate: data.classPersonalQuiz?.startDate || q.startDate,
              deadlineDate: data.classPersonalQuiz?.deadlineDate || q.deadlineDate,
            };
          }
          return q;
        })
      );

      // Close modal
      setIsEditDatesModalOpen(false);
      setQuizToEditDates(null);
      setEditStartDate("");
      setEditDeadlineDate("");
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem updating the quiz dates. Please try again.",
        "error"
      );
      console.error("Error updating quiz dates:", err);
    } finally {
      setIsUpdatingDates(false);
    }
  };

  const handleConfirmUnassignQuiz = async () => {
    if (!quizToUnassign?.classPersonalQuizID) return;

    setIsUnassigningQuiz(true);
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/classes/quizzes/${quizToUnassign.classPersonalQuizID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const message =
          data?.message ||
          "There was a problem removing the quiz. Please try again.";
        throw new Error(message);
      }

      showToast(
        data.message || "Quiz removed from class successfully.",
        "success"
      );

      // Remove from local list
      setAssignedQuizzes((prev) =>
        prev.filter(
          (q) => q.classPersonalQuizID !== quizToUnassign.classPersonalQuizID
        )
      );
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem removing the quiz. Please try again.",
        "error"
      );
      console.error("Error unassigning quiz from class:", err);
    } finally {
      setIsUnassigningQuiz(false);
      setIsUnassignModalOpen(false);
      setQuizToUnassign(null);
    }
  };

  // Fetch quiz results for the class
  const fetchQuizResults = async () => {
    if (!classID) return;

    setIsQuizResultsLoading(true);
    setQuizResultsError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(`${apiUrl}/classes/${classID}/quiz-results`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load quiz results.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
        } catch {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch quiz results");
      }

      if (!Array.isArray(data.results)) {
        console.error("Unexpected quiz results data format:", data);
        throw new Error("Invalid response format.");
      }

      setQuizResults(data.results);
    } catch (err) {
      setQuizResultsError(
        err.message || "Failed to load quiz results. Please try again."
      );
      console.error("Error loading quiz results:", err);
    } finally {
      setIsQuizResultsLoading(false);
    }
  };

  // Filter quizzes based on search term
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (!quizSearchTerm.trim()) return true;
    const term = quizSearchTerm.toLowerCase().trim();
    return (
      quiz.title?.toLowerCase().includes(term) ||
      quiz.description?.toLowerCase().includes(term) ||
      (quiz.subject &&
        (quiz.subject.subjectCode
          ?.toLowerCase()
          .includes(term) ||
          quiz.subject.subjectName
            ?.toLowerCase()
            .includes(term)))
    );
  });

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="outfit-500 relative text-[14px]">
            <i className="bx bx-search absolute top-0.5 left-3 text-lg text-gray-500"></i>
            <input
              type="text"
              placeholder="Search students..."
              className="-mt-2 w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            )}
          </div>
          
          {/* Back Button and Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/class")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100"
                aria-label="Back to classes"
              >
                <i className="bx bx-arrow-left-stroke text-3xl" />
              </button>
              <div>
                <p className="outfit-500 mt-1 text-[20px] text-black">
                  {classInfo ? classInfo.className : "Class Students"}
                </p>
                {classInfo && (
                  <p className="text-sm text-gray-600">
                    Class Code: {classInfo.classCode}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAssignQuizzes}
              className="outfit inline-flex cursor-pointer items-center rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-orange-600"
            >
              <i className="bx bx-plus mr-2 text-lg" />
              Assign Quizzes
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 rounded-xl bg-gray-100 p-1 text-[13px]">
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`flex-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                activeTab === "students"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Students
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("quizzes");
                if (assignedQuizzes.length === 0) {
                  fetchAssignedQuizzes();
                }
              }}
              className={`flex-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                activeTab === "quizzes"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quizzes
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("results");
                if (quizResults.length === 0) {
                  fetchQuizResults();
                }
              }}
              className={`flex-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                activeTab === "results"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quiz Results
            </button>
          </div>

          <div className="my-3 h-px bg-gray-200" />
        </div>

        {/* Tab content */}
        {activeTab === "students" ? (
          <div>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="outfit flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-[14px] text-gray-600">Loading students...</p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
                <div className="text-center">
                  <img
                    src={emptyImage}
                    alt="No students available"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="text-sm text-gray-600">
                    {searchTerm.trim()
                      ? `No students found matching "${searchTerm}"`
                      : students.length === 0
                        ? "No students have joined this class yet."
                        : "No students match your search."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Student Count */}
                <div className="outfit-500 mb-4 flex items-center justify-between">
                  <p className="text-[14px] text-gray-600">
                    {filteredStudents.length}{" "}
                    {filteredStudents.length === 1 ? "Student" : "Students"}
                    {students.length !== filteredStudents.length &&
                      ` (of ${students.length} total)`}
                  </p>
                </div>

                {/* Students Table */}
                <div className="outfit overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                            Enrolled Date
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                            Quizzes Answered
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredStudents.map((student) => {
                          const enrolledDate = formatDate(
                            student.enrolledAt || student.created_at
                          );

                          return (
                            <tr
                              key={student.enrollmentID || student.studentID}
                              className="group transition-colors hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                                    <img
                                      src={StudentPfp}
                                      alt={`${student.firstName} ${student.lastName}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {student.firstName} {student.lastName}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                      <span>{student.userCode}</span>
                                      {student.email && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate max-w-[200px]">
                                            {student.email}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">
                                  {student.program || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">
                                  {enrolledDate}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900">
                                  {student.quizProgress || 
                                   (student.quizzesCompleted !== undefined && student.totalQuizzes !== undefined
                                     ? `${student.quizzesCompleted}/${student.totalQuizzes}`
                                     : "—")}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => handleRemoveClick(student, e)}
                                  className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
                                  title="Remove Student"
                                >
                                  <i className="bx bx-trash text-lg"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="pb-6" />
          </div>
        ) : activeTab === "quizzes" ? (
          <div>
            {assignedError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {assignedError}
              </div>
            )}

            {isAssignedLoading ? (
              <div className="outfit flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-[14px] text-gray-600">
                    Loading assigned quizzes...
                  </p>
                </div>
              </div>
            ) : assignedQuizzes.length === 0 ? (
              <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
                <div className="text-center">
                  <img
                    src={emptyImage}
                    alt="No quizzes assigned"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="text-sm text-gray-600">
                    No quizzes have been assigned to this class yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="outfit-500 mb-4 flex items-center justify-between">
                  <p className="text-[14px] text-gray-600">
                    {assignedQuizzes.length}{" "}
                    {assignedQuizzes.length === 1
                      ? "Assigned Quiz"
                      : "Assigned Quizzes"}
                  </p>
                </div>

                <div className="outfit overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="w-6 px-2 py-2 text-center" />
                          <th className="px-2 py-2 text-left text-[12px] font-medium tracking-wider text-gray-600 uppercase">
                            Quiz Information
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                            Schedule
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                            Stats
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {assignedQuizzes.map((quiz) => {
                          const start = formatDateTime(quiz.startDate);
                          const deadline = formatDateTime(quiz.deadlineDate);
                          const baseQuiz = quiz.personalQuiz || quiz;
                          const quizId =
                            baseQuiz.personalQuizID ||
                            baseQuiz.id ||
                            quiz.personalQuizID ||
                            quiz.quizID ||
                            quiz.classPersonalQuizID;
                          
                          // Get average accuracy from API response
                          const avgAccuracy = quiz.avgAccuracy !== undefined 
                            ? quiz.avgAccuracy 
                            : quiz.accuracy !== undefined 
                              ? quiz.accuracy 
                              : 0;
                          
                          // Get total attempts from API response
                          const totalAttempts = quiz.totalAttempts !== undefined 
                            ? quiz.totalAttempts 
                            : 0;

                          return (
                            <tr
                              key={quiz.classPersonalQuizID}
                              className="group transition-colors hover:bg-gray-50"
                            >
                              <td
                                className="w-12 px-4 py-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAssignedQuizIds.includes(quizId)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (e.target.checked) {
                                      setSelectedAssignedQuizIds((prev) => [
                                        ...prev,
                                        quizId,
                                      ]);
                                    } else {
                                      setSelectedAssignedQuizIds((prev) =>
                                        prev.filter((id) => id !== quizId)
                                      );
                                    }
                                  }}
                                  className="h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                                />
                              </td>
                              <td className="cursor-pointer px-2 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {quiz.quizName || baseQuiz.title || "Untitled Quiz"}
                                  </div>
                                  {(quiz.description || baseQuiz.description) && (
                                    <div className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                      {quiz.description || baseQuiz.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center">
                                <div className="text-xs text-gray-700">
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      Start:
                                    </span>{" "}
                                    {quiz.startDate ? start : "Not set"}
                                  </div>
                                  <div className="mt-0.5">
                                    <span className="font-medium text-gray-800">
                                      Deadline:
                                    </span>{" "}
                                    {quiz.deadlineDate ? deadline : "Not set"}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center">
                                <div className="text-xs text-gray-700">
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      Avg. Accuracy:
                                    </span>{" "}
                                    {avgAccuracy.toFixed(2)}%
                                  </div>
                                  <div className="mt-0.5">
                                    <span className="font-medium text-gray-800">
                                      Attempts:
                                    </span>{" "}
                                    {totalAttempts}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap">
                                <div className="flex flex-col items-center gap-2 md:flex-row md:justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const quizForOverview = baseQuiz;
                                      navigate("/quiz-overview", {
                                        state: {
                                          quiz: quizForOverview,
                                          subject:
                                            quiz.personalQuiz?.subject ||
                                            baseQuiz.subject ||
                                            classInfo?.subject ||
                                            null,
                                          classPersonalQuizID: quiz.classPersonalQuizID,
                                        },
                                      });
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100"
                                  >
                                    <i className="bx bx-show text-sm" />
                                    <span>View questions</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDates(quiz)}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                  >
                                    <i className="bx bx-calendar text-sm" />
                                    <span>Edit Dates</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUnassignQuiz(quiz)}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    <i className="bx bx-trash text-sm" />
                                    <span>Unassign</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="pb-6" />
          </div>
        ) : activeTab === "results" ? (
          <div>
            {quizResultsError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {quizResultsError}
              </div>
            )}

            {isQuizResultsLoading ? (
              <div className="outfit flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-[14px] text-gray-600">
                    Loading quiz results...
                  </p>
                </div>
              </div>
            ) : quizResults.length === 0 ? (
              <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
                <div className="text-center">
                  <img
                    src={emptyImage}
                    alt="No quiz results"
                    className="mx-auto mb-3 h-32 w-32 opacity-80"
                  />
                  <p className="text-sm text-gray-600">
                    No quiz results available yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="outfit-500 mb-4 flex items-center justify-between">
                  <p className="text-[14px] text-gray-600">
                    {quizResults.length}{" "}
                    {quizResults.length === 1 ? "Quiz" : "Quizzes"} with Results
                  </p>
                </div>

                <div className="space-y-4">
                  {quizResults.map((item) => (
                    <div
                      key={item.classPersonalQuizID}
                      className="outfit rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4">
                        <h3 className="text-[15px] font-semibold text-gray-900">
                          {item.quiz?.title || "Untitled Quiz"}
                        </h3>
                        {item.quiz?.description && (
                          <p className="mt-1 text-[13px] text-gray-600">
                            {item.quiz.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-600">
                          {item.assignment?.startDate && (
                            <span>
                              <span className="font-medium text-gray-700">
                                Start:
                              </span>{" "}
                              {formatDate(item.assignment.startDate)}
                            </span>
                          )}
                          {item.assignment?.deadlineDate && (
                            <span>
                              <span className="font-medium text-gray-700">
                                Deadline:
                              </span>{" "}
                              {formatDate(item.assignment.deadlineDate)}
                            </span>
                          )}
                          <span>
                            <span className="font-medium text-gray-700">
                              Students:
                            </span>{" "}
                            {item.totalStudents}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                Student
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                                Best Score
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                                Best Percentage
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                                Attempts
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                                Last Submitted
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {item.students.map((studentResult, idx) => (
                              <tr
                                key={studentResult.student?.userID || idx}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {studentResult.student?.firstName}{" "}
                                    {studentResult.student?.lastName}
                                  </div>
                                  {studentResult.student?.userCode && (
                                    <div className="text-xs text-gray-500">
                                      {studentResult.student.userCode}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-700">
                                  {studentResult.highestAttempt?.score} /{" "}
                                  {studentResult.highestAttempt?.total_score}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-800">
                                  {typeof studentResult.highestAttempt
                                    ?.percentage === "number"
                                    ? studentResult.highestAttempt.percentage.toFixed(
                                        1
                                      )
                                    : parseFloat(
                                        studentResult.highestAttempt
                                          ?.percentage || 0
                                      ).toFixed(1)}
                                  %
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-700">
                                  {studentResult.totalAttempts}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                  {formatDate(
                                    studentResult.highestAttempt?.submitted_at
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pb-6" />
          </div>
        ) : null}

        {/* Assign Quizzes Modal */}
        {isAssignQuizzesModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center lightbox-bg px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="outfit-500 text-[18px] text-gray-900">
                    Assign Quizzes
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Available quizzes for{" "}
                    <span className="font-semibold text-gray-700">
                      {classInfo?.className || "this class"}
                    </span>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignQuizzesModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
                {/* Search */}
                <div className="outfit-500 relative text-[14px]">
                  <i className="bx bx-search absolute top-1.5 left-3 text-lg text-gray-500"></i>
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    className="w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                    value={quizSearchTerm}
                    onChange={(e) => setQuizSearchTerm(e.target.value)}
                  />
                  {quizSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setQuizSearchTerm("")}
                      className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                    >
                      <i className="bx bx-x text-lg" />
                    </button>
                  )}
                </div>

                {/* Error */}
                {quizError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {quizError}
                  </div>
                )}

                {/* Loading / Empty / List */}
                {isQuizzesLoading ? (
                  <div className="outfit flex h-40 items-center justify-center">
                    <div className="text-center">
                      <div className="loader mx-auto mb-2"></div>
                      <p className="text-[14px] text-gray-600">
                        Loading available quizzes...
                      </p>
                    </div>
                  </div>
                ) : filteredQuizzes.length === 0 ? (
                  <div className="outfit flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
                    <p className="text-[14px] text-gray-600">
                      {quizSearchTerm.trim()
                        ? `No quizzes found matching "${quizSearchTerm}".`
                        : "No available quizzes to assign to this class."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Quiz dates */}
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[13px] font-medium text-gray-700">
                          Start Date (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={quizStartDate}
                          onChange={(e) => setQuizStartDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[13px] font-medium text-gray-700">
                          Deadline (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={quizDeadlineDate}
                          onChange={(e) => setQuizDeadlineDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                    </div>

                    <div className="outfit overflow-hidden rounded-xl border border-gray-200">
                      <div className="max-h-[40vh] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                Select
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                Quiz
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                Type
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                Subject
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredQuizzes.map((quiz) => {
                              const createdDate = formatDate(quiz.created_at);
                              const isCustom = !quiz.subjectID && !quiz.subject;

                              return (
                                <tr
                                  key={quiz.personalQuizID || quiz.quizID}
                                  className="transition-colors hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="radio"
                                      name="selectedQuiz"
                                      className="h-4 w-4 text-orange-500 focus:ring-orange-400"
                                      checked={
                                        selectedQuizId ===
                                        (quiz.personalQuizID || quiz.quizID)
                                      }
                                      onChange={() =>
                                        setSelectedQuizId(
                                          quiz.personalQuizID || quiz.quizID
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                      <span className="text-[14px] font-semibold text-gray-900">
                                        {quiz.title || "Untitled Quiz"}
                                      </span>
                                      {quiz.description && (
                                        <span className="mt-0.5 text-[12px] text-gray-500 line-clamp-2">
                                          {quiz.description}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[13px] text-gray-700">
                                    {isCustom ? "Custom" : "Subject-based"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-[13px] text-gray-700">
                                    {quiz.subject
                                      ? `${quiz.subject.subjectCode} - ${quiz.subject.subjectName}`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap text-[13px] text-gray-600">
                                    {createdDate}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3">
                <button
                  type="button"
                  onClick={() => setIsAssignQuizzesModalOpen(false)}
                  className="outfit inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isAssigningQuiz}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAssignQuiz}
                  disabled={!selectedQuizId || isAssigningQuiz}
                  className={`outfit inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
                    !selectedQuizId || isAssigningQuiz
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isAssigningQuiz ? "Assigning..." : "Assign Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Student Confirmation Modal */}
        <ConfirmModal
          isOpen={isRemoveModalOpen}
          onClose={() => {
            setIsRemoveModalOpen(false);
            setRemovingStudent(null);
          }}
          onConfirm={handleRemoveConfirm}
          message={
            removingStudent
              ? `Are you sure you want to remove "${removingStudent.firstName} ${removingStudent.lastName}" from this class?`
              : "Are you sure you want to remove this student from the class?"
          }
          isLoading={isRemoving}
        />
        {/* Unassign Quiz Confirmation Modal */}
        <ConfirmModal
          isOpen={isUnassignModalOpen}
          onClose={() => {
            setIsUnassignModalOpen(false);
            setQuizToUnassign(null);
          }}
          onConfirm={handleConfirmUnassignQuiz}
          message={
            quizToUnassign
              ? `Are you sure you want to unassign "${quizToUnassign.quizName}" from this class?`
              : "Are you sure you want to unassign this quiz from the class?"
          }
          isLoading={isUnassigningQuiz}
        />
        {/* Edit Quiz Dates Modal */}
        {isEditDatesModalOpen && quizToEditDates && (
          <div className="fixed inset-0 z-40 flex items-center justify-center lightbox-bg px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="outfit-500 text-[18px] text-gray-900">
                    Edit Quiz Dates
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Update start and deadline dates for{" "}
                    <span className="font-semibold text-gray-700">
                      {quizToEditDates.quizName || "this quiz"}
                    </span>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDatesModalOpen(false);
                    setQuizToEditDates(null);
                    setEditStartDate("");
                    setEditDeadlineDate("");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 px-6 py-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-gray-700">
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-gray-700">
                    Deadline Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editDeadlineDate}
                    onChange={(e) => setEditDeadlineDate(e.target.value)}
                    min={editStartDate || undefined}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDatesModalOpen(false);
                    setQuizToEditDates(null);
                    setEditStartDate("");
                    setEditDeadlineDate("");
                  }}
                  className="outfit inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isUpdatingDates}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateDates}
                  disabled={isUpdatingDates}
                  className={`outfit inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
                    isUpdatingDates
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isUpdatingDates ? (
                    <div className="flex items-center gap-2">
                      <span className="loader-white"></span>
                      Updating...
                    </div>
                  ) : (
                    "Update Dates"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClassContent;
