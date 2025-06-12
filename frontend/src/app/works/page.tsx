"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar"; // Assuming this path is correct
import Topbar from "../../components/Topbar";   // Assuming this path is correct
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
      setWorkspaces(response.data); // Assuming response.data is the array of workspaces
      // Removed redundant status check, assuming service handles errors or response structure is consistent
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
      // Assuming service throws error or response.data is null/undefined on failure
      if (response.data) { // Check if data exists
        setCurrentWorkspace(response.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to fetch workspace details or workspace not found.");
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
      const newWorkspace = {        
        name: workspaceTitle,
        description: workspaceDescription,        
      };

      const response = await addNewWorkspaces(newWorkspace);
      
      // Assuming service throws an error for non-2xx responses or returns a specific structure for success
      // The check for response.status might depend on how your service client is implemented.
      // If addNewWorkspaces throws on error, this if block might not be needed.
      if (response && (response.status === 201 || response.status === 200)) { // Or check based on response.data if applicable
        toast.success("Workspace created successfully!");                
        setWorkspaceTitle("");
        setWorkspaceDescription("");
        setShowCreateModal(false);
        fetchWorkspaces(); // Refresh workspace list
      } else {
        // Handle cases where the service might return a 2xx but indicate an issue, or if status isn't the primary check
        toast.error(response?.data?.message || 'Failed to create workspace');
      }
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      toast.error(error?.response?.data?.message || error.message || "Failed to create workspace. Please try again.");
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
      const updatedWorkspace = {
        name: workspaceTitle,
        description: workspaceDescription,
      };

      const response = await editWorkspaces(currentWorkspace.id, updatedWorkspace);        

      if(response && (response.status === 200)) { // Or check based on response.data
        toast.success("Workspace updated successfully!");
        setWorkspaceTitle("");
        setWorkspaceDescription("");
        setShowEditModal(false);
        setCurrentWorkspace(null);
        fetchWorkspaces(); // Refresh workspace list
      } else {
        toast.error(response?.data?.message || 'Failed to update workspace');
      }
    } catch (error: any) {
      console.error("Error updating workspace:", error);
      toast.error(error?.response?.data?.message || error.message || "Failed to update workspace. Please try again.");
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
      const response = await deleteWorkspace(currentWorkspace.id);

      if (response && (response.status === 200 || response.status === 204)) { // 204 No Content is also common for delete
        toast.success("Workspace deleted successfully!");
        setShowDeleteModal(false);
        setCurrentWorkspace(null);
        fetchWorkspaces(); // Refresh workspace list
      } else {
        throw new Error(response?.data?.message || 'Failed to delete workspace');
      }
    } catch (error: any) {
      console.error("Error deleting workspace:", error);
      toast.error(error?.response?.data?.message || error.message || "Failed to delete workspace. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  };

  return (
    <div className={`flex h-screen transition-colors duration-500 ${ // Changed transition-all to transition-colors for the main div
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
      {/* THIS IS THE CORRECTED LINE: ml-64 changed to ml-72 for expanded sidebar */}
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-72"} transition-all duration-300`}>
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
        <div className="p-4 sm:p-6"> {/* Added responsive padding */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8"> {/* Adjusted margin */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Workspaces</h1>
                <p className={`mt-1 text-sm md:text-base ${darkMode ? "text-slate-400" : "text-slate-600"}`}> {/* Adjusted text size */}
                  View and manage your workspaces
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 md:mt-0 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base" /* Adjusted padding & text size */
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className={`text-center py-12 sm:py-16 ${darkMode ? "bg-slate-800/50" : "bg-white"} rounded-2xl shadow-xl border ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 sm:p-4 rounded-full ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">No workspaces found</h3>
                    <p className={`mb-6 text-sm sm:text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Get started by creating your first workspace to organize your projects.
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Your First Workspace
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {workspaces.map((workspace) => (
                      <div 
                        key={workspace.id} 
                        className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${ // Subtle hover effect
                          darkMode 
                            ? "bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600" // Dark mode card style
                            : "bg-white hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300" // Light mode card style
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-5"> {/* Adjusted padding */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 min-w-0"> {/* Added min-w-0 for truncation */}
                              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg ${
                                darkMode 
                                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md" 
                                  : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                              }`}>
                                {getInitials(workspace.name)}
                              </div>
                              <div className="min-w-0"> {/* Added min-w-0 for truncation */}
                                <h3 className="text-md sm:text-lg font-bold truncate" title={workspace.name}>{workspace.name}</h3>
                                <p className={`text-xs sm:text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                  {formatDate(workspace.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions Dropdown */}
                            <div className="relative group/actions flex-shrink-0">
                              <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? "hover:bg-slate-700 text-slate-400 hover:text-white" 
                                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              
                              <div className={`absolute right-0 top-full mt-1 w-40 sm:w-48 rounded-lg shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all duration-200 z-10 ${
                                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-gray-200"
                              }`}>
                                <div className="py-1.5">
                                  {[
                                    { label: "View Details", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, action: () => handleOpenViewModal(workspace.id), disabled: isProcessing },
                                    { label: "Edit", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, action: () => handleOpenEditModal(workspace) },
                                    { label: "Delete", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>, action: () => handleOpenDeleteModal(workspace), style: darkMode ? "text-red-400 hover:bg-red-900/30 hover:text-red-300" : "text-red-600 hover:bg-red-50" }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      onClick={item.action}
                                      className={`w-full flex items-center px-3.5 py-2 text-xs sm:text-sm transition-colors ${item.style || (darkMode ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-gray-700 hover:bg-gray-100")} ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                      disabled={item.disabled}
                                    >
                                      {item.icon}
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className={`text-xs sm:text-sm line-clamp-2 mb-4 h-8 sm:h-10 ${darkMode ? "text-slate-300" : "text-slate-600"}`}> {/* Fixed height for description */}
                            {workspace.description || "No description provided."}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className={`px-5 py-3.5 border-t ${darkMode ? "border-slate-700/70 bg-slate-800/50" : "border-gray-200/80 bg-gray-50/70"}`}> {/* Adjusted padding */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                              }`}>
                                {getInitials(workspace.owner?.name || workspace.owner?.email)}
                              </div>
                              <span className={`text-xs sm:text-sm ${darkMode ? "text-slate-400" : "text-slate-500"} truncate max-w-[100px] sm:max-w-[120px]`} title={workspace.owner?.name || workspace.owner?.email || 'Unknown'}>
                                {workspace.owner?.id === user?.id ? 'You' : (workspace.owner?.name || 'Unknown')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <span className={`text-xs sm:text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {workspace.members?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals (Create, Edit, View, Delete) - Structure simplified for brevity, assumed to be similar to original */}
      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-slate-900/40 p-4">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl ${
            darkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create New Workspace</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="title" className={`block mb-1.5 text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Workspace Title <span className="text-red-500">*</span></label>
                <input type="text" id="title" value={workspaceTitle} onChange={(e) => setWorkspaceTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700/60 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500" : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500"}`}
                  placeholder="e.g. Q4 Marketing" required />
              </div>
              <div>
                <label htmlFor="description" className={`block mb-1.5 text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Description (Optional)</label>
                <textarea id="description" value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700/60 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500" : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500"}`}
                  placeholder="Briefly describe the workspace" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"} disabled:opacity-60`}>Cancel</button>
                <button type="submit" disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center min-w-[90px] disabled:opacity-60`}>
                  {isProcessing ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal (similar structure to Create) */}
      {showEditModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-slate-900/40 p-4">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl ${darkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800"}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Workspace</h3>
              <button onClick={() => setShowEditModal(false)} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-gray-500 hover:bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditWorkspace} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className={`block mb-1.5 text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Workspace Title <span className="text-red-500">*</span></label>
                <input type="text" id="edit-title" value={workspaceTitle} onChange={(e) => setWorkspaceTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700/60 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500" : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500"}`}
                  placeholder="e.g. Q4 Marketing" required />
              </div>
              <div>
                <label htmlFor="edit-description" className={`block mb-1.5 text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Description (Optional)</label>
                <textarea id="edit-description" value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700/60 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500" : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500"}`}
                  placeholder="Briefly describe the workspace" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"} disabled:opacity-60`}>Cancel</button>
                <button type="submit" disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center min-w-[90px] disabled:opacity-60`}>
                  {isProcessing ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Workspace Modal */}
      {showViewModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-slate-900/40 p-4 overflow-y-auto">
          <div className={`w-full max-w-lg p-6 my-8 rounded-xl shadow-2xl ${darkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800"}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Workspace Details</h3>
              <button onClick={() => setShowViewModal(false)} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-gray-500 hover:bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl ${darkMode ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"}`}>
                  {getInitials(currentWorkspace.name)}
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold">{currentWorkspace.name}</h4>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Created {formatDate(currentWorkspace.createdAt)}</p>
                </div>
              </div>
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Description</h5>
                <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{currentWorkspace.description || "No description provided."}</p>
              </div>
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Owner</h5>
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium ${darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}>
                    {getInitials(currentWorkspace.owner?.name || currentWorkspace.owner?.email)}
                  </div>
                  <div>
                    <p className={`font-medium text-sm sm:text-base ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{currentWorkspace.owner?.name || 'Unknown'}</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{currentWorkspace.owner?.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Members ({currentWorkspace.members?.length || 0})</h5>
                {currentWorkspace.members && currentWorkspace.members.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    {currentWorkspace.members.map((member) => (
                      <div key={member.id} className={`flex items-center space-x-3 p-2.5 rounded-lg ${darkMode ? "bg-slate-700/70" : "bg-gray-100/70"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}>
                          {getInitials(member.name || member.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                            {member.name} {member.id === user?.id && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${darkMode ? "bg-blue-600 text-blue-100" : "bg-blue-100 text-blue-800"}`}>You</span>}
                          </p>
                          <p className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No members yet.</p>}
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setShowViewModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>Close</button>
              <button onClick={() => { setShowViewModal(false); handleOpenEditModal(currentWorkspace); }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Edit Workspace</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {showDeleteModal && currentWorkspace && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-slate-900/40 p-4">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl ${darkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? "text-red-500" : "text-red-600"}`}>Delete Workspace</h3>
              <button onClick={() => setShowDeleteModal(false)} className={`p-1.5 rounded-full transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-gray-500 hover:bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${darkMode ? "text-red-400" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Are you sure you want to delete "<span className="font-semibold">{currentWorkspace.name}</span>"?</p>
              <p className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>This action cannot be undone. All associated data will be lost.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} disabled={isProcessing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"} disabled:opacity-60`}>Cancel</button>
              <button onClick={handleDeleteWorkspace} disabled={isProcessing}
                className={`px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 flex items-center justify-center min-w-[90px] disabled:opacity-60`}>
                {isProcessing ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}