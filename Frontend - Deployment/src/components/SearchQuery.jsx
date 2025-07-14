import { useRef } from "react";

// Displays a Search Bar
const SearchQuery = ({ searchQuery, setSearchQuery, placeholder }) => {
  const inputRef = useRef(null);

  return (
    <div className="open-sans border-color -mt-1 flex w-full cursor-pointer items-center rounded-full border bg-white px-2 py-[3px] text-gray-700 lg:-mt-2">
      {/* Search Icon */}
      <i className="bx bx-search ml-1 text-[23px] text-gray-500"></i>

      {/* Search Input */}
      <div className="flex flex-1 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-1 rounded-md px-1 py-[6px] text-[14px] text-gray-700 outline-none"
          autoFocus
        />
      </div>
    </div>
  );
};

export default SearchQuery;
