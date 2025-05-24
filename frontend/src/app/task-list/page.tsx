"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Filter,
  Search,
  X,
  Building,
  FolderOpen,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  List,
} from "lucide-react";
import {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  createSubtask,
  getSubtasks,
} from "@/services/Task.service";
import { getAllWorkspaces } from "@/services/Workspace.service";
import { getWorkspaceProjects } from "@/services/Project.service";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// Type definitions
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  members?: ProjectMember[];
}

interface ProjectMember {
  id: string;
  name?: string;
  email: string;
}

interface Filters {
  status: string;
  assignee: string;
  search: string;
}

interface NewTask {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assigneeId: string;
  workspaceId: string;
  projectId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  createdAt: string;
}

const TaskManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Selection states
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Task states
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [isViewSubtasksModalOpen, setIsViewSubtasksModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in_progress" | "completed",
  });
  const [filters, setFilters] = useState<Filters>({
    status: "",
    assignee: "",
    search: "",
  });

  // Form state for creating new task
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assigneeId: "",
    workspaceId: "",
    projectId: "",
  });

  const statusColors: Record<Task["status"], string> = {
    todo: "bg-gray-100 text-gray-800 border-gray-300",
    in_progress: "bg-blue-100 text-blue-800 border-blue-300",
    in_review: "bg-yellow-100 text-yellow-800 border-yellow-300",
    completed: "bg-green-100 text-green-800 border-green-300",
  };

  const priorityColors: Record<Task["priority"], string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  const statusIcons: Record<
    Task["status"],
    React.ComponentType<{ size?: number; className?: string }>
  > = {
    todo: Circle,
    in_progress: Clock,
    in_review: AlertCircle,
    completed: CheckCircle,
  };

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces();
    fetchAllTasks();
  }, []);

  // Apply filters when tasks or filters change
  useEffect(() => {
    applyFilters();
  }, [allTasks, filters]);

  const fetchWorkspaces = async () => {
    try {
      setLoadingWorkspaces(true);
      const response = await getAllWorkspaces();
      setWorkspaces(response.data || []);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      alert("Failed to fetch workspaces. Please try again.");
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const fetchProjects = async (workspaceId: string) => {
    try {
      const response = await getWorkspaceProjects(workspaceId);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  };

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const workspacesResponse = await getAllWorkspaces();
      const workspacesList = workspacesResponse.data || [];

      const allTasksData: Task[] = [];

      // Fetch tasks from all workspaces and projects
      for (const workspace of workspacesList) {
        try {
          const projectsResponse = await getWorkspaceProjects(workspace.id);
          const projectsList = projectsResponse.data || [];

          for (const project of projectsList) {
            try {
              const tasksResponse = await getProjectTasks(
                workspace.id,
                project.id
              );
              const tasks = tasksResponse.data || [];

              // Add workspace and project info to each task
              const tasksWithContext = tasks.map((task: Task) => ({
                ...task,
                workspace: { id: workspace.id, name: workspace.name },
                project: { id: project.id, name: project.name },
              }));

              allTasksData.push(...tasksWithContext);
            } catch (error) {
              console.error(
                `Error fetching tasks for project ${project.id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Error fetching projects for workspace ${workspace.id}:`,
            error
          );
        }
      }

      setAllTasks(allTasksData);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      alert("Failed to fetch tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      assigneeId: task.assignee?.id || "",
      workspaceId: task.workspace?.id || "",
      projectId: task.project?.id || "",
    });

    // Fetch projects for the workspace
    if (task.workspace?.id) {
      fetchProjects(task.workspace.id).then((projectsList) => {
        setProjects(projectsList);
      });
    }

    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTask) return;

    try {
      const updates = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString()
          : null,
        assigneeId: newTask.assigneeId || null,
      };

      await updateTask(
        editingTask.workspace?.id || "",
        editingTask.project?.id || "",
        editingTask.id,
        updates
      );

      // Reset form and close modal
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assigneeId: "",
        workspaceId: "",
        projectId: "",
      });
      setProjects([]);
      setEditingTask(null);
      setIsEditModalOpen(false);

      // Refresh tasks list
      fetchAllTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await deleteTask(
        deletingTask.workspace?.id || "",
        deletingTask.project?.id || "",
        deletingTask.id
      );

      setDeletingTask(null);
      setIsDeleteModalOpen(false);

      // Refresh tasks list
      fetchAllTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleAddSubtask = (task: Task) => {
    setSelectedTask(task);
    setIsSubtaskModalOpen(true);
    setActiveDropdown(null);
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask) return;

    try {
      const subtaskData = {
        title: newSubtask.title,
        description: newSubtask.description,
        status: newSubtask.status,
      };

      await createSubtask(
        selectedTask.workspace?.id || "",
        selectedTask.project?.id || "",
        selectedTask.id,
        subtaskData
      );

      // Reset form and close modal
      setNewSubtask({
        title: "",
        description: "",
        status: "todo",
      });
      setIsSubtaskModalOpen(false);

      alert("Subtask created successfully!");
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert("Failed to create subtask. Please try again.");
    }
  };

  const handleViewSubtasks = async (task: Task) => {
    try {
      setSelectedTask(task);
      const response = await getSubtasks(
        task.workspace?.id || "",
        task.project?.id || "",
        task.id
      );
      setSubtasks(response.data || []);
      setIsViewSubtasksModalOpen(true);
      setActiveDropdown(null);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      alert("Failed to fetch subtasks. Please try again.");
    }
  };

  const applyFilters = () => {
    let filtered = [...allTasks];

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.assignee) {
      filtered = filtered.filter(
        (task) => task.assignee?.id === filters.assignee
      );
    }

    if (filters.search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.workspaceId || !newTask.projectId) {
      alert("Please select a workspace and project.");
      return;
    }

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString()
          : null,
        assigneeId: newTask.assigneeId || null,
      };

      await createTask(newTask.workspaceId, newTask.projectId, taskData);

      // Reset form and close modal
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assigneeId: "",
        workspaceId: "",
        projectId: "",
      });
      setProjects([]);
      setIsCreateModalOpen(false);

      // Refresh tasks list
      fetchAllTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    setNewTask((prev) => ({ ...prev, workspaceId, projectId: "" }));
    if (workspaceId) {
      const projectsList = await fetchProjects(workspaceId);
      setProjects(projectsList);
    } else {
      setProjects([]);
    }
  };

  const handleViewTask = async (
    taskId: string,
    workspaceId: string,
    projectId: string
  ) => {
    try {
      const response = await getTask(workspaceId, projectId, taskId);
      setSelectedTask(response.data);
      setIsViewModalOpen(true);
      setActiveDropdown(null);
    } catch (error) {
      console.error("Error fetching task details:", error);
      alert("Failed to fetch task details. Please try again.");
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAssigneeName = (assignee?: {
    id: string;
    name?: string;
    email: string;
  }): string => {
    if (!assignee) return "Unassigned";
    return assignee.name || assignee.email;
  };

  // Get unique assignees from all tasks
  const getAllAssignees = () => {
    const assignees = new Map();
    allTasks.forEach((task) => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assignees.values());
  };

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
          notificationCount={0}
          user={user}
        />

        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Task Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage all your tasks across workspaces and projects
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Create Task
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filters.assignee}
                  onChange={(e) =>
                    handleFilterChange("assignee", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Assignees</option>
                  {getAllAssignees().map((assignee: any) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name || assignee.email}
                    </option>
                  ))}
                </select>

                {(filters.status || filters.assignee || filters.search) && (
                  <button
                    onClick={() =>
                      setFilters({ status: "", assignee: "", search: "" })
                    }
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Circle size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tasks found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {allTasks.length === 0
                      ? "Get started by creating your first task"
                      : "Try adjusting your filters to see more tasks"}
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Create Task
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const StatusIcon = statusIcons[task.status];
                  return (
                    <div
                      key={task.id}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 relative"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Flag
                            size={16}
                            className={priorityColors[task.priority]}
                          />
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === task.id ? null : task.id
                                )
                              }
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <MoreVertical
                                size={16}
                                className="text-gray-500"
                              />
                            </button>

                            {activeDropdown === task.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <button
                                  onClick={() =>
                                    handleViewTask(
                                      task.id,
                                      task.workspace?.id || "",
                                      task.project?.id || ""
                                    )
                                  }
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleViewSubtasks(task)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                  <List size={14} />
                                  Subtasks
                                </button>
                                <button
                                  onClick={() => handleAddSubtask(task)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                  <Plus size={14} />
                                  Add Subtask
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          <b>Description :</b> {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            statusColors[task.status]
                          }`}
                        >
                          <StatusIcon size={12} className="inline mr-1" />
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Building size={14} />
                          <span className="truncate">
                            <b>Workspaces : </b>{task.workspace?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FolderOpen size={14} />
                          <span className="truncate"><b>Projects : </b>{task.project?.name}</span>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="truncate">
                              <b>Assignees : </b>{getAssigneeName(task.assignee)}
                            </span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span><b>Due Date : </b>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span><b>Created :</b>Created {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Create Task Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Create New Task
                    </h2>
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setNewTask({
                          title: "",
                          description: "",
                          status: "todo",
                          priority: "medium",
                          dueDate: "",
                          assigneeId: "",
                          workspaceId: "",
                          projectId: "",
                        });
                        setProjects([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building size={16} className="inline mr-1" />
                          Workspace *
                        </label>
                        <select
                          required
                          value={newTask.workspaceId}
                          onChange={(e) =>
                            handleWorkspaceChange(e.target.value)
                          }
                          disabled={loadingWorkspaces}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">
                            {loadingWorkspaces
                              ? "Loading workspaces..."
                              : "Select a workspace"}
                          </option>
                          {workspaces.map((workspace) => (
                            <option key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FolderOpen size={16} className="inline mr-1" />
                          Project *
                        </label>
                        <select
                          required
                          value={newTask.projectId}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              projectId: e.target.value,
                            }))
                          }
                          disabled={!newTask.workspaceId}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">
                            {!newTask.workspaceId
                              ? "Select workspace first"
                              : "Select a project"}
                          </option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={newTask.status}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              status: e.target.value as Task["status"],
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={newTask.priority}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              priority: e.target.value as Task["priority"],
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignee
                      </label>
                      <select
                        value={newTask.assigneeId}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            assigneeId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Unassigned</option>
                        {projects
                          .find((p) => p.id === newTask.projectId)
                          ?.members?.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name || member.email}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setNewTask({
                            title: "",
                            description: "",
                            status: "todo",
                            priority: "medium",
                            dueDate: "",
                            assigneeId: "",
                            workspaceId: "",
                            projectId: "",
                          });
                          setProjects([]);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors duration-200"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* View Task Modal */}
          {isViewModalOpen && selectedTask && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        {selectedTask.title}
                      </h2>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            statusColors[selectedTask.status]
                          }`}
                        >
                          {React.createElement(
                            statusIcons[selectedTask.status],
                            { size: 16, className: "inline mr-1" }
                          )}
                          {selectedTask.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            priorityColors[selectedTask.priority]
                          }`}
                        >
                          <Flag size={16} className="inline mr-1" />
                          {selectedTask.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setSelectedTask(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-4"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {selectedTask.description && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {selectedTask.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Workspace
                          </h4>
                          <div className="flex items-center gap-2 text-gray-900">
                            <Building size={16} />
                            <span>
                              {selectedTask.workspace?.name || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Project
                          </h4>
                          <div className="flex items-center gap-2 text-gray-900">
                            <FolderOpen size={16} />
                            <span>
                              {selectedTask.project?.name || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Assignee
                          </h4>
                          <div className="flex items-center gap-2 text-gray-900">
                            <User size={16} />
                            <span>
                              {getAssigneeName(selectedTask.assignee)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedTask.dueDate && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              Due Date
                            </h4>
                            <div className="flex items-center gap-2 text-gray-900">
                              <Calendar size={16} />
                              <span>{formatDate(selectedTask.dueDate)}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Created
                          </h4>
                          <div className="flex items-center gap-2 text-gray-900">
                            <Clock size={16} />
                            <span>{formatDate(selectedTask.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setIsViewModalOpen(false);
                          setSelectedTask(null);
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Task Modal */}
          {isEditModalOpen && editingTask && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Edit Task
                    </h2>
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingTask(null);
                        setNewTask({
                          title: "",
                          description: "",
                          status: "todo",
                          priority: "medium",
                          dueDate: "",
                          assigneeId: "",
                          workspaceId: "",
                          projectId: "",
                        });
                        setProjects([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateTask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={newTask.status}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              status: e.target.value as Task["status"],
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={newTask.priority}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              priority: e.target.value as Task["priority"],
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignee
                      </label>
                      <select
                        value={newTask.assigneeId}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            assigneeId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Unassigned</option>
                        {projects
                          .find((p) => p.id === newTask.projectId)
                          ?.members?.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name || member.email}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setEditingTask(null);
                          setNewTask({
                            title: "",
                            description: "",
                            status: "todo",
                            priority: "medium",
                            dueDate: "",
                            assigneeId: "",
                            workspaceId: "",
                            projectId: "",
                          });
                          setProjects([]);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors duration-200"
                      >
                        Update Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {isDeleteModalOpen && deletingTask && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Delete Task
                      </h2>
                      <p className="text-sm text-gray-500">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700">
                      Are you sure you want to delete the task "
                      <strong>{deletingTask.title}</strong>"?
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setDeletingTask(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteTask}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors duration-200"
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Subtask Modal */}
          {isSubtaskModalOpen && selectedTask && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Add Subtask
                    </h2>
                    <button
                      onClick={() => {
                        setIsSubtaskModalOpen(false);
                        setNewSubtask({
                          title: "",
                          description: "",
                          status: "todo",
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Adding subtask to:</p>
                    <p className="font-medium text-gray-900">
                      {selectedTask.title}
                    </p>
                  </div>

                  <form onSubmit={handleCreateSubtask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtask Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubtask.title}
                        onChange={(e) =>
                          setNewSubtask((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subtask title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newSubtask.description}
                        onChange={(e) =>
                          setNewSubtask((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subtask description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newSubtask.status}
                        onChange={(e) =>
                          setNewSubtask((prev) => ({
                            ...prev,
                            status: e.target.value as
                              | "todo"
                              | "in_progress"
                              | "completed",
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubtaskModalOpen(false);
                          setNewSubtask({
                            title: "",
                            description: "",
                            status: "todo",
                          });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors duration-200"
                      >
                        Add Subtask
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* View Subtasks Modal */}
          {isViewSubtasksModalOpen && selectedTask && (
            <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Subtasks
                      </h2>
                      <p className="text-gray-600">{selectedTask.title}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsViewSubtasksModalOpen(false);
                        setSubtasks([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {subtasks.length === 0 ? (
                      <div className="text-center py-8">
                        <List
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No subtasks yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Add subtasks to break down this task into smaller
                          parts.
                        </p>
                        <button
                          onClick={() => {
                            setIsViewSubtasksModalOpen(false);
                            setIsSubtaskModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Add First Subtask
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            {subtasks.length} subtask
                            {subtasks.length !== 1 ? "s" : ""}
                          </p>
                          <button
                            onClick={() => {
                              setIsViewSubtasksModalOpen(false);
                              setIsSubtaskModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                          >
                            <Plus size={16} />
                            Add Subtask
                          </button>
                        </div>

                        <div className="space-y-3">
                          {subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {subtask.title}
                                </h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    subtask.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : subtask.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {subtask.status === "in_progress"
                                    ? "In Progress"
                                    : subtask.status === "completed"
                                    ? "Completed"
                                    : "To Do"}
                                </span>
                              </div>
                              {subtask.description && (
                                <p className="text-gray-600 text-sm mb-2">
                                  {subtask.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Created {formatDate(subtask.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Click outside to close dropdown */}
          {activeDropdown && (
            <div
              className="fixed inset-0 z-5"
              onClick={() => setActiveDropdown(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
