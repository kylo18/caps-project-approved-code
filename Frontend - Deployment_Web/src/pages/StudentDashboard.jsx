import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../utils/config";
import DashboardCarousel from "../components/DashboardCarousel";
import StudentSubjectCard from "../components/StudentSubjectCard";

// Renders the student dashboard.
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
  const apiUrl = getApiUrl();
  const [showForm, setShowForm] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [ongoingExam, setOngoingExam] = useState(null);
  const [loadingExamPreview, setLoadingExamPreview] = useState(false);



  // Resets form.
  const resetForm = () => {
    setSubjectInput("");
    setSubjectID("");
    setSubjectError("");
    setError("");
    setLoading(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    // Handles click outside.
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

  // Handles input focus.
  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  // Handles input blur.
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
    // Fetches subjects.
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/student/practice-subjects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch subjects:", response.status);
          setError("Failed to load subjects");
          return;
        }

        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setSubjects(data.data);
        } else if (Array.isArray(data)) {
          setSubjects(data);
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
    // Checks ongoing exam.
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
          fetch(`${apiUrl}/api/practice-exam/generate/${subjectID}`, {
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

  // Handles continue exam.
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

  // Handles start exam.
  const handleStartExam = () => {
    setExamStarted(true);
  };

  // Handles generate exam.
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
        `${apiUrl}/api/practice-exam/generate/${subjectID}`,
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

  // Handles subject select.
  const handleSubjectSelect = (subject) => {
    setSubjectInput(subject.subjectName);
    setSubjectID(subject.subjectID);
    setShowSuggestions(false); // Close the suggestions dropdown
  };

  // Handles subject click.
  const handleSubjectClick = async (subject) => {
    setLoadingExamPreview(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/practice-exam/generate/${subject.subjectID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Practice exam is not enabled for this subject.");
        }
        if (response.status === 404) {
          throw new Error("No questions available for this subject.");
        }
        throw new Error("Failed to generate exam");
      }

      const data = await response.json();

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions available for this subject.");
      }

      const examKey = `exam_${subject.subjectID}_${Date.now()}`;

      localStorage.setItem(
        `${examKey}_exam_data`,
        JSON.stringify({
          questions: data.questions,
          totalPoints: data.totalPoints,
          enableTimer: data.enableTimer,
          durationMinutes: data.durationMinutes,
          subjectName: data.subjectName,
          examSettings: {
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
          },
        })
      );

      navigate("/exam-preview", {
        state: {
          subjectID: subject.subjectID,
          subjectName: subject.subjectName,
          examData: {
            questions: data.questions,
            totalPoints: data.totalPoints,
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
            subjectName: data.subjectName,
            examSettings: {
              enableTimer: data.enableTimer,
              durationMinutes: data.durationMinutes,
            },
          },
          examKey,
        },
      });
    } catch (err) {
      console.error("Error loading exam:", err);
      alert(err.message || "Unable to load exam. Please try again.");
    } finally {
      setLoadingExamPreview(false);
    }
  };

  return (
    <div className="font-inter mt-2 sm:mt-4 px-4 max-w-full text-gray-500">
      <DashboardCarousel />

      {loadingExamPreview && (
        <div className="mt-4 text-center">
          <span className="loader"></span>
          <p className="text-sm mt-2">Loading exam...</p>
        </div>
      )}

      <div className="mt-4 sm:mt-6">
        <h2 className="text-left text-base sm:text-lg font-semibold text-gray-700 dark:text-white">
          Available Subjects
        </h2>
        <div className="mt-3 sm:mt-4 flex flex-col gap-3 sm:gap-4">
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <StudentSubjectCard
                key={subject.subjectID}
                baseName={subject.subjectName}
                subjectImage={subject.imageUrl}
                onClick={() => handleSubjectClick(subject)}
                disabled={loadingExamPreview}
              />
            ))
          ) : (
            <p className="text-sm sm:text-base text-gray-500 text-center">
              No subjects available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
