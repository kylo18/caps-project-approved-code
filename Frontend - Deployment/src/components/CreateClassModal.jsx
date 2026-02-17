import React, { useState, useEffect } from "react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const CreateClassModal = ({ isOpen, onClose, onSuccess }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [formData, setFormData] = useState({
    className: "",
    subjectID: "",
    description: "",
    schedule: "",
    isActive: true,
  });

  // Fetch subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    setIsSubjectsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setIsSubjectsLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/subjects/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        // If 401, token might be expired or invalid
        if (response.status === 401) {
          sessionStorage.removeItem("token");
          showToast("Your session has expired. Please log in again.", "error");
          setIsSubjectsLoading(false);
          return;
        }

        // Try to get error message from response
        let errorMessage = "Failed to load subjects.";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message || errorData?.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use status text
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
        console.error("Unexpected subjects data format:", data);
        showToast("Invalid response format.", "error");
        setIsSubjectsLoading(false);
        return;
      }

      // Sort subjects similar to Libraries.jsx pattern
      const sortedSubjects = [...data.subjects].sort((a, b) => {
        // First sort by program name
        const programCompare = (a.programName || "").localeCompare(
          b.programName || "",
        );
        if (programCompare !== 0) return programCompare;

        // If programs are the same, sort by subject code
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.className.trim()) {
      showToast("Class name is required", "error");
      return;
    }

    if (!formData.subjectID) {
      showToast("Please select a subject", "error");
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/classes`, {
        method: "POST",
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
        sessionStorage.removeItem("token");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors)
            .flat()
            .join(", ");
          showToast(
            data.message || errorMessages || "Validation failed",
            "error"
          );
        } else {
          showToast(
            data.message || "Failed to create class. Please try again.",
            "error"
          );
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        showToast(data.message || "Class created successfully!", "success");
        // Reset form
        setFormData({
          className: "",
          subjectID: "",
          description: "",
          schedule: "",
          isActive: true,
        });
        // Call onSuccess callback to refresh the class list
        if (onSuccess) {
          onSuccess(data.class);
        }
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        showToast(
          data.message || "Failed to create class. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating class:", error);
      showToast("An error occurred while creating the class.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setFormData({
        className: "",
        subjectID: "",
        description: "",
        schedule: "",
        isActive: true,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="lightbox-bg fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-40">
        <div
          className="absolute inset-0 z-0"
          onClick={handleCancel}
          style={{ background: "transparent" }}
        />
        <div className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">Create New Class</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a new class for your subject
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-4">
              {/* Class Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  placeholder="Enter class name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              {/* Subject Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectID"
                  value={formData.subjectID}
                  onChange={handleInputChange}
                  required
                  disabled={isSubjectsLoading || subjects.length === 0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isSubjectsLoading
                      ? "Loading subjects..."
                      : subjects.length === 0
                        ? "No subjects available"
                        : "Select a subject"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.subjectID} value={subject.subjectID}>
                      {subject.subjectCode} - {subject.subjectName} (
                      {subject.programName}, {subject.yearLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter class description (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none resize-none"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="Enter class schedule (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (Class will be immediately available)
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="outfit inline-flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="outfit inline-flex cursor-pointer items-center rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateClassModal;
