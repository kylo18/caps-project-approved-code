import { useEffect, useState, useRef } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";  

const SideBarDropDown = ({ item, isExpanded, setIsExpanded, setSelectedSubject, parsedRoleID, isSubjectFocused, setIsSubjectFocused, homePath }) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [selectedSubject, setLocalSelectedSubject] = useState(null);
  const listRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  const [editingSubject, setEditingSubject] = useState(null);
  const [editedSubject, setEditedSubject] = useState({ subjectCode: "", subjectName: "" });

  const handleEditClick = (subject) => {
    setEditingSubject(subject.subjectID);
    setEditedSubject({ subjectCode: subject.subjectCode, subjectName: subject.subjectName });
  };

  const handleSaveEdit = async (subjectID) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${apiUrl}/subjects/${subjectID}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editedSubject),
      });

      if (response.ok) {
        setSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.subjectID === subjectID ? { ...subject, ...editedSubject } : subject
          )
        );
        setFilteredSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.subjectID === subjectID ? { ...subject, ...editedSubject } : subject
          )
        );
        setEditingSubject(null); // Exit edit mode
      } else {
        console.error("Failed to update subject");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  const handleDeleteSubject = async (subjectID) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${apiUrl}/subjects/${subjectID}/delete`, {
      
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        setSubjects((prevSubjects) => prevSubjects.filter(subject => subject.subjectID !== subjectID));
        setFilteredSubjects((prevSubjects) => prevSubjects.filter(subject => subject.subjectID !== subjectID));
      } else {
        console.error("Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };
  
  
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setLoading(true); // Start loading
  
    try {
      const response = await fetch(`${apiUrl}/subjects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
  
      setSubjects(data.subjects);
      setFilteredSubjects(data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false); // End loading
    }
  };
  

  const handleAddSubject = async () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;

    const token = localStorage.getItem("token"); 

    try {
      const response = await fetch(`${apiUrl}/add-subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectCode: newSubjectCode,
          subjectName: newSubjectName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const newSubject = result.subject;
        setSubjects((prevSubjects) => [...prevSubjects, newSubject]);
        setFilteredSubjects((prevSubjects) => [...prevSubjects, newSubject]);
        setNewSubjectCode("");
        setNewSubjectName("");
        setShowAddModal(false);
      } else {
        console.error("Failed to add subject:", result.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error adding subject:", error);
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
          subject?.subjectName?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          subject?.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase().trim())
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
            }`}
          ></i>
        )}
      </li>

      {/* Dropdown Content */}
      <div
        className={`flex flex-col h-[400px] mt-2 transition-all duration-0 ease-in-out ${
          isOpen ? "opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="ml-[1.8px] w-full mx-auto mt-2 flex items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            className="w-[97%] px-2 py-1 text-[14px] border border-[rgb(168,168,168)] rounded-md outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
        </div>

        {/* Subject List */}
        <ul
          ref={listRef}
          className="ml-[3px] flex-grow overflow-y-auto custom-scrollbar pr-2 transition-all duration-300 ease-in-out
            text-left text-[14px] font-semibold mt-2 w-full mx-auto text-[rgb(78,78,78)]"
        >
          {loading ? (
            <li className="p-2 text-gray-500 text-[14px] text-center animate-pulse">
              <div className="flex items-center justify-center">
                <span>Loading</span>
                <div className="ml-2 size-4 border-3 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </li>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <li
                key={subject.subjectID}
                className={`cursor-pointer flex justify-between items-center rounded-md mt-2 transition-all duration-100 ease-in-out p-[7px] ${
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
                <span>
                  {subject.subjectCode}
                </span>
              </li>
            ))
          ) : (
            <li className="p-2 text-[rgb(168,168,168)] text-[14px] text-center">No subjects found</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className=" fixed inset-0 flex items-center justify-center bg-black lightbox-bg">
          <div className="bg-white py-4 px-6 rounded-md shadow-lg w-80">
            <h2 className="text-[16px] font-semibold mb-5">Add A New Subject</h2>
            <input
              type="text"
              className="open-sans text-[12px] border-0 hover:border-b border-b border-[rgb(168,168,168)] mb-3 py-2 w-full rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
              placeholder="Enter subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
            />
            <input
              type="text"
              className="open-sans text-[12px] border-0 hover:border-b border-b border-[rgb(168,168,168)] mb-3 py-2 w-full rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
              placeholder="Enter Subject Code (e.g. CPE112)"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              required
            />

            <div className="mt-4 flex justify-end gap-2">
              <button 
                className="cursor-pointer flex items-center gap-1 px-2 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-200"
                onClick={() => setShowAddModal(false)}
                >
                <span className="text-[16px] px-1">Cancel</span>
              </button>
              <Button text="Add" textres="Add" icon="bx bx-plus"  onClick={handleAddSubject} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBarDropDown;
