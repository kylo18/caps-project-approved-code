import React, { useRef } from "react";

const EditProfileModal = ({ isOpen, onClose }) => {
  return (
    <div className="font-inter bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
      <div className="edit-profile-modal-scrollbar relative mx-2 max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-md bg-white shadow-2xl">
        {/* X Close Button */}

        {/* Header */}
        <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
          <h2 className="text-[14px] font-medium text-gray-700">
            User Information
          </h2>

          <button
            onClick={() => setShowModal(false)}
            className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
            title="Close"
          >
            <i className="bx bx-x text-[20px]"></i>
          </button>
        </div>

        {/* Content */}
        <form className="px-5 py-4">
          {/* Fields */}
          <div className="mb-4 grid grid-cols-2 gap-x-4 text-start">
            <div>
              <span className="block text-[14px] text-gray-700">
                First name
              </span>
              <input
                className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                defaultValue="Stijn Hendrikse"
              />
            </div>
            <div>
              <span className="block text-[14px] text-gray-700">Last name</span>
              <input
                className="peer mt-1 mb-2 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                defaultValue="stijn@kalungi.com"
              />
            </div>
            <div>
              <span className="block text-[14px] text-gray-700">Campus</span>
              <input
                className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                defaultValue="Kalungi"
              />
            </div>
            <div>
              <span className="block text-[14px] text-gray-700">Position</span>
              <input
                className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                defaultValue="CMO"
              />
            </div>
          </div>

          <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

          {/* Time zone */}
          <div className="mb-4">
            <span className="block text-start text-[14px] text-gray-700">
              Program
            </span>
            <input
              className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
              defaultValue="Bachelor of Science in Teacher Education"
            />
            <div className="mt-1 text-start text-[11px] text-gray-400">
              The program the user is assigned to. Used to filter subjects and
              academic content specific to your curriculum.
            </div>
          </div>

          {/* Account details */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <span className="block text-start text-[14px] text-gray-700">
                  User Code
                </span>
                <input
                  className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  defaultValue="23-A-12345"
                />
              </div>
              <div>
                <span className="block text-start text-[14px] text-gray-700">
                  Email Address
                </span>
                <input
                  className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                  defaultValue="stijn@kalungi.com"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

          {/* Delete account */}
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="block text-start text-[14px] text-gray-700">
                Approval Status:
              </span>
              <span className="text-[14px] font-semibold text-green-700">
                Registered
              </span>
            </div>
            <div className="flex justify-between">
              <span className="block text-start text-[14px] text-gray-700">
                Account Status:
              </span>
              <span className="text-[14px] font-semibold text-green-700">
                Active
              </span>
            </div>
          </div>
          <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

          <div className="flex flex-col">
            <span className="block text-start text-[14px] font-semibold text-gray-700">
              Deactivate this Account?
            </span>
            <div className="mt-1 text-start text-[11px] text-gray-400">
              Deactivating this account will disable access without deleting the
              users data. You can reactivate it at any time.
            </div>
            <button className="mt-2 cursor-pointer rounded-md border border-red-500 bg-red-100 px-4 py-2 text-sm font-medium text-red-500 shadow hover:bg-red-200">
              Deactivate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
