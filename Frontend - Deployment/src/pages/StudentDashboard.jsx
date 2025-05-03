import { useNavigate } from "react-router-dom";
import Button from "../components/button";
import { useState } from "react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [subjectID, setSubjectID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [showForm, setShowForm] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleGenerateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

      // Pass data to the next page using navigate
      navigate("/practice-exam", {
        state: {
          subjectID,
          examData: data,
        },
      });
    } catch (err) {
      console.error("Exam generation error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 text-center text-gray-500">
      <p>Student Dashboard</p>
      <button
        onClick={() => setShowForm(true)}
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Generate Exam
      </button>

      {showForm && (
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
                onClick={() => setShowForm(false)}
                className="cursor-pointer rounded-md border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
                type="button"
              >
                <span className="px-1 text-[16px]">Cancel</span>
              </button>
              <Button type="submit" text="Generate" icon="bx bxs-magic-wand" />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentDashboard;
