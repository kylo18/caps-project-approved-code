import SortCustomDropdown from "./sortCustomDropdown";

// Displays a Sort Button
const Sort = ({ sortOption, setSortOption }) => {
  const mainSortOptions = [
    { value: "", label: "Default" },
    { value: "difficulty", label: "Difficulty" },
    { value: "coverage", label: "Coverage" },
    { value: "score", label: "Score" },
    { value: "date", label: "Date Created" },
  ];

  const handleSortChange = (e) => {
    const newValue = e.target.value;

    // If clicking the same option, toggle between asc/desc
    if (newValue === sortOption) {
      // Add _desc suffix to toggle to descending
      setSortOption(newValue + "_desc");
    } else if (newValue + "_desc" === sortOption) {
      // Remove _desc suffix to toggle to ascending
      setSortOption(newValue);
    } else {
      setSortOption(newValue);
    }
  };

  // Function to get the display label with arrow
  const getDisplayLabel = (option) => {
    if (option.value === "") {
      return option.label;
    }

    return option.label;
  };

  return (
    <div className="flex flex-row gap-2">
      <SortCustomDropdown
        name="sortOption"
        value={sortOption}
        onChange={handleSortChange}
        options={mainSortOptions.map((option) => ({
          ...option,
          label: getDisplayLabel(option),
        }))}
        placeholder="Sort By"
      />
    </div>
  );
};

export default Sort;
