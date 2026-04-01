import { apiRequest } from "./apiClient";

function resolveActionUrl(type) {
  switch (type) {
    case "achievement":
    case "milestone":
      return "/student-insights";
    case "lesson_available":
    case "enrollment":
      return "/student-dashboard";
    case "quiz_result":
      return "/practice-exam-result";
    default:
      return null;
  }
}

// Return a fresh copy on each call so UI state mutations do not leak back into
// the mock source and create inconsistent read/unread behavior across screens.
export async function getNotifications() {
  const response = await apiRequest("/api/notifications");
  return {
    ...response,
    data: (response.data || []).map((item) => ({
      ...item,
      action_url: resolveActionUrl(item.type),
    })),
  };
}

// Manage mark notification read.
export async function markNotificationRead(id) {
  const response = await apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });

  return {
    ...response,
    data: {
      id,
      is_read: true,
    },
  };
}

// Manage mark all notifications read.
export async function markAllNotificationsRead() {
  return apiRequest("/api/notifications/mark-all-read", {
    method: "POST",
  });
}
