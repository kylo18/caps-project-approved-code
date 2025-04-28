import { useState, useRef, useEffect } from "react";

const SortCustomDropdown = ({
  name,
  value,
  onChange,
  options,
  placeholder,
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
          className="border-color relative flex w-full cursor-pointer items-center rounded-md border bg-white px-3 py-2 shadow-sm"
        >
          <span className={`truncate ${!value ? "text-gray-400" : ""}`}>
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <i
            className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`absolute z-50 w-full max-w-full border border-gray-300 bg-white shadow-md sm:min-w-[180px] ${dropdownPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"}`}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-[14px] transition hover:bg-orange-500 hover:text-white ${
                  value === option.value ? "bg-orange-500 text-white" : ""
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
