"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin?: string;
  password?: string;
}

enum ModalType {
  None,
  View,
  Edit,
  Delete,
  Create
}

export default function UsersPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalType, setModalType] = useState<ModalType>(ModalType.None);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newUser, setNewUser] = useState<User>({
    id: "",
    name: "",
    email: "",
    role: "user",
    department: "",
    password: ""
  });

  // Load user data and fetch users on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      } else {
        router.push("/login");
        return;
      }
      
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle("dark", savedDarkMode);
      
      // Fetch users from json server
      fetchUsers();
    }
  }, [router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/users');
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simple validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error("Please fill all required fields");
        return;
      }
      
      // Generate a simple ID (in production, server would handle this)
      const userData = {
        ...newUser,
        id: `u-${Date.now()}`,
        lastLogin: null
      };
      
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating user: ${response.status}`);
      }
      
      await fetchUsers();
      toast.success("User created successfully!");
      setModalType(ModalType.None);
      setNewUser({
        id: "",
        name: "",
        email: "",
        role: "user",
        department: "",
        password: ""
      });
      
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    setIsLoading(true);
    
    try {
      // Remove password if it's empty (don't update password)
      const userData = { ...selectedUser };
      if (!userData.password) {
        delete userData.password;
      }
      
      const response = await fetch(`http://localhost:3001/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating user: ${response.status}`);
      }
      
      await fetchUsers();
      toast.success("User updated successfully!");
      setModalType(ModalType.None);
      
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3001/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting user: ${response.status}`);
      }
      
      await fetchUsers();
      toast.success("User deleted successfully!");
      setModalType(ModalType.None);
      
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const openModal = (type: ModalType, user?: User) => {
    setModalType(type);
    if (user) {
      setSelectedUser({...user, password: ""});
    } else {
      setSelectedUser(null);
    }
  };

  const closeModal = () => {
    setModalType(ModalType.None);
    setSelectedUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (modalType === ModalType.Create) {
      setNewUser(prev => ({ ...prev, [name]: value }));
    } else if (modalType === ModalType.Edit && selectedUser) {
      setSelectedUser(prev => 
        prev ? { ...prev, [name]: value } : null
      );
    }
  };

  return (
    <div className={`flex h-screen transition-all duration-500 ${
      darkMode
        ? "bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900 text-white"
        : "bg-gradient-to-br from-sky-50 via-white to-blue-50 text-gray-900"
    }`}>
      {/* Sidebar Component */}
      <Sidebar 
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={currentUser}
      />
      
      {/* Main content area */}
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        {/* Topbar Component */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={currentUser}
        />
        
        {/* Page Header */}
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Users Management</h1>
            <button
              onClick={() => openModal(ModalType.Create)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New User
            </button>
          </div>
          
          {/* Search and Filters */}
          <div className={`p-4 mb-6 rounded-lg ${
            darkMode ? "bg-slate-800/80" : "bg-white/90"
          } shadow-md`}>
            <div className="flex items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                />
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <div className={`rounded-xl overflow-hidden shadow-md ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-white/80 border border-slate-200/50"
          } backdrop-blur-sm`}>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No users found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-200"}`}>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:${darkMode ? "bg-slate-700/50" : "bg-slate-50/70"}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openModal(ModalType.View, user)}
                            className={`text-blue-600 hover:text-blue-900 mx-1 ${darkMode ? "hover:text-blue-400" : ""}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openModal(ModalType.Edit, user)}
                            className={`text-yellow-600 hover:text-yellow-900 mx-1 ${darkMode ? "hover:text-yellow-400" : ""}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openModal(ModalType.Delete, user)}
                            className={`text-red-600 hover:text-red-900 mx-1 ${darkMode ? "hover:text-red-400" : ""}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View User Modal */}
      {modalType === ModalType.View && selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/30">
    <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
      darkMode ? "bg-slate-800" : "bg-white"
    }`}>
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 className="text-xl font-bold mb-4">User Details</h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Name
          </label>
          <p className="mt-1 text-lg">{selectedUser.name}</p>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Email
          </label>
          <p className="mt-1 text-lg">{selectedUser.email}</p>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Role
          </label>
          <p className="mt-1 text-lg">{selectedUser.role}</p>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Department
          </label>
          <p className="mt-1 text-lg">{selectedUser.department}</p>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Last Login
          </label>
          <p className="mt-1 text-lg">{formatDate(selectedUser.lastLogin)}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={closeModal}
          className={`px-4 py-2 rounded-md ${
            darkMode 
              ? "bg-slate-700 hover:bg-slate-600 text-white" 
              : "bg-slate-200 hover:bg-slate-300 text-slate-800"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* Edit User Modal */}
      {modalType === ModalType.Edit && selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/30">
    <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
      darkMode ? "bg-slate-800" : "bg-white"
    }`}>
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 className="text-xl font-bold mb-4">Edit User</h3>
      <form onSubmit={handleUpdateUser}>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={selectedUser.name}
              onChange={handleInputChange}
              required
              className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                darkMode 
                  ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                  : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={selectedUser.email}
              onChange={handleInputChange}
              required
              className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                darkMode 
                  ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                  : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Role
            </label>
            <select
              name="role"
              value={selectedUser.role}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                darkMode 
                  ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                  : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
              }`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Department
            </label>
            <input
              type="text"
              name="department"
              value={selectedUser.department}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                darkMode 
                  ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                  : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Password (leave blank to keep current)
            </label>
            <input
              type="password"
              name="password"
              value={selectedUser.password || ""}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                darkMode 
                  ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                  : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
              }`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className={`px-4 py-2 rounded-md ${
              darkMode 
                ? "bg-slate-700 hover:bg-slate-600 text-white" 
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update User"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{modalType === ModalType.Create && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/30">
          <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password || ""}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={newUser.department}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  }`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete User Modal */}
      {modalType === ModalType.Delete && selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/30">
    <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
      darkMode ? "bg-slate-800" : "bg-white"
    }`}>
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <h3 className="text-xl font-bold mt-4 mb-2">Delete User</h3>
        <p className={`${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          Are you sure you want to delete user <strong>{selectedUser.name}</strong>? This action cannot be undone.
        </p>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <button
          type="button"
          onClick={closeModal}
          className={`px-4 py-2 rounded-md ${
            darkMode 
              ? "bg-slate-700 hover:bg-slate-600 text-white" 
              : "bg-slate-200 hover:bg-slate-300 text-slate-800"
          }`}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteUser}
          className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Delete User"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}