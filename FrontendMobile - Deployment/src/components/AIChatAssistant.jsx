import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "../utils/config";
import { localAiService, AVAILABLE_MODELS, DEFAULT_MODEL, isNativePlatform } from "../services/localAiService";
import { 
  IoSend, IoClose, IoChatbubbleEllipses, IoSettingsSharp, 
  IoCheckmarkCircle, IoCloudDone, IoPhonePortrait, IoDownload, IoAlertCircle,
  IoPlay, IoPause, IoTrash, IoRefresh, IoWifi, IoPhonePortraitOutline
} from "react-icons/io5";

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm CAPS AI, your exam preparation assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Connection & Mode State
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [useLocalMode, setUseLocalMode] = useState(() => localStorage.getItem("useLocalMode") === "true");
  
  // Model Selection State
  const [selectedCloudModel, setSelectedCloudModel] = useState(() => {
    const saved = localStorage.getItem("selectedCloudModel");
    // Validate saved value is still valid (in case of old cached values)
    const validModels = ["lfm2-350m", "tinyllama-1.1b", "llama-3.2-1b", "qwen-2.5-1.5b", "deepseek-r1-1.5b"];
    if (saved && validModels.includes(saved)) {
      return saved;
    }
    // Clear invalid cached value
    if (saved) localStorage.removeItem("selectedCloudModel");
    return "lfm2-350m";
  });
  const [selectedLocalModel, setSelectedLocalModel] = useState(() => localStorage.getItem("selectedLocalModel") || DEFAULT_MODEL);
  
  // Local Model Management State
  const [modelStatuses, setModelStatuses] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDownloading, setIsDownloading] = useState({});
  const [storageUsed, setStorageUsed] = useState(0);

  const messagesEndRef = useRef(null);
  const apiUrl = getApiUrl();

  // Available cloud models (backend-powered, no download needed) - Same 5 models as local
  const CLOUD_MODELS = [
    { id: "lfm2-350m", name: "LFM2-350M", description: "Fastest - Works on all phones (4GB+ RAM)", size: "~230MB", speed: "50+ tok/s", recommended: true },
    { id: "tinyllama-1.1b", name: "TinyLlama 1.1B", description: "Ultra-lightweight - Trained on 3T tokens", size: "~700MB", speed: "28-35 tok/s" },
    { id: "llama-3.2-1b", name: "Llama 3.2 1B", description: "Meta's latest - Best 1B model", size: "~750MB", speed: "25-30 tok/s" },
    { id: "qwen-2.5-1.5b", name: "Qwen 2.5 1.5B", description: "Best multilingual - Great for Filipino students", size: "~1GB", speed: "15-25 tok/s" },
    { id: "deepseek-r1-1.5b", name: "DeepSeek-R1 1.5B", description: "Reasoning model - Shows step-by-step thinking", size: "~1.1GB", speed: "15-22 tok/s" },
  ];

  // Refresh local model statuses
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

  // Detect connection and check model statuses
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!window.confirm(`Delete ${model.name}? This will free up ${model.size} of storage.`)) {
      return;
    }

    try {
      await localAiService.deleteModel(modelId);
      await refreshModelStatuses();
      
      if (modelId === selectedLocalModel) {
        const remaining = Object.entries(modelStatuses)
          .filter(([id, s]) => id !== modelId && s.downloaded)
          .map(([id]) => id);
        
        const newModelId = remaining.length > 0 ? remaining[0] : DEFAULT_MODEL;
        setSelectedLocalModel(newModelId);
        localStorage.setItem("selectedLocalModel", newModelId);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete model.");
    }
  };

  const handleCloudModelSelect = (modelId) => {
    setSelectedCloudModel(modelId);
    localStorage.setItem("selectedCloudModel", modelId);
    // Switch to cloud mode
    setUseLocalMode(false);
    localStorage.setItem("useLocalMode", "false");
  };

  const handleLocalModelSelect = (modelId) => {
    const status = modelStatuses[modelId];
    if (!status?.downloaded) {
      // Model not downloaded - don't select, the UI shows Download button
      return;
    }
    setSelectedLocalModel(modelId);
    localStorage.setItem("selectedLocalModel", modelId);
    // Switch to local mode
    setUseLocalMode(true);
    localStorage.setItem("useLocalMode", "true");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const welcomeText = "Hello! I'm CAPS AI, your exam preparation assistant. How can I help you today?";
    const contextMessages = messages
      .filter(m => m.content !== welcomeText)
      .slice(-20);

    // Determine if we should use local or cloud
    const selectedStatus = modelStatuses[selectedLocalModel];
    const canUseLocal = selectedStatus?.downloaded;
    const shouldUseLocal = useLocalMode && canUseLocal;
    const actuallyOffline = !isOnline;

    try {
      if (shouldUseLocal || (actuallyOffline && canUseLocal)) {
        // --- LOCAL INFERENCE ---
        let responseContent = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);
        
        await localAiService.generateResponse(
          selectedLocalModel,
          [
            { role: "system", content: "You are CAPS AI, a helpful exam preparation assistant. Use markdown for tables and mathematical notations where appropriate." },
            ...contextMessages,
            userMessage
          ],
          (token, full) => {
            responseContent = full;
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = full;
              return newMsgs;
            });
          }
        );
      } else {
        // --- CLOUD API ---
        if (!isOnline) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "You're offline. Please download a local model in settings to use AI without internet." }
          ]);
          setIsLoading(false);
          return;
        }

        try {
          const token = localStorage.getItem("token");
          
          const systemPrompt = { 
            role: "system", 
            content: "You are CAPS AI, a friendly and concise exam preparation assistant for Filipino students. Respond naturally and avoid overly formal phrases." 
          };

          const response = await axios.post(
            `${apiUrl}/api/ai/chat`,
            { 
              messages: [systemPrompt, ...contextMessages, userMessage],
              model: selectedCloudModel 
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 60000
            }
          );

          if (response.data && response.data.content) {
            setMessages((prev) => [...prev, { role: "assistant", content: response.data.content }]);
          } else {
            throw new Error("Invalid response from AI service");
          }
        } catch (error) {
          console.error("AI Chat Error:", error);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I'm having trouble connecting to the service right now. Please try again later." }
          ]);
        }
      }
    } catch (error) {
      console.error("Local AI Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStatus = modelStatuses[selectedLocalModel];
  const downloadedCount = Object.values(modelStatuses).filter(s => s.downloaded).length;
  
  // Current mode display
  const currentMode = useLocalMode && selectedStatus?.downloaded ? "local" : "cloud";
  const currentModelName = currentMode === "local" 
    ? AVAILABLE_MODELS[selectedLocalModel]?.name 
    : CLOUD_MODELS.find(m => m.id === selectedCloudModel)?.name;

  return (
    <div className="fixed bottom-20 right-6 z-[9999] sm:bottom-6">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <IoChatbubbleEllipses size={30} />
          {!isOnline && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-white">
              OFF
            </span>
          )}
          {currentMode === "local" && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold ring-2 ring-white">
              <IoPhonePortrait size={12} />
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-orange-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-500">
                {currentMode === "local" ? <IoPhonePortrait size={24} /> : <IoCloudDone size={24} />}
              </div>
              <div>
                <h3 className="font-bold">CAPS AI</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-wider">
                  {currentMode === "local" ? `${currentModelName} (Local)` : `${currentModelName} (Cloud)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                className={`rounded-full p-2 transition-colors ${isSettingsOpen ? "bg-white/30" : "hover:bg-white/20"}`}
              >
                <IoSettingsSharp size={20} />
              </button>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20">
                <IoClose size={24} />
              </button>
            </div>
          </div>

          {/* Settings Overlay */}
          {isSettingsOpen && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white p-4 animate-fade-in dark:bg-gray-900 overflow-y-auto">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <h4 className="font-bold text-gray-800 dark:text-white">AI Model Settings</h4>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500">
                  <IoClose size={24} />
                </button>
              </div>

              {/* Mode Selection Tabs */}
              <div className="mb-4 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setUseLocalMode(false);
                    localStorage.setItem("useLocalMode", "false");
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                    !useLocalMode 
                      ? "bg-white text-orange-600 shadow-sm dark:bg-gray-700 dark:text-orange-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <IoWifi size={16} /> Cloud
                </button>
                <button
                  onClick={() => {
                    setUseLocalMode(true);
                    localStorage.setItem("useLocalMode", "true");
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                    useLocalMode 
                      ? "bg-white text-orange-600 shadow-sm dark:bg-gray-700 dark:text-orange-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <IoPhonePortraitOutline size={16} /> Local
                  {downloadedCount > 0 && (
                    <span className="ml-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                      {downloadedCount}
                    </span>
                  )}
                </button>
              </div>

              {/* CLOUD MODELS SECTION */}
              {!useLocalMode && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2">
                      <IoWifi className="text-blue-600" size={20} />
                      <div>
                        <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Cloud AI Mode</h5>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">
                          Select any model - runs on our servers instantly!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="text-xs font-bold uppercase text-gray-400">Available Cloud Models</h5>
                  <div className="space-y-3">
                    {CLOUD_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleCloudModelSelect(model.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          selectedCloudModel === model.id
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950/20"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 dark:text-white">{model.name}</span>
                              {selectedCloudModel === model.id && (
                                <IoCheckmarkCircle className="text-blue-500" size={16} />
                              )}
                              {model.recommended && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{model.description}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {model.size}
                          </span>
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {model.speed}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {!isOnline && (
                    <div className="rounded-xl bg-red-50 p-3 text-center text-xs text-red-600 dark:bg-red-950/20">
                      <IoAlertCircle className="mx-auto mb-1" size={20} />
                      You're offline. Switch to Local mode or connect to internet.
                    </div>
                  )}
                </div>
              )}

              {/* LOCAL MODELS SECTION */}
              {useLocalMode && (
                <div className="space-y-3">
                  {/* Storage Info */}
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Storage Used</span>
                      <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                        {localAiService.formatBytes(storageUsed)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300" 
                        style={{ width: `${Math.min(100, (storageUsed / (3 * 1024 * 1024 * 1024)) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
                      Local models run entirely on your device - works offline!
                    </p>
                  </div>

                  {/* Web Mode Warning */}
                  {!isNativePlatform() && (
                    <div className="rounded-xl bg-yellow-50 p-3 text-center dark:bg-yellow-950/20">
                      <IoAlertCircle className="mx-auto mb-1 text-yellow-600" size={20} />
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                        Web Browser Mode
                      </p>
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
                        Local model download only works in the mobile app (APK). Please use Cloud mode or install the APK.
                      </p>
                    </div>
                  )}

                  <h5 className="text-xs font-bold uppercase text-gray-400">Available Local Models</h5>
                  <div className="space-y-3">
                    {Object.entries(AVAILABLE_MODELS).map(([modelId, model]) => {
                      const status = modelStatuses[modelId] || { downloaded: false, partial: false, percent: 0 };
                      const isSelected = selectedLocalModel === modelId;
                      const isDownloadingModel = isDownloading[modelId];
                      const downloadPercent = downloadProgress[modelId] || 0;

                      return (
                        <div 
                          key={modelId}
                          className={`rounded-xl border p-3 transition-all ${
                            isSelected && status.downloaded
                              ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/20" 
                              : "border-gray-200 dark:border-gray-700"
                          } ${status.partial ? "border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/10" : ""}`}
                        >
                          {/* Model Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-white">{model.name}</span>
                                {status.downloaded && (
                                  <IoCheckmarkCircle className="text-green-500" size={16} />
                                )}
                                {status.partial && !status.downloaded && (
                                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                    {status.percent}%
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500">{model.description}</p>
                            </div>
                          </div>

                          {/* Model Meta */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {model.size}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {model.ram}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {model.speed}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="mt-3">
                            {/* Not downloaded - Show Download button */}
                            {!status.downloaded && !status.partial && !isDownloadingModel && (
                              <button 
                                onClick={() => handleDownload(modelId)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                              >
                                <IoDownload size={16} /> Download ({model.size})
                              </button>
                            )}

                            {/* Partial download - Show Resume */}
                            {status.partial && !isDownloadingModel && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[11px] text-yellow-700 dark:text-yellow-400">
                                  <IoAlertCircle size={14} />
                                  <span>Incomplete download - tap to resume</span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleDownload(modelId, true)}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-500 py-2 text-sm font-bold text-white transition-colors hover:bg-yellow-600"
                                  >
                                    <IoRefresh size={16} /> Resume
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteModel(modelId)}
                                    className="flex items-center justify-center rounded-lg bg-red-100 px-3 text-red-600 transition-colors hover:bg-red-200"
                                  >
                                    <IoTrash size={16} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Downloading */}
                            {isDownloadingModel && (
                              <div className="space-y-1">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div 
                                    className="h-full bg-orange-500 transition-all duration-300" 
                                    style={{ width: `${downloadPercent}%` }}
                                  />
                                </div>
                                <p className="text-center text-[10px] text-orange-500 font-bold">
                                  {downloadPercent}% Downloaded
                                </p>
                              </div>
                            )}

                            {/* Downloaded - Show Select and Delete */}
                            {status.downloaded && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleLocalModelSelect(modelId)}
                                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                                    isSelected
                                      ? "bg-green-500 text-white"
                                      : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  }`}
                                >
                                  {isSelected ? "✓ Selected" : "Select"}
                                </button>
                                <button 
                                  onClick={() => handleDeleteModel(modelId)}
                                  className="flex items-center justify-center rounded-lg bg-red-100 px-4 text-red-600 transition-colors hover:bg-red-200"
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
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-orange-500 text-white rounded-tr-none"
                      : "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && currentMode === "cloud" && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 border border-gray-100 dark:border-gray-700">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Connection Status Warning */}
          {!isOnline && currentMode === "cloud" && (
            <div className="bg-red-50 p-2 text-center text-[10px] text-red-600 font-bold dark:bg-red-950/20">
              <IoAlertCircle className="inline mr-1" size={14} />
              Offline. Switch to Local mode to use AI without internet.
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-100 p-4 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={(!isOnline && currentMode === "cloud") ? "Offline - Switch to Local mode" : "Ask me anything..."}
                className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2 pr-12 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                disabled={isLoading || (!isOnline && currentMode === "cloud")}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || (!isOnline && currentMode === "cloud")}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:bg-gray-300"
              >
                <IoSend size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatAssistant;
