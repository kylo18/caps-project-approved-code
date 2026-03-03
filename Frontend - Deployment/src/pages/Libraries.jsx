import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import MyQuizzezIcon from "/src/assets/symbols/myquiz.svg";
import MyQuizzezIconH from "/src/assets/symbols/myquizhover.svg";

import SharedWithMeIcon from "/src/assets/symbols/share.svg";
import SharedWithMeIconH from "/src/assets/symbols/sharehover.svg";

import AllActivitiesIcon from "/src/assets/symbols/all.svg";
import AllActivitiesIconH from "/src/assets/symbols/allhover.svg";

import CollectionsIcon from "/src/assets/symbols/collection.svg";
import CollectionsIconH from "/src/assets/symbols/collectionhover.svg";

import ArchiveIcon from "/src/assets/symbols/archive.svg";
import SessionIcon from "/src/assets/symbols/sessions.svg";
import ArchiveIconH from "/src/assets/symbols/archivehover.svg";

import EditIcon from "/src/assets/symbols/myquiz.svg";
import emptyImage from "../assets/icons/empty.png";

import SharedWithMe from "./SharedWithMe";
import AllActivities from "./AllActivities";
import Collections from "./Collections";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import SearchBar, { SearchBarTrigger } from "../components/SearchBar";

function Libraries() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [activeView, setActiveView] = useState("my-quizzes");
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instruction: "",
    quiz_type_id: "",
    subjectID: "",
    coverage_id: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(false);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const kebabMenuRef = useRef(null);
  const kebabButtonRefs = useRef({});
  const [dropdownButtonRect, setDropdownButtonRect] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    instruction: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [archivingQuizId, setArchivingQuizId] = useState(null);

  // Multi-selection state
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  const subjectsPath =
    Number(roleId) === 2
      ? "/faculty/subjects"
      : Number(roleId) === 3
        ? "/program-chair/subjects"
        : "/dean/subjects";
  const [dropdownPositions, setDropdownPositions] = useState({});

  // Array of 5 dark colors for header sections
  const headerColors = [
    "#1e3a5f", // Dark blue
    "#7f1d1d", // Dark red
    "#1e293b", // Dark slate
    "#422006", // Dark brown/amber
    "#312e81", // Dark indigo
  ];

  // Function to get a random color for a quiz (consistent based on quiz ID)
  const getHeaderColor = (quizId) => {
    if (!quizId) return headerColors[0];
    // Use quiz ID to get a consistent color for the same quiz
    const index = quizId % headerColors.length;
    return headerColors[index];
  };

  // Calculate total steps: subject-based = 5 (Basic, Type, Subject, Coverage, Review), custom = 3 (Basic, Type, Review)
  const totalSteps = formData.quiz_type_id === "1" ? 5 : 3;

  // Reset step when form is closed/opened
  useEffect(() => {
    if (!showForm) {
      setCurrentStep(1);
    }
  }, [showForm]);

  const fetchQuizzes = async () => {
    setIsQuizzesLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes`,
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
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          errorMessage = `HTTP error! Status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch quizzes");
      }

      if (!Array.isArray(data.quizzes)) {
        console.error("Unexpected quizzes data format:", data);
        throw new Error("Invalid response format.");
      }

      setQuizzes(data.quizzes || []);
      setFilteredQuizzes(data.quizzes || []);
    } catch (err) {
      const msg = err.message || "Failed to load quizzes. Please try again.";
      setError(msg);
      showToast(msg, "error");
      console.error("Error loading quizzes:", err);
    } finally {
      setIsQuizzesLoading(false);
    }
  };

  // Fetch quizzes on component mount
  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter quizzes based on search term (and exclude archived from main view)
  useEffect(() => {
    // Exclude archived quizzes from "My quizzes" view
    let filtered = quizzes.filter((quiz) => !quiz.isArchived);

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          quiz.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim()) ||
          (quiz.subject &&
            (quiz.subject.subjectCode
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase().trim()) ||
              quiz.subject.subjectName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase().trim()))),
      );
    }

    setFilteredQuizzes(filtered);
  }, [searchTerm, quizzes]);

  // Close kebab menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedButton = Object.values(kebabButtonRefs.current).find(
        (ref) => ref && ref.contains(event.target),
      );

      if (!clickedButton && openKebabMenu) {
        // Check if click is outside the portal dropdown
        const dropdownElement = document.querySelector(
          ".fixed.z-50.min-w-\\[120px\\]",
        );
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setOpenKebabMenu(null);
          setDropdownButtonRect(null);
        }
      }
    };

    const handleScroll = () => {
      if (openKebabMenu) {
        setOpenKebabMenu(null);
        setDropdownButtonRect(null);
      }
    };

    if (openKebabMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openKebabMenu]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsSubjectsLoading(true);
      setError(null); // Clear any previous errors

      try {
        // Get the token from localStorage (matching your pattern)
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/subjects/all`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include", // Still include for potential session fallback
          },
        );

        if (!response.ok) {
          // If 401, token might be expired or invalid
          if (response.status === 401) {
            // Clear token and show error
            sessionStorage.removeItem("token");
            throw new Error("Your session has expired. Please log in again.");
          }

          // Try to get error message from response
          let errorMessage = "Failed to load subjects.";
          try {
            const errorData = await response.json();
            errorMessage =
              errorData?.message || errorData?.error || errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, use status text
            errorMessage = `HTTP error! Status: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch subjects");
        }

        if (!Array.isArray(data.subjects)) {
          console.error("Unexpected subjects data format:", data);
          throw new Error("Invalid response format.");
        }

        // Sort subjects similar to your pattern
        const sortedSubjects = [...data.subjects].sort((a, b) => {
          // First sort by program name
          const programCompare = (a.programName || "").localeCompare(
            b.programName || "",
          );
          if (programCompare !== 0) return programCompare;

          // If programs are the same, sort by subject code
          return (a.subjectCode || "").localeCompare(b.subjectCode || "");
        });

        setSubjects(sortedSubjects);
      } catch (err) {
        // Set error state so user can see what went wrong
        setError(err.message || "Failed to load subjects. Please try again.");
        console.error("Error loading subjects:", err);
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // If switching away from subject-based quiz, clear subject selection
      if (name === "quiz_type_id" && value === "2") {
        updated.subjectID = "";
        // If we're on step 3 (subject selection) and switch to custom, go back to step 2
        if (currentStep === 3) {
          setCurrentStep(2);
        }
      }

      return updated;
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          setError("Title is required.");
          return false;
        }
        return true;
      case 2:
        if (!formData.quiz_type_id) {
          setError("Please select a quiz type.");
          return false;
        }
        return true;
      case 3:
        if (formData.quiz_type_id === "1" && !formData.subjectID) {
          setError("Please select a subject for a subject-based quiz.");
          return false;
        }
        return true;
      case 4:
        if (formData.quiz_type_id === "1" && !formData.coverage_id) {
          setError("Please select a coverage.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      // For custom quiz: Step 2 (Type) -> Step 3 (Coverage) -> Step 4 (Review)
      // For subject-based: Step 2 (Type) -> Step 3 (Subject) -> Step 4 (Coverage) -> Step 5 (Review)
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instruction: "",
      quiz_type_id: "",
      subjectID: "",
      coverage_id: "",
    });
    setCurrentStep(1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Final validation
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    if (formData.quiz_type_id === "1" && !validateStep(3)) {
      return;
    }

    if (formData.quiz_type_id === "1" && !validateStep(4)) {
      return;
    }

    // Coverage is only required for subject-based quizzes
    if (formData.quiz_type_id === "1" && !formData.coverage_id) {
      setError("Please select a coverage.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the token from localStorage (matching your pattern)
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        instruction: formData.instruction || null,
        quiz_type_id: Number(formData.quiz_type_id),
        subjectID: formData.subjectID ? Number(formData.subjectID) : null,
        coverage_id:
          formData.quiz_type_id === "1" && formData.coverage_id
            ? Number(formData.coverage_id)
            : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem creating the quiz. Please try again.";

        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
          // If there are validation errors, show them
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            message = errorMessages.join(", ") || message;
          }
        } catch {
          // ignore JSON parse error and use default message
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data?.success) {
        showToast("Personal quiz created successfully.", "success");
        resetForm();
        setShowForm(false);
        fetchQuizzes();
      } else {
        throw new Error(data?.message || "Failed to create quiz.");
      }
    } catch (err) {
      const msg =
        err.message ||
        "There was a problem creating the quiz. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (quiz) => {
    setEditingQuiz(quiz);
    setEditFormData({
      title: quiz.title || "",
      description: quiz.description || "",
      instruction: quiz.instruction || "",
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    try {
      if (!editFormData.title.trim()) {
        setError("Title is required.");
        setIsUpdating(false);
        return;
      }

      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const quizID = editingQuiz.id || editingQuiz.personalQuizID;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/update-personal-quizzes/${quizID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            title: editFormData.title.trim(),
            description: editFormData.description || null,
            instruction: editFormData.instruction || null,
          }),
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem updating the quiz. Please try again.";

        try {
          const data = await response.json();
          if (data?.message) {
            message = data.message;
          }
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            message = errorMessages.join(", ") || message;
          }
        } catch {
          // ignore JSON parse error and use default message
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data?.quiz) {
        // Update the quiz in the quizzes array
        setQuizzes((prevQuizzes) =>
          prevQuizzes.map((q) =>
            (q.id || q.quizID) === quizID ? { ...q, ...data.quiz } : q,
          ),
        );

        showToast("Quiz updated successfully.", "success");
        setShowEditModal(false);
        setEditingQuiz(null);
        setEditFormData({ title: "", description: "", instruction: "" });
      } else {
        throw new Error(data?.message || "Failed to update quiz.");
      }
    } catch (err) {
      const msg =
        err.message ||
        "There was a problem updating the quiz. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveQuiz = async (quiz) => {
    try {
      setError(null);

      const quizID =
        quiz.id || quiz.personalQuizID || quiz.quizID || quiz.quiz_id;

      if (!quizID) {
        setError("Unable to determine quiz ID for archiving.");
        return;
      }

      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      setArchivingQuizId(quizID);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/${quizID}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "There was a problem archiving the quiz. Please try again.";

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

      // Update local state to mark quiz as archived
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((q) => {
          const currentId = q.id || q.personalQuizID || q.quizID || q.quiz_id;
          if (currentId === quizID) {
            return {
              ...q,
              ...(data.quiz || {}),
              isArchived:
                data.quiz && typeof data.quiz.isArchived !== "undefined"
                  ? data.quiz.isArchived
                  : true,
            };
          }
          return q;
        }),
      );

      showToast(
        data.message || "Personal quiz archived successfully.",
        "success",
      );

      // If this quiz was selected, remove it so banner count updates immediately
      setSelectedQuizzes((prev) => prev.filter((id) => id !== quizID));
    } catch (err) {
      const msg =
        err.message ||
        "There was a problem archiving the quiz. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setArchivingQuizId(null);
    }
  };

  // Handle individual checkbox selection
  const handleQuizCheckboxChange = (quizID, isChecked) => {
    if (isChecked) {
      setSelectedQuizzes((prev) => [...prev, quizID]);
    } else {
      setSelectedQuizzes((prev) => prev.filter((id) => id !== quizID));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedQuizzes(
        filteredQuizzes.map(
          (quiz) =>
            quiz.id || quiz.quizID || quiz.personalQuizID || quiz.quiz_id,
        ),
      );
    } else {
      setSelectedQuizzes([]);
    }
  };

  // Count how many filtered quizzes are selected
  const selectedFilteredCount = filteredQuizzes.filter((quiz) => {
    const quizID =
      quiz.id || quiz.quizID || quiz.personalQuizID || quiz.quiz_id;
    return selectedQuizzes.includes(quizID);
  }).length;

  // Check if all visible quizzes are selected
  const isAllSelected =
    filteredQuizzes.length > 0 &&
    selectedFilteredCount === filteredQuizzes.length;

  // Check if some (but not all) visible quizzes are selected
  const isIndeterminate =
    filteredQuizzes.length > 0 &&
    selectedFilteredCount > 0 &&
    selectedFilteredCount < filteredQuizzes.length;

  // Handle archive selected quizzes
  const handleArchiveSelected = async () => {
    if (selectedQuizzes.length === 0) return;

    const token = sessionStorage.getItem("token");
    const countToArchive = selectedQuizzes.length;
    setArchivingQuizId("bulk");

    try {
      // Archive quizzes one by one (or use bulk endpoint if available)
      const archivePromises = selectedQuizzes.map(async (quizID) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes/${quizID}/archive`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to archive quiz ${quizID}`);
        }

        return response.json();
      });

      await Promise.all(archivePromises);

      // Refetch quizzes to update the list
      const fetchQuizzes = async () => {
        const token = sessionStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/personal-quizzes`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQuizzes(data.quizzes || []);
            setFilteredQuizzes(data.quizzes || []);
          }
        }
      };

      await fetchQuizzes();
      setSelectedQuizzes([]);
      showToast(
        `${countToArchive} quiz${countToArchive === 1 ? "" : "zes"} archived successfully`,
        "success",
      );
    } catch (error) {
      const msg =
        error.message ||
        "An error occurred while archiving quizzes. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setArchivingQuizId(null);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Library left panel (only visible on Libraries page) */}
      <aside className="fixed top-0 left-[63px] hidden h-screen w-56 overflow-hidden border-r border-gray-200 bg-white px-4 py-4 lg:block lg:w-64">
        <h2 className="outfit-500 mb-4 text-[16px] tracking-wide text-black">
          Library
        </h2>

        <nav className="outfit-500 space-y-1 text-[15px]">
          <button
            type="button"
            onClick={() => setActiveView("my-quizzes")}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
              activeView === "my-quizzes"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  activeView === "my-quizzes" ? MyQuizzezIconH : MyQuizzezIcon
                }
                alt="My Quizzez"
                className="h-4 w-4"
              />
              <span>My quizzes</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => alert("Coming soon")}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
              activeView === "shared-with-me"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  activeView === "shared-with-me"
                    ? SharedWithMeIconH
                    : SharedWithMeIcon
                }
                alt="Shared with me"
                className="h-4 w-4"
              />
              <span>Shared with me</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/archived-quiz")}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
              activeView === "archive"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={activeView === "archive" ? ArchiveIconH : ArchiveIcon}
                alt="archive"
                className="h-4 w-4"
              />
              <span>Archive</span>
            </span>
          </button>
        </nav>

        <div className="my-4 h-px bg-gray-200" />

        <div className="outfit-500 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveView("collections")}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
              activeView === "collections"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  activeView === "collections"
                    ? CollectionsIconH
                    : CollectionsIcon
                }
                alt="Collections"
                className="h-4 w-4"
              />
              <span>Collections</span>
            </span>
            <span className="text-xs text-gray-500">0</span>
          </button>
        </div>
      </aside>

      {/* Main Libraries content */}
      {activeView === "my-quizzes" && (
        <div className="scrollbar-hide mt-10 flex h-screen flex-1 flex-col gap-6 overflow-y-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] md:px-4 lg:mt-0 lg:ml-64 [&::-webkit-scrollbar]:hidden">
          <div className="min-w-0 space-y-4 px-4 pt-4 md:pt-6">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quizzes..."
              mobileCollapsible
              showMobileSearch={showSearch}
              onCloseMobileSearch={() => {
                setSearchTerm("");
                setShowSearch(false);
              }}
              inputRef={mobileSearchInputRef}
            />
            <div className="my-4 hidden h-px bg-gray-200 md:block" />
            {/* Header */}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="outfit-500 min-w-0 flex-1 text-[18px] break-words text-black md:-mt-2">
                {selectedQuizzes.length > 0
                  ? `Select the quizzes you want to archive`
                  : searchTerm.trim()
                    ? `Search results for "${searchTerm}"`
                    : `My quizzes (${filteredQuizzes.length})`}
              </p>
              <div className="flex flex-shrink-0 items-center gap-1">
                <SearchBarTrigger
                  isOpen={showSearch}
                  onClick={() => setShowSearch((prev) => !prev)}
                  title="Search quizzes"
                />
                {/* Mobile Archive */}
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  title="Create class"
                  className="outfit-500 -mb-2 hidden cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:inline-flex md:text-[14px] lg:hidden"
                >
                  <i className="bxx bx-plus text-[20px]"></i>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/sessions")}
                  title="Create quiz"
                  className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:text-[14px] lg:hidden"
                >
                  <img src={SessionIcon} alt="" className="size-[22px]" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/archived-quiz")}
                  title="Create class"
                  className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:text-[14px] lg:hidden"
                >
                  <img src={ArchiveIcon} alt="" className="size-[22px]" />
                </button>

                {/* Desktop Create Button */}
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="outfit-400 hidden cursor-pointer items-center rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white hover:bg-orange-600 lg:flex"
                >
                  <i className="bx bx-plus mr-2 text-[16px]" />
                  Create Quiz
                </button>
              </div>
            </div>
          </div>

          <Toast message={toast.message} type={toast.type} show={toast.show} />

          {showForm && (
            <div
              className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center p-4"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              <div
                className="animate-fade-in-up relative mx-auto flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <h2 className="outfit-500 text-[18px] text-gray-900">
                    Create a quiz
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <i className="bx bx-x text-2xl"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
                  <Toast
                    message={toast.message}
                    type={toast.type}
                    show={toast.show}
                  />

                  <div className="mt-2 flex flex-col gap-8 md:flex-row">
                    {/* Stepper section */}
                    <div className="md:w-1/3">
                      {/* Mobile (horizontal) stepper – existing behavior */}
                      <div className="mb-8 md:hidden">
                        <div className="flex items-center justify-between">
                          {Array.from(
                            { length: totalSteps },
                            (_, i) => i + 1,
                          ).map((step, index) => {
                            const isActive = step === currentStep;
                            const isCompleted = step < currentStep;
                            const stepLabel =
                              step === 1
                                ? "Basic Info"
                                : step === 2
                                  ? "Quiz Type"
                                  : step === 3 && formData.quiz_type_id === "1"
                                    ? "Subject"
                                    : step === 3 &&
                                        formData.quiz_type_id === "2"
                                      ? "Review"
                                      : step === 4 &&
                                          formData.quiz_type_id === "1"
                                        ? "Coverage"
                                        : "Review";

                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                                      isActive
                                        ? "border-orange-500 bg-orange-500 text-white"
                                        : isCompleted
                                          ? "border-orange-500 bg-orange-500 text-white"
                                          : "border-gray-300 bg-white text-gray-400"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <i className="bx bx-check text-xl"></i>
                                    ) : (
                                      <span className="outfit-400 text-[18px] font-medium">
                                        {step}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`outfit-500 mt-2 text-[12px] ${
                                      isActive
                                        ? "text-orange-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {stepLabel}
                                  </span>
                                </div>
                                {index < totalSteps - 1 && (
                                  <div
                                    className={`mx-2 -mt-5 h-0.5 flex-1 ${
                                      step < currentStep
                                        ? "bg-orange-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Desktop (vertical) stepper */}
                      <div className="hidden md:flex md:flex-col md:space-y-4">
                        {Array.from(
                          { length: totalSteps },
                          (_, i) => i + 1,
                        ).map((step, index) => {
                          const isActive = step === currentStep;
                          const isCompleted = step < currentStep;
                          const stepLabel =
                            step === 1
                              ? "Basic Info"
                              : step === 2
                                ? "Quiz Type"
                                : step === 3 && formData.quiz_type_id === "1"
                                  ? "Subject"
                                  : step === 3 && formData.quiz_type_id === "2"
                                    ? "Review"
                                    : step === 4 &&
                                        formData.quiz_type_id === "1"
                                      ? "Coverage"
                                      : "Review";

                          return (
                            <div className="flex items-start gap-3" key={step}>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                                    isActive
                                      ? "border-orange-500 bg-orange-500 text-white"
                                      : isCompleted
                                        ? "border-orange-500 bg-orange-500 text-white"
                                        : "border-gray-300 bg-white text-gray-400"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <i className="bx bx-check text-lg"></i>
                                  ) : (
                                    <span className="outfit-400 text-[15px] font-medium">
                                      {step}
                                    </span>
                                  )}
                                </div>
                                {index < totalSteps - 1 && (
                                  <div
                                    className={`mt-1 h-8 w-px ${
                                      step < currentStep
                                        ? "bg-orange-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="pt-1">
                                <div
                                  className={`outfit-500 text-[13px] ${
                                    isActive
                                      ? "text-orange-600"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {stepLabel}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Form section */}
                    <div className="md:w-2/3">
                      <form onSubmit={handleSubmit}>
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                          <div className="space-y-4">
                            <h3 className="outfit-500 mb-4 text-[16px] text-gray-900">
                              Basic Information
                            </h3>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Title <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                maxLength={50}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                                placeholder="Enter quiz title"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Description
                              </label>
                              <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                                placeholder="Short description of this quiz (optional)"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step 2: Quiz Type */}
                        {currentStep === 2 && (
                          <div className="space-y-4">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                              Select Quiz Type
                            </h3>
                            <div className="space-y-3">
                              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                                <input
                                  type="radio"
                                  name="quiz_type_id"
                                  value="1"
                                  checked={formData.quiz_type_id === "1"}
                                  onChange={handleChange}
                                  className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-400"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    Subject-based quiz
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    Create a quiz linked to a specific subject
                                  </div>
                                </div>
                              </label>

                              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                                <input
                                  type="radio"
                                  name="quiz_type_id"
                                  value="2"
                                  checked={formData.quiz_type_id === "2"}
                                  onChange={handleChange}
                                  className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-400"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    Custom quiz
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    Create a standalone quiz without a subject
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Subject Selection (only for subject-based quiz) */}
                        {currentStep === 3 && formData.quiz_type_id === "1" && (
                          <div className="space-y-4">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                              Select Subject
                            </h3>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Subject <span className="text-red-500">*</span>
                              </label>
                              <select
                                name="subjectID"
                                value={formData.subjectID}
                                onChange={handleChange}
                                disabled={
                                  isSubjectsLoading || subjects.length === 0
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                              >
                                <option value="">
                                  {isSubjectsLoading
                                    ? "Loading subjects..."
                                    : subjects.length === 0
                                      ? "No subjects available"
                                      : "Select a subject"}
                                </option>
                                {subjects.map((subject) => (
                                  <option
                                    key={subject.subjectID}
                                    value={subject.subjectID}
                                  >
                                    {subject.subjectCode} -{" "}
                                    {subject.subjectName} ({subject.programName}
                                    , {subject.yearLevel})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Coverage Selection (for subject-based quiz only) */}
                        {currentStep === 4 && formData.quiz_type_id === "1" && (
                          <div className="space-y-4">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                              Select Coverage
                            </h3>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Coverage <span className="text-red-500">*</span>
                              </label>
                              <select
                                name="coverage_id"
                                value={formData.coverage_id}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                              >
                                <option value="">Select coverage</option>
                                <option value="1">Midterms</option>
                                <option value="2">Finals</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Review (for custom quiz) or Step 5: Review (for subject-based quiz) */}
                        {(currentStep === 3 && formData.quiz_type_id === "2") ||
                        (currentStep === 5 && formData.quiz_type_id === "1") ? (
                          <div className="space-y-4">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                              Review Your Quiz
                            </h3>
                            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Title:
                                </span>
                                <p className="mt-1 text-sm text-gray-900">
                                  {formData.title || "—"}
                                </p>
                              </div>
                              {formData.description && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Description:
                                  </span>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {formData.description}
                                  </p>
                                </div>
                              )}
                              {formData.instruction && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Instruction:
                                  </span>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {formData.instruction}
                                  </p>
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Quiz Type:
                                </span>
                                <p className="mt-1 text-sm text-gray-900">
                                  {formData.quiz_type_id === "1"
                                    ? "Subject-based quiz"
                                    : formData.quiz_type_id === "2"
                                      ? "Custom quiz"
                                      : "—"}
                                </p>
                              </div>
                              {formData.quiz_type_id === "1" &&
                                formData.subjectID && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">
                                      Subject:
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900">
                                      {subjects.find(
                                        (s) =>
                                          s.subjectID ===
                                          Number(formData.subjectID),
                                      )?.subjectCode || "—"}{" "}
                                      -{" "}
                                      {subjects.find(
                                        (s) =>
                                          s.subjectID ===
                                          Number(formData.subjectID),
                                      )?.subjectName || "—"}
                                    </p>
                                  </div>
                                )}
                              {formData.quiz_type_id === "1" &&
                                formData.coverage_id && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">
                                      Coverage:
                                    </span>
                                    <p className="mt-1 text-sm text-gray-900">
                                      {formData.coverage_id === "1"
                                        ? "Midterms"
                                        : formData.coverage_id === "2"
                                          ? "Finals"
                                          : "—"}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : null}

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                          <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <i className="bx bx-chevron-left mr-2"></i>
                            Previous
                          </button>

                          <div className="flex gap-3">
                            {currentStep < totalSteps ? (
                              <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                              >
                                Next
                                <i className="bx bx-chevron-right ml-2"></i>
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isSubmitting ? (
                                  <>
                                    <i className="bx bx-loader-alt mr-2 animate-spin"></i>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <i className="bx bx-check mr-2"></i>
                                    Create Quiz
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showForm && (
            <div>
              {isQuizzesLoading ? (
                <div className="outfit-400 flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="loader mx-auto mb-2"></div>
                  </div>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="outfit-400 flex h-80 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:h-130 md:border">
                  <div className="text-center">
                    <img
                      src={emptyImage}
                      alt="No quizzes available"
                      className="mx-auto mb-3 h-32 w-32 opacity-80"
                    />
                    <p className="outfit-400 text-[14px] text-gray-600">
                      {searchTerm.trim() ? (
                        `No quizzes found matching "${searchTerm}"`
                      ) : (
                        <>
                          <span className="md:hidden">
                            No quizzes yet, use the plus icon to create one
                          </span>

                          <span className="hidden md:inline">
                            Your quizzes will appear here. Use the Create Quiz
                            button to create one.
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="outfit-400 mt-4 overflow-hidden bg-white md:rounded-xl md:border md:border-gray-200">
                    <div className="hidden overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] md:block [&::-webkit-scrollbar]:hidden">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-white">
                          <tr>
                            <th className="w-6 px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isAllSelected && !isIndeterminate}
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate = isIndeterminate;
                                  }
                                }}
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                              />
                            </th>
                            <th className="outfit-400 w-[75%] px-2 py-2 text-left text-[14px] text-gray-600">
                              Quiz Information
                            </th>
                            <th className="outfit-400 w-[10%] px-2 py-2 text-center text-[14px] text-gray-600">
                              Questions
                            </th>

                            <th className="outfit-400 w-[15%] px-2 py-2 text-center text-[14px] text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredQuizzes.map((quiz) => {
                            const quizID =
                              quiz.id ||
                              quiz.quizID ||
                              quiz.personalQuizID ||
                              quiz.quiz_id;

                            const createdDate = quiz.created_at
                              ? new Date(quiz.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "—";

                            const createdTime = quiz.created_at
                              ? new Date(quiz.created_at).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "—";

                            const updatedDate = quiz.updated_at
                              ? new Date(quiz.updated_at)
                              : null;
                            const isToday = updatedDate
                              ? updatedDate.toDateString() ===
                                new Date().toDateString()
                              : false;
                            const isYesterday =
                              updatedDate &&
                              updatedDate.toDateString() ===
                                new Date(
                                  new Date().setDate(new Date().getDate() - 1),
                                ).toDateString();

                            const editedDateText = isToday
                              ? "Today"
                              : isYesterday
                                ? "Yesterday"
                                : updatedDate
                                  ? updatedDate.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—";

                            const editedTime = updatedDate
                              ? updatedDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—";

                            const quizTypeName =
                              quiz.quizType?.name ||
                              (quiz.quiz_type_id === 1
                                ? "Subject-based"
                                : "Custom");

                            const headerColor = getHeaderColor(quizID);

                            return (
                              <tr
                                key={quizID}
                                className="group transition-colors hover:bg-gray-50"
                              >
                                <td
                                  className="w-12 px-4 py-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedQuizzes.includes(quizID)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuizCheckboxChange(
                                        quizID,
                                        e.target.checked,
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4 rounded border-gray-500 text-orange-500"
                                  />
                                </td>
                                <td className="px-2 py-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded"
                                      style={{ backgroundColor: headerColor }}
                                    >
                                      <span className="outfit-400 text-[16px] font-semibold text-white">
                                        Q
                                      </span>
                                    </div>
                                    <div>
                                      <div className="outfit-500 text-[14px] font-semibold text-gray-900">
                                        {quiz.title || "Untitled Quiz"}
                                      </div>
                                      <div className="outfit-400 mt-0.5 text-[12px] text-gray-500">
                                        {quiz.subject ? (
                                          <>
                                            {quiz.subject.subjectCode} -{" "}
                                            {quiz.subject.subjectName}
                                          </>
                                        ) : (
                                          <span>{quizTypeName}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="outfit-400 px-2 py-4 text-center whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {quiz.question_count || 0}
                                  </div>
                                </td>

                                <td className="outfit-400 mr-2 w-32 px-2 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    {/* Full buttons on larger screens */}
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          navigate("/quiz-overview", {
                                            state: { quiz },
                                          });
                                        }}
                                        disabled={archivingQuizId !== null}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <img
                                          src={EditIcon}
                                          alt="edit"
                                          className="size-4"
                                        />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!archivingQuizId) {
                                            handleArchiveQuiz(quiz);
                                          }
                                        }}
                                        disabled={archivingQuizId !== null}
                                        className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <img
                                          src={ArchiveIcon}
                                          alt="archive"
                                          className="size-5"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="w-full space-y-0 overflow-hidden rounded-t-2xl border-x border-t border-gray-200 bg-white md:hidden">
                      {filteredQuizzes.map((quiz) => {
                        const quizID =
                          quiz.id ||
                          quiz.quizID ||
                          quiz.personalQuizID ||
                          quiz.quiz_id;

                        const createdDate = quiz.created_at
                          ? new Date(quiz.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "—";

                        const quizTypeName =
                          quiz.quizType?.name ||
                          (quiz.quiz_type_id === 1
                            ? "Subject-based"
                            : "Custom");

                        const headerColor = getHeaderColor(quizID);

                        return (
                          <div
                            key={quizID}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              navigate("/quiz-overview", { state: { quiz } })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate("/quiz-overview", { state: { quiz } });
                              }
                            }}
                            className="flex cursor-pointer items-center gap-3 rounded-t-2xl border-x border-t border-gray-200 bg-white px-4 py-4 first:border-t-0 hover:bg-gray-100 active:bg-gray-50"
                          >
                            <div
                              className="flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded"
                              style={{ backgroundColor: headerColor }}
                            >
                              <span className="outfit-400 text-[16px] font-semibold text-white">
                                Q
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="outfit-500 text-[14px] font-semibold text-gray-900">
                                {quiz.title || "Untitled Quiz"}
                              </div>
                              <div className="outfit-400 text-[12px] text-gray-500">
                                {quiz.subject ? (
                                  <>
                                    {quiz.subject.subjectCode} -{" "}
                                    {quiz.subject.subjectName}
                                  </>
                                ) : (
                                  <span>{quizTypeName} </span>
                                )}
                              </div>
                            </div>
                            <i className="bx bx-chevron-right flex-shrink-0 text-xl text-gray-400"></i>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    className={` ${selectedQuizzes.length > 0 ? "pb-28" : "pb-28 lg:pb-6"}`}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
          )}

          {/* Selection Overlay Banner */}
          {selectedQuizzes.length > 0 && (
            <div className="outfit-400 fixed right-0 bottom-5 left-0 z-50 hidden md:left-[119px] md:block lg:left-[319px]">
              <div className="px-6">
                <div className="rounded-xl bg-gray-800 px-5 py-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[14px] font-medium text-white">
                        {selectedQuizzes.length}{" "}
                        {selectedQuizzes.length === 1 ? "quiz" : "quizzes"}{" "}
                        selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleArchiveSelected}
                        disabled={archivingQuizId !== null}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        <img
                          src={ArchiveIcon}
                          alt="Archive"
                          className="size-[20px]"
                        />
                        Archive
                      </button>
                      <button
                        onClick={() => setSelectedQuizzes([])}
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

          {/* Edit Quiz Modal */}
          {showEditModal && editingQuiz && (
            <div
              className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center p-4"
              onClick={() => {
                setShowEditModal(false);
                setEditingQuiz(null);
                setEditFormData({
                  title: "",
                  description: "",
                  instruction: "",
                });
                setError(null);
              }}
            >
              <div
                className="animate-fade-in-up relative mx-auto flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Quiz
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingQuiz(null);
                      setEditFormData({
                        title: "",
                        description: "",
                        instruction: "",
                      });
                      setError(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <i className="bx bx-x text-2xl"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
                  <Toast
                    message={toast.message}
                    type={toast.type}
                    show={toast.show}
                  />

                  <form onSubmit={handleUpdateQuiz}>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editFormData.title}
                          maxLength={50}
                          onChange={handleEditChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                          placeholder="Enter quiz title"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditChange}
                          className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                          placeholder="Short description of this quiz (optional)"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingQuiz(null);
                          setEditFormData({
                            title: "",
                            description: "",
                            instruction: "",
                          });
                          setError(null);
                        }}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isUpdating ? (
                          <>
                            <i className="bx bx-loader-alt mr-2 animate-spin"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-check mr-2"></i>
                            Update Quiz
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Create Quiz button (mobile only) */}
      {activeView === "my-quizzes" && !showForm && (
        <div className="fixed right-4 bottom-[90px] z-50 md:hidden">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="outfit-400 flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 p-4 text-[14px] font-medium text-white shadow-xl transition-colors hover:bg-orange-600"
          >
            <i className="bx bx-plus text-[22px]" />
          </button>
        </div>
      )}

      {activeView === "shared-with-me" && <SharedWithMe />}
      {activeView === "all-activities" && <AllActivities />}
      {activeView === "collections" && <Collections />}
    </div>
  );
}

export default Libraries;
