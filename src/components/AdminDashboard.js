import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaTimes,
  FaSearch,
  FaUsers,
  FaUserTie,
  FaBuilding,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalBusinesses: 0,
    totalQueries: 0,
  });
  const [viewUser, setViewUser] = useState(null);
const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessOption: "",
    fatherName: "",
    dob: "",
    role: "user",
    post: "",
    pinCode: "",
    policeStation: "",
    district: "",
    state: "",
    phoneNo: "",
    aadharNo: "",
    panNo: "",
    villageTown: "",
  });
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  useEffect(() => {
    if (!loading && (!isAdmin || !user)) {
      navigate("/login");
    }
  }, [isAdmin, user, loading, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication token not found");
        return;
      }
  
      const response = await axios.get("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.data && Array.isArray(response.data)) {
        const usersWithSerialNumbers = response.data.map((user, index) => ({
          ...user,
          originalSerialNumber: `jry${String(index + 1).padStart(3, '0')}`, // Store the original serial number
        }));
        setUsers(usersWithSerialNumbers);
  
        // Calculate statistics
        const totalUsers = response.data.length;
        const totalAdmins = response.data.filter((user) => user.role === "admin").length;
        const totalBusinesses = response.data.filter((user) => user.businessOption).length;
        const allQueryIds = response.data.flatMap((user) => Array.isArray(user.queries) ? user.queries : []);
        const uniqueQueryIds = [...new Set(allQueryIds)];
        const totalQueries = uniqueQueryIds.length;
  
        setStats({
          totalUsers,
          totalAdmins,
          totalBusinesses,
          totalQueries,
        });
      } else {
        setError("Invalid response format from server");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Unauthorized access. Please login again.");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Failed to fetch users. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const user = typeof rawUser === "string" ? JSON.parse(rawUser) : null;

      if (!user || user.role !== "admin") {
        navigate("/login");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("Error parsing user from localStorage", err);
      setError("Invalid user data. Please log in again.");
      navigate("/login");
    }
  }, [navigate, fetchUsers]);

  // Filter users based on search query
  const filteredUsers = users.filter((user, index) => {
    const serialNumber = `jry${String(index + 1).padStart(3, '0')}`;  // Generate Serial Number
    return (
      serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||  // Search by serial number
      (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.businessName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/admin/users",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        businessOption: "",
        fatherName: "",
        dob: "",
        role: "user",
        post: "",
        pinCode: "",
        policeStation: "",
        district: "",
        state: "",
        phoneNo: "",
        aadharNo: "",
        panNo: "",
        villageTown: "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        editingUser,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(
        users.map((user) =>
          user._id === editingUser._id ? response.data : user
        )
      );
      setEditingUser(null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user._id !== userId));
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Unauthorized access. Please login again.");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({ ...editingUser, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
  
    const aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
    const bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
  
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your network members
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          <FaPlus className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <FaUsers className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Users
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <FaUserTie className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Admins
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalAdmins}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <FaBuilding className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Businesses
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalBusinesses}
              </p>
            </div>
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer"
          onClick={() => navigate("/admin/messages")}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500">
              <FaBuilding className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalQueries}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No users found.{" "}
            {searchQuery
              ? "Try a different search term."
              : "Add some users to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      S.No
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('name')}
    >
      User {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('email')}
    >
      Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('role')}
    >
      Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('businessOption')}
    >
      Business Type {sortConfig.key === 'businessOption' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Actions
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('Connections')}
    >
      Connections {sortConfig.key === 'Connections' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort('TotalConnections')}
    >
      Total Connections {sortConfig.key === 'TotalConnections' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </th>
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
     
    >
      Profile 
    </th>
  </tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
  {sortedUsers.map((user) => {
    return (
      <tr key={user._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.originalSerialNumber} {/* Display Original Serial Number */}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <img className="h-10 w-10 rounded-full object-cover" src={user.image || "/default-avatar.png"} alt={user.name} />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.businessName || "No Business"}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}>
            {user.role || "user"}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {user.businessOption || "Not Specified"}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-3">
            <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-900" title="Edit User">
              <FaEdit />
            </button>
            <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-900" title="Delete User">
              <FaTrash />
            </button>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.connections?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.connections.map((connId) => {
                const connUser = users.find((u) => u._id === connId);
                return connUser ? (
                  <span key={connId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {connUser.name}
                  </span>
                ) : (
                  <span key={connId} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    Unknown
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-gray-400 italic">No connections</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.connections?.length > 0 ? (
            <div className="flex flex-wrap gap-2">{user.connections.length}</div>
          ) : (
            <span className="text-gray-400 italic">No connections</span>
          )}
        </td>
        <button
  onClick={() => {
    setViewUser(user);
    setShowViewModal(true);
  }}
  className="text-indigo-600 hover:text-indigo-900"
>
  View
</button>

      </tr>
    );
  })}
</tbody>


            </table>
          </div>
        )}
      </div>

      {showViewModal && viewUser && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
      <button
        onClick={() => setShowViewModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        <FaTimes />
      </button>
      <h2 className="text-xl font-semibold mb-4">User Details</h2>
      <div className="space-y-2 text-sm">
        <p><strong>Name:</strong> {viewUser.name}</p>
        <p><strong>Email:</strong> {viewUser.email}</p>
        <p><strong>Phone No:</strong> {viewUser.phoneNo}</p>
        <p><strong>Role:</strong> {viewUser.role}</p>
        <p><strong>Father's Name:</strong> {viewUser.fatherName}</p>
        <p><strong>DOB:</strong> {viewUser.dob}</p>
        <p><strong>Business Name:</strong> {viewUser.businessName}</p>
        <p><strong>Business Type:</strong> {viewUser.businessOption}</p>
        <p><strong>Post:</strong> {viewUser.post}</p>
        <p><strong>Village/Town:</strong> {viewUser.villageTown}</p>
        <p><strong>Police Station:</strong> {viewUser.policeStation}</p>
        <p><strong>District:</strong> {viewUser.district}</p>
        <p><strong>State:</strong> {viewUser.state}</p>
        <p><strong>Pin Code:</strong> {viewUser.pinCode}</p>
        <p><strong>Aadhar No:</strong> {viewUser.aadharNo}</p>
        <p><strong>PAN No:</strong> {viewUser.panNo}</p>
        <p><strong>Total Connections:</strong> {viewUser.connections.length || 0}</p>
        <p><strong>Connections:</strong> {(viewUser.connections || [])}</p>
      </div>
    </div>
  </div>
)}


      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <select
                  name="businessOption"
                  value={formData.businessOption}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Post
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post} // or editingUser.post
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pin Code
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode} // or editingUser.pinCode
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Police Station
                </label>
                <input
                  type="text"
                  name="policeStation"
                  value={formData.policeStation} // or editingUser.policeStation
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district} // or editingUser.district
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state} // or editingUser.state
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Village/Town
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village} // or editingUser.village
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editingUser.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editingUser.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={editingUser.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <select
                  name="businessOption"
                  value={editingUser.businessOption}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={editingUser.businessName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={editingUser.fatherName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={editingUser.dob}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={editingUser.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={editingUser.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={editingUser.panNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={editingUser.aadharNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Post
                </label>
                <input
                  type="text"
                  name="post"
                  value={editingUser.post} // or editingUser.post
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pin Code
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={editingUser.pinCode} // or editingUser.pinCode
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Police Station
                </label>
                <input
                  type="text"
                  name="policeStation"
                  value={editingUser.policeStation} // or editingUser.policeStation
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={editingUser.district} // or editingUser.district
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={editingUser.state} // or editingUser.state
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Village/Town
                </label>
                <input
                  type="text"
                  name="village"
                  value={editingUser.village} // or editingUser.village
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
