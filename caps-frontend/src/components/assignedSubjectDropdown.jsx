import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";  
import LoadingOverlay from "./loadingOverlay";

const AssignedSubjectsDropDown = ({ item, isExpanded, setIsExpanded, setSelectedSubject, parsedRoleID, isSubjectFocused, setIsSubjectFocused, homePath }) => {
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
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState(null); 
  const [openMenuID, setOpenMenuID] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [subjectLoading, setSubjectLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [dropdownSubject, setDropdownSubject] = useState(null);

  const [dropdownDirection, setDropdownDirection] = useState("down"); // "down" or "up"

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
    setEditedSubject({ subjectCode: subject.subjectCode, subjectName: subject.subjectName});
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
  
    try {
      const response = await fetch(`${apiUrl}/subjects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
        a.subjectCode.localeCompare(b.subjectCode)
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
          "Authorization": `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const data = await response.json(); 
        const sortedSubjects = [...data.subjects].sort((a, b) =>
          a.subjectCode.localeCompare(b.subjectCode)
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
      setFilteredSubjects(assignedSubjects); // 🔁 Fix this line
    } else {
      const results = assignedSubjects.filter(
        (subject) =>
          subject?.subjectName?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          subject?.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
      setFilteredSubjects(results);
    }
  }, [searchTerm, assignedSubjects]);

  const searchResults = assignedSubjects?.filter((subject) =>
    `${subject.subjectName} ${subject.subjectCode}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  

  useEffect(() => {
    if (!isOpen && listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isOpen]);

  const unassignedSubjects = subjects.filter(
    (subject) => !assignedSubjects.some((assigned) => assigned.subjectID === subject.subjectID)
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
      const response = await fetch(`${apiUrl}/remove-assigned-subject/${subjectID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        if (selectedSubject?.subjectID === subjectID) {
          setSelectedSubject(null);
        }

        await fetchAssignedSubjects();

        setSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID)
        );
        setFilteredSubjects((prevSubjects) =>
          prevSubjects.filter((subject) => subject.subjectID !== subjectID)
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
          "Authorization": `Bearer ${token}`,
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
    <div className="-mt-2">
      <li
        className="hover:text-white hover:bg-orange-500 flex items-center gap-3 py-[4px] px-[4px] rounded cursor-pointer relative"
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
          className={`text-[14px] font-semibold transition-all duration-100 ease-in-out ${
            isExpanded ? "opacity-100 ml-0" : "opacity-0 -ml-5"
          }`}
        >
          Subjects
        </span>
        {isExpanded && (
          <i
            className={`bx ${isOpen ? "bxs-chevron-down" : "bxs-chevron-down"} text-[22px] ml-3 transition-transform duration-300 ease-in-out ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}></i>
        )}
      </li>
  
      {/* Dropdown Content */}
      <div
        className={`flex flex-col h-[400px] mt-2 transition-all duration-0 ease-in-out ${
          isOpen ? "opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className=" w-full mx-auto mt-2 flex items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            className="w-27 px-2 py-1 text-[14px] border border-[rgb(168,168,168)] rounded-md outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="cursor-pointer hover:bg-orange-700 justify-center text-center bg-orange-500  text-white px-[9px] py-[3px] rounded-md transition-all"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bx bx-plus text-[16px] "></i>
          </div>
        </div>
        
        <ul
          ref={listRef}
          className="ml-[3px] flex-grow overflow-y-auto custom-scrollbar pr-2 transition-all duration-300 ease-in-out
            text-left text-[14px] font-semibold mt-2 w-full mx-auto text-[rgb(78,78,78)]"
        >
          {subjectLoading ? (
            <li className="p-2 mt-3 text-[rgb(168,168,168)] text-[14px] text-center animate-pulse">
              <div className="flex items-center justify-center">
                <span>Loading</span>
                <div className="ml-2 size-4 border-3 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </li>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((subject) => (
              <li
                key={subject.subjectID}
                className={`relative group cursor-pointer flex justify-between items-center rounded-md mt-2 transition-all duration-100 ease-in-out p-[7px] ${
                  selectedSubject && selectedSubject.subjectID === subject.subjectID
                    ? "bg-orange-500 text-white"
                    : "hover:bg-[rgb(255,230,214)]"
                }`}
                onClick={() => {
                  setSelectedSubject(null);
                  handleSelectSubject(subject);
                  navigate(homePath);
                }}
              >
                <span
                  className="flex-1 ml-1 cursor-pointer break-all"
                >
                  {subject.subjectCode}
                </span>

                {/* 3-dot menu */}
                <div className="relative"
                 onClick={(e) => e.stopPropagation()}>
                  
                  <button
                    className={`flex items-center justify-center rounded-full transition
                      ${selectedSubject?.subjectID === subject.subjectID ? "visible" : "invisible group-hover:visible"}`}
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
                    <i className="bx bx-dots-vertical-rounded text-[18px] cursor-pointer"></i>
                  </button>

                  
                </div>
              </li>
            ))
          ) : (
            <li className="flex flex-col items-center gap-2 p-4 text-[rgb(168,168,168)] text-[14px] text-center">
              <span>No assigned subjects found</span>
              <button
                onClick={fetchAssignedSubjects}
                className="mt-3 flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md shadow-sm"
                disabled={subjectLoading}
              >
                {subjectLoading ? (
                  <span className="animate-spin border-2 border-gray-400 border-t-transparent rounded-full w-4 h-4 mt-3"></span>
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
            className="absolute z-50 w-28 bg-white rounded shadow-md"
            style={{
              top: dropdownDirection === "down" ? dropdownPosition.y + 4 : dropdownPosition.y - 50,
              left: dropdownPosition.x - 0, // Align left of button
            }}
            onMouseLeave={() => setOpenMenuID(null)}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center lightbox-bg ">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-sm shadow-lg">
            <h2 className="text-[16px] font-semibold mb-5 text-gray-700">Confirm Delete</h2>
            <p className="text-[14px] text-gray-700 mb-9 break-words">
              Are you sure you want to delete <strong>{subjectToDelete.subjectName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cursor-pointer flex items-center gap-1 px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-200 ml-auto"
              >
                Cancel
              </button>
              <Button
                text="Delete"
                textres="Delete"
                icon="bx bx-trash"
                onClick={async () => {
                  await handleDeleteSubject(subjectToDelete.subjectID);
                  setShowDeleteModal(false);
                  setSubjectToDelete(null);
                  setToast({
                    message: "Subject deleted successfully",
                    type: "success",
                    show: true,
                  });;
                }}
              />
            </div>
          </div>
        </div>
      )}
  
      {/* Add Assign Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center lightbox-bg">
          <div className="bg-white rounded-md p-6 w-[90%] max-w-sm shadow-lg">
            <h2 className="text-[16px] font-semibold mb-5 text-gray-700">Assign A New Subject</h2>

            {/* Subject List for Assigning */}
            <div className="mb-3">
              <ul className="max-h-[200px] overflow-y-auto" ref={listRef}>
                {loading ? (
                  <h3 className="text-[14px] font-semibold mb-2">Loading...</h3>
                ) : unassignedSubjects.length > 0 ? (
                  unassignedSubjects.map((subject) => (
                    <li
                      key={subject.subjectID}
                      className={`cursor-pointer flex justify-between items-center rounded-md mt-2 mr-[6px] transition-all duration-100 ease-in-out p-[7px] ${
                        selectedSubjectForAssignment && selectedSubjectForAssignment.subjectID === subject.subjectID
                          ? "bg-orange-500 text-white" 
                          : "hover:bg-[rgb(255,230,214)]"
                      }`}
                      onClick={() => {
                        setSelectedSubjectForAssignment(subject);
                      }}
                    >
                      <span className="pl-1 mb-[1px]">
                        {subject.subjectName} ({subject.subjectCode})
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-[rgb(168,168,168)] text-[14px] text-center">
                    All subjects already assigned.
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-9 flex justify-end gap-2">
              <button
                className="cursor-pointer flex items-center gap-1 px-2 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-200"
                onClick={() => setShowAddModal(false)}
              >
                <span className="text-[16px] px-1">Cancel</span>
              </button>
              <Button
                text="Assign"
                textres="Assign"
                icon="bx bx-check"
                onClick={() => handleAssignSubject(selectedSubjectForAssignment)}
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
        className={`fixed bottom-5 left-5 z-50 px-4 py-2 rounded shadow-lg text-sm text-white
        ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
        ${toast.show ? "opacity-100" : "opacity-0"} transition-opacity duration-500 ease-in-out`}
      >
        {toast.message}
      </div>
    )}
    
    </div>
  );
};

export default AssignedSubjectsDropDown;
