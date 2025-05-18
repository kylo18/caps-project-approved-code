import React from "react";

// Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-57 flex flex-col items-center justify-center p-2">
      <div className="font-inter border-color relative mx-auto w-full max-w-sm rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
        <span>Confirm Action</span>
      </div>
      <div className="border-color relative mx-auto w-full max-w-sm rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
        <p className="mt-2 mb-9 px-2 text-[14px] break-words text-gray-700">
          {message}
        </p>
        <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

        <div className="mb-2 flex justify-end gap-2 text-[14px]">
          <button
            className="flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-gray-700 hover:bg-gray-200"
            onClick={onClose}
          >
            <span className="px-1 text-[16px]">Cancel</span>
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
