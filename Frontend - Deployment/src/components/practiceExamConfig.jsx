import React, { useEffect, useState } from "react";
import RegisterDropDown from "./registerDropDown";
import Button from "./button";
import ModalDropdown from "./modalDropdown";

const PracticeExamConfig = ({ subjectID, isFormOpen, setIsFormOpen }) => {
  const [distributionError, setDistributionError] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [settings, setSettings] = useState({
    enableTimer: false,
    coverage: "midterm", 
    percentageEasy: 30,
    percentageModerate: 50,
    percentageHard: 20,
    difficultyMode: "default",
  });

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
          parseInt(name === "percentageEasy" ? value : updated.percentageEasy || 0) +
          parseInt(name === "percentageModerate" ? value : updated.percentageModerate || 0) +
          parseInt(name === "percentageHard" ? value : updated.percentageHard || 0);
  
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
      setLoading(false);
      return;
    }
  
    try {
      const res = await fetch(`${apiUrl}/practice-settings/${subjectID}`, {
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
      } else {
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    isFormOpen && (
    <div className="z-100 fixed inset-0 flex flex-col items-center justify-center lightbox-bg">
      <div className="font-inter text-[14px] w-full max-w-md mx-auto bg-white py-2 pl-4 rounded-t-md border border-color  relative text-gray-700 font-medium">
        <span>Configure Practice Exam</span>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md sm:px-4 mx-auto p-2 bg-white border-color border-t-0 border relative rounded-b-md">
        <span className="block mb-2 text-[12px] font-color-gray">Coverage</span>
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
        <div className="h-[0.5px] bg-[rgb(200,200,200)] mt-2 mb-3" />

        <label className="block mb-2 ml-2 cursor-pointer">
          <input
            type="checkbox"
            name="enableTimer"
            checked={settings.enableTimer}
            onChange={handleChange}
             className="size-3 text-white bg-orange-500 checked:bg-orange-500 checked:border-transparent focus:ring-orange-400 rounded"
              style={{ accentColor: 'red' }} // for browser compatibility
          />
          <span className="ml-2 text-[14px] font-color-gray">Enable Timer</span>
        </label>

        <div className="h-[0.5px] bg-[rgb(200,200,200)] mt-3 mb-3" />


        {/* Difficulty Selector */}
        <div className="mb-2">
          <label className="block mb-2 text-[12px] font-color-gray">Difficulty Distribution</label>
          <ModalDropdown
            name="difficultyMode"
            value={settings.difficultyMode}
            onChange={handleChange}
            options={[
              { value: "default", label: "Default: Easy 30%, Moderate 50%, Hard 20%" },
              { value: "custom", label: "Custom: Must equal to 100%" },
            ]}
          />
        </div>

        {/* Custom Distribution - show only when 'custom' is selected */}
        {settings.difficultyMode === "custom" && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] mb-1 text-gray-600">Easy</label>
                <input
                  type="number"
                  name="percentageEasy"
                  value={settings.percentageEasy}
                  className="w-full px-2 py-[6px] border rounded text-[12px] border-color focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 ease-in-out"
                  onChange={handleChange}
                  placeholder="Enter Percentage"
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-[12px] mb-1 text-gray-600">Moderate</label>
                <input
                  type="number"
                  name="percentageModerate"
                  value={settings.percentageModerate}
                  onChange={handleChange}
                  className="w-full px-2 py-[6px] border rounded text-[12px] border-color focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 ease-in-out"
                  placeholder="Enter Percentage"
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1 text-gray-600">Hard</label>
                <input
                  type="number"
                  name="percentageHard"
                  value={settings.percentageHard}
                  onChange={handleChange}
                  className="w-full px-2 py-[6px] border rounded text-[12px] border-color focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 ease-in-out"
                  placeholder="Enter Percentage"
                  onWheel={(e) => e.target.blur()}
                  max="100"
                />
              </div>
            </div>
          </div>
        )}

        {distributionError && (
          <p className="text-red-500 text-[12px] justify-center text-center">
            Total percentage must equal 100%.
          </p>
        )}

        <div className="-mx-2 sm:-mx-4 h-[0.5px] bg-[rgb(200,200,200)] mt-6 mb-1" />

        <div className="flex justify-end gap-2">
          <button 
            onClick={handleCancelClick}
            className="cursor-pointer mb-2 mt-3 flex items-center gap-1 px-3 py-[7px] bg-white rounded-md border transition-all duration-150 text-gray-700 hover:bg-gray-200"

            >
            <span className="text-[16px] px-1">Cancel</span>
          </button>
          <button
            type="submit"
            className="cursor-pointer mb-2 mt-3 flex items-center gap-1 px-3 py-[7px] bg-orange-500 text-white rounded-md hover:bg-orange-700 transition-all duration-150"
          >
            <i className={`bx bx-check-double text-[20px]`}></i>
            <span className="hidden sm:inline text-[14px] pr-1.5">Done</span>
          </button>
        </div>
      </form>
    </div>
    )
  );
};

export default PracticeExamConfig;