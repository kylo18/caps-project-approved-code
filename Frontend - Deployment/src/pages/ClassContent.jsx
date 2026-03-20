import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/confirmModal";
import EditClassModal from "../components/EditClassModal";
import WarningModal from "../components/WarningModal";
import QuizSettingsModal from "../components/QuizSettingsModal";
import SearchBar from "../components/SearchBar";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import emptyImage from "../assets/icons/empty.png";
import StudentPfp from "/src/assets/symbols/student.png";
import ArchiveIcon from "/src/assets/symbols/archive.svg";

import BlueBackground from "/src/assets/backgrounds/blue.png";
import GreenBackground from "/src/assets/backgrounds/green.png";
import RedBackground from "/src/assets/backgrounds/red.png";
import YellowBackground from "/src/assets/backgrounds/yellow.png";
import PurpleBackground from "/src/assets/backgrounds/purple.png";
import CyanBackground from "/src/assets/backgrounds/cyan.png";
import { getApiBaseUrl } from "../utils/config";

const headerBackgrounds = [
  BlueBackground,
  GreenBackground,
  RedBackground,
  YellowBackground,
  PurpleBackground,
  CyanBackground,
];

const getHeaderBackground = (id) => {
  if (!id) return headerBackgrounds[0];
  const index = Number(id) % headerBackgrounds.length;
  return headerBackgrounds[index];
};

// Deterministic "random" background colors for initials avatar (from string hash)
const INITIALS_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#f97316",
  "#14b8a6",
  "#a855f7",
];
const getInitialsBgColor = (str) => {
  if (!str || typeof str !== "string") return INITIALS_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = (hash << 5) - hash + str.charCodeAt(i);
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
};

// Quiz header colors (same as Libraries.jsx)
const QUIZ_HEADER_COLORS = [
  "#1e3a5f", // Dark blue
  "#7f1d1d", // Dark red
  "#1e293b", // Dark slate
  "#422006", // Dark brown/amber
  "#312e81", // Dark indigo
];
const getQuizHeaderColor = (quizId) => {
  if (quizId == null) return QUIZ_HEADER_COLORS[0];
  const id = typeof quizId === "number" ? quizId : parseInt(quizId, 10) || 0;
  return QUIZ_HEADER_COLORS[Math.abs(id) % QUIZ_HEADER_COLORS.length];
};

const ClassContent = () => {
  const navigate = useNavigate();
  const { classID } = useParams();
  const apiUrl = getApiBaseUrl();
  const { toast, showToast } = useToast();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Assign Quizzes states
  const [isAssignQuizzesModalOpen, setIsAssignQuizzesModalOpen] =
    useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [quizSearchTerm, setQuizSearchTerm] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizStartDate, setQuizStartDate] = useState("");
  const [quizDeadlineDate, setQuizDeadlineDate] = useState("");
  const [isAssigningQuiz, setIsAssigningQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState("quizzes"); // 'students' | 'quizzes' | 'results'
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
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingClass, setArchivingClass] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [classes, setClasses] = useState([]);
  const [expandedQuizStats, setExpandedQuizStats] = useState(null); // track which quiz stats are shown on mobile

  // Get user role on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  // Fetch classes (same API as Class.jsx) to get schedule and class shape for edit/archive
  useEffect(() => {
    const fetchClasses = async () => {
      if (!classID || userRole === null) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const endpoint =
          userRole === 1
            ? `${apiUrl}/classes/my-classes`
            : `${apiUrl}/classes/index`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && Array.isArray(data.classes)) {
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error("Error loading classes:", err);
      }
    };

    fetchClasses();
  }, [classID, userRole, apiUrl]);

  // Current class from classes list (same shape as Class.jsx) for schedule and modals
  const currentClass =
    classes.find((c) => String(c.classID ?? c.id) === String(classID)) || null;

  // Fetch class students on component mount
  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!classID) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

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
            localStorage.removeItem("token");
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
        setError(
          err.message || "Failed to load class students. Please try again.",
        );
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

  // Refresh classes list (same as Class.jsx) so schedule and currentClass stay in sync
  const refreshClasses = () => {
    if (!classID || userRole === null) return;

    const doFetch = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const endpoint =
          userRole === 1
            ? `${apiUrl}/classes/my-classes`
            : `${apiUrl}/classes/index`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.classes)) {
            setClasses(data.classes || []);
          }
        }
      } catch (err) {
        console.error("Error refreshing classes:", err);
      }
    };

    doFetch();
  };

  // Refresh students list
  const refreshStudents = () => {
    const fetchClassStudents = async () => {
      if (!classID) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

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
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsRemoving(false);
        setIsRemoveModalOpen(false);
        setRemovingStudent(null);
        return;
      }

      const response = await fetch(
        `${apiUrl}/classes/${classID}/remove-student`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            studentID: removingStudent.studentID,
          }),
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem removing the student. Please try again.";

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
          "success",
        );
        // Refresh the students list
        refreshStudents();
      } else {
        showToast(
          data.message || "Failed to remove student. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem removing the student. Please try again.",
        "error",
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
      const token = localStorage.getItem("token");

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
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load quizzes.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
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
        err.message || "Failed to load available quizzes. Please try again.",
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
      const token = localStorage.getItem("token");

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
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load assigned quizzes.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
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
        err.message || "Failed to load assigned quizzes. Please try again.",
      );
      console.error("Error loading assigned quizzes:", err);
    } finally {
      setIsAssignedLoading(false);
    }
  };

  // Fetch assigned quizzes when viewing a class (default tab is Quizzes)
  useEffect(() => {
    if (classID && activeTab === "quizzes") {
      fetchAssignedQuizzes();
    }
  }, [classID]);

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
      const token = localStorage.getItem("token");

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
        "success",
      );

      // After assigning, refresh available quizzes so the assigned one disappears
      fetchQuizzes();
      setSelectedQuizId(null);
      setQuizStartDate("");
      setQuizDeadlineDate("");
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem assigning the quiz. Please try again.",
        "error",
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
    setIsEditDatesModalOpen(true);
  };

  const handleArchiveClick = (e) => {
    e?.stopPropagation?.();
    const classItem = currentClass || classInfo;
    if (!classItem) return;
    setArchivingClass(classItem);
    setIsArchiveModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archivingClass) return;

    setIsArchiving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsArchiving(false);
        setIsArchiveModalOpen(false);
        setArchivingClass(null);
        return;
      }

      const id = archivingClass.classID ?? archivingClass.id ?? classID;
      if (!id) {
        showToast("Unable to determine class ID for archiving.", "error");
        setIsArchiving(false);
        setIsArchiveModalOpen(false);
        setArchivingClass(null);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/archive/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        let message =
          "There was a problem archiving the class. Please try again.";
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      if (data.success) {
        showToast(data.message || "Class archived successfully.", "success");
        refreshClasses();
        navigate("/class");
      } else {
        showToast(
          data.message || "Failed to archive class. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem archiving the class. Please try again.",
        "error",
      );
    } finally {
      setIsArchiving(false);
      setIsArchiveModalOpen(false);
      setArchivingClass(null);
    }
  };

  const handleEditClick = (e) => {
    e?.stopPropagation?.();
    const classItem = currentClass || classInfo;
    setEditingClass(
      classItem
        ? {
            ...classItem,
            classID: classItem.classID ?? classItem.id ?? classID,
          }
        : null,
    );
    setIsEditModalOpen(true);
  };

  const handleClassUpdated = () => {
    refreshStudents();
    refreshClasses();
  };

  const handleConfirmUnassignQuiz = async () => {
    if (!quizToUnassign?.classPersonalQuizID) return;

    setIsUnassigningQuiz(true);
    try {
      const token = localStorage.getItem("token");

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
        },
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
        "success",
      );

      // Remove from local list
      setAssignedQuizzes((prev) =>
        prev.filter(
          (q) => q.classPersonalQuizID !== quizToUnassign.classPersonalQuizID,
        ),
      );
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem removing the quiz. Please try again.",
        "error",
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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/classes/${classID}/quiz-results`,
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
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        let errorMessage = "Failed to load quiz results.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
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
        err.message || "Failed to load quiz results. Please try again.",
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
        (quiz.subject.subjectCode?.toLowerCase().includes(term) ||
          quiz.subject.subjectName?.toLowerCase().includes(term)))
    );
  });

  // Current user from session (for creator card)
  const sessionUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const creatorFullName =
    sessionUser?.firstName != null || sessionUser?.lastName != null
      ? [sessionUser.firstName, sessionUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "User"
      : "User";
  const creatorInitials =
    sessionUser?.firstName && sessionUser?.lastName
      ? `${String(sessionUser.firstName)[0]}${String(sessionUser.lastName)[0]}`.toUpperCase()
      : sessionUser?.firstName
        ? String(sessionUser.firstName).slice(0, 2).toUpperCase()
        : "?";
  const creatorAvatarBg = getInitialsBgColor(creatorFullName);

  // Class subject from API (same shape as Class.jsx: subject.subjectCode, subject.subjectName)
  const classSubject = currentClass?.subject ?? classInfo?.subject;
  const subjectDisplay =
    classSubject?.subjectCode && classSubject?.subjectName
      ? `${classSubject.subjectCode} - ${classSubject.subjectName}`
      : classSubject?.subjectCode
        ? classSubject.subjectCode
        : classSubject?.subjectName
          ? classSubject.subjectName
          : "—";

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {isLoading ? (
        <div className="scrollbar-hide outfit-400 flex h-screen flex-1 flex-col items-center justify-center overflow-y-auto p-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-center">
            <div className="loader mx-auto mb-3" />
          </div>
        </div>
      ) : (
        <div className="scrollbar-hide mt-5 flex min-h-screen flex-1 flex-col gap-6 overflow-y-auto py-6 pb-28 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-10 md:p-6 lg:mt-0 [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            {/* Two-card header */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
              {/* Left: Class Information Card with colored background */}
              <div
                className="relative min-h-[160px] overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-6 md:rounded-xl"
                style={{
                  backgroundImage: `url(${getHeaderBackground(classID)})`,
                }}
              >
                <div className="relative z-10 flex h-full flex-col">
                  <div className="pr-16">
                    <h1 className="outfit-500 text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-2xl">
                      {/* Mobile: subject code beside class name (e.g. MATH111 - Calculus 1) */}
                      <span className="md:hidden">
                        {classSubject?.subjectCode
                          ? `${classSubject.subjectCode} - ${classInfo?.className ?? "Class Name"}`
                          : (classInfo?.className ?? "Class Name")}
                      </span>
                      {/* Desktop: class name only */}
                      <span className="hidden md:inline">
                        {classInfo ? classInfo.className : "Class Name"}
                      </span>
                    </h1>
                    <p className="outfit-400 mt-1 flex items-center gap-2 text-[14px] font-normal text-white/95">
                      <i className="bx bx-alarm-alt text-[16px]"></i>
                      {currentClass?.schedule ??
                        classInfo?.schedule ??
                        "Schedule not set"}
                    </p>
                  </div>
                  <div className="outfit-400 mt-8 flex items-end justify-between">
                    <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-white px-2 py-0.5">
                      <span className="truncate text-[12px] font-semibold whitespace-nowrap text-black uppercase">
                        Class Code -{" "}
                        {currentClass?.classCode ?? classInfo?.classCode ?? "—"}
                      </span>
                    </div>

                    {/* Desktop: text buttons with pill background */}
                    <div className="-mb-2 hidden items-center gap-2 md:flex">
                      <button
                        type="button"
                        onClick={handleArchiveClick}
                        className="outfit-400 inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-4 py-2 text-[14px] text-gray-800 hover:bg-gray-100"
                      >
                        <i className="bx bx-archive mr-2 text-[16px] text-gray-800"></i>
                        Archive class
                      </button>

                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="outfit-400 inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-4 py-2 text-[14px] text-gray-800 hover:bg-gray-100"
                      >
                        <i className="bx bx-edit mr-2 text-[16px] text-gray-800"></i>
                        Edit class details
                      </button>
                    </div>

                    {/* Mobile: icon-only buttons, transparent background */}
                    <div className="-mb-2 flex items-center gap-2 md:hidden">
                      <button
                        type="button"
                        onClick={handleArchiveClick}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/90 hover:bg-white/10 active:bg-white/20"
                        aria-label="Archive class"
                      >
                        <i className="bx bx-archive text-[20px]"></i>
                      </button>

                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white/90 hover:bg-white/10 active:bg-white/20"
                        aria-label="Edit class details"
                      >
                        <i className="bx bx-edit text-[20px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-6 border-b border-gray-200 px-4 pb-0 md:px-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("quizzes");
                  if (assignedQuizzes.length === 0) fetchAssignedQuizzes();
                }}
                className={`outfit-500 cursor-pointer border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "quizzes"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Quizzes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`outfit-500 cursor-pointer border-b-3 pb-3 text-[14px] font-medium transition-colors ${
                  activeTab === "students"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Students
              </button>
            </nav>
          </div>

          {/* Search bar - show when on Students tab */}
          {activeTab === "students" && (
            <div className="-mt-2 px-4 md:mt-0 md:px-0">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className=""
              />
            </div>
          )}

          {/* Tab content */}
          {activeTab === "students" ? (
            <div className="px-4 md:px-0">
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="outfit-400 flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="loader mx-auto mb-2"></div>
                  </div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="outfit-400 flex h-60 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:h-80 md:border">
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
                  {/* Mobile: expandable list - picture, name, remove button; details in dropdown */}
                  <div className="outfit-400 space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white lg:hidden">
                    {filteredStudents.map((student) => {
                      const studentId =
                        student.enrollmentID || student.studentID;
                      const isExpanded = expandedStudentId === studentId;
                      const enrolledDate = formatDate(
                        student.enrolledAt || student.created_at,
                      );
                      const quizProgress =
                        student.quizProgress ||
                        (student.quizzesCompleted !== undefined &&
                        student.totalQuizzes !== undefined
                          ? `${student.quizzesCompleted}/${student.totalQuizzes}`
                          : "—");

                      return (
                        <div
                          key={studentId}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStudentId(
                                isExpanded ? null : studentId,
                              )
                            }
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                              <img
                                src={StudentPfp}
                                alt={`${student.firstName} ${student.lastName}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="outfit-500 text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                            <i
                              className={`bx bx-chevron-down flex-shrink-0 text-xl text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Program</span>
                                  <span className="text-gray-900">
                                    {student.program || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Enrolled Date
                                  </span>
                                  <span className="text-gray-900">
                                    {enrolledDate}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Quizzes Answered
                                  </span>
                                  <span className="text-gray-900">
                                    {quizProgress}
                                  </span>
                                </div>
                                {student.userCode && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      User Code
                                    </span>
                                    <span className="text-gray-900">
                                      {student.userCode}
                                    </span>
                                  </div>
                                )}
                                {student.email && (
                                  <div className="flex flex-col gap-1 pt-1">
                                    <span className="text-gray-500">Email</span>
                                    <span className="break-all text-gray-900">
                                      {student.email}
                                    </span>
                                  </div>
                                )}
                                <div className="pt-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveClick(student, e);
                                    }}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100"
                                    title="Remove Student"
                                  >
                                    <i className="bx bx-trash text-[16px]" />
                                    <span className="text-[12px]">Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: Students Table */}
                  <div className="outfit-400 hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                    <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-white">
                          <tr>
                            <th className="outfit-400 w-[50%] px-6 py-3 text-left text-[14px] font-medium tracking-wider text-gray-600">
                              Student
                            </th>
                            <th className="outfit-400 w-[10%] px-6 py-3 text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Program
                            </th>
                            <th className="outfit-400 w-[15%] px-6 py-3 text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Enrolled Date
                            </th>
                            <th className="outfit-400 w-[15%] px-6 py-3 text-center text-[14px] font-medium tracking-wider text-gray-600">
                              Quizzes Answered
                            </th>
                            <th className="outfit-400 w-[10%] px-6 py-3 text-right text-[14px] font-medium tracking-wider text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredStudents.map((student) => {
                            const enrolledDate = formatDate(
                              student.enrolledAt || student.created_at,
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
                                      <div className="outfit-500 text-sm text-gray-900">
                                        {student.firstName} {student.lastName}
                                      </div>
                                      <div className="outfit-400 mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                        <span>{student.userCode}</span>
                                        {student.email && (
                                          <>
                                            <span>•</span>
                                            <span className="max-w-[200px] truncate">
                                              {student.email}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="outfit-400 px-6 py-4 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {student.program || "N/A"}
                                  </span>
                                </td>
                                <td className="outfit-400 px-6 py-4 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-600">
                                    {enrolledDate}
                                  </span>
                                </td>
                                <td className="outfit-400 px-6 py-4 text-center whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {student.quizProgress ||
                                      (student.quizzesCompleted !== undefined &&
                                      student.totalQuizzes !== undefined
                                        ? `${student.quizzesCompleted}/${student.totalQuizzes}`
                                        : "—")}
                                  </span>
                                </td>
                                <td className="outfit-500 px-6 py-4 text-right whitespace-nowrap">
                                  <div className="flex justify-end">
                                    <button
                                      onClick={(e) =>
                                        handleRemoveClick(student, e)
                                      }
                                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100"
                                      title="Remove Student"
                                    >
                                      <i className="bx bx-trash text-[16px]"></i>
                                      <span className="text-[12px]">
                                        Remove
                                      </span>
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
          ) : activeTab === "quizzes" ? (
            <div className="px-4 md:px-0">
              {assignedError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {assignedError}
                </div>
              )}

              {isAssignedLoading ? (
                <div className="outfit-400 flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="loader mx-auto mb-2"></div>
                  </div>
                </div>
              ) : assignedQuizzes.length === 0 ? (
                <div className="outfit-400 flex h-80 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:border">
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
                  {/* Desktop: Card List view (matches StudentClasses) */}
                  <div className="hidden flex-col gap-4 overflow-hidden rounded-xl bg-gray-50/30 lg:flex">
                    {assignedQuizzes.map((quiz) => {
                      const displayStart = quiz.startTime ?? quiz.startDate;
                      const displayEnd = quiz.endTime ?? quiz.deadlineDate;
                      const start = formatDate(displayStart);
                      let isDeadlineNear = false;
                      const deadline = (() => {
                        if (!displayEnd) return "Not set";
                        const d = new Date(displayEnd);
                        const msRemaining = d - new Date();
                        if (
                          msRemaining > 0 &&
                          msRemaining < 12 * 60 * 60 * 1000
                        ) {
                          isDeadlineNear = true;
                        }
                        const dPart = d.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        const tPart = d.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return `${dPart} (${tPart})`;
                      })();

                      const baseQuiz = quiz.personalQuiz || quiz;

                      const avgAccuracy =
                        quiz.avgAccuracy !== undefined
                          ? quiz.avgAccuracy
                          : quiz.accuracy !== undefined
                            ? quiz.accuracy
                            : 0;

                      const totalAttempts =
                        quiz.totalAttempts !== undefined
                          ? quiz.totalAttempts
                          : 0;

                      const durationText = baseQuiz.timeLimit
                        ? `${baseQuiz.timeLimit} Minutes`
                        : "No Limit";

                      return (
                        <div
                          key={quiz.classPersonalQuizID}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all md:flex-row md:items-center md:justify-between md:gap-4 lg:gap-6"
                        >
                          <div className="flex w-full items-start justify-between md:w-auto md:items-center md:justify-start md:gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              {/* Icon */}
                              <div className="relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 md:h-[45px] md:w-[45px]">
                                <i className="bx bxs-copy-list text-[20px] md:text-[24px]" />
                              </div>

                              {/* Info */}
                              <div className="flex flex-col">
                                <h3 className="outfit-700 text-[14px] leading-tight font-bold text-[#1a1f36]">
                                  {quiz.quizName ||
                                    baseQuiz.title ||
                                    "Untitled Quiz"}
                                </h3>
                                <div className="outfit-500 mt-1 flex flex-col text-[12px] md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
                                  {/* Desktop Started */}
                                  <div className="hidden items-center gap-1.5 text-gray-500 md:flex">
                                    <i className="bx bx-calendar text-[14px] text-[#1a1f36]/60" />
                                    <span>Started: {start}</span>
                                  </div>
                                  {/* Desktop Deadline */}
                                  <div
                                    className={`hidden items-center gap-1.5 md:flex ${
                                      isDeadlineNear
                                        ? "text-red-500"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <i className="bx bxs-calendar-check text-[14px]" />
                                    <span
                                      className={
                                        isDeadlineNear ? "font-semibold" : ""
                                      }
                                    >
                                      Deadline: {deadline}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Right side: Stats & Buttons */}
                          <div className="hidden items-center justify-between gap-6 px-2 md:flex md:justify-end md:gap-6 md:px-0">
                            {/* Analytics */}
                            <div className="flex items-center gap-6 border-r border-gray-200 pr-6">
                              <div className="flex flex-col items-center justify-center">
                                <span className="outfit-700 text-[10px] tracking-widest text-[#1a1f36]/40 uppercase">
                                  Accuracy
                                </span>
                                <span className="outfit-700 text-[12px] text-[#1a1f36]">
                                  {avgAccuracy.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="outfit-500 flex items-center gap-2">
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
                                      classPersonalQuizID:
                                        quiz.classPersonalQuizID,
                                    },
                                  });
                                }}
                                className="outfit-600 flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <i className="bx bx-edit mr-1" />
                                Manage
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditDates(quiz)}
                                className="outfit-600 flex cursor-pointer items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-[13px] text-gray-700 transition-colors hover:bg-gray-200"
                              >
                                <i className="bx bx-cog mr-1" />
                                Settings
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile: Pill-like card list */}
                  <div className="outfit-400 flex flex-col gap-2 lg:hidden">
                    {assignedQuizzes.map((quiz) => {
                      const displayStart = quiz.startTime ?? quiz.startDate;
                      const displayEnd = quiz.endTime ?? quiz.deadlineDate;
                      const start = formatDateTime(displayStart);
                      const deadline = formatDateTime(displayEnd);
                      const baseQuiz = quiz.personalQuiz || quiz;
                      const quizId =
                        baseQuiz.personalQuizID ||
                        baseQuiz.id ||
                        quiz.personalQuizID ||
                        quiz.quizID ||
                        quiz.classPersonalQuizID;

                      const avgAccuracy =
                        quiz.avgAccuracy !== undefined
                          ? quiz.avgAccuracy
                          : quiz.accuracy !== undefined
                            ? quiz.accuracy
                            : 0;

                      const totalAttempts =
                        quiz.totalAttempts !== undefined
                          ? quiz.totalAttempts
                          : 0;

                      return (
                        <div
                          key={quiz.classPersonalQuizID}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all"
                        >
                          <div className="flex w-full items-start justify-between">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className="relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                <i className="bx bxs-copy-list text-[20px]" />
                              </div>

                              {/* Info */}
                              <div className="flex flex-col">
                                <h3 className="outfit-700 text-[14px] leading-tight font-bold text-[#1a1f36]">
                                  {quiz.quizName ||
                                    baseQuiz.title ||
                                    "Untitled Quiz"}
                                </h3>
                                <div className="outfit-500 mt-1 flex flex-col text-[12px]">
                                  {/* Mobile Combined Date */}
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <i className="bx bx-calendar text-[14px] text-[#1a1f36]/60" />
                                    <span>
                                      {displayStart && displayEnd
                                        ? (() => {
                                            const sDate = new Date(
                                              displayStart,
                                            );
                                            const dDate = new Date(displayEnd);
                                            const sameMonthAndYear =
                                              sDate.getMonth() ===
                                                dDate.getMonth() &&
                                              sDate.getFullYear() ===
                                                dDate.getFullYear();
                                            const sMonth =
                                              sDate.toLocaleDateString(
                                                "en-US",
                                                { month: "short" },
                                              );
                                            const sDay = sDate.getDate();
                                            const dMonth =
                                              dDate.toLocaleDateString(
                                                "en-US",
                                                { month: "short" },
                                              );
                                            const dDay = dDate.getDate();
                                            const year = dDate.getFullYear();

                                            if (sameMonthAndYear) {
                                              return `${sMonth} ${sDay} - ${dDay}, ${year}`;
                                            }
                                            return `${sMonth} ${sDay} - ${dMonth} ${dDay}, ${year}`;
                                          })()
                                        : "No dates set"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Stats & Actions */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-1">
                            {/* Analytics */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                                <i className="bx bx-target-lock text-[14px] text-[#1a1f36]/60" />
                                <span>{avgAccuracy.toFixed(1)}% Accuracy</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const quizForOverview = baseQuiz;
                                  navigate("/quiz-overview", {
                                    state: {
                                      quiz: quizForOverview,
                                      subject:
                                        quiz.personalQuiz?.subject ||
                                        baseQuiz.subject ||
                                        classInfo?.subject ||
                                        null,
                                      classPersonalQuizID:
                                        quiz.classPersonalQuizID,
                                    },
                                  });
                                }}
                                className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-200 active:bg-gray-300"
                                aria-label="Manage"
                              >
                                <i className="bx bx-edit text-lg" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDates(quiz);
                                }}
                                className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-200 active:bg-gray-300"
                                aria-label="Settings"
                              >
                                <i className="bx bx-cog text-lg" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Fixed Assign Quizzes button (mobile: fixed above bottom nav; desktop: in-flow) - only when on quizzes tab */}
              <button
                type="button"
                onClick={handleOpenAssignQuizzes}
                className="outfit-400 fixed right-6 bottom-6 z-[60] mt-0 hidden cursor-pointer items-center rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white shadow-lg transition-colors hover:bg-orange-600 lg:inline-flex"
                aria-label="Assign Quiz"
              >
                <i className="bx bx-plus mr-2 lg:text-lg" />
                <span className="hidden lg:block">Assign Quiz</span>
              </button>

              <div className="fixed right-4 bottom-[110px] z-50 lg:hidden">
                <button
                  type="button"
                  onClick={handleOpenAssignQuizzes}
                  className="outfit-400 flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 p-4 text-[14px] font-medium text-white shadow-xl transition-colors hover:bg-orange-600"
                >
                  <i className="bx bx-plus text-[22px]" />
                </button>
              </div>

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
                <div className="outfit-400 flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="loader mx-auto mb-2"></div>
                  </div>
                </div>
              ) : quizResults.length === 0 ? (
                <div className="outfit-400 flex h-80 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:border">
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
                      {quizResults.length === 1 ? "Quiz" : "Quizzes"} with
                      Results
                    </p>
                  </div>

                  <div className="space-y-4">
                    {quizResults.map((item) => (
                      <div
                        key={item.classPersonalQuizID}
                        className="outfit-400 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
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
                                <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-600 uppercase">
                                  Student
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                                  Best Score
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                                  Best Percentage
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                                  Attempts
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
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
                                  <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-gray-700">
                                    {studentResult.highestAttempt?.score} /{" "}
                                    {studentResult.highestAttempt?.total_score}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-800">
                                    {typeof studentResult.highestAttempt
                                      ?.percentage === "number"
                                      ? studentResult.highestAttempt.percentage.toFixed(
                                          1,
                                        )
                                      : parseFloat(
                                          studentResult.highestAttempt
                                            ?.percentage || 0,
                                        ).toFixed(1)}
                                    %
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-gray-700">
                                    {studentResult.totalAttempts}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-gray-600">
                                    {formatDate(
                                      studentResult.highestAttempt
                                        ?.submitted_at,
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
            <div
              className="lightbox-bg fixed inset-0 z-60 flex items-center justify-center px-4"
              onClick={() => setIsAssignQuizzesModalOpen(false)}
            >
              <div
                className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="flex items-start justify-between border-b border-gray-200 px-6 py-5"
                  style={{ background: "#fff8f5" }}
                >
                  <div>
                    <h2 className="outfit-700 text-[18px] font-bold text-gray-900">
                      Assign Quiz
                    </h2>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      Select a quiz to assign to{" "}
                      <span className="font-semibold text-gray-700">
                        {classInfo?.className || "this class"}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAssignQuizzesModalOpen(false)}
                    className="ml-4 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                  >
                    <i className="bx bx-x text-xl" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
                  {/* Search */}
                  <div className="relative">
                    <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-9 text-sm text-gray-900 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                      value={quizSearchTerm}
                      onChange={(e) => setQuizSearchTerm(e.target.value)}
                    />
                    {quizSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setQuizSearchTerm("")}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="bx bx-x text-lg" />
                      </button>
                    )}
                  </div>

                  {/* Dates row */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        Start Date{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <div className="relative">
                        <i className="bx bx-calendar absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input
                          type="datetime-local"
                          value={quizStartDate}
                          onChange={(e) => setQuizStartDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm text-gray-900 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        Deadline{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <div className="relative">
                        <i className="bx bxs-calendar-check absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input
                          type="datetime-local"
                          value={quizDeadlineDate}
                          onChange={(e) => setQuizDeadlineDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm text-gray-900 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                        />
                      </div>
                      {/* Quick deadline buttons */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          { label: "1 Day", days: 1 },
                          { label: "3 Days", days: 3 },
                          { label: "1 Week", days: 7 },
                        ].map(({ label, days }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              const base = quizStartDate
                                ? new Date(quizStartDate)
                                : new Date();
                              base.setDate(base.getDate() + days);
                              const yyyy = base.getFullYear();
                              const mm = String(base.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const dd = String(base.getDate()).padStart(
                                2,
                                "0",
                              );
                              const hh = String(base.getHours()).padStart(
                                2,
                                "0",
                              );
                              const min = String(base.getMinutes()).padStart(
                                2,
                                "0",
                              );
                              setQuizDeadlineDate(
                                `${yyyy}-${mm}-${dd}T${hh}:${min}`,
                              );
                            }}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600 transition hover:bg-orange-100"
                          >
                            +{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {quizError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                      <i className="bx bx-error-circle" />
                      {quizError}
                    </div>
                  )}

                  {/* Loading / Empty / List */}
                  {isQuizzesLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="loader mx-auto" />
                    </div>
                  ) : filteredQuizzes.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
                      <p className="text-[13px] text-gray-500">
                        {quizSearchTerm.trim()
                          ? `No quizzes found matching "${quizSearchTerm}".`
                          : "No available quizzes to assign to this class."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredQuizzes.map((quiz) => {
                        const id = quiz.personalQuizID || quiz.quizID;
                        const isSelected = selectedQuizId === id;
                        const isCustom = !quiz.subjectID && !quiz.subject;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              setSelectedQuizId(isSelected ? null : id)
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <i className="bx bx-check text-[12px] text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="outfit-600 truncate text-[13px] font-semibold text-gray-900">
                                {quiz.title || "Untitled Quiz"}
                              </p>
                              {quiz.description && (
                                <p className="mt-0.5 line-clamp-1 text-[12px] text-gray-500">
                                  {quiz.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                isCustom
                                  ? "bg-purple-50 text-purple-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {isCustom
                                ? "Custom"
                                : quiz.subject?.subjectCode || "Subject"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="outfit-400 flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsAssignQuizzesModalOpen(false)}
                    disabled={isAssigningQuiz}
                    className="cursor-pointer text-[14px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignQuiz}
                    disabled={!selectedQuizId || isAssigningQuiz}
                    className={`outfit-400 inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
                      !selectedQuizId || isAssigningQuiz
                        ? "cursor-not-allowed bg-orange-300"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {isAssigningQuiz ? "Assigning..." : "Assign Quiz"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Archive Class Confirmation Modal (same as Class.jsx) */}
          <ConfirmModal
            isOpen={isArchiveModalOpen}
            onClose={() => {
              setIsArchiveModalOpen(false);
              setArchivingClass(null);
            }}
            onConfirm={handleArchiveConfirm}
            message={
              archivingClass
                ? `Are you sure you want to archive "${archivingClass.className}"? This will make the class inactive and it will be moved to archived classes.`
                : "Are you sure you want to archive this class?"
            }
            isLoading={isArchiving}
          />

          {/* Edit Class Modal (same as Class.jsx) */}
          <EditClassModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingClass(null);
            }}
            onSuccess={handleClassUpdated}
            classData={editingClass}
          />

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
          {/* Unassign Quiz Warning Modal */}
          <WarningModal
            isOpen={isUnassignModalOpen}
            onClose={() => {
              setIsUnassignModalOpen(false);
              setQuizToUnassign(null);
            }}
            title="Unassign quiz"
            subtitle={
              quizToUnassign
                ? `"${quizToUnassign.quizName}" will be removed from this class.`
                : undefined
            }
            description={
              quizToUnassign
                ? "Students will no longer see or be able to take this quiz in this class. You can assign it again later."
                : "This quiz will be removed from the class. You can assign it again later."
            }
            confirmLabel="Unassign Quiz"
            confirmIcon={<i className="bx bx-trash text-lg" />}
            onConfirm={handleConfirmUnassignQuiz}
            cancelLabel="Cancel"
            isConfirmLoading={isUnassigningQuiz}
          />
          {/* Quiz Settings Modal (read-only view for this class + Unassign at bottom) */}
          {isEditDatesModalOpen && quizToEditDates && (
            <QuizSettingsModal
              viewOnly={true}
              classPersonalQuizID={quizToEditDates.classPersonalQuizID}
              quizTitle={quizToEditDates.quizName || "Quiz"}
              classDisplayName={classInfo?.className ?? ""}
              isFormOpen={isEditDatesModalOpen}
              setIsFormOpen={(open) => {
                if (!open) {
                  setQuizToEditDates(null);
                }
                setIsEditDatesModalOpen(open);
              }}
              onSuccess={() => {
                fetchAssignedQuizzes();
              }}
              onUnassign={() => {
                const quiz = quizToEditDates;
                setIsEditDatesModalOpen(false);
                setQuizToEditDates(null);
                setQuizToUnassign(quiz);
                setIsUnassignModalOpen(true);
              }}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ClassContent;
