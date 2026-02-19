import { useState, useEffect } from "react";
import useToast from "../hooks/useToast";
import Toast from "./Toast";

const AssignToClassModal = ({
  isOpen,
  onClose,
  personalQuizID,
  quizTitle,
  onSuccess,
}) => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClassIDs, setSelectedClassIDs] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isOpen && personalQuizID) {
      fetchClasses();
      // Reset form when modal opens
      setSelectedClassIDs([]);
      setStartDate("");
      setDeadlineDate("");
    }
  }, [isOpen, personalQuizID]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${apiUrl}/personal-quizzes/${personalQuizID}/classes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        sessionStorage.removeItem("token");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch classes. Please try again."
        );
      }

      const data = await response.json();
      if (data.success) {
        setClasses(data.classes || []);
      } else {
        throw new Error(data.message || "Failed to fetch classes.");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      showToast(
        error.message || "Failed to fetch classes. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassToggle = (classID) => {
    setSelectedClassIDs((prev) => {
      if (prev.includes(classID)) {
        return prev.filter((id) => id !== classID);
      } else {
        return [...prev, classID];
      }
    });
  };

  const handleSelectAll = () => {
    const unassignedClasses = classes.filter((cls) => !cls.isAssigned);
    if (selectedClassIDs.length === unassignedClasses.length) {
      setSelectedClassIDs([]);
    } else {
      setSelectedClassIDs(
        unassignedClasses.map((cls) => cls.classID)
      );
    }
  };

  const handleAssign = async () => {
    if (selectedClassIDs.length === 0) {
      showToast("Please select at least one class.", "error");
      return;
    }

    // Validate dates if provided
    if (startDate && deadlineDate) {
      const start = new Date(startDate);
      const deadline = new Date(deadlineDate);
      if (deadline < start) {
        showToast(
          "Deadline date must be after or equal to start date.",
          "error"
        );
        return;
      }
    }

    setIsAssigning(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsAssigning(false);
        return;
      }

      const payload = {
        classIDs: selectedClassIDs,
      };

      if (startDate) {
        payload.startDate = startDate;
      }
      if (deadlineDate) {
        payload.deadlineDate = deadlineDate;
      }

      const response = await fetch(
        `${apiUrl}/personal-quizzes/${personalQuizID}/assign-classes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        sessionStorage.removeItem("token");
        setIsAssigning(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors)
            .flat()
            .join(", ");
          throw new Error(errorMessages || "Validation failed");
        }
        throw new Error(
          errorData.message || "Failed to assign quiz to classes."
        );
      }

      const data = await response.json();
      if (data.success) {
        const assignedCount = data.assignedCount || 0;
        let message = `Quiz assigned to ${assignedCount} class(es) successfully.`;
        
        if (data.skipped && data.skipped.length > 0) {
          message += ` ${data.skippedCount} class(es) were skipped (already assigned).`;
        }
        
        showToast(message, "success");
        
        // Refresh classes list
        await fetchClasses();
        
        // Reset selection
        setSelectedClassIDs([]);
        setStartDate("");
        setDeadlineDate("");
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        throw new Error(data.message || "Failed to assign quiz.");
      }
    } catch (error) {
      console.error("Error assigning quiz to classes:", error);
      showToast(
        error.message || "Failed to assign quiz to classes. Please try again.",
        "error"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  const unassignedClasses = classes.filter((cls) => !cls.isAssigned);
  const allUnassignedSelected =
    unassignedClasses.length > 0 &&
    selectedClassIDs.length === unassignedClasses.length;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative mx-2 w-full max-w-3xl rounded-md bg-white shadow-2xl">
          {/* Header */}
          <div className="border-color relative flex items-center justify-between border-b py-3 pl-4 pr-12">
            <h2 className="text-[16px] font-semibold text-gray-800">
              Assign Quiz to Classes
            </h2>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              title="Close"
            >
              <i className="bx bx-x text-[20px]"></i>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loader"></div>
                <span className="ml-3 text-sm text-gray-600">
                  Loading classes...
                </span>
              </div>
            ) : classes.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No classes available. Please create a class first.
              </div>
            ) : (
              <>
                {/* Quiz Info */}
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Quiz: {quizTitle || "Untitled Quiz"}
                  </p>
                </div>

                {/* Date Pickers */}
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Start Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Deadline Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      min={startDate || undefined}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Select All Button */}
                {unassignedClasses.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedClassIDs.length} of {unassignedClasses.length}{" "}
                      unassigned classes selected
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      {allUnassignedSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}

                {/* Classes List */}
                <div className="space-y-2">
                  {classes.map((classItem) => {
                    const isSelected = selectedClassIDs.includes(
                      classItem.classID
                    );
                    const isAssigned = classItem.isAssigned;

                    return (
                      <div
                        key={classItem.classID}
                        className={`rounded-lg border p-3 ${
                          isAssigned
                            ? "border-green-200 bg-green-50"
                            : isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!isAssigned && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleClassToggle(classItem.classID)}
                              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-800">
                                {classItem.className}
                              </h3>
                              {isAssigned && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Already Assigned
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-600">
                              Code: {classItem.classCode}
                            </p>
                            {classItem.subject && (
                              <p className="mt-1 text-xs text-gray-600">
                                {classItem.subject.subjectCode} -{" "}
                                {classItem.subject.subjectName}
                              </p>
                            )}
                            {classItem.description && (
                              <p className="mt-1 text-xs text-gray-500">
                                {classItem.description}
                              </p>
                            )}
                            {isAssigned && classItem.assignment && (
                              <div className="mt-2 rounded bg-white p-2 text-xs text-gray-600">
                                <p>
                                  <span className="font-medium">Assigned:</span>{" "}
                                  {new Date(
                                    classItem.assignment.assignedAt
                                  ).toLocaleDateString()}
                                </p>
                                {classItem.assignment.startDate && (
                                  <p>
                                    <span className="font-medium">Start:</span>{" "}
                                    {new Date(
                                      classItem.assignment.startDate
                                    ).toLocaleString()}
                                  </p>
                                )}
                                {classItem.assignment.deadlineDate && (
                                  <p>
                                    <span className="font-medium">Deadline:</span>{" "}
                                    {new Date(
                                      classItem.assignment.deadlineDate
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-color flex items-center justify-end gap-3 border-t px-4 py-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning || selectedClassIDs.length === 0}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                isAssigning || selectedClassIDs.length === 0
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <span className="loader-white"></span>
                  Assigning...
                </div>
              ) : (
                `Assign to ${selectedClassIDs.length} Class(es)`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignToClassModal;
