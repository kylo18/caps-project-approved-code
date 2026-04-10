export const mockStudentDashboardSummaryResponse = {
  data: {
    frequently_mistaken_questions_count: 24,
    average_score: 82,
    achievement_progress: {
      current: 3,
      next_target: 5,
      label: "3 of 5 milestones",
    },
    weakest_topic: {
      name: "Differentiation",
      error_rate: 0.68,
    },
  },
};

export const mockLearningInsightsResponse = {
  data: {
    weak_topics: [
      {
        topic: "Differentiation",
        error_rate: 0.68,
      },
      {
        topic: "Integration",
        error_rate: 0.59,
      },
    ],
    strong_topics: [
      {
        topic: "Limits",
        success_rate: 0.91,
      },
      {
        topic: "Functions",
        success_rate: 0.87,
      },
    ],
    average_attempts_before_passing: 2.3,
    difficulty_index: [
      {
        topic: "Integration",
        index: 0.74,
      },
      {
        topic: "Differentiation",
        index: 0.69,
      },
    ],
    time_spent_per_topic: [
      {
        topic: "Derivatives",
        minutes: 42,
      },
      {
        topic: "Limits",
        minutes: 28,
      },
      {
        topic: "Integration",
        minutes: 51,
      },
    ],
  },
};

export const mockPerformanceTrendResponse = {
  data: [
    {
      label: "Quiz 1",
      score_percentage: 72,
      taken_at: "2026-03-10T09:00:00Z",
    },
    {
      label: "Quiz 2",
      score_percentage: 81,
      taken_at: "2026-03-13T09:00:00Z",
    },
    {
      label: "Quiz 3",
      score_percentage: 85,
      taken_at: "2026-03-17T09:00:00Z",
    },
  ],
};
