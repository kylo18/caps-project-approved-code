import React from "react";

const Toast = ({ message, type, show, onClose, onReport }) => {
  if (!message) return null;

  // Determine styles based on type
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-300" : "border-red-300";
  const iconColor = isSuccess ? "text-green-400" : "text-red-400";
  const iconCircle = isSuccess ? "#34D399" : "#F87171";
  const title = isSuccess ? "Success!" : "Something went wrong!";

  return (
    <div
      className={`fixed top-6 left-1/2 z-200 mx-auto flex max-w-lg -translate-x-1/2 transform items-center justify-between rounded-lg border px-4 py-2 shadow-md transition-opacity duration-200 ease-in-out ${
        show ? "opacity-100" : "opacity-0"
      } ${bgColor} ${borderColor}`}
      style={{ minWidth: 350 }}
    >
      <div className="flex items-center">
        <span className={`mr-3 flex-shrink-0 text-[24px] ${iconColor}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <circle cx="12" cy="12" r="10" fill={iconCircle} />
            {isSuccess ? (
              <path
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12l2.5 2.5L16 9"
              />
            ) : (
              <path
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9l-6 6m0-6l6 6"
              />
            )}
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="mb-1 text-sm break-words text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
export function logoutUser(showToast, navigate, message) {
  localStorage.removeItem("token");
  // Remove any other user data if needed
  if (showToast && message) showToast(message, "error");
  setTimeout(() => {
    if (navigate) navigate("/login");
    window.location.reload();
  }, 1800); // Adjust delay as needed to match your toast duration
}
