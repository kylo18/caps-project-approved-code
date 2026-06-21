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
import notFoundImage from "../assets/icons/notfound.png";
import noInternetImage from "../assets/icons/404notfound.png";
import emptyImage from "../assets/icons/empty.png";
import AdminContent from "./AdminContent";

import AllSubjectsIcon from "/src/assets/symbols/all.svg";
import AllSubjectsIconH from "/src/assets/symbols/allhover.svg";

import ArchiveIcon from "/src/assets/symbols/archive.svg";
import ArchiveIconH from "/src/assets/symbols/archivehover.svg";

import SubPhoto from "../assets/gottfield.jpg";

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

function SubjectsArchive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSubject, setSelectedSubject } = useOutletContext();
  const params = new URLSearchParams(location.search);
  const subjectID = params.get("subject_id") || params.get("subjectID");
  const subjectFromState = location.state?.subject;

  // If subject_id is in URL or subject is in state, set selectedSubject and render AdminContent
  useEffect(() => {
    if (subjectFromState && subjectFromState.subjectID) {
      setSelectedSubject(subjectFromState);
    } else if (subjectID && !selectedSubject) {
      // If we have subjectID but no subject in state, fetch it
      const fetchSubject = async () => {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        try {
          const response = await fetch(`${apiUrl}/subjects/${subjectID}`, {
          credentials: "include",
            headers: {
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
    if (subjectFromState && subjectFromState.subjectID) {
      setSelectedSubject(subjectFromState);
      navigate(
        "/dean/subjects/content?subjectID=" + subjectFromState.subjectID,
        {
          state: { subject: subjectFromState },
          replace: true,
        },
      );
      return;
    }

    if (subjectID) {
      // If we have subjectID but no subject in state, fetch it first
      const fetchSubject = async () => {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        try {
          const response = await fetch(`${apiUrl}/subjects/${subjectID}`, {
          credentials: "include",
            headers: {
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.subject) {
              setSelectedSubject(data.subject);
              navigate("/dean/subjects/content?subjectID=" + subjectID, {
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
  }, [subjectID, subjectFromState, setSelectedSubject, navigate]);

  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("All");
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openKebabMenu, setOpenKebabMenu] = useState(null);
  const kebabMenuRef = useRef(null);

  // Year level filter state
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState("All");
  const [showYearLevelDropdown, setShowYearLevelDropdown] = useState(false);
  const yearLevelDropdownRef = useRef(null);

  // Multi-selection state
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const kebabButtonRefs = useRef({});
  const [dropdownButtonRect, setDropdownButtonRect] = useState(null);

  // Close kebab menu when clicking outside
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

    if (openKebabMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        (subject) => subject.yearLevel === selectedYearLevelFilter,
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

  // Fetch archived subjects
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => fetchSubjects();
    window.addEventListener("refreshSubjectsList", handleRefresh);
    return () =>
      window.removeEventListener("refreshSubjectsList", handleRefresh);
  }, []);

  const fetchSubjects = async () => {
    setSubjectLoading(true);
    setNetworkError(false);

    try {
      // Fetch archived subjects - adjust endpoint as needed
      const response = await fetch(`${apiUrl}/subjects?archived=true`, {
          credentials: "include",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch archived subjects");
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

  // Handle subject checkbox change
  const handleSubjectCheckboxChange = (subjectID, isChecked) => {
    if (isChecked) {
      setSelectedSubjects((prev) => [...prev, subjectID]);
    } else {
      setSelectedSubjects((prev) => prev.filter((id) => id !== subjectID));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedSubjects(filteredSubjects.map((subject) => subject.subjectID));
    } else {
      setSelectedSubjects([]);
    }
  };

  // Count how many filtered subjects are selected
  const selectedFilteredCount = filteredSubjects.filter((subject) =>
    selectedSubjects.includes(subject.subjectID),
  ).length;

  // Check if all visible subjects are selected
  const isAllSelected =
    filteredSubjects.length > 0 &&
    selectedFilteredCount === filteredSubjects.length;

  // Check if some (but not all) visible subjects are selected
  const isIndeterminate =
    filteredSubjects.length > 0 &&
    selectedFilteredCount > 0 &&
    selectedFilteredCount < filteredSubjects.length;

  const yearLevelOptions = ["1", "2", "3", "4"];

  // Handle subject click to navigate to question management
  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    navigate(`/dean/subjects/content?subjectID=${subject.subjectID}`, {
      state: { subject },
    });
  };

  return (
    <div className="-ml-2 flex h-screen">
      {/* Left sidebar panel */}
      <aside className="fixed top-0 left-[220px] hidden h-screen w-56 overflow-hidden border-r border-gray-200 bg-white px-4 py-4 md:block lg:w-64">
        <h2 className="outfit-500 mb-4 text-[16px] tracking-wide text-black">
          Subjects
        </h2>

        <nav className="outfit-500 space-y-1 text-[15px]">
          <Link
            to="/dean/subjects"
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
              location.pathname === "/dean/subjects" &&
              location.pathname !== "/dean/subjects/archive"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  location.pathname === "/dean/subjects" &&
                  location.pathname !== "/dean/subjects/archive"
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
            FIELDS{" "}
          </div>
          {uniquePrograms.map((programName) => (
            <button
              key={programName}
              type="button"
              onClick={() => setSelectedProgramFilter(programName)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                selectedProgramFilter === programName
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{getDisplayProgramName(programName)}</span>
            </button>
          ))}

          <div className="my-4 h-px bg-gray-200" />

          <Link
            to="/dean/subjects/archive"
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
              location.pathname === "/dean/subjects/archive"
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <img
                src={
                  location.pathname === "/dean/subjects/archive"
                    ? ArchiveIconH
                    : ArchiveIcon
                }
                alt="archives"
                className="h-4 w-4"
              />
              <span>Archive</span>
            </span>
            <span className="text-xs text-gray-500">{subjects.length}</span>
          </Link>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="ml-[220px] flex-1 overflow-y-auto md:ml-[276px] lg:ml-[300px]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="outfit-500 text-2xl font-semibold text-gray-900">
              {searchTerm
                ? `Search results for "${searchTerm}"`
                : selectedProgramFilter === "All"
                  ? "Archived Subjects"
                  : `Archived Subjects - ${getDisplayProgramName(selectedProgramFilter)}`}
            </h1>
            {selectedSubjects.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Select the subjects you want to delete (
                {selectedSubjects.length} selected)
              </p>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 pl-10 text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
              />
              <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              )}
            </div>

            {/* Year Level Filter and Actions */}
            <div className="flex items-center gap-3">
              {/* Year Level Dropdown */}
              <div className="relative" ref={yearLevelDropdownRef}>
                <button
                  type="button"
                  onClick={() =>
                    setShowYearLevelDropdown(!showYearLevelDropdown)
                  }
                  className="outfit -mb-4 inline-flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <span>
                    {selectedYearLevelFilter === "All"
                      ? "All Year Levels"
                      : `Year ${selectedYearLevelFilter}`}
                  </span>
                  <i
                    className={`bx bx-chevron-down ml-2 text-lg transition-transform ${
                      showYearLevelDropdown ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>
                {showYearLevelDropdown && (
                  <div className="absolute right-0 z-20 mt-2 min-w-[160px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYearLevelFilter("All");
                        setShowYearLevelDropdown(false);
                      }}
                      className={`outfit-500 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
                        selectedYearLevelFilter === "All"
                          ? "bg-gray-100 text-black"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
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
                        className={`outfit-500 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedYearLevelFilter === yearLevel
                            ? "bg-gray-100 text-black"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Year {yearLevel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject Count */}
          {!subjectLoading && !networkError && (
            <div className="mb-4 text-sm text-gray-600">
              {filteredSubjects.length} subject(s)
            </div>
          )}

          {/* Loading State */}
          {subjectLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="loader"></div>
            </div>
          )}

          {/* Network Error State */}
          {networkError && (
            <div className="flex flex-col items-center justify-center py-12">
              <img
                src={noInternetImage}
                alt="Network Error"
                className="mb-4 h-32 w-32"
              />
              <p className="text-lg font-semibold text-gray-900">
                Network Error
              </p>
              <p className="text-sm text-gray-500">
                Please check your internet connection and try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!subjectLoading &&
            !networkError &&
            filteredSubjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <img
                  src={emptyImage}
                  alt="No subjects"
                  className="mb-4 h-32 w-32"
                />
                <p className="text-lg font-semibold text-gray-900">
                  No archived subjects found
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Archived subjects will appear here"}
                </p>
              </div>
            )}

          {/* Subjects Table */}
          {!subjectLoading && !networkError && filteredSubjects.length > 0 && (
            <div className="outfit rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="w-6 px-2 py-3">
                        <input
                          type="checkbox"
                          checked={isAllSelected && !isIndeterminate}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isIndeterminate;
                            }
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Subject Information
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredSubjects.map((subject) => (
                      <tr
                        key={subject.subjectID}
                        onClick={() => handleSubjectClick(subject)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td
                          className="w-12 px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(
                              subject.subjectID,
                            )}
                            onChange={(e) =>
                              handleSubjectCheckboxChange(
                                subject.subjectID,
                                e.target.checked,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded bg-gray-100">
                              <img
                                src={SubPhoto}
                                alt={subject.subjectName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {subject.subjectName}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <span>{subject.subjectCode}</span>
                                {subject.yearLevel && (
                                  <>
                                    <span>•</span>
                                    <span>{subject.yearLevel}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div
                            ref={kebabMenuRef}
                            className="relative z-50 flex items-center justify-end"
                          >
                            <button
                              ref={(el) => {
                                kebabButtonRefs.current[subject.subjectID] = el;
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const button =
                                  kebabButtonRefs.current[subject.subjectID];
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownButtonRect({
                                    top: rect.top + window.scrollY,
                                    right:
                                      window.innerWidth -
                                      rect.right +
                                      window.scrollX,
                                    bottom: rect.bottom + window.scrollY,
                                    subjectID: subject.subjectID,
                                  });
                                }
                                setOpenKebabMenu(
                                  openKebabMenu === subject.subjectID
                                    ? null
                                    : subject.subjectID,
                                );
                              }}
                              className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                              <i className="bx bx-dots-vertical-rounded text-xl"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Portal - Rendered outside table */}
      {openKebabMenu &&
        dropdownButtonRect &&
        createPortal(
          <div
            ref={kebabMenuRef}
            className="outfit-500 fixed z-50 min-w-[120px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            style={{
              top: `${
                window.innerHeight -
                  (dropdownButtonRect.bottom - window.scrollY) <
                100
                  ? dropdownButtonRect.top - 90
                  : dropdownButtonRect.bottom + 8
              }px`,
              right: `${dropdownButtonRect.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="outfit-500 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                const subject = filteredSubjects.find(
                  (s) => s.subjectID === openKebabMenu,
                );
                if (subject) {
                  // Handle restore or other actions for archived subjects
                  showToast("Restore functionality coming soon", "info");
                }
                setOpenKebabMenu(null);
                setDropdownButtonRect(null);
              }}
            >
              <i className="bx bx-undo text-sm"></i>
              Restore
            </button>
          </div>,
          document.body,
        )}

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}

export default SubjectsArchive;
