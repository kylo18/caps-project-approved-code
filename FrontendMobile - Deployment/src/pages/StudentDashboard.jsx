import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSubjectCard from "../components/StudentSubjectCard";
import DashboardCarousel from "../components/DashboardCarousel";
import { getApiUrl } from "../utils/config";
import {
  getDashboardSummary,
  getPerformanceTrend,
} from "../services/studentAnalyticsService";

const getUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.fullName || user?.name || "Student";
  } catch {
    return "Student";
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const apiUrl = getApiUrl();
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loadingExamPreview, setLoadingExamPreview] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const fullName = getUserName();

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
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
        setFetchError("");
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setFetchError("Unable to load available exams right now.");
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
    getDashboardSummary().then((response) => setSummary(response.data));
    getPerformanceTrend().then((response) => setTrend(response.data || []));
  }, [apiUrl]);

  const recentExam = trend[0];
  const completionPercent = Math.max(
    12,
    Math.min(100, Math.round(summary?.average_score ?? 0)),
  );

  const featuredCopy = useMemo(() => {
    const weakestTopic = summary?.weakest_topic?.name;
    if (weakestTopic && weakestTopic !== "N/A") {
      return `Take a quick review set for ${weakestTopic} and tighten your weakest area.`;
    }
    return "Take part in classes with your teachers or instructors and stay exam-ready.";
  }, [summary]);

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
    } catch (error) {
      console.error("Error loading exam:", error);
      alert(error.message || "Unable to load exam. Please try again.");
    } finally {
      setLoadingExamPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f1] pb-32 text-slate-900">
      <section className="relative overflow-hidden rounded-b-[36px] bg-[linear-gradient(180deg,#ff7a00_0%,#ff8c1a_100%)] px-5 pb-8 pt-6 text-white shadow-[0_18px_38px_rgba(254,105,2,0.25)]">
        <div className="absolute -left-12 top-24 h-28 w-28 rounded-full bg-white/10 blur-sm" />
        <div className="absolute -right-10 top-8 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">
              {getGreeting()}
            </p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight">
              {fullName.split(" ")[0]}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (recentExam?.result_id) {
              navigate('/practice-exam-result', { state: { resultId: recentExam.result_id } });
            } else {
              navigate("/student-insights");
            }
          }}
          className="relative mt-6 w-full rounded-[28px] bg-white/18 px-4 py-4 backdrop-blur-sm transition hover:bg-white/25"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-100">
                Recent Exam
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {recentExam?.label || "No exams taken yet"}
              </h2>
              {recentExam?.taken_at && (
                <p className="mt-0.5 text-xs text-white/70">
                  {new Date(recentExam.taken_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/18">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a15.9155 15.9155 0 010 31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M18 2.0845a15.9155 15.9155 0 010 31.831"
                  fill="none"
                  stroke="#ffd16d"
                  strokeDasharray={`${recentExam?.score_percentage || completionPercent}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold">{recentExam?.score_percentage || completionPercent}%</span>
            </div>
          </div>
        </button>

        <DashboardCarousel />
      </section>

      <section className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Exams</h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue practicing from your available subjects.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/ai-chat")}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#ff7a00] shadow-[0_12px_20px_rgba(254,105,2,0.08)]"
            >
              AI Tutor
            </button>
            <button
              type="button"
              onClick={() => navigate("/student-search")}
              className="text-sm font-semibold text-[#ff7a00]"
            >
              Search
            </button>
          </div>
        </div>

        {loadingExamPreview && (
          <div className="mt-4 rounded-[24px] bg-white px-4 py-4 text-center shadow-[0_14px_28px_rgba(254,105,2,0.08)]">
            <span className="loader mx-auto block" />
            <p className="mt-2 text-sm text-slate-500">Loading exam...</p>
          </div>
        )}

        {fetchError && (
          <div className="mt-4 rounded-[24px] border border-red-100 bg-white px-4 py-4 text-sm text-red-500 shadow-[0_14px_28px_rgba(254,105,2,0.08)]">
            {fetchError}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {isLoadingSubjects &&
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[88px] animate-pulse rounded-[24px] bg-white"
              />
            ))}

          {!isLoadingSubjects &&
            subjects.slice(0, 6).map((subject) => (
              <StudentSubjectCard
                key={subject.subjectID}
                baseName={subject.subjectName}
                subjectImage={subject.imageUrl}
                meta={`${subject.subjectCode || "Math"} • ${subject.questionCount || 10} quizzes`}
                onClick={() => handleSubjectClick(subject)}
                disabled={loadingExamPreview}
              />
            ))}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
