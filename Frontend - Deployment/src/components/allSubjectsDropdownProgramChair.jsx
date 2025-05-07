import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import ModalDropdown from "./modalDropdown";
import SideBarToolTip from "./sidebarTooltip";

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

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
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

    setEditingSubject(null);
    setIsEditing(true);

    try {
      const response = await fetch(`${apiUrl}/subjects/${subjectID}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectCode: editedSubject.subjectCode,
          subjectName: editedSubject.subjectName,
          programID: editedSubject.programID,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.subjectID === subjectID
              ? { ...subject, ...result.data }
              : subject,
          ),
        );
        setFilteredSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.subjectID === subjectID
              ? { ...subject, ...result.data }
              : subject,
          ),
        );

        fetchSubjects();
        setSelectedSubject(null);

        setToast({
          message: "Subject updated successfully",
          type: "success",
          show: true,
        });
      } else {
        setToast({
          message: result.message || "Failed to update subject.",
          type: "error",
          show: true,
        });
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      setToast({
        message: "An unexpected error occurred.",
        type: "error",
        show: true,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const handleDeleteSubject = async (subjectID) => {
    const token = localStorage.getItem("token");

    setShowDeleteModal(false);

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
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;
    const token = localStorage.getItem("token");

    setShowAddModal(false);
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

  const [programs, setPrograms] = useState([]);

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

    fetchPrograms();
  }, []);

  return (
    <div className="-mt-2">
      <li
        className="relative flex cursor-pointer items-center gap-3 rounded px-[4px] py-[4px] hover:bg-orange-500 hover:text-white"
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

      {/* Dropdown Content */}
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

        <div className="mt-4 h-[1px] w-full bg-[rgb(200,200,200)]"></div>

        {/* Subject List */}
        <ul
          ref={listRef}
          className={`scrollbar-show-on-hover mx-auto mt-2 w-full flex-grow text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out ${!isExpanded ? "hidden" : ""}`}
        >
          {subjectLoading ? (
            <li className="animate-pulse p-2 text-center text-[14px] text-[rgb(168,168,168)]">
              <div className="flex items-center justify-center">
                <span>Loading</span>
                <div className="ml-2 size-4 animate-spin rounded-full border-3 border-t-transparent"></div>
              </div>
            </li>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects
              .sort((a, b) => a.programName.localeCompare(b.programName)) // Sort subjects by programName
              .map((subject) => (
                <li
                  key={subject.subjectID}
                  className={`group relative mt-2 mr-1 flex items-center justify-between rounded-sm px-[4px] py-[5px] transition-all duration-100 ease-in-out ${
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
                  <span className="ml-2 flex-1 cursor-pointer break-all">
                    {subject.programName} - {subject.subjectCode}
                  </span>

                  {/* 3-dot menu (visible only on hover) */}
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`${
                        selectedSubject?.subjectID === subject.subjectID
                          ? "flex"
                          : "hidden group-hover:flex"
                      } flex items-center justify-center rounded-full transition`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const menuHeight = 80;

                        const spaceBelow = window.innerHeight - rect.bottom;
                        const direction =
                          spaceBelow < menuHeight ? "up" : "down";

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
            <li className="flex flex-col items-center gap-2 p-2 text-center text-[14px] text-[rgb(168,168,168)]">
              <span>No subjects found</span>
              <button
                onClick={fetchSubjects}
                className="mt-3 flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-1 text-sm shadow-sm hover:bg-gray-200"
                disabled={subjectLoading}
              >
                {subjectLoading ? (
                  <span className="mt-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
                ) : (
                  <>
                    <i className="bx bx-refresh text-[16px]"></i>
                    Refresh
                  </>
                )}
              </button>
            </li>
          )}
        </ul>

        {openMenuID && dropdownSubject && (
          <div
            className="absolute z-50 w-28 rounded bg-white shadow-md"
            style={{
              top:
                dropdownDirection === "down"
                  ? dropdownPosition.y + 4
                  : dropdownPosition.y - 80,
              left: dropdownPosition.x - 0,
            }}
            onMouseLeave={() => setOpenMenuID(null)}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setEditingSubject(dropdownSubject);
                setEditedSubject({
                  subjectCode: dropdownSubject.subjectCode,
                  subjectID: dropdownSubject.subjectID,
                  subjectName: dropdownSubject.subjectName,
                  programID: dropdownSubject.programID || "",
                });
                setOpenMenuID(null);
              }}
            >
              Edit
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100"
              onClick={() => {
                setSubjectToDelete(dropdownSubject);
                setShowDeleteModal(true);
                setOpenMenuID(null);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editingSubject && (
        <div className="lightbox-bg fixed inset-0 z-56 flex flex-col items-center justify-center p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Edit Subject</span>
          </div>
          <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            <div>
              {/* Subject Name Input */}
              <div className="mt-2">
                <div className="mb-2 flex items-start gap-1">
                  <label className="font-color-gray text-[12px]">Name</label>
                  {!editedSubject.subjectName && (
                    <span className="relative -mt-[2px] text-[14px] text-red-500">
                      *
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editedSubject.subjectName}
                  onChange={(e) =>
                    setEditedSubject((prev) => ({
                      ...prev,
                      subjectName: e.target.value,
                    }))
                  }
                  className={`relative mb-1 w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
                  placeholder="Enter subject name"
                />
              </div>

              {/* Subject Code Input */}
              <div className="mt-2 mb-4">
                <div className="mb-2 flex items-start gap-1">
                  <label className="font-color-gray text-[12px]">Code</label>
                  {!editedSubject.subjectCode && (
                    <span className="relative -mt-[2px] text-[14px] text-red-500">
                      *
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editedSubject.subjectCode}
                  onChange={(e) =>
                    setEditedSubject((prev) => ({
                      ...prev,
                      subjectCode: e.target.value,
                    }))
                  }
                  className={`relative mb-1 w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
                  placeholder="Enter subject code"
                />
                {editedSubject.subjectCode.length > 20 && (
                  <p className="text-center text-[13px] text-red-500">
                    Code must be 20 characters or less.
                  </p>
                )}
              </div>

              {/* Program Selection Dropdown */}
              <div>
                <div className="mb-2 flex items-start gap-1">
                  <label className="font-color-gray text-[12px]">Program</label>
                  {!editedSubject.programID && (
                    <span className="relative -mt-[2px] text-[14px] text-red-500">
                      *
                    </span>
                  )}
                </div>

                <ModalDropdown
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
            </div>

            {/* Divider */}
            <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            <div className="mt-2 flex justify-end gap-2 text-[16px]">
              <button
                onClick={() => setEditingSubject(null)}
                className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <Button
                text="Save"
                textres="Save"
                icon="bx bx-edit"
                onClick={async () => {
                  const isNameValid = editedSubject.subjectName.trim() !== "";
                  const isCodeValid =
                    editedSubject.subjectCode.trim() !== "" &&
                    editedSubject.subjectCode.length <= 20;
                  const isProgramValid = editedSubject.programID !== "";

                  if (!isNameValid || !isCodeValid || !isProgramValid) return;

                  await handleSaveEdit(editedSubject.subjectID);
                  setEditingSubject(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && subjectToDelete && (
        <div className="lightbox-bg fixed inset-0 z-56 flex flex-col items-center justify-center p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-sm rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Delete Subject</span>
          </div>

          <div className="border-color relative mx-auto w-full max-w-sm rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            <p className="mt-2 mb-9 text-[14px] break-words text-gray-700">
              Are you sure you want to delete{" "}
              <strong>{subjectToDelete.subjectName}</strong>?
            </p>
            <div className="mb-2 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <Button
                text="Confirm"
                textres="Confirm"
                icon="bx bx-trash"
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
              />
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

      {showAddModal && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Add a Subject</span>
          </div>

          <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            {/* Subject Name */}
            <div className="mb-4">
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">Name</label>
                {!newSubjectName && (
                  <span className="relative -mt-[2px] text-[14px] text-red-500">
                    *
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Enter Subject Name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className={`relative mb-1 w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
              />
            </div>

            {/* Subject Code */}
            <div className="mb-4">
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">Code</label>
                {!newSubjectCode && (
                  <span className="relative -mt-[2px] text-[14px] text-red-500">
                    *
                  </span>
                )}
              </div>
              <input
                type="text"
                className={`relative mb-1 w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
                placeholder="Enter Subject Code (e.g. CPE112)"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
              />

              {newSubjectCode.length > 20 && (
                <p className="text-center text-[13px] text-red-500">
                  Code must be 20 characters or less.
                </p>
              )}
            </div>

            {/* Program Selection */}
            <div>
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">Program</label>
                {!selectedProgramID && (
                  <span className="relative -mt-[2px] text-[14px] text-red-500">
                    *
                  </span>
                )}
              </div>

              <ModalDropdown
                name="Program"
                value={selectedProgramID}
                onChange={(e) => setSelectedProgramID(e.target.value)}
                placeholder="Select Program"
                options={programs.map((program) => ({
                  value: program.programID,
                  label: program.programName,
                }))}
              />
            </div>

            {/* Divider */}
            <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {/* Buttons */}
            <div className="mb-1 flex justify-end gap-2">
              <button
                className="cursor-pointer rounded-md border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setNewSubjectName("");
                  setNewSubjectCode("");
                  setSelectedProgramID("");
                  setShowAddModal(false);
                }}
              >
                <span className="px-1 text-[16px]">Cancel</span>
              </button>

              <Button
                text="Add"
                icon="bx bx-plus"
                onClick={async () => {
                  const valid =
                    newSubjectName.trim() !== "" &&
                    newSubjectCode.trim() !== "" &&
                    newSubjectCode.length <= 20 &&
                    selectedProgramID;

                  if (!valid) return;

                  await handleAddSubject();

                  setShowAddModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {isAdding && <LoadingOverlay show={isAdding} />}
      {isDeleting && <LoadingOverlay show={isDeleting} />}
      {isEditing && <LoadingOverlay show={isEditing} />}
    </div>
  );
};

export default SideBarDropDown;
