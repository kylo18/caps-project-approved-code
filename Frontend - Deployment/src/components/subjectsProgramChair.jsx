import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import SideBarToolTip from "./sidebarTooltip";
import { Tooltip } from "flowbite-react";
import RegisterDropDownSmall from "./registerDropDownSmall";
import { createPortal } from "react-dom";

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

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      programID: subject.programID || "",
      yearLevelID: subject.yearLevelID || "",
    });
  };

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

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

      console.log("Sending update data:", updateData);

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
      console.log("Update response:", result);

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

        setToast({
          message: result.message || "Subject updated successfully",
          type: "success",
          show: true,
        });
      } else {
        // Handle different error cases
        switch (response.status) {
          case 401:
            setToast({
              message: "You are not authenticated. Please log in again.",
              type: "error",
              show: true,
            });
            break;
          case 403:
            setToast({
              message: "You are not authorized to modify subjects.",
              type: "error",
              show: true,
            });
            break;
          case 404:
            setToast({
              message: "Subject not found.",
              type: "error",
              show: true,
            });
            break;
          case 409:
            setToast({
              message:
                result.message ||
                "A subject with these details already exists.",
              type: "error",
              show: true,
            });
            break;
          case 500:
            console.error("Server error details:", result);
            setToast({
              message:
                "An error occurred while updating the subject. Please try again.",
              type: "error",
              show: true,
            });
            break;
          default:
            setToast({
              message: result.message || "Failed to update subject.",
              type: "error",
              show: true,
            });
        }
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      setToast({
        message: "An unexpected error occurred while connecting to the server.",
        type: "error",
        show: true,
      });
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
      } else {
        console.error("Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
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

      const sortedSubjects = [...data.subjects].sort((a, b) =>
        a.subjectCode.localeCompare(b.subjectCode),
      );

      setSubjects(sortedSubjects);
      setFilteredSubjects(sortedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setToast({
        message: error.message || "Failed to fetch subjects",
        type: "error",
        show: true,
      });
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

        setToast({
          message: "Subject added successfully",
          type: "success",
          show: true,
        });
      } else {
        // Handle specific error if subject already exists
        if (result.message && result.message.includes("already exists")) {
          setToast({
            message: "Subject already exists",
            type: "error",
            show: true,
          });
        } else {
          // General error case
          console.error(
            "Failed to add subject:",
            result.message || "Unknown error",
          );
          setToast({
            message: "Failed to add subject",
            type: "error",
            show: true,
          });
        }
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      setToast({
        message: "An error occurred while adding subject",
        type: "error",
        show: true,
      });
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
        </div>

        {/* Year Level List or Search Results */}
        <ul
          ref={listRef}
          className={`scrollbar-show-on-hover mx-auto mt-2 w-full flex-grow pr-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out ${!isExpanded ? "hidden" : ""}`}
        >
          {subjectLoading ? (
            <li className="animate-pulse p-2 text-center text-[14px] text-[rgb(168,168,168)]">
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
                className="group relative mt-2 mr-1 flex items-center justify-between rounded-sm px-[4px] py-[5px] transition-all duration-100 ease-in-out hover:bg-[rgb(255,230,214)]"
                onClick={() => {
                  setSelectedSubject(null);
                  handleSelectSubject(subject);
                  navigate(homePath);
                }}
              >
                <span className="ml-2 flex-1 cursor-pointer break-all">
                  {subject.programName} - {subject.subjectCode}
                </span>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="hidden items-center justify-center rounded-full transition group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 80;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const direction = spaceBelow < menuHeight ? "up" : "down";
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
      {editingSubject && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-2xl border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 min-[448px]:rounded-t-md">
            <span>Edit Subject</span>
          </div>
          <div className="border-color relative mx-auto w-full max-w-md border border-t-0 bg-white p-2 min-[448px]:rounded-b-md sm:px-4">
            <div>
              {/* Subject Name Input */}
              <div>
                <div className="mb-2 flex items-start gap-1"></div>
                <div className="relative w-full">
                  <div className="relative">
                    <input
                      type="text"
                      className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      placeholder="Name"
                      value={editedSubject.subjectName}
                      onChange={(e) =>
                        setEditedSubject((prev) => ({
                          ...prev,
                          subjectName: e.target.value,
                        }))
                      }
                    />
                    <label
                      htmlFor="Subject Name"
                      className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Subject Name
                    </label>
                  </div>
                </div>
              </div>

              {/* Subject Code Input */}
              <div className="mt-2 mb-4">
                <div className="mb-2 flex items-start gap-1"></div>
                <div className="relative w-full">
                  <div className="relative">
                    <input
                      type="text"
                      className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      placeholder="Name"
                      value={editedSubject.subjectCode}
                      onChange={(e) =>
                        setEditedSubject((prev) => ({
                          ...prev,
                          subjectCode: e.target.value,
                        }))
                      }
                    />
                    <label
                      htmlFor="Subject Code"
                      className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Subject Code
                    </label>
                  </div>
                </div>

                {editedSubject.subjectCode.length > 20 && (
                  <p className="text-center text-[13px] text-red-500">
                    Code must be 20 characters or less.
                  </p>
                )}
              </div>
              <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

              {/* Program Selection Dropdown */}
              <div>
                <div className="mb-2 flex items-start gap-1">
                  <label className="font-color-gray text-[12px]">Program</label>
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
              </div>

              {/* Year Level Selection */}
              <div className="mb-4">
                <div className="mb-2 flex items-start gap-1">
                  <label className="font-color-gray text-[12px]">
                    Year Level
                  </label>
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
              </div>
            </div>

            {/* Divider */}
            <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {validationError && (
              <div className="mb-3 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                {validationError}
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2 text-[14px]">
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setValidationError("");
                }}
                className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                className="flex w-[80px] cursor-pointer items-center justify-center rounded-md bg-orange-500 px-[12px] py-[6px] text-[14px] text-white hover:bg-orange-700"
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
              >
                {isEditing ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Update"
                )}
              </button>
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
                  <span className="inline text-[14px]">Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
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

export default SideBarDropDown;
