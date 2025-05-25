"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SidebarProps {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  user: User | null;
}

export default function Sidebar({
  darkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  user,
}: SidebarProps) {
  const router = useRouter();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] =
    useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [workspaceTitle, setWorkspaceTitle] = useState<string>("");
  const [workspaceDescription, setWorkspaceDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = () => {
    // Clear user data from local storage
    localStorage.removeItem("user");

    // Redirect to login page after a brief delay
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  // Navigation handlers
  const navigateToProject = () => {
    router.push("/project-dashboard");
    setShowWorkspaceDropdown(false); // Close dropdown after selection
  };

  const navigateToWorkspace = () => {
    router.push("/works");
    setShowWorkspaceDropdown(false); // Close dropdown after selection
  };

  const navigateToTask = () => {
    router.push("/task-dashboard");
    setShowWorkspaceDropdown(false);
  };

  const navigateToMembers = () => {
    router.push("/members");
    setShowWorkspaceDropdown(false);
  };

  const navigateToUsers = () => {
    router.push("/users");
    setShowWorkspaceDropdown(false);
  };

  const openCreateWorkspaceModal = () => {
    setShowCreateModal(true);
    setShowWorkspaceDropdown(false); // Close the dropdown when opening modal
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceTitle.trim()) {
      toast.error("Workspace title is required");
      return;
    }

    if (!user) {
      toast.error("You need to be logged in to create a workspace");
      return;
    }

    setIsLoading(true);

    try {
      // Generate a unique workspace ID with a timestamp
      const workspaceId = `ws-${Date.now()}`;

      // Create workspace object
      const newWorkspace = {
        id: workspaceId,
        title: workspaceTitle,
        description: workspaceDescription,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        members: [user.id], // Initially, only the creator is a member
      };

      // Send POST request to JSON server
      const response = await fetch("http://localhost:3001/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWorkspace),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const createdWorkspace = await response.json();

      // Show success notification
      toast.success("Workspace created successfully!");

      // Reset form
      setWorkspaceTitle("");
      setWorkspaceDescription("");

      // Close modal
      setShowCreateModal(false);

      // Navigate to project page
      router.push("/project");
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } h-full fixed left-0 top-0 ${
          darkMode
            ? "bg-slate-900/90 border-r border-slate-700/50"
            : "bg-white/90 border-r border-slate-200/50"
        } transition-all duration-300 backdrop-blur-md shadow-lg z-20`}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-opacity-30 mb-4">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0-4.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm9-4.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0 9a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <h1 className="ml-3 text-xl font-bold">TaskFlow</h1>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1 rounded-md ${
              darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
            } ${sidebarCollapsed ? "hidden" : ""}`}
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        </div>

        <div className="px-3 py-4">
          <nav>
            <ul className="space-y-2">
              <li>
                <a
                  onClick={() => router.push("/dashboard")}
                  className={`flex items-center px-3 py-3 rounded-lg ${
                    darkMode
                      ? "bg-slate-800 text-blue-300"
                      : "bg-blue-50 text-blue-600"
                  } font-medium`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  {!sidebarCollapsed && <span className="ml-3">Home</span>}
                </a>
              </li>

              <li>
                <button
                  onClick={() => router.push("/works")}
                  className={`flex items-center px-3 py-3 rounded-lg w-full text-left ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-300"
                      : "hover:bg-slate-100 text-slate-700"
                  } transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                  {!sidebarCollapsed && <span className="ml-3">My Works</span>}
                </button>
              </li>

              <li className="relative">
                <button
                  onClick={() =>
                    setShowWorkspaceDropdown(!showWorkspaceDropdown)
                  }
                  className={`flex items-center justify-between w-full px-3 py-3 rounded-lg ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-300"
                      : "hover:bg-slate-100 text-slate-700"
                  } transition-colors`}
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    {!sidebarCollapsed && (
                      <span className="ml-3">Activities</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`w-4 h-4 transition-transform ${
                        showWorkspaceDropdown ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  )}
                </button>

                {showWorkspaceDropdown && !sidebarCollapsed && (
                  <div
                    className={`mt-1 py-1 rounded-md shadow-lg ${
                      darkMode
                        ? "bg-slate-800 border border-slate-700"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <ul>
                      {/* <li>
                        <button
                          onClick={navigateToWorkspace}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            darkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Create Workspace
                        </button>
                      </li> */}
                      <li>
                        <button
                          onClick={navigateToProject}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                            />
                          </svg>
                          Project
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={navigateToTask}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Task
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={navigateToMembers}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                            />
                          </svg>
                          Users
                        </button>
                      </li>
                    </ul>
                  </div>
                )}

                {/* For collapsed sidebar, show tooltip on hover */}
                {sidebarCollapsed && showWorkspaceDropdown && (
                  <div className="absolute left-full ml-2 top-0 z-30 bg-white dark:bg-slate-800 shadow-md rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                    <ul>
                      <li>
                        <button
                          onClick={openCreateWorkspaceModal}
                          className={`flex items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          } whitespace-nowrap`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                          Create Workspace
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={navigateToProject}
                          className={`flex items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          } whitespace-nowrap`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                            />
                          </svg>
                          Project
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={navigateToTask}
                          className={`flex items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          } whitespace-nowrap`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Task
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={navigateToUsers}
                          className={`flex items-center px-4 py-2 text-sm ${
                            darkMode
                              ? "hover:bg-slate-700 text-slate-300"
                              : "hover:bg-slate-100 text-slate-700"
                          } whitespace-nowrap`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                            />
                          </svg>
                          Users
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4">
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Logout
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center w-full p-2 rounded-lg ${
                darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } transition-colors`}
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
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Workspace</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className={`block mb-2 text-sm font-medium ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Workspace Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500"
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace title"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="description"
                  className={`block mb-2 text-sm font-medium ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white focus:ring-blue-500"
                      : "bg-white border-slate-300 text-slate-900 focus:ring-blue-500"
                  }`}
                  placeholder="Enter workspace description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
