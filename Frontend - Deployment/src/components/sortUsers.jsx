import SortCustomDropdown from "./sortCustomDropdown";

// Handles the Sort function  of Users and the Sort Options

const Sort = ({
  sortOption,
  setSortOption,
  subSortOption,
  setSubSortOption,
}) => {
  const mainSortOptions = [
    { value: "all", label: "All" },
    { value: "campus", label: "Campus" },
    { value: "role", label: "Role" },
  ];

  const subSortOptions = {
    role: [
      { value: "student", label: "Student" },
      { value: "faculty", label: "Faculty" },
      { value: "programchair", label: "Program Chair" },
      { value: "dean", label: "Dean" },
    ],
    campus: [
      { value: "dapitan", label: "Dapitan" },
      { value: "dipolog", label: "Dipolog" },
      { value: "katipunan", label: "Katipunan" },
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
          placeholder="Select"
        />
      )}
    </div>
  );
};

export default Sort;
