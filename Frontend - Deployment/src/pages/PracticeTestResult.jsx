import { useLocation, useNavigate } from "react-router-dom";

const PracticeTestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, results, error } = location.state || {}; // corrected: use 'results'

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
        <h2 className="mb-4 text-3xl font-bold text-red-600">
          Submission Failed
        </h2>
        <p className="mb-6 text-black">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <h2 className="mb-8 text-center text-4xl font-bold text-orange-500">
        🎯 Exam Results
      </h2>

      <div className="mb-8 rounded-lg bg-gray-100 p-6 shadow-md">
        <p className="mb-2 text-xl">
          <strong>Score:</strong> {score.earnedPoints} / {score.totalPoints}
        </p>
        <p className="text-xl">
          <strong>Percentage:</strong> {score.percentage}%
        </p>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-2xl font-semibold text-orange-500">
          Your Answers:
        </h3>
        <ul className="space-y-4">
          {results.map((q) => (
            <li
              key={q.questionID}
              className={`rounded-lg p-4 shadow ${
                q.isCorrect ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <p className="font-semibold">{q.questionText}</p>
              <p className="mt-1">
                {q.isCorrect ? (
                  <span className="font-bold text-green-700">Correct</span>
                ) : (
                  <span className="font-bold text-red-700">Incorrect</span>
                )}
                {` — ${q.pointsEarned}/${q.pointsPossible} pts`}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate("/student-dashboard")}
          className="rounded bg-black px-8 py-4 font-semibold text-white transition hover:bg-orange-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PracticeTestResult;
