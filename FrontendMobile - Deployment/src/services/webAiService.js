import * as webllm from "@mlc-ai/web-llm";

const WEBLLM_MODEL_MAP = {
  "lfm2-350m": null,
  "llama-3.2-1b": "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "qwen-2.5-1.5b": "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "qwen-3-0.6b": "Qwen3-0.6B-q4f16_1-MLC",
  "qwen-3-1.7b": "Qwen3-1.7B-q4f16_1-MLC",
  "deepseek-r1-1.5b": "DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
};

class WebAiService {
  constructor() {
    this.engine = null;
    this.currentModelId = null;
    this.isInitialized = false;
    this.isGenerating = false;
    this.abortController = null;
  }

  isWebGPUSupported() {
    return typeof navigator !== "undefined" && navigator.gpu !== undefined;
  }

  async checkModelStatus(modelId) {
    const webllmId = WEBLLM_MODEL_MAP[modelId];
    if (!webllmId) return { downloaded: false, partial: false, downloadedBytes: 0, totalBytes: 0, percent: 0 };
    try {
      const cached = await webllm.hasModelInCache(webllmId);
      if (cached) {
        return { downloaded: true, partial: false, downloadedBytes: 0, totalBytes: 0, percent: 100 };
      }
    } catch (e) { /* ignore */ }
    return { downloaded: false, partial: false, downloadedBytes: 0, totalBytes: 0, percent: 0 };
  }

  async checkAllModelsStatus() {
    const status = {};
    for (const modelId of Object.keys(WEBLLM_MODEL_MAP)) {
      status[modelId] = await this.checkModelStatus(modelId);
    }
    return status;
  }

  async downloadModel(modelId, onProgress) {
    const webllmId = WEBLLM_MODEL_MAP[modelId];
    if (!webllmId) throw new Error(`Model ${modelId} not available for web`);

    this.engine = await webllm.CreateMLCEngine(webllmId, {
      initProgressCallback: (report) => {
        if (onProgress) {
          const match = report.text.match(/\[(\d+)\/(\d+)\]/);
          if (match) {
            onProgress({
              received: parseInt(match[1]),
              total: parseInt(match[2]),
              percent: Math.round((parseInt(match[1]) / parseInt(match[2])) * 100),
            });
          } else if (report.progress !== undefined) {
            onProgress({
              received: Math.round(report.progress * 100),
              total: 100,
              percent: Math.round(report.progress * 100),
            });
          }
        }
      },
    });

    this.currentModelId = modelId;
    this.isInitialized = true;
    return true;
  }

  async generateResponse(modelId, messages, onToken, options = {}) {
    const webllmId = WEBLLM_MODEL_MAP[modelId];
    if (!webllmId) throw new Error(`Model ${modelId} not available for web`);

    if (!this.isInitialized || this.currentModelId !== modelId) {
      await this.downloadModel(modelId, null);
    }

    this.abortController = new AbortController();
    this.isGenerating = true;

    const isQwen3 = modelId === "qwen-3-0.6b" || modelId === "qwen-3-1.7b";
    const thinking = options.thinking ?? false;

    const chatMessages = messages.map(m => ({ role: m.role, content: m.content }));
    if (isQwen3 && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content = lastMsg.content + (thinking ? " /think" : " /no_think");
      }
    }

    try {
      const chunks = await this.engine.chat.completions.create({
        messages: chatMessages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.7,
      });

      let fullReply = "";
      for await (const chunk of chunks) {
        if (this.abortController.signal.aborted) {
          try { await this.engine.interruptGenerate(); } catch (e) { /* ignore */ }
          break;
        }
        const delta = chunk.choices[0]?.delta.content || "";
        fullReply += delta;
        if (onToken) onToken(delta, fullReply);
      }

      return fullReply;
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  async stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.engine) {
      try { await this.engine.interruptGenerate(); } catch (e) { /* ignore */ }
    }
    this.isGenerating = false;
  }

  async unload() {
    if (this.engine) {
      this.engine = null;
    }
    this.currentModelId = null;
    this.isInitialized = false;
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
    for (const modelId of Object.keys(WEBLLM_MODEL_MAP)) {
      const status = await this.checkModelStatus(modelId);
      if (status.downloaded) {
        total += 500000000;
      }
    }
    return total;
  }

  async deleteModel(modelId) {
    const webllmId = WEBLLM_MODEL_MAP[modelId];
    if (!webllmId) return;
    if (this.currentModelId === modelId) {
      await this.unload();
    }
    try {
      const dbNames = ["webllm"];
      for (const dbName of dbNames) {
        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open(dbName);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, "readwrite");
        for (const storeName of storeNames) {
          try {
            const store = tx.objectStore(storeName);
            const req = store.clear();
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore */ }
  }

  getCurrentModelId() {
    return this.currentModelId;
  }
}

export const webAiService = new WebAiService();
export { WEBLLM_MODEL_MAP };
