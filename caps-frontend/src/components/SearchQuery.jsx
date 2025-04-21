import { useRef } from "react";

const SearchQuery = ({ searchQuery, setSearchQuery, placeholder = "Search questions..." }) => {
  const inputRef = useRef(null);

  return (
    <div
      className="flex items-center border border-color shadow-sm bg-white px-2 rounded-md text-gray-700 cursor-pointer w-full"
    >
      {/* Search Icon */}
      <i className="bx bx-search text-[20px] text-gray-500"></i>

      {/* Search Input */}
      <div className="flex items-center flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="outline-none text-gray-700 flex-1 p-2 rounded-md text-[14px] w-full"
          autoFocus
        />

        {/* Close Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSearchQuery(""); // Reset search query when close is clicked
          }}
          className="ml-2 text-gray-500 hover:text-gray-700"
        >
        </button>
      </div>
    </div>
  );
};

export default SearchQuery;
