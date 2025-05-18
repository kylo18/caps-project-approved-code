import { useRef } from "react";

// Displays a Search Bar
const SearchQuery = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search questions...",
}) => {
  const inputRef = useRef(null);

  return (
    <div className="border-color flex w-full cursor-pointer items-center rounded-md border bg-white px-2 text-gray-700 shadow-sm">
      {/* Search Icon */}
      <i className="bx bx-search text-[20px] text-gray-500"></i>

      {/* Search Input */}
      <div className="flex flex-1 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-1 rounded-md p-2 text-[13px] text-gray-700 outline-none"
          autoFocus
        />

        {/* Close Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSearchQuery(""); // Reset search query when close is clicked
          }}
          className="ml-2 text-gray-500 hover:text-gray-700"
        ></button>
      </div>
    </div>
  );
};

export default SearchQuery;
