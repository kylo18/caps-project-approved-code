import React, { useState, useEffect } from "react";
import SubjectSearchInput from "./SubjectSearchInput";
import ExamPreviewModal from "./qualifyingExamPreview";
import RegisterDropDownSmall from "./registerDropDownSmall";
import ConfirmModal from "./confirmModal";
import {
  useRef as useLocalRef,
  useState as useLocalState,
  useEffect as useLocalEffect,
} from "react";

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
    isEnabled: true,
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Prevent background scrolling when modal is open (like SubjectSettingsDeanProgChair)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      isEnabled: true,
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
      isEnabled: true,
    });
    onClose();
  };

  const [isDiffOpen, setIsDiffOpen] = useLocalState(false);
  const diffDropdownRef = useLocalRef(null);
  const diffButtonRef = useLocalRef(null);

  useLocalEffect(() => {
    const handleClickOutside = (event) => {
      if (
        diffDropdownRef.current &&
        !diffDropdownRef.current.contains(event.target)
      ) {
        setIsDiffOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Modal: visible on small screens only */}
      <div className="block sm:hidden">
        {/* Form Modal */}
        {!showPreview && (
          <div className="open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            {/* Overlay click handler for closing modal on outside click */}
            <div
              className="absolute inset-0 z-0"
              onClick={handleClose}
              style={{ background: "transparent" }}
            />
            <div className="animate-fade-in-up relative z-10 mx-0 w-full max-w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black sm:text-[14px]">
                  Generate Qualifying Exam
                </h2>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>
              <div className="edit-profile-modal-scrollbar max-h-[calc(90vh-60px)] overflow-y-auto">
                <form className="px-5 py-4" onSubmit={handleSubmit}>
                  {settings.exam_type !== "personal" && (
                    <div>
                      <span className="mb-2 block text-[14px] text-gray-900">
                        Select Subject(s)
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

                  {/* Selected Subjects Section (always visible, mobile style) */}
                  {settings.exam_type !== "personal" &&
                    selectedSubjects.length > 0 && (
                      <>
                        <div className="relative -mx-[25px] mt-3 bg-gray-50 px-[25px] py-4">
                          <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-[14px] text-gray-700">
                              Subjects Included
                            </h3>
                            <span className="mr-6 text-[12px] text-gray-500">
                              Percentage (%)
                            </span>
                          </div>

                          <div className="max-h-[200px] space-y-1 overflow-y-auto">
                            {selectedSubjects.map((subject) => (
                              <div
                                key={subject.subjectID}
                                className="flex items-center justify-between px-3 py-1"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="max-w-[160px] truncate text-[12px] min-[415px]:max-w-[200px] lg:max-w-[240px]">
                                    {subject.subjectCode} -{" "}
                                    {subject.subjectName}
                                  </div>
                                  {subject.subjectName.length > 15 && (
                                    <button
                                      type="button"
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <i className="bx bx-show text-[16px]"></i>
                                    </button>
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
                          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        </div>
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
                          Set the total number of questions for the exam
                          (1-100).
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
                      Customize the number of easy, moderate, and hard
                      questions, or keep the default configuration
                      (30%,50%,20%).
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
          </div>
        )}
      </div>
      {/* Desktop Modal: hidden on small screens, visible on sm+ */}
      <div className="open-sans hidden sm:flex">
        {/* Form Modal */}
        {!showPreview && (
          <div
            className={`open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex justify-end transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {/* Overlay click handler for closing modal on outside click */}
            <div
              className="absolute inset-0 z-0"
              onClick={handleClose}
              style={{ background: "transparent" }}
            />
            {/* Modal with full-width header */}
            <div
              className={`slide-in-right relative z-10 flex h-full w-[700px] min-w-[350px] transform flex-col bg-white shadow-2xl transition-all duration-300 ${isOpen ? "" : "pointer-events-none translate-x-8 opacity-0"}`}
            >
              {/* Compact Header across the whole modal */}
              <div className="border-color flex w-full items-center justify-between border-b px-5 py-2">
                <h2 className="text-[17px] leading-none font-semibold text-black">
                  Generate Qualifying Exam
                </h2>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition duration-100 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                  title="Close"
                  type="button"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>
              <div className="flex h-0 flex-1">
                <div className="practice-config-scrollable custom-scrollbar flex min-h-screen flex-1 flex-col overflow-y-auto px-5 py-4 pb-24">
                  <form
                    className="mx-auto max-w-xl"
                    onSubmit={handleSubmit}
                    id="printExamForm"
                  >
                    {settings.exam_type !== "personal" && (
                      <div className="mt-1 mb-6 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[12px] font-semibold text-gray-900">
                            Select Subject(s)
                          </span>
                          <div className="text-[10px] text-gray-500">
                            Select the subject(s) you want to include.
                          </div>
                        </div>
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
                    {settings.exam_type !== "personal" &&
                      selectedSubjects.length > 0 && (
                        <>
                          <div className="mt-3 mb-5">
                            <div className="relative -mx-[57px] bg-gray-50 px-[57px] py-4">
                              <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                              <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-[12px] font-medium text-gray-900">
                                  Subjects included
                                </h3>
                                <span className="mr-10 text-[12px] text-gray-500">
                                  Percentage (%)
                                </span>
                              </div>

                              <div className="custom-scrollbar max-h-[230px] overflow-y-auto">
                                {selectedSubjects.map((subject) => (
                                  <div
                                    key={subject.subjectID}
                                    className="flex items-center justify-between px-3 py-1"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="max-w-[160px] truncate text-[12px] min-[415px]:max-w-[200px] lg:max-w-[240px]">
                                        {subject.subjectCode} -{" "}
                                        {subject.subjectName}
                                      </div>
                                      {subject.subjectName.length > 15 && (
                                        <button
                                          type="button"
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <i className="bx bx-show text-[16px]"></i>
                                        </button>
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
                                        className="flex h-[25px] cursor-pointer items-center justify-center rounded-full px-1 py-[1px] text-red-600 transition duration-100 hover:bg-red-50"
                                      >
                                        <i className="bx bx-x text-[18px]"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                            </div>
                          </div>
                        </>
                      )}
                    {selectedSubjects.length === 0 && (
                      <div className="-mx-5 mt-3 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    )}

                    {/* Total Items Section (copied and adapted) */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-[12px] font-semibold text-gray-900">
                          Total Items
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Set the total number of questions for the exam
                          (1-100).
                        </div>
                      </div>
                      <input
                        className="peer w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        type="number"
                        min={1}
                        max={100}
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
                      />
                    </div>
                    {/* Difficulty Distribution Section (copied and adapted) */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-[12px] font-semibold text-gray-900">
                          Difficulty
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Customize the number of easy, moderate, and hard
                          questions, or keep the default configuration
                          (30%,50%,20%).
                        </div>
                      </div>
                      <div className="relative" ref={diffDropdownRef}>
                        <button
                          ref={diffButtonRef}
                          type="button"
                          onClick={() => setIsDiffOpen((prev) => !prev)}
                          className={`relative flex w-32 cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-[7px] text-[12px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:outline-none ${isDiffOpen ? "border-none ring-1 ring-orange-500 ring-offset-1" : ""}`}
                        >
                          <span
                            className={`truncate ${!mode ? "text-gray-500" : ""}`}
                          >
                            {mode === "default"
                              ? "Default"
                              : mode === "custom"
                                ? "Custom"
                                : "Select Mode"}
                          </span>
                          <i
                            className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isDiffOpen ? "rotate-180" : "rotate-0"}`}
                          ></i>
                        </button>
                        {isDiffOpen && (
                          <ul className="animate-dropdown animate-fadein custom-scrollbar absolute top-full right-[-8px] z-10 mx-2 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border border-gray-300 bg-white p-1 shadow-lg">
                            {[
                              {
                                value: "default",
                                label: "Default",
                              },
                              {
                                value: "custom",
                                label: "Custom",
                              },
                            ].map((option) => (
                              <li
                                key={option.value}
                                onClick={() => {
                                  setMode(option.value);
                                  if (option.value === "default") {
                                    setSettings((prev) => ({
                                      ...prev,
                                      easy_percentage: 30,
                                      moderate_percentage: 50,
                                      hard_percentage: 20,
                                    }));
                                  }
                                  setIsDiffOpen(false);
                                }}
                                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-[13px] hover:bg-gray-100"
                              >
                                {option.label}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    {/* Always show Difficulty Percentages, disable if not custom */}
                    <div
                      className={`mb-6 flex flex-col gap-2 ${!settings.isEnabled || mode !== "custom" ? "pointer-events-none opacity-50" : settings.isEnabled ? "" : "pointer-events-none opacity-50"}`}
                    >
                      <div className="mb-1 text-[12px] font-semibold text-gray-900">
                        Custom Difficulty Percentages
                      </div>
                      <div className="-mt-2 mb-2 text-[10px] text-gray-500">
                        Set the percentage for each difficulty. Total must equal
                        100%.
                      </div>
                      {["easy", "moderate", "hard"].map((level) => (
                        <div
                          key={level}
                          className="flex items-center justify-between gap-2"
                        >
                          <label className="block text-[11px] text-gray-600 capitalize">
                            Percentage of {level} Questions
                          </label>
                          <input
                            type="number"
                            name={`${level}_percentage`}
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
                            className="w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                            min="0"
                            max="100"
                            disabled={mode !== "custom"}
                          />
                        </div>
                      ))}
                    </div>
                    {error && (
                      <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              </div>
              {/* Absolute Footer with Generate Exam button */}
              <div className="border-color absolute right-0 bottom-0 left-0 flex w-full items-center justify-end bg-white px-8 py-3">
                <button
                  type="submit"
                  form="printExamForm"
                  disabled={loading}
                  className={`h-9 w-32 cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${loading ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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
            </div>
          </div>
        )}
      </div>
      {/* Preview Modal */}
      {showPreview && (
        <ExamPreviewModal
          previewData={previewData}
          onClose={() => setShowPreview(false)}
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
