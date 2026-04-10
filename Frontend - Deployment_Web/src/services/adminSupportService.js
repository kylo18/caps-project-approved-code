import { mockAdminSupportRequestsResponse } from "../mockdata/adminSupportMockData";

// Get support requests.
export async function getSupportRequests() {
  // Returns the queue shown in the admin support left panel.
  return Promise.resolve(mockAdminSupportRequestsResponse);
}

// Get support request by id.
export async function getSupportRequestById(id) {
  // Match the backend lookup flow now so the detail panel can later switch to
  // an actual per-record endpoint without changing the page logic.
  const item = mockAdminSupportRequestsResponse.data.find(
    (request) => request.id === id,
  );

  return Promise.resolve({
    message: "Support request fetched successfully.",
    data: item ?? null,
  });
}

// Update support request status.
export async function updateSupportRequestStatus(id, payload) {
  // Returns only the fields the page needs to merge the updated status into
  // both the selected detail record and the list badge.
  return Promise.resolve({
    message: "Support request updated successfully.",
    data: {
      id,
      status: payload.status,
      resolved_by_user_id: payload.status === "resolved" ? 4 : null,
      resolved_at:
        payload.status === "resolved" ? "2026-03-20T08:15:00Z" : null,
    },
  });
}
