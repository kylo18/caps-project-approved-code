import { useState, useEffect, useRef } from "react";
import Button from "./button";
import RegisterDropDownSmall from "./registerDropDownSmall";
import LoadingOverlay from "./loadingOverlay";

// Print Exam Form
const PrintExamModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const suggestionsRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  // State
  const [settings, setSettings] = useState({
    subjectID: "",
    coverage: "full",
    limit: 10,
    easy_percentage: 30,
    moderate_percentage: 50,
    hard_percentage: 20,
  });

  const [mode, setMode] = useState("default");

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter subjects based on input
  useEffect(() => {
    const filtered = subjects.filter(
      (subject) =>
        !subjectInput.trim() ||
        subject.subjectName
          .toLowerCase()
          .includes(subjectInput.toLowerCase()) ||
        subject.subjectCode.toLowerCase().includes(subjectInput.toLowerCase()),
    );
    setFilteredSubjects(filtered);
  }, [subjectInput, subjects]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleSubjectSelect = (subject) => {
    setSubjectInput(subject.subjectName);
    setSelectedSubject(subject);
    setSettings((prev) => ({ ...prev, subjectID: subject.subjectID }));
    setShowSuggestions(false);
  };

  // Fetching Subjects for Selection
  const fetchSubjects = async () => {
    const token = localStorage.getItem("token");
    setSubjectsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setError(data.message || "Failed to load subjects");
          setSubjects([]);
        } else {
          setSubjects(data.subjects || []);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to load subjects");
        setSubjects([]);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Failed to load subjects");
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  // Submitting Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const total =
      settings.easy_percentage +
      settings.moderate_percentage +
      settings.hard_percentage;
    if (total !== 100) {
      setError("Total percentage must equal 100%");
      setLoading(false);
      return;
    }

    if (settings.limit <= 0) {
      setError("Item count must be greater than 0");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${apiUrl}/generate-printable-exam/${settings.subjectID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        },
      );

      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        // Create a temporary link element
        const link = document.createElement("a");
        link.href = url;
        link.download = `exam_${selectedSubject.subjectCode}.pdf`;
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the URL
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to generate exam");
      }
    } catch (err) {
      console.error("Error generating exam:", err);
      setError("Failed to generate exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
      <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 sm:rounded-t-md">
        <div className="flex items-center justify-between pr-4">
          <span>Print an Exam</span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <i className="bx bx-x text-xl text-gray-500"></i>
          </button>
        </div>
      </div>

      <div className="border-color relative mx-auto w-full max-w-md border border-t-0 bg-white p-2 min-[448px]:rounded-b-md min-[448px]:px-4">
        <div className="relative mt-2 mb-3">
          <div className="relative w-full">
            <div className="relative">
              <input
                type="text"
                className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                placeholder="Code"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <label
                htmlFor="Subject Code"
                className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
              >
                Enter Subject
              </label>
            </div>
          </div>

          {showSuggestions && filteredSubjects.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              tabIndex={-1}
            >
              <div className="max-h-[200px] overflow-y-auto">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject.subjectID}
                    onClick={() => handleSubjectSelect(subject)}
                    className="cursor-pointer px-4 py-2 text-start text-[14px] text-gray-700 hover:bg-gray-100"
                    tabIndex={-1}
                  >
                    {subject.subjectName} ({subject.subjectCode})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedSubject && (
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="-mx-2 mt-5 mb-2 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <span className="font-color-gray mb-2 block text-[12px]">
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

              <div>
                <span className="font-color-gray mb-[2px] block text-[12px]">
                  Number of Items
                </span>
                <input
                  type="number"
                  name="limit"
                  value={settings.limit}
                  onChange={handleChange}
                  min="1"
                  className="mt-[4px] w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <span className="font-color-gray -mt-3 mb-2 block text-[12px]">
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
                    { value: "custom", label: "Custom: Must equal to 100%" },
                  ]}
                />
              </div>

              {mode === "custom" && (
                <div className="col-span-2 w-full">
                  <div className="grid grid-cols-3 gap-6">
                    {["easy", "moderate", "hard"].map((level) => (
                      <div key={level} className="w-full">
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
                </div>
              )}
            </div>
            <div className="-mx-2 mt-5 mb-1 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />
            {error && (
              <div className="mt-2 mb-3 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-3 py-[7px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
              >
                <span className="px-1 text-[14px]">Cancel</span>
              </button>
              <button
                type="submit"
                className="mt-3 mb-2 flex w-[80px] cursor-pointer items-center justify-center gap-1 rounded-md bg-orange-500 px-3 py-[7px] text-[14px] text-white transition-all duration-150 hover:bg-orange-700"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  </div>
                ) : (
                  "Export"
                )}
              </button>
            </div>
          </form>
        )}

        {loading && <LoadingOverlay />}
      </div>
    </div>
  );
};

export default PrintExamModal;
