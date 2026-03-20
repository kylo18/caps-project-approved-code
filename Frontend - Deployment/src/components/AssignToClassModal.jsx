import { useState, useEffect } from "react";
import useToast from "../hooks/useToast";
import Toast from "./Toast";
import { getApiBaseUrl } from "../utils/config";

const AssignToClassModal = ({
  isOpen,
  onClose,
  personalQuizID,
  quizTitle,
  onSuccess,
  // New optional "picker" mode: only choose classes, no API call
  selectionOnly = false,
  initialSelectedClassIDs = [],
  onSelectionConfirm,
}) => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClassIDs, setSelectedClassIDs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast, showToast } = useToast();
  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    if (isOpen && personalQuizID) {
      fetchClasses();
      // Reset form when modal opens
      if (selectionOnly) {
        setSelectedClassIDs(initialSelectedClassIDs || []);
      } else {
        setSelectedClassIDs([]);
      }
    }
  }, [isOpen, personalQuizID, selectionOnly, initialSelectedClassIDs]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
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
        },
      );

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        localStorage.removeItem("token");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch classes. Please try again.",
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
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassToggle = (classID) => {
    setSelectedClassIDs((prev) => {
      if (prev.includes(classID)) {
        return prev.filter((id) => id !== classID);
      }
      // In selectionOnly mode, only one class (for settings); otherwise allow multiple
      if (selectionOnly) {
        return [classID];
      }
      return [...prev, classID];
    });
  };

  const handleSelectAll = () => {
    if (selectionOnly) return;
    const unassignedClasses = classes.filter((cls) => !cls.isAssigned);
    if (selectedClassIDs.length === unassignedClasses.length) {
      setSelectedClassIDs([]);
    } else {
      setSelectedClassIDs(unassignedClasses.map((cls) => cls.classID));
    }
  };

  const handleAssign = async () => {
    if (selectedClassIDs.length === 0) {
      showToast("Please select at least one class.", "error");
      return;
    }

    // In selection-only mode, just bubble the selection up and close
    if (selectionOnly) {
      const selectedClasses = classes
        .filter((cls) => selectedClassIDs.includes(cls.classID))
        .map((c) => ({
          ...c,
          classPersonalQuizID: c.assignment?.classPersonalQuizID ?? null,
        }));
      if (onSelectionConfirm) {
        onSelectionConfirm({
          classIDs: selectedClassIDs,
          classes: selectedClasses,
        });
      }
      onClose();
      return;
    }

    setIsAssigning(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsAssigning(false);
        return;
      }

      const payload = {
        classIDs: selectedClassIDs,
      };

      const response = await fetch(
        `${apiUrl}/personal-quizzes/${personalQuizID}/assign-classes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        localStorage.removeItem("token");
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
          errorData.message || "Failed to assign quiz to classes.",
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
        "error",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  const unassignedClasses = classes.filter((cls) => !cls.isAssigned);
  const allUnassignedSelected =
    !selectionOnly &&
    unassignedClasses.length > 0 &&
    selectedClassIDs.length === unassignedClasses.length;

  const filteredClasses = classes.filter((cls) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const subjectCode = cls.subject?.subjectCode || "";
    const subjectName = cls.subject?.subjectName || "";
    return (
      cls.className?.toLowerCase().includes(term) ||
      subjectCode.toLowerCase().includes(term) ||
      subjectName.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="lightbox-bg outfit-400 bg-opacity-40 fixed inset-0 z-100 flex items-center justify-center bg-black">
        <div className="relative mx-2 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                <i className="bx bx-note text-2xl"></i>
              </div>
              <div>
                <h2 className="outfit-700 text-[16px] text-gray-900">
                  Assign Quiz to Classes
                </h2>
                <p className="text-xs text-gray-500">
                  Select the classes you want to assign{" "}
                  <span className="font-medium text-gray-700">
                    {quizTitle || "Untitled Quiz"}
                  </span>{" "}
                  to.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Close"
            >
              <i className="bx bx-x text-xl"></i>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <i className="bx bx-search text-lg"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by class name or subject..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-800 placeholder-gray-400 ring-0 transition outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="loader"></div>
                <span className="ml-3 text-sm text-gray-600">
                  Loading classes...
                </span>
              </div>
            ) : classes.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No classes available. Please create a class first.
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No classes match your search.
              </div>
            ) : (
              <>
                {/* List Header */}
                <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  <span>Your Classes</span>
                  {!selectionOnly && unassignedClasses.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className="text-[11px] font-semibold tracking-wide text-orange-500 uppercase hover:text-orange-600"
                    >
                      {allUnassignedSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {/* Classes List */}
                <div className="space-y-2">
                  {filteredClasses.map((classItem) => {
                    const isSelected = selectedClassIDs.includes(
                      classItem.classID,
                    );
                    const isAssigned = classItem.isAssigned;
                    const canSelect = selectionOnly || !isAssigned;

                    return (
                      <div
                        key={classItem.classID}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 transition ${
                          isSelected
                            ? "border-orange-500 bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-1 items-start gap-3">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleClassToggle(classItem.classID)
                              }
                              disabled={isAssigned && !selectionOnly}
                              className={`mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500 ${
                                isAssigned && !selectionOnly
                                  ? "cursor-not-allowed opacity-60"
                                  : ""
                              }`}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-sm font-semibold ${
                                  isAssigned && !selectionOnly
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                }`}
                              >
                                {classItem.className}
                              </h3>
                            </div>
                            <p
                              className={`mt-1 text-xs ${
                                isAssigned && !selectionOnly
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {classItem.subject
                                ? `${classItem.subject.subjectCode} - ${classItem.subject.subjectName}`
                                : classItem.classCode}
                            </p>
                          </div>
                        </div>
                        {isAssigned && (
                          <span className="ml-3 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-green-600 uppercase">
                            Already Assigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-xs text-gray-500">
              {selectedClassIDs.length} class
              {selectedClassIDs.length === 1 ? "" : "es"} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  selectedClassIDs.length === 0 ||
                  (!selectionOnly && isAssigning)
                }
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  selectedClassIDs.length === 0 ||
                  (!selectionOnly && isAssigning)
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isAssigning ? (
                  <div className="flex items-center gap-2">
                    <span className="loader-white"></span>
                    Assigning...
                  </div>
                ) : (
                  "Assign Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignToClassModal;
