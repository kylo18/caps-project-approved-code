import { useState, useEffect } from "react";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  setCustomApiUrl,
  normalizeApiBaseUrl,
  stripApiBaseUrl,
} from "../utils/config";
import useToast from "../hooks/useToast";
import Toast from "./Toast";

const DEFAULT_TEST_IP = "18.142.190.113";
const DEFAULT_TEST_PORT = "8000";
const DEFAULT_LOCAL_PORT = "8000";

const parseUrlParts = (url) => {
  const cleaned = stripApiBaseUrl(url);
  const match = cleaned.match(/^https?:\/\/([^:/]+)(?::(\d+))?/i);
  if (!match) return null;
  return {
    host: match[1],
    port: match[2] || "",
  };
};

const ServerConfigModal = ({ isOpen, onClose, onSave }) => {
  const [serverType, setServerType] = useState("local");
  const [localIp, setLocalIp] = useState("");
  const [localPort, setLocalPort] = useState(DEFAULT_LOCAL_PORT);
  const [testServerIp, setTestServerIp] = useState(DEFAULT_TEST_IP);
  const [testServerPort, setTestServerPort] = useState(DEFAULT_TEST_PORT);
  const [customUrl, setCustomUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const savedUrl = getApiBaseUrl();
    const savedBase = stripApiBaseUrl(savedUrl);

    if (savedBase) {
      if (savedBase.includes(DEFAULT_TEST_IP)) {
        setServerType("test");
        const parts = parseUrlParts(savedBase);
        if (parts) {
          setTestServerIp(parts.host);
          setTestServerPort(parts.port || DEFAULT_TEST_PORT);
        }
      } else if (savedBase.startsWith("http://") || savedBase.startsWith("https://")) {
        setServerType("local");
        const parts = parseUrlParts(savedBase);
        if (parts) {
          setLocalIp(parts.host);
          setLocalPort(parts.port || DEFAULT_LOCAL_PORT);
        }
      } else {
        setServerType("custom");
        setCustomUrl(savedBase);
      }
    } else {
      setTestServerIp(DEFAULT_TEST_IP);
      setTestServerPort(DEFAULT_TEST_PORT);
      setLocalPort(DEFAULT_LOCAL_PORT);
    }
  }, [isOpen]);

  const buildBaseUrl = () => {
    if (serverType === "local") {
      return `http://${localIp}:${localPort}`;
    }
    if (serverType === "test") {
      return `http://${testServerIp}:${testServerPort}`;
    }
    return customUrl;
  };

  const handleTestConnection = async () => {
    setIsLoading(true);

    const baseUrl = buildBaseUrl();
    if (!baseUrl) {
      showToast("Please enter a valid server URL.", "error");
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = normalizeApiBaseUrl(baseUrl);
      const testEndpoint = `${apiBase}/app-version`;
      const response = await fetch(testEndpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        showToast(
          `Connected! Server version: ${data.version || "OK"}`,
          "success",
        );
      } else {
        const text = await response.text();
        if (text.startsWith("<")) {
          showToast("Server returned HTML (not JSON). Check URL format.", "error");
        } else {
          showToast(`Server error ${response.status}: ${text.substring(0, 100)}`, "error");
        }
      }
    } catch (error) {
      showToast("Cannot reach the server. Check URL and network.", "error");
      console.error("Connection test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    let apiUrl = "";

    if (serverType === "local") {
      if (!localIp || !localPort) {
        showToast("Please enter both IP address and port", "error");
        return;
      }
      apiUrl = setApiBaseUrl(localIp, localPort);
    } else if (serverType === "test") {
      if (!testServerIp || !testServerPort) {
        showToast("Please enter both IP and port", "error");
        return;
      }
      apiUrl = setApiBaseUrl(testServerIp, testServerPort);
    } else if (serverType === "custom") {
      if (!customUrl) {
        showToast("Please enter the custom URL", "error");
        return;
      }
      apiUrl = setCustomApiUrl(customUrl);
    }

    showToast("Server configuration saved!", "success");
    onSave?.(apiUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-[1000] flex items-center justify-center animate-fade-in">
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Server Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <p className="text-sm text-gray-600 mb-4">
            Choose which server the app should connect to. The app will append{" "}
            <span className="font-semibold">/api</span> automatically.
          </p>

          {/* Server Type Selection */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="serverType"
                value="local"
                checked={serverType === "local"}
                onChange={(e) => setServerType(e.target.value)}
                className="w-4 h-4 text-[#FE6902] focus:ring-[#FE6902]"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-800">Local Development</span>
                <span className="block text-xs text-gray-500">Docker on your laptop</span>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="serverType"
                value="test"
                checked={serverType === "test"}
                onChange={(e) => setServerType(e.target.value)}
                className="w-4 h-4 text-[#FE6902] focus:ring-[#FE6902]"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-800">Test Server (AWS)</span>
                <span className="block text-xs text-gray-500">caps-test2-api.coeofjrmsu.com</span>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="serverType"
                value="custom"
                checked={serverType === "custom"}
                onChange={(e) => setServerType(e.target.value)}
                className="w-4 h-4 text-[#FE6902] focus:ring-[#FE6902]"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-800">Custom URL</span>
                <span className="block text-xs text-gray-500">Enter full base URL</span>
              </div>
            </label>
          </div>

          {/* Input Fields */}
          {serverType === "local" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Laptop IP Address & Port
              </label>
              <div className="flex items-center mb-2">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 text-sm">
                  http://
                </span>
                <input
                  type="text"
                  value={localIp}
                  onChange={(e) => setLocalIp(e.target.value)}
                  placeholder="192.168.1.5"
                  className="flex-1 px-3 py-2 border border-gray-300 focus:border-[#FE6902] focus:outline-none text-sm"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-r-0 border-gray-300 text-gray-600 text-sm">
                  :
                </span>
                <input
                  type="text"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                  placeholder={DEFAULT_LOCAL_PORT}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-r-xl focus:border-[#FE6902] focus:outline-none text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                Default: {DEFAULT_LOCAL_PORT} (editable for custom Docker ports)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
              </p>
            </div>
          )}

          {serverType === "test" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Server URL
              </label>
              <div className="flex items-center mb-2">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 text-sm">
                  http://
                </span>
                <input
                  type="text"
                  value={testServerIp}
                  onChange={(e) => setTestServerIp(e.target.value)}
                  placeholder={DEFAULT_TEST_IP}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:border-[#FE6902] focus:outline-none text-sm"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-r-0 border-gray-300 text-gray-600 text-sm">
                  :
                </span>
                <input
                  type="text"
                  value={testServerPort}
                  onChange={(e) => setTestServerPort(e.target.value)}
                  placeholder={DEFAULT_TEST_PORT}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-r-xl focus:border-[#FE6902] focus:outline-none text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                Default: {DEFAULT_TEST_IP}:{DEFAULT_TEST_PORT} (editable)
              </p>
              <p className="text-xs text-green-600 mt-1">
                OK: Pre-filled with verified working test server
              </p>
            </div>
          )}

          {serverType === "custom" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Server URL
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-domain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-[#FE6902] focus:outline-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base URL only (NO /api). Example: http://localhost:8000
              </p>
              <p className="text-xs text-orange-500 mt-1 font-medium">
                Note: /api will be added automatically
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#FE6902] rounded-xl text-white font-medium hover:bg-[#e55f02] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigModal;
