import { useState, useRef, useEffect } from "react";

// Custom styled Dropdown
const CustomDropdown = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom"); // "bottom" or "top"
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
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

  // Function to handle opening dropdown with correct position
  const handleOpenDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Set dropdown position BEFORE opening
      setDropdownPosition(
        spaceBelow < 150 && spaceAbove > spaceBelow ? "top" : "bottom",
      );
    }

    setIsOpen(true); // Open dropdown AFTER position is set
  };

  return (
    <div className="flex items-center gap-2 text-[12px]" ref={dropdownRef}>
      {/* Label beside the dropdown */}
      <label className="text-[14px] text-gray-700">{label}:</label>

      <div className="relative w-full max-w-[200px]">
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className="relative flex w-full min-w-[83px] cursor-pointer items-center border-b border-gray-300 bg-white px-3 py-2 transition-all duration-100 hover:border-gray-500 focus:border-b-2 focus:border-orange-500"
        >
          <span className={`truncate ${!value ? "text-gray-400" : ""}`}>
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>

          <i
            className={`bx bx-chevron-down absolute right-0 text-[18px] transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`absolute z-10 w-full rounded-sm border border-gray-300 bg-white shadow-md ${dropdownPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"}`}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-[14px] transition hover:bg-orange-500 hover:text-white"
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

export default CustomDropdown;
