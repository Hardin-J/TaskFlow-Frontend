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

interface ProjectForm {
  title: string;
  workspaceId: string;
  targetDate: string;
  description: string;
  status: string;
}

interface Workspace {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
}

export default function ProjectPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    title: "",
    workspaceId: "",
    targetDate: "",
    description: "",
    status: "Not Started"
  });
  const [progressStep, setProgressStep] = useState<number>(1);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Load user data and fetch workspaces on mount
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
      
      // Fetch workspaces from json server
      fetchWorkspaces();
    }
  }, [router]);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/workspaces');
      
      if (!response.ok) {
        throw new Error(`Error fetching workspaces: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkspaces(data);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    
    // Prepare project data for API
    const projectData = {
      ...projectForm,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      id: `p-${Date.now()}` // Generate a simple ID (in production, server would handle this)
    };
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating project: ${response.status}`);
      }
      
      const createdProject = await response.json();
      setCreatedProjectId(createdProject.id);
      
      toast.success("Project created successfully!");
      
      // Store project ID in local storage to use in task creation
      localStorage.setItem("currentProject", JSON.stringify(createdProject));
      
      // Update progress
      setProgressStep(2);
      
      // Redirect to task page after short delay
      setTimeout(() => {
        router.push("/task");
      }, 1000);
      
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/project-list");
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
        
        {/* Project Form */}
        <div className="px-6 pb-6">
          <div className={`p-6 rounded-xl ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-white/80 border border-slate-200/50"
          } backdrop-blur-sm shadow-md`}>
            <h2 className="text-xl font-bold mb-6">Create New Project</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    value={projectForm.title}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                    placeholder="Enter project title"
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Workspace <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="workspaceId"
                    value={projectForm.workspaceId}
                    onChange={handleFormChange}
                    required
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select a workspace</option>
                    {workspaces.map(workspace => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.title}
                      </option>
                    ))}
                  </select>
                  {isLoading && (
                    <p className="text-sm mt-1 text-slate-400">Loading workspaces...</p>
                  )}
                </div>
                
                <div>
                  <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="targetDate"
                    value={projectForm.targetDate}
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
                    Status
                  </label>
                  <select
                    name="status"
                    value={projectForm.status}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <label className={`block mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Description
                </label>
                <textarea 
                  name="description"
                  value={projectForm.description}
                  onChange={handleFormChange}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter project description"
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
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}