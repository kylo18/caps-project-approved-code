import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import { Tooltip } from "flowbite-react";
import { createPortal } from "react-dom";
import SideBarToolTip from "./sidebarTooltip";

const AssignedSubjectsDropDown = ({
  item,
  isExpanded,
  setIsExpanded,
  setSelectedSubject,
  parsedRoleID,
  isSubjectFocused,
  setIsSubjectFocused,
  homePath,
}) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubject, setLocalSelectedSubject] = useState(null);
  const listRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] =
    useState(null);
  const [openMenuID, setOpenMenuID] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [subjectLoading, setSubjectLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [dropdownSubject, setDropdownSubject] = useState(null);

  const [dropdownDirection, setDropdownDirection] = useState("down"); // "down" or "up"
  const [searchUnassigned, setSearchUnassigned] = useState("");
  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  // Add new state variables for year level functionality
  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [showYearSubjects, setShowYearSubjects] = useState(false);
  const [yearLevelPosition, setYearLevelPosition] = useState({ x: 0, y: 0 });

  // Hardcoded year levels
  const yearLevelOptions = ["1", "2", "3", "4"];

  // Group subjects by year level
  const yearLevelGroups = assignedSubjects.reduce((acc, subject) => {
    const yearLevel = subject.yearLevelID || "Unassigned";
    if (!acc[yearLevel]) {
      acc[yearLevel] = [];
    }
    acc[yearLevel].push(subject);
    return acc;
  }, {});

  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
    });
  };

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

      if (!data.success) {
        console.error("Error fetching subjects:", data.message);
        return;
      }

      if (!Array.isArray(data.subjects)) {
        console.error("Unexpected subjects data format:", data);
        return;
      }

      // Sort subjects alphabetically by subjectCode
      const sortedSubjects = [...data.subjects].sort((a, b) =>
        a.subjectCode.localeCompare(b.subjectCode),
      );

      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
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
        const sortedSubjects = [...data.subjects].sort((a, b) =>
          a.subjectCode.localeCompare(b.subjectCode),
        );

        setAssignedSubjects(sortedSubjects);
        setFilteredSubjects(sortedSubjects);
      } else {
        console.error("Failed to fetch assigned subjects:", response.status);
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

  const searchResults = assignedSubjects?.filter((subject) =>
    `${subject.subjectName} ${subject.subjectCode}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen && listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isOpen]);

  const unassignedSubjects = subjects.filter((subject) => !subject.isAssigned);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setLocalSelectedSubject(subject);
  };

  const handleDeleteSubject = async (subjectID) => {
    const token = localStorage.getItem("token");

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${apiUrl}/remove-assigned-subject/${subjectID}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok) {
        if (selectedSubject?.subjectID === subjectID) {
          setSelectedSubject(null);
        }

        await fetchAssignedSubjects();

        setSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID),
        );
        setFilteredSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID),
        );
      } else {
        console.error("Failed to delete subject:", result.message);
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignSubject = async (subject) => {
    if (!subject) return;
    console.log("Assigning subject:", subject);

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

        // Refresh both assigned and available subjects
        await Promise.all([fetchAssignedSubjects(), fetchSubjects()]);

        setSelectedSubjectForAssignment(null);
        setShowAddModal(false);

        setToast({
          message: result.message || "Subject assigned successfully",
          type: "success",
          show: true,
        });
      } else {
        console.error("Failed to assign subject:", response.status);
        setToast({
          message: "Failed to assign subject",
          type: "error",
          show: true,
        });
      }
    } catch (error) {
      console.error("Error assigning subject:", error);
      setToast({
        message: "An error occurred while assigning subject",
        type: "error",
        show: true,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="mt-[2px]">
      <li
        className="relative flex items-center gap-3 rounded px-[4px] py-[1px] hover:bg-[rgb(255,230,214)] hover:text-gray-700"
        onClick={() => {
          if (!isExpanded || !isOpen) {
            setIsExpanded(true);
            setTimeout(() => {
              setIsOpen(true);
              setIsSubjectFocused(true);
            }, 50);
          } else {
            setIsOpen(!isOpen);
            setIsSubjectFocused(!isOpen);
            setShowYearSubjects(false);
          }
        }}
      >
        <SideBarToolTip label="Subjects" isExpanded={isExpanded}>
          <i className={`bx ${item.icon} mt-1 text-2xl`}></i>
        </SideBarToolTip>
        <span
          className={`text-sm font-semibold transition-all duration-150 ease-in-out ${
            isExpanded
              ? "pointer-events-auto visible ml-0 opacity-100"
              : "pointer-events-none invisible ml-0 opacity-0"
          }`}
        >
          Subjects
        </span>
        {isExpanded && (
          <div className="mr-1 ml-auto flex items-center justify-center">
            <i
              className={`bx ${isOpen ? "bxs-chevron-down" : "bxs-chevron-down"} text-[22px] transition-transform duration-300 ease-in-out ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            ></i>
          </div>
        )}
      </li>

      {/* Year Levels Dropdown */}
      <div
        className={`mt-2 flex flex-col overflow-hidden transition-all duration-0 ease-in-out ${
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto mt-2 flex w-full items-center gap-1">
          <div className="relative w-full">
            <i className="bx bx-search absolute top-1/2 left-2 -translate-y-1/2 text-[16px] text-gray-500"></i>
            <input
              type="text"
              placeholder="Search..."
              className="border-color w-full rounded-sm border py-1 pr-2 pl-7 text-[14px] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tooltip
            content={<span className="whitespace-nowrap">Assign Subject</span>}
            placement="left"
            className="z-[100]"
          >
            <div
              className="cursor-pointer justify-center rounded-sm bg-orange-500 px-[7px] py-[3px] text-center text-white transition-all hover:bg-orange-600"
              onClick={() => {
                setShowAddModal(true);
                setShowYearSubjects(false);
              }}
            >
              <i className="bx bx-plus text-[16px]"></i>
            </div>
          </Tooltip>
        </div>

        <div className="mt-4 h-[1px] w-full bg-[rgb(200,200,200)]"></div>

        <ul
          ref={listRef}
          className={`scrollbar-show-on-hover mx-auto mt-2 w-full flex-grow pr-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out ${!isExpanded ? "hidden" : ""}`}
        >
          {subjectLoading ? (
            <li className="mt-3 animate-pulse p-2 text-center text-[14px] text-[rgb(168,168,168)]">
              <div className="flex items-center justify-center">
                <span>Loading</span>
                <div className="ml-2 size-4 animate-spin rounded-full border-3 border-t-transparent"></div>
              </div>
            </li>
          ) : searchTerm.trim() ? (
            // Show filtered subjects when searching
            filteredSubjects.map((subject) => (
              <li
                key={subject.subjectID}
                className={`group relative mt-2 mr-1 flex cursor-pointer items-center justify-between rounded-md p-[7px] transition-all duration-100 ease-in-out ${
                  selectedSubject &&
                  selectedSubject.subjectID === subject.subjectID
                    ? "bg-orange-500 text-white"
                    : "hover:bg-[rgb(255,230,214)]"
                }`}
                onClick={() => {
                  setSelectedSubject(null);
                  handleSelectSubject(subject);
                  navigate(homePath);
                }}
              >
                <span className="ml-1 flex-1 cursor-pointer break-all">
                  {subject.yearLevel} {subject.programName} -{" "}
                  {subject.subjectCode}
                </span>

                {/* 3-dot menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`flex items-center justify-center rounded-full transition ${selectedSubject?.subjectID === subject.subjectID ? "visible" : "invisible group-hover:visible"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 80;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const direction = spaceBelow < menuHeight ? "up" : "down";
                      setDropdownDirection(direction);
                      setDropdownPosition({ x: rect.right, y: rect.bottom });
                      setDropdownSubject(subject);
                      setOpenMenuID(subject.subjectID);
                    }}
                  >
                    <i className="bx bx-dots-vertical-rounded cursor-pointer text-[18px]"></i>
                  </button>
                </div>
              </li>
            ))
          ) : (
            // Show year levels when not searching
            <>
              {yearLevelOptions.map((yearLevel) => (
                <li
                  key={yearLevel}
                  className="group relative mt-2 mr-1 flex cursor-pointer items-center justify-between rounded-sm px-[4px] py-[5px] transition-all duration-100 ease-in-out hover:bg-[rgb(255,230,214)]"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setYearLevelPosition({ x: rect.right + 10, y: rect.top });
                    setSelectedYearLevel(yearLevel);
                    setShowYearSubjects(true);
                    setOpenMenuID(null);
                  }}
                >
                  <span className="ml-2 flex-1 break-all">
                    {`${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year`}
                  </span>
                  <i className="bx bx-chevron-right text-[18px]"></i>
                </li>
              ))}
              {/* Refresh Button */}
              <li className="mt-4 border-t border-gray-200 pt-4">
                <button
                  onClick={() => {
                    setShowYearSubjects(false);
                    setOpenMenuID(null);
                    fetchAssignedSubjects();
                  }}
                  className="border-color flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="bx bx-refresh text-lg"></i>
                  <span className="text-[14px]">Refresh</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Floating Subjects Panel */}
      {showYearSubjects &&
        selectedYearLevel &&
        createPortal(
          <>
            <div
              className="lightbox-bg fixed inset-0 z-54"
              style={{ pointerEvents: "auto" }}
              onClick={() => {
                setShowYearSubjects(false);
                setOpenMenuID(null);
              }}
            />
            {/* Mobile Modal */}
            <div
              className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center p-5 sm:hidden"
              onClick={(e) => {
                e.stopPropagation();
                setShowYearSubjects(false);
                setOpenMenuID(null);
              }}
            >
              <div
                className="max-h-[90vh] w-full max-w-sm rounded-lg bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-gray-700">
                      {`${selectedYearLevel}${selectedYearLevel === "1" ? "st" : selectedYearLevel === "2" ? "nd" : selectedYearLevel === "3" ? "rd" : "th"} Year Subjects`}
                    </h3>
                    <button
                      onClick={() => {
                        setShowYearSubjects(false);
                        setOpenMenuID(null);
                      }}
                      className="cursor-pointer text-gray-500 hover:text-gray-700"
                    >
                      <i className="bx bx-x text-xl"></i>
                    </button>
                  </div>
                </div>
                {/* Content */}
                <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-4">
                  {yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                    yearLevelGroups[selectedYearLevel].map((subject) => (
                      <div
                        key={subject.subjectID}
                        className="group relative flex items-center justify-between rounded-sm px-2 py-2 hover:bg-[rgb(255,230,214)]"
                        onClick={() => {
                          setSelectedSubject(null);
                          handleSelectSubject(subject);
                          navigate(homePath);
                          setShowYearSubjects(false);
                          setOpenMenuID(null);
                        }}
                      >
                        <span className="flex-1 cursor-pointer text-sm break-all">
                          {subject.programName} - {subject.subjectCode}
                        </span>
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="hidden items-center justify-center rounded-full transition group-hover:flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const menuHeight = 80;
                              const spaceBelow =
                                window.innerHeight - rect.bottom;
                              const direction =
                                spaceBelow < menuHeight ? "up" : "down";
                              setDropdownDirection(direction);
                              setDropdownPosition({
                                x: rect.right,
                                y: rect.bottom,
                              });
                              setDropdownSubject(subject);
                              setOpenMenuID(subject.subjectID);
                            }}
                          >
                            <i className="bx bx-dots-vertical-rounded cursor-pointer text-[18px]"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No subjects in this year level
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Floating Panel */}
            <div
              className="border-color fixed z-55 hidden w-65 rounded-md border border-gray-200 bg-white shadow-lg sm:block"
              style={{
                top: "20px",
                left: yearLevelPosition.x + 28,
                height: "calc(100vh - 40px)",
              }}
            >
              {/* Arrow */}
              <div
                className="absolute -left-2 mt-1 h-4 w-4 rotate-45 border-l border-gray-200 bg-white"
                style={{
                  top: `${yearLevelPosition.y - 20}px`,
                }}
              />
              {/* Header */}
              <div className="border-b border-gray-200 p-2">
                <div className="flex items-center justify-between">
                  <h3 className="px-2 text-sm font-semibold text-gray-700">
                    {`${selectedYearLevel}${selectedYearLevel === "1" ? "st" : selectedYearLevel === "2" ? "nd" : selectedYearLevel === "3" ? "rd" : "th"} Year Subjects`}
                  </h3>
                  <button
                    onClick={() => setShowYearSubjects(false)}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                  >
                    <i className="bx bx-x text-xl"></i>
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="flex h-[calc(100vh-140px)] flex-col">
                <div className="flex-1 overflow-y-auto p-2">
                  {yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                    yearLevelGroups[selectedYearLevel].map((subject) => (
                      <div
                        key={subject.subjectID}
                        className="group relative flex items-center justify-between rounded-sm px-2 py-2 hover:bg-[rgb(255,230,214)]"
                        onClick={() => {
                          setSelectedSubject(null);
                          handleSelectSubject(subject);
                          navigate(homePath);
                          setShowYearSubjects(false);
                          setOpenMenuID(null);
                        }}
                      >
                        <span className="flex-1 cursor-pointer text-sm break-all">
                          {subject.programName} - {subject.subjectCode}
                        </span>
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="hidden items-center justify-center rounded-full transition group-hover:flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const menuHeight = 80;
                              const spaceBelow =
                                window.innerHeight - rect.bottom;
                              const direction =
                                spaceBelow < menuHeight ? "up" : "down";
                              setDropdownDirection(direction);
                              setDropdownPosition({
                                x: rect.right,
                                y: rect.bottom,
                              });
                              setDropdownSubject(subject);
                              setOpenMenuID(subject.subjectID);
                            }}
                          >
                            <i className="bx bx-dots-vertical-rounded cursor-pointer text-[18px]"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No subjects in this year level
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {showDeleteModal && subjectToDelete && (
        <div className="lightbox-bg fixed inset-0 z-56 flex flex-col items-center justify-center">
          <div className="font-inter border-color relative mx-auto w-full max-w-sm rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Remove Subject</span>
          </div>

          <div className="border-color relative mx-auto w-full max-w-sm rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            <p className="mt-2 mb-9 px-2 text-[14px] break-words text-gray-700">
              Are you sure you want to remove{" "}
              <strong>
                {subjectToDelete.subjectName} ({subjectToDelete.subjectCode})
              </strong>
              ?
            </p>

            <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            <div className="mb-2 flex justify-end gap-2 text-[14px]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                className="flex w-[80px] cursor-pointer items-center justify-center rounded-md bg-orange-500 px-[12px] py-[6px] text-[14px] text-white hover:bg-orange-700"
                onClick={async () => {
                  await handleDeleteSubject(subjectToDelete.subjectID);
                  setShowDeleteModal(false);
                  setSubjectToDelete(null);
                  setToast({
                    message: "Subject deleted successfully",
                    type: "success",
                    show: true,
                  });
                }}
              >
                {isDeleting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assign Subject Modal */}
      {showAddModal && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Assign a Subject</span>
          </div>

          <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
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
                className="border-color flex cursor-pointer items-center gap-1 rounded-md border px-3 py-[7px] text-sm hover:bg-gray-100"
                onClick={fetchSubjects}
              >
                <i className="bx bx-refresh text-[18px]"></i> Refresh
              </button>
            </div>

            <div className="mt-4 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {/* Subject List for Assigning */}
            <div className="mb-3">
              <ul className="max-h-[200px] overflow-y-auto" ref={listRef}>
                {loading ? (
                  <div className="flex items-center justify-center text-[rgb(168,168,168)]">
                    <span>Loading</span>
                    <div className="ml-2 size-4 animate-spin rounded-full border-3 border-t-transparent"></div>
                  </div>
                ) : unassignedSubjects.length > 0 ? (
                  [...unassignedSubjects]
                    .filter((subject) =>
                      `${subject.programName} ${subject.subjectName} ${subject.subjectCode} ${subject.yearLevel}`
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
                          {subject.programName} - {subject.subjectCode} (
                          {subject.yearLevel}) - {subject.subjectName}
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
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Assign"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Actions Menu */}
      {openMenuID && dropdownSubject && (
        <div
          className="absolute z-58 w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm"
          style={{
            top:
              dropdownDirection === "down"
                ? dropdownPosition.y - 50
                : dropdownPosition.y - 1,
            left: dropdownPosition.x - -47,
          }}
          onMouseLeave={() => setOpenMenuID(null)}
        >
          {/* Arrow */}
          <div className="absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rotate-45 border-l border-gray-300 bg-white" />
          <button
            className="w-full rounded-sm px-3 py-2 text-left text-sm text-black hover:bg-gray-200"
            onClick={() => {
              setSubjectToDelete(dropdownSubject);
              setShowDeleteModal(true);
              setOpenMenuID(null);
              setShowYearSubjects(false);
            }}
          >
            <i className="bx bxs-trash-alt mr-2 text-[16px]"></i>Remove
          </button>
        </div>
      )}

      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-100 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
            toast.show ? "opacity-100" : "opacity-0"
          } ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-error text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-nowrap text-gray-600">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedSubjectsDropDown;
