"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

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
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Fetch data
      fetchDashboardData(parsedUser);
    } catch (err) {
      console.error("Error parsing user data:", err);
      router.push("/login");
    }

    // Check if dark mode preference exists in local storage
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, [router]);

  useEffect(() => {
    // Save dark mode preference to local storage
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const fetchDashboardData = async (currentUser: User) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all workspaces
      const workspacesResponse = await getAllWorkspaces();
      const workspacesData = workspacesResponse.data || [];
      console.log("Workspaces fetched:", workspacesData);

      const allProjectsData: Project[] = [];
      const allTasksData: Task[] = [];

      // For each workspace, fetch its projects and tasks
      for (const workspace of workspacesData) {
        try {
          // Fetch projects for this workspace
          const projectsResponse = await getWorkspaceProjects(workspace.id);
          const workspaceProjects = projectsResponse.data || [];
          console.log(
            `Projects for workspace ${workspace.id}:`,
            workspaceProjects
          );

          // Add workspace info to each project
          const projectsWithWorkspace = workspaceProjects.map(
            (project: any) => ({
              ...project,
              workspace: {
                id: workspace.id,
                name: workspace.name,
              },
            })
          );

          allProjectsData.push(...projectsWithWorkspace);

          // For each project, fetch its tasks
          for (const project of workspaceProjects) {
            try {
              const tasksResponse = await getProjectTasks(
                workspace.id,
                project.id
              );
              const projectTasks = tasksResponse.data || [];
              console.log(`Tasks for project ${project.id}:`, projectTasks);

              // Add project and workspace info to each task
              const tasksWithProjectInfo = projectTasks.map((task: any) => ({
                ...task,
                project: {
                  id: project.id,
                  name: project.name,
                  workspace: {
                    id: workspace.id,
                    name: workspace.name,
                  },
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

      // Update state with fetched data
      setWorkspaces(workspacesData);
      setAllProjects(allProjectsData);
      setAllTasks(allTasksData);

      console.log("All data loaded:", {
        workspaces: workspacesData.length,
        projects: allProjectsData.length,
        tasks: allTasksData.length,
      });

      // Debug: Log task assignees to understand data structure
      console.log(
        "Task assignees debug:",
        allTasksData.map((task) => ({
          taskId: task.id,
          title: task.title,
          assignee: task.assignee,
          assigneeId: task.assignee?.id,
          currentUserId: currentUser.id,
        }))
      );

      // Calculate notification count (pending tasks + upcoming deadlines)
      const pendingTasks = getPendingTasks(allTasksData, currentUser);
      const upcomingDeadlines = getUpcomingDeadlines(allTasksData, currentUser);

      console.log("Notification calculation:", {
        pendingTasks: pendingTasks.length,
        upcomingDeadlines: upcomingDeadlines.length,
        total: pendingTasks.length + upcomingDeadlines.length,
      });

      setNotificationCount(pendingTasks.length + upcomingDeadlines.length);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get pending tasks
  const getPendingTasks = (tasks: Task[], currentUser: User) => {
    return tasks.filter((task) => {
      // Check multiple ways the assignee might be stored
      const assigneeId = task.assignee?.id || (task as any).assigneeId;
      const isAssigned = assigneeId === currentUser.id;
      const isNotCompleted = task.status !== "completed";

      console.log("Pending task check:", {
        taskId: task.id,
        title: task.title,
        assigneeId,
        currentUserId: currentUser.id,
        isAssigned,
        status: task.status,
        isNotCompleted,
      });

      return isAssigned && isNotCompleted;
    });
  };

  // Get recent tasks (tasks assigned to current user, sorted by most recent)
  const getRecentTasks = () => {
    if (!user) return [];

    return allTasks
      .filter((task) => {
        // Check if user has access to this task through workspace/project membership
        const workspace = workspaces.find(
          (ws) => ws.id === task.project.workspace.id
        );
        if (!workspace) return false;

        const isWorkspaceOwner = workspace.owner.id === user.id;
        const isWorkspaceMember = workspace.members?.some(
          (member) => member.id === user.id
        );

        // User has access if they own the workspace or are a member
        return isWorkspaceOwner || isWorkspaceMember;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5); // Show more recent tasks since we're not filtering by assignee
  };

  // Get projects in progress for the user
  const getProjectsInProgress = () => {
    if (!user) return [];

    return allProjects
      .filter((project) => {
        // Check if user is a member or owner of the workspace, and project is active
        const workspace = workspaces.find(
          (ws) => ws.id === project.workspace.id
        );
        if (!workspace) return false;

        const isMember = project.members?.some(
          (member) => member.id === user.id
        );
        const isWorkspaceOwner = workspace.owner.id === user.id;
        const isWorkspaceMember = workspace.members?.some(
          (member) => member.id === user.id
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

  // Get upcoming deadlines (tasks with due dates approaching)
  const getUpcomingDeadlines = (tasks = allTasks, currentUser = user) => {
    if (!currentUser) return [];

    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    return tasks
      .filter((task) => {
        if (!task.dueDate || task.status === "completed") return false;

        const dueDate = new Date(task.dueDate);
        if (!(dueDate >= today && dueDate <= twoWeeksFromNow)) return false;

        // Check if user has access to this task through workspace/project membership
        const workspace = workspaces.find(
          (ws) => ws.id === task.project.workspace.id
        );
        if (!workspace) return false;

        const isWorkspaceOwner = workspace.owner.id === currentUser.id;
        const isWorkspaceMember = workspace.members?.some(
          (member) => member.id === currentUser.id
        );

        return isWorkspaceOwner || isWorkspaceMember;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      )
      .slice(0, 5); // Show more upcoming deadlines
  };

  const getUserAccessibleTasksCount = () => {
    if (!user) return 0;
    
    return allTasks.filter(task => {
      const workspace = workspaces.find(ws => ws.id === task.project.workspace.id);
      if (!workspace) return false;
      
      const isWorkspaceOwner = workspace.owner.id === user.id;
      const isWorkspaceMember = workspace.members?.some(member => member.id === user.id);
      
      return isWorkspaceOwner || isWorkspaceMember;
    }).length;
  };
  const calculateNotificationCount = (allTasksData: Task[], currentUser: User) => {
    // Get all incomplete tasks the user has access to
    const incompleteTasks = allTasksData.filter(task => {
      if (task.status === "completed") return false;
      
      const workspace = workspaces.find(ws => ws.id === task.project.workspace.id);
      if (!workspace) return false;
      
      const isWorkspaceOwner = workspace.owner.id === currentUser.id;
      const isWorkspaceMember = workspace.members?.some(member => member.id === currentUser.id);
      
      return isWorkspaceOwner || isWorkspaceMember;
    });
  }

  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Map backend status to display status
  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      completed: "Completed",
    };
    return statusMap[status] || status;
  };

  // Map backend priority to display priority
  const getPriorityDisplay = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };
    return priorityMap[priority] || priority;
  };

  // Get user's assigned tasks count
  const getUserAssignedTasksCount = () => {
    if (!user) return 0;
    return allTasks.filter((task) => {
      const assigneeId = task.assignee?.id || (task as any).assigneeId;
      return assigneeId === user.id;
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
      {/* Sidebar Component */}
      <Sidebar
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
      />

      {/* Main content area */}
      <div
        className={`flex-1 ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        } transition-all duration-300`}
      >
        {/* Topbar Component */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={user}
        />

        {/* Main dashboard content */}
        <main className="p-6">
          <div
            className={`mb-6 p-6 rounded-xl ${
              darkMode
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white/80 border border-slate-200/50"
            } backdrop-blur-sm shadow-md`}
          >
            <h2 className="text-xl font-bold mb-4">
              Welcome back, {user?.name}
            </h2>
            <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
              Start managing your projects and tasks efficiently!
            </p>
            <div className="mt-4 flex gap-6 text-sm">
              <div
                className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                <span className="font-medium">{workspaces.length}</span>{" "}
                Workspaces
              </div>
              <div
                className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                <span className="font-medium">{allProjects.length}</span>{" "}
                Projects
              </div>
              <div
                className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                <span className="font-medium">
                  {getUserAssignedTasksCount()}
                </span>{" "}
                Assigned Tasks
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
                onClick={() => user && fetchDashboardData(user)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent Tasks Card */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
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

                <div className="space-y-3">
                  {getRecentTasks().length > 0 ? (
                    getRecentTasks().map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg ${
                          darkMode
                            ? "bg-slate-700/50 hover:bg-slate-700/70"
                            : "bg-slate-50 hover:bg-slate-100"
                        } cursor-pointer transition-colors`}
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
                      className={`h-32 flex items-center justify-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No recent tasks found.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Projects Card */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
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

                <div className="space-y-3">
                  {getProjectsInProgress().length > 0 ? (
                    getProjectsInProgress().map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-lg ${
                          darkMode
                            ? "bg-slate-700/50 hover:bg-slate-700/70"
                            : "bg-slate-50 hover:bg-slate-100"
                        } cursor-pointer transition-colors`}
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
                      className={`h-32 flex items-center justify-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      No active projects.
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines Card */}
              <div
                className={`p-6 rounded-xl ${
                  darkMode
                    ? "bg-slate-800/50 border border-slate-700/50"
                    : "bg-white/80 border border-slate-200/50"
                } backdrop-blur-sm shadow-md`}
              >
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
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

                <div className="space-y-3">
                  {getUpcomingDeadlines().length > 0 ? (
                    getUpcomingDeadlines().map((task) => {
                      // Calculate days remaining
                      const today = new Date();
                      const deadline = new Date(task.dueDate!);

                      // Reset time to start of day for accurate calculation
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
                          } cursor-pointer transition-colors`}
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
                      className={`h-32 flex items-center justify-center ${
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
      <Toaster position="top-right" />
    </div>
  );
}
