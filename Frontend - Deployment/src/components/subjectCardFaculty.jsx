import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import { Textfit } from "react-textfit";

import ConfirmModal from "./confirmModal";

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
}) => {
  // Move all useState declarations to the top
  const [mobileIndicatorStyle, setMobileIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });
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

  const mobileTabRefs = useRef([]);

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

  // Refs for tab elements and dropdown positioning
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const actionDropdownRef = useRef(null);
  const actionButtonRef = useRef(null);

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
      const token = sessionStorage.getItem("token");
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

  // Function to refresh questions list
  const handleRefresh = () => {
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

  // Navigate to practice exam preview page
  const handlePreviewClick = () => {
    navigate(`/practice-exam/preview/${subjectID}`);
  };

  // Delete subject handler
  const handleDeleteSubject = async (subjectID) => {
    const token = sessionStorage.getItem("token");
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/remove-assigned-subject/${subjectID}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      if (response.ok) {
        if (setSelectedSubject) setSelectedSubject(null);
        // Add a small delay to ensure the delete operation is complete
        setTimeout(() => {
          window.location.reload();
        }, 100);
        showToast(result.message || "Subject removed successfully", "success");
      } else {
        showToast(result.message || "Failed to remove subject", "error");
        console.error("Failed to delete subject:", result.message);
      }
    } catch (error) {
      showToast("Error deleting subject", "error");
      console.error("Error deleting subject:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setTabIndicatorUpdate((n) => n + 1);
  }, [activeIndex, subjectName]); // subjectName in case the tab bar changes width

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  const SkeletonLoader = () => (
    <>
      {/* Desktop skeleton */}
      <div className="border-color relative z-51 mx-auto mb-6 hidden h-45 max-w-6xl overflow-hidden rounded-xl border bg-white px-4 pt-4 sm:block lg:h-40">
        <div className="flex animate-pulse items-center space-x-4">
          <div className="skeleton shimmer h-18 w-18 rounded-md"></div>
          <div className="flex-1">
            <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
            <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
          </div>
        </div>
        <div className="outfit mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold md:hidden">
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 hidden h-9 w-28 items-center justify-center rounded-md min-[500px]:flex"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
        </div>

        <div className="absolute right-5 bottom-5 z-51 mt-4 hidden gap-3 md:flex">
          <div className="skeleton shimmer bg-color h-10 w-28 rounded-xl"></div>
          <div className="skeleton shimmer bg-color h-10 w-28 rounded-xl"></div>
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="border-color relative z-48 -mx-2 mt-2 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between">
          <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
            <div className="skeleton shimmer mt-2 mb-2 ml-2 h-8 w-58 rounded"></div>
            <div className="mt-2 ml-2 flex gap-1">
              <div className="skeleton shimmer h-5 w-38 rounded"></div>
            </div>
          </div>
          <div className="skeleton shimmer mt-1 size-20 rounded-md"></div>
        </div>
        <div className="outfit mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold">
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 hidden h-9 w-28 items-center justify-center rounded-md min-[500px]:flex"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
        </div>
      </div>
      <div className="border-color relative z-48 -mx-2 -mt-2 mb-5 h-12 overflow-visible border-b bg-gray-100 px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden"></div>
    </>
  );

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Top search bar (desktop & mobile) */}
          <div className="outfit-500 relative mx-auto -mt-1 mb-5 w-full max-w-[1250px] px-2 text-[14px]">
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
                className="absolute top-4.5 right-5 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <i className="bx bx-x text-xl" />
              </button>
            )}
          </div>

          {/* Mobile & Tablet */}
          <div className="border-color relative z-48 mt-2 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:block sm:rounded-t-md sm:pt-4 md:hidden">
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

            {/* Button row for Tablet and Mobile (Configure, Preview, Refresh) */}
            <div className="outfit-500 mt-7 flex w-full flex-row items-center justify-start gap-2 font-semibold sm:flex md:hidden">
              <button
                onClick={() => alert("Feature under development")}
                className="border-color outfit-500 mb-6 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-eye text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>

              <button
                onClick={() => {
                  setSubjectToDelete({ subjectID, subjectName, subjectCode });
                  setShowDeleteModal(true);
                }}
                className="border-color mb-6 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-trash text-lg"></i>
                <span className="text-[14px]">Remove</span>
              </button>

              <button
                onClick={handleRefresh}
                className="border-color mb-6 flex cursor-pointer items-center justify-center rounded-xl border px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100 min-[500px]:hidden md:hidden"
              >
                <i className="bx bx-refresh-ccw text-2xl"></i>
              </button>

              <button
                onClick={handleRefresh}
                className="border-color mb-6 hidden cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
              >
                <i className="bx bx-refresh-ccw text-lg"></i>
                <span className="text-[14px]">Refresh</span>
              </button>
              {/* Mobile/tablet search button */}
            </div>
          </div>

          {/* Tablet Tabs Bar (below card) */}
          <div className="outfit-400 border-color relative z-48 -mt-2 mb-1 h-[50px] overflow-visible border bg-gray-50 pt-2 sm:mx-0 sm:block sm:rounded-b-md md:hidden">
            <ul className="mt-[6px] flex h-full w-full justify-between text-center">
              {tabs.map((tab) => (
                <li
                  key={tab.index}
                  ref={(el) => (tabletTabRefs.current[tab.index] = el)}
                  className={`relative flex-1 cursor-pointer text-[13px] transition-colors duration-200 ${
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
            <div className="outfit-500 mb-0 flex w-full flex-row items-center justify-end gap-2 pb-1 font-semibold">
              <div className="flex flex-row gap-2">
                {/* Remove */}
                <button
                  onClick={() => {
                    setSubjectToDelete({ subjectID, subjectName, subjectCode });
                    setShowDeleteModal(true);
                  }}
                  className="border-color flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-red-500 transition hover:bg-gray-100"
                >
                  <i className="bx bx-trash text-[16px]"></i>
                  <span className="text-[14px]">Remove</span>
                </button>

                {/* Preview */}
                <button
                  onClick={() => alert("Feature is coming in the next update")}
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
                    </button>
                  );
                })}
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
              ? Assigning this subject again will restore your data.
            </>
          }
          isLoading={isDeleting}
          showCountdown={true}
          countdownSeconds={6}
          shiftHintText={undefined}
        />
      )}
    </div>
  );
};

export default SubjectCard;
