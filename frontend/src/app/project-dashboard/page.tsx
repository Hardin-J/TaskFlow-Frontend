// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import {
//   List,
//   BarChart2,
//   Users,
//   Calendar,
//   Activity,
//   TrendingUp,
//   PlusCircle,
//   Layers,
//   Clock,
//   CheckCircle,
//   AlertCircle,
// } from "lucide-react";
// import Sidebar from "@/components/Sidebar";
// import Topbar from "@/components/Topbar";
// import { getWorkspaceProjects } from "@/services/Project.service";
// import toast from "react-hot-toast";

// // Updated interface to match backend entity
// interface Project {
//   id: string;
//   name: string;
//   description: string;
//   deadline: string;
//   createdAt: string;
//   status: "active" | "archived" | "completed";
//   workspace: {
//     id: string;
//     name: string;
//   };
//   members?: User[];
//   priority?: "low" | "medium" | "high";
//   progress?: number;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   department: string;
//   lastLogin?: string;
// }

// interface StatusData {
//   name: string;
//   count: number;
//   color: string;
// }

// interface ActivityData {
//   date: string;
//   projects: number;
//   completed: number;
// }

// interface SummaryCardProps {
//   title: string;
//   value: string | number;
//   icon: React.ReactNode;
//   color: string;
//   subtitle?: string;
// }

// // Dashboard summary card component
// const SummaryCard: React.FC<SummaryCardProps> = ({
//   title,
//   value,
//   icon,
//   color,
//   subtitle,
// }) => {
//   return (
//     <div
//       className="p-6 rounded-lg shadow-md bg-white dark:bg-slate-800 border-l-4 border-t-0 border-r-0 border-b-0 flex justify-between items-center hover:shadow-lg transition-shadow"
//       style={{ borderLeftColor: color }}
//     >
//       <div>
//         <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
//         <p className="text-2xl font-bold mt-1">{value}</p>
//         {subtitle && (
//           <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
//             {subtitle}
//           </p>
//         )}
//       </div>
//       <div
//         className="p-3 rounded-full"
//         style={{ backgroundColor: `${color}20` }}
//       >
//         {icon}
//       </div>
//     </div>
//   );
// };

// export default function Dashboard() {
//   const router = useRouter();
//   const [darkMode, setDarkMode] = useState<boolean>(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
//   const [notificationCount, setNotificationCount] = useState<number>(3);
//   const [user, setUser] = useState<User | null>(null);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   // Chart data
//   const [statusData, setStatusData] = useState<StatusData[]>([]);
//   const [activityData, setActivityData] = useState<ActivityData[]>([]);
//   const [recentActivities, setRecentActivities] = useState<any[]>([]);

//   // Load user data and fetch projects on mount
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const userData = localStorage.getItem("user");
//       if (userData) {
//         setUser(JSON.parse(userData));
//         fetchAllProjects();
//       } else {
//         router.push("/login");
//         return;
//       }

//       const savedDarkMode = localStorage.getItem("darkMode") === "true";
//       setDarkMode(savedDarkMode);
//       document.documentElement.classList.toggle("dark", savedDarkMode);
//     }
//   }, [router]);

//   // Process data for charts when projects change
//   useEffect(() => {
//     if (projects.length > 0) {
//       processChartData();
//       generateActivityData();
//       generateRecentActivities();
//     }
//   }, [projects]);

//   const fetchAllProjects = async () => {
//     setIsLoading(true);
//     setError("");
//     try {
//       const response = await getWorkspaceProjects([]);

//       if (response.data && Array.isArray(response.data)) {
//         setProjects(response.data);
//       } else if (response.data && response.data.projects) {
//         setProjects(response.data.projects);
//       } else {
//         setProjects([]);
//       }
//     } catch (err: any) {
//       console.error("Error fetching projects:", err);
//       setError(err.message || "Failed to fetch projects");
//       setProjects([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const processChartData = () => {
//     // Process status data for pie chart
//     const statusCounts: Record<string, number> = {
//       Active: 0,
//       Completed: 0,
//       Archived: 0,
//     };

//     projects.forEach((project) => {
//       const status =
//         project.status.charAt(0).toUpperCase() + project.status.slice(1);
//       if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
//         statusCounts[status]++;
//       }
//     });

//     const colors = {
//       Active: "#3b82f6",
//       Completed: "#10b981",
//       Archived: "#6b7280",
//     };

//     const chartData: StatusData[] = Object.keys(statusCounts).map((status) => ({
//       name: status,
//       count: statusCounts[status],
//       color: colors[status as keyof typeof colors],
//     }));

//     setStatusData(chartData);
//   };

//   const generateActivityData = () => {
//     // Generate last 7 days activity data
//     const last7Days = [];
//     const today = new Date();
    
//     for (let i = 6; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
      
//       // Simulate activity data based on projects
//       const dayProjects = Math.floor(Math.random() * 5) + 1;
//       const dayCompleted = Math.floor(Math.random() * dayProjects);
      
//       last7Days.push({
//         date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//         projects: dayProjects,
//         completed: dayCompleted,
//       });
//     }
    
//     setActivityData(last7Days);
//   };

//   const generateRecentActivities = () => {
//     // Generate recent activities based on projects
//     const activities = projects.slice(0, 10).map((project, index) => {
//       const activityTypes = [
//         'created',
//         'updated',
//         'completed',
//         'assigned',
//         'commented on'
//       ];
      
//       const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
//       const time = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
//       return {
//         id: `activity-${index}`,
//         type: activity,
//         project: project.name,
//         user: user?.name || 'Unknown User',
//         time: time.toISOString(),
//         description: `${activity} project "${project.name}"`,
//       };
//     });
    
//     setRecentActivities(activities.sort((a, b) => 
//       new Date(b.time).getTime() - new Date(a.time).getTime()
//     ));
//   };

//   // Calculate project due soon (within 7 days)
//   const getProjectsDueSoon = (): number => {
//     const today = new Date();
//     const nextWeek = new Date();
//     nextWeek.setDate(today.getDate() + 7);

//     return projects.filter((project) => {
//       if (!project.deadline) return false;
//       const deadline = new Date(project.deadline);
//       return (
//         deadline >= today &&
//         deadline <= nextWeek &&
//         project.status !== "completed"
//       );
//     }).length;
//   };

//   const getOverdueProjects = (): number => {
//     const today = new Date();
//     return projects.filter((project) => {
//       if (!project.deadline) return false;
//       const deadline = new Date(project.deadline);
//       return deadline < today && project.status !== "completed";
//     }).length;
//   };

//   // Calculate completion rate
//   const getCompletionRate = (): string => {
//     if (projects.length === 0) return "0%";
//     const completed = projects.filter((p) => p.status === "completed").length;
//     return Math.round((completed / projects.length) * 100) + "%";
//   };

//   // Get status display info
//   const getStatusInfo = (status: string) => {
//     switch (status) {
//       case "completed":
//         return { class: "bg-green-100 text-green-800", label: "Completed" };
//       case "active":
//         return { class: "bg-blue-100 text-blue-800", label: "Active" };
//       case "archived":
//         return { class: "bg-gray-100 text-gray-800", label: "Archived" };
//       default:
//         return { class: "bg-gray-100 text-gray-800", label: "Unknown" };
//     }
//   };

//   const getPriorityInfo = (priority: string) => {
//     switch (priority) {
//       case "high":
//         return { class: "bg-red-100 text-red-800", label: "High" };
//       case "medium":
//         return { class: "bg-yellow-100 text-yellow-800", label: "Medium" };
//       case "low":
//         return { class: "bg-green-100 text-green-800", label: "Low" };
//       default:
//         return { class: "bg-gray-100 text-gray-800", label: "Normal" };
//     }
//   };

//   const formatTimeAgo = (date: string) => {
//     const now = new Date();
//     const past = new Date(date);
//     const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
//     if (diffInHours < 1) return 'Just now';
//     if (diffInHours < 24) return `${diffInHours}h ago`;
//     const diffInDays = Math.floor(diffInHours / 24);
//     if (diffInDays < 7) return `${diffInDays}d ago`;
//     return past.toLocaleDateString();
//   };

//   return (
//     <div
//       className={`flex h-screen transition-all duration-500 ${
//         darkMode
//           ? "bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900 text-white"
//           : "bg-gradient-to-br from-sky-50 via-white to-blue-50 text-gray-900"
//       }`}
//     >
//       {/* Sidebar Component */}
//       <Sidebar
//         darkMode={darkMode}
//         sidebarCollapsed={sidebarCollapsed}
//         setSidebarCollapsed={setSidebarCollapsed}
//         user={user}
//       />

//       {/* Main content area */}
//       <div
//         className={`flex-1 ${
//           sidebarCollapsed ? "ml-20" : "ml-64"
//         } transition-all duration-300 overflow-hidden`}
//       >
//         {/* Topbar Component */}
//         <Topbar
//           darkMode={darkMode}
//           setDarkMode={setDarkMode}
//           sidebarCollapsed={sidebarCollapsed}
//           setSidebarCollapsed={setSidebarCollapsed}
//           notificationCount={notificationCount}
//           user={user}
//         />

//         {/* Page content */}
//         <div className="px-6 py-6 h-[calc(100vh-64px)] overflow-y-auto">
//           {/* Page header */}
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h1 className="text-3xl font-bold">Project Dashboard</h1>
//               <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
//                 Overview of your projects and activities
//               </p>
//             </div>
//             <button
//               onClick={() => router.push('/projects')}
//               className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
//             >
//               <List size={16} className="mr-2" />
//               View All Projects
//             </button>
//           </div>

//           {/* Error display */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
//               <p>{error}</p>
//               <button
//                 onClick={fetchAllProjects}
//                 className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
//               >
//                 Retry
//               </button>
//             </div>
//           )}

//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//             </div>
//           ) : (
//             <>
//               {/* Summary cards */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                 <SummaryCard
//                   title="Total Projects"
//                   value={projects.length}
//                   icon={<Layers size={24} color="#3b82f6" />}
//                   color="#3b82f6"
//                   subtitle="All projects"
//                 />
//                 <SummaryCard
//                   title="Active Projects"
//                   value={projects.filter((p) => p.status === "active").length}
//                   icon={<Activity size={24} color="#10b981" />}
//                   color="#10b981"
//                   subtitle="In progress"
//                 />
//                 <SummaryCard
//                   title="Due Soon"
//                   value={getProjectsDueSoon()}
//                   icon={<Clock size={24} color="#f59e0b" />}
//                   color="#f59e0b"
//                   subtitle="Next 7 days"
//                 />
//                 <SummaryCard
//                   title="Overdue"
//                   value={getOverdueProjects()}
//                   icon={<AlertCircle size={24} color="#ef4444" />}
//                   color="#ef4444"
//                   subtitle="Past deadline"
//                 />
//               </div>

//               {/* Charts row */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//                 {/* Project Status Chart */}
//                 <div
//                   className={`p-6 rounded-lg shadow-md ${
//                     darkMode ? "bg-slate-800" : "bg-white"
//                   }`}
//                 >
//                   <h2 className="text-lg font-semibold mb-4 flex items-center">
//                     <BarChart2 className="mr-2" size={20} />
//                     Project Status Distribution
//                   </h2>
//                   <div className="h-80">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={statusData}
//                           cx="50%"
//                           cy="50%"
//                           innerRadius={60}
//                           outerRadius={120}
//                           paddingAngle={5}
//                           dataKey="count"
//                         >
//                           {statusData.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <Tooltip
//                           contentStyle={{
//                             backgroundColor: darkMode ? "#1f2937" : "#ffffff",
//                             color: darkMode ? "#ffffff" : "#000000",
//                             border: `1px solid ${
//                               darkMode ? "#374151" : "#e5e7eb"
//                             }`,
//                           }}
//                         />
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>

//                 {/* Activity Chart */}
//                 <div
//                   className={`p-6 rounded-lg shadow-md ${
//                     darkMode ? "bg-slate-800" : "bg-white"
//                   }`}
//                 >
//                   <h2 className="text-lg font-semibold mb-4 flex items-center">
//                     <TrendingUp className="mr-2" size={20} />
//                     Weekly Activity
//                   </h2>
//                   <div className="h-80">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <LineChart data={activityData}>
//                         <CartesianGrid
//                           strokeDasharray="3 3"
//                           stroke={darkMode ? "#374151" : "#e5e7eb"}
//                         />
//                         <XAxis
//                           dataKey="date"
//                           stroke={darkMode ? "#9ca3af" : "#6b7280"}
//                         />
//                         <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
//                         <Tooltip
//                           contentStyle={{
//                             backgroundColor: darkMode ? "#1f2937" : "#ffffff",
//                             color: darkMode ? "#ffffff" : "#000000",
//                             border: `1px solid ${
//                               darkMode ? "#374151" : "#e5e7eb"
//                             }`,
//                           }}
//                         />
//                         <Legend />
//                         <Line
//                           type="monotone"
//                           dataKey="projects"
//                           stroke="#3b82f6"
//                           strokeWidth={2}
//                           name="Projects Worked"
//                         />
//                         <Line
//                           type="monotone"
//                           dataKey="completed"
//                           stroke="#10b981"
//                           strokeWidth={2}
//                           name="Completed"
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>
//               </div>

//               {/* Bottom row with Recent Projects and Activities */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Recent Projects */}
//                 <div
//                   className={`p-6 rounded-lg shadow-md ${
//                     darkMode ? "bg-slate-800" : "bg-white"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-lg font-semibold flex items-center">
//                       <List className="mr-2" size={20} />
//                       Recent Projects
//                     </h2>
//                     <button
//                       onClick={() => router.push('/projects')}
//                       className={`text-sm flex items-center ${
//                         darkMode
//                           ? "text-blue-400 hover:text-blue-300"
//                           : "text-blue-600 hover:text-blue-700"
//                       }`}
//                     >
//                       View all
//                     </button>
//                   </div>

//                   <div className="h-80 overflow-y-auto pr-2">
//                     <div className="space-y-4">
//                       {projects.slice(0, 8).map((project) => {
//                         const statusInfo = getStatusInfo(project.status);
//                         const priorityInfo = getPriorityInfo(project.priority || 'normal');
//                         return (
//                           <div
//                             key={project.id}
//                             className={`p-4 rounded-lg ${
//                               darkMode
//                                 ? "bg-slate-700 hover:bg-slate-600"
//                                 : "bg-slate-50 hover:bg-slate-100"
//                             } transition-colors cursor-pointer`}
//                             onClick={() =>
//                               router.push(`/project/${project.id}`)
//                             }
//                           >
//                             <div className="flex justify-between items-start">
//                               <div className="flex-1">
//                                 <h3 className="font-medium text-sm">{project.name}</h3>
//                                 <p
//                                   className={`text-xs mt-1 ${
//                                     darkMode
//                                       ? "text-slate-400"
//                                       : "text-slate-500"
//                                   }`}
//                                 >
//                                   {project.description?.substring(0, 60) ||
//                                     "No description"}
//                                   {project.description?.length > 60
//                                     ? "..."
//                                     : ""}
//                                 </p>
//                               </div>
//                               <div className="flex flex-col gap-1 ml-2">
//                                 <span
//                                   className={`text-xs px-2 py-1 rounded-full ${statusInfo.class}`}
//                                 >
//                                   {statusInfo.label}
//                                 </span>
//                                 <span
//                                   className={`text-xs px-2 py-1 rounded-full ${priorityInfo.class}`}
//                                 >
//                                   {priorityInfo.label}
//                                 </span>
//                               </div>
//                             </div>
//                             <div className="mt-3 flex justify-between text-xs">
//                               <span
//                                 className={
//                                   darkMode ? "text-slate-400" : "text-slate-500"
//                                 }
//                               >
//                                 {project.deadline
//                                   ? `Due: ${new Date(
//                                       project.deadline
//                                     ).toLocaleDateString()}`
//                                   : "No deadline"}
//                               </span>
//                               <span
//                                 className={
//                                   darkMode ? "text-slate-400" : "text-slate-500"
//                                 }
//                               >
//                                 {new Date(
//                                   project.createdAt
//                                 ).toLocaleDateString()}
//                               </span>
//                             </div>
//                           </div>
//                         );
//                       })}

//                       {projects.length === 0 && !error && (
//                         <div className="text-center py-8">
//                           <p
//                             className={`mb-2 ${
//                               darkMode ? "text-slate-400" : "text-slate-500"
//                             }`}
//                           >
//                             No projects found
//                           </p>
//                           <button
//                             onClick={() => router.push("/projects/new")}
//                             className="flex items-center mx-auto mt-2 text-blue-600 hover:text-blue-700"
//                           >
//                             <PlusCircle size={16} className="mr-1" />
//                             Create a project
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Recent Activities */}
//                 <div
//                   className={`p-6 rounded-lg shadow-md ${
//                     darkMode ? "bg-slate-800" : "bg-white"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-lg font-semibold flex items-center">
//                       <Activity className="mr-2" size={20} />
//                       Recent Activities
//                     </h2>
//                   </div>

//                   <div className="h-80 overflow-y-auto pr-2">
//                     <div className="space-y-3">
//                       {recentActivities.map((activity) => (
//                         <div
//                           key={activity.id}
//                           className={`p-3 rounded-lg ${
//                             darkMode
//                               ? "bg-slate-700"
//                               : "bg-slate-50"
//                           }`}
//                         >
//                           <div className="flex items-start">
//                             <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
//                             <div className="flex-1">
//                               <p className="text-sm">
//                                 <span className="font-medium">{activity.user}</span>{' '}
//                                 {activity.description}
//                               </p>
//                               <p className={`text-xs mt-1 ${
//                                 darkMode ? "text-slate-400" : "text-slate-500"
//                               }`}>
//                                 {formatTimeAgo(activity.time)}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}

//                       {recentActivities.length === 0 && (
//                         <div className="text-center py-8">
//                           <p
//                             className={`${
//                               darkMode ? "text-slate-400" : "text-slate-500"
//                             }`}
//                           >
//                             No recent activities
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }