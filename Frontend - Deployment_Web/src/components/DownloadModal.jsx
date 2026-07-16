import { useEffect } from "react";

export default function DownloadModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null; // Don't render anything if the modal is closed

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  //const apkUrl = `${apiUrl.replace("/api", "")}/apk/CAPS.apk`; //endpoint to download the APK file
  const apkUrl = `${apiUrl.replace("/api", "")}/download/caps.apk`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-1">
          <h2 className="outfit-700 text-[22px] text-gray-900">Download CAPS</h2>
        </div>
        <p className="outfit-400 mb-6 text-sm text-gray-500">Get the CAPS app on your preferred platform.</p>

        {/* Platform list */}
        <div className="flex flex-col gap-3">

          {/* Android — available */}
          <a
            href={apkUrl}
            download
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24A10.45 10.45 0 0 0 12 8c-1.53 0-2.96.35-4.27.91L5.85 5.67a.637.637 0 0 0-.83-.22c-.3.16-.42.54-.26.85L6.6 9.48A9.86 9.86 0 0 0 2 18h20a9.86 9.86 0 0 0-4.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill="#2E7D32"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="outfit-500 text-sm font-medium text-gray-900">Android</p>
              <p className="outfit-400 text-xs text-gray-500">Download APK directly</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className="outfit-500 text-xs font-medium text-green-800">Download</span>
            </div>
          </a>

          {/* iOS — coming soon */}
          {/*
          <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-60">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#7B1FA2"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="outfit-500 text-sm font-medium text-gray-900">iOS</p>
              <p className="outfit-400 text-xs text-gray-500">App Store · Coming soon</p>
            </div>
            <span className="outfit-400 rounded-lg bg-gray-200 px-3 py-1.5 text-xs text-gray-500">Soon</span>
          </div>
          */}

          {/* Desktop — coming soon */}
          {/*
          <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-60">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="#1565C0"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="outfit-500 text-sm font-medium text-gray-900">Desktop</p>
              <p className="outfit-400 text-xs text-gray-500">Windows & Mac · Coming soon</p>
            </div>
            <span className="outfit-400 rounded-lg bg-gray-200 px-3 py-1.5 text-xs text-gray-500">Soon</span>
          </div>
          */}

        </div>

        <p className="outfit-400 mt-6 text-center text-[11px] text-gray-400">
          CAPS · JRMSU College of Engineering
        </p>
      </div>
    </div>
  );
}
