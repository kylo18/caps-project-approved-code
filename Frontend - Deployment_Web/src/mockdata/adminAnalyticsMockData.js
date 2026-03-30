export const mockAdminDashboardSummaryResponse = {
  data: {
    average_score: 78.4,
    pass_rate: 0.67,
    improvement_percentage: 0.12,
    active_students: 320,
  },
};

export const mockAverageScorePerSubjectResponse = {
  data: [
    {
      subject_id: 1,
      subject_name: "Calculus 1",
      average_score: 76.2,
    },
    {
      subject_id: 2,
      subject_name: "Calculus 2",
      average_score: 81.5,
    },
  ],
};

export const mockStudentProgressOverTimeResponse = {
  data: [
    {
      label: "Week 1",
      average_score: 70.4,
    },
    {
      label: "Week 2",
      average_score: 74.1,
    },
    {
      label: "Week 3",
      average_score: 78.6,
    },
  ],
};

export const mockPassFailRateResponse = {
  data: {
    pass_count: 214,
    fail_count: 106,
    pass_rate: 0.67,
    fail_rate: 0.33,
  },
};

export const mockImprovementPercentageResponse = {
  data: {
    improvement_percentage: 0.12,
  },
};

export const mockTopicMasteryLevelResponse = {
  data: [
    {
      topic: "Limits",
      mastery_rate: 0.89,
    },
    {
      topic: "Differentiation",
      mastery_rate: 0.61,
    },
    {
      topic: "Integration",
      mastery_rate: 0.54,
    },
  ],
};

export const mockContentAnalyticsResponse = {
  data: {
    most_viewed_lessons: [
      {
        lesson_id: 10,
        lesson_title: "Introduction to Limits",
        views: 540,
      },
    ],
    most_attempted_quiz_questions: [
      {
        question_id: 101,
        question_preview: "Find the derivative of x^2",
        attempts: 230,
      },
    ],
    highest_error_questions: [
      {
        question_id: 88,
        question_preview: "Evaluate the integral",
        error_rate: 0.74,
      },
    ],
    most_skipped_topics: [
      {
        topic: "Integration by Parts",
        skip_count: 95,
      },
    ],
  },
};
