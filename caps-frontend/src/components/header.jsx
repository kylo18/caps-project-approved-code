import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";

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
      <div className="z-52 min-h-[48px] h-[48px] fixed top-0 left-0 w-full flex items-center justify-between bg-white px-6 py-[10px] border-b border-gray-300 shadow-sm">
        <div className="text-lg font-medium text-gray-600 ml-9 mb-1 md:ml-14"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-[14px]">{title}</span>

          {/* Help Button */}
          <button className="cursor-pointer flex items-center gap-1 px-2 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-200">
            <i className="bx bx-question-mark text-md"></i>
            <span className="hidden sm:inline text-[14px] pr-1.5">Help</span>
          </button>

          {/* Three-dot Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-0.5 hover:bg-gray-300 cursor-pointer -mr-4 rounded-full flex items-center justify-end"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="bx bx-dots-vertical-rounded text-[25px]"></i>
            </button>

            {dropdownOpen && (
              <div className="absolute right-[-18px] top-[44px] w-25 bg-white border border-gray-300 shadow-md rounded-md">
                <button
                  onClick={handleLogout}
                  className="cursor-pointer text-[14px] block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 transition duration-200 ease-in-out rounded-md"
                >
                  Log-out
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
