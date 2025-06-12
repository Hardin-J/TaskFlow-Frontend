"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { jwtDecode } from "jwt-decode"; // Import jwt-decode

// Import your backend services
import { getAllWorkspaces } from "../../services/Workspace.service";
import { getWorkspaceProjects } from "../../services/Project.service";
import { getProjectTasks } from "../../services/Task.service";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  lastLogin?: string;
}

// Interface for the expected JWT payload (customize as needed)
interface DecodedJwtPayload {
  id?: string;
  sub?: string; // Standard subject claim, often used for user ID
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  role?: string;
  // Add other claims you expect, like iat, exp
  [key: string]: any; // Allow other properties
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  assignee?: User;
  createdBy: User;
  project: {
    id: string;
    name: string;
    workspace: {
      id: string;
      name: string;
    };
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "archived" | "completed";
  deadline?: string;
  createdAt: string;
  workspace: {
    id: string;
    name: string;
  };
  members?: User[];
  tasks?: Task[];
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: string;
  owner: User;
  members?: User[];
  projects?: Project[];
}

export default function Dashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserString = localStorage.getItem("user");

    if (!token) {
      // No token, redirect to login
      // toast.error("Authentication required. Please log in."); // Optional: show toast
      router.push("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode<DecodedJwtPayload>(token);

      let baseUser: Partial<User> = {};
      if (storedUserString) {
        try {
          baseUser = JSON.parse(storedUserString);
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
          // Potentially corrupted stored user data, proceed with token data primarily
        }
      }

      // Construct the user object
      // Prioritize token for name, then ID and email.
      // Fallback to storedUserString or defaults.
      const userNameFromToken =
        decodedToken.name ||
        decodedToken.preferred_username ||
        decodedToken.given_name;
      const userEmailFromTokenOrStorage = decodedToken.email || baseUser.email;

      const finalName =
        userNameFromToken ||
        (userEmailFromTokenOrStorage
          ? userEmailFromTokenOrStorage.split("@")[0]
          : "User");

      const currentUser: User = {
        id: String(
          decodedToken.id || decodedToken.sub || baseUser.id || "unknown-id"
        ),
        email: userEmailFromTokenOrStorage || "unknown-email",
        name: finalName,
        role: decodedToken.role || baseUser.role,
        department: baseUser.department, // These are less likely in token
        lastLogin: baseUser.lastLogin, // These are less likely in token
      };

      // Validate essential fields
      if (
        currentUser.id === "unknown-id" ||
        currentUser.email === "unknown-email"
      ) {
        console.error(
          "Critical user information (ID or email) missing from token and storage."
        );
        toast.error("User identification failed. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setUser(currentUser);
      fetchDashboardData(currentUser);
    } catch (err) {
      console.error("Error decoding token or processing user data:", err);
      toast.error("Session invalid or expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Clear potentially problematic stored user
      router.push("/login");
      return; // Important to return after redirect
    }

    // Dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, [router]); // router is the main dependency here

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const fetchDashboardData = async (currentUser: User) => {
    // ... (rest of the function remains the same)
    setIsLoading(true);
    setError(null);

    try {
      const workspacesResponse = await getAllWorkspaces();
      const workspacesData = workspacesResponse.data || [];
      const allProjectsData: Project[] = [];
      const allTasksData: Task[] = [];

      for (const workspace of workspacesData) {
        try {
          const projectsResponse = await getWorkspaceProjects(workspace.id);
          const workspaceProjects = projectsResponse.data || [];
          const projectsWithWorkspace = workspaceProjects.map(
            (project: any) => ({
              ...project,
              workspace: { id: workspace.id, name: workspace.name },
            })
          );
          allProjectsData.push(...projectsWithWorkspace);

          for (const project of workspaceProjects) {
            try {
              const tasksResponse = await getProjectTasks(
                workspace.id,
                project.id
              );
              const projectTasks = tasksResponse.data || [];
              const tasksWithProjectInfo = projectTasks.map((task: any) => ({
                ...task,
                project: {
                  id: project.id,
                  name: project.name,
                  workspace: { id: workspace.id, name: workspace.name },
                },
              }));
              allTasksData.push(...tasksWithProjectInfo);
            } catch (taskError) {
              console.warn(
                `Failed to fetch tasks for project ${project.id}:`,
                taskError
              );
            }
          }
        } catch (projectError) {
          console.warn(
            `Failed to fetch projects for workspace ${workspace.id}:`,
            projectError
          );
        }
      }

      setWorkspaces(workspacesData);
      setAllProjects(allProjectsData);
      setAllTasks(allTasksData);

      const pendingTasks = getPendingTasks(allTasksData, currentUser);
      const upcomingDeadlines = getUpcomingDeadlines(
        allTasksData,
        currentUser,
        workspacesData
      );

      setNotificationCount(pendingTasks.length + upcomingDeadlines.length);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (rest of your helper functions: getPendingTasks, getRecentTasks, etc.)

  const getPendingTasks = (tasks: Task[], currentUser: User) => {
    return tasks.filter((task) => {
      const assigneeId = task.assignee?.id || (task as any).assigneeId;
      return (
        String(assigneeId) === String(currentUser.id) &&
        task.status !== "completed"
      ); // Ensure ID comparison is robust
    });
  };

  const getRecentTasks = () => {
    if (!user) return [];
    return allTasks
      .filter((task) => {
        const workspace = workspaces.find(
          (ws) => ws.id === task.project.workspace.id
        );
        if (!workspace) return false;
        const isWorkspaceOwner = String(workspace.owner.id) === String(user.id);
        const isWorkspaceMember = workspace.members?.some(
          (member) => String(member.id) === String(user.id)
        );
        return isWorkspaceOwner || isWorkspaceMember;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  };

  const getProjectsInProgress = () => {
    if (!user) return [];
    return allProjects
      .filter((project) => {
        const workspace = workspaces.find(
          (ws) => ws.id === project.workspace.id
        );
        if (!workspace) return false;
        const isMember = project.members?.some(
          (member) => String(member.id) === String(user.id)
        );
        const isWorkspaceOwner = String(workspace.owner.id) === String(user.id);
        const isWorkspaceMember = workspace.members?.some(
          (member) => String(member.id) === String(user.id)
        );
        return (
          (isMember || isWorkspaceOwner || isWorkspaceMember) &&
          project.status === "active"
        );
      })
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 3);
  };

  const getUpcomingDeadlines = (
    tasks = allTasks,
    currentUser = user,
    currentWorkspaces = workspaces
  ) => {
    if (!currentUser) return [];
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    return tasks
      .filter((task) => {
        if (!task.dueDate || task.status === "completed") return false;
        const dueDate = new Date(task.dueDate);
        if (!(dueDate >= today && dueDate <= twoWeeksFromNow)) return false;

        const workspace = currentWorkspaces.find(
          (ws) => ws.id === task.project.workspace.id
        );
        if (!workspace) return false;
        const isWorkspaceOwner =
          String(workspace.owner.id) === String(currentUser.id);
        const isWorkspaceMember = workspace.members?.some(
          (member) => String(member.id) === String(currentUser.id)
        );
        return isWorkspaceOwner || isWorkspaceMember;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      )
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      completed: "Completed",
    };
    return statusMap[status] || status;
  };

  const getPriorityDisplay = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };
    return priorityMap[priority] || priority;
  };

  const getUserAssignedTasksCount = () => {
    if (!user) return 0;
    return allTasks.filter((task) => {
      const assigneeId = task.assignee?.id || (task as any).assigneeId;
      return String(assigneeId) === String(user.id);
    }).length;
  };

  return (
    <div
      className={`flex h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900 text-white"
          : "bg-gradient-to-br from-sky-50 via-white to-blue-50 text-gray-900"
      }`}
    >
      <Sidebar
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
      />
      <div
        className={`flex-1 flex flex-col ${
          sidebarCollapsed ? "ml-20" : "ml-72"
        } transition-all duration-300 overflow-hidden`}
      >
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={user}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Welcome message card */}
          <div
            className={`mb-6 p-6 rounded-xl ${
              darkMode
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white/80 border border-slate-200/50"
            } backdrop-blur-sm shadow-lg`}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-6 md:mb-0">
                <h5 className="text-2xl lg:text-3xl font-bold">
                  {/* Display name from user state, which is now sourced from token */}
                  Welcome back, {user?.name || "User"}
                </h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full md:w-auto md:max-w-md lg:max-w-lg xl:max-w-xl">
                <div
                  className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
                    darkMode
                      ? "bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50"
                      : "bg-sky-100/70 hover:bg-sky-200/90 border border-sky-200/80"
                  } transition-all duration-200`}
                >
                  <span
                    className={`text-3xl font-bold ${
                      darkMode ? "text-sky-400" : "text-sky-600"
                    }`}
                  >
                    {workspaces.length}
                  </span>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      darkMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Workspaces
                  </span>
                </div>
                <div
                  className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
                    darkMode
                      ? "bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50"
                      : "bg-teal-100/70 hover:bg-teal-200/90 border border-teal-200/80"
                  } transition-all duration-200`}
                >
                  <span
                    className={`text-3xl font-bold ${
                      darkMode ? "text-teal-400" : "text-teal-600"
                    }`}
                  >
                    {allProjects.length}
                  </span>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      darkMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Total Projects
                  </span>
                </div>
                <div
                  className={`p-4 rounded-lg flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-1 ${
                    darkMode
                      ? "bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50"
                      : "bg-amber-100/70 hover:bg-amber-200/90 border border-amber-200/80"
                  } transition-all duration-200`}
                >
                  <span
                    className={`text-3xl font-bold ${
                      darkMode ? "text-amber-400" : "text-amber-500"
                    }`}
                  >
                    {getUserAssignedTasksCount()}
                  </span>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      darkMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Assigned Tasks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div
                className={`animate-spin rounded-full h-12 w-12 border-4 ${
                  darkMode
                    ? "border-slate-300 border-t-slate-700"
                    : "border-slate-200 border-t-slate-500"
                }`}
              ></div>
            </div>
          ) : error ? (
            <div
              className={`p-6 rounded-xl text-center ${
                darkMode
                  ? "bg-red-900/30 border border-red-800/50 text-red-200"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p>{error}</p>
              <button
                // onClick={() => user && fetchDashboardData(user)} // This line might cause issues if user is null briefly.
                onClick={() => {
                  // Safer click handler
                  const localUser = user; // Capture current user state
                  if (localUser) {
                    fetchDashboardData(localUser);
                  } else {
                    router.push("/login"); // Or handle appropriately
                  }
                }}
                className={`mt-4 px-4 py-2 rounded-md ${
                  darkMode
                    ? "bg-red-800 hover:bg-red-700 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                Retry
              </button>
            </div>
          ) : (
            // ... (rest of your dashboard cards: Recent Tasks, Active Projects, Upcoming Deadlines)
            // These should remain unchanged in structure from the previous good version.
            // Ensure they still use h-[26rem] for their height.
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent Tasks Card (height h-[26rem]) */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md h-[26rem] flex flex-col`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center flex-shrink-0">
                  <span>Recent Tasks</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getRecentTasks().length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {getRecentTasks().length > 0 ? (
                    getRecentTasks().map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg ${
                          darkMode
                            ? "bg-slate-700/50 hover:bg-slate-700/70"
                            : "bg-slate-50 hover:bg-slate-100"
                        } cursor-pointer transition-colors flex-shrink-0`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === "high"
                                ? darkMode
                                  ? "bg-red-900/70 text-red-200"
                                  : "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? darkMode
                                  ? "bg-amber-900/70 text-amber-200"
                                  : "bg-amber-100 text-amber-800"
                                : darkMode
                                ? "bg-blue-900/70 text-blue-200"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getPriorityDisplay(task.priority)}
                          </span>
                        </div>
                        {task.dueDate && (
                          <p
                            className={`text-xs mt-1 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                        <div
                          className={`text-xs mt-2 flex items-center justify-between ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          <div className="flex items-center">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                task.status === "in_progress"
                                  ? "bg-blue-500"
                                  : task.status === "completed"
                                  ? "bg-green-500"
                                  : task.status === "in_review"
                                  ? "bg-purple-500"
                                  : "bg-gray-500"
                              }`}
                            ></span>
                            {getStatusDisplay(task.status)}
                          </div>
                          <div className="text-xs">{task.project.name}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`flex-1 flex items-center justify-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No recent tasks found.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Projects Card (height h-[26rem]) */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md h-[26rem] flex flex-col`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center flex-shrink-0">
                  <span>Active Projects</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getProjectsInProgress().length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {getProjectsInProgress().length > 0 ? (
                    getProjectsInProgress().map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-lg ${
                          darkMode
                            ? "bg-slate-700/50 hover:bg-slate-700/70"
                            : "bg-slate-50 hover:bg-slate-100"
                        } cursor-pointer transition-colors flex-shrink-0`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">
                            {project.name}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              project.status === "active"
                                ? darkMode
                                  ? "bg-green-900/70 text-green-200"
                                  : "bg-green-100 text-green-800"
                                : darkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        {project.description && (
                          <p
                            className={`text-xs mt-1 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                        <div
                          className={`text-xs mt-2 flex justify-between items-center ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          <div>{project.workspace.name}</div>
                          {project.deadline && (
                            <div>Due: {formatDate(project.deadline)}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`flex-1 flex items-center justify-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No active projects.
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines Card (height h-[26rem]) */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md h-[26rem] flex flex-col`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center flex-shrink-0">
                  <span>Upcoming Deadlines</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getUpcomingDeadlines().length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {getUpcomingDeadlines().length > 0 ? (
                    getUpcomingDeadlines().map((task) => {
                      const today = new Date();
                      const deadline = new Date(task.dueDate!);
                      const todayOnly = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );
                      const deadlineOnly = new Date(
                        deadline.getFullYear(),
                        deadline.getMonth(),
                        deadline.getDate()
                      );
                      const daysRemaining = Math.ceil(
                        (deadlineOnly.getTime() - todayOnly.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg ${
                            darkMode
                              ? "bg-slate-700/50 hover:bg-slate-700/70"
                              : "bg-slate-50 hover:bg-slate-100"
                          } cursor-pointer transition-colors flex-shrink-0`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">
                              {task.title}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                daysRemaining <= 1
                                  ? darkMode
                                    ? "bg-red-900/70 text-red-200"
                                    : "bg-red-100 text-red-800"
                                  : daysRemaining <= 3
                                  ? darkMode
                                    ? "bg-orange-900/70 text-orange-200"
                                    : "bg-orange-100 text-orange-800"
                                  : daysRemaining <= 7
                                  ? darkMode
                                    ? "bg-amber-900/70 text-amber-200"
                                    : "bg-amber-100 text-amber-800"
                                  : darkMode
                                  ? "bg-green-900/70 text-green-200"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {daysRemaining === 0
                                ? "Today"
                                : daysRemaining === 1
                                ? "1 day"
                                : `${daysRemaining} days`}
                            </span>
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Deadline: {formatDate(task.dueDate!)}
                          </p>
                          <div
                            className={`text-xs mt-2 flex items-center justify-between ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  task.status === "in_progress"
                                    ? "bg-blue-500"
                                    : task.status === "completed"
                                    ? "bg-green-500"
                                    : task.status === "in_review"
                                    ? "bg-purple-500"
                                    : "bg-gray-500"
                                }`}
                              ></span>
                              {getStatusDisplay(task.status)}
                            </div>
                            <div>{task.project.name}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className={`flex-1 flex items-center justify-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No upcoming deadlines.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
