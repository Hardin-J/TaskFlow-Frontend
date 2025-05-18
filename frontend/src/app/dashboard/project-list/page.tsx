"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";
import { Trash2, Eye, PenSquare, Plus, Search, Filter, Clock, Check, AlertCircle, Pause, SkipBackIcon } from "lucide-react";

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

interface Workspace {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
}

export default function ProjectListPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  
  // Load user data and fetch workspaces and projects on mount
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
      
      // Fetch data
      fetchWorkspaces();
      fetchProjects();
    }
  }, [router]);

  const fetchWorkspaces = async () => {
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
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const getWorkspaceName = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    return workspace ? workspace.title : "Unknown Workspace";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateProject = () => {
    router.push("/project");
  };

  const handleBackToDashboard = () => {
    router.push("/project-dashboard");
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEditInit = (project: Project) => {
    setEditForm({...project});
    setShowEditModal(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3001/projects/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating project: ${response.status}`);
      }
      
      // Update the project in the local state
      setProjects(prev => prev.map(p => p.id === editForm.id ? editForm : p));
      
      toast.success("Project updated successfully!");
      setShowEditModal(false);
      
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInit = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3001/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });
      
      if (response.status !== 200) {
        throw new Error(`Error deleting project: ${response.status}`);
      }
      
      // Remove the project from the local state
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
      
      toast.success("Project deleted successfully!");
      setShowDeleteModal(false);
      
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Started':
        return <Clock className="text-gray-500" size={16} />;
      case 'In Progress':
        return <Pause className="text-blue-500" size={16} />;
      case 'Completed':
        return <Check className="text-green-500" size={16} />;
      case 'On Hold':
        return <AlertCircle className="text-amber-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  // Filter projects based on search term and status filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300 overflow-hidden`}>
        {/* Topbar Component */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={user}
        />
        
        {/* Page content */}
        <div className="px-6 py-6 h-[calc(100vh-64px)] overflow-y-auto">
          {/* Page header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Projects</h1>
            <button 
              onClick={handleCreateProject}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <Plus size={16} className="mr-2" />
              Create Project
            </button>
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <SkipBackIcon size={16} className="mr-2" />
              Back
            </button>
          </div>
          
          {/* Filters */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? "bg-slate-800/80" : "bg-white/90"} shadow-md`}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className={darkMode ? "text-slate-400" : "text-slate-500"} />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className={`w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                />
              </div>
              
              {/* Status filter */}
              <div className="md:w-64 flex items-center">
                <Filter size={16} className={`mr-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Projects list */}
          {isLoading ? (
            <div className={`flex justify-center items-center p-12 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-white/80"}`}>
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className={`text-center p-12 rounded-lg ${darkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-white/80 border border-slate-200/50"}`}>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className={darkMode ? "text-slate-400" : "text-slate-600"}>
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your filters or search terms"
                  : "Create your first project to get started"}
              </p>
            </div>
          ) : (
            <div className={`rounded-lg overflow-hidden ${darkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-white/80 border border-slate-200/50"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? "bg-slate-700" : "bg-slate-100"}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Workspace</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Target Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className={darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{project.title}</div>
                          <div className={`text-sm truncate max-w-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {project.description || "No description"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getWorkspaceName(project.workspaceId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(project.status)}
                            <span className="ml-2">{project.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(project.targetDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(project.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewProject(project)}
                              className={`p-1.5 rounded-md ${darkMode ? "hover:bg-slate-600" : "hover:bg-slate-200"}`}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleEditInit(project)}
                              className={`p-1.5 rounded-md ${darkMode ? "hover:bg-slate-600" : "hover:bg-slate-200"}`}
                              title="Edit Project"
                            >
                              <PenSquare size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteInit(project)}
                              className={`p-1.5 rounded-md ${darkMode ? "hover:bg-slate-600" : "hover:bg-slate-200"}`}
                              title="Delete Project"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* View Project Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`relative w-full max-w-2xl p-6 rounded-lg shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <button 
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold mb-4">{selectedProject.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Workspace</p>
                <p className="font-medium">{getWorkspaceName(selectedProject.workspaceId)}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Status</p>
                <div className="flex items-center">
                  {getStatusIcon(selectedProject.status)}
                  <span className="ml-2 font-medium">{selectedProject.status}</span>
                </div>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Target Date</p>
                <p className="font-medium">{formatDate(selectedProject.targetDate)}</p>
              </div>
              
              <div>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Created At</p>
                <p className="font-medium">{formatDate(selectedProject.createdAt)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Description</p>
              <p className={`p-3 rounded ${darkMode ? "bg-slate-700" : "bg-slate-50"}`}>
                {selectedProject.description || "No description provided."}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  handleEditInit(selectedProject);
                }}
                className={`px-4 py-2 rounded ${
                  darkMode 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
              >
                Edit
              </button>
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`relative w-full max-w-2xl p-6 rounded-lg shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    value={editForm.title}
                    onChange={handleEditFormChange}
                    required
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Workspace <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="workspaceId"
                    value={editForm.workspaceId}
                    onChange={handleEditFormChange}
                    required
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  >
                    {workspaces.map(workspace => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="targetDate"
                    value={editForm.targetDate}
                    onChange={handleEditFormChange}
                    required
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                        : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ${
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
              
              <div className="mt-4">
                <label className={`block mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Description
                </label>
                <textarea 
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter project description"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded ${
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
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? "bg-slate-800" : "bg-white"}`}>
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete the project "{selectedProject.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded ${
                  darkMode 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}