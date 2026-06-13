import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QuestionListModal from "../components/QuestionListModal";
import TimerCompletionModal from "../components/TimerCompletionModal";
import WarningModal from "../components/WarningModal";
import { normalizeUserProfile } from "../utils/userProfileUtils";

const collegeLogo = new URL("../assets/college-logo.png", import.meta.url).href;

/* ── Avatar helpers ── */
const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-green-700",
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-teal-600",
  "bg-indigo-600",
];
const getRandomAvatarColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
const getAvatarColorKey = (u) => u?.email || u?.userCode || "default";
const getPersistedAvatarColor = (u) =>
  localStorage.getItem("avatarColor_" + getAvatarColorKey(u));
const setPersistedAvatarColor = (u, c) =>
  localStorage.setItem("avatarColor_" + getAvatarColorKey(u), c);

/* ── Scratchpad ── */
const SCRATCHPAD_COLORS = [
  { id: "black", hex: "#1a1a1a" },
  { id: "red", hex: "#ef4444" },
  { id: "blue", hex: "#3b82f6" },
  { id: "green", hex: "#22c55e" },
];

const ScratchpadModal = ({ isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("draw");
  const [color, setColor] = useState("#1a1a1a");
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [hasContent, setHasContent] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    setHistory((h) => [
      ...h,
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    ]);
    setRedoStack([]);
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    saveHistory();
    if (tool === "text") {
      const pos = getPos(e, canvas);
      const text = window.prompt("Enter text:");
      if (text) {
        ctx.font = `${Math.max(12, size * 3)}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, pos.x, pos.y);
        setHasContent(true);
      }
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    ctx.lineWidth = tool === "eraser" ? size * 6 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#fafafa" : color;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(
      pos.x,
      pos.y,
      (tool === "eraser" ? size * 6 : size) / 2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = tool === "eraser" ? "#fafafa" : color;
    ctx.fill();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = tool === "eraser" ? size * 6 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#fafafa" : color;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasContent(true);
  };

  const handlePointerUp = () => setIsDrawing(false);

  const handleUndo = () => {
    if (!history.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack((r) => [...r, current]);
    ctx.putImageData(history[history.length - 1], 0, 0);
    setHistory((h) => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((h) => [...h, current]);
    ctx.putImageData(redoStack[redoStack.length - 1], 0, 0);
    setRedoStack((r) => r.slice(0, -1));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    saveHistory();
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "scratchpad.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="flex h-[90vh] w-[90vw] max-w-[780px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[56px] flex-shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2">
            <i className="bx bx-edit text-[18px] text-orange-500" />
            <span className="text-[15px] font-bold text-gray-800">
              Scratchpad
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
            <button
              onClick={handleUndo}
              disabled={!history.length}
              title="Undo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="bx bx-undo text-[18px]" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!redoStack.length}
              title="Redo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="bx bx-redo text-[18px]" />
            </button>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            {[
              ["draw", "bx-pencil"],
              ["eraser", "bx-eraser"],
            ].map(([t, icon]) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                title={t}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition ${tool === t ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-800"}`}
              >
                <i className={`bx ${icon} text-[17px]`} />
              </button>
            ))}
            <button
              onClick={() => setTool("text")}
              title="Add Text"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[13px] font-bold transition ${tool === "text" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-800"}`}
            >
              T
            </button>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <button
              onClick={handleClear}
              title="Clear canvas"
              className="flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <i className="bx bx-trash text-[15px]" />
              CLEAR
            </button>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <i className="bx bx-x text-[20px]" />
          </button>
        </div>
        <div className="relative flex-1 overflow-hidden bg-[#fafafa]">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none"
            style={{
              cursor:
                tool === "eraser"
                  ? "cell"
                  : tool === "text"
                    ? "text"
                    : "crosshair",
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          {!hasContent && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-orange-300 opacity-60">
                <i className="bx bx-pencil text-4xl text-orange-300" />
              </div>
              <p className="text-[14px] font-medium text-gray-400">
                Draw or type your rough work here
              </p>
              <p className="mt-1 text-[12px] text-gray-300 italic">
                This area is for your personal use and won&apos;t be graded
              </p>
            </div>
          )}
        </div>
        <div className="flex h-[52px] flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {SCRATCHPAD_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setColor(c.hex);
                    setTool("draw");
                  }}
                  title={c.id}
                  className="h-5 w-5 cursor-pointer rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow:
                      color === c.hex
                        ? `0 0 0 2px white, 0 0 0 3.5px ${c.hex}`
                        : "none",
                  }}
                />
              ))}
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Size
              </span>
              <input
                type="range"
                min={1}
                max={20}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-1.5 w-28 cursor-pointer accent-orange-500"
              />
              <div
                className="rounded-full bg-orange-500 transition-all"
                style={{
                  width: `${Math.max(8, size * 1.5)}px`,
                  height: `${Math.max(8, size * 1.5)}px`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-[7px] text-[13px] font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-[0.97]"
            >
              Minimize
            </button>
            <button
              onClick={handleSave}
              className="cursor-pointer rounded-xl bg-orange-500 px-4 py-[7px] text-[13px] font-bold text-white shadow transition hover:bg-orange-600 active:scale-[0.97]"
            >
              Save to Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ── */
const PracticeExam = () => {
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showTimerCompletionModal, setShowTimerCompletionModal] =
    useState(false);
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] =
    useState(false);
  const [isChoiceImageModalOpen, setIsChoiceImageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [examStartTime] = useState(new Date().toISOString());
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState("all");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [avatarColor, setAvatarColor] = useState("bg-gray-300");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const {
    subjectID,
    examData,
    savedAnswers,
    savedBookmarks,
    examKey: providedExamKey,
    resumeExam,
    lastQuestionIndex,
  } = location.state || {};
  const isPreview = examData?.isPreview || false;

  const examKey =
    providedExamKey ||
    (examData
      ? `exam_${subjectID}_${examData.questions.map((q) => q.questionID).join("_")}`
      : null);

  /* ── Fetch user info ── */
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${apiUrl}/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user info");
        const body = await res.json();
        setUserInfo(normalizeUserProfile(body));
      } catch {
        /* silent */
      }
    };
    fetchUserInfo();
  }, [apiUrl]);

  /* ── Persist avatar color ── */
  useEffect(() => {
    if (userInfo) {
      let c = getPersistedAvatarColor(userInfo);
      if (!c) {
        c = getRandomAvatarColor();
        setPersistedAvatarColor(userInfo, c);
      }
      setAvatarColor(c);
    }
  }, [userInfo]);

  /* ── Close profile dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      )
        setProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Close image lightboxes when timer modal appears ── */
  useEffect(() => {
    if (showTimerCompletionModal) {
      setIsQuestionImageModalOpen(false);
      setIsChoiceImageModalOpen(false);
      setSelectedImageUrl(null);
    }
  }, [showTimerCompletionModal]);

  /* ── Load saved state ── */
  useEffect(() => {
    if (!examKey) return;
    const savedExamData = localStorage.getItem(`${examKey}_exam_data`);
    if (savedExamData) {
      try {
        const p = JSON.parse(savedExamData);
        Object.assign(examData, p);
      } catch (err) {
        console.error("Error loading saved exam data:", err);
        localStorage.removeItem(`${examKey}_exam_data`);
      }
    }
    if (savedAnswers) {
      setAnswers(savedAnswers);
    } else {
      const sa = localStorage.getItem(examKey);
      if (sa) {
        try {
          setAnswers(JSON.parse(sa));
        } catch (err) {
          console.error(err);
          localStorage.removeItem(examKey);
        }
      }
    }
    if (savedBookmarks) {
      setBookmarkedQuestions(savedBookmarks);
    } else {
      const sb = localStorage.getItem(`${examKey}_bookmarks`);
      if (sb) {
        try {
          setBookmarkedQuestions(JSON.parse(sb));
        } catch (err) {
          console.error(err);
          localStorage.removeItem(`${examKey}_bookmarks`);
        }
      }
    }
    const savedExamSettings = localStorage.getItem(`${examKey}_settings`);
    const savedTimer = localStorage.getItem(`${examKey}_timer`);
    if (savedExamSettings) {
      try {
        const p = JSON.parse(savedExamSettings);
        if (p.enableTimer !== undefined) examData.enableTimer = p.enableTimer;
        if (p.durationMinutes !== undefined)
          examData.durationMinutes = p.durationMinutes;
      } catch (err) {
        console.error(err);
      }
    } else {
      localStorage.setItem(
        `${examKey}_settings`,
        JSON.stringify({
          enableTimer: examData.enableTimer,
          durationMinutes: examData.durationMinutes,
        }),
      );
    }
    if (examData.enableTimer) {
      if (savedTimer) {
        const t = parseInt(savedTimer);
        setSecondsLeft(t > 0 ? t : examData.durationMinutes * 60);
      } else setSecondsLeft(examData.durationMinutes * 60);
    }
    if (resumeExam && lastQuestionIndex !== undefined) {
      const idx = parseInt(lastQuestionIndex);
      if (!isNaN(idx) && idx >= 0 && idx < examData.questions.length)
        setCurrentQuestionIndex(idx);
    } else {
      const slq = localStorage.getItem(`${examKey}_last_question`);
      if (slq !== null) {
        try {
          const si = parseInt(slq);
          if (!isNaN(si) && si >= 0 && si < examData.questions.length)
            setCurrentQuestionIndex(si);
        } catch (err) {
          console.error(err);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examKey, savedAnswers, savedBookmarks, resumeExam, lastQuestionIndex]);

  /* ── Timer ── */
  useEffect(() => {
    if (!examData?.enableTimer || secondsLeft === null) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerCompletionModal(true);
          return 0;
        }
        const next = prev - 1;
        if (examKey) localStorage.setItem(`${examKey}_timer`, next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examData?.enableTimer, secondsLeft, examKey]);

  /* ── Persist answers ── */
  useEffect(() => {
    if (examKey && Object.keys(answers).length > 0)
      localStorage.setItem(examKey, JSON.stringify(answers));
  }, [answers, examKey]);

  /* ── Persist bookmarks ── */
  useEffect(() => {
    if (examKey && bookmarkedQuestions.length > 0)
      localStorage.setItem(
        `${examKey}_bookmarks`,
        JSON.stringify(bookmarkedQuestions),
      );
    else if (examKey) localStorage.removeItem(`${examKey}_bookmarks`);
  }, [bookmarkedQuestions, examKey]);

  /* ── Persist current question ── */
  useEffect(() => {
    if (examKey && examData && currentQuestionIndex !== undefined)
      localStorage.setItem(
        `${examKey}_last_question`,
        currentQuestionIndex.toString(),
      );
  }, [currentQuestionIndex, examKey, examData]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (examKey && secondsLeft !== 0) {
        if (currentQuestionIndex !== undefined && examData)
          localStorage.setItem(
            `${examKey}_last_question`,
            currentQuestionIndex.toString(),
          );
        localStorage.setItem(`${examKey}_last_position`, "0");
      } else if (examKey && secondsLeft === 0) {
        [
          "",
          "_bookmarks",
          "_timer",
          "_last_question",
          "_last_position",
          "_completed",
        ].forEach((s) => localStorage.removeItem(`${examKey}${s}`));
      }
    };
  }, [examKey, secondsLeft, currentQuestionIndex, examData]);

  /* ── beforeunload ── */
  useEffect(() => {
    const handler = () => {
      if (
        examKey &&
        secondsLeft !== 0 &&
        currentQuestionIndex !== undefined &&
        examData
      ) {
        localStorage.setItem(
          `${examKey}_last_question`,
          currentQuestionIndex.toString(),
        );
        localStorage.setItem(`${examKey}_last_position`, "0");
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [examKey, secondsLeft, currentQuestionIndex, examData]);

  /* ── Reset image modals on question change ── */
  useEffect(() => {
    setIsQuestionImageModalOpen(false);
    setIsChoiceImageModalOpen(false);
    setSelectedImageUrl(null);
    setIsImageLoaded(false);
  }, [currentQuestionIndex]);

  if (!examData) {
    return (
      <div className="outfit flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No exam data found. Please select a subject first.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const totalQuestions = examData.questions.length;
  const currentQuestion = examData.questions[currentQuestionIndex];
  const currentQID = currentQuestion.questionID;
  const answeredCount = examData.questions.filter(
    (q) => answers[q.questionID] !== undefined,
  ).length;
  const progressPct =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isBookmarked = bookmarkedQuestions.includes(currentQID);
  const areAllAnswered = examData.questions.every(
    (q) => answers[q.questionID] !== undefined,
  );
  const choiceLetters = ["A", "B", "C", "D", "E", "F"];

  const formatTimer = (s) => {
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  /* ── Handlers ── */
  const handleSelectAnswer = (qID, cID) =>
    setAnswers((prev) => ({ ...prev, [qID]: cID }));
  const handleClearAnswer = () =>
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQID];
      return next;
    });
  const handlePrev = () => setCurrentQuestionIndex((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1));
  const handleToggleBookmark = (qid) =>
    setBookmarkedQuestions((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid],
    );

  const handlePreSubmit = () => {
    if (answeredCount < totalQuestions) {
      setShowSubmitWarning(true);
    } else {
      handleSubmitAnswers();
    }
  };

  const handleSubmitAnswers = async () => {
    setIsSubmitting(true);
    try {
      const allAnswers = examData.questions.map((question) => ({
        questionID: question.questionID,
        selectedChoiceID: answers[question.questionID]
          ? parseInt(answers[question.questionID])
          : null,
      }));
      const response = await fetch(`${apiUrl}/practice-exam/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ subjectID, answers: allAnswers }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to submit answers");

      // Clear all exam data
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("exam_"),
      );
      keys.forEach((k) => {
        [
          k,
          `${k}_bookmarks`,
          `${k}_timer`,
          `${k}_completed`,
          `${k}_last_question`,
          `${k}_last_position`,
          `${k}_settings`,
          `${k}_exam_data`,
        ].forEach((kk) => localStorage.removeItem(kk));
      });

      const { score, results } = result;
      const examEndTime = new Date().toISOString();
      const durationMinutes = Math.round(
        (new Date(examEndTime) - new Date(examStartTime)) / 1000 / 60,
      );
      setSecondsLeft(0);

      const enhancedResults = results.map((r) => {
        const qData = examData.questions.find(
          (q) => q.questionID === r.questionID,
        );
        return {
          ...r,
          questionText: qData.questionText,
          questionImage: qData.questionImage,
          choices: qData.choices,
        };
      });

      navigate("/practice-exam-result", {
        state: {
          score,
          results: enhancedResults,
          examCompleted: true,
          examDuration: `${durationMinutes} minutes`,
          startTime: examStartTime,
          endTime: examEndTime,
          subjectID,
          subjectName: examData.subjectName || `Subject ${subjectID}`,
        },
        replace: true,
      });
      setAnswers({});
    } catch (err) {
      console.error(err);
      navigate("/practice-exam-result", {
        state: { error: err.message },
        replace: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerCompletion = () => {
    setShowTimerCompletionModal(false);
    handleSubmitAnswers();
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="outfit flex h-screen flex-col overflow-hidden bg-white font-sans">
      <WarningModal
        isOpen={showSubmitWarning}
        onClose={() => setShowSubmitWarning(false)}
        title="Unfinished Exam"
        subtitle="You still have unanswered questions."
        description={`You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`}
        confirmLabel="Submit Anyway"
        onConfirm={() => {
          setShowSubmitWarning(false);
          handleSubmitAnswers();
        }}
        cancelLabel="Continue Exam"
      />
      <TimerCompletionModal
        isOpen={showTimerCompletionModal}
        onClose={() => setShowTimerCompletionModal(false)}
        onConfirm={handleTimerCompletion}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredCount}
        timeUsedSeconds={
          examData?.enableTimer && examData?.durationMinutes
            ? examData.durationMinutes * 60 - (secondsLeft ?? 0)
            : undefined
        }
        isSubmitting={isSubmitting}
      />
      <ScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />

      {/* Questions list modal (md and below) */}
      <QuestionListModal
        isOpen={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        questions={examData.questions}
        currentIndex={currentQuestionIndex}
        answers={answers}
        onQuestionClick={(idx) => setCurrentQuestionIndex(idx)}
        bookmarkedQuestions={bookmarkedQuestions}
        onToggleBookmark={(qid) => handleToggleBookmark(qid)}
        questionIdKey="questionID"
        quizTitle={
          examData.examTitle || examData.subjectName || "Practice Exam"
        }
        quizSubtitle={examData.subjectCode || undefined}
        totalQuestions={totalQuestions}
      />

      {/* ── MOBILE TOP BAR ── */}
      <div className="flex flex-col border-b border-gray-200 bg-white md:hidden">
        <div className="flex h-[53px] items-center justify-between px-5">
          <div
            className={`outfit-700 flex items-center gap-2 rounded-xl border px-3 py-1 text-[14px] ${secondsLeft !== null && secondsLeft <= 300 ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 bg-gray-50 text-gray-700"}`}
          >
            <i className="bx bxs-stopwatch text-[15px]" />
            {examData.enableTimer && secondsLeft !== null
              ? formatTimer(secondsLeft)
              : "No Limit"}
          </div>
          <button
            onClick={handlePreSubmit}
            disabled={isSubmitting}
            className="outfit-500 cursor-pointer rounded-xl bg-orange-500 px-4 py-[7px] text-[13px] font-bold text-white shadow transition hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Submitting…</span>
            ) : (
              "Submit Exam"
            )}
          </button>
        </div>
        <div className="outfit-400 border-b border-gray-200 px-5 py-5 pt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="outfit-700 text-[10px] tracking-wider text-gray-400 uppercase">
              Progress
            </span>
            <span className="text-[12px] font-semibold text-orange-500">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            {answeredCount} of {totalQuestions} questions completed
          </p>
        </div>
      </div>

      {/* ── TOP NAVBAR (desktop) ── */}
      <header className="hidden h-[53px] w-full items-center justify-between border-b border-gray-200 bg-white px-5 md:flex">
        <div className="flex items-center gap-2">
          <img
            src={collegeLogo}
            alt="College Logo"
            className="h-[30px] w-[30px] object-contain"
          />
          <span className="outfit-700 text-[16px] tracking-wider text-black">
            CAPS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`outfit-700 flex items-center gap-2 rounded-xl border px-3 py-1 text-[14px] ${secondsLeft !== null && secondsLeft <= 300 ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 bg-gray-50 text-gray-700"}`}
          >
            <i className="bx bxs-stopwatch text-[15px]" />
            {examData.enableTimer && secondsLeft !== null
              ? formatTimer(secondsLeft)
              : "No Limit"}
          </div>
          <button
            onClick={handlePreSubmit}
            disabled={isSubmitting}
            className="outfit-500 cursor-pointer rounded-xl bg-orange-500 px-4 py-[7px] text-[13px] font-bold text-white shadow transition hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Submitting…</span>
            ) : (
              "Submit Exam"
            )}
          </button>
        </div>
      </header>

      {/* ── BODY: 3 columns ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ════ LEFT SIDEBAR ════ */}
        <aside className="hidden w-[220px] flex-shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white pb-4 md:flex">
          {/* Progress */}
          <div className="outfit-400 border-b border-gray-200 px-4 py-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="outfit-700 text-[10px] tracking-wider text-gray-400 uppercase">
                Progress
              </span>
              <span className="text-[12px] font-semibold text-orange-500">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {answeredCount} of {totalQuestions} questions completed
            </p>
          </div>

          {/* Question Grid */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="mb-2 flex items-center gap-1">
              <i className="bx bxs-grid text-[12px] text-gray-400" />
              <p className="outfit-500 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Question Grid
              </p>
            </div>
            <div className="max-h-[130px] overflow-y-auto pr-0.5">
              <div className="grid grid-cols-5 gap-1">
                {examData.questions.map((q, index) => {
                  const qid = q.questionID;
                  const isAnswered = answers[qid] !== undefined;
                  const isBookmarkedCell = bookmarkedQuestions.includes(qid);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={qid}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`outfit-400 relative flex h-8 w-full cursor-pointer items-center justify-center rounded text-[11px] font-semibold transition-all ${isAnswered ? "bg-gray-200 text-gray-500 hover:bg-gray-300" : "border border-gray-300 text-gray-600 hover:bg-gray-200"} ${isCurrent ? "text-orange-500 ring-2 ring-orange-600 ring-inset" : ""}`}
                    >
                      {index + 1}
                      {isBookmarkedCell && (
                        <i className="bx bxs-bookmark absolute -top-[0px] -right-[-2px] text-[10px] text-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question list toggle buttons */}
          <div className="hidden py-3 lg:block">
            {[
              ["all", "bx-list-ul", "All Items"],
              ["bookmarked", "bx-bookmark", "Bookmarked"],
            ].map(([mode, icon, label]) => (
              <div key={mode} className="relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${rightPanelMode === mode ? "bg-orange-500" : "bg-transparent"}`}
                />
                <div className="px-3">
                  <button
                    onClick={() =>
                      setRightPanelMode((prev) => (prev === mode ? null : mode))
                    }
                    className={`outfit-400 mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors ${rightPanelMode === mode ? "bg-gray-100 text-orange-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`}
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`bx ${rightPanelMode === mode && mode === "bookmarked" ? "bxs-bookmark" : icon} text-[16px]`}
                      />
                      {label}
                    </div>
                    {mode === "bookmarked" &&
                      bookmarkedQuestions.length > 0 && (
                        <span className="rounded-full px-[6px] py-px text-[10px] font-bold text-gray-600">
                          {bookmarkedQuestions.length}
                        </span>
                      )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="outfit-400 border-t border-gray-200 px-4 py-3">
            {[
              {
                icon: "bx-pencil",
                label: "Scratchpad",
                action: () => setShowScratchpad(true),
                locked: true,
              },
              {
                icon: "bx-calculator",
                label: "Scientific Calculator",
                locked: true,
              },
              { icon: "bx-functions", label: "Formula Sheet", locked: true },
            ].map(({ icon, label, action, locked }) => (
              <button
                key={label}
                onClick={() => {
                  if (locked) alert("Coming Soon!");
                  else if (action) action();
                }}
                className={`mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors ${locked ? "text-gray-400 hover:bg-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`}
              >
                <div className="flex items-center gap-2">
                  <i className={`bx ${icon} text-[16px]`} />
                  {label}
                </div>
                {locked && (
                  <i className="bx bx-lock text-[14px] text-gray-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Profile */}
          <div
            className="relative border-t border-gray-200 px-3 pt-2"
            ref={profileDropdownRef}
          >
            <div
              onClick={() => setProfileDropdownOpen((v) => !v)}
              className="outfit-500 group flex w-full cursor-pointer items-center gap-3 rounded-[8px] bg-[rgb(245,247,246)] px-2 py-2.5 transition-colors hover:bg-gray-100"
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`flex size-9 items-center justify-center rounded-full ${avatarColor} text-sm font-bold text-white`}
                >
                  {userInfo?.fullName ? (
                    (() => {
                      const parts = userInfo.fullName.trim().split(" ");
                      return (
                        parts[0]?.[0] ||
                        "" +
                          (parts.length > 1 ? parts[parts.length - 1][0] : "")
                      ).toUpperCase();
                    })()
                  ) : (
                    <span className="inline-block size-8 animate-pulse rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-gray-700">
                  {userInfo?.fullName || (
                    <span className="inline-block h-3 w-20 animate-pulse rounded bg-gray-200" />
                  )}
                </span>
                <span className="text-xs font-normal text-gray-500">
                  Student
                </span>
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm">
                <i
                  className={`bx ${profileDropdownOpen ? "bx-chevron-down" : "bx-chevron-up"} text-[16px] text-gray-500`}
                />
              </div>
            </div>
            {profileDropdownOpen && (
              <div className="outfit-400 fade-in absolute right-0 bottom-full left-0 z-50 mx-3 mb-2 rounded-md border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={() => navigate(-1)}
                  className="outfit-500 flex w-full cursor-pointer items-center gap-2 rounded-sm px-4 py-3 text-left text-[14px] text-gray-700 transition hover:bg-gray-100"
                >
                  <i className="bx bx-arrow-out-right-square-half text-[15px]" />
                  Exit Exam
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ════ CENTER MAIN ════ */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-5 md:px-8">
            {/* Breadcrumb */}
            <div className="mb-4 flex items-center gap-2 overflow-hidden">
              <div
                className="min-w-0 flex-1 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="outfit-500 flex items-center gap-2 text-[12px] font-medium whitespace-nowrap">
                  <span className="tracking-wide text-gray-500 uppercase">
                    {examData.subjectCode || examData.subjectName || "Subject"}
                  </span>
                  <i className="bx bx-chevron-right flex-shrink-0 text-gray-400" />
                  <span className="font-semibold tracking-wide text-orange-500 uppercase">
                    {examData.examTitle || "Practice Exam"}
                  </span>
                </div>
              </div>
              <div className="outfit-400 ml-2 flex flex-shrink-0 items-center gap-2">
                {/* List button (md and below) */}
                <button
                  onClick={() => setShowQuestionsModal(true)}
                  title="All / Bookmarked questions"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-[7px] text-gray-600 transition hover:bg-gray-50 lg:hidden"
                >
                  <i className="bx bx-list-ul text-[18px]" />
                </button>
                <button
                  onClick={() => handleToggleBookmark(currentQID)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-[7px] text-[12px] font-medium transition ${isBookmarked ? "border-orange-300 bg-yellow-50 text-yellow-600" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <i
                    className={`bx ${isBookmarked ? "bxs-bookmark" : "bx-bookmark"} text-[14px]`}
                  />
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </div>

            {/* Question header */}
            <div className="-mt-4 mb-4 flex items-center gap-3">
              <h2 className="outfit-700 text-[22px] text-gray-900">
                Question {currentQuestionIndex + 1}
              </h2>
            </div>

            {/* Question text */}
            <div
              className="outfit-400 mb-5 w-full min-w-0 text-[14px] leading-relaxed break-words whitespace-normal text-gray-700"
              style={{
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
            />

            {/* Question image */}
            {currentQuestion.questionImage && (
              <div className="mb-5">
                <div
                  className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-md transition-opacity hover:opacity-80"
                  onClick={() => {
                    setSelectedImageUrl(currentQuestion.questionImage);
                    setIsQuestionImageModalOpen(true);
                  }}
                >
                  {/* Skeleton shown while image is loading */}
                  {!isImageLoaded && (
                    <div className="h-[150px] w-[300px] animate-pulse rounded-lg bg-gray-200" />
                  )}
                  <img
                    key={currentQuestion.questionImage}
                    src={currentQuestion.questionImage}
                    alt="Question"
                    onLoad={() => setIsImageLoaded(true)}
                    className={`max-h-[150px] max-w-[300px] rounded-lg object-contain transition-opacity duration-300 ${
                      isImageLoaded ? "opacity-100" : "absolute opacity-0"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Choices */}
            {(() => {
              const stripHtml = (html) => html?.replace(/<[^>]*>/g, "") ?? "";
              return (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {currentQuestion.choices.map((choice, ci) => {
                    const isSelected = answers[currentQID] === choice.choiceID;
                    const plainText = stripHtml(
                      choice.choiceText,
                    ).toLowerCase();
                    const isNoneOfTheAbove =
                      plainText.includes("none of the above") ||
                      plainText.includes("none of these") ||
                      plainText === "none";
                    return (
                      <button
                        key={choice.choiceID}
                        onClick={() =>
                          handleSelectAnswer(currentQID, choice.choiceID)
                        }
                        className={`relative flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-all ${isSelected ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 bg-white shadow-sm hover:border-orange-300 hover:bg-orange-50/40"} ${isNoneOfTheAbove ? "md:col-span-2" : ""}`}
                      >
                        <span
                          className={`mt-[1px] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[12px] font-bold transition-colors ${isSelected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
                        >
                          {choiceLetters[ci] ?? ci + 1}
                        </span>
                        {!choice.choiceImage && (
                          <span
                            className={`outfit-400 flex-1 pt-[6px] leading-snug font-medium break-words ${isSelected ? "text-gray-800" : "text-gray-700"}`}
                            style={{
                              whiteSpace: "normal",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: choice.choiceText,
                            }}
                          />
                        )}
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                            <i className="bx bx-check text-[13px]" />
                          </span>
                        )}
                        {choice.choiceImage && (
                          <div className="flex flex-1 flex-col items-center gap-2">
                            <img
                              src={choice.choiceImage}
                              alt="Choice"
                              className="h-auto max-h-[140px] max-w-full cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-80"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageUrl(choice.choiceImage);
                                setIsChoiceImageModalOpen(true);
                              }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Inline navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="bx bx-arrow-left-stroke text-lg" />
                Previous
              </button>

              {/* Dot tracker — sliding window of 5 */}
              <div className="hidden items-center gap-1.5 md:flex">
                {(() => {
                  const WINDOW = 5;
                  const half = Math.floor(WINDOW / 2);
                  let start = Math.max(0, currentQuestionIndex - half);
                  const end = Math.min(totalQuestions, start + WINDOW);
                  start = Math.max(0, end - WINDOW);
                  return Array.from(
                    { length: end - start },
                    (_, k) => start + k,
                  ).map((i) => {
                    const q = examData.questions[i];
                    const dotAnswered = answers[q.questionID] !== undefined;
                    const isCurr = i === currentQuestionIndex;
                    return (
                      <button
                        key={q.questionID}
                        onClick={() => setCurrentQuestionIndex(i)}
                        className={`cursor-pointer rounded-full transition-all ${isCurr ? "h-[8px] w-[8px] bg-orange-500" : dotAnswered ? "h-[6px] w-[6px] bg-orange-300" : "h-[6px] w-[6px] bg-gray-300 hover:bg-gray-400"}`}
                      />
                    );
                  });
                })()}
              </div>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white shadow transition hover:bg-orange-600 active:scale-[0.97]"
                >
                  Next Question
                  <i className="bx bx-arrow-right-stroke text-lg" />
                </button>
              ) : (
                <button
                  onClick={handlePreSubmit}
                  disabled={isSubmitting}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[13px] font-bold text-white shadow transition hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>Submitting…</>
                  ) : (
                    <>
                      {isPreview ? "View Results" : "Submit Exam"}
                      <i className="bx bx-check-circle text-lg" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>

        {/* ════ RIGHT PANEL ════ */}
        {rightPanelMode && (
          <aside className="hidden w-[260px] flex-shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:flex">
            <div className="outfit-400 flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <i
                    className={`bx ${rightPanelMode === "bookmarked" ? "bxs-bookmark text-gray-500" : "bx-list-ul text-gray-500"} text-[16px]`}
                  />
                  <span className="outfit-700 text-[12px] tracking-wide text-gray-600 uppercase">
                    {rightPanelMode === "bookmarked"
                      ? "Bookmarked"
                      : "All Questions"}
                  </span>
                </div>
                <button
                  onClick={() => setRightPanelMode(null)}
                  className="cursor-pointer text-gray-600 hover:text-gray-800"
                >
                  <i className="bx bx-x text-[16px]" />
                </button>
              </div>
              <div className="flex border-b border-gray-100">
                {["all", "bookmarked"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRightPanelMode(mode)}
                    className={`outfit-500 flex-1 cursor-pointer py-2 text-[11px] transition-colors ${rightPanelMode === mode ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {mode === "all" ? "All" : "Bookmarked"}
                  </button>
                ))}
              </div>
              <div className="outfit-400 flex-1 overflow-y-auto px-2 py-2">
                {(() => {
                  const list =
                    rightPanelMode === "bookmarked"
                      ? examData.questions.filter((q) =>
                          bookmarkedQuestions.includes(q.questionID),
                        )
                      : examData.questions;
                  if (list.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                        <i className="bx bx-bookmark mb-2 text-4xl" />
                        <p className="text-[11px]">
                          No bookmarked questions yet
                        </p>
                      </div>
                    );
                  }
                  return list.map((q) => {
                    const idx = examData.questions.indexOf(q);
                    const qid = q.questionID;
                    const isAnswered = answers[qid] !== undefined;
                    const isCurr = idx === currentQuestionIndex;
                    const isQBookmarked = bookmarkedQuestions.includes(qid);
                    return (
                      <button
                        key={qid}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`mb-1 flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors ${isCurr ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-gray-50"}`}
                      >
                        <span
                          className={`mt-[1px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold ${isCurr ? "bg-orange-500 text-white" : isAnswered ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
                        >
                          {idx + 1}
                        </span>
                        <span className="line-clamp-2 flex-1 text-[11px] leading-snug text-gray-700">
                          {q.questionText.replace(/<[^>]*>/g, "") ||
                            `Question ${idx + 1}`}
                        </span>
                        {isQBookmarked && (
                          <i className="bx bxs-bookmark -mt-[9px] flex-shrink-0 text-[14px] text-orange-400" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Image lightbox */}
      {(isQuestionImageModalOpen || isChoiceImageModalOpen) && (
        <div
          className="lightbox-bg bg-opacity-75 fixed inset-0 z-100 flex items-center justify-center bg-black"
          onClick={() => {
            setIsQuestionImageModalOpen(false);
            setIsChoiceImageModalOpen(false);
          }}
        >
          <div className="relative">
            <img
              src={selectedImageUrl}
              alt="Full View"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeExam;
