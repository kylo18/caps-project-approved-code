import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import Tooltip from "./toolTip";
import { createPortal } from "react-dom";
import SideBarToolTip from "./sidebarTooltip";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

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
  const { toast, showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [subjectLoading, setSubjectLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [dropdownSubject, setDropdownSubject] = useState(null);

  const [dropdownDirection, setDropdownDirection] = useState("down"); // "down" or "up"
  const [searchUnassigned, setSearchUnassigned] = useState("");

  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [showYearSubjects, setShowYearSubjects] = useState(false);
  const [yearLevelPosition, setYearLevelPosition] = useState({ x: 0, y: 0 });

  const yearLevelOptions = ["1", "2", "3", "4"];

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

  const unassignedSubjects = subjects.filter(
    (subject) =>
      !assignedSubjects.some(
        (assigned) => assigned.subjectID === subject.subjectID,
      ),
  );

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
    if (!isExpanded) {
      setShowYearSubjects(false);
    }
  }, [isExpanded]);

  return (
    <div className="-mt-2">
      <li
        className="relative flex cursor-pointer items-center gap-3 rounded px-[4px] py-[1px] hover:text-gray-700"
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
            className="z-70"
          >
            <div
              className="cursor-pointer justify-center rounded-sm bg-orange-500 px-[7px] py-[3px] text-center text-white transition-all hover:bg-orange-600"
              onClick={() => {
                setSearchTerm("");
                setShowAddModal(true);
                setShowYearSubjects(false);
              }}
            >
              <i className="bx bx-plus text-[16px]"></i>
            </div>
          </Tooltip>
        </div>

        {/* Year Level List or Search Results */}
        <ul
          ref={listRef}
          className={`scrollbar-show-on-hover mx-auto mt-2 w-full flex-grow pr-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out ${!isExpanded ? "hidden" : ""}`}
        >
          {subjectLoading ? (
            <div className="flex h-[300px] items-start justify-center">
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="loader"></div>
              </div>
            </div>
          ) : searchTerm.trim() ? (
            // Show filtered subjects when searching
            filteredSubjects.map((subject) => (
              <li
                key={subject.subjectID}
                className={`group relative mt-2 mr-1 flex items-center justify-between rounded-sm px-[4px] py-[5px] transition-all duration-100 ease-in-out ${
                  selectedSubject?.subjectID === subject.subjectID
                    ? "bg-orange-500 text-white"
                    : "hover:bg-[rgb(255,230,214)]"
                }`}
                onClick={() => {
                  setSelectedSubject(null);
                  handleSelectSubject(subject);
                  navigate(homePath);
                }}
              >
                <span className="ml-2 flex-1 cursor-pointer break-all">
                  {subject.programName} - {subject.subjectCode}
                </span>
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
                  <i className="bx bx-refresh-ccw text-lg"></i>
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
            {/* Desktop Lightbox */}
            <div
              className="lightbox-bg fixed inset-0 z-54 hidden sm:block"
              style={{ pointerEvents: "auto" }}
              onClick={() => {
                setShowYearSubjects(false);
                setOpenMenuID(null);
              }}
            />
            {/* Mobile Modal */}
            <div
              className="lightbox-bg fixed inset-0 z-55 flex items-end justify-center min-[448px]:items-center sm:hidden"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowYearSubjects(false);
                  setOpenMenuID(null);
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.currentTarget) {
                  setShowYearSubjects(false);
                  setOpenMenuID(null);
                }
              }}
            >
              <div
                className="max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-lg min-[448px]:rounded-md"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="border-b border-gray-200 p-4"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-gray-700">
                      {`${selectedYearLevel}${selectedYearLevel === "1" ? "st" : selectedYearLevel === "2" ? "nd" : selectedYearLevel === "3" ? "rd" : "th"} Year Subjects`}
                    </h3>
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setShowYearSubjects(false);
                        setOpenMenuID(null);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
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
                <div
                  className="max-h-[calc(90vh-80px)] overflow-y-auto p-4"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {(() => {
                    // Group assignedSubjects by yearLevel
                    const yearLevelGroups = assignedSubjects.reduce(
                      (acc, subject) => {
                        const yearLevel = subject.yearLevelID || "Unassigned";
                        if (!acc[yearLevel]) acc[yearLevel] = [];
                        acc[yearLevel].push(subject);
                        return acc;
                      },
                      {},
                    );
                    return yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                      Object.entries(
                        yearLevelGroups[selectedYearLevel].reduce(
                          (acc, subject) => {
                            const programName =
                              subject.programName || "Unassigned";
                            if (!acc[programName]) acc[programName] = [];
                            acc[programName].push(subject);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([programName, subjects], index, array) => (
                        <div
                          key={programName}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2 px-2 py-1">
                            <div className="h-[0.5px] flex-1 bg-[rgb(200,200,200)]"></div>
                            <span className="open-sans min-w-[60px] text-center text-sm font-bold text-gray-700">
                              {programName}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(200,200,200)]"></div>
                          </div>
                          {subjects.map((subject) => (
                            <div
                              key={subject.subjectID}
                              className={`group relative flex items-center justify-between rounded-sm px-2 py-2 ${
                                selectedSubject?.subjectID === subject.subjectID
                                  ? "bg-orange-500 text-white"
                                  : "hover:bg-[rgb(255,230,214)]"
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedSubject(null);
                                handleSelectSubject(subject);
                                navigate(homePath);
                                setShowYearSubjects(false);
                                setOpenMenuID(null);
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedSubject(null);
                                handleSelectSubject(subject);
                                navigate(homePath);
                                setShowYearSubjects(false);
                                setOpenMenuID(null);
                              }}
                            >
                              <span className="flex-1 cursor-pointer text-sm break-all">
                                {subject.subjectCode}
                              </span>
                              <div
                                className="relative"
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                              >
                                <button
                                  className={`items-center justify-center rounded-full transition ${
                                    selectedSubject?.subjectID ===
                                    subject.subjectID
                                      ? "flex"
                                      : "hidden group-hover:flex"
                                  }`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
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
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No subjects in this year level
                      </div>
                    );
                  })()}
                </div>
              </div>

              {openMenuID && dropdownSubject && (
                <div
                  className="absolute z-100 w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm sm:hidden"
                  style={{
                    top:
                      dropdownDirection === "down"
                        ? dropdownPosition.y - -20
                        : dropdownPosition.y - 1,
                    left: dropdownPosition.x - 150,
                  }}
                  onMouseLeave={() => setOpenMenuID(null)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <button
                    className="w-full rounded-sm px-3 py-2 text-left text-sm text-black hover:bg-gray-200"
                    onClick={() => {
                      setSubjectToDelete(dropdownSubject);
                      setShowDeleteModal(true);
                      setTimeout(() => {
                        setOpenMenuID(null);
                        setShowYearSubjects(false);
                      }, 50);
                    }}
                  >
                    <i className="bx bxs-trash-alt mr-2 text-[16px]"></i>Remove
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Floating Panel */}
            <div
              className="border-color fixed z-60 hidden w-65 rounded-md border border-gray-200 bg-white shadow-lg sm:block"
              style={{
                top: dropdownPosition.y,
                left: dropdownPosition.x,
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
                  {(() => {
                    // Group assignedSubjects by yearLevel
                    const yearLevelGroups = assignedSubjects.reduce(
                      (acc, subject) => {
                        const yearLevel = subject.yearLevelID || "Unassigned";
                        if (!acc[yearLevel]) acc[yearLevel] = [];
                        acc[yearLevel].push(subject);
                        return acc;
                      },
                      {},
                    );
                    return yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                      Object.entries(
                        yearLevelGroups[selectedYearLevel].reduce(
                          (acc, subject) => {
                            const programName =
                              subject.programName || "Unassigned";
                            if (!acc[programName]) acc[programName] = [];
                            acc[programName].push(subject);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([programName, subjects], index, array) => (
                        <div key={programName}>
                          <div className="flex items-center justify-center gap-2 px-2 py-1">
                            <div className="h-[0.5px] flex-1 bg-[rgb(200,200,200)]"></div>
                            <span className="open-sans min-w-[60px] text-center text-sm font-bold text-gray-700">
                              {programName}
                            </span>
                            <div className="h-[0.5px] flex-1 bg-[rgb(200,200,200)]"></div>
                          </div>
                          {subjects.map((subject) => (
                            <div
                              key={subject.subjectID}
                              className={`group relative flex items-center justify-between rounded-sm px-2 py-2 ${
                                selectedSubject?.subjectID === subject.subjectID
                                  ? "bg-orange-500 text-white"
                                  : "hover:bg-[rgb(255,230,214)]"
                              }`}
                              onClick={() => {
                                setSelectedSubject(null);
                                handleSelectSubject(subject);
                                navigate(homePath);
                                setShowYearSubjects(false);
                                setOpenMenuID(null);
                              }}
                            >
                              <span className="flex-1 cursor-pointer text-sm break-all">
                                {subject.subjectCode}
                              </span>
                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className={`items-center justify-center rounded-full transition ${
                                    selectedSubject?.subjectID ===
                                    subject.subjectID
                                      ? "flex"
                                      : "hidden group-hover:flex"
                                  }`}
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
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No subjects in this year level
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Subject Actions Menu */}
      {openMenuID && dropdownSubject && (
        <div
          className="absolute z-58 hidden w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm sm:block"
          style={{
            top:
              dropdownDirection === "down"
                ? dropdownPosition.y - 50
                : dropdownPosition.y - 1,
            left: dropdownPosition.x - -35,
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
              setTimeout(() => {
                setOpenMenuID(null);
                setShowYearSubjects(false);
              }, 50);
            }}
          >
            <i className="bx bxs-trash-alt mr-2 text-[16px]"></i>Remove
          </button>
        </div>
      )}

      {showDeleteModal && subjectToDelete && (
        <div className="bg-opacity-50 lightbox-bg fixed inset-0 z-57 flex items-center justify-center">
          <div className="w-full max-w-md rounded-md bg-white shadow-lg">
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
                  await handleDeleteSubject(subjectToDelete.subjectID);
                  setShowDeleteModal(false);
                  setSubjectToDelete(null);
                  showToast("Subject deleted successfully", "success");
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

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default AssignedSubjectsDropDown;
