import { useState, useRef, useEffect } from "react";

// Handles the Sort function and the Sort Options
const SortType = ({
  name,
  value,
  onChange,
  options,
  placeholder,
  className,
  buttonLabel,
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
    <div className="open-sans flex flex-row gap-2">
      <div
        className="relative flex items-center gap-2 text-[13px]"
        ref={dropdownRef}
      >
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`border-color relative flex cursor-pointer items-center rounded-lg px-3 py-2`}
        >
          <span className={`truncate`}>{buttonLabel || placeholder}</span>
          <i
            className={`bx bx-chevron-down ml-2 text-[18px] text-gray-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`animate-dropdown animate-fadein border-color absolute top-full right-0 z-50 mt-1 w-44 origin-top-right rounded-md border bg-white p-1 shadow-sm ${dropdownPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"}`}
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

export default SortType;
