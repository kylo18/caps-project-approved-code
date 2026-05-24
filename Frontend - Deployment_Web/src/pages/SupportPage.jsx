import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";


const apiUrl = import.meta.env.VITE_API_BASE_URL;


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

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
};

const normalizeProgram = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const normalizeStatus = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    key === "in_review" ||
    key === "processing" ||
    key === "fixing" ||
    key === "fix" ||
    key === "fixed" ||
    key === "working" ||
    key === "in_process" ||
    key === "in_progress"
  ) {
    return "in_progress";
  }
  if (key === "done" || key === "resolved" || key === "completed") {
    return "resolved";
  }
  if (key === "closed") {
    return "closed";
  }
  return "open";
};

const statusHelperText = (value) => {
  const normalized = normalizeStatus(value);
  if (normalized === "in_progress") {
    return "Your report is currently being processed by the support team.";
  }
  if (normalized === "resolved") {
    return "Your report has been resolved.";
  }
  if (normalized === "closed") {
    return "Your report is closed.";
  }
  return "Your report is in queue and waiting for review.";
};

export default function SupportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "help");
  const [currentUser, setCurrentUser] = useState(null);

  // Sync tab if URL param changes (e.g. user navigates from sidebar again)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "help" || tab === "tickets" || tab === "reports") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    setCurrentUser(user);
    const cachedOverrides = JSON.parse(
      sessionStorage.getItem("supportTicketStatusOverrides") || "{}",
    );
    setStatusOverrides(cachedOverrides);
  }, []);

  // Issue Types
  const [issueTypes, setIssueTypes] = useState([]);
  const [issueTypesLoading, setIssueTypesLoading] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");

  // Form state
  const [form, setForm] = useState({ issue_type: "", subject: "", message: "" });
  const [charMessage, setCharMessage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);
  const [ticketRefreshTrigger, setTicketRefreshTrigger] = useState(0);
  const [allReports, setAllReports] = useState([]);
  const [allReportsLoading, setAllReportsLoading] = useState(false);
  const [allReportsError, setAllReportsError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [adminActionToast, setAdminActionToast] = useState("");
  const [statusOverrides, setStatusOverrides] = useState({});

  const currentRoleId = Number(currentUser?.roleID ?? currentUser?.roleId ?? 0);
  const isDeanOrAssocDean = [4, 5].includes(currentRoleId);
  const isProgramChair = currentRoleId === 3;
  const isFaculty = currentRoleId === 2;
  const canViewAllReports = [2, 3, 4, 5].includes(currentRoleId);
  const currentProgramId = Number(currentUser?.programID ?? currentUser?.program?.programID ?? 0);

  const currentProgram = normalizeProgram(
    currentUser?.program?.programName ??
    currentUser?.program?.programName2 ??
    currentUser?.program_name ??
    currentUser?.program_name2 ??
    currentUser?.programName ??
    currentUser?.course
  );

  // Fetch FAQs on mount
  useEffect(() => {
    setFaqLoading(true);
    fetch(`${apiUrl}/support/faqs`)
      .then((r) => {
        if (!r.ok) throw new Error(`API Error: ${r.status}`);
        return r.json();
      })
      .then((data) => setFaqs(data.data || []))
      .catch((err) => {
        console.error("FAQs fetch error:", err);
        setFaqs([]);
      })
      .finally(() => setFaqLoading(false));
  }, []);

  // Feth issue Type
  useEffect(() => {
    setIssueTypesLoading(true);
    const token = sessionStorage.getItem("token");
    fetch(`${apiUrl}/feedback/issue-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API Error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setIssueTypes(data.issue_types || []);
        //setIssueTypes(data.data || data || []);
      })
      .catch((err) => console.error("Issue types fetch error:", err))
      .finally(() => setIssueTypesLoading(false));
  }, []); 

  // Fetch tickets when tab switches to "tickets"
  const fetchTickets = () => {
    setTicketsLoading(true);
    setTicketsError(null);
    const token = sessionStorage.getItem("token");
    fetch(`${apiUrl}/feedback/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API Error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const ticketList = data.data || [];
        const normalized = ticketList.map((ticket) => ({
          ...ticket,
          description: ticket.message,   // feedback uses 'message'
          category: ticket.issue_type,   // feedback uses 'issue_type'
          status: statusOverrides[ticket.id] || ticket.status,
        }));
        setTickets(normalized);
      })
      .catch((err) => {
        console.error("Tickets fetch error:", err);
        setTicketsError(err.message || "An error occurred.");
      })
      .finally(() => setTicketsLoading(false));
  };

  useEffect(() => {
    if (activeTab !== "tickets") return;
    fetchTickets();
  }, [activeTab, statusOverrides, ticketRefreshTrigger]);

  useEffect(() => {
    if (activeTab !== "reports") return;
    if (!canViewAllReports) {
      setAllReports([]);
      setAllReportsError("You are not authorized to view all reports.");
      return;
    }
    if (!currentUser) return;
    if (isProgramChair && !currentProgramId) return;
    if (isFaculty && !currentUser?.userID) return;


    setAllReportsLoading(true);
    setAllReportsError(null);
    const token = sessionStorage.getItem("token");
    /*fetch(`${apiUrl}/support-tickets`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })*/

    const endpoint = isDeanOrAssocDean
      ? `${apiUrl}/feedback/admin`
      : isProgramChair
        ? `${apiUrl}/feedback/program/${currentProgramId}`
        : isFaculty
          ? `${apiUrl}/feedback/faculty/${currentUser?.userID}`
          : null;

    if (!endpoint) {
      setAllReportsError("You are not authorized to view reports.");
      setAllReportsLoading(false);
      return;
    }

    fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API Error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // Handle both response formats
        const feedbackList = data.feedback?.data || data.feedback || data.data || [];
        const normalized = feedbackList.map((ticket) => ({
          ...ticket,
          description: ticket.message,
          category: ticket.issue_type,
          status: statusOverrides[ticket.id] || ticket.status,
        }));
        setAllReports(normalized);
        //console.log("All reports:", JSON.stringify(normalized, null, 2));
      })
      .catch((err) => {
        console.error("Reports fetch error:", err);
        setAllReportsError(err.message || "Failed to load reports.");
      })
      .finally(() => setAllReportsLoading(false));
  }, [activeTab, canViewAllReports, statusOverrides]);

  const filteredAllReports = allReports.filter((ticket) => {
    if (isDeanOrAssocDean) return true;
  
    // For faculty: backend already filtered by enrolled students, just show all returned
    if (isFaculty) return true;
  
    if (!isProgramChair) return false;
  
    // Only show student (roleID 1) reports
    const reportRoleId = Number(ticket?.user?.roleID ?? ticket?.user?.roleId ?? 0);
    if (reportRoleId !== 1) return false;
  
    // Match by programID — most reliable
    const reportProgramId = Number(
      ticket?.user?.programID ?? ticket?.user?.program?.programID ?? 0
    );
  
    return currentProgramId > 0 && reportProgramId === currentProgramId;
  });



  // Separate reports for deans/associate deans
  const facultyStaffReports = allReports.filter((ticket) => {
    const reportRoleId = Number(ticket?.user?.roleID ?? ticket?.user?.roleId ?? 0);
    return [2, 3, 4, 5].includes(reportRoleId);
  });

  const studentReports = allReports.filter((ticket) => {
    const reportRoleId = Number(ticket?.user?.roleID ?? ticket?.user?.roleId ?? 0);
    // If user is null or roleID is 0/1, show in student reports
    return reportRoleId === 1 || reportRoleId === 0;
  });

  // Group student reports by program
  const studentReportsByProgram = studentReports.reduce((acc, ticket) => {
    const program = normalizeProgram(
      ticket?.user?.program?.programName ??
      ticket?.user?.program?.programName2 ??
      ticket?.user?.program_name ??
      ticket?.user?.program_name2 ??
      ticket?.user?.programName ??
      ticket?.user?.course
    );
    if (!acc[program]) {
      acc[program] = [];
    }
    acc[program].push(ticket);
    return acc;
  }, {});

  // Helper function to get reports for a program (more flexible matching)
  const getProgramReports = (programKeys) => {
    const reports = [];
    programKeys.forEach(key => {
      // Check for exact match
      if (studentReportsByProgram[key]) {
        reports.push(...studentReportsByProgram[key]);
      }
      // Check for partial matches (e.g., 'ce' matches 'civilengineering')
      Object.keys(studentReportsByProgram).forEach(programName => {
        if (programName.includes(key) && !programKeys.includes(programName)) {
          reports.push(...studentReportsByProgram[programName]);
        }
      });
    });
    return reports;
  };

  /* Get reports for each program
  const bscpeReports = getProgramReports(['bs-cpe', 'bscpe', 'bscoe', 'computer', 'cpe']);
  const ceReports = getProgramReports(['bs-ce', 'bsce', 'civil']);
  const eeReports = getProgramReports(['bs-ee', 'bsee', 'electrical']);
  const eceReports = getProgramReports(['bs-ece', 'bsece', 'electronics']);*/

  const bscpeReports = studentReports.filter(t => t?.user?.programID === 1);
  const ceReports = studentReports.filter(t => t?.user?.programID === 3);
  const eeReports = studentReports.filter(t => t?.user?.programID === 2);
  const eceReports = studentReports.filter(t => t?.user?.programID === 4);

  // Get sorted program names for consistent ordering
  const programOrder = ['bscpe', 'ce', 'ee', 'ece', 'me', 'ce', 'cpe', 'other'];
  const sortedPrograms = Object.keys(studentReportsByProgram).sort((a, b) => {
    const aIndex = programOrder.indexOf(a.toLowerCase());
    const bIndex = programOrder.indexOf(b.toLowerCase());
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const handleDeanStatusUpdate = async (ticketId, nextStatus) => {
    if (!isDeanOrAssocDean) return;
    const token = sessionStorage.getItem("token");
    setStatusUpdatingId(ticketId);

    setAllReports((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket,
      ),
    );
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket,
      ),
    );
    setStatusOverrides((prev) => {
      const updated = { ...prev, [ticketId]: nextStatus };
      sessionStorage.setItem(
        "supportTicketStatusOverrides",
        JSON.stringify(updated),
      );
      return updated;
    });

    try {
      //const response = await fetch(`${apiUrl}/admin/support/tickets/${ticketId}`, {
      const response = await fetch(`${apiUrl}/feedback/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        // Clear the override since backend is updated
        setStatusOverrides((prev) => {
          const updated = { ...prev };
          delete updated[ticketId];
          sessionStorage.setItem(
            "supportTicketStatusOverrides",
            JSON.stringify(updated),
          );
          return updated;
        });
        // Refresh the data to get the latest from backend
        if (activeTab === "tickets") {
          fetchTickets();
        } else if (activeTab === "reports") {
          setAllReportsLoading(true);
          setAllReportsError(null);
          const token = sessionStorage.getItem("token");
          fetch(`${apiUrl}/feedback/admin`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((r) => {
              if (!r.ok) throw new Error(`API Error: ${r.status}`);
              return r.json();
            })
            .then((data) => {
              const feedbackList = data.feedback?.data || data.feedback || data.data || [];
              setAllReports(feedbackList);
            })
            .catch((err) => {
              console.error("Reports refresh error:", err);
              setAllReportsError(err.message || "Failed to load reports.");
            })
            .finally(() => setAllReportsLoading(false));
        }
      } else {
        // Keep optimistic status on frontend-only workflow.
      }
      setAdminActionToast(
        nextStatus === "resolved"
          ? "Report marked as done."
          : "Report marked as in process.",
      );
    } catch {
      // Keep optimistic status on frontend-only workflow.
      setAdminActionToast(
        nextStatus === "resolved"
          ? "Report marked as done."
          : "Report marked as in process.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  useEffect(() => {
    if (!adminActionToast) return;
    const timer = setTimeout(() => setAdminActionToast(""), 2200);
    return () => clearTimeout(timer);
  }, [adminActionToast]);

  {/*
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );*/}

  const filteredFaqs = FAQ_ITEMS.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );



  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      // reset subject when issue type changes
      ...(name === "issue_type" ? { subject: "" } : {}),
    }));
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
    setSubmitError("");

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication required. Please log in again.");

      const res = await fetch(`${apiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Submission failed (${res.status}).`);
      }

      const data = await res.json();
      console.log("Feedback submitted:", data);

      setSubmitState("success");
      setForm({ issue_type: "", subject: "", message: "" });
      setCharMessage(0);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(err?.message || "Please check your connection and try again.");
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerConfig = null

  return (
    //<div className="flex h-screen w-full min-w-0 flex-col overflow-hidden bg-gradient-to-br from-[#f5f7f6] via-white to-[#f0f3f2] font-sans">
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-gradient-to-br from-[#f5f7f6] via-white to-[#f0f3f2] font-sans">
      {/* Body */}
      {/* Fixed top toast */}
      {adminActionToast && (
        <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-[13px] font-medium text-green-700 shadow-lg">
          <i className="bx bx-check-circle text-[18px]"></i>
          <span>{adminActionToast}</span>
        </div>
      )}

      {/* Body for mobile and desktop*/}
      {/* <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8"> */}
      <div className="px-3 py-15 pb-30 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px]">

          {/* ── HELP TAB ── */}
          {activeTab === "help" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                    <i className="bx bx-help-circle text-[22px] text-orange-600"></i>
                  </span>
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-800">Help Center</h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Everything you need to succeed in CAPS
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="grid h-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]"> */}
              
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
                {/* LEFT — FAQ */}
                {/* <div className="flex h-full flex-col gap-4"> */}
                <div className="flex flex-col gap-4">
                  {/* <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:p-6"> */}
                  <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                        <i className="bx bx-list-ul text-[18px] text-orange-600"></i>
                      </span>
                      <h2 className="text-[18px] font-bold text-gray-800">Frequently Asked Questions</h2>
                    </div>

                    <div className="relative mb-6">
                      <i className="bx bx-search absolute top-1/2 left-4 -translate-y-1/2 text-[16px] text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Search questions..."
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pr-4 pl-11 text-[14px] text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 sm:pr-2">
                      {faqLoading && (
                        <p className="py-4 text-center text-[13px] text-gray-400">Loading FAQs...</p>
                      )}
                      {!faqLoading && filteredFaqs.length === 0 && (
                        <p className="py-4 text-center text-[13px] text-gray-400">No results found.</p>
                      )}
                      {filteredFaqs.map((item) => (
                        <div
                          key={item.id}
                          className={`overflow-hidden rounded-xl border transition-all ${openFaq === item.id
                              ? "border-orange-200 bg-orange-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                          >
                            <span className={`text-[13.5px] font-semibold leading-snug ${openFaq === item.id ? "text-orange-700" : "text-gray-700"}`}>
                              {item.question}
                            </span>
                            <i className={`bx flex-shrink-0 text-[18px] transition-transform ${openFaq === item.id ? "bx-chevron-up text-orange-500" : "bx-chevron-down text-gray-400"}`}></i>
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

                  {/* Quick Tips */}
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-200">
                        <i className="bx bx-intellect text-[18px] text-blue-600"></i>
                      </div>
                      <div>
                        <h3 className="mb-3 text-[15px] font-bold text-blue-900">Quick Tips</h3>
                        <ul className="space-y-2 text-[13px] text-blue-800">
                          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span><span>Always use a stable internet connection during exams.</span></li>
                          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span><span>Use your institutional Google account for login.</span></li>
                          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span><span>Check your spam folder if you're missing notification emails.</span></li>
                          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span><span>Clear your browser cache if the app behaves unexpectedly.</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Empty or additional content */}
                <div className="flex h-full flex-col gap-4">
                  {/* <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50 p-6 text-center shadow-lg sm:p-8"> */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50 p-6 text-center shadow-lg sm:p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-md">
                      <i className="bx bx-check-circle text-[32px] text-green-600"></i>
                    </div>
                    <h2 className="text-[20px] font-bold text-gray-800 mb-3">Need More Help?</h2>
                    <p className="mb-8 max-w-[430px] text-[14px] leading-relaxed text-gray-600">
                      Can't find what you're looking for? Our support team is ready to help. Submit a support ticket and we'll get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => navigate("/support?tab=tickets")}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-[14px] font-semibold text-white transition hover:shadow-lg hover:from-orange-600 hover:to-orange-700 active:scale-95"
                    >
                      <i className="bx bx-plus text-[16px]"></i>
                      Submit a Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MY TICKETS TAB ── */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                    <i className="bx bx-receipt text-[22px] text-orange-600"></i>
                  </span>
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-800">
                      My Tickets
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Submit and track your support requests
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-orange-50 border border-orange-100 px-5 py-3 text-center">
                  <p className="text-[22px] font-bold text-orange-600">{tickets.length}</p>
                  <p className="text-[11px] text-gray-500">
                    Tickets
                  </p>
                </div>
              </div>
              {/* <div className="grid h-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]"> */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">

                {/* LEFT — Submit Form */}
                <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                      <i className="bx bx-bug text-[18px] text-orange-600"></i>
                    </span>
                    <h2 className="text-[18px] font-bold text-gray-800">
                      Report a Problem
                    </h2>
                  </div>



                  {submitState === "success" && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                        <i className="bx bx-check text-[18px] text-green-600"></i>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-green-800">
                          Your report was submitted successfully.
                        </p>
                        <p className="text-[12px] text-green-700">
                          Your message has been suggested to the admin. Track it under 
                          <strong>My Tickets</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {submitState === "error" && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <i className="bx bx-x text-[18px] text-red-600"></i>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-red-800">
                          Something went wrong.
                        </p>
                        <p className="text-[12px] text-red-700">{submitError || "Please check your connection and try again."}</p>
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
                          disabled={issueTypesLoading}
                          className={`w-full appearance-none rounded-lg border bg-gray-50 px-4 py-2 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none disabled:opacity-50 
                            ${fieldErrors.issue_type ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                        >
                          <option value="" disabled hidden>
                            {issueTypesLoading ? "Loading…" : "Select an issue type…"}
                          </option>
                          {issueTypes.map((t) => (
                            <option key={t.name} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                        <i className="bx bx-chevron-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-400"></i>
                      </div>
                      {fieldErrors.issue_type && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.issue_type}</p>}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                        SUBJECT <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleFormChange}
                          disabled={!form.issue_type}
                          className={
                            `w-full appearance-none rounded-lg border bg-gray-50 px-4 py-2 
                            text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none 
                            disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.subject ? 
                            "border-red-400 bg-red-50" : "border-gray-200"}`}
                        >
                          <option value="" disabled hidden>
                            {form.issue_type ? "Select a subject…" : "Select an issue type first…"}
                          </option>
                          {issueTypes
                            .find((t) => t.name === form.issue_type)
                            ?.sub_options?.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <i className="bx bx-chevron-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-400"></i>
                      </div>
                      {fieldErrors.subject && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.subject}</p>}
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
                        className={`w-full resize-none rounded-lg border bg-gray-50 px-4 py-2 text-[13px] text-gray-800 focus:border-orange-400 focus:outline-none ${fieldErrors.message ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                      />
                      <div className="mt-1 flex justify-between">
                        {fieldErrors.message
                          ? <p className="text-[11px] text-red-500">{fieldErrors.message}</p>
                          : <p className="text-[11px] text-gray-400">Be as specific as possible so we can help you faster.</p>}
                        <span className="text-[11px] text-gray-400">{charMessage}/1000</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition-all ${isSubmitting ? "cursor-not-allowed bg-gray-400" : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"}`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        <><i className="bx bx-send text-[16px]"></i> Submit Request</>
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-center text-[11px] text-gray-400">
                    Tickets are typically reviewed within 1–2 business days. For urgent issues, contact your Program Chair directly.
                  </p>
                </div>

                {/* RIGHT — Tickets List */}
                {/* <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-lg"> */}
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                        <i className="bx bx-briefcase text-[18px] text-orange-600"></i>
                      </span>
                      <h2 className="text-[18px] font-bold text-gray-800">
                        My Cases
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTicketRefreshTrigger((prev) => prev + 1)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                      <i className="bx bx-refresh text-[14px]"></i>
                      Refresh
                    </button>
                  </div>

                  {ticketsLoading ? (
                    <div className="flex-1 flex items-center justify-center text-[13px] text-gray-400">Loading tickets...</div>
                  ) : ticketsError ? (
                    <div className="flex-1 flex items-center justify-center text-[13px] text-red-500">{ticketsError}</div>
                  ) : tickets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                      <i className="bx bx-inbox text-[64px]"></i>
                      <p className="text-[15px]">You haven't submitted any tickets yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                  {ticket.category}
                                </span>
                              </div>
                              <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                              <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                              <StatusBadge status={normalizeStatus(ticket.status)} />
                              <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[12px] text-gray-500">
                            {statusHelperText(ticket.status)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100 px-5 py-3 text-center">
                    <p className="text-[12px] text-gray-400">
                      Showing {tickets.length} ticket(s). Older tickets may be archived.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">

              {/* ── DEAN / ASSOCIATE DEAN BANNER ── */}
              {isDeanOrAssocDean && (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                      <i className="bx bx-crown text-[22px] text-orange-600"></i>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                          {currentRoleId === 4 ? "Dean" : "Associate Dean"}
                        </span>
                      </div>
                      <h2 className="text-[18px] font-bold text-gray-800">All Reports Overview</h2>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        Full visibility across all programs, faculty, and students
                      </p>
                    </div>
                  </div>
                  {/* <div className="hidden sm:flex items-center gap-6 text-center"> */}
                  <div className="hidden md:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-[22px] font-bold text-gray-800">{allReports.length}</p>
                      <p className="text-[11px] text-gray-500">Total</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div>
                      <p className="text-[22px] font-bold text-orange-600">{facultyStaffReports.length}</p>
                      <p className="text-[11px] text-gray-500">Faculty/Staff</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div>
                      <p className="text-[22px] font-bold text-orange-600">{studentReports.length}</p>
                      <p className="text-[11px] text-gray-500">Students</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PROGRAM CHAIR BANNER ── */}
              {isProgramChair && (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                      <i className="bx bx-user text-[22px] text-orange-600"></i>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[18px] font-bold text-orange-600 uppercase tracking-wider">Program Chair</span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                          {currentUser?.program?.programName ?? currentUser?.program_name ?? ""}
                        </span>
                      </div>
                      {/*<h2 className="text-[18px] font-bold text-gray-800">My Program's Reports</h2>*/}
                      <p className="text-[12px] text-gray-500 mt-0.5">Student support tickets from your assigned program</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-orange-50 border border-orange-100 px-5 py-3 text-center">
                    <p className="text-[22px] font-bold text-orange-600">{filteredAllReports.length}</p>
                    <p className="text-[11px] text-gray-500">Reports</p>
                  </div>
                </div>
              )}

              {/* ── FACULTY BANNER ── */}
              {isFaculty && (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                      <i className="bx bx-user text-[22px] text-orange-600"></i>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[18px] font-bold text-orange-600 uppercase tracking-wider">Faculty</span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                          {currentUser?.program?.programName ?? currentUser?.program_name ?? ""}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5">Showing student reports from your class</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-orange-50 border border-orange-100 px-5 py-3 text-center">
                    <p className="text-[22px] font-bold text-orange-600">{filteredAllReports.length}</p>
                    <p className="text-[11px] text-gray-500">Reports</p>
                  </div>
                </div>
              )}
              {isDeanOrAssocDean ? (
                <>
                  {/* Faculty/Staff Reports Table */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                          <i className="bx bx-user-circle text-[18px] text-blue-600"></i>
                        </span>
                        <div>
                          <h2 className="text-[18px] font-bold text-gray-800">Faculty & Staff Reports</h2>
                          <p className="text-[12px] text-gray-500">
                            Reports from faculty, program chairs, deans, and associate deans.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {facultyStaffReports.length} item(s)
                      </span>
                    </div>

                    {allReportsLoading ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                    ) : allReportsError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                    ) : facultyStaffReports.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">No faculty/staff reports found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {facultyStaffReports.map((ticket) => (
                          <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {ticket.category}
                                  </span>
                                </div>
                                {ticket.user && (
                                  <p className="text-[12px] font-semibold text-gray-500">
                                    {ticket.user.firstName} {ticket.user.lastName}
                                    <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                  </p>
                                )}
                                <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <StatusBadge status={normalizeStatus(ticket.status)} />
                                <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BSCpE Student Reports */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                          <i className="bx bx-chip text-[18px] text-blue-600"></i>
                        </span>
                        <div>
                          <h2 className="text-[18px] font-bold text-gray-800">BSCpE Student Reports</h2>
                          <p className="text-[12px] text-gray-500">
                            Reports from Computer Engineering students.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {bscpeReports.length} item(s)
                      </span>
                    </div>

                    {allReportsLoading ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                    ) : allReportsError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                    ) : bscpeReports.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">No BSCpE student reports found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {bscpeReports.map((ticket) => (
                          <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {ticket.category}
                                  </span>
                                </div>
                                {ticket.user && (
                                  <p className="text-[12px] font-semibold text-gray-500">
                                    {ticket.user.firstName} {ticket.user.lastName}
                                    <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                  </p>
                                )}
                                <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <StatusBadge status={normalizeStatus(ticket.status)} />
                                <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CE Student Reports */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-50">
                          <i className="bx bx-cog text-[18px] text-purple-600"></i>
                        </span>
                        <div>
                          <h2 className="text-[18px] font-bold text-gray-800">CE Student Reports</h2>
                          <p className="text-[12px] text-gray-500">
                            Reports from Civil Engineering students.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {ceReports.length} item(s)
                      </span>
                    </div>

                    {allReportsLoading ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                    ) : allReportsError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                    ) : ceReports.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">No CE student reports found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {ceReports.map((ticket) => (
                          <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {ticket.category}
                                  </span>
                                </div>
                                {ticket.user && (
                                  <p className="text-[12px] font-semibold text-gray-500">
                                    {ticket.user.firstName} {ticket.user.lastName}
                                    <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                  </p>
                                )}
                                <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <StatusBadge status={normalizeStatus(ticket.status)} />
                                <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* EE Student Reports */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50">
                          <i className="bx bx-light-bulb text-[18px] text-yellow-600"></i>
                        </span>
                        <div>
                          <h2 className="text-[18px] font-bold text-gray-800">EE Student Reports</h2>
                          <p className="text-[12px] text-gray-500">
                            Reports from Electrical Engineering students.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {eeReports.length} item(s)
                      </span>
                    </div>

                    {allReportsLoading ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                    ) : allReportsError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                    ) : eeReports.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">No EE student reports found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {eeReports.map((ticket) => (
                          <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {ticket.category}
                                  </span>
                                </div>
                                {ticket.user && (
                                  <p className="text-[12px] font-semibold text-gray-500">
                                    {ticket.user.firstName} {ticket.user.lastName}
                                    <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                  </p>
                                )}
                                <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <StatusBadge status={normalizeStatus(ticket.status)} />
                                <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ECE Student Reports */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-50">
                          <i className="bx bx-chip text-[18px] text-green-600"></i>
                        </span>
                        <div>
                          <h2 className="text-[18px] font-bold text-gray-800">ECE Student Reports</h2>
                          <p className="text-[12px] text-gray-500">
                            Reports from Electronics Engineering students.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        {eceReports.length} item(s)
                      </span>
                    </div>

                    {allReportsLoading ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                    ) : allReportsError ? (
                      <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                    ) : eceReports.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-gray-400">No ECE student reports found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {eceReports.map((ticket) => (
                          <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {ticket.category}
                                  </span>
                                </div>
                                {ticket.user && (
                                  <p className="text-[12px] font-semibold text-gray-500">
                                    {ticket.user.firstName} {ticket.user.lastName}
                                    <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                  </p>
                                )}
                                <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <StatusBadge status={normalizeStatus(ticket.status)} />
                                <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Single table for non-dean users (program chairs, faculty) */
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                        <i className="bx bx-clipboard text-[18px] text-orange-600"></i>
                      </span>
                      <div>
                        <h2 className="text-[18px] font-bold text-gray-800">Student Reports</h2>
                        <p className="text-[12px] text-gray-500">
                          Showing student reports from your assigned program.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      {filteredAllReports.length} item(s)
                    </span>
                  </div>

                  {allReportsLoading ? (
                    <div className="py-10 text-center text-[13px] text-gray-400">Loading reports...</div>
                  ) : allReportsError ? (
                    <div className="py-10 text-center text-[13px] text-red-500">{allReportsError}</div>
                  ) : filteredAllReports.length === 0 ? (
                    <div className="py-10 text-center text-[13px] text-gray-400">No reports found for your scope.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredAllReports.map((ticket) => (
                        <div key={ticket.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400">#{ticket.id}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                  {ticket.category}
                                </span>
                              </div>
                              {ticket.user && (
                                <p className="text-[12px] font-semibold text-gray-500">
                                  {ticket.user.firstName} {ticket.user.lastName}
                                  <span className="ml-1 font-normal text-gray-400">({ticket.user.email})</span>
                                </p>
                              )}
                              <p className="truncate text-[14px] font-semibold text-gray-800">{ticket.subject}</p>
                              <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{ticket.description}</p>
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                              <StatusBadge status={normalizeStatus(ticket.status)} />
                              <span className="text-[11px] text-gray-400">{formatDate(ticket.created_at)}</span>
                            </div>
                          </div>
                          {isDeanOrAssocDean && (
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "in_progress")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Fix
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === ticket.id}
                                onClick={() => handleDeanStatusUpdate(ticket.id, "resolved")}
                                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${normalizeStatus(ticket.status) === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                                  } ${statusUpdatingId === ticket.id ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                Mark as Done
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}