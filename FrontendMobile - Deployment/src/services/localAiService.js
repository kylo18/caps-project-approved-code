import { LlamaCpp } from "../native/LlamaCppPlugin";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";
import { webAiService } from "./webAiService";

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
    name: "Light",
    filename: "LFM2-350M-Q4_K_M.gguf",
    description: "Liquid AI 350M - Fast and efficient",
    size: "230 MB",
    sizeBytes: 241000000,
    ram: "~1GB",
    url: "https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q4_K_M.gguf",
    contextSize: 2048,
    threads: 4,
  },
  "llama-3.2-1b": {
    id: "llama-3.2-1b",
    name: "Advanced",
    filename: "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    description: "Meta Llama 3.2 1B - High reasoning quality",
    size: "750 MB",
    sizeBytes: 786000000,
    ram: "~1.5GB",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    contextSize: 2048,
    threads: 4,
  },
  "qwen-2.5-1.5b": {
    id: "qwen-2.5-1.5b",
    name: "Pro",
    filename: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    description: "Alibaba Qwen 2.5 1.5B - Best for complex tasks",
    size: "1 GB",
    sizeBytes: 1044000000,
    ram: "~2GB",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    contextSize: 2048,
    threads: 4,
  },
  "qwen-3-0.6b": {
    id: "qwen-3-0.6b",
    name: "Nano",
    filename: "Qwen_Qwen3-0.6B-Q4_K_M.gguf",
    description: "Alibaba Qwen3 0.6B — Newest, ultra-fast generation",
    size: "450 MB",
    sizeBytes: 472000000,
    ram: "~1GB",
    url: "https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/resolve/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf",
    contextSize: 2048,
    threads: 4,
  },
  "qwen-3-1.7b": {
    id: "qwen-3-1.7b",
    name: "Smart",
    filename: "Qwen_Qwen3-1.7B-Q4_K_M.gguf",
    description: "Alibaba Qwen3 1.7B — Newest, best quality all-rounder",
    size: "1.1 GB",
    sizeBytes: 1150000000,
    ram: "~2GB",
    url: "https://huggingface.co/bartowski/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen_Qwen3-1.7B-Q4_K_M.gguf",
    contextSize: 2048,
    threads: 4,
  },
  "deepseek-r1-1.5b": {
    id: "deepseek-r1-1.5b",
    name: "Reasoning",
    filename: "DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    description: "DeepSeek R1 1.5B — Advanced reasoning & problem solving",
    size: "1 GB",
    sizeBytes: 1050000000,
    ram: "~2GB",
    url: "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    contextSize: 2048,
    threads: 4,
  },
};

// Default model
export const DEFAULT_MODEL = "qwen-2.5-1.5b";

/**
 * LocalAiService - Handles on-device AI model management and inference.
 * Uses custom llama.cpp JNI bridge for GGUF support on Android.
 */
class LocalAiService {
  constructor() {
    this.isInitialized = false;
    this.currentModelId = null;
    this.abortControllers = new Map();
    this.tokenListener = null;
    this.completeListener = null;
    this.errorListener = null;
  }

  /**
   * Get the partial download filename
   */
  getPartialFilename(filename) {
    return `${filename}.partial`;
  }

  /**
   * Check the download status of a model
   */
  async checkModelStatus(modelId) {
    if (!isNativePlatform()) {
      return webAiService.checkModelStatus(modelId);
    }

    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const totalBytes = model.sizeBytes || 0;

    try {
      const stat = await Filesystem.stat({
        path: model.filename,
        directory: Directory.Data,
      });

      const downloadedBytes = stat.size || 0;
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
        return {
          downloaded: false,
          partial: true,
          downloadedBytes,
          totalBytes,
          percent: totalBytes ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 50,
        };
      }
    } catch (e) {
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
    if (!isNativePlatform()) {
      return webAiService.checkAllModelsStatus();
    }
    const status = {};
    for (const modelId of Object.keys(AVAILABLE_MODELS)) {
      status[modelId] = await this.checkModelStatus(modelId);
    }
    return status;
  }

  /**
   * downloadModel - Downloads a model file with resume support
   */
  async downloadModel(modelId, onProgress, resume = false) {
    if (!isNativePlatform()) {
      return webAiService.downloadModel(modelId, onProgress);
    }

    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const partialFilename = this.getPartialFilename(model.filename);
    const abortKey = `download_${modelId}`;

    try {
      let resumeBytes = 0;
      if (resume) {
        try {
          const stat = await Filesystem.stat({
            path: partialFilename,
            directory: Directory.Data,
          });
          resumeBytes = stat.size || 0;
        } catch (e) {
          resume = false;
        }
      }

      const status = await this.checkModelStatus(modelId);
      if (status.downloaded) {
        if (onProgress) onProgress({ received: status.totalBytes, total: status.totalBytes, percent: 100 });
        return true;
      }

      if (!resume) {
        try {
          await Filesystem.deleteFile({ path: partialFilename, directory: Directory.Data });
        } catch (e) {}
      }

      const headers = {};
      if (resume && resumeBytes > 0) {
        headers["Range"] = `bytes=${resumeBytes}-`;
      }

      this.abortControllers.set(abortKey, new AbortController());

      const partialUri = await Filesystem.getUri({
        directory: Directory.Data,
        path: partialFilename,
      });

      let progressListener = null;
      if (onProgress) {
        progressListener = await FileTransfer.addListener("progress", (progress) => {
          const totalReceived = (progress.bytes || 0) + resumeBytes;
          const total = progress.contentLength ? progress.contentLength + resumeBytes : model.sizeBytes;
          const percent = total > 0 ? Math.round((totalReceived / total) * 100) : 0;
          onProgress({ received: totalReceived, total, percent });
        });
      }

      try {
        await FileTransfer.downloadFile({
          url: model.url,
          path: partialUri.uri,
          method: "GET",
          headers,
          progress: true,
          readTimeout: 300000,
          connectTimeout: 30000,
        });
      } finally {
        if (progressListener) await progressListener.remove();
      }

      await Filesystem.rename({
        from: partialFilename,
        to: model.filename,
        directory: Directory.Data,
      });

      const finalStat = await Filesystem.stat({
        path: model.filename,
        directory: Directory.Data,
      });
      const finalSize = finalStat.size || 0;
      const minExpected = model.sizeBytes * 0.9;
      if (model.sizeBytes > 0 && finalSize < minExpected) {
        throw new Error(
          `Downloaded file is too small (${finalSize} bytes vs expected ${model.sizeBytes} bytes). ` +
          `Download may be corrupted.`
        );
      }
      console.log(`Model downloaded and verified: ${finalSize} bytes`);

      this.abortControllers.delete(abortKey);
      return true;
    } catch (error) {
      this.abortControllers.delete(abortKey);
      throw error;
    }
  }

  /**
   * initialize - Loads a GGUF model into the native LLM engine memory
   */
  async initialize(modelId = DEFAULT_MODEL) {
    if (!isNativePlatform()) {
      return webAiService.downloadModel(modelId, null);
    }
    if (this.isInitialized && this.currentModelId === modelId) return;

    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const status = await this.checkModelStatus(modelId);
    if (!status.downloaded) {
      throw new Error(`Model ${model.name} is not downloaded`);
    }

    try {
      const { uri } = await Filesystem.getUri({
        path: model.filename,
        directory: Directory.Data,
      });

      console.log(`Filesystem URI for ${model.filename}: ${uri}`);

      let modelPath;
      if (uri.startsWith("content://")) {
        modelPath = uri;
        console.log("Content URI detected, passing to native resolver");
      } else if (uri.startsWith("file://")) {
        modelPath = uri.replace("file://", "");
      } else {
        modelPath = uri;
      }

      console.log(`Loading model from path: ${modelPath}`);

      const result = await LlamaCpp.loadModel({
        modelPath,
        nCtx: model.contextSize || 2048,
        nThreads: model.threads || 4,
      });

      if (!result.success) {
        throw new Error("JNI Bridge failed to load model");
      }

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
   * cleanupListeners - Safely removes all active Capacitor listeners
   */
  async cleanupListeners() {
    if (this.tokenListener) {
      await this.tokenListener.remove();
      this.tokenListener = null;
    }
    if (this.completeListener) {
      await this.completeListener.remove();
      this.completeListener = null;
    }
    if (this.errorListener) {
      await this.errorListener.remove();
      this.errorListener = null;
    }
  }

  /**
   * Unload the current model from memory
   */
  async unload() {
    if (!isNativePlatform()) {
      return webAiService.unload();
    }
    try {
      await LlamaCpp.abort(); // Kill any running inference
      await this.cleanupListeners();
      await LlamaCpp.unload(); // Free JNI model/context memory
    } catch (e) {
      console.error("Unload error:", e);
    }
    this.isInitialized = false;
    this.currentModelId = null;
  }

  /**
   * Sanitize prompt to avoid control token injection
   */
  sanitizeInput(content) {
    if (typeof content !== "string") return "";
    return content
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|im_end\|>/g, "")
      .replace(/<\|user\|>/g, "")
      .replace(/<\|assistant\|>/g, "")
      .substring(0, 4000);
  }

  /**
   * getChatTemplate - Formats conversation for specific model architecture
   */
  getChatTemplate(modelId, messages, options = {}) {
    const { thinking = false } = options;
    const cleanMessages = messages.map((m) => ({
      role: m.role,
      content: this.sanitizeInput(m.content),
    }));

    switch (modelId) {
      case "lfm2-350m":
      case "qwen-2.5-1.5b":
        return cleanMessages
          .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
          .join("\n") + "\n<|im_start|>assistant\n";

      case "llama-3.2-1b":
        return cleanMessages
          .map((m) => `<|start_header_id|>${m.role}<|end_header_id|>\n${m.content}<|eot_id|>`)
          .join("") + "<|start_header_id|>assistant<|end_header_id|>\n";

      // Qwen3: ChatML with thinking control via /think and /no_think
      case 'qwen-3-0.6b':
      case 'qwen-3-1.7b': {
        const thinkDirective = thinking ? ' /think' : ' /no_think';
        const lastMsg = cleanMessages[cleanMessages.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
          lastMsg.content = lastMsg.content + thinkDirective;
        }
        return cleanMessages
          .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
          .join('\n') + '\n<|im_start|>assistant\n';
      }

      // DeepSeek R1: ChatML + open <think> so model generates its reasoning chain
      case "deepseek-r1-1.5b":
        return cleanMessages
          .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
          .join("\n") + "\n<|im_start|>assistant\n";

      default:
        return cleanMessages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n") + "\nassistant:";
    }
  }

  /**
   * generateResponse - Performs streaming inference using the JNI bridge
   */
  async generateResponse(modelId, messages, onToken, options = {}) {
    if (!isNativePlatform()) {
      return webAiService.generateResponse(modelId, messages, onToken, options);
    }
    if (!this.isInitialized || this.currentModelId !== modelId) {
      if (this.isInitialized) await this.unload();
      await this.initialize(modelId);
    }

    try {
      const prompt = this.getChatTemplate(modelId, messages, options);

      return await new Promise(async (resolve, reject) => {
        let accumulated = "";

        // Setup listeners
        this.tokenListener = await LlamaCpp.addListener("onToken", (data) => {
          accumulated += data.token;
          if (onToken) onToken(data.token, accumulated);
        });

        this.completeListener = await LlamaCpp.addListener("onComplete", async () => {
          await this.cleanupListeners();
          resolve(accumulated.trim());
        });

        this.errorListener = await LlamaCpp.addListener("onError", async (data) => {
          await this.cleanupListeners();
          reject(new Error(data.error || "Native inference error"));
        });

        try {
          // Trigger the native inference thread
          await LlamaCpp.generate({ prompt });
        } catch (sendErr) {
          await this.cleanupListeners();
          reject(sendErr);
        }
      });
    } catch (error) {
      console.error("Local Generation Error:", error);
      throw error;
    }
  }

  getCurrentModelId() {
    return this.currentModelId;
  }

  isWebGPUSupported() {
    return webAiService.isWebGPUSupported();
  }

  async stop() {
    if (!isNativePlatform()) {
      return webAiService.stop();
    }
    try {
      await LlamaCpp.abort();
      await this.cleanupListeners();
    } catch (e) {
      console.error("Stop error:", e);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getStorageUsed() {
    let total = 0;
    for (const modelId of Object.keys(AVAILABLE_MODELS)) {
      const status = await this.checkModelStatus(modelId);
      if (status.downloaded) {
        total += status.downloadedBytes || AVAILABLE_MODELS[modelId].sizeBytes;
      }
    }
    return total;
  }

  async deleteModel(modelId) {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);
    try {
      await Filesystem.deleteFile({
        path: model.filename,
        directory: Directory.Data,
      });
    } catch (e) {
      try {
        await Filesystem.deleteFile({
          path: this.getPartialFilename(model.filename),
          directory: Directory.Data,
        });
      } catch (e2) {
        // File doesn't exist, that's fine
      }
    }
    if (this.currentModelId === modelId) {
      await this.unload();
    }
  }
}

export const localAiService = new LocalAiService();
