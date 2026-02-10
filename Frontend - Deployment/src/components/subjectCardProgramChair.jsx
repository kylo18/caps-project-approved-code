import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import PracticeExamConfigProgChair from "./SubjectSettingsDeanProgChair";
import { useNavigate } from "react-router-dom";
import RegisterDropDownSmall from "./registerDropDownSmall";
import SearchQuery from "./SearchQuery";

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
  setSelectedSubject,
  showToast,
  searchQuery,
  setSearchQuery,
  practiceExamSettings,
  setPracticeExamSettings,
}) => {
  // Move all useState declarations to the top
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchAnim, setSearchAnim] = useState("");
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showActionDropdownDesk, setShowActionDropdownDesk] = useState(false);
  const [showActionDropdownTablet, setShowActionDropdownTablet] =
    useState(false);
  const [editingSubject, setEditingSubject] = useState(false);
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
  const [mobileIndicatorStyle, setMobileIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });
  const [tabletIndicatorStyle, setTabletIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const [, setTabIndicatorUpdate] = useState(0);

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

  // Handle open/close with animation
  const handleToggleSearch = () => {
    if (showSearchInput) {
      setSearchAnim("animate-search-popout");
      searchTimeoutRef.current = setTimeout(() => {
        setShowSearchInput(false);
        setSearchAnim("");
      }, 100); // match animation duration in index.css
    } else {
      setShowSearchInput(true);
      setSearchAnim("animate-search-popup");
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  // Scroll search input into view on small screens when it appears
  useEffect(() => {
    if (showSearchInput && searchInputRef.current && window.innerWidth < 768) {
      setTimeout(() => {
        const rect = searchInputRef.current.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100; // 100px from top
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }, 10); // allow render
    }
  }, [showSearchInput]);

  const mobileTabRefs = useRef([]);

  // Mobile indicator
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
    updateMobileIndicatorPosition();
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

  // Tablet indicator
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
    { label: "Practice", index: 0 },
    { label: "Qualifying Exam", index: 1 },
    { label: "Pending", index: 4 },
  ];

  // State for tab indicator animation
  // State for practice exam configuration modal
  // State for mobile dropdown menu
  // Refs for tab elements and dropdown positioning
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const actionDropdownRef = useRef(null);
  const actionButtonRef = useRef(null);

  const navigate = useNavigate();

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
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/programs`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
      programID: programID || "",
      yearLevelID: yearLevelID || "",
    });
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    const token = localStorage.getItem("token");
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
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

  // Function to refresh questions list
  const handleRefresh = () => {
    setShowSearchInput(false);
    setSearchAnim("");
    onFetchQuestions();
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

  // Function to fetch and preview practice exam questions
  const handlePreviewClick = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/practice-exam/preview/${subjectID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch preview questions");
      }

      const examData = await response.json();

      // Navigate to practice exam with preview flag
      navigate("/practice-exam", {
        state: {
          subjectID,
          examData: {
            ...examData,
            subjectName,
            isPreview: true,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching preview questions:", error);
      showToast("Failed to load preview questions. Please try again.", "error");
    }
  };

  // Delete subject handler
  const handleDeleteSubject = async (subjectID) => {
    const token = localStorage.getItem("token");
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subjects/${subjectID}/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        if (setSelectedSubject) setSelectedSubject(null);
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

  useEffect(() => {
    setTabIndicatorUpdate((n) => n + 1);
  }, [activeIndex, subjectName]); // subjectName in case the tab bar changes width

  const SkeletonLoader = () => (
    <>
      {/* Desktop skeleton */}
      <div className="relative z-51 -mt-3 hidden h-45 overflow-hidden rounded-sm border border-gray-300 bg-white px-4 pt-4 sm:block lg:h-40">
        <div className="flex animate-pulse items-center space-x-4">
          <div className="skeleton shimmer h-18 w-18 rounded-md"></div>
          <div className="flex-1">
            <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
            <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
          </div>
        </div>
        <div className="open-sans mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold md:hidden">
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 hidden h-9 w-28 items-center justify-center rounded-md min-[500px]:flex"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
        </div>

        <div className="absolute right-5 bottom-5 z-51 mt-4 hidden gap-3 md:flex">
          <div className="skeleton shimmer h-10 w-10 rounded-xl bg-gray-300"></div>
          <div className="skeleton shimmer h-10 w-10 rounded-xl bg-gray-300"></div>
          <div className="skeleton shimmer h-10 w-28 rounded-xl bg-gray-300"></div>
          <div className="skeleton shimmer h-10 w-28 rounded-xl bg-gray-300"></div>
        </div>
      </div>
      <div className="relative z-51 -mx-2 -mt-2 hidden h-12 overflow-visible border-r border-b border-l border-gray-300 bg-gray-100 px-4 pt-6 sm:mx-0 sm:block sm:rounded-b-md sm:pt-4 lg:hidden"></div>

      {/* Mobile skeleton */}
      <div className="relative z-48 -mx-2 overflow-visible border border-gray-300 bg-white px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between">
          <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
            <div className="skeleton shimmer mt-2 mb-2 ml-2 h-8 w-58 rounded"></div>
            <div className="mt-2 ml-2 flex gap-1">
              <div className="skeleton shimmer h-5 w-38 rounded"></div>
            </div>
          </div>
          <div className="skeleton shimmer mt-1 size-20 rounded-md"></div>
        </div>
        <div className="open-sans mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold">
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 hidden h-9 w-28 items-center justify-center rounded-md min-[500px]:flex"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
        </div>
      </div>
      <div className="relative z-48 -mx-2 -mt-2 h-12 overflow-visible border-b border-gray-300 bg-gray-100 px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden"></div>
    </>
  );

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Mobile & Tablet */}
          <div className="relative z-48 -mx-2 overflow-visible border border-gray-300 bg-white px-4 pt-6 sm:mx-0 sm:block sm:rounded-t-md sm:pt-4 md:hidden">
            <div className="flex flex-wrap items-start justify-between sm:hidden">
              <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
                <h1 className="font-inter mt-2 ml-2 text-[18px] font-bold break-words">
                  {subjectName}
                </h1>
                <div className="mt-2 ml-2 flex gap-1 text-gray-500">
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
                className="mt-1 size-20 rounded-md border border-gray-300 object-cover"
              />
            </div>

            <div className="hidden flex-wrap items-center sm:flex">
              <img
                src={SubPhoto}
                alt="Subject"
                className="mr-5 size-18 rounded-md border border-gray-300 object-cover"
              />
              <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
                <h1 className="font-inter text-[15px] font-bold break-words md:text-[18px]">
                  {subjectName}
                </h1>
                <div className="mt-1 flex gap-1 text-gray-500">
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

            {/* Button row for Tablet and Mobile (Configure, Preview, Refresh) */}
            <div className="open-sans mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold sm:flex md:hidden">
              <button
                onClick={() => alert("Feature under development")}
                className="mb-6 flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-eye text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>
              <button
                onClick={handleAssignClick}
                className="mb-6 flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-cog text-lg"></i>
                <span>Configure</span>
              </button>

              <button
                onClick={handleRefresh}
                className="mb-6 flex cursor-pointer items-center justify-center rounded-md border border-gray-300 px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100 min-[500px]:hidden md:hidden"
              >
                <i className="bx bx-refresh-ccw text-2xl"></i>
              </button>

              <button
                onClick={handleRefresh}
                className="mb-6 hidden cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
              >
                <i className="bx bx-refresh-ccw text-lg"></i>
                <span className="text-[14px]">Refresh</span>
              </button>
              {/* Mobile/tablet search button */}
              <button
                ref={actionButtonRef}
                onClick={handleToggleSearch}
                className="mb-6 flex cursor-pointer items-center justify-center rounded-md border border-gray-300 px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100 md:hidden"
              >
                <i
                  className={`bx ${showSearchInput ? "bx-x" : "bx-search-big"} text-2xl`}
                ></i>
              </button>
            </div>
          </div>

          {/* Tablet Tabs Bar (below card) */}
          <div className="open-sans relative z-48 -mx-2 -mt-2 mb-1 h-[50px] overflow-visible border border-gray-300 bg-gray-50 pt-2 font-semibold sm:mx-0 sm:block sm:rounded-b-md md:hidden">
            <ul className="mt-[6px] flex h-full w-full justify-between text-center">
              {tabs.map((tab) => (
                <li
                  key={tab.index}
                  ref={(el) => (tabletTabRefs.current[tab.index] = el)}
                  className={`relative flex-1 cursor-pointer text-[13px] font-semibold transition-colors duration-200 ${
                    activeIndex === tab.index
                      ? "text-orange-500"
                      : "text-gray-600"
                  }`}
                  onClick={() => setActiveIndex(tab.index)}
                >
                  {tab.label}
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

          {/* Desktop */}
          <div className="relative z-48 -mt-3 mb-2 hidden overflow-visible rounded-sm border border-gray-300 bg-white px-4 pt-4 sm:z-51 md:block">
            <div className="flex">
              <button
                onClick={handleRefresh}
                className="border-color absolute top-2 right-2 flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-sm text-gray-700 transition hover:bg-gray-100 sm:absolute"
              >
                <i className="bx bx-refresh-ccw text-base text-gray-500"></i>
                <span className="hidden text-[14px] sm:inline">Refresh</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center">
              <img
                src={SubPhoto}
                alt="Subject"
                className="mr-5 size-18 rounded-md border border-gray-300 object-cover"
              />
              <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
                <h1 className="font-inter text-[15px] font-bold break-words md:text-[18px]">
                  {subjectName}
                </h1>
                <div className="mt-1 flex gap-1 text-gray-500">
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

            <div className="mt-[14px] flex w-full items-center justify-between">
              <div className="relative mt-[2px] ml-5 flex w-full justify-start lg:ml-10">
                <ul className="relative flex flex-wrap justify-center gap-7 text-sm font-semibold text-gray-600">
                  {["Practice", "Qualifying Exam"].map((item, index) => (
                    <li
                      key={index}
                      ref={(el) => (tabRefs.current[index] = el)}
                      className={`cursor-pointer ${
                        activeIndex === index
                          ? "text-orange-500"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <span className="block min-[1150px]:hidden">{item}</span>
                      <span className="hidden min-[1150px]:block">
                        {item} Questions
                      </span>
                    </li>
                  ))}
                  <li
                    ref={(el) => (tabRefs.current[4] = el)}
                    className={`cursor-pointer ${
                      activeIndex === 4
                        ? "text-orange-500"
                        : "hover:text-gray-900"
                    }`}
                    onClick={() => setActiveIndex(4)}
                  >
                    Pending
                  </li>
                </ul>

                <div
                  className={`absolute bottom-[-13px] h-1 bg-orange-500 md:bottom-[-16px] md:ml-0 ${
                    isResizing ? "" : "transition-all duration-300"
                  }`}
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                  }}
                ></div>
              </div>

              <div className="fixed right-5 bottom-5 z-51 mt-4 flex gap-3 md:relative md:right-0 md:mt-3">
                {/* Configure Button */}
                {/* Desktop search button */}
                <button
                  ref={actionButtonRef}
                  onClick={handleToggleSearch}
                  className="hidden cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-2 py-2 text-gray-700 transition-all duration-100 hover:bg-gray-100 md:flex"
                >
                  <i
                    className={`bx ${showSearchInput ? "bx-x" : "bx-search-big"} text-2xl`}
                  ></i>
                </button>
                <button
                  onClick={handleAssignClick}
                  className="hidden cursor-pointer items-center gap-2 rounded-lg border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2 md:flex"
                >
                  <i className="bx bx-cog text-lg"></i>
                  <span className="text-[14px]">Configure</span>
                </button>

                {/* Preview Button */}
                <button
                  onClick={() => alert("Feature under development")}
                  className="hidden cursor-pointer items-center gap-2 rounded-lg border border-b-4 border-orange-600 bg-orange-500 px-4 py-2 text-white transition-all duration-100 hover:bg-orange-600 active:translate-y-[2px] active:border-b-2 md:flex"
                >
                  <i className="bx bx-eye-big text-xl"></i>
                  <span className="text-[14px]">Preview</span>
                </button>
              </div>
            </div>
          </div>

          {showSearchInput && (
            <div
              className="flex w-full justify-center px-1 py-2"
              ref={searchInputRef}
            >
              <div
                className={`w-full transform transition-all duration-300 lg:w-[80%] ${searchAnim}`}
              >
                <SearchQuery
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  placeholder="Search questions"
                />
              </div>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <PracticeExamConfigProgChair
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          subjectID={subjectID}
          onSuccess={handleFormSuccess}
          practiceExamSettings={practiceExamSettings}
          setPracticeExamSettings={setPracticeExamSettings}
        />
      )}

      {editingSubject && (
        <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
          <div className="relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
            <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
              <h2 className="text-[14px] font-medium text-gray-700">
                Edit Subject
              </h2>
              <button
                onClick={() => {
                  setEditingSubject(false);
                  setValidationError("");
                }}
                className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                title="Close"
              >
                <i className="bx bx-x text-[20px]"></i>
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
                      placeholder="Name"
                      value={editedSubject.subjectName}
                      onChange={(e) =>
                        setEditedSubject((prev) => ({
                          ...prev,
                          subjectName: e.target.value,
                        }))
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
                      placeholder="Code"
                      value={editedSubject.subjectCode}
                      onChange={(e) =>
                        setEditedSubject((prev) => ({
                          ...prev,
                          subjectCode: e.target.value,
                        }))
                      }
                      className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                    />
                  </div>
                  <div className="mt-1 text-start text-[11px] text-gray-400">
                    Enter the subject code of the subject you want to edit (e.g
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
                    value={editedSubject.programID}
                    onChange={(e) =>
                      setEditedSubject((prev) => ({
                        ...prev,
                        programID: e.target.value,
                      }))
                    }
                    placeholder="Select Program"
                    options={programs.map((program) => ({
                      value: program.programID,
                      label: program.programName,
                    }))}
                  />
                  <div className="text-start text-[11px] text-gray-400">
                    Enter the program of the subject you want to edit
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
                    value={editedSubject.yearLevelID}
                    onChange={(e) =>
                      setEditedSubject((prev) => ({
                        ...prev,
                        yearLevelID: e.target.value,
                      }))
                    }
                    placeholder={`${editedSubject.yearLevelID}${Number(editedSubject.yearLevelID) === 1 ? "st" : Number(editedSubject.yearLevelID) === 2 ? "nd" : Number(editedSubject.yearLevelID) === 3 ? "rd" : "th"} Year`}
                    options={yearLevelOptions.map((yearLevel) => ({
                      value: yearLevel,
                      label: `${yearLevel}${Number(yearLevel) === 1 ? "st" : Number(yearLevel) === 2 ? "nd" : Number(yearLevel) === 3 ? "rd" : "th"} Year`,
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
              {editedSubject.subjectCode.length > 20 && (
                <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                  Code must be 20 characters or less.
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isEditing}
                  onClick={async () => {
                    const isNameValid = editedSubject.subjectName.trim() !== "";
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
                      setValidationError("Please fill in all required fields");
                      return;
                    }
                    setValidationError("");
                    await handleSaveEdit();
                  }}
                  className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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
      )}

      {showDeleteModal && subjectToDelete && (
        <div className="bg-opacity-50 lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
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
                  ?
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
                  await handleDeleteSubject(subjectToDelete.subjectID);
                  setShowDeleteModal(false);
                  setSubjectToDelete(null);
                }}
                disabled={isDeleting}
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
    </div>
  );
};

export default SubjectCard;
