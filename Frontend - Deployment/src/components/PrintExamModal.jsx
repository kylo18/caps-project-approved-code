import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SubjectSearchInput from "./SubjectSearchInput";
import RegisterDropDownSmall from "./registerDropDownSmall";
import ConfirmModal from "./confirmModal";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import {
  useRef as useLocalRef,
  useState as useLocalState,
  useEffect as useLocalEffect,
} from "react";

export default function ExamGenerator({
  auth,
  isOpen,
  onClose,
  initialSubject,
}) {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [mode, setMode] = useState("default");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [difficultyCounts, setDifficultyCounts] = useState({});
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
    fetchDifficultyCounts();
  }, []);

  useEffect(() => {
    if (initialSubject && isOpen) {
      setSelectedSubjects([
        {
          subjectID: initialSubject.subjectID,
          subjectName: initialSubject.subjectName,
          subjectCode: initialSubject.subjectCode,
          programName: initialSubject.programName,
          yearLevel: initialSubject.yearLevel,
          percentage: 100,
        },
      ]);
    }
  }, [initialSubject, isOpen]);

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
          credentials: "include",
        headers: {
                  },
      });
      const data = await response.json();
      if (data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (err) {
      showToast("Failed to load subjects", "error");
    }
  };

  const fetchDifficultyCounts = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/subjects/question-difficulty-counts`,
        {
          credentials: "include",
          headers: {
                      },
        },
      );
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const countsMap = {};
        data.data.forEach((subject) => {
          countsMap[subject.subjectID] = subject.difficulty_counts;
        });
        setDifficultyCounts(countsMap);
      }
    } catch (err) {
      console.error("Failed to fetch difficulty counts", err);
    }
  };

  // Calculate how many questions of each difficulty are needed for a subject
  const getSubjectDifficultyBreakdown = (subject) => {
    const totalItems = parseInt(settings.total_items) || 0;
    const subjectPct = parseInt(subject.percentage) || 0;
    const subjectItems = Math.round((totalItems * subjectPct) / 100);

    const easyPct = parseInt(settings.easy_percentage) || 0;
    const moderatePct = parseInt(settings.moderate_percentage) || 0;
    const hardPct = parseInt(settings.hard_percentage) || 0;

    const easyNeeded = Math.round((subjectItems * easyPct) / 100);
    const moderateNeeded = Math.round((subjectItems * moderatePct) / 100);
    const hardNeeded = subjectItems - easyNeeded - moderateNeeded;

    const counts = difficultyCounts[subject.subjectID] || {
      easy: 0,
      moderate: 0,
      hard: 0,
      total: 0,
    };

    return {
      subjectItems,
      easy: {
        needed: easyNeeded,
        available: counts.easy,
        insufficient: easyNeeded > counts.easy,
      },
      moderate: {
        needed: moderateNeeded,
        available: counts.moderate,
        insufficient: moderateNeeded > counts.moderate,
      },
      hard: {
        needed: hardNeeded,
        available: counts.hard,
        insufficient: hardNeeded > counts.hard,
      },
    };
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
    setLoading(true);

    // Validate total items
    if (!settings.total_items || settings.total_items === "") {
      showToast("Please enter the total number of items", "error");
      setLoading(false);
      return;
    }

    // Validate difficulty percentages
    const totalDifficulty =
      settings.easy_percentage +
      settings.moderate_percentage +
      settings.hard_percentage;
    if (totalDifficulty !== 100) {
      showToast("Difficulty percentages must sum to 100%", "error");
      setLoading(false);
      return;
    }

    // Validate subject selection
    if (selectedSubjects.length === 0) {
      showToast("Please select at least one subject", "error");
      setLoading(false);
      return;
    }

    // Validate subject percentages
    const totalSubjectPercentage = selectedSubjects.reduce(
      (sum, subject) => sum + subject.percentage,
      0,
    );
    if (totalSubjectPercentage !== 100) {
      showToast("Subject percentages must sum to 100%", "error");
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

      // Debug log to see what subjects are being sent
      console.log(
        "Sending subjects to API:",
        selectedSubjects.map((s) => ({
          subjectID: s.subjectID,
          subjectName: s.subjectName,
          subjectCode: s.subjectCode,
          percentage: s.percentage,
        })),
      );

      const response = await fetch(endpoint, {
          credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        if (
          errorData.message?.toLowerCase().includes("error processing subject")
        ) {
          throw new Error(
            ` ${errorData.message}. Please try selecting different subjects or contact support if the issue persists.`,
          );
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Failed to generate exam preview",
        );
      }

      const data = await response.json();

      navigate("/print-qualification-exam", {
        state: {
          examData: data.previewData,
          examKey: data.previewKey,
          totalItems: settings.total_items,
          subjects: selectedSubjects,
          difficultyDistribution: {
            easy: settings.easy_percentage,
            moderate: settings.moderate_percentage,
            hard: settings.hard_percentage,
          },
        },
      });

      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error generating exam:", err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasAnyInsufficient =
    settings.exam_type !== "personal" &&
    selectedSubjects.some((subject) => {
      const breakdown = getSubjectDifficultyBreakdown(subject);
      return (
        breakdown.subjectItems > 0 &&
        (breakdown.easy.insufficient ||
          breakdown.moderate.insufficient ||
          breakdown.hard.insufficient)
      );
    });

  return (
    <>
      {/* Mobile Modal: visible on small screens only */}
      <div className="block sm:hidden">
        {/* Form Modal */}
        <div className="outfit outfit-300 bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center">
          {/* Overlay click handler for closing modal on outside click */}
          <div
            className="absolute inset-0 z-0"
            onClick={handleClose}
            style={{ background: "transparent" }}
          />
          <div className="animate-fade-in-up relative z-10 mx-0 w-full rounded-t-2xl bg-white shadow-2xl">
            <div className="border-color flex items-center justify-between border-b px-4 py-2">
              <h2 className="text-[16px] outfit-500 text-black sm:text-[14px]">
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
                    <span className="mb-2 block text-[16px] outfit-500 text-gray-900">
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
                          <h3 className="text-[14px] outfit-500 text-gray-700">
                            Subjects Included
                          </h3>
                        </div>

                        <div className="edit-profile-modal-scrollbar max-h-[400px] space-y-2.5 overflow-y-auto">
                          {selectedSubjects.map((subject) => {
                            const breakdown =
                              getSubjectDifficultyBreakdown(subject);
                            const counts = difficultyCounts[
                              subject.subjectID
                            ] || { easy: 0, moderate: 0, hard: 0, total: 0 };
                            const totalAvailable = counts.total;
                            const totalGap = Math.max(
                              0,
                              breakdown.subjectItems - totalAvailable,
                            );
                            const hasInsufficient =
                              breakdown.subjectItems > 0 &&
                              (breakdown.easy.insufficient ||
                                breakdown.moderate.insufficient ||
                                breakdown.hard.insufficient);
                            const gapCount = hasInsufficient
                              ? [
                                  breakdown.easy,
                                  breakdown.moderate,
                                  breakdown.hard,
                                ].reduce(
                                  (sum, d) =>
                                    sum + Math.max(0, d.needed - d.available),
                                  0,
                                )
                              : 0;

                            return (
                              <div
                                key={subject.subjectID}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                              >
                                {/* Card Header */}
                                <div className="outfit-300 border-b border-gray-200 px-4 pt-3.5 pb-3">
                                  <div className="flex items-center justify-between">
                                    {/* LEFT SIDE */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2.5">
                                        <span className="outfit-500 truncate text-[14px] text-gray-600">
                                          {subject.subjectCode} —{" "}
                                          {subject.subjectName}
                                        </span>

                                        {hasInsufficient ? (
                                          <span className="inline-flex shrink-0 items-center rounded-full text-[10px] outfit-500 tracking-wide text-red-400 uppercase">
                                            Insufficient
                                          </span>
                                        ) : null}
                                      </div>

                                      <div className="mt-[3px] text-[12px] text-gray-500">
                                        {totalAvailable} created ·{" "}
                                        {breakdown.subjectItems} needed
                                      </div>
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <div className="ml-3 flex items-center gap-3">
                                      <span className="text-[12px] outfit-500 tracking-wider text-[#6a6a6a] uppercase">
                                        Percentage
                                      </span>

                                      <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm">
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
                                                : parseInt(
                                                    e.target.value,
                                                  ) || 0,
                                            )
                                          }
                                          className="w-[32px] [appearance:textfield] bg-transparent text-right text-[16px] outfit-500 text-gray-700 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />

                                        <span className="ml-1 text-[16px] outfit-500 text-gray-700">
                                          %
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveSubject(
                                            subject.subjectID,
                                          )
                                        }
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#6a6a6a] transition-colors hover:bg-gray-100"
                                      >
                                        <i className="bx bx-x text-[18px]"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Bars */}
                                {breakdown.subjectItems > 0 && (
                                  <div className="mt-2 px-4 pb-3">
                                    <div className="space-y-[8px]">
                                      {[
                                        {
                                          label: "Easy",
                                          color: "#4ade80",
                                          data: breakdown.easy,
                                          available: counts.easy,
                                        },
                                        {
                                          label: "Moderate",
                                          color: "#facc15",
                                          data: breakdown.moderate,
                                          available: counts.moderate,
                                        },
                                        {
                                          label: "Hard",
                                          color: "#f87171",
                                          data: breakdown.hard,
                                          available: counts.hard,
                                        },
                                      ].map((diff) => {
                                        const pct =
                                          diff.data.needed > 0
                                            ? Math.min(
                                                100,
                                                (diff.available /
                                                  diff.data.needed) *
                                                  100,
                                              )
                                            : 100;
                                        const gap = Math.max(
                                          0,
                                          diff.data.needed - diff.available,
                                        );
                                        return (
                                          <div
                                            key={diff.label}
                                            className="outfit-300 flex items-center gap-2.5"
                                          >
                                            <span
                                              className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                                              style={{
                                                backgroundColor: diff.color,
                                              }}
                                            ></span>
                                            <span className="w-[70px] shrink-0 text-[12px] text-gray-600">
                                              {diff.label}
                                            </span>
                                            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-gray-300">
                                              <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                  width: `${diff.data.needed > 0 ? pct : 0}%`,
                                                  backgroundColor:
                                                    diff.color,
                                                }}
                                              />
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1.5">
                                              <span className="text-[14px] text-[#b0b0b0]">
                                                {diff.available}
                                              </span>
                                              <span className="text-[12px] text-[#555]">
                                                /
                                              </span>
                                              <span className="text-[14px] text-[#b0b0b0]">
                                                {diff.data.needed}
                                              </span>
                                              {gap > 0 ? (
                                                <span className="ml-0.5 inline-flex items-center justify-center rounded px-1.5 py-[1px] text-[12px] outfit-500 text-red-400">
                                                  −{gap}
                                                </span>
                                              ) : (
                                                <span className="ml-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full">
                                                  <i className="bx bx-check text-[14px] text-green-400"></i>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Warning Footer */}
                                {hasInsufficient && (
                                  <div className="flex items-center justify-between bg-red-100 px-4 py-2.5">
                                    <div className="flex items-center gap-2 text-[11px] text-red-600">
                                      <i className="bx bx-alert-circle text-[14px]"></i>
                                      <span>
                                        Insufficient question pool —{" "}
                                        {gapCount} of{" "}
                                        {breakdown.subjectItems} needed
                                        items cannot be filled.
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      </div>
                    </>
                  )}

                <div className="mt-2 mb-3 text-start">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="mb-[6px] block text-[14px] outfit-500 text-gray-700">
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
                        Set the total number of questions for the exam (1-100).
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                <div>
                  <span className="mt-2 mb-2 block text-[14px] outfit-500 text-gray-700">
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
                    Customize the number of easy, moderate, and hard questions,
                    or keep the default configuration (30%,50%,20%).
                  </div>

                  {mode === "custom" && (
                    <div className="grid grid-cols-3 gap-4">
                      {["easy", "moderate", "hard"].map((level) => (
                        <div key={level}>
                          <span className="mb-2 block text-[12px] text-nowrap outfit-500 text-gray-700 capitalize">
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
                {/* error && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {error}
                  </div>
                ) */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || hasAnyInsufficient}
                    className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] outfit-500 text-white transition-all duration-100 ease-in-out ${loading || hasAnyInsufficient ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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
      </div>
      {/* Desktop Modal: hidden on small screens, visible on sm+ */}
      <div className="outfit outfit-300 hidden sm:flex">
        {/* Form Modal */}
        <div
          className={`outfit outfit-300 bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex justify-end transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {/* Overlay click handler for closing modal on outside click */}
          <div
            className="absolute inset-0 z-0"
            onClick={handleClose}
            style={{ background: "transparent" }}
          />
          {/* Modal with full-width header */}
          <div
            className={`slide-in-right relative z-10 flex h-full w-[850px] min-w-[350px] transform flex-col bg-white shadow-2xl transition-all duration-300 ${isOpen ? "" : "pointer-events-none translate-x-8 opacity-0"}`}
          >
            {/* Compact Header across the whole modal */}
            <div className="border-color flex w-full items-center justify-between border-b px-5 py-2">
              <h2 className="text-[17px] leading-none outfit-500 text-black">
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
                  className="mx-auto max-w-[726px]"
                  onSubmit={handleSubmit}
                  id="printExamForm"
                >
                  {settings.exam_type !== "personal" && (
                    <div className="mt-1 mb-6 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[14px] outfit-500 text-gray-900">
                          Select Subject(s)
                        </span>
                        <div className="text-[12px] text-gray-500">
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
                              <h3 className="text-[14px] outfit-500 text-gray-900">
                                Subjects included
                              </h3>
                            </div>

                            <div className="edit-profile-modal-scrollbar max-h-[450px] space-y-3 overflow-y-auto">
                              {selectedSubjects.map((subject) => {
                                const breakdown =
                                  getSubjectDifficultyBreakdown(subject);
                                const counts = difficultyCounts[
                                  subject.subjectID
                                ] || {
                                  easy: 0,
                                  moderate: 0,
                                  hard: 0,
                                  total: 0,
                                };
                                const totalAvailable = counts.total;
                                const hasInsufficient =
                                  breakdown.subjectItems > 0 &&
                                  (breakdown.easy.insufficient ||
                                    breakdown.moderate.insufficient ||
                                    breakdown.hard.insufficient);
                                const gapCount = hasInsufficient
                                  ? [
                                      breakdown.easy,
                                      breakdown.moderate,
                                      breakdown.hard,
                                    ].reduce(
                                      (sum, d) =>
                                        sum +
                                        Math.max(0, d.needed - d.available),
                                      0,
                                    )
                                  : 0;

                                return (
                                  <div
                                    key={subject.subjectID}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                  >
                                    {/* Card Header */}
                                    <div className="outfit-300 border-b border-gray-200 px-4 pt-3.5 pb-3">
                                      <div className="flex items-center justify-between">
                                        {/* LEFT SIDE */}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2.5">
                                            <span className="outfit-500 truncate text-[14px] outfit-500 text-gray-600">
                                              {subject.subjectCode} —{" "}
                                              {subject.subjectName}
                                            </span>

                                            {hasInsufficient ? (
                                              <span className="inline-flex shrink-0 items-center rounded-full text-[10px] outfit-500 tracking-wide text-red-400 uppercase">
                                                Insufficient
                                              </span>
                                            ) : null}
                                          </div>

                                          <div className="mt-[3px] text-[12px] text-gray-500">
                                            {totalAvailable} created ·{" "}
                                            {breakdown.subjectItems} needed
                                          </div>
                                        </div>

                                        {/* RIGHT SIDE */}
                                        <div className="ml-3 flex items-center gap-3">
                                          <span className="text-[12px] outfit-500 tracking-wider text-[#6a6a6a] uppercase">
                                            Percentage
                                          </span>

                                          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm">
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
                                                    : parseInt(
                                                        e.target.value,
                                                      ) || 0,
                                                )
                                              }
                                              className="w-[32px] [appearance:textfield] bg-transparent text-right text-[16px] outfit-500 text-gray-700 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />

                                            <span className="ml-1 text-[16px] outfit-500 text-gray-700">
                                              %
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveSubject(
                                                subject.subjectID,
                                              )
                                            }
                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#6a6a6a] transition-colors hover:bg-gray-100"
                                          >
                                            <i className="bx bx-x text-[18px]"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Progress Bars */}
                                    {breakdown.subjectItems > 0 && (
                                      <div className="mt-2 px-4 pb-3">
                                        <div className="space-y-[8px]">
                                          {[
                                            {
                                              label: "Easy",
                                              color: "#4ade80",
                                              data: breakdown.easy,
                                              available: counts.easy,
                                            },
                                            {
                                              label: "Moderate",
                                              color: "#facc15",
                                              data: breakdown.moderate,
                                              available: counts.moderate,
                                            },
                                            {
                                              label: "Hard",
                                              color: "#f87171",
                                              data: breakdown.hard,
                                              available: counts.hard,
                                            },
                                          ].map((diff) => {
                                            const pct =
                                              diff.data.needed > 0
                                                ? Math.min(
                                                    100,
                                                    (diff.available /
                                                      diff.data.needed) *
                                                      100,
                                                  )
                                                : 100;
                                            const gap = Math.max(
                                              0,
                                              diff.data.needed - diff.available,
                                            );
                                            return (
                                              <div
                                                key={diff.label}
                                                className="outfit-300 flex items-center gap-2.5"
                                              >
                                                <span
                                                  className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                                                  style={{
                                                    backgroundColor: diff.color,
                                                  }}
                                                ></span>
                                                <span className="w-[70px] shrink-0 text-[12px] text-gray-600">
                                                  {diff.label}
                                                </span>
                                                <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-gray-300">
                                                  <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                      width: `${diff.data.needed > 0 ? pct : 0}%`,
                                                      backgroundColor:
                                                        diff.color,
                                                    }}
                                                  />
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                  <span className="text-[14px] text-[#b0b0b0]">
                                                    {diff.available}
                                                  </span>
                                                  <span className="text-[12px] text-[#555]">
                                                    /
                                                  </span>
                                                  <span className="text-[14px] text-[#b0b0b0]">
                                                    {diff.data.needed}
                                                  </span>
                                                  {gap > 0 ? (
                                                    <span className="ml-0.5 inline-flex items-center justify-center rounded px-1.5 py-[1px] text-[12px] outfit-500 text-red-400">
                                                      −{gap}
                                                    </span>
                                                  ) : (
                                                    <span className="ml-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full">
                                                      <i className="bx bx-check text-[14px] text-green-400"></i>
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Warning Footer */}
                                    {hasInsufficient && (
                                      <div className="flex items-center justify-between bg-red-100 px-4 py-2.5">
                                        <div className="flex items-center gap-2 text-[11px] text-red-600">
                                          <i className="bx bx-alert-circle text-[14px]"></i>
                                          <span>
                                            Insufficient question pool —{" "}
                                            {gapCount} of{" "}
                                            {breakdown.subjectItems} needed
                                            items cannot be filled.
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
                      <div className="text-[14px] outfit-500 text-gray-900">
                        Total Items
                      </div>
                      <div className="text-[12px] text-gray-500">
                        Set the total number of questions for the exam (1-100).
                      </div>
                    </div>
                    <input
                      className="peer w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
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
                      <div className="text-[14px] outfit-500 text-gray-900">
                        Difficulty
                      </div>
                      <div className="text-[12px] text-gray-500">
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
                              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-[15px] hover:bg-gray-100"
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
                    <div className="mb-1 text-[14px] outfit-500 text-gray-900">
                      Custom Difficulty Percentages
                    </div>
                    <div className="-mt-2 mb-2 text-[12px] text-gray-500">
                      Set the percentage for each difficulty. Total must equal
                      100%.
                    </div>
                    {["easy", "moderate", "hard"].map((level) => (
                      <div
                        key={level}
                        className="flex items-center justify-between gap-2"
                      >
                        <label className="block text-[13px] text-gray-600 capitalize">
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
                          className="w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          min="0"
                          max="100"
                          disabled={mode !== "custom"}
                        />
                      </div>
                    ))}
                  </div>
                  {/* error && (
                    <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                      {error}
                    </div>
                  ) */}
                </form>
              </div>
            </div>
            {/* Absolute Footer with Generate Exam button */}
            <div className="border-color absolute right-0 bottom-0 left-0 flex w-full items-center justify-end bg-white px-8 py-3">
              <button
                type="submit"
                form="printExamForm"
                disabled={loading || hasAnyInsufficient}
                className={`flex h-9 w-36 items-center justify-center rounded-lg text-[16px] outfit-500 text-white transition-all duration-100 ease-in-out ${loading || hasAnyInsufficient ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
              >
                {loading ? <span className="loader-white" /> : "Generate Exam"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        message="You are about to close the exam generator while it's still processing. This will cancel the generation process. Do you want to continue?"
        isLoading={loading}
      />

      {/* Toast notification */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
