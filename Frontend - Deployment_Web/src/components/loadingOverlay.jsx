import React from "react";

// Loading Overlay
const LoadingOverlay = ({ show = false, message, contained = false }) => {
  if (!show) return null;

  if (contained) {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white"
      >
        <i className="bx bx-loader-alt animate-spin text-3xl text-gray-500"></i>
        {message && (
          <p className="outfit-400 mt-3 text-sm font-medium text-gray-500">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="lightbox-bg bg-opacity-50 fixed inset-0 z-[9999] flex flex-col items-center justify-center">
      <i className="loader-white"></i>
      {message && (
        <p className="outfit-400 mt-4 text-sm font-medium text-white">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingOverlay;
