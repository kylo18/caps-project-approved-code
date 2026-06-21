import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import { Textfit } from "react-textfit";
import PracticeExamConfig from "./SubjectSettingsDean";
import { useNavigate } from "react-router-dom";
import RegisterDropDownSmall from "./registerDropDownSmall";
import ConfirmModal from "./confirmModal";
import PrintExamModal from "./PrintExamModal";

// Component to display subject information and tabs for admin/faculty view
const SubjectCard = ({
  subjectName,
  subjectID,
  subjectCode,
  location,
  activeIndex,
  setActiveIndex,
  isLoading,
  onFetchQuestions,
  programName,
  yearLevel,
  programID,
  yearLevelID,
  refreshSubjects,
  setSelectedSubject,
  showToast,
  searchQuery,
  setSearchQuery,
  isExamQuestionsEnabled,
  setIsExamQuestionsEnabled,
  practiceExamSettings,
  setPracticeExamSettings,
  pendingCount = 0,
}) => {
  const mobileTabRefs = useRef([]);
  const [mobileIndicatorStyle, setMobileIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const updateMobileIndicatorPosition = () => {
      const el = mobileTabRefs.current[activeIndex];
      if (el) {
        setMobileIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    };

    // Update position immediately
    updateMobileIndicatorPosition();

    // Add resize listener
    const handleResize = () => {
      setIsResizing(true);
      updateMobileIndicatorPosition();

      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set timeout to re-enable animations after resize stops
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 150); // Small delay to ensure resize has stopped
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [activeIndex]);

  const tabletTabRefs = useRef([]);
  const [tabletIndicatorStyle, setTabletIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const updateTabletIndicatorPosition = () => {
      const el = tabletTabRefs.current[activeIndex];
      if (el) {
        setTabletIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    };

    // Update position immediately
    updateTabletIndicatorPosition();

    // Add resize listener
    const handleResize = () => {
      setIsResizing(true);
      updateTabletIndicatorPosition();

      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set timeout to re-enable animations after resize stops
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 150); // Small delay to ensure resize has stopped
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [activeIndex]);

  const tabs = [
    { label: "Practice Exam", index: 0 },
    { label: "Qualifying Exam", index: 1 },
    { label: "Pending", index: 4 },
  ];

  // State for tab indicator animation
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  // State for practice exam configuration modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State for mobile dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  // Refs for tab elements and dropdown positioning
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Dropdown for edit/remove
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showActionDropdownDesk, setShowActionDropdownDesk] = useState(false);
  const [showActionDropdownTablet, setShowActionDropdownTablet] =
    useState(false);

  const actionDropdownRef = useRef(null);
  const actionButtonRef = useRef(null);

  // Edit subject modal state
  const [editingSubject, setEditingSubject] = useState(false);
  const editModalRef = useRef(null); // Add this ref for the edit modal
  const [editedSubject, setEditedSubject] = useState({
    subjectCode: "",
    subjectName: "",
    subjectID: "",
    programID: "",
    yearLevelID: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [programs, setPrograms] = useState([]);
  const yearLevelOptions = ["1", "2", "3", "4"];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target) &&
        !actionButtonRef.current.contains(event.target)
      ) {
        setShowActionDropdown(false);
        setShowActionDropdownDesk(false);
        setShowActionDropdownTablet(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });

  useEffect(() => {
    function updatePosition() {
      if (actionButtonRef.current && showActionDropdownTablet) {
        const buttonRect = actionButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: buttonRect.bottom + window.scrollY,
          left: buttonRect.left + window.scrollX,
        });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [showActionDropdownTablet]);

  // Fetch programs and year levels
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/programs`,
          {
          credentials: "include",
            headers: { },
          },
        );
        const data = await res.json();
        if (res.ok) setPrograms(data.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
  }, []);

  // Edit button handler
  const handleEdit = () => {
    setShowActionDropdown(false);
    setShowActionDropdownDesk(false);
    setShowActionDropdownTablet(false);
    setEditingSubject(true);
    setEditedSubject({
      subjectCode,
      subjectName,
      subjectID,
      programID: programID ? String(programID) : "",
      yearLevelID: yearLevelID ? String(yearLevelID) : "",
    });
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    setIsEditing(true);
    try {
      const updateData = {
        subjectCode: editedSubject.subjectCode,
        subjectName: editedSubject.subjectName,
        programID: editedSubject.programID,
        yearLevelID: String(editedSubject.yearLevelID),
      };
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subjects/${subjectID}/update`,
        {
          credentials: "include",
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      const result = await response.json();
      if (response.ok) {
        showToast(result.message || "Subject updated successfully", "success");
        if (refreshSubjects) refreshSubjects();
        window.dispatchEvent(new Event("refreshSubjectsList"));
        if (onFetchQuestions) onFetchQuestions();
        if (setSelectedSubject) setSelectedSubject(null);
        setEditingSubject(false);
      } else {
        switch (response.status) {
          case 401:
            showToast(
              "You are not authenticated. Please log in again.",
              "error",
            );
            break;
          case 403:
            showToast("You are not authorized to modify subjects.", "error");
            break;
          case 404:
            showToast("Subject not found.", "error");
            break;
          case 409:
            showToast(
              result.message || "A subject with these details already exists.",
              "error",
            );
            break;
          case 500:
            showToast(
              "An error occurred while updating the subject. Please try again.",
              "error",
            );
            break;
          default:
            showToast(result.message || "Failed to update subject.", "error");
        }
      }
    } catch (error) {
      showToast(
        "An unexpected error occurred while connecting to the server.",
        "error",
      );
    } finally {
      setIsEditing(false);
    }
  };

  // Effect to update tab indicator position
  useEffect(() => {
    const updateIndicatorPosition = () => {
      if (tabRefs.current[activeIndex]) {
        const activeTab = tabRefs.current[activeIndex];
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        });
      }
    };

    // Update position immediately
    updateIndicatorPosition();

    // Add resize listener
    const handleResize = () => {
      setIsResizing(true);
      updateIndicatorPosition();

      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set timeout to re-enable animations after resize stops
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 150); // Small delay to ensure resize has stopped
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [activeIndex]);

  // Function to open practice exam configuration
  const handleAssignClick = () => {
    setShowActionDropdown(false);
    setShowActionDropdownDesk(false);
    setShowActionDropdownTablet(false);
    setIsFormOpen(true);
  };

  // Effect to handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to handle successful exam configuration
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    showToast("Exam successfully configured!", "success");
  };

  // Delete subject handler
  const handleDeleteSubject = async (subjectID) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subjects/${subjectID}/delete`,
        {
          credentials: "include",
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        if (setSelectedSubject) setSelectedSubject(null);
        if (refreshSubjects) refreshSubjects();
        window.dispatchEvent(new Event("refreshSubjectsList"));
        showToast("Subject deleted successfully", "success");
      } else {
        showToast("Failed to delete subject", "error");
      }
    } catch (error) {
      showToast("Error deleting subject", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const [, setTabIndicatorUpdate] = useState(0);

  useEffect(() => {
    setTabIndicatorUpdate((n) => n + 1);
  }, [activeIndex, subjectName]); // subjectName in case the tab bar changes width

  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef(null);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (showDropdown || editingSubject || showDeleteModal || isFormOpen) {
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
  }, [showDropdown, editingSubject, showDeleteModal, isFormOpen]);

  // Close dropdown when any modal is open
  useEffect(() => {
    if (editingSubject || showDeleteModal || isFormOpen) {
      setShowDropdown(false);
    }
  }, [editingSubject, showDeleteModal, isFormOpen]);

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  // Add this useEffect to close edit modal on outside click for min-[448px]
  useEffect(() => {
    if (!editingSubject) return;
    function handleClickOutside(event) {
      if (window.innerWidth <= 448) {
        if (
          editModalRef.current &&
          !editModalRef.current.contains(event.target)
        ) {
          setEditingSubject(false);
          setValidationError("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingSubject]);

  const [showPreview, setShowPreview] = useState(false);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetSubject, setWorksheetSubject] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <div>
      {isLoading ? null : (
        <>
          {/* Top search bar (desktop only) */}
          <div className="outfit-500 relative mx-auto -mt-1 mb-5 hidden w-full max-w-[1250px] px-2 text-[14px] lg:block">
            <i className="bx bx-search absolute top-1/2 left-5 -translate-y-1/2 text-lg text-gray-500" />
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              value={searchQuery || ""}
              maxLength={50}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            />
            {searchQuery && setSearchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <i className="bx bx-x text-xl" />
              </button>
            )}
          </div>

          {/* Mobile & Tablet */}
          <div className="border-color relative z-48 mt-10 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:block sm:rounded-t-md sm:pt-4 md:hidden">
            <div className="flex flex-wrap items-start justify-between sm:hidden">
              <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
                <h1 className="outfit-700 mt-2 ml-2 text-[18px] font-bold break-words">
                  {subjectName}
                </h1>
                <div className="outfit-400 mt-2 ml-2 flex gap-1 text-gray-500">
                  <i className="bx bx-book mt-[1px] text-lg"></i>
                  <p className="text-[14px]">{subjectCode}</p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {programName === "GE" ? "General " : programName || "-"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">{yearLevel || "-"}</p>
                </div>
              </div>
              <img
                src={SubPhoto}
                alt="Subject"
                className="border-color mt-1 size-20 rounded-md border object-cover"
              />
            </div>

            <div className="hidden flex-wrap items-center sm:flex">
              <img
                src={SubPhoto}
                alt="Subject"
                className="border-color mr-5 size-18 rounded-md border object-cover"
              />
              <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
                <h1 className="outfit-700 text-[15px] font-bold break-words md:text-[18px]">
                  {subjectName}
                </h1>
                <div className="outfit-400 mt-1 flex gap-1 text-gray-500">
                  <i className="bx bx-book mt-[1px] text-lg"></i>

                  <p className="text-[14px]">{subjectCode}</p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {programName === "GE"
                      ? "General Subject"
                      : programName || "-"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">{yearLevel || "-"}</p>
                </div>
              </div>
            </div>

            {/* Button row for Tablet and Mobile (Configure, Preview, Worksheet, Menu) */}
            <div className="outfit-500 mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold md:hidden">
              <button
                onClick={() =>
                  alert("Exam preview will be available in a future update.")
                }
                className="border-color mb-6 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-eye text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>
              <button
                onClick={handleAssignClick}
                className="border-color mb-6 flex items-center justify-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-cog text-lg"></i>
                <span>Settings</span>
              </button>
              <button
                className="border-color mb-6 hidden items-center justify-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
                onClick={() => {
                  setWorksheetSubject({
                    subjectID,
                    subjectName,
                    subjectCode,
                    programName,
                    yearLevel,
                  });
                  setIsWorksheetModalOpen(true);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-download-icon lucide-download"
                >
                  <path d="M12 15V3" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                <span className="text-[14px]">Worksheet</span>
              </button>

              {/* Mobile search toggle */}
              <button
                type="button"
                onClick={() => setShowMobileSearch((prev) => !prev)}
                className="border-color mb-6 flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100"
              >
                <i
                  className={`bx ${showMobileSearch ? "bx-x" : "bx-search"} text-2xl`}
                ></i>
              </button>

              <button
                ref={actionButtonRef}
                onClick={() => setShowDropdown((prev) => !prev)}
                className="border-color mb-6 flex cursor-pointer items-center justify-center rounded-xl border px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100 md:hidden"
              >
                <i className="bx bx-dots-vertical-rounded text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Tablet Tabs Bar (below card) */}
          <div className="outfit-400 border-color relative z-48 -mt-2 mb-2 h-[50px] overflow-visible border bg-gray-50 pt-2 sm:mx-0 sm:block sm:rounded-b-md md:hidden">
            <ul className="mt-[6px] flex h-full w-full justify-between text-center">
              {tabs.map((tab) => (
                <li
                  key={tab.index}
                  ref={(el) => (tabletTabRefs.current[tab.index] = el)}
                  className={`relative flex-1 cursor-pointer text-[13px] transition-colors duration-200 ${
                    activeIndex === tab.index
                      ? "text-orange-500"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveIndex(tab.index)}
                >
                  {tab.label}
                  {tab.index === 4 && pendingCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 py-[1px] text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Tablet indicator line */}
            <span
              className={`absolute bottom-0 h-1 bg-orange-500 ${
                activeIndex === 0 ? "rounded-bl-md" : ""
              } ${activeIndex === 4 ? "rounded-br-md" : ""} ${
                isResizing ? "" : "transition-all duration-300"
              }`}
              style={{
                left: tabletIndicatorStyle.left,
                width: tabletIndicatorStyle.width,
              }}
            />
          </div>

          {/* Mobile & Tablet search bar (shown when toggled) */}
          {showMobileSearch && (
            <div className="outfit-500 relative mx-auto mt-4 mb-2 w-full max-w-[1250px] px-4 text-[14px] md:hidden">
              <i className="bx bx-search absolute top-1/2 left-7 -translate-y-1/2 text-lg text-gray-500" />
              <input
                type="text"
                placeholder="Search questions..."
                autoFocus
                inputMode="search"
                className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                value={searchQuery || ""}
                maxLength={50}
                onChange={(e) =>
                  setSearchQuery && setSearchQuery(e.target.value)
                }
              />
            </div>
          )}

          {/* Desktop */}
          <div className="border-color relative z-48 mx-auto -mt-3 hidden max-w-[1200px] overflow-visible border-b bg-white px-6 pt-6 pb-0 md:block">
            {/* Card header/content */}
            <div className="flex w-full flex-col items-center pb-4 md:flex-row md:flex-nowrap md:items-center">
              <div className="relative ml-2 flex flex-col items-center md:mr-5">
                <img
                  src={SubPhoto}
                  alt="Subject"
                  className="border-color size-21 rounded-md border object-cover"
                />
              </div>
              <div className="outfit-400 flex max-w-full min-w-0 flex-col flex-wrap md:max-w-[calc(100%-200px)]">
                <div className="outfit-700 line-clamp-2">
                  <Textfit
                    mode="multi"
                    min={14}
                    max={20}
                    style={{
                      fontWeight: 600,
                      lineHeight: "1.2",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    <span className="text-[18px]">{subjectName}</span>
                  </Textfit>
                </div>
                <div className="mt-2 flex gap-1 text-gray-500">
                  <i className="bx bx-book mt-[1px] text-[16px]"></i>
                  <p className="outfit-400 text-[14px]">{subjectCode}</p>
                  <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <i className="bx bx-cog mt-[1px] text-[16px]"></i>
                  <p className="outfit-400 text-[14px]">
                    {programName === "GE"
                      ? "General Subject"
                      : programName || "-"}
                  </p>
                  <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <i className="bx bx-people-diversity mt-[1px] text-[16px]"></i>
                  <p className="outfit-400 text-[14px]">{yearLevel || "-"}</p>
                </div>
              </div>
            </div>

            {/* Desktop Button Row */}
            <div className="outfit mb-0 flex w-full flex-row items-center justify-end gap-2 pb-1 font-semibold">
              {/* Right: Actions dropdown beside Configure, then Preview */}
              <div className="flex flex-row items-center gap-2">
                <div className="relative">
                  <button
                    ref={actionButtonRef}
                    onClick={() => setShowActionDropdownDesk((prev) => !prev)}
                    className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-2 text-gray-700 transition hover:bg-gray-100"
                  >
                    <i className="bx bx-dots-vertical-rounded text-2xl"></i>
                  </button>
                  {showActionDropdownDesk && (
                    <div
                      ref={actionDropdownRef}
                      className="border-color animate-fadein absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md border bg-white p-1 text-gray-700 shadow-lg"
                    >
                      <button
                        onClick={() => {
                          setWorksheetSubject({
                            subjectID,
                            subjectName,
                            subjectCode,
                            programName,
                            yearLevel,
                          });
                          setIsWorksheetModalOpen(true);
                          setShowActionDropdownDesk(false);
                        }}
                        className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-download-icon lucide-download"
                        >
                          <path d="M12 15V3" />
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <path d="m7 10 5 5 5-5" />
                        </svg>
                        Worksheet
                      </button>
                      <button
                        onClick={handleEdit}
                        className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <i className="bx bx-edit-alt text-base"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSubjectToDelete({
                            subjectID,
                            subjectName,
                            subjectCode,
                          });
                          setShowActionDropdownDesk(false);
                          setShowDeleteModal(true);
                        }}
                        className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100"
                      >
                        <i className="bx bx-trash text-base"></i>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAssignClick}
                  className="outfit-500 flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
                >
                  <i className="bx bxs-cog text-xl"></i>
                  <span className="text-[14px]">Settings</span>
                </button>
                <button
                  onClick={() =>
                    alert("Exam preview will be available in a future update.")
                  }
                  className="outfit-500 flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-600 bg-orange-500 px-4 py-2 text-white transition-all duration-100 hover:bg-orange-600 active:translate-y-[2px] active:border-b-2"
                >
                  <i className="bx bx-eye-big text-xl"></i>
                  <span className="outfit text-[14px] font-semibold">
                    Preview
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop Tabs Bar (bottom-left of SubjectCard, flush with bottom border) */}
            <div className="outfit-500 -mt-4 flex w-full justify-start">
              <div className="relative">
                {tabs.map((tab, index) => {
                  const isActive = activeIndex === tab.index;
                  return (
                    <button
                      key={tab.index}
                      ref={(el) => (tabRefs.current[tab.index] = el)}
                      onClick={() => setActiveIndex(tab.index)}
                      className={
                        "relative mr-3 cursor-pointer px-2 pb-2 text-[14px]" +
                        (isActive
                          ? " border-b-3 border-orange-500 text-orange-500"
                          : " text-gray-500 hover:text-gray-700")
                      }
                      style={{
                        marginRight: index !== tabs.length - 1 ? "0.5rem" : 0,
                      }}
                    >
                      {tab.label}
                      {tab.index === 4 && pendingCount > 0 && (
                        <span className="ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 py-[1px] text-[10px] font-bold text-white">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="outfit lightbox-bg fixed inset-0 z-100 flex items-end justify-center md:hidden"
          onClick={() => setShowDropdown(false)}
        >
          <div
            className="animate-fade-in-up w-full rounded-t-2xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3">
              <h2 className="text-[16px] font-semibold sm:text-[14px]">
                Select an option
              </h2>
            </div>
            <div className="bg-color h-[0.5px] w-full" />
            <div className="flex flex-col py-2 text-[16px] sm:text-[14px]">
              <button
                onClick={() => {
                  setWorksheetSubject({
                    subjectID,
                    subjectName,
                    subjectCode,
                    programName,
                    yearLevel,
                  });
                  setIsWorksheetModalOpen(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-100 sm:hidden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-download-icon lucide-download"
                >
                  <path d="M12 15V3" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                Worksheet
              </button>
              <button
                onClick={handleEdit}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-100"
              >
                <i className="bx bx-edit-alt text-xl"></i>
                Edit
              </button>
              <button
                onClick={() => {
                  setSubjectToDelete({
                    subjectID,
                    subjectName,
                    subjectCode,
                  });
                  setShowDropdown(false);
                  setShowDeleteModal(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-red-500 hover:bg-gray-100"
              >
                <i className="bx bx-trash text-xl"></i>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <PracticeExamConfig
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          subjectID={subjectID}
          onSuccess={handleFormSuccess}
          isExamQuestionsEnabled={isExamQuestionsEnabled}
          setIsExamQuestionsEnabled={setIsExamQuestionsEnabled}
          practiceExamSettings={practiceExamSettings}
          setPracticeExamSettings={setPracticeExamSettings}
        />
      )}

      {editingSubject && (
        <>
          <div
            className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center p-4"
            onClick={() => {
              setEditingSubject(false);
              setValidationError("");
            }}
          >
            <div
              ref={editModalRef}
              className="animate-fade-in-up relative mx-auto flex w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              style={{ minHeight: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-1 flex-col">
                {/* Header */}
                <div className="outfit-400 flex items-start justify-between border-b border-gray-200 px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                      <i className="bx bx-edit text-2xl" />
                    </div>
                    <div>
                      <h2 className="outfit-700 text-[16px] text-gray-900">
                        Edit Subject
                      </h2>
                      <p className="text-xs text-gray-500">
                        Update the details for this subject.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(false);
                      setValidationError("");
                    }}
                    className="ml-4 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <i className="bx bx-x text-xl"></i>
                  </button>
                </div>

                {/* Body */}
                <div className="outfit-400 flex-1 overflow-y-auto px-6 py-5">
                  {(validationError ||
                    editedSubject.subjectCode.length > 20) && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                      <i className="bx bx-error-circle text-base"></i>
                      {validationError || "Code must be 20 characters or less."}
                    </div>
                  )}

                  <form
                    id="subject-edit-form"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                          Subject Name
                        </label>
                        <div className="relative">
                          <i className="bx bx-book-open absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                          <input
                            type="text"
                            placeholder="e.g. Calculus 1"
                            value={editedSubject.subjectName}
                            onChange={(e) =>
                              setEditedSubject({
                                ...editedSubject,
                                subjectName: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          Enter the name of the subject.
                        </p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                          Subject Code
                        </label>
                        <div className="relative">
                          <i className="bx bx-edit absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>

                          <input
                            type="text"
                            placeholder="e.g. MATH123"
                            value={editedSubject.subjectCode}
                            onChange={(e) =>
                              setEditedSubject({
                                ...editedSubject,
                                subjectCode: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          Enter the subject code (max 20 characters).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                            Program
                          </label>
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
                              label: program.programName,
                            }))}
                          />
                          <p className="mt-1 text-[11px] text-gray-400">
                            Select the program for this subject.
                          </p>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                            Year Level
                          </label>
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
                              label: `${yearLevel}${Number(yearLevel) === 1 ? "st" : Number(yearLevel) === 2 ? "nd" : Number(yearLevel) === 3 ? "rd" : "th"} Year`,
                            }))}
                          />
                          <p className="mt-1 text-[11px] text-gray-400">
                            Select the year level for this subject.
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="outfit-400 flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(false);
                      setValidationError("");
                    }}
                    disabled={isEditing}
                    className="cursor-pointer text-[14px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isEditing}
                    onClick={async () => {
                      const isNameValid =
                        editedSubject.subjectName.trim() !== "";
                      const isCodeValid =
                        editedSubject.subjectCode.trim() !== "" &&
                        editedSubject.subjectCode.length <= 20;
                      const isProgramValid = editedSubject.programID !== "";
                      const isYearLevelValid = editedSubject.yearLevelID !== "";
                      if (
                        !isNameValid ||
                        !isCodeValid ||
                        !isProgramValid ||
                        !isYearLevelValid
                      ) {
                        setValidationError(
                          "Please fill in all required fields",
                        );
                        return;
                      }
                      setValidationError("");
                      await handleSaveEdit();
                    }}
                    className="outfit-500 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isEditing ? (
                      <>
                        <i className="bx bx-loader-alt animate-spin text-lg"></i>
                        Saving...
                      </>
                    ) : (
                      <>Save Changes</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && subjectToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await handleDeleteSubject(subjectToDelete.subjectID);
            setShowDeleteModal(false);
            setSubjectToDelete(null);
          }}
          message={
            <>
              Are you sure you want to remove{" "}
              <span className="font-bold text-red-500">
                {subjectToDelete.subjectName} ({subjectToDelete.subjectCode})
              </span>
              ? Removing this subject will also wipe out its contents.
            </>
          }
          isLoading={isDeleting}
          showCountdown={true}
          countdownSeconds={6}
          shiftHintText={undefined}
        />
      )}

      {isWorksheetModalOpen && (
        <PrintExamModal
          isOpen={isWorksheetModalOpen}
          onClose={() => setIsWorksheetModalOpen(false)}
          initialSubject={worksheetSubject}
        />
      )}
    </div>
  );
};

export default SubjectCard;
