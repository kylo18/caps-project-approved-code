import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import ChangelogModal from "../components/ChangelogModal";

/* ── Colour palette cycling for the left-panel icon bg ─────── */
const ICON_COLORS = [
  { bg: "#fff7ed", iconColor: "#f97316" }, // orange
  { bg: "#eff6ff", iconColor: "#3b82f6" }, // blue
  { bg: "#f0fdf4", iconColor: "#22c55e" }, // green
  { bg: "#fdf4ff", iconColor: "#a855f7" }, // purple
  { bg: "#fef2f2", iconColor: "#ef4444" }, // red
  { bg: "#f0fdfa", iconColor: "#14b8a6" }, // teal
];

/* ── Icon pool — varied per card ────────────────────────────── */
const SUBJECT_ICONS = [
  "bx bx-book",
  "bx bx-calculator",
  "bx bx-dna",
  "bx bx-globe",
  "bx bx-heart-plus",
  "bx bx-code",
  "bx bx-palette",
  "bx bx-music",
  "bx bx-chart-sine",
  "bx bx-briefcase-alt",
  "bx bx-leaf",
];

/* Pick icon + color deterministically from subjectID */
const getCardStyle = (subjectID) => {
  const n = parseInt(subjectID, 10) || 0;
  return {
    icon: SUBJECT_ICONS[n % SUBJECT_ICONS.length],
    ...ICON_COLORS[n % ICON_COLORS.length],
  };
};

/* ── Expand program abbreviations to full names ─────────────── */
const PROGRAM_NAMES = {
  // General
  GE: "General Subject",
  // Engineering
  CpE: "Computer Engineering",
  CE: "Civil Engineering",
  ECE: "Electronics & Communications Engineering",
  EE: "Electrical Engineering",
  ABE: "Agricultural and Biosystems Engineering",
};

const expandProgram = (name) => {
  if (!name) return "—";
  // If exact match in map, return full name
  if (PROGRAM_NAMES[name]) return PROGRAM_NAMES[name];
  // If the name starts with "BS " or "AB " it's already expanded
  if (/^(BS|AB|BEd|BEEd|Bachelor)\b/.test(name)) return name;
  return name;
};

/* ── Subject card ───────────────────────────────────────────── */
const SubjectCard = ({ subject, onExplore }) => {
  const rows = [
    {
      label: "TOTAL QUESTIONS",
      value: subject.questionCount
        ? `${subject.questionCount} Practice Questions`
        : "—",
    },
    {
      label: "DURATION",
      value: subject.durationMinutes
        ? `${subject.durationMinutes} Minutes`
        : "No timer",
    },
    {
      label: "YEAR LEVEL",
      value: subject.yearLevel || "—",
    },
    {
      label: "PROGRAM",
      value: expandProgram(subject.programName),
    },
  ];

  const cardStyle = getCardStyle(subject.subjectID);

  return (
    <div className="relative overflow-hidden rounded-xl rounded-b-xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Left panel — checker-grid background */}
        <div
          className="relative flex w-full shrink-0 flex-row items-center gap-3 border-b border-gray-100 px-4 py-4 sm:w-48 sm:flex-col sm:items-start sm:justify-center sm:gap-0 sm:border-r sm:border-b-0 sm:px-5 sm:py-6"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 15px,rgba(0,0,0,0.03) 15px,rgba(0,0,0,0.03) 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,rgba(0,0,0,0.03) 15px,rgba(0,0,0,0.03) 16px)",
          }}
        >
          <div className="mb-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-1 sm:h-9 sm:w-9">
            <i
              className={`${cardStyle.icon} text-[22px] sm:text-[20px]`}
              style={{ color: cardStyle.iconColor }}
            />
          </div>
          <div>
            <h3 className="outfit-700 text-[15px] leading-snug font-bold text-gray-900 sm:text-[16px]">
              {subject.subjectName}
            </h3>
            <p className="outfit-500 mt-0 text-[12px] text-gray-400 sm:mt-1">
              {subject.subjectCode}
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col justify-between px-4 py-4 sm:px-6 sm:py-5">
          <dl className="space-y-2">
            {rows.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-start sm:gap-4"
              >
                <dt className="outfit-400 mb-0.5 w-full shrink-0 text-[10px] font-semibold tracking-wide text-gray-400 uppercase sm:mb-0 sm:w-36">
                  {label}
                </dt>
                <dd className="outfit-400 text-[13px] text-gray-700">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex w-full justify-end">
            <button
              onClick={() => onExplore(subject)}
              className="mt-4 flex w-max cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-orange-500 transition hover:text-orange-600 sm:mt-5"
            >
              Start Exam
              <i className="bx bx-arrow-right-stroke text-[18px] sm:text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────────────── */
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  /* user info */
  const [userName, setUserName] = useState("Alex");
  const [selectedLevel, setSelectedLevel] = useState("University");
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const levelRef = useRef(null);

  /* subjects */
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  /* exam generation */
  const [generatingFor, setGeneratingFor] = useState(null); // subjectID being generated

  /* ongoing exam */
  const [ongoingExam, setOngoingExam] = useState(null);

  /* join-class code modal */
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [classCodeError, setClassCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  /* changelog modal */
  const [showChangelog, setShowChangelog] = useState(false);

  /* Auto-open changelog once per version */
  const CHANGELOG_KEY = "changelog_v2.0.0_seen";
  useEffect(() => {
    if (!localStorage.getItem(CHANGELOG_KEY)) {
      setShowChangelog(true);
      localStorage.setItem(CHANGELOG_KEY, "true");
    }
  }, []);

  /* ── Load user from session ─────────────────────────── */
  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user?.firstName) setUserName(user.firstName);
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Close level dropdown on outside click ──────────── */
  useEffect(() => {
    const handle = (e) => {
      if (levelRef.current && !levelRef.current.contains(e.target))
        setShowLevelMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── Fetch subjects ─────────────────────────────────── */
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${apiUrl}/student/practice-subjects`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (data.data) setSubjects(data.data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [apiUrl]);

  /* ── Check for ongoing exam ─────────────────────────── */
  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("exam_"));
    if (!keys.length) return;
    const examKey = keys[0];
    try {
      if (localStorage.getItem(`${examKey}_completed`) === "true") {
        [
          examKey,
          `${examKey}_bookmarks`,
          `${examKey}_timer`,
          `${examKey}_completed`,
          `${examKey}_last_question`,
          `${examKey}_last_position`,
        ].forEach((k) => localStorage.removeItem(k));
        return;
      }
      const savedTimer = localStorage.getItem(`${examKey}_timer`);
      if (savedTimer && parseInt(savedTimer) === 0) {
        [
          examKey,
          `${examKey}_bookmarks`,
          `${examKey}_timer`,
          `${examKey}_completed`,
          `${examKey}_last_question`,
          `${examKey}_last_position`,
        ].forEach((k) => localStorage.removeItem(k));
        return;
      }
      const subjectID = examKey.split("_")[1];
      const savedExamData = localStorage.getItem(`${examKey}_exam_data`);
      if (savedExamData) {
        const examDataToUse = JSON.parse(savedExamData);
        if (examDataToUse?.questions) {
          setOngoingExam({
            subjectID,
            examData: examDataToUse,
            savedAnswers: JSON.parse(localStorage.getItem(examKey)),
            savedBookmarks:
              JSON.parse(localStorage.getItem(`${examKey}_bookmarks`)) || [],
            examKey,
          });
        }
      }
    } catch {
      [
        examKey,
        `${examKey}_bookmarks`,
        `${examKey}_timer`,
        `${examKey}_completed`,
        `${examKey}_last_question`,
        `${examKey}_last_position`,
      ].forEach((k) => localStorage.removeItem(k));
    }
  }, []);

  /* ── Continue ongoing exam ──────────────────────────── */
  const handleContinueExam = () => {
    if (!ongoingExam) return;
    const lastQuestionIndex = parseInt(
      localStorage.getItem(`${ongoingExam.examKey}_last_question`) || "0",
    );
    navigate("/practice-exam", {
      state: {
        subjectID: ongoingExam.subjectID,
        examData: ongoingExam.examData,
        savedAnswers: ongoingExam.savedAnswers,
        savedBookmarks: ongoingExam.savedBookmarks,
        examKey: ongoingExam.examKey,
        resumeExam: true,
        lastQuestionIndex,
      },
    });
  };

  /* ── Generate exam for a subject ────────────────────── */
  const handleGenerateExam = async (subject) => {
    setGeneratingFor(subject.subjectID);

    // clear old exam data
    Object.keys(localStorage)
      .filter((k) => k.startsWith("exam_"))
      .forEach((key) => {
        [
          `${key}`,
          `${key}_bookmarks`,
          `${key}_timer`,
          `${key}_completed`,
          `${key}_last_question`,
          `${key}_last_position`,
          `${key}_settings`,
          `${key}_exam_data`,
        ].forEach((k) => localStorage.removeItem(k));
      });

    try {
      const res = await fetch(
        `${apiUrl}/practice-exam/generate/${subject.subjectID}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Unexpected response: " + text.slice(0, 100));
      }
      if (!res.ok) {
        if (res.status === 403)
          throw new Error("Practice exam is not enabled for this subject.");
        if (res.status === 404)
          throw new Error(
            data.message || "Subject not found or no questions available.",
          );
        throw new Error(data.message || "Failed to generate exam");
      }
      if (!data.questions?.length) {
        showToast("No questions available for this subject.", "error");
        return;
      }
      const examKey = `exam_${subject.subjectID}_${data.questions.map((q) => q.questionID).join("_")}`;
      localStorage.setItem(
        `${examKey}_exam_data`,
        JSON.stringify({
          questions: data.questions,
          totalPoints: data.totalPoints,
          enableTimer: data.enableTimer,
          durationMinutes: data.durationMinutes,
          subjectName: data.subjectName,
          examSettings: {
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
          },
        }),
      );
      navigate("/exam-preview", {
        state: {
          subjectID: subject.subjectID,
          examData: {
            questions: data.questions,
            totalPoints: data.totalPoints,
            enableTimer: data.enableTimer,
            durationMinutes: data.durationMinutes,
            subjectName: data.subjectName,
            examSettings: {
              enableTimer: data.enableTimer,
              durationMinutes: data.durationMinutes,
            },
          },
          examKey,
        },
      });
    } catch (err) {
      console.error("Exam generation error:", err);
      showToast(err.message || "An unknown error occurred.", "error");
    } finally {
      setGeneratingFor(null);
    }
  };

  /* ── Join class via code ────────────────────────────── */
  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setClassCodeError("Please enter a class code.");
      return;
    }
    setIsJoining(true);
    setClassCodeError("");
    try {
      const res = await fetch(`${apiUrl}/classes/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ code: classCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join class.");
      showToast("Successfully joined the class!", "success");
      setShowJoinForm(false);
      setClassCode("");
    } catch (err) {
      setClassCodeError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  /* ── Filtered subjects ──────────────────────────────── */
  const filtered = subjects.filter((s) =>
    searchQuery.trim()
      ? s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  /* ── Render ─────────────────────────────────────────── */
  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="outfit-400 relative mt-8 min-h-screen bg-white pb-12 lg:mt-0">
        {/* HERO — no gradient, plain white */}
        <div className="relative px-5 pt-10 pb-4 text-center md:px-6 md:pt-14 md:pb-6">
          {/* Changelog button — top right */}
          <button
            onClick={() => setShowChangelog(true)}
            title="What's new"
            className="outfit-600 absolute top-3 right-4 flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-[12px] font-bold text-white shadow shadow-orange-200 transition hover:bg-orange-600 active:scale-95 md:top-5 md:right-6 lg:hidden"
          >
            <i className="bx bx-news text-[14px]" />
            What&apos;s New
          </button>

          <h1 className="outfit-700 text-[28px] leading-tight font-extrabold text-gray-900 md:text-[36px]">
            Hello, <span className="text-orange-500">{userName}!</span>
          </h1>
          <p className="outfit-400 mt-2 text-[14px] text-gray-500 md:text-[15px]">
            What would you like to learn today? Find all your learning needs{" "}
            <br className="hidden md:block" /> conveniently in one place.
          </p>

          {/* SEARCH BAR */}
          <div className="mx-auto mt-6 max-w-2xl md:mt-8">
            <div className="flex items-center gap-2 rounded-full">
              <div className="flex flex-1 items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-[0_4px_10px_rgba(249,115,22,0.18)]">
                <i className="bx bx-search ml-3 shrink-0 text-[18px] text-gray-400 md:ml-4 md:text-[20px]" />
                <input
                  type="text"
                  placeholder="Search for subjects.."
                  value={searchQuery}
                  maxLength={50}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outfit-400 flex-1 bg-transparent px-2.5 py-2.5 text-[12px] text-gray-700 outline-none placeholder:text-gray-400 md:py-3 md:text-[13px]"
                />
              </div>

              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 md:h-10 md:w-10 md:rounded-2xl">
                <i className="bx bx-search text-[18px] md:text-[20px]" />
              </button>
            </div>
          </div>
        </div>

        {/* BROWSE RESOURCES ROW */}
        <div className="mx-auto mt-4 max-w-3xl px-4 md:mt-6 md:px-0">
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>

            <div className="mx-3 flex items-center gap-1.5 md:mx-4 md:gap-2">
              <span className="outfit-400 text-[14px] text-gray-500 md:text-[15px]">
                Browse subjects for
              </span>

              <div ref={levelRef} className="relative">
                <button
                  onClick={() => setShowLevelMenu((v) => !v)}
                  className="outfit-400 flex items-center gap-1 border-b-2 border-gray-700 pb-0.5 text-[14px] font-semibold text-gray-800 transition hover:border-orange-500 hover:text-orange-500 md:text-[15px]"
                >
                  JRMSU
                </button>
              </div>
            </div>

            <div className="flex-1 border-t border-gray-200"></div>
          </div>
        </div>

        {/* ONGOING EXAM BANNER */}
        {ongoingExam && (
          <div className="mx-auto mt-4 max-w-3xl px-4 md:px-0">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 md:flex-row md:items-center md:gap-0 md:px-5 md:py-4">
              <div>
                <p className="outfit-400 text-[13px] font-semibold text-yellow-800 md:text-[14px]">
                  Exam in Progress
                </p>
                <p className="outfit-400 mt-0.5 text-[12px] text-yellow-700 md:mt-0 md:text-[13px]">
                  {ongoingExam.examData?.subjectName ||
                    `Subject ${ongoingExam.subjectID}`}{" "}
                  — your progress has been saved.
                </p>
              </div>
              <button
                onClick={handleContinueExam}
                className="outfit-400 mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-orange-600 md:mt-0 md:w-auto"
              >
                Continue{" "}
                <i className="bx bx-chevron-right text-[16px] md:text-[18px]" />
              </button>
            </div>
          </div>
        )}

        {/* TOPICS SECTION */}
        <div className="mx-auto mt-5 max-w-3xl px-4 pb-20 md:mt-6 md:px-0 md:pb-28">
          {subjectsLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="loader" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="outfit-400 rounded-xl border border-dashed border-gray-200 py-12 text-center text-[14px] text-gray-400">
              {searchQuery
                ? `No subjects found for "${searchQuery}"`
                : "No subjects available."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((subject, idx) => (
                <div key={subject.subjectID} className="relative">
                  <SubjectCard
                    subject={subject}
                    onExplore={handleGenerateExam}
                  />
                  {/* Loading overlay while generating this exam */}
                  {generatingFor === subject.subjectID && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                      <span className="loader" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* JOIN CLASS MODAL */}
      {showJoinForm && (
        <div
          className="lightbox-bg fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowJoinForm(false);
              setClassCode("");
              setClassCodeError("");
            }
          }}
        >
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="border-color flex items-center justify-between border-b px-5 py-3">
              <h2 className="outfit-400 text-[14px] font-semibold text-gray-700">
                Enter Class Code
              </h2>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setClassCode("");
                  setClassCodeError("");
                }}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
              >
                <i className="bx bx-x text-[20px]" />
              </button>
            </div>
            <form onSubmit={handleJoinClass} className="px-5 py-4">
              <label className="outfit-400 mb-1.5 block text-[13px] text-gray-600">
                Class Code
              </label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => {
                  setClassCode(e.target.value);
                  setClassCodeError("");
                }}
                placeholder="e.g. ABC-123"
                className="border-color outfit-400 w-full rounded-xl border px-4 py-2 text-[14px] text-gray-700 outline-none focus:border-orange-500"
              />
              {classCodeError && (
                <p className="outfit-400 mt-2 text-[12px] text-red-500">
                  {classCodeError}
                </p>
              )}
              <button
                type="submit"
                disabled={isJoining}
                className="outfit-400 mt-4 w-full rounded-lg bg-orange-500 py-2 text-[14px] font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <span className="loader-white" />
                  </div>
                ) : (
                  "Join Class"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGELOG MODAL */}
      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </>
  );
};

export default StudentDashboard;
