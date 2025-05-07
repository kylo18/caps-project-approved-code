import React, { useState, useEffect } from "react";
import ModalDropdown from "./modalDropdown";
import LoadingOverlay from "./loadingOverlay";

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

  const [settings, setSettings] = useState({
    subjectID: subjectID,
    enableTimer: false,
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

    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/practice-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        // Reset settings to default after successful submission
        setSettings({
          subjectID: subjectID,
          enableTimer: false,
          coverage: "midterm",
          easy_percentage: 30,
          moderate_percentage: 50,
          hard_percentage: 20,
        });
        setMode("default");

        if (onSuccess) onSuccess();
        setIsFormOpen(false);

        setErrorMessage("");
      } else {
        setErrorMessage(`${data.message}`);
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
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Configure Practice Exam</span>
          </div>
          <form
            onSubmit={handleSubmit}
            className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4"
          >
            <span className="font-color-gray mb-2 block text-[12px]">
              Coverage
            </span>
            <div>
              <ModalDropdown
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
                onChange={handleChange}
                className="size-3 rounded bg-orange-500 text-white checked:border-transparent checked:bg-orange-500 focus:ring-orange-400"
                style={{ accentColor: "red" }} // for browser compatibility
              />
              <span className="font-color-gray ml-2 text-[14px]">
                Enable Timer
              </span>
            </label>

            <div className="mt-3 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

            <div className="mb-2">
              <label className="font-color-gray mb-2 block text-[12px]">
                Difficulty Distribution
              </label>
              <ModalDropdown
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

            {errorMessage && (
              <div className="mt-2 justify-center text-center text-[12px] text-red-500">
                {errorMessage}
              </div>
            )}

            <div className="-mx-2 mt-5 mb-1 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelClick}
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-3 py-[7px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
              >
                <span className="px-1 text-[16px]">Cancel</span>
              </button>
              <button
                type="submit"
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-3 py-[7px] text-white transition-all duration-150 hover:bg-orange-700"
              >
                <i className={`bx bx-check-double text-[20px]`}></i>
                <span className="pr-1.5 text-[14px]">Save</span>
              </button>
            </div>
          </form>
          {isEditing && <LoadingOverlay show={isEditing} />}
        </div>
      )}
    </>
  );
};

export default PracticeExamConfig;
