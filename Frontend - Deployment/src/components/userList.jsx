import React, { useEffect, useState } from 'react';
import SortCustomDropdown from './sortCustomDropdown';
import ConfirmModal from "../components/confirmModal";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [sortStatus, setSortStatus] = useState("All");

  const [selectedUserID, setSelectedUserID] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const handleChangeUserStatus = (userID, newStatus) => {
    setSelectedUserID(userID);
    setSelectedStatus(newStatus);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found, please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/users`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.status === 401) {
          setError("Session expired, please log in again.");
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCheckboxChange = (userID) => {
    setSelectedUsers((prevSelected) =>
        prevSelected.includes(userID)
            ? prevSelected.filter((id) => id !== userID)
            : [...prevSelected, userID]
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
        user.userID.toString().includes(searchQuery) ||
        user.userCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSort =
        !sortCategory ||
        sortOption === "All" ||
        (sortCategory === "Campus" && user.campus === sortOption) ||
        (sortCategory === "Role" && user.role === sortOption);

    const matchesStatus =
        !sortStatus || 
        sortStatus === "All" || 
        user.status === sortStatus;

    return matchesSearch && matchesSort && matchesStatus;
  });

  const handleApproveUser = async (userID) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${apiUrl}/users/${userID}/approve`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to approve user");
        }

        setUsers(users.map(user =>
            user.userID === userID ? { ...user, status: "registered" } : user
        ));
        setUsers(users.map(user =>
          user.userID === userID ? { ...user, isActve: true } : user
      ));
        
        alert("User approved successfully!"); 
    } catch (error) {
      console.error("Error approving user:", error);
      alert(error.message);
    }
  };

  const handleActivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${apiUrl}/users/${userID}/activate`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to activate user");
        }

        setUsers(users.map(user =>
            user.userID === userID ? { ...user, isActive: true } : user
        ));

        alert("User activated successfully!");
    } catch (error) {
        console.error("Error activating user:", error);
        alert(error.message);
    }
  };
  

  const handleDeactivateUser = async (userID) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${apiUrl}/users/${userID}/deactivate`, { // ✅ Fixed URL
            method: "PATCH", // ✅ Use PUT as per backend
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to deactivate user");
        }

        // Update UI after deactivation
        setUsers((prevUsers) => 
            prevUsers.map(user =>
                user.userID === userID ? { ...user, isActive: false } : user
            )
        );

        alert("User deactivated successfully");
    } catch (error) {
        console.error("Error deactivating user:", error);
        alert(error.message);
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
      if (selectedUsers.length === 0 || !window.confirm("Delete selected users?")) return;

      try {
          await Promise.all(
              selectedUsers.map((userID) =>
                  fetch(`http://localhost:5000/users/${userID}`, {
                      method: "DELETE",
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                      },
                  })
              )
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

  return (
    <div className="font-inter p-2 h-screen mt-12">
      <div className="text-[14px] mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 ">
        {/* Delete Selected Button */}
        <div className="relative w-full max-w-full sm:min-w-[180px]">
          <button
            onClick={handleDeleteSelectedUsers}
            className="shadow-sm rounded-md cursor-pointer w-full flex items-center px-3 py-2 border border-color relative
            bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400  md:w-auto "
            disabled={selectedUsers.length === 0}
          >
            Delete Selected ({selectedUsers.length})
          </button>
        </div>
      

        {/* Sorting Dropdowns */}
        <div className="relative z-50 flex flex-col sm:flex-row gap-4 w-full md:w-auto overflow-visible">
          {/* Third Dropdown - Status Filter */}
          <SortCustomDropdown
              name="sortStatus"
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
              options={[
                  { label: "All Status", value: "All" },
                  { label: "Pending", value: "pending" },
                  { label: "Approved", value: "registered" }, // Matches database
                  { label: "Rejected", value: "unregistered" } // Matches database
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
                        ? ["Main Campus", "Tampilisan Campus", "Katipunan Campud"].map((campus) => ({
                            label: campus,
                            value: campus,
                        }))
                        : ["Student", "Instructor", "Program Chair", "Dean"].map((role) => ({
                            label: role,
                            value: role,
                        })) ),
                ]}
                placeholder={`Select ${sortCategory}`}
            />
          )}
        </div>
      
        {/* Search Bar */}
        <div className="flex items-center border border-color shadow-sm bg-white px-2 rounded-md text-gray-700 cursor-pointer w-full sm:max-w-[300px]">
            <i className="bx bx-search text-[20px] text-gray-500"></i>
            <div className="flex flex-1">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="outline-none text-gray-700 flex-1 p-2 rounded-md text-[14px] w-full"
                />
            </div>
        </div>
      </div>

      <div className="shadow-sm bg-white py-3 text-[12px] sm:text-[14px] px-5 rounded-t-sm border border-b-0 border-[rgb(200,200,200)]">
          4 Users Pending
      </div>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full bg-white border border-[rgb(200,200,200)] border-t-0 shadow-md">
          <thead>
            <tr className="bg-white border-b border-[rgb(200,200,200)] text-[rgb(78,78,78)] text-[10px] sm:text-[14px]">
              <th className="p-3 text-left hidden sm:table-cell">
                  <input
                  className="ml-3"
                  type="checkbox"
                  onChange={(e) =>
                      setSelectedUsers(e.target.checked ? users.map((user) => user.userID) : [])
                  }
                  />
              </th>
              <th className="p-3 text-left font-normal">User Code</th>
              <th className="p-3 text-left font-normal sm:hidden">Full Name</th>
              <th className="p-3 text-left font-normal hidden sm:table-cell">First Name</th>
              <th className="p-3 text-left font-normal hidden sm:table-cell ">Last Name</th>
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
                <td colSpan="8" className="text-center py-4 ">No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.userID}
                  className="border-b border-[rgb(200,200,200)] text-[rgb(78,78,78)] text-[12px] hover:bg-gray-200"
                >
                  {/* Checkbox Column (Hidden on Small Screens) */}
                  <td className="p-3 hidden sm:table-cell text-left">
                    <input
                      className="ml-3 mt-1"
                      type="checkbox"
                      checked={selectedUsers.includes(user.userID)}
                      onChange={() => handleCheckboxChange(user.userID)}
                    />
                  </td>
                  <td className="p-3 text-left text-nowrap">{user.userCode}</td>
                  <td className="p-3 text-left sm:hidden text-nowrap">{`${user.firstName} ${user.lastName}`}</td>
                  <td className="p-3 text-left hidden sm:table-cell text-nowrap">{user.firstName}</td>
                  <td className="p-3 text-left hidden sm:table-cell text-nowrap">{user.lastName}</td>
                  <td className="p-3 text-left">{user.email}</td>
                  <td className="p-3 text-left text-nowrap">{user.role}</td>
                  <td className="p-3 text-left">{user.campus}</td>
                  <td className="p-3 text-center font-semibold">
                    <span
                      className={`px-2 py-1 rounded-md text-[12px] 
                        ${user.status === "registered" ? " text-green-600" : 
                        user.status === "unregistered" ? " text-red-600" : 
                        " text-yellow-600"}`}
                    >
                      {user.status === "registered" ? "Approved" :
                      user.status === "unregistered" ? "Rejected" : "Pending"}
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
                    <div className="flex gap-2 justify-center">
                      
                      {/* Approve Button (for pending users only) */}
                      {user.status === "pending" && user.isActive === false && (
                        <button
                          className="main-text-colors hover:text-orange-700"
                          onClick={() => handleApproveUser(user.userID)}
                        >
                          <i className="cursor-pointer bx bxs-user-check text-lg"></i> {/* Approve Icon */}
                        </button>
                      )}
                      {/* Deactivate Active User */}
                      {user.status === "registered" && user.isActive === true && (
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeactivateUser(user.userID)}
                        >
                          <i className="cursor-pointer bx bx-log-out bx-flip-horizontal text-lg"></i> {/* Approve Icon */}
                        </button>
                      )}
                      {/* Activate Active User */}
                      {user.status === "registered" && user.isActive === false && (
                        <button
                          className="main-text-colors hover:text-orange-700"
                          onClick={() => handleActivateUser(user.userID)}
                        >
                          <i className="cursor-pointer bx bx-check-double text-lg"></i> {/* Approve Icon */}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
    
  );
};

export default UserList;