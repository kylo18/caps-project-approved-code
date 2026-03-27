import React, { useState } from "react";

const TutorialLayout = () => {
  const [activeTab, setActiveTab] = useState("login");

  const tutorials = [
    { id: "login", title: "Login" },
    { id: "register", title: "Register" },
    { id: "dashboard", title: "Dashboard" },
    { id: "profile", title: "Profile" },
    { id: "settings", title: "Settings" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "login":
        return <div className="p-6">Login Tutorial Content</div>;
      case "register":
        return <div className="p-6">Register Tutorial Content</div>;
      case "dashboard":
        return <div className="p-6">Dashboard Tutorial Content</div>;
      case "profile":
        return <div className="p-6">Profile Tutorial Content</div>;
      case "settings":
        return <div className="p-6">Settings Tutorial Content</div>;
      default:
        return <div className="p-6">Select a tutorial from the sidebar</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="mt-[41px] w-65 bg-white">
        <div className="custom-scrollbar h-[calc(100vh-40px)] overflow-y-auto">
          <div className="px-15 pt-7 pb-2">
            <h2 className="roboto text-[14px] font-bold text-gray-800">
              Getting Started
            </h2>
          </div>
          <nav>
            {tutorials.map((tutorial, index) => (
              <button
                key={tutorial.id}
                onClick={() => setActiveTab(tutorial.id)}
                className={`roboto w-full cursor-pointer px-15 py-1 text-left text-[14px] font-[500] transition-colors duration-200 hover:text-black ${
                  activeTab === tutorial.id
                    ? "text-orange-500"
                    : "text-gray-500 hover:bg-gray-50"
                } ${index === tutorials.length - 1 ? "mb-4" : ""}`}
              >
                {tutorial.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-10 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl">{renderContent()}</div>
      </div>
    </div>
  );
};

export default TutorialLayout;
