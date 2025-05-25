"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  List,
  BarChart2,
  Users,
  Calendar,
  Activity,
  TrendingUp,
  PlusCircle,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getAllWorkspaces } from "@/services/Workspace.service";
import { getWorkspaceProjects } from "@/services/Project.service";
import toast from "react-hot-toast";

// Updated interface to match backend entity
interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  createdAt: string;
  status: "active" | "archived" | "completed";
  workspace: {
    id: string;
    name: string;
  };
  members?: User[];
  priority?: "low" | "medium" | "high";
  progress?: number;
}

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
  description?: string;
}

interface StatusData {
  name: string;
  count: number;
  color: string;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

// Dashboard summary card component
const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <div
      className="p-6 rounded-lg shadow-md bg-white dark:bg-slate-800 border-l-4 border-t-0 border-r-0 border-b-0 flex justify-between items-center hover:shadow-lg transition-shadow"
      style={{ borderLeftColor: color }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-full flex-shrink-0 ml-4"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Chart data
  const [statusData, setStatusData] = useState<StatusData[]>([]);

  // Load user data and fetch projects on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        fetchAllProjects();
      } else {
        router.push("/login");
        return;
      }

      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle("dark", savedDarkMode);
    }
  }, [router]);

  // Process data for charts when projects change
  useEffect(() => {
    if (projects.length > 0) {
      processChartData();
    }
  }, [projects]);

  const fetchAllProjects = async () => {
    setIsLoading(true);
    setError("");
    try {
      // First, get all workspaces
      const workspacesResponse = await getAllWorkspaces();
      
      if (!workspacesResponse.data || !Array.isArray(workspacesResponse.data)) {
        throw new Error("No workspaces found");
      }

      setWorkspaces(workspacesResponse.data);
      
      // Then fetch projects from all workspaces
      const allProjects: Project[] = [];
      
      for (const workspace of workspacesResponse.data) {
        try {
          const projectsResponse = await getWorkspaceProjects(workspace.id);
          
          if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
            // Add workspace info to each project
            const workspaceProjects = projectsResponse.data.map((project: Project) => ({
              ...project,
              workspace: {
                id: workspace.id,
                name: workspace.name
              }
            }));
            allProjects.push(...workspaceProjects);
          } else if (projectsResponse.data && projectsResponse.data.projects) {
            // Handle case where projects are nested
            const workspaceProjects = projectsResponse.data.projects.map((project: Project) => ({
              ...project,
              workspace: {
                id: workspace.id,
                name: workspace.name
              }
            }));
            allProjects.push(...workspaceProjects);
          }
        } catch (workspaceError: any) {
          console.warn(`Failed to fetch projects for workspace ${workspace.name}:`, workspaceError);
          // Continue with other workspaces even if one fails
        }
      }
      
      setProjects(allProjects);
      
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to fetch projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = () => {
    // Process status data for pie chart
    const statusCounts: Record<string, number> = {
      Active: 0,
      Completed: 0,
      Archived: 0,
    };

    projects.forEach((project) => {
      const status =
        project.status.charAt(0).toUpperCase() + project.status.slice(1);
      if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
        statusCounts[status]++;
      }
    });

    const colors = {
      Active: "#3b82f6",
      Completed: "#10b981",
      Archived: "#6b7280",
    };

    const chartData: StatusData[] = Object.keys(statusCounts).map((status) => ({
      name: status,
      count: statusCounts[status],
      color: colors[status as keyof typeof colors],
    }));

    setStatusData(chartData);
  };

  // Calculate project due soon (within 7 days)
  const getProjectsDueSoon = (): number => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return projects.filter((project) => {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      return (
        deadline >= today &&
        deadline <= nextWeek &&
        project.status !== "completed"
      );
    }).length;
  };

  const getOverdueProjects = (): number => {
    const today = new Date();
    return projects.filter((project) => {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      return deadline < today && project.status !== "completed";
    }).length;
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { class: "bg-green-100 text-green-800", label: "Completed" };
      case "active":
        return { class: "bg-blue-100 text-blue-800", label: "Active" };
      case "archived":
        return { class: "bg-gray-100 text-gray-800", label: "Archived" };
      default:
        return { class: "bg-gray-100 text-gray-800", label: "Unknown" };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "high":
        return { class: "bg-red-100 text-red-800", label: "High" };
      case "medium":
        return { class: "bg-yellow-100 text-yellow-800", label: "Medium" };
      case "low":
        return { class: "bg-green-100 text-green-800", label: "Low" };
      default:
        return { class: "bg-gray-100 text-gray-800", label: "Normal" };
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden transition-all duration-500 ${
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
        className={`flex-1 flex flex-col ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        } transition-all duration-300 overflow-hidden`}
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

        {/* Page content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-6 flex-1 flex flex-col overflow-hidden">
            {/* Page header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold truncate">Project Dashboard</h1>
                <p
                  className={`mt-1 truncate ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Overview of all your projects and activities across workspaces
                </p>
              </div>
              <button
                onClick={() => router.push("/project-list")}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex-shrink-0 ml-4"
              >
                <List size={16} className="mr-2" />
                View All Projects
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex-shrink-0">
                <p>{error}</p>
                <button
                  onClick={fetchAllProjects}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 flex-shrink-0">
                  <SummaryCard
                    title="Total Projects"
                    value={projects.length}
                    icon={<Layers size={24} color="#3b82f6" />}
                    color="#3b82f6"
                    subtitle={`Across ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
                  />
                  <SummaryCard
                    title="Active Projects"
                    value={projects.filter((p) => p.status === "active").length}
                    icon={<Activity size={24} color="#10b981" />}
                    color="#10b981"
                    subtitle="In progress"
                  />
                  <SummaryCard
                    title="Due Soon"
                    value={getProjectsDueSoon()}
                    icon={<Clock size={24} color="#f59e0b" />}
                    color="#f59e0b"
                    subtitle="Next 7 days"
                  />
                  <SummaryCard
                    title="Overdue"
                    value={getOverdueProjects()}
                    icon={<AlertCircle size={24} color="#ef4444" />}
                    color="#ef4444"
                    subtitle="Past deadline"
                  />
                </div>

                {/* Charts and Projects row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                  {/* Project Status Chart */}
                  <div
                    className={`p-6 rounded-lg shadow-md ${
                      darkMode ? "bg-slate-800" : "bg-white"
                    } flex flex-col overflow-hidden`}
                  >
                    <h2 className="text-lg font-semibold mb-4 flex items-center flex-shrink-0">
                      <BarChart2 className="mr-2" size={20} />
                      Project Status Distribution
                    </h2>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                              color: darkMode ? "#ffffff" : "#000000",
                              border: `1px solid ${
                                darkMode ? "#374151" : "#e5e7eb"
                              }`,
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Projects */}
                  <div
                    className={`p-6 rounded-lg shadow-md ${
                      darkMode ? "bg-slate-800" : "bg-white"
                    } flex flex-col overflow-hidden`}
                  >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h2 className="text-lg font-semibold flex items-center">
                        <List className="mr-2" size={20} />
                        Recent Projects
                      </h2>
                      <button
                        onClick={() => router.push("/project-list")}
                        className={`text-sm flex items-center flex-shrink-0 ${
                          darkMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        View all
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {projects.slice(0, 10).map((project) => {
                          const statusInfo = getStatusInfo(project.status);
                          const priorityInfo = getPriorityInfo(
                            project.priority || "normal"
                          );
                          return (
                            <div
                              key={project.id}
                              className={`p-3 rounded-lg ${
                                darkMode
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-slate-50 hover:bg-slate-100"
                              } transition-colors cursor-pointer`}
                              onClick={() =>
                                router.push(`/project/${project.id}`)
                              }
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm truncate">
                                    {project.name}
                                  </h3>
                                  <p
                                    className={`text-xs mt-1 line-clamp-2 ${
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {project.workspace?.name && (
                                      <span className="font-medium">
                                        {project.workspace.name} •{" "}
                                      </span>
                                    )}
                                    {project.description || "No description"}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusInfo.class}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${priorityInfo.class}`}
                                  >
                                    {priorityInfo.label}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex justify-between text-xs">
                                <span
                                  className={`truncate ${
                                    darkMode ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  {project.deadline
                                    ? `Due: ${new Date(
                                        project.deadline
                                      ).toLocaleDateString()}`
                                    : "No deadline"}
                                </span>
                                <span
                                  className={`flex-shrink-0 ml-2 ${
                                    darkMode ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {projects.length === 0 && !error && (
                          <div className="text-center py-8">
                            <p
                              className={`mb-2 ${
                                darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              No projects found
                            </p>
                            <button
                              onClick={() => router.push("/projects/new")}
                              className="flex items-center mx-auto mt-2 text-blue-600 hover:text-blue-700"
                            >
                              <PlusCircle size={16} className="mr-1" />
                              Create a project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}