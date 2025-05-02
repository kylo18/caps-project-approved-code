import React, { useEffect, useState, useRef } from "react";
import SortCustomDropdown from "./sortCustomDropdown";
import ConfirmModal from "./confirmModal";
import LoadingOverlay from "./loadingOverlay";
import ModalDropdown from "./modalDropdown";
import { Tooltip } from "flowbite-react";

const UserList = () => {
  const dropdownRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [sortStatus, setSortStatus] = useState("All");

  const [isApproving, setIsApproving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [isApprovingMultiple, setIsApprovingMultiple] = useState(false);
  const [isActivatingMultiple, setIsActivatingMultiple] = useState(false);
  const [isDeactivatingMultiple, setIsDeactivatingMultiple] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");

  const [campusFilter, setCampusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false); // To toggle the filter dropdown visibility

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

  const handleCheckboxChange = (userID) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userID)
        ? prevSelected.filter((id) => id !== userID)
        : [...prevSelected, userID],
    );
  };

  const filteredUsers = users.filter((user) => {
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

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

  //Skeleton Table
  /*if (loading) {
    return (
      <div>
        <div className="mt-20 min-w-full table-fixed border border-[rgb(200,200,200)] bg-white p-2 shadow-md">
          <div className="flex animate-pulse items-center space-x-4">
            <div className="skeleton shimmer h-16 w-16 rounded-md"></div>
            <div className="flex-1">
              <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
              <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }*/

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="font-inter mt-10 p-2">
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
          <div className="lightbox-bg fixed inset-0 z-100 flex flex-col items-center justify-center">
            <div className="font-inter border-color relative mx-auto w-full max-w-md rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-700">
              <span>Filter Users</span>

              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-1 right-2 text-2xl text-gray-600 hover:text-gray-800"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className="border-color relative mx-auto w-full max-w-md rounded-b-md border border-t-0 bg-white p-2 sm:px-4">
              {/* Campus Filter */}
              <div className="mb-2">
                <span className="font-color-gray mb-2 block text-[12px]">
                  Campus
                </span>
                <div>
                  <ModalDropdown
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
                <ModalDropdown
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
                <ModalDropdown
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
                <ModalDropdown
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
                <button
                  onClick={() => {
                    handleApproveSelectedUsers();
                    setDropdownOpen(false);
                  }}
                  disabled={selectedUsers.length === 0}
                  className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleActivateSelectedUsers();
                    setDropdownOpen(false);
                  }}
                  disabled={selectedUsers.length === 0}
                  className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Activate
                </button>
                <button
                  onClick={() => {
                    handleDeactivateSelectedUsers();
                    setDropdownOpen(false);
                  }}
                  disabled={selectedUsers.length === 0}
                  className={`w-full rounded-sm px-4 py-2 text-left text-black ${
                    selectedUsers.length === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Deactivate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info Mobile */}
      {showModal && selectedUser && (
        <div className="bg-opacity-30 lightbox-bg fixed inset-0 z-55 flex items-center justify-center">
          <div className="relative w-11/12 max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
              title="Close"
            >
              <i className="bx bx-x text-[30px]"></i>
            </button>

            <h2 className="mb-4 text-[14px] font-semibold text-gray-800">
              User Details
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Name:</strong> {selectedUser.firstName}{" "}
                {selectedUser.lastName}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Position:</strong> {selectedUser.role}
              </p>
              <p>
                <strong>Campus:</strong> {selectedUser.campus}
              </p>
              <p>
                <strong>Program:</strong> {selectedUser.program}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.status}
              </p>
              <p>
                <strong>Active:</strong> {selectedUser.isActive ? "Yes" : "No"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-6">
              {selectedUser.status === "pending" && !selectedUser.isActive && (
                <button
                  className="flex items-center text-orange-600 hover:text-orange-700"
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
                    className="flex items-center text-red-500 hover:text-red-700"
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
                    className="flex items-center text-orange-600 hover:text-orange-700"
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
        {filteredUsers
          .filter((user) => {
            return (
              (campusFilter ? user.campus === campusFilter : true) &&
              (roleFilter ? user.role === roleFilter : true) &&
              (positionFilter ? user.position === positionFilter : true) &&
              (programFilter ? user.program === programFilter : true) &&
              (stateFilter
                ? user.isActive === (stateFilter === "Active")
                : true) &&
              // Filter by status
              (statusFilter === "all" ? true : user.status === statusFilter) &&
              // Search filter by name, email, or user code
              (user.firstName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
                user.lastName
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.userCode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          })
          .map((user) => (
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
                  colSpan="10"
                  className="py-4 text-center text-[14px] text-gray-700"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers
                .filter((user) => {
                  return (
                    (campusFilter ? user.campus === campusFilter : true) &&
                    (roleFilter ? user.role === roleFilter : true) &&
                    (positionFilter ? user.role === positionFilter : true) &&
                    (programFilter ? user.program === programFilter : true) &&
                    (stateFilter
                      ? user.isActive === (stateFilter === "Active")
                      : true) &&
                    // Filter by status
                    (statusFilter === "all"
                      ? true
                      : user.status === statusFilter) &&
                    // Search filter by name, email, or user code
                    (user.firstName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      user.lastName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      user.email
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      user.userCode
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
                  );
                })
                .map((user) => (
                  <tr
                    key={user.userID}
                    className="border-b border-[rgb(200,200,200)] text-[12px] text-[rgb(78,78,78)] hover:bg-gray-200"
                  >
                    {/* Checkbox Column */}
                    <td className="hidden p-3 text-left sm:table-cell">
                      <input
                        className="mt-1 ml-3"
                        type="checkbox"
                        checked={selectedUsers.includes(user.userID)}
                        onChange={() => handleCheckboxChange(user.userID)}
                      />
                    </td>

                    <td className="p-3 text-left text-nowrap">
                      {user.userCode}
                    </td>

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
