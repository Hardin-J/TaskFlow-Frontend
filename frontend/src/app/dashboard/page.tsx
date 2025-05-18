"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin?: string;
}

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

export default function Dashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(3);
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
      fetchData(parsedUser.id);
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
  
  const fetchData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch users
      const usersResponse = await fetch("http://localhost:3001/users");
      const usersData = await usersResponse.json();
      setUsers(usersData);
      
      // Fetch tasks
      const tasksResponse = await fetch("http://localhost:3001/tasks");
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      
      // Fetch projects
      const projectsResponse = await fetch("http://localhost:3001/projects");
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data. Please try again later.");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get recent tasks (tasks assigned to current user, sorted by most recent)
  const getRecentTasks = () => {
    if (!user) return [];
    
    return tasks
      .filter(task => task.assignedTo === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // Get top 3 most recent tasks
  };
  
  // Get projects in progress for the user
  const getProjectsInProgress = () => {
    if (!user) return [];
    
    return projects
      .filter(project => project.createdBy === user.id || project.status === "In Progress")
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 3); // Get top 3 projects
  };
  
  // Get upcoming deadlines (tasks with target dates approaching)
  const getUpcomingDeadlines = () => {
    if (!user) return [];
    
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14); // 2 weeks from now
    
    return tasks
      .filter(task => {
        const targetDate = new Date(task.targetDate);
        return (
          task.assignedTo === user.id && 
          targetDate >= today && 
          targetDate <= twoWeeksFromNow &&
          task.status !== "Completed"
        );
      })
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 3); // Get top 3 upcoming deadlines
  };
  
  // Helper function to get user name by ID
  const getUserNameById = (userId: string) => {
    const foundUser = users.find(user => user.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
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
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
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
          <div className={`mb-6 p-6 rounded-xl ${
            darkMode 
              ? "bg-slate-800/50 border border-slate-700/50" 
              : "bg-white/80 border border-slate-200/50"
          } backdrop-blur-sm shadow-md`}>
            <h2 className="text-xl font-bold mb-4">Welcome back, {user?.name}</h2>
            <p className={darkMode ? "text-slate-300" : "text-slate-600"}>
              Start managing your projects and tasks efficiently!
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
                darkMode ? "border-slate-300 border-t-slate-700" : "border-slate-200 border-t-slate-500"
              }`}></div>
            </div>
          ) : error ? (
            <div className={`p-6 rounded-xl text-center ${
              darkMode 
                ? "bg-red-900/30 border border-red-800/50 text-red-200" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <p>{error}</p>
              <button 
                onClick={() => user && fetchData(user.id)}
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
              <div className={`p-6 rounded-xl ${
                darkMode 
                  ? "bg-slate-800/50 border border-slate-700/50" 
                  : "bg-white/80 border border-slate-200/50"
              } backdrop-blur-sm shadow-md`}>
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
                  <span>Recent Tasks</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>
                    {getRecentTasks().length}
                  </span>
                </h3>

                <div className="space-y-3">
                  {getRecentTasks().length > 0 ? (
                    getRecentTasks().map(task => (
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
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === "High" 
                              ? darkMode ? "bg-amber-900/70 text-amber-200" : "bg-amber-100 text-amber-800"
                              : task.priority === "Critical"
                                ? darkMode ? "bg-red-900/70 text-red-200" : "bg-red-100 text-red-800"
                                : darkMode ? "bg-blue-900/70 text-blue-200" : "bg-blue-100 text-blue-800"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Due: {formatDate(task.targetDate)}
                        </p>
                        <div className={`text-xs mt-2 flex items-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            task.status === "In Progress" 
                              ? "bg-blue-500" 
                              : task.status === "Completed" 
                                ? "bg-green-500" 
                                : task.status === "In Review" 
                                  ? "bg-purple-500" 
                                  : "bg-gray-500"
                          }`}></span>
                          {task.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`h-32 flex items-center justify-center ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
                      No recent tasks found.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Project Progress Card */}
              <div className={`p-6 rounded-xl ${
                darkMode 
                  ? "bg-slate-800/50 border border-slate-700/50" 
                  : "bg-white/80 border border-slate-200/50"
              } backdrop-blur-sm shadow-md`}>
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
                  <span>Project Progress</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>
                    {getProjectsInProgress().length}
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {getProjectsInProgress().length > 0 ? (
                    getProjectsInProgress().map(project => (
                      <div 
                        key={project.id} 
                        className={`p-3 rounded-lg ${
                          darkMode 
                            ? "bg-slate-700/50 hover:bg-slate-700/70" 
                            : "bg-slate-50 hover:bg-slate-100"
                        } cursor-pointer transition-colors`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{project.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === "In Progress"
                              ? darkMode ? "bg-blue-900/70 text-blue-200" : "bg-blue-100 text-blue-800"
                              : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`} style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {project.description}
                        </p>
                        <p className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Target: {formatDate(project.targetDate)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className={`h-32 flex items-center justify-center ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
                      No active projects.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Upcoming Deadlines Card */}
              <div className={`p-6 rounded-xl ${
                darkMode 
                  ? "bg-slate-800/50 border border-slate-700/50" 
                  : "bg-white/80 border border-slate-200/50"
              } backdrop-blur-sm shadow-md`}>
                <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
                  <span>Upcoming Deadlines</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>
                    {getUpcomingDeadlines().length}
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {getUpcomingDeadlines().length > 0 ? (
                    getUpcomingDeadlines().map(task => {
                      // Calculate days remaining
                      const today = new Date();
                      const deadline = new Date(task.targetDate);
                      const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
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
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              daysRemaining <= 3
                                ? darkMode ? "bg-red-900/70 text-red-200" : "bg-red-100 text-red-800"
                                : daysRemaining <= 7
                                  ? darkMode ? "bg-amber-900/70 text-amber-200" : "bg-amber-100 text-amber-800"
                                  : darkMode ? "bg-green-900/70 text-green-200" : "bg-green-100 text-green-800"
                            }`}>
                              {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Deadline: {formatDate(task.targetDate)}
                          </p>
                          <div className={`text-xs mt-2 flex items-center justify-between ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            <div>
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                task.status === "In Progress" 
                                  ? "bg-blue-500" 
                                  : task.status === "Completed" 
                                    ? "bg-green-500" 
                                    : task.status === "In Review" 
                                      ? "bg-purple-500" 
                                      : "bg-gray-500"
                              }`}></span>
                              {task.status}
                            </div>
                            <div>
                              {task.priority}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`h-32 flex items-center justify-center ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
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