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
    enableTimer: false,
    duration_minutes: 30,
    coverage: "midterm",
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");

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
          enableTimer: false,
          duration_minutes: 30,
          coverage: "midterm",
          easy_percentage: 30,
          moderate_percentage: 50,
          hard_percentage: 20,
        });
        if (onSuccess) onSuccess();
        setIsFormOpen(false);
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again later.");
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
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 sm:rounded-t-md">
            <span>Configure Practice Test Settings</span>
          </div>

          {/* Form Inputs */}
          <form
            onSubmit={handleSubmit}
            className="border-color relative mx-auto w-full max-w-md border border-t-0 bg-white p-2 min-[448px]:rounded-b-md min-[448px]:px-4"
          >
            <span className="font-color-gray mb-2 block text-[12px]">
              Coverage
            </span>
            <div>
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
            <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

            <label className="mb-2 ml-2 block cursor-pointer">
              <input
                type="checkbox"
                name="enableTimer"
                checked={settings.enableTimer}
                onChange={(e) =>
                  setSettings({ ...settings, enableTimer: e.target.checked })
                }
                className="size-3 rounded bg-orange-500 text-white checked:border-transparent checked:bg-orange-500 focus:ring-orange-400"
                style={{ accentColor: "red" }}
              />
              <span className="font-color-gray ml-2 text-[14px]">
                Enable Timer
              </span>
            </label>

            {settings.enableTimer && (
              <div>
                <div className="relative w-full">
                  <div className="relative">
                    <input
                      className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      type="number"
                      min={1}
                      max={240}
                      value={settings.duration_minutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          duration_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <label
                      htmlFor="Timer Duration (Minutes)"
                      className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Timer Duration (Minutes)
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

            <div className="mb-2">
              <label className="font-color-gray mb-2 block text-[12px]">
                Difficulty Distribution
              </label>
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
                  { value: "custom", label: "Custom: Must equal to 100%" },
                ]}
              />
            </div>

            {mode === "custom" && (
              <div className="grid grid-cols-3 gap-4">
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
                          [e.target.name]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="border-color w-full rounded border px-2 py-[6px] text-[12px] transition-all duration-200 ease-in-out focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="-mx-2 mt-5 mb-1 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />
            {errorMessage && (
              <div className="mb-3 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelClick}
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-3 py-[7px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
              >
                <span className="px-1 text-[14px]">Cancel</span>
              </button>
              <button
                type="submit"
                className="mt-3 mb-2 flex w-[80px] cursor-pointer items-center justify-center gap-1 rounded-md bg-orange-500 px-3 py-[7px] text-[14px] text-white transition-all duration-150 hover:bg-orange-700"
              >
                {isEditing ? (
                  <div className="flex items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default PracticeExamConfig;
