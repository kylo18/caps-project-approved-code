import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PracticeExamPreviewPage = () => {
  const { subjectID } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/practice-exam/preview/${subjectID}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON response received:", text);
          throw new Error(
            `Server returned non-JSON response (status ${res.status}):\n` +
              text.slice(0, 300),
          );
        }
        if (!res.ok) {
          const data = await res.json();
          console.error("API error response:", data);
          throw new Error(
            data.message || `Failed to load preview (status ${res.status})`,
          );
        }
        return res.json();
      })
      .then(setExam)
      .catch((e) => {
        setError(e.message);
        console.error("PracticeExamPreview error:", e);
      })
      .finally(() => setLoading(false));
  }, [subjectID]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <button
          className="mb-4 text-gray-500 hover:text-black"
          onClick={() => navigate(-1)}
        >
          <i className="bx bx-arrow-back text-2xl"></i> Back
        </button>
        <h2 className="mb-2 text-xl font-bold">Practice Exam Preview</h2>
        {loading && <div>Loading...</div>}
        {error && (
          <div className="whitespace-pre-wrap text-red-500">{error}</div>
        )}
        {exam && (
          <>
            <div className="mb-4 text-gray-700">
              <div>Total Items: {exam.totalItems}</div>
              <div>Total Points: {exam.totalPoints}</div>
              <div>Duration: {exam.durationMinutes} minutes</div>
            </div>
            <ol className="space-y-6">
              {exam.questions.map((q, idx) => (
                <li key={q.questionID} className="border-b pb-4">
                  <div className="mb-2 font-semibold">
                    {idx + 1}. {q.questionText}
                  </div>
                  {q.questionImage && (
                    <img
                      src={q.questionImage}
                      alt="Question"
                      className="mb-2 max-h-48"
                    />
                  )}
                  <ul className="space-y-1">
                    {q.choices.map((choice, cidx) => (
                      <li key={choice.choiceID || cidx}>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q${q.questionID}`}
                            disabled
                          />
                          <span>{choice.choiceText}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
};

export default PracticeExamPreviewPage;
