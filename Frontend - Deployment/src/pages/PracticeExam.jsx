import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Button from "../components/button";

const PracticeExam = ({ closeModal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [examStarted, setExamStarted] = useState(false); // Manage the exam state (started or not)
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectID, examData } = location.state || {};

  const [examGenerated, setExamGenerated] = useState(false);

  if (!examData) {
    return <div>No exam data found. Please select a subject first.</div>;
  }

  const totalQuestions = examData ? examData.questions.length : 0;

  const handleSelectAnswer = (questionID, choiceID) => {
    setAnswers((prev) => ({
      ...prev,
      [questionID]: choiceID,
    }));
  };

  const handleSubmitAnswers = async () => {
    try {
      const payload = {
        subjectID,
        answers: Object.entries(answers).map(
          ([questionID, selectedChoiceID]) => ({
            questionID: parseInt(questionID),
            selectedChoiceID: parseInt(selectedChoiceID),
          }),
        ),
      };

      const response = await fetch(`${apiUrl}/practice-exam/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit answers");
      }

      const { score, results } = result;

      // Navigate to Result Page and pass data
      navigate("/practice-exam-result", {
        state: {
          score,
          results, // pass results, because backend returns 'results' with exact question scores
        },
      });

      // Clear the exam form states
      setAnswers({});
    } catch (err) {
      console.error(err);
      navigate("/practice-exam-result", {
        state: {
          error: err.message,
        },
      });
    }
  };

  // Handle starting the exam
  const handleStartExam = () => {
    setExamStarted(true); // Mark the exam as started
  };

  return (
    <div className="mx-auto mt-10 max-w-lg p-4">
      {error && (
        <div className="mt-4 rounded bg-red-100 p-2 text-red-600">{error}</div>
      )}

      {examData && !examStarted && (
        <div className="mt-6">
          <h3 className="mb-2 text-xl font-semibold">Exam Information</h3>
          <p className="mb-4">Total Questions: {totalQuestions}</p>
          <p className="mb-4">Total Points: {examData.totalPoints}</p>

          <button
            onClick={handleStartExam}
            className="mt-4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Start Exam
          </button>
        </div>
      )}

      {examData && examStarted && (
        <div className="mt-6">
          <h3 className="mb-2 text-xl font-semibold">Exam Questions</h3>

          <form className="space-y-6">
            {examData.questions.map((q) => (
              <div
                key={q.questionID}
                className="border-color relative mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 rounded-t-md border border-b-0 bg-white"
              >
                <div className="w-full max-w-full overflow-hidden break-words">
                  <p className="font-semibold">{q.questionText}</p>
                </div>
                {q.questionImage && (
                  <img
                    src={q.questionImage}
                    alt="Question"
                    className="mt-2 w-32"
                  />
                )}

                <div className="mt-2 space-y-1">
                  {q.choices.map((choice) => (
                    <label
                      key={choice.choiceID}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        name={`question-${q.questionID}`}
                        value={choice.choiceID}
                        checked={answers[q.questionID] === choice.choiceID}
                        onChange={() =>
                          handleSelectAnswer(q.questionID, choice.choiceID)
                        }
                      />
                      <span>{choice.choiceText}</span>
                      {choice.choiceImage && (
                        <img
                          src={choice.choiceImage}
                          alt="Choice"
                          className="ml-2 inline-block w-16"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleSubmitAnswers}
              className="mt-6 w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Submit Answers
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PracticeExam;
