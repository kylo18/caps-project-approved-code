import { apiRequest } from '../../../../services/apiClient';

function getAnalyticsErrorMessage(error: any, fallback: string) {
  return error?.data?.message || error?.response?.data?.message || error?.message || fallback;
}

export async function getDashboardSummary() {
  try {
    const response = await apiRequest('/api/student/analytics/summary');
    const data = response?.data || {};
    return {
      data: {
        total_exams: data.total_exams ?? 0,
        average_score: data.average_score ?? 0,
        best_score: data.best_score ?? 0,
        lowest_score: data.lowest_score ?? 0,
        frequently_mistaken_questions_count: data.frequently_mistaken_questions_count ?? 0,
        average_attempts_before_passing: data.average_attempts_before_passing ?? 0,
        weakest_topic: data.weakest_topic || { name: 'N/A', error_rate: 0 },
        strongest_subject: data.strongest_subject || null,
        achievement_progress: data.achievement_progress || null,
        trend: data.trend || 'stable',
      },
    };
  } catch (error) {
    const message = getAnalyticsErrorMessage(error, 'Unable to load dashboard summary.');
    console.error('Failed to get dashboard summary:', message, error);
    return {
      data: {
        total_exams: 0,
        average_score: 0,
        best_score: 0,
        lowest_score: 0,
        frequently_mistaken_questions_count: 0,
        average_attempts_before_passing: 0,
        weakest_topic: { name: 'N/A', error_rate: 0 },
        strongest_subject: null,
        achievement_progress: null,
        trend: 'stable',
      },
      error: message,
    };
  }
}

export async function getPerformanceTrend() {
  try {
    const response = await apiRequest('/api/student/analytics/trends');
    const trendData = response?.data || [];
    const mapped = Array.isArray(trendData) ? trendData.map((item: any) => ({
      label: item?.subjectName || `Exam`,
      score_percentage: item?.percentage ?? 0,
      taken_at: item?.created_at || null,
      subject_id: item?.subjectID || null,
      result_id: item?.resultID || null,
      attempt_id: item?.attempt_id || null,
    })) : [];

    return { data: mapped };
  } catch (error) {
    console.error('Failed to get performance trend:', error);
    return { data: [] };
  }
}

export async function getLearningInsights() {
  try {
    const response = await apiRequest('/api/student/analytics/insights');
    const data = response?.data || {};

    const strongTopics = (data.strong_topics || []).map((item: any) => ({
      topic: item.topic,
      success_rate: Number(item.avg_score ?? 0) / 100,
    }));

    const weakTopics = (data.weak_topics || []).map((item: any) => ({
      topic: item.topic,
      error_rate: 1 - Number(item.avg_score ?? 0) / 100,
    }));

    const timeSpent = (data.time_spent_per_topic || []).map((item: any) => ({
      topic: item.topic,
      minutes: Math.round(Number(item.total_time ?? 0) / 60),
    }));

    return {
      data: {
        strongest_subject: data.strongest_subject ?? null,
        strong_topics: strongTopics,
        weak_topics: weakTopics,
        time_spent_per_topic: timeSpent,
        average_attempts_before_passing: data.average_attempts_before_passing ?? null,
      },
    };
  } catch (error) {
    const message = getAnalyticsErrorMessage(error, 'Unable to load learning insights.');
    console.error('Failed to get learning insights:', message, error);
    return {
      data: {
        strongest_subject: null,
        strong_topics: [],
        weak_topics: [],
        time_spent_per_topic: [],
        average_attempts_before_passing: null,
      },
      error: message,
    };
  }
}

export async function getFrequentlyMistakenQuestions() {
  try {
    const response = await apiRequest('/api/student/analytics/frequently-mistaken');
    const data = response?.data || [];
    return { data: Array.isArray(data) ? data : [] };
  } catch (error) {
    const message = getAnalyticsErrorMessage(error, 'Unable to load frequently mistaken questions.');
    console.error('Failed to get frequently mistaken questions:', message, error);
    return { data: [], error: message };
  }
}

// ── Missing Analytics Endpoints ─────────────────────────────────────────────

export async function getPracticeExamHistory() {
  try {
    const response = await apiRequest('/api/practice-exam/history');
    const data = response?.data || response || {};
    return { data: Array.isArray(data.history) ? data.history : [] };
  } catch (error) {
    const message = getAnalyticsErrorMessage(error, 'Unable to load practice exam history.');
    console.error('Failed to get practice exam history:', message, error);
    return { data: [], error: message };
  }
}

export async function getPracticeContentAnalytics() {
  try {
    const response = await apiRequest('/api/practice-exam/content-analytics');
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get content analytics:', error);
    return {};
  }
}

export async function getPracticeDifficultyAnalytics() {
  try {
    const response = await apiRequest('/api/practice-exam/difficulty-analytics');
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get difficulty analytics:', error);
    return {};
  }
}

export async function getRecommendations(attemptId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/recommendations/${attemptId}`);
    const data = response?.data || response || {};
    return { data: Array.isArray(data.recommendations) ? data.recommendations : [] };
  } catch (error: unknown) {
    const message = getAnalyticsErrorMessage(
      error instanceof Error ? error : new Error(String(error)),
      'Unable to load recommendations.'
    );
    console.error('Failed to get recommendations:', message, error);
    return { data: [], error: message };
  }
}

export async function getWeakTopics(userId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/weak-topics/${userId}`);
    const data = response?.data || response || {};
    return { data: Array.isArray(data.weak_topics) ? data.weak_topics : [] };
  } catch (error) {
    console.error('Failed to get weak topics:', error);
    return { data: [] };
  }
}

export async function getRank(examId: number | string, userId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/rank/${examId}/${userId}`);
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get rank:', error);
    return {};
  }
}

export async function getProgress(userId: number | string, subjectId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/progress/${userId}/${subjectId}`);
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get progress:', error);
    return { history: [], improvement_pct: null };
  }
}

export async function getSubjectScore(userId: number | string, subjectId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/subject-score/${userId}/${subjectId}`);
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get subject score:', error);
    return {};
  }
}

export async function getStudentSummary(userId: number | string, attemptId: number | string) {
  try {
    const response = await apiRequest(`/api/analytics/student-summary/${userId}/${attemptId}`);
    return response?.data || response || {};
  } catch (error) {
    console.error('Failed to get student summary:', error);
    return {};
  }
}
