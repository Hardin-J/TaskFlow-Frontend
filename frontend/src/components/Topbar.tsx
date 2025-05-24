"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  content: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

interface TopbarProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notificationCount: number;
  user: User | null;
}

export default function Topbar({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  notificationCount: initialNotificationCount,
  user
}: TopbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    // Fetch notifications for the current user if user is logged in
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id]);

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/notifications?userId=${userId}&isRead=false`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setNotificationCount(data.length);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Never";
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Never";
    }
  };

  const toggleUserDetails = () => {
    setShowUserDetails(!showUserDetails);
  };

  return (
    <header className={`flex items-center justify-between h-16 px-6 border-b ${
      darkMode ? "bg-slate-900/90 border-slate-700/50" : "bg-white/90 border-slate-200/50"
    } backdrop-blur-md shadow-sm sticky top-0 z-10`}>
      {/* Left section - already covered by sidebar with app name */}
      <div className="flex items-center">
        {sidebarCollapsed && (
          <button 
            onClick={() => setSidebarCollapsed(false)}
            className={`p-1 mr-4 rounded-md ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
        <div className="flex items-center">
          <h2 className="text-lg font-medium">Dashboard</h2>
        </div>
      </div>
      
      {/* Right section - user info, notifications, help */}
      <div className="flex items-center space-x-6">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${
            darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
          } hover:scale-105 transition`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        
        {/* Help button */}
        <button className={`p-2 rounded-full ${
          darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
        } hover:scale-105 transition`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button 
            className={`p-2 rounded-full ${
              darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
            } hover:scale-105 transition`}
            onClick={() => fetchNotifications(user?.id || '')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {notificationCount}
            </span>
          )}
        </div>
        
        {/* User info */}
        <div className="relative">
          <div 
            className="flex items-center cursor-pointer"
            onClick={toggleUserDetails}
          >
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.charAt(0) || '?'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
              {/* <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Last login: {formatDate(user?.lastLogin)}
              </p> */}
            </div>
          </div>
          
          {/* User details dropdown */}
          {showUserDetails && (
            <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg py-1 z-20 ${
              darkMode ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700"
            }`}>
              <div className="px-4 py-3">
                <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
                {/* <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {user?.email || ''}
                </p>
                <p className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Role: {user?.role || 'N/A'}
                </p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Department: {user?.department || 'N/A'}
                </p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Last login: {formatDate(user?.lastLogin)}
                </p> */}
              </div>
              <div className={`border-t ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                  }`}
                >
                  Settings
                </button>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                  }`}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}