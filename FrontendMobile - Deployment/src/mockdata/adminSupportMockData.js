export const mockAdminSupportRequestsResponse = {
  data: [
    {
      id: 12,
      student: {
        user_id: 45,
        name: "Juan Dela Cruz",
        email: "juan@example.com",
        user_code: "2024-00123",
      },
      subject: "Quiz issue",
      message: "I cannot proceed after clicking the start button.",
      status: "pending",
      resolved_by_user_id: null,
      resolved_at: null,
      created_at: "2026-03-19T12:00:00Z",
    },
    {
      id: 13,
      student: {
        user_id: 46,
        name: "Maria Santos",
        email: "maria@example.com",
        user_code: "2024-00124",
      },
      subject: "Lesson access",
      message: "The lesson page is blank when I open it.",
      status: "in_review",
      resolved_by_user_id: null,
      resolved_at: null,
      created_at: "2026-03-19T13:00:00Z",
    },
  ],
};
