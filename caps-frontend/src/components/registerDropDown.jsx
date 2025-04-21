import { useState, useRef, useEffect } from "react";

const RegisterDropDown = ({ name, value, onChange, options, placeholder }) => {
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

      setDropdownPosition(spaceBelow < 150 && spaceAbove > spaceBelow ? "top" : "bottom");
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="flex items-center gap-2 text-[14px] w-full">
      <div className="relative w-full max-w-full sm:min-w-[180px]" ref={dropdownRef}>
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`mb-2 rounded-full cursor-pointer w-full flex items-center px-4 py-2 bg-white relative
            transition-all duration-200 ease-in-out outline-none focus:outline-none hover:border-gray-500
            ${isOpen ? "border-none ring-2 ring-orange-500 ring-offset-1" : "border border-gray-300"}`}
        >

          <span className={` truncate ${!value ? "text-black" : ""}`}>
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <i className={`bx bx-chevron-down text-[18px] transition-transform absolute right-2 ${isOpen ? "rotate-180" : "rotate-0"}`}></i>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`absolute w-full max-w-full sm:min-w-[180px] bg-white border border-gray-300 shadow-md z-50 
              ${dropdownPosition === "bottom" ? "mt-1 top-full" : "mb-1 bottom-full"} 
              rounded-md`} 
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
    </div>
  );
};

export default RegisterDropDown;
