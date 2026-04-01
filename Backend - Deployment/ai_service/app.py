from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import os
import sys
import threading
import time
import gc
import hashlib

app = FastAPI(title="CAPS AI Service - Multi-Model Manager")

# Enable CORS for all origins (configure properly for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# AVAILABLE MODELS CONFIGURATION
# ============================================================
AVAILABLE_MODELS: Dict[str, dict] = {
    "lfm2-350m": {
        "name": "LFM2-350M",
        "description": "Fastest - Works on all phones (4GB+ RAM)",
        "size": "~230MB",
        "size_bytes": 241000000,
        "ram": "~1GB",
        "speed": "50+ tok/s",
        "url": "https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q4_K_M.gguf",
        "filename": "LFM2-350M-Q4_K_M.gguf",
        "recommended_for": "All phones, fastest responses"
    },
    "tinyllama-1.1b": {
        "name": "TinyLlama 1.1B",
        "description": "Ultra-lightweight - Trained on 3T tokens",
        "size": "~700MB", 
        "size_bytes": 734000000,
        "ram": "~1GB",
        "speed": "28-35 tok/s",
        "url": "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
        "filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
        "recommended_for": "4GB RAM phones, quick chat"
    },
    "llama-3.2-1b": {
        "name": "Llama 3.2 1B",
        "description": "Meta's latest - Best 1B model",
        "size": "~750MB",
        "size_bytes": 786000000,
        "ram": "~1.5GB", 
        "speed": "25-30 tok/s",
        "url": "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        "filename": "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        "recommended_for": "6GB RAM phones, balanced quality"
    },
    "gemma-2b": {
        "name": "Gemma 2B",
        "description": "Google's lightweight model",
        "size": "~1.5GB",
        "size_bytes": 1573000000,
        "ram": "~2GB",
        "speed": "20-25 tok/s",
        "url": "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
        "filename": "gemma-2-2b-it-Q4_K_M.gguf",
        "recommended_for": "6-8GB RAM phones, Google ecosystem"
    },
    "qwen-2.5-1.5b": {
        "name": "Qwen 2.5 1.5B",
        "description": "Best multilingual - Great for Filipino students",
        "size": "~1GB",
        "size_bytes": 1044000000,
        "ram": "~2GB",
        "speed": "15-25 tok/s",
        "url": "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "filename": "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "recommended_for": "8GB+ RAM, multilingual, best quality"
    },
    "deepseek-r1-1.5b": {
        "name": "DeepSeek-R1 1.5B",
        "description": "Reasoning model - Shows step-by-step thinking",
        "size": "~1.1GB",
        "size_bytes": 1120000000,
        "ram": "~2GB",
        "speed": "15-22 tok/s",
        "url": "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
        "filename": "DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
        "recommended_for": "8GB+ RAM, reasoning tasks, math/coding"
    }
}

# Global state
models: Dict[str, any] = {}
model_threads: Dict[str, threading.Thread] = {}
CURRENT_MODEL_KEY: Optional[str] = None

class ModelStatus:
    def __init__(self):
        self.step = "Not downloaded"
        self.progress = 0
        self.error = None
        self.ready = False
        self.downloaded = False
        self.loading = False
        self.partial = False
        self.downloaded_bytes = 0
        self.total_bytes = 0
        
model_status: Dict[str, ModelStatus] = {}
for key in AVAILABLE_MODELS:
    model_status[key] = ModelStatus()

def get_model_path(key: str) -> str:
    return f"/app/models/{AVAILABLE_MODELS[key]['filename']}"

def get_partial_path(key: str) -> str:
    return f"/app/models/{AVAILABLE_MODELS[key]['filename']}.partial"

def check_download_status(key: str) -> dict:
    """
    Check download status of a model
    Returns: {
        'downloaded': bool,
        'partial': bool,
        'downloaded_bytes': int,
        'total_bytes': int,
        'percent': float
    }
    """
    config = AVAILABLE_MODELS[key]
    model_path = get_model_path(key)
    partial_path = get_partial_path(key)
    total_bytes = config.get('size_bytes', 0)
    
    # Check if fully downloaded
    if os.path.exists(model_path):
        actual_size = os.path.getsize(model_path)
        # Allow 5% tolerance for size mismatch (headers, metadata differences)
        min_expected = total_bytes * 0.95 if total_bytes else actual_size * 0.9
        
        if actual_size >= min_expected:
            return {
                'downloaded': True,
                'partial': False,
                'downloaded_bytes': actual_size,
                'total_bytes': total_bytes or actual_size,
                'percent': 100
            }
        else:
            # File exists but is too small - corrupted/partial
            return {
                'downloaded': False,
                'partial': True,
                'downloaded_bytes': actual_size,
                'total_bytes': total_bytes or actual_size,
                'percent': min(99, int((actual_size / total_bytes) * 100)) if total_bytes else 50
            }
    
    # Check for partial download file
    if os.path.exists(partial_path):
        partial_size = os.path.getsize(partial_path)
        return {
            'downloaded': False,
            'partial': True,
            'downloaded_bytes': partial_size,
            'total_bytes': total_bytes or partial_size,
            'percent': min(99, int((partial_size / total_bytes) * 100)) if total_bytes else 50
        }
    
    # Not downloaded at all
    return {
        'downloaded': False,
        'partial': False,
        'downloaded_bytes': 0,
        'total_bytes': total_bytes,
        'percent': 0
    }

def update_model_status_from_files():
    """Update all model statuses based on file system check"""
    for key in AVAILABLE_MODELS:
        status = check_download_status(key)
        model_status[key].downloaded = status['downloaded']
        model_status[key].partial = status['partial']
        model_status[key].downloaded_bytes = status['downloaded_bytes']
        model_status[key].total_bytes = status['total_bytes']
        
        if status['downloaded']:
            model_status[key].step = "Downloaded (not loaded)"
            model_status[key].progress = 100
        elif status['partial']:
            model_status[key].step = f"Incomplete ({status['percent']:.0f}%) - Tap to resume"
            model_status[key].progress = status['percent']
        else:
            model_status[key].step = "Not downloaded"
            model_status[key].progress = 0

def cleanup_partial_download(key: str):
    """Clean up partial/incomplete download files"""
    partial_path = get_partial_path(key)
    model_path = get_model_path(key)
    
    if os.path.exists(partial_path):
        os.remove(partial_path)
        print(f"Cleaned up partial file: {partial_path}", flush=True)
    
    # Also check if main file is incomplete
    if os.path.exists(model_path):
        config = AVAILABLE_MODELS[key]
        actual_size = os.path.getsize(model_path)
        expected_size = config.get('size_bytes', 0)
        
        if expected_size and actual_size < expected_size * 0.95:
            os.remove(model_path)
            print(f"Cleaned up incomplete file: {model_path}", flush=True)

def unload_model(key: str):
    """Unload model from memory to free RAM"""
    global models
    if key in models:
        print(f"Unloading model {key} from memory...", flush=True)
        del models[key]
        gc.collect()
        model_status[key].ready = False
        model_status[key].step = "Downloaded (not loaded)"
        print(f"Model {key} unloaded successfully", flush=True)

def load_model_thread(key: str):
    """Load a model in background"""
    from llama_cpp import Llama
    
    status = model_status[key]
    model_config = AVAILABLE_MODELS[key]
    model_path = get_model_path(key)
    
    try:
        # Check download status first
        download_status = check_download_status(key)
        if not download_status['downloaded']:
            status.step = "Not downloaded"
            status.downloaded = False
            status.ready = False
            return
        
        status.downloaded = True
        status.loading = True
        status.step = "Loading into memory..."
        status.progress = 60
        
        # Load with llama.cpp
        models[key] = Llama(
            model_path=model_path,
            n_threads=4,
            n_ctx=2048,
            verbose=False
        )
        
        status.step = "Ready"
        status.progress = 100
        status.ready = True
        status.loading = False
        print(f"--- {model_config['name']} loaded successfully ---", flush=True)
        
    except Exception as e:
        print(f"ERROR loading {key}: {str(e)}", flush=True)
        status.step = "Error"
        status.error = str(e)
        status.loading = False
        status.ready = False

def download_model_thread(key: str, resume: bool = False):
    """Download a model with resume support"""
    import urllib.request
    
    status = model_status[key]
    model_config = AVAILABLE_MODELS[key]
    model_path = get_model_path(key)
    partial_path = get_partial_path(key)
    
    try:
        status.loading = True
        status.step = "Downloading..."
        
        # Check if we should resume or start fresh
        download_file = partial_path
        resume_byte_pos = 0
        
        if resume and os.path.exists(partial_path):
            resume_byte_pos = os.path.getsize(partial_path)
            status.downloaded_bytes = resume_byte_pos
            status.step = f"Resuming download... ({resume_byte_pos//1024//1024}MB already)"
            print(f"Resuming download for {key} from {resume_byte_pos} bytes", flush=True)
        elif os.path.exists(partial_path):
            # Clean up old partial
            os.remove(partial_path)
        
        # Create request with resume header if needed
        req = urllib.request.Request(model_config['url'])
        if resume_byte_pos > 0:
            req.add_header('Range', f'bytes={resume_byte_pos}-')
        
        status.total_bytes = model_config.get('size_bytes', 0)
        
        with urllib.request.urlopen(req, timeout=30) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            if resume_byte_pos > 0 and total_size > 0:
                total_size += resume_byte_pos
            elif total_size == 0:
                total_size = status.total_bytes or 1
            
            status.total_bytes = total_size
            
            mode = 'ab' if resume_byte_pos > 0 else 'wb'
            with open(download_file, mode) as f:
                downloaded = resume_byte_pos
                chunk_size = 8192
                
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    
                    f.write(chunk)
                    downloaded += len(chunk)
                    status.downloaded_bytes = downloaded
                    
                    # Update progress
                    percent = min(int((downloaded / total_size) * 90) + 10, 99)
                    status.progress = percent
                    status.step = f"Downloading... {downloaded//1024//1024}MB / {total_size//1024//1024}MB"
                    
                    # Small delay to prevent UI freezing
                    time.sleep(0.001)
        
        # Move from partial to final location
        if os.path.exists(partial_path):
            if os.path.exists(model_path):
                os.remove(model_path)
            os.rename(partial_path, model_path)
        
        # Verify the download
        final_status = check_download_status(key)
        if final_status['downloaded']:
            status.downloaded = True
            status.partial = False
            status.step = "Downloaded (not loaded)"
            status.progress = 100
            print(f"Download complete and verified for {model_config['name']}!")
        else:
            status.step = "Download incomplete - check connection"
            status.error = "File size mismatch"
            status.partial = True
            
    except Exception as e:
        print(f"Download failed for {key}: {str(e)}", flush=True)
        status.step = f"Download failed - {str(e)[:30]}"
        status.error = str(e)
        status.loading = False
        status.partial = True
    finally:
        status.loading = False

# Initialize - check which models are already downloaded
print("--- Starting CAPS AI Service (Multi-Model Manager) ---", flush=True)
update_model_status_from_files()
for key in AVAILABLE_MODELS:
    if model_status[key].downloaded:
        print(f"Found downloaded: {AVAILABLE_MODELS[key]['name']}", flush=True)
    elif model_status[key].partial:
        print(f"Found partial download: {AVAILABLE_MODELS[key]['name']} ({model_status[key].progress:.0f}%)", flush=True)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None

# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Model manager page - Mobile optimized"""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#667eea">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>CAPS AI - Model Manager</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
            html { touch-action: manipulation; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 12px;
                padding-bottom: max(12px, env(safe-area-inset-bottom));
                padding-top: max(12px, env(safe-area-inset-top));
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
            }
            .header {
                background: white;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .header h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 6px;
            }
            .header p {
                color: #666;
                font-size: 14px;
                line-height: 1.4;
            }
            .model-grid {
                display: grid;
                gap: 12px;
            }
            .model-card {
                background: white;
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
                position: relative;
            }
            .model-card:active {
                transform: scale(0.98);
            }
            .model-card.active {
                border: 3px solid #4ade80;
            }
            .model-card.in-memory {
                border: 3px solid #FE6902;
            }
            .model-card.partial {
                border: 2px dashed #fbbf24;
            }
            .model-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
                gap: 8px;
            }
            .model-name {
                font-size: 17px;
                font-weight: 600;
                color: #333;
                flex: 1;
                line-height: 1.3;
            }
            .model-desc {
                color: #666;
                font-size: 13px;
                margin-bottom: 10px;
                line-height: 1.4;
            }
            .model-meta {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }
            .badge {
                background: #f3f4f6;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 11px;
                color: #555;
                font-weight: 500;
            }
            .badge.speed { background: #dbeafe; color: #1e40af; }
            .badge.ram { background: #fce7f3; color: #9d174d; }
            .badge.size { background: #d1fae5; color: #065f46; }
            .status-bar {
                background: #f9fafb;
                border-radius: 10px;
                padding: 10px 12px;
                margin-bottom: 12px;
            }
            .status-text {
                font-size: 13px;
                color: #666;
                margin-bottom: 6px;
                font-weight: 500;
            }
            .status-text.partial { color: #f59e0b; }
            .status-text.error { color: #ef4444; }
            .progress-bar {
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 3px;
                transition: width 0.3s;
            }
            .progress-fill.partial {
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
            }
            .actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .btn {
                padding: 12px 18px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
                flex: 1;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .btn-primary:active:not(:disabled) {
                opacity: 0.8;
                transform: scale(0.96);
            }
            .btn-success {
                background: #22c55e;
                color: white;
            }
            .btn-success:active:not(:disabled) {
                background: #16a34a;
                transform: scale(0.96);
            }
            .btn-danger {
                background: #ef4444;
                color: white;
            }
            .btn-danger:active:not(:disabled) {
                background: #dc2626;
                transform: scale(0.96);
            }
            .btn-secondary {
                background: #6b7280;
                color: white;
            }
            .btn-warning {
                background: #f59e0b;
                color: white;
            }
            .btn-warning:active:not(:disabled) {
                background: #d97706;
                transform: scale(0.96);
            }
            .current-badge {
                display: inline-block;
                background: #4ade80;
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }
            .memory-badge {
                display: inline-block;
                background: #FE6902;
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }
            .partial-badge {
                display: inline-block;
                background: #fbbf24;
                color: #92400e;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }
            .storage-info {
                background: rgba(255,255,255,0.15);
                color: white;
                padding: 12px 16px;
                border-radius: 12px;
                margin-bottom: 12px;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-size: 14px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                white-space: nowrap;
            }
            .toast.show { opacity: 1; }
            
            /* Mobile optimizations */
            @media (max-width: 480px) {
                body { padding: 8px; }
                .header { padding: 16px; }
                .header h1 { font-size: 20px; }
                .model-card { padding: 14px; }
                .model-name { font-size: 16px; }
                .btn { padding: 14px; font-size: 15px; }
                .badge { font-size: 10px; padding: 4px 8px; }
            }
            
            /* Pull to refresh indicator */
            .pull-indicator {
                text-align: center;
                padding: 10px;
                color: rgba(255,255,255,0.8);
                font-size: 13px;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .pull-indicator.show { opacity: 1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 CAPS AI Model Manager</h1>
                <p>Download, switch, and manage AI models. Pull down to refresh status.</p>
            </div>
            <div class="storage-info" id="storageInfo">
                <span>📱 Checking storage...</span>
                <span id="storageStats"></span>
            </div>
            <div class="pull-indicator" id="pullIndicator">↓ Pull down to refresh</div>
            <div class="model-grid" id="modelGrid"></div>
        </div>
        <div class="toast" id="toast"></div>

        <script>
            let refreshInterval;
            let touchStartY = 0;
            let isRefreshing = false;
            
            function showToast(message) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2500);
            }
            
            async function fetchStatus() {
                try {
                    const response = await fetch('/api/status');
                    return await response.json();
                } catch (e) {
                    console.error('Failed to fetch status:', e);
                    return null;
                }
            }
            
            function formatBytes(bytes) {
                if (bytes === 0) return '0 MB';
                const mb = bytes / 1024 / 1024;
                if (mb < 1024) return mb.toFixed(0) + ' MB';
                return (mb / 1024).toFixed(1) + ' GB';
            }
            
            function updateStorageInfo(data) {
                let downloaded = 0, partial = 0, total = 0;
                Object.entries(data.models).forEach(([key, config]) => {
                    const status = data.status[key];
                    if (status.downloaded) downloaded += status.downloaded_bytes || 0;
                    else if (status.partial) partial += status.downloaded_bytes || 0;
                });
                
                const info = document.getElementById('storageInfo');
                const stats = document.getElementById('storageStats');
                
                if (downloaded > 0 || partial > 0) {
                    let text = formatBytes(downloaded);
                    if (partial > 0) text += ` (+${formatBytes(partial)} partial)`;
                    stats.textContent = text + ' used';
                    info.querySelector('span').textContent = '💾 Storage Used:';
                } else {
                    info.querySelector('span').textContent = '📱 No models downloaded';
                    stats.textContent = '';
                }
            }
            
            async function downloadModel(key, resume = false) {
                const url = resume ? `/api/download/${key}?resume=true` : `/api/download/${key}`;
                await fetch(url, {method: 'POST'});
                showToast(resume ? 'Resuming download...' : 'Starting download...');
            }
            
            async function deleteModel(key) {
                if (!confirm('Delete this model? This will free up storage space.')) return;
                await fetch(`/api/delete/${key}`, {method: 'DELETE'});
                showToast('Model deleted');
            }
            
            async function useModel(key) {
                await fetch(`/api/use/${key}`, {method: 'POST'});
                showToast('Loading model...');
            }
            
            async function unloadModel(key) {
                await fetch(`/api/unload/${key}`, {method: 'POST'});
                showToast('Model unloaded from memory');
            }
            
            function renderModels(data) {
                const grid = document.getElementById('modelGrid');
                grid.innerHTML = Object.entries(data.models).map(([key, config]) => {
                    const status = data.status[key];
                    const isCurrent = data.current_model === key;
                    const isInMemory = status.ready;
                    const isDownloaded = status.downloaded;
                    const isPartial = status.partial;
                    const isLoading = status.loading;
                    
                    let cardClass = 'model-card';
                    if (isCurrent) cardClass += ' active';
                    if (isInMemory) cardClass += ' in-memory';
                    if (isPartial) cardClass += ' partial';
                    
                    let badge = '';
                    if (isCurrent) badge = '<span class="current-badge">CURRENT</span>';
                    else if (isInMemory) badge = '<span class="memory-badge">IN MEMORY</span>';
                    else if (isPartial) badge = '<span class="partial-badge">INCOMPLETE</span>';
                    
                    let actions = '';
                    
                    if (isLoading) {
                        actions = `<button class="btn btn-primary" disabled>⏳ ${status.step}</button>`;
                    } else if (isPartial) {
                        actions = `
                            <button class="btn btn-warning" onclick="downloadModel('${key}', true)">
                                ▶️ Resume Download
                            </button>
                            <button class="btn btn-danger" onclick="deleteModel('${key}')">
                                🗑️ Clear
                            </button>
                        `;
                    } else if (!isDownloaded) {
                        actions = `
                            <button class="btn btn-primary" onclick="downloadModel('${key}')">
                                ⬇️ Download (${config.size})
                            </button>
                        `;
                    } else if (isDownloaded && !isInMemory) {
                        actions = `
                            <button class="btn btn-success" onclick="useModel('${key}')">
                                ▶️ Use Model
                            </button>
                            <button class="btn btn-danger" onclick="deleteModel('${key}')">
                                🗑️ Delete
                            </button>
                        `;
                    } else if (isInMemory) {
                        actions = `
                            <button class="btn btn-success" disabled>
                                ✓ Active
                            </button>
                            <a href="/chat?model=${key}" class="btn btn-primary" style="text-decoration:none;display:inline-flex;">
                                💬 Open Chat
                            </a>
                            <button class="btn btn-secondary" onclick="unloadModel('${key}')">
                                ⏏️ Unload
                            </button>
                        `;
                    }
                    
                    const statusClass = isPartial ? 'partial' : (status.error ? 'error' : '');
                    const progressClass = isPartial ? 'partial' : '';
                    
                    return `
                        <div class="${cardClass}">
                            <div class="model-header">
                                <div class="model-name">${config.name}</div>
                                ${badge}
                            </div>
                            <div class="model-desc">${config.description}</div>
                            <div class="model-meta">
                                <span class="badge speed">${config.speed}</span>
                                <span class="badge ram">${config.ram}</span>
                                <span class="badge size">${config.size}</span>
                            </div>
                            <div class="status-bar">
                                <div class="status-text ${statusClass}">${status.step}</div>
                                ${isLoading || isPartial ? `
                                    <div class="progress-bar">
                                        <div class="progress-fill ${progressClass}" style="width: ${status.progress}%"></div>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="actions">
                                ${actions}
                            </div>
                        </div>
                    `;
                }).join('');
                
                updateStorageInfo(data);
            }
            
            async function refresh() {
                const data = await fetchStatus();
                if (data) renderModels(data);
            }
            
            // Auto-refresh
            refreshInterval = setInterval(refresh, 1000);
            refresh();
            
            // Pull to refresh for mobile
            document.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, {passive: true});
            
            document.addEventListener('touchmove', (e) => {
                if (isRefreshing) return;
                const touchY = e.touches[0].clientY;
                const diff = touchY - touchStartY;
                if (window.scrollY === 0 && diff > 60) {
                    document.getElementById('pullIndicator').classList.add('show');
                }
            }, {passive: true});
            
            document.addEventListener('touchend', async (e) => {
                if (isRefreshing) return;
                const touchY = e.changedTouches[0].clientY;
                const diff = touchY - touchStartY;
                if (window.scrollY === 0 && diff > 100) {
                    isRefreshing = true;
                    document.getElementById('pullIndicator').textContent = 'Refreshing...';
                    await refresh();
                    document.getElementById('pullIndicator').classList.remove('show');
                    document.getElementById('pullIndicator').textContent = '↓ Pull down to refresh';
                    isRefreshing = false;
                    showToast('Status refreshed');
                }
            }, {passive: true});
            
            // Cleanup on page hide
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(refreshInterval);
                } else {
                    refreshInterval = setInterval(refresh, 1000);
                    refresh();
                }
            });
        </script>
    </body>
    </html>
    """

@app.get("/api/status")
async def api_status():
    """Get current status of all models"""
    # Refresh status from filesystem
    update_model_status_from_files()
    
    return {
        "current_model": CURRENT_MODEL_KEY,
        "models": AVAILABLE_MODELS,
        "status": {
            key: {
                "step": model_status[key].step,
                "progress": model_status[key].progress,
                "error": model_status[key].error,
                "ready": model_status[key].ready,
                "downloaded": model_status[key].downloaded,
                "loading": model_status[key].loading,
                "partial": model_status[key].partial,
                "downloaded_bytes": model_status[key].downloaded_bytes,
                "total_bytes": model_status[key].total_bytes
            }
            for key in AVAILABLE_MODELS
        }
    }

@app.post("/api/download/{model_key}")
async def download_model(model_key: str, resume: bool = False):
    """Download a model"""
    if model_key not in AVAILABLE_MODELS:
        raise HTTPException(status_code=404, detail="Model not found")
    
    status = model_status[model_key]
    
    # Check if already downloading
    if status.loading:
        return {"message": "Already downloading"}
    
    # Check if already downloaded
    if status.downloaded and not resume:
        return {"message": "Already downloaded"}
    
    # Clean up any previous partial download if not resuming
    if not resume:
        cleanup_partial_download(model_key)
    
    # Start download in background
    status.loading = True
    status.error = None
    thread = threading.Thread(target=download_model_thread, args=(model_key, resume))
    thread.daemon = True
    thread.start()
    
    return {"message": f"Download {'resumed' if resume else 'started'} for {AVAILABLE_MODELS[model_key]['name']}"}

@app.delete("/api/delete/{model_key}")
async def delete_model(model_key: str):
    """Delete a downloaded model"""
    if model_key not in AVAILABLE_MODELS:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Unload if in memory
    if model_key in models:
        unload_model(model_key)
    
    # Delete files
    model_path = get_model_path(model_key)
    partial_path = get_partial_path(model_key)
    
    deleted = False
    if os.path.exists(model_path):
        os.remove(model_path)
        deleted = True
    if os.path.exists(partial_path):
        os.remove(partial_path)
        deleted = True
    
    # Reset status
    model_status[model_key] = ModelStatus()
    
    if deleted:
        return {"message": f"Deleted {AVAILABLE_MODELS[model_key]['name']}"}
    else:
        return {"message": "Nothing to delete"}

@app.post("/api/use/{model_key}")
async def use_model(model_key: str):
    """Load a model into memory"""
    global CURRENT_MODEL_KEY
    
    if model_key not in AVAILABLE_MODELS:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Check if downloaded
    download_status = check_download_status(model_key)
    if not download_status['downloaded']:
        raise HTTPException(status_code=400, detail="Model not downloaded")
    
    # Check if already loading
    if model_status[model_key].loading:
        return {"message": "Already loading"}
    
    # Check if already loaded
    if model_status[model_key].ready:
        CURRENT_MODEL_KEY = model_key
        return {"message": f"{AVAILABLE_MODELS[model_key]['name']} is already active"}
    
    # Start loading
    CURRENT_MODEL_KEY = model_key
    model_status[model_key].loading = True
    model_status[model_key].step = "Loading into memory..."
    
    thread = threading.Thread(target=load_model_thread, args=(model_key,))
    thread.daemon = True
    thread.start()
    
    return {"message": f"Loading {AVAILABLE_MODELS[model_key]['name']}..."}

@app.post("/api/unload/{model_key}")
async def unload_model_endpoint(model_key: str):
    """Unload a model from memory"""
    if model_key not in AVAILABLE_MODELS:
        raise HTTPException(status_code=404, detail="Model not found")
    
    unload_model(model_key)
    return {"message": f"Unloaded {AVAILABLE_MODELS[model_key]['name']}"}

@app.get("/chat", response_class=HTMLResponse)
async def chat_ui(model: Optional[str] = None):
    """Chat UI - Mobile optimized"""
    model_key = model or CURRENT_MODEL_KEY
    if not model_key or model_key not in AVAILABLE_MODELS:
        model_key = "lfm2-350m"
    
    config = AVAILABLE_MODELS[model_key]
    status = model_status[model_key]
    
    if not status.ready:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <meta http-equiv="refresh" content="2">
            <style>
                * {{ box-sizing: border-box; margin: 0; padding: 0; }}
                body {{
                    font-family: -apple-system, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                }}
                .loading {{
                    text-align: center;
                }}
                .spinner {{
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }}
                @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
                h2 {{ margin-bottom: 10px; font-size: 20px; }}
                p {{ opacity: 0.9; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="loading">
                <div class="spinner"></div>
                <h2>Loading {config['name']}...</h2>
                <p>{status.step}</p>
            </div>
        </body>
        </html>
        """
    
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="theme-color" content="#667eea">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <title>CAPS AI Chat - {config['name']}</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }}
            html {{ touch-action: manipulation; height: 100%; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }}
            .container {{
                flex: 1;
                display: flex;
                flex-direction: column;
                max-width: 800px;
                width: 100%;
                margin: 0 auto;
                background: white;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                flex-shrink: 0;
            }}
            .header-top {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }}
            .header h1 {{ font-size: 18px; }}
            .model-badge {{
                background: rgba(255,255,255,0.2);
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
            }}
            .model-info {{
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 8px;
            }}
            .back-btn {{
                background: transparent;
                border: 1px solid rgba(255,255,255,0.5);
                color: white;
                padding: 6px 14px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                text-decoration: none;
                display: inline-block;
            }}
            .chat-container {{
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                background: #f8f9fa;
                -webkit-overflow-scrolling: touch;
            }}
            .welcome {{
                background: white;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }}
            .welcome h3 {{
                color: #333;
                font-size: 15px;
                margin-bottom: 6px;
            }}
            .welcome p {{
                color: #666;
                font-size: 13px;
                line-height: 1.4;
            }}
            .message {{
                margin-bottom: 12px;
                display: flex;
                animation: fadeIn 0.3s ease;
            }}
            @keyframes fadeIn {{
                from {{ opacity: 0; transform: translateY(10px); }}
                to {{ opacity: 1; transform: translateY(0); }}
            }}
            .message.user {{ justify-content: flex-end; }}
            .message.assistant {{ justify-content: flex-start; }}
            .message-content {{
                max-width: 85%;
                padding: 12px 16px;
                border-radius: 18px;
                word-wrap: break-word;
                line-height: 1.5;
                font-size: 15px;
            }}
            .message.user .message-content {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-bottom-right-radius: 4px;
            }}
            .message.assistant .message-content {{
                background: white;
                color: #333;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .input-container {{
                padding: 12px;
                background: white;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
                flex-shrink: 0;
                padding-bottom: max(12px, env(safe-area-inset-bottom));
            }}
            #messageInput {{
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 24px;
                font-size: 16px;
                outline: none;
                -webkit-appearance: none;
            }}
            #messageInput:focus {{ border-color: #667eea; }}
            #sendBtn {{
                padding: 12px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 24px;
                font-size: 15px;
                cursor: pointer;
                min-width: 70px;
            }}
            #sendBtn:disabled {{
                opacity: 0.6;
                cursor: not-allowed;
            }}
            .typing-indicator {{
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }}
            .typing-indicator span {{
                width: 8px;
                height: 8px;
                background: #999;
                border-radius: 50%;
                animation: bounce 1.4s infinite ease-in-out;
            }}
            .typing-indicator span:nth-child(1) {{ animation-delay: 0s; }}
            .typing-indicator span:nth-child(2) {{ animation-delay: 0.2s; }}
            .typing-indicator span:nth-child(3) {{ animation-delay: 0.4s; }}
            @keyframes bounce {{
                0%, 80%, 100% {{ transform: scale(0); }}
                40% {{ transform: scale(1); }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-top">
                    <h1>🤖 CAPS AI</h1>
                    <span class="model-badge">{config['name']}</span>
                </div>
                <div class="model-info">{config['description']} | {config['speed']}</div>
                <a href="/" class="back-btn">← Models</a>
            </div>
            <div class="chat-container" id="chatContainer">
                <div class="welcome">
                    <h3>👋 Welcome to CAPS AI!</h3>
                    <p>I'm running locally on your device. Your conversations stay private and work offline.</p>
                </div>
            </div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Type a message..." autocomplete="off">
                <button id="sendBtn">Send</button>
            </div>
        </div>

        <script>
            const chatContainer = document.getElementById('chatContainer');
            const messageInput = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendBtn');
            let isGenerating = false;

            // Load system prompt
            const SYSTEM_PROMPT = `You are CAPS AI, a helpful AI assistant for students. You provide clear, educational answers with examples. Keep responses concise (2-4 sentences for simple questions, longer for complex topics). You can help with explaining concepts, brainstorming, writing assistance, math problems, and general questions. Always be encouraging and supportive.`;

            function addMessage(role, content) {{
                const div = document.createElement('div');
                div.className = `message ${{role}}`;
                div.innerHTML = `<div class="message-content"></div>`;
                div.querySelector('.message-content').textContent = content;
                chatContainer.appendChild(div);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                return div;
            }}

            function showTyping() {{
                const div = document.createElement('div');
                div.className = 'message assistant';
                div.id = 'typing';
                div.innerHTML = `
                    <div class="message-content">
                        <div class="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                `;
                chatContainer.appendChild(div);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }}

            function removeTyping() {{
                const typing = document.getElementById('typing');
                if (typing) typing.remove();
            }}

            async function sendMessage() {{
                const message = messageInput.value.trim();
                if (!message || isGenerating) return;

                messageInput.value = '';
                addMessage('user', message);
                showTyping();
                sendBtn.disabled = true;
                isGenerating = true;

                try {{
                    const response = await fetch('/generate', {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify({{
                            messages: [
                                {{role: 'system', content: SYSTEM_PROMPT}},
                                {{role: 'user', content: message}}
                            ],
                            model: '{model_key}'
                        }})
                    }});

                    removeTyping();
                    
                    if (response.ok) {{
                        const data = await response.json();
                        addMessage('assistant', data.content);
                    }} else {{
                        const error = await response.json();
                        addMessage('assistant', '⚠️ Error: ' + (error.detail || 'Something went wrong'));
                    }}
                }} catch (e) {{
                    removeTyping();
                    addMessage('assistant', '⚠️ Network error. Please check your connection.');
                }}

                sendBtn.disabled = false;
                isGenerating = false;
                messageInput.focus();
            }}

            sendBtn.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', (e) => {{
                if (e.key === 'Enter') sendMessage();
            }});
            
            // Focus input on load
            messageInput.focus();
        </script>
    </body>
    </html>
    """

@app.post("/generate")
async def generate(request: ChatRequest):
    """Generate text using the specified model"""
    global CURRENT_MODEL_KEY
    
    model_key = request.model or CURRENT_MODEL_KEY or "lfm2-350m"
    
    if model_key not in AVAILABLE_MODELS:
        available = ", ".join(AVAILABLE_MODELS.keys())
        raise HTTPException(status_code=404, detail=f"Model '{model_key}' not found. Available: {available}")
    
    # Check if downloaded
    download_status = check_download_status(model_key)
    if not download_status['downloaded']:
        model_name = AVAILABLE_MODELS[model_key]['name']
        raise HTTPException(
            status_code=503, 
            detail=f"Model '{model_name}' is not downloaded. Please download it first via the Model Manager UI at http://localhost:5000/"
        )
    
    # Check if in memory, if not load it (and unload others)
    if not model_status[model_key].ready:
        # Unload current model if different
        if CURRENT_MODEL_KEY and CURRENT_MODEL_KEY != model_key and CURRENT_MODEL_KEY in models:
            unload_model(CURRENT_MODEL_KEY)
        
        # Load requested model
        CURRENT_MODEL_KEY = model_key
        load_model_thread(model_key)
        
        # Wait for loading (with timeout)
        timeout = 60  # seconds
        start = time.time()
        while not model_status[model_key].ready and time.time() - start < timeout:
            time.sleep(0.1)
        
        if not model_status[model_key].ready:
            raise HTTPException(status_code=503, detail="Model is still loading. Please try again in a moment.")
    
    CURRENT_MODEL_KEY = model_key
    
    # Generate response
    try:
        from llama_cpp import Llama
        
        # Format messages for the model
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        output = models[model_key].create_chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7,
            stop=["</s>", "<|im_end|>", "<|endoftext|>"]
        )
        
        content = output["choices"][0]["message"]["content"]
        return {"content": content}
        
    except Exception as e:
        print(f"Generation error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/api/status")
async def api_status():
    """Get current status of all models"""
    # Refresh status from filesystem
    update_model_status_from_files()
    
    return {
        "current_model": CURRENT_MODEL_KEY,
        "models": AVAILABLE_MODELS,
        "status": {
            key: {
                "step": model_status[key].step,
                "progress": model_status[key].progress,
                "error": model_status[key].error,
                "ready": model_status[key].ready,
                "downloaded": model_status[key].downloaded,
                "loading": model_status[key].loading,
                "partial": model_status[key].partial,
                "downloaded_bytes": model_status[key].downloaded_bytes,
                "total_bytes": model_status[key].total_bytes
            }
            for key in AVAILABLE_MODELS
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "CAPS AI Service"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
