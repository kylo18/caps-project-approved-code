import { useNavigate, useLocation } from "react-router-dom";

const PracticeExamInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectID, examData, examKey } = location.state || {};

  if (!examData) {
    return <div>No exam data found. Please select a subject first.</div>;
  }

  const totalQuestions = examData.questions.length;

  const handleStartExam = () => {
    navigate("/practice-exam", {
      state: {
        subjectID,
        examData,
        examKey,
      },
    });
  };

  return (
    <div className="font-inter mx-auto mt-10 max-w-lg p-2">
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
              <li>Progress will not be saved if you exit</li>
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
        </div>

        <div className="flex justify-between text-[14px]">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Go Back
          </button>
          <button
            onClick={handleStartExam}
            className="cursor-pointer rounded-md bg-orange-500 px-6 py-2 text-white hover:bg-orange-700"
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamInfo;
