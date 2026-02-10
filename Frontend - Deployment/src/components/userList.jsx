import React, { useEffect, useState, useRef } from "react";
import SortCustomDropdown from "./sortCustomDropdown";
import ConfirmModal from "./confirmModal";
import LoadingOverlay from "./loadingOverlay";
import RegisterDropDownSmall from "./registerDropDownSmall";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
// Component to display and manage user list with filtering and actions
// Features:
// - Separate tabs for Students and Other users
// - Remarks column for students (Regular, Probationary, Advised to Shift)
// - Status filtering (All, Pending, Approved)
// - Bulk actions (Approve, Activate, Deactivate, Delete)
const UserList = () => {
  // Refs for dropdown positioning
  const dropdownRef = useRef(null);
  // State for user data and loading
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [itemsPerPage] = useState(50); // Number of items per page
  const [searchLoading, setSearchLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // State for user selection and filtering
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [sortStatus, setSortStatus] = useState("All");

  // State for user action loading states
  const [isApproving, setIsApproving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [otherDeansCount, setOtherDeansCount] = useState(0);
  const [roleError, setRoleError] = useState("");

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
  const [remarksFilter, setRemarksFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // State for dropdowns and search
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add after other user action states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Add new state for user type tabs
  const [studentsOnly, setStudentsOnly] = useState(false); // true: students only, false: others only

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Get toast functions from hook
  const { toast, showToast } = useToast();

  // Helper function to get remarks display text
  const getRemarksDisplay = (remarks) => {
    if (!remarks) return "Not Set";

    // Handle both string and numeric values
    if (typeof remarks === "string") {
      return remarks;
    }

    // Handle numeric ID values
    switch (remarks) {
      case 1:
        return "Regular";
      case 2:
        return "Probationary";
      case 3:
        return "Advised to Shift";
      default:
        return "Not Set";
    }
  };

  // Helper function to get remarks styling
  const getRemarksStyling = (remarks) => {
    const displayText = getRemarksDisplay(remarks);

    switch (displayText) {
      case "Regular":
        return "bg-green-100 text-green-700";
      case "Probationary":
        return "bg-yellow-100 text-yellow-700";
      case "Advised to Shift":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Helper function to filter users by type
  const getFilteredUsers = () => {
    let filteredUsers = users;

    // Filter by user type
    if (studentsOnly) {
      filteredUsers = users.filter((user) => user.roleID === 1);
    } else {
      filteredUsers = users.filter((user) => user.roleID !== 1);
    }

    // Filter by remarks if remarks filter is applied and we're viewing students
    if (studentsOnly && remarksFilter) {
      filteredUsers = filteredUsers.filter((user) => {
        const userRemarks = getRemarksDisplay(user.remarks);
        return userRemarks === remarksFilter;
      });
    }

    return filteredUsers;
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return (
      campusFilter ||
      roleFilter ||
      positionFilter ||
      programFilter ||
      stateFilter ||
      (studentsOnly && remarksFilter)
    );
  };

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
    fetchUsers();
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setCurrentUserRole(user.roleID ?? user.roleId);
    }
  }, []);

  // Count other deans when users are fetched
  useEffect(() => {
    if (users.length > 0) {
      const deansCount = users.filter((user) => user.roleID === 4).length;
      setOtherDeansCount(deansCount);
    }
  }, [users]);

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setSearchLoading(true);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update fetchUsers to include filters
  const fetchUsers = async (page = 1) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found, please log in.");
      setLoading(false);
      setSearchLoading(false);
      setTabLoading(false);
      return;
    }

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page,
        limit: itemsPerPage,
        search: debouncedSearchQuery,
        status: statusFilter,
        campus: campusFilter,
        role: roleFilter,
        position: positionFilter,
        program: programFilter,
        state: stateFilter,
        remarks: remarksFilter,
        userType: studentsOnly ? "students" : "others", // Add user type filter
      });

      const response = await fetch(
        `${apiUrl}/users?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setTotalUsers(data.total);
      setCurrentPage(page);
    } catch (error) {
      setError(error.message);
      showToast("Failed to fetch users. Please try again.", "error");
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setTabLoading(false);
    }
  };

  // Update useEffect to refetch when filters change
  useEffect(() => {
    fetchUsers(1); // Reset to first page when filters change
  }, [
    debouncedSearchQuery,
    statusFilter,
    campusFilter,
    roleFilter,
    positionFilter,
    programFilter,
    stateFilter,
    remarksFilter,
    studentsOnly, // Add studentsOnly to dependencies
  ]);

  // Function to handle user selection via checkbox
  const handleCheckboxChange = (userID) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userID)
        ? prevSelected.filter((id) => id !== userID)
        : [...prevSelected, userID],
    );
  };

  // Remove all local filtering since it's now handled by the backend
  const pendingUsersCount = users.filter(
    (user) => user.status === "pending",
  ).length;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

  // Function to approve a single user
  const handleApproveUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsApproving(true);
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
      showToast("User approved successfully!", "success");

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
      setShowModal(false);
    } catch (error) {
      console.error("Error approving user:", error);
      showToast("Failed to approve user. Please try again.", "error");
    } finally {
      setIsApproving(false);
    }
  };

  // Function to activate a single user
  const handleActivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsActivating(true);
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

      showToast("User activated successfully!", "success");

      setUsers(
        users.map((user) =>
          user.userID === userID ? { ...user, isActive: true } : user,
        ),
      );
      setShowModal(false);
    } catch (error) {
      showToast(
        error.message || "Failed to activate user. Please try again.",
        "error",
      );
    } finally {
      setIsActivating(false);
    }
  };

  // Function to deactivate a single user
  const handleDeactivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    setIsDeactivating(true);
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
      showToast("User deactivated successfully!", "success");

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userID === userID ? { ...user, isActive: false } : user,
        ),
      );
      setShowModal(false);
    } catch (error) {
      console.error("Error deactivating user:", error);
      showToast("Failed to deactivate user. Please try again.", "error");
    } finally {
      setIsDeactivating(false);
    }
  };

  // Function to approve multiple selected users
  const handleApproveSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsApprovingMultiple(true);
    if (selectedUsers.length === 0) {
      showToast("Please select users to approve.", "error");
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

      showToast("Users approved successfully!", "success");
      fetchUsers();
      setSelectedUsers([]); // clear selection
    } catch (error) {
      console.error(error);
      showToast("Failed to approve selected users. Please try again.", "error");
    } finally {
      setIsApprovingMultiple(false);
    }
  };

  // Function to activate multiple selected users
  const handleActivateSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsActivatingMultiple(true);

    if (selectedUsers.length === 0) {
      showToast("Please select users to activate.", "error");
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
      showToast("Users activated successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast(
        "Failed to activate selected users. Please try again.",
        "error",
      );
    } finally {
      setIsActivatingMultiple(false);
    }
  };

  // Function to deactivate multiple selected users
  const handleDeactivateSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    setIsDeactivatingMultiple(true);

    if (selectedUsers.length === 0) {
      showToast("Please select users to deactivate.", "error");
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
      showToast("Users deactivated successfully!", "success");
      fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
      showToast(
        "Failed to deactivate selected users. Please try again.",
        "error",
      );
    } finally {
      setIsDeactivatingMultiple(false);
    }
  };

  // Function to handle bulk actions (approve/activate/deactivate)
  const handleActionClick = (action) => {
    if (selectedUsers.length === 0) {
      showToast("Please select at least one user first", "error");
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

  // Function to handle page change
  const handlePageChange = (newPage) => {
    setLoading(true);
    fetchUsers(newPage);
  };

  // Function to handle role update
  const handleRoleUpdate = async (userID, newRoleID) => {
    const token = localStorage.getItem("token");
    setIsUpdatingRole(true);
    setRoleError(""); // Clear any previous errors
    try {
      // Check if current user is trying to demote themselves from Dean
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (
        currentUser.roleID === 4 &&
        userID === currentUser.userID &&
        newRoleID !== 4
      ) {
        if (otherDeansCount <= 1) {
          throw new Error(
            "Cannot demote yourself. There must be at least one other Dean in the system.",
          );
        }
      }

      const response = await fetch(`${apiUrl}/users/${userID}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleID: newRoleID }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }

      const data = await response.json();
      showToast(data.message || "User role updated successfully!", "success");

      // Update the user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userID === userID
            ? { ...user, roleID: newRoleID, role: data.user.role }
            : user,
        ),
      );

      // Update the selected user in the modal
      setSelectedUser((prev) => ({
        ...prev,
        roleID: newRoleID,
        role: data.user.role,
      }));

      // Refresh the user list
      fetchUsers(currentPage);

      // Close the modal after successful update
      setShowModal(false);
      setRoleError("");
    } catch (error) {
      console.error("Error updating user role:", error);
      setRoleError(
        error.message || "Failed to update user role. Please try again.",
      );
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Add delete user function
  const handleDeleteUser = async (userID) => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser && userID === currentUser.userID) {
      showToast("You can't delete your own account.", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${apiUrl}/users/${userID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      showToast("User deleted successfully!", "success");
      fetchUsers(currentPage);
      setShowModal(false);
    } catch (error) {
      showToast(
        error.message || "Failed to delete user. Please try again.",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Add delete multiple users function
  const handleDeleteSelectedUsers = async () => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (selectedUsers.length === 0) {
      showToast("Please select users to delete.", "error");
      return;
    }
    if (currentUser && selectedUsers.includes(currentUser.userID)) {
      showToast("You can't delete your own account.", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to delete the selected users?"))
      return;
    setIsDeletingMultiple(true);
    try {
      const response = await fetch(`${apiUrl}/users/delete-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIDs: selectedUsers }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete selected users.",
        );
      }
      showToast("Selected users deleted successfully!", "success");
      fetchUsers(currentPage);
      setSelectedUsers([]);
    } catch (error) {
      showToast(
        error.message || "Failed to delete selected users. Please try again.",
        "error",
      );
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  //Skeleton Table
  if (loading) {
    return (
      <div className="open-sans mt-10">
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
    return (
      <div className="open-sans mt-10">
        <div className="mb-4 flex items-center justify-between gap-2 text-[14px]">
          {/* Keep the top bar with filters */}
          <div className="relative flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-2 rounded-md bg-gray-300 md:flex-row md:gap-2">
              <div className="hidden items-center gap-1 text-[12px] font-semibold text-gray-500 md:flex">
                <button className="rounded-md px-8 py-[8px] text-gray-500">
                  All
                </button>
                <button className="rounded-md px-6 py-[8px] text-gray-500">
                  Pending
                </button>
                <button className="rounded-md px-5 py-[8px] text-gray-500">
                  Approved
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-t-sm border border-b-0 border-[rgb(200,200,200)] bg-white px-5 py-3 text-[12px] shadow-sm sm:text-[14px]">
          <span className="ml-0 text-sm font-medium text-gray-600">Users</span>
        </div>

        {/* Mobile Error View */}
        <div className="min-[1000px]:hidden">
          <div className="border border-gray-300 bg-white p-4 text-center text-[14px] text-gray-700 shadow-sm">
            <div className="mb-2 text-red-500">
              <i className="bx bx-error-circle text-2xl"></i>
            </div>
            <p className="font-medium">Unable to fetch users</p>
            <p className="text-sm text-gray-500">
              Please check your connection and try again
            </p>
          </div>
        </div>

        {/* Desktop Error View */}
        <div className="hidden w-full overflow-x-auto min-[1000px]:block">
          <table className="min-w-full table-fixed border border-[rgb(200,200,200)] bg-white shadow-md">
            <thead>
              <tr className="border-b border-[rgb(200,200,200)] bg-white text-[10px] text-[rgb(78,78,78)] sm:text-[12px]">
                <th className="w-[5%] px-2 py-3 text-left"></th>
                <th className="w-[10%] px-2 py-3 text-left font-semibold text-nowrap">
                  USER CODE
                </th>
                <th className="hidden max-w-[150px] truncate px-2 py-3 text-left font-semibold sm:table-cell">
                  NAME
                </th>
                <th className="w-[20%] px-2 py-1 text-left font-semibold">
                  EMAIL
                </th>
                <th className="w-[10%] px-2 py-1 text-left font-semibold">
                  POSITION
                </th>
                <th className="w-[10%] px-2 py-1 text-left font-semibold">
                  CAMPUS
                </th>
                <th className="w-[10%] px-2 py-1 text-center font-semibold">
                  STATUS
                </th>
                <th className="w-[10%] px-2 py-1 text-center font-semibold">
                  PROGRAM
                </th>
                <th className="w-[10%] px-2 py-1 text-center font-semibold">
                  STATE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="9" className="py-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-2 text-red-500">
                      <i className="bx bx-error-circle text-3xl"></i>
                    </div>
                    <p className="font-medium text-gray-700">
                      Unable to fetch users
                    </p>
                    <p className="text-sm text-gray-500">
                      Please check your connection and try again
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 rounded-md px-3 py-1 text-sm ${
            currentPage === i
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>,
      );
    }

    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-md px-3 py-1 text-sm ${
            currentPage === 1
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`rounded-md px-3 py-1 text-sm ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="open-sans mt-10">
      {/* User Type Tabs */}
      {/* <div className="mb-4 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-md bg-gray-300 p-1">
          <button
            onClick={() => {
              setTabLoading(true);
              setUserTypeTab("students");
            }}
            className={`rounded-md px-6 py-2 text-[14px] font-semibold transition-colors ${
              userTypeTab === "students"
                ? "bg-white text-gray-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => {
              setTabLoading(true);
              setUserTypeTab("others");
            }}
            className={`rounded-md px-6 py-2 text-[14px] font-semibold transition-colors ${
              userTypeTab === "others"
                ? "bg-white text-gray-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Others
          </button>
        </div>
      </div> */}

      <div className="mb-4 flex items-center justify-between gap-2 text-[14px]">
        <div className="relative flex w-full items-center justify-between gap-4">
          {/* Status Tabs (Left) */}
          <div className="flex items-center gap-2 rounded-md bg-gray-300 md:flex-row md:gap-2">
            {/* Status Buttons (Visible on medium screens and up) */}
            <div className="hidden items-center gap-1 text-[12px] font-semibold text-gray-500 md:flex">
              <button
                onClick={() => {
                  setTabLoading(true);
                  setStatusFilter("all");
                }}
                className={`rounded-md px-8 py-[8px] ${
                  statusFilter === "all"
                    ? "border-color border bg-gray-100 text-gray-700"
                    : "cursor-pointer text-gray-500"
                }`}
              >
                All
              </button>

              <button
                onClick={() => {
                  setTabLoading(true);
                  setStatusFilter("pending");
                }}
                className={`rounded-md px-6 py-[8px] ${
                  statusFilter === "pending"
                    ? "border-color border bg-gray-100 text-gray-700"
                    : "cursor-pointer text-gray-500"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => {
                  setTabLoading(true);
                  setStatusFilter("registered");
                }}
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
                        setTabLoading(true);
                        setStatusFilter("all");
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-sm px-4 py-2 text-left text-black"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setTabLoading(true);
                        setStatusFilter("pending");
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-sm px-4 py-2 text-left text-black"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setTabLoading(true);
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
          {/* Students only checkbox - separated and aligned right */}
          <div className="ml-6 flex items-center">
            <label className="flex items-center gap-1 text-[13px] font-normal">
              <input
                type="checkbox"
                checked={studentsOnly}
                onChange={() => setStudentsOnly((prev) => !prev)}
                className="accent-blue-500"
              />
              Students only
            </label>
          </div>
        </div>

        {/* Refresh Button */}
        <div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-2xl text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
          >
            <i className="bx bx-refresh-ccw"></i>
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-color flex w-[50%] min-w-[100px] cursor-pointer items-center rounded-md border bg-white px-2 text-gray-700 shadow-sm sm:max-w-[300px]">
          <i className="bx bx-search text-[20px] text-gray-500"></i>
          <div className="flex flex-1">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full flex-1 rounded-md p-2 text-[11px] text-gray-700 outline-none"
            />
          </div>
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-center gap-4">
          {hasActiveFilters() && (
            <button
              onClick={() => {
                setCampusFilter("");
                setRoleFilter("");
                setPositionFilter("");
                setProgramFilter("");
                setStateFilter("");
                setRemarksFilter("");
              }}
              className="border-color flex cursor-pointer items-center justify-center gap-1 rounded-md border bg-red-50 px-[10px] py-1 text-red-600 shadow-sm hover:bg-red-100"
            >
              <i className="bx bx-x text-lg"></i>
              <span className="text-[12px] font-medium">Clear</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="border-color flex cursor-pointer items-center justify-center gap-1 rounded-md border bg-white px-[10px] py-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
          >
            <i className="bx bx-menu-filter text-2xl"></i>
            <span className="text-[12px] font-medium">Filters</span>
            {hasActiveFilters() && (
              <span className="ml-2 rounded-full bg-orange-500 px-2 py-1 text-xs text-white">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
            <div className="open-sans border-color relative mx-auto w-full max-w-md rounded-t-2xl border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 min-[448px]:rounded-t-md">
              <span>Filter Users</span>

              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-1 right-2 cursor-pointer text-2xl text-gray-600 hover:text-gray-800"
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
                  placeholder="Select Position"
                  options={[
                    { value: "", label: "All" },
                    { value: "Student", label: "Student" },
                    { value: "Instructor", label: "Instructor" },
                    { value: "Program Chair", label: "Program Chair" },
                    { value: "Associate Dean", label: "Associate Dean" },
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
                  placeholder="Select Program"
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
                  placeholder="Select Status"
                  options={[
                    { value: "", label: "All" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </div>

              {/* Remarks Filter - Only show for Students tab */}
              {studentsOnly && (
                <div className="mb-2">
                  <span className="font-color-gray mb-2 block text-[12px]">
                    Remarks
                  </span>
                  <RegisterDropDownSmall
                    name="remarks"
                    value={remarksFilter}
                    onChange={(e) => setRemarksFilter(e.target.value)}
                    placeholder="Select Remarks"
                    options={[
                      { value: "", label: "All" },
                      { value: "Regular", label: "Regular" },
                      { value: "Probationary", label: "Probationary" },
                      { value: "Advised to Shift", label: "Advised to Shift" },
                      { value: "Not Set", label: "Not Set" },
                    ]}
                  />
                </div>
              )}

              <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCampusFilter("");
                    setRoleFilter("");
                    setPositionFilter("");
                    setProgramFilter("");
                    setStateFilter("");
                    setRemarksFilter("");
                  }}
                  className="mb-2 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-[12px] py-[6px] text-gray-700 transition-all duration-150 hover:bg-gray-200"
                >
                  <span className="px-1 text-[14px]">Reset</span>
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="mb-2 flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[15px] py-[6px] text-white transition-all duration-150 hover:bg-orange-700"
                >
                  <span className="text-[14px]">Apply</span>
                </button>
              </div>

              {/* Reset All Button */}
            </div>
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Actions"
            className="border-color flex cursor-pointer items-center gap-3 rounded border bg-white p-1 text-gray-700 shadow-sm hover:bg-orange-500 hover:text-white"
          >
            <i className="bx bx-dots-vertical-rounded text-2xl"></i>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-35 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
              <div className="text-sm text-gray-700">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick("approve");
                  }}
                  className={`w-[130px] rounded-sm px-4 py-2 text-left text-black transition-colors ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <span className="block w-full">Approve</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick("activate");
                  }}
                  className={`w-[130px] rounded-sm px-4 py-2 text-left text-black transition-colors ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <span className="block w-full">Activate</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick("deactivate");
                  }}
                  className={`w-[130px] rounded-sm px-4 py-2 text-left text-black transition-colors ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <span className="block w-full">Deactivate</span>
                </button>

                {(currentUserRole === 4 || currentUserRole === 5) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteSelectedUsers();
                    }}
                    className={`w-[130px] rounded-sm px-4 py-2 text-left text-black transition-colors ${
                      selectedUsers.length === 0
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <span className="block w-full">Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info Mobile */}
      {showModal && selectedUser && (
        <>
          <div className="open-sans bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
            <div className="custom-scrollbar relative mx-2 w-full max-w-[480px] rounded-md bg-white shadow-2xl">
              {/* Header */}
              <div className="border-color relative flex items-center justify-between border-b py-2 pl-4">
                <h2 className="text-[14px] font-medium text-gray-700">
                  User Information
                </h2>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setRoleError(""); // Clear the error when modal is closed
                  }}
                  className="absolute top-1 right-1 cursor-pointer rounded-full px-[9px] py-[5px] text-gray-700 hover:text-gray-900"
                  title="Close"
                >
                  <i className="bx bx-x text-[20px]"></i>
                </button>
              </div>
              {/* Content */}
              <form className="edit-profile-modal-scrollbar max-h-[calc(90vh-60px)] overflow-y-auto px-5 py-4">
                {/* Fields */}
                <div className="mb-4 grid grid-cols-2 gap-x-4 text-start">
                  <div>
                    <span className="block text-[14px] text-gray-700">
                      First name
                    </span>
                    <div className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                      {selectedUser.firstName}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[14px] text-gray-700">
                      Last name
                    </span>
                    <div className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                      {selectedUser.lastName}
                    </div>
                  </div>
                  <div>
                    <span className="mt-2 block text-[14px] text-gray-700">
                      Campus
                    </span>
                    <div className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                      {selectedUser.campus}
                    </div>
                  </div>
                  <div>
                    <span className="mt-2 block text-[14px] text-gray-700">
                      User Code
                    </span>
                    <div className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                      {selectedUser.userCode}
                    </div>
                  </div>
                </div>

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {/* Credentials */}
                <div className="mb-4">
                  <span className="block text-start text-[14px] text-gray-700">
                    Program
                  </span>
                  <div className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                    {selectedUser.program}
                  </div>
                  <div className="mt-1 text-start text-[11px] text-gray-400">
                    The program the user is assigned to. Used to filter subjects
                    and academic content specific to your curriculum.
                  </div>
                </div>

                {/* Account details */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <span className="mb-1 block text-start text-[14px] text-gray-700">
                        Position
                      </span>
                      <RegisterDropDownSmall
                        name="role"
                        value={selectedUser.roleID}
                        onChange={(e) =>
                          handleRoleUpdate(
                            selectedUser.userID,
                            parseInt(e.target.value),
                          )
                        }
                        placeholder={(() => {
                          if (isUpdatingRole) {
                            return (
                              <div className="ml-18 flex items-center justify-center p-[3px]">
                                <span className="loader"></span>
                              </div>
                            );
                          }
                          switch (selectedUser.roleID) {
                            case 1:
                              return "Student";
                            case 2:
                              return "Faculty";
                            case 3:
                              return "Program Chair";
                            case 4:
                              return "Dean";
                            case 5:
                              return "Associate Dean";
                            default:
                              return "Select Position";
                          }
                        })()}
                        options={(() => {
                          if (isUpdatingRole) {
                            return [];
                          }
                          // If current user is Program Chair, only show Student and Faculty
                          if (currentUserRole === 3) {
                            // Don't show any options if the selected user is a Program Chair
                            if (selectedUser.roleID === 3) {
                              return [];
                            }
                            return [
                              ...(selectedUser.roleID !== 1
                                ? [{ value: "1", label: "Student" }]
                                : []),
                              ...(selectedUser.roleID !== 2
                                ? [{ value: "2", label: "Faculty" }]
                                : []),
                            ];
                          }
                          // If current user is Dean, show all roles except current user's role
                          const currentUser = JSON.parse(
                            localStorage.getItem("user"),
                          );
                          const isCurrentUser =
                            selectedUser.userID === currentUser.userID;
                          const isDean = selectedUser.roleID === 4;

                          return [
                            ...(selectedUser.roleID !== 1
                              ? [{ value: "1", label: "Student" }]
                              : []),
                            ...(selectedUser.roleID !== 2
                              ? [{ value: "2", label: "Faculty" }]
                              : []),
                            ...(selectedUser.roleID !== 3
                              ? [{ value: "3", label: "Program Chair" }]
                              : []),
                            ...(currentUserRole === 4 &&
                            selectedUser.roleID !== 4
                              ? [{ value: "4", label: "Dean" }]
                              : []),
                            ...(selectedUser.roleID !== 5
                              ? [{ value: "5", label: "Associate Dean" }]
                              : []),
                          ].filter((option) => {
                            // If this is the current user and they're a Dean, only allow demotion if there are other Deans
                            if (
                              isCurrentUser &&
                              isDean &&
                              option.value !== "4"
                            ) {
                              return otherDeansCount > 1;
                            }
                            return true;
                          });
                        })()}
                        disabled={isUpdatingRole}
                        isLoading={isUpdatingRole}
                      />
                    </div>
                    <div>
                      <span className="block text-start text-[14px] text-gray-700">
                        Email Address
                      </span>
                      <div className="peer mt-1 w-full truncate rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                  {roleError && (
                    <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                      {roleError}
                    </div>
                  )}
                </div>

                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                <div className="mb-3 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="block text-start text-[14px] text-gray-700">
                      Approval Status:
                    </span>
                    <span
                      className={`text-[14px] font-semibold capitalize ${
                        selectedUser.status === "registered"
                          ? "text-green-700"
                          : selectedUser.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="block text-start text-[14px] text-gray-700">
                      Account Status:
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        selectedUser.isActive
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {/* Action Buttons Row */}
                {/* Single Description Above Buttons */}
                {selectedUser.status === "pending" &&
                  !selectedUser.isActive && (
                    <>
                      <span className="block text-start text-[14px] font-semibold text-gray-700">
                        Approve this Account?
                      </span>
                      <div className="mt-1 text-start text-[11px] text-gray-400">
                        Approving this account will grant the user access to the
                        system based on their assigned position.
                      </div>
                    </>
                  )}
                {selectedUser.status === "registered" &&
                  selectedUser.isActive && (
                    <>
                      <span className="block text-start text-[14px] font-semibold text-gray-700">
                        Deactivate this Account?
                      </span>
                      <div className="mt-1 text-start text-[11px] text-gray-400">
                        Deactivating this account will disable access without
                        deleting the user's data. You can reactivate it at any
                        time.
                      </div>
                    </>
                  )}
                {selectedUser.status === "registered" &&
                  !selectedUser.isActive && (
                    <>
                      <span className="block text-start text-[14px] font-semibold text-gray-700">
                        Activate this Account?
                      </span>
                      <div className="mt-1 text-start text-[11px] text-gray-400">
                        Approving this account will grant the user access to the
                        system based on their assigned position. You can
                        deactivate it at any time.
                      </div>
                    </>
                  )}
                {(currentUserRole === 4 || currentUserRole === 5) &&
                  users.length > 0 &&
                  selectedUser &&
                  (selectedUser.status !== "pending" &&
                  selectedUser.status !== "registered" ? (
                    <>
                      <span className="block text-start text-[14px] font-semibold text-gray-700">
                        Delete this Account?
                      </span>
                      <div className="mt-1 text-start text-[11px] text-gray-400">
                        This will permanently remove the user and all their data
                        from the system.
                      </div>
                    </>
                  ) : null)}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedUser.status === "pending" &&
                    !selectedUser.isActive && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleApproveUser(selectedUser.userID);
                        }}
                        disabled={isApproving}
                        className={`min-w-[120px] flex-1 cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isApproving ? "cursor-not-allowed bg-gray-500" : "bg-green-500 hover:bg-green-700 active:scale-98"} disabled:opacity-50`}
                      >
                        {isApproving ? (
                          <div className="flex items-center justify-center">
                            <span className="loader-white"></span>
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </button>
                    )}
                  {selectedUser.status === "registered" &&
                    selectedUser.isActive && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeactivateUser(selectedUser.userID);
                        }}
                        disabled={isDeactivating}
                        className={`min-w-[120px] flex-1 cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isDeactivating ? "cursor-not-allowed bg-gray-500" : "bg-red-500 hover:bg-red-700 active:scale-98"} disabled:opacity-50`}
                      >
                        {isDeactivating ? (
                          <div className="flex items-center justify-center">
                            <span className="loader-white"></span>
                          </div>
                        ) : (
                          "Deactivate"
                        )}
                      </button>
                    )}
                  {selectedUser.status === "registered" &&
                    !selectedUser.isActive && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleActivateUser(selectedUser.userID);
                        }}
                        disabled={isActivating}
                        className={`min-w-[120px] flex-1 cursor-pointer rounded-lg py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isActivating ? "cursor-not-allowed bg-gray-500" : "bg-green-500 hover:bg-green-700 active:scale-98"} disabled:opacity-50`}
                      >
                        {isActivating ? (
                          <div className="flex items-center justify-center">
                            <span className="loader-white"></span>
                          </div>
                        ) : (
                          "Activate"
                        )}
                      </button>
                    )}
                  {(currentUserRole === 4 || currentUserRole === 5) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteUser(selectedUser.userID);
                      }}
                      disabled={isDeleting}
                      className="min-w-[120px] flex-1 rounded-lg bg-red-600 py-2 text-[14px] font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete User"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <div className="rounded-t-sm border border-b-0 border-[rgb(200,200,200)] bg-white px-5 py-3 text-[12px] shadow-sm sm:text-[14px]">
        <span className="ml-0 text-sm font-medium text-gray-600">
          {studentsOnly
            ? `${getFilteredUsers().length} Student${getFilteredUsers().length !== 1 ? "s" : ""}`
            : `${getFilteredUsers().length} Other User${getFilteredUsers().length !== 1 ? "s" : ""}`}
          {statusFilter === "pending"
            ? ` (Pending)`
            : statusFilter === "registered"
              ? ` (Approved)`
              : ""}
        </span>
      </div>

      {/* User Table Mobile */}
      <div className="min-[1000px]:hidden">
        {loading || searchLoading || tabLoading ? (
          <div className="flex items-center justify-center border border-gray-300 bg-white p-8 shadow-sm">
            <div className="loader"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="border border-gray-300 bg-white p-4 text-center text-[14px] text-gray-700 shadow-sm">
            No users found.
          </div>
        ) : (
          getFilteredUsers().map((user) => (
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

                  {studentsOnly && (
                    <div className="truncate text-[10px] text-gray-600">
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] font-semibold ${getRemarksStyling(user.remarks)}`}
                      >
                        {getRemarksDisplay(user.remarks)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                  className="mr-2 flex items-center justify-center text-gray-700 hover:text-orange-500"
                >
                  <i className="bx bx-contact-book text-[25px] leading-none"></i>
                </button>
                {(currentUserRole === 4 || currentUserRole === 5) && (
                  <button
                    className="flex items-center text-red-600 hover:text-red-800"
                    title="Delete User"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.userID);
                    }}
                  >
                    <i className="bx bx-trash text-[20px]"></i>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Table Desktop */}
      <div className="hidden w-full overflow-x-auto min-[1000px]:block">
        <table className="min-w-full table-fixed border border-[rgb(200,200,200)] bg-white shadow-md">
          <thead>
            <tr className="border-b border-[rgb(200,200,200)] bg-white text-[10px] text-[rgb(78,78,78)] sm:text-[12px]">
              <th className="w-[5%] px-2 py-3 text-left">
                <input
                  className="ml-3"
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedUsers(
                      e.target.checked
                        ? getFilteredUsers().map((user) => user.userID)
                        : [],
                    )
                  }
                />
              </th>
              <th className="w-[10%] px-2 py-1 text-left font-semibold text-nowrap">
                USER CODE
              </th>
              <th className="w-[15%] px-2 py-1 text-left font-semibold sm:hidden">
                Full Name
              </th>
              <th className="hidden max-w-[150px] truncate px-2 py-1 text-left font-semibold sm:table-cell">
                NAME
              </th>
              <th className="w-[20%] px-2 py-1 text-left font-semibold">
                EMAIL
              </th>
              <th className="w-[10%] px-2 py-1 text-left font-semibold">
                POSITION
              </th>
              <th className="w-[10%] px-2 py-1 text-left font-semibold">
                CAMPUS
              </th>
              <th className="w-[10%] px-2 py-1 text-center font-semibold">
                STATUS
              </th>
              <th className="w-[10%] px-2 py-1 text-center font-semibold">
                PROGRAM
              </th>
              <th className="w-[10%] px-2 py-1 text-center font-semibold">
                STATE
              </th>
              {studentsOnly && (
                <th className="w-[10%] px-2 py-1 text-center font-semibold">
                  REMARKS
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading || searchLoading || tabLoading ? (
              <tr>
                <td colSpan={studentsOnly ? "12" : "11"} className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="loader"></div>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={studentsOnly ? "12" : "11"}
                  className="py-4 text-center text-[14px] text-gray-700"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              getFilteredUsers().map((user) => (
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
                    className="hidden px-2 py-2 text-left sm:table-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      className="mt-1 ml-3"
                      type="checkbox"
                      checked={selectedUsers.includes(user.userID)}
                      onChange={() => handleCheckboxChange(user.userID)}
                    />
                  </td>

                  <td className="px-2 py-2 text-left text-nowrap">
                    {user.userCode}
                  </td>

                  <td className="max-w-[120px] truncate px-2 py-2 text-left text-nowrap">
                    <span>{`${user.firstName} ${user.lastName}`}</span>
                  </td>

                  <td className="max-w-[120px] truncate px-2 py-2 text-left">
                    <span>{user.email}</span>
                  </td>

                  <td className="px-2 py-2 text-left text-nowrap">
                    {user.role}
                  </td>
                  <td className="px-2 py-2 text-left text-nowrap">
                    {user.campus}
                  </td>

                  <td className="px-2 py-2 text-center font-semibold">
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

                  <td className="px-2 py-2 text-center">{user.program}</td>

                  <td className="px-2 py-2 text-center">
                    {user.isActive ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-red-500">Inactive</span>
                    )}
                  </td>
                  {studentsOnly && (
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`rounded-md px-2 py-1 text-[12px] font-semibold ${getRemarksStyling(user.remarks)}`}
                      >
                        {getRemarksDisplay(user.remarks)}
                      </span>
                    </td>
                  )}
                  <td
                    className="px-2 py-2 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="mr-1 flex items-center justify-center gap-2 text-gray-700 hover:text-orange-500"
                      >
                        <i className="bx bx-contact-book text-[25px] leading-none"></i>
                      </button>
                      {(currentUserRole === 4 || currentUserRole === 5) && (
                        <>
                          <div className="mx-2 h-[22px] w-px bg-gray-300"></div>
                          <button
                            className="mr-1 flex items-center gap-2 text-red-600 hover:text-red-800"
                            title="Delete User"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.userID);
                            }}
                          >
                            <i className="bx bx-trash text-[20px]"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isActivatingMultiple && <LoadingOverlay show={isActivatingMultiple} />}
      {isApprovingMultiple && <LoadingOverlay show={isApprovingMultiple} />}
      {isDeactivatingMultiple && (
        <LoadingOverlay show={isDeactivatingMultiple} />
      )}
      {isDeletingMultiple && <LoadingOverlay show={isDeletingMultiple} />}

      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {!loading && !error && renderPagination()}
    </div>
  );
};

export default UserList;
