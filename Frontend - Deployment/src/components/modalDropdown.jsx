import { useState, useRef, useEffect } from "react";

const ModalDropdown = ({ name, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenDropdown = () => {
    setIsOpen((prev) => {
      const shouldOpen = !prev;

      if (shouldOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = options.length * 42; // Approximate height (42px per option)

        const enoughSpaceBelow = window.innerHeight - rect.bottom > dropdownHeight + 10;
        const enoughSpaceAbove = rect.top > dropdownHeight + 10;

        const style = {
          position: "fixed",
          left: rect.left + "px",
          width: rect.width + "px",
          zIndex: 9999,
        };

        if (enoughSpaceBelow || !enoughSpaceAbove) {
          style.top = rect.bottom + 4 + "px"; // show below
        } else {
          style.bottom = window.innerHeight - rect.top + 4 + "px"; // show above
        }

        setDropdownStyle(style);
      }

      return shouldOpen;
    });
  };

  return (
    <div className="flex items-center gap-2 text-[14px] w-full">
      <div className="relative w-full max-w-full sm:min-w-[180px]">
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`mb-2 rounded-sm cursor-pointer w-full flex items-center px-4 py-[6px] bg-white relative
            transition-all duration-200 ease-in-out outline-none focus:outline-none hover:border-gray-500
            ${isOpen ? "border-none ring-1 ring-orange-500 ring-offset-1" : "border border-gray-300"}`}
        >
          <span className={`truncate ${!value ? "text-black" : ""}`}>
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <i
            className={`bx bx-chevron-down text-[18px] transition-transform absolute right-2 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          ></i>
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <ul
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white border border-gray-300 shadow-md rounded-md max-h-[250px] overflow-y-auto"
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange({ target: { name, value: option.value } });
                setIsOpen(false);
              }}
              className={`text-[14px] px-3 py-2 cursor-pointer hover:bg-[rgb(255,230,214)] transition 
                ${value === option.value ? "bg-orange-500 text-white hover:bg-orange-500" : ""}
                first:rounded-t-md last:rounded-b-md`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModalDropdown;
