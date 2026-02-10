import React, { useState, useEffect, useRef } from "react";
// Inline custom dropdown for Coverage and Difficulty Distribution
import {
  useRef as useLocalRef,
  useState as useLocalState,
  useEffect as useLocalEffect,
} from "react";
// Form to COnfigure Practice Exam Settings
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import RegisterDropDownSmall from "./registerDropDownSmall";
const PracticeExamConfig = ({
  subjectID,
  isFormOpen,
  setIsFormOpen,
  onSuccess,
  practiceExamSettings,
  setPracticeExamSettings,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [mode, setMode] = useState("default");
  const [isEditing, setIsEditing] = useState(false);

  // State of Practice Settings
  const [settings, setSettings] = useState({
    subjectID: subjectID,
    isEnabled: false,
    enableTimer: false,
    duration_minutes: 30,
    coverage: "midterm",
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
    total_items: 100,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Local dropdown state for Coverage
  const [isCoverageOpen, setIsCoverageOpen] = useLocalState(false);
  const coverageDropdownRef = useLocalRef(null);
  const coverageButtonRef = useLocalRef(null);

  useLocalEffect(() => {
    const handleClickOutside = (event) => {
      if (
        coverageDropdownRef.current &&
        !coverageDropdownRef.current.contains(event.target)
      ) {
        setIsCoverageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Local dropdown state for Difficulty
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

  // Fetch current settings when form opens
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      if (isFormOpen && subjectID) {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");

          // Fetch practice settings
          const practiceResponse = await fetch(
            `${apiUrl}/practice-settings/${subjectID}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (practiceResponse.ok) {
            const practiceResult = await practiceResponse.json();

            console.log("Practice settings response:", practiceResult);

            if (practiceResult.data) {
              // Update settings with fetched data
              setSettings({
                subjectID: practiceResult.data.subjectID,
                isEnabled: practiceResult.data.isEnabled,
                enableTimer: practiceResult.data.duration_minutes > 0,
                duration_minutes: practiceResult.data.duration_minutes || 30,
                coverage: practiceResult.data.coverage,
                easy_percentage: practiceResult.data.easy_percentage,
                moderate_percentage: practiceResult.data.moderate_percentage,
                hard_percentage: practiceResult.data.hard_percentage,
                total_items: practiceResult.data.total_items || 100,
              });

              // Set mode based on percentages and update the dropdown
              const isDefaultDistribution =
                practiceResult.data.easy_percentage === 30 &&
                practiceResult.data.moderate_percentage === 50 &&
                practiceResult.data.hard_percentage === 20;

              setMode(isDefaultDistribution ? "default" : "custom");

              // If it's custom, ensure the custom distribution is visible
              if (!isDefaultDistribution) {
                // Force a small delay to ensure the mode change is processed
                setTimeout(() => {
                  const customOption = document.querySelector(
                    'select[name="difficultyMode"] option[value="custom"]',
                  );
                  if (customOption) {
                    customOption.selected = true;
                  }
                }, 0);
              }
            } else {
              console.log("No practice settings data found");
            }
          } else {
            console.log("Practice response status:", practiceResponse.status);
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
          showToast("Failed to load current settings", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCurrentSettings();
  }, [isFormOpen, subjectID, apiUrl]);

  const { toast, showToast } = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseInt(value) || value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    const total =
      settings.easy_percentage +
      settings.moderate_percentage +
      settings.hard_percentage;

    if (total !== 100) {
      showToast("Total percentage must equal 100%.", "error");
      setIsEditing(false);
      return;
    }

    if (
      settings.enableTimer &&
      (!settings.duration_minutes || settings.duration_minutes < 1)
    ) {
      showToast(
        "Please provide a valid timer duration (at least 1 minute).",
        "error",
      );
      setIsEditing(false);
      return;
    }

    if (
      !settings.total_items ||
      settings.total_items < 1 ||
      settings.total_items > 100
    ) {
      showToast("Total items must be between 1 and 100.", "error");
      setIsEditing(false);
      return;
    }

    // setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast(
          "Authentication token not found. Please log in again.",
          "error",
        );
        setIsEditing(false);
        return;
      }

      // Ensure duration_minutes is set correctly before sending
      const payload = {
        ...settings,
        duration_minutes: settings.enableTimer ? settings.duration_minutes : 0,
      };

      const res = await fetch(`${apiUrl}/practice-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Unexpected response format: " + text.slice(0, 100));
      }

      if (res.ok) {
        // Update parent state with the saved settings
        if (setPracticeExamSettings) {
          setPracticeExamSettings((prev) => ({
            ...prev,
            [subjectID]: payload,
          }));
        }
        if (onSuccess) onSuccess();
        setIsFormOpen(false);
        // setErrorMessage("");
      } else {
        const errorMsg =
          data.message || data.error || "Failed to save settings.";
        console.error("Server error:", errorMsg);
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

  // Remove tab state
  // const [activeTab, setActiveTab] = useState("practice");

  // Refs for scrolling
  const practiceRef = useRef(null);

  // Track which section is active for sidebar indicator
  // const [activeSection, setActiveSection] = useState("practice");
  // const [scrollLock, setScrollLock] = useState(false);

  // Update active section on scroll
  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (scrollLock) return;
  //     if (!qeRef.current || !practiceRef.current) return;
  //     const qeTop = qeRef.current.getBoundingClientRect().top;
  //     const practiceTop = practiceRef.current.getBoundingClientRect().top;
  //     if (qeTop < 120 && practiceTop > 120) {
  //       setActiveSection("qe");
  //     } else if (practiceTop < 120) {
  //       setActiveSection("practice");
  //     }
  //   };
  //   // Attach scroll listener to the scrollable content area
  //   const scrollable = document.querySelector(".practice-config-scrollable");
  //   if (scrollable) {
  //     scrollable.addEventListener("scroll", handleScroll);
  //   }
  //   return () => {
  //     if (scrollable) {
  //       scrollable.removeEventListener("scroll", handleScroll);
  //     }
  //   };
  // }, [scrollLock]);

  // Scroll handler
  // const handleSidebarScroll = (section) => {
  //   if (section === "qe" && qeRef.current) {
  //     setScrollLock(true);
  //     setActiveSection("qe");
  //     qeRef.current.scrollIntoView({ behavior: "smooth" });
  //     setTimeout(() => setScrollLock(false), 400);
  //   } else if (section === "practice" && practiceRef.current) {
  //     setScrollLock(true);
  //     setActiveSection("practice");
  //     practiceRef.current.scrollIntoView({ behavior: "smooth" });
  //     setTimeout(() => setScrollLock(false), 400);
  //   }
  // };

  // Animation state for modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isFormOpen) {
      setShowModal(true);
    } else {
      // Delay unmount for animation
      const timeout = setTimeout(() => setShowModal(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [isFormOpen]);

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      {/* Mobile Modal: visible on small screens only */}
      <div className="block sm:hidden">
        {/* Form Display - Inside isFormOpen condition */}
        {isFormOpen && (
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            {/* Overlay click handler for closing modal on outside click */}
            <div
              className="absolute inset-0 z-0"
              onClick={handleCancelClick}
              style={{ background: "transparent" }}
            />
            <div className="animate-fade-in-up relative z-10 mx-0 w-full max-w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black sm:text-[14px]">
                  Subject Settings
                </h2>
                <button
                  onClick={handleCancelClick}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>
              {/* Form Inputs */}
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
                      <label className="mb-2 block cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="block text-[14px] text-gray-700">
                            Enable Practice Exam
                          </span>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              name="isEnabled"
                              checked={settings.isEnabled}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  isEnabled: e.target.checked,
                                })
                              }
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                      </label>
                      <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                      <div
                        className={`grid grid-cols-2 gap-4 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <div>
                          <div className="relative">
                            <span className="block text-start text-[14px] text-gray-700">
                              Total Items
                            </span>
                            <input
                              className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                              type="number"
                              min={1}
                              max={100}
                              value={settings.total_items}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  total_items:
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <span className="mb-1 block text-start text-[14px] text-gray-700">
                            Coverage
                          </span>
                          <RegisterDropDownSmall
                            name="coverage"
                            value={settings.coverage}
                            onChange={handleChange}
                            placeholder="Select Coverage"
                            options={[
                              { value: "full", label: "Full Coverage" },
                              { value: "final", label: "Finals" },
                              { value: "midterm", label: "Midterm" },
                            ]}
                          />
                        </div>
                      </div>
                      <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                      <div
                        className={`flex items-center justify-between ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <span className="text-[14px] text-gray-700">
                          Enable Timer
                        </span>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="enableTimer"
                            checked={settings.enableTimer}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                enableTimer: e.target.checked,
                              })
                            }
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                      {settings.enableTimer && (
                        <div
                          className={`mt-2 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                        >
                          <div className="relative">
                            <span className="mb-1 block text-start text-[14px] text-gray-700">
                              Timer Duration (Minutes)
                            </span>
                            <input
                              className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                              type="number"
                              min={1}
                              max={240}
                              value={settings.duration_minutes}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  duration_minutes:
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || 0,
                                })
                              }
                            />
                            <div className="mt-[3px] text-start text-[11px] text-gray-400">
                              Maximum of 240 minutes
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                      <div
                        className={`mb-2 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <span className="mt-2 mb-2 block text-[14px] text-gray-700">
                          Difficulty Distribution
                        </span>
                        <RegisterDropDownSmall
                          name="difficultyMode"
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
                          options={[
                            {
                              value: "default",
                              label:
                                "Default: Easy 30%, Moderate 50%, Hard 20%",
                            },
                            {
                              value: "custom",
                              label: "Custom: Must equal to 100%",
                            },
                          ]}
                        />
                        <div className="mt-[3px] mb-2 text-start text-[11px] text-gray-400">
                          Customize the number of easy, moderate, and hard
                          questions, or keep the default configuration
                          (30%,50%,20%).
                        </div>
                      </div>
                      {mode === "custom" && (
                        <div
                          className={`grid grid-cols-3 gap-4 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                        >
                          {["easy", "moderate", "hard"].map((level) => (
                            <div key={level}>
                              <label className="mb-1 block text-[12px] text-gray-600 capitalize">
                                {level} (%)
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
                                className="mb-2 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                min="0"
                                max="100"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                      {/* Error message block removed as errorMessage is not used in this version */}
                      <div>
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
      {/* Desktop Modal: hidden on small screens, visible on sm+ */}
      <div className="hidden sm:flex">
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        {(isFormOpen || showModal) && (
          <div
            className={`open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex justify-end transition-opacity duration-200 ${isFormOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {/* Overlay click handler for closing modal on outside click */}
            <div
              className="absolute inset-0 z-0"
              onClick={handleCancelClick}
              style={{ background: "transparent" }}
            />
            {/* Modal with full-width header */}
            <div
              className={`slide-in-right relative z-10 flex h-full w-[700px] min-w-[350px] transform flex-col bg-white shadow-2xl transition-all duration-300 ${
                isFormOpen ? "" : "pointer-events-none translate-x-8 opacity-0"
              }`}
            >
              {/* Compact Header across the whole modal */}
              <div className="border-color flex w-full items-center justify-between border-b px-5 py-2">
                <h2 className="text-[17px] leading-none font-semibold text-black">
                  Subject Settings
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

              <div className="flex h-0 flex-1">
                {/* Sidebar removed (no QE/practice nav) */}
                {/* Right Panel */}
                <div className="practice-config-scrollable custom-scrollbar flex min-h-screen flex-1 flex-col overflow-y-auto px-5 py-4 pb-24">
                  {/* One loader for the entire settings panel */}
                  {loading && (
                    <div className="bg-opacity-70 absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-white">
                      <span className="loader"></span>
                    </div>
                  )}
                  {/* Practice Exam Section only */}
                  {!loading && (
                    <>
                      <div ref={practiceRef} className="scroll-mt-[16px]">
                        <form
                          className="mx-auto max-w-xl"
                          onSubmit={handleSubmit}
                          id="practiceExamSettingsForm"
                        >
                          {/* Enable Practice Exam */}
                          <div className="mb-6 flex items-center justify-between">
                            <div>
                              <div className="text-[12px] font-semibold text-gray-900">
                                Enable Practice Exam
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Allow students to take a practice exam for this
                                subject.
                              </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                name="isEnabled"
                                checked={settings.isEnabled}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    isEnabled: e.target.checked,
                                  })
                                }
                                className="peer sr-only"
                              />
                              <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>
                          {/* Total Items */}
                          <div
                            className={`mb-6 flex items-center justify-between gap-4 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="text-[12px] font-semibold text-gray-900">
                                Total Items
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Set the total number of questions for the
                                practice exam (1-100).
                              </div>
                            </div>
                            <input
                              className="peer w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                              type="number"
                              min={1}
                              max={100}
                              value={settings.total_items}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  total_items:
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          {/* Coverage */}
                          <div
                            className={`mb-6 flex items-center justify-between gap-4 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="text-[12px] font-semibold text-gray-900">
                                Coverage
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Select the coverage for the practice exam.
                              </div>
                            </div>
                            <div className="relative" ref={coverageDropdownRef}>
                              <button
                                ref={coverageButtonRef}
                                type="button"
                                onClick={() =>
                                  setIsCoverageOpen((prev) => !prev)
                                }
                                className={`relative flex w-32 cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-[7px] text-[12px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:outline-none ${isCoverageOpen ? "border-none ring-1 ring-orange-500 ring-offset-1" : ""}`}
                              >
                                <span
                                  className={`truncate ${!settings.coverage ? "text-gray-500" : ""}`}
                                >
                                  {settings.coverage === "full"
                                    ? "Full Coverage"
                                    : settings.coverage === "final"
                                      ? "Finals"
                                      : settings.coverage === "midterm"
                                        ? "Midterm"
                                        : "Select Coverage"}
                                </span>
                                <i
                                  className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isCoverageOpen ? "rotate-180" : "rotate-0"}`}
                                ></i>
                              </button>
                              {isCoverageOpen && (
                                <ul className="animate-dropdown animate-fadein custom-scrollbar absolute top-full right-[-8px] z-10 mx-2 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border border-gray-300 bg-white p-1 shadow-lg">
                                  {[
                                    { value: "full", label: "Full Coverage" },
                                    { value: "final", label: "Finals" },
                                    { value: "midterm", label: "Midterm" },
                                  ].map((option) => (
                                    <li
                                      key={option.value}
                                      onClick={() => {
                                        handleChange({
                                          target: {
                                            name: "coverage",
                                            value: option.value,
                                          },
                                        });
                                        setIsCoverageOpen(false);
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
                          {/* Enable Timer */}
                          <div
                            className={`mb-6 flex items-center justify-between ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <div>
                              <div className="text-[12px] font-semibold text-gray-900">
                                Enable Timer
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Set a time limit for the practice exam.
                              </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                name="enableTimer"
                                checked={settings.enableTimer}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    enableTimer: e.target.checked,
                                  })
                                }
                                className="peer sr-only"
                              />
                              <div className="peer h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-orange-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>
                          {/* Timer Duration */}
                          <div
                            className={`mb-6 flex items-center justify-between gap-4 ${!settings.isEnabled || !settings.enableTimer ? "pointer-events-none opacity-50" : settings.isEnabled ? "" : "pointer-events-none opacity-50"}`}
                          >
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="text-[12px] font-semibold text-gray-900">
                                Timer Duration (Minutes)
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Set the duration for the timer (1-240 minutes).
                              </div>
                            </div>
                            <input
                              className="peer w-32 rounded-xl border border-gray-300 px-4 py-[7px] text-[12px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                              type="number"
                              min={1}
                              max={240}
                              value={settings.duration_minutes}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  duration_minutes:
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || 0,
                                })
                              }
                              disabled={
                                !settings.isEnabled || !settings.enableTimer
                              }
                            />
                          </div>
                          {/* Difficulty Distribution */}
                          <div
                            className={`mb-6 flex items-center justify-between gap-4 ${!settings.isEnabled ? "pointer-events-none opacity-50" : ""}`}
                          >
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
                          {/* Custom Difficulty Inputs */}
                          <div
                            className={`mb-6 flex flex-col gap-2 ${!settings.isEnabled || mode !== "custom" ? "pointer-events-none opacity-50" : settings.isEnabled ? "" : "pointer-events-none opacity-50"}`}
                          >
                            <div className="mb-1 text-[12px] font-semibold text-gray-900">
                              Custom Difficulty Percentages
                            </div>
                            <div className="-mt-2 mb-2 text-[10px] text-gray-500">
                              Set the percentage for each difficulty. Total must
                              equal 100%.
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
                                  disabled={
                                    !settings.isEnabled || mode !== "custom"
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          {/* Error Message */}
                          {/* {errorMessage && (
                            <div className="mt-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                              {errorMessage}
                            </div>
                          )} */}
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Absolute Footer with Save button */}
              <div className="border-color absolute right-0 bottom-0 left-0 flex w-full items-center justify-end bg-white px-8 py-3">
                <button
                  type="submit"
                  form="practiceExamSettingsForm"
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

export default PracticeExamConfig;
