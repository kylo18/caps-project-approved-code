import React, { useState, useEffect } from "react";
import SubjectSearchInput from "./SubjectSearchInput";
import ExamPreviewModal from "./ExamPreviewModal";
import RegisterDropDownSmall from "./registerDropDownSmall";

export default function ExamGenerator({ auth, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState("default");
  const [settings, setSettings] = useState({
    total_items: 10,
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleClose = () => {
    // Reset all state
    setSelectedSubjects([]);
    setPreviewData(null);
    setShowPreview(false);
    setError("");
    setMode("default");
    setSettings({
      total_items: 10,
      easy_percentage: 30,
      moderate_percentage: 50,
      hard_percentage: 20,
    });
    onClose();
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${apiUrl}/subjects`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (err) {
      setError("Failed to load subjects");
    }
  };

  const handleSubjectAdd = (e) => {
    const subjectID = parseInt(e.target.value);
    const subject = subjects.find((s) => s.subjectID === subjectID);
    if (!subject) return;

    if (!selectedSubjects.find((s) => s.subjectID === subject.subjectID)) {
      const defaultPercentage = Math.floor(100 / (selectedSubjects.length + 1));
      setSelectedSubjects((prev) => [
        ...prev.map((s) => ({ ...s, percentage: defaultPercentage })),
        { ...subject, percentage: defaultPercentage },
      ]);
    }
  };

  const handleSubjectPercentageChange = (subjectID, value) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subjectID === subjectID
          ? { ...s, percentage: parseInt(value) || 0 }
          : s,
      ),
    );
  };

  const handleRemoveSubject = (subjectID) => {
    setSelectedSubjects((prev) => {
      const remaining = prev.filter((s) => s.subjectID !== subjectID);
      if (remaining.length > 0) {
        const newPercentage = Math.floor(100 / remaining.length);
        return remaining.map((s) => ({ ...s, percentage: newPercentage }));
      }
      return remaining;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate difficulty percentages
    const totalDifficulty =
      settings.easy_percentage +
      settings.moderate_percentage +
      settings.hard_percentage;
    if (totalDifficulty !== 100) {
      setError("Difficulty percentages must sum to 100%");
      setLoading(false);
      return;
    }

    // Validate subject selection
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      setLoading(false);
      return;
    }

    // Validate subject percentages
    const totalSubjectPercentage = selectedSubjects.reduce(
      (sum, subject) => sum + subject.percentage,
      0,
    );
    if (totalSubjectPercentage !== 100) {
      setError("Subject percentages must sum to 100%");
      setLoading(false);
      return;
    }

    try {
      const endpoint = `${apiUrl}/generate-multi-subject-exam`;

      const requestBody = {
        total_items: settings.total_items,
        subjects: selectedSubjects.map((subject) => ({
          subjectID: subject.subjectID,
          percentage: subject.percentage,
        })),
        difficulty_distribution: {
          easy: settings.easy_percentage,
          moderate: settings.moderate_percentage,
          hard: settings.hard_percentage,
        },
        preview: true,
      };

      console.log("Sending request:", requestBody);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate exam preview");
      }

      const data = await response.json();
      console.log("Received response:", data);
      setPreviewData(data);
      setShowPreview(true);
    } catch (err) {
      console.error("Error generating exam:", err);
      setError(err.message || "An error occurred while generating the exam");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const endpoint = `${apiUrl}/generate-multi-subject-exam`;

      const requestBody = {
        total_items: settings.total_items,
        subjects: selectedSubjects.map((subject) => ({
          subjectID: subject.subjectID,
          percentage: subject.percentage,
        })),
        difficulty_distribution: {
          easy: settings.easy_percentage,
          moderate: settings.moderate_percentage,
          hard: settings.hard_percentage,
        },
        preview: false,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate exam");
      }

      // Check the content type of the response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        // If we received JSON instead of a PDF, it's probably an error
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Create a more descriptive filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `exam_${timestamp}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      setShowPreview(false);
      handleClose(); // Close the form after successful download
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "An error occurred while downloading the exam");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Form Modal */}
      {!showPreview && (
        <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
          <div
            className={`relative flex max-h-[90vh] w-full ${selectedSubjects.length > 0 ? "max-w-[900px]" : "max-w-[480px]"} mx-auto min-[448px]:px-4`}
          >
            {/* Main Panel */}
            <div className="w-full max-w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md md:w-[480px]">
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  Print Exam
                </h2>

                <button
                  onClick={handleClose}
                  className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                  title="Close"
                >
                  <i className="bx bx-x text-[20px]"></i>
                </button>
              </div>
              <div className="edit-profile-modal-scrollbar max-h-[calc(90vh-60px)] overflow-y-auto">
                <form className="px-5 py-4" onSubmit={handleSubmit}>
                  {settings.exam_type !== "personal" && (
                    <div>
                      <span className="mb-2 block text-[14px] text-gray-700">
                        Select Subjects
                      </span>
                      <SubjectSearchInput
                        options={subjects
                          .filter(
                            (subject) =>
                              !selectedSubjects.find(
                                (s) => s.subjectID === subject.subjectID,
                              ),
                          )
                          .map((subject) => ({
                            label: subject.subjectName,
                            value: subject.subjectID,
                          }))}
                        onChange={handleSubjectAdd}
                        placeholder="Search for a subject"
                      />
                    </div>
                  )}

                  <div className="mt-2 mb-3 text-start">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="mb-[6px] block text-[14px] text-gray-700">
                          Total Items
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.total_items}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              total_items: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="peer w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        />
                        <div className="mt-2 text-start text-[11px] text-gray-400">
                          Choose the total number of items to include.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                  <div>
                    <span className="mt-2 mb-2 block text-[14px] text-gray-700">
                      Difficulty Distribution
                    </span>
                    <RegisterDropDownSmall
                      options={[
                        {
                          value: "default",
                          label: "Default: Easy 30%, Moderate 50%, Hard 20%",
                        },
                        {
                          value: "custom",
                          label: "Custom: Must equal to 100%",
                        },
                      ]}
                      value={mode}
                      onChange={(e) => {
                        const selectedMode = e.target.value;
                        setMode(selectedMode);

                        if (selectedMode === "default") {
                          setSettings((prev) => ({
                            ...prev,
                            easy_percentage: 30,
                            moderate_percentage: 50,
                            hard_percentage: 20,
                          }));
                        }
                      }}
                    />

                    <div className="mb-3 text-start text-[11px] text-gray-400">
                      Choose how to distribute question difficulty. You can use
                      the default settings or customize the number of easy,
                      moderate, and hard questions of the selected subjects.
                    </div>

                    {mode === "custom" && (
                      <div className="grid grid-cols-3 gap-4">
                        {["easy", "moderate", "hard"].map((level) => (
                          <div key={level}>
                            <span className="mb-2 block text-[12px] text-gray-700 capitalize">
                              {level} (%)
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={settings[`${level}_percentage`]}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  [`${level}_percentage`]:
                                    parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                  {error && (
                    <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                      {error}
                    </div>
                  )}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${loading ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        </div>
                      ) : (
                        "Generate Exam"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Panel - Selected Subjects */}
            {settings.exam_type !== "personal" &&
              selectedSubjects.length > 0 && (
                <div className="hidden w-full flex-col rounded-t-2xl border-l border-gray-200 bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md md:flex md:w-[420px]">
                  <div className="border-color flex-shrink-0 border-b py-2 pl-4">
                    <h3 className="text-[14px] font-medium text-gray-700">
                      Selected Subjects
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Subject
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Percentage
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {selectedSubjects.map((subject) => (
                              <tr key={subject.subjectID}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {subject.subjectName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={subject.percentage}
                                    onChange={(e) =>
                                      handleSubjectPercentageChange(
                                        subject.subjectID,
                                        e.target.value,
                                      )
                                    }
                                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSubject(subject.subjectID)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ExamPreviewModal
          previewData={previewData}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          loading={loading}
        />
      )}
    </>
  );
}
