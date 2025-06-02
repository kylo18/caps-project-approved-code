import React from "react";

// Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 lightbox-bg fixed inset-0 z-57 flex items-center justify-center">
      <div className="w-full max-w-md rounded-md bg-white shadow-lg">
        {/* Yellow top border */}
        <div className="h-2 w-full rounded-t-md bg-[rgb(249,115,22)]" />
        <div className="flex flex-row items-center gap-6 px-6 py-6">
          {/* Warning icon - diamond with exclamation mark */}
          <div
            className="flex flex-shrink-0 items-center justify-center overflow-visible p-1"
            style={{ height: "64px", width: "64px" }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="28"
                y="4"
                width="36"
                height="36"
                rx="5"
                transform="rotate(45 28 4)"
                fill="#f97316"
                stroke="#f97316"
                strokeWidth="2"
              />

              <text
                x="28"
                y="38"
                textAnchor="middle"
                fontSize="26"
                fontWeight="bold"
                fill="#FFF"
              >
                !
              </text>
            </svg>
          </div>
          {/* Text content */}
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              Confirmation
            </h2>
            <p className="mb-2 text-sm text-gray-700">
              {message ||
                "You are about to leave this page without saving. All changes will be lost. Do you really want to leave without saving?"}
            </p>
          </div>
        </div>
        {/* Divider */}
        <div className="h-[0.5px] bg-[rgb(200,200,200)]" />

        {/* Buttons row */}
        <div className="flex w-full justify-end gap-2 px-4 py-3">
          <button
            className="bg-whie border-color flex cursor-pointer items-center gap-1 rounded-md border px-[12px] py-[6px] text-gray-700 hover:bg-gray-200"
            onClick={onClose}
            disabled={isLoading}
          >
            <span className="inline text-[14px]">Cancel</span>
          </button>
          <button
            className="flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[18px] py-[6px] text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <span className="inline text-[14px]">Confirm</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
