import {
  mockFaqsResponse,
  mockSupportSubmitResponse,
} from "../mockdata/helpMockData";

// Keep the service signature aligned with the planned backend contract so the
// component layer does not change when mock data is replaced with real fetches.
export async function getFaqs() {
  // Returns the FAQ list shown at the top of the help center modal.
  return Promise.resolve(mockFaqsResponse);
}

// Submit support request.
export async function submitSupportRequest(payload) {
  // Echo the submitted subject/message back in the response so the modal can
  // already behave like a real backend-backed form submission flow.
  return Promise.resolve({
    ...mockSupportSubmitResponse,
    data: {
      ...mockSupportSubmitResponse.data,
      subject: payload.subject,
      message: payload.message,
    },
  });
}
