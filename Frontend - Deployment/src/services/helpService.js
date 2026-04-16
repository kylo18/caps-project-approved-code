import { apiRequest } from "./apiClient";

function normalizeFaq(faq) {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sort_order: faq.display_order ?? 0,
  };
}

// Keep the service signature aligned with the planned backend contract so the
// component layer does not change when mock data is replaced with real fetches.
export async function getFaqs() {
  const response = await apiRequest("/api/support/faqs", { auth: false });
  const faqData = response.data;
  const flatFaqs = Array.isArray(faqData)
    ? faqData
    : Object.values(faqData || {}).flat();

  return {
    ...response,
    data: flatFaqs.map(normalizeFaq),
  };
}

// Submit support request.
export async function submitSupportRequest(payload, roleId) {
  if (roleId !== 1) {
    return apiRequest("/api/admin/notifications", {
      method: "POST",
      body: {
        type: "system_announcement",
        title: payload.subject,
        message: payload.message,
        target_type: "all",
      },
    });
  }

  return apiRequest("/api/support/tickets", {
    method: "POST",
    body: {
      subject: payload.subject,
      description: payload.message,
      category: "other",
    },
  });
}
