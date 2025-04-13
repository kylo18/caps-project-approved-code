import React from "react";


const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="z-100 fixed inset-0 flex items-center justify-center lightbox-bg bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
        <p className="text-gray-700">{message}</p>
        <div className="mt-8 flex justify-end gap-2">
          <button 
                className="cursor-pointer flex items-center gap-1 px-2 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-200"
                onClick={onClose}
                >
                <span className="text-[16px] px-1">Cancel</span>
              </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-700 cursor-pointer">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
