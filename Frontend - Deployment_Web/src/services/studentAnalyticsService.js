import {
  mockLearningInsightsResponse,
  mockPerformanceTrendResponse,
  mockStudentDashboardSummaryResponse,
} from "../mockdata/studentAnalyticsMockData";

// These service wrappers intentionally mirror the future API boundaries:
// dashboard summary for home, insights for detail cards, and trend for charts.
export async function getDashboardSummary() {
  // Used by the student dashboard preview cards, not the full insights page.
  return Promise.resolve(mockStudentDashboardSummaryResponse);
}

// Get learning insights.
export async function getLearningInsights() {
  // Used by StudentInsights.jsx for topic-level strengths, weaknesses, and study time.
  return Promise.resolve(mockLearningInsightsResponse);
}

// Get performance trend.
export async function getPerformanceTrend() {
  // Kept separate from getLearningInsights() so chart/history data can evolve independently.
  return Promise.resolve(mockPerformanceTrendResponse);
}
