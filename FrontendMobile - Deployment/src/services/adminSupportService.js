import { apiRequest } from "./apiClient";

function mapSupportStatus(status) {
  if (status === "open") return "pending";
  if (status === "in_progress") return "in_review";
  return status;
}

function mapSupportStatusToApi(status) {
  if (status === "pending") return "open";
  if (status === "in_review") return "in_progress";
  return status;
}

function mapSupportTicket(ticket) {
  const firstName = ticket.student?.firstName || "";
  const lastName = ticket.student?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Student";

  return {
    id: ticket.id,
    student: {
      user_id: ticket.user_id,
      name: fullName,
      email: ticket.student?.email || "",
      user_code: ticket.student?.userCode || "",
    },
    subject: ticket.subject,
    message: ticket.description,
    status: mapSupportStatus(ticket.status),
    resolved_by_user_id: ticket.resolved_by ?? null,
    resolved_at: ticket.resolved_at ?? null,
    created_at: ticket.created_at,
    category: ticket.category,
    priority: ticket.priority,
  };
}

// Get support requests.
export async function getSupportRequests() {
  const response = await apiRequest("/api/admin/support/tickets");

  return {
    ...response,
    data: (response.data || []).map(mapSupportTicket),
  };
}

// Get support request by id.
export async function getSupportRequestById(id) {
  const response = await getSupportRequests();
  const item = (response.data || []).find((request) => request.id === id) ?? null;

  return {
    message: "Support request fetched successfully.",
    data: item ?? null,
  };
}

// Update support request status.
export async function updateSupportRequestStatus(id, payload) {
  const response = await apiRequest(`/api/admin/support/tickets/${id}`, {
    method: "PATCH",
    body: {
      ...payload,
      status: payload.status ? mapSupportStatusToApi(payload.status) : undefined,
    },
  });

  return {
    ...response,
    data: {
      id: response.data?.id ?? id,
      status: mapSupportStatus(response.data?.status),
      resolved_by_user_id: response.data?.resolved_by ?? null,
      resolved_at: response.data?.resolved_at ?? null,
    },
  };
}
