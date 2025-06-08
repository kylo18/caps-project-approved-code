import React from "react";

// Tooltip for Sidebar menu items
const ToolTip = ({ label, isExpanded, children }) => {
  return (
    <div className="group relative">
      {children}
      {!isExpanded && (
        <div className="pointer-events-none absolute top-1/2 left-full z-10 ml-3 inline-block -translate-y-1/2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          {label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-gray-700"></div>
        </div>
      )}
    </div>
  );
};

export default ToolTip;
