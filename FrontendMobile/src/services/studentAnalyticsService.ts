import { apiRequest } from './apiClient';

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
    console.error('Failed to get dashboard summary:', error);
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

    // Backend returns: strong_topics[].topic, strong_topics[].avg_score
    const strongTopics = (data.strong_topics || []).map((item: any) => ({
      topic: item.topic,
      success_rate: Number(item.avg_score ?? 0) / 100,
    }));

    // Backend returns: weak_topics[].topic, weak_topics[].avg_score
    // We calculate error_rate from avg_score
    const weakTopics = (data.weak_topics || []).map((item: any) => ({
      topic: item.topic,
      error_rate: 1 - Number(item.avg_score ?? 0) / 100,
    }));

    // Backend returns: time_spent_per_topic[].topic, time_spent_per_topic[].total_time
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
    console.error('Failed to get learning insights:', error);
    return {
      data: {
        strongest_subject: null,
        strong_topics: [],
        weak_topics: [],
        time_spent_per_topic: [],
        average_attempts_before_passing: null,
      },
    };
  }
}

export async function getFrequentlyMistakenQuestions() {
  try {
    const response = await apiRequest('/api/student/analytics/frequently-mistaken');
    const data = response?.data || [];
    return { data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error('Failed to get frequently mistaken questions:', error);
    return { data: [] };
  }
}
