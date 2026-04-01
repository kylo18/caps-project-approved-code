import { apiRequest } from "./apiClient";

// These service wrappers intentionally mirror the future API boundaries:
// dashboard summary for home, insights for detail cards, and trend for charts.
export async function getDashboardSummary() {
  const response = await apiRequest("/api/student/analytics/summary");
  return {
    ...response,
    data: {
      frequently_mistaken_questions_count: 0,
      average_score: response.data?.average_score ?? 0,
      achievement_progress: response.data?.achievement_progress ?? null,
      weakest_topic: {
        name: response.data?.weakest_topic ?? "N/A",
        error_rate: 1 - Number(response.data?.weakest_topic_score ?? 0) / 100,
      },
    },
  };
}

// Get learning insights.
export async function getLearningInsights() {
  const response = await apiRequest("/api/student/analytics/insights");
  const strongTopics = (response.data?.strong_topics || []).map((item) => ({
    topic: item.topic,
    success_rate: Number(item.avg_score ?? 0) / 100,
  }));
  const weakTopics = (response.data?.weak_topics || []).map((item) => ({
    topic: item.topic,
    error_rate: 1 - Number(item.avg_score ?? 0) / 100,
  }));
  const timeSpent = (response.data?.time_spent_per_topic || []).map((item) => ({
    topic: item.topic,
    minutes: Math.round(Number(item.total_time ?? 0) / 60),
  }));

  return {
    ...response,
    data: {
      ...response.data,
      strong_topics: strongTopics,
      weak_topics: weakTopics,
      average_attempts_before_passing: null,
      time_spent_per_topic: timeSpent,
    },
  };
}

// Get performance trend.
export async function getPerformanceTrend() {
  const response = await apiRequest("/api/student/analytics/trends");
  return {
    ...response,
    data: (response.data || []).map((item, index) => ({
      label: item.subjectName || `Exam ${index + 1}`,
      score_percentage: item.percentage,
      taken_at: item.created_at,
    })),
  };
}
