import React, { useState, useRef, useEffect } from "react";

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

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    setIsLoading(true);
    // Simulate loading state for 500ms
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleSuggestionClick = (option) => {
    onChange({ target: { value: option.value } });
    setSearchTerm("");
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-700 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
      />
      {showSuggestions && (
        <div className="ring-opacity-5 border-color absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 shadow-lg">
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
                    <div className="sticky top-[-4px] bg-gray-200 px-4 py-2 text-xs font-medium text-gray-500">
                      {option.yearLevel}
                    </div>
                  )}
                  <div
                    onClick={() => handleSuggestionClick(option)}
                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.subjectCode} - {option.label}
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="px-4 py-2 text-center text-sm text-gray-500">
              No subjects found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
