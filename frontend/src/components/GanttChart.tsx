"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval, getMonth, getYear } from "date-fns";
import { getProjectTasks } from "@/services/Task.service";

// Updated interfaces to match backend structure
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string; // ISO date string
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  parentTask?: {
    id: string;
    title: string;
  };
  subtasks?: Task[];
  project: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

type TaskWithDates = Task & {
  startDate: string;
  endDate: string;
};

interface GanttChartProps {
  workspaceId: string;
  projectId: string;
  users: User[];
  darkMode: boolean;
}

// Define a consistent width for each day in pixels
const DAY_WIDTH = 30; // pixels per day

export default function GanttChart({ workspaceId, projectId, users, darkMode }: GanttChartProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksWithDates, setTasksWithDates] = useState<TaskWithDates[]>([]);
  const [timeRange, setTimeRange] = useState<Date[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await getProjectTasks(workspaceId, projectId);
        
        if (response?.data?.tasks) {
          // Filter out subtasks to only show parent tasks in Gantt
          const parentTasks = response.data.tasks.filter((task: Task) => !task.parentTask);
          setTasks(parentTasks);
        } else {
          setTasks([]);
        }
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to fetch tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && projectId) {
      fetchTasks();
    }
  }, [workspaceId, projectId]);

  // Process tasks to determine start and end dates
  useEffect(() => {
    if (tasks.length > 0) {
      const processedTasks: TaskWithDates[] = tasks.map(task => {
        // Use createdAt as start date
        const startDate = task.createdAt;

        // Use dueDate as end date, fallback to 7 days from start if no due date
        let endDate: string;
        if (task.dueDate) {
          endDate = task.dueDate;
        } else {
          // If no due date, estimate end date based on priority
          const daysToAdd = task.priority === 'high' ? 3 : task.priority === 'medium' ? 7 : 14;
          endDate = addDays(parseISO(task.createdAt), daysToAdd).toISOString();
        }

        return {
          ...task,
          startDate,
          endDate
        };
      });

      setTasksWithDates(processedTasks);
      generateTimeRange(processedTasks);
    } else {
      setTasksWithDates([]);
      setTimeRange([]);
    }
  }, [tasks]);

  // Generate an array of dates for the chart timeline
  const generateTimeRange = (processedTasks: TaskWithDates[]) => {
    if (processedTasks.length === 0) return;

    // Find earliest start date and latest end date
    let earliestDate = parseISO(processedTasks[0].startDate);
    let latestDate = parseISO(processedTasks[0].endDate);

    processedTasks.forEach(task => {
      const startDate = parseISO(task.startDate);
      const endDate = parseISO(task.endDate);

      if (startDate < earliestDate) earliestDate = startDate;
      if (endDate > latestDate) latestDate = endDate;
    });

    // Add some padding days before and after
    earliestDate = addDays(earliestDate, -7);
    latestDate = addDays(latestDate, 7);

    // Ensure range covers at least a month if tasks are very short
    if (differenceInDays(latestDate, earliestDate) < 30) {
      latestDate = addDays(earliestDate, 30);
    }

    // Generate array of dates
    const dateArray: Date[] = eachDayOfInterval({ start: earliestDate, end: latestDate });
    setTimeRange(dateArray);
  };

  // Calculate bar position and width based on dates and DAY_WIDTH
  const calculateBarPosition = (task: TaskWithDates): { left: number; width: number } => {
    if (timeRange.length === 0) return { left: 0, width: 0 };

    const chartStartDate = timeRange[0];
    const taskStartDate = parseISO(task.startDate);
    const taskEndDate = parseISO(task.endDate);

    const startDayOffset = differenceInDays(taskStartDate, chartStartDate);
    const taskDuration = differenceInDays(taskEndDate, taskStartDate) + 1;

    const left = startDayOffset * DAY_WIDTH;
    const width = taskDuration * DAY_WIDTH;

    return {
      left: Math.max(left, 0),
      width: Math.max(width, DAY_WIDTH)
    };
  };

  // Get status color - updated to match backend enum values
  const getStatusColor = (status: Task['status']): string => {
    switch(status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'in_review':
        return 'bg-yellow-500';
      case 'todo':
        return 'bg-gray-400';
      default:
        return 'bg-purple-500';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Task['priority']): string => {
    switch(priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM dd');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get readable status label
  const getStatusLabel = (status: Task['status']): string => {
    switch(status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'in_review':
        return 'In Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Group dates by month for month headers
  const getMonthsInTimeRange = () => {
    if (timeRange.length === 0) return [];

    const months: { month: string; year: number; days: number; startIndex: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let monthStartIndex = 0;

    timeRange.forEach((date, index) => {
      const month = getMonth(date);
      const year = getYear(date);

      if (month !== currentMonth || year !== currentYear) {
        if (currentMonth !== -1) {
          months.push({
            month: format(timeRange[monthStartIndex], 'MMM'),
            year: currentYear,
            days: index - monthStartIndex,
            startIndex: monthStartIndex
          });
        }
        currentMonth = month;
        currentYear = year;
        monthStartIndex = index;
      }

      if (index === timeRange.length - 1) {
        months.push({
          month: format(date, 'MMM'),
          year: currentYear,
          days: index - monthStartIndex + 1,
          startIndex: monthStartIndex
        });
      }
    });
    return months;
  };

  // Navigate to task list page
  const navigateToTaskList = () => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
  };

  // Handle task click to navigate to task detail
  const handleTaskClick = (taskId: string) => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
  };

  const months = getMonthsInTimeRange();
  const totalChartWidth = timeRange.length * DAY_WIDTH;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center ${darkMode ? "text-red-400" : "text-red-600"}`}>
        <p>Error loading tasks: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className={`mt-2 px-4 py-2 rounded ${
            darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={`p-6 text-center ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">No tasks available</h3>
        <p className="mb-4">There are no tasks to display in the Gantt chart.</p>
        <button
          onClick={navigateToTaskList}
          className={`px-4 py-2 rounded-md ${
            darkMode 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          Create New Task
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${darkMode ? "text-white" : "text-gray-800"}`}>
      {/* Header with View All Tasks Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Gantt Chart</h2>
        <button
          onClick={navigateToTaskList}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            darkMode 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          View All Tasks
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Color Labels (Legend) - Updated to match backend status */}
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <h4 className="font-semibold text-sm mb-2">Task Status Legend:</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Completed
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> In Progress
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> In Review
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span> To Do
            </div>
          </div>
        </div>

        <div className="min-w-max pb-4">
          {/* Month Header */}
          <div className="flex border-b">
            <div className="w-64 flex-shrink-0 pr-4"></div>
            <div className="flex flex-grow" style={{ width: totalChartWidth }}>
              {months.map((monthData, index) => (
                <div
                  key={monthData.month + monthData.year + index}
                  className={`text-center py-2 font-semibold border-r ${
                    darkMode ? 'border-gray-700 bg-slate-700/50' : 'border-gray-200 bg-gray-100'
                  }`}
                  style={{ width: monthData.days * DAY_WIDTH }}
                >
                  {monthData.month} {monthData.year}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Timeline header */}
          <div className="flex border-b">
            <div className="w-64 flex-shrink-0 pr-4">
              <h3 className="font-medium text-sm pt-2">Task / Assignee</h3>
            </div>
            <div className="flex flex-grow" style={{ width: totalChartWidth }}>
              {timeRange.map((date, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 text-center text-xs pt-2 ${
                    darkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'
                  } ${format(date, 'E') === 'Sat' || format(date, 'E') === 'Sun'
                    ? darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'
                    : ''
                  }`}
                  style={{ width: DAY_WIDTH }}
                >
                  {format(date, 'dd')}
                  <br />
                  <span className="font-medium">{format(date, 'E')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows and bars */}
          <div className="relative">
            {tasksWithDates.map((task, taskIndex) => (
              <div
                key={task.id}
                className={`flex items-center py-2 border-b cursor-pointer ${
                  darkMode ? 'border-gray-700 hover:bg-slate-700/30' : 'border-gray-200 hover:bg-gray-50'
                } ${taskIndex % 2 === 0
                    ? darkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'
                    : ''
                }`}
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="w-64 flex-shrink-0 pr-4">
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="text-xs truncate text-gray-500 flex items-center gap-2">
                    <span>{task.assignee?.name || 'Unassigned'}</span>
                    <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="text-blue-500">({task.subtasks.length} subtasks)</span>
                    )}
                  </div>
                </div>

                <div className="flex-grow relative h-8" style={{ width: totalChartWidth }}>
                  {/* Task bar */}
                  <div
                    className={`absolute h-6 rounded-md shadow-sm flex items-center justify-between px-2 text-white text-xs ${getStatusColor(task.status)} hover:opacity-80 transition-opacity`}
                    style={{
                      left: `${calculateBarPosition(task).left}px`,
                      width: `${calculateBarPosition(task).width}px`,
                    }}
                    title={`${task.title} - ${getStatusLabel(task.status)}`}
                  >
                    <span className="truncate pr-1">{formatDate(task.startDate)}</span>
                    <span className="truncate pl-1">{formatDate(task.endDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}