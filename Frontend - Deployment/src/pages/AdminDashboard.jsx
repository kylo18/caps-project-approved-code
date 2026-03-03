import React, { Fragment, useEffect, useState, useRef } from "react";
import ComingSoon from "../assets/icons/comingsoon.png";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("search"); // "create", "search", "upload"

  return (
    <>
      <div className="outfit-400 mt-8 text-center text-gray-500">
        <div className="flex flex-col items-center justify-center py-10">
          <img
            src={ComingSoon}
            alt="Dashboard coming soon "
            className="mb-2 h-32 w-32 opacity-80"
          />
          <span className="w-90 text-[15px] text-gray-500">
            The dashboard is still under development. To add questions, please
            select sa subject from the sidebar.
          </span>
        </div>
      </div>

      {/*<div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-pink-50 to-white pt-8 pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-medium text-gray-800">
              Good afternoon, undefined 👋 Let's get started.
            </h1>
            <button className="flex items-center gap-2 text-gray-800 transition-colors hover:text-gray-600">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              <span className="font-medium">Enter code</span>
            </button>
          </div>

          <div className="relative mb-6 flex items-center justify-center">
            <button
              onClick={() => setActiveTab("create")}
              className={`relative flex flex-col items-center justify-center transition-all`}
            >
              <svg
                width="130"
                height="70"
                viewBox="0 0 260 140"
                className="drop-shadow-md"
              >
                <path
                  d="
                    M 40 0
                    H 220
                    Q 240 0 240 20
                    L 260 120
                    Q 260 140 240 140
                    H 20
                    Q 0 140 0 120
                    V 20
                    Q 0 0 40 0
                  "
                  fill={activeTab === "create" ? "#ec4899" : "#9ca3af"}
                />
              </svg>

              <div
                className={`absolute top-0 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                  activeTab === "create"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-400 text-gray-200"
                }`}
                style={{
                  transform: "translateY(-50%)", // Moves the circle up so it overlaps the SVG
                }}
              >
                <i className="bx bx-plus text-lg"></i>
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-white">Create</div>
                <div className="text-sm text-white">a resource</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("search")}
              className={`relative flex flex-col items-center justify-center transition-all`}
            >
              <svg
                width="130"
                height="70"
                viewBox="0 0 260 140"
                className="drop-shadow-md"
              >
                <path
                  d="
                  M 0 20
                  Q 0 0 20 0
                  H 240
                  Q 260 0 260 20
                  L 240 120
                  Q 230 160 150 140
                  H 60
                 Q 30 150 20 110
                  Z
                "
                  fill={activeTab === "search" ? "#ec4899" : "#9ca3af"}
                />
              </svg>

              <div
                className={`absolute top-0 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                  activeTab === "search"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-400 text-gray-200"
                }`}
                style={{
                  transform: "translateY(-50%)", // Moves the circle up so it overlaps the SVG
                }}
              >
                <i className="bx bx-plus text-lg"></i>
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-white">Create</div>
                <div className="text-sm text-white">a resource</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`relative flex flex-col items-center justify-center transition-all`}
            >
              <svg
                width="130"
                height="70"
                viewBox="0 0 260 140"
                className="drop-shadow-md"
              >
                <path
                  d="
                  M 260 0
                  H 40
                  Q 20 0 20 20
                  L 0 120
                  Q 0 140 25 140
                  H 240
                  Q 260 140 260 120
                  V 20
                  Q 260 0 240 0
                  Z
                "
                  fill={activeTab === "upload" ? "#ec4899" : "#9ca3af"}
                />
              </svg>
              <div
                className={`absolute top-0 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                  activeTab === "upload"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-400 text-gray-200"
                }`}
                style={{
                  transform: "translateY(-50%)", // Moves the circle up so it overlaps the SVG
                }}
              >
                <i className="bx bx-plus text-lg"></i>
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-white">Create</div>
                <div className="text-sm text-white">a resource</div>
              </div>
            </button>
          </div>

          {activeTab === "search" && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="relative max-w-2xl flex-1">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 transform">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search for any topic"
                  className="w-full rounded-xl border border-gray-200 py-4 pr-4 pl-12 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
                <button className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded-lg bg-pink-500 p-3 text-white transition-colors hover:bg-pink-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-gray-700">Browse resources for</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-800 underline decoration-pink-500 decoration-2">
                University
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Topics</h2>
            <a
              href="#"
              className="text-gray-700 transition-colors hover:text-pink-500"
            >
              See all →
            </a>
          </div>

          <div className="flex cursor-pointer items-center justify-between rounded-lg p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="font-medium text-gray-800">
                Topic 1 Anatomy and Physiology
              </span>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>*/}
    </>
  );
};

export default AdminDashboard;
