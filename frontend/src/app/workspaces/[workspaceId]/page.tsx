// app/workspaces/[workspaceId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWorkspaceById } from "@/services/Workspace.service";
import { getWorkspaceProjects, getTasksByProject } from "@/services/Project.service";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: string;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  memberCount?: number;
  taskCount?: number;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  memberCount?: number;
  projectCount?: number;
  projects?: Project[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Initialize user data and theme
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }

    const sidebarState = localStorage.getItem('sidebarCollapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (workspaceId) {
      const fetchWorkspaceData = async () => {
        setIsLoading(true);
        try {
          const wsResponse = await getWorkspaceById(workspaceId);
          setWorkspace(wsResponse.data.data || wsResponse.data);

          const projectsResponse = await getWorkspaceProjects(workspaceId);
          setProjects(projectsResponse.data.data || projectsResponse.data || []);

        } catch (error) {
          console.error("Error fetching workspace details:", error);
          toast.error("Failed to load workspace details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchWorkspaceData();
    }
  }, [workspaceId]);

  const handleProjectClick = async (project: Project) => {
    if (selectedProject?.id === project.id) {
      // If clicking the same project, toggle it closed
      setSelectedProject(null);
      setProjectTasks([]);
      setSelectedTask(null);
      return;
    }

    setSelectedProject(project);
    setSelectedTask(null);
    setIsLoadingTasks(true);

    try {
      const tasksResponse = await getTasksByProject(workspaceId, project.id);
      setProjectTasks(tasksResponse.data.data || tasksResponse.data || []);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      toast.error("Failed to load project tasks.");
      setProjectTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'in_review':
      case 'in-review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'todo':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Sidebar */}
        <Sidebar
          darkMode={darkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          user={user}
        />
        
        {/* Main Content Area */}
        <div className={`${sidebarCollapsed ? "ml-20" : "ml-72"} transition-all duration-300`}>
          {/* Topbar */}
          <Topbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            notificationCount={0}
            user={user}
          />

          {/* Page Content */}
          <main className="p-6 max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading workspace details...</p>
                </div>
              </div>
            ) : !workspace ? (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 max-w-md mx-auto">
                  <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Workspace Not Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">The workspace you're looking for doesn't exist or couldn't be loaded.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Workspace Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {workspace.name}
                          </h1>
                          <p className="text-slate-500 dark:text-slate-400 mt-1">Workspace</p>
                        </div>
                      </div>
                      
                      {workspace.description && (
                        <p className="text-slate-600 dark:text-slate-300 text-lg mb-6 leading-relaxed">
                          {workspace.description}
                        </p>
                      )}

                      {/* Workspace Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-500 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4h-14m14 8H5" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{projects.length}</p>
                              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Projects</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-500 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{workspace.memberCount || 0}</p>
                              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Members</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-500 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Created</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4h-14m14 8H5" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          Projects ({projects.length})
                        </h2>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <div key={project.id} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                            {/* Project Header */}
                            <div
                              className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                              onClick={() => handleProjectClick(project)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                      {project.name}
                                    </h3>
                                    {project.description && (
                                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                        {project.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {project.status && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                      {project.status.replace('_', ' ')}
                                    </span>
                                  )}
                                  <svg
                                    className={`w-5 h-5 text-slate-400 transition-transform ${
                                      selectedProject?.id === project.id ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Project Tasks (Expanded) */}
                            {selectedProject?.id === project.id && (
                              <div className="border-t border-gray-200 dark:border-slate-600">
                                <div className="p-4 bg-white dark:bg-slate-800">
                                  <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                      Tasks {isLoadingTasks ? '(Loading...)' : `(${projectTasks.length})`}
                                    </h4>
                                  </div>

                                  {isLoadingTasks ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                                    </div>
                                  ) : projectTasks.length > 0 ? (
                                    <div className="space-y-3">
                                      {projectTasks.map((task) => (
                                        <div key={task.id} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                          {/* Task Header */}
                                          <div
                                            className="p-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                                            onClick={() => handleTaskClick(task)}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-medium text-slate-800 dark:text-slate-100">
                                                    {task.title}
                                                  </h5>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                  {task.status.replace('_', ' ')}
                                                </span>
                                                {task.priority && (
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                  </span>
                                                )}
                                                <svg
                                                  className={`w-4 h-4 text-slate-400 transition-transform ${
                                                    selectedTask?.id === task.id ? 'rotate-180' : ''
                                                  }`}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Task Details (Expanded) */}
                                          {selectedTask?.id === task.id && (
                                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600">
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                  <h6 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h6>
                                                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                    {task.description || "No description provided."}
                                                  </p>
                                                </div>
                                                <div className="space-y-3">
                                                  {task.dueDate && (
                                                    <div className="flex items-center gap-2">
                                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                      </svg>
                                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center gap-2">
                                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                      </svg>
                                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        Assigned to: {task.assignedTo}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.createdAt && (
                                                    <div className="flex items-center gap-2">
                                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                      </svg>
                                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        Created: {new Date(task.createdAt).toLocaleDateString()}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="mt-4 flex gap-2">
                                                <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                                                  Edit Task
                                                </button>
                                                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                                                  Mark Complete
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8">
                                      <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      <p className="text-slate-500 dark:text-slate-400 mb-3">
                                        No tasks found in this project.
                                      </p>
                                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                        Create First Task
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Projects Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                          This workspace doesn't have any projects. Get started by creating one.
                        </p>
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create First Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}