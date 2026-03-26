import { useRef } from "react";

// Displays a Search Bar
const SearchQuery = ({ searchQuery, setSearchQuery, placeholder }) => {
  const inputRef = useRef(null);

  return (
    <div className="open-sans border-color -mt-1 flex w-full cursor-pointer items-center rounded-full border bg-white px-2 py-[3px] text-gray-700 dark:border-gray-700 dark:bg-neutral-950 dark:text-gray-100 lg:-mt-2">
      {/* Search Icon */}
      <i className="bx bx-search ml-1 text-[23px] text-gray-500 dark:text-gray-400"></i>

      {/* Search Input */}
      <div className="flex flex-1 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full flex-1 rounded-md bg-transparent px-1 py-[6px] text-[14px] text-gray-700 outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
          autoFocus
        />
      </div>
    </div>
  );
};

export default SearchQuery;
