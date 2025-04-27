import React, { useEffect, useState } from "react";
import RegisterDropDown from "./registerDropDown";
import Button from "./button";
import ModalDropdown from "./modalDropdown";

const PracticeExamConfig = ({ subjectID, isFormOpen, setIsFormOpen }) => {
  const [distributionError, setDistributionError] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [settings, setSettings] = useState({
    subjectID: subjectID,
    enableTimer: false,
    coverage: "midterm",
    easy_percentage: 33,
    moderate_percentage: 34,
    hard_percentage: 33,
  });
  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  const handleCancelClick = () => {
    setIsFormOpen(false); // Close the form
  };

  useEffect(() => {
    if (subjectID) {
      fetchSettings();
    }
  }, [subjectID]);

  const fetchSettings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/practice-settings/${subjectID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "difficultyMode") {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
        ...(value === "custom" && {
          percentageEasy: prev.percentageEasy || 30,
          percentageModerate: prev.percentageModerate || 50,
          percentageHard: prev.percentageHard || 20,
        }),
      }));
      setDistributionError(false); // reset error on mode switch
      return;
    }

    setSettings((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Check total if in custom mode
      if (prev.difficultyMode === "custom") {
        const total =
          parseInt(
            name === "percentageEasy" ? value : updated.percentageEasy || 0,
          ) +
          parseInt(
            name === "percentageModerate"
              ? value
              : updated.percentageModerate || 0,
          ) +
          parseInt(
            name === "percentageHard" ? value : updated.percentageHard || 0,
          );

        setDistributionError(total !== 100);
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    const totalPercentage =
      settings.easy_percentage +
      settings.moderate_percentage +
      settings.hard_percentage;

    if (totalPercentage !== 100) {
      setToast({
        message: "Percentages must total 100.",
        type: "error",
        show: true,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/practice-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectID: settings.subjectID,
          enableTimer: settings.enableTimer,
          coverage: settings.coverage,
          easy_percentage: settings.easy_percentage,
          moderate_percentage: settings.moderate_percentage,
          hard_percentage: settings.hard_percentage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({
          message: "Practice settings saved successfully.",
          type: "success",
          show: true,
        });
      } else {
        setToast({
          message: data.message || "Failed to save settings.",
          type: "error",
          show: true,
        });
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({
        message: "Something went wrong.",
        type: "error",
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    isFormOpen && (
      <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center">
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
          <ModalDropdown
            name="coverage"
            value={settings.coverage}
            onChange={handleChange}
            placeholder="Select Coverage"
            options={[
              { value: "full", label: "Full Coverage" },
              { value: "finals", label: "Finals" },
              { value: "midterm", label: "Midterm" },
            ]}
          />

          {/* divider */}
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

          {/* Difficulty Selector */}
          <div className="mb-2">
            <label className="font-color-gray mb-2 block text-[12px]">
              Difficulty Distribution
            </label>
            <ModalDropdown
              name="difficultyMode"
              value={settings.difficultyMode}
              onChange={handleChange}
              options={[
                {
                  value: "default",
                  label: "Default: Easy 30%, Moderate 50%, Hard 20%",
                },
                { value: "custom", label: "Custom: Must equal to 100%" },
              ]}
            />
          </div>

          {/* Custom Distribution - show only when 'custom' is selected */}
          {settings.difficultyMode === "custom" && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] text-gray-600">
                    Easy
                  </label>
                  <input
                    type="number"
                    name="percentageEasy"
                    value={settings.percentageEasy}
                    className="border-color w-full rounded border px-2 py-[6px] text-[12px] transition-all duration-200 ease-in-out focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    onChange={handleChange}
                    placeholder="Enter Percentage"
                    onWheel={(e) => e.target.blur()}
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] text-gray-600">
                    Moderate
                  </label>
                  <input
                    type="number"
                    name="percentageModerate"
                    value={settings.percentageModerate}
                    onChange={handleChange}
                    className="border-color w-full rounded border px-2 py-[6px] text-[12px] transition-all duration-200 ease-in-out focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Enter Percentage"
                    onWheel={(e) => e.target.blur()}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-gray-600">
                    Hard
                  </label>
                  <input
                    type="number"
                    name="percentageHard"
                    value={settings.percentageHard}
                    onChange={handleChange}
                    className="border-color w-full rounded border px-2 py-[6px] text-[12px] transition-all duration-200 ease-in-out focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Enter Percentage"
                    onWheel={(e) => e.target.blur()}
                    max="100"
                  />
                </div>
              </div>
            </div>
          )}

          {distributionError && (
            <p className="justify-center text-center text-[12px] text-red-500">
              Total percentage must equal 100%.
            </p>
          )}

          <div className="-mx-2 mt-6 mb-1 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

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
              <span className="hidden pr-1.5 text-[14px] sm:inline">Done</span>
            </button>
          </div>
        </form>
        {toast.message && (
          <div
            className={`fixed bottom-5 left-5 z-56 rounded px-4 py-2 text-sm text-white shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"} ${toast.show ? "opacity-80" : "opacity-0"} transition-opacity duration-900 ease-in-out`}
          >
            {toast.message}
          </div>
        )}
      </div>
    )
  );
};

export default PracticeExamConfig;
