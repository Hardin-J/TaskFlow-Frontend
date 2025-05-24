"use client";
import React, { useState, useEffect, useRef, ReactNode } from "react";
import {
  Plus,
  Calendar,
  Users,
  FolderOpen,
  X,
  AlertCircle,
  RefreshCw,
  MoreVertical, // New icon for the three-dot menu
} from "lucide-react";

// Import your API services
import {
  getWorkspaceProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/services/Project.service";
import { getAllWorkspaces } from "@/services/Workspace.service";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  workspaceId: string;
  workspaceName: ReactNode;
  id: string;
  name: string;
  description: string;
  status: "active" | "archived" | "completed";
  deadline: string;
  members: Array<{ id: string; name: string }>;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members?: Array<{ id: string; name: string; email: string }>;
  projects?: Project[];
}

interface ProjectForm {
  name: string;
  description: string;
  workspaceId: string;
  deadline: string;
  status: "active" | "archived" | "completed";
}

const ProjectDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null); // Assuming user state is managed elsewhere or will be fetched
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For create/update form submission
  const [isLoadingData, setIsLoadingData] = useState(true); // For initial data load/refresh
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation loading
  const [formData, setFormData] = useState<ProjectForm>({
    name: "",
    description: "",
    workspaceId: "",
    deadline: "",
    status: "active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>(""); // General API error for modals

  // State for the three-dot menu on cards
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null); // Ref to detect clicks outside the menu

  // State for delete confirmation modal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    toast.remove(); // Clear any existing toasts
  }, []);

  // Show toast with custom positioning
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const toastOptions = {
      position: "top-center" as const,
      duration: 3000,
      style: {
        background: darkMode ? "#374151" : "#ffffff",
        color: darkMode ? "#f9fafb" : "#111827",
        border: darkMode ? "1px solid #4b5563" : "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        maxWidth: "400px",
        textAlign: "center" as const,
      },
    };

    if (type === "success") {
      toast.success(message, toastOptions);
    } else {
      toast.error(message, toastOptions);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaces.length > 0) {
      loadAllProjects();
    } else {
      setProjects([]);
    }
  }, [workspaces]);

  // Load projects when workspace is selected
  // useEffect(() => {
  //   if (selectedWorkspaceId) {
  //     loadProjects(selectedWorkspaceId);
  //   } else {
  //     setProjects([]);
  //   }
  // }, [selectedWorkspaceId]);

  // Handle clicks outside the three-dot menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);
  const loadAllProjects = async () => {
    try {
      setIsLoadingData(true);
      setApiError("");

      // Get all projects from all workspaces
      const allProjects = [];
      for (const workspace of workspaces) {
        try {
          const response = await getWorkspaceProjects(workspace.id);
          if (response.data && Array.isArray(response.data)) {
            // Add workspace info to each project for display
            const projectsWithWorkspace = response.data.map((project: any) => ({
              ...project,
              workspaceName: workspace.name,
              workspaceId: workspace.id,
            }));
            allProjects.push(...projectsWithWorkspace);
          }
        } catch (error:any) {
          console.error(
            `Error loading projects from workspace ${workspace.name}:`,
            error
          );
          // Continue with other workspaces even if one fails
        }
      }

      setProjects(allProjects);
    } catch (error:any) {
      console.error("Error loading all projects:", error);
      setApiError(error.message || "Failed to load projects");
      setProjects([]);
      showToast(error.message || "Failed to load projects", "error");
    } finally {
      setIsLoadingData(false);
    }
  };
  const loadWorkspaces = async () => {
    try {
      setIsLoadingData(true);
      setApiError("");
      const response = await getAllWorkspaces();

      if (response.data && Array.isArray(response.data)) {
        setWorkspaces(response.data);
        if (response.data.length > 0 && !selectedWorkspaceId) {
          setSelectedWorkspaceId(response.data[0].id);
        } else if (
          response.data.length > 0 &&
          selectedWorkspaceId &&
          !response.data.some(
            (ws: { id: string }) => ws.id === selectedWorkspaceId
          )
        ) {
          setSelectedWorkspaceId(response.data[0].id);
        } else if (response.data.length === 0) {
          setSelectedWorkspaceId("");
        }
      } else {
        throw new Error("Invalid workspace data format");
      }
    } catch (error: any) {
      console.error("Error loading workspaces:", error);
      setApiError(error.message || "Failed to load workspaces");
      setWorkspaces([]);
      showToast(error.message || "Failed to load workspaces", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProjects = async (workspaceId: string) => {
    if (!workspaceId) {
      setProjects([]);
      setIsLoadingData(false);
      return;
    }
    try {
      setIsLoadingData(true);
      setApiError("");
      const response = await getWorkspaceProjects(workspaceId);

      if (response.data && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        throw new Error("Invalid project data format");
      }
    } catch (error: any) {
      console.error("Error loading projects:", error);
      setApiError(error.message || "Failed to load projects");
      setProjects([]);
      showToast(error.message || "Failed to load projects", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setOpenMenuId(null);
  };

  const refreshData = () => {
    loadWorkspaces();
    if (selectedWorkspaceId) {
      loadProjects(selectedWorkspaceId);
    }
    setOpenMenuId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (!dateString.includes("T") && !dateString.includes("Z")) {
        return new Date(dateString + "T00:00:00Z").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return "Invalid Date";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Project name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must not exceed 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    if (!formData.workspaceId) {
      newErrors.workspaceId = "Please select a workspace";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (
        deadlineDate < today &&
        formData.deadline !== today.toISOString().split("T")[0]
      ) {
        newErrors.deadline = "Deadline cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCreateSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
  
    if (!validateForm()) {
      showToast("Please correct the form errors.", "error");
      return;
    }
  
    setIsLoading(true);
    setApiError("");
  
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        deadline: formData.deadline,
        status: formData.status,
      };
  
      const response = await createProject(formData.workspaceId, projectData);
  
      if (response.data) {
        // Refresh all projects instead of just one workspace
        await loadAllProjects();
        setIsCreateModalOpen(false);
        resetForm();
        showToast("Project created successfully!", "success");
      }
    } catch (error:any) {
      console.error("Error creating project:", error);
      const message = error.message || "Failed to create project.";
      setApiError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditMode(false);
    setIsViewEditModalOpen(true);
    setApiError("");
    setOpenMenuId(null);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      workspaceId: selectedWorkspaceId,
      deadline: project.deadline.split("T")[0],
      status: project.status,
    });
    setIsEditMode(true);
    setIsViewEditModalOpen(true);
    setApiError("");
    setOpenMenuId(null);
  };

  const handleUpdateSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
  
    if (!validateForm()) {
      showToast("Please correct the form errors.", "error");
      return;
    }
  
    if (!selectedProject) {
      showToast("Project not selected for update.", "error");
      return;
    }
  
    setIsLoading(true);
    setApiError("");
  
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        deadline: formData.deadline,
        status: formData.status,
      };
  
      const response = await updateProject(
        selectedProject.workspaceId, // Use the project's workspace ID
        selectedProject.id,
        projectData
      );
  
      if (response.data) {
        await loadAllProjects(); // Refresh all projects
        setIsViewEditModalOpen(false);
        resetForm();
        setSelectedProject(null);
        showToast("Project updated successfully!", "success");
      }
    } catch (error:any) {
      console.error("Error updating project:", error);
      const message = error.message || "Failed to update project.";
      setApiError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      showToast("Project not selected for deletion.", "error");
      return;
    }
  
    setIsDeleting(true);
    setApiError("");
    setIsConfirmDeleteModalOpen(false);
  
    try {
      await deleteProject(projectToDelete.workspaceId, projectToDelete.id);
      await loadAllProjects(); // Refresh all projects
      showToast("Project deleted successfully!", "success");
      setSelectedProject(null);
    } catch (error:any) {
      console.error("Error deleting project:", error);
      const message = error.message || "Failed to delete project.";
      setApiError(message);
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const openDeleteConfirmModal = (project: Project) => {
    setProjectToDelete(project);
    setIsConfirmDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const closeDeleteConfirmModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      workspaceId: selectedWorkspaceId || "",
      deadline: "",
      status: "active",
    });
    setErrors({});
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
    setApiError("");
  };

  const openCreateModal = () => {
    setFormData((prev) => ({
      ...prev,
      workspaceId: "", 
    }));
    setIsCreateModalOpen(true);
    setApiError("");
  };

  const closeViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setSelectedProject(null);
    resetForm();
    setApiError("");
  };

  const selectedWorkspace = workspaces.find(
    (w) => w.id === selectedWorkspaceId
  );

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "dark bg-slate-900 text-gray-100"
          : "bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900"
      }`}
    >
      <Sidebar
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
      />

      {/* Main content area */}
      <div
        className={`${
          sidebarCollapsed ? "ml-20" : "ml-64"
        } transition-all duration-300`}
      >
        {/* Topbar */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={0} // Replace with actual notification count
          user={user}
        />
        {/* Page content */}
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                All Projects
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and track all your projects across workspaces
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Remove the workspace selector */}
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingData || isDeleting || isLoading}
              >
                <RefreshCw
                  size={16}
                  className={isLoadingData ? "animate-spin" : ""}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingData || isLoading || isDeleting}
              >
                <Plus size={20} />
                <span>Create Project</span>
              </button>
            </div>
          </div>

          {/* Error Message for main content */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-700">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-700 dark:text-red-300">{apiError}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingData && (
            <div className="flex justify-center items-center py-12">
              <RefreshCw
                className="animate-spin text-blue-600 mr-2"
                size={24}
              />
              <span className="text-gray-600 dark:text-gray-400">
                Loading projects...
              </span>
            </div>
          )}

          {/* Projects Grid */}
          {!isLoadingData && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-slate-700 overflow-hidden relative"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {project.name}
                      </h3>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === project.id ? null : project.id
                            )
                          }
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full p-1 -mr-2"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {openMenuId === project.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-slate-600"
                          >
                            <button
                              onClick={() => handleViewProject(project)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
                            >
                              <FolderOpen size={16} className="mr-2" /> View
                            </button>
                            <button
                              onClick={() => handleEditProject(project)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
                            >
                              <Calendar size={16} className="mr-2" /> Edit
                            </button>
                            <button
                              onClick={() => openDeleteConfirmModal(project)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDeleting}
                            >
                              <X size={16} className="mr-2" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        project.status
                      )} mb-4 inline-block`}
                    >
                      {project.status.charAt(0).toUpperCase() +
                        project.status.slice(1)}
                    </span>
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 rounded-full text-xs font-medium">
                        Workspace: {project.workspaceName}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {project.description || "No description provided"}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={16} className="mr-2 text-blue-500" />
                        <span>Due: {formatDate(project.deadline)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Users size={16} className="mr-2 text-purple-500" />
                        <span>
                          {project.members?.length || 0} member
                          {(project.members?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FolderOpen size={16} className="mr-2 text-green-500" />
                        <span>Created {formatDate(project.createdAt)}</span>
                      </div>
                    </div>

                    {project.members && project.members.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assigned Members:
                        </label>
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((member, index) => (
                            <div
                              key={member.id}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-slate-800"
                              title={member.name}
                            >
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          ))}
                          {project.members.length > 3 && (
                            <div
                              className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-slate-800"
                              title={`+${project.members.length - 3} more`}
                            >
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State for projects in selected workspace */}
          {!isLoadingData && projects.length === 0 && workspaces.length > 0 && (
            <div className="text-center py-12">
              <FolderOpen
                size={64}
                className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
              />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first project
              </p>
              <button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isDeleting}
              >
                Create Your First Project
              </button>
            </div>
          )}
          {/* No Workspace Selected */}
          {!isLoadingData && !selectedWorkspaceId && workspaces.length > 0 && (
            <div className="text-center py-12">
              <FolderOpen
                size={64}
                className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
              />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Select a workspace
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a workspace from the dropdown above to view and manage
                projects
              </p>
            </div>
          )}

          {/* No Workspaces at all */}
          {!isLoadingData && workspaces.length === 0 && !apiError && (
            <div className="text-center py-12">
              <FolderOpen
                size={64}
                className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
              />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No workspaces found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You need to create or join a workspace first to manage projects.
              </p>
              {/* Optionally, add a button to create a workspace here if that functionality exists */}
            </div>
          )}
        </div>
        {/* Create Project Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
              <div className="sticky top-0 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Create New Project
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Start your next amazing project
                    </p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-200 p-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-700/60 backdrop-blur-sm"
                    disabled={isLoading}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {apiError && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/60 rounded-xl dark:from-red-950/50 dark:to-red-900/30 dark:border-red-700/50 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                        <AlertCircle className="text-red-500" size={18} />
                      </div>
                      <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                        {apiError}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                        errors.name
                          ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                      }`}
                      placeholder="e.g., Website Redesign, Mobile App Development"
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mr-2" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Workspace <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="workspaceId"
                      value={formData.workspaceId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white ${
                        errors.workspaceId
                          ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                      }`}
                      disabled={isLoading || workspaces.length === 0}
                    >
                      <option value="">Select a workspace</option>
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                    {errors.workspaceId && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mr-2" />
                        {errors.workspaceId}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white ${
                          errors.deadline
                            ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                            : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                        }`}
                        disabled={isLoading}
                      />
                      {errors.deadline && (
                        <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                          <AlertCircle size={16} className="mr-2" />
                          {errors.deadline}
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white group-hover:border-gray-300 dark:group-hover:border-slate-500"
                        disabled={isLoading}
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                        errors.description
                          ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                      }`}
                      placeholder="Describe your project goals and requirements..."
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mr-2" />
                        {errors.description}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50/80 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700/60 transition-all duration-200 font-semibold backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw size={16} className="animate-spin mr-2" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Plus size={16} className="mr-2" />
                          Create Project
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* View/Edit Project Modal */}
        {isViewEditModalOpen && selectedProject && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {isEditMode ? "Edit Project" : "Project Details"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {isEditMode
                        ? "Update project information"
                        : "View project details"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditMode && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all duration-200 p-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-700/60 backdrop-blur-sm"
                        disabled={isLoading}
                      >
                        <Calendar size={20} />
                      </button>
                    )}
                    <button
                      onClick={closeViewEditModal}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-200 p-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-700/60 backdrop-blur-sm"
                      disabled={isLoading}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {apiError && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/60 rounded-xl dark:from-red-950/50 dark:to-red-900/30 dark:border-red-700/50 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                        <AlertCircle className="text-red-500" size={18} />
                      </div>
                      <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                        {apiError}
                      </p>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={
                    isEditMode ? handleUpdateSubmit : (e) => e.preventDefault()
                  }
                  className="space-y-6"
                >
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Project Name{" "}
                      {isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={isEditMode ? formData.name : selectedProject.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                        errors.name && isEditMode
                          ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                      } ${!isEditMode ? "cursor-not-allowed opacity-75" : ""}`}
                      placeholder="Enter project name"
                      disabled={isLoading || !isEditMode}
                    />
                    {errors.name && isEditMode && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mr-2" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Workspace
                    </label>
                    <div className="px-4 py-3 border-2 border-gray-200 dark:border-slate-600 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl cursor-not-allowed backdrop-blur-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {selectedWorkspace?.name || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Deadline{" "}
                        {isEditMode && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        value={
                          isEditMode
                            ? formData.deadline
                            : selectedProject.deadline.split("T")[0]
                        }
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white ${
                          errors.deadline && isEditMode
                            ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                            : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                        } ${
                          !isEditMode ? "cursor-not-allowed opacity-75" : ""
                        }`}
                        disabled={isLoading || !isEditMode}
                      />
                      {errors.deadline && isEditMode && (
                        <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                          <AlertCircle size={16} className="mr-2" />
                          {errors.deadline}
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Status
                      </label>
                      <select
                        name="status"
                        value={
                          isEditMode ? formData.status : selectedProject.status
                        }
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white group-hover:border-gray-300 dark:group-hover:border-slate-500 ${
                          !isEditMode ? "cursor-not-allowed opacity-75" : ""
                        }`}
                        disabled={isLoading || !isEditMode}
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={
                        isEditMode
                          ? formData.description
                          : selectedProject.description ||
                            "No description provided"
                      }
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                        errors.description && isEditMode
                          ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500"
                      } ${!isEditMode ? "cursor-not-allowed opacity-75" : ""}`}
                      placeholder="Enter project description (optional)"
                      disabled={isLoading || !isEditMode}
                    />
                    {errors.description && isEditMode && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mr-2" />
                        {errors.description}
                      </div>
                    )}
                  </div>

                  {selectedProject.members &&
                    selectedProject.members.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-700/30 dark:to-slate-600/30 rounded-xl p-4 backdrop-blur-sm border border-blue-200/30 dark:border-slate-600/30">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Team Members ({selectedProject.members.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.members.map((member) => (
                            <span
                              key={member.id}
                              className="px-3 py-2 bg-white/80 dark:bg-slate-600/80 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium shadow-sm backdrop-blur-sm border border-gray-200/50 dark:border-slate-500/50"
                            >
                              <Users size={14} className="inline mr-1" />
                              {member.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={closeViewEditModal}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50/80 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700/60 transition-all duration-200 font-semibold backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Close
                    </button>
                    {isEditMode && (
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <RefreshCw
                              size={16}
                              className="animate-spin mr-2"
                            />
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            Save Changes
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isConfirmDeleteModalOpen && projectToDelete && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md transform transition-all duration-300 ease-out">
              <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-red-900/20 backdrop-blur-sm border-b border-red-200/50 dark:border-red-700/30 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                      <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                        Confirm Deletion
                      </h2>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDeleteConfirmModal}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-200 p-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-700/60 backdrop-blur-sm"
                    disabled={isDeleting}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-red-900/10 rounded-xl p-4 mb-6 backdrop-blur-sm border border-red-200/30 dark:border-red-700/20">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Are you sure you want to delete the project{" "}
                    <span className="font-bold text-red-600 dark:text-red-400">
                      "{projectToDelete.name}"
                    </span>
                    ? All associated data will be permanently removed.
                  </p>
                </div>

                {apiError && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/60 rounded-xl dark:from-red-950/50 dark:to-red-900/30 dark:border-red-700/50 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                        <AlertCircle className="text-red-500" size={18} />
                      </div>
                      <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                        {apiError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={closeDeleteConfirmModal}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50/80 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700/60 transition-all duration-200 font-semibold backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center">
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <X size={16} className="mr-2" />
                        Delete Project
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
<style jsx>{`
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`}</style>;
export default ProjectDashboard;