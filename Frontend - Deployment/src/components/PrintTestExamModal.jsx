import React, { useState, useEffect } from "react";
import RegisterDropDownSmall from "./registerDropDownSmall";

export default function ExamGenerator({ auth, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState({
    exam_type: "regular",
    total_items: 10,
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
  });
  const [mode, setMode] = useState("default");

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
    setSettings({
      exam_type: "regular",
      total_items: 10,
      easy_percentage: 30,
      moderate_percentage: 50,
      hard_percentage: 20,
    });
    setMode("default");
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

  const handleExamTypeChange = (e) => {
    const value = e.target.value;
    setSettings((prev) => ({ ...prev, exam_type: value }));
    setSelectedSubjects([]);
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

      // Map exam_type to purpose
      const getPurpose = (examType) => {
        switch (examType) {
          case "qualifying":
          case "regular":
            return "examQuestions";
          case "practice":
            return "practiceQuestions";
          case "personal":
            return "personalQuestions";
          default:
            return "examQuestions";
        }
      };

      const requestBody = {
        purpose: getPurpose(settings.exam_type),
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

      // Map exam_type to purpose
      const getPurpose = (examType) => {
        switch (examType) {
          case "qualifying":
          case "regular":
            return "examQuestions";
          case "practice":
            return "practiceQuestions";
          case "personal":
            return "personalQuestions";
          default:
            return "examQuestions";
        }
      };

      const requestBody = {
        purpose: getPurpose(settings.exam_type),
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
      const purpose = getPurpose(settings.exam_type);
      link.download = `exam_${purpose}_${timestamp}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      setShowPreview(false);
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
      <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
        <div
          className={`w-ful relative flex max-h-[90vh] ${selectedSubjects.length > 0 ? "max-w-[900px]" : "max-w-[480px]"} `}
        >
          {/* Main Panel */}
          <div className="w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
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
                <div className="mb-4 text-start">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="mb-[6px] block text-[14px] text-gray-700">
                        Exam Type
                      </span>

                      <RegisterDropDownSmall
                        options={[
                          { label: "Qualifying Exam", value: "qualifying" },
                          { label: "Personal Exam", value: "regular" },
                        ]}
                        value={settings.exam_type}
                        onChange={handleExamTypeChange}
                      />
                      <div className="text-start text-[11px] text-gray-400">
                        Choose whether to print a qualifying exam or a personal
                        exam.
                      </div>
                    </div>

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

                {settings.exam_type !== "personal" && (
                  <div>
                    <span className="mb-2 block text-[14px] text-gray-700">
                      Select Subjects
                    </span>
                    <RegisterDropDownSmall
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
                      { value: "custom", label: "Custom: Must equal to 100%" },
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

                  <div className="mb-5 text-start text-[11px] text-gray-400">
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

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      Total:{" "}
                      {settings.easy_percentage +
                        settings.moderate_percentage +
                        settings.hard_percentage}
                      %
                    </p>
                    <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2.5 rounded-full ${
                          settings.easy_percentage +
                            settings.moderate_percentage +
                            settings.hard_percentage ===
                          100
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${settings.easy_percentage + settings.moderate_percentage + settings.hard_percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${
                      loading
                        ? "cursor-not-allowed bg-indigo-400"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    }`}
                  >
                    {loading ? "Generating..." : "Generate Preview"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Selected Subjects */}
          {settings.exam_type !== "personal" && selectedSubjects.length > 0 && (
            <div className="flex w-[420px] flex-col rounded-t-2xl border-l border-gray-200 bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
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

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Exam Preview
                    </h3>
                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Exam Type: {previewData.purpose}
                          </p>
                          <p className="text-sm font-medium text-gray-700">
                            Total Items: {previewData.totalItems} (Requested:{" "}
                            {previewData.requestedItems})
                          </p>
                        </div>
                        {Object.entries(previewData.questionsBySubject).map(
                          ([subjectName, data]) => (
                            <div key={subjectName} className="border-t pt-4">
                              <h4 className="font-medium text-gray-900">
                                {subjectName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Questions: {data.totalItems}
                              </p>
                              <div className="mt-2 space-y-2">
                                {data.questions.map((question, index) => (
                                  <div
                                    key={index}
                                    className="rounded bg-gray-50 p-3"
                                  >
                                    <p className="text-sm text-gray-700">
                                      {index + 1}. {question.questionText}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      Difficulty: {question.difficulty}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={loading}
                  className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    loading
                      ? "cursor-not-allowed bg-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? "Generating PDF..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
