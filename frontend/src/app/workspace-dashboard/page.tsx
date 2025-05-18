"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { List, BarChart2, Users, Calendar, Activity, TrendingUp, PlusCircle, Layers } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getAllWorkspaces } from "@/services/Workspace.service";

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  targetDate: string;
  createdBy: string;
  createdAt: string;
  status: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  owner: any;
  createdAt: string;
  members: any[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin?: string;
}

interface MemberCountData {
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

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Chart data for workspace member distribution
  const [memberData, setMemberData] = useState<MemberCountData[]>([]);
  
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
  
  // Process data for charts when workspaces change
  useEffect(() => {
    if (workspaces.length > 0) {
      processChartData();
    }
  }, [workspaces]);
  
  const fetchWorkspaces = async () => {
    try {
      const response = await getAllWorkspaces();
      setWorkspaces(response);
      
      // if (!response.ok) {
      //   throw new Error(`Error fetching workspaces: ${response.status}`);
      // }
      
      // const data = await response.json();
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/projects');
      
      if (!response.ok) {
        throw new Error(`Error fetching projects: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };
  
  const processChartData = () => {
    // Process member data for chart
    // Group workspaces by member count
    const memberCounts: Record<string, number> = {};
    
    workspaces.forEach(workspace => {
      const memberCount = workspace.members.length;
      const memberGroup = memberCount === 1 ? "1 member" : 
                         memberCount <= 3 ? "2-3 members" :
                         memberCount <= 5 ? "4-5 members" : "6+ members";
      
      if (memberCounts[memberGroup]) {
        memberCounts[memberGroup]++;
      } else {
        memberCounts[memberGroup] = 1;
      }
    });
    
    const chartData: MemberCountData[] = Object.keys(memberCounts).map(group => ({
      name: group,
      count: memberCounts[group]
    }));
    
    setMemberData(chartData);
  };
  
  // Calculate recently active workspaces (with projects modified in last 7 days)
  const getActiveWorkspaces = (): number => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get unique workspace IDs with recent projects
    const activeWorkspaceIds = new Set(
      workspaces
        .filter(project => new Date(project.createdAt) >= sevenDaysAgo)
        // .map(project => project.workspaceId)
    );
    
    return activeWorkspaceIds.size;
  };
  
  const navigateToWorkspaces = () => {
    router.push("/works");
  };

  const navigateToTasks = () => {
    router.push("/task-list");
  };
  
  // Calculate project distribution across workspaces
  const getAverageProjectsPerWorkspace = (): string => {
    if (workspaces.length === 0) return "0";
    
    // Count projects per workspace
    const projectsPerWorkspace: Record<string, number> = {};
    
    projects.forEach(project => {
      if (projectsPerWorkspace[project.workspaceId]) {
        projectsPerWorkspace[project.workspaceId]++;
      } else {
        projectsPerWorkspace[project.workspaceId] = 1;
      }
    });
    
    // Calculate average
    const totalWorkspaces = Object.keys(projectsPerWorkspace).length;
    if (totalWorkspaces === 0) return "0";
    
    const totalProjects = Object.values(projectsPerWorkspace).reduce((sum, count) => sum + count, 0);
    return (totalProjects / totalWorkspaces).toFixed(1);
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
            <h1 className="text-2xl font-bold">Workspace Dashboard</h1>
            <div className="flex space-x-3">
              <button 
                onClick={navigateToTasks}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
              >
                <List size={16} className="mr-2" />
                View Tasks
              </button>
              <button 
                onClick={navigateToWorkspaces}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
              >
                <Layers size={16} className="mr-2" />
                View Workspaces
              </button>
            </div>
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
                  title="Total Workspaces" 
                  value={workspaces.length} 
                  icon={<Layers size={20} color="#3b82f6" />} 
                  color="#3b82f6" 
                />
                <SummaryCard 
                  title="Total Projects" 
                  value={projects.length} 
                  icon={<Users size={20} color="#10b981" />} 
                  color="#10b981" 
                />
                <SummaryCard 
                  title="Active Workspaces" 
                  value={getActiveWorkspaces()} 
                  icon={<Activity size={20} color="#f59e0b" />} 
                  color="#f59e0b" 
                />
                <SummaryCard 
                  title="Avg Projects/Workspace" 
                  value={getAverageProjectsPerWorkspace()} 
                  icon={<BarChart2 size={20} color="#ef4444" />} 
                  color="#ef4444" 
                />
              </div>
              
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workspace Member Distribution Chart */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <h2 className="text-lg font-semibold mb-4">Member Distribution</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={memberData} 
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
                          name="Number of Workspaces" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Recent Workspaces - Only this panel is scrollable */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Workspaces</h2>
                    <button 
                      onClick={navigateToWorkspaces}
                      className={`text-sm flex items-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                      View all
                    </button>
                  </div>
                  
                  {/* This div is scrollable with a fixed height */}
                  <div className="h-80 overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {workspaces
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((workspace) => (
                        <div 
                          key={workspace.id} 
                          className={`p-3 rounded-lg ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"} transition-colors cursor-pointer`}
                          onClick={() => router.push(`/workspace/${workspace.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{workspace.name}</h3>
                              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {workspace.description?.substring(0, 80) || "No description"}
                                {workspace.description?.length > 80 ? "..." : ""}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                              {workspace.members.length} {workspace.members.length === 1 ? "member" : "members"}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Created by: {workspace.owner === user?.id ? "You" : workspace.owner.name}
                            </span>
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Created: {formatDate(workspace.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {workspaces.length === 0 && (
                        <div className="text-center py-8">
                          <p className={`mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No workspaces found</p>
                          <button 
                            onClick={() => router.push("/workspace")} 
                            className="flex items-center mx-auto mt-2 text-blue-600 hover:text-blue-700"
                          >
                            <PlusCircle size={16} className="mr-1" />
                            Create a workspace
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