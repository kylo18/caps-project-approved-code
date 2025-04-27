import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";

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

    setShowDeleteModal(false);
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

    setShowAddModal(false);
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
        <i className={`bx ${item.icon} text-2xl`}></i>
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

          <div
            className="cursor-pointer justify-center rounded-sm bg-orange-500 px-[7px] py-[3px] text-center text-white transition-all hover:bg-orange-600"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bx bx-plus text-[16px]"></i>
          </div>
        </div>

        <div className="mt-4 h-[1px] w-full bg-[rgb(200,200,200)]"></div>

        <ul
          ref={listRef}
          className={`scrollbar-show-on-hover mx-auto mt-2 w-full flex-grow text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out ${!isExpanded ? "hidden" : ""} `}
        >
          {subjectLoading ? (
            <li className="mt-3 animate-pulse p-2 text-center text-[14px] text-[rgb(168,168,168)]">
              <div className="flex items-center justify-center">
                <span>Loading</span>
                <div className="ml-2 size-4 animate-spin rounded-full border-3 border-t-transparent"></div>
              </div>
            </li>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((subject) => (
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
                  {subject.programName} - {subject.subjectCode}
                </span>

                {/* 3-dot menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`flex items-center justify-center rounded-full transition ${selectedSubject?.subjectID === subject.subjectID ? "visible" : "invisible group-hover:visible"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 80; // Approximate height of dropdown

                      // Check if there's space below, otherwise open upwards
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
            <li className="flex flex-col items-center gap-2 p-2 text-center text-[14px] text-[rgb(168,168,168)]">
              <span>No subjects found</span>
              <button
                onClick={fetchAssignedSubjects}
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
                  : dropdownPosition.y - 50,
              left: dropdownPosition.x - 0, // Align left of button
            }}
            onMouseLeave={() => setOpenMenuID(null)}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100"
              onClick={() => {
                setSubjectToDelete(dropdownSubject);
                setShowDeleteModal(true);
                setOpenMenuID(null);
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && subjectToDelete && (
        <div className="lightbox-bg fixed inset-0 z-56 flex flex-col items-center justify-center">
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

      {/* Add Assign Subject Modal */}
      {showAddModal && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Assign a Subject</span>
          </div>

          <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            {/* Refresh Button */}
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
                className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-[7px] text-sm hover:bg-gray-200"
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
                  <h3 className="mb-2 text-[14px] font-semibold">Loading...</h3>
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
              <Button
                text="Assign"
                textres="Assign"
                icon="bx bx-check"
                onClick={() =>
                  handleAssignSubject(selectedSubjectForAssignment)
                }
                disabled={!selectedSubjectForAssignment}
              />
            </div>
          </div>
        </div>
      )}
      {isDeleting && <LoadingOverlay show={isDeleting} />}
      {isAssigning && <LoadingOverlay show={isAssigning} />}

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
              <p className="mb-1 text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedSubjectsDropDown;
