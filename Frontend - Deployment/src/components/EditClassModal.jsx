import React, { useState, useEffect, useMemo } from "react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { getApiBaseUrl } from "../utils/config";

// Program colors + icons for the grid cards (matching Libraries.jsx)
const PROGRAM_COLORS = [
  { bg: "#fff3e0", icon: "#f57c00", iconClass: "bxs-sapling" },
  { bg: "#e8f5e9", icon: "#388e3c", iconClass: "bx-city" },
  { bg: "#e3f2fd", icon: "#1976d2", iconClass: "bx-code-alt" },
  { bg: "#fce4ec", icon: "#c2185b", iconClass: "bx-broadcast" },
  { bg: "#f3e5f5", icon: "#7b1fa2", iconClass: "bx-bolt" },
  { bg: "#e0f7fa", icon: "#0097a7", iconClass: "bx-globe" },
  { bg: "#fff8e1", icon: "#fbc02d", iconClass: "bx-briefcase" },
  { bg: "#efebe9", icon: "#5d4037", iconClass: "bx-leaf" },
];

const PROGRAM_NAME_MAP = {
  ECE: "Electronics and Communication Engineering",
  CpE: "Computer Engineering",
  CE: "Civil Engineering",
  EE: "Electrical Engineering",
  ABE: "Agricultural and Biosystems Engineering",
  ME: "Mechanical Engineering",
  IE: "Industrial Engineering",
  ChE: "Chemical Engineering",
  AE: "Aerospace Engineering",
  GE: "General Subject",
  MET: "Mining Engineering Technology",
};

function getProgramDisplayName(rawName) {
  const trimmed = (rawName || "").trim();
  return PROGRAM_NAME_MAP[trimmed] || trimmed;
}

function ProgramSubjectSelector({
  subjects,
  isSubjectsLoading,
  value,
  onChange,
}) {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  const programMap = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      const key = s.programName || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [subjects]);

  const programs = Object.keys(programMap);

  const programSubjects = selectedProgram
    ? programMap[selectedProgram] || []
    : [];
  const filteredSubjects = subjectSearch.trim()
    ? programSubjects.filter(
        (s) =>
          s.subjectName?.toLowerCase().includes(subjectSearch.toLowerCase()) ||
          s.subjectCode?.toLowerCase().includes(subjectSearch.toLowerCase()),
      )
    : programSubjects;

  // Auto-open program if there's a pre-selected subject
  useEffect(() => {
    if (value && !selectedProgram) {
      const found = subjects.find((s) => String(s.subjectID) === String(value));
      if (found?.programName) {
        setSelectedProgram(found.programName);
      }
    }
  }, [value, subjects]);

  if (isSubjectsLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="loader mx-auto"></div>
      </div>
    );
  }

  if (selectedProgram) {
    return (
      <div className="space-y-3">
        {/* Back + program name */}
        <button
          type="button"
          onClick={() => {
            setSelectedProgram(null);
            setSubjectSearch("");
          }}
          className="flex items-center gap-1.5 text-[13px] font-medium text-orange-500 hover:text-orange-600"
        >
          <i className="bx bx-chevron-left text-lg"></i>
          {getProgramDisplayName(selectedProgram)}
        </button>

        {/* Subject search */}
        <div className="relative">
          <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full rounded-xl border border-gray-200 py-2 pr-3 pl-9 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
        </div>

        {/* Subject list */}
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {filteredSubjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No subjects found.
            </p>
          ) : (
            filteredSubjects.map((s) => {
              const selected = String(value) === String(s.subjectID);
              return (
                <button
                  key={s.subjectID}
                  type="button"
                  onClick={() => onChange(String(s.subjectID))}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      selected
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <i className="bx bx-check text-[12px] text-white"></i>
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">
                      {s.subjectName}
                    </p>
                    <p className="text-[12px] text-gray-500">
                      {s.subjectCode}
                      {s.yearLevel ? ` · ${s.yearLevel}` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Program grid
  return (
    <div className="space-y-3">
      {programs.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          No programs available.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {programs.map((prog, idx) => {
            const color = PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
            const count = programMap[prog].length;
            return (
              <button
                key={prog}
                type="button"
                onClick={() => setSelectedProgram(prog)}
                className="flex cursor-pointer flex-col items-start rounded-2xl border border-gray-200 p-4 text-left transition-all hover:border-orange-400 hover:shadow-sm active:scale-95"
              >
                <div
                  className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: color.bg }}
                >
                  <i
                    className={`bx ${color.iconClass} text-lg`}
                    style={{ color: color.icon }}
                  ></i>
                </div>
                <p className="outfit-600 line-clamp-2 text-[12px] leading-tight font-semibold text-gray-800">
                  {getProgramDisplayName(prog)}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {count} subject{count !== 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EditClassModal = ({ isOpen, onClose, onSuccess, classData }) => {
  const apiUrl = getApiBaseUrl();
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    subjectID: "",
    description: "",
    schedule: "",
    isActive: true,
  });

  const totalSteps = 2;

  // Initialize form and reset step when modal opens
  useEffect(() => {
    if (isOpen && classData) {
      setFormData({
        className: classData.className || "",
        subjectID: classData.subjectID || classData.subject?.subjectID || "",
        description: classData.description || "",
        schedule: classData.schedule || "",
        isActive: classData.isActive !== undefined ? classData.isActive : true,
      });
      setCurrentStep(1);
      setError(null);
      fetchSubjects();
    }
  }, [isOpen, classData]);

  const fetchSubjects = async () => {
    setIsSubjectsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsSubjectsLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/subjects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          showToast("Your session has expired. Please log in again.", "error");
          setIsSubjectsLoading(false);
          return;
        }

        let errorMessage = "Failed to load subjects.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          errorMessage = `HTTP error! Status: ${response.status}`;
        }
        showToast(errorMessage, "error");
        setIsSubjectsLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        showToast(data.message || "Failed to fetch subjects", "error");
        setIsSubjectsLoading(false);
        return;
      }

      if (!Array.isArray(data.subjects)) {
        showToast("Invalid response format.", "error");
        setIsSubjectsLoading(false);
        return;
      }

      const sortedSubjects = [...data.subjects].sort((a, b) => {
        const programCompare = (a.programName || "").localeCompare(
          b.programName || "",
        );
        if (programCompare !== 0) return programCompare;
        return (a.subjectCode || "").localeCompare(b.subjectCode || "");
      });

      setSubjects(sortedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showToast("Failed to load subjects. Please try again.", "error");
    } finally {
      setIsSubjectsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.className.trim()) {
        setError("Class name is required.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.subjectID) {
        setError("Please select a subject.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    if (!validateStep(1) || !validateStep(2)) return;

    const classID = classData?.classID || classData?.id;
    if (!classID) {
      showToast("Class ID is missing", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/classes/update/${classID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          className: formData.className.trim(),
          subjectID: Number(formData.subjectID),
          description: formData.description.trim() || null,
          schedule: formData.schedule.trim() || null,
          isActive: formData.isActive,
        }),
      });

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          showToast(
            data.message || errorMessages || "Validation failed",
            "error",
          );
        } else if (response.status === 404) {
          showToast(data.message || "Class not found", "error");
        } else {
          showToast(
            data.message || "Failed to update class. Please try again.",
            "error",
          );
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        showToast(data.message || "Class updated successfully!", "success");
        if (onSuccess) {
          onSuccess(data.class);
        }
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        showToast(
          data.message || "Failed to update class. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating class:", error);
      showToast("An error occurred while updating the class.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setCurrentStep(1);
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div
        className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        <div
          className="animate-fade-in-up relative mx-auto flex w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ minHeight: "480px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="outfit-400 flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="outfit-600 text-[22px] font-bold text-gray-900">
                  {currentStep === 1 ? "Edit Class Details" : "Change Subject"}
                </h2>
                <p className="mt-0.5 text-[13px] text-gray-500">
                  {currentStep === 1
                    ? "Update the details for this class."
                    : "Choose a program, then pick the subject for this class."}
                </p>

                {/* Simple dot indicator */}
                <div className="mt-3 flex items-center gap-1.5">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === currentStep
                          ? "w-6 bg-orange-500"
                          : s < currentStep
                            ? "w-3 bg-orange-300"
                            : "w-3 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="ml-4 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="outfit-400 flex-1 overflow-y-auto px-6 py-5">
              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                  <i className="bx bx-error-circle text-base"></i>
                  {error}
                </div>
              )}

              <form id="class-edit-form" onSubmit={handleSubmit}>
                {/* ── Step 1: Class Name + Description + Schedule ── */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    {/* Class Name */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        Class Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="bx bx-edit-alt absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                        <input
                          type="text"
                          name="className"
                          value={formData.className}
                          onChange={handleInputChange}
                          maxLength={255}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                          placeholder="e.g. Data Structures and Algorithms"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        Description{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        maxLength={500}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                        placeholder="Summarize what this class is about."
                      />
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formData.description.length} / 500 characters
                      </p>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        Schedule{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <div className="relative">
                        <i className="bx bx-clock-9 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                        <input
                          type="text"
                          name="schedule"
                          value={formData.schedule}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                          placeholder="e.g. M/W 10:00 AM – 11:30 AM"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Subject Picker ── */}
                {currentStep === 2 && (
                  <ProgramSubjectSelector
                    subjects={subjects}
                    isSubjectsLoading={isSubjectsLoading}
                    value={formData.subjectID}
                    onChange={(subjectID) =>
                      setFormData((prev) => ({ ...prev, subjectID }))
                    }
                  />
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="outfit-400 flex items-center justify-between border-t border-gray-100 px-6 py-4">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="cursor-pointer text-[14px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  <i className="bx bx-arrow-left-stroke text-base"></i>
                  Previous
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="outfit-500 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                >
                  Next Step
                  <i className="bx bx-arrow-right-stroke text-lg"></i>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="outfit-500 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <i className="bx bx-loader-alt animate-spin text-lg"></i>
                      Saving...
                    </>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditClassModal;
