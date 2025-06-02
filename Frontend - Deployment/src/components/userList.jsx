import React, { useEffect, useState, useRef } from "react";
import SortCustomDropdown from "./sortCustomDropdown";
import ConfirmModal from "./confirmModal";
import LoadingOverlay from "./loadingOverlay";
import { Tooltip } from "flowbite-react";
import RegisterDropDownSmall from "./registerDropDownSmall";

// Component to display and manage user list with filtering and actions
const UserList = () => {
  // Refs for dropdown positioning
  const dropdownRef = useRef(null);
  // State for user data and loading
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for user selection and filtering
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [sortStatus, setSortStatus] = useState("All");

  // State for user action loading states
  const [isApproving, setIsApproving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // State for bulk action loading states
  const [isApprovingMultiple, setIsApprovingMultiple] = useState(false);
  const [isActivatingMultiple, setIsActivatingMultiple] = useState(false);
  const [isDeactivatingMultiple, setIsDeactivatingMultiple] = useState(false);

  // State for user details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State for filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // State for dropdowns and search
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users from API
  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found, please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("Session expired, please log in again.");
        return;
      }

      if (response.status === 403) {
        setError("You don't have permission to access this page.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle user selection via checkbox
  const handleCheckboxChange = (userID) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userID)
        ? prevSelected.filter((id) => id !== userID)
        : [...prevSelected, userID],
    );
  };

  const filteredUsers = users
    .sort((a, b) => b.userID - a.userID) // Sort by userID in descending order (most recent first)
    .filter((user) => {
      const matchesSearch =
        user.userID.toString().includes(searchQuery) ||
        user.userCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSort =
        !sortCategory ||
        sortOption === "All" ||
        (sortCategory === "Campus" && user.campus === sortOption) ||
        (sortCategory === "Role" && user.role === sortOption);

      const matchesStatus =
        !sortStatus || sortStatus === "All" || user.status === sortStatus;

      return matchesSearch && matchesSort && matchesStatus;
    });

  const pendingUsersCount = filteredUsers.filter(
    (user) => user.status === "pending",
  ).length;

  // Update the filter logic for the table
  const filteredTableUsers = filteredUsers.filter((user) => {
    return (
      (campusFilter ? user.campus === campusFilter : true) &&
      (roleFilter ? user.role === roleFilter : true) &&
      (positionFilter ? user.role === positionFilter : true) &&
      (programFilter ? user.program === programFilter : true) &&
      (stateFilter ? user.isActive === (stateFilter === "Active") : true) &&
      // Filter by status
      (statusFilter === "all" ? true : user.status === statusFilter) &&
      // Search filter by name, email, or user code
      (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

  // Function to approve a single user
  const handleApproveUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsApproving(true);
    setShowModal(false);
    try {
      const response = await fetch(`${apiUrl}/users/${userID}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve user");
      }
      setToast({
        message: "User approved successfully!",
        type: "success",
        show: true,
      });

      setUsers(
        users.map((user) =>
          user.userID === userID ? { ...user, status: "registered" } : user,
        ),
      );
      setUsers(
        users.map((user) =>
          user.userID === userID ? { ...user, isActve: true } : user,
        ),
      );
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setIsApproving(false);
    }
  };

  // Function to activate a single user
  const handleActivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsActivating(true);
    setShowModal(false);
    try {
      const response = await fetch(`${apiUrl}/users/${userID}/activate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to activate user");
      }

      setToast({
        message: "User activated successfully!",
        type: "success",
        show: true,
      });

      setUsers(
        users.map((user) =>
          user.userID === userID ? { ...user, isActive: true } : user,
        ),
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setIsActivating(false);
    }
  };

  // Function to deactivate a single user
  const handleDeactivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsDeactivating(true);
    setShowModal(false);
    try {
      const response = await fetch(`${apiUrl}/users/${userID}/deactivate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to deactivate user");
      }
      setToast({
        message: "User deactivated successfully!",
        type: "success",
        show: true,
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userID === userID ? { ...user, isActive: false } : user,
        ),
      );
    } catch (error) {
      console.error("Error deactivating user:", error);
    } finally {
      setIsDeactivating(false);
    }
  };

  // Function to approve multiple selected users
  const handleApproveSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsApprovingMultiple(true);
    if (selectedUsers.length === 0) {
      alert("Please select users to approve.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/approve-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIDs: selectedUsers }), // assuming backend expects this shape
      });

      if (!response.ok) {
        throw new Error("Failed to approve selected users.");
      }

      setToast({
        message: "Users approved successfully!",
        type: "success",
        show: true,
      });
      fetchUsers();
      setSelectedUsers([]); // clear selection
    } catch (error) {
      console.error(error);
    } finally {
      setIsApprovingMultiple(false);
    }
  };

  // Function to activate multiple selected users
  const handleActivateSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsActivatingMultiple(true);

    if (selectedUsers.length === 0) {
      alert("Please select users to activate.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/activate-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIDs: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error("Failed to activate selected users.");
      }

      fetchUsers();
      setSelectedUsers([]);
      setToast({
        message: "Users activated successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error(error);
      alert("Error activating selected users.");
    } finally {
      setIsActivatingMultiple(false);
    }
  };

  // Function to deactivate multiple selected users
  const handleDeactivateSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsDeactivatingMultiple(true);

    if (selectedUsers.length === 0) {
      alert("Please select users to deactivate.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/deactivate-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIDs: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate selected users.");
      }
      setToast({
        message: "Users deactivated successfully!",
        type: "success",
        show: true,
      });
      fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
      alert("Error deactivating selected users.");
    } finally {
      setIsDeactivatingMultiple(false);
    }
  };

  // Function to handle bulk actions (approve/activate/deactivate)
  const handleActionClick = (action) => {
    if (selectedUsers.length === 0) {
      setToast({
        message: "Please select at least one user first",
        type: "error",
        show: true,
      });
      return;
    }

    switch (action) {
      case "approve":
        handleApproveSelectedUsers();
        break;
      case "activate":
        handleActivateSelectedUsers();
        break;
      case "deactivate":
        handleDeactivateSelectedUsers();
        break;
    }
    setDropdownOpen(false);
  };

  //Skeleton Table
  if (loading) {
    return (
      <div className="font-inter mt-10">
        <div className="mb-4 flex items-center justify-between gap-2 text-[14px]">
          {/* Skeleton for top bar */}
          <div className="flex w-full items-center justify-between gap-4">
            <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200 lg:w-70"></div>
            <div className="flex gap-2">
              <div className="h-9 w-10 animate-pulse rounded-md bg-gray-200"></div>
              <div className="h-9 w-48 animate-pulse rounded-md bg-gray-200"></div>
              <div className="h-9 w-10 animate-pulse rounded-md bg-gray-200"></div>
              <div className="h-9 w-10 animate-pulse rounded-md bg-gray-200"></div>
            </div>
          </div>
        </div>

        {/* Skeleton for table header */}
        <div className="rounded-t-sm border border-b-0 border-[rgb(200,200,200)] bg-white px-5 py-3">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Skeleton for table rows */}
        <div className="hidden min-[1000px]:block">
          <div className="min-w-full table-fixed border border-[rgb(200,200,200)] bg-white shadow-md">
            <div className="border-b border-[rgb(200,200,200)] bg-white p-5">
              <div className="grid grid-cols-10 gap-4">
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-8 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="border-b border-[rgb(200,200,200)] p-5"
              >
                <div className="grid grid-cols-10 gap-4">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton for mobile view */}
        <div className="min-[1000px]:hidden">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="border border-gray-300 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="font-inter mt-10">
      <div className="mb-4 flex items-center justify-between gap-2 text-[14px]">
        <div className="relative flex w-full items-center justify-between gap-4">
          {/* Status Tabs (Left) */}
          <div className="flex items-center gap-2 rounded-md bg-gray-300 md:flex-row md:gap-2">
            {/* Status Buttons (Visible on medium screens and up) */}
            <div className="hidden items-center gap-1 text-[12px] font-semibold text-gray-500 md:flex">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-md px-8 py-[8px] ${
                  statusFilter === "all"
                    ? "border-color border bg-gray-100 text-gray-700"
                    : "cursor-pointer text-gray-500"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setStatusFilter("pending")}
                className={`rounded-md px-6 py-[8px] ${
                  statusFilter === "pending"
                    ? "border-color border bg-gray-100 text-gray-700"
                    : "cursor-pointer text-gray-500"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => setStatusFilter("registered")}
                className={`rounded-md px-5 py-[8px] ${
                  statusFilter === "registered"
                    ? "border-color border bg-gray-100 text-gray-700"
                    : "cursor-pointer text-gray-500"
                }`}
              >
                Approved
              </button>
            </div>

            {/* Dropdown Button with Icon (Visible on smaller screens) */}
            <div className="relative md:hidden">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
              >
                <span className="ml-2 text-sm capitalize">
                  {statusFilter === "all"
                    ? "All"
                    : statusFilter === "pending"
                      ? "Pending"
                      : "Approved"}
                </span>
                <i className="bx bx-chevron-down text-2xl"></i>
              </button>

              {statusDropdownOpen && (
                <div className="absolute left-0 z-50 mt-2 w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
                  <div className="py-1 text-sm text-gray-700">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-sm px-4 py-2 text-left text-black"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("pending");
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-sm px-4 py-2 text-left text-black"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("registered");
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-sm px-4 py-2 text-left text-black"
                    >
                      Approved
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div>
          <Tooltip content="Refresh" placement="bottom">
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
            >
              <i className="bx bx-refresh text-2xl"></i>
            </button>
          </Tooltip>
        </div>

        {/* Search Bar */}
        <div className="border-color flex w-[50%] min-w-[100px] cursor-pointer items-center rounded-md border bg-white px-2 py-[1px] text-gray-700 shadow-sm sm:max-w-[300px]">
          <i className="bx bx-search text-[20px] text-gray-500"></i>
          <div className="flex flex-1">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full flex-1 rounded-md p-2 text-[10px] text-gray-700 outline-none"
            />
          </div>
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-center gap-4">
          <Tooltip content="Filter" placement="bottom">
            <button
              onClick={() => setShowFilters(!showFilters)} // toggle filter dropdown visibility
              className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
            >
              <i className="bx bx-filter-alt text-2xl"></i>
            </button>
          </Tooltip>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
            <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-2xl border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 min-[448px]:rounded-t-md">
              <span>Filter Users</span>

              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-1 right-2 text-2xl text-gray-600 hover:text-gray-800"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className="border-color relative mx-auto w-full max-w-md border border-t-0 bg-white p-2 min-[448px]:rounded-b-md sm:px-4">
              {/* Campus Filter */}
              <div className="mb-2">
                <span className="font-color-gray mb-2 block text-[12px]">
                  Campus
                </span>
                <div>
                  <RegisterDropDownSmall
                    name="campus"
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    placeholder="Select Campus"
                    options={[
                      { value: "", label: "All" },
                      { value: "Main Campus", label: "Dapitan" },
                      { value: "Katipunan Campus", label: "Katipunan" },
                      { value: "Tampilisan Campus", label: "Tampilisan" },
                    ]}
                  />
                </div>
              </div>

              {/* Position Filter */}
              <div className="mb-2">
                <span className="font-color-gray mb-2 block text-[12px]">
                  Position
                </span>
                <RegisterDropDownSmall
                  name="position"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  placeholder="Select Campus"
                  options={[
                    { value: "", label: "All" },
                    { value: "Student", label: "Student" },
                    { value: "Instructor", label: "Instructor" },
                    { value: "Program Chair", label: "Program Chair" },
                    { value: "Dean", label: "Dean" },
                  ]}
                />
              </div>

              {/* Program Filter */}
              <div className="mb-2">
                <span className="font-color-gray mb-2 block text-[12px]">
                  Program
                </span>
                <RegisterDropDownSmall
                  name="program"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  placeholder="Select Campus"
                  options={[
                    { value: "", label: "All" },
                    { value: "BS-CpE", label: "BS-CpE" },
                    { value: "BS-EE", label: "BS-EE" },
                    { value: "BS-CE", label: "BS-CE" },
                    { value: "BS-ECE", label: "BS-ECE" },
                    { value: "BS-ABE", label: "BS-ABE" },
                  ]}
                />
              </div>

              {/* State Filter */}
              <div className="mb-2">
                <span className="font-color-gray mb-2 block text-[12px]">
                  Status
                </span>
                <RegisterDropDownSmall
                  name="state"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  placeholder="Select Campus"
                  options={[
                    { value: "", label: "All" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </div>

              <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCampusFilter("");
                    setRoleFilter("");
                    setPositionFilter("");
                    setProgramFilter("");
                    setStateFilter("");
                  }}
                  className="mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-[12px] py-[6px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
                >
                  <span className="px-1 text-[14px]">Reset</span>
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="mb-2 flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[12px] py-[6px] text-white transition-all duration-150 hover:bg-orange-700"
                >
                  <i className={`bx bx-check-double text-[20px]`}></i>
                  <span className="pr-1.5 text-[14px]">Apply</span>
                </button>
              </div>

              {/* Reset All Button */}
            </div>
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <Tooltip content="Actions" placement="bottom">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
            >
              <i className="bx bx-dots-vertical-rounded text-2xl"></i>
            </button>
          </Tooltip>

          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
              <div className="text-sm text-gray-700">
                <Tooltip
                  content={
                    selectedUsers.length === 0
                      ? "Select users first"
                      : "Approve selected users"
                  }
                  placement="left"
                >
                  <button
                    onClick={() => handleActionClick("approve")}
                    className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                      selectedUsers.length === 0
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    Approve
                  </button>
                </Tooltip>
                <Tooltip
                  content={
                    selectedUsers.length === 0
                      ? "Select users first"
                      : "Activate selected users"
                  }
                  placement="left"
                >
                  <button
                    onClick={() => handleActionClick("activate")}
                    className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                      selectedUsers.length === 0
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    Activate
                  </button>
                </Tooltip>
                <Tooltip
                  content={
                    selectedUsers.length === 0
                      ? "Select users first"
                      : "Deactivate selected users"
                  }
                  placement="left"
                >
                  <button
                    onClick={() => handleActionClick("deactivate")}
                    className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                      selectedUsers.length === 0
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    Deactivate
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info Mobile */}
      {showModal && selectedUser && (
        <div className="font-inter bg-opacity-30 lightbox-bg fixed inset-0 z-55 flex items-center justify-center">
          <div className="relative w-11/12 max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 rounded-full px-[9px] py-[5px] text-gray-500 hover:bg-gray-100"
              title="Close"
            >
              <i className="bx bx-x mt-[3px] text-[24px]"></i>
            </button>

            <h2 className="mb-6 text-[16px] font-semibold text-gray-800">
              User Details
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Name</span>
                <span>
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">User Code</span>
                <span>{selectedUser.userCode}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Email</span>
                <span>{selectedUser.email}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Position</span>
                <span>{selectedUser.role}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Campus</span>
                <span>{selectedUser.campus}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Program</span>
                <span>{selectedUser.program}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Status</span>
                <span>{selectedUser.status}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Active</span>
                <span>{selectedUser.isActive ? "Yes" : "No"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-6">
              {selectedUser.status === "pending" && !selectedUser.isActive && (
                <button
                  className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
                  onClick={() => handleApproveUser(selectedUser.userID)}
                  title="Approve"
                >
                  <i className="bx bxs-user-check text-2xl"></i>
                  <span className="mt-1 text-xs">Approve</span>
                </button>
              )}

              {selectedUser.status === "registered" &&
                selectedUser.isActive && (
                  <button
                    className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
                    onClick={() => handleDeactivateUser(selectedUser.userID)}
                    title="Deactivate"
                  >
                    <i className="bx bx-log-out bx-flip-horizontal text-2xl"></i>
                    <span className="mt-1 text-xs">Deactivate</span>
                  </button>
                )}

              {selectedUser.status === "registered" &&
                !selectedUser.isActive && (
                  <button
                    className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border px-4 py-1.5 text-gray-700 hover:bg-gray-200"
                    onClick={() => handleActivateUser(selectedUser.userID)}
                    title="Activate"
                  >
                    <i className="bx bx-check-double text-2xl"></i>
                    <span className="mt-1 text-xs">Activate</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-t-sm border border-b-0 border-[rgb(200,200,200)] bg-white px-5 py-3 text-[12px] shadow-sm sm:text-[14px]">
        {pendingUsersCount > 0
          ? `${pendingUsersCount} User${pendingUsersCount !== 1 ? "s" : ""} Pending`
          : " All users approved"}
      </div>

      {/* User Table Mobile */}
      <div className="min-[1000px]:hidden">
        {filteredTableUsers.map((user) => (
          <div
            key={user.userID}
            className="flex items-center justify-between border border-gray-300 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedUsers.includes(user.userID)}
                onChange={() => handleCheckboxChange(user.userID)}
              />
              <div className="truncate">
                <div className="max-w-[220px] truncate text-[12px] font-semibold text-gray-800 sm:max-w-full">
                  {user.firstName} {user.lastName}
                </div>

                <div className="truncate text-[10px] text-gray-600">
                  {user.program}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedUser(user);
                setShowModal(true);
              }}
              className="ml-2 text-gray-700"
            >
              <i className="bx bx-chevron-right text-[25px] leading-none"></i>
            </button>
          </div>
        ))}
      </div>

      {/* User Table Desktop */}
      <div className="hidden w-full overflow-x-auto min-[1000px]:block">
        <table className="min-w-full table-fixed border border-[rgb(200,200,200)] bg-white shadow-md">
          <thead>
            <tr className="border-b border-[rgb(200,200,200)] bg-white text-[10px] text-[rgb(78,78,78)] sm:text-[12px]">
              <th className="w-[5%] p-3 text-left">
                <input
                  className="ml-3"
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedUsers(
                      e.target.checked ? users.map((user) => user.userID) : [],
                    )
                  }
                />
              </th>
              <th className="w-[10%] p-3 text-left font-semibold text-nowrap">
                USER CODE
              </th>
              <th className="w-[15%] p-3 text-left font-semibold sm:hidden">
                Full Name
              </th>
              <th className="hidden max-w-[150px] truncate p-3 text-left font-semibold sm:table-cell">
                NAME
              </th>
              <th className="w-[20%] p-3 text-left font-semibold">EMAIL</th>
              <th className="w-[10%] p-3 text-left font-semibold">POSITION</th>
              <th className="w-[10%] p-3 text-left font-semibold">CAMPUS</th>
              <th className="w-[10%] p-3 text-center font-semibold">STATUS</th>
              <th className="w-[10%] p-3 text-center font-semibold">PROGRAM</th>
              <th className="w-[10%] p-3 text-center font-semibold">STATE</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="py-4 text-center text-[14px] text-gray-700"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredTableUsers.map((user) => (
                <tr
                  key={user.userID}
                  className={`border-b border-[rgb(200,200,200)] text-[12px] text-[rgb(78,78,78)] transition-colors ${
                    selectedUsers.includes(user.userID)
                      ? "bg-gray-200 hover:bg-gray-100"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleCheckboxChange(user.userID)}
                >
                  {/* Checkbox Column */}
                  <td
                    className="hidden p-3 text-left sm:table-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      className="mt-1 ml-3"
                      type="checkbox"
                      checked={selectedUsers.includes(user.userID)}
                      onChange={() => handleCheckboxChange(user.userID)}
                    />
                  </td>

                  <td className="p-3 text-left text-nowrap">{user.userCode}</td>

                  {/* Name with Tooltip */}
                  <td className="max-w-[120px] truncate p-3 text-left text-nowrap">
                    <Tooltip
                      content={`${user.firstName} ${user.lastName}`}
                      placement="top"
                    >
                      <span>{`${user.firstName} ${user.lastName}`}</span>
                    </Tooltip>
                  </td>

                  {/* Email with Tooltip */}
                  <td className="max-w-[120px] truncate p-3 text-left">
                    <Tooltip content={user.email} placement="top">
                      <span>{user.email}</span>
                    </Tooltip>
                  </td>

                  <td className="p-3 text-left text-nowrap">{user.role}</td>
                  <td className="p-3 text-left text-nowrap">{user.campus}</td>

                  <td className="p-3 text-center font-semibold">
                    <span
                      className={`rounded-md px-2 py-1 text-[12px] ${
                        user.status === "registered"
                          ? "text-green-600"
                          : user.status === "unregistered"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {user.status === "registered"
                        ? "Approved"
                        : user.status === "unregistered"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                  </td>

                  <td className="p-3 text-center">{user.program}</td>

                  <td className="p-3 text-center">
                    {user.isActive ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-red-500">Inactive</span>
                    )}
                  </td>
                  <td
                    className="p-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                  >
                    <button className="text-gray-700 hover:text-orange-500">
                      <i className="bx bx-chevron-right mr-3 text-[25px] leading-none"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isActivating && <LoadingOverlay show={isActivating} />}
      {isApproving && <LoadingOverlay show={isApproving} />}
      {isDeactivating && <LoadingOverlay show={isDeactivating} />}

      {isActivatingMultiple && <LoadingOverlay show={isActivatingMultiple} />}
      {isApprovingMultiple && <LoadingOverlay show={isApprovingMultiple} />}
      {isDeactivatingMultiple && (
        <LoadingOverlay show={isDeactivatingMultiple} />
      )}

      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md transition-opacity duration-1000 ease-in-out ${
            toast.show ? "opacity-100" : "opacity-0"
          } ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-error text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
