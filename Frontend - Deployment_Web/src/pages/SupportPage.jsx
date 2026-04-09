import { useState } from "react";

// ── Mock data ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    id: 1,
    question: "How do I start a new exam / quiz session?",
    answer:
      "Navigate to Sessions from the sidebar, then click \"Join Session\" and enter the session code provided by your instructor. Once inside, read the instructions and press \"Start Exam\" when you're ready. Make sure you have a stable internet connection before beginning.",
  },
  {
    id: 2,
    question: "How is my rank calculated?",
    answer:
      "Rankings are computed based on your cumulative score across all completed sessions in the current term. Scores are normalised per subject and a weighted average is used when multiple subjects are involved. Leaderboards refresh automatically after every session ends.",
  },
  {
    id: 3,
    question: "Why are my notifications not showing?",
    answer:
      "First, check that notifications are not blocked in your browser or device settings. On mobile, confirm CAPS has permission to send push alerts. If the issue persists, log out, clear your browser cache, and log back in. Contact support if notifications remain missing.",
  },
  {
    id: 4,
    question: "How do I use Google Login?",
    answer:
      "On the login screen tap \"Continue with Google\" and select your institutional Google account (the one ending in your school domain). If you encounter an \"access denied\" error, your account may not yet be registered — reach out to your Program Chair or Dean.",
  },
  {
    id: 5,
    question: "How do I view my quiz results and history?",
    answer:
      "Go to Sessions in the sidebar and select any completed session to see your detailed score breakdown, time spent per question, and how your performance compares to the class average. You can also visit Analytics > Achievements for a summary view.",
  },
  {
    id: 6,
    question: "How do I change my password?",
    answer:
      "Click your avatar in the top-left corner of the sidebar, choose Settings, then select \"Change Password.\" Enter your current password followed by your new password (minimum 8 characters). Hit Apply and you will see a confirmation toast when the change is saved.",
  },
];

const ISSUE_TYPES = [
  "Technical Issue",
  "Account & Login",
  "Exam / Quiz Problem",
  "Notification Problem",
  "Performance & Ranking",
  "Feature Request",
  "Other",
];

// ── Ticket Status Badge ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    open: { label: "Open", bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
    in_progress: { label: "In Progress", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
    resolved: { label: "Resolved", bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
    closed: { label: "Closed", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  };
  const s = map[status] || map.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  );
};

// ── Mock tickets for "My Tickets" tab ─────────────────────────────────────
const MOCK_TICKETS = [
  {
    id: "TKT-0042",
    issue_type: "Technical Issue",
    subject: "Exam timer stopped mid-session",
    message: "During my qualifying exam the countdown froze at 14:32 and I had to refresh the page.",
    status: "in_progress",
    created_at: "2025-07-10",
  },
  {
    id: "TKT-0031",
    issue_type: "Notification Problem",
    subject: "Not receiving email alerts for new sessions",
    message: "I enrolled in two subjects but never got any session notification emails.",
    status: "resolved",
    created_at: "2025-06-28",
  },
  {
    id: "TKT-0018",
    issue_type: "Account & Login",
    subject: "Google login returns 'access denied'",
    message: "Tried to log in with my school Google account but keep getting an access denied error.",
    status: "closed",
    created_at: "2025-06-05",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function SupportPage() {
  // tabs: "help" | "tickets"
  const [activeTab, setActiveTab] = useState("help");
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");

  // form state
  const [form, setForm] = useState({
    issue_type: "",
    subject: "",
    message: "",
  });
  const [charSubject, setCharSubject] = useState(0);
  const [charMessage, setCharMessage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState(null); // null | "success" | "error"
  const [fieldErrors, setFieldErrors] = useState({});

  const filteredFaqs = FAQ_ITEMS.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "subject") setCharSubject(value.length);
    if (name === "message") setCharMessage(value.length);
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.issue_type) errs.issue_type = "Please select an issue type.";
    if (!form.subject.trim()) errs.subject = "Subject is required.";
    else if (form.subject.trim().length < 5) errs.subject = "Subject must be at least 5 characters.";
    if (!form.message.trim()) errs.message = "Message is required.";
    else if (form.message.trim().length < 10) errs.message = "Message must be at least 10 characters.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setIsSubmitting(true);
    setSubmitState(null);
    try {
      // ── Replace with real fetch ──────────────────────────────────────
      // const token = sessionStorage.getItem("token");
      // const res = await fetch(`${apiUrl}/support-tickets`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error();
      await new Promise((r) => setTimeout(r, 1400)); // simulate network
      setSubmitState("success");
      setForm({ issue_type: "", subject: "", message: "" });
      setCharSubject(0);
      setCharMessage(0);
    } catch {
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] font-sans pb-24 lg:pb-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-5 pt-[60px]">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-800">Help Center</h1>
              <p className="text-[13px] text-gray-500">FAQs and support requests in one place.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-gray-200">
            {[
              { key: "help", label: "Help & FAQs", icon: "bx-help-circle" },
              { key: "tickets", label: "My Tickets", icon: "bx-receipt" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-[14px] font-semibold transition-colors ${
                  activeTab === t.key
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className={`bx ${t.icon} text-[16px]`}></i>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ════════════════ HELP TAB ════════════════ */}
        {activeTab === "help" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* LEFT — FAQ ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                    <i className="bx bx-list-ul text-[16px] text-orange-500"></i>
                  </span>
                  <h2 className="text-[15px] font-bold text-gray-800">Frequently Asked Questions</h2>
                </div>

                {/* Search FAQs */}
                <div className="relative mb-4">
                  <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-[16px] text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Accordion */}
                <div className="space-y-2">
                  {filteredFaqs.length === 0 && (
                    <p className="py-4 text-center text-[13px] text-gray-400">No results found.</p>
                  )}
                  {filteredFaqs.map((item) => (
                    <div
                      key={item.id}
                      className={`overflow-hidden rounded-xl border transition-all ${
                        openFaq === item.id
                          ? "border-orange-200 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span
                          className={`text-[13.5px] font-semibold leading-snug ${
                            openFaq === item.id ? "text-orange-700" : "text-gray-700"
                          }`}
                        >
                          {item.question}
                        </span>
                        <i
                          className={`bx flex-shrink-0 text-[18px] transition-transform ${
                            openFaq === item.id
                              ? "bx-chevron-up text-orange-500"
                              : "bx-chevron-down text-gray-400"
                          }`}
                        ></i>
                      </button>
                      {openFaq === item.id && (
                        <div className="border-t border-orange-100 px-4 pb-4 pt-3">
                          <p className="text-[13px] leading-relaxed text-gray-600">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips Card */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <i className="bx bx-bulb text-[16px] text-blue-500"></i>
                  </div>
                  <div>
                    <h3 className="mb-1 text-[13px] font-bold text-blue-800">Quick Tips</h3>
                    <ul className="space-y-1 text-[12px] text-blue-700">
                      <li className="flex items-start gap-1.5"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>Always use a stable internet connection during exams.</li>
                      <li className="flex items-start gap-1.5"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>Use your institutional Google account for login.</li>
                      <li className="flex items-start gap-1.5"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>Check your spam folder if you're missing notification emails.</li>
                      <li className="flex items-start gap-1.5"><span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>Clear your browser cache if the app behaves unexpectedly.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Support Request Form ────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                  <i className="bx bx-support text-[16px] text-orange-500"></i>
                </span>
                <h2 className="text-[15px] font-bold text-gray-800">Report a Problem</h2>
              </div>

              {/* Success Banner */}
              {submitState === "success" && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <i className="bx bx-check text-[18px] text-green-600"></i>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-green-800">Ticket submitted successfully!</p>
                    <p className="text-[12px] text-green-700">We'll review your request and get back to you as soon as possible. You can track it under <strong>My Tickets</strong>.</p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {submitState === "error" && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <i className="bx bx-x text-[18px] text-red-600"></i>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-red-800">Something went wrong.</p>
                    <p className="text-[12px] text-red-700">Please check your connection and try again. If the issue persists, contact your administrator.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Issue Type */}
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    ISSUE TYPE <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="issue_type"
                      value={form.issue_type}
                      onChange={handleFormChange}
                      className={`w-full appearance-none rounded-lg border bg-gray-50 px-4 py-2 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none ${
                        fieldErrors.issue_type ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select an issue type…</option>
                      {ISSUE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <i className="bx bx-chevron-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-400"></i>
                  </div>
                  {fieldErrors.issue_type && (
                    <p className="mt-1 text-[11px] text-red-500">{fieldErrors.issue_type}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    SUBJECT <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    maxLength={100}
                    placeholder="Briefly describe the issue"
                    value={form.subject}
                    onChange={handleFormChange}
                    className={`w-full rounded-lg border bg-gray-50 px-4 py-2 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none ${
                      fieldErrors.subject ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  <div className="mt-1 flex justify-between">
                    {fieldErrors.subject
                      ? <p className="text-[11px] text-red-500">{fieldErrors.subject}</p>
                      : <span />}
                    <span className="text-[11px] text-gray-400">{charSubject}/100</span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                    MESSAGE <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    maxLength={1000}
                    rows={5}
                    placeholder="Tell us what happened and where you got stuck."
                    value={form.message}
                    onChange={handleFormChange}
                    className={`w-full resize-none rounded-lg border bg-gray-50 px-4 py-2 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none ${
                      fieldErrors.message ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  <div className="mt-1 flex justify-between">
                    {fieldErrors.message
                      ? <p className="text-[11px] text-red-500">{fieldErrors.message}</p>
                      : <p className="text-[11px] text-gray-400">Be as specific as possible so we can help you faster.</p>}
                    <span className="text-[11px] text-gray-400">{charMessage}/1000</span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-all ${
                    isSubmitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <i className="bx bx-send text-[16px]"></i>
                      Submit Request
                    </>
                  )}
                </button>
              </form>

              {/* Info note */}
              <p className="mt-4 text-center text-[11px] text-gray-400">
                Tickets are typically reviewed within 1–2 business days. For urgent issues, contact your Program Chair directly.
              </p>
            </div>
          </div>
        )}

        {/* ════════════════ MY TICKETS TAB ════════════════ */}
        {activeTab === "tickets" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                  <i className="bx bx-receipt text-[16px] text-orange-500"></i>
                </span>
                <h2 className="text-[15px] font-bold text-gray-800">My Support Tickets</h2>
              </div>
              <button
                onClick={() => setActiveTab("help")}
                className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[12px] font-semibold text-orange-600 transition hover:bg-orange-100"
              >
                <i className="bx bx-plus text-[14px]"></i>
                New Ticket
              </button>
            </div>

            {/* Ticket list */}
            {MOCK_TICKETS.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <i className="bx bx-inbox text-[48px]"></i>
                <p className="text-[14px]">You haven't submitted any tickets yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {MOCK_TICKETS.map((ticket) => (
                  <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-gray-400">{ticket.id}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {ticket.issue_type}
                          </span>
                        </div>
                        <p className="text-[14px] font-semibold text-gray-800 truncate">{ticket.subject}</p>
                        <p className="mt-0.5 text-[12px] text-gray-500 line-clamp-2">{ticket.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={ticket.status} />
                        <span className="text-[11px] text-gray-400">{ticket.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <p className="text-[12px] text-gray-400">Showing {MOCK_TICKETS.length} ticket(s). Older tickets may be archived.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
