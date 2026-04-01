import React, { useState, useEffect, useRef } from "react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import AssignToClassModal from "./AssignToClassModal";

const pad2 = (n) => String(n).padStart(2, "0");
const toDatetimeLocal = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const formatMaybeDateTime = (value) => {
  if (!value) return "No date";
  const d = new Date(value);
  if (!isValidDate(d)) return "No date";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const DateTimeModal = ({
  isOpen,
  onClose,
  initialStart,
  initialEnd,
  onSave,
  showToast,
}) => {
  const initialNow = (() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return toDatetimeLocal(d);
  })();

  const [startTime, setStartTime] = useState(initialStart || "");
  const [endTime, setEndTime] = useState(initialEnd || "");

  useEffect(() => {
    if (!isOpen) return;
    setStartTime(initialStart || "");
    setEndTime(initialEnd || "");
  }, [isOpen, initialStart, initialEnd]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalStart = startTime || initialNow;
    const start = new Date(finalStart);
    const end = endTime ? new Date(endTime) : null;

    if (!isValidDate(start)) {
      showToast?.("Start time is invalid.", "error");
      return;
    }
    if (endTime && (!end || !isValidDate(end))) {
      showToast?.("End time is invalid.", "error");
      return;
    }
    if (end && end < start) {
      showToast?.("End time must be after or equal to start time.", "error");
      return;
    }

    onSave({
      startTime: toDatetimeLocal(start),
      endTime: end ? toDatetimeLocal(end) : "",
    });
  };

  return (
    <div className="outfit-400 fixed inset-0 z-[120] flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex flex-col">
            <span className="outfit-500 text-[16px] text-gray-900">
              Start – End time
            </span>
            <span className="text-[14px] text-gray-500">
              Set when the quiz opens and closes.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
          >
            <i className="bx bx-x text-[22px]"></i>
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="space-y-2">
            <div className="outfit-500 text-[14px] text-gray-900">
              Start Time
            </div>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder={initialNow}
              className="w-full rounded-xl border border-gray-300 px-3 py-[8px] text-[14px] text-gray-900 focus:border-[#FE6902] focus:outline-none"
            />
            <div className="text-[12px] text-gray-500">
              If not set, it will default to cuurent time.
            </div>
          </div>

          <div className="space-y-2">
            <div className="outfit-500 text-[14px] text-gray-900">End Time</div>

            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-[8px] text-[14px] text-gray-900 focus:border-[#FE6902] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="cursor-pointer rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-orange-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizSettingsModal = ({
  personalQuizID,
  quizTitle,
  isFormOpen,
  setIsFormOpen,
  onSuccess,
  // View-only mode (e.g. from ClassContent): display settings for a class-quiz, no edit, Unassign at bottom
  viewOnly = false,
  classPersonalQuizID: viewOnlyClassPersonalQuizID = null,
  classDisplayName = "",
  onUnassign,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for quiz settings
  const [settings, setSettings] = useState({
    startTime: "",
    endTime: "",
    quizAttempts: "1",
    quizTimer: "",
    quizTimerEnabled: false,
    shuffleQuestions: false,
    shuffleChoices: false,
    showCorrectQuestion: false,
    showCorrectAnswers: false,
    autoSubmitOnTimeout: false,
    allowLateSubmission: false,
    showScoreAfterQuiz: false,
  });

  const { toast, showToast } = useToast();
  const hasFetchedRef = useRef(false);
  const viewOnlyFetchedRef = useRef(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  // Single class selection for settings (settings are per class-quiz assignment)
  const [selectedClassID, setSelectedClassID] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedClassPersonalQuizID, setSelectedClassPersonalQuizID] =
    useState(null);
  const [assignmentStartDate, setAssignmentStartDate] = useState("");
  const [assignmentDeadlineDate, setAssignmentDeadlineDate] = useState("");
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);

  const applyQuickWindowFromNow = (daysToAdd) => {
    const now = new Date();
    now.setSeconds(0, 0);
    const startValue = settings.startTime || toDatetimeLocal(now);
    const start = new Date(startValue);
    const base = isValidDate(start) ? start : now;
    const end = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    end.setSeconds(0, 0);

    const startLocal = toDatetimeLocal(base);
    const endLocal = toDatetimeLocal(end);
    setAssignmentStartDate(startLocal);
    setAssignmentDeadlineDate(endLocal);
    setSettings((prev) => ({
      ...prev,
      startTime: startLocal,
      endTime: endLocal,
    }));
  };

  // Fetch settings in view-only mode (e.g. from ClassContent) by classPersonalQuizID
  useEffect(() => {
    const fetchViewOnlySettings = async () => {
      if (
        !isFormOpen ||
        !viewOnly ||
        !viewOnlyClassPersonalQuizID ||
        viewOnlyFetchedRef.current
      ) {
        return;
      }

      viewOnlyFetchedRef.current = true;

      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        if (!token) {
          showToast(
            "Authentication token not found. Please log in again.",
            "error",
          );
          setIsFormOpen(false);
          return;
        }

        const response = await fetch(
          `${apiUrl}/class-quizzes/${viewOnlyClassPersonalQuizID}/settings`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.setting) {
            const setting = result.setting;
            const startTimeValue = setting.startTime
              ? (() => {
                  let dateStr = setting.startTime.trim();
                  if (dateStr.includes(" ")) {
                    const [datePart, timePart] = dateStr.split(" ");
                    const [hours, minutes] = timePart.split(":");
                    return `${datePart}T${hours}:${minutes}`;
                  }
                  return dateStr + "T00:00";
                })()
              : "";
            const endTimeValue = setting.endTime
              ? (() => {
                  let dateStr = setting.endTime.trim();
                  if (dateStr.includes(" ")) {
                    const [datePart, timePart] = dateStr.split(" ");
                    const [hours, minutes] = timePart.split(":");
                    return `${datePart}T${hours}:${minutes}`;
                  }
                  return dateStr + "T00:00";
                })()
              : "";

            setSettings({
              startTime: startTimeValue,
              endTime: endTimeValue,
              quizAttempts:
                setting.quizAttempts != null &&
                String(setting.quizAttempts).trim() !== ""
                  ? String(setting.quizAttempts)
                  : "1",
              quizTimer: setting.quizTimer || "",
              quizTimerEnabled: setting.quizTimerEnabled ?? false,
              shuffleQuestions: setting.shuffleQuestions ?? false,
              shuffleChoices: setting.shuffleChoices ?? false,
              showCorrectQuestion: setting.showCorrectQuestion ?? false,
              showCorrectAnswers: setting.showCorrectAnswers ?? false,
              autoSubmitOnTimeout: setting.autoSubmitOnTimeout ?? false,
              allowLateSubmission: setting.allowLateSubmission ?? false,
              showScoreAfterQuiz: setting.showScoreAfterQuiz ?? false,
            });
            setAssignmentStartDate(startTimeValue || "");
            setAssignmentDeadlineDate(endTimeValue || "");
          }
        } else if (response.status === 404) {
          setSettings({
            startTime: "",
            endTime: "",
            quizAttempts: "1",
            quizTimer: "",
            quizTimerEnabled: false,
            shuffleQuestions: false,
            shuffleChoices: false,
            showCorrectQuestion: false,
            showCorrectAnswers: false,
            autoSubmitOnTimeout: false,
            allowLateSubmission: false,
            showScoreAfterQuiz: false,
          });
        }
      } catch (error) {
        console.error("Error fetching quiz settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewOnlySettings();
  }, [
    isFormOpen,
    viewOnly,
    viewOnlyClassPersonalQuizID,
    apiUrl,
    setIsFormOpen,
    showToast,
  ]);

  // Reset viewOnly fetch flag when modal closes or assignment changes
  useEffect(() => {
    if (!isFormOpen) viewOnlyFetchedRef.current = false;
  }, [isFormOpen]);
  useEffect(() => {
    viewOnlyFetchedRef.current = false;
  }, [viewOnlyClassPersonalQuizID]);

  // Fetch current settings when a class is selected and has a classPersonalQuizID (already assigned)
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      if (
        !isFormOpen ||
        viewOnly ||
        !selectedClassPersonalQuizID ||
        hasFetchedRef.current
      ) {
        return;
      }

      hasFetchedRef.current = true;

      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        if (!token) {
          showToast(
            "Authentication token not found. Please log in again.",
            "error",
          );
          setIsFormOpen(false);
          return;
        }

        const response = await fetch(
          `${apiUrl}/class-quizzes/${selectedClassPersonalQuizID}/settings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.setting) {
            const setting = result.setting;
            const startTimeValue = setting.startTime
              ? (() => {
                  let dateStr = setting.startTime.trim();
                  if (dateStr.includes(" ")) {
                    const [datePart, timePart] = dateStr.split(" ");
                    const [hours, minutes] = timePart.split(":");
                    return `${datePart}T${hours}:${minutes}`;
                  } else {
                    return dateStr + "T00:00";
                  }
                })()
              : "";
            const endTimeValue = setting.endTime
              ? (() => {
                  let dateStr = setting.endTime.trim();
                  if (dateStr.includes(" ")) {
                    const [datePart, timePart] = dateStr.split(" ");
                    const [hours, minutes] = timePart.split(":");
                    return `${datePart}T${hours}:${minutes}`;
                  } else {
                    return dateStr + "T00:00";
                  }
                })()
              : "";

            setSettings({
              startTime: startTimeValue,
              endTime: endTimeValue,
              quizAttempts:
                setting.quizAttempts !== null &&
                setting.quizAttempts !== undefined &&
                String(setting.quizAttempts).trim() !== ""
                  ? String(setting.quizAttempts)
                  : "1",
              quizTimer: setting.quizTimer || "",
              quizTimerEnabled: setting.quizTimerEnabled ?? false,
              shuffleQuestions: setting.shuffleQuestions ?? false,
              shuffleChoices: setting.shuffleChoices ?? false,
              showCorrectQuestion: setting.showCorrectQuestion ?? false,
              showCorrectAnswers: setting.showCorrectAnswers ?? false,
              autoSubmitOnTimeout: setting.autoSubmitOnTimeout ?? false,
              allowLateSubmission: setting.allowLateSubmission ?? false,
              showScoreAfterQuiz: setting.showScoreAfterQuiz ?? false,
            });

            setAssignmentStartDate(startTimeValue || "");
            setAssignmentDeadlineDate(endTimeValue || "");
          }
        } else if (response.status === 404) {
          setSettings({
            startTime: "",
            endTime: "",
            quizAttempts: "1",
            quizTimer: "",
            quizTimerEnabled: false,
            shuffleQuestions: false,
            shuffleChoices: false,
            showCorrectQuestion: false,
            showCorrectAnswers: false,
            autoSubmitOnTimeout: false,
            allowLateSubmission: false,
            showScoreAfterQuiz: false,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error fetching settings:", errorData);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSettings();
  }, [
    isFormOpen,
    selectedClassPersonalQuizID,
    apiUrl,
    setIsFormOpen,
    showToast,
  ]);

  // Reset fetch flag when selected class or modal closes
  useEffect(() => {
    if (!isFormOpen) {
      hasFetchedRef.current = false;
    }
  }, [isFormOpen]);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [selectedClassPersonalQuizID]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle dependency: if showCorrectAnswers is enabled, automatically enable showCorrectQuestion
    if (name === "showCorrectAnswers" && checked) {
      setSettings((prev) => ({
        ...prev,
        showCorrectQuestion: true,
        showCorrectAnswers: checked,
      }));
      return;
    }

    // If showCorrectQuestion is disabled, disable showCorrectAnswers
    if (name === "showCorrectQuestion" && !checked) {
      setSettings((prev) => ({
        ...prev,
        showCorrectQuestion: false,
        showCorrectAnswers: false,
      }));
      return;
    }

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    if (!viewOnly && !selectedClassID) {
      showToast("Please select a class first.", "error");
      setIsEditing(false);
      return;
    }

    // Default start time to now if empty
    const nowLocal = (() => {
      const d = new Date();
      d.setSeconds(0, 0);
      return toDatetimeLocal(d);
    })();

    const effectiveStartTime = settings.startTime || nowLocal;
    const effectiveEndTime = settings.endTime || "";

    // Validation: if quizTimerEnabled is true, quizTimer must be provided
    if (
      settings.quizTimerEnabled &&
      (!settings.quizTimer || settings.quizTimer < 1)
    ) {
      showToast(
        "Quiz timer duration is required when timer is enabled.",
        "error",
      );
      setIsEditing(false);
      return;
    }

    // Validation: endTime must be after or equal to startTime
    if (effectiveStartTime && effectiveEndTime) {
      const start = new Date(effectiveStartTime);
      const end = new Date(effectiveEndTime);
      if (end < start) {
        showToast("End time must be after or equal to start time.", "error");
        setIsEditing(false);
        return;
      }
    }

    // Validation: quizAttempts must be at least 1 if provided
    if (settings.quizAttempts && settings.quizAttempts < 1) {
      showToast("Quiz attempts must be at least 1.", "error");
      setIsEditing(false);
      return;
    }

    // Validation: showCorrectAnswers requires showCorrectQuestion to be true
    if (settings.showCorrectAnswers && !settings.showCorrectQuestion) {
      showToast(
        "You must enable 'Show Correct Question' before enabling 'Show Correct Answers'.",
        "error",
      );
      setIsEditing(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast(
          "Authentication token not found. Please log in again.",
          "error",
        );
        setIsEditing(false);
        return;
      }

      let classPersonalQuizIDToUse = viewOnly
        ? viewOnlyClassPersonalQuizID
        : selectedClassPersonalQuizID;

      // If not viewOnly and quiz is not yet assigned to this class, assign first
      if (!viewOnly && !classPersonalQuizIDToUse) {
        const assignPayload = {
          classIDs: [selectedClassID],
        };
        const startToSend =
          assignmentStartDate || settings.startTime || effectiveStartTime;
        const endToSend =
          assignmentDeadlineDate || settings.endTime || effectiveEndTime;
        if (startToSend) assignPayload.startDate = startToSend;
        if (endToSend) assignPayload.deadlineDate = endToSend;

        const assignRes = await fetch(
          `${apiUrl}/personal-quizzes/${personalQuizID}/assign-classes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(assignPayload),
          },
        );

        const assignData = await assignRes.json();
        if (!assignRes.ok || !assignData.success) {
          const errorMsg =
            assignData.message ||
            assignData.error ||
            "Failed to assign quiz to class.";
          showToast(errorMsg, "error");
          setIsEditing(false);
          return;
        }

        // Get the new classPersonalQuizID: from response or refetch classes
        if (assignData.classPersonalQuizIDs?.[0]) {
          classPersonalQuizIDToUse = assignData.classPersonalQuizIDs[0];
        } else {
          const classesRes = await fetch(
            `${apiUrl}/personal-quizzes/${personalQuizID}/classes`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const classesData = await classesRes.json();
          if (classesData.success && classesData.classes) {
            const assigned = classesData.classes.find(
              (c) =>
                c.classID === selectedClassID &&
                c.assignment?.classPersonalQuizID,
            );
            if (assigned?.assignment?.classPersonalQuizID) {
              classPersonalQuizIDToUse =
                assigned.assignment.classPersonalQuizID;
            }
          }
          if (!classPersonalQuizIDToUse) {
            showToast(
              "Quiz was assigned but could not load assignment ID. Please try again.",
              "error",
            );
            setIsEditing(false);
            return;
          }
        }
      }

      // Prepare quiz settings payload (per class-quiz)
      // Use local date from input to avoid UTC conversion shifting the day (e.g. -1 day)
      const payload = {};
      if (effectiveStartTime) {
        payload.startTime = effectiveStartTime.slice(0, 10);
      }
      if (effectiveEndTime) {
        payload.endTime = effectiveEndTime.slice(0, 10);
      }
      if (settings.quizAttempts)
        payload.quizAttempts = parseInt(settings.quizAttempts, 10);
      if (settings.quizTimerEnabled && settings.quizTimer) {
        payload.quizTimer = parseInt(settings.quizTimer, 10);
        payload.quizTimerEnabled = true;
      } else {
        payload.quizTimerEnabled = settings.quizTimerEnabled;
      }
      payload.shuffleQuestions = settings.shuffleQuestions;
      payload.shuffleChoices = settings.shuffleChoices;
      payload.showCorrectQuestion = settings.showCorrectQuestion;
      payload.showCorrectAnswers = settings.showCorrectAnswers;
      payload.autoSubmitOnTimeout = settings.autoSubmitOnTimeout;
      payload.allowLateSubmission = settings.allowLateSubmission;
      payload.showScoreAfterQuiz = settings.showScoreAfterQuiz;

      const res = await fetch(
        `${apiUrl}/class-quizzes/${classPersonalQuizIDToUse}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg =
          data.message || data.error || "Failed to save settings.";
        showToast(errorMsg, "error");
        setIsEditing(false);
        return;
      }

      showToast("Quiz settings saved successfully for this class.", "success");
      if (onSuccess) onSuccess();
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error details:", err);
      showToast(
        err.message || "Something went wrong. Please try again later.",
        "error",
      );
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelClick = () => {
    setIsFormOpen(false);
  };

  // Animation state for modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isFormOpen) {
      setShowModal(true);
    } else {
      const timeout = setTimeout(() => setShowModal(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [isFormOpen]);

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <div className="flex">
        {(isFormOpen || showModal) && (
          <div
            className={`outfit fixed inset-0 z-100 flex flex-col bg-white transition-opacity duration-200 ${
              isFormOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Top navigation bar */}
            <div className="outfit-400 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancelClick}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-800 transition duration-100 hover:bg-gray-100 hover:text-gray-800"
                >
                  <i className="bx bx-arrow-left-stroke text-2xl"></i>
                </button>

                <div className="flex items-center gap-3">
                  <span className="hidden text-[16px] font-medium text-gray-800 md:block">
                    {viewOnly ? "Quiz Settings" : "Assign Quiz"}
                  </span>

                  <div className="hidden h-5 w-px bg-gray-300 md:block"></div>

                  <span className="text-[14px] font-medium text-gray-500">
                    {quizTitle || "Quiz"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  form="quizSettingsForm"
                  disabled={isEditing}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-1.5 text-[14px] font-medium text-white transition ${
                    isEditing
                      ? "cursor-not-allowed bg-orange-500"
                      : "hover:bg-orange-600"
                  }`}
                >
                  <span>
                    {isEditing ? "Saving..." : viewOnly ? "Save" : "Assign"}
                  </span>
                </button>
              </div>
            </div>

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 md:px-6">
              {loading && (
                <div className="bg-opacity-70 fixed inset-0 z-20 flex items-center justify-center bg-white">
                  <span className="loader"></span>
                </div>
              )}
              {!loading && (
                <form
                  className="mx-auto w-full px-4 pb-10 md:w-3xl md:px-0"
                  onSubmit={handleSubmit}
                  id="quizSettingsForm"
                >
                  {/* Assignment Details (desktop) */}
                  <section className="mb-8 rounded-xl bg-white pt-4">
                    <h3 className="outfit-700 mb-4 text-[16px] text-gray-900">
                      Assignment Details
                    </h3>

                    {/* Class: read-only when viewOnly, else selector */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="outfit-500 text-[14px] text-gray-900">
                          {viewOnly
                            ? `Settings for: ${classDisplayName || "this class"}`
                            : !selectedClassName
                              ? "No class selected"
                              : `Settings for: ${selectedClassName}`}
                        </span>
                        <span className="outfit-400 text-[12px] text-gray-500">
                          {viewOnly
                            ? "Class is fixed. Edit settings below and save."
                            : "Select a class to view or edit its quiz settings."}
                        </span>
                      </div>
                      {!viewOnly && (
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="outfit-500 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {selectedClassName
                            ? "Change class"
                            : "Select a class"}
                        </button>
                      )}
                    </div>

                    {/* Start – End time (opens modal) */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="outfit-500 text-[14px] text-gray-900">
                          Start – End time
                        </span>
                        <span className="outfit-400 text-[12px] text-gray-500">
                          {formatMaybeDateTime(
                            assignmentStartDate || settings.startTime,
                          )}{" "}
                          –{" "}
                          {assignmentDeadlineDate || settings.endTime
                            ? formatMaybeDateTime(
                                assignmentDeadlineDate || settings.endTime,
                              )
                            : "No close date"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDateTimeModalOpen(true)}
                        className="outfit-500 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Change
                      </button>
                    </div>

                    <div className="outfit-400 mt-4 flex flex-wrap items-center gap-2">
                      <span className="outfit-500 text-[13px] text-gray-500">
                        End in:{" "}
                      </span>

                      <button
                        type="button"
                        onClick={() => applyQuickWindowFromNow(1)}
                        className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        1 day
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickWindowFromNow(3)}
                        className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        3 days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickWindowFromNow(7)}
                        className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        1 week
                      </button>
                    </div>

                    <div className="outfit-400 mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex flex-col">
                        <span className="outfit-500 text-[14px] text-gray-900">
                          Allow late submissions
                        </span>
                        <span className="text-[12px] text-gray-500">
                          Students can submit after the end time.
                        </span>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          name="allowLateSubmission"
                          checked={settings.allowLateSubmission}
                          onChange={handleChange}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </section>

                  {/* General / Timer and basic behaviour */}
                  <section className="outfit-400 mb-8 rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="outfit-700 mb-4 text-[16px] text-gray-900">
                      General
                    </h3>

                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="outfit-500 text-[14px] text-gray-900">
                          Quiz attempts
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Maximum number of quiz attempts (Minimum of 1).
                        </div>
                      </div>
                      <input
                        type="number"
                        name="quizAttempts"
                        min={1}
                        value={settings.quizAttempts}
                        onChange={handleChange}
                        className="w-24 rounded-xl border border-gray-300 px-3 py-[6px] text-[12px] text-gray-900 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>

                    {/* Question timer */}
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="outfit-500 text-[14px] text-gray-900">
                          Question timer
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Set a time limit for each quiz attempt. (minutes)
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="quizTimerEnabled"
                            checked={settings.quizTimerEnabled}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                        {settings.quizTimerEnabled && (
                          <input
                            type="number"
                            name="quizTimer"
                            min={1}
                            value={settings.quizTimer}
                            onChange={handleChange}
                            className="w-24 rounded-xl border border-gray-300 px-3 py-[6px] text-[12px] text-gray-900 focus:border-[#FE6902] focus:outline-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Shuffle controls */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="outfit-500 text-[14px] text-gray-900">
                            Shuffle questions
                          </div>
                          <div className="text-[12px] text-gray-500">
                            Randomize the order of questions for each attempt.
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="shuffleQuestions"
                            checked={settings.shuffleQuestions}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="outfit-500 text-[14px] text-gray-900">
                            Shuffle choices
                          </div>
                          <div className="text-[12px] text-gray-500">
                            Randomize the order of answer choices.
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="shuffleChoices"
                            checked={settings.shuffleChoices}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* Mastery / feedback settings */}
                  <section className="outfit-400 mb-6 rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="outfit-700 mb-4 text-[16px] text-gray-900">
                      Results
                    </h3>

                    {/* Redemption-like setting: show correct question / answers */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="outfit-500 text-[14px] text-gray-900">
                            Show Correct Question
                          </div>
                          <div className="text-[12px] text-gray-500">
                            Display the correct question after submission.
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="showCorrectQuestion"
                            checked={settings.showCorrectQuestion}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className={`outfit-500 text-[14px] ${!settings.showCorrectQuestion ? "text-gray-400" : "text-gray-900"}`}
                          >
                            Show Correct Answers
                          </div>
                          <div
                            className={`text-[12px] ${!settings.showCorrectQuestion ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Display correct answers after submission.
                          </div>
                        </div>
                        <label
                          className={`relative inline-flex items-center ${!settings.showCorrectQuestion ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            name="showCorrectAnswers"
                            checked={settings.showCorrectAnswers}
                            onChange={handleChange}
                            disabled={!settings.showCorrectQuestion}
                            className="peer sr-only"
                          />
                          <div
                            className={`h-6 w-11 rounded-full ${!settings.showCorrectQuestion ? "bg-gray-200" : settings.showCorrectAnswers ? "bg-orange-500" : "bg-gray-300"} after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all ${settings.showCorrectAnswers ? "after:translate-x-full" : ""}`}
                          ></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="outfit-500 text-[14px] text-gray-900">
                            Show Score After Quiz
                          </div>
                          <div className="text-[12px] text-gray-500">
                            Display the score immediately after completion.
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="showScoreAfterQuiz"
                            checked={settings.showScoreAfterQuiz}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* Unassign section (when opened from ClassContent) */}
                  {viewOnly && typeof onUnassign === "function" && (
                    <section className="flex flex-col gap-3 border-t border-gray-200 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col">
                        <span className="outfit-500 text-[14px] text-gray-900">
                          Remove quiz from class
                        </span>
                        <span className="outfit-400 text-[12px] text-gray-500">
                          This quiz will no longer be assigned to this class.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleCancelClick();
                          onUnassign();
                        }}
                        className="outfit-500 cursor-pointer rounded-xl border border-red-500 bg-white px-4 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50"
                      >
                        Unassign Quiz
                      </button>
                    </section>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign to class modal (selection-only mode) */}
      <AssignToClassModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        personalQuizID={personalQuizID}
        selectionOnly={true}
        initialSelectedClassIDs={selectedClassID ? [selectedClassID] : []}
        onSelectionConfirm={({ classIDs, classes }) => {
          const first = classes?.[0];
          if (first) {
            setSelectedClassID(first.classID);
            setSelectedClassName(first.className);
            setSelectedClassPersonalQuizID(first.classPersonalQuizID ?? null);
          } else {
            setSelectedClassID(null);
            setSelectedClassName("");
            setSelectedClassPersonalQuizID(null);
          }
        }}
      />

      <DateTimeModal
        isOpen={isDateTimeModalOpen}
        onClose={() => setIsDateTimeModalOpen(false)}
        initialStart={assignmentStartDate || settings.startTime}
        initialEnd={assignmentDeadlineDate || settings.endTime}
        showToast={showToast}
        onSave={({ startTime, endTime }) => {
          setAssignmentStartDate(startTime);
          setAssignmentDeadlineDate(endTime);
          setSettings((prev) => ({
            ...prev,
            startTime,
            endTime,
          }));
          setIsDateTimeModalOpen(false);
        }}
      />
    </>
  );
};

export default QuizSettingsModal;
