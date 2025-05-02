import SortCustomDropdown from "./sortCustomDropdown";

const Sort = ({ sortOption, setSortOption }) => {
  const mainSortOptions = [
    { value: "", label: "All" },
    { value: "difficulty", label: "Sort by Difficulty" },
    { value: "coverage", label: "Sort by Coverage" },
    { value: "score", label: "Sort by Score" },
  ];

  return (
    <div className="flex flex-row gap-2">
      <SortCustomDropdown
        name="sortOption"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        options={mainSortOptions}
        placeholder="Sort By"
      />
    </div>
  );
};

export default Sort;
