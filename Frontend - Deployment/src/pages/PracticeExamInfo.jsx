import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const PracticeExamInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectID, examData: providedExamData, examKey: providedExamKey } = location.state || {};
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [isExamModified, setIsExamModified] = useState(false);
  const [examData, setExamData] = useState(providedExamData);

  useEffect(() => {
    if (!subjectID || !examData) return;

    // Check for active exam attempts in localStorage
    const keys = Object.keys(localStorage);
    const examKeys = keys.filter(key => key.startsWith(`exam_${subjectID}_`));
    
    for (const key of examKeys) {
      const versionKey = `${key}_version`;
      const savedVersion = localStorage.getItem(versionKey);
      const savedTimer = localStorage.getItem(`${key}_timer`);
      const savedAnswers = localStorage.getItem(key);
      
      if (savedVersion && (savedTimer || savedAnswers)) {
        try {
          const version = JSON.parse(savedVersion);
          const currentQuestionCount = examData.questions?.length || 0;
          
          const questionCountChanged = version.questionCount !== currentQuestionCount;
          
          // Check if timer settings changed
          let storedSettings = {};
          if (version.settingsHash) {
            try {
              storedSettings = JSON.parse(version.settingsHash);
            } catch (e) {
              console.error("Error parsing stored settings:", e);
            }
          }
          
          const timerEnabledChanged = examData.enableTimer !== undefined && 
            storedSettings.enableTimer !== examData.enableTimer;
          const timerValueChanged = examData.durationMinutes !== undefined && 
            storedSettings.durationMinutes !== examData.durationMinutes;
          
          const modified = questionCountChanged || timerEnabledChanged || timerValueChanged;
          
          if (modified) {
            setIsExamModified(true);
          }
          
          const remainingTime = savedTimer ? parseInt(savedTimer) : null;
          
          // Only consider it active if timer hasn't expired or there are saved answers
          if ((remainingTime !== null && remainingTime > 0) || savedAnswers) {
            setActiveAttempt({
              remainingTime,
              hasAnswers: !!savedAnswers && savedAnswers !== '{}',
              examKey: key,
            });
            break; // Only handle the first active attempt
          }
        } catch (err) {
          console.error("Error checking exam version:", err);
        }
      }
    }
  }, [subjectID, examData]);

  if (!examData) {
    return <div>No exam data found. Please select a subject first.</div>;
  }

  const totalQuestions = examData.questions.length;

  const handleContinueExam = () => {
    if (!activeAttempt) return;

    // Load saved data from localStorage
    const savedAnswers = localStorage.getItem(activeAttempt.examKey);
    const savedBookmarks = localStorage.getItem(`${activeAttempt.examKey}_bookmarks`);
    const savedQuestions = localStorage.getItem(`${activeAttempt.examKey}_questions`);
    
    let examDataToUse = examData;
    if (savedQuestions) {
      try {
        const questions = JSON.parse(savedQuestions);
        examDataToUse = { ...examData, questions };
      } catch (err) {
        console.error("Error loading saved questions:", err);
      }
    }

    navigate("/practice-exam", {
      state: {
        subjectID,
        examData: examDataToUse,
        examKey: activeAttempt.examKey,
        savedAnswers: savedAnswers ? JSON.parse(savedAnswers) : {},
        savedBookmarks: savedBookmarks ? JSON.parse(savedBookmarks) : [],
        resumeAttempt: true,
      },
    });
  };

  const handleStartExam = () => {
    // If there's an active attempt and exam was modified, prevent starting new
    if (activeAttempt && isExamModified) {
      if (activeAttempt.remainingTime !== null && activeAttempt.remainingTime > 0) {
        alert("This exam has been modified. Please finish your current attempt or wait for the timer to expire before starting a new one.");
        return;
      } else if (activeAttempt.hasAnswers) {
        alert("This exam has been modified. Please finish your current attempt before starting a new one.");
        return;
      }
    }

    // If there's an active attempt but exam wasn't modified, continue it instead
    if (activeAttempt && !isExamModified) {
      handleContinueExam();
      return;
    }

    // No active attempt or all attempts completed/expired, start new exam
    navigate("/practice-exam", {
      state: {
        subjectID,
        examData,
        examKey: providedExamKey,
      },
    });
  };

  return (
    <div className="outfit mx-auto mt-10 max-w-lg p-2">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 space-y-4">
          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="mb-2 text-[14px] font-bold text-gray-700">
              Exam Information
            </h3>
            <div className="space-y-2 text-[12px]">
              <p className="text-gray-600">
                <span className="font-medium">Subject:</span>{" "}
                {examData.subjectName}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Total Items:</span>{" "}
                {totalQuestions}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Total Points:</span>{" "}
                {examData.totalPoints}
              </p>
              {examData.enableTimer ? (
                <p className="text-gray-600">
                  <span className="font-medium">Duration:</span>{" "}
                  {examData.durationMinutes} minutes
                </p>
              ) : (
                <p className="text-gray-600">
                  <span className="font-medium">Duration:</span> No time limit
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="mb-2 text-[14px] font-semibold text-gray-700">
              Instructions
            </h3>
            <ul className="list-inside list-disc space-y-2 text-[12px] text-gray-600">
              <li>Make sure to answer all questions before submitting</li>
              <li>Your progress will be saved automatically</li>
              {examData.enableTimer ? (
                <li>
                  This exam has a time limit. Make sure to complete it within
                  the given duration
                </li>
              ) : (
                <li>
                  This exam has no time limit. Take your time to complete it
                </li>
              )}
              <li>You can bookmark questions to review them later</li>
              <li>Use the navigation buttons to move between questions</li>
              <li className="mt-4">
                The qualifying exam will consist of 100 items to be completed
                within 3 hours.
              </li>
            </ul>
          </div>

          {/* Active Attempt Warning */}
          {activeAttempt && (
            <div className={`rounded-md p-4 ${
              isExamModified 
                ? "border border-amber-200 bg-amber-50" 
                : "border border-blue-200 bg-blue-50"
            }`}>
              <h3 className={`mb-2 text-[14px] font-semibold ${
                isExamModified ? "text-amber-700" : "text-blue-700"
              }`}>
                {isExamModified ? "⚠️ Exam Modified - Active Attempt" : "Active Attempt"}
              </h3>
              <div className="space-y-2 text-[12px]">
                <p className={isExamModified ? "text-amber-700" : "text-blue-700"}>
                  {isExamModified 
                    ? "This exam has been modified since you started. You can continue your current attempt, but you must finish it before starting a new one."
                    : "You have an ongoing exam attempt. You can continue where you left off."}
                </p>
                {activeAttempt.remainingTime !== null && activeAttempt.remainingTime > 0 && (
                  <p className={isExamModified ? "text-amber-600" : "text-blue-600"}>
                    <span className="font-medium">Time Remaining:</span>{" "}
                    {Math.floor(activeAttempt.remainingTime / 60)} minutes{" "}
                    {activeAttempt.remainingTime % 60} seconds
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 text-[14px]">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Go Back
          </button>
          <div className="flex gap-2">
            {activeAttempt && (
              <button
                onClick={handleContinueExam}
                className="cursor-pointer rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Continue Exam
              </button>
            )}
            <button
              onClick={handleStartExam}
              disabled={activeAttempt && isExamModified}
              className={`cursor-pointer rounded-md px-6 py-2 text-white ${
                !(activeAttempt && isExamModified)
                  ? "bg-orange-500 hover:bg-orange-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {activeAttempt && isExamModified
                ? "Cannot Start New"
                : "Start Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamInfo;
