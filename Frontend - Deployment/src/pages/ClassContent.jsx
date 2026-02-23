import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/confirmModal";
import EditClassModal from "../components/EditClassModal";
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
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4",
  "#ec4899", "#6366f1", "#f97316", "#14b8a6", "#a855f7",
];
const getInitialsBgColor = (str) => {
  if (!str || typeof str !== "string") return INITIALS_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
};

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
  const [editStartDate, setEditStartDate] = useState("");
  const [editDeadlineDate, setEditDeadlineDate] = useState("");
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivingClass, setArchivingClass] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [classes, setClasses] = useState([]);

  // Get user role on mount
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  // Fetch classes (same API as Class.jsx) to get schedule and class shape for edit/archive
  useEffect(() => {
    const fetchClasses = async () => {
      if (!classID || userRole === null) return;

      try {
        const token = sessionStorage.getItem("token");
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
    classes.find(
      (c) => String(c.classID ?? c.id) === String(classID)
    ) || null;

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

  // Refresh classes list (same as Class.jsx) so schedule and currentClass stay in sync
  const refreshClasses = () => {
    if (!classID || userRole === null) return;

    const doFetch = async () => {
      try {
        const token = sessionStorage.getItem("token");
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
      const token = sessionStorage.getItem("token");
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
          "error"
        );
      }
    } catch (err) {
      showToast(
        err.message ||
          "There was a problem archiving the class. Please try again.",
        "error"
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
        ? { ...classItem, classID: classItem.classID ?? classItem.id ?? classID }
        : null
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

  // Current user from session (for creator card)
  const sessionUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const creatorFullName =
    sessionUser?.firstName != null || sessionUser?.lastName != null
      ? [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ").trim() || "User"
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
            <p className="text-[14px] text-gray-600">Loading class content</p>
          </div>
        </div>
      ) : (
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4">
          {/* Two-card header */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            {/* Left: Class Information Card with colored background */}
            <div
              className="relative min-h-[160px] overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat py-6 px-6"
              style={{
                backgroundImage: `url(${getHeaderBackground(classID)})`,
              }}
            >
              <div className="relative z-10 flex h-full flex-col">
               
                <div className="pr-16">
                  <h1 className="outfit-500 text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-2xl">
                    {classInfo ? classInfo.className : "Class Name"}
                  </h1>
                  <p className="mt-1 text-[14px] outfit-400 font-normal text-white/95">
                    {currentClass?.schedule ?? classInfo?.schedule ?? "Class schedule"}
                  </p>
                </div>
                <div className="mt-auto flex items-end justify-between  ">
                  <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-white px-2 py-0.5">
                    <span className="truncate text-[12px] font-semibold whitespace-nowrap text-black uppercase">
                      Class Code - {currentClass?.classCode ?? classInfo?.classCode ?? "—"}
                    </span>
                  </div>

                  {/* Button group */}
                  <div className="flex items-center gap-2 -mb-2">
                    <button
                      type="button"
                      onClick={handleArchiveClick}
                      className="flex items-center cursor-pointer hover:bg-gray-100 justify-center text-[14px] outfit-400 bg-white rounded-full text-gray-800 py-2 px-4"
                    >
                      <i className="bx bx-archive text-gray-800 text-[16px] mr-2"></i>
                      Archive class
                    </button>

                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="flex items-center cursor-pointer hover:bg-gray-100 justify-center text-[14px] outfit-400 bg-white rounded-full text-gray-800 py-2 px-4"
                    >
                      <i className="bx bx-edit text-gray-800 text-[16px] mr-2"></i>
                      Edit class details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Class Creator Card - current user from session */}
            <div className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 lg:w-56">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl font-semibold text-white"
                style={{ backgroundColor: creatorAvatarBg }}
              >
                {creatorInitials}
              </div>
              <p className="mt-3 text-center text-[16px] outfit-500 font-normal text-gray-900">
                {creatorFullName}
              </p>
              <p className="mt-1 text-center text-[12px] outfit-500 text-gray-600">
                {subjectDisplay}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-6 border-b border-gray-200 pb-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("quizzes");
                if (assignedQuizzes.length === 0) fetchAssignedQuizzes();
              }}
              className={`outfit-500 border-b-3 pb-3 cursor-pointer text-[14px] font-medium transition-colors ${
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
              className={`outfit-500 border-b-3 pb-3 cursor-pointer text-[14px] font-medium transition-colors ${
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
          <div className="outfit-500 relative -mt-2 mb-2 text-[14px]">
            <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-500"></i>
            <input
              type="text"
              placeholder="Search students..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
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
        )}

        {/* Tab content */}
        {activeTab === "students" ? (
          <div>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="outfit-400 flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-[14px] text-gray-600">Loading students...</p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="outfit-400 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
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
                

                {/* Students Table */}
                <div className="outfit-400 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-6 py-3 w-[50%] text-left text-[14px] outfit-400 font-medium  tracking-wider text-gray-600">
                            Student
                          </th>
                          <th className="px-6 py-3  w-[10%] text-center text-[14px] outfit-400 font-medium  tracking-wider text-gray-600">
                            Program
                          </th>
                          <th className="px-6 py-3 w-[15%]  text-center text-[14px] outfit-400 font-medium  tracking-wider text-gray-600">
                            Enrolled Date
                          </th>
                          <th className="px-6 py-3 w-[15%]  text-center text-[14px] outfit-400 font-medium  tracking-wider text-gray-600">
                            Quizzes Answered
                          </th>
                          <th className="px-6 py-3 w-[10%]  text-right text-[14px] outfit-400 font-medium  tracking-wider text-gray-600">
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
                                    <div className="text-sm outfit-500 text-gray-900">
                                      {student.firstName} {student.lastName}
                                    </div>
                                    <div className="mt-0.5 flex outfit-400 items-center gap-2 text-xs text-gray-500">
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
                              <td className="px-6 py-4 outfit-400 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900">
                                  {student.program || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 outfit-400 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600">
                                  {enrolledDate}
                                </span>
                              </td>
                              <td className="px-6 py-4 outfit-400 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900">
                                  {student.quizProgress || 
                                   (student.quizzesCompleted !== undefined && student.totalQuizzes !== undefined
                                     ? `${student.quizzesCompleted}/${student.totalQuizzes}`
                                     : "—")}
                                </span>
                              </td>
                              <td className="px-6 py-4 outfit-500 whitespace-nowrap text-right">
                                <div className="flex justify-end">
                                  <button
                                    onClick={(e) => handleRemoveClick(student, e)}
                                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 cursor-pointer"
                                    title="Remove Student"
                                  >
                                    <i className="bx bx-trash text-[16px]"></i>
                                    <span className="text-[12px]">Remove</span>
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
          <div>
            {assignedError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {assignedError}
              </div>
            )}

            {isAssignedLoading ? (
              <div className="outfit-400 flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="loader mx-auto mb-2"></div>
                  <p className="text-[14px] text-gray-600">
                    Loading assigned quizzes...
                  </p>
                </div>
              </div>
            ) : assignedQuizzes.length === 0 ? (
              <div className="outfit-400 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
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
                

                <div className="outfit-400 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-4 py-2 w-[40%] text-left text-[14px] font-medium tracking-wider text-gray-600 ">
                            Quiz Name
                          </th>
                          <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600 ">
                            Start Date
                          </th>
                          <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600 ">
                            End Date
                          </th>
                          <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600 ">
                            Attempts
                          </th>
                          <th className="px-2 py-2 w-[10%] text-center text-[14px] font-medium tracking-wider text-gray-600 ">
                            Accuracy
                          </th>
                          <th className="px-4 py-2 w-[30%] text-right text-[14px] font-medium tracking-wider text-gray-600 ">
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
                              
                              <td className="cursor-pointer px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {quiz.quizName || baseQuiz.title || "Untitled Quiz"}
                                  </div>
                                  
                                </div>
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                {quiz.startDate ? start : "Not set"}
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                {quiz.deadlineDate ? deadline : "Not set"}
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-700">
                                {totalAttempts}
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-center">
                                <div className="text-xs text-gray-700">
                                 
                                  {avgAccuracy.toFixed(2)}%
                                </div>
                              </td>
                              <td className="px-2 py-4 outfit-500 whitespace-nowrap text-right">
                                <div className="flex justify-end gap-2">
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
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100"
                                  >
                                    <i className="bx bx-caret-right text-sm" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDates(quiz)}
                                    className="flex cursor-pointer items-center gap-1.5 mr-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                  >
                                    <i className="bx bx-cog text-sm" />
                                    <span>Settings</span>
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

            {/* Fixed Assign Quizzes button - only when on quizzes tab */}
            <button
              type="button"
              onClick={handleOpenAssignQuizzes}
              className="outfit-400 fixed bottom-6 right-6 z-20 inline-flex cursor-pointer items-center rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white shadow-lg transition-colors hover:bg-orange-600"
              aria-label="Assign Quizzes"
            >
              <i className="bx bx-plus mr-2 text-lg" />
              Assign Quizzes
            </button>

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
                  <p className="text-[14px] text-gray-600">
                    Loading quiz results...
                  </p>
                </div>
              </div>
            ) : quizResults.length === 0 ? (
              <div className="outfit-400 flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
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
                  <div className="outfit-400 flex h-40 items-center justify-center">
                    <div className="text-center">
                      <div className="loader mx-auto mb-2"></div>
                      <p className="text-[14px] text-gray-600">
                        Loading available quizzes...
                      </p>
                    </div>
                  </div>
                ) : filteredQuizzes.length === 0 ? (
                  <div className="outfit-400 flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
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

                    <div className="outfit-400 overflow-hidden rounded-xl border border-gray-200">
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
                  className="outfit-400 inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isAssigningQuiz}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAssignQuiz}
                  disabled={!selectedQuizId || isAssigningQuiz}
                  className={`outfit-400 inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
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
        {/* Quiz Settings Modal (dates + unassign) */}
        {isEditDatesModalOpen && quizToEditDates && (
          <div className="fixed inset-0 z-40 flex items-center justify-center lightbox-bg px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="outfit-500 text-[18px] text-gray-900">
                    Settings
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    <span className="font-semibold text-gray-700">
                      {quizToEditDates.quizName || "this quiz"}
                    </span>
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
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuizToUnassign(quizToEditDates);
                      setIsEditDatesModalOpen(false);
                      setQuizToEditDates(null);
                      setEditStartDate("");
                      setEditDeadlineDate("");
                      setIsUnassignModalOpen(true);
                    }}
                    className="outfit-400 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <i className="bx bx-trash text-sm" />
                    Unassign
                  </button>
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
                  className="outfit-400 inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isUpdatingDates}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateDates}
                  disabled={isUpdatingDates}
                  className={`outfit-400 inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
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
      )}
    </>
  );
};

export default ClassContent;
