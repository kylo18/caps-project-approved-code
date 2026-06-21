import React, { useState, useEffect } from "react";
import { clearAuth, isAuthenticated } from "../utils/authStorage";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const CreateClassModal = ({ isOpen, onClose, onSuccess }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    description: "",
    schedule: "",
    isActive: true,
  });

  // Reset step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.className.trim()) {
      setError("Class name is required.");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      className: "",
      description: "",
      schedule: "",
      isActive: true,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!isAuthenticated()) {
        showToast("You are not authenticated. Please log in again.", "error");
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/classes`, {
          credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: formData.className.trim(),
          description: formData.description.trim() || null,
          schedule: formData.schedule.trim() || null,
          isActive: formData.isActive,
        }),
      });

      if (response.status === 401) {
        showToast("You are not authenticated. Please log in again.", "error");
        clearAuth();
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
        } else {
          showToast(
            data.message || "Failed to create class. Please try again.",
            "error",
          );
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        showToast(data.message || "Class created successfully!", "success");
        resetForm();
        if (onSuccess) {
          onSuccess(data.class);
        }
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        showToast(
          data.message || "Failed to create class. Please try again.",
          "error",
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
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

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
          {/* Single panel — no left sidebar */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="outfit-400 flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <i className="bx bx-pen-plus text-2xl" />
                </div>
                <div>
                  <h2 className="outfit-700 text-[16px] text-gray-900">
                    Create a Class
                  </h2>
                  <p className="text-xs text-gray-500">
                    Create a new class to organize your students.
                  </p>
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

              <form id="class-create-form" onSubmit={handleSubmit}>
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
                        maxLength={50}
                        className="w-full rounded-xl border border-gray-200 py-2.5 pr-3 pl-9 text-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                        placeholder="e.g. Data Structures and Algorithms"
                        required
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Give your class a clear and descriptive name.
                    </p>
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
              </form>
            </div>

            {/* Footer */}
            <div className="outfit-400 flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="cursor-pointer text-[14px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="outfit-500 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <i className="bx bx-loader-alt animate-spin text-lg"></i>
                    Creating...
                  </>
                ) : (
                  <>Create Class</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateClassModal;
