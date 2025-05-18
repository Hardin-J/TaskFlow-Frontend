"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
}

interface Project {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  targetDate: string;
  createdBy: string;
  createdAt: string;
  status: string;
  members?: string[]; // Property for project members
}

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [progressStep, setProgressStep] = useState<number>(3);

  // Load user data and fetch users on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push("/login");
        return;
      }
      
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle("dark", savedDarkMode);
      
      // Fetch users from json server
      fetchUsers();
      
      // If projectId is provided, fetch project details
      if (projectId) {
        fetchProject(projectId);
      }
    }
  }, [router, projectId]);

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

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/projects/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Project not found");
          router.push("/dashboard");
          return;
        }
        throw new Error(`Error fetching project: ${response.status}`);
      }
      
      const data = await response.json();
      setProject(data);
      
      // If project has members, pre-select them
      if (data.members && Array.isArray(data.members)) {
        setSelectedUsers(data.members);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      toast.error("Failed to load project details");
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveMembers = async () => {
    if (!project) {
      toast.error("No project selected");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update project with selected members
      const updatedProject = {
        ...project,
        members: selectedUsers
      };
      
      const response = await fetch(`http://localhost:3001/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ members: selectedUsers })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating project: ${response.status}`);
      }
      
      toast.success("Project members updated successfully!");
      
      // Redirect to dashboard after successful update
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error updating project members:", err);
      toast.error("Failed to update project members");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        user={user}
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
          user={user}
        />
        
        {/* Progress steps */}
        <div className="px-6 pt-6">
          <div className={`mb-6 p-4 rounded-lg ${
            darkMode ? "bg-slate-800/80" : "bg-white/90"
          } shadow-md`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  progressStep >= 1 
                    ? "bg-blue-600 text-white" 
                    : darkMode 
                      ? "bg-slate-700 text-slate-400" 
                      : "bg-slate-200 text-slate-500"
                }`}>
                  1
                </div>
                <span className={progressStep >= 1 ? "font-medium" : "text-slate-500"}>
                  Project
                </span>
              </div>
              
              <div className={`flex-1 mx-4 h-1 ${
                progressStep >= 2 
                  ? "bg-blue-600" 
                  : darkMode 
                    ? "bg-slate-700" 
                    : "bg-slate-200"
              }`}></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  progressStep >= 2 
                    ? "bg-blue-600 text-white" 
                    : darkMode 
                      ? "bg-slate-700 text-slate-400" 
                      : "bg-slate-200 text-slate-500"
                }`}>
                  2
                </div>
                <span className={progressStep >= 2 ? "font-medium" : "text-slate-500"}>
                  Tasks
                </span>
              </div>
              
              <div className={`flex-1 mx-4 h-1 ${
                progressStep >= 3 
                  ? "bg-blue-600" 
                  : darkMode 
                    ? "bg-slate-700" 
                    : "bg-slate-200"
              }`}></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  progressStep >= 3 
                    ? "bg-blue-600 text-white" 
                    : darkMode 
                      ? "bg-slate-700 text-slate-400" 
                      : "bg-slate-200 text-slate-500"
                }`}>
                  3
                </div>
                <span className={progressStep >= 3 ? "font-medium" : "text-slate-500"}>
                  Members
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Members Management */}
        <div className="px-6 pb-6">
          <div className={`p-6 rounded-xl ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-white/80 border border-slate-200/50"
          } backdrop-blur-sm shadow-md`}>
            {project ? (
              <>
                <h2 className="text-xl font-bold mb-6">
                  Manage Team Members - {project.title}
                </h2>
                
                {/* Search and Counter */}
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className={`w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                        darkMode 
                          ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                          : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                      }`}
                    />
                    <svg 
                      className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-md ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    {selectedUsers.length} {selectedUsers.length === 1 ? 'member' : 'members'} selected
                  </div>
                </div>
                
                {/* Users List */}
                <div className={`rounded-md border ${darkMode ? 'border-slate-700' : 'border-slate-200'} mb-6`}>
                  <div className={`grid grid-cols-12 px-4 py-3 font-medium text-sm ${
                    darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <div className="col-span-1">Select</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Department</div>
                  </div>
                  
                  {isLoading ? (
                    <div className={`flex justify-center items-center p-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className={`text-center p-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      No users found matching your search criteria.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredUsers.map(member => (
                        <div 
                          key={member.id} 
                          className={`grid grid-cols-12 px-4 py-3 items-center transition-colors ${
                            darkMode 
                              ? 'hover:bg-slate-700/50' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="col-span-1">
                            <input 
                              type="checkbox" 
                              checked={selectedUsers.includes(member.id)}
                              onChange={() => handleUserToggle(member.id)}
                              className={`w-5 h-5 rounded ${
                                darkMode 
                                  ? 'bg-slate-700 border-slate-500 text-blue-500' 
                                  : 'bg-white border-slate-300 text-blue-600'
                              }`}
                            />
                          </div>
                          <div className="col-span-3 font-medium">{member.name}</div>
                          <div className="col-span-4 truncate">{member.email}</div>
                          <div className="col-span-2">
                            {member.role ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                member.role === 'admin' 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                  : member.role === 'teacher' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {member.role}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">No role</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            {member.department || (
                              <span className="text-slate-400 text-sm">No department</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                  <button 
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className={`px-4 py-2 rounded-md ${
                      darkMode 
                        ? "bg-slate-700 hover:bg-slate-600 text-white" 
                        : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveMembers}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Saving..." : "Save Members"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <svg 
                  className={`w-16 h-16 mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">No Project Selected</h3>
                <p className={`text-center mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Please select a project first or create a new one.
                </p>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}