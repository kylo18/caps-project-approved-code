import { mockNotificationsResponse } from "../mockdata/notificationMockData";

// Manage clone notifications.
function cloneNotifications() {
  // Clone each object so read-state changes in the UI do not mutate the source mock data.
  return mockNotificationsResponse.data.map((item) => ({ ...item }));
}

// Return a fresh copy on each call so UI state mutations do not leak back into
// the mock source and create inconsistent read/unread behavior across screens.
export async function getNotifications() {
  const data = cloneNotifications();
  return Promise.resolve({
    data,
    meta: {
      unread_count: data.filter((item) => !item.is_read).length,
    },
  });
}

// Manage mark notification read.
export async function markNotificationRead(id) {
  // Minimal response shape for optimistic UI updates in NotificationPanel.jsx.
  return Promise.resolve({
    message: "Notification marked as read.",
    data: {
      id,
      is_read: true,
    },
  });
}

// Manage mark all notifications read.
export async function markAllNotificationsRead() {
  // The panel updates local state after this call instead of refetching the whole list.
  return Promise.resolve({
    message: "All notifications marked as read.",
  });
}
