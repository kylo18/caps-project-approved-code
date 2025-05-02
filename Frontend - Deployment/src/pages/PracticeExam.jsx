import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/button";

const PracticeExam = ({ closeModal }) => {
  const [subjectID, setSubjectID] = useState("");
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [examStarted, setExamStarted] = useState(false); // Manage the exam state (started or not)
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [examGenerated, setExamGenerated] = useState(false);

  const handleGenerateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setExamData(null);
    setAnswers({});
    setScore(null);

    try {
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
        throw new Error(data.message || "Failed to generate exam");
      }

      if (data.questions && data.questions.length === 0) {
        setError("No questions available for this subject.");
        return;
      }

      console.log("Generated Questions:", data);
      setExamData(data);
      setExamGenerated(true);
    } catch (err) {
      console.error("Exam generation error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

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
      setExamData(null);
      setAnswers({});
      setSubjectID("");
    } catch (err) {
      console.error(err);
      navigate("/practice-exam-result", {
        state: {
          error: err.message,
        },
      });
    }
  };

  const handleCancel = () => {
    navigate("/student-dashboard"); // Navigate back to the dashboard or previous page
  };

  // Handle starting the exam
  const handleStartExam = () => {
    setExamStarted(true); // Mark the exam as started
  };

  return (
    <div className="mx-auto mt-10 max-w-lg p-4">
      {!examGenerated && (
        <form
          onSubmit={handleGenerateExam}
          className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center"
        >
          <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Generate Exam</span>
          </div>
          <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
            <div>
              <label className="font-color-gray text-[12px]">
                Select a Subject
              </label>

              <input
                type="text"
                id="subjectID"
                value={subjectID}
                onChange={(e) => setSubjectID(e.target.value)}
                required
                className={`relative mt-2 mb-1 w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none`}
                placeholder="Enter Subject ID"
              />
            </div>

            <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {/* Buttons */}
            <div className="mb-1 flex justify-end gap-2">
              <button
                className="cursor-pointer rounded-md border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
                type="button"
                onClick={handleCancel}
              >
                <span className="px-1 text-[16px]">Cancel</span>
              </button>
              <Button type="submit" text="Generate" icon="bx bxs-magic-wand" />
            </div>
          </div>
        </form>
      )}

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

      {examData && examStarted && examGenerated && (
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
                {q.image && (
                  <img src={q.image} alt="Question" className="mt-2 w-32" />
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
