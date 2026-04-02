import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { getApiUrl } from "../utils/config";
import { localAiService, AVAILABLE_MODELS, DEFAULT_MODEL, isNativePlatform } from "../services/localAiService";
import {
  IoSend, IoStop, IoSettingsSharp, IoCheckmarkCircle, IoTrash, IoRefresh,
  IoCloudDone, IoPhonePortrait, IoDownload, IoAlertCircle,
  IoWifi, IoPhonePortraitOutline, IoChevronDown, IoInfinite
} from "react-icons/io5";

/**
 * Helper to split content into think and answer
 */
const parseThinkContent = (content) => {
  if (!content) return { think: null, answer: "" };
  // Qwen3 style: <|think|>...</|think|>
  const qwenThink = content.match(/<\|think\|>([\s\S]*?)<\|\/think\|>/);
  if (qwenThink) {
    const think = qwenThink[1].trim();
    const answer = content.replace(/<\|think\|>[\s\S]*?<\|\/think\|>/, "").trim();
    return { think, answer };
  }
  // DeepSeek style: <think>...</think>
  const dsThink = content.match(/<think>([\s\S]*?)<\/think>/);
  if (dsThink) {
    const think = dsThink[1].trim();
    const answer = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    return { think, answer };
  }
  // Partial think blocks (during streaming)
  if (content.includes("<|think|>") || content.includes("<think>")) {
    const openTag = content.includes("<|think|>") ? "<|think|>" : "<think>";
    const closeTag = openTag === "<|think|>" ? "<|/think|>" : "</think>";
    const parts = content.split(openTag);
    const afterThink = parts[1] || "";
    if (afterThink.includes(closeTag)) {
       const subParts = afterThink.split(closeTag);
       return { think: subParts[0].trim(), answer: subParts[1].trim() };
    }
    return { think: afterThink.trim(), answer: "" };
  }
  return { think: null, answer: content };
};

const parseMessageContent = (message) => {
  const parsed = parseThinkContent(message?.content || "");
  const explicitThinking =
    typeof message?.thinking === "string" && message.thinking.trim()
      ? message.thinking.trim()
      : null;

  return {
    think: parsed.think || explicitThinking,
    answer: parsed.answer,
  };
};

/**
 * ThoughtSection Component for Collapsible Reasoning
 */
const ThoughtSection = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content) return null;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <IoInfinite className="text-[10px]" />
          </div>
          <span>Reasoning Process</span>
        </div>
        <div className={`text-blue-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
          <IoChevronDown className="text-sm" />
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-blue-100 px-4 py-3 dark:border-blue-900/30">
          <div className="text-[11px] italic leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

const MODEL_SWITCH_WARNING =
  "Changing models in the middle of a conversation may degrade performance. Clear the conversation for the best performance?";
const WELCOME_MESSAGES = new Set([
  "Hello! I'm CAPS AI, your exam preparation assistant. How can I help you today?",
  "Hello! I'm CAPS AI, your friendly exam preparation assistant. How can I help you today?",
]);

/**
 * MarkdownRenderer Component
 */
const MarkdownRenderer = ({ content, isTyping = false }) => {
  const hasCompleteLatex = (text) => {
    const displayOpen = (text.match(/\\\[/g) || []).length;
    const displayClose = (text.match(/\\\]/g) || []).length;
    const inlineOpen = (text.match(/\\\(/g) || []).length;
    const inlineClose = (text.match(/\\\)/g) || []).length;
    const singleDollar = (text.match(/(?<!\$)\$(?!\$)/g) || []).length;
    const doubleDollar = (text.match(/\$\$/g) || []).length;

    return displayOpen === displayClose &&
      inlineOpen === inlineClose &&
      (singleDollar % 2 === 0) &&
      (doubleDollar % 2 === 0);
  };

  if (isTyping && !hasCompleteLatex(content)) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      className="markdown-content text-xs leading-relaxed sm:text-[13px]"
      components={{
        table: ({ node, ...props }) => (
          <div className="my-2 max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th className="bg-gray-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400 whitespace-nowrap" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-white/5" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="my-2 ml-4 list-disc space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="my-2 ml-4 list-decimal space-y-1" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

/**
 * AIChatPage Component with Cloud/Local Model Selection
 */
const AIChatPage = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("aiChatMessages");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.slice(-20) : [];
      }
    } catch (e) {
      console.error("Failed to parse saved messages:", e);
    }
    return [{ role: "assistant", content: "Hello! I'm CAPS AI, your friendly exam preparation assistant. How can I help you today?" }];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [typingMessage, setTypingMessage] = useState(null);
  const [displayedContent, setDisplayedContent] = useState("");
  const cloudCancelRef = useRef(null);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(true);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  // Connection State
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    if (!isNativePlatform()) {
      setIsWebGPUSupported(localAiService.isWebGPUSupported());
    }
  }, []);

  // Mode Selection: "cloud" or "local"
  const [activeMode, setActiveMode] = useState(() => {
    const saved = localStorage.getItem("aiActiveMode");
    return saved === "local" ? "local" : "cloud";
  });

  // Cloud Model Selection
  const [selectedCloudModel, setSelectedCloudModel] = useState(() => {
    const saved = localStorage.getItem("selectedCloudModel");
    const validModels = ["lfm2-350m", "qwen-3-0.6b", "llama-3.2-1b", "qwen-3-1.7b", "deepseek-r1-1.5b", "qwen-2.5-1.5b"];
    if (saved && validModels.includes(saved)) {
      return saved;
    }
    if (saved) localStorage.removeItem("selectedCloudModel");
    return "lfm2-350m";
  });

  // Local Model Selection & Management
  const [selectedLocalModel, setSelectedLocalModel] = useState(() =>
    localStorage.getItem("selectedLocalModel") || DEFAULT_MODEL
  );
  const [activeLocalModel, setActiveLocalModel] = useState(null);
  const [modelStatuses, setModelStatuses] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDownloading, setIsDownloading] = useState({});
  const [storageUsed, setStorageUsed] = useState(0);
  const [pendingModelChange, setPendingModelChange] = useState(null);

  const messagesEndRef = useRef(null);
  const apiUrl = getApiUrl();
  const hasConversationHistory = messages.some(
    (message) => message.role !== "assistant" || !WELCOME_MESSAGES.has(message.content)
  );

  // Cloud Models - No download needed!
  const CLOUD_MODELS = [
    { id: "lfm2-350m", name: "Light", description: "Fastest response", size: "230 MB" },
    { id: "qwen-3-0.6b", name: "Nano", description: "Highly efficient", size: "450 MB" },
    { id: "llama-3.2-1b", name: "Advanced", description: "Best balance", size: "750 MB" },
    { id: "qwen-3-1.7b", name: "Smart", description: "Highest quality", size: "1.1 GB" },
    { id: "deepseek-r1-1.5b", name: "Reasoning", description: "Complex logic", size: "1 GB", recommended: true },
    { id: "qwen-2.5-1.5b", name: "Pro", description: "Multilingual leader", size: "1 GB" },
  ];

  const refreshModelStatuses = useCallback(async () => {
    try {
      const statuses = await localAiService.checkAllModelsStatus();
      setModelStatuses(statuses);
      const storage = await localAiService.getStorageUsed();
      setStorageUsed(storage);
    } catch (e) {
      console.error("Failed to refresh model statuses:", e);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    refreshModelStatuses();

    const interval = setInterval(() => {
      if (isSettingsOpen) refreshModelStatuses();
    }, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isSettingsOpen, refreshModelStatuses]);

  useEffect(() => {
    localStorage.setItem("aiChatMessages", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedContent]);

  // Typing effect
  useEffect(() => {
    if (!typingMessage) return;

    let index = 0;
    const content = typingMessage.content;
    setDisplayedContent("");

    const typeChar = () => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
        const delay = Math.random() * 25 + 10;
        setTimeout(typeChar, delay);
      } else {
        setMessages((prev) => [...prev, typingMessage]);
        setTypingMessage(null);
        setDisplayedContent("");
      }
    };

    const timeoutId = setTimeout(typeChar, 100);
    return () => clearTimeout(timeoutId);
  }, [typingMessage]);

  const switchMode = (mode) => {
    if (mode === "local") {
      // Check if selected model is downloaded, if not try to find one that is
      const status = modelStatuses[selectedLocalModel];
      if (!status?.downloaded) {
        const firstDownloaded = Object.entries(modelStatuses).find(([_, s]) => s.downloaded);
        if (firstDownloaded) {
          setSelectedLocalModel(firstDownloaded[0]);
          localStorage.setItem("selectedLocalModel", firstDownloaded[0]);
        }
        // If no models downloaded, we'll show the download list - no alert needed
      }
    }
    setActiveMode(mode);
    localStorage.setItem("aiActiveMode", mode);
  };

  const handleCloudModelSelect = (modelId) => {
    if (selectedCloudModel === modelId) return;
    if (hasConversationHistory) {
      setPendingModelChange({ kind: "cloud", modelId, clearConversation: true });
      return;
    }
    setSelectedCloudModel(modelId);
    localStorage.setItem("selectedCloudModel", modelId);
    if (activeMode !== "cloud") {
      switchMode("cloud");
    }
  };

  const handleLocalModelSelect = async (modelId) => {
    const status = modelStatuses[modelId];
    if (!status?.downloaded) {
      return;
    }
    if (selectedLocalModel === modelId && activeLocalModel === modelId) {
      await localAiService.unload();
      setActiveLocalModel(null);
      return;
    }
    if (activeLocalModel) {
      await localAiService.unload();
      setActiveLocalModel(null);
    }
    if (hasConversationHistory) {
      setPendingModelChange({ kind: "local", modelId, clearConversation: true });
      return;
    }
    setSelectedLocalModel(modelId);
    localStorage.setItem("selectedLocalModel", modelId);
    if (activeMode !== "local") {
      switchMode("local");
    }
  };

  const handleLoadModel = async (modelId) => {
    const status = modelStatuses[modelId];
    if (!status?.downloaded) return;
    setActiveLocalModel(modelId);
    setIsModelLoading(true);
    try {
      await localAiService.initialize(modelId);
    } catch (e) {
      console.error("Failed to load model:", e);
      setActiveLocalModel(null);
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleDownload = async (modelId, resume = false) => {
    if (isDownloading[modelId]) return;

    setIsDownloading(prev => ({ ...prev, [modelId]: true }));
    setDownloadProgress(prev => ({ ...prev, [modelId]: resume ? (downloadProgress[modelId] || 0) : 0 }));

    try {
      await localAiService.downloadModel(
        modelId,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [modelId]: progress.percent }));
        },
        resume
      );

      await refreshModelStatuses();

      // Auto-select if this is the first downloaded model and we're in local mode
      const status = await localAiService.checkModelStatus(modelId);
      if (status.downloaded && activeMode !== "local") {
        // Optionally auto-switch to local mode
      }
    } catch (error) {
      console.error("Download failed", error);
      alert(`Download failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(prev => ({ ...prev, [modelId]: false }));
      const status = await localAiService.checkModelStatus(modelId);
      if (!status.downloaded) {
        setDownloadProgress(prev => ({ ...prev, [modelId]: status.percent }));
      }
    }
  };

  const handleDeleteModel = async (modelId) => {
    const model = AVAILABLE_MODELS[modelId];
    if (!window.confirm(`Delete ${model.name}? This will free up ${model.size}.`)) return;

    try {
      await localAiService.deleteModel(modelId);
      await refreshModelStatuses();

      if (modelId === selectedLocalModel) {
        const remaining = Object.entries(modelStatuses)
          .filter(([id, s]) => id !== modelId && s.downloaded)
          .map(([id]) => id);

        if (remaining.length > 0) {
          setSelectedLocalModel(remaining[0]);
          localStorage.setItem("selectedLocalModel", remaining[0]);
        } else {
          // No more downloaded models, switch to cloud
          setActiveMode("cloud");
          localStorage.setItem("aiActiveMode", "cloud");
        }
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete model.");
    }
  };

  const handleStop = async () => {
    if (activeMode === "local") {
      await localAiService.stop();
    } else {
      if (cloudCancelRef.current) {
        cloudCancelRef.current.cancel("User stopped generation");
        cloudCancelRef.current = null;
      }
    }
    setIsLoading(false);
    setTypingMessage(null);
    setDisplayedContent("");
    setIsModelLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || typingMessage) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const contextMessages = messages
      .filter((message) => !(message.role === "assistant" && WELCOME_MESSAGES.has(message.content)))
      .slice(activeMode === "local" ? -100 : -28);

    try {
      if (activeMode === "local") {
        // --- LOCAL MODE ---
        const status = modelStatuses[selectedLocalModel];
        if (!status?.downloaded) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Local model not available. Please download it first or switch to Cloud mode." }
          ]);
          setIsLoading(false);
          return;
        }

        let responseContent = "";
        let firstToken = true;

        // Show model-loading overlay if the model isn't already in memory
        const needsLoad = !localAiService.isInitialized || localAiService.currentModelId !== selectedLocalModel;
        if (needsLoad) setIsModelLoading(true);
        else setTypingMessage({ role: "assistant", content: "..." });

        await localAiService.generateResponse(
          selectedLocalModel,
          [
            { role: "system", content: "You are CAPS AI, a helpful exam preparation assistant." },
            ...contextMessages,
            userMessage
          ],
          (token, full) => {
            // First token means model finished loading — swap loading state to typing
            if (firstToken) {
              firstToken = false;
              setIsModelLoading(false);
              setTypingMessage({ role: "assistant", content: "" });
            }
            responseContent = full;
            setDisplayedContent(full);
          },
          { thinking: thinkingEnabled }
        );

        setIsModelLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", content: responseContent }]);
        setTypingMessage(null);
        setDisplayedContent("");
      } else {
        // --- CLOUD MODE ---
        if (!isOnline) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "You're offline. Please switch to Local mode or connect to the internet." }
          ]);
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const systemPrompt = {
          role: "system",
          content: "You are CAPS AI, a friendly exam preparation assistant for Joser Rizal Memorial State University(JRMSU) students."
        };

        cloudCancelRef.current = axios.CancelToken.source();
        const response = await axios.post(
          `${apiUrl}/api/ai/chat`,
          {
            messages: [systemPrompt, ...contextMessages, userMessage],
            model: selectedCloudModel,
            thinking: thinkingEnabled && (selectedCloudModel === "qwen-3-0.6b" || selectedCloudModel === "qwen-3-1.7b"),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 90000,
            cancelToken: cloudCancelRef.current.token,
          }
        );

        if (response.data && response.data.content) {
          const combinedContent = response.data.thinking
            ? `<think>${response.data.thinking}</think>\n${response.data.content}`
            : response.data.content;
          setTypingMessage({
            role: "assistant",
            content: combinedContent,
            thinking: response.data.thinking || null,
          });
        } else if (response.data && response.data.error) {
          throw new Error(response.data.error);
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Response stopped by user." }
        ]);
        return;
      }
      console.error("AI Chat Error:", error);
      let errorMsg = "Something went wrong";
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMsg = "Cannot connect to server. Please check your internet or if the AI service is running.";
        } else if (error.response.status === 503) {
          const detail = error.response.data?.error || "";
          errorMsg = detail.includes("loading") 
            ? "Model is still loading on the server. Please wait 10-20 seconds and try again."
            : "AI service is currently busy or unavailable. Please try again later.";
        } else if (error.response.status === 422) {
          errorMsg = "This model is not supported on the server yet. Please select a different cloud model.";
        } else if (error.response.data?.error) {
          errorMsg = error.response.data.error;
        }
      } else {
        errorMsg = error.message;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMsg}` }
      ]);
      setTypingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Clear the conversation?")) {
      const welcome = {
        role: "assistant",
        content: "Hello! I'm CAPS AI, your friendly exam preparation assistant. How can I help you today?"
      };
      setMessages([welcome]);
      setTypingMessage(null);
      setDisplayedContent("");
      localStorage.removeItem("aiChatMessages");
    }
  };

  const handleRegenerateResponse = async () => {
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserIdx;
    const history = messages.slice(0, actualIdx + 1);

      const filtered = history.filter(
        (message) => !(message.role === "assistant" && WELCOME_MESSAGES.has(message.content))
      );

    setMessages(history);
    setIsLoading(true);

    try {
      if (activeMode === "local") {
        // --- LOCAL REGENERATE ---
        const status = modelStatuses[selectedLocalModel];
        if (!status?.downloaded) {
          setMessages(prev => [...prev, { role: "assistant", content: "Local model not downloaded. Please download it or switch to Cloud mode." }]);
          setIsLoading(false);
          return;
        }

        const contextMessages = filtered.slice(-100);
        let responseContent = "";
        setTypingMessage({ role: "assistant", content: "..." });

        await localAiService.generateResponse(
          selectedLocalModel,
          [
            { role: "system", content: "You are CAPS AI, a helpful exam preparation assistant." },
            ...contextMessages,
          ],
          (token, full) => {
            responseContent = full;
            setDisplayedContent(full);
          }
        );

        setMessages(prev => [...prev, { role: "assistant", content: responseContent }]);
        setTypingMessage(null);
        setDisplayedContent("");

      } else {
        // --- CLOUD REGENERATE ---
        const token = localStorage.getItem("token");
        const systemPrompt = { role: "system", content: "You are CAPS AI, a friendly exam preparation assistant for JRMSU students." };
        const contextMessages = filtered.slice(-28);

        const response = await axios.post(
          `${apiUrl}/api/ai/chat`,
          { messages: [systemPrompt, ...contextMessages], model: selectedCloudModel },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 }
        );

        if (response.data?.content) {
          const combinedContent = response.data.thinking
            ? `<think>${response.data.thinking}</think>\n${response.data.content}`
            : response.data.content;
          setTypingMessage({
            role: "assistant",
            content: combinedContent,
            thinking: response.data.thinking || null,
          });
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't regenerate. Please try again." }]);
      setTypingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const applyModelChange = (change) => {
    if (!change) return;
    if (change.kind === "cloud") {
      setSelectedCloudModel(change.modelId);
      localStorage.setItem("selectedCloudModel", change.modelId);
      if (activeMode !== "cloud") {
        switchMode("cloud");
      }
    } else {
      setSelectedLocalModel(change.modelId);
      localStorage.setItem("selectedLocalModel", change.modelId);
      if (activeMode !== "local") {
        switchMode("local");
      }
    }
    if (change.clearConversation) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm CAPS AI, your friendly exam preparation assistant. How can I help you today?"
        }
      ]);
      setTypingMessage(null);
      setDisplayedContent("");
      localStorage.removeItem("aiChatMessages");
    }
    setPendingModelChange(null);
  };

  const isAtContextLimit = activeMode === "cloud" &&
    messages.filter((message) => !(message.role === "assistant" && WELCOME_MESSAGES.has(message.content))).length >= 28;
  const selectedStatus = modelStatuses[selectedLocalModel];
  const downloadedCount = Object.values(modelStatuses).filter(s => s.downloaded).length;
  const isResponding = isLoading || Boolean(typingMessage) || isModelLoading;
  const currentModelName = activeMode === "local"
    ? AVAILABLE_MODELS[selectedLocalModel]?.name
    : CLOUD_MODELS.find(m => m.id === selectedCloudModel)?.name;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] sm:h-[calc(100dvh-3.5rem)] w-full flex-col overflow-hidden bg-white dark:bg-black" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-[var(--color-bg-secondary)] sm:px-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-md sm:h-10 sm:w-10 sm:rounded-2xl">
            {activeMode === "local" ? <IoPhonePortrait size={22} /> : <IoCloudDone size={22} />}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">CAPS AI</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                {currentModelName}
              </p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${activeMode === "local"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                }`}>
                {activeMode === "local" ? "LOCAL" : "CLOUD"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all sm:h-9 sm:w-9 sm:rounded-xl ${isSettingsOpen ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"}`}
          >
            <IoSettingsSharp size={17} />
          </button>
          <button
            onClick={handleClearChat}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 sm:h-9 sm:w-9 sm:rounded-xl"
          >
            <IoTrash size={17} />
          </button>
        </div>
      </header>

      {/* Settings Panel — Full-Screen Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-[var(--color-bg)] animate-fade-in">
          {pendingModelChange && (
            <div className="absolute inset-0 z-[120] flex items-end justify-center bg-black/40 p-4 sm:items-center">
              <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-[var(--color-bg-secondary)]">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Switch model?</h4>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{MODEL_SWITCH_WARNING}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPendingModelChange(null)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-white/10 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => applyModelChange(pendingModelChange)}
                    className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white"
                  >
                    Switch and Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky header with safe-area top padding */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 pb-4 dark:border-white/10 dark:bg-[var(--color-bg-secondary)]"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.75rem)" }}
          >
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">AI Model Settings</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Choose cloud or on-device AI</p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">

            {/* Mode Selection Tabs */}
            <div className="mb-4 flex rounded-xl bg-gray-200 p-1 dark:bg-gray-800">
              <button
                onClick={() => {
                   setActiveMode("cloud");
                   localStorage.setItem("aiActiveMode", "cloud");
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeMode === "cloud"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                  }`}
              >
                <IoWifi size={18} /> Cloud
              </button>
              <button
                onClick={() => {
                   setActiveMode("local");
                   localStorage.setItem("aiActiveMode", "local");
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeMode === "local"
                    ? "bg-white text-green-600 shadow-sm dark:bg-gray-700 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                  }`}
              >
                <IoPhonePortraitOutline size={18} /> Local
                {downloadedCount > 0 && (
                  <span className="ml-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                    {downloadedCount}
                  </span>
                )}
              </button>
            </div>

            {/* CLOUD MODELS SECTION */}
            {activeMode === "cloud" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <IoWifi className="text-blue-600" size={20} />
                    <div>
                      <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Cloud AI Mode</h5>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400">
                        Runs on our servers - no download needed! Requires internet connection.
                      </p>
                    </div>
                  </div>
                </div>

                <h5 className="text-xs font-bold uppercase text-gray-400">Select Cloud Model</h5>
                <div className="space-y-3">
                  {CLOUD_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleCloudModelSelect(model.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${selectedCloudModel === model.id
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950/20"
                          : "border-gray-200 bg-white dark:border-white/10 dark:bg-[var(--color-bg-secondary)]"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{model.name}</span>
                            {selectedCloudModel === model.id && (
                              <IoCheckmarkCircle className="text-blue-500" size={16} />
                            )}
                            {model.recommended && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {model.size}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {!isOnline && (
                  <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-950/20">
                    <IoAlertCircle className="mx-auto mb-1 text-red-500" size={24} />
                    <p className="text-sm text-red-600 dark:text-red-400">You're offline</p>
                    <p className="text-[11px] text-red-500">Switch to Local mode to use AI without internet</p>
                  </div>
                )}
              </div>
            )}

            {/* LOCAL MODELS SECTION */}
            {activeMode === "local" && (
              <div className="space-y-4">
                {/* Storage Info */}
                <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IoPhonePortrait className="text-green-600" size={20} />
                      <div>
                        <h5 className="text-sm font-semibold text-green-800 dark:text-green-300">Local AI Mode</h5>
                        <p className="text-[11px] text-green-600 dark:text-green-400">
                          Runs on your device - works offline!
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-800 dark:text-green-300">
                      {localAiService.formatBytes(storageUsed)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-green-200 dark:bg-green-800">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (storageUsed / (3 * 1024 * 1024 * 1024)) * 100)}%` }}
                    />
                  </div>
                </div>

                <h5 className="text-xs font-bold uppercase text-gray-400">Downloaded Models</h5>

                {/* Web Mode Warning */}
                {!isNativePlatform() && (
                  <div className="rounded-xl bg-yellow-50 p-4 text-center dark:bg-yellow-950/20">
                    <IoAlertCircle className="mx-auto mb-2 text-yellow-600" size={24} />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                      Web Browser Mode
                    </p>
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400">
                      Local model download only works in the mobile app (APK). Please use Cloud mode or install the APK.
                    </p>
                  </div>
                )}

                {downloadedCount === 0 && isNativePlatform() && (
                  <div className="rounded-xl bg-yellow-50 p-4 text-center dark:bg-yellow-950/20">
                    <IoDownload className="mx-auto mb-2 text-yellow-600" size={28} />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">No local models yet</p>
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mb-3">
                      Download a model below to use AI offline
                    </p>
                  </div>
                )}

                {/* Available Local Models */}
                <div className="space-y-3">
                  {Object.entries(AVAILABLE_MODELS).map(([modelId, model]) => {
                    const status = modelStatuses[modelId] || { downloaded: false, partial: false, percent: 0 };
                    const isSelected = selectedLocalModel === modelId;
                    const isDownloadingModel = isDownloading[modelId];
                    const downloadPercent = downloadProgress[modelId] || 0;

                    return (
                      <div
                        key={modelId}
                        className={`rounded-xl border p-3 transition-all ${isSelected && status.downloaded
                            ? "border-green-500 bg-green-50 dark:bg-green-950/10"
                            : "border-gray-200 dark:border-white/10 bg-white dark:bg-[var(--color-bg-secondary)]"
                          } ${status.partial ? "border-dashed border-yellow-400 bg-yellow-50/50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 dark:text-white">{model.name}</span>
                              {status.downloaded && <IoCheckmarkCircle className="text-green-500" size={16} />}
                              {status.partial && !status.downloaded && (
                                <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">
                                  {status.percent}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800">{model.size}</span>
                        </div>

                        <div className="mt-3">
                          {!status.downloaded && !status.partial && !isDownloadingModel && (
                            <button
                              onClick={() => handleDownload(modelId)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2 text-xs font-bold text-white hover:bg-green-600"
                            >
                              <IoDownload size={16} /> Download ({model.size})
                            </button>
                          )}

                          {status.partial && !isDownloadingModel && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[11px] text-yellow-700">
                                <IoAlertCircle size={14} />
                                <span>Incomplete - tap to resume</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDownload(modelId, true)}
                                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-500 py-2 text-xs font-bold text-white hover:bg-yellow-600"
                                >
                                  <IoRefresh size={16} /> Resume
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(modelId)}
                                  className="flex items-center justify-center rounded-lg bg-red-100 px-3 text-red-600 hover:bg-red-200"
                                >
                                  <IoTrash size={16} />
                                </button>
                              </div>
                            </div>
                          )}

                          {isDownloadingModel && (
                            <div className="space-y-1">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${downloadPercent}%` }} />
                              </div>
                              <p className="text-center text-[10px] text-green-600 font-bold">{downloadPercent}% Downloaded</p>
                            </div>
                          )}

                          {status.downloaded && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLocalModelSelect(modelId)}
                                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${isSelected ? "bg-green-500 text-white" : "bg-green-100 text-green-600 hover:bg-green-200"
                                  }`}
                              >
                                {isSelected ? "✓ Selected" : "Select"}
                              </button>
                              {isSelected && (
                                <button
                                  onClick={() => activeLocalModel === modelId ? localAiService.unload().then(() => setActiveLocalModel(null)) : handleLoadModel(modelId)}
                                  disabled={isModelLoading}
                                  className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors overflow-hidden ${
                                    activeLocalModel === modelId
                                      ? "bg-blue-500 text-white"
                                      : isModelLoading
                                      ? "bg-blue-200 text-blue-600"
                                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                  }`}
                                >
                                  {isModelLoading && activeLocalModel === modelId ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                      Loading...
                                    </span>
                                  ) : activeLocalModel === modelId ? (
                                    "✓ Loaded"
                                  ) : (
                                    "Load"
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteModel(modelId)}
                                className="flex items-center justify-center rounded-lg bg-red-100 px-4 text-red-600 hover:bg-red-200"
                              >
                                <IoTrash size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Long Conversation Warning Banner */}
      {isAtContextLimit && (
        <div className="flex items-center justify-between gap-3 border-b border-sky-200 bg-sky-50 px-4 py-2.5 dark:border-sky-800/30 dark:bg-sky-950/20">
          <div className="flex items-center gap-2">
            <IoAlertCircle className="shrink-0 text-sky-500" size={16} />
            <p className="text-xs text-sky-800 dark:text-sky-300">
              <span className="font-semibold">Long conversation detected.</span>{" "}
              The AI may produce less accurate or inconsistent responses. Consider resetting the chat history for better results.
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-sky-600 active:scale-95"
          >
            Reset History
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-[var(--color-bg-secondary)]">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 p-3 sm:space-y-3 sm:p-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[90%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7 ${msg.role === "user" ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-600 dark:bg-[var(--color-bg-tertiary)] dark:text-gray-300"
                  }`}>
                  <i className={`bx ${msg.role === "user" ? "bx-user" : "bx-bot"} text-xs sm:text-sm`}></i>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed sm:text-[13px] max-w-[calc(100%-2rem)] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${msg.role === "user"
                    ? "bg-[var(--color-primary)] text-white rounded-tr-none"
                    : "bg-white text-gray-800 dark:bg-[var(--color-bg-tertiary)] dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-white/5"
                  }`}>
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <>
                        {(() => {
                          const { think, answer } = parseThinkContent(msg.content);
                          return (
                            <>
                              <ThoughtSection content={think} />
                              <MarkdownRenderer content={answer} isTyping={false} />
                            </>
                          );
                        })()}
                      </>
                    )}
                </div>
              </div>
            </div>
          ))}

          {/* Model loading animation — shown while native model is being loaded into RAM */}
          {isModelLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[90%] gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-[var(--color-bg-tertiary)] dark:text-gray-300 sm:h-7 sm:w-7">
                  <i className="bx bx-chip text-xs sm:text-sm"></i>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white px-3 py-2.5 dark:bg-[var(--color-bg-tertiary)] border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    {/* Spinning ring */}
                    <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-[var(--color-primary)] animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">Loading model into memory…</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">This may take a few seconds on first use</p>
                    </div>
                  </div>
                  {/* Three bouncing dots */}
                  <div className="mt-2 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(typingMessage || displayedContent) && !isModelLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[90%] gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-[var(--color-bg-tertiary)] dark:text-gray-300 sm:h-7 sm:w-7">
                  <i className="bx bx-bot text-xs sm:text-sm"></i>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white px-3 py-2 text-xs dark:bg-[var(--color-bg-tertiary)] dark:text-gray-200 sm:text-[13px] border border-gray-100 dark:border-white/5">
                  {(() => {
                    const { think, answer } = parseMessageContent({
                      content: displayedContent,
                      thinking: typingMessage?.thinking,
                    });
                    return (
                      <>
                        <ThoughtSection content={think} />
                        {answer || !think ? (
                           <>
                             <MarkdownRenderer content={answer || displayedContent} isTyping={true} />
                             <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[var(--color-primary)] sm:h-4"></span>
                           </>
                        ) : (
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 py-1">
                            <div className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                            <div className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                            <div className="h-1 w-1 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                            <span>Thinking...</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {isLoading && !typingMessage && !displayedContent && (
            <div className="flex justify-start">
              <div className="flex max-w-[90%] gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-[var(--color-bg-tertiary)] dark:text-gray-300 sm:h-7 sm:w-7">
                  <i className="bx bx-bot text-xs sm:text-sm"></i>
                </div>
                <div className="bg-white dark:bg-[var(--color-bg-tertiary)] rounded-2xl rounded-tl-none px-3 py-2 max-w-[calc(100%-2rem)]">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {activeMode === "cloud" && !isOnline && (
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 p-2 text-[10px] text-red-600 font-bold dark:bg-red-950/20 mx-3 sm:mx-4">
              <IoAlertCircle size={14} />
              Offline. Switch to Local mode to use AI without internet.
            </div>
          )}

          {activeMode === "local" && !isNativePlatform() && !isWebGPUSupported && (
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 p-2 text-[10px] text-amber-600 font-bold dark:bg-amber-950/20 mx-3 sm:mx-4">
              <IoAlertCircle size={14} />
              WebGPU not supported. Local AI requires Chrome 113+ or Edge 113+. Switch to Cloud mode.
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[var(--color-bg-secondary)] sm:p-4">
          <form onSubmit={handleSendMessage}>
            <div className="relative flex items-center rounded-xl border border-gray-200 bg-gray-50 transition-all focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] dark:border-white/10 dark:bg-[var(--color-bg-tertiary)] sm:rounded-2xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeMode === "cloud" && !isOnline
                    ? "Offline - Switch to Local mode"
                    : isResponding
                      ? "AI is typing..."
                      : `Message ${currentModelName}...`
                }
                disabled={isResponding || (activeMode === "cloud" && !isOnline)}
                className="w-full rounded-xl bg-transparent px-3 py-2.5 pr-10 text-xs text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60 dark:text-white sm:rounded-2xl sm:px-3.5 sm:py-3 sm:pr-11 sm:text-[13px]"
              />
              <button
                type={isResponding ? "button" : "submit"}
                onClick={isResponding ? handleStop : undefined}
                disabled={!isResponding && (!input.trim() || (activeMode === "cloud" && !isOnline))}
                className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all sm:right-1.5 sm:h-8 sm:w-8 sm:rounded-xl ${
                  isResponding
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {isResponding ? (
                  <IoStop size={14} className="sm:hidden" />
                ) : (
                  <IoSend size={14} className="sm:hidden" />
                )}
                {isResponding ? (
                  <IoStop size={15} className="hidden sm:block" />
                ) : (
                  <IoSend size={15} className="hidden sm:block" />
                )}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 sm:text-[10px]">
                {activeMode === "local"
                  ? "Local mode: AI runs on your device"
                  : "Cloud mode: AI runs on our servers"}
              </p>
              <div className="flex items-center gap-2">
                {(selectedCloudModel === "qwen-3-0.6b" || selectedCloudModel === "qwen-3-1.7b" || selectedLocalModel === "qwen-3-0.6b" || selectedLocalModel === "qwen-3-1.7b") && (
                  <button
                    type="button"
                    onClick={() => setThinkingEnabled((prev) => !prev)}
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-medium transition-all sm:text-[10px] ${
                      thinkingEnabled
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {thinkingEnabled ? "🧠 Thinking" : "💭 No Thinking"}
                  </button>
                )}
                {!isLoading && !typingMessage && messages.length > 1 && messages[messages.length - 1].role === "assistant" && (
                  <button onClick={handleRegenerateResponse} className="flex items-center gap-1 text-[9px] font-medium text-[var(--color-primary)] hover:underline">
                    <IoRefresh size={10} /> Regenerate
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
