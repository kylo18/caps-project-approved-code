import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Mexp from "math-expression-evaluator";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";
import QuestionListModal from "../components/QuestionListModal";
import TimerCompletionModal from "../components/TimerCompletionModal";
import WarningModal from "../components/WarningModal";

const collegeLogo = new URL("../assets/college-logo.png", import.meta.url).href;

/* ── Avatar color helpers (same as sideBar.jsx) ── */
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

/* ─────────────────────────────────────────────────────────────
   Scratchpad modal  (canvas-based drawing board)
────────────────────────────────────────────────────────────── */
const SCRATCHPAD_COLORS = [
  { id: "black", hex: "#1a1a1a" },
  { id: "red", hex: "#ef4444" },
  { id: "blue", hex: "#3b82f6" },
  { id: "green", hex: "#22c55e" },
];

const ScratchpadModal = ({ isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("draw"); // 'draw' | 'eraser' | 'text'
  const [color, setColor] = useState("#1a1a1a");
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]); // ImageData stack for undo
  const [redoStack, setRedoStack] = useState([]);
  const [hasContent, setHasContent] = useState(false);
  const lastPos = useRef(null);

  // Initialise canvas when it mounts / becomes visible
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Set canvas size to match its CSS size once
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
    // Draw a dot for single clicks
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
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((h) => [...h, current]);
    const next = redoStack[redoStack.length - 1];
    ctx.putImageData(next, 0, 0);
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
        {/* ── Header ── */}
        <div className="flex h-[56px] flex-shrink-0 items-center justify-between border-b border-gray-100 px-5">
          {/* Left: title */}
          <div className="flex items-center gap-2">
            <i className="bx bx-edit text-[18px] text-orange-500" />
            <span className="text-[15px] font-bold text-gray-800">
              Scratchpad
            </span>
          </div>

          {/* Center: toolbar */}
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={!history.length}
              title="Undo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="bx bx-undo text-[18px]" />
            </button>
            {/* Redo */}
            <button
              onClick={handleRedo}
              disabled={!redoStack.length}
              title="Redo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="bx bx-redo text-[18px]" />
            </button>

            <div className="mx-1 h-5 w-px bg-gray-200" />

            {/* Draw */}
            <button
              onClick={() => setTool("draw")}
              title="Draw"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition ${
                tool === "draw"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-800"
              }`}
            >
              <i className="bx bx-pencil text-[17px]" />
            </button>
            {/* Eraser */}
            <button
              onClick={() => setTool("eraser")}
              title="Eraser"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition ${
                tool === "eraser"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-800"
              }`}
            >
              <i className="bx bx-eraser text-[17px]" />
            </button>
            {/* Text */}
            <button
              onClick={() => setTool("text")}
              title="Add Text"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[13px] font-bold transition ${
                tool === "text"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-800"
              }`}
            >
              T
            </button>

            <div className="mx-1 h-5 w-px bg-gray-200" />

            {/* Clear */}
            <button
              onClick={handleClear}
              title="Clear canvas"
              className="flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <i className="bx bx-trash text-[15px]" />
              CLEAR
            </button>
          </div>

          {/* Right: close */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <i className="bx bx-x text-[20px]" />
          </button>
        </div>

        {/* ── Canvas area ── */}
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

          {/* Placeholder — shown when canvas is empty */}
          {!hasContent && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
              {/* Dashed circle watermark */}
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

        {/* ── Bottom bar ── */}
        <div className="flex h-[52px] flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-5">
          {/* Color swatches + size slider */}
          <div className="flex items-center gap-4">
            {/* Colors */}
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

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200" />

            {/* Size slider */}
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
              {/* Preview dot */}
              <div
                className="rounded-full bg-orange-500 transition-all"
                style={{
                  width: `${Math.max(8, size * 1.5)}px`,
                  height: `${Math.max(8, size * 1.5)}px`,
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
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

/* ─────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */
const StudentQuiz = () => {
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [hiddenQuestions, setHiddenQuestions] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showTimerCompletionModal, setShowTimerCompletionModal] =
    useState(false);
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] =
    useState(false);
  const [isChoiceImageModalOpen, setIsChoiceImageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [quizStartTime] = useState(new Date().toISOString());
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizKey, setQuizKey] = useState(null);
  const [showModifiedWarning, setShowModifiedWarning] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  // 'calculator' | 'all' | 'bookmarked'  – controls what the right panel shows
  const [rightPanelMode, setRightPanelMode] = useState("all");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsModalTab, setQuestionsModalTab] = useState("all");
  // calculator internal state
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcExpr, setCalcExpr] = useState("");
  const [calcJustEvaled, setCalcJustEvaled] = useState(false);
  const [calcDeg, setCalcDeg] = useState(true); // true=DEG, false=RAD
  const calcPendingFnRef = useRef(null);
  /* ── User info + avatar (same as sideBar.jsx) ── */
  const [userInfo, setUserInfo] = useState(null);
  const [avatarColor, setAvatarColor] = useState("bg-gray-300");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const { classPersonalQuizID } = useParams();
  const { toast, showToast } = useToast();

  /* ── Fetch user info (same pattern as sideBar.jsx) ── */
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
        setUserInfo(await res.json());
      } catch {
        /* silent */
      }
    };
    fetchUserInfo();
  }, [apiUrl]);

  /* ── Persist avatar color ── */
  useEffect(() => {
    if (userInfo) {
      let color = getPersistedAvatarColor(userInfo);
      if (!color) {
        color = getRandomAvatarColor();
        setPersistedAvatarColor(userInfo, color);
      }
      setAvatarColor(color);
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

  /* ── Close image lightboxes if timer modal appears ── */
  useEffect(() => {
    if (showTimerCompletionModal) {
      setIsQuestionImageModalOpen(false);
      setIsChoiceImageModalOpen(false);
      setSelectedImageUrl(null);
    }
  }, [showTimerCompletionModal]);

  const stateClassPersonalQuizID = location.state?.classPersonalQuizID;
  const quizID = classPersonalQuizID || stateClassPersonalQuizID;
  const classID = location.state?.classID;
  const resumeAttempt = location.state?.resumeAttempt;
  const attemptNumber = location.state?.attemptNumber;
  const isModified = location.state?.isModified;
  // Real names for breadcrumb — passed from QuizInfo
  const stateQuizInfo = location.state?.quizInfo;
  const stateQuiz = location.state?.quiz;
  const breadcrumbClass =
    stateQuizInfo?.classAssignment?.className ||
    stateQuiz?.subject?.subjectCode ||
    null;
  const breadcrumbQuiz = stateQuiz?.title || stateQuizInfo?.quiz?.title || null;

  const startData = location.state?.startData;

  /* ── Start quiz ── */
  useEffect(() => {
    const startQuiz = async () => {
      if (!quizID) {
        setError("Quiz ID is missing. Please select a quiz first.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      if (isModified) setShowModifiedWarning(true);

      try {
        // If startData is missing (e.g. after a page refresh), try to restore
        // quiz session from localStorage using a key we look up by quizID.
        let data = startData;

        if (!data) {
          // Try to find the most recently saved session for this quizID
          const metaRaw = localStorage.getItem(`quiz_${quizID}_meta`);
          if (metaRaw) {
            try {
              data = JSON.parse(metaRaw);
            } catch {
              /* ignore */
            }
          }
          if (!data) {
            setError(
              "Quiz session data is missing. Please start the quiz from the Quiz Info page.",
            );
            setIsLoading(false);
            return;
          }
        }

        const generatedQuizKey =
          resumeAttempt && attemptNumber
            ? `quiz_${quizID}_attempt_${attemptNumber}`
            : `quiz_${quizID}_attempt_${data.attemptNumber}`;
        setQuizKey(generatedQuizKey);

        // Always save metadata so a refresh can restore it
        localStorage.setItem(
          `quiz_${quizID}_meta`,
          JSON.stringify({
            quiz: data.quiz,
            settings: data.settings,
            attemptNumber: data.attemptNumber,
            startedAt: data.startedAt,
          }),
        );

        // Load questions: prefer any previously saved copy, otherwise use the
        // questions from startData.
        const savedQs = localStorage.getItem(`${generatedQuizKey}_questions`);
        let questionsToUse = data.questions || [];
        if (savedQs) {
          try {
            questionsToUse = JSON.parse(savedQs);
          } catch {
            /* ignore */
          }
        }

        setQuizData({
          quiz: data.quiz,
          settings: data.settings,
          questions: questionsToUse,
          attemptNumber: attemptNumber || data.attemptNumber,
          startedAt: data.startedAt,
        });

        // On a truly fresh attempt, persist the questions + version info once,
        // mirroring the robustness of PracticeExam's persistence.
        if (!savedQs && data.questions?.length) {
          localStorage.setItem(
            `${generatedQuizKey}_questions`,
            JSON.stringify(data.questions),
          );
          const quizVersion = {
            questionCount: data.questions.length,
            questionIds: data.questions
              .map((q) => q.personalQuizQuestionID)
              .sort()
              .join(","),
            settingsHash: data.settings
              ? JSON.stringify({
                  quizTimer: data.settings.quizTimer,
                  quizTimerEnabled: data.settings.quizTimerEnabled,
                  shuffleQuestions: data.settings.shuffleQuestions,
                  shuffleChoices: data.settings.shuffleChoices,
                })
              : "",
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(
            `${generatedQuizKey}_version`,
            JSON.stringify(quizVersion),
          );
        }

        // Restore persisted state (answers, flags, timer, last question)
        const savedAnswers = localStorage.getItem(generatedQuizKey);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch {
            /* ignore */
          }
        }

        const savedFlags = localStorage.getItem(`${generatedQuizKey}_flags`);
        if (savedFlags) {
          try {
            setFlaggedQuestions(JSON.parse(savedFlags));
          } catch {
            /* ignore */
          }
        }

        const savedTimer = localStorage.getItem(`${generatedQuizKey}_timer`);
        if (savedTimer && data.settings?.quizTimerEnabled) {
          const t = parseInt(savedTimer);
          setSecondsLeft(Number.isFinite(t) && t > 0 ? t : 0);
        } else if (
          data.settings?.quizTimerEnabled &&
          data.settings?.quizTimer
        ) {
          setSecondsLeft(data.settings.quizTimer * 60);
        }

        const savedQ = localStorage.getItem(
          `${generatedQuizKey}_last_question`,
        );
        if (savedQ !== null) {
          const idx = parseInt(savedQ);
          if (!isNaN(idx) && idx >= 0 && idx < questionsToUse.length) {
            setCurrentQuestionIndex(idx);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to start quiz. Please try again.");
        showToast(
          err.message || "Failed to start quiz. Please try again.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };
    startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizID, apiUrl, resumeAttempt, attemptNumber]);

  /* ── Timer ── */
  useEffect(() => {
    if (!quizData?.settings?.quizTimerEnabled || secondsLeft === null) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerCompletionModal(true);
          return 0;
        }
        const next = prev - 1;
        if (quizKey) localStorage.setItem(`${quizKey}_timer`, next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizData?.settings?.quizTimerEnabled, secondsLeft, quizKey]);

  /* ── Persist answers ── */
  useEffect(() => {
    if (quizKey && Object.keys(answers).length > 0)
      localStorage.setItem(quizKey, JSON.stringify(answers));
  }, [answers, quizKey]);

  /* ── Persist flags ── */
  useEffect(() => {
    if (quizKey) {
      if (flaggedQuestions.length > 0)
        localStorage.setItem(
          `${quizKey}_flags`,
          JSON.stringify(flaggedQuestions),
        );
      else localStorage.removeItem(`${quizKey}_flags`);
    }
  }, [flaggedQuestions, quizKey]);

  /* ── Persist current question index ── */
  useEffect(() => {
    if (quizKey && quizData)
      localStorage.setItem(
        `${quizKey}_last_question`,
        currentQuestionIndex.toString(),
      );
  }, [currentQuestionIndex, quizKey, quizData]);

  /* ── beforeunload: save position before refresh ── */
  useEffect(() => {
    const handler = () => {
      if (quizKey && quizData)
        localStorage.setItem(
          `${quizKey}_last_question`,
          currentQuestionIndex.toString(),
        );
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [quizKey, currentQuestionIndex, quizData]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (quizKey && secondsLeft === 0) {
        [
          "",
          "_flags",
          "_timer",
          "_version",
          "_questions",
          "_last_question",
        ].forEach((suffix) => localStorage.removeItem(`${quizKey}${suffix}`));
        localStorage.removeItem(`quiz_${quizID}_meta`);
      }
    };
  }, [quizKey, secondsLeft, quizID]);

  /* ── Reset image modals on question change ── */
  useEffect(() => {
    setIsQuestionImageModalOpen(false);
    setIsChoiceImageModalOpen(false);
    setSelectedImageUrl(null);
    setIsImageLoaded(false);
  }, [currentQuestionIndex]);

  /* ── Loading / error screens ── */
  if (isLoading) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="loader mx-auto mb-2" />
          </div>
        </div>
      </>
    );
  }

  if (error || !quizData) {
    return (
      <>
        <Toast message={toast.message} type={toast.type} show={toast.show} />
        <div className="outfit flex min-h-screen items-center justify-center">
          <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || "No quiz data found. Please select a quiz first."}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (classID)
                    navigate(`/class/${classID}/quizzes`, {
                      state: { classItem: location.state?.classItem },
                    });
                  else navigate(-1);
                }}
                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Derived values ── */
  const totalQuestions = quizData.questions.length;
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const currentQID = currentQuestion.personalQuizQuestionID;
  const answeredCount = quizData.questions.filter(
    (q) => answers[q.personalQuizQuestionID] !== undefined,
  ).length;
  const progressPct =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isFlagged = flaggedQuestions.includes(currentQID);
  const isHidden = hiddenQuestions.includes(currentQID);
  const areAllAnswered = quizData.questions.every(
    (q) => answers[q.personalQuizQuestionID] !== undefined,
  );

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

  const handleGridClick = (index) => setCurrentQuestionIndex(index);

  const handleToggleFlag = () =>
    setFlaggedQuestions((prev) =>
      prev.includes(currentQID)
        ? prev.filter((id) => id !== currentQID)
        : [...prev, currentQID],
    );

  const handleToggleHide = () =>
    setHiddenQuestions((prev) =>
      prev.includes(currentQID)
        ? prev.filter((id) => id !== currentQID)
        : [...prev, currentQID],
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
      const allAnswers = quizData.questions.map((q) => ({
        personalQuizQuestionID: q.personalQuizQuestionID,
        selectedChoiceID: answers[q.personalQuizQuestionID]
          ? parseInt(answers[q.personalQuizQuestionID])
          : null,
      }));

      const startTime = quizData.startedAt
        ? new Date(quizData.startedAt)
        : new Date(quizStartTime);
      const timeTakenSeconds = Math.floor((new Date() - startTime) / 1000);
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `${apiUrl}/quizzes/${quizID}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            attempt_number: quizData.attemptNumber,
            answers: allAnswers,
            started_at: quizData.startedAt || quizStartTime,
            time_taken_seconds: timeTakenSeconds,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to submit answers");
      if (!data.success)
        throw new Error(data.message || "Failed to submit quiz");

      // Clear persisted quiz session data
      if (quizKey) {
        [
          "",
          "_flags",
          "_timer",
          "_version",
          "_questions",
          "_last_question",
        ].forEach((suffix) => localStorage.removeItem(`${quizKey}${suffix}`));
        localStorage.removeItem(`quiz_${quizID}_meta`);
      }

      setSecondsLeft(0);

      // Navigate to the results page, forwarding all fields from the new API
      // response. Note: when showScoreAfterQuiz is false the backend returns
      // null for score/total_score/percentage/isPassed — the result page should
      // handle those gracefully.
      navigate(`/quiz-result/${quizID}`, {
        state: {
          result: data.result,       // { id, attempt_number, score, total_score, percentage, isPassed,
                                     //   time_taken_seconds, time_taken_minutes, time_taken_formatted,
                                     //   started_at, submitted_at, showScoreAfterQuiz }
          questions: data.questions, // per-question breakdown (respects showCorrectQuestion /
                                     //   showCorrectAnswers settings)
          quiz: data.quiz,           // { personalQuizID, title, description }
          settings: data.settings,   // { showScoreAfterQuiz, showCorrectQuestion, showCorrectAnswers }
          classID,
          classPersonalQuizID: quizID,
        },
        replace: true,
      });

      setAnswers({});
    } catch (err) {
      showToast(
        err.message || "Failed to submit quiz. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const choiceLetters = ["A", "B", "C", "D", "E", "F"];

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="outfit flex h-screen flex-col overflow-hidden bg-white font-sans">
      <Toast message={toast.message} type={toast.type} show={toast.show} />
      <TimerCompletionModal
        isOpen={showTimerCompletionModal}
        onClose={() => setShowTimerCompletionModal(false)}
        onConfirm={() => handleSubmitAnswers()}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredCount}
        timeUsedSeconds={
          quizData?.settings?.quizTimerEnabled && quizData?.settings?.quizTimer
            ? quizData.settings.quizTimer * 60 - (secondsLeft ?? 0)
            : undefined
        }
        quizId={quizID}
        isSubmitting={isSubmitting}
      />
      <WarningModal
        isOpen={showSubmitWarning}
        onClose={() => setShowSubmitWarning(false)}
        title="Unfinished Quiz"
        subtitle="You still have unanswered questions."
        description={`You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`}
        confirmLabel="Submit Anyway"
        onConfirm={() => {
          setShowSubmitWarning(false);
          handleSubmitAnswers();
        }}
        cancelLabel="Continue Quiz"
      />
      <ScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />

      {/* Questions list modal (md and below) */}
      <QuestionListModal
        isOpen={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        questions={quizData.questions}
        currentIndex={currentQuestionIndex}
        answers={answers}
        onQuestionClick={(idx) => setCurrentQuestionIndex(idx)}
        bookmarkedQuestions={flaggedQuestions}
        onToggleBookmark={(qid) =>
          setFlaggedQuestions((prev) =>
            prev.includes(qid)
              ? prev.filter((id) => id !== qid)
              : [...prev, qid],
          )
        }
        questionIdKey="personalQuizQuestionID"
        quizTitle={breadcrumbQuiz || quizData.quiz?.title || "Quiz"}
        quizSubtitle={
          breadcrumbClass || quizData.quiz?.subject?.subjectCode || undefined
        }
        totalQuestions={totalQuestions}
      />

      {/* ── MOBILE TOP BAR (timer + progress, md and below) ── */}
      <div className="flex flex-col border-b border-gray-200 bg-white md:hidden">
        {/* Timer row */}
        <div className="flex h-[53px] items-center justify-between px-5">
          <div
            className={`outfit-700 flex items-center gap-2 rounded-xl border px-3 py-1 text-[14px] ${
              secondsLeft !== null && secondsLeft <= 300
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            <i className="bx bxs-stopwatch text-[15px]" />
            {quizData.settings?.quizTimerEnabled && secondsLeft !== null
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
        {/* Progress bar row */}

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

      {/* ── TOP NAVBAR (desktop md+) ── */}
      <header className="hidden h-[53px] w-full items-center justify-between border-b border-gray-200 bg-white px-5 md:flex">
        {/* Left: logo + CAPS + title */}
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

        {/* Right: timer + settings + finish */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={`outfit-700 flex items-center gap-2 rounded-xl border px-3 py-1 text-[14px] ${
              secondsLeft !== null && secondsLeft <= 300
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            <i className="bx bxs-stopwatch text-[15px]" />
            {quizData.settings?.quizTimerEnabled && secondsLeft !== null
              ? formatTimer(secondsLeft)
              : "No Limit"}
          </div>

          {/* Finish */}
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
        {/* ════ LEFT SIDEBAR (hidden on mobile) ════ */}
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
                {quizData.questions.map((q, index) => {
                  const qid = q.personalQuizQuestionID;
                  const isAnswered = answers[qid] !== undefined;
                  const isFlaggedCell = flaggedQuestions.includes(qid);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={qid}
                      onClick={() => handleGridClick(index)}
                      className={`outfit-400 relative flex h-8 w-full cursor-pointer items-center justify-center rounded text-[11px] font-semibold transition-all ${
                        isAnswered
                          ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-200"
                      } ${isCurrent ? "text-orange-500 ring-2 ring-orange-600 ring-inset" : ""} `}
                    >
                      {index + 1}

                      {isFlaggedCell && (
                        <i className="bx bxs-bookmark absolute -top-[0px] -right-[-2px] text-[10px] text-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question list toggle buttons (hidden on md, shown on lg+) */}
          <div className="hidden py-3 lg:block">
            {/* All Items */}
            <div className="relative">
              {/* Active left bar indicator — same as sideBar.jsx */}
              <span
                className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                  rightPanelMode === "all" ? "bg-orange-500" : "bg-transparent"
                }`}
              />
              <div className="px-3">
                <button
                  onClick={() =>
                    setRightPanelMode((prev) => (prev === "all" ? null : "all"))
                  }
                  className={`outfit-400 mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors ${
                    rightPanelMode === "all"
                      ? "bg-gray-100 text-orange-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className="bx bx-list-ul text-[16px]" />
                    All Items
                  </div>
                </button>
              </div>
            </div>

            {/* Bookmarked Items */}
            <div className="relative">
              <span
                className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                  rightPanelMode === "bookmarked"
                    ? "bg-orange-500"
                    : "bg-transparent"
                }`}
              />

              <div className="px-3">
                <button
                  onClick={() =>
                    setRightPanelMode((prev) =>
                      prev === "bookmarked" ? null : "bookmarked",
                    )
                  }
                  className={`outfit-400 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors ${
                    rightPanelMode === "bookmarked"
                      ? "bg-gray-100 text-orange-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i
                      className={`bx ${
                        rightPanelMode === "bookmarked"
                          ? "bxs-bookmark"
                          : "bx-bookmark"
                      } text-[16px]`}
                    />
                    Bookmarked
                  </div>

                  {flaggedQuestions.length > 0 && (
                    <span className="rounded-full px-[6px] py-px text-[10px] font-bold text-gray-600">
                      {flaggedQuestions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="outfit-400 border-t border-gray-200 px-4 py-3">
            {[
              {
                icon: "bx-calculator",
                label: "Scientific Calculator",
                action: () =>
                  setRightPanelMode((p) =>
                    p === "calculator" ? null : "calculator",
                  ),
                locked: true,
              },

              { icon: "bx-functions", label: "Formula Sheet", locked: true },
              {
                icon: "bx-pencil",
                label: "Scratchpad",
                locked: true,
              },
            ].map(({ icon, label, action, locked }) => (
              <button
                key={label}
                onClick={() => {
                  if (locked) {
                    alert("Coming Soon!");
                  } else if (action) {
                    action();
                  }
                }}
                className={`mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors ${
                  locked
                    ? "text-gray-400 hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`bx ${icon} text-[16px]`} />
                  {label}
                </div>

                {/* Lock icon if locked */}
                {locked && (
                  <i className="bx bx-lock text-[14px] text-gray-400" />
                )}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Profile header (matches sideBar.jsx) ── */}
          <div
            className="relative border-t border-gray-200 px-3 pt-2"
            ref={profileDropdownRef}
          >
            <div
              onClick={() => setProfileDropdownOpen((v) => !v)}
              className="outfit-500 group flex w-full cursor-pointer items-center gap-3 rounded-[8px] bg-[rgb(245,247,246)] px-2 py-2.5 transition-colors hover:bg-gray-100"
            >
              {/* Avatar circle with initials */}
              <div className="relative flex-shrink-0">
                <div
                  className={`flex size-9 items-center justify-center rounded-full ${avatarColor} text-sm font-bold text-white`}
                >
                  {userInfo?.fullName ? (
                    (() => {
                      const parts = userInfo.fullName.trim().split(" ");
                      const fi = parts[0]?.[0] || "";
                      const li =
                        parts.length > 1 ? parts[parts.length - 1][0] : "";
                      return (fi + li).toUpperCase();
                    })()
                  ) : (
                    <span className="inline-block size-8 animate-pulse rounded-full bg-gray-300" />
                  )}
                </div>
              </div>

              {/* Name + role */}
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

              {/* Chevron */}
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm">
                <i
                  className={`bx ${
                    profileDropdownOpen ? "bx-chevron-down" : "bx-chevron-up"
                  } text-[16px] text-gray-500`}
                />
              </div>
            </div>

            {/* Dropdown — opens upward */}
            {profileDropdownOpen && (
              <div className="outfit-400 fade-in absolute right-0 bottom-full left-0 z-50 mx-3 mb-2 rounded-md border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={() => navigate(-1)}
                  className="outfit-500 flex w-full cursor-pointer items-center gap-2 rounded-sm px-4 py-3 text-left text-[14px] text-gray-700 transition hover:bg-gray-100"
                >
                  <i className="bx bx-arrow-out-right-square-half text-[15px]" />
                  Exit Quiz
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ════ CENTER MAIN ════ */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Modified warning banner */}
          {showModifiedWarning && (
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <i className="bx bx-error-circle text-xl text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Quiz Modified</p>
                  <p className="mt-1 text-amber-700">
                    This quiz has been modified since you started. You can
                    continue your current attempt, but must finish it before
                    starting a new one.
                  </p>
                </div>
                <button
                  onClick={() => setShowModifiedWarning(false)}
                  className="ml-auto cursor-pointer text-amber-600 hover:text-amber-800"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              </div>
            </div>
          )}

          {/* Question content — scrollable, includes breadcrumb */}
          <div className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-5">
            {/* Breadcrumb + flag/hide — scrolls with content */}
            <div className="mb-4 flex items-center gap-2 overflow-hidden">
              {/* Scrollable breadcrumb */}
              <div
                className="min-w-0 flex-1 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="outfit-500 flex items-center gap-2 text-[12px] font-medium whitespace-nowrap">
                  {/* Subject */}
                  <span
                    className="max-w-[12ch] truncate tracking-wide text-gray-500 uppercase"
                    title={breadcrumbClass || quizData.quiz.subject || "Class"}
                  >
                    {(breadcrumbClass || quizData.quiz.subject || "Class")
                      .length > 12
                      ? (
                          breadcrumbClass ||
                          quizData.quiz.subject ||
                          "Class"
                        ).slice(0, 12) + "…"
                      : breadcrumbClass || quizData.quiz.subject || "Class"}
                  </span>

                  <i className="bx bx-chevron-right flex-shrink-0 text-gray-400" />

                  {/* Quiz */}
                  <span className="font-semibold tracking-wide text-orange-500 uppercase">
                    {breadcrumbQuiz || quizData.quiz.topic || "Quiz"}
                  </span>
                </div>
              </div>
              <div className="outfit-400 ml-2 flex flex-shrink-0 items-center gap-2">
                {/* List button (md and below) — opens questions modal */}
                <button
                  onClick={() => setShowQuestionsModal(true)}
                  title="All / Bookmarked questions"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-[7px] text-gray-600 transition hover:bg-gray-50 lg:hidden"
                >
                  <i className="bx bx-list-ul text-[18px]" />
                </button>
                <button
                  onClick={handleToggleFlag}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border p-[7px] text-[12px] font-medium transition md:px-3 md:py-[7px] ${
                    isFlagged
                      ? "border-orange-300 bg-yellow-50 text-yellow-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <i
                    className={`bx ${isFlagged ? "bxs-bookmark" : "bx-bookmark"} text-[14px]`}
                  />
                  <span className="hidden md:inline">
                    {isFlagged ? "Bookmarked" : "Bookmark"}
                  </span>
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
            {!isHidden ? (
              <>
                <div
                  className="outfit-400 mb-5 w-full min-w-0 text-[14px] leading-relaxed break-words whitespace-normal text-gray-700"
                  style={{
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: currentQuestion.questionText,
                  }}
                />
                {currentQuestion.image && (
                  <div className="mb-5">
                    <div
                      className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-md transition-opacity hover:opacity-80"
                      onClick={() => {
                        setSelectedImageUrl(currentQuestion.image);
                        setIsQuestionImageModalOpen(true);
                      }}
                    >
                      {/* Skeleton shown while image is loading */}
                      {!isImageLoaded && (
                        <div className="h-[150px] w-[300px] animate-pulse rounded-lg bg-gray-200" />
                      )}
                      <img
                        key={currentQuestion.image}
                        src={currentQuestion.image}
                        alt="Question"
                        onLoad={() => setIsImageLoaded(true)}
                        className={`max-h-[150px] max-w-[300px] rounded-lg object-contain transition-opacity duration-300 ${
                          isImageLoaded ? "opacity-100" : "absolute opacity-0"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Choices — 2-column grid */}
                {(() => {
                  const stripHtml = (html) =>
                    html?.replace(/<[^>]*>/g, "") ?? "";

                  return (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {currentQuestion.choices.map((choice, ci) => {
                        const isSelected =
                          answers[currentQID] === choice.personalQuizChoiceID;

                        // Detect "none of the above" style choices
                        const plainText = stripHtml(
                          choice.choiceText,
                        ).toLowerCase();
                        const isNoneOfTheAbove =
                          plainText.includes("none of the above") ||
                          plainText.includes("none of these") ||
                          plainText === "none";

                        return (
                          <button
                            key={choice.personalQuizChoiceID}
                            onClick={() =>
                              handleSelectAnswer(
                                currentQID,
                                choice.personalQuizChoiceID,
                              )
                            }
                            className={`relative flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 shadow-md"
                                : "border-gray-200 bg-white shadow-sm hover:border-orange-300 hover:bg-orange-50/40"
                            } ${isNoneOfTheAbove ? "md:col-span-2" : ""}`}
                          >
                            {/* Letter label — always visible, left-aligned */}
                            <span
                              className={`mt-[1px] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[12px] font-bold transition-colors ${isSelected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                              {choiceLetters[ci] ?? ci + 1}
                            </span>
                            {/* Choice text */}
                            {!choice.image && (
                              <span
                                className={`outfit-400 flex-1 pt-[6px] leading-snug font-medium break-words ${
                                  isSelected ? "text-gray-800" : "text-gray-700"
                                }`}
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

                            {/* Check icon if selected — top-right corner */}
                            {isSelected && (
                              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                                <i className="bx bx-check text-[13px]" />
                              </span>
                            )}

                            {/* Choice image — centered */}
                            {choice.image && (
                              <div className="flex flex-1 flex-col items-center gap-2">
                                <img
                                  src={choice.image}
                                  alt="Choice"
                                  className="h-auto max-h-[140px] max-w-full cursor-pointer rounded-lg object-contain shadow transition-opacity hover:opacity-80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageUrl(choice.image);
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

                {/* ── Inline navigation ── */}
                <div className="mt-8 flex items-center justify-between">
                  {/* Previous */}
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
                        const q = quizData.questions[i];
                        const dotAnswered =
                          answers[q.personalQuizQuestionID] !== undefined;
                        const isCurr = i === currentQuestionIndex;
                        return (
                          <button
                            key={q.personalQuizQuestionID}
                            onClick={() => handleGridClick(i)}
                            className={`cursor-pointer rounded-full transition-all ${
                              isCurr
                                ? "h-[8px] w-[8px] bg-orange-500"
                                : dotAnswered
                                  ? "h-[6px] w-[6px] bg-orange-300"
                                  : "h-[6px] w-[6px] bg-gray-300 hover:bg-gray-400"
                            }`}
                          />
                        );
                      });
                    })()}
                  </div>

                  {/* Next or Submit */}
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
                          Submit Quiz
                          <i className="bx bx-check-circle text-lg" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <i className="bx bx-hide mb-3 text-5xl" />
                <p className="text-sm font-medium">Question is hidden</p>
                <button
                  onClick={handleToggleHide}
                  className="mt-4 cursor-pointer text-sm font-semibold text-orange-500 hover:underline"
                >
                  Show Question
                </button>
              </div>
            )}
          </div>
        </main>

        {/* ════ RIGHT PANEL (hidden on md, shown on lg+) ════ */}
        {rightPanelMode && (
          <aside className="hidden w-[260px] flex-shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:flex">
            {/* ─── Scientific Calculator ─── */}
            {rightPanelMode === "calculator" ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-calculator text-[16px] text-orange-500" />
                    <span className="outfit-700 text-[11px] tracking-wider text-gray-600 uppercase">
                      Calculator
                    </span>
                  </div>
                  <button
                    onClick={() => setRightPanelMode(null)}
                    className="cursor-pointer text-gray-300 hover:text-gray-500"
                  >
                    <i className="bx bx-x text-[16px]" />
                  </button>
                </div>

                {/* Display */}
                <div className="flex-shrink-0 bg-gray-50 px-4 py-3">
                  <p className="min-h-[16px] truncate text-right text-[11px] text-gray-400">
                    {calcJustEvaled
                      ? calcExpr || " "
                      : (calcExpr || "") + (calcDisplay || "") || " "}
                  </p>
                  <p className="truncate text-right text-[26px] font-bold text-gray-800">
                    {calcDisplay}
                  </p>
                </div>

                {/* DEG/RAD toggle */}
                <div className="flex flex-shrink-0 border-b border-gray-100">
                  {["DEG", "RAD"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCalcDeg(m === "DEG")}
                      className={`flex-1 cursor-pointer py-1.5 text-[10px] font-semibold transition-colors ${
                        (m === "DEG") === calcDeg
                          ? "bg-orange-500 text-white"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Buttons grid */}
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    const toRad = (v) => (calcDeg ? (v * Math.PI) / 180 : v);
                    const mexp = new Mexp();

                    // Use math-expression-evaluator library for accurate expression parsing
                    const evaluateExpression = (rawExpr) => {
                      const expr = rawExpr
                        .replace(/\s+/g, "")
                        .replace(/×/g, "*")
                        .replace(/÷/g, "/")
                        .replace(/−/g, "-");
                      if (!expr) return 0;
                      return mexp.eval(expr);
                    };

                    const handleCalc = (btn) => {
                      // Scientific functions map
                      const fns = {
                        sin: (v) => Math.sin(toRad(parseFloat(v))),
                        cos: (v) => Math.cos(toRad(parseFloat(v))),
                        tan: (v) => Math.tan(toRad(parseFloat(v))),
                        "sin⁻¹": (v) =>
                          calcDeg
                            ? (Math.asin(parseFloat(v)) * 180) / Math.PI
                            : Math.asin(parseFloat(v)),
                        "cos⁻¹": (v) =>
                          calcDeg
                            ? (Math.acos(parseFloat(v)) * 180) / Math.PI
                            : Math.acos(parseFloat(v)),
                        "tan⁻¹": (v) =>
                          calcDeg
                            ? (Math.atan(parseFloat(v)) * 180) / Math.PI
                            : Math.atan(parseFloat(v)),
                        log: (v) => Math.log10(parseFloat(v)),
                        ln: (v) => Math.log(parseFloat(v)),
                        "√": (v) => Math.sqrt(parseFloat(v)),
                        "x²": (v) => Math.pow(parseFloat(v), 2),
                        "x³": (v) => Math.pow(parseFloat(v), 3),
                        "1/x": (v) => 1 / parseFloat(v),
                        "e^x": (v) => Math.exp(parseFloat(v)),
                        "10^x": (v) => Math.pow(10, parseFloat(v)),
                        "|x|": (v) => Math.abs(parseFloat(v)),
                        "n!": (v) => {
                          const n = Math.floor(parseFloat(v));
                          if (!Number.isFinite(n) || n < 0) return NaN;
                          let r = 1;
                          for (let i = 2; i <= n; i += 1) r *= i;
                          return r;
                        },
                      };
                      if (btn === "AC") {
                        setCalcDisplay("0");
                        setCalcExpr("");
                        setCalcJustEvaled(false);
                        calcPendingFnRef.current = null;
                        return;
                      }
                      if (btn === "+/-") {
                        setCalcDisplay((d) =>
                          d.startsWith("-") ? d.slice(1) : "-" + d,
                        );
                        return;
                      }
                      if (btn === "%") {
                        setCalcDisplay((d) =>
                          String(parseFloat(d || "0") / 100),
                        );
                        return;
                      }
                      if (btn === "=" || btn === "Enter") {
                        // If a unary scientific function was pressed first (e.g. √, then number, then =)
                        if (
                          calcPendingFnRef.current &&
                          fns[calcPendingFnRef.current]
                        ) {
                          const key = calcPendingFnRef.current;
                          const val = fns[key](calcDisplay || "0");
                          const str = Number.isFinite(val)
                            ? String(+val.toFixed(10))
                            : "Error";
                          setCalcExpr(`${key}(${calcDisplay}) =`);
                          setCalcDisplay(str);
                          setCalcJustEvaled(true);
                          calcPendingFnRef.current = null;
                          return;
                        }
                        try {
                          const rawExpr = (
                            calcJustEvaled
                              ? calcDisplay
                              : calcExpr + calcDisplay
                          )
                            .replace(/÷/g, "/")
                            .replace(/×/g, "*")
                            .replace(/−/g, "-");
                          const result = evaluateExpression(rawExpr);
                          const str = Number.isFinite(result)
                            ? String(+result.toFixed(10))
                            : "Error";
                          setCalcExpr(rawExpr + " =");
                          setCalcDisplay(str);
                          setCalcJustEvaled(true);
                        } catch {
                          setCalcDisplay("Error");
                          setCalcJustEvaled(true);
                        }
                        return;
                      }
                      if (fns[btn]) {
                        // If pressed at the start, treat as prefix: √ → 9 → =
                        if (
                          calcExpr === "" &&
                          (calcDisplay === "0" || calcDisplay === "")
                        ) {
                          calcPendingFnRef.current = btn;
                          setCalcExpr(btn + "(");
                          setCalcDisplay("0");
                          setCalcJustEvaled(false);
                        } else {
                          const val = fns[btn](calcDisplay || "0");
                          const str = Number.isFinite(val)
                            ? String(+val.toFixed(10))
                            : "Error";
                          setCalcExpr(btn + "(" + calcDisplay + ") =");
                          setCalcDisplay(str);
                          setCalcJustEvaled(true);
                          calcPendingFnRef.current = null;
                        }
                        return;
                      }
                      if (btn === "π") {
                        setCalcDisplay((d) =>
                          calcJustEvaled
                            ? String(Math.PI)
                            : d + String(Math.PI),
                        );
                        setCalcJustEvaled(false);
                        return;
                      }
                      if (btn === "e") {
                        setCalcDisplay((d) =>
                          calcJustEvaled ? String(Math.E) : d + String(Math.E),
                        );
                        setCalcJustEvaled(false);
                        return;
                      }
                      if (btn === "⌫") {
                        // If we have a number on the display (not just "0"), delete from display.
                        // Otherwise, delete from the pending expression string.
                        setCalcDisplay((d) => {
                          if (!calcJustEvaled && (d === "0" || d === "")) {
                            setCalcExpr((p) => (p ? p.slice(0, -1) : ""));
                            if (!calcExpr || calcExpr.length <= 1) {
                              calcPendingFnRef.current = null;
                            }
                            return "0";
                          }
                          return d.length <= 1 ? "0" : d.slice(0, -1);
                        });
                        return;
                      }
                      // Operators / digits
                      const ops = ["+", "−", "×", "÷", "^", "(", ")"];
                      if (ops.includes(btn) || btn === ".") {
                        if (calcJustEvaled) {
                          setCalcExpr(calcDisplay + btn);
                          setCalcDisplay("0");
                          setCalcJustEvaled(false);
                          return;
                        }
                        if (btn === "." && calcDisplay.includes(".")) return;
                        if (ops.includes(btn)) {
                          setCalcExpr((p) => {
                            const base = p || "";
                            const current = calcDisplay;

                            // Clean handling for parentheses and negative sign:
                            // "(" after "+/-" on zero should give "-(", not "-0(".
                            if (btn === "(") {
                              if (current === "0" || current === "") {
                                return base + "(";
                              }
                              if (current === "-0") {
                                return base + "-(";
                              }
                            }
                            if (btn === ")") {
                              if (current === "0" || current === "") {
                                return base + ")";
                              }
                            }

                            return base + current + btn;
                          });
                          setCalcDisplay("0");
                          calcPendingFnRef.current = null;
                          return;
                        }
                        setCalcDisplay((d) => {
                          if (d === "0") return btn;
                          if (d === "-0") return "-" + btn;
                          return d + btn;
                        });
                        return;
                      }
                      // Digit
                      if (calcJustEvaled) {
                        setCalcDisplay(btn);
                        setCalcExpr("");
                        setCalcJustEvaled(false);
                        return;
                      }
                      setCalcDisplay((d) => {
                        if (d === "0") return btn;
                        if (d === "-0") return "-" + btn;
                        return d + btn;
                      });
                    };

                    const rows = [
                      ["sin", "cos", "tan", "(", ")"],
                      ["sin⁻¹", "cos⁻¹", "tan⁻¹", "log", "ln"],
                      ["x²", "x³", "√", "1/x", "⌫"],
                      ["e^x", "10^x", "|x|", "n!", "AC"],
                      ["π", "e", "%", "+/-", "÷"],
                      ["7", "8", "9", "×", "^"],
                      ["4", "5", "6", "−", "("],
                      ["1", "2", "3", "+", ")"],
                      ["0", ".", "=", "=", "="],
                    ];

                    const isOrange = (b) =>
                      ["+", "−", "×", "÷", "^", "="].includes(b);
                    const isRed = (b) => b === "AC";

                    return (
                      <div className="grid grid-cols-5 gap-px border-t border-gray-100 bg-gray-100">
                        {rows.flat().map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => handleCalc(btn)}
                            className={`flex cursor-pointer items-center justify-center py-3 text-[11px] font-semibold transition-colors ${
                              isOrange(btn)
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : isRed(btn)
                                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                                  : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                            }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* ─── Question list panel (All / Bookmarked) ─── */
              <div className="outfit-400 flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <i
                      className={`bx ${
                        rightPanelMode === "bookmarked"
                          ? "bxs-bookmark text-gray-500"
                          : "bx-list-ul text-gray-500"
                      } text-[16px]`}
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

                {/* Tab switcher */}
                <div className="flex border-b border-gray-100">
                  {["all", "bookmarked"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setRightPanelMode(mode)}
                      className={`outfit-500 flex-1 cursor-pointer py-2 text-[11px] transition-colors ${
                        rightPanelMode === mode
                          ? "border-b-2 border-orange-500 text-orange-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {mode === "all" ? "All" : "Bookmarked"}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="outfit-400 flex-1 overflow-y-auto px-2 py-2">
                  {(() => {
                    const list =
                      rightPanelMode === "bookmarked"
                        ? quizData.questions.filter((q) =>
                            flaggedQuestions.includes(q.personalQuizQuestionID),
                          )
                        : quizData.questions;

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
                      const idx = quizData.questions.indexOf(q);
                      const qid = q.personalQuizQuestionID;
                      const isAnswered = answers[qid] !== undefined;
                      const isCurr = idx === currentQuestionIndex;
                      const isBookmarked = flaggedQuestions.includes(qid);

                      return (
                        <button
                          key={qid}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`mb-1 flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                            isCurr
                              ? "bg-orange-50 ring-1 ring-orange-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`mt-[1px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                              isCurr
                                ? "bg-orange-500 text-white"
                                : isAnswered
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="line-clamp-2 flex-1 text-[11px] leading-snug text-gray-700">
                            {q.questionText.replace(/<[^>]*>/g, "") ||
                              `Question ${idx + 1}`}
                          </span>
                          {isBookmarked && (
                            <i className="bx bxs-bookmark -mt-[9px] flex-shrink-0 text-[14px] text-orange-400" />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
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

export default StudentQuiz;
