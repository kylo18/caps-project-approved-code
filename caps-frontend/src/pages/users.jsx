import { useEffect, useState } from "react";
import CustomDropdown from "../components/customDropdown";
import SortCustomDropdown from "../components/sortCustomDropdown";
import ConfirmModal from "../components/confirmModal";
import UserList from "../components/userList";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortCategory, setSortCategory] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [sortStatus, setSortStatus] = useState("All");
    
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUserID, setSelectedUserID] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [error, setError] = useState('');

    // Function to open the modal
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

            setUsers(users.filter((user) => user.id !== userID));
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

            setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
            setSelectedUsers([]);
            alert("Selected users deleted!");
        } catch (error) {
            console.error("Error deleting users:", error);
            alert("Failed to delete selected users.");
        }
    };

    const getRoleName = (roleID) => {
        const roles = { 1: "Student", 2: "Faculty", 3: "Program Chair", 4: "Admin" };
        return roles[roleID] || "Unknown";
    };

    const getCampusName = (campusID) => {
        const campuses = { 1: "Dapitan", 2: "Dipolog", 3: "Tampilisan" };
        return campuses[campusID] || "Unknown";
    };

    const confirmStatusChange = () => {
        if (!selectedUserID) return;
    
        const dbStatus = selectedStatus === "registered" ? "registered" : "unregistered";
    
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUserID ? { ...user, status: dbStatus } : user
          )
        );
    
        fetch(`http://localhost:5000/users/${selectedUserID}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: dbStatus }),
        })
          .then((response) => response.json())
          .then(() => {
            setModalOpen(false);
            setSelectedUserID(null);
          })
          .catch((error) => console.error("Error updating status:", error));
      };
    
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.id.toString().includes(searchQuery) ||
            user.userCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
        const matchesSort =
            !sortCategory ||
            sortOption === "All" ||
            (sortCategory === "Campus" && getCampusName(user.campusID) === sortOption) ||
            (sortCategory === "Role" && getRoleName(user.roleID) === sortOption);
    
        const matchesStatus =
            !sortStatus || 
            sortStatus === "All" || 
            user.status === sortStatus; // Status filtering
    
        return matchesSearch && matchesSort && matchesStatus;
    });
    
    
    return (
        <div>
            <UserList/>
        </div>
    );
};

export default Users;
