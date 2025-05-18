import React from "react";

// Loading Overlay
const LoadingOverlay = ({ show = false }) => {
  if (!show) return null;

  return (
    <div className="lightbox-bg bg-opacity-50 fixed inset-0 z-56 flex flex-col items-center justify-center">
      <i className="bx bxs-cog mb-2 animate-spin text-5xl text-white"></i>
    </div>
  );
};

export default LoadingOverlay;
