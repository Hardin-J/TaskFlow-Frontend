"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { getAllWorkspaces, addNewWorkspaces } from "@/services/Workspace.service";
import { getWorkspaceProjects } from "@/services/Project.service";
import { getTasksByProject } from "@/services/Project.service";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  // Add other relevant task properties
}

interface Project {
  id: string;
  name: string;
  tasks?: Task[];
  // Add other relevant project properties
}

interface Workspace {
  id: string;
  name: string;
  projects?: Project[];
  // Add other relevant workspace properties
}

interface SidebarProps {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  user: User | null;
}

export default function Sidebar({
  darkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  user,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [workspaceTitle, setWorkspaceTitle] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    setIsLoadingWorkspaces(true);
    try {
      const response = await getAllWorkspaces();
      setWorkspaces(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      toast.error("Failed to load workspaces.");
      setWorkspaces([]);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const toggleExpand = async (itemId: string, itemType: "workspace" | "project", workspaceIdForProject?: string) => {
    const isCurrentlyExpanded = !!expandedItems[itemId];
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));

    // Only fetch if expanding AND data hasn't been loaded
    if (!isCurrentlyExpanded) {
      if (itemType === "workspace") {
        const workspaceIndex = workspaces.findIndex(ws => ws.id === itemId);
        if (workspaceIndex !== -1 && !workspaces[workspaceIndex].projects) {
          try {
            const projectsResponse = await getWorkspaceProjects(itemId);
            const projectsData = projectsResponse.data.data || projectsResponse.data || [];
            setWorkspaces(prevWs =>
              prevWs.map(ws =>
                ws.id === itemId ? { ...ws, projects: projectsData } : ws
              )
            );
          } catch (error) {
            console.error(`Failed to fetch projects for workspace ${itemId}:`, error);
            toast.error("Failed to load projects.");
          }
        }
      } else if (itemType === "project" && workspaceIdForProject) {
        const workspaceIndex = workspaces.findIndex(ws => ws.id === workspaceIdForProject);
        if (workspaceIndex !== -1 && workspaces[workspaceIndex].projects) {
          const projectIndex = workspaces[workspaceIndex].projects!.findIndex(p => p.id === itemId);
          if (projectIndex !== -1 && !workspaces[workspaceIndex].projects![projectIndex].tasks) {
            try {
              // Note: Original getTasksByProject might take workspaceId, projectId. Adjust if different.
              const tasksResponse = await getTasksByProject(workspaceIdForProject, itemId);
              const tasksData = tasksResponse.data.data || tasksResponse.data || [];
              setWorkspaces(prevWs =>
                prevWs.map(ws => {
                  if (ws.id === workspaceIdForProject && ws.projects) {
                    return {
                      ...ws,
                      projects: ws.projects.map(p =>
                        p.id === itemId ? { ...p, tasks: tasksData } : p
                      ),
                    };
                  }
                  return ws;
                })
              );
            } catch (error) {
              console.error(`Failed to fetch tasks for project ${itemId}:`, error);
              toast.error("Failed to load tasks.");
            }
          }
        }
      }
    }
  };

  const openCreateWorkspaceModal = () => setShowCreateModal(true);

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
    setIsLoading(true);
    try {
      await addNewWorkspaces({ name: workspaceTitle, description: workspaceDescription });
      toast.success("Workspace created successfully!");
      setWorkspaceTitle("");
      setWorkspaceDescription("");
      setShowCreateModal(false);
      await fetchWorkspaces();
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      toast.error(error.message || "Failed to create workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (path: string) => pathname === path;
  const isPartiallyActive = (path: string) => pathname.startsWith(path);

  const navigateToDashboard = () => router.push("/dashboard");
  const navigateToMyWorks = () => router.push("/works");
  const navigateToWorkspaceDetail = (workspaceId: string) => router.push(`/workspaces/${workspaceId}`);
  const navigateToProjectDetail = (workspaceId: string, projectId: string) => router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
  const navigateToTaskDetail = (workspaceId: string, projectId: string, taskId: string) => router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);

  const renderSidebarContent = () => {
    if (isLoadingWorkspaces) return <div className="p-3 text-sm text-slate-400">Loading workspaces...</div>;
    if (!workspaces || workspaces.length === 0) return <div className="p-3 text-sm text-slate-400">No workspaces found.</div>;

    return workspaces.map((workspace) => (
      <li key={workspace.id} className="my-0.5">
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer ${
            darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
          } ${isPartiallyActive(`/workspaces/${workspace.id}`) ? (darkMode ? "bg-slate-750 text-blue-300" : "bg-blue-50 text-blue-600") : (darkMode ? "text-slate-300" : "text-slate-700")}`}
          onClick={() => navigateToWorkspaceDetail(workspace.id)} // Navigate on click of the entire item
          title={workspace.name}
        >
          <div className="flex items-center overflow-hidden flex-grow"> {/* flex-grow allows text to take space */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
              <path d="M3.5 3A1.5 1.5 0 002 4.5v11A1.5 1.5 0 003.5 17h13a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0016.5 3h-13zM12 7.25a.75.75 0 000 1.5h.25V9h-.25a.75.75 0 000 1.5h.25V11h-.25a.75.75 0 000 1.5h.25v.25a.75.75 0 001.5 0v-.25H14v.25a.75.75 0 001.5 0v-.25H16a.75.75 0 000-1.5h-.5V9.75H16a.75.75 0 000-1.5h-.5V8h.5a.75.75 0 000-1.5h-.5v-.25a.75.75 0 00-1.5 0v.25h-.75v-.25a.75.75 0 00-1.5 0V7.25zM4 7.5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
            </svg>
            {!sidebarCollapsed && <span className="truncate">{workspace.name}</span>}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigation from parent div
                toggleExpand(workspace.id, "workspace");
              }}
              className={`p-1 -mr-1 rounded-md focus:outline-none ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}
              aria-label={expandedItems[workspace.id] ? "Collapse workspace projects" : "Expand workspace projects"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform ${
                  expandedItems[workspace.id] ? "rotate-90" : ""
                }`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
        {!sidebarCollapsed && expandedItems[workspace.id] && workspace.projects && (
          <ul className="pl-4 mt-1 border-l ml-2 border-slate-300 dark:border-slate-700">
            {workspace.projects.length === 0 && <li className="px-3 py-1 text-xs text-slate-400 dark:text-slate-500">No projects</li>}
            {workspace.projects.map((project) => (
              <li key={project.id} className="my-0.5">
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
                  } ${isPartiallyActive(`/workspaces/${workspace.id}/projects/${project.id}`) ? (darkMode ? "bg-slate-700 text-sky-300" : "bg-sky-50 text-sky-600") : (darkMode ? "text-slate-400" : "text-slate-600")}`}
                  onClick={() => navigateToProjectDetail(workspace.id, project.id)} // Navigate on click
                  title={project.name}
                >
                  <div className="flex items-center overflow-hidden flex-grow">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
                        <path fillRule="evenodd" d="M2.25 3.5A1.75 1.75 0 00.5 5.25v9.5A1.75 1.75 0 002.25 16.5h15.5A1.75 1.75 0 0019.5 14.75v-7.5A1.75 1.75 0 0017.75 5.5H9.625a1.75 1.75 0 01-1.528-.886L6.72 2.81A1.75 1.75 0 005.191 2H2.25A1.75 1.75 0 00.5 3.75V5.25z" clipRule="evenodd" />
                     </svg>
                    <span className="truncate">{project.name}</span>
                  </div>
                  <button
                     onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation from parent div
                        toggleExpand(project.id, "project", workspace.id);
                      }}
                    className={`p-0.5 -mr-1 rounded-md focus:outline-none ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}
                    aria-label={expandedItems[project.id] ? "Collapse project tasks" : "Expand project tasks"}
                  >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-3 h-3 transition-transform ${
                        expandedItems[project.id] ? "rotate-90" : ""
                        }`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
                {expandedItems[project.id] && project.tasks && (
                  <ul className="pl-4 mt-1 border-l ml-2 border-slate-300 dark:border-slate-600">
                     {project.tasks.length === 0 && <li className="px-3 py-1 text-xs text-slate-400 dark:text-slate-500">No tasks</li>}
                    {project.tasks.map((task) => (
                      <li key={task.id} className="my-0.5">
                        <div
                          className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer ${
                            darkMode ? "hover:bg-slate-650" : "hover:bg-slate-200/70"
                          } ${isActive(`/workspaces/${workspace.id}/projects/${project.id}/tasks/${task.id}`) ? (darkMode ? "bg-slate-650 text-teal-300" : "bg-teal-50 text-teal-600") : (darkMode ? "text-slate-500" : "text-slate-500")}`}
                          onClick={() => navigateToTaskDetail(workspace.id, project.id, task.id)}
                          title={task.title}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.75 4.5a.75.75 0 0 0 1.188.918l3.75-4.5Z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate text-sm">{task.title}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    ));
  };
  return (
    <>
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } h-full fixed left-0 top-0 flex flex-col ${
          darkMode
            ? "bg-slate-900/90 border-r border-slate-700/50"
            : "bg-white/90 border-r border-slate-200/50"
        } transition-all duration-300 backdrop-blur-md shadow-lg z-20`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-opacity-30 dark:border-slate-700/50 border-slate-200/50 flex-shrink-0">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white" > <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0-4.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm9-4.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0 9a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /> </svg>
            </div>
            {!sidebarCollapsed && (
              <h1 className="ml-3 text-xl font-bold text-slate-800 dark:text-white">TaskFlow</h1>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1 rounded-md text-slate-500 dark:text-slate-400 ${
                darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
              }`}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" > <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /> </svg>
            </button>
          )}
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="flex-grow overflow-y-auto px-3 py-4">
          <nav>
            <ul className="space-y-1">
              <li>
                <a // Changed to <a> for semantic correctness if it's a link
                  onClick={navigateToDashboard}
                  className={`flex items-center px-3 py-3 rounded-lg cursor-pointer ${
                    isActive("/dashboard")
                      ? (darkMode ? "bg-slate-800 text-blue-300" : "bg-blue-50 text-blue-600")
                      : (darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700")
                  } font-medium`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" > <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> </svg>
                  {!sidebarCollapsed && <span className="ml-3">Home</span>}
                </a>
              </li>
              <li>
                 <button // Keeping as button if it's primarily an action triggering client-side navigation
                  onClick={navigateToMyWorks}
                  className={`flex items-center px-3 py-3 rounded-lg w-full text-left ${
                     isActive("/works")
                      ? (darkMode ? "bg-slate-800 text-blue-300" : "bg-blue-50 text-blue-600")
                      : (darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700")
                  } transition-colors`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" > <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /> </svg>
                  {!sidebarCollapsed && <span className="ml-3">My Works</span>}
                </button>
              </li>
              {!sidebarCollapsed && (
                 <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Workspaces
                 </div>
              )}
               {sidebarCollapsed && <hr className="my-2 border-slate-200 dark:border-slate-700" />}
              {renderSidebarContent()}
              {!sidebarCollapsed && (
                 <li>
                    <button
                      onClick={openCreateWorkspaceModal}
                      className={`flex items-center w-full mt-2 px-3 py-2.5 rounded-md text-sm ${
                        darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                      Create Workspace
                    </button>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 flex-shrink-0 border-t dark:border-slate-700/50 border-slate-200/50">
          <button
            onClick={handleLogout}
            title="Logout"
            className={`flex items-center justify-center w-full px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${!sidebarCollapsed ? 'mr-2' : ''}`} > <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /> </svg>
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </div>

      {/* Create Workspace Modal (remains the same) */}
      {showCreateModal && (
         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div
                className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
                darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
                }`}
            >
                <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create New Workspace</h3>
                <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> </svg>
                </button>
                </div>
                <form onSubmit={handleCreateWorkspace}>
                <div className="mb-4">
                    <label htmlFor="title" className={`block mb-2 text-sm font-medium ${ darkMode ? "text-slate-200" : "text-slate-700" }`} > Workspace Title * </label>
                    <input type="text" id="title" value={workspaceTitle} onChange={(e) => setWorkspaceTitle(e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${ darkMode ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500" }`} placeholder="Enter workspace title" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className={`block mb-2 text-sm font-medium ${ darkMode ? "text-slate-200" : "text-slate-700" }`} > Description </label>
                    <textarea id="description" value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${ darkMode ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500" : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500" }`} placeholder="Enter workspace description" rows={3} />
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg ${ darkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300" }`} disabled={isLoading} > Cancel </button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center min-w-[80px]" disabled={isLoading} >
                    {isLoading ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" > <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" ></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" ></path> </svg>
                        Creating...
                        </>
                    ) : ( "Create" )}
                    </button>
                </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
}