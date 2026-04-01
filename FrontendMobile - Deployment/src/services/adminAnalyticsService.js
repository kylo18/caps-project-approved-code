import { apiRequest } from "./apiClient";

// Keep each analytics call isolated instead of returning one giant blob so the
// frontend can load cards and charts independently when the real API arrives.
export async function getDashboardSummary() {
  return apiRequest("/api/admin/analytics/summary");
}

// Get average score per subject.
export async function getAverageScorePerSubject() {
  const response = await apiRequest("/api/admin/analytics/average-score-per-subject");
  return {
    ...response,
    data: (response.data || []).map((subject) => ({
      subject_id: subject.subjectID,
      subject_name: subject.subjectName,
      average_score: Number(subject.avg_score ?? 0).toFixed
        ? Number(Number(subject.avg_score ?? 0).toFixed(2))
        : subject.avg_score ?? 0,
    })),
  };
}

// Get student progress over time.
export async function getStudentProgressOverTime() {
  const response = await apiRequest("/api/admin/analytics/student-progress");
  return {
    ...response,
    data: (response.data || []).map((item) => ({
      label: item.period,
      average_score: Number(item.avg_score ?? 0).toFixed
        ? Number(Number(item.avg_score ?? 0).toFixed(2))
        : item.avg_score ?? 0,
    })),
  };
}

// Get pass fail rate.
export async function getPassFailRate() {
  const response = await apiRequest("/api/admin/analytics/pass-fail-rate");
  return {
    ...response,
    data: {
      pass_count: response.data?.passed ?? 0,
      fail_count: response.data?.failed ?? 0,
      pass_rate: Number(response.data?.pass_rate ?? 0) / 100,
      fail_rate:
        response.data?.total > 0
          ? Number(response.data?.failed ?? 0) / Number(response.data.total)
          : 0,
    },
  };
}

// Get improvement percentage.
export async function getImprovementPercentage() {
  const response = await apiRequest("/api/admin/analytics/improvement-percentage");
  return {
    ...response,
    data: {
      improvement_percentage: Number(response.data?.improvement_percentage ?? 0) / 100,
    },
  };
}

// Get topic mastery level.
export async function getTopicMasteryLevel() {
  const response = await apiRequest("/api/admin/analytics/topic-mastery");
  return {
    ...response,
    data: (response.data || []).map((item) => ({
      topic: item.topic,
      mastery_rate: Math.max(0, Math.min(1, 1 - Number(item.avg_difficulty ?? 0))),
    })),
  };
}

// Get content analytics.
export async function getContentAnalytics() {
  return apiRequest("/api/admin/analytics/content");
}
