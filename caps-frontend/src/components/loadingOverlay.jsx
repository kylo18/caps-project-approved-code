// src/components/common/LoadingOverlay.jsx
import React from "react";

const LoadingOverlay = ({ show = false }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 lightbox-bg bg-opacity-50 z-56 flex flex-col justify-center items-center">
      <i className="bx bxs-cog text-white text-5xl animate-spin mb-2"></i>
    </div>
  );
};

export default LoadingOverlay;
