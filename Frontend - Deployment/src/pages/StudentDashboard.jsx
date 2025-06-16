import { useNavigate } from "react-router-dom";
import Button from "../components/button";
import { useState, useEffect, useRef } from "react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [subjectID, setSubjectID] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const suggestionsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [showForm, setShowForm] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [ongoingExam, setOngoingExam] = useState(null);

  const resetForm = () => {
    setSubjectInput("");
    setSubjectID("");
    setSubjectError("");
    setError("");
    setLoading(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }

      // Close form and reset when clicking outside
      if (showForm && !event.target.closest(".lightbox-bg")) {
        setShowForm(false);
        resetForm();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm]);

  // Filter subjects based on input
  useEffect(() => {
    setIsSearchLoading(true);
    const filtered = subjects.filter(
      (subject) =>
        !subjectInput.trim() ||
        subject.subjectName
          .toLowerCase()
          .includes(subjectInput.toLowerCase()) ||
        subject.subjectCode.toLowerCase().includes(subjectInput.toLowerCase()),
    );
    setFilteredSubjects(filtered);
    // Simulate loading state for 500ms
    setTimeout(() => {
      setIsSearchLoading(false);
    }, 500);
  }, [subjectInput, subjects]);

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = (e) => {
    // Add a small delay to allow click events on suggestions to fire first
    setTimeout(() => {
      // Only hide suggestions if we're not clicking on a suggestion
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  // Fetch available subjects when component mounts
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/student/practice-subjects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (data.data) {
          setSubjects(data.data);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects");
      }
    };

    fetchSubjects();
  }, [apiUrl]);

  // Check for ongoing exam when component mounts
  useEffect(() => {
    const checkOngoingExam = () => {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      // Find exam keys (they start with 'exam_')
      const examKeys = keys.filter((key) => key.startsWith("exam_"));

      if (examKeys.length > 0) {
        // Get the most recent exam (assuming there's only one ongoing exam)
        const examKey = examKeys[0];
        try {
          // Check if this exam has been completed
          const examCompleted = localStorage.getItem(`${examKey}_completed`);
          if (examCompleted === "true") {
            // Clear completed exam data
            const keysToRemove = [
              examKey,
              `${examKey}_bookmarks`,
              `${examKey}_timer`,
              `${examKey}_completed`,
              `${examKey}_last_question`,
              `${examKey}_last_position`,
            ];
            keysToRemove.forEach((key) => localStorage.removeItem(key));
            return;
          }

          const savedAnswers = JSON.parse(localStorage.getItem(examKey));
          const savedBookmarks =
            JSON.parse(localStorage.getItem(`${examKey}_bookmarks`)) || [];
          const savedTimer = localStorage.getItem(`${examKey}_timer`);

          // If timer exists and is 0, exam is completed
          if (savedTimer && parseInt(savedTimer) === 0) {
            // Clear completed exam data
            const keysToRemove = [
              examKey,
              `${examKey}_bookmarks`,
              `${examKey}_timer`,
              `${examKey}_completed`,
              `${examKey}_last_question`,
              `${examKey}_last_position`,
            ];
            keysToRemove.forEach((key) => localStorage.removeItem(key));
            return;
          }

          // Extract subject ID from the exam key (format: exam_subjectID_...)
          const subjectID = examKey.split("_")[1];

          // Get the exam data from the API
          fetch(`${apiUrl}/practice-exam/generate/${subjectID}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.questions) {
                setOngoingExam({
                  subjectID,
                  examData: data,
                  savedAnswers,
                  savedBookmarks,
                  examKey,
                });
              }
            })
            .catch((err) => {
              console.error("Error fetching exam data:", err);
              // If there's an error, clear the saved exam
              const keysToRemove = [
                examKey,
                `${examKey}_bookmarks`,
                `${examKey}_timer`,
                `${examKey}_completed`,
                `${examKey}_last_question`,
                `${examKey}_last_position`,
              ];
              keysToRemove.forEach((key) => localStorage.removeItem(key));
            });
        } catch (err) {
          console.error("Error parsing saved exam:", err);
          // If there's an error parsing, clear the saved exam
          const keysToRemove = [
            examKey,
            `${examKey}_bookmarks`,
            `${examKey}_timer`,
            `${examKey}_completed`,
            `${examKey}_last_question`,
            `${examKey}_last_position`,
          ];
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }
      }
    };

    checkOngoingExam();
  }, [apiUrl]);

  const handleContinueExam = () => {
    if (ongoingExam) {
      navigate("/practice-exam", {
        state: {
          subjectID: ongoingExam.subjectID,
          examData: ongoingExam.examData,
          savedAnswers: ongoingExam.savedAnswers,
          savedBookmarks: ongoingExam.savedBookmarks,
          examKey: ongoingExam.examKey,
        },
      });
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleGenerateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubjectError("");

    // Validate subject selection
    if (!subjectID) {
      setSubjectError("Please select a valid subject");
      setLoading(false);
      return;
    }

    // Clear all existing exam data before starting new exam
    const clearExistingExamData = () => {
      const keys = Object.keys(localStorage);
      const examKeys = keys.filter((key) => key.startsWith("exam_"));
      examKeys.forEach((key) => {
        // Remove all exam-related keys
        const keysToRemove = [
          key,
          `${key}_bookmarks`,
          `${key}_timer`,
          `${key}_completed`,
          `${key}_last_question`,
          `${key}_last_position`,
          `${key}_settings`,
          `${key}_exam_data`,
        ];
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      });
    };

    try {
      // Clear existing exam data before generating new exam
      clearExistingExamData();

      const response = await fetch(
        `${apiUrl}/practice-exam/generate/${subjectID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error("Unexpected response format: " + text.slice(0, 100));
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Practice exam is not enabled for this subject.");
        }
        if (response.status === 404) {
          throw new Error(
            data.message ||
              "Subject not found or no questions available for this subject.",
          );
        }
        throw new Error(data.message || "Failed to generate exam");
      }

      if (!data.questions || data.questions.length === 0) {
        setError(
          "No questions available for this subject. Please try another subject.",
        );
        setLoading(false);
        return;
      }

      // Generate a unique key for this exam attempt
      const examKey = `exam_${subjectID}_${data.questions.map((q) => q.questionID).join("_")}`;

      // Store the complete exam data in localStorage with its own settings
      localStorage.setItem(
        `${examKey}_exam_data`,
        JSON.stringify({
          questions: data.questions,
          totalPoints: data.totalPoints,
          enableTimer: data.enableTimer,
          durationMinutes: data.durationMinutes,
          subjectName: data.subjectName,
          // Store the exam settings separately from the subject settings
          examSettings: {
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
          },
        }),
      );

      // Navigate to /exam-preview with all the exam data
      navigate("/exam-preview", {
        state: {
          subjectID,
          examData: {
            questions: data.questions,
            totalPoints: data.totalPoints,
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
            subjectName: data.subjectName,
            // Include the exam settings in the state
            examSettings: {
              enableTimer: data.enableTimer,
              durationMinutes: data.durationMinutes,
            },
          },
          examKey,
        },
      });
    } catch (err) {
      console.error("Exam generation error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject) => {
    setSubjectInput(subject.subjectName);
    setSubjectID(subject.subjectID);
    setShowSuggestions(false); // Close the suggestions dropdown
  };

  return (
    <div className="font-inter mt-10 text-center text-gray-500">
      {/* Draft
      {ongoingExam && (
        <div className="mb-6">
          <div className="mx-auto max-w-md rounded-lg bg-yellow-50 p-4 shadow-sm">
            <h3 className="mb-2 text-[16px] font-semibold text-yellow-800">
              Exam in Progress
            </h3>
            <p className="mb-4 text-[12px] text-yellow-700">
              You have an unfinished practice exam for Subject{" "}
              {ongoingExam.subjectID}. Your progress has been saved.
            </p>

            <div className="flex justify-center">
              <button
                onClick={handleContinueExam}
                className="font-inter mt-3 flex items-center justify-center gap-2 text-[14px] text-gray-700"
              >
                <span className="hover:underline">Continue Exam</span>
                <i className="bx bx-chevron-right text-[18px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}
        */}

      <button
        onClick={() => {
          setShowForm(true);
          resetForm(); // Reset form when opening
        }}
        className="mt-4 cursor-pointer rounded-md bg-orange-500 px-4 py-2 text-[14px] text-white hover:bg-orange-600"
      >
        Start a New Exam
      </button>

      {showForm && (
        <>
          <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
            <div className="relative mx-2 w-full max-w-[480px] rounded-md bg-white shadow-2xl">
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  Start a New Exam
                </h2>

                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                  title="Close"
                >
                  <i className="bx bx-x text-[20px]"></i>
                </button>
              </div>

              <form className="px-5 py-4" onSubmit={handleGenerateExam}>
                {" "}
                <span className="mb-2 block text-start text-[14px] text-gray-700">
                  Select Subject
                </span>
                <div className="relative">
                  <input
                    type="text"
                    className="peer border-color mt-1 w-full rounded-xl border px-4 py-[8px] text-base text-gray-700 transition-all duration-200 hover:border-gray-500 focus:border-orange-500 focus:outline-none"
                    value={subjectInput}
                    onChange={(e) => {
                      setSubjectInput(e.target.value);
                      if (!e.target.value.trim()) {
                        setSubjectID(""); // Clear subjectID when input is empty
                      }
                      setSubjectError("");
                    }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Enter"
                  />
                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="border-color absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                      tabIndex={-1}
                    >
                      <div className="max-h-[200px] overflow-y-auto">
                        {isSearchLoading ? (
                          <div className="flex items-center justify-center py-2">
                            <span className="loader"></span>
                          </div>
                        ) : filteredSubjects.length > 0 ? (
                          filteredSubjects.map((subject) => (
                            <div
                              key={subject.subjectID}
                              onClick={() => handleSubjectSelect(subject)}
                              className="cursor-pointer px-4 py-2 text-start text-[14px] text-gray-700 hover:bg-gray-100"
                              tabIndex={-1}
                            >
                              {subject.subjectCode} - {subject.subjectName}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-center text-sm text-gray-500">
                            No subjects found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />
                {subjectError && (
                  <div className="mb-3 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {subjectError}
                  </div>
                )}
                {error && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {error}
                  </div>
                )}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-2 w-full cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${loading ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
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
            </div>{" "}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
