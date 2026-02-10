import { useEffect, useState, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import SideBarToolTip from "./sidebarTooltip";
import RegisterDropDownSmall from "./registerDropDownSmall";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import notFoundImage from "../assets/icons/notfound.png";
import noInternetImage from "../assets/icons/404notfound.png";
import emptyImage from "../assets/icons/empty.png";

const SideBarDropDown = ({
  item,
  isExpanded,
  setIsExpanded,
  setSelectedSubject,
  setIsSubjectFocused,
  homePath,
  selectedSubject,
  className,
}) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchUnassigned, setSearchUnassigned] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const [openMenuID, setOpenMenuID] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] =
    useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);

  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [showYearSubjects, setShowYearSubjects] = useState(false);
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  const dropdownRef = useRef(null);
  const [showProgramFilter, setShowProgramFilter] = useState(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("All");
  const programFilterRef = useRef(null);
  const unassignedSubjects = subjects.filter(
    (subject) =>
      !assignedSubjects.some(
        (assigned) => assigned.subjectID === subject.subjectID,
      ),
  );

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
        setFilteredSubjects(assignedSubjects);
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
    assignedSubjects,
  ]);

  // Handle initial mount
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsExpanded(true);
      setIsSubjectFocused(true);
    }
  }, []);

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

  // Prevent background scrolling when Assign Subject modal is open
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

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
          console.error("Forbidden: Only Deans can access subjects.");
          return;
        }

        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.subjects)) {
        console.error("Unexpected subjects data format:", data);
        return;
      }

      // Sort subjects alphabetically by subjectCode
      const sortedSubjects = [...data.subjects].sort((a, b) =>
        a.subjectCode.localeCompare(b.subjectCode),
      );

      setSubjects(sortedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedSubjects = async () => {
    const token = localStorage.getItem("token");
    setSubjectLoading(true);
    try {
      const response = await fetch(`${apiUrl}/faculty/my-subjects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched assigned subjects:", data); // Debug log

        if (!Array.isArray(data.subjects)) {
          console.error("Unexpected assigned subjects data format:", data);
          return;
        }

        const sortedSubjects = [...data.subjects].sort((a, b) =>
          a.subjectCode.localeCompare(b.subjectCode),
        );

        console.log("Setting assigned subjects:", sortedSubjects); // Debug log
        setAssignedSubjects(sortedSubjects);
        setFilteredSubjects(sortedSubjects);
      } else {
        console.error(
          "Failed to fetch assigned subjects:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching assigned subjects:", error);
    } finally {
      setSubjectLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignedSubjects();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      setIsOpen(false);
      setSearchTerm("");
      setFilteredSubjects(assignedSubjects);
      setShowYearSubjects(false);
      setOpenMenuID(null);
      if (listRef.current) {
        listRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [isExpanded, assignedSubjects]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubjects(assignedSubjects);
    } else {
      const results = assignedSubjects.filter(
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
  }, [searchTerm, assignedSubjects]);

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
      setFilteredSubjects(assignedSubjects);
      setIsExpanded(false);
      setShowYearSubjects(false);
    }
  };

  const handleAssignSubject = async (subject) => {
    if (!subject) return;

    const token = localStorage.getItem("token");

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

        await fetchAssignedSubjects();

        setSelectedSubjectForAssignment(null);
        setShowAddModal(false);

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
          setFilteredSubjects(assignedSubjects);
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
  }, [isOpen, assignedSubjects]);

  // Expose refreshSubjects function
  const handleRefreshSubjects = () => {
    fetchAssignedSubjects();
  };

  useEffect(() => {
    const handleRefresh = () => fetchAssignedSubjects();
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
              setFilteredSubjects(assignedSubjects);
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
              setFilteredSubjects(assignedSubjects);
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
            className={`open-sans sm:bg-opacity-0 fixed inset-0 z-50 flex h-[100vh] flex-col border border-gray-300 bg-white transition-all duration-200 ease-in-out sm:hidden lg:inset-auto lg:top-0 lg:left-[55px] lg:flex lg:w-62 lg:translate-x-0 lg:translate-y-0 lg:border-l lg:shadow-none ${
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
                  setFilteredSubjects(assignedSubjects);
                  setIsExpanded(false);
                  setShowYearSubjects(false);
                }}
                className="ml-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 transition duration-200 hover:bg-gray-100"
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
                  Assign a Subject
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
                      fetchAssignedSubjects();
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
                        new Set(assignedSubjects.map((s) => s.programName)),
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
                          {programName}
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
                ) : assignedSubjects.length === 0 ? (
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
                              {programName}
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
                  // Show all assigned subjects when "All Subjects" is selected
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
                              {programName}
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
                                {programName}
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

              {/* Close button */}
              <button
                onClick={() => {
                  setIsTabletOpen(false);
                  setIsSubjectFocused(false);
                  setShowAddModal(false);
                  setSearchTerm("");
                  setFilteredSubjects(assignedSubjects);
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
                  Assign a Subject
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
                      fetchAssignedSubjects();
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
                        new Set(assignedSubjects.map((s) => s.programName)),
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
                          {programName}
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
                ) : assignedSubjects.length === 0 ? (
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
                              {programName}
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
                              {programName}
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
                                {programName}
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

      {/* Add Assign Subject Modal */}
      {showAddModal && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center p-2">
          <div className="animate-fade-in-up font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Assign a Subject</span>
          </div>

          <div className="animate-fade-in-up border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            <div className="mt-2 flex w-full items-center gap-2">
              <div className="w-4/5">
                <input
                  type="text"
                  placeholder="Search subject..."
                  value={searchUnassigned}
                  onChange={(e) => setSearchUnassigned(e.target.value)}
                  className={`relative w-full cursor-text rounded-md border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
                />
              </div>
              <button
                className="border-color flex cursor-pointer items-center gap-1 rounded-md border px-3 py-[7px] text-sm hover:bg-gray-200"
                onClick={fetchSubjects}
              >
                <i className="bx bx-refresh-ccw text-[18px]"></i> Refresh
              </button>
            </div>

            <div className="mt-4 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {/* Subject List for Assigning */}
            <div className="mb-3">
              <ul className="max-h-[200px] overflow-y-auto" ref={listRef}>
                {loading ? (
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
                    .sort((a, b) => a.programName.localeCompare(b.programName))
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
                        onClick={() => setSelectedSubjectForAssignment(subject)}
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

            <div className="-mx-2 mt-5 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            <div className="mb-1 flex justify-end gap-2">
              <button
                className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowAddModal(false)}
              >
                <span className="px-1 text-[16px]">Cancel</span>
              </button>

              <button
                className="flex w-[80px] cursor-pointer items-center justify-center rounded-md bg-orange-500 px-[12px] py-[6px] text-[14px] text-white hover:bg-orange-700"
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
      )}

      {showDeleteModal && subjectToDelete && (
        <div className="bg-opacity-50 lightbox-bg fixed inset-0 z-57 flex items-center justify-center">
          <div className="mx-3 w-full max-w-md rounded-md bg-white shadow-lg">
            {/* Yellow top border */}
            <div className="h-2 w-full rounded-t-md bg-[rgb(249,115,22)]" />
            <div className="flex flex-row items-center gap-6 px-6 py-6">
              {/* Warning icon - diamond with exclamation mark */}
              <div
                className="flex flex-shrink-0 items-center justify-center overflow-visible p-1"
                style={{ height: "64px", width: "64px" }}
              >
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="28"
                    y="4"
                    width="36"
                    height="36"
                    rx="5"
                    transform="rotate(45 28 4)"
                    fill="#f97316"
                    stroke="#f97316"
                    strokeWidth="2"
                  />

                  <text
                    x="28"
                    y="38"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="bold"
                    fill="#FFF"
                  >
                    !
                  </text>
                </svg>
              </div>
              {/* Text content */}
              <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-800">
                  Confirmation
                </h2>
                <p className="mb-2 text-sm text-gray-700">
                  Are you sure you want to remove
                  <span className="font-bold">
                    {" "}
                    {subjectToDelete.subjectName} ({subjectToDelete.subjectCode}
                    )
                  </span>
                </p>
              </div>
            </div>
            {/* Divider */}
            <div className="h-[0.5px] bg-[rgb(200,200,200)]" />

            {/* Buttons row */}
            <div className="flex w-full justify-end gap-2 px-4 py-3">
              <button
                className="bg-whie border-color flex cursor-pointer items-center gap-1 rounded-md border px-[12px] py-[6px] text-gray-700 hover:bg-gray-200"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="inline text-[14px]">Cancel</span>
              </button>
              <button
                className="flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[18px] py-[6px] text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={async () => {
                  // The actual delete logic is now handled in subjectCardFaculty.
                  // This modal and UI logic remain.
                  setShowDeleteModal(false);
                  setSubjectToDelete(null);
                }}
              >
                {isDeleting ? (
                  <span className="loader-white"></span>
                ) : (
                  <span className="inline text-[14px]">Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default SideBarDropDown;
