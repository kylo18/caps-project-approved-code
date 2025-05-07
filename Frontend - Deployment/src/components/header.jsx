import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./loadingOverlay";
import { Tooltip } from "flowbite-react";

const AdminHeader = ({ title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dropdownRef = useRef(null);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [apiUrl]);

  // Handle the logout process
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
    }
  };

  // Close the dropdown when clicking outside
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Client-side validation
    if (formData.new_password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Password changed successfully.");
        setFormData({
          password: "",
          new_password: "",
          new_password_confirmation: "",
        });

        setToast({
          message: "Password changed successfully!",
          type: "success",
          show: true,
        });

        setShowChangePassword(false);
      } else {
        setError(result.message || "Failed to change password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      console.error("Change password error:", err);
    }
  };

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
                    {userInfo?.fullName
                      ? (() => {
                          const parts = userInfo.fullName.trim().split(" ");
                          const firstInitial = parts[0]?.[0] || "";
                          const lastInitial =
                            parts.length > 1 ? parts[parts.length - 1][0] : "";
                          return (firstInitial + lastInitial).toUpperCase();
                        })()
                      : "NN"}
                  </div>

                  <div className="flex w-full flex-col overflow-hidden text-sm">
                    <span className="font-inter overflow-hidden font-semibold text-ellipsis whitespace-nowrap text-gray-800">
                      {userInfo?.fullName || "Loading..."}
                    </span>
                    <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-500">
                      {userInfo?.email || "loading@email.com"}
                    </span>
                  </div>
                </div>

                <div className="mx-1 h-[1px] bg-[rgb(200,200,200)]" />

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowChangePassword((prev) => !prev);
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-lock-open-alt mr-2 text-[16px]"></i>{" "}
                  Change Password
                </button>

                <button
                  onClick={() =>
                    alert("The dark mode feature is still under development.")
                  }
                  className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-black transition duration-200 ease-in-out hover:bg-gray-200"
                >
                  <i className="bx bx-moon mr-2 text-[16px]"></i> Dark Mode
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
      </div>

      {showChangePassword && (
        <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center p-2">
          <div className="font-inter border-color relative mx-auto w-full max-w-sm rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
            <span>Change Password</span>
          </div>
          <form
            onSubmit={handleSubmit}
            className="border-color relative mx-auto w-full max-w-sm rounded-b-md border border-t-0 bg-white p-2 sm:px-4"
          >
            <div className="mb-4">
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">
                  Current Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="Enter"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] pr-10 text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                />

                <div
                  className="absolute top-5 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <i
                    className={`bx ${
                      passwordVisible ? "bx-show" : "bx-hide"
                    } text-[22px] text-orange-500`}
                  ></i>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">
                  New Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={newPasswordVisible ? "text" : "password"}
                  name="new_password"
                  placeholder="Enter"
                  value={formData.new_password}
                  onChange={handleChange}
                  required
                  className="w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] pr-10 text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                />

                <div
                  className="absolute top-5 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                >
                  <i
                    className={`bx ${
                      newPasswordVisible ? "bx-show" : "bx-hide"
                    } text-[22px] text-orange-500`}
                  ></i>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-start gap-1">
                <label className="font-color-gray text-[12px]">
                  Confirm New Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="new_password_confirmation"
                  placeholder="Enter"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full cursor-text rounded-sm border border-gray-300 bg-white px-4 py-[7px] pr-10 text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:border-transparent focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                />

                <div
                  className="absolute top-5 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                >
                  <i
                    className={`bx ${
                      confirmPasswordVisible ? "bx-show" : "bx-hide"
                    } text-[22px] text-orange-500`}
                  ></i>
                </div>
              </div>
            </div>

            <div className="-mx-2 mt-5 mb-1 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />

            {error && (
              <div className="mt-2 justify-center text-center text-[12px] text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-[12px] py-[6px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
              >
                <span className="px-1 text-[14px]">Cancel</span>
              </button>
              <button
                type="submit"
                className="mt-3 mb-2 flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[12px] py-[6px] text-white transition-all duration-150 hover:bg-orange-700"
              >
                <i className={`bx bx-check-double text-[20px]`}></i>
                <span className="pr-1.5 text-[14px]">Apply</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoggingOut && <LoadingOverlay show={isLoggingOut} />}
      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
            toast.show ? "opacity-100" : "opacity-0"
          } ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-error text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
