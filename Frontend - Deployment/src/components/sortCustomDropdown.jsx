import { useState, useRef, useEffect } from "react";

// Handles the Sort function and the Sort Options
const SortCustomDropdown = ({
  name,
  value,
  onChange,
  options,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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
    <div className="flex w-full items-center gap-2 text-[13px]">
      <div
        className="relative w-full max-w-full sm:min-w-[150px]"
        ref={dropdownRef}
      >
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`border-color relative flex w-30 cursor-pointer items-center rounded-md border bg-white px-3 py-2 shadow-sm hover:bg-gray-100 ${className}`}
        >
          <span className={`truncate ${!value ? "text-gray-700" : ""}`}>
            {options.find(
              (opt) => opt.value === value || opt.value + "_desc" === value,
            )?.label || placeholder}
          </span>
          <i
            className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`border-color absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md border bg-white p-1 shadow-sm ${dropdownPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"}`}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className={`cursor-pointer rounded-sm px-3 py-[10px] text-[14px] text-black transition hover:bg-gray-200 ${
                  value === option.value || value === option.value + "_desc"
                    ? "text-orange-500"
                    : ""
                }`}
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

export default SortCustomDropdown;
