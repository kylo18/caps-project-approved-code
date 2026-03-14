import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useNavigate,
  useLocation,
  useOutletContext,
  Link,
} from "react-router-dom";
import RegisterDropDownSmall from "../components/registerDropDownSmall";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import SearchBar, { SearchBarTrigger } from "../components/SearchBar";
import PrintExamModal from "../components/PrintExamModal";
import notFoundImage from "../assets/icons/notfound.png";
import noInternetImage from "../assets/icons/404notfound.png";
import emptyImage from "../assets/icons/empty.png";
import AdminContent from "./AdminContent";

import AllSubjectsIcon from "/src/assets/symbols/all.svg";
import AllSubjectsIconH from "/src/assets/symbols/allhover.svg";
import ReportsIcon from "/src/assets/symbols/reports.svg";

import BlueBackground from "/src/assets/backgrounds/blue.png";
import GreenBackground from "/src/assets/backgrounds/green.png";
import RedBackground from "/src/assets/backgrounds/red.png";
import YellowBackground from "/src/assets/backgrounds/yellow.png";
import PurpleBackground from "/src/assets/backgrounds/purple.png";
import CyanBackground from "/src/assets/backgrounds/cyan.png";

// Helper function to transform program names
const getDisplayProgramName = (programName) => {
  if (programName === "GE") {
    return "General Subject";
  }
  // Expand common abbreviations
  const programMap = {
    CE: "Civil Engineering",
    ABE: "Agricultural and Biosystems Engineering",
    EE: "Electrical Engineering",
    CpE: "Computer Engineering",
    ECE: "Electronics Engineering",
  };
  return programMap[programName] || programName;
};

// Array of background images for header sections
const headerBackgrounds = [
  BlueBackground,
  GreenBackground,
  RedBackground,
  YellowBackground,
  PurpleBackground,
  CyanBackground,
];

// Function to get a consistent background for a subject (based on subject ID)
const getHeaderBackground = (subjectId) => {
  if (!subjectId) return headerBackgrounds[0];
  // Use subject ID to get a consistent background for the same subject
  const index = subjectId % headerBackgrounds.length;
  return headerBackgrounds[index];
};

function SubjectList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSubject, setSelectedSubject } = useOutletContext();
  const params = new URLSearchParams(location.search);
  const subjectID = params.get("subject_id") || params.get("subjectID");
  const subjectFromState = location.state?.subject;

  // Get roleId from localStorage
  const [roleId, setRoleId] = useState(null);
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  // Fallback: if we're on a faculty route but roleId is not yet set,
  // treat this view as faculty to ensure correct endpoint usage.
  const isFacultyView = location.pathname.startsWith("/faculty");
  const effectiveRoleId = roleId ?? (isFacultyView ? 2 : null);

  // Determine base path based on roleId
  const basePath =
    Number(effectiveRoleId) === 2
      ? "/faculty/subjects"
      : Number(effectiveRoleId) === 3
        ? "/program-chair/subjects"
        : "/dean/subjects";

  // If subject_id is in URL or subject is in state, set selectedSubject and render AdminContent
  useEffect(() => {
    if (subjectFromState && subjectFromState.subjectID) {
      setSelectedSubject(subjectFromState);
    } else if (subjectID && !selectedSubject) {
      // If we have subjectID but no subject in state, fetch it
      const fetchSubject = async () => {
        const token = sessionStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        try {
          const response = await fetch(`${apiUrl}/subjects/${subjectID}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.subject) {
              setSelectedSubject(data.subject);
            }
          }
        } catch (error) {
          console.error("Error fetching subject:", error);
        }
      };
      fetchSubject();
    }
  }, [subjectID, subjectFromState, setSelectedSubject, selectedSubject]);

  // If subject_id is in URL or subject is in state, navigate to AdminContent route
  useEffect(() => {
    if (!effectiveRoleId) return; // Wait for role to be determined

    if (subjectFromState && subjectFromState.subjectID) {
      setSelectedSubject(subjectFromState);
      const contentPath =
        Number(effectiveRoleId) === 2
          ? "/faculty/subjects/content"
          : Number(effectiveRoleId) === 3
            ? "/program-chair/subjects/content"
            : "/dean/subjects/content";
      navigate(`${contentPath}?subjectID=${subjectFromState.subjectID}`, {
        state: { subject: subjectFromState },
        replace: true,
      });
      return;
    }

    if (subjectID) {
      // If we have subjectID but no subject in state, fetch it first
      const fetchSubject = async () => {
        const token = sessionStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        try {
          const response = await fetch(`${apiUrl}/subjects/${subjectID}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.subject) {
              setSelectedSubject(data.subject);
              const contentPath =
                Number(effectiveRoleId) === 2
                  ? "/faculty/subjects/content"
                  : Number(effectiveRoleId) === 3
                    ? "/program-chair/subjects/content"
                    : "/dean/subjects/content";
              navigate(`${contentPath}?subjectID=${subjectID}`, {
                state: { subject: data.subject },
                replace: true,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching subject:", error);
        }
      };
      fetchSubject();
    }
  }, [
    subjectID,
    subjectFromState,
    setSelectedSubject,
    navigate,
    effectiveRoleId,
  ]);

  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("All");
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProgramID, setSelectedProgramID] = useState("");
  const [selectedYearLevelID, setSelectedYearLevelID] = useState("");
  const [validationError, setValidationError] = useState("");
  const [programs, setPrograms] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);
  const yearLevelOptions = ["1", "2", "3", "4"];

  // Faculty assign subject states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchUnassigned, setSearchUnassigned] = useState("");
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] =
    useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingAvailableSubjects, setLoadingAvailableSubjects] =
    useState(false);

  // Edit and Delete states
  const [editingSubject, setEditingSubject] = useState(null);
  const [editedSubject, setEditedSubject] = useState({
    subjectCode: "",
    subjectName: "",
    programID: "",
    yearLevelID: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const kebabMenuRef = useRef(null);

  // Year level filter state
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState("All");
  const [showYearLevelDropdown, setShowYearLevelDropdown] = useState(false);
  const yearLevelDropdownRef = useRef(null);

  const kebabButtonRefs = useRef({});
  const [dropdownButtonRect, setDropdownButtonRect] = useState(null);

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

  // Close year level dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        yearLevelDropdownRef.current &&
        !yearLevelDropdownRef.current.contains(event.target)
      ) {
        setShowYearLevelDropdown(false);
      }
    };

    if (showYearLevelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showYearLevelDropdown]);

  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Get unique program names for sidebar buttons
  const uniquePrograms = Array.from(
    new Set(subjects.map((s) => s.programName).filter(Boolean)),
  ).sort();

  // Group filtered subjects by program
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const programName = subject.programName || "Other";
    if (!acc[programName]) {
      acc[programName] = [];
    }
    acc[programName].push(subject);
    return acc;
  }, {});

  // Sort programs and their subjects
  const sortedPrograms = Object.keys(groupedSubjects).sort();
  sortedPrograms.forEach((programName) => {
    groupedSubjects[programName].sort((a, b) => {
      // Sort by subject code within each program
      return a.subjectCode.localeCompare(b.subjectCode);
    });
  });

  // Filter subjects based on selected program, search term, and year level
  useEffect(() => {
    let filtered = subjects;

    // Filter by program
    if (selectedProgramFilter !== "All") {
      filtered = filtered.filter(
        (subject) => subject.programName === selectedProgramFilter,
      );
    }

    // Filter by year level
    if (selectedYearLevelFilter !== "All") {
      filtered = filtered.filter(
        (subject) => String(subject.yearLevelID) === selectedYearLevelFilter,
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (subject) =>
          subject.subjectName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim()) ||
          subject.subjectCode
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim()),
      );
    }

    setFilteredSubjects(filtered);
  }, [selectedProgramFilter, selectedYearLevelFilter, subjects, searchTerm]);

  // Fetch subjects
  useEffect(() => {
    if (effectiveRoleId) {
      fetchSubjects();
    }
  }, [effectiveRoleId]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => fetchSubjects();
    window.addEventListener("refreshSubjectsList", handleRefresh);
    return () =>
      window.removeEventListener("refreshSubjectsList", handleRefresh);
  }, []);

  const fetchSubjects = async () => {
    const token = sessionStorage.getItem("token");
    setSubjectLoading(true);
    setNetworkError(false);

    try {
      // If user is faculty, fetch assigned subjects instead of all subjects
      const endpoint =
        Number(effectiveRoleId) === 2
          ? `${apiUrl}/faculty/my-subjects`
          : `${apiUrl}/subjects`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Faculty endpoint returns data.subjects directly, admin endpoint returns data.success
      const subjectsArray =
        Number(effectiveRoleId) === 2
          ? Array.isArray(data.subjects)
            ? data.subjects
            : []
          : data.success && Array.isArray(data.subjects)
            ? data.subjects
            : [];

      if (!Array.isArray(subjectsArray)) {
        console.error("Unexpected subjects data format:", data);
        return;
      }

      const sortedSubjects = [...subjectsArray].sort((a, b) => {
        // First sort by program name
        const programCompare = (a.programName || "").localeCompare(
          b.programName || "",
        );
        if (programCompare !== 0) return programCompare;

        // If programs are the same, sort by subject code
        return a.subjectCode.localeCompare(b.subjectCode);
      });

      // Debug: Log first subject to check lastQuestionAdded field
      if (sortedSubjects.length > 0) {
        console.log("Sample subject data:", {
          subjectCode: sortedSubjects[0].subjectCode,
          lastQuestionAdded: sortedSubjects[0].lastQuestionAdded,
          type: typeof sortedSubjects[0].lastQuestionAdded,
        });
      }

      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
    } catch (error) {
      if (error instanceof TypeError) {
        setNetworkError(true);
      }
    } finally {
      setSubjectLoading(false);
    }
  };

  // Fetch programs and year levels
  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem("token");

      try {
        const res = await fetch(`${apiUrl}/programs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setPrograms(data.data);
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };

    const fetchYearLevels = async () => {
      const token = sessionStorage.getItem("token");

      try {
        const res = await fetch(`${apiUrl}/year-levels`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setYearLevelData(data.year_levels);
        }
      } catch (err) {
        console.error("Error fetching year levels:", err);
      }
    };

    fetchPrograms();
    fetchYearLevels();
  }, []);

  const handleAddSubject = async () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;
    const token = sessionStorage.getItem("token");

    setIsAdding(true);

    try {
      const response = await fetch(`${apiUrl}/add-subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectCode: newSubjectCode,
          subjectName: newSubjectName,
          programID: selectedProgramID,
          yearLevelID: selectedYearLevelID,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchSubjects();
        setNewSubjectCode("");
        setNewSubjectName("");
        setSelectedProgramID("");
        setSelectedYearLevelID("");
        setShowAddModal(false);
        showToast("Subject added successfully", "success");
      } else {
        if (result.message && result.message.includes("already exists")) {
          showToast("Subject already exists", "error");
        } else {
          console.error(
            "Failed to add subject:",
            result.message || "Unknown error",
          );
          showToast("Failed to add subject", "error");
        }
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      showToast("An error occurred while adding subject", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubjectClick = (subject) => {
    navigate(`/subject-overview/subjectID=${subject.subjectID}`, {
      state: { subject },
    });
  };

  const handleEditClick = (subject, e) => {
    if (e) e.stopPropagation();
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      programID: subject.programID || "",
      yearLevelID: subject.yearLevelID || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !editedSubject.subjectCode.trim() ||
      !editedSubject.subjectName.trim()
    ) {
      setValidationError("Please fill in all required fields");
      return;
    }

    if (editedSubject.subjectCode.length > 20) {
      setValidationError("Code must be 20 characters or less");
      return;
    }

    const token = sessionStorage.getItem("token");
    setIsEditing(true);
    setValidationError("");

    try {
      const response = await fetch(
        `${apiUrl}/subjects/${editingSubject}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectCode: editedSubject.subjectCode,
            subjectName: editedSubject.subjectName,
            programID: editedSubject.programID,
            yearLevelID: editedSubject.yearLevelID,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        await fetchSubjects();
        setShowEditModal(false);
        setEditingSubject(null);
        setEditedSubject({
          subjectCode: "",
          subjectName: "",
          programID: "",
          yearLevelID: "",
        });
        showToast("Subject updated successfully", "success");
      } else {
        showToast(result.message || "Failed to update subject", "error");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      showToast("An error occurred while updating subject", "error");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (subject, e) => {
    if (e) e.stopPropagation();
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;

    const token = sessionStorage.getItem("token");
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${apiUrl}/subjects/${subjectToDelete.subjectID}/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await fetchSubjects();
        setShowDeleteModal(false);
        setSubjectToDelete(null);
        showToast("Subject deleted successfully", "success");
      } else {
        showToast("Failed to delete subject", "error");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      showToast("An error occurred while deleting subject", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Faculty assign subject functions
  const fetchAvailableSubjects = async () => {
    const token = sessionStorage.getItem("token");
    setLoadingAvailableSubjects(true);

    try {
      const response = await fetch(`${apiUrl}/faculty/availableSubjects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized: Token may be expired or missing.");
          return;
        }
        if (response.status === 403) {
          console.error(
            "Forbidden: Only Faculty can access available subjects.",
          );
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.subjects)) {
        console.error("Unexpected available subjects data format:", data);
        return;
      }

      // Sort subjects alphabetically by subjectCode
      const sortedSubjects = [...data.subjects].sort((a, b) =>
        a.subjectCode.localeCompare(b.subjectCode),
      );

      setAvailableSubjects(sortedSubjects);
    } catch (error) {
      console.error("Error fetching available subjects:", error);
    } finally {
      setLoadingAvailableSubjects(false);
    }
  };

  const handleAssignSubject = async (subject) => {
    if (!subject) return;

    const token = sessionStorage.getItem("token");

    setIsAssigning(true);
    try {
      const response = await fetch(`${apiUrl}/faculty/assign-subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectID: subject.subjectID,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        await fetchSubjects();

        setSelectedSubjectForAssignment(null);
        setShowAssignModal(false);
        setSearchUnassigned("");

        showToast(result.message || "Subject assigned successfully", "success");
      } else {
        console.error("Failed to assign subject:", response.status);
        showToast("Failed to assign subject", "error");
      }
    } catch (error) {
      console.error("Error assigning subject:", error);
      showToast("An error occurred while assigning subject", "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // Get unassigned subjects (available subjects that are not already assigned)
  const unassignedSubjects = availableSubjects.filter(
    (subject) =>
      !subjects.some((assigned) => assigned.subjectID === subject.subjectID),
  );

  return (
    <div className="flex h-screen">
      {/* Left sidebar panel */}
      <aside className="fixed top-0 left-[63px] hidden h-screen w-56 overflow-hidden border-r border-gray-200 bg-white px-4 py-4 lg:block lg:w-64">
        <h2 className="outfit-500 mb-4 text-[16px] tracking-wide text-black">
          Subjects
        </h2>

        <nav className="outfit-500 space-y-1 text-[14px]">
          <Link
            to={basePath}
            onClick={() => {
              setSelectedProgramFilter("All");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
              (location.pathname === "/dean/subjects" ||
                location.pathname === "/program-chair/subjects") &&
              location.pathname !== "/dean/subjects/archive" &&
              selectedProgramFilter === "All"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  (location.pathname === "/dean/subjects" ||
                    location.pathname === "/program-chair/subjects") &&
                  location.pathname !== "/dean/subjects/archive" &&
                  selectedProgramFilter === "All"
                    ? AllSubjectsIconH
                    : AllSubjectsIcon
                }
                alt="All Subjects"
                className="h-4 w-4"
              />
              <span>All Subjects</span>
            </span>
          </Link>
          <div className="my-4 h-px bg-gray-200" />
          <div className="outfit-500 px-2 text-[12px] font-semibold text-gray-500">
            PROGRAMS{" "}
          </div>
          {uniquePrograms.map((programName) => (
            <button
              key={programName}
              type="button"
              onClick={() => {
                setSelectedProgramFilter(programName);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                selectedProgramFilter === programName
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{getDisplayProgramName(programName)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="scrollbar-hide mt-10 ml-0 flex h-full flex-1 flex-col gap-6 overflow-y-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-0 lg:ml-64 [&::-webkit-scrollbar]:hidden">
        <div className="min-w-0 space-y-4 px-4 pt-4 md:px-6 md:pt-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subjects..."
            mobileCollapsible
            showMobileSearch={showMobileSearch}
            onCloseMobileSearch={() => setShowMobileSearch(false)}
            inputRef={mobileSearchInputRef}
          />

          <div className="my-4 hidden h-px bg-gray-200 md:block" />

          {/* Header with title and action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="outfit-500 mt-1 text-[18px] break-words text-black">
                {searchTerm.trim() ? (
                  <>
                    Search results for &quot;{searchTerm}&quot;
                    <span className="hidden md:inline">
                      {" "}
                      ({filteredSubjects.length})
                    </span>
                  </>
                ) : selectedProgramFilter === "All" ? (
                  <>
                    Qualifying exam
                    <span className="hidden md:inline">
                      {" "}
                      ({filteredSubjects.length})
                    </span>
                  </>
                ) : (
                  <>
                    {getDisplayProgramName(selectedProgramFilter)}
                    <span className="hidden md:inline">
                      {" "}
                      ({filteredSubjects.length})
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
              <SearchBarTrigger
                isOpen={showMobileSearch}
                onClick={() => setShowMobileSearch((prev) => !prev)}
                title="Search subjects"
              />
              {/* Print / Generate exam - mobile only, beside search (hidden for faculty) */}
              {Number(effectiveRoleId) !== 2 && (
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  title="Print generating exam"
                  className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:hidden md:text-[14px]"
                  aria-label="Print generating exam"
                >
                  <i className="bx bx-printer text-[22px]" />
                </button>
              )}
              {/* Reports - mobile only, beside print */}
              <button
                type="button"
                onClick={() => navigate("/reports")}
                title="Reports"
                className="outfit-500 -mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:hidden md:text-[14px]"
                aria-label="Reports"
              >
                <img
                  src={ReportsIcon}
                  alt="Reports"
                  className="size-[24px] flex-shrink-0"
                />
              </button>

              {/* Year Level Filter Dropdown - icon only on mobile, full button on desktop */}
              <div className="relative" ref={yearLevelDropdownRef}>
                <button
                  type="button"
                  onClick={() =>
                    setShowYearLevelDropdown(!showYearLevelDropdown)
                  }
                  title={
                    selectedYearLevelFilter === "All"
                      ? "All Year Levels"
                      : `${selectedYearLevelFilter}${selectedYearLevelFilter === "1" ? "st" : selectedYearLevelFilter === "2" ? "nd" : selectedYearLevelFilter === "3" ? "rd" : "th"} Year`
                  }
                  className="outfit-500 -mb-2 hidden cursor-pointer items-center rounded-xl border-gray-200 bg-white p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:mb-0 md:inline-flex md:border md:px-4 md:py-2 md:text-[14px]"
                >
                  <span className="hidden md:inline">
                    {selectedYearLevelFilter === "All"
                      ? "All Year Levels"
                      : `${selectedYearLevelFilter}${selectedYearLevelFilter === "1" ? "st" : selectedYearLevelFilter === "2" ? "nd" : selectedYearLevelFilter === "3" ? "rd" : "th"} Year`}
                  </span>
                  <i
                    className={`bx bx-chevron-down ml-2 hidden text-lg text-[22px] transition-transform ${
                      showYearLevelDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showYearLevelDropdown && (
                  <div className="outfit-500 fade-in absolute right-0 z-99 mt-3 min-w-[150px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYearLevelFilter("All");
                        setShowYearLevelDropdown(false);
                      }}
                      className={`outfit-500 mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
                        selectedYearLevelFilter === "All"
                          ? "bg-gray-100 text-black"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <i className="bx bx-layer text-sm"></i>
                      All Year Levels
                    </button>
                    {yearLevelOptions.map((yearLevel) => (
                      <button
                        key={yearLevel}
                        type="button"
                        onClick={() => {
                          setSelectedYearLevelFilter(yearLevel);
                          setShowYearLevelDropdown(false);
                        }}
                        className={`outfit-500 mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedYearLevelFilter === yearLevel
                            ? "bg-gray-100 text-black"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <i className="bx bx-layer text-sm"></i>
                        {yearLevel}
                        {yearLevel === "1"
                          ? "st"
                          : yearLevel === "2"
                            ? "nd"
                            : yearLevel === "3"
                              ? "rd"
                              : "th"}{" "}
                        Year
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {Number(effectiveRoleId) !== 3 && (
                <button
                  type="button"
                  onClick={() => {
                    if (Number(effectiveRoleId) === 2) {
                      setShowAssignModal(true);
                      fetchAvailableSubjects();
                    } else {
                      setShowAddModal(true);
                    }
                  }}
                  title={
                    Number(effectiveRoleId) === 2
                      ? "Assign subject"
                      : "Create subject"
                  }
                  className="outfit-500 -mb-2 hidden cursor-pointer items-center rounded-xl bg-orange-500 p-2 text-[12px] font-medium text-white transition-colors hover:bg-orange-600 md:mb-0 md:inline-flex md:px-4 md:py-2 md:text-[14px]"
                >
                  <i className="bx bx-plus text-[20px] md:mr-2 md:text-[16px]" />
                  <span className="hidden md:inline">
                    {Number(roleId) === 2 ? "Assign subject" : "Create subject"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subjects List */}
        <div className="md:px-4">
          {subjectLoading ? (
            <div className="outfit-400 flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-[14px] text-gray-600">Loading subjects...</p>
              </div>
            </div>
          ) : networkError ? (
            <div className="outfit-400 flex flex-col items-center justify-center py-10">
              <img
                src={noInternetImage}
                alt="No internet connection"
                className="mb-3 h-32 w-32 opacity-80"
              />
              <span className="text-[14px] font-semibold text-gray-500">
                Unstable Connection
              </span>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="outfit-400 flex h-80 flex-1 items-center justify-center rounded-2xl border-dashed border-gray-300 bg-gray-50/60 py-16 md:h-130 md:border">
              <div className="text-center">
                <img
                  src={emptyImage}
                  alt="No subjects available"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="outfit-400 text-[14px] text-gray-600">
                  {selectedProgramFilter === "All" ? (
                    Number(effectiveRoleId) === 2 ? (
                      <>
                        No subjects assigned.
                        <br />
                        Use the Assign Subject button to assign one.
                      </>
                    ) : (
                      <>
                        No subjects found.
                        <br />
                        Use the Create Subject button to create one.
                      </>
                    )
                  ) : (
                    <>
                      No subjects found for{" "}
                      {getDisplayProgramName(selectedProgramFilter)}.
                      <br />
                      Use the Create Subject button to create one.
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {sortedPrograms.map((programName) => {
                  const programSubjects = groupedSubjects[programName];
                  const subjectCount = programSubjects.length;

                  return (
                    <div
                      key={programName}
                      id={`program-${programName}`}
                      className="scroll-mt-4"
                    >
                      {/* Program Header - Only show when "All" is selected */}
                      <div className="px-4">
                        {selectedProgramFilter === "All" && (
                          <div className="mb-4">
                            <h3 className="outfit-500 text-[14px] text-gray-600">
                              {getDisplayProgramName(programName)}
                            </h3>
                          </div>
                        )}
                      </div>

                      {/* Subjects Grid for this Program */}
                      <div className="mt-4 grid grid-cols-1 space-y-2 space-x-2 px-2 md:grid-cols-[repeat(auto-fill,minmax(20rem,20rem))] md:gap-2 lg:px-4">
                        {programSubjects.map((subject) => {
                          const headerBackground = getHeaderBackground(
                            subject.subjectID,
                          );

                          // Format dates
                          const createdDate =
                            subject.created_at || subject.createdAt
                              ? new Date(
                                  subject.created_at || subject.createdAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—";

                          const createdTime =
                            subject.created_at || subject.createdAt
                              ? new Date(
                                  subject.created_at || subject.createdAt,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—";

                          const updatedDate =
                            subject.updated_at || subject.updatedAt
                              ? new Date(
                                  subject.updated_at || subject.updatedAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—";

                          const updatedTime =
                            subject.updated_at || subject.updatedAt
                              ? new Date(
                                  subject.updated_at || subject.updatedAt,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—";

                          // Format lastQuestionAdded date (for all roles)
                          let lastQuestionAddedDate = "—";
                          let lastQuestionAddedTime = "—";

                          // Check if lastQuestionAdded exists and is not null/empty
                          if (
                            subject.lastQuestionAdded != null &&
                            subject.lastQuestionAdded !== "" &&
                            subject.lastQuestionAdded !== "null"
                          ) {
                            try {
                              // Handle format: "2026-02-20 08:00:00" or datetime string
                              let dateStr = String(
                                subject.lastQuestionAdded,
                              ).trim();

                              // Replace space with T to make it ISO-compatible
                              // Format: "2026-02-20 08:00:00" -> "2026-02-20T08:00:00"
                              if (dateStr.includes(" ")) {
                                dateStr = dateStr.replace(" ", "T");
                              }

                              const date = new Date(dateStr);
                              const timestamp = date.getTime();

                              // Check if date is valid
                              if (!isNaN(timestamp) && timestamp > 0) {
                                lastQuestionAddedDate = date.toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                                lastQuestionAddedTime = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                );
                              } else {
                                console.warn(
                                  "Invalid date for subject:",
                                  subject.subjectCode,
                                  "Value:",
                                  subject.lastQuestionAdded,
                                  "Parsed:",
                                  dateStr,
                                );
                              }
                            } catch (err) {
                              console.error(
                                "Error parsing lastQuestionAdded for subject:",
                                subject.subjectCode,
                                "Error:",
                                err,
                                "Value:",
                                subject.lastQuestionAdded,
                              );
                            }
                          }

                          return (
                            <>
                              <div
                                key={subject.subjectID}
                                className="group outfit-400 relative flex w-full flex-col overflow-hidden rounded-xl bg-transparent transition-all md:h-[320px] md:w-80 md:border md:border-gray-200 md:bg-white md:shadow-sm md:hover:shadow-xl"
                              >
                                {/* Background Image Header Section */}
                                <div
                                  className="relative cursor-pointer bg-cover bg-center bg-no-repeat px-4 pt-4 pb-4 md:h-[150px]"
                                  onClick={() => handleSubjectClick(subject)}
                                  style={{
                                    backgroundImage: `url(${headerBackground})`,
                                  }}
                                >
                                  <div className="relative z-10 pr-16 md:flex md:h-full md:flex-col md:justify-between md:pr-0">
                                    <div>
                                      <div className="mb-4 hidden text-xs font-medium text-white opacity-90 md:block">
                                        Subject
                                      </div>
                                      <div className="mb-4">
                                        <div
                                          className="min-h-0 overflow-hidden leading-6 font-semibold text-white"
                                          style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          <span className="outfit-500 text-[20px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                            {subject.subjectName}
                                          </span>
                                        </div>
                                        {subject.yearLevel && (
                                          <div className="mt-1 flex items-center gap-1 text-[12px] text-white md:hidden">
                                            <i className="bx bx-people-diversity text-sm"></i>
                                            <span className="truncate">
                                              {subject.yearLevel}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-7 inline-flex w-fit max-w-full items-center rounded-full bg-white px-3 py-0.5 md:mt-0">
                                      <span className="truncate text-xs font-semibold whitespace-nowrap text-black uppercase">
                                        {subject.subjectCode}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Last modified badge - mobile only (like student count in Class) */}
                                  <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white md:hidden">
                                    <i className="bx bx-time-five text-sm"></i>
                                    <span className="max-w-[120px] truncate">
                                      {lastQuestionAddedDate !== "—"
                                        ? `Modified: ${lastQuestionAddedDate}`
                                        : "No questions yet"}
                                    </span>
                                  </div>

                                  {/* Edit and Archive Buttons - Top Right (only for Admin/Dean, not faculty) */}
                                  {Number(roleId) !== 3 &&
                                    Number(roleId) !== 2 && (
                                      <div className="absolute top-2 right-2 z-20 hidden items-center gap-1 md:flex">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(subject, e);
                                          }}
                                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                                          title="Edit Subject"
                                        >
                                          <i className="bx bx-edit text-lg"></i>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(subject, e);
                                          }}
                                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                                          title="Remove Subject"
                                        >
                                          <i className="bx bx-trash text-lg"></i>
                                        </button>
                                      </div>
                                    )}
                                </div>

                                {/* White Body Section - hidden on mobile */}
                                <div
                                  className="hidden flex-1 cursor-pointer flex-col px-4 py-4 md:flex"
                                  onClick={() => handleSubjectClick(subject)}
                                >
                                  {/* Min height for 2 lines so separator stays at same position when name is 1 line */}
                                  <div className="mb-3 min-h-[2.5rem]">
                                    <div className="outfit-500 line-clamp-2 overflow-hidden text-[14px] font-medium text-ellipsis text-gray-700">
                                      {subject.subjectCode} -{" "}
                                      {subject.subjectName}
                                    </div>
                                  </div>

                                  {/* Metadata */}
                                  <div className="mb-3 space-y-1">
                                    {subject.yearLevel && (
                                      <div className="outfit-400 flex items-center gap-2 text-[12px] text-gray-700">
                                        <i className="bx bx-people-diversity text-sm text-gray-500"></i>
                                        <span>{subject.yearLevel}</span>
                                      </div>
                                    )}
                                    {subject.programName && (
                                      <div className="outfit-400 flex items-center gap-2 text-[12px] text-gray-700">
                                        <i className="bx bx-book text-sm text-gray-500"></i>
                                        <span>{subject.programName}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Separator */}
                                  <div className="mb-3 h-px bg-gray-200"></div>

                                  {/* Date Information */}
                                  <div className="outfit-400 space-y-1 text-[12px] text-gray-600">
                                    {lastQuestionAddedDate !== "—" ? (
                                      // Show last question added date if available
                                      <div>
                                        Last modified: {lastQuestionAddedDate}{" "}
                                        {lastQuestionAddedTime !== "—" &&
                                          `at ${lastQuestionAddedTime}`}
                                      </div>
                                    ) : (
                                      // Show message when no questions have been added yet
                                      <div>Last modified: No questions yet</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pb-28 lg:pb-12" aria-hidden="true" />
            </>
          )}
        </div>
      </div>

      {/* Floating Create/Assign subject button (mobile only) - same as Class.jsx */}
      {Number(effectiveRoleId) !== 3 && (
        <div className="fixed right-4 bottom-[90px] z-50 md:hidden">
          <button
            type="button"
            onClick={() => {
              if (Number(effectiveRoleId) === 2) {
                setShowAssignModal(true);
                fetchAvailableSubjects();
              } else {
                setShowAddModal(true);
              }
            }}
            className="outfit-400 flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 p-4 text-[14px] font-medium text-white shadow-xl transition-colors hover:bg-orange-600"
          >
            <i className="bx bx-plus text-[22px]" />
          </button>
        </div>
      )}

      {/* Assign Subject Modal (for Faculty) */}
      {showAssignModal && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="animate-fade-in-up relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black">
                  Assign a Subject
                </h2>

                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSearchUnassigned("");
                    setSelectedSubjectForAssignment(null);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="mt-2 flex w-full items-center gap-2">
                  <div className="w-4/5">
                    <input
                      type="text"
                      placeholder="Search subject..."
                      value={searchUnassigned}
                      onChange={(e) => setSearchUnassigned(e.target.value)}
                      className="relative w-full cursor-text rounded-md border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1"
                    />
                  </div>
                  <button
                    className="border-color flex cursor-pointer items-center gap-1 rounded-md border px-3 py-[7px] text-sm hover:bg-gray-200"
                    onClick={fetchAvailableSubjects}
                  >
                    <i className="bx bx-refresh-ccw text-[18px]"></i> Refresh
                  </button>
                </div>

                <div className="mt-4 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {/* Subject List for Assigning */}
                <div className="mb-3">
                  <ul className="max-h-[200px] overflow-y-auto">
                    {loadingAvailableSubjects ? (
                      <div className="flex items-center justify-center text-[rgb(168,168,168)]">
                        <div className="loader"></div>
                      </div>
                    ) : unassignedSubjects.length > 0 ? (
                      [...unassignedSubjects]
                        .filter((subject) =>
                          `${subject.programName} ${subject.subjectName} ${subject.subjectCode}`
                            .toLowerCase()
                            .includes(searchUnassigned.toLowerCase()),
                        )
                        .sort((a, b) =>
                          a.programName.localeCompare(b.programName),
                        )
                        .map((subject) => (
                          <li
                            key={subject.subjectID}
                            className={`mt-2 mr-[6px] flex cursor-pointer items-center justify-between rounded-md p-[5px] text-[15px] transition-all duration-100 ease-in-out ${
                              selectedSubjectForAssignment &&
                              selectedSubjectForAssignment.subjectID ===
                                subject.subjectID
                                ? "bg-orange-500 text-white"
                                : "hover:bg-[rgb(255,230,214)]"
                            }`}
                            onClick={() =>
                              setSelectedSubjectForAssignment(subject)
                            }
                          >
                            <span className="mb-[1px] pl-1 break-words">
                              {subject.programName} - ({subject.subjectCode}){" "}
                              {subject.subjectName}
                            </span>
                          </li>
                        ))
                    ) : (
                      <li className="p-2 text-center text-[14px] text-[rgb(168,168,168)]">
                        All subjects already assigned.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-5 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                <div className="mb-1 flex justify-end gap-2">
                  <button
                    className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSearchUnassigned("");
                      setSelectedSubjectForAssignment(null);
                    }}
                  >
                    <span className="px-1 text-[16px]">Cancel</span>
                  </button>

                  <button
                    className="flex w-[80px] cursor-pointer items-center justify-center rounded-md bg-orange-500 px-[12px] py-[6px] text-[14px] text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      handleAssignSubject(selectedSubjectForAssignment)
                    }
                    disabled={!selectedSubjectForAssignment}
                  >
                    {isAssigning ? (
                      <span className="loader-white"></span>
                    ) : (
                      "Assign"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="animate-fade-in-up relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black">
                  Add a Subject
                </h2>

                <button
                  onClick={() => {
                    setNewSubjectName("");
                    setNewSubjectCode("");
                    setSelectedProgramID("");
                    setSelectedYearLevelID("");
                    setShowAddModal(false);
                    setValidationError("");
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Name
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Code
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={newSubjectCode}
                        onChange={(e) => setNewSubjectCode(e.target.value)}
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-start text-[11px] text-gray-400">
                      Enter the subject code of the subject you want to add (e.g
                      MATH123)
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Program
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Program"
                      value={selectedProgramID}
                      onChange={(e) => setSelectedProgramID(e.target.value)}
                      placeholder="Select Program"
                      options={programs.map((program) => ({
                        value: program.programID,
                        label: getDisplayProgramName(program.programName),
                      }))}
                    />

                    <div className="text-start text-[11px] text-gray-400">
                      Enter the program of the subject you want to add
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Year Level
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Year Level"
                      value={selectedYearLevelID}
                      onChange={(e) => setSelectedYearLevelID(e.target.value)}
                      placeholder="Select Year Level"
                      options={yearLevelOptions.map((yearLevel) => ({
                        value: yearLevel,
                        label: `${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year`,
                      }))}
                    />
                    <div className="text-start text-[11px] text-gray-400">
                      Enter the year level of the subject
                    </div>
                  </div>
                </div>
                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {validationError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {validationError}
                  </div>
                )}

                {newSubjectCode.length > 20 && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    Code must be 20 characters or less.
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isAdding}
                    onClick={async () => {
                      const valid =
                        newSubjectName.trim() !== "" &&
                        newSubjectCode.trim() !== "" &&
                        newSubjectCode.length <= 20 &&
                        selectedProgramID &&
                        selectedYearLevelID;

                      if (!valid) {
                        setValidationError(
                          "Please fill in all required fields",
                        );
                        return;
                      }

                      setValidationError("");
                      await handleAddSubject();
                    }}
                    className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isAdding ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                  >
                    {isAdding ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && editingSubject && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="animate-fade-in-up relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black">
                  Edit Subject
                </h2>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSubject(null);
                    setEditedSubject({
                      subjectCode: "",
                      subjectName: "",
                      programID: "",
                      yearLevelID: "",
                    });
                    setValidationError("");
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Name
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={editedSubject.subjectName}
                        onChange={(e) =>
                          setEditedSubject({
                            ...editedSubject,
                            subjectName: e.target.value,
                          })
                        }
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Code
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={editedSubject.subjectCode}
                        onChange={(e) =>
                          setEditedSubject({
                            ...editedSubject,
                            subjectCode: e.target.value,
                          })
                        }
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-start text-[11px] text-gray-400">
                      Enter the subject code of the subject (e.g MATH123)
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Program
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Program"
                      value={editedSubject.programID}
                      onChange={(e) =>
                        setEditedSubject({
                          ...editedSubject,
                          programID: e.target.value,
                        })
                      }
                      placeholder="Select Program"
                      options={programs.map((program) => ({
                        value: program.programID,
                        label: getDisplayProgramName(program.programName),
                      }))}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Year Level
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Year Level"
                      value={editedSubject.yearLevelID}
                      onChange={(e) =>
                        setEditedSubject({
                          ...editedSubject,
                          yearLevelID: e.target.value,
                        })
                      }
                      placeholder="Select Year Level"
                      options={yearLevelOptions.map((yearLevel) => ({
                        value: yearLevel,
                        label: `${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year`,
                      }))}
                    />
                  </div>
                </div>
                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {validationError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {validationError}
                  </div>
                )}

                {editedSubject.subjectCode.length > 20 && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    Code must be 20 characters or less.
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSubject(null);
                      setEditedSubject({
                        subjectCode: "",
                        subjectName: "",
                        programID: "",
                        yearLevelID: "",
                      });
                      setValidationError("");
                    }}
                    className="mt-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    onClick={handleSaveEdit}
                    className={`mt-2 cursor-pointer rounded-lg px-4 py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && subjectToDelete && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
            <div className="animate-fade-in-up relative mx-4 w-full max-w-md rounded-lg bg-white shadow-2xl">
              <div className="border-color flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete Subject
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSubjectToDelete(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <i className="bx bx-x text-xl"></i>
                </button>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {subjectToDelete.subjectCode} -{" "}
                    {subjectToDelete.subjectName}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSubjectToDelete(null);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubject}
                  disabled={isDeleting}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${isDeleting ? "cursor-not-allowed bg-gray-500" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center">
                      <span className="loader-white"></span>
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Print / Generate exam modal - used by mobile button */}
      <PrintExamModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}

export default SubjectList;
