import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import { Tooltip } from "flowbite-react";

const AdminHeader = ({ title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dropdownRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="open-sans fixed top-0 left-0 z-52 flex h-[44px] w-full items-center justify-between border-b border-gray-300 bg-white px-6 py-[10px] shadow-sm">
        <div className="mb-1 ml-9 text-lg font-medium text-gray-600 md:ml-14"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-gray-500">{title}</span>

          {/* Help Button */}
          <Tooltip content="Help" className="text-sm">
            <button className="border-color flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-black hover:bg-gray-200">
              <i className="bx bx-question-mark text-md"></i>
              <span className="hidden pr-1.5 text-[14px] sm:inline">Help</span>
            </button>
          </Tooltip>

          {/* Three-dot Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="-mr-4 flex cursor-pointer items-center justify-end rounded-full p-0.5 hover:bg-gray-300"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="bx bx-dots-vertical-rounded text-[25px]"></i>
            </button>

            {dropdownOpen && (
              <div className="absolute top-[44px] right-[-10px] w-60 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
                <div className="flex items-center gap-3 border-gray-200 px-2 py-3">
                  <div className="flex h-8 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                    {/* Initials */}
                    PH
                  </div>
                  <div className="flex w-full flex-col overflow-hidden text-sm">
                    <span className="font-inter overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
                      Place Holder
                    </span>
                    <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500">
                      placeholder@gmail.com
                    </span>
                  </div>
                </div>

                <div className="mx-1 h-[1px] bg-[rgb(200,200,200)]" />

                <button className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200">
                  <i className="bx bx-user-circle mr-2 text-[16px]"></i> View
                  Profile
                </button>

                <button className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200">
                  <i className="bx bx-moon mr-2 text-[16px]"></i>Dark Mode
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-log-out mr-2 text-[16px]"></i> Log-out
                </button>
              </div>
            )}
          </div>
        </div>

        {isLoggingOut && <LoadingOverlay show={isLoggingOut} />}
      </div>
    </div>
  );
};

export default AdminHeader;
