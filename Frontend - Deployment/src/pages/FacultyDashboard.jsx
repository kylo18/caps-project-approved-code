import { useState } from "react";

export default function HomeTabs() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="-mx-2 bg-gradient-to-b from-orange-100 to-[rgb(250,250,250)] p-8">
      {/* Greeting */}
      <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">
        Good afternoon, Vincent 👋
      </h2>

      {/* Tabs */}
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 bg-black p-4">
        <TabButton
          label="Create"
          isActive={activeTab === "create"}
          onClick={() => setActiveTab("create")}
        />
        <TabButton
          label="Search"
          isActive={activeTab === "search"}
          onClick={() => setActiveTab("search")}
        />
        <TabButton
          label="Upload"
          isActive={activeTab === "upload"}
          onClick={() => setActiveTab("upload")}
        />
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === "search" && (
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3 shadow-sm">
              <input
                type="text"
                placeholder="Search quizzes, questions, or subjects"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button className="rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
                Search
              </button>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <p className="text-center text-sm text-gray-500">
            Start creating a new quiz or resource
          </p>
        )}

        {activeTab === "upload" && (
          <p className="text-center text-sm text-gray-400">
            Upload feature coming soon
          </p>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, isActive, onClick }) {
  const trapezoidPath =
    "M 5 5 " + // Start at top-left
    "Q 5 3 8 3 " + // Rounded top-left corner
    "L 92 3 " + // Top edge (wide: 5 to 95)
    "Q 95 3 95 5 " + // Rounded top-right corner
    "L 85 55 " + // Right side (tapered: 95 -> 85)
    "Q 85 57 82 57 " + // Rounded bottom-right corner
    "L 18 57 " + // Bottom edge (narrow: 15 to 85)
    "Q 15 57 15 55 " + // Rounded bottom-left corner
    "L 5 5 Z"; // Left side (tapered: 5 -> 15) back to start

  return (
    <button
      onClick={onClick}
      className={`relative flex-1 transition-all duration-300 ${
        isActive ? "scale-105 brightness-110" : "opacity-80 hover:opacity-100"
      }`}
      style={{ height: "100px", width: "100%" }}
    >
      {/* SVG Rounded Trapezoid Shape - White on black background */}
      <svg
        viewBox="0 0 100 60"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d={trapezoidPath}
          fill="#ffffff"
          className="transition-all duration-300"
        />
      </svg>

      {/* Label overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={`text-sm font-bold ${
            isActive ? "text-black" : "text-gray-800"
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
