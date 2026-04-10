export const mockNotificationsResponse = {
  data: [
    {
      id: 55,
      title: "New Lesson Available",
      message: "A new lesson in Calculus 1 is now available.",
      type: "lesson",
      is_read: false,
      action_url: "/student-dashboard",
      created_at: "2026-03-19T08:00:00Z",
    },
    {
      id: 56,
      title: "Quiz Results Posted",
      message: "Your Calculus 1 quiz result is now available.",
      type: "quiz_result",
      is_read: false,
      action_url: "/practice-exam-result",
      created_at: "2026-03-19T10:00:00Z",
    },
    {
      id: 57,
      title: "Achievement Update",
      message: "You reached 5 completed quizzes.",
      type: "achievement",
      is_read: true,
      action_url: "/student-insights",
      created_at: "2026-03-18T14:00:00Z",
    },
    {
      id: 58,
      title: "System Announcement",
      message: "The system will undergo maintenance at 8:00 PM.",
      type: "announcement",
      is_read: false,
      action_url: null,
      created_at: "2026-03-18T18:30:00Z",
    },
  ],
  meta: {
    unread_count: 3,
  },
};
