import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../utils/config";
import {
  getDashboardSummary,
  getLearningInsights,
  getPerformanceTrend,
} from "../services/studentAnalyticsService";

const initialsFromName = (name = "Student") => {
  if (!name || typeof name !== 'string') return 'ST';
  return name
    .split(" ")
    .filter(part => part && part[0])
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const safeFormatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  } catch (e) {
    return 'N/A';
  }
};

// Component for Recent Performance with show all dropdown
const RecentPerformanceSection = ({ trend }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const displayTrend = showAll ? trend : (trend || []).slice(0, 5);
  const hasMore = (trend || []).length > 5;

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recent Performance</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-semibold text-[#ff7a00] transition hover:opacity-80"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {displayTrend.map((item, index) => (
          <button
            key={`${item?.label || 'exam'}-${index}`}
            onClick={() => {
              if (item?.result_id) {
                navigate('/practice-exam-result', { state: { resultId: item.result_id } });
              }
            }}
            className={`w-full flex items-center justify-between rounded-[24px] border border-orange-100 bg-white px-4 py-3 shadow-[0_16px_28px_rgba(254,105,2,0.06)] ${item?.result_id ? 'cursor-pointer hover:bg-orange-50 transition' : ''}`}
          >
            <div className="text-left">
              <div className="text-[15px] font-bold text-slate-900">
                {item?.label || 'Exam'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {item?.taken_at ? new Date(item.taken_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div className="text-lg font-bold text-[#ff7a00]">
              {item?.score_percentage ?? '--'}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const StudentInsights = () => {
  const navigate = useNavigate();
  const apiUrl = getApiUrl();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState("");
  const fullName =
    profile?.fullName ||
    profile?.name ||
    JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
    "Student";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        console.log('Profile loaded:', data);
        setProfile(data);
      } catch (fetchError) {
        console.error("Profile fetch error:", fetchError);
      }
    };

    Promise.all([
      fetchProfile(),
      getDashboardSummary().then((response) => {
        console.log('Summary loaded:', response);
        setSummary(response?.data || null);
      }),
      getLearningInsights().then((response) => {
        console.log('Insights loaded:', response);
        setInsights(response?.data || null);
      }),
      getPerformanceTrend().then((response) => {
        console.log('Trend loaded:', response);
        setTrend(response?.data || []);
      }),
    ]).catch((fetchError) => {
      console.error("Student insights fetch error:", fetchError);
      setError("Unable to load insights right now.");
    });
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-[#fff7f1] pb-32 text-slate-900">
      <section className="relative overflow-hidden rounded-b-[36px] bg-[linear-gradient(180deg,#ff7a00_0%,#ff8c1a_100%)] px-5 pb-12 pt-6 text-white">
        <div className="absolute -right-6 top-3 h-32 w-32 rounded-full border border-white/10" />
        <div className="absolute left-8 top-20 h-44 w-44 rounded-full border border-white/8" />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/student-dashboard")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16"
          >
            <i className="bx bx-left-arrow-alt text-[24px]" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/35 bg-white/18 text-xl font-bold">
            {initialsFromName(fullName)}
          </div>
          <div className="mt-4 w-full rounded-[30px] bg-white px-5 py-5 text-center text-slate-900 shadow-[0_16px_28px_rgba(254,105,2,0.18)]">
            <h1 className="text-[28px] font-bold">{fullName}</h1>

            <div className="mt-5 rounded-[22px] bg-[linear-gradient(180deg,#ff7a00_0%,#ff8c1a_100%)] px-4 py-4 text-white">
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-[18px] bg-white/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-orange-100">
                    Average Attempts
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {insights?.average_attempts_before_passing ??
                      summary?.total_exams ??
                      "--"}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-orange-100">
                    Strongest Topic
                  </div>
                  <div className="mt-2 text-lg font-bold">
                    {insights?.strong_topics?.[0]?.topic ??
                      summary?.weakest_topic?.name ??
                      "--"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-left">
              {error && (
                <div className="mb-4 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Weak Areas</h2>
              </div>

              <div className="space-y-3">
                {(insights?.weak_topics || []).map((item, index) => (
                  <div
                    key={item.topic}
                    className="flex items-center gap-3 rounded-[24px] border border-orange-100 bg-white px-4 py-3 shadow-[0_16px_28px_rgba(254,105,2,0.06)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#fff1e5] text-[#ff7a00]">
                      <i
                        className={`bx ${index % 2 === 0 ? "bx-math" : "bx-book-open"} text-[22px]`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-bold text-slate-900">
                        {item.topic}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {Math.round((item.error_rate ?? 0) * 100)}% Error rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3 mt-7 flex items-center justify-between">
                <h2 className="text-xl font-bold">Time per Topic</h2>
              </div>

              <div className="space-y-3">
                {(insights?.time_spent_per_topic || []).map((item, index) => (
                  <div
                    key={item.topic}
                    className="rounded-[24px] border border-orange-100 bg-white px-4 py-3 shadow-[0_16px_28px_rgba(254,105,2,0.06)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#fff1e5] text-[#ff7a00]">
                        <i
                          className={`bx ${
                            index % 2 === 0 ? "bx-atom" : "bx-line-chart"
                          } text-[22px]`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-slate-900">
                          {item?.topic || 'Unknown'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item?.minutes ?? 0} minutes
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#fff1e5]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#ffb36c_0%,#ff7a00_100%)]"
                        style={{
                          width: `${Math.min(100, Math.max(10, ((item?.minutes ?? 0) / 60) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <RecentPerformanceSection trend={trend} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentInsights;
