const apiUrl = import.meta.env.VITE_API_BASE_URL;

function getHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Fetch all notifications for the authenticated user
export async function getNotifications() {
  try {
    const response = await fetch(`${apiUrl}/notifications`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getNotifications service:", error);
    throw error;
  }
}

// Mark a specific notification as read
export async function markNotificationRead(id) {
  try {
    const response = await fetch(`${apiUrl}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification read: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in markNotificationRead service for ID ${id}:`, error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  try {
    const response = await fetch(`${apiUrl}/notifications/mark-all-read`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications read: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in markAllNotificationsRead service:", error);
    throw error;
  }
}

// Delete a specific notification
export async function deleteNotification(id) {
  try {
    const response = await fetch(`${apiUrl}/notifications/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in deleteNotification service for ID ${id}:`, error);
    throw error;
  }
}

// Create a new announcement/notification (staff only)
export async function createAnnouncement(payload) {
  try {
    const response = await fetch(`${apiUrl}/admin/notifications`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create announcement: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createAnnouncement service:", error);
    throw error;
  }
}

// Get announcements sent by the authenticated staff user (paginated)
export async function getSentAnnouncements(page = 1, perPage = 20) {
  try {
    const url = new URL(`${apiUrl}/admin/notifications/sent`);
    url.searchParams.set('page', page);
    url.searchParams.set('per_page', perPage);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sent announcements: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getSentAnnouncements service:', error);
    throw error;
  }
}

// Delete a sent announcement
export async function deleteSentAnnouncement(id) {
  try {
    const response = await fetch(`${apiUrl}/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete announcement: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteSentAnnouncement service:', error);
    throw error;
  }
}

// Delete all sent announcements
export async function deleteAllSentAnnouncements() {
  try {
    const response = await fetch(`${apiUrl}/admin/notifications/all`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete all announcements: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteAllSentAnnouncements service:', error);
    throw error;
  }
}

