export const mockFaqsResponse = {
  data: [
    {
      id: 1,
      question: "How do I start a quiz?",
      answer:
        "Open a subject from the dashboard, then tap the practice exam card to continue.",
      category: "quiz",
      sort_order: 1,
      is_active: true,
    },
    {
      id: 2,
      question: "How do I view my quiz results?",
      answer:
        "After submitting a quiz, you will be redirected to the results page automatically.",
      category: "results",
      sort_order: 2,
      is_active: true,
    },
    {
      id: 3,
      question: "How do I change my password?",
      answer:
        "Open your profile menu in the header and use the change password option.",
      category: "account",
      sort_order: 3,
      is_active: true,
    },
  ],
};

export const mockSupportSubmitResponse = {
  message: "Support request submitted successfully.",
  data: {
    id: 12,
    subject: "Quiz issue",
    message: "I cannot proceed after clicking the start button.",
    status: "pending",
    created_at: "2026-03-19T12:00:00Z",
  },
};
