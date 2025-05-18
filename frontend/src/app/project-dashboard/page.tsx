"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { List, BarChart2, Users, Calendar, Activity, TrendingUp, PlusCircle, Layers } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface Project {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  targetDate: string;
  createdBy: string;
  createdAt: string;
  status: string;
}

interface Workspace {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin?: string;
}

interface StatusData {
  name: string;
  count: number;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

// Dashboard summary card component
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="p-6 rounded-lg shadow-md bg-white dark:bg-slate-800 border-l-4 border-t-0 border-r-0 border-b-0 flex justify-between items-center" style={{ borderLeftColor: color }}>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
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
  
  // Chart data for project status
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  
  // Load user data and fetch workspaces and projects on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push("/login");
        return;
      }
      
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle("dark", savedDarkMode);
      
      // Fetch data
      fetchWorkspaces();
      fetchProjects();
    }
  }, [router]);
  
  // Process data for charts when projects change
  useEffect(() => {
    if (projects.length > 0) {
      processChartData();
    }
  }, [projects]);
  
  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('http://localhost:3001/workspaces');
      
      if (!response.ok) {
        throw new Error(`Error fetching workspaces: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkspaces(data);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/projects');
      
      if (!response.ok) {
        throw new Error(`Error fetching projects: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processChartData = () => {
    // Process status data for chart
    const statusCounts: Record<string, number> = {
      "Not Started": 0,
      "In Progress": 0,
      "Completed": 0,
      "On Hold": 0
    };
    
    projects.forEach(project => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, project.status)) {
        statusCounts[project.status]++;
      }
    });
    
    const chartData: StatusData[] = Object.keys(statusCounts).map(status => ({
      name: status,
      count: statusCounts[status]
    }));
    
    setStatusData(chartData);
  };
  
  // Calculate project due soon (within 7 days)
  const getProjectsDueSoon = (): number => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return projects.filter(project => {
      const targetDate = new Date(project.targetDate);
      return targetDate >= today && targetDate <= nextWeek && project.status !== "Completed";
    }).length;
  };
  
  const navigateToProjects = () => {
    router.push("/project-list");
  };
  
  // Calculate completion rate
  const getCompletionRate = (): string => {
    if (projects.length === 0) return "0%";
    const completed = projects.filter(p => p.status === "Completed").length;
    return Math.round((completed / projects.length) * 100) + "%";
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
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300 overflow-hidden`}>
        {/* Topbar Component */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          notificationCount={notificationCount}
          user={user}
        />
        
        {/* Page content - No overflow-y-auto here to make it static */}
        <div className="px-6 py-6 h-[calc(100vh-64px)]">
          {/* Page header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Project Dashboard</h1>
            <button 
              onClick={navigateToProjects}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <List size={16} className="mr-2" />
              View Projects
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard 
                  title="Total Projects" 
                  value={projects.length} 
                  icon={<Layers size={20} color="#3b82f6" />} 
                  color="#3b82f6" 
                />
                <SummaryCard 
                  title="Workspaces" 
                  value={workspaces.length} 
                  icon={<Users size={20} color="#10b981" />} 
                  color="#10b981" 
                />
                <SummaryCard 
                  title="Due Soon" 
                  value={getProjectsDueSoon()} 
                  icon={<Calendar size={20} color="#f59e0b" />} 
                  color="#f59e0b" 
                />
                <SummaryCard 
                  title="Completion Rate" 
                  value={getCompletionRate()} 
                  icon={<Activity size={20} color="#ef4444" />} 
                  color="#ef4444" 
                />
              </div>
              
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status Chart */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <h2 className="text-lg font-semibold mb-4">Project Status</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={statusData} 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis dataKey="name" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                        <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                            color: darkMode ? "#ffffff" : "#000000",
                            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`
                          }} 
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Number of Projects" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Recent Activity - Only this panel is scrollable */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Projects</h2>
                    <button 
                      onClick={navigateToProjects}
                      className={`text-sm flex items-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                      View all
                    </button>
                  </div>
                  
                  {/* This div is scrollable with a fixed height */}
                  <div className="h-80 overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div 
                          key={project.id} 
                          className={`p-3 rounded-lg ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"} transition-colors cursor-pointer`}
                          onClick={() => router.push(`/project/${project.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{project.title}</h3>
                              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {project.description?.substring(0, 80) || "No description"}
                                {project.description?.length > 80 ? "..." : ""}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              project.status === "Completed" ? "bg-green-100 text-green-800" :
                              project.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              project.status === "On Hold" ? "bg-amber-100 text-amber-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Target: {new Date(project.targetDate).toLocaleDateString()}
                            </span>
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Created: {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {projects.length === 0 && (
                        <div className="text-center py-8">
                          <p className={`mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No projects found</p>
                          <button 
                            onClick={() => router.push("/project")} 
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}