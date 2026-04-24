import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
// Custom Dropdown for Register but smaller
const RegisterDropDown = ({ name, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const [menuRect, setMenuRect] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideTrigger =
        dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedInsideMenu =
        menuRef.current && menuRef.current.contains(event.target);

      if (!clickedInsideTrigger && !clickedInsideMenu) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuRect({
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      });
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

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
    <div className="outfit-500 flex w-full items-center gap-2 text-[14px]">
      <div
        className="relative w-full max-w-full sm:min-w-[180px]"
        ref={dropdownRef}
      >
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          className={`relative mb-1 flex w-full cursor-pointer items-center rounded-xl border bg-white px-4 py-[7px] text-[14px] transition-all duration-200 ease-in-out outline-none hover:border-gray-500 focus:outline-none ${
            isOpen
              ? "border-orange-400 ring-1 ring-orange-500 ring-offset-1"
              : "border-gray-300"
          }`}
        >
          <span className={`truncate ${!value ? "text-gray-500" : ""}`}>
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <i
            className={`bx bx-chevron-down absolute right-2 text-[18px] transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
          ></i>
        </button>

        {/* Dropdown Options */}
        {isOpen &&
          menuRect &&
          createPortal(
            <ul
              ref={menuRef}
              className="custom-scrollbar outfit-500 animate-dropdown animate-fadein fixed z-[200] max-h-[240px] overflow-y-auto rounded-md border border-gray-300 bg-white p-1 shadow-lg"
              style={{
                left: menuRect.left,
                width: menuRect.width,
                top:
                  dropdownPosition === "bottom"
                    ? menuRect.bottom + 6
                    : menuRect.top - 6,
                transform:
                  dropdownPosition === "bottom"
                    ? "translateY(0)"
                    : "translateY(-100%)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {options.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange({ target: { name, value: option.value } });
                    setIsOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-[13px] hover:bg-gray-100"
                >
                  {option.label}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default RegisterDropDown;
