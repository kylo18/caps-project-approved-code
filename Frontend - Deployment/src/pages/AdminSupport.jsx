import { useEffect, useState } from "react";
import {
  getSupportRequestById,
  getSupportRequests,
  updateSupportRequestStatus,
} from "../services/adminSupportService";

const cardClasses =
  "rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[var(--color-bg-secondary)]";

// Render the admin support component.
const AdminSupport = () => {
  // Stores the left-panel queue of support requests.
  const [requests, setRequests] = useState([]);
  // Tracks which request id is currently selected from the list.
  const [selectedId, setSelectedId] = useState(null);
  // Stores the full detail shown in the right-side request panel.
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    // Load the request queue once and auto-select the first item so the page
    // opens with a visible detail state instead of an empty right panel.
    getSupportRequests().then((response) => {
      setRequests(response.data || []);
      if (response.data?.length) {
        setSelectedId(response.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    // Fetch the detail for the currently selected request. This mirrors a real
    // list/detail backend flow where the detail payload can evolve separately.
    getSupportRequestById(selectedId).then((response) => {
      setSelectedRequest(response.data);
    });
  }, [selectedId]);

  // Handle resolve.
  const handleResolve = async () => {
    if (!selectedRequest) return;

    const response = await updateSupportRequestStatus(selectedRequest.id, {
      status: "resolved",
    });

    // Update the detail panel immediately so the active record reflects the
    // resolved status returned by the service.
    setSelectedRequest((current) =>
      current
        ? {
            ...current,
            ...response.data,
          }
        : current,
    );

    // Update the list row too, so the queue badge stays in sync with the
    // detail panel after the admin resolves a request.
    setRequests((current) =>
      current.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, status: response.data.status }
          : item,
      ),
    );
  };

  return (
    <div className="mx-auto mt-4 grid w-full max-w-6xl gap-4 px-2 pb-10 lg:grid-cols-[1.2fr,1fr]">
      <section className={cardClasses}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
            Support Requests
          </h2>
          <span className="text-[12px] tracking-wide text-gray-400 uppercase">
            {requests.length} total
          </span>
        </div>

        <div className="space-y-3">
          {requests.map((request) => (
            <button
              key={request.id}
              type="button"
              // Selecting a row changes selectedId, which triggers the detail fetch.
              onClick={() => setSelectedId(request.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedId === request.id
                  ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/20"
                  : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-gray-900 dark:text-white">
                    {request.student.name}
                  </div>
                  <div className="mt-1 text-[13px] text-gray-500 dark:text-gray-300">
                    {request.subject}
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-orange-500 uppercase dark:bg-black">
                  {request.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={cardClasses}>
        {selectedRequest ? (
          <>
            <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">
              Request Details
            </h2>
            <div className="mt-4 space-y-4 text-[14px] text-gray-600 dark:text-gray-300">
              <div>
                <div className="text-[12px] tracking-wide text-gray-400 uppercase">
                  Student
                </div>
                <div className="mt-1 font-medium text-gray-900 dark:text-white">
                  {selectedRequest.student.name}
                </div>
                <div>{selectedRequest.student.email}</div>
                <div>{selectedRequest.student.user_code}</div>
              </div>

              <div>
                <div className="text-[12px] tracking-wide text-gray-400 uppercase">
                  Concern
                </div>
                <div className="mt-1 rounded-2xl bg-gray-50 px-4 py-4 leading-6 dark:bg-[var(--color-bg-tertiary)]">
                  {selectedRequest.message}
                </div>
              </div>

              <button
                type="button"
                onClick={handleResolve}
                disabled={selectedRequest.status === "resolved"}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {selectedRequest.status === "resolved"
                  ? "Already Resolved"
                  : "Mark as Resolved"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-[14px] text-gray-500 dark:text-gray-300">
            Select a request to view its details.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSupport;
