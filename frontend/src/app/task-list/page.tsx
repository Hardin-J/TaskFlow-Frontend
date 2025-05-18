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
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  milestone: string;
  status: string;
  category: string;
  priority: string;
  targetDate: string;
  createdBy: string;
  createdAt: string;
}

export default function TaskListPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("targetDate");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  
  // Task form for edit mode
  const [taskForm, setTaskForm] = useState<Omit<Task, "id" | "createdBy" | "createdAt">>({
    title: "",
    projectId: "",
    assignedTo: "",
    milestone: "",
    status: "Not Started",
    category: "Development",
    priority: "Medium",
    targetDate: "",
    description: ""
  });
  
  // Dropdown options
  const statusOptions = ["Not Started", "In Progress", "In Review", "Completed"];
  const categoryOptions = ["Development", "Design", "Research", "Testing", "Documentation"];
  const priorityOptions = ["Low", "Medium", "High", "Critical"];
  const milestoneOptions = ["Sprint 1", "Sprint 2", "MVP", "Beta Release", "Final Release"];

  // Load user data and fetch data on mount
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
      
      // Fetch users, projects, and tasks
      fetchUsers();
      fetchProjects();
      fetchTasks();
    }
  }, [router]);

  const fetchUsers = async () => {
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
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/projects');
      
      if (!response.ok) {
        throw new Error(`Error fetching projects: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to load projects");
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/tasks');
      
      if (!response.ok) {
        throw new Error(`Error fetching tasks: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  // Task CRUD Operations
  const createTask = () => {
    router.push("/task");
  };

  const navigateBackToDashboard = () => {
    router.push("/task-dashboard");
  };

  const viewTask = (task: Task) => {
    setCurrentTask(task);
    setShowViewModal(true);
  };

  const editTask = (task: Task) => {
    setCurrentTask(task);
    // Populate the form with the current task data
    setTaskForm({
      title: task.title,
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      milestone: task.milestone,
      status: task.status,
      category: task.category,
      priority: task.priority,
      targetDate: task.targetDate,
      description: task.description
    });
    setShowEditModal(true);
  };

  const confirmDelete = (task: Task) => {
    setCurrentTask(task);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentTask) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    
    const updatedTask = {
      ...currentTask,
      ...taskForm
    };
    
    try {
      const response = await fetch(`http://localhost:3001/tasks/${currentTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating task: ${response.status}`);
      }
      
      // Update local tasks list
      setTasks(tasks.map(task => task.id === currentTask.id ? updatedTask : task));
      
      toast.success("Task updated successfully!");
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async () => {
    if (!currentTask) return;
    
    try {
      const response = await fetch(`http://localhost:3001/tasks/${currentTask.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting task: ${response.status}`);
      }
      
      // Remove task from local state
      setTasks(tasks.filter(task => task.id !== currentTask.id));
      
      toast.success("Task deleted successfully!");
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task");
    }
  };

  // Filter and sort functions
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if sorting by the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field with default ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Apply filters and sorting to tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let compareA, compareB;
    
    // Define what to compare based on sort field
    switch (sortField) {
      case "title":
        compareA = a.title.toLowerCase();
        compareB = b.title.toLowerCase();
        break;
      case "status":
        compareA = a.status;
        compareB = b.status;
        break;
      case "priority":
        // Convert priority to numeric value for sorting
        const priorityValues = { "Low": 0, "Medium": 1, "High": 2, "Critical": 3 };
        compareA = priorityValues[a.priority as keyof typeof priorityValues] || 0;
        compareB = priorityValues[b.priority as keyof typeof priorityValues] || 0;
        break;
      case "targetDate":
        compareA = new Date(a.targetDate).getTime();
        compareB = new Date(b.targetDate).getTime();
        break;
      default:
        compareA = a.title.toLowerCase();
        compareB = b.title.toLowerCase();
    }
    
    // Apply sort direction
    if (sortDirection === "asc") {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Helper function to get project title by ID
  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "Unknown Project";
  };

  // Function to get appropriate status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return darkMode ? "bg-slate-600" : "bg-slate-200 text-slate-800";
      case "In Progress":
        return "bg-blue-500 text-white";
      case "In Review":
        return "bg-amber-500 text-white";
      case "Completed":
        return "bg-green-500 text-white";
      default:
        return darkMode ? "bg-slate-600" : "bg-slate-200 text-slate-800";
    }
  };

  // Function to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return darkMode ? "bg-slate-600" : "bg-slate-200 text-slate-800";
      case "Medium":
        return "bg-blue-500 text-white";
      case "High":
        return "bg-amber-500 text-white";
      case "Critical":
        return "bg-red-500 text-white";
      default:
        return darkMode ? "bg-slate-600" : "bg-slate-200 text-slate-800";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
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
        user={user}
      />
      
      {/* Main content area */}
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300 flex flex-col h-screen`}>
        {/* Topbar Component */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={user}
        />
        
        {/* Tasks List Page Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tasks</h1>
            <button 
              onClick={createTask}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Task</span>
            </button>
            <button 
              onClick={navigateBackToDashboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Back</span>
            </button>
          </div>
          
          {/* Filters and search */}
          <div className={`mb-6 p-4 rounded-lg ${
            darkMode ? "bg-slate-800/80" : "bg-white/90"
          } shadow-md`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block mb-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Search Tasks
                </label>
                <input 
                  type="text"
                  placeholder="Search by title or description"
                  value={searchTerm}
                  onChange={handleSearch}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                />
              </div>
              
              <div>
                <label className={`block mb-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSortField("targetDate");
                    setSortDirection("asc");
                  }}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  }`}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Tasks List */}
          <div className={`rounded-lg ${
            darkMode ? "bg-slate-800/50" : "bg-white/80"
          } shadow-md overflow-hidden`}>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-8 w-8 align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    Loading...
                  </span>
                </div>
                <p className="mt-2">Loading tasks...</p>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="p-8 text-center">
                <p>No tasks found. {searchTerm || statusFilter !== "all" ? "Try adjusting your filters." : ""}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? "bg-slate-700" : "bg-slate-50"}>
                    <tr>
                      <th className="px-4 py-3 text-left" onClick={() => handleSort("title")}>
                        <div className="flex items-center cursor-pointer">
                          <span>Title</span>
                          {sortField === "title" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Assigned To</th>
                      <th className="px-4 py-3 text-left" onClick={() => handleSort("status")}>
                        <div className="flex items-center cursor-pointer">
                          <span>Status</span>
                          {sortField === "status" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left" onClick={() => handleSort("priority")}>
                        <div className="flex items-center cursor-pointer">
                          <span>Priority</span>
                          {sortField === "priority" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left" onClick={() => handleSort("targetDate")}>
                        <div className="flex items-center cursor-pointer">
                          <span>Due Date</span>
                          {sortField === "targetDate" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTasks.map(task => (
                      <tr key={task.id} className={darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{task.title}</div>
                        </td>
                        <td className="px-4 py-3">{getProjectTitle(task.projectId)}</td>
                        <td className="px-4 py-3">{getUserName(task.assignedTo)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDate(task.targetDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => viewTask(task)}
                              className={`p-1 rounded-md ${
                                darkMode 
                                  ? "hover:bg-slate-600" 
                                  : "hover:bg-slate-200"
                              }`}
                              title="View"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => editTask(task)}
                              className={`p-1 rounded-md ${
                                darkMode 
                                  ? "hover:bg-slate-600" 
                                  : "hover:bg-slate-200"
                              }`}
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(task)}
                              className={`p-1 rounded-md ${
                                darkMode 
                                  ? "hover:bg-slate-600 text-red-400" 
                                  : "hover:bg-slate-200 text-red-500"
                              }`}
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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
      
      {/* View Task Modal */}
      {showViewModal && currentTask && (
        <div className="fixed inset-0 backdrop-blur-md bg-slate-900/30 flex items-center justify-center z-50">
          <div className={`relative w-full max-w-2xl p-6 rounded-lg shadow-lg ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">{currentTask.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Project</p>
                <p className="font-medium">{getProjectTitle(currentTask.projectId)}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Assigned To</p>
                <p className="font-medium">{getUserName(currentTask.assignedTo)}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Status</p>
                <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${getStatusColor(currentTask.status)}`}>
                  {currentTask.status}
                </span>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Priority</p>
                <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${getPriorityColor(currentTask.priority)}`}>
                  {currentTask.priority}
                </span>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Category</p>
                <p className="font-medium">{currentTask.category}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Milestone</p>
                <p className="font-medium">{currentTask.milestone || "None"}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Target Date</p>
                <p className="font-medium">{formatDate(currentTask.createdAt)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Description</p>
              <p className={`mt-2 whitespace-pre-wrap ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                {currentTask.description || "No description provided."}
              </p>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  editTask(currentTask);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Edit
              </button>
              <button
                onClick={() => setShowViewModal(false)}
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
      
      {/* Edit Task Modal */}
      {showEditModal && currentTask && (
        <div className="fixed inset-0 backdrop-blur-md bg-slate-900/30 flex items-center justify-center z-50">
          <div className={`relative w-full max-w-2xl p-6 rounded-lg shadow-lg ${
            darkMode ? "bg-slate-800" : "bg-white"
          } max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Edit Task</h2>
            
            <form onSubmit={handleUpdateTask}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    value={taskForm.title}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectId"
                    value={taskForm.projectId}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="assignedTo"
                    value={taskForm.assignedTo}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a team member</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role || 'No role'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Milestone
                  </label>
                  <select
                    name="milestone"
                    value={taskForm.milestone}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a milestone</option>
                    {milestoneOptions.map(milestone => (
                      <option key={milestone} value={milestone}>
                        {milestone}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={taskForm.status}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={taskForm.category}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="targetDate"
                    value={taskForm.targetDate}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Description
                </label>
                <textarea 
                  name="description"
                  value={taskForm.description}
                  onChange={handleFormChange}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter task description"
                ></textarea>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentTask && (
        <div className="fixed inset-0 backdrop-blur-md bg-slate-900/30 flex items-center justify-center z-50">
          <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <h2 className="text-xl font-bold mb-4">Delete Task</h2>
            <p className={darkMode ? "text-slate-300" : "text-slate-700"}>
              Are you sure you want to delete the task "{currentTask.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}