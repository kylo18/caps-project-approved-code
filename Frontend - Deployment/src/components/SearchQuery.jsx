// Reusable Search Bar styled like the one in Class.jsx
const SearchQuery = ({ searchQuery, setSearchQuery, placeholder }) => {
  return (
    <div className="outfit-500 relative text-[14px]">
      <i className="bx bx-search absolute top-0.5 left-3 text-lg text-gray-500"></i>
      <input
        type="text"
        placeholder={placeholder}
        className="-mt-2 w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <i className="bx bx-x text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default SearchQuery;
