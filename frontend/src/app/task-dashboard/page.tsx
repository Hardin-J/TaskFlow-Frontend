"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle, Clock, AlertTriangle, Calendar, Activity, TrendingUp, List, UserCheck } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  milestone: string;
  status: string;
  category: string;
  priority: string;
  targetDate: string;
  createdBy: string;
  createdAt: string;
}

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

interface PriorityData {
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

export default function TaskDashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [user, setUser] = useState<User | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Chart data for task status and priority
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityData[]>([]);
  
  // Load user data and fetch tasks and related data on mount
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
      fetchUsers();
      fetchProjects();
      fetchTasks();
    }
  }, [router]);
  
  // Process data for charts when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      processChartData();
    }
  }, [tasks]);
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users');
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
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

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/tasks');
      
      if (!response.ok) {
        throw new Error(`Error fetching tasks: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processChartData = () => {
    // Process status data for chart
    const statusCounts: Record<string, number> = {
      "Not Started": 0,
      "In Progress": 0,
      "In Review": 0,
      "Completed": 0
    };
    
    const priorityCounts: Record<string, number> = {
      "Low": 0,
      "Medium": 0,
      "High": 0,
      "Critical": 0
    };
    
    tasks.forEach(task => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, task.status)) {
        statusCounts[task.status]++;
      }
      
      if (Object.prototype.hasOwnProperty.call(priorityCounts, task.priority)) {
        priorityCounts[task.priority]++;
      }
    });
    
    const statusChartData: StatusData[] = Object.keys(statusCounts).map(status => ({
      name: status,
      count: statusCounts[status]
    }));
    
    const priorityChartData: PriorityData[] = Object.keys(priorityCounts).map(priority => ({
      name: priority,
      count: priorityCounts[priority]
    }));
    
    setStatusData(statusChartData);
    setPriorityData(priorityChartData);
  };
  
  // Calculate tasks due soon (within 7 days)
  const getTasksDueSoon = (): number => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return tasks.filter(task => {
      const targetDate = new Date(task.targetDate);
      return targetDate >= today && targetDate <= nextWeek && task.status !== "Completed";
    }).length;
  };
  
  const navigateToTaskList = () => {
    router.push("/task-list");
  };
  
  // Calculate completion rate
  const getCompletionRate = (): string => {
    if (tasks.length === 0) return "0%";
    const completed = tasks.filter(t => t.status === "Completed").length;
    return Math.round((completed / tasks.length) * 100) + "%";
  };
  
  // Calculate high priority tasks
  const getHighPriorityTasksCount = (): number => {
    return tasks.filter(task => 
      (task.priority === "High" || task.priority === "Critical") && 
      task.status !== "Completed"
    ).length;
  };
  
  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  // Helper function to get project title by ID
  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "Unknown Project";
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
            <h1 className="text-2xl font-bold">Task Dashboard</h1>
            <button 
              onClick={navigateToTaskList}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <List size={16} className="mr-2" />
              View Tasks
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
                  title="Total Tasks" 
                  value={tasks.length} 
                  icon={<CheckCircle size={20} color="#3b82f6" />} 
                  color="#3b82f6" 
                />
                <SummaryCard 
                  title="High Priority" 
                  value={getHighPriorityTasksCount()} 
                  icon={<AlertTriangle size={20} color="#f59e0b" />} 
                  color="#f59e0b" 
                />
                <SummaryCard 
                  title="Due Soon" 
                  value={getTasksDueSoon()} 
                  icon={<Calendar size={20} color="#10b981" />} 
                  color="#10b981" 
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
                {/* Task Status Chart */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
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
                          name="Number of Tasks" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Recent Tasks - Only this panel is scrollable */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Tasks</h2>
                    <button 
                      onClick={navigateToTaskList}
                      className={`text-sm flex items-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                      View all
                    </button>
                  </div>
                  
                  {/* This div is scrollable with a fixed height */}
                  <div className="h-80 overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {tasks.slice(0, 10).map((task) => (
                        <div 
                          key={task.id} 
                          className={`p-3 rounded-lg ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-50 hover:bg-slate-100"} transition-colors cursor-pointer`}
                          onClick={() => router.push(`/task/${task.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{task.title}</h3>
                              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {task.description?.substring(0, 60) || "No description"}
                                {task.description?.length > 60 ? "..." : ""}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                task.status === "Completed" ? "bg-green-100 text-green-800" :
                                task.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                task.status === "In Review" ? "bg-amber-100 text-amber-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {task.status}
                              </span>
                              <span className={`text-xs px-2 py-1 mt-1 rounded-full ${
                                task.priority === "Critical" ? "bg-red-100 text-red-800" :
                                task.priority === "High" ? "bg-amber-100 text-amber-800" :
                                task.priority === "Medium" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between text-xs">
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Project: {getProjectTitle(task.projectId)}
                            </span>
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Assigned: {getUserName(task.assignedTo)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs">
                            <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                              Due: {new Date(task.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {tasks.length === 0 && (
                        <div className="text-center py-8">
                          <p className={`mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No tasks found</p>
                          <button 
                            onClick={() => router.push("/task")} 
                            className="flex items-center mx-auto mt-2 text-blue-600 hover:text-blue-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create a task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional row for task metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Priority Distribution */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <h2 className="text-lg font-semibold mb-4">Tasks by Priority</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={priorityData} 
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
                          name="Number of Tasks" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Task Assignment Distribution */}
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                  <h2 className="text-lg font-semibold mb-4">Team Member Workload</h2>
                  <div className="h-80 overflow-y-auto">
                    {users.map(u => {
                      const assignedTasks = tasks.filter(t => t.assignedTo === u.id);
                      const completedTasks = assignedTasks.filter(t => t.status === "Completed").length;
                      const pendingTasks = assignedTasks.length - completedTasks;
                      const completionPercentage = assignedTasks.length > 0 
                        ? Math.round((completedTasks / assignedTasks.length) * 100) 
                        : 0;
                      
                      return (
                        <div key={u.id} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-sm">{assignedTasks.length} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span>{completedTasks} completed</span>
                            <span>{pendingTasks} pending</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {users.length === 0 && (
                      <div className="text-center py-8">
                        <p className={`mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No users found</p>
                      </div>
                    )}
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