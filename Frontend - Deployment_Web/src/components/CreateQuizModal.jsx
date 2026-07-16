import React, { useState, useEffect } from "react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const CreateQuestionnaireForm = ({
  onSuccess,
  onCancel,
  subjectID,
  subjectData,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [coverages, setCoverages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    subjectID: subjectID || "",
    semesterID: "",
    coverageID: "",
    examName: "",
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSemesters();
    fetchCoverages();
    if (!subjectID) {
      fetchSubjects();
    } else if (subjectData) {
      // If subjectData is provided, use it directly
      setSubjects([subjectData]);
      setSelectedSubject(subjectData);
    }
  }, [subjectID, subjectData]);

  const fetchSemesters = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiUrl}/semester`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Semesters response:", data); // Debug log
        setSemesters(data.data || []);
      } else {
        console.error("Failed to fetch semesters:", response.status);
        showToast("Error loading semesters", "error");
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      showToast("Error loading semesters", "error");
    }
  };

  const fetchCoverages = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiUrl}/coverages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Coverages response:", data); // Debug log
        setCoverages(data.data || []);
      } else {
        console.error("Failed to fetch coverages:", response.status);
        showToast("Error loading coverages", "error");
      }
    } catch (error) {
      console.error("Error fetching coverages:", error);
      showToast("Error loading coverages", "error");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = sessionStorage.getItem("token");
      // Subject-based personal quiz: only the user's program subjects + GE
      // (faculty/chair). Distinct from /faculty/my-subjects (assigned only).
      const response = await fetch(`${apiUrl}/personal-quizzes/subject-options`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Subjects response:", data); // Debug log
        setSubjects(data.subjects || []);
      } else {
        console.error("Failed to fetch subjects:", response.status);
        showToast("Error loading subjects", "error");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showToast("Error loading subjects", "error");
    }
  };

  const handleSubjectChange = (e) => {
    const subjectID = e.target.value;
    const subject = subjects.find((s) => s.subjectID.toString() === subjectID);
    setSelectedSubject(subject);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      (!selectedSubject && !subjectID) ||
      !formData.semesterID ||
      !formData.coverageID
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");

      // Automatically determine facultySubjectsID and subjectID
      let facultySubjectsID, finalSubjectID;

      if (selectedSubject) {
        // From dropdown selection
        facultySubjectsID = selectedSubject.facultySubjectsID;
        finalSubjectID = selectedSubject.subjectID;
      } else if (subjectData) {
        // From passed subjectData prop
        facultySubjectsID = subjectData.facultySubjectsID;
        finalSubjectID = subjectData.subjectID;
      } else if (subjectID) {
        // If only subjectID is provided, we need to find the facultySubjectsID
        // This should not happen in normal flow, but handle it gracefully
        const subject = subjects.find(
          (s) => s.subjectID.toString() === subjectID.toString(),
        );
        if (subject) {
          facultySubjectsID = subject.facultySubjectsID;
          finalSubjectID = subject.subjectID;
        } else {
          showToast("Subject not found in your assigned subjects", "error");
          setLoading(false);
          return;
        }
      }

      // Prepare the request body - backend will handle the resolution
      const requestBody = {
        facultySubjectsID: facultySubjectsID,
        subjectID: finalSubjectID,
        semesterID: formData.semesterID,
        coverageID: formData.coverageID,
        examName: formData.examName,
      };

      console.log("Submitting questionnaire:", requestBody); // Debug log

      const response = await fetch(
        `${apiUrl}/personal-exam/create-questionnaire`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();
      console.log("Create questionnaire response:", data); // Debug log

      if (response.ok && data.success) {
        showToast("Questionnaire created successfully!", "success");
        onSuccess && onSuccess(data.data);
        // Reset form
        setFormData({
          subjectID: subjectID || "",
          semesterID: "",
          coverageID: "",
          examName: "",
        });
        if (!subjectID) {
          setSelectedSubject(null);
        }
      } else {
        showToast(data.message || "Failed to create questionnaire", "error");
      }
    } catch (error) {
      console.error("Error creating questionnaire:", error);
      showToast("An error occurred while creating the questionnaire", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Create New Questionnaire
          </h2>
          <p className="text-gray-600">
            Create a new questionnaire for your subject
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Selection - Only show if no subjectID provided */}
          {!subjectID && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <select
                value={selectedSubject?.subjectID || ""}
                onChange={handleSubjectChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.facultySubjectsID}
                    value={subject.subjectID}
                  >
                    {subject.subjectCode} - {subject.subjectName}
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {selectedSubject.subjectCode} -{" "}
                  {selectedSubject.subjectName}
                </p>
              )}
            </div>
          )}

          {/* Show selected subject info when subjectID is provided */}
          {subjectID && selectedSubject && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <div className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700">
                {selectedSubject.subjectCode} - {selectedSubject.subjectName}
              </div>
            </div>
          )}

          {/* Semester Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Semester *
            </label>
            <select
              name="semesterID"
              value={formData.semesterID}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Select semester...</option>
              {semesters.map((semester) => (
                <option key={semester.semesterID} value={semester.semesterID}>
                  {semester.semesterDescription}
                </option>
              ))}
            </select>
            {semesters.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                No semesters available
              </p>
            )}
          </div>

          {/* Coverage Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Coverage *
            </label>
            <select
              name="coverageID"
              value={formData.coverageID}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Select coverage...</option>
              {coverages.map((coverage) => (
                <option key={coverage.id} value={coverage.id}>
                  {coverage.name}
                </option>
              ))}
            </select>
            {coverages.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                No coverages available
              </p>
            )}
          </div>

          {/* Exam Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Exam Name (Optional)
            </label>
            <input
              type="text"
              name="examName"
              value={formData.examName}
              onChange={handleInputChange}
              placeholder="Enter exam name..."
              maxLength={150}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.examName.length}/150 characters
            </p>
          </div>

          {/* Debug Information */}
          <div className="rounded-md bg-gray-100 p-4 text-xs">
            <h4 className="mb-2 font-semibold">Debug Info:</h4>
            <p>Semesters loaded: {semesters.length}</p>
            <p>Coverages loaded: {coverages.length}</p>
            <p>Subjects loaded: {subjects.length}</p>
            <p>SubjectID prop: {subjectID || "None"}</p>
            <p>
              Selected subject:{" "}
              {selectedSubject
                ? `${selectedSubject.subjectCode} - ${selectedSubject.subjectName}`
                : "None"}
            </p>
            <p>
              FacultySubjectsID:{" "}
              {selectedSubject?.facultySubjectsID ||
                subjectData?.facultySubjectsID ||
                "None"}
            </p>
            <p>SubjectData available: {subjectData ? "Yes" : "No"}</p>
            {subjectData && (
              <p>
                SubjectData FacultySubjectsID:{" "}
                {subjectData.facultySubjectsID || "Missing"}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!selectedSubject && !subjectID)}
              className="rounded-md border border-transparent bg-orange-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="mr-3 -ml-1 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                "Create Questionnaire"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateQuestionnaireForm;
