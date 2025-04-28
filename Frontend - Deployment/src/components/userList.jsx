import React, { useEffect, useState } from "react";
import SortCustomDropdown from "./sortCustomDropdown";
import ConfirmModal from "./confirmModal";
import LoadingOverlay from "./loadingOverlay";

const UserList = () => {
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

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

  const handleDeleteUser = async (userID) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://localhost:5000/users/${userID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user.");

      setUsers(users.filter((user) => user.userID !== userID));
      setSelectedUsers(selectedUsers.filter((id) => id !== userID));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.length === 0 || !window.confirm("Delete selected users?"))
      return;

    try {
      await Promise.all(
        selectedUsers.map((userID) =>
          fetch(`http://localhost:5000/users/${userID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ),
      );

      setUsers(users.filter((user) => !selectedUsers.includes(user.userID)));
      setSelectedUsers([]);
      alert("Selected users deleted!");
    } catch (error) {
      console.error("Error deleting users:", error);
      alert("Failed to delete selected users.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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

  return (
    <div className="font-inter mt-12 p-2">
      <div className="mb-4 flex flex-col items-center justify-between gap-4 text-[14px] sm:flex-row">
        <div className="relative flex w-full max-w-full items-center justify-start gap-2 sm:min-w-[180px]">
          <div>
            <button
              onClick={handleApproveSelectedUsers}
              disabled={selectedUsers.length === 0}
              className={`cursor-pointer rounded-md px-3 py-2 text-sm shadow-sm transition-colors duration-200 ${
                selectedUsers.length === 0
                  ? "cursor-not-allowed bg-gray-400 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-700"
              }`}
            >
              Approve
            </button>
          </div>
          <div>
            <button
              onClick={handleActivateSelectedUsers}
              disabled={selectedUsers.length === 0}
              className={`cursor-pointer rounded-md px-3 py-2 text-sm shadow-sm transition-colors duration-200 ${
                selectedUsers.length === 0
                  ? "cursor-not-allowed bg-gray-400 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-700"
              }`}
            >
              Activate
            </button>
          </div>
          <div>
            <button
              onClick={handleDeactivateSelectedUsers}
              disabled={selectedUsers.length === 0}
              className={`cursor-pointer rounded-md px-3 py-2 text-sm shadow-sm transition-colors duration-200 ${
                selectedUsers.length === 0
                  ? "cursor-not-allowed bg-gray-400 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-700"
              }`}
            >
              Deactivate
            </button>
          </div>
          <div>
            <button
              onClick={() => window.location.reload()}
              className="border-color flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2 text-sm shadow-sm hover:bg-gray-200"
            >
              <>
                <i className="bx bx-refresh text-[16px]"></i>
                Refresh
              </>
            </button>
          </div>
        </div>

        {/* Sorting Dropdowns */}
        <div className="relative z-50 flex w-full flex-col gap-2 overflow-visible text-gray-700 sm:flex-row md:w-auto">
          {/* Third Dropdown - Status Filter */}
          <SortCustomDropdown
            name="sortStatus"
            value={sortStatus}
            onChange={(e) => setSortStatus(e.target.value)}
            options={[
              { label: "All Status", value: "All" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "registered" },
            ]}
            placeholder="Filter by Status"
          />
          {/* First Dropdown - Sort Category */}
          <SortCustomDropdown
            name="sortCategory"
            value={sortCategory}
            onChange={(e) => {
              setSortCategory(e.target.value);
              setSortOption("All"); // Reset second dropdown when changing category
            }}
            options={[
              { label: "All", value: "" },
              { label: "Campus", value: "Campus" },
              { label: "Role", value: "Role" },
            ]}
            placeholder="Sort by..."
          />

          {/* Second Dropdown - Sort Option */}
          {sortCategory && (
            <SortCustomDropdown
              name="sortOption"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              options={[
                { label: `All ${sortCategory}`, value: "All" },
                ...(sortCategory === "Campus"
                  ? [
                      "Main Campus",
                      "Tampilisan Campus",
                      "Katipunan Campus",
                    ].map((campus) => ({
                      label: campus,
                      value: campus,
                    }))
                  : ["Student", "Instructor", "Program Chair", "Dean"].map(
                      (role) => ({
                        label: role,
                        value: role,
                      }),
                    )),
              ]}
              placeholder={`Select ${sortCategory}`}
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="border-color flex w-[50%] cursor-pointer items-center rounded-md border bg-white px-2 text-gray-700 shadow-sm sm:max-w-[300px]">
          <i className="bx bx-search text-[20px] text-gray-500"></i>
          <div className="flex flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full flex-1 rounded-md p-2 text-[14px] text-gray-700 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-t-sm border border-b-0 border-[rgb(200,200,200)] bg-white px-5 py-3 text-[12px] shadow-sm sm:text-[14px]">
        {pendingUsersCount > 0
          ? `${pendingUsersCount} User${pendingUsersCount !== 1 ? "s" : ""} Pending`
          : " All users approved"}
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full border border-t-0 border-[rgb(200,200,200)] bg-white shadow-md">
          <thead>
            <tr className="border-b border-[rgb(200,200,200)] bg-white text-[10px] text-[rgb(78,78,78)] sm:text-[14px]">
              <th className="hidden p-3 text-left sm:table-cell">
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
              <th className="p-3 text-left font-normal">User Code</th>
              <th className="p-3 text-left font-normal sm:hidden">Full Name</th>
              <th className="hidden p-3 text-left font-normal sm:table-cell">
                Name
              </th>
              <th className="p-3 text-left font-normal">Email</th>
              <th className="p-3 text-left font-normal">Role</th>
              <th className="p-3 text-left font-normal">Campus</th>
              <th className="p-3 text-center font-normal">Status</th>
              <th className="p-3 text-center font-normal">Program</th>
              <th className="p-3 text-center font-normal">Active Status</th>
              <th className="p-3 text-center font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-4 text-center">
                  No users found.
                </td>
              </tr>
            ) : (
              [...filteredUsers]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((user) => (
                  <tr
                    key={user.userID}
                    className="border-b border-[rgb(200,200,200)] text-[12px] text-[rgb(78,78,78)] hover:bg-gray-200"
                  >
                    {/* Checkbox Column (Hidden on Small Screens) */}
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
                    <td className="p-3 text-left text-nowrap">{`${user.firstName} ${user.lastName}`}</td>
                    <td className="p-3 text-left">{user.email}</td>
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

                    {/* Active/Inactive Status */}
                    <td className="p-3 text-center">
                      {user.isActive ? (
                        <span className="text-green-500">Active</span>
                      ) : (
                        <span className="text-red-500">Inactive</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        {/* Approve Button (for pending users only) */}
                        {user.status === "pending" &&
                          user.isActive === false && (
                            <button
                              className="main-text-colors hover:text-orange-700"
                              onClick={() => handleApproveUser(user.userID)}
                              title="Approve"
                            >
                              <i className="bx bxs-user-check cursor-pointer text-lg"></i>{" "}
                              {/* Approve Icon */}
                            </button>
                          )}
                        {/* Deactivate Active User */}
                        {user.status === "registered" &&
                          user.isActive === true && (
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeactivateUser(user.userID)}
                              title="Deactivate"
                            >
                              <i className="bx bx-log-out bx-flip-horizontal cursor-pointer text-lg"></i>{" "}
                              {/* Approve Icon */}
                            </button>
                          )}
                        {/* Activate Active User */}
                        {user.status === "registered" &&
                          user.isActive === false && (
                            <button
                              className="main-text-colors hover:text-orange-700"
                              onClick={() => handleActivateUser(user.userID)}
                              title="Activate"
                            >
                              <i className="bx bx-check-double cursor-pointer text-lg"></i>
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
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
    </div>
  );
};

export default UserList;
