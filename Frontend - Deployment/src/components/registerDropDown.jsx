import { useState, useRef, useEffect } from "react";

// Custom Dropdown for Register
const RegisterDropDown = ({ name, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Handles click outside.
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handles open dropdown.
  const handleOpenDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setDropdownPosition(
        spaceBelow < 150 && spaceAbove > spaceBelow ? "top" : "bottom",
      );
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="flex w-full items-center gap-2 text-[14px]">
      <div
        className="relative w-full max-w-full sm:min-w-[180px]"
        ref={dropdownRef}
      >
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`relative mb-2 flex w-full cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-[12px] text-base text-gray-900 transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-black dark:text-white dark:hover:border-gray-500 ${isOpen ? "border-none ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-black" : ""}`}
        >
          <span
            className={`truncate ${!value ? "text-gray-500 dark:text-gray-400" : ""}`}
          >
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <i
            className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`absolute z-50 w-full max-w-full rounded-md border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-black sm:min-w-[180px] ${dropdownPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"}`}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-[14px] text-gray-900 transition first:rounded-t-md last:rounded-b-md hover:bg-[rgb(255,230,214)] dark:text-white dark:hover:bg-gray-800 ${value === option.value ? "bg-orange-500 text-white hover:bg-orange-500 dark:hover:bg-orange-500" : ""}`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RegisterDropDown;
