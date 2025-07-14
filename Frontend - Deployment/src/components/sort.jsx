import SortCustomDropdown from "./sortCustomDropdown";
import { useState, useRef, useEffect } from "react";

// Displays a Sort Button
const Sort = ({ sortOption, setSortOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const mainSortOptions = [
    { value: "difficulty", label: "Difficulty" },
    { value: "coverage", label: "Coverage" },
    { value: "score", label: "Score" },
    { value: "date", label: "Date Created" },
  ];

  const handleSortChange = (e) => {
    const newValue = e.target.value;

    // If clicking the same option, toggle between asc/desc
    if (newValue === sortOption) {
      // Add _desc suffix to toggle to descending
      setSortOption(newValue + "_desc");
    } else if (newValue + "_desc" === sortOption) {
      // Remove _desc suffix to toggle to ascending
      setSortOption(newValue);
    } else {
      setSortOption(newValue);
    }
  };

  // Function to get the display label with direction for dropdown
  const getDropdownLabel = (option) => {
    if (option.value === "") {
      return option.label;
    }

    const isDescending = sortOption === option.value + "_desc";
    const isSelected =
      sortOption === option.value || sortOption === option.value + "_desc";

    if (!isSelected) {
      return option.label;
    }

    return `${option.label} (${isDescending ? "Descending" : "Ascending"})`;
  };

  // Function to get the simple label for the button
  const getButtonLabel = (option) => {
    if (option.value === "") {
      return option.label;
    }
    return option.label;
  };

  return (
    <div className="open-sans flex flex-row gap-2">
      {/* Inline dropdown implementation, mimicking SortCustomDropdown */}
      <div className="flex items-center gap-2 text-[13px]">
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`border-color relative flex cursor-pointer items-center rounded-lg px-3 py-2`}
          >
            {/* Add icon before label */}
            <span className={`truncate`}>Sort by</span>
            <i className="bx bx-carets-up-down ml-2 text-[18px] text-gray-500"></i>
          </button>
          {/* Dropdown Options */}
          {isOpen && (
            <ul
              className={`animate-dropdown animate-fadein border-color absolute top-full right-0 z-50 mt-1 w-44 origin-top-right rounded-md border bg-white p-1 shadow-sm`}
            >
              {mainSortOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    handleSortChange({ target: { value: option.value } });
                    setIsOpen(false);
                  }}
                  className={`cursor-pointer rounded-sm px-3 py-[10px] text-[14px] text-black transition hover:bg-gray-200 ${
                    sortOption === option.value ||
                    sortOption === option.value + "_desc"
                      ? "text-orange-500"
                      : ""
                  }`}
                >
                  {getDropdownLabel(option)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sort;
