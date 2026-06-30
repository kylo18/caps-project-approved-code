import React, { useEffect } from "react";

/**
 * Reusable SearchBar component with optional mobile collapsible behavior.
 *
 * @param {string} value - Controlled input value
 * @param {function} onChange - Called when input value changes
 * @param {string} placeholder - Input placeholder text
 * @param {number} maxLength - Max input length (default 50)
 * @param {string} className - Additional classes for the container
 * @param {object} inputRef - Ref for the input (e.g. for focus when opening on mobile)
 * @param {boolean} mobileCollapsible - When true, search is toggleable on mobile
 * @param {boolean} showMobileSearch - Controlled visibility on mobile (when mobileCollapsible)
 * @param {function} onCloseMobileSearch - Called when user closes search on mobile
 */
const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  maxLength = 50,
  className = "",
  inputRef,
  mobileCollapsible = false,
  showMobileSearch = false,
  onCloseMobileSearch,
}) => {
  useEffect(() => {
    if (mobileCollapsible && showMobileSearch && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [mobileCollapsible, showMobileSearch, inputRef]);

  const visibilityClass = mobileCollapsible
    ? showMobileSearch
      ? "block md:block"
      : "hidden md:block" 
    : "block";

  return (
    <div
      className={`outfit-400 relative text-[14px] ${visibilityClass} ${className}`}
    >
      <i className="bx bx-search absolute top-1/2 left-4 -translate-y-1/2 text-lg text-gray-500 md:top-2.5" />

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="-mt-0 w-full max-w-full min-w-0 rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none md:-mt-2"
        value={value || ""}
        maxLength={45}
        onChange={(e) => onChange(e)}
      />

      {value && !(mobileCollapsible && showMobileSearch) && (
        <button
          type="button"
          onClick={() => onChange({ target: { value: "" } })}
          className="absolute top-1/2 right-4 hidden -translate-y-1/2 cursor-pointer items-center justify-center text-gray-500 md:block"
          aria-label="Clear search"
        >
          <i className="bx bx-x text-xl" />
        </button>
      )}

      {mobileCollapsible && showMobileSearch && onCloseMobileSearch && (
        <button
          type="button"
          onClick={onCloseMobileSearch}
          className="absolute top-1/2 right-4 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-1.5 text-gray-500 md:block"
          aria-label="Close search"
        >
          <i className="bx bx-x text-lg" />
        </button>
      )}
    </div>
  );
};

/**
 * Trigger button for mobile collapsible search. Renders search icon (or X when open).
 * Only visible on mobile (md:hidden).
 */
export const SearchBarTrigger = ({
  isOpen,
  onClick,
  className = "",
  title = "Search",
}) => (
  <button
    type="button"
    onClick={onClick}
    title={isOpen ? "Close search" : title}
    className={`-mb-2 inline-flex cursor-pointer items-center rounded-xl p-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 md:hidden md:text-[14px] ${className}`}
    aria-label={isOpen ? "Close search" : title}
  >
    <i className={`bx ${isOpen ? "bx-x" : "bx-search"} text-[22px]`} />
  </button>
);

export default SearchBar;
