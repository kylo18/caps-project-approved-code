import React from "react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="lightbox-bg bg-opacity-50 fixed inset-0 z-100 flex flex-col items-center justify-center">
      <div className="font-inter border-color relative mx-auto w-full max-w-sm rounded-t-md border-b bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
        <span>Confirm Action</span>
      </div>
      <div className="w-96 rounded-b-md bg-white p-6 text-sm shadow-lg">
        <p className="text-gray-700">{message}</p>
        <div className="mt-8 flex justify-end gap-2">
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
