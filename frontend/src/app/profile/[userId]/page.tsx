"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Define TypeScript interfaces for our data models
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  lastLogin?: string;
}

interface Task {
  id: string;
  title: string;
  milestone?: string;
  projectId: string;
  status: string;
  priority: string;
  targetDate?: string;
  assignedTo: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  workspaceId: string;
  targetDate?: string;
  members?: string[];
}

interface Workspace {
  id: string;
  title: string;
  description?: string;
  members: string[];
  createdAt?: string;
}

interface FormData {
  name: string;
  role: string;
  department: string;
}

interface UserProfileProps {
  params: {
    id?: string;
  };
}

// Define the possible status values for the save operation
type SaveStatus = "success" | "error" | null;

export default function UserProfile({ params }: UserProfileProps) {
  const router = useRouter();  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    role: "",
    department: "",
  });
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!params?.id) return;
        
        const response = await fetch(`http://localhost:3001/users/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const userData: User = await response.json();
        setUser(userData);
        setFormData({
          name: userData.name || "",
          role: userData.role || "",
          department: userData.department || "",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params?.id]);

  // Fetch user-related data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        // Fetch tasks assigned to user
        const tasksResponse = await fetch(`http://localhost:3001/tasks?assignedTo=${user.id}`);
        if (tasksResponse.ok) {
          const tasksData: Task[] = await tasksResponse.json();
          setTasks(tasksData);
        }

        // Fetch workspaces where user is a member
        const workspacesResponse = await fetch(`http://localhost:3001/workspaces`);
        if (workspacesResponse.ok) {
          const allWorkspaces: Workspace[] = await workspacesResponse.json();
          const userWorkspaces = allWorkspaces.filter(workspace => 
            workspace.members.includes(user.id)
          );
          setWorkspaces(userWorkspaces);
        }

        // Fetch projects
        const projectsResponse = await fetch(`http://localhost:3001/projects`);
        if (projectsResponse.ok) {
          const allProjects: Project[] = await projectsResponse.json();
          
          // Get workspace IDs where user is a member
          const userWorkspaceIds = workspaces.map(w => w.id);
          
          // Filter projects by workspace IDs or where user is a member
          const userProjects = allProjects.filter(project => 
            userWorkspaceIds.includes(project.workspaceId) || 
            (project.members && project.members.includes(user.id))
          );
          
          setProjects(userProjects);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [user, workspaces]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          department: formData.department,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      setEditMode(false);
      setSaveStatus("success");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
      console.error("Error updating profile:", err);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const getPriorityClass = (priority: string): string => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Not Started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "On Hold":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-4">{error || "User not found"}</p>
          <button 
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`flex items-center justify-between h-16 px-6 border-b ${
        darkMode ? "bg-slate-800/90 border-slate-700/50" : "bg-white/90 border-slate-200/50"
      } backdrop-blur-md shadow-sm sticky top-0 z-10`}>
        <div className="flex items-center">
          <button 
            onClick={() => router.push("/")}
            className={`p-1 mr-4 rounded-md ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">User Profile</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${
              darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
            } hover:scale-105 transition`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile header */}
        <div className={`p-6 mb-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
              {user.name?.charAt(0) || '?'}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-800"}`}>
                      {user.role || "No Role"}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800"}`}>
                      {user.department || "No Department"}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {editMode ? (
                    <>
                      <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button 
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: user.name || "",
                            role: user.role || "",
                            department: user.department || "",
                          });
                        }}
                        className={`px-4 py-2 rounded-lg ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              
              {saveStatus === "success" && (
                <div className="mt-4 p-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                  Profile updated successfully!
                </div>
              )}
              
              {saveStatus === "error" && (
                <div className="mt-4 p-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded">
                  Error updating profile. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "profile" 
                    ? `border-b-2 ${darkMode ? "text-blue-400 border-blue-400" : "text-blue-600 border-blue-600"}` 
                    : `${darkMode ? "hover:text-gray-300 hover:border-gray-300" : "hover:text-gray-600 hover:border-gray-600"}`
                }`}
              >
                Profile
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "tasks" 
                    ? `border-b-2 ${darkMode ? "text-blue-400 border-blue-400" : "text-blue-600 border-blue-600"}` 
                    : `${darkMode ? "hover:text-gray-300 hover:border-gray-300" : "hover:text-gray-600 hover:border-gray-600"}`
                }`}
              >
                Tasks
                <span className="ml-2 bg-blue-500 text-xs font-medium rounded-full w-5 h-5 inline-flex items-center justify-center text-white">
                  {tasks.length}
                </span>
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("projects")}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "projects" 
                    ? `border-b-2 ${darkMode ? "text-blue-400 border-blue-400" : "text-blue-600 border-blue-600"}` 
                    : `${darkMode ? "hover:text-gray-300 hover:border-gray-300" : "hover:text-gray-600 hover:border-gray-600"}`
                }`}
              >
                Projects
                <span className="ml-2 bg-blue-500 text-xs font-medium rounded-full w-5 h-5 inline-flex items-center justify-center text-white">
                  {projects.length}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("workspaces")}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "workspaces" 
                    ? `border-b-2 ${darkMode ? "text-blue-400 border-blue-400" : "text-blue-600 border-blue-600"}` 
                    : `${darkMode ? "hover:text-gray-300 hover:border-gray-300" : "hover:text-gray-600 hover:border-gray-600"}`
                }`}
              >
                Workspaces
                <span className="ml-2 bg-blue-500 text-xs font-medium rounded-full w-5 h-5 inline-flex items-center justify-center text-white">
                  {workspaces.length}
                </span>
              </button>
            </li>
          </ul>
        </div>
        
        {/* Tab content */}
        <div className="mb-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          darkMode 
                            ? "bg-slate-700 border-slate-600 text-white" 
                            : "bg-white border-gray-300 text-gray-900"
                        } border`}
                      />
                    ) : (
                      <p className="px-4 py-2">{user.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Email (Non-editable)
                    </label>
                    <p className={`px-4 py-2 rounded-lg ${
                      darkMode ? "bg-slate-700/50" : "bg-gray-100"
                    }`}>
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Role
                    </label>
                    {editMode ? (
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          darkMode 
                            ? "bg-slate-700 border-slate-600 text-white" 
                            : "bg-white border-gray-300 text-gray-900"
                        } border`}
                      >
                        <option value="">-- Select Role --</option>
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    ) : (
                      <p className="px-4 py-2">{user.role || "Not specified"}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Department
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          darkMode 
                            ? "bg-slate-700 border-slate-600 text-white" 
                            : "bg-white border-gray-300 text-gray-900"
                        } border`}
                      />
                    ) : (
                      <p className="px-4 py-2">{user.department || "Not specified"}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Last Login
                    </label>
                    <p className={`px-4 py-2 rounded-lg ${
                      darkMode ? "bg-slate-700/50" : "bg-gray-100"
                    }`}>
                      {formatDate(user.lastLogin)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Account Security</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Password
                    </label>
                    <div className="flex items-center">
                      <p className={`px-4 py-2 rounded-lg flex-1 ${
                        darkMode ? "bg-slate-700/50" : "bg-gray-100"
                      }`}>
                        ••••••••••
                      </p>
                      <button className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Two-Factor Authentication
                    </label>
                    <div className="flex items-center">
                      <p className={`px-4 py-2 rounded-lg flex-1 ${
                        darkMode ? "bg-slate-700/50" : "bg-gray-100"
                      }`}>
                        Not Enabled
                      </p>
                      <button className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
              
              {tasks.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <p>No tasks assigned to you yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={`${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-gray-200"}`}>
                      {tasks.map((task) => (
                        <tr 
                          key={task.id} 
                          className={`${darkMode ? "hover:bg-slate-700/50" : "hover:bg-gray-50"} transition-colors`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">{task.title}</div>
                            <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                              {task.milestone}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {projects.find(p => p.id === task.projectId)?.title || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs rounded-full ${getStatusClass(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs rounded-full ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {formatDate(task.targetDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <h2 className="text-xl font-semibold mb-4">Projects</h2>
              
              {projects.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <p>You are not assigned to any projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => {
                    const workspace = workspaces.find(w => w.id === project.workspaceId);
                    
                    return (
                      <div 
                        key={project.id} 
                        className={`p-4 rounded-lg border ${
                          darkMode ? "bg-slate-700/50 border-slate-600" : "bg-white border-gray-200"
                        } hover:shadow-md transition-shadow`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg truncate" title={project.title}>
                            {project.title}
                          </h3>
                          <span 
                            className={`px-2 py-1 text-xs rounded-full ${getStatusClass(project.status)}`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <p 
                          className={`text-sm mb-3 line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                          title={project.description}
                        >
                          {project.description}
                        </p>
                        <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Due: {formatDate(project.targetDate).split(',')[0]}</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                            <span>{workspace ? workspace.title : "No workspace"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Workspaces Tab */}
          {activeTab === "workspaces" && (
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              <h2 className="text-xl font-semibold mb-4">Workspaces</h2>
              
              {workspaces.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                  </svg>
                  <p>You are not a member of any workspaces yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspaces.map((workspace) => {
                    const workspaceProjects = projects.filter(
                      (project) => project.workspaceId === workspace.id
                    );
                    
                    return (
                      <div 
                        key={workspace.id} 
                        className={`p-4 rounded-lg border ${
                          darkMode ? "bg-slate-700/50 border-slate-600" : "bg-white border-gray-200"
                        } hover:shadow-md transition-shadow`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg truncate" title={workspace.title}>
                            {workspace.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"
                          }`}>
                            {workspace.members.length} members
                          </span>
                        </div>
                        <p 
                          className={`text-sm mb-3 line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                          title={workspace.description}
                        >
                          {workspace.description}
                        </p>
                        <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Created: {formatDate(workspace.createdAt).split(',')[0]}</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                            <span>{workspaceProjects.length} projects</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}