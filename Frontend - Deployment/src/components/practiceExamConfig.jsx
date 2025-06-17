import React, { useState, useEffect } from "react";
import RegisterDropDownSmall from "./registerDropDownSmall";
// Form to COnfigure Practice Exam Settings
const PracticeExamConfig = ({
  subjectID,
  isFormOpen,
  setIsFormOpen,
  onSuccess,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [mode, setMode] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  // Fetch current settings when form opens
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      if (isFormOpen && subjectID) {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${apiUrl}/practice-settings/${subjectID}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            if (result.data) {
              // Update settings with fetched data
              setSettings({
                subjectID: result.data.subjectID,
                isEnabled: result.data.isEnabled,
                enableTimer: result.data.duration_minutes > 0,
                duration_minutes: result.data.duration_minutes || 30,
                coverage: result.data.coverage,
                easy_percentage: result.data.easy_percentage,
                moderate_percentage: result.data.moderate_percentage,
                hard_percentage: result.data.hard_percentage,
                total_items: result.data.total_items || 100,
              });

              // Set mode based on percentages and update the dropdown
              const isDefaultDistribution =
                result.data.easy_percentage === 30 &&
                result.data.moderate_percentage === 50 &&
                result.data.hard_percentage === 20;

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
            }
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
          setErrorMessage("Failed to load current settings");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCurrentSettings();
  }, [isFormOpen, subjectID, apiUrl]);

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
      setErrorMessage("Total percentage must equal 100%.");
      setIsEditing(false);
      return;
    }

    if (
      settings.enableTimer &&
      (!settings.duration_minutes || settings.duration_minutes < 1)
    ) {
      setErrorMessage(
        "Please provide a valid timer duration (at least 1 minute).",
      );
      setIsEditing(false);
      return;
    }

    if (
      !settings.total_items ||
      settings.total_items < 1 ||
      settings.total_items > 100
    ) {
      setErrorMessage("Total items must be between 1 and 100.");
      setIsEditing(false);
      return;
    }

    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication token not found. Please log in again.");
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
        // Reset settings after success
        setSettings({
          subjectID: subjectID,
          isEnabled: true,
          enableTimer: false,
          duration_minutes: 30,
          coverage: "midterm",
          easy_percentage: 30,
          moderate_percentage: 50,
          hard_percentage: 20,
          total_items: 100,
        });
        if (onSuccess) onSuccess();
        setIsFormOpen(false);
        setErrorMessage("");
      } else {
        const errorMsg =
          data.message || data.error || "Failed to save settings.";
        console.error("Server error:", errorMsg);
        setErrorMessage(errorMsg);
      }
    } catch (err) {
      console.error("Error details:", err);
      setErrorMessage(
        err.message || "Something went wrong. Please try again later.",
      );
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelClick = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      {/* Form Display - Inside isFormOpen condition */}
      {isFormOpen && (
        <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
          <div className="relative mx-0 w-full max-w-[480px] rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-2 min-[448px]:rounded-md">
            <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
              <h2 className="text-[14px] font-medium text-gray-700">
                Configure Practice Exam
              </h2>

              <button
                onClick={handleCancelClick}
                className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                title="Close"
              >
                <i className="bx bx-x text-[20px]"></i>
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
                    <label className="mb-2 ml-2 block cursor-pointer">
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
                            label: "Default: Easy 30%, Moderate 50%, Hard 20%",
                          },
                          {
                            value: "custom",
                            label: "Custom: Must equal to 100%",
                          },
                        ]}
                      />
                      <div className="mt-[3px] text-start text-[11px] text-gray-400">
                        Choose how to distribute question difficulty. You can
                        use the default settings or customize the number of
                        easy, moderate, and hard questions of the subject.
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

                    {errorMessage && (
                      <div className="mt-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                        {errorMessage}
                      </div>
                    )}

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
    </>
  );
};

export default PracticeExamConfig;
