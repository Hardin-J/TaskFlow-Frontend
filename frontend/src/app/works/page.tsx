"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import toast from "react-hot-toast";
import { addNewWorkspaces, editWorkspaces, getAllWorkspaces, deleteWorkspace, getWorkspaceById } from "@/services/Workspace.service";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin?: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  owner: any;
  createdAt: string;
  members: any[];
}

export default function WorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  
  // Form states
  const [workspaceTitle, setWorkspaceTitle] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    // Parse user data
    const userData = JSON.parse(storedUser);
    setUser(userData);

    // Set dark mode based on localStorage or system preference
    const darkModePreference = localStorage.getItem("darkMode");
    if (darkModePreference !== null) {
      setDarkMode(darkModePreference === "true");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    // Fetch workspaces
    fetchWorkspaces();
  }, [router]);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const response = await getAllWorkspaces();         
      setWorkspaces(response.data);
      if (response.status !== 200) {
        throw new Error("Failed to fetch workspaces");
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setWorkspaceTitle("");
    setWorkspaceDescription("");
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setWorkspaceTitle(workspace.name);
    setWorkspaceDescription(workspace.description);
    setShowEditModal(true);
  };

  const handleOpenViewModal = async (workspaceId: string) => {
    try {
      setIsProcessing(true);
      const response = await getWorkspaceById(workspaceId);
      if (response.status === 200) {
        setCurrentWorkspace(response.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to fetch workspace details");
      }
    } catch (error) {
      console.error("Error fetching workspace details:", error);
      toast.error("Failed to fetch workspace details");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenDeleteModal = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setShowDeleteModal(true);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceTitle.trim()) {
      toast.error("Workspace title is required");
      return;
    }

    if (!user) {
      toast.error("You need to be logged in to create a workspace");
      return;
    }

    setIsProcessing(true);

    try {            
      // Create workspace object
      const newWorkspace = {        
        name: workspaceTitle,
        description: workspaceDescription,        
      };

      // Send POST request
      const response = await addNewWorkspaces(newWorkspace);
      
      console.log(response);

      if (response.status !== 201) {
        toast.error('Failed to create workspace');
        throw new Error('Failed to create workspace');
      }      
      if (response.status === 201) {
        // Show success notification
        toast.success("Workspace created successfully!");                
      }      
      
      
      // Reset form and close modal
      setWorkspaceTitle("");
      setWorkspaceDescription("");
      setShowCreateModal(false);
      
      // Refresh workspace list
      fetchWorkspaces();
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceTitle.trim() || !currentWorkspace) {
      toast.error("Workspace title is required");
      return;
    }

    if (!user) {
      toast.error("You need to be logged in to edit a workspace");
      return;
    }

    setIsProcessing(true);

    try {
      // Update workspace object
      const updatedWorkspace = {
        name: workspaceTitle,
        description: workspaceDescription,
      };

      // Send Edit
      const response = await editWorkspaces(currentWorkspace.id, updatedWorkspace);        

      console.log(response);
      
      if(response.status === 200){
        // Show success notification
        console.log("success");
        toast.success("Workspace updated successfully!");
      }      
      
      // Reset form and close modal
      setWorkspaceTitle("");
      setWorkspaceDescription("");
      setShowEditModal(false);
      setCurrentWorkspace(null);
      
      // Refresh workspace list
      fetchWorkspaces();
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Failed to update workspace. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace || !user) {
      toast.error("Unable to delete workspace");
      return;
    }

    setIsProcessing(true);

    try {
      // Send DELETE request using the service
      const response = await deleteWorkspace(currentWorkspace.id);

      if (response.status === 200) {
        // Show success notification
        toast.success("Workspace deleted successfully!");
        
        // Close modal
        setShowDeleteModal(false);
        setCurrentWorkspace(null);
        
        // Refresh workspace list
        fetchWorkspaces();
      } else {
        throw new Error('Failed to delete workspace');
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
        
        {/* Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Workspaces</h1>
                <p className={`mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  View and manage your workspaces
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </button>
            </div>

            {/* Workspace Cards */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {workspaces.length === 0 ? (
                  <div className={`text-center py-16 ${darkMode ? "bg-slate-800/50" : "bg-white"} rounded-2xl shadow-xl border ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No workspaces found</h3>
                    <p className={`mb-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Get started by creating your first workspace to organize your projects.
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Your First Workspace
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                      <div 
                        key={workspace.id} 
                        className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                          darkMode 
                            ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700" 
                            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                                darkMode 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                                  : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                              }`}>
                                {getInitials(workspace.name)}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold line-clamp-1">{workspace.name}</h3>
                                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                  {formatDate(workspace.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions Dropdown */}
                            <div className="relative group/actions">
                              <button className={`p-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? "hover:bg-slate-700 text-slate-400 hover:text-white" 
                                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              
                              {/* Dropdown Menu */}
                              <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all duration-200 z-10 ${
                                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-gray-200"
                              }`}>
                                <div className="py-2">
                                  <button
                                    onClick={() => handleOpenViewModal(workspace.id)}
                                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                                      darkMode 
                                        ? "text-slate-300 hover:bg-slate-700 hover:text-white" 
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    disabled={isProcessing}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditModal(workspace)}
                                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                                      darkMode 
                                        ? "text-slate-300 hover:bg-slate-700 hover:text-white" 
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(workspace)}
                                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                                      darkMode 
                                        ? "text-red-400 hover:bg-red-900/20 hover:text-red-300" 
                                        : "text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className={`text-sm line-clamp-2 mb-4 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                            {workspace.description || "No description provided."}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className={`px-6 py-4 border-t ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-gray-200 bg-gray-50/50"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                darkMode ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                              }`}>
                                {getInitials(workspace.owner?.name || workspace.owner?.email || 'U')}
                              </div>
                              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {workspace.owner?.id === user?.id ? 'You' : (workspace.owner?.name || 'Unknown')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {workspace.members?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hover overlay */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          darkMode 
                            ? "bg-gradient-to-t from-blue-900/10 to-transparent" 
                            : "bg-gradient-to-t from-blue-50/50 to-transparent"
                        }`}></div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Workspace</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label htmlFor="title" className={`block mb-2 text-sm font-medium ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}>
                  Workspace Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace title"
                  
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className={`block mb-2 text-sm font-medium ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}>
                  Description
                </label>
                <textarea
                  id="description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace description"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode 
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600" 
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Workspace</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditWorkspace}>
              <div className="mb-4">
                <label htmlFor="edit-title" className={`block mb-2 text-sm font-medium ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}>
                  Workspace Title *
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace title"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="edit-description" className={`block mb-2 text-sm font-medium ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}>
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace description"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode 
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600" 
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Workspace Modal */}
      {showViewModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`w-full max-w-2xl p-6 rounded-lg shadow-xl ${
            darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Workspace Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header with icon */}
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
                  darkMode 
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                    : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                }`}>
                  {getInitials(currentWorkspace.name)}
                </div>
                <div>
                  <h4 className="text-2xl font-bold">{currentWorkspace.name}</h4>
                  <p className={`${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Created {formatDate(currentWorkspace.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h5 className={`text-sm font-medium mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Description
                </h5>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {currentWorkspace.description || "No description provided."}
                </p>
              </div>
              
              {/* Owner Info */}
              <div>
                <h5 className={`text-sm font-medium mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Owner
                </h5>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    darkMode ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                  }`}>
                    {getInitials(currentWorkspace.owner?.name || currentWorkspace.owner?.email || 'U')}
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {currentWorkspace.owner?.name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {currentWorkspace.owner?.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Members */}
              <div>
                <h5 className={`text-sm font-medium mb-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Members ({currentWorkspace.members?.length || 0})
                </h5>
                {currentWorkspace.members && currentWorkspace.members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentWorkspace.members.map((member) => (
                      <div 
                        key={member.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          darkMode ? "bg-slate-700" : "bg-gray-100"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          darkMode ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                        }`}>
                          {getInitials(member.name || member.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {member.name}
                            {member.id === user?.id && (
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                darkMode ? "bg-blue-600 text-blue-100" : "bg-blue-100 text-blue-800"
                              }`}>
                                You
                              </span>
                            )}
                          </p>
                          <p className={`text-sm truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    No members found.
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowViewModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600" 
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenEditModal(currentWorkspace);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {showDeleteModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-slate-900/30">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-red-600">Delete Workspace</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className={`text-center ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                Are you sure you want to delete "<span className="font-semibold">{currentWorkspace.name}</span>"?
              </p>
              <p className={`text-center text-sm mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                This action cannot be undone. All data associated with this workspace will be permanently removed.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600" 
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}