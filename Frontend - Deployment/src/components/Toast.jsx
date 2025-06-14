import React from "react";

const Toast = ({ message, type, show }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
        show ? "opacity-100" : "opacity-0"
      } ${type === "success" ? "border-green-400" : "border-red-400"}`}
    >
      <div className="flex items-center">
        <i
          className={`mr-3 text-[24px] ${
            type === "success"
              ? "bx bxs-check-circle text-green-400"
              : "bx bxs-x-circle text-red-400"
          }`}
        ></i>
        <div>
          <p className="font-semibold text-gray-800">
            {type === "success" ? "Success" : "Error"}
          </p>
          <p className="mb-1 text-sm text-nowrap text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
