import {
  mockAdminDashboardSummaryResponse,
  mockAverageScorePerSubjectResponse,
  mockContentAnalyticsResponse,
  mockImprovementPercentageResponse,
  mockPassFailRateResponse,
  mockStudentProgressOverTimeResponse,
  mockTopicMasteryLevelResponse,
} from "../mockdata/adminAnalyticsMockData";

// Keep each analytics call isolated instead of returning one giant blob so the
// frontend can load cards and charts independently when the real API arrives.
export async function getDashboardSummary() {
  return Promise.resolve(mockAdminDashboardSummaryResponse);
}

// Get average score per subject.
export async function getAverageScorePerSubject() {
  return Promise.resolve(mockAverageScorePerSubjectResponse);
}

// Get student progress over time.
export async function getStudentProgressOverTime() {
  return Promise.resolve(mockStudentProgressOverTimeResponse);
}

// Get pass fail rate.
export async function getPassFailRate() {
  return Promise.resolve(mockPassFailRateResponse);
}

// Get improvement percentage.
export async function getImprovementPercentage() {
  return Promise.resolve(mockImprovementPercentageResponse);
}

// Get topic mastery level.
export async function getTopicMasteryLevel() {
  return Promise.resolve(mockTopicMasteryLevelResponse);
}

// Get content analytics.
export async function getContentAnalytics() {
  return Promise.resolve(mockContentAnalyticsResponse);
}
