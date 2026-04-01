import { CapgoLLM } from "@capgo/capacitor-llm";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { CapacitorHttp, Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";

/**
 * Check if running in Capacitor native app (iOS/Android)
 * @returns {boolean} True if running natively
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running in web browser
 * @returns {boolean} True if running in browser
 */
export const isWeb = () => {
  return !Capacitor.isNativePlatform();
};

// ============================================================
// AVAILABLE MODELS CONFIGURATION
// ============================================================
export const AVAILABLE_MODELS = {
  "lfm2-350m": {
    id: "lfm2-350m",
    name: "LFM2-350M",
    filename: "LFM2-350M-Q4_K_M.gguf",
    description: "Fastest - Works on all phones (4GB+ RAM)",
    size: "~230MB",
    sizeBytes: 241000000,
    ram: "~1GB",
    speed: "50+ tok/s",
    url: "https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q4_K_M.gguf",
    recommendedFor: "All phones, fastest responses",
    contextSize: 2048,
    threads: 4,
  },
  "tinyllama-1.1b": {
    id: "tinyllama-1.1b",
    name: "TinyLlama 1.1B",
    filename: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    description: "Ultra-lightweight - Trained on 3T tokens",
    size: "~700MB",
    sizeBytes: 734000000,
    ram: "~1GB",
    speed: "28-35 tok/s",
    url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    recommendedFor: "4GB RAM phones, quick chat",
    contextSize: 2048,
    threads: 4,
  },
  "llama-3.2-1b": {
    id: "llama-3.2-1b",
    name: "Llama 3.2 1B",
    filename: "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    description: "Meta's latest - Best 1B model",
    size: "~750MB",
    sizeBytes: 786000000,
    ram: "~1.5GB",
    speed: "25-30 tok/s",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    recommendedFor: "6GB RAM phones, balanced quality",
    contextSize: 2048,
    threads: 4,
  },
  "qwen-2.5-1.5b": {
    id: "qwen-2.5-1.5b",
    name: "Qwen 2.5 1.5B",
    filename: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    description: "Best multilingual - Great for Filipino students",
    size: "~1GB",
    sizeBytes: 1044000000,
    ram: "~2GB",
    speed: "15-25 tok/s",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    recommendedFor: "8GB+ RAM, multilingual, best quality",
    contextSize: 2048,
    threads: 4,
  },
  "deepseek-r1-1.5b": {
    id: "deepseek-r1-1.5b",
    name: "DeepSeek-R1 1.5B",
    filename: "DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    description: "Reasoning model - Shows step-by-step thinking",
    size: "~1.1GB",
    sizeBytes: 1120000000,
    ram: "~2GB",
    speed: "15-22 tok/s",
    url: "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    recommendedFor: "8GB+ RAM, reasoning tasks, math/coding",
    contextSize: 2048,
    threads: 4,
  },
};

// Default model
export const DEFAULT_MODEL = "lfm2-350m";

/**
 * LocalAiService - Handles on-device AI model management and inference.
 * Uses Capacitor plugins to store files and run the LLM engine natively on the phone.
 */
class LocalAiService {
  constructor() {
    this.isInitialized = false;
    this.currentModelId = null;
    this.abortControllers = new Map(); // Track downloads for cancellation
  }

  /**
   * Get the partial download filename
   */
  getPartialFilename(filename) {
    return `${filename}.partial`;
  }

  /**
   * Check the download status of a model
   * Returns: { downloaded: boolean, partial: boolean, downloadedBytes: number, totalBytes: number, percent: number }
   */
  async checkModelStatus(modelId) {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const totalBytes = model.sizeBytes || 0;

    try {
      // Check if fully downloaded
      const stat = await Filesystem.stat({
        path: model.filename,
        directory: Directory.Data,
      });

      const downloadedBytes = stat.size || 0;
      // Allow 5% tolerance for size mismatch
      const minExpected = totalBytes * 0.95;

      if (downloadedBytes >= minExpected) {
        return {
          downloaded: true,
          partial: false,
          downloadedBytes,
          totalBytes: totalBytes || downloadedBytes,
          percent: 100,
        };
      } else {
        // File exists but is incomplete
        return {
          downloaded: false,
          partial: true,
          downloadedBytes,
          totalBytes,
          percent: totalBytes ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 50,
        };
      }
    } catch (e) {
      // File doesn't exist, check for partial
      try {
        const partialStat = await Filesystem.stat({
          path: this.getPartialFilename(model.filename),
          directory: Directory.Data,
        });
        const downloadedBytes = partialStat.size || 0;
        return {
          downloaded: false,
          partial: true,
          downloadedBytes,
          totalBytes,
          percent: totalBytes ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 50,
        };
      } catch (e2) {
        // No file at all
        return {
          downloaded: false,
          partial: false,
          downloadedBytes: 0,
          totalBytes,
          percent: 0,
        };
      }
    }
  }

  /**
   * Check all models status
   */
  async checkAllModelsStatus() {
    const status = {};
    for (const modelId of Object.keys(AVAILABLE_MODELS)) {
      status[modelId] = await this.checkModelStatus(modelId);
    }
    return status;
  }

  /**
   * Get total storage used by models
   */
  async getStorageUsed() {
    let total = 0;
    const status = await this.checkAllModelsStatus();
    for (const s of Object.values(status)) {
      total += s.downloadedBytes;
    }
    return total;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 MB";
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  }

  /**
   * downloadModel - Downloads a model file with resume support
   * @param {string} modelId - The model ID to download
   * @param {Function} onProgress - Callback for download percentage updates
   * @param {boolean} resume - Whether to resume a partial download
   * @returns {Promise<boolean>} Success status
   */
  async downloadModel(modelId, onProgress, resume = false) {
    // Check if running natively
    if (!isNativePlatform()) {
      throw new Error("Local model download is only available in the mobile app (APK). Please use Cloud mode for web browser.");
    }

    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const partialFilename = this.getPartialFilename(model.filename);
    const abortKey = `download_${modelId}`;

    try {
      // Get the URI for the partial file
      let resumeBytes = 0;
      
      if (resume) {
        try {
          const stat = await Filesystem.stat({
            path: partialFilename,
            directory: Directory.Data,
          });
          resumeBytes = stat.size || 0;
        } catch (e) {
          // No partial file to resume from
          resume = false;
        }
      }

      // Check if already fully downloaded
      const status = await this.checkModelStatus(modelId);
      if (status.downloaded) {
        if (onProgress) onProgress({ received: status.totalBytes, total: status.totalBytes, percent: 100 });
        return true;
      }

      // If not resuming, delete any existing partial file
      if (!resume) {
        try {
          await Filesystem.deleteFile({
            path: partialFilename,
            directory: Directory.Data,
          });
        } catch (e) {
          // File might not exist, that's ok
        }
      }

      // Setup download with optional resume
      const headers = {};
      if (resume && resumeBytes > 0) {
        headers["Range"] = `bytes=${resumeBytes}-`;
      }

      // Create abort controller for this download
      this.abortControllers.set(abortKey, new AbortController());

      // Use native FileTransfer for downloading (CapacitorHttp.downloadFile is not implemented in Android)
      await FileTransfer.downloadFile({
        url: model.url,
        path: partialFilename,
        directory: Directory.Data,
        method: "GET",
        headers,
        onProgress: (progress) => {
          if (onProgress) {
            // FileTransfer progress object has loaded and total properties
            const totalReceived = (progress.loaded || 0) + resumeBytes;
            const total = progress.total ? progress.total + resumeBytes : model.sizeBytes;
            const percent = total > 0 ? Math.round((totalReceived / total) * 100) : 0;
            onProgress({ received: totalReceived, total, percent });
          }
        },
      });

      // Download complete, rename partial to final
      await Filesystem.rename({
        from: partialFilename,
        to: model.filename,
        directory: Directory.Data,
      });

      this.abortControllers.delete(abortKey);
      return true;
    } catch (error) {
      this.abortControllers.delete(abortKey);
      console.error(`Model Download Error for ${modelId}:`, error);
      
      // If error is due to network/cancellation, don't delete partial file
      // so user can resume later
      if (error.message?.includes("cancel") || error.message?.includes("abort")) {
        console.log("Download was cancelled, partial file kept for resume");
      }
      
      throw error;
    }
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(modelId) {
    const abortKey = `download_${modelId}`;
    const controller = this.abortControllers.get(abortKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(abortKey);
    }
  }

  /**
   * deleteModel - Deletes a model file to free up device storage space
   * @param {string} modelId - The model ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteModel(modelId) {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    try {
      // Delete main file
      try {
        await Filesystem.deleteFile({
          path: model.filename,
          directory: Directory.Data,
        });
      } catch (e) {
        // File might not exist
      }

      // Delete partial file if exists
      try {
        await Filesystem.deleteFile({
          path: this.getPartialFilename(model.filename),
          directory: Directory.Data,
        });
      } catch (e) {
        // File might not exist
      }

      // If this was the current model, reset initialization
      if (this.currentModelId === modelId) {
        this.isInitialized = false;
        this.currentModelId = null;
      }

      return true;
    } catch (e) {
      console.error("Delete Model Error:", e);
      throw new Error("Failed to delete model. Please try again.");
    }
  }

  /**
   * initialize - Loads a GGUF model into the native LLM engine memory
   * @param {string} modelId - The model ID to initialize
   */
  async initialize(modelId = DEFAULT_MODEL) {
    if (this.isInitialized && this.currentModelId === modelId) return;

    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    // Check if model is downloaded
    const status = await this.checkModelStatus(modelId);
    if (!status.downloaded) {
      throw new Error(`Model ${model.name} is not downloaded`);
    }

    try {
      const { uri } = await Filesystem.getUri({
        path: model.filename,
        directory: Directory.Data,
      });

      const modelPath = uri.replace("file://", "");

      await CapgoLLM.initialize({
        modelPath: modelPath,
        contextSize: model.contextSize,
        threads: model.threads,
      });

      this.isInitialized = true;
      this.currentModelId = modelId;
    } catch (error) {
      console.error("LLM Initialization Error:", error);
      this.isInitialized = false;
      this.currentModelId = null;
      throw error;
    }
  }

  /**
   * Unload the current model from memory
   */
  async unload() {
    try {
      await CapgoLLM.unload?.();
    } catch (e) {
      // unload might not be available on all versions
    }
    this.isInitialized = false;
    this.currentModelId = null;
  }

  /**
   * Check if a specific model is initialized
   */
  isModelInitialized(modelId) {
    return this.isInitialized && this.currentModelId === modelId;
  }

  /**
   * sanitizeInput - Basic protection against prompt injection and DoS
   */
  sanitizeInput(content) {
    if (typeof content !== "string") return "";
    return content
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|im_end\|>/g, "")
      .replace(/<\|user\|>/g, "")
      .replace(/<\|assistant\|>/g, "")
      .substring(0, 2000);
  }

  /**
   * getChatTemplate - Returns the appropriate chat template for the model
   */
  getChatTemplate(modelId, messages) {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return this.getDefaultChatTemplate(messages);

    const cleanMessages = messages.map((m) => ({
      role: m.role,
      content: this.sanitizeInput(m.content),
    }));

    // Different models use different chat formats
    switch (modelId) {
      case "lfm2-350m":
        // LFM2 uses ChatML format
        return cleanMessages
          .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
          .join("\n") + "\n<|im_start|>assistant\n";

      case "llama-3.2-1b":
        // Llama 3.2 uses special tokens
        return cleanMessages
          .map((m) => `<|start_header_id|>${m.role}<|end_header_id|>\n${m.content}<|eot_id|>`)
          .join("") + "<|start_header_id|>assistant<|end_header_id|>\n";

      case "deepseek-r1-1.5b":
      case "qwen-2.5-1.5b":
      case "tinyllama-1.1b":
        // These use ChatML-like format
        return cleanMessages
          .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
          .join("\n") + "\n<|im_start|>assistant\n";

      default:
        return this.getDefaultChatTemplate(messages);
    }
  }

  getDefaultChatTemplate(messages) {
    return messages
      .map((m) => `${m.role}: ${this.sanitizeInput(m.content)}`)
      .join("\n") + "\nassistant:";
  }

  /**
   * generateResponse - Performs on-device inference using the loaded model
   * @param {string} modelId - The model ID to use
   * @param {Array} messages - Chat history array
   * @param {Function} onToken - Callback for streaming tokens
   * @returns {Promise<string>} The full generated response text
   */
  async generateResponse(modelId, messages, onToken) {
    // Initialize the model if not already
    if (!this.isInitialized || this.currentModelId !== modelId) {
      // Unload previous model if different
      if (this.isInitialized && this.currentModelId !== modelId) {
        await this.unload();
      }
      await this.initialize(modelId);
    }

    try {
      const prompt = this.getChatTemplate(modelId, messages);
      let fullResponse = "";

      await CapgoLLM.generate({
        prompt: prompt,
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        stopSequences: ["<|im_end|>", "<|eot_id|>", "user:", "assistant:"],
        onToken: (token) => {
          fullResponse += token;
          if (onToken) onToken(token, fullResponse);
        },
      });

      return fullResponse.trim();
    } catch (error) {
      console.error("Local Generation Error:", error);
      throw error;
    }
  }

  /**
   * Get the currently active model ID
   */
  getCurrentModelId() {
    return this.currentModelId;
  }
}

export const localAiService = new LocalAiService();
