"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import toast from "react-hot-toast";
import { addNewWorkspaces, editWorkspaces, getAllWorkspaces } from "@/services/Workspace.service";

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

  const handleOpenViewModal = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setShowViewModal(true);
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
        ...currentWorkspace,
        name: workspaceTitle,
        description: workspaceDescription,
      };

      // Send Edit
      const response = await editWorkspaces(currentWorkspace.id,updatedWorkspace);        

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
      // Send DELETE request to JSON server
      const response = await fetch(`http://localhost:3001/workspaces/${currentWorkspace.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      
      // Show success notification
      toast.success("Workspace deleted successfully!");
      
      // Close modal
      setShowDeleteModal(false);
      setCurrentWorkspace(null);
      
      // Refresh workspace list
      fetchWorkspaces();
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
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </button>
            </div>

            {/* Workspace List */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {workspaces.length === 0 ? (
                  <div className={`text-center py-12 ${darkMode ? "bg-slate-800" : "bg-white"} rounded-lg shadow`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">No workspaces found</h3>
                    <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Get started by creating a new workspace.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Workspace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`overflow-hidden rounded-lg shadow ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={darkMode ? "bg-slate-700" : "bg-gray-50"}>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Created By
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Created At
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Members
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y divide-gray-200 dark:divide-gray-700`}>
                          {workspaces.map((workspace) => (
                            <tr key={workspace.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">
                                  {workspace?.name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm line-clamp-2">
                                  {workspace.description}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {workspace.owner === user?.id ? 'You' : workspace.owner.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {formatDate(workspace.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {workspace.members.length} members
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleOpenViewModal(workspace)}
                                    className={`p-1 rounded-md ${darkMode ? "hover:bg-slate-700 text-blue-400" : "hover:bg-blue-100 text-blue-600"}`}
                                    title="View"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditModal(workspace)}
                                    className={`p-1 rounded-md ${darkMode ? "hover:bg-slate-700 text-yellow-400" : "hover:bg-yellow-100 text-yellow-600"}`}
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(workspace)}
                                    className={`p-1 rounded-md ${darkMode ? "hover:bg-slate-700 text-red-400" : "hover:bg-red-100 text-red-600"}`}
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
            <div className="flex justify-between items-center mb-4">
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
            
            <div className="space-y-4">
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Title
                </h4>
                <p className="text-lg font-medium">{currentWorkspace.name}</p>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Description
                </h4>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {currentWorkspace.description || "No description provided."}
                </p>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Created By
                </h4>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {currentWorkspace.owner === user?.id ? 'You' : currentWorkspace.owner}
                </p>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Created At
                </h4>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {formatDate(currentWorkspace.createdAt)}
                </p>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Members
                </h4>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {currentWorkspace.members.length} member(s)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentWorkspace.members.map((memberId) => (
                    <div 
                      key={memberId}
                      className={`px-3 py-1 rounded-full text-sm ${
                        darkMode 
                          ? "bg-slate-700 text-slate-300" 
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {memberId === user?.id ? 'You' : memberId}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
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
              <h3 className="text-xl font-semibold">Delete Workspace</h3>
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
              <p className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                Are you sure you want to delete the workspace "<span className="font-semibold">{currentWorkspace.name}</span>"? This action cannot be undone.
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