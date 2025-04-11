import SortCustomDropdown from "./sortCustomDropdown";

const Sort = ({ sortOption, setSortOption, subSortOption, setSubSortOption }) => {
  const mainSortOptions = [
    { value: "", label: "All" },
    { value: "difficulty", label: "Difficulty" },
    { value: "coverage", label: "Coverage" },
    { value: "score", label: "Score" },
  ];

  const subSortOptions = {
    difficulty: [
      { value: "easy", label: "Easy" },
      { value: "moderate", label: "Moderate" },
      { value: "hard", label: "Hard" },
    ],
    coverage: [
      { value: "midterm", label: "Midterms" },
      { value: "finals", label: "Finals" },
    ],
    score: [
      { value: "asc", label: "Ascending" },
      { value: "desc", label: "Descending" },
    ],
  };

  return (
    <div className="flex flex-row gap-2">
      {/* Main Sort Dropdown */}
      <SortCustomDropdown
        name="sortOption"
        value={sortOption}
        onChange={(e) => {
          setSortOption(e.target.value);
          setSubSortOption("");
        }}
        options={mainSortOptions}
        placeholder="Sort By"
      />

      {sortOption && subSortOptions[sortOption] && (
        <SortCustomDropdown
          name="subSortOption"
          value={subSortOption}
          onChange={(e) => setSubSortOption(e.target.value)}
          options={subSortOptions[sortOption]}
          placeholder="Select Option"
        />
      )}
    </div>
  );
};

export default Sort;
