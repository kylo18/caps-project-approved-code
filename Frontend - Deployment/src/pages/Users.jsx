import React, { useEffect, useState, useRef } from "react";
import SortCustomDropdown from "/src/components/sortCustomDropdown";
import ConfirmModal from "/src/components/confirmModal";
import LoadingOverlay from "/src/components/loadingOverlay";
import RegisterDropDownSmall from "/src/components/registerDropDownSmall";
import Toast from "/src/components/Toast";
import useToast from "/src/hooks/useToast";

import StudentsIcon from "/src/assets/symbols/students.svg";
import StudentsIconH from "/src/assets/symbols/studentshover.svg";

import FacultyIcon from "/src/assets/symbols/faculty.svg";
import FacultyIconH from "/src/assets/symbols/facultyhover.svg";

import AllUsersIcon from "/src/assets/symbols/all.svg";
import AllUsersIconH from "/src/assets/symbols/allhover.svg";

import emptyImage from "../assets/icons/empty.png";
import noInternetImage from "../assets/icons/404notfound.png";


import StudentPfp from "/src/assets/symbols/student.png";
import FacultyPfp from "/src/assets/symbols/faculty.png";
import ProgramChairPfp from "/src/assets/symbols/progchair.png";
import DeanPfp from "/src/assets/symbols/dean.png";

const UserList = () => {
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
  const [campusFilter, setCampusFilter] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState([]);
  const [programFilter, setProgramFilter] = useState([]);
  const [stateFilter, setStateFilter] = useState([]);
  const [remarksFilter, setRemarksFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // State for filter dropdown visibility
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const roleImages = {
    1: StudentPfp,
    2: FacultyPfp,
    3: ProgramChairPfp,
    4: DeanPfp,
    5: DeanPfp,
  };

  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // Add after other user action states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Add new state for user type tabs
  const [studentsOnly, setStudentsOnly] = useState(false); // true: students only, false: others only
  const [activeView, setActiveView] = useState("all"); // "all", "pending", "approved", "students", "faculty"

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Get toast functions from hook
  const { toast, showToast } = useToast();

  // Helper function to get remarks display text
  const getRemarksDisplay = (remarks) => {
    if (!remarks) return "Not Set";

    // Handle both string and numeric values
    if (typeof remarks === "string") {
      const normalized = remarks.trim().toLowerCase();
      if (!normalized) return "Not Set";
      if (normalized === "regular") return "Regular";
      if (normalized === "probationary") return "Probationary";
      if (normalized === "advised to shift") return "Advised to Shift";
      if (normalized === "not set") return "Not Set";
      // Fallback: keep original (but trimmed) to avoid hiding users due to casing
      return remarks.trim();
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

    // Filter by activeView
    if (activeView === "students") {
      filteredUsers = users.filter((user) => user.roleID === 1);
    } else if (activeView === "faculty") {
      filteredUsers = users.filter((user) => user.roleID !== 1);
    } else if (activeView === "pending") {
      filteredUsers = users.filter((user) => user.status === "pending");
    } else if (activeView === "approved") {
      filteredUsers = users.filter((user) => user.status === "registered");
    } else {
      // "all" - show all users
      filteredUsers = users;
    }

    // Filter by remarks if remarks filter is applied and we're viewing students
    if (activeView === "students" && remarksFilter) {
      filteredUsers = filteredUsers.filter((user) => {
        const userRemarks = getRemarksDisplay(user.remarks);
        return (
          (userRemarks || "").toLowerCase().trim() ===
          (remarksFilter || "").toLowerCase().trim()
        );
      });
    }

    // Filter by approval status if applied (Pending/Approved/Rejected)
    if (statusFilter && statusFilter !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => (user.status || "").toLowerCase().trim() === statusFilter,
      );
    }

    // Filter by campus (OR logic - user matches any selected campus)
    if (Array.isArray(campusFilter) && campusFilter.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        const userCampus = (user.campus || "").trim();
        return campusFilter.some((filterCampus) => {
          return userCampus === filterCampus.trim();
        });
      });
    }

    // Filter by position (OR logic - user matches any selected position)
    if (Array.isArray(positionFilter) && positionFilter.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        // Check if user.role matches any of the selected positions
        const userRole = (user.role || "").trim();
        const matches = positionFilter.some((filterRole) => {
          // Handle case-insensitive comparison and trim whitespace
          const filterRoleTrimmed = filterRole.trim();
          return userRole === filterRoleTrimmed;
        });
        return matches;
      });
    }

    // Filter by program (OR logic - user matches any selected program)
    if (Array.isArray(programFilter) && programFilter.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        const userProgram = (user.program || "").trim();
        return programFilter.some((filterProgram) => {
          return userProgram === filterProgram.trim();
        });
      });
    }

    // Filter by status/state (OR logic - user matches any selected status)
    if (Array.isArray(stateFilter) && stateFilter.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        const userState = user.isActive ? "Active" : "Inactive";
        return stateFilter.includes(userState);
      });
    }

    return filteredUsers;
  };

  const hasArrayFiltersActive = () => {
    return (
      (Array.isArray(campusFilter) && campusFilter.length > 0) ||
      (Array.isArray(positionFilter) && positionFilter.length > 0) ||
      (Array.isArray(programFilter) && programFilter.length > 0) ||
      (Array.isArray(stateFilter) && stateFilter.length > 0)
    );
  };

  const getDisplayedUsers = () => {
    const filteredUsers = getFilteredUsers();
    if (!hasArrayFiltersActive()) return filteredUsers;

    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  };

  const resetSearchAndFilters = () => {
    setSearchQuery("");
    setCampusFilter([]);
    setRoleFilter("");
    setPositionFilter([]);
    setProgramFilter([]);
    setStateFilter([]);
    setRemarksFilter("");
    setShowFilters(false);
    setShowCampusDropdown(false);
    setShowPositionDropdown(false);
    setShowProgramDropdown(false);
    setShowStatusDropdown(false);
    setSelectedUsers([]);
    setCurrentPage(1);
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return (
      (Array.isArray(campusFilter) && campusFilter.length > 0) ||
      roleFilter ||
      (Array.isArray(positionFilter) && positionFilter.length > 0) ||
      (Array.isArray(programFilter) && programFilter.length > 0) ||
      (Array.isArray(stateFilter) && stateFilter.length > 0) ||
      (activeView === "students" && remarksFilter)
    );
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
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
    const token = sessionStorage.getItem("token");

    if (!token) {
      setError("No token found, please log in.");
      setLoading(false);
      setSearchLoading(false);
      setTabLoading(false);
      return;
    }

    try {
      // Determine userType based on activeView
      let userType = "all";
      if (activeView === "students") {
        userType = "students";
      } else if (activeView === "faculty") {
        userType = "others"; // faculty are non-students
      } else {
        userType = "all"; // "all", "pending", "approved" show all users
      }

      // Build query parameters
      // If we have array filters, don't send them to backend - we'll filter client-side
      // This ensures we get all users and can properly filter with OR logic
      const hasArrayFilters = 
        (Array.isArray(campusFilter) && campusFilter.length > 0) ||
        (Array.isArray(positionFilter) && positionFilter.length > 0) ||
        (Array.isArray(programFilter) && programFilter.length > 0) ||
        (Array.isArray(stateFilter) && stateFilter.length > 0);

      const queryParams = new URLSearchParams({
        page: hasArrayFilters ? 1 : page, // Reset to page 1 when using array filters (client-side pagination)
        limit: hasArrayFilters ? 10000 : itemsPerPage, // Fetch more if we need to filter client-side
        search: debouncedSearchQuery,
        // When array filters are active, skip backend filters and do client-side filtering
        status: hasArrayFilters ? "all" : statusFilter,
        campus: hasArrayFilters ? "" : (Array.isArray(campusFilter) ? "" : campusFilter),
        role: hasArrayFilters ? "" : roleFilter,
        position: hasArrayFilters ? "" : (Array.isArray(positionFilter) ? "" : positionFilter),
        program: hasArrayFilters ? "" : (Array.isArray(programFilter) ? "" : programFilter),
        state: hasArrayFilters ? "" : (Array.isArray(stateFilter) ? "" : stateFilter),
        remarks: hasArrayFilters ? "" : remarksFilter,
        userType: userType, // Keep userType for view filtering (students/faculty/all)
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
      setUsers(data.users || []);
      const total = data.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));
      setTotalUsers(total);
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
    activeView, // Add activeView to dependencies
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

  // Ref for "select all" checkbox to support indeterminate state
  const selectAllRef = useRef(null);
  
  // Refs for filter dropdowns
  const campusDropdownRef = useRef(null);
  const positionDropdownRef = useRef(null);
  const programDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

  // Keep "select all" checkbox in sync with row selections
  useEffect(() => {
    if (!selectAllRef.current) return;

    const displayedUsers = getDisplayedUsers();
    const displayedIds = displayedUsers.map((u) => u.userID);
    const selectedOnPageCount = displayedIds.filter((id) =>
      selectedUsers.includes(id),
    ).length;

    if (displayedIds.length === 0 || selectedOnPageCount === 0) {
      selectAllRef.current.indeterminate = false;
      selectAllRef.current.checked = false;
    } else if (selectedOnPageCount === displayedIds.length) {
      selectAllRef.current.indeterminate = false;
      selectAllRef.current.checked = true;
    } else {
      selectAllRef.current.indeterminate = true;
    }
  }, [selectedUsers, users, currentPage, campusFilter, positionFilter, programFilter, stateFilter, statusFilter, remarksFilter, activeView]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (campusDropdownRef.current && !campusDropdownRef.current.contains(event.target)) {
        setShowCampusDropdown(false);
      }
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target)) {
        setShowPositionDropdown(false);
      }
      if (programDropdownRef.current && !programDropdownRef.current.contains(event.target)) {
        setShowProgramDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to approve a single user
  const handleApproveUser = async (userID) => {
    const token = sessionStorage.getItem("token");
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
    const token = sessionStorage.getItem("token");
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
    const token = sessionStorage.getItem("token");
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
    const token = sessionStorage.getItem("token");
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
    const token = sessionStorage.getItem("token");
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
    const token = sessionStorage.getItem("token");
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


  // Function to handle page change
  const handlePageChange = (newPage) => {
    const filteredUsersCount = getFilteredUsers().length;
    const isClientSidePagination = hasArrayFiltersActive();
    const effectiveTotalPages = isClientSidePagination
      ? Math.max(1, Math.ceil(filteredUsersCount / itemsPerPage))
      : totalPages;

    if (newPage < 1 || newPage > effectiveTotalPages) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (isClientSidePagination) {
      setCurrentPage(newPage);
      return;
    }

    setLoading(true);
    fetchUsers(newPage);
  };

  // Function to handle role update
  const handleRoleUpdate = async (userID, newRoleID) => {
    const token = sessionStorage.getItem("token");
    setIsUpdatingRole(true);
    setRoleError(""); // Clear any previous errors
    try {
      // Check if current user is trying to demote themselves from Dean
      const currentUser = JSON.parse(sessionStorage.getItem("user"));
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
    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
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
    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
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

  

  const renderPagination = () => {
    const filteredUsersCount = getFilteredUsers().length;
    const isClientSidePagination = hasArrayFiltersActive();
    const effectiveTotalPages = isClientSidePagination
      ? Math.max(1, Math.ceil(filteredUsersCount / itemsPerPage))
      : totalPages;

    if (effectiveTotalPages <= 1) return null;
  
    const pages = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(effectiveTotalPages, startPage + maxVisiblePages - 1);
  
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
  
    for (let i = startPage; i <= endPage; i++) {
      const isActive = currentPage === i;
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`outfit relative flex h-8 min-w-[2rem] items-center justify-center rounded-full px-3 text-[14px] transition-colors ${
            isActive
              ? "font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {i}
          {isActive && (
            <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-orange-500" />
          )}
        </button>
      );
    }
  
    if (endPage < effectiveTotalPages) {
      pages.push(
        <span
          key="ellipsis"
          className="flex h-8 items-center justify-center px-2 text-[14px] text-gray-400"
        >
          ...
        </span>
      );
    }
  
    return (
      <div className="mt-4 flex items-center justify-center outfit mb-3">
        <div className="inline-flex items-center rounded-full border py-1 border-gray-200 bg-white px-1 ">
  
          {/* First */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`mx-1 flex h-8 w-8 items-center cursor-pointer justify-center rounded-full transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="First page"
            >
              <i className="bx bx-chevrons-left text-[24px]" />
            </button>

            {/* Previous */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`mx-1 flex h-8 w-8 items-center justify-center cursor-pointer rounded-full transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Previous page"
            >
              <i className="bx bx-chevron-left text-[28px]" />
            </button>
          
          <span className="mx-2 w-[1px] self-stretch bg-gray-200" />
  
          {/* Page Numbers */}
          <div className="mx-1 flex items-center">{pages}</div>
  
          <span className="mx-2 w-[1px] self-stretch bg-gray-200" />
  
          {/* Next */}
            <button
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === effectiveTotalPages}
            className={`mx-1 inline-flex h-8 items-center justify-center gap-1 rounded-full px-2 cursor-pointer transition-colors ${
              currentPage === effectiveTotalPages
                ? "cursor-not-allowed text-gray-300"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Next page"
          >
            <span className="ml-2 flex items-center leading-none text-[14px] font-medium">
              Next
            </span>
            <i className="bx bx-chevron-right flex items-center leading-none text-[24px]" />
          </button>

          {/* Last */}
          <button
             onClick={() => handlePageChange(effectiveTotalPages)}
             disabled={currentPage === effectiveTotalPages}
            className={`mx-1 flex h-8 w-8 items-center justify-center rounded-full cursor-pointer transition-colors ${
              currentPage === effectiveTotalPages
                ? "cursor-not-allowed text-gray-300"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Last page"
          >
            <i className="bx bx-chevrons-right text-[24px]" />
          </button>
  
        </div>
      </div>
    );
  };
  

  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6 pb-0">

      
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="outfit-500 relative text-[14px]">
            {/* Search icon */}
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-500" />

            <input
              type="text"
              placeholder="Search users..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              value={searchQuery}
              maxLength={50}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 mr-3 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <i className="bx bx-x text-xl" />
              </button>
            )}
          </div>

          <div className="my-4 h-px bg-gray-200" />

          {/* Header with title and action buttons */}
          <div className="flex items-center justify-between">
            <div>
              <p className="outfit-500 mt-1 text-[20px] text-black">
                {selectedUsers.length > 0
                  ? "Select the users you want to modify"
                  : hasActiveFilters()
                    ? "Filtered users"
                    : searchQuery.trim()
                      ? `Search results for "${searchQuery}"`
                      : activeView === "all"
                        ? "All users"
                        : activeView === "students"
                          ? "Students"
                          : activeView === "faculty"
                            ? "Faculty"
                            : activeView === "pending"
                              ? "Pending users"
                              : "Approved users"}
              </p>
            </div>

          

            <div className="flex items-center gap-3">
              {/* Filter Buttons */}
              <div className="flex items-center justify-center gap-2">
                {hasActiveFilters() && (
                  <button
                    onClick={() => {
                      setCampusFilter([]);
                      setRoleFilter("");
                      setPositionFilter([]);
                      setProgramFilter([]);
                      setStateFilter([]);
                      setRemarksFilter("");
                    }}
                    className="outfit -mb-4 flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[14px] font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <i className="bx bx-x text-lg"></i>
                    <span>Clear Filters</span>
                  </button>
                )}
                
                {/* Campus Filter Button */}
                <div className="relative" ref={campusDropdownRef}>
                  <button
                    onClick={() => {
                      setShowCampusDropdown(!showCampusDropdown);
                      setShowPositionDropdown(false);
                      setShowProgramDropdown(false);
                      setShowStatusDropdown(false);
                    }}
                    className={`outfit-500  -mb-4 mt-2 inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-4 py-2 text-[14px]  transition-colors ${
                      campusFilter.length > 0
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>Campus</span>
                    {campusFilter.length > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {campusFilter.length}
                      </span>
                    )}
                    <i className="bx bx-chevron-down text-xl"></i>
                  </button>
                  {showCampusDropdown && (
                    <div className="absolute right-0 z-50 mt-3 w-45 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {[
                          { value: "Main Campus", label: "Dapitan" },
                          { value: "Dipolog Campus", label: "Dipolog" },
                          { value: "Siocon Campus", label: "Siocon" },
                          { value: "Katipunan Campus", label: "Katipunan" },
                          { value: "Tampilisan Campus", label: "Tampilisan" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="outfit flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={campusFilter.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampusFilter([...campusFilter, option.value]);
                                } else {
                                  setCampusFilter(
                                    campusFilter.filter((c) => c !== option.value)
                                  );
                                }
                              }}
                              className="h-3 w-3 cursor-pointer rounded border-gray-200  "
                            />
                            <span className="text-[14px] text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Position Filter Button */}
                <div className="relative" ref={positionDropdownRef}>
                  <button
                    onClick={() => {
                      setShowPositionDropdown(!showPositionDropdown);
                      setShowCampusDropdown(false);
                      setShowProgramDropdown(false);
                      setShowStatusDropdown(false);
                    }}
                    className={`outfit-500  -mb-4 mt-2 inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-4 py-2 text-[14px]  transition-colors ${
                      positionFilter.length > 0
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>Position</span>
                    {positionFilter.length > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {positionFilter.length}
                      </span>
                    )}
                    <i className="bx bx-chevron-down text-xl"></i>
                  </button>
                  {showPositionDropdown && (
                    <div className="absolute right-0 z-50 mt-3 w-45 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {[
                          { value: "Student", label: "Student" },
                          { value: "Instructor", label: "Instructor" },
                          { value: "Program Chair", label: "Program Chair" },
                          { value: "Associate Dean", label: "Associate Dean" },
                          { value: "Dean", label: "Dean" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={positionFilter.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPositionFilter([...positionFilter, option.value]);
                                } else {
                                  setPositionFilter(
                                    positionFilter.filter((p) => p !== option.value)
                                  );
                                }
                              }}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Program Filter Button */}
                <div className="relative" ref={programDropdownRef}>
                  <button
                    onClick={() => {
                      setShowProgramDropdown(!showProgramDropdown);
                      setShowCampusDropdown(false);
                      setShowPositionDropdown(false);
                      setShowStatusDropdown(false);
                    }}
                    className={`outfit-500  -mb-4 mt-2 inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-4 py-2 text-[14px]  transition-colors ${
                      programFilter.length > 0
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>Program</span>
                    {programFilter.length > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {programFilter.length}
                      </span>
                    )}
                    <i className="bx bx-chevron-down text-xl"></i>
                  </button>
                  {showProgramDropdown && (
                    <div className="absolute right-0 z-50 mt-3 w-45 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {[
                          { value: "BS-CpE", label: "BS-CpE" },
                          { value: "BS-EE", label: "BS-EE" },
                          { value: "BS-CE", label: "BS-CE" },
                          { value: "BS-ECE", label: "BS-ECE" },
                          { value: "BS-ABE", label: "BS-ABE" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={programFilter.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProgramFilter([...programFilter, option.value]);
                                } else {
                                  setProgramFilter(
                                    programFilter.filter((p) => p !== option.value)
                                  );
                                }
                              }}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Filter Button */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowCampusDropdown(false);
                      setShowPositionDropdown(false);
                      setShowProgramDropdown(false);
                    }}
                    className={`outfit-500  -mb-4 mt-2 inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-4 py-2 text-[14px]  transition-colors ${
                      stateFilter.length > 0
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>Status</span>
                    {stateFilter.length > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {stateFilter.length}
                      </span>
                    )}
                    <i className="bx bx-chevron-down text-xl"></i>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute right-0 z-50 mt-3 w-45 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {[
                          { value: "Active", label: "Active" },
                          { value: "Inactive", label: "Inactive" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={stateFilter.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setStateFilter([...stateFilter, option.value]);
                                } else {
                                  setStateFilter(
                                    stateFilter.filter((s) => s !== option.value)
                                  );
                                }
                              }}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="flex flex-1 flex-col">
          {/* User Count */}
          {!loading && !error && !tabLoading && (
            <div className="outfit-500 mb-2 flex items-center justify-between">
              {(() => {
                const filteredUsers = getFilteredUsers();

                // For "All users" with no search/filters, use the backend total.
                const useBackendTotal =
                  activeView === "all" &&
                  !searchQuery.trim() &&
                  !hasActiveFilters();

                const count = useBackendTotal
                  ? totalUsers
                  : filteredUsers.length;

                return (
                  <p className="text-[14px] text-gray-600">
                    {count} {count === 1 ? "User" : "Users"}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-end min-[448px]:justify-center min-[448px]:p-2">
              <div className="outfit border-color relative mx-auto w-full max-w-md rounded-t-2xl border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700 min-[448px]:rounded-t-md">
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
                      value={Array.isArray(campusFilter) ? (campusFilter.length > 0 ? campusFilter[0] : "") : campusFilter}
                      onChange={(e) => setCampusFilter(e.target.value ? [e.target.value] : [])}
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
                    value={Array.isArray(positionFilter) ? (positionFilter.length > 0 ? positionFilter[0] : "") : positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value ? [e.target.value] : [])}
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
                    value={Array.isArray(programFilter) ? (programFilter.length > 0 ? programFilter[0] : "") : programFilter}
                    onChange={(e) => setProgramFilter(e.target.value ? [e.target.value] : [])}
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
                    Account Status
                  </span>
                  <RegisterDropDownSmall
                    name="state"
                    value={Array.isArray(stateFilter) ? (stateFilter.length > 0 ? stateFilter[0] : "") : stateFilter}
                    onChange={(e) => setStateFilter(e.target.value ? [e.target.value] : [])}
                    placeholder="Select Status"
                    options={[
                      { value: "", label: "All" },
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ]}
                  />
                </div>

                {/* Approval Status Filter */}
                <div className="mb-2">
                  <span className="font-color-gray mb-2 block text-[12px]">
                    Approval Status
                  </span>
                  <RegisterDropDownSmall
                    name="approvalStatus"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value || "all")}
                    placeholder="Select Approval Status"
                    options={[
                      { value: "all", label: "All" },
                      { value: "pending", label: "Pending" },
                      { value: "registered", label: "Approved" },
                      { value: "unregistered", label: "Rejected" },
                    ]}
                  />
                </div>

                {/* Remarks Filter - Only show for Students view */}
                {activeView === "students" && (
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
                      setCampusFilter([]);
                      setRoleFilter("");
                      setPositionFilter([]);
                      setProgramFilter([]);
                      setStateFilter([]);
                      setRemarksFilter("");
                      setStatusFilter("all");
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
              </div>
            </div>
          )}


      {/* User Info Mobile */}
      {showModal && selectedUser && (
        <>
          <div className="outfit bg-opacity-40 lightbox-bg fixed inset-0 z-100 flex items-center justify-center">
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
                            sessionStorage.getItem("user"),
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
                        Remove this Account?
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
                      {isDeleting ? "Removing..." : "Remove User"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}

          {loading || searchLoading || tabLoading ? (
            <div className="outfit flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="loader mx-auto mb-2"></div>
                <p className="text-[14px] text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
              <div className="text-center">
                <img
                  src={noInternetImage}
                  alt="Unstable"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="text-sm text-gray-600">
                  Unstable network, please check your internet connection and try again.
                </p>
              </div>
            </div>
          ) : getFilteredUsers().length === 0 ? (
            <div className="outfit flex h-130 flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
              <div className="text-center">
                <img
                  src={emptyImage}
                  alt="No users available"
                  className="mx-auto mb-3 h-32 w-32 opacity-80"
                />
                <p className="text-sm text-gray-600">
                  {searchQuery.trim()
                    ? "No users found matching your search."
                    : "No users available."}
                </p>
              </div>
            </div>
          ) : (
            <div className="hidden min-[1000px]:block outfit rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div>
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="w-6 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          ref={selectAllRef}
                          onChange={(e) => {
                            const displayedIds = getDisplayedUsers().map(
                              (u) => u.userID,
                            );

                            if (e.target.checked) {
                              setSelectedUsers((prev) => {
                                const set = new Set(prev);
                                displayedIds.forEach((id) => set.add(id));
                                return Array.from(set);
                              });
                            } else {
                              setSelectedUsers((prev) =>
                                prev.filter((id) => !displayedIds.includes(id)),
                              );
                            }
                          }}
                          checked={
                            (() => {
                              const displayedIds = getDisplayedUsers().map(
                                (u) => u.userID,
                              );
                              if (displayedIds.length === 0) return false;
                              return displayedIds.every((id) =>
                                selectedUsers.includes(id),
                              );
                            })()
                          }
                          className="h-4 w-4 mt-1 cursor-pointer rounded border-gray-500 text-orange-500"
                        />
                      </th>
                      <th className="py-3 text-left text-[12px] font-medium tracking-wider text-gray-600 uppercase">
                        User Information 
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase">
                        Position
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase">
                        Program
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase">
                        Campus
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                        Status
                      </th>
                      {activeView === "students" && (
                        <th className="px-3 py-3 text-center text-xs font-medium tracking-wider text-gray-600 uppercase">
                          Remarks
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y  divide-gray-200 bg-white">
                    {getDisplayedUsers().map((user) => (
                      <tr
                        key={user.userID}
                        className="group cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                      >
                        <td
                          className="w-12 px-4 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.userID)}
                            onChange={() => handleCheckboxChange(user.userID)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-gray-500 text-orange-500"
                          />
                        </td>
                        <td
                          className="py-2 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                            <img
                                src={roleImages[user.roleID] || StudentPfp}
                                alt={`${user.firstName} ${user.lastName}`}
                              className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="">
                              <div className="outfit text-sm font-semibold text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="outfit mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <span>{user.userCode}</span>
                                {user.email && (
                                  <>
                                    <span>•</span>
                                    <span className="outfit truncate max-w-[200px]">{user.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 outfit">{user.role}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 outfit">{user.program}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 outfit">{user.campus}</span>
                        </td>
                        <td className="outfit px-3 py-3 text-center whitespace-nowrap">
                          <span
                            className="rounded-md px-2 py-1 text-[14px]"
                              
                          >
                            {user.status === "registered"
                              ? "Approved"
                              : user.status === "unregistered"
                                ? "Rejected"
                                : "Pending"}
                          </span>
                        </td>
                        {activeView === "students" && (
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span
                              className={`rounded-md px-2 py-1 text-[12px] font-semibold ${getRemarksStyling(user.remarks)}`}
                            >
                              {getRemarksDisplay(user.remarks)}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(currentUserRole === 4 || currentUserRole === 5) && (
                              <button
                                className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                                title="Remove User"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.userID);
                                }}
                              >
                                <i className="bx bx-trash text-xl"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Table Mobile */}
          <div className="min-[1000px]:hidden">
            {loading || searchLoading || tabLoading ? (
              <div className="flex items-center justify-center border border-gray-300 bg-white p-8 shadow-sm">
                <div className="loader"></div>
              </div>
            ) : getFilteredUsers().length === 0 ? (
              <div className="border border-gray-300 bg-white p-4 text-center text-[14px] text-gray-700 shadow-sm">
                No users found.
              </div>
            ) : (
              getDisplayedUsers().map((user) => (
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

                      {activeView === "students" && (
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
                        title="Remove User"
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

          {/* Pagination */}
          {!loading && !searchLoading && !tabLoading && !error && (
            <div className={`flex justify-center pt-4 ${selectedUsers.length > 0 ? 'pb-28' : 'pb-6'}`}>
              {renderPagination()}
            </div>
          )}
        </div>
      </div>


      {isActivatingMultiple && <LoadingOverlay show={isActivatingMultiple} />}
      {isApprovingMultiple && <LoadingOverlay show={isApprovingMultiple} />}
      {isDeactivatingMultiple && (
        <LoadingOverlay show={isDeactivatingMultiple} />
      )}
      {isDeletingMultiple && <LoadingOverlay show={isDeletingMultiple} />}

      {/* Selection Overlay Banner */}
      {selectedUsers.length > 0 && (
        <div className="outfit fixed right-0 bottom-5 left-[220px] z-50 md:left-[276px] lg:left-[220px]">

          <div className="px-6">
            <div className="rounded-xl bg-gray-800 px-5 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-medium text-white">
                    {selectedUsers.length}{" "}
                    {selectedUsers.length === 1 ? "user" : "users"} selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApproveSelectedUsers}
                    disabled={isApprovingMultiple || isDeleting}
                    className=" flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    <i className="bx bx-check text-lg"></i>
                    Approve
                  </button>
                  <button
                    onClick={handleActivateSelectedUsers}
                    disabled={isActivatingMultiple || isDeleting}
                    className=" flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    <i className="bx bx-arrow-big-up-line text-lg"></i>
                    Activate
                  </button>
                  <button
                    onClick={handleDeactivateSelectedUsers}
                    disabled={isDeactivatingMultiple || isDeleting}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    <i className="bx bx-arrow-big-down-line text-lg"></i>
                    Deactivate
                  </button>
                  {(currentUserRole === 4 || currentUserRole === 5) && (
                    <button
                      onClick={handleDeleteSelectedUsers}
                      disabled={isDeletingMultiple || isDeleting}
                      className=" flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      <i className="bx bx-trash text-lg"></i>
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-gray-700"
                    aria-label="Close"
                  >
                    <i className="bx bx-x text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default UserList;



