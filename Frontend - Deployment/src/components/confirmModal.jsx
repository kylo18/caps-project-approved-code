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
  shiftHintText = undefined,
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
    <div className="lightbox-bg outfit-500 fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="animate-fade-in-up relative mx-3 flex w-full max-w-md flex-col rounded-2xl bg-white px-6 py-4 shadow-2xl">
        {/* Title & Description */}
        <div className="">
          <h2 className="text-left text-[20px] font-bold text-gray-800">
            Are you sure?
          </h2>
          <p className="mb-2 text-left text-[14px] text-gray-800">
            {message ||
              "This will remove all embeds on this message for everyone."}
          </p>
          {shiftHintText && (
            <p className="mt-2 mb-2 text-left text-[14px] text-gray-400">
              {shiftHintText}
            </p>
          )}
        </div>
        {/* Buttons row */}
        <div className="mt-10 flex w-full justify-end gap-3">
          <button
            className="border-color flex h-9 cursor-pointer items-center justify-center rounded-lg border bg-white px-5 text-[14px] font-medium text-gray-700 hover:bg-gray-100 focus:ring-orange-200 focus:outline-none"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="flex h-9 cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-5 text-[14px] font-medium text-white hover:bg-orange-600 focus:ring-orange-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
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
