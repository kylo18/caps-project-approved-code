import React, { useEffect, useState } from "react";

// Confirmation Modal
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isLoading,
  showCountdown = false,
  countdownSeconds = 6,
}) => {
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen || !showCountdown) {
      setCountdown(countdownSeconds);
      return;
    }
    setCountdown(countdownSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, showCountdown, countdownSeconds]);

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-55 flex items-center justify-center">
      <div className="animate-fade-in-up relative mx-3 flex w-80 max-w-sm flex-col items-center rounded-xl bg-white p-5 shadow-xl sm:max-w-md">
        <div className="mt-2 mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="orange" />
              <text
                x="16"
                y="23"
                textAnchor="middle"
                fontSize="20"
                fontWeight="bold"
                fill="#FFF"
              >
                !
              </text>
            </svg>
          </div>
        </div>
        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
          Are you sure?
        </h2>
        {/* Description */}
        <p className="mb-6 text-center text-sm text-gray-500">
          {message ||
            "This action can't be undone. Please confirm if you want to proceed."}
        </p>
        {/* Buttons row */}
        <div className="flex w-full justify-center gap-3">
          <button
            className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-100 focus:ring-orange-200 focus:outline-none"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="flex cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-6 py-2 text-[15px] font-medium text-white hover:bg-orange-600 focus:ring-orange-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirm}
            disabled={isLoading || (showCountdown && countdown > 0)}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <span className="loader-white"></span>
              </div>
            ) : showCountdown && countdown > 0 ? (
              <>Confirm ({countdown})</>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
