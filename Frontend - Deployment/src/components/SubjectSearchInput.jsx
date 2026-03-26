import React, { useState, useRef, useEffect } from "react";

// Renders the subject search input.
export default function SubjectSearchInput({ options, onChange, placeholder }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Filter options based on search term
    const filtered = options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  useEffect(() => {
    // Handle click outside to close suggestions
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handles input change.
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    setIsLoading(true);
    // Simulate loading state for 500ms
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Handles suggestion click.
  const handleSuggestionClick = (option) => {
    onChange({ target: { value: option.value } });
    setSearchTerm("");
    setShowSuggestions(false);
  };

  return (
    <div className="open-sans relative" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="open-sans mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-[7px] text-[12px] text-gray-700 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none dark:border-gray-700 dark:bg-neutral-950 dark:text-gray-100 dark:hover:border-gray-500 sm:w-85"
      />
      {showSuggestions && (
        <div className="open-sans animate-fadein ring-opacity-5 border-color custom-scrollbar absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-neutral-950">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <span className="loader"></span>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const showYearLabel =
                index === 0 ||
                filteredOptions[index - 1].yearLevel !== option.yearLevel;

              return (
                <React.Fragment key={option.value}>
                  {showYearLabel && (
                    <div className="sticky top-[-4px] bg-gray-100 px-4 py-2 text-[12px] font-medium text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
                      {option.yearLevel}
                    </div>
                  )}
                  <div
                    onClick={() => handleSuggestionClick(option)}
                    className="cursor-pointer rounded-sm px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-900"
                  >
                    {option.subjectCode} - {option.label}
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="px-4 py-2 text-center text-[12px] text-gray-500 dark:text-gray-400">
              No subjects found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
