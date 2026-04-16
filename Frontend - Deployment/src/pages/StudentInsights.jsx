import { useEffect, useState } from "react";
import {
  getLearningInsights,
  getPerformanceTrend,
} from "../services/studentAnalyticsService";

const metricCardClasses =
  "rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[var(--color-bg-secondary)]";

// Render the student insights component.
const StudentInsights = () => {
  // Holds summary and topic-level analytics for the insights page.
  const [insights, setInsights] = useState(null);
  // Holds the dated score history shown in the recent trend section.
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    // Load the detailed analytics payload and the recent performance trend
    // separately so each section can evolve without one oversized response.
    getLearningInsights().then((response) => setInsights(response.data));
    getPerformanceTrend().then((response) => setTrend(response.data || []));
  }, []);

  return (
    <div className="mx-auto mt-4 flex w-full max-w-5xl flex-col gap-4 px-2 pb-24">
      <section className="grid grid-cols-2 gap-3">
        <article className={metricCardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Avg Attempts
          </div>
          <div className="mt-2 text-[26px] font-semibold text-gray-900 dark:text-white">
            {insights?.average_attempts_before_passing ?? "--"}
          </div>
        </article>
        <article className={metricCardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Strongest Subject
          </div>
          <div className="mt-2 text-[18px] font-semibold text-gray-900 dark:text-white">
            {insights?.strong_topics?.[0]?.topic ?? "--"}
          </div>
        </article>
      </section>

      <section className={metricCardClasses}>
        <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Subjects You Need More Practice In
        </h2>
        <div className="mt-4 space-y-3">
          {/* Weak topics highlight where the student has the highest error rate. */}
          {insights?.weak_topics?.map((item) => (
            <div
              key={item.topic}
              className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[var(--color-bg-tertiary)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-medium text-gray-800 dark:text-white">
                  {item.topic}
                </span>
                <span className="text-[13px] text-orange-500">
                  {Math.round(item.error_rate * 100)}% error rate
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={metricCardClasses}>
        <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Study Time by Subject
        </h2>
        <div className="mt-4 space-y-4">
          {insights?.time_spent_per_topic?.map((item) => {
            // Cap the bar width so unusually large values do not break the UI scale.
            const width = `${(Math.min(item.minutes, 60) / 60) * 100}%`;

            return (
              <div key={item.topic}>
                <div className="mb-2 flex items-center justify-between text-[13px] text-gray-600 dark:text-gray-300">
                  <span>{item.topic}</span>
                  <span>{item.minutes} mins</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={metricCardClasses}>
        <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Recent Performance Trend
        </h2>
        <div className="mt-4 space-y-3">
          {/* Each row shows the assessment label, date, and score percentage. */}
          {trend.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[var(--color-bg-tertiary)]"
            >
              <div>
                <div className="text-[14px] font-medium text-gray-800 dark:text-white">
                  {item.label}
                </div>
                <div className="text-[12px] text-gray-500 dark:text-gray-300">
                  {new Date(item.taken_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-[18px] font-semibold text-orange-500">
                {item.score_percentage}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StudentInsights;
