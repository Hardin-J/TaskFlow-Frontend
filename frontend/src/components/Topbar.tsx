"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode"; // Import jwt-decode
import { JSX } from "react/jsx-runtime";

// --- Placeholder Icons (Replace with actual SVG components or library if desired) ---
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);
const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);
const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);
const TaskIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);
const BellIconDefault = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    className="inline-block"
  >
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);
const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    className="inline-block"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
// --- End Placeholder Icons ---

// User interface for the prop. Name is optional here as we prioritize JWT.
interface UserProp {
  id: string | number;
  name?: string; // Can be provided as a fallback by parent
  email: string;
}

// Interface for the decoded JWT payload (adjust claim names as needed)
interface DecodedJwtPayload {
  id?: string | number; // Or `sub` for subject ID
  email?: string;
  name?: string; // Assuming 'name' is the claim for the user's full name. Could be 'username', 'fullName', 'given_name', etc.
  // Add other claims you might need from the token
  [key: string]: any; // To accommodate other claims
}

// Notification type from backend's Notification.ts (or similar)
export type BackendNotificationType =
  | "task_assigned"
  | "status_changed"
  | "due_date_reminder"
  | "mention"
  | "project_invitation"
  | "comment"
  | "priority_changed"
  // Custom types (ensure backend can send these or use metadata.message effectively)
  | "user_registered" // For "New user Regi..."
  | "profile_update_needed" // For "Need to updat..."
  | "details_updated"; // For "Andi lane details updated"

// Backend Notification structure (align with your API response)
interface BackendNotification {
  id: string;
  type: BackendNotificationType;
  isRead: boolean;
  metadata: {
    taskId?: string;
    taskName?: string;
    projectId?: string;
    projectName?: string;
    commentId?: string;
    actorId?: string;
    actorName?: string; // Name of user who triggered notification
    userName?: string; // Name of new user, if type is user_registered
    entityName?: string; // e.g., "Andi lane" for "details_updated"
    itemName?: string; // Generic item name for status/priority changes, reminders
    message?: string; // Pre-formatted message from backend (highly recommended for flexibility)
    navigateTo?: string; // Optional path to navigate to on click
    [key: string]: any; // Allow other metadata properties
  };
  createdAt: string; // ISO date string
  readAt?: string; // ISO date string
}

interface TopbarProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notificationCount: number; // Initial unread count from parent
  user: UserProp | null; // The user object passed as a prop
}

// Retrieves the token from localStorage
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const API_BASE_URL = "http://localhost:4000"; // Your notification API base URL

export default function Topbar({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  notificationCount: initialNotificationCount,
  user, // This prop is still useful for id, email, and as a fallback
}: TopbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [currentNotificationCount, setCurrentNotificationCount] = useState(
    initialNotificationCount
  );
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  // State for display name, initial, and email, primarily derived from JWT
  const [displayName, setDisplayName] = useState<string>("Guest");
  const [displayInitial, setDisplayInitial] = useState<string>("?");
  const [displayEmail, setDisplayEmail] = useState<string>("No email");

  useEffect(() => {
    const token = getToken();
    let nameFromToken: string | undefined = undefined;
    let emailFromToken: string | undefined = undefined;
    // let idFromToken: string | number | undefined = undefined; // If you need ID from token for display

    if (token) {
      try {
        const decodedToken: DecodedJwtPayload = jwtDecode(token);
        // Adjust these claims if your JWT uses different names
        if (decodedToken.name) nameFromToken = decodedToken.name;
        if (decodedToken.email) emailFromToken = decodedToken.email;
        // if (decodedToken.id || decodedToken.sub) idFromToken = decodedToken.id || decodedToken.sub;
      } catch (error) {
        console.warn("Failed to decode JWT or token malformed:", error);
        // Optionally, clear the invalid token:
        // if (typeof window !== 'undefined') localStorage.removeItem('token');
      }
    }

    // Set display name, initial, and email based on priority:
    if (nameFromToken) {
      setDisplayName(nameFromToken);
      setDisplayInitial(nameFromToken.charAt(0).toUpperCase());
      // Use email from token if available, otherwise from user prop, then fallback
      setDisplayEmail(emailFromToken || user?.email || "No email");
    } else if (user?.name) {
      // Fallback to name from user prop
      setDisplayName(user.name);
      setDisplayInitial(user.name.charAt(0).toUpperCase());
      setDisplayEmail(user.email || "No email");
    } else if (emailFromToken) {
      // If no name, but email from token, use email as name
      setDisplayName(emailFromToken);
      setDisplayInitial(emailFromToken.charAt(0).toUpperCase());
      setDisplayEmail(emailFromToken);
    } else if (user?.email) {
      // Fallback to email from user prop, use email as name
      setDisplayName(user.email);
      setDisplayInitial(user.email.charAt(0).toUpperCase());
      setDisplayEmail(user.email);
    } else {
      // Absolute fallback
      setDisplayName("Guest");
      setDisplayInitial("?");
      setDisplayEmail("No email");
    }
  }, [user]); // Re-run when user prop changes (e.g., after login/logout which updates the prop)

  const fetchAndSetNotifications = useCallback(
    async (limit: number = 10) => {
      const token = getToken();
      // Use user.id from prop for fetching notifications.
      // Ensure this ID matches what your backend expects for the recipient.
      if (!token || !user?.id) {
        setNotifications([]);
        setCurrentNotificationCount(0);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications?limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setNotifications(result.data as BackendNotification[]);
            setCurrentNotificationCount(result.meta.unreadCount);
          } else {
            console.error(
              "Failed to fetch notifications (API error):",
              result.message
            );
          }
        } else {
          console.error(
            "Failed to fetch notifications (HTTP error):",
            response.status,
            await response.text()
          );
        }
      } catch (error) {
        console.error("Error fetching notifications (catch):", error);
      }
    },
    [user?.id]
  ); // Depends on user.id from prop

  useEffect(() => {
    if (user?.id) {
      // Still use user.id from prop to decide if logged in for notifications
      fetchAndSetNotifications();
    } else {
      setNotifications([]);
      setCurrentNotificationCount(0);
    }
  }, [user?.id, fetchAndSetNotifications]);

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown((prev) => {
      if (!prev && user?.id) {
        // If opening and user is logged in, fetch latest
        fetchAndSetNotifications();
      }
      return !prev;
    });
  };

  const handleNotificationClick = async (notification: BackendNotification) => {
    if (!notification.isRead) {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications/${notification.id}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          setNotifications((prevNots) =>
            prevNots.map((n) =>
              n.id === notification.id ? { ...n, isRead: true } : n
            )
          );
          setCurrentNotificationCount((prevCount) =>
            Math.max(0, prevCount - 1)
          );
        } else {
          console.error("Failed to mark notification as read (HTTP error)");
        }
      } catch (error) {
        console.error("Error marking notification as read (catch):", error);
      }
    }
    if (notification.metadata?.navigateTo) {
      router.push(notification.metadata.navigateTo);
      setShowNotificationDropdown(false); // Close dropdown on navigation
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications((prevNots) =>
            prevNots.map((n) => ({ ...n, isRead: true }))
          );
          setCurrentNotificationCount(0);
        } else {
          console.error(
            "Failed to mark all as read (API error):",
            result.message
          );
        }
      } else {
        console.error("Failed to mark all notifications as read (HTTP error)");
      }
    } catch (error) {
      console.error("Error marking all notifications as read (catch):", error);
    }
  };

  const getNotificationDisplayDetails = (notification: BackendNotification) => {
    let icon: JSX.Element = <BellIconDefault />;
    let text: string =
      notification.metadata?.message || "New notification received.";

    if (notification.metadata?.message) {
      text = notification.metadata.message;
    } else {
      switch (notification.type) {
        case "profile_update_needed":
          text = "Your profile may need an update.";
          break;
        case "user_registered":
          text = notification.metadata?.userName
            ? `${notification.metadata.userName} has registered.`
            : "A new user has registered.";
          break;
        case "details_updated":
          text = notification.metadata?.entityName
            ? `${notification.metadata.entityName} details were updated.`
            : "Some details were updated.";
          break;
        case "task_assigned":
          text = `New task assigned: ${
            notification.metadata?.taskName || "View task"
          }`;
          break;
        case "status_changed":
          text = `Status changed for ${
            notification.metadata?.itemName || "an item"
          }.`;
          break;
        case "due_date_reminder":
          text = `Reminder: ${
            notification.metadata?.itemName || "Item"
          } is due soon.`;
          break;
        case "mention":
          text = `${
            notification.metadata?.actorName || "Someone"
          } mentioned you.`;
          break;
        case "project_invitation":
          text = `You've been invited to ${
            notification.metadata?.projectName || "a project"
          }.`;
          break;
        case "comment":
          text = `${
            notification.metadata?.actorName || "Someone"
          } commented on ${notification.metadata?.itemName || "something"}.`;
          break;
        case "priority_changed":
          text = `Priority changed for ${
            notification.metadata?.itemName || "an item"
          }.`;
          break;
        default:
          // text = `Notification: ${notification.type.replace(/_/g, " ")}`;
      }
    }

    switch (notification.type) {
      case "profile_update_needed":
        icon = <UserIcon />;
        break;
      case "user_registered":
        icon = <UsersIcon />;
        break;
      case "details_updated":
        icon = <EditIcon />;
        break;
      case "task_assigned":
        icon = <TaskIcon />;
        break;
      case "status_changed":
        icon = <EditIcon />;
        break;
      case "mention":
      case "comment":
        icon = <UserIcon />;
        break;
      case "project_invitation":
        icon = <UsersIcon />;
        break;
      default:
        icon = <BellIconDefault />;
    }

    if (text.length > 30) {
      text = text.substring(0, 27) + "...";
    }
    return { icon, text };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Never";
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Never";
    }
  };

  const toggleUserDetails = () => setShowUserDetails(!showUserDetails);

  return (
    <header
      className={`flex items-center justify-between h-16 px-4 sm:px-6 border-b ${
        darkMode
          ? "bg-slate-900/90 border-slate-700/50"
          : "bg-white/90 border-slate-200/50"
      } backdrop-blur-md shadow-sm sticky top-0 z-20`}
    >
      {/* Left section */}
      <div className="flex items-center">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className={`p-1 mr-2 sm:mr-4 rounded-md ${
              darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
            }`}
            aria-label="Open sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}
        
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${
            darkMode
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          } hover:scale-105 transition`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Help button */}
        <button
          className={`p-2 rounded-full ${
            darkMode
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          } hover:scale-105 transition`}
          aria-label="Help"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
        </button>

        {/* Notifications Dropdown (uses currentNotificationCount) */}
        <div className="relative">
          <button
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            } hover:scale-105 transition`}
            onClick={toggleNotificationDropdown}
            aria-label="Open notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          {currentNotificationCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {currentNotificationCount}
            </span>
          )}

          {showNotificationDropdown && (
            <div
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-md shadow-xl z-30 ${
                darkMode
                  ? "bg-slate-800 text-slate-200 border border-slate-700"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <h3 className="text-md font-semibold">Notifications</h3>
                <button
                  onClick={() => setShowNotificationDropdown(false)}
                  className={`p-1 rounded-md ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                  }`}
                  aria-label="Close notifications"
                >
                  <CloseIcon />
                </button>
              </div>

              {notifications.length === 0 ? (
                <p
                  className={`px-4 py-10 text-center text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  No new notifications.
                </p>
              ) : (
                <ul
                  className="max-h-96 overflow-y-auto"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    scrollbarColor: darkMode
                      ? "#475569 #1e293b"
                      : "#cbd5e1 #f1f5f9",
                  }}
                >
                  {" "}
                  {/* Custom scrollbar */}
                  {notifications.map((notif) => {
                    const { icon, text } = getNotificationDisplayDetails(notif);
                    return (
                      <li
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-center px-4 py-3 cursor-pointer transition-colors border-b ${
                          darkMode
                            ? "border-slate-700/50 hover:bg-slate-700"
                            : "border-slate-200/70 hover:bg-slate-50"
                        } ${
                          !notif.isRead
                            ? darkMode
                              ? "bg-slate-700/30"
                              : "bg-blue-50/50"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 mr-3 p-1.5 rounded-full ${
                            darkMode ? "bg-slate-700" : "bg-slate-100"
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="flex-grow min-w-0">
                          {" "}
                          {/* Added min-w-0 for proper truncation of text inside */}
                          <p
                            className={`text-sm font-medium truncate ${
                              darkMode ? "text-slate-100" : "text-slate-800"
                            }`}
                          >
                            {text}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {formatDate(notif.createdAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2 flex items-center">
                          {!notif.isRead && (
                            <span
                              className="w-2 h-2 bg-red-500 rounded-full mr-2"
                              aria-label="Unread"
                            ></span>
                          )}
                          <ChevronRightIcon />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {notifications.length > 0 && currentNotificationCount > 0 && (
                <div
                  className={`px-4 py-2 border-t ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`w-full text-sm font-medium py-2 rounded-md transition-colors ${
                      darkMode
                        ? "text-blue-400 hover:bg-slate-700"
                        : "text-blue-600 hover:bg-slate-100"
                    }`}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User info and dropdown (uses displayName, displayInitial, displayEmail) */}
        <div className="relative">
          <div
            className="flex items-center cursor-pointer"
            onClick={toggleUserDetails}
            aria-expanded={showUserDetails}
            aria-controls="user-details-dropdown"
          >
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${
                  darkMode
                    ? "from-sky-600 to-cyan-700"
                    : "from-blue-500 to-indigo-600"
                } flex items-center justify-center text-white font-medium text-sm`}
              >
                {displayInitial}
              </div>
            </div>
            <div className="ml-2 sm:ml-3 hidden md:block">
              <p className="text-sm font-medium truncate max-w-[100px]">
                {displayName}
              </p>
            </div>
          </div>

          {showUserDetails && (
            <div
              id="user-details-dropdown"
              className={`absolute right-0 mt-2 w-56 md:w-60 rounded-md shadow-xl py-1 z-30 ${
                darkMode
                  ? "bg-slate-800 text-slate-200 border border-slate-700"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <div className="px-4 py-3">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p
                  className={`text-xs truncate ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {displayEmail}
                </p>
              </div>
              <div
                className={`border-t ${
                  darkMode ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => {
                    router.push("/settings/profile");
                    setShowUserDetails(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                  }`}
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user"); // Also clear user from localStorage if stored
                    }
                    // The parent component should handle setting the 'user' prop to null
                    // which will trigger the useEffect to update displayName to 'Guest'
                    router.push("/auth/login"); // Or your login page
                    setShowUserDetails(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    darkMode
                      ? "hover:bg-slate-700 text-red-400"
                      : "hover:bg-gray-100 text-red-600"
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
