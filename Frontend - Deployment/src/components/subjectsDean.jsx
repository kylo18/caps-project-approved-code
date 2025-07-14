import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SideBarToolTip from "./sidebarTooltip";
import RegisterDropDownSmall from "./registerDropDownSmall";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import notFoundImage from "../assets/icons/notfound.png";
import noInternetImage from "../assets/icons/404notfound.png";
import emptyImage from "../assets/icons/empty.png";

// Helper function to transform program names
const getDisplayProgramName = (programName) => {
  if (programName === "GE") {
    return "General Subject";
  }
  return programName;
};

const SideBarDropDown = ({
  item,
  isExpanded,
  setIsExpanded,
  setSelectedSubject,
  setIsSubjectFocused,
  homePath,
  className,
  selectedSubject,
}) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const listRef = useRef(null);
  const navigate = useNavigate();
  const [openMenuID, setOpenMenuID] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(false);

  const [editingSubject, setEditingSubject] = useState(null);
  const [editedSubject, setEditedSubject] = useState({
    subjectCode: "",
    subjectName: "",
    subjectID: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [selectedProgramID, setSelectedProgramID] = useState("");

  const [validationError, setValidationError] = useState("");

  const [programs, setPrograms] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);
  const [selectedYearLevelID, setSelectedYearLevelID] = useState("");

  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [showYearSubjects, setShowYearSubjects] = useState(false);
  const [yearLevelPosition, setYearLevelPosition] = useState({ x: 0, y: 0 });
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef(null);
  const [showProgramFilter, setShowProgramFilter] = useState(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("All");
  const programFilterRef = useRef(null);

  const [isTabletOpen, setIsTabletOpen] = useState(false);

  // Use the toast hook
  const { toast, showToast } = useToast();

  const [networkError, setNetworkError] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Handle screen resize and panel state
  useEffect(() => {
    const handleResize = () => {
      const wasSmallScreen = isMobile;
      const isNowSmallScreen = window.innerWidth < 640;

      // If resizing from mobile to tablet (>=640px) and the panel is open, close it and set isExpanded to false
      if (wasSmallScreen && !isNowSmallScreen && isOpen) {
        setIsOpen(false);
        setIsExpanded(false);
        setIsSubjectFocused(false);
        setShowAddModal(false);
        setSearchTerm("");
        setFilteredSubjects(subjects);
        setShowYearSubjects(false);
      }

      // Only update states if we're transitioning between screen sizes
      if (wasSmallScreen !== isNowSmallScreen) {
        if (wasSmallScreen && !isNowSmallScreen && isOpen) {
          // Transitioning from mobile to desktop
          setIsExpanded(true);
          setIsSubjectFocused(true);
        } else if (!wasSmallScreen && isNowSmallScreen && !isOpen) {
          // Transitioning from desktop to mobile
          setIsExpanded(false);
          setIsSubjectFocused(false);
        }
      }

      setIsMobile(isNowSmallScreen);

      // --- Tablet/Desktop modal/sidebar sync logic ---
      const width = window.innerWidth;
      if (width >= 1024) {
        // lg and up
        if (isTabletOpen) {
          setIsTabletOpen(false);
          setIsOpen(true);
          setIsExpanded(true);
          setIsSubjectFocused(true);
        }
      } else if (width >= 640) {
        // tablet
        if (isOpen) {
          setIsTabletOpen(true);
          setIsOpen(false);
          setIsExpanded(false);
          setIsSubjectFocused(true);
        }
      }
      // (no change for mobile < 640)
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    isMobile,
    isOpen,
    isTabletOpen,
    setIsExpanded,
    setIsSubjectFocused,
    subjects,
  ]);

  // Handle initial mount
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsExpanded(true);
      setIsSubjectFocused(true);
    }
  }, []);

  // Close panel and set isExpanded to false when panel is closed on sm/md+
  useEffect(() => {
    if (!isOpen && window.innerWidth >= 640) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open on small screens
  useEffect(() => {
    if (isExpanded && isOpen) {
      // Check if we're on a small screen (mobile/tablet)
      const isSmallScreen = window.innerWidth < 640; // sm breakpoint
      if (isSmallScreen) {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
      }
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isExpanded, isOpen]);

  // Prevent background scrolling when tablet modal is open
  useEffect(() => {
    if (isTabletOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isTabletOpen]);

  // Prevent background scrolling when Add Subject modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showAddModal]);

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      programID: subject.programID || "",
      yearLevelID: subject.yearLevelID || "",
    });
  };

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setSubjectLoading(true);
    setNetworkError(false);

    try {
      const response = await fetch(`${apiUrl}/subjects`, {
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

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch subjects");
      }

      if (!Array.isArray(data.subjects)) {
        console.error("Unexpected subjects data format:", data);
        return;
      }

      const sortedSubjects = [...data.subjects].sort((a, b) => {
        // First sort by program name
        const programCompare = (a.programName || "").localeCompare(
          b.programName || "",
        );
        if (programCompare !== 0) return programCompare;

        // If programs are the same, sort by subject code
        return a.subjectCode.localeCompare(b.subjectCode);
      });

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

  const handleAddSubject = async () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;
    const token = localStorage.getItem("token");

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
        const newSubject = result.subject;

        setSubjects((prevSubjects) => [...prevSubjects, newSubject]);
        setFilteredSubjects((prevSubjects) => [...prevSubjects, newSubject]);
        await fetchSubjects();

        setNewSubjectCode("");
        setNewSubjectName("");
        setSelectedProgramID("");
        setSelectedYearLevelID("");

        showToast("Subject added successfully", "success");
      } else {
        // Handle specific error if subject already exists
        if (result.message && result.message.includes("already exists")) {
          showToast("Subject already exists", "error");
        } else {
          // General error case
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

  useEffect(() => {
    if (!isExpanded) {
      setIsOpen(false);
      setSearchTerm("");
      setFilteredSubjects(subjects);
      setShowYearSubjects(false);
      setOpenMenuID(null);
      if (listRef.current) {
        listRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [isExpanded, subjects]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubjects(subjects);
    } else {
      const results = subjects.filter(
        (subject) =>
          subject?.subjectName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim()) ||
          subject?.subjectCode
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim()),
      );
      setFilteredSubjects(results);
    }
  }, [searchTerm, subjects]);

  useEffect(() => {
    if (!isOpen && listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowYearSubjects(false);
      }
    };

    if (showYearSubjects) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showYearSubjects]);

  // Close program filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        programFilterRef.current &&
        !programFilterRef.current.contains(event.target)
      ) {
        setShowProgramFilter(false);
      }
    };

    if (showProgramFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProgramFilter]);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);

    // Close modal on small screens after selecting a subject
    const isSmallScreen = window.innerWidth < 640;
    if (isSmallScreen) {
      setIsOpen(false);
      setIsSubjectFocused(false);
      setShowAddModal(false);
      setSearchTerm("");
      setFilteredSubjects(subjects);
      setIsExpanded(false);
      setShowYearSubjects(false);
    }
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      const token = localStorage.getItem("token");

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
      const token = localStorage.getItem("token");

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

  // Group subjects by year level
  const yearLevelGroups = filteredSubjects.reduce((acc, subject) => {
    const yearLevel = subject.yearLevelID || "Unassigned";
    if (!acc[yearLevel]) {
      acc[yearLevel] = [];
    }
    acc[yearLevel].push(subject);
    return acc;
  }, {});

  const yearLevelOptions = ["1", "2", "3", "4"];

  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      // Push a new state to the history stack
      window.history.pushState({ panelOpen: true }, "");
      const handlePopState = (event) => {
        if (isOpen) {
          setIsOpen(false);
          setIsSubjectFocused(false);
          setShowAddModal(false);
          setSearchTerm("");
          setFilteredSubjects(subjects);
          setIsExpanded(false);
          setShowYearSubjects(false);
          setShowSearch(false);
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isOpen]);

  // Expose refreshSubjects function
  const handleRefreshSubjects = () => {
    fetchSubjects();
  };

  useEffect(() => {
    const handleRefresh = () => fetchSubjects();
    window.addEventListener("refreshSubjectsList", handleRefresh);
    return () =>
      window.removeEventListener("refreshSubjectsList", handleRefresh);
  }, []);

  return (
    <div className="">
      <li
        className="relative flex cursor-pointer items-center gap-3 rounded-md px-[8px] py-[4px] sm:hover:bg-gray-100"
        onClick={() => {
          const width = window.innerWidth;
          if (width >= 1024) {
            // lg and up
            if (!isExpanded || !isOpen) {
              setIsExpanded(true);
              setIsOpen(true);
              setIsSubjectFocused(true);
            } else {
              setIsOpen(false);
              setIsSubjectFocused(false);
              setShowAddModal(false);
              setSearchTerm("");
              setFilteredSubjects(subjects);
              setIsExpanded(false);
              setShowYearSubjects(false);
            }
          } else if (width >= 640) {
            // sm/md
            setIsTabletOpen(true);
            setIsSubjectFocused(true);
          } else {
            // mobile
            if (!isExpanded || !isOpen) {
              setIsExpanded(true);
              setIsOpen(true);
              setIsSubjectFocused(true);
            } else {
              setIsOpen(false);
              setIsSubjectFocused(false);
              setShowAddModal(false);
              setSearchTerm("");
              setFilteredSubjects(subjects);
              setIsExpanded(false);
              setShowYearSubjects(false);
            }
          }
        }}
      >
        {/* Only show tooltip on sm and up */}
        <span className="hidden sm:inline">
          <SideBarToolTip
            label="Subjects"
            isExpanded={isExpanded}
            className="ml-[15px]"
          >
            <i
              className={`bx ${item.icon} ${className} text-2xl text-gray-700 hover:text-gray-800 sm:pt-1 sm:text-2xl`}
            ></i>
          </SideBarToolTip>
        </span>
        {/* Always show icon on mobile, but without tooltip */}
        <span className="sm:hidden">
          <i
            className={`bx ${item.icon} ${className} text-2xl text-gray-700 hover:text-gray-800 sm:pt-1 sm:text-2xl`}
          ></i>
        </span>
      </li>

      {/* Secondary Sidebar Panel */}
      {(isExpanded || isOpen) && (
        <>
          <div
            className={`open-sans sm:bg-opacity-0 fixed inset-0 z-50 flex h-[100vh] flex-col border-r border-gray-300 bg-white transition-all duration-200 ease-in-out sm:hidden lg:inset-auto lg:top-0 lg:left-[55px] lg:flex lg:w-62 lg:translate-x-0 lg:translate-y-0 lg:border-l lg:shadow-none ${
              isOpen ? "translate-x-0" : "translate-x-full sm:translate-x-0"
            } ${window.innerWidth < 640 ? (isOpen ? "animate-fade-in-up" : "") : "animate-fade-in-left"}`}
          >
            <div className="open-sans flex items-center justify-between px-3 pt-[6px] text-[16px] font-semibold sm:text-[14px]">
              <span>Select a Subject</span>
              {/* Close button for small screens */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSubjectFocused(false);
                  setShowAddModal(false);
                  setSearchTerm("");
                  setFilteredSubjects(subjects);
                  setIsExpanded(false);
                  setShowYearSubjects(false);
                }}
                className="ml-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 transition duration-200 hover:bg-gray-100"
                title="Close"
              >
                {/* X icon for small screens */}
                <span className="mt-1 inline lg:hidden">
                  <i className="bx bx-x text-2xl sm:text-xl"></i>
                </span>

                {/* Chevron icon for large screens */}
                <span className="mt-1 hidden lg:inline">
                  <i className="bx bx-chevron-left text-2xl"></i>
                </span>
              </button>
            </div>

            {/* Year Level Dropdown at the top */}
            <div className="relative flex flex-col items-center gap-2 p-2">
              {/* Custom Year Level Dropdown */}
              <div className="w-full" ref={dropdownRef}>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="border-color flex flex-1 cursor-pointer items-center justify-between rounded-md border bg-white px-3 py-[8px] text-[13px] font-semibold hover:bg-gray-100 focus:outline-none sm:py-[3.5px]"
                    onClick={() => setShowYearSubjects((prev) => !prev)}
                  >
                    <span className="flex items-center gap-2 text-nowrap">
                      <i className="bx bx-list-ul text-2xl text-gray-500"></i>
                      {selectedYearLevel
                        ? `${selectedYearLevel}${selectedYearLevel === "1" ? "st" : selectedYearLevel === "2" ? "nd" : selectedYearLevel === "3" ? "rd" : "th"} Year Subjects`
                        : "All Year Level"}
                    </span>
                    <i
                      className={`bx bx-chevron-down ml-1 text-2xl text-gray-500 transition-transform duration-200 ease-in-out ${
                        showYearSubjects ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {showYearSubjects && (
                  <ul className="animate-dropdown animate-fadein absolute left-0 z-10 mx-2 mt-1 w-[calc(100%-16px)] rounded border border-gray-300 bg-white p-1 shadow-lg">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-1 py-2 text-sm hover:bg-orange-50"
                      onClick={() => {
                        setSelectedYearLevel("");
                        setShowYearSubjects(false);
                      }}
                    >
                      <i className="bx bx-layer text-lg text-gray-700"></i>All
                      Year Level
                    </li>
                    {yearLevelOptions.map((yearLevel) => (
                      <li
                        key={yearLevel}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-2 text-[13px] hover:bg-gray-100"
                        onClick={() => {
                          setSelectedYearLevel(yearLevel);
                          setShowYearSubjects(false);
                        }}
                      >
                        <i className="bx bx-layer text-[13px] text-gray-700"></i>
                        {`${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year Subjects`}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                <button
                  className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-3 py-2 text-start text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bx bx-plus text-lg"></i>
                  Add Subject
                </button>
                <div className="mt-1 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                {/* Search and Add */}
                <div className="flex items-center gap-2">
                  {showSearch ? (
                    <div className="relative flex-1">
                      <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-500"></i>
                      <input
                        type="text"
                        placeholder="Enter"
                        className="w-full rounded-md bg-gray-100 py-2 pr-10 pl-10 text-[13px] font-semibold text-gray-700 outline-none hover:bg-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchTerm("");
                        }}
                      >
                        <i className="bx bx-x text-lg leading-none"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-3 py-2 text-start text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                      onClick={() => setShowSearch(true)}
                    >
                      <i className="bx bx-menu-search text-xl"></i>
                      Search
                    </button>
                  )}
                </div>

                <div className="mt-1 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                <div
                  className="relative mt-4 flex items-center justify-between px-3"
                  ref={programFilterRef}
                >
                  <button
                    className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-600 hover:text-gray-800"
                    onClick={() => setShowProgramFilter(!showProgramFilter)}
                  >
                    <span>
                      {selectedProgramFilter === "All"
                        ? "All Programs"
                        : selectedProgramFilter}
                    </span>
                    <i
                      className={`bx bx-chevron-down text-lg transition-transform duration-200 ease-in-out ${
                        showProgramFilter ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={() => {
                      setSelectedYearLevel("");
                      fetchSubjects();
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    title="Refresh subjects"
                  >
                    <i className="bx bx-refresh-ccw text-sm"></i>
                    Refresh
                  </button>

                  {showProgramFilter && (
                    <div className="animate-dropdown animate-fadein absolute top-8 left-0 z-20 ml-2 min-w-[150px] rounded border border-gray-300 bg-white p-1 shadow-lg">
                      <div
                        className="flex cursor-pointer items-center gap-2 rounded-sm py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedProgramFilter("All");
                          setShowProgramFilter(false);
                        }}
                      >
                        <i className="bx bx-layer text-sm text-gray-700"></i>
                        All Programs
                      </div>
                      {Array.from(
                        new Set(subjects.map((s) => s.programName)),
                      ).map((programName) => (
                        <div
                          key={programName}
                          className="flex cursor-pointer items-center gap-2 rounded-sm py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setSelectedProgramFilter(programName);
                            setShowProgramFilter(false);
                          }}
                        >
                          <i className="bx bx-layer text-sm text-gray-700"></i>
                          {getDisplayProgramName(programName)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects List (filtered by search or year level) */}
            <div className="custom-scrollbar flex-1 overflow-y-auto pb-16 sm:pb-4">
              <ul className="w-full">
                {subjectLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="loader"></div>
                  </div>
                ) : networkError ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={noInternetImage}
                      alt="No internet connection"
                      className="mb-3 h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      Unstable Connection
                    </span>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={emptyImage}
                      alt="No subjects available"
                      className="h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      No Subjects Available
                    </span>
                  </div>
                ) : searchTerm.trim() && filteredSubjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={notFoundImage}
                      alt="No results found"
                      className="mb-3 h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      Subject Not Found
                    </span>
                  </div>
                ) : searchTerm.trim() ? (
                  // Group subjects by program for search results
                  Object.entries(
                    filteredSubjects.reduce((acc, subject) => {
                      const program = subject.programName || "Unassigned";
                      if (!acc[program]) acc[program] = [];
                      acc[program].push(subject);
                      return acc;
                    }, {}),
                  )
                    .filter(
                      ([programName]) =>
                        selectedProgramFilter === "All" ||
                        programName === selectedProgramFilter,
                    )
                    .map(([programName, subjects]) => (
                      <div key={programName}>
                        {selectedProgramFilter === "All" && (
                          <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                            <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                              {getDisplayProgramName(programName)}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                          </div>
                        )}
                        {subjects.map((subject) => (
                          <li
                            key={subject.subjectID}
                            className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                            onClick={() => {
                              setSelectedSubject(null);
                              handleSelectSubject(subject);
                              navigate(homePath);
                            }}
                          >
                            <span className="flex-1 truncate text-[13px]">
                              {subject.subjectCode} - {subject.subjectName}
                            </span>
                            <div className="relative">
                              {openKebabMenu === subject.subjectID && (
                                <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(subject);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-edit text-sm"></i>
                                    Edit
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSubjectToDelete(subject);
                                      setShowDeleteModal(true);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-trash text-sm"></i>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </div>
                    ))
                ) : !selectedYearLevel || selectedYearLevel === "" ? (
                  // Show all subjects when "All Subjects" is selected
                  Object.entries(
                    subjects.reduce((acc, subject) => {
                      const program = subject.programName || "Unassigned";
                      if (!acc[program]) acc[program] = [];
                      acc[program].push(subject);
                      return acc;
                    }, {}),
                  )
                    .filter(
                      ([programName]) =>
                        selectedProgramFilter === "All" ||
                        programName === selectedProgramFilter,
                    )
                    .map(([programName, subjects]) => (
                      <div key={programName}>
                        {selectedProgramFilter === "All" && (
                          <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                            <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                              {getDisplayProgramName(programName)}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                          </div>
                        )}
                        {subjects.map((subject) => (
                          <li
                            key={subject.subjectID}
                            className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                            onClick={() => {
                              setSelectedSubject(null);
                              handleSelectSubject(subject);
                              navigate(homePath);
                            }}
                          >
                            <span className="flex-1 truncate text-[13px]">
                              {subject.subjectCode} - {subject.subjectName}
                            </span>
                            <div className="relative">
                              {openKebabMenu === subject.subjectID && (
                                <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(subject);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-edit text-sm"></i>
                                    Edit
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSubjectToDelete(subject);
                                      setShowDeleteModal(true);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-trash text-sm"></i>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </div>
                    ))
                ) : selectedYearLevel && selectedYearLevel !== "" ? (
                  yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                    // Group subjects by program for year level results
                    Object.entries(
                      yearLevelGroups[selectedYearLevel].reduce(
                        (acc, subject) => {
                          const program = subject.programName || "Unassigned";
                          if (!acc[program]) acc[program] = [];
                          acc[program].push(subject);
                          return acc;
                        },
                        {},
                      ),
                    )
                      .filter(
                        ([programName]) =>
                          selectedProgramFilter === "All" ||
                          programName === selectedProgramFilter,
                      )
                      .map(([programName, subjects]) => (
                        <div key={programName}>
                          {selectedProgramFilter === "All" && (
                            <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                              <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                                {getDisplayProgramName(programName)}
                              </span>
                              <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                            </div>
                          )}
                          {subjects.map((subject) => (
                            <li
                              key={subject.subjectID}
                              className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                              onClick={() => {
                                setSelectedSubject(null);
                                handleSelectSubject(subject);
                                navigate(homePath);
                              }}
                            >
                              <span className="flex-1 truncate text-[13px]">
                                {subject.subjectCode} - {subject.subjectName}
                              </span>
                              <div className="relative">
                                {openKebabMenu === subject.subjectID && (
                                  <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(subject);
                                        setOpenKebabMenu(null);
                                      }}
                                    >
                                      <i className="bx bx-edit text-sm"></i>
                                      Edit
                                    </button>
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSubjectToDelete(subject);
                                        setShowDeleteModal(true);
                                        setOpenKebabMenu(null);
                                      }}
                                    >
                                      <i className="bx bx-trash text-sm"></i>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <img
                        src={emptyImage}
                        alt="No subjects available"
                        className="h-32 w-32 opacity-80"
                      />
                      <span className="text-[14px] font-semibold text-gray-500">
                        No Subjects Available
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-2 text-center text-sm text-gray-500">
                    Select a year level or search to view subjects
                  </div>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Modal for sm and md screens */}
      {isTabletOpen && (
        <div className="lightbox-bg fixed inset-0 z-50 hidden items-center justify-center sm:flex lg:hidden">
          <div className="animate-fade-in-up relative mx-4 flex max-h-[95vh] w-full max-w-md flex-col rounded-lg border border-gray-300 bg-white shadow-2xl">
            {/* Year Level Dropdown at the top */}
            <div className="open-sans flex items-center justify-between px-3 pt-2 pb-2 text-[16px] font-semibold">
              <span>Select a Subject</span>
              {/* Close button for small screens */}
              <button
                onClick={() => {
                  setIsTabletOpen(false);
                  setIsSubjectFocused(false);
                  setShowAddModal(false);
                  setSearchTerm("");
                  setFilteredSubjects(subjects);
                  setIsExpanded(false);
                  setShowYearSubjects(false);
                }}
                className="ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 transition duration-200 hover:bg-gray-100"
                title="Close"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <div className="mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

            <div className="relative flex flex-col items-center gap-2 p-2">
              {/* Custom Year Level Dropdown */}
              <div className="w-full" ref={dropdownRef}>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="border-color flex flex-1 cursor-pointer items-center justify-between rounded-md border bg-white px-3 py-[8px] text-[13px] font-semibold hover:bg-gray-100 focus:outline-none sm:py-[3.5px]"
                    onClick={() => setShowYearSubjects((prev) => !prev)}
                  >
                    <span className="flex items-center gap-2 text-nowrap">
                      <i className="bx bx-list-ul text-2xl text-gray-500"></i>
                      {selectedYearLevel
                        ? `${selectedYearLevel}${selectedYearLevel === "1" ? "st" : selectedYearLevel === "2" ? "nd" : selectedYearLevel === "3" ? "rd" : "th"} Year Subjects`
                        : "All Year Level"}
                    </span>
                    <i
                      className={`bx bx-chevron-down ml-1 text-2xl text-gray-500 transition-transform duration-200 ease-in-out ${
                        showYearSubjects ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {showYearSubjects && (
                  <ul className="animate-dropdown animate-fadein absolute left-0 z-10 mx-2 mt-1 w-[calc(100%-16px)] rounded border border-gray-300 bg-white p-1 shadow-lg">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm hover:bg-orange-50"
                      onClick={() => {
                        setSelectedYearLevel("");
                        setShowYearSubjects(false);
                      }}
                    >
                      <i className="bx bx-layer text-lg text-gray-700"></i>All
                      Year Level
                    </li>
                    {yearLevelOptions.map((yearLevel) => (
                      <li
                        key={yearLevel}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-[13px] hover:bg-gray-100"
                        onClick={() => {
                          setSelectedYearLevel(yearLevel);
                          setShowYearSubjects(false);
                        }}
                      >
                        <i className="bx bx-layer text-[13px] text-gray-700"></i>
                        {`${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year Subjects`}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                <button
                  className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-3 py-2 text-start text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bx bx-plus text-lg"></i>
                  Add Subject
                </button>
                <div className="mt-1 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                {/* Search and Add */}
                <div className="flex items-center gap-2">
                  {showSearch ? (
                    <div className="relative flex-1">
                      <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-500"></i>
                      <input
                        type="text"
                        placeholder="Enter"
                        className="w-full rounded-md bg-gray-100 py-2 pr-10 pl-10 text-[13px] font-semibold text-gray-700 outline-none hover:bg-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchTerm("");
                        }}
                      >
                        <i className="bx bx-x text-lg leading-none"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-3 py-2 text-start text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                      onClick={() => setShowSearch(true)}
                    >
                      <i className="bx bx-menu-search text-xl"></i>
                      Search
                    </button>
                  )}
                </div>

                <div className="mt-1 mb-1 h-[0.5px] bg-[rgb(230,230,230)]" />

                <div
                  className="relative mt-4 flex items-center justify-between px-3"
                  ref={programFilterRef}
                >
                  <button
                    className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-600 hover:text-gray-800"
                    onClick={() => setShowProgramFilter(!showProgramFilter)}
                  >
                    <span>
                      {selectedProgramFilter === "All"
                        ? "All Programs"
                        : selectedProgramFilter}
                    </span>
                    <i
                      className={`bx bx-chevron-down text-lg transition-transform duration-200 ease-in-out ${
                        showProgramFilter ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={() => {
                      setSelectedYearLevel("");
                      fetchSubjects();
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    title="Refresh subjects"
                  >
                    <i className="bx bx-refresh-ccw text-sm"></i>
                    Refresh
                  </button>

                  {showProgramFilter && (
                    <div className="animate-dropdown animate-fadein absolute top-8 left-0 z-20 ml-2 min-w-[150px] rounded border border-gray-300 bg-white p-1 shadow-lg">
                      <div
                        className="flex cursor-pointer items-center gap-2 rounded-sm py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedProgramFilter("All");
                          setShowProgramFilter(false);
                        }}
                      >
                        <i className="bx bx-layer text-sm text-gray-700"></i>
                        All Programs
                      </div>
                      {Array.from(
                        new Set(subjects.map((s) => s.programName)),
                      ).map((programName) => (
                        <div
                          key={programName}
                          className="flex cursor-pointer items-center gap-2 rounded-sm py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setSelectedProgramFilter(programName);
                            setShowProgramFilter(false);
                          }}
                        >
                          <i className="bx bx-layer text-sm text-gray-700"></i>
                          {getDisplayProgramName(programName)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects List (filtered by search or year level) */}
            <div className="custom-scrollbar flex-1 overflow-y-auto pb-16 sm:pb-4">
              <ul className="w-full">
                {subjectLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="loader"></div>
                  </div>
                ) : networkError ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={noInternetImage}
                      alt="No internet connection"
                      className="mb-3 h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      Unstable Connection
                    </span>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={emptyImage}
                      alt="No subjects available"
                      className="h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      No Subjects Available
                    </span>
                  </div>
                ) : searchTerm.trim() && filteredSubjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <img
                      src={notFoundImage}
                      alt="No results found"
                      className="mb-3 h-32 w-32 opacity-80"
                    />
                    <span className="text-[14px] font-semibold text-gray-500">
                      Subject Not Found
                    </span>
                  </div>
                ) : searchTerm.trim() ? (
                  // Group subjects by program for search results
                  Object.entries(
                    filteredSubjects.reduce((acc, subject) => {
                      const program = subject.programName || "Unassigned";
                      if (!acc[program]) acc[program] = [];
                      acc[program].push(subject);
                      return acc;
                    }, {}),
                  )
                    .filter(
                      ([programName]) =>
                        selectedProgramFilter === "All" ||
                        programName === selectedProgramFilter,
                    )
                    .map(([programName, subjects]) => (
                      <div key={programName}>
                        {selectedProgramFilter === "All" && (
                          <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                            <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                              {getDisplayProgramName(programName)}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                          </div>
                        )}
                        {subjects.map((subject) => (
                          <li
                            key={subject.subjectID}
                            className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                            onClick={() => {
                              setSelectedSubject(null);
                              handleSelectSubject(subject);
                              navigate(homePath);
                              setIsTabletOpen(false); // <-- add this
                            }}
                          >
                            <span className="flex-1 truncate text-[13px]">
                              {subject.subjectCode} - {subject.subjectName}
                            </span>
                            <div className="relative">
                              {openKebabMenu === subject.subjectID && (
                                <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(subject);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-edit text-sm"></i>
                                    Edit
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSubjectToDelete(subject);
                                      setShowDeleteModal(true);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-trash text-sm"></i>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </div>
                    ))
                ) : !selectedYearLevel || selectedYearLevel === "" ? (
                  // Show all subjects when "All Subjects" is selected
                  Object.entries(
                    subjects.reduce((acc, subject) => {
                      const program = subject.programName || "Unassigned";
                      if (!acc[program]) acc[program] = [];
                      acc[program].push(subject);
                      return acc;
                    }, {}),
                  )
                    .filter(
                      ([programName]) =>
                        selectedProgramFilter === "All" ||
                        programName === selectedProgramFilter,
                    )
                    .map(([programName, subjects]) => (
                      <div key={programName}>
                        {selectedProgramFilter === "All" && (
                          <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                            <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                              {getDisplayProgramName(programName)}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                          </div>
                        )}
                        {subjects.map((subject) => (
                          <li
                            key={subject.subjectID}
                            className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                            onClick={() => {
                              setSelectedSubject(null);
                              handleSelectSubject(subject);
                              navigate(homePath);
                              setIsTabletOpen(false); // <-- add this
                            }}
                          >
                            <span className="flex-1 truncate text-[13px]">
                              {subject.subjectCode} - {subject.subjectName}
                            </span>
                            <div className="relative">
                              {openKebabMenu === subject.subjectID && (
                                <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(subject);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-edit text-sm"></i>
                                    Edit
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSubjectToDelete(subject);
                                      setShowDeleteModal(true);
                                      setOpenKebabMenu(null);
                                    }}
                                  >
                                    <i className="bx bx-trash text-sm"></i>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </div>
                    ))
                ) : selectedYearLevel && selectedYearLevel !== "" ? (
                  yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                    // Group subjects by program for year level results
                    Object.entries(
                      yearLevelGroups[selectedYearLevel].reduce(
                        (acc, subject) => {
                          const program = subject.programName || "Unassigned";
                          if (!acc[program]) acc[program] = [];
                          acc[program].push(subject);
                          return acc;
                        },
                        {},
                      ),
                    )
                      .filter(
                        ([programName]) =>
                          selectedProgramFilter === "All" ||
                          programName === selectedProgramFilter,
                      )
                      .map(([programName, subjects]) => (
                        <div key={programName}>
                          {selectedProgramFilter === "All" && (
                            <div className="mt-4 mb-2 flex items-center gap-2 px-4">
                              <span className="text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700 uppercase">
                                {getDisplayProgramName(programName)}
                              </span>
                              <div className="h-[0.5px] flex-1 bg-[rgb(230,230,230)]"></div>
                            </div>
                          )}
                          {subjects.map((subject) => (
                            <li
                              key={subject.subjectID}
                              className={`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`}
                              onClick={() => {
                                setSelectedSubject(null);
                                handleSelectSubject(subject);
                                navigate(homePath);
                                setIsTabletOpen(false); // <-- add this
                              }}
                            >
                              <span className="flex-1 truncate text-[13px]">
                                {subject.subjectCode} - {subject.subjectName}
                              </span>
                              <div className="relative">
                                {openKebabMenu === subject.subjectID && (
                                  <div className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg">
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(subject);
                                        setOpenKebabMenu(null);
                                      }}
                                    >
                                      <i className="bx bx-edit text-sm"></i>
                                      Edit
                                    </button>
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSubjectToDelete(subject);
                                        setShowDeleteModal(true);
                                        setOpenKebabMenu(null);
                                      }}
                                    >
                                      <i className="bx bx-trash text-sm"></i>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <img
                        src={emptyImage}
                        alt="No subjects available"
                        className="h-32 w-32 opacity-80"
                      />
                      <span className="text-[14px] font-semibold text-gray-500">
                        No Subjects Available
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-2 text-center text-sm text-gray-500">
                    Select a year level or search to view subjects
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal (unchanged, but now only opens from secondary sidebar) */}
      {showAddModal && (
        <>
          <div className="open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
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

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
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
                      setShowAddModal(false);
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

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default SideBarDropDown;
