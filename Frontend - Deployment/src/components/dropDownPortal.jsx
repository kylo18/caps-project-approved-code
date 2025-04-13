// components/DropdownPortal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function DropdownPortal({ children, position }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const dropdown = dropdownRef.current;
    if (dropdown && position) {
      dropdown.style.top = `${position.top}px`;
      dropdown.style.left = `${position.left}px`;
    }
  }, [position]);

  return createPortal(
    <div
      ref={dropdownRef}
      className="absolute z-50 w-28 bg-white rounded shadow-md"
      style={{ position: "absolute" }}
    >
      {children}
    </div>,
    document.body
  );
}
