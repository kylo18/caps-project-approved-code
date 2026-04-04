import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSubjectCard from "../components/StudentSubjectCard";
import { getApiUrl } from "../utils/config";

const StudentSearch = () => {
  const navigate = useNavigate();
  const apiUrl = getApiUrl();
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loadingExamPreview, setLoadingExamPreview] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/student/practice-subjects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load subjects");
        }

        const data = await response.json();
        setSubjects(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        setError("");
      } catch (fetchError) {
        console.error("Error fetching subjects:", fetchError);
        setError("Unable to load subjects.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [apiUrl]);

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return subjects.filter((subject) => {
      const subjectName = subject.subjectName?.toLowerCase() || "";
      const subjectCode = subject.subjectCode?.toLowerCase() || "";
      return (
        !normalizedQuery ||
        subjectName.includes(normalizedQuery) ||
        subjectCode.includes(normalizedQuery)
      );
    });
  }, [query, subjects]);

  const handleSubjectClick = async (subject) => {
    setLoadingExamPreview(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/practice-exam/generate/${subject.subjectID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
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
        }),
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
    } catch (fetchError) {
      console.error("Error loading exam:", fetchError);
      alert(fetchError.message || "Unable to load exam. Please try again.");
    } finally {
      setLoadingExamPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f1] pb-32 text-slate-900">
      <section className="relative overflow-hidden rounded-b-[36px] bg-[linear-gradient(180deg,#ff7a00_0%,#ff8c1a_100%)] px-5 pb-8 pt-6 text-white">
        <div className="absolute -right-8 top-4 h-32 w-32 rounded-full border border-white/10" />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/student-dashboard")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16"
          >
            <i className="bx bx-left-arrow-alt text-[24px]" />
          </button>
          <h1 className="text-[28px] font-bold">Search</h1>
        </div>

        <div className="mt-6 rounded-full bg-white/22 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <i className="bx bx-search text-[22px] text-orange-50" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Calculus"
              className="w-full bg-transparent text-sm text-white placeholder:text-orange-100 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="relative -mt-3 rounded-t-[32px] bg-white px-5 pb-10 pt-5 shadow-[0_-14px_28px_rgba(254,105,2,0.05)]">
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-[#ffcba7]" />

        <div className="flex items-center gap-5 border-b border-orange-100 pb-4 text-sm font-semibold text-slate-400">
          {["All", "Program", "General"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 ${activeTab === tab ? "text-[#ff7a00]" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Available Exams</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse subjects and start a practice exam.
            </p>
          </div>
          <span className="text-sm font-semibold text-[#ff7a00]">See all</span>
        </div>

        {loadingExamPreview && (
          <div className="mt-4 rounded-[24px] bg-[#fff7f1] px-4 py-4 text-center">
            <span className="loader mx-auto block" />
            <p className="mt-2 text-sm text-slate-500">Loading exam...</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-4 space-y-3">
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-[88px] animate-pulse rounded-[24px] bg-[#fff7f1]"
              />
            ))}

          {!isLoading &&
            filteredSubjects.map((subject) => (
              <StudentSubjectCard
                key={subject.subjectID}
                baseName={subject.subjectName}
                subjectImage={subject.imageUrl}
                meta={`${subject.subjectCode || "Math"} • ${subject.questionCount || 12} quizzes`}
                accent="soft"
                onClick={() => handleSubjectClick(subject)}
                disabled={loadingExamPreview}
              />
            ))}
        </div>
      </section>
    </div>
  );
};

export default StudentSearch;
