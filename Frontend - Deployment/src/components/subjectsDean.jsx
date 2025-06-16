import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import SideBarToolTip from "./sidebarTooltip";
import { Tooltip } from "flowbite-react";
import RegisterDropDownSmall from "./registerDropDownSmall";
import { createPortal } from "react-dom";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const SideBarDropDown = ({
  item,
  isExpanded,
  setIsExpanded,
  setSelectedSubject,
  setIsSubjectFocused,
  homePath,
}) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [selectedSubject, setLocalSelectedSubject] = useState(null);
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

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [dropdownSubject, setDropdownSubject] = useState(null);

  const [dropdownDirection, setDropdownDirection] = useState("down"); // "down" or "up"

  const [selectedProgramID, setSelectedProgramID] = useState("");

  const [validationError, setValidationError] = useState("");

  const [programs, setPrograms] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);
  const [selectedYearLevelID, setSelectedYearLevelID] = useState("");

  const [selectedYearLevel, setSelectedYearLevel] = useState(null);
  const [showYearSubjects, setShowYearSubjects] = useState(false);
  const [yearLevelPosition, setYearLevelPosition] = useState({ x: 0, y: 0 });

  // Use the toast hook
  const { toast, showToast } = useToast();

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      programID: subject.programID || "",
      yearLevelID: subject.yearLevelID || "",
    });
  };

  const handleSaveEdit = async (subjectID) => {
    const token = localStorage.getItem("token");

    setIsEditing(true);

    try {
      // Ensure yearLevelID is a string
      const updateData = {
        subjectCode: editedSubject.subjectCode,
        subjectName: editedSubject.subjectName,
        programID: editedSubject.programID,
        yearLevelID: String(editedSubject.yearLevelID),
      };

      const response = await fetch(`${apiUrl}/subjects/${subjectID}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const result = await response.json();

      if (response.ok) {
        // Update the subjects list with the new data including relationships
        const updatedSubject = {
          ...result.data.subject,
          programName: result.data.relationships.program?.programName || "",
          yearLevelName:
            result.data.relationships.yearLevel?.yearLevelName || "",
        };

        const updatedSubjects = subjects.map((subject) =>
          subject.subjectID === subjectID ? updatedSubject : subject,
        );

        setSubjects(updatedSubjects);
        setFilteredSubjects(updatedSubjects);

        // Reset all states
        setShowYearSubjects(false);
        setSelectedYearLevel(null);
        setOpenMenuID(null);
        setSelectedSubject(null);

        showToast(result.message || "Subject updated successfully", "success");
      } else {
        // Handle different error cases
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
            console.error("Server error details:", result);
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
      console.error("Error updating subject:", error);
      showToast(
        "An unexpected error occurred while connecting to the server.",
        "error",
      );
    } finally {
      setIsEditing(false);
      setEditingSubject(null);
    }
  };

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const handleDeleteSubject = async (subjectID) => {
    const token = localStorage.getItem("token");

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiUrl}/subjects/${subjectID}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (selectedSubject?.subjectID === subjectID) {
          setSelectedSubject(null);
        }

        await fetchSubjects();
        setSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID),
        );
        setFilteredSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID),
        );
        showToast("Subject deleted successfully", "success");
      } else {
        console.error("Failed to delete subject");
        showToast("Failed to delete subject", "error");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      showToast("Error deleting subject", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setSubjectLoading(true);

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
      console.error("Error fetching subjects:", error);
      showToast(error.message || "Failed to fetch subjects", "error");
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

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setLocalSelectedSubject(subject);
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

  // Hardcoded year levels
  const yearLevelOptions = ["1", "2", "3", "4"];

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
            content={<span className="whitespace-nowrap">Add Subject</span>}
            placement="left"
            className="z-70"
          >
            <div
              className="cursor-pointer justify-center rounded-sm bg-orange-500 px-[7px] py-[3px] text-center text-white transition-all hover:bg-orange-600"
              onClick={() => {
                setShowAddModal(true);
                setShowYearSubjects(false);
              }}
            >
              <i className="bx bx-plus mt-[1px] text-[16px]"></i>
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
                    fetchSubjects();
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
                  {yearLevelGroups[selectedYearLevel]?.length > 0 ? (
                    Object.entries(
                      yearLevelGroups[selectedYearLevel].reduce(
                        (acc, subject) => {
                          const programName =
                            subject.programName || "Unassigned";
                          if (!acc[programName]) {
                            acc[programName] = [];
                          }
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
                                onTouchStart={(e) => {
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
                  )}
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
                  {/* Arrow */}
                  <button
                    className="w-full rounded-sm px-3 py-2 text-left text-sm text-black hover:bg-gray-200"
                    onClick={() => {
                      setEditingSubject(dropdownSubject);
                      setEditedSubject({
                        subjectCode: dropdownSubject.subjectCode,
                        subjectID: dropdownSubject.subjectID,
                        subjectName: dropdownSubject.subjectName,
                        programID: dropdownSubject.programID || "",
                        yearLevelID: dropdownSubject.yearLevelID || "",
                      });
                      setTimeout(() => {
                        setShowYearSubjects(false);
                        setOpenMenuID(null);
                      }, 50);
                    }}
                  >
                    <i className="bx bx-edit-alt mr-2 text-[16px]"></i>Edit
                  </button>
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
                    Object.entries(
                      yearLevelGroups[selectedYearLevel].reduce(
                        (acc, subject) => {
                          const programName =
                            subject.programName || "Unassigned";
                          if (!acc[programName]) {
                            acc[programName] = [];
                          }
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
                  )}
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
            left: dropdownPosition.x - -54,
          }}
          onMouseLeave={() => setOpenMenuID(null)}
        >
          {/* Arrow */}
          <div className="absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rotate-45 border-l border-gray-300 bg-white" />
          <button
            className="w-full rounded-sm px-3 py-2 text-left text-sm text-black hover:bg-gray-200"
            onClick={() => {
              setEditingSubject(dropdownSubject);
              setEditedSubject({
                subjectCode: dropdownSubject.subjectCode,
                subjectID: dropdownSubject.subjectID,
                subjectName: dropdownSubject.subjectName,
                programID: dropdownSubject.programID || "",
                yearLevelID: dropdownSubject.yearLevelID || "",
              });
              setTimeout(() => {
                setShowYearSubjects(false);
                setOpenMenuID(null);
              }, 50);
            }}
          >
            <i className="bx bx-edit-alt mr-2 text-[16px]"></i>Edit
          </button>
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

      {editingSubject && (
        <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
          <div className="relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
            <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
              <h2 className="text-[14px] font-medium text-gray-700">
                Edit Subject
              </h2>

              <button
                onClick={() => {
                  setEditingSubject(null);
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
                    await handleSaveEdit(editedSubject.subjectID);
                    setEditingSubject(null);
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

      {/* Replace the toast JSX with the Toast component */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {showAddModal && (
        <>
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  Add Subject
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
                        placeholder="Code"
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
                        label: program.programName,
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
    </div>
  );
};

export default SideBarDropDown;
