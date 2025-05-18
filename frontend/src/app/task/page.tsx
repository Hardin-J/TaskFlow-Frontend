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

interface TaskForm {
  title: string;
  projectId: string;
  assignedTo: string;
  milestone: string;
  status: string;
  category: string;
  priority: string;
  targetDate: string;
  description: string;
}

export default function TaskPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressStep, setProgressStep] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);
  
  const [taskForm, setTaskForm] = useState<TaskForm>({
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
      
      // Fetch users and projects from json server
      fetchUsers();
      fetchProjects();
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

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
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
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a task");
      return;
    }
    
    const newTask = {
      id: `t-${Date.now()}`,
      ...taskForm,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating task: ${response.status}`);
      }
      
      toast.success("Task added successfully!");
      
      // Update progress
      setProgressStep(3);
      
      // Reset form
      setTaskForm({
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
      
      // Modified: Redirect to members page instead of dashboard
      setTimeout(() => {
        // Pass the project ID as a query parameter to the members page
        router.push(`/members?projectId=${newTask.projectId}`);
      }, 2000);
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/task-list");
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
        
        {/* Task Form */}
        <div className="px-6 pb-6">
          <div className={`p-6 rounded-xl ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-white/80 border border-slate-200/50"
          } backdrop-blur-sm shadow-md`}>
            <h2 className="text-xl font-bold mb-6">Add New Task</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="Enter task title"
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
                    disabled={isProjectsLoading}
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  {isProjectsLoading && (
                    <p className="text-sm mt-1 text-slate-400">Loading projects...</p>
                  )}
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
                    disabled={isLoading}
                  >
                    <option value="">Select a team member</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role || 'No role'})
                      </option>
                    ))}
                  </select>
                  {isLoading && (
                    <p className="text-sm mt-1 text-slate-400">Loading users...</p>
                  )}
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
              
              <div className="mt-6">
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
              
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button 
                  type="button"
                  onClick={handleCancel}
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
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}