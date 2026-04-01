import { useEffect, useState } from "react";
import {
  getAverageScorePerSubject,
  getContentAnalytics,
  getDashboardSummary,
  getImprovementPercentage,
  getPassFailRate,
  getStudentProgressOverTime,
  getTopicMasteryLevel,
} from "../services/adminAnalyticsService";

const cardClasses =
  "rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[var(--color-bg-secondary)]";

// Render the admin analytics component.
const AdminAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState([]);
  const [passFail, setPassFail] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [content, setContent] = useState(null);

  useEffect(() => {
    getDashboardSummary().then((response) => setSummary(response.data));
    getAverageScorePerSubject().then((response) => setSubjects(response.data));
    getStudentProgressOverTime().then((response) => setProgress(response.data));
    getPassFailRate().then((response) => setPassFail(response.data));
    getImprovementPercentage().then((response) =>
      setImprovement(response.data),
    );
    getTopicMasteryLevel().then((response) => setMastery(response.data));
    getContentAnalytics().then((response) => setContent(response.data));
  }, []);

  return (
    <div className="mx-auto mt-4 flex w-full max-w-6xl flex-col gap-4 px-2 pb-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={cardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Average Score
          </div>
          <div className="mt-2 text-[28px] font-semibold text-gray-900 dark:text-white">
            {summary ? `${summary.average_score}%` : "--"}
          </div>
        </article>
        <article className={cardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Pass Rate
          </div>
          <div className="mt-2 text-[28px] font-semibold text-gray-900 dark:text-white">
            {passFail ? `${Math.round(passFail.pass_rate * 100)}%` : "--"}
          </div>
        </article>
        <article className={cardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Improvement
          </div>
          <div className="mt-2 text-[28px] font-semibold text-gray-900 dark:text-white">
            {improvement
              ? `+${Math.round(improvement.improvement_percentage * 100)}%`
              : "--"}
          </div>
        </article>
        <article className={cardClasses}>
          <div className="text-[12px] tracking-wide text-gray-400 uppercase">
            Active Students
          </div>
          <div className="mt-2 text-[28px] font-semibold text-gray-900 dark:text-white">
            {summary?.active_students ?? "--"}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={cardClasses}>
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
            Average Score per Subject
          </h2>
          <div className="mt-4 space-y-3">
            {subjects.map((subject) => (
              <div key={subject.subject_id}>
                <div className="mb-2 flex items-center justify-between text-[13px] text-gray-600 dark:text-gray-300">
                  <span>{subject.subject_name}</span>
                  <span>{subject.average_score}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${subject.average_score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={cardClasses}>
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
            Student Progress Over Time
          </h2>
          <div className="mt-4 space-y-3">
            {progress.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[var(--color-bg-tertiary)]"
              >
                <span className="text-[14px] text-gray-800 dark:text-white">
                  {item.label}
                </span>
                <span className="text-[14px] font-semibold text-orange-500">
                  {item.average_score}%
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={cardClasses}>
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
            Topic Mastery Level
          </h2>
          <div className="mt-4 space-y-3">
            {mastery.map((item) => (
              <div
                key={item.topic}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[var(--color-bg-tertiary)]"
              >
                <span className="text-[14px] text-gray-800 dark:text-white">
                  {item.topic}
                </span>
                <span className="text-[14px] font-semibold text-orange-500">
                  {Math.round(item.mastery_rate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className={cardClasses}>
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
            Content Analytics
          </h2>
          <div className="mt-4 space-y-4 text-[14px] text-gray-600 dark:text-gray-300">
            <div>
              <div className="text-[12px] tracking-wide text-gray-400 uppercase">
                Most Viewed Lesson
              </div>
              <div className="mt-1 text-gray-900 dark:text-white">
                {content?.most_viewed_lessons?.[0]?.lesson_title}
              </div>
            </div>
            <div>
              <div className="text-[12px] tracking-wide text-gray-400 uppercase">
                Most Attempted Question
              </div>
              <div className="mt-1 text-gray-900 dark:text-white">
                {content?.most_attempted_quiz_questions?.[0]?.question_preview}
              </div>
            </div>
            <div>
              <div className="text-[12px] tracking-wide text-gray-400 uppercase">
                Highest Error Topic
              </div>
              <div className="mt-1 text-gray-900 dark:text-white">
                {content?.most_skipped_topics?.[0]?.topic}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminAnalytics;
