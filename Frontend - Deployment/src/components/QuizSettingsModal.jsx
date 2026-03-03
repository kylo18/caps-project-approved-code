import React, { useState, useEffect, useRef } from "react";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const QuizSettingsModal = ({
  personalQuizID,
  isFormOpen,
  setIsFormOpen,
  onSuccess,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for quiz settings
  const [settings, setSettings] = useState({
    startTime: "",
    endTime: "",
    quizAttempts: "",
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

  // Fetch current settings when form opens
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      // Only fetch once when modal opens and we have a quiz ID
      if (!isFormOpen || !personalQuizID || hasFetchedRef.current) {
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
          `${apiUrl}/personal-quizzes/${personalQuizID}/settings`,
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
            setSettings({
              startTime: setting.startTime
                ? (() => {
                    // Handle format: "2026-02-20 08:00:00" or "2026-02-20"
                    let dateStr = setting.startTime.trim();
                    if (dateStr.includes(" ")) {
                      // Format: "2026-02-20 08:00:00" - extract date and time parts
                      const [datePart, timePart] = dateStr.split(" ");
                      const [hours, minutes] = timePart.split(":");
                      // Format for datetime-local: YYYY-MM-DDTHH:mm
                      return `${datePart}T${hours}:${minutes}`;
                    } else {
                      // Format: "2026-02-20" - add default time
                      return dateStr + "T00:00";
                    }
                  })()
                : "",
              endTime: setting.endTime
                ? (() => {
                    // Handle format: "2026-02-20 08:00:00" or "2026-02-20"
                    let dateStr = setting.endTime.trim();
                    if (dateStr.includes(" ")) {
                      // Format: "2026-02-20 08:00:00" - extract date and time parts
                      const [datePart, timePart] = dateStr.split(" ");
                      const [hours, minutes] = timePart.split(":");
                      // Format for datetime-local: YYYY-MM-DDTHH:mm
                      return `${datePart}T${hours}:${minutes}`;
                    } else {
                      // Format: "2026-02-20" - add default time
                      return dateStr + "T00:00";
                    }
                  })()
                : "",
              quizAttempts: setting.quizAttempts || "",
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
          }
        } else if (response.status === 404) {
          // No settings found, use defaults - this is fine, don't show error
          setSettings({
            startTime: "",
            endTime: "",
            quizAttempts: "",
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
          // Only show error for non-404 errors
          const errorData = await response.json().catch(() => ({}));
          console.error("Error fetching settings:", errorData);
          // Don't show toast for 404 or other errors - just use defaults
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        // Don't show error toast - just use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSettings();
  }, [isFormOpen, personalQuizID, apiUrl]);

  // Reset fetch flag when modal closes
  useEffect(() => {
    if (!isFormOpen) {
      hasFetchedRef.current = false;
    }
  }, [isFormOpen]);

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
    if (settings.startTime && settings.endTime) {
      const start = new Date(settings.startTime);
      const end = new Date(settings.endTime);
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

      // Prepare payload - only send non-empty values
      const payload = {};
      if (settings.startTime) {
        // Extract date in YYYY-MM-DD format
        const date = new Date(settings.startTime);
        payload.startTime = date.toISOString().split("T")[0];
      }
      if (settings.endTime) {
        // Extract date in YYYY-MM-DD format
        const date = new Date(settings.endTime);
        payload.endTime = date.toISOString().split("T")[0];
      }
      if (settings.quizAttempts)
        payload.quizAttempts = parseInt(settings.quizAttempts);
      if (settings.quizTimerEnabled && settings.quizTimer) {
        payload.quizTimer = parseInt(settings.quizTimer);
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
        `${apiUrl}/personal-quizzes/${personalQuizID}/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Quiz settings saved successfully.", "success");
        if (onSuccess) onSuccess();
        setIsFormOpen(false);
      } else {
        const errorMsg =
          data.message || data.error || "Failed to save settings.";
        showToast(errorMsg, "error");
      }
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
      {/* Mobile Modal */}
      <div className="block sm:hidden">
        {isFormOpen && (
          <div className="outfit bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div
              className="absolute inset-0 z-0"
              onClick={handleCancelClick}
              style={{ background: "transparent" }}
            />
            <div className="animate-fade-in-up relative z-10 mx-0 w-full max-w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black sm:text-[14px]">
                  Quiz Settings
                </h2>
                <button
                  onClick={handleCancelClick}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>
              <div className="edit-profile-modal-scrollbar max-h-[calc(90vh-60px)] overflow-y-auto">
                <form className="px-5 py-4" onSubmit={handleSubmit}>
                  {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="loader"></span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Quiz Attempts */}
                      <div className="mb-4">
                        <label className="mb-1 block text-[12px] text-gray-700">
                          Quiz Attempts (Max)
                        </label>
                        <input
                          type="number"
                          name="quizAttempts"
                          min={1}
                          value={settings.quizAttempts}
                          onChange={handleChange}
                          placeholder="Unlimited if empty"
                          className="w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                        />
                      </div>
                      <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                      {/* Timer Settings */}
                      <div className="mb-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[14px] text-gray-700">
                            Enable Timer
                          </span>
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
                        </div>
                        {settings.quizTimerEnabled && (
                          <div>
                            <label className="mb-1 block text-[12px] text-gray-700">
                              Timer Duration (Minutes)
                            </label>
                            <input
                              type="number"
                              name="quizTimer"
                              min={1}
                              value={settings.quizTimer}
                              onChange={handleChange}
                              className="w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                      {/* Shuffle Settings */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-gray-700">
                            Shuffle Questions
                          </span>
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
                          <span className="text-[14px] text-gray-700">
                            Shuffle Choices
                          </span>
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
                      <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                      {/* Display Settings */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-gray-700">
                            Show Correct Question
                          </span>
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
                          <span
                            className={`text-[14px] ${!settings.showCorrectQuestion ? "text-gray-400" : "text-gray-700"}`}
                          >
                            Show Correct Answers
                          </span>
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
                          <span className="text-[14px] text-gray-700">
                            Show Score After Quiz
                          </span>
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
                      <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                      {/* Submission Settings */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-gray-700">
                            Auto Submit On Timeout
                          </span>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              name="autoSubmitOnTimeout"
                              checked={settings.autoSubmitOnTimeout}
                              onChange={handleChange}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-gray-700">
                            Allow Late Submission
                          </span>
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
                      </div>

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={isEditing}
                          className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <span className="loader-white"></span>
                            </div>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Modal */}
      <div className="hidden sm:flex">
        {(isFormOpen || showModal) && (
          <div
            className={`outfit bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex justify-end transition-opacity duration-200 ${isFormOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <div
              className="absolute inset-0 z-0"
              onClick={handleCancelClick}
              style={{ background: "transparent" }}
            />
            <div
              className={`slide-in-right relative z-10 flex h-full w-[600px] min-w-[350px] transform flex-col bg-white shadow-2xl transition-all duration-300 ${
                isFormOpen ? "" : "pointer-events-none translate-x-8 opacity-0"
              }`}
            >
              <div className="border-color flex w-full items-center justify-between border-b px-5 py-2">
                <h2 className="text-[17px] leading-none font-semibold text-black">
                  Quiz Settings
                </h2>
                <button
                  onClick={handleCancelClick}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition duration-100 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                  title="Close"
                  type="button"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>

              <div className="custom-scrollbar flex min-h-screen flex-1 flex-col overflow-y-auto px-5 py-4 pb-24">
                {loading && (
                  <div className="bg-opacity-70 absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-white">
                    <span className="loader"></span>
                  </div>
                )}
                {!loading && (
                  <form
                    className="mx-auto max-w-xl"
                    onSubmit={handleSubmit}
                    id="quizSettingsForm"
                  >
                    {/* Availability Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-[16px] font-semibold text-gray-900">
                        Availability
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="text-[12px] font-semibold text-gray-900">
                              Start Time
                            </div>
                            <div className="text-[10px] text-gray-500">
                              When the quiz becomes available.
                            </div>
                          </div>
                          <input
                            type="datetime-local"
                            name="startTime"
                            value={settings.startTime}
                            onChange={handleChange}
                            className="w-48 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="text-[12px] font-semibold text-gray-900">
                              End Time
                            </div>
                            <div className="text-[10px] text-gray-500">
                              When the quiz becomes unavailable.
                            </div>
                          </div>
                          <input
                            type="datetime-local"
                            name="endTime"
                            value={settings.endTime}
                            onChange={handleChange}
                            className="w-48 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="-mx-5 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Quiz Attempts */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-[12px] font-semibold text-gray-900">
                          Quiz Attempts
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Maximum number of attempts allowed (leave empty for
                          unlimited).
                        </div>
                      </div>
                      <input
                        type="number"
                        name="quizAttempts"
                        min={1}
                        value={settings.quizAttempts}
                        onChange={handleChange}
                        className="w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                    <div className="-mx-5 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Timer Settings */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-[16px] font-semibold text-gray-900">
                        Timer Settings
                      </h3>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-[12px] font-semibold text-gray-900">
                            Enable Timer
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Set a time limit for the quiz.
                          </div>
                        </div>
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
                      </div>
                      {settings.quizTimerEnabled && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="text-[12px] font-semibold text-gray-900">
                              Timer Duration (Minutes)
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Set the duration for the timer.
                            </div>
                          </div>
                          <input
                            type="number"
                            name="quizTimer"
                            min={1}
                            value={settings.quizTimer}
                            onChange={handleChange}
                            className="w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                    <div className="-mx-5 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Shuffle Settings */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-[16px] font-semibold text-gray-900">
                        Shuffle Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-gray-900">
                              Shuffle Questions
                            </div>
                            <div className="text-[10px] text-gray-500">
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
                            <div className="text-[12px] font-semibold text-gray-900">
                              Shuffle Choices
                            </div>
                            <div className="text-[10px] text-gray-500">
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
                    </div>
                    <div className="-mx-5 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Display Settings */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-[16px] font-semibold text-gray-900">
                        Display Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-gray-900">
                              Show Correct Question
                            </div>
                            <div className="text-[10px] text-gray-500">
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
                              className={`text-[12px] font-semibold ${!settings.showCorrectQuestion ? "text-gray-400" : "text-gray-900"}`}
                            >
                              Show Correct Answers
                            </div>
                            <div
                              className={`text-[10px] ${!settings.showCorrectQuestion ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Display correct answers after submission (requires
                              Show Correct Question).
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
                            <div className="text-[12px] font-semibold text-gray-900">
                              Show Score After Quiz
                            </div>
                            <div className="text-[10px] text-gray-500">
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
                    </div>
                    <div className="-mx-5 mb-6 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Submission Settings */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-[16px] font-semibold text-gray-900">
                        Submission Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-gray-900">
                              Auto Submit On Timeout
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Automatically submit when timer expires.
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              name="autoSubmitOnTimeout"
                              checked={settings.autoSubmitOnTimeout}
                              onChange={handleChange}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-gray-900">
                              Allow Late Submission
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Allow submissions after the end time.
                            </div>
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
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer with Save button */}
              <div className="border-color absolute right-0 bottom-0 left-0 flex w-full items-center justify-end bg-white px-8 py-3">
                <button
                  type="submit"
                  form="quizSettingsForm"
                  disabled={isEditing}
                  className={`h-9 w-32 cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                >
                  {isEditing ? (
                    <div className="flex items-center justify-center">
                      <span className="loader-white"></span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizSettingsModal;
