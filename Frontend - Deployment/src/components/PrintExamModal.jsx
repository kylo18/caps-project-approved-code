import React, { useState, useEffect } from "react";
import SubjectSearchInput from "./SubjectSearchInput";
import ExamPreviewModal from "./ExamPreviewModal";
import RegisterDropDownSmall from "./registerDropDownSmall";
import { Tooltip } from "flowbite-react";
import ConfirmModal from "./confirmModal";

export default function ExamGenerator({ auth, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState("default");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
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
    if (loading) {
      setShowConfirmClose(true);
      return;
    }
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

  const handleConfirmClose = () => {
    setLoading(false);
    setShowConfirmClose(false);
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
      const basePercentage = Math.floor(100 / (selectedSubjects.length + 1));
      const remainder = 100 - basePercentage * (selectedSubjects.length + 1);

      setSelectedSubjects((prev) => [
        ...prev.map((s, index) => ({
          ...s,
          percentage: index === 0 ? basePercentage + remainder : basePercentage,
        })),
        { ...subject, percentage: basePercentage },
      ]);
    }
  };

  const handleSubjectPercentageChange = (subjectID, value) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subjectID === subjectID
          ? { ...s, percentage: value === "" ? "" : parseInt(value) || 0 }
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

    // Validate total items
    if (!settings.total_items || settings.total_items === "") {
      setError("Please enter the total number of items");
      setLoading(false);
      return;
    }

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
        purpose: "examQuestions",
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
        if (errorData.message?.toLowerCase().includes("insufficient")) {
          throw new Error(
            "Insufficient questions available for the selected criteria. Please try reducing the number of items or adjusting the difficulty distribution.",
          );
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Failed to generate exam preview",
        );
      }

      const data = await response.json();
      setPreviewData(data.previewData);
      setPreviewKey(data.previewKey);
      setShowPreview(true);
    } catch (err) {
      console.error("Error generating exam:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const endpoint = `${apiUrl}/generate-multi-subject-exam`;
      console.log("Starting PDF generation request:", {
        endpoint,
        settings,
        selectedSubjects,
        previewKey,
      });

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
        purpose: "examQuestions",
        previewKey: previewKey,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Initial response from server:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        console.error("PDF generation request failed:", {
          status: response.status,
          statusText: response.statusText,
          error: data,
          requestBody,
        });
        throw new Error(
          data.message || data.error || "Failed to generate exam",
        );
      }

      // Start polling for status
      const pollStatus = async (jobId) => {
        try {
          console.log("Polling status for job:", { jobId });
          const statusResponse = await fetch(
            `${apiUrl}/print/check-status/${jobId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          const statusData = await statusResponse.json();
          console.log("Status check response:", {
            jobId,
            status: statusResponse.status,
            data: statusData,
          });

          if (!statusResponse.ok) {
            console.error("Status check failed:", {
              jobId,
              status: statusResponse.status,
              statusText: statusResponse.statusText,
              error: statusData,
            });
            throw new Error(statusData.message || "Failed to check status");
          }

          if (statusData.status === "completed" && statusData.downloadUrl) {
            console.log("PDF generation completed:", {
              jobId,
              downloadUrl: statusData.downloadUrl,
            });
            // Download the PDF
            window.location.href = statusData.downloadUrl;
            setShowPreview(false);
            onClose();
            return;
          } else if (statusData.status === "error") {
            console.error("PDF generation failed:", {
              jobId,
              error: statusData.error,
              status: statusData.status,
            });
            throw new Error(statusData.error || "PDF generation failed");
          } else {
            console.log("Continuing to poll:", {
              jobId,
              status: statusData.status,
              nextPollIn: "2 seconds",
            });
            // Continue polling
            setTimeout(() => pollStatus(jobId), 2000); // Poll every 2 seconds
          }
        } catch (error) {
          console.error("Status check error:", {
            jobId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
          setError(error.message);
          setLoading(false);
        }
      };

      // Start polling with the job ID
      console.log("Starting status polling for job:", { jobId: data.jobId });
      pollStatus(data.jobId);
    } catch (err) {
      console.error("Download error:", {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        settings,
        selectedSubjects,
      });
      setError(err.message);
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
            className={`relative flex w-full ${selectedSubjects.length > 0 ? "mx-0 max-w-[1280px]" : "max-w-lg"} mx-auto min-[448px]:mx-2 ${selectedSubjects.length === 0 ? "justify-center" : "justify-center"}`}
          >
            {/* Main Panel */}
            <div
              className={`relative w-full min-[448px]:mx-2 ${selectedSubjects.length === 0 ? "md:w-[1280px]" : "max-w-lg"} rounded-t-2xl bg-white shadow-2xl min-[448px]:rounded-md`}
            >
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
              <div className="edit-profile-modal-scrollbar max-h-[calc(100vh-80px)] overflow-y-auto">
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
                          .sort((a, b) => {
                            // First group by year level
                            const yearA = parseInt(a.yearLevel);
                            const yearB = parseInt(b.yearLevel);
                            if (yearA !== yearB) {
                              return yearA - yearB;
                            }
                            // Then sort alphabetically by subject name within each year
                            return a.subjectName.localeCompare(b.subjectName);
                          })
                          .map((subject) => ({
                            label: `${subject.subjectName}`,
                            value: subject.subjectID,
                            subjectCode: subject.subjectCode,
                            yearLevel: subject.yearLevel,
                          }))}
                        onChange={handleSubjectAdd}
                        placeholder="Search for a subject"
                      />
                    </div>
                  )}

                  {/* Mobile Selected Subjects Section */}
                  {settings.exam_type !== "personal" &&
                    selectedSubjects.length > 0 && (
                      <>
                        <div className="mt-3 md:hidden">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-[14px] font-medium text-gray-700">
                                Selected Subjects
                              </h3>
                              <span className="mr-3 text-[12px] text-gray-500">
                                Percentage (%)
                              </span>
                            </div>
                            <div className="max-h-[200px] space-y-1 overflow-y-auto">
                              {selectedSubjects.map((subject) => (
                                <div
                                  key={subject.subjectID}
                                  className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="max-w-[160px] truncate text-[12px] min-[415px]:max-w-[200px] lg:max-w-[240px]">
                                      {subject.subjectCode} -{" "}
                                      {subject.subjectName}
                                    </div>
                                    {subject.subjectName.length > 15 && (
                                      <Tooltip
                                        content={subject.subjectName}
                                        placement="right"
                                        className="z-50"
                                      >
                                        <button
                                          type="button"
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <i className="bx bx-show text-[16px]"></i>
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={subject.percentage}
                                      onChange={(e) =>
                                        handleSubjectPercentageChange(
                                          subject.subjectID,
                                          e.target.value === ""
                                            ? ""
                                            : parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-[60px] rounded-lg border border-gray-300 px-[9px] py-[5px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveSubject(subject.subjectID)
                                      }
                                      className="flex h-[25px] cursor-pointer items-center justify-center rounded-full px-1 py-[1px] text-red-600 hover:bg-red-50"
                                    >
                                      <i className="bx bx-x text-[18px]"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                      </>
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
                              total_items:
                                e.target.value === ""
                                  ? ""
                                  : parseInt(e.target.value) || 0,
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
                    <div className="flex items-center gap-2">
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
                    </div>

                    <div className="mb-3 text-start text-[11px] text-gray-400">
                      Choose how to distribute question difficulty. You can use
                      the default settings or customize the number of easy,
                      moderate, and hard questions of the selected subjects.
                    </div>

                    {mode === "custom" && (
                      <div className="grid grid-cols-3 gap-4">
                        {["easy", "moderate", "hard"].map((level) => (
                          <div key={level}>
                            <span className="mb-2 block text-[12px] text-nowrap text-gray-700 capitalize">
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
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || 0,
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
                          <span className="loader-white"></span>
                        </div>
                      ) : (
                        "Generate Exam"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Panel - Selected Subjects (Desktop Only) */}
            {settings.exam_type !== "personal" &&
              selectedSubjects.length > 0 && (
                <div className="hidden w-full flex-col rounded-t-md border-l border-gray-200 bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md md:flex md:max-w-[480px] md:min-w-[300px]">
                  <div className="border-color flex-shrink-0 border-b py-2 pl-4">
                    <h3 className="text-[14px] font-medium text-gray-700">
                      Selected Subjects
                    </h3>
                  </div>
                  <div className="edit-profile-modal-scrollbar max-h-[calc(90vh-60px)] overflow-y-auto rounded-b-md">
                    <div className="">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 bg-gray-100">
                            <tr>
                              <th className="w-[200px] px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Subject
                              </th>
                              <th className="w-[40px] px-2 py-3 text-left text-xs font-medium tracking-wider text-nowrap text-gray-500 uppercase">
                                Percentage %
                              </th>
                              <th className="w-[60px] px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {selectedSubjects.map((subject) => (
                              <tr key={subject.subjectID}>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div
                                      className="max-w-[120px] truncate text-[12px] md:max-w-[160px] lg:max-w-[240px]"
                                      title={subject.subjectName}
                                    >
                                      {subject.subjectCode} -{" "}
                                      {subject.subjectName}
                                    </div>
                                    {subject.subjectName.length > 15 && (
                                      <Tooltip
                                        content={subject.subjectName}
                                        placement="right"
                                        className="z-50"
                                      >
                                        <button
                                          type="button"
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <i className="bx bx-show text-[16px]"></i>
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 pl-6 text-[14px] whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={subject.percentage}
                                    onChange={(e) =>
                                      handleSubjectPercentageChange(
                                        subject.subjectID,
                                        e.target.value === ""
                                          ? ""
                                          : parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="peer w-[60px] rounded-lg border border-gray-300 px-[9px] py-[5px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                  />
                                </td>
                                <td className="py-3 pr-5 pl-3 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSubject(subject.subjectID)
                                    }
                                    className="cursor-pointer text-[12px] text-red-600 hover:text-red-900"
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        message="You are about to close the exam generator while it's still processing. This will cancel the generation process. Do you want to continue?"
        isLoading={loading}
      />
    </>
  );
}
